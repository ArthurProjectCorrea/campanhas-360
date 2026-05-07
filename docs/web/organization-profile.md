# Documento de Análise: Perfil da Organização

## 1. Introdução
Este documento detalha o funcionamento do módulo de **Perfil da Organização**, responsável por gerenciar as informações institucionais e a identidade visual da campanha. O módulo integra dados de clientes e candidatos, garantindo a consistência da marca em toda a plataforma.

---

## 2. Funcionamento do Módulo (Protótipo Atual)

### 2.1. Arquitetura e Fluxo de Dados
O módulo utiliza um modelo híbrido de persistência simulada:
- **Dados Institucionais**: Gerenciados via `updateOrganizationAction` no arquivo `clients.json`.
- **Identidade Visual**: Gerenciada via `uploadAvatarAction` no arquivo `candidates.json`.
- **Sincronização**: O sistema vincula o `candidate_id` do cliente aos dados do candidato para exibir o avatar correto.

### 2.2. Gestão de Identidade Visual (Upload Imediato)
Diferente de formulários tradicionais, o upload da foto do candidato é **imediato**:
1. O usuário seleciona o arquivo.
2. O componente `InputUpload` dispara a Action `uploadAvatarAction`.
3. O arquivo é salvo fisicamente em `public/storage` e o caminho é atualizado em `candidates.json`.
4. O feedback é instantâneo via **Sonner**, sem necessidade de clicar em "Salvar" no formulário principal.

### 2.3. Controle de Alterações (Discard Logic)
Para os campos de texto e seletores, o sistema implementa uma lógica de descarte:
- O formulário utiliza `refs` para acessar o elemento DOM e executar o método `reset()`.
- Isso garante que qualquer alteração não salva seja eliminada, retornando os campos aos valores originais carregados do servidor (`defaultValue`).

---

## 3. Regras de Negócio e Permissões

### 3.1. Validação de Acesso (RBAC)
O módulo implementa dois níveis de permissão específicos para a tela `organization_profile`:
- **view**: Permite visualizar os dados. Se ausente, o usuário recebe um erro `403 Forbidden`.
- **update**: Permite modificar dados e realizar uploads. Se ausente:
    - Todos os `Inputs` e `Selects` ficam em estado `disabled`.
    - Os botões "Salvar Alterações" e "Descartar" ficam **ocultos**.
    - O componente de Upload oculta interações de alteração ou remoção.
    - As Server Actions validam a permissão novamente antes de qualquer escrita em arquivo.

### 3.2. Campos Obrigatórios
- Domínio, Número do Candidato, Ano Eleitoral, Cargo, Partido e Unidade Eleitoral são obrigatórios para a persistência dos dados.

---

## 4. Requisitos para Integração com API Real

A transição para o backend real deve seguir estas diretrizes:

### 4.1. Processamento de Imagens
- **Storage**: Substituir o salvamento local por um serviço de Storage (ex: AWS S3, Azure Blob Storage).
- **Otimização**: A API deve processar a imagem (resize/compress) antes de armazenar para garantir performance no carregamento do dashboard.
- **CDN**: Utilizar uma CDN para entrega dos assets de identidade visual.

### 4.2. Services e Repositories
- **Transaction**: O update dos dados da organização deve ser transacional.
- **Cache**: Implementar invalidação de cache (Redis) quando houver alteração de domínio ou identidade visual, pois esses dados impactam o roteamento e a marca.

---

## 5. Especificações de UI/UX

### 5.1. Componentes Customizados
- **InputUpload**: Componente interativo com preview em tempo real, suporte a remoção e estados de loading integrados.
- **FieldGroup**: Organização visual em grid responsiva para melhor usabilidade em dispositivos móveis.

### 5.2. Feedback Visual
- Uso de **Spinners** em todos os estados de transição (uploading, saving, discarding).
- Toast messages contextualizadas para sucesso e erro.

---

## 6. Checklist de Segurança (Produção)
- [ ] Validar o tipo MIME e o tamanho do arquivo de imagem no servidor.
- [ ] Implementar verificação de integridade para garantir que um usuário só possa alterar a organização à qual está vinculado.
- [ ] Sanitizar inputs de texto para evitar ataques de XSS.
- [ ] Garantir que o upload de arquivos não permita a execução de scripts no servidor (Remote Code Execution).
