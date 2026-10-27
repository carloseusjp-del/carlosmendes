# Halation — Mendes Color 1.5.0

Na aba ou seção **Halation**, escolha o nível em **Halation Preset** ou use
**ANTERIOR / PRÓXIMO** para comparar as opções sem abrir o menu.

| Preset | Resultado esperado |
|---|---|
| Desligado | Sem processamento de Halation; padrão para preservar projetos |
| Mínimo | Halo quente discreto e mais estreito |
| Médio | Halo mais visível e espalhado |
| Alto | Halo mais intenso e amplo, para uma estética marcada |

Procure uma cena com reflexos, janelas, sol ou outras altas luzes junto de
áreas mais escuras. Comece por Mínimo. Cenas sem altas luzes podem apresentar
pouca ou nenhuma mudança. Os pixels claros geram halo nos seus vizinhos, com
predomínio vermelho e pequena contribuição verde/azul, formando um tom quente.

Com o material original D-Log M da Avata 2, selecione primeiro a LUT embutida.
O fluxo é **LUT → correção/look → Halation → Effect Mix**. Input LUT=None é
apropriado quando a imagem já está convertida. O halo não faz outra normalização.
Look Strength dosa apenas o estilo de cor; **Effect Mix=0** desliga a cadeia
inteira, incluindo LUT e Halation. Para desligar apenas o halo use Desligado.

![Comparação sintética dos quatro níveis](docs/HALATION-preview.png)

A figura é calculada pelo mesmo código C++ em recortes sintéticos de RGB de
exibição, com tamanho de referência de 1080 linhas. Não usa filmagem nem prova
a aparência no seu monitor. Para regenerar: `make preview-halation`, que usa
Matplotlib apenas para montar a figura. Compilar e usar o plugin não exige essa
dependência nem Python instalado no computador do usuário.

## Processamento e limites

É uma interpretação artística de halation; não mede ou reproduz uma película
específica. A máscara usa luma RGB após os ajustes de cor, com início suave em
0,65 e resposta completa em 0,95. A emissão é limitada a 4 para conter fontes
HDR extremas. Essa proteção não limita o RGB da imagem de saída.

Três passagens separáveis de blur de caixa aproximam uma distribuição gaussiana
finita. O raio de cada passagem na referência de 1080 linhas é 3, 5 ou 8 pixels;
as quantidades são 0,16, 0,30 e 0,48. A contribuição usa somente a diferença
positiva entre emissão borrada e local, evitando aquecer uniformemente as áreas
claras. A cor adicionada tem proporção RGB 1 / 0,23 / 0,04.

O tamanho escala com a altura do frame, render scale e pixel aspect ratio;
um limite de 128 pixels por passagem evita raios patológicos. O render pede
vizinhança suficiente para as três passagens, inclusive em tiles. Fora do quadro
a emissão é zero; a saída mantém as dimensões originais. O efeito pode produzir
RGB acima de 1, sem hard clipping adicional do motor.

A máscara pondera a emissão pelo alfa. Pixels completamente transparentes não
emitem, e o alfa da imagem não muda; não são criadas áreas de opacidade ao redor
de objetos isolados. Na CPU são usados buffers locais por render, sem acesso
temporal. Desligado não cria esses buffers. Não há promessa de reprodução em
tempo real, especialmente em 4K ou com vários nodes.

Os testes comparam tiles e imagens inteiras, inclusive com source ROI recortada,
origem não nula, stride negativo, alfa premultiplicado, cancelamento, LUT, look
e mistura global. A aparência e a interface no Resolve real ainda precisam ser
confirmadas com sua filmagem no Windows.

A versão 1.4 acrescenta **Halation Advanced**, descrita em [FERRAMENTAS.md](FERRAMENTAS.md). Quando ativada, ela substitui este menu rápido; seus quatro presets e controles têm receitas próprias.

Na versão 1.5.0, a Halation rápida e a avançada também podem rodar na GPU
OpenCL, conforme **Processing**. Consulte [GPU.md](GPU.md).
