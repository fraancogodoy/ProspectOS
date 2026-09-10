// Manda al lead una plantilla de WhatsApp ya aprobada por Meta, disparando el
// envío a través del PresencIA (bot propio). El contacto se crea allá con el
// nombre real del lead antes de mandar el mensaje, así la conversación entra
// identificada al panel y no como un número pelado - ver
// backend/rotas_leads.py:/api/leads/<place_id>/presencia/enviar.

import { useEffect, useMemo, useState } from "react"
import { Send } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePresenciaPlantillas } from "@/hooks/usePresenciaPlantillas"
import { contarVariablesBody } from "@/lib/presencia"
import { formatarTempoRelativo } from "@/lib/formatters"
import type { UseMutationResult } from "@tanstack/react-query"
import type { Lead } from "@/types/lead"

interface LeadPresenciaSenderProps {
  lead: Lead
  enviarPresencia: UseMutationResult<
    unknown,
    Error,
    { template_name: string; language: string; parameters: string[] },
    unknown
  >
  // Cerrar la ficha del negocio apenas sale el envío.
  onEnviado?: () => void
}

export function LeadPresenciaSender({ lead, enviarPresencia, onEnviado }: LeadPresenciaSenderProps) {
  const { plantillas, isLoading, isError, error } = usePresenciaPlantillas()
  const [nombrePlantilla, setNombrePlantilla] = useState("")
  const [parametros, setParametros] = useState<string[]>([])

  const plantilla = useMemo(
    () => plantillas.find((p) => p.name === nombrePlantilla),
    [plantillas, nombrePlantilla]
  )
  const cantidadVariables = contarVariablesBody(plantilla)

  // Al elegir (o cambiar de) plantilla, precarga la primera variable con el
  // nombre del lead - es lo que casi siempre pide el saludo - y deja el resto
  // vacío para completar a mano.
  useEffect(() => {
    if (!plantilla) return
    setParametros((anteriores) =>
      Array.from({ length: cantidadVariables }, (_, i) =>
        i === 0 ? lead.nome : anteriores[i] ?? ""
      )
    )
  }, [plantilla, cantidadVariables, lead.nome])

  useEffect(() => {
    if (plantillas.length === 1 && !nombrePlantilla) {
      setNombrePlantilla(plantillas[0].name)
    }
  }, [plantillas, nombrePlantilla])

  if (!lead.whatsapp_link) return null

  const puedeEnviar = Boolean(plantilla) && parametros.every((p) => p.trim().length > 0)

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <Label>Enviar plantilla de WhatsApp (vía PresencIA)</Label>

      {isError && (
        <p className="text-xs text-destructive">
          No se pudieron cargar las plantillas: {error?.message}
        </p>
      )}

      <Select value={nombrePlantilla} onValueChange={setNombrePlantilla}>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Cargando plantillas..." : "Elegí una plantilla aprobada"} />
        </SelectTrigger>
        <SelectContent>
          {plantillas.map((p) => (
            <SelectItem key={p.name} value={p.name}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {plantilla && cantidadVariables > 0 && (
        <div className="flex flex-col gap-1.5">
          {parametros.map((valor, i) => (
            <Input
              key={i}
              value={valor}
              placeholder={`Variable {{${i + 1}}}`}
              onChange={(e) => {
                const copia = [...parametros]
                copia[i] = e.target.value
                setParametros(copia)
              }}
            />
          ))}
        </div>
      )}

      <Button
        size="sm"
        className="self-start bg-success text-white hover:bg-success/90"
        disabled={!puedeEnviar || enviarPresencia.isPending}
        onClick={() =>
          plantilla &&
          enviarPresencia.mutate(
            {
              template_name: plantilla.name,
              language: plantilla.language,
              parameters: parametros,
            },
            { onSuccess: () => onEnviado?.() }
          )
        }
      >
        <Send className="size-4" />
        {enviarPresencia.isPending ? "Enviando..." : "Enviar por PresencIA"}
      </Button>

      {lead.contatado_em && (
        <p className="text-xs text-muted-foreground">
          Último contacto por PresencIA: {formatarTempoRelativo(lead.contatado_em)}
        </p>
      )}
    </div>
  )
}
