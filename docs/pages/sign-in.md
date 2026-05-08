# Login

## História de Usuário

**Como** colaborador ou administrador da campanha  
**Quero** realizar o login na plataforma utilizando minhas credenciais  
**Para** acessar o painel de gestão e executar minhas atividades diárias.

---

## Comportamento

### Entrada de Dados
1. Digitar o E-mail de acesso.
2. Digitar a Senha.
3. Clicar no botão "Entrar".
4. Opcional: Clicar em "Esqueci minha senha" para redirecionamento.

### Processamento
1. Validar se os campos e-mail e senha foram preenchidos.
2. Validar o formato do e-mail (regex).
3. Verificar se o e-mail existe na base de dados do cliente/tenant atual.
4. Comparar o hash da senha fornecida com o armazenado no banco.
5. Verificar se o usuário está com status `is_active: true`.
6. Criar sessão de autenticação segura (JWT/Cookie).

### Saída de Dados
* Redirecionamento para o Dashboard em caso de sucesso.
* Mensagem de erro (Toast) em caso de credenciais inválidas.
* Mensagem de erro em caso de conta inativa.
* Feedback visual de "Entrando..." no botão durante o processamento.

---

## Critérios de Aceitação

| ID | Título | Cenário |
| :--- | :--- | :--- |
| **CA01** | Login com Sucesso | Dado que o usuário informou credenciais válidas e ativas, quando clicar em entrar, então deve ser redirecionado ao dashboard. |
| **CA02** | Credenciais Inválidas | Dado que o usuário informou e-mail ou senha incorretos, quando clicar em entrar, então deve exibir erro de "Credenciais inválidas". |
| **CA03** | Usuário Inativo | Dado que o usuário está inativo no sistema, quando tentar logar, então deve exibir mensagem informando que o acesso está bloqueado. |
| **CA04** | Validação de Campos | Dado que o usuário deixou campos vazios, quando clicar em entrar, então deve destacar os campos obrigatórios. |

---

## Regras de Negócio

| ID | Título | Regra |
| :--- | :--- | :--- |
| **RN01** | Bloqueio de Inativos | Usuários com a flag `is_active` falsa não podem gerar tokens de sessão. |
| **RN02** | Contexto de Tenant | O login deve ser validado apenas dentro do contexto da organização à qual o domínio pertence. |
| **RN03** | Hashing de Senha | As senhas nunca devem ser comparadas em texto plano (deve-se usar Argon2/BCrypt). |
| **RN04** | Persistência de Sessão | A sessão deve expirar após um período de inatividade configurado ou ao fechar o navegador (se não houver "Lembrar-me"). |

---

## Detalhamento dos Campos

| Local | Descrição | Tipo | Observação |
| :--- | :--- | :--- | :--- |
| Login | E-mail | Email | Obrigatório. |
| Login | Senha | Password | Obrigatório (InputPassword). |
| Link | Esqueceu sua senha? | Link | Redireciona para recuperação. |
| Botão | Entrar | Action | Dispara a autenticação. |
