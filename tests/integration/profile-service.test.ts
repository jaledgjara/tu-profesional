// Tests de integración para profileService
// Llaman las FUNCIONES EXPORTADAS del service (no el SDK directo) para que
// cualquier bug en el service sea detectado por CI.
//
// Corre contra Supabase local (supabase start).

import "../setup/mock-rn-deps"; // debe ir antes que cualquier import de services

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestUser,
  authenticatedClient,
  deleteTestUser,
} from "../setup/test-users";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getProfile,
  createProfile,
  getProfessional,
  upsertProfessional,
} from "@/shared/services/profileService";

// ── Test data ──────────────────────────────────────────────────────────────

const PREFIX = `profile-test-${Date.now()}`;
const EMAILS = {
  client:       `${PREFIX}-client@test.local`,
  professional: `${PREFIX}-pro@test.local`,
  other:        `${PREFIX}-other@test.local`,
};

let clientUser: { id: string };
let proUser:    { id: string };
let otherUser:  { id: string };
let clientSupa: SupabaseClient;
let proSupa:    SupabaseClient;
let otherSupa:  SupabaseClient;

// ── Setup / Teardown ───────────────────────────────────────────────────────

beforeAll(async () => {
  clientUser = await createTestUser(EMAILS.client);
  proUser    = await createTestUser(EMAILS.professional);
  otherUser  = await createTestUser(EMAILS.other);

  clientSupa = await authenticatedClient(EMAILS.client);
  proSupa    = await authenticatedClient(EMAILS.professional);
  otherSupa  = await authenticatedClient(EMAILS.other);
});

afterAll(async () => {
  await deleteTestUser(clientUser.id);
  await deleteTestUser(proUser.id);
  await deleteTestUser(otherUser.id);
});

// ─────────────────────────────────────────────────────────────────────────────
// getProfile / createProfile
// ─────────────────────────────────────────────────────────────────────────────

describe("profileService — getProfile / createProfile", () => {
  it("getProfile devuelve null para user sin profile", async () => {
    const profile = await getProfile(clientUser.id, clientSupa);
    expect(profile).toBeNull();
  });

  it("createProfile crea el profile del user con role=client", async () => {
    const profile = await createProfile(
      {
        userId: clientUser.id,
        role:   "client",
        email:  EMAILS.client,
      },
      clientSupa,
    );

    expect(profile.id).toBe(clientUser.id);
    expect(profile.role).toBe("client");
    expect(profile.email).toBe(EMAILS.client);
  });

  it("createProfile crea el profile del user con role=professional", async () => {
    const profile = await createProfile(
      {
        userId: proUser.id,
        role:   "professional",
        email:  EMAILS.professional,
      },
      proSupa,
    );

    expect(profile.role).toBe("professional");
  });

  it("getProfile devuelve el profile recién creado", async () => {
    const profile = await getProfile(clientUser.id, clientSupa);
    expect(profile).not.toBeNull();
    expect(profile?.role).toBe("client");
    expect(profile?.id).toBe(clientUser.id);
  });

  it("createProfile es idempotente — no lanza al llamarse dos veces", async () => {
    await expect(
      createProfile(
        {
          userId: clientUser.id,
          role:   "client",
          email:  EMAILS.client,
        },
        clientSupa,
      ),
    ).resolves.toMatchObject({ id: clientUser.id, role: "client" });
  });

  it("createProfile para otro user falla por RLS", async () => {
    await expect(
      createProfile(
        {
          userId: otherUser.id, // ← id ajeno
          role:   "client",
          email:  EMAILS.other,
        },
        clientSupa, // ← cliente autenticado como clientUser
      ),
    ).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getProfessional / upsertProfessional
// ─────────────────────────────────────────────────────────────────────────────

describe("profileService — getProfessional / upsertProfessional", () => {
  it("getProfessional devuelve null cuando no hay fila todavía", async () => {
    const row = await getProfessional(proUser.id, proSupa);
    expect(row).toBeNull();
  });

  it("upsertProfessional crea la fila completa", async () => {
    const row = await upsertProfessional(
      proUser.id,
      {
        full_name:          "Test Professional",
        category:           "psychology",
        specialty:          "Cognitiva",
        sub_specialties:    ["Ansiedad", "Depresión"],
        attends_online:     true,
        attends_presencial: false,
        is_active:          true,
      },
      proSupa,
    );

    expect(row.id).toBe(proUser.id);
    expect(row.full_name).toBe("Test Professional");
    expect(row.specialty).toBe("Cognitiva");
    expect(row.sub_specialties).toEqual(["Ansiedad", "Depresión"]);
    expect(row.attends_online).toBe(true);
    expect(row.attends_presencial).toBe(false);
  });

  it("upsertProfessional actualiza la fila existente sin duplicar", async () => {
    const row = await upsertProfessional(
      proUser.id,
      {
        full_name: "Test Professional Updated",
        category:  "psychology",
        specialty: "Psicoanalisis",
      },
      proSupa,
    );

    expect(row.full_name).toBe("Test Professional Updated");
    expect(row.specialty).toBe("Psicoanalisis");

    // Verificar que getProfessional devuelve la versión nueva.
    const fetched = await getProfessional(proUser.id, proSupa);
    expect(fetched?.specialty).toBe("Psicoanalisis");
  });

  it("upsertProfessional desde un user con role=client falla por RLS", async () => {
    await expect(
      upsertProfessional(
        clientUser.id, // ← clientUser intentando crear su fila pro
        {
          full_name: "Hack",
          category:  "psychology",
        },
        clientSupa,
      ),
    ).rejects.toThrow();
  });

  it("upsertProfessional para id ajeno falla por RLS (WITH CHECK)", async () => {
    await expect(
      upsertProfessional(
        proUser.id, // ← id del pro real
        {
          full_name: "Robado",
          category:  "psychology",
        },
        otherSupa, // ← autenticado como otro user
      ),
    ).rejects.toThrow();
  });
});
