const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse             = require("pdf-parse");
const xlsx                 = require("xlsx");
const prisma               = require("../db/prisma");
require("dotenv").config();

let sharp;
try {
    sharp = require("sharp");
} catch (e) {
    console.warn("[IA] Módulo Sharp não encontrado. As imagens não serão otimizadas.");
}

// Inicializa a IA na versão padrão configurada
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Função auxiliar para esperar antes de retry
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function extrairComIA(buffer, mimetype, mesAno) {
    if (sharp && mimetype.startsWith("image/")) {
        try {
            console.log(">>> [IA] Otimizando imagem para melhorar a leitura...");
            buffer = await sharp(buffer)
                .resize({ width: 2500, height: 2500, fit: 'inside', withoutEnlargement: true })
                .grayscale() // Processa em preto e branco
                .normalize() // Ajusta o contraste
                .jpeg({ quality: 85 }) // Converte para um formato unificado
                .toBuffer();
            mimetype = "image/jpeg";
        } catch (e) {
            console.warn(">>> [IA] Falha ao otimizar imagem, usando formato original:", e.message);
        }
    }

    // Modelos em ordem de preferência (inclui lite como fallback extra)
    const modelosPossiveis = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-2.0-flash-lite"
    ];
    let ultimoErro = null;
    const MAX_RETRIES = 2; // Tentativas por modelo antes de pular

    for (const MODELO of modelosPossiveis) {
        for (let tentativa = 1; tentativa <= MAX_RETRIES; tentativa++) {
            try {
                console.log(`>>> [IA] Tentando modelo: ${MODELO} (tentativa ${tentativa}/${MAX_RETRIES})...`);
                const model = genAI.getGenerativeModel({ model: MODELO });
                
                const imgData = {
                    inlineData: { data: buffer.toString("base64"), mimeType: mimetype },
                };

                const prompt = `Analise esta foto de folha de ponto e extraia os horários. 
                MUITO IMPORTANTE: Ignore os cabeçalhos das colunas (Entrada, Saída, etc) onde os horários foram escritos, pois eles podem estar preenchidos nas colunas erradas.
                Para cada dia, pegue TODOS os horários encontrados, ORDENE-OS em cronologia crescente (menor para o maior) e então atribua rigidamente nesta ordem:
                1º horário -> e1
                2º horário -> s1
                3º horário -> e2
                4º horário -> s2
                5º horário -> e3
                6º horário -> s3
                
                Retorne APENAS um JSON puro (sem markdown) com este formato: 
                {"registros": [{"data": "YYYY-MM-DD", "e1": "HH:MM", "s1": "HH:MM", "e2": "HH:MM", "s2": "HH:MM", "e3": null, "s3": null, "evento": null}]}`;
                
                const result = await model.generateContent([prompt, imgData]);
                const response = await result.response;
                const text = response.text();
                
                console.log(`>>> [IA] SUCESSO com: ${MODELO}`);
                const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
                const dadosObtidos = JSON.parse(jsonStr);

                // Subscrição NATIVA do Mês/Ano via Javascript (Garante que a escolha manual do usuário funcione sempre)
                if (mesAno && dadosObtidos.registros) {
                    dadosObtidos.registros.forEach(r => {
                        if (r.data) {
                            const dia = r.data.split("-").pop().padStart(2, "0"); // Pega o número do dia extraído
                            r.data = `${mesAno}-${dia}`; // Concatena com o mês/ano que o usuário escolheu
                        }
                    });
                }

                return dadosObtidos;
            } catch (e) {
                console.warn(`>>> [IA] Falha no ${MODELO} (tentativa ${tentativa}): ${e.message.substring(0, 120)}...`);
                ultimoErro = e;
                
                // Tenta novamente se for erro de cota (429) ou erro de servidor (500, 502, 503, 504)
                if (e.message.match(/429|500|502|503|504/)) {
                    if (tentativa < MAX_RETRIES) {
                        const tempoEspera = 5000 * tentativa; // 5s, 10s...
                        console.log(`>>> [IA] Erro temporário no ${MODELO}. Aguardando ${tempoEspera/1000}s antes de tentar novamente...`);
                        await delay(tempoEspera);
                    } else {
                        console.log(`>>> [IA] Erro persistente no ${MODELO} após ${MAX_RETRIES} tentativas. Tentando próximo modelo...`);
                    }
                } else {
                    // Para outros erros (ex: 404, 400), pula direto para o próximo modelo
                    break;
                }
            }
        }
    }
    throw ultimoErro;
}

function processarExcel(buffer, nomeFuncionario) {
    const workbook = xlsx.read(buffer, { type: "buffer" });
    
    // Busca aba que contém o nome do funcionário (case-insensitive)
    const targetSheet = workbook.SheetNames.find(name => 
        name.toLowerCase().includes(nomeFuncionario.toLowerCase())
    );

    if (!targetSheet) {
        throw new Error(`Aba para o funcionário "${nomeFuncionario}" não encontrada no Excel.`);
    }

    console.log(`>>> [XLSX] Processando aba encontrada: ${targetSheet}`);
    return xlsx.utils.sheet_to_csv(workbook.Sheets[targetSheet]);
}

async function importarFolha(req, res) {
    console.log(">>> [DEBUG] ROTA DE IMPORTAÇÃO ACESSADA! <<<");
    try {
        if (!req.file) return res.status(400).json({ erro: "Nenhum arquivo enviado." });

        const { mimetype, buffer, originalname } = req.file;
        const { funcionario_id, mesAno } = req.body;
        const ext = (originalname || "").split(".").pop().toLowerCase();

        let resultadoFinal;

        if (mimetype.startsWith("image/") || ["jpg", "jpeg", "png"].includes(ext)) {
            resultadoFinal = await extrairComIA(buffer, mimetype, mesAno);
        } else {
            // Busca nome do funcionário no Banco
            const func = await prisma.funcionario.findUnique({
                where: { id: parseInt(funcionario_id) },
                select: { nome: true }
            });

            if (!func) return res.status(404).json({ erro: "Funcionário não encontrado no sistema." });

            const dataText = mimetype === "application/pdf" 
                ? (await pdfParse(buffer)).text 
                : processarExcel(buffer, func.nome);

            const prompt = `Analise os dados extraídos desta folha de ponto e retorne os registros em JSON.
            MÊS/ANO DE REFERÊNCIA: ${mesAno}
            
            Regras de extração:
            1. Formate a data como YYYY-MM-DD.
            2. Identifique os horários e coloque na ordem: e1, s1, e2, s2, e3, s3.
            3. Se for um evento (Férias, Feriado, Atestado, Falta), coloque no campo 'evento'.
            4. Retorne APENAS o JSON puro.
            
            Texto extraído:
            ${dataText}`;

            // Tenta múltiplos modelos com retry para PDF/XLSX também
            const modelosTexto = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite"];
            let textoObtido = null;

            for (const MODELO of modelosTexto) {
                for (let tentativa = 1; tentativa <= 2; tentativa++) {
                    try {
                        console.log(`>>> [IA-Texto] Tentando ${MODELO} (tentativa ${tentativa}/2)...`);
                        const model = genAI.getGenerativeModel({ model: MODELO });
                        const result = await model.generateContent(prompt);
                        textoObtido = result.response.text();
                        console.log(`>>> [IA-Texto] SUCESSO com: ${MODELO}`);
                        break;
                    } catch (e) {
                        console.warn(`>>> [IA-Texto] Falha no ${MODELO} (tentativa ${tentativa}): ${e.message.substring(0, 120)}...`);
                        if (e.message.match(/429|500|502|503|504/) && tentativa < 2) {
                            console.log(`>>> [IA-Texto] Aguardando ${5 * tentativa}s antes de retry...`);
                            await delay(5000 * tentativa);
                        } else if (!e.message.match(/429|500|502|503|504/)) {
                            break; // Outro erro, pula modelo
                        }
                    }
                }
                if (textoObtido) break;
            }

            if (!textoObtido) throw new Error("Todos os modelos de IA falharam ao processar o documento.");

            const jsonStr = textoObtido.replace(/```json/g, "").replace(/```/g, "").trim();
            resultadoFinal = JSON.parse(jsonStr);

            // Garantir datas corretas se a IA falhar na concatenação do ano
            if (mesAno && resultadoFinal.registros) {
                resultadoFinal.registros.forEach(r => {
                    if (r.data && r.data.includes("-")) {
                        const parts = r.data.split("-");
                        const dia = parts.pop().padStart(2, "0");
                        r.data = `${mesAno}-${dia}`;
                    }
                });
            }
        }

        res.json(resultadoFinal);

    } catch (erro) {
        console.error("[importacao] Erro Final:", erro.message);
        res.status(500).json({ erro: "A IA não conseguiu processar esta folha: " + erro.message });
    }
}

module.exports = { importarFolha };
