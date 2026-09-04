"""Integração com os provedores de IA (Gemini, Groq, NVIDIA).

Arquitetura dos prompts:
- Cada geração envia um par (system, user): o SYSTEM carrega a persona do
  copywriter, o perfil do vendedor (configurável) e as regras invariáveis;
  o USER carrega só os dados do lead e as decisões desta rodada.
- Decisões que pedem variação (qual fechamento usar, que horário propor) são
  sorteadas AQUI no servidor e entregues prontas ao modelo - LLM "sorteando"
  colapsa sempre pro mesmo padrão.
- Um único motor de fallback (`executar_com_fallback`) serve todos os usos:
  mensagem do Maps, DM do Instagram e classificação de perfis.

NOTA (adaptação PresencIA): os prompts abaixo foram reescritos para
español rioplatense (voseo) e para uma oferta de *automação de atendimento
por WhatsApp* (PresencIA), no lugar da oferta original de "criação de sites".
A lógica, as assinaturas de função, as chaves de JSON e os tokens de enum
(prioridade/estágio) NÃO mudaram - só o texto dos prompts.
"""

import json
import logging
import random
import time
from datetime import date, datetime, timedelta

import db
from constantes import (
    ESTAGIO_NEGOCIACAO_PADRAO,
    ESTAGIOS_NEGOCIACAO,
    MAX_CARACTERES_ITEM_EVITAR,
    MAX_CARACTERES_JUSTIFICATIVA,
    MAX_CARACTERES_LEITURA_ANALISE,
    MAX_CARACTERES_NICHO_INSTAGRAM,
    MAX_CARACTERES_OBJETIVO_ANALISE,
    MAX_CARACTERES_RESPOSTA_SUGERIDA,
    MAX_CARACTERES_SUGESTAO_DM,
    MAX_ITENS_EVITAR,
    MAX_MENSAGENS_NO_PROMPT,
    PRIORIDADES_VALIDAS,
)

logger = logging.getLogger(__name__)

# Ordem de preferência dos provedores de IA - se o primeiro falhar/estourar cota,
# tenta o próximo automaticamente. Cada usuário pode configurar 1, 2 ou os 3.
ORDEM_PROVEDORES_IA = ["gemini", "groq", "nvidia"]

# Timeout por chamada de IA. Sem ele, um provedor que pendura a conexão travaria
# a geração pra sempre e o fallback nunca chegaria ao próximo provedor.
IA_TIMEOUT_SEGUNDOS = 45

NOMES_AMIGAVEIS_PROVEDOR = {
    "gemini": "Google Gemini",
    "groq": "Groq",
    "nvidia": "NVIDIA Build",
}

# Copy quer criatividade; classificação quer consistência.
TEMPERATURA_COPY = 0.9
TEMPERATURA_CLASSIFICACAO = 0.2

# Evita ficar tentando de novo um provedor que acabou de bater cota - guarda,
# em memória, até quando (time.monotonic()) cada provedor deve ser pulado.
COOLDOWN_COTA_ESTOURADA_SEGUNDOS = 300  # 5 minutos
_provedores_em_cooldown = {}


class NenhumProvedorDisponivel(Exception):
    """Todos os provedores configurados falharam (ou nenhum está configurado).
    `erro_final` carrega o último erro real, ou None se nada chegou a ser tentado."""

    def __init__(self, erro_final):
        super().__init__(str(erro_final))
        self.erro_final = erro_final


def _provedor_em_cooldown(provedor):
    expira_em = _provedores_em_cooldown.get(provedor)
    return expira_em is not None and time.monotonic() < expira_em


def _marcar_cooldown_se_cota(provedor, erro):
    if _e_erro_de_cota(erro):
        _provedores_em_cooldown[provedor] = time.monotonic() + COOLDOWN_COTA_ESTOURADA_SEGUNDOS


def _e_erro_de_cota(erro):
    """Detecta erro de cota/rate-limit olhando primeiro os atributos estruturados
    da exceção (status_code/code do SDK) e o nome da classe, e só por último o
    texto da mensagem - o texto muda entre versões de SDK e idiomas, os códigos não."""
    status = getattr(erro, "status_code", None) or getattr(erro, "code", None)
    if status == 429:
        return True
    if type(erro).__name__ in ("RateLimitError", "ResourceExhausted", "TooManyRequests"):
        return True
    texto = str(erro).lower()
    return (
        "quota" in texto
        or "resource_exhausted" in texto
        or "429" in texto
        or "rate limit" in texto
    )


def traduzir_erro_ia(erro):
    """Convierte errores técnicos de cualquier proveedor de IA en mensajes que un usuario común entiende."""
    texto_erro = str(erro).lower()

    if "api_key" in texto_erro or "api key" in texto_erro or isinstance(erro, RuntimeError):
        return str(erro)
    if _e_erro_de_cota(erro):
        return "cuota gratuita agotada por ahora"
    if "timeout" in texto_erro or "deadline" in texto_erro:
        return "tardó demasiado en responder"
    if "unavailable" in texto_erro or "503" in texto_erro:
        return "servicio no disponible en este momento"

    return "error inesperado (mirá logs/prospeccao.log)"


# ---------------------------------------------------------------------------
# Adapters dos provedores - todos recebem (system, user, temperatura, formato_json)
# ---------------------------------------------------------------------------

def gemini_gerar_mensagem(system, user, temperatura=TEMPERATURA_COPY, formato_json=False):
    from google import genai

    chave = db.obter_config("gemini")
    # google-genai usa timeout em MILISSEGUNDOS no http_options
    cliente = genai.Client(api_key=chave, http_options={"timeout": IA_TIMEOUT_SEGUNDOS * 1000})
    config = {"system_instruction": system, "temperature": temperatura}
    if formato_json:
        config["response_mime_type"] = "application/json"
    resposta = cliente.models.generate_content(
        model="gemini-flash-latest", contents=user, config=config
    )
    return resposta.text.strip()


def groq_gerar_mensagem(system, user, temperatura=TEMPERATURA_COPY, formato_json=False):
    from openai import OpenAI

    chave = db.obter_config("groq")
    cliente = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=chave, timeout=IA_TIMEOUT_SEGUNDOS)
    extras = {"response_format": {"type": "json_object"}} if formato_json else {}
    resposta = cliente.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=temperatura,
        **extras,
    )
    return resposta.choices[0].message.content.strip()


def nvidia_gerar_mensagem(system, user, temperatura=TEMPERATURA_COPY, formato_json=False):
    from openai import OpenAI

    chave = db.obter_config("nvidia")
    cliente = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=chave, timeout=IA_TIMEOUT_SEGUNDOS)
    extras = {"response_format": {"type": "json_object"}} if formato_json else {}
    resposta = cliente.chat.completions.create(
        model="nvidia/llama-3.3-nemotron-super-49b-v1",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=temperatura,
        top_p=0.9,
        max_tokens=700,
        **extras,
    )
    return resposta.choices[0].message.content.strip()


GERADORES = {
    "gemini": gemini_gerar_mensagem,
    "groq": groq_gerar_mensagem,
    "nvidia": nvidia_gerar_mensagem,
}


def executar_com_fallback(system, user, parser=None, descricao_log="gerar mensagem",
                          temperatura=TEMPERATURA_COPY, formato_json=False):
    """Tenta o par (system, user) em cada provedor configurado, na ordem de
    preferência. Se um falhar (cota, erro, resposta que o parser rejeita), tenta
    o próximo. Retorna (resultado, provedor_usado, avisos_para_o_usuario);
    levanta NenhumProvedorDisponivel se todos falharem."""
    avisos = []
    erro_final = None

    for provedor in ORDEM_PROVEDORES_IA:
        if not db.obter_config(provedor):
            continue  # provedor não configurado, pula silenciosamente

        if _provedor_em_cooldown(provedor):
            logger.info("provedor %s em cooldown (cota excedida recentemente), pulando", provedor)
            avisos.append(
                f"{NOMES_AMIGAVEIS_PROVEDOR[provedor]} no disponible ahora (cuota gratuita agotada por ahora)."
            )
            continue

        try:
            resposta = GERADORES[provedor](
                system, user, temperatura=temperatura, formato_json=formato_json
            )
            resultado = parser(resposta) if parser else resposta
            logger.info("%s com sucesso via %s", descricao_log, provedor)
            return resultado, provedor, avisos
        except Exception as erro:
            logger.warning("provedor %s falhou ao %s: %s", provedor, descricao_log, erro)
            _marcar_cooldown_se_cota(provedor, erro)
            avisos.append(
                f"{NOMES_AMIGAVEIS_PROVEDOR[provedor]} no disponible ahora ({traduzir_erro_ia(erro)})."
            )
            erro_final = erro
            continue

    raise NenhumProvedorDisponivel(erro_final)


# ---------------------------------------------------------------------------
# Blocos compartilhados dos prompts
# ---------------------------------------------------------------------------

def saudacao_por_horario():
    """Calcula a saudação certa a partir da hora real do sistema - a IA não tem
    acesso ao relógio, então isso precisa vir pronto do backend, nunca "adivinhado"
    pelo modelo."""
    hora = datetime.now().hour
    if 5 <= hora < 12:
        return "Buen día"
    if 12 <= hora < 20:
        return "Buenas tardes"
    return "Buenas noches"


PERGUNTAS_DE_FECHAMENTO = [
    "¿Querés que te muestre cómo funcionaría con tu negocio?",
    "¿Te mando una demo rápida, sin compromiso?",
    "¿Te sirve si te muestro un ejemplo con un caso parecido al tuyo?",
    "¿Querés que te pase más info y lo vemos con calma?",
    "¿Te hago una prueba con tu propio WhatsApp para que veas cómo responde?",
]

HORARIOS_COMERCIAIS = ["9", "9:30", "10", "10:40", "11", "14", "14:30", "15:20", "16", "17"]
NOMES_DIAS_UTEIS = ["lunes", "martes", "miércoles", "jueves", "viernes"]


def sortear_fechamento():
    """Decide AQUI (não no modelo) como a mensagem termina: metade das vezes uma
    pergunta de sim/não, metade uma proposta de horário concreto - com dia útil e
    hora reais gerados agora. Pedir pro LLM 'sortear' faz ele repetir sempre o
    mesmo fechamento e inventar horários fixos."""
    if random.random() < 0.5:
        pergunta = random.choice(PERGUNTAS_DE_FECHAMENTO)
        return (
            f'Cerrá con esta pregunta de sí/no (adaptá sólo lo necesario para que fluya en el texto): "{pergunta}"'
        )

    data_alvo = date.today() + timedelta(days=random.randint(1, 3))
    while data_alvo.weekday() >= 5:
        data_alvo += timedelta(days=1)
    dia = NOMES_DIAS_UTEIS[data_alvo.weekday()]
    hora = random.choice(HORARIOS_COMERCIAIS)
    return f"Cerrá proponiendo un horario concreto para una charla corta: {dia} a las {hora}."


def _bloco_perfil_vendedor():
    """Perfil configurável de quem envia as mensagens (Configurações → Seu perfil).
    Sem configuração, retorna vazio e o system usa a persona neutra."""
    nome = db.obter_config("vendedor_nome")
    apresentacao = db.obter_config("vendedor_apresentacao")
    diferencial = db.obter_config("vendedor_diferencial")
    if not (nome or apresentacao or diferencial):
        return ""

    linhas = ["", "Quién manda los mensajes (escribí con la voz de esta persona):"]
    if nome:
        linhas.append(f"- Nombre: {nome} (presentate por tu nombre cuando suene natural)")
    if apresentacao:
        linhas.append(f"- A qué se dedica: {apresentacao}")
    if diferencial:
        linhas.append(f"- Diferencial a destacar cuando corresponda: {diferencial}")
    return "\n".join(linhas) + "\n"


def montar_system_copywriter(canal):
    """System prompt fixo do copywriter (canal: 'WhatsApp' ou 'DM de Instagram') +
    o perfil do vendedor quando configurado."""
    tom_canal = (
        "Tono de DM real entre dos personas: liviano e informal, sin 'estimado/a', sin formalidad de e-mail."
        if canal == "DM de Instagram"
        else "Tono de charla directa y con seguridad entre personas, sin sonar a vendedor robótico ni arrogante."
    )

    return f"""Sos un copywriter senior especializado en prospección B2B en frío por {canal}, con años de experiencia en ventas consultivas a negocios chicos locales de Argentina. Los dueños de negocio reciben spam de "sistema/marketing" todas las semanas; tus mensajes se destacan por ser específicos, humanos y fáciles de responder en segundos.

Escribí SIEMPRE en español rioplatense, con voseo ("vos hacés", "te muestro", "fijate"). Nunca uses "tú", "usted" ni "vosotros".

Qué se ofrece (PresencIA): un asistente que automatiza la atención por WhatsApp del negocio. Responde solo las 24 horas, contesta las preguntas de siempre, agenda turnos, manda recordatorios y guarda la ficha de cada cliente. El negocio deja de perder mensajes fuera de horario y de anotar todo a mano. Se conecta al número propio del negocio, sin instalar nada, con un abono mensual. NO es una página web ni un sistema de gestión: es la atención por WhatsApp funcionando sola.
{_bloco_perfil_vendedor()}
Reglas invariables (valen para TODO mensaje):
- Escribí SIEMPRE en primera persona del singular ("yo lo armo", "ofrezco", "te puedo mostrar"). Quien manda el mensaje es UNA persona que trabaja por su cuenta. Nunca "nosotros", "ofrecemos", "nuestro equipo" ni voz de agencia.
- {tom_canal}
- Abrí de forma natural y directa. Nunca empieces con "Estaba mirando/buscando en Google y vi..." ni variaciones: es el cliché número uno del spam.
- Usá SÓLO los datos que te doy; nunca inventes números, premios, clientes ni testimonios.
- Adaptá el vocabulario al rubro (peluquería/estética → "los turnos y las consultas por WhatsApp"; cancha de fútbol → "las reservas de cancha y las señas"; inmobiliaria → "las consultas por propiedades y las visitas"; consultorio → "la agenda de pacientes").
- Si el campo Nombre está dominado por un nombre de persona (ej: "Dra. Ana Souza Odontología"), hablale A la persona por el nombre de pila, "vos" en singular. Si es institucional (ej: "Vivarte Odontología"), usá "ustedes"/"el equipo", sin inventar nombres.
- Terminá con el cierre EXACTO indicado en la tarea: un pedido de acción concreto y cerrado, nunca "¿te parece si charlamos?".
- Respondé SÓLO con el texto final del mensaje: sin comillas alrededor, sin explicaciones, sin markdown.

Ejemplo del tono correcto (regla de calidad, no copies la estructura literal):
"Janet, buenas tardes! Vi que Estética Vit tiene 5.0 en Google con más de 100 reseñas, una reputación que pocas de la zona tienen. Con esa demanda, seguro te llegan un montón de mensajes por WhatsApp y contestás todo a mano, y fuera de horario se te escapan turnos. Yo pongo a andar un asistente que responde solo y agenda los turnos en tu propio WhatsApp. ¿Te hago una prueba con tu número para que veas cómo responde?"
"""


def _linha_dado(rotulo, valor):
    return f"- {rotulo}: {valor}" if valor not in (None, "", 0) else None


def _bloco_dados_empresa(nome, categoria, endereco, nota, num_avaliacoes=None,
                         cidade=None, instagram_url=None):
    linhas = [
        _linha_dado("Nombre", nome),
        _linha_dado("Rubro", categoria or "no informado"),
        _linha_dado("Ciudad", cidade),
        _linha_dado("Dirección", endereco or "no informada"),
        _linha_dado("Puntuación en Google", nota),
        _linha_dado("Cantidad de reseñas en Google", num_avaliacoes),
        _linha_dado("Instagram del negocio", instagram_url),
        _linha_dado("Saludo a usar (hora real de ahora)", saudacao_por_horario()),
    ]
    return "\n".join(l for l in linhas if l)


def _contexto_site(site_status, site_problemas):
    if site_status == "site_ruim":
        return (
            f"El negocio TIENE una web, pero con problemas serios detectados automáticamente: "
            f"{site_problemas or 'problemas técnicos'}. Más allá de la web, el punto es otro: con esa "
            "demanda y sin un sistema, la atención por WhatsApp la hacen a pulmón. Mencioná el problema "
            "de la web de forma LLANA y respetuosa (ej.: en vez de 'sin viewport', decí que 'la página no "
            "se abre bien en el celular'; en vez de 'HTTP 500', 'la página está caída') como señal de que "
            "nadie les está dando una mano con lo digital, y llevá la charla a automatizar la atención por WhatsApp."
        )
    return (
        "El negocio NO tiene web. Sumado a que tiene buena reputación, es señal de que manejan todo a mano: "
        "probablemente contestan cada consulta por WhatsApp o Instagram una por una y se les escapan turnos "
        "fuera de horario. Ese es el ángulo: tienen la demanda (las reseñas lo muestran) pero no un sistema "
        "que la sostenga. Si tienen Instagram, reconocelo ('el Instagram lo tienen activo') y posicioná el "
        "asistente como lo que ordena la atención, nunca como reemplazo de la red social."
    )


# ---------------------------------------------------------------------------
# Copy do Maps (WhatsApp)
# ---------------------------------------------------------------------------

def montar_prompt_contato(nome, categoria, endereco, nota, site_status=None, site_problemas=None,
                          num_avaliacoes=None, cidade=None, instagram_url=None, conteudo_site=None):
    bloco_conteudo = (
        f"""
Contenido REAL de la web actual del negocio (capturado ahora):
\"\"\"{conteudo_site}\"\"\"
Usá ese contenido para citar UN detalle específico de la web (algo desactualizado, vago o flojo) en tono respetuoso: eso prueba que de verdad la miraste, sin ningunear el trabajo que ya hay.
"""
        if conteudo_site
        else ""
    )

    return f"""Escribí UN mensaje de primer contacto por WhatsApp (3 a 5 frases) ofreciendo automatizar la atención por WhatsApp (PresencIA) al negocio de abajo.

{_contexto_site(site_status, site_problemas)}
{bloco_conteudo}
Datos del negocio:
{_bloco_dados_empresa(nome, categoria, endereco, nota, num_avaliacoes, cidade, instagram_url)}

Indicaciones de este mensaje:
- Mencioná la puntuación (y la cantidad de reseñas, si hay) como dato relevante del argumento, no como elogio vacío.
- Encajá el saludo indicado de forma natural, variando la posición en la frase (no siempre al principio).
- {sortear_fechamento()}
"""


def montar_prompt_followup(nome, categoria, endereco, nota, follow_ups_enviados,
                           num_avaliacoes=None, cidade=None, mensagem_anterior=None):
    numero_do_followup = max(follow_ups_enviados, 1)
    if numero_do_followup <= 1:
        orientacao_tom = (
            "Este es el PRIMER seguimiento (sin respuesta al primer contacto). Tono de recordatorio amable "
            "y liviano, como quien recuerda con educación: el mensaje anterior puede haber pasado desapercibido."
        )
    else:
        orientacao_tom = (
            f"Este es el seguimiento número {numero_do_followup} (ya van {numero_do_followup} mensajes "
            "sin respuesta). Sé más directo y conciso, sin sonar impaciente. Traé un elemento NUEVO "
            "que no estaba en los mensajes anteriores (un plazo, una prueba social genérica sobre tener "
            "la atención automatizada, o preguntar de frente si todavía tiene sentido)."
        )

    bloco_anterior = (
        f'\nMensaje ya enviado antes (NO repitas el argumento ni su estructura; variá de verdad):\n"""{mensagem_anterior}"""\n'
        if mensagem_anterior
        else ""
    )

    return f"""Escribí UN mensaje de SEGUIMIENTO por WhatsApp (2 a 4 frases, más corto que un primer contacto) para retomar contacto con el negocio de abajo, que recibió una propuesta para automatizar su atención por WhatsApp y no respondió.

{orientacao_tom}
{bloco_anterior}
Datos del negocio:
{_bloco_dados_empresa(nome, categoria, endereco, nota, num_avaliacoes, cidade)}

Indicaciones de este mensaje:
- NO empieces pidiendo perdón por "molestar de nuevo" ni con frases inseguras.
- {sortear_fechamento()}
"""


def gerar_mensagem_com_fallback(nome, categoria, endereco, nota, tipo="contato", follow_ups_enviados=0,
                                site_status=None, site_problemas=None, num_avaliacoes=None,
                                cidade=None, instagram_url=None, mensagem_anterior=None,
                                conteudo_site=None):
    """Gera a mensagem de abordagem/follow-up de um lead do Maps.
    Retorna (mensagem, provedor_usado, avisos_para_o_usuario)."""
    if tipo == "followup":
        user = montar_prompt_followup(
            nome, categoria, endereco, nota, follow_ups_enviados,
            num_avaliacoes=num_avaliacoes, cidade=cidade, mensagem_anterior=mensagem_anterior,
        )
    else:
        user = montar_prompt_contato(
            nome, categoria, endereco, nota, site_status, site_problemas,
            num_avaliacoes=num_avaliacoes, cidade=cidade, instagram_url=instagram_url,
            conteudo_site=conteudo_site,
        )

    try:
        return executar_com_fallback(
            montar_system_copywriter("WhatsApp"), user, descricao_log="gerar mensagem"
        )
    except NenhumProvedorDisponivel as excecao:
        if excecao.erro_final is None:
            raise RuntimeError(
                "No hay ninguna clave de IA configurada. Cargá una en Configuraciones, o creá un archivo "
                ".env con GEMINI_API_KEY, GROQ_API_KEY y/o NVIDIA_API_KEY (mirá .env.example)."
            )
        raise RuntimeError(
            "Todos los proveedores de IA configurados fallaron ahora. "
            f"Último error: {traduzir_erro_ia(excecao.erro_final)}"
        )


# ---------------------------------------------------------------------------
# DM do Instagram
# ---------------------------------------------------------------------------

def montar_prompt_contato_instagram(username, full_name, biography, nicho, justificativa):
    linhas = [
        _linha_dado("Usuario", f"@{username}"),
        _linha_dado("Nombre", full_name or "no informado"),
        _linha_dado("Bio", biography or "no informada"),
        _linha_dado("Rubro identificado", nicho or "no identificado"),
        _linha_dado("Por qué se priorizó este perfil", justificativa),
        _linha_dado("Saludo a usar (hora real de ahora)", saudacao_por_horario()),
    ]
    dados = "\n".join(l for l in linhas if l)

    return f"""Escribí UN mensaje de primer contacto por DM de Instagram (2 a 4 frases) ofreciendo automatizar la atención por WhatsApp (PresencIA) al perfil de abajo.

Datos del perfil:
{dados}

Indicaciones de este mensaje:
- Citá algo específico de la bio o del rubro para mostrar que no es un mensaje copiado y pegado.
- No empieces con "Hola, ¿cómo estás? Vi tu perfil..." ni variaciones cliché.
- {sortear_fechamento()}
"""


def montar_prompt_followup_instagram(username, full_name, biography, nicho, follow_ups_enviados,
                                     mensagem_anterior=None):
    numero_do_followup = max(follow_ups_enviados, 1)
    if numero_do_followup <= 1:
        orientacao_tom = (
            "Este es el PRIMER seguimiento (sin respuesta al primer DM). Tono de recordatorio liviano y "
            "casual: los DM se pierden fácil en Instagram, asumilo con naturalidad."
        )
    else:
        orientacao_tom = (
            f"Este es el seguimiento número {numero_do_followup}. Sé más directo y breve, sin sonar "
            "insistente. Considerá preguntar de frente si todavía tiene sentido, u ofrecer algo nuevo."
        )

    bloco_anterior = (
        f'\nDM ya enviado antes (NO repitas su argumento; variá de verdad):\n"""{mensagem_anterior}"""\n'
        if mensagem_anterior
        else ""
    )

    linhas = [
        _linha_dado("Usuario", f"@{username}"),
        _linha_dado("Nombre", full_name or "no informado"),
        _linha_dado("Bio", biography or "no informada"),
        _linha_dado("Rubro identificado", nicho or "no identificado"),
        _linha_dado("Saludo a usar (hora real de ahora)", saudacao_por_horario()),
    ]
    dados = "\n".join(l for l in linhas if l)

    return f"""Escribí UN mensaje de SEGUIMIENTO por DM de Instagram (1 a 3 frases, corto y casual) para retomar contacto con el perfil de abajo, que recibió un DM sobre automatizar la atención por WhatsApp y no respondió.

{orientacao_tom}
{bloco_anterior}
Datos del perfil:
{dados}

Indicaciones de este mensaje:
- NO pidas perdón por "molestar de nuevo".
- {sortear_fechamento()}
"""


def gerar_mensagem_instagram_com_fallback(username, full_name, biography, nicho, justificativa,
                                          tipo, follow_ups_enviados, mensagem_anterior=None):
    """Gera a DM de abordagem/follow-up de um lead do Instagram.
    Retorna (mensagem, provedor_usado, avisos_para_o_usuario)."""
    if tipo == "followup":
        user = montar_prompt_followup_instagram(
            username, full_name, biography, nicho, follow_ups_enviados,
            mensagem_anterior=mensagem_anterior,
        )
    else:
        user = montar_prompt_contato_instagram(username, full_name, biography, nicho, justificativa)

    try:
        return executar_com_fallback(
            montar_system_copywriter("DM de Instagram"), user,
            descricao_log="gerar mensagem (Instagram)",
        )
    except NenhumProvedorDisponivel as excecao:
        if excecao.erro_final is None:
            raise RuntimeError(
                "No hay ninguna clave de IA configurada. Cargala en Configuraciones o en el archivo .env."
            )
        raise RuntimeError(
            f"Todos los proveedores de IA configurados fallaron ahora. Último error: {traduzir_erro_ia(excecao.erro_final)}"
        )


# ---------------------------------------------------------------------------
# Classificação de perfis do Instagram
# ---------------------------------------------------------------------------

DOMINIOS_LINK_NA_BIO = (
    "wa.me",
    "api.whatsapp.com",
    "whatsapp.com",
    "linktr.ee",
    "linkr.bio",
    "beacons.ai",
    "allmylinks.com",
    "instagram.com",
    "bio.link",
    "linkbio.co",
    "solo.to",
    "campsite.bio",
    "carrd.co",
)


def perfil_tem_site_proprio(perfil):
    """Heurística determinística (sem custo de IA): considera 'site próprio' quando
    o link da bio (external_url) aponta para um domínio que não é um agregador de
    link conhecido (WhatsApp, Linktree e afins) - sinal de que o negócio já tem site."""
    url = (perfil.get("external_url") or "").strip().lower()
    if not url:
        return False
    return not any(dominio in url for dominio in DOMINIOS_LINK_NA_BIO)


SYSTEM_CLASSIFICADOR = """Sos un analista de calificación de leads de una operación que vende automatización de la atención por WhatsApp (PresencIA) a negocios chicos locales de Argentina: un asistente que responde solo 24/7, agenda turnos, manda recordatorios y arma la ficha de cada cliente. Evaluás perfiles de Instagram que comentaron en una publicación y respondés SIEMPRE un único objeto JSON válido, sin markdown y sin texto fuera del JSON, con EXACTAMENTE estas claves:
- "prioridade": "alta", "media", "baixa" o "descartado" ("descartado" sólo si no hay ningún indicio de negocio/profesional real).
- "nicho": string corto con el rubro/profesión (ej: "abogado", "esteticista"), o "" si no se puede identificar.
- "justificativa": 1 o 2 frases explicando la prioridad.
- "sugestao_dm": DM corto y casual (2 a 4 frases, tono de Instagram, PRIMERA PERSONA DEL SINGULAR y voseo: "yo hago", "ofrezco", nunca "nosotros/ofrecemos"). Completala sólo si la prioridad es "alta" o "media"; si no, "".
Buenos leads: dueños de negocios chicos locales o profesionales independientes con volumen de consultas, que hoy atienden todo a mano por WhatsApp o Instagram y se beneficiarían de automatizar la atención y la agenda. El que ya tiene web propia igual sirve: lo que importa es que atienda manualmente."""


def montar_prompt_classificacao_instagram(perfil, nicho_alvo):
    comentarios = perfil.get("comentarios", [])
    trecho_comentarios = "\n".join(f'- "{c}"' for c in comentarios[:5]) or "(ningún comentario capturado)"
    contexto_nicho = (
        f'El usuario busca específicamente leads del rubro "{nicho_alvo}". Dale prioridad más alta a '
        "los perfiles de ese rubro y bajá (o marcá 'baixa') los que claramente no pertenezcan a él, aunque "
        "sean buenos leads de otro tipo."
        if nicho_alvo
        else "El usuario no informó rubro objetivo: evaluá de forma general, priorizando dueños de negocios "
        "chicos locales que atiendan todo a mano."
    )

    return f"""{contexto_nicho}

Datos del perfil a evaluar (respondé con el JSON especificado):
- Usuario: @{perfil.get("username")}
- Nombre: {perfil.get("full_name") or "no informado"}
- Bio: {perfil.get("biography") or "no informada"}
- Seguidores: {perfil.get("seguidores") or 0}
- Cuenta comercial: {"sí" if perfil.get("is_business_account") else "no"}
- Comentarios hechos en el post analizado:
{trecho_comentarios}
"""


def _parsear_classificacao(resposta_bruta):
    resposta_limpa = (
        resposta_bruta.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    )
    dados = json.loads(resposta_limpa)

    prioridade = str(dados.get("prioridade", "")).strip().lower()
    if prioridade not in PRIORIDADES_VALIDAS:
        prioridade = "baixa"

    return {
        "prioridade": prioridade,
        "nicho": str(dados.get("nicho", "")).strip()[:MAX_CARACTERES_NICHO_INSTAGRAM] or None,
        "justificativa": str(dados.get("justificativa", "")).strip()[:MAX_CARACTERES_JUSTIFICATIVA],
        "sugestao_dm": str(dados.get("sugestao_dm", "")).strip()[:MAX_CARACTERES_SUGESTAO_DM],
    }


def classificar_lead_instagram_com_fallback(perfil, nicho_alvo):
    """Classifica um perfil do Instagram (prioridade/nicho/justificativa/sugestão de DM)
    usando o mesmo fallback de provedores das mensagens, com modo JSON nativo dos SDKs
    e temperatura baixa (consistência). Levanta exceção se todos os provedores falharem -
    quem chama deve tratar por perfil, sem abortar o lote inteiro."""
    user = montar_prompt_classificacao_instagram(perfil, nicho_alvo)
    try:
        resultado, _provedor, _avisos = executar_com_fallback(
            SYSTEM_CLASSIFICADOR,
            user,
            parser=_parsear_classificacao,
            descricao_log=f"classificar perfil @{perfil.get('username')}",
            temperatura=TEMPERATURA_CLASSIFICACAO,
            formato_json=True,
        )
        return resultado
    except NenhumProvedorDisponivel as excecao:
        raise RuntimeError(
            f"ningún proveedor de IA pudo clasificar el perfil (último error: {excecao.erro_final})"
        )


# ---------------------------------------------------------------------------
# Analista de negociação (cockpit de conversa)
# ---------------------------------------------------------------------------

SYSTEM_ANALISTA_CONVERSA = """Sos un consultor de ventas senior que acompaña negociaciones reales por WhatsApp entre una persona que vende PresencIA (automatización de la atención por WhatsApp: un asistente que responde solo, agenda turnos y arma la ficha de cada cliente) y dueños de negocios chicos locales de Argentina. Leés la conversación hasta acá y orientás el próximo paso.

Respondé SIEMPRE un único objeto JSON válido, sin markdown y sin texto fuera del JSON, con EXACTAMENTE estas claves:
- "estagio": uno de "primeiro_contato" (todavía no hubo respuesta del lead), "descoberta" (respondió, todavía estás entendiendo su situación), "interesse" (mostró curiosidad o pidió detalles), "objecao" (levantó una barrera: precio, tiempo, "ya tengo", "no lo necesito"), "negociacao" (discutiendo precio, plazo o alcance concreto), "fechamento" (cerca de cerrar, ajustando detalles finales), "esfriou" (dejó de responder o perdió el interés).
- "leitura": 1 a 3 frases interpretando lo que el lead realmente quiso decir y qué revela eso sobre la chance de cerrar. Sé específico sobre ESTA conversación, no genérico.
- "objetivo": una frase corta diciendo cuál es el próximo objetivo táctico AHORA (ej.: "Entender cuál es su dolor real con la atención antes de hablar de precio").
- "resposta_sugerida": el próximo mensaje listo para enviar, con la voz de quien vende (primera persona del singular, voseo). Corto, natural, fácil de responder. Sin saludo repetido si la conversación ya está en curso.
- "evitar": array de 1 a 4 strings cortas con lo que NO decir ahora (ej.: "Hablar de precio antes de que muestre interés"). Cada ítem es una frase concreta.

Principios de negociación que aplicás:
- Nunca empujes. El que siente presión se traba. El objetivo de cada mensaje es conseguir la PRÓXIMA respuesta, no cerrar en el momento.
- Una objeción no es un "no": es un pedido de información. Recibila antes de responderla, y nunca contradigas al lead de frente.
- Si el lead dijo que ya tiene algo (Instagram, una chica que contesta, un sistema viejo), validá lo que ya hizo y posicioná tu solución como complemento, nunca como reemplazo de lo que eligió.
- Espejá el nivel de formalidad y el largo de los mensajes del lead. Si escribe corto, vos escribís corto.
- Nunca inventes datos, precios, plazos, clientes ni resultados que no estén en el contexto que te dan.
- Si el lead se quedó en silencio, el próximo paso es un seguimiento liviano que dé una salida fácil, nunca un reclamo."""


def _bloco_historico_conversa(mensagens):
    """Formata o histórico como uma transcrição legível. Só as últimas
    MAX_MENSAGENS_NO_PROMPT entram (conversa longa estoura o contexto e as
    mensagens antigas pesam pouco na decisão do próximo passo)."""
    if not mensagens:
        return "(todavía no se intercambió ningún mensaje - el primer contacto todavía no se envió)"

    recentes = mensagens[-MAX_MENSAGENS_NO_PROMPT:]
    omitidas = len(mensagens) - len(recentes)
    linhas = []
    if omitidas > 0:
        linhas.append(f"[... {omitidas} mensaje(s) más antiguo(s) omitido(s) ...]")
    for mensagem in recentes:
        quem = "VOS (vendedor)" if mensagem["autor"] == "vendedor" else "LEAD"
        quando = (mensagem.get("enviada_em") or "").replace("T", " ")[:16]
        linhas.append(f"[{quando}] {quem}: {mensagem['texto']}")
    return "\n".join(linhas)


def montar_prompt_analise_conversa(lead, mensagens):
    """Monta o prompt do analista: dados do negócio + ângulo de venda (situação
    do site) + transcrição da conversa. Reaproveita os mesmos blocos usados
    pelas copies, para a análise enxergar exatamente o mesmo contexto."""
    dados_empresa = _bloco_dados_empresa(
        lead.get("nome"),
        lead.get("categoria"),
        lead.get("endereco"),
        lead.get("nota"),
        num_avaliacoes=lead.get("num_avaliacoes"),
        cidade=lead.get("cidade"),
        instagram_url=lead.get("instagram_url"),
    )
    contexto_site = _contexto_site(lead.get("site_status"), lead.get("site_problemas"))
    ultima_do_lead = next(
        (m["texto"] for m in reversed(mensagens) if m["autor"] == "lead"), None
    )
    foco = (
        f'\nEl último mensaje del lead fue: "{ultima_do_lead}"\nTu respuesta sugerida tiene que responder '
        "exactamente eso.\n"
        if ultima_do_lead
        else "\nEl lead todavía no respondió ningún mensaje.\n"
    )

    return f"""Negocio con el que estás negociando:
{dados_empresa}

Contexto de la oferta:
{contexto_site}

Conversación hasta ahora (orden cronológico):
{_bloco_historico_conversa(mensagens)}
{foco}
Saludo correcto para la hora de ahora, por si necesitás saludar: {saudacao_por_horario()}

Analizá la negociación y respondé con el JSON especificado."""


def _parsear_analise_conversa(resposta_bruta):
    resposta_limpa = (
        resposta_bruta.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    )
    dados = json.loads(resposta_limpa)

    estagio = str(dados.get("estagio", "")).strip().lower()
    if estagio not in ESTAGIOS_NEGOCIACAO:
        estagio = ESTAGIO_NEGOCIACAO_PADRAO

    evitar_bruto = dados.get("evitar") or []
    if isinstance(evitar_bruto, str):  # modelo às vezes devolve string única
        evitar_bruto = [evitar_bruto]
    evitar = [
        str(item).strip()[:MAX_CARACTERES_ITEM_EVITAR]
        for item in list(evitar_bruto)[:MAX_ITENS_EVITAR]
        if str(item).strip()
    ]

    return {
        "estagio": estagio,
        "leitura": str(dados.get("leitura", "")).strip()[:MAX_CARACTERES_LEITURA_ANALISE],
        "objetivo": str(dados.get("objetivo", "")).strip()[:MAX_CARACTERES_OBJETIVO_ANALISE],
        "resposta_sugerida": str(dados.get("resposta_sugerida", "")).strip()[:MAX_CARACTERES_RESPOSTA_SUGERIDA],
        "evitar": evitar,
    }


def analisar_conversa_com_fallback(lead, mensagens):
    """Lê o histórico da conversa e devolve (analise, provedor, avisos):
    estágio da negociação, leitura da situação, próximo objetivo, resposta
    sugerida e o que evitar. Mesmo fallback de provedores das copies, com
    modo JSON nativo e temperatura baixa (análise precisa ser consistente)."""
    user = montar_prompt_analise_conversa(lead, mensagens)
    return executar_com_fallback(
        SYSTEM_ANALISTA_CONVERSA,
        user,
        parser=_parsear_analise_conversa,
        descricao_log=f"analisar conversa com {lead.get('nome')}",
        temperatura=TEMPERATURA_CLASSIFICACAO,
        formato_json=True,
    )
