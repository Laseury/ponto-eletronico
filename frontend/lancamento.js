// Carrega a lista de funcionários no select
function carregarFuncionarios() {
    fetch("http://localhost:3000/funcionarios").then(function (resposta) {
        return resposta.json();
    }).then(function (dados) {
        let select = document.getElementById("campo-funcionario")
        dados.forEach(function (f) {
            select.innerHTML += `<option value="${f.id}">${f.nome}</option>`
        })
    })
}

function lancarPonto() {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            funcionario_id, data, e1, s1, e2, s2, e3, s3, evento
        })
    })
        .then(function (resposta) {
            return resposta.json()
        })
        // DEPOIS — usa "dados" corretamente e trata o elemento mensagem como DOM
        .then(function (dados) {
            let textoMensagem = "Registro salvo com sucesso!";
            if (dados.noturno && dados.noturno !== "00:00") {
                textoMensagem += ` | 🌙 Noturno: ${dados.noturno}`;
            }
            mensagem.className = "mensagem-sucesso";
            mensagem.textContent = textoMensagem;
        })


}

function abrirLegenda() {
    document.getElementById("legenda-painel").classList.add("aberto");
    document.getElementById("legenda-overlay").classList.add("aberto");
}

function fecharLegenda() {
    document.getElementById("legenda-painel").classList.remove("aberto");
    document.getElementById("legenda-overlay").classList.remove("aberto");
}

// Fecha com ESC também
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") fecharLegenda();
});

carregarFuncionarios();