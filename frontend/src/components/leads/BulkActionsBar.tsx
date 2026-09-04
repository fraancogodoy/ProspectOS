import { motion } from "framer-motion"
import { Trash2, X } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBulkMutations } from "@/hooks/useBulkMutations"
import { LABEL_STATUS } from "@/lib/constants"
import { STATUS_VALIDOS, type StatusLead } from "@/types/lead"

interface BulkActionsBarProps {
  placeIdsSelecionados: string[]
  onLimparSelecao: () => void
  modoIgnorados?: boolean
}

export function BulkActionsBar({
  placeIdsSelecionados,
  onLimparSelecao,
  modoIgnorados = false,
}: BulkActionsBarProps) {
  const { atualizarStatusEmLote, ignorarEmLote, excluirEmLoteDefinitivamente } =
    useBulkMutations()

  const handleMudarStatus = (status: StatusLead) => {
    atualizarStatusEmLote.mutate(
      { placeIds: placeIdsSelecionados, status },
      { onSuccess: onLimparSelecao }
    )
  }

  const handleExcluir = () => {
    if (modoIgnorados) {
      excluirEmLoteDefinitivamente.mutate(placeIdsSelecionados, {
        onSuccess: onLimparSelecao,
      })
    } else {
      ignorarEmLote.mutate(placeIdsSelecionados, { onSuccess: onLimparSelecao })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 shadow-lg"
    >
      <span className="text-sm font-medium">
        {placeIdsSelecionados.length} seleccionado(s)
      </span>

      {!modoIgnorados && (
        <Select onValueChange={(v) => handleMudarStatus(v as StatusLead)}>
          <SelectTrigger className="h-8 w-[160px]">
            <SelectValue placeholder="Cambiar estado" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_VALIDOS.filter((s) => s !== "ignorado").map((status) => (
              <SelectItem key={status} value={status}>
                {LABEL_STATUS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10">
            <Trash2 className="size-4" />
            {modoIgnorados ? "Eliminar definitivamente" : "Eliminar"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {modoIgnorados
                ? `¿Eliminar ${placeIdsSelecionados.length} lead(s) definitivamente?`
                : `¿Eliminar ${placeIdsSelecionados.length} lead(s)?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {modoIgnorados
                ? "Esto borra esos leads para siempre de la base de datos. No se puede deshacer, y si la misma búsqueda se corre de nuevo en el futuro, pueden volver a aparecer como leads nuevos."
                : "No van a aparecer más en tu lista, ni en búsquedas futuras del mismo rubro/ciudad."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir}>
              {modoIgnorados ? "Eliminar definitivamente" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button size="icon" variant="ghost" className="size-8" onClick={onLimparSelecao}>
        <X className="size-4" />
      </Button>
    </motion.div>
  )
}
