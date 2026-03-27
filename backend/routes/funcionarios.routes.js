const express = require("express");
const router = express.Router();

const {
  listarFuncionarios,
  buscarFuncionarioPorId,
  criarFuncionario,
  editarFuncionario,
  alternarAtivo,
} = require("../controllers/funcionarios.controller");

router.get("/", listarFuncionarios);
router.get("/:id", buscarFuncionarioPorId);
router.post("/", criarFuncionario);
router.put("/:id", editarFuncionario);
router.patch("/:id/ativo", alternarAtivo);

module.exports = router;