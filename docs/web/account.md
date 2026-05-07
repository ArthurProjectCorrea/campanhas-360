# Documento de Análise: Minha Conta

## 1. Introdução
O módulo de **Minha Conta** permite que o usuário gerencie suas informações pessoais de perfil e visualize seu nível de acesso dentro do sistema. É uma interface essencial para a manutenção da identidade do usuário e segurança da conta.

---

## 2. Funcionamento do Módulo (Protótipo Atual)

### 2.1. Arquitetura
- **Dados do Usuário**: Gerenciados via `updateAccountAction` no arquivo `users.json`.
- **Perfil de Acesso**: Leitura do arquivo `access-profile.json` para exibir o nome amigável do perfil vinculado.
- **Gestão de Sessão**: Ao atualizar os dados (nome ou e-mail), o sistema renova automaticamente o JWT da sessão para que as alterações reflitam imediatamente no cabeçalho e sidebar sem necessidade de re-login.

### 2.2. Fluxo de Atualização
1. O usuário altera Nome ou E-mail.
2. A Action `updateAccountAction` valida os dados e persiste no JSON.
3. A função `createSession` é chamada novamente com os dados atualizados.
4. O `revalidatePath('/')` força a atualização dos componentes de servidor que dependem desses dados.

---

## 3. Regras de Negócio e Validações

### 3.1. Integridade do E-mail
- O e-mail é utilizado como identificador único. Em uma integração real, a alteração de e-mail deve disparar um fluxo de verificação.

### 3.2. Visualização de Perfil
- O usuário pode visualizar seu perfil de acesso (ex: Administrador, Operador), mas não pode alterá-lo. Esta é uma medida de segurança para evitar escalonamento de privilégios.

---

## 4. Requisitos para Integração com API Real

### 4.1. Segurança e Verificação
- **Confirmação de Senha**: Para alterar e-mail ou nome, a API deve exigir a senha atual do usuário como fator de confirmação.
- **Verificação de E-mail**: Implementar envio de link de confirmação para o novo e-mail antes de efetivar a troca na base de dados.

### 4.2. Services e Auditoria
- **Audit Log**: Registrar toda alteração de dados sensíveis de perfil, incluindo IP e timestamp.
- **Identity Service**: Centralizar a lógica de atualização em um serviço dedicado que trate a expiração de tokens antigos após a mudança de credenciais.

---

## 5. Especificações de UI/UX

### 5.1. Feedback de Estado
- Uso de **Skeleton Loaders** ou **Spinners** durante a recuperação e salvamento dos dados.
- Notificações de sucesso via **Sonner**.

### 5.2. Layout Responsivo
- Interface limpa focada em leitura e facilidade de edição, utilizando componentes de `Card` e `FieldGroup`.

---

## 6. Checklist de Segurança (Produção)
- [ ] Implementar verificação de e-mail duplicado na base de dados.
- [ ] Validar complexidade de senha se o módulo for expandido para troca de senha.
- [ ] Garantir que a renovação de sessão invalide o token anterior (Blacklist ou expiração curta).
- [ ] Proteger o endpoint de atualização contra ataques de Cross-Site Request Forgery (CSRF).
