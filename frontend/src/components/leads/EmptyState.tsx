import { Inbox, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  filtrosEmUso: boolean
  onLimparFiltros: () => void
  onNovaBusca?: () => void
}

export function EmptyState({
  filtrosEmUso,
  onLimparFiltros,
  onNovaBusca,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
      <Inbox className="size-8 text-muted-foreground" />
      {filtrosEmUso ? (
        <>
          <p className="text-sm text-muted-foreground">
            Ningún lead encontrado con esos filtros.
          </p>
          <Button variant="outline" size="sm" onClick={onLimparFiltros}>
            Limpiar filtros
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Todavía no se hizo ninguna búsqueda.
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Cada línea de la búsqueda es un rubro + ciudad, por ejemplo:{" "}
            <span className="font-medium text-foreground">
              "centro de estética en Tandil"
            </span>
          </p>
          {onNovaBusca && (
            <Button size="sm" onClick={onNovaBusca}>
              <Plus className="size-4" />
              Nueva búsqueda
            </Button>
          )}
        </>
      )}
    </div>
  )
}
