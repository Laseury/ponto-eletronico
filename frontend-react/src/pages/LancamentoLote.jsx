import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Search,
  Check,
  X,
  Send,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const LancamentoLote = () => {
    const navigate = useNavigate();
    const [funcionarios, setFuncionarios] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
    const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);
    const [evento, setEvento] = useState('');
    const [negativoManual, setNegativoManual] = useState('08:00');
    const [selecionados, setSelecionados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        axios.get('/funcionarios')
            .then(res => {
                setFuncionarios(res.data);
                setLoading(false);
            })
            .catch(() => {
                Swal.fire('Erro', 'Não foi possível carregar a lista de funcionários.', 'error');
                setLoading(false);
            });
    }, []);

    const toggleSelecionado = (id) => {
        setSelecionados(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selecionarTodos = () => {
        setSelecionados(funcionarios.map(f => f.id));
    };

    const limparSelecao = () => {
        setSelecionados([]);
    };

    const handleLancarLote = async () => {
        if (!dataInicio || !dataFim || !evento || selecionados.length === 0) {
            Swal.fire('Atenção', 'Selecione as datas, o evento e ao menos um funcionário.', 'warning');
            return;
        }

        const confirm = await Swal.fire({
            title: 'Confirmar Lançamento',
            html: `Deseja lançar "${evento}" para ${selecionados.length} funcionário(s) entre <br><b>${new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')}</b> e <b>${new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR')}</b>?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim, lançar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirm.isConfirmed) return;

        setProcessing(true);
        try {
            await axios.post('/registros/lote-evento', {
                funcionario_ids: selecionados,
                data_inicio: dataInicio,
                data_fim: dataFim,
                evento: evento,
                negativos_manual: evento === 'Falta' ? negativoManual : null
            });
            
            Swal.fire('Sucesso!', 'Lançamentos realizados com sucesso.', 'success');
            setSelecionados([]);
        } catch (error) {
            Swal.fire('Erro!', 'Ocorreu um erro ao processar alguns lançamentos.', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const funcionariosFiltrados = funcionarios.filter(f => 
        f.nome.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-3 bg-brand-surface border border-brand-border rounded-xl text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-all shadow-xl"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-brand-text tracking-tighter flex items-center gap-3 italic">
                            Lançamento em Lote
                            <span className="text-brand-primary">.</span>
                        </h1>
                        <p className="text-brand-muted font-bold mt-0.5 text-xs opacity-60">Aplique o mesmo evento a múltiplos colaboradores.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Config Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-2xl">
                        <h2 className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-4 flex items-center gap-2 opacity-50 italic">
                            <Calendar size={14} className="text-brand-primary" /> Configuração
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 px-1 opacity-40">Data Inicial</label>
                                    <input 
                                        type="date" 
                                        value={dataInicio}
                                        onChange={(e) => setDataInicio(e.target.value)}
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text text-sm font-bold outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-inner"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 px-1 opacity-40">Data Final</label>
                                    <input 
                                        type="date" 
                                        value={dataFim}
                                        onChange={(e) => setDataFim(e.target.value)}
                                        className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text text-sm font-bold outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-widest mb-2 px-1 opacity-40">Tipo de Evento</label>
                                <select 
                                    value={evento}
                                    onChange={(e) => setEvento(e.target.value)}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text text-sm font-bold outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all cursor-pointer shadow-inner"
                                >
                                    <option value="" className="bg-brand-surface">Selecione...</option>
                                    <option value="DSR" className="bg-brand-surface">📆 DSR</option>
                                    <option value="Folga" className="bg-brand-surface">🏖️ Folga</option>
                                    <option value="Folga Banco" className="bg-brand-surface">🏦 Folga Banco</option>
                                    <option value="Falta" className="bg-brand-surface">❌ Falta</option>
                                    <option value="Atestado" className="bg-brand-surface">🏥 Atestado</option>
                                    <option value="Feriado" className="bg-brand-surface">🎉 Feriado</option>
                                    <option value="Ferias" className="bg-brand-surface">🏄 Férias</option>
                                </select>
                            </div>

                            {evento === 'Falta' && (
                                <div className="space-y-3 pt-2">
                                     <label className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest px-1">
                                        <Clock size={14} /> Horas de Falta (Opcional)
                                    </label>
                                    <input 
                                        type="time" 
                                        value={negativoManual}
                                        onChange={(e) => setNegativoManual(e.target.value)}
                                        className="w-full bg-brand-surface border border-rose-500/30 rounded-xl px-4 py-3 text-brand-text text-sm font-bold outline-none focus:ring-4 focus:ring-rose-500/20 transition-all shadow-inner text-center"
                                    />
                                </div>
                            )}

                            <div className="pt-4">
                                <button 
                                    onClick={handleLancarLote}
                                    disabled={processing || selecionados.length === 0}
                                    className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-black py-4 rounded-xl shadow-xl shadow-brand-primary/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 group text-[10px] uppercase tracking-widest font-italic"
                                >
                                    {processing ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            Lançar Permanentemente
                                        </>
                                    )}
                                </button>
                                <p className="mt-4 text-[9px] text-brand-muted font-black text-center uppercase tracking-widest opacity-40">
                                    {selecionados.length} selecionados no período
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tip Card */}
                    <div className="bg-blue-600/5 border border-blue-600/10 rounded-[2rem] p-8 flex gap-5 items-start shadow-xl">
                        <div className="p-3 bg-blue-600/10 rounded-xl text-blue-500"><CheckCircle2 size={24} /></div>
                        <div>
                            <h4 className="text-white font-black text-base">Escala em Lote</h4>
                            <p className="text-slate-500 text-sm mt-2 font-medium leading-relaxed">Ideal para aplicar feriados ou folgas coletivas rapidamente para toda a equipe selecionada.</p>
                        </div>
                    </div>
                </div>

                {/* Selection Section */}
                <div className="lg:col-span-2">
                    <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full max-h-[750px] relative">
                        <div className="p-6 border-b border-brand-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-brand-surface/50">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted opacity-40" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar colaborador..."
                                    value={filtro}
                                    onChange={(e) => setFiltro(e.target.value)}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl pl-11 pr-5 py-3 text-xs font-bold text-brand-text outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-inner"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={selecionarTodos} className="px-5 py-2.5 bg-brand-bg hover:bg-brand-surface text-brand-muted text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border border-brand-border shadow-sm">Todos</button>
                                <button onClick={limparSelecao} className="px-5 py-2.5 bg-brand-bg hover:bg-brand-surface text-brand-muted text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border border-brand-border shadow-sm">Limpar</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-6 custom-scrollbar bg-slate-950/20">
                           {loading ? (
                               <div className="flex flex-col items-center justify-center py-32 gap-6">
                                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin shadow-xl"></div>
                                    <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Sincronizando Lista...</p>
                               </div>
                           ) : (
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   {funcionariosFiltrados.map(f => {
                                       const isSel = selecionados.includes(f.id);
                                       return (
                                           <div 
                                                key={f.id}
                                                onClick={() => toggleSelecionado(f.id)}
                                                className={`p-4 rounded-xl border transition-all cursor-pointer group select-none flex items-center justify-between shadow-lg ${
                                                    isSel 
                                                    ? 'bg-brand-primary/10 border-brand-primary/40 ring-4 ring-brand-primary/5' 
                                                    : 'bg-brand-bg/20 border-brand-border/30 hover:border-brand-primary/30 hover:bg-brand-surface shadow-black/5'
                                                }`}
                                           >
                                               <div className="flex items-center gap-4">
                                                   <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                                                       isSel 
                                                       ? 'bg-brand-primary border-brand-primary/50 text-white shadow-lg shadow-brand-primary/20' 
                                                       : 'bg-brand-bg border-brand-border text-brand-muted opacity-30 group-hover:opacity-60'
                                                   }`}>
                                                       {isSel ? <Check size={20} strokeWidth={3} /> : <Users size={18} />}
                                                   </div>
                                                   <div>
                                                       <p className={`text-sm font-black transition-colors ${isSel ? 'text-brand-text' : 'text-brand-text/70'}`}>{f.nome}</p>
                                                       <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest mt-0.5 opacity-40 italic">{f.tipo}</p>
                                                   </div>
                                               </div>
                                               {!isSel && <div className="w-5 h-5 rounded-lg border-2 border-brand-border group-hover:border-brand-primary/30 transition-all bg-brand-bg/50"></div>}
                                           </div>
                                       );
                                   })}
                               </div>
                           )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LancamentoLote;
