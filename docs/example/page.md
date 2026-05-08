# Eixos Estratégicos

## História de Usuário

**Como** usuário (gestor/cidadão)  
**Quero** visualizar os eixos estratégicos do PPA com seus programas e indicadores  
**Para** entender a organização das ações governamentais e analisar o desempenho por eixo.

---

## Comportamento

### Entrada de Dados
1. Clique em um card de eixo estratégico.
2. Clique em "Ver detalhes".
3. Navegação entre abas do modal:
    - Indicadores
    - Programas
    - Gráficos
    - Notícias
4. Scroll dentro do modal.
5. Clique para fechar o modal.

### Processamento
1. Buscar lista de eixos estratégicos cadastrados.
2. Para cada eixo:
    - Calcular percentual de execução.
    - Recuperar lista de programas vinculados.
3. Ao clicar no eixo:
    - Carregar dados detalhados do eixo selecionado.
    - Buscar indicadores associados.
    - Buscar dados financeiros (Dotação, Valor executado, Percentual de execução).
4. Processar abas do modal:
    - Carregar conteúdo sob demanda (lazy loading).
5. Calcular desempenho dos indicadores:
    - Comparar valor realizado vs meta.
6. Renderizar barras de progresso com base nos percentuais.
7. Garantir integridade dos dados antes da exibição.

### Saída de Dados

**Na tela principal:**
* Cards dos eixos contendo: Nome, Descrição, Percentual de execução, Lista resumida de programas e Quantidade total de programas.

**No modal:**
* Nome do eixo selecionado.
* Dados financeiros: Dotação, Executado e Execução (%).
* Abas com conteúdo: Indicadores (com barras de progresso e metas), Programas, Gráficos e Notícias.
* Feedback visual: Destaque de seleção e animações de carregamento.

---

## Critérios de Aceitação

| ID | Título | Cenário |
| :--- | :--- | :--- |
| **CA01** | Exibição dos Eixos Estratégicos | Dado que existem eixos cadastrados, quando a tela for carregada, então todos os eixos devem ser exibidos em formato de cards. |
| **CA02** | Abertura de Detalhes do Eixo | Dado que o usuário visualiza os eixos, quando clicar em um eixo ou "Ver detalhes", então deve ser exibido um modal com os dados detalhados. |
| **CA03** | Carregamento de Dados do Modal | Dado que o modal foi aberto, quando os dados forem carregados, então devem ser exibidas informações financeiras e indicadores corretamente. |
| **CA04** | Navegação entre Abas | Dado que o usuário está no modal, quando clicar em uma aba, então o conteúdo correspondente deve ser exibido. |
| **CA05** | Exibição de Indicadores | Dado que existem indicadores cadastrados, quando a aba de indicadores for acessada, então os indicadores devem ser exibidos com metas e progresso. |
| **CA06** | Fechamento do Modal | Dado que o modal está aberto, quando o usuário clicar em fechar, então o modal deve ser encerrado corretamente. |

---

## Regras de Negócio

| ID | Título | Regra |
| :--- | :--- | :--- |
| **RN01** | Cálculo de Execução do Eixo | Deve calcular o percentual de execução com base no valor executado dividido pela dotação total. |
| **RN02** | Exibição de Programas | Deve exibir apenas programas vinculados ao eixo selecionado. |
| **RN03** | Indicadores com Meta | Deve exibir indicadores apenas se possuírem meta e valor realizado. |
| **RN04** | Cálculo de Desempenho do Indicador | Deve calcular o percentual de desempenho com base no valor realizado em relação à meta. |
| **RN05** | Carregamento Sob Demanda | Deve carregar os dados das abas apenas quando forem acessadas (lazy loading). |
| **RN06** | Integridade dos Dados Financeiros | Deve garantir que valores financeiros (dotação e executado) sejam válidos antes da exibição. |
| **RN07** | Fechamento Seguro do Modal | Deve permitir o fechamento do modal sem perda de estado da tela principal. |

---

## Detalhamento dos Campos

### 1. Cabeçalho e Geral
| Local | Descrição | Tipo | Observação |
| :--- | :--- | :--- | :--- |
| Cabeçalho | Eixos Estratégicos | String | Título. |
| Cabeçalho | Estrutura programática do PPA XXXX-XXXX | String | Subtítulo informativo. |
| Exportar | PDF / DOCX | Dropdown | Obrigatório: Sim. Ação de exportação. |

### 2. Card de Eixos (Tela Principal)
| Campo | Descrição | Tipo | Observação |
| :--- | :--- | :--- | :--- |
| Identificador | ID interno do eixo | Integer | Obrigatório: Sim. |
| Nome do Eixo | Título do eixo | String | Máx. 100 caracteres. |
| Descrição | Objetivo resumido | String | Máx. 255 caracteres. |
| Percentual | Execução do eixo | Decimal | Exibição em porcentagem. |
| Indicadores | Total de indicadores | Integer | Contagem total vinculada. |
| Programas Resumo | Lista de programas | Lista | Código e Nome do programa. |
| Quantidade | Total de programas | Integer | Contagem total vinculada. |
| Ver Detalhes | Link de ação | Hiperlink | Abre o modal de detalhes. |

### 3. Modal de Detalhes - Visão Geral
| Campo | Descrição | Tipo | Observação |
| :--- | :--- | :--- | :--- |
| Nome do Eixo | Título no modal | String | Máx. 100 caracteres. |
| Descrição | Descrição completa | String | Máx. 255 caracteres. |
| Dotação | Valor total previsto | Decimal | Formato: Moeda (R$). |
| Executado | Valor já utilizado | Decimal | Formato: Moeda (R$). |
| Execução | Percentual realizado | Decimal | Formato: Porcentual (%). |

### 4. Modal de Detalhes - Abas Internas

#### Aba: Indicadores
| Campo | Descrição | Tipo | Observação |
| :--- | :--- | :--- | :--- |
| Nome Indicador | Identificação do indicador | String | Nome técnico. |
| Valor Atual | Realizado no período | String | Valor medido. |
| Meta | Valor objetivo | Decimal | Alvo a ser alcançado. |
| Desempenho | % de alcance da meta | Decimal | Cálculo: (Realizado / Meta). |
| Barra de Progresso | Representação visual | Gráfico | Barra preenchida em %. |

#### Aba: Programas
| Campo | Descrição | Tipo | Observação |
| :--- | :--- | :--- | :--- |
| Programa | Número do programa | Decimal | ID/Código do programa. |
| Nome | Título do programa | String | Nome completo. |
| Descrição | Objetivo do programa | String | Máx. 100 caracteres. |
| Dotação | Valor previsto | Decimal | Valor em R$. |
| Executado | Valor executado | Decimal | Valor em R$. |
| Execução (%) | Percentual realizado | Decimal | Porcentagem. |
| Pág. RAG | Referência ao relatório | String | Número da página no RAG. |

#### Aba: Gráficos
| Item | Descrição | Tipo | Observação |
| :--- | :--- | :--- | :--- |
| Execução por Programa | Título do gráfico | String | Máx. 100 caracteres. |
| Gráfico de Barras | Comparativo financeiro | Gráfico | Barras agrupadas por programa. |
| Tooltip | Detalhes no hover | Tooltip | Exibe: Nome, Dotação e Executado. |
| Indicadores vs Meta | Título do gráfico | String | Máx. 100 caracteres. |
| Barras Horizontais | Comparativo de meta | Gráfico | Valor realizado vs Meta. |

#### Aba: Notícias
| Campo | Descrição | Tipo | Observação |
| :--- | :--- | :--- | :--- |
| Nome da Matéria | Título da notícia | Card | Clicável. |
| Data de Publicação | Data da notícia | Data | Formato DD/MM/AAAA. |
| Redirecionamento | Link externo | Ação | Abre a fonte original da matéria. |


