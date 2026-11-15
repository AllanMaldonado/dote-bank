const pixService = require('../services/pixService');
const { destinatarioPublico, transacaoPublica } = require('../utils/dto');

class PixController {
  async destinatario(req, res) {
    const destinatario = await pixService.consultarDestinatario(req.query.chave);
    res.json(destinatarioPublico(destinatario, req.user._id));
  }

  async enviar(req, res) {
    const transacao = await pixService.enviar(req.user._id, req.body);
    res.status(201).json(transacaoPublica(transacao, req.user._id));
  }
}

module.exports = new PixController();
