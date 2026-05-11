# Documentação: App Sidebar e Navegação

Este documento detalha o funcionamento da barra lateral (Sidebar) do sistema, focando na renderização dinâmica baseada em permissões e na integração com os dados do usuário autenticado.

## 1. Arquitetura da Sidebar

A Sidebar é um componente de servidor (`AppSidebar`) que orquestra diversos subcomponentes para fornecer uma navegação contextualizada e segura.

### Subcomponentes Principais:
- **`NavMain`**: Menu principal de navegação, filtrado por permissões.
- **`NavUser`**: Exibe os dados do usuário logado e opções de conta.

---

## 2. Renderização Baseada em Permissões (RBAC)

Para garantir que o usuário veja apenas os módulos aos quais tem acesso, a Sidebar implementa uma filtragem ativa baseada na matriz de permissões da sessão.

### Lógica de Filtragem no `NavMain`
Cada item de menu está associado a uma `screen` (tela). O componente deve verificar a lista de permissões na sessão antes de renderizar cada item:

- **Critério**: O item só é exibido se houver uma entrada na matriz de permissões para aquela tela com a chave `view`.
- **Implementação**: Utiliza o helper `hasPermission(screen, 'view')`.

---

## 3. Integração de Dados do Usuário (`NavUser`)

A seção de conta do usuário (`NavUser`) é alimentada pelos dados retornados pelo endpoint `/auth/me` da API, que são persistidos na sessão do Redis e refletidos no cookie decifrado pelo Next.js.

### Dados Exibidos:
- **Nome e Email**: Recuperados diretamente da `SessionPayload`.
- **Avatar**: URL da imagem do usuário (armazenada na API).
- **Gerenciamento**: Links diretos para as configurações de conta e perfil.

---

## 4. Fluxo de Dados e Contexto

A Sidebar utiliza o contexto de multi-inquilino (multi-tenant) para gerar as URLs dinamicamente.

```mermaid
flowchart TD
    A[Início: Renderizar Sidebar] --> B[Recuperar Sessão via getSession]
    B --> C[Extrair Matrix de Permissões]
    B --> D[Extrair UserData e Domain]
    C --> E[Filtrar Itens do NavMain por view:true]
    D --> F[Popular NavUser e Gerar Links com /[domain]/]
    E --> G[Exibir Menu Customizado]
    F --> H[Exibir Dados do Usuário]
```

---

## 5. Requisitos de Implementação

1. **Eficiência**: A filtragem de itens deve ocorrer no lado do servidor para evitar o "flicker" de menu (itens aparecendo e sumindo).
2. **Sincronia**: Se o usuário tiver suas permissões alteradas e a sessão for renovada (via `refresh`), a Sidebar deve refletir as mudanças na próxima navegação.
3. **Fallback**: Caso a sessão esteja indisponível ou ocorra um erro na validação ativa, a Sidebar deve ocultar todos os itens protegidos por padrão.

---

## 6. Checklist de Funcionalidades

- [x] Estrutura base da Sidebar com Shadcn/ui.
- [ ] Implementação do filtro de permissões `view` no `NavMain`.
- [ ] Conexão do `NavUser` com os dados reais da sessão.
- [ ] Tradução das labels e ícones baseada no `screens.json` da API.
- [ ] Links dinâmicos utilizando o `domain` da sessão.
