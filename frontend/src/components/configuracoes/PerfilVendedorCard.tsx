import { useEffect, useState } from "react"
import { UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { usePerfilVendedor, useSalvarPerfilVendedor } from "@/hooks/useConfiguracoes"

/** Perfil de quien envía los mensajes - se vuelve parte del system prompt de la
 * IA, así las copias salen firmadas y con la voz correcta en vez de "vendedor
 * genérico". */
export function PerfilVendedorCard() {
  const { data, isLoading } = usePerfilVendedor()
  const salvar = useSalvarPerfilVendedor()
  const [nome, setNome] = useState("")
  const [apresentacao, setApresentacao] = useState("")
  const [diferencial, setDiferencial] = useState("")

  useEffect(() => {
    if (data) {
      setNome(data.nome)
      setApresentacao(data.apresentacao)
      setDiferencial(data.diferencial)
    }
  }, [data])

  if (isLoading) {
    return <Skeleton className="h-[280px]" />
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <UserRound className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-medium">Tu perfil de vendedor</h3>
          <p className="text-xs text-muted-foreground">
            La IA usa esto para escribir los mensajes con tu voz y tu nombre.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="vendedor-nome">Tu nombre (como querés que aparezca)</Label>
          <Input
            id="vendedor-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ej.: Franco"
            maxLength={80}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="vendedor-apresentacao">A qué te dedicás (1 frase)</Label>
          <Textarea
            id="vendedor-apresentacao"
            rows={2}
            value={apresentacao}
            onChange={(e) => setApresentacao(e.target.value)}
            placeholder="Ej.: automatizo la atención por WhatsApp de comercios (PresencIA)"
            maxLength={300}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="vendedor-diferencial">
            Tu diferencial <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Textarea
            id="vendedor-diferencial"
            rows={2}
            value={diferencial}
            onChange={(e) => setDiferencial(e.target.value)}
            placeholder="Ej.: lo dejo andando en tu propio número, sin instalar nada, abono mensual sin permanencia"
            maxLength={300}
          />
        </div>
      </div>

      <Button
        size="sm"
        onClick={() => salvar.mutate({ nome, apresentacao, diferencial })}
        disabled={salvar.isPending}
      >
        {salvar.isPending ? "Guardando..." : "Guardar perfil"}
      </Button>
    </div>
  )
}
