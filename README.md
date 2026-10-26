# Mendes Color 1.1.0 — DJI Avata 2 e LUTs 3D

Plugin OpenFX para DaVinci Resolve no Windows x64.

- [Baixar plugin Windows 1.1.0 (.zip)](MendesColor-1.1.0-Windows-x64.zip)
- [Código-fonte completo 1.1.0 (.zip)](MendesColor-1.1.0-source.zip)
- [Verificação SHA-256](SHA256SUMS.txt)

Para baixar: abra o ZIP e clique em **Download raw file** (botão de download).

## Instalar e selecionar o preset

1. Feche o Resolve e extraia todo o pacote Windows 1.1.0.
2. Substitua a pasta inteira `MendesColor.ofx.bundle` em
   `C:\Program Files\Common Files\OFX\Plugins\`.
3. Reabra o Resolve, abra **Mendes Color** na página Color e selecione
   **Input LUT → DJI Avata 2 D-Log M to Rec.709 (embedded)**.
4. Mantenha **LUT Output Transfer = Keep LUT output**, **Creative Gamma = 1**,
   **Creative Look = Neutral** e **Effect Mix = 1** para começar.
5. Para o fluxo manual, use DaVinci YRGB e saída/monitoramento **Rec.709 Gamma 2.4**.
   Aplique a LUT aos originais D-Log M, sem outra normalização técnica duplicada.

O preset fica embutido no plugin; o campo LUT File pode permanecer vazio.
Input LUT fica em None por padrão para preservar projetos anteriores.
Também é possível escolher **Custom 3D .cube file** para outras tabelas.
O ZIP contém instruções detalhadas em LEIA-ME.md e LUT-AVATA2.md.

## Origem e gamma

Foi usada exatamente a LUT enviada pelo usuário, com 33³ pontos RGB e SHA-256
`b18162854ab47702068410c33afa98a8cb6eef159fc5a04ce0e65fad0fd8947e`.
Seu original está no bundle, junto da proveniência, em Contents/Resources/LUTs.
O nome enviado identifica Avata 2; um comentário interno menciona Mavic 3 Pro.
A divergência foi preservada e não houve autenticação por download direto da DJI.

O arquivo não declara gamma de saída. Sua curva é preservada; **a configuração
Rec.709 Gamma 2.4 do Resolve não equivale a provar uma curva 2.4 na LUT**.
A recodificação avançada BT.709 OETF → Gamma 2.4 não é ligada automaticamente.
O controle Creative Gamma é artístico: deixe-o em 1 na normalização inicial.

## Validação

Passaram 694 verificações do motor, 146 de LUT/transferências e 177 de um host
OpenFX simulado, incluindo render com a tabela embutida e campo de arquivo vazio.
Os testes de LUT e host também passaram com sanitizadores. O REA inspecionou o
binário Windows. Os dados originais e os ZIPs foram conferidos por SHA-256.

A versão 1.0.2 foi confirmada pelo usuário no Resolve. A nova 1.1.0 ainda precisa
ser testada com sua filmagem no host real; os testes não certificam a resposta
física da câmera nem desempenho em tempo real. O processamento é CPU/float32.
Os ajustes e looks do motor são próprios; não reproduzem ToneLab.
As versões anteriores permanecem disponíveis como histórico.
