const transferenciaService = require('../services/transferenciaService');
const { destinatarioPublico, transacaoPublica } = require('../utils/dto');

class TransferenciaController {
  async destinatario(req, res) {
    const destinatario = await transferenciaService.consultarDestinatario(req.query.chave);
    res.json(destinatarioPublico(destinatario, req.user._id));
  }

  async enviar(req, res) {
    const transacao = await transferenciaService.enviar(req.user._id, req.body);
    res.status(201).json(transacaoPublica(transacao, req.user._id));
  }
}

module.exports = new TransferenciaController();
