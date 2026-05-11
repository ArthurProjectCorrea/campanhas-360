# Integração do Perfil de Acesso (Web -> API)

Este documento detalha a migração do módulo de **Perfil de Acesso** de uma arquitetura baseada em arquivos JSON locais para uma integração completa com a **API (ASP.NET Core)**, mantendo a segurança via RBAC e o isolamento Multi-tenant.

## 1. Transição da Arquitetura

O sistema abandona a leitura direta de `accesses.json`, `screens.json` e `permissions.json` para delegar a persistência e a lógica de negócio à API. O Web agora atua como um consumidor e orquestrador da interface.

### Fluxo de Dados Consolidado
Ao salvar um perfil, o Web envia um único JSON estruturado. A API é responsável por desmembrar esses dados entre as tabelas de perfis e a matriz de acessos (tabela de junção).

---

## 2. Controle de Acesso no Web (RBAC)

A segurança no front-end é baseada na lista de permissões retornada pela API durante o login e armazenada de forma segura na sessão.

### 2.1. O Facilitador `hasPermission`
Para padronizar as verificações em toda a aplicação, deve ser utilizado um utilitário centralizado que verifica se o usuário possui a permissão necessária para uma tela específica.

**Exemplo de Uso:**
```typescript
// Verifica se pode visualizar a tela de perfis
if (!hasPermission('access_profile', 'view')) {
  return redirect('/forbidden');
}

// Condicional na UI para botões de ação
{hasPermission('access_profile', 'create') && <Button>Novo Perfil</Button>}
```

### 2.2. Níveis de Proteção
- **view**: Validada no `layout.tsx` ou `page.tsx`. Se o usuário não possuir esta permissão para a rota atual, o sistema deve impedir a renderização e exibir uma tela de erro/acesso negado.
- **create, update, delete**: Validado diretamente nos componentes de UI (DataTables e Forms) para ocultar ou desabilitar botões e funcionalidades, garantindo que o usuário veja apenas o que pode operar.

---

## 3. Gestão da Matriz de Permissões

Apesar da migração para API, o Web mantém a lógica de inteligência da interface para facilitar a configuração pelo administrador:

1. **Mapeamento Restritivo**: O componente de formulário continua respeitando quais ações são válidas para cada tela (ex: a tela de Dashboard não possui permissão de `delete`).
2. **Permissões Globais**: Telas consideradas obrigatórias ou básicas (ex: `dashboard:view`) são injetadas automaticamente pela API ou tratadas como implícitas no Web, simplificando a matriz visual para o usuário.
3. **Isolamento de ClientId**: O Web **não informa** o `ClientId` nas requisições de criação ou atualização. A API identifica o inquilino automaticamente através do token de autenticação.

---

## 4. Integração com Server Actions

As operações de escrita são encapsuladas em Server Actions para garantir que o `apiToken` seja enviado de forma segura no Header de autorização.

### Create/Update Profile
- **Action**: `upsertAccessProfile(data)`
- **Payload**: O objeto consolidado contendo nome, status e o array de mapeamento `{ screenId, permissionId }`.
- **API Response**: Em caso de sucesso, o Web deve invalidar as tags de cache pertinentes para atualizar as listagens.

---

## 5. Mapeamento de Status e Feedback

A tradução de retornos da API para o usuário segue o padrão do sistema:

| Status API | Reação no Web | Mensagem ao Usuário |
| :--- | :--- | :--- |
| `201/200` | Sucesso | "Perfil salvo com sucesso!" |
| `403` | Bloqueio RBAC | "Você não tem permissão para esta ação." |
| `404` | Cross-tenant | "Perfil não encontrado." |
| `400` | Validação | Exibe erros específicos do formulário (Zod). |

---

## 6. Checklist de Migração

- [ ] Implementar utilitário `hasPermission` no `lib/session.ts` ou hook `usePermission`.
- [ ] Atualizar `AccessProfileForm` para enviar o payload consolidado para a API.
- [ ] Adicionar verificações de `view` nas rotas protegidas.
- [ ] Ocultar botões de Ação no DataTable baseando-se em `create`, `update` e `delete`.
- [ ] Remover dependências de leitura de arquivos JSON locais no módulo de Perfis.
- [ ] Testar fluxo de logout automático se as permissões forem revogadas durante a sessão (via Middleware).
