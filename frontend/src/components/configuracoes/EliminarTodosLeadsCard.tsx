import { useState } from "react"
import { AlertTriangle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { httpClient, ApiError } from "@/services/httpClient"
import { useInvalidarLeads } from "@/hooks/useInvalidarLeads"

const FRASE_CONFIRMACION = "ELIMINAR TODO"

/** Borra TODOS los leads de Maps (con su historial y conversaciones) de una
 * sola vez - pensado para vaciar una base de prueba y arrancar de cero, no
 * para el uso normal (para eso está "Ignorar"/"Eliminar" lead por lead). No
 * hay vuelta atrás: por eso pide escribir la frase exacta antes de habilitar
 * el botón, en vez de un simple sí/no. */
export function EliminarTodosLeadsCard() {
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState("")
  const queryClient = useQueryClient()
  const invalidarListaEMetricas = useInvalidarLeads()

  const eliminarTodos = useMutation({
    mutationFn: () =>
      httpClient.delete<{ ok: true; eliminados: number }>("/api/leads", {
        confirmar: texto,
      }),
    onSuccess: (resultado) => {
      toast.success(`Se eliminaron ${resultado.eliminados} lead(s).`)
      invalidarListaEMetricas()
      queryClient.invalidateQueries({ queryKey: ["nichos"] })
      queryClient.invalidateQueries({ queryKey: ["campanas"] })
      setAbierto(false)
      setTexto("")
    },
    onError: (erro) => {
      toast.error(erro instanceof ApiError ? erro.message : "Error al eliminar.")
    },
  })

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-destructive" />
        <h3 className="font-medium text-destructive">Zona de peligro</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Elimina todos los leads de Google Maps de una vez, junto con su
        historial y conversaciones. No se puede deshacer. No afecta a los
        leads de Instagram ni a tu configuración.
      </p>

      <AlertDialog open={abierto} onOpenChange={setAbierto}>
        <Button
          variant="outline"
          size="sm"
          className="w-fit text-destructive hover:bg-destructive/10"
          onClick={() => setAbierto(true)}
        >
          <Trash2 className="size-4" />
          Eliminar todos los leads
        </Button>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar todos los leads de Maps?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto borra para siempre todos los leads, su historial y sus
              conversaciones guardadas. No hay forma de deshacerlo. Para
              confirmar, escribí exactamente <strong>{FRASE_CONFIRMACION}</strong>{" "}
              abajo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={FRASE_CONFIRMACION}
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTexto("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={texto !== FRASE_CONFIRMACION || eliminarTodos.isPending}
              onClick={(e) => {
                e.preventDefault()
                eliminarTodos.mutate()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminarTodos.isPending ? "Eliminando..." : "Eliminar todo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
