# Arquitetura e regras do DOTE

Para conhecer os fluxos pelas telas, comece pelo [guia do produto](produto.md). Os padrões de navegação, tema e componentes estão no [guia de interface](interface.md).

## Caminho de uma requisição

~~~mermaid
flowchart LR
  Vue["Tela Vue"] --> Cliente["Cliente Axios"]
  Cliente --> Express["Rotas e middlewares"]
  Express --> Controller["Controller"]
  Controller --> Service["Service"]
  Service --> Model["Model Mongoose"]
  Model --> Mongo["MongoDB"]
~~~

| Onde | Responsabilidade |
| --- | --- |
| [Rotas](../backend/src/routes) e [middlewares](../backend/src/middlewares) | Identificar o endpoint, aplicar autenticação e autorização e validar a entrada com Zod |
| [Controllers](../backend/src/controllers) | Receber os dados HTTP e devolver a resposta pública |
| [Services](../backend/src/services) e [models](../backend/src/models) | Executar regras, consultar o MongoDB e persistir documentos |
| [API Vue](../frontend/src/api) e [stores](../frontend/src/stores) | Centralizar as chamadas HTTP e o estado de sessão, conta e preferências |
| [Views](../frontend/src/views), [componentes](../frontend/src/components) e [composables](../frontend/src/composables) | Montar as telas e reutilizar carregamento, erros e paginação |

**Exemplo** Em Contatos, a view chama `contatosApi`. A rota valida os dados, o controller usa `contatoService` e o DTO define os campos retornados ao cliente.

## API e dados

A referência completa está no Swagger em `/api-docs/` e em [config/swagger.ts](../backend/src/config/swagger.ts). Os exemplos abaixo usam o prefixo `/api`.

| Operação | Endpoint |
| --- | --- |
| Login e sessão | `POST /api/auth/login` · `GET /api/auth/me` |
| Contatos | `GET /api/contatos` · `POST /api/contatos` · `PUT /api/contatos/:id` · `DELETE /api/contatos/:id` |
| Pix | `POST /api/pix/transferencias` · `GET /api/pix/destinatario?chave=…` |
| Extrato e comprovante | `GET /api/transacoes` · `GET /api/transacoes/:id` |
| Diamante | `POST /api/relatorio/analise` |
| Relógio | `POST /api/admin/relogio/avancar` |

As rotas protegidas recebem `Authorization: Bearer <token>`. Perfis e situação da conta restringem o acesso. Erros são JSON com `message`, `codigo` e, quando disponível, `detalhes`. Logout, troca de senha e bloqueio invalidam tokens anteriores pela versão da sessão. Redefinição usa um token de uso único, com hash armazenado no banco e validade de 15 minutos de tempo real.

O MongoDB guarda usuários, chaves, contatos, caixinhas, recorrências, transações, notificações e a configuração do relógio e das taxas. Os models são a referência dos campos e índices.

## Saldo, rendimento e relógio

- **Pontos.** Campos `*Centavos` usam inteiros. `1250` representa P$ 12,50. A aprovação da conta lança um depósito de P$ 1.000,00.
- **Pix.** O service resolve a chave, verifica o destinatário e condiciona o débito ao saldo. A operação registra o extrato e gera comprovante. Se uma gravação falhar, o service tenta compensar as alterações já feitas.
- **Caixinhas.** Até seis por conta. Juros simples acumulam diariamente e são lançados no dia 1. Por padrão, 105% do Índice Points de 12% a.a. resulta em 12,6% a.a. O saldo em conta fica fora do cálculo.
- **Agendamentos.** Transferências mensais nos dias 1 a 28. O avanço do relógio executa as recorrências ativas e acumula rendimento dia a dia. O administrador inicia o avanço pela tela **Sistema**.
- **Diamante.** O frontend mostra se o resultado veio do Gemini ou de regras locais. O servidor envia totais e categorias ao Gemini. Identificadores, descrições de transações e chaves ficam no DOTE.

## Interface e manutenção

- Use os tokens do [tema Vuetify](../frontend/src/plugins/vuetify.ts) nos temas claro e escuro. As classes compartilhadas ficam em [main.css](../frontend/src/styles/main.css).
- Reaproveite `CampoValor`, `AlertaErro`, `FiltrosExtrato` e `Paginacao`. Use `formatMoney` para exibir P$ e `useListaPaginada` para listas que precisam descartar respostas antigas.
- O ocultador de valores protege a leitura na tela. Os relatórios exportados incluem os valores das movimentações. PDF usa a impressão do navegador.

<details>
<summary>Ao adicionar uma rota</summary>

1. Defina a entrada em um schema e aplique autenticação, autorização e validação na rota.
2. Deixe a regra de negócio no service e use um DTO nos retornos com dados internos. Para datas de negócio, use o relógio simulado.
3. Registre a operação no Swagger e cubra o comportamento com um teste em `backend/test/`.

</details>

## Limites técnicos

| Área | Estado atual |
| --- | --- |
| Concorrência | A fila de operações e a trava do relógio vivem no processo. Instâncias separadas podem executar operações simultâneas. |
| Recuperação | A compensação cobre falhas tratadas. Queda do processo ou falha durante o estorno pode exigir conciliação. Transações MongoDB e idempotência persistente são necessárias para operação distribuída com garantia de saldo. |
| Tipagem e testes | TypeScript ainda aceita tipos implícitos. Os testes automatizados do Vue cobrem lógica e estado. Use a [demonstração](demonstracao.md) para conferir os fluxos visuais. |
