"""Testes da integração com o PresencIA (presencia.py).

Nada aqui toca a rede: _sessao.post/.request são substituídos por fakes.
Cobre o bug real que motivou o reintento em _pedir: a cookie de sessão do
PresencIA pode continuar válida (200 no login) mas carregar um tenant_id
vazio - nesse caso o PresencIA responde 404 "Tenant no encontrado" em
qualquer rota, e só um re-login resolve (ver o comentário em presencia.py).
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

import presencia


class _RespostaFake:
    def __init__(self, status_code, corpo):
        self.status_code = status_code
        self._corpo = corpo
        self.content = b"1"
        self.ok = status_code < 400

    def json(self):
        return self._corpo


@pytest.fixture(autouse=True)
def _resetar_estado_modulo(monkeypatch):
    monkeypatch.setattr(presencia, "_logado", False)
    monkeypatch.setenv("PRESENCIA_URL", "https://presencia.exemplo")
    monkeypatch.setenv("PRESENCIA_USUARIO", "bot@presencia.exemplo")
    monkeypatch.setenv("PRESENCIA_SENHA", "s3nha")


class TestPedirReintentaLogin:
    def test_tenant_no_encontrado_reloguea_y_reintenta(self, monkeypatch):
        """Simula exactamente el bug de producción: la primera respuesta es un
        404 "Tenant no encontrado" con la cookie ya puesta; _pedir tiene que
        loguearse de nuevo (nuevo POST /login) y repetir el pedido original,
        que la segunda vez sí funciona."""
        chamadas = []

        def request_fake(metodo, url, **kwargs):
            chamadas.append(("request", metodo, url))
            if len([c for c in chamadas if c[0] == "request"]) == 1:
                return _RespostaFake(404, {"ok": False, "message": "Tenant no encontrado."})
            return _RespostaFake(200, {"ok": True, "templates": []})

        def post_fake(url, **kwargs):
            chamadas.append(("login", url))
            return _RespostaFake(200, {"ok": True})

        monkeypatch.setattr(presencia._sessao, "request", request_fake)
        monkeypatch.setattr(presencia._sessao, "post", post_fake)
        presencia._logado = True  # cookie "válida" pero con tenant_id malo

        resultado = presencia.listar_plantillas_aprobadas()

        assert resultado == []
        tipos = [c[0] for c in chamadas]
        # login inicial NÃO deveria rodar (_logado já era True) - só depois do 404
        assert tipos == ["request", "login", "request"]

    def test_401_reloguea_una_sola_vez(self, monkeypatch):
        chamadas = {"logins": 0, "pedidos": 0}

        def request_fake(metodo, url, **kwargs):
            chamadas["pedidos"] += 1
            if chamadas["pedidos"] == 1:
                return _RespostaFake(401, {"ok": False, "message": "Sesión inválida o expirada."})
            return _RespostaFake(200, {"ok": True, "templates": []})

        def post_fake(url, **kwargs):
            chamadas["logins"] += 1
            return _RespostaFake(200, {"ok": True})

        monkeypatch.setattr(presencia._sessao, "request", request_fake)
        monkeypatch.setattr(presencia._sessao, "post", post_fake)
        presencia._logado = True

        presencia.listar_plantillas_aprobadas()

        assert chamadas["logins"] == 1
        assert chamadas["pedidos"] == 2

    def test_erro_persistente_levanta_presencia_error(self, monkeypatch):
        def request_fake(metodo, url, **kwargs):
            return _RespostaFake(404, {"ok": False, "message": "Tenant no encontrado."})

        def post_fake(url, **kwargs):
            return _RespostaFake(200, {"ok": True})

        monkeypatch.setattr(presencia._sessao, "request", request_fake)
        monkeypatch.setattr(presencia._sessao, "post", post_fake)
        presencia._logado = True

        with pytest.raises(presencia.PresenciaError, match="Tenant no encontrado"):
            presencia.listar_plantillas_aprobadas()

    def test_404_sin_relacion_a_tenant_no_reloguea(self, monkeypatch):
        """Un 404 que no menciona "tenant" (ej. plantilla borrada) no debe
        gastar un login extra ni esconder el mensaje real detrás de un reintento."""
        chamadas = {"logins": 0, "pedidos": 0}

        def request_fake(metodo, url, **kwargs):
            chamadas["pedidos"] += 1
            return _RespostaFake(404, {"ok": False, "message": "Plantilla no encontrada."})

        def post_fake(url, **kwargs):
            chamadas["logins"] += 1
            return _RespostaFake(200, {"ok": True})

        monkeypatch.setattr(presencia._sessao, "request", request_fake)
        monkeypatch.setattr(presencia._sessao, "post", post_fake)
        presencia._logado = True

        with pytest.raises(presencia.PresenciaError, match="Plantilla no encontrada"):
            presencia.listar_plantillas_aprobadas()

        assert chamadas["logins"] == 0
        assert chamadas["pedidos"] == 1
