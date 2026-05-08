

## Requisitos Funcionais

| ID | Título | Descrição |
| :--- | :--- | :--- |
| **RF-01** | Identificação do Responsável Legal | O sistema deve permitir a identificação do usuário por CPF ou CNPJ, com validação automática. |
| **RF-02** | Consulta de Imóveis Irregulares | O sistema deve consultar imóveis em situação de irregularidade ambiental vinculados ao CPF/CNPJ informado, exclusivamente por meio da base CNIR. |
| **RF-03** | Seleção de Imóvel | O sistema deve permitir a seleção de apenas um imóvel por vez, autopreenchendo os dados associados. |
| **RF-04** | Cálculo da Indenização Ambiental | O sistema deve calcular automaticamente o valor da indenização considerando parâmetros legais e índices econômicos vigentes. |
| **RF-05** | Resultado da Análise | O sistema deve apresentar os valores calculados de forma discriminada. |
| **RF-06** | Condições de Regularização | O sistema deve permitir a visualização das condições de parcelamento e a seleção de apenas uma condição. |
| **RF-07** | Detalhamento do Cálculo | O sistema deve apresentar detalhamento técnico-financeiro em modal. |
| **RF-08** | Termo de Confissão de Dívida | O sistema deve gerar o termo jurídico com aceite e assinatura eletrônica. A assinatura só deve ser liberada após a rolagem da página até o final. |
| **RF-09** | Pagamento | O sistema deve possibilitar o pagamento via PIX (QR Code e copia e cola) e Boleto (Emissão e código de barras). |
| **RF-10** | Extrato Financeiro | O sistema deve permitir a visualização do extrato financeiro do acordo, incluindo pagamentos e amortização de múltiplas parcelas. |
| **RF-11** | Chatbot de Suporte | O sistema deve disponibilizar atendimento automatizado com persistência de sessão e redirecionamento para atendimento humano via WhatsApp. |
| **RF-12** | Aba do Usuário | O sistema deve permitir acesso às funcionalidades "Minha Conta", "Configurações" e "Logout". |
| **RF-13** | Modal de Oportunidade Exclusiva | O sistema deve exibir um modal de oportunidade promocional caso o usuário tente sair do site sem se regularizar (monitorando o movimento do cursor). |
| **RF-14** | Navegação por Abas Fixas | O sistema deve permitir navegação entre "Simulação de Acordo" e "Extrato Financeiro" sem perda de contexto. |

---

## Requisitos Não Funcionais

| ID | Título | Descrição |
| :--- | :--- | :--- |
| **RNF-01** | Segurança | Autenticação obrigatória, controle de sessão e proteção contra acesso não autorizado. |
| **RNF-02** | Auditabilidade | Registro de cálculos, logs de aceite/pagamento e versionamento de contratos. |
| **RNF-03** | Usabilidade | Interface intuitiva, feedback visual e navegação consistente. |
| **RNF-04** | Desempenho | Respostas em tempo aceitável e tratamento de falhas de integração. |
| **RNF-05** | Responsividade | A interface deve ser adaptável para dispositivos móveis, mantendo a legibilidade dos campos. |
| **RNF-06** | LGPD | Dados do responsável e da propriedade devem ser tratados conforme a Lei Geral de Proteção de Dados. |
| **RNF-07** | Tempo de Resposta | O cálculo da indenização e as opções de parcelamento não devem exceder 2 segundos. |
| **RNF-08** | Sincronismo PIX | O sistema deve utilizar Webhooks para confirmação de pagamento PIX em tempo real (latência < 5s). |
| **RNF-09** | Feedback ao Usuário | O sistema deve exibir estados de "Carregando" (Spinners) durante o processamento. |

---

## Regras de Negócio

*   Somente imóveis irregulares podem ser processados;
*   Valores financeiros não podem ser editados manualmente;
*   Apenas uma condição de regularização pode ser selecionada;
*   Pagamentos devem estar vinculados a contrato válido;
*   Assinatura eletrônica é obrigatória para formalização;
*   Assinatura do termo liberada apenas após a rolagem de tela;
*   Modal de promoção deve aparecer apenas uma vez por sessão do usuário.

---

## Aprovações para Andamento do Projeto

| Nome | Cargo | Assinatura |
| :--- | :--- | :--- |
| | Gerente de Projetos | |
| | Gerente de Desenvolvimento | |
| | Analista de Projetos | |
| | Gerente de Compliance | |
| | Gerente de Operações | |
| | Coordenador de Cadastro | |

---

**Cuiabá, sexta-feira, 30 de janeiro de 2026.**
