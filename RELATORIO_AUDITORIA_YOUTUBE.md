# Relatório de Amostra: Estatísticas de Transmissão ao Vivo (Sample Report)

**Data do Relatório:** 23/01/2026
**ID da Transmissão:** `jfKfP_-ZRsw`
**Canal:** `OBOT (@OBOT7)`

## Resumo de Métricas em Tempo Real

| Métrica | Valor | Fonte da API |
| :--- | :--- | :--- |
| **Status da Transmissão** | AO VIVO | `liveBroadcasts` / `search` |
| **Total de Curtidas** | 1.450 | `videos` (part: statistics) |
| **Total de Inscritos** | 12.300 | `channels` (part: statistics) |
| **Meta de Curtidas Atual** | 1.500 | *Interno (Baseado em Likes)* |
| **Meta de Inscritos Atual** | 20 (Diária) | *Interno (Baseado em Subs)* |

## Detalhamento da Coleta de Dados

O aplicativo realiza consultas periódicas (Polling) à API do YouTube para atualizar os overlays e widgets interativos. O aplicativo **NÃO ARMAZENA** histórico de longo prazo, apenas utiliza os dados em tempo real para feedback visual.

### 1. Estatísticas de Vídeo (Frequência: ~15s)
Utilizado para atualizar o contador de curtidas e verificar metas.

**Dados Brutos (Exemplo da resposta da API `videos`):**
```json
{
  "kind": "youtube#videoListResponse",
  "items": [
    {
      "id": "L1v3_Str3am_ID",
      "statistics": {
        "viewCount": "5432",
        "likeCount": "1450",
        "favoriteCount": "0",
        "commentCount": "342"
      }
    }
  ]
}
```

### 2. Estatísticas do Canal (Frequência: ~60s)
Utilizado para monitorar o crescimento de inscritos durante a live.

**Dados Brutos (Exemplo da resposta da API `channels`):**
```json
{
  "kind": "youtube#channelListResponse",
  "items": [
    {
      "id": "UC_Channel_ID_123",
      "statistics": {
        "viewCount": "1050040",
        "subscriberCount": "12300",
        "hiddenSubscriberCount": false,
        "videoCount": "89"
      }
    }
  ]
}
```

## Uso dos Dados no Aplicativo

- **Barra de Metas de Curtidas:** Visualiza o progresso das curtidas em relação à meta definida.
- **Roleta de Prêmios:** Ativada automaticamente quando uma meta de curtidas é atingida.
- **Contador de Inscritos:** Exibe o ganho de inscritos na sessão atual.

---
*Este relatório é gerado como demonstração do uso dos dados da YouTube Data API v3 pelo aplicativo.*
