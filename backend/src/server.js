const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", function () {
    console.log(`Servidor rodando na porta ${PORT}`);
});

//executar o codigo:  node backend/src/server.js