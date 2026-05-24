"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "./ProfileButton.module.css";

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
    <div className={`${styles.wrapper} ${isOpen ? styles.dropdownOpen : ""}`} ref={wrapperRef}>
      <button
        type="button"
        className={`${styles.btn} ${isOpen ? styles.btnOpen : ""}`}
        onClick={() => setIsOpen((v) => !v)}
      >
        <Image src={avatarSrc} alt="user" width={32} height={32} className={styles.avatar} />
        <span className={`${styles.caret} ${isOpen ? styles.caretUp : ""}`}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <Image
              src={avatarSrc}
              alt="user"
              width={32}
              height={32}
              className={styles.panelAvatar}
            />
            <span className={styles.panelName}>{name}</span>
          </div>

          <hr className={styles.divider} />

          <Link href="/profile" className={styles.item} onClick={() => setIsOpen(false)}>
            <Image
              src="/AdminProfilePngs/gg_profile.png"
              className={styles.itemIcon}
              alt=""
              width={20}
              height={20}
            />
            View Account
          </Link>

          <Link href="/profile" className={styles.item} onClick={() => setIsOpen(false)}>
            <Image
              src="/AdminProfilePngs/material-symbols_manage-accounts-rounded.png"
              className={styles.itemIcon}
              alt=""
              width={20}
              height={20}
            />
            Manage NPO
          </Link>

          <button
            type="button"
            className={styles.item}
            onClick={() => {
              setIsOpen(false);
              onSignOut?.();
            }}
          >
            <Image
              src="/AdminProfilePngs/material-symbols_logout-rounded.png"
              className={styles.itemIcon}
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
