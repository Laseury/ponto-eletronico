const API = "http://localhost:3000";

function iniciar() {
    const params = new URLSearchParams(window.location.search);
    const id     = params.get("id");
    if (!id) { window.location.href = "relatorio-gestor.html"; return; }
    
    const mes = sessionStorage.getItem("dash_mes") || (new Date().getMonth() + 1);
    const ano = sessionStorage.getItem("dash_ano") || (new Date().getFullYear());

    carregarFuncionario(id, mes, ano);
}

function carregarFuncionario(id, mes, ano) {
    fetch(`${API}/funcionarios/${id}`)
        .then(r => r.json())
        .then(f => {
            document.getElementById("toolbar-titulo").textContent = f.nome;
            document.getElementById("toolbar-subtitulo").textContent = `${f.tipo} • Período: ${mes}/${ano}`;
            
            // Carrega os indicadores do relatório para este funcionário
            carregarIndicadores(id, mes, ano);
            carregarRegistros(id, mes, ano);
        });
}

function carregarIndicadores(id, mes, ano) {
    fetch(`${API}/relatorio/${mes}/${ano}`)
        .then(r => r.json())
        .then(dados => {
            const func = dados.find(d => d.id == id);
            if (func) {
                const elSaldo  = document.getElementById("card-saldo");
                const elExtras = document.getElementById("card-extras");
                const elFaltas = document.getElementById("card-faltas");

                elSaldo.textContent  = func.saldo_mes;
                elExtras.textContent = func.total_extras;
                elFaltas.textContent = func.faltas;

                // Cores dinâmicas para o saldo
                if (func.saldo_mes.startsWith("-")) elSaldo.className = "card-valor vermelho";
                else if (func.saldo_mes !== "00:00") elSaldo.className = "card-valor verde";
            }
        });
}

function carregarRegistros(id, mes, ano) {
    const container = document.getElementById("tabela-registros");
    container.innerHTML = `<p style="color:#5a6070;font-size:13px;padding:20px">Carregando espelho de ponto...</p>`;

    fetch(`${API}/registros/${id}?mes=${mes}&ano=${ano}`)
        .then(r => r.json())
        .then(registros => renderizarRegistros(registros));
}

function renderizarRegistros(registros) {
    const container = document.getElementById("tabela-registros");

    if (registros.length === 0) {
        container.innerHTML = `<p style="color:#5a6070;font-size:13px;padding:20px">Nenhum registro encontrado para este período.</p>`;
        return;
    }

    function fmt(v) { return v || "—"; }

    let html = `
        <table class="tabela">
            <thead><tr>
                <th>Data</th><th style="text-align:center">E1</th><th style="text-align:center">S1</th><th style="text-align:center">E2</th><th style="text-align:center">S2</th>
                <th style="text-align:center">E3</th><th style="text-align:center">S3</th><th>Evento</th><th style="text-align:center">Total</th>
                <th style="text-align:center">Extras</th><th style="text-align:center">Negativos</th><th style="text-align:center">Noturno</th>
            </tr></thead>
            <tbody>`;

    registros.forEach(function (r) {
        const data = new Date(r.data).toLocaleDateString("pt-BR", { timeZone: "UTC" });
        html += `
            <tr>
                <td style="font-weight:600">${data}</td>
                <td style="text-align:center">${fmt(r.e1)}</td><td style="text-align:center">${fmt(r.s1)}</td>
                <td style="text-align:center">${fmt(r.e2)}</td><td style="text-align:center">${fmt(r.s2)}</td>
                <td style="text-align:center">${fmt(r.e3)}</td><td style="text-align:center">${fmt(r.s3)}</td>
                <td style="font-size:11px; color:var(--ouro)">${fmt(r.evento)}</td>
                <td style="text-align:center; font-weight:500">${fmt(r.total)}</td>
                <td style="text-align:center" class="${r.extras && r.extras !== '00:00' ? 'verde' : ''}">${fmt(r.extras)}</td>
                <td style="text-align:center" class="${r.negativos && r.negativos !== '00:00' ? 'vermelho' : ''}">${fmt(r.negativos)}</td>
                <td style="text-align:center" class="${r.noturno && r.noturno !== '00:00' ? 'noturno-badge' : ''}">${fmt(r.noturno)}</td>
            </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

iniciar();