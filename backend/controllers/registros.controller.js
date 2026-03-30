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
        const { funcionario_id, data, e1, s1, e2, s2, e3, s3, evento, negativos_manual } = req.body;

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

        const ehHorista = tipo === "Horista" || tipo === "Horista Noturno";
        const cargaMinutos = ehHorista ? 480 : 440; // 8h vs 7h20

        let extrasMinutos = 0;
        let negativosMinutos = 0;

        // --- NOVA LÓGICA DE EVENTOS ---
        if (evento === "Férias" || evento === "Atestado" || evento === "Feriado") {
            // Nem ganha nem perde horas
            extrasMinutos = 0;
            negativosMinutos = 0;
            totalMinutos = 0;
        } else if (evento === "Falta") {
            if (!ehHorista) {
                negativosMinutos = 440; // -07:20 fixo para mensalista
            } else {
                // Para horista, aceita valor manual ou padrão 8h (480)
                negativosMinutos = negativos_manual ? calcularMinutos(negativos_manual) : 480;
            }
        } else if (evento === "Folga Banco") {
            negativosMinutos = cargaMinutos; // Subtrai a carga do dia
        } else if (evento === "DSR") {
            // Mantém como está (DSR normalmente não gera extras/negativos se não trabalhado)
            extrasMinutos = 0;
            negativosMinutos = 0;
        } else if (!evento && totalMinutos > 0) {
            // Cálculo normal de horas extras/negativas para dia trabalhado
            if (totalMinutos > cargaMinutos) {
                extrasMinutos = totalMinutos - cargaMinutos;
            } else {
                negativosMinutos = cargaMinutos - totalMinutos;
            }
        } else if (!evento && totalMinutos === 0) {
            // Se não trabalhou e não tem evento, é considerado falta/lacuna mas aqui deixamos 0
            // O sistema de relatório pega lacunas
        }

        const total = totalMinutos > 0 ? minutosParaHorario(totalMinutos) : null;
        const extras = extrasMinutos > 0 ? "+" + minutosParaHorario(extrasMinutos) : "00:00";
        const negativos = negativosMinutos > 0 ? "-" + minutosParaHorario(negativosMinutos) : "00:00";

        const noturnoMin = calcularNoturno(e1, s1)
            + calcularNoturno(e2, s2)
            + calcularNoturno(e3, s3);
        const noturno = minutosParaHorario(noturnoMin);

        const resultado = await pool.query(`
            INSERT INTO registros_ponto (funcionario_id, data, e1, s1, e2, s2, e3, s3, evento, total, extras, negativos, noturno)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            ON CONFLICT (funcionario_id, data)
            DO UPDATE SET e1=$3, s1=$4, e2=$5, s2=$6, e3=$7, s3=$8, evento=$9, total=$10, extras=$11, negativos=$12, noturno=$13
            RETURNING *, (xmax = 0) AS foi_criacao`,
            [funcionario_id, data, e1, s1, e2, s2, e3, s3, evento, total, extras, negativos, noturno]
        );

        const registro = resultado.rows[0];
        const usuario = req.headers["x-usuario"] || "desconhecido";
        await registrarLog(funcionario_id, data, usuario, registro, resultado.rows[0].foi_criacao);

        res.status(201).json(registro);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

// ── Rota Nova — Lançamento em Lote —————————————————————————————————————————
async function salvarEventoLote(req, res) {
    const client = await pool.connect();
    try {
        const { funcionario_ids, data_inicio, data_fim, evento, negativos_manual } = req.body;
        const usuario = req.headers["x-usuario"] || "ia_batch";

        if (!funcionario_ids || !data_inicio || !data_fim || !evento) {
            return res.status(400).json({ erro: "Parâmetros insuficientes para lote." });
        }

        await client.query("BEGIN");

        const inicio = new Date(data_inicio);
        const fim = new Date(data_fim);

        for (const f_id of funcionario_ids) {
            // Busca o tipo do funcionário uma vez por funcionário
            const fResult = await client.query("SELECT tipo FROM funcionarios WHERE id = $1", [f_id]);
            const tipo = fResult.rows[0]?.tipo;
            if (!tipo) continue;

            const ehHorista = tipo === "Horista" || tipo === "Horista Noturno";
            const cargaMinutos = ehHorista ? 480 : 440;

            let curr = new Date(inicio);
            while (curr <= fim) {
                const dataStr = curr.toISOString().split("T")[0];
                
                let negMin = 0;
                if (evento === "Falta") {
                    negMin = !ehHorista ? 440 : (negativos_manual ? calcularMinutos(negativos_manual) : 480);
                } else if (evento === "Folga Banco") {
                    negMin = cargaMinutos;
                }

                const extras = "00:00";
                const negativos = negMin > 0 ? "-" + minutosParaHorario(negMin) : "00:00";

                await client.query(`
                    INSERT INTO registros_ponto (funcionario_id, data, evento, extras, negativos, total, noturno)
                    VALUES ($1, $2, $3, $4, $5, NULL, '00:00')
                    ON CONFLICT (funcionario_id, data)
                    DO UPDATE SET evento=$3, extras=$4, negativos=$5, total=NULL, noturno='00:00'`,
                    [f_id, dataStr, evento, extras, negativos]
                );

                // Incrementar dia
                curr.setDate(curr.getDate() + 1);
            }
        }

        await client.query("COMMIT");
        res.json({ mensagem: "Eventos lançados com sucesso em lote." });

    } catch (e) {
        await client.query("ROLLBACK");
        res.status(500).json({ erro: e.message });
    } finally {
        client.release();
    }
}

// Auxiliar para LOGS (Refatorado para diminuir salvarRegistro)
async function registrarLog(funcionario_id, data, usuario, registro, foiCriacao) {
    if (foiCriacao) {
        await pool.query(`INSERT INTO log_registros (funcionario_id, data_registro, usuario, acao) VALUES ($1,$2,$3,$4)`,
            [funcionario_id, data, usuario, "criacao"]);
    } else {
        // Busca o anterior (simplificado para o exemplo, ideal seria passar o anterior)
        // Por brevidade em lote, não faremos log detalhado campo a campo para cada dia do lote
        await pool.query(`INSERT INTO log_registros (funcionario_id, data_registro, usuario, acao) VALUES ($1,$2,$3,$4)`,
            [funcionario_id, data, usuario, "edicao"]);
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

module.exports = { listarRegistros, salvarRegistro, verificarRegistro, salvarEventoLote };