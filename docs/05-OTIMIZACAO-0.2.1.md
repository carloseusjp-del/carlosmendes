# Otimização de desempenho — Mendes Home 0.2.1

A versão 0.2.1 preserva o layout aprovado e troca os efeitos mais caros por equivalentes pré-compostos. O objetivo é reduzir pintura, composição e memória na LG 55UR8750PSA sem remover a identidade Liquid Glass.

## Gargalos encontrados

- `backdrop-filter` ativo sobre o dock e painéis grandes;
- textura de tela inteira com `mix-blend-mode`;
- várias superfícies grandes animadas ao mesmo tempo;
- biblioteca completa e seus ícones construídos mesmo quando fechada;
- imagens TMDB maiores que a área de exibição;
- duas séries de leituras síncronas de layout a cada seta do controle;
- rolagens suaves sobrepostas ao navegar rapidamente.

## Alterações

- **Leve · TV** passa a ser o padrão no webOS e é aplicado uma vez às instalações 0.2.0 existentes.
- Leve e Equilibrado usam gradiente, reflexo e borda para simular vidro sem blur em tempo real.
- Máximo mantém blur real como escolha manual.
- A textura com blend é desativada no webOS.
- A tela inteira deixa de ser escalada ao abrir Ajustes.
- Gaveta e painéis movimentam menos superfícies e usam transições menores.
- Todos os aplicativos são criados somente quando a biblioteca é aberta e liberados ao fechar.
- Ícones usam a imagem menor oferecida pelo sistema, com decodificação assíncrona.
- TMDB usa `w780` no destaque e `w342` nos cartões em Leve/Equilibrado; Máximo mantém `w1280`/`w500`.
- O SVG local deixa de ser pintado quando a imagem TMDB já está visível.
- A navegação mede cada elemento uma única vez e usa índice direto na grade de aplicativos.
- A rolagem do foco passa a ser instantânea.

## Comparação automatizada

Ambas as versões foram medidas pelo mesmo teste em Chromium headless, viewport 1920×1080. Os valores servem para comparação relativa e não substituem a medição na TV.

| Cenário | 0.2.0 média / p95 | 0.2.1 média / p95 | Quadros acima de 33 ms |
| --- | ---: | ---: | ---: |
| Navegação Equilibrado | 20,11 / 33,4 ms | 16,76 / 16,7 ms | 12 → 0 |
| Navegação Leve | 16,76 / 16,8 ms | 16,67 / 16,8 ms | 0 → 0 |
| Painéis Equilibrado | 34,13 / 50,1 ms | 19,66 / 33,4 ms | 55 → 8 |
| Painéis Leve | não medido no baseline | 16,67 / 16,8 ms | 0 na versão 0.2.1 |

O perfil que será usado automaticamente na TV, **Leve · TV**, manteve navegação e painéis no intervalo de aproximadamente 16,7 ms por quadro nesse teste.

## Medição na TV

Com o launcher aberto, execute em outro PowerShell:

```powershell
npx --no-install ares-device -r -id com.carlosmendes.mendeshome -t 1 -d lg-sala
```

Registre CPU e memória por 30 segundos em repouso e por 30 segundos navegando continuamente. Encerre com `Ctrl+C`. O resultado na TV é a evidência definitiva da melhora.
