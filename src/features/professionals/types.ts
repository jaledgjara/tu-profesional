// Tipo compartido Professional — mapeado desde el schema de Supabase.
// Las queries PostGIS devuelven distanceM como campo calculado.

export interface Professional {
  id:           string;
  name:         string;
  title:        string;        // "Psicóloga clínica"
  specialty:    string;        // "Psicología Cognitivo-Conductual"
  zone:         string;        // "Godoy Cruz, Mendoza"
  imageUrl:     string | null;
  tags:         string[];      // ["ADULTOS", "TCC", "ONLINE"]
  rating:       number;
  reviewCount:  number;
  distanceM:    number;        // metros — calculado por PostGIS, nunca en cliente
  isAvailable:  boolean;
  phone:        string;        // formato internacional sin + → "5492614001234"
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos para RPCs de listado (nearby, search, by-area).
// Mapean las columnas snake_case de PostgreSQL a camelCase del cliente.
// Los campos opcionales existen solo en algunos RPCs:
//   - category: nearby + search (by-area no lo devuelve)
//   - quote/quoteAuthor/attendsOnline/attendsPresencial: solo nearby
// ─────────────────────────────────────────────────────────────────────────────

export interface ProfessionalListItem {
  id:                 string;
  fullName:           string;
  category?:          string;        // "Psicóloga clínica" — nearby y search
  specialty:          string;        // "Psicología Cognitivo-Conductual"
  subSpecialties:     string[];      // ["Ansiedad", "Depresión"]
  professionalArea:   string[];      // ["tcc", "psicologia_infantil"]
  description:        string;
  quote?:             string;        // solo nearby
  quoteAuthor?:       string;        // solo nearby
  attendsOnline?:     boolean;       // solo nearby
  attendsPresencial?: boolean;       // solo nearby
  photoUrl:           string | null;
  city:               string;        // "Godoy Cruz, Mendoza"
  distanceM:          number;        // metros — calculado por PostGIS
}

/** Cursor para keyset pagination — par (distanceM, id) del último item. */
export interface ProfessionalCursor {
  distanceM: number;
  id:        string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipo para la pantalla de detalle del profesional.
// Combina datos de la tabla `professionals` + RPC `get_professional_location`.
// Incluye todos los campos: socials, modalidad, quote, dirección con lat/lng.
// ─────────────────────────────────────────────────────────────────────────────

export interface ProfessionalAddress {
  street:      string;
  number:      string;
  floor:       string | null;
  apartment:   string | null;
  postalCode:  string | null;
  city:        string | null;
  province:    string | null;
  country:     string | null;
  lat:         number;
  lng:         number;
}

export interface ProfessionalDetail {
  id:                 string;
  fullName:           string;
  category:           string;
  specialty:          string | null;
  subSpecialties:     string[];
  professionalArea:   string[];
  description:        string | null;
  quote:              string | null;
  quoteAuthor:        string | null;
  attendsOnline:      boolean;
  attendsPresencial:  boolean;
  photoUrl:           string | null;
  phone:              string | null;
  // Redes sociales — null si el profesional no las cargó
  socialWhatsapp:     string | null;
  socialInstagram:    string | null;
  socialLinkedin:     string | null;
  socialTwitter:      string | null;
  socialTiktok:       string | null;
  // Ubicación del consultorio (de get_professional_location RPC)
  address:            ProfessionalAddress | null;
  // Distancia al usuario — pasada como route param desde la lista
  distanceM?:         number;
}
