const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const { importarFolha } = require("../controllers/importar.controller");

// Configuração do Multer para armazenamento em memória (exigido pelo controlador de importação)
const upload = multer({ storage: multer.memoryStorage() });

// Rota de processamento unificada
router.post("/extrair", upload.single("arquivo"), importarFolha);

module.exports = router;
