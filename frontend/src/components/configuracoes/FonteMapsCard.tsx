import { useEffect, useState } from "react"
import { CheckCircle2, ExternalLink, KeyRound, MonitorCog, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useFonteMaps, useSalvarFonteMaps } from "@/hooks/useConfiguracoes"
import type { FonteMapsTipo } from "@/services/configService"
import { Skeleton } from "@/components/ui/skeleton"

const OPCOES: Array<{
  valor: FonteMapsTipo
  titulo: string
  subtitulo: string
  descricao: string
  Icone: typeof MonitorCog
}> = [
  {
    valor: "scraper",
    titulo: "Scraper local",
    subtitulo: "gosom/google-maps-scraper",
    descricao: "Corre en tu computadora y no consume llamadas de una API paga.",
    Icone: MonitorCog,
  },
  {
    valor: "places",
    titulo: "Google Places API (New)",
    subtitulo: "Integración oficial de Google",
    descricao: "Más estable, con cuotas y cobro controlados por Google Cloud.",
    Icone: Sparkles,
  },
]

export function FonteMapsCard() {
  const { data, isLoading } = useFonteMaps()
  const salvar = useSalvarFonteMaps()
  const [fonte, setFonte] = useState<FonteMapsTipo>("scraper")
  const [chave, setChave] = useState("")

  // sincroniza a seleção com o que está salvo assim que carrega
  useEffect(() => {
    if (data) setFonte(data.fonte)
  }, [data])

  if (isLoading || !data) return <Skeleton className="h-[380px]" />

  const precisaDeChave = fonte === "places" && !data.chave_configurada && !chave.trim()

  const handleSalvar = () => {
    salvar.mutate(
      { fonte, chave: chave.trim() || undefined },
      { onSuccess: () => setChave("") }
    )
  }

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
      <h3 className="font-medium">Elegí cómo se encuentran los negocios</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {OPCOES.map(({ valor, titulo, subtitulo, descricao, Icone }) => {
          const ativa = fonte === valor
          return (
            <button
              key={valor}
              type="button"
              onClick={() => setFonte(valor)}
              className={cn(
                "flex flex-col gap-1.5 rounded-xl border p-4 text-left transition-colors",
                ativa
                  ? "border-success bg-success/5"
                  : "border-border hover:border-muted-foreground/40"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 font-medium">
                  <Icone className={cn("size-4", ativa ? "text-success" : "text-muted-foreground")} />
                  {titulo}
                </span>
                {ativa && <CheckCircle2 className="size-4 shrink-0 text-success" />}
              </div>
              <span className="text-xs text-muted-foreground">{subtitulo}</span>
              <span className="text-sm text-muted-foreground">{descricao}</span>
            </button>
          )
        })}
      </div>

      {fonte === "places" && (
        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <KeyRound className="size-4 text-muted-foreground" />
              Clave de la Google Places API
            </span>
            {data.chave_configurada ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                <CheckCircle2 className="size-3.5" />
                Configurada · {data.mascarada}
              </span>
            ) : (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                No configurada
              </span>
            )}
          </div>

          <Input
            type="password"
            autoComplete="off"
            value={chave}
            onChange={(e) => setChave(e.target.value)}
            placeholder={
              data.chave_configurada
                ? "Escribí sólo para reemplazar la clave"
                : "Pegá acá la clave creada en Google Cloud"
            }
          />
          <p className="text-xs text-muted-foreground">
            La clave queda protegida en el cofre de credenciales de Windows y
            nunca se manda al navegador después de guardarla.
          </p>

          <a
            href={data.link_obter_chave}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1 text-xs font-medium text-success hover:underline"
          >
            Abrir credenciales en Google Cloud
            <ExternalLink className="size-3" />
          </a>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          El cambio vale sólo para búsquedas nuevas.
        </p>
        <Button
          size="sm"
          disabled={salvar.isPending || precisaDeChave}
          onClick={handleSalvar}
        >
          {salvar.isPending ? "Validando..." : "Validar y guardar fuente"}
        </Button>
      </div>
    </div>
  )
}
