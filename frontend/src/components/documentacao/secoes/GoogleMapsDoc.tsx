import {
  DocSection,
  DocH2,
  DocP,
  DocList,
  DocCallout,
  DocCode,
} from "@/components/documentacao/DocSection"

export function GoogleMapsDoc() {
  return (
    <DocSection titulo="Google Maps">
      <DocP>
        El canal de Google Maps busca negocios por rubro + ciudad y filtra
        automáticamente los que valen la pena abordar: buena puntuación
        (≥ 4.0) y sin sitio web registrado en ningún lado de la web.
      </DocP>

      <DocH2>Cómo buscar leads</DocH2>
      <DocP>
        Con el botón "Nueva búsqueda" hay dos modos:
      </DocP>
      <DocList>
        <li>
          <strong>Por texto</strong>: una o más líneas con el formato{" "}
          <DocCode>rubro en ciudad</DocCode> (ej.: "centro de estética en
          Tandil"). Cada línea es una búsqueda separada.
        </li>
        <li>
          <strong>Por mapa</strong>: soltás uno o varios pines en el mapa,
          ajustás el radio de cada uno y elegís qué rubros buscar alrededor
          — útil para cubrir una zona sin tener que escribir el nombre de
          cada barrio.
        </li>
      </DocList>
      <DocP>
        En cualquiera de los dos modos podés ponerle una{" "}
        <strong>campaña</strong> a la búsqueda (ej.: "belleza",
        "inmobiliarias", "deportes") — es un rótulo libre y opcional que
        agrupa los leads de esa búsqueda para filtrarlos juntos después,
        aunque hayan sido varios rubros distintos. El sistema corre en
        segundo plano y muestra el progreso en vivo.
      </DocP>
      <DocCallout variante="warning">
        Por defecto la búsqueda depende del{" "}
        <DocCode>google-maps-scraper.exe</DocCode>, un programa externo que
        tiene que estar instalado en la carpeta del backend (ver la sección
        "Instalación"). Como alternativa, en Configuración → Fuente de datos
        podés usar la Google Places API oficial en su lugar — más estable,
        pero paga y con cuota propia en Google Cloud.
      </DocCallout>

      <DocH2>Doble chequeo de "sin sitio web"</DocH2>
      <DocP>
        Después de listar los negocios de Maps, el sistema hace una segunda
        búsqueda en la web (DuckDuckGo/Bing/Yahoo) por el nombre de cada uno,
        para confirmar que de verdad no tiene sitio en ningún lado — no solo
        que no lo cargó en su ficha de Maps. Esto evita traer leads que ya
        tienen sitio en otro lado.
      </DocP>

      <DocH2>Lista y Kanban</DocH2>
      <DocP>
        Podés alternar entre la vista en <strong>Lista</strong> (tarjetas con
        todos los detalles) y <strong>Kanban</strong> (columnas por etapa del
        embudo, arrastrando la tarjeta entre columnas para cambiar el
        estado).
      </DocP>

      <DocH2>Buscar y completar datos de contacto</DocH2>
      <DocList>
        <li>
          <strong>Buscar por nombre, dirección o teléfono</strong>: el cuadro
          de búsqueda de la lista encuentra por cualquiera de los tres — el
          teléfono ignora espacios, guiones y paréntesis, así que buscar
          "4652660" encuentra a "0249 15-465-2660".
        </li>
        <li>
          <strong>Editar datos de contacto</strong>: en la ficha del lead se
          puede cargar o corregir a mano el celular, e-mail, Instagram,
          Facebook y dirección — útil cuando el scraper no encontró alguno o
          cuando aparece un dato nuevo durante la prospección. Si cambiás el
          teléfono, el link de WhatsApp se regenera solo.
        </li>
      </DocList>

      <DocH2>Seguimiento inteligente</DocH2>
      <DocList>
        <li>
          <strong>Generar copy por IA</strong>: dos tipos — "contacto"
          (primer acercamiento) y "seguimiento" (retomar contacto), con tono y
          argumento adaptados automáticamente.
        </li>
        <li>
          <strong>Marcar seguimiento enviado</strong>: registra que mandaste
          el mensaje y sugiere la próxima fecha (cadencia creciente: 3,
          después 5, después 7 días, para no parecer insistente).
        </li>
        <li>
          <strong>Lead difícil</strong>: aparece un sello de aviso cuando el
          lead ya recibió seguimiento y quedó parado por más de 5 días, con
          un atajo para archivarlo.
        </li>
      </DocList>

      <DocH2>Otras acciones</DocH2>
      <DocList>
        <li>
          <strong>Etiquetas y notas</strong>: texto libre para organizar como
          quieras.
        </li>
        <li>
          <strong>Plantillas de mensaje</strong>: guardá mensajes que
          funcionan bien y reutilizalos después en otros leads.
        </li>
        <li>
          <strong>Exportar CSV</strong>: descarga todos los leads filtrados en
          una planilla.
        </li>
        <li>
          <strong>Ignorar</strong>: desaparece de la lista principal
          (reversible). <strong>Eliminar definitivamente</strong>: lo borra de
          la base para siempre, solo permitido en leads ya ignorados.
        </li>
        <li>
          <strong>Eliminar todos los leads</strong>: en Configuración →
          Zona de peligro hay un botón para borrar de una vez todos los
          leads de Maps (con su historial y conversaciones) y arrancar de
          cero. No tiene vuelta atrás, por eso pide escribir una frase de
          confirmación exacta antes de habilitarse.
        </li>
      </DocList>
    </DocSection>
  )
}
