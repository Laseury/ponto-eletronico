import React, { createContext, useContext, useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se existe um usuário no localStorage ao carregar
    const savedUser = localStorage.getItem('usuario_logado');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (usuario, senha) => {
    // Usuários simulados (conforme o sistema original)
    const USUARIOS = {
      admin: { senha: '123', perfil: 'Admin', nome: 'Administrador' },
      rh: { senha: 'rh123', perfil: 'Admin', nome: 'RH' },
      gestor: { senha: 'gestor', perfil: 'Gestor', nome: 'Gestor' },
      contador: { senha: 'cont', perfil: 'Contador', nome: 'Contador' },
    };

    const encontrado = USUARIOS[usuario];

    if (encontrado && encontrado.senha === senha) {
      const userData = {
        id: usuario === 'admin' ? 1 : 2,
        nome: encontrado.nome,
        cargo: encontrado.perfil,
        usuario: usuario
      };
      
      localStorage.setItem('usuario_logado', JSON.stringify(userData));
      setUser(userData);
      
      Swal.fire({
        title: 'Bem-vindo!',
        text: `Olá, ${encontrado.nome}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      return true;
    } else {
      Swal.fire({
        title: 'Erro!',
        text: 'Usuário ou senha inválidos!',
        icon: 'error'
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('usuario_logado');
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
