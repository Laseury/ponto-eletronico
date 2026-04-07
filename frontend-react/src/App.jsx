import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Funcionario from './pages/Funcionario';
import Lancamento from './pages/Lancamento';
import Cadastro from './pages/Cadastro';
import LancamentoLote from './pages/LancamentoLote';
import LancamentoEventoLote from './pages/LancamentoEventoLote';
import Relatorio from './pages/Relatorio';
import Logs from './pages/Logs';
import Usuarios from './pages/Usuarios';
import GestorDashboard from './pages/gestor/GestorDashboard';
import RelatorioGestor from './pages/gestor/RelatorioGestor';
import Contador from './pages/contador/Contador';
import ProtectedLayout from './components/ProtectedLayout';

// Páginas Provisórias para Teste de Roteamento
const PlaceholderPage = ({ title }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div>
      <h1 className="text-3xl font-black text-white tracking-tight">{title}</h1>
      <p className="text-slate-500 mt-1 font-medium">Você está visualizando a área de {title.toLowerCase()}.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-end gap-2 hover:border-blue-500/50 transition-colors shadow-2xl">
          <div className="w-10 h-10 bg-slate-800 rounded-full"></div>
          <div className="h-4 bg-slate-800 rounded-full w-2/3"></div>
          <div className="h-3 bg-slate-800 rounded-full w-1/2 opacity-50"></div>
        </div>
      ))}
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rota Pública */}
          <Route path="/" element={<Login />} />
          
          {/* Rotas Protegidas com Layout Comum */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/funcionario" element={<Funcionario />} />
            <Route path="/lancamento" element={<Lancamento />} />
            <Route path="/funcionarios" element={<Cadastro />} />
            <Route path="/lancamento-lote" element={<LancamentoLote />} />
            <Route path="/eventos-lote" element={<LancamentoEventoLote />} />
            <Route path="/relatorios" element={<Relatorio />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/usuarios" element={<Usuarios />} />
            
            {/* Rotas de Gestor */}
            <Route path="/dashboard-gestor" element={<GestorDashboard />} />
            <Route path="/equipe" element={<GestorDashboard />} />
            <Route path="/relatorio-equipe" element={<RelatorioGestor />} />
            <Route path="/funcionario-gestor" element={<Funcionario />} />
            
            {/* Rotas de Contador */}
            <Route path="/dashboard-contador" element={<Contador />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
