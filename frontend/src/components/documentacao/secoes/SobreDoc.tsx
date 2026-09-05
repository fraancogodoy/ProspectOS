import { GitHubIcon } from "@/components/icons/GitHubIcon"
import { DocSection, DocP, DocH2 } from "@/components/documentacao/DocSection"

const LINKS = [
  {
    label: "Este repositorio (fork)",
    url: "https://github.com/fraancogodoy/ProspectOS",
    icone: GitHubIcon,
  },
  {
    label: "Proyecto original (nando0x/ProspectOS)",
    url: "https://github.com/nando0x/ProspectOS",
    icone: GitHubIcon,
  },
]

export function SobreDoc() {
  return (
    <DocSection titulo="Acerca de">
      <DocP>
        Esta herramienta prospecta clientes potenciales para PresencIA
        (automatización de WhatsApp para negocios chicos: peluquerías,
        canchas, inmobiliarias), combinando Google Maps e Instagram en un
        solo flujo de trabajo. Es un fork traducido y adaptado del proyecto
        original <strong>ProspectOS</strong>, pensado originalmente para
        prospectar clientes de venta de sitios web.
      </DocP>

      <DocH2>Qué cambia en este fork</DocH2>
      <DocP>
        Interfaz completa en español, campañas para agrupar búsquedas,
        búsqueda por teléfono, datos de contacto editables (celular,
        Instagram, Facebook, e-mail, dirección), corrección del link de
        WhatsApp para números argentinos, copia de seguridad exportable/
        importable entre instalaciones, despliegue en la nube con login
        opcional, y un botón para borrar todos los leads de una base de
        prueba.
      </DocP>

      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
        {LINKS.map(({ label, url, icone: Icone }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent/40"
          >
            <Icone className="size-4" />
            {label}
          </a>
        ))}
      </div>
    </DocSection>
  )
}
