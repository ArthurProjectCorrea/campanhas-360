# Redefinir Senha

## História de Usuário

**Como** usuário que solicitou a recuperação de acesso  
**Quero** definir uma nova senha para minha conta  
**Para** voltar a acessar o sistema com segurança utilizando uma credencial que eu conheça.

---

## Comportamento

### Entrada de Dados
1. Digitar a Nova Senha.
2. Confirmar a Nova Senha.
3. Clicar em "Salvar Nova Senha".

### Processamento
1. Validar se o Token de Recuperação na URL ainda é válido e não expirou.
2. Validar se a senha e a confirmação são idênticas.
3. Verificar se a senha atende aos requisitos mínimos de segurança (comprimento, caracteres).
4. Gerar o novo hash da senha e atualizar na base de dados.
5. Invalidar o token de recuperação utilizado.

### Saída de Dados
* Mensagem de sucesso após a alteração.
* Redirecionamento automático para a tela de login.

---

## Critérios de Aceitação

| ID | Título | Cenário |
| :--- | :--- | :--- |
| **CA01** | Redefinição com Sucesso | Dado que o token é válido e as senhas coincidem, quando salvar, então a senha deve ser atualizada e o usuário redirecionado ao login. |
| **CA02** | Token Expirado | Dado que o usuário demorou mais de 1 hora para acessar o link, quando tentar salvar, então deve exibir erro de "Token inválido ou expirado". |
| **CA03** | Senhas Divergentes | Dado que a confirmação de senha é diferente da nova senha, quando tentar salvar, então deve exibir erro de validação. |

---

## Regras de Negócio

| ID | Título | Regra |
| :--- | :--- | :--- |
| **RN01** | Complexidade de Senha | A nova senha deve ter no mínimo 8 caracteres. |
| **RN02** | Unicidade de Token | Um token de recuperação só pode ser usado uma única vez. |

---

## Detalhamento dos Campos

| Local | Descrição | Tipo | Observação |
| :--- | :--- | :--- | :--- |
| Formulário | Nova Senha | Password | Obrigatório. Mínimo 8 caracteres, número e especial. |
| Formulário | Confirmar Senha | Password | Deve coincidir com a nova senha. |
| Botão | Salvar Nova Senha | Action | Finaliza o processo de redefinição. |
