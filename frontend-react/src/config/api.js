/**
 * Configuração de API para o frontend
 * Detecta automaticamente o ambiente e configura a URL base correta
 */

// Detectar se está em desenvolvimento ou produção
const isDevelopment = import.meta.env.MODE === 'development';

// URL base da API
// Em desenvolvimento: localhost:3000 (proxy do Vite)
// Em produção: raiz da aplicação (/) - Express roteia para as rotas corretas
export const API_BASE_URL = isDevelopment ? 'http://localhost:3000' : '';

// Configuração de headers padrão
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Função helper para fazer requisições
export const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.error || error.message || 'Erro na requisição');
  }

  return response.json();
};

// URL de Debug (útil para troubleshooting)
export const getDebugInfo = () => ({
  environment: isDevelopment ? 'development' : 'production',
  apiBaseUrl: API_BASE_URL,
  mode: import.meta.env.MODE,
});

export default {
  API_BASE_URL,
  DEFAULT_HEADERS,
  fetchAPI,
  getDebugInfo,
};
