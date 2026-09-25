// Envío masivo de una plantilla de WhatsApp a los leads seleccionados, vía
// PresencIA. No manda nada acá: arma la cola del servidor, que saca uno cada
// 3 a 5 min al azar para que Meta no lo lea como spam (ver
// backend/cola_envios.py). El avance se sigue en ColaEnviosBanner, arriba de
// la lista. Aparte del ritmo, el límite real sigue siendo el tier de
// mensajería de la cuenta (250 / 1.000 / 10.000 plantillas por 24 h).

import { useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
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
import { usePresenciaHeader } from "@/hooks/usePresenciaHeader"
import { useInvalidarLeads } from "@/hooks/useInvalidarLeads"
import { presenciaService } from "@/services/presenciaService"
import { TOKEN_NOMBRE_LEAD, contarVariablesBody, formatoHeaderMedia } from "@/lib/presencia"

interface BulkPresenciaSenderProps {
  placeIdsSelecionados: string[]
  onEnviado: () => void
}

type EstadoCola = Awaited<ReturnType<typeof presenciaService.estadoCola>>

export function BulkPresenciaSender({
  placeIdsSelecionados,
  onEnviado,
}: BulkPresenciaSenderProps) {
  const [abierto, setAbierto] = useState(false)
  const { plantillas, isLoading, isError, error } = usePresenciaPlantillas()
  const invalidarLeads = useInvalidarLeads()
  const queryClient = useQueryClient()

  const [nombrePlantilla, setNombrePlantilla] = useState("")
  // parametros[0] arranca en el token {nombre} (lo reemplaza el backend por
  // cada negocio); el resto son valores fijos, iguales para todos.
  const [parametros, setParametros] = useState<string[]>([])

  const [encolando, setEncolando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [loteId, setLoteId] = useState<string | null>(null)
  const [cola, setCola] = useState<EstadoCola | null>(null)

  const total = placeIdsSelecionados.length

  const plantilla = useMemo(
    () => plantillas.find((p) => p.name === nombrePlantilla),
    [plantillas, nombrePlantilla]
  )
  const cantidadVariables = contarVariablesBody(plantilla)
  const formatoHeader = formatoHeaderMedia(plantilla)
  const { estado: headerEstado, isLoading: cargandoHeader } = usePresenciaHeader(
    formatoHeader ? plantilla?.name : undefined
  )
  const faltaHeader = Boolean(formatoHeader) && !cargandoHeader && !headerEstado?.existe

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
    setEncolando(false)
    setCancelando(false)
    setLoteId(null)
    setCola(null)
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    const actualizar = () => {
      presenciaService.estadoCola().then(setCola).catch(() => undefined)
    }
    actualizar()
    const intervalo = window.setInterval(actualizar, 10_000)
    return () => window.clearInterval(intervalo)
  }, [abierto])

  const demasiados = total > 100
  const puedeEnviar =
    !demasiados &&
    !encolando &&
    Boolean(plantilla) &&
    parametros.every((p) => p.trim().length > 0) &&
    !faltaHeader

  const encolar = async () => {
    if (!plantilla) return
    setEncolando(true)
    try {
      const resultado = await presenciaService.encolar({
        place_ids: placeIdsSelecionados,
        template_name: plantilla.name,
        language: plantilla.language,
        parameters: parametros,
      })
      setLoteId(resultado.lote_id)
      setCola(await presenciaService.estadoCola())
      invalidarLeads()
      queryClient.invalidateQueries({ queryKey: ["cola-envios"] })
      toast.success(
        `${resultado.encolados} negocio(s) en cola. Tiempo estimado: ${resultado.minutos_estimados} min.`
      )
      if (resultado.omitidos > 0) {
        toast.info(`${resultado.omitidos} ya estaba(n) esperando en la cola.`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la cola.")
    } finally {
      setEncolando(false)
    }
  }

  const cancelar = async () => {
    if (!loteId) return
    setCancelando(true)
    try {
      const resultado = await presenciaService.cancelarCola(loteId)
      setCola(await presenciaService.estadoCola())
      toast.info(`${resultado.cancelados} envío(s) pendiente(s) cancelado(s).`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cancelar la cola.")
    } finally {
      setCancelando(false)
    }
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        if (encolando || cancelando) return
        setAbierto(v)
        if (!v && loteId) onEnviado()
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
            La cola manda una plantilla aprobada por vez, con una pausa variable de
            3 a 5 minutos. Podés cerrar esta ventana: el proceso continúa en el servidor.
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
              disabled={encolando || Boolean(loteId)}
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

          {faltaHeader && (
            <p className="text-xs text-destructive">
              Esta plantilla lleva un{" "}
              {formatoHeader === "VIDEO" ? "video" : formatoHeader === "IMAGE" ? "imagen" : "documento"} de
              encabezado y todavía no lo cargaste.{" "}
              <Link to="/configuracoes" className="underline" target="_blank">
                Cargalo en Configuración
              </Link>{" "}
              antes de mandar.
            </p>
          )}

          {plantilla && cantidadVariables > 0 && (
            <div className="flex flex-col gap-1.5">
              {parametros.map((valor, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <Input
                    value={valor}
                    placeholder={`Variable {{${i + 1}}}`}
                    disabled={i === 0 || encolando || Boolean(loteId)}
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

          {cola && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">
                Cola: {cola.pendientes} pendiente(s) · {cola.enviados} enviado(s)
                {cola.fallidos > 0 && ` · ${cola.fallidos} con error`}
              </p>
              {cola.segundos_para_proximo !== null && cola.pendientes > 0 && (
                <p className="text-xs text-muted-foreground">
                  Próximo envío en aproximadamente {Math.ceil(cola.segundos_para_proximo / 60)} min.
                </p>
              )}
              {cola.lista_fallidos.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Hay envíos que fallaron; revisalos antes de volver a intentarlo.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {loteId ? (
            <>
              <Button size="sm" variant="outline" onClick={cancelar} disabled={cancelando}>
                {cancelando ? "Cancelando…" : "Cancelar pendientes"}
              </Button>
              <Button size="sm" onClick={() => setAbierto(false)} disabled={cancelando}>
                Cerrar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={encolando}
                onClick={() => setAbierto(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-success text-white hover:bg-success/90"
                disabled={!puedeEnviar}
                onClick={encolar}
              >
                {encolando ? "Agregando..." : `Agregar ${total} a la cola`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
