const API = "http://localhost:3000";

async function carregarFuncionariosLote() {
    try {
        const resposta = await fetch(`${API}/funcionarios`);
        const funcs = await resposta.json();
        
        const select = document.getElementById("lote-funcionario-id");
        funcs.forEach(f => {
            const opt = document.createElement("option");
            opt.value = f.id;
            opt.textContent = `${f.nome} (${f.tipo})`;
            select.appendChild(opt);
        });

        if (funcs.length === 0) {
            select.innerHTML = `<option value="">Nenhum funcionário encontrado.</option>`;
        }
    } catch (err) {
        console.error(err);
    }
}

function toggleNegativoManual() {
    const evento = document.getElementById("lote-evento").value;
    const campo = document.getElementById("campo-negativo-manual");
    if (evento === "Falta") {
        campo.style.display = "block";
    } else {
        campo.style.display = "none";
    }
}

async function lancarLote() {
    const id = document.getElementById("lote-funcionario-id").value;
    const ids = id ? [parseInt(id)] : [];
    const dataInicio = document.getElementById("lote-data-inicio").value;
    const dataFim = document.getElementById("lote-data-fim").value;
    const evento = document.getElementById("lote-evento").value;
    const negManual = document.getElementById("lote-negativo-manual").value;
    const msg = document.getElementById("mensagem-lote");

    if (ids.length === 0) return alert("Selecione pelo menos um funcionário.");
    if (!dataInicio || !dataFim || !evento) return alert("Preencha todos os campos.");

    msg.innerHTML = `<p style="color: var(--ouro)">Processando lançamento em lote...</p>`;

    try {
        const resposta = await fetch(`${API}/registros/lote-evento`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-usuario": sessionStorage.getItem("usuario") || "admin"
            },
            body: JSON.stringify({
                funcionario_ids: ids,
                data_inicio: dataInicio,
                data_fim: dataFim,
                evento: evento,
                negativos_manual: negManual
            })
        });

        const res = await resposta.json();

        if (resposta.ok) {
            msg.innerHTML = `<p style="color: #4caf82; font-weight: 600;">✅ ${res.mensagem}</p>`;
            setTimeout(() => {
                if (confirm("Deseja voltar para a página de lançamentos?")) {
                    window.location.href = "lancamento.html";
                }
            }, 1000);
        } else {
            msg.innerHTML = `<p style="color: var(--vermelho)">❌ Erro: ${res.erro || "Falha no servidor"}</p>`;
        }
    } catch (err) {
        console.error(err);
        msg.innerHTML = `<p style="color: var(--vermelho)">❌ Erro de conexão com o servidor.</p>`;
    }
}

// Inicializa
carregarFuncionariosLote();
