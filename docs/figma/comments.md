# Comentários do arquivo Figma

Foram coletados os 62 comentários públicos do arquivo oficial, de #3 a #66 (#22 e #62 não existem ou foram removidos). Nenhum tem resposta dos autores do desafio. São observações de outros candidatos, tratadas aqui como **insumo**, não como requisito. Cada um recebeu uma decisão, e os que geram mudança visual entram em [`ARCHITECTURE.md`](../../ARCHITECTURE.md#7-desvios-do-figma).

Os nomes dos autores foram omitidos de propósito. Muitos comentários são genéricos (“Falta de margin”) e dependem da posição do pin no canvas. Esses foram agrupados e são resolvidos pela consolidação de tokens.

## Escopo e comportamento

| #   | Observação                                                           | Decisão                                                                                                                  |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 3   | Faltam frames mobile de confirmação, perfil e carteiras, e de tablet | Layout responsivo derivado dos componentes existentes. O enunciado já exige isso                                         |
| 4   | Filtros combináveis pedem checkboxes                                 | **Aceito:** checkboxes multi-seleção com contador                                                                        |
| 5   | Slider impreciso no mobile; preferir campos mín./máx.                | **Aceito em parte:** slider mantido (fidelidade) e sincronizado com dois inputs numéricos                                |
| 6   | Quais são as opções de ordenação?                                    | Definidas em [screens.md](screens.md#início-22-mobile-145226)                                                            |
| 7   | Botão “voltar” na página 2?                                          | **Sim:** “anterior” aparece a partir da página 2                                                                         |
| 8   | O que esse botão faz? (sem pin identificado)                         | Toda ação sem função no escopo fica com `aria-disabled` e dica                                                           |
| 9   | Hex das cores; tema claro?                                           | Hex extraídos em [design-tokens.md](design-tokens.md). Só tema escuro                                                    |
| 10  | Stepper “−” deve ser desabilitado no mínimo                          | **Aceito**                                                                                                               |
| 11  | Header com border-bottom só em uma tela                              | **Uniformizado:** o mesmo header (com divisor) em todas as telas                                                         |
| 12  | Coleções fora de ordem alfabética                                    | **Aceito:** ordem alfabética                                                                                             |
| 13  | Card de NFT com background de outra cor                              | Usar `surface-card` em todos os cards                                                                                    |
| 14  | “Entrar” continua depois do login?                                   | **Não:** vira menu do usuário (avatar + nome)                                                                            |
| 15  | Stepper mobile diferente do desktop                                  | **Aceito:** um único componente                                                                                          |
| 16  | Sem espaço para o botão de excluir no carrinho (mobile)              | **Aceito:** o desktop já tem a lixeira; o card mobile ganha o botão                                                      |
| 17  | Letras W/C/D no lugar de ícones                                      | **Aceito:** ícones Iconly com significado                                                                                |
| 18  | ENS é só Ethereum                                                    | **Aceito:** campo ENS só com rede Ethereum                                                                               |
| 19  | Pendente e recusado não estão desenhados                             | Mesmo cartão da confirmação com estados próprios                                                                         |
| 20  | Formulário do comprador some no mobile                               | Mesmas etapas em todos os tamanhos                                                                                       |
| 21  | ID do token diverge entre carrinho e pagamento                       | Fixtures com `tokenId` único e consistente                                                                               |
| 23  | Miniaturas da galeria: edições ou variações?                         | Variações/vistas da mesma obra. A edição é escolhida nos botões de edição                                                |
| 58  | Modal de “Criar conta” sem backdrop                                  | **Aceito:** overlay preto a 60 %                                                                                         |
| 63  | Imagem que “não deveria estar aqui”                                  | Revisar o pin na implementação; elemento decorativo sem função é removido                                                |
| 64  | Texto copiado contém “cultura”, que não aparece no design            | Texto truncado no layout. A implementação mostra o texto completo, com quebra                                            |
| 66  | Círculos decorativos mal posicionados                                | Os círculos do banner de destaque (Rectangle 30/31/32) ficam como decoração `aria-hidden`, reposicionados dentro do card |

## Alinhamento, espaçamento e uniformidade

| #                                  | Resumo                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| 24                                 | Seletor de imagens muito próximo da imagem principal                                              |
| 25, 28, 36, 38, 47, 49, 50, 54, 57 | Botões, ícones, textos ou containers não centralizados                                            |
| 26, 45, 51, 65                     | Textos ou itens desalinhados                                                                      |
| 27, 43, 44, 52, 53, 55             | Falta de margin/padding ou espaçamento não uniforme                                               |
| 29, 32, 56                         | Fundo da imagem descentralizado ou “vazando”                                                      |
| 30, 31, 34, 40, 48                 | Falta de uniformidade entre componentes                                                           |
| 33                                 | Botão sem raio                                                                                    |
| 35, 37, 42                         | Tipografia/proximidade de texto com o título                                                      |
| 39                                 | Preferir botão full-width                                                                         |
| 41                                 | Ícone desproporcional ao botão                                                                    |
| 46                                 | Badge com borda arredondada desnecessária                                                         |
| 59                                 | Nav do header desalinhada verticalmente com logo e botões                                         |
| 60                                 | Primeira coluna de cards desalinhada com a sidebar (“Cosmic Bloom #118”)                          |
| 61                                 | Espaço vertical desigual entre as fileiras de cards (alturas 356/350/300 confirmadas na extração) |

**Decisão única para o grupo:** a implementação usa auto layout com tokens consolidados (escala de espaçamento, raios, alturas fixas de card e de botão). Por construção, isso elimina os desalinhamentos e as variações pontuais. Não se replica o erro de pixel. Fica registrado como desvio geral “normalização de espaçamentos e alinhamentos”.
