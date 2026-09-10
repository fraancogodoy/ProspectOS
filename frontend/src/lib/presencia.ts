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
