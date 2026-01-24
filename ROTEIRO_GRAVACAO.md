# Roteiro de Gravação (Screencast) para Auditoria do YouTube

O YouTube solicitou um vídeo mostrando:
1. Como o bot recupera mensagens do chat.
2. Como ele processa essas mensagens para identificar interações.

Siga este roteiro para gravar um vídeo curto (1 a 2 minutos) usando o OBS ou qualquer gravador de tela.

## Preparação
1. Abra o painel do seu Bot (Dashboard).
2. Abra uma transmissão sua (pode ser uma live de teste ou uma live passada) no YouTube.
3. Tenha o código do bot aberto no VS Code (opcional, mas bom pra mostrar seriedade).

## O que Falar e Mostrar (Passo a Passo)

### Parte 1: Introdução
**Ação:** Mostre a tela inicial do Dashboard do Bot.
**Fala sugerida:**
"Olá equipe de conformidade do YouTube. Este é o painel de controle do meu aplicativo 'Obot', que auxilia no gerenciamento de filas e interações em minhas transmissões ao vivo."

### Parte 2: Recuperação do Chat (Chat Retrieval)
**Ação:** 
- Vá para a aba/tela onde você configura a conexão com o YouTube. 
- Mostre o botão de "Conectar" ou o status "Conectado".
- Se possível, mostre o console do navegador (F12) ou logs do servidor mostrando os *requests* para a API (opcional, mas técnico).
**Fala sugerida:**
"O aplicativo se conecta à API do YouTube através do fluxo OAuth seguro. Nós utilizamos o endpoint `liveBroadcasts` para encontrar a transmissão ativa e o `liveChatMessages` para ler o chat."

### Parte 3: Processamento e Interação
**Ação:**
- Abra o chat da sua live no YouTube.
- Digite um comando no chat, por exemplo: `!entrar` ou `!fila`.
- Mostre imediatamente o Bot reagindo no Dashboard (adicionando o nome na fila).
**Fala sugerida:**
"Aqui podemos ver o funcionamento em tempo real. Quando um usuário digita um comando no chat, como '!fila', o bot identifica essa mensagem através da API, verifica o conteúdo e executa a ação correspondente, adicionando o usuário à lista visual."
"Nós não armazenamos o conteúdo das mensagens do chat permanentemente, apenas processamos comandos específicos para interatividade."

### Parte 4: Estatísticas (Likes e Inscritos)
**Ação:** Mostre o Overlay ou a parte do Dashboard que tem o contador de Likes.
**Fala sugerida:**
"Também utilizamos a API para ler contadores de 'likeCount' e 'subscriberCount' APENAS para exibir metas visuais na tela (overlays), incentivando a audiência."

### Parte 5: Encerramento
**Fala sugerida:**
"Obrigado pela revisão. Todos os dados são usados estritamente para funcionamento da transmissão ao vivo e descartados após o uso."

---
**DICA IMPORTANTE:**
Ao fazer upload deste vídeo (Google Drive ou YouTube Unlisted), certifique-se de que a permissão de compartilhamento esteja como **"Qualquer pessoa com o link" (Anyone with the link)**. O erro anterior foi porque eles não conseguiram acessar seus arquivos!
