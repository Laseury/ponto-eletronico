const pool = require("../db/connection");

function minutosParaHorario(minutos) {
    if (minutos <= 0) return "00:00";
    const horas = Math.floor(minutos / 60);
    const mins  = minutos % 60;
    return `${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

async function gerarResumo(req, res) {
    try {
        const mes = parseInt(req.params.mes);
        const ano = parseInt(req.params.ano);

        const resultado = await pool.query(`
    SELECT
        (SELECT COUNT(*) FROM funcionarios) AS total_funcionarios,

        -- Lançamentos feitos hoje (data do registro = hoje)
        (SELECT COUNT(*) FROM registros_ponto
         WHERE data = CURRENT_DATE) AS lancados_hoje,

        -- Faltas no mês
        COUNT(r.id) FILTER (
            WHERE r.evento = 'Falta'
        ) AS total_faltas,

        COALESCE(SUM(CASE WHEN r.extras LIKE '+%'
            THEN CAST(SPLIT_PART(REPLACE(r.extras,'+',''),':',1) AS INT)*60
               + CAST(SPLIT_PART(REPLACE(r.extras,'+',''),':',2) AS INT)
            ELSE 0 END), 0) AS total_extras_min,

        COALESCE(SUM(CASE WHEN r.negativos LIKE '-%'
            THEN CAST(SPLIT_PART(REPLACE(r.negativos,'-',''),':',1) AS INT)*60
               + CAST(SPLIT_PART(REPLACE(r.negativos,'-',''),':',2) AS INT)
            ELSE 0 END), 0) AS total_negativos_min,

        COUNT(r.id) FILTER (
            WHERE r.evento IS NOT NULL AND r.evento != ''
        ) AS total_eventos

    FROM registros_ponto r
    WHERE EXTRACT(MONTH FROM r.data) = $1
      AND EXTRACT(YEAR FROM r.data)  = $2
`, [mes, ano]);

        const row = resultado.rows[0];
        const extrasMin    = parseInt(row.total_extras_min);
        const negativosMin = parseInt(row.total_negativos_min);

       res.json({
    total_funcionarios: parseInt(row.total_funcionarios),
    lancados_hoje:      parseInt(row.lancados_hoje),
    total_faltas:       parseInt(row.total_faltas),
    total_extras:    extrasMin    > 0 ? "+" + minutosParaHorario(extrasMin)    : "00:00",
    total_negativos: negativosMin > 0 ? "-" + minutosParaHorario(negativosMin) : "00:00",
    total_eventos:   parseInt(row.total_eventos),
    funcs_com_lacuna:  parseInt(row.funcs_com_lacuna)  || 0,
    total_dias_lacuna: parseInt(row.total_dias_lacuna) || 0,
});
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

module.exports = { gerarResumo };