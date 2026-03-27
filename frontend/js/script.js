const API = "http://localhost:3000";
let todosFuncionarios = [];
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
        if (encontrado.perfil === "admin")    window.location.href = "pages/dashboard.html";
        if (encontrado.perfil === "gestor")   window.location.href = "pages/gestor/gestor.html";
        if (encontrado.perfil === "contador") window.location.href = "pages/contador/contador.html";
        
    } else {
        alert("Usuário ou senha incorretos.");
    }
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
    setText("card-lacuna-funcs", dados.funcs_com_lacuna);
setText("card-lacuna-dias",  dados.total_dias_lacuna);
colorir("card-lacuna-funcs", dados.funcs_com_lacuna > 0, "vermelho");
colorir("card-lacuna-dias",  dados.total_dias_lacuna > 0, "vermelho");

    colorir("card-extras", dados.total_extras    !== "00:00", "verde");
    colorir("card-faltas", dados.total_faltas     > 0,        "vermelho");
});

    // Busca a lista de funcionários com métricas do mês (Rota 6 existente)
    fetch(`${API}/relatorio/${mes}/${ano}`)
        .then(r => r.json())
        .then(dados => {
            todosFuncionarios = dados;
            renderizarFuncionarios(dados);
});
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

function calcularSaldoMin(saldo) {
    if (!saldo || saldo === "00:00") return 0;
    const sinal  = saldo.startsWith("-") ? -1 : 1;
    const limpo  = saldo.replace(/^[+\-]/, "").split(":");
    return sinal * (parseInt(limpo[0]) * 60 + parseInt(limpo[1]));
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
     let corSaldo = f.saldo_mes.startsWith("-") ? "vermelho" : (f.saldo_mes !== "00:00" ? "verde" : "");
    let corFaltas = f.faltas > 0 ? "vermelho" : "";

    // Banco crítico: saldo negativo maior que 5h (300 min)
    const saldoMin = calcularSaldoMin(f.saldo_mes);
    const bancoCritico = saldoMin < -300;

    html += `
        <div class="card-funcionario ${bancoCritico ? "card-critico" : ""}"
             onclick="window.location.href='funcionario.html?id=${f.id}'">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <p class="card-nome">${f.nome}</p>
                ${bancoCritico ? `<span class="badge-critico">⚠ Banco crítico</span>` : ""}
            </div>
            <p class="card-tipo">${f.tipo}</p>
            <div class="card-metricas">
                <div class="metrica">
                    <p class="metrica-label">Saldo</p>
                    <p class="metrica-valor ${corSaldo}">${f.saldo_mes || "00:00"}</p>
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
           <button class="botao-editar" onclick="abrirModalEditar(${f.id}, '${f.nome}', '${f.tipo}'); event.stopPropagation()">Editar</button>
        </div>`;
});
    container.innerHTML = html;
}

function abrirModalEditar(id, nome, tipo) {
    const modal = document.getElementById("modal-editar");
    if (!modal) return;     
     document.getElementById("edit-id").value = id;
     document.getElementById("edit-nome").value = nome;
     document.getElementById("edit-tipo").value = tipo;
     document.getElementById("modal-editar").style.display = "flex";
}

function fecharModal() {
     document.getElementById("modal-editar").style.display = "none";
}

function salvarEdicao() {
    const id = document.getElementById("edit-id").value;
    const nome = document.getElementById("edit-nome").value.trim();
    const tipo = document.getElementById("edit-tipo").value;

    if (!nome) {
        alert("O nome não pode ser vazio.");
        return;
    }   
   fetch(`${API}/funcionarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, tipo })
}).then(r => r.json())
.then(dados => {
   fecharModal();
    carregarDashboard();
})
}

function inativarFuncionario() {

    const id = document.getElementById("edit-id").value;

    if (!confirm("Tem certeza que deseja inativar este funcionário?")) return;

    fetch(`${API}/funcionarios/${id}/ativo`, { method: "PATCH" })
        .then(r => r.json())
        .then(dados => {
            alert(dados.mensagem);
            fecharModal();
            carregarDashboard();
        });


}

function filtrarFuncionarios() {
    const busca  = document.getElementById("busca-nome").value.toLowerCase();
    const tipo   = document.getElementById("filtro-tipo").value;
    const inativos = document.getElementById("filtro-inativos").checked;

    const resultado = todosFuncionarios.filter(function(f) {
        return f.nome.toLowerCase().includes(busca)
        && (tipo === "" || f.tipo === tipo)
        && (inativos || f.ativo === true);
    });

    renderizarFuncionarios(resultado);
}
