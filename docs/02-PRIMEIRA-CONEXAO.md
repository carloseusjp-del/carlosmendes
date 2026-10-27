# Primeira conexão — procedimento seguro

## Etapa A — diagnóstico do computador

1. Mantenha o Windows 11 e a TV conectados ao mesmo roteador. Evite rede de convidados, pois ela costuma isolar os aparelhos.
2. Abra a pasta do projeto no Windows.
3. Dê dois cliques em `INICIAR-DIAGNOSTICO.cmd`.
4. Anote as linhas **Interface recomendada**, **IPv4 do computador** e **Gateway**.
5. O relatório completo será salvo em `reports\rede.json`.

Esse script usa apenas comandos de leitura do Windows. Ele não altera rede, firewall ou TV.

## Etapa B — preparar a TV

Esta etapa muda apenas o estado oficial de desenvolvimento e só deve ser feita quando autorizada pelo proprietário.

1. Na LG Content Store, instale o aplicativo oficial **Developer Mode**.
2. Entre com uma conta do portal LG Developer.
3. Ative **Dev Mode Status**. A TV solicitará reinicialização.
4. Depois de reiniciar, abra novamente o aplicativo **Developer Mode**.
5. Ative **Key Server**.
6. Anote o endereço IP exibido e mantenha visível a senha de seis caracteres.

No webOS não existe o campo **Host PC IP** usado por algumas TVs Samsung. O pareamento ocorre quando a CLI pede à TV uma chave usando a senha temporária.

## Etapa C — testar a rede sem parear

No PowerShell, dentro da pasta do projeto:

```powershell
.\scripts\Testar-ConexaoTV.ps1 -TvIp "IP_DA_TV"
```

Resultados esperados:

- `Porta9922: True`: o serviço de desenvolvimento está acessível.
- `Porta9991: True`: o Key Server está acessível para fornecer a chave temporária.
- `Ping: False` com as duas portas verdadeiras: conexão válida; o ping apenas está bloqueado.
- Uma das portas falsa: revisar IP, mesma rede, isolamento de Wi-Fi, Dev Mode e Key Server.

## Etapa D — preparar a CLI no Windows

Pré-requisito: Node.js LTS com npm.

```powershell
.\scripts\Configurar-CLI.ps1
```

A dependência fica dentro do projeto. O script fixa `@webos-tools/cli` 3.2.6 e seleciona o perfil `tv`.

## Etapa E — parear, somente após autorização

Execute `CONECTAR-TV.cmd`, informe o IP da TV e digite `PAREAR` quando solicitado. A senha de seis caracteres deve ser digitada apenas no prompt local da CLI; ela não deve ser enviada nem registrada no projeto.

Ao final, `ares-device --system-info` confirmará a comunicação e lerá as informações do aparelho.

