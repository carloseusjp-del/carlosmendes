# Validação — Mendes Color 1.6.1

O plugin Windows x64 foi compilado com MinGW-w64 GCC 14 POSIX, C++17, O3,
avisos tratados como erros e runtimes GCC/C++ estáticos. As exportações OpenFX,
importações PE e recursos do instalador foram inspecionados com REA 6.8.0,
Node.js 24.22.1. Os manifestos e evidências registram SHA-256 dos binários.

## Verificações locais

`make test` passou **14.062 verificações**. O alvo separado `build/gpu_test`,
executado com o dispositivo PoCL de teste, passou outras **426**: **14.488** no total.

| Alvo | Verificações | Cobertura principal |
|---|---:|---|
| Cor | 9.645 | 84 looks, rampas signed/HDR, intensidade, alfa e 42 referências numéricas da 1.1 para os seis looks antigos |
| LUT/transferência inicial | 231 | .cube, erros/domínio/interpolação/cache, LUT fornecida e preservação da conversão nos 84 looks em intensidade zero |
| Host OpenFX simulado, sem suíte SMP | 734 | Descoberta Filter/General, descrição opcional, parâmetros, animação, ROI/tiles/stride/alfa, slots .cube/.3dl, navegação, receitas, resets, máscaras, licença e recursos |
| Host OpenFX simulado, com suíte SMP | 736 | Mesmos contratos, despacho real em threads e orçamento de CPUs do host |
| Regressão de otimização | 42 | Oito frames de referência da 1.4.0, filtros paralelos, cancelamento, exceções e recusa da suíte SMP |
| OpenCL | 426 | 84 looks, 50 combinações, LUTs .cube/.3dl, malha não uniforme, filtros, máscaras, HDR, alfa, tiles/ROI recortada, cancelamento e reinicialização |
| Halation rápida | 2.100 | Solução analítica de impulso, energia/simetria, full-frame/tile/ROI recortada, presets e mistura |
| Ferramentas avançadas | 545 | LGG, pontos por RGB/luma, split, seleção de pele, saturação por matiz, vinheta, grão temporal, receitas, faixas, conversões e filtros espaciais combinados |
| Transação de instalação | 21 | Instalação nova, atualização, backup completo, falhas, restauração e colisões em filesystem temporário |
| Formato de licença | 8 | ID de máquina, datas, UTF-8, codificação canônica, alteração de assinatura e entradas inválidas |

O teste espacial combinado usa um source ROI recortado, origem não nula e alfa
premultiplicado. Ele compara pixels com o frame completo, exercitando a soma
das dependências de suavização/grão, halos local/global e Bloom. Os testes
conferem cancelamento e o bypass exato de Effect Mix=0, inclusive com nova
configuração inválida. Grain Intensity=0 também retira a suavização da imagem.

Na 1.4.0, os testes de cor, LUT, Halation, ferramentas e host passaram com
AddressSanitizer/UndefinedBehaviorSanitizer e detecção de vazamentos. Na 1.5.0,
a regressão do novo motor CPU e o host multithread foram repetidos com esses
sanitizadores.
A transação do instalador foi exercitada em filesystem Linux, não na UI Windows.

Na 1.6.1, oito verificações cobrem o formato canônico das keys, datas, IDs de
máquina, UTF-8, alterações de assinatura e entradas inválidas. Um teste Python
independente decifra a chave privada embarcada com a senha administrativa,
confere que ela corresponde à chave pública e realiza uma assinatura ECDSA
P-256/SHA-256. A senha e a chave privada em texto aberto não entram nos pacotes.

O Setup 1.6.1 usa uma janela Win32 própria e não importa
`TaskDialogIndirect`. Essa regressão cobre o erro de ponto de entrada observado
no Setup 1.6.0 quando o Windows carregava uma variante antiga de `comctl32.dll`.
Os quatro binários PE carregam `CompanyName=Carlos Mendes` e o aviso legal de
copyright nos recursos VERSIONINFO.

## Motor OpenCL e CPU otimizada

As operações da GPU são próprias, em `assets/kernels/mendes.cl`, compiladas
pelo driver OpenCL 1.2. O loader é dinâmico; a seleção de produção aceita
somente GPUs, prefere NVIDIA e exige `cl_khr_fp64`. Não há driver nem runtime
PoCL distribuído no instalador. Os kernels usam float32 para cor e double para
coordenadas de grão, somas de blur e trechos sensíveis de PQ. Não foi usado
fast-math nem redução interna de resolução.

A execução OpenCL de teste ocorreu em **PoCL 6.0, dispositivo CPU**, não em
uma GPU NVIDIA. O teste compara o motor com a referência CPU, incluindo todos
os looks e a cadeia espacial, com limite de erro `abs(GPU-CPU)/(1+abs(CPU))`
menor que `2e-4`. A maior diferença absoluta foi 0,53125 num sinal de milhares
num teste extremo de DaVinci Intermediate → linear; a diferença relativa desse
caso ficou abaixo de `5,9e-5`. O alfa é preservado exatamente. Essa tolerância
não significa equivalência bit a bit GPU/CPU. Não houve medição de fps na RTX.

O teste espacial recorta o source conforme a soma das dependências, verifica
origens não nulas, escala/PAR, máscaras e ausência de escrita fora do tile.
O carregamento libera recursos antes da alternativa por CPU em caso de erro;
o programa/contexto é liberado na ação OFX Unload. O workspace GPU é limitado. Os desfoques usam transposição em blocos 16×16
e reutilizam buffers de etapas anteriores para não aumentar o pico de VRAM.
Ver [GPU.md](GPU.md) para uso e limites de memória.

A CPU agora reaproveita a correção por pixel entre os efeitos, calcula
constantes por frame e distribui as etapas pela suíte de threads do host,
com até 16 threads e alternativa serial quando a suíte não existe ou recusa
o despacho. Os intermediários espaciais mantêm double até as mesmas gravações
float dos filtros anteriores. O resultado paralelo é idêntico ao serial nos
testes e preserva as oito referências renderizadas pela versão 1.4.0 dentro
de `2e-6` por canal. Esses testes não medem playback/decodificação no Resolve.

## Conversões e LUTs

Referências independentes incluem o midpoint sRGB, o código PQ de 100 nits,
o pico de 10.000 nits e o ponto 0,5 da OETF HLG. Os pares de primárias e
transferências têm testes de ida/volta, incluindo valores negativos e fora
de 0–1; D65 é preservado ao converter Rec.2020/Rec.709. Esse escopo matemático
não certifica a gestão de cor de um projeto Resolve nem colorimetria de câmera.

O parser .3dl usa ordem blue-fast, respeita malha não uniforme e valida tamanho,
inteiros, quantidade, precisão e cabeçalhos. O formato sem Mesh usa saída
12-bit. Variantes não reconhecidas não são aceitas silenciosamente.

A LUT Avata 2 preserva seu hash original e seus valores conhecidos. Ela não
declara gamma de saída; o arquivo cita outro modelo em comentário interno.
O plugin preserva sua saída por padrão. Não houve autenticação contra DJI.

## Preservação e diferenças

Os 19 índices de look anteriores foram mantidos; a família adicional contém
65 receitas novas e independentes. As 12 seções novas começam desligadas,
Custom LUT/Finishing=None e Color Space desativado. A descoberta continua
tolerando apenas erro Unknown/Unsupported da descrição cosmética opcional,
sem silenciar falhas de propriedades obrigatórias.

As faixas e a organização observadas no material fornecido orientaram os
controles. As fórmulas, receitas de presets e variações (Mendes) são próprias;
nenhuma LUT comercial ou código do ToneLab foi incorporado. Os presets não
foram validados como reprodução dos valores/algoritmos do ToneLab.
As 31 normalizações de outras câmeras não foram inventadas: use arquivos
apropriados no campo técnico de LUT. Há apenas o preset Avata 2 embutido.

## Limites da execução

O usuário confirmou funcionamento da versão 1.5.0 com GPU no Resolve em 4K num
i5-13420H/32 GB/RTX 3050 Laptop 6 GB. **A 1.6.1 ainda não foi executada aqui no
Windows nem no Resolve real**. A UI das páginas/grupos,
o seletor múltiplo GetOpenFileNameW, UAC/BCrypt, desfazer real e desempenho em
4K, o ativador e o License Studio ficam para avaliação manual pelo usuário. As
suítes simuladas não estabelecem esses resultados. Nenhuma nova prévia visual
nem vídeo de referência foi usada.

O Setup verifica todos os payloads, prepara staging e preserva o bundle antigo
fora da busca OpenFX. O PE final deve conter arquitetura AMD64, subsistema GUI,
manifesto requireAdministrator e payloads com os hashes do build. O executável
é offline, sem assinatura de editor. A compilação MSVC e os scripts PowerShell
não foram exercitados neste ambiente Linux. Não há certificação de produção,
emulação calibrada de película ou promessa de tempo real.

O REA observou no OFX 1.6.1 um PE32+ AMD64, as exportações
`OfxGetNumberOfPlugins` e `OfxGetPlugin`, sete DLLs importadas e cobertura
completa das tabelas inspecionadas, sem problemas reportados. Essa inspeção é
estática e não prova carregamento ou execução no Resolve.
