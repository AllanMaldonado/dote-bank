# Deploy na Vercel e MongoDB Atlas

A publicação usa dois projetos Vercel ligados ao mesmo repositório. O Vue chama a API HTTPS, e o Express persiste os dados no Atlas.

> [!IMPORTANT]
> Use um banco exclusivo com dados fictícios para a apresentação. Mantenha as operações de saldo em sequência neste deploy. Veja os [limites de concorrência](arquitetura.md#limites-técnicos).

## 1. Preparar a publicação

- Confirme que a revisão no GitHub contém [backend/vercel.json](../backend/vercel.json) e [frontend/vercel.json](../frontend/vercel.json).
- Tenha acesso ao repositório na integração do GitHub com a Vercel e ao projeto do Atlas.
- Separe um remetente SMTP autorizado para redefinição de senha e uma chave Gemini para demonstrar IA.
- Guarde os segredos nas variáveis de ambiente. Arquivos `.env` reais ficam fora do Git e do ZIP.

## 2. Criar o banco no Atlas

1. Crie um projeto no Atlas e um cluster **Free** em uma região próxima à da API.
2. Em **Database Access**, crie um usuário de banco exclusivo. Conceda o papel `readWrite` somente no banco `dote`.
3. Em **Network Access**, autorize o IP do seu computador enquanto inicializa o banco. Para a API publicada, configure uma saída permitida para a Vercel. No Hobby, os IPs variam. Se usar `0.0.0.0/0` para a apresentação, lembre que a regra libera tentativas de conexão de qualquer origem. Use credenciais fortes e um cluster separado com dados fictícios.
4. Em **Connect → Drivers → Node.js**, copie a URI, acrescente `/dote` antes de `?` e substitua a senha. Codifique caracteres reservados da senha para URL.

~~~text
mongodb+srv://USUARIO:SENHA_CODIFICADA@HOST_ATLAS/dote?retryWrites=true&w=majority
~~~

[Lista de IPs do Atlas](https://www.mongodb.com/docs/atlas/security/add-ip-address-to-list/) · [IPs de saída da Vercel](https://vercel.com/academy/optimize-your-vercel-account/backend-egress)

## 3. Criar os dois projetos Vercel

Em **Add New → Project**, selecione o mesmo repositório nas duas importações.

| Projeto sugerido | Root Directory | Preset | Build | Saída |
| --- | --- | --- | --- | --- |
| `dote-bank-web` | `frontend` | Vite | `npm run build` | `dist` |
| `dote-bank-api` | `backend` | Express | Padrão | Padrão |

1. Publique primeiro o projeto web para obter o domínio de produção. O primeiro build serve para reservar a URL.
2. Na API, abra **Settings → Environment Variables** e preencha as variáveis de produção da tabela abaixo. Mantenha a exposição das variáveis de sistema ativa para disponibilizar `VERCEL=1` ao Express.
3. Publique a API. Abra `https://DOMINIO_DA_API/api/saude`. O resultado esperado é `{"ok":true}`. Na Vercel, essa rota também faz um ping no MongoDB.
4. De volta ao projeto web, preencha `VITE_API_URL` com a URL real da API e faça **Redeploy**. Refaça o deploy do projeto correspondente sempre que alterar suas variáveis.

[Monorepos na Vercel](https://vercel.com/docs/monorepos) · [Express](https://vercel.com/docs/frameworks/backend/express) · [Vite](https://vercel.com/docs/frameworks/frontend/vite) · [Variáveis de ambiente](https://vercel.com/docs/environment-variables/managing-environment-variables)

### Variáveis de produção

| Projeto | Variável | Valor |
| --- | --- | --- |
| API | `MONGODB_URI` | URI do Atlas com o banco `dote` |
| API | `JWT_SECRET` | Segredo aleatório com pelo menos 32 caracteres |
| API | `FRONTEND_URL` | Origem real do Vue, como `https://dote-bank-web.vercel.app`. Usada no CORS e no link de redefinição |
| API | `GEMINI_API_KEY` | Chave para a análise do Diamante |
| API | `GEMINI_MODELS` | Opcional. Lista de modelos separados por vírgulas, na ordem de tentativa |
| API | `SMTP_HOST`, `SMTP_PORT` | Endereço e porta conforme o provedor, geralmente 465 ou 587 |
| API | `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Credenciais de envio e remetente autorizado |
| Web | `VITE_API_URL` | Origem da API, como `https://dote-bank-api.vercel.app`. O cliente acrescenta `/api` |

Gere o segredo de assinatura do JWT com `node -p "require('node:crypto').randomBytes(32).toString('hex')"` e coloque o valor somente na API. As variáveis `VITE_*` são públicas. Para usar Preview, configure um banco e origens separados.

## 4. Criar o primeiro administrador

Execute na raiz do repositório, no PowerShell 7, com sua conexão ao Atlas autorizada. Use credenciais próprias e um CPF fictício válido.

~~~powershell
Push-Location backend
try {
  npm ci
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar dependências' }
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Falha no build' }
  $env:MONGODB_URI = Read-Host 'URI do Atlas com /dote' -MaskInput
  $env:DOTE_ADMIN_NOME = Read-Host 'Nome do administrador'
  $env:DOTE_ADMIN_EMAIL = Read-Host 'E-mail do administrador'
  $env:DOTE_ADMIN_CPF = Read-Host 'CPF fictício'
  $env:DOTE_ADMIN_SENHA = Read-Host 'Senha do administrador' -MaskInput
  npm run criar-admin
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar o administrador' }
} finally {
  Remove-Item Env:MONGODB_URI,Env:DOTE_ADMIN_NOME,Env:DOTE_ADMIN_EMAIL,Env:DOTE_ADMIN_CPF,Env:DOTE_ADMIN_SENHA -ErrorAction SilentlyContinue
  Pop-Location
}
~~~

Entre pelo Vue, cadastre duas contas fictícias e aprove ambas pelo painel. Deixe `npm run seed` para um banco local descartável, pois o seed apaga o banco configurado.

## 5. Validar e diagnosticar

- [ ] Abra `/api/saude` no domínio da API e confira `{"ok":true}`.
- [ ] Abra e atualize `/login` diretamente no domínio web. Faça login e confira a conta.
- [ ] Faça o CRUD de um contato, envie pontos entre as contas e avance o relógio pelo painel.
- [ ] Confirme o recebimento do link de redefinição e o selo **IA** na análise do Diamante.

| Sintoma | Onde checar |
| --- | --- |
| `503 banco_indisponivel` | URI, senha codificada, banco `dote` e lista de IPs do Atlas |
| `500` ao iniciar a API | Vercel → Logs. Confira `JWT_SECRET`, `MONGODB_URI` e `FRONTEND_URL` |
| Erro de CORS | Compare a origem real do Vue com `FRONTEND_URL`. Salve e faça redeploy da API |
| Vue abre, mas a API falha | Confira `VITE_API_URL` e teste `/api/saude` pelo domínio da API |
| `404` ao atualizar uma tela | Veja se o projeto web aponta para `frontend` e reconhece o rewrite de `vercel.json` |
| E-mail ausente ou análise sem IA | Confira o remetente SMTP, a chave Gemini e os logs do projeto da API |

[Roteiro funcional completo](demonstracao.md) · [SMTP na Vercel](https://vercel.com/kb/guide/serverless-functions-and-smtp)
