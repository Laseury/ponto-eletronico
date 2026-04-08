import Swal from 'sweetalert2';

/**
 * Retorna as cores do tema atual (detecta .dark no HTML)
 */
export const getSwalTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    
    // Cores baseadas no index.css
    return {
        background: isDark ? '#061d12' : '#ffffff',
        color: isDark ? '#e1e9e5' : '#064e3b',
        confirmButtonColor: '#10b981',
        cancelButtonColor: isDark ? '#0c2d1c' : '#f1f5f9',
        // Estilos para o botão de cancelar no modo light (precisa ser visível)
        cancelButtonText: isDark ? 'inline-block' : 'inline-block',
    };
};

/**
 * Wrapper para Swal.fire que aplica o tema automaticamente
 */
export const swalTheme = (options) => {
    const theme = getSwalTheme();
    return Swal.fire({
        ...theme,
        ...options,
        customClass: {
            popup: 'rounded-[1.5rem] border border-brand-border shadow-2xl',
            ...options.customClass
        }
    });
};

export default swalTheme;
