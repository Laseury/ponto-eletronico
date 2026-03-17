const pool = require("../db/connection");

function minutosParaHorario(minutos) {
  if (minutos <= 0) return "00:00";
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

async function gerarRelatorio(req, res) {
  try {
    const mes = parseInt(req.params.mes);
    const ano = parseInt(req.params.ano);
    const valorHora = parseFloat(req.query.valor_hora) || 0;

    const mesInicioCiclo = mes <= 6 ? 1 : 7;

    const resultado = await pool.query(
      `
            SELECT
                f.id, f.nome, f.tipo,
                COUNT(r.id) FILTER (WHERE r.evento IS NULL OR r.evento = '')       AS dias_trabalhados,
                COUNT(r.id) FILTER (WHERE r.evento IS NOT NULL AND r.evento != '') AS dias_evento,
                COUNT(r.id) FILTER (WHERE r.evento = 'Falta')                      AS faltas,
                SUM(CASE WHEN r.extras LIKE '+%'
                    THEN CAST(SPLIT_PART(REPLACE(r.extras,'+',''),':',1) AS INT)*60
                       + CAST(SPLIT_PART(REPLACE(r.extras,'+',''),':',2) AS INT)
                    ELSE 0 END) AS total_extras_min,
                SUM(CASE WHEN r.negativos LIKE '-%'
                    THEN CAST(SPLIT_PART(REPLACE(r.negativos,'-',''),':',1) AS INT)*60
                       + CAST(SPLIT_PART(REPLACE(r.negativos,'-',''),':',2) AS INT)
                    ELSE 0 END) AS total_negativos_min,
                SUM(
                    CAST(SPLIT_PART(COALESCE(r.noturno,'00:00'),':',1) AS INT)*60 +
                    CAST(SPLIT_PART(COALESCE(r.noturno,'00:00'),':',2) AS INT)
                ) 
                SUM(
    CASE WHEN r.total IS NOT NULL
    THEN CAST(SPLIT_PART(r.total,':',1) AS INT)*60 +
         CAST(SPLIT_PART(r.total,':',2) AS INT)
    ELSE 0 END
) AS total_trabalhado_min
            FROM funcionarios f
            LEFT JOIN registros_ponto r
                ON r.funcionario_id = f.id
                AND EXTRACT(MONTH FROM r.data) = $1
                AND EXTRACT(YEAR FROM r.data)  = $2
            GROUP BY f.id, f.nome, f.tipo
            ORDER BY f.nome
        `,
      [mes, ano],
    );

    const bancResult = await pool.query(
      `
            SELECT
                r.funcionario_id,
                SUM(CASE WHEN r.extras LIKE '+%'
                    THEN CAST(SPLIT_PART(REPLACE(r.extras,'+',''),':',1) AS INT)*60
                       + CAST(SPLIT_PART(REPLACE(r.extras,'+',''),':',2) AS INT)
                    ELSE 0 END) AS banco_extras_min,
                SUM(CASE WHEN r.negativos LIKE '-%'
                    THEN CAST(SPLIT_PART(REPLACE(r.negativos,'-',''),':',1) AS INT)*60
                       + CAST(SPLIT_PART(REPLACE(r.negativos,'-',''),':',2) AS INT)
                    ELSE 0 END) AS banco_negativos_min
            FROM registros_ponto r
            WHERE EXTRACT(YEAR FROM r.data)  = $1
              AND EXTRACT(MONTH FROM r.data) >= $2
              AND EXTRACT(MONTH FROM r.data) <= $3
            GROUP BY r.funcionario_id
        `,
      [ano, mesInicioCiclo, mes],
    );

    const bancoMap = {};
    bancResult.rows.forEach(function (row) {
      bancoMap[row.funcionario_id] = {
        extras: parseInt(row.banco_extras_min),
        negativos: parseInt(row.banco_negativos_min),
      };
    });

    function formatarSaldo(min) {
      if (min === 0) return "00:00";
      return (min > 0 ? "+" : "-") + minutosParaHorario(Math.abs(min));
    }

    const relatorio = resultado.rows.map(function (row) {
      const trabMin = parseInt(row.total_trabalhado_min) || 0;
      const diurnoMin = Math.max(0, trabMin - noturnoMin);
      const extrasMin = parseInt(row.total_extras_min) || 0;
      const negativosMin = parseInt(row.total_negativos_min) || 0;
      const noturnoMin = parseInt(row.total_noturno_min) || 0;
      const saldoMesMin = extrasMin - negativosMin;

      const banco = bancoMap[row.id] || { extras: 0, negativos: 0 };
      const bancoMin = banco.extras - banco.negativos;

      const horasNoturno = noturnoMin / 60;
      const valorNoturno =
        valorHora > 0 ? (horasNoturno * valorHora * 0.2).toFixed(2) : "0.00";

      return {
        id: row.id,
        nome: row.nome,
        tipo: row.tipo,
        dias_trabalhados: parseInt(row.dias_trabalhados),
        dias_evento: parseInt(row.dias_evento),
        faltas: parseInt(row.faltas),
        total_extras: minutosParaHorario(extrasMin),
        total_negativos: minutosParaHorario(negativosMin),
        saldo_mes: formatarSaldo(saldoMesMin),
        banco_horas: formatarSaldo(bancoMin),
        ciclo: `${mesInicioCiclo <= 6 ? "Jan–Jun" : "Jul–Dez"} ${ano}`,
        total_noturno: minutosParaHorario(noturnoMin),
        // Adicione após total_noturno:
        total_diurno: minutosParaHorario(
          Math.max(
            0,
            // total trabalhado = extras + carga normal — mas aqui calculamos pelo que temos
            // diurno = total - noturno
            extrasMin + (parseInt(row.total_trabalhado_min) || 0) - noturnoMin,
          ),
        ),
        total_diurno: minutosParaHorario(diurnoMin),
        valor_noturno: valorNoturno,
      };
    });

    res.json(relatorio);
  } catch (erro) {
    console.log("Erro relatório:", erro.message);
    res.status(500).json({ erro: erro.message });
  }
}

module.exports = { gerarRelatorio };
