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

// ── Extraer OTP del mail catcher local (Mailpit o InBucket) ────────────────

const MAIL_URL = process.env.INBUCKET_URL || "http://127.0.0.1:54324";

export async function getOtpFromInbucket(email: string): Promise<string> {
  // Supabase CLI v2.58+ usa Mailpit en vez de InBucket.
  // Mailpit API: GET /api/v1/messages → { messages: [...] }

  let messages: any[] = [];
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${MAIL_URL}/api/v1/messages`);
    const data = await res.json();
    // Mailpit devuelve { messages: [...] }
    const allMessages = data.messages || data || [];
    messages = allMessages.filter(
      (m: any) =>
        m.To?.[0]?.Address === email ||
        m.to === email ||
        JSON.stringify(m).includes(email)
    );
    if (messages.length > 0) break;
    await new Promise((r) => setTimeout(r, 500));
  }

  if (messages.length === 0) {
    throw new Error(`No emails en Mailpit para ${email}`);
  }

  const latest = messages[messages.length - 1];
  const msgId = latest.ID || latest.id;

  // Leer el mensaje completo
  const msgRes = await fetch(`${MAIL_URL}/api/v1/message/${msgId}`);
  const msg = await msgRes.json();

  // Extraer OTP de 6 dígitos del body
  const body = msg.Text || msg.HTML || msg.body?.text || msg.body?.html || JSON.stringify(msg);
  const match = body.match(/\b(\d{6})\b/);
  if (!match) throw new Error(`OTP no encontrado en email para ${email}`);

  return match[1];
}

// ── Limpiar mailbox ────────────────────────────────────────────────────────

export async function purgeInbucketMailbox(_email: string) {
  // Mailpit: DELETE /api/v1/messages borra todos los mensajes
  await fetch(`${MAIL_URL}/api/v1/messages`, { method: "DELETE" });
}
