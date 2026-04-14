// storageService — uploads a Supabase Storage
// Capa: shared/services
// Uso: foto del profesional al crear/editar su perfil.
//
// Convención de paths:
//   professional-photos/{userId}/avatar.jpg
//   El primer segmento es el userId — la policy del bucket valida que coincida
//   con auth.uid(), por eso usamos esa estructura.

import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/shared/services/supabase";

const BUCKET = "professional-photos";

/**
 * Sube la foto del profesional. Recibe un URI local de expo-image-picker
 * y devuelve la URL pública.
 *
 * @param userId  - uid del profesional (primer segmento del path).
 * @param localUri - file://, http(s):// o data:... URL de la imagen.
 * @param client  - SupabaseClient opcional; default al singleton. En tests se
 *                  pasa un cliente autenticado para que las policies apliquen.
 */
export async function uploadProfessionalPhoto(
  userId: string,
  localUri: string,
  client: SupabaseClient = supabase,
): Promise<string> {
  console.log("[storageService::uploadProfessionalPhoto] Iniciando upload de foto — userId:", userId);
  // En RN no podemos usar `fetch(uri).blob()` directo en todos los casos,
  // pero arrayBuffer funciona bien con file:// URIs en Expo.
  // En tests (Node) pasamos data URLs que también soporta fetch nativo.
  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();
  console.log("[storageService::uploadProfessionalPhoto] ArrayBuffer listo — tamaño:", arrayBuffer.byteLength, "bytes");

  // Inferimos la extensión:
  //   1. Data URL → la sacamos del MIME type (data:image/png;base64,... → png)
  //   2. file:// o http(s):// → de la extensión en el path
  //   3. Fallback → jpg
  let ext: string;
  const dataUrlMatch = localUri.match(/^data:image\/(\w+)[;,]/i);
  if (dataUrlMatch) {
    ext = dataUrlMatch[1].toLowerCase();
  } else {
    const extMatch = localUri.match(/\.(\w+)(?:\?|$)/);
    ext = (extMatch?.[1] ?? "jpg").toLowerCase();
  }
  const path = `${userId}/avatar.${ext}`;
  console.log("[storageService::uploadProfessionalPhoto] Path destino en Storage:", `${BUCKET}/${path}`, "| contentType:", `image/${ext === "jpg" ? "jpeg" : ext}`);

  const { error: uploadError } = await client.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
      upsert: true,
    });
  if (uploadError) {
    console.error("[storageService::uploadProfessionalPhoto] Error al subir la foto →", uploadError.message);
    throw uploadError;
  }

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  console.log("[storageService::uploadProfessionalPhoto] Foto subida correctamente — URL pública:", data.publicUrl);
  return data.publicUrl;
}
