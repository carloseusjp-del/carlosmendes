# Mendes Color 1.5.0

Plugin OpenFX para **DaVinci Resolve no Windows x64**, com LUT Avata 2 embutida,
**84 opções de look**, ferramentas de cor e efeitos, **16 slots de LUT** e
botões **ANTERIOR / PRÓXIMO** em todos os menus. Versão para avaliação manual.

## Instalar ou atualizar

Baixe **MendesColor-1.5.0-Setup.exe**, feche o Resolve e execute o instalador.
Autorize a solicitação de administrador e confirme o destino mostrado.
Reabra o Resolve e procure **Mendes Color** em **Effects / Open FX**, grupo Mendes.

O Setup funciona offline, verifica os arquivos por SHA-256, instala na pasta
OpenFX e guarda a versão anterior em
`C:\Program Files\Common Files\MendesColor\Backups\`.
Não é necessário copiar a pasta do plugin. Ele pede que você feche o Resolve
quando estiver aberto, sem encerrar seus projetos. O executável não tem
assinatura digital de editor; confira a origem e o SHA-256 publicado.

O ZIP portátil e `Install.ps1` continuam disponíveis como alternativa. Para
instalação manual, copie **MendesColor.ofx.bundle inteiro**, com o Resolve fechado,
para `C:\Program Files\Common Files\OFX\Plugins\`.

## Aceleração por GPU

A versão 1.5.0 adiciona **GPU via OpenCL**, incluindo LUTs/looks, ferramentas
de cor, grão, Halation e Bloom. Em **Camera, Looks & Base → Processing**,
deixe **GPU (OpenCL; CPU fallback)**. A seleção dá preferência à GPU NVIDIA.
O primeiro quadro pode aguardar a compilação do driver; os seguintes reutilizam
o motor. A CPU também foi otimizada e trabalha em paralelo quando o host oferece
a suíte de threads. Consulte [GPU.md](GPU.md) para requisitos, memória e como
confirmar o dispositivo no log. O modo CUDA do Resolve pode ser mantido.

## Começar com a Avata 2

1. Use o material original em **D-Log M**. Num fluxo manual DaVinci YRGB,
   configure a saída/monitoramento em **Rec.709 Gamma 2.4**.
2. Selecione **Input LUT → DJI Avata 2 D-Log M to Rec.709 (embedded)**.
3. Mantenha **LUT Output Transfer=Keep LUT output**, **Creative Gamma=1** e
   **Effect Mix=1**. Comece por Creative Look=Neutral e compare os estilos
   com ANTERIOR/PRÓXIMO.
4. Experimente Golden Hour, Sunset Glow, Moody Forest e Commercial Teal, ou
   as novas famílias numeradas identificadas como **(Mendes)**.

A mesma LUT técnica é aplicada antes dos estilos. Look Strength dosa apenas
esse estilo. **Effect Mix=0** desliga toda a cadeia, inclusive LUT e efeitos.
Não normalize o mesmo sinal novamente com outra LUT técnica/CST/RCM sem definir
os espaços. O plugin não detecta a gestão de cor do projeto.

O `.cube` enviado é preservado byte a byte e **não declara gamma de saída**.
O arquivo cita Avata 2 no nome e Mavic 3 Pro num comentário interno; essa
proveniência foi mantida. Configurar Rec.709 Gamma 2.4 no Resolve não prova uma
curva 2.4 no arquivo. Consulte [LUT-AVATA2.md](LUT-AVATA2.md).

## Ferramentas da versão 1.5.0

As novas seções começam **desligadas**, preservando projetos anteriores.
Selecionar um preset pronto ativa a seção correspondente; para ajuste manual,
marque **Enable / Enabled**. As seções podem aparecer como abas ou grupos
expansíveis conforme a interface OpenFX do Resolve.

| Seção | O que oferece |
|---|---|
| Basic Adjustments | Exposure, Lift, Gamma, Gain, Highlights, balanço, saturação, contraste, Fade, Colour Richness e Bleach Bypass |
| Black & White Point | Três presets, modo Normal/RGB/Luma e intensidade |
| Custom LUT | 16 slots persistidos no projeto; arquivos .cube e .3dl; seletor múltiplo Windows |
| Finishing Tones | 17 acabamentos próprios e intensidade |
| Split Tone | Cores complementares por zona tonal, proteção de neutros, Amount/Hue/Balance |
| Skin Tones | Seleção por matiz e luminância, saturação, brilho, rotação de matiz e máscara |
| Color Punch | Saturação global e seis faixas de cor, com opção de restringir às altas luzes |
| Vignette | Exposição, tamanho, feather, proporção, centro e máscara |
| Film Grain | Oito presets, tamanho, força, zonas tonais, cor, agrupamento, orientação e suavização da imagem |
| Halation | Menu rápido Desligado/Mínimo/Médio/Alto, mantido da 1.3 |
| Halation Advanced | Quatro presets e controles de threshold, spread, suavidade, halos interno/externo, energia, cor, compensação azul, intensidade e máscara |
| Bloom | Quatro perfis, detecção de luzes, detalhes, difusão, proteção de luzes, saturação, intensidade e máscara |
| Color Space | Conversões Rec.709/DWG/Rec.2020 e Gamma 2.4/2.2/1.96, sRGB, Linear, PQ e HLG |

**Halation Advanced ativada substitui a Halation rápida**, evitando duplicar o
halo. Cada seção tem seus presets, controles, navegação e Reset quando aplicável.
As máscaras de pele, vinheta, Halation e Bloom são exclusivas na interface.

Os ajustes de Camera, Looks & Base e Basic Adjustments se acumulam. Comece com
um conjunto neutro e altere uma seção de cada vez. **Color Space é opcional**;
com a LUT Avata 2, comece com essa seção desligada. Gamma 1.96 é uma aproximação;
PQ/HLG usam branco de referência de 203 nits e HLG inclui OOTF de display 1000 nits.

Veja [FERRAMENTAS.md](FERRAMENTAS.md) para uso, ordem de processamento e limites,
[LOOKS.md](LOOKS.md) para estilos e [HALATION.md](HALATION.md) para o menu rápido.

## Alcance desta entrega

É uma implementação **própria** das ferramentas e presets. Não carrega o ToneLab,
não depende da instalação ou licença dele e não incorpora seus algoritmos nem
suas 65 LUTs comerciais. As novas variações de look têm “(Mendes)” no nome.
Não foi estabelecido resultado visual idêntico ao ToneLab. O catálogo analisado
serviu para organizar ferramentas e faixas de interface.

As conversões técnicas embutidas continuam sendo a LUT Avata 2 fornecida;
para outras câmeras use uma LUT técnica adequada no campo de arquivo. Não foram
criados presets de normalização de outras câmeras sem suas tabelas.

Passaram **14.478 verificações locais** de cor, LUT, Halation, ferramentas
avançadas, OpenCL, regressão de otimização, host simulado e instalação. O binário foi compilado
para Windows x64 e inspecionado pelo REA. **O motor GPU desta versão e o Setup ainda precisam de confirmação no seu
Resolve Windows**.
O teste visual será feito manualmente pelo usuário; não depende do vídeo enviado.

O processamento é **GPU OpenCL ou CPU, RGBA float32**, com alfa preservado e
suporte a tiles. Os kernels foram executados em um dispositivo OpenCL de teste
em CPU; não houve medição em GPU NVIDIA. Não há promessa de tempo real 4K. Máscaras de
pele usam cor/luminância, sem reconhecimento de pessoas ou proteção automática.

Diagnóstico: `%LOCALAPPDATA%\MendesColor\OpenFX.log`, versão 1.5.0.
O tratamento da descrição opcional que corrigiu o carregamento na 1.0.2 foi
preservado. Os controles e índices antigos foram mantidos; os novos grupos
começam desligados. Consulte [VALIDACAO.md](VALIDACAO.md).

## Compilar

GCC/G++ C++17, Make e Python 3:

```sh
make test
make windows WIN_CXX=x86_64-w64-mingw32-g++
python3 scripts/package.py
make installer WIN_CXX=x86_64-w64-mingw32-g++ WIN_WINDRES=x86_64-w64-mingw32-windres
```

No Developer PowerShell x64 do Visual Studio 2022:

```powershell
.\scripts\build-windows.ps1
python scripts/package.py
```

O script MSVC compila o plugin e os testes portáveis; o Setup entregue é gerado
com MinGW-w64. A compilação MSVC não foi exercitada neste ambiente Linux.
A tabela Avata 2 e o registro de controles são gerados com Python antes do build.
Os pacotes de fontes incluem os headers oficiais OpenFX e suas licenças.
