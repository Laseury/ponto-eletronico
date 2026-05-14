import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Users, Clock, AlertTriangle, Calendar, Search, CheckCircle2, TrendingUp,
  TrendingDown, X, Eye, ChevronRight, Moon, Loader2, FileText, MessageSquare,
  AlertCircle, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from '../../utils/toast';

// ── Avatar helpers ──────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',  'from-indigo-500 to-blue-600',
  'from-teal-500 to-green-600',    'from-fuchsia-500 to-violet-600',
];
const getAvatarColor = (nome = '') => {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};
const getInitials = (nome = '') => {
  const p = nome.trim().split(' ').filter(Boolean);
  if (!p.length) return '?';
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length-1][0]).toUpperCase();
};

// ── Saldo helpers ────────────────────────────────────────────────────────────
const parseSaldoMin = (s = '') => {
  if (!s) return 0;
  const neg = s.startsWith('-');
  const [h, m] = s.replace('-','').split(':').map(Number);
  return (neg ? -1 : 1) * ((h||0)*60 + (m||0));
};

// ── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 animate-pulse">
    <div className="flex gap-3 mb-5">
      <div className="w-12 h-12 rounded-2xl bg-slate-800" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-4 bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-800/60 rounded w-1/2" />
      </div>
    </div>
    <div className="grid grid-cols-4 gap-2 mb-4">
      {[1,2,3,4].map(i => <div key={i} className="h-14 bg-slate-800/60 rounded-2xl" />)}
    </div>
    <div className="h-10 bg-slate-800/40 rounded-2xl" />
  </div>
);

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, colorCls, valueCls }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl hover:border-slate-700 transition-all group">
    <div className={`inline-flex p-3 rounded-2xl ${colorCls} mb-4 group-hover:scale-110 transition-transform`}>
      <Icon size={22} />
    </div>
    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-4xl font-black ${valueCls || 'text-white'}`}>{value ?? '—'}</p>
  </div>
);

// ── Employee Card ────────────────────────────────────────────────────────────
const EmployeeCard = ({ f, mes, ano, onViewMirror }) => {
  const saldoMin = parseSaldoMin(f.saldo_mes);
  const bancoMin = parseSaldoMin(f.banco_horas);
  const isCrit   = saldoMin < -120;
  const isWarn   = saldoMin < 0 && saldoMin >= -120;
  const isGood   = saldoMin >= 120;
  const navigate = useNavigate();

  const borderCls = isCrit ? 'border-rose-500/40' : isWarn ? 'border-amber-500/40' : isGood ? 'border-emerald-500/30' : 'border-slate-800';
  const glowCls   = isCrit ? 'shadow-rose-500/10'  : isWarn ? 'shadow-amber-500/10'  : isGood ? 'shadow-emerald-500/10' : '';

  return (
    <div className={`relative bg-slate-900 border ${borderCls} rounded-3xl p-6 shadow-xl ${glowCls} hover:border-blue-600/40 transition-all group flex flex-col gap-5`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarColor(f.nome)} flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-lg`}>
          {getInitials(f.nome)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-black text-base truncate group-hover:text-blue-400 transition-colors">{f.nome}</h3>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{f.tipo}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isCrit && <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-widest animate-pulse">Crítico</span>}
          {isWarn && !isCrit && <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest">Atenção</span>}
          {f.tipo?.includes('Noturno') && <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest flex items-center gap-1"><Moon size={8}/>Noturno</span>}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Saldo', val: f.saldo_mes || '00:00', color: saldoMin < 0 ? 'text-rose-400' : saldoMin > 0 ? 'text-emerald-400' : 'text-slate-500' },
          { label: 'Banco', val: f.banco_horas || '00:00', color: bancoMin < 0 ? 'text-rose-400' : bancoMin > 0 ? 'text-emerald-400' : 'text-slate-500' },
          { label: 'Faltas', val: f.faltas || 0, color: (f.faltas||0) > 0 ? 'text-rose-400' : 'text-slate-500' },
          { label: 'Pres.', val: f.dias_trabalhados || 0, color: 'text-slate-300' },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-slate-950/60 border border-slate-800/50 rounded-2xl p-3 text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter mb-1">{label}</p>
            <p className={`text-sm font-black ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Extra info */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-3 py-2 flex items-center justify-between">
          <span className="text-slate-500 font-black uppercase">Extras</span>
          <span className="text-emerald-400 font-black">{f.total_extras || '00:00'}</span>
        </div>
        <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl px-3 py-2 flex items-center justify-between">
          <span className="text-slate-500 font-black uppercase">Negativos</span>
          <span className="text-rose-400 font-black">{f.total_negativos || '00:00'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-slate-800/60">
        <button
          onClick={() => onViewMirror(f)}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl transition-all"
        >
          <Eye size={13} /> Espelho
        </button>
        <button
          onClick={() => navigate(`/funcionario?id=${f.id}&mes=${mes}&ano=${ano}`)}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl transition-all border border-blue-600/20 hover:border-blue-600"
        >
          <ChevronRight size={13} /> Detalhes
        </button>
      </div>
    </div>
  );
};

// ── Mirror Modal ─────────────────────────────────────────────────────────────
const MirrorModal = ({ func, mes, ano, onClose }) => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading]   = useState(true);

  const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`/registros/${func.id}?mes=${mes}&ano=${ano}`);
        setRegistros(res.data || []);
      } catch { toast.error('Erro ao carregar espelho.'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [func.id, mes, ano]);

  const formatH = (v) => v || '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(func.nome)} flex items-center justify-center text-white font-black text-sm`}>
              {getInitials(func.nome)}
            </div>
            <div>
              <h2 className="text-white font-black text-base">{func.nome}</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{MESES[mes-1]} {ano} · Espelho de Ponto</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"><X size={18}/></button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <Loader2 size={24} className="text-blue-500 animate-spin" />
              <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Carregando...</span>
            </div>
          ) : registros.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <FileText size={32} className="text-slate-700" />
              <p className="text-slate-600 text-xs font-black uppercase">Nenhum registro encontrado.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-950 border-b border-slate-800">
                <tr>
                  {['Data','E1','S1','E2','S2','Total','Extras','Evento'].map(h => (
                    <th key={h} className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {registros.map(r => {
                  const extrasMin = r.evento === 'Feriado' ? 0 : (r.extras ? parseInt(r.extras.replace('-','').split(':')[0])*60 + parseInt((r.extras.replace('-','').split(':')[1]||'0')) : 0);
                  return (
                    <tr key={r.data} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-black text-slate-300">{r.data ? new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{formatH(r.e1)}</td>
                      <td className="px-4 py-3 text-slate-400">{formatH(r.s1)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatH(r.e2)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatH(r.s2)}</td>
                      <td className="px-4 py-3 font-black text-white">{formatH(r.total)}</td>
                      <td className="px-4 py-3">
                        {r.evento === 'Feriado' ? (
                          <span className="text-slate-500">00:00</span>
                        ) : r.extras ? (
                          <span className={r.extras.startsWith('-') ? 'text-rose-400' : 'text-emerald-400'}>{r.extras}</span>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.evento && (
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${r.evento === 'Falta' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{r.evento}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer stats */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 grid grid-cols-3 gap-4">
          {[
            { label: 'Saldo do Mês', val: func.saldo_mes, color: parseSaldoMin(func.saldo_mes) < 0 ? 'text-rose-400' : 'text-emerald-400' },
            { label: 'Banco Acumulado', val: func.banco_horas, color: parseSaldoMin(func.banco_horas) < 0 ? 'text-rose-400' : 'text-emerald-400' },
            { label: 'Faltas no Mês', val: func.faltas || 0, color: (func.faltas||0) > 0 ? 'text-rose-400' : 'text-slate-500' },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-center">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{label}</p>
              <p className={`text-lg font-black ${color}`}>{val || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const GestorDashboard = () => {
  const navigate = useNavigate();
  const [mes, setMes]           = useState(new Date().getMonth() + 1);
  const [ano, setAno]           = useState(new Date().getFullYear());
  const [resumo, setResumo]     = useState(null);
  const [funcionarios, setFuncionarios] = useState([]);
  const [filtro, setFiltro]     = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos'); // todos | critico | atencao | ok
  const [loading, setLoading]   = useState(true);
  const [mirrorFunc, setMirrorFunc] = useState(null);

  const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, fRes] = await Promise.all([
        axios.get(`/resumo/${mes}/${ano}`),
        axios.get(`/relatorio/${mes}/${ano}`)
      ]);
      setResumo(rRes.data);
      setFuncionarios(fRes.data || []);
    } catch {
      toast.error('Não foi possível sincronizar os dados.');
    } finally {
      setLoading(false);
    }
  }, [mes, ano]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const listaFiltrada = useMemo(() => {
    return funcionarios
      .filter(f => f.nome.toLowerCase().includes(filtro.toLowerCase()))
      .filter(f => {
        const s = parseSaldoMin(f.saldo_mes);
        if (filtroStatus === 'critico') return s < -120;
        if (filtroStatus === 'atencao') return s < 0 && s >= -120;
        if (filtroStatus === 'ok')      return s >= 0;
        return true;
      });
  }, [funcionarios, filtro, filtroStatus]);

  // Alertas computados
  const alertas = useMemo(() => {
    const criticos = funcionarios.filter(f => parseSaldoMin(f.saldo_mes) < -120);
    const comFalta = funcionarios.filter(f => (f.faltas||0) > 0);
    return { criticos, comFalta };
  }, [funcionarios]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            Dashboard Gestão<span className="text-blue-500">.</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Acompanhamento em tempo real da sua equipe.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-xl">
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="bg-slate-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl outline-none cursor-pointer hover:bg-slate-700 transition-colors">
            {MESES.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={ano} onChange={e => setAno(Number(e.target.value))} className="bg-slate-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl outline-none cursor-pointer hover:bg-slate-700 transition-colors">
            {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Equipe" value={resumo?.total_funcionarios} icon={Users} colorCls="bg-blue-500/10 text-blue-500" />
        <StatCard label="Batidas Hoje" value={resumo?.lancados_hoje} icon={CheckCircle2} colorCls="bg-emerald-500/10 text-emerald-500" />
        <StatCard label="Extras Acum." value={resumo?.total_extras} icon={TrendingUp} colorCls="bg-amber-500/10 text-amber-500" valueCls="text-amber-400" />
        <StatCard label="Faltas Mês" value={resumo?.total_faltas} icon={AlertTriangle} colorCls="bg-rose-500/10 text-rose-500" valueCls="text-rose-400" />
      </div>

      {/* ── Alertas ── */}
      {!loading && (alertas.criticos.length > 0 || alertas.comFalta.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alertas.criticos.length > 0 && (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 flex items-start gap-4">
              <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 flex-shrink-0"><AlertCircle size={20}/></div>
              <div>
                <p className="text-rose-400 font-black text-sm uppercase tracking-widest">⚠ Banco Crítico</p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  {alertas.criticos.map(f => f.nome.split(' ')[0]).join(', ')} com saldo negativo acima de 2h.
                </p>
              </div>
              <button onClick={() => setFiltroStatus('critico')} className="ml-auto text-[10px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-widest whitespace-nowrap">Ver →</button>
            </div>
          )}
          {alertas.comFalta.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 flex-shrink-0"><Calendar size={20}/></div>
              <div>
                <p className="text-amber-400 font-black text-sm uppercase tracking-widest">📋 Faltas Registradas</p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  {alertas.comFalta.length} colaborador(es) com falta(s) no período selecionado.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Team Section ── */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Users className="text-blue-500" size={20}/> Colaboradores
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 ml-1">{listaFiltrada.length}</span>
          </h2>
          <div className="flex gap-3 flex-wrap justify-end">
            {/* Filtro status */}
            <div className="flex gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
              {[['todos','Todos'],['critico','Crítico'],['atencao','Atenção'],['ok','OK']].map(([v,l]) => (
                <button key={v} onClick={() => setFiltroStatus(v)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filtroStatus === v ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                  {l}
                </button>
              ))}
            </div>
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
              <input
                type="text"
                placeholder="Filtrar por nome..."
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-600/30 transition-all w-52"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({length: 6}).map((_,i) => <Skeleton key={i}/>)}
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <AlertCircle size={40} className="text-slate-700"/>
            <p className="text-slate-600 text-sm font-black uppercase tracking-widest">Nenhum colaborador encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 pb-10">
            {listaFiltrada.map(f => (
              <EmployeeCard key={f.id} f={f} mes={mes} ano={ano} onViewMirror={setMirrorFunc}/>
            ))}
          </div>
        )}
      </div>

      {/* ── Mirror Modal ── */}
      {mirrorFunc && (
        <MirrorModal func={mirrorFunc} mes={mes} ano={ano} onClose={() => setMirrorFunc(null)}/>
      )}
    </div>
  );
};

export default GestorDashboard;
