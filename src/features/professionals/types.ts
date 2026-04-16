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
