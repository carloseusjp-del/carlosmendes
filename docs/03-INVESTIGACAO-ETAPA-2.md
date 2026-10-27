# Investigação técnica — launcher principal

Estado: investigação concluída em 27/10/2026. Nenhuma alteração de sistema foi executada.

## Resultado executivo

Um aplicativo original com interface própria, navegação pelo controle e abertura de outros aplicativos é viável sem root. Um IPK comum, porém, não pode ser registrado pelas APIs públicas como Home padrão, não possui gatilho nativo público para iniciar no boot e não pode remapear globalmente o botão Home.

A solução com maior chance de atender à experiência desejada sem root é composta por:

1. **Mendes Home**, o aplicativo webOS instalado pelo método oficial;
2. **Quick Access**, como atalho confiável no controle;
3. **agente SSAP externo**, em um equipamento sempre ligado, para abrir Mendes Home quando a TV ficar ativa;
4. opções oficiais de Home e privacidade para reduzir promoções na interface da LG.

Isso aproxima a experiência de um launcher principal, sem substituir o componente de sistema da LG.

## Evidência confirmada nesta TV

| Item | Resultado |
|---|---|
| Modelo | LG 55UR8750PSA |
| Plataforma | SDK webOS 9.2.1 |
| Firmware | 23.21.20 |
| Placa/região | K8LPN_ATSC_BR |
| CLI | `@webos-tools/cli` 3.2.6, perfil `tv` |
| Acesso oficial | SSH na porta 9922, chave válida com Key Server desligado |
| Usuário efetivo | `uid=5818(prisoner)`, sem usuário ou grupo root |
| Grupos expostos | `audio`, `video`, `compositor`, `se`, `crashd` |
| Canal SSAP | TCP 3000 e 3001 acessíveis |
| Caminho legado da Home | `/usr/palm/applications/com.webos.app.home` não existe neste firmware |

Portas abertas confirmam que o serviço SSAP está escutando. Ainda será necessário parear esse canal separadamente e comprovar as operações `listLaunchPoints` e `launch` com nosso IPK.

## Aplicativo launcher sem root

As amostras oficiais da LG comprovam que um aplicativo webOS TV pode:

- desenhar sua própria interface em tela cheia;
- receber setas, OK, Voltar, ponteiro e roda do Magic Remote enquanto estiver em primeiro plano;
- armazenar tema, ordem e favoritos;
- abrir outro aplicativo por ID com `webOSDev.launch({ id, params })`.

A enumeração completa de aplicativos com `listApps` ou `listLaunchPoints` pode ser filtrada pelo firmware. Isso precisa ser testado no IPK desta TV. Se a listagem interna for limitada, o agente SSAP pode fornecer os launch points, ou podemos manter uma lista curada dos aplicativos que a TV expuser.

## Por que não pode ser a Home nativa

O SDK público de webOS TV não oferece:

- papel de `default launcher` para IPKs comuns;
- seletor de aplicativo padrão para Home;
- broadcast/receiver público de boot;
- permissão para substituir a Home da LG;
- API para mudar o destino global do botão Home.

O template oficial `appinfo.json` não possui propriedade que transforme um app comum em Home. Os eventos `webOSLaunch` e `webOSRelaunch` ocorrem depois que algum componente já lançou o aplicativo; eles não registram inicialização no boot.

O webOS OSE contém conceitos internos como keep alive, boot apps e `launchFirstApp`, mas o integrador controla a imagem do OSE. O webOS Signage possui APIs comerciais próprias. Nenhum desses privilégios é transferível para uma LG de consumo ou para o usuário `prisoner`.

Substituir a Home de verdade exigiria integração OEM, pacote privilegiado assinado para o sistema, firmware próprio ou root. Essas opções estão fora do fluxo oficial e seguro.

## Inicialização automática sem root

### Agente SSAP externo

É a alternativa mais promissora. Um processo em Home Assistant, Windows, Raspberry Pi ou NAS pode:

1. conectar a `wss://192.168.0.108:3001`;
2. solicitar pareamento por confirmação na tela;
3. guardar a `client-key` própria do SSAP;
4. detectar a reconexão ou o estado de energia `Active`;
5. aguardar o Application Manager ficar pronto;
6. localizar `com.carlosmendes.mendeshome` em `listLaunchPoints`;
7. solicitar seu lançamento uma vez naquele ciclo de energia.

A integração LG webOS do Home Assistant documenta exatamente a automação “TV ligada → selecionar aplicativo”. A biblioteca `aiowebostv` implementa pareamento, estado de energia, app em primeiro plano, lista de launch points e lançamento de aplicativo.

Limitações:

- precisa de outro equipamento ligado;
- pode haver alguns segundos de atraso após ligar a TV;
- ainda precisa ser comprovado que o IPK de Developer Mode aparece e pode ser lançado por SSAP;
- o aplicativo desaparece se a sessão de Developer Mode expirar;
- SSAP não torna nosso app um componente do sistema.

No Windows atual, um agente Node.js no Agendador de Tarefas funcionará somente quando o computador estiver ligado. Para uso contínuo, Home Assistant, Raspberry Pi ou NAS é mais adequado.

### Quick Access

Se o IPK aparecer entre os aplicativos atribuíveis, manter um número do controle pressionado pode abrir Mendes Home. É simples e reversível, mas continua sendo uma ação manual.

### Tela ao ligar/entrada recente

Desligar **Home Auto Launch** ou selecionar **Power On Screen → Recent Input**, se essas opções existirem, pode evitar a Home ao ligar. Isso não garante que um IPK comum seja retomado e precisa de teste separado.

## Botão Home

O botão físico Home continua destinado à Home da LG. Um aplicativo em primeiro plano não recebe autoridade global para impedir esse comportamento.

Um agente SSAP poderia observar o aplicativo em primeiro plano e, ao detectar a Home oficial, abrir Mendes Home novamente. Isso produziria um redirecionamento depois de um pequeno atraso, não um remapeamento real. Pode causar uma breve exibição da Home e dificultar acesso a configurações. Por isso, só deve existir como modo opcional, com pausa fácil, e não como comportamento padrão.

## Conteúdo promocional

Dentro de Mendes Home, a interface pode ser completamente livre de promoções. Para a Home oficial, devem ser auditadas as opções que realmente aparecem neste firmware brasileiro antes de alterar qualquer uma:

- **Home Promotion / Promoção na Home → OFF**;
- **Content Recommendation / Recomendação de conteúdo → OFF**;
- **Home Auto Launch → OFF**;
- **Power On Screen / Tela ao ligar → Recent Input**;
- **Live Plus → OFF**;
- **Limit Ad Tracking / Limitar rastreamento → ON**;
- consentimentos opcionais de informações de visualização e publicidade baseada em interesses.

Os nomes e caminhos variam por região e atualização. Essas opções reduzem recomendações, coleta ou personalização, mas não garantem a remoção de todos os espaços patrocinados e não afetam anúncios dentro de serviços como YouTube ou Netflix.

DNS filtrado por Pi-hole ou AdGuard Home é externo e reversível, mas pode quebrar LG Content Store, login, capas, voz, recomendações ou atualizações. Não é necessário para a primeira versão. Menu de serviço, Hotel Mode, remoção de pacotes e edição da Home ficam excluídos.

## Matriz de viabilidade

| Recurso | Situação | Privilégio |
|---|---|---|
| Interface personalizada | Documentado; IPK ainda não instalado | Sem root |
| Navegação pelo controle | Documentado pela LG; teste no IPK pendente | Sem root |
| Abrir aplicativos por ID | Documentado oficialmente por `webOSDev.launch` | Sem root |
| Enumerar todos os apps | API existente; resultado nesta TV pendente | Sem root, sujeito a filtro |
| Quick Access | Possível; presença do IPK na lista pendente | Sem root |
| Autoabrir após ligar via SSAP | Forte candidato; portas confirmadas, pareamento pendente | Sem root + agente externo |
| Retomar IPK pela opção de tela ao ligar | Possibilidade não comprovada | Sem root |
| Remapear Home nativamente | Sem API pública | OEM/root |
| Substituir a LG Home | Sem API pública | OEM/root/firmware assinado |
| Remover módulos da Home | Bloqueado e arriscado | Root/sistema |
| Reduzir promoções por ajustes oficiais | Opções ainda precisam ser auditadas no aparelho | Sem root |

## Reversão da solução recomendada

- parar ou remover o agente SSAP;
- apagar sua `client-key` local e revogar o controle móvel/LG Connect Apps, se desejado;
- remover a atribuição de Quick Access;
- desinstalar somente Mendes Home;
- restaurar individualmente as opções oficiais de Home e privacidade;
- desligar o Developer Mode quando os testes terminarem.

Nenhuma dessas ações exige alterar firmware ou pacote do sistema.

## Fontes

- [LG: webOSTVJSLibrary — lançamento de aplicativos](https://github.com/webOS-TV-app-samples/webOSTVJSLibrary#launching-an-app-with-parameters)
- [LG: AppLifecycle](https://github.com/webOS-TV-app-samples/AppLifecycle)
- [LG: RemoteControl](https://github.com/webOS-TV-app-samples/RemoteControl)
- [LG: BackButtonControl](https://github.com/webOS-TV-app-samples/BackButtonControl)
- [CLI oficial webOS](https://github.com/webos-tools/cli)
- [SAM do webOS OSE, apenas como referência arquitetural](https://github.com/webosose/sam)
- [Home Assistant: LG webOS TV e automação de aplicativo após ligar](https://www.home-assistant.io/integrations/webostv/#switching-source-with-automation)
- [Biblioteca aiowebostv](https://github.com/home-assistant-libs/aiowebostv)
- [LG Brasil: suporte do modelo 55UR8750PSA](https://www.lg.com/br/suporte/produto/lg-55UR8750PSA.AWZ)
