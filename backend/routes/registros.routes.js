const express = require("express");
const router  = express.Router();

const { listarRegistros, salvarRegistro, verificarRegistro, excluirRegistro } = require("../controllers/registros.controller");

router.get("/verificar", verificarRegistro); // ← adicione antes das outras
router.get("/:funcionario_id", listarRegistros);
router.post("/", salvarRegistro);
router.put("/:id", salvarRegistro);
router.delete("/:id", excluirRegistro);

module.exports = router;