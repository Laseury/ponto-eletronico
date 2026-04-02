const prisma = require("../db/prisma");

// Rota 1 - Retorna todos os funcionários
async function listarFuncionarios(req, res) {
  try {
    const { todos } = req.query;
    
    const filter = todos === "1" ? {} : { ativo: true };
    const result = await prisma.funcionario.findMany({
      where: filter,
      orderBy: { id: 'asc' }
    });

    res.json(result);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function buscarFuncionarioPorId(req, res) {
  try {
    const id = parseInt(req.params.id);
    const resultado = await prisma.funcionario.findUnique({
      where: { id: id }
    });

    if (resultado) {
      res.json(resultado);
    } else {
      res.status(404).json({ erro: "Funcionário não encontrado" });
    }
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function criarFuncionario(req, res) {
  try {
    const { nome, tipo } = req.body;

    if (!nome || !tipo) {
      return res.status(400).json({ erro: "Nome e tipo são obrigatórios" });
    }
    
    const resultado = await prisma.funcionario.create({
      data: { nome, tipo }
    });
    
    res.status(201).json(resultado);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function editarFuncionario(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { nome, tipo } = req.body;

    const resultado = await prisma.funcionario.update({
      where: { id: id },
      data: { nome, tipo }
    });

    res.json(resultado);
  } catch (erro) {
    // Código P2025 = Record to update not found
    if (erro.code === 'P2025') {
       return res.status(404).json({ erro: "Funcionário não encontrado" });
    }
    res.status(500).json({ erro: erro.message });
  }
}

async function alternarAtivo(req, res) {
  try {
    const id = parseInt(req.params.id);
    
    const atual = await prisma.funcionario.findUnique({
      where: { id: id }
    });
    
    if (!atual) {
       return res.status(404).json({ erro: "Funcionário não encontrado" });
    }

    const novoAtivo = !atual.ativo;
    
    const resultado = await prisma.funcionario.update({
      where: { id: id },
      data: { ativo: novoAtivo }
    });
    
    res.json(resultado);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

module.exports = {
  listarFuncionarios,
  buscarFuncionarioPorId,
  criarFuncionario,
  editarFuncionario,
  alternarAtivo,
};
