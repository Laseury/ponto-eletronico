import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  ClipboardList, 
  FileStack, 
  Zap, 
  FileText, 
  History, 
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Shield,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const SidebarLink = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        isActive 
          ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
          : 'text-brand-muted hover:bg-brand-surface/50 hover:text-brand-text'
      }`
    }
  >
    <Icon size={18} className="shrink-0 transition-transform group-hover:scale-110" />
    <span className="font-black text-xs uppercase tracking-tight">{label}</span>
    <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
  </NavLink>
);

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const menuItems = {
    Admin: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/funcionarios', icon: Users, label: 'Funcionários' },
      { to: '/lancamento', icon: UserPlus, label: 'Lançamento' },
      { to: '/lancamento-lote', icon: ClipboardList, label: 'Lançamento em Lote' },
      { to: '/eventos-lote', icon: FileStack, label: 'Eventos em Lote' },
      { to: '/relatorios', icon: FileText, label: 'Relatórios' },
      { to: '/usuarios', icon: ShieldCheck, label: 'Gestão de Acessos' },
      { to: '/logs', icon: History, label: 'Logs do Sistema' },
    ],
    RH: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/funcionarios', icon: Users, label: 'Funcionários' },
      { to: '/lancamento', icon: UserPlus, label: 'Lançamento' },
      { to: '/lancamento-lote', icon: ClipboardList, label: 'Lançamento em Lote' },
      { to: '/eventos-lote', icon: FileStack, label: 'Eventos em Lote' },
      { to: '/relatorios', icon: FileText, label: 'Relatórios' },
      { to: '/usuarios', icon: Shield, label: 'Gestão de Acessos' },
    ],
    Gestor: [
      { to: '/dashboard-gestor', icon: LayoutDashboard, label: 'Meu Painel' },
      { to: '/equipe', icon: Users, label: 'Minha Equipe' },
      { to: '/relatorio-equipe', icon: FileText, label: 'Relatórios Equipe' },
    ],
    Contador: [
      { to: '/dashboard-contador', icon: LayoutDashboard, label: 'Painel Contador' },
      { to: '/relatorios', icon: FileText, label: 'Relatórios Fiscais' },
    ],
  };

  let currentMenu = menuItems[user?.perfil] || menuItems[user?.cargo] || [];
  if (user?.perfil !== 'Admin' && user?.cargo !== 'Admin') {
    currentMenu = currentMenu.filter(item => item.to !== '/logs');
  }

  return (
    <aside className="w-72 bg-brand-surface border-r border-brand-border flex flex-col h-screen sticky top-0 transition-colors duration-300">
      {/* Header / Logo */}
      <div className="p-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-lg shadow-brand-primary/40">
            <span className="text-white font-black text-lg italic">V</span>
          </div>
          <div>
            <h2 className="text-brand-text font-black text-lg tracking-tight leading-none mb-0.5">VISO PONTO</h2>
            <p className="text-brand-muted text-[8px] uppercase font-black tracking-widest leading-none opacity-60">Hotelaria & Gestão</p>
          </div>
        </div>

        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-brand-bg border border-brand-border text-brand-muted hover:text-brand-primary hover:border-brand-primary/30 transition-all shadow-inner"
          title="Alternar Tema"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar pt-6">
        <p className="px-5 text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-6 opacity-40">Menu Principal</p>
        
        {currentMenu.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-3 border-t border-brand-border">
        <div className="bg-brand-bg/50 rounded-xl p-3 flex items-center gap-3 mb-3 border border-brand-border shadow-inner">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white font-black text-xs shadow-lg">
            {user?.nome?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-brand-text font-black text-sm truncate leading-tight tracking-tight italic">{user?.nome}</p>
            <p className="text-brand-muted text-[8px] font-black uppercase tracking-widest opacity-60 mt-0.5">{user?.cargo}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200 group border border-transparent hover:border-rose-500/20"
        >
          <LogOut size={18} className="transition-transform group-hover:scale-110" />
          <span className="font-black uppercase tracking-widest text-[10px]">Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
