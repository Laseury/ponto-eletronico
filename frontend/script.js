function fazerLogin() {
    let usuario = document.getElementById("campo-usuario").value;
    let senha = document.getElementById("campo-senha").value;

    if (usuario === "admin" && senha === "1234") {
        window.location.href = "dashboard.html";
    } else {
        alert("Usuario ou Senha Incorretos");
    }
}

function renderizarFuncionarios(funcionarios) {
    let container = document.getElementById("grid-funcionarios");
    let html = "";

    funcionarios.forEach(function (f) {
        let corExtras = f.extras.startsWith("+") ? "verde" : "";
        let corFaltas = f.faltas > 0 ? "vermelho" : "";

        html += `
            <div class="card-funcionario" onclick="window.location.href='funcionario.html?id=${f.id}'">
                <p class="card-nome">${f.nome}</p>
                <p class="card-tipo">${f.tipo}</p>
                <div class="card-metricas">
                    <div class="metrica">
                        <p class="metrica-label">Extras</p>
                        <p class="metrica-valor ${corExtras}">${f.extras}</p>
                    </div>
                    <div class="metrica">
                        <p class="metrica-label">Faltas</p>
                        <p class="metrica-valor ${corFaltas}">${f.faltas}</p>
                    </div>
                </div>
            </div>`
    })
    container.innerHTML = html;
}

function carregarDashboard(){
    fetch("http://localhost:3000/funcionarios").then(function(resposta){
        return resposta.json();
    })
    .then(function(dados){
        renderizarFuncionarios(dados);
    })
}




