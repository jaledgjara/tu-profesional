// Tests de integración para authService
// Testea: sendOtp, verifyOtp, getSession, signOut, onAuthStateChange
// Usa Mailpit (mail catcher local de Supabase) para extraer OTPs reales.
// Cada test usa un email ÚNICO para evitar rate limiting de Supabase Auth.

import { describe, it, expect, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { adminClient, SUPABASE_URL, ANON_KEY } from "../setup/supabase-admin";
import { getOtpFromInbucket } from "../setup/test-users";

const PREFIX = `auth-test-${Date.now()}`;
const userIds: string[] = [];

function freshClient() {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Cada test usa su propio email para evitar rate limits
function uniqueEmail(tag: string) {
  return `${PREFIX}-${tag}@test.local`;
}

afterAll(async () => {
  for (const id of userIds) {
    await adminClient.auth.admin.deleteUser(id).catch(() => {});
  }
});

describe("authService — OTP flow", () => {
  it("signInWithOtp envía email a Mailpit", async () => {
    const email = uniqueEmail("send");
    const client = freshClient();
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    expect(error).toBeNull();

    const otp = await getOtpFromInbucket(email);
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("verifyOtp con código correcto devuelve session", async () => {
    const email = uniqueEmail("verify");
    const client = freshClient();
    await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    const otp = await getOtpFromInbucket(email);

    const { data, error } = await client.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    expect(error).toBeNull();
    expect(data.session).not.toBeNull();
    expect(data.session?.user.email).toBe(email);

    if (data.session?.user.id) userIds.push(data.session.user.id);
  });

  it("verifyOtp con código incorrecto falla", async () => {
    const email = uniqueEmail("wrong");
    const client = freshClient();
    await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    // Esperar a que el email llegue pero usar código falso
    await getOtpFromInbucket(email);

    const { error } = await client.auth.verifyOtp({
      email,
      token: "000000",
      type: "email",
    });

    expect(error).not.toBeNull();
  });
});

describe("authService — session management", () => {
  it("getSession después de login devuelve session activa", async () => {
    const email = uniqueEmail("session");
    const client = freshClient();
    await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    const otp = await getOtpFromInbucket(email);
    const { data } = await client.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (data.session?.user.id) userIds.push(data.session.user.id);

    const { data: sessionData } = await client.auth.getSession();
    expect(sessionData.session).not.toBeNull();
    expect(sessionData.session?.user.email).toBe(email);
  });

  it("signOut limpia la session", async () => {
    const email = uniqueEmail("signout");
    const client = freshClient();
    await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    const otp = await getOtpFromInbucket(email);
    const { data } = await client.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (data.session?.user.id) userIds.push(data.session.user.id);

    const before = await client.auth.getSession();
    expect(before.data.session).not.toBeNull();

    const { error } = await client.auth.signOut();
    expect(error).toBeNull();

    const after = await client.auth.getSession();
    expect(after.data.session).toBeNull();
  });

  it("onAuthStateChange dispara callback en login", async () => {
    const email = uniqueEmail("events");
    const client = freshClient();

    const events: string[] = [];
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event) => {
      events.push(event);
    });

    await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    const otp = await getOtpFromInbucket(email);
    const { data } = await client.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (data.session?.user.id) userIds.push(data.session.user.id);

    await new Promise((r) => setTimeout(r, 500));
    subscription.unsubscribe();

    expect(events.some((e) => e === "SIGNED_IN")).toBe(true);
  });
});
