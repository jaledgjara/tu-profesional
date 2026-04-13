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
  console.log("[storageService::uploadProfessionalPhoto] Iniciando upload de foto — userId:", userId);
  // En RN no podemos usar `fetch(uri).blob()` directo en todos los casos,
  // pero arrayBuffer funciona bien con file:// URIs en Expo.
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();
  console.log("[storageService::uploadProfessionalPhoto] ArrayBuffer listo — tamaño:", arrayBuffer.byteLength, "bytes");

  // Inferimos extensión del URI (jpg por default).
  const extMatch = localUri.match(/\.(\w+)(?:\?|$)/);
  const ext = (extMatch?.[1] ?? "jpg").toLowerCase();
  const path = `${userId}/avatar.${ext}`;
  console.log("[storageService::uploadProfessionalPhoto] Path destino en Storage:", `${BUCKET}/${path}`, "| contentType:", `image/${ext === "jpg" ? "jpeg" : ext}`);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
      upsert: true,
    });
  if (uploadError) {
    console.error("[storageService::uploadProfessionalPhoto] Error al subir la foto →", uploadError.message);
    throw uploadError;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  console.log("[storageService::uploadProfessionalPhoto] Foto subida correctamente — URL pública:", data.publicUrl);
  return data.publicUrl;
}
