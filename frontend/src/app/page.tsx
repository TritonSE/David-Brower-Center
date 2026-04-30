import RelationshipViewCard from "./components/RelationshipViewCard";

import type { RelatedNpo } from "./components/RelationshipViewCard";

const graphRelatedOrganizations: RelatedNpo[] = [
  {
    id: "related-1",
    name: "42 Inc.",
    sizeLabel: "Mid Sized",
    budgetLabel: "100k",
    locationLabel: "Berkeley, CA",
    tags: ["Technology", "Environmental"],
    logoUrl: "https://www.figma.com/api/mcp/asset/861edd85-fd7b-4c4d-9083-1fe0707442aa",
  },
  {
    id: "related-2",
    name: "American Institute of Architects",
    sizeLabel: "Mid Sized",
    budgetLabel: "100k",
    locationLabel: "Berkeley, CA",
    tags: ["Transportation", "Social/Government"],
    logoUrl: "https://www.figma.com/api/mcp/asset/4536375a-46ca-49dc-b179-cde1b912280c",
  },
  {
    id: "related-3",
    name: "Berkeley Executive Coaching Institute",
    sizeLabel: "Mid Sized",
    budgetLabel: "100k",
    locationLabel: "Berkeley, CA",
    tags: ["Social/Government", "Environmental"],
    logoUrl: "https://www.figma.com/api/mcp/asset/abf36315-21d6-49ab-84f8-06501ef3c53a",
  },
];

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-92px)] rounded-3xl border border-slate-300 bg-slate-50 p-4 md:p-6">
      <div className="mx-auto w-full max-w-[500px]">
        <RelationshipViewCard organizations={graphRelatedOrganizations} />
      </div>
    </div>
  );
}
