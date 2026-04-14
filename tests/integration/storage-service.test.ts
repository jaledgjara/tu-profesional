// Tests de integración para storageService.
// Llaman la FUNCIÓN EXPORTADA `uploadProfessionalPhoto` (no el SDK directo)
// y validan que las RLS policies del bucket bloqueen escrituras cruzadas.
//
// Para que el fetch() interno del service funcione en Node, pasamos el
// archivo como data URL (data:image/png;base64,...) — fetch nativo de Node 18+
// soporta este scheme.
//
// Precondición: la migration 0005_storage_policies.sql debe estar aplicada
// (supabase start la corre automáticamente).

import "../setup/mock-rn-deps"; // antes que cualquier import de services

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient } from "../setup/supabase-admin";
import {
  createTestUser,
  authenticatedClient,
  anonClient,
  deleteTestUser,
} from "../setup/test-users";
import type { SupabaseClient } from "@supabase/supabase-js";

import { uploadProfessionalPhoto } from "@/shared/services/storageService";

const PREFIX = `storage-test-${Date.now()}`;
const EMAILS = {
  pro:   `${PREFIX}-pro@test.local`,
  other: `${PREFIX}-other@test.local`,
};

let proUser:   { id: string };
let otherUser: { id: string };
let proSupa:   SupabaseClient;
let otherSupa: SupabaseClient;

// 1x1 px PNG transparente en data URL — fetch nativo de Node 18+ lo soporta.
const TINY_PNG_DATA_URL =
  "data:image/png;base64," +
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

beforeAll(async () => {
  proUser   = await createTestUser(EMAILS.pro);
  otherUser = await createTestUser(EMAILS.other);

  proSupa   = await authenticatedClient(EMAILS.pro);
  otherSupa = await authenticatedClient(EMAILS.other);

  await proSupa
    .from("profiles")
    .upsert(
      { id: proUser.id, role: "professional", email: EMAILS.pro },
      { onConflict: "id" }
    );
  await otherSupa
    .from("profiles")
    .upsert(
      { id: otherUser.id, role: "professional", email: EMAILS.other },
      { onConflict: "id" }
    );
});

afterAll(async () => {
  // Cleanup con adminClient — los archivos subidos por el test permanecen
  // en Storage hasta que alguien los borre; usamos service_role para garantizar
  // que la limpieza no dependa de policies.
  await adminClient.storage
    .from("professional-photos")
    .remove([
      `${proUser.id}/avatar.png`,
      `${otherUser.id}/avatar.png`,
    ])
    .catch(() => {});

  await deleteTestUser(proUser.id);
  await deleteTestUser(otherUser.id);
});

// ─────────────────────────────────────────────────────────────────────────────
// Happy path — owner sube a su propio path
// ─────────────────────────────────────────────────────────────────────────────

describe("storageService — uploadProfessionalPhoto (owner path)", () => {
  it("sube la foto y devuelve URL pública accesible", async () => {
    const url = await uploadProfessionalPhoto(
      proUser.id,
      TINY_PNG_DATA_URL,
      proSupa,
    );

    expect(url).toContain("professional-photos");
    expect(url).toContain(proUser.id);
    expect(url).toContain("avatar.png");

    // La URL debe resolver a un 200 (bucket público).
    const res = await fetch(url);
    expect(res.status).toBe(200);
  });

  it("el segundo upload del mismo user reemplaza (upsert), no duplica", async () => {
    const url = await uploadProfessionalPhoto(
      proUser.id,
      TINY_PNG_DATA_URL,
      proSupa,
    );
    expect(url).toBeTruthy();

    // Verificar que solo hay 1 archivo bajo el path del user.
    const { data } = await adminClient.storage
      .from("professional-photos")
      .list(proUser.id);

    const avatars = (data ?? []).filter((f) => f.name === "avatar.png");
    expect(avatars).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Security — RLS bloquea escrituras cruzadas
// ─────────────────────────────────────────────────────────────────────────────

describe("storageService — RLS policies enforce path ownership", () => {
  it("otherSupa no puede escribir en el path de proUser", async () => {
    // El service calcula el path como `${userId}/avatar.ext`. Pasamos
    // proUser.id como primer arg pero con otherSupa como cliente → debe fallar.
    await expect(
      uploadProfessionalPhoto(proUser.id, TINY_PNG_DATA_URL, otherSupa),
    ).rejects.toThrow();
  });

  it("anon no puede subir nada", async () => {
    const anon = anonClient();
    await expect(
      uploadProfessionalPhoto(proUser.id, TINY_PNG_DATA_URL, anon),
    ).rejects.toThrow();
  });
});
