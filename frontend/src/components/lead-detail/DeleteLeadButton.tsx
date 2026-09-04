import { Trash2 } from "lucide-react"
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

interface DeleteLeadButtonProps {
  nomeLead: string
  onConfirmar: () => void
  definitivo?: boolean
}

export function DeleteLeadButton({
  nomeLead,
  onConfirmar,
  definitivo = false,
}: DeleteLeadButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10">
          <Trash2 className="size-4" />
          {definitivo ? "Eliminar definitivamente" : "Eliminar este lead"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {definitivo
              ? `¿Eliminar "${nomeLead}" definitivamente?`
              : `¿Eliminar "${nomeLead}"?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {definitivo
              ? "Esto borra el lead para siempre de la base de datos. No se puede deshacer, y si la misma búsqueda se corre de nuevo en el futuro, puede volver a aparecer como lead nuevo."
              : "No va a aparecer más en tu lista, ni en búsquedas futuras del mismo rubro/ciudad."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmar}>
            {definitivo ? "Eliminar definitivamente" : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
