import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  TrendingUp,
  AlertCircle,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const RelatorioGestor = () => {
    const navigate = useNavigate();
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [ano, setAno] = useState(new Date().getFullYear());
    const [dados, setDados] = useState([]);
    const [filtroNome, setFiltroNome] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchRelatorio = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/relatorio/${mes}/${ano}`);
            setDados(res.data);
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível carregar o relatório da equipe.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRelatorio();
    }, [mes, ano]);

    const dadosFiltrados = useMemo(() => {
        return dados.filter(f => f.nome.toLowerCase().includes(filtroNome.toLowerCase()));
    }, [dados, filtroNome]);

    const exportCSV = () => {
        if (dadosFiltrados.length === 0) return;
        const headers = ["Nome", "Tipo", "Dias Trab.", "Eventos", "Faltas", "Extras", "Negativos", "Saldo Mes", "Banco Acum.", "Noturno"];
        const rows = dadosFiltrados.map(f => [
            f.nome, f.tipo, f.dias_trabalhados, f.dias_evento, f.faltas, f.total_extras, f.total_negativos, f.saldo_mes, f.banco_horas, f.total_noturno
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Relatorio_Equipe_${mes}_${ano}.csv`);
        link.click();
    };

    const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-5">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                            Relatório da Equipe
                            <span className="text-blue-600">.</span>
                        </h1>
                        <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest font-black opacity-70">Consolidação de horas e frequência dos seus colaboradores.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                     <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-xl">
                        <select 
                            value={mes} 
                            onChange={(e) => setMes(Number(e.target.value))}
                            className="bg-slate-800 text-white text-sm font-bold px-5 py-3 rounded-xl outline-none appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                        >
                            {MESES.map((m, i) => (
                                <option key={i+1} value={i+1}>{m}</option>
                            ))}
                        </select>
                        <select 
                            value={ano} 
                            onChange={(e) => setAno(Number(e.target.value))}
                            className="bg-slate-800 text-white text-sm font-bold px-5 py-3 rounded-xl outline-none appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                        >
                            {[2024, 2025, 2026].map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                     </div>

                     <button 
                        onClick={exportCSV}
                        disabled={loading || dadosFiltrados.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black py-5 px-10 rounded-2xl shadow-2xl shadow-blue-900/40 transition-all flex items-center gap-3 text-xs uppercase tracking-widest disabled:opacity-50"
                     >
                        <Download size={20} strokeWidth={3} /> Exportar Equipe
                     </button>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col">
                <div className="p-10 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6 bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500 shadow-lg shadow-blue-900/20"><TrendingUp size={24} /></div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Resumo — {MESES[mes-1]} {ano}</h2>
                    </div>
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar colaborador..."
                            value={filtroNome}
                            onChange={(e) => setFiltroNome(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-base font-bold text-white outline-none focus:ring-4 focus:ring-blue-600/20 transition-all shadow-inner"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto overflow-y-auto max-h-[650px] custom-scrollbar bg-slate-950/20">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-slate-950 border-b border-slate-800">
                                <th className="px-10 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Colaborador</th>
                                <th className="px-6 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Tipo</th>
                                <th className="px-6 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Dias Trab.</th>
                                <th className="px-6 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Eventos</th>
                                <th className="px-6 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Faltas</th>
                                <th className="px-6 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center text-emerald-500">Extras</th>
                                <th className="px-6 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center text-rose-500">Negativos</th>
                                <th className="px-6 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Saldo Mês</th>
                                <th className="px-6 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Banco Acum.</th>
                                <th className="px-10 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Noturno</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                            {loading ? (
                                <tr>
                                    <td colSpan="10" className="py-32 text-center">
                                         <div className="flex flex-col items-center gap-6">
                                            <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin shadow-2xl"></div>
                                            <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Processando Dados...</p>
                                         </div>
                                    </td>
                                </tr>
                            ) : dadosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="py-32 text-center">
                                         <div className="flex flex-col items-center gap-6">
                                            <div className="w-20 h-20 bg-slate-800/50 rounded-[2rem] flex items-center justify-center text-slate-700 shadow-inner"><AlertCircle size={40}/></div>
                                            <p className="text-lg font-black text-slate-600 uppercase tracking-widest opacity-50">Nenhum resultado encontrado.</p>
                                         </div>
                                    </td>
                                </tr>
                            ) : dadosFiltrados.map((f, i) => {
                                const corSaldo = f.saldo_mes?.startsWith('+') ? 'text-emerald-400' : f.saldo_mes?.startsWith('-') ? 'text-rose-400' : 'text-slate-500';
                                const corBanco = f.banco_horas?.startsWith('+') ? 'text-emerald-400' : f.banco_horas?.startsWith('-') ? 'text-rose-400' : 'text-slate-500';
                                return (
                                    <tr key={f.id} className="hover:bg-slate-800/40 transition-colors group">
                                        <td className="px-10 py-6">
                                            <Link to={`/funcionario?id=${f.id}&mes=${mes}&ano=${ano}`} className="text-base font-black text-white hover:text-blue-400 flex items-center gap-3 transition-colors italic">
                                                {f.nome}
                                                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                                            </Link>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase inline-block border tracking-widest ${
                                                f.tipo === 'Horista Noturno' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                                                f.tipo === 'Horista' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                                'bg-slate-800 text-slate-500 border-slate-700'
                                            }`}>
                                                {f.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-center text-sm font-black text-slate-300 bg-slate-950/20">{f.dias_trabalhados}</td>
                                        <td className="px-6 py-6 text-center text-sm font-black text-slate-500">{f.dias_evento || 0}</td>
                                        <td className={`px-6 py-6 text-center text-sm font-black ${f.faltas > 0 ? 'text-rose-500 underline decoration-rose-500/30' : 'text-slate-600'}`}>{f.faltas || 0}</td>
                                        <td className="px-6 py-6 text-center text-sm font-black text-emerald-400 bg-emerald-500/5">{f.total_extras}</td>
                                        <td className="px-6 py-6 text-center text-sm font-black text-rose-400 bg-rose-500/5">{f.total_negativos}</td>
                                        <td className={`px-6 py-6 text-center text-base font-black ${corSaldo}`}>{f.saldo_mes}</td>
                                        <td className={`px-6 py-6 text-center text-sm font-bold ${corBanco}`}>{f.banco_horas}</td>
                                        <td className="px-10 py-6 text-center">
                                            {f.total_noturno !== '00:00' ? (
                                                <span className="px-4 py-1.5 rounded-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-black shadow-lg shadow-indigo-900/10">
                                                    {f.total_noturno}
                                                </span>
                                            ) : <span className="text-slate-800 font-bold">—</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RelatorioGestor;
