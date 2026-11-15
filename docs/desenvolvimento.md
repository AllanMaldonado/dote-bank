# Desenvolvimento local

Use Node.js 22 ou 24, npm e Docker Compose. Os exemplos abaixo usam PowerShell 7.

## Executar o projeto inteiro

Na raiz do repositório, copie o arquivo de exemplo apenas na primeira configuração.

~~~powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
node -p "require('node:crypto').randomBytes(32).toString('hex')"
~~~

Preencha `JWT_SECRET` no `.env` da raiz com o valor gerado. Esse é o único arquivo local de configuração, compartilhado pela API, pelo Vite e pelo Compose. As seções de SMTP e Gemini são opcionais. Deixe `FRONTEND_URL` e `VITE_API_URL` vazias para usar os endereços locais automáticos. Suba os serviços com o Compose.

~~~powershell
docker compose up -d --build --wait
docker compose ps
Invoke-RestMethod http://localhost:8080/api/saude
~~~

Abra [localhost:8080](http://localhost:8080) ou o [Swagger](http://localhost:8080/api-docs/). O MongoDB do Compose escuta localmente em `127.0.0.1:27018`. O volume guarda o banco `dote` entre reinicializações.

Em uma instalação nova, o banco começa vazio. Para criar o administrador local, defina `DOTE_ADMIN_NOME`, `DOTE_ADMIN_EMAIL`, `DOTE_ADMIN_CPF` e `DOTE_ADMIN_SENHA` no terminal e rode o comando abaixo.

~~~powershell
docker compose exec -e DOTE_ADMIN_NOME -e DOTE_ADMIN_EMAIL -e DOTE_ADMIN_CPF -e DOTE_ADMIN_SENHA backend npm run criar-admin
~~~

## Desenvolver com recarga automática

1. Na raiz, prepare o `.env` como acima e execute `docker compose up -d mongo`.
2. Em um terminal na pasta `backend`, execute `npm ci` e `npm run dev`. A API local usa a porta 3000 e o banco `dote_dev` do arquivo de exemplo.
3. Em outro terminal, na pasta `frontend`, execute `npm ci` e `npm run dev`. Abra [localhost:5173](http://localhost:5173). O Vite encaminha `/api` para o Express. Deixe `VITE_API_URL` vazio para esse modo.

## Dados de demonstração

Use um banco local descartável. Com o MongoDB rodando, execute no terminal do backend após `npm ci`.

~~~powershell
$env:MONGODB_URI = 'mongodb://127.0.0.1:27018/dote_demo'
npm run seed
npm run dev
~~~

> [!WARNING]
> O seed apaga e recria o banco indicado em `MONGODB_URI`. Ele é um comando explícito. Iniciar o servidor preserva os dados existentes.

| Conta fictícia | Senha | Papel |
| --- | --- | --- |
| `allan@dote.com` | `12345678` | Cliente |
| `caio@dote.com` | `12345678` | Cliente |
| `admin@dote.com` | `admin123` | Administrador |

Abra as três sessões em perfis separados do navegador. O seed inclui chaves, caixinhas, histórico e agendamentos. Para preparar a hospedagem, siga o [tutorial de deploy](deploy.md).

## Testes e build

| Ação | Pasta | Comando |
| --- | --- | --- |
| Testar API e regras de saldo | `backend` | `npm test` |
| Testar estado e validações da interface | `frontend` | `npm test` |
| Verificar tipos | `backend` ou `frontend` | `npm run typecheck` |
| Gerar build | `backend` ou `frontend` | `npm run build` |

Os testes do backend usam o MongoDB local e criam bancos temporários com prefixo `dote_test_`. Para mudar o servidor dos testes, configure `MONGODB_URI_TEST`. Os testes do frontend rodam sem MongoDB. A compilação gera `dist/` em cada pasta. Use `npm start` em `backend` para executar a API compilada.

Veja o [roteiro de demonstração](demonstracao.md) para preparar contas fictícias e testar o fluxo completo.
