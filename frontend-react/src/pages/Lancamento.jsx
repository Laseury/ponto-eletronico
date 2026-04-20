import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  User, 
  Calendar, 
  Clock, 
  Zap, 
  FileUp, 
  CheckCircle2, 
  AlertCircle,
  X,
  ChevronRight,
  Info,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import swalTheme from '../utils/swalTheme';
import { useAuth } from '../context/AuthContext';

const RevisaoIAModal = ({ isOpen, onClose, registros, funcionarioId, onComplete }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (registros) {
      setItems(registros.map(r => ({ ...r, selecionado: true, status: 'pendente' })));
    }
  }, [registros]);

  const handleToggle = (index) => {
    const newItems = [...items];
    newItems[index].selecionado = !newItems[index].selecionado;
    setItems(newItems);
  };

  const handleChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const updatedItems = [...items];
    
    for (let i = 0; i < updatedItems.length; i++) {
      if (!updatedItems[i].selecionado) {
        updatedItems[i].status = 'ignorado';
        continue;
      }
      
      updatedItems[i].status = 'processando';
      setItems([...updatedItems]);

      try {
        await axios.post('/registros', {
          funcionario_id: funcionarioId,
          data: updatedItems[i].data,
          e1: updatedItems[i].e1 || null,
          s1: updatedItems[i].s1 || null,
          e2: updatedItems[i].e2 || null,
          s2: updatedItems[i].s2 || null,
          e3: updatedItems[i].e3 || null,
          s3: updatedItems[i].s3 || null,
          evento: updatedItems[i].evento || null,
        }, {
          headers: { 'x-usuario': user?.usuario || 'ia_bot' }
        });
        updatedItems[i].status = 'sucesso';
      } catch (error) {
        updatedItems[i].status = 'erro';
      }
      setItems([...updatedItems]);
    }
    
    setSaving(false);
    swalTheme({ title: 'Concluído!', text: 'Os registros revisados foram salvos.', icon: 'success' });
    setTimeout(() => {
      onComplete();
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/90 backdrop-blur-md">
      <div className="bg-brand-surface border border-brand-border w-full max-w-6xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-surface/50">
          <div>
            <h3 className="text-xl font-black text-brand-text flex items-center gap-3 italic">
              <Zap className="text-brand-primary fill-brand-primary/20" size={20} />
              Revisar Extração IA
            </h3>
            <p className="text-brand-muted text-xs font-medium mt-0.5 opacity-60">Confirme os dados antes de consolidar no sistema.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-brand-bg rounded-xl text-brand-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] border-b border-brand-border/50 opacity-60">
                <th className="px-3 py-3 text-center">
                  <input 
                    type="checkbox" 
                    checked={items.every(i => i.selecionado)} 
                    onChange={(e) => setItems(items.map(i => ({...i, selecionado: e.target.checked})))}
                    className="w-3.5 h-3.5 rounded border-brand-border bg-brand-bg text-brand-primary focus:ring-brand-primary/30 transition-all"
                  />
                </th>
                <th className="px-3 py-3">Data</th>
                <th className="px-2 py-3 text-center">E1 - S1</th>
                <th className="px-2 py-3 text-center">E2 - S2</th>
                <th className="px-2 py-3 text-center">E3 - S3</th>
                <th className="px-4 py-4">Evento</th>
                <th className="px-4 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {items.map((item, idx) => (
                <tr key={idx} className={`hover:bg-slate-800/20 transition-colors ${!item.selecionado ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={item.selecionado}
                      onChange={() => handleToggle(idx)}
                      className="w-4 h-4 rounded border-brand-border bg-brand-bg text-brand-primary focus:ring-brand-primary/30 transition-all"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-xs font-black text-brand-text leading-none mb-1 opacity-90">{new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR').substring(0, 5)}</p>
                    <p className="text-[9px] text-brand-muted font-black uppercase opacity-40">{new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR', {weekday: 'short'})}</p>
                  </td>
                  {['1', '2', '3'].map(turno => (
                    <td key={turno} className="px-2 py-4">
                      <div className="flex gap-1 justify-center">
                        <input 
                          type="time" 
                          value={item[`e${turno}`] || ''} 
                          onChange={(e) => handleChange(idx, `e${turno}`, e.target.value)}
                          className="bg-brand-bg border border-brand-border/30 rounded-lg p-1.5 text-[10px] font-black text-brand-muted w-16 text-center focus:ring-2 focus:ring-brand-primary outline-none shadow-inner"
                        />
                        <input 
                          type="time" 
                          value={item[`s${turno}`] || ''} 
                          onChange={(e) => handleChange(idx, `s${turno}`, e.target.value)}
                          className="bg-brand-bg border border-brand-border/30 rounded-lg p-1.5 text-[10px] font-black text-brand-muted w-16 text-center focus:ring-2 focus:ring-brand-primary outline-none shadow-inner"
                        />
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-4">
                    <select 
                      value={item.evento || ''}
                      onChange={(e) => handleChange(idx, 'evento', e.target.value)}
                      className="bg-brand-bg border border-brand-border/30 rounded-lg px-2 py-1.5 text-[10px] font-black text-brand-text w-full outline-none focus:ring-2 focus:ring-brand-primary shadow-inner"
                    >
                      <option value="">Trabalho</option>
                      <option value="Folga">Folga</option>
                      <option value="Falta">Falta</option>
                      <option value="Atestado">Atestado</option>
                      <option value="DSR">DSR</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 text-right">
                    {item.status === 'pendente' && <span className="text-[9px] font-black uppercase text-slate-500">Aguardando</span>}
                    {item.status === 'processando' && <div className="w-4 h-4 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin ml-auto"></div>}
                    {item.status === 'sucesso' && <CheckCircle2 size={16} className="text-emerald-500 ml-auto" />}
                    {item.status === 'erro' && <AlertCircle size={16} className="text-rose-500 ml-auto" />}
                    {item.status === 'ignorado' && <span className="text-[9px] font-black uppercase text-slate-700">Ignorado</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-brand-surface/80 border-t border-brand-border flex justify-between items-center">
            <div className="flex items-center gap-4 text-brand-muted text-[9px] font-black uppercase tracking-widest opacity-50">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-brand-primary rounded-full"></div>{items.filter(i => i.selecionado).length} selecionados</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-brand-muted/30 rounded-full"></div>{items.filter(i => !i.selecionado).length} ignorados</div>
            </div>
            <div className="flex gap-3">
                <button onClick={onClose} disabled={saving} className="px-6 py-2.5 bg-brand-bg hover:bg-brand-surface text-brand-muted font-black rounded-xl border border-brand-border transition-all disabled:opacity-50 text-[9px] uppercase tracking-widest leading-none">Cancelar</button>
                <button 
                    onClick={handleSaveAll} 
                    disabled={saving || items.filter(i => i.selecionado).length === 0}
                    className="px-10 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-black rounded-xl shadow-lg shadow-brand-primary/30 transition-all flex items-center gap-2 disabled:opacity-50 text-[9px] uppercase tracking-widest leading-none font-italic"
                >
                    {saving ? 'Gravando...' : 'Confirmar Extração'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const Lancamento = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef();
    
    const [funcionarios, setFuncionarios] = useState([]);
    const [fId, setFId] = useState('');
    const [mesAno, setMesAno] = useState('');
    const [mesSelect, setMesSelect] = useState('');
    const [anoSelect, setAnoSelect] = useState('');
    const [dia, setDia] = useState('');
    const [evento, setEvento] = useState('');
    const [horarios, setHorarios] = useState({
        e1: '', s1: '', e2: '', s2: '', e3: '', s3: ''
    });
    const [negativoManual, setNegativoManual] = useState('08:00');
    const [procesingIA, setProcessingIA] = useState(false);
    const [registrosIA, setRegistrosIA] = useState(null);
    const [modalIAOpen, setModalIAOpen] = useState(false);
    const [registrosCadastrados, setRegistrosCadastrados] = useState([]);

    const fetchRegistrosCadastrados = async () => {
        if (fId && mesSelect && anoSelect) {
            try {
                const res = await axios.get(`/registros/${fId}?mes=${mesSelect}&ano=${anoSelect}`);
                // filtra apenas os que tem alguma hora trabalhada ou evento
                setRegistrosCadastrados((res.data || []).filter(r => r.e1 || r.evento || r.extras || r.negativos));
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                swalTheme({ title: 'Erro!', text: 'Não foi possível carregar os dados.', icon: 'error' });
            }
        } else {
            setRegistrosCadastrados([]);
        }
    };

    useEffect(() => {
        fetchRegistrosCadastrados();
    }, [fId, mesSelect, anoSelect]);

    useEffect(() => {
        axios.get('/funcionarios')
            .then(res => setFuncionarios(res.data))
            .catch(() => swalTheme({ title: 'Erro', text: 'Não foi possível carregar a lista de funcionários.', icon: 'error' }));
        
        // Inicializar com mês/ano atual
        const agora = new Date();
        const anoAtual = agora.getFullYear();
        const mesAtual = String(agora.getMonth() + 1).padStart(2, '0');
        setAnoSelect(String(anoAtual));
        setMesSelect(mesAtual);
    }, []);

    useEffect(() => {
        if (mesSelect && anoSelect) {
            setMesAno(`${anoSelect}-${mesSelect}`);
        }
    }, [mesSelect, anoSelect]);

    const handleLancar = async () => {
        if (!fId || !mesAno || !dia) {
            swalTheme({ title: 'Ops!', text: 'Preencha o funcionário, mês e dia.', icon: 'warning' });
            return;
        }

        if (!horarios.e1 && !evento) {
            swalTheme({ title: 'Atenção', text: 'Preencha ao menos a primeira entrada ou selecione um evento.', icon: 'warning' });
            return;
        }

        const dataCompleta = `${mesAno}-${dia.padStart(2, '0')}`;

        try {
            // Verificar existência
            const checkRes = await axios.get(`/registros/verificar?funcionario_id=${fId}&data=${dataCompleta}`);
            
            if (checkRes.data.existe) {
                const result = await swalTheme({
                    title: 'Registro Existente!',
                    text: `Já existe um apontamento para o dia ${dia}. Deseja sobrescrever?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#10b981',
                    confirmButtonText: 'Sim, substituir',
                    cancelButtonColor: '#6b7280',
                    cancelButtonText: 'Cancelar'
                });
                if (!result.isConfirmed) return;
            }

            await axios.post('/registros', {
                funcionario_id: fId,
                data: dataCompleta,
                ...horarios,
                evento: evento || null,
                negativos_manual: evento === 'Falta' ? negativoManual : null
            }, {
                headers: { 'x-usuario': user?.usuario || 'anonimo' }
            });

            swalTheme({ title: 'Sucesso!', text: 'Apontamento registrado com sucesso.', icon: 'success' });
            // Reset dia para facilitar o próximo
            setDia('');
            fetchRegistrosCadastrados();
        } catch (error) {
            swalTheme({ title: 'Erro!', text: 'Não foi possível salvar o registro.', icon: 'error' });
        }
    };

    const handleProcessarIA = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!fId || !mesAno) {
            return swalTheme({ title: 'Atenção!', text: 'Selecione o funcionário e o mês antes de carregar o arquivo.', icon: 'warning' });
        }

        const formData = new FormData();
        formData.append('arquivo', file);
        formData.append('funcionario_id', fId);
        formData.append('mesAno', mesAno);

        setProcessingIA(true);
        try {
            const res = await axios.post('/ia/extrair', formData);
            setRegistrosIA(res.data.registros || []);
            setModalIAOpen(true);
        } catch (error) {
            console.error("Erro IA:", error);
            swalTheme({ title: 'Erro IA', text: 'Não conseguimos analisar este arquivo. Verifique a qualidade e tente novamente.', icon: 'error' });
        } finally {
            setProcessingIA(false);
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-brand-text tracking-tighter flex items-center gap-3">
                        Lançamento
                        <span className="text-brand-primary">.</span>
                    </h1>
                    <p className="text-brand-muted font-bold mt-0.5 text-sm opacity-60">Manual ou Inteligente via IA.</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => window.location.href = '/lancamento-horas'}
                    className="flex items-center gap-2 px-5 py-3 bg-brand-primary/10 border border-brand-primary/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-brand-primary hover:bg-brand-primary/20 hover:border-brand-primary/50 transition-all shadow-lg"
                  >
                      <Clock size={14} /> Lançar Horas do Mês
                  </button>
                </            <div className="bg-brand-surface border border-brand-border rounded-3xl p-8 shadow-2xl relative group">
                {/* 1. Contexto */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-3 px-1 opacity-40">Colaborador</label>
                        <select 
                            value={fId} 
                            onChange={(e) => setFId(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3.5 text-brand-text text-sm font-black outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-inner cursor-pointer"
                        >
                            <option value="" className="bg-brand-surface">Selecionar...</option>
                            {funcionarios.map(f => (
                                <option key={f.id} value={f.id} className="bg-brand-surface">{f.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-3 px-1 opacity-40">Mês</label>
                        <select 
                            value={mesSelect}
                            onChange={(e) => setMesSelect(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3.5 text-brand-text text-sm font-black outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-inner cursor-pointer"
                        >
                            <option value="" className="bg-brand-surface">Mês</option>
                            <option value="01" className="bg-brand-surface">Janeiro</option>
                            <option value="02" className="bg-brand-surface">Fevereiro</option>
                            <option value="03" className="bg-brand-surface">Março</option>
                            <option value="04" className="bg-brand-surface">Abril</option>
                            <option value="05" className="bg-brand-surface">Maio</option>
                            <option value="06" className="bg-brand-surface">Junho</option>
                            <option value="07" className="bg-brand-surface">Julho</option>
                            <option value="08" className="bg-brand-surface">Agosto</option>
                            <option value="09" className="bg-brand-surface">Setembro</option>
                            <option value="10" className="bg-brand-surface">Outubro</option>
                            <option value="11" className="bg-brand-surface">Novembro</option>
                            <option value="12" className="bg-brand-surface">Dezembro</option>
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-3 px-1 opacity-40">Ano</label>
                        <select 
                            value={anoSelect}
                            onChange={(e) => setAnoSelect(e.target.value)}
                            className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3.5 text-brand-text text-sm font-black outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-inner cursor-pointer"
                        >
                            <option value="" className="bg-brand-surface">Ano</option>
                            {[2024, 2025, 2026, 2027, 2028].map(ano => (
                                <option key={ano} value={ano} className="bg-brand-surface">{ano}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 2. Função IA */}
                <div className="mb-10 p-6 bg-brand-bg/60 border border-brand-primary/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-brand-primary/5 transition-all hover:border-brand-primary/50 group/ia">
                    <div className="flex items-center gap-5">
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf,.xlsx,.xls,.csv" onChange={handleProcessarIA} />
                        <div className="w-14 h-14 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl flex items-center justify-center text-brand-primary relative overflow-hidden group-hover/ia:scale-105 transition-transform">
                            <div className="absolute inset-0 bg-brand-primary/10 animate-pulse"></div>
                            <Zap size={24} className="relative z-10" />
                        </div>
                        <div>
                            <h3 className="text-brand-text font-black text-sm uppercase tracking-widest italic mb-1 flex items-center gap-2">
                                Extração Inteligente <span className="px-2 py-0.5 bg-brand-primary text-white text-[8px] rounded-md leading-none shadow-lg">IA</span>
                            </h3>
                            <p className="text-brand-muted text-[11px] font-medium leading-relaxed opacity-60">Envie um arquivo PDF, Planilha ou Imagem e o sistema preencherá todo o mês automaticamente.</p>
                        </div>
                    </div>
                    <div className="flex-shrink-0 w-full md:w-auto">
                        <button 
                            onClick={() => fileInputRef.current.click()} 
                            disabled={procesingIA} 
                            className="w-full md:w-auto bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-brand-primary/30 transition-all flex items-center justify-center gap-3 transform active:scale-95"
                        >
                            {procesingIA ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Processando...</>
                            ) : (
                                <><FileUp size={16} /> Importar Arquivo</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Linha Divisória */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-px bg-brand-border/60 flex-1"></div>
                    <span className="text-brand-muted text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Apontamento Manual (Isolado)</span>
                    <div className="h-px bg-brand-border/60 flex-1"></div>
                </div>

                {/* 3. Lançamento Diário */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-3 px-1 opacity-40">Dia (Manual)</label>
                      <input 
                        type="number" 
                        min="1" max="31"
                        placeholder="Ex: 05"
                        value={dia}
                        onChange={(e) => setDia(e.target.value)}
                        className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3.5 text-brand-text text-sm font-black outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-inner"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-3 px-1 opacity-40">Evento Especial</label>
                      <select 
                        value={evento}
                        onChange={(e) => setEvento(e.target.value)}
                        className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3.5 text-brand-text text-sm font-black outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-inner cursor-pointer"
                      >
                        <option value="" className="bg-brand-surface">Trabalho Normal</option>
                        <option value="Folga" className="bg-brand-surface">🏖️ Folga</option>
                        <option value="Falta" className="bg-brand-surface">❌ Falta</option>
                        <option value="Atestado" className="bg-brand-surface">🏥 Atestado</option>
                        <option value="Ferias" className="bg-brand-surface">🏄 Férias</option>
                        <option value="DSR" className="bg-brand-surface">📅 DSR</option>
                        <option value="Feriado" className="bg-brand-surface">🎉 Feriado</option>
                        <option value="Folga Banco" className="bg-brand-surface">🏦 Folga Banco</option>
                      </select>
                    </div>
                </div>

                {/* Seção Dinâmica: Horários ou Banner de Evento */}
                {evento ? (
                    <div className="bg-brand-bg/50 border border-brand-primary/20 border-dashed rounded-3xl p-12 text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500 shadow-2xl">
                        <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary shadow-inner">
                            <CheckCircle2 size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-brand-text">Evento: {evento}</h3>
                            <p className="text-brand-muted text-sm font-medium mt-1 opacity-60">Horários ocultos para este apontamento.</p>
                        </div>
                        {evento === 'Falta' && (
                            <div className="mt-4 flex flex-col items-center gap-2">
                                <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Tempo de Falta</label>
                                <input 
                                    type="time" 
                                    value={negativoManual} 
                                    onChange={(e) => setNegativoManual(e.target.value)}
                                    className="bg-brand-surface border border-rose-500/30 rounded-xl px-5 py-3 text-brand-text text-base font-black outline-none focus:ring-4 focus:ring-rose-500/20 transition-all text-center shadow-xl"
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-brand-bg/30 border border-brand-border/50 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500 shadow-inner">
                        {['1', '2', '3'].map(turno => (
                            <div key={turno} className="space-y-4">
                                <div className="flex items-center gap-2 mb-1 px-1">
                                    <div className="w-8 h-8 bg-brand-surface rounded-lg flex items-center justify-center text-brand-primary font-black border border-brand-border text-xs shadow-lg italic">{turno}</div>
                                    <span className="text-xs font-black text-brand-muted uppercase tracking-widest opacity-40">Turno {turno}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-1 opacity-30">Entrada</label>
                                        <input 
                                            type="time" 
                                            value={horarios[`e${turno}`]}
                                            onChange={(e) => setHorarios({...horarios, [`e${turno}`]: e.target.value})}
                                            className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-3 text-brand-text text-sm font-black text-center focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-lg"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest ml-1 opacity-30">Saída</label>
                                        <input 
                                            type="time" 
                                            value={horarios[`s${turno}`]}
                                            onChange={(e) => setHorarios({...horarios, [`s${turno}`]: e.target.value})}
                                            className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-3 text-brand-text text-sm font-black text-center focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={handleLancar}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white font-black py-4 px-12 rounded-xl shadow-2xl shadow-brand-primary/40 transform active:scale-[0.98] transition-all flex items-center gap-3 group text-[11px] uppercase tracking-widest"
                    >
                        Salvar Apontamento
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Quick Tips Compactas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 bg-brand-surface border border-brand-border rounded-2xl flex gap-4 items-start shadow-xl">
                    <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary"><Zap size={18} /></div>
                    <div>
                        <h4 className="text-brand-text font-black text-xs uppercase tracking-tight italic">Dica IA</h4>
                        <p className="text-brand-muted text-[11px] mt-1.5 font-medium leading-relaxed opacity-50">Carregue a folha e a IA preencherá o mês automaticamente.</p>
                    </div>
                </div>
                <div className="p-6 bg-brand-surface border border-brand-border rounded-2xl flex gap-4 items-start shadow-xl">
                    <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500"><AlertCircle size={18} /></div>
                    <div>
                        <h4 className="text-brand-text font-black text-xs uppercase tracking-tight italic">Sobreposição</h4>
                        <p className="text-brand-muted text-[11px] mt-1.5 font-medium leading-relaxed opacity-50">Lançar no mesmo dia sobrescreve o registro anterior com segurança.</p>
                    </div>
                </div>
                <div className="p-6 bg-brand-surface border border-brand-border rounded-2xl flex gap-4 items-start shadow-xl">
                    <div className="p-2.5 bg-brand-accent/10 rounded-xl text-brand-accent"><CheckCircle2 size={18} /></div>
                    <div>
                        <h4 className="text-brand-text font-black text-xs uppercase tracking-tight italic">Validação</h4>
                        <p className="text-brand-muted text-[11px] mt-1.5 font-medium leading-relaxed opacity-50">Cálculos automáticos baseados em regras de contrato vigentes.</p>
                    </div>
                </div>
            </div>

            <RevisaoIAModal 
                isOpen={modalIAOpen} 
                onClose={() => setModalIAOpen(false)} 
                registros={registrosIA} 
                funcionarioId={fId}
                onComplete={() => {
                    setDia('');
                    fetchRegistrosCadastrados();
                }}
            />

            {/* Registros já lançados */}
            {fId && mesAno && (
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-2xl relative overflow-hidden group mt-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Clock size={20} className="text-brand-primary" />
                        <h3 className="text-xl font-black text-brand-text">Lançamentos em {mesSelect}/{anoSelect}</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-brand-border text-[10px] uppercase tracking-widest text-brand-muted opacity-60">
                                    <th className="px-4 py-3 font-black text-center">Data</th>
                                    <th className="px-4 py-3 font-black text-center">Entradas/Saídas</th>
                                    <th className="px-4 py-3 font-black text-center">Eventos/Horas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border/30">
                                {registrosCadastrados.length > 0 ? (
                                    registrosCadastrados.map((r, idx) => {
                                        const diaApenas = new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
                                        const diaExtenso = new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR', {weekday: 'short'}).replace('.', '');
                                        return (
                                            <tr key={idx} className="hover:bg-brand-bg/50 transition-colors">
                                                <td className="px-4 py-4 text-center">
                                                    <p className="text-sm font-black text-brand-text mb-0.5">{diaApenas}</p>
                                                    <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest opacity-40">{diaExtenso}</p>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {r.evento && !r.e1 ? (
                                                        <span className="text-xs font-black text-brand-muted opacity-50 italic">—</span>
                                                    ) : (
                                                        <div className="flex justify-center gap-2 items-center flex-wrap text-xs font-black text-brand-muted">
                                                            {r.e1 && <span>{r.e1.substring(0,5)}/{r.s1?.substring(0,5)}</span>}
                                                            {r.e2 && <span>| {r.e2.substring(0,5)}/{r.s2?.substring(0,5)}</span>}
                                                            {r.e3 && <span>| {r.e3.substring(0,5)}/{r.s3?.substring(0,5)}</span>}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <div className="flex justify-center items-center gap-2 flex-wrap">
                                                        {r.evento && (
                                                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${r.evento === 'Falta' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'}`}>{r.evento}</span>
                                                        )}
                                                        {r.total && (
                                                            <span className="text-[10px] font-black uppercase text-brand-text bg-brand-bg px-2 py-0.5 rounded-md border border-brand-border">{r.total}h</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-8 text-center text-brand-muted text-sm italic opacity-60">
                                            Nenhum lançamento encontrado para os filtros selecionados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Lancamento;
