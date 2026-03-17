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
    let minSaida   = calcularMinutos(saida);
    if (minSaida < minEntrada) minSaida += 1440;

    // Janela de início noturno: 22:00 (1320) até 05:00 (300)
    // Um turno é noturno se a entrada estiver entre 22:00 e 05:00
    const entradaNoPeriodo = minEntrada >= 22 * 60 || minEntrada < 5 * 60;

    if (entradaNoPeriodo) {
        // Turno inteiro é noturno
        return minSaida - minEntrada;
    }

    // Se entrou fora do período noturno, conta só a parte após 22:00
    const NOTURNO_INICIO = 22 * 60;
    const inicio = Math.max(minEntrada, NOTURNO_INICIO);
    return minSaida > NOTURNO_INICIO ? minSaida - inicio : 0;
}

// ── Rota 4 — buscar registros de um funcionário ────────────────────────────
async function listarRegistros(req, res) {
    try {
        const funcionario_id = parseInt(req.params.funcionario_id);
        const mes = req.query.mes ? parseInt(req.query.mes) : null;
        const ano = req.query.ano ? parseInt(req.query.ano) : null;

        let query  = "SELECT * FROM registros_ponto WHERE funcionario_id = $1";
        let params = [funcionario_id];

        // Se mes e ano forem passados, filtra pelo mês
        if (mes && ano) {
            query  += " AND EXTRACT(MONTH FROM data) = $2 AND EXTRACT(YEAR FROM data) = $3";
            params  = [funcionario_id, mes, ano];
        }

        query += " ORDER BY data";

        const resultado = await pool.query(query, params);
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

      let totalMinutos = 0;
if (!evento) {
    totalMinutos += calcularTurno(e1, s1);
    totalMinutos += calcularTurno(e2, s2);
    totalMinutos += calcularTurno(e3, s3);
}
        // Mensalista tem carga fixa de 7h20 por dia
// Horista e Horista Noturno NÃO têm carga fixa — só geram extra acima de 8h,
// nunca geram negativo (escala variável)
const ehHorista = tipo === "Horista" || tipo === "Horista Noturno";
const cargaMinutos = ehHorista ? totalMinutos : 440;

let extrasMinutos    = 0;
let negativosMinutos = 0;

if (evento === "Folga Banco") {
    // Folga Banco deduz a carga do dia do banco de horas
    // Mensalista: 7h20 (440min) | Horista: 8h (480min)
    negativosMinutos = ehHorista ? 480 : 440;

} else if (!evento && totalMinutos > 0) {
    if (ehHorista) {
        if (totalMinutos > 480) {
            extrasMinutos = totalMinutos - 480;
        }
    } else {
        if (totalMinutos > cargaMinutos) {
            extrasMinutos = totalMinutos - cargaMinutos;
        } else {
            negativosMinutos = cargaMinutos - totalMinutos;
        }
    }
}

        const total = totalMinutos > 0 ? minutosParaHorario(totalMinutos) : null;
        const extras = extrasMinutos > 0 ? "+" + minutosParaHorario(extrasMinutos) : "00:00";
        const negativos = negativosMinutos > 0 ? "-" + minutosParaHorario(negativosMinutos) : "00:00";

        const noturnoMin = calcularNoturno(e1, s1)
            + calcularNoturno(e2, s2)
            + calcularNoturno(e3, s3);
        const noturno = minutosParaHorario(noturnoMin); // ex: "02:30" ou "00:00"

        const resultado = await pool.query(`
    INSERT INTO registros_ponto (funcionario_id, data, e1, s1, e2, s2, e3, s3, evento, total, extras, negativos, noturno)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (funcionario_id, data)
    DO UPDATE SET e1=$3, s1=$4, e2=$5, s2=$6, e3=$7, s3=$8, evento=$9, total=$10, extras=$11, negativos=$12, noturno=$13
    RETURNING *, (xmax = 0) AS foi_criacao`,
    [funcionario_id, data, e1, s1, e2, s2, e3, s3, evento, total, extras, negativos, noturno]
);

const registro  = resultado.rows[0];
const foiCriacao = registro.foi_criacao;
const usuario   = req.headers["x-usuario"] || "desconhecido";
const acao      = foiCriacao ? "criacao" : "edicao";

// Campos que podem ter mudado
const campos = ["e1","s1","e2","s2","e3","s3","evento","total","extras","negativos","noturno"];

if (foiCriacao) {
    // Criação — registra um log único
    await pool.query(`
        INSERT INTO log_registros (funcionario_id, data_registro, usuario, acao)
        VALUES ($1, $2, $3, $4)`,
        [funcionario_id, data, usuario, "criacao"]
    );
} else {
    // Edição — busca o registro anterior para comparar
    const anterior = await pool.query(
        "SELECT * FROM registros_ponto WHERE funcionario_id = $1 AND data = $2",
        [funcionario_id, data]
    );
    const ant = anterior.rows[0] || {};

    for (const campo of campos) {
        const valAnt = ant[campo] || null;
        const valNov = registro[campo] || null;
        if (valAnt !== valNov) {
            await pool.query(`
                INSERT INTO log_registros
                    (funcionario_id, data_registro, usuario, acao, campo_alterado, valor_anterior, valor_novo)
                VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [funcionario_id, data, usuario, "edicao", campo, valAnt, valNov]
            );
        }
    }
}

res.status(201).json(registro);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

async function verificarRegistro(req, res) {
    try {
        const { funcionario_id, data } = req.query;
        const resultado = await pool.query(
            "SELECT * FROM registros_ponto WHERE funcionario_id = $1 AND data = $2",
            [funcionario_id, data]
        );
        if (resultado.rows.length > 0) {
            res.json({ existe: true, registro: resultado.rows[0] });
        } else {
            res.json({ existe: false });
        }
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

module.exports = { listarRegistros, salvarRegistro, verificarRegistro };