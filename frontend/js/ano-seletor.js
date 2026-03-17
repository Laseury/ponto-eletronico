// Preenche automaticamente todos os <select> com id contendo "sel-ano"
// com o ano atual -1, atual e atual +1
// Basta incluir este script em qualquer página que tenha seletores de ano
function preencherSeletoresAno() {
    const anoAtual = new Date().getFullYear();
    const anos     = [anoAtual - 1, anoAtual, anoAtual + 1];

    document.querySelectorAll("select[id*='sel-ano']").forEach(function(sel) {
        const valorAtual = sel.value; // guarda o valor já selecionado
        sel.innerHTML = anos.map(function(a) {
            return `<option value="${a}">${a}</option>`;
        }).join("");
        // Restaura o valor se ainda estiver na lista
        if (valorAtual) sel.value = valorAtual;
    });
}

document.addEventListener("DOMContentLoaded", preencherSeletoresAno);