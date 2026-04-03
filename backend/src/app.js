const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");

const funcionariosRoutes = require("../routes/funcionarios.routes");
const registrosRoutes    = require("../routes/registros.routes");   // novo
const relatorioRoutes    = require("../routes/relatorio.routes");   // novo
const resumoRoutes = require("../routes/resumo.routes");
const logRoutes = require("../routes/log.routes");
const iaRoutes = require("../routes/ia.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// API Routes
app.use("/funcionarios", funcionariosRoutes);
app.use("/registros",    registrosRoutes);   // novo
app.use("/relatorio",    relatorioRoutes);   // novo
app.use("/resumo", resumoRoutes);
app.use("/logs", logRoutes);
app.use("/ia", iaRoutes);

// Servir arquivos estáticos do frontend React (Build) - apenas se existir
const distPath = path.join(__dirname, "../../frontend-react/dist");
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    // Rota catch-all para servir index.html do React em rotas não encontradas (SPA fallback)
    app.use((req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
    });
} else {
    // Fallback quando frontend não está buildado
    app.use((req, res) => {
        res.status(200).json({ 
            message: "API rodando. Frontend não está disponível neste ambiente.",
            version: "1.0.0"
        });
    });
}

// Tratamento de erro 404
app.use((req, res) => {
    res.status(404).json({ error: "Rota não encontrada" });
});

// Erro geral
app.use((err, req, res, next) => {
    console.error("Erro:", err.message);
    res.status(500).json({ error: "Erro interno do servidor" });
});

module.exports = app;