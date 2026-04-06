import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { Bell, Search, Settings, HelpCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const ProtectedLayout = () => {
  const { user, loading } = useAuth();

  const handleSettings = async () => {
    let htmlContent = `
      <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
        <button id="btn-meus-dados" style="padding: 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s;">✏️ Alterar Meus Dados</button>
    `;
    
    if (user?.perfil === 'Admin') {
      htmlContent += `
        <button id="btn-gerenciar" style="padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.2s;" onclick="alert('Gestão em breve')">👥 Gerenciar Acessos</button>
      `;
    }
    
    htmlContent += `</div>`;

    Swal.fire({
      title: 'Configurações',
      html: htmlContent,
      showConfirmButton: false,
      showCloseButton: true,
      background: '#1e293b',
      color: '#f8fafc',
      didOpen: () => {
        document.getElementById('btn-meus-dados').onclick = async () => {
          Swal.close();
          const { value: formValues } = await Swal.fire({
            title: 'Meus Dados',
            html: `
              <input id="swal-input1" class="swal2-input" placeholder="Novo Nome" value="${user.nome || ''}">
              <input id="swal-input2" class="swal2-input" placeholder="Nova Senha" type="password">
            `,
            background: '#1e293b',
            color: '#f8fafc',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
              return [
                document.getElementById('swal-input1').value,
                document.getElementById('swal-input2').value
              ]
            }
          });
          
          if (formValues) {
            const [newName, newPass] = formValues;
            if (newName && newPass) {
              // Aqui no futuro pode chamar a API /auth/update
              Swal.fire({ title: 'Atenção!', text: 'Atualização não implementada no backend ainda.', icon: 'info', background: '#1e293b', color: '#f8fafc' });
            }
          }
        };
      }
    });
  };

  const handleShowEventSummary = () => {
    Swal.fire({
      title: 'Resumo dos Eventos',
      html: `
        <div style="text-align: left; font-size: 14px; line-height: 1.6; margin-top: 10px;">
          <p><strong>🏖️ Folga:</strong> Dia de descanso semanal padrão.</p>
          <p><strong>❌ Falta:</strong> Ausência não justificada. Desconta horas do banco ou salário.</p>
          <p><strong>🏥 Atestado:</strong> Ausência justificada por motivos de saúde.</p>
          <p><strong>🏄 Férias:</strong> Período de férias regulamentares.</p>
          <p><strong>📅 DSR:</strong> Descanso Semanal Remunerado.</p>
          <p><strong>🎉 Feriado:</strong> Feriado (ponto facultativo ou nacional).</p>
          <p><strong>🏦 Folga Banco:</strong> Descanso utilizando horas do banco acumulado.</p>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#10b981',
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
      <Sidebar />

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Barra de Busca/Ações */}
        <header className="h-20 bg-brand-surface/80 backdrop-blur-md border-b border-brand-border px-8 flex items-center justify-between sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center gap-4 bg-brand-bg/50 px-5 py-2.5 rounded-2xl border border-brand-border w-96 max-w-full shadow-inner group focus-within:border-brand-primary/30 transition-all">
            <Search size={18} className="text-brand-muted group-focus-within:text-brand-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar funcionários, relatórios ou logs..." 
              className="bg-transparent border-none focus:outline-none text-sm text-brand-text placeholder:text-brand-muted/50 w-full font-medium"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 text-brand-muted hover:text-brand-primary hover:bg-brand-surface rounded-xl transition-all relative group border border-transparent hover:border-brand-border">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-brand-primary rounded-full border-2 border-brand-surface group-hover:scale-125 transition-transform shadow-lg"></span>
            </button>
            <button 
              onClick={handleShowEventSummary}
              className="p-2.5 text-brand-muted hover:text-brand-primary hover:bg-brand-surface rounded-xl transition-all border border-transparent hover:border-brand-border"
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
            
            {/* Status do Servidor/Sistema */}
            <div className="flex items-center gap-2.5 px-5 py-2 bg-brand-accent/10 border border-brand-accent/20 rounded-full shadow-lg shadow-brand-accent/5">
              <div className="w-2.5 h-2.5 bg-brand-accent rounded-full shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse"></div>
              <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest">SISTEMA OK</span>
            </div>
          </div>
        </header>

        {/* Content Container com Scroll Suave */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProtectedLayout;
