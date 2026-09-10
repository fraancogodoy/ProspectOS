// Envío masivo de una plantilla de WhatsApp a los leads seleccionados, vía
// PresencIA. Cada envío es una llamada individual a la API oficial de Meta
// (no hay endpoint "masivo" de Meta), así que el límite real es el tier de
// mensajería de la cuenta (250 / 1.000 / 10.000 plantillas por 24 h según
// calidad). El backend recorre los leads, personaliza {nombre} por negocio,
// no corta ante un fallo y devuelve el detalle de los que no salieron.

import { useEffect, useMemo, useState } from "react"
import { Send } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePresenciaPlantillas } from "@/hooks/usePresenciaPlantillas"
import { useBulkMutations } from "@/hooks/useBulkMutations"
import { TOKEN_NOMBRE_LEAD, contarVariablesBody } from "@/lib/presencia"

interface BulkPresenciaSenderProps {
  placeIdsSelecionados: string[]
  onEnviado: () => void
}

export function BulkPresenciaSender({
  placeIdsSelecionados,
  onEnviado,
}: BulkPresenciaSenderProps) {
  const [abierto, setAbierto] = useState(false)
  const { plantillas, isLoading, isError, error } = usePresenciaPlantillas()
  const { enviarPlantillaEmLote } = useBulkMutations()

  const [nombrePlantilla, setNombrePlantilla] = useState("")
  // parametros[0] arranca en el token {nombre} (lo reemplaza el backend por
  // cada negocio); el resto son valores fijos, iguales para todos.
  const [parametros, setParametros] = useState<string[]>([])

  const plantilla = useMemo(
    () => plantillas.find((p) => p.name === nombrePlantilla),
    [plantillas, nombrePlantilla]
  )
  const cantidadVariables = contarVariablesBody(plantilla)

  useEffect(() => {
    if (!plantilla) return
    setParametros((anteriores) =>
      Array.from({ length: cantidadVariables }, (_, i) =>
        i === 0 ? TOKEN_NOMBRE_LEAD : anteriores[i] ?? ""
      )
    )
  }, [plantilla, cantidadVariables])

  useEffect(() => {
    if (plantillas.length === 1 && !nombrePlantilla) {
      setNombrePlantilla(plantillas[0].name)
    }
  }, [plantillas, nombrePlantilla])

  const demasiados = placeIdsSelecionados.length > 100
  const puedeEnviar =
    !demasiados &&
    Boolean(plantilla) &&
    parametros.every((p) => p.trim().length > 0)

  const enviar = () => {
    if (!plantilla) return
    enviarPlantillaEmLote.mutate(
      {
        placeIds: placeIdsSelecionados,
        template_name: plantilla.name,
        language: plantilla.language,
        parameters: parametros,
      },
      {
        onSuccess: () => {
          setAbierto(false)
          onEnviado()
        },
      }
    )
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-success text-white hover:bg-success/90">
          <Send className="size-4" />
          Enviar plantilla
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Enviar plantilla a {placeIdsSelecionados.length} negocio(s)
          </DialogTitle>
          <DialogDescription>
            Se manda la misma plantilla a cada uno por su WhatsApp, vía PresencIA,
            con ~1 s de pausa entre cada envío. El saludo se personaliza con el
            nombre de cada negocio. Los que ya recibieron pasan a “contactado”.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-1">
          {demasiados && (
            <p className="text-xs text-destructive">
              Son {placeIdsSelecionados.length} seleccionados. Mandá en tandas de
              hasta 100 — es lo sano para la calidad de un número nuevo.
            </p>
          )}
          {isError && (
            <p className="text-xs text-destructive">
              No se pudieron cargar las plantillas: {error?.message}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Plantilla aprobada</Label>
            <Select value={nombrePlantilla} onValueChange={setNombrePlantilla}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoading ? "Cargando plantillas..." : "Elegí una plantilla"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {plantillas.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {plantilla && cantidadVariables > 0 && (
            <div className="flex flex-col gap-1.5">
              {parametros.map((valor, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <Input
                    value={valor}
                    placeholder={`Variable {{${i + 1}}}`}
                    disabled={i === 0}
                    onChange={(e) => {
                      const copia = [...parametros]
                      copia[i] = e.target.value
                      setParametros(copia)
                    }}
                  />
                  {i === 0 && (
                    <span className="text-xs text-muted-foreground">
                      Se reemplaza por el nombre de cada negocio.
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setAbierto(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            className="bg-success text-white hover:bg-success/90"
            disabled={!puedeEnviar || enviarPlantillaEmLote.isPending}
            onClick={enviar}
          >
            {enviarPlantillaEmLote.isPending
              ? "Enviando..."
              : `Enviar a ${placeIdsSelecionados.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
