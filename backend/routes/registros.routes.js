const express = require("express");
const router  = express.Router();

const { listarRegistros, salvarRegistro, verificarRegistro, salvarEventoLote } = require("../controllers/registros.controller");

router.get("/verificar", verificarRegistro); // ← adicione antes das outras
router.get("/:funcionario_id", listarRegistros);
router.post("/", salvarRegistro);
router.put("/:id", salvarRegistro);
router.post("/lote-evento", salvarEventoLote);

module.exports = router;