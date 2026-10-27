const express = require("express");
const router = express.Router();
const {
    obterConfigEmpresa,
    salvarConfigEmpresaHandler,
    salvarIdentificadoresLote,
    previewAfd,
    downloadAfdTxt,
    downloadBackupCsv
} = require("../controllers/afd.controller");

router.get("/config", obterConfigEmpresa);
router.post("/config", salvarConfigEmpresaHandler);
router.post("/salvar-identificadores", salvarIdentificadoresLote);
router.post("/preview", previewAfd);
router.post("/download-txt", downloadAfdTxt);
router.post("/download-csv", downloadBackupCsv);

module.exports = router;
