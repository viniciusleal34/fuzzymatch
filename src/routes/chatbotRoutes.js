const express = require('express');
const axios = require('axios');
const natural = require('natural');
const router = express.Router();

// Configurações do Azure DevOps
const AZURE_DEVOPS_CONFIG = {
    organization: '',
    personalAccessToken: '',
    apiVersion: ''
};

// Palavras de parada em português (stopwords)
const STOPWORDS_PT = [
    'como', 'o', 'que', 'é', 'de', 'do', 'da', 'dos', 'das', 'um', 'uma', 'uns', 'umas',
    'para', 'por', 'com', 'em', 'no', 'na', 'nos', 'nas', 'ao', 'à', 'aos', 'às',
    'se', 'os', 'as', 'ou', 'e', 'mas', 'mais', 'menos', 'muito', 'muita', 'muitos', 'muitas',
    'todo', 'toda', 'todos', 'todas', 'outro', 'outra', 'outros', 'outras', 'qual', 'quais',
    'quando', 'onde', 'porque', 'por que', 'porquê', 'quem', 'quanto', 'quantos', 'quanta', 'quantas',
    'funciona', 'funcionar', 'trabalha', 'trabalhar', 'opera', 'operar', 'são', 'estão', 'foi', 'foram',
    'ser', 'estar', 'ter', 'fazer', 'dizer', 'ir', 'ver', 'dar', 'saber', 'poder', 'querer', 'ficar',
    'pela', 'pelo', 'suas', 'seus', 'nossa', 'nosso', 'nossas', 'nossos', 'sua', 'seu', 'minha',
    'meu', 'minhas', 'meus', 'essa', 'esse', 'essas', 'esses', 'esta', 'este', 'estas', 'estes',
    'isso', 'isto', 'aquela', 'aquele', 'aquelas', 'aqueles', 'aquilo'
];

// Estruturas de perguntas comuns em português
const QUESTION_PATTERNS = [
    /^(como|qual|quais|quando|onde|por\s*que|porque|quem|quanto|quantos|quantas|quanta)\s+/i,
    /\s+(funciona|funcionam|trabalha|trabalham|opera|operam|são|estão|é)\s*/i,
    /^(o\s+que|a\s+que|os\s+que|as\s+que)\s+/i,
    /\?$/
];

// Frases compostas comuns que devem ser mantidas juntas
const COMPOUND_PHRASES = [
    'cartão de crédito', 'cartão de débito', 'conta corrente', 'conta poupança',
    'internet banking', 'mobile banking', 'home broker', 'pix instantâneo',
    'transferência bancária', 'saque eletrônico', 'débito automático',
    'crédito consignado', 'financiamento imobiliário', 'seguro de vida',
    'previdência privada', 'renda fixa', 'renda variável', 'fundo de investimento',
    'tesouro direto', 'banco central', 'taxa selic', 'cdi taxa', 'ipca inflação',
    'pessoa física', 'pessoa jurídica', 'mei microempreendedor', 'código de barras',
    'qr code', 'chave pix', 'documento de identificação', 'comprovante de renda',
    'extrato bancário', 'limite de crédito', 'juros compostos'
];

// Função para extrair palavras-chave
function extractKeywords(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    let processedText = text.trim().toLowerCase();
    processedText = processedText.replace(/[?!.,;:]/g, '');

    QUESTION_PATTERNS.forEach(pattern => {
        processedText = processedText.replace(pattern, ' ');
    });

    const foundPhrases = [];
    let textWithPlaceholders = processedText;

    COMPOUND_PHRASES.forEach((phrase, index) => {
        if (textWithPlaceholders.includes(phrase)) {
            const placeholder = `__PHRASE_${index}__`;
            textWithPlaceholders = textWithPlaceholders.replace(new RegExp(phrase, 'g'), placeholder);
            foundPhrases.push({placeholder, phrase});
        }
    });

    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(textWithPlaceholders);

    if (!tokens) {
        return '';
    }

    const keywords = tokens.map(token => {
        const foundPhrase = foundPhrases.find(fp => fp.placeholder === token);
        if (foundPhrase) {
            return foundPhrase.phrase;
        }

        if (token.length > 2 &&
            !STOPWORDS_PT.includes(token.toLowerCase()) &&
            !token.match(/^\d+$/)) {
            return token;
        }

        return null;
    }).filter(token => token !== null);

    const uniqueKeywords = [...new Set(keywords)];

    if (uniqueKeywords.length === 0) {
        return text.replace(/[?!.,;:]/g, '').trim();
    }

    return uniqueKeywords.join(' ');
}

// Função para criar headers de autenticação
function getAuthHeaders() {
    const token = Buffer.from(`:${AZURE_DEVOPS_CONFIG.personalAccessToken}`).toString('base64');
    return {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json'
    };
}

// Função para buscar nas wikis do Azure DevOps
async function searchInAzureDevOps(processedTerm) {
    try {
        // Primeiro, obter todos os projetos
        const projectsUrl = `https://dev.azure.com/${AZURE_DEVOPS_CONFIG.organization}/_apis/projects?api-version=${AZURE_DEVOPS_CONFIG.apiVersion}`;
        const projectsResponse = await axios.get(projectsUrl, {headers: getAuthHeaders()});
        console.log(projectsResponse.data)
        const projects = projectsResponse.data.value;

        let allResults = [];

        // Buscar em cada projeto
        for (const project of projects) {
            // Obter wikis do projeto
            const wikisUrl = `https://dev.azure.com/${AZURE_DEVOPS_CONFIG.organization}/${project.id}/_apis/wiki/wikis?api-version=${AZURE_DEVOPS_CONFIG.apiVersion}`;
            const wikisResponse = await axios.get(wikisUrl, {headers: getAuthHeaders()});
            const wikis = wikisResponse.data.value;

            // Buscar em cada wiki
            for (const wiki of wikis) {
                // Obter páginas da wiki
                const pagesUrl = `https://dev.azure.com/${AZURE_DEVOPS_CONFIG.organization}/${project.id}/_apis/wiki/wikis/${wiki.id}/pages?recursionLevel=full&api-version=${AZURE_DEVOPS_CONFIG.apiVersion}`;
                const pagesResponse = await axios.get(pagesUrl, {headers: getAuthHeaders()});
                
                // Converter estrutura hierárquica em array plano
                const pages = [];
                flattenWikiPages(pagesResponse.data, pages);

                // Buscar nas páginas
                for (const page of pages) {
                    if (page.path.toLowerCase().includes(processedTerm.toLowerCase())) {
                        allResults.push({
                            project: project.name,
                            wiki: wiki.name,
                            page: page.path,
                            url: page.remoteUrl || `https://dev.azure.com/${AZURE_DEVOPS_CONFIG.organization}/${project.id}/_wiki/wikis/${wiki.id}?pagePath=${encodeURIComponent(page.path)}`
                        });
                    }
                }
            }
        }

        return allResults;
    } catch (error) {
        console.error('Erro ao buscar no Azure DevOps:', error);
        return [];
    }
}

// Função para converter estrutura hierárquica em array plano
function flattenWikiPages(pageNode, pagesArray) {
    if (pageNode.path && pageNode.path !== '/') {
        pagesArray.push({
            id: pageNode.id,
            path: pageNode.path,
            gitItemPath: pageNode.gitItemPath,
            url: pageNode.url,
            remoteUrl: pageNode.remoteUrl,
            isParentPage: pageNode.isParentPage,
            order: pageNode.order
        });
    }

    if (pageNode.subPages && Array.isArray(pageNode.subPages)) {
        for (const subPage of pageNode.subPages) {
            flattenWikiPages(subPage, pagesArray);
        }
    }
}

// Função para responder saudações
function responderSaudacaoOuDespedida(message) {
    const saudacoes = ['olá', 'oi', 'eae', 'bom dia', 'boa tarde', 'boa noite'];
    const despedidas = ['tchau', 'adeus', 'até mais', 'até logo'];

    if (saudacoes.some(s => message.includes(s))) {
        return 'Olá! Como posso te ajudar hoje?';
    }

    if (despedidas.some(d => message.includes(d))) {
        return 'Até logo! Se precisar de algo mais, estou aqui.';
    }

    return null;
}

// Função principal para processar perguntas
async function processaPergunta(pergunta) {
    // Verificar se é saudação/despedida
    const respostaSaudacao = responderSaudacaoOuDespedida(pergunta.toLowerCase());
    console.log(pergunta)
    if (respostaSaudacao) {
        return { tipo: 'resposta_direta', dados: { resposta: respostaSaudacao } };
    }

    // Processar a pergunta para extrair palavras-chave
    const processedTerm = extractKeywords(pergunta);
    console.log(processedTerm)
    // Buscar no Azure DevOps
    const results = await searchInAzureDevOps(processedTerm);
    console.log(results)
    if (results.length === 0) {
        return { tipo: 'nenhum', dados: [] };
    }

    if (results.length === 1) {
        return { 
            tipo: 'resposta_direta', 
            dados: { 
                pergunta: pergunta,
                resposta: `Encontrei esta informação que pode ajudar:\n\n📌 *${results[0].page}*\n🔗 [Abrir no Azure DevOps](${results[0].url})`
            } 
        };
    }

    // Se houver múltiplos resultados, retornar como opções
    return {
        tipo: 'perguntas_relacionadas',
        dados: results.slice(0, 5).map(r => r.page)
    };
}

// Rotas do chatbot
router.post('/chat', async (req, res) => {
    const event = req.body;
    
    if (event.type === 'CARD_CLICKED') {
        const resposta = event.common?.parameters?.botao;
        const payload = await processaPergunta(resposta);

        if (payload.tipo === 'resposta_direta') {
            return res.json({
                text: `👉 *${payload.dados.pergunta}*\n\n✅ ${payload.dados.resposta}\n\n❓ *Deseja saber mais alguma coisa?*`
            });
        }

        return res.json({
            text: `📝 Você escolheu: *${resposta}*`
        });
    }

    if (event.type === 'MESSAGE') {
        const message = event.message.text;
        const payload = await processaPergunta(message);

        if (payload.tipo === 'resposta_direta') {
            return res.json({
                text: `✅ ${payload.dados.resposta}\n\n💬 *Posso te ajudar com mais alguma coisa?*`
            });
        }

        if (payload.tipo === 'nenhum') {
            return res.json({
                text: `🤖 *Desculpe, não consegui entender sua pergunta.*\n\nTente reformular ou pergunte de outra forma.`
            });
        }

        if (payload.tipo === 'perguntas_relacionadas') {
            const botoes = payload.dados.map((pergunta) => ({
                text: `${pergunta}`,
                type: "FILLED",
                onClick: {
                    action: {
                        function: "botaoClicado",
                        parameters: [
                            {
                                key: "botao",
                                value: pergunta
                            }
                        ]
                    }
                }
            }));

            return res.json({
                cardsV2: [
                    {
                        cardId: "sugestoes-perguntas",
                        card: {
                            header: {
                                title: "🔍 Sugestões de Perguntas",
                                subtitle: "Clique em uma opção ou digite o número correspondente",
                                imageUrl: "https://developers.google.com/chat/images/quickstart-app-avatar.png",
                                imageType: "CIRCLE"
                            },
                            sections: [
                                {
                                    header: "Talvez você quis dizer:",
                                    widgets: [
                                        {
                                            buttonList: {
                                                buttons: botoes
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            });
        }
    }

    if (event.type === 'ADDED_TO_SPACE') {
        return res.json({
            text: `🤖 *Olá!* Fui adicionado aqui para te ajudar.\n\nDigite *ajuda* para ver o que posso fazer.`
        });
    }

    res.sendStatus(200);
});

module.exports = router;