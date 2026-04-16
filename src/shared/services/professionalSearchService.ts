// Service: professionalSearchService
// Capa: shared/services (función pura, sin React, sin estado)
//
// Conecta el cliente con las 4 RPCs de descubrimiento de profesionales:
//   - nearby_professionals   (migración 0008)
//   - search_professionals   (migración 0009)
//   - professionals_by_area  (migración 0010)
//   - count_professionals_by_area (migración 0010)
//
// Los tipos de Args y Returns se derivan de Database (database.ts regenerado).
// No necesitamos tipos manuales ni casts `as never`.

import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/shared/services/supabase";
import type {
  ProfessionalListItem,
  ProfessionalDetail,
  ProfessionalAddress,
} from "@/features/professionals/types";
import type { Database } from "@/shared/types/database";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS derivados de database.ts — fuente de verdad automática
// ─────────────────────────────────────────────────────────────────────────────

type DbFunctions = Database["public"]["Functions"];

type NearbyRow = DbFunctions["nearby_professionals"]["Returns"][number];
type SearchRow = DbFunctions["search_professionals"]["Returns"][number];
type AreaRow   = DbFunctions["professionals_by_area"]["Returns"][number];

type TypedClient = SupabaseClient<Database>;

// ─────────────────────────────────────────────────────────────────────────────
// MAPPERS (privados) — snake_case de PostgreSQL → camelCase del cliente
// ─────────────────────────────────────────────────────────────────────────────

function mapNearbyRow(row: NearbyRow): ProfessionalListItem {
  return {
    id:                row.id,
    fullName:          row.full_name,
    category:          row.category,
    specialty:         row.specialty,
    subSpecialties:    row.sub_specialties ?? [],
    professionalArea:  row.professional_area ?? [],
    description:       row.description,
    quote:             row.quote,
    quoteAuthor:       row.quote_author,
    attendsOnline:     row.attends_online,
    attendsPresencial: row.attends_presencial,
    photoUrl:          row.photo_url,
    city:              row.city,
    distanceM:         row.distance_m,
  };
}

function mapSearchRow(row: SearchRow): ProfessionalListItem {
  return {
    id:               row.id,
    fullName:         row.full_name,
    category:         row.category,
    specialty:        row.specialty,
    subSpecialties:   row.sub_specialties ?? [],
    professionalArea: row.professional_area ?? [],
    description:      row.description,
    photoUrl:         row.photo_url,
    city:             row.city,
    distanceM:        row.distance_m,
  };
}

function mapAreaRow(row: AreaRow): ProfessionalListItem {
  return {
    id:               row.id,
    fullName:         row.full_name,
    specialty:        row.specialty,
    subSpecialties:   row.sub_specialties ?? [],
    professionalArea: row.professional_area ?? [],
    description:      row.description,
    photoUrl:         row.photo_url,
    city:             row.city,
    distanceM:        row.distance_m,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// RPC 1 — nearby_professionals
// Devuelve profesionales activos dentro de un radio, ordenados por distancia.
// Usa cursor (distance_m, id) para paginación keyset.
// ─────────────────────────────────────────────────────────────────────────────

export interface NearbyParams {
  lat:              number;
  lng:              number;
  radiusM?:         number;       // default 10 000 m (10 km)
  limit?:           number;       // default 10
  cursorDistanceM?: number | null;
  cursorId?:        string | null;
}

export async function fetchNearbyProfessionals(
  params: NearbyParams,
  client: TypedClient = supabase,
): Promise<ProfessionalListItem[]> {
  const { data, error } = await client.rpc("nearby_professionals", {
    p_user_lat:          params.lat,
    p_user_lng:          params.lng,
    p_radius_m:          params.radiusM ?? 10_000,
    p_limit:             params.limit ?? 10,
    p_cursor_distance_m: params.cursorDistanceM ?? undefined,
    p_cursor_id:         params.cursorId ?? undefined,
  });

  if (error) throw error;

  return (data ?? []).map(mapNearbyRow);
}

// ─────────────────────────────────────────────────────────────────────────────
// RPC 2 — search_professionals
// Búsqueda full-text (tsvector) + fuzzy (pg_trgm) + filtro por área.
// Ordenado por distancia al usuario. Cursor keyset.
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchParams {
  query:            string;
  lat:              number;
  lng:              number;
  limit?:           number;       // default 20
  cursorDistanceM?: number | null;
  cursorId?:        string | null;
  areaFilter?:      string[] | null;
}

export async function searchProfessionals(
  params: SearchParams,
  client: TypedClient = supabase,
): Promise<ProfessionalListItem[]> {
  const { data, error } = await client.rpc("search_professionals", {
    p_query:             params.query,
    p_user_lat:          params.lat,
    p_user_lng:          params.lng,
    p_limit:             params.limit ?? 20,
    p_cursor_distance_m: params.cursorDistanceM ?? undefined,
    p_cursor_id:         params.cursorId ?? undefined,
    p_area_filter:       params.areaFilter ?? undefined,
  });

  if (error) throw error;

  return (data ?? []).map(mapSearchRow);
}

// ─────────────────────────────────────────────────────────────────────────────
// RPC 3 — professionals_by_area
// Profesionales de un área específica, ordenados por distancia. Cursor keyset.
// ─────────────────────────────────────────────────────────────────────────────

export interface ByAreaParams {
  areaSlug:         string;
  lat:              number;
  lng:              number;
  limit?:           number;       // default 20
  cursorDistanceM?: number | null;
  cursorId?:        string | null;
}

export async function fetchProfessionalsByArea(
  params: ByAreaParams,
  client: TypedClient = supabase,
): Promise<ProfessionalListItem[]> {
  const { data, error } = await client.rpc("professionals_by_area", {
    p_area_slug:         params.areaSlug,
    p_user_lat:          params.lat,
    p_user_lng:          params.lng,
    p_limit:             params.limit ?? 20,
    p_cursor_distance_m: params.cursorDistanceM ?? undefined,
    p_cursor_id:         params.cursorId ?? undefined,
  });

  if (error) throw error;

  return (data ?? []).map(mapAreaRow);
}

// ─────────────────────────────────────────────────────────────────────────────
// RPC 4 — count_professionals_by_area
// Devuelve cuántos profesionales activos hay por cada área.
// Retorna un mapa slug → count para lookup O(1) en SpecialtyCard.
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchAreaCounts(
  client: TypedClient = supabase,
): Promise<Record<string, number>> {
  const { data, error } = await client.rpc("count_professionals_by_area");

  if (error) throw error;

  const rows = data ?? [];
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.area_slug] = row.n;
  }
  return counts;
}

// ─────────────────────────────────────────────────────────────────────────────
// DETALLE — fetchProfessionalDetail
// Combina query a tabla `professionals` + RPC `get_professional_location`.
// Retorna ProfessionalDetail con todos los campos para la pantalla de perfil.
// ─────────────────────────────────────────────────────────────────────────────

type ProfessionalRow = Database["public"]["Tables"]["professionals"]["Row"];
type LocationRow = DbFunctions["get_professional_location"]["Returns"][number];

function mapLocationRow(row: LocationRow): ProfessionalAddress {
  return {
    street:     row.street,
    number:     row.number,
    floor:      row.floor,
    apartment:  row.apartment,
    postalCode: row.postal_code,
    city:       row.city,
    province:   row.province,
    country:    row.country,
    lat:        row.lat,
    lng:        row.lng,
  };
}

function mapProfessionalRow(
  row: ProfessionalRow,
  address: ProfessionalAddress | null,
  distanceM?: number,
): ProfessionalDetail {
  return {
    id:                row.id,
    fullName:          row.full_name ?? "",
    category:          row.category,
    specialty:         row.specialty,
    subSpecialties:    row.sub_specialties ?? [],
    professionalArea:  row.professional_area ?? [],
    description:       row.description,
    quote:             row.quote,
    quoteAuthor:       row.quote_author,
    attendsOnline:     row.attends_online,
    attendsPresencial: row.attends_presencial,
    photoUrl:          row.photo_url,
    phone:             row.phone,
    socialWhatsapp:    row.social_whatsapp,
    socialInstagram:   row.social_instagram,
    socialLinkedin:    row.social_linkedin,
    socialTwitter:     row.social_twitter,
    socialTiktok:      row.social_tiktok,
    address,
    distanceM,
  };
}

export async function fetchProfessionalDetail(
  professionalId: string,
  distanceM?: number,
  client: TypedClient = supabase,
): Promise<ProfessionalDetail> {
  // Dos queries en paralelo: perfil + ubicación
  const [profileResult, locationResult] = await Promise.all([
    client
      .from("professionals")
      .select("*")
      .eq("id", professionalId)
      .single(),
    client.rpc("get_professional_location", {
      p_professional_id: professionalId,
    }),
  ]);

  if (profileResult.error) throw profileResult.error;

  // La ubicación puede no existir (profesional nuevo sin dirección cargada)
  const locationRows = locationResult.data ?? [];
  const address = locationRows.length > 0
    ? mapLocationRow(locationRows[0])
    : null;

  return mapProfessionalRow(profileResult.data, address, distanceM);
}
