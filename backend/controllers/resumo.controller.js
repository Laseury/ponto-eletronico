const prisma = require("../db/prisma");

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

        const resultado = await prisma.$queryRaw`
            SELECT 
                (SELECT COUNT(*) FROM funcionarios) AS total_funcionarios,
                (SELECT COUNT(*) FROM registros_ponto WHERE data = CURRENT_DATE) AS lancados_hoje,
                COALESCE(sub.total_faltas, 0) AS total_faltas,
                COALESCE(sub.total_extras_min, 0) AS total_extras_min,
                COALESCE(sub.total_negativos_min, 0) AS total_negativos_min,
                COALESCE(sub.total_eventos, 0) AS total_eventos,
                0 AS funcs_com_lacuna,
                0 AS total_dias_lacuna
            FROM (
                SELECT 
                    COUNT(id) FILTER (WHERE evento = 'Falta') AS total_faltas,
                    SUM(CASE WHEN extras LIKE '+%:%' 
                        THEN CAST(SPLIT_PART(REPLACE(extras,'+',''),':',1) AS INT)*60 
                           + CAST(SPLIT_PART(REPLACE(extras,'+',''),':',2) AS INT) 
                        ELSE 0 END) AS total_extras_min,
                    SUM(CASE WHEN negativos LIKE '-%:%' 
                        THEN CAST(SPLIT_PART(REPLACE(negativos,'-',''),':',1) AS INT)*60 
                           + CAST(SPLIT_PART(REPLACE(negativos,'-',''),':',2) AS INT) 
                        ELSE 0 END) AS total_negativos_min,
                    COUNT(id) FILTER (WHERE evento IS NOT NULL AND evento != '') AS total_eventos
                FROM registros_ponto
                WHERE EXTRACT(MONTH FROM data) = ${mes}
                  AND EXTRACT(YEAR FROM data)  = ${ano}
            ) sub
        `;

        // Prisma $queryRaw retorna um array
        const row = resultado[0];
        
        // Prisma converte COUNT e SUM de PostgreSQL para BigInt, então precisamos converter para Number
        const extrasMin    = Number(row.total_extras_min || 0);
        const negativosMin = Number(row.total_negativos_min || 0);

        res.json({
            total_funcionarios: Number(row.total_funcionarios || 0),
            lancados_hoje:      Number(row.lancados_hoje || 0),
            total_faltas:       Number(row.total_faltas || 0),
            total_extras:       extrasMin    > 0 ? "+" + minutosParaHorario(extrasMin)    : "00:00",
            total_negativos:    negativosMin > 0 ? "-" + minutosParaHorario(negativosMin) : "00:00",
            total_eventos:      Number(row.total_eventos || 0),
            funcs_com_lacuna:   0,
            total_dias_lacuna:  0,
        });
    } catch (erro) {
        console.error("Erro dashboard resumo:", erro.message);
        res.status(500).json({ erro: "Erro ao carregar dados do painel" });
    }
}

module.exports = { gerarResumo };