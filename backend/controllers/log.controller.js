const pool = require("../db/connection");

async function listarLogs(req, res) {
    try {
        const { funcionario_id, mes, ano, usuario, acao } = req.query;

        let query = `
            SELECT
                l.id,
                f.nome AS funcionario,
                l.data_registro,
                l.usuario,
                l.acao,
                l.campo_alterado,
                l.valor_anterior,
                l.valor_novo,
                l.criado_em
            FROM log_registros l
            LEFT JOIN funcionarios f ON f.id = l.funcionario_id
            WHERE 1=1`;

        const params = [];

        if (funcionario_id) {
            params.push(funcionario_id);
            query += ` AND l.funcionario_id = $${params.length}`;
        }
        if (mes && ano) {
            params.push(mes);
            query += ` AND EXTRACT(MONTH FROM l.data_registro) = $${params.length}`;
            params.push(ano);
            query += ` AND EXTRACT(YEAR FROM l.data_registro) = $${params.length}`;
        }
        if (usuario) {
            params.push(`%${usuario}%`);
            query += ` AND l.usuario ILIKE $${params.length}`;
        }
        if (acao) {
            params.push(acao);
            query += ` AND l.acao = $${params.length}`;
        }

        query += " ORDER BY l.criado_em DESC LIMIT 300";

        const resultado = await pool.query(query, params);
        res.json(resultado.rows);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

module.exports = { listarLogs };