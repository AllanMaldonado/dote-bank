const crypto = require('node:crypto');
const ChaveTransferencia = require('../models/ChaveTransferencia');
const { LIMITE_CHAVES } = require('../models/constantes');
const { badRequest, conflict, notFound, unprocessable } = require('../utils/AppError');
const { somenteDigitos, uuidValido } = require('../utils/validacao');

const formatarCelular = (digitos) => `+55${digitos}`;

function candidatosDaChave(entrada) {
  const texto = String(entrada ?? '').trim();
  if (!texto) return [];
  if (texto.includes('@') || uuidValido(texto)) return [texto.toLowerCase()];
  const d = somenteDigitos(texto);
  if (texto.startsWith('+55') && d.length === 13) return [`+${d}`];
  if (d.length === 11) return [d, formatarCelular(d)];
  return [texto];
}

const VALOR_POR_TIPO = {
  cpf: (u) => u.cpf,
  email: (u) => u.email,
  celular: (u) => {
    if (!u.celular) throw unprocessable('Cadastre um celular no seu perfil antes', 'sem_celular');
    return formatarCelular(u.celular);
  },
  aleatoria: () => crypto.randomUUID(),
};

class ChaveTransferenciaService {
  listar(usuarioId) {
    return ChaveTransferencia.find({ usuarioId }).sort({ createdAt: 1 }).lean();
  }

  async obter(usuarioId, id) {
    const chave = await ChaveTransferencia.findOne({ _id: id, usuarioId });
    if (!chave) throw notFound('Chave não encontrada');
    return chave;
  }

  async criar(usuario, { tipo }) {
    const valor = VALOR_POR_TIPO[tipo](usuario);
    const [total, existe] = await Promise.all([
      ChaveTransferencia.countDocuments({ usuarioId: usuario._id }),
      ChaveTransferencia.exists({ valor }),
    ]);
    if (total >= LIMITE_CHAVES)
      throw unprocessable(`Limite de ${LIMITE_CHAVES} chaves por conta`, 'limite_chaves');
    if (existe) throw conflict('Esta chave já está cadastrada');
    return ChaveTransferencia.create({ usuarioId: usuario._id, tipo, valor });
  }

  async regenerarAleatoria(usuarioId, id) {
    const chave = await this.obter(usuarioId, id);
    if (chave.tipo !== 'aleatoria') {
      throw unprocessable('Só a chave aleatória pode ser alterada; exclua e cadastre de novo', 'chave_fixa');
    }
    chave.valor = crypto.randomUUID();
    return chave.save();
  }

  async excluir(usuarioId, id) {
    const chave = await this.obter(usuarioId, id);
    await chave.deleteOne();
  }

  excluirTodas(usuarioId) {
    return ChaveTransferencia.deleteMany({ usuarioId });
  }

  async sincronizarComCadastro(usuario) {
    await ChaveTransferencia.deleteMany({
      usuarioId: usuario._id,
      $or: [
        { tipo: 'email', valor: { $ne: usuario.email } },
        { tipo: 'celular', valor: { $ne: usuario.celular ? formatarCelular(usuario.celular) : null } },
      ],
    });
  }

  async resumirDestino(usuarioId, entrada) {
    const { chave, destino } = await this.resolverDestino(entrada, { origemId: usuarioId });
    return { chaveDestino: chave.valor, destinatarioNome: destino.nome };
  }

  erroDestinoIndisponivel() {
    return unprocessable('Conta de destino indisponível', 'destino_indisponivel');
  }

  async resolverDestino(entrada: string, { origemId }: { origemId?: unknown } = {}) {
    const candidatos = candidatosDaChave(entrada);
    if (!candidatos.length) throw badRequest('Informe a chave de transferência');
    const chave = await ChaveTransferencia.findOne({ valor: { $in: candidatos } })
      .populate('usuarioId', 'nome cpf status')
      .lean();
    if (!chave) throw notFound('Chave de transferência não encontrada', 'chave_nao_encontrada');
    const destino = chave.usuarioId;
    if (destino?.status !== 'ativo') throw this.erroDestinoIndisponivel();
    if (origemId && String(destino._id) === String(origemId)) {
      throw unprocessable('Não é possível transferir para si mesmo', 'transferencia_para_si');
    }
    return { chave, destino };
  }
}

module.exports = new ChaveTransferenciaService();
