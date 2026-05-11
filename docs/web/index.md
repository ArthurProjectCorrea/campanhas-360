# Documentação do Módulo Web - Campanha 360

Bem-vindo à documentação técnica do frontend da plataforma Campanha 360. Esta seção detalha a implementação das interfaces, lógica de cliente e integração com a API.

## Módulos Implementados

### 🔐 Autenticação e Acesso
Gerenciamento de entrada no sistema e segurança.
- [Login e Sessão](sign-in.md)
- [Recuperação de Senha](password.md)
- [Estrutura de Autenticação](authentication.md)

### 👥 Gestão de Equipe
Administração de colaboradores e permissões.
- [Cadastro de Usuários](user-registration.md)
- [Perfis de Acesso (RBAC)](access-profile.md)

### 🏢 Organização e Conta
Configurações da campanha e do usuário.
- [Perfil da Organização](organization-profile.md)
- [Minha Conta / Preferências](account.md)

---

## Padrões de Desenvolvimento

- **Framework**: Next.js 15+ (App Router).
- **Componentes**: shadcn/ui + Tailwind CSS.
- **Estado**: Server Actions + Hooks nativos do React.
- **Validação**: Zod + React Hook Form.
- **Notificações**: Sonner.

## Guia de Estilo

A interface segue um design **Premium e Minimalista**, priorizando a acessibilidade e a responsividade (Mobile-First). Utilizamos micro-animações para feedback de loading e transições suaves entre estados de formulário.
