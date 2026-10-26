# Mendes Color — download para Windows

Plugin OpenFX próprio para DaVinci Resolve no Windows x64.

- [Plugin Windows (.zip)](MendesColor-1.0.0-Windows-x64.zip)
- [Código-fonte (.zip)](MendesColor-1.0.0-source.zip)
- [Verificação SHA-256](SHA256SUMS.txt)

Para baixar: abra o ZIP e use **Download raw file** (botão de download) no GitHub.
Alternativamente, use **Code > Download ZIP** para baixar todos os arquivos desta branch.

Feche o Resolve. Extraia o pacote Windows e copie a pasta `MendesColor.ofx.bundle`
inteira para `C:\Program Files\Common Files\OFX\Plugins\`. Reinicie o Resolve e
procure **Mendes Color** em Effects / Open FX.

A implementação é própria e não reproduz os algoritmos proprietários do ToneLab.
O pacote contém o guia e o registro de validação. Os testes do motor e do host
OpenFX simulado passaram; o carregamento no Windows/Resolve real ainda precisa
ser validado. Não há instalador ToneLab ou outro arquivo do usuário nesta entrega.
