# Documento de Análise: Perfil de Acesso

## 1. Introdução
Este documento detalha o funcionamento do módulo de **Perfil de Acesso**, responsável por gerenciar as permissões granulares dos usuários dentro do sistema. O módulo permite criar papéis (roles) específicos e definir quais ações (visualizar, criar, atualizar, deletar) cada papel pode realizar em cada tela do sistema.

---

## 2. Funcionamento do Módulo (Protótipo Atual)

### 2.1. Arquitetura e Fluxo de Dados
O gerenciamento de acessos utiliza uma arquitetura baseada em múltiplos arquivos JSON:
- **Perfis**: Armazenados em `data/access-profile.json`.
- **Acessos (Vínculos)**: A relação entre perfil, tela e permissão é mantida em `data/accesses.json`.
- **Telas**: Definições de telas disponíveis em `data/screens.json`.
- **Permissões**: Tipos de ações (view, create, update, delete) em `data/permissions.json`.

### 2.2. Matriz de Permissões
Diferente de outros formulários, o Perfil de Acesso implementa uma **Matriz de Permissões** (Grid):
1. **Mapeamento Restritivo**: Nem todas as telas possuem todas as ações (ex: algumas telas não permitem deleção). Isso é controlado pelo `SCREEN_PERMISSIONS_MAPPING` no componente.
2. **Herança Global**: Certas permissões são consideradas globais e obrigatórias (ex: `dashboard:view`). Estas são injetadas automaticamente via `GLOBAL_PERMISSIONS_MAPPING` e ocultadas da interface para simplificar a gestão.
3. **Visual**: As opções não permitidas para uma tela específica são exibidas desabilitadas e com opacidade reduzida.

### 2.3. Validação no Login
O sistema agora valida o status do perfil no momento da autenticação. Se o perfil de um usuário estiver inativo (`is_active: false`) ou marcado como excluído, o login é bloqueado, mesmo que o usuário individual esteja ativo.

---

## 3. Regras de Negócio e Permissões (RBAC)

### 3.1. Controle de Acesso Granular
O módulo valida quatro permissões específicas para a tela `access_profile`:
- **view**: Permite listar os perfis e visualizar detalhes (leitura).
- **create**: Habilita a criação de novos perfis e a definição inicial de permissões.
- **update**: Permite alterar o nome, status e a matriz de permissões de perfis existentes.
- **delete**: Permite a exclusão lógica (`deleted_at`) de perfis.

### 3.2. Proteção e Integridade
- **Multi-tenancy**: Perfis de acesso são isolados por `client_id`. Um administrador de uma organização não pode visualizar ou editar perfis de outra.
- **Validação de Servidor**: As Server Actions (`access-profile-action.ts`) revalidam as permissões do administrador antes de qualquer operação de escrita ou deleção.

---

## 4. Componentes e UI/UX

### 4.1. DataTable Padronizado
Segue o padrão de UX do sistema:
- **Ações**: Coluna alinhada à direita (`justify-end`) com tooltips para Editar/Visualizar e Excluir.
- **Status**: Badge colorido para indicar se o perfil está Ativo ou Inativo.
- **Datas**: Formatação brasileira padronizada (`DD/MM/AAAA - HH:mm`).

### 4.2. FormButtons (Rodapé Fixo)
Implementação de um componente de rodapé reutilizável (`FormButtons`):
- **Posicionamento Inteligente**: Ajusta seu recuo (`left`) dinamicamente com base no estado da Sidebar (expandida, recolhida ou mobile).
- **Ações**: Botões de Voltar, Descartar e Salvar/Criar sempre visíveis no final da página.
- **Blur**: Efeito de vidro (backdrop-blur) para manter a elegância visual.

### 4.3. Interface da Matriz
- **Checkboxes Centralizados**: Alinhamento vertical e horizontal perfeito dentro das colunas da tabela de permissões.
- **Feedback de Permissão**: Telas que não suportam certas ações bloqueiam o checkbox correspondente, evitando configurações inválidas.

---

## 5. Requisitos para Integração com API Real

### 5.1. Performance
- **Cache de Permissões**: Em produção, as permissões do usuário devem ser cacheadas (ex: Redis) após o login para evitar consultas repetitivas ao banco de dados em cada renderização de página/componente.

### 5.2. Segurança
- **Proteção contra Escalação**: Impedir que um usuário com permissão de editar perfis conceda a si mesmo ou a outros permissões que ele próprio não possui.

---

## 6. Checklist de Implementação
- [x] CRUD completo de Perfis de Acesso.
- [x] Matriz de permissões com mapeamento restritivo por tela.
- [x] Injeção automática de permissões globais.
- [x] Validação de perfil ativo no login.
- [x] Rodapé fixo (`FormButtons`) com ajuste dinâmico de sidebar.
- [x] Checkboxes centralizados e cabeçalhos fixos.
- [x] Títulos e descrições dinâmicos baseados no `screens.json`.
