const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse             = require("pdf-parse");
const xlsx                 = require("xlsx");
require("dotenv").config();

// Inicializa a IA na versão padrão configurada
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function extrairComIA(buffer, mimetype, mesAno) {
    // Apenas os modelos reportados como disponíveis
    const modelosPossiveis = [
        "gemini-2.5-flash",
        "gemini-2.0-flash"
    ];
    let ultimoErro = null;

    for (const MODELO of modelosPossiveis) {
        try {
            console.log(`>>> [IA] Tentando modelo: ${MODELO}...`);
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
            console.warn(`>>> [IA] Falha no ${MODELO}: ${e.message.substring(0, 100)}...`);
            ultimoErro = e;
            
            // Se for erro de cota (429), partimos para o próximo.
            if (e.message.includes("429")) {
                console.log(">>> [IA] Cota excedida no " + MODELO + ". Tentando próximo...");
            }
        }
    }
    throw ultimoErro;
}

function processarExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: "buffer" });
    return xlsx.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
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
            // Fallback para PDF/Excel
            const dataText = mimetype === "application/pdf" ? (await pdfParse(buffer)).text : processarExcel(buffer);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `Extraia JSON de folha de ponto deste texto. MÊS E ANO PADRÃO OBRIGATÓRIO: ${mesAno}\nTexto: ${dataText}`;
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            resultadoFinal = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
        }

        res.json(resultadoFinal);

    } catch (erro) {
        console.error("[importacao] Erro Final:", erro.message);
        res.status(500).json({ erro: "A IA não conseguiu processar esta folha: " + erro.message });
    }
}

module.exports = { importarFolha };
