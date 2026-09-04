import { ArrowLeft, Check, Copy, Flame, ListTodo, MapPin, MessageCircle, PartyPopper } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Header } from "@/components/layout/Header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { InstagramIcon } from "@/components/icons/InstagramIcon"
import { SiteStatusBadge } from "@/components/leads/SiteStatusBadge"
import { EmptyStateCard } from "@/components/shared/EmptyStateCard"
import { PageHero } from "@/components/shared/PageHero"
import { useTarefasHoje } from "@/hooks/useTarefasHoje"
import { tocarSom } from "@/hooks/useSom"
import { ajustarSaudacao } from "@/lib/saudacao"
import { linkWhatsappComMensagem } from "@/services/tarefasService"
import { formatarNota } from "@/lib/formatters"
import type { LeadQuente, TarefaFollowup } from "@/types/tarefas"

function diasDeAtraso(proximoFollowup: string): string {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const data = new Date(`${proximoFollowup}T00:00:00`)
  const dias = Math.round((hoje.getTime() - data.getTime()) / 86_400_000)
  if (dias <= 0) return "para hoy"
  return dias === 1 ? "1 día de atraso" : `${dias} días de atraso`
}

async function copiarMensagem(mensagem: string) {
  await navigator.clipboard.writeText(ajustarSaudacao(mensagem))
  tocarSom("copiado")
  toast.success("Mensaje copiado - pegalo en el DM.")
}

function LinhaFollowup({
  tarefa,
  onFollowupEnviado,
  desabilitado,
}: {
  tarefa: TarefaFollowup
  onFollowupEnviado: () => void
  desabilitado: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
      {tarefa.canal === "instagram" ? (
        <InstagramIcon className="size-4 shrink-0 text-instagram-mid" />
      ) : (
        <MessageCircle className="size-4 shrink-0 text-success" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tarefa.titulo}</p>
        <p className="text-xs text-muted-foreground">
          Seguimiento nº {tarefa.follow_ups_enviados + 1} · {diasDeAtraso(tarefa.proximo_followup)}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tarefa.canal === "maps" && tarefa.whatsapp_link && (
          <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
            <a
              href={linkWhatsappComMensagem(tarefa.whatsapp_link, tarefa.mensagem)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="size-3.5" />
              Abrir WhatsApp
            </a>
          </Button>
        )}
        {tarefa.canal === "instagram" && tarefa.username && (
          <>
            {tarefa.mensagem && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => copiarMensagem(tarefa.mensagem!)}
              >
                <Copy className="size-3.5" />
                Copiar DM
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
              <a
                href={`https://www.instagram.com/${tarefa.username}/`}
                target="_blank"
                rel="noreferrer"
              >
                <InstagramIcon className="size-3.5" />
                Abrir perfil
              </a>
            </Button>
          </>
        )}
        <Button
          size="sm"
          className="h-8 text-xs"
          onClick={onFollowupEnviado}
          disabled={desabilitado}
        >
          <Check className="size-3.5" />
          Seguimiento enviado
        </Button>
      </div>
    </div>
  )
}

function LinhaLeadQuente({
  lead,
  onContatado,
  desabilitado,
}: {
  lead: LeadQuente
  onContatado: () => void
  desabilitado: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
      <span
        className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary"
        title="Score de prioridad"
      >
        <Flame className="size-3" />
        {lead.score}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{lead.titulo}</p>
        <p className="truncate text-xs text-muted-foreground">
          {lead.categoria || "Sin rubro"} · puntuación {formatarNota(lead.nota)} (
          {lead.num_avaliacoes ?? 0})
        </p>
      </div>
      <SiteStatusBadge siteStatus={lead.site_status} siteProblemas={lead.site_problemas} />
      <div className="flex flex-wrap gap-1.5">
        {lead.whatsapp_link && (
          <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
            <a
              href={linkWhatsappComMensagem(lead.whatsapp_link, lead.mensagem)}
              target="_blank"
              rel="noreferrer"
              title={
                lead.mensagem
                  ? "Abre WhatsApp con el mensaje generado ya cargado"
                  : "Abre WhatsApp (generá el mensaje en la pantalla de leads para llevarlo cargado)"
              }
            >
              <MessageCircle className="size-3.5" />
              Abrir WhatsApp
            </a>
          </Button>
        )}
        <Button size="sm" className="h-8 text-xs" onClick={onContatado} disabled={desabilitado}>
          <Check className="size-3.5" />
          Marcar contactado
        </Button>
      </div>
    </div>
  )
}

export function TarefasPage() {
  const { tarefas, marcarFollowupEnviado, marcarContatado } = useTarefasHoje()

  if (tarefas.isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="mx-auto w-full max-w-4xl space-y-3 px-4 py-6 sm:px-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[64px]" />
          ))}
        </main>
      </div>
    )
  }

  const followups = tarefas.data?.followups ?? []
  const novosQuentes = tarefas.data?.novos_quentes ?? []

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver al dashboard
        </Link>

        <PageHero
          icone={<ListTodo className="size-6" />}
          titulo="Tareas de hoy"
          descricao="Tu mesa de trabajo: seguimientos vencidos y los leads más calientes, cada uno con el abordaje a 1 clic de distancia."
          gradiente="from-google-maps-start/85 via-primary/85 to-google-maps-end/85"
        />

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Seguimientos para hoy
            </h2>
            {followups.length > 0 && <Badge variant="outline">{followups.length}</Badge>}
          </div>
          {followups.length === 0 ? (
            <EmptyStateCard
              icone={<PartyPopper className="size-5" />}
              titulo="Ningún seguimiento pendiente"
              descricao="Nada vencido ni para hoy - bandeja limpia."
            />
          ) : (
            followups.map((tarefa) => (
              <LinhaFollowup
                key={`${tarefa.canal}-${tarefa.id}`}
                tarefa={tarefa}
                onFollowupEnviado={() => marcarFollowupEnviado.mutate(tarefa)}
                desabilitado={marcarFollowupEnviado.isPending}
              />
            ))
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Leads nuevos más calientes
            </h2>
            {novosQuentes.length > 0 && <Badge variant="outline">{novosQuentes.length}</Badge>}
          </div>
          {novosQuentes.length === 0 ? (
            <EmptyStateCard
              icone={<MapPin className="size-5" />}
              titulo="Ningún lead nuevo esperando abordaje"
              descricao="Corré una búsqueda en Google Maps para llenar esta cola con leads priorizados por score."
              acao={
                <Button size="sm" variant="outline" asChild>
                  <Link to="/leads">
                    <MapPin className="size-4" />
                    Ir a leads de Maps
                  </Link>
                </Button>
              }
            />
          ) : (
            novosQuentes.map((lead) => (
              <LinhaLeadQuente
                key={lead.id}
                lead={lead}
                onContatado={() => marcarContatado.mutate(lead.id)}
                desabilitado={marcarContatado.isPending}
              />
            ))
          )}
        </section>
      </main>
    </div>
  )
}
