const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

let credentials;
const jsonPath = path.join(__dirname, '/testechatbot-462718-99c1f4f027d8.json');

if (fs.existsSync(jsonPath)) {
  credentials = require(jsonPath);
} else if (process.env.GOOGLE_CREDENTIALS) {
  try {
    credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
  } catch (error) {
    console.error('Erro ao fazer parse de GOOGLE_CREDENTIALS:', error);
    process.exit(1);
  }
} else {
  console.error('Erro: Nenhum arquivo de credencial nem variável de ambiente encontrada!');
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

module.exports = auth;
