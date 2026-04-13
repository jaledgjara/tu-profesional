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
  console.log("[locationService::requestPermission] Solicitando permiso de ubicación foreground…");
  const { status } = await Location.requestForegroundPermissionsAsync();
  const granted = status === "granted";
  console.log("[locationService::requestPermission] Resultado:", granted ? "CONCEDIDO" : "DENEGADO", `(status: ${status})`);
  return granted;
}

export async function getCurrentCoords(): Promise<Coords> {
  console.log("[locationService::getCurrentCoords] Obteniendo posición GPS (accuracy: Balanced)…");
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
  console.log("[locationService::getCurrentCoords] Coordenadas obtenidas →", `lat: ${coords.lat}, lng: ${coords.lng}`, `| precisión: ${pos.coords.accuracy?.toFixed(0) ?? "?"} m`);
  return coords;
}

/**
 * Reverse geocode usando el provider nativo (gratis, sin API key).
 * Devuelve `null` si el OS no logra resolver la dirección.
 */
export async function reverseGeocode(coords: Coords): Promise<Partial<AddressFields> | null> {
  console.log("[locationService::reverseGeocode] Reverse geocoding →", `lat: ${coords.lat}, lng: ${coords.lng}`);
  const results = await Location.reverseGeocodeAsync({
    latitude:  coords.lat,
    longitude: coords.lng,
  });
  const r = results[0];
  if (!r) {
    console.warn("[locationService::reverseGeocode] El OS no pudo resolver la dirección para estas coordenadas.");
    return null;
  }
  const address = {
    street:     r.street ?? "",
    number:     r.streetNumber ?? "",
    postalCode: r.postalCode ?? "",
    city:       r.city ?? r.subregion ?? "",
    province:   r.region ?? "Mendoza",
    country:    r.country ?? "Argentina",
  };
  console.log("[locationService::reverseGeocode] Dirección resuelta →", `${address.street} ${address.number}, ${address.city}, ${address.province}`);
  return address;
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

  console.log("[locationService::geocodeAddress] Forward geocoding query →", `"${query}"`);
  const results = await Location.geocodeAsync(query);
  const r = results[0];
  if (!r) {
    console.warn("[locationService::geocodeAddress] No se encontraron coordenadas para la dirección ingresada.");
    return null;
  }
  const coords = { lat: r.latitude, lng: r.longitude };
  console.log("[locationService::geocodeAddress] Coordenadas resueltas →", `lat: ${coords.lat}, lng: ${coords.lng}`);
  return coords;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENCIA — RPC upsert_user_location
// ─────────────────────────────────────────────────────────────────────────────

export async function upsertUserLocation(
  coords: Coords,
  address: AddressFields,
): Promise<UserLocation> {
  console.log("[locationService::upsertUserLocation] Llamando RPC upsert_user_location →", `lat: ${coords.lat}, lng: ${coords.lng} | ${address.street} ${address.number}, ${address.city ?? "—"}, ${address.province ?? "Mendoza"}`);
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
  if (error) {
    console.error("[locationService::upsertUserLocation] Error en RPC →", error.message);
    throw error;
  }
  console.log("[locationService::upsertUserLocation] Ubicación persistida correctamente.");
  // La RPC devuelve la fila completa (single record).
  return data as unknown as UserLocation;
}

/**
 * ¿El user ya tiene una ubicación cargada? Lo usa el authStore para decidir
 * si hay que mandarlo al onboarding de location o al home.
 */
export async function hasUserLocation(userId: string): Promise<boolean> {
  console.log("[locationService::hasUserLocation] Verificando si userId tiene ubicación →", userId);
  const { count, error } = await supabase
    .from("user_locations")
    .select("user_id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) {
    console.error("[locationService::hasUserLocation] Error de Supabase →", error.message);
    throw error;
  }
  const has = (count ?? 0) > 0;
  console.log("[locationService::hasUserLocation] Resultado:", has ? "SÍ tiene ubicación" : "NO tiene ubicación", `(count: ${count})`);
  return has;
}
