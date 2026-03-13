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

    //Buscar registros de ponto
    fetch("http://localhost:3000/registros/" + id)
    .then(function (resposta){
        return resposta.json();
    })
    .then(function (registros){
        renderizarRegistros(registros);
    })
}

function renderizarRegistros(registros) {
    let container = document.getElementById("tabela-registros");

    if(registros.length === 0){
        container.innerHTML = `<p style="color:#5a6070; font-size:13px; padding: 20px">Nenhum registro encontrado</p>`
        return;
    }

    let html = `<table class="tabela">
    <thead>
        <tr>
            <th>Data</th>
            <th>E1</th>
            <th>S1</th>
            <th>E2</th>
            <th>S2</th>
            <th>E3</th>
            <th>S3</th>
            <th>Total</th>
            <th>Noturno</th>
            <th>Extras</th>
            <th>Negativos</th>
            <th>Evento</th>
        </tr>
    </thead>
    <tbody>`

    registros.forEach(function(r){
        //Formatar a data
        let data = new Date(r.data);
        let dataFormatada = data.toLocaleDateString("pt-BR", {timeZone: "UTC"});

        // Formata horário removendo os segundos
        function fmt(h) {return h ? h.substring(0,5) : "-"}

        // Cor do evento
        let eventoHtml = "-"
        if(r.evento){
            let cor = r.evento === "Falta" ? "vermelho":
            r.evento === "DSR" ? "":
            r.evento === "Folga" ? "verde" : ""
            eventoHtml = `<span class="${cor}">${r.evento}</span>`
        }

        html += `<tr>
            <td>${dataFormatada}</td>
            <td>${fmt(r.e1)}</td>
            <td>${fmt(r.s1)}</td>
            <td>${fmt(r.e2)}</td>
            <td>${fmt(r.s2)}</td>
            <td>${fmt(r.e3)}</td>
            <td>${fmt(r.s3)}</td>
            <td>${r.total || "-"}</td>
            <td class="${r.noturno && r.noturno !== '00:00' ? 'noturno-badge' : ''}">${r.noturno || '—'}</td>
            <td class="verde">${r.extras || "-"}</td>
            <td class="vermelho">${r.negativos || "-"}</td>
            <td>${eventoHtml}</td>
        </tr>`
    })

    html += `</tbody></table>`
    container.innerHTML = html
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

carregarFuncionario();