import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Users, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Search, 
  CheckCircle2, 
  TrendingUp,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const StatCard = ({ label, value, color, icon: Icon }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-xl flex flex-col items-start gap-4 hover:border-slate-700 transition-all group">
    <div className={`p-3 rounded-2xl ${color.bg} ${color.text} group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
    </div>
    <div>
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <p className={`text-5xl font-black mt-2 ${color.textVal || 'text-white'}`}>{value || '—'}</p>
    </div>
  </div>
);

const EmployeeCard = ({ funcionario, onClick }) => {
  const corSaldo = funcionario.saldo_mes?.startsWith('+') ? 'text-emerald-400' : funcionario.saldo_mes?.startsWith('-') ? 'text-rose-400' : 'text-slate-500';
  const corFaltas = (funcionario.faltas || 0) > 0 ? 'text-rose-500' : 'text-slate-500';
  
  // Banco crítico (> 5h negativas)
  const isCritico = funcionario.saldo_mes?.startsWith('-') && parseInt(funcionario.saldo_mes.split(':')[0]) <= -5;

  return (
    <div 
        onClick={onClick}
        className={`bg-slate-900 border p-8 rounded-[2.5rem] shadow-xl hover:border-blue-600/50 transition-all cursor-pointer group relative overflow-hidden ${isCritico ? 'border-rose-900/30 ring-4 ring-rose-500/5' : 'border-slate-800'}`}
    >
        {isCritico && (
            <div className="absolute top-0 right-0 p-5">
                <span className="bg-rose-500/20 text-rose-500 text-[10px] font-black uppercase px-3 py-1 rounded-lg border border-rose-500/30 animate-pulse tracking-widest shadow-lg shadow-rose-950/20">Crítico</span>
            </div>
        )}
        
        <div className="flex flex-col gap-2 mb-8">
            <h3 className="text-white font-black text-xl group-hover:text-blue-500 transition-colors uppercase tracking-tight truncate pr-14">{funcionario.nome}</h3>
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest bg-slate-950/50 px-3 py-1 rounded-lg self-start">{funcionario.tipo}</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950/50 rounded-2xl p-4 flex flex-col items-center border border-slate-800/50 shadow-inner">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-tighter">Saldo</p>
                <p className={`text-base font-black ${corSaldo}`}>{funcionario.saldo_mes}</p>
            </div>
            <div className="bg-slate-950/50 rounded-2xl p-4 flex flex-col items-center border border-slate-800/50 shadow-inner">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-tighter">Faltas</p>
                <p className={`text-base font-black ${corFaltas}`}>{funcionario.faltas || 0}</p>
            </div>
            <div className="bg-slate-950/50 rounded-2xl p-4 flex flex-col items-center border border-slate-800/50 shadow-inner">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-tighter">D. Trab</p>
                <p className="text-base font-black text-slate-300">{funcionario.dias_trabalhados || 0}</p>
            </div>
        </div>
    </div>
  );
};

const GestorDashboard = () => {
  const navigate = useNavigate();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [resumo, setResumo] = useState(null);
  const [funcionarios, setFuncionarios] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [resumoRes, funcsRes] = await Promise.all([
        axios.get(`/resumo/${mes}/${ano}`),
        axios.get(`/relatorio/${mes}/${ano}`)
      ]);
      setResumo(resumoRes.data);
      setFuncionarios(funcsRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      Swal.fire({
          title: 'Erro!',
          text: 'Não foi possível sincronizar os dados do mês.',
          icon: 'error',
          confirmButtonColor: '#2563eb'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [mes, ano]);

  const funcionariosFiltrados = useMemo(() => {
    return funcionarios.filter(f => f.nome.toLowerCase().includes(filtro.toLowerCase()));
  }, [funcionarios, filtro]);

  const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            Dashboard Gestão
            <span className="text-blue-600">.</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Acompanhamento de ponto da sua equipe.</p>
        </div>

        <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-xl">
            <select 
                value={mes} 
                onChange={(e) => setMes(Number(e.target.value))}
                className="bg-slate-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl outline-none appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
            >
                {MESES.map((m, i) => (
                    <option key={i+1} value={i+1}>{m}</option>
                ))}
            </select>
            <select 
                value={ano} 
                onChange={(e) => setAno(Number(e.target.value))}
                className="bg-slate-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl outline-none appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
            >
                {[2024, 2025, 2026].map(a => (
                    <option key={a} value={a}>{a}</option>
                ))}
            </select>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            label="Minha Equipe" 
            value={resumo?.total_funcionarios} 
            icon={Users} 
            color={{bg: 'bg-blue-500/10', text: 'text-blue-500'}} 
        />
        <StatCard 
            label="Batidas Hoje" 
            value={resumo?.lancados_hoje} 
            icon={CheckCircle2} 
            color={{bg: 'bg-emerald-500/10', text: 'text-emerald-500'}} 
        />
        <StatCard 
            label="Extras Acumuladas" 
            value={resumo?.total_extras} 
            icon={TrendingUp} 
            color={{bg: 'bg-amber-500/10', text: 'text-amber-500', textVal: 'text-amber-400'}} 
        />
        <StatCard 
            label="Faltas Período" 
            value={resumo?.total_faltas} 
            icon={AlertCircle} 
            color={{bg: 'bg-rose-500/10', text: 'text-rose-500', textVal: 'text-rose-500'}} 
        />
      </div>

      {/* Team Management Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800 gap-4">
            <h2 className="text-xl font-black text-white flex items-center gap-3 ml-2">
                <Users className="text-blue-500" size={24} />
                Colaboradores
            </h2>
            <div className="relative w-full sm:w-96">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                    type="text" 
                    placeholder="Filtrar por nome..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-base font-bold text-white outline-none focus:ring-4 focus:ring-blue-600/20 transition-all shadow-inner"
                />
            </div>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                 <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sincronizando Equipe...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {funcionariosFiltrados.map(f => (
                    <EmployeeCard 
                        key={f.id} 
                        funcionario={f} 
                        onClick={() => navigate(`/funcionario?id=${f.id}&mes=${mes}&ano=${ano}`)}
                    />
                ))}
            </div>
        )}
      </div>

      {/* Info Banner */}
      {!loading && funcionarios.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
              <div className="p-4 bg-blue-600/10 rounded-full text-blue-500">
                  <Info size={32} />
              </div>
              <div className="text-center md:text-left flex-1">
                  <h4 className="text-white font-black text-lg">Modo de Visualização Gestor</h4>
                  <p className="text-slate-500 text-sm font-medium mt-1">Você tem acesso total aos registros e métricas de ponto da sua equipe. Para alterações oficiais, entre em contato com o RH.</p>
              </div>
              <button 
                onClick={() => navigate('/relatorio-equipe')}
                className="bg-slate-800 hover:bg-slate-700 text-white font-black px-8 py-4 rounded-2xl transition-all"
              >
                  Ver Relatório Completo
              </button>
          </div>
      )}
    </div>
  );
};

export default GestorDashboard;
