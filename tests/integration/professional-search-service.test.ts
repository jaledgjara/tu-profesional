// Tests de integración para professionalSearchService
// Corre contra Supabase local (supabase start).
//
// Crea profesionales de test con ubicaciones en Mendoza, ejecuta las funciones
// del service, y verifica que retornen datos correctos mapeados a camelCase.

import "../setup/mock-rn-deps";

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestUser,
  authenticatedClient,
  deleteTestUser,
} from "../setup/test-users";
import { adminClient } from "../setup/supabase-admin";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  fetchNearbyProfessionals,
  searchProfessionals,
  fetchProfessionalsByArea,
  fetchAreaCounts,
  fetchProfessionalDetail,
  recordProfileView,
  fetchMyProfileViews,
} from "@/shared/services/professionalSearchService";
import { createProfile } from "@/shared/services/profileService";

// ── Test data ──────────────────────────────────────────────────────────────

const PREFIX = `search-svc-${Date.now()}`;
const EMAILS = {
  proA:   `${PREFIX}-pro-a@test.local`,
  proB:   `${PREFIX}-pro-b@test.local`,
  client: `${PREFIX}-client@test.local`,
};

// Mendoza centro
const MENDOZA_LAT = -32.8908;
const MENDOZA_LNG = -68.8272;

let proAUser:    { id: string };
let proBUser:    { id: string };
let clientUser:  { id: string };
let proASupa:    SupabaseClient;
let clientSupa:  SupabaseClient;

// ── Setup / Teardown ───────────────────────────────────────────────────────

beforeAll(async () => {
  // Crear usuarios
  proAUser   = await createTestUser(EMAILS.proA);
  proBUser   = await createTestUser(EMAILS.proB);
  clientUser = await createTestUser(EMAILS.client);

  proASupa   = await authenticatedClient(EMAILS.proA);
  clientSupa = await authenticatedClient(EMAILS.client);

  // Crear profiles (el test user factory solo crea auth.users, no profiles)
  await createProfile(
    { userId: proAUser.id, role: "professional", email: EMAILS.proA },
    proASupa,
  );
  await createProfile(
    { userId: clientUser.id, role: "client", email: EMAILS.client },
    clientSupa,
  );

  // Crear profesional A: TCC, Ansiedad, Centro Mendoza
  await adminClient
    .from("professionals")
    .upsert({
      id:                proAUser.id,
      full_name:         "Lic. Test Ansiedad",
      category:          "psychology",
      specialty:         "Ansiedad y Depresión",
      sub_specialties:   ["Ansiedad", "Depresión"],
      professional_area: ["tcc"],
      description:       "Profesional de test para search service",
      is_active:         true,
    });

  await adminClient
    .from("user_locations")
    .upsert({
      user_id: proAUser.id,
      street:  "San Martín",
      number:  "100",
      city:    "Mendoza",
      province: "Mendoza",
      geom:    `SRID=4326;POINT(${MENDOZA_LNG} ${MENDOZA_LAT})`,
    });

  // Crear profesional B: Psicoanálisis, Godoy Cruz (~4km)
  const proBSupa = await authenticatedClient(EMAILS.proB);
  await createProfile(
    { userId: proBUser.id, role: "professional", email: EMAILS.proB },
    proBSupa,
  );

  await adminClient
    .from("professionals")
    .upsert({
      id:                proBUser.id,
      full_name:         "Dr. Test Psicoanalisis",
      category:          "psychology",
      specialty:         "Psicoanálisis",
      sub_specialties:   ["Adultos"],
      professional_area: ["psicoanalisis"],
      description:       "Profesional B de test",
      is_active:         true,
      social_whatsapp:   "5492614001234",
    });

  await adminClient
    .from("user_locations")
    .upsert({
      user_id:  proBUser.id,
      street:   "Perito Moreno",
      number:   "200",
      city:     "Godoy Cruz",
      province: "Mendoza",
      geom:     "SRID=4326;POINT(-68.8448 -32.9264)",
    });
}, 30_000);

afterAll(async () => {
  // Limpiar en orden inverso (FKs)
  await adminClient.from("profile_views").delete().in("professional_id", [proAUser.id, proBUser.id]);
  await adminClient.from("user_locations").delete().in("user_id", [proAUser.id, proBUser.id]);
  await adminClient.from("professionals").delete().in("id", [proAUser.id, proBUser.id]);
  await deleteTestUser(proAUser.id);
  await deleteTestUser(proBUser.id);
  await deleteTestUser(clientUser.id);
});

// ─────────────────────────────────────────────────────────────────────────────
// fetchNearbyProfessionals
// ─────────────────────────────────────────────────────────────────────────────

describe("fetchNearbyProfessionals", () => {
  it("devuelve profesionales cercanos con campos camelCase", async () => {
    const results = await fetchNearbyProfessionals(
      { lat: MENDOZA_LAT, lng: MENDOZA_LNG, limit: 10 },
      clientSupa,
    );

    expect(results.length).toBeGreaterThanOrEqual(1);

    const proA = results.find((r) => r.id === proAUser.id);
    expect(proA).toBeDefined();
    expect(proA!.fullName).toBe("Lic. Test Ansiedad");
    expect(proA!.specialty).toBe("Ansiedad y Depresión");
    expect(proA!.city).toBe("Mendoza");
    expect(proA!.distanceM).toBeGreaterThanOrEqual(0);
  });

  it("respeta el limit", async () => {
    const results = await fetchNearbyProfessionals(
      { lat: MENDOZA_LAT, lng: MENDOZA_LNG, limit: 1 },
      clientSupa,
    );

    expect(results.length).toBeLessThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// searchProfessionals
// ─────────────────────────────────────────────────────────────────────────────

describe("searchProfessionals", () => {
  it("encuentra por especialidad (tsvector)", async () => {
    const results = await searchProfessionals(
      { query: "ansiedad", lat: MENDOZA_LAT, lng: MENDOZA_LNG },
      clientSupa,
    );

    const proA = results.find((r) => r.id === proAUser.id);
    expect(proA).toBeDefined();
  });

  it("encuentra por nombre (trigram)", async () => {
    const results = await searchProfessionals(
      { query: "Test Ansiedad", lat: MENDOZA_LAT, lng: MENDOZA_LNG },
      clientSupa,
    );

    const proA = results.find((r) => r.id === proAUser.id);
    expect(proA).toBeDefined();
  });

  it("filtra por area", async () => {
    const results = await searchProfessionals(
      { query: "", lat: MENDOZA_LAT, lng: MENDOZA_LNG, areaFilter: ["tcc"] },
      clientSupa,
    );

    const proA = results.find((r) => r.id === proAUser.id);
    const proB = results.find((r) => r.id === proBUser.id);
    expect(proA).toBeDefined();
    expect(proB).toBeUndefined(); // psicoanálisis, no tcc
  });

  it("devuelve vacio para query sin match", async () => {
    const results = await searchProfessionals(
      { query: "xyznoexiste123", lat: MENDOZA_LAT, lng: MENDOZA_LNG },
      clientSupa,
    );

    const own = results.filter((r) => [proAUser.id, proBUser.id].includes(r.id));
    expect(own.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// fetchProfessionalsByArea + fetchAreaCounts
// ─────────────────────────────────────────────────────────────────────────────

describe("fetchProfessionalsByArea", () => {
  it("filtra por area slug", async () => {
    const results = await fetchProfessionalsByArea(
      { areaSlug: "tcc", lat: MENDOZA_LAT, lng: MENDOZA_LNG },
      clientSupa,
    );

    const proA = results.find((r) => r.id === proAUser.id);
    expect(proA).toBeDefined();
    expect(proA!.fullName).toBe("Lic. Test Ansiedad");
  });

  it("area sin pros devuelve vacio", async () => {
    const results = await fetchProfessionalsByArea(
      { areaSlug: "noexiste", lat: MENDOZA_LAT, lng: MENDOZA_LNG },
      clientSupa,
    );

    expect(results.length).toBe(0);
  });
});

describe("fetchAreaCounts", () => {
  it("devuelve conteo por area como Record", async () => {
    const counts = await fetchAreaCounts(clientSupa);

    expect(typeof counts).toBe("object");
    expect(counts["tcc"]).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// fetchProfessionalDetail
// ─────────────────────────────────────────────────────────────────────────────

describe("fetchProfessionalDetail", () => {
  it("devuelve detalle completo con address", async () => {
    const detail = await fetchProfessionalDetail(proAUser.id, 1500, clientSupa);

    expect(detail.id).toBe(proAUser.id);
    expect(detail.fullName).toBe("Lic. Test Ansiedad");
    expect(detail.category).toBe("psychology");
    expect(detail.specialty).toBe("Ansiedad y Depresión");
    expect(detail.subSpecialties).toContain("Ansiedad");
    expect(detail.professionalArea).toContain("tcc");
    expect(detail.description).toBeTruthy();
    expect(detail.distanceM).toBe(1500);

    // Address del get_professional_location RPC
    expect(detail.address).not.toBeNull();
    expect(detail.address!.city).toBe("Mendoza");
    expect(detail.address!.lat).toBeCloseTo(MENDOZA_LAT, 2);
    expect(detail.address!.lng).toBeCloseTo(MENDOZA_LNG, 2);
  });

  it("incluye redes sociales", async () => {
    const detail = await fetchProfessionalDetail(proBUser.id, undefined, clientSupa);

    expect(detail.socialWhatsapp).toBe("5492614001234");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// recordProfileView + fetchMyProfileViews
// ─────────────────────────────────────────────────────────────────────────────

describe("profile views", () => {
  it("registra una vista y el profesional la ve en sus stats", async () => {
    // Cliente registra una vista
    await recordProfileView(proAUser.id, clientSupa);

    // Pro A lee sus stats
    const stats = await fetchMyProfileViews(proASupa);

    expect(stats.thisMonth).toBeGreaterThanOrEqual(1);
  });

  it("multiples vistas se acumulan", async () => {
    const before = await fetchMyProfileViews(proASupa);

    await recordProfileView(proAUser.id, clientSupa);
    await recordProfileView(proAUser.id, clientSupa);

    const after = await fetchMyProfileViews(proASupa);

    expect(after.thisMonth).toBeGreaterThanOrEqual(before.thisMonth + 2);
  });
});
