"""Integração com o PresencIA: manda as plantillas de WhatsApp aprovadas pro
lead, usando o login do tenant "PresencIA" (negócio próprio) já existente lá -
não criamos nada novo no PresencIA, só reusamos as rotas do painel.

Fluxo por lead:
  1. cria/atualiza o contato lá (POST /api/tenant/contactos) com o nome real,
     pra não aparecer só o número no painel;
  2. lista as plantillas aprovadas (GET /api/tenant/templates/);
  3. manda a escolhida (POST /api/tenant/templates/send).

A sessão é um cookie assinado que dura 7 dias (ver lib/sesion.js no
PresencIA); se vencer ou for revogado, um 401 dispara um re-login automático.
"""

import json
import logging
import os

import requests

logger = logging.getLogger(__name__)

_sessao = requests.Session()
_logado = False


class PresenciaError(Exception):
    """Erro de negócio devolvido pelo PresencIA (mensagem já pronta pro usuário)."""


def _config():
    url = os.environ.get("PRESENCIA_URL", "").rstrip("/")
    usuario = os.environ.get("PRESENCIA_USUARIO")
    senha = os.environ.get("PRESENCIA_SENHA")
    if not (url and usuario and senha):
        raise PresenciaError(
            "Falta configurar PRESENCIA_URL, PRESENCIA_USUARIO y PRESENCIA_SENHA en el .env"
        )
    return url, usuario, senha


def _login():
    global _logado
    url, usuario, senha = _config()
    resp = _sessao.post(f"{url}/api/auth/login", json={"email": usuario, "password": senha}, timeout=15)
    dados = resp.json() if resp.content else {}
    if not resp.ok or not dados.get("ok", True):
        _logado = False
        raise PresenciaError(dados.get("message") or "No se pudo iniciar sesión en PresencIA.")
    _logado = True


def _pedir(metodo, ruta, **kwargs):
    """Un pedido autenticado, con un solo reintento de login si la cookie venció
    (401) o si quedó con un tenant vacío (404 "Tenant no encontrado" - puede
    pasar si el login anterior coincidió con el negocio propio en un estado
    transitorio del lado de PresencIA; sin este reintento, ProspectOS se queda
    devolviendo ese error hasta que el proceso se reinicie solo)."""
    url, _, _ = _config()
    if not _logado:
        _login()

    resp = _sessao.request(metodo, f"{url}{ruta}", timeout=20, **kwargs)
    dados = resp.json() if resp.content else {}

    necesita_relogin = resp.status_code == 401 or (
        resp.status_code == 404 and "tenant" in str(dados.get("message") or "").lower()
    )
    if necesita_relogin:
        _login()
        resp = _sessao.request(metodo, f"{url}{ruta}", timeout=20, **kwargs)
        dados = resp.json() if resp.content else {}

    if not resp.ok or dados.get("ok") is False:
        raise PresenciaError(dados.get("message") or f"Error inesperado del PresencIA ({resp.status_code}).")
    return dados


def listar_plantillas_aprobadas():
    """Solo las que Meta ya aprobó - las demás no se pueden mandar."""
    dados = _pedir("GET", "/api/tenant/templates/")
    return [t for t in dados.get("templates", []) if t.get("status") == "APPROVED"]


def consultar_estados(wamids):
    """Estado de entrega de esos mensajes, por wamid:
    {wamid: {"status": "sent|delivered|read|failed", "codigo_falla": "131049"|None}}

    Meta acepta la plantilla al toque pero puede rechazarla al entregar; ese
    "failed" recién aparece acá unos segundos después, cuando el webhook lo
    guarda en PresencIA."""
    if not wamids:
        return {}
    dados = _pedir("POST", "/api/tenant/templates/estado", json={"wamids": list(wamids)})
    return dados.get("estados", {})


def limpiar_fallidos(wamids):
    """Borra de la bandeja del bot los rastros de las plantillas que NO se
    entregaron: el mensaje fallido y, si quedó vacía, la conversación. No toca
    conversaciones que ya tenían historia."""
    if not wamids:
        return {}
    return _pedir("POST", "/api/tenant/templates/limpiar-fallido", json={"wamids": list(wamids)})


def enviar_a_lead(telefono_digitos, nombre, template_name, language, parameters=None, header_media=None):
    """Manda la plantilla y, de paso, deja el nombre del lead en la
    conversación (nombre_cliente) para que en el panel no aparezca solo el
    número. NO lo da de alta como cliente: es un lead, no un cliente todavía.
    El nombre solo se escribe si la conversación no tenía uno.

    header_media: tupla opcional (contenido_bytes, mimetype, nombre_archivo)
    con el header de la plantilla (imagen/video/documento). Meta no guarda ese
    archivo en la plantilla - hay que re-mandarlo en cada envío, si no
    rechaza con (#132012) "Parameter format does not match"."""
    if header_media:
        contenido, mimetype, nombre_archivo = header_media
        return _pedir(
            "POST", "/api/tenant/templates/send",
            data={
                "to": telefono_digitos,
                "template_name": template_name,
                "language": language,
                "parameters": json.dumps(parameters or []),
                "nombre_cliente": nombre or "",
            },
            files={"header_media": (nombre_archivo, contenido, mimetype)},
        )
    return _pedir("POST", "/api/tenant/templates/send", json={
        "to": telefono_digitos,
        "template_name": template_name,
        "language": language,
        "parameters": parameters or [],
        "nombre_cliente": nombre,
    })
