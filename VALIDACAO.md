# Validação — Mendes Color 1.4.0

O plugin Windows x64 foi compilado com MinGW-w64 GCC 14 POSIX, C++17, O2,
avisos tratados como erros e runtimes GCC/C++ estáticos. As exportações OpenFX,
importações PE e recursos do instalador foram inspecionados com REA 6.8.0,
Node.js 24.22.1. Os manifestos e evidências registram SHA-256 dos binários.

## Verificações locais

`make test` passou **13.264 verificações**:

| Alvo | Verificações | Cobertura principal |
|---|---:|---|
| Cor | 9.645 | 84 looks, rampas signed/HDR, intensidade, alfa e 42 referências numéricas da 1.1 para os seis looks antigos |
| LUT/transferência inicial | 231 | .cube, erros/domínio/interpolação/cache, LUT fornecida e preservação da conversão nos 84 looks em intensidade zero |
| Host OpenFX simulado | 722 | Descoberta Filter/General, descrição opcional, parâmetros, animação, ROI/tiles/stride/alfa, slots .cube/.3dl, navegação, receitas, resets, máscaras e recursos |
| Halation rápida | 2.100 | Solução analítica de impulso, energia/simetria, full-frame/tile/ROI recortada, presets e mistura |
| Ferramentas avançadas | 545 | LGG, pontos por RGB/luma, split, seleção de pele, saturação por matiz, vinheta, grão temporal, receitas, faixas, conversões e filtros espaciais combinados |
| Transação de instalação | 21 | Instalação nova, atualização, backup completo, falhas, restauração e colisões em filesystem temporário |

O teste espacial combinado usa um source ROI recortado, origem não nula e alfa
premultiplicado. Ele compara pixels com o frame completo, exercitando a soma
das dependências de suavização/grão, halos local/global e Bloom. Os testes
conferem cancelamento e o bypass exato de Effect Mix=0, inclusive com nova
configuração inválida. Grain Intensity=0 também retira a suavização da imagem.

Os testes de cor, LUT, Halation, ferramentas e host passaram com
AddressSanitizer/UndefinedBehaviorSanitizer e detecção de vazamentos.
A transação do instalador foi exercitada em filesystem Linux, não na UI Windows.

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

O usuário confirmou a versão 1.0.2 no Resolve 21.1.1 build 10. **A 1.4.0 ainda
não foi executada aqui no Windows nem no Resolve real**. A UI das páginas/grupos,
o seletor múltiplo GetOpenFileNameW, UAC/BCrypt, desfazer real e desempenho em
4K ficam para avaliação manual pelo usuário. As suítes simuladas não estabelecem
esses resultados. Nenhuma nova prévia visual nem vídeo de referência foi usada.

O Setup verifica todos os payloads, prepara staging e preserva o bundle antigo
fora da busca OpenFX. O PE final deve conter arquitetura AMD64, subsistema GUI,
manifesto requireAdministrator e payloads com os hashes do build. O executável
é offline, sem assinatura de editor. A compilação MSVC e os scripts PowerShell
não foram exercitados neste ambiente Linux. Não há certificação de produção,
emulação calibrada de película ou promessa de tempo real.
