"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import styles from "./AddNpoPopup.module.css";
import { LOCATION_OPTIONS, NPO_SIZE_OPTIONS, type NpoProfileValues } from "./addNpoShared";

import type { TagMeta } from "@/api/tags";

import { getTagsWithMeta } from "@/api/tags";

type MediaPreview = {
  id: string;
  file: File;
  previewUrl: string;
};

type AddNpoProfileStepProps = {
  values: NpoProfileValues;
  onChange: (values: NpoProfileValues) => void;
  onNext: () => void;
  onSaveDraft?: () => void;
};

function parseCsvAutofill(text: string): Partial<NpoProfileValues> {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (lines.length < 2) return {};

  const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
  const row = lines[1].split(",").map((value) => value.trim());

  const getValue = (keys: string[]): string => {
    for (const key of keys) {
      const index = headers.indexOf(key);
      if (index >= 0 && row[index]) return row[index];
    }
    return "";
  };

  return {
    title: getValue(["title", "name", "npo name"]),
    website: getValue(["website", "website url", "url"]),
    description: getValue(["description"]),
    mission: getValue(["mission", "mission statement"]),
    location: getValue(["location"]),
    npoSize: getValue(["npo size", "size", "sizecategory"]),
    budgetSize: getValue(["budget", "budget size"]),
    focusAreaQuery: getValue(["focus area", "focus", "focusarea"]),
  };
}

function createMediaPreviews(files: File[]): MediaPreview[] {
  return files.map((file) => ({
    id: `${file.name}-${file.lastModified}-${file.size}`,
    file,
    previewUrl: URL.createObjectURL(file),
  }));
}

function AutofillIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10.5 2.5L12.8 4.8L7.2 10.4L4.9 10.7L5.2 8.4L10.5 2.5Z"
        stroke="#3B9A9A"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M11.8 1.2L13.5 2.9L12.1 4.3L10.4 2.6L11.8 1.2Z" fill="#3B9A9A" />
      <path d="M3 16.5H17" stroke="#3B9A9A" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2 13.5L4.5 11L6 12.5L3.5 15H2V13.5Z" fill="#3B9A9A" />
    </svg>
  );
}

export default function AddNpoProfileStep({
  values,
  onChange,
  onNext,
  onSaveDraft,
}: AddNpoProfileStepProps) {
  const titleId = useId();
  const websiteId = useId();
  const descId = useId();
  const missionId = useId();
  const locationId = useId();
  const npoSizeId = useId();
  const budgetId = useId();
  const focusAreaId = useId();

  const autofillInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaFilesRef = useRef<MediaPreview[]>([]);

  const [mediaFiles, setMediaFiles] = useState<MediaPreview[]>(() =>
    createMediaPreviews(values.mediaFiles),
  );
  const [titleError, setTitleError] = useState<string | null>(null);
  const [focusAreaTags, setFocusAreaTags] = useState<TagMeta[]>([]);
  const [isFocusDropdownOpen, setIsFocusDropdownOpen] = useState(false);

  useEffect(() => {
    mediaFilesRef.current = mediaFiles;
  }, [mediaFiles]);

  useEffect(
    () => () => {
      mediaFilesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void getTagsWithMeta(controller.signal)
      .then(setFocusAreaTags)
      .catch(() => setFocusAreaTags([]));
    return () => controller.abort();
  }, []);

  const filteredFocusAreas = useMemo(() => {
    const query = values.focusAreaQuery.trim().toLowerCase();
    const selectedIds = new Set(values.focusAreas.map((focusArea) => focusArea.id));
    const available = focusAreaTags.filter((tag) => !selectedIds.has(tag.id));

    if (!query) return available.slice(0, 8);
    return available.filter((tag) => tag.name.toLowerCase().includes(query)).slice(0, 8);
  }, [focusAreaTags, values.focusAreaQuery, values.focusAreas]);

  const updateValues = (patch: Partial<NpoProfileValues>) => {
    onChange({ ...values, ...patch });
  };

  const syncMediaFiles = (nextMedia: MediaPreview[]) => {
    setMediaFiles(nextMedia);
    updateValues({ mediaFiles: nextMedia.map((item) => item.file) });
  };

  const handlePickFiles = () => fileInputRef.current?.click();

  const handlePickAutofill = () => autofillInputRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    syncMediaFiles([...mediaFiles, ...next]);
  };

  const handleAutofillFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const parsed = parseCsvAutofill(reader.result);
      const focusAreaNames = parsed.focusAreaQuery
        ? parsed.focusAreaQuery
            .split(/[|,]/)
            .map((name) => name.trim())
            .filter(Boolean)
        : [];

      const matchedFocusAreas = focusAreaNames
        .map((name) => focusAreaTags.find((tag) => tag.name.toLowerCase() === name.toLowerCase()))
        .filter((tag): tag is TagMeta => tag !== undefined)
        .map((tag) => ({ id: tag.id, name: tag.name }));

      updateValues({
        ...parsed,
        focusAreaQuery: "",
        focusAreas: matchedFocusAreas,
      });
    };
    reader.readAsText(file);
  };

  const handleRemoveFile = (id: string) => {
    setMediaFiles((previous) => {
      const target = previous.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const next = previous.filter((item) => item.id !== id);
      updateValues({ mediaFiles: next.map((item) => item.file) });
      return next;
    });
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    handleFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleSelectFocusArea = (tag: TagMeta) => {
    if (values.focusAreas.some((focusArea) => focusArea.id === tag.id)) return;

    updateValues({
      focusAreaQuery: "",
      focusAreas: [...values.focusAreas, { id: tag.id, name: tag.name }],
    });
    setIsFocusDropdownOpen(false);
  };

  const handleRemoveFocusArea = (tagId: string) => {
    updateValues({
      focusAreas: values.focusAreas.filter((focusArea) => focusArea.id !== tagId),
    });
  };

  const handleNext = () => {
    if (values.title.trim().length === 0) {
      setTitleError("Title is required.");
      return;
    }
    setTitleError(null);
    onNext();
  };

  return (
    <>
      <div className={styles.autofillCard}>
        <div className={styles.autofillContent}>
          <AutofillIcon />
          <div className={styles.autofillText}>
            <span className={styles.autofillTitle}>Autofill (Optional)</span>
            <span className={styles.autofillDescription}>
              Upload a CSV file to automatically fill nonprofit information.
            </span>
          </div>
        </div>
        <button type="button" className={styles.uploadFileButton} onClick={handlePickAutofill}>
          Upload File
        </button>
        <input
          ref={autofillInputRef}
          type="file"
          accept=".csv,text/csv"
          className={styles.hiddenFileInput}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleAutofillFile(file);
            event.currentTarget.value = "";
          }}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.caption} htmlFor={titleId}>
          Title<span className={styles.asterisk}>*</span>
        </label>
        <input
          id={titleId}
          className={styles.input}
          placeholder="NPO Name..."
          value={values.title}
          onChange={(event) => updateValues({ title: event.target.value })}
        />
        {titleError ? <p className={styles.errorText}>{titleError}</p> : null}
      </div>

      <div className={styles.field}>
        <label className={styles.caption} htmlFor={websiteId}>
          Website URL
        </label>
        <input
          id={websiteId}
          className={styles.input}
          placeholder="http://example.com"
          value={values.website}
          onChange={(event) => updateValues({ website: event.target.value })}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.caption} htmlFor={descId}>
          Description
        </label>
        <textarea
          id={descId}
          className={styles.textarea}
          placeholder="NPO Description..."
          value={values.description}
          onChange={(event) => updateValues({ description: event.target.value })}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.caption} htmlFor={missionId}>
          Mission Statement
        </label>
        <textarea
          id={missionId}
          className={`${styles.textarea} ${styles.textareaSm}`}
          placeholder="NPO Description..."
          value={values.mission}
          onChange={(event) => updateValues({ mission: event.target.value })}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.caption}>Media</span>
        <div
          className={styles.dropzone}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handlePickFiles}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handlePickFiles();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className={styles.dropzoneText}>
            <span className={styles.dropzoneMain}>
              Drop your images here, or <span className={styles.browseButton}>browse</span>
            </span>
            <span className={styles.dropzoneSub}>Supports JPG, JPEG2000, PNG</span>
          </div>
        </div>

        {mediaFiles.length > 0 ? (
          <div className={styles.mediaGrid}>
            {mediaFiles.map((item) => (
              <div key={item.id} className={styles.mediaCard}>
                <img src={item.previewUrl} alt={item.file.name} className={styles.mediaImage} />
                <button
                  type="button"
                  className={styles.mediaDeleteButton}
                  aria-label={`Remove ${item.file.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemoveFile(item.id);
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M4 7H20M10 11V17M14 11V17M5 7L6 19C6 19.5304 6.21071 20.0391 6.58579 20.4142C6.96086 20.7893 7.46957 21 8 21H16C16.5304 21 17.0391 20.7893 17.4142 20.4142C17.7893 20.0391 18 19.5304 18 19L19 7M9 7V4C9 3.73478 9.10536 3.48043 9.29289 3.29289C9.48043 3.10536 9.73478 3 10 3H14C14.2652 3 14.5196 3.10536 14.7071 3.29289C14.8946 3.48043 15 3.73478 15 4V7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jp2"
          multiple
          className={styles.hiddenFileInput}
          onChange={(event) => {
            handleFiles(event.target.files);
            event.currentTarget.value = "";
          }}
        />
      </div>

      <div className={styles.fieldRow}>
        <div>
          <label className={styles.caption} htmlFor={locationId}>
            Location
          </label>
          <select
            id={locationId}
            className={styles.select}
            value={values.location}
            onChange={(event) => updateValues({ location: event.target.value })}
          >
            <option value="">Select Location</option>
            {LOCATION_OPTIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={styles.caption} htmlFor={npoSizeId}>
            NPO Size
          </label>
          <select
            id={npoSizeId}
            className={styles.select}
            value={values.npoSize}
            onChange={(event) => updateValues({ npoSize: event.target.value })}
          >
            <option value="">Select NPO Size</option>
            {NPO_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={styles.caption} htmlFor={budgetId}>
            Budget Size
          </label>
          <input
            id={budgetId}
            className={styles.input}
            placeholder="$0.00"
            value={values.budgetSize}
            onChange={(event) => updateValues({ budgetSize: event.target.value })}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.caption} htmlFor={focusAreaId}>
          Focus Area
        </label>
        <div className={styles.focusAreaWrapper}>
          <input
            id={focusAreaId}
            className={styles.input}
            placeholder="Search Focus Area (ex: Water Conservation)"
            value={values.focusAreaQuery}
            onChange={(event) => {
              updateValues({ focusAreaQuery: event.target.value });
              setIsFocusDropdownOpen(true);
            }}
            onFocus={() => setIsFocusDropdownOpen(true)}
          />
          {isFocusDropdownOpen && filteredFocusAreas.length > 0 ? (
            <div className={styles.focusAreaDropdown}>
              {filteredFocusAreas.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={styles.focusAreaOption}
                  onClick={() => handleSelectFocusArea(tag)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {values.focusAreas.length > 0 ? (
          <div className={styles.selectedFocusAreas}>
            {values.focusAreas.map((focusArea) => (
              <span key={focusArea.id} className={styles.selectedFocusAreaTag}>
                {focusArea.name}
                <button
                  type="button"
                  className={styles.selectedFocusAreaRemove}
                  aria-label={`Remove ${focusArea.name}`}
                  onClick={() => handleRemoveFocusArea(focusArea.id)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <footer className={styles.footer}>
        {onSaveDraft ? (
          <button type="button" className={styles.textButton} onClick={onSaveDraft}>
            Save Draft
          </button>
        ) : (
          <span />
        )}
        <button type="button" className={styles.primaryButton} onClick={handleNext}>
          Next
        </button>
      </footer>
    </>
  );
}
