const prisma = require("../db/prisma");
const fs = require("fs");
const path = require("path");

// Arquivo de configuração local para dados da empresa
const CONFIG_FILE = path.join(__dirname, "../../scratch/empresa_config.json");

function obterConfigEmpresaSalva() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, "utf-8");
            return JSON.parse(data);
        }
    } catch (e) {
        console.warn("[AFD] Erro ao ler configuração da empresa:", e.message);
    }
    return {
        tipoIdentificador: "1", // 1=CNPJ, 2=CPF
        cnpjCpf: "00000000000000",
        razaoSocial: "EMPRESA DE EXEMPLO LTDA",
        cei: "000000000000",
        numeroREP: "00000000000000001",
        padrao: "1510", // 1510 ou 671
        incluirTipo5: false,
        formatoCpf671: "0" // "0" = 0+CPF, "9" = 9+CPF
    };
}

function salvarConfigEmpresa(dados) {
    try {
        const dir = path.dirname(CONFIG_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(dados, null, 2), "utf-8");
    } catch (e) {
        console.warn("[AFD] Erro ao salvar configuração da empresa:", e.message);
    }
}

// Remove acentos e caracteres não ASCII para conformidade com a Portaria 1510/671
function normalizarTextoAscii(texto, maxLength = 150) {
    if (!texto) return "".padEnd(maxLength, " ");
    const limpo = texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .replace(/[^a-zA-Z0-9\s.,\-_]/g, "") // apenas caracteres válidos
        .toUpperCase()
        .trim();
    return limpo.substring(0, maxLength).padEnd(maxLength, " ");
}

function apenasDigitos(val) {
    if (!val) return "";
    return String(val).replace(/\D/g, "");
}

function padLeft(val, len, char = "0") {
    const s = String(val || "");
    return s.padStart(len, char).substring(0, len);
}

function padRight(val, len, char = " ") {
    const s = String(val || "");
    return s.padEnd(len, char).substring(0, len);
}

function formatarDataDDMMAAAA(dataObj) {
    if (!dataObj) return "00000000";
    if (dataObj instanceof Date) {
        const iso = dataObj.toISOString().split("T")[0];
        const [ano, mes, dia] = iso.split("-");
        return `${dia.padStart(2, "0")}${mes.padStart(2, "0")}${ano}`;
    }
    if (typeof dataObj === "string") {
        const clean = dataObj.split("T")[0];
        const parts = clean.split("-");
        if (parts.length === 3) {
            return `${parts[2].padStart(2, "0")}${parts[1].padStart(2, "0")}${parts[0]}`;
        }
    }
    return "00000000";
}

function extrairHoraHHMM(timeVal) {
    if (!timeVal) return null;
    if (typeof timeVal === "string") {
        const clean = timeVal.replace(/\D/g, "");
        if (clean.length >= 4) return clean.substring(0, 4);
    }
    if (timeVal instanceof Date) {
        const iso = timeVal.toISOString(); // 1970-01-01T08:30:00.000Z
        const hh = iso.substring(11, 13);
        const mm = iso.substring(14, 16);
        return `${hh}${mm}`;
    }
    return null;
}

function formatarPisParaAfd(pis, fallbackId) {
    const digitos = apenasDigitos(pis);
    if (digitos.length === 11) {
        // PIS padrão tem 11 dígitos -> no AFD preenche com 0 à esquerda para 12
        return `0${digitos}`;
    }
    if (digitos.length === 12) {
        return digitos;
    }
    if (digitos.length > 0) {
        return padLeft(digitos, 12, "0");
    }
    // Fallback se não informado: ID do funcionário com zeros à esquerda
    return padLeft(fallbackId, 12, "0");
}

function formatarCpfParaAfd(cpf, fallbackId, formatoCpf671 = "0") {
    const digitos = apenasDigitos(cpf);
    if (digitos.length === 11) {
        // Portaria 671 Art. 96: 12 posições, prefixo '0' ou '9'
        const prefix = formatoCpf671 === "9" ? "9" : "0";
        return `${prefix}${digitos}`;
    }
    if (digitos.length === 12) {
        return digitos;
    }
    if (digitos.length > 0) {
        return padLeft(digitos, 12, "0");
    }
    return padLeft(fallbackId, 12, "0");
}

/**
 * Consulta os registros do banco e converte em lista plana de batidas
 */
async function coletarDadosEBatidas({
    periodo = "todos",
    mes,
    ano,
    dataInicio,
    dataFim,
    funcionariosIds,
    padrao = "1510",
    formatoCpf671 = "0",
    mapeamentoPis = {},
    mapeamentoCpf = {}
}) {
    // 1. Filtrar funcionários
    const funcWhere = { ativo: true };
    if (funcionariosIds && Array.isArray(funcionariosIds) && funcionariosIds.length > 0) {
        funcWhere.id = { in: funcionariosIds.map(Number) };
    } else {
        // Se for "todos", inclui ativos e inativos para encerramento completo do sistema
        delete funcWhere.ativo;
    }

    const funcionarios = await prisma.funcionario.findMany({
        where: funcWhere,
        orderBy: { nome: "asc" }
    });

    const funcMap = new Map();
    funcionarios.forEach(f => {
        funcMap.set(f.id, f);
    });

    // 2. Construir filtro de datas para RegistroPonto
    const regWhere = {};
    if (funcionariosIds && Array.isArray(funcionariosIds) && funcionariosIds.length > 0) {
        regWhere.funcionarioId = { in: funcionariosIds.map(Number) };
    }

    if (periodo === "mes_ano" && mes && ano) {
        const m = parseInt(mes);
        const a = parseInt(ano);
        const inicioMes = new Date(Date.UTC(a, m - 1, 1));
        const fimMes = new Date(Date.UTC(a, m, 0, 23, 59, 59));
        regWhere.data = { gte: inicioMes, lte: fimMes };
    } else if (periodo === "custom" && dataInicio && dataFim) {
        const [aI, mI, dI] = dataInicio.split("-").map(Number);
        const [aF, mF, dF] = dataFim.split("-").map(Number);
        regWhere.data = {
            gte: new Date(Date.UTC(aI, mI - 1, dI)),
            lte: new Date(Date.UTC(aF, mF - 1, dF, 23, 59, 59))
        };
    }

    const registros = await prisma.registroPonto.findMany({
        where: regWhere,
        orderBy: [{ data: "asc" }, { funcionarioId: "asc" }]
    });

    // 3. Extrair cada batida individual
    const batidas = [];
    const diasComRegistroSet = new Set();
    const contagemPorFuncionario = {};

    funcionarios.forEach(f => {
        contagemPorFuncionario[f.id] = {
            id: f.id,
            nome: f.nome,
            tipo: f.tipo,
            pis: mapeamentoPis[f.id] || f.pis || "",
            cpf: mapeamentoCpf[f.id] || f.cpf || "",
            totalBatidas: 0
        };
    });

    for (const r of registros) {
        const func = funcMap.get(r.funcionarioId);
        if (!func) continue;

        const dataIso = r.data.toISOString().split("T")[0]; // YYYY-MM-DD
        diasComRegistroSet.add(dataIso);

        const camposHorario = [
            { tipo: "E1", val: r.e1, idx: 1 },
            { tipo: "S1", val: r.s1, idx: 2 },
            { tipo: "E2", val: r.e2, idx: 3 },
            { tipo: "S2", val: r.s2, idx: 4 },
            { tipo: "E3", val: r.e3, idx: 5 },
            { tipo: "S3", val: r.s3, idx: 6 }
        ];

        let prevMinutos = -1;
        let offsetDias = 0;

        for (const item of camposHorario) {
            const hhmm = extrairHoraHHMM(item.val);
            if (!hhmm) continue;

            const h = parseInt(hhmm.substring(0, 2), 10);
            const m = parseInt(hhmm.substring(2, 4), 10);
            const currMinutos = h * 60 + m;

            // Se o horário for menor que o anterior, virou a noite (troca de data calendário)
            if (prevMinutos !== -1 && currMinutos < prevMinutos) {
                offsetDias += 1;
            }
            prevMinutos = currMinutos;

            // Data real da batida
            const [anoRef, mesRef, diaRef] = dataIso.split("-").map(Number);
            const dataReal = new Date(Date.UTC(anoRef, mesRef - 1, diaRef + offsetDias));
            const dataRealIso = dataReal.toISOString().split("T")[0];
            const dataDDMMAAAA = formatarDataDDMMAAAA(dataReal);

            // Identificador do colaborador
            const pisFinal = mapeamentoPis[func.id] || func.pis || "";
            const cpfFinal = mapeamentoCpf[func.id] || func.cpf || "";

            let identificador;
            if (padrao === "671") {
                identificador = formatarCpfParaAfd(cpfFinal, func.id, formatoCpf671);
            } else {
                identificador = formatarPisParaAfd(pisFinal, func.id);
            }

            batidas.push({
                funcionarioId: func.id,
                funcionarioNome: func.nome,
                funcionarioTipo: func.tipo,
                pisOriginal: pisFinal,
                cpfOriginal: cpfFinal,
                identificadorAfd: identificador,
                dataIso: dataRealIso,
                dataDDMMAAAA: dataDDMMAAAA,
                horaHHMM: hhmm,
                horaFormatada: `${hhmm.substring(0, 2)}:${hhmm.substring(2, 4)}`,
                timestampStr: `${dataRealIso}T${hhmm.substring(0, 2)}:${hhmm.substring(2, 4)}:00`,
                tipoBatida: item.tipo,
                evento: r.evento || null,
                punchIndex: item.idx
            });

            if (contagemPorFuncionario[func.id]) {
                contagemPorFuncionario[func.id].totalBatidas += 1;
            }
        }
    }

    // 4. Ordenar rigorosamente todas as batidas em ordem cronológica
    batidas.sort((a, b) => {
        if (a.timestampStr !== b.timestampStr) {
            return a.timestampStr.localeCompare(b.timestampStr);
        }
        if (a.funcionarioId !== b.funcionarioId) {
            return a.funcionarioId - b.funcionarioId;
        }
        return a.punchIndex - b.punchIndex;
    });

    return {
        funcionarios,
        batidas,
        totalDiasComRegistro: diasComRegistroSet.size,
        contagemPorFuncionario: Object.values(contagemPorFuncionario)
    };
}

/**
 * Constrói o texto oficial do AFD conforme Portaria 1510/2009 ou Portaria 671/2021
 */
function gerarArquivoAfdTexto({
    batidas,
    funcionarios,
    tipoIdentificador = "1", // 1=CNPJ, 2=CPF
    cnpjCpf = "00000000000000",
    razaoSocial = "EMPRESA DE EXEMPLO LTDA",
    cei = "000000000000",
    numeroREP = "00000000000000001",
    incluirTipo5 = false,
    padrao = "1510",
    formatoCpf671 = "0",
    mapeamentoPis = {}
}) {
    const CRLF = "\r\n";
    const linhas = [];

    // Calcular datas limites do arquivo
    let dataInicial = formatarDataDDMMAAAA(new Date());
    let dataFinal = dataInicial;

    if (batidas.length > 0) {
        dataInicial = batidas[0].dataDDMMAAAA;
        dataFinal = batidas[batidas.length - 1].dataDDMMAAAA;
    }

    const agora = new Date();
    const dataGeracao = formatarDataDDMMAAAA(agora);
    const horaGeracao = agora.toTimeString().substring(0, 5).replace(":", ""); // HHMM

    // 1. Registro Tipo 1 - Cabeçalho
    // 001-009: 000000000 (9)
    // 010-010: 1 (1)
    // 011-011: 1=CNPJ / 2=CPF (1)
    // 012-025: CNPJ/CPF (14)
    // 026-037: CEI (12)
    // 038-187: Razão Social (150)
    // 188-204: Número Fabricação REP (17)
    // 205-212: Data Inicial (8)
    // 213-220: Data Final (8)
    // 221-228: Data Geração (8)
    // 229-232: Hora Geração (4)
    const numCnpjCpf = padLeft(apenasDigitos(cnpjCpf), 14, "0");
    const numCei = padLeft(apenasDigitos(cei), 12, "0");
    const nomeEmpresa = normalizarTextoAscii(razaoSocial, 150);
    const repNum = padRight(apenasDigitos(numeroREP) || "00000000000000001", 17, "0");
    const tipoId = tipoIdentificador === "2" ? "2" : "1";

    const linha1 = `0000000001${tipoId}${numCnpjCpf}${numCei}${nomeEmpresa}${repNum}${dataInicial}${dataFinal}${dataGeracao}${horaGeracao}`;
    linhas.push(linha1);

    let nsrAtual = 1;
    let qtdTipo5 = 0;

    // 2. Registros Tipo 5 - Cadastro de Empregados (opcional)
    if (incluirTipo5 && funcionarios && funcionarios.length > 0) {
        for (const f of funcionarios) {
            const pisFinal = mapeamentoPis[f.id] || f.pis || "";
            const pis12 = formatarPisParaAfd(pisFinal, f.id);
            const nomeColab = normalizarTextoAscii(f.nome, 52);
            const nsrStr = padLeft(nsrAtual, 9, "0");

            // 001-009: NSR (9)
            // 010-010: 5 (1)
            // 011-018: Data (8)
            // 019-022: Hora (4)
            // 023-023: Operação I (1)
            // 024-035: PIS (12)
            // 036-087: Nome (52)
            const linha5 = `${nsrStr}5${dataGeracao}${horaGeracao}I${pis12}${nomeColab}`;
            linhas.push(linha5);
            nsrAtual++;
            qtdTipo5++;
        }
    }

    // 3. Registros Tipo 3 - Marcações de Ponto
    let qtdTipo3 = 0;
    for (const b of batidas) {
        const nsrStr = padLeft(nsrAtual, 9, "0");
        // 001-009: NSR (9)
        // 010-010: 3 (1)
        // 011-018: Data DDMMAAAA (8)
        // 019-022: Hora HHMM (4)
        // 023-034: Identificador PIS/CPF (12)
        const linha3 = `${nsrStr}3${b.dataDDMMAAAA}${b.horaHHMM}${b.identificadorAfd}`;
        linhas.push(linha3);
        nsrAtual++;
        qtdTipo3++;
    }

    // 4. Registro Tipo 9 - Trailer
    // 001-009: 999999999 (9)
    // 010-018: Qtd Tipo 2 (9)
    // 019-027: Qtd Tipo 3 (9)
    // 028-036: Qtd Tipo 4 (9)
    // 037-045: Qtd Tipo 5 (9)
    const qtdTipo2Str = "000000000";
    const qtdTipo3Str = padLeft(qtdTipo3, 9, "0");
    const qtdTipo4Str = "000000000";
    const qtdTipo5Str = padLeft(qtdTipo5, 9, "0");

    const linha9 = `999999999${qtdTipo2Str}${qtdTipo3Str}${qtdTipo4Str}${qtdTipo5Str}`;
    linhas.push(linha9);

    // Unir com CRLF obrigatório da norma
    return {
        conteudoTexto: linhas.join(CRLF) + CRLF,
        linhas,
        totalLinhas: linhas.length,
        qtdTipo3,
        qtdTipo5,
        dataInicial,
        dataFinal,
        dataGeracao,
        horaGeracao
    };
}

/**
 * Constrói o arquivo CSV detalhado de encerramento
 */
function gerarArquivoCsvEncerramento(batidas) {
    const BOM = "\uFEFF"; // Garante abertura correta de acentos no Excel
    const header = "NSR;DATA;HORA;DIA_SEMANA;TIPO_BATIDA;ID_COLABORADOR;NOME_COLABORADOR;TIPO_COLABORADOR;PIS;CPF;IDENTIFICADOR_AFD;EVENTO\r\n";
    
    const diasSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

    const linhas = batidas.map((b, idx) => {
        const nsr = idx + 1;
        const [a, m, d] = b.dataIso.split("-").map(Number);
        const dataObj = new Date(a, m - 1, d);
        const diaSemana = diasSemana[dataObj.getDay()] || "";

        return [
            nsr,
            `"${b.dataDDMMAAAA.substring(0, 2)}/${b.dataDDMMAAAA.substring(2, 4)}/${b.dataDDMMAAAA.substring(4)}"`,
            `"${b.horaFormatada}"`,
            `"${diaSemana}"`,
            `"${b.tipoBatida}"`,
            b.funcionarioId,
            `"${b.funcionarioNome.replace(/"/g, '""')}"`,
            `"${b.funcionarioTipo}"`,
            `"${b.pisOriginal || ""}"`,
            `"${b.cpfOriginal || ""}"`,
            `"${b.identificadorAfd}"`,
            `"${b.evento || ""}"`
        ].join(";");
    });

    return BOM + header + linhas.join("\r\n");
}

// ── Controladores de Rota ──────────────────────────────────────────────────

// Retorna dados salvos da empresa
async function obterConfigEmpresa(req, res) {
    try {
        const config = obterConfigEmpresaSalva();
        res.json(config);
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
}

// Salva dados da empresa
async function salvarConfigEmpresaHandler(req, res) {
    try {
        salvarConfigEmpresa(req.body);
        res.json({ sucesso: true, mensagem: "Configurações da empresa salvas com sucesso!" });
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
}

// Salva PIS e CPF em lote diretamente no banco de dados para os funcionários
async function salvarIdentificadoresLote(req, res) {
    try {
        const { colaboradores } = req.body; // array [{ id, pis, cpf }]
        if (!colaboradores || !Array.isArray(colaboradores)) {
            return res.status(400).json({ erro: "Lista de colaboradores inválida." });
        }

        let atualizados = 0;
        for (const c of colaboradores) {
            if (c.id) {
                await prisma.funcionario.update({
                    where: { id: parseInt(c.id) },
                    data: {
                        ...(c.pis !== undefined && { pis: c.pis ? String(c.pis).trim() : null }),
                        ...(c.cpf !== undefined && { cpf: c.cpf ? String(c.cpf).trim() : null })
                    }
                });
                atualizados++;
            }
        }

        res.json({ sucesso: true, atualizados, mensagem: `${atualizados} colaboradores atualizados no banco com sucesso.` });
    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
}

// Gera Preview do AFD (contagens, primeiras 30 linhas, estatísticas)
async function previewAfd(req, res) {
    try {
        const {
            periodo = "todos",
            mes,
            ano,
            dataInicio,
            dataFim,
            funcionariosIds,
            padrao = "1510",
            formatoCpf671 = "0",
            tipoIdentificador = "1",
            cnpjCpf = "00000000000000",
            razaoSocial = "EMPRESA DE EXEMPLO LTDA",
            cei = "000000000000",
            numeroREP = "00000000000000001",
            incluirTipo5 = false,
            mapeamentoPis = {},
            mapeamentoCpf = {}
        } = req.body;

        const {
            funcionarios,
            batidas,
            totalDiasComRegistro,
            contagemPorFuncionario
        } = await coletarDadosEBatidas({
            periodo,
            mes,
            ano,
            dataInicio,
            dataFim,
            funcionariosIds,
            padrao,
            formatoCpf671,
            mapeamentoPis,
            mapeamentoCpf
        });

        const resultadoAfd = gerarArquivoAfdTexto({
            batidas,
            funcionarios,
            tipoIdentificador,
            cnpjCpf,
            razaoSocial,
            cei,
            numeroREP,
            incluirTipo5,
            padrao,
            formatoCpf671,
            mapeamentoPis
        });

        const cnpjClean = apenasDigitos(cnpjCpf) || "00000000000000";
        const nomeArquivo = `AFD_${cnpjClean}_${resultadoAfd.dataInicial}_${resultadoAfd.dataFinal}.txt`;

        res.json({
            sucesso: true,
            resumo: {
                totalColaboradores: funcionarios.length,
                totalDiasComRegistro,
                totalMarcacoes: batidas.length,
                dataInicial: resultadoAfd.dataInicial,
                dataFinal: resultadoAfd.dataFinal,
                primeiraBatida: batidas.length > 0 ? `${batidas[0].dataIso} ${batidas[0].horaFormatada}` : null,
                ultimaBatida: batidas.length > 0 ? `${batidas[batidas.length - 1].dataIso} ${batidas[batidas.length - 1].horaFormatada}` : null,
                totalLinhas: resultadoAfd.totalLinhas,
                qtdTipo3: resultadoAfd.qtdTipo3,
                qtdTipo5: resultadoAfd.qtdTipo5,
                nomeArquivoSugerido: nomeArquivo
            },
            contagemPorFuncionario,
            previewLinhas: resultadoAfd.linhas.slice(0, 35),
            totalLinhasTotal: resultadoAfd.linhas.length
        });
    } catch (e) {
        console.error("[AFD] Erro ao gerar preview:", e);
        res.status(500).json({ erro: e.message });
    }
}

// Download do arquivo AFD (.txt)
async function downloadAfdTxt(req, res) {
    try {
        const {
            periodo = "todos",
            mes,
            ano,
            dataInicio,
            dataFim,
            funcionariosIds,
            padrao = "1510",
            formatoCpf671 = "0",
            tipoIdentificador = "1",
            cnpjCpf = "00000000000000",
            razaoSocial = "EMPRESA DE EXEMPLO LTDA",
            cei = "000000000000",
            numeroREP = "00000000000000001",
            incluirTipo5 = false,
            mapeamentoPis = {},
            mapeamentoCpf = {}
        } = req.body;

        const {
            funcionarios,
            batidas
        } = await coletarDadosEBatidas({
            periodo,
            mes,
            ano,
            dataInicio,
            dataFim,
            funcionariosIds,
            padrao,
            formatoCpf671,
            mapeamentoPis,
            mapeamentoCpf
        });

        const resultadoAfd = gerarArquivoAfdTexto({
            batidas,
            funcionarios,
            tipoIdentificador,
            cnpjCpf,
            razaoSocial,
            cei,
            numeroREP,
            incluirTipo5,
            padrao,
            formatoCpf671,
            mapeamentoPis
        });

        const cnpjClean = apenasDigitos(cnpjCpf) || "00000000000000";
        const nomeArquivo = `AFD_${cnpjClean}_${resultadoAfd.dataInicial}_${resultadoAfd.dataFinal}.txt`;

        res.setHeader("Content-Type", "text/plain; charset=iso-8859-1");
        res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
        // Usamos buffer em latin1 / binary para garantir conformidade estrita com a norma
        return res.send(Buffer.from(resultadoAfd.conteudoTexto, "latin1"));
    } catch (e) {
        console.error("[AFD] Erro ao exportar AFD TXT:", e);
        res.status(500).json({ erro: e.message });
    }
}

// Download de Backup CSV de Encerramento
async function downloadBackupCsv(req, res) {
    try {
        const {
            periodo = "todos",
            mes,
            ano,
            dataInicio,
            dataFim,
            funcionariosIds,
            padrao = "1510",
            formatoCpf671 = "0",
            cnpjCpf = "00000000000000",
            mapeamentoPis = {},
            mapeamentoCpf = {}
        } = req.body;

        const {
            batidas
        } = await coletarDadosEBatidas({
            periodo,
            mes,
            ano,
            dataInicio,
            dataFim,
            funcionariosIds,
            padrao,
            formatoCpf671,
            mapeamentoPis,
            mapeamentoCpf
        });

        const csvContent = gerarArquivoCsvEncerramento(batidas);
        const cnpjClean = apenasDigitos(cnpjCpf) || "00000000000000";
        const nomeArquivo = `BACKUP_PONTO_${cnpjClean}_${Date.now()}.csv`;

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
        return res.send(csvContent);
    } catch (e) {
        console.error("[AFD] Erro ao exportar CSV:", e);
        res.status(500).json({ erro: e.message });
    }
}

module.exports = {
    obterConfigEmpresa,
    salvarConfigEmpresaHandler,
    salvarIdentificadoresLote,
    previewAfd,
    downloadAfdTxt,
    downloadBackupCsv,
    gerarArquivoAfdTexto,
    gerarArquivoCsvEncerramento
};
