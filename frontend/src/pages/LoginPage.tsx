import { useState } from "react"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/services/authService"
import { ApiError } from "@/services/httpClient"

interface LoginPageProps {
  onLogin: (usuario: string) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [usuario, setUsuario] = useState("")
  const [senha, setSenha] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario.trim() || !senha) return
    setEnviando(true)
    setError(null)
    try {
      await authService.login(usuario.trim(), senha)
      onLogin(usuario.trim())
    } catch (erro) {
      setError(erro instanceof ApiError ? erro.message : "No se pudo iniciar sesión.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Lock className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">ProspectOS</h1>
            <p className="text-sm text-muted-foreground">Iniciá sesión para continuar</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="login-usuario">Usuario</Label>
            <Input
              id="login-usuario"
              autoFocus
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-senha">Contraseña</Label>
            <Input
              id="login-senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={enviando || !usuario.trim() || !senha}
        >
          {enviando ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  )
}
