const express = require('express');
const router = express.Router();
const { processaPergunta } = require('../services/planilhaService');

router.post('/perguntar', async (req, res) => {
  const { pergunta } = req.body;
  if (!pergunta) {
    return res.status(400).json({ erro: 'Campo "pergunta" é obrigatório.' });
  }
 
  try {
    const resultado = await processaPergunta(pergunta);
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao processar a pergunta.' });
  }
});

module.exports = router;
