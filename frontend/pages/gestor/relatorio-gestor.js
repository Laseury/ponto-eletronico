const API = "http://localhost:3000";

const MESES = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

function mesAtual() { return new Date().getMonth() + 1; }
function anoAtual() { return new Date().getFullYear(); }

function iniciar() {
    const mes = parseInt(sessionStorage.getItem("dash_mes") || mesAtual());
    const ano = parseInt(sessionStorage.getItem("dash_ano") || anoAtual());
    document.getElementById("sel-mes").value = mes;
    document.getElementById("sel-ano").value = ano;
    carregarRelatorio(mes, ano);
}

function mudarFiltro() {
    const mes = parseInt(document.getElementById("sel-mes").value);
    const ano = parseInt(document.getElementById("sel-ano").value);
    sessionStorage.setItem("dash_mes", mes);
    sessionStorage.setItem("dash_ano", ano);
    carregarRelatorio(mes, ano);
}

function carregarRelatorio(mes, ano) {
    const label   = `${MESES[mes - 1]} ${ano}`;
    const topbar  = document.getElementById("topbar-titulo");
    const toolbar = document.getElementById("toolbar-titulo");
    if (topbar)  topbar.textContent  = `Relatórios — ${label}`;
    if (toolbar) toolbar.textContent = `Resumo Consolidado — ${label}`;

    const container = document.getElementById("tabela-relatorio");
    container.innerHTML = `<p style="color:#5a6070;font-size:13px;padding:20px">Carregando dados da equipe...</p>`;

    // Removemos a dependência do valor_hora para o perfil gestor
    fetch(`${API}/relatorio/${mes}/${ano}`)
        .then(r => r.json())
        .then(dados => renderizarRelatorio(dados))
        .catch(() => {
            container.innerHTML = `<p style="color:#e05c5c;font-size:13px;padding:20px">Erro ao carregar o relatório.</p>`;
        });
}

function renderizarRelatorio(dados) {
    const container = document.getElementById("tabela-relatorio");

    if (dados.length === 0) {
        container.innerHTML = `<p style="color:#5a6070;font-size:13px;padding:20px">Nenhum registro encontrado para este período.</p>`;
        return;
    }

    const ciclo = dados[0].ciclo || "";

    let html = `
        <table class="tabela">
            <thead><tr>
                <th>Funcionário</th>
                <th>Tipo</th>
                <th style="text-align:center">Dias Trab.</th>
                <th style="text-align:center">Eventos</th>
                <th style="text-align:center">Faltas</th>
                <th style="text-align:center">Extras</th>
                <th style="text-align:center">Negativos</th>
                <th style="text-align:center">Saldo Mês</th>
                <th style="text-align:center" title="Acumulado do ciclo ${ciclo}">Banco (${ciclo})</th>
                <th style="text-align:center">Noturno</th>
            </tr></thead>
            <tbody>`;

    dados.forEach(function (f) {
        const tipoBadge = f.tipo === "Horista Noturno" ? "badge-noturno"
            : f.tipo === "Horista" ? "badge-horista" : "badge-mensalista";
        const corSaldo = f.saldo_mes.startsWith("+")  ? "verde" : f.saldo_mes  === "00:00" ? "" : "vermelho";
        const corBanco = f.banco_horas.startsWith("+") ? "verde" : f.banco_horas === "00:00" ? "" : "vermelho";

        html += `
            <tr>
                <td class="nome-clicavel" onclick="window.location.href='funcionario-gestor.html?id=${f.id}'">
                    ${f.nome}
                </td>
                <td><span class="func-badge ${tipoBadge}">${f.tipo}</span></td>
                <td style="text-align:center">${f.dias_trabalhados}</td>
                <td style="text-align:center">${f.dias_evento}</td>
                <td style="text-align:center" class="${f.faltas > 0 ? "vermelho" : ""}">${f.faltas}</td>
                <td style="text-align:center" class="verde">${f.total_extras}</td>
                <td style="text-align:center" class="vermelho">${f.total_negativos}</td>
                <td style="text-align:center" class="${corSaldo}" style="font-weight:600">${f.saldo_mes}</td>
                <td style="text-align:center" class="${corBanco}" style="font-weight:600">${f.banco_horas}</td>
                <td style="text-align:center" class="${f.total_noturno !== '00:00' ? 'noturno-badge' : ''}">${f.total_noturno}</td>
            </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

// Exportação simplificada sem valores financeiros
function exportar(formato) {
    const mes = parseInt(document.getElementById("sel-mes").value);
    const ano = parseInt(document.getElementById("sel-ano").value);
    fetch(`${API}/relatorio/${mes}/${ano}`)
        .then(r => r.json())
        .then(dados => {
            if (formato === "csv")  exportarCSV(dados, mes, ano);
            if (formato === "xlsx") exportarXLSX(dados, mes, ano);
        });
}

function montarLinhas(dados) {
    const cabecalho = ["Nome","Tipo","Dias Trabalhados","Faltas","Extras","Negativos","Saldo do Mês","Banco de Horas","Noturno"];
    const linhas = dados.map(f => [f.nome, f.tipo, f.dias_trabalhados, f.faltas, f.total_extras, f.total_negativos, f.saldo_mes, f.banco_horas, f.total_noturno]);
    return [cabecalho, ...linhas];
}

function exportarCSV(dados, mes, ano) {
    const csv  = montarLinhas(dados).map(l => l.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `relatorio_gestao_${mes}_${ano}.csv`;
    a.click();
}

function exportarXLSX(dados, mes, ano) {
    const linhas = montarLinhas(dados);
    let xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Relatorio Gestão ${mes}-${ano}"><Table>`;
    linhas.forEach((linha, i) => {
        xml += `<Row>`;
        linha.forEach(cel => {
            const tipo  = i === 0 || isNaN(cel) ? "String" : "Number";
            const valor = String(cel).replace(/&/g,"&amp;").replace(/</g,"&lt;");
            xml += `<Cell><Data ss:Type="${tipo}">${valor}</Data></Cell>`;
        });
        xml += `</Row>`;
    });
    xml += `</Table></Worksheet></Workbook>`;
    const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `relatorio_gestao_${mes}_${ano}.xls`;
    a.click();
}

function sair() {
    sessionStorage.clear();
    window.location.href = "../../index.html";
}

iniciar();