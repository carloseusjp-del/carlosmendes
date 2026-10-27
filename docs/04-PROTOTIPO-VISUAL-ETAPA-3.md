# Etapa 3 — protótipo visual do Mendes Home

## Estado

O protótipo visual navegável está pronto para avaliação local. Ele permanece separado do aplicativo webOS e não foi instalado na TV. Nenhuma configuração da LG 55UR8750PSA foi alterada.

Arquivos principais:

- `prototype/index.html`
- `prototype/styles.css`
- `prototype/prototype.js`
- `prototype/ABRIR-PROTOTIPO.cmd`

## Direção visual

A identidade **Mendes Home** usa formas prismáticas, vidro fosco, reflexos discretos, bordas iluminadas e profundidade. A referência de vidro líquido foi traduzida para uma composição original, sem ícones, ativos ou componentes proprietários da Apple.

O protótipo contém:

- tela inicial com seleção em destaque;
- faixa de oito favoritos demonstrativos;
- cartões para aplicativos, recentes e ambientes;
- quatro fundos: Aurora, Horizonte, Laguna e Grafite;
- painel de aparência com transparência, desfoque, qualidade visual e movimento;
- reorganização visual dos favoritos;
- navegação por setas, OK/Enter e Voltar/Escape;
- suporte adicional a mouse para avaliação no computador.

Os aplicativos e contadores são dados demonstrativos. A listagem e a abertura de aplicativos reais ficaram fora desta etapa, conforme combinado.

## Decisões para o webOS 24

- A interface usa **1920×1080 lógico**, resolução indicada para o plano de interface do webOS TV. A televisão faz a composição no painel 4K.
- HTML, CSS e JavaScript sem framework reduzem inicialização, memória e tamanho do pacote.
- O modo **Equilibrado** é o padrão, com desfoque de 14 px.
- O modo **Máximo** limita o desfoque a 20 px.
- O modo **Leve** remove o desfoque em tempo real e mantém o contraste com gradientes opacos.
- Somente os grandes planos compartilhados recebem `backdrop-filter`; cartões e ícones simulam vidro com gradientes e reflexos.
- Os brilhos do fundo usam gradientes radiais estáticos, sem animação contínua ou imagens 4K na memória.
- O foco anima principalmente `transform`, com duração de 180 ms.
- Há uma opção própria para reduzir movimento.
- Se `backdrop-filter` não estiver disponível, o fallback é ativado automaticamente.

## Navegação para avaliação

| Ação | Teclado de teste | Controle webOS planejado |
|---|---|---|
| Navegar | Setas | Setas |
| Selecionar | Enter | OK/roda |
| Organizar favoritos | `E` | Botão verde |
| Alternar fundo | `T` | Botão azul |
| Fechar/voltar | Escape | Voltar |

## Verificação executada

O teste automatizado foi executado em Chromium, com viewport de 1920×1080:

- documento sem rolagem ou estouro horizontal/vertical;
- oito favoritos renderizados;
- foco inicial e atualização do destaque confirmados;
- painel de aparência aberto e fechado pelo fluxo de navegação;
- troca de papel de parede confirmada;
- fallback do modo Leve confirmado;
- zero erros JavaScript e zero erros no console;
- 20 comandos rápidos de navegação processados em 52 ms no ambiente de teste.

O tempo acima verifica a lógica no computador; ele não representa FPS medido na televisão. O teste de desempenho no hardware real será feito somente após a aprovação visual e autorização para instalar um IPK de desenvolvimento.

## Pontos para aprovação

Antes da integração, devem ser avaliados:

1. identidade e nome Mendes Home;
2. tamanhos, distância e contraste dos elementos;
3. quatro opções de fundo;
4. intensidade e aparência do vidro;
5. organização da tela inicial;
6. comportamento do painel de aparência;
7. velocidade percebida das animações.

Após a aprovação, a interface poderá ser promovida para o aplicativo webOS e receber persistência de preferências, consulta permitida de aplicativos, abertura por ID e testes reais no controle Magic Remote.
