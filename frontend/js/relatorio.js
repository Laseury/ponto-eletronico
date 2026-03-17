const API = "http://localhost:3000";

const MESES = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

function mesAtual() { return new Date().getMonth() + 1; }
function anoAtual() { return new Date().getFullYear(); 
}

function exportar(formato) {
    const mes       = parseInt(document.getElementById("sel-mes").value);
    const ano       = parseInt(document.getElementById("sel-ano").value);
    const valorHora = document.getElementById("inp-valor-hora").value || 0;

    // Reutiliza os dados já carregados — busca de novo para garantir sincronia
    fetch(`${API}/relatorio/${mes}/${ano}?valor_hora=${valorHora}`)
        .then(r => r.json())
        .then(dados => {
            if (formato === "csv") exportarCSV(dados, mes, ano);
            if (formato === "xlsx") exportarXLSX(dados, mes, ano);
        });
}

function montarLinhas(dados) {
    // Cabeçalho
    const cabecalho = [
        "Nome", "Tipo", "Dias Trabalhados", "Faltas",
        "Extras", "Negativos", "Saldo do Mês",
        "Banco de Horas", "Noturno", "Valor Noturno (R$)"
    ];

    // Linhas de dados
    const linhas = dados.map(f => [
        f.nome,
        f.tipo,
        f.dias_trabalhados,
        f.faltas,
        f.total_extras,
        f.total_negativos,
        f.saldo_mes,
        f.banco_horas,
        f.total_noturno,
        f.valor_noturno
    ]);

    return [cabecalho, ...linhas];
}

function exportarCSV(dados, mes, ano) {
    const linhas = montarLinhas(dados);
    const csv    = linhas.map(l => l.join(";")).join("\n");

    // Adiciona BOM para o Excel abrir com acentos corretamente
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url  = URL.createObjectURL(blob);

    const a    = document.createElement("a");
    a.href     = url;
    a.download = `folha_${mes}_${ano}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportarXLSX(dados, mes, ano) {
    const linhas = montarLinhas(dados);

    // Monta o XML do Excel manualmente (sem biblioteca externa)
    let xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Folha ${mes}-${ano}">
    <Table>`;

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

    const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url  = URL.createObjectURL(blob);

    const a    = document.createElement("a");
    a.href     = url;
    a.download = `folha_${mes}_${ano}.xls`;
    a.click();
    URL.revokeObjectURL(url);
}

function iniciar() {
    // Usa o mesmo mês/ano que o dashboard estava mostrando
    const mes = parseInt(sessionStorage.getItem("dash_mes") || mesAtual());
    const ano = parseInt(sessionStorage.getItem("dash_ano") || anoAtual());

    document.getElementById("sel-mes").value = mes;
    document.getElementById("sel-ano").value = ano;

    carregarRelatorio(mes, ano);
}

// Chamado quando o usuário troca o filtro
function mudarFiltro() {
    const mes = parseInt(document.getElementById("sel-mes").value);
    const ano = parseInt(document.getElementById("sel-ano").value);
    sessionStorage.setItem("dash_mes", mes);
    sessionStorage.setItem("dash_ano", ano);
    carregarRelatorio(mes, ano);
}

function carregarRelatorio(mes, ano) {
    const label = `${MESES[mes - 1]} ${ano}`;

    // Atualiza os dois títulos da página
    const topbar  = document.getElementById("topbar-titulo");
    const toolbar = document.getElementById("toolbar-titulo");
    if (topbar)  topbar.textContent  = `Relatório Mensal — ${label}`;
    if (toolbar) toolbar.textContent = `Resumo — ${label}`;

    const container = document.getElementById("tabela-relatorio");
    container.innerHTML = `<p style="color:#5a6070;font-size:13px;padding:20px">Carregando...</p>`;

const valorHora = document.getElementById("inp-valor-hora").value || 0;
fetch(`${API}/relatorio/${mes}/${ano}?valor_hora=${valorHora}`)
        .then(function (resposta) { return resposta.json(); })
        .then(function (dados)    { renderizarRelatorio(dados); })
        .catch(function () {
            container.innerHTML = `<p style="color:#e05c5c;font-size:13px;padding:20px">Erro ao carregar o relatório.</p>`;
        });
}

function renderizarRelatorio(dados) {
    const container = document.getElementById("tabela-relatorio");

    if (dados.length === 0) {
        container.innerHTML = `<p style="color:#5a6070;font-size:13px;padding:20px">Nenhum registro encontrado.</p>`;
        return;
    }

    // Pega o ciclo do primeiro item — todos terão o mesmo pois depende só do mês/ano
    const ciclo = dados[0].ciclo || "";

    let html = `
        <table class="tabela">
            <thead>
                <tr>
                    <th>Funcionário</th>
                    <th>Tipo</th>
                    <th>Dias Trab.</th>
                    <th>Eventos</th>
                    <th>Faltas</th>
                    <th>Extras</th>
                    <th>Negativos</th>
                    <th>Saldo do Mês</th>
                    <th title="Acumulado do ciclo ${ciclo}">Banco (${ciclo})</th>
                    <th>Noturno</th>
<th>Valor Noturno</th>
                </tr>
            </thead>
            <tbody>`;

    dados.forEach(function (f) {
        const tipoBadge = f.tipo === "Horista Noturno" ? "badge-noturno"
            : f.tipo === "Horista" ? "badge-horista"
            : "badge-mensalista";

        // Cor baseada no sinal: + verde, - vermelho, neutro sem cor
        const corSaldo = f.saldo_mes.startsWith("+")  ? "verde" : f.saldo_mes  === "00:00" ? "" : "vermelho";
        const corBanco = f.banco_horas.startsWith("+") ? "verde" : f.banco_horas === "00:00" ? "" : "vermelho";

        html += `
            <tr>
                <!-- Nome com cursor pointer e classe para hover dourado -->
                <td class="nome-clicavel" onclick="window.location.href='funcionario.html?id=${f.id}'">
                    ${f.nome}
                </td>
                <td><span class="func-badge ${tipoBadge}">${f.tipo}</span></td>
                <td>${f.dias_trabalhados}</td>
                <td>${f.dias_evento}</td>
                <td class="${f.faltas > 0 ? "vermelho" : ""}">${f.faltas}</td>
                <td class="verde">${f.total_extras}</td>
                <td class="vermelho">${f.total_negativos}</td>
                <td class="${corSaldo}" style="font-weight:600">${f.saldo_mes}</td>
                <td class="${corBanco}" style="font-weight:600">${f.banco_horas}</td>
                <td class="${f.total_noturno !== '00:00' ? 'noturno-badge' : ''}">${f.total_noturno}</td>
<td class="${parseFloat(f.valor_noturno) > 0 ? 'verde' : ''}">${parseFloat(f.valor_noturno) > 0 ? 'R$ ' + f.valor_noturno : '—'}</td>
            </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

// ✅ CORRIGIDO: o original não removia o + ou - antes de converter
// Exemplo: "+02:30" virava NaN porque "02" vinha de "+02".split(":")[0]
function horaParaMinutos(horario) {
    if (!horario) return 0;
    const limpo = horario.replace(/^[+\-]/, ""); // remove + ou - do início
    let partes = limpo.split(":");
    return parseInt(partes[0]) * 60 + parseInt(partes[1]);
}

function minutosParaHorario(minutos) {
    if (minutos <= 0) return "00:00";
    let horas = Math.floor(minutos / 60);
    let mins  = minutos % 60;
    return `${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

iniciar();