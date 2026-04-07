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
