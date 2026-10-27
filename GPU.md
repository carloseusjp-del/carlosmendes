# GPU — Mendes Color 1.5.0

O motor OpenCL executa na placa de vídeo a LUT de entrada, os 84 looks,
controles de cor, LUT criativa, acabamentos, Split Tone, seleção de pele,
Color Punch, vinheta, grão e sua suavização, Halation, Bloom e conversões
opcionais de espaço/gamma. O código é próprio do Mendes Color. Os desfoques usam somas deslizantes e
transposição em blocos 16×16 para manter o acesso à memória da GPU eficiente,
sem reservar outro quadro completo.

## Usar no Resolve Windows

1. Feche o Resolve, instale **MendesColor-1.5.0-Setup.exe** e reabra.
2. Em **Camera, Looks & Base → Processing**, deixe
   **GPU (OpenCL; CPU fallback)**. Essa é a opção padrão, inclusive ao abrir
   projetos anteriores. **CPU** permite comparar com o processamento da CPU.
3. Use o driver NVIDIA com suporte OpenCL instalado. O plugin dá preferência
   a uma GPU NVIDIA disponível, como a RTX 3050 Laptop; não instala drivers.
   Não exige CUDA Toolkit, OpenCL SDK nem ferramentas de desenvolvimento.

Não é necessário trocar o modo CUDA do Resolve para OpenCL: o plugin cria
sua própria fila OpenCL e recebe/devolve os quadros pela interface OpenFX CPU.
Portanto ainda há transferência CPU↔GPU. Não é uma implementação do render
CUDA do host nem processamento sem cópias. A decodificação do vídeo e os
outros nodes continuam sob controle do Resolve.

A primeira aplicação pode pausar brevemente enquanto o driver compila os
kernels. O programa compilado, as LUTs e os buffers são reutilizados durante
a sessão. Ao fechar/descarregar o plugin, os recursos são liberados.

## Confirmar a placa usada

Abra `%LOCALAPPDATA%\MendesColor\OpenFX.log` e procure uma linha da versão
**1.5.0** com **GPU OpenCL initialized**, seguida do nome do dispositivo.
Ela registra a inicialização do motor. A opção Processing deve continuar em
GPU para os renders seguintes utilizarem esse motor.

Se aparecer **GPU fallback to CPU**, o motivo é registrado na mesma linha.
Sem driver/dispositivo compatível, com erro de compilação ou falta de memória,
o render continua pela CPU otimizada. Feche o Resolve depois de corrigir o
driver para permitir uma nova inicialização. A GPU precisa oferecer OpenCL
1.2 e `cl_khr_fp64`; a dupla precisão é usada para estabilizar o grão e as
somas dos filtros. Não há tentativa de usar um dispositivo OpenCL CPU em
produção. A GPU NVIDIA tem prioridade sobre uma GPU integrada compatível.

## Memória, imagem e velocidade

Uma fila/workspace é compartilhada pelos nodes e frames, evitando criar
contextos e reservas de VRAM ilimitadas. Os buffers de trabalho ficam limitados
ao menor valor entre **1,25 GiB** e **25% da memória global informada pelo
driver**. O conjunto completo de filtros em 3840×2160 usa aproximadamente
**886 MiB** em sete buffers RGBA float32, além de LUTs e recursos do driver.
Parte dessa memória fica reservada para reutilização até o plugin descarregar.
O Resolve e outros aplicativos também precisam de VRAM. Imagens maiores que
o orçamento seguem para a CPU; não há redução silenciosa da qualidade.

O cálculo de cor na GPU usa float32, com pequenas diferenças de arredondamento
em relação à CPU, que usa double nas operações de cor. O alfa, a resolução e
os ajustes são preservados. O processamento não reduz a resolução por conta
própria e utiliza o mesmo motor na prévia e na exportação.

O ambiente de desenvolvimento não dispõe da sua RTX nem do Resolve Windows.
Os kernels foram compilados e comparados com a CPU através de um dispositivo
OpenCL de teste em CPU (PoCL); isso verifica fórmulas e acesso aos buffers,
sem medir desempenho em uma GPU NVIDIA. Não há garantia de reprodução 4K em
tempo real. Para cenas pesadas, o Resolve oferece **Playback → Timeline Proxy
Resolution → Half/Quarter** e **Render Cache**. Confira a resolução do job de
exportação e evite habilitar o uso de proxies na entrega final se quiser usar
os arquivos originais.
