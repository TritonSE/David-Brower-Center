"use client";

import Image from "next/image";
import { type ReactNode, useEffect, useMemo } from "react";

import styles from "./AddNpoPopup.module.css";
import {
  type AddNpoStep,
  type DraftRelationship,
  getOrgInitials,
  type NpoProfileValues,
  type SelectedFocusArea,
  TIER_OPTIONS,
} from "./AddNpoShared";

const IMG_EDIT = "/icons/manage/edit.svg";

type ReviewStepProps = {
  profile: NpoProfileValues;
  relationships: DraftRelationship[];
  onBack: () => void;
  onPublish: () => void;
  onEditStep: (step: AddNpoStep) => void;
  onRemoveRelationship: (id: string) => void;
  isPublishing: boolean;
  publishError: string | null;
};

type ReviewFieldProps = {
  label: string;
  onEdit: () => void;
  children: ReactNode;
};

type MediaPreviewItem = {
  id: string;
  url: string;
  name: string;
};

function ReviewTextValue({ value }: { value: string }) {
  if (!value.trim()) return null;
  return <p className={styles.reviewValue}>{value}</p>;
}

function ReviewField({ label, onEdit, children }: ReviewFieldProps) {
  return (
    <div className={styles.reviewField}>
      <div className={styles.reviewLabelRow}>
        <span className={styles.reviewLabel}>{label}</span>
        <button
          type="button"
          className={styles.reviewEditButton}
          aria-label={`Edit ${label}`}
          onClick={onEdit}
        >
          <Image src={IMG_EDIT} alt="" width={16} height={16} />
        </button>
      </div>
      {children}
    </div>
  );
}

export default function ReviewStep({
  profile,
  relationships,
  onBack,
  onPublish,
  onEditStep,
  onRemoveRelationship,
  isPublishing,
  publishError,
}: ReviewStepProps) {
  const mediaPreviews = useMemo((): MediaPreviewItem[] => {
    return profile.mediaFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
  }, [profile.mediaFiles]);

  const focusAreaTags: SelectedFocusArea[] = profile.focusAreas;

  const relationshipsByTier = useMemo(
    () =>
      TIER_OPTIONS.map((option) => ({
        tier: option.tier,
        label: option.label,
        items: relationships.filter((relationship) => relationship.tier === option.tier),
      })).filter((group) => group.items.length > 0),
    [relationships],
  );

  useEffect(
    () => () => {
      mediaPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    },
    [mediaPreviews],
  );

  const editProfile = () => onEditStep("profile");

  return (
    <div className={styles.reviewStepLayout}>
      <div className={styles.reviewScrollBody}>
        <section className={styles.reviewSection}>
          <h3 className={styles.reviewSectionTitle}>NPO Profile</h3>

          <ReviewField label="Title" onEdit={editProfile}>
            <ReviewTextValue value={profile.title} />
          </ReviewField>

          <ReviewField label="Website URL" onEdit={editProfile}>
            <ReviewTextValue value={profile.website} />
          </ReviewField>

          <ReviewField label="Description" onEdit={editProfile}>
            <ReviewTextValue value={profile.description} />
          </ReviewField>

          <ReviewField label="Mission Statement" onEdit={editProfile}>
            <ReviewTextValue value={profile.mission} />
          </ReviewField>

          <ReviewField label="Media" onEdit={editProfile}>
            {mediaPreviews.length > 0 ? (
              <div className={styles.reviewMediaGrid}>
                {mediaPreviews.map((preview) => (
                  <div key={preview.id} className={styles.reviewMediaPreview}>
                    <img src={preview.url} alt={preview.name} />
                  </div>
                ))}
              </div>
            ) : null}
          </ReviewField>

          <ReviewField label="Location" onEdit={editProfile}>
            <ReviewTextValue value={profile.location} />
          </ReviewField>

          <ReviewField label="NPO Size" onEdit={editProfile}>
            <ReviewTextValue value={profile.npoSize} />
          </ReviewField>

          <ReviewField label="Budget Size" onEdit={editProfile}>
            <ReviewTextValue value={profile.budgetSize} />
          </ReviewField>

          <ReviewField label="Focus Area" onEdit={editProfile}>
            {focusAreaTags.length > 0 ? (
              <div className={styles.reviewFocusTags}>
                {focusAreaTags.map((tag) => (
                  <span key={tag.id} className={styles.reviewFocusTag}>
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : null}
          </ReviewField>
        </section>

        <section className={styles.reviewSection}>
          <h3 className={styles.reviewSectionTitle}>Relationships</h3>

          {relationshipsByTier.length === 0 ? (
            <p className={styles.emptyHint}>No relationships added.</p>
          ) : (
            relationshipsByTier.map((group) => (
              <div key={group.tier} className={styles.reviewTierGroup}>
                <h4 className={styles.reviewTierHeading}>{group.label}</h4>
                <div className={styles.reviewRelationshipList}>
                  {group.items.map((relationship) => (
                    <div key={relationship.id} className={styles.reviewRelationshipCard}>
                      <span className={styles.orgAvatar}>
                        {getOrgInitials(relationship.partnerName)}
                      </span>
                      <span className={styles.relationshipCardContent}>
                        <span className={styles.orgName}>{relationship.partnerName}</span>
                        <span className={styles.orgCategory}>{relationship.partnerCategory}</span>
                      </span>
                      <button
                        type="button"
                        className={styles.reviewRemoveButton}
                        aria-label={`Remove relationship with ${relationship.partnerName}`}
                        onClick={() => onRemoveRelationship(relationship.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        {publishError ? <p className={styles.errorText}>{publishError}</p> : null}
      </div>

      <footer className={styles.reviewFooter}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          disabled={isPublishing}
        >
          Back
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onPublish}
          disabled={isPublishing}
        >
          {isPublishing ? "Publishing..." : "Publish"}
        </button>
      </footer>
    </div>
  );
}
