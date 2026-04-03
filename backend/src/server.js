const app = require("./app");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, "0.0.0.0", function () {
    console.log(`✓ Servidor rodando na porta ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
});

// Tratamento de erros não capturados
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    process.exit(1);
});

module.exports = server;