import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calculator, 
  FileText, 
  Calendar, 
  Users, 
  TrendingUp, 
  AlertCircle,
  Download,
  Info
} from 'lucide-react';
import Swal from 'sweetalert2';

const Contador = () => {
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [ano, setAno] = useState(new Date().getFullYear());
    const [resumo, setResumo] = useState(null);
    const [dados, setDados] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resumoRes, relatorioRes] = await Promise.all([
                axios.get(`/resumo/${mes}/${ano}`),
                axios.get(`/relatorio/${mes}/${ano}`)
            ]);
            setResumo(resumoRes.data);
            setDados(relatorioRes.data);
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível carregar os dados para contabilidade.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [mes, ano]);

    const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tighter flex items-center gap-4">
                        Folha & Contas
                        <span className="text-blue-600">.</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-[0.2em] opacity-60">Exportação e conferência de dados para processamento de folha.</p>
                </div>

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
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl flex flex-col items-center group hover:border-blue-600/30 transition-all shadow-blue-900/5">
                    <div className="p-4 bg-blue-600/10 text-blue-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-900/10">
                        <Users size={32} strokeWidth={2.5} />
                    </div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Total Colaboradores</p>
                    <p className="text-5xl font-black text-white">{resumo?.total_funcionarios || '—'}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl flex flex-col items-center group hover:border-emerald-600/30 transition-all shadow-emerald-900/5">
                    <div className="p-4 bg-emerald-600/10 text-emerald-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-900/10">
                        <TrendingUp size={32} strokeWidth={2.5} />
                    </div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Saldo de Extras (+)</p>
                    <p className="text-5xl font-black text-emerald-500">{resumo?.total_extras || '—'}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl flex flex-col items-center group hover:border-rose-600/30 transition-all shadow-rose-900/5">
                    <div className="p-4 bg-rose-600/10 text-rose-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-rose-900/10">
                        <AlertCircle size={32} strokeWidth={2.5} />
                    </div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Total de Faltas</p>
                    <p className="text-5xl font-black text-rose-500">{resumo?.total_faltas || '—'}</p>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-10 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6 bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-blue-600/10 rounded-2xl text-blue-500 shadow-xl shadow-blue-900/10"><FileText size={28} /></div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Fechamento Consolidado</h2>
                            <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-1 opacity-70">Referência: {MESES[mes-1]} {ano}</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                         <div className="hidden lg:flex flex-col items-end text-right">
                             <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Base de Dados:</p>
                             <p className="text-xs font-black text-slate-400 italic">Ponto Eletrônico VISO HOTEL</p>
                         </div>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar bg-slate-950/20">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950 border-b border-slate-800">
                                <th className="px-10 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Funcionário</th>
                                <th className="px-6 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Tipo</th>
                                <th className="px-6 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Carga Mensal</th>
                                <th className="px-6 py-6 text-xs font-black text-emerald-500/80 uppercase tracking-widest text-center">Extras</th>
                                <th className="px-6 py-6 text-xs font-black text-rose-500/80 uppercase tracking-widest text-center">Negativas</th>
                                <th className="px-6 py-6 text-xs font-black text-indigo-500/80 uppercase tracking-widest text-center">Noturno</th>
                                <th className="px-6 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Faltas</th>
                                <th className="px-10 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Saldo Final</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="py-40 text-center">
                                         <div className="flex flex-col items-center gap-6">
                                            <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin shadow-2xl"></div>
                                            <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Consolidando fechamento mensal...</p>
                                         </div>
                                    </td>
                                </tr>
                            ) : dados.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-40 text-center">
                                         <div className="flex flex-col items-center gap-6 text-slate-700 opacity-20">
                                            <Calculator size={80} strokeWidth={1} />
                                            <p className="text-xl font-black uppercase tracking-[0.3em]">Sem Registros</p>
                                         </div>
                                    </td>
                                </tr>
                            ) : dados.map((f) => {
                                const corSaldo = f.saldo_mes?.startsWith('+') ? 'text-emerald-400' : f.saldo_mes?.startsWith('-') ? 'text-rose-400' : 'text-slate-500';
                                return (
                                    <tr key={f.id} className="hover:bg-slate-800/40 transition-colors group">
                                        <td className="px-10 py-6">
                                            <p className="text-base font-black text-white italic group-hover:text-blue-400 transition-colors">{f.nome}</p>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-950 px-3 py-1 rounded-md border border-slate-800 shadow-inner">{f.tipo}</span>
                                        </td>
                                        <td className="px-6 py-6 text-center text-sm font-black text-slate-400 bg-slate-950/20">{f.carga_mensal || '00:00'}</td>
                                        <td className="px-6 py-6 text-center text-base font-black text-emerald-400 bg-emerald-500/5">{f.total_extras !== '00:00' ? `+${f.total_extras}` : <span className="opacity-10">—</span>}</td>
                                        <td className="px-6 py-6 text-center text-base font-black text-rose-400 bg-rose-500/5">{f.total_negativos !== '00:00' ? `-${f.total_negativos}` : <span className="opacity-10">—</span>}</td>
                                        <td className="px-6 py-6 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-black shadow-lg shadow-indigo-900/10 ${f.total_noturno !== '00:00' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-800 opacity-30 font-bold'}`}>
                                                {f.total_noturno && f.total_noturno !== '00:00' ? f.total_noturno : '——'}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-6 text-center text-base font-black ${f.faltas > 0 ? 'text-rose-500' : 'text-slate-800 opacity-20'}`}>{f.faltas || 0}</td>
                                        <td className={`px-10 py-6 text-right text-base font-black italic ${corSaldo} bg-slate-950/30 shadow-inner`}>{f.saldo_mes}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Accounting Notice */}
            <div className="bg-blue-600/5 border border-blue-600/10 rounded-[3rem] p-10 flex gap-8 items-start shadow-2xl">
                <div className="p-5 bg-blue-600/10 rounded-2xl text-blue-500 shadow-xl shadow-blue-900/10"><Info size={32} /></div>
                <div>
                    <h3 className="text-white font-black text-xl italic tracking-tight">Nota Técnica para a Contabilidade</h3>
                    <p className="text-slate-500 text-base font-medium mt-3 max-w-4xl leading-relaxed">
                        Os dados acima refletem os registros processados digitalmente. As <b className="text-indigo-400">Horas Noturnas</b> já incluem o fator de redução legal (52min 30s). 
                        Os saldos de <b className="text-emerald-400">Extras</b> e <b className="text-rose-400">Negativas</b> são apurados diariamente confrontando a marcação real com a jornada contratual parametrizada. 
                        Este relatório serve como espelho oficial para fins de folha de pagamento.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Contador;
