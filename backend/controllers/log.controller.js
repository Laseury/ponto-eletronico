const prisma = require("../db/prisma");

async function listarLogs(req, res) {
    try {
        const { funcionario_id, mes, ano, usuario, acao } = req.query;

        const where = {};
        
        if (funcionario_id) {
            where.funcionarioId = parseInt(funcionario_id);
        }
        
        if (mes && ano) {
            // No PostgreSQL, filtrar por partes da data no Prisma de forma nativa é mais verboso
            // ou pode ser feito convertendo p/ strings. Mas como temos filtros exatos de mes/ano,
            // podemos definir um range de datas de >= inicio do mes e < inicio do prox mes.
            const dataInicial = new Date(ano, mes - 1, 1);
            const dataFinal = new Date(ano, mes, 1); // dia 1 do proximo mes

            where.criadoEm = {
                gte: dataInicial,
                lt: dataFinal
            };
        }
        
        if (usuario) {
            where.usuario = {
                contains: usuario,
                mode: 'insensitive' // ILIKE
            };
        }
        
        if (acao) {
            where.acao = acao;
        }

        const logs = await prisma.logRegistro.findMany({
            where,
            include: {
                funcionario: {
                    select: { nome: true }
                }
            },
            orderBy: {
                criadoEm: 'desc'
            },
            take: 300
        });

        // Mapear para o formato que a interface espera
        const resultado = logs.map(l => ({
            id: l.id,
            funcionario: l.funcionario?.nome,
            data_registro: l.dataRegistro,
            usuario: l.usuario,
            acao: l.acao,
            campo_alterado: l.campoAlterado,
            valor_anterior: l.valorAnterior,
            valor_novo: l.valorNovo,
            criado_em: l.criadoEm
        }));

        res.json(resultado);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

module.exports = { listarLogs };