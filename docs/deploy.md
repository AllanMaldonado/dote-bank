# Publicar o DOTE na Vercel com MongoDB Atlas

Este guia publica o frontend Vue e a API Express como **dois projetos Vercel**, ligados ao mesmo repositório, com um banco Atlas exclusivo. Reserve nomes e anote os dois domínios finais: você vai cruzá-los nas configurações de CORS e da URL da API.

> [!IMPORTANT]
> O DOTE simula pontos e serve para demonstração acadêmica. Use dados fictícios, um banco separado e contas de teste. As operações de saldo têm coordenação em memória e compensação; isso não equivale a transações atômicas entre processos. Consulte [limites técnicos](arquitetura.md#limites-técnicos).

## 1. Entenda os arquivos de ambiente

A configuração local fica em um único arquivo `.env` na raiz. O modelo `.env.example` lista todas as variáveis, com comentários e valores locais padrão. Copie o modelo apenas ao configurar o projeto pela primeira vez.

~~~powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
~~~

A API, o Vite e o Docker Compose leem esse arquivo. O Vite publica no navegador as variáveis com prefixo `VITE_`. Preencha `JWT_SECRET` com um segredo aleatório. As credenciais SMTP e Gemini ficam nas seções correspondentes do mesmo arquivo.

Deixe `FRONTEND_URL` vazia para usar os endereços locais automáticos. A API local usa `http://localhost:5173`, enquanto o Compose usa `http://localhost:8080` ou a porta definida em `APP_PORT`. O Compose também define seu próprio banco interno `mongodb://mongo:27017/dote` e a porta interna 3000.

Na Vercel, cadastre as variáveis no painel dos dois projetos, conforme as etapas 4 e 5. As credenciais de banco, JWT, SMTP e Gemini pertencem ao projeto API. A variável pública `VITE_API_URL` pertence ao projeto Web. O arquivo `.env` local é ignorado pelo Git.

| Nome | Necessidade | Onde | Significado |
| --- | --- | --- | --- |
| `MONGODB_URI` | Obrigatória na Vercel | API | URI do Atlas com o banco `dote` |
| `JWT_SECRET` | Obrigatória; mínimo de 32 caracteres na Vercel | Raiz para Compose; API para Vercel | Assina os tokens de sessão. Use valores aleatórios diferentes por ambiente |
| `FRONTEND_URL` | Obrigatória na Vercel | API; raiz no Compose | Origem completa do frontend, sem barra ou caminho no final. Controla CORS e link de redefinição |
| `VITE_API_URL` | Obrigatória para o site publicado | Web | Origem HTTPS da API, sem `/api`; o cliente acrescenta `/api` |
| `GEMINI_API_KEY` | Opcional | API | Habilita análises do Diamante com Gemini |
| `GEMINI_MODELS` | Opcional | API | Modelos separados por vírgulas, na ordem de tentativa; padrão definido no código |
| `SMTP_HOST`, `SMTP_PORT` | Opcional | API | Servidor SMTP e porta do provedor |
| `SMTP_USER`, `SMTP_PASS` | Conforme o provedor | API | Usuário e senha ou senha de aplicativo SMTP |
| `SMTP_FROM` | Recomendada se SMTP estiver configurado | API | Remetente permitido pelo provedor |
| `JWT_EXPIRES_IN` | Opcional | API | Validade do token, por exemplo `8h`; padrão do código é `8h` |
| `NODE_ENV`, `VERCEL` | Gerenciada pela plataforma | API | Não cadastre manualmente. A validação do projeto detecta `VERCEL=1` |
| `PORT`, `TRUST_PROXY` | Gerenciada pela plataforma/Compose | API | Não é necessário cadastrar na Vercel |
| `APP_BIND`, `APP_PORT`, `MONGO_PORT` | Opcional | Raiz local | Portas do Docker Compose; não são variáveis da Vercel |
| `DOTE_ADMIN_NOME`, `DOTE_ADMIN_EMAIL`, `DOTE_ADMIN_CPF`, `DOTE_ADMIN_SENHA` | Apenas ao criar administrador | Terminal temporário | Dados iniciais do administrador; não cadastre como variáveis permanentes da aplicação |
| `MONGODB_URI_TEST` | Apenas se mudar o servidor de teste | Terminal/backend | URI base dos testes; os testes criam bancos com prefixo `dote_test_` |

O Vite encaminha `/api` para `localhost:3000` quando você roda localmente; por isso `VITE_API_URL` pode ficar vazia em desenvolvimento. Na Vercel o frontend e backend têm domínios distintos, então defina a URL pública da API e faça um novo build do frontend após alterar essa variável.

## 2. Criar o cluster e usuário no MongoDB Atlas

1. Entre no MongoDB Atlas e crie uma organização/projeto para a demonstração. Selecione **Build a Database** e escolha um cluster de acordo com a disponibilidade atual do seu plano e região. Dê preferência a uma região próxima da função Vercel.
2. Em **Database Access**, crie um usuário de banco separado do seu login Atlas. Salve o nome e a senha em um gerenciador de senhas. Conceda somente `readWrite` no banco `dote`; a API não precisa de usuário administrador do cluster.
3. Em **Network Access → IP Access List**, adicione o IP público da sua rede para executar o script de criação do administrador. Essa autorização pode ser temporária.
4. A API Vercel precisa conseguir alcançar o Atlas. A lista do Atlas filtra pelo IP de origem, mas o egress Vercel Hobby pode não oferecer um IP fixo para liberar com precisão. Para uma demonstração, se precisar usar `0.0.0.0/0`, faça isso conscientemente: significa aceitar conexões originadas de qualquer IP. Compense com usuário exclusivo, senha forte, acesso `readWrite` apenas ao banco `dote` e dados fictícios; remova a regra ampla ao encerrar a demonstração. Para produção, configure uma arquitetura com saída de rede fixa/privada e permita apenas esses endereços.
5. Abra **Connect → Drivers**, selecione Node.js e copie a connection string. Troque `<password>` pela senha do usuário de banco e acrescente `/dote` no caminho antes de `?` se o Atlas não o incluir. Codifique na senha caracteres reservados para URL (por exemplo `@`, `:`, `/`, `#`).
6. O resultado terá esta forma; **não cole a URI real em documentação, chat, código ou Git**:

~~~text
mongodb+srv://USUARIO:SENHA_CODIFICADA@CLUSTER.mongodb.net/dote?retryWrites=true&w=majority
~~~

7. Antes de configurar a API, teste essa URI de uma máquina autorizada usando o cliente MongoDB ou o script de administrador da etapa 7. O banco Atlas não precisa ser previamente criado: o MongoDB cria o banco ao primeiro registro.

A URI só autentica o usuário; a entrada da lista de IPs também precisa permitir a conexão. Veja a documentação oficial do [Atlas IP Access List](https://www.mongodb.com/docs/atlas/security/ip-access-list/) e [conexão ao Atlas](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/).

## 3. Importar o repositório para a Vercel

1. Entre na Vercel e conecte sua conta GitHub, se ainda não estiver conectada. Autorize o repositório que contém o DOTE.
2. Escolha **Add New → Project**, importe o repositório.
3. Na primeira importação, configure o primeiro projeto:

| Projeto | Root Directory | Framework | Build Command | Output |
| --- | --- | --- | --- | --- |
| Web, por exemplo `dote-bank-web` | `frontend` | Vite | `npm run build` | `dist` |
| API, por exemplo `dote-bank-api` | `backend` | Express | padrão detectado; `npm run build` se a tela pedir | padrão do Express |

4. Em **Root Directory**, habilite **Include files outside the root directory** se a Vercel apresentar essa opção. O `vercel.json` da API está em `backend/` e o do frontend em `frontend/`; mantenha cada projeto apontando para a pasta correspondente.
5. Não defina `VITE_API_URL` na primeira publicação do web: use o deploy inicial apenas para obter o domínio do frontend. Depois, crie o projeto API e obtenha também seu domínio. Os domínios podem ser `.vercel.app` ou um domínio customizado.
6. Confirme que cada projeto está ligado à branch `main` para produção. Pull requests podem gerar Preview Deployments separados.

A Vercel configura monorepos por projeto e diretório raiz. Consulte [Monorepos](https://vercel.com/docs/monorepos), [configuração do build](https://vercel.com/docs/builds/configure-a-build), [Express](https://vercel.com/docs/frameworks/backend/express) e [variáveis de ambiente](https://vercel.com/docs/environment-variables).

## 4. Configurar variáveis do projeto API

No dashboard Vercel, abra o **projeto da API → Settings → Environment Variables**. Adicione as variáveis uma a uma, selecione **Production** em cada uma e salve. Não as adicione ao projeto web.

| Variável | Valor a cadastrar |
| --- | --- |
| `MONGODB_URI` | URI Atlas completa do passo 2, com `/dote` e credenciais codificadas |
| `JWT_SECRET` | Saída de `node -p "require('node:crypto').randomBytes(32).toString('hex')"`; use um segredo próprio do ambiente |
| `FRONTEND_URL` | Origem de produção do site, por exemplo `https://NOME-WEB.vercel.app`; sem barra final, `/login` ou caminho |
| `GEMINI_API_KEY` | Opcional: chave do provedor Gemini. Deixe ausente se não for demonstrar IA |
| `GEMINI_MODELS` | Opcional: por exemplo `gemini-3.6-flash`; use modelos disponíveis para a sua chave |
| `SMTP_HOST` | Opcional: host SMTP documentado pelo seu provedor |
| `SMTP_PORT` | Opcional: em geral `465` para TLS implícito ou `587` para STARTTLS |
| `SMTP_USER` | Opcional: usuário de SMTP |
| `SMTP_PASS` | Opcional: senha de aplicativo/SMTP; não use sua senha pessoal normal sem suporte do provedor |
| `SMTP_FROM` | Opcional: remetente autorizado, por exemplo `DOTE <no-reply@seudominio.com>` |
| `JWT_EXPIRES_IN` | Opcional: `8h`, se quiser definir explicitamente o padrão |

Confira os nomes e espaços extras antes de salvar. Para variáveis opcionais, se não for ativar o recurso, deixe-as ausentes. Não crie `GEMINI_MODEL` ou `SESSAO_HORAS`: esses nomes antigos não são lidos pelo código. Depois de alterar variáveis, a Vercel exige novo deployment para que a função receba os valores.

## 5. Configurar o projeto Web e interligar os domínios

1. No **projeto API**, copie o domínio principal de produção e teste `https://DOMINIO-DA-API/api/saude`. O esperado é `{"ok":true}`. Essa rota testa a conexão com o Atlas no ambiente Vercel.
2. No **projeto API → Settings → Environment Variables**, confirme `FRONTEND_URL` igual à origem exata do site, por exemplo `https://dote-bank-web.vercel.app`. Se usar domínio próprio, use o domínio que será visitado. Salve e faça **Redeploy** da API.
3. No **projeto Web → Settings → Environment Variables**, adicione `VITE_API_URL` com a origem da API, por exemplo `https://dote-bank-api.vercel.app`. Não inclua `/api`, barra final, aspas, token ou segredo. Marque **Production**.
4. Faça **Redeploy** do Web para recompilar o frontend com essa URL.
5. Visite o domínio Web e abra `/login`. Faça atualização direta do navegador em `/login` e `/cadastro`; o rewrite de `frontend/vercel.json` deve retornar o app Vue.
6. Confirme que o frontend envia chamadas para `https://DOMINIO-DA-API/api/...` e que o console do navegador não mostra erro de CORS. A configuração atual permite uma origem em `FRONTEND_URL`.
7. Se a Vercel fornecer aliases diferentes para Preview ou Production, `FRONTEND_URL` de Production deve ser a origem de Production do Web. Para Preview, crie valores de Preview de `FRONTEND_URL` e `VITE_API_URL` que apontem para a combinação correta e use banco de Preview separado. Não use dados reais ou o banco de produção em previews.

## 6. Conferir o primeiro deploy da API

1. Em **Deployments**, aguarde os builds do Web e da API terminarem sem erro.
2. Abra `https://DOMINIO-DA-API/api/saude`. Resposta esperada: `{"ok":true}`. O backend abre o Atlas sob demanda e faz ping nessa rota.
3. Se falhar, consulte **API → Deployments → deployment atual → Runtime Logs**. Os erros de configuração da Vercel citam a variável obrigatória ausente. Para erro de conexão Atlas, compare URI, usuário/senha codificados, nome `/dote` e IP Access List.
4. O endpoint `/api-docs` pode ser usado para consultar as rotas disponíveis, mas ele não cria dados nem administrador.

## 7. Inicializar a demonstração no Atlas

O comando manual `npm run seed:inicial` cria o cenário completo com administrador, clientes Allan e Caio, chaves, caixinhas, transações, notificações e agendamentos. O histórico usa o relógio simulado e cobre vários meses. Execute uma vez, na preparação de um banco vazio dedicado à demonstração.

O comando registra a execução na coleção `inicializacoes`. Uma nova chamada após o sucesso apenas informa que a demonstração já foi inicializada. Chamadas concorrentes são recusadas pela chave única desse registro. Se houver uma interrupção, o registro fica pendente ou interrompido e exige revisão antes de outra carga, evitando repetir movimentações parcialmente gravadas.

O cenário avança o relógio global e executa agendamentos. Por esse motivo, um banco que já contém usuários exige outro banco dedicado para essa carga. O comando informa essa condição antes de inserir os dados.

1. Autorize o IP público do seu computador no Atlas, conforme a etapa 2.
2. Abra o PowerShell 7 na raiz do repositório.
3. Execute o bloco abaixo com a URI do banco de demonstração. As credenciais são fornecidas temporariamente no terminal.

~~~powershell
Push-Location backend
try {
  npm ci
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar dependências' }
  $env:MONGODB_URI = Read-Host 'URI do Atlas com o banco de demonstração' -MaskInput
  $env:DOTE_ADMIN_NOME = Read-Host 'Nome do administrador'
  $env:DOTE_ADMIN_EMAIL = Read-Host 'E-mail do administrador'
  $env:DOTE_ADMIN_CPF = Read-Host 'CPF fictício válido do administrador'
  $env:DOTE_ADMIN_SENHA = Read-Host 'Senha do administrador (8 a 72 caracteres)' -MaskInput
  $env:SEED_DEMO_SENHA = Read-Host 'Senha dos clientes Allan e Caio (8 a 72 caracteres)' -MaskInput
  npm run seed:inicial
  if ($LASTEXITCODE -ne 0) { throw 'Inicialização incompleta. Confira a mensagem antes de repetir.' }
} finally {
  Remove-Item Env:MONGODB_URI,Env:DOTE_ADMIN_NOME,Env:DOTE_ADMIN_EMAIL,Env:DOTE_ADMIN_CPF,Env:DOTE_ADMIN_SENHA,Env:SEED_DEMO_SENHA -ErrorAction SilentlyContinue
  Pop-Location
}
~~~

4. Aguarde a mensagem de conclusão. O cenário tem vários meses de operações e pode levar alguns minutos com o Atlas.
5. Entre no site com o administrador informado ou com `allan@dote.com` e `caio@dote.com` usando a senha de clientes informada no terminal. Os logs exibem apenas o resultado da execução.
6. Remova a autorização temporária do seu IP se ela tiver sido criada apenas para a carga.

O build continua executando `tsc`. Novos deploys mantêm a carga existente. Para criar apenas um administrador, existe o comando `npm run criar-admin` com as quatro variáveis `DOTE_ADMIN_*`. O comando antigo `npm run seed` continua destinado a recriar bancos locais descartáveis e remove seu conteúdo.

## 8. Fluxo funcional após publicação

1. Entre com o administrador criado no passo 7.
2. Cadastre uma conta com dados fictícios.
3. Abra **Clientes** e aprove a conta; a aprovação credita os pontos iniciais.
4. Saia e entre como cliente. Crie uma chave e uma caixinha, faça uma transferência entre contas de teste e confira o comprovante e o extrato.
5. Entre novamente como admin e avance o relógio apenas alguns dias para experimentar agendamentos e rendimentos.
6. Teste redefinição de senha se SMTP estiver configurado. Se não estiver, esse recurso não envia o e-mail no deploy.
7. Gere uma análise do Diamante. Com `GEMINI_API_KEY` válido, a interface deve indicar IA; sem ele, usa regras locais.

## 9. Diagnóstico

| Sintoma | Conferência |
| --- | --- |
| API retorna 500 ao iniciar | API → Runtime Logs; confirme `MONGODB_URI`, `FRONTEND_URL` e `JWT_SECRET` no ambiente Production e faça Redeploy |
| `/api/saude` retorna `503 banco_indisponivel` | URI Atlas completa, senha percent-encoded, usuário MongoDB, banco `/dote`, cluster ativo e IP Access List |
| API retorna erro de CORS no navegador | Compare o campo **Origin** da requisição com `FRONTEND_URL` caractere por caractere; informe apenas esquema + domínio e faça Redeploy da API |
| Web abre, mas chamadas falham | Confira `VITE_API_URL` no projeto Web, sem `/api`; faça Redeploy do frontend e teste o domínio `/api/saude` |
| Atualizar `/login` ou outra rota Vue mostra 404 | Confirme Root Directory `frontend`, rewrite de `frontend/vercel.json` e saída `dist` |
| Alterei variável, mas nada mudou | Variáveis são aplicadas ao próximo deployment: faça Redeploy do projeto certo; `VITE_API_URL` precisa de novo build Web |
| E-mail não chega | Confira host, porta, usuário, senha de aplicativo e remetente autorizado; verifique logs da API e spam |
| Diamante usa regras | Confirme `GEMINI_API_KEY`, nome do modelo e logs da API; sem chave configurada o fallback é esperado |
| API não aparece como Express | Confirme Root Directory `backend` e que `backend/vercel.json` está presente no branch implantado |

## 10. Atualizar, desligar ou limpar o ambiente

- Cada push na branch configurada pode gerar novo deploy. Leia os logs de build e teste `/api/saude` após publicar mudanças na API.
- Mudou apenas `FRONTEND_URL` ou segredo do backend? Atualize e faça redeploy da **API**.
- Mudou `VITE_API_URL`? Atualize e faça redeploy do **Web** para a variável entrar no bundle.
- Para encerrar uma demonstração, remova qualquer regra Atlas `0.0.0.0/0`, revogue ou substitua as credenciais expostas e exclua os projetos e banco descartáveis se não forem mais necessários.
- Para uma nova apresentação limpa, não rode o seed contra o banco do deploy sem entender que o script remove dados. Crie outro cluster/banco exclusivo ou limpe dados por um procedimento controlado.

Veja também o [guia de desenvolvimento local](desenvolvimento.md), o [roteiro funcional](demonstracao.md) e os links oficiais da Vercel e Atlas citados nas etapas acima.

## Limites de requisições

Os valores ficam em `backend/src/middlewares/rateLimiter.ts`. A API e o Swagger recebem até 120 requisições por minuto por IP. Os endpoints de autenticação compartilham uma cota adicional de 20 requisições por IP a cada 15 minutos. A análise de IA aceita 15 chamadas por usuário por minuto. Requisições OPTIONS são atendidas pelo CORS.

Os contadores ficam na coleção `limites_requisicoes` do MongoDB e são compartilhados entre instâncias da API. Um índice TTL remove os contadores expirados, e cada incremento verifica a janela de validade atomicamente. As chaves derivadas de IP usam SHA-256. O excesso retorna HTTP 429 com os cabeçalhos de limite e Retry-After. Falhas no armazenamento impedem a requisição de prosseguir.
