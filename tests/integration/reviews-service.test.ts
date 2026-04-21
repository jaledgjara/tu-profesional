// Tests de integración para reviewsService
// Llaman las FUNCIONES EXPORTADAS del service (no el SDK directo) para que
// cualquier bug en el service sea detectado por CI.
//
// Corre contra Supabase local (supabase start).
//
// Cubre:
//   - fetchProfessionalReviewStats: estado vacío + post-review
//   - fetchProfessionalReviews: lectura vía vista anónima
//   - fetchMyReviewFor: RLS filtra por auth.uid (alice ve la suya, bob no)
//   - createReview: happy path + duplicado (UNIQUE) + rating inválido (CHECK)
//   - updateReview: autor OK, no-autor afecta 0 rows (silencioso)
//   - deleteReview: autor OK

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
  fetchProfessionalReviews,
  fetchProfessionalReviewStats,
  fetchMyReviewFor,
  createReview,
  updateReview,
  deleteReview,
} from "@/shared/services/reviewsService";
import { createProfile } from "@/shared/services/profileService";

// ── Test data ──────────────────────────────────────────────────────────────

const PREFIX = `reviews-svc-${Date.now()}`;
const EMAILS = {
  alice: `${PREFIX}-alice@test.local`,
  bob:   `${PREFIX}-bob@test.local`,
  doc:   `${PREFIX}-doc@test.local`,
};

let aliceUser: { id: string };
let bobUser:   { id: string };
let docUser:   { id: string };
let aliceSupa: SupabaseClient;
let bobSupa:   SupabaseClient;

// ── Setup / Teardown ───────────────────────────────────────────────────────

beforeAll(async () => {
  aliceUser = await createTestUser(EMAILS.alice);
  bobUser   = await createTestUser(EMAILS.bob);
  docUser   = await createTestUser(EMAILS.doc);

  aliceSupa = await authenticatedClient(EMAILS.alice);
  bobSupa   = await authenticatedClient(EMAILS.bob);
  const docSupa = await authenticatedClient(EMAILS.doc);

  // Profiles: alice y bob como clients, doc como professional
  await createProfile(
    { userId: aliceUser.id, role: "client", email: EMAILS.alice },
    aliceSupa,
  );
  await createProfile(
    { userId: bobUser.id, role: "client", email: EMAILS.bob },
    bobSupa,
  );
  await createProfile(
    { userId: docUser.id, role: "professional", email: EMAILS.doc },
    docSupa,
  );

  // Fila en professionals (FK requirement para reviews.professional_id)
  const { error: proErr } = await adminClient
    .from("professionals")
    .upsert({
      id:        docUser.id,
      full_name: "Doc Reviewed",
      category:  "psychology",
      is_active: true,
    });
  if (proErr) throw new Error(`upsert professional: ${proErr.message}`);
}, 30_000);

afterAll(async () => {
  // FKs: reviews → professionals → profiles
  await adminClient.from("reviews").delete().eq("professional_id", docUser.id);
  await adminClient.from("professionals").delete().eq("id", docUser.id);
  await deleteTestUser(aliceUser.id);
  await deleteTestUser(bobUser.id);
  await deleteTestUser(docUser.id);
});

// ─────────────────────────────────────────────────────────────────────────────
// Estado vacío: sin reseñas, stats y listas deben estar vacías
// ─────────────────────────────────────────────────────────────────────────────

describe("reviewsService — estado vacío", () => {
  it("fetchProfessionalReviewStats devuelve avg=0 y count=0 sin reseñas", async () => {
    const stats = await fetchProfessionalReviewStats(docUser.id, aliceSupa);
    expect(stats.avgRating).toBe(0);
    expect(stats.reviewCount).toBe(0);
  });

  it("fetchProfessionalReviews devuelve [] sin reseñas", async () => {
    const reviews = await fetchProfessionalReviews(docUser.id, {}, aliceSupa);
    expect(reviews).toEqual([]);
  });

  it("fetchMyReviewFor devuelve null cuando el autor no reseñó", async () => {
    const mine = await fetchMyReviewFor(docUser.id, aliceSupa);
    expect(mine).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createReview — happy path + validaciones
// ─────────────────────────────────────────────────────────────────────────────

describe("reviewsService — createReview", () => {
  it("alice crea una reseña válida con comment", async () => {
    await expect(
      createReview(
        {
          professionalId: docUser.id,
          rating:         5,
          comment:        "Excelente profesional",
        },
        aliceSupa,
      ),
    ).resolves.toBeUndefined();
  });

  it("segunda reseña del mismo autor falla por UNIQUE", async () => {
    await expect(
      createReview(
        {
          professionalId: docUser.id,
          rating:         3,
        },
        aliceSupa,
      ),
    ).rejects.toThrow();
  });

  it("rating > 5 falla por CHECK", async () => {
    await expect(
      createReview(
        {
          professionalId: docUser.id,
          rating:         6,
        },
        bobSupa,
      ),
    ).rejects.toThrow();
  });

  it("rating < 1 falla por CHECK", async () => {
    await expect(
      createReview(
        {
          professionalId: docUser.id,
          rating:         0,
        },
        bobSupa,
      ),
    ).rejects.toThrow();
  });

  it("bob crea reseña válida sin comment (null)", async () => {
    await expect(
      createReview(
        {
          professionalId: docUser.id,
          rating:         4,
        },
        bobSupa,
      ),
    ).resolves.toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LECTURA post-review: stats agregadas + lista anónima + aislamiento por autor
// ─────────────────────────────────────────────────────────────────────────────

describe("reviewsService — lectura post-review", () => {
  it("fetchProfessionalReviewStats promedia y cuenta correctamente", async () => {
    // alice = 5, bob = 4 → avg 4.5, count 2
    const stats = await fetchProfessionalReviewStats(docUser.id, aliceSupa);
    expect(stats.reviewCount).toBe(2);
    expect(stats.avgRating).toBeCloseTo(4.5, 1);
  });

  it("fetchProfessionalReviews devuelve ambas reseñas ordenadas desc por fecha", async () => {
    const reviews = await fetchProfessionalReviews(
      docUser.id,
      { limit: 20 },
      aliceSupa,
    );

    expect(reviews.length).toBe(2);
    // orden desc: la más reciente primero (bob insertó después de alice)
    expect(reviews[0].rating).toBe(4);
    expect(reviews[1].rating).toBe(5);
    expect(reviews[1].comment).toBe("Excelente profesional");
    expect(reviews[0].comment).toBeNull();
  });

  it("fetchProfessionalReviews respeta limit", async () => {
    const reviews = await fetchProfessionalReviews(
      docUser.id,
      { limit: 1 },
      aliceSupa,
    );
    expect(reviews.length).toBe(1);
  });

  it("fetchMyReviewFor devuelve solo la reseña del autor autenticado", async () => {
    const aliceMine = await fetchMyReviewFor(docUser.id, aliceSupa);
    const bobMine   = await fetchMyReviewFor(docUser.id, bobSupa);

    expect(aliceMine).not.toBeNull();
    expect(aliceMine!.rating).toBe(5);
    expect(aliceMine!.reviewerId).toBe(aliceUser.id);

    expect(bobMine).not.toBeNull();
    expect(bobMine!.rating).toBe(4);
    expect(bobMine!.reviewerId).toBe(bobUser.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateReview — autor OK, no-autor silencioso (RLS filtra 0 rows)
// ─────────────────────────────────────────────────────────────────────────────

describe("reviewsService — updateReview", () => {
  it("alice actualiza su propia reseña", async () => {
    const mine = await fetchMyReviewFor(docUser.id, aliceSupa);
    expect(mine).not.toBeNull();

    await expect(
      updateReview(
        mine!.id,
        { rating: 3, comment: "Actualizado" },
        aliceSupa,
      ),
    ).resolves.toBeUndefined();

    const updated = await fetchMyReviewFor(docUser.id, aliceSupa);
    expect(updated!.rating).toBe(3);
    expect(updated!.comment).toBe("Actualizado");
  });

  it("bob intentando actualizar la reseña de alice no lanza pero no cambia nada", async () => {
    const aliceReview = await fetchMyReviewFor(docUser.id, aliceSupa);
    expect(aliceReview).not.toBeNull();

    // supabase-js no lanza: la RLS filtra → afecta 0 rows silenciosamente.
    await expect(
      updateReview(
        aliceReview!.id,
        { rating: 1 },
        bobSupa,
      ),
    ).resolves.toBeUndefined();

    // Confirmamos que el rating de alice sigue en 3 (del test anterior).
    const stillMine = await fetchMyReviewFor(docUser.id, aliceSupa);
    expect(stillMine!.rating).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// deleteReview — autor borra su reseña, stats se actualiza
// ─────────────────────────────────────────────────────────────────────────────

describe("reviewsService — deleteReview", () => {
  it("alice borra su propia reseña", async () => {
    const mine = await fetchMyReviewFor(docUser.id, aliceSupa);
    expect(mine).not.toBeNull();

    await expect(deleteReview(mine!.id, aliceSupa)).resolves.toBeUndefined();

    const after = await fetchMyReviewFor(docUser.id, aliceSupa);
    expect(after).toBeNull();
  });

  it("tras el delete, stats refleja solo la reseña de bob", async () => {
    const stats = await fetchProfessionalReviewStats(docUser.id, aliceSupa);
    expect(stats.reviewCount).toBe(1);
    expect(stats.avgRating).toBe(4);
  });
});
