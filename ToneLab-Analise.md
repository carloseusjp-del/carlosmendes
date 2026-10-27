# ToneLab Chroma — mapa do plugin fornecido

As seis partes recebidas formam um arquivo 7z completo de **187.712.230 bytes**. A leitura/extração terminou sem erro; os CRCs dos cabeçalhos, comprimento total, tamanho dos arquivos extraídos e hashes foram conferidos.

O bundle contém `Info.plist` e **`Contents/Win64/ToneLab.ofx`**, uma DLL Windows x64 de **509.365.248 bytes**. O SHA-256 do original permanece `f74ecc8a51d1f75918304e214c6b40844ead89767895f3d65a80d4736d1cd27e`.

Este documento é um inventário técnico. **Este inventário registra a análise anterior à versão 1.4.0 e compara o Mendes Color 1.3.0. A implementação própria posterior é descrita em [FERRAMENTAS.md](FERRAMENTAS.md).** A lista de nomes/configurações não estabelece equivalência matemática ou visual entre os programas.

## O que foi recuperado

- **13 seções** de interface, **126 entradas de controle** e **152 identificadores**, contando inícios/fins de grupos.
- As entradas incluem **73 controles numéricos, 16 booleanos, 17 menus, 18 botões, um rótulo e um estado textual oculto**. Dois botões são de compra/renovação e não são ferramentas de edição.
- **65 tabelas de look criativo**, além de None: 11 Signature, 12 Cinema Blue, 11 Cinema Warm, 12 Commercial, 7 Ethereal Green e 12 Terra Tones.
- **31 conversões de câmera**, além de None; **17 Finishing Tones**, além de None; **16 espaços de LUT customizada**, além de None.

## Método e limites

O REA 6.8.0, em Node.js 24.22.1, inspecionou exportações, importações e recursos PE. O limite de leitura foi ajustado a 536.870.912 bytes, superior ao tamanho observado. As evidências identificam o mesmo digest do binário.

Python/libarchive fez a remontagem e extração dos volumes. Capstone/pefile e leitura de dados mapearam referências e tabelas. Uma emulação CPU limitada, com Unicorn, recuperou o resultado do construtor de metadados `0x1804bf4b0`: todas as APIs importadas foram interceptadas, com diretório virtual vazio e lista de chaves/pacotes vazia. Nenhum arquivo de licença real, API de ativação, trial, DllMain, host Resolve ou renderizador foi executado por esse procedimento.

Essa emulação é complementar ao REA, não uma funcionalidade atribuída ao REA. O modelo sem estado local afeta disponibilidade de menus: CreativeLut apresentou somente None. As 65 tabelas criativas foram inventariadas separadamente nos registros estáticos; sua presença não comprova disponibilidade na interface de uma licença específica.

As faixas numéricas abaixo são **faixas declaradas/de exibição**; não foi estabelecido que o host bloqueie toda entrada fora delas. Presets foram recuperados pelo nome e padrão selecionado. **Os valores aplicados por cada mudança de preset e as fórmulas dos efeitos ainda precisam de rastreamento específico e comparação.** O original e suas tabelas não foram modificados. Os dados de LUT não foram copiados para o Mendes Color nem incluídos neste relatório para distribuição.

## Comparação com Mendes Color 1.3.0

| Seção ToneLab | Situação no Mendes Color 1.3.0 |
|---|---|
| LUTs | Avata 2 e .cube próprios; 19 looks independentes, sem equivalência com os 65 originais |
| Basic Adjustments | Ajustes gerais próprios; faltam controles separados de Lift/Gain/Highlights/Fade/Colour Richness e Bleach Bypass contínuo |
| Black & White Point | Controles próprios com outra escala; sem os três presets nem RGB/Luma equivalentes validados |
| Custom LUT | Um arquivo .cube; sem 16 slots e sem importação .3dl |
| Finishing Tones | Sem seção equivalente |
| Split Tone | Alguns looks têm coloração tonal; sem a ferramenta e seus controles independentes |
| Skin Tones | Sem seleção e correção de pele |
| Color Punch | Saturação global própria; sem os seis ajustes por faixa de cor |
| Vignette | Ausente |
| Film Grain | Ausente |
| Halation | Implementação própria com Desligado/Mínimo/Médio/Alto; sem os dez controles contínuos e máscara do ToneLab |
| Bloom | Ausente |
| Color Space | Recodificação opcional própria; sem o conjunto completo de primárias/transferências do ToneLab |

## Catálogo completo

### LUTs

| Controle | Tipo | Faixa de exibição | Padrão |
|---|---|---|---|
| Purchase license (`PurchaseFull`) | Botão | — | — |
| Renew subscription (`Renew`) | Botão | — | — |
| Conversion LUT (`ConversionLut`) | Menu | — | None |
| Creative LUT (`CreativeLut`) | Menu | — | None |
| Prev LUT (`PrevLut`) | Botão | — | — |
| Next LUT (`NextLut`) | Botão | — | — |
| Intensity (`CreativeIntensity`) | Numérico | 0 a 200 | 100 |

**Conversion LUT**: None, Apple Log (iPhone), Apple Log 2 (iPhone), Blackmagic BRAW, Canon C-Log 1, Canon C-Log 2, Canon C-Log 3, DJI D-Log (Mavic 3), DJI D-Log (Mavic 4/Zenmuse X9), DJI D-Log Vivid (Mavic 4), DJI D-Log M (Mavic 4), DJI D-Log M Vivid, DJI D-Log M, DJI D-Log 2, Freefly Ember (HLG neutral), Freefly Ember (HLG vivid), Freefly Ember (Rec709), Fujifilm F-Log, Fujifilm F-Log 2, GoPro Log, Insta360 I-Log, Nikon N-Log, Panasonic V-Log, RED RAW (RWG Log3G10), Sony S-Log 3 (SGamut3 Cine), Sony S-Log 2, Arri C3, Arri C4, GoPro Log2, Olympus Log, Samsung Log, GoPro Log2 (V1).

**Creative LUT**: None.

### Basic Adjustments

| Controle | Tipo | Faixa de exibição | Padrão |
|---|---|---|---|
| Enable (`BasicEnable`) | Liga/desliga | — | Ligado |
| Exposure (`Exposure`) | Numérico | -4 a 4 | 0 |
| Lift (`Lift`) | Numérico | -100 a 100 | 0 |
| Gamma (`Gamma`) | Numérico | -100 a 100 | 0 |
| Gain (`Gain`) | Numérico | -100 a 100 | 0 |
| Highlights (`Highlights`) | Numérico | -200 a 200 | 0 |
| Temperature (`Temperature`) | Numérico | -100 a 100 | 0 |
| Tint (`Tint`) | Numérico | -60 a 100 | 0 |
| Saturation (`Saturation`) | Numérico | 0 a 2 | 1 |
| Contrast (`Contrast`) | Numérico | 0.6 a 2 | 1 |
| Fade (`Fade`) | Numérico | 0 a 100 | 0 |
| Colour Richness (`ColourRichness`) | Numérico | -100 a 100 | 0 |
| Bleach Bypass (`BleachBypass`) | Numérico | 0 a 80 | 0 |
| Intensity (`BasicIntensity`) | Numérico | 0 a 200 | 100 |
| Reset Basic Adjustments (`ResetBasic`) | Botão | — | — |

### Black & White Point

| Controle | Tipo | Faixa de exibição | Padrão |
|---|---|---|---|
| Enable (`BwEnable`) | Liga/desliga | — | Desligado |
| Preset (`BwPreset`) | Menu | — | More Range |
| Black Point (`BlackPoint`) | Numérico | -45 a 45 | 4 |
| White Point (`WhitePoint`) | Numérico | -100 a 100 | -10 |
| Color Mode (`ColorMode`) | Menu | — | Normal |
| Intensity (`BwIntensity`) | Numérico | 0 a 200 | 100 |
| Reset Black & White Point (`ResetBw`) | Botão | — | — |

**Preset**: Custom, More Range, Less Contrast, Dark Shadows.

**Color Mode**: Normal, RGB, Luma.

### Custom LUT

| Controle | Tipo | Faixa de exibição | Padrão |
|---|---|---|---|
| Custom LUT (`CustomLut`) | Menu | — | None |
| File Name (`CustomLutFilename`) | Rótulo | — | — |
| Load Custom LUT... (`LoadCustomLut`) | Botão | — | — |
| Prev LUT (`PrevCustomLut`) | Botão | — | — |
| Next LUT (`NextCustomLut`) | Botão | — | — |
| Intensity (`CustomIntensity`) | Numérico | 0 a 200 | 100 |
| CustomLutSlotMap (`CustomLutSlotMap`) | Estado oculto | — | — |

**Custom LUT**: None, -, -, -, -, -, -, -, -, -, -, -, -, -, -, -, -.

### Finishing Tones

| Controle | Tipo | Faixa de exibição | Padrão |
|---|---|---|---|
| Finishing Tones (`FinishingTones`) | Menu | — | None |
| Prev Tones (`PrevFinishingTone`) | Botão | — | — |
| Next Tones (`NextFinishingTone`) | Botão | — | — |
| Intensity (`FinishingIntensity`) | Numérico | 0 a 200 | 50 |

**Finishing Tones**: None, Clean Blue Mono, Deep Blue Pop, Muted Blue Steel, Teal & Aqua Split, Cine Green Highs, Vivid Green Highs, Pale Green Soften, Earthy Warm Green, Dark Green Mood, Rich Gold Glow, Shadow Red Cast, Classic Retro Film, Azure Noir, Evergreen, Moss, Teal Noir, Vintage Wish.

### Split Tone

| Controle | Tipo | Faixa de exibição | Padrão |
|---|---|---|---|
| Enable (`SplitToningEnable`) | Liga/desliga | — | Desligado |
| Preset (`SplitToningPreset`) | Menu | — | Teal & Orange |
| Correct Neutrals (`SplitProtectNeutrals`) | Liga/desliga | — | Ligado |
| Amount (`SplitAmount`) | Numérico | 0 a 0.4 | 0.3 |
| Hue (`SplitHueAngle`) | Numérico | 0 a 360 | 20 |
| Balance (`SplitPivot`) | Numérico | 0 a 1 | 0.3 |
| Intensity (`SplitIntensity`) | Numérico | 0 a 200 | 100 |
| Reset Split Tone (`ResetSplitToning`) | Botão | — | — |

**Preset**: Custom, Teal & Orange, Cool Shadows, Warm Highlights, Bleach Bypass, Cross Process.

### Skin Tones

| Controle | Tipo | Faixa de exibição | Padrão |
|---|---|---|---|
| Enable (`SkinEnable`) | Liga/desliga | — | Desligado |
| Skin Preset (`SkinPreset`) | Menu | — | Vibrant |
| Saturate Skin (`SkinSaturate`) | Numérico | -1 a 1 | 0.2 |
| Skin Luminance (`SkinColour`) | Numérico | -1 a 1 | 0 |
| Skin tone (`SkinPop`) | Numérico | -60 a 60 | 0 |
| Tone center (`SkinCenter`) | Numérico | -30 a 30 | 0 |
| Tone range (`SkinRange`) | Numérico | 15 a 65 | 40 |
| Brightness center (`SkinBrightness`) | Numérico | 0 a 1 | 0.5 |
| Brightness Range (`SkinBrightnessRange`) | Numérico | 0.25 a 1.75 | 1 |
| Show Mask (`ShowSkinSelection`) | Liga/desliga | — | Desligado |
| Intensity (`SkinIntensity`) | Numérico | 0 a 200 | 100 |
| Reset Skin Tones (`ResetSkinTones`) | Botão | — | — |

**Skin Preset**: Custom, Vibrant, Muted, Cool / Neutralize Red, Warm / Add Warmth, Matte / Reduce Shine.

### Color Punch

| Controle | Tipo | Faixa de exibição | Padrão |
|---|---|---|---|
| Enable (`ColorIntensityEnable`) | Liga/desliga | — | Desligado |
| Preset (`ColorIntensityPreset`) | Menu | — | Punch / Vibrant |
| Global (`ColorIntensityGlobal`) | Numérico | 0 a 2 | 1.25 |
| Red (`ColorIntensityRed`) | Numérico | -1 a 1 | 0 |
| Yellow (`ColorIntensityYellow`) | Numérico | -1 a 1 | 0 |
| Green (`ColorIntensityGreen`) | Numérico | -1 a 1 | 0 |
| Cyan (`ColorIntensityCyan`) | Numérico | -1 a 1 | 0 |
| Blue (`ColorIntensityBlue`) | Numérico | -1 a 1 | 0 |
| Magenta (`ColorIntensityMagenta`) | Numérico | -1 a 1 | 0 |
| Highlight (`ColorIntensityHighlight`) | Liga/desliga | — | Desligado |
| Intensity (`ColorIntensityIntensity`) | Numérico | 0 a 200 | 100 |
| Reset Color Intensity (`ResetColorIntensity`) | Botão | — | — |

**Preset**: Custom, Punch / Vibrant, Warm UP, De-Blue, Cool Down, De-Warm, De-Green, Lush.

### Vignette

| Controle | Tipo | Faixa de exibição | Padrão |
|---|---|---|---|
| Enabled (`VignetteEnable`) | Liga/desliga | — | Desligado |
| Preset (`VignettePreset`) | Menu | — | Whisper |
| Amount (`VignetteExposure`) | Numérico | -2.3 a 1.1 | -0.25 |
| Size (`VignetteSize`) | Numérico | 0 a 100 | 60 |
| Feather (`VignetteFeather`) | Numérico | 0 a 100 | 100 |
| Aspect Ratio (`VignetteAspectRatio`) | Numérico | -1 a 1 | -0.333 |
| Center X (`VignetteCenterX`) | Numérico | -1 a 1 | 0 |
| Center Y (`VignetteCenterY`) | Numérico | -1 a 1 | 0 |
| Show Mask (`VignetteMaskMode`) | Liga/desliga | — | Desligado |
| Intensity (`VignetteIntensity`) | Numérico | 0 a 200 | 100 |
| Reset Vignette (`ResetVignette`) | Botão | — | — |

**Preset**: Custom, Whisper, Focus, Spotlight, Letterbox.

### Film Grain

| Controle | Tipo | Faixa de exibição | Padrão |
|---|---|---|---|
| Enabled (`GrainEnable`) | Liga/desliga | — | Desligado |
| Preset (`GrainPreset`) | Menu | — | Light · High |
| Grain size (`GrainScale`) | Numérico | 1 a 50 | 12 |
| Grain strength (`GrainAmount`) | Numérico | 0 a 100 | 35 |
| Grain in highlights (`GrainHighlights`) | Numérico | 0 a 100 | 65 |
| Grain in shadows (`GrainShadows`) | Numérico | 0 a 100 | 30 |
| Grain in midtones (`GrainMidtones`) | Numérico | 0 a 100 | 55 |
| Particle colour (`GrainColor`) | Numérico | 0 a 100 | 65 |
| Particle clamping (`GrainClusterSize`) | Numérico | 0.5 a 3 | 1.6 |
| Particle orientation (`GrainRotation`) | Numérico | 0 a 3 | 1 |
| Softness (`GrainBlur`) | Numérico | 0 a 100 | 15 |
| Colored (`GrainIsColored`) | Liga/desliga | — | Ligado |
| Intensity (`GrainIntensity`) | Numérico | 0 a 200 | 100 |
| Reset Grain (`ResetGrain`) | Botão | — | — |

**Preset**: Custom, Heavy · Low, Heavy · High, Bold · Low, Bold · High, Light · Low, Light · High, Fine · Low, Fine · High.

### Halation

| Controle | Tipo | Faixa de exibição | Padrão |
|---|---|---|---|
| Enabled (`HalationEnable`) | Liga/desliga | — | Desligado |
| Presets (`HalationProfile`) | Menu | — | Intense |
| Threshold (`HalationSourceLimiter`) | Numérico | 0 a 100 | 35 |
| Spread (`HalationBackgroundGain`) | Numérico | 0 a 150 | 60 |
| Smoothness (`HalationSmoothness`) | Numérico | 0 a 100 | 50 |
| Inner glow (`HalationLocalDiffusion`) | Numérico | 0 a 100 | 25 |
| Output glow (`HalationGlobalDiffusion`) | Numérico | 0 a 100 | 35 |
| Glow strength (`HalationAmplify`) | Numérico | 0 a 100 | 70 |
| Glow Colour (`HalationHue`) | Numérico | 0 a 100 | 55 |
| Cool Glow (`HalationBlueComp`) | Numérico | 0 a 100 | 100 |
| Overall intensity (`HalationImpact`) | Numérico | 0 a 100 | 100 |
| Show Mask (`HalationMaskMode`) | Liga/desliga | — | Desligado |
| Reset (`ResetHalation`) | Botão | — | — |

**Presets**: Custom, Intense, Strong, Moderate, Soft.

### Bloom

| Controle | Tipo | Faixa de exibição | Padrão |
|---|---|---|---|
| Enabled (`BloomEnable`) | Liga/desliga | — | Desligado |
| Profile (`BloomProfile`) | Menu | — | 35 mm / Super 35 |
| Highlights (`BloomHighlights`) | Numérico | 0 a 100 | 80 |
| Source Limiter (`BloomSourceLimiter`) | Numérico | 0 a 100 | 30 |
| Details (`BloomDetails`) | Numérico | 0 a 100 | 60 |
| Diffusion (`BloomDiffusion`) | Numérico | 0 a 100 | 50 |
| Amplify (`BloomAmplify`) | Numérico | 0 a 100 | 50 |
| Save Lights (`BloomSaveLights`) | Numérico | 0 a 100 | 100 |
| Saturation (`BloomSaturation`) | Numérico | 0 a 100 | 100 |
| Impact (`BloomImpact`) | Numérico | 0 a 100 | 50 |
| Show Mask (`BloomMaskMode`) | Liga/desliga | — | Desligado |
| Reset Bloom (`ResetBloom`) | Botão | — | — |

**Profile**: Custom, 8 mm / Super 8, 16 mm / Super 16, 35 mm / Super 35, 65 mm / 70 mm.

### Color Space

| Controle | Tipo | Faixa de exibição | Padrão |
|---|---|---|---|
| Input color space (`InputColorSpace`) | Menu | — | Rec709 |
| Input transfer function (`InputGamma`) | Menu | — | Gamma 2.4 |
| Output color space (`OutputColorSpace`) | Menu | — | Rec709 |
| Output transfer function (`ConversionOutput`) | Menu | — | Gamma 2.4 |

**Input color space**: Rec709, DaVinci Wide Gamut / Intermediate, Rec2020.

**Input transfer function**: Gamma 2.4, Gamma 2.2, Gamma 1.96 (Rec.709-A approximation), sRGB, Linear, PQ (203-nit reference white), HLG (1000-nit display, 203-nit white).

**Output color space**: Rec709, DaVinci Wide Gamut / Intermediate, Rec2020.

**Output transfer function**: Gamma 2.4, Gamma 2.2, Gamma 1.96 (Rec.709-A approximation), sRGB, Linear, PQ (203-nit reference white), HLG (1000-nit display, 203-nit white).

## Famílias de looks criativos

- **Signature**: Signature 1, Signature 2, Signature 3, Signature 4, Signature 5, Signature 6, Signature 7, Signature 8, Signature 9, Signature 10, Signature 11.
- **Cinema Blue**: Cinema Blue 1, Cinema Blue 2, Cinema Blue 3, Cinema Blue 4, Cinema Blue 5, Cinema Blue 6, Cinema Blue 7, Cinema Blue 8, Cinema Blue 9, Cinema Blue 10, Cinema Blue 11, Cinema Blue 12.
- **Cinema Warm**: Cinema Warm 1, Cinema Warm 2, Cinema Warm 3, Cinema Warm 4, Cinema Warm 5, Cinema Warm 6, Cinema Warm 7, Cinema Warm 8, Cinema Warm 9, Cinema Warm 10, Cinema Warm 11.
- **Commercial**: Commercial 1, Commercial 2, Commercial 3, Commercial 4, Commercial 5, Commercial 6, Commercial 7, Commercial 8, Commercial 9, Commercial 10, Commercial 11, Commercial 12.
- **Ethereal Green**: Ethereal Green 1, Ethereal Green 2, Ethereal Green 3, Ethereal Green 4, Ethereal Green 5, Ethereal Green 6, Ethereal Green 7.
- **Terra Tones**: Terra Tones 1, Terra Tones 2, Terra Tones 3, Terra Tones 4, Terra Tones 5, Terra Tones 6, Terra Tones 7, Terra Tones 8, Terra Tones 9, Terra Tones 10, Terra Tones 11, Terra Tones 12.

As 65 tabelas têm dimensão **65³**, 274.625 amostras em RGBA float32. Cabeçalhos, contagem, finitude, extremos e hashes dos payloads foram verificados. O conteúdo total desses registros é 285.611.040 bytes. A interpolação e a codificação efetivamente usadas pela cadeia de render ainda não foram validadas.

## Dados para a próxima implementação

[Catálogo de parâmetros JSON](ToneLab-parameter-catalog.json) contém nomes, tipos, descrições, opções, faixas e padrões. [Inventário das tabelas JSON](ToneLab-creative-lut-inventory.json) contém dimensões, offsets e hashes, sem os payloads. Os manifestos registram a remontagem e os arquivos fornecidos. O pacote de evidências contém as inspeções REA completas.

Para afirmar uma reprodução exata, ainda é necessário recuperar/validar os valores de cada preset, a ordem e as fórmulas do processamento, a interpolação/codificação dos looks e o comportamento espacial/temporal de grão e brilhos. A comparação de exportações antes/depois no host é uma fonte independente para essa validação. Sem isso, uma implementação própria deve ser identificada como equivalente funcional em avaliação, sem promessa de resultados idênticos.
