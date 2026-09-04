import type { Lead } from "@/types/lead"

export interface ObjecaoResposta {
  objecao: string
  resposta: string
}

/** Playbook de abordaje armado a partir de los datos del lead - determinístico e
 * instantáneo (sin costo de IA). La IA genera la COPY; esto es el plan de venta
 * que te orienta antes de apretar el botón.
 *
 * Adaptación PresencIA: ProspectOS detecta la situación de la web de cada
 * negocio; acá se usa esa señal para inferir que el negocio maneja la atención
 * a mano y el ángulo apunta a automatizar el WhatsApp (responder solo, agendar
 * turnos, recordatorios, ficha del cliente), no a hacerle una página. */
export interface EstrategiaLead {
  cenario: string
  angulo: string
  ganchos: string[]
  objecoes: ObjecaoResposta[]
  proximoPasso: string
}

const OBJECOES_MANUAL: ObjecaoResposta[] = [
  {
    objecao: '"Ya contesto todo por WhatsApp, no necesito nada"',
    resposta:
      "Justamente por eso: hoy dependés de estar vos con el celular en la mano. El asistente contesta lo de siempre y agenda los turnos solo, también de noche y cuando estás atendiendo. Vos seguís con los casos que sí necesitan una persona.",
  },
  {
    objecao: '"Es un gasto / no es prioridad ahora"',
    resposta:
      "Compará con lo que vale UN turno que se pierde porque nadie contestó a tiempo, o un cliente que se fue con otro. Es un abono mensual, sin permanencia, y se paga con los turnos que deja de perder.",
  },
  {
    objecao: '"No tengo tiempo para configurar eso"',
    resposta:
      "No configurás nada vos - lo dejo andando yo sobre tu propio número de WhatsApp. Sólo necesito una charla de 20 minutos para entender cómo trabajás.",
  },
]

const OBJECOES_TIENE_ALGO: ObjecaoResposta[] = [
  {
    objecao: '"Ya tengo una chica que contesta"',
    resposta:
      "Perfecto, y ella sigue: el asistente le saca de encima las mismas 5 preguntas de siempre y le arma la agenda ordenada. Ella queda para lo que de verdad necesita una persona.",
  },
  {
    objecao: '"Tengo un sistema de turnos"',
    resposta:
      "Bien, ¿y el cliente lo usa o igual te escribe por WhatsApp? PresencIA trabaja donde el cliente ya está: le contesta y le reserva el turno en la misma conversación, sin mandarlo a otra app.",
  },
  {
    objecao: '"Lo voy a pensar / lo hablo con mi socio"',
    resposta:
      "Dale. Si querés, te hago una prueba con tu propio número para que veas cómo responde, sin compromiso. Con eso lo charlan con algo concreto en la mano.",
  },
]

function ganchoDeReputacao(lead: Lead): string | null {
  const nota = lead.nota ?? 0
  const avaliacoes = lead.num_avaliacoes ?? 0
  if (nota >= 4.8 && avaliacoes >= 50) {
    return `${nota} de puntuación con ${avaliacoes} reseñas: reputación de sobra y negocio bien establecido - es el cliente ideal, con volumen de consultas que hoy atiende a pulmón.`
  }
  if (nota >= 4.5 && avaliacoes >= 10) {
    return `${nota} de puntuación con ${avaliacoes} reseñas: ya tienen demanda y clientes fieles - el cuello de botella es la atención, no la falta de gente.`
  }
  return `${nota} de puntuación en Google - usalo como elogio de apertura, nunca como crítica.`
}

export function montarEstrategia(lead: Lead): EstrategiaLead {
  const problemas = (lead.site_problemas ?? "").toLowerCase()
  const siteRuim = lead.site_status === "site_ruim"

  const ganchos: string[] = []
  const reputacao = ganchoDeReputacao(lead)
  if (reputacao) ganchos.push(reputacao)

  let cenario: string
  let angulo: string
  let objecoes: ObjecaoResposta[]

  if (lead.site_status === "site_ok") {
    return {
      cenario: "Web ok",
      angulo:
        "La web actual está técnicamente bien, así que no hay un problema obvio de lo digital para usar de excusa. Si igual querés abordar, el ángulo es la atención: por más web que tengan, las consultas y los turnos siguen entrando por WhatsApp y los contestan a mano. Si no, considerá ignorar el lead y enfocarte en los más calientes.",
      ganchos: [reputacao ?? "Usá la reputación como apertura, si abordás."].filter(Boolean) as string[],
      objecoes: OBJECOES_MANUAL,
      proximoPasso:
        "Prioridad baja: este lead compite con los que ni web tienen en tu cola. Abordá sólo si la zona o el rubro es estratégico.",
    }
  }

  if (!siteRuim) {
    cenario = "Sin web"
    angulo =
      "Negocio bien valorado pero sin nada de sistema: si no tienen ni una web, casi seguro toda la atención pasa por el WhatsApp personal y la agenda es un cuaderno. El argumento: tienen la demanda (las reseñas lo muestran), lo que falta es algo que la sostenga sin depender de que vos estés con el celular."
    objecoes = OBJECOES_MANUAL
    if (lead.instagram_url) {
      ganchos.push(
        "Tienen Instagram activo - invierten en estar presentes. El paso natural es ordenar la atención que llega por ahí: que el bot conteste y agende, en vez de responder DM por DM."
      )
    } else {
      ganchos.push(
        "Presencia digital casi nula - el que llega, llega por recomendación y escribe al WhatsApp. Un asistente que contesta y agenda solo ordena ese caos sin que ellos hagan nada."
      )
    }
  } else if (problemas.includes("fora do ar") || problemas.includes("caíd") || problemas.includes("caid")) {
    cenario = "Web caída"
    angulo =
      "La web NO ABRE - señal de que nadie les está dando una mano con lo digital hace rato. Abrí la charla como un AVISO de cortesía (genera agradecimiento, no parece venta), y de ahí llevá la conversación a lo que de verdad les mueve la aguja: automatizar la atención por WhatsApp."
    objecoes = OBJECOES_TIENE_ALGO
    ganchos.push(
      "Decí que quisiste entrar a la web y está caída - estás avisando, no vendiendo. La oferta viene después de la reacción."
    )
  } else if (problemas.includes("ssl") || problemas.includes("https") || problemas.includes("segur")) {
    cenario = "Web insegura"
    angulo =
      'El navegador marca la web como "no segura" - otra señal de que lo digital quedó abandonado. Más que la web, el punto es que con esa reputación siguen atendiendo cada consulta a mano y perdiendo turnos fuera de horario.'
    objecoes = OBJECOES_TIENE_ALGO
    ganchos.push(
      'Mencioná el cartel de "no seguro" al pasar, como señal de que nadie les está mirando lo digital, y llevá la charla al WhatsApp.'
    )
  } else if (problemas.includes("celular") || problemas.includes("mobile") || problemas.includes("móvil")) {
    cenario = "Web no adaptada al celular"
    angulo =
      "La web se rompe en el celular - y casi toda la búsqueda local es desde el celular. Señal de que lo digital quedó viejo. El ángulo real: el cliente termina escribiéndoles al WhatsApp igual, y ahí contestan todo a mano."
    objecoes = OBJECOES_TIENE_ALGO
    ganchos.push(
      "Sugerí que abran su propia web en el celular ahora - la mala experiencia se vende sola como señal de que hace falta ordenar lo digital."
    )
  } else if (problemas.includes("lento") || problemas.includes("lenta")) {
    cenario = "Web lenta"
    angulo =
      "La web anda, pero tarda tanto en cargar que la mayoría se va antes de ver nada - y termina escribiendo al WhatsApp. El argumento: la web no les está resolviendo la atención, la resuelven ellos a mano, mensaje por mensaje."
    objecoes = OBJECOES_TIENE_ALGO
    ganchos.push(
      "Mencioná que la web carga lenta como señal de que lo digital quedó relegado, y pasá a lo importante: cuántas consultas por WhatsApp contestan por día."
    )
  } else if (problemas.includes("construtor") || problemas.includes("wix") || problemas.includes("plantilla")) {
    cenario = "Web de plantilla"
    angulo =
      "La web es de plantilla armada (Wix, Canva y afines) - funciona, pero es la señal de que lo digital lo resolvieron con lo mínimo. El punto fuerte no es la web: es que un negocio con esa reputación sigue agendando turnos a mano por WhatsApp."
    objecoes = [
      {
        objecao: '"El Wix/la plantilla me alcanza"',
        resposta:
          "Para mostrarte alcanza, sí. Pero no te contesta un mensaje ni te agenda un turno. Eso lo seguís haciendo vos. PresencIA es esa parte: la atención por WhatsApp funcionando sola.",
      },
      {
        objecao: '"Yo mismo me lo actualizo, es práctico"',
        resposta:
          "Buenísimo, eso queda igual. Lo que te propongo no toca la web: es que las consultas y los turnos que entran por WhatsApp los maneje un asistente en vez de vos a mano.",
      },
      {
        objecao: '"No quiero pagar otra mensualidad"',
        resposta:
          "Es un solo abono, sin permanencia, y reemplaza horas tuyas contestando lo mismo todos los días. Se paga con los turnos que hoy se pierden por no contestar a tiempo.",
      },
    ]
    objecoes = OBJECOES_TIENE_ALGO.concat(objecoes)
    ganchos.push(
      'Comentá que se nota que la web es de plantilla y enganchá con la reputación: "un negocio con esta puntuación seguro recibe un montón de mensajes; ¿los contestás todos vos?".'
    )
  } else if (problemas.includes("vazia") || problemas.includes("vacía") || problemas.includes("vacia")) {
    cenario = "Web vacía"
    angulo =
      "La web existe pero está prácticamente vacía - no cuenta qué hacen, no muestra nada. Señal de que lo digital nunca se terminó de armar. El cliente termina en el WhatsApp preguntando todo, y ahí responden a mano."
    objecoes = OBJECOES_TIENE_ALGO
    ganchos.push(
      "Citá algo concreto que falta (servicios, precios, botón de WhatsApp) para mostrar que de verdad miraste, y pasá a la atención."
    )
  } else {
    cenario = "Web con problemas"
    angulo =
      "La web tiene problemas técnicos - señal de que lo digital quedó abandonado. Abordá como diagnóstico: nombrá el problema en criollo, y de ahí llevá la charla a lo que de verdad les cuesta clientes: contestar cada consulta y agendar cada turno a mano por WhatsApp."
    objecoes = OBJECOES_TIENE_ALGO
    if (lead.site_problemas) {
      ganchos.push(`Problemas detectados en la web: ${lead.site_problemas}.`)
    }
  }

  if (siteRuim && lead.instagram_url) {
    ganchos.push(
      'El Instagram puede estar más al día que la web - usalo: "el Instagram lo tienen impecable; ¿y los mensajes que les llegan por ahí, los contestás vos?".'
    )
  }

  // ganchos concretos del raio-X: lo que la web NO tiene (dato real, no chute)
  const faltas = lead.site_checklist?.falta ?? []
  if (siteRuim && faltas.length > 0) {
    ganchos.push(
      `Faltantes concretos detectados en la web: ${faltas.slice(0, 3).join(", ")}${faltas.length > 3 ? "..." : ""} - citá uno como ejemplo específico.`
    )
  }

  const proximoPasso =
    lead.status === "novo"
      ? "Generá la copy de contacto (ya usa esta estrategia), revisala con tu tono y mandala por WhatsApp - y cuando el lead responda, ofrecele una prueba con su propio número. Después marcá como contactado."
      : (lead.follow_ups_enviados ?? 0) > 0
        ? `Ya van ${lead.follow_ups_enviados} seguimiento(s). Generá la copy de seguimiento con un elemento NUEVO (un plazo, un ejemplo, una prueba) - repetir el mismo argumento quema el lead.`
        : "Lead ya contactado sin respuesta: generá la copy de seguimiento con tono liviano de recordatorio y un pedido de acción cerrado."

  return { cenario, angulo, ganchos, objecoes, proximoPasso }
}
