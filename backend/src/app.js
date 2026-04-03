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

// Debug endpoint - verificar status do build
app.get("/debug/build-status", (req, res) => {
    const distPath = path.join(__dirname, "../../frontend-react/dist");
    const indexPath = path.join(distPath, "index.html");
    
    const status = {
        distPath: distPath,
        distExists: fs.existsSync(distPath),
        indexExists: fs.existsSync(indexPath),
        environment: process.env.NODE_ENV,
        cwd: process.cwd(),
        __dirname: __dirname,
    };
    
    if (status.distExists) {
        try {
            status.distContents = fs.readdirSync(distPath);
        } catch (err) {
            status.distContentsError = err.message;
        }
    }
    
    res.json(status);
});

// Servir arquivos estáticos do frontend React (Build) - apenas se existir
const distPath = path.join(__dirname, "../../frontend-react/dist");
const indexPath = path.join(distPath, "index.html");

console.log(`📂 Procurando frontend em: ${distPath}`);
console.log(`📄 Procurando index.html em: ${indexPath}`);

if (fs.existsSync(distPath) && fs.existsSync(indexPath)) {
    console.log("✅ Frontend React encontrado! Servindo arquivos estáticos...");
    app.use(express.static(distPath));
    
    // Rota catch-all para servir index.html do React em rotas não encontradas (SPA fallback)
    app.use((req, res) => {
        res.sendFile(indexPath, (err) => {
            if (err) {
                console.error("Erro ao servir index.html:", err);
                res.status(500).json({ error: "Erro ao carregar frontend" });
            }
        });
    });
} else {
    console.error("❌ Frontend NÃO encontrado!");
    console.error(`   - dist existe: ${fs.existsSync(distPath)}`);
    console.error(`   - index.html existe: ${fs.existsSync(indexPath)}`);
    console.error(`   - __dirname: ${__dirname}`);
    console.error(`   - cwd: ${process.cwd()}`);
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