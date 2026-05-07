# Documento de Análise: Recuperação de Senha (End-to-End)

## 1. Introdução
O módulo de **Recuperação de Senha** do Campanhas 360 foi projetado para ser seguro, resiliente a ataques de enumeração e amigável ao usuário. O fluxo consiste em três etapas principais: Solicitação, Verificação e Redefinição.

---

## 2. Fluxo de Trabalho (Narrativa)

### 2.1. Etapa 1: Solicitação (Forgot Password)
O usuário informa seu e-mail na tela de "Esqueceu sua senha?".
- **Comportamento**: O sistema valida se o e-mail foi preenchido e busca o usuário na base.
- **Segurança**: Se o e-mail não existir, o sistema simula um delay de processamento e retorna uma mensagem de sucesso genérica: *"Código enviado com sucesso!"*. Isso impede que invasores descubram quais e-mails estão cadastrados na plataforma.
- **Persistência**: Um cookie seguro (`pending-email`) é criado para manter o contexto do e-mail nas próximas etapas sem expô-lo na URL.

### 2.2. Etapa 2: Verificação de Identidade (Verify OTP)
O usuário recebe um código de 6 dígitos em seu e-mail (simulado via MailHog em desenvolvimento).
- **Interface**: Utiliza o componente `InputOTP` para uma experiência de entrada premium. O e-mail do usuário é exibido de forma desabilitada para conferência.
- **Validação**: O sistema verifica o código contra o arquivo `data/otps.json`.
- **Segurança**: Mensagens de erro são genéricas (*"Código inválido ou expirado."*) para não revelar se o erro foi por expiração ou dígito incorreto.
- **Transição**: Se bem-sucedido, o sistema gera um **JWT assinado** (`reset-token`) com validade de 15 minutos, permitindo o acesso à etapa final.

### 2.3. Etapa 3: Redefinição de Senha (Reset Password)
O usuário define sua nova credencial de acesso.
- **Requisitos de Senha**: A senha deve conter no mínimo 8 caracteres, incluindo pelo menos um número e um caractere especial.
- **Proteção de Rota**: Esta página é protegida via Middleware (`proxy.ts`). Tentativas de acesso direto sem o `reset-token` válido redirecionam o usuário de volta para o início do fluxo.
- **Finalização**: Após a atualização bem-sucedida em `data/users.json`, todos os tokens temporários e cookies de contexto são destruídos, e o usuário é redirecionado para o Login.

---

## 3. Detalhes Técnicos (Protótipo)

### 3.1. Persistência de Dados
- **OTPs**: Armazenados em `data/otps.json` com `email`, `code` e `expiresAt` (5 min).
- **Usuários**: Atualizados em `data/users.json` (campo `password` e `updated_at`).

### 3.2. Infraestrutura de E-mail
- **MailHog**: Utilizado como servidor SMTP local (`localhost:1025`) para captura de e-mails em ambiente de desenvolvimento.
- **Nodemailer**: Biblioteca utilizada para o disparo das mensagens com suporte a HTML e templates inline.

### 3.3. Segurança de Tokens
- **jose**: Biblioteca utilizada para geração e verificação de JWTs no lado do servidor (Edge Runtime compatível).
- **Secrets**: Utiliza `SESSION_SECRET` para assinatura dos tokens de redefinição.

---

## 4. Requisitos para API Real

### 4.1. Migração de Provedor
- Substituir o MailHog por um provedor transacional (Resend, SendGrid ou Amazon SES).
- Configurar registros de DNS (SPF, DKIM, DMARC) para garantir a entregabilidade.

### 4.2. Limitação de Abuso (Rate Limiting)
- **Implementar**: Limites de 3 solicitações de código por hora por IP/E-mail.
- **Implementar**: Limite de 5 tentativas de validação de OTP antes do bloqueio temporário do fluxo para aquele e-mail.

### 4.3. Auditoria
- Registrar logs de eventos: `PASSWORD_RESET_REQUESTED`, `OTP_VERIFIED_SUCCESS`, `PASSWORD_UPDATED`.

---

## 5. Checklist de Produção
- [x] Proteção contra enumeração de usuários (mensagens genéricas).
- [x] Validação de força de senha no servidor.
- [x] Proteção de rotas sensíveis via Middleware.
- [ ] Implementar Rate Limiting.
- [ ] Mudar para banco de dados relacional (Prisma/PostgreSQL).
- [ ] Integrar com provedor de e-mail real.
