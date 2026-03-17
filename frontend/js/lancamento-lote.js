const API = "http://localhost:3000";

function carregarFuncionarios() {
    fetch(API + "/funcionarios")
        .then(r => r.json())
        .then(function(funcionarios) {
            const container = document.getElementById("lista-funcionarios");

            let html = "";
            funcionarios.forEach(function(f) {
                const tipoBadge = f.tipo === "Horista Noturno" ? "badge-noturno"
                    : f.tipo === "Horista" ? "badge-horista"
                    : "badge-mensalista";

                html += `
                    <label class="lote-item" id="label-${f.id}">
                        <input type="checkbox" class="lote-check" value="${f.id}"
                               onchange="atualizarContador()">
                        <span class="lote-nome">${f.nome}</span>
                        <span class="func-badge ${tipoBadge}">${f.tipo}</span>
                    </label>`;
            });

            container.innerHTML = html;

            // Data padrão = hoje
            const hoje = new Date().toISOString().split("T")[0];
            document.getElementById("lote-data").value = hoje;
        });
}

function selecionarTodos() {
    document.querySelectorAll(".lote-check").forEach(c => c.checked = true);
    atualizarContador();
}

function deselecionarTodos() {
    document.querySelectorAll(".lote-check").forEach(c => c.checked = false);
    atualizarContador();
}

function atualizarContador() {
    const total = document.querySelectorAll(".lote-check:checked").length;
    const el    = document.getElementById("lote-resultado");
    el.textContent = total > 0 ? `${total} funcionário(s) selecionado(s)` : "";
    el.style.color = "#9399a6";
}

async function lancarLote() {
    const data    = document.getElementById("lote-data").value;
    const evento  = document.getElementById("lote-evento").value;
    const checks  = document.querySelectorAll(".lote-check:checked");
    const elRes   = document.getElementById("lote-resultado");

    if (!data) {
        elRes.textContent = "Selecione uma data.";
        elRes.style.color = "#e05c5c";
        return;
    }
    if (!evento) {
        elRes.textContent = "Selecione um evento.";
        elRes.style.color = "#e05c5c";
        return;
    }
    if (checks.length === 0) {
        elRes.textContent = "Selecione ao menos um funcionário.";
        elRes.style.color = "#e05c5c";
        return;
    }

    elRes.textContent = "Lançando...";
    elRes.style.color = "#9399a6";

    // Envia um registro para cada funcionário selecionado
    const ids      = Array.from(checks).map(c => parseInt(c.value));
    const promises = ids.map(function(id) {
        return fetch(API + "/registros", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                funcionario_id: id,
                data:   data,
                evento: evento,
                e1: null, s1: null,
                e2: null, s2: null,
                e3: null, s3: null
            })
        });
    });

    // Aguarda todos os lançamentos terminarem
    try {
        await Promise.all(promises);
        elRes.textContent = `✅ Lançado com sucesso para ${ids.length} funcionário(s)!`;
        elRes.style.color = "#4caf82";
        deselecionarTodos();
    } catch (erro) {
        elRes.textContent = "Erro ao lançar. Tente novamente.";
        elRes.style.color = "#e05c5c";
    }
}

carregarFuncionarios();