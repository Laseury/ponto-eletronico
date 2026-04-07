require("dotenv").config();
const app = require("./app");
const prisma = require("../db/prisma");

const PORT = process.env.PORT || 3000;

console.log('\n============================================');
console.log('🚀 INICIANDO SERVIDOR');
console.log('============================================\n');

// Verificar e executar migrations em produção
async function runMigrations() {
    if (process.env.NODE_ENV === "production") {
        try {
            console.log("📦 Executando Prisma migrations...");
            const { execSync } = require("child_process");
            execSync("npx prisma migrate deploy", { stdio: "inherit" });
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
        console.log("🔗 Testando conexão com banco de dados...");
        await prisma.$queryRaw`SELECT 1`;
        console.log("✓ Conexão com banco de dados OK");
        return true;
    } catch (error) {
        console.error("✗ Erro ao conectar com banco de dados:", error.message);
        if (error.code) console.error("  Código do erro:", error.code);
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
            console.error("❌ Falha ao conectar com banco em produção. Abortando.");
            process.exit(1);
        }

        const server = app.listen(PORT, "0.0.0.0", function () {
            console.log(`✓ Servidor escutando na porta ${PORT}`);
            console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
            console.log(`✓ Database URL: ${process.env.DATABASE_URL ? "Configurado" : "⚠️ NÃO CONFIGURADO"}`);
            console.log('\n✅ SERVIDOR PRONTO PARA REQUISIÇÕES\n');
        });

        // Timeout para o servidor responder
        server.timeout = 30000;
        server.keepAliveTimeout = 65000;

    } catch (error) {
        console.error("❌ Erro fatal ao iniciar servidor:", error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Tratamento de erros não capturados
process.on("unhandledRejection", (reason, promise) => {
    console.error("\n⚠️ UNHANDLED REJECTION:");
    console.error(reason);
    if (process.env.NODE_ENV === "production") process.exit(1);
});

process.on("uncaughtException", (error) => {
    console.error("\n🔴 UNCAUGHT EXCEPTION:");
    console.error(error);
    if (process.env.NODE_ENV === "production") process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("\n📋 SIGTERM recebido, encerrando gracefully...");
    process.exit(0);
});

process.on("SIGINT", () => {
    console.log("\n📋 SIGINT recebido, encerrando gracefully...");
    process.exit(0);
});

startServer();