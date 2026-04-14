// Tests de integración para storageService
// Testea las RLS policies del bucket professional-photos (migration 0005)
// usando el cliente AUTENTICADO (proSupa), no adminClient — así validamos
// que las policies efectivamente bloquean escrituras cruzadas.
//
// Precondición: la migration 0005_storage_policies.sql debe estar aplicada
// (supabase start la corre automáticamente). El bucket se crea ahí, no acá.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient } from "../setup/supabase-admin";
import {
  createTestUser,
  authenticatedClient,
  anonClient,
  deleteTestUser,
} from "../setup/test-users";
import type { SupabaseClient } from "@supabase/supabase-js";

const PREFIX = `storage-test-${Date.now()}`;
const EMAILS = {
  pro:   `${PREFIX}-pro@test.local`,
  other: `${PREFIX}-other@test.local`,
};

let proUser:   { id: string };
let otherUser: { id: string };
let proSupa:   SupabaseClient;
let otherSupa: SupabaseClient;

// PNG 1x1 transparente
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

beforeAll(async () => {
  proUser   = await createTestUser(EMAILS.pro);
  otherUser = await createTestUser(EMAILS.other);

  proSupa   = await authenticatedClient(EMAILS.pro);
  otherSupa = await authenticatedClient(EMAILS.other);

  // Profiles (necesarios antes de que los users puedan escribir en otras tablas,
  // aunque para storage no es un requisito RLS — igual mantenemos el flujo real).
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
  // Cleanup de archivos. Usamos adminClient porque los DELETE del bucket
  // pueden no estar cubiertos si el test dejó archivos en otros paths.
  await adminClient.storage
    .from("professional-photos")
    .remove([
      `${proUser.id}/avatar.png`,
      `${otherUser.id}/avatar.png`,
    ])
    .catch(() => {
      /* ignorar si los archivos ya no existen */
    });

  await deleteTestUser(proUser.id);
  await deleteTestUser(otherUser.id);
});

// ─────────────────────────────────────────────────────────────────────────────
// HAPPY PATH — owner sube a su propio path
// ─────────────────────────────────────────────────────────────────────────────

describe("storageService — owner uploads to own path", () => {
  it("proSupa sube a {proUserId}/avatar.png sin error", async () => {
    const path = `${proUser.id}/avatar.png`;
    const { error } = await proSupa.storage
      .from("professional-photos")
      .upload(path, TINY_PNG, {
        contentType: "image/png",
        upsert: true,
      });

    expect(error).toBeNull();
  });

  it("getPublicUrl devuelve URL válida y accesible", async () => {
    const path = `${proUser.id}/avatar.png`;
    const {
      data: { publicUrl },
    } = proSupa.storage.from("professional-photos").getPublicUrl(path);

    expect(publicUrl).toContain("professional-photos");
    expect(publicUrl).toContain(proUser.id);
    expect(publicUrl).toContain("avatar.png");

    // La URL debe resolver (el bucket es público).
    const res = await fetch(publicUrl);
    expect(res.status).toBe(200);
  });

  it("upsert reemplaza el archivo existente (no duplica)", async () => {
    const path = `${proUser.id}/avatar.png`;
    const { error } = await proSupa.storage
      .from("professional-photos")
      .upload(path, TINY_PNG, {
        contentType: "image/png",
        upsert: true,
      });

    expect(error).toBeNull();

    // Verificar que solo hay 1 objeto con ese name.
    const { data } = await adminClient.storage
      .from("professional-photos")
      .list(proUser.id);

    const matches = (data ?? []).filter((f) => f.name === "avatar.png");
    expect(matches).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY — RLS policies bloquean escrituras cruzadas
// ─────────────────────────────────────────────────────────────────────────────

describe("storageService — RLS policies enforce path ownership", () => {
  it("otherSupa NO puede subir al path de proUser", async () => {
    const path = `${proUser.id}/avatar.png`;
    const { error } = await otherSupa.storage
      .from("professional-photos")
      .upload(path, TINY_PNG, {
        contentType: "image/png",
        upsert: true,
      });

    // Sin fallback: este test FALLA si las policies no están puestas.
    expect(error).not.toBeNull();
  });

  it("otherSupa NO puede subir a path con carpeta = id ajeno (aunque agregue subdirs)", async () => {
    const path = `${proUser.id}/subdir/avatar.png`;
    const { error } = await otherSupa.storage
      .from("professional-photos")
      .upload(path, TINY_PNG, {
        contentType: "image/png",
        upsert: true,
      });

    // La policy checkea (storage.foldername(name))[1] = auth.uid() — el primer
    // segmento. Si no coincide, debe bloquear aunque haya subdirectorios.
    expect(error).not.toBeNull();
  });

  it("anon NO puede subir nada", async () => {
    const anon = anonClient();
    const path = `${proUser.id}/avatar.png`;
    const { error } = await anon.storage
      .from("professional-photos")
      .upload(path, TINY_PNG, {
        contentType: "image/png",
        upsert: true,
      });

    expect(error).not.toBeNull();
  });

  it("otherSupa NO puede borrar el archivo de proUser", async () => {
    const path = `${proUser.id}/avatar.png`;
    const { data, error } = await otherSupa.storage
      .from("professional-photos")
      .remove([path]);

    // Storage RLS DELETE: cuando no hay permiso, `remove` devuelve data=[]
    // (ningún archivo borrado) o error. Cualquiera de los dos indica que
    // la policy bloqueó la operación. Lo importante es que el archivo
    // siga existiendo después.
    void data;
    void error;

    // Verificar que el archivo sigue ahí (el cliente ajeno no lo borró).
    const { data: listAfter } = await adminClient.storage
      .from("professional-photos")
      .list(proUser.id);
    const stillExists = (listAfter ?? []).some((f) => f.name === "avatar.png");
    expect(stillExists).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OWNER DELETE — lo puede borrar solo el dueño
// ─────────────────────────────────────────────────────────────────────────────

describe("storageService — owner can delete own files", () => {
  it("proSupa puede borrar su propio archivo", async () => {
    const path = `${proUser.id}/avatar.png`;

    // Asegurar que exista antes del delete.
    await proSupa.storage
      .from("professional-photos")
      .upload(path, TINY_PNG, {
        contentType: "image/png",
        upsert: true,
      });

    const { error } = await proSupa.storage
      .from("professional-photos")
      .remove([path]);

    expect(error).toBeNull();

    // Verificar que ya no está.
    const { data: listAfter } = await adminClient.storage
      .from("professional-photos")
      .list(proUser.id);
    const stillExists = (listAfter ?? []).some((f) => f.name === "avatar.png");
    expect(stillExists).toBe(false);
  });
});
