// Envío masivo de una plantilla de WhatsApp a los leads seleccionados, vía
// PresencIA. El loop lo maneja el frontend -un lead por vez, con ~1 s de
// pausa- para poder mostrar una barra que se llena a medida que salen. Cada
// envío es una llamada individual a la API oficial de Meta (no hay endpoint
// "masivo"), así que el límite real es el tier de mensajería de la cuenta
// (250 / 1.000 / 10.000 plantillas por 24 h según calidad).

import { useEffect, useMemo, useState } from "react"
import { Send } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePresenciaPlantillas } from "@/hooks/usePresenciaPlantillas"
import { useInvalidarLeads } from "@/hooks/useInvalidarLeads"
import { presenciaService } from "@/services/presenciaService"
import { ApiError } from "@/services/httpClient"
import { TOKEN_NOMBRE_LEAD, contarVariablesBody } from "@/lib/presencia"

interface BulkPresenciaSenderProps {
  placeIdsSelecionados: string[]
  onEnviado: () => void
}

const PAUSA_ENTRE_ENVIOS_MS = 1000
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function BulkPresenciaSender({
  placeIdsSelecionados,
  onEnviado,
}: BulkPresenciaSenderProps) {
  const [abierto, setAbierto] = useState(false)
  const { plantillas, isLoading, isError, error } = usePresenciaPlantillas()
  const invalidarLeads = useInvalidarLeads()

  const [nombrePlantilla, setNombrePlantilla] = useState("")
  // parametros[0] arranca en el token {nombre} (lo reemplaza el backend por
  // cada negocio); el resto son valores fijos, iguales para todos.
  const [parametros, setParametros] = useState<string[]>([])

  // Progreso del envío en curso.
  const [enviando, setEnviando] = useState(false)
  const [hechos, setHechos] = useState(0)
  const [fallidos, setFallidos] = useState<string[]>([])
  const [termino, setTermino] = useState(false)
  // Fase posterior: chequear cuáles se entregaron de verdad.
  const [verificando, setVerificando] = useState(false)
  const [rebotaron, setRebotaron] = useState<number | null>(null)

  const total = placeIdsSelecionados.length

  const plantilla = useMemo(
    () => plantillas.find((p) => p.name === nombrePlantilla),
    [plantillas, nombrePlantilla]
  )
  const cantidadVariables = contarVariablesBody(plantilla)

  useEffect(() => {
    if (!plantilla) return
    setParametros((anteriores) =>
      Array.from({ length: cantidadVariables }, (_, i) =>
        i === 0 ? TOKEN_NOMBRE_LEAD : anteriores[i] ?? ""
      )
    )
  }, [plantilla, cantidadVariables])

  useEffect(() => {
    if (plantillas.length === 1 && !nombrePlantilla) {
      setNombrePlantilla(plantillas[0].name)
    }
  }, [plantillas, nombrePlantilla])

  // Al cerrar el diálogo, limpia el progreso para la próxima.
  useEffect(() => {
    if (abierto) return
    setEnviando(false)
    setHechos(0)
    setFallidos([])
    setTermino(false)
    setVerificando(false)
    setRebotaron(null)
  }, [abierto])

  const demasiados = total > 100
  const puedeEnviar =
    !demasiados &&
    !enviando &&
    !verificando &&
    Boolean(plantilla) &&
    parametros.every((p) => p.trim().length > 0)

  const enviar = async () => {
    if (!plantilla) return
    setEnviando(true)
    setTermino(false)
    setHechos(0)
    setFallidos([])
    setRebotaron(null)
    const falladas: string[] = []
    const okIds: string[] = []

    for (let i = 0; i < placeIdsSelecionados.length; i++) {
      if (i > 0) await dormir(PAUSA_ENTRE_ENVIOS_MS)
      const placeId = placeIdsSelecionados[i]
      try {
        await presenciaService.enviar(placeId, {
          template_name: plantilla.name,
          language: plantilla.language,
          parameters: parametros,
        })
        okIds.push(placeId)
      } catch (err) {
        falladas.push(err instanceof ApiError ? err.message : String(err))
        setFallidos([...falladas])
      }
      setHechos(i + 1)
    }

    setEnviando(false)
    setTermino(true)
    invalidarLeads()
    const aceptados = okIds.length
    if (falladas.length === 0) {
      toast.success(`Plantilla enviada a ${aceptados} negocio(s).`)
    } else {
      toast.warning(`Enviada a ${aceptados}. No salió en ${falladas.length}.`)
    }

    // Meta acepta la plantilla al toque pero puede rechazarla al entregar
    // (ej. 131049). Ese "failed" tarda unos segundos en aparecer, así que se
    // espera y recién ahí se pregunta cuáles llegaron: los que rebotaron
    // vuelven a "novo".
    if (aceptados > 0) {
      setVerificando(true)
      await dormir(8000)
      try {
        const r = await presenciaService.reconciliar(okIds)
        setRebotaron(r.revertidos.length)
        invalidarLeads()
        if (r.revertidos.length > 0) {
          toast.warning(
            `${r.revertidos.length} no se entregaron (rebotaron) y volvieron a "nuevo".`
          )
        }
      } catch {
        // El chequeo es un extra: si falla, los envíos ya salieron igual.
      } finally {
        setVerificando(false)
      }
    }
  }

  const cerrarYlimpiar = () => {
    setAbierto(false)
    if (termino) onEnviado()
  }

  const progresoPct = total > 0 ? Math.round((hechos / total) * 100) : 0

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        // No dejar cerrar mientras manda o mientras verifica la entrega.
        if (enviando || verificando) return
        setAbierto(v)
        if (!v && termino) onEnviado()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="bg-success text-white hover:bg-success/90">
          <Send className="size-4" />
          Enviar plantilla
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar plantilla a {total} negocio(s)</DialogTitle>
          <DialogDescription>
            Se manda la misma plantilla a cada uno por su WhatsApp, vía PresencIA,
            con ~1 s de pausa entre cada envío. El saludo se personaliza con el
            nombre de cada negocio. Los que ya recibieron pasan a “contactado”.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-1">
          {demasiados && (
            <p className="text-xs text-destructive">
              Son {total} seleccionados. Mandá en tandas de hasta 100 — es lo
              sano para la calidad de un número nuevo.
            </p>
          )}
          {isError && (
            <p className="text-xs text-destructive">
              No se pudieron cargar las plantillas: {error?.message}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Plantilla aprobada</Label>
            <Select
              value={nombrePlantilla}
              onValueChange={setNombrePlantilla}
              disabled={enviando}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoading ? "Cargando plantillas..." : "Elegí una plantilla"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {plantillas.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {plantilla && cantidadVariables > 0 && (
            <div className="flex flex-col gap-1.5">
              {parametros.map((valor, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <Input
                    value={valor}
                    placeholder={`Variable {{${i + 1}}}`}
                    disabled={i === 0 || enviando}
                    onChange={(e) => {
                      const copia = [...parametros]
                      copia[i] = e.target.value
                      setParametros(copia)
                    }}
                  />
                  {i === 0 && (
                    <span className="text-xs text-muted-foreground">
                      Se reemplaza por el nombre de cada negocio.
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {(enviando || termino) && (
            <div className="flex flex-col gap-1.5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success transition-all duration-300"
                  style={{ width: `${progresoPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {hechos} de {total} enviados
                {fallidos.length > 0 && ` · ${fallidos.length} con error`}
                {termino && !verificando && " · listo"}
              </p>
              {verificando && (
                <p className="text-xs text-muted-foreground">
                  Verificando entrega… los que reboten vuelven a “nuevo”.
                </p>
              )}
              {rebotaron !== null && !verificando && (
                <p className="text-xs text-muted-foreground">
                  {rebotaron === 0
                    ? "Todos los aceptados se entregaron."
                    : `${rebotaron} rebotó/rebotaron y volvieron a “nuevo”.`}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {termino ? (
            <Button size="sm" onClick={cerrarYlimpiar} disabled={verificando}>
              {verificando ? "Verificando…" : "Cerrar"}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={enviando}
                onClick={() => setAbierto(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-success text-white hover:bg-success/90"
                disabled={!puedeEnviar}
                onClick={enviar}
              >
                {enviando ? "Enviando..." : `Enviar a ${total}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
