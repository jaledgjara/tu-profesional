// Tests de integración para locationService.
// Llaman las FUNCIONES EXPORTADAS del service.
//
// Cobertura:
//   - upsertUserLocation (RPC) + acceso por user y anon
//   - getMyUserLocation (RPC) — extrae lat/lng del geography
//   - hasUserLocation — count-only query
//   - reverseGeocode / geocodeAddress — tests UNIT con expo-location mockeado
//
// Corre contra Supabase local (supabase start).

import "../setup/mock-rn-deps"; // ← debe ir antes que cualquier import de services

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// Mock de expo-location — el paquete depende de native modules y no corre en
// Node. Las funciones que usan GPS/geocoding reciben este mock.
vi.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: vi.fn(),
  getCurrentPositionAsync:           vi.fn(),
  reverseGeocodeAsync:               vi.fn(),
  geocodeAsync:                      vi.fn(),
}));

import {
  createTestUser,
  authenticatedClient,
  anonClient,
  deleteTestUser,
} from "../setup/test-users";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  upsertUserLocation,
  getMyUserLocation,
  hasUserLocation,
  reverseGeocode,
  geocodeAddress,
} from "@/shared/services/locationService";
import * as Location from "expo-location";

// ── Test data ──────────────────────────────────────────────────────────────

const PREFIX = `loc-test-${Date.now()}`;
const EMAILS = {
  withProfile: `${PREFIX}-profile@test.local`,
  noProfile:   `${PREFIX}-noprofile@test.local`,
};

let profileUser:   { id: string };
let noProfileUser: { id: string };
let profileSupa:   SupabaseClient;
let noProfileSupa: SupabaseClient;

const MENDOZA_LAT = -32.8908;
const MENDOZA_LNG = -68.8272;

// ── Setup / Teardown ───────────────────────────────────────────────────────

beforeAll(async () => {
  profileUser = await createTestUser(EMAILS.withProfile);
  profileSupa = await authenticatedClient(EMAILS.withProfile);
  await profileSupa
    .from("profiles")
    .upsert(
      { id: profileUser.id, role: "client", email: EMAILS.withProfile },
      { onConflict: "id" }
    );

  noProfileUser = await createTestUser(EMAILS.noProfile);
  noProfileSupa = await authenticatedClient(EMAILS.noProfile);
});

afterAll(async () => {
  await deleteTestUser(profileUser.id);
  await deleteTestUser(noProfileUser.id);
});

// ─────────────────────────────────────────────────────────────────────────────
// upsertUserLocation — happy path + access control
// ─────────────────────────────────────────────────────────────────────────────

describe("locationService — upsertUserLocation", () => {
  it("crea una nueva location para el user autenticado", async () => {
    await upsertUserLocation(
      { lat: MENDOZA_LAT, lng: MENDOZA_LNG },
      {
        street:     "San Martín",
        number:     "100",
        floor:      "2",
        apartment:  "A",
        postalCode: "5500",
        city:       "Mendoza",
      },
      profileSupa,
    );

    const { data } = await profileSupa
      .from("user_locations")
      .select("*")
      .eq("user_id", profileUser.id)
      .single();

    expect(data?.street).toBe("San Martín");
    expect(data?.floor).toBe("2");
    expect(data?.city).toBe("Mendoza");
    expect(data?.province).toBe("Mendoza"); // default
    expect(data?.country).toBe("Argentina"); // default
  });

  it("un segundo upsert actualiza sin duplicar (misma PK)", async () => {
    await upsertUserLocation(
      { lat: MENDOZA_LAT + 0.01, lng: MENDOZA_LNG + 0.01 },
      { street: "Av. Las Heras", number: "200" },
      profileSupa,
    );

    const { count } = await profileSupa
      .from("user_locations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileUser.id);
    expect(count).toBe(1);

    const { data } = await profileSupa
      .from("user_locations")
      .select("street")
      .eq("user_id", profileUser.id)
      .single();
    expect(data?.street).toBe("Av. Las Heras");
  });

  it("anon no puede ejecutar la RPC", async () => {
    const anon = anonClient();
    await expect(
      upsertUserLocation(
        { lat: MENDOZA_LAT, lng: MENDOZA_LNG },
        { street: "Hack", number: "999" },
        anon,
      ),
    ).rejects.toThrow();
  });

  it("user sin profile no puede insertar su location (RLS)", async () => {
    await expect(
      upsertUserLocation(
        { lat: MENDOZA_LAT, lng: MENDOZA_LNG },
        { street: "Hack", number: "999" },
        noProfileSupa,
      ),
    ).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getMyUserLocation — devuelve la fila del user logueado con lat/lng
// ─────────────────────────────────────────────────────────────────────────────

describe("locationService — getMyUserLocation", () => {
  it("devuelve la location del user autenticado con lat/lng", async () => {
    const result = await getMyUserLocation(profileUser.id, profileSupa);

    expect(result).not.toBeNull();
    expect(result?.street).toBe("Av. Las Heras");
    expect(result?.number).toBe("200");
    // El upsert anterior fue con lat+0.01, lng+0.01
    expect(result?.lat).toBeCloseTo(MENDOZA_LAT + 0.01, 4);
    expect(result?.lng).toBeCloseTo(MENDOZA_LNG + 0.01, 4);
  });

  it("devuelve null si el user autenticado no tiene location", async () => {
    const result = await getMyUserLocation(noProfileUser.id, noProfileSupa);
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// hasUserLocation
// ─────────────────────────────────────────────────────────────────────────────

describe("locationService — hasUserLocation", () => {
  it("devuelve true cuando el user tiene location cargada", async () => {
    const result = await hasUserLocation(profileUser.id, profileSupa);
    expect(result).toBe(true);
  });

  it("devuelve false cuando el user no tiene location cargada", async () => {
    const result = await hasUserLocation(noProfileUser.id, noProfileSupa);
    expect(result).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// reverseGeocode / geocodeAddress — tests UNIT con expo-location mockeado
// ─────────────────────────────────────────────────────────────────────────────

describe("locationService — reverseGeocode (unit)", () => {
  it("mapea el primer resultado del OS a AddressFields", async () => {
    vi.mocked(Location.reverseGeocodeAsync).mockResolvedValueOnce([
      {
        street:       "Av. San Martín",
        streetNumber: "1245",
        postalCode:   "5500",
        city:         "Mendoza",
        region:       "Mendoza",
        country:      "Argentina",
        subregion:    null,
        district:     null,
        isoCountryCode: "AR",
        name:         null,
        timezone:     null,
        formattedAddress: null,
      } as any,
    ]);

    const result = await reverseGeocode({
      lat: MENDOZA_LAT,
      lng: MENDOZA_LNG,
    });

    expect(result).toEqual({
      street:     "Av. San Martín",
      number:     "1245",
      postalCode: "5500",
      city:       "Mendoza",
      province:   "Mendoza",
      country:    "Argentina",
    });
  });

  it("devuelve null si el OS no encuentra ninguna dirección", async () => {
    vi.mocked(Location.reverseGeocodeAsync).mockResolvedValueOnce([]);
    const result = await reverseGeocode({ lat: 0, lng: 0 });
    expect(result).toBeNull();
  });

  it("usa defaults cuando el OS devuelve campos vacíos", async () => {
    vi.mocked(Location.reverseGeocodeAsync).mockResolvedValueOnce([
      {
        street:       null,
        streetNumber: null,
        postalCode:   null,
        city:         null,
        region:       null,
        country:      null,
        subregion:    "Luján",
      } as any,
    ]);

    const result = await reverseGeocode({
      lat: MENDOZA_LAT,
      lng: MENDOZA_LNG,
    });

    expect(result?.street).toBe("");
    expect(result?.number).toBe("");
    expect(result?.city).toBe("Luján"); // fallback a subregion
    expect(result?.province).toBe("Mendoza"); // default hardcoded
    expect(result?.country).toBe("Argentina"); // default hardcoded
  });
});

describe("locationService — geocodeAddress (unit)", () => {
  it("construye el query y devuelve coordenadas del primer resultado", async () => {
    vi.mocked(Location.geocodeAsync).mockResolvedValueOnce([
      { latitude: MENDOZA_LAT, longitude: MENDOZA_LNG } as any,
    ]);

    const result = await geocodeAddress({
      street:   "San Martín",
      number:   "100",
      city:     "Mendoza",
      province: "Mendoza",
      country:  "Argentina",
    });

    expect(result).toEqual({ lat: MENDOZA_LAT, lng: MENDOZA_LNG });

    // El query que se arma debe incluir todos los campos no vacíos.
    expect(vi.mocked(Location.geocodeAsync)).toHaveBeenCalledWith(
      "San Martín 100, Mendoza, Mendoza, Argentina",
    );
  });

  it("devuelve null cuando el OS no encuentra coordenadas", async () => {
    vi.mocked(Location.geocodeAsync).mockResolvedValueOnce([]);
    const result = await geocodeAddress({
      street: "Calle Inexistente",
      number: "99999",
    });
    expect(result).toBeNull();
  });
});
