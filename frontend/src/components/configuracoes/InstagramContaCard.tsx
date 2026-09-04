import { useState } from "react"
import { CheckCircle2, LogOut, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { InstagramIcon } from "@/components/icons/InstagramIcon"
import {
  useLoginInstagram,
  useSairInstagram,
  useSessaoInstagram,
} from "@/hooks/useSessaoInstagram"

export function InstagramContaCard() {
  const { data, isLoading } = useSessaoInstagram()
  const login = useLoginInstagram()
  const sair = useSairInstagram()

  const [usuario, setUsuario] = useState("")
  const [senha, setSenha] = useState("")
  const [codigo2fa, setCodigo2fa] = useState("")
  const [aguardando2fa, setAguardando2fa] = useState(false)

  if (isLoading || !data) return <Skeleton className="h-[220px]" />

  const handleEntrar = () => {
    if (!usuario.trim() || !senha) return
    login.mutate(
      {
        usuario: usuario.trim(),
        senha,
        codigo_2fa: aguardando2fa ? codigo2fa.trim() : undefined,
      },
      {
        onSuccess: (resposta) => {
          if ("precisa_2fa" in resposta) {
            setAguardando2fa(true)
            return
          }
          // login completo: limpa tudo que é sensível da memória do componente
          setUsuario("")
          setSenha("")
          setCodigo2fa("")
          setAguardando2fa(false)
        },
      }
    )
  }

  // ---- já conectado ----
  if (data.logada) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 font-medium">
            <InstagramIcon className="size-4" />
            Cuenta de Instagram
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
            <CheckCircle2 className="size-3.5" />
            Conectado como @{data.usuario}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          El análisis de posts usa esta sesión para leer comentarios y perfiles.
          Si Instagram cierra la sesión, alcanza con entrar de nuevo acá.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="w-fit"
          disabled={sair.isPending}
          onClick={() => sair.mutate()}
        >
          <LogOut className="size-4" />
          {sair.isPending ? "Saliendo..." : "Salir de la cuenta"}
        </Button>
      </div>
    )
  }

  // ---- formulário de login ----
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 font-medium">
          <InstagramIcon className="size-4" />
          Cuenta de Instagram
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          No conectado
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Usuario</Label>
          <Input
            autoComplete="off"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="@tu_usuario"
            disabled={aguardando2fa}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Contraseña</Label>
          <Input
            type="password"
            autoComplete="off"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Tu contraseña de Instagram"
            disabled={aguardando2fa}
          />
        </div>
      </div>

      {aguardando2fa && (
        <div className="space-y-1.5 rounded-lg border border-info/40 bg-info/5 p-3">
          <Label className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-info" />
            Código de verificación (2FA)
          </Label>
          <Input
            autoComplete="one-time-code"
            inputMode="numeric"
            value={codigo2fa}
            onChange={(e) => setCodigo2fa(e.target.value)}
            placeholder="El código de tu app de autenticación o SMS"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          La contraseña se usa sólo para crear la sesión y nunca queda guardada
          en la computadora ni en los backups.
        </p>
        <Button
          size="sm"
          disabled={
            login.isPending ||
            !usuario.trim() ||
            !senha ||
            (aguardando2fa && !codigo2fa.trim())
          }
          onClick={handleEntrar}
        >
          {login.isPending
            ? "Entrando..."
            : aguardando2fa
              ? "Confirmar código"
              : "Entrar"}
        </Button>
      </div>
    </div>
  )
}
