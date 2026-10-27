# Etapa 3 — protótipo visual do Mendes Home

## Estado

A versão visual 0.2.0 está pronta para avaliação local. Ela permanece separada do aplicativo webOS e não foi instalada na TV. Nenhuma configuração da LG 55UR8750PSA foi alterada.

Arquivos principais:

- `prototype/index.html`
- `prototype/styles.css`
- `prototype/prototype.js`
- `prototype/ABRIR-PROTOTIPO.cmd`

## Direção visual

O Mendes Home agora usa um fundo branco com passagem muito suave para cinza-claro, brilho central difuso e sombra periférica discreta, como luz natural refletida numa parede.

A composição adota como referência estrutural a prévia do projeto [Free My TV](https://github.com/simbasjungles/free-my-tv/blob/main/.github/preview.webp): título e abas no alto, uma vitrine assimétrica, utilidades no canto superior e uma prateleira de aplicativos na base. O código, os desenhos editoriais, os ícones, a marca e os componentes foram criados para o Mendes Home. Nenhuma imagem, logomarca ou implementação do projeto de referência foi incorporada.

O protótipo contém:

- cabeçalho “Para você” com abas Descobrir, Filmes e Séries;
- três cartões editoriais originais desenhados em SVG;
- dock Liquid Glass com oito aplicativos demonstrativos;
- foco com contorno, profundidade e movimento curto;
- gaveta inferior com TV ao vivo, HDMI, atalhos, clima e relógio;
- quatro fundos: Parede iluminada, Névoa, Areia e Noite;
- painel de aparência com intensidade do vidro, desfoque, qualidade e movimento;
- reorganização visual dos aplicativos;
- navegação por setas, OK/Enter e Voltar/Escape;
- suporte adicional a mouse para avaliação no computador.

Aplicativos, entradas, clima e conteúdo editorial ainda são demonstrativos. A consulta e a abertura de itens reais permanecem fora desta etapa.

## Decisões para o webOS 24

- A interface usa 1920×1080 lógico, resolução indicada para o plano de interface do webOS TV.
- HTML, CSS e JavaScript sem framework reduzem inicialização, memória e tamanho do pacote.
- O modo Equilibrado é o padrão, com desfoque de 14 px.
- O modo Máximo limita o desfoque a 20 px.
- O modo Leve remove o desfoque em tempo real e mantém contraste com gradientes opacos.
- Na tela principal, somente o dock usa `backdrop-filter`.
- Na gaveta, o dock e dois widgets são os três planos desfocados simultâneos.
- Cartões, botões e ícones simulam vidro com gradientes e reflexos estáticos.
- O fundo usa gradientes radiais estáticos, sem imagens 4K ou animação contínua.
- O foco anima `transform` e a opacidade de um contorno, com duração entre 150 e 180 ms.
- Há uma opção própria para reduzir movimento.
- Se `backdrop-filter` não estiver disponível, o fallback é ativado automaticamente.

## Navegação para avaliação

| Ação | Teclado de teste | Controle webOS planejado |
|---|---|---|
| Navegar | Setas | Setas |
| Selecionar | Enter | OK/roda |
| Abrir a gaveta | Seta para baixo no dock | Seta para baixo |
| Organizar aplicativos | `E` | Botão verde |
| Alternar fundo | `T` | Botão azul |
| Fechar gaveta/voltar | Escape | Voltar |

## Verificação executada

O teste automatizado foi executado em Chromium nas resoluções 1920×1080 e 1366×768:

- documento sem rolagem ou estouro horizontal/vertical;
- três cartões editoriais e oito aplicativos renderizados;
- navegação horizontal preservando a linha visual;
- gaveta aberta pela seta para baixo e fechada por Escape;
- foco transferido corretamente para a primeira entrada;
- painel de aparência aberto e fechado pelo fluxo de navegação;
- fundo Parede iluminada confirmado como padrão;
- fallback do modo Leve confirmado;
- zero erros JavaScript e zero erros no console;
- 20 comandos rápidos de navegação processados em 120 ms no ambiente de teste.

O tempo acima verifica a lógica no computador; ele não representa FPS medido na televisão. O teste no hardware real será feito somente depois da aprovação visual e da autorização para instalar um IPK de desenvolvimento.

## Próxima decisão

Antes da integração, devem ser avaliados o fundo claro, a proporção dos três cartões, o tamanho do dock, as cores dos aplicativos, a gaveta inferior e a velocidade percebida do foco. Depois da aprovação, a interface poderá ser promovida para o aplicativo webOS e receber persistência, consulta permitida de aplicativos, abertura por ID e testes no Magic Remote.
