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

        // Query 1: Contar funcionários
        const totalFuncionarios = await prisma.Funcionario.count();

        // Query 2: Contar registros de hoje
        const hoje = new Date().toISOString().split('T')[0];
        const lancadosHoje = await prisma.RegistroPonto.count({
            where: {
                data: {
                    equals: new Date(hoje)
                }
            }
        });

        // Query 3: Buscar dados do mês
        const registrosMes = await prisma.RegistroPonto.findMany({
            where: {
                AND: [
                    {
                        data: {
                            gte: new Date(`${ano}-${String(mes).padStart(2, '0')}-01`)
                        }
                    },
                    {
                        data: {
                            lt: new Date(`${ano}-${String((mes % 12) + 1).padStart(2, '0')}-01`)
                        }
                    }
                ]
            },
            select: {
                evento: true,
                extras: true,
                negativos: true
            }
        });

        // Processar dados
        let totalFaltas = 0;
        let totalExtrasMin = 0;
        let totalNegativosMin = 0;
        let totalEventos = 0;

        registrosMes.forEach(reg => {
            // Contar eventos
            if (reg.evento && reg.evento.trim() !== '') {
                totalEventos++;
                if (reg.evento === 'Falta') {
                    totalFaltas++;
                }
            }

            // Processar extras (formato: +HH:MM)
            if (reg.extras && reg.extras.startsWith('+')) {
                const tempo = reg.extras.replace('+', '').split(':');
                if (tempo.length === 2) {
                    const horas = parseInt(tempo[0]) || 0;
                    const mins = parseInt(tempo[1]) || 0;
                    totalExtrasMin += (horas * 60) + mins;
                }
            }

            // Processar negativos (formato: -HH:MM)
            if (reg.negativos && reg.negativos.startsWith('-')) {
                const tempo = reg.negativos.replace('-', '').split(':');
                if (tempo.length === 2) {
                    const horas = parseInt(tempo[0]) || 0;
                    const mins = parseInt(tempo[1]) || 0;
                    totalNegativosMin += (horas * 60) + mins;
                }
            }
        });

        res.json({
            total_funcionarios: totalFuncionarios,
            lancados_hoje: lancadosHoje,
            total_faltas: totalFaltas,
            total_extras: totalExtrasMin > 0 ? "+" + minutosParaHorario(totalExtrasMin) : "00:00",
            total_negativos: totalNegativosMin > 0 ? "-" + minutosParaHorario(totalNegativosMin) : "00:00",
            total_eventos: totalEventos,
            funcs_com_lacuna: 0,
            total_dias_lacuna: 0,
        });
    } catch (erro) {
        console.error("Erro dashboard resumo:", erro.message);
        console.error("Stack:", erro.stack);
        res.status(500).json({ erro: "Erro ao carregar dados do painel" });
    }
}

module.exports = { gerarResumo };