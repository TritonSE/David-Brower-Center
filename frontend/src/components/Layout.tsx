"use client";

import { usePathname, useRouter } from "next/navigation";

import { type AuthContextValue, useAuth } from "../contexts/AuthContext";

import Navbar from "./Navbar";
import ProfileButton from "./ProfileButton";
import SignInButton from "./SignInButton";

import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

const DEFAULT_AVATAR_SRC = "/AdminProfilePngs/default-avatar.svg";

export default function Layout({ children }: LayoutProps) {
  const auth: AuthContextValue = useAuth();
  const { isSignedIn, user, profile, signOut } = auth;
  const pathname = usePathname();
  const router = useRouter();
  const showHeader = pathname !== "/signIn";

  const avatarSrc = profile?.profilePicture || DEFAULT_AVATAR_SRC;

  const handleSignOut = async () => {
    await signOut();
    router.push("/signIn");
  };

  const displayName = profile?.name || user?.email || "User";

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
