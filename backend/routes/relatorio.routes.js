const express = require("express");
const router  = express.Router();

const { gerarRelatorio } = require("../controllers/relatorio.controller");

router.get("/:mes/:ano", gerarRelatorio);

module.exports = router;