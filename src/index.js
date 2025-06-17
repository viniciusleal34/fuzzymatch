const express = require('express');
const chatbotRoutes = require('./routes/chatbotRoutes');
const perguntaRoutes = require('./routes/perguntaRoutes');

const app = express();
app.use(express.json());

app.use('/api', chatbotRoutes); 
app.use('/api', perguntaRoutes);

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`🚀 API do ChatBot rodando em http://localhost:${PORT}`);
});
