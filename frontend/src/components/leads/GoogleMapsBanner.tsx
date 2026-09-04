import { BarChart3, MapPin } from "lucide-react"
import { Link } from "react-router-dom"
import { CLASSE_ACAO_HERO, PageHero } from "@/components/shared/PageHero"

export function GoogleMapsBanner() {
  return (
    <PageHero
      icone={<MapPin className="size-6" />}
      titulo="Leads de Google Maps"
      descricao="Buscá negocios sin web o con web mala, seguí el embudo y gestioná los seguimientos con sugerencias generadas por IA."
      gradiente="from-google-maps-start/85 via-google-maps-mid/85 to-google-maps-end/85"
      acoes={
        <Link to="/analytics" className={CLASSE_ACAO_HERO}>
          <BarChart3 className="size-4" />
          <span className="hidden sm:inline">Analytics</span>
        </Link>
      }
    />
  )
}
