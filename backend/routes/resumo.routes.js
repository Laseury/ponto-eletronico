const express = require("express");
const router  = express.Router();

const { gerarResumo } = require("../controllers/resumo.controller");

router.get("/:mes/:ano", gerarResumo);

module.exports = router;