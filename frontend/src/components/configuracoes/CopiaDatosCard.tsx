import { useRef, useState } from "react"
import { Database, Download, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { httpClient, ApiError } from "@/services/httpClient"

interface RespostaImportacao {
  ok: true
  importado: Record<string, number>
}

/** Exporta/importa todo el CRM (leads, historial, posts y leads de Instagram,
 * plantillas, conversaciones) como un único JSON - pensado para llevar los
 * datos de una instalación local a un deploy en la nube (o al revés) sin
 * tener que correr las búsquedas de nuevo. No incluye claves de API (son
 * propias de cada instalación) ni jobs en curso. */
export function CopiaDatosCard() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [importando, setImportando] = useState(false)

  const handleArchivoSeleccionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    e.target.value = ""
    if (!archivo) return

    setImportando(true)
    try {
      const texto = await archivo.text()
      const datos = JSON.parse(texto)
      const resultado = await httpClient.post<RespostaImportacao>(
        "/api/admin/importar-tudo",
        datos
      )
      const total = Object.values(resultado.importado).reduce((a, b) => a + b, 0)
      toast.success(`Importación terminada: ${total} registro(s) en total.`)
    } catch (erro) {
      if (erro instanceof SyntaxError) {
        toast.error("Ese archivo no es un JSON válido.")
      } else {
        toast.error(erro instanceof ApiError ? erro.message : "Error al importar.")
      }
    } finally {
      setImportando(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Database className="size-4 text-muted-foreground" />
        <h3 className="font-medium">Copia de todos los datos</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Descargá un archivo con todos los leads, el historial, las plantillas
        y las conversaciones para llevarlos a otra instalación (por ejemplo,
        de tu PC a la versión en la nube). No incluye claves de API.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href="/api/admin/exportar-tudo">
            <Download className="size-4" />
            Descargar copia (JSON)
          </a>
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={importando}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          {importando ? "Importando..." : "Importar copia (JSON)"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleArchivoSeleccionado}
        />
      </div>
    </div>
  )
}
