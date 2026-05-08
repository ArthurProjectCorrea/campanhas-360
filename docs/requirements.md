## Requisitos Funcionais

| ID | Título | Descrição |
| :--- | :--- | :--- |
| **RF-01** | Autenticação Multi-tenant | O sistema deve validar o login do usuário considerando o contexto do domínio/tenant atual. |
| **RF-02** | Gestão de Identidade Visual | O sistema deve permitir o upload imediato de fotos do candidato com preview em tempo real. |
| **RF-03** | CRUD de Usuários | O sistema deve permitir criar, listar, editar e excluir colaboradores vinculados à campanha. |
| **RF-04** | Geração Automática de Senha | Ao criar um novo usuário, o sistema deve gerar uma senha temporária e enviá-la por e-mail. |
| **RF-05** | Validação RBAC (UI) | A interface deve ocultar ou desabilitar botões de ação caso o usuário não possua permissão (create, update, delete). |
| **RF-06** | Reset de Formulário | O sistema deve permitir descartar alterações não salvas, retornando aos valores originais do servidor. |
| **RF-07** | Listagem com DataTable | A listagem de usuários deve suportar filtros, paginação e estados de carregamento (Skeleton). |
| **RF-08** | Auditoria de Ações | O sistema deve validar permissões em nível de Server Action antes de processar qualquer alteração de dados. |

---

## Requisitos Não Funcionais

| ID | Título | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Segurança (RBAC) | Todas as operações de escrita devem ser protegidas por verificação de permissão no servidor. |
| **RNF-02** | Usabilidade (Feedback) | O sistema deve exibir estados de loading (Spinners/Skeletons) e toasts de sucesso/erro em todas as operações. |
| **RNF-03** | Performance de Upload | O upload de imagens deve ser assíncrono e não bloquear a navegação do usuário. |
| **RNF-04** | Responsividade | A interface deve ser 100% funcional em dispositivos móveis (Mobile-first logic). |
| **RNF-05** | Manutenibilidade | O código deve seguir a estrutura de pastas do Next.js (App Router) e utilizar componentes Shadcn/UI padronizados. |
| **RNF-06** | LGPD | Dados sensíveis de usuários e candidatos devem ser armazenados e transmitidos de forma segura. |

---

## Regras de Negócio

*   Um usuário só pode visualizar dados da organização à qual está vinculado (`client_id`).
*   Campos obrigatórios da organização (Nome, Número, Cargo) impedem a gravação se estiverem vazios.
*   Usuários inativos (`is_active: false`) são impedidos de realizar login pelo Middleware.
*   O upload de foto é persistido imediatamente, mesmo que o formulário de texto não seja salvo.
*   Apenas usuários com permissão `admin` ou `user_registration.create` podem adicionar novos membros.

---

## Aprovações para Andamento do Projeto

| Nome | Cargo | Assinatura |
| :--- | :--- | :--- |
| | Gerente de Projetos | |
| | Arquiteto de Software | |
| | Analista de QA | |
| | Responsável pela Campanha | |

---

**Cuiabá, sexta-feira, 08 de maio de 2026.**
