---
trigger: always_on
glob: apps/web/**/*
description: Diretrizes de estrutura, padronização e responsabilidades do Frontend Next.js
---

# Estrutura e Regras do Web (Next.js)

O projeto Web utiliza **Next.js 15+** com **App Router**, priorizando Server Components e Server Actions para comunicação com a API.

## Estrutura de Arquivos e Responsabilidades

-   **app/**: Define as rotas da aplicação.
    -   `layout.tsx`: Estrutura compartilhada (Sidebar, Navbar).
    -   `page.tsx`: Componente principal da rota. Responsável por buscar dados iniciais e orquestrar os componentes de visualização.
-   **components/ui/**: Componentes base (shadcn/ui). **NUNCA** altere estes arquivos sem permissão explícita.
-   **components/custom/**: Componentes de UI reutilizáveis e complexos, como `data-table.tsx` genéricos.
-   **components/forms/**: Componentes de formulário específicos. Devem conter a lógica de validação (Zod) e chamadas para Server Actions.
-   **components/tables/**: Implementações específicas de tabelas de dados para cada módulo.
-   **lib/action/**: Server Actions. São responsáveis por encapsular a lógica de comunicação com a API, manipulação de cookies/sessão e revalidação de cache (`revalidatePath`).
-   **lib/session.ts**: Utilitários para gestão de sessão e tokens no lado do servidor.
-   **types/**: Definições de interfaces TypeScript para garantir tipagem em toda a aplicação.

## Padronização e Boas Práticas

1.  **Componentes**:
    -   Prefira **Server Components** por padrão. Use `"use client"` apenas quando houver necessidade de interatividade ou hooks de cliente.
    -   Mantenha os componentes pequenos e focados em uma única responsabilidade.
2.  **Comunicação com API**:
    -   Toda mutação de dados deve passar por uma **Server Action** em `lib/action/`.
    -   Trate erros de forma amigável no formulário, exibindo mensagens claras ao usuário.
3.  **Estilização**:
    -   Use **Tailwind CSS** para estilização.
    -   Mantenha a consistência visual seguindo o sistema de design estabelecido.
4.  **Responsividade**:
    -   Todo componente deve ser pensado para ser responsivo (Mobile-First).

## Regra Crítica

-   **CRITICAL**: Você não tem permissão para alterar componentes em `components/ui/*` sem autorização. Se precisar de uma variação, crie um novo componente em `components/custom/` ou peça permissão.
