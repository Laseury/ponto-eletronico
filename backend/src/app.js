const express = require("express");
const cors    = require("cors");
const path    = require("path");

const funcionariosRoutes = require("../routes/funcionarios.routes");
const registrosRoutes    = require("../routes/registros.routes");   // novo
const relatorioRoutes    = require("../routes/relatorio.routes");   // novo
const resumoRoutes = require("../routes/resumo.routes");
const logRoutes = require("../routes/log.routes");
const iaRoutes = require("../routes/ia.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend React (Build)
app.use(express.static(path.join(__dirname, "../../frontend-react/dist")));

app.use("/funcionarios", funcionariosRoutes);
app.use("/registros",    registrosRoutes);   // novo
app.use("/relatorio",    relatorioRoutes);   // novo
app.use("/resumo", resumoRoutes);
app.use("/logs", logRoutes);
app.use("/ia", iaRoutes);
// Rota catch-all para servir index.html do React em rotas não encontradas (SPA fallback)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend-react/dist/index.html"));
});

module.exports = app;