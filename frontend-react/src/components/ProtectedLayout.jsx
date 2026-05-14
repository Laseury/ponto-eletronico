import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { Bell, Search, Settings, HelpCircle, Menu, X, CalendarDays, Loader2 } from 'lucide-react';
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

  const handleShowEventSummary = () => {
    swalTheme({
      title: 'Resumo dos Eventos',
      html: `
        <div style="text-align: left; font-size: 14px; line-height: 1.6; margin-top: 10px;">
          <p><strong>🏖️ Folga / 📅 DSR:</strong> Dia de descanso. Zera as horas negativas. Se houver registro de ponto, o tempo trabalhado vira 100% Extra.</p>
          <p><strong>❌ Falta:</strong> Ausência não justificada. Gera horas negativas iguais à carga diária (podendo ser manual), descontando do saldo/banco de horas.</p>
          <p><strong>🏥 Atestado / 🏄 Férias / 📄 Declaração:</strong> Ausência justificada. O sistema anula as horas negativas para que não haja desconto no saldo.</p>
          <p><strong>🎉 Feriado:</strong> Dia não útil. Não gera horas negativas e bloqueia o cálculo automático de horas extras caso haja marcação.</p>
          <p><strong>🏦 Folga Banco:</strong> Descanso utilizando banco. Gera horas negativas propositalmente para descontar as horas tiradas do saldo acumulado do funcionário.</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Entendi'
    });
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
              onClick={handleShowEventSummary}
              className="hidden sm:flex p-2.5 text-brand-muted hover:text-brand-primary hover:bg-brand-surface rounded-xl transition-all border border-transparent hover:border-brand-border"
              title="Resumo dos Eventos"
            >
              <HelpCircle size={20} />
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
    </div>
  );
};

export default ProtectedLayout;
