"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import "./ProfileButton.css";

type ProfileButtonProps = {
  name: string;
  avatarSrc: string;
  onSignOut?: () => void;
};

export default function ProfileButton({ name, avatarSrc, onSignOut }: ProfileButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <div
      className={`profile-btn-wrapper ${isOpen ? "profile-btn-dropdown-open" : ""}`}
      ref={wrapperRef}
    >
      <button
        type="button"
        className={`profile-btn ${isOpen ? "profile-btn-open" : ""}`}
        onClick={() => setIsOpen((v) => !v)}
      >
        <Image src={avatarSrc} alt="user" width={32} height={32} className="profile-btn-avatar" />
        <span className="profile-btn-name">{name}</span>
        <span className={`profile-btn-caret ${isOpen ? "profile-btn-caret-up" : ""}`}>▼</span>
      </button>

      {isOpen && (
        <div className="profile-btn-panel">
          <div className="profile-btn-panel-header">
            <Image
              src={avatarSrc}
              alt="user"
              width={32}
              height={32}
              className="profile-btn-panel-avatar"
            />
            <span className="profile-btn-panel-name">{name}</span>
          </div>

          <hr className="profile-btn-divider" />

          <Link href="/profile" className="profile-btn-item" onClick={() => setIsOpen(false)}>
            <Image
              src="/AdminProfilePngs/gg_profile.png"
              className="profile-btn-item-icon"
              alt=""
              width={20}
              height={20}
            />
            View Account
          </Link>

          <Link href="/profile" className="profile-btn-item" onClick={() => setIsOpen(false)}>
            <Image
              src="/material-symbols_manage-accounts-rounded.png"
              className="profile-btn-item-icon"
              alt=""
              width={20}
              height={20}
            />
            Manage NPO
          </Link>

          <button
            type="button"
            className="profile-btn-item"
            onClick={() => {
              setIsOpen(false);
              onSignOut?.();
            }}
          >
            <Image
              src="/material-symbols_logout-rounded.png"
              className="profile-btn-item-icon"
              alt=""
              width={20}
              height={20}
            />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
