# Mendes Color 1.0.1 — download para Windows

Plugin OpenFX próprio para DaVinci Resolve no Windows x64.

- [Plugin Windows 1.0.1 (.zip)](MendesColor-1.0.1-Windows-x64.zip)
- [Código-fonte 1.0.1 (.zip)](MendesColor-1.0.1-source.zip)
- [Verificação SHA-256](SHA256SUMS.txt)

Para baixar: abra o ZIP e use **Download raw file** (botão de download) no GitHub.

## Atualização 1.0.1

Esta versão anuncia e aceita os contextos OpenFX **Filter e General**. A versão
anterior só aceitava Filter. A limitação foi reproduzida e corrigida nos testes;
a causa da ausência do efeito no Resolve 21.1.1 build 10 ainda precisa ser
confirmada no host real. Há também um log de diagnóstico da descoberta.

1. Feche o Resolve e extraia o pacote Windows **1.0.1**.
2. Substitua a pasta inteira `MendesColor.ofx.bundle` em:
   `C:\Program Files\Common Files\OFX\Plugins\`.
   Evite deixar uma segunda cópia antiga nessa pasta. O Install.ps1 do ZIP
   preserva a versão anterior fora do diretório de plugins.
3. Reabra o Resolve, confira a habilitação em Preferences > System > Video Plugins,
   abra um projeto e procure **Mendes Color** no painel **Effects / Open FX** da
   página **Color**, grupo **Mendes**. Limpe a busca e desative filtros de favoritos.
4. Se ainda estiver ausente, envie o arquivo
   `%LOCALAPPDATA%\MendesColor\OpenFX.log` gerado pela nova versão.

A implementação é própria e não reproduz os algoritmos proprietários do ToneLab.
O pacote contém o guia e a validação detalhada: 694 verificações do motor e 95
do host OpenFX simulado passaram, inclusive com sanitizadores. O REA conferiu o
binário Windows. O carregamento da versão 1.0.1 no Windows/Resolve real continua
pendente. Os arquivos da versão 1.0.0 permanecem disponíveis como histórico.
