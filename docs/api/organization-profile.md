# API: Perfil da Organização

Este documento descreve os endpoints, regras de negócio e padrões de segurança para o módulo de Perfil da Organização.

## 1. Visão Geral
O módulo é responsável por gerenciar as informações do candidato e suas respectivas campanhas eleitorais vinculadas a um cliente (organização).

## 2. Autenticação e Permissões
- **Autenticação**: Obrigatória via Bearer Token (JWT) validado contra o Redis.
- **Screen Key**: `organization_profile`
- **Permissões Necessárias**:
  - `view`: Para listar os dados.
  - `update`: Para atualizar dados do candidato e da campanha ativa, e para encerrar campanhas.
  - `create`: Para criar novas campanhas.

## 3. Endpoints

### 3.1. Listar Dados do Perfil
Retorna as informações do candidato, a lista de campanhas e os metadados da tela.

- **URL**: `GET /api/organization-profile`
- **Permissão**: `organization_profile:view`
- **Resposta de Sucesso (200 OK)**:
```json
{
  "screen": {
    "title": "Perfil da Organização",
    "description": "Gerencie os dados do candidato e suas campanhas."
  },
  "candidate": {
    "id": 1,
    "name": "Fulano de Tal",
    "avatarUrl": "https://api.dominio.com/storage/clients/GUID/candidate/avatar.jpg",
    "ballotName": "Fulano do Povo",
    "cpf": "123.456.789-00",
    "socialName": "Fulano Social",
    "birthDate": "1980-01-01T00:00:00Z"
  },
  "campaigns": [
    {
      "id": 10,
      "candidateNumber": 1234,
      "electionYear": 2024,
      "partyId": 25,
      "partyName": "Partido Progressista",
      "positionId": 1,
      "positionName": "Vereador",
      "stateId": 11,
      "stateName": "Mato Grosso",
      "municipalityId": 110001,
      "municipalityName": "Cuiabá",
      "legalSpendingLimit": 50000.00,
      "isActive": true
    }
  ],
  "permissions": {
    "canUpdate": true,
    "canCreate": true
  }
}
```

### 3.2. Atualizar Perfil (Candidato + Campanha Ativa)
Atualiza os dados do candidato e da campanha que estiver marcada como ativa. Se houver envio de nova imagem, processa o armazenamento.

- **URL**: `PUT /api/organization-profile`
- **Permissão**: `organization_profile:update`
- **Payload (Multipart/Form-Data)**:
  - `candidateName`: string
  - `ballotName`: string
  - `cpf`: string
  - `socialName`: string
  - `birthDate`: DateTime
  - `avatar`: File (opcional)
  - `campaignId`: int (ID da campanha ativa)
  - `candidateNumber`: int
  - `electionYear`: int
  - `partyId`: int
  - `positionId`: int
  - `stateId`: int
  - `municipalityId`: int
  - `legalSpendingLimit`: decimal

- **Regras de Negócio**:
  - A API deve identificar o `ClientId` através da sessão.
  - Se um arquivo `avatar` for enviado:
    - Salvar em: `wwwroot/storage/clients/{clientId}/candidate/avatar_{timestamp}.jpg`.
    - Otimizar/Redimensionar a imagem antes de salvar.
    - Deletar o arquivo antigo associado ao candidato.
  - Atualizar os dados do `Candidate`.
  - Atualizar os dados da `Campaign` referente ao `campaignId` (validando se pertence ao cliente).

### 3.3. Criar Nova Campanha
Inicia uma nova campanha eleitoral.

- **URL**: `POST /api/organization-profile/campaigns`
- **Permissão**: `organization_profile:create`
- **Payload (JSON)**:
```json
{
  "candidateNumber": 5555,
  "electionYear": 2028,
  "partyId": 22,
  "positionId": 2,
  "stateId": 11,
  "municipalityId": 110001,
  "legalSpendingLimit": 100000.00
}
```
- **Regras de Negócio**:
  - Inativar automaticamente a campanha que estiver marcada como `IsActive = true` para aquele `Candidate`.
  - Criar a nova campanha com `IsActive = true`.
  - O `ClientId` e `CandidateId` são preenchidos automaticamente pela API.

### 3.4. Encerrar Campanha
Inativa a campanha atual sem criar uma nova.

- **URL**: `PUT /api/organization-profile/campaigns/{id}/inactivate`
- **Permissão**: `organization_profile:update`
- **Regras de Negócio**:
  - Define `IsActive = false` para a campanha informada.
  - Valida se a campanha pertence ao `ClientId` da sessão.

## 4. Estrutura de Armazenamento (Storage)
Os arquivos de mídia serão organizados por cliente para facilitar a gestão e segurança:
`wwwroot/storage/clients/{clientId}/candidate/`

## 5. Segurança
- **Validação de ClientId**: Em todas as operações de escrita e leitura, o `ClientId` da sessão deve ser usado como filtro obrigatório no banco de dados.
- **Sanitização**: Todos os inputs serão sanitizados para evitar XSS e SQL Injection (via Entity Framework).
- **MimeType**: O upload de avatar deve validar se o arquivo é uma imagem válida (jpg, png, webp).
