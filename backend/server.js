const express = require("express");
const cors = require("cors");
const {Pool} = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

//Conexão com o banco de dados
const pool = new Pool({
    host: "localhost",
    port: 5432,
    database: "viso_ponto",
    user: "postgres",
    password: "Sifra10*"
})

function calcularMinutos(horario){
    if(!horario) return 0;
    const partes = horario.split(":");
    return parseInt(partes[0]) * 60 + parseInt(partes[1]);

}

function calcularTurno (entrada, saida){
    if (!entrada || !saida) return 0;
    let minEntrada = calcularMinutos(entrada);
    let minSaida = calcularMinutos(saida);

     // Se passou da meia-noite
     if(minSaida < minEntrada){
        minSaida += 1140
     }
     return minSaida - minEntrada;
}

function minutosParaHorario(minutos){
    if (minutos <= 0) return "00:00"
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

// Rota 1 - Retorna todos os funcionários
app.get("/funcionarios", async function (req,res){
   try{
    const resultado = await pool.query("SELECT * FROM funcionarios");
    res.json(resultado.rows);
   } catch(error){
    res.status(500).json({erro: erro.message});
   }
})

// Rota 2 - Retorna um funcionário pelo id
app.get("/funcionarios/:id", async function (req,res){
   try {
    const id = parseInt(req.params.id);
    const resultado = await pool.query("SELECT * FROM funcionarios WHERE id = $1", [id]);

    if (resultado.rows.length > 0){
        res.json(resultado.rows[0]);
    } else {
        res.status(404).json({erro: "Funcionário não encontrado"});
    }
   } catch(erro){
    res.status(500).json({erro: erro.message});
   }

})

//Rota 3 - Cadastrar novo funcionario
app.post("/funcionarios", async function(req,res){
    try {
        const {nome, tipo} = req.body;

        if (!nome || !tipo){
            return res.status(400).json({erro: "Nome e tipo são obrigatórios"});
        }
        const resultado = await pool.query(
            "INSERT INTO funcionarios (nome, tipo) VALUES ($1, $2) RETURNING *", [nome, tipo]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (erro){
        res.status(500),json ({erro: erro.message});
    }
})

//Rota 4 - Busca registros de ponto de um funcionário
app.get("/registros/:funcionario_id", async function(req,res){
    try {
        const funcionario_id = parseInt(req.params.funcionario_id);
        const resultado = await pool.query(
            "SELECT * FROM registros_ponto WHERE funcionario_id = $1 ORDER BY data", [funcionario_id]
        );
        res.json(resultado.rows);
    }catch (erro)
{
    res.status(500).json({erro: erro.message});
}});

//Rota 5 - Cria ou atualiza um registro de ponto
app.post("/registros", async function(req,res){
    try {
        const {funcionario_id, data, e1, s1, e2, s2, e3, s3, evento} = req.body;

        if (!funcionario_id || !data){
            return res.status(400).json({erro: "Funcionário e data são obrigatórios"});
        }

        //Busca a carga horária do funcionario
        const funcResult = await pool.query(
            "SELECT tipo FROM funcionarios WHERE id = $1", [funcionario_id]
        );
        const tipo = funcResult.rows[0].tipo;

        //Define a carga horario por tipo
        let cargaMinutos = 440 // 7h20 padrão mensalista
        if (tipo === "horista" || tipo === "Horista Noturno"){
            cargaMinutos = 480 // 8h padrão horista
        }

        //Calcula os minutos de cada turno
        let totalMinutos = 0;
        if(!evento){
            totalMinutos += calcularTurno(e1, s1);
            totalMinutos += calcularMinutos(e2, s2);
            totalMinutos += calcularMinutos(e3, s3);
        }

        // Calcula extras e negativas
        let extrasMinutos = 0;
        let negativosMinutos = 0;

        if(!evento && totalMinutos > 0){
            if(totalMinutos > cargaMinutos){
                extrasMinutos = totalMinutos - cargaMinutos
            } else {
                negativosMinutos = cargaMinutos - totalMinutos
            }
        }

        // Converte para formato HH:MM
        const total = totalMinuto > 0 ? minutosParaHorario(totalMinutos) : null;
        const extras = extrasMinutos > 0 ? "+" + minutosParaHorario(extrasMinutos) : "00:00";
        const negativos = negativosMinutos > 0 ? "-" + minutosParaHorario(negativosMinutos) : "00:00";

        const resultado = await pool.query(`
            INSERT INTO registros_ponto (funcionario_id, data, e1, s1, e2, s2, e3, s3, evento)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            ON CONFLICT (funcionario_id, data) 
            DO UPDATE SET e1 = $3, s1 = $4, e2 = $5, s2 = $6, e3 = $7, s3 = $8, evento = $9
            RETURNING *`, [funcionario_id, data, e1, s1, e2, s2, e3, s3, evento]
        )
        res.status (201).json(resultado.rows[0]);
    } 
    catch (erro){
        res.status(500).json ({erro: erro.message});
    }
})

//Inicia o servidor na porta 3000
    app.listen(3000, function(){
        console.log("Servidor rodando na porta 3000")
    })


    
//Para rodar o servidor, no terminal do VS Code digite:
// node backend/server.js