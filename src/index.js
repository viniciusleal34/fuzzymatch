const express = require('express');
const chatbotRoutes = require('./routes/chatbotRoutes');

const app = express();
app.use(express.json());

app.use('/api', chatbotRoutes);

app.post('/chat', (req, res) => {
  const event = req.body;

  if (event.type === 'MESSAGE') {
    const message = event.message.text.toLowerCase();

    let resposta = 'Como posso te ajudar?';

    if (message.includes('ajuda')) {
      resposta = 'Essas são as opções que posso te ajudar:\n1. Ver saldo\n2. Criar tarefa\n3. Falar com suporte';
    }

    return res.json({
      text: resposta,
    });
  }

  if (event.type === 'ADDED_TO_SPACE') {
    return res.json({ text: `Olá, ${event.space.name}! Como posso te ajudar?` });
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`🚀 API do ChatBot rodando em http://localhost:${PORT}`);
});
