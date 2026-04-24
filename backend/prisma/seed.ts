import fs from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client.js";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env");
const envBackendPath = path.join(cwd, ".env.backend");
const loadPath = fs.existsSync(envPath)
  ? envPath
  : fs.existsSync(envBackendPath)
    ? envBackendPath
    : envPath;
dotenv.config({ path: loadPath });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Set it in .env or .env.backend.");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const tags = [
  { name: "Architecture", description: "Architecture and urban design" },
  { name: "Plants", description: "Botany and flora conservation" },
  { name: "Nature", description: "General nature and outdoors" },
  { name: "Education", description: "Educational programs and initiatives" },
  { name: "Indigeneity", description: "Indigenous rights and culture" },
  { name: "Arts", description: "Arts and creative initiatives" },
  { name: "Youth", description: "Youth-led and youth-focused programs" },
  { name: "Food", description: "Food systems, security, and purchasing" },
  { name: "Agriculture", description: "Farming and agricultural practices" },
  { name: "Wildlife Conservation", description: "Protection of wildlife and habitats" },
  { name: "Birds", description: "Avian conservation and observation" },
  { name: "Clean Energy", description: "Renewable energy and grid sustainability" },
  { name: "Marine Mammals", description: "Marine life and ocean conservation" },
  { name: "Technology", description: "Tech-focused solutions and research" },
  { name: "Political Campaign Disclosure", description: "Transparency in politics" },
  { name: "Music", description: "Music and auditory arts" },
  { name: "Media", description: "Media, film, and journalism" },
  { name: "Film", description: "Documentary and film production" },
  { name: "Women's Leadership", description: "Empowering women in leadership roles" },
  { name: "Environmental", description: "General environmental advocacy" },

  // Canonical DBC focus-area tags used to classify grantee organizations.
  { name: "Climate Change Solutions", description: "Climate mitigation and adaptation work" },
  { name: "Community Resilience", description: "Building resilient, thriving communities" },
  { name: "Conservation", description: "Land, habitat, and ecosystem conservation" },
  { name: "Environmental Arts", description: "Art and creative practice for the environment" },
  { name: "Environmental Education", description: "Environmental learning and outreach" },
  { name: "Environmental Justice", description: "Equity and justice in environmental outcomes" },
  {
    name: "Indigenous Communities",
    description: "Support for Indigenous peoples and sovereignty",
  },
  {
    name: "International Initiatives",
    description: "Global and cross-border environmental work",
  },
  { name: "Oceans and Water", description: "Marine, freshwater, and watershed protection" },
  { name: "Pollution and Toxics", description: "Reducing pollution and exposure to toxics" },
  {
    name: "Sustainable Agriculture and Food Systems",
    description: "Regenerative and equitable food and farm systems",
  },
  { name: "Wildlife Protection", description: "Protection of wildlife species and habitats" },
  {
    name: "Women's Environmental Leadership",
    description: "Women leading environmental movements",
  },
  { name: "Youth Empowerment", description: "Youth leadership and engagement" },
];

// Helper to generate a standardized org object to avoid Prisma type errors
const createBerkeleyOrg = (
  name: string,
  mission: string = "An organization based in Berkeley, CA.",
) => ({
  name,
  mission,
  city: "Berkeley",
  state: "California",
  country: "United States",
  latitude: 37.8715,
  longitude: -122.273,
  min_budget: 100_000, // Generic defaults to satisfy your schema
  max_budget: 500_000,
});

const organizations = [
  // Structured Data
  createBerkeleyOrg("AIA East Bay", "Architecture and urban design advocacy."),
  createBerkeleyOrg(
    "Berkeley Executive Coaching Institute",
    "Executive coaching and leadership development.",
  ),
  createBerkeleyOrg(
    "Calflora",
    "Information on California plants for conservation, education, and appreciation.",
  ),
  createBerkeleyOrg("California ICAN", "Grassroots organization focused on indigeneity and arts."),
  createBerkeleyOrg("Center for Ecoliteracy", "Advancing ecological education in K-12 schools."),
  createBerkeleyOrg(
    "Center for Good Food Purchasing",
    "Transforming food purchasing practices for institutions.",
  ),
  createBerkeleyOrg("Earth Island Institute", "Supporting environmental action projects globally."),
  createBerkeleyOrg("Ennova Technologies", "Technology and research organization."),
  createBerkeleyOrg("FarmLink", "Linking independent farmers with land and financing."),
  createBerkeleyOrg(
    "Golden Gate Bird Alliance",
    "Protecting native bird populations and their habitats.",
  ),
  createBerkeleyOrg(
    "GridLab",
    "Providing technical expertise to enhance power grid sustainability.",
  ),
  createBerkeleyOrg(
    "Int'l Marine Mammal Project",
    "Protecting dolphins, whales, and the ocean environment.",
  ),
  createBerkeleyOrg("Just Cities", "Advancing racial and economic justice in urban planning."),
  createBerkeleyOrg(
    "Kitchen Table Advisors",
    "Fueling the economic viability of sustainable small farms.",
  ),
  createBerkeleyOrg("MapLight", "Revealing the influence of money in politics."),
  createBerkeleyOrg("New Energy Nexus", "Supporting clean energy entrepreneurs."),
  createBerkeleyOrg("Other Minds", "Dedicated to the creation and preservation of new music."),
  createBerkeleyOrg(
    "Sacred Land Film Project",
    "Producing media to protect sacred lands and indigenous cultures.",
  ),
  createBerkeleyOrg(
    "SAGE",
    "Revitalizing agricultural systems and connecting urban and rural communities.",
  ),
  createBerkeleyOrg("UCB CCCI", "Climate change research and policy innovation at UC Berkeley."),
  createBerkeleyOrg("UCB CIEE", "Advancing energy-efficient technologies and practices."),
  createBerkeleyOrg("UCB PATH", "Researching intelligent transportation systems."),
  createBerkeleyOrg("UCB SafeTREC", "Researching traffic safety and injury prevention."),
  createBerkeleyOrg(
    "UCB Transportation Sustainability Research Center",
    "Studying sustainable transportation solutions.",
  ),
  createBerkeleyOrg(
    "Women's Earth Alliance",
    "Empowering women's leadership in environmental initiatives.",
  ),

  // Unstructured Data
  createBerkeleyOrg("ALERT: A Locally Empowered Response Team"),
  createBerkeleyOrg("Alter Terra"),
  createBerkeleyOrg("Garden for the Environment"),
  createBerkeleyOrg("Love the Bulb"),
  createBerkeleyOrg("Nature in the City"),
  createBerkeleyOrg("Project Coyote"),
  createBerkeleyOrg("Shark Stewards"),
  createBerkeleyOrg("She Builds Power"),
  createBerkeleyOrg("Ultimate Civics"),
  createBerkeleyOrg("WildFutures"),
  createBerkeleyOrg("Conservation Kids"),
  createBerkeleyOrg("Ecovet Global"),
  createBerkeleyOrg("Friends of Alemany Farm"),
  createBerkeleyOrg("Green Schoolyards America"),
  createBerkeleyOrg("Junior Wildlife Ranger"),
  createBerkeleyOrg("Kelly Creek Protection Project"),
  createBerkeleyOrg("Kids for the Bay"),
  createBerkeleyOrg("Raptors are the Solution"),
  createBerkeleyOrg("Bay Area Wilderness Training"),
  createBerkeleyOrg("California Trade Justice Coalition"),
  createBerkeleyOrg("California Urban Streams Partnership"),
  createBerkeleyOrg("Mississippi Farm to School Network"),
  createBerkeleyOrg("People of the Global Majority, Outdoors, in Nature, and the Environment"),
  createBerkeleyOrg("Planet Earth Arts"),
  createBerkeleyOrg("Richmond Trees"),
  createBerkeleyOrg("Rise St. James Louisiana"),
  createBerkeleyOrg("California Climate & Agriculture Network"),
  createBerkeleyOrg("Castanea Fellowship"),
  createBerkeleyOrg("Cultivate Oregon"),
  createBerkeleyOrg("EnergieRich"),
  createBerkeleyOrg("Food Culture Collective"),
  createBerkeleyOrg("Food Shift"),
  createBerkeleyOrg("Fossil Fuel Non-Proliferation Treaty Initiative"),
  createBerkeleyOrg("Alaska Clean Water Advocacy"),
  createBerkeleyOrg("Armenian Environmental Network"),
  createBerkeleyOrg("Ethical Traveler"),
  createBerkeleyOrg("Fish On"),
  createBerkeleyOrg("Law Students for Climate Accountability"),
  createBerkeleyOrg("Plastic Pollution Coalition"),
  createBerkeleyOrg("Save Our Soils"),
  createBerkeleyOrg("The Wild Oyster Project"),
  createBerkeleyOrg("The Capacity Collaborative"),
  createBerkeleyOrg("EcoVillage Farm Learning Center"),
  createBerkeleyOrg("Living Well Collaborative"),
  createBerkeleyOrg("SIRGE Coalition"),
  createBerkeleyOrg("South Coast Habitat Restoration"),
  createBerkeleyOrg("Tallgrass Institute"),
  createBerkeleyOrg("Transition Earth"),
  createBerkeleyOrg("Viva Sierra Gorda"),
  createBerkeleyOrg("Youth Empowered Action"),
  createBerkeleyOrg("Baikal Watch"),
  createBerkeleyOrg("Borneo Project"),
  createBerkeleyOrg("EcoEquity"),
  createBerkeleyOrg("Eurasian Wildlife and Peoples"),
  createBerkeleyOrg("Friends of Muonde"),
  createBerkeleyOrg("Guias Unidos"),
  createBerkeleyOrg("John Muir Project"),
  createBerkeleyOrg("Public Lands Media"),
  createBerkeleyOrg("Serengeti Watch"),
  createBerkeleyOrg("Stop Fish Bombing USA"),
  createBerkeleyOrg("Wild Heritage"),
];

// Focus-area tags for each grantee organization. Keys must match the `name`
// used in the `organizations` array above (the seed is the source of truth
// for the canonical org name, which sometimes differs from how the org is
// referred to elsewhere, e.g. "PGM ONE" -> "People of the Global Majority...").
const organizationTags: Record<string, string[]> = {
  "ALERT: A Locally Empowered Response Team": [
    "Climate Change Solutions",
    "Environmental Justice",
    "Pollution and Toxics",
  ],
  "Alaska Clean Water Advocacy": ["Conservation", "Oceans and Water", "Pollution and Toxics"],
  "Alter Terra": ["Conservation", "Community Resilience", "Environmental Justice"],
  "Armenian Environmental Network": [
    "Environmental Education",
    "Pollution and Toxics",
    "International Initiatives",
  ],
  "Baikal Watch": ["Environmental Education", "Oceans and Water", "International Initiatives"],
  "Borneo Project": ["Conservation", "Environmental Justice", "International Initiatives"],
  "California ICAN": ["Environmental Arts", "Environmental Education", "Indigenous Communities"],
  "California Trade Justice Coalition": [
    "Climate Change Solutions",
    "Environmental Education",
    "Environmental Justice",
  ],
  "California Climate & Agriculture Network": [
    "Climate Change Solutions",
    "Conservation",
    "Sustainable Agriculture and Food Systems",
  ],
  "California Urban Streams Partnership": [
    "Climate Change Solutions",
    "Conservation",
    "Community Resilience",
    "Environmental Justice",
  ],
  "Castanea Fellowship": [
    "Climate Change Solutions",
    "Environmental Justice",
    "Sustainable Agriculture and Food Systems",
  ],
  "Conservation Kids": ["Conservation", "Environmental Education", "Youth Empowerment"],
  "Cultivate Oregon": [
    "Climate Change Solutions",
    "Environmental Justice",
    "Sustainable Agriculture and Food Systems",
  ],
  EcoEquity: ["Climate Change Solutions", "Environmental Justice", "International Initiatives"],
  "Ecovet Global": ["Conservation", "Wildlife Protection", "Women's Environmental Leadership"],
  "EcoVillage Farm Learning Center": [
    "Environmental Justice",
    "Sustainable Agriculture and Food Systems",
    "Youth Empowerment",
  ],
  EnergieRich: [
    "Climate Change Solutions",
    "Community Resilience",
    "Environmental Justice",
    "International Initiatives",
  ],
  "Ethical Traveler": ["Community Resilience", "International Initiatives", "Wildlife Protection"],
  "Eurasian Wildlife and Peoples": [
    "Environmental Justice",
    "International Initiatives",
    "Wildlife Protection",
  ],
  "Fish On": ["Conservation", "Environmental Justice", "Oceans and Water"],
  "Food Culture Collective": [
    "Climate Change Solutions",
    "Environmental Arts",
    "Environmental Justice",
    "Sustainable Agriculture and Food Systems",
  ],
  "Food Shift": [
    "Climate Change Solutions",
    "Community Resilience",
    "Sustainable Agriculture and Food Systems",
  ],
  "Fossil Fuel Non-Proliferation Treaty Initiative": [
    "Climate Change Solutions",
    "Environmental Justice",
    "International Initiatives",
  ],
  "Friends of Alemany Farm": [
    "Climate Change Solutions",
    "Environmental Education",
    "Sustainable Agriculture and Food Systems",
  ],
  "Friends of Muonde": [
    "Community Resilience",
    "International Initiatives",
    "Sustainable Agriculture and Food Systems",
  ],
  "Garden for the Environment": [
    "Climate Change Solutions",
    "Environmental Education",
    "Sustainable Agriculture and Food Systems",
  ],
  "Green Schoolyards America": [
    "Climate Change Solutions",
    "Community Resilience",
    "Environmental Education",
  ],
  "Guias Unidos": [
    "Conservation",
    "Environmental Education",
    "International Initiatives",
    "Youth Empowerment",
  ],
  "Int'l Marine Mammal Project": [
    "International Initiatives",
    "Oceans and Water",
    "Wildlife Protection",
  ],
  "John Muir Project": ["Climate Change Solutions", "Conservation", "Wildlife Protection"],
  "Junior Wildlife Ranger": ["Environmental Education", "Wildlife Protection", "Youth Empowerment"],
  "Kelly Creek Protection Project": [
    "Conservation",
    "Environmental Education",
    "Wildlife Protection",
  ],
  "Kids for the Bay": ["Environmental Education", "Oceans and Water", "Youth Empowerment"],
  "Law Students for Climate Accountability": [
    "Climate Change Solutions",
    "Environmental Education",
    "Environmental Justice",
  ],
  "Mississippi Farm to School Network": [
    "Community Resilience",
    "Environmental Education",
    "Sustainable Agriculture and Food Systems",
  ],
  "Nature in the City": [
    "Climate Change Solutions",
    "Conservation",
    "Environmental Education",
    "Wildlife Protection",
  ],
  "People of the Global Majority, Outdoors, in Nature, and the Environment": [
    "Community Resilience",
    "Environmental Arts",
    "Environmental Justice",
  ],
  "Planet Earth Arts": ["Community Resilience", "Environmental Arts", "Environmental Justice"],
  "Plastic Pollution Coalition": [
    "Environmental Education",
    "Environmental Justice",
    "Oceans and Water",
    "Pollution and Toxics",
  ],
  "Project Coyote": ["Conservation", "Environmental Education", "Wildlife Protection"],
  "Public Lands Media": ["Conservation", "Environmental Education", "Wildlife Protection"],
  "Raptors are the Solution": [
    "Environmental Education",
    "Pollution and Toxics",
    "Wildlife Protection",
  ],
  "Richmond Trees": ["Community Resilience", "Environmental Education"],
  "Rise St. James Louisiana": [
    "Community Resilience",
    "Environmental Education",
    "Environmental Justice",
    "Pollution and Toxics",
  ],
  "Sacred Land Film Project": [
    "Environmental Education",
    "Environmental Justice",
    "Indigenous Communities",
  ],
  "Save Our Soils": [
    "Oceans and Water",
    "Pollution and Toxics",
    "Sustainable Agriculture and Food Systems",
  ],
  "Serengeti Watch": [
    "Conservation",
    "Indigenous Communities",
    "International Initiatives",
    "Wildlife Protection",
  ],
  "Shark Stewards": ["Conservation", "Oceans and Water", "Wildlife Protection"],
  "She Builds Power": [
    "Environmental Justice",
    "International Initiatives",
    "Oceans and Water",
    "Women's Environmental Leadership",
  ],
  "SIRGE Coalition": ["Community Resilience", "Environmental Justice", "Indigenous Communities"],
  "South Coast Habitat Restoration": ["Conservation", "Oceans and Water", "Wildlife Protection"],
  "Stop Fish Bombing USA": [
    "International Initiatives",
    "Oceans and Water",
    "Sustainable Agriculture and Food Systems",
  ],
  "Tallgrass Institute": [
    "Community Resilience",
    "Environmental Justice",
    "Indigenous Communities",
  ],
  "The Capacity Collaborative": [
    "Climate Change Solutions",
    "Community Resilience",
    "Environmental Justice",
    "Indigenous Communities",
  ],
  "Transition Earth": ["Conservation", "Community Resilience", "International Initiatives"],
  "Ultimate Civics": [
    "Climate Change Solutions",
    "Community Resilience",
    "Environmental Education",
  ],
  "Viva Sierra Gorda": [
    "Climate Change Solutions",
    "Conservation",
    "Community Resilience",
    "International Initiatives",
  ],
  "Wild Heritage": ["Climate Change Solutions", "Conservation", "Indigenous Communities"],
  "The Wild Oyster Project": [
    "Climate Change Solutions",
    "Conservation",
    "Oceans and Water",
    "Wildlife Protection",
  ],
  WildFutures: ["Climate Change Solutions", "Conservation", "Wildlife Protection"],
  "Women's Earth Alliance": [
    "Climate Change Solutions",
    "Environmental Justice",
    "International Initiatives",
    "Women's Environmental Leadership",
  ],
  "Youth Empowered Action": ["Environmental Education", "Youth Empowerment"],
};

async function main(): Promise<void> {
  // `Tag.name` has no unique index, so dedupe by name manually to stay
  // idempotent across re-runs (createMany + skipDuplicates only dedupes on
  // unique constraints, and UUID ids are freshly generated per insert).
  const existingTagNames = new Set(
    (await prisma.tag.findMany({ select: { name: true } })).map((t) => t.name),
  );
  const tagsToInsert = tags.filter((t) => !existingTagNames.has(t.name));
  if (tagsToInsert.length > 0) {
    await prisma.tag.createMany({ data: tagsToInsert });
  }
  console.info(`Seeded ${tagsToInsert.length} new tag(s) (of ${tags.length} definitions).`);

  // Only seed organizations the first time the table is empty.
  const existingOrgs = await prisma.organization.findMany({ take: 1 });
  if (existingOrgs.length === 0) {
    await prisma.organization.createMany({ data: organizations });
    console.info(`Seeded ${organizations.length} organizations.`);
  } else {
    console.info("Organizations table already has data; skipping org seed.");
  }

  // Wire up organization ↔ tag associations. Idempotent via the composite PK
  // on `organization_tags (organizationId, tagId)`.
  const orgNames = Object.keys(organizationTags);
  const tagNames = [...new Set(Object.values(organizationTags).flat())];

  const [dbOrgs, dbTags] = await Promise.all([
    prisma.organization.findMany({
      where: { name: { in: orgNames } },
      select: { id: true, name: true },
    }),
    prisma.tag.findMany({
      where: { name: { in: tagNames } },
      select: { id: true, name: true },
    }),
  ]);

  const orgIdByName = new Map(dbOrgs.map((o) => [o.name, o.id]));
  const tagIdByName = new Map(dbTags.map((t) => [t.name, t.id]));

  const joinRows: { organizationId: string; tagId: string }[] = [];
  const unknownOrgs: string[] = [];
  const unknownTags = new Set<string>();

  for (const [orgName, orgTagNames] of Object.entries(organizationTags)) {
    const orgId = orgIdByName.get(orgName);
    if (!orgId) {
      unknownOrgs.push(orgName);
      continue;
    }
    for (const tagName of orgTagNames) {
      const tagId = tagIdByName.get(tagName);
      if (!tagId) {
        unknownTags.add(tagName);
        continue;
      }
      joinRows.push({ organizationId: orgId, tagId });
    }
  }

  if (unknownOrgs.length > 0) {
    console.warn(
      `Skipping tag wiring for organizations not found in the database: ${unknownOrgs.join(", ")}`,
    );
  }
  if (unknownTags.size > 0) {
    console.warn(`Skipping tags not found in the database: ${[...unknownTags].join(", ")}`);
  }

  if (joinRows.length > 0) {
    const result = await prisma.organizationTag.createMany({
      data: joinRows,
      skipDuplicates: true,
    });
    console.info(
      `Wired ${result.count} new organization↔tag association(s) (of ${joinRows.length} candidates).`,
    );
  } else {
    console.info("No organization↔tag associations to create.");
  }
}

void main()
  .then(async () => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
