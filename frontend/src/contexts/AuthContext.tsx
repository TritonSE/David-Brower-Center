"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { type AuthUser, supabase } from "../services/supabase";

import type { ReactNode } from "react";

import { getProfile, type Profile } from "@/api/profile";
import { isAbortError } from "@/api/request";

export type AuthContextValue = {
  user: AuthUser | null;
  isSignedIn: boolean;
  isLoading: boolean;
  /** The signed-in user's app profile, fetched once per session and shared app-wide. */
  profile: Profile | null;
  /** True until the session check and the profile fetch (if signed in) have both settled. */
  isProfileLoading: boolean;
  profileError: string | null;
  /** Replace the cached profile, e.g. with the response from a profile update. */
  setProfile: (profile: Profile) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  // Which signed-in user `profile`/`profileError` belong to, so a new sign-in
  // reads as loading instead of briefly showing the previous user's data.
  const [loadedProfileKey, setLoadedProfileKey] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Supabase hands out a new user object on every token refresh, so key the
  // profile fetch on a stable identifier rather than the object itself.
  const profileKey = user ? (user.email ?? "") : null;

  useEffect(() => {
    if (profileKey === null) return;

    const controller = new AbortController();

    getProfile(controller.signal)
      .then((nextProfile) => {
        setProfile(nextProfile);
        setProfileError(null);
        setLoadedProfileKey(profileKey);
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        setProfile(null);
        setProfileError(error instanceof Error ? error.message : "Failed to load profile.");
        setLoadedProfileKey(profileKey);
      });

    return () => controller.abort();
  }, [profileKey]);

  const hasCurrentProfile = profileKey !== null && loadedProfileKey === profileKey;
  const isProfileLoading = isLoading || (profileKey !== null && !hasCurrentProfile);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isSignedIn: !!user,
      isLoading,
      profile: hasCurrentProfile ? profile : null,
      isProfileLoading,
      profileError: hasCurrentProfile ? profileError : null,
      setProfile,
      signOut: handleSignOut,
    }),
    [user, isLoading, profile, profileError, hasCurrentProfile, isProfileLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
