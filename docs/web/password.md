# Documento de Análise: Recuperação de Senha (Web -> API Integration)

Este documento detalha a implementação do fluxo de recuperação de senha no Frontend (Next.js), integrando-se com os endpoints da API C#.

## 1. Fluxo de Trabalho (Narrativa Web)

O processo é orquestrado via **Server Actions** para garantir segurança e performance, evitando a exposição de chaves de API no cliente.

### 1.1. Solicitação (Forgot Password)
O usuário informa seu e-mail na tela de "Esqueceu sua senha?".
- **Componente**: `ForgotPasswordForm`
- **Action**: `forgotPasswordAction(email)`
- **Comportamento**: A Action faz uma chamada `POST` para o endpoint da API `/auth/forgot-password`.
- **Feedback**: Independentemente se o e-mail existe, o usuário recebe uma mensagem de sucesso: *"Se o e-mail estiver cadastrado, você receberá um código em instantes."*.
- **Estado**: O e-mail é salvo em um cookie temporário (`pending-email`) para uso na próxima etapa.

### 1.2. Verificação de Identidade (Verify OTP)
O usuário insere o código de 6 dígitos recebido.
- **Componente**: `VerifyOtpForm` (utilizando `InputOTP` da shadcn/ui).
- **Action**: `verifyOtpAction(otp)`
- **Lógica**: A Action recupera o e-mail do cookie e chama o endpoint `/auth/verify-otp`.
- **Transição**: Em caso de sucesso, o `resetToken` retornado pela API é armazenado em um cookie seguro (`reset-token`) com validade de 10 minutos. O usuário é então redirecionado para a tela de redefinição.

### 1.3. Redefinição de Senha (Reset Password)
O usuário define sua nova senha.
- **Componente**: `ResetPasswordForm`
- **Action**: `resetPasswordAction(newPassword)`
- **Lógica**: A Action recupera o `resetToken` do cookie e envia para o endpoint `/auth/reset-password`.
- **Finalização**: Se a API retornar sucesso, os cookies `pending-email` e `reset-token` são removidos e o usuário é redirecionado para a página de login com uma mensagem de sucesso.

---

## 2. Integração Técnica

### 2.1. Server Actions (lib/action/password-action.ts)

Todas as comunicações com a API devem ser encapsuladas em Server Actions.

```typescript
// Exemplo de chamada para a API
export async function forgotPasswordAction(formData: FormData) {
  const email = formData.get("email");
  const response = await fetch(`${process.env.API_URL}/auth/forgot-password`, {
    method: "POST",
    body: JSON.stringify({ email }),
    headers: { "Content-Type": "application/json" }
  });
  // ... tratamento de resposta e cookies
}
```

### 2.2. Proteção de Rotas (proxy.ts)

As rotas `/auth/verify-otp` e `/auth/reset-password` são protegidas via Middleware:
- `/verify-otp`: Requer o cookie `pending-email`.
- `/reset-password`: Requer o cookie `reset-token`.
- Se os requisitos não forem atendidos, o usuário é redirecionado para `/auth/forgot-password`.

---

## 3. Segurança e UX

- **InputOTP**: Experiência premium com feedback visual imediato para cada dígito.
- **Zod Validation**: Validação rigorosa de e-mail e complexidade de senha no lado do cliente e do servidor (Server Action).
- **Rate Limiting**: Além do limite da API, o Web implementa um "cool-down" no botão de "Reenviar Código" de 60 segundos.
- **Feedback Amigável**: Uso de `sonner` para notificações de sucesso e erro.

---

## 4. Status da Implementação

- [x] Implementação das chamadas `fetch` para a API C# em `lib/action/password-action.ts`.
- [x] Configuração de cookies de fluxo (`pending-email`, `reset-token`).
- [x] Sincronização de loading e transição suave entre etapas.
- [x] Implementação de componentes de formulário (`InputOTP`, `InputPassword`).
- [x] Proteção de rotas no Middleware (`proxy.ts`).
- [x] Validação de integração com Mailhog (disparado pela API).
