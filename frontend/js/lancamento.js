// Carrega a lista de funcionários no select
function carregarFuncionarios() {
  fetch("http://localhost:3000/funcionarios")
    .then(function (resposta) {
      return resposta.json();
    })
    .then(function (dados) {
      let select = document.getElementById("campo-funcionario");
      dados.forEach(function (f) {
        select.innerHTML += `<option value="${f.id}">${f.nome}</option>`;
      });
    });
}

function lancarPonto() {
    let funcionario_id = document.getElementById("campo-funcionario").value;
    let mes            = document.getElementById("campo-mes").value; // YYYY-MM
    let dia            = document.getElementById("campo-dia").value;
    let evento         = document.getElementById("campo-evento").value || null;
    let e1 = document.getElementById("e1").value || null;
    let s1 = document.getElementById("s1").value || null;
    let e2 = document.getElementById("e2").value || null;
    let s2 = document.getElementById("s2").value || null;
    let e3 = document.getElementById("e3").value || null;
    let s3 = document.getElementById("s3").value || null;
    let mensagem = document.getElementById("mensagem");

    if (!funcionario_id || !mes || !dia) {
        mensagem.className   = "mensagem-erro";
        mensagem.textContent = "Selecione o funcionário, o mês e o dia.";
        return;
    }

    // Formata a data completa YYYY-MM-DD
    const dataCompleta = `${mes}-${dia.padStart(2, '0')}`;

    const erros = validarHorarios(e1, s1, e2, s2, e3, s3, evento);
    if (erros.length > 0) {
        mensagem.className   = "mensagem-erro";
        mensagem.textContent = erros[0];
        return;
    }

    // Verifica se já existe registro antes de salvar
    fetch(`http://localhost:3000/registros/verificar?funcionario_id=${funcionario_id}&data=${dataCompleta}`)
        .then(r => r.json())
        .then(function(resultado) {
            if (resultado.existe) {
                abrirModalSobrescrita(resultado.registro, function() {
                    salvarRegistro(funcionario_id, dataCompleta, e1, s1, e2, s2, e3, s3, evento, mensagem);
                });
            } else {
                salvarRegistro(funcionario_id, dataCompleta, e1, s1, e2, s2, e3, s3, evento, mensagem);
            }
        });
}

function salvarRegistro(funcionario_id, data, e1, s1, e2, s2, e3, s3, evento, mensagem) {
    const negativos_manual = document.getElementById("negativo-manual").value;

    fetch("http://localhost:3000/registros", {
        method:  "POST",
        headers: {
            "Content-Type": "application/json",
            "x-usuario": sessionStorage.getItem("usuario") || "desconhecido"
        },
        body: JSON.stringify({ funcionario_id, data, e1, s1, e2, s2, e3, s3, evento, negativos_manual })
    })
    .then(r => r.json())
    .then(function(dados) {
        let texto = "Registro salvo com sucesso!";
        if (dados.noturno && dados.noturno !== "00:00") {
            texto += ` | 🌙 Noturno: ${dados.noturno}`;
        }
        mensagem.className   = "mensagem-sucesso";
        mensagem.textContent = texto;
        fecharModalSobrescrita();
    });
}

function abrirModalSobrescrita(reg, onConfirmar) {
    function fmt(h) { return h ? h.substring(0, 5) : "—"; }
    document.getElementById("sobrescrita-data").textContent    = new Date(reg.data).toLocaleDateString("pt-BR", { timeZone: "UTC" });
    document.getElementById("sobrescrita-e1").textContent      = fmt(reg.e1);
    document.getElementById("sobrescrita-s1").textContent      = fmt(reg.s1);
    document.getElementById("sobrescrita-e2").textContent      = fmt(reg.e2);
    document.getElementById("sobrescrita-s2").textContent      = fmt(reg.s2);
    document.getElementById("sobrescrita-total").textContent   = reg.total  || "—";
    document.getElementById("sobrescrita-evento").textContent  = reg.evento || "—";
    document.getElementById("sobrescrita-extras").textContent  = reg.extras || "—";
    document.getElementById("btn-confirmar-sobrescrita").onclick = onConfirmar;
    document.getElementById("modal-sobrescrita").style.display = "flex";
}

function fecharModalSobrescrita() {
    document.getElementById("modal-sobrescrita").style.display = "none";
}

function abrirLegenda() {
  document.getElementById("legenda-painel").classList.add("aberto");
  document.getElementById("legenda-overlay").classList.add("aberto");
}

function fecharLegenda() {
  document.getElementById("legenda-painel").classList.remove("aberto");
  document.getElementById("legenda-overlay").classList.remove("aberto");
}

function validarHorarios(e1, s1, e2, s2, e3, s3, evento) {
  if (evento) return [];
  const erros = [];
  function toMin(h) {
    if (!h) return null;
    const p = h.split(":");
    return parseInt(p[0]) * 60 + parseInt(p[1]);
  }
  if (e1 && !s1) erros.push("Turno 1: entrada preenchida sem saída.");
  if (!e1 && s1) erros.push("Turno 1: saída preenchida sem entrada.");
  if (e2 && !s2) erros.push("Turno 2: entrada preenchida sem saída.");
  if (!e2 && s2) erros.push("Turno 2: saída preenchida sem entrada.");
  if (e3 && !s3) erros.push("Turno 3: entrada preenchida sem saída.");
  if (!e3 && s3) erros.push("Turno 3: saída preenchida sem entrada.");
  if ((e2 || s2) && !e1) erros.push("Preencha o Turno 1 antes do Turno 2.");
  if ((e3 || s3) && !e2) erros.push("Preencha o Turno 2 antes do Turno 3.");
  if (e1 && s1 && e1 === s1) erros.push("Turno 1: entrada e saída iguais.");
  if (e2 && s2 && e2 === s2) erros.push("Turno 2: entrada e saída iguais.");
  if (e3 && s3 && e3 === s3) erros.push("Turno 3: entrada e saída iguais.");
  function turnoInvalido(ent, sai) {
    if (!ent || !sai) return false;
    const e = toMin(ent);
    const s = toMin(sai);
    return s < e && e - s < 16 * 60;
  }
  if (turnoInvalido(e1, s1)) erros.push("Turno 1: entrada depois da saída.");
  if (turnoInvalido(e2, s2)) erros.push("Turno 2: entrada depois da saída.");
  if (turnoInvalido(e3, s3)) erros.push("Turno 3: entrada depois da saída.");
  return erros;
}

function toggleSecaoHorarios() {
  const evento   = document.getElementById("campo-evento").value;
  const secao    = document.getElementById("secao-horarios");
  const banner   = document.getElementById("banner-descanso");
  const faltaManual = document.getElementById("secao-falta-manual");
  
  if (evento) {
    secao.classList.add("secao-oculta");
    banner.classList.remove("secao-oculta");
    if (evento === "Falta") {
        faltaManual.classList.remove("secao-oculta");
    } else {
        faltaManual.classList.add("secao-oculta");
    }
  } else {
    secao.classList.remove("secao-oculta");
    banner.classList.add("secao-oculta");
    faltaManual.classList.add("secao-oculta");
  }
}

// --- LÓGICA DE IA ---
let registrosExtraidos = [];

async function processarIA(input) {
  if (!input.files || !input.files[0]) return;

  const funcionario_id = document.getElementById("campo-funcionario").value;
  const mesAno = document.getElementById("campo-mes").value; // YYYY-MM

  if (!funcionario_id || !mesAno) {
    alert("Selecione o funcionário e o Mês de Referência antes de carregar o arquivo.");
    input.value = "";
    return;
  }

  const arquivo = input.files[0];
  const formData = new FormData();
  formData.append("arquivo", arquivo);
  formData.append("funcionario_id", funcionario_id);
  formData.append("mesAno", mesAno);

  // UI Loading
  const btn = document.getElementById("btn-arquivo-ia");
  const spinner = document.getElementById("spinner-btn");
  const textoBtn = document.getElementById("texto-btn");
  
  btn.classList.add("carregando");
  spinner.classList.remove("secao-oculta");
  textoBtn.textContent = "Processando...";

  try {
    const response = await fetch("http://localhost:3000/ia/extrair", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Erro na extração");

    const data = await response.json();
    registrosExtraidos = data.registros || [];
    renderizarResultadosIA();
  } catch (error) {
    alert("Erro ao processar arquivo com IA. Tente novamente.");
    console.error(error);
  } finally {
    btn.classList.remove("carregando");
    spinner.classList.add("secao-oculta");
    textoBtn.textContent = "✨ Extrair Mês via IA";
    input.value = "";
  }
}

function renderizarResultadosIA() {
  const corpo = document.getElementById("tabela-corpo-ia");
  corpo.innerHTML = "";

  registrosExtraidos.forEach((reg, index) => {
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid var(--borda)";
    tr.dataset.dataOriginal = reg.data;
    
    // Formata a data para visualização
    const dataDisplay = reg.data ? new Date(reg.data + "T00:00:00").toLocaleDateString("pt-BR") : "—";
    const inputHora = (val, id) => `<input type="time" class="input-revisao-ia" value="${val || ""}" data-field="${id}">`;

    tr.innerHTML = `
      <td style="padding: 16px 12px;"><input type="checkbox" checked class="check-revisao-ia"></td>
      <td style="padding: 16px 12px; white-space: nowrap;">${dataDisplay}</td>
      <td style="padding: 10px 6px;">${inputHora(reg.e1, "e1")}</td>
      <td style="padding: 10px 6px;">${inputHora(reg.s1, "s1")}</td>
      <td style="padding: 10px 6px;">${inputHora(reg.e2, "e2")}</td>
      <td style="padding: 10px 6px;">${inputHora(reg.s2, "s2")}</td>
      <td style="padding: 10px 6px;">${inputHora(reg.e3, "e3")}</td>
      <td style="padding: 10px 6px;">${inputHora(reg.s3, "s3")}</td>
      <td style="padding: 10px 6px;">
        <select class="select-revisao-ia">
          <option value="">— Trabalho —</option>
          <option value="Folga" ${reg.evento === "Folga" ? "selected" : ""}>🏖️ Folga</option>
          <option value="Falta" ${reg.evento === "Falta" ? "selected" : ""}>❌ Falta</option>
          <option value="Atestado" ${reg.evento === "Atestado" ? "selected" : ""}>🏥 Atestado</option>
          <option value="DSR" ${reg.evento === "DSR" ? "selected" : ""}>📅 DSR</option>
        </select>
      </td>
      <td style="padding: 16px 12px; font-size: 11px;"><span style="color: var(--ouro)">Aguardando</span></td>
    `;
    corpo.appendChild(tr);
  });

  document.getElementById("modal-ia-revisao").style.display = "flex";
}

function marcarTodosIA(el) {
  const checks = document.querySelectorAll(".check-revisao-ia");
  checks.forEach(c => c.checked = el.checked);
}

function fecharModalIA() {
  document.getElementById("modal-ia-revisao").style.display = "none";
}

async function salvarExtraçãoIA() {
  const funcionario_id = document.getElementById("campo-funcionario").value;
  const corpo = document.getElementById("tabela-corpo-ia");
  const botoes = document.querySelector("#modal-ia-revisao button:last-child");
  
  botoes.disabled = true;
  botoes.textContent = "Salvando...";

  const linhas = Array.from(corpo.rows);
  
  for (let i = 0; i < linhas.length; i++) {
    const tr = linhas[i];
    const checkbox = tr.querySelector(".check-revisao-ia");
    const statusCell = tr.cells[9];

    if (!checkbox.checked) {
      statusCell.innerHTML = "⏭️ Ignorado";
      continue;
    }

    statusCell.innerHTML = "⏳";

    const data = tr.dataset.dataOriginal;
    const e1 = tr.querySelector('[data-field="e1"]').value || null;
    const s1 = tr.querySelector('[data-field="s1"]').value || null;
    const e2 = tr.querySelector('[data-field="e2"]').value || null;
    const s2 = tr.querySelector('[data-field="s2"]').value || null;
    const e3 = tr.querySelector('[data-field="e3"]').value || null;
    const s3 = tr.querySelector('[data-field="s3"]').value || null;
    const evento = tr.querySelector('.select-revisao-ia').value || null;

    try {
      await fetch("http://localhost:3000/registros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-usuario": sessionStorage.getItem("usuario") || "ia_bot"
        },
        body: JSON.stringify({
          funcionario_id,
          data, e1, s1, e2, s2, e3, s3, evento
        })
      });
      statusCell.innerHTML = "✅ Pronto";
    } catch (e) {
      statusCell.innerHTML = "❌ Erro";
    }
  }

  botoes.textContent = "Concluído!";
  setTimeout(() => {
    fecharModalIA();
    window.location.reload();
  }, 1500);
}

// Inicialização
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    fecharLegenda();
    fecharModalIA();
    fecharModalSobrescrita();
  }
});

carregarFuncionarios();
toggleSecaoHorarios();