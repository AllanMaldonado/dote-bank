const { LIMITE_CONTATOS } = require('../models/constantes');
const Contato = require('../models/Contato');
const { conflict, notFound, unprocessable } = require('../utils/AppError');
const chavePixService = require('./chavePixService');

const erroDuplicado = () => conflict('Esta chave já está nos seus contatos', 'contato_duplicado');

class ContatoService {
  listar(usuarioId) {
    return Contato.find({ usuarioId }).sort({ apelido: 1 }).lean();
  }

  async obter(usuarioId, id) {
    const c = await Contato.findOne({ _id: id, usuarioId });
    if (!c) throw notFound('Contato não encontrado');
    return c;
  }

  async criar(usuarioId, { apelido, chave }) {
    const total = await Contato.countDocuments({ usuarioId });
    if (total >= LIMITE_CONTATOS)
      throw unprocessable(`Limite de ${LIMITE_CONTATOS} contatos`, 'limite_contatos');
    const destino = await chavePixService.resumirDestino(usuarioId, chave);
    if (await Contato.exists({ usuarioId, chaveDestino: destino.chaveDestino })) throw erroDuplicado();
    return Contato.create({ usuarioId, apelido, ...destino });
  }

  async atualizar(usuarioId, id, { apelido, chave }) {
    const c = await this.obter(usuarioId, id);
    if (apelido !== undefined) c.apelido = apelido;
    if (chave !== undefined) {
      const destino = await chavePixService.resumirDestino(usuarioId, chave);
      if (await Contato.exists({ usuarioId, chaveDestino: destino.chaveDestino, _id: { $ne: c._id } })) {
        throw erroDuplicado();
      }
      Object.assign(c, destino);
    }
    return c.save();
  }

  async excluir(usuarioId, id) {
    const c = await this.obter(usuarioId, id);
    await c.deleteOne();
  }
}

module.exports = new ContatoService();
