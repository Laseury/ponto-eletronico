function carregarFuncionario() {
    let parametros = new URLSearchParams(window.location.search);
    let id = parametros.get("id");

    if (id === null) {
        window.location.href = "dashboard.html";
        return;
    }

    // Busca nome e tipo do funcionário
    fetch("http://localhost:3000/funcionarios/" + id)
        .then(function(resposta) { return resposta.json(); })
        .then(function(f) {
            document.getElementById("topbar-nome").textContent = f.nome;
            document.getElementById("info-tipo").textContent   = f.tipo;
        });

    // Busca registros e calcula totais
    fetch("http://localhost:3000/registros/" + id)
        .then(function(resposta) { return resposta.json(); })
        .then(function(registros) {

            let totalExtrasMin     = 0;
            let totalNegativosMin  = 0;
            let totalFaltas        = 0;
            let totalTrabalhadoMin = 0;
            let totalNoturnoMin    = 0;
            let totalNoturnoPuroMin = 0;

            registros.forEach(function(r) {
                if (r.extras && r.extras.startsWith("+")) {
                    const p = r.extras.replace("+", "").split(":");
                    totalExtrasMin += parseInt(p[0]) * 60 + parseInt(p[1]);
                }
                if (r.negativos && r.negativos.startsWith("-")) {
                    const p = r.negativos.replace("-", "").split(":");
                    totalNegativosMin += parseInt(p[0]) * 60 + parseInt(p[1]);
                }
                if (r.evento === "Falta") totalFaltas++;
                if (r.total) {
                    const p = r.total.split(":");
                    totalTrabalhadoMin += parseInt(p[0]) * 60 + parseInt(p[1]);
                }
                // Noturno já vem calculado do banco (turno inteiro quando começa noturno)
if (r.noturno && r.noturno !== "00:00") {
    const p = r.noturno.split(":");
    totalNoturnoMin += parseInt(p[0]) * 60 + parseInt(p[1]);
}

// ✅ NOVO: noturno puro = só minutos entre 22:00 e 05:00
// É a base correta para aplicar o fator legal
if (r.e1 && r.s1) {
    totalNoturnoPuroMin += calcularNoturnoPuro(r.e1, r.s1);
}
if (r.e2 && r.s2) {
    totalNoturnoPuroMin += calcularNoturnoPuro(r.e2, r.s2);
}
            });

            const totalDiurnoMin     = Math.max(0, totalTrabalhadoMin - totalNoturnoMin);
            const noturnoComFatorMin  = Math.round(totalNoturnoPuroMin * (60 / 52));
            const saldoMin           = totalExtrasMin - totalNegativosMin;

            function fmtMin(min) {
                if (min <= 0) return "00:00";
                return String(Math.floor(min / 60)).padStart(2, "0") + ":" +
                       String(min % 60).padStart(2, "0");
            }

            // ── Cards principais ───────────────────────────────────
            const elSaldo  = document.getElementById("info-saldo");
            const elFaltas = document.getElementById("info-faltas");

            if (elSaldo) {
                if (saldoMin === 0) {
                    elSaldo.textContent = "00:00";
                } else if (saldoMin > 0) {
                    elSaldo.textContent = "+" + fmtMin(saldoMin);
                    elSaldo.classList.add("verde");
                } else {
                    elSaldo.textContent = "-" + fmtMin(Math.abs(saldoMin));
                    elSaldo.classList.add("vermelho");
                }
            }
            if (elFaltas) {
                elFaltas.textContent = totalFaltas;
                if (totalFaltas > 0) elFaltas.classList.add("vermelho");
            }

            // ── Cards mini no rodapé ───────────────────────────────
            const elTotal    = document.getElementById("info-total");
            const elExtras   = document.getElementById("info-extras");
            const elNegativo = document.getElementById("info-negativos");
           // Total normal = total trabalhado menos as horas extras
            // Igual à planilha: separa horas normais de horas extras
            const totalNormalMin = totalTrabalhadoMin - totalExtrasMin;
            if (elTotal)    elTotal.textContent    = fmtMin(totalNormalMin);
            if (elExtras)   elExtras.textContent   = "+" + fmtMin(totalExtrasMin);
            if (elNegativo) elNegativo.textContent = "-" + fmtMin(totalNegativosMin);

            // ── Bloco noturno ──────────────────────────────────────
            // Aguarda o fetch do funcionário terminar para ler o tipo
            setTimeout(function() {
                const tipo      = document.getElementById("info-tipo").textContent;
                const ehNoturno = tipo.includes("Noturno") || totalNoturnoMin > 0;
                const bloco     = document.getElementById("bloco-noturno");

                if (bloco) {
                    if (ehNoturno) {
                        bloco.style.display = "block";
                        document.getElementById("noturno-horas-noturnas").textContent = fmtMin(totalNoturnoMin);
                        document.getElementById("noturno-horas-diurnas").textContent  = fmtMin(totalDiurnoMin);
                        document.getElementById("noturno-com-fator").textContent      = fmtMin(noturnoComFatorMin);
                        const elPagDiurnas  = document.getElementById("pag-diurnas");
                        const elPagNoturnas = document.getElementById("pag-noturnas");
                        if (elPagDiurnas)  elPagDiurnas.textContent  = fmtMin(totalDiurnoMin);
                        if (elPagNoturnas) elPagNoturnas.textContent = fmtMin(noturnoComFatorMin);
                    } else {
                        bloco.style.display = "none";
                    }
                }
            }, 100);

            renderizarRegistros(registros);
        });

        
}

// Conta só os minutos que realmente caem entre 22:00 e 05:00
// É essa a base para o fator legal ×1,142857
function calcularNoturnoPuro(entrada, saida) {
    function min(h) {
        const p = h.split(":"); return parseInt(p[0]) * 60 + parseInt(p[1]);
    }
    let e = min(entrada);
    let s = min(saida);
    if (s < e) s += 1440;

    const INICIO = 22 * 60;   // 1320
    const FIM    = 29 * 60;   // 1740 (05:00 do dia seguinte)

    // Normaliza entrada: se for madrugada (< 05:00), coloca na linha do tempo noturna
    let eN = e < 5 * 60 ? e + 1440 : e;
    let sN = s < 5 * 60 ? s + 1440 : s;

    const inicio = Math.max(eN, INICIO);
    const fim    = Math.min(sN, FIM);
    return fim > inicio ? fim - inicio : 0;
}

function renderizarRegistros(registros) {
    let container = document.getElementById("tabela-registros");

    if (registros.length === 0) {
        container.innerHTML = `<p style="color:#5a6070;font-size:13px;padding:20px">Nenhum registro encontrado</p>`;
        return;
    }

    const mapa = {};
    registros.forEach(function(r) {
        mapa[r.data.substring(0, 10)] = r;
    });

    const primeiraData = registros[0].data.substring(0, 10);
    const ano          = parseInt(primeiraData.substring(0, 4));
    const mes          = parseInt(primeiraData.substring(5, 7));
    const diasNoMes    = new Date(ano, mes, 0).getDate();

    function fmt(h) { return h ? h.substring(0, 5) : "—"; }

    let html = `
        <table class="tabela">
        <thead>
            <tr>
                <th>Data</th>
                <th>E1</th><th>S1</th>
                <th>E2</th><th>S2</th>
                <th>E3</th><th>S3</th>
                <th>Total</th>
                <th>Noturno</th>
                <th>Extras</th>
                <th>Negativos</th>
                <th>Evento</th>
            </tr>
        </thead>
        <tbody>`;

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const chave         = `${ano}-${String(mes).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;
        const dataFormatada = `${String(dia).padStart(2,"0")}/${String(mes).padStart(2,"0")}/${ano}`;
        const r             = mapa[chave];

        if (r) {
            let eventoHtml = "—";
            if (r.evento) {
                const cor  = r.evento === "Falta" ? "vermelho" : r.evento === "Folga" ? "verde" : "";
                eventoHtml = `<span class="${cor}">${r.evento}</span>`;
            }
            html += `
                <tr>
                    <td>${dataFormatada}</td>
                    <td>${fmt(r.e1)}</td><td>${fmt(r.s1)}</td>
                    <td>${fmt(r.e2)}</td><td>${fmt(r.s2)}</td>
                    <td>${fmt(r.e3)}</td><td>${fmt(r.s3)}</td>
                    <td>${r.total || "—"}</td>
                    <td class="${r.noturno && r.noturno !== "00:00" ? "noturno-badge" : ""}">${fmt(r.noturno)}</td>
                    <td class="verde">${r.extras    || "—"}</td>
                    <td class="vermelho">${r.negativos || "—"}</td>
                    <td>${eventoHtml}</td>
                </tr>`;
        } else {
            html += `
                <tr style="opacity:0.35">
                    <td>${dataFormatada}</td>
                    <td>—</td><td>—</td><td>—</td><td>—</td>
                    <td>—</td><td>—</td><td>—</td><td>—</td>
                    <td>—</td><td>—</td><td>—</td>
                </tr>`;
        }
    }

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function abrirLegenda() {
    document.getElementById("legenda-painel").classList.add("aberto");
    document.getElementById("legenda-overlay").classList.add("aberto");
}

function fecharLegenda() {
    document.getElementById("legenda-painel").classList.remove("aberto");
    document.getElementById("legenda-overlay").classList.remove("aberto");
}

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") fecharLegenda();
});

carregarFuncionario();