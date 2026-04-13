// Tests de integración para locationService
// Testea: upsertUserLocation (RPC), hasUserLocation, nearby_professionals
// Corre contra Supabase local (supabase start)

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient } from "../setup/supabase-admin";
import {
  createTestUser,
  authenticatedClient,
  anonClient,
  deleteTestUser,
} from "../setup/test-users";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Test data ──────────────────────────────────────────────────────────────

const PREFIX = `loc-test-${Date.now()}`;
const EMAILS = {
  withProfile: `${PREFIX}-profile@test.local`,
  noProfile: `${PREFIX}-noprofile@test.local`,
  pro: `${PREFIX}-pro@test.local`,
};

let profileUser: { id: string };
let noProfileUser: { id: string };
let proUser: { id: string };
let profileSupa: SupabaseClient;
let noProfileSupa: SupabaseClient;
let proSupa: SupabaseClient;

// Mendoza centro
const MENDOZA_LAT = -32.8908;
const MENDOZA_LNG = -68.8272;

beforeAll(async () => {
  // User con profile
  profileUser = await createTestUser(EMAILS.withProfile);
  profileSupa = await authenticatedClient(EMAILS.withProfile);
  await profileSupa
    .from("profiles")
    .upsert(
      { id: profileUser.id, role: "client", email: EMAILS.withProfile },
      { onConflict: "id" }
    );

  // User sin profile (solo auth)
  noProfileUser = await createTestUser(EMAILS.noProfile);
  noProfileSupa = await authenticatedClient(EMAILS.noProfile);

  // Professional (para nearby test)
  proUser = await createTestUser(EMAILS.pro);
  proSupa = await authenticatedClient(EMAILS.pro);
  await proSupa
    .from("profiles")
    .upsert(
      { id: proUser.id, role: "professional", email: EMAILS.pro },
      { onConflict: "id" }
    );
  await proSupa
    .from("professionals")
    .upsert(
      {
        id: proUser.id,
        full_name: "Pro Test Location",
        category: "psychology",
        is_active: true,
      },
      { onConflict: "id" }
    );
});

afterAll(async () => {
  await deleteTestUser(profileUser.id);
  await deleteTestUser(noProfileUser.id);
  await deleteTestUser(proUser.id);
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("locationService — upsertUserLocation (RPC)", () => {
  it("crea location nueva via RPC", async () => {
    const { data, error } = await profileSupa.rpc("upsert_user_location", {
      p_lat: MENDOZA_LAT,
      p_lng: MENDOZA_LNG,
      p_street: "San Martín",
      p_number: "100",
      p_floor: "2",
      p_apartment: "A",
      p_postal_code: "5500",
      p_city: "Mendoza",
    });

    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });

  it("devuelve row completa con todos los campos", async () => {
    // Leer la row directamente
    const { data } = await profileSupa
      .from("user_locations")
      .select("*")
      .eq("user_id", profileUser.id)
      .single();

    expect(data?.street).toBe("San Martín");
    expect(data?.number).toBe("100");
    expect(data?.floor).toBe("2");
    expect(data?.apartment).toBe("A");
    expect(data?.postal_code).toBe("5500");
    expect(data?.city).toBe("Mendoza");
    expect(data?.province).toBe("Mendoza");
    expect(data?.country).toBe("Argentina");
  });

  it("upsert no duplica (segundo call actualiza)", async () => {
    const { error } = await profileSupa.rpc("upsert_user_location", {
      p_lat: MENDOZA_LAT + 0.01,
      p_lng: MENDOZA_LNG + 0.01,
      p_street: "Av. Las Heras",
      p_number: "200",
    });

    expect(error).toBeNull();

    // Verificar que solo hay 1 row
    const { count } = await adminClient
      .from("user_locations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileUser.id);

    expect(count).toBe(1);

    // Verificar que los datos se actualizaron
    const { data } = await profileSupa
      .from("user_locations")
      .select("street")
      .eq("user_id", profileUser.id)
      .single();

    expect(data?.street).toBe("Av. Las Heras");
  });
});

describe("locationService — hasUserLocation", () => {
  it("devuelve false para user sin location", async () => {
    const { count } = await noProfileSupa
      .from("user_locations")
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", noProfileUser.id);

    expect(count).toBe(0);
  });

  it("devuelve true después de upsert", async () => {
    const { count } = await profileSupa
      .from("user_locations")
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", profileUser.id);

    expect(count).toBeGreaterThan(0);
  });
});

describe("locationService — access control", () => {
  it("falla sin auth (anon)", async () => {
    const anon = anonClient();
    const { error } = await anon.rpc("upsert_user_location", {
      p_lat: MENDOZA_LAT,
      p_lng: MENDOZA_LNG,
      p_street: "Hack",
      p_number: "999",
    });

    expect(error).not.toBeNull();
  });

  it("falla sin profile", async () => {
    const { error } = await noProfileSupa.rpc("upsert_user_location", {
      p_lat: MENDOZA_LAT,
      p_lng: MENDOZA_LNG,
      p_street: "Hack",
      p_number: "999",
    });

    expect(error).not.toBeNull();
  });
});

describe("locationService — nearby_professionals", () => {
  it("devuelve profesionales cercanos", async () => {
    // Crear location para el professional
    await proSupa.rpc("upsert_user_location", {
      p_lat: MENDOZA_LAT,
      p_lng: MENDOZA_LNG,
      p_street: "Belgrano",
      p_number: "300",
      p_city: "Mendoza",
    });

    // Query desde la misma zona
    const { data, error } = await profileSupa.rpc("nearby_professionals", {
      user_lat: MENDOZA_LAT,
      user_lng: MENDOZA_LNG,
      radius_m: 10000,
    });

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(1);

    const pro = data!.find((p: any) => p.id === proUser.id);
    expect(pro).toBeDefined();
    expect(pro?.full_name).toBe("Pro Test Location");
    expect(pro?.category).toBe("psychology");
    expect(pro?.city).toBe("Mendoza");
  });
});
