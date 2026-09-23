import { useEffect, useState } from "react"
import { AnimatePresence } from "framer-motion"
import { CheckSquare, LayoutGrid, List, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useLeads } from "@/hooks/useLeads"
import { leadsService } from "@/services/leadsService"
import { ApiError } from "@/services/httpClient"
import { useSelecaoLeads } from "@/hooks/useSelecaoLeads"
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver"
import { useBulkMutations } from "@/hooks/useBulkMutations"
import { LeadCard } from "@/components/leads/LeadCard"
import { EmptyState } from "@/components/leads/EmptyState"
import { BulkActionsBar } from "@/components/leads/BulkActionsBar"
import { KanbanBoard } from "@/components/leads/KanbanBoard"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"
import type { FiltrosLeads, Lead } from "@/types/lead"

interface LeadGridProps {
  filtros: FiltrosLeads
  filtrosEmUso: boolean
  onLimparFiltros: () => void
  onSelecionarLead: (lead: Lead) => void
  onNovaBusca?: () => void
}

export function LeadGrid({
  filtros,
  filtrosEmUso,
  onLimparFiltros,
  onSelecionarLead,
  onNovaBusca,
}: LeadGridProps) {
  const [visualizacao, setVisualizacao] = useState<"lista" | "kanban">("lista")

  const filtrosEfetivos: FiltrosLeads =
    visualizacao === "kanban" ? { ...filtros, status: "" } : filtros

  const { leads, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useLeads(filtrosEfetivos)
  // ao trocar filtro/visualização, a seleção zera (não age em leads invisíveis)
  const chaveFiltros = JSON.stringify(filtrosEfetivos)
  const { selecionados, alternar, limpar, selecionarTodos, quantidade } =
    useSelecaoLeads(chaveFiltros)
  const { excluirEmLoteDefinitivamente } = useBulkMutations()
  const modoIgnorados = filtros.status === "ignorado"

  // La lista carga de a 30: "seleccionar todos" pide al servidor todos los
  // que cumplen el filtro, no solo los cards que ya se ven.
  const [buscandoTodos, setBuscandoTodos] = useState(false)
  const [cantidadTodos, setCantidadTodos] = useState<number | null>(null)
  useEffect(() => setCantidadTodos(null), [chaveFiltros])
  const todosSelecionados = cantidadTodos !== null && quantidade > 0 && quantidade === cantidadTodos

  const handleSelecionarTodos = async () => {
    if (todosSelecionados) {
      limpar()
      return
    }
    setBuscandoTodos(true)
    try {
      const { ids, total, truncado } = await leadsService.listarIds(filtrosEfetivos)
      selecionarTodos(ids)
      setCantidadTodos(ids.length)
      if (truncado) {
        toast.warning(
          `Hay ${total} leads con este filtro: se seleccionaron los primeros ${ids.length}, que es el máximo por acción.`
        )
      }
    } catch (erro) {
      toast.error(erro instanceof ApiError ? erro.message : "No se pudo seleccionar todos.")
    } finally {
      setBuscandoTodos(false)
    }
  }

  const sentinelaRef = useIntersectionObserver(
    () => fetchNextPage(),
    Boolean(hasNextPage) && !isFetchingNextPage
  )

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[150px]" />
        ))}
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <EmptyState
        filtrosEmUso={filtrosEmUso}
        onLimparFiltros={onLimparFiltros}
        onNovaBusca={onNovaBusca}
      />
    )
  }

  const leadsForaDoFunil = leads.filter((l) =>
    ["recusou", "ignorado"].includes(l.status)
  ).length

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {leads.length} lead(s) cargado(s)
          </p>
          {visualizacao === "lista" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={handleSelecionarTodos}
              disabled={buscandoTodos}
            >
              {buscandoTodos ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CheckSquare className="size-3.5" />
              )}
              {todosSelecionados ? "Quitar selección" : "Seleccionar todos"}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 px-2", visualizacao === "lista" && "bg-accent")}
            onClick={() => setVisualizacao("lista")}
          >
            <List className="size-3.5" />
            Lista
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 px-2", visualizacao === "kanban" && "bg-accent")}
            onClick={() => setVisualizacao("kanban")}
          >
            <LayoutGrid className="size-3.5" />
            Kanban
          </Button>
        </div>

        {modoIgnorados && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
                Vaciar ignorados
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ¿Eliminar los {leads.length} lead(s) ignorado(s)?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esto borra para siempre todos los leads ignorados cargados en
                  esta lista. No se puede deshacer, y si la misma búsqueda se
                  corre de nuevo en el futuro, pueden volver a aparecer como
                  leads nuevos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    excluirEmLoteDefinitivamente.mutate(
                      leads.map((l) => l.place_id)
                    )
                  }
                >
                  Eliminar todos
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {visualizacao === "kanban" ? (
        <>
          <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen px-4 sm:px-6">
            <KanbanBoard leads={leads} onSelecionarLead={onSelecionarLead} />
          </div>
          {leadsForaDoFunil > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {leadsForaDoFunil} lead(s) rechazado(s)/ignorado(s) no aparecen
              en el Kanban — usá la vista de Lista para verlos.
            </p>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <LeadCard
              key={lead.place_id}
              lead={lead}
              onClick={() => onSelecionarLead(lead)}
              selecionado={selecionados.has(lead.place_id)}
              onAlternarSelecao={() => alternar(lead.place_id)}
              modoSelecao={quantidade > 0}
            />
          ))}
        </div>
      )}

      {visualizacao === "lista" && hasNextPage && (
        <div ref={sentinelaRef} className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <AnimatePresence>
        {quantidade > 0 && (
          <BulkActionsBar
            placeIdsSelecionados={Array.from(selecionados)}
            onLimparSelecao={limpar}
            modoIgnorados={modoIgnorados}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
