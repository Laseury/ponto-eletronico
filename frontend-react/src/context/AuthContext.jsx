import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import swalTheme from '../utils/swalTheme';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Interceptor global: envia o JWT em toda requisição axios
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, (error) => {
    return Promise.reject(error);
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('usuario_logado');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (usuario, senha) => {
    try {
      const response = await axios.post('/auth/login', { login: usuario, senha });
      const { usuario: userData, token } = response.data;

      const normalizedUser = {
        id: userData.id,
        nome: userData.nome,
        cargo: userData.perfil,
        usuario: userData.login,
        perfil: userData.perfil
      };

      localStorage.setItem('usuario_logado', JSON.stringify(normalizedUser));
      localStorage.setItem('token', token);

      setUser(normalizedUser);

      swalTheme({
        title: 'Bem-vindo!',
        text: `Olá, ${userData.nome}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      return true;
    } catch (error) {
      console.error(error);
      swalTheme({
        title: 'Erro!',
        text: error.response?.data?.error || 'Usuário ou senha inválidos!',
        icon: 'error'
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('usuario_logado');
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  /**
   * Atualiza o nome e senha do próprio usuário logado.
   * Chama a rota do backend se existir, ou apenas atualiza o localStorage localmente.
   */
  const updateProfile = async (usuarioKey, newName, newPassword) => {
    try {
      // Tenta atualizar via API (se a rota existir no backend)
      await axios.put('/auth/profile', { nome: newName, senha: newPassword });
    } catch (e) {
      // Se não existir a rota, continua apenas com o update local
      console.warn('Rota /auth/profile não disponível, atualizando localmente.');
    }

    // Atualiza o estado local de qualquer forma
    if (user && user.usuario === usuarioKey) {
      const userData = { ...user, nome: newName };
      localStorage.setItem('usuario_logado', JSON.stringify(userData));
      setUser(userData);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
