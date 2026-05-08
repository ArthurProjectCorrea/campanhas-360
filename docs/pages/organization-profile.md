# Perfil da Organização

## História de Usuário

**Como** administrador da campanha  
**Quero** gerenciar as informações institucionais e a foto do candidato  
**Para** manter a identidade visual da campanha atualizada em todos os canais do sistema.

---

## Comportamento

### Entrada de Dados
1. Digitar Nome do Candidato, Número, Partido e Cargo.
2. Selecionar Unidade Eleitoral e Ano.
3. Selecionar arquivo de imagem para o Avatar/Foto.
4. Clicar em "Salvar Alterações" ou "Descartar".

### Processamento
1. **Upload de Foto**: O processamento da imagem é imediato ao selecionar o arquivo. A imagem é salva no storage e o link é atualizado no cadastro do candidato.
2. **Validação de RBAC**: Verificar se o usuário logado possui a permissão `update` para o módulo `organization_profile`.
3. **Persistência de Dados**: Salvar as alterações textuais de forma transacional.
4. **Reset**: Ao clicar em descartar, o formulário deve retornar aos valores originais (`defaultValue`) carregados do servidor.

### Saída de Dados
* Preview instantâneo da foto do candidato.
* Mensagens de sucesso (Toast) após salvar ou realizar upload.
* Estados de desabilitado (`disabled`) nos campos caso o usuário não tenha permissão de edição.
* Skeletons durante o carregamento inicial dos dados.

---

## Critérios de Aceitação

| ID | Título | Cenário |
| :--- | :--- | :--- |
| **CA01** | Upload Imediato de Foto | Dado que o usuário selecionou uma nova foto, quando o arquivo for processado, então o preview deve ser atualizado e o arquivo salvo no storage sem necessidade de salvar o formulário. |
| **CA02** | Salvar Dados Textuais | Dado que o usuário alterou o número do candidato, quando clicar em salvar, então as informações devem ser persistidas e exibida mensagem de sucesso. |
| **CA03** | Bloqueio por Permissão | Dado que o usuário não tem permissão de escrita, quando acessar a tela, então todos os campos devem estar bloqueados e o botão de salvar oculto. |
| **CA04** | Descartar Alterações | Dado que o usuário modificou campos mas não salvou, quando clicar em descartar, então os campos devem voltar ao estado anterior. |

---

## Regras de Negócio

| ID | Título | Regra |
| :--- | :--- | :--- |
| **RN01** | Persistência Híbrida | A foto é vinculada ao ID do candidato, enquanto os dados da organização são vinculados ao ID do cliente/organização. |
| **RN02** | Obrigatoriedade de Campos | Nome, Número, Partido e Cargo são obrigatórios para a consistência da marca. |
| **RN03** | Formato de Imagem | Devem ser aceitos apenas formatos de imagem comuns (JPG, PNG) com limite de tamanho definido. |
| **RN04** | Invalidação de Cache | Alterações no perfil ou foto devem invalidar o cache global do dashboard para refletir a nova marca. |

---

## Detalhamento dos Campos

| Local | Descrição | Tipo | Observação |
| :--- | :--- | :--- | :--- |
| Identidade | Foto do Candidato | Upload | Processamento imediato (InputUpload). |
| Institucional | Domínio da Organização | String | URL/Domínio personalizado. |
| Eleitoral | Número do Candidato | Integer | Número oficial na urna. |
| Eleitoral | Ano Eleitoral | Integer | Ano da eleição. |
| Eleitoral | Cargo em Disputa | Select | Cargo (Ex: Prefeito, Vereador). |
| Eleitoral | Partido Político | Select | Sigla/Nome do partido. |
| Eleitoral | Unidade Eleitoral | Select | Nome da cidade/unidade. |
| Botões | Salvar / Descartar | Action | Persistência ou reset do formulário. |
