// Chame guardarPagina("admin", "gestor") no topo de cada página protegida
// passando quais perfis têm acesso a ela
function guardarPagina(...perfisPermitidos) {
    const perfil = sessionStorage.getItem("perfil");

    if (!perfil) {
        // Não está logado — volta pro login
        window.location.href = "../index.html";
        return;
    }

    if (!perfisPermitidos.includes(perfil)) {
        // Logado mas sem permissão para esta página
        alert("Você não tem permissão para acessar esta página.");
        window.location.href = "../index.html";
        return;
    }
}

function perfilAtual() {
    return sessionStorage.getItem("perfil");
}

function usuarioAtual() {
    return sessionStorage.getItem("usuario");
}

function sair() {
    sessionStorage.clear();
    window.location.href = "../index.html";
}

// Exibe "Olá, nome" na topbar se existir o elemento
function exibirUsuarioLogado() {
    const usuario = sessionStorage.getItem("usuario");
    const el      = document.getElementById("topbar-usuario");
    if (el && usuario) {
        el.textContent = "Olá, " + usuario;
    }
}

document.addEventListener("DOMContentLoaded", exibirUsuarioLogado);