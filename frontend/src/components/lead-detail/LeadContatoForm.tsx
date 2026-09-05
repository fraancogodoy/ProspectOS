import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCampanas } from "@/hooks/useCampanas"
import type { Lead } from "@/types/lead"

interface LeadContatoFormProps {
  lead: Lead
  onSalvar: (dados: {
    telefone: string
    endereco: string
    instagram_url: string
    facebook_url: string
    email: string
    campana: string
  }) => void
  salvando: boolean
}

/** Datos de contacto editables a mano: útil cuando el scraper no encontró
 * alguno (celular, Instagram, Facebook, dirección) o cuando aparece un dato
 * nuevo durante la prospección (por WhatsApp, llamada, etc.). Al guardar un
 * teléfono nuevo, el backend regenera el link de WhatsApp a partir de él. */
export function LeadContatoForm({ lead, onSalvar, salvando }: LeadContatoFormProps) {
  const [telefone, setTelefone] = useState(lead.telefone ?? "")
  const [endereco, setEndereco] = useState(lead.endereco ?? "")
  const [instagram, setInstagram] = useState(lead.instagram_url ?? "")
  const [facebook, setFacebook] = useState(lead.facebook_url ?? "")
  const [email, setEmail] = useState(lead.email ?? "")
  const [campana, setCampana] = useState(lead.campana ?? "")
  const { data: campanasExistentes } = useCampanas()

  useEffect(() => {
    setTelefone(lead.telefone ?? "")
    setEndereco(lead.endereco ?? "")
    setInstagram(lead.instagram_url ?? "")
    setFacebook(lead.facebook_url ?? "")
    setEmail(lead.email ?? "")
    setCampana(lead.campana ?? "")
  }, [
    lead.place_id, lead.telefone, lead.endereco, lead.instagram_url,
    lead.facebook_url, lead.email, lead.campana,
  ])

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Teléfono / celular</Label>
          <Input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="0249 15-465-2660"
          />
        </div>
        <div className="space-y-1.5">
          <Label>E-mail</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contacto@negocio.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Instagram</Label>
          <Input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="https://instagram.com/el_negocio"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Facebook</Label>
          <Input
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="https://facebook.com/el_negocio"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Dirección</Label>
          <Input
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Calle 123, Tandil"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Campaña</Label>
          <Input
            list="campanas-existentes-contato"
            value={campana}
            onChange={(e) => setCampana(e.target.value)}
            placeholder='Ej.: "belleza", "inmobiliarias"'
          />
          <datalist id="campanas-existentes-contato">
            {campanasExistentes?.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        disabled={salvando}
        onClick={() =>
          onSalvar({
            telefone,
            endereco,
            instagram_url: instagram,
            facebook_url: facebook,
            email,
            campana,
          })
        }
      >
        {salvando ? "Guardando..." : "Guardar datos de contacto"}
      </Button>
    </div>
  )
}
