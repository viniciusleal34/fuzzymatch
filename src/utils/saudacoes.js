function responderSaudacaoOuDespedida(text) {
    const msg = text.toLowerCase();
  
    const saudacoes = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'e aí', 'fala'];
    const despedidas = ['tchau', 'até logo', 'até mais', 'falou', 'adeus', 'até a próxima'];
  
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
  
    return null;
  }
  
  module.exports = { responderSaudacaoOuDespedida };
  