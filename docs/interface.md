# Interface do DOTE

## Ler e navegar

| Elemento | Função |
| --- | --- |
| **Menu principal** | Abre Início, Transferências, Caixinhas e Extrato. Fica no topo no desktop e na parte inferior no celular. |
| **Olho no cabeçalho** | Oculta ou exibe os valores da interface. Os arquivos exportados continuam incluindo os valores. |
| **Tema** | Alterna entre os temas claro e escuro. |
| **Diamante** | Abre avisos e análise. O contador indica os avisos ainda não lidos. |
| **Perfil** | Dá acesso aos dados da conta, edição de perfil, senha e saída. |
| **Menu administrativo** | Agrupa Clientes, Painel e Sistema para aprovação, indicadores, taxas e data simulada. |

## Manter a interface

A fonte é **Share Tech Mono**. Os temas `dote` e `doteClaro` ficam no [plugin Vuetify](../frontend/src/plugins/vuetify.ts). Use tokens semânticos como `primary`, `surface` e `error` para manter o contraste nos dois temas. Os estilos compartilhados ficam em [main.css](../frontend/src/styles/main.css).

| Padrão | Componente ou fonte |
| --- | --- |
| Marca do app | [MarcaDote](../frontend/src/components/MarcaDote.vue) e [arquivos públicos da marca](../frontend/public/marca) |
| Saldo e entrada de valores | [SaldoCard](../frontend/src/components/SaldoCard.vue) e [CampoValor](../frontend/src/components/CampoValor.vue) |
| Filtros e período | [FiltrosExtrato](../frontend/src/components/FiltrosExtrato.vue) e [SeletorPeriodo](../frontend/src/components/SeletorPeriodo.vue) |
| Erros e paginação | [AlertaErro](../frontend/src/components/AlertaErro.vue) e [Paginacao](../frontend/src/components/Paginacao.vue) |
| Gráfico com alternativa em tabela | [BarrasMensais](../frontend/src/components/BarrasMensais.vue) |
| Avisos e análise | [DiamanteModal](../frontend/src/components/DiamanteModal.vue) |

Ao alterar uma tela, confira a versão desktop e móvel, o foco de teclado e os temas claro e escuro. Use títulos e rótulos para distinguir estados de carregamento, lista vazia e erro. Preserve a preferência de movimento reduzido nas animações.
