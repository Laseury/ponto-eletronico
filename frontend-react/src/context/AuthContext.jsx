import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // axios global interceptor para garantir o Token em toda request
  // Evitamos problemas onde requests de outros lugares carregam antes do useEffect do Provider
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
      
      Swal.fire({
        title: 'Bem-vindo!',
        text: `Olá, ${userData.nome}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      return true;
    } catch (error) {
      console.error(error);
      Swal.fire({
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

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
