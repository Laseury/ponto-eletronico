const { Pool } = require("pg");

//Conexão com o banco de dados
const pool = new Pool({
    host: "localhost",
    port: 5432,
    database: "viso_ponto",
    user: "postgres",
    password: "Sifra10*"
})

module.exports = pool;