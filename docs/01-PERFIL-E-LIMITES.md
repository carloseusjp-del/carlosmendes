# Perfil técnico registrado

## Equipamentos

| Item | Informação registrada | Estado |
|---|---|---|
| Marca | LG | Confirmado |
| Modelo | 55UR8750PSA, 55 polegadas | Informado pelo proprietário |
| Família do sistema | LG webOS TV | Confirmado pelo modelo e pelos dados do sistema |
| Versão exibida | webOS 24 / 9.2.1-40 | Informada pelo proprietário |
| SDK confirmado pela CLI | `9.2.1` | Confirmado por `ares-device` em 27/10/2026 |
| Firmware confirmado pela CLI | `23.21.20` | Confirmado por `ares-device` em 27/10/2026 |
| Identificador interno informado | `lgtv23crtk108312530` | Informação complementar da plataforma |
| Placa/região | `K8LPN_ATSC_BR` | Confirmada por `ares-device` em 27/10/2026 |
| Computador | Windows 11 | Confirmado |
| Rede do computador | Wi-Fi, IPv4 `192.168.0.103`, gateway `192.168.0.1` | Confirmado em 27/10/2026 |
| IPv4 da TV | `192.168.0.108` | Confirmado em 27/10/2026 |
| Comunicação PC → TV | Duas respostas de rede, aproximadamente 4 ms | Confirmada em 27/10/2026 |
| Aplicativo Developer Mode | Instalado na TV | Confirmado em 27/10/2026 |
| Dev Mode Status | `ON` | Ativado com autorização em 27/10/2026 |
| Key Server | `OFF` após o pareamento | Estado seguro confirmado em 27/10/2026 |
| Session Time | `999h:57m` | Confirmado após reinicialização em 27/10/2026 |
| Autorização para ativar Dev Mode | Concedida pelo proprietário | 27/10/2026 |
| Porta de desenvolvimento TCP 9922 | Acessível de `192.168.0.103` para `192.168.0.108` | Confirmada em 27/10/2026 |
| Autorização para Key Server | Concedida para ativação temporária | 27/10/2026 |
| Porta do Key Server TCP 9991 | Acessível de `192.168.0.103` para `192.168.0.108` | Confirmada em 27/10/2026 |
| Node.js no Windows | `v24.20.0` | Confirmado em 27/10/2026 |
| npm no Windows | `11.19.0` | Confirmado em 27/10/2026 |
| CLI oficial webOS no Windows | `@webos-tools/cli` 3.2.6, instalação local ao projeto | Confirmada em 27/10/2026 |
| Registro local da TV | `lg-sala`, `prisoner@192.168.0.108:9922`, perfil `tv` | Confirmado em 27/10/2026 |
| Chave de desenvolvimento | Obtida e salva em `%USERPROFILE%\.ssh\lg-sala_webos`; senha não registrada | Confirmada em 27/10/2026 |
| Pareamento CLI → TV | Comunicação autenticada e leitura de informações concluída | Confirmado em 27/10/2026 |
| Conexão após desligar Key Server | Operacional pela chave já armazenada | Confirmada em 27/10/2026 |

O texto `lgtv23` no identificador indica a base interna da geração da plataforma e pode coexistir com uma atualização de experiência identificada como webOS 24. A leitura pela CLI e a tela **Configurações > Suporte > Informações da TV** serão usadas para registrar os campos exatos, sem mudar qualquer configuração.

## Método oficial de desenvolvimento

- Aplicativo **Developer Mode** obtido na LG Content Store.
- Conta gratuita no portal LG Developer.
- Computador e TV na mesma rede local.
- **Developer Mode Status** ligado.
- **Key Server** ligado durante o pareamento.
- CLI oficial `@webos-tools/cli` 3.2.6, perfil `tv`.
- Comunicação por chave SSH temporária, porta TCP 9922 e usuário restrito `prisoner`.
- Empacotamento do aplicativo web como `.ipk`, seguido de instalação com `ares-install`.

Este processo não usa SDB, ADB, root, menu de serviço ou alteração de firmware.

## Recursos viáveis sem root

| Recurso | Viabilidade | Observação |
|---|---|---|
| Interface própria em tela cheia | Alta | Aplicativo web HTML/CSS/JavaScript otimizado para TV. |
| Navegação por setas, OK e Voltar | Alta | Eventos do controle e gerenciamento explícito de foco. |
| Temas, planos de fundo e organização | Alta | Preferências podem ser mantidas no armazenamento do aplicativo. |
| Exibir aplicativos disponíveis | Provável | A API pública do Application Manager será testada no aparelho; a lista pode ser filtrada pelo sistema. |
| Abrir um aplicativo escolhido | Provável | Depende de o alvo permitir lançamento pela API pública. |
| Interface sem promoções | Alta | Dentro do nosso launcher, o conteúdo e o layout são inteiramente nossos. |
| Atalho rápido pelo controle | Alta | O aplicativo pode ser fixado/ordenado na Home e associado ao Quick Access, conforme os recursos da TV. |

## Limites oficiais sem privilégios especiais

| Objetivo | Situação esperada |
|---|---|
| Substituir a LG Home como launcher padrão | Não há mecanismo público para um aplicativo comum assumir o papel do launcher do sistema. |
| Interceptar o botão Home | O botão é reservado ao sistema e normalmente retorna à LG Home. Um aplicativo comum não pode remapeá-lo globalmente. |
| Iniciar automaticamente junto com a TV | Não é uma permissão pública normal para aplicativos de usuário instalados em Developer Mode. |
| Remover anúncios ou módulos da LG Home | Não é permitido pelas APIs públicas. Nosso aplicativo pode simplesmente não exibi-los em sua própria tela. |
| Remover ou substituir aplicativos do sistema | Fora do escopo permitido e bloqueado para o usuário `prisoner`. |
| Permanecer instalado indefinidamente em Developer Mode | O modo possui sessão com prazo. É necessário usar **Extend Session Time**; ao expirar, aplicativos de desenvolvimento podem ser removidos e a chave deixa de funcionar. |
| Publicação permanente | Exige avaliar distribuição pela LG Content Store e cumprir a certificação da LG. |

O teste no modelo real decidirá quais métodos do Application Manager estão disponíveis. Nenhuma API privada será presumida como acessível.

## Arquitetura inicial recomendada

- Aplicativo web leve, com TypeScript ou JavaScript, CSS e poucos componentes.
- Renderização de apenas os itens visíveis e imagens dimensionadas para reduzir uso de memória.
- Foco espacial determinístico para o controle remoto.
- Camada separada para consultar e abrir aplicativos pelo Application Manager.
- Persistência local de ordem, favoritos, tema e plano de fundo.
- Sem backend obrigatório para a primeira versão.

Essa base favorece inicialização rápida e compatibilidade com o navegador embarcado do webOS.

## Reversibilidade

- Remover o registro do PC e, opcionalmente, a chave criada no pareamento: `scripts\Desfazer-Pareamento.ps1`.
- Desligar o **Key Server** encerra novas solicitações de chave.
- Desligar o **Developer Mode Status** encerra o ambiente de desenvolvimento da TV.
- Desinstalar nosso aplicativo pela interface da TV ou por `ares-install --remove` desfaz apenas a instalação de teste.
- A CLI do projeto pode ser removida apagando `node_modules`; ela é local à pasta do projeto.

## Referências oficiais

- [LG webOS TV — Developer Mode app](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app)
- [LG webOS TV — CLI introduction](https://webostv.developer.lge.com/develop/tools/cli-introduction)
- [LG webOS TV — Application Manager](https://webostv.developer.lge.com/develop/references/application-manager)
- [CLI oficial da LG no GitHub](https://github.com/webos-tools/cli)

