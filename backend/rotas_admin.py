"""Exportação/importação de todos os dados do CRM num único JSON - pensado
pra levar os leads de uma instalação local pra um deploy na nuvem (ou
vice-versa) sem precisar rodar as buscas de novo. Não inclui `configuracoes`
(chaves de API, específicas de cada ambiente) nem `jobs` (estado transitório
de background). Protegido pelo mesmo `before_request` de auth.py que cobre
o resto de /api/* - só funciona autenticado quando o login está habilitado."""

import logging

from flask import Blueprint, jsonify, request

import db

logger = logging.getLogger(__name__)

bp = Blueprint("admin", __name__)

# Ordem importa na importação: instagram_leads referencia instagram_posts(id)
# com PRAGMA foreign_keys=ON (db.conectar liga isso) - o pai tem que entrar
# antes do filho, senão o INSERT falha.
TABELAS_EXPORTAVEIS = [
    "leads",
    "historico_status",
    "instagram_posts",
    "instagram_leads",
    "historico_status_instagram",
    "templates_mensagem",
    "mensagens_conversa",
    "analises_conversa",
]


def _colunas_da_tabela(conexao, tabela):
    return {linha[1] for linha in conexao.execute(f"PRAGMA table_info({tabela})")}


@bp.route("/api/admin/exportar-tudo")
def exportar_tudo():
    conexao = db.conectar()
    try:
        dados = {"versao": 1, "tabelas": {}}
        for tabela in TABELAS_EXPORTAVEIS:
            linhas = conexao.execute(f"SELECT * FROM {tabela}").fetchall()
            dados["tabelas"][tabela] = [dict(linha) for linha in linhas]
    finally:
        conexao.close()

    resposta = jsonify(dados)
    resposta.headers["Content-Disposition"] = 'attachment; filename="prospectos-datos.json"'
    return resposta


@bp.route("/api/admin/importar-tudo", methods=["POST"])
def importar_tudo():
    corpo = request.json or {}
    tabelas_recebidas = corpo.get("tabelas")
    if not isinstance(tabelas_recebidas, dict):
        return jsonify({"erro": "formato inválido - se espera {tabelas: {...}}"}), 400

    resumo = {}
    conexao = db.conectar()
    try:
        for tabela in TABELAS_EXPORTAVEIS:
            linhas = tabelas_recebidas.get(tabela) or []
            if not isinstance(linhas, list):
                continue
            colunas_validas = _colunas_da_tabela(conexao, tabela)
            inseridas = 0
            for linha in linhas:
                if not isinstance(linha, dict):
                    continue
                # só aceita colunas que realmente existem nesta tabela - nunca
                # interpola nome de coluna vindo do JSON sem checar contra o
                # schema real primeiro (os valores já são parametrizados com ?)
                colunas = [c for c in linha.keys() if c in colunas_validas]
                if not colunas:
                    continue
                nomes = ", ".join(colunas)
                marcadores = ", ".join("?" for _ in colunas)
                conexao.execute(
                    f"INSERT OR REPLACE INTO {tabela} ({nomes}) VALUES ({marcadores})",
                    [linha[c] for c in colunas],
                )
                inseridas += 1
            resumo[tabela] = inseridas
        conexao.commit()
    finally:
        conexao.close()

    logger.info("importação de dados concluída: %s", resumo)
    return jsonify({"ok": True, "importado": resumo})
