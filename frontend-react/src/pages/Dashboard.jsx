import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Users, 
  CalendarCheck, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter,
  Edit2,
  ChevronRight,
  TrendingUp,
  UserX
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import swalTheme from '../utils/swalTheme';

const DashboardCard = ({ label, value, icon: Icon, color, trend }) => (
  <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 hover:border-brand-primary/30 transition-all group shadow-md">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
        <Icon size={18} className={color.replace('bg-', 'text-')} />
      </div>
      {trend && (
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase flex items-center gap-1`}>
          <TrendingUp size={10} /> {trend}
        </span>
      )}
    </div>
    <p className="text-brand-muted text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">{label}</p>
    <div className="flex items-baseline gap-2">
      <h3 className="text-2xl font-black text-brand-text tracking-widest">
        {value === 0 ? '0' : (value || '—')}
      </h3>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [resumo, setResumo] = useState({});
  const [funcionarios, setFuncionarios] = useState([]);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Estado para edição rápida
  const [editingFunc, setEditingFunc] = useState(null);
  const [editNome, setEditNome] = useState('');
  const [editTipo, setEditTipo] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [resumoRes, relatorioRes] = await Promise.all([
        axios.get(`/resumo/${mes}/${ano}`),
        axios.get(`/relatorio/${mes}/${ano}`)
      ]);
      setResumo(resumoRes.data || {});
      setFuncionarios(relatorioRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error.response?.data || error.message);
      swalTheme({
        title: 'Erro de Sincronização',
        text: 'Não foi possível carregar os dados completos do painel. Verifique a conexão com o servidor.',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [mes, ano]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const funcionariosFiltrados = funcionarios.filter(f => {
    const bateNome = f.nome.toLowerCase().includes(filtroNome.toLowerCase());
    const bateTipo = !filtroTipo || f.tipo === filtroTipo;
    const bateStatus = (f.ativo !== false) === !mostrarInativos;
    return bateNome && bateTipo && bateStatus;
  });

  const handleInativar = (id, nome) => {
    swalTheme({
      title: 'Tem certeza?',
      text: `Deseja inativar o funcionário ${nome}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, inativar!',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.patch(`/funcionarios/${id}/ativo`);
          swalTheme({ title: 'Inativado!', text: 'Funcionário inativado com sucesso.', icon: 'success' });
          fetchDashboardData();
        } catch (error) {
          swalTheme({ title: 'Erro!', text: 'Não foi possível inativar o funcionário.', icon: 'error' });
        }
      }
    });
  };

  const handleQuickEdit = (f) => {
    setEditingFunc(f);
    setEditNome(f.nome);
    setEditTipo(f.tipo);
  };

  const saveQuickEdit = async () => {
    if (!editNome) return swalTheme({ title: 'Erro', text: 'Nome é obrigatório', icon: 'error' });
    try {
      await axios.put(`/funcionarios/${editingFunc.id}`, { nome: editNome, tipo: editTipo });
      swalTheme({ title: 'Sucesso', text: 'Funcionário atualizado!', icon: 'success' });
      setEditingFunc(null);
      fetchDashboardData();
    } catch (error) {
      swalTheme({ title: 'Erro', text: 'Não foi possível salvar.', icon: 'error' });
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header com Seletores */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-black text-brand-text tracking-tighter flex items-center gap-4">
            Dashboard
            <span className="text-brand-primary">.</span>
          </h1>
          <p className="text-brand-muted font-medium mt-2 text-sm leading-relaxed max-w-2xl opacity-70">
            Bem-vindo de volta, <span className="text-brand-text font-black italic">{user?.nome}</span>. Aqui estão as métricas consolidadas de hoje.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-brand-surface p-2.5 rounded-2xl border border-brand-border shadow-2xl">
          <select 
            value={mes} 
            onChange={(e) => setMes(e.target.value)}
            className="bg-brand-bg text-brand-text text-sm font-black px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-brand-primary/20 outline-none transition-all cursor-pointer border border-brand-border hover:bg-brand-surface"
          >
            {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
              <option key={i+1} value={i+1}>{m}</option>
            ))}
          </select>
          <select 
            value={ano} 
            onChange={(e) => setAno(e.target.value)}
            className="bg-brand-bg text-brand-text text-base font-black px-6 py-4 rounded-2xl focus:ring-4 focus:ring-brand-primary/20 outline-none transition-all cursor-pointer border border-brand-border hover:bg-brand-surface"
          >
            {[2024, 2025, 2026].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <DashboardCard label="Funcionários" value={resumo.total_funcionarios} icon={Users} color="bg-brand-primary" />
        <DashboardCard label="Lançados Hoje" value={resumo.lancados_hoje} icon={CalendarCheck} color="bg-brand-accent" trend="Alta" />
        <DashboardCard label="Extras Mês" value={resumo.total_extras} icon={Clock} color="bg-brand-primary" />
        <DashboardCard label="Feriados Mês" value={resumo.total_feriados} icon={CalendarCheck} color="bg-emerald-500" />
        <DashboardCard label="Faltas Mês" value={resumo.total_faltas} icon={AlertTriangle} color="bg-orange-500" />
        <DashboardCard label="Func. c/ Lacuna" value={resumo.funcs_com_lacuna} icon={Search} color="bg-rose-500" />
        <DashboardCard label="Dias s/ Reg." value={resumo.total_dias_lacuna} icon={AlertTriangle} color="bg-amber-500" />
      </div>

      {/* Lista de Funcionários */}
      <div className="bg-brand-surface border border-brand-border rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <h2 className="text-2xl font-black text-brand-text flex items-center gap-4">
            Gestão de Pessoal
            <span className="text-[10px] font-black px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary uppercase tracking-widest border border-brand-primary/20">
              {funcionariosFiltrados.length} Registros
            </span>
          </h2>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 bg-brand-bg px-6 py-3.5 rounded-2xl border border-brand-border group focus-within:border-brand-primary focus-within:ring-4 focus-within:ring-brand-primary/10 transition-all shadow-inner">
              <Search size={20} className="text-brand-muted group-focus-within:text-brand-primary" />
              <input 
                type="text" 
                placeholder="Buscar por nome..." 
                className="bg-transparent border-none focus:outline-none text-brand-text text-base font-bold placeholder-brand-muted/40 w-64"
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
              />
            </div>

            <select 
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="bg-brand-bg text-brand-text text-sm font-black px-6 py-3.5 rounded-2xl border border-brand-border outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all cursor-pointer shadow-lg"
            >
              <option value="">Filtrar Todos</option>
              <option value="Mensalista" className="bg-brand-surface">Mensalista</option>
              <option value="Horista" className="bg-brand-surface">Horista</option>
              <option value="Horista Noturno" className="bg-brand-surface">Horista Noturno</option>
            </select>

            <button 
              onClick={() => setMostrarInativos(!mostrarInativos)}
              className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl border transition-all text-sm font-black uppercase tracking-[0.1em] shadow-lg ${
                mostrarInativos 
                  ? 'bg-rose-500 border-rose-500 text-white shadow-rose-500/40' 
                  : 'bg-brand-bg border-brand-border text-brand-muted hover:text-brand-text hover:bg-brand-surface'
              }`}
            >
              <UserX size={18} /> 
              {mostrarInativos ? 'Ver Ativos' : 'Ver Inativos'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center gap-5">
            <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
            <p className="text-brand-muted font-black uppercase tracking-widest text-[10px] opacity-60">Sincronizando Dados...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {funcionariosFiltrados.map((f) => {
              const saldoNegativo = f.saldo_mes?.startsWith('-');
              const criticalBank = saldoNegativo && parseInt(f.saldo_mes.split(':')[0]) <= -5; // +- 5h
              
              return (
                <div 
                  key={f.id} 
                  className={`group relative bg-brand-bg/40 border-[1px] rounded-2xl p-6 hover:bg-brand-bg transition-all cursor-pointer shadow-md active:scale-[0.98] ${
                    criticalBank ? 'border-rose-500/30' : 'border-brand-border'
                  }`}
                  onClick={() => window.location.href = `/funcionario?id=${f.id}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-brand-text font-black text-lg group-hover:text-brand-primary transition-colors tracking-tight italic">{f.nome}</h4>
                      <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wider mt-0.5 opacity-60">{f.tipo}</p>
                    </div>
                    {f.ativo === false && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase border border-rose-500/20">Inativo</span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-brand-surface border border-brand-border/50 p-5 rounded-[2rem] text-center shadow-inner">
                      <p className="text-brand-muted text-[10px] uppercase font-black tracking-widest mb-2 opacity-60">Saldo</p>
                      <p className={`text-lg font-black ${saldoNegativo ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {f.saldo_mes || '00:00'}
                      </p>
                    </div>
                    <div className="bg-brand-surface border border-brand-border/50 p-5 rounded-[2rem] text-center shadow-inner">
                      <p className="text-brand-muted text-[10px] uppercase font-black tracking-widest mb-2 opacity-60">Faltas</p>
                      <p className={`text-lg font-black ${f.faltas > 0 ? 'text-rose-400' : 'text-brand-text'}`}>
                        {f.faltas || 0}
                      </p>
                    </div>
                    <div className="bg-brand-surface border border-brand-border/50 p-5 rounded-[2rem] text-center shadow-inner">
                      <p className="text-brand-muted text-[10px] uppercase font-black tracking-widest mb-2 opacity-60">Pres.</p>
                      <p className="text-lg font-black text-brand-text">{f.dias_trabalhados || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-6 border-t border-brand-border/50">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleQuickEdit(f); }}
                      className="p-3 text-brand-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-2xl transition-all"
                    >
                      <Edit2 size={20} />
                    </button>
                    <div className="flex items-center gap-1.5 text-brand-muted group-hover:text-brand-primary transition-colors">
                      <span className="text-xs font-black uppercase tracking-widest">Ver Detalhes</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                  
                  {criticalBank && (
                    <div className="absolute -top-3 -right-2 bg-rose-600 text-white text-[10px] font-black px-4 py-1.5 rounded-xl shadow-2xl shadow-rose-900/40 animate-pulse border-2 border-slate-900">
                      BANCO CRÍTICO
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Edição Rápida */}
      {editingFunc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0 bg-brand-bg/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-brand-surface border border-brand-border w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                <h3 className="text-2xl font-black text-brand-text mb-8">Editar Funcionário</h3>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-brand-muted uppercase tracking-widest ml-1">Nome Completo</label>
                        <input 
                            type="text" 
                            className="w-full bg-brand-bg border border-brand-border rounded-2xl px-6 py-4 text-brand-text text-base font-bold focus:ring-4 focus:ring-brand-primary/20 outline-none transition-all shadow-inner"
                            value={editNome}
                            onChange={(e) => setEditNome(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-brand-muted uppercase tracking-widest ml-1">Tipo de Contrato</label>
                        <select 
                            className="w-full bg-brand-bg border border-brand-border rounded-2xl px-6 py-4 text-brand-text text-base font-bold focus:ring-4 focus:ring-brand-primary/20 outline-none transition-all shadow-inner appearance-none cursor-pointer"
                            value={editTipo}
                            onChange={(e) => setEditTipo(e.target.value)}
                        >
                            <option value="Mensalista" className="bg-brand-surface">Mensalista</option>
                            <option value="Horista" className="bg-brand-surface">Horista</option>
                            <option value="Horista Noturno" className="bg-brand-surface">Horista Noturno</option>
                        </select>
                    </div>
                    <div className="flex gap-4 pt-6">
                        <button 
                            onClick={() => setEditingFunc(null)}
                            className="flex-1 bg-brand-bg hover:bg-brand-surface text-brand-muted font-black py-4 rounded-2xl transition-all uppercase text-xs border border-brand-border"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={saveQuickEdit}
                            className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white font-black py-4 rounded-2xl shadow-xl shadow-brand-primary/20 transition-all uppercase text-xs"
                        >
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
