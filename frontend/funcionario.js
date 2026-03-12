function carregarFuncionario() {
    let parametros = new URLSearchParams(window.location.search);
    let id = parametros.get("id");

    if (id === null) {
        window.location.href = "dashboard.html";
        return;
    }

    fetch("http://localhost:3000/funcionarios/" + id).then(function (resposta) {
        return resposta.json();
    }).then(function (f) {
        document.getElementById("topbar-nome").textContent = f.nome;
        document.getElementById("info-tipo").textContent = f.tipo;
        document.getElementById("info-extras").textContent = f.extras;
        document.getElementById("info-faltas").textContent = f.faltas;

        if (f.faltas > 0) {
            document.getElementById("info-faltas").classList.add("vermelho");
        }
    })
    //let f = funcionarios[id];


}

carregarFuncionario()