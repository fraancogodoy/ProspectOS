"""Pruebas de la cola persistente de plantillas.

No hacen llamadas a PresencIA: el envío se inyecta como una función falsa.
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

import cola_envios
import db
import processar


@pytest.fixture
def banco(tmp_path, monkeypatch):
    camino = tmp_path / "leads.db"
    monkeypatch.setattr(db, "CAMINHO_BANCO", camino)
    conexao = db.conectar()
    processar.preparar_banco(conexao)
    conexao.close()
    return camino


def test_encolar_omite_un_lead_que_ya_esta_esperando(banco):
    primero = cola_envios.encolar(["a", "b"], "saludo", "es_AR", [])
    segundo = cola_envios.encolar(["b", "c"], "saludo", "es_AR", [])

    assert primero["encolados"] == 2
    assert segundo["encolados"] == 1
    assert segundo["omitidos"] == 1
    assert segundo["en_cola"] == 3


def test_procesar_uno_envia_y_guarda_el_wamid(banco):
    cola_envios.encolar(["lead-1"], "saludo", "es_AR", ["{nombre}"])
    enviados = []

    def enviar(place_id, template_name, language, parameters):
        enviados.append((place_id, template_name, language, parameters))
        return {"wamid": "wamid-123"}

    resultado = cola_envios.procesar_uno(enviar, agora=datetime(2026, 1, 1, 12, 0, 0))

    assert resultado == "enviado"
    assert enviados == [("lead-1", "saludo", "es_AR", ["{nombre}"])]
    conexao = db.conectar()
    try:
        fila = conexao.execute(
            "SELECT estado, wamid FROM envios_programados WHERE place_id = 'lead-1'"
        ).fetchone()
    finally:
        conexao.close()
    assert dict(fila) == {"estado": "enviado", "wamid": "wamid-123"}


def test_cancelar_solo_afecta_al_lote_indicado(banco):
    lote_a = cola_envios.encolar(["a"], "saludo", "es_AR", [])
    lote_b = cola_envios.encolar(["b"], "saludo", "es_AR", [])

    assert cola_envios.cancelar(lote_a["lote_id"]) == 1
    conexao = db.conectar()
    try:
        estados = {
            fila["place_id"]: fila["estado"]
            for fila in conexao.execute("SELECT place_id, estado FROM envios_programados")
        }
    finally:
        conexao.close()
    assert estados == {"a": "cancelado", "b": "pendiente"}
    assert lote_b["lote_id"] != lote_a["lote_id"]


# ---------------------------------------------------------------------------
# El espaciado es la razón de ser de la cola: que Meta no lo lea como spam.
# ---------------------------------------------------------------------------

def _enviar_ok(place_id, template_name, language, parameters):
    return {"wamid": f"w-{place_id}"}


def _estado_de(place_id):
    conexao = db.conectar()
    try:
        return conexao.execute(
            "SELECT estado, programado_para, intentado_em, erro FROM envios_programados WHERE place_id = ?",
            (place_id,),
        ).fetchone()
    finally:
        conexao.close()


T0 = datetime(2026, 1, 1, 12, 0, 0)


def test_el_segundo_espera_entre_3_y_5_minutos(banco):
    cola_envios.encolar(["a", "b"], "saludo", "es_AR", [])
    assert cola_envios.procesar_uno(_enviar_ok, agora=T0) == "enviado"

    # 10 s después: no sale, se agenda al azar entre 3 y 5 min desde el envío anterior
    assert cola_envios.procesar_uno(_enviar_ok, agora=T0 + timedelta(seconds=10)) == "esperando"
    programado = datetime.fromisoformat(_estado_de("b")["programado_para"])
    assert T0 + timedelta(seconds=180) <= programado <= T0 + timedelta(seconds=300)

    # un segundo antes de la hora sigue esperando; a la hora, sale
    assert cola_envios.procesar_uno(_enviar_ok, agora=programado - timedelta(seconds=1)) == "esperando"
    assert cola_envios.procesar_uno(_enviar_ok, agora=programado) == "enviado"


def test_el_intervalo_se_sortea_una_vez_y_no_cambia(banco):
    cola_envios.encolar(["a", "b"], "saludo", "es_AR", [])
    cola_envios.procesar_uno(_enviar_ok, agora=T0)
    cola_envios.procesar_uno(_enviar_ok, agora=T0 + timedelta(seconds=10), aleatorio=lambda a, b: 200)
    primero = _estado_de("b")["programado_para"]
    # otro paso de la cola (o un reinicio) no vuelve a sortear
    cola_envios.procesar_uno(_enviar_ok, agora=T0 + timedelta(seconds=20), aleatorio=lambda a, b: 299)
    assert _estado_de("b")["programado_para"] == primero


def test_despues_de_estar_caido_no_manda_todos_de_golpe(banco):
    cola_envios.encolar(["a", "b", "c"], "saludo", "es_AR", [])
    cola_envios.procesar_uno(_enviar_ok, agora=T0)

    # el servidor vuelve una hora después: sale uno solo...
    una_hora = T0 + timedelta(hours=1)
    assert cola_envios.procesar_uno(_enviar_ok, agora=una_hora) == "enviado"
    # ...y el siguiente vuelve a respetar el ritmo
    assert cola_envios.procesar_uno(_enviar_ok, agora=una_hora + timedelta(seconds=10)) == "esperando"
    assert _estado_de("c")["estado"] == "pendiente"


def test_un_lead_sin_whatsapp_no_frena_ni_cuenta_para_el_ritmo(banco):
    cola_envios.encolar(["sin-wa", "b"], "saludo", "es_AR", [])

    def enviar(place_id, *_):
        if place_id == "sin-wa":
            raise cola_envios.EnvioSinDestino("sin WhatsApp")
        return {"wamid": "w"}

    assert cola_envios.procesar_uno(enviar, agora=T0) == "sin_destino"
    assert _estado_de("sin-wa")["intentado_em"] is None
    # no hubo envío real, así que el siguiente no tiene por qué esperar
    assert cola_envios.procesar_uno(enviar, agora=T0 + timedelta(seconds=10)) == "enviado"


def test_rechazo_de_presencia_queda_fallido_y_cuenta_como_intento(banco):
    import presencia
    cola_envios.encolar(["a", "b"], "saludo", "es_AR", [])

    def enviar(*_):
        raise presencia.PresenciaError("(#131049) límite de interacciones")

    assert cola_envios.procesar_uno(enviar, agora=T0) == "fallido"
    fila = _estado_de("a")
    assert fila["estado"] == "fallido" and "131049" in fila["erro"]
    # Meta sí recibió el pedido: el siguiente respeta la pausa
    assert cola_envios.procesar_uno(enviar, agora=T0 + timedelta(seconds=10)) == "esperando"


def test_un_envio_cortado_por_reinicio_no_se_reintenta(banco):
    cola_envios.encolar(["a"], "saludo", "es_AR", [])
    conexao = db.conectar()
    conexao.execute("UPDATE envios_programados SET estado = 'enviando'")
    conexao.commit()
    conexao.close()

    assert cola_envios.marcar_interrumpidos() == 1
    assert _estado_de("a")["estado"] == "fallido"
    assert cola_envios.procesar_uno(_enviar_ok, agora=T0) == "vacia"


def test_estado_resume_el_lote_activo(banco):
    cola_envios.encolar(["a", "b", "c"], "saludo", "es_AR", [])
    cola_envios.procesar_uno(_enviar_ok, agora=T0)
    cola_envios.procesar_uno(_enviar_ok, agora=T0 + timedelta(seconds=10), aleatorio=lambda a, b: 240)

    resumen = cola_envios.estado(agora=T0 + timedelta(seconds=40))
    assert resumen["activo"] is True
    assert (resumen["enviados"], resumen["pendientes"]) == (1, 2)
    assert resumen["segundos_para_proximo"] == 200  # 240 s desde el envío - 40 s ya pasados
