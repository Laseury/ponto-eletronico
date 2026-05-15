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
  CheckCircle2,
  FileText,
  X,
  Printer
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import swalTheme from '../utils/swalTheme';

const PdfModal = ({ isOpen, onClose, defaultAno, preSelecionados }) => {
    const [tipo, setTipo] = useState('resumido');
    const [ano, setAno] = useState(defaultAno);
    const [mesesSelecionados, setMesesSelecionados] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [colabsSelecionados, setColabsSelecionados] = useState([]);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [filtroNome, setFiltroNome] = useState('');

    const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

    useEffect(() => {
        if (isOpen) {
            axios.get('/funcionarios').then(res => {
                setFuncionarios(res.data);
                // Se houver pré-selecionados na tabela principal, usa eles. Caso contrário, seleciona todos.
                if (preSelecionados && preSelecionados.length > 0) {
                    setColabsSelecionados(preSelecionados);
                } else {
                    setColabsSelecionados(res.data.map(f => f.id));
                }
            }).catch(() => {});
        } else {
            setMesesSelecionados([]);
        }
    }, [isOpen]);

    const handleToggleMes = (mes) => {
        setMesesSelecionados(prev => prev.includes(mes) ? prev.filter(m => m !== mes) : [...prev, mes]);
    };

    const handleToggleColab = (id) => {
        setColabsSelecionados(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    const handleToggleAllColabs = () => {
        if (colabsSelecionados.length === funcionarios.length) {
            setColabsSelecionados([]);
        } else {
            setColabsSelecionados(funcionarios.map(f => f.id));
        }
    };

    const funcFiltrados = funcionarios.filter(f => f.nome.toLowerCase().includes(filtroNome.toLowerCase()));

    const fmt = (m) => {
        if (m === 0) return '00:00';
        const absM = Math.abs(m);
        const h = Math.floor(absM / 60).toString().padStart(2, '0');
        const mm = (absM % 60).toString().padStart(2, '0');
        return (m > 0 ? '+' : '-') + `${h}:${mm}`;
    };

    const gerarPdf = async () => {
        if (mesesSelecionados.length === 0) return swalTheme({ title: 'Atenção', text: 'Selecione pelo menos um mês.', icon: 'warning' });
        if (colabsSelecionados.length === 0) return swalTheme({ title: 'Atenção', text: 'Selecione pelo menos um colaborador.', icon: 'warning' });

        setLoadingPdf(true);
        try {
            const mesesOrdenados = [...mesesSelecionados].sort((a,b) => a - b);
            const colsSet = new Set(colabsSelecionados);
            const selectedFuncs = funcionarios.filter(f => colsSet.has(f.id)).sort((a,b) => a.nome.localeCompare(b.nome));

            let htmlContent = `
                <html><head><style>
                  @page { size: portrait; margin: 1cm; }
                  body { font-family: sans-serif; font-size: 9px; color: #333; margin: 0; padding: 0; }
                  .hdr { border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 15px; }
                  .hdr h1 { font-size: 16px; margin: 0; }
                  .hdr p { font-size: 10px; margin: 5px 0 0 0; font-weight: bold; }
                  .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 5px; margin-bottom: 15px; }
                  .card { border: 1px solid #ddd; padding: 6px 4px; border-radius: 4px; background: #f9f9f9; text-align: center; }
                  .card strong { font-size: 7px; text-transform: uppercase; color: #666; display: block; margin-bottom: 2px; }
                  table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 30px; }
                  th { background: #333; color: #fff; padding: 4px 2px; font-size: 8px; text-align: center; }
                  td { border: 1px solid #ddd; padding: 3px 1px; text-align: center; font-size: 8.5px; }
                  .page-break { page-break-before: always; }
                  .notes-box { margin-top: 15px; border: 1px solid #eee; border-radius: 6px; padding: 10px; page-break-inside: avoid; background: #fafafa; }
                  .notes-title { font-size: 8px; font-weight: 900; border-bottom: 1.5px solid #333; padding-bottom: 3px; margin-bottom: 6px; text-transform: uppercase; color: #333; }
                  .note-item { font-size: 7.5px; margin-bottom: 4px; color: #444; border-bottom: 1px solid #f0f0f0; padding-bottom: 3px; text-align: left; }
                  .note-item:last-child { border-bottom: none; }
                  .note-date { font-weight: 900; min-width: 55px; display: inline-block; color: #666; }
                </style></head><body>
            `;

            if (tipo === 'resumido') {
                htmlContent += `<div class="hdr"><h1>RELATÓRIO CONSOLIDADO — RESUMO</h1><p>Ano de Referência: ${ano}</p></div>`;
                
                for (let func of selectedFuncs) {
                    htmlContent += `
                        <div style="background:#eee; padding:5px; margin-bottom:10px; font-weight:bold; font-size:12px;">
                            ${func.nome} <span style="font-size:9px; font-weight:normal; color:#666;">(${func.tipo})</span>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Mês</th>
                                    <th>Dias</th>
                                    <th>Faltas</th>
                                    <th>Feriados</th>
                                    <th>Extras</th>
                                    <th>Negativos</th>
                                    <th>Saldo Mês</th>
                                    <th>Banco</th>
                                    <th>Noturno</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

                    for (let m of mesesOrdenados) {
                        const res = await axios.get(`/relatorio/${m}/${ano}?valor_hora=0`);
                        const r = res.data.find(d => d.id === func.id);
                        if (r) {
                            htmlContent += `
                                <tr>
                                    <td>${MESES[m-1]}</td>
                                    <td>${r.dias_trabalhados}</td>
                                    <td>${r.faltas || 0}</td>
                                    <td>${r.dias_feriados > 0 ? `${r.dias_feriados}d` : '-'}</td>
                                    <td style="color: #2e7d32">${r.total_extras}</td>
                                    <td style="color: #d32f2f">${r.tipo?.includes('Horista') ? '—' : r.total_negativos}</td>
                                    <td><strong>${r.saldo_mes}</strong></td>
                                    <td>${r.banco_horas}</td>
                                    <td>${r.total_noturno && r.total_noturno !== '00:00' ? r.total_noturno : '—'}</td>
                                </tr>
                            `;
                        } else {
                            htmlContent += `<tr><td>${MESES[m-1]}</td><td colspan="8" style="color:#aaa;">Sem registros</td></tr>`;
                        }
                    }
                    htmlContent += `</tbody></table>`;
                }
            } else {
                let firstPage = true;
                for (let func of selectedFuncs) {
                    const ehHoristaOuNoturno = func.tipo === 'Horista' || func.tipo === 'Horista Noturno';
                    
                    for (let m of mesesOrdenados) {
                        if (!firstPage) htmlContent += `<div class="page-break"></div>`;
                        firstPage = false;

                        const [relRes, regRes, comRes, ajuRes] = await Promise.all([
                            axios.get(`/relatorio/${m}/${ano}?valor_hora=0`),
                            axios.get(`/registros/${func.id}?mes=${m}&ano=${ano}`),
                            axios.get(`/comentarios/${func.id}`),
                            axios.get(`/ajustes/${func.id}`)
                        ]);

                        const relatorio = relRes.data.find(d => d.id === func.id) || {};
                        const registros = regRes.data || [];
                        const todosComentarios = comRes.data || [];
                        const todosAjustes = ajuRes.data || [];

                        // Filtrar comentários e ajustes para o mês atual no loop
                        const comentariosMes = todosComentarios.filter(c => {
                            const d = c.dataReferencia ? new Date(c.dataReferencia) : new Date(c.criadoEm);
                            return (d.getUTCMonth() + 1 === m && d.getUTCFullYear() === ano);
                        });

                        const ajustesMes = todosAjustes.filter(a => {
                            const d = new Date(a.data);
                            return d.getUTCMonth() + 1 === m && d.getUTCFullYear() === ano;
                        });

                        // Usar campos já calculados pelo backend (mesmo motor do JSON detalhado)
                        // saldo_anterior vem diretamente do relatorio.controller
                        const _saldoAnteriorStr = relatorio.saldo_anterior || '00:00';

                        htmlContent += `
                            <div class="hdr">
                                <h1>VISO HOTEL — FICHA DE PONTO</h1>
                                <p>Colaborador: ${func.nome} | Período: ${MESES[m-1]} ${ano}</p>
                            </div>
                            <div class="grid">
                                <div class="card"><strong>Tipo</strong>${func.tipo}</div>
                                <div class="card"><strong>Faltas</strong>${relatorio.faltas || 0}</div>
                                <div class="card"><strong>Feriados</strong>${relatorio.dias_feriados > 0 ? `${relatorio.dias_feriados}d - ${relatorio.total_feriados || '00:00'}` : '00:00'}</div>
                                <div class="card"><strong>S. Anterior</strong>${_saldoAnteriorStr}</div>
                                <div class="card"><strong>S. Mês</strong>${relatorio.saldo_mes || '00:00'}</div>
                                <div class="card" style="background: #10b981; color: white; border: none; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);">
                                    <strong style="color: rgba(255,255,255,0.7)">Consolidado</strong>
                                    <span style="font-size: 11px; font-weight: 900;">${relatorio.banco_horas || '00:00'}</span>
                                </div>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width: 55px;">Data</th>
                                        <th style="width: 35px;">E1</th><th style="width: 35px;">S1</th>
                                        <th style="width: 35px;">E2</th><th style="width: 35px;">S2</th>
                                        <th style="width: 35px;">E3</th><th style="width: 35px;">S3</th>
                                        <th style="width: 40px;">Total</th>
                                        <th style="width: 40px;">Not.</th>
                                        <th style="width: 40px;">Ext.</th>
                                        ${!ehHoristaOuNoturno ? '<th style="width: 40px;">Neg.</th>' : ''}
                                        <th style="width: auto;">Evento</th>
                                    </tr>
                                </thead>
                                <tbody>
                        `;

                        const daysInMonth = new Date(ano, m, 0).getDate();
                        const mapa = {};
                        registros.forEach(r => mapa[r.data.substring(0, 10)] = r);

                        for (let d = 1; d <= daysInMonth; d++) {
                            const chave = `${ano}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2,'0')}`;
                            const r = mapa[chave] || {};

                            // Usar os campos extras/negativos gravados no banco pelo registros.controller
                            // (lógica correta: DSR/Folga/Feriado/Atestado não geram débito automático)
                            const displayExtras    = r.extras    || '';
                            const displayNegativos = r.negativos || '';

                            htmlContent += `
                                <tr>
                                    <td>${d.toString().padStart(2,'0')}/${m.toString().padStart(2,'0')}/${ano}</td>
                                    <td>${r.e1?.substring(0,5) || ''}</td><td>${r.s1?.substring(0,5) || ''}</td>
                                    <td>${r.e2?.substring(0,5) || ''}</td><td>${r.s2?.substring(0,5) || ''}</td>
                                    <td>${r.e3?.substring(0,5) || ''}</td><td>${r.s3?.substring(0,5) || ''}</td>
                                    <td>${r.total || ''}</td>
                                    <td>${r.noturno?.substring(0,5) || ''}</td>
                                    <td style="color: #2e7d32">${displayExtras}</td>
                                    ${!ehHoristaOuNoturno ? `<td style="color: #d32f2f">${displayNegativos}</td>` : ''}
                                    <td>${r.evento || ''}</td>
                                </tr>
                            `;
                        }
                        htmlContent += `</tbody></table>`;

                        if (comentariosMes.length > 0) {
                            htmlContent += `
                                <div class="notes-box">
                                    <div class="notes-title">Comentários e Observações do Mês</div>
                                    ${comentariosMes.map(c => `
                                        <div class="note-item">
                                            <span class="note-date">${new Date(c.dataReferencia || c.criadoEm).toLocaleDateString('pt-BR')}</span>
                                            <span><strong>${c.usuario?.nome || 'Sistema'}:</strong> ${c.texto}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        }

                        if (ajustesMes.length > 0) {
                            htmlContent += `
                                <div class="notes-box">
                                    <div class="notes-title">Ajustes de Saldo Realizados</div>
                                    ${ajustesMes.map(a => `
                                        <div class="note-item">
                                            <span class="note-date">${new Date(a.data).toLocaleDateString('pt-BR')}</span>
                                            <span><strong>${a.valor}</strong> — ${a.motivo} (${a.usuario?.nome || 'Sistema'})</span>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        }

                        htmlContent += `
                            <div style="margin-top: 40px; display: flex; justify-content: space-around;">
                                <div style="text-align: center; border-top: 1px solid #000; width: 180px; padding-top: 5px; font-size: 8px;">Assinatura do Colaborador</div>
                                <div style="text-align: center; border-top: 1px solid #000; width: 180px; padding-top: 5px; font-size: 8px;">Assinatura do Responsável</div>
                            </div>
                        `;
                    }
                }
            }

            htmlContent += `</body></html>`;
            const win = window.open('', '_blank');
            win.document.write(htmlContent); win.document.close();
            win.onload = () => win.print();
            onClose();

        } catch (err) {
            console.error(err);
            swalTheme({ title: 'Erro!', text: 'Falha ao gerar PDF.', icon: 'error' });
        } finally {
            setLoadingPdf(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-brand-surface border border-brand-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-surface/30">
              <h3 className="text-xl font-black text-brand-text flex items-center gap-3 tracking-tight italic">
                <Printer size={24} className="text-brand-primary" /> Gerador de Relatório PDF
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-brand-bg rounded-lg text-brand-muted transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] opacity-60">Tipo de Relatório</label>
                     <div className="flex bg-brand-bg p-1.5 rounded-xl border border-brand-border">
                        <button onClick={() => setTipo('resumido')} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${tipo === 'resumido' ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}>Resumido</button>
                        <button onClick={() => setTipo('detalhado')} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${tipo === 'detalhado' ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}>Detalhado</button>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] opacity-60">Ano de Referência</label>
                     <select value={ano} onChange={(e) => setAno(Number(e.target.value))} className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-text text-sm font-black outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-inner">
                        {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
                     </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] opacity-60">Meses</label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                     {MESES.map((m, idx) => {
                         const mNum = idx + 1;
                         const isSelected = mesesSelecionados.includes(mNum);
                         return (
                            <button key={mNum} onClick={() => handleToggleMes(mNum)} className={`py-2 text-[10px] font-black rounded-xl border transition-all uppercase tracking-widest ${isSelected ? 'bg-brand-primary/10 border-brand-primary/50 text-brand-primary' : 'bg-brand-bg border-brand-border text-brand-muted hover:border-brand-primary/30'}`}>
                                {m.substring(0,3)}
                            </button>
                         );
                     })}
                  </div>
               </div>

               <div className="space-y-3">
                  <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] opacity-60">Colaboradores</label>
                      <button onClick={handleToggleAllColabs} className="text-[9px] font-black text-brand-primary uppercase tracking-widest hover:underline">
                          {colabsSelecionados.length === funcionarios.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                      </button>
                  </div>
                  <input type="text" placeholder="Buscar colaborador..." value={filtroNome} onChange={(e) => setFiltroNome(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2 text-xs font-black text-brand-text outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-inner" />
                  
                  <div className="max-h-40 overflow-y-auto bg-brand-bg rounded-xl border border-brand-border p-2 space-y-1 custom-scrollbar">
                      {funcFiltrados.map(f => (
                          <label key={f.id} className="flex items-center gap-3 p-2 hover:bg-brand-surface rounded-lg cursor-pointer transition-colors group">
                              <input type="checkbox" checked={colabsSelecionados.includes(f.id)} onChange={() => handleToggleColab(f.id)} className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary bg-brand-surface border-brand-border" />
                              <span className="text-xs font-black text-brand-text group-hover:text-brand-primary transition-colors">{f.nome}</span>
                              <span className="text-[9px] text-brand-muted uppercase tracking-widest ml-auto opacity-50">{f.tipo}</span>
                          </label>
                      ))}
                      {funcFiltrados.length === 0 && <div className="p-4 text-center text-xs font-black text-brand-muted opacity-50">Nenhum colaborador encontrado.</div>}
                  </div>
               </div>
            </div>

            <div className="p-6 bg-brand-surface/50 border-t border-brand-border flex gap-4">
              <button onClick={onClose} disabled={loadingPdf} className="flex-1 py-4 bg-brand-bg hover:bg-brand-surface text-brand-muted font-black rounded-2xl border border-brand-border transition-all uppercase text-[10px] tracking-widest disabled:opacity-50">Cancelar</button>
              <button onClick={gerarPdf} disabled={loadingPdf} className="flex-1 py-4 bg-brand-primary hover:bg-brand-primary/90 text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50 flex justify-center items-center gap-2">
                 {loadingPdf ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Printer size={16} />}
                 {loadingPdf ? 'Gerando...' : 'Gerar Relatório'}
              </button>
            </div>
          </div>
        </div>
    );
};

const Relatorio = () => {
    const navigate = useNavigate();
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [ano, setAno] = useState(new Date().getFullYear());
    const [valorHora, setValorHora] = useState('');
    const [dados, setDados] = useState([]);
    const [filtroNome, setFiltroNome] = useState('');
    const [loading, setLoading] = useState(true);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [selecionados, setSelecionados] = useState([]);

    const toggleSelecionado = (id) => {
        setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleTodos = () => {
        if (selecionados.length === dadosFiltrados.length) {
            setSelecionados([]);
        } else {
            setSelecionados(dadosFiltrados.map(f => f.id));
        }
    };

    const fetchRelatorio = async () => {
        setLoading(true);
        try {
            const vh = valorHora || 0;
            const res = await axios.get(`/relatorio/${mes}/${ano}?valor_hora=${vh}`);
            setDados(res.data);
        } catch (error) {
            swalTheme({ title: 'Erro', text: 'Não foi possível carregar o relatório mensal.', icon: 'error' });
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
        const alvos = selecionados.length > 0 
            ? dados.filter(f => selecionados.includes(f.id))
            : dadosFiltrados;

        if (alvos.length === 0) return;
        
        const headers = ["Nome", "Tipo", "Dias Trab.", "Faltas", "Feriados", "Extras", "Negativos", "Saldo", "Banco", "Noturno", "Valor Noturno"];
        const rows = alvos.map(f => [
            f.nome, f.tipo, f.dias_trabalhados, f.faltas, `${f.dias_feriados}d - ${f.total_feriados}`, f.total_extras, f.total_negativos, f.saldo_mes, f.banco_horas, f.total_noturno, f.valor_noturno
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob(["\\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Relatorio_${mes}_${ano}.csv`);
        link.click();
    };

    const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <PdfModal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} defaultAno={ano} preSelecionados={selecionados} />

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
                        onClick={() => setIsPdfModalOpen(true)}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-brand-bg font-black py-4 px-8 rounded-[1.5rem] shadow-xl shadow-brand-primary/20 transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
                      >
                        <FileText size={18} /> {selecionados.length > 0 ? `PDF (${selecionados.length})` : 'Gerar PDF'}
                      </button>

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
                                <th className="px-6 py-5 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={selecionados.length > 0 && selecionados.length === dadosFiltrados.length}
                                        onChange={toggleTodos}
                                        className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary bg-brand-surface border-brand-border"
                                    />
                                </th>
                                <th className="px-8 py-5 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] opacity-60">Colaborador</th>
                                <th className="px-6 py-5 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] opacity-60">Tipo</th>
                                <th className="px-6 py-5 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] opacity-60 text-center">Dias</th>
                                <th className="px-6 py-5 text-[9px] font-black text-brand-muted uppercase tracking-[0.25em] opacity-60 text-center">Faltas</th>
                                <th className="px-6 py-5 text-[9px] font-black text-emerald-500/80 uppercase tracking-[0.25em] opacity-60 text-center">Feriados</th>
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
                                            <p className="text-lg font-black text-brand-muted uppercase tracking-widest opacity-50">Nenhum registro para este período.</p>
                                         </div>
                                    </td>
                                </tr>
                            ) : dadosFiltrados.map((f, i) => {
                                const corSaldo = f.saldo_mes?.startsWith('+') ? 'text-brand-accent' : f.saldo_mes?.startsWith('-') ? 'text-rose-400' : 'text-brand-muted';
                                const corBanco = f.banco_horas?.startsWith('+') ? 'text-brand-accent' : f.banco_horas?.startsWith('-') ? 'text-rose-400' : 'text-brand-muted';
                                return (
                                 <tr key={f.id} className={`hover:bg-brand-bg transition-colors group ${selecionados.includes(f.id) ? 'bg-brand-primary/5' : ''}`}>
                                        <td className="px-6 py-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={selecionados.includes(f.id)}
                                                onChange={() => toggleSelecionado(f.id)}
                                                className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary bg-brand-surface border-brand-border"
                                            />
                                        </td>
                                        <td className="px-8 py-4">
                                            <Link to={`/funcionario?id=${f.id}&mes=${mes}&ano=${ano}`} className="text-sm font-black text-brand-text hover:text-brand-primary flex items-center gap-2 transition-colors italic tracking-tight">
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
                                        <td className={`px-6 py-4 text-center text-xs font-black ${f.faltas > 0 ? 'text-rose-500 underline decoration-rose-500/30' : 'text-brand-muted opacity-50'}`}>{f.faltas || 0}</td>
                                        <td className={`px-6 py-4 text-center text-xs font-black text-emerald-500 bg-emerald-500/5`}>{f.dias_feriados > 0 ? `${f.dias_feriados}d - ${f.total_feriados}` : '00:00'}</td>
                                        <td className="px-6 py-4 text-center text-xs font-black text-brand-accent bg-brand-accent/5">{f.total_extras}</td>
                                        <td className="px-6 py-4 text-center text-xs font-black text-rose-400 bg-rose-500/5">
                                            {f.tipo?.includes('Horista') ? '—' : f.total_negativos}
                                        </td>
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
                        <div className="flex gap-6">
                            <div className="w-1.5 h-14 bg-emerald-500 rounded-full mt-1 shadow-lg shadow-emerald-500/30"></div>
                            <div>
                                <p className="text-brand-text font-black text-base uppercase tracking-tight">Eventos de Folga & Feriados</p>
                                <p className="text-brand-muted text-sm font-medium mt-1 leading-relaxed opacity-80">
                                    <strong>DSR/Feriado:</strong> Neutros para banco de horas. Horas trabalhadas não geram extras. <br/>
                                    <strong>Folga Feriado / Pago:</strong> Eventos neutros para compensação de saldo ou folgas vinculadas a feriados.
                                </p>
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
