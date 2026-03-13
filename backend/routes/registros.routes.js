const express = require("express");
const router  = express.Router();

const { listarRegistros, salvarRegistro } = require("../controllers/registros.controller");

router.get("/:funcionario_id", listarRegistros);
router.post("/",               salvarRegistro);

module.exports = router;