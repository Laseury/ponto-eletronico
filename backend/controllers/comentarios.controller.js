const prisma = require("../db/prisma");

async function criarComentario(req, res) {
    try {
        const { texto, tipo, data_referencia, funcionario_id } = req.body;
        const usuario_id = req.user.id;

        if (!texto || !tipo || !funcionario_id) {
            return res.status(400).json({ erro: "Texto, tipo e funcionário são obrigatórios" });
        }

        const { comentario, log } = await prisma.$transaction(async (tx) => {
            const c = await tx.comentario.create({
                data: {
                    texto,
                    tipo,
                    dataReferencia: data_referencia ? new Date(data_referencia) : null,
                    funcionarioId: parseInt(funcionario_id),
                    usuarioId: usuario_id
                },
                include: {
                    usuario: {
                        select: { nome: true }
                    }
                }
            });

            const l = await tx.logRegistro.create({
                data: {
                    funcionarioId: parseInt(funcionario_id),
                    usuario: req.user?.login || "Sistema",
                    acao: "criacao",
                    campoAlterado: "comentario",
                    valorNovo: texto.substring(0, 100) + (texto.length > 100 ? "..." : ""),
                    dataRegistro: data_referencia ? new Date(data_referencia) : new Date()
                }
            });

            return { comentario: c, log: l };
        });

        res.status(201).json(comentario);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

async function listarComentarios(req, res) {
    try {
        const { funcionario_id } = req.params;
        const { mes, ano } = req.query;

        const where = {
            funcionarioId: parseInt(funcionario_id)
        };

        if (mes && ano) {
            // Se quiser filtrar por mês específico
            where.criadoEm = {
                gte: new Date(ano, mes - 1, 1),
                lt: new Date(ano, mes, 1)
            };
        }

        const comentarios = await prisma.comentario.findMany({
            where,
            include: {
                usuario: {
                    select: { nome: true }
                }
            },
            orderBy: { criadoEm: 'desc' }
        });

        res.json(comentarios);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

async function excluirComentario(req, res) {
    try {
        const { id } = req.params;
        const usuario_id = req.user.id;
        const perfil = req.user.perfil;

        const comentario = await prisma.comentario.findUnique({
            where: { id: parseInt(id) }
        });

        if (!comentario) {
            return res.status(404).json({ erro: "Comentário não encontrado" });
        }

        // Apenas quem criou ou Admin pode excluir
        if (comentario.usuarioId !== usuario_id && perfil !== "Admin") {
            return res.status(403).json({ erro: "Sem permissão para excluir este comentário" });
        }

        await prisma.$transaction(async (tx) => {
            await tx.comentario.delete({
                where: { id: parseInt(id) }
            });

            // Registrar Log de Auditoria
            await tx.logRegistro.create({
                data: {
                    funcionarioId: comentario.funcionarioId,
                    usuario: req.user?.login || "Sistema",
                    acao: "exclusao",
                    campoAlterado: "comentario",
                    valorAnterior: comentario.texto.substring(0, 100) + (comentario.texto.length > 100 ? "..." : ""),
                    dataRegistro: comentario.dataReferencia || new Date()
                }
            });
        });

        res.json({ mensagem: "Comentário excluído com sucesso" });
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

module.exports = { criarComentario, listarComentarios, excluirComentario };
