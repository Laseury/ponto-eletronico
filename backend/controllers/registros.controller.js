const prisma = require("../db/prisma");

// â”€â”€ FunÃ§Ãµes auxiliares de cÃ¡lculo e conversÃ£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

function calcularNoturnoEProrrogacao(entrada, saida) {
    if (!entrada || !saida) return { noturno: 0, prorrogacao: 0 };

    let e = calcularMinutos(entrada);
    let s = calcularMinutos(saida);
    if (s < e) s += 1440;

    const intersection = (s1, e1, s2, e2) => {
        const start = Math.max(s1, s2);
        const end = Math.min(e1, e2);
        return end > start ? end - start : 0;
    };

    let regularNoturno = intersection(e, s, 1320, 1740) + intersection(e, s, -120, 300);
    let prorrogacao = 0;

    const startsInNight = (e >= 1320 || e < 300);
    if (startsInNight) {
        if (e >= 1320 && s > 1740) {
            prorrogacao = s - 1740;
        } else if (e < 300 && s > 300) {
            prorrogacao = s - 300;
        }
    }

    return { noturno: regularNoturno, prorrogacao };
}

function calcularNoturno(entrada, saida) {
    const res = calcularNoturnoEProrrogacao(entrada, saida);
    return res.noturno + res.prorrogacao;
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

// â”€â”€ Rota 4 â€” buscar registros de um funcionÃ¡rio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Rota 5 â€” criar ou atualizar um registro â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function salvarRegistro(req, res) {
    try {
        const { funcionario_id, data, e1, s1, e2, s2, e3, s3, evento, negativos_manual } = req.body;

        if (!funcionario_id || !data) {
            return res.status(400).json({ erro: "FuncionÃ¡rio e data sÃ£o obrigatÃ³rios" });
        }

        const func = await prisma.funcionario.findUnique({
            where: { id: parseInt(funcionario_id) },
            select: { tipo: true, cargaHorariaDiaria: true }
        });
        
        if (!func) {
            return res.status(404).json({ erro: "FuncionÃ¡rio nÃ£o encontrado" });
        }

        const tipo = func.tipo;
        let totalMinutos = 0;
        totalMinutos += calcularTurno(e1, s1);
        totalMinutos += calcularTurno(e2, s2);
        totalMinutos += calcularTurno(e3, s3);

        const ehHoristaOuNoturno = tipo === "Horista" || tipo === "Horista Noturno";
        const ehHorista = tipo === "Horista"; 
        const cargaMinutos = func.cargaHorariaDiaria || (tipo === "Horista" ? 480 : 440);

        let extrasMinutos = 0;
        let negativosMinutos = 0;

        // Se houver evento JUSTIFICADO (nÃ£o Falta), o dia "vale" a carga horÃ¡ria em termos de saldo de horas (0 negativos).
        // Se houver Falta ou Folga Banco, gera negativos do tamanho da carga.
        // Se houver horas trabalhadas em qualquer evento, elas contam como Extras (exceto Falta).

        if (evento === "FÃ©rias" || evento === "Ferias" || evento === "Atestado" || evento === "DeclaraÃ§Ã£o" || evento === "Declaracao" || evento === "Folga" || evento === "Folga Domingo" || evento === "DSR") {
            negativosMinutos = 0;
            extrasMinutos = totalMinutos;
        } else if (evento === "Feriado" || evento === "Folga Feriado" || evento === "Pago") {
            negativosMinutos = 0;
            extrasMinutos = 0;
        } else if (evento === "Falta" || evento === "Folga Banco") {
            negativosMinutos = ehHoristaOuNoturno ? 0 : (negativos_manual ? calcularMinutos(negativos_manual) : cargaMinutos);
            extrasMinutos = 0;
            totalMinutos = 0; // Se Ã© falta, ignora punches para o total (embora idealmente nÃ£o devesse ter punches)
        } else {
            // Sem evento
            if (totalMinutos > cargaMinutos) {
                extrasMinutos = totalMinutos - cargaMinutos;
                negativosMinutos = 0;
            } else if (totalMinutos < cargaMinutos) {
                extrasMinutos = 0;
                negativosMinutos = ehHoristaOuNoturno ? 0 : (cargaMinutos - totalMinutos);
            }
        }

        const total = totalMinutos > 0 ? minutosParaHorario(totalMinutos) : null;
        const extras = extrasMinutos > 0 ? "+" + minutosParaHorario(extrasMinutos) : "00:00";
        const negativos = negativosMinutos > 0 ? "-" + minutosParaHorario(negativosMinutos) : "00:00";

        const t1 = calcularNoturnoEProrrogacao(e1, s1);
        const t2 = calcularNoturnoEProrrogacao(e2, s2);
        const t3 = calcularNoturnoEProrrogacao(e3, s3);

        const noturnoMin = t1.noturno + t1.prorrogacao + t2.noturno + t2.prorrogacao + t3.noturno + t3.prorrogacao;
        const prorrogacaoMin = t1.prorrogacao + t2.prorrogacao + t3.prorrogacao;

        const noturno = minutosParaHorario(noturnoMin);
        const prorrogacao = minutosParaHorario(prorrogacaoMin);

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
            noturno,
            prorrogacao
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



// Auxiliar para LOGS
async function registrarLog(funcionario_id, data, usuario, registro, foiCriacao) {
    // Para simplificar, registramos uma aÃ§Ã£o de ediÃ§Ã£o de registro de ponto.
    // Em sistemas mais complexos, compararÃ­amos o registro antigo com o novo para capturar o campo exato.
    await prisma.logRegistro.create({
        data: {
            funcionarioId: funcionario_id,
            dataRegistro: new Date(data),
            usuario: usuario,
            acao: foiCriacao ? "criacao" : "edicao",
            campoAlterado: "dia",
            valorNovo: registro.evento || "HorÃ¡rios"
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

async function excluirRegistro(req, res) {
    try {
        const id = parseInt(req.params.id);
        
        const registro = await prisma.registroPonto.findUnique({
            where: { id }
        });
        
        if (!registro) {
            return res.status(404).json({ erro: "Registro nÃ£o encontrado" });
        }
        
        await prisma.registroPonto.delete({
            where: { id }
        });
        
        const usuario = req.headers["x-usuario"] || "desconhecido";
        
        // Log deletion
        await prisma.logRegistro.create({
            data: {
                funcionarioId: registro.funcionarioId,
                dataRegistro: new Date(registro.data),
                usuario: usuario,
                acao: "edicao", // Reusing edicao for simplicity as per existing logic
                campoAlterado: "exclusao",
                valorNovo: "Registro ExcluÃ­do"
            }
        });
        
        res.json({ mensagem: "Registro excluÃ­do com sucesso" });
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}


async function loteEvento(req, res) {
    try {
        const { funcionario_ids, data_inicio, data_fim, evento, negativos_manual } = req.body;

        if (!funcionario_ids || !Array.isArray(funcionario_ids) || !data_inicio || !data_fim || !evento) {
            return res.status(400).json({ erro: "Dados incompletos para lancamento em lote" });
        }

        const usuario = req.headers["x-usuario"] || "lote_batch";

        for (const fId of funcionario_ids) {
            const func = await prisma.funcionario.findUnique({
                where: { id: parseInt(fId) },
                select: { tipo: true, cargaHorariaDiaria: true }
            });
            if (!func) continue;

            const ehHoristaOuNoturno = func.tipo === "Horista" || func.tipo === "Horista Noturno";
            const cargaMinutos = func.cargaHorariaDiaria || (func.tipo === "Horista" ? 480 : 440);

            let current = new Date(data_inicio);
            const end = new Date(data_fim);

            while (current <= end) {
                let extras = "00:00";
                let negativos = "00:00";
                let total = null;

                if (evento === "Falta" || evento === "Folga Banco") {
                    const negMin = ehHoristaOuNoturno ? 0 : (negativos_manual ? calcularMinutos(negativos_manual) : cargaMinutos);
                    negativos = negMin > 0 ? "-" + minutosParaHorario(negMin) : "00:00";
                }

                const recordPayload = {
                    evento,
                    total,
                    extras,
                    negativos,
                    noturno: "00:00",
                    prorrogacao: "00:00",
                    e1: null, s1: null, e2: null, s2: null, e3: null, s3: null
                };

                const resultado = await prisma.registroPonto.upsert({
                    where: { funcionarioId_data: { funcionarioId: parseInt(fId), data: new Date(current) } },
                    update: recordPayload,
                    create: { funcionarioId: parseInt(fId), data: new Date(current), ...recordPayload }
                });

                await registrarLog(parseInt(fId), new Date(current), usuario, resultado, false);
                current.setDate(current.getDate() + 1);
            }
        }

        res.json({ mensagem: "Lancamento em lote concluido com sucesso" });
    } catch (erro) {
        console.error("Erro lote:", erro);
        res.status(500).json({ erro: erro.message });
    }
}

async function recalcularRegistrosFuncionario(req, res) {
    try {
        const funcionario_id = parseInt(req.params.funcionario_id);
        const mes = req.query.mes ? parseInt(req.query.mes) : null;
        const ano = req.query.ano ? parseInt(req.query.ano) : null;

        const func = await prisma.funcionario.findUnique({
            where: { id: funcionario_id },
            select: { tipo: true, cargaHorariaDiaria: true }
        });

        if (!func) {
            return res.status(404).json({ erro: "Funcionário não encontrado" });
        }

        const where = { funcionarioId: funcionario_id };
        if (mes && ano) {
            where.data = {
                gte: new Date(ano, mes - 1, 1),
                lt:  new Date(ano, mes, 1)
            };
        }

        const registros = await prisma.registroPonto.findMany({ where });

        const tipo = func.tipo;
        const ehHoristaOuNoturno = tipo === "Horista" || tipo === "Horista Noturno";
        const cargaMinutos = func.cargaHorariaDiaria || (tipo === "Horista" ? 480 : 440);

        let atualizadosCount = 0;

        for (const r of registros) {
            const e1 = formatTime(r.e1);
            const s1 = formatTime(r.s1);
            const e2 = formatTime(r.e2);
            const s2 = formatTime(r.s2);
            const e3 = formatTime(r.e3);
            const s3 = formatTime(r.s3);
            const evento = r.evento;

            let totalMinutos = 0;
            totalMinutos += calcularTurno(e1, s1);
            totalMinutos += calcularTurno(e2, s2);
            totalMinutos += calcularTurno(e3, s3);

            let extrasMinutos = 0;
            let negativosMinutos = 0;

            if (evento === "Férias" || evento === "Ferias" || evento === "Atestado" || evento === "Declaração" || evento === "Declaracao" || evento === "Folga" || evento === "Folga Domingo" || evento === "DSR") {
                negativosMinutos = 0;
                extrasMinutos = totalMinutos;
            } else if (evento === "Feriado" || evento === "Folga Feriado" || evento === "Pago") {
                negativosMinutos = 0;
                extrasMinutos = 0;
            } else if (evento === "Falta" || evento === "Folga Banco") {
                negativosMinutos = ehHoristaOuNoturno ? 0 : cargaMinutos;
                extrasMinutos = 0;
                totalMinutos = 0;
            } else {
                if (totalMinutos > cargaMinutos) {
                    extrasMinutos = totalMinutos - cargaMinutos;
                    negativosMinutos = 0;
                } else if (totalMinutos < cargaMinutos) {
                    extrasMinutos = 0;
                    negativosMinutos = ehHoristaOuNoturno ? 0 : (cargaMinutos - totalMinutos);
                }
            }

            const total = totalMinutos > 0 ? minutosParaHorario(totalMinutos) : null;
            const extras = extrasMinutos > 0 ? "+" + minutosParaHorario(extrasMinutos) : "00:00";
            const negativos = negativosMinutos > 0 ? "-" + minutosParaHorario(negativosMinutos) : "00:00";

            const t1 = calcularNoturnoEProrrogacao(e1, s1);
            const t2 = calcularNoturnoEProrrogacao(e2, s2);
            const t3 = calcularNoturnoEProrrogacao(e3, s3);

            const noturnoMin = t1.noturno + t1.prorrogacao + t2.noturno + t2.prorrogacao + t3.noturno + t3.prorrogacao;
            const prorrogacaoMin = t1.prorrogacao + t2.prorrogacao + t3.prorrogacao;

            const noturno = minutosParaHorario(noturnoMin);
            const prorrogacao = minutosParaHorario(prorrogacaoMin);

            await prisma.registroPonto.update({
                where: { id: r.id },
                data: {
                    total,
                    extras,
                    negativos,
                    noturno,
                    prorrogacao
                }
            });
            atualizadosCount++;
        }

        res.json({ mensagem: "Registros recalculados com sucesso", count: atualizadosCount });
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

module.exports = { listarRegistros, salvarRegistro, verificarRegistro, excluirRegistro, loteEvento, recalcularRegistrosFuncionario };

