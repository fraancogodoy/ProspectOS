import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { Header } from "@/components/layout/Header"
import { PostList } from "@/components/instagram/PostList"

export function InstagramArquivadosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <Link
          to="/instagram"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a leads de Instagram
        </Link>

        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Posts archivados
          </h2>
          <p className="text-sm text-muted-foreground">
            Los posts archivados quedan fuera de la lista principal. Podés
            restaurarlos o eliminarlos definitivamente (lo que borra también
            todos los leads de ese post).
          </p>
        </div>

        <PostList
          postSelecionadoId={null}
          onSelecionarPost={() => {}}
          arquivados
        />
      </main>
    </div>
  )
}
