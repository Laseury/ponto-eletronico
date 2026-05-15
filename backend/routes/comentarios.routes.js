const express = require("express");
const router = express.Router();
const controller = require("../controllers/comentarios.controller");
const { authorizeRoles, Role } = require("../middlewares/auth.middleware");

router.post("/", authorizeRoles(Role.ADMIN, Role.GESTOR, Role.CONTADOR, Role.RH), controller.criarComentario);
router.get("/:funcionario_id", controller.listarComentarios);
router.delete("/:id", authorizeRoles(Role.ADMIN, Role.GESTOR, Role.CONTADOR, Role.RH), controller.excluirComentario);

module.exports = router;
