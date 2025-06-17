const { google } = require('googleapis');
const { distance } = require('fastest-levenshtein');
const auth = require('../config/auth');

async function processaPergunta(fraseDoUsuario) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const spreadsheetId = '1-eMFSO5fwaJ0IczZfmEjnluYYsxA7FOepCmEo63V_2U';
  const range = 'Página1';

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = res.data.values;
  if (!rows || !rows.length) return { tipo: 'nenhum', dados: [] };

  const fraseMinuscula = fraseDoUsuario.toLowerCase().trim();

  const match = rows.find(row => row[0]?.toLowerCase().trim() === fraseMinuscula);
  if (match) {
    return {
      tipo: 'resposta_direta',
      dados: {
        pergunta: match[0],
        resposta: match[2],
      }
    };
  }

  const relacionados = rows.filter(row => {
    const palavrasChave = row[1]?.toLowerCase().split(',').map(p => p.trim()) || [];
    const fraseSemPontuacao = fraseMinuscula.replace(/[^\w\s]/gi, '');
    const palavrasFrase = fraseSemPontuacao.split(/\s+/);
  
    const nGrams = [];
    const maxN = 3; 
  
    for (let n = 1; n <= maxN; n++) {
      for (let i = 0; i <= palavrasFrase.length - n; i++) {
        nGrams.push(palavrasFrase.slice(i, i + n).join(' '));
      }
    }
  
    return palavrasChave.some(chave =>
      nGrams.some(bloco => distance(bloco, chave) <= 2)
    );
  });
  

  if (relacionados.length) {
    return {
      tipo: 'perguntas_relacionadas',
      dados: relacionados.map(r => r[0]),
    };
  }

  return { tipo: 'nenhum', dados: [] };
}

module.exports = { processaPergunta };
