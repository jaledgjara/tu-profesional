// storageService — uploads a Supabase Storage
// Capa: shared/services
// Uso: foto del profesional al crear/editar su perfil.
//
// Convención de paths:
//   professional-photos/{userId}/avatar.jpg
//   El primer segmento es el userId — la policy del bucket valida que coincida
//   con auth.uid(), por eso usamos esa estructura.

import { supabase } from "@/shared/services/supabase";

const BUCKET = "professional-photos";

/**
 * Sube la foto del profesional. Recibe un URI local de expo-image-picker
 * y devuelve la URL pública.
 */
export async function uploadProfessionalPhoto(
  userId: string,
  localUri: string,
): Promise<string> {
  // En RN no podemos usar `fetch(uri).blob()` directo en todos los casos,
  // pero arrayBuffer funciona bien con file:// URIs en Expo.
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  // Inferimos extensión del URI (jpg por default).
  const extMatch = localUri.match(/\.(\w+)(?:\?|$)/);
  const ext = (extMatch?.[1] ?? "jpg").toLowerCase();
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
