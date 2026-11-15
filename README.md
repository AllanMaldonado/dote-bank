# DOTE

Banco digital simulado que usa pontos fictícios (P$). Clientes podem transferir pontos, cadastrar contatos e chaves de transferência, guardar pontos em caixinhas, agendar transferências e consultar o extrato. O painel administrativo aprova contas e controla a data simulada. O Diamante analisa o relatório com Google Gemini.

Projeto prático de Linguagens de Programação II, Bacharelado em Sistemas de Informação, UNOESTE.

**Integrantes** Allan Maldonado e Caio Collete.

## Tecnologias

Node.js, Express, MongoDB com Mongoose e Vue 3. O código é escrito em TypeScript e compilado para JavaScript. A API REST segue MVC, com middlewares de autenticação, autorização e validação. O Vuetify fornece os componentes das telas Vue.

## Rodar com Docker Compose

1. Copie o `.env.example` da raiz para `.env`. Preencha `JWT_SECRET` com um segredo aleatório longo. Se mudar o endereço da aplicação, ajuste também `FRONTEND_URL`.
2. Copie `backend/.env.example` para `backend/.env` se ele ainda não existir. Preencha `GEMINI_API_KEY` para usar IA. Configure o SMTP para enviar os e-mails de redefinição de senha em produção.
3. Execute `docker compose up -d --build --wait`.
4. Abra <http://localhost:8080>. A verificação da API está em <http://localhost:8080/api/saude>.

O Compose usa um banco próprio. O MongoDB está acessível localmente na porta 27018 e o Nginx serve as telas e encaminha a API. Para publicar em outro endereço, defina a URL pública em `FRONTEND_URL` e configure HTTPS no ambiente de hospedagem.

O banco de produção começa vazio. Defina `DOTE_ADMIN_NOME`, `DOTE_ADMIN_EMAIL`, `DOTE_ADMIN_CPF` e `DOTE_ADMIN_SENHA` no ambiente do seu terminal. Depois, execute:

~~~sh
docker compose exec -e DOTE_ADMIN_NOME -e DOTE_ADMIN_EMAIL -e DOTE_ADMIN_CPF -e DOTE_ADMIN_SENHA backend npm run criar-admin
~~~

Entre como administrador para aprovar as contas cadastradas. No Diamante, o resultado indica se foi gerado pelo Gemini ou pelas regras do sistema.

## Desenvolvimento e testes

- Banco local: `docker compose up -d mongo`.
- Back-end: em `backend`, copie `.env.example` para `.env` se necessário, execute `npm ci` e `npm run dev`. O servidor escuta na porta 3000.
- Front-end: em `frontend`, execute `npm ci` e `npm run dev`. Abra <http://localhost:5173>.
- Testes: em `backend`, execute `npm test`. Cada processo usa um banco temporário com prefixo `dote_test_`, na porta 27018.
- Testes do front-end: em `frontend`, execute `npm test` (não depende de MongoDB).
- Build: execute `npm run build` em `backend` e em `frontend`.

Para popular um banco de desenvolvimento descartável, rode `npm run seed` em `backend`. O comando apaga os dados do banco indicado por `MONGODB_URI`. As contas de demonstração são `allan@dote.com` e `caio@dote.com` (senha `12345678`) e `admin@dote.com` (senha `admin123`).

## Roteiro da apresentação

1. Cadastre uma conta e aprove-a no painel administrativo.
2. Crie uma chave, salve um contato e envie pontos. Confira os dois saldos e o comprovante.
3. Crie uma caixinha, guarde pontos e consulte o extrato.
4. Abra o Diamante e gere uma análise do relatório com o Gemini configurado.
5. Solicite a redefinição da senha e entre com a nova senha.


## Organização e manutenção

No backend, rotas declaram acesso e validação; controllers convertem requisições e respostas; services concentram regras; models definem persistência. Reutilize os schemas de `validators/comum.ts`, os DTOs de `utils/dto.ts` e a resolução de chaves de `chavePixService`. Não coloque regras de saldo no controller.

No frontend, `api` concentra HTTP; `stores` guarda sessão e estado compartilhado; `composables` reúne lógica de telas; `components` contém apresentação reutilizável; `views` compõe as páginas. Use `AlertaErro` para erros, `useAcao` para ações assíncronas e `useListaPaginada` para listas paginadas que precisam descartar respostas antigas. Prefira os componentes existentes de valores, filtros, confirmação e relatórios antes de criar novos.

A fila de `utils/serializar.ts` coordena operações por recurso dentro de um único processo. Caixinhas e transferências compensam alterações de saldo quando o registro do extrato falha; avisos são posteriores e não invalidam operações concluídas. Testes de regressão exercitam falhas de persistência, concorrência, datas e isolamento de sessão.

Limites atuais: a fila em memória e a compensação não garantem atomicidade diante de queda do processo ou falha da própria compensação. Antes de usar múltiplas instâncias ou dinheiro real, é necessário um MongoDB com replica set, transações e idempotência persistente. O TypeScript ainda permite tipos implícitos e o backend usa predominantemente CommonJS; a tipagem estrita deve ser introduzida por módulo, com contratos explícitos da API. Os testes do frontend cobrem lógica de estado; fluxos visuais completos ainda precisam de testes de navegador.
