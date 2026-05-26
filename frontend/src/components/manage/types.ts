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
  color: string;
  visibility: TagVisibility;
  assignedOrganizations: AssignedOrganization[];
};

export type ManageTagDraft = Pick<ManageTag, "color" | "name" | "visibility">;

export function toManageTag(tag: TagRecord): ManageTag {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    visibility: tag.visibility,
    assignedOrganizations: [],
  };
}
