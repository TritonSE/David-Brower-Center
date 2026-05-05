"use client";

import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "../contexts/AuthContext";

import Navbar from "./Navbar";
import ProfileButton from "./ProfileButton";
import SignInButton from "./SignInButton";

import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { isSignedIn, user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const showHeader = pathname !== "/sign-in";

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  const displayName = user?.email ?? "User";

  return (
    <div className="min-h-screen bg-slate-100 p-5">
      {showHeader && (
        <header className="flex items-center justify-between gap-4">
          <Navbar isSignedIn={isSignedIn} />
          {isSignedIn ? (
            <ProfileButton
              name={displayName}
              avatarSrc="/small-Maria.png"
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
