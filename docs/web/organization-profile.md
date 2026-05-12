# Web: Perfil da Organização

Este documento detalha as responsabilidades, fluxos de dados e modificações necessárias no frontend para integração com a API de Perfil da Organização.

## 1. Responsabilidades do Frontend
O frontend deve gerenciar o estado do candidato e suas campanhas, garantindo que as alterações sejam enviadas de forma consolidada e segura.

### 1.1. Fluxo de Dados e Sincronização
- **Carregamento**: O componente de página (`page.tsx`) utiliza a Server Action `getOrganizationData` para buscar todos os dados necessários em uma única requisição ao backend.
- **Persistência**: Toda mutação é realizada via `organizationProfileAction`, que lida com diferentes intenções (`save`, `create`, `inactivate`).
- **Upload de Imagem**: O upload é **deferido**. O componente `InputUploadInline` apenas armazena o arquivo localmente para preview. O envio real ocorre no clique de "Salvar Alterações".

## 2. Server Actions (`lib/action/organization-profile-action.ts`)

### `getOrganizationData()`
- **Objetivo**: Buscar dados iniciais.
- **Responsabilidades**:
  - Validar sessão e permissão `view`.
  - Chamar `GET /api/organization-profile`.
  - Retornar objeto consolidado: `{ screen, candidate, campaigns, canUpdate, canCreate }`.

### `organizationProfileAction(prevState, formData)`
- **Objetivo**: Orquestrar as mutações na API.
- **Responsabilidades**:
  - Detectar a intenção via `formData.get('intent')`.
  - **Save (`update`)**:
    - Criar um `FormData` contendo os dados do candidato e da campanha ativa.
    - Incluir o arquivo de imagem se houver.
    - Chamar `PUT /api/organization-profile` com `headers: { Authorization: Bearer token }`.
  - **Create (`create`)**:
    - Enviar dados da nova campanha via `POST /api/organization-profile/campaigns`.
  - **Inactivate (`inactivate`)**:
    - Chamar `PUT /api/organization-profile/campaigns/{id}/inactivate`.
  - Revalidar o cache via `revalidatePath`.

## 3. Componentes Relacionados

### `OrganizationProfileForm`
- **Adaptação**: Substituir os dados de exemplo (`STUB_CAMPAIGNS`) pelos dados reais passados via props.
- **Gestão de Imagem**: Manter uma `ref` ou estado para o arquivo selecionado no `InputUploadInline` e injetá-lo no `formData` antes de submeter.
- **Bloqueio**: Reforçar o estado `disabled` em todos os campos da campanha se `isActive` for falso.

### `InputUploadInline`
- **Modificação Crítica**: Remover a chamada imediata de `uploadAvatarAction`.
- **Nova Lógica**:
  - Gerar `URL.createObjectURL(file)` para preview local.
  - Notificar o pai via `onFileChange(file)`.

## 4. Declaração de Types (`apps/web/types/index.ts`)
As interfaces devem refletir o contrato da API. Recomenda-se manter o padrão de `snake_case` já utilizado no projeto para tipos de domínio:

```typescript
export type OrganizationProfileData = {
  screen: Screen;
  candidate: Candidate;
  campaigns: Campaign[];
  permissions: {
    canUpdate: boolean;
    canCreate: boolean;
  };
}
```

## 5. Checklist de Integração
- [ ] Validar se o token JWT está sendo passado corretamente no Header.
- [ ] Garantir que o `MultipartFormData` no Node.js (Server Actions) está sendo montado corretamente para envio ao C#.
- [ ] Tratar erros de rede e exibir mensagens via **Sonner**.
- [ ] Testar a revalidação de cache para garantir que os dados atualizados apareçam no Sidebar após o salvamento.
