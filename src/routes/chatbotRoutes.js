const express = require('express');
const router = express.Router();
const { processaPergunta } = require('../services/planilhaService');
const { responderSaudacaoOuDespedida } = require('../utils/saudacoes');

const axios = require('axios')

async function gerarResumoGemini(texto, tentativas = 3) {
  console.log(texto)
  const apiKey = 'AIzaSyAz0ESTmkalngim7ekrUnxjHF0w0XVvJBk';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
  const prompt = `Resuma o texto e formate para o google chat, se for tabela faça uma estrutura de tabela ${texto}`
  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  };

  for (let i = 0; i < tentativas; i++) {
    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey
        }
      });

      const result = response.data.candidates[0].content.parts[0].text;
      return result;

    } catch (err) {
      const status = err.response?.status;
      const isOverloaded = err.response?.data?.error?.status === 'UNAVAILABLE';

      if (status === 503 || isOverloaded) {
        console.warn(`Tentativa ${i + 1}: Gemini sobrecarregado. Retentando em 2 segundos...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.error('Erro ao chamar Gemini:', err.response?.data || err.message);
        return '⚠️ Erro ao gerar resumo com Gemini.';
      }
    }
  }

  return '⚠️ O serviço do Gemini está sobrecarregado. Tente novamente mais tarde.';
}
async function resumirResultados(resultados) {
  const resumos = await Promise.all(
    resultados.map(async (item) => {
      const contexto = item.context || 'Sem contexto disponível';
      const titulo = item.pagePath;
      const url = item.url;

    

      return {
        titulo,
        resumo,
        url
      };
    })
  );

  return resumos;
}

router.post('/chat', async (req, res) => {
  const event = req.body;

  if (event.type === 'CARD_CLICKED') {
    const resposta = event.common?.parameters?.botao;

    const resumo=  await gerarResumoGemini(resposta);

    return res.json({
      text: `${resumo}`
    });
  }
  if (event.type === 'MESSAGE') {
    const message = event.message.text.toLowerCase();
    const respostaSaudacao = responderSaudacaoOuDespedida(message);
    const searchResponse = await axios.post('http://129.148.17.147:3000/search', {
      searchTerm: message,
      projectFilter: []
    });
    const resultados = await searchResponse.data.results;

    console.log(resultados)
    const botoes = resultados.map((pergunta, index) => ({
      text: pergunta.pageTitle,
      type: "FILLED",
      onClick: {
        action: {
          function: "botaoClicado",
          parameters: [
            {
              key: "botao",
              value: pergunta.context
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
    return res.json({
      text: `🤖 *Desculpe, não consegui entender sua pergunta.*\n\nTente reformular ou pergunte de outra forma.`
    });
    if (respostaSaudacao) {
      return res.json({ text: respostaSaudacao });
    }

    if (payloud.tipo === 'resposta_direta') {
      return res.json({
        text: `✅ ${payloud.dados.resposta}\n\n💬 *Posso te ajudar com mais alguma coisa?*`
      });
    }

    if (payloud.tipo === 'nenhum') {
      return res.json({
        text: `🤖 *Desculpe, não consegui entender sua pergunta.*\n\nTente reformular ou pergunte de outra forma.`
      });
    }

    if (payloud.tipo === 'perguntas_relacionadas') {
      const botoes = payloud.dados.map((pergunta) => ({
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

    return res.json({
      text: `🤖 *Ainda estou aprendendo!*\nTente perguntar de outra forma ou digite *ajuda* para ver o que posso fazer.`
    });
  }

  if (event.type === 'ADDED_TO_SPACE') {
    return res.json({
      text: `🤖 *Olá!* Fui adicionado aqui para te ajudar.\n\nDigite *ajuda* para ver o que posso fazer.`
    });
  }

  res.sendStatus(200);
});

module.exports = router;
