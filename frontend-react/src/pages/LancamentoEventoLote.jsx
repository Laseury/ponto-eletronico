import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CalendarRange, 
  Users, 
  ArrowLeft, 
  Save, 
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import swalTheme from '../utils/swalTheme';
import { useAuth } from '../context/AuthContext';

const LancamentoEventoLote = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [funcionarios, setFuncionarios] = useState([]);
    const [fId, setFId] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [evento, setEvento] = useState('');
    const [negativoManual, setNegativoManual] = useState('08:00');
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

    const handleLancar = async (e) => {
        e.preventDefault();
        if (!fId || !dataInicio || !dataFim || !evento) {
            return swalTheme({ title: 'Atenção', text: 'Preencha todos os campos.', icon: 'warning' });
        }

        const confirm = await swalTheme({
            title: 'Confirmar Lançamento por Período',
            html: `Deseja lançar <b>${evento}</b> para este colaborador entre <b>${new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')}</b> e <b>${new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR')}</b>?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Sim, confirmar',
            cancelButtonColor: '#6b7280',
            cancelButtonText: 'Cancelar'
        });

        if (!confirm.isConfirmed) return;

        setProcessing(true);
        try {
            await axios.post('/registros/evento-lote', { 
                funcionario_id: fId, 
                dataInicio, 
                dataFim, 
                evento,
                negativos_manual: evento === 'Falta' ? negativoManual : null
            }, {
                headers: { 'x-usuario': user?.usuario || 'admin' }
            });

            swalTheme({ title: 'Sucesso!', text: 'Evento lançado com sucesso.', icon: 'success' });
            navigate('/dashboard');
        } catch (error) {
            const errorMsg = error.response?.data?.erro || 'Não foi possível completar o lançamento.';
            swalTheme({ title: 'Erro!', text: errorMsg, icon: 'error' });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-3 bg-brand-surface border border-brand-border rounded-2xl text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-all shadow-xl"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-brand-text tracking-tighter flex items-center gap-3 italic">
                            Lançamento por Período
                            <span className="text-brand-primary">.</span>
                        </h1>
                        <p className="text-brand-muted font-bold mt-0.5 text-xs opacity-60">Lance férias, atestados ou faltas para um intervalo.</p>
                    </div>
                </div>
            </div>

            <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:opacity-10 transition-opacity">
                    <CalendarRange size={160} />
                </div>

                <form onSubmit={handleLancar} className="space-y-8 relative z-10">
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1 opacity-40">
                            <Users size={14} className="text-brand-primary" /> 1. Colaborador
                        </label>
                        <select 
                            value={fId}
                            onChange={(e) => setFId(e.target.value)}
                            className="w-full md:w-1/2 bg-brand-bg border border-brand-border rounded-xl px-5 py-3.5 text-brand-text text-sm font-black outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all appearance-none cursor-pointer shadow-inner"
                            required
                        >
                            <option value="" className="bg-brand-surface">Selecionar...</option>
                            {funcionarios.map(f => (
                                <option key={f.id} value={f.id} className="bg-brand-surface">{f.nome} — {f.tipo}</option>
                            ))}
                        </select>
                    </div>

                    {/* Section 2: Period & Event */}
                    <div className="space-y-6">
                        <label className="flex items-center gap-2 text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1 opacity-40">
                            <Calendar size={14} className="text-brand-primary" /> 2. Período e Evento
                        </label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1 opacity-30">Início</label>
                                <input 
                                    type="date" 
                                    value={dataInicio}
                                    onChange={(e) => setDataInicio(e.target.value)}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text text-xs font-black outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-inner"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1 opacity-30">Final</label>
                                <input 
                                    type="date" 
                                    value={dataFim}
                                    onChange={(e) => setDataFim(e.target.value)}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text text-xs font-black outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-inner"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1 opacity-30">Evento</label>
                                <select 
                                    value={evento}
                                    onChange={(e) => setEvento(e.target.value)}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text text-xs font-black outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all cursor-pointer shadow-inner"
                                    required
                                >
                                    <option value="" className="bg-brand-surface">Selecione...</option>
                                    <option value="Férias" className="bg-brand-surface">🏖️ Férias</option>
                                    <option value="Atestado" className="bg-brand-surface">🏥 Atestado</option>
                                    <option value="Feriado" className="bg-brand-surface">🎉 Feriado</option>
                                    <option value="Falta" className="bg-brand-surface">❌ Falta</option>
                                    <option value="Folga Banco" className="bg-brand-surface">📅 Folga Banco</option>
                                    <option value="DSR" className="bg-brand-surface">📆 DSR</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Extra Config (Optional) */}
                    {evento === 'Falta' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 bg-brand-bg/50 p-8 rounded-3xl border border-rose-500/10">
                             <label className="flex items-center gap-3 text-xs font-black text-rose-500 uppercase tracking-widest ml-1">
                                <Clock size={16} /> Horas de Falta (Opcional)
                            </label>
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <input 
                                    type="time" 
                                    value={negativoManual}
                                    onChange={(e) => setNegativoManual(e.target.value)}
                                    className="bg-brand-surface border border-rose-500/30 rounded-2xl px-8 py-5 text-brand-text text-xl font-black outline-none focus:ring-4 focus:ring-rose-500/20 transition-all shadow-2xl"
                                />
                                <p className="text-[10px] text-brand-muted font-medium italic leading-relaxed opacity-60 uppercase tracking-widest font-black">
                                    Caso não informado, o sistema aplicará automaticamente o tempo padrão da jornada total do colaborador para cada dia.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="pt-8 flex flex-col md:flex-row items-center justify-center border-t border-brand-border/40 gap-8">
                        <div className="flex items-start gap-4 max-w-sm">
                            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                            <p className="text-[9px] text-brand-muted font-bold leading-relaxed uppercase tracking-widest opacity-40">
                                <b className="text-amber-500/80">Aviso:</b> Substitui registros existentes no intervalo.
                            </p>
                        </div>
                        <button 
                            type="submit"
                            disabled={processing}
                            className="w-full md:w-auto bg-brand-primary hover:bg-brand-primary/90 text-white font-black py-4 px-16 rounded-xl shadow-xl shadow-brand-primary/30 transform active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-[10px] uppercase tracking-widest italic"
                        >
                            {processing ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save size={18} className="group-hover:rotate-12 transition-transform" />
                                    Consolidar Período
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Quick Stats Compactas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-brand-surface border border-brand-border rounded-xl flex gap-4 items-start shadow-xl">
                    <div className="p-2.5 bg-brand-primary/10 rounded-lg text-brand-primary"><Info size={18} /></div>
                    <div>
                        <h4 className="text-brand-text font-black text-xs uppercase tracking-tight italic">Afastamentos</h4>
                        <p className="text-brand-muted text-[11px] mt-1.5 font-medium leading-relaxed opacity-50">O sistema congela o saldo de horas durante o período de afastamento.</p>
                    </div>
                </div>
                <div className="p-6 bg-brand-surface border border-brand-border rounded-xl flex gap-4 items-start shadow-xl">
                    <div className="p-2.5 bg-brand-accent/10 rounded-lg text-brand-accent"><CheckCircle2 size={18} /></div>
                    <div>
                        <h4 className="text-brand-text font-black text-xs uppercase tracking-tight italic">Escalas Coletivas</h4>
                        <p className="text-brand-muted text-[11px] mt-1.5 font-medium leading-relaxed opacity-50">Aplique DSR ou folgas rapidamente conforme a escala contratual.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LancamentoEventoLote;
