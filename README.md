# Mendes Color 1.2.0 — instalador Windows e looks cinematográficos

Plugin OpenFX para DaVinci Resolve no Windows x64, com a LUT da Avata 2,
19 opções de look e intensidade de estilo independente da conversão de câmera.

## Download e instalação automática

**[Baixar MendesColor-1.2.0-Setup.exe](MendesColor-1.2.0-Setup.exe?raw=true)**

1. Feche o DaVinci Resolve.
2. Abra o Setup, autorize a solicitação de administrador do Windows e confirme
   a instalação no destino exibido.
3. Reabra o Resolve e procure **Mendes Color** em **Effects / Open FX**.

Não é necessário copiar pastas nem extrair ZIP nesse fluxo. O instalador
funciona offline, verifica os arquivos por SHA-256 e guarda a versão anterior
em `C:\Program Files\Common Files\MendesColor\Backups\`. Ele não encerra
seus projetos: se o Resolve estiver aberto, pede que você o feche.
Nas próximas atualizações, execute o Setup da nova versão da mesma forma.

O instalador não tem assinatura digital de editor; o Windows pode exibir uma
confirmação adicional. Confira a origem e o SHA-256 antes de executar.

- [SHA-256 dos downloads](SHA256SUMS.txt)
- [Verificação técnica do instalador](MendesColor-1.2.0-Setup-verification.json)
- [Pacote portátil Windows (.zip)](MendesColor-1.2.0-Windows-x64.zip)
- [Código-fonte completo (.zip)](MendesColor-1.2.0-source.zip)

## Seus looks sobre a LUT da Avata 2

Escolha **Input LUT → DJI Avata 2 D-Log M to Rec.709 (embedded)** e depois um
estilo em **Creative Look**. Mantenha **LUT Output Transfer=Keep LUT output**,
**Creative Gamma=1** e saída/monitoramento do fluxo manual em **Rec.709 Gamma 2.4**.
Não some outra normalização técnica ao mesmo sinal sem definir os espaços.

A conversão acontece primeiro e uma única vez. Todos os looks operam sobre
essa imagem já convertida. Para as aparências pedidas:

| Estilo | Look |
|---|---|
| Quente cinematográfico | Warm Cinema / Golden Hour |
| Fim de tarde | Golden Hour |
| Pôr do sol | Sunset Glow |
| Verde cinematográfico | Moody Forest / Soft Green |
| Comercial com verde e azul | Commercial Teal |
| Sombras frias e luzes quentes | Teal & Orange |

**Look Strength** dosa só o estilo: zero mantém a LUT e suas correções manuais;
1 aplica o look completo. Comece com 0,4–0,8 para uma aparência mais discreta.
**Effect Mix=0** continua desligando o plugin inteiro, inclusive a LUT.
Os seis looks antigos mantêm nomes, índices e resultados da versão 1.1.0.

[Catálogo completo de looks](LOOKS.md)

![Comparação de cores sintéticas](LOOKS-preview.svg)

A figura foi calculada pelo motor C++ com a LUT embutida e intensidade 1.
Usa cores sintéticas, não filmagem nem uma simulação exata do seu monitor.
Os estilos são propostas estéticas, sem emulação calibrada de película ou
proteção automática de pele.

## Validação e limites

Passaram 2.235 verificações de cor, 166 de LUT/transferências, 184 de host OpenFX
simulado e 21 de instalação/backup/restauração em filesystem temporário.
Os testes também passaram com sanitizadores. O REA inspecionou o plugin e os
recursos do Setup; os 11 payloads e o manifesto UAC foram conferidos no EXE final.

A UI do instalador, UAC, APIs Windows e os novos looks no Resolve real ainda
precisam ser exercitados no computador do usuário. O ambiente de compilação é
Linux; os testes portáveis não substituem essa execução. A versão 1.0.2 do
plugin foi confirmada pelo usuário no Resolve. O processamento é CPU/float32.

A LUT fornecida foi preservada, com sua proveniência nos pacotes. Seu nome
identifica Avata 2, enquanto um comentário interno menciona Mavic 3 Pro. Ela
não declara gamma de saída; essa curva é preservada por padrão. A configuração
Rec.709 Gamma 2.4 do projeto não equivale a provar uma curva 2.4 na LUT.
Os ajustes e looks do motor são próprios; não reproduzem ToneLab.
As versões anteriores continuam disponíveis como histórico.
