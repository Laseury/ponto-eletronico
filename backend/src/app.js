const express = require("express");
const cors    = require("cors");

const funcionariosRoutes = require("../routes/funcionarios.routes");
const registrosRoutes    = require("../routes/registros.routes");   // novo
const relatorioRoutes    = require("../routes/relatorio.routes");   // novo
const resumoRoutes = require("../routes/resumo.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/funcionarios", funcionariosRoutes);
app.use("/registros",    registrosRoutes);   // novo
app.use("/relatorio",    relatorioRoutes);   // novo
app.use("/resumo", resumoRoutes);

module.exports = app;