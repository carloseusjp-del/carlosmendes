# Mendes Color 1.0.2 — download para Windows

Plugin OpenFX próprio para DaVinci Resolve no Windows x64.

- [Plugin Windows 1.0.2 (.zip)](MendesColor-1.0.2-Windows-x64.zip)
- [Código-fonte 1.0.2 (.zip)](MendesColor-1.0.2-source.zip)
- [Verificação SHA-256](SHA256SUMS.txt)

Para baixar: abra o ZIP e use **Download raw file** (botão de download) no GitHub.

## Correção 1.0.2

O log da versão 1.0.1 no Resolve 21.1.1 build 10 mostrou carga da biblioteca com
êxito, seguida de erro 3 (`ErrUnknown`) ao definir `OfxPropPluginDescription` e
interrupção de `OfxActionDescribe`. A descrição é cosmética e não deveria ser
um requisito para registrar o efeito.

A versão 1.0.2 tolera `ErrUnknown`/`ErrUnsupported` apenas para essa descrição
opcional, permitindo continuar o registro. Falhas de propriedades obrigatórias e
erros reais, como falta de memória, continuam sendo propagados. A aceitação dos
contextos Filter e General, adicionada na 1.0.1, foi mantida. O motor de cores
não foi alterado.

1. Feche o Resolve e extraia o pacote Windows **1.0.2**.
2. Substitua a pasta inteira `MendesColor.ofx.bundle` em
   `C:\Program Files\Common Files\OFX\Plugins\`.
   Não mantenha outra cópia antiga nesse diretório. O Install.ps1 do ZIP
   preserva a versão anterior fora da pasta de plugins.
3. Reabra o Resolve e procure **Mendes Color** no painel **Effects / Open FX**
   da página **Color**, grupo **Mendes**.
4. Se ainda não aparecer, envie as novas linhas com prefixo **Mendes Color 1.0.2**
   do arquivo `%LOCALAPPDATA%\MendesColor\OpenFX.log`.

Uma linha `optional property skipped | status=3` para a descrição é esperada
nesse host; o resultado posterior de `OfxActionDescribe` deve ser **status=0**.

A falha foi reproduzida antes da correção e o teste passou após a mudança.
Passaram 694 verificações do motor e 107 do host OpenFX simulado, inclusive com
sanitizadores. O REA conferiu o novo binário Windows. A confirmação do efeito
visível e funcionando na versão 1.0.2 no Resolve real ainda está pendente.

A implementação é própria e não reproduz os algoritmos proprietários do ToneLab.
As versões 1.0.0 e 1.0.1 permanecem como histórico; use a 1.0.2 para este teste.
