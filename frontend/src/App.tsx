import { useEffect, useState } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { queryClient } from "@/lib/queryClient"
import { PaletaComando } from "@/components/shared/PaletaComando"
import { LoginPage } from "@/pages/LoginPage"
import { authService } from "@/services/authService"
import { AuthContext } from "@/hooks/useAuth"
import { DashboardPage } from "@/pages/DashboardPage"
import { TarefasPage } from "@/pages/TarefasPage"
import { SessaoProspeccaoPage } from "@/pages/SessaoProspeccaoPage"
import { LeadsMapsPage } from "@/pages/LeadsMapsPage"
import { ConversaPage } from "@/pages/ConversaPage"
import { AnalyticsPage } from "@/pages/AnalyticsPage"
import { InstagramPage } from "@/pages/InstagramPage"
import { InstagramAnalyticsPage } from "@/pages/InstagramAnalyticsPage"
import { InstagramArquivadosPage } from "@/pages/InstagramArquivadosPage"
import { ConfiguracoesPage } from "@/pages/ConfiguracoesPage"
import { DocumentacaoPage } from "@/pages/DocumentacaoPage"

/** Login de administrador único: só bloqueia algo quando o backend tem
 * ADMIN_USER/ADMIN_PASSWORD configurados (modo servidor compartilhado na
 * nuvem). Rodando localmente (desktop), /api/auth/me sempre devolve
 * auth_habilitada=false e a tela de login nunca aparece. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<"carregando" | "logado" | "deslogado">("carregando")
  const [authHabilitada, setAuthHabilitada] = useState(false)
  const [usuario, setUsuario] = useState<string | null>(null)

  useEffect(() => {
    authService
      .me()
      .then((resposta) => {
        setAuthHabilitada(resposta.auth_habilitada)
        setUsuario(resposta.usuario)
        setEstado(resposta.logado ? "logado" : "deslogado")
      })
      .catch(() => setEstado("deslogado"))
  }, [])

  const handleLogin = (nomeUsuario: string) => {
    setUsuario(nomeUsuario)
    setAuthHabilitada(true)
    setEstado("logado")
  }

  const logout = () => {
    authService.logout().finally(() => window.location.reload())
  }

  if (estado === "carregando") return null
  if (estado === "deslogado") {
    return <LoginPage onLogin={handleLogin} />
  }
  return (
    <AuthContext.Provider value={{ authHabilitada, usuario, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <RequireAuth>
            <PaletaComando />
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tarefas" element={<TarefasPage />} />
              <Route path="/sessao" element={<SessaoProspeccaoPage />} />
              <Route path="/leads" element={<LeadsMapsPage />} />
              <Route path="/conversas/:placeId" element={<ConversaPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/instagram" element={<InstagramPage />} />
              <Route path="/instagram/analytics" element={<InstagramAnalyticsPage />} />
              <Route path="/instagram/arquivados" element={<InstagramArquivadosPage />} />
              <Route path="/configuracoes" element={<ConfiguracoesPage />} />
              <Route path="/documentacao" element={<DocumentacaoPage />} />
            </Routes>
          </RequireAuth>
        </BrowserRouter>
        <Toaster position="bottom-right" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
