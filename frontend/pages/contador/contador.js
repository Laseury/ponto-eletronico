const API = "http://localhost:3000";

function mesAtual() { return new Date().getMonth() + 1; }
function anoAtual() { return new Date().getFullYear(); }

function carregarContador() {
    const mes = parseInt(document.getElementById("sel-mes").value || mesAtual());
    const ano = parseInt(document.getElementById("sel-ano").value || anoAtual());
    
    // Atualiza cards
    fetch(`${API}/resumo/${mes}/${ano}`)
        .then(r => r.json())
        .then(d => {
            document.getElementById("card-funcionarios").textContent = d.total_funcionarios;
            document.getElementById("card-extras").textContent = d.total_extras;
            document.getElementById("card-faltas").textContent = d.total_faltas;
        });

    // Busca relatório resumido
    fetch(`${API}/relatorio/${mes}/${ano}`)
        .then(r => r.json())
        .then(dados => {
            renderizarResumoContador(dados);
        });
}

function renderizarResumoContador(dados) {
    const container = document.getElementById("tabela-relatorio");
    
    if (dados.length === 0) {
        container.innerHTML = `<p style="color:#5a6070;padding:20px">Nenhum dado encontrado para este período.</p>`;
        return;
    }

    let html = `
        <table class="tabela">
            <thead>
                <tr>
                    <th>Funcionário</th>
                    <th>Tipo</th>
                    <th>Normais</th>
                    <th>Extras (+)</th>
                    <th>Negativas (-)</th>
                    <th>Noturno</th>
                    <th>Faltas</th>
                    <th>Saldo Final</th>
                </tr>
            </thead>
            <tbody>
    `;

    dados.forEach(f => {
        const corSaldo = f.saldo_mes.startsWith("-") ? "vermelho" : (f.saldo_mes !== "00:00" ? "verde" : "");
        const corFaltas = f.faltas > 0 ? "vermelho" : "";

        html += `
            <tr>
                <td style="font-weight:600">${f.nome}</td>
                <td style="font-size:11px;color:#5a6070">${f.tipo}</td>
                <td>${f.total_diurno || "00:00"}</td>
                <td class="verde">${f.total_extras !== "00:00" ? "+" + f.total_extras : "—"}</td>
                <td class="vermelho">${f.total_negativos !== "00:00" ? "-" + f.total_negativos : "—"}</td>
                <td>${f.total_noturno || "00:00"}</td>
                <td class="${corFaltas}">${f.faltas || "0"}</td>
                <td class="${corSaldo}" style="font-weight:700">${f.saldo_mes}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function mudarFiltro() {
    carregarContador();
}

function sair() {
    sessionStorage.clear();
    window.location.href = "../../index.html";
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    const selAno = document.getElementById("sel-ano");
    if (selAno) {
        const ano = new Date().getFullYear();
        for (let i = ano - 2; i <= ano + 1; i++) {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = i;
            if (i === ano) opt.selected = true;
            selAno.appendChild(opt);
        }
    }
    
    const selMes = document.getElementById("sel-mes");
    if (selMes) selMes.value = mesAtual();

    carregarContador();
});
