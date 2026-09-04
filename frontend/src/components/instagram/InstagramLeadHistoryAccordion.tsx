import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useInstagramLeadHistorico } from "@/hooks/useInstagramLeadHistorico"
import { formatarTempoRelativo } from "@/lib/formatters"
import { LABEL_STATUS } from "@/lib/constants"

interface InstagramLeadHistoryAccordionProps {
  leadId: number
}

export function InstagramLeadHistoryAccordion({
  leadId,
}: InstagramLeadHistoryAccordionProps) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="historico">
        <AccordionTrigger className="text-sm">
          Historial de estados
        </AccordionTrigger>
        <AccordionContent>
          <HistoricoConteudo leadId={leadId} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function HistoricoConteudo({ leadId }: { leadId: number }) {
  const { data: historico, isLoading } = useInstagramLeadHistorico(leadId, true)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>
  }

  if (!historico || historico.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no se registró ningún cambio de estado.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {historico.map((item, i) => (
        <div key={i} className="text-sm">
          <span className="text-muted-foreground">
            {item.status_anterior ? LABEL_STATUS[item.status_anterior] : "—"}
          </span>
          {" → "}
          <span className="font-medium">{LABEL_STATUS[item.status_novo]}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {formatarTempoRelativo(item.alterado_em)}
          </span>
        </div>
      ))}
    </div>
  )
}
