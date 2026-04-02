import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    
    if (!usuario || !senha) return;
    
    const success = await login(usuario, senha);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-6 transition-colors duration-700">
      <div className="max-w-md w-full bg-brand-surface rounded-[3rem] shadow-2xl overflow-hidden border border-brand-border p-2">
        <div className="p-10">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-brand-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-brand-primary/40 mx-auto mb-8 transform -rotate-[5deg] hover:rotate-0 transition-transform">
              <span className="text-white font-black text-4xl italic">V</span>
            </div>
            <h1 className="text-5xl font-black text-brand-text tracking-tighter mb-3">VISO PONTO</h1>
            <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Hotelaria & Gestão</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1 opacity-50">Usuário de Acesso</label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full px-8 py-5 bg-brand-bg border border-brand-border rounded-2xl text-brand-text text-lg font-black placeholder-brand-muted/20 focus:outline-none focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary/50 shadow-inner transition-all"
                placeholder="Ex: admin"
                autoFocus
              />
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1 opacity-50">Sua Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-8 py-5 bg-brand-bg border border-brand-border rounded-2xl text-brand-text text-lg font-black placeholder-brand-muted/20 focus:outline-none focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary/50 shadow-inner transition-all"
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-black py-5 rounded-2xl shadow-2xl shadow-brand-primary/40 transform active:scale-[0.98] transition-all text-[10px] uppercase tracking-[0.2em]"
            >
              Iniciar Sessão Segura
            </button>
          </form>
        </div>
        
        <div className="px-10 py-8 bg-brand-bg/40 border-t border-brand-border/50 text-center">
          <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-[0.4]">© 2024 VISO Hotel — Operação Protegida</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
