const express = require("express");
const cors    = require("cors");
const path    = require("path");

const funcionariosRoutes = require("../routes/funcionarios.routes");
const registrosRoutes    = require("../routes/registros.routes");   // novo
const relatorioRoutes    = require("../routes/relatorio.routes");   // novo
const resumoRoutes = require("../routes/resumo.routes");
const logRoutes = require("../routes/log.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, "../../frontend")));

app.use("/funcionarios", funcionariosRoutes);
app.use("/registros",    registrosRoutes);   // novo
app.use("/relatorio",    relatorioRoutes);   // novo
app.use("/resumo", resumoRoutes);
app.use("/logs", logRoutes);
// Rota catch-all para servir index.html em rotas não encontradas
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/index.html"));
});

module.exports = app;