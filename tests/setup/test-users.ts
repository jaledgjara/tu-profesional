// Factory para crear y autenticar usuarios de test contra Supabase local.
//
// Usa la Admin API (service_role) para crear users con password,
// evitando el flujo OTP excepto en auth-service.test.ts.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { adminClient, SUPABASE_URL, ANON_KEY } from "./supabase-admin";

const TEST_PASSWORD = "test-password-Tu-Pro-2025!";

// ── Crear usuario ──────────────────────────────────────────────────────────

export async function createTestUser(email: string) {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`createTestUser(${email}): ${error.message}`);
  return data.user;
}

// ── Cliente autenticado como un usuario ────────────────────────────────────

export async function authenticatedClient(
  email: string
): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await client.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  });
  if (error)
    throw new Error(`authenticatedClient(${email}): ${error.message}`);

  return client;
}

// ── Cliente anónimo (sin auth) ─────────────────────────────────────────────

export function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── Borrar usuario de test ─────────────────────────────────────────────────

export async function deleteTestUser(id: string) {
  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) throw new Error(`deleteTestUser(${id}): ${error.message}`);
}

// ── Extraer OTP de InBucket (solo para auth-service tests) ─────────────────

const INBUCKET_URL = process.env.INBUCKET_URL || "http://127.0.0.1:54324";

export async function getOtpFromInbucket(email: string): Promise<string> {
  const mailbox = email.split("@")[0];

  // Esperar a que llegue el email (max ~5s)
  let messages: any[] = [];
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${INBUCKET_URL}/api/v1/mailbox/${mailbox}`);
    messages = await res.json();
    if (messages.length > 0) break;
    await new Promise((r) => setTimeout(r, 500));
  }

  if (messages.length === 0) {
    throw new Error(`No emails en InBucket para ${email}`);
  }

  const latest = messages[messages.length - 1];
  const msgRes = await fetch(
    `${INBUCKET_URL}/api/v1/mailbox/${mailbox}/${latest.id}`
  );
  const msg = await msgRes.json();

  // Extraer OTP de 6 dígitos del body del email
  const body = msg.body?.text || msg.body?.html || "";
  const match = body.match(/\b(\d{6})\b/);
  if (!match) throw new Error(`OTP no encontrado en email para ${email}`);

  return match[1];
}

// ── Limpiar mailbox de InBucket ────────────────────────────────────────────

export async function purgeInbucketMailbox(email: string) {
  const mailbox = email.split("@")[0];
  await fetch(`${INBUCKET_URL}/api/v1/mailbox/${mailbox}`, {
    method: "DELETE",
  });
}
