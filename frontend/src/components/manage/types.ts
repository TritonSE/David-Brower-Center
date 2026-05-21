import type { TagRecord, TagVisibility } from "@/api/tags";

export type { TagVisibility } from "@/api/tags";

export type AssignedOrganization = {
  id: string;
  name: string;
  website: string | null;
};

export type ManageTag = {
  id: string;
  name: string;
  visibility: TagVisibility;
  organizationCount: number;
  assignedOrganizations: AssignedOrganization[];
};

export function toManageTag(tag: TagRecord): ManageTag {
  return {
    id: tag.id,
    name: tag.name,
    visibility: tag.visibility,
    organizationCount: 0,
    assignedOrganizations: [],
  };
}
