"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./AddNpoPopup.module.css";
import AddNpoProfileStep from "./AddNpoProfileStep";
import AddNpoProgress from "./AddNpoProgress";
import {
  type AddNpoState,
  type AddNpoStep,
  createEmptyState,
  existingImagesChanged,
  focusAreasChanged,
  generateProjectId,
} from "./AddNpoShared";
import AddRelationshipStep from "./AddRelationshipStep";
import ReviewStep from "./ReviewStep";

import type { OrganizationListItem } from "@/api/organization";

import {
  createOrganization,
  replaceOrganizationRelationships,
  updateOrganization,
  uploadOrganizationImages,
} from "@/api/organization";

type AddNpoPopupProps = {
  open: boolean;
  onClose: () => void;
  organizations: OrganizationListItem[];
  /** Set when editing an existing organization. */
  existingOrgId?: string | null;
  /** Starting values when editing; must be a stable object while the popup is open. */
  initialState?: AddNpoState | null;
  onPublished?: (message: string) => void;
  onRefetch?: () => void;
};

const STEP_TITLES: Record<AddNpoStep, string> = {
  profile: "NPO Profile",
  relationships: "Add Relationship",
  review: "Review",
};

function toOptionalValue(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default function AddNpoPopup({
  open,
  onClose,
  organizations,
  existingOrgId = null,
  initialState = null,
  onPublished,
  onRefetch,
}: AddNpoPopupProps) {
  const [currentStep, setCurrentStep] = useState<AddNpoStep>("profile");
  const [addNpoState, setAddNpoState] = useState<AddNpoState>(
    () => initialState ?? createEmptyState(),
  );
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  // Id of an organization created by an earlier, partially failed publish in this session.
  // Retrying updates it instead of creating a duplicate.
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);
  // True once anything has been written, so the list is refreshed when the popup closes.
  const hasSavedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setCurrentStep("profile");
    setAddNpoState(initialState ?? createEmptyState());
    setIsPublishing(false);
    setPublishError(null);
    setCreatedOrgId(null);
    hasSavedRef.current = false;
  }, [open, initialState]);

  const handleClose = useCallback(() => {
    // Refresh on close rather than mid-publish: a refetch while open would re-render the
    // list underneath and is not needed until the user is done.
    if (hasSavedRef.current) onRefetch?.();
    onClose();
  }, [onClose, onRefetch]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  if (!open) return null;

  const sourceOrgName = addNpoState.profile.title.trim() || "this NPO";
  const isEditing = existingOrgId !== null;

  const handleOverlayMouseDown = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) handleClose();
  };

  const handlePublish = async () => {
    if (isPublishing) return;
    setPublishError(null);
    setIsPublishing(true);

    const { profile, relationships } = addNpoState;
    const name = profile.title.trim();
    const fields = {
      website: toOptionalValue(profile.website),
      sizeCategory: toOptionalValue(profile.npoSize),
      location: toOptionalValue(profile.location),
      budget: toOptionalValue(profile.budgetSize),
      description: toOptionalValue(profile.description),
      mission: toOptionalValue(profile.mission),
    };
    const tagIds = profile.focusAreas.map((focusArea) => focusArea.id);

    try {
      // 1. Save the profile.
      let organizationId = existingOrgId ?? createdOrgId;
      if (organizationId) {
        // When editing, only send tags/images if they changed so concurrent edits elsewhere
        // (e.g. tag assignments from the Tags tab) are not overwritten. After a partial
        // create, send everything: this session owns the organization's whole state.
        const baseline = initialState?.profile;
        const sendTags = !isEditing || !baseline || focusAreasChanged(baseline, profile);
        const sendImages = !isEditing || !baseline || existingImagesChanged(baseline, profile);
        const result = await updateOrganization(organizationId, {
          name,
          ...fields,
          ...(sendTags ? { tags: tagIds } : {}),
          ...(sendImages ? { images: profile.existingImages } : {}),
        });
        if (!result.success) {
          throw new Error(result.error || "Unable to save organization.");
        }
      } else {
        const result = await createOrganization({
          name,
          projectId: generateProjectId(name),
          ...fields,
          tags: tagIds,
        });
        if (!result.success) {
          throw new Error(result.error || "Unable to create organization.");
        }
        organizationId = result.data.id;
        setCreatedOrgId(organizationId);
      }
      hasSavedRef.current = true;

      // 2. Upload new images. Uploaded files move to existingImages so a retry skips them.
      let failedImageCount = 0;
      if (profile.mediaFiles.length > 0) {
        const outcome = await uploadOrganizationImages(organizationId, profile.mediaFiles);
        const uploadedFiles = new Set(outcome.uploaded.map((item) => item.file));
        setAddNpoState((current) => ({
          ...current,
          profile: {
            ...current.profile,
            existingImages: [
              ...current.profile.existingImages,
              ...outcome.uploaded.map((item) => item.url),
            ],
            mediaFiles: current.profile.mediaFiles.filter((file) => !uploadedFiles.has(file)),
          },
        }));
        failedImageCount = outcome.failed.length;
      }

      // 3. Save relationships. Replacing is idempotent, so retries are safe.
      const hadPriorState = isEditing || createdOrgId !== null;
      if (hadPriorState || relationships.length > 0) {
        const result = await replaceOrganizationRelationships(
          organizationId,
          relationships.map((relationship) => ({
            npo2Id: relationship.partnerOrgId,
            relationshipTier: relationship.tier,
          })),
        );
        if (!result.success) {
          throw new Error(result.error || "Unable to save relationships.");
        }
      }

      if (failedImageCount > 0) {
        throw new Error(
          `${name} was saved, but ${failedImageCount.toString()} image(s) failed to upload. ` +
            "Publish again to retry.",
        );
      }

      onPublished?.(isEditing ? `${name} has been updated` : `${name} has been added`);
      handleClose();
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Unable to publish. Please try again.";
      setPublishError(message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <div
        className={styles.wrapper}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-npo-title"
      >
        <header className={styles.headerRow}>
          <h2 id="add-npo-title" className={styles.title}>
            {STEP_TITLES[currentStep]}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 6L6 18M18 18L6 6"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </header>

        <AddNpoProgress currentStep={currentStep} />

        <div
          className={`${styles.content} ${currentStep === "review" ? styles.contentReview : ""}`}
        >
          {currentStep === "profile" ? (
            <AddNpoProfileStep
              key={existingOrgId ?? "new"}
              values={addNpoState.profile}
              onChange={(profile) => setAddNpoState((current) => ({ ...current, profile }))}
              onNext={() => setCurrentStep("relationships")}
            />
          ) : null}

          {currentStep === "relationships" ? (
            <AddRelationshipStep
              sourceOrgId={existingOrgId ?? createdOrgId}
              sourceOrgName={sourceOrgName}
              organizations={organizations}
              relationships={addNpoState.relationships}
              onChange={(relationships) =>
                setAddNpoState((current) => ({ ...current, relationships }))
              }
              onBack={() => setCurrentStep("profile")}
              onSkip={() => setCurrentStep("review")}
              onContinue={() => setCurrentStep("review")}
            />
          ) : null}

          {currentStep === "review" ? (
            <ReviewStep
              profile={addNpoState.profile}
              relationships={addNpoState.relationships}
              onBack={() => setCurrentStep("relationships")}
              onPublish={() => void handlePublish()}
              onEditStep={setCurrentStep}
              onRemoveRelationship={(id) =>
                setAddNpoState((current) => ({
                  ...current,
                  relationships: current.relationships.filter(
                    (relationship) => relationship.id !== id,
                  ),
                }))
              }
              isPublishing={isPublishing}
              publishError={publishError}
              publishLabel={isEditing ? "Save Changes" : "Publish"}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
