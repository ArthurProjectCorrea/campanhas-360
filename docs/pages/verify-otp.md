# Verificação de Código (OTP)

## História de Usuário

**Como** usuário realizando uma ação sensível ou login com MFA  
**Quero** inserir o código enviado para meu e-mail/telefone  
**Para** confirmar minha identidade e prosseguir com a operação.

---

## Comportamento

### Entrada de Dados
1. Inserir o código de 6 dígitos recebido.
2. Clicar em "Verificar Código".
3. Opcional: Clicar em "Reenviar código" caso não tenha recebido.

### Processamento
1. Validar se o código inserido corresponde ao gerado pelo sistema para aquela sessão/usuário.
2. Verificar se o código ainda está dentro do tempo de validade (TTL).
3. Incrementar contador de tentativas (bloquear após X tentativas incorretas).

### Saída de Dados
* Redirecionamento para o dashboard ou conclusão da ação protegida em caso de sucesso.
* Mensagem de erro em caso de código inválido ou expirado.

---

## Critérios de Aceitação

| ID | Título | Cenário |
| :--- | :--- | :--- |
| **CA01** | Código Válido | Dado que o usuário inseriu o código correto, quando verificar, então deve ser autenticado com sucesso. |
| **CA02** | Código Expirado | Dado que o código passou do tempo de validade, quando verificar, então deve informar que o código expirou. |
| **CA03** | Reenvio de Código | Dado que o usuário solicitou reenvio, quando o tempo de espera (cooldown) passar, então um novo código deve ser gerado e enviado. |

---

## Regras de Negócio

| ID | Título | Regra |
| :--- | :--- | :--- |
| **RN01** | Validade Curta | O código OTP deve expirar em no máximo 10 minutos. |
| **RN02** | Limite de Tentativas | Após 3 tentativas incorretas, o código atual deve ser invalidado. |

---

## Detalhamento dos Campos

| Local | Descrição | Tipo | Observação |
| :--- | :--- | :--- | :--- |
| Campo | E-mail | Email | E-mail de destino (somente leitura). |
| Campo | Código de Verificação | InputOTP | Código de 6 dígitos numéricos. |
| Botão | Verificar Código | Action | Valida o código no servidor. |
| Botão | Reenviar Código | Action | Gera e envia um novo código. |
