const express = require("express");
const multer  = require("multer");
const router  = express.Router();

const { importarFolha } = require("../controllers/importar.controller");

// Configurar multer para aceitar arquivos na memória
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Arquivo não suportado. Use: JPG, PNG, PDF ou EXCEL"));
        }
    }
});

router.post("/", upload.single("arquivo"), importarFolha);

module.exports = router;
