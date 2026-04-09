// locationService — captura GPS, reverse geocode y persistencia en user_locations
// Capa: shared/services
// Combina expo-location (cliente) + RPC upsert_user_location (server-side PostGIS).
//
// Por qué RPC y no INSERT directo:
//   La columna `geom` es geography(Point, 4326). Construir el WKB en cliente
//   acopla el frontend al schema y mete strings raros en JSON. La RPC encapsula
//   ST_SetSRID(ST_MakePoint(lng,lat),4326)::geography y mantiene el cliente limpio.

import * as Location from "expo-location";

import { supabase } from "@/shared/services/supabase";
import type { Database } from "@/shared/types/database";

export type UserLocation = Database["public"]["Tables"]["user_locations"]["Row"];

export interface Coords {
  lat: number;
  lng: number;
}

export interface AddressFields {
  street:      string;
  number:      string;
  floor?:      string | null;
  apartment?:  string | null;
  postalCode?: string | null;
  city?:       string | null;
  province?:   string | null;
  country?:    string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMISO + GPS
// ─────────────────────────────────────────────────────────────────────────────

/** Pide permiso de foreground. Devuelve `true` si quedó granted. */
export async function requestPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

export async function getCurrentCoords(): Promise<Coords> {
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

/**
 * Reverse geocode usando el provider nativo (gratis, sin API key).
 * Devuelve `null` si el OS no logra resolver la dirección.
 */
export async function reverseGeocode(coords: Coords): Promise<Partial<AddressFields> | null> {
  const results = await Location.reverseGeocodeAsync({
    latitude:  coords.lat,
    longitude: coords.lng,
  });
  const r = results[0];
  if (!r) return null;
  return {
    street:     r.street ?? "",
    number:     r.streetNumber ?? "",
    postalCode: r.postalCode ?? "",
    city:       r.city ?? r.subregion ?? "",
    province:   r.region ?? "Mendoza",
    country:    r.country ?? "Argentina",
  };
}

/**
 * Geocode forward: dirección textual → coords. Se usa cuando el usuario
 * no tocó el botón GPS y tipeó la dirección a mano.
 */
export async function geocodeAddress(
  address: AddressFields,
): Promise<Coords | null> {
  const query = [
    `${address.street} ${address.number}`,
    address.city,
    address.province ?? "Mendoza",
    address.country ?? "Argentina",
  ]
    .filter(Boolean)
    .join(", ");

  const results = await Location.geocodeAsync(query);
  const r = results[0];
  if (!r) return null;
  return { lat: r.latitude, lng: r.longitude };
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENCIA — RPC upsert_user_location
// ─────────────────────────────────────────────────────────────────────────────

export async function upsertUserLocation(
  coords: Coords,
  address: AddressFields,
): Promise<UserLocation> {
  const { data, error } = await supabase.rpc("upsert_user_location", {
    p_lat:         coords.lat,
    p_lng:         coords.lng,
    p_street:      address.street,
    p_number:      address.number,
    p_floor:       address.floor ?? undefined,
    p_apartment:   address.apartment ?? undefined,
    p_postal_code: address.postalCode ?? undefined,
    p_city:        address.city ?? undefined,
    p_province:    address.province ?? "Mendoza",
    p_country:     address.country ?? "Argentina",
  });
  if (error) throw error;
  // La RPC devuelve la fila completa (single record).
  return data as unknown as UserLocation;
}

/**
 * ¿El user ya tiene una ubicación cargada? Lo usa el authStore para decidir
 * si hay que mandarlo al onboarding de location o al home.
 */
export async function hasUserLocation(userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("user_locations")
    .select("user_id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return (count ?? 0) > 0;
}
