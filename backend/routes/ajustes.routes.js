const express = require("express");
const router = express.Router();
const controller = require("../controllers/ajustes.controller");
const { authorizeRoles, Role } = require("../middlewares/auth.middleware");

router.post("/", authorizeRoles(Role.ADMIN, Role.GESTOR, Role.CONTADOR), controller.criarAjuste);
router.get("/:funcionario_id", controller.listarAjustes);
router.delete("/:id", authorizeRoles(Role.ADMIN), controller.excluirAjuste);

module.exports = router;
