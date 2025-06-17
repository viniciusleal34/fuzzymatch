function responderSaudacaoOuDespedida(text) {
    const msg = text.toLowerCase();
  
    const saudacoes = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'e aí', 'fala'];
    const despedidas = ['tchau', 'até logo', 'até mais', 'falou', 'adeus', 'até a próxima'];
    const afirmacoes = ['sim', 'ss', 'por favor', 'porfavor', 'pode ser', 'claro'];
    const negacoes = ['não', 'nao', 'nn', 'negativo', 'obrigado', 'valeu'];
  
    if (saudacoes.some(s => msg.includes(s))) {
      if (msg.includes('boa tarde')) {
        return '🌇 *Boa tarde!* Como posso te ajudar hoje?';
      } else if (msg.includes('bom dia')) {
        return '☀️ *Bom dia!* Em que posso te ajudar?';
      } else if (msg.includes('boa noite')) {
        return '🌙 *Boa noite!* Precisa de algo antes de encerrar o dia?';
      } else {
        return '👋 *Oi!* Como posso ajudar você?';
      }
    }
  
    if (despedidas.some(d => msg.includes(d))) {
      return '👋 *Tchau!* Se precisar de algo, estarei por aqui.';
    }
  
    if (afirmacoes.some(a => msg.includes(a))) {
      return '✅ *Ótimo!* O que você deseja saber?';
    }
  
    if (negacoes.some(n => msg.includes(n))) {
      return '👋 *Tudo bem!* Qualquer coisa, é só chamar.';
    }
  
    return null;
  }
  
  module.exports = { responderSaudacaoOuDespedida };
  