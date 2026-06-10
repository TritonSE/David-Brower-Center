"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { type AuthContextValue, useAuth } from "../contexts/AuthContext";

import Navbar from "./Navbar";
import ProfileButton from "./ProfileButton";
import SignInButton from "./SignInButton";

import type { ReactNode } from "react";

import { getProfile } from "@/api/profile";

type LayoutProps = {
  children: ReactNode;
};

const DEFAULT_AVATAR_SRC = "/small-Maria.png";

export default function Layout({ children }: LayoutProps) {
  const auth: AuthContextValue = useAuth();
  const { isSignedIn, user, signOut } = auth;
  const pathname = usePathname();
  const router = useRouter();
  const showHeader = pathname !== "/signIn";

  const [avatarSrc, setAvatarSrc] = useState(DEFAULT_AVATAR_SRC);
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setAvatarSrc(DEFAULT_AVATAR_SRC);
      setProfileName(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    getProfile(controller.signal)
      .then((profile) => {
        if (cancelled) return;
        setAvatarSrc(profile.profilePicture || DEFAULT_AVATAR_SRC);
        setProfileName(profile.name || null);
      })
      .catch(() => {
        // Keep the default avatar/name if the profile can't be loaded.
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isSignedIn]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/signIn");
  };

  const displayName = profileName ?? user?.email ?? "User";

  return (
    <div className="min-h-screen bg-slate-100 p-5">
      {showHeader && (
        <header className="flex items-center justify-between gap-4">
          <Navbar isSignedIn={isSignedIn} />
          {isSignedIn ? (
            <ProfileButton
              name={displayName}
              avatarSrc={avatarSrc}
              onSignOut={() => void handleSignOut()}
            />
          ) : (
            <SignInButton />
          )}
        </header>
      )}
      <main className="pt-4">{children}</main>
    </div>
  );
}
