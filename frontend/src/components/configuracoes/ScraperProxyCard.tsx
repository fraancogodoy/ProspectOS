import { useEffect, useState } from "react"
import { CheckCircle2, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  useProxiesScraper,
  useSalvarProxiesScraper,
} from "@/hooks/useConfiguracoes"

export function ScraperProxyCard() {
  const { data, isLoading } = useProxiesScraper()
  const salvar = useSalvarProxiesScraper()
  const [valor, setValor] = useState("")

  useEffect(() => {
    if (data) setValor(data.proxies)
  }, [data])

  const handleSalvar = () => salvar.mutate(valor.trim())

  if (isLoading) return null

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-muted-foreground" />
          <h3 className="font-medium">Proxy del scraper (Google Maps)</h3>
        </div>
        {data?.configurado ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
            <CheckCircle2 className="size-3.5" />
            Configurado
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            No configurado
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Opcional. Si las búsquedas en Google Maps siempre vuelven con 0
        resultados (aun con el scraper corriendo sin error), Google puede
        estar bloqueando tu IP. Configurar uno o más proxies puede
        solucionarlo.
      </p>

      <div className="space-y-1.5">
        <Label>Lista de proxies (separados por coma)</Label>
        <Textarea
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="socks5://usuario:clave@host:puerto,http://host2:puerto2"
          rows={2}
          className="font-mono text-xs"
        />
      </div>

      <Button
        size="sm"
        className="w-fit"
        disabled={salvar.isPending}
        onClick={handleSalvar}
      >
        {salvar.isPending ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  )
}
