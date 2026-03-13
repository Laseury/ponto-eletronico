const express = require("express");
const router = express.Router();

const {
  listarFuncionarios,
  buscarFuncionarioPorId,
  criarFuncionario
} = require("../controllers/funcionarios.controller");

router.get("/", listarFuncionarios);
router.get("/:id", buscarFuncionarioPorId);
router.post("/", criarFuncionario);

module.exports = router;