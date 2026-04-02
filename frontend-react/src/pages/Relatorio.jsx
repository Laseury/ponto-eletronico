import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Search, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const Relatorio = () => {
    const navigate = useNavigate();
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [ano, setAno] = useState(new Date().getFullYear());
    const [valorHora, setValorHora] = useState('');
    const [dados, setDados] = useState([]);
    const [filtroNome, setFiltroNome] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchRelatorio = async () => {
        setLoading(true);
        try {
            const vh = valorHora || 0;
            const res = await axios.get(`/relatorio/${mes}/${ano}?valor_hora=${vh}`);
            setDados(res.data);
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível carregar o relatório mensal.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRelatorio();
    }, [mes, ano, valorHora]);

    const dadosFiltrados = useMemo(() => {
        return dados.filter(f => f.nome.toLowerCase().includes(filtroNome.toLowerCase()));
    }, [dados, filtroNome]);

    const exportCSV = () => {
        if (dadosFiltrados.length === 0) return;
        
        const headers = ["Nome", "Tipo", "Dias Trab.", "Faltas", "Extras", "Negativos", "Saldo", "Banco", "Noturno", "Valor Noturno"];
        const rows = dadosFiltrados.map(f => [
            f.nome, f.tipo, f.dias_trabalhados, f.faltas, f.total_extras, f.total_negativos, f.saldo_mes, f.banco_horas, f.total_noturno, f.valor_noturno
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Relatorio_${mes}_${ano}.csv`);
        link.click();
    };

    const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tight flex items-center gap-3">
                        Relatório Mensal
                        <span className="text-brand-primary">.</span>
                    </h1>
                    <p className="text-brand-muted font-bold mt-1 text-sm opacity-70">Visão consolidada do fechamento de ponto da equipe.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                     {/* Valor Hora Input */}
                     <div className="flex items-center gap-3 bg-brand-surface border border-brand-border p-3 rounded-[1.5rem] shadow-xl">
                        <span className="text-xs font-black text-brand-muted uppercase tracking-widest ml-2 flex items-center gap-2 opacity-60"><DollarSign size={14}/> R$/h:</span>
                        <input 
                            type="number" 
                            step="0.01" 
                            value={valorHora}
                            onChange={(e) => setValorHora(e.target.value)}
                            placeholder="0,00"
                            className="bg-brand-bg border-none rounded-xl px-4 py-3 text-sm font-black text-brand-text w-24 outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-inner"
                        />
                     </div>

                     {/* Date Selectors */}
                     <div className="flex items-center gap-3 bg-brand-surface border border-brand-border p-3 rounded-[1.5rem] shadow-xl">
                        <select 
                            value={mes} 
                            onChange={(e) => setMes(Number(e.target.value))}
                            className="bg-brand-bg text-brand-text text-sm font-black px-5 py-3 rounded-xl outline-none appearance-none cursor-pointer hover:bg-brand-surface transition-all shadow-inner border border-brand-border/50"
                        >
                            {MESES.map((m, i) => (
                                <option key={i+1} value={i+1} className="bg-brand-surface">{m}</option>
                            ))}
                        </select>
                        <select 
                            value={ano} 
                            onChange={(e) => setAno(Number(e.target.value))}
                            className="bg-brand-bg text-brand-text text-sm font-black px-5 py-3 rounded-xl outline-none appearance-none cursor-pointer hover:bg-brand-surface transition-all shadow-inner border border-brand-border/50"
                        >
                            {[2024, 2025, 2026].map(a => (
                                <option key={a} value={a} className="bg-brand-surface">{a}</option>
                            ))}
                        </select>
                     </div>

                     <button 
                        onClick={exportCSV}
                        disabled={loading || dadosFiltrados.length === 0}
                        className="bg-brand-accent hover:bg-brand-accent/90 text-white font-black py-4 px-8 rounded-[1.5rem] shadow-xl shadow-brand-accent/20 transition-all flex items-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50"
                     >
                        <Download size={18} /> Exportar
                     </button>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { label: 'Total Colaboradores', value: dados.length, color: 'text-brand-text' },
                    { label: 'Total Faltas', value: dados.reduce((acc, f) => acc + (f.faltas || 0), 0), color: 'text-rose-500' },
                    { label: 'Saldos Positivos', value: dados.filter(f => f.saldo_mes?.startsWith('+')).length, color: 'text-brand-accent' },
                    { label: 'Saldos Negativos', value: dados.filter(f => f.saldo_mes?.startsWith('-')).length, color: 'text-amber-500' }
                ].map((m, idx) => (
                    <div key={idx} className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xl flex flex-col items-center group hover:border-brand-primary/30 transition-all">
                        <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1.5 opacity-60">{m.label}</p>
                        <p className={`text-2xl font-black ${m.color}`}>{m.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Table Content */}
            <div className="bg-brand-surface border border-brand-border rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 border-b border-brand-border flex flex-col sm:flex-row justify-between items-center gap-6 bg-brand-surface/50">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary"><TrendingUp size={20} /></div>
                        <h2 className="text-xl font-black text-brand-text tracking-tight">Consolidado Mensal — {MESES[mes-1]} {ano}</h2>
                    </div>
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted/50" size={18} />
                        <input 
                            type="text" 
                            placeholder="Pesquisar por nome..."
                            value={filtroNome}
                            onChange={(e) => setFiltroNome(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-border rounded-xl pl-12 pr-6 py-3 text-sm font-black text-brand-text outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all placeholder:text-brand-muted/30 shadow-inner"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto overflow-y-auto max-h-[700px] custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-brand-bg border-b border-brand-border">
                                <th className="px-8 py-5 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] opacity-60">Colaborador</th>
                                <th className="px-6 py-5 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] opacity-60">Tipo</th>
                                <th className="px-6 py-5 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] opacity-60 text-center">Dias</th>
                                <th className="px-6 py-5 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] opacity-60 text-center">Faltas</th>
                                <th className="px-6 py-5 text-[9px] font-black text-brand-accent/80 uppercase tracking-[0.25em] opacity-60 text-center">Extras</th>
                                <th className="px-6 py-5 text-[9px] font-black text-rose-500/80 uppercase tracking-[0.25em] opacity-60 text-center">Neg.</th>
                                <th className="px-6 py-5 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] opacity-60 text-center">Saldo</th>
                                <th className="px-6 py-5 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] opacity-60 text-center">Banco</th>
                                <th className="px-6 py-5 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] opacity-60 text-center">Noturno</th>
                                <th className="px-8 py-5 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] opacity-60 text-right">R$ Not.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/30">
                            {loading ? (
                                <tr>
                                    <td colSpan="10" className="py-40 text-center">
                                         <div className="flex flex-col items-center gap-6">
                                            <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                                            <p className="text-sm font-black text-brand-muted uppercase tracking-widest opacity-60">Compilando Dados de Fechamento...</p>
                                         </div>
                                    </td>
                                </tr>
                            ) : dadosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="py-40 text-center">
                                         <div className="flex flex-col items-center gap-6">
                                            <div className="w-20 h-20 bg-brand-bg rounded-[2rem] flex items-center justify-center text-brand-muted/30 shadow-inner border border-brand-border"><AlertCircle size={40}/></div>
                                            <p className="text-lg font-black text-brand-muted uppercase tracking-widest opacity-30">Nenhum registro para este período.</p>
                                         </div>
                                    </td>
                                </tr>
                            ) : dadosFiltrados.map((f, i) => {
                                const corSaldo = f.saldo_mes?.startsWith('+') ? 'text-brand-accent' : f.saldo_mes?.startsWith('-') ? 'text-rose-400' : 'text-brand-muted';
                                const corBanco = f.banco_horas?.startsWith('+') ? 'text-brand-accent' : f.banco_horas?.startsWith('-') ? 'text-rose-400' : 'text-brand-muted';
                                return (
                                <tr key={f.id} className="hover:bg-brand-bg transition-colors group">
                                        <td className="px-8 py-4">
                                            <Link to={`/funcionario?id=${f.id}`} className="text-sm font-black text-brand-text hover:text-brand-primary flex items-center gap-2 transition-colors italic tracking-tight">
                                                {f.nome}
                                                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-primary" />
                                            </Link>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase inline-block border tracking-widest ${
                                                f.tipo === 'Horista Noturno' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/30' :
                                                f.tipo === 'Horista' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/30' :
                                                'bg-brand-bg text-brand-muted border-brand-border'
                                            }`}>
                                                {f.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-xs font-black text-brand-text bg-brand-bg/20">{f.dias_trabalhados}</td>
                                        <td className={`px-6 py-4 text-center text-xs font-black ${f.faltas > 0 ? 'text-rose-500 underline decoration-rose-500/30' : 'text-brand-muted opacity-30'}`}>{f.faltas || 0}</td>
                                        <td className="px-6 py-4 text-center text-xs font-black text-brand-accent bg-brand-accent/5">{f.total_extras}</td>
                                        <td className="px-6 py-4 text-center text-xs font-black text-rose-400 bg-rose-500/5">{f.total_negativos}</td>
                                        <td className={`px-6 py-4 text-center text-sm font-black ${corSaldo}`}>{f.saldo_mes}</td>
                                        <td className={`px-6 py-4 text-center text-sm font-black ${corBanco} bg-brand-bg/30`}>
                                            <div className="flex flex-col items-center">
                                                <span>{f.banco_horas}</span>
                                                <span className="text-[8px] text-brand-muted font-black uppercase tracking-tighter opacity-50 mt-0.5">Ciclo: {f.ciclo}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {f.total_noturno && f.total_noturno !== '00:00' ? (
                                                <span className="px-3 py-1 rounded-md bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-[11px] font-black shadow-lg shadow-brand-primary/10">
                                                    {f.total_noturno}
                                                </span>
                                            ) : <span className="text-brand-muted opacity-20 font-bold">—</span>}
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <p className={`text-sm font-black ${parseFloat(f.valor_noturno) > 0 ? 'text-brand-accent drop-shadow-sm' : 'text-brand-muted opacity-20'}`}>
                                                {parseFloat(f.valor_noturno) > 0 ? `R$ ${f.valor_noturno}` : '—'}
                                            </p>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Help/Legend Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-brand-surface border border-brand-border rounded-[2.5rem] p-10 shadow-2xl">
                    <h3 className="text-xs font-black text-brand-muted uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                        <Filter size={20} className="text-brand-primary" /> Parâmetros de Cálculo
                    </h3>
                    <div className="space-y-6">
                        <div className="flex gap-6">
                            <div className="w-1.5 h-14 bg-brand-accent rounded-full mt-1 shadow-lg shadow-brand-accent/30"></div>
                            <div>
                                <p className="text-brand-text font-black text-base uppercase tracking-tight">Extras & Adicional Noturno</p>
                                <p className="text-brand-muted text-sm font-medium mt-1 leading-relaxed opacity-80">Extras são calculadas sobre a jornada normal. Horas noturnas (22:00-05:00) recebem fator legal de 60/52.5 aplicado em tempo real.</p>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="w-1.5 h-14 bg-brand-primary rounded-full mt-1 shadow-lg shadow-brand-primary/30"></div>
                            <div>
                                <p className="text-brand-text font-black text-base uppercase tracking-tight">Banco de Horas Ativo</p>
                                <p className="text-brand-muted text-sm font-medium mt-1 leading-relaxed opacity-80">O banco é o acumulado histórico até o ciclo atual. Faltas não justificadas e atrasos são debitados automaticamente do saldo acumulado.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-2xl flex flex-col justify-center items-center text-center group">
                    <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center text-brand-accent mb-4 animate-bounce-slow shadow-inner group-hover:scale-110 transition-transform">
                        <CheckCircle2 size={32} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-brand-text font-black text-xl tracking-tighter">Auditado & Consolidado</h3>
                    <p className="text-brand-muted text-sm mt-3 max-w-xs font-medium leading-relaxed opacity-70">Os dados foram auditados e processados garantindo 100% de conformidade com os registros de ponto originais.</p>
                </div>
            </div>
        </div>
    );
};

export default Relatorio;
