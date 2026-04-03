const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");

const app = express();

// Trust proxy (importante para Railway)
app.set('trust proxy', 1);

// Middleware de logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const statusColor = status >= 200 && status < 300 ? '✓' : status >= 300 && status < 400 ? '~' : '✗';
        console.log(`${statusColor} ${req.method} ${req.path} - ${status} (${duration}ms)`);
    });
    next();
});

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
        uptime: process.uptime(),
        frontend: {
            distExists: fs.existsSync(path.join(__dirname, "../../frontend-react/dist")),
            indexExists: fs.existsSync(path.join(__dirname, "../../frontend-react/dist/index.html"))
        }
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

if (fs.existsSync(distPath) && fs.existsSync(indexPath)) {
    console.log("✅ Frontend React encontrado! Servindo arquivos estáticos...");
    
    // Servir arquivos estáticos com cache headers
    app.use(express.static(distPath, {
        maxAge: '1d',
        extensions: ['html', 'htm']
    }));
    
    // SPA fallback - servir index.html para todas as rotas não encontradas
    app.get('*', (req, res, next) => {
        // Não fazer fallback para API routes
        if (req.path.startsWith('/api/') || req.path.startsWith('/funcionarios') || 
            req.path.startsWith('/registros') || req.path.startsWith('/relatorio') ||
            req.path.startsWith('/resumo') || req.path.startsWith('/logs') ||
            req.path.startsWith('/ia')) {
            return next();
        }
        
        res.sendFile(indexPath, (err) => {
            if (err) {
                console.error("Erro ao servir index.html:", err.message);
                res.status(500).json({ error: "Erro ao carregar frontend" });
            }
        });
    });
} else {
    console.error("❌ Frontend NÃO encontrado!");
    console.error(`   - Caminho esperado: ${distPath}`);
    console.error(`   - dist existe: ${fs.existsSync(distPath)}`);
    console.error(`   - index.html existe: ${fs.existsSync(indexPath)}`);
    
    // Fallback: retornar JSON quando frontend não existe
    app.get('/', (req, res) => {
        res.json({ 
            message: "API rodando. Frontend não está disponível neste ambiente.",
            version: "1.0.0",
            debugInfo: {
                distPath: distPath,
                distExists: fs.existsSync(distPath)
            }
        });
    });
}

// 404 handler para API routes
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: "Rota não encontrada", path: req.path });
    }
    next();
});

// Erro geral (middleware com 4 parâmetros)
app.use((err, req, res, next) => {
    console.error("\n❌ ERRO NA ROTA:");
    console.error(`   Método: ${req.method}`);
    console.error(`   Path: ${req.path}`);
    console.error(`   Mensagem: ${err.message}`);
    if (err.stack) console.error(`   Stack: ${err.stack}`);
    
    res.status(500).json({ 
        error: "Erro interno do servidor", 
        message: process.env.NODE_ENV === "development" ? err.message : undefined
    });
});

module.exports = app;