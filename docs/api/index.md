# API Documentation - Campanhas 360

Esta documentação detalha a arquitetura, os requisitos técnicos e os endpoints da API do projeto Campanhas 360.

## Visão Geral da Arquitetura

A API é construída utilizando **ASP.NET Core Identity** para gerenciamento de usuários e segurança, seguindo princípios de alta performance e escalabilidade.

### Stack Tecnológica

| Componente | Tecnologia | Finalidade |
| :--- | :--- | :--- |
| **Framework** | ASP.NET Core | Motor principal da API e processamento de regras de negócio. |
| **Banco de Dados** | PostgreSQL | Persistência de dados relacionais e estruturados. |
| **Cache / Sessão** | Redis | Gerenciamento de sessões temporárias e dados de acesso rápido. |
| **E-mail (Dev)** | Mailhog | Simulação e captura de e-mails em ambiente de desenvolvimento. |
| **E-mail (Service)** | SMTP / Mailer | Serviço de disparo de notificações e recuperação de senha. |

## Configuração e Implantação

### Docker e Monorepo

Para garantir a consistência entre os ambientes de desenvolvimento e produção, a API e suas dependências de infraestrutura devem ser configuradas utilizando **Docker** dentro do monorepo.

- **Serviços Conteinerizados**:
    - `api`: A aplicação ASP.NET Core.
    - `postgres`: Banco de dados relacional.
    - `redis`: Gerenciamento de cache e sessões.
    - `mailhog`: Servidor SMTP para testes de e-mail.

### Variáveis de Ambiente (ENV)

A conexão da API com os serviços externos deve ser realizada exclusivamente via **variáveis de ambiente**. Nenhuma credencial ou string de conexão deve estar "hardcoded" no código fonte.

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `DB_CONNECTION_STRING` | String de conexão com o PostgreSQL. | `Host=postgres;Database=campanhas;...` |
| `REDIS_CONNECTION_STRING` | Endereço de conexão com o Redis. | `redis:6379` |
| `MAIL_HOST` | Host do servidor SMTP (Mailhog em dev). | `mailhog` |
| `MAIL_PORT` | Porta do servidor SMTP. | `1025` |
| `MAIL_USER` | Usuário do servidor SMTP (opcional). | `null` |
| `MAIL_PASS` | Senha do servidor SMTP (opcional). | `null` |
| `ADMIN_EMAIL` | E-mail inicial para o Seed do usuário admin. | `admin@exemplo.com` |
| `ADMIN_PASSWORD` | Senha inicial para o Seed do usuário admin. | `Senha@12345` |

---

## Requisitos de Infraestrutura

- **Persistência Relacional**: Acesso obrigatório a um banco de dados PostgreSQL.
- **Armazenamento Volátil**: Uso de Redis para tokens e dados de sessão com tempo de expiração.
- **Ambiente de Testes**: 
    - Cada endpoint deve possuir testes unitários e de integração cobrindo cenários de sucesso e erro.
    - Deve existir uma instância de banco de dados PostgreSQL dedicada exclusivamente para testes de carga e validação de input real.