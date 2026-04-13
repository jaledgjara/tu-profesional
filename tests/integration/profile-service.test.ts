// Tests de integración para profileService
// Testea: getProfile, createProfile, getProfessional, upsertProfessional
// Corre contra Supabase local (supabase start)

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient } from "../setup/supabase-admin";
import {
  createTestUser,
  authenticatedClient,
  deleteTestUser,
} from "../setup/test-users";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Test data ──────────────────────────────────────────────────────────────

const PREFIX = `profile-test-${Date.now()}`;
const EMAILS = {
  client: `${PREFIX}-client@test.local`,
  professional: `${PREFIX}-pro@test.local`,
  other: `${PREFIX}-other@test.local`,
};

let clientUser: { id: string };
let proUser: { id: string };
let otherUser: { id: string };
let clientSupa: SupabaseClient;
let proSupa: SupabaseClient;
let otherSupa: SupabaseClient;

// ── Setup / Teardown ───────────────────────────────────────────────────────

beforeAll(async () => {
  clientUser = await createTestUser(EMAILS.client);
  proUser = await createTestUser(EMAILS.professional);
  otherUser = await createTestUser(EMAILS.other);

  clientSupa = await authenticatedClient(EMAILS.client);
  proSupa = await authenticatedClient(EMAILS.professional);
  otherSupa = await authenticatedClient(EMAILS.other);
});

afterAll(async () => {
  // Borrar cascade: auth.users → profiles → professionals → user_locations
  await deleteTestUser(clientUser.id);
  await deleteTestUser(proUser.id);
  await deleteTestUser(otherUser.id);
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("profileService — getProfile / createProfile", () => {
  it("getProfile devuelve null para user sin profile", async () => {
    const { data } = await clientSupa
      .from("profiles")
      .select("*")
      .eq("id", clientUser.id)
      .maybeSingle();

    expect(data).toBeNull();
  });

  it("createProfile con role=client", async () => {
    const { data, error } = await clientSupa
      .from("profiles")
      .upsert(
        { id: clientUser.id, role: "client", email: EMAILS.client },
        { onConflict: "id" }
      )
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.role).toBe("client");
    expect(data?.email).toBe(EMAILS.client);
  });

  it("createProfile con role=professional", async () => {
    const { data, error } = await proSupa
      .from("profiles")
      .upsert(
        { id: proUser.id, role: "professional", email: EMAILS.professional },
        { onConflict: "id" }
      )
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.role).toBe("professional");
  });

  it("getProfile devuelve el profile creado", async () => {
    const { data } = await clientSupa
      .from("profiles")
      .select("*")
      .eq("id", clientUser.id)
      .maybeSingle();

    expect(data).not.toBeNull();
    expect(data?.role).toBe("client");
    expect(data?.id).toBe(clientUser.id);
  });

  it("createProfile es idempotente (doble upsert sin error)", async () => {
    const { error } = await clientSupa
      .from("profiles")
      .upsert(
        { id: clientUser.id, role: "client", email: EMAILS.client },
        { onConflict: "id" }
      )
      .select()
      .single();

    expect(error).toBeNull();
  });

  it("createProfile para otro user falla (RLS)", async () => {
    const { error } = await clientSupa
      .from("profiles")
      .upsert(
        { id: otherUser.id, role: "client", email: EMAILS.other },
        { onConflict: "id" }
      )
      .select()
      .single();

    expect(error).not.toBeNull();
  });
});

describe("profileService — getProfessional / upsertProfessional", () => {
  it("getProfessional devuelve null sin row", async () => {
    const { data } = await proSupa
      .from("professionals")
      .select("*")
      .eq("id", proUser.id)
      .maybeSingle();

    expect(data).toBeNull();
  });

  it("upsertProfessional crea row", async () => {
    const { data, error } = await proSupa
      .from("professionals")
      .upsert(
        {
          id: proUser.id,
          full_name: "Test Professional",
          category: "psychology",
          specialty: "Cognitiva",
          sub_specialties: ["Ansiedad", "Depresión"],
          attends_online: true,
          attends_presencial: false,
          is_active: true,
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.full_name).toBe("Test Professional");
    expect(data?.specialty).toBe("Cognitiva");
    expect(data?.sub_specialties).toEqual(["Ansiedad", "Depresión"]);
    expect(data?.attends_online).toBe(true);
  });

  it("upsertProfessional actualiza row existente", async () => {
    const { data, error } = await proSupa
      .from("professionals")
      .upsert(
        {
          id: proUser.id,
          full_name: "Test Professional Updated",
          category: "psychology",
          specialty: "Psicoanalisis",
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.specialty).toBe("Psicoanalisis");
    expect(data?.full_name).toBe("Test Professional Updated");
  });

  it("upsertProfessional falla para role=client (RLS)", async () => {
    const { error } = await clientSupa
      .from("professionals")
      .upsert(
        {
          id: clientUser.id,
          full_name: "Hack",
          category: "psychology",
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    expect(error).not.toBeNull();
  });
});
