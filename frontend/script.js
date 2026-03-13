const API = "http://localhost:3000";

// Nomes dos meses para montar os títulos dinamicamente
const MESES = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

function mesAtual() { return new Date().getMonth() + 1; }
function anoAtual() { return new Date().getFullYear(); }

// Usuários fixos — troque as senhas para algo seguro
const USUARIOS = {
    "admin":    { senha: "1234",   perfil: "admin"    },
    "gestor":   { senha: "gestor", perfil: "gestor"   },
    "contador": { senha: "cont",   perfil: "contador" }
};

function fazerLogin() {
    const usuario = document.getElementById("campo-usuario").value.trim();
    const senha   = document.getElementById("campo-senha").value;

    const encontrado = USUARIOS[usuario];

    if (encontrado && encontrado.senha === senha) {
        // Salva o perfil na sessão para as outras páginas verificarem
        sessionStorage.setItem("perfil",  encontrado.perfil);
        sessionStorage.setItem("usuario", usuario);

        // Redireciona conforme o perfil
        if (encontrado.perfil === "admin")    window.location.href = "dashboard.html";
        if (encontrado.perfil === "gestor")   window.location.href = "gestor.html";
        if (encontrado.perfil === "contador") window.location.href = "contador.html";
        
    } else {
        alert("Usuário ou senha incorretos.");
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

// ─── Dashboard ────────────────────────────────────────────────────
function carregarDashboard() {
    // Lê o mês/ano salvo na sessão, ou usa o mês atual como padrão
    const mes = parseInt(sessionStorage.getItem("dash_mes") || mesAtual());
    const ano = parseInt(sessionStorage.getItem("dash_ano") || anoAtual());

    // Sincroniza os seletores com o valor atual
    const selMes = document.getElementById("sel-mes");
    const selAno = document.getElementById("sel-ano");
    if (selMes) selMes.value = mes;
    if (selAno) selAno.value = ano;

    // Atualiza o título da topbar
    const titulo = document.getElementById("topbar-titulo");
    if (titulo) titulo.textContent = `Dashboard — ${MESES[mes - 1]} ${ano}`;

    // Busca os dados dos cards (nova Rota 7)
    fetch(`${API}/resumo/${mes}/${ano}`)
        .then(r => r.json())
       .then(dados => {
    setText("card-funcionarios",  dados.total_funcionarios);
    setText("card-lancados-hoje", dados.lancados_hoje);
    setText("card-extras",        dados.total_extras);
    setText("card-faltas",        dados.total_faltas);

    colorir("card-extras", dados.total_extras    !== "00:00", "verde");
    colorir("card-faltas", dados.total_faltas     > 0,        "vermelho");
});

    // Busca a lista de funcionários com métricas do mês (Rota 6 existente)
    fetch(`${API}/relatorio/${mes}/${ano}`)
        .then(r => r.json())
        .then(dados => renderizarFuncionarios(dados));
}

// Chamada quando o usuário troca o mês/ano nos seletores
function mudarMes() {
    const mes = document.getElementById("sel-mes").value;
    const ano = document.getElementById("sel-ano").value;
    // Salva na sessão para que o relatório use o mesmo período
    sessionStorage.setItem("dash_mes", mes);
    sessionStorage.setItem("dash_ano", ano);
    carregarDashboard();
}

// Helpers para manipular o DOM
function setText(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
}

function colorir(id, condicao, classe) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("verde", "vermelho");
    if (condicao) el.classList.add(classe);
}

function renderizarFuncionarios(funcionarios) {
    let container = document.getElementById("grid-funcionarios");
    if (!container) return;

    if (funcionarios.length === 0) {
        container.innerHTML = `<p style="color:#5a6070;font-size:13px">Nenhum funcionário cadastrado.</p>`;
        return;
    }

    let html = "";
    funcionarios.forEach(function (f) {
        let corExtras = f.total_extras && f.total_extras !== "00:00" ? "verde"    : "";
        let corFaltas = f.faltas > 0                                 ? "vermelho" : "";

        html += `
            <div class="card-funcionario" onclick="window.location.href='funcionario.html?id=${f.id}'">
                <p class="card-nome">${f.nome}</p>
                <p class="card-tipo">${f.tipo}</p>
                <div class="card-metricas">
                    <div class="metrica">
                        <p class="metrica-label">Extras</p>
                        <p class="metrica-valor ${corExtras}">${f.total_extras || "00:00"}</p>
                    </div>
                    <div class="metrica">
                        <p class="metrica-label">Faltas</p>
                        <p class="metrica-valor ${corFaltas}">${f.faltas}</p>
                    </div>
                    <div class="metrica">
                        <p class="metrica-label">Dias</p>
                        <p class="metrica-valor">${f.dias_trabalhados}</p>
                    </div>
                </div>
            </div>`;
    });
    container.innerHTML = html;
}




