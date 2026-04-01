import fs from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

import { PrismaClient } from "../src/generated/prisma/index.js";

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

async function main(): Promise<void> {
  // Seed tags first
  await prisma.tag.createMany({
    data: tags,
    skipDuplicates: true, // Don't error if tags already exist
  });
  console.info(`Seeded ${tags.length} tags.`);

  // Seed organizations
  const existing = await prisma.organization.findMany({ take: 1 });
  if (existing.length > 0) {
    console.info("Organizations table already has data; skipping seed.");
    return;
  }
  await prisma.organization.createMany({ data: organizations });
  console.info(`Seeded ${organizations.length} organizations.`);
}

void main()
  .then(async () => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
