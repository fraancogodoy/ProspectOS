// Aviso fijo de la cola de envío masivo (una plantilla cada 3-5 min, ver
// backend/cola_envios.py). La cola corre horas en el servidor: sin esto, al
// cerrar el diálogo de envío no había forma de ver cuánto faltaba ni de
// frenarla.

import { useEffect, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Clock, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useInvalidarLeads } from "@/hooks/useInvalidarLeads"
import { presenciaService } from "@/services/presenciaService"
import { ApiError } from "@/services/httpClient"

function textoProximo(segundos: number | null) {
  if (segundos === null || segundos < 60) return "en instantes"
  return `en ~${Math.ceil(segundos / 60)} min`
}

export function ColaEnviosBanner() {
  const queryClient = useQueryClient()
  const invalidarLeads = useInvalidarLeads()
  const [cancelando, setCancelando] = useState(false)

  const { data: cola } = useQuery({
    queryKey: ["cola-envios"],
    queryFn: presenciaService.estadoCola,
    // Mientras corre se mira seguido; parada, alcanza con enterarse de vez en
    // cuando si alguien armó una cola desde otra pestaña.
    refetchInterval: (query) => (query.state.data?.activo ? 15_000 : 60_000),
    refetchIntervalInBackground: true,
  })

  // Cada envío pasa el lead a "contactado": se refresca la lista cuando sube
  // el contador, y se avisa una sola vez cuando la cola termina.
  const anterior = useRef<{ activo: boolean; enviados: number } | null>(null)
  useEffect(() => {
    if (!cola) return
    const previo = anterior.current
    if (previo && cola.enviados !== previo.enviados) invalidarLeads()
    if (previo?.activo && !cola.activo) {
      invalidarLeads()
      if (cola.fallidos > 0) {
        toast.warning(`Cola terminada: ${cola.enviados} enviado(s), ${cola.fallidos} con error.`)
      } else {
        toast.success(`Cola terminada: ${cola.enviados} plantilla(s) enviada(s).`)
      }
    }
    anterior.current = { activo: cola.activo, enviados: cola.enviados }
  }, [cola, invalidarLeads])

  if (!cola?.activo) return null

  const hechos = cola.enviados + cola.fallidos
  const pct = cola.total > 0 ? Math.round((hechos / (hechos + cola.pendientes)) * 100) : 0

  const cancelar = async () => {
    setCancelando(true)
    try {
      const r = await presenciaService.cancelarCola()
      toast.info(`${r.cancelados} envío(s) pendiente(s) cancelado(s).`)
      await queryClient.invalidateQueries({ queryKey: ["cola-envios"] })
    } catch (erro) {
      toast.error(erro instanceof ApiError ? erro.message : "No se pudo cancelar la cola.")
    } finally {
      setCancelando(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-success/40 bg-success/5 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Clock className="size-4 shrink-0 text-success" />
          Enviando plantillas: {hechos} de {hechos + cola.pendientes}
          <span className="font-normal text-muted-foreground">
            · próximo {textoProximo(cola.segundos_para_proximo)}
            {cola.fallidos > 0 && ` · ${cola.fallidos} con error`}
          </span>
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-success transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Una cada 3 a 5 minutos, al azar, para que Meta no lo tome como spam. Sigue
          aunque cierres la página.
        </p>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="shrink-0" disabled={cancelando}>
            {cancelando ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
            Cancelar pendientes
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar los {cola.pendientes} envío(s) pendiente(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Los que ya salieron no se tocan. Los pendientes no se mandan, y podés volver
              a armar la cola cuando quieras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir enviando</AlertDialogCancel>
            <AlertDialogAction onClick={cancelar}>Cancelar pendientes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
