# Licenciamento — Mendes Color 1.6.1

Copyright © 2026 Carlos Mendes. Todos os direitos reservados.

O instalador público inclui o plugin e o aplicativo **Ativar Mendes Color**.
O painel administrativo **Mendes License Studio** é entregue separadamente ao
proprietário e não deve ser enviado aos clientes.

## Fluxo para disponibilizar uma licença

1. O cliente instala `MendesColor-1.6.1-Setup.exe` e abre **Ativar Mendes Color**
   pelo menu Iniciar ou pela aba **License** do efeito.
2. O cliente copia o ID `MC-....` da máquina e envia ao proprietário.
3. No **Mendes License Studio**, o proprietário informa a senha administrativa,
   o nome do cliente, o ID recebido e, opcionalmente, uma data `AAAA-MM-DD`.
   Campo de data vazio gera licença perpétua.
4. O Studio gera uma key `MC16...`. O proprietário envia somente essa key ao
   cliente correspondente.
5. O cliente cola a key em **Ativar Mendes Color**. A ativação é offline e fica
   em `%LOCALAPPDATA%\MendesColor\license.key`.

Uma licença vinculada não funciona em outra máquina. Para migrar o cliente,
gere outra key com o novo ID. O histórico administrativo fica em
`%LOCALAPPDATA%\MendesColor\LicenseStudio\issued.csv`; ele contém cliente,
máquina, validade e impressão digital da key, sem guardar a senha ou chave
privada em texto aberto.

## Segurança e limites

As licenças usam ECDSA P-256 sobre SHA-256. O plugin e o ativador contêm apenas
a chave pública. O License Studio contém a chave privada cifrada por AES-256-GCM;
a chave de cifragem é derivada da senha com PBKDF2-HMAC-SHA256 e 310.000
iterações. A chave privada decifrada existe somente em memória durante a
assinatura e é apagada depois do uso.

Guarde a senha administrativa fora da pasta pública e não publique capturas do
Studio com a senha. Perder a senha ou o executável administrativo impede emitir
novas licenças compatíveis. Mantenha cópias de segurança dos dois.

O modelo é totalmente offline. Ele não oferece revogação remota, limite de
ativações por servidor, recuperação automática ou defesa absoluta contra
engenharia reversa. A validade depende do relógio UTC do Windows. O instalador e
os aplicativos ainda não possuem certificado de assinatura Authenticode; a
assinatura das keys não substitui a assinatura digital de editor do executável.
