import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  ClipboardList, 
  FileText, 
  History, 
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  ShieldCheck,
  Clock,
  ArrowRight
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

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const menuItems = {
    Admin: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/funcionarios', icon: Users, label: 'Funcionários' },
      { 
        label: 'Lançamentos', icon: UserPlus,
        subItems: [
          { to: '/lancamento', icon: UserPlus, label: 'Por Funcionário' },
          { to: '/lancamento-lote', icon: ClipboardList, label: 'Lançamento em Lote' }
        ]
      },
      { to: '/relatorios', icon: FileText, label: 'Relatórios' },
      { to: '/usuarios', icon: ShieldCheck, label: 'Gestão de Acessos' },
      { to: '/logs', icon: History, label: 'Logs do Sistema' },
    ],
    RH: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/funcionarios', icon: Users, label: 'Funcionários' },
      { 
        label: 'Lançamentos', icon: UserPlus,
        subItems: [
          { to: '/lancamento', icon: UserPlus, label: 'Por Funcionário' },
          { to: '/lancamento-lote', icon: ClipboardList, label: 'Lançamento em Lote' }
        ]
      },
      { to: '/relatorios', icon: FileText, label: 'Relatórios' },
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

  const location = useLocation();
  const [openMenus, setOpenMenus] = React.useState({});
  
  React.useEffect(() => {
    // Automatically open menu if active
    const newOpenMenus = { ...openMenus };
    let changed = false;
    currentMenu.forEach(item => {
      if (item.subItems) {
        const isActive = item.subItems.some(sub => location.pathname === sub.to);
        if (isActive && !newOpenMenus[item.label]) {
          newOpenMenus[item.label] = true;
          changed = true;
        }
      }
    });
    if (changed) setOpenMenus(newOpenMenus);
  }, [location.pathname, currentMenu]);

  const toggleMenu = (label) => {
    setOpenMenus(prev => ({...prev, [label]: !prev[label]}));
  };

  const showLancarHoras = ['Admin', 'RH'].includes(user?.perfil) || ['Admin', 'RH'].includes(user?.cargo);

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-50
        w-72 bg-brand-surface border-r border-brand-border flex flex-col h-screen 
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Header / Logo */}
        <div className="p-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-lg shadow-brand-primary/40">
              <span className="text-white font-black text-lg italic">V</span>
            </div>
            <div>
              <h2 className="text-brand-text font-black text-lg tracking-tight leading-none mb-0.5">VISO PONTO</h2>
              <p className="text-brand-muted text-[8px] uppercase font-black tracking-widest leading-none opacity-60">Hotelaria &amp; Gestão</p>
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
          
          {currentMenu.map((item) => {
            if (item.subItems) {
              const isOpen = openMenus[item.label];
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isOpen ? 'bg-brand-surface text-brand-primary border border-brand-border shadow-sm' : 'text-brand-muted hover:bg-brand-surface/50 hover:text-brand-text'
                    }`}
                  >
                    <item.icon size={18} className="shrink-0 transition-transform group-hover:scale-110" />
                    <span className="font-black text-xs uppercase tracking-tight">{item.label}</span>
                    <ChevronRight size={14} className={`ml-auto transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="pl-6 space-y-1 mt-1 border-l-2 border-brand-border/50 ml-6 animate-in fade-in slide-in-from-top-2 duration-200">
                      {item.subItems.map(sub => (
                        <SidebarLink key={sub.to} {...sub} />
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return <SidebarLink key={item.to || item.label} {...item} />;
          })}
        </nav>

        {/* ─── Botão de Destaque: Lançar Hora Mês ─── */}
        {showLancarHoras && (
          <div className="px-4 py-3 border-t border-brand-border/50">
            <p className="px-1 text-[9px] font-extrabold text-brand-muted uppercase tracking-[0.2em] mb-2 opacity-40">Ação Rápida</p>
            <button
              onClick={() => navigate('/lancamento-horas')}
              className="group w-full relative overflow-hidden flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-brand-primary to-teal-600 text-white font-bold text-xs uppercase tracking-wide shadow-lg shadow-brand-primary/30 hover:shadow-xl hover:shadow-brand-primary/40 hover:from-emerald-400 hover:to-teal-500 hover:scale-[1.02] transition-all duration-200"
              title="Lançar Horas do Mês em Massa"
            >
              {/* Brilho decorativo */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="p-1.5 bg-white/20 rounded-lg shrink-0 group-hover:bg-white/30 transition-colors">
                <Clock size={15} className="group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div className="flex flex-col items-start leading-tight relative z-10">
                <span className="font-extrabold tracking-wide">Lançar Hora Mês</span>
                <span className="text-[9px] font-medium text-white/70 normal-case tracking-normal mt-0.5">Lançamento em massa</span>
              </div>
              <ArrowRight size={14} className="ml-auto opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 relative z-10" />
            </button>
          </div>
        )}

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
    </>
  );
};

export default Sidebar;
