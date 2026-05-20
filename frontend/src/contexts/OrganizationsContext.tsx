"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { OrganizationListItem, OrganizationRelationship } from "@/api/organization";
import type { APIResult } from "@/api/request";
import type { ReactNode } from "react";

import { getOrganizationRelationships, getOrganizations } from "@/api/organization";

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

export type OrganizationsContextValue = {
  organizations: OrganizationListItem[];
  relationships: OrganizationRelationship[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const OrganizationsContext = createContext<OrganizationsContextValue | null>(null);

export function OrganizationsProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<OrganizationListItem[]>([]);
  const [relationships, setRelationships] = useState<OrganizationRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);

    try {
      const [orgResult, relResult]: [
        APIResult<OrganizationListItem[]>,
        APIResult<OrganizationRelationship[]>,
      ] = await Promise.all([
        getOrganizations(abortController.signal),
        getOrganizationRelationships(abortController.signal),
      ]);
      if (requestIdRef.current !== requestId) return;

      if (!orgResult.success) {
        setOrganizations([]);
        setRelationships([]);
        setError(orgResult.error || "Unable to load organizations.");
        return;
      }

      if (!relResult.success) {
        setOrganizations([]);
        setRelationships([]);
        setError(relResult.error || "Unable to load organization relationships.");
        return;
      }

      setOrganizations(orgResult.data);
      setRelationships(relResult.data);
    } catch (caughtError) {
      if (isAbortError(caughtError) || requestIdRef.current !== requestId) return;
      setOrganizations([]);
      setRelationships([]);
      setError(getErrorMessage(caughtError, "Unable to load organizations."));
    } finally {
      if (abortRef.current === abortController && requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load]);

  const value = useMemo<OrganizationsContextValue>(
    () => ({
      organizations,
      relationships,
      isLoading,
      error,
      refetch: load,
    }),
    [organizations, relationships, error, isLoading, load],
  );

  return <OrganizationsContext.Provider value={value}>{children}</OrganizationsContext.Provider>;
}

export function useOrganizations(): OrganizationsContextValue {
  const ctx = useContext(OrganizationsContext);
  if (!ctx) {
    throw new Error("useOrganizations must be used within an OrganizationsProvider.");
  }
  return ctx;
}
