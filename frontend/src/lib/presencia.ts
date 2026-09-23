import type { PresenciaPlantilla } from "@/types/lead"

// Token que el backend reemplaza por el nombre de cada negocio en el envío
// masivo (ver backend/rotas_leads.py). En un envío individual se usa el
// nombre real directamente.
export const TOKEN_NOMBRE_LEAD = "{nombre}"

// Cuenta las variables {{1}}, {{2}}... del body - es el único componente de
// una plantilla de marketing que lleva texto libre por variable.
export function contarVariablesBody(plantilla: PresenciaPlantilla | undefined): number {
  const body = plantilla?.components.find((c) => c.type === "BODY")
  if (!body?.text) return 0
  const matches = body.text.match(/\{\{\d+\}\}/g)
  return matches ? new Set(matches).size : 0
}

// Si la plantilla lleva un header de imagen/video/documento, ese archivo NO
// queda guardado en la plantilla - Meta lo pide de nuevo en cada envío. Sin
// eso, el envío sale rechazado con (#132012) "Parameter format does not
// match" (ver backend/presencia.py). Un header de tipo TEXT no cuenta: ese sí
// vive en la plantilla, no hace falta volver a mandarlo.
export function formatoHeaderMedia(
  plantilla: PresenciaPlantilla | undefined
): "IMAGE" | "VIDEO" | "DOCUMENT" | null {
  const header = plantilla?.components.find((c) => c.type === "HEADER")
  if (!header?.format || header.format === "TEXT") return null
  return header.format as "IMAGE" | "VIDEO" | "DOCUMENT"
}
