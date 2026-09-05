"""Login de administrador único, usado só quando o app roda num servidor
compartilhado (nuvem) - protege as rotas /api/* atrás de uma sessão.

Em modo local (desktop, um usuário só na própria máquina) fica desligado por
padrão: sem ADMIN_USER/ADMIN_PASSWORD configurados no ambiente, nenhuma rota
exige login - comportamento idêntico ao de sempre, sem quebrar quem já usa o
app localmente."""

import hmac
import logging
import os

from flask import Blueprint, jsonify, request, session

logger = logging.getLogger(__name__)

bp = Blueprint("auth", __name__)

# Rotas de /api/* que respondem mesmo sem sessão - senão ninguém consegue logar
ROTAS_PUBLICAS = {"/api/auth/login", "/api/auth/me"}


def autenticacao_habilitada():
    return bool(os.environ.get("ADMIN_USER") and os.environ.get("ADMIN_PASSWORD"))


def usuario_logado():
    return session.get("logado") is True


def exigir_login_em_apis():
    """Registrado como before_request do app inteiro: bloqueia /api/* sem
    sessão válida, só quando a autenticação está habilitada. O SPA (arquivos
    estáticos do frontend) nunca é bloqueado aqui - ele não carrega dado
    nenhum sozinho, e é o próprio React que decide mostrar a tela de login."""
    if not autenticacao_habilitada():
        return None
    if not request.path.startswith("/api/"):
        return None
    if request.path in ROTAS_PUBLICAS:
        return None
    if not usuario_logado():
        return jsonify({"erro": "no autenticado"}), 401
    return None


@bp.route("/api/auth/login", methods=["POST"])
def login():
    if not autenticacao_habilitada():
        return jsonify({"ok": True, "logado": True})

    corpo = request.json or {}
    usuario = str(corpo.get("usuario", ""))
    senha = str(corpo.get("senha", ""))

    usuario_ok = hmac.compare_digest(usuario, os.environ["ADMIN_USER"])
    senha_ok = hmac.compare_digest(senha, os.environ["ADMIN_PASSWORD"])
    if not (usuario_ok and senha_ok):
        logger.warning("login falhou para o usuário %r", usuario)
        return jsonify({"erro": "Usuario o contraseña incorrectos."}), 401

    session.clear()
    session["logado"] = True
    session["usuario"] = usuario
    session.permanent = True
    return jsonify({"ok": True, "logado": True, "usuario": usuario})


@bp.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"ok": True})


@bp.route("/api/auth/me")
def me():
    if not autenticacao_habilitada():
        return jsonify({"logado": True, "usuario": None, "auth_habilitada": False})
    return jsonify({
        "logado": usuario_logado(),
        "usuario": session.get("usuario"),
        "auth_habilitada": True,
    })
