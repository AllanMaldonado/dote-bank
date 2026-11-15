# DOTE por dentro

O DOTE é um banco digital de pontos fictícios (P$). Um cliente recebe pontos ao ter a conta aprovada, pode transferi-los a outra conta e pode reservar parte do saldo em caixinhas. O administrador controla a data do banco para demonstrar rendimentos e transferências agendadas.

## Onde encontrar cada recurso

| Tela | Quem usa | O que dá para fazer |
| --- | --- | --- |
| **Abrir conta** · `/cadastro` | Visitante | Criar conta, entrar e acompanhar a aprovação |
| **Início** · `/inicio` | Cliente | Ver saldo em conta, caixinhas e últimas movimentações |
| **Transferências** · `/transferencias` | Cliente | Enviar pontos, acessar chaves e contatos e agendar transferências mensais |
| **Caixinhas** · `/caixinhas` | Cliente | Criar metas, aplicar, resgatar, editar e excluir |
| **Extrato** · `/extrato` | Cliente | Buscar e filtrar lançamentos, abrir comprovantes e acessar o relatório |
| **Diamante** | Cliente | Ler avisos e pedir uma análise financeira |
| **Meu perfil** · `/perfil` | Cliente | Ver dados da conta, editar nome e celular, trocar senha e sair |
| **Clientes, Painel e Sistema** · `/admin` | Administrador | Gerenciar contas, consultar indicadores e relatórios, ajustar taxas e avançar a data |

## Da abertura ao uso da conta

~~~mermaid
flowchart LR
  P["Pendente"] -->|Aprovar| A["Ativa · depósito de P$ 1.000"]
  P -->|Rejeitar| R["Rejeitada"]
  A -->|Bloquear| B["Bloqueada"]
  B -->|Desbloquear| A
~~~

O cadastro nasce **pendente** e já permite entrar na tela de espera. Só a conta ativa pode movimentar pontos. Contas bloqueadas ou rejeitadas ficam impedidas de entrar. O administrador pode excluir contas pendentes ou rejeitadas. Para uma conta ativa, use o bloqueio.

**Senha esquecida.** Na tela de login, abra **Esqueci a senha**, informe o e-mail e siga o link recebido. Ele expira em 15 minutos de tempo real e tem uso único. O envio depende do SMTP configurado. Veja [desenvolvimento](desenvolvimento.md) ou [deploy](deploy.md).

## Enviar e receber pontos

1. O recebedor registra uma chave em **Transferências → Chaves**.
2. Quem envia informa a chave ou abre um contato salvo. A tela mostra o nome do destino e parte do CPF para conferência.
3. O pagador informa valor, categoria e mensagem opcional. O saldo é debitado da origem e creditado no destino.
4. O comprovante abre após o envio e fica acessível pelo extrato. Quem envia vê uma saída e quem recebe vê uma entrada com o mesmo valor.

| Regra | Comportamento |
| --- | --- |
| **Chaves** | Até 5 por conta, únicas no DOTE. CPF e e-mail vêm do cadastro, celular exige número cadastrado e a chave aleatória é gerada pelo sistema. A aleatória pode ser regenerada. |
| **Contatos** | Até 50 por conta. Salve por apelido e chave, edite ou exclua pela agenda. O destino é conferido novamente no envio. |
| **Validações da transferência** | A conta de destino precisa estar ativa. O sistema recusa envio para a própria conta e transferência sem saldo disponível. |
| **Comprovante** | Abra pelo extrato e use **Imprimir / salvar PDF**. As partes da transferência e o administrador têm acesso pelo sistema. |

## Caixinhas, rendimento e relógio

Cada conta pode ter **até seis caixinhas**, com nome e meta opcional. Aplicar move pontos da conta para a caixinha. Resgatar move de volta. Excluir uma caixinha devolve o saldo antes de removê-la. Aplicações e resgates aparecem no extrato como movimentos internos.

Por padrão, as caixinhas rendem **105% do Índice Points**, que começa em **12% ao ano**. A taxa efetiva inicial é **12,6% ao ano**. O saldo em conta fica fora do cálculo. A meta atingida pode gerar um aviso do Diamante.

~~~mermaid
flowchart LR
  S["Admin → Sistema"] --> A["Avançar a data"]
  A --> J["Acumular juros por dia"]
  J --> M["No dia 1, creditar rendimento"]
  M --> X["Executar agendamentos do dia"]
  X --> E["Conferir no extrato e nos avisos"]
~~~

**Agendamentos.** Cada transferência mensal pode ser editada ou pausada. Escolha um dia de **1 a 28**. Na data simulada, o agendamento ativo é processado. Saldo insuficiente ou destino indisponível gera uma falha no extrato sem transferência de pontos. O avanço só acontece quando o administrador o solicita.

## Extrato, relatório e Diamante

| Recurso | Leitura na prática |
| --- | --- |
| **Extrato** | Filtre por período, categoria, descrição ou tipo de movimentação. Abra o lançamento para consultar o comprovante. |
| **Relatório** | Veja entradas, saídas, rendimentos e evolução mensal. Aplicar e resgatar pontos de uma caixinha são movimentos internos, excluídos destes totais. |
| **Exportação** | Use **Exportar** para gerar HTML, Markdown ou PDF via impressão. O relatório exportado inclui os valores mesmo se estiverem ocultos na interface. |
| **Avisos** | O Diamante reúne eventos coma transferência recebido, meta e rendimento. É possível marcar avisos como lidos. |
| **Análise** | **Pedir análise** no Diamante usa do início do ano simulado até a data atual do banco. Os filtros da tela de relatório se aplicam ao relatório. Com Gemini configurado, o resultado identifica a IA e o modelo. Em caso de indisponibilidade, aparece a análise por regras. |

Para ver os fluxos em ordem, use a [demonstração](demonstracao.md). Para consultar a API e as regras de implementação, veja a [arquitetura](arquitetura.md).
