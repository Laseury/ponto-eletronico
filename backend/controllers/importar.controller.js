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

let openaiClient;
try {
    const { OpenAI } = require("openai");
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch (e) {
    console.warn("[IA] OpenAI não configurado ou módulo ausente.");
}

// Inicializa a IA na versão padrão configurada
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function formatarDatas(mesAno, dadosObtidos) {
    if (mesAno && dadosObtidos && dadosObtidos.registros) {
        dadosObtidos.registros.forEach(r => {
            if (r.data) {
                // Pega apenas o número do dia (ex: "01", "2024-04-01", "Dia 1" -> tudo vira "01")
                const apenasNumeros = r.data.toString().replace(/\D/g, "");
                if (apenasNumeros) {
                    const dia = apenasNumeros.slice(-2).padStart(2, "0");
                    r.data = `${mesAno}-${dia}`;
                }
            }
        });
    }
    return dadosObtidos;
}

// Função auxiliar para esperar antes de retry
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function extrairComIA(buffer, mimetype, mesAno) {
    // Modelos que estão garantidos e liberados na cota gratuita do Google AI
    const modelosPossiveis = [
        "gemini-1.5-flash"
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

                return formatarDatas(mesAno, dadosObtidos);
            } catch (e) {
                console.warn(`>>> [IA] Falha no ${MODELO} (tentativa ${tentativa}): ${e.message}`);
                ultimoErro = e;
                
                if (e.message.includes("404")) {
                    console.log(`>>> [IA] O modelo ${MODELO} retornou 404. Coletando lista exata de modelos permitidos pela sua chave de API...`);
                    try {
                        const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + process.env.GEMINI_API_KEY);
                        const dados = await res.json();
                        if (dados.models) {
                            const nomes = dados.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")).map(m => m.name.replace("models/", ""));
                            console.log(">>> [IA] ✨ MODELOS PERMITIDOS NESTA CHAVE: ", nomes.join(", "));
                        } else {
                            console.log(">>> [IA] Retorno da API ao listar modelos:", dados);
                        }
                    } catch (err) {
                        console.log(">>> [IA] Falha ao listar modelos:", err.message);
                    }
                }

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

async function extrairComChatGPT(buffer, isImage, mesAno, promptText) {
    if (!openaiClient) throw new Error("A biblioteca de IA Alternativa (OpenAI) não está definida devido à falta do OPENAI_API_KEY no sistema.");
    
    // Modelos OpenAI (gpt-4o para visão, gpt-4o-mini para texto puro)
    const modelo = isImage ? "gpt-4o" : "gpt-4o-mini";

    console.log(`>>> [IA ChatGPT] Iniciando extração com ${modelo}...`);

    let output;
    try {
        if (isImage) {
            // Conversão para padrão URI que os modelos de chatCompletion de visão exigem
            const base64Image = `data:image/jpeg;base64,${buffer.toString("base64")}`;
            const comp = await openaiClient.chat.completions.create({
                model: modelo,
                messages: [{ role: "user", content: [{ type: "text", text: promptText }, { type: "image_url", image_url: { url: base64Image } }] }],
                max_tokens: 1500
            });
            output = comp.choices[0].message.content;
        } else {
            console.log(`>>> [IA ChatGPT] Lendo documento formato texto...`);
            const fallbackComp = await openaiClient.chat.completions.create({
                model: modelo,
                messages: [{ role: "user", content: promptText }],
                max_tokens: 1500
            });
            output = fallbackComp.choices[0].message.content;
        }

        console.log(`>>> [IA ChatGPT] SUCESSO com OpenAI!`);
        const jsonStr = output.replace(/```json/g, "").replace(/```/g, "").trim();
        const dadosObtidos = JSON.parse(jsonStr);

        return formatarDatas(mesAno, dadosObtidos);
    } catch (e) {
        console.error(">>> [IA ChatGPT] Falha na extração OpenAI:", e.message);
        throw e;
    }
}

async function importarFolha(req, res) {
    console.log(">>> [DEBUG] ROTA DE IMPORTAÇÃO ACESSADA! <<<");
    try {
        if (!req.file) return res.status(400).json({ erro: "Nenhum arquivo enviado." });

        let { mimetype, buffer, originalname } = req.file;
        const { funcionario_id, mesAno, provider } = req.body;
        const ext = (originalname || "").split(".").pop().toLowerCase();
        let resultadoFinal;

        const isImage = mimetype.startsWith("image/") || ["jpg", "jpeg", "png"].includes(ext);

        if (isImage && sharp) {
            try {
                // Otimização global (Ocorre tanto pro Gemini quanto Llama)
                console.log(">>> [IA] Otimizando imagem globalmente para leitura robusta...");
                buffer = await sharp(buffer)
                    .resize({ width: 2500, height: 2500, fit: 'inside', withoutEnlargement: true })
                    .grayscale()
                    .normalize()
                    .jpeg({ quality: 85 })
                    .toBuffer();
                mimetype = "image/jpeg";
            } catch(e) {
                console.warn(">>> [IA] Falha na otimização de imagem padrão. Seguindo com original:", e.message);
            }
        }

        if (isImage) {
            const prompt = `Analise esta foto de folha de ponto e extraia os horários. 
                REGRAS OBRIGATÓRIAS:
                1. Identifique o DIA do mês em cada linha.
                2. Ignore os cabeçalhos das colunas (Entrada, Saída, etc) onde os horários foram escritos, pois eles podem estar preenchidos nas colunas erradas.
                3. Para cada dia, pegue TODOS os horários encontrados, ORDENE-OS em cronologia crescente (menor para o maior) e então atribua nesta ordem:
                1º horário -> e1, 2º horário -> s1, 3º horário -> e2, 4º horário -> s2, 5º horário -> e3, 6º horário -> s3. 
                4. Retorne APENAS o JSON puro no formato: { "registros": [ { "data": "01", "e1": "08:00", "s1": "12:00"... }, ... ] }`;

            if (provider === "chatgpt") {
                resultadoFinal = await extrairComChatGPT(buffer, true, mesAno, prompt);
            } else {
                resultadoFinal = await extrairComIA(buffer, mimetype, mesAno);
            }
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

            const promptCompleto = `Analise os dados extraídos desta folha de ponto e retorne os registros em JSON.
            MÊS/ANO DE REFERÊNCIA: ${mesAno}
            
            Regras de extração:
            1. Formate a data como YYYY-MM-DD.
            2. Identifique os horários e coloque na ordem: e1, s1, e2, s2, e3, s3.
            3. Se for um evento (Férias, Feriado, Atestado, Falta, Declaração), coloque no campo 'evento'.
            4. Retorne APENAS o JSON puro.
            
            Texto extraído:
            ${dataText}`;

            if (provider === "chatgpt") {
                resultadoFinal = await extrairComChatGPT(null, false, mesAno, promptCompleto);
            } else {
                // Tenta múltiplos modelos com retry para PDF/XLSX também (apenas modelos com cota gratuita liberada)
                const modelosTexto = ["gemini-1.5-flash"];
                let textoObtido = null;

                for (const MODELO of modelosTexto) {
                    for (let tentativa = 1; tentativa <= 2; tentativa++) {
                        try {
                            console.log(`>>> [IA-Texto] Tentando ${MODELO} (tentativa ${tentativa}/2)...`);
                            const model = genAI.getGenerativeModel({ model: MODELO });
                            const result = await model.generateContent(promptCompleto);
                            textoObtido = result.response.text();
                            console.log(`>>> [IA-Texto] SUCESSO com: ${MODELO}`);
                            break;
                        } catch (e) {
                            console.warn(`>>> [IA-Texto] Falha no ${MODELO} (tentativa ${tentativa}): ${e.message}`);
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
                const tempDecoded = JSON.parse(jsonStr);
                resultadoFinal = formatarDatas(mesAno, tempDecoded);
            }
        }

        res.json(resultadoFinal);

    } catch (erro) {
        console.error("[importacao] Erro Final:", erro.message);
        res.status(500).json({ erro: "A IA não conseguiu processar esta folha: " + erro.message });
    }
}

module.exports = { importarFolha };
