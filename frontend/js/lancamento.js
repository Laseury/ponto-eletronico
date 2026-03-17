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
    let data           = document.getElementById("campo-data").value;
    let evento         = document.getElementById("campo-evento").value || null;
    let e1 = document.getElementById("e1").value || null;
    let s1 = document.getElementById("s1").value || null;
    let e2 = document.getElementById("e2").value || null;
    let s2 = document.getElementById("s2").value || null;
    let e3 = document.getElementById("e3").value || null;
    let s3 = document.getElementById("s3").value || null;
    let mensagem = document.getElementById("mensagem");

    if (!funcionario_id || !data) {
        mensagem.className   = "mensagem-erro";
        mensagem.textContent = "Selecione o funcionário e a data.";
        return;
    }

    const erros = validarHorarios(e1, s1, e2, s2, e3, s3, evento);
    if (erros.length > 0) {
        mensagem.className   = "mensagem-erro";
        mensagem.textContent = erros[0];
        return;
    }

    // Verifica se já existe registro antes de salvar
    fetch(`http://localhost:3000/registros/verificar?funcionario_id=${funcionario_id}&data=${data}`)
        .then(r => r.json())
        .then(function(resultado) {
            if (resultado.existe) {
                // Mostra modal de confirmação com os dados existentes
                abrirModalSobrescrita(resultado.registro, function() {
                    salvarRegistro(funcionario_id, data, e1, s1, e2, s2, e3, s3, evento, mensagem);
                });
            } else {
                salvarRegistro(funcionario_id, data, e1, s1, e2, s2, e3, s3, evento, mensagem);
            }
        });
}

function salvarRegistro(funcionario_id, data, e1, s1, e2, s2, e3, s3, evento, mensagem) {
    fetch("http://localhost:3000/registros", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funcionario_id, data, e1, s1, e2, s2, e3, s3, evento })
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

    // Guarda o callback para quando o usuário confirmar
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

// Fecha com ESC também
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") fecharLegenda();
});

carregarFuncionarios();
