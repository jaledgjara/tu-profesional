// Tests de integración para authService
// Testea: sendOtp, verifyOtp, getSession, signOut, onAuthStateChange
// Usa InBucket (mail catcher local de Supabase) para extraer OTPs reales.
// Corre contra Supabase local (supabase start)

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { adminClient, SUPABASE_URL, ANON_KEY } from "../setup/supabase-admin";
import {
  getOtpFromInbucket,
  purgeInbucketMailbox,
} from "../setup/test-users";

const PREFIX = `auth-test-${Date.now()}`;
const TEST_EMAIL = `${PREFIX}@test.local`;

let userId: string | null = null;

// Cliente fresco para cada test (sin session previa)
function freshClient() {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

beforeAll(async () => {
  // Limpiar mailbox por si quedaron emails previos
  await purgeInbucketMailbox(TEST_EMAIL);
});

afterAll(async () => {
  // Limpiar user creado por OTP
  if (userId) {
    await adminClient.auth.admin.deleteUser(userId);
  }
  await purgeInbucketMailbox(TEST_EMAIL);
});

describe("authService — OTP flow", () => {
  it("signInWithOtp envía email a InBucket", async () => {
    const client = freshClient();
    const { error } = await client.auth.signInWithOtp({
      email: TEST_EMAIL,
      options: { shouldCreateUser: true },
    });

    expect(error).toBeNull();

    // Verificar que el email llegó a InBucket
    const otp = await getOtpFromInbucket(TEST_EMAIL);
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("verifyOtp con código correcto devuelve session", async () => {
    // Pedir nuevo OTP
    await purgeInbucketMailbox(TEST_EMAIL);
    const client = freshClient();
    await client.auth.signInWithOtp({
      email: TEST_EMAIL,
      options: { shouldCreateUser: true },
    });

    const otp = await getOtpFromInbucket(TEST_EMAIL);

    const { data, error } = await client.auth.verifyOtp({
      email: TEST_EMAIL,
      token: otp,
      type: "email",
    });

    expect(error).toBeNull();
    expect(data.session).not.toBeNull();
    expect(data.session?.user.email).toBe(TEST_EMAIL);

    // Guardar userId para cleanup
    userId = data.session?.user.id || null;
  });

  it("verifyOtp con código incorrecto falla", async () => {
    await purgeInbucketMailbox(TEST_EMAIL);
    const client = freshClient();
    await client.auth.signInWithOtp({
      email: TEST_EMAIL,
      options: { shouldCreateUser: true },
    });

    // Esperar a que el email llegue pero usar código falso
    await getOtpFromInbucket(TEST_EMAIL);

    const { error } = await client.auth.verifyOtp({
      email: TEST_EMAIL,
      token: "000000",
      type: "email",
    });

    expect(error).not.toBeNull();
  });
});

describe("authService — session management", () => {
  it("getSession después de login devuelve session activa", async () => {
    await purgeInbucketMailbox(TEST_EMAIL);
    const client = freshClient();
    await client.auth.signInWithOtp({
      email: TEST_EMAIL,
      options: { shouldCreateUser: true },
    });
    const otp = await getOtpFromInbucket(TEST_EMAIL);
    await client.auth.verifyOtp({ email: TEST_EMAIL, token: otp, type: "email" });

    const { data } = await client.auth.getSession();
    expect(data.session).not.toBeNull();
    expect(data.session?.user.email).toBe(TEST_EMAIL);
  });

  it("signOut limpia la session", async () => {
    await purgeInbucketMailbox(TEST_EMAIL);
    const client = freshClient();
    await client.auth.signInWithOtp({
      email: TEST_EMAIL,
      options: { shouldCreateUser: true },
    });
    const otp = await getOtpFromInbucket(TEST_EMAIL);
    await client.auth.verifyOtp({ email: TEST_EMAIL, token: otp, type: "email" });

    // Verificar que hay session
    const before = await client.auth.getSession();
    expect(before.data.session).not.toBeNull();

    // Sign out
    const { error } = await client.auth.signOut();
    expect(error).toBeNull();

    // Session limpia
    const after = await client.auth.getSession();
    expect(after.data.session).toBeNull();
  });

  it("onAuthStateChange dispara callback en login", async () => {
    await purgeInbucketMailbox(TEST_EMAIL);
    const client = freshClient();

    const events: string[] = [];
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event) => {
      events.push(event);
    });

    await client.auth.signInWithOtp({
      email: TEST_EMAIL,
      options: { shouldCreateUser: true },
    });
    const otp = await getOtpFromInbucket(TEST_EMAIL);
    await client.auth.verifyOtp({ email: TEST_EMAIL, token: otp, type: "email" });

    // Dar tiempo al callback async
    await new Promise((r) => setTimeout(r, 500));

    subscription.unsubscribe();

    // Debería haber disparado SIGNED_IN (y posiblemente INITIAL_SESSION)
    expect(events.some((e) => e === "SIGNED_IN")).toBe(true);
  });
});
