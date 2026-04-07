const prisma = require("../db/prisma");

async function criarAjuste(req, res) {
    try {
        const { valor, motivo, funcionario_id } = req.body;
        const usuario_id = req.user.id;

        if (!valor || !motivo || !funcionario_id) {
            return res.status(400).json({ erro: "Valor, motivo e funcionário são obrigatórios" });
        }

        // Validar formato do valor (+HH:mm ou -HH:mm)
        const regex = /^[+-]\d{2,}:\d{2}$/;
        if (!regex.test(valor)) {
            return res.status(400).json({ erro: "Formato de valor inválido. Use +HH:mm ou -HH:mm" });
        }

        const ajuste = await prisma.ajusteSaldo.create({
            data: {
                valor,
                motivo,
                funcionarioId: parseInt(funcionario_id),
                usuarioId: usuario_id
            },
            include: {
                usuario: {
                    select: { nome: true }
                }
            }
        });

        res.status(201).json(ajuste);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

async function listarAjustes(req, res) {
    try {
        const { funcionario_id } = req.params;

        const ajustes = await prisma.ajusteSaldo.findMany({
            where: {
                funcionarioId: parseInt(funcionario_id)
            },
            include: {
                usuario: {
                    select: { nome: true }
                }
            },
            orderBy: { data: 'desc' }
        });

        res.json(ajustes);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

async function excluirAjuste(req, res) {
    try {
        const { id } = req.params;
        const perfil = req.user.perfil;

        if (perfil !== "Admin") {
            return res.status(403).json({ erro: "Apenas administradores podem excluir ajustes de saldo" });
        }

        await prisma.ajusteSaldo.delete({
            where: { id: parseInt(id) }
        });

        res.json({ mensagem: "Ajuste excluído com sucesso" });
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

module.exports = { criarAjuste, listarAjustes, excluirAjuste };
