"use client";

import { useEffect, useState } from "react";

import styles from "./AddNpoPopup.module.css";
import AddNpoProfileStep from "./AddNpoProfileStep";
import AddNpoProgress from "./AddNpoProgress";
import {
  type AddNpoState,
  type AddNpoStep,
  createEmptyProfile,
  generateProjectId,
} from "./addNpoShared";
import AddRelationshipStep from "./AddRelationshipStep";
import ReviewStep from "./ReviewStep";

import type { OrganizationListItem } from "@/api/organization";

import { createOrganization, createOrganizationRelationships } from "@/api/organization";

type AddNpoPopupProps = {
  open: boolean;
  onClose: () => void;
  organizations: OrganizationListItem[];
  existingOrgId?: string | null;
  initialTitle?: string;
  initialDescription?: string;
  onPublished?: (orgName: string) => void;
  onRefetch?: () => void;
};

const STEP_TITLES: Record<AddNpoStep, string> = {
  profile: "NPO Profile",
  relationships: "Add Relationship",
  review: "Review",
};

export default function AddNpoPopup({
  open,
  onClose,
  organizations,
  existingOrgId = null,
  initialTitle = "",
  initialDescription = "",
  onPublished,
  onRefetch,
}: AddNpoPopupProps) {
  const [currentStep, setCurrentStep] = useState<AddNpoStep>("profile");
  const [addNpoState, setAddNpoState] = useState<AddNpoState>({
    profile: createEmptyProfile(initialTitle, initialDescription),
    relationships: [],
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCurrentStep("profile");
    setAddNpoState({
      profile: createEmptyProfile(initialTitle, initialDescription),
      relationships: [],
    });
    setIsPublishing(false);
    setPublishError(null);
  }, [open, initialTitle, initialDescription]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const sourceOrgName = addNpoState.profile.title.trim() || "this NPO";

  const handleOverlayMouseDown = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handlePublish = async () => {
    if (isPublishing) return;
    setPublishError(null);
    setIsPublishing(true);

    try {
      let npo1Id = existingOrgId;

      if (!npo1Id) {
        const createdOrg = await createOrganization({
          name: addNpoState.profile.title.trim(),
          projectId: generateProjectId(addNpoState.profile.title),
          ...(addNpoState.profile.website.trim()
            ? { website: addNpoState.profile.website.trim() }
            : {}),
          ...(addNpoState.profile.npoSize.trim()
            ? { sizeCategory: addNpoState.profile.npoSize.trim() }
            : {}),
          ...(addNpoState.profile.focusAreas.length > 0
            ? { tagIds: addNpoState.profile.focusAreas.map((focusArea) => focusArea.id) }
            : {}),
        });
        npo1Id = createdOrg.id;
      }

      if (addNpoState.relationships.length > 0 && npo1Id) {
        await createOrganizationRelationships({
          npo1Id,
          relationships: addNpoState.relationships.map((relationship) => ({
            npo2Id: relationship.partnerOrgId,
            relationshipTier: relationship.tier,
          })),
        });
      }

      onRefetch?.();
      onPublished?.(addNpoState.profile.title.trim());
      onClose();
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
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
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
              key={`${String(open)}-${initialTitle}`}
              values={addNpoState.profile}
              onChange={(profile) => setAddNpoState((current) => ({ ...current, profile }))}
              onNext={() => setCurrentStep("relationships")}
              onSaveDraft={onClose}
            />
          ) : null}

          {currentStep === "relationships" ? (
            <AddRelationshipStep
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
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
