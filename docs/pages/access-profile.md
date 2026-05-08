# Perfil de Acesso

## História de Usuário

**Como** administrador do sistema  
**Quero** gerenciar os perfis de acesso e suas respectivas permissões  
**Para** garantir que cada usuário tenha acesso apenas às funcionalidades necessárias para sua função.

---

## Comportamento

### Entrada de Dados
1. Navegação para **Configurações > Perfis de Acesso**.
2. Clique em **"Novo Perfil"** para criar.
3. Clique no ícone de **Lápis** para editar um perfil existente.
4. Preenchimento do nome do perfil.
5. Alternância do status (Ativo/Inativo).
6. Marcação/Desmarcação de checkboxes na matriz de permissões.
7. Clique em **"Salvar Alterações"** ou **"Criar Registro"**.
8. Clique em **"Descartar"** para limpar alterações não salvas.

### Processamento
1. Carregar lista de perfis filtrados por `client_id`.
2. Identificar permissões permitidas para cada tela via `SCREEN_PERMISSIONS_MAPPING`.
3. Injetar permissões obrigatórias via `GLOBAL_PERMISSIONS_MAPPING` (ex: dashboard:view).
4. Validar se o nome do perfil foi preenchido.
5. Ao salvar:
    - Persistir dados básicos no arquivo de perfis.
    - Atualizar a tabela de relacionamentos (accesses) com as novas marcações.
    - Revalidar o cache da página via `revalidatePath`.
6. No Login:
    - Verificar se o perfil vinculado ao usuário está ativo.

### Saída de Dados

**Na listagem (DataTable):**
* Tabela com: Nome do Perfil, Status (Badge), Data de Criação.
* Ações: Editar (Lápis), Visualizar (Olho), Deletar (Lixeira).

**No Formulário:**
* Campo de texto para Nome.
* Switch para Status Ativo.
* Matriz de Permissões:
    - Linhas: Telas do sistema.
    - Colunas: Visualizar, Criar, Atualizar, Deletar.
    - Checkboxes: Habilitados apenas para permissões válidas para a tela.
* Rodapé Fixo: Botões de ação (Voltar, Descartar, Salvar).

---

## Critérios de Aceitação

| ID | Título | Cenário |
| :--- | :--- | :--- |
| **CA01** | Listagem de Perfis | Dado que existem perfis cadastrados, quando acessar a tela, então os perfis da organização devem ser listados corretamente. |
| **CA02** | Restrição de Permissões | Dado que uma tela não suporta deleção, quando visualizar a matriz, então o checkbox de "Deletar" deve estar desabilitado para essa tela. |
| **CA03** | Permissões Globais | Dado que um novo perfil é criado, quando salvar, então a permissão de dashboard deve ser adicionada automaticamente nos bastidores. |
| **CA04** | Bloqueio de Acesso | Dado que um perfil foi inativado, quando um usuário desse perfil tentar logar, então o sistema deve negar o acesso. |
| **CA05** | Rodapé Responsivo | Dado que a sidebar é recolhida, quando visualizar o formulário, então o rodapé fixo deve se expandir para ocupar o novo espaço à esquerda. |
| **CA06** | Exclusão Lógica | Dado que um perfil é deletado, quando confirmar a ação, então o registro deve receber um `deleted_at` e desaparecer da listagem. |

---

## Regras de Negócio

| ID | Título | Regra |
| :--- | :--- | :--- |
| **RN01** | Unicidade por Cliente | Perfis de acesso são restritos ao `client_id` do criador. |
| **RN02** | Mapeamento de Telas | A matriz de permissões deve respeitar rigorosamente o mapeamento de ações válidas por tela definido no código. |
| **RN03** | Status do Perfil no Login | O status `is_active` do perfil tem precedência sobre o status do usuário para permitir o login. |
| **RN04** | Preservação de Histórico | Exclusões são sempre lógicas (`soft delete`) para manter a integridade referencial de usuários antigos. |
| **RN05** | Nome Obrigatório | Não é permitido salvar um perfil sem nome. |
| **RN06** | Permissões Invisíveis | Permissões de telas consideradas "globais" (ex: dashboard) não devem ser editáveis pelo usuário. |

---

## Detalhamento dos Campos

### 1. Cabeçalho e Geral
| Local | Descrição | Tipo | Observação |
| :--- | :--- | :--- | :--- |
| Cabeçalho | Título Dinâmico | String | Novo / Editar [Nome] / Visualizar [Nome]. |
| Cabeçalho | Descrição Dinâmica | String | Carregada do `screens.json`. |
| Breadcrumbs | Navegação | Links | Configurações > Perfil de Acesso > [Ação]. |

### 2. Dados do Perfil (Card Principal)
| Campo | Descrição | Tipo | Observação |
| :--- | :--- | :--- | :--- |
| Nome do Perfil | Identificação do papel | String | Obrigatório. Máx 50 carac. |
| Status | Ativo ou Inativo | Switch | Padrão: Ativo. |

### 3. Matriz de Permissões (Card Matriz)
| Campo | Descrição | Tipo | Observação |
| :--- | :--- | :--- | :--- |
| Tela | Nome da tela/módulo | Texto | Exibe o nome amigável e a chave técnica. |
| Visualizar | Permissão de leitura | Checkbox | Coluna fixa, centralizada. |
| Criar | Permissão de inserção | Checkbox | Coluna fixa, centralizada. |
| Atualizar | Permissão de edição | Checkbox | Coluna fixa, centralizada. |
| Deletar | Permissão de exclusão | Checkbox | Coluna fixa, centralizada. |

### 4. Rodapé (FormButtons)
| Botão | Descrição | Ação | Variante |
| :--- | :--- | :--- | :--- |
| Voltar | Retorna à listagem | `router.push` | Outline |
| Descartar | Reseta o formulário | `form.reset()` | Ghost |
| Salvar / Criar | Envia os dados | `submit` | Default |
