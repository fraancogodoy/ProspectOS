// Plantillas de WhatsApp (PresencIA) cuyo header es una imagen/video/documento
// necesitan ese archivo re-subido en cada envío - Meta no lo guarda en la
// plantilla. Sin esto, el envío sale rechazado con (#132012) "Parameter
// format does not match" (ver backend/presencia.py). Acá se sube una sola vez
// por plantilla y el backend lo re-usa automáticamente en cada envío.

import { useRef, useState } from "react"
import { FileVideo, Trash2, Upload, Video } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { usePresenciaPlantillas } from "@/hooks/usePresenciaPlantillas"
import { usePresenciaHeader } from "@/hooks/usePresenciaHeader"
import { presenciaService } from "@/services/presenciaService"
import { formatoHeaderMedia } from "@/lib/presencia"
import { ApiError } from "@/services/httpClient"
import type { PresenciaPlantilla } from "@/types/lead"

const ACCEPT_POR_FORMATO: Record<string, string> = {
  IMAGE: "image/*",
  VIDEO: "video/*",
  DOCUMENT: "application/pdf",
}

function formatearTamano(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function PlantillaHeaderRow({ plantilla }: { plantilla: PresenciaPlantilla }) {
  const formato = formatoHeaderMedia(plantilla)!
  const { estado, isLoading, invalidar } = usePresenciaHeader(plantilla.name)
  const [subiendo, setSubiendo] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    e.target.value = ""
    if (!archivo) return

    setSubiendo(true)
    try {
      await presenciaService.subirHeader(plantilla.name, archivo)
      toast.success(`Header de "${plantilla.name}" cargado.`)
      invalidar()
    } catch (erro) {
      toast.error(erro instanceof ApiError ? erro.message : "Error al subir el archivo.")
    } finally {
      setSubiendo(false)
    }
  }

  const handleBorrar = async () => {
    try {
      await presenciaService.borrarHeader(plantilla.name)
      toast.success(`Header de "${plantilla.name}" eliminado.`)
      invalidar()
    } catch (erro) {
      toast.error(erro instanceof ApiError ? erro.message : "Error al eliminar.")
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Video className="size-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{plantilla.name}</p>
          <p className="text-xs text-muted-foreground">
            Header de {formato === "VIDEO" ? "video" : formato === "IMAGE" ? "imagen" : "documento"}
            {isLoading
              ? " - verificando..."
              : estado?.existe
                ? ` - cargado (${estado.nombre_archivo}, ${formatearTamano(estado.tamano ?? 0)})`
                : " - falta cargar el archivo"}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={subiendo}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          {subiendo ? "Subiendo..." : estado?.existe ? "Reemplazar" : "Cargar archivo"}
        </Button>
        {estado?.existe && (
          <Button variant="outline" size="sm" onClick={handleBorrar}>
            <Trash2 className="size-4" />
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_POR_FORMATO[formato]}
          className="hidden"
          onChange={handleArchivo}
        />
      </div>
    </div>
  )
}

export function PresenciaHeadersCard() {
  const { plantillas, isLoading, isError } = usePresenciaPlantillas()
  const conHeader = plantillas.filter((p) => formatoHeaderMedia(p) !== null)

  if (isLoading || isError || conHeader.length === 0) return null

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <FileVideo className="size-4 text-muted-foreground" />
        <h3 className="font-medium">Archivos de encabezado (PresencIA)</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Estas plantillas de WhatsApp llevan una imagen, video o documento en el
        encabezado. Meta no lo guarda junto con la plantilla, así que hay que
        cargarlo acá una sola vez - de ahí en más se manda solo en cada envío,
        individual o masivo.
      </p>
      <div className="flex flex-col gap-2">
        {conHeader.map((p) => (
          <PlantillaHeaderRow key={p.name} plantilla={p} />
        ))}
      </div>
    </div>
  )
}
