const express = require('express');
const router = express.Router();
const { processaPergunta } = require('../services/planilhaService');
const { responderSaudacaoOuDespedida } = require('../utils/saudacoes');

router.post('/chat', async (req, res) => {
  const event = req.body;

  if (event.type === 'CARD_CLICKED') {
    const resposta = event.common?.parameters?.botao;
    const payloud = await processaPergunta(resposta);

    if (payloud.tipo === 'resposta_direta') {
      return res.json({
        text: `❓ *${payloud.dados.pergunta}*\n\n✅ ${payloud.dados.resposta}\n\n❓ *Deseja saber mais alguma coisa?*`
      });
    }

    return res.json({
      text: `📝 Você escolheu: *${resposta}*`
    });
  }

  if (event.type === 'MESSAGE') {
    const message = event.message.text.toLowerCase();
    const respostaSaudacao = responderSaudacaoOuDespedida(message);

    if (respostaSaudacao) {
      return res.json({ text: respostaSaudacao });
    }

    const payloud = await processaPergunta(message);

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
