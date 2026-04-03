const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Status
app.get("/api/status", (req, res) => {
    res.json({ 
        status: "ok",
        environment: process.env.NODE_ENV || "development",
        uptime: process.uptime()
    });
});

try {
    const funcionariosRoutes = require("../routes/funcionarios.routes");
    const registrosRoutes    = require("../routes/registros.routes");
    const relatorioRoutes    = require("../routes/relatorio.routes");
    const resumoRoutes = require("../routes/resumo.routes");
    const logRoutes = require("../routes/log.routes");
    const iaRoutes = require("../routes/ia.routes");

    app.use("/funcionarios", funcionariosRoutes);
    app.use("/registros",    registrosRoutes);
    app.use("/relatorio",    relatorioRoutes);
    app.use("/resumo", resumoRoutes);
    app.use("/logs", logRoutes);
    app.use("/ia", iaRoutes);
    
    console.log("✓ Todas as rotas carregadas com sucesso");
} catch (error) {
    console.error("✗ Erro ao carregar rotas:", error.message);
    console.error("Stack:", error.stack);
}

// Servir arquivos estáticos do frontend React (Build) - apenas se existir
const distPath = path.join(__dirname, "../../frontend-react/dist");
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    // Rota catch-all para servir index.html do React em rotas não encontradas (SPA fallback)
    app.use((req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
    });
} else {
    console.log("⚠ Aviso: Frontend não está buildado em frontend-react/dist");
}

// Tratamento de erro 404
app.use((req, res) => {
    res.status(404).json({ error: "Rota não encontrada", path: req.path });
});

// Erro geral (middleware com 4 parâmetros)
app.use((err, req, res, next) => {
    console.error("Erro na rota:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ 
        error: "Erro interno do servidor", 
        message: process.env.NODE_ENV === "development" ? err.message : undefined
    });
});

module.exports = app;