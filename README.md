# Mendes Home para LG webOS

Launcher original com interface Liquid Glass para a LG 55UR8750PSA. O projeto usa o fluxo oficial de desenvolvimento do webOS TV e não modifica firmware, não faz root e não remove componentes da LG.

## Estado da etapa 4

- TV confirmada: LG 55UR8750PSA.
- Sistema: webOS 24 / SDK 9.2.1.
- Firmware confirmado pela TV: 23.21.20.
- Computador: Windows 11.
- Ferramentas: `@webos-tools/cli` 3.2.6, perfil `tv`.
- Dispositivo pareado: `lg-sala`, usuário restrito `prisoner`.
- Versão preparada: **Mendes Home 0.2.1**.
- IPK validado localmente; a instalação na TV usa somente o Developer Mode oficial e permanece reversível.

## Baixar

[**Baixar Mendes Home 0.2.1 para webOS**](dist/com.carlosmendes.mendeshome_0.2.1_all.ipk?raw=1)

Se o navegador bloquear a extensão IPK, use o [pacote ZIP com o IPK, checksum e instruções](dist/Mendes-Home-webOS-0.2.1.zip?raw=1).

Antes de instalar, siga [o guia de instalação, testes e restauração](docs/INSTALACAO-TV.md). O procedimento oficial usa o Developer Mode e a webOS CLI no Windows.

No computador já pareado como `lg-sala`, o arquivo [INSTALAR-MENDES-HOME-0.2.1.cmd](INSTALAR-MENDES-HOME-0.2.1.cmd) automatiza o diagnóstico, download, validação SHA-256, instalação e abertura do launcher. Para desfazer, execute o mesmo arquivo com `/remover`.

O protótipo visual para navegador continua disponível em [Mendes Home — pacote leve](dist/Mendes-Home-Prototipo-LEVE.zip?raw=1).

## Recursos implementados

- interface clara Liquid Glass, otimizada para plano lógico de 1920×1080;
- navegação por setas, OK, Voltar e teclas coloridas do controle;
- dock com oito favoritos, ordenação e seleção pela biblioteca completa;
- tentativa segura de listar launch points e aplicativos do webOS;
- fallback por aplicativos conhecidos quando o firmware limita a enumeração;
- abertura de aplicativos pelo Application Manager;
- atalhos para TV ao vivo e HDMI 1 a 3, sujeitos à confirmação no aparelho;
- gaveta de entradas e atalhos;
- papéis de parede, intensidade do vidro, desfoque, qualidade e movimento persistentes;
- catálogo opcional da TMDB para Descobrir, Filmes e Séries;
- chave TMDB fornecida pelo próprio usuário e guardada apenas no armazenamento local do app;
- cache do catálogo para uso temporário sem conexão.
- perfil **Leve · TV** aplicado automaticamente na atualização 0.2.1;
- vidro pré-composto sem blur em tempo real nos modos Leve e Equilibrado;
- biblioteca carregada somente quando aberta e imagens TMDB dimensionadas para a tela;
- navegação espacial com menos leituras de layout e rolagem instantânea pelo controle.

## Validação local concluída

O teste automatizado cobre fallback sem TV, navegação, gaveta, biblioteca, ajustes, persistência, TMDB simulada e uma simulação do `PalmServiceBridge`. Nessa simulação, dez aplicativos foram enumerados, um aplicativo da biblioteca foi fixado no dock e o pedido de abertura chegou ao Application Manager.

O benchmark comparativo em Chromium 1920×1080 mediu o modo Leve em aproximadamente **16,7 ms por quadro**, com p95 de **16,8 ms** e nenhum quadro acima de 33 ms durante navegação e abertura dos painéis. Antes da otimização, os painéis tinham média de 34,1 ms, p95 de 50,1 ms e 55 quadros acima de 33 ms. A medição serve para comparar versões; o resultado final precisa ser confirmado na TV.

```bash
npm run test:browser
npm run test:performance
npx --no-install ares-package -c app
npx --no-install ares-package app -o dist
npx --no-install ares-package -I dist/com.carlosmendes.mendeshome_0.2.1_all.ipk
```

Esses testes não substituem o teste na TV. Fluidez da GPU, IDs das entradas, permissões de enumeração, acesso à TMDB e abertura dos aplicativos precisam ser comprovados na unidade 55UR8750PSA.

## Limites confirmados

O SDK público de um aplicativo comum em Developer Mode não oferece uma API documentada para substituir a Home da LG, interceptar globalmente o botão Home ou iniciar o launcher automaticamente ao ligar. Esta versão permanece um aplicativo reversível. Depois do teste, o mecanismo nativo **Quick Access** da LG pode ser usado como atalho por um número do controle, se disponível no aparelho.

O firmware pode negar a lista completa de aplicativos mesmo quando permite abrir IDs conhecidos. O Mendes Home informa esse estado como acesso limitado e não tenta elevar privilégios.

## Documentação

- [Perfil da TV e limites](docs/01-PERFIL-E-LIMITES.md)
- [Primeira conexão](docs/02-PRIMEIRA-CONEXAO.md)
- [Investigação sobre Home e inicialização](docs/03-INVESTIGACAO-ETAPA-2.md)
- [Protótipo visual](docs/04-PROTOTIPO-VISUAL-ETAPA-3.md)
- [Otimização e benchmark da versão 0.2.1](docs/05-OTIMIZACAO-0.2.1.md)
- [Instalação, testes e restauração](docs/INSTALACAO-TV.md)
- [Direitos autorais](COPYRIGHT.md)
- [Avisos de terceiros](THIRD_PARTY_NOTICES.md)

Copyright © 2026 Carlos Mendes. Todos os direitos reservados.
