import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  FileDown, 
  Clock, 
  Calendar,
  Edit2,
  Moon,
  Sun,
  X,
  MessageSquare,
  PlusCircle,
  History,
  Trash2,
  Save,
  Users,
  Sparkles
} from 'lucide-react';
import Swal from 'sweetalert2';
import swalTheme from '../utils/swalTheme';
import { useAuth } from '../context/AuthContext';

const InfoCard = ({ label, value, color }) => (
  <div className="bg-brand-surface border border-brand-border rounded-[1.5rem] p-6 flex flex-col items-center justify-center text-center shadow-lg group hover:border-brand-primary/30 transition-all">
    <p className="text-xs font-black text-brand-muted uppercase tracking-widest mb-2 opacity-60">{label}</p>
    <p className={`text-2xl font-black ${color || 'text-brand-text'}`}>{value || '—'}</p>
  </div>
);

const MiniCard = ({ label, value, color }) => (
  <div className="bg-brand-bg border border-brand-border/50 rounded-2xl p-4 flex flex-col shadow-inner">
    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1.5 opacity-50">{label}</p>
    <p className={`text-base font-black ${color || 'text-brand-text/80'}`}>{value || '—'}</p>
  </div>
);

const EditRecordModal = ({ isOpen, onClose, record, onSave }) => {
  const [formData, setFormData] = useState({
    e1: '', s1: '', e2: '', s2: '', e3: '', s3: '', evento: ''
  });

  useEffect(() => {
    if (record) {
      setFormData({
        e1: record.e1?.substring(0, 5) || '',
        s1: record.s1?.substring(0, 5) || '',
        e2: record.e2?.substring(0, 5) || '',
        s2: record.s2?.substring(0, 5) || '',
        e3: record.e3?.substring(0, 5) || '',
        s3: record.s3?.substring(0, 5) || '',
        evento: record.evento || ''
      });
    }
  }, [record]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-brand-surface border border-brand-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-surface/30">
          <h3 className="text-lg font-black text-brand-text flex items-center gap-3 tracking-tight italic">
            Editar Registro <span className="text-brand-primary text-xs font-black tracking-tight opacity-50">— {new Date(record.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-brand-bg rounded-lg text-brand-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-2 opacity-60">Evento Especial</label>
            <select 
              value={formData.evento}
              onChange={(e) => setFormData({...formData, evento: e.target.value})}
              className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text text-sm outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all font-black shadow-inner"
            >
              <option value="">Nenhum</option>
              <option value="DSR">DSR</option>
              <option value="Folga">Folga</option>
              <option value="Folga Banco">Folga Banco</option>
              <option value="Falta">Falta</option>
              <option value="Atestado">Atestado</option>
              <option value="Declaração">Declaração</option>
              <option value="Feriado">Feriado</option>
              <option value="Ferias">Férias</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {['1', '2', '3'].map(turno => (
              <React.Fragment key={turno}>
                <div>
                  <label className="block text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-2 text-center opacity-40">Entrada {turno}</label>
                  <input 
                    type="time" 
                    value={formData[`e${turno}`]}
                    onChange={(e) => setFormData({...formData, [`e${turno}`]: e.target.value})}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-2 py-3 text-brand-text text-sm font-black outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all text-center shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-1 text-center opacity-40">Saída {turno}</label>
                  <input 
                    type="time" 
                    value={formData[`s${turno}`]}
                    onChange={(e) => setFormData({...formData, [`s${turno}`]: e.target.value})}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-2 py-3 text-brand-text text-sm font-black outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all text-center shadow-inner"
                  />
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="p-8 bg-brand-bg/40 flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 bg-brand-bg hover:bg-brand-surface text-brand-muted font-black rounded-2xl border border-brand-border transition-all uppercase text-[10px] tracking-widest">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-5 bg-brand-primary hover:bg-brand-primary/90 text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 transition-all uppercase text-[10px] tracking-widest">Salvar Alterações</button>
        </div>
      </div>
    </div>
  );
};

const Funcionario = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const id = searchParams.get('id');

  const [mes, setMes] = useState(searchParams.get('mes') ? Number(searchParams.get('mes')) : new Date().getMonth() + 1);
  const [ano, setAno] = useState(searchParams.get('ano') ? Number(searchParams.get('ano')) : new Date().getFullYear());
  const [funcionario, setFuncionario] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [relatorio, setRelatorio] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [ajustes, setAjustes] = useState([]);
  const [comentarioModalOpen, setComentarioModalOpen] = useState(false);
  const [ajusteModalOpen, setAjusteModalOpen] = useState(false);
  const [commentData, setCommentData] = useState({ texto: '', tipo: 'GERAL', data_referencia: null });
  const [ajusteData, setAjusteData] = useState({ valor: '+00:00', motivo: '' });

  const canEdit = useMemo(() => ['Admin', 'Gestor', 'Contador'].includes(user?.perfil), [user]);
  const ehHoristaOuNoturno = funcionario?.tipo === 'Horista' || funcionario?.tipo === 'Horista Noturno';

  const formatDateSafe = (date, includeTime = false) => {
    if (!date) return '—';
    try {
      let d;
      const dateStr = typeof date === 'string' ? date : new Date(date).toISOString();
      
      if (!includeTime) {
        // Para datas puras, pegamos apenas YYYY-MM-DD e forçamos meio-dia para evitar deslocamento de fuso
        const pureDate = dateStr.substring(0, 10);
        d = new Date(pureDate + 'T12:00:00');
      } else {
        d = new Date(dateStr);
      }

      if (isNaN(d.getTime())) return '—';
      if (includeTime) {
        return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      }
      return d.toLocaleDateString('pt-BR');
    } catch (e) {
      return '—';
    }
  };

  const fetchFuncionarioData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [funcRes, regRes, relRes] = await Promise.all([
        axios.get(`/funcionarios/${id}`),
        axios.get(`/registros/${id}?mes=${mes}&ano=${ano}`),
        axios.get(`/relatorio/${mes}/${ano}?valor_hora=0`)
      ]);
      setFuncionario(funcRes.data);
      setRegistros(regRes.data);
      
      if (relRes && relRes.data) {
          const foundRel = relRes.data.find(r => String(r.id) === String(id));
          setRelatorio(foundRel || null);
      }

      const [comRes, ajuRes] = await Promise.all([
        axios.get(`/comentarios/${id}`),
        axios.get(`/ajustes/${id}`)
      ]);
      setComentarios(comRes.data);
      setAjustes(ajuRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      swalTheme({ title: 'Erro!', text: 'Não foi possível carregar os dados.', icon: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id, mes, ano]);

  useEffect(() => {
    fetchFuncionarioData();
  }, [fetchFuncionarioData]);

  const min = (h) => {
    if (!h) return 0;
    const [hh, mm] = h.split(':').map(Number);
    return hh * 60 + mm;
  };

  const calcNoturnoPuro = (ent, sai) => {
    if (!ent || !sai) return 0;
    let e = min(ent); let s = min(sai); 
    if (s < e) s += 1440; 
    
    const intersection = (s1, e1, s2, e2) => {
      const start = Math.max(s1, s2);
      const end = Math.min(e1, e2);
      return end > start ? end - start : 0;
    };

    return intersection(e, s, 1320, 1740) + intersection(e, s, -120, 300);
  };

  const fmt = (m) => {
    const h = Math.abs(Math.floor(m / 60)).toString().padStart(2, '0');
    const mm = Math.abs(m % 60).toString().padStart(2, '0');
    return `${h}:${mm}`;
  };

  const analytics = useMemo(() => {
    let stats = { extras: 0, negativos: 0, faltas: 0, trabalhado: 0, noturno: 0, noturnoPuro: 0, feriados: 0, dias_feriados: 0, dias_dsr: 0 };
    registros.forEach(r => {
      const cargaLinha = funcionario?.tipo === 'Horista Noturno' ? 440 : (funcionario?.cargaHorariaDiaria || (funcionario?.tipo === 'Horista' ? 480 : 440));
      const totalLinha = r.total ? min(r.total) : 0;
      
      if (r.total && !r.evento) {
        if (totalLinha > cargaLinha) {
          stats.extras += (totalLinha - cargaLinha);
        } else if (!ehHoristaOuNoturno) {
          stats.negativos += (cargaLinha - totalLinha);
        }
      }
      // Falta e Folga Banco geram negativos para não-horistas
      if ((r.evento === 'Falta' || r.evento === 'Folga Banco') && !ehHoristaOuNoturno) {
        // Usa o valor salvo no campo 'negativos' do registro, que já foi calculado pelo backend
        if (r.negativos && r.negativos.startsWith('-')) {
          stats.negativos += min(r.negativos.slice(1));
        } else {
          stats.negativos += cargaLinha;
        }
      }
      if (r.evento === 'Falta') stats.faltas++;
      if (r.evento === 'Feriado') {
        const carga = funcionario?.cargaHorariaDiaria || (funcionario?.tipo === 'Horista' ? 480 : 440);
        stats.feriados += carga;
        stats.dias_feriados++;
      }
      if (r.evento === 'DSR') stats.dias_dsr++;

      const diaria = funcionario?.tipo === 'Horista Noturno' ? 440 : (funcionario?.cargaHorariaDiaria || (funcionario?.tipo === 'Horista' ? 480 : 440));
      if (r.total) {
        stats.trabalhado += min(r.total);
      } else if (['Folga', 'Atestado', 'Ferias', 'Férias', 'Declaração', 'Declaracao'].includes(r.evento)) {
        stats.trabalhado += diaria;
      }

      if (r.noturno) stats.noturno += min(r.noturno);
      stats.noturnoPuro += calcNoturnoPuro(r.e1, r.s1);
      stats.noturnoPuro += calcNoturnoPuro(r.e2, r.s2);
      stats.noturnoPuro += calcNoturnoPuro(r.e3, r.s3);
    });
    const fmt = (m) => {
      const h = Math.abs(Math.floor(m / 60)).toString().padStart(2, '0');
      const mm = Math.abs(m % 60).toString().padStart(2, '0');
      return `${h}:${mm}`;
    };
    const saldo = stats.extras - stats.negativos;
    const diaria = funcionario?.tipo === 'Horista Noturno' ? 440 : (funcionario?.cargaHorariaDiaria || (funcionario?.tipo === 'Horista' ? 480 : 440));
    
    // Carga Mensal = (Dias do Mês - DSR - Feriados) * Carga Diária
    const totalDiasMes = new Date(ano, mes, 0).getDate();
    const mensal = (totalDiasMes - stats.dias_dsr - stats.dias_feriados) * diaria;

    const noturnoFatorMin = Math.round(stats.noturnoPuro * (60 / 52.5));
    const diurnoMin = Math.max(0, stats.trabalhado - stats.noturnoPuro);
    const baseCalculoMin = diurnoMin + noturnoFatorMin;

    return {
      totalTrabalhado: fmt(stats.trabalhado),
      cargaMensal: fmt(mensal),
      totalNormal: fmt(stats.trabalhado - stats.extras),
      totalExtras: stats.extras > 0 ? `+${fmt(stats.extras)}` : '00:00',
      totalNegativos: stats.negativos > 0 ? `-${fmt(stats.negativos)}` : '00:00',
      totalFaltas: stats.faltas,
      saldo: saldo === 0 ? '00:00' : (saldo > 0 ? `+${fmt(saldo)}` : `-${fmt(saldo)}`),
      saldoMin: saldo,
      noturno: fmt(stats.noturnoPuro),
      diurno: fmt(diurnoMin),
      noturnoComFator: fmt(noturnoFatorMin),
      baseCalculo: fmt(baseCalculoMin),
      totalFeriados: stats.dias_feriados > 0 ? `${stats.dias_feriados}d - ${fmt(stats.feriados)}` : '00:00'
    };
  }, [registros, funcionario, mes, ano]);

  const handleEdit = (r) => {
    setSelectedRecord(r);
    setModalOpen(true);
  };

  const handleSaveRecord = async (formData) => {
    try {
      await axios.put(`/registros/${selectedRecord.id}`, {
        funcionario_id: id,
        data: selectedRecord.data.substring(0, 10),
        ...formData
      }, {
        headers: { 'x-usuario': user?.usuario || 'anonimo' }
      });
      setModalOpen(false);
      fetchFuncionarioData();
      swalTheme({ title: 'Sucesso!', text: 'Registro atualizado.', icon: 'success', timer: 1000, showConfirmButton: false });
    } catch (error) {
      swalTheme({ title: 'Erro!', text: 'Não foi possível salvar as alterações.', icon: 'error' });
    }
  };

  const handleAddComment = async () => {
    if (!commentData.texto) return;
    try {
      await axios.post('/comentarios', {
        funcionario_id: id,
        ...commentData
      });
      setComentarioModalOpen(false);
      setCommentData({ texto: '', tipo: 'GERAL', data_referencia: null });
      fetchFuncionarioData();
      swalTheme({ title: 'Sucesso!', text: 'Comentário adicionado.', icon: 'success', timer: 1000, showConfirmButton: false });
    } catch (error) {
      swalTheme({ title: 'Erro!', text: 'Não foi possível salvar o comentário.', icon: 'error' });
    }
  };

  const handleDeleteComment = async (comId) => {
    const res = await swalTheme({
      title: 'Excluir comentário?',
      text: 'Esta ação não pode ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });
    if (res.isConfirmed) {
      try {
        await axios.delete(`/comentarios/${comId}`);
        fetchFuncionarioData();
        swalTheme({ title: 'Excluído!', text: 'O comentário foi removido.', icon: 'success' });
      } catch (error) {
        swalTheme({ title: 'Erro!', text: 'Não foi possível excluir.', icon: 'error' });
      }
    }
  };

  const handleAddAjuste = async () => {
    if (!ajusteData.valor || !ajusteData.motivo) {
        return swalTheme({ title: 'Atenção', text: 'Informe um valor válido e o motivo.', icon: 'warning' });
    }
    try {
      await axios.post('/ajustes', {
        funcionario_id: id,
        ...ajusteData
      });
      setAjusteModalOpen(false);
      setAjusteData({ valor: '+00:00', motivo: '' });
      fetchFuncionarioData();
      swalTheme({ title: 'Sucesso!', text: 'Ajuste de saldo realizado.', icon: 'success', timer: 1000, showConfirmButton: false });
    } catch (error) {
      swalTheme({ title: 'Erro!', text: 'Não foi possível realizar o ajuste.', icon: 'error' });
    }
  };

  const handleViewComment = (dateStr) => {
    const dayComments = comentarios.filter(c => {
      if (!c.dataReferencia) return false;
      const dStr = typeof c.dataReferencia === 'string' ? c.dataReferencia : c.dataReferencia.toISOString();
      return dStr.substring(0, 10) === dateStr;
    });
    if (dayComments.length === 0) return;

    const html = dayComments.map(c => `
      <div style="text-align: left; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div style="font-size: 10px; font-weight: 900; color: #10b981; text-transform: uppercase; letter-spacing: 1px;">${c.usuario?.nome || 'Sistema'}</div>
        <div style="font-size: 13px; margin-top: 8px; color: #f8fafc; font-weight: 500;">${c.texto}</div>
      </div>
    `).join('');

    swalTheme({
      title: 'Anotações do Dia',
      html: `<div style="margin-top: 15px;">${html}</div>`,
      confirmButtonText: 'Fechar',
    });
  };

  const exportarParaIA = () => {
    try {
      const data = {
        colaborador: {
          nome: funcionario?.nome,
          tipo: funcionario?.tipo,
          carga_diaria_minutos: funcionario?.tipo === 'Horista Noturno' ? 440 : (funcionario?.cargaHorariaDiaria || (funcionario?.tipo === 'Horista' ? 480 : 440))
        },
        periodo: { mes, ano },
        resumo_sistema: analytics,
        registros_diarios: registros.map(r => {
          const noturnoMin = calcNoturnoPuro(r.e1, r.s1) + calcNoturnoPuro(r.e2, r.s2) + calcNoturnoPuro(r.e3, r.s3);
          return {
            data: r.data.substring(0, 10),
            e1: r.e1, s1: r.s1,
            e2: r.e2, s2: r.s2,
            e3: r.e3, s3: r.s3,
            total_trabalhado: r.total,
            noturno_cronologico: fmt(noturnoMin),
            noturno_com_fator: fmt(Math.round(noturnoMin * (60 / 52.5))),
            evento: r.evento || null
          };
        })
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `IA_COMPARE_${funcionario?.nome.replace(/\s+/g, '_')}_${mes}_${ano}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      swalTheme({ title: 'Exportado!', text: 'Arquivo pronto para análise da IA.', icon: 'success', timer: 2000, showConfirmButton: false });
    } catch (e) {
      swalTheme({ title: 'Erro!', text: 'Falha ao gerar arquivo.', icon: 'error' });
    }
  };

  const generatePDF = () => {
    try {
      swalTheme({ title: 'Exportação', text: 'Gerando arquivo de impressão...', icon: 'info', timer: 2000, showConfirmButton: false });
      const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
      const labelMes = MESES[mes - 1] + " " + ano;
      // Calcular saldo_anterior de forma consistente: banco_horas - saldo_mes_frontend
      const _parseBalMin = (str) => {
        if (!str || str === '00:00') return 0;
        const sign = str.startsWith('+') ? 1 : str.startsWith('-') ? -1 : 1;
        const parts = str.replace(/[+-]/, '').split(':');
        return sign * (parseInt(parts[0] || 0) * 60 + parseInt(parts[1] || 0));
      };
      const _fmtBal = (m) => {
        if (m === 0) return '00:00';
        const h = Math.abs(Math.floor(m / 60)).toString().padStart(2, '0');
        const mm = Math.abs(m % 60).toString().padStart(2, '0');
        return (m > 0 ? '+' : '-') + `${h}:${mm}`;
      };
      const _bancoMin = _parseBalMin(relatorio?.banco_horas);
      const _saldoAnteriorMin = relatorio?.banco_horas ? _bancoMin - analytics.saldoMin : null;
      const _saldoAnteriorStr = _saldoAnteriorMin !== null ? _fmtBal(_saldoAnteriorMin) : '00:00';
      let rowsHtml = '';
      const daysInMonth = new Date(ano, mes, 0).getDate();
      const mapa = {};
      registros.forEach(r => mapa[r.data.substring(0, 10)] = r);
      for (let d = 1; d <= daysInMonth; d++) {
        const chave = `${ano}-${mes.toString().padStart(2, '0')}-${d.toString().padStart(2,'0')}`;
        const r = mapa[chave] || {};
        const cargaExata = funcionario?.tipo === 'Horista Noturno' ? 440 : (funcionario?.cargaHorariaDiaria || (funcionario?.tipo === 'Horista' ? 480 : 440));
        const totalMin = r.total ? (parseInt(r.total.split(':')[0]) * 60 + parseInt(r.total.split(':')[1])) : 0;
        
        let displayExtras = r.extras || '';
        let displayNegativos = r.negativos || '';

        if (r.total && !r.evento) {
          if (totalMin > cargaExata) {
            const diff = totalMin - cargaExata;
            const h = Math.floor(diff / 60).toString().padStart(2, '0');
            const m = (diff % 60).toString().padStart(2, '0');
            displayExtras = `+${h}:${m}`;
            displayNegativos = '00:00';
          } else {
            const diff = cargaExata - totalMin;
            const h = Math.floor(diff / 60).toString().padStart(2, '0');
            const m = (diff % 60).toString().padStart(2, '0');
            displayExtras = '00:00';
            displayNegativos = `-${h}:${m}`;
          }
        }

        rowsHtml += `
          <tr>
            <td>${d.toString().padStart(2,'0')}/${mes.toString().padStart(2,'0')}/${ano}</td>
            <td>${r.e1?.substring(0,5) || '' }</td><td>${r.s1?.substring(0,5) || '' }</td>
            <td>${r.e2?.substring(0,5) || '' }</td><td>${r.s2?.substring(0,5) || '' }</td>
            <td>${r.e3?.substring(0,5) || '' }</td><td>${r.s3?.substring(0,5) || '' }</td>
            <td>${r.total || ''}</td>
            <td>${r.noturno?.substring(0,5) || ''}</td>
            <td style="color: #2e7d32">${displayExtras}</td>
            ${!ehHoristaOuNoturno ? `<td style="color: #d32f2f">${displayNegativos}</td>` : ''}
            <td>${r.evento || ''}</td>
          </tr>
        `;
      }
      const htmlContent = `
        <html><head><style>
          @page { size: portrait; margin: 1cm; }
          body { font-family: sans-serif; font-size: 9px; color: #333; margin: 0; padding: 0; }
          .hdr { border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 15px; }
          .hdr h1 { font-size: 16px; margin: 0; }
          .hdr p { font-size: 10px; margin: 5px 0 0 0; font-weight: bold; }
          .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 5px; margin-bottom: 15px; }
          .card { border: 1px solid #ddd; padding: 6px 4px; border-radius: 4px; background: #f9f9f9; text-align: center; }
          .card strong { font-size: 7px; text-transform: uppercase; color: #666; display: block; margin-bottom: 2px; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th { background: #333; color: #fff; padding: 4px 2px; font-size: 8px; }
          td { border: 1px solid #ddd; padding: 3px 1px; text-align: center; font-size: 8.5px; }
          .col-data { width: 55px; }
          .col-hora { width: 35px; }
          .col-total { width: 40px; }
          .col-evento { width: auto; }
        </style></head><body>
          <div class="hdr"><h1>VISO HOTEL — FICHA DE PONTO</h1><p>Colaborador: ${funcionario?.nome} | Período: ${labelMes}</p></div>
          <div class="grid">
            <div class="card"><strong>Tipo</strong>${funcionario?.tipo}</div>
            <div class="card"><strong>Faltas</strong>${analytics.totalFaltas}</div>
            <div class="card"><strong>Feriados</strong>${analytics.totalFeriados}</div>
            <div class="card"><strong>S. Anterior</strong>${_saldoAnteriorStr}</div>
            <div class="card"><strong>S. Mês</strong>${analytics.saldo}</div>
            <div class="card"><strong>Consolidado</strong>${relatorio?.banco_horas || analytics.saldo}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th class="col-data">Data</th>
                <th class="col-hora">E1</th><th class="col-hora">S1</th>
                <th class="col-hora">E2</th><th class="col-hora">S2</th>
                <th class="col-hora">E3</th><th class="col-hora">S3</th>
                <th class="col-total">Total</th>
                <th class="col-total">Not.</th>
                <th class="col-total">Ext.</th>
                ${!ehHoristaOuNoturno ? '<th class="col-total">Neg.</th>' : ''}
                <th class="col-evento">Evento</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body></html>
      `;
      const win = window.open('', '_blank');
      win.document.write(htmlContent); win.document.close();
      win.onload = () => win.print();
    } catch (error) {
      swalTheme({ title: 'Erro!', text: 'Ocorreu um problema ao gerar o PDF.', icon: 'error' });
    }
  };

  const handleToggleAtivo = async () => {
    const action = funcionario?.ativo !== false ? 'inativar' : 'ativar';
    const res = await swalTheme({
      title: `Confirmar ${action}?`,
      text: `Deseja realmente ${action} este colaborador?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não'
    });

    if (res.isConfirmed) {
      try {
        await axios.patch(`/funcionarios/${id}/ativo`);
        fetchFuncionarioData();
        swalTheme({ title: 'Sucesso!', text: `Colaborador ${action === 'inativar' ? 'inativado' : 'ativado'} com sucesso.`, icon: 'success' });
      } catch (error) {
        const msg = error.response?.data?.erro || error.message;
        swalTheme({ title: 'Erro!', text: `Não foi possível alterar o status: ${msg}`, icon: 'error' });
      }
    }
  };

  if (!id) return <div className="text-white text-2xl font-black p-10">ID não fornecido.</div>;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-brand-surface border border-brand-border rounded-xl text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-all shadow-lg">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-brand-text tracking-tight flex items-center gap-3 italic">
              {funcionario?.nome}
              <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded-full border tracking-widest ${funcionario?.ativo !== false ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                {funcionario?.ativo !== false ? 'Ativo' : 'Inativo'}
              </span>
            </h1>
            <p className="text-brand-muted font-bold text-xs mt-0.5 opacity-60">Visualizando registro detalhado do ponto.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-brand-surface p-2 rounded-xl border border-brand-border shadow-lg">
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="bg-brand-bg text-brand-text text-xs font-black px-3 py-2 rounded-lg outline-none transition-all cursor-pointer hover:bg-brand-surface border border-brand-border/50 shadow-inner">
              {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (<option key={i+1} value={i+1} className="bg-brand-surface">{m}</option>))}
            </select>
            <select value={ano} onChange={(e) => setAno(Number(e.target.value))} className="bg-brand-bg text-brand-text text-xs font-black px-3 py-2 rounded-lg outline-none transition-all cursor-pointer hover:bg-brand-surface border border-brand-border/50 shadow-inner">
              {[2024, 2025, 2026].map(a => (<option key={a} value={a} className="bg-brand-surface">{a}</option>))}
            </select>
          </div>
          {canEdit && (
            <button 
              onClick={handleToggleAtivo}
              className={`flex items-center gap-2 font-black py-3 px-6 rounded-xl shadow-lg transition-all text-[9px] uppercase tracking-widest ${funcionario?.ativo !== false ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'}`}
            >
              {funcionario?.ativo !== false ? <X size={18} /> : <Save size={18} />}
              {funcionario?.ativo !== false ? 'Inativar' : 'Ativar'}
            </button>
          )}
          {canEdit && (
            <button 
              onClick={exportarParaIA}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 uppercase tracking-widest"
            >
              <Sparkles size={14} /> Exportar para IA
            </button>
          )}
          <button 
            onClick={generatePDF}
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/80 text-brand-bg text-[10px] font-black px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-primary/20 uppercase tracking-widest"
          >
            <FileDown size={14} /> Imprimir PDF
          </button>
          {canEdit && (
            <button 
              onClick={() => setAjusteModalOpen(true)}
              className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-black py-3 px-6 rounded-xl shadow-lg shadow-brand-primary/20 transition-all text-[9px] uppercase tracking-widest"
            >
              <PlusCircle size={18} /> Ajustar Saldo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <InfoCard label="Tipo de Contrato" value={funcionario?.tipo} />
        {(() => {
          // Banco Consolidado vem do backend (ciclo completo). Saldo Anterior é derivado
          // como (banco_horas - saldo_mes_frontend) para garantir consistência entre os 3 cartões.
          const parseBalanceMin = (str) => {
            if (!str || str === '00:00') return 0;
            const sign = str.startsWith('+') ? 1 : str.startsWith('-') ? -1 : 1;
            const parts = str.replace(/[+-]/, '').split(':');
            return sign * (parseInt(parts[0] || 0) * 60 + parseInt(parts[1] || 0));
          };
          const fmtBalance = (m) => {
            if (m === 0) return '00:00';
            const h = Math.abs(Math.floor(m / 60)).toString().padStart(2, '0');
            const mm = Math.abs(m % 60).toString().padStart(2, '0');
            return (m > 0 ? '+' : '-') + `${h}:${mm}`;
          };
          const bancoMin = parseBalanceMin(relatorio?.banco_horas);
          // Saldo Anterior = Banco Consolidado - Saldo do Mês (garante consistência)
          const saldoAnteriorMin = relatorio?.banco_horas ? bancoMin - analytics.saldoMin : null;
          const saldoAnteriorStr = saldoAnteriorMin !== null ? fmtBalance(saldoAnteriorMin) : '00:00';
          const saldoAnteriorColor = saldoAnteriorMin === null ? 'text-brand-muted opacity-40' : saldoAnteriorMin > 0 ? 'text-brand-accent' : saldoAnteriorMin < 0 ? 'text-rose-400' : 'text-brand-muted opacity-40';
          const bancoColor = !relatorio?.banco_horas ? 'text-brand-muted opacity-40' : bancoMin > 0 ? 'text-brand-accent' : bancoMin < 0 ? 'text-rose-400' : 'text-brand-muted opacity-40';
          return (
            <>
              <InfoCard label="Saldo Anterior" value={saldoAnteriorStr} color={saldoAnteriorColor} />
              <InfoCard label="Saldo do Mês" value={analytics.saldo} color={analytics.saldoMin > 0 ? 'text-brand-accent' : analytics.saldoMin < 0 ? 'text-rose-400' : 'text-brand-muted opacity-40'} />
              <InfoCard label="Banco Consolidado" value={relatorio?.banco_horas || analytics.saldo} color={bancoColor} />
            </>
          );
        })()}
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-surface/50">
          <h2 className="text-xl font-black text-brand-text flex items-center gap-3 tracking-tighter italic"><Calendar className="text-brand-primary" size={20} /> Espelho de Ponto</h2>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 text-[9px] font-black text-brand-muted uppercase tracking-widest opacity-40"><div className="w-2 h-2 bg-brand-accent rounded-full"></div> Positivo</div>
             <div className="flex items-center gap-2 text-[9px] font-black text-brand-muted uppercase tracking-widest opacity-40"><div className="w-2 h-2 bg-rose-500 rounded-full"></div> Negativo</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-bg/50 border-b border-brand-border">
                <th className="px-6 py-4 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] text-center opacity-60">Data</th>
                <th className="px-3 py-4 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] text-center opacity-60">E1 / S1</th>
                <th className="px-3 py-4 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] text-center opacity-60">E2 / S2</th>
                <th className="px-3 py-4 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] text-center opacity-60">E3 / S3</th>
                <th className="px-3 py-4 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] text-center opacity-60">Total</th>
                <th className="px-3 py-4 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] text-center opacity-60">Noturno</th>
                <th className="px-3 py-4 text-[9px] font-black text-brand-accent/60 uppercase tracking-[0.25em] text-center">Extras</th>
                {!ehHoristaOuNoturno && <th className="px-3 py-4 text-[9px] font-black text-rose-500/60 uppercase tracking-[0.25em] text-center">Neg.</th>}
                <th className="px-4 py-4 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] text-center opacity-40">Evento</th>
                <th className="px-6 py-4 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] text-right opacity-60">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border bg-brand-surface/20">
              {loading ? (
                <tr><td colSpan="10" className="py-24 text-center"><div className="flex flex-col items-center gap-4"><div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div><span className="text-[10px] font-black text-brand-muted uppercase tracking-widest opacity-60">Sincronizando...</span></div></td></tr>
              ) : (
                (() => {
                  const daysInMonth = new Date(ano, mes, 0).getDate();
                  const mapa = {}; registros.forEach(r => mapa[r.data.substring(0, 10)] = r);
                  return Array.from({length: daysInMonth}, (_, i) => {
                    const day = i + 1; const dateStr = `${ano}-${mes.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    const r = mapa[dateStr] || { data: dateStr, e1: '', s1: '', e2: '', s2: '', e3: '', s3: '', extras: '', negativos: '', total: '', noturno: '', evento: '' };
                    const isToday = new Date().toISOString().substring(0, 10) === dateStr;
                    const dateObj = new Date(dateStr + 'T12:00:00');
                    const cargaExata = funcionario?.tipo === 'Horista Noturno' ? 440 : (funcionario?.cargaHorariaDiaria || (funcionario?.tipo === 'Horista' ? 480 : 440));
                    const totalMin = r.total ? (parseInt(r.total.split(':')[0]) * 60 + parseInt(r.total.split(':')[1])) : 0;
                    
                    let displayExtras = r.extras;
                    let displayNegativos = r.negativos;

                    if (r.total && !r.evento) {
                      if (totalMin > cargaExata) {
                        const diff = totalMin - cargaExata;
                        const h = Math.floor(diff / 60).toString().padStart(2, '0');
                        const m = (diff % 60).toString().padStart(2, '0');
                        displayExtras = `+${h}:${m}`;
                        displayNegativos = '00:00';
                      } else {
                        const diff = cargaExata - totalMin;
                        const h = Math.floor(diff / 60).toString().padStart(2, '0');
                        const m = (diff % 60).toString().padStart(2, '0');
                        displayExtras = '00:00';
                        displayNegativos = `-${h}:${m}`;
                      }
                    }

                    const noturnoLinhaMin = calcNoturnoPuro(r.e1, r.s1) + calcNoturnoPuro(r.e2, r.s2) + calcNoturnoPuro(r.e3, r.s3);
                    const noturnoDisplay = noturnoLinhaMin > 0 ? fmt(noturnoLinhaMin) : '—';

                    return (
                      <tr key={dateStr} className={`hover:bg-brand-bg/30 transition-colors ${isToday ? 'bg-brand-primary/10' : ''}`}>
                        <td className="px-6 py-3 text-center">
                          <p className="text-sm font-black text-brand-text italic mb-0.5">{day.toString().padStart(2, '0')}/{mes.toString().padStart(2, '0')}</p>
                          <p className="text-[8px] text-brand-muted font-black uppercase tracking-widest opacity-30">{dateObj.toLocaleDateString('pt-BR', {weekday: 'short'}).replace('.', '')}</p>
                        </td>
                        <td className="px-3 py-2 text-center text-xs font-black text-brand-text opacity-70"><div className="flex flex-col"><span>{r.e1?.substring(0,5) || '—'}</span><span>{r.s1?.substring(0,5) || '—'}</span></div></td>
                        <td className="px-3 py-2 text-center text-xs font-black text-brand-text opacity-70"><div className="flex flex-col"><span>{r.e2?.substring(0,5) || '—'}</span><span>{r.s2?.substring(0,5) || '—'}</span></div></td>
                        <td className="px-3 py-2 text-center text-xs font-black text-brand-text opacity-70"><div className="flex flex-col"><span>{r.e3?.substring(0,5) || '—'}</span><span>{r.s3?.substring(0,5) || '—'}</span></div></td>
                        <td className="px-3 py-2 text-center text-xs font-black text-brand-text bg-brand-bg/20">{r.total || '—'}</td>
                        <td className="px-3 py-2 text-center">
                          {noturnoLinhaMin > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary text-[10px] font-black border border-brand-primary/20">
                              {noturnoDisplay}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-2 text-center text-xs font-black text-brand-accent">{displayExtras || '—'}</td>
                        {!ehHoristaOuNoturno && <td className="px-3 py-2 text-center text-xs font-black text-rose-400">{displayNegativos || '—'}</td>}
                        <td className="px-3 py-2 text-center">{r.evento && (<span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${r.evento === 'Falta' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'}`}>{r.evento}</span>)}</td>
                        <td className="px-6 py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {comentarios.some(c => {
                                if (!c.dataReferencia) return false;
                                try {
                                  const dStr = typeof c.dataReferencia === 'string' ? c.dataReferencia : new Date(c.dataReferencia).toISOString();
                                  return dStr.substring(0, 10) === dateStr;
                                } catch (e) { return false; }
                              }) && (
                                <button 
                                  onClick={() => handleViewComment(dateStr)}
                                  title="Ver comentários" 
                                  className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all"
                                >
                                  <MessageSquare size={14} />
                                </button>
                              )}
                             {canEdit && (
                               <button 
                                 onClick={() => {
                                   setCommentData({ texto: '', tipo: 'DIARIO', data_referencia: dateStr });
                                   setComentarioModalOpen(true);
                                 }}
                                 className="p-2 text-brand-muted hover:text-brand-primary transition-all"
                               >
                                 <PlusCircle size={14} />
                               </button>
                             )}
                             <button onClick={() => handleEdit(r)} className="p-2 text-brand-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all"><Edit2 size={14} /></button>
                           </div>
                         </td>
                      </tr>
                    );
                  })
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-brand-surface border border-brand-border rounded-[3rem] p-8 shadow-xl transition-all">
           <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-3 opacity-60"><Clock size={20} className="text-brand-primary" /> Detalhamento</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <MiniCard label="Horas Trabalhadas" value={analytics.totalTrabalhado} />
              <MiniCard label="Carga Horária Mensal" value={analytics.cargaMensal} />
              <MiniCard label="Feriados" value={analytics.totalFeriados} color="text-emerald-400" />
              <MiniCard label="Extras" value={analytics.totalExtras} color="text-emerald-400" />
              {!ehHoristaOuNoturno && <MiniCard label="Negativas" value={analytics.totalNegativos} color="text-rose-400" />}
              <MiniCard label="Saldo" value={analytics.saldo} color={analytics.saldoMin > 0 ? 'text-brand-accent' : (analytics.saldoMin < 0 && !ehHoristaOuNoturno) ? 'text-rose-400' : 'text-brand-muted opacity-40'} />
           </div>
        </div>
        {(funcionario?.tipo?.includes('Noturno') || analytics.noturno !== '00:00') && (
           <div className="bg-brand-surface border border-brand-border rounded-[3rem] p-8 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity"><Moon size={150} /></div>
              <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-3 opacity-60"><Moon size={20} className="text-brand-primary" /> Resumo Noturno</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-2xl"><p className="text-[10px] font-black text-brand-primary uppercase mb-2 flex items-center gap-2"><Moon size={12} /> Noturnas</p><p className="text-xl font-black text-brand-text">{analytics.noturno}</p></div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl"><p className="text-[10px] font-black text-amber-500 uppercase mb-2 flex items-center gap-2"><Sun size={12} /> Diurnas</p><p className="text-xl font-black text-brand-text">{analytics.diurno}</p></div>
                <div className="bg-brand-accent/10 border border-brand-accent/20 p-4 rounded-2xl"><p className="text-[10px] font-black text-brand-accent uppercase mb-2">Fator Legal</p><p className="text-xl font-black text-brand-text">{analytics.noturnoComFator}</p></div>
              </div>
              <div className="flex flex-col gap-4 px-8 py-6 bg-brand-bg/60 rounded-[2rem] border border-brand-border shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest opacity-60">Base p/ Pagamento (Diário + Not. Fator)</span>
                  <span className="text-2xl font-black text-brand-text">{analytics.baseCalculo}</span>
                </div>
                <div className="mt-2 text-[8px] font-black text-brand-muted/40 uppercase tracking-[0.1em] border-t border-brand-border pt-4 text-center leading-relaxed">
                  * Fator Legal (1.1428): Coeficiente que converte horas cronológicas em horas noturnas de 52m30s para fins de pagamento (Art. 73 CLT).
                </div>
              </div>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-brand-surface border border-brand-border rounded-[3rem] p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] flex items-center gap-3 opacity-60">
              <MessageSquare size={20} className="text-brand-primary" /> Histórico de Comentários
            </h3>
            {canEdit && (
              <button 
                onClick={() => {
                  setCommentData({ texto: '', tipo: 'GERAL', data_referencia: null });
                  setComentarioModalOpen(true);
                }}
                className="text-brand-primary hover:text-brand-primary/80 transition-all"
              >
                <PlusCircle size={20} />
              </button>
            )}
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {comentarios.length === 0 ? (
              <p className="text-center py-10 text-brand-muted text-[10px] font-black uppercase tracking-widest opacity-40">Nenhum comentário registrado.</p>
            ) : (
              comentarios.map(c => (
                <div key={c.id} className="bg-brand-bg/40 border border-brand-border/50 rounded-2xl p-5 hover:border-brand-primary/20 transition-all group">
                  <div className="flex justify-between items-start mb-3 border-b border-brand-border/30 pb-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Users size={12} className="text-brand-primary" />
                        <span className="text-[10px] font-black text-brand-text uppercase tracking-widest">{c.usuario?.nome || 'Sistema'}</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-50">
                        <Clock size={10} className="text-brand-muted" />
                        <span className="text-[9px] text-brand-muted font-bold tracking-tight">
                          {formatDateSafe(c.criadoEm, true)}
                        </span>
                      </div>
                    </div>
                    {canEdit && (
                      <button onClick={() => handleDeleteComment(c.id)} className="text-rose-500/0 group-hover:text-rose-500 transition-all p-2 hover:bg-rose-500/10 rounded-xl">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-brand-text/80 leading-relaxed">{c.texto}</p>
                  {c.dataReferencia && (
                    <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 bg-brand-surface border border-brand-border rounded-lg text-[8px] font-black text-brand-muted uppercase tracking-widest">
                      <Calendar size={10} /> Ref: {formatDateSafe(c.dataReferencia)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-[3rem] p-8 shadow-xl">
          <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-8 flex items-center gap-3 opacity-60">
            <History size={20} className="text-brand-primary" /> Histórico de Ajustes de Saldo
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {ajustes.length === 0 ? (
              <p className="text-center py-10 text-brand-muted text-[10px] font-black uppercase tracking-widest opacity-40">Nenhum ajuste de saldo registrado.</p>
            ) : (
              ajustes.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-brand-bg/40 border border-brand-border/50 rounded-2xl p-5">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs ${a.valor.startsWith('+') ? 'bg-brand-accent/10 text-brand-accent' : 'bg-rose-500/10 text-rose-500'}`}>
                      {a.valor}
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest opacity-60 mb-1">{a.usuario?.nome} em {formatDateSafe(a.data)}</p>
                      <p className="text-sm font-black text-brand-text italic">{a.motivo}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <EditRecordModal isOpen={modalOpen} onClose={() => setModalOpen(false)} record={selectedRecord} onSave={handleSaveRecord} />

      {/* Modal de Comentário */}
      {comentarioModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-bg/90 backdrop-blur-md">
          <div className="bg-brand-surface border border-brand-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-brand-border flex justify-between items-center">
              <h3 className="text-lg font-black text-brand-text flex items-center gap-3 italic">
                <MessageSquare className="text-brand-primary" size={20} /> 
                {commentData.data_referencia ? `Comentar Dia ${formatDateSafe(commentData.data_referencia)}` : 'Adicionar Comentário'}
              </h3>
              <button onClick={() => setComentarioModalOpen(false)} className="p-2 hover:bg-brand-bg rounded-lg text-brand-muted"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <textarea 
                placeholder="Escreva seu comentário aqui..."
                value={commentData.texto}
                onChange={(e) => setCommentData({...commentData, texto: e.target.value})}
                className="w-full h-40 bg-brand-bg border border-brand-border rounded-2xl p-5 text-brand-text outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-inner resize-none font-bold"
              />
            </div>
            <div className="p-8 bg-brand-bg/40 flex gap-4">
              <button onClick={() => setComentarioModalOpen(false)} className="flex-1 py-5 bg-brand-bg text-brand-muted font-black rounded-2xl border border-brand-border transition-all uppercase text-[10px] tracking-widest">Cancelar</button>
              <button onClick={handleAddComment} className="flex-1 py-5 bg-brand-primary text-white font-black rounded-2xl shadow-xl transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                <Save size={14} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ajuste de Saldo */}
      {ajusteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-brand-bg/90 backdrop-blur-md">
          <div className="bg-brand-surface border border-brand-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-brand-border flex justify-between items-center">
              <h3 className="text-lg font-black text-brand-text flex items-center gap-3 italic">
                <PlusCircle className="text-brand-primary" size={20} /> Ajustar Saldo Anterior
              </h3>
              <button onClick={() => setAjusteModalOpen(false)} className="p-2 hover:bg-brand-bg rounded-lg text-brand-muted"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-2 opacity-60 text-center">Valor do Ajuste (HH:mm)</label>
                <div className="flex items-center gap-4">
                  <select 
                    value={ajusteData.valor.substring(0,1)}
                    onChange={(e) => setAjusteData({...ajusteData, valor: e.target.value + ajusteData.valor.substring(1)})}
                    className="bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text font-black"
                  >
                    <option value="+">+</option>
                    <option value="-">-</option>
                  </select>
                  <input 
                    type="time" 
                    value={ajusteData.valor.substring(1)}
                    onChange={(e) => setAjusteData({...ajusteData, valor: ajusteData.valor.substring(0,1) + e.target.value})}
                    className="flex-1 bg-brand-bg border border-brand-border rounded-2xl px-6 py-4 text-brand-text text-xl font-black outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all text-center shadow-inner"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-2 opacity-60">Motivo do Ajuste</label>
                <input 
                  type="text"
                  placeholder="Ex: Pagamento de horas extras"
                  value={ajusteData.motivo}
                  onChange={(e) => setAjusteData({...ajusteData, motivo: e.target.value})}
                  className="w-full bg-brand-bg border border-brand-border rounded-2xl px-6 py-4 text-brand-text outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all font-bold shadow-inner"
                />
              </div>
            </div>
            <div className="p-8 bg-brand-bg/40 flex gap-4">
              <button onClick={() => setAjusteModalOpen(false)} className="flex-1 py-5 bg-brand-bg text-brand-muted font-black rounded-2xl border border-brand-border transition-all uppercase text-[10px] tracking-widest">Cancelar</button>
              <button onClick={handleAddAjuste} className="flex-1 py-5 bg-brand-accent text-white font-black rounded-2xl shadow-xl transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                <Save size={14} /> Aplicar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Funcionario;
