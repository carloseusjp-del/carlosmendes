# Ferramentas avançadas — Mendes Color 1.4.0

Esta versão amplia o plugin para testes manuais no Resolve Windows. As
ferramentas e receitas são implementações próprias; não são os algoritmos ou
LUTs do ToneLab, nem uma reprodução visual certificada desse produto.

## Uso rápido

- Para D-Log M original da Avata 2, selecione sua Input LUT embutida primeiro.
- Escolha um look em Creative Look e dose Look Strength.
- Abra a seção desejada e marque Enable/Enabled. Escolher um preset pronto
  já ativa a seção. Custom conserva os ajustes atuais.
- ANTERIOR/PRÓXIMO percorrem cada menu de forma circular. Os menus continuam
  disponíveis. Reset restaura só a seção correspondente, incluindo seu estado
  inicial desligado; não apaga os ajustes antigos de Camera, Looks & Base.
- Ajustar um controle de receita marca o preset como Custom. Intensidade é
  independente. Quando já há animação, receitas e resets mudam o tempo atual
  sem apagar os demais keyframes. As alterações são agrupadas para desfazer.

As seções começam desligadas para conservar os projetos existentes. Os ajustes
antigos permanecem disponíveis e se acumulam com Basic Adjustments. Exposure
é um ganho criativo em RGB de trabalho após a normalização; não é exposição
scene-linear recuperada da câmera. Gamma tonal e Creative Gamma são ajustes
artísticos, distintos do gamma de saída do Color Space/Resolve.

## LUTs customizadas

Selecione Slot 01 a Slot 16 em Custom LUT e escolha o arquivo em **File (.cube /
.3dl)**. Se escolher um arquivo com None selecionado, o Slot 01 é usado.
O botão Load Custom LUT abre o seletor múltiplo do Windows; aceita até 16
arquivos, preenchendo a partir do slot selecionado e voltando ao início quando
necessário. Arquivos já nesses slots podem ser substituídos pela seleção.

O menu, seus botões e os caminhos dos slots são persistidos nos parâmetros do
projeto. Alternar o slot restaura seu campo de arquivo. Um slot vazio é neutro;
um caminho configurado mas inacessível gera erro no host. Os arquivos precisam
continuar disponíveis no disco. As tabelas têm cache por instância, invalidado
por caminho, tamanho e data de modificação. Custom Intensity=0 retira a
contribuição de cor, mas um arquivo selecionado ainda é validado.

A LUT customizada criativa é aplicada depois da LUT técnica e do look principal,
e antes de Finishing Tones. Não use outra normalização técnica nesse slot sobre
uma imagem já normalizada sem definir o fluxo.

Suporte: .cube puramente 3D, tamanho 2–65, domínio explícito e interpolação
trilinear. .3dl Autodesk em ordem blue-fast, com malha de entrada crescente de
2–65 pontos; a malha não uniforme é respeitada. Sem Mesh, a saída .3dl é tratada
como 12 bits; com `Mesh expoente bits`, usa a dimensão e precisão declaradas
(até 16 bits). Variações de formato não reconhecidas são rejeitadas. Shapers
1D de .cube continuam não suportados. Nenhuma LUT é executada como código.

## Cor e máscaras

Split Tone colore sombras e luzes com matizes complementares. Correct Neutrals
reduz o efeito nos pixels pouco saturados. Skin Tones seleciona por matiz,
saturação e luminância: madeira e outras áreas de cor semelhante também podem
ser selecionadas. Show Mask ajuda a ajustar Tone Center/Range e Brightness.
Color Punch aplica saturação global e por seis faixas de matiz; Highlight
restringe a contribuição às regiões mais claras.

Vignette usa uma elipse com centro, aspecto e feather ajustáveis. Letterbox é
uma receita de vinheta horizontal, não barras pretas sólidas nem recorte.
Uma máscara de diagnóstico por vez é ativada na interface; ativar outra limpa
os demais toggles de máscara, preservando os ajustes de cor e efeitos.

## Grão e brilhos

Film Grain usa ruído procedural determinístico por coordenada/frame, com pesos
para sombras, meios-tons e altas luzes. Grain Scale/Particle Clamping controlam
a estrutura, Particle Orientation muda a orientação e Particle Colour a
independência dos canais. Softness suaviza a imagem sob o grão, com compensação
por alfa. Intensity=0 retira tanto ruído quanto suavização. Os oito presets são
receitas próprias Heavy/Bold/Light/Fine em duas intensidades.

A Halation rápida mantém Desligado/Mínimo/Médio/Alto. Ao habilitar **Halation
Advanced**, ela assume o processamento do halo. Os perfis Intense/Strong/
Moderate/Soft preenchem os controles; Threshold, Spread e Smoothness ajustam
a seleção de fontes/fundos, Inner/Output Glow os raios, Glow Strength/Colour e
Cool Glow a energia/cor. Show Mask mostra a contribuição sobre preto.

Bloom espalha a cor das fontes claras. Seus quatro perfis sugerem extensões
diferentes de glow, sem medir películas reais. Highlights/Source Limiter
selecionam as fontes, Details preserva estrutura, Diffusion controla a extensão,
Save Lights protege o centro claro e Saturation colore o glow. Impact dosa a
contribuição completa. Os efeitos podem gerar RGB acima de 1; não há hard
clipping adicional do motor. O alfa e as dimensões do quadro são preservados.

## Conversões de cor

Color Space é opcional e começa desligado. Com Input LUT=None, a entrada
indicada é decodificada e convertida para RGB de trabalho Rec.709 Gamma 2.4.
Depois dos efeitos, a saída é convertida para as primárias/transferência
selecionadas. Quando uma Input LUT está ativa, ela define a normalização e a
conversão de entrada desta seção é ignorada; a saída configurada continua valendo.

DWG sempre usa DaVinci Intermediate, independentemente do menu gamma. São
suportadas Rec.709, DaVinci Wide Gamut e Rec.2020; Gamma 2.4/2.2/1.96, sRGB,
Linear, PQ e HLG. PQ usa 203-nit reference white e pico de 10.000 nits; HLG
inclui OOTF de display de 1.000 nits e gamma de sistema 1,2. Os transforms não
fazem tone mapping nem compressão de gamut. Float negativo é preservado por
extensões matemáticas, não por uma codificação física válida de luz negativa.
Gamma 1.96 não é uma correção universal para redes sociais. Compare com a
expectativa do host e não some outro CST/RCM automaticamente.

## Ordem e desempenho

Input LUT/conversão de entrada → controles/look da seção inicial → Basic →
Black & White Point → Custom LUT → Finishing Tones → Split Tone → Skin Tones →
Color Punch → Vignette → suavização/grão → Halation → Bloom → conversão de saída →
Effect Mix com o sinal original.

Todos os efeitos são CPU. Os filtros espaciais somam a vizinhança necessária
ao pedir o source ROI, inclusive na combinação de suavização, Halation e Bloom.
Isso evita emendas entre tiles nos testes locais. Em 4K/vários nodes, avalie a
velocidade e use cache/proxy do Resolve conforme necessário. Interface,
file picker, aparência e desempenho reais ficam para o teste manual no Windows.
