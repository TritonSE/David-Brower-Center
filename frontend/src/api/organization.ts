import { get, handleAPIError } from "./request";

import type { APIResult } from "./request";

const NOT_PROVIDED = "Not provided";

type OrganizationRecord = {
  id: string;
  name: string;
  mission?: string | null;
  city?: string | null;
  state?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type OrganizationsResponse = {
  organizations: OrganizationRecord[];
};

type OrganizationResponse = {
  organization: OrganizationRecord;
};

export type OrganizationListItem = {
  id: string;
  name: string;
  focus: string;
  year: string;
  updatedAt: string;
};

export type OrganizationDetail = {
  id: string;
  name: string;
  focus: string;
  year: string;
  size: string;
  budget: string;
  location: string;
  description: string;
  mission: string;
};

function toFallbackString(value: string | null | undefined): string {
  if (!value) return NOT_PROVIDED;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : NOT_PROVIDED;
}

function toYear(value: string | undefined): string {
  if (!value) return NOT_PROVIDED;
  const year = new Date(value).getUTCFullYear();
  return Number.isNaN(year) ? NOT_PROVIDED : year.toString();
}

function toLocation(record: OrganizationRecord): string {
  const city = toFallbackString(record.city);
  const state = toFallbackString(record.state);
  if (city === NOT_PROVIDED && state === NOT_PROVIDED) {
    return NOT_PROVIDED;
  }
  if (city === NOT_PROVIDED) return state;
  if (state === NOT_PROVIDED) return city;
  return `${city}, ${state}`;
}

function toOrganizationListItem(record: OrganizationRecord): OrganizationListItem {
  return {
    id: record.id,
    name: record.name,
    focus: NOT_PROVIDED,
    year: toYear(record.createdAt),
    updatedAt: toFallbackString(record.updatedAt),
  };
}

function toOrganizationDetail(record: OrganizationRecord): OrganizationDetail {
  return {
    id: record.id,
    name: record.name,
    focus: NOT_PROVIDED,
    year: toYear(record.createdAt),
    size: NOT_PROVIDED,
    budget: NOT_PROVIDED,
    location: toLocation(record),
    description: NOT_PROVIDED,
    mission: toFallbackString(record.mission),
  };
}

export async function getOrganizations(): Promise<APIResult<OrganizationListItem[]>> {
  try {
    const response = await get("/organizations");
    const json = (await response.json()) as OrganizationsResponse;
    return { success: true, data: json.organizations.map(toOrganizationListItem) };
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function getOrganizationById(id: string): Promise<APIResult<OrganizationDetail>> {
  try {
    const response = await get(`/organizations/${encodeURIComponent(id)}`);
    const json = (await response.json()) as OrganizationResponse;
    return { success: true, data: toOrganizationDetail(json.organization) };
  } catch (error) {
    return handleAPIError(error);
  }
}
