const API = "http://localhost:3000";

function iniciar() {
    const params = new URLSearchParams(window.location.search);
    const id     = params.get("id");
    if (!id) { window.location.href = "relatorio-gestor.html"; return; }
    carregarFuncionario(id);
}

function carregarFuncionario(id) {
    fetch(`${API}/funcionarios/${id}`)
        .then(r => r.json())
        .then(f => {
            document.getElementById("topbar-titulo").textContent = f.nome;
            document.getElementById("toolbar-titulo").textContent = `Registros — ${f.nome}`;
            carregarRegistros(id);
        });
}

function carregarRegistros(id) {
    const container = document.getElementById("tabela-registros");
    container.innerHTML = `<p style="color:#5a6070;font-size:13px;padding:20px">Carregando...</p>`;

    fetch(`${API}/registros/${id}`)
        .then(r => r.json())
        .then(registros => renderizarRegistros(registros));
}

function renderizarRegistros(registros) {
    const container = document.getElementById("tabela-registros");

    if (registros.length === 0) {
        container.innerHTML = `<p style="color:#5a6070;font-size:13px;padding:20px">Nenhum registro encontrado.</p>`;
        return;
    }

    function fmt(v) { return v || "—"; }

    let html = `
        <table class="tabela">
            <thead><tr>
                <th>Data</th><th>E1</th><th>S1</th><th>E2</th><th>S2</th>
                <th>E3</th><th>S3</th><th>Evento</th><th>Total</th>
                <th>Extras</th><th>Negativos</th><th>Noturno</th>
            </tr></thead>
            <tbody>`;

    registros.forEach(function (r) {
        const data = new Date(r.data).toLocaleDateString("pt-BR", { timeZone: "UTC" });
        html += `
            <tr>
                <td>${data}</td>
                <td>${fmt(r.e1)}</td><td>${fmt(r.s1)}</td>
                <td>${fmt(r.e2)}</td><td>${fmt(r.s2)}</td>
                <td>${fmt(r.e3)}</td><td>${fmt(r.s3)}</td>
                <td>${fmt(r.evento)}</td>
                <td>${fmt(r.total)}</td>
                <td class="${r.extras && r.extras !== '00:00' ? 'verde' : ''}">${fmt(r.extras)}</td>
                <td class="${r.negativos && r.negativos !== '00:00' ? 'vermelho' : ''}">${fmt(r.negativos)}</td>
                <td class="${r.noturno && r.noturno !== '00:00' ? 'noturno-badge' : ''}">${fmt(r.noturno)}</td>
            </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}