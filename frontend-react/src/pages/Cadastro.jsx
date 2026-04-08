import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  UserPlus, 
  ArrowLeft, 
  Save, 
  Users, 
  Briefcase,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const Cadastro = () => {
    const navigate = useNavigate();
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('');
    const [loading, setLoading] = useState(false);
    const [funcionarios, setFuncionarios] = useState([]);
    const [mostrarInativos, setMostrarInativos] = useState(false);

    const fetchFuncionarios = async () => {
        try {
            const url = mostrarInativos ? '/funcionarios?todos=1' : '/funcionarios';
            const response = await axios.get(url);
            setFuncionarios(response.data);
        } catch (error) {
            console.error('Erro ao buscar lista de funcionários:', error);
        }
    };

    useEffect(() => {
        fetchFuncionarios();
    }, [mostrarInativos]);

    const handleCadastro = async (e) => {
        e.preventDefault();
        if (!nome || !tipo) {
            Swal.fire({
                title: 'Campos Incompletos',
                text: 'Por favor, preencha o nome e o tipo de contrato.',
                icon: 'warning'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('/funcionarios', { nome, tipo });
            
            Swal.fire({
                title: 'Sucesso!',
                text: `Funcionário ${response.data.nome} cadastrado com sucesso.`,
                icon: 'success',
                confirmButtonColor: '#10b981'
            });
            
            setNome('');
            setTipo('');
            fetchFuncionarios();
        } catch (error) {
            console.error('Erro ao cadastrar:', error);
            Swal.fire({
                title: 'Erro!',
                text: 'Não foi possível salvar o cadastro.',
                icon: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-3 bg-brand-surface border border-brand-border rounded-2xl text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-all shadow-xl"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-brand-text tracking-tighter flex items-center gap-3">
                            Novo Funcionário
                            <span className="text-brand-primary">.</span>
                        </h1>
                        <p className="text-brand-muted font-bold mt-0.5 text-xs opacity-60">Adicione um novo colaborador ao sistema.</p>
                    </div>
                </div>
            </div>

            <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:opacity-10 transition-opacity">
                    <UserPlus size={180} />
                </div>

                <form onSubmit={handleCadastro} className="space-y-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1 opacity-40">
                                <Users size={14} className="text-brand-primary" /> Nome Completo
                            </label>
                            <input 
                                type="text" 
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Ex: João da Silva"
                                className="w-full bg-brand-bg border border-brand-border rounded-xl px-5 py-3.5 text-brand-text text-sm font-black outline-none focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary/50 transition-all placeholder:text-brand-muted/30 shadow-inner"
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-[10px] font-black text-brand-muted uppercase tracking-widest ml-1 opacity-40">
                                <Briefcase size={14} className="text-brand-primary" /> Tipo de Contrato
                            </label>
                            <select 
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                                className="w-full bg-brand-bg border border-brand-border rounded-xl px-5 py-3.5 text-brand-text text-sm font-black outline-none focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary/50 transition-all appearance-none cursor-pointer shadow-inner"
                                required
                            >
                                <option value="" disabled className="text-brand-muted opacity-50">Selecione...</option>
                                <option value="Mensalista" className="bg-brand-surface">Mensalista</option>
                                <option value="Horista" className="bg-brand-surface">Horista</option>
                                <option value="Horista Noturno" className="bg-brand-surface">Horista Noturno</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-8 flex justify-end">
                        <button 
                            type="submit"
                            disabled={loading}
                            className="bg-brand-primary hover:bg-brand-primary/90 text-white font-black py-4 px-12 rounded-xl shadow-xl shadow-brand-primary/30 transform active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] uppercase tracking-widest leading-none"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Save size={18} className="group-hover:rotate-12 transition-transform shadow-sm" />
                                    Finalizar Cadastro
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Helper Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 flex gap-4 items-start shadow-xl">
                    <div className="p-2.5 bg-brand-accent/10 rounded-xl text-brand-accent shadow-lg shadow-brand-accent/10"><CheckCircle2 size={24} /></div>
                    <div>
                        <h4 className="text-brand-text font-black text-sm tracking-tight italic">Pronto para o Ponto</h4>
                        <p className="text-brand-muted text-xs mt-1.5 font-medium leading-relaxed opacity-50">Funcionário disponível imediatamente para lançamentos e relatórios.</p>
                    </div>
                </div>
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 flex gap-4 items-start shadow-xl">
                    <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary shadow-lg shadow-brand-primary/10"><AlertCircle size={24} /></div>
                    <div>
                        <h4 className="text-brand-text font-black text-sm tracking-tight italic">Regimes de Trabalho</h4>
                        <p className="text-brand-muted text-xs mt-1.5 font-medium leading-relaxed opacity-50">O regime define o motor de cálculo para horas extras e adicional noturno.</p>
                    </div>
                </div>
            </div>

            {/* Lista de Funcionários Cadastrados */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-brand-text">Gestão de Colaboradores</h3>
                    <div className="flex items-center gap-3 bg-brand-bg/50 px-4 py-2 rounded-xl border border-brand-border">
                        <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest opacity-60">Exibir Inativos</span>
                        <button 
                            onClick={() => setMostrarInativos(!mostrarInativos)}
                            className={`w-10 h-5 rounded-full p-1 transition-colors duration-300 ${mostrarInativos ? 'bg-brand-primary' : 'bg-brand-muted/30'}`}
                        >
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-300 ${mostrarInativos ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-brand-border text-[10px] uppercase tracking-widest text-brand-muted opacity-60">
                                <th className="px-4 py-3 font-black">ID</th>
                                <th className="px-4 py-3 font-black">Nome Completo</th>
                                <th className="px-4 py-3 font-black">Tipo de Contrato</th>
                                <th className="px-4 py-3 font-black text-center">Status</th>
                                <th className="px-4 py-3 font-black text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/30">
                            {funcionarios.length > 0 ? (
                                funcionarios.map(f => (
                                    <tr key={f.id} className="hover:bg-brand-bg/50 transition-colors">
                                        <td className="px-4 py-4 text-xs font-bold text-brand-muted">{f.id}</td>
                                        <td className="px-4 py-4 text-sm font-black text-brand-text">{f.nome}</td>
                                        <td className="px-4 py-4 text-xs font-bold text-brand-primary">{f.tipo}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded-full border tracking-widest ${f.ativo !== false ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                                {f.ativo !== false ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button 
                                                onClick={() => navigate(`/funcionario?id=${f.id}`)}
                                                className="text-[10px] font-black text-brand-primary hover:text-brand-accent uppercase tracking-widest"
                                            >
                                                Ver Detalhes
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-4 py-8 text-center text-brand-muted text-sm italic opacity-60">
                                        Nenhum funcionário cadastrado ainda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Cadastro;
