const nodemailer = require('nodemailer');
const env = require('../config/env');

function criarSmtp() {
  const { host, port, user, pass } = env.smtp;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

const semEnvio = { sendMail: async () => {} };

const escaparHtml = (t) =>
  String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

class EmailService {
  transporte = criarSmtp() ?? semEnvio;

  definirTransporte(novo) {
    this.transporte = novo;
  }

  async enviarLinkReset({ para, nome, link }) {
    if (env.isDev) console.log(`[reset de senha] ${para}: ${link}`);
    try {
      await this.transporte.sendMail({
        from: env.smtp.from,
        to: para,
        subject: 'DOTE — redefinição de senha',
        text: `Olá, ${nome}!\n\nPara redefinir sua senha, acesse (válido por 15 minutos):\n${link}\n\nSe não foi você, ignore este e-mail.`,
        html:
          `<p>Olá, ${escaparHtml(nome)}!</p>` +
          `<p>Para redefinir sua senha, clique no botão abaixo (válido por 15 minutos):</p>` +
          `<p><a href="${escaparHtml(link)}" style="display:inline-block;padding:10px 20px;background:#16a34a;color:#fff;` +
          `text-decoration:none;border-radius:6px">Redefinir senha</a></p>` +
          `<p>Se não foi você, ignore este e-mail.</p>`,
      });
    } catch (err) {
      console.error('[email] falha ao enviar reset:', err.message);
    }
  }
}

module.exports = new EmailService();
