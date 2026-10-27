# DJI Avata 2 — preset da versão 1.4.0

## Origem e identidade

O usuário forneceu o arquivo `DJI Avata 2 D-Log M to Rec.709 V1._.cube` para uso
na sua DJI Avata 2. O original foi copiado sem alteração de bytes para
`assets/luts/DJI-Avata-2-DLogM-to-Rec709.cube`.

- Tamanho: 1.042.315 bytes.
- SHA-256: `b18162854ab47702068410c33afa98a8cb6eef159fc5a04ce0e65fad0fd8947e`.
- Formato: LUT 3D 33×33×33, 35.937 entradas RGB; domínio implícito 0–1.
- Valores tabulados finitos, mínimo 0 e máximo 1 em cada canal.
- Comentário interno: `Mavic 3 Pro, D-Log M, 2023-03-24`.
- Gamma de saída: não declarado no arquivo.

O comentário interno diverge do modelo no nome enviado. Foi mantido, sem
substituir a identificação ou inventar confirmação independente da DJI.
Não há instruções ou termos de licença adicionais no arquivo enviado.

## Como o preset funciona

`scripts/embed_lut.py` verifica o SHA-256 e a dimensão do original antes de gerar
um array RGB em `build/generated/avata2_lut.hpp`. Essa tabela é compilada para
o binário; o preset não busca caminhos locais nem depende de um download.
A tabela imutável é inicializada uma vez, com a mesma ordem de entradas do
original: vermelho varia mais rápido, seguido de verde e azul.

A interpolação é trilinear. Os pixels fora do domínio de entrada são limitados
às bordas; a saída interpolada não recebe clipping adicional. O original tem
valores 0–1, portanto sua tabela já impõe esses limites numéricos.

Fluxo: desmultiplicar alfa → LUT de entrada → recodificação opcional explicitamente
selecionada → ajustes/looks/ferramentas avançadas → Halation e Bloom opcionais → Effect Mix com a entrada original → remultiplicar
alfa. Effect Mix=0 desativa a cadeia inteira. O padrão é Input LUT=None para
preservar projetos anteriores. Look Strength=0 conserva a LUT e as correções
manuais, retirando apenas o estilo. Os 19 looks operam sobre a imagem já convertida.
Halation opera após esses looks e não aplica outra LUT. Seu padrão é Desligado.

O modo Custom aceita arquivos `.cube` 3D 2–65, domínio explícito, comentários,
BOM UTF-8 e `LUT_3D_INPUT_RANGE`. Há cache por instância com mutex, snapshots
imutáveis e invalidação por caminho, tamanho ou data de modificação. Arquivos
inválidos, 1D/shapers e tabelas incompletas são rejeitados com mensagem no host,
quando sua suite de mensagens está disponível.

## Gamma 2.4: configuração e limite

O preset preserva a saída fornecida. O arquivo não demonstra que sua curva
matemática de saída seja uma potência 2.4, e a identificação Rec.709 não basta
para deduzir isso. Não foi aplicada uma curva extra para criar essa aparência.

No fluxo manual recomendado, use os originais D-Log M em DaVinci YRGB, configure
saída/monitoramento como Rec.709 Gamma 2.4 e selecione o preset embutido. Mantenha
LUT Output Transfer=Keep LUT output e Creative Gamma=1. Não some outra
normalização técnica ao sinal sem definir claramente os espaços do node.

A recodificação opcional BT.709 OETF to Gamma 2.4 foi testada matematicamente:
inverte a OETF de câmera BT.709 e aplica potência de codificação 1/2.4, preservando
o sinal. Só é apropriada quando a curva de origem da LUT está documentada.
Ela não é ativada automaticamente para o arquivo fornecido.

## Verificação

Foram verificados parsing, dimensão, valores finitos, limites e hash do original.
Os testes comparam a tabela embutida com o `.cube` original em coordenadas da
malha e entre seus pontos. Referências independentes retiradas do arquivo:

| RGB de entrada | RGB tabulado de saída |
|---|---|
| 0,5 / 0,5 / 0,5 | 0,487409 / 0,487448 / 0,487588 |
| 0,25 / 0,5 / 0,75 | 0,051170 / 0,473806 / 0,907144 |
| 0,75 / 0,25 / 0,5 | 0,873104 / 0,110849 / 0,494441 |

O teste do host OpenFX renderiza o preset com o campo de arquivo vazio,
confere a referência cinza e preservação do alfa premultiplicado. Isso valida
a aplicação da tabela fornecida, não a resposta colorimétrica física da câmera.
A comparação com filmagem real, um chart de cor e a renderização no Resolve
continua pendente do teste no computador do usuário.

O original e `PROVENANCE.json` também são incluídos no bundle para inspeção.
Editar esse original de referência após instalar não altera os dados embutidos;
use Custom para aplicar outra tabela sem recompilar.
