# Documento de Análise: Cadastro de Usuários

## 1. Introdução
Este documento detalha o funcionamento do módulo de **Cadastro de Usuários**, responsável por gerenciar o acesso de colaboradores ao sistema. O módulo permite a criação, edição, visualização e exclusão de usuários, além de controlar seus perfis de acesso e status de atividade dentro da organização.

---

## 2. Funcionamento do Módulo (Protótipo Atual)

### 2.1. Arquitetura e Fluxo de Dados
O módulo utiliza um modelo de persistência simulada em arquivos JSON:
- **Dados de Usuários**: Persistidos em `data/users.json`.
- **Perfis de Acesso**: Carregados de `data/access-profile.json` para vinculação durante o cadastro.
- **Permissões**: Gerenciadas via `data/accesses.json` e validadas em cada operação via Server Actions.

### 2.2. Fluxo de Criação (Novo Registro)
Ao criar um novo usuário:
1. **Geração de Senha**: O sistema gera automaticamente uma senha aleatória de 8 caracteres.
2. **Vínculo de Cliente**: O usuário é automaticamente vinculado ao `client_id` da sessão ativa.
3. **Notificação**: Um e-mail é disparado via **Nodemailer** (configurado para MailHog em desenvolvimento) contendo as credenciais de acesso.
4. **Persistência**: O registro é salvo com timestamps de criação e atualização.

### 2.3. Gestão de Status
O campo `is_active` define se o usuário tem permissão para realizar o login. Usuários inativos são preservados na base de dados, mas bloqueados pelo middleware de autenticação.

---

## 3. Regras de Negócio e Permissões (RBAC)

### 3.1. Controle de Acesso Granular
O módulo valida quatro permissões específicas para a tela `user_registration`:
- **view**: Permite listar os usuários e abrir o modal de visualização (campos desabilitados).
- **create**: Habilita o botão "Novo Registro" no toolbar da tabela e a Server Action de inserção.
- **update**: Permite editar usuários existentes e salvar alterações.
- **delete**: Habilita o ícone de exclusão e o modal de confirmação destrutiva.

### 3.2. Proteção de Dados
- **Server-side Validation**: Todas as Server Actions validam as permissões do usuário logado antes de processar qualquer escrita.
- **Multi-tenancy**: Usuários só podem visualizar ou gerenciar outros usuários que pertençam ao mesmo `client_id`.

---

## 4. Componentes e UI/UX

### 4.1. DataTable Avançado
A tabela de usuários implementa funcionalidades de alta performance:
- **Reloader**: Botão de recarga com animação de ícone e **Skeleton Loading** (2 segundos) para simular consulta ao banco.
- **Toolbar Customizado**: Slot para botões de ação global (ex: Novo Registro).
- **Tooltips**: Presentes em todas as ações (Editar, Visualizar, Excluir, Colunas e Recarregar).
- **Fixed Width**: A coluna de "Ações" possui tamanho fixo de 100px para evitar deslocamentos de layout.

### 4.2. Modais e Animações
- **Separação de Instâncias**: Modais de Criação e Edição/Visualização possuem instâncias separadas para evitar conflitos de estado e garantir que animações de fechamento ocorram sem "piscar" o conteúdo.
- **DataTableDeleteDialog**: Componente padronizado para ações destrutivas, utilizando `AlertDialog` com ícone de alerta e variante de botão `destructive`.

---

## 5. Requisitos para Integração com API Real

A transição para o backend real deve seguir estas diretrizes:

### 5.1. Segurança e Autenticação
- **Hashing**: Substituir o armazenamento de senhas em texto plano (JSON) por hashing robusto (ex: Argon2 ou BCrypt) na API.
- **Reset de Senha**: Implementar obrigatoriedade de troca de senha no primeiro acesso para usuários criados administrativamente.

### 5.2. Infraestrutura de E-mail
- **Provider**: Migrar do MailHog para um provider de e-mail transacional (ex: Resend, SendGrid ou Amazon SES).
- **Templates**: Utilizar templates de e-mail responsivos e internacionalizados.

### 5.3. Auditoria
- **Logs**: Registrar todas as alterações de perfil de acesso e exclusões para fins de auditoria de segurança.

---

## 6. Checklist de Implementação
- [x] Listagem com DataTable e paginação.
- [x] Filtro de busca por nome.
- [x] CRUD completo (Create, Read, Update, Delete).
- [x] Geração automática de senha.
- [x] Disparo de e-mail transacional (Mock/Nodemailer).
- [x] Proteção RBAC em todas as camadas.
- [x] Skeleton loading no refresh da tabela.
- [x] Tooltips em todas as interações.
