# Dashboard Executivo

## História de Usuário

**Como** gestor ou administrador da campanha  
**Quero** ter uma visão geral do desempenho e acesso rápido às principais ferramentas  
**Para** monitorar a saúde da campanha e navegar facilmente pelo sistema.

---

## Comportamento

### Entrada de Dados
1. Acesso automático após o login bem-sucedido.
2. Interação com botões de navegação e cards de métricas.

### Processamento
1. **Identificação de Contexto**: Recuperar o `domain` (tenant) através da URL dinâmica `[domain]`.
2. **Cálculo de Métricas**: (Planejado) Agregar dados de equipe, atividades e resultados para exibição.
3. **Validação de Sessão**: O middleware garante que apenas usuários autenticados acessem esta página.

### Saída de Dados
* Header de página com Breadcrumbs.
* Cards de métricas e boas-vindas personalizados com o nome do domínio.
* Botão de Logout ("Sair da conta") com ação destrutiva.

---

## Critérios de Aceitação

| ID | Título | Cenário |
| :--- | :--- | :--- |
| **CA01** | Exibição de Dados do Tenant | Dado que o usuário acessou o dashboard de um domínio específico, quando a página carregar, então o nome do domínio deve ser exibido no título. |
| **CA02** | Navegação Breadcrumb | Dado que o usuário está no dashboard, quando visualizar o cabeçalho, então deve ver o caminho de navegação correto. |
| **CA03** | Finalização de Sessão | Dado que o usuário clicou em "Sair", quando a action for processada, então deve ser deslogado e redirecionado para a tela de login. |

---

## Regras de Negócio

| ID | Título | Regra |
| :--- | :--- | :--- |
| **RN01** | Acesso Restrito | A página deve ser protegida por autenticação; tentativas de acesso anônimo devem redirecionar para `/sign-in`. |
| **RN02** | Isolamento por Domínio | O dashboard deve carregar apenas dados pertencentes ao tenant identificado no parâmetro `[domain]`. |

---

## Detalhamento dos Campos

| Local | Descrição | Tipo | Observação |
| :--- | :--- | :--- | :--- |
| Header | Título da Página | String | Exibe "Dashboard Executivo". |
| Header | Breadcrumbs | Navigation | Caminho: Dashboard. |
| Card | Nome do Domínio | Dynamic | Injetado via parâmetro de URL. |
| Botão | Sair da conta | Action | Finaliza a sessão atual. |
