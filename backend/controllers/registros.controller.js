const pool = require("../db/connection");

// ── Funções auxiliares de cálculo ──────────────────────────────────────────
// Ficam aqui porque só são usadas pelas rotas de registros
function calcularMinutos(horario) {
    if (!horario) return 0;
    const partes = horario.split(":");
    return parseInt(partes[0]) * 60 + parseInt(partes[1]);
}

function calcularTurno(entrada, saida) {
    if (!entrada || !saida) return 0;
    let minEntrada = calcularMinutos(entrada);
    let minSaida = calcularMinutos(saida);
    if (minSaida < minEntrada) minSaida += 1440;
    return minSaida - minEntrada;
}

function minutosParaHorario(minutos) {
    if (minutos <= 0) return "00:00";
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

// Calcula quantos minutos de um turno caem entre 22:00 e 05:00
function calcularNoturno(entrada, saida) {
    if (!entrada || !saida) return 0;

    let minEntrada = calcularMinutos(entrada);
    let minSaida = calcularMinutos(saida);

    // Se passou da meia-noite, ajusta a saída somando 24h
    if (minSaida < minEntrada) minSaida += 1440;

    // Limites do horário noturno em minutos
    // 22:00 = 1320min | 05:00 do dia seguinte = 1320 + 420 = 1740min (29:00)
    const NOTURNO_INICIO = 22 * 60;        // 1320
    const NOTURNO_FIM = (24 + 5) * 60;  // 1740

    // Para comparar corretamente, se a entrada for antes das 22h
    // e a saída depois das 22h, precisamos trabalhar na mesma linha do tempo
    // Estratégia: se a entrada for < 22h, a janela noturna começa em 22h
    // Se a entrada já for noturna (>= 22h ou < 5h), começa na própria entrada

    // Normaliza: se entrada < 5h (ex: turno que começa à 00:00 ou 02:00)
    // soma 24h para colocar na mesma linha de tempo que NOTURNO_FIM
    let eNorm = minEntrada;
    let sNorm = minSaida;
    if (eNorm < 5 * 60) {
        eNorm += 1440;
        sNorm += 1440;
    }

    // Interseção entre [eNorm, sNorm] e [NOTURNO_INICIO, NOTURNO_FIM]
    const inicio = Math.max(eNorm, NOTURNO_INICIO);
    const fim = Math.min(sNorm, NOTURNO_FIM);

    return fim > inicio ? fim - inicio : 0;
}

// ── Rota 4 — buscar registros de um funcionário ────────────────────────────
async function listarRegistros(req, res) {
    try {
        const funcionario_id = parseInt(req.params.funcionario_id);
        const resultado = await pool.query(
            "SELECT * FROM registros_ponto WHERE funcionario_id = $1 ORDER BY data",
            [funcionario_id]
        );
        res.json(resultado.rows);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

// ── Rota 5 — criar ou atualizar um registro ────────────────────────────────
async function salvarRegistro(req, res) {
    try {
        const { funcionario_id, data, e1, s1, e2, s2, e3, s3, evento } = req.body;

        if (!funcionario_id || !data) {
            return res.status(400).json({ erro: "Funcionário e data são obrigatórios" });
        }

        const funcResult = await pool.query(
            "SELECT tipo FROM funcionarios WHERE id = $1", [funcionario_id]
        );
        const tipo = funcResult.rows[0].tipo;

        let cargaMinutos = 440;
        if (tipo === "Horista" || tipo === "Horista Noturno") cargaMinutos = 480;

        let totalMinutos = 0;
        if (!evento) {
            totalMinutos += calcularTurno(e1, s1);
            totalMinutos += calcularTurno(e2, s2);
            totalMinutos += calcularTurno(e3, s3);
        }

        let extrasMinutos = 0;
        let negativosMinutos = 0;
        if (!evento && totalMinutos > 0) {
            if (totalMinutos > cargaMinutos) {
                extrasMinutos = totalMinutos - cargaMinutos;
            } else {
                negativosMinutos = cargaMinutos - totalMinutos;
            }
        }

        const total = totalMinutos > 0 ? minutosParaHorario(totalMinutos) : null;
        const extras = extrasMinutos > 0 ? "+" + minutosParaHorario(extrasMinutos) : "00:00";
        const negativos = negativosMinutos > 0 ? "-" + minutosParaHorario(negativosMinutos) : "00:00";

        // ✅ ADICIONE estas três linhas logo abaixo:
        const noturnoMin = calcularNoturno(e1, s1)
            + calcularNoturno(e2, s2)
            + calcularNoturno(e3, s3);
        const noturno = minutosParaHorario(noturnoMin); // ex: "02:30" ou "00:00"

        const resultado = await pool.query(`
           INSERT INTO registros_ponto (funcionario_id, data, e1, s1, e2, s2, e3, s3, evento, total, extras, negativos, noturno)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
ON CONFLICT (funcionario_id, data)
DO UPDATE SET e1=$3, s1=$4, e2=$5, s2=$6, e3=$7, s3=$8, evento=$9, total=$10, extras=$11, negativos=$12, noturno=$13
RETURNING *`,
            [funcionario_id, data, e1, s1, e2, s2, e3, s3, evento, total, extras, negativos, noturno]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}



module.exports = { listarRegistros, salvarRegistro };