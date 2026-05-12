# Plano de Implementação: Sidebar (Nav-Main/Nav-User) e Módulo Account

Este plano descreve a migração da Sidebar e do gerenciamento de conta para uma arquitetura 100% orientada a API, focando inicialmente na estrutura de navegação e nos dados do usuário logado.

## Objetivos
1. Consolidar o uso da API para renderizar o menu de navegação (`nav-main`) baseado em permissões reais.
2. **Otimização de Carregamento:** Incluir ícones e títulos das telas diretamente no retorno de permissões da sessão para simplificar a renderização da Sidebar.
3. Implementar o endpoint `/api/users/me` para fornecer dados detalhados do usuário ao `nav-user` e ao módulo `Account`.
4. Garantir a persistência dos dados da Sidebar durante a navegação via App Router.

## Arquitetura de Endpoints

### 1. `GET /auth/me` (Existente - Incremental)
- **Responsabilidade:** Validação de sessão (Redis).
- **Mudança:** O DTO de permissões (`UserPermissionDto`) passará a incluir o `Icon` e o `Title` (nome amigável para sidebar) da tela.
- **Uso:** A Sidebar usará esses dados para montar o menu dinamicamente sem precisar de chamadas extras a `/screens`.

### 2. `GET /api/users/me` (Novo/Avançado)
- **Responsabilidade:** Consulta direta ao Banco de Dados (PostgreSQL).
- **Dados Retornados:** Nome, e-mail, perfil de acesso (nome do cargo/perfil).
- **Avatar:** Não será implementado neste momento.
- **Uso:** Utilizado pelo `NavUser` (sidebar) e pela página de `Account`.

### 3. `PUT /api/users/me` (Novo)
- **Responsabilidade:** Atualização de perfil.
- **Campos:** Nome e e-mail.

---

## Mudanças Propostas

### 1. API (C# / .NET)

#### Controller: `AuthController.cs`
- Atualizar `GetUserPermissionsAsync` para projetar os campos `Icon` e `Sidebar` da tabela `Screens` no DTO de permissões.

#### Controller: `UsersController.cs`
- Implementar `GET /api/users/me`:
    - Deve exigir autenticação.
    - Retorna DTO: `{ "name": "...", "email": "...", "role": "..." }`.
- Implementar `PUT /api/users/me`:
    - Permite editar dados básicos (Nome e E-mail).

#### DTOs
- **`UserPermissionDto`:** Adicionar propriedades `Icon` e `Title`.
- **`UserMeDto`:** Novo DTO para o perfil do usuário.
- **`UpdateProfileRequest`:** Novo DTO para atualização.

#### Seed (`DatabaseSeeder.cs`)
- Atualizar a lista de telas para garantir que os ícones (`Icon`) e os nomes da sidebar (`Sidebar`) correspondam exatamente aos definidos no JSON original do frontend (ex: `layout-dashboard`, `users`, `landmark`).

---

### 2. Web (Next.js)

#### Server Actions
- **`sidebar-action.ts`:**
    - Refatorar `getSidebarData`.
    - Substituir a busca em JSON de usuários pela chamada ao novo `/api/users/me`.
    - Extrair os ícones e títulos diretamente da lista de permissões da sessão (obtida via `getSession`).
    - **Nota:** Dados de candidato/campanha serão mantidos como placeholders/estáticos por enquanto.
- **`account-action.ts` (Novo):**
    - `getProfile()`: Chama `GET /api/users/me`.
    - `updateProfile(data)`: Chama `PUT /api/users/me`.

#### Componentes
- **`NavMain.tsx`:** Atualizar para renderizar ícones e títulos vindos da API.
- **`NavUser.tsx`:** Atualizar para exibir o nome e e-mail vindos da Action.
- **`AppSidebar.tsx`:** Garantir que o carregamento aconteça no `layout` para persistência.
- **`AccountForm.tsx`:** Atualizar para exibir o nome, e-mail e perfil de acesso vindos da Action.

---

## Plano de Verificação

### Testes Automatizados
- `dotnet build`: Validar compilação dos novos endpoints e DTOs.
- `npm run lint`: Validar tipos no frontend.

### Verificação Manual
1. Abrir a Sidebar e validar se os ícones (ex: engrenagem, usuários) estão aparecendo corretamente vindo da API.
2. Validar se o nome do cargo (perfil de acesso) aparece corretamente no Account.
3. Alterar o nome no Account e verificar se a mudança é refletida no `NavUser` após atualização.
