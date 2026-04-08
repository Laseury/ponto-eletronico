import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, 
  Search, 
  Filter, 
  Users, 
  Clock, 
  Calendar, 
  AlertCircle,
  History,
  ArrowRight
} from 'lucide-react';
import Swal from 'sweetalert2';

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtros, setFiltros] = useState({
        usuario: '',
        acao: '',
        mes: '',
        ano: new Date().getFullYear().toString()
    });

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let url = `/logs?usuario=${filtros.usuario}&acao=${filtros.acao}`;
            if (filtros.mes && filtros.ano) url += `&mes=${filtros.mes}&ano=${filtros.ano}`;
            
            const res = await axios.get(url);
            setLogs(res.data);
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
            Swal.fire('Erro', 'Não foi possível carregar os logs de auditoria.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filtros]);

    const handleFiltroChange = (e) => {
        setFiltros({ ...filtros, [e.target.name]: e.target.value });
    };

    const formatarDataRegistro = (dataStr) => {
        if (!dataStr) return '—';
        try {
            // Se for apenas YYYY-MM-DD
            if (dataStr.length === 10) {
                const [ano, mes, dia] = dataStr.split('-').map(Number);
                return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR');
            }
            // Se for ISO ou objeto
            return new Date(dataStr).toLocaleDateString('pt-BR');
        } catch (e) {
            return '—';
        }
    };

    const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-brand-text tracking-tight flex items-center gap-3">
                        Logs de Auditoria
                        <span className="text-brand-primary">.</span>
                    </h1>
                    <p className="text-brand-muted font-bold mt-1 opacity-70">Histórico de todas as alterações manuais no sistema.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                             <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-xl">
                        <select 
                            name="mes"
                            value={filtros.mes} 
                            onChange={handleFiltroChange}
                            className="bg-slate-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl outline-none appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                        >
                            <option value="">Todos os meses</option>
                            {MESES.map((m, i) => (
                                <option key={i+1} value={i+1}>{m}</option>
                            ))}
                        </select>
                        <select 
                            name="ano"
                            value={filtros.ano} 
                            onChange={handleFiltroChange}
                            className="bg-slate-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl outline-none appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                        >
                            {[2024, 2025, 2026].map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                     </div>
                </div>
            </div>

            {/* Toolbar / Filters */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-wrap items-center gap-8">
                <div className="flex-1 min-w-[250px] relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-muted/50" size={20} />
                    <input 
                        type="text" 
                        name="usuario"
                        placeholder="Filtrar por editor..."
                        value={filtros.usuario}
                        onChange={handleFiltroChange}
                        className="w-full bg-brand-bg border border-brand-border rounded-2xl pl-14 pr-6 py-4 text-base font-black text-brand-text outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-inner"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2.5">
                         <Filter size={18} className="text-brand-muted" />
                         <span className="text-xs font-black text-brand-muted uppercase tracking-widest opacity-60">Ação:</span>
                    </div>
                    <select 
                        name="acao"
                        value={filtros.acao}
                        onChange={handleFiltroChange}
                        className="bg-brand-bg border border-brand-border rounded-2xl px-6 py-4 text-sm font-black text-brand-text outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-inner cursor-pointer"
                    >
                        <option value="">Todas as Ações</option>
                        <option value="criacao">Criação</option>
                        <option value="edicao">Edição</option>
                    </select>
                </div>

                <div className="hidden lg:flex items-center gap-3 px-8 py-3 border-l border-brand-border">
                    <AlertCircle size={20} className="text-brand-primary" />
                    <p className="text-[10px] text-brand-muted font-black uppercase tracking-widest max-w-[220px] leading-tight opacity-60">
                        Monitoramento em tempo real de alterações manuais.
                    </p>
                </div>
            </div>

            {/* Table Content */}
            <div className="bg-brand-surface border border-brand-border rounded-[3rem] overflow-hidden shadow-2xl">
                 <div className="overflow-x-auto overflow-y-auto max-h-[650px] custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-brand-bg border-b border-brand-border">
                                <th className="px-10 py-6 text-[10px] font-black text-brand-muted uppercase tracking-widest opacity-60">Data/Hora</th>
                                <th className="px-6 py-6 text-[10px] font-black text-brand-muted uppercase tracking-widest opacity-60">Editor</th>
                                <th className="px-6 py-6 text-[10px] font-black text-brand-muted uppercase tracking-widest opacity-60">Funcionário</th>
                                <th className="px-6 py-6 text-[10px] font-black text-brand-muted uppercase tracking-widest text-center opacity-60">Ref. Registro</th>
                                <th className="px-6 py-6 text-[10px] font-black text-brand-muted uppercase tracking-widest text-center opacity-60">Ação</th>
                                <th className="px-6 py-6 text-[10px] font-black text-brand-muted uppercase tracking-widest opacity-60">Campo</th>
                                <th className="px-10 py-6 text-[10px] font-black text-brand-muted uppercase tracking-widest text-right whitespace-nowrap opacity-60">De → Para</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/30 bg-brand-surface/40">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-32 text-center">
                                         <div className="flex flex-col items-center gap-5">
                                            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin shadow-xl"></div>
                                            <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Sincronizando Histórico...</p>
                                         </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-32 text-center">
                                         <div className="flex flex-col items-center gap-6 text-slate-600">
                                            <History size={60} className="opacity-10" />
                                            <p className="text-lg font-black uppercase tracking-widest opacity-50">Nenhuma alteração encontrada.</p>
                                         </div>
                                    </td>
                                </tr>
                            ) : logs.map((l, i) => (
                                <tr key={l.id} className="hover:bg-brand-bg transition-colors">
                                    <td className="px-10 py-6">
                                        <p className="text-sm font-black text-brand-text italic">{new Date(l.criado_em).toLocaleDateString('pt-BR')}</p>
                                        <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest opacity-60 mt-1">{new Date(l.criado_em).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</p>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-brand-primary/20 rounded-xl flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-lg shadow-brand-primary/10"><Users size={14}/></div>
                                            <span className="text-base font-black text-brand-text italic tracking-tight">{l.usuario}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-base font-black text-brand-text/70 italic">{l.funcionario}</td>
                                    <td className="px-6 py-6 text-center text-sm font-black text-brand-muted">{formatarDataRegistro(l.data_registro)}</td>
                                    <td className="px-6 py-6 text-center">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border tracking-widest ${
                                            l.acao === 'criacao' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/30' : 'bg-brand-primary/10 text-brand-primary border-brand-primary/30'
                                        }`}>
                                            {l.acao === 'criacao' ? 'Criação' : 'Edição'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 text-[10px] font-black text-brand-muted uppercase tracking-[0.1em] bg-brand-bg/20">{l.campo_alterado || '—'}</td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 font-black text-xs">
                                            <span className="text-rose-400 opacity-60 line-through">{l.valor_anterior || '—'}</span>
                                            {l.valor_novo && <ArrowRight size={14} className="text-brand-muted/40" />}
                                            <span className="text-brand-accent bg-brand-accent/5 px-2 py-1 rounded-md">{l.valor_novo || '—'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};

export default Logs;
