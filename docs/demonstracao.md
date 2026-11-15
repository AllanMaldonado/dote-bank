# Demonstração do DOTE

Este roteiro acompanha o produto pela perspectiva de quem usa o banco. Antes de começar, tenha uma conta pagadora, uma recebedora e uma sessão de administrador. Veja o [guia local](desenvolvimento.md#dados-de-demonstração) para carregar dados fictícios.

> [!TIP]
> Para contextualizar quem está vendo pela primeira vez, diga que **P$ são pontos fictícios** e que **a data do banco é simulada**. Isso explica por que transferências e rendimentos podem ser demonstrados em poucos minutos.

## Caminho principal

| Etapa | O que fazer na tela | O que conferir |
| --- | --- | --- |
| **Abrir conta** | Cadastre uma conta fictícia e aprove em **Clientes → Fila de aprovação** | A conta passa de pendente para ativa e ganha P$ 1.000,00 |
| **Preparar o destino** | Cadastre uma chave na conta recebedora. Na origem, salve a chave como contato e edite o apelido | O contato atualizado aparece na lista e a chave identifica o recebedor certo |
| **Transferir** | Envie P$ 12,50 da conta pagadora para a recebedora e abra o comprovante | Saída e entrada com o mesmo valor nos dois extratos |
| **Guardar e agendar** | Aplique pontos em uma caixinha e confira um agendamento ativo | A aplicação aparece no extrato e o agendamento mostra o dia do mês |
| **Avançar a data** | No admin, abra **Sistema** e avance até cruzar o dia 1 e o dia do agendamento | O extrato mostra o rendimento da caixinha e a transferência agendada |
| **Consultar e analisar** | Filtre o relatório, exporte um arquivo e abra o Diamante | O relatório segue os filtros, e a análise indica Gemini ou regras locais |
| **Recuperar acesso** | Solicite redefinição para uma conta fictícia e use o link recebido | A senha nova autentica e o link já usado deixa de funcionar |

Com o seed recém-carregado, o relógio começa em **05/11/2026**. **+1 mês** cruza **01/12**, quando o rendimento é lançado, e **05/12**, quando uma transferência já agendada é executada. Para demonstrar o Gemini real, configure a chave. Para mostrar o envio da redefinição por e-mail, configure o SMTP. Veja o [guia de deploy](deploy.md).

## Acompanhar o Pix no código

Na IDE, use a transferência demonstrada como fio condutor. Aponte a [rota](../backend/src/routes/pixRoutes.ts), que valida a entrada, e o [controller](../backend/src/controllers/pixController.ts), que chama o service e devolve o comprovante. No [service](../backend/src/services/pixService.ts), mostre a resolução do destino, o débito, o crédito e o registro no extrato. O exemplo de P$ 12,50 chega ao backend como `valorCentavos: 1250`.

Para entender os comportamentos de cada área, consulte o [guia do produto](produto.md).

<details>
<summary>Requisitos da entrega em vídeo de LP II</summary>

- [ ] Grave de **10 a 15 minutos**, com os dois integrantes aparecendo no vídeo.
- [ ] Mostre o sistema em execução, indique as tecnologias e explique uma parte do código com a IDE aberta.
- [ ] Publique no YouTube. Teste a reprodução do link em janela anônima e envie o link na atividade de vídeo do Aprender.
- [ ] Envie o código em um ZIP separado na atividade **Projeto Final**. Inclua README com os integrantes, código, lockfiles e exemplos de configuração. Deixe `.env` reais, `node_modules/`, `dist/` e `.vercel/` fora do ZIP.

</details>
