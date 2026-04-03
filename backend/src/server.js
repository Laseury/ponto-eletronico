require("dotenv").config();
const app = require("./app");
const prisma = require("../db/prisma");
const { execSync } = require("child_process");

const PORT = process.env.PORT || 3000;

// Verificar e executar migrations em produção
async function runMigrations() {
    if (process.env.NODE_ENV === "production") {
        try {
            console.log("Executando Prisma migrations...");
            execSync("npx prisma migrate deploy --skip-generate", { stdio: "inherit" });
            console.log("✓ Migrations executadas com sucesso");
        } catch (error) {
            console.warn("⚠ Aviso ao executar migrations:", error.message);
            // Não bloqueia - pode já estar migrado
        }
    }
}

// Verificar banco de dados antes de iniciar
async function checkDatabase() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        console.log("✓ Conexão com banco de dados OK");
        return true;
    } catch (error) {
        console.error("✗ Erro ao conectar com banco de dados:", error.message);
        return false;
    }
}

// Iniciar servidor
async function startServer() {
    try {
        // Executar migrations em produção
        await runMigrations();

        // Verificar DB
        const dbOk = await checkDatabase();
        if (!dbOk && process.env.NODE_ENV === "production") {
            console.error("Falha ao conectar com banco em produção. Abortando.");
            process.exit(1);
        }

        const server = app.listen(PORT, "0.0.0.0", function () {
            console.log(`✓ Servidor rodando na porta ${PORT}`);
            console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
            console.log(`✓ Database URL: ${process.env.DATABASE_URL ? "Configurado" : "NÃO CONFIGURADO"}`);
        });

        // Timeout para o servidor responder
        server.timeout = 30000;

    } catch (error) {
        console.error("Erro ao iniciar servidor:", error);
        process.exit(1);
    }
}

// Tratamento de erros não capturados
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    if (process.env.NODE_ENV === "production") process.exit(1);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    if (process.env.NODE_ENV === "production") process.exit(1);
});

startServer();