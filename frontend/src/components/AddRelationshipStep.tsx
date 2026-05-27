"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import styles from "./AddNpoPopup.module.css";
import {
  type DraftRelationship,
  getOrgInitials,
  TIER_OPTIONS,
  tierBadgeClassName,
  tierLabel,
} from "./AddNpoShared";

import type { OrganizationListItem, OrganizationRelationshipTier } from "@/api/organization";

type AddRelationshipStepProps = {
  sourceOrgName: string;
  organizations: OrganizationListItem[];
  relationships: DraftRelationship[];
  onChange: (relationships: DraftRelationship[]) => void;
  onBack: () => void;
  onSkip: () => void;
  onContinue: () => void;
};

type FormState = {
  tier: OrganizationRelationshipTier;
  selectedOrgIds: string[];
};

const DEFAULT_FORM: FormState = {
  tier: "PRIMARY",
  selectedOrgIds: [],
};

const IMG_ADD_RELATIONSHIP = "/icons/manage/ic-add-relationship-circle.svg";
const IMG_RELATIONSHIP_EDIT = "/icons/manage/ic-relationship-edit.svg";

export default function AddRelationshipStep({
  sourceOrgName,
  organizations,
  relationships,
  onChange,
  onBack,
  onSkip,
  onContinue,
}: AddRelationshipStepProps) {
  const [view, setView] = useState<"list" | "form">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const availableOrganizations = useMemo(
    () => organizations.filter((org) => org.name.trim().length > 0),
    [organizations],
  );

  const filteredOrganizations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const excludedIds = new Set(formState.selectedOrgIds);
    return availableOrganizations.filter((org) => {
      if (excludedIds.has(org.id)) return false;
      if (!query) return true;
      return org.name.toLowerCase().includes(query);
    });
  }, [availableOrganizations, formState.selectedOrgIds, searchQuery]);

  const selectedOrganizations = useMemo(
    () =>
      formState.selectedOrgIds
        .map((id) => availableOrganizations.find((org) => org.id === id))
        .filter((org): org is OrganizationListItem => org !== undefined),
    [availableOrganizations, formState.selectedOrgIds],
  );

  const openAddForm = () => {
    setEditingId(null);
    setFormState(DEFAULT_FORM);
    setSearchQuery("");
    setIsDropdownOpen(false);
    setView("form");
  };

  const openEditForm = (relationship: DraftRelationship) => {
    setEditingId(relationship.id);
    setFormState({
      tier: relationship.tier,
      selectedOrgIds: [relationship.partnerOrgId],
    });
    setSearchQuery("");
    setIsDropdownOpen(false);
    setView("form");
  };

  const handleSelectOrg = (org: OrganizationListItem) => {
    setFormState((current) => ({
      ...current,
      selectedOrgIds: current.selectedOrgIds.includes(org.id)
        ? current.selectedOrgIds
        : [...current.selectedOrgIds, org.id],
    }));
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleRemoveSelectedOrg = (orgId: string) => {
    setFormState((current) => ({
      ...current,
      selectedOrgIds: current.selectedOrgIds.filter((id) => id !== orgId),
    }));
  };

  const handleSaveForm = () => {
    if (selectedOrganizations.length === 0) return;

    const nextEntries: DraftRelationship[] = selectedOrganizations.map((org) => ({
      id: editingId ?? crypto.randomUUID(),
      partnerOrgId: org.id,
      partnerName: org.name,
      partnerCategory: org.tags[0]?.name ?? org.focus,
      tier: formState.tier,
    }));

    if (editingId) {
      onChange([
        ...relationships.filter((relationship) => relationship.id !== editingId),
        ...nextEntries,
      ]);
    } else {
      const existingKeys = new Set(
        relationships.map((relationship) => `${relationship.partnerOrgId}:${relationship.tier}`),
      );
      const deduped = nextEntries.filter(
        (entry) => !existingKeys.has(`${entry.partnerOrgId}:${entry.tier}`),
      );
      onChange([...relationships, ...deduped]);
    }

    setView("list");
    setEditingId(null);
    setFormState(DEFAULT_FORM);
  };

  if (view === "form") {
    return (
      <>
        <div className={styles.infoBanner}>
          <span>
            You&apos;re adding relationships from <strong>{sourceOrgName}</strong>&apos;s
            perspective.
          </span>
          <span aria-hidden="true">ⓘ</span>
        </div>

        <p className={styles.sectionLabel}>Step 1: Select Relationship Tier</p>
        <div className={styles.tierGrid}>
          {TIER_OPTIONS.map((option) => (
            <button
              key={option.tier}
              type="button"
              className={`${styles.tierCard} ${
                formState.tier === option.tier ? styles.tierCardSelected : ""
              }`}
              onClick={() => setFormState((current) => ({ ...current, tier: option.tier }))}
            >
              <div className={styles.tierTitle}>{option.label}</div>
              <div className={styles.tierExample}>{option.example}</div>
            </button>
          ))}
        </div>

        <p className={styles.sectionLabel}>
          Step 2: Select the organization {sourceOrgName} has a connection to
        </p>
        <div className={styles.selectWrapper}>
          <input
            className={styles.selectInput}
            placeholder="Select NPOs"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
          />
          {isDropdownOpen && filteredOrganizations.length > 0 ? (
            <div className={styles.dropdown}>
              {filteredOrganizations.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => handleSelectOrg(org)}
                >
                  <span className={styles.orgAvatar}>{getOrgInitials(org.name)}</span>
                  <span className={styles.orgMeta}>
                    <span className={styles.orgName}>{org.name}</span>
                    <span className={styles.orgCategory}>{org.tags[0]?.name ?? org.focus}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {selectedOrganizations.length > 0 ? (
          <div className={styles.selectedList}>
            {selectedOrganizations.map((org) => (
              <div key={org.id} className={styles.selectedCard}>
                <span className={styles.orgAvatar}>{getOrgInitials(org.name)}</span>
                <span className={styles.relationshipCardContent}>
                  <span className={styles.orgName}>{org.name}</span>
                  <span className={styles.orgCategory}>{org.tags[0]?.name ?? org.focus}</span>
                </span>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`Remove ${org.name}`}
                  onClick={() => handleRemoveSelectedOrg(org.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <footer className={styles.footer}>
          <button type="button" className={styles.backButton} onClick={() => setView("list")}>
            Back
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={selectedOrganizations.length === 0}
            onClick={handleSaveForm}
          >
            Save &amp; Continue
          </button>
        </footer>
      </>
    );
  }

  return (
    <>
      <div className={styles.infoBanner}>
        <span>
          You&apos;re adding relationships from <strong>{sourceOrgName}</strong>&apos;s perspective.
        </span>
        <span aria-hidden="true">ⓘ</span>
      </div>

      {relationships.length === 0 ? (
        <button type="button" className={styles.addRelationshipButton} onClick={openAddForm}>
          <span className={styles.addRelationshipIcon} aria-hidden="true">
            <Image src={IMG_ADD_RELATIONSHIP} alt="" width={40} height={40} />
          </span>
          Add NPO Relationship
        </button>
      ) : (
        <>
          <div className={styles.selectedList}>
            {relationships.map((relationship) => (
              <div key={relationship.id} className={styles.relationshipCard}>
                <span className={styles.orgAvatar}>{getOrgInitials(relationship.partnerName)}</span>
                <span className={styles.relationshipCardContent}>
                  <span className={styles.orgName}>{relationship.partnerName}</span>
                  <span className={styles.orgCategory}>{relationship.partnerCategory}</span>
                </span>
                <span className={tierBadgeClassName(relationship.tier, styles)}>
                  {tierLabel(relationship.tier)}
                </span>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`Edit relationship with ${relationship.partnerName}`}
                  onClick={() => openEditForm(relationship)}
                >
                  <Image src={IMG_RELATIONSHIP_EDIT} alt="" width={16} height={17} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" className={styles.addRelationshipButton} onClick={openAddForm}>
            <span className={styles.addRelationshipIcon} aria-hidden="true">
              <Image src={IMG_ADD_RELATIONSHIP} alt="" width={40} height={40} />
            </span>
            Add NPO Relationship
          </button>
        </>
      )}

      <footer className={styles.footer}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          Back
        </button>
        {relationships.length === 0 ? (
          <button type="button" className={styles.primaryButton} onClick={onSkip}>
            Skip
          </button>
        ) : (
          <button type="button" className={styles.primaryButton} onClick={onContinue}>
            Review
          </button>
        )}
      </footer>
    </>
  );
}
