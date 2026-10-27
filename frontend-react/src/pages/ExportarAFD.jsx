import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Download, 
  Calendar, 
  Building2, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Save, 
  Sparkles, 
  HelpCircle, 
  Clock, 
  FileSpreadsheet, 
  Printer, 
  Search,
  Check,
  RefreshCw,
  Archive,
  ArrowRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import swalTheme from '../utils/swalTheme';

const ExportarAFD = () => {
    // Configurações da Empresa e REP
    const [tipoIdentificador, setTipoIdentificador] = useState('1'); // 1=CNPJ, 2=CPF
    const [cnpjCpf, setCnpjCpf] = useState('');
    const [razaoSocial, setRazaoSocial] = useState('');
    const [cei, setCei] = useState('');
    const [numeroREP, setNumeroREP] = useState('00000000000000001');
    const [padrao, setPadrao] = useState('1510'); // '1510' ou '671'
    const [formatoCpf671, setFormatoCpf671] = useState('0'); // '0' ou '9'
    const [incluirTipo5, setIncluirTipo5] = useState(false);

    // Filtros de Período
    const [modoPeriodo, setModoPeriodo] = useState('todos'); // 'todos', 'mes_ano', 'custom'
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [ano, setAno] = useState(new Date().getFullYear());
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    // Funcionários e Seleção
    const [funcionarios, setFuncionarios] = useState([]);
    const [selecionados, setSelecionados] = useState([]);
    const [filtroFunc, setFiltroFunc] = useState('');
    const [mapeamentoPis, setMapeamentoPis] = useState({});
    const [mapeamentoCpf, setMapeamentoCpf] = useState({});
    const [salvandoPis, setSalvandoPis] = useState(false);

    // Estado da Prévia do AFD
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [dadosPreview, setDadosPreview] = useState(null);
    const [copiado, setCopiado] = useState(false);
    const [salvandoConfig, setSalvandoConfig] = useState(false);

    const MESES = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    // Carregar configurações salvas e funcionários ao montar
    useEffect(() => {
        carregarConfiguracoes();
        carregarFuncionarios();
    }, []);

    const carregarConfiguracoes = async () => {
        try {
            const res = await axios.get('/afd/config');
            if (res.data) {
                if (res.data.tipoIdentificador) setTipoIdentificador(res.data.tipoIdentificador);
                if (res.data.cnpjCpf) setCnpjCpf(res.data.cnpjCpf);
                if (res.data.razaoSocial) setRazaoSocial(res.data.razaoSocial);
                if (res.data.cei) setCei(res.data.cei);
                if (res.data.numeroREP) setNumeroREP(res.data.numeroREP);
                if (res.data.padrao) setPadrao(res.data.padrao);
                if (res.data.formatoCpf671) setFormatoCpf671(res.data.formatoCpf671);
                if (res.data.incluirTipo5 !== undefined) setIncluirTipo5(res.data.incluirTipo5);
            }
        } catch (e) {
            console.warn('Configurações salvas não encontradas, usando padrões.', e);
        }
    };

    const carregarFuncionarios = async () => {
        try {
            // todos=1 inclui ativos e inativos (vital para encerramento de sistema)
            const res = await axios.get('/funcionarios?todos=1');
            const lista = res.data || [];
            setFuncionarios(lista);
            setSelecionados(lista.map(f => f.id));

            // Inicializar mapeamentos com dados do banco
            const mapP = {};
            const mapC = {};
            lista.forEach(f => {
                mapP[f.id] = f.pis || '';
                mapC[f.id] = f.cpf || '';
            });
            setMapeamentoPis(mapP);
            setMapeamentoCpf(mapC);
        } catch (e) {
            console.error('Erro ao carregar colaboradores:', e);
        }
    };

    // Auto-preencher PIS sequencial para colaboradores que não possuem
    const handleAutoPreencherPis = () => {
        const novosPis = { ...mapeamentoPis };
        let preenchidos = 0;
        funcionarios.forEach(f => {
            if (!novosPis[f.id] || novosPis[f.id].trim() === '') {
                // Gera 12 dígitos usando o ID com zeros à esquerda
                novosPis[f.id] = String(f.id).padStart(12, '0');
                preenchidos++;
            }
        });
        setMapeamentoPis(novosPis);
        swalTheme({
            title: 'PIS Preenchidos!',
            text: `${preenchidos} colaboradores receberam numeração de PIS sequencial automática.`,
            icon: 'info'
        });
    };

    // Salvar PIS e CPF no banco de dados
    const handleSalvarIdentificadoresBanco = async () => {
        setSalvandoPis(true);
        try {
            const payload = funcionarios.map(f => ({
                id: f.id,
                pis: mapeamentoPis[f.id] || null,
                cpf: mapeamentoCpf[f.id] || null
            }));

            const res = await axios.post('/afd/salvar-identificadores', { colaboradores: payload });
            swalTheme({
                title: 'Identificadores Salvos!',
                text: res.data.mensagem || 'Dados de PIS e CPF gravados no banco com sucesso.',
                icon: 'success'
            });
        } catch (e) {
            swalTheme({
                title: 'Erro',
                text: e.response?.data?.erro || e.message,
                icon: 'error'
            });
        } finally {
            setSalvandoPis(false);
        }
    };

    // Salvar configurações padrão da empresa
    const handleSalvarConfigEmpresa = async () => {
        setSalvandoConfig(true);
        try {
            await axios.post('/afd/config', {
                tipoIdentificador,
                cnpjCpf,
                razaoSocial,
                cei,
                numeroREP,
                padrao,
                formatoCpf671,
                incluirTipo5
            });
            swalTheme({
                title: 'Configurações Salvas',
                text: 'Os dados da empresa e parâmetros do REP foram guardados com sucesso.',
                icon: 'success'
            });
        } catch (e) {
            swalTheme({
                title: 'Erro ao Salvar',
                text: e.response?.data?.erro || e.message,
                icon: 'error'
            });
        } finally {
            setSalvandoConfig(false);
        }
    };

    // Parâmetros prontos para envio
    const getPayloadRequisicao = () => {
        return {
            periodo: modoPeriodo,
            mes: modoPeriodo === 'mes_ano' ? mes : undefined,
            ano: modoPeriodo === 'mes_ano' ? ano : undefined,
            dataInicio: modoPeriodo === 'custom' ? dataInicio : undefined,
            dataFim: modoPeriodo === 'custom' ? dataFim : undefined,
            funcionariosIds: selecionados.length === funcionarios.length ? undefined : selecionados,
            padrao,
            formatoCpf671,
            tipoIdentificador,
            cnpjCpf: cnpjCpf || '00000000000000',
            razaoSocial: razaoSocial || 'EMPRESA PADRAO',
            cei: cei || '000000000000',
            numeroREP: numeroREP || '00000000000000001',
            incluirTipo5,
            mapeamentoPis,
            mapeamentoCpf
        };
    };

    // Gerar Prévia do Arquivo AFD
    const handleGerarPreview = async () => {
        if (!razaoSocial.trim()) {
            return swalTheme({
                title: 'Atenção',
                text: 'Por favor, informe a Razão Social da empresa.',
                icon: 'warning'
            });
        }
        if (!cnpjCpf.trim()) {
            return swalTheme({
                title: 'Atenção',
                text: 'Por favor, informe o CNPJ ou CPF da empresa.',
                icon: 'warning'
            });
        }
        if (modoPeriodo === 'custom' && (!dataInicio || !dataFim)) {
            return swalTheme({
                title: 'Atenção',
                text: 'Informe a Data de Início e a Data de Fim.',
                icon: 'warning'
            });
        }

        setLoadingPreview(true);
        try {
            const res = await axios.post('/afd/preview', getPayloadRequisicao());
            setDadosPreview(res.data);
        } catch (e) {
            swalTheme({
                title: 'Erro ao gerar prévia',
                text: e.response?.data?.erro || e.message,
                icon: 'error'
            });
        } finally {
            setLoadingPreview(false);
        }
    };

    // Download do arquivo AFD .txt oficial
    const handleDownloadTxt = async () => {
        try {
            const res = await axios.post('/afd/download-txt', getPayloadRequisicao(), {
                responseType: 'blob'
            });

            // Extrair nome do arquivo do header ou usar sugerido
            let fileName = dadosPreview?.resumo?.nomeArquivoSugerido || `AFD_${cnpjCpf.replace(/\D/g, '') || 'GERAL'}.txt`;
            const disposition = res.headers['content-disposition'];
            if (disposition && disposition.indexOf('filename=') !== -1) {
                const matches = /filename="([^"]*)"/.exec(disposition);
                if (matches != null && matches[1]) fileName = matches[1];
            }

            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/plain;charset=iso-8859-1' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            swalTheme({
                title: 'Download Concluído!',
                text: `Arquivo ${fileName} baixado com sucesso em formato legal CRLF.`,
                icon: 'success'
            });
        } catch (e) {
            swalTheme({
                title: 'Erro no Download',
                text: 'Não foi possível baixar o arquivo AFD.',
                icon: 'error'
            });
        }
    };

    // Download da Planilha CSV de Fechamento
    const handleDownloadCsv = async () => {
        try {
            const res = await axios.post('/afd/download-csv', getPayloadRequisicao(), {
                responseType: 'blob'
            });

            const fileName = `FECHAMENTO_PONTO_${cnpjCpf.replace(/\D/g, '') || 'GERAL'}.csv`;
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            swalTheme({
                title: 'Erro no Download',
                text: 'Não foi possível baixar a planilha CSV.',
                icon: 'error'
            });
        }
    };

    // Copiar prévia para área de transferência
    const handleCopiarPreview = () => {
        if (!dadosPreview?.previewLinhas) return;
        const texto = dadosPreview.previewLinhas.join('\r\n');
        navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
    };

    // Imprimir Termo de Encerramento e Auditoria Fiscal
    const handleImprimirTermo = () => {
        if (!dadosPreview) return;
        const r = dadosPreview.resumo;
        const janela = window.open('', '_blank');
        const conteudo = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Termo de Encerramento e Arquivo Fiscal AFD</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; color: #111; line-height: 1.5; }
                    .header { border-bottom: 3px solid #111; padding-bottom: 15px; margin-bottom: 25px; }
                    h1 { margin: 0 0 5px 0; font-size: 20px; text-transform: uppercase; }
                    p.sub { margin: 0; font-size: 13px; color: #555; }
                    .box { background: #f8f9fa; border: 1px solid #ddd; padding: 15px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    th { background: #333; color: #fff; }
                    .assinaturas { margin-top: 60px; display: flex; justify-content: space-between; }
                    .linha-ass { width: 45%; border-top: 1px solid #333; text-align: center; padding-top: 8px; font-size: 12px; }
                    @media print { button { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Termo de Desativação e Arquivo Fonte de Dados (AFD)</h1>
                    <p class="sub">Em cumprimento à Portaria MTE nº 1.510/2009 e Portaria MTP nº 671/2021</p>
                </div>

                <div class="box">
                    <div class="grid">
                        <div>
                            <strong>Empregador / Razão Social:</strong> ${razaoSocial}<br>
                            <strong>${tipoIdentificador === '1' ? 'CNPJ' : 'CPF'}:</strong> ${cnpjCpf}<br>
                            <strong>CEI / CAEPF:</strong> ${cei || 'Não informado'}<br>
                            <strong>Número do Equipamento REP:</strong> ${numeroREP}
                        </div>
                        <div>
                            <strong>Padrão Legal:</strong> Portaria ${padrao === '671' ? '671/2021 (REP-C com CPF)' : '1510/2009 (Universal / PIS)'}<br>
                            <strong>Período Abrangido:</strong> ${r.dataInicial?.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3')} até ${r.dataFinal?.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3')}<br>
                            <strong>Data da Exportação:</strong> ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}<br>
                            <strong>Arquivo Oficial Gerado:</strong> ${r.nomeArquivoSugerido}
                        </div>
                    </div>
                </div>

                <div class="box">
                    <strong>RESUMO CONSOLIDADO DOS REGISTROS FISCAIS:</strong>
                    <ul>
                        <li>Total de Colaboradores: <strong>${r.totalColaboradores}</strong></li>
                        <li>Total de Batidas Originais (Tipo 3): <strong>${r.totalMarcacoes}</strong></li>
                        <li>Total de Dias com Registro: <strong>${r.totalDiasComRegistro}</strong></li>
                        <li>Total de Linhas no AFD: <strong>${r.totalLinhas}</strong></li>
                        <li>Primeira Batida Registrada: <strong>${r.primeiraBatida || '—'}</strong></li>
                        <li>Última Batida Registrada: <strong>${r.ultimaBatida || '—'}</strong></li>
                    </ul>
                    <p style="font-size: 11px; color: #666; margin-top: 10px;">
                        Declara-se que os dados brutos contidos no arquivo AFD anexo são autênticos, inalterados e correspondem fielmente aos registros eletrônicos de frequência efetuados pelos empregados, devendo ser guardados pelo prazo prescricional de 5 (cinco) anos para fins de fiscalização trabalhista (Art. 74 da CLT).
                    </p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Colaborador</th>
                            <th>Tipo</th>
                            <th>PIS Registrado</th>
                            <th>CPF Registrado</th>
                            <th>Total de Batidas</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(dadosPreview.contagemPorFuncionario || []).map(f => `
                            <tr>
                                <td>${f.nome}</td>
                                <td>${f.tipo}</td>
                                <td>${f.pis || '—'}</td>
                                <td>${f.cpf || '—'}</td>
                                <td><strong>${f.totalBatidas}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="assinaturas">
                    <div class="linha-ass">
                        Responsável pelo Recursos Humanos / Gestão<br>
                        ${razaoSocial}
                    </div>
                    <div class="linha-ass">
                        Responsável Técnico / Contabilidade<br>
                        Data: ${new Date().toLocaleDateString('pt-BR')}
                    </div>
                </div>
            </body>
            </html>
        `;
        janela.document.write(conteudo);
        janela.document.close();
        setTimeout(() => {
            janela.print();
        }, 300);
    };

    // Filtro de colaboradores
    const funcsFiltrados = useMemo(() => {
        return funcionarios.filter(f => 
            f.nome.toLowerCase().includes(filtroFunc.toLowerCase()) ||
            (f.tipo && f.tipo.toLowerCase().includes(filtroFunc.toLowerCase()))
        );
    }, [funcionarios, filtroFunc]);

    const handleToggleAll = () => {
        if (selecionados.length === funcionarios.length) {
            setSelecionados([]);
        } else {
            setSelecionados(funcionarios.map(f => f.id));
        }
    };

    const handleToggleFunc = (id) => {
        setSelecionados(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16">
            {/* Header Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-brand-surface to-slate-950 border border-brand-border p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
                            <Archive size={14} className="animate-pulse" />
                            Encerramento & Transição de Ponto
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-brand-text tracking-tight">
                            Exportação de AFD <span className="text-brand-primary">(Arquivo Fonte de Dados)</span>
                        </h1>
                        <p className="text-brand-muted text-sm md:text-base max-w-2xl leading-relaxed">
                            Exporte todas as marcações originais brutas no padrão oficial do Ministério do Trabalho e Emprego 
                            (<strong>Portaria MTE 1.510/2009</strong> e <strong>Portaria MTP 671/2021</strong>) para migração para o novo software de ponto ou arquivamento legal obrigatório.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleGerarPreview}
                            disabled={loadingPreview}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-brand-primary text-white font-black text-xs uppercase tracking-wider hover:bg-brand-primary-hover active:scale-95 transition-all shadow-lg shadow-brand-primary/25 disabled:opacity-50 cursor-pointer"
                        >
                            {loadingPreview ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    Gerando Arquivo...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Processar & Pré-Visualizar
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Banner de Aviso de Conformidade Legal */}
                <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3.5 text-xs text-amber-300">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-400" />
                    <div>
                        <strong className="font-black text-amber-200">Atenção para Encerramento do Sistema:</strong> A legislação trabalhista exige a guarda do Arquivo Fonte de Dados (AFD) por no mínimo 5 (cinco) anos. Recomendamos selecionar a opção <strong>"Todo o Histórico"</strong> para gerar um arquivo consolidado completo e também baixar a <strong>Planilha CSV</strong> de backup.
                    </div>
                </div>
            </div>

            {/* Grid de Configurações Principais */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Card 1: Dados do Empregador & REP */}
                <div className="lg:col-span-2 bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-xl space-y-6">
                    <div className="flex items-center justify-between border-b border-brand-border pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                                <Building2 size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-brand-text">1. Dados da Empresa & Identificação do REP</h2>
                                <p className="text-xs text-brand-muted">Informações gravadas no Cabeçalho (Registro Tipo 1) do arquivo</p>
                            </div>
                        </div>

                        <button
                            onClick={handleSalvarConfigEmpresa}
                            disabled={salvandoConfig}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
                        >
                            <Save size={13} />
                            {salvandoConfig ? 'Salvando...' : 'Salvar Padrão'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-brand-muted uppercase">Tipo de Inscrição</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTipoIdentificador('1')}
                                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                        tipoIdentificador === '1'
                                            ? 'bg-brand-primary text-white border-brand-primary'
                                            : 'bg-brand-bg text-brand-muted border-brand-border hover:bg-slate-800'
                                    }`}
                                >
                                    CNPJ (Pessoa Jurídica)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTipoIdentificador('2')}
                                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                        tipoIdentificador === '2'
                                            ? 'bg-brand-primary text-white border-brand-primary'
                                            : 'bg-brand-bg text-brand-muted border-brand-border hover:bg-slate-800'
                                    }`}
                                >
                                    CPF (Pessoa Física)
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-brand-muted uppercase">
                                {tipoIdentificador === '1' ? 'Número do CNPJ' : 'Número do CPF'}
                            </label>
                            <input
                                type="text"
                                value={cnpjCpf}
                                onChange={(e) => setCnpjCpf(e.target.value)}
                                placeholder={tipoIdentificador === '1' ? '00.000.000/0001-00' : '000.000.000-00'}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-brand-text text-sm font-medium focus:outline-none focus:border-brand-primary"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-xs font-bold text-brand-muted uppercase">Razão Social / Nome do Empregador</label>
                            <input
                                type="text"
                                value={razaoSocial}
                                onChange={(e) => setRazaoSocial(e.target.value)}
                                placeholder="Nome completo da empresa"
                                maxLength={150}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-brand-text text-sm font-medium focus:outline-none focus:border-brand-primary"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-brand-muted uppercase">CEI / CAEPF / CNO (Opcional)</label>
                            <input
                                type="text"
                                value={cei}
                                onChange={(e) => setCei(e.target.value)}
                                placeholder="000000000000 (ou em branco)"
                                maxLength={12}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-brand-text text-sm font-medium focus:outline-none focus:border-brand-primary"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-brand-muted uppercase">Nº de Série / Fabricação REP</label>
                            <input
                                type="text"
                                value={numeroREP}
                                onChange={(e) => setNumeroREP(e.target.value)}
                                placeholder="00000000000000001 (17 dígitos)"
                                maxLength={17}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-brand-text text-sm font-medium focus:outline-none focus:border-brand-primary font-mono"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-brand-border grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-brand-muted uppercase">Padrão da Legislação MTE</label>
                            <select
                                value={padrao}
                                onChange={(e) => setPadrao(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-brand-text text-xs font-bold focus:outline-none focus:border-brand-primary"
                            >
                                <option value="1510">Portaria 1.510/2009 (Universal - Compatível com 100% dos Softwares)</option>
                                <option value="671">Portaria 671/2021 (REP-C com CPF dos Colaboradores)</option>
                            </select>
                            <p className="text-[11px] text-brand-muted">
                                {padrao === '1510' 
                                    ? 'Identifica batidas pelo PIS do colaborador (padrão aceito por Secullum, Senior, Dimep, Control iD).' 
                                    : 'Identifica batidas pelo CPF do colaborador (padrão atualizado MTE).'}
                            </p>
                        </div>

                        {padrao === '671' ? (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-brand-muted uppercase">Formato do CPF na Marcação (12 Dígitos)</label>
                                <select
                                    value={formatoCpf671}
                                    onChange={(e) => setFormatoCpf671(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-brand-text text-xs font-bold focus:outline-none focus:border-brand-primary"
                                >
                                    <option value="0">Zero + CPF (Ex: 012345678901)</option>
                                    <option value="9">Prefixo 9 + CPF (Art. 96 - Ex: 912345678901)</option>
                                </select>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 pt-6">
                                <label className="relative flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={incluirTipo5}
                                        onChange={(e) => setIncluirTipo5(e.target.checked)}
                                        className="w-4 h-4 rounded text-brand-primary border-slate-700 bg-brand-bg"
                                    />
                                    <span className="text-xs font-bold text-brand-text">Incluir Registros Tipo 5 (Cadastro de Empregados)</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Card 2: Filtro de Período */}
                <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-brand-border pb-4">
                            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-brand-text">2. Período das Batidas</h2>
                                <p className="text-xs text-brand-muted">Defina a janela de dados a exportar</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => setModoPeriodo('todos')}
                                className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                    modoPeriodo === 'todos'
                                        ? 'bg-brand-primary/10 border-brand-primary text-brand-text shadow-md'
                                        : 'bg-brand-bg border-brand-border text-brand-muted hover:bg-slate-800'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase">Todo o Histórico (Completo)</span>
                                    {modoPeriodo === 'todos' && <CheckCircle2 size={16} className="text-brand-primary" />}
                                </div>
                                <p className="text-[11px] text-brand-muted mt-1">Recomendado para encerramento: exporta todos os registros desde o primeiro dia do sistema.</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setModoPeriodo('mes_ano')}
                                className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                    modoPeriodo === 'mes_ano'
                                        ? 'bg-brand-primary/10 border-brand-primary text-brand-text shadow-md'
                                        : 'bg-brand-bg border-brand-border text-brand-muted hover:bg-slate-800'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase">Por Mês / Ano Específico</span>
                                    {modoPeriodo === 'mes_ano' && <CheckCircle2 size={16} className="text-brand-primary" />}
                                </div>
                                <p className="text-[11px] text-brand-muted mt-1">Exportar apenas as batidas de um mês fiscal selecionado.</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setModoPeriodo('custom')}
                                className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                    modoPeriodo === 'custom'
                                        ? 'bg-brand-primary/10 border-brand-primary text-brand-text shadow-md'
                                        : 'bg-brand-bg border-brand-border text-brand-muted hover:bg-slate-800'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase">Intervalo Personalizado</span>
                                    {modoPeriodo === 'custom' && <CheckCircle2 size={16} className="text-brand-primary" />}
                                </div>
                                <p className="text-[11px] text-brand-muted mt-1">Selecionar data de início e término exatas.</p>
                            </button>
                        </div>

                        {modoPeriodo === 'mes_ano' && (
                            <div className="grid grid-cols-2 gap-2 pt-2 animate-in fade-in">
                                <select
                                    value={mes}
                                    onChange={(e) => setMes(Number(e.target.value))}
                                    className="px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-brand-text text-xs font-bold"
                                >
                                    {MESES.map((m, idx) => (
                                        <option key={idx + 1} value={idx + 1}>{m}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    value={ano}
                                    onChange={(e) => setAno(Number(e.target.value))}
                                    className="px-3 py-2 rounded-xl bg-brand-bg border border-brand-border text-brand-text text-xs font-bold text-center"
                                />
                            </div>
                        )}

                        {modoPeriodo === 'custom' && (
                            <div className="grid grid-cols-2 gap-2 pt-2 animate-in fade-in">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-brand-muted">Início</label>
                                    <input
                                        type="date"
                                        value={dataInicio}
                                        onChange={(e) => setDataInicio(e.target.value)}
                                        className="w-full px-2.5 py-1.5 rounded-xl bg-brand-bg border border-brand-border text-brand-text text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-brand-muted">Fim</label>
                                    <input
                                        type="date"
                                        value={dataFim}
                                        onChange={(e) => setDataFim(e.target.value)}
                                        className="w-full px-2.5 py-1.5 rounded-xl bg-brand-bg border border-brand-border text-brand-text text-xs"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-brand-border text-center">
                        <span className="text-xs font-bold text-brand-muted">
                            {selecionados.length} de {funcionarios.length} colaboradores selecionados
                        </span>
                    </div>
                </div>
            </div>

            {/* Seção 3: Identificação dos Colaboradores (PIS / CPF) */}
            <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                            <Users size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-brand-text">3. Mapeamento de PIS / CPF dos Colaboradores</h2>
                            <p className="text-xs text-brand-muted">
                                O AFD exige que cada marcação de ponto contenha o PIS (Portaria 1510) ou CPF (Portaria 671) do trabalhador
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                            <input
                                type="text"
                                value={filtroFunc}
                                onChange={(e) => setFiltroFunc(e.target.value)}
                                placeholder="Filtrar por nome..."
                                className="pl-9 pr-3 py-1.5 rounded-xl bg-brand-bg border border-brand-border text-xs text-brand-text w-44 focus:w-56 transition-all"
                            />
                        </div>

                        <button
                            onClick={handleAutoPreencherPis}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer"
                        >
                            <Sparkles size={13} />
                            Preencher PIS Automático
                        </button>

                        <button
                            onClick={handleSalvarIdentificadoresBanco}
                            disabled={salvandoPis}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                        >
                            <Save size={13} />
                            {salvandoPis ? 'Salvando...' : 'Salvar no Banco'}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-72 border border-brand-border rounded-2xl">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-brand-bg text-brand-muted uppercase font-black sticky top-0 z-10 border-b border-brand-border">
                            <tr>
                                <th className="p-3 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selecionados.length === funcionarios.length && funcionarios.length > 0}
                                        onChange={handleToggleAll}
                                        className="rounded text-brand-primary"
                                    />
                                </th>
                                <th className="p-3">ID / Nome</th>
                                <th className="p-3">Tipo</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">PIS (11 dígitos)</th>
                                <th className="p-3">CPF (11 dígitos)</th>
                                <th className="p-3 text-center">Batidas no Banco</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border font-medium">
                            {funcsFiltrados.map((f) => {
                                const isSel = selecionados.includes(f.id);
                                const stats = dadosPreview?.contagemPorFuncionario?.find(c => c.id === f.id);
                                return (
                                    <tr key={f.id} className={`hover:bg-brand-surface/70 transition-colors ${!isSel ? 'opacity-40' : ''}`}>
                                        <td className="p-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isSel}
                                                onChange={() => handleToggleFunc(f.id)}
                                                className="rounded text-brand-primary"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <div className="font-bold text-brand-text">{f.nome}</div>
                                            <div className="text-[10px] text-brand-muted">Matrícula/ID: #{f.id}</div>
                                        </td>
                                        <td className="p-3 text-brand-muted">{f.tipo}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                f.ativo 
                                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                                                    : 'bg-red-500/15 text-red-400 border border-red-500/20'
                                            }`}>
                                                {f.ativo ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="text"
                                                value={mapeamentoPis[f.id] || ''}
                                                onChange={(e) => setMapeamentoPis({ ...mapeamentoPis, [f.id]: e.target.value })}
                                                placeholder={`0000000000${f.id}`}
                                                maxLength={12}
                                                className="px-2 py-1 rounded-lg bg-brand-bg border border-brand-border text-brand-text font-mono text-xs w-36 focus:border-brand-primary"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="text"
                                                value={mapeamentoCpf[f.id] || ''}
                                                onChange={(e) => setMapeamentoCpf({ ...mapeamentoCpf, [f.id]: e.target.value })}
                                                placeholder="000.000.000-00"
                                                maxLength={14}
                                                className="px-2 py-1 rounded-lg bg-brand-bg border border-brand-border text-brand-text font-mono text-xs w-36 focus:border-brand-primary"
                                            />
                                        </td>
                                        <td className="p-3 text-center font-bold text-brand-text">
                                            {stats ? (
                                                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200">
                                                    {stats.totalBatidas}
                                                </span>
                                            ) : (
                                                <span className="text-brand-muted">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Seção 4: Painel de Resultados & Prévia do AFD */}
            {dadosPreview && (
                <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-2xl space-y-6 animate-in slide-in-from-bottom-6 duration-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-brand-text">4. Arquivo AFD Gerado & Validação de Integridade</h2>
                                <p className="text-xs text-brand-muted">
                                    Arquivo pronto com totalizadores e formatação estrita CRLF
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={handleDownloadTxt}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
                            >
                                <Download size={16} />
                                Baixar Arquivo AFD (.txt)
                            </button>

                            <button
                                onClick={handleDownloadCsv}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer"
                            >
                                <FileSpreadsheet size={16} />
                                Baixar Planilha (.csv)
                            </button>

                            <button
                                onClick={handleImprimirTermo}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs uppercase tracking-wider transition-all border border-slate-700 cursor-pointer"
                            >
                                <Printer size={16} />
                                Termo Fiscal
                            </button>
                        </div>
                    </div>

                    {/* Cards de Métricas do AFD */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-brand-bg border border-brand-border">
                            <span className="text-[11px] font-black text-brand-muted uppercase">Total de Batidas (Tipo 3)</span>
                            <div className="text-2xl font-black text-brand-primary mt-1">
                                {dadosPreview.resumo.totalMarcacoes}
                            </div>
                            <span className="text-[10px] text-brand-muted">Marcações individuais</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-brand-bg border border-brand-border">
                            <span className="text-[11px] font-black text-brand-muted uppercase">Colaboradores no Arquivo</span>
                            <div className="text-2xl font-black text-emerald-400 mt-1">
                                {dadosPreview.resumo.totalColaboradores}
                            </div>
                            <span className="text-[10px] text-brand-muted">Com identificador legal</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-brand-bg border border-brand-border">
                            <span className="text-[11px] font-black text-brand-muted uppercase">Período Abrangido</span>
                            <div className="text-sm font-black text-amber-400 mt-2 truncate">
                                {dadosPreview.resumo.dataInicial?.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3')} a {dadosPreview.resumo.dataFinal?.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3')}
                            </div>
                            <span className="text-[10px] text-brand-muted">
                                {dadosPreview.resumo.totalDiasComRegistro} dias com registros
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-brand-bg border border-brand-border">
                            <span className="text-[11px] font-black text-brand-muted uppercase">Linhas Totais / NSR Final</span>
                            <div className="text-2xl font-black text-purple-400 mt-1 font-mono">
                                #{String(dadosPreview.resumo.totalLinhas).padStart(9, '0')}
                            </div>
                            <span className="text-[10px] text-brand-muted">Trailer Tipo 9 verificado</span>
                        </div>
                    </div>

                    {/* Visualização da Prévia em Fonte Monospace */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-brand-muted">
                            <span>
                                Visualização das Primeiras Linhas do Arquivo ({dadosPreview.previewLinhas?.length} de {dadosPreview.totalLinhasTotal} linhas):
                            </span>
                            <button
                                onClick={handleCopiarPreview}
                                className="inline-flex items-center gap-1.5 text-brand-primary hover:underline cursor-pointer"
                            >
                                {copiado ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                {copiado ? 'Copiado!' : 'Copiar Prévia'}
                            </button>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-emerald-400/90 overflow-x-auto max-h-60 leading-relaxed shadow-inner">
                            {dadosPreview.previewLinhas?.map((linha, index) => (
                                <div key={index} className="hover:bg-slate-900/60 px-1 py-0.5 rounded flex items-center gap-3">
                                    <span className="text-slate-600 select-none text-[10px] w-8 text-right font-sans">
                                        {index + 1}
                                    </span>
                                    <span className="whitespace-pre">
                                        {linha}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="text-[11px] text-brand-muted italic">
                            * O arquivo gerado utiliza quebra de linha padrão CRLF (\\r\\n) e codificação de caracteres exigida pelos validadores do MTE.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExportarAFD;
