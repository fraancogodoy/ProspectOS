"""Cola del envío masivo de plantillas por PresencIA.

Un envío cada 3 a 5 minutos, con el intervalo elegido al azar cada vez.
La cadencia se mantiene en el servidor, por lo que se puede cerrar la
pestaña sin perder el trabajo pendiente.

Reglas que importan:
- Una sola cola para todo (hay un solo número de WhatsApp): el espaciado
  vale también entre lotes distintos, no solo dentro de cada uno.
- El horario del próximo envío se calcula desde el ÚLTIMO intento real, no
  se precalcula todo al encolar. Si el servidor estuvo caído una hora, al
  volver manda uno solo y retoma el ritmo, en vez de disparar de golpe todos
  los atrasados.
- Cada fila pasa a 'enviando' antes de llamar a PresencIA. Si el proceso se
  muere justo ahí no se sabe si el mensaje salió, así que al arrancar se
  marca como fallida en vez de reintentarla: un mensaje de menos es mejor
  que uno repetido al mismo negocio.
"""

import json
import logging
import random
import threading
import time
import uuid
from datetime import datetime, timedelta

import db
import presencia

logger = logging.getLogger(__name__)

INTERVALO_MIN_SEG = 180
INTERVALO_MAX_SEG = 300
# Meta acepta la plantilla al toque pero puede rechazarla al entregar
# (ej. 131049); ese "failed" tarda unos segundos en aparecer.
ESPERA_RECONCILIAR_SEG = 20
TICK_SEG = 10

ERRO_INTERRUMPIDO = (
    "Se reinició el servidor justo durante este envío: no se sabe si salió. "
    "Revisalo en PresencIA antes de volver a mandarlo."
)


class EnvioSinDestino(Exception):
    """El envío no llegó a salir hacia PresencIA (lead borrado, sin WhatsApp):
    no cuenta como intento para el espaciado."""


def _agora():
    return datetime.now()


def _iso(momento):
    return momento.isoformat(timespec="seconds")


def encolar(place_ids, template_name, language, parameters, agora=None):
    """Agrega un lote al final de la cola. Un lead que ya está esperando en
    la cola no se vuelve a agregar (dos lotes seguidos al mismo negocio le
    mandarían la plantilla dos veces)."""
    agora = agora or _agora()
    lote_id = uuid.uuid4().hex
    pedidos = list(dict.fromkeys(place_ids))  # sin repetidos, en el mismo orden

    conexao = db.conectar()
    try:
        ya_en_cola = {
            linha["place_id"]
            for linha in conexao.execute(
                "SELECT place_id FROM envios_programados WHERE estado IN ('pendiente', 'enviando')"
            ).fetchall()
        }
        nuevos = [p for p in pedidos if p not in ya_en_cola]
        conexao.executemany(
            "INSERT INTO envios_programados "
            "(lote_id, place_id, template_name, language, parameters, criado_em) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            [
                (lote_id, p, template_name, language,
                 json.dumps(parameters or [], ensure_ascii=False), _iso(agora))
                for p in nuevos
            ],
        )
        conexao.commit()
        en_cola = conexao.execute(
            "SELECT COUNT(*) AS n FROM envios_programados WHERE estado IN ('pendiente', 'enviando')"
        ).fetchone()["n"]
    finally:
        conexao.close()

    promedio_min = (INTERVALO_MIN_SEG + INTERVALO_MAX_SEG) / 2 / 60
    return {
        "lote_id": lote_id,
        "encolados": len(nuevos),
        "omitidos": len(pedidos) - len(nuevos),
        "en_cola": en_cola,
        "minutos_estimados": round(max(en_cola - 1, 0) * promedio_min),
    }


def cancelar(lote_id=None):
    """Cancela las filas pendientes de un lote, o toda la cola si no se indica.
    Lo que ya se mandó nunca se toca."""
    conexao = db.conectar()
    try:
        if lote_id:
            cursor = conexao.execute(
                "UPDATE envios_programados SET estado = 'cancelado' "
                "WHERE estado = 'pendiente' AND lote_id = ?",
                (lote_id,),
            )
        else:
            cursor = conexao.execute(
                "UPDATE envios_programados SET estado = 'cancelado' WHERE estado = 'pendiente'"
            )
        conexao.commit()
        return cursor.rowcount
    finally:
        conexao.close()


def marcar_interrumpidos():
    conexao = db.conectar()
    try:
        cursor = conexao.execute(
            "UPDATE envios_programados SET estado = 'fallido', erro = ? WHERE estado = 'enviando'",
            (ERRO_INTERRUMPIDO,),
        )
        conexao.commit()
        if cursor.rowcount:
            logger.warning("cola: %s envío(s) quedaron a medias por un reinicio", cursor.rowcount)
        return cursor.rowcount
    finally:
        conexao.close()


def estado(agora=None):
    """Resumen para la pantalla: los lotes que todavía tienen algo por
    mandar, o si no hay ninguno, el último (para mostrar cómo terminó)."""
    agora = agora or _agora()
    conexao = db.conectar()
    try:
        lotes = [
            linha["lote_id"]
            for linha in conexao.execute(
                "SELECT DISTINCT lote_id FROM envios_programados WHERE estado IN ('pendiente', 'enviando')"
            ).fetchall()
        ]
        activo = bool(lotes)
        if not lotes:
            ultimo = conexao.execute(
                "SELECT lote_id FROM envios_programados ORDER BY id DESC LIMIT 1"
            ).fetchone()
            lotes = [ultimo["lote_id"]] if ultimo else []

        if not lotes:
            return {"activo": False, "lotes": [], "total": 0, "pendientes": 0, "enviados": 0,
                    "fallidos": 0, "cancelados": 0, "segundos_para_proximo": None,
                    "lista_fallidos": []}

        marcas = ",".join("?" for _ in lotes)
        cuentas = {
            linha["estado"]: linha["n"]
            for linha in conexao.execute(
                f"SELECT estado, COUNT(*) AS n FROM envios_programados "
                f"WHERE lote_id IN ({marcas}) GROUP BY estado",
                lotes,
            ).fetchall()
        }
        cabeza = conexao.execute(
            "SELECT programado_para FROM envios_programados WHERE estado = 'pendiente' ORDER BY id LIMIT 1"
        ).fetchone()
        lista_fallidos = [
            {"place_id": linha["place_id"], "nome": linha["nome"], "erro": linha["erro"]}
            for linha in conexao.execute(
                f"SELECT e.place_id, l.nome, e.erro FROM envios_programados e "
                f"LEFT JOIN leads l ON l.place_id = e.place_id "
                f"WHERE e.lote_id IN ({marcas}) AND e.estado = 'fallido' ORDER BY e.id DESC LIMIT 20",
                lotes,
            ).fetchall()
        ]
    finally:
        conexao.close()

    segundos = None
    if cabeza and cabeza["programado_para"]:
        segundos = max(0, int((datetime.fromisoformat(cabeza["programado_para"]) - agora).total_seconds()))

    return {
        "activo": activo,
        "lotes": lotes,
        "total": sum(cuentas.values()),
        "pendientes": cuentas.get("pendiente", 0) + cuentas.get("enviando", 0),
        "enviados": cuentas.get("enviado", 0),
        "fallidos": cuentas.get("fallido", 0),
        "cancelados": cuentas.get("cancelado", 0),
        # None con cola activa = sale en el próximo paso de la cola (segundos)
        "segundos_para_proximo": segundos,
        "lista_fallidos": lista_fallidos,
    }


def _terminar(fila_id, estado_final, intentado_em=None, wamid=None, erro=None):
    conexao = db.conectar()
    try:
        conexao.execute(
            "UPDATE envios_programados SET estado = ?, intentado_em = ?, wamid = ?, erro = ? WHERE id = ?",
            (estado_final, intentado_em, wamid, erro, fila_id),
        )
        conexao.commit()
    finally:
        conexao.close()


def procesar_uno(enviar, agora=None, aleatorio=random.uniform):
    """Un paso de la cola: manda el próximo si ya le toca. `enviar` es
    rotas_leads.enviar_plantilla_a_lead (se inyecta para no importar las
    rutas acá y para poder probarlo sin PresencIA).
    Devuelve qué hizo: 'vacia', 'esperando', 'enviado', 'fallido',
    'sin_destino' o 'cancelado'."""
    agora = agora or _agora()
    conexao = db.conectar()
    try:
        cabeza = conexao.execute(
            "SELECT * FROM envios_programados WHERE estado = 'pendiente' ORDER BY id LIMIT 1"
        ).fetchone()
        if cabeza is None:
            return "vacia"

        if cabeza["programado_para"] is None:
            ultimo = conexao.execute(
                "SELECT MAX(intentado_em) AS u FROM envios_programados WHERE intentado_em IS NOT NULL"
            ).fetchone()["u"]
            if ultimo:
                ultimo_dt = datetime.fromisoformat(ultimo)
                if agora < ultimo_dt + timedelta(seconds=INTERVALO_MIN_SEG):
                    # Se sortea una sola vez y se guarda: un reinicio no lo
                    # vuelve a sortear ni lo adelanta.
                    programado = ultimo_dt + timedelta(seconds=aleatorio(INTERVALO_MIN_SEG, INTERVALO_MAX_SEG))
                    conexao.execute(
                        "UPDATE envios_programados SET programado_para = ? WHERE id = ?",
                        (_iso(programado), cabeza["id"]),
                    )
                    conexao.commit()
                    return "esperando"
        elif agora < datetime.fromisoformat(cabeza["programado_para"]):
            return "esperando"

        # Se toma la fila antes de mandar: si justo la cancelaron, no sale.
        tomada = conexao.execute(
            "UPDATE envios_programados SET estado = 'enviando' WHERE id = ? AND estado = 'pendiente'",
            (cabeza["id"],),
        )
        conexao.commit()
        if tomada.rowcount == 0:
            return "cancelado"
    finally:
        conexao.close()

    try:
        resultado = enviar(
            cabeza["place_id"], cabeza["template_name"], cabeza["language"],
            json.loads(cabeza["parameters"] or "[]"),
        )
    except EnvioSinDestino as erro:
        _terminar(cabeza["id"], "fallido", erro=str(erro))
        logger.warning("cola: %s sin destino: %s", cabeza["place_id"], erro)
        return "sin_destino"
    except presencia.PresenciaError as erro:
        _terminar(cabeza["id"], "fallido", intentado_em=_iso(agora), erro=str(erro))
        logger.warning("cola: PresencIA rechazó el envío a %s: %s", cabeza["place_id"], erro)
        return "fallido"
    except Exception:
        # No se sabe si llegó a Meta: cuenta como intento, así el próximo no
        # sale pegado a este.
        logger.exception("cola: error inesperado mandando a %s", cabeza["place_id"])
        _terminar(cabeza["id"], "fallido", intentado_em=_iso(agora), erro="Error inesperado al enviar.")
        return "fallido"

    _terminar(cabeza["id"], "enviado", intentado_em=_iso(agora), wamid=(resultado or {}).get("wamid"))
    logger.info("cola: plantilla enviada a %s", cabeza["place_id"])
    return "enviado"


def reconciliar_pendientes(reconciliar, agora=None):
    """Pregunta a PresencIA si los ya enviados se entregaron de verdad (los
    que rebotaron vuelven a "novo"). Espera unos segundos desde el envío,
    que es lo que tarda Meta en informar un rechazo."""
    agora = agora or _agora()
    limite = _iso(agora - timedelta(seconds=ESPERA_RECONCILIAR_SEG))
    conexao = db.conectar()
    try:
        filas = conexao.execute(
            "SELECT id, place_id FROM envios_programados "
            "WHERE estado = 'enviado' AND reconciliado = 0 AND intentado_em <= ?",
            (limite,),
        ).fetchall()
    finally:
        conexao.close()
    if not filas:
        return 0

    try:
        reconciliar([f["place_id"] for f in filas])
    except presencia.PresenciaError as erro:
        # Se reintenta en el próximo paso de la cola.
        logger.warning("cola: no se pudo verificar la entrega: %s", erro)
        return 0

    conexao = db.conectar()
    try:
        conexao.execute(
            "UPDATE envios_programados SET reconciliado = 1 WHERE id IN ({})".format(
                ",".join("?" for _ in filas)
            ),
            [f["id"] for f in filas],
        )
        conexao.commit()
    finally:
        conexao.close()
    return len(filas)


_worker = None


def iniciar_worker(enviar, reconciliar):
    """Arranca el hilo que recorre la cola. Se llama una sola vez al levantar
    el servidor (app.py), nunca al importar: las pruebas importan la app y no
    tienen que mandar nada."""
    global _worker
    if _worker is not None and _worker.is_alive():
        return
    marcar_interrumpidos()

    def recorrer():
        while True:
            try:
                procesar_uno(enviar)
                reconciliar_pendientes(reconciliar)
            except Exception:
                logger.exception("cola: fallo inesperado recorriendo la cola")
            time.sleep(TICK_SEG)

    _worker = threading.Thread(target=recorrer, name="cola-envios", daemon=True)
    _worker.start()
    logger.info("cola de envíos iniciada (un envío cada %s-%s s)", INTERVALO_MIN_SEG, INTERVALO_MAX_SEG)
