const pool = require("../db/connection");

// Rota 1 - Retorna todos os funcionários
async function listarFuncionarios(req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM funcionarios"
    );

    res.json(result.rows);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function buscarFuncionarioPorId(req, res) {

try {
        const id = parseInt(req.params.id);
        const resultado = await pool.query("SELECT * FROM funcionarios WHERE id = $1", [id]);

        if (resultado.rows.length > 0) {
            res.json(resultado.rows[0]);
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
        const resultado = await pool.query(
            "INSERT INTO funcionarios (nome, tipo) VALUES ($1, $2) RETURNING *", [nome, tipo]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

module.exports = {
  listarFuncionarios,
  buscarFuncionarioPorId,
  criarFuncionario
};