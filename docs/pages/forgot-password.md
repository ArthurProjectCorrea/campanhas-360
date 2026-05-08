# Esqueci Minha Senha

## História de Usuário

**Como** usuário da plataforma  
**Quero** solicitar a recuperação da minha senha  
**Para** recuperar o acesso à minha conta caso eu tenha esquecido as credenciais.

---

## Comportamento

### Entrada de Dados
1. Digitar o E-mail cadastrado.
2. Clicar no botão "Enviar link de recuperação".

### Processamento
1. Validar se o e-mail informado existe na base de dados.
2. Gerar um token de recuperação único com tempo de expiração curto.
3. Disparar um e-mail transacional contendo o link seguro para a tela de redefinição de senha (`/reset-password`).
4. Caso o e-mail não exista, o sistema deve fornecer uma resposta genérica por segurança (evitando enumeração de usuários).

### Saída de Dados
* Mensagem de confirmação informando que, se o e-mail existir, as instruções foram enviadas.
* Redirecionamento ou estado de sucesso na tela.

---

## Critérios de Aceitação

| ID | Título | Cenário |
| :--- | :--- | :--- |
| **CA01** | Solicitação com E-mail Válido | Dado que o usuário informou um e-mail existente, quando clicar em enviar, então deve receber um e-mail com o link de recuperação. |
| **CA02** | Solicitação com E-mail Inexistente | Dado que o e-mail não está cadastrado, quando clicar em enviar, então o sistema deve exibir a mesma mensagem de sucesso (por segurança) mas não enviar e-mail. |
| **CA03** | Validação de Formato | Dado que o e-mail é inválido, quando tentar enviar, então deve exibir erro de validação. |

---

## Regras de Negócio

| ID | Título | Regra |
| :--- | :--- | :--- |
| **RN01** | Expiração de Token | O link de recuperação deve ser válido por apenas 1 hora após a solicitação. |
| **RN02** | Uso Único | O token de recuperação deve ser invalidado imediatamente após a primeira alteração de senha bem-sucedida. |
| **RN03** | Proteção contra Spam | Deve haver um limite de tempo (throttling) entre solicitações sucessivas para o mesmo e-mail. |

---

## Detalhamento dos Campos

| Local | Descrição | Tipo | Observação |
| :--- | :--- | :--- | :--- |
| Recuperação | E-mail | Email | Obrigatório. |
| Botão | Enviar Código | Action | Dispara o envio do código OTP por e-mail. |
| Link | Voltar para o login | Link | Retorna à tela de acesso. |
