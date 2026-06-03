"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import type { Profile } from "@/api/profile";

import { getUserProfileById } from "@/api/profile";
import { isAbortError } from "@/api/request";

type ProfileInformationViewerPopupProps = {
  open: boolean;
  userId: string | null;
  onClose: () => void;
  onApprove?: (profile: Profile) => void;
  onDeny?: (profile: Profile) => void;
  avatarSrc?: string;
};

const DEFAULT_AVATAR_SRC = "/AdminProfilePngs/big-maria.png";

function fullName(profile: Profile): string {
  return profile.name || [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "User";
}

function fieldValue(value: string): string {
  return value.trim() || "Not provided";
}

export default function ProfileInformationViewerPopup({
  open,
  userId,
  onClose,
  onApprove,
  onDeny,
  avatarSrc = DEFAULT_AVATAR_SRC,
}: ProfileInformationViewerPopupProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const profileName = useMemo(() => (profile ? fullName(profile) : "Account"), [profile]);
  const showActions = Boolean(onApprove || onDeny);

  useEffect(() => {
    if (!open || !userId) {
      setProfile(null);
      setError(null);
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setProfile(null);
    setError(null);
    setIsLoading(true);

    getUserProfileById(userId, controller.signal)
      .then((nextProfile) => {
        setProfile(nextProfile);
      })
      .catch((fetchError: unknown) => {
        if (isAbortError(fetchError)) return;
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load user profile.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [open, userId]);

  useEffect(() => {
    if (!open) return undefined;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#eef4f2]/70 px-4 py-6"
      role="presentation"
    >
      <section
        className="relative flex min-h-[486px] w-full max-w-[588px] flex-col rounded-[8px] border border-[#d9d9d9] bg-white px-8 py-9 shadow-[0_18px_45px_rgba(0,0,0,0.08)] sm:px-12 sm:py-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-information-title"
      >
        <button
          type="button"
          aria-label="Close account information"
          className="absolute right-10 top-9 flex h-8 w-8 items-center justify-center rounded-full text-[24px] leading-none text-black hover:bg-[#f2f2f2]"
          onClick={onClose}
        >
          x
        </button>

        <h2
          id="profile-information-title"
          className="m-0 font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[24px] font-semibold leading-[1.2] text-black"
        >
          Account Information
        </h2>

        <div className="mt-9 grid flex-1 gap-8 sm:grid-cols-[132px_1fr] sm:gap-[34px]">
          <aside className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <Image
              src={avatarSrc}
              alt=""
              width={100}
              height={100}
              className="h-[100px] w-[100px] rounded-full object-cover"
              unoptimized
            />
            <h3 className="mt-6 w-full break-words font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[24px] font-normal leading-[1.2] text-black">
              {isLoading ? "Loading..." : profileName}
            </h3>
            <p className="mt-1 w-full break-words text-[15px] leading-5 text-[#43a9ad]">
              {profile ? fieldValue(profile.role) : ""}
            </p>
          </aside>

          <div className="min-w-0">
            <h3 className="m-0 font-['Proxima_Nova','Helvetica_Neue',Arial,sans-serif] text-[18px] font-semibold leading-6 text-[#8f8f8f]">
              Personal Information
            </h3>

            {isLoading ? (
              <p className="mt-7 text-[14px] text-[#6c6c6c]">Loading account information...</p>
            ) : error ? (
              <div className="mt-7">
                <p className="text-[14px] leading-6 text-[#b53737]">{error}</p>
                <button
                  type="button"
                  className="mt-4 rounded-[6px] border border-[#3b9a9a] px-4 py-2 text-[15px] font-semibold text-[#3b9a9a]"
                  onClick={() => {
                    if (!userId) return;
                    setError(null);
                    setIsLoading(true);
                    void getUserProfileById(userId)
                      .then((nextProfile) => setProfile(nextProfile))
                      .catch((fetchError: unknown) => {
                        setError(
                          fetchError instanceof Error
                            ? fetchError.message
                            : "Unable to load user profile.",
                        );
                      })
                      .finally(() => setIsLoading(false));
                  }}
                >
                  Retry
                </button>
              </div>
            ) : profile ? (
              <dl className="mt-5 grid gap-[14px]">
                <div>
                  <dt className="text-[13px] leading-5 text-[#484848]">Name</dt>
                  <dd className="mt-1 break-words text-[15px] leading-5 text-[#8f8f8f]">
                    {fieldValue(fullName(profile))}
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] leading-5 text-[#484848]">Email</dt>
                  <dd className="mt-1 break-words text-[15px] leading-5 text-[#8f8f8f]">
                    {fieldValue(profile.email)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] leading-5 text-[#484848]">Phone Number</dt>
                  <dd className="mt-1 break-words text-[15px] leading-5 text-[#8f8f8f]">
                    {fieldValue(profile.phone)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] leading-5 text-[#484848]">Role</dt>
                  <dd className="mt-1 break-words text-[15px] leading-5 text-[#8f8f8f]">
                    {fieldValue(profile.role)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-7 text-[14px] text-[#6c6c6c]">No account information available.</p>
            )}
          </div>
        </div>

        {showActions && profile ? (
          <div className="mt-8 flex flex-wrap justify-end gap-2">
            {onApprove ? (
              <button
                type="button"
                className="min-h-9 rounded-[6px] border border-[#1db85c] px-4 text-[16px] font-semibold text-[#1db85c] hover:bg-[#f2fff7]"
                onClick={() => onApprove(profile)}
              >
                Approve
              </button>
            ) : null}
            {onDeny ? (
              <button
                type="button"
                className="min-h-9 rounded-[6px] bg-[#b53737] px-4 text-[16px] font-semibold text-white hover:bg-[#9e2f2f]"
                onClick={() => onDeny(profile)}
              >
                Deny
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
