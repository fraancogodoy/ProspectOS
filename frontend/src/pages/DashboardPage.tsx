import { BarChart3, ListTodo, MapPin, Zap } from "lucide-react"
import { Header } from "@/components/layout/Header"
import { InstagramIcon } from "@/components/icons/InstagramIcon"
import { VisaoGeralCombinada } from "@/components/dashboard/VisaoGeralCombinada"
import { FunilConversaoCombinado } from "@/components/dashboard/FunilConversaoCombinado"
import { BreakdownNichoCombinado } from "@/components/dashboard/BreakdownNichoCombinado"
import { NavCard } from "@/components/dashboard/NavCard"

export function DashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <VisaoGeralCombinada />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FunilConversaoCombinado />
          <BreakdownNichoCombinado />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NavCard
            to="/sessao"
            titulo="Sesión de prospección"
            descricao="Un lead por vez, del más caliente al más frío - modo foco"
            icone={<Zap className="size-5" />}
          />
          <NavCard
            to="/tarefas"
            titulo="Tareas de hoy"
            descricao="Seguimientos vencidos y leads calientes con abordaje en 1 clic"
            icone={<ListTodo className="size-5" />}
          />
          <NavCard
            to="/leads"
            titulo="Leads de Maps"
            descricao="Lista, kanban y nueva búsqueda de leads de Google Maps"
            icone={<MapPin className="size-5" />}
          />
          <NavCard
            to="/instagram"
            titulo="Leads de Instagram"
            descricao="Analizar posts y gestionar leads de Instagram"
            icone={<InstagramIcon className="size-5" />}
            destaqueInstagram
          />
          <NavCard
            to="/analytics"
            titulo="Analytics de Maps"
            descricao="Embudo y conversión por rubro, sólo de Google Maps"
            icone={<BarChart3 className="size-5" />}
          />
        </div>
      </main>
    </div>
  )
}
