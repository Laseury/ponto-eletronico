function cadastrarFuncionario(){
    let nome = document.getElementById("campo-nome").value;
    let tipo = document.getElementById("campo-tipo").value;
    let mensagem = document.getElementById("mensagem");

    if (!nome || !tipo){
        mensagem.className = "Mensagem erro";
        mensagem.textContent = "Por favor, preencha todos os campos.";
        return;
    }

    fetch("http://localhost:3000/funcionarios", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({nome:nome, tipo:tipo})
    }).then(function(resposta){
        return resposta.json();
    })
    .then(function(dados){
        mensagem.className = "mensagem-sucesso";
        mensagem.textContent = "Funcionário " + dados.nome + " cadastrado com sucesso!";
        document.getElementById("campo-nome").value = "";
        document.getElementById("campo-tipo").value = "";
    })
}