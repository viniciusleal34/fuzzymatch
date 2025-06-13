const express = require('express');
const { google } = require('googleapis');

const app = express();
app.use(express.json());

// Verifica se a variável GOOGLE_CREDENTIALS está definida
if (!process.env.GOOGLE_CREDENTIALS) {
  console.error('Erro: variável de ambiente GOOGLE_CREDENTIALS não está definida!');
  process.exit(1); // Encerra o app se não tiver credenciais
}

let credentials;
try {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  }
} catch (error) {
  console.error('Erro ao fazer parse de GOOGLE_CREDENTIALS:', error);
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials,
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
const express = require('express');
const { google } = require('googleapis');

const app = express();
app.use(express.json());

// Verifica se a variável GOOGLE_CREDENTIALS está definida
if (!process.env.GOOGLE_CREDENTIALS) {
  console.error('Erro: variável de ambiente GOOGLE_CREDENTIALS não está definida!');
  process.exit(1); // Encerra o app se não tiver credenciais
}

let credentials;
try {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
} catch (error) {
  console.error('Erro ao fazer parse de GOOGLE_CREDENTIALS:', error);
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials,
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
