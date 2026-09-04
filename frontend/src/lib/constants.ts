import type { StatusLead } from "@/types/lead"
import type { PrioridadeLead } from "@/types/instagram"

export const LABEL_STATUS: Record<StatusLead, string> = {
  novo: "Nuevo",
  contatado: "Contactado",
  respondeu: "Respondió",
  fechou: "Cerró",
  recusou: "Rechazó",
  ignorado: "Ignorado",
}

export const COR_STATUS: Record<StatusLead, string> = {
  novo: "bg-info/15 text-info border-info/30",
  contatado: "bg-warning/15 text-warning border-warning/30",
  respondeu: "bg-status-purple/15 text-status-purple border-status-purple/30",
  fechou: "bg-success/15 text-success border-success/30",
  recusou: "bg-destructive/15 text-destructive border-destructive/30",
  ignorado: "bg-muted text-muted-foreground border-border",
}

export const LABEL_PRIORIDADE: Record<PrioridadeLead, string> = {
  alta: "Prioridad alta",
  media: "Prioridad media",
  baixa: "Prioridad baja",
  descartado: "Descartado (privado)",
}

export const COR_PRIORIDADE: Record<PrioridadeLead, string> = {
  alta: "bg-success/15 text-success border-success/30",
  media: "bg-warning/15 text-warning border-warning/30",
  baixa: "bg-muted text-muted-foreground border-border",
  descartado: "bg-destructive/10 text-destructive border-destructive/20",
}

export const OPCOES_NOTA_MINIMA = [
  { valor: "", label: "Cualquier puntuación" },
  { valor: "4", label: "Puntuación ≥ 4.0" },
  { valor: "4.5", label: "Puntuación ≥ 4.5" },
  { valor: "5", label: "Puntuación = 5.0" },
] as const

const PESO_PRIORIDADE: Record<PrioridadeLead, number> = {
  alta: 3,
  media: 2,
  baixa: 1,
  descartado: 0,
}

export type OrdenacaoPrioridade = "" | "prioridade-desc" | "prioridade-asc"

export function ordenarPorPrioridade<T extends { prioridade: PrioridadeLead | null }>(
  leads: T[],
  ordenacao: OrdenacaoPrioridade
): T[] {
  if (!ordenacao) return leads

  const sinal = ordenacao === "prioridade-desc" ? -1 : 1
  return [...leads].sort((a, b) => {
    const pesoA = a.prioridade ? PESO_PRIORIDADE[a.prioridade] : -1
    const pesoB = b.prioridade ? PESO_PRIORIDADE[b.prioridade] : -1
    return (pesoA - pesoB) * sinal
  })
}
