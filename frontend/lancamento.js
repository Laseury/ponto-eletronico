// Carrega a lista de funcionários no select
function carregarFuncionarios() {
    fetch("http://localhost:3000/funcionarios").then(function(resposta) {
        return resposta.json();
    }).then(function(dados){
        let select = document.getElementById("campo-funcionario")
        dados.forEach(function(f){
            select.innerHTML += `<option value="${f.id}">${f.nome}</option>`
        })
    })}

    function lancarPonto(){
        let funcionario_id = document.getElementById("campo-funcionario").value
        let data = document.getElementById("campo-data").value
        let evento = document.getElementById("campo-evento").value
        let e1 = document.getElementById("e1").value || null
        let s1 = document.getElementById("s1").value || null
        let e2 = document.getElementById("e2").value || null
        let s2 = document.getElementById("s2").value || null
        let e3 = document.getElementById("e3").value || null
        let s3 = document.getElementById("s3").value || null    
        let mensagem = document.getElementById("mensagem")

        if (!funcionario_id || !data) {
            mensagem.className = "mensagem-erro"
            mensagem.textContent = "Selecione o funcionário e a data"
            return
        }

        fetch("http://localhost:3000/registros", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                funcionario_id, data, e1,s1,e2,s2,e3,s3, evento
            })
        })
        .then(function(resposta){
            return resposta.json()
        })
        .then(function(dados){
            mensagem.className="mensagem-sucesso"
            mensagem.textContent = "Registro salvo com sucesso!"
        })


    }

    carregarFuncionarios();