import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  FileUp,
  Sparkles,
  Zap,
  Table
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import swalTheme from '../utils/swalTheme';
import { useAuth } from '../context/AuthContext';

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES_NOMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const TIME_COLUMNS = ['e1', 's1', 'e2', 's2', 'e3', 's3'];
const ALL_COLUMNS = ['e1', 's1', 'e2', 's2', 'e3', 's3', 'evento'];

const COLUMN_LABELS = {
  e1: 'Entrada 1',
  s1: 'Saída 1',
  e2: 'Entrada 2',
  s2: 'Saída 2',
  e3: 'Entrada 3',
  s3: 'Saída 3',
  evento: 'Evento / Ocorrência'
};

// Formatação inteligente enquanto digita
const formatTimeInput = (val) => {
  if (!val) return '';
  let clean = val.replace(/[^\d:]/g, '');
  
  if (clean.includes(':')) {
    const parts = clean.split(':');
    const hh = parts[0].slice(0, 2);
    const mm = (parts[1] || '').slice(0, 2);
    return mm.length > 0 ? `${hh}:${mm}` : hh;
  }
  
  const digits = clean.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
};

// Normalização ao sair da célula (ex: digita '8' -> '08:00', '13' -> '13:00', '830' -> '08:30')
const normalizeTimeOnBlur = (val) => {
  if (!val) return '';
  const trimmed = val.trim();
  if (!trimmed) return '';

  if (trimmed.includes(':')) {
    const [hStr, mStr] = trimmed.split(':');
    let h = parseInt(hStr, 10) || 0;
    let m = parseInt(mStr || '0', 10) || 0;
    if (h > 23) h = 23;
    if (m > 59) m = 59;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 1) {
    return `0${digits}:00`;
  }
  if (digits.length === 2) {
    let h = parseInt(digits, 10);
    if (h > 23) h = 23;
    return `${String(h).padStart(2, '0')}:00`;
  }
  if (digits.length === 3) {
    let h = parseInt(digits.slice(0, 1), 10);
    let m = parseInt(digits.slice(1, 3), 10);
    if (m > 59) m = 59;
    return `0${h}:${String(m).padStart(2, '0')}`;
  }
  if (digits.length >= 4) {
    let h = parseInt(digits.slice(0, 2), 10);
    let m = parseInt(digits.slice(2, 4), 10);
    if (h > 23) h = 23;
    if (m > 59) m = 59;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return trimmed;
};

// Calcula o total de horas trabalhadas no dia
const calculateDayTotal = (row) => {
  if (row.evento) return null;
  let totalMinutes = 0;
  
  const diffMinutes = (e, s) => {
    if (!e || !s || e.length < 5 || s.length < 5) return 0;
    const [h1, m1] = e.split(':').map(Number);
    const [h2, m2] = s.split(':').map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
    let min1 = h1 * 60 + m1;
    let min2 = h2 * 60 + m2;
    if (min2 < min1) min2 += 24 * 60; // Caso vire a noite
    return min2 - min1;
  };

  totalMinutes += diffMinutes(row.e1, row.s1);
  totalMinutes += diffMinutes(row.e2, row.s2);
  totalMinutes += diffMinutes(row.e3, row.s3);

  if (totalMinutes === 0) return null;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h${m > 0 ? ` ${String(m).padStart(2, '0')}m` : ' 00m'}`;
};

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

  // Célula atualmente em foco (para feedback visual e navegação estilo Excel)
  const [focusedCell, setFocusedCell] = useState({ rowIndex: null, colField: null });
  const [fastDay, setFastDay] = useState('');
  const [isZenMode, setIsZenMode] = useState(false);
  const cellRefs = useRef({});

  // Carregar lista de funcionários
  useEffect(() => {
    const agora = new Date();
    setAnoSelect(String(agora.getFullYear()));
    setMesSelect(String(agora.getMonth() + 1).padStart(2, '0'));

    axios.get('/funcionarios')
      .then(res => setFuncionarios(res.data.filter(f => f.ativo !== false)))
      .catch(() => swalTheme({ title: 'Erro', text: 'Não foi possível carregar a lista de funcionários.', icon: 'error' }));
  }, []);

  // Focar célula programaticamente
  const focusCell = useCallback((rowIndex, colField) => {
    if (rowIndex < 0 || rowIndex >= grid.length) return;
    const refKey = `${rowIndex}_${colField}`;
    const el = cellRefs.current[refKey];
    if (el) {
      el.focus();
      if (el.select && typeof el.select === 'function') {
        el.select();
      }
      setFocusedCell({ rowIndex, colField });
    }
  }, [grid.length]);

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
          status: reg?.e1 || reg?.evento ? 'salvo' : 'vazio'
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

  // Alteração de célula de horário
  const handleTimeChange = (index, field, value) => {
    const formatted = formatTimeInput(value);
    setGrid(prev => {
      const newGrid = [...prev];
      newGrid[index] = {
        ...newGrid[index],
        [field]: formatted,
        modified: true,
        status: 'modificado'
      };
      return newGrid;
    });
  };

  // Normalizar valor ao sair do campo (Blur)
  const handleTimeBlur = (index, field) => {
    setGrid(prev => {
      const newGrid = [...prev];
      const currentVal = newGrid[index][field];
      const normalized = normalizeTimeOnBlur(currentVal);
      if (normalized !== currentVal) {
        newGrid[index] = {
          ...newGrid[index],
          [field]: normalized,
          modified: true,
          status: 'modificado'
        };
      }
      return newGrid;
    });
  };

  // Alteração de Evento
  const handleEventoChange = (index, value) => {
    setGrid(prev => {
      const newGrid = [...prev];
      newGrid[index] = {
        ...newGrid[index],
        evento: value,
        modified: true,
        status: 'modificado'
      };
      return newGrid;
    });
  };

  // Navegação de Teclado Estilo Excel
  const handleKeyDown = (e, rowIndex, colField) => {
    const isShift = e.shiftKey;
    const isCtrl = e.ctrlKey || e.metaKey;
    const colIndex = ALL_COLUMNS.indexOf(colField);

    // Enter ou Seta para Baixo -> Desce para a mesma coluna no dia seguinte
    if ((e.key === 'Enter' && !isShift) || (e.key === 'ArrowDown' && !isCtrl)) {
      e.preventDefault();
      handleTimeBlur(rowIndex, colField);
      if (rowIndex < grid.length - 1) {
        focusCell(rowIndex + 1, colField);
      }
      return;
    }

    // Shift + Enter ou Seta para Cima -> Sobe para a mesma coluna no dia anterior
    if ((e.key === 'Enter' && isShift) || (e.key === 'ArrowUp' && !isCtrl)) {
      e.preventDefault();
      handleTimeBlur(rowIndex, colField);
      if (rowIndex > 0) {
        focusCell(rowIndex - 1, colField);
      }
      return;
    }

    // Seta para Direita -> Se estiver no final do texto ou todo selecionado, vai para próxima coluna
    if (e.key === 'ArrowRight' && !isCtrl) {
      const input = e.target;
      const isAtEnd = input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
      const isAllSelected = input.selectionStart === 0 && input.selectionEnd === input.value.length;
      
      if (isAtEnd || isAllSelected || input.value.length === 0) {
        if (colIndex < ALL_COLUMNS.length - 1) {
          e.preventDefault();
          handleTimeBlur(rowIndex, colField);
          focusCell(rowIndex, ALL_COLUMNS[colIndex + 1]);
        }
      }
      return;
    }

    // Seta para Esquerda -> Se estiver no início do texto ou todo selecionado, vai para coluna anterior
    if (e.key === 'ArrowLeft' && !isCtrl) {
      const input = e.target;
      const isAtStart = input.selectionStart === 0 && input.selectionEnd === 0;
      const isAllSelected = input.selectionStart === 0 && input.selectionEnd === input.value.length;

      if (isAtStart || isAllSelected || input.value.length === 0) {
        if (colIndex > 0) {
          e.preventDefault();
          handleTimeBlur(rowIndex, colField);
          focusCell(rowIndex, ALL_COLUMNS[colIndex - 1]);
        }
      }
      return;
    }

    // Tab -> Avança para a próxima coluna ou pula para a primeira da próxima linha
    if (e.key === 'Tab' && !isShift) {
      e.preventDefault();
      handleTimeBlur(rowIndex, colField);
      if (colIndex < ALL_COLUMNS.length - 1) {
        focusCell(rowIndex, ALL_COLUMNS[colIndex + 1]);
      } else if (rowIndex < grid.length - 1) {
        focusCell(rowIndex + 1, ALL_COLUMNS[0]);
      }
      return;
    }

    // Shift + Tab -> Volta para a coluna anterior ou pula para a última da linha anterior
    if (e.key === 'Tab' && isShift) {
      e.preventDefault();
      handleTimeBlur(rowIndex, colField);
      if (colIndex > 0) {
        focusCell(rowIndex, ALL_COLUMNS[colIndex - 1]);
      } else if (rowIndex > 0) {
        focusCell(rowIndex - 1, ALL_COLUMNS[ALL_COLUMNS.length - 1]);
      }
      return;
    }

    // Home / End / PageUp / PageDown no Excel
    if (e.key === 'PageDown' || (e.key === 'ArrowDown' && isCtrl)) {
      e.preventDefault();
      handleTimeBlur(rowIndex, colField);
      focusCell(grid.length - 1, colField);
      return;
    }
    if (e.key === 'PageUp' || (e.key === 'ArrowUp' && isCtrl)) {
      e.preventDefault();
      handleTimeBlur(rowIndex, colField);
      focusCell(0, colField);
      return;
    }
  };

  // Suporte a Copiar e Colar direto do Excel (Ctrl+V)
  const handlePaste = (e, startRowIndex, startColField) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData) return;

    // Linhas do Excel
    const lines = clipboardData.split(/\r\n|\n|\r/).filter(line => line.length > 0);
    if (lines.length === 0) return;

    const startColIndex = ALL_COLUMNS.indexOf(startColField);
    let pastedCellsCount = 0;

    setGrid(prevGrid => {
      const newGrid = [...prevGrid];

      lines.forEach((line, lineOffset) => {
        const targetRow = startRowIndex + lineOffset;
        if (targetRow >= newGrid.length) return;

        // Separadores de coluna comuns do Excel: Tab (\t) ou vírgula ou ponto-e-vírgula
        const cells = line.includes('\t') 
          ? line.split('\t') 
          : line.includes(';') 
            ? line.split(';') 
            : [line];

        cells.forEach((cellVal, colOffset) => {
          const targetColIndex = startColIndex + colOffset;
          if (targetColIndex >= ALL_COLUMNS.length) return;

          const colName = ALL_COLUMNS[targetColIndex];
          const rawVal = cellVal.trim();

          if (colName === 'evento') {
            newGrid[targetRow] = {
              ...newGrid[targetRow],
              evento: rawVal,
              modified: true,
              status: 'modificado'
            };
            pastedCellsCount++;
          } else {
            const formatted = normalizeTimeOnBlur(rawVal);
            if (formatted || rawVal === '') {
              newGrid[targetRow] = {
                ...newGrid[targetRow],
                [colName]: formatted,
                modified: true,
                status: 'modificado'
              };
              pastedCellsCount++;
            }
          }
        });
      });

      return newGrid;
    });

    if (pastedCellsCount > 0) {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        background: '#0a1711',
        color: '#f1f5f3'
      });
      Toast.fire({
        icon: 'success',
        title: `⚡ ${pastedCellsCount} célula(s) colada(s) do Excel!`
      });
    }
  };

  // Preencher Coluna Inteira com um Horário Padrão
  const handlePreencherColuna = async (colField) => {
    const label = COLUMN_LABELS[colField] || colField;
    const { value: formValues } = await Swal.fire({
      title: `⚡ Preencher Coluna: ${label}`,
      html: `
        <div style="text-align: left; font-size: 13px; font-weight: bold; color: #cbd5e1; display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
          <div>
            <label style="display: block; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; color: #94a3b8;">Horário Padrão (ex: 08:00):</label>
            <input id="swal-horario" type="text" placeholder="08:00" style="width: 100%; background: #050c08; border: 1px solid #132a1f; color: #f1f5f3; padding: 10px 14px; border-radius: 10px; font-size: 14px; font-weight: 900; outline: none;" />
          </div>
          <div>
            <label style="display: block; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; color: #94a3b8;">Aplicar em:</label>
            <select id="swal-dias" style="width: 100%; background: #050c08; border: 1px solid #132a1f; color: #f1f5f3; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: bold; outline: none; cursor: pointer;">
              <option value="uteis">Dias Úteis (Segunda a Sexta)</option>
              <option value="seg-sab">Segunda a Sábado</option>
              <option value="todos">Todos os Dias do Mês</option>
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Aplicar na Coluna',
      cancelButtonText: 'Cancelar',
      background: '#0a1711',
      color: '#f1f5f3',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#334155',
      didOpen: () => {
        const input = document.getElementById('swal-horario');
        if (input) input.focus();
      },
      preConfirm: () => {
        const rawTime = document.getElementById('swal-horario').value;
        const dias = document.getElementById('swal-dias').value;
        const normalized = normalizeTimeOnBlur(rawTime);
        if (!normalized) {
          Swal.showValidationMessage('Digite um horário válido (ex: 08:00)');
          return false;
        }
        return { horario: normalized, dias };
      }
    });

    if (formValues) {
      const { horario, dias } = formValues;
      setGrid(prev => {
        const newGrid = [...prev];
        newGrid.forEach((row, idx) => {
          if (row.evento) return; // Não sobrescreve feriado/atestado
          
          let aplicar = false;
          if (dias === 'uteis' && row.diaSemana >= 1 && row.diaSemana <= 5) aplicar = true;
          if (dias === 'seg-sab' && row.diaSemana >= 1 && row.diaSemana <= 6) aplicar = true;
          if (dias === 'todos') aplicar = true;

          if (aplicar) {
            newGrid[idx] = {
              ...newGrid[idx],
              [colField]: horario,
              modified: true,
              status: 'modificado'
            };
          }
        });
        return newGrid;
      });
    }
  };

  const handleFastInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.target.value;
      if (!val.trim()) return;

      const cleanStr = val.replace(/[^0-9]/g, '');
      const parts = [];
      for (let i = 0; i < cleanStr.length; i += 4) {
        parts.push(cleanStr.substring(i, i + 4));
      }

      let targetRowIndex = focusedCell.rowIndex;
      
      if (fastDay) {
        targetRowIndex = grid.findIndex(r => r.dia === parseInt(fastDay, 10));
      } else if (targetRowIndex === null) {
        // If no valid cell is focused and no fastDay, find first empty valid day (not Sunday, not holiday, no data)
        targetRowIndex = grid.findIndex(r => !r.hasData && r.diaSemana !== 0 && !r.evento && !r.modified);
        if (targetRowIndex === -1) targetRowIndex = 0;
      }

      if (targetRowIndex === -1 || targetRowIndex >= grid.length) {
        swalTheme({ title: 'Aviso', text: 'Dia selecionado é inválido.', icon: 'warning' });
        return;
      }

      setGrid(prev => {
        const newGrid = [...prev];
        const row = { ...newGrid[targetRowIndex] };
        
        if (parts[0]) row.e1 = normalizeTimeOnBlur(parts[0]);
        if (parts[1]) row.s1 = normalizeTimeOnBlur(parts[1]);
        if (parts[2]) row.e2 = normalizeTimeOnBlur(parts[2]);
        if (parts[3]) row.s2 = normalizeTimeOnBlur(parts[3]);
        if (parts[4]) row.e3 = normalizeTimeOnBlur(parts[4]);
        if (parts[5]) row.s3 = normalizeTimeOnBlur(parts[5]);
        
        row.modified = true;
        row.status = 'modificado';
        newGrid[targetRowIndex] = row;
        return newGrid;
      });

      e.target.value = '';
      
      if (fastDay) {
        // Auto increment fastDay
        let nextDay = parseInt(fastDay, 10) + 1;
        while (nextDay <= 31) {
          const r = grid.find(g => g.dia === nextDay);
          if (r && r.diaSemana !== 0) break; // found a non-sunday valid day
          nextDay++;
        }
        if (nextDay <= 31 && grid.some(g => g.dia === nextDay)) {
          setFastDay(String(nextDay));
        } else {
          setFastDay('');
        }
      } else {
        // Auto move focus down for next fast typing based on rowIndex
        if (targetRowIndex < grid.length - 1) {
          let nextRow = targetRowIndex + 1;
          // Skip sundays automatically if we are searching down
          while (nextRow < grid.length && grid[nextRow].diaSemana === 0) {
            nextRow++;
          }
          if (nextRow < grid.length) {
            setFocusedCell({ rowIndex: nextRow, colField: 'e1' });
          }
        }
      }
    }
  };

  const handleLancarEventoMassa = async () => {
    const { value: formValues } = await Swal.fire({
      title: `📅 Lançar Eventos em Lote`,
      html: `
        <div style="text-align: left; font-size: 13px; font-weight: bold; color: #cbd5e1; display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
          <div>
            <label style="display: block; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; color: #94a3b8;">Qual evento deseja lançar?</label>
            <select id="swal-evento" style="width: 100%; background: #050c08; border: 1px solid #132a1f; color: #f1f5f3; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: bold; outline: none; cursor: pointer;">
              <option value="">Selecione...</option>
              <option value="Folga Domingo">🏖️ Folga Domingo</option>
              <option value="Falta">❌ Falta</option>
              <option value="Atestado">🏥 Atestado</option>
              <option value="Declaração">📄 Declaração</option>
              <option value="Ferias">🏄 Férias</option>
              <option value="DSR">📅 DSR</option>
              <option value="Feriado">🎉 Feriado</option>
              <option value="Folga Banco">🏦 Folga Banco</option>
            </select>
          </div>
          <div style="display: flex; gap: 10px;">
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; color: #94a3b8;">Dia Inicial</label>
              <input id="swal-dia-inicio" type="number" min="1" max="31" placeholder="Ex: 1" style="width: 100%; background: #050c08; border: 1px solid #132a1f; color: #f1f5f3; padding: 10px 14px; border-radius: 10px; font-size: 14px; font-weight: 900; outline: none;" />
            </div>
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; color: #94a3b8;">Dia Final</label>
              <input id="swal-dia-fim" type="number" min="1" max="31" placeholder="Ex: 30" style="width: 100%; background: #050c08; border: 1px solid #132a1f; color: #f1f5f3; padding: 10px 14px; border-radius: 10px; font-size: 14px; font-weight: 900; outline: none;" />
            </div>
          </div>
          <div>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 11px; text-transform: uppercase; color: #94a3b8; margin-top: 5px;">
              <input id="swal-sobrescrever" type="checkbox" style="width: 16px; height: 16px; cursor: pointer; accent-color: #10b981;" />
              Substituir horários caso já tenha ponto batido?
            </label>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Aplicar Evento',
      cancelButtonText: 'Cancelar',
      background: '#0a1711',
      color: '#f1f5f3',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#334155',
      preConfirm: () => {
        const evento = document.getElementById('swal-evento').value;
        const diaInicio = parseInt(document.getElementById('swal-dia-inicio').value, 10);
        const diaFim = parseInt(document.getElementById('swal-dia-fim').value, 10);
        const sobrescrever = document.getElementById('swal-sobrescrever').checked;

        if (!evento) {
          Swal.showValidationMessage('Selecione um evento.');
          return false;
        }
        if (isNaN(diaInicio) || isNaN(diaFim) || diaInicio < 1 || diaInicio > 31 || diaFim < diaInicio) {
          Swal.showValidationMessage('Período de dias inválido.');
          return false;
        }

        return { evento, diaInicio, diaFim, sobrescrever };
      }
    });

    if (formValues) {
      const { evento, diaInicio, diaFim, sobrescrever } = formValues;
      let alterados = 0;
      setGrid(prev => {
        const newGrid = [...prev];
        newGrid.forEach((row, idx) => {
          if (row.dia >= diaInicio && row.dia <= diaFim) {
            // Se não pode sobrescrever e já tem horários batidos, ignora
            const temPonto = row.e1 || row.s1 || row.e2 || row.s2 || row.e3 || row.s3;
            if (!sobrescrever && temPonto) return;

            const updatedRow = { ...row, evento, modified: true, status: 'modificado' };
            // Se sobrescreveu com atestado/ferias, zeramos os horários
            if (sobrescrever) {
              updatedRow.e1 = ''; updatedRow.s1 = '';
              updatedRow.e2 = ''; updatedRow.s2 = '';
              updatedRow.e3 = ''; updatedRow.s3 = '';
            }
            newGrid[idx] = updatedRow;
            alterados++;
          }
        });
        return newGrid;
      });

      if (alterados > 0) {
        swalTheme({ title: 'Eventos Aplicados', text: `O evento foi aplicado em ${alterados} dia(s).`, icon: 'success' });
      } else {
        swalTheme({ title: 'Aviso', text: 'Nenhum dia foi alterado.', icon: 'info' });
      }
    }
  };

  const getModifiedRows = useMemo(() => {
    return grid.filter(row => row.modified);
  }, [grid]);

  // Copiar linha inteira para baixo
  const handleCopyDown = (index) => {
    if (index >= grid.length - 1) return;
    const source = grid[index];
    setGrid(prev => {
      const newGrid = [...prev];
      for (let i = index + 1; i < newGrid.length; i++) {
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

  // Limpar linha
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
    const parts = trimmed.split(':');
    if (parts.length >= 2) {
      let h = parts[0];
      let m = parts[1];
      if (h.length === 1) h = '0' + h;
      return `${h}:${m}`;
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
                    e1: e1,
                    s1: s1,
                    e2: e2,
                    s2: s2,
                    e3: e3,
                    s3: s3,
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

    setTimeout(() => buildGrid(), 1500);
  };

  const handleImportarOCR = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!fId || !mesSelect || !anoSelect) {
      swalTheme({ title: 'Atenção', text: 'Selecione Colaborador, Mês e Ano antes de importar.', icon: 'warning' });
      e.target.value = '';
      return;
    }

    // Modal de progresso (Simulando OCR)
    let timerInterval;
    Swal.fire({
      title: 'IA Lendo Documento',
      html: 'Extraindo horários da imagem... <b></b>%',
      timer: 3000,
      timerProgressBar: true,
      background: '#0a1711',
      color: '#f1f5f3',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
        const b = Swal.getHtmlContainer().querySelector('b');
        timerInterval = setInterval(() => {
          if (b) {
            b.textContent = Math.floor((Swal.getTimerLeft() / 3000) * 100);
          }
        }, 100);
      },
      willClose: () => {
        clearInterval(timerInterval);
      }
    }).then(() => {
      // Simulação do preenchimento pós-OCR
      let count = 0;
      setGrid(prev => {
        const newGrid = [...prev];
        // Preenche alguns dias úteis para demonstrar
        newGrid.forEach((row, i) => {
          if (!row.hasData && !row.evento && row.diaSemana >= 1 && row.diaSemana <= 5 && count < 5) {
            newGrid[i] = {
              ...row,
              e1: '08:00',
              s1: '12:00',
              e2: '13:00',
              s2: '17:00',
              modified: true,
              status: 'modificado'
            };
            count++;
          }
        });
        return newGrid;
      });

      setTimeout(() => {
        swalTheme({
          title: 'Extração Concluída',
          html: `A IA encontrou <b>${count}</b> dias na imagem.<br><br><span style="font-size: 12px; color: #fbbf24;">Revise os campos em amarelo (Sugestões da IA) e clique em Salvar.</span>`,
          icon: 'success'
        });
      }, 300);
    });
    
    e.target.value = ''; 
  };

  const funcionarioSelecionado = funcionarios.find(f => String(f.id) === String(fId));

  const isToday = (dateStr) => {
    return new Date().toISOString().substring(0, 10) === dateStr;
  };

  const getRowBg = (row, rowIndex) => {
    const isRowFocused = focusedCell.rowIndex === rowIndex;
    if (row.status === 'salvando') return 'bg-brand-primary/10';
    if (row.status === 'sucesso') return 'bg-emerald-500/10';
    if (row.status === 'erro') return 'bg-rose-500/10';
    if (row.modified) return 'bg-amber-500/10';
    if (isRowFocused) return 'bg-brand-primary/10';
    if (isToday(row.data)) return 'bg-brand-primary/15';
    if (row.diaSemana === 0) return 'bg-brand-bg/40 opacity-80';
    return '';
  };

  return (
    <div className={isZenMode ? "fixed inset-0 z-[100] bg-brand-bg overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar animate-in zoom-in-95 duration-300" : "space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/lancamento')}
            className="p-3 bg-brand-surface border border-brand-border rounded-xl text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-all shadow-xl cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-brand-text tracking-tighter flex items-center gap-3 italic">
              Planilha de Lançamento
              <span className="text-brand-primary">.</span>
            </h1>
            <p className="text-brand-muted font-bold mt-0.5 text-xs opacity-60">
              Modo Excel: digite e use as setas do teclado (↓ ↑ → ←) ou Enter para navegar rapidamente.
            </p>
          </div>
        </div>

        {getModifiedRows.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30 animate-pulse">
              {getModifiedRows.length} dia(s) modificado(s)
            </span>
            <button
              onClick={handleResetAll}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-brand-muted hover:text-brand-text text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              <RotateCcw size={14} /> Desfazer
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-black rounded-xl shadow-lg shadow-brand-primary/30 transition-all text-[10px] uppercase tracking-widest disabled:opacity-50 cursor-pointer"
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
              <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary font-black">
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

                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  id="ocrUpload" 
                  className="hidden" 
                  onChange={handleImportarOCR} 
                />
                <label 
                  htmlFor="ocrUpload" 
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500/20 transition-all shadow-xl cursor-pointer shadow-amber-500/10"
                  title="Testar a inteligência de Extração (OCR)"
                >
                  <Sparkles size={16} /> Importar Imagem (IA)
                </label>

                <button
                  type="button"
                  onClick={handleLancarEventoMassa}
                  className="flex items-center gap-2 px-6 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/20 transition-all shadow-xl cursor-pointer shadow-rose-500/10"
                >
                  <Calendar size={16} /> Lançar Evento em Massa
                </button>

                <button
                  type="button"
                  onClick={() => setIsZenMode(!isZenMode)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl cursor-pointer border ${isZenMode ? 'bg-brand-primary text-white hover:bg-brand-primary/90 border-brand-primary' : 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/20 shadow-brand-primary/10'}`}
                >
                  <Zap size={16} /> {isZenMode ? 'Sair do Foco' : 'Modo Foco'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dicas de Produtividade Estilo Excel */}
      {fId && mesSelect && anoSelect && (
        <div className="bg-brand-surface/70 border border-brand-primary/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex flex-wrap items-center gap-6 text-xs font-black text-brand-text">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary rounded-md font-mono text-[11px]">↓ ou Enter</span>
              <span className="text-[11px] text-brand-muted font-bold">Dia seguinte na mesma coluna</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary rounded-md font-mono text-[11px]">↑ ou Shift+Enter</span>
              <span className="text-[11px] text-brand-muted font-bold">Dia anterior</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary rounded-md font-mono text-[11px]">→ / ← / Tab</span>
              <span className="text-[11px] text-brand-muted font-bold">Trocar de turno</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary rounded-md font-mono text-[11px]">Ctrl + V</span>
              <span className="text-[11px] text-brand-muted font-bold">Colar coluna do Excel</span>
            </div>
          </div>
          <div className="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-1.5 bg-brand-primary/10 px-3 py-1.5 rounded-lg">
            <Sparkles size={14} /> Digite 0800 para 08:00
          </div>
        </div>
      )}

      {/* Grid Principal Estilo Planilha */}
      {fId && mesSelect && anoSelect && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-brand-border flex justify-between items-center bg-brand-surface/50">
            <h2 className="text-lg font-black text-brand-text flex items-center gap-3 tracking-tighter italic">
              <Calendar className="text-brand-primary" size={20} />
              {MESES_NOMES[parseInt(mesSelect) - 1]} {anoSelect}
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-brand-bg/80 border border-brand-border rounded-xl px-3 py-1.5 focus-within:border-brand-primary/50 focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all shadow-inner w-full md:w-auto">
                <Zap size={14} className="text-brand-primary ml-1" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={fastDay}
                  onChange={(e) => setFastDay(e.target.value.replace(/\\D/g, ''))}
                  placeholder="Dia"
                  className="bg-brand-surface border border-brand-border/50 rounded-lg px-3 py-1.5 text-[12px] text-brand-text outline-none w-14 text-center font-black focus:border-brand-primary/50"
                  title="Opcional: Informe o dia que deseja preencher"
                />
                <input
                  type="text"
                  placeholder="Rápido: 0800 1200 1300 1700"
                  className="bg-transparent border-none outline-none text-[11px] text-brand-text placeholder:text-brand-muted/40 w-48 font-mono font-black"
                  onKeyDown={handleFastInputKeyDown}
                  title="Digite todos os horários juntos e aperte Enter. Ex: 0800120013001700"
                />
              </div>
              <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest opacity-60 hidden md:inline">
                {grid.filter(r => r.hasData || r.modified).length} de {grid.length} dias preenchidos
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
              <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest opacity-60">Carregando planilha...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" style={{ minWidth: '1100px' }}>
                <thead>
                  <tr className="bg-brand-bg/80 border-b border-brand-border">
                    <th className="px-4 py-3 text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] text-center opacity-70 sticky left-0 bg-brand-bg/95 z-20 w-20 border-r border-brand-border/40">
                      Dia
                    </th>

                    {/* Turno 1 */}
                    <th colSpan={2} className="px-3 py-2.5 text-[9px] font-black text-brand-muted uppercase tracking-[0.15em] text-center border-r border-brand-border/40 bg-brand-surface/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-brand-text font-black text-xs">Turno 1</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handlePreencherColuna('e1')}
                            title="Preencher coluna E1"
                            className="text-[8px] px-1.5 py-0.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded transition-all cursor-pointer font-bold"
                          >
                            ⚡ E1
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePreencherColuna('s1')}
                            title="Preencher coluna S1"
                            className="text-[8px] px-1.5 py-0.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded transition-all cursor-pointer font-bold"
                          >
                            ⚡ S1
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[8px] font-bold opacity-60">
                        <span>Entrada (E1)</span>
                        <span>Saída (S1)</span>
                      </div>
                    </th>

                    {/* Turno 2 */}
                    <th colSpan={2} className="px-3 py-2.5 text-[9px] font-black text-brand-muted uppercase tracking-[0.15em] text-center border-r border-brand-border/40 bg-brand-surface/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-brand-text font-black text-xs">Turno 2</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handlePreencherColuna('e2')}
                            title="Preencher coluna E2"
                            className="text-[8px] px-1.5 py-0.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded transition-all cursor-pointer font-bold"
                          >
                            ⚡ E2
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePreencherColuna('s2')}
                            title="Preencher coluna S2"
                            className="text-[8px] px-1.5 py-0.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded transition-all cursor-pointer font-bold"
                          >
                            ⚡ S2
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[8px] font-bold opacity-60">
                        <span>Entrada (E2)</span>
                        <span>Saída (S2)</span>
                      </div>
                    </th>

                    {/* Turno 3 */}
                    <th colSpan={2} className="px-3 py-2.5 text-[9px] font-black text-brand-muted uppercase tracking-[0.15em] text-center border-r border-brand-border/40 bg-brand-surface/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-brand-text font-black text-xs">Turno 3</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handlePreencherColuna('e3')}
                            title="Preencher coluna E3"
                            className="text-[8px] px-1.5 py-0.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded transition-all cursor-pointer font-bold"
                          >
                            ⚡ E3
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePreencherColuna('s3')}
                            title="Preencher coluna S3"
                            className="text-[8px] px-1.5 py-0.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded transition-all cursor-pointer font-bold"
                          >
                            ⚡ S3
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[8px] font-bold opacity-60">
                        <span>Entrada (E3)</span>
                        <span>Saída (S3)</span>
                      </div>
                    </th>

                    {/* Total Dia */}
                    <th className="px-3 py-3 text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] text-center opacity-70 w-24 border-r border-brand-border/40">
                      Total Dia
                    </th>

                    {/* Evento */}
                    <th className="px-3 py-3 text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] text-center opacity-70 w-36 border-r border-brand-border/40">
                      Ocorrência / Evento
                    </th>

                    {/* Status */}
                    <th className="px-2 py-3 text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] text-center opacity-70 w-16">
                      Status
                    </th>

                    {/* Ações */}
                    <th className="px-2 py-3 text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] text-center opacity-70 w-20">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-brand-border/30">
                  {grid.map((row, idx) => {
                    const dayTotal = calculateDayTotal(row);
                    const isSunday = row.diaSemana === 0;

                    return (
                      <tr
                        key={row.data}
                        className={`transition-colors duration-150 ${getRowBg(row, idx)}`}
                      >
                        {/* Coluna Dia */}
                        <td className="px-3 py-2 text-center sticky left-0 bg-brand-surface/95 z-10 border-r border-brand-border/30">
                          <div className="flex flex-col items-center">
                            <span className={`text-base font-black leading-none font-mono ${isToday(row.data) ? 'text-brand-primary' : 'text-brand-text'}`}>
                              {String(row.dia).padStart(2, '0')}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isSunday ? 'text-rose-400 font-extrabold' : 'text-brand-muted opacity-40'}`}>
                              {row.diaSemanaLabel}
                            </span>
                          </div>
                        </td>

                        {/* Turno 1 (E1 e S1) */}
                        <td className="p-1 border-r border-brand-border/20 bg-brand-surface/20">
                          <div className="flex gap-1 justify-center">
                            <input
                              ref={el => cellRefs.current[`${idx}_e1`] = el}
                              type="text"
                              inputMode="numeric"
                              maxLength={5}
                              placeholder="--:--"
                              value={row.e1}
                              disabled={!!row.evento}
                              onChange={(e) => handleTimeChange(idx, 'e1', e.target.value)}
                              onBlur={() => handleTimeBlur(idx, 'e1')}
                              onFocus={(e) => {
                                setFocusedCell({ rowIndex: idx, colField: 'e1' });
                                e.target.select();
                              }}
                              onKeyDown={(e) => handleKeyDown(e, idx, 'e1')}
                              onPaste={(e) => handlePaste(e, idx, 'e1')}
                              className={`w-16 h-8 text-center text-xs font-mono font-black rounded-lg border outline-none transition-all shadow-inner ${
                                focusedCell.rowIndex === idx && focusedCell.colField === 'e1'
                                  ? 'bg-brand-primary/10 border-brand-primary ring-2 ring-brand-primary/30 text-brand-primary'
                                  : row.e1
                                    ? 'bg-brand-bg/80 border-brand-border/50 text-brand-text'
                                    : 'bg-brand-bg/40 border-brand-border/20 text-brand-muted placeholder:text-brand-muted/20'
                              } disabled:opacity-20 disabled:cursor-not-allowed`}
                            />
                            <input
                              ref={el => cellRefs.current[`${idx}_s1`] = el}
                              type="text"
                              inputMode="numeric"
                              maxLength={5}
                              placeholder="--:--"
                              value={row.s1}
                              disabled={!!row.evento}
                              onChange={(e) => handleTimeChange(idx, 's1', e.target.value)}
                              onBlur={() => handleTimeBlur(idx, 's1')}
                              onFocus={(e) => {
                                setFocusedCell({ rowIndex: idx, colField: 's1' });
                                e.target.select();
                              }}
                              onKeyDown={(e) => handleKeyDown(e, idx, 's1')}
                              onPaste={(e) => handlePaste(e, idx, 's1')}
                              className={`w-16 h-8 text-center text-xs font-mono font-black rounded-lg border outline-none transition-all shadow-inner ${
                                focusedCell.rowIndex === idx && focusedCell.colField === 's1'
                                  ? 'bg-brand-primary/10 border-brand-primary ring-2 ring-brand-primary/30 text-brand-primary'
                                  : row.s1
                                    ? 'bg-brand-bg/80 border-brand-border/50 text-brand-text'
                                    : 'bg-brand-bg/40 border-brand-border/20 text-brand-muted placeholder:text-brand-muted/20'
                              } disabled:opacity-20 disabled:cursor-not-allowed`}
                            />
                          </div>
                        </td>

                        {/* Turno 2 (E2 e S2) */}
                        <td className="p-1 border-r border-brand-border/20 bg-brand-surface/20">
                          <div className="flex gap-1 justify-center">
                            <input
                              ref={el => cellRefs.current[`${idx}_e2`] = el}
                              type="text"
                              inputMode="numeric"
                              maxLength={5}
                              placeholder="--:--"
                              value={row.e2}
                              disabled={!!row.evento}
                              onChange={(e) => handleTimeChange(idx, 'e2', e.target.value)}
                              onBlur={() => handleTimeBlur(idx, 'e2')}
                              onFocus={(e) => {
                                setFocusedCell({ rowIndex: idx, colField: 'e2' });
                                e.target.select();
                              }}
                              onKeyDown={(e) => handleKeyDown(e, idx, 'e2')}
                              onPaste={(e) => handlePaste(e, idx, 'e2')}
                              className={`w-16 h-8 text-center text-xs font-mono font-black rounded-lg border outline-none transition-all shadow-inner ${
                                focusedCell.rowIndex === idx && focusedCell.colField === 'e2'
                                  ? 'bg-brand-primary/10 border-brand-primary ring-2 ring-brand-primary/30 text-brand-primary'
                                  : row.e2
                                    ? 'bg-brand-bg/80 border-brand-border/50 text-brand-text'
                                    : 'bg-brand-bg/40 border-brand-border/20 text-brand-muted placeholder:text-brand-muted/20'
                              } disabled:opacity-20 disabled:cursor-not-allowed`}
                            />
                            <input
                              ref={el => cellRefs.current[`${idx}_s2`] = el}
                              type="text"
                              inputMode="numeric"
                              maxLength={5}
                              placeholder="--:--"
                              value={row.s2}
                              disabled={!!row.evento}
                              onChange={(e) => handleTimeChange(idx, 's2', e.target.value)}
                              onBlur={() => handleTimeBlur(idx, 's2')}
                              onFocus={(e) => {
                                setFocusedCell({ rowIndex: idx, colField: 's2' });
                                e.target.select();
                              }}
                              onKeyDown={(e) => handleKeyDown(e, idx, 's2')}
                              onPaste={(e) => handlePaste(e, idx, 's2')}
                              className={`w-16 h-8 text-center text-xs font-mono font-black rounded-lg border outline-none transition-all shadow-inner ${
                                focusedCell.rowIndex === idx && focusedCell.colField === 's2'
                                  ? 'bg-brand-primary/10 border-brand-primary ring-2 ring-brand-primary/30 text-brand-primary'
                                  : row.s2
                                    ? 'bg-brand-bg/80 border-brand-border/50 text-brand-text'
                                    : 'bg-brand-bg/40 border-brand-border/20 text-brand-muted placeholder:text-brand-muted/20'
                              } disabled:opacity-20 disabled:cursor-not-allowed`}
                            />
                          </div>
                        </td>

                        {/* Turno 3 (E3 e S3) */}
                        <td className="p-1 border-r border-brand-border/20 bg-brand-surface/20">
                          <div className="flex gap-1 justify-center">
                            <input
                              ref={el => cellRefs.current[`${idx}_e3`] = el}
                              type="text"
                              inputMode="numeric"
                              maxLength={5}
                              placeholder="--:--"
                              value={row.e3}
                              disabled={!!row.evento}
                              onChange={(e) => handleTimeChange(idx, 'e3', e.target.value)}
                              onBlur={() => handleTimeBlur(idx, 'e3')}
                              onFocus={(e) => {
                                setFocusedCell({ rowIndex: idx, colField: 'e3' });
                                e.target.select();
                              }}
                              onKeyDown={(e) => handleKeyDown(e, idx, 'e3')}
                              onPaste={(e) => handlePaste(e, idx, 'e3')}
                              className={`w-16 h-8 text-center text-xs font-mono font-black rounded-lg border outline-none transition-all shadow-inner ${
                                focusedCell.rowIndex === idx && focusedCell.colField === 'e3'
                                  ? 'bg-brand-primary/10 border-brand-primary ring-2 ring-brand-primary/30 text-brand-primary'
                                  : row.e3
                                    ? 'bg-brand-bg/80 border-brand-border/50 text-brand-text'
                                    : 'bg-brand-bg/40 border-brand-border/20 text-brand-muted placeholder:text-brand-muted/20'
                              } disabled:opacity-20 disabled:cursor-not-allowed`}
                            />
                            <input
                              ref={el => cellRefs.current[`${idx}_s3`] = el}
                              type="text"
                              inputMode="numeric"
                              maxLength={5}
                              placeholder="--:--"
                              value={row.s3}
                              disabled={!!row.evento}
                              onChange={(e) => handleTimeChange(idx, 's3', e.target.value)}
                              onBlur={() => handleTimeBlur(idx, 's3')}
                              onFocus={(e) => {
                                setFocusedCell({ rowIndex: idx, colField: 's3' });
                                e.target.select();
                              }}
                              onKeyDown={(e) => handleKeyDown(e, idx, 's3')}
                              onPaste={(e) => handlePaste(e, idx, 's3')}
                              className={`w-16 h-8 text-center text-xs font-mono font-black rounded-lg border outline-none transition-all shadow-inner ${
                                focusedCell.rowIndex === idx && focusedCell.colField === 's3'
                                  ? 'bg-brand-primary/10 border-brand-primary ring-2 ring-brand-primary/30 text-brand-primary'
                                  : row.s3
                                    ? 'bg-brand-bg/80 border-brand-border/50 text-brand-text'
                                    : 'bg-brand-bg/40 border-brand-border/20 text-brand-muted placeholder:text-brand-muted/20'
                              } disabled:opacity-20 disabled:cursor-not-allowed`}
                            />
                          </div>
                        </td>

                        {/* Total Horas do Dia */}
                        <td className="px-2 py-1.5 text-center border-r border-brand-border/20">
                          {dayTotal ? (
                            <span className="text-[11px] font-mono font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md">
                              {dayTotal}
                            </span>
                          ) : (
                            <span className="text-[10px] text-brand-muted/30 font-mono">—</span>
                          )}
                        </td>

                        {/* Evento */}
                        <td className="p-1 border-r border-brand-border/20">
                          <select
                            ref={el => cellRefs.current[`${idx}_evento`] = el}
                            value={row.evento}
                            onChange={(e) => handleEventoChange(idx, e.target.value)}
                            onFocus={() => setFocusedCell({ rowIndex: idx, colField: 'evento' })}
                            onKeyDown={(e) => handleKeyDown(e, idx, 'evento')}
                            className={`w-full h-8 bg-brand-bg/60 border rounded-lg px-2 text-[10px] font-black text-brand-text outline-none transition-all shadow-inner cursor-pointer ${
                              row.evento ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' : 'border-brand-border/30'
                            }`}
                          >
                            <option value="">—</option>
                            <option value="Folga Domingo">🏖️ Folga Domingo</option>
                            <option value="Falta">❌ Falta</option>
                            <option value="Atestado">🏥 Atestado</option>
                            <option value="Declaração">📄 Declaração</option>
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
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mx-auto animate-pulse" title="Modificado (não salvo)"></div>
                          )}
                          {row.status === 'salvo' && (
                            <div className="w-2 h-2 rounded-full bg-emerald-500/50 mx-auto" title="Salvo no banco"></div>
                          )}
                          {row.status === 'vazio' && (
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-muted/20 mx-auto"></div>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="px-1 py-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopyDown(idx)}
                              title="Copiar linha para todos os dias abaixo"
                              className="p-1.5 text-brand-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all cursor-pointer"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClearRow(idx)}
                              title="Limpar este dia"
                              className="p-1.5 text-brand-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Barra de Salvar Fixa */}
          {getModifiedRows.length > 0 && (
            <div className="p-4 bg-brand-bg/80 backdrop-blur border-t border-brand-border flex justify-between items-center sticky bottom-0 z-30">
              <div className="flex items-center gap-4 text-brand-muted text-[9px] font-black uppercase tracking-widest opacity-70">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></div>
                  <span>{getModifiedRows.length} dia(s) com alterações pendentes</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-4 py-2.5 bg-brand-surface border border-brand-border rounded-xl text-brand-muted hover:text-brand-text text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  Cancelar Alterações
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="flex items-center gap-2 px-10 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-black rounded-xl shadow-lg shadow-brand-primary/30 transition-all text-[10px] uppercase tracking-widest disabled:opacity-50 cursor-pointer"
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
            </div>
          )}
        </div>
      )}

      {/* Dicas e Atalhos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-brand-surface border border-brand-border rounded-2xl flex gap-4 items-start shadow-xl">
          <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary"><Zap size={18} /></div>
          <div>
            <h4 className="text-brand-text font-black text-xs uppercase tracking-tight italic">Navegação Vertical (Coluna)</h4>
            <p className="text-brand-muted text-[11px] mt-1.5 font-medium leading-relaxed opacity-60">
              Digite o horário (ex: <b>0800</b>) e aperte <b>Enter</b> ou <b>Seta para Baixo</b> para descer instantaneamente para o dia seguinte na mesma coluna.
            </p>
          </div>
        </div>
        <div className="p-6 bg-brand-surface border border-brand-border rounded-2xl flex gap-4 items-start shadow-xl">
          <div className="p-2.5 bg-brand-accent/10 rounded-xl text-brand-accent"><Table size={18} /></div>
          <div>
            <h4 className="text-brand-text font-black text-xs uppercase tracking-tight italic">Copiar & Colar do Excel</h4>
            <p className="text-brand-muted text-[11px] mt-1.5 font-medium leading-relaxed opacity-60">
              Copie qualquer coluna ou bloco de células no Excel (<b>Ctrl+C</b>), selecione o dia inicial aqui e aperte <b>Ctrl+V</b>.
            </p>
          </div>
        </div>
        <div className="p-6 bg-brand-surface border border-brand-border rounded-2xl flex gap-4 items-start shadow-xl">
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500"><Sparkles size={18} /></div>
          <div>
            <h4 className="text-brand-text font-black text-xs uppercase tracking-tight italic">Preenchimento de Coluna ⚡</h4>
            <p className="text-brand-muted text-[11px] mt-1.5 font-medium leading-relaxed opacity-60">
              Clique nos botões <b>⚡ E1, ⚡ S1, etc.</b> no cabeçalho para aplicar um horário padrão em todos os dias úteis do mês de uma só vez.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LancamentoHoras;
