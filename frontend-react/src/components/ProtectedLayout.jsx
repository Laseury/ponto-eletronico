import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import ToastContainer from './ToastContainer';
import { Bell, Search, Settings, HelpCircle, Menu, X, CalendarDays, Loader2, Calculator, Plus, Minus, RotateCcw, Equal, BookOpen, Clock, BarChart3, FileCheck, Check } from 'lucide-react';
import Swal from 'sweetalert2';
import swalTheme from '../utils/swalTheme';

const mesesPtBR = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const ProtectedLayout = () => {
  const { user, loading, updateProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [feriadosOpen, setFeriadosOpen] = React.useState(false);
  const [feriados, setFeriados] = React.useState([]);
  const [feriadosLoading, setFeriadosLoading] = React.useState(false);
  const [feriadosAno, setFeriadosAno] = React.useState(new Date().getFullYear());
  const [calcOpen, setCalcOpen] = React.useState(false);
  const [notesOpen, setNotesOpen] = React.useState(false);

  const fetchFeriados = React.useCallback(async (ano) => {
    setFeriadosLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
      const data = await res.json();
      setFeriados(data);
    } catch (e) {
      setFeriados([]);
    } finally {
      setFeriadosLoading(false);
    }
  }, []);

  const handleOpenFeriados = () => {
    setFeriadosOpen(true);
    fetchFeriados(feriadosAno);
  };

  const handleAnoChange = (novoAno) => {
    setFeriadosAno(novoAno);
    fetchFeriados(novoAno);
  };

  const handleSettings = async () => {
    let htmlContent = `
      <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
        <button id="btn-meus-dados" style="padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">✏️ Alterar Meus Dados</button>
    `;
    
    if (user?.perfil === 'Admin' || user?.cargo === 'Admin') {
      htmlContent += `
        <button id="btn-gerenciar" style="padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">👥 Gerenciar Acessos</button>
      `;
    }
    
    htmlContent += `</div>`;

    swalTheme({
      title: 'Configurações',
      html: htmlContent,
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => {
        document.getElementById('btn-meus-dados').onclick = async () => {
          Swal.close();
          const { value: formValues } = await swalTheme({
            title: 'Meus Dados',
            html: `
              <input id="swal-input1" class="swal2-input" placeholder="Novo Nome" value="${user?.nome || ''}">
              <input id="swal-input2" class="swal2-input" placeholder="Nova Senha" type="password">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => [
              document.getElementById('swal-input1').value,
              document.getElementById('swal-input2').value
            ]
          });
          
          if (formValues) {
            const [newName, newPass] = formValues;
            if (newName && newPass) {
              await updateProfile(user?.usuario, newName, newPass);
              swalTheme({ title: 'Salvo!', text: 'Seus dados foram atualizados.', icon: 'success' });
            } else {
              swalTheme({ title: 'Atenção', text: 'Preencha o nome e a nova senha.', icon: 'warning' });
            }
          }
        };

        const btnGerenciar = document.getElementById('btn-gerenciar');
        if (btnGerenciar) {
          btnGerenciar.onclick = async () => {
            Swal.close();
            try {
              const res = await import('axios').then(m => m.default.get('/auth/users'));
              const listaUsuarios = res.data;

              let tableRows = listaUsuarios.map(u => `
                <tr style="border-bottom: 1px solid #334155;">
                  <td style="padding: 10px; text-align: left; color: #94a3b8;">${u.login}</td>
                  <td style="padding: 10px; text-align: left; color: #f8fafc; font-weight: bold;">${u.nome}</td>
                  <td style="padding: 10px; text-align: center;">
                    <span style="background: #0f172a; padding: 3px 8px; border-radius: 4px; color: #38bdf8; font-size: 12px;">${u.perfil}</span>
                  </td>
                </tr>
              `).join('');

              swalTheme({
                title: 'Gestão de Acessos',
                html: `
                  <p style="font-size:12px; color:#64748b; margin-bottom:10px;">Para ver ou alterar senhas, acesse <b>Gestão de Acessos</b> no menu lateral.</p>
                  <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px;">
                      <thead>
                        <tr style="background: #0f172a; color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">
                          <th style="padding: 10px; text-align: left;">Login</th>
                          <th style="padding: 10px; text-align: left;">Nome</th>
                          <th style="padding: 10px; text-align: center;">Perfil</th>
                        </tr>
                      </thead>
                      <tbody>${tableRows}</tbody>
                    </table>
                  </div>
                `,
                width: 550,
                confirmButtonText: 'Fechar'
              });
            } catch (err) {
              swalTheme({ title: 'Erro', text: 'Não foi possível carregar os usuários.', icon: 'error' });
            }
          };
        }
      }
    });
  };

  const handleShowHelpCenter = () => {
    swalTheme({
      title: 'Central de Ajuda',
      width: 650,
      html: `
        <div style="text-align: left; margin-top: 20px;">
          <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; justify-content: center;">
            <button onclick="window.switchHelpTab('inicio')" style="padding: 10px 15px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 900; font-size: 10px; cursor: pointer; text-transform: uppercase;">🏠 Início</button>
            <button onclick="window.switchHelpTab('novidades')" style="padding: 10px 15px; background: #334155; color: white; border: none; border-radius: 8px; font-weight: 900; font-size: 10px; cursor: pointer; text-transform: uppercase;">✨ Novidades</button>
            <button onclick="window.switchHelpTab('lancamento')" style="padding: 10px 15px; background: #334155; color: white; border: none; border-radius: 8px; font-weight: 900; font-size: 10px; cursor: pointer; text-transform: uppercase;">⏱️ Lançamentos</button>
            <button onclick="window.switchHelpTab('banco')" style="padding: 10px 15px; background: #334155; color: white; border: none; border-radius: 8px; font-weight: 900; font-size: 10px; cursor: pointer; text-transform: uppercase;">🏦 Banco</button>
            <button onclick="window.switchHelpTab('eventos')" style="padding: 10px 15px; background: #334155; color: white; border: none; border-radius: 8px; font-weight: 900; font-size: 10px; cursor: pointer; text-transform: uppercase;">📅 Eventos</button>
          </div>
          
          <div id="help-content-area" style="min-height: 300px; max-height: 400px; overflow-y: auto; padding: 20px; background: rgba(0,0,0,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
             <!-- Conteúdo Dinâmico -->
             <div id="help-inicio">
               <h4 style="color: #10b981; margin: 0 0 10px 0;">Bem-vindo ao Sistema de Ponto</h4>
               <p style="font-size: 13px; color: var(--color-brand-muted); line-height: 1.5;">Este sistema foi desenvolvido para facilitar o controle de jornada e banco de horas da equipe.</p>
               <ul style="font-size: 12px; padding-left: 20px; color: var(--color-brand-text);">
                 <li style="margin-bottom: 8px;"><b>Dashboard:</b> Veja seu saldo atual e banco consolidado.</li>
                 <li style="margin-bottom: 8px;"><b>Espelho de Ponto:</b> Confira cada batida de ponto e comentários do gestor.</li>
                 <li style="margin-bottom: 8px;"><b>Calculadora:</b> Use o ícone de calculadora no topo para somar horas.</li>
               </ul>
             </div>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => {
        const contentArea = document.getElementById('help-content-area');
        const buttons = document.querySelectorAll('button[onclick^="window.switchHelpTab"]');
        
        window.switchHelpTab = (tab) => {
          // Atualiza estilos dos botões
          buttons.forEach(btn => {
            if (btn.getAttribute('onclick').includes(tab)) {
              btn.style.background = '#10b981';
            } else {
              btn.style.background = '#334155';
            }
          });

          let html = '';
          if (tab === 'inicio') {
            html = `
              <h4 style="color: #10b981; margin: 0 0 10px 0;">Bem-vindo ao Sistema de Ponto</h4>
              <p style="font-size: 13px; color: var(--color-brand-muted); line-height: 1.5;">Este sistema foi desenvolvido para facilitar o controle de jornada e banco de horas da equipe.</p>
              <ul style="font-size: 12px; padding-left: 20px; color: var(--color-brand-text); margin-top: 15px;">
                <li style="margin-bottom: 8px;"><b>Dashboard:</b> Veja seu saldo atual e banco consolidado.</li>
                <li style="margin-bottom: 8px;"><b>Espelho de Ponto:</b> Confira cada batida de ponto e histórico de ajustes.</li>
                <li style="margin-bottom: 8px;"><b>Calculadora:</b> Use o ícone de calculadora no topo para somar e converter horas (Decimal).</li>
              </ul>
            `;
          } else if (tab === 'novidades') {
            html = `
              <h4 style="color: #8b5cf6; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px;">✨ O que há de novo no sistema</h4>
              <div style="font-size: 12px; color: var(--color-brand-text); line-height: 1.6;">
                
                <div style="margin-bottom: 15px; padding: 12px; background: rgba(139, 92, 246, 0.1); border-left: 3px solid #8b5cf6; border-radius: 4px;">
                  <h5 style="margin: 0 0 5px 0; color: #a78bfa;">1. Banco de Horas: Ciclo Anual (Extensivo)</h5>
                  <p style="margin: 0; color: var(--color-brand-muted);">Agora você pode visualizar o banco de horas acumulado ao longo de 12 meses (Jan-Dez). O sistema passa a exibir o <b>Saldo Remanescente do 1º Semestre</b> separadamente na tela do colaborador, somando tudo no Banco Consolidado sem perder o histórico do início do ano.</p>
                </div>

                <div style="margin-bottom: 15px; padding: 12px; background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; border-radius: 4px;">
                  <h5 style="margin: 0 0 5px 0; color: #60a5fa;">2. Relatórios de Ponto em Lote</h5>
                  <p style="margin: 0; color: var(--color-brand-muted);">A tela de <b>Relatório Geral</b> agora gera PDFs massivos para todos os funcionários com um único clique. E exporta perfeitamente os dados gerenciais (incluindo a flag de ciclo) via arquivo CSV para o Excel.</p>
                </div>

                <div style="margin-bottom: 15px; padding: 12px; background: rgba(234, 179, 8, 0.1); border-left: 3px solid #eab308; border-radius: 4px;">
                  <h5 style="margin: 0 0 5px 0; color: #fde047;">3. Horas Noturnas e Fator Legal</h5>
                  <p style="margin: 0; color: var(--color-brand-muted);">A ficha agora converte automaticamente as horas noturnas cronológicas aplicando o fator legal (1.1428 / 52m30s), separando-as em <b>Prorrogação Noturna</b> e fornecendo a <b>Base para Pagamento</b> final pronta para a contabilidade.</p>
                </div>

                <div style="margin-bottom: 15px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981; border-radius: 4px;">
                  <h5 style="margin: 0 0 5px 0; color: #34d399;">4. Ajustes Manuais e Integração com IA</h5>
                  <p style="margin: 0; color: var(--color-brand-muted);">Agora o RH pode inserir <b>Ajustes de Saldo</b> (ex: Pagamento de horas) com motivo e mês de competência sem mexer nos pontos. Além disso, incluímos um botão <b>IA</b> que exporta o json diário do funcionário para análise por inteligência artificial.</p>
                </div>

              </div>
            `;
          } else if (tab === 'lancamento') {
            html = `
              <h4 style="color: #3b82f6; margin: 0 0 10px 0;">Como Lançar Horas</h4>
              <p style="font-size: 13px; color: var(--color-brand-muted); line-height: 1.5;">Existem três formas principais de gerir os horários:</p>
              <div style="font-size: 12px; background: rgba(59,130,246,0.1); padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                <b>1. Lançamento por Funcionário:</b> Na tela do funcionário, clique no ícone de lápis na linha do dia desejado.
              </div>
              <div style="font-size: 12px; background: rgba(59,130,246,0.1); padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                <b>2. Lançamento em Lote:</b> Vá em "Lançamento em Lote" no menu para aplicar o mesmo horário para vários funcionários ao mesmo tempo.
              </div>
              <div style="font-size: 12px; background: rgba(59,130,246,0.1); padding: 10px; border-radius: 8px;">
                <b>3. Lançamento Direto:</b> Use a tabela de "Lançamento" para preencher uma planilha rápida de batidas.
              </div>
            `;
          } else if (tab === 'banco') {
            html = `
              <h4 style="color: #f59e0b; margin: 0 0 10px 0;">Entendendo o Banco de Horas</h4>
              <p style="font-size: 12px; color: var(--color-brand-muted); line-height: 1.5;">O sistema calcula automaticamente o saldo baseado na carga horária diária.</p>
              <div style="margin-top: 10px; border-left: 3px solid #f59e0b; padding-left: 10px;">
                <p style="font-size: 11px; margin-bottom: 5px;"><b>Saldo Anterior:</b> Valor que veio do mês/período anterior.</p>
                <p style="font-size: 11px; margin-bottom: 5px;"><b>Saldo do Mês:</b> Resultado apenas das batidas deste mês (Extras - Negativas).</p>
                <p style="font-size: 11px; font-weight: bold; color: #10b981;"><b>Banco Consolidado:</b> A soma real do que o funcionário tem a receber ou compensar.</p>
              </div>
              <p style="font-size: 11px; margin-top: 10px; font-style: italic;">Use o botão "Ajuste de Saldo" na tela do funcionário para correções manuais (ex: pagamento de horas).</p>
            `;
          } else if (tab === 'eventos') {
            html = `
              <h4 style="color: #ef4444; margin: 0 0 10px 0;">Tipos de Eventos</h4>
              <p style="font-size: 11px; color: var(--color-brand-text);">Os eventos alteram como as horas são calculadas:</p>
              <div style="font-size: 11px; line-height: 1.6; margin-top: 8px;">
                <p><b>🏖️ Folga Domingo / DSR:</b> Dia de descanso. Zera negativas. Se houver ponto, vira 100% Extra.</p>
                <p><b>❌ Falta:</b> Ausência não justificada. Desconta a carga horária do banco.</p>
                <p><b>🏥 Atestado / Férias:</b> Justificado. O sistema abona o dia e não gera negativas.</p>
                <p><b>🎉 Feriado:</b> Neutro para o banco. Marcações em feriado não geram extras automáticas.</p>
              </div>
            `;
          }
          contentArea.innerHTML = html;
        };
      }
    });
  };

  const HourCalculator = () => {
    const [calcMode, setCalcMode] = React.useState('somador'); // 'somador' | 'conversor'
    const [entries, setEntries] = React.useState([{ val: '', op: '+' }]);
    
    // Converter HH:MM ou Decimal para minutos
    const parse = (str) => {
      if (!str) return 0;
      const clean = str.trim();
      if (clean.includes(':')) {
        const parts = clean.split(':');
        const h = parseInt(parts[0]) || 0;
        const m = parseInt(parts[1]) || 0;
        return (h * 60) + m;
      }
      // Se não tem ':', tentar parse de número decimal (ex: 7.5 ou 7,5)
      const numStr = clean.replace(',', '.');
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        return Math.round(num * 60);
      }
      return 0;
    };

    const formatHHMM = (min) => {
      const abs = Math.abs(min);
      const h = Math.floor(abs / 60);
      const m = abs % 60;
      return `${min < 0 ? '-' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const formatDecimal = (min) => {
      const dec = (min / 60).toFixed(2).replace('.', ',');
      return `${dec}h`;
    };

    const totalMin = entries.reduce((acc, curr) => {
      const m = parse(curr.val);
      return curr.op === '+' ? acc + m : acc - m;
    }, 0);

    const addEntry = () => setEntries([...entries, { val: '', op: '+' }]);
    const updateEntry = (i, field, value) => {
      const newEntries = [...entries];
      newEntries[i][field] = value;
      setEntries(newEntries);
    };
    const removeEntry = (i) => i > 0 && setEntries(entries.filter((_, idx) => idx !== i));

    // Estados do Conversor Rápido
    const [inputTime, setInputTime] = React.useState('');
    const [inputDec, setInputDec] = React.useState('');

    // Conversões instantâneas
    const convertedDec = React.useMemo(() => {
      const m = parse(inputTime);
      if (!inputTime || m === 0 && !inputTime.includes('0')) return '—';
      return (m / 60).toFixed(2).replace('.', ',');
    }, [inputTime]);

    const convertedHHMM = React.useMemo(() => {
      if (!inputDec) return '—';
      const num = parseFloat(inputDec.replace(',', '.'));
      if (isNaN(num)) return '—';
      const totalM = Math.round(num * 60);
      return formatHHMM(totalM);
    }, [inputDec]);

    if (!calcOpen) return null;

    return (
      <div className="fixed bottom-6 right-6 w-84 bg-brand-surface border border-brand-border rounded-[2rem] shadow-2xl z-[100] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
        {/* Cabeçalho */}
        <div className="p-4 bg-brand-primary text-white flex justify-between items-center">
          <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Calculator size={14}/> Calculadora do Ponto</h4>
          <button onClick={() => setCalcOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors"><X size={16}/></button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-brand-border bg-brand-bg/40 p-1 gap-1">
          <button 
            onClick={() => setCalcMode('somador')}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${calcMode === 'somador' ? 'bg-brand-surface text-brand-primary shadow-sm border border-brand-border' : 'text-brand-muted hover:text-brand-text'}`}
          >
            Somador (HH:mm / Dec)
          </button>
          <button 
            onClick={() => setCalcMode('conversor')}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${calcMode === 'conversor' ? 'bg-brand-surface text-brand-primary shadow-sm border border-brand-border' : 'text-brand-muted hover:text-brand-text'}`}
          >
            Conversor Decimal
          </button>
        </div>

        {/* Conteúdo Aba Somador */}
        {calcMode === 'somador' && (
          <>
            <div className="p-4 max-h-56 overflow-y-auto space-y-2.5 custom-scrollbar">
              {entries.map((e, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 ? (
                    <button 
                      onClick={() => updateEntry(i, 'op', e.op === '+' ? '-' : '+')}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-black transition-colors ${e.op === '+' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-rose-500/10 text-rose-500'}`}
                    >
                      {e.op === '+' ? <Plus size={12}/> : <Minus size={12}/>}
                    </button>
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center text-brand-muted opacity-30"><Plus size={12}/></div>
                  )}
                  <input 
                    type="text" 
                    placeholder="00:00 ou 7.5"
                    value={e.val}
                    onChange={(ev) => updateEntry(i, 'val', ev.target.value)}
                    className="flex-1 bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-sm font-black text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/20 placeholder:text-brand-muted/30 placeholder:font-normal"
                  />
                  {i > 0 && (
                    <button onClick={() => removeEntry(i)} className="text-brand-muted hover:text-rose-500 transition-colors"><X size={14}/></button>
                  )}
                </div>
              ))}
              <button 
                onClick={addEntry}
                className="w-full py-2 border-2 border-dashed border-brand-border rounded-xl text-[10px] font-black text-brand-muted uppercase tracking-widest hover:border-brand-primary/50 hover:text-brand-primary transition-all mt-1"
              >
                + Adicionar Linha
              </button>
            </div>
            <div className="p-4 bg-brand-bg/50 border-t border-brand-border">
              <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest opacity-60">Total Calculado</span>
                 <button onClick={() => setEntries([{ val: '', op: '+' }])} className="text-brand-muted hover:text-brand-primary transition-colors" title="Limpar"><RotateCcw size={12}/></button>
              </div>
              <div className="flex items-baseline justify-between">
                 <span className="opacity-30"><Equal size={18}/></span>
                 <div className="text-right">
                   <div className={`text-2xl font-black tracking-tighter ${totalMin > 0 ? 'text-brand-primary' : totalMin < 0 ? 'text-rose-500' : 'text-brand-text'}`}>
                     {formatHHMM(totalMin)}
                   </div>
                   <div className="text-[11px] font-black text-brand-muted opacity-80 mt-0.5">
                     = <span className="text-brand-accent">{formatDecimal(totalMin)}</span> (decimal)
                   </div>
                 </div>
              </div>
            </div>
          </>
        )}

        {/* Conteúdo Aba Conversor */}
        {calcMode === 'conversor' && (
          <div className="p-4 space-y-4">
            <div className="bg-brand-bg border border-brand-border p-3.5 rounded-2xl space-y-2">
              <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest block">HH:mm ➔ Hora Decimal</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Ex: 07:20" 
                  value={inputTime}
                  onChange={(e) => setInputTime(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-sm font-black text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
                <div className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-3 py-2 rounded-xl text-sm font-black whitespace-nowrap min-w-[70px] text-center">
                  {convertedDec !== '—' ? `${convertedDec}h` : '—'}
                </div>
              </div>
            </div>

            <div className="bg-brand-bg border border-brand-border p-3.5 rounded-2xl space-y-2">
              <label className="text-[9px] font-black text-brand-muted uppercase tracking-widest block">Hora Decimal ➔ HH:mm</label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Ex: 7.33" 
                  value={inputDec}
                  onChange={(e) => setInputDec(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-sm font-black text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
                <div className="bg-brand-accent/10 border border-brand-accent/20 text-brand-accent px-3 py-2 rounded-xl text-sm font-black whitespace-nowrap min-w-[70px] text-center">
                  {convertedHHMM}
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-brand-muted opacity-60 text-center font-bold">
              Tip: 30 min = 0,50h | 20 min = 0,33h | 15 min = 0,25h | 45 min = 0,75h
            </p>
          </div>
        )}
      </div>
    );
  };

  const SystemNotesPanel = () => {
    const [items, setItems] = React.useState([]);
    const [newItem, setNewItem] = React.useState('');

    React.useEffect(() => {
      const saved = localStorage.getItem('system_notes_list');
      if (saved) {
        try {
          setItems(JSON.parse(saved));
        } catch(e) {}
      }
    }, []);

    const saveItems = (newItems) => {
      setItems(newItems);
      localStorage.setItem('system_notes_list', JSON.stringify(newItems));
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && newItem.trim()) {
        saveItems([...items, { id: Date.now(), text: newItem.trim(), done: false }]);
        setNewItem('');
      }
    };

    const toggleItem = (id) => {
      saveItems(items.map(i => i.id === id ? { ...i, done: !i.done } : i));
    };

    const removeItem = (id) => {
      saveItems(items.filter(i => i.id !== id));
    };

    if (!notesOpen) return null;

    return (
      <div className="fixed top-24 right-6 w-80 bg-brand-surface border border-brand-border rounded-[2rem] shadow-2xl z-[100] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-top-10 duration-300">
        <div className="p-4 bg-amber-500 text-white flex justify-between items-center">
          <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><FileCheck size={14}/> Lista de Atualizações</h4>
          <button onClick={() => setNotesOpen(false)} className="hover:bg-black/20 p-1 rounded-lg transition-colors"><X size={16}/></button>
        </div>
        <div className="p-4 bg-brand-bg/50 border-b border-brand-border">
          <input 
            type="text" 
            placeholder="Adicionar nova nota... (Enter)"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-xs font-bold text-brand-text outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
          {items.length === 0 ? (
            <p className="text-center text-[10px] text-brand-muted uppercase font-black tracking-widest py-8 opacity-50">Nenhuma anotação.</p>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex items-start gap-2 p-2 hover:bg-brand-bg rounded-xl group transition-all">
                <button 
                  onClick={() => toggleItem(item.id)}
                  className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.done ? 'bg-amber-500 border-amber-500 text-white' : 'border-brand-border hover:border-amber-500'}`}
                >
                  {item.done && <Check size={10} strokeWidth={4} />}
                </button>
                <p className={`flex-1 text-xs font-bold transition-all ${item.done ? 'text-brand-muted line-through opacity-50' : 'text-brand-text'}`}>
                  {item.text}
                </p>
                <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-brand-muted hover:text-rose-500 transition-all"><X size={12}/></button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-6">
          <div className="w-14 h-14 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
          <p className="text-brand-muted font-black animate-pulse uppercase tracking-widest text-[10px]">Sincronizando Ecossistema...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex min-h-screen bg-brand-bg font-sans text-brand-text transition-colors duration-300">
      {/* Barra Lateral Dinâmica */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Barra de Busca/Ações */}
        <header className="h-20 lg:h-20 bg-brand-surface/80 backdrop-blur-md border-b border-brand-border px-4 lg:px-8 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-brand-muted hover:text-brand-primary"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="hidden md:flex items-center gap-4 bg-brand-bg/50 px-5 py-2.5 rounded-2xl border border-brand-border w-96 max-w-full shadow-inner group focus-within:border-brand-primary/30 transition-all">
              <Search size={18} className="text-brand-muted group-focus-within:text-brand-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar funcionários, relatórios ou logs..." 
                className="bg-transparent border-none focus:outline-none text-sm text-brand-text placeholder:text-brand-muted/50 w-full font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 text-brand-muted hover:text-brand-primary hover:bg-brand-surface rounded-xl transition-all relative group border border-transparent hover:border-brand-border">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-brand-primary rounded-full border-2 border-brand-surface group-hover:scale-125 transition-transform shadow-lg"></span>
            </button>
            <button
              onClick={handleOpenFeriados}
              className="hidden sm:flex p-2.5 text-brand-muted hover:text-brand-primary hover:bg-brand-surface rounded-xl transition-all border border-transparent hover:border-brand-border"
              title="Feriados Nacionais"
            >
              <CalendarDays size={20} />
            </button>
            <button 
              onClick={handleShowHelpCenter}
              className="hidden sm:flex p-2.5 text-brand-muted hover:text-brand-primary hover:bg-brand-surface rounded-xl transition-all border border-transparent hover:border-brand-border"
              title="Central de Ajuda"
            >
              <BookOpen size={20} />
            </button>
            <button 
              onClick={() => setCalcOpen(!calcOpen)}
              className={`p-2.5 rounded-xl transition-all border border-transparent hover:border-brand-border ${calcOpen ? 'bg-brand-primary text-white' : 'text-brand-muted hover:text-brand-primary hover:bg-brand-surface'}`}
              title="Calculadora de Horas"
            >
              <Calculator size={20} />
            </button>
            <button 
              onClick={() => setNotesOpen(!notesOpen)}
              className={`p-2.5 rounded-xl transition-all border border-transparent hover:border-brand-border ${notesOpen ? 'bg-amber-500 text-white' : 'text-brand-muted hover:text-amber-500 hover:bg-brand-surface'}`}
              title="Lista de Atualizações / Ideias"
            >
              <FileCheck size={20} />
            </button>
            <button 
              onClick={handleSettings}
              className="p-2.5 text-brand-muted hover:text-brand-primary hover:bg-brand-surface rounded-xl transition-all border border-transparent hover:border-brand-border"
              title="Configurações"
            >
              <Settings size={20} />
            </button>
            
            <div className="h-8 w-[1px] bg-brand-border mx-3 opacity-50"></div>
            
            <div className="hidden lg:flex items-center gap-2.5 px-5 py-2 bg-brand-accent/10 border border-brand-accent/20 rounded-full shadow-lg shadow-brand-accent/5">
              <div className="w-2.5 h-2.5 bg-brand-accent rounded-full shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse"></div>
              <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest">SISTEMA OK</span>
            </div>
          </div>
        </header>

        {/* Content Container com Scroll Suave */}
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Modal de Feriados */}
      {feriadosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setFeriadosOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-brand-surface border border-brand-border rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-brand-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-primary/10 rounded-xl">
                  <CalendarDays size={20} className="text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-brand-text uppercase tracking-widest">Feriados Nacionais</h2>
                  <p className="text-[10px] text-brand-muted font-bold opacity-50">via BrasilAPI · dados oficiais</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Seletor de Ano */}
                <div className="flex items-center gap-1 bg-brand-bg border border-brand-border rounded-xl px-2 py-1">
                  <button
                    onClick={() => handleAnoChange(feriadosAno - 1)}
                    className="text-brand-muted hover:text-brand-primary font-black text-xs px-1 transition-colors"
                  >‹</button>
                  <span className="text-xs font-black text-brand-text px-2">{feriadosAno}</span>
                  <button
                    onClick={() => handleAnoChange(feriadosAno + 1)}
                    className="text-brand-muted hover:text-brand-primary font-black text-xs px-1 transition-colors"
                  >›</button>
                </div>
                <button
                  onClick={() => setFeriadosOpen(false)}
                  className="p-2 text-brand-muted hover:text-brand-text hover:bg-brand-bg rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Lista de Feriados */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {feriadosLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 size={28} className="text-brand-primary animate-spin" />
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest opacity-50">Buscando feriados...</p>
                </div>
              ) : feriados.length === 0 ? (
                <p className="text-center py-10 text-brand-muted text-xs opacity-50">Nenhum feriado encontrado para {feriadosAno}.</p>
              ) : (
                (() => {
                  const porMes = feriados.reduce((acc, f) => {
                    const mes = parseInt(f.date.split('-')[1]) - 1;
                    if (!acc[mes]) acc[mes] = [];
                    acc[mes].push(f);
                    return acc;
                  }, {});
                  return Object.entries(porMes).map(([mesIdx, lista]) => (
                    <div key={mesIdx} className="mb-3">
                      <p className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em] px-2 py-1 opacity-70">
                        {mesesPtBR[parseInt(mesIdx)]}
                      </p>
                      {lista.map(f => {
                        const [, , dia] = f.date.split('-');
                        const hoje = new Date().toISOString().substring(0, 10);
                        const isHoje = f.date === hoje;
                        const isPast = f.date < hoje;
                        return (
                          <div
                            key={f.date}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                              isHoje
                                ? 'bg-brand-primary/15 border border-brand-primary/30'
                                : isPast
                                ? 'opacity-40'
                                : 'hover:bg-brand-bg'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                              isHoje ? 'bg-brand-primary text-white' : 'bg-brand-bg border border-brand-border text-brand-text'
                            }`}>
                              <span className="text-[9px] font-black uppercase opacity-60">{f.weekday?.substring(0,3) || ''}</span>
                              <span className="text-sm font-black leading-none">{dia}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-brand-text truncate">{f.name}</p>
                              {isHoje && (
                                <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest">Hoje!</span>
                              )}
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-bg border border-brand-border text-brand-muted opacity-60">
                              {f.type === 'national' ? 'Nacional' : 'Estadual'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-brand-border bg-brand-bg/50">
              <p className="text-[9px] text-brand-muted font-bold text-center opacity-40 uppercase tracking-widest">
                {feriados.length} feriado{feriados.length !== 1 ? 's' : ''} em {feriadosAno} · Fonte: BrasilAPI
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calculadora de Horas Flutuante */}
      <HourCalculator />

      {/* Painel de Anotações Flutuante */}
      <SystemNotesPanel />

      {/* Toast Notifications Globais */}
      <ToastContainer />
    </div>
  );
};

export default ProtectedLayout;
