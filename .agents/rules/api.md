---
trigger: always_on
glob: apps/api/**/*
description: Diretrizes para desenvolvimento e manutenção da API C#
---

# Estrutura e Regras da API (C# / .NET)

A API do Campanhas 360 é construída com **ASP.NET Core**, utilizando **Entity Framework Core** para persistência e **Redis** para gerenciamento de estados temporários.

## Estrutura de Pastas e Responsabilidades

- **Controllers/**: Contém os endpoints da API. Devem ser leves, delegando lógica complexa quando necessário.
- **DTOs/**: Objetos de transferência de dados. Use para validar inputs e formatar outputs, evitando expor entidades do banco diretamente.
- **Models/**: Entidades de domínio que representam as tabelas do PostgreSQL.
- **Data/**: Contexto do banco de dados (`ApplicationDbContext`), configurações de Fluent API e lógica de `DatabaseSeeder`.
- **Migrations/**: Histórico de alterações do esquema do banco de dados.

## Fluxo de Trabalho Obrigatório

Sempre que realizar modificações na API, você **DEVE** seguir esta sequência:

1.  **Validar Build**: Execute `dotnet build` na pasta `apps/api` para garantir que não há erros de compilação.
2.  **Integridade Docker**: Após o build local, suba o serviço no Docker (`docker compose up -d api`) para garantir que a imagem está construindo corretamente e que o container inicia sem erros.
3.  **Testes Automatizados**: Sempre que criar ou modificar um endpoint, é **obrigatório** criar (ou atualizar) testes na pasta `apps/api-tests`.
    -   **Teste de Sucesso**: Valide o fluxo feliz e o status code `200 OK` ou `201 Created`.
    -   **Teste de Erro**: Valide cenários de falha (ex: `401 Unauthorized`, `400 Bad Request`, `404 Not Found`).

## Padrões de Código

-   Use **PascalCase** para nomes de classes e métodos.
-   Use **camelCase** para propriedades JSON (configurado globalmente no `Program.cs`).
-   Mantenha a documentação XML atualizada para que o Swagger reflita as mudanças corretamente.
