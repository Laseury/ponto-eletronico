import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  User,
  ChevronRight,
  Loader2,
  Copy,
  Trash2,
  RotateCcw,
  FileUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import swalTheme from '../utils/swalTheme';
import { useAuth } from '../context/AuthContext';

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES_NOMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const LancamentoHoras = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [funcionarios, setFuncionarios] = useState([]);
  const [fId, setFId] = useState('');
  const [mesSelect, setMesSelect] = useState('');
  const [anoSelect, setAnoSelect] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });
  const [grid, setGrid] = useState([]);
  const [originalGrid, setOriginalGrid] = useState([]);

  // Init com mês/ano atual
  useEffect(() => {
    const agora = new Date();
    setAnoSelect(String(agora.getFullYear()));
    setMesSelect(String(agora.getMonth() + 1).padStart(2, '0'));

    axios.get('/funcionarios')
      .then(res => setFuncionarios(res.data.filter(f => f.ativo !== false)))
      .catch(() => swalTheme({ title: 'Erro', text: 'Não foi possível carregar a lista de funcionários.', icon: 'error' }));
  }, []);

  // Gerar grid do mês quando muda func/mes/ano  
  const buildGrid = useCallback(async () => {
    if (!fId || !mesSelect || !anoSelect) {
      setGrid([]);
      setOriginalGrid([]);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`/registros/${fId}?mes=${mesSelect}&ano=${anoSelect}`);
      const existentes = {};
      (res.data || []).forEach(r => {
        existentes[r.data.substring(0, 10)] = r;
      });

      const diasNoMes = new Date(parseInt(anoSelect), parseInt(mesSelect), 0).getDate();
      const novaGrid = [];

      for (let d = 1; d <= diasNoMes; d++) {
        const dateStr = `${anoSelect}-${mesSelect}-${String(d).padStart(2, '0')}`;
        const dateObj = new Date(dateStr + 'T12:00:00');
        const diaSemana = dateObj.getDay();
        const reg = existentes[dateStr];

        novaGrid.push({
          dia: d,
          data: dateStr,
          diaSemana,
          diaSemanaLabel: DIAS_SEMANA[diaSemana],
          e1: reg?.e1?.substring(0, 5) || '',
          s1: reg?.s1?.substring(0, 5) || '',
          e2: reg?.e2?.substring(0, 5) || '',
          s2: reg?.s2?.substring(0, 5) || '',
          e3: reg?.e3?.substring(0, 5) || '',
          s3: reg?.s3?.substring(0, 5) || '',
          evento: reg?.evento || '',
          hasData: !!(reg?.e1 || reg?.evento),
          modified: false,
          status: reg?.e1 || reg?.evento ? 'salvo' : 'vazio' // salvo | vazio | modificado | salvando | erro | sucesso
        });
      }

      setGrid(novaGrid);
      setOriginalGrid(JSON.parse(JSON.stringify(novaGrid)));
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      swalTheme({ title: 'Erro', text: 'Não foi possível carregar os registros.', icon: 'error' });
    } finally {
      setLoading(false);
    }
  }, [fId, mesSelect, anoSelect]);

  useEffect(() => {
    buildGrid();
  }, [buildGrid]);

  const handleCellChange = (index, field, value) => {
    setGrid(prev => {
      const newGrid = [...prev];
      newGrid[index] = {
        ...newGrid[index],
        [field]: value,
        modified: true,
        status: 'modificado'
      };
      return newGrid;
    });
  };

  const getModifiedRows = useMemo(() => {
    return grid.filter(row => row.modified);
  }, [grid]);

  const handleCopyDown = (index) => {
    if (index >= grid.length - 1) return;
    const source = grid[index];
    setGrid(prev => {
      const newGrid = [...prev];
      for (let i = index + 1; i < newGrid.length; i++) {
        // Pula domingos automaticamente se a origem não for dom
        if (newGrid[i].diaSemana === 0 && source.diaSemana !== 0) continue;
        newGrid[i] = {
          ...newGrid[i],
          e1: source.e1,
          s1: source.s1,
          e2: source.e2,
          s2: source.s2,
          e3: source.e3,
          s3: source.s3,
          evento: source.evento,
          modified: true,
          status: 'modificado'
        };
      }
      return newGrid;
    });
  };

  const handleClearRow = (index) => {
    setGrid(prev => {
      const newGrid = [...prev];
      newGrid[index] = {
        ...newGrid[index],
        e1: '', s1: '', e2: '', s2: '', e3: '', s3: '',
        evento: '',
        modified: true,
        status: 'modificado'
      };
      return newGrid;
    });
  };

  const handleResetAll = () => {
    setGrid(JSON.parse(JSON.stringify(originalGrid)));
  };

  const cleanTimeStr = (t) => {
    if (!t) return '';
    const trimmed = t.trim();
    if (!trimmed) return '';
    if (trimmed.length > 5 && trimmed.includes(':')) {
        return trimmed.substring(0, 5);
    }
    return trimmed;
  };

  const handleImportarCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!fId || !mesSelect || !anoSelect) {
      swalTheme({ title: 'Atenção', text: 'Selecione Colaborador, Mês e Ano antes de importar.', icon: 'warning' });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');

      let importedCount = 0;
      setGrid(prevGrid => {
        const newGrid = [...prevGrid];
        
        lines.forEach(line => {
          const cols = line.split(',');
          // A linha precisa ter pelo menos as colunas pra dia, e1, s1, e2, s2
          if (cols.length >= 5) {
            const dayStr = cols[0].trim();
            const diaNum = parseInt(dayStr, 10);

            if (!isNaN(diaNum) && diaNum >= 1 && diaNum <= 31) {
              const e1 = cleanTimeStr(cols[1]);
              const s1 = cleanTimeStr(cols[2]);
              const e2 = cleanTimeStr(cols[3]);
              const s2 = cleanTimeStr(cols[4]);
              const e3 = cleanTimeStr(cols[5]);
              const s3 = cleanTimeStr(cols[6]);

              if (e1 && e1.toLowerCase() === 'e1') return;

              const dateStr = `${anoSelect}-${mesSelect}-${String(diaNum).padStart(2, '0')}`;
              const gridIndex = newGrid.findIndex(g => g.data === dateStr);

              if (gridIndex >= 0) {
                const temDado = e1 || s1 || e2 || s2 || e3 || s3;
                if (temDado) {
                  newGrid[gridIndex] = {
                    ...newGrid[gridIndex],
                    e1: e1.length === 4 ? `0${e1}` : e1,
                    s1: s1.length === 4 ? `0${s1}` : s1,
                    e2: e2.length === 4 ? `0${e2}` : e2,
                    s2: s2.length === 4 ? `0${s2}` : s2,
                    e3: e3.length === 4 ? `0${e3}` : e3,
                    s3: s3.length === 4 ? `0${s3}` : s3,
                    modified: true,
                    status: 'modificado'
                  };
                  importedCount++;
                }
              }
            }
          }
        });

        setTimeout(() => {
          if (importedCount > 0) {
            swalTheme({ title: 'Importado!', text: `${importedCount} dias preenchidos a partir do CSV. Revise e clique em Salvar Tudo.`, icon: 'success' });
          } else {
            swalTheme({ title: 'Aviso', text: 'Nenhum horário válido encontrado no CSV para os dias deste mês.', icon: 'warning' });
          }
        }, 100);

        return newGrid;
      });
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const handleSaveAll = async () => {
    const modified = grid.filter(row => row.modified);
    if (modified.length === 0) {
      swalTheme({ title: 'Nada a salvar', text: 'Nenhum dia foi modificado.', icon: 'info' });
      return;
    }

    const confirm = await swalTheme({
      title: 'Confirmar Lançamento',
      html: `Deseja salvar <b>${modified.length}</b> dia(s) modificado(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, salvar tudo',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    setSaving(true);
    setSaveProgress({ current: 0, total: modified.length });

    const newGrid = [...grid];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < modified.length; i++) {
      const row = modified[i];
      const gridIndex = grid.findIndex(g => g.data === row.data);

      newGrid[gridIndex] = { ...newGrid[gridIndex], status: 'salvando' };
      setGrid([...newGrid]);

      try {
        await axios.post('/registros', {
          funcionario_id: fId,
          data: row.data,
          e1: row.e1 || null,
          s1: row.s1 || null,
          e2: row.e2 || null,
          s2: row.s2 || null,
          e3: row.e3 || null,
          s3: row.s3 || null,
          evento: row.evento || null
        }, {
          headers: { 'x-usuario': user?.usuario || 'anonimo' }
        });

        newGrid[gridIndex] = { ...newGrid[gridIndex], status: 'sucesso', modified: false };
        successCount++;
      } catch (error) {
        newGrid[gridIndex] = { ...newGrid[gridIndex], status: 'erro' };
        errorCount++;
      }

      setSaveProgress({ current: i + 1, total: modified.length });
      setGrid([...newGrid]);
    }

    setSaving(false);

    if (errorCount === 0) {
      swalTheme({
        title: 'Concluído!',
        text: `${successCount} dia(s) salvo(s) com sucesso.`,
        icon: 'success'
      });
    } else {
      swalTheme({
        title: 'Parcialmente Salvo',
        text: `${successCount} salvo(s), ${errorCount} com erro.`,
        icon: 'warning'
      });
    }

    // Refresh grid
    setTimeout(() => buildGrid(), 1500);
  };

  const funcionarioSelecionado = funcionarios.find(f => String(f.id) === String(fId));

  const isToday = (dateStr) => {
    return new Date().toISOString().substring(0, 10) === dateStr;
  };

  const getRowBg = (row) => {
    if (row.status === 'salvando') return 'bg-brand-primary/5';
    if (row.status === 'sucesso') return 'bg-emerald-500/5';
    if (row.status === 'erro') return 'bg-rose-500/5';
    if (row.modified) return 'bg-amber-500/5';
    if (isToday(row.data)) return 'bg-brand-primary/10';
    if (row.diaSemana === 0) return 'bg-brand-bg/40';
    return '';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/lancamento')}
            className="p-3 bg-brand-surface border border-brand-border rounded-xl text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-all shadow-xl"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-brand-text tracking-tighter flex items-center gap-3 italic">
              Lançamento de Horas
              <span className="text-brand-primary">.</span>
            </h1>
            <p className="text-brand-muted font-bold mt-0.5 text-xs opacity-60">Preencha o mês completo de uma vez.</p>
          </div>
        </div>

        {getModifiedRows.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
              {getModifiedRows.length} dia(s) modificado(s)
            </span>
            <button
              onClick={handleResetAll}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-brand-muted hover:text-brand-text text-[9px] font-black uppercase tracking-widest transition-all"
            >
              <RotateCcw size={14} /> Desfazer
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-black rounded-xl shadow-lg shadow-brand-primary/30 transition-all text-[10px] uppercase tracking-widest disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {saveProgress.current}/{saveProgress.total}
                </>
              ) : (
                <>
                  <Save size={16} />
                  Salvar Tudo
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Seleção de Funcionário e Mês */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
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

          <div>
            <label className="block text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-3 px-1 opacity-40">Mês</label>
            <select
              value={mesSelect}
              onChange={(e) => setMesSelect(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3.5 text-brand-text text-sm font-black outline-none focus:ring-4 focus:ring-brand-primary/20 transition-all shadow-inner cursor-pointer"
            >
              <option value="" className="bg-brand-surface">Mês</option>
              {MESES_NOMES.map((nome, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, '0')} className="bg-brand-surface">{nome}</option>
              ))}
            </select>
          </div>

          <div>
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

        {funcionarioSelecionado && (
          <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-brand-bg/50 border border-brand-border/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                <User size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-brand-text">{funcionarioSelecionado.nome}</p>
                <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest opacity-50">{funcionarioSelecionado.tipo}</p>
              </div>
            </div>

            {mesSelect && anoSelect && (
              <div className="flex items-center gap-3 relative animate-in fade-in zoom-in-95 duration-300">
                <input 
                  type="file" 
                  accept=".csv" 
                  id="csvUpload" 
                  className="hidden" 
                  onChange={handleImportarCSV} 
                />
                <label 
                  htmlFor="csvUpload" 
                  className="flex items-center gap-2 px-6 py-3 bg-brand-surface border border-brand-primary/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary hover:bg-brand-primary/10 transition-all shadow-xl cursor-pointer shadow-brand-primary/10"
                >
                  <FileUp size={16} /> Importar CSV
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legenda */}
      {fId && mesSelect && anoSelect && (
        <div className="flex flex-wrap items-center gap-6 px-2">
          <div className="flex items-center gap-2 text-[9px] font-black text-brand-muted uppercase tracking-widest opacity-50">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-primary/40"></div> Hoje
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black text-brand-muted uppercase tracking-widest opacity-50">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> Modificado
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black text-brand-muted uppercase tracking-widest opacity-50">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Salvo
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black text-brand-muted uppercase tracking-widest opacity-50">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-bg/80 border border-brand-border"></div> Domingo
          </div>
        </div>
      )}

      {/* Grid Principal */}
      {fId && mesSelect && anoSelect && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-brand-border flex justify-between items-center bg-brand-surface/50">
            <h2 className="text-lg font-black text-brand-text flex items-center gap-3 tracking-tighter italic">
              <Calendar className="text-brand-primary" size={20} />
              {MESES_NOMES[parseInt(mesSelect) - 1]} {anoSelect}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest opacity-40">
                {grid.filter(r => r.hasData || r.modified).length}/{grid.length} dias preenchidos
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
              <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest opacity-60">Carregando registros...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" style={{ minWidth: '1000px' }}>
                <thead>
                  <tr className="bg-brand-bg/50 border-b border-brand-border">
                    <th className="px-3 py-3 text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] text-center opacity-60 sticky left-0 bg-brand-bg/90 z-10 w-16">Dia</th>
                    <th className="px-2 py-3 text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] text-center opacity-60">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Turno 1</span>
                        <span className="text-[7px] opacity-40">E1 / S1</span>
                      </div>
                    </th>
                    <th className="px-2 py-3 text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] text-center opacity-60">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Turno 2</span>
                        <span className="text-[7px] opacity-40">E2 / S2</span>
                      </div>
                    </th>
                    <th className="px-2 py-3 text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] text-center opacity-60">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Turno 3</span>
                        <span className="text-[7px] opacity-40">E3 / S3</span>
                      </div>
                    </th>
                    <th className="px-2 py-3 text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] text-center opacity-60 w-28">Evento</th>
                    <th className="px-2 py-3 text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] text-center opacity-60 w-16">Status</th>
                    <th className="px-2 py-3 text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] text-center opacity-60 w-20">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/20">
                  {grid.map((row, idx) => (
                    <tr
                      key={row.data}
                      className={`transition-colors hover:bg-brand-bg/30 ${getRowBg(row)}`}
                    >
                      {/* Dia */}
                      <td className="px-3 py-2 text-center sticky left-0 bg-brand-surface/90 z-10 border-r border-brand-border/20">
                        <div className="flex flex-col items-center">
                          <span className={`text-sm font-black leading-none ${isToday(row.data) ? 'text-brand-primary' : 'text-brand-text'}`}>
                            {String(row.dia).padStart(2, '0')}
                          </span>
                          <span className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${row.diaSemana === 0 ? 'text-rose-400 opacity-70' : 'text-brand-muted opacity-30'}`}>
                            {row.diaSemanaLabel}
                          </span>
                        </div>
                      </td>

                      {/* Turno 1 */}
                      <td className="px-1 py-1.5">
                        <div className="flex gap-1 justify-center">
                          <input
                            type="time"
                            value={row.e1}
                            onChange={(e) => handleCellChange(idx, 'e1', e.target.value)}
                            disabled={!!row.evento}
                            className="bg-brand-bg/60 border border-brand-border/30 rounded-lg px-1.5 py-1.5 text-[11px] font-black text-brand-text w-[72px] text-center focus:ring-2 focus:ring-brand-primary/30 outline-none transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-inner"
                          />
                          <input
                            type="time"
                            value={row.s1}
                            onChange={(e) => handleCellChange(idx, 's1', e.target.value)}
                            disabled={!!row.evento}
                            className="bg-brand-bg/60 border border-brand-border/30 rounded-lg px-1.5 py-1.5 text-[11px] font-black text-brand-text w-[72px] text-center focus:ring-2 focus:ring-brand-primary/30 outline-none transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-inner"
                          />
                        </div>
                      </td>

                      {/* Turno 2 */}
                      <td className="px-1 py-1.5">
                        <div className="flex gap-1 justify-center">
                          <input
                            type="time"
                            value={row.e2}
                            onChange={(e) => handleCellChange(idx, 'e2', e.target.value)}
                            disabled={!!row.evento}
                            className="bg-brand-bg/60 border border-brand-border/30 rounded-lg px-1.5 py-1.5 text-[11px] font-black text-brand-text w-[72px] text-center focus:ring-2 focus:ring-brand-primary/30 outline-none transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-inner"
                          />
                          <input
                            type="time"
                            value={row.s2}
                            onChange={(e) => handleCellChange(idx, 's2', e.target.value)}
                            disabled={!!row.evento}
                            className="bg-brand-bg/60 border border-brand-border/30 rounded-lg px-1.5 py-1.5 text-[11px] font-black text-brand-text w-[72px] text-center focus:ring-2 focus:ring-brand-primary/30 outline-none transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-inner"
                          />
                        </div>
                      </td>

                      {/* Turno 3 */}
                      <td className="px-1 py-1.5">
                        <div className="flex gap-1 justify-center">
                          <input
                            type="time"
                            value={row.e3}
                            onChange={(e) => handleCellChange(idx, 'e3', e.target.value)}
                            disabled={!!row.evento}
                            className="bg-brand-bg/60 border border-brand-border/30 rounded-lg px-1.5 py-1.5 text-[11px] font-black text-brand-text w-[72px] text-center focus:ring-2 focus:ring-brand-primary/30 outline-none transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-inner"
                          />
                          <input
                            type="time"
                            value={row.s3}
                            onChange={(e) => handleCellChange(idx, 's3', e.target.value)}
                            disabled={!!row.evento}
                            className="bg-brand-bg/60 border border-brand-border/30 rounded-lg px-1.5 py-1.5 text-[11px] font-black text-brand-text w-[72px] text-center focus:ring-2 focus:ring-brand-primary/30 outline-none transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-inner"
                          />
                        </div>
                      </td>

                      {/* Evento */}
                      <td className="px-1 py-1.5">
                        <select
                          value={row.evento}
                          onChange={(e) => handleCellChange(idx, 'evento', e.target.value)}
                          className="w-full bg-brand-bg/60 border border-brand-border/30 rounded-lg px-2 py-1.5 text-[10px] font-black text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all shadow-inner cursor-pointer"
                        >
                          <option value="">—</option>
                          <option value="Folga">🏖️ Folga</option>
                          <option value="Falta">❌ Falta</option>
                          <option value="Atestado">🏥 Atestado</option>
                          <option value="Ferias">🏄 Férias</option>
                          <option value="DSR">📅 DSR</option>
                          <option value="Feriado">🎉 Feriado</option>
                          <option value="Folga Banco">🏦 Folga Banco</option>
                        </select>
                      </td>

                      {/* Status */}
                      <td className="px-2 py-1.5 text-center">
                        {row.status === 'salvando' && (
                          <div className="w-4 h-4 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto"></div>
                        )}
                        {row.status === 'sucesso' && (
                          <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                        )}
                        {row.status === 'erro' && (
                          <AlertCircle size={16} className="text-rose-500 mx-auto" />
                        )}
                        {row.status === 'modificado' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mx-auto animate-pulse"></div>
                        )}
                        {row.status === 'salvo' && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500/50 mx-auto"></div>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-1 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleCopyDown(idx)}
                            title="Copiar para os dias abaixo"
                            className="p-1.5 text-brand-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            onClick={() => handleClearRow(idx)}
                            title="Limpar este dia"
                            className="p-1.5 text-brand-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Barra de Salvar Fixa */}
          {getModifiedRows.length > 0 && (
            <div className="p-4 bg-brand-bg/60 border-t border-brand-border flex justify-between items-center sticky bottom-0">
              <div className="flex items-center gap-4 text-brand-muted text-[9px] font-black uppercase tracking-widest opacity-50">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  {getModifiedRows.length} dia(s) pendente(s)
                </div>
              </div>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="flex items-center gap-2 px-10 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-black rounded-xl shadow-lg shadow-brand-primary/30 transition-all text-[10px] uppercase tracking-widest disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Gravando {saveProgress.current}/{saveProgress.total}...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Salvar {getModifiedRows.length} Dia(s)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dicas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-brand-surface border border-brand-border rounded-2xl flex gap-4 items-start shadow-xl">
          <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary"><Clock size={18} /></div>
          <div>
            <h4 className="text-brand-text font-black text-xs uppercase tracking-tight italic">Preenchimento Rápido</h4>
            <p className="text-brand-muted text-[11px] mt-1.5 font-medium leading-relaxed opacity-50">Preencha um dia e use o botão copiar para replicar os horários nos dias seguintes.</p>
          </div>
        </div>
        <div className="p-6 bg-brand-surface border border-brand-border rounded-2xl flex gap-4 items-start shadow-xl">
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500"><AlertCircle size={18} /></div>
          <div>
            <h4 className="text-brand-text font-black text-xs uppercase tracking-tight italic">Domingos</h4>
            <p className="text-brand-muted text-[11px] mt-1.5 font-medium leading-relaxed opacity-50">Ao copiar, domingos são automaticamente pulados para facilitar o preenchimento.</p>
          </div>
        </div>
        <div className="p-6 bg-brand-surface border border-brand-border rounded-2xl flex gap-4 items-start shadow-xl">
          <div className="p-2.5 bg-brand-accent/10 rounded-xl text-brand-accent"><CheckCircle2 size={18} /></div>
          <div>
            <h4 className="text-brand-text font-black text-xs uppercase tracking-tight italic">Salvamento</h4>
            <p className="text-brand-muted text-[11px] mt-1.5 font-medium leading-relaxed opacity-50">Todas as alterações são salvas de uma vez. Registros existentes serão sobrescritos.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LancamentoHoras;
