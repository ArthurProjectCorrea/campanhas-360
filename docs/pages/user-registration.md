# Cadastro de Usuários (Equipe)

## História de Usuário

**Como** administrador da campanha  
**Quero** gerenciar os membros da minha equipe e seus níveis de acesso  
**Para** garantir que cada colaborador tenha as permissões necessárias para trabalhar com segurança.

---

## Comportamento

### Entrada de Dados
1. Clicar em "Novo Registro" para abrir o modal de criação.
2. Inserir Nome, E-mail, CPF/CNPJ e Telefone do colaborador.
3. Selecionar o Perfil de Acesso (Perfil de Permissões).
4. Alternar o status Ativo/Inativo.
5. Clicar em "Salvar".

### Processamento
1. **Validação de E-mail**: Impedir duplicidade de e-mails dentro da mesma organização.
2. **Geração de Senha**: Gerar automaticamente uma senha segura de 8 caracteres para novos usuários.
3. **RBAC**: Validar permissões `create`, `update`, `delete` ou `view` antes de cada operação.
4. **Notificação**: Disparar e-mail transacional contendo as credenciais de acesso ao salvar um novo registro.
5. **Filtro e Busca**: Processar buscas em tempo real na tabela por nome ou e-mail.

### Saída de Dados
* Tabela (DataTable) listando todos os membros da equipe.
* Tooltips explicativos em cada ícone de ação (Editar, Excluir, Ver).
* Modais específicos para cada ação (Criação, Edição, Confirmação de Exclusão).
* Skeleton loading ao recarregar a tabela.

---

## Critérios de Aceitação

| ID | Título | Cenário |
| :--- | :--- | :--- |
| **CA01** | Criação com Envio de E-mail | Dado que um novo usuário foi cadastrado, quando salvo com sucesso, então o sistema deve gerar uma senha e enviar um e-mail com as credenciais. |
| **CA02** | Bloqueio de Ações por RBAC | Dado que o usuário logado tem apenas permissão de `view`, quando acessar a tela, então o botão "Novo Registro" e os ícones de editar/excluir devem estar ocultos ou desabilitados. |
| **CA03** | Exclusão Segura | Dado que o usuário clicou em excluir, quando confirmar no modal, então o registro deve ser removido e a tabela atualizada. |
| **CA04** | Persistência de Filtros | Dado que o usuário aplicou um filtro de busca, quando recarregar a página, então o estado da busca deve ser mantido (opcional) ou refletido na lista. |

---

## Regras de Negócio

| ID | Título | Regra |
| :--- | :--- | :--- |
| **RN01** | Isolamento de Dados | Um administrador só pode visualizar e gerenciar usuários pertencentes ao seu próprio `client_id` (multi-tenancy). |
| **RN02** | Senha Automática | O sistema é responsável por criar a primeira senha; o usuário não define a senha no momento do cadastro. |
| **RN03** | Status Inativo | Usuários inativos perdem acesso imediato ao sistema, mas seus dados históricos e registros de ações são preservados. |
| **RN04** | Perfil Obrigatório | Todo usuário deve obrigatoriamente estar vinculado a um perfil de acesso válido. |

---

## Detalhamento dos Campos

| Local | Descrição | Tipo | Observação |
| :--- | :--- | :--- | :--- |
| Tabela | Nome | String | Exibido na primeira coluna. |
| Tabela | Email | Email | Identificador de acesso. |
| Tabela | Perfil de Acesso | String | Nome do perfil vinculado. |
| Tabela | Status | Badge | Indica se está "Ativo" ou "Inativo". |
| Tabela | Criado em | Date | Data e hora de criação do registro. |
| Modal | Nome | String | Obrigatório. |
| Modal | Email | Email | Obrigatório. |
| Modal | Perfil de Acesso | Select | Seleção entre os perfis disponíveis. |
| Modal | Usuário Ativo | Switch | Toggle para ativar/desativar acesso. |
| Ações | Visualizar / Editar / Deletar | Icons | Gatilhos para modais de gestão. |
