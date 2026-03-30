function carregarFuncionario() {
  let parametros = new URLSearchParams(window.location.search);
  let id = parametros.get("id");

  if (id === null) {
    window.location.href = "dashboard.html";
    return;
  }

  // Busca nome e tipo do funcionário
  fetch("http://localhost:3000/funcionarios/" + id)
    .then(function (resposta) {
      return resposta.json();
    })
    .then(function (f) {
      document.getElementById("topbar-nome").textContent = f.nome;
      document.getElementById("info-tipo").textContent = f.tipo;
    });

  carregarRegistrosMes(id);
}

function carregarRegistrosMes(id) {
  // Usa o mesmo mês/ano do dashboard
  const mes = parseInt(
    sessionStorage.getItem("dash_mes") || new Date().getMonth() + 1,
  );
  const ano = parseInt(
    sessionStorage.getItem("dash_ano") || new Date().getFullYear(),
  );

  // Sincroniza os seletores
  const selMes = document.getElementById("sel-mes-func");
  const selAno = document.getElementById("sel-ano-func");
  if (selMes) selMes.value = mes;
  if (selAno) selAno.value = ano;

  fetch("http://localhost:3000/registros/" + id + "?mes=" + mes + "&ano=" + ano)
    .then(function (resposta) {
      return resposta.json();
    })
    .then(function (registros) {
      calcularEExibir(registros, mes, ano);
      renderizarRegistros(registros, mes, ano);
    });
}

function mudarMesFuncionario() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const mes = document.getElementById("sel-mes-func").value;
  const ano = document.getElementById("sel-ano-func").value;
  sessionStorage.setItem("dash_mes", mes);
  sessionStorage.setItem("dash_ano", ano);
  carregarRegistrosMes(id);
}

function calcularEExibir(registros, mes, ano) {
  let totalExtrasMin = 0;
  let totalNegativosMin = 0;
  let totalFaltas = 0;
  let totalTrabalhadoMin = 0;
  let totalNoturnoMin = 0;
  let totalNoturnoPuroMin = 0;

  registros.forEach(function (r) {
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
    if (r.noturno && r.noturno !== "00:00") {
      const p = r.noturno.split(":");
      totalNoturnoMin += parseInt(p[0]) * 60 + parseInt(p[1]);
    }
    if (r.e1 && r.s1) totalNoturnoPuroMin += calcularNoturnoPuro(r.e1, r.s1);
    if (r.e2 && r.s2) totalNoturnoPuroMin += calcularNoturnoPuro(r.e2, r.s2);
  });

  const totalDiurnoMin = Math.max(0, totalTrabalhadoMin - totalNoturnoMin);
  const noturnoComFatorMin = Math.round(totalNoturnoPuroMin * (60 / 52));
  const saldoMin = totalExtrasMin - totalNegativosMin;

  function fmtMin(min) {
    if (min <= 0) return "00:00";
    return (
      String(Math.floor(min / 60)).padStart(2, "0") +
      ":" +
      String(min % 60).padStart(2, "0")
    );
  }

  const elSaldo = document.getElementById("info-saldo");
  const elFaltas = document.getElementById("info-faltas");

<<<<<<< HEAD
  const val = (v, zero) => (v === zero || !v ? "" : v);

=======
>>>>>>> 75cfb01766022b8807f71f98690dae191c66f473
  // Limpa classes antes de reaplicar (importante ao trocar mês)
  if (elSaldo) elSaldo.classList.remove("verde", "vermelho");
  if (elFaltas) elFaltas.classList.remove("vermelho");

  if (elSaldo) {
    if (saldoMin === 0) {
<<<<<<< HEAD
      elSaldo.textContent = "";
=======
      elSaldo.textContent = "00:00";
>>>>>>> 75cfb01766022b8807f71f98690dae191c66f473
    } else if (saldoMin > 0) {
      elSaldo.textContent = "+" + fmtMin(saldoMin);
      elSaldo.classList.add("verde");
    } else {
      elSaldo.textContent = "-" + fmtMin(Math.abs(saldoMin));
      elSaldo.classList.add("vermelho");
    }
  }
  if (elFaltas) {
<<<<<<< HEAD
    elFaltas.textContent = val(totalFaltas, 0);
=======
    elFaltas.textContent = totalFaltas;
>>>>>>> 75cfb01766022b8807f71f98690dae191c66f473
    if (totalFaltas > 0) elFaltas.classList.add("vermelho");
  }

  const totalNormalMin = totalTrabalhadoMin - totalExtrasMin;
  const elTotal = document.getElementById("info-total");
  const elExtras = document.getElementById("info-extras");
  const elNegativo = document.getElementById("info-negativos");
<<<<<<< HEAD
  if (elTotal) elTotal.textContent = val(fmtMin(totalNormalMin), "00:00");
  if (elExtras) elExtras.textContent = totalExtrasMin > 0 ? "+" + fmtMin(totalExtrasMin) : "";
  if (elNegativo) elNegativo.textContent = totalNegativosMin > 0 ? "-" + fmtMin(totalNegativosMin) : "";
=======
  if (elTotal) elTotal.textContent = fmtMin(totalNormalMin);
  if (elExtras) elExtras.textContent = "+" + fmtMin(totalExtrasMin);
  if (elNegativo) elNegativo.textContent = "-" + fmtMin(totalNegativosMin);
>>>>>>> 75cfb01766022b8807f71f98690dae191c66f473

  setTimeout(function () {
    const tipo = document.getElementById("info-tipo").textContent;
    const ehNoturno = tipo.includes("Noturno") || totalNoturnoMin > 0;
    const bloco = document.getElementById("bloco-noturno");
    if (bloco) {
      if (ehNoturno) {
        bloco.style.display = "block";
        document.getElementById("noturno-horas-noturnas").textContent =
          fmtMin(totalNoturnoMin);
        document.getElementById("noturno-horas-diurnas").textContent =
          fmtMin(totalDiurnoMin);
        document.getElementById("noturno-com-fator").textContent =
          fmtMin(noturnoComFatorMin);
        const elPagDiurnas = document.getElementById("pag-diurnas");
        const elPagNoturnas = document.getElementById("pag-noturnas");
        if (elPagDiurnas) elPagDiurnas.textContent = fmtMin(totalDiurnoMin);
        if (elPagNoturnas)
          elPagNoturnas.textContent = fmtMin(noturnoComFatorMin);
      } else {
        bloco.style.display = "none";
      }
    }
  }, 100);
}

// Conta só os minutos que realmente caem entre 22:00 e 05:00
// É essa a base para o fator legal ×1,142857
function calcularNoturnoPuro(entrada, saida) {
  function min(h) {
    const p = h.split(":");
    return parseInt(p[0]) * 60 + parseInt(p[1]);
  }
  let e = min(entrada);
  let s = min(saida);
  if (s < e) s += 1440;

  const INICIO = 22 * 60; // 1320
  const FIM = 29 * 60; // 1740 (05:00 do dia seguinte)

  // Normaliza entrada: se for madrugada (< 05:00), coloca na linha do tempo noturna
  let eN = e < 5 * 60 ? e + 1440 : e;
  let sN = s < 5 * 60 ? s + 1440 : s;

  const inicio = Math.max(eN, INICIO);
  const fim = Math.min(sN, FIM);
  return fim > inicio ? fim - inicio : 0;
}

function renderizarRegistros(registros) {
  let container = document.getElementById("tabela-registros");

  if (registros.length === 0) {
    container.innerHTML = `<p style="color:#5a6070;font-size:13px;padding:20px">Nenhum registro encontrado</p>`;
    return;
  }

  const mapa = {};
  registros.forEach(function (r) {
    mapa[r.data.substring(0, 10)] = r;
  });

  const primeiraData = registros[0].data.substring(0, 10);
  const ano = parseInt(primeiraData.substring(0, 4));
  const mes = parseInt(primeiraData.substring(5, 7));
  const diasNoMes = new Date(ano, mes, 0).getDate();

  function fmt(h) {
<<<<<<< HEAD
    return h ? h.substring(0, 5) : "";
  }

  const perfil = sessionStorage.getItem("perfil");
  const podeEditar = (perfil === "admin");

=======
    return h ? h.substring(0, 5) : "—";
  }

>>>>>>> 75cfb01766022b8807f71f98690dae191c66f473
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
                ${podeEditar ? `<th>Ações</th>` : ""}
            </tr>
        </thead>
        <tbody>`;

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const chave = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const dataFormatada = `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
    const r = mapa[chave];

<<<<<<< HEAD
    let rJson = "null";
    let e1 = "", s1 = "", e2 = "", s2 = "", e3 = "", s3 = "", total = "", noturno = "", extras = "", negativos = "", eventoHtml = "";
    let classeNoturno = "";

    if (r) {
      rJson = encodeURIComponent(JSON.stringify(r));
      e1 = fmt(r.e1); s1 = fmt(r.s1);
      e2 = fmt(r.e2); s2 = fmt(r.s2);
      e3 = fmt(r.e3); s3 = fmt(r.s3);
      total = r.total || "";
      noturno = fmt(r.noturno);
      classeNoturno = r.noturno && r.noturno !== "00:00" ? "noturno-badge" : "";
      extras = r.extras || "";
      negativos = r.negativos || "";
      
      if (r.evento) {
        const cor = r.evento === "Falta" ? "vermelho" : r.evento === "Folga" ? "verde" : "";
        eventoHtml = `<span class="${cor}">${r.evento}</span>`;
      }
    } else {
        // Se não existir registro r, cria um objeto fake para o modal de edição abrir corretamente
        const fakeR = { funcionario_id: registros[0]?.funcionario_id, data: chave + "T12:00:00Z" };
        rJson = encodeURIComponent(JSON.stringify(fakeR));
    }

    html += `
      <tr>
          <td>${dataFormatada}</td>
          <td>${e1}</td><td>${s1}</td>
          <td>${e2}</td><td>${s2}</td>
          <td>${e3}</td><td>${s3}</td>
          <td>${total}</td>
          <td class="${classeNoturno}">${noturno}</td>
          <td class="verde">${extras}</td>
          <td class="vermelho">${negativos}</td>
          <td>${eventoHtml}</td>
          <td>
              <button class="btn-editar"
                  onclick="abrirModalEdicao(JSON.parse(decodeURIComponent('${rJson}')))">
                  ✏️
              </button>
          </td>
      </tr>`;
=======
    if (r) {
      let eventoHtml = "—";
      if (r.evento) {
        const cor =
          r.evento === "Falta"
            ? "vermelho"
            : r.evento === "Folga"
              ? "verde"
              : "";
        eventoHtml = `<span class="${cor}">${r.evento}</span>`;
      }

      // Serializa o registro para passar ao modal
      const rJson = encodeURIComponent(JSON.stringify(r));

      html += `
        <tr>
            <td>${dataFormatada}</td>
            <td>${fmt(r.e1)}</td><td>${fmt(r.s1)}</td>
            <td>${fmt(r.e2)}</td><td>${fmt(r.s2)}</td>
            <td>${fmt(r.e3)}</td><td>${fmt(r.s3)}</td>
            <td>${r.total || "—"}</td>
            <td class="${r.noturno && r.noturno !== "00:00" ? "noturno-badge" : ""}">${fmt(r.noturno)}</td>
            <td class="verde">${r.extras || "—"}</td>
            <td class="vermelho">${r.negativos || "—"}</td>
            <td>${eventoHtml}</td>
            <td>
                <button class="btn-editar"
                    onclick="abrirModalEdicao(JSON.parse(decodeURIComponent('${rJson}')))">
                    ✏️
                </button>
            </td>
        </tr>`;
    }
>>>>>>> 75cfb01766022b8807f71f98690dae191c66f473
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

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") fecharLegenda();
});

// ── Modal de edição ────────────────────────────────────────────────
function abrirModalEdicao(r) {
  // Preenche os campos do modal com os dados do registro
  document.getElementById("modal-data").textContent = new Date(
    r.data,
  ).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  document.getElementById("modal-reg-id").value = r.id;
  document.getElementById("modal-func-id").value = r.funcionario_id;
  document.getElementById("modal-data-val").value = r.data.substring(0, 10);
  document.getElementById("modal-e1").value = r.e1 || "";
  document.getElementById("modal-s1").value = r.s1 || "";
  document.getElementById("modal-e2").value = r.e2 || "";
  document.getElementById("modal-s2").value = r.s2 || "";
  document.getElementById("modal-e3").value = r.e3 || "";
  document.getElementById("modal-s3").value = r.s3 || "";
  document.getElementById("modal-evento").value = r.evento || "";
  document.getElementById("modal-erro").textContent = "";
  document.getElementById("modal-edicao").style.display = "flex";
}

function fecharModalEdicao() {
  document.getElementById("modal-edicao").style.display = "none";
}

function salvarEdicao() {
  const funcId = document.getElementById("modal-func-id").value;
  const data = document.getElementById("modal-data-val").value;
  const e1 = document.getElementById("modal-e1").value || null;
  const s1 = document.getElementById("modal-s1").value || null;
  const e2 = document.getElementById("modal-e2").value || null;
  const s2 = document.getElementById("modal-s2").value || null;
  const e3 = document.getElementById("modal-e3").value || null;
  const s3 = document.getElementById("modal-s3").value || null;
  const evento = document.getElementById("modal-evento").value || null;
  const elErro = document.getElementById("modal-erro");

  // Validação
  const erros = validarHorarios(e1, s1, e2, s2, e3, s3, evento);
  if (erros.length > 0) {
    elErro.textContent = erros[0];
    return;
  }

  fetch("http://localhost:3000/registros", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-usuario": sessionStorage.getItem("usuario") || "desconhecido",
    },
    body: JSON.stringify({
      funcionario_id: funcId,
      data,
      e1,
      s1,
      e2,
      s2,
      e3,
      s3,
      evento,
    }),
  })
    .then(function (r) {
      return r.json();
    })
    .then(function () {
      fecharModalEdicao();
      carregarRegistrosMes(funcId); // Recarrega a tabela
    });
}

function validarHorarios(e1, s1, e2, s2, e3, s3, evento) {
  // Se tem evento, não valida horários
  if (evento) return [];

  const erros = [];

  function toMin(h) {
    if (!h) return null;
    const p = h.split(":");
    return parseInt(p[0]) * 60 + parseInt(p[1]);
  }

  // Entrada sem saída ou saída sem entrada
  if (e1 && !s1) erros.push("Turno 1: entrada preenchida sem saída.");
  if (!e1 && s1) erros.push("Turno 1: saída preenchida sem entrada.");
  if (e2 && !s2) erros.push("Turno 2: entrada preenchida sem saída.");
  if (!e2 && s2) erros.push("Turno 2: saída preenchida sem entrada.");
  if (e3 && !s3) erros.push("Turno 3: entrada preenchida sem saída.");
  if (!e3 && s3) erros.push("Turno 3: saída preenchida sem entrada.");

  // Turno 2 preenchido sem turno 1
  if ((e2 || s2) && !e1) erros.push("Preencha o Turno 1 antes do Turno 2.");
  if ((e3 || s3) && !e2) erros.push("Preencha o Turno 2 antes do Turno 3.");

  // Mesmo horário de entrada e saída
  if (e1 && s1 && e1 === s1) erros.push("Turno 1: entrada e saída iguais.");
  if (e2 && s2 && e2 === s2) erros.push("Turno 2: entrada e saída iguais.");
  if (e3 && s3 && e3 === s3) erros.push("Turno 3: entrada e saída iguais.");

  // Entrada depois da saída sem cruzar meia-noite
  // Tolerância: se a diferença for maior que 16h, assumimos que cruzou meia-noite (válido)
  function turnoInvalido(ent, sai) {
    if (!ent || !sai) return false;
    const e = toMin(ent);
    const s = toMin(sai);
    // Se saída < entrada E a diferença for menor que 16h, é erro
    // Se a diferença for >= 16h, provavelmente cruzou meia-noite (ex: 22:00 → 06:00)
    return s < e && e - s < 16 * 60;
  }
  if (turnoInvalido(e1, s1))
    erros.push(
      "Turno 1: entrada depois da saída. Se cruzou meia-noite, está correto.",
    );
  if (turnoInvalido(e2, s2)) erros.push("Turno 2: entrada depois da saída.");
  if (turnoInvalido(e3, s3)) erros.push("Turno 3: entrada depois da saída.");

  return erros;
}

function gerarPDF() {
  const nome = document.getElementById("topbar-nome").textContent;
  const tipo = document.getElementById("info-tipo").textContent;
<<<<<<< HEAD
  const mesValue = document.getElementById("sel-mes-func").value;
  const anoValue = document.getElementById("sel-ano-func").value;

  const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const labelMes = MESES[parseInt(mesValue) - 1] + " " + anoValue;

  // Clona a tabela para remover a coluna de ações sem mexer na tela
  const divOriginal = document.getElementById("tabela-registros");
  const tabelaClone = divOriginal.querySelector("table").cloneNode(true);
  
  // Remove a última coluna (Ações) de cada linha
  tabelaClone.querySelectorAll("tr").forEach(tr => {
    if (tr.lastElementChild) tr.removeChild(tr.lastElementChild);
  });

=======
  const mes = document.getElementById("sel-mes-func").value;
  const ano = document.getElementById("sel-ano-func").value;

  const MESES = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const labelMes = MESES[parseInt(mes) - 1] + " " + ano;

  // Pega os dados já renderizados na tabela
  const tabela = document.querySelector("#tabela-registros table");
  if (!tabela) {
    alert("Nenhum registro para exportar.");
    return;
  }

  // Pega os cards de resumo
>>>>>>> 75cfb01766022b8807f71f98690dae191c66f473
  const saldo = document.getElementById("info-saldo")?.textContent || "—";
  const faltas = document.getElementById("info-faltas")?.textContent || "—";
  const total = document.getElementById("info-total")?.textContent || "—";
  const extras = document.getElementById("info-extras")?.textContent || "—";
<<<<<<< HEAD
  const negativos = document.getElementById("info-negativos")?.textContent || "—";

=======
  const negativos =
    document.getElementById("info-negativos")?.textContent || "—";

  // Monta HTML do PDF em uma janela nova
>>>>>>> 75cfb01766022b8807f71f98690dae191c66f473
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Ficha — ${nome} — ${labelMes}</title>
        <style>
            @page { size: auto; margin: 10mm 15mm; }
            * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 10px; color: #1a1a1a; padding: 0; }

            .cabecalho { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #1a1a1a; }
            .empresa { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
            .subtitulo { font-size: 11px; color: #555; margin-top: 2px; }
            .periodo { text-align:right; font-size: 12px; line-height: 1.4; color: #333; }

            .grid-topo { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
            .card-topo { border: 1.5px solid #eee; border-radius: 8px; padding: 12px; background: #fafafa; }
            .card-label { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #888; margin-bottom: 5px; }
            .card-valor { font-size: 15px; font-weight: 800; color: #000; }
            .card-valor.verde { color: #2e7d32; }
            .card-valor.vermelho { color: #d32f2f; }

            .resumo-linha { display: flex; gap: 40px; margin-bottom: 20px; padding: 12px; border: 1.5px solid #000; border-radius: 8px; justify-content: center; background: #fff; }
            .resumo-item { text-align: center; }
            .resumo-label { font-size: 9px; color: #666; font-weight: 600; text-transform: uppercase; margin-bottom: 3px; }
            .resumo-valor { font-size: 14px; font-weight: 800; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; table-layout: fixed; }
            th { background: #1a1a1a; color: #fff; padding: 6px 2px; font-size: 9px; font-weight: 600; text-transform: uppercase; border: 1px solid #1a1a1a; text-align: left; overflow: visible !important; }
            td { padding: 5px 2px; border: 1px solid #eee; font-size: 9.5px; white-space: nowrap; overflow: visible !important; text-overflow: clip !important; }
            
            /* Definição de Larguras das Colunas */
            th:nth-child(1), td:nth-child(1) { width: 95px; } /* Data (Aumentada) */
            th:nth-child(2), td:nth-child(2), 
            th:nth-child(3), td:nth-child(3), 
            th:nth-child(4), td:nth-child(4), 
            th:nth-child(5), td:nth-child(5), 
            th:nth-child(6), td:nth-child(6), 
            th:nth-child(7), td:nth-child(7) { width: 38px; } /* E1-S3 (Reduzidas) */
            th:nth-child(8), td:nth-child(8) { width: 42px; } /* Total */
            th:nth-child(9), td:nth-child(9) { width: 45px; } /* Noturno */
            th:nth-child(10), td:nth-child(10) { width: 45px; } /* Extras */
            th:nth-child(11), td:nth-child(11) { width: 50px; } /* Negativos */
            th:nth-child(12), td:nth-child(12) { width: auto; }  /* Evento */

            tr:nth-child(even) td { background: #fcfcfc; }
            .verde { color: #2e7d32 !important; font-weight: 600; }
            .vermelho { color: #d32f2f !important; font-weight: 600; }
            .noturno-badge { background: rgba(0,0,0,0.05); border-radius: 4px; font-weight: 600; }

            .rodape { margin-top: auto; padding-top: 15px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 10px; color: #777; font-style: italic; }
        </style>
    </head>
    <body>
        <div class="cabecalho">
            <div>
                <div class="empresa">VISO HOTEL</div>
                <div class="subtitulo">Sistema de Gestão de Ponto Eletrônico</div>
            </div>
            <div class="periodo">
                <strong>RELATÓRIO MENSAL - FICHA DE PONTO</strong><br>
                Referência: ${labelMes}
            </div>
        </div>

        <div class="grid-topo">
            <div class="card-topo">
                <div class="card-label">Colaborador</div>
                <div class="card-valor">${nome}</div>
            </div>
            <div class="card-topo">
                <div class="card-label">Tipo</div>
                <div class="card-valor">${tipo}</div>
            </div>
<<<<<<< HEAD
            <div class="card-topo">
                <div class="card-label">Faltas no Mês</div>
                <div class="card-valor ${parseInt(faltas) > 0 ? "vermelho" : ""}">${faltas || "0"}</div>
            </div>
            <div class="card-topo">
                <div class="card-label">Saldo Atual</div>
                <div class="card-valor ${saldo.startsWith("+") ? "verde" : saldo.startsWith("-") ? "vermelho" : ""}">${saldo}</div>
=======
            <div class="info-card">
                <div class="info-label">Faltas</div>
                <div class="info-valor ${parseInt(faltas) > 0 ? "vermelho" : ""}">${faltas}</div>
            </div>
            <div class="info-card">
                <div class="info-label">Saldo do Mês</div>
                <div class="info-valor ${saldo.startsWith("+") ? "verde" : saldo.startsWith("-") ? "vermelho" : ""}">${saldo}</div>
>>>>>>> 75cfb01766022b8807f71f98690dae191c66f473
            </div>
        </div>

        <div class="resumo-linha">
            <div class="resumo-item">
                <div class="resumo-label">Total Horas</div>
                <div class="resumo-valor">${total}</div>
            </div>
            <div class="resumo-item">
                <div class="resumo-label">Total Ganhos (+)</div>
                <div class="resumo-valor verde">${extras || "00:00"}</div>
            </div>
            <div class="resumo-item">
                <div class="resumo-label">Total Perdas (-)</div>
                <div class="resumo-valor vermelho">${negativos || "00:00"}</div>
            </div>
        </div>

        ${tabelaClone.outerHTML}

        <div class="rodape">
            <span>Extraído em: ${new Date().toLocaleString("pt-BR")}</span>
            <span>VISO Hotel — Excelência em Gestão</span>
        </div>
    </body>
    </html>`;

<<<<<<< HEAD
=======
  // Abre em janela nova e aciona o print do navegador
>>>>>>> 75cfb01766022b8807f71f98690dae191c66f473
  const janela = window.open("", "_blank");
  janela.document.write(html);
  janela.document.close();
  janela.onload = function () {
<<<<<<< HEAD
    setTimeout(() => { janela.print(); }, 500);
=======
    janela.print();
>>>>>>> 75cfb01766022b8807f71f98690dae191c66f473
  };
}

carregarFuncionario();
