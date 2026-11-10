import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import app from "../src/app";
import { prisma } from "../src/lib/prisma";

import type { NextFunction, Request, Response } from "express";
import type { Response as TestResponse } from "supertest";

// Refuse to run against anything but a local database: these tests truncate tables.
const dbUrl = process.env.DIRECT_URL ?? "";
if (!/@(?:localhost|127\.0\.0\.1)[:/]/.test(dbUrl)) {
  throw new Error(`Refusing to run tests against non-local database: ${dbUrl}`);
}

const ADMIN_TOKEN = "admin-token";
const SUPABASE_URL = "https://test-project.supabase.co";
const publicUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/images/${path}`;

const storage = vi.hoisted(() => ({
  remove: vi.fn(async (_paths: string[]) => ({ data: [], error: null })),
  list: vi.fn(async (_folder: string, _options?: unknown) => ({
    data: [] as Array<{ name: string }>,
    error: null,
  })),
  createSignedUploadUrl: vi.fn(async (path: string) => ({
    data: { signedUrl: `https://test-project.supabase.co/upload/${path}?token=t`, path },
    error: null,
  })),
  getPublicUrl: vi.fn((path: string) => ({
    data: {
      publicUrl: `https://test-project.supabase.co/storage/v1/object/public/images/${path}`,
    },
  })),
}));

vi.mock("../src/lib/supabaseClients", () => ({
  supabaseAdmin: { storage: { from: () => storage } },
  supabaseAuth: {},
}));

// Stand-in for Supabase auth: a fixed bearer token is the admin.
vi.mock("../src/middleware/requireAuth", async () => {
  const { default: createError } = await import("http-errors");
  const isAdmin = (req: Request) => req.headers.authorization === `Bearer ${ADMIN_TOKEN}`;
  const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
    if (isAdmin(req)) next();
    else next(createError(401, "Missing Authorization header"));
  };
  return {
    requireAuth,
    requireAdmin: [requireAuth],
    isAdminRequest: async (req: Request) => isAdmin(req),
    getRequestAuthUser: () => ({ supabase_user_id: "admin", profile_picture: null, role: "admin" }),
  };
});

type OrgJson = {
  id: string;
  name: string;
  images: string[];
  tags: Array<{ id: string; name: string }>;
  [key: string]: unknown;
};

const orgOf = (res: TestResponse) => (res.body as { organization: OrgJson }).organization;
const relsOf = (res: TestResponse) => (res.body as { relationships: unknown[] }).relationships;
const errorOf = (res: TestResponse) => (res.body as { error: string }).error;

const auth = { Authorization: `Bearer ${ADMIN_TOKEN}` };
const MISSING_ID = "00000000-0000-4000-8000-000000000000";

async function createOrg(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post("/api/organizations")
    .set(auth)
    .send({ name: "Org", projectId: `p-${Math.random().toString(36).slice(2)}`, ...overrides });
  expect(res.status).toBe(201);
  return orgOf(res);
}

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  vi.clearAllMocks();
  await prisma.$executeRawUnsafe(
    'TRUNCATE "organization_relationships", "organization_tags", "organizations", "tags" CASCADE',
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("create organization (POST /api/organizations)", () => {
  it("creates an organization with all profile fields and tags", async () => {
    const tag = await prisma.tag.create({ data: { name: "Water" } });
    const org = await createOrg({
      name: "  River Trust ",
      website: "https://river.org",
      sizeCategory: "Small",
      location: "Oakland, CA",
      budget: "$1M",
      description: "Desc",
      mission: "Protect rivers",
      tags: [tag.id],
      tagNames: ["Climate"],
    });

    expect(org).toMatchObject({
      name: "River Trust",
      website: "https://river.org",
      sizeCategory: "Small",
      location: "Oakland, CA",
      budget: "$1M",
      description: "Desc",
      mission: "Protect rivers",
    });
    expect(org.tags.map((t) => t.name)).toEqual(["Climate", "Water"]);
  });

  it("requires admin auth", async () => {
    const res = await request(app).post("/api/organizations").send({ name: "x", projectId: "y" });
    expect(res.status).toBe(401);
  });

  it("returns 400 for a missing name", async () => {
    const res = await request(app).post("/api/organizations").set(auth).send({ projectId: "y" });
    expect(res.status).toBe(400);
  });

  it("returns 409 without leaking database details for a duplicate projectId", async () => {
    await createOrg({ projectId: "dup" });
    const res = await request(app)
      .post("/api/organizations")
      .set(auth)
      .send({ name: "Other", projectId: "dup" });
    expect(res.status).toBe(409);
    expect(errorOf(res)).not.toMatch(/prisma|constraint|unique/i);
  });
});

describe("get organization (GET /api/organizations/:id)", () => {
  it("returns 404 (not 500) for a malformed id", async () => {
    const res = await request(app).get("/api/organizations/not-a-uuid");
    expect(res.status).toBe(404);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).get(`/api/organizations/${MISSING_ID}`);
    expect(res.status).toBe(404);
  });
});

describe("edit organization (PATCH /api/organizations/:id)", () => {
  it("updates only the fields sent and leaves tags alone when tags are omitted", async () => {
    const tag = await prisma.tag.create({ data: { name: "Water" } });
    const org = await createOrg({ location: "Oakland, CA", tags: [tag.id] });

    const res = await request(app)
      .patch(`/api/organizations/${org.id}`)
      .set(auth)
      .send({ name: "Renamed", mission: "New mission", website: "https://new.org" });

    expect(res.status).toBe(200);
    expect(orgOf(res)).toMatchObject({
      name: "Renamed",
      mission: "New mission",
      website: "https://new.org",
      location: "Oakland, CA",
    });
    expect(orgOf(res).tags).toHaveLength(1);
  });

  it("replaces tags when tags are sent, and clears them with an empty array", async () => {
    const [a, b] = await Promise.all([
      prisma.tag.create({ data: { name: "A" } }),
      prisma.tag.create({ data: { name: "B" } }),
    ]);
    const org = await createOrg({ tags: [a.id] });

    let res = await request(app)
      .patch(`/api/organizations/${org.id}`)
      .set(auth)
      .send({ tags: [b.id] });
    expect(orgOf(res).tags.map((t) => t.name)).toEqual(["B"]);

    res = await request(app).patch(`/api/organizations/${org.id}`).set(auth).send({ tags: [] });
    expect(orgOf(res).tags).toEqual([]);
  });

  it("clears an optional field when sent as null", async () => {
    const org = await createOrg({ budget: "$1M" });
    const res = await request(app)
      .patch(`/api/organizations/${org.id}`)
      .set(auth)
      .send({ budget: null });
    expect(orgOf(res).budget).toBeNull();
  });

  it("returns 400 for an empty name and for a non-object body", async () => {
    const org = await createOrg();
    let res = await request(app)
      .patch(`/api/organizations/${org.id}`)
      .set(auth)
      .send({ name: "  " });
    expect(res.status).toBe(400);

    res = await request(app)
      .patch(`/api/organizations/${org.id}`)
      .set(auth)
      .set("Content-Type", "application/json")
      .send("[]");
    expect(res.status).toBe(400);

    res = await request(app).patch(`/api/organizations/${org.id}`).set(auth);
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown and malformed ids", async () => {
    let res = await request(app)
      .patch(`/api/organizations/${MISSING_ID}`)
      .set(auth)
      .send({ name: "x" });
    expect(res.status).toBe(404);
    res = await request(app).patch("/api/organizations/abc").set(auth).send({ name: "x" });
    expect(res.status).toBe(404);
  });

  it("removes images from the list and from storage", async () => {
    const org = await createOrg();
    const keep = publicUrl(`${org.id}/keep.png`);
    const drop = publicUrl(`${org.id}/drop.png`);
    await prisma.organization.update({ where: { id: org.id }, data: { images: [keep, drop] } });

    const res = await request(app)
      .patch(`/api/organizations/${org.id}`)
      .set(auth)
      .send({ images: [keep] });

    expect(res.status).toBe(200);
    expect(orgOf(res).images).toEqual([keep]);
    expect(storage.remove).toHaveBeenCalledWith([`${org.id}/drop.png`]);
  });

  it("rejects adding unknown image URLs through PATCH", async () => {
    const org = await createOrg();
    const res = await request(app)
      .patch(`/api/organizations/${org.id}`)
      .set(auth)
      .send({ images: ["https://evil.example/x.png"] });
    expect(res.status).toBe(400);
  });
});

describe("remove organization (DELETE /api/organizations/:id)", () => {
  it("deletes the organization, its tags, its relationships, and its stored images", async () => {
    const tag = await prisma.tag.create({ data: { name: "T" } });
    const org = await createOrg({ tags: [tag.id] });
    const partner = await createOrg();
    await prisma.organizationRelationship.createMany({
      data: [
        { npo1Id: org.id, npo2Id: partner.id, relationshipTier: "PRIMARY" },
        { npo1Id: partner.id, npo2Id: org.id, relationshipTier: "SECONDARY" },
      ],
    });
    storage.list.mockResolvedValueOnce({ data: [{ name: "a.png" }], error: null });

    const res = await request(app).delete(`/api/organizations/${org.id}`).set(auth);

    expect(res.status).toBe(204);
    expect(await prisma.organization.findUnique({ where: { id: org.id } })).toBeNull();
    expect(await prisma.organizationRelationship.count()).toBe(0);
    expect(await prisma.organizationTag.count()).toBe(0);
    expect(await prisma.tag.count()).toBe(1);
    expect(storage.list).toHaveBeenCalledWith(org.id, expect.anything());
    expect(storage.remove).toHaveBeenCalledWith([`${org.id}/a.png`]);
  });

  it("still succeeds when storage cleanup fails", async () => {
    const org = await createOrg();
    storage.list.mockRejectedValueOnce(new Error("storage down"));
    const res = await request(app).delete(`/api/organizations/${org.id}`).set(auth);
    expect(res.status).toBe(204);
  });

  it("returns 404 for unknown and malformed ids, 401 without auth", async () => {
    expect((await request(app).delete(`/api/organizations/${MISSING_ID}`).set(auth)).status).toBe(
      404,
    );
    expect((await request(app).delete("/api/organizations/abc").set(auth)).status).toBe(404);
    expect((await request(app).delete(`/api/organizations/${MISSING_ID}`)).status).toBe(401);
  });
});

describe("relationships", () => {
  it("replaces relationships in both directions and is idempotent", async () => {
    const org = await createOrg();
    const [a, b, c] = await Promise.all([createOrg(), createOrg(), createOrg()]);
    await prisma.organizationRelationship.createMany({
      data: [
        { npo1Id: org.id, npo2Id: a.id, relationshipTier: "PRIMARY" },
        { npo1Id: b.id, npo2Id: org.id, relationshipTier: "SECONDARY" },
        { npo1Id: a.id, npo2Id: c.id, relationshipTier: "PRIMARY" }, // unrelated, must survive
      ],
    });

    const body = {
      relationships: [
        { npo2Id: b.id, relationshipTier: "SECONDARY" },
        { npo2Id: c.id, relationshipTier: "TERTIARY" },
        { npo2Id: c.id, relationshipTier: "TERTIARY" }, // duplicate is collapsed
      ],
    };
    for (let attempt = 0; attempt < 2; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await request(app)
        .put(`/api/organizations/${org.id}/relationships`)
        .set(auth)
        .send(body);
      expect(res.status).toBe(200);
      expect(relsOf(res)).toHaveLength(2);
    }

    const involving = await prisma.organizationRelationship.findMany({
      where: { OR: [{ npo1Id: org.id }, { npo2Id: org.id }] },
    });
    expect(involving.map((r) => `${r.npo2Id}:${r.relationshipTier}`).sort()).toEqual(
      [`${b.id}:SECONDARY`, `${c.id}:TERTIARY`].sort(),
    );
    expect(await prisma.organizationRelationship.count({ where: { npo1Id: a.id } })).toBe(1);
  });

  it("removes all of an organization's relationships", async () => {
    const [org, a] = await Promise.all([createOrg(), createOrg()]);
    await prisma.organizationRelationship.create({
      data: { npo1Id: a.id, npo2Id: org.id, relationshipTier: "PRIMARY" },
    });
    const res = await request(app)
      .put(`/api/organizations/${org.id}/relationships`)
      .set(auth)
      .send({ relationships: [] });
    expect(res.status).toBe(200);
    expect(await prisma.organizationRelationship.count()).toBe(0);
  });

  it("rejects self-relationships and unknown partners without changing anything", async () => {
    const [org, a] = await Promise.all([createOrg(), createOrg()]);
    await prisma.organizationRelationship.create({
      data: { npo1Id: org.id, npo2Id: a.id, relationshipTier: "PRIMARY" },
    });

    let res = await request(app)
      .put(`/api/organizations/${org.id}/relationships`)
      .set(auth)
      .send({ relationships: [{ npo2Id: org.id, relationshipTier: "PRIMARY" }] });
    expect(res.status).toBe(400);

    res = await request(app)
      .put(`/api/organizations/${org.id}/relationships`)
      .set(auth)
      .send({ relationships: [{ npo2Id: MISSING_ID, relationshipTier: "PRIMARY" }] });
    expect(res.status).toBe(404);

    expect(await prisma.organizationRelationship.count()).toBe(1);
  });

  it("deletes a single relationship", async () => {
    const [org, a] = await Promise.all([createOrg(), createOrg()]);
    const rel = await prisma.organizationRelationship.create({
      data: { npo1Id: org.id, npo2Id: a.id, relationshipTier: "PRIMARY" },
    });
    expect(
      (await request(app).delete(`/api/organizations/relationships/${rel.id}`).set(auth)).status,
    ).toBe(204);
    expect(
      (await request(app).delete(`/api/organizations/relationships/${rel.id}`).set(auth)).status,
    ).toBe(404);
  });

  it("adds relationships without removing existing ones", async () => {
    const [org, a, b] = await Promise.all([createOrg(), createOrg(), createOrg()]);
    await prisma.organizationRelationship.create({
      data: { npo1Id: org.id, npo2Id: a.id, relationshipTier: "PRIMARY" },
    });
    const res = await request(app)
      .post("/api/organizations/relationships")
      .set(auth)
      .send({ npo1Id: org.id, relationships: [{ npo2Id: b.id, relationshipTier: "primary" }] });
    expect(res.status).toBe(201);
    expect(await prisma.organizationRelationship.count()).toBe(2);
  });
});

describe("images", () => {
  it("issues upload URLs inside the organization's folder and rejects non-images", async () => {
    const org = await createOrg();
    const ok = await request(app)
      .post(`/api/organizations/${org.id}/images/upload-url`)
      .set(auth)
      .send({ filename: "photo.JPG" });
    expect(ok.status).toBe(200);
    const upload = ok.body as { path: string; publicUrl: string };
    expect(upload.path).toMatch(new RegExp(`^${org.id}/[0-9a-f-]+\\.jpg$`));
    expect(upload.publicUrl).toBe(publicUrl(upload.path));

    const bad = await request(app)
      .post(`/api/organizations/${org.id}/images/upload-url`)
      .set(auth)
      .send({ filename: "script.html" });
    expect(bad.status).toBe(400);
  });

  it("records uploaded image URLs only for this organization's folder", async () => {
    const [org, other] = await Promise.all([createOrg(), createOrg()]);
    const mine = publicUrl(`${org.id}/x.png`);

    const ok = await request(app)
      .patch(`/api/organizations/${org.id}/images`)
      .set(auth)
      .send({ urls: [mine] });
    expect(ok.status).toBe(200);
    expect(orgOf(ok).images).toEqual([mine]);

    const foreign = await request(app)
      .patch(`/api/organizations/${org.id}/images`)
      .set(auth)
      .send({ urls: [publicUrl(`${other.id}/y.png`)] });
    expect(foreign.status).toBe(400);
  });
});
