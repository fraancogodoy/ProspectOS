import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Lead } from "@/types/lead"

interface LeadTagsFollowupFormProps {
  lead: Lead
  onSalvar: (input: { tags: string; proximoFollowup: string | null }) => void
  salvando: boolean
}

export function LeadTagsFollowupForm({
  lead,
  onSalvar,
  salvando,
}: LeadTagsFollowupFormProps) {
  const [tags, setTags] = useState(lead.tags ?? "")
  const [followup, setFollowup] = useState(lead.proximo_followup ?? "")

  useEffect(() => {
    setTags(lead.tags ?? "")
    setFollowup(lead.proximo_followup ?? "")
  }, [lead.place_id, lead.tags, lead.proximo_followup])

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Etiquetas</Label>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="urgente, zona centro, ..."
        />
      </div>
      <div className="space-y-1.5">
        <Label>Próximo seguimiento</Label>
        <Input
          type="date"
          value={followup}
          onChange={(e) => setFollowup(e.target.value)}
        />
      </div>
      <Button
        size="sm"
        variant="secondary"
        disabled={salvando}
        onClick={() =>
          onSalvar({ tags, proximoFollowup: followup || null })
        }
      >
        {salvando ? "Guardando..." : "Guardar etiquetas y seguimiento"}
      </Button>
    </div>
  )
}
