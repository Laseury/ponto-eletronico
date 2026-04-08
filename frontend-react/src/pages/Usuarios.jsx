import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Key,
  Fingerprint
} from 'lucide-react';
import Swal from 'sweetalert2';

const Usuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        nome: '',
        login: '',
        senha: '',
        perfil: 'Funcionario',
        funcionarioId: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resUsers, resFuncs] = await Promise.all([
                axios.get('/auth/users'),
                axios.get('/funcionarios')
            ]);
            setUsuarios(resUsers.data);
            setFuncionarios(resFuncs.data);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            Swal.fire({
                title: 'Erro!',
                text: 'Não foi possível carregar a lista de usuários.',
                icon: 'error',
                background: '#1e293b',
                color: '#f8fafc'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.nome || !formData.login || !formData.senha) {
            Swal.fire({ title: 'Atenção', text: 'Preencha todos os campos obrigatórios.', icon: 'warning', background: '#1e293b', color: '#f8fafc' });
            return;
        }

        setLoading(true);
        try {
            await axios.post('/auth/register', {
                ...formData,
                funcionarioId: formData.funcionarioId ? parseInt(formData.funcionarioId) : null
            });
            
            Swal.fire({
                title: 'Sucesso!',
                text: 'Usuário cadastrado com sucesso.',
                icon: 'success',
                background: '#1e293b',
                color: '#f8fafc'
            });
            
            setFormData({ nome: '', login: '', senha: '', perfil: 'Funcionario', funcionarioId: '' });
            setShowForm(false);
            fetchData();
        } catch (error) {
            const msg = error.response?.data?.error || 'Erro ao realizar cadastro.';
            Swal.fire({ title: 'Erro!', text: msg, icon: 'error', background: '#1e293b', color: '#f8fafc' });
        } finally {
            setLoading(false);
        }
    };

    const getBadgeStyle = (perfil) => {
        switch(perfil) {
            case 'Admin': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'RH': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
            case 'Gestor': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'Contador': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-brand-text tracking-tighter flex items-center gap-3">
                        Gestão de Acessos
                        <span className="text-brand-primary">.</span>
                    </h1>
                    <p className="text-brand-muted font-bold mt-1 text-sm opacity-60">Controle quem pode acessar o ecossistema e quais suas permissões.</p>
                </div>
                
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl ${
                        showForm 
                        ? 'bg-brand-surface border border-brand-border text-brand-muted hover:text-white' 
                        : 'bg-brand-primary text-white hover:shadow-brand-primary/20 scale-100 hover:scale-105 active:scale-95'
                    }`}
                >
                    {showForm ? <><X size={16} /> Cancelar</> : <><UserPlus size={16} /> Novo Usuário</>}
                </button>
            </div>

            {/* Form de Cadastro */}
            {showForm && (
                <div className="bg-brand-surface border border-brand-border rounded-3xl p-8 shadow-2xl relative overflow-hidden group animate-in zoom-in-95 duration-300">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                        <Fingerprint size={160} />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1 opacity-50 flex items-center gap-2">
                                    <Users size={12} className="text-brand-primary" /> Nome Completo
                                </label>
                                <input 
                                    type="text" 
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Carlos RH"
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-5 py-3 text-brand-text text-sm font-bold outline-none focus:border-brand-primary/50 transition-all shadow-inner"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1 opacity-50 flex items-center gap-2">
                                    <Fingerprint size={12} className="text-brand-primary" /> Login / Usuário
                                </label>
                                <input 
                                    type="text" 
                                    name="login"
                                    value={formData.login}
                                    onChange={handleInputChange}
                                    placeholder="carlos.rh"
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-5 py-3 text-brand-text text-sm font-bold outline-none focus:border-brand-primary/50 transition-all shadow-inner"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1 opacity-50 flex items-center gap-2">
                                    <Key size={12} className="text-brand-primary" /> Senha Inicial
                                </label>
                                <input 
                                    type="password" 
                                    name="senha"
                                    value={formData.senha}
                                    onChange={handleInputChange}
                                    placeholder="••••••••"
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-5 py-3 text-brand-text text-sm font-bold outline-none focus:border-brand-primary/50 transition-all shadow-inner"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1 opacity-50 flex items-center gap-2">
                                    <Shield size={12} className="text-brand-primary" /> Perfil de Acesso
                                </label>
                                <select 
                                    name="perfil"
                                    value={formData.perfil}
                                    onChange={handleInputChange}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-5 py-3 text-brand-text text-sm font-bold outline-none focus:border-brand-primary/50 transition-all shadow-inner appearance-none cursor-pointer"
                                >
                                    <option value="Admin">Administrador (Total)</option>
                                    <option value="RH">RH (Gestão Geral)</option>
                                    <option value="Gestor">Gestor (Equipe)</option>
                                    <option value="Contador">Contador (Faltas/Relatórios)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1 opacity-50 flex items-center gap-2">
                                    <Users size={12} className="text-brand-primary" /> Vincular Funcionário
                                </label>
                                <select 
                                    name="funcionarioId"
                                    value={formData.funcionarioId}
                                    onChange={handleInputChange}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-5 py-3 text-brand-text text-sm font-bold outline-none focus:border-brand-primary/50 transition-all shadow-inner appearance-none cursor-pointer"
                                >
                                    <option value="">Nenhum vínculo (Apenas Gestão)</option>
                                    {funcionarios.map(f => (
                                        <option key={f.id} value={f.id}>{f.id} - {f.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-6 flex items-end">
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-brand-primary text-white font-black py-3 rounded-xl shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/40 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                                >
                                    {loading ? 'Processando...' : <><Save size={16} /> Salvar Usuário</>}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabela de Usuários */}
            <div className="bg-brand-surface border border-brand-border rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-brand-border text-[10px] uppercase tracking-widest text-brand-muted opacity-60">
                                <th className="px-6 py-4 font-black">ID</th>
                                <th className="px-6 py-4 font-black">Usuário</th>
                                <th className="px-6 py-4 font-black">Perfil</th>
                                <th className="px-6 py-4 font-black">Vínculo</th>
                                <th className="px-6 py-4 font-black">Criado em</th>
                                <th className="px-6 py-4 font-black text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/30">
                            {usuarios.length > 0 ? (
                                usuarios.map(u => (
                                    <tr key={u.id} className="group/row hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-brand-muted opacity-40">{u.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-brand-text uppercase tracking-tighter">{u.nome}</span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Fingerprint size={10} className="text-brand-primary" />
                                                    <span className="text-[10px] font-bold text-brand-muted opacity-60 italic">{u.login}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getBadgeStyle(u.perfil)}`}>
                                                {u.perfil}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.funcionario ? (
                                                <span className="text-xs font-bold text-brand-muted italic flex items-center gap-1.5">
                                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                                    {u.funcionario.nome}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-brand-muted/30 uppercase tracking-widest">Global</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-brand-muted/60">
                                            {u.criadoEm ? new Date(u.criadoEm).toLocaleDateString() : '--/--/----'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="p-2 text-brand-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover/row:opacity-100">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-brand-muted text-sm italic opacity-40 leading-relaxed font-bold">
                                        {loading ? 'Carregando banco de dados...' : 'Nenhum usuário secundário configurado.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Helper Footer */}
            <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-6 flex gap-4 items-start shadow-xl">
                <div className="p-3 bg-brand-primary/20 rounded-2xl text-brand-primary animate-pulse shadow-lg shadow-brand-primary/10">
                    <Shield size={24} />
                </div>
                <div>
                    <h4 className="text-brand-text font-black text-sm tracking-tight italic">Políticas de Acesso</h4>
                    <p className="text-brand-muted text-xs mt-1.5 font-medium leading-relaxed opacity-60">
                        O sistema utiliza **RBAC** (Role-Based Access Control). Perfis `Admin` conseguem gerenciar tudo, `Gestor` visualiza apenas equipes, 
                        e `Funcionario` tem acesso restrito ao registro de ponto individual.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Usuarios;
