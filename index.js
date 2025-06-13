const express = require('express');
const { google } = require('googleapis');
const keys = require('./testechatbot-462718-99c1f4f027d8.json');

const app = express();
app.use(express.json());

const auth = new google.auth.GoogleAuth({
  credentials: keys,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

async function processaPergunta(fraseDoUsuario) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const spreadsheetId = '1-eMFSO5fwaJ0IczZfmEjnluYYsxA7FOepCmEo63V_2U';
  const range = 'Página1!A2:C';

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = res.data.values;
  if (!rows || !rows.length) return { tipo: 'nenhum', dados: [] };

  const fraseMinuscula = fraseDoUsuario.toLowerCase().trim();

  const matchPergunta = rows.find(row => row[0]?.toLowerCase().trim() === fraseMinuscula);

  if (matchPergunta) {
    return {
      tipo: 'resposta_direta',
      dados: {
        pergunta: matchPergunta[0],
        resposta: matchPergunta[2],
      },
    };
  }

  const relacionados = rows.filter(row => {
    const palavrasChave = row[1]?.toLowerCase().split(',').map(p => p.trim()) || [];
    return palavrasChave.some(palavra => fraseMinuscula.includes(palavra));
  });

  if (relacionados.length) {
    return {
      tipo: 'perguntas_relacionadas',
      dados: relacionados.map(r => r[0]),
    };
  }

  return { tipo: 'nenhum', dados: [] };
}

// 🟢 Endpoint da API
app.post('/perguntar', async (req, res) => {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API do ChatBot rodando em http://localhost:${PORT}`);
});
