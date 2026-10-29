# Etapa 4 — instalação e testes na LG webOS TV

Este guia instala e testa o **Mendes Home** na LG 55UR8750PSA pelo modo oficial de desenvolvedor. Os comandos abaixo não alteram firmware, não fazem root, não removem aplicativos do sistema e não substituem a Home original da LG.

## Estado confirmado

| Item | Valor |
| --- | --- |
| TV | LG 55UR8750PSA |
| Sistema | webOS 24 / SDK 9.2.1 |
| Firmware | 23.21.20 |
| Computador | Windows 11 |
| Perfil da CLI | `tv` |
| Dispositivo cadastrado | `lg-sala` |
| IP da TV | `192.168.0.108` |
| ID do aplicativo | `com.carlosmendes.mendeshome` |
| Método | Developer Mode + webOS CLI 3.2.6, conexão SSH oficial |

O IP pode mudar se o roteador não reservar o endereço da TV. O perfil `lg-sala` deve continuar apontando para o endereço exibido no aplicativo **Developer Mode**.

## Limites desta instalação

- O pacote é um aplicativo web em modo de desenvolvedor. Ele pode ser aberto, atualizado e removido sem modificar o sistema.
- O firmware pode negar a listagem completa de aplicativos a um IPK comum. O Mendes Home tenta a API de launch points, depois a lista de aplicativos e, se ambas forem negadas, procura uma lista conhecida de serviços instalados. A tela deve informar quando o acesso estiver limitado.
- Abrir um aplicativo por seu ID costuma ser permitido, mas cada atalho precisa ser comprovado nesta TV.
- O SDK público para aplicativos comuns não oferece uma forma documentada de substituir a Home da LG, interceptar globalmente o botão **Home** ou iniciar o app automaticamente ao ligar. Portanto, esta versão não faz essas alterações.
- O botão Home continuará abrindo a interface original da LG. O atalho seguro mais próximo é atribuir o Mendes Home a um número do **Quick Access** pelo próprio controle, caso o modelo permita.
- A permanência de aplicativos instalados em Developer Mode depende da sessão exibida no app Developer Mode. Renove a sessão antes de expirar.

## 1. Pré-requisitos no Windows

Abra o PowerShell na pasta do projeto:

```powershell
cd "$env:USERPROFILE\Documents\LGWebOSLauncher"
```

Confirme as ferramentas e o perfil já pareado:

```powershell
node --version
npm --version
npx --no-install ares -V
npx --no-install ares-config --profile tv
npx --no-install ares-setup-device -l
```

Na TV, abra **Developer Mode** e confira:

- `Dev Mode Status: ON`;
- o IP continua sendo `192.168.0.108` ou coincide com o perfil `lg-sala`;
- a sessão ainda tem tempo disponível.

O **Key Server** só precisa ficar ligado durante o pareamento ou a renovação da chave. Não é necessário deixá-lo ligado no uso diário.

Faça a leitura segura do aparelho antes de instalar:

```powershell
npx --no-install ares-device -i -d lg-sala
npx --no-install ares-install -l -d lg-sala
```

O primeiro comando deve exibir o modelo e a versão. O segundo deve retornar a lista de pacotes sem erro de SSH.

## 2. Conferir o pacote

O arquivo esperado é:

```text
dist\com.carlosmendes.mendeshome_0.2.1_all.ipk
```

Confira seus metadados sem instalar:

```powershell
npx --no-install ares-package -I .\dist\com.carlosmendes.mendeshome_0.2.1_all.ipk
```

O resultado deve mostrar o ID `com.carlosmendes.mendeshome`, a versão `0.2.1` e o tipo de arquitetura `all`.

Confira também a integridade do arquivo:

```powershell
(Get-FileHash .\dist\com.carlosmendes.mendeshome_0.2.1_all.ipk -Algorithm SHA256).Hash
```

Resultado esperado:

```text
D6EBF7DDCBA9D80C9D5125935767734A5283D68867DC6ADBA15BA845B3F096AB
```

## 3. Instalação — somente após autorização

Este é o primeiro passo que grava algo na TV. Ele adiciona apenas o IPK à área de aplicativos do Developer Mode e é reversível pela desinstalação descrita adiante.

```powershell
npx --no-install ares-install .\dist\com.carlosmendes.mendeshome_0.2.1_all.ipk -d lg-sala
```

Se uma versão anterior existir, o comando atualiza o mesmo ID e preserva preferências do `localStorage`. Na primeira abertura da versão 0.2.1, o perfil visual existente é migrado uma única vez para **Leve · TV**, corrigindo a lentidão sem apagar papel de parede, favoritos ou chave TMDB. Depois disso, uma escolha manual de outro perfil permanece salva. Em caso de erro, não repita várias vezes: registre a mensagem completa e use a seção de diagnóstico.

Confirme que o app aparece na lista:

```powershell
npx --no-install ares-install -l -d lg-sala
```

## 4. Abrir e fechar com a CLI

Abra o launcher:

```powershell
npx --no-install ares-launch com.carlosmendes.mendeshome -d lg-sala
```

Feche somente o launcher:

```powershell
npx --no-install ares-launch -c com.carlosmendes.mendeshome -d lg-sala
```

Fechar o app não apaga ajustes nem o remove da TV.

## 5. Roteiro de teste pelo controle remoto

Execute os testes nesta ordem e anote o resultado de cada item.

### Navegação

1. Use **Esquerda**, **Direita**, **Cima** e **Baixo** em todos os cartões e no dock.
2. Confirme que o item focado ganha profundidade e que nenhum foco fica invisível fora da tela.
3. Pressione **OK** nos cartões, nos aplicativos e nos controles do painel.
4. Abra a gaveta, escolha **Todos os apps**, percorra a primeira e a última linha e volte ao dock.
5. Na biblioteca, selecione um app fora do dock e pressione a tecla **Verde** para fixá-lo; o oitavo favorito deve dar lugar ao novo item.
6. Abra Ajustes e percorra também os itens mais baixos, inclusive a seção TMDB.
7. Pressione **Voltar** uma vez em cada camada: Ajustes deve fechar primeiro, depois a biblioteca, a gaveta ou o modo de edição; com tudo fechado, Voltar deve sair do Mendes Home.

### Aplicativos e entradas

1. Confira o texto de estado no topo: ele deve indicar TV conectada, acesso limitado ou modo de demonstração.
2. Abra um aplicativo instalado pelo dock e confirme que o serviço correto aparece.
3. Volte ao Mendes Home e repita com pelo menos três aplicativos.
4. Teste os atalhos **TV**, **HDMI 1**, **HDMI 2** e **HDMI 3** somente para as entradas realmente usadas.
5. Se um atalho não existir ou for negado, registre qual item falhou; não tente conceder permissões protegidas.

O firmware pode impedir a listagem completa mesmo quando consegue abrir IDs conhecidos. Isso é uma limitação do acesso público, e não deve ser interpretado como falha da conexão SSH.

### Recursos originais da TV

Com o launcher aberto e depois de abrir outro aplicativo, confirme:

- volume, mudo e liga/desliga continuam sob controle da TV;
- Home ainda abre a Home original da LG;
- Voltar funciona nas camadas do launcher e nos aplicativos abertos;
- HDMI, TV ao vivo e Configurações continuam acessíveis pela interface original;
- os aplicativos de streaming mantêm login e reprodução.

### Aparência e fluidez

1. Navegue continuamente pelo dock por pelo menos 30 segundos.
2. Abra e feche gaveta e Ajustes dez vezes.
3. Confirme que **Leve · TV** está selecionado e compare com **Equilibrado**. O desfoque em tempo real fica reservado ao modo **Máximo**.
4. Confirme que texto e foco continuam legíveis sobre cada papel de parede.
5. Se houver travadas mesmo em **Leve · TV**, desligue **Movimento suave**, repita o teste e registre CPU/memória pelo comando abaixo.

Para observar recursos sem alterar a TV, deixe este comando rodar em outro PowerShell e encerre com `Ctrl+C`:

```powershell
npx --no-install ares-device -r -id com.carlosmendes.mendeshome -t 3 -d lg-sala
```

## 6. Filmes e séries pela TMDB

A integração não inclui uma chave no código ou no IPK. Em **Ajustes > Filmes e séries**, informe sua própria API Key v3 ou Read Access Token v4 da TMDB e escolha **Salvar e testar**.

- A credencial fica somente no armazenamento local do aplicativo na TV.
- Sem credencial ou sem internet, a interface mantém as artes locais ou o cache disponível.
- Teste as abas **Descobrir**, **Filmes** e **Séries**.
- A TMDB fornece catálogo e imagens; ela não fornece reprodução. O item não deve prometer abrir um streaming específico.

## 7. Quick Access opcional

Depois de comprovar que o launcher abre normalmente, é possível tentar o mecanismo nativo da própria LG:

1. Abra o Mendes Home.
2. Mantenha pressionado um número livre do controle, normalmente de `1` a `9`.
3. Confirme a associação caso a TV ofereça essa opção.
4. Em outro aplicativo, mantenha o mesmo número pressionado para voltar ao launcher.

Esse atalho não substitui o botão Home, não inicia o app ao ligar e pode variar conforme região, controle e firmware. Para desfazer, abra a tela de edição do Quick Access pelo controle LG e remova a associação ao número.

## 8. Diagnóstico

Se a instalação, abertura ou interface falhar, registre os resultados destes comandos:

```powershell
npx --no-install ares-device -i -d lg-sala
npx --no-install ares-install -F -d lg-sala
npx --no-install ares-launch -r -d lg-sala
npx --no-install ares-inspect com.carlosmendes.mendeshome -d lg-sala
```

O último comando fornece o endereço do Web Inspector. Com o app aberto, acesse esse endereço no computador e copie somente:

- mensagens de erro do Console;
- qual estado de plataforma aparece na tela;
- aplicativo ou botão que provocou o erro;
- comportamento observado e comportamento esperado.

Não publique a credencial TMDB, a chave SSH, passphrase ou conteúdo de `C:\Users\<usuario>\.ssh`.

## 9. Restauração completa

Primeiro feche o launcher:

```powershell
npx --no-install ares-launch -c com.carlosmendes.mendeshome -d lg-sala
```

Depois remova somente o app de desenvolvedor:

```powershell
npx --no-install ares-install -r com.carlosmendes.mendeshome -d lg-sala
```

Confirme a remoção:

```powershell
npx --no-install ares-install -l -d lg-sala
```

Se o Quick Access tiver sido configurado, remova também essa associação pelo menu nativo. A desinstalação apaga as preferências e a credencial TMDB armazenadas pelo app. Ela não remove o Developer Mode, não modifica a Home original e não afeta os aplicativos instalados pela loja LG.

## Registro de resultado

Preencha este bloco depois do teste real:

```text
Instalação: pendente / aprovada / concluída / falhou
Versão testada: 0.2.1
Navegação (setas/OK/Voltar):
Origem da lista de apps exibida:
Apps que abriram:
Atalhos TV/HDMI:
TMDB (Descobrir/Filmes/Séries):
Qualidade visual escolhida:
Travadas ou artefatos:
Home original, volume e configurações preservados:
Quick Access configurado: sim / não
Erros do Console:
```

Somente os itens marcados como concluídos após esse roteiro devem ser descritos como comprovados na TV.
