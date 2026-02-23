import Navbar from "./Navbar";
import ProfileButton from "./ProfileButton";
import SignInButton from "./SignInButton";

import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
  isAdmin?: boolean;
  isSignedIn?: boolean;
};

export default function Layout({ children, isAdmin = false, isSignedIn = false }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100 p-5">
      <header className="flex items-center justify-between gap-4">
        <Navbar isAdmin={isAdmin} />
        {isSignedIn ? (
          <ProfileButton name="Jane Doe" avatarSrc="/small-Maria.png" />
        ) : (
          <SignInButton />
        )}
      </header>
      <main className="pt-4">{children}</main>
    </div>
  );
}
