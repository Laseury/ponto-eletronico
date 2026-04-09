const prisma = require("../db/prisma");

// ── Funções auxiliares de cálculo e conversão ──────────────────────────────
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

function calcularNoturno(entrada, saida) {
    if (!entrada || !saida) return 0;

    let minEntrada = calcularMinutos(entrada);
    let minSaida   = calcularMinutos(saida);
    if (minSaida < minEntrada) minSaida += 1440;

    const entradaNoPeriodo = minEntrada >= 22 * 60 || minEntrada < 5 * 60;
    if (entradaNoPeriodo) {
        return minSaida - minEntrada;
    }

    const NOTURNO_INICIO = 22 * 60;
    const inicio = Math.max(minEntrada, NOTURNO_INICIO);
    return minSaida > NOTURNO_INICIO ? minSaida - inicio : 0;
}

// Adaptadores para Prisma (Time -> Date e Date -> String HH:mm)
function parseTime(timeStr) {
    if (!timeStr) return null;
    return new Date(`1970-01-01T${timeStr}:00.000Z`);
}

function formatTime(dateObj) {
    if (!dateObj) return null;
    // Pega o HH:mm do objeto em UTC
    return dateObj.toISOString().substring(11, 16);
}

// Formata registro inteiro retornando como API espera
function formatarRegistro(r) {
    return {
        ...r,
        data: r.data.toISOString().split("T")[0],
        e1: formatTime(r.e1),
        s1: formatTime(r.s1),
        e2: formatTime(r.e2),
        s2: formatTime(r.s2),
        e3: formatTime(r.e3),
        s3: formatTime(r.s3)
    };
}

// ── Rota 4 — buscar registros de um funcionário ────────────────────────────
async function listarRegistros(req, res) {
    try {
        const funcionario_id = parseInt(req.params.funcionario_id);
        const mes = req.query.mes ? parseInt(req.query.mes) : null;
        const ano = req.query.ano ? parseInt(req.query.ano) : null;

        const where = { funcionarioId: funcionario_id };

        if (mes && ano) {
            where.data = {
                gte: new Date(ano, mes - 1, 1),
                lt:  new Date(ano, mes, 1)
            };
        }

        const registros = await prisma.registroPonto.findMany({
            where,
            orderBy: { data: 'asc' }
        });

        res.json(registros.map(formatarRegistro));
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

        const func = await prisma.funcionario.findUnique({
            where: { id: parseInt(funcionario_id) },
            select: { tipo: true }
        });
        
        if (!func) {
            return res.status(404).json({ erro: "Funcionário não encontrado" });
        }

        const tipo = func.tipo;
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

        if (evento === "Férias" || evento === "Ferias" || evento === "Atestado" || evento === "Feriado") {
            extrasMinutos = 0;
            negativosMinutos = 0;
            totalMinutos = 0;
        } else if (evento === "Falta") {
            if (!ehHorista) {
                negativosMinutos = 440;
            } else {
                negativosMinutos = negativos_manual ? calcularMinutos(negativos_manual) : 480;
            }
        } else if (evento === "Folga Banco") {
            negativosMinutos = cargaMinutos;
        } else if (evento === "DSR") {
            extrasMinutos = 0;
            negativosMinutos = 0;
        } else if (!evento && totalMinutos > 0) {
            if (totalMinutos > cargaMinutos) {
                extrasMinutos = totalMinutos - cargaMinutos;
            } else {
                negativosMinutos = cargaMinutos - totalMinutos;
            }
        }

        const total = totalMinutos > 0 ? minutosParaHorario(totalMinutos) : null;
        const extras = extrasMinutos > 0 ? "+" + minutosParaHorario(extrasMinutos) : "00:00";
        const negativos = negativosMinutos > 0 ? "-" + minutosParaHorario(negativosMinutos) : "00:00";

        const noturnoMin = calcularNoturno(e1, s1)
            + calcularNoturno(e2, s2)
            + calcularNoturno(e3, s3);
        const noturno = minutosParaHorario(noturnoMin);

        // Prisma Upsert
        const parsedData = new Date(data);
        const existingRecord = await prisma.registroPonto.findUnique({
            where: {
                funcionarioId_data: {
                    funcionarioId: parseInt(funcionario_id),
                    data: parsedData
                }
            }
        });

        const recordPayload = {
            e1: parseTime(e1),
            s1: parseTime(s1),
            e2: parseTime(e2),
            s2: parseTime(s2),
            e3: parseTime(e3),
            s3: parseTime(s3),
            evento,
            total,
            extras,
            negativos,
            noturno
        };

        const resultado = await prisma.registroPonto.upsert({
            where: {
                funcionarioId_data: {
                    funcionarioId: parseInt(funcionario_id),
                    data: parsedData
                }
            },
            update: recordPayload,
            create: {
                funcionarioId: parseInt(funcionario_id),
                data: parsedData,
                ...recordPayload
            }
        });

        const foiCriacao = !existingRecord;
        const usuario = req.headers["x-usuario"] || "desconhecido";
        await registrarLog(parseInt(funcionario_id), parsedData, usuario, resultado, foiCriacao);

        res.status(201).json(formatarRegistro(resultado));
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

// ── Rota Nova — Lançamento em Lote —————————————————————————————————————————
async function salvarEventoLote(req, res) {
    try {
        const { funcionario_ids, data_inicio, data_fim, evento, negativos_manual } = req.body;
        const usuario = req.headers["x-usuario"] || "ia_batch";

        if (!funcionario_ids || !data_inicio || !data_fim || !evento) {
            return res.status(400).json({ erro: "Parâmetros insuficientes para lote." });
        }

        const inicio = new Date(data_inicio);
        const fim = new Date(data_fim);

        // Usar Transação Prisma
        await prisma.$transaction(async (tx) => {
            for (const fIdStr of funcionario_ids) {
                const f_id = parseInt(fIdStr);
                const func = await tx.funcionario.findUnique({
                    where: { id: f_id },
                    select: { tipo: true }
                });
                
                if (!func) continue;

                const ehHorista = func.tipo === "Horista" || func.tipo === "Horista Noturno";
                const cargaMinutos = ehHorista ? 480 : 440;

                let curr = new Date(inicio);
                while (curr <= fim) {
                    let negMin = 0;
                    if (evento === "Falta") {
                        negMin = !ehHorista ? 440 : (negativos_manual ? calcularMinutos(negativos_manual) : 480);
                    } else if (evento === "Folga Banco") {
                        negMin = cargaMinutos;
                    }

                    const extras = "00:00";
                    const negativos = negMin > 0 ? "-" + minutosParaHorario(negMin) : "00:00";

                    await tx.registroPonto.upsert({
                        where: {
                            funcionarioId_data: {
                                funcionarioId: f_id,
                                data: new Date(curr)
                            }
                        },
                        update: {
                            evento,
                            extras,
                            negativos,
                            total: null,
                            noturno: '00:00'
                        },
                        create: {
                            funcionarioId: f_id,
                            data: new Date(curr),
                            evento,
                            extras,
                            negativos,
                            total: null,
                            noturno: '00:00'
                        }
                    });

                    // Registrar Log de Auditoria para cada dia do lote
                    await tx.logRegistro.create({
                        data: {
                            funcionarioId: f_id,
                            dataRegistro: new Date(curr),
                            usuario: usuario,
                            acao: "edicao",
                            campoAlterado: "evento",
                            valorNovo: evento
                        }
                    });
                    
                    // Incrementa dia
                    curr.setDate(curr.getDate() + 1);
                }
            }
        });

        res.json({ mensagem: "Eventos lançados com sucesso em lote." });
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
}

// Auxiliar para LOGS
async function registrarLog(funcionario_id, data, usuario, registro, foiCriacao) {
    // Para simplificar, registramos uma ação de edição de registro de ponto.
    // Em sistemas mais complexos, compararíamos o registro antigo com o novo para capturar o campo exato.
    await prisma.logRegistro.create({
        data: {
            funcionarioId: funcionario_id,
            dataRegistro: new Date(data),
            usuario: usuario,
            acao: foiCriacao ? "criacao" : "edicao",
            campoAlterado: "dia",
            valorNovo: registro.evento || "Horários"
        }
    });
}

async function verificarRegistro(req, res) {
    try {
        const { funcionario_id, data } = req.query;
        
        const registro = await prisma.registroPonto.findUnique({
            where: {
                funcionarioId_data: {
                    funcionarioId: parseInt(funcionario_id),
                    data: new Date(data)
                }
            }
        });
        
        if (registro) {
            res.json({ existe: true, registro: formatarRegistro(registro) });
        } else {
            res.json({ existe: false });
        }
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

module.exports = { listarRegistros, salvarRegistro, verificarRegistro, salvarEventoLote };