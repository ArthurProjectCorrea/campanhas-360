# Documento de Análise: Sistema de Autenticação e Acesso

## 1. Introdução
Este documento descreve as especificações técnicas, regras de negócio e requisitos de segurança do sistema de autenticação do projeto **Campanhas 360**. Atualmente, o sistema opera como um protótipo funcional de alta fidelidade, preparado para ser integrado a uma API real sem perda de qualidade ou lógica.

---

## 2. Fluxo de Autenticação (Protótipo Atual)

### 2.1. Arquitetura
O sistema utiliza **Next.js Server Actions** para o processamento de login, garantindo que a lógica sensível permaneça no servidor.
- **Action Principal**: `signInAction`
- **Armazenamento de Dados**: Arquivos JSON (`users.json` e `clients.json`) simulando as tabelas do banco de dados.
- **Sessão**: Implementada via JWT (JSON Web Token) utilizando a biblioteca `jose`, armazenada em cookies seguros.

### 2.2. Multi-tenancy (Domínios Dinâmicos)
O sistema suporta múltiplos clientes (tenants). Cada usuário está vinculado a um `client_id`, que por sua vez possui um `domain` único.
- O redirecionamento pós-login é dinâmico: `/[domain]/dashboard`.
- O isolamento é garantido via middleware (`proxy.ts`), que impede o acesso cruzado entre domínios.

---

## 3. Regras de Negócio e Validações

### 3.1. Verificação de Credenciais
O sistema valida a combinação de E-mail e Senha. Em caso de falha, uma mensagem genérica é exibida para evitar a enumeração de usuários.

### 3.2. Controle de Status (Ativo/Inativo e Soft Delete)
- **Soft Delete**: Se o campo `deleted_at` possuir uma data (não nulo) no **Usuário** ou no **Cliente**, o acesso é negado.
- **Usuário Ativo**: Se `is_active` for `false`, o acesso é negado.
- **Cliente Ativo (Empresa)**: Se a empresa (`client.is_active`) estiver desativada, todos os usuários vinculados a ela perdem o acesso imediatamente.
- **Mensagem de Erro Unificada**: Para todos os casos acima (inativação ou exclusão lógica), o sistema retorna: *"Acesso negado. Entre em contato com o suporte."* Isso diferencia erros de conta (status) de erros de credenciais (e-mail/senha).

### 3.3. Proteção de Rotas (Proxy/Middleware)
O arquivo `proxy.ts` atua como um gatekeeper:
1. **Autenticação**: Redireciona para `/sign-in` se não houver sessão ativa.
2. **Integridade da URL**: Garante que o domínio na URL corresponda ao domínio da sessão do usuário. Se o usuário tentar alterar manualmente a URL para o domínio de outro cliente, ele é redirecionado de volta para o seu domínio legítimo.

---

## 4. Requisitos para Integração com API Real

Para a transição do protótipo para o produto final, a API deverá assumir as seguintes responsabilidades:

### 4.1. Persistência e Segurança de Dados
- **Hashing de Senhas**: As senhas nunca devem ser salvas em texto limpo. Deve-se utilizar algoritmos como **Argon2** ou **bcrypt**.
- **Base de Dados Relacional**: Migrar a lógica dos arquivos JSON para um banco de dados (ex: PostgreSQL), mantendo os relacionamentos de `User -> Client`.

### 4.2. Gestão de Tokens
- **Refresh Tokens**: Implementar rotação de tokens para manter o usuário logado com segurança sem expirar a sessão abruptamente durante o uso.
- **Revogação**: Capacidade de invalidar sessões remotamente (ex: em caso de roubo de dispositivo).

### 4.3. Monitoramento e Auditoria
- **Logs de Acesso**: Registrar tentativas de login, IPs e dispositivos.
- **Rate Limiting**: Implementar proteção contra ataques de força bruta no endpoint de sign-in.

---

## 5. Especificações de UI/UX

### 5.1. Componentes Customizados
- **InputPassword**: Componente premium com toggle de visibilidade e desativação de funções nativas de "revelar senha" do navegador para manter consistência visual.
- **Feedback**: Uso de **Sonner** para notificações instantâneas e discretas.
- **Acessibilidade**: Uso de classes `sr-only` para labels e suporte total a navegação via teclado.

### 5.2. Design System
- Suporte nativo a **Dark/Light Mode** via `next-themes`.
- Uso de tokens de cores do `global.css` (primary, secondary, destructive) para garantir que qualquer alteração de marca reflita em todo o sistema de login.

---

## 6. Checklist de Segurança (Produção)
- [ ] Implementar CSRF Protection.
- [ ] Configurar cabeçalhos de segurança (HSTS, CSP, X-Frame-Options).
- [ ] Validar inputs no servidor (Zod/Yup) para evitar injeções.
- [ ] Garantir que o `SESSION_SECRET` seja uma chave forte de 32+ caracteres em ambiente de produção.
