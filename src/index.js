const express = require('express');
const chatbotRoutes = require('./routes/chatbotRoutes');
const perguntaRoutes = require('./routes/perguntaRoutes');

const app = express();
app.use(express.json());

app.use('/api', chatbotRoutes); // /api/chat
app.use('/api', perguntaRoutes); // /api/perguntar

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`🚀 API do ChatBot rodando em http://localhost:${PORT}`);
});
