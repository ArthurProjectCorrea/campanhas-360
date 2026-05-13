# Relatório de Implementação: Módulo de Mapas Geográficos

Este documento descreve as alterações realizadas para integrar a visualização de mapas geográficos e malhas do IBGE no sistema Campanha 360.

---

## 1. API (C# / .NET)

As alterações no backend focaram no suporte a dados geoespaciais e no fornecimento de malhas GeoJSON.

### Infraestrutura e Banco de Dados
- **PostGIS**: A imagem do banco de dados no `docker-compose.yml` foi atualizada para `postgis/postgis:15-3.3-alpine`. Isso habilitou o suporte ao tipo `geometry`, necessário para armazenar polígonos geográficos.
- **Migrações**: Adicionada a coluna `Boundary` do tipo `Geometry` (SRID 4326) nas tabelas `States` e `Municipalities`.

### Configuração e Serialização (`Program.cs`)
- **GeoJSON Support**: Configurada a serialização JSON para suportar tipos do `NetTopologySuite`, permitindo que a API retorne objetos GeoJSON válidos diretamente.
- **Background Seeding**: Implementada a execução do seed de malhas em uma `Task` de segundo plano. Isso permite que a API suba imediatamente, enquanto os mais de 5.500 municípios são processados e baixados do IBGE em paralelo.

### Semente de Dados (`DatabaseSeeder.cs`)
- **Sincronização de Telas**: O seeder foi refatorado para um modelo de "Sync". Agora ele garante que a tela de "Mapa" e suas permissões existam em qualquer ambiente, sem duplicar dados.
- **Integração IBGE**: Adicionada lógica para buscar malhas geográficas via API v4 do IBGE para cada estado e município cadastrado, realizando o parse de GeoJSON para o formato espacial do banco.

### Controladores (`MapController.cs`)
- **Endpoints de Malhas**: Criados endpoints `/api/map/states` e `/api/map/municipalities` que exportam as geometrias do banco no formato GeoJSON FeatureCollection para consumo do frontend.

---

## 2. Web (Next.js)

As alterações no frontend focaram na interatividade e visualização dos dados geoespaciais.

### Componentes Customizados
- **MapboxMap.tsx**: Componente desenvolvido em `components/custom/` que encapsula a biblioteca `mapbox-gl`. Ele gerencia a renderização de múltiplas camadas (sources/layers) de GeoJSON e reage a mudanças de estados e visibilidade de camadas.

### Nova Tela de Mapa (`/app/[domain]/map/page.tsx`)
- **Visualização**: Implementada a página principal do módulo com um layout de duas colunas (controles e mapa).
- **Gestão de Camadas**: Adicionados toggles para habilitar/desabilitar malhas de Estados e Municípios de forma independente.
- **Feedback Visual**: Implementado um estado de `loading` com spinners e overlays de desfoque para indicar quando as malhas (que podem ser pesadas) estão sendo carregadas da API.

### Integração e Permissões
- **Sidebar**: Adicionado o item "Mapa" ao menu de navegação lateral.
- **Perfis de Acesso**: Integrada a nova tela ao sistema de permissões. O cache das Server Actions em `access-profile-action.ts` foi ajustado (`revalidate: 0`) para garantir que a nova tela apareça imediatamente para configuração nos perfis de acesso.
- **Configuração**: Adicionado suporte à variável de ambiente `NEXT_PUBLIC_MAPBOX_TOKEN` para autenticação com os serviços de mapa.

---

## 3. Verificação de Sucesso

- **Backend**: Verificado que o banco armazena as geometrias e a API as serve corretamente via `curl`.
- **Frontend**: O mapa renderiza as divisões do IBGE com precisão sobre o mapa base do Mapbox.
- **Performance**: O carregamento em background na API evita timeouts durante a inicialização do container.
