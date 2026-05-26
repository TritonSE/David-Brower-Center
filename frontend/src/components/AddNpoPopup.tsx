"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

import styles from "./AddNpoPopup.module.css";

import { post } from "@/api/request";
import { supabase } from "@/services/supabase";

export type AddNpoValues = {
  title: string;
  websiteUrl: string;
  description: string;
  mission: string;
  mediaFiles: File[];
  location: string;
  npoSize: string;
  budgetSize: string;
  focusArea: string;
  focusAreas: FocusAreaValue[];
  relationships: AddNpoRelationshipValue[];
};

export type FocusAreaValue = {
  id?: string;
  name: string;
  isCustom: boolean;
};

type RelationshipTier = "Primary" | "Secondary" | "Tertiary";

export type AddNpoRelationshipTier = "PRIMARY" | "SECONDARY" | "TERTIARY";

export type AddNpoRelationshipValue = {
  npo2Id: string;
  relationshipTier: AddNpoRelationshipTier;
};

type RelationshipOption = {
  id: string;
  initials: string;
  name: string;
  focus: string;
};

type SelectedRelationship = RelationshipOption & {
  tier: RelationshipTier;
};

type MediaPreview = {
  id: string;
  file: File;
  fileName: string;
  previewUrl: string;
  width: number;
  height: number;
};

export type AddNpoInitialValues = {
  title?: string;
  description?: string;
  location?: string;
  npoSize?: string;
  budgetSize?: string;
  focusAreas?: FocusAreaValue[];
};

type AddNpoPopupProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (name: string) => void;
  onNext?: (values: AddNpoValues) => void | Promise<void>;
  onSaveDraft?: (values: AddNpoValues) => void;
  relationshipOptions?: RelationshipOption[];
  mode?: "create" | "edit";
  initialValues?: AddNpoInitialValues;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  initialTitle?: string;
  initialDescription?: string;
};

const RELATIONSHIP_TIERS: Array<{
  tier: RelationshipTier;
  helper: string;
}> = [
  { tier: "Primary", helper: "eg. Direct Partnership" },
  { tier: "Secondary", helper: "eg. Shared Parent Company" },
  { tier: "Tertiary", helper: "eg. Similar Focus Area" },
];

const RELATIONSHIP_OPTIONS: RelationshipOption[] = [
  {
    id: "community-food-alliance",
    initials: "CF",
    name: "Community Food Alliance",
    focus: "Food",
  },
  {
    id: "east-bay-housing-coalition",
    initials: "EB",
    name: "East Bay Housing Coalition",
    focus: "Housing",
  },
  {
    id: "bay-area-youth-climate",
    initials: "BA",
    name: "Bay Area Youth Climate",
    focus: "Youth",
  },
];

const RELATIONSHIP_TIER_VALUES: Record<RelationshipTier, AddNpoRelationshipTier> = {
  Primary: "PRIMARY",
  Secondary: "SECONDARY",
  Tertiary: "TERTIARY",
};

function parseCsvFirstRow(csvText: string): Record<string, string> {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  const [headers, values] = rows.filter((entry) => entry.some(Boolean));
  if (!headers || !values) return {};

  return headers.reduce<Record<string, string>>((result, header, index) => {
    const key = header.trim().toLowerCase();
    const value = values[index]?.trim() ?? "";
    if (key && value) result[key] = value;
    return result;
  }, {});
}

function findCsvValue(row: Record<string, string>, keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (value) return value;
  }
  return null;
}

function isValidWebsiteUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidBudgetSize(value: string): boolean {
  const normalized = value.trim().replaceAll(",", "");
  return /^\$?\d+(?:\.\d{1,2})?\s*[kmb]?$/i.test(normalized);
}

function focusAreasToInputValue(values: FocusAreaValue[] | undefined): string {
  return values?.map((value) => value.name).join(", ") ?? "";
}

function inputValueToFocusAreas(value: string): FocusAreaValue[] {
  return value
    .split(/[;,]/)
    .map((area) => area.trim())
    .filter(Boolean)
    .map((name) => ({ name, isCustom: true }));
}

function getProjectId(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${slug || "npo"}-${Date.now().toString(36)}`;
}

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);

  const session = data.session as ({ access_token?: unknown } & Record<string, unknown>) | null;
  const accessToken = session?.access_token;
  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw new Error("You must be signed in as an admin to add an NPO.");
  }

  return accessToken;
}

async function publishNpo(values: AddNpoValues): Promise<void> {
  const token = await getAccessToken();

  await post(
    "/api/organizations",
    {
      name: values.title.trim(),
      projectId: getProjectId(values.title),
      website: values.websiteUrl.trim(),
      sizeCategory: values.npoSize.trim(),
    },
    {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 6L6 18M6 6L18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5L9.5 17L19 7"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3L13.4 8.6L19 10L13.4 11.4L12 17L10.6 11.4L5 10L10.6 8.6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M19 15L19.8 17.2L22 18L19.8 18.8L19 21L18.2 18.8L16 18L18.2 17.2L19 15Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 10.8V17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 7.2V7.4" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={open ? styles.chevronOpen : undefined}
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20H20M13.5 6.5L17.5 10.5M6.5 17.5L8 13L16.9 4.1C17.5 3.5 18.5 3.5 19.1 4.1L19.9 4.9C20.5 5.5 20.5 6.5 19.9 7.1L11 16L6.5 17.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getStepCircleClass(currentStep: 1 | 2 | 3, step: 1 | 2 | 3): string {
  if (currentStep > step) return `${styles.stepCircle} ${styles.stepCircleComplete}`;
  if (currentStep === step) return `${styles.stepCircle} ${styles.stepCircleCurrent}`;
  return styles.stepCircle;
}

function Stepper({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className={styles.stepper} aria-label="Add NPO progress">
      <div className={styles.step}>
        <span className={getStepCircleClass(currentStep, 1)}>
          {currentStep > 1 ? <CheckIcon /> : "1"}
        </span>
        <span className={styles.stepTextActive}>NPO Profile</span>
      </div>
      <span className={styles.stepLine} />
      <div className={styles.step}>
        <span className={getStepCircleClass(currentStep, 2)}>
          {currentStep > 2 ? <CheckIcon /> : "2"}
        </span>
        <span className={styles.stepTextActive}>Relationships</span>
      </div>
      <span className={styles.stepLine} />
      <div className={styles.step}>
        <span className={getStepCircleClass(currentStep, 3)}>3</span>
        <span className={styles.stepTextMuted}>Review</span>
      </div>
    </div>
  );
}

export default function AddNpoPopup({
  open,
  onClose,
  onSuccess,
  onNext,
  relationshipOptions = RELATIONSHIP_OPTIONS,
  mode = "create",
  initialValues,
  isSubmitting: externalIsSubmitting = false,
  errorMessage = null,
  initialTitle: legacyInitialTitle = "",
  initialDescription: legacyInitialDescription = "",
}: AddNpoPopupProps) {
  const isEditMode = mode === "edit";
  const initialTitle = initialValues?.title ?? legacyInitialTitle;
  const initialDescription = initialValues?.description ?? legacyInitialDescription;
  const initialLocation = initialValues?.location ?? "";
  const initialNpoSize = initialValues?.npoSize ?? "";
  const initialBudgetSize = initialValues?.budgetSize ?? "";
  const initialFocusArea = focusAreasToInputValue(initialValues?.focusAreas);
  const titleId = useId();
  const urlId = useId();
  const descId = useId();
  const missionId = useId();
  const locationId = useId();
  const sizeId = useId();
  const budgetId = useId();
  const focusId = useId();
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const mediaPreviewsRef = useRef<MediaPreview[]>([]);
  const [title, setTitle] = useState(initialTitle);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState(initialDescription);
  const [mission, setMission] = useState("");
  const [location, setLocation] = useState(initialLocation);
  const [npoSize, setNpoSize] = useState(initialNpoSize);
  const [budgetSize, setBudgetSize] = useState(initialBudgetSize);
  const [focusArea, setFocusArea] = useState(initialFocusArea);
  const [uploadedCsvName, setUploadedCsvName] = useState("");
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);
  const [fieldErrors, setFieldErrors] = useState({
    title: "",
    websiteUrl: "",
    description: "",
    mission: "",
    location: "",
    npoSize: "",
    budgetSize: "",
    focusArea: "",
  });
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const [selectedTier, setSelectedTier] = useState<RelationshipTier>("Primary");
  const [relationshipQuery, setRelationshipQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [relationships, setRelationships] = useState<SelectedRelationship[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initialTitle);
    setWebsiteUrl("");
    setDescription(initialDescription);
    setMission("");
    setLocation(initialLocation);
    setNpoSize(initialNpoSize);
    setBudgetSize(initialBudgetSize);
    setFocusArea(initialFocusArea);
    setUploadedCsvName("");
    setFieldErrors({
      title: "",
      websiteUrl: "",
      description: "",
      mission: "",
      location: "",
      npoSize: "",
      budgetSize: "",
      focusArea: "",
    });
    setMediaPreviews((current) => {
      current.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
      return [];
    });
    setCurrentStep(1);
    setIsAddingRelationship(false);
    setSelectedTier("Primary");
    setRelationshipQuery("");
    setIsDropdownOpen(false);
    setRelationships([]);
    setSubmitError("");
    setIsSubmitting(false);
  }, [
    open,
    initialTitle,
    initialDescription,
    initialLocation,
    initialNpoSize,
    initialBudgetSize,
    initialFocusArea,
  ]);

  useEffect(() => {
    mediaPreviewsRef.current = mediaPreviews;
  }, [mediaPreviews]);

  useEffect(
    () => () => {
      mediaPreviewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
    },
    [],
  );

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleOverlayMouseDown = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleComplete = async () => {
    if (isSubmitting || externalIsSubmitting) return;
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const values: AddNpoValues = {
        title,
        websiteUrl,
        description,
        mission,
        mediaFiles: mediaPreviews.map((preview) => preview.file),
        location,
        npoSize,
        budgetSize,
        focusArea,
        focusAreas: inputValueToFocusAreas(focusArea),
        relationships: relationships.map((relationship) => ({
          npo2Id: relationship.id,
          relationshipTier: RELATIONSHIP_TIER_VALUES[relationship.tier],
        })),
      };

      if (onNext) {
        await onNext(values);
      } else {
        await publishNpo(values);
      }

      onSuccess?.(title);
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to add this NPO.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCsvFile = async (file: File | undefined) => {
    if (!file) return;
    const csvText = await file.text();
    const firstRow = parseCsvFirstRow(csvText);

    setTitle(
      findCsvValue(firstRow, ["title", "name", "npo name", "organization", "organization name"]) ??
        title,
    );
    setWebsiteUrl(
      findCsvValue(firstRow, ["website url", "website", "url", "site", "homepage"]) ?? websiteUrl,
    );
    setDescription(
      findCsvValue(firstRow, ["description", "about", "summary", "overview"]) ?? description,
    );
    setMission(findCsvValue(firstRow, ["mission", "mission statement"]) ?? mission);
    setLocation(findCsvValue(firstRow, ["location", "city"]) ?? location);
    setNpoSize(findCsvValue(firstRow, ["npo size", "size"]) ?? npoSize);
    setBudgetSize(findCsvValue(firstRow, ["budget size", "budget"]) ?? budgetSize);
    setFocusArea(findCsvValue(firstRow, ["focus area", "focus", "tags"]) ?? focusArea);
    setUploadedCsvName(file.name);
  };

  const goToRelationships = () => {
    const trimmedWebsiteUrl = websiteUrl.trim();
    const trimmedBudgetSize = budgetSize.trim();
    const nextErrors = {
      title: title.trim() ? "" : "NPO title is required.",
      websiteUrl: !trimmedWebsiteUrl
        ? "Website URL is required."
        : isValidWebsiteUrl(trimmedWebsiteUrl)
          ? ""
          : "Enter a valid http or https URL.",
      description: description.trim() ? "" : "Description is required.",
      mission: mission.trim() ? "" : "Mission statement is required.",
      location: location.trim() ? "" : "Location is required.",
      npoSize: npoSize.trim() ? "" : "NPO size is required.",
      budgetSize: !trimmedBudgetSize
        ? "Budget size is required."
        : isValidBudgetSize(trimmedBudgetSize)
          ? ""
          : "Enter a valid budget amount, like $100k or $100,000.",
      focusArea: focusArea.trim() ? "" : "Focus area is required.",
    };

    setFieldErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setCurrentStep(2);
  };

  const getImageDimensions = async (previewUrl: string) =>
    await new Promise<{ width: number; height: number }>((resolve) => {
      const image = document.createElement("img");
      image.onload = () => {
        resolve({
          width: image.naturalWidth || 640,
          height: image.naturalHeight || 360,
        });
      };
      image.onerror = () => resolve({ width: 640, height: 360 });
      image.src = previewUrl;
    });

  const handleMediaFiles = async (files: FileList | null) => {
    if (!files) return;

    const previews = await Promise.all(
      Array.from(files)
        .filter((file) => file.type.startsWith("image/"))
        .map(async (file) => {
          const previewUrl = URL.createObjectURL(file);
          const dimensions = await getImageDimensions(previewUrl);
          return {
            id: crypto.randomUUID(),
            file,
            fileName: file.name,
            previewUrl,
            ...dimensions,
          };
        }),
    );

    setMediaPreviews((current) => [...current, ...previews]);
  };

  const removeMediaPreview = (id: string) => {
    setMediaPreviews((current) => {
      const target = current.find((preview) => preview.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((preview) => preview.id !== id);
    });
  };

  const filteredRelationshipOptions = relationshipOptions.filter((option) => {
    const isSelected = relationships.some((relationship) => relationship.id === option.id);
    const query = relationshipQuery.trim().toLowerCase();
    if (isSelected) return false;
    if (!query) return true;
    return (
      option.name.toLowerCase().includes(query) ||
      option.focus.toLowerCase().includes(query) ||
      option.initials.toLowerCase().includes(query)
    );
  });

  const addRelationship = (option: RelationshipOption) => {
    setRelationships((current) => [...current, { ...option, tier: selectedTier }]);
    setRelationshipQuery("");
    setIsDropdownOpen(false);
  };

  const removeRelationship = (id: string) => {
    setRelationships((current) => current.filter((relationship) => relationship.id !== id));
  };

  const reviewTitle = title.trim();
  const reviewWebsiteUrl = websiteUrl.trim();
  const reviewDescription = description.trim();
  const reviewMission = mission.trim();
  const reviewLocation = location.trim();
  const reviewNpoSize = npoSize.trim();
  const reviewBudgetSize = budgetSize.trim();
  const reviewFocusAreas = focusArea.trim()
    ? focusArea
        .split(/[;,]/)
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
  const reviewRelationships = relationships;

  if (!open) return null;

  return (
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <section
        className={styles.wrapper}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-npo-title"
      >
        <header className={styles.header}>
          <div>
            <h2 id="add-npo-title" className={styles.title}>
              {isEditMode
                ? "Edit NPO"
                : currentStep === 1
                  ? "NPO Profile"
                  : currentStep === 2
                    ? "Add Relationship"
                    : "Review"}
            </h2>
            <Stepper currentStep={currentStep} />
          </div>

          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>

        {currentStep === 1 ? (
          <>
            <div className={styles.body}>
              <div className={styles.autofill}>
                <div>
                  <div className={styles.autofillTitle}>
                    <SparkleIcon />
                    <span>Autofill (Optional)</span>
                  </div>
                  <p>Upload a CSV file to automatically fill nonprofit information.</p>
                </div>
                <button
                  type="button"
                  className={styles.uploadButton}
                  onClick={() => csvInputRef.current?.click()}
                >
                  Upload File
                </button>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className={styles.hiddenFileInput}
                  onChange={(event) => {
                    void handleCsvFile(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
              </div>
              {uploadedCsvName ? (
                <p className={styles.uploadedFileName}>Uploaded {uploadedCsvName}</p>
              ) : null}

              <div className={styles.form}>
                <label className={styles.field} htmlFor={titleId}>
                  <span>
                    Title<span className={styles.required}>*</span>
                  </span>
                  <input
                    id={titleId}
                    type="text"
                    placeholder="NPO Name..."
                    value={title}
                    aria-invalid={fieldErrors.title ? "true" : "false"}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      if (fieldErrors.title) {
                        setFieldErrors((current) => ({ ...current, title: "" }));
                      }
                    }}
                  />
                  {fieldErrors.title ? (
                    <span className={styles.fieldError}>{fieldErrors.title}</span>
                  ) : null}
                </label>

                <label className={styles.field} htmlFor={urlId}>
                  <span>
                    Website URL<span className={styles.required}>*</span>
                  </span>
                  <input
                    id={urlId}
                    type="url"
                    placeholder="http://example.com"
                    value={websiteUrl}
                    aria-invalid={fieldErrors.websiteUrl ? "true" : "false"}
                    onChange={(event) => {
                      setWebsiteUrl(event.target.value);
                      if (fieldErrors.websiteUrl) {
                        setFieldErrors((current) => ({ ...current, websiteUrl: "" }));
                      }
                    }}
                  />
                  {fieldErrors.websiteUrl ? (
                    <span className={styles.fieldError}>{fieldErrors.websiteUrl}</span>
                  ) : null}
                </label>

                <label className={styles.field} htmlFor={descId}>
                  <span>
                    Description<span className={styles.required}>*</span>
                  </span>
                  <textarea
                    id={descId}
                    placeholder="NPO Description..."
                    value={description}
                    aria-invalid={fieldErrors.description ? "true" : "false"}
                    onChange={(event) => {
                      setDescription(event.target.value);
                      if (fieldErrors.description) {
                        setFieldErrors((current) => ({ ...current, description: "" }));
                      }
                    }}
                  />
                  {fieldErrors.description ? (
                    <span className={styles.fieldError}>{fieldErrors.description}</span>
                  ) : null}
                </label>

                <label className={styles.field} htmlFor={missionId}>
                  <span>
                    Mission Statement<span className={styles.required}>*</span>
                  </span>
                  <textarea
                    id={missionId}
                    className={styles.missionInput}
                    placeholder="NPO Description..."
                    value={mission}
                    aria-invalid={fieldErrors.mission ? "true" : "false"}
                    onChange={(event) => {
                      setMission(event.target.value);
                      if (fieldErrors.mission) {
                        setFieldErrors((current) => ({ ...current, mission: "" }));
                      }
                    }}
                  />
                  {fieldErrors.mission ? (
                    <span className={styles.fieldError}>{fieldErrors.mission}</span>
                  ) : null}
                </label>

                <div className={styles.field}>
                  <span>Media</span>
                  <div
                    className={styles.mediaDropzone}
                    onDragOver={(event) => {
                      event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      void handleMediaFiles(event.dataTransfer.files);
                    }}
                  >
                    <button
                      type="button"
                      className={styles.mediaDropzoneButton}
                      onClick={() => mediaInputRef.current?.click()}
                    >
                      Drop your images here, or browse
                      <small>Supports JPG, JPEG2000, PNG</small>
                    </button>
                    <input
                      ref={mediaInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      multiple
                      className={styles.hiddenFileInput}
                      onChange={(event) => {
                        void handleMediaFiles(event.target.files);
                        event.currentTarget.value = "";
                      }}
                    />
                  </div>
                  {mediaPreviews.length > 0 ? (
                    <div className={styles.mediaUploadGrid}>
                      {mediaPreviews.map((preview) => (
                        <div key={preview.id} className={styles.uploadedMediaCard}>
                          <Image
                            src={preview.previewUrl}
                            alt={preview.fileName}
                            width={preview.width}
                            height={preview.height}
                            unoptimized
                          />
                          <button
                            type="button"
                            className={styles.mediaRemoveButton}
                            aria-label={`Remove ${preview.fileName}`}
                            onClick={() => removeMediaPreview(preview.id)}
                          >
                            <CloseIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className={styles.fieldRow}>
                  <label className={styles.field} htmlFor={locationId}>
                    <span>
                      Location<span className={styles.required}>*</span>
                    </span>
                    <select
                      id={locationId}
                      value={location}
                      aria-invalid={fieldErrors.location ? "true" : "false"}
                      onChange={(event) => {
                        setLocation(event.target.value);
                        if (fieldErrors.location) {
                          setFieldErrors((current) => ({ ...current, location: "" }));
                        }
                      }}
                    >
                      <option value="">Select Location</option>
                      <option value="Berkeley">Berkeley</option>
                      <option value="Oakland">Oakland</option>
                      <option value="Richmond">Richmond</option>
                    </select>
                    {fieldErrors.location ? (
                      <span className={styles.fieldError}>{fieldErrors.location}</span>
                    ) : null}
                  </label>

                  <label className={styles.field} htmlFor={sizeId}>
                    <span>
                      NPO Size<span className={styles.required}>*</span>
                    </span>
                    <select
                      id={sizeId}
                      value={npoSize}
                      aria-invalid={fieldErrors.npoSize ? "true" : "false"}
                      onChange={(event) => {
                        setNpoSize(event.target.value);
                        if (fieldErrors.npoSize) {
                          setFieldErrors((current) => ({ ...current, npoSize: "" }));
                        }
                      }}
                    >
                      <option value="">Select NPO Size</option>
                      <option value="Small">Small</option>
                      <option value="Medium">Medium</option>
                      <option value="Large">Large</option>
                    </select>
                    {fieldErrors.npoSize ? (
                      <span className={styles.fieldError}>{fieldErrors.npoSize}</span>
                    ) : null}
                  </label>

                  <label className={styles.field} htmlFor={budgetId}>
                    <span>
                      Budget Size<span className={styles.required}>*</span>
                    </span>
                    <input
                      id={budgetId}
                      type="text"
                      placeholder="$0.00"
                      value={budgetSize}
                      aria-invalid={fieldErrors.budgetSize ? "true" : "false"}
                      onChange={(event) => {
                        setBudgetSize(event.target.value);
                        if (fieldErrors.budgetSize) {
                          setFieldErrors((current) => ({ ...current, budgetSize: "" }));
                        }
                      }}
                    />
                    {fieldErrors.budgetSize ? (
                      <span className={styles.fieldError}>{fieldErrors.budgetSize}</span>
                    ) : null}
                  </label>
                </div>

                <label className={styles.field} htmlFor={focusId}>
                  <span>
                    Focus Area<span className={styles.required}>*</span>
                  </span>
                  <input
                    id={focusId}
                    type="text"
                    placeholder="Search Focus Area (ex: Water Conservation)"
                    value={focusArea}
                    aria-invalid={fieldErrors.focusArea ? "true" : "false"}
                    onChange={(event) => {
                      setFocusArea(event.target.value);
                      if (fieldErrors.focusArea) {
                        setFieldErrors((current) => ({ ...current, focusArea: "" }));
                      }
                    }}
                  />
                  {fieldErrors.focusArea ? (
                    <span className={styles.fieldError}>{fieldErrors.focusArea}</span>
                  ) : null}
                </label>
              </div>
            </div>

            <footer className={styles.footer}>
              <button type="button" className={styles.nextButton} onClick={goToRelationships}>
                Next
              </button>
            </footer>
          </>
        ) : currentStep === 2 ? (
          <>
            <div className={`${styles.body} ${styles.relationshipBody}`}>
              <div className={styles.relationshipNotice}>
                <span>
                  You&apos;re adding relationships from <strong>{title.trim()}</strong>
                  &apos;s perspective.
                </span>
                <InfoIcon />
              </div>

              {isAddingRelationship ? (
                <div className={styles.relationshipForm}>
                  <div>
                    <p className={styles.relationshipLabel}>Step 1: Select Relationship Tier</p>
                    <div className={styles.tierGrid}>
                      {RELATIONSHIP_TIERS.map((item) => (
                        <button
                          key={item.tier}
                          type="button"
                          className={`${styles.tierCard} ${
                            selectedTier === item.tier ? styles.tierCardSelected : ""
                          }`}
                          onClick={() => setSelectedTier(item.tier)}
                        >
                          <span>{item.tier}</span>
                          <small>{item.helper}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={styles.relationshipLabel} htmlFor="relationship-search">
                      Step 2: Select the organization {title.trim()} has a connection to
                    </label>
                    <div className={styles.comboBox}>
                      <input
                        id="relationship-search"
                        type="text"
                        placeholder="Select NPOs"
                        value={relationshipQuery}
                        onFocus={() => setIsDropdownOpen(true)}
                        onChange={(event) => {
                          setRelationshipQuery(event.target.value);
                          setIsDropdownOpen(true);
                        }}
                      />
                      <button
                        type="button"
                        className={styles.comboToggle}
                        aria-label={isDropdownOpen ? "Close options" : "Open options"}
                        onClick={() => setIsDropdownOpen((current) => !current)}
                      >
                        <ChevronIcon open={isDropdownOpen} />
                      </button>
                    </div>

                    {isDropdownOpen ? (
                      <div className={styles.optionList}>
                        {filteredRelationshipOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            className={styles.optionRow}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => addRelationship(option)}
                          >
                            <span className={styles.avatar}>{option.initials}</span>
                            <span>
                              <strong>{option.name}</strong>
                              <small>{option.focus}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {relationships.length > 0 ? (
                    <div className={styles.selectedList}>
                      {relationships.map((relationship) => (
                        <div key={relationship.id} className={styles.selectedRelationship}>
                          <span className={styles.avatar}>{relationship.initials}</span>
                          <span className={styles.selectedCopy}>
                            <strong>{relationship.name}</strong>
                            <small>{relationship.focus}</small>
                          </span>
                          <button
                            type="button"
                            className={styles.removeButton}
                            aria-label={`Remove ${relationship.name}`}
                            onClick={() => removeRelationship(relationship.id)}
                          >
                            <CloseIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className={styles.relationshipList}>
                  {relationships.map((relationship) => (
                    <div key={relationship.id} className={styles.reviewRelationship}>
                      <span className={styles.avatar}>{relationship.initials}</span>
                      <span className={styles.selectedCopy}>
                        <strong>{relationship.name}</strong>
                        <small>{relationship.focus}</small>
                      </span>
                      <span className={styles.tierPill}>{relationship.tier}</span>
                      <button
                        type="button"
                        className={styles.editButton}
                        aria-label={`Edit ${relationship.name}`}
                        onClick={() => {
                          setSelectedTier(relationship.tier);
                          setIsAddingRelationship(true);
                        }}
                      >
                        <EditIcon />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className={styles.addRelationshipCard}
                    onClick={() => setIsAddingRelationship(true)}
                  >
                    <span className={styles.plusCircle}>
                      <PlusIcon />
                    </span>
                    <span>Add NPO Relationship</span>
                  </button>
                </div>
              )}
            </div>

            <footer className={`${styles.footer} ${styles.relationshipFooter}`}>
              <button type="button" className={styles.backButton} onClick={() => setCurrentStep(1)}>
                Back
              </button>
              <button
                type="button"
                className={styles.nextButton}
                onClick={() => {
                  if (isAddingRelationship && relationships.length > 0) {
                    setIsAddingRelationship(false);
                    setIsDropdownOpen(false);
                    return;
                  }
                  setCurrentStep(3);
                }}
              >
                {relationships.length > 0
                  ? isAddingRelationship
                    ? "Save & Continue"
                    : "Review"
                  : "Skip"}
              </button>
            </footer>
          </>
        ) : (
          <>
            <div className={`${styles.body} ${styles.reviewBody}`}>
              <section className={styles.reviewSection} aria-label="NPO profile review">
                <h3>NPO Profile</h3>

                <div className={styles.reviewBlock}>
                  <p className={styles.reviewLabel}>
                    Title
                    <EditIcon />
                  </p>
                  <p>{reviewTitle}</p>
                </div>

                <div className={styles.reviewBlock}>
                  <p className={styles.reviewLabel}>
                    Website URL
                    <EditIcon />
                  </p>
                  <p>{reviewWebsiteUrl}</p>
                </div>

                <div className={styles.reviewBlock}>
                  <p className={styles.reviewLabel}>
                    Description
                    <EditIcon />
                  </p>
                  <p>{reviewDescription}</p>
                </div>

                <div className={styles.reviewBlock}>
                  <p className={styles.reviewLabel}>
                    Mission Statement
                    <EditIcon />
                  </p>
                  <p>{reviewMission}</p>
                </div>

                <div className={styles.reviewBlock}>
                  <p className={styles.reviewLabel}>
                    Media
                    <EditIcon />
                  </p>
                  <div className={styles.mediaPreviewRow} aria-label="Media previews">
                    {mediaPreviews.length > 0 ? (
                      mediaPreviews.map((preview) => (
                        <Image
                          key={preview.id}
                          src={preview.previewUrl}
                          alt={preview.fileName}
                          width={preview.width}
                          height={preview.height}
                          className={styles.mediaPreviewImage}
                          unoptimized
                        />
                      ))
                    ) : (
                      <>
                        <span className={`${styles.mediaPreview} ${styles.mediaPreviewPlant}`} />
                        <span className={`${styles.mediaPreview} ${styles.mediaPreviewFlower}`} />
                      </>
                    )}
                  </div>
                </div>

                <div className={styles.reviewBlock}>
                  <p className={styles.reviewLabel}>
                    Location
                    <EditIcon />
                  </p>
                  <p>{reviewLocation}</p>
                </div>

                <div className={styles.reviewBlock}>
                  <p className={styles.reviewLabel}>
                    NPO Size
                    <EditIcon />
                  </p>
                  <p>{reviewNpoSize}</p>
                </div>

                <div className={styles.reviewBlock}>
                  <p className={styles.reviewLabel}>
                    Budget Size
                    <EditIcon />
                  </p>
                  <p>{reviewBudgetSize}</p>
                </div>

                <div className={styles.reviewBlock}>
                  <p className={styles.reviewLabel}>
                    Focus Area
                    <EditIcon />
                  </p>
                  <div className={styles.focusPillRow}>
                    {reviewFocusAreas.map((area) => (
                      <span key={area}>{area}</span>
                    ))}
                  </div>
                </div>

                <section className={styles.reviewRelationshipSection}>
                  <h3>Relationships</h3>
                  {reviewRelationships.length > 0 ? (
                    <>
                      <h4>Primary</h4>
                      <div className={styles.reviewRelationships}>
                        {reviewRelationships.map((relationship) => (
                          <div key={relationship.id} className={styles.reviewRelationshipCompact}>
                            <span className={styles.avatar}>{relationship.initials}</span>
                            <span className={styles.selectedCopy}>
                              <strong>{relationship.name}</strong>
                              <small>{relationship.focus}</small>
                            </span>
                            <button
                              type="button"
                              className={styles.removeButton}
                              aria-label={`Remove ${relationship.name}`}
                              onClick={() => removeRelationship(relationship.id)}
                            >
                              <CloseIcon />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className={styles.reviewEmptyText}>No relationships selected.</p>
                  )}
                </section>
              </section>
            </div>

            <footer className={`${styles.footer} ${styles.relationshipFooter}`}>
              <button type="button" className={styles.backButton} onClick={() => setCurrentStep(2)}>
                Back
              </button>
              {submitError ? <p className={styles.submitError}>{submitError}</p> : null}
              {errorMessage ? <p className={styles.submitError}>{errorMessage}</p> : null}
              <button
                type="button"
                className={styles.nextButton}
                disabled={isSubmitting || externalIsSubmitting}
                onClick={() => void handleComplete()}
              >
                {isSubmitting || externalIsSubmitting
                  ? isEditMode
                    ? "Saving..."
                    : "Publishing..."
                  : isEditMode
                    ? "Save"
                    : "Review & Publish"}
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
