import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChatWindow } from '@/components/ChatWindow';
import { MessageInput } from '@/components/MessageInput';
import { QueueDisplay } from '@/components/QueueDisplay';
import { PlayingDisplay } from '@/components/PlayingDisplay';
import { SettingsModal } from '@/components/SettingsModal';
import { YouTubeSettings } from '@/components/YouTubeSettings';
import { TimerSettings } from '@/components/TimerSettings';
import { LikesTab } from '@/components/LikesTab';
import { BlockedUsersTab } from '@/components/BlockedUsersTab';
import type { Message, AppSettings, QueueUser, MessageSettings, CommandSettings, CommandSetting } from '@/types';
import { BotIcon, SettingsIcon, SunIcon, MoonIcon, LogOutIcon, ChevronDownIcon, ChevronUpIcon, MessageSquareIcon, LayoutIcon, ChevronLeftIcon, ChevronRightIcon, SkipForwardIcon, RefreshCwIcon, YoutubeIcon, RocketIcon } from '@/components/Icons';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/src/contexts/SessionContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Sidebar } from '@/components/Sidebar';
import { useQueuePersistence } from '@/src/hooks/useQueuePersistence';

const defaultSettings: AppSettings = {
    botName: 'Alice',
    commands: {
        join: { command: '!entrar', enabled: true },
        leave: { command: '!sair', enabled: true },
        position: { command: '!posicao', enabled: true },
        nick: { command: '!nick', enabled: true },
        next: { command: '!proximo', enabled: true },
        timerOn: { command: '!timer on', enabled: true },
        timerOff: { command: '!timer off', enabled: true },
        reset: { command: '!resetar', enabled: true },
        queueList: { command: '!fila', enabled: true },
        playingList: { command: '!jogando', enabled: true },
        openQueue: { command: '!abrir', enabled: true },
        closeQueue: { command: '!fechar', enabled: true },
    },
    messages: {
        userExistsQueue: { text: '@{user}, você já está na fila na posição {position}.', enabled: true },
        userExistsPlaying: { text: '@{user}, você já está jogando!', enabled: true },
        userJoined: { text: '@{user} entrou na fila (Posição: {position}).', enabled: true },
        joinWithTimer: { text: ' Fale a cada {minutes}min para não sair!', enabled: true },
        userPosition: { text: '@{user}, você é o número {position} da fila.', enabled: true },
        userIsPlaying: { text: "@{user}, você está na seção 'Jogando Agora'.", enabled: true },
        notInQueue: { text: '@{user}, você não está na fila. Digite {join}.', enabled: true },
        userLeft: { text: '@{user} saiu da fila/jogo manualmente.', enabled: true },
        userNicknameUpdated: { text: '@{user}, seu apelido foi atualizado para "{nickname}".', enabled: true },
        nextUser: { text: '🔔 A VEZ É DE: @{user}! Peça para entrar no grupo para jogar.', enabled: true },
        nextInQueue: { text: '👀 O próximo da fila é @{user}.', enabled: true },
        queueEmpty: { text: 'A fila está vazia!', enabled: true },
        timerOff: { text: '🛑 Timer de inatividade DESATIVADO.', enabled: true },
        timerOn: { text: '✅ Timer de inatividade ATIVADO ({minutes} min).', enabled: true },
        reset: { text: '♻ A fila e a seção de jogo foram reiniciadas pelo administrador.', enabled: true },
        removedForInactivityQueue: { text: '🚫 @{user} removido da fila por inatividade.', enabled: true },
        thirtySecondWarning: { text: '⚠️ @{user}, você tem 30 segundos para falar ou será removido!', enabled: true },
        queueList: { text: 'Próximos na fila: {list}', enabled: true },
        queueListEmpty: { text: 'A fila de espera está vazia.', enabled: true },
        playingList: { text: 'Jogando agora: {list}', enabled: true },
        playingListEmpty: { text: 'Ninguém está jogando no momento.', enabled: true },
        queueClosed: { text: '🚫 A fila está fechada agora!', enabled: true },
        queueOpened: { text: '✅ A fila está aberta agora! Digite {join} para entrar.', enabled: true },
        queueIsClosed: { text: '❌ @{user}, a fila está fechada no momento.', enabled: true },
    },
    customCommands: [],
    youtubeChannelId: '',
    autoSyncYoutube: true,
    isQueueOpen: true,
};

export const HomePage: React.FC = () => {
    const { session } = useSession();
    const { theme, toggleTheme } = useTheme();
    const { saveQueueState, loadQueueState, updateUserTimer, markWarningAsSent } = useQueuePersistence();
    const [adminName, setAdminName] = useState<string>('Admin');
    const [currentUser, setCurrentUser] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [queue, setQueue] = useState<QueueUser[]>([]);
    const [playingUsers, setPlayingUsers] = useState<QueueUser[]>([]);
    const [userTimers, setUserTimers] = useState<Record<string, number>>({});
    const [isTimerActive, setIsTimerActive] = useState<boolean>(true);
    const [timeoutMinutes, setTimeoutMinutes] = useState<number>(5);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [appSettings, setAppSettings] = useState<AppSettings>(defaultSettings);
    const [warningSentUsers, setWarningSentUsers] = useState<Set<string>>(new Set());
    const [blockedChannelIds, setBlockedChannelIds] = useState<Set<string>>(new Set());
    const [blockedUsernames, setBlockedUsernames] = useState<Set<string>>(new Set());
    const isInitialLoad = useRef(true);

    // Session Statistics
    const [sessionStats, setSessionStats] = useState({ totalJoined: 0, peakQueue: 0, totalPlayed: 0 });
    const [queueHistory, setQueueHistory] = useState<number[]>([]);

    // Estado para a conexão com o YouTube
    const [liveChatId, setLiveChatId] = useState<string>('');
    const [channelTitle, setChannelTitle] = useState<string>('');
    const [canAutoConnect, setCanAutoConnect] = useState(true);
    const [settingsId, setSettingsId] = useState<number | null>(null);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [isPolling, setIsPolling] = useState(false);
    const [isFindingChat, setIsFindingChat] = useState(false);
    const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
    const [likeCount, setLikeCount] = useState<number>(0);
    const nextPageTokenRef = useRef<string | null>(null);
    const consecutiveErrorsRef = useRef<number>(0);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const processedMessageIds = useRef<Set<string>>(new Set());
    const isFetchingRef = useRef(false);
    const isFetchingStatsRef = useRef(false);


    // Layout State - Restaura do localStorage se disponível
    const [activeTab, setActiveTab] = useState(() => {
        const saved = localStorage.getItem('alice_active_tab');
        return saved || 'dashboard';
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('alice_sidebar_open');
        return saved !== null ? saved === 'true' : true;
    });

    useEffect(() => {
        if (session?.user?.user_metadata?.full_name) {
            setCurrentUser(session.user.user_metadata.full_name);
            setAdminName(session.user.user_metadata.full_name);
        } else if (channelTitle) {
            setCurrentUser(channelTitle);
            setAdminName(channelTitle);
        } else if (session?.user?.email) {
            // Máscara para o e-mail: pega apenas a parte antes do @ para não vazar o e-mail completo
            const maskedEmail = session.user.email.split('@')[0];
            setCurrentUser(maskedEmail);
            setAdminName(maskedEmail);
        }
    }, [session, channelTitle]);

    // Listener para deletar dados (Disparado pelo SettingsModal)
    useEffect(() => {
        const handleDeleteData = async () => {
            console.log('[HomePage] Iniciando exclusão de dados do usuário...');
            try {
                const { error } = await supabase.rpc('delete_user_data');
                if (error) throw error;

                console.log('[HomePage] Dados excluídos com sucesso no Banco de Dados.');

                // Limpar estados locais
                setQueue([]);
                setPlayingUsers([]);
                setUserTimers({});
                setWarningSentUsers(new Set());
                setAppSettings(defaultSettings);

                // Limpar local storage
                localStorage.removeItem('alice_queue_state');
                localStorage.removeItem('alice_active_tab');
                localStorage.removeItem('alice_sidebar_open');

                alert('Todos os seus dados foram apagados. Você será desconectado.');
                await handleSignOut();

            } catch (error: any) {
                console.error('[HomePage] Erro ao deletar dados:', error);
                alert(`Erro ao apagar dados: ${error.message}`);
            }
        };

        window.addEventListener('deleteUserData', handleDeleteData);
        return () => window.removeEventListener('deleteUserData', handleDeleteData);
    }, []);

    // Persistir aba ativa no localStorage
    useEffect(() => {
        localStorage.setItem('alice_active_tab', activeTab);
    }, [activeTab]);

    // Persistir estado da sidebar no localStorage
    useEffect(() => {
        localStorage.setItem('alice_sidebar_open', String(isSidebarOpen));
    }, [isSidebarOpen]);

    // Polling central para estatísticas (Likes e Inscritos)
    // Isso alimenta o contador global no Header e também detecta novos inscritos no background
    const fetchStats = useCallback(async () => {
        if (!session || isFetchingStatsRef.current) return;
        isFetchingStatsRef.current = true;
        try {
            const { data, error } = await supabase.functions.invoke('youtube-stats-fetch', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (data && !error) {
                if (data.likes !== undefined) setLikeCount(data.likes);
            }
        } catch (err) {
            console.error('[HomePage] Erro ao buscar stats:', err);
        } finally {
            isFetchingStatsRef.current = false;
        }
    }, [session]);

    useEffect(() => {
        if (session) {
            fetchStats();
            statsIntervalRef.current = setInterval(fetchStats, 15000); // 15 segundos
        }
        return () => {
            if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
        };
    }, [session, fetchStats]);

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
        }
    };

    const addBotMessage = useCallback((text: string, sendToYouTube: boolean = false) => {
        const botMessage: Message = { author: appSettings.botName, text, type: 'bot' };
        setMessages(prev => [...prev, botMessage]);
        if (sendToYouTube) {
            sendToYouTubeChatRef.current(text);
        }
    }, [appSettings.botName]);

    const addBotMessageRef = useRef(addBotMessage);
    useEffect(() => {
        addBotMessageRef.current = addBotMessage;
    });

    const getValidYouTubeToken = useCallback(async (): Promise<string | null> => {
        try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();

            // 1. Se veio na sessão atual do Supabase, armazena no cache local
            if (currentSession?.provider_token) {
                localStorage.setItem('alice_yt_provider_token', currentSession.provider_token);
                const expiresIn = (currentSession as any).expires_in || 3600;
                localStorage.setItem('alice_yt_token_expires_at', String(Date.now() + expiresIn * 1000));
                return currentSession.provider_token;
            }

            // 2. Se não veio na sessão, verifica o cache local (com margem de 60s)
            const cachedToken = localStorage.getItem('alice_yt_provider_token');
            const cachedExpiresAt = Number(localStorage.getItem('alice_yt_token_expires_at') || '0');
            if (cachedToken && cachedExpiresAt > Date.now() + 60000) {
                return cachedToken;
            }

            // 3. Se expirou ou não está no localStorage, busca no banco da tabela youtube_tokens
            if (currentSession?.user?.id) {
                const { data: tokenRecord } = await supabase
                    .from('youtube_tokens')
                    .select('access_token, expires_at')
                    .eq('user_id', currentSession.user.id)
                    .maybeSingle();

                if (tokenRecord?.access_token) {
                    const exp = tokenRecord.expires_at ? new Date(tokenRecord.expires_at).getTime() : 0;
                    if (!exp || exp > Date.now() + 60000) {
                        localStorage.setItem('alice_yt_provider_token', tokenRecord.access_token);
                        if (exp) localStorage.setItem('alice_yt_token_expires_at', String(exp));
                        return tokenRecord.access_token;
                    }
                }
            }

            // Fallback: se ainda existir algum cachedToken, tenta mesmo sem validar expiração estrita
            if (cachedToken) return cachedToken;
        } catch (e) {
            console.error('[getValidYouTubeToken] Erro ao obter token:', e);
        }

        return null;
    }, []);

    const sendToYouTubeChat = useCallback(async (text: string) => {
        console.log('[sendToYouTubeChat] Tentando enviar mensagem:', text);
        console.log('[sendToYouTubeChat] liveChatId:', liveChatId);

        if (!liveChatId) {
            console.warn('[sendToYouTubeChat] BLOQUEADO: liveChatId não definido. Sincronize com o YouTube primeiro.');
            addBotMessage('⚠️ Não conectado ao YouTube. Clique em "Sincronizar" primeiro.', false);
            return;
        }

        // Busca token válido da sessão, cache local ou banco de dados
        const token = await getValidYouTubeToken();

        console.log('[sendToYouTubeChat] token presente:', !!token);

        if (!token) {
            console.warn('[sendToYouTubeChat] token ausente. O backend tentará renovar via banco/Google...');
        }

        console.log('[sendToYouTubeChat] Enviando para YouTube API...');

        try {
            const { data, error } = await supabase.functions.invoke('youtube-chat-send', {
                body: {
                    liveChatId,
                    messageText: text,
                    youtubeToken: token
                },
            });

            console.log('[sendToYouTubeChat] Resposta:', { data, error });

            if (data && data.success === false) {
                const errorText = `[Erro YouTube] ${data.error} `;
                console.error('[sendToYouTubeChat] Erro retornado pela API:', data.error);
                setMessages(prev => [...prev, { author: appSettings.botName, text: errorText, type: 'bot' }]);
                return;
            }

            if (error) {
                console.error('[sendToYouTubeChat] Erro de rede/servidor:', error);
                const errorText = `[Erro YouTube] Falha na rede / servidor: ${error.message} `;
                setMessages(prev => [...prev, { author: appSettings.botName, text: errorText, type: 'bot' }]);
                return;
            }

            console.log('[sendToYouTubeChat] ✅ Mensagem enviada com sucesso!');
        } catch (error: any) {
            console.error('[sendToYouTubeChat] Exceção:', error);
            const errorText = `[Erro YouTube]Exceção: ${error.message} `;
            setMessages(prev => [...prev, { author: appSettings.botName, text: errorText, type: 'bot' }]);
        }
    }, [liveChatId, appSettings.botName, addBotMessage]);

    const sendToYouTubeChatRef = useRef(sendToYouTubeChat);
    useEffect(() => {
        sendToYouTubeChatRef.current = sendToYouTubeChat;
    });

    const sendBotMessage = useCallback((messageKey: keyof MessageSettings, replacements?: Record<string, string | number>) => {
        const messageSetting = appSettings.messages[messageKey];
        if (messageSetting && messageSetting.enabled) {
            let text = messageSetting.text;
            if (replacements) {
                Object.entries(replacements).forEach(([key, value]) => {
                    let strValue = String(value);
                    // Remove leading @ from user if template already has @{user}
                    if (key === 'user' && strValue.startsWith('@') && text.includes('@{user}')) {
                        strValue = strValue.substring(1);
                    }
                    text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), strValue);
                });
            }
            console.log(`[sendBotMessage] Enviando mensagem "${messageKey}": `, text);
            addBotMessage(text, true);
        }
    }, [appSettings.messages, addBotMessage]);


    const refreshData = useCallback(async (silent = false) => {
        if (adminName === 'Admin') return;
        try {
            if (!silent) setIsLoadingSettings(true);

            // 1. Configurações
            const { data: settingsData, error: settingsError } = await supabase
                .from('settings')
                .select('id, settings_data')
                .maybeSingle();

            if (settingsError) throw settingsError;

            if (settingsData) {
                setSettingsId(settingsData.id);
                const dbSettings = settingsData.settings_data as Partial<AppSettings>;
                const mergedSettings: AppSettings = JSON.parse(JSON.stringify(defaultSettings));

                if (dbSettings.botName) mergedSettings.botName = dbSettings.botName;
                if (dbSettings.commands) {
                    for (const key in dbSettings.commands) {
                        if (key in mergedSettings.commands) {
                            const typedKey = key as keyof CommandSettings;
                            mergedSettings.commands[typedKey] = {
                                ...mergedSettings.commands[typedKey],
                                ...dbSettings.commands[typedKey]
                            };
                        }
                    }
                }
                if (dbSettings.messages) {
                    for (const key in dbSettings.messages) {
                        if (key in mergedSettings.messages) {
                            const typedKey = key as keyof MessageSettings;
                            mergedSettings.messages[typedKey] = {
                                ...mergedSettings.messages[typedKey],
                                ...dbSettings.messages[typedKey]
                            };
                        }
                    }
                }

                mergedSettings.customCommands = dbSettings.customCommands || [];
                if (dbSettings.youtubeChannelId) mergedSettings.youtubeChannelId = dbSettings.youtubeChannelId;
                if (typeof dbSettings.autoSyncYoutube === 'boolean') mergedSettings.autoSyncYoutube = dbSettings.autoSyncYoutube;
                if (typeof dbSettings.isQueueOpen === 'boolean') mergedSettings.isQueueOpen = dbSettings.isQueueOpen;

                setAppSettings(mergedSettings);
            }

            // 2. Fila
            const { data: queueData, error: queueError } = await supabase
                .from('queue')
                .select('username, nickname, joined_at, timer_start_time, warning_sent')
                .order('joined_at', { ascending: true });

            if (queueError) throw queueError;
            setQueue(queueData.map(q => ({
                user: q.username,
                nickname: q.nickname
            })));

            // 3. Jogando
            const { data: playingData, error: playingError } = await supabase
                .from('playing_users')
                .select('username, nickname');

            if (playingError) throw playingError;
            setPlayingUsers(playingData.map(p => ({ user: p.username, nickname: p.nickname })));

            // 4. Timers e Atividade
            const initialTimers = queueData.reduce((acc, q) => {
                const timerTime = q.timer_start_time || q.joined_at;
                acc[q.username] = new Date(timerTime).getTime();
                return acc;
            }, {} as Record<string, number>);
            setUserTimers(initialTimers);

            const warningsSet = new Set<string>();
            queueData.forEach(q => {
                if (q.warning_sent) warningsSet.add(q.username);
            });
            setWarningSentUsers(warningsSet);

            // 5. Estado do Timer
            const queueState = await loadQueueState();
            if (queueState) {
                setIsTimerActive(queueState.isTimerActive);
                setTimeoutMinutes(queueState.timeoutMinutes);
            }

            if (isInitialLoad.current) {
                setTimeout(() => {
                    isInitialLoad.current = false;
                    console.log('[HomePage] Carregamento inicial concluído.');
                }, 500);
            }

        } catch (error: any) {
            console.error("Error refreshing data:", error);
            if (error.code !== 'PGRST116' && !silent) {
                addBotMessageRef.current(`Erro ao atualizar dados: ${error.message} `);
            }
        } finally {
            if (!silent) setIsLoadingSettings(false);
        }
    }, [adminName, loadQueueState]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // Realtime Listener for Queue and Playing Users
    useEffect(() => {
        if (!session?.user?.id) return;

        console.log('[HomePage] Setting up realtime listeners...');
        const channel = supabase
            .channel('db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'queue',
                    filter: `user_id=eq.${session.user.id}`
                },
                () => {
                    console.log('[HomePage] Realtime: Queue changed, re-fetching...');
                    refreshData(true);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'playing_users',
                    filter: `user_id=eq.${session.user.id}`
                },
                () => {
                    console.log('[HomePage] Realtime: Playing users changed, re-fetching...');
                    refreshData(true);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.user?.id, refreshData]);

    // Listener para usuários bloqueados
    useEffect(() => {
        if (!session?.user?.id) return;

        const fetchBlocked = async () => {
            const { data, error } = await supabase
                .from('blocked_users')
                .select('youtube_channel_id, username')
                .eq('user_id', session.user.id);

            if (!error && data) {
                setBlockedChannelIds(new Set(data.map(u => u.youtube_channel_id)));
                const userNames = data.filter(u => u.username).map(u => u.username!.toLowerCase().trim());
                setBlockedUsernames(new Set(userNames));
            }
        };

        fetchBlocked();

        window.addEventListener('blockedUsersChanged', fetchBlocked);

        const channel = supabase
            .channel('blocked-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'blocked_users',
                    filter: `user_id=eq.${session.user.id}`
                },
                () => {
                    fetchBlocked();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('blockedUsersChanged', fetchBlocked);
        };
    }, [session?.user?.id]);

    // Persistência automática do estado do timer (Debounced)
    useEffect(() => {
        if (isInitialLoad.current) return;

        console.log('[HomePage] Timer state mudou, agendando salvamento...', { isTimerActive, timeoutMinutes });
        const timer = setTimeout(() => {
            console.log('[HomePage] Salvando estado do timer no Supabase:', { isTimerActive, timeoutMinutes });
            saveQueueState({ isTimerActive, timeoutMinutes });
        }, 1000);

        return () => clearTimeout(timer);
    }, [isTimerActive, timeoutMinutes, saveQueueState]);

    const handleSettingsSave = async (newSettings: AppSettings) => {
        console.log("Tentando salvar configurações:", newSettings, "ID atual:", settingsId);
        setAppSettings(newSettings);
        try {
            const payload: any = {
                settings_data: newSettings,
                user_id: session?.user?.id
            };

            // SE tivermos um ID, usamos para garantir que estamos atualizando a linha correta.
            // SE NÃO tivermos, não passamos ID para o Supabase gerar um novo e o RLS vincular ao nosso usuário.
            if (settingsId) {
                payload.id = settingsId;
            }

            const { data, error } = await supabase
                .from('settings')
                .upsert(payload)
                .select()
                .single();

            if (error) {
                console.error("Erro no upsert de configurações:", error);
                throw error;
            }

            if (data) {
                setSettingsId(data.id);
            }

            addBotMessage("Configurações salvas com sucesso!");
        } catch (error: any) {
            console.error("Failed to save settings to Supabase:", error);
            const msg = error.message || "Erro desconhecido";
            addBotMessage(`Erro ao salvar configurações: ${msg} `);
        }
    };


    const handleMoveToPlaying = useCallback(async (userToMove: string) => {
        const userObjectIndex = queue.findIndex(u => u.user === userToMove);
        if (userObjectIndex === -1) return;
        const userObject = queue[userObjectIndex];

        sendBotMessage('nextUser', { user: userToMove });

        if (userObjectIndex === 0 && queue.length > 1) {
            sendBotMessage('nextInQueue', { user: queue[1].user });
        }

        setQueue(prev => prev.filter(u => u.user !== userToMove));
        setPlayingUsers(prev => {
            if (prev.some(u => u.user === userToMove)) return prev;
            setSessionStats(s => ({ ...s, totalPlayed: s.totalPlayed + 1 }));
            return [...prev, userObject];
        });

        setUserTimers(prev => {
            const newTimers = { ...prev };
            delete newTimers[userToMove];
            return newTimers;
        });
        setWarningSentUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userToMove);
            return newSet;
        });

        try {
            await supabase.from('queue').delete().eq('username', userToMove);
            await supabase.from('playing_users').insert({
                username: userObject.user,
                nickname: userObject.nickname
            });
        } catch (error) {
            console.error("Error moving user to playing:", error);
            addBotMessage(`Erro ao mover ${userToMove} para 'Jogando Agora'.`);
        }

    }, [queue, sendBotMessage, addBotMessage]);

    const handleNextUser = useCallback(async () => {
        if (queue.length === 0) {
            sendBotMessage('queueEmpty');
            return;
        }
        const [nextUserObj] = queue;
        await handleMoveToPlaying(nextUserObj.user);
    }, [queue, sendBotMessage, handleMoveToPlaying]);

    const handleQuickBlock = useCallback(async (channelId: string, username: string) => {
        if (!session?.user?.id || !channelId) return;

        const confirmed = window.confirm(`Deseja bloquear os comandos de @${username}?`);
        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('blocked_users')
                .insert({
                    user_id: session.user.id,
                    youtube_channel_id: channelId.trim(),
                    username: username
                });

            if (error) {
                if (error.code === '23505') {
                    addBotMessage(`@${username} já está bloqueado.`);
                    return;
                }
                throw error;
            }

            addBotMessage(`@${username} foi bloqueado e não pode mais usar comandos.`);
            window.dispatchEvent(new CustomEvent('blockedUsersChanged'));
        } catch (err: any) {
            console.error('Error blocking user from chat:', err);
            addBotMessage(`Erro ao bloquear @${username}: ${err.message}`);
        }
    }, [session?.user?.id, addBotMessage]);

    const handleRemovePlayingUser = useCallback(async (userToRemove: string) => {
        setPlayingUsers(prev => prev.filter(u => u.user !== userToRemove));
        try {
            await supabase.from('playing_users').delete().eq('username', userToRemove);
        } catch (error) {
            console.error("Error removing playing user:", error);
            addBotMessage(`Erro ao remover ${userToRemove}.`);
        }
    }, [addBotMessage]);

    const handleMoveBackToQueue = useCallback(async (userToMove: string) => {
        const userObject = playingUsers.find(u => u.user === userToMove);
        if (!userObject) return;

        setPlayingUsers(prev => prev.filter(u => u.user !== userToMove));
        setQueue(prev => [...prev, userObject]);
        setUserTimers(prev => ({ ...prev, [userToMove]: Date.now() }));

        try {
            const { error: delError } = await supabase.from('playing_users').delete().eq('username', userToMove);
            if (delError) throw delError;

            const { error: insError } = await supabase.from('queue').insert({ username: userObject.user, nickname: userObject.nickname });
            if (insError) throw insError;

            addBotMessage(`@${userToMove} voltou para a fila.`);
        } catch (error) {
            console.error("Error moving user back to queue:", error);
            addBotMessage(`Erro ao mover ${userToMove} de volta para a fila.`);
        }
    }, [playingUsers, addBotMessage]);

    const handleRemoveUsersFromQueue = useCallback(async (usersToRemove: string[], reason: 'admin' | 'inactivity' = 'admin') => {
        if (usersToRemove.length === 0) return;

        const usersToRemoveSet = new Set(usersToRemove);

        setQueue(prev => prev.filter(u => !usersToRemoveSet.has(u.user)));
        setUserTimers(prev => {
            const newTimers = { ...prev };
            usersToRemove.forEach(user => delete newTimers[user]);
            return newTimers;
        });
        setWarningSentUsers(prev => {
            const newSet = new Set(prev);
            usersToRemove.forEach(user => newSet.delete(user));
            return newSet;
        });

        try {
            const { error } = await supabase.from('queue').delete().in('username', usersToRemove);
            if (error) throw error;

            if (reason === 'inactivity') {
                usersToRemove.forEach(user => {
                    sendBotMessage('removedForInactivityQueue', { user });
                });
            } else {
                usersToRemove.forEach(user => {
                    addBotMessage(`@${user} foi removido da fila pelo administrador.`);
                });
            }
        } catch (error) {
            console.error("Error removing users from queue:", error);
            addBotMessage(`Erro ao remover usuários da fila.`);
        }
    }, [addBotMessage, sendBotMessage]);

    const activateTimer = useCallback(() => {
        if (isTimerActive) return;
        setIsTimerActive(true);
        const now = Date.now();
        const newTimers = queue.reduce((acc, u) => {
            acc[u.user] = now;
            return acc;
        }, {} as Record<string, number>);
        setUserTimers(newTimers);
        setWarningSentUsers(new Set());
        sendBotMessage('timerOn', { minutes: timeoutMinutes });
    }, [isTimerActive, queue, sendBotMessage, timeoutMinutes]);

    const deactivateTimer = useCallback(() => {
        if (!isTimerActive) return;
        setIsTimerActive(false);
        sendBotMessage('timerOff');
    }, [isTimerActive, sendBotMessage]);

    const handleToggleTimer = useCallback(() => {
        if (isTimerActive) {
            deactivateTimer();
        } else {
            activateTimer();
        }
    }, [isTimerActive, deactivateTimer, activateTimer]);
    
    const toggleQueueStatus = useCallback(async () => {
        const newStatus = !appSettings.isQueueOpen;
        setAppSettings(prev => ({ ...prev, isQueueOpen: newStatus }));
        
        try {
            await supabase
                .from('settings')
                .update({ settings_data: { ...appSettings, isQueueOpen: newStatus } })
                .eq('id', settingsId);
        } catch (e) {
            console.error("Error updating queue status in DB", e);
        }

        if (newStatus) {
            sendBotMessage('queueOpened', { join: appSettings.commands.join.command });
        } else {
            sendBotMessage('queueClosed');
        }
    }, [appSettings, settingsId, sendBotMessage]);

    const handleSendMessage = useCallback(async (author: string, text: string, authorChannelId?: string) => {
        if (!text.trim()) return;

        // Normalização do autor e ID
        author = author.trim().replace(/@/g, '');
        const trimmedChannelId = authorChannelId?.trim();

        // Definições de normalização
        const normalizeText = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const commandText = normalizeText(text.trim());

        // SEMPRE adiciona a mensagem ao chat local para "uso normal"
        const userMessage: Message = { author, text, type: 'user', authorChannelId: trimmedChannelId };
        setMessages(prev => [...prev, userMessage]);

        // Verificar se usuário está bloqueado para COMANDOS
        const isUserBlockedById = trimmedChannelId && blockedChannelIds.has(trimmedChannelId);
        const isUserBlockedByName = blockedUsernames.has(author.toLowerCase().trim());

        if (isUserBlockedById || isUserBlockedByName) {
            console.log(`[BlockedUsers] USUÁRIO BLOQUEADO DETECTADO: ${author} (ID: ${trimmedChannelId})`);

            const isPotentialCommand =
                text.trim().startsWith('!') ||
                Object.values(appSettings.commands).some(c => c.enabled && commandText.startsWith(normalizeText(c.command))) ||
                appSettings.customCommands.some(c => commandText.startsWith(normalizeText(c.command)));

            if (isPotentialCommand) {
                console.log(`[BlockedUsers] Bloqueando execução do comando: ${text}`);
                return;
            } else {
                console.log(`[BlockedUsers] Mensagem comum permitida para usuário bloqueado.`);
            }
        }

        const { commands, customCommands } = appSettings;

        const checkCommand = (text: string, cmd: string) => {
            const normalizedCmd = normalizeText(cmd);
            return text === normalizedCmd || text.startsWith(normalizedCmd + ' ');
        };

        const isJoinCommand = checkCommand(commandText, commands.join.command);
        const isLeaveCommand = checkCommand(commandText, commands.leave.command);
        const isPositionCommand = checkCommand(commandText, commands.position.command) || commandText === '!posicao' || commandText === '!posição' || commandText.startsWith('!posicao ') || commandText.startsWith('!posição ');
        const isNickCommand = commandText.startsWith(normalizeText(commands.nick.command));
        const isOpenQueueCommand = checkCommand(commandText, commands.openQueue.command);
        const isCloseQueueCommand = checkCommand(commandText, commands.closeQueue.command);

        // Admin Commands
        if (author.toLowerCase() === adminName.toLowerCase()) {
            if (isOpenQueueCommand) {
                if (!appSettings.isQueueOpen) toggleQueueStatus();
                return;
            }
            if (isCloseQueueCommand) {
                if (appSettings.isQueueOpen) toggleQueueStatus();
                return;
            }
        }

        const now = Date.now();
        if (queue.some(u => u.user === author)) {
            setUserTimers(prev => ({ ...prev, [author]: now }));

            // Persistir timer_start_time no banco quando usuário fala
            updateUserTimer(author, now);

            if (warningSentUsers.has(author)) {
                setWarningSentUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(author);
                    return newSet;
                });
            }
        }

        if (author === adminName) {
            if (commands.next.enabled && commandText === commands.next.command) {
                await handleNextUser();
                return;
            }
            if (commands.timerOff.enabled && commandText === commands.timerOff.command) {
                deactivateTimer();
                return;
            }
            if (commands.timerOn.enabled && commandText === commands.timerOn.command) {
                activateTimer();
                return;
            }
            if (commands.reset.enabled && commandText === commands.reset.command) {
                setQueue([]);
                setPlayingUsers([]);
                setUserTimers({});
                setWarningSentUsers(new Set());
                try {
                    await supabase.from('queue').delete().neq('id', 0);
                    await supabase.from('playing_users').delete().neq('id', 0);
                    sendBotMessage('reset');
                } catch (error) {
                    console.error("Error resetting database:", error);
                    addBotMessage("Erro ao resetar a fila no banco de dados.");
                }
                return;
            }
        }

        if (commands.join.enabled && isJoinCommand) {
            if (!appSettings.isQueueOpen) {
                sendBotMessage('queueIsClosed', { user: author });
                return;
            }
            const isUserInQueue = queue.some(u => u.user.toLowerCase() === author.toLowerCase());
            const isUserPlaying = playingUsers.some(u => u.user.toLowerCase() === author.toLowerCase());

            if (isUserInQueue || isUserPlaying) {
                if (isUserInQueue) {
                    const pos = queue.findIndex(u => u.user === author) + 1;
                    sendBotMessage('userExistsQueue', { user: author, position: pos });
                } else {
                    sendBotMessage('userExistsPlaying', { user: author });
                }
            } else {
                const parts = text.trim().split(' ');
                const nickname = parts.length > 1 ? parts.slice(1).join(' ') : undefined;

                if (!nickname) {
                    addBotMessage(`@${author}, você precisa fornecer um apelido para entrar na fila.Ex: ${commands.join.command} SeuApelido`, true);
                    return;
                }

                const newUser = { user: author, nickname };

                setQueue(prev => {
                    const updated = [...prev, newUser];
                    setSessionStats(s => ({
                        ...s,
                        totalJoined: s.totalJoined + 1,
                        peakQueue: Math.max(s.peakQueue, updated.length),
                    }));
                    setQueueHistory(h => [...h.slice(-19), updated.length]);
                    return updated;
                });
                setUserTimers(prev => ({ ...prev, [author]: now }));

                try {
                    await supabase.from('queue').insert({ username: author, nickname });
                    const pos = queue.length + 1;

                    const baseMessage = appSettings.messages.userJoined;
                    let noticeText = baseMessage.text.replace('{user}', author).replace('{position}', String(pos));

                    const timerMessage = appSettings.messages.joinWithTimer;
                    if (isTimerActive && timerMessage.enabled) {
                        noticeText += timerMessage.text.replace('{minutes}', String(timeoutMinutes));
                    }

                    if (baseMessage.enabled) {
                        addBotMessage(noticeText, true);
                    }

                } catch (error) {
                    console.error("Error joining queue:", error);
                    addBotMessage(`Erro ao adicionar ${author} à fila.`);
                    setQueue(prev => prev.filter(u => u.user !== author));
                }
            }
        } else if (commands.position.enabled && (commandText === normalizeText(commands.position.command) || commandText === '!posicao' || commandText === '!posição')) {
            const { data: currentQueue } = await supabase
                .from('queue')
                .select('username')
                .eq('user_id', session?.user?.id)
                .order('joined_at', { ascending: true }) // Default order when joining or refreshing logic elsewhere
                ;

            const queueIndex = currentQueue ? currentQueue.findIndex(u => u.username === author) : -1;
            if (queueIndex !== -1) {
                const pos = queueIndex + 1;
                sendBotMessage('userPosition', { user: author, position: pos });
            } else if (playingUsers.some(u => u.user === author)) {
                sendBotMessage('userIsPlaying', { user: author });
            } else {
                sendBotMessage('notInQueue', { user: author, join: commands.join.command });
            }
        } else if (commands.nick.enabled && commandText.startsWith(commands.nick.command)) {
            const isUserInQueue = queue.some(u => u.user === author);
            const isUserPlaying = playingUsers.some(u => u.user === author);

            if (isUserInQueue || isUserPlaying) {
                const newNickname = text.trim().split(' ').slice(1).join(' ');
                if (!newNickname) {
                    addBotMessage(`@${author}, você precisa fornecer um apelido.Ex: ${commands.nick.command} MeuApelido`, true);
                    return;
                }

                try {
                    if (isUserInQueue) {
                        setQueue(prev => prev.map(u => u.user === author ? { ...u, nickname: newNickname } : u));
                        await supabase.from('queue').update({ nickname: newNickname }).eq('username', author);
                    }
                    if (isUserPlaying) {
                        setPlayingUsers(prev => prev.map(u => u.user === author ? { ...u, nickname: newNickname } : u));
                        await supabase.from('playing_users').update({ nickname: newNickname }).eq('username', author);
                    }
                    sendBotMessage('userNicknameUpdated', { user: author, nickname: newNickname });
                } catch (error) {
                    console.error("Error updating nickname:", error);
                    addBotMessage(`Erro ao atualizar o apelido de ${author}.`);
                }
            } else {
                sendBotMessage('notInQueue', { user: author, join: commands.join.command });
            }
        } else if (commands.leave.enabled && commandText === commands.leave.command) {
            if (queue.some(u => u.user === author) || playingUsers.some(u => u.user === author)) {
                setQueue(prev => prev.filter(u => u.user !== author));
                setPlayingUsers(prev => prev.filter(u => u.user !== author));
                setUserTimers(prev => {
                    const newTimers = { ...prev };
                    delete newTimers[author];
                    return newTimers;
                });
                setWarningSentUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(author);
                    return newSet;
                });

                try {
                    await supabase.from('queue').delete().eq('username', author);
                    await supabase.from('playing_users').delete().eq('username', author);
                    sendBotMessage('userLeft', { user: author });
                } catch (error) {
                    console.error("Error leaving queue:", error);
                    addBotMessage(`Erro ao remover ${author} da fila.`);
                }
            }
        } else if (commands.queueList.enabled && commandText === commands.queueList.command) {
            if (queue.length > 0) {
                const list = queue.slice(0, 5).map((u, i) => `${i + 1}. ${u.user} `).join(', ');
                sendBotMessage('queueList', { list });
            } else {
                sendBotMessage('queueListEmpty');
            }
        } else if (commands.playingList.enabled && commandText === normalizeText(commands.playingList.command)) {
            if (playingUsers.length > 0) {
                const list = playingUsers.map(u => u.user).join(', ');
                sendBotMessage('playingList', { list });
            } else {
                sendBotMessage('playingListEmpty');
            }
        } else {
            const customCommand = customCommands.find(c => {
                const normalizedCmd = normalizeText(c.command);
                return commandText === normalizedCmd || commandText.startsWith(normalizedCmd + ' ');
            });
            if (customCommand) {
                const response = customCommand.response.replace(/{user}/g, author);
                addBotMessage(response, true);
            }
        }


    }, [adminName, queue, playingUsers, isTimerActive, timeoutMinutes, addBotMessage, appSettings, warningSentUsers, handleNextUser, activateTimer, deactivateTimer, sendBotMessage, updateUserTimer, session?.user?.id, blockedChannelIds, blockedUsernames]);

    const handleSendMessageRef = useRef(handleSendMessage);
    useEffect(() => {
        handleSendMessageRef.current = handleSendMessage;
    });

    const stopPolling = useCallback(() => {
        if (!isPolling) return;
        setIsPolling(false);
        setCanAutoConnect(false);
        addBotMessage("Desconectado do chat do YouTube.");
    }, [isPolling, addBotMessage]);

    const fetchAndProcessMessages = useCallback(async () => {
        if (!liveChatId || isFetchingRef.current) return;

        isFetchingRef.current = true;
        const isFirstPoll = nextPageTokenRef.current === null;

        try {
            const response = await supabase.functions.invoke('youtube-chat-fetch', {
                body: { liveChatId, pageToken: nextPageTokenRef.current },
            });

            const { data, error } = response;

            if (error) {
                // ... same error handling logic ...
                let errorMessage = error.message || "Erro desconhecido";
                if (error.context && typeof error.context.json === 'function') {
                    try {
                        const errorBody = await error.context.json();
                        errorMessage = errorBody.error || errorMessage;
                    } catch (e) { }
                }
                throw new Error(errorMessage);
            }

            // Detecta erro se status for 200 mas corpo contiver erro
            if (data && data.error) {
                throw new Error(data.error);
            }

            if (data && data.items) {
                consecutiveErrorsRef.current = 0;

                // ATUALIZA O TOKEN IMEDIATAMENTE antes de processar mensagens lentas
                const oldToken = nextPageTokenRef.current;
                nextPageTokenRef.current = data.nextPageToken;

                if (!isFirstPoll) {
                    for (const item of data.items) {
                        // Verificamos o ID único do YouTube para NUNCA repetir a mesma mensagem
                        if (processedMessageIds.current.has(item.id)) continue;

                        processedMessageIds.current.add(item.id);
                        // Mantemos apenas os últimos 200 IDs para não crescer infinitamente
                        if (processedMessageIds.current.size > 200) {
                            const oldestId = processedMessageIds.current.values().next().value;
                            processedMessageIds.current.delete(oldestId);
                        }

                        const type = item.snippet.type;
                        const author = item.authorDetails.displayName;
                        const text = item.snippet.displayMessage || "";
                        const authorChannelId = item.authorDetails.channelId;
                        

                        // Somente passa para o chatbot as mensagens de texto normais ou superchat (que contém texto)
                        if (type === 'textMessageEvent' || type === 'superChatEvent') {
                            await handleSendMessageRef.current(author, text, authorChannelId);
                        }
                    }
                } else {
                    console.log("Sessão iniciada: Histórico ignorado. Pronto para as próximas mensagens.");
                }
            }
        } catch (error: any) {
            consecutiveErrorsRef.current += 1;
            console.error(`Erro ao buscar mensagens do YouTube(Falha ${consecutiveErrorsRef.current} / 3): `, error);

            // Se atingir 3 erros consecutivos, tenta reconectar silenciosamente antes de parar
            if (consecutiveErrorsRef.current >= 3) {
                const storedChannelId = appSettings.youtubeChannelId || localStorage.getItem('alice_yt_channel_id');
                if (storedChannelId) {
                    console.log("Tentando auto-reconexão silenciosa via Channel ID...");
                    consecutiveErrorsRef.current = 0; // Reset para dar mais uma chance
                    handleFindLiveChat(storedChannelId, true); // Chamar silenciosamente
                } else {
                    addBotMessageRef.current(`Erro persistente ao conectar com o chat: ${error.message}. Desconectando para poupar sua conta.`);
                    stopPolling();
                }
            } else {
                // Erros silenciosos nos logs, mas não para o usuário ainda para não poluir o chat
                console.warn("Houve um erro temporário na busca de mensagens. Tentando novamente em breve...");

                // Tentativa de Auto-Refresh se o erro parecer ser de token (401/403 ou mensagens específicas)
                if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Auth') || error.message.includes('token')) {
                    console.log("Erro de autenticação detectado. Tentando renovar a sessão...");
                    try {
                        const { error: refreshError } = await supabase.auth.refreshSession();
                        if (refreshError) {
                            console.error("Falha ao renovar sessão:", refreshError);
                        } else {
                            console.log("Sessão renovada com sucesso! Tentando reconexão na próxima rodada.");
                            consecutiveErrorsRef.current = 0; // Se renovou, damos mais uma chance
                        }
                    } catch (e) {
                        console.error("Erro ao tentar refreshSession:", e);
                    }
                }
            }
        } finally {
            isFetchingRef.current = false;
        }
    }, [liveChatId, stopPolling]);

    const startPolling = useCallback(() => {
        if (isPolling || !liveChatId) return;
        addBotMessage("Conectado ao chat ao vivo");
        setIsPolling(true);
    }, [isPolling, liveChatId, addBotMessage]);

    const handleFindLiveChat = async (channelIdToUse?: string | any, silent: boolean = false) => {
        // Busca o token válido (sessão, localStorage ou banco)
        const token = await getValidYouTubeToken();
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        // Se channelIdToUse for um evento (no onClick), ignoramos e usamos localStorage/settings
        const cleanChannelId = typeof channelIdToUse === 'string' ? channelIdToUse : null;
        const storedChannelId = cleanChannelId || appSettings.youtubeChannelId || localStorage.getItem('alice_yt_channel_id');

        if (!token && !storedChannelId) {
            const identities = currentSession?.user?.identities?.map(id => id.provider).join(', ') || 'nenhuma';
            console.warn("Token do Google ausente e nenhum Channel ID salvo. Identidades vinculadas:", identities);

            if (!storedChannelId) {
                const hasGoogleIdentity = currentSession?.user?.identities?.some(id => id.provider === 'google');
                if (hasGoogleIdentity && !silent) {
                    addBotMessage("Sessão expirada e canal não identificado. Tente reconectar nas configurações.");
                } else if (!hasGoogleIdentity && !silent) {
                    addBotMessage(`Erro: Nenhuma conta do YouTube vinculada. Identidades: ${identities}.`);
                }
                return;
            }
        }

        setIsFindingChat(true);
        setCanAutoConnect(true);
        if (!silent) {
            addBotMessage(storedChannelId && !token
                ? "Buscando sua live automaticamente via Channel ID..."
                : "Buscando sua transmissão ao vivo ativa...");
        }

        try {
            const response = await supabase.functions.invoke('youtube-find-live-chat', {
                body: {
                    channelId: storedChannelId,
                    youtubeToken: token
                }
            });

            const { data, error } = response;

            if (error) {
                let errorMessage = error.message || "Erro desconhecido";
                if (error.context && typeof error.context.json === 'function') {
                    try {
                        const errorBody = await error.context.json();
                        errorMessage = errorBody.error || errorMessage;
                    } catch (e) { }
                }
                throw new Error(errorMessage);
            }

            if (data.liveChatId) {
                setLiveChatId(data.liveChatId);
                if (data.channelTitle) {
                    setChannelTitle(data.channelTitle);
                }

                // Salvar ID do canal persistentemente nos dois lugares
                if (data.channelId) {
                    localStorage.setItem('alice_yt_channel_id', data.channelId);
                    if (appSettings.youtubeChannelId !== data.channelId) {
                        const updatedSettings = { ...appSettings, youtubeChannelId: data.channelId };
                        handleSettingsSave(updatedSettings);
                    }
                }
                localStorage.setItem('alice_yt_last_chat_id', data.liveChatId);

                if (silent && !isPolling) {
                    addBotMessage("Conexão restabelecida automaticamente.");
                }
            } else {
                if (!silent) addBotMessage(data.error || "Não foi possível encontrar uma transmissão ativa.");
            }
        } catch (error: any) {
            console.error('Erro ao buscar chat ao vivo:', error);
            const detailedError = error.message || "Erro de conexão com o servidor";
            if (!silent) addBotMessage(`Erro ao conectar: ${detailedError}. Verifique sua internet ou se o serviço está instável.`);
        } finally {
            setIsFindingChat(false);
        }
    };

    // Verificar se Google está conectado (sempre true agora, pois login é obrigatório com Google)
    const googleConnected = true;
    const googleEmail = session?.user?.user_metadata?.email || session?.user?.email || null;

    const hasAutoSearchedRef = useRef(false);
    useEffect(() => {
        const initSession = async () => {
            // Se ainda está carregando as configurações do banco, esperamos
            if (isLoadingSettings) return;

            const { data: { session: currentSession } } = await supabase.auth.getSession();
            const storedChannelId = appSettings.youtubeChannelId || localStorage.getItem('alice_yt_channel_id');

            // Salvar no localStorage sempre que tivermos provider_token novo
            if (currentSession?.provider_token) {
                localStorage.setItem('alice_yt_provider_token', currentSession.provider_token);
                const expiresIn = (currentSession as any).expires_in || 3600;
                localStorage.setItem('alice_yt_token_expires_at', String(Date.now() + expiresIn * 1000));
            }

            const refreshToken = (currentSession as any)?.provider_refresh_token;

            // Sincronizar tokens: SEMPRE que provider_token estiver disponível, sincronizamos com o banco
            if (currentSession?.provider_token) {
                console.log("Sincronizando tokens do YouTube com o banco de dados...");
                try {
                    await supabase.functions.invoke('youtube-token-sync', {
                        body: {
                            access_token: currentSession.provider_token,
                            refresh_token: refreshToken || undefined,
                            expires_in: (currentSession as any).expires_in || 3600,
                            channelId: storedChannelId
                        }
                    });
                } catch (syncError) {
                    console.error("Erro ao sincronizar tokens:", syncError);
                }
            }

            const hasActiveToken = currentSession?.provider_token || localStorage.getItem('alice_yt_provider_token');

            if (!liveChatId && !isFindingChat && !hasAutoSearchedRef.current) {
                if (hasActiveToken) {
                    console.log("Iniciando auto-busca de live chat via Token...");
                    hasAutoSearchedRef.current = true;
                    handleFindLiveChat(undefined, true); // SILENT por padrão no início
                } else if (storedChannelId) {
                    console.log("Iniciando auto-busca de live chat via Channel ID salvo...");
                    hasAutoSearchedRef.current = true;
                    handleFindLiveChat(storedChannelId, true); // Silent auto-reconnect
                }
            }
        };

        initSession();
    }, [liveChatId, isFindingChat, appSettings.youtubeChannelId, isLoadingSettings]);

    // Auto-sync: Verifica a cada 15 minutos se há live ativa e conecta automaticamente
    // Otimização: Só executa se estiver logado com o Google para economizar cota (API barata de 1 unidade)
    useEffect(() => {
        // Só ativa auto-sync se:
        // 1. Não está carregando configurações
        // 2. Não está já conectado (polling)
        // 3. Não está buscando chat no momento
        // 4. Está conectado com o Google (para evitar a busca cara de 100 unidades via ID do canal)
        // 5. A busca automática está ativada nas configurações
        if (isLoadingSettings || isPolling || isFindingChat || !googleConnected || !appSettings.autoSyncYoutube) {
            if (!googleConnected && !isLoadingSettings && appSettings.autoSyncYoutube) {
                console.log('[Auto-Sync] Pulado: Usuário não autenticado com Google (economizando cota).');
            }
            return;
        }

        console.log('[Auto-Sync] Iniciando verificação automática de live (Modo Otimizado)...');

        // Primeira verificação imediata (após 10 segundos do login)
        const initialTimeout = setTimeout(() => {
            if (!isPolling && !isFindingChat && googleConnected) {
                console.log('[Auto-Sync] Verificação inicial de live...');
                handleFindLiveChat(undefined, true); // Silent
            }
        }, 10000);

        // Verificações periódicas a cada 15 minutos (900.000 ms)
        const autoSyncInterval = setInterval(() => {
            if (!isPolling && !isFindingChat && !liveChatId && googleConnected) {
                console.log('[Auto-Sync] Verificando se há live ativa...');
                handleFindLiveChat(undefined, true); // Silent
            }
        }, 900000); // 15 minutos

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(autoSyncInterval);
        };
    }, [isLoadingSettings, isPolling, isFindingChat, handleFindLiveChat, googleConnected, liveChatId, appSettings.autoSyncYoutube]);

    // Auto-conectar quando encontrar o liveChatId
    useEffect(() => {
        if (liveChatId && !isPolling && canAutoConnect) {
            startPolling();
        }
    }, [liveChatId, isPolling, canAutoConnect, startPolling]);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const poll = async () => {
            if (isPolling) {
                await fetchAndProcessMessages();
                // Agenda a próxima busca apenas após terminar a atual
                timeoutId = setTimeout(poll, 9000);
            }
        };

        if (isPolling) {
            nextPageTokenRef.current = null;
            consecutiveErrorsRef.current = 0;
            processedMessageIds.current.clear(); // Limpa cache de IDs ao iniciar nova poll
            poll(); // Inicia o ciclo
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isPolling, fetchAndProcessMessages]);

    // Persistir mudanças no timeoutMinutes
    useEffect(() => {
        if (!isLoadingSettings) {
            saveQueueState({ isTimerActive, timeoutMinutes });
        }
    }, [timeoutMinutes, isTimerActive, saveQueueState, isLoadingSettings]);

    const handleAddUserManually = useCallback(async (username: string, nickname: string) => {
        const isUserInQueue = queue.some(u => u.user === username);
        const isUserPlaying = playingUsers.some(u => u.user === username);

        if (isUserInQueue || isUserPlaying) {
            addBotMessage(`@${username} já está na fila ou jogando.`);
            return;
        }

        const newUser: QueueUser = { user: username, nickname: nickname || undefined };

        setQueue(prev => [...prev, newUser]);
        setUserTimers(prev => ({ ...prev, [username]: Date.now() }));

        try {
            await supabase.from('queue').insert({ username, nickname: nickname || null });
            addBotMessage(`@${username} foi adicionado à fila manualmente.`);
        } catch (error) {
            console.error("Error adding user manually:", error);
            addBotMessage(`Erro ao adicionar ${username} à fila.`);
            setQueue(prev => prev.filter(u => u.user !== username));
        }
    }, [queue, playingUsers, addBotMessage]);

    const handleMoveToTop = useCallback(async (username: string) => {
        const userIndex = queue.findIndex(u => u.user === username);
        if (userIndex <= 0) return;

        const userToMove = queue[userIndex];
        const newQueue = [userToMove, ...queue.slice(0, userIndex), ...queue.slice(userIndex + 1)];
        setQueue(newQueue);

        try {
            const { data: topUser, error: topUserError } = await supabase
                .from('queue')
                .select('joined_at')
                .order('joined_at', { ascending: true })
                .limit(1)
                .single();

            if (topUserError) throw topUserError;

            const newTimestamp = new Date(new Date(topUser.joined_at).getTime() - 1000).toISOString();

            const { error: updateError } = await supabase
                .from('queue')
                .update({ joined_at: newTimestamp })
                .eq('username', username);

            if (updateError) throw updateError;

            addBotMessage(`@${username} foi movido para o topo da fila.`);
        } catch (error) {
            console.error("Error moving user to top:", error);
            addBotMessage(`Erro ao mover ${username} para o topo.`);
            // Reverter a mudança no estado local em caso de erro
            setQueue(queue);
        }
    }, [queue, addBotMessage]);

    // Refs for interval to prevent stale closures
    const queueRef = useRef(queue);
    const userTimersRef = useRef(userTimers);
    const warningSentUsersRef = useRef(warningSentUsers);
    const sendBotMessageRef = useRef(sendBotMessage);
    const handleRemoveUsersFromQueueRef = useRef(handleRemoveUsersFromQueue);
    const timeoutMinutesRef = useRef(timeoutMinutes);

    useEffect(() => {
        queueRef.current = queue;
        userTimersRef.current = userTimers;
        warningSentUsersRef.current = warningSentUsers;
        sendBotMessageRef.current = sendBotMessage;
        handleRemoveUsersFromQueueRef.current = handleRemoveUsersFromQueue;
        timeoutMinutesRef.current = timeoutMinutes;
    });

    useEffect(() => {
        if (!isTimerActive) return;

        const intervalId = setInterval(() => {
            const now = Date.now();
            const timeoutMs = timeoutMinutesRef.current * 60 * 1000;
            const warningMs = 30 * 1000;
            const usersToRemove: string[] = [];
            const usersToWarn: string[] = [];

            queueRef.current.forEach(queueUser => {
                const lastActivityTime = userTimersRef.current[queueUser.user];
                if (!lastActivityTime) return;

                const timeLeftMs = (lastActivityTime + timeoutMs) - now;

                if (timeLeftMs <= 0) {
                    usersToRemove.push(queueUser.user);
                } else if (timeLeftMs <= warningMs && !warningSentUsersRef.current.has(queueUser.user)) {
                    usersToWarn.push(queueUser.user);
                }
            });

            if (usersToWarn.length > 0) {
                usersToWarn.forEach(user => {
                    sendBotMessageRef.current('thirtySecondWarning', { user });
                });
                setWarningSentUsers(prev => new Set([...prev, ...usersToWarn]));
            }

            if (usersToRemove.length > 0) {
                handleRemoveUsersFromQueueRef.current(usersToRemove, 'inactivity');
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, [isTimerActive]);



    const handleReconnectGoogle = async () => {
        try {
            console.log("Iniciando fluxo de reconexão Google...");
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    scopes: 'https://www.googleapis.com/auth/youtube.force-ssl',
                    redirectTo: window.location.origin,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });
            if (error) throw error;
        } catch (error: any) {
            console.error("Erro ao reconectar Google:", error);
            addBotMessage(`Erro ao iniciar reconexão: ${error.message}`);
        }
    };



    return (
        <div className="flex justify-center min-h-screen" style={{ backgroundColor: '#080d18' }}>
            <div className="flex w-full">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onSignOut={handleSignOut}
                />

                <main className="flex-grow flex flex-col h-screen overflow-hidden" style={{ backgroundColor: '#080d18' }}>
                    {/* Header */}
                    <header
                        className="h-16 flex items-center justify-between px-6 sticky top-0 z-40 flex-shrink-0"
                        style={{ backgroundColor: '#0a0e1a', borderBottom: '1px solid #131d35' }}
                    >
                        {/* Left: page title */}
                        <div>
                            <h2 className="text-base font-bold text-white tracking-tight">
                                {activeTab === 'dashboard' ? 'Painel de Controle' :
                                    activeTab === 'settings' ? 'Configurações' :
                                        activeTab === 'commands' ? 'Comandos do Bot' :
                                            activeTab === 'youtube' ? 'Conexão YouTube' :
                                                activeTab === 'timer' ? 'Timer de Inatividade' :
                                                    activeTab === 'likes' ? 'Contador de Likes' :
                                                        activeTab === 'blocked' ? 'Usuários Bloqueados' : 'Alice Bot'}
                            </h2>
                            <p className="text-[11px] font-medium" style={{ color: '#3a5a7a' }}>
                                {activeTab === 'dashboard' ? 'Gerencie sua fila e interação com o bot.' :
                                    activeTab === 'settings' ? 'Personalize o comportamento da Alice.' :
                                        activeTab === 'commands' ? 'Configure os comandos do chat.' :
                                            activeTab === 'youtube' ? 'Gerencie a conexão com o chat da live.' :
                                                activeTab === 'timer' ? 'Configuração de inatividade automática.' :
                                                    activeTab === 'likes' ? 'Acompanhe os likes da sua live.' :
                                                        activeTab === 'blocked' ? 'Gerencie usuários bloqueados.' :
                                                            'Painel administrativo.'}
                            </p>
                        </div>

                        {/* Right: YouTube status + user */}
                        <div className="flex items-center gap-4">

                            {/* YouTube badge */}
                            <div className="hidden md:flex items-center gap-3">
                                {googleConnected ? (
                                    <>
                                        {/* Status pill */}
                                        <div
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                                            style={isPolling
                                                ? { backgroundColor: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)' }
                                                : { backgroundColor: '#0d1526', border: '1px solid #1a2540' }
                                            }
                                        >
                                            <YoutubeIcon className="w-5 h-5 flex-shrink-0" />
                                            <span className="text-xs font-semibold" style={{ color: '#c8d8e8' }}>YouTube</span>
                                            {isPolling ? (
                                                <span className="flex items-center gap-1.5">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#00e676' }}></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: '#00e676' }}></span>
                                                    </span>
                                                    <span className="text-xs font-bold" style={{ color: '#00e676' }}>Ao Vivo</span>
                                                </span>
                                            ) : (
                                                <span className="text-xs font-medium" style={{ color: '#3a5a7a' }}>Conectado</span>
                                            )}
                                        </div>

                                        {/* Action button */}
                                        {isPolling ? (
                                            <button
                                                onClick={stopPolling}
                                                title="Parar sincronização"
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all group"
                                                style={{ backgroundColor: 'rgba(0,230,118,0.06)', color: '#00e676', border: '1px solid rgba(0,230,118,0.15)' }}
                                                onMouseOver={e => {
                                                    e.currentTarget.style.backgroundColor = 'rgba(255,77,77,0.1)';
                                                    e.currentTarget.style.color = '#ff4d4d';
                                                    e.currentTarget.style.borderColor = 'rgba(255,77,77,0.2)';
                                                }}
                                                onMouseOut={e => {
                                                    e.currentTarget.style.backgroundColor = 'rgba(0,230,118,0.06)';
                                                    e.currentTarget.style.color = '#00e676';
                                                    e.currentTarget.style.borderColor = 'rgba(0,230,118,0.15)';
                                                }}
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} />
                                                Parar
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleFindLiveChat}
                                                disabled={isFindingChat}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
                                                style={{ backgroundColor: '#0070f3', color: '#ffffff' }}
                                                onMouseOver={e => !isFindingChat && (e.currentTarget.style.backgroundColor = '#0060d3')}
                                                onMouseOut={e => (e.currentTarget.style.backgroundColor = '#0070f3')}
                                            >
                                                <RefreshCwIcon className={`w-3.5 h-3.5 ${isFindingChat ? 'animate-spin' : ''}`} />
                                                {isFindingChat ? 'Buscando...' : 'Sincronizar'}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setActiveTab('youtube')}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                        style={{ backgroundColor: '#0d1526', color: '#3a5a7a', border: '1px solid #1a2540' }}
                                        onMouseOver={e => { e.currentTarget.style.color = '#ff4d4d'; e.currentTarget.style.borderColor = 'rgba(255,77,77,0.3)'; }}
                                        onMouseOut={e => { e.currentTarget.style.color = '#3a5a7a'; e.currentTarget.style.borderColor = '#1a2540'; }}
                                    >
                                        <YoutubeIcon className="w-4 h-4" />
                                        Conectar YouTube
                                    </button>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="hidden md:block h-6 w-px" style={{ backgroundColor: '#131d35' }} />

                            {/* User info */}
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex flex-col items-end">
                                    <span className="text-xs font-semibold text-white leading-tight">{currentUser}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3a5a7a' }}>Admin</span>
                                </div>
                                {/* Avatar circle with gradient */}
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #0070f3 0%, #00c8ff 100%)', boxShadow: '0 0 12px rgba(0,200,255,0.25)' }}
                                >
                                    {currentUser.charAt(0).toUpperCase() || 'A'}
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className={`w-full flex-grow flex-1 min-h-0 flex flex-col ${activeTab === 'dashboard' ? 'p-3 md:p-4 overflow-hidden' : 'p-4 md:p-6 overflow-y-auto custom-scrollbar'}`} style={{ backgroundColor: '#080d18' }}>
                        {activeTab === 'dashboard' && (
                            <div className="flex flex-col flex-grow flex-1 min-h-0 h-full">

                            {/* ── Main Grid ── */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5 flex-grow flex-1 min-h-0 h-full">
                                {/* Column 1: Queue */}
                                <div className="xl:col-span-1 h-full min-h-0 overflow-hidden flex flex-col">
                                    <QueueDisplay
                                        queue={queue}
                                        userTimers={userTimers}
                                        isTimerActive={isTimerActive}
                                        timeoutMinutes={timeoutMinutes}
                                        adminName={adminName}
                                        onMoveToPlaying={handleMoveToPlaying}
                                        onRemoveUser={(user) => handleRemoveUsersFromQueue([user], 'admin')}
                                        onMoveToTop={handleMoveToTop}
                                        onNext={handleNextUser}
                                        onReset={() => handleSendMessage(adminName, appSettings.commands.reset.command)}
                                        onRefresh={() => refreshData()}
                                    />
                                </div>

                                {/* Column 2: Playing */}
                                <div className="xl:col-span-1 h-full min-h-0 overflow-hidden flex flex-col">
                                    <PlayingDisplay
                                        playingUsers={playingUsers}
                                        onRemoveUser={handleRemovePlayingUser}
                                        onMoveBackToQueue={handleMoveBackToQueue}
                                        isQueueOpen={appSettings.isQueueOpen}
                                        onToggleQueue={toggleQueueStatus}
                                    />
                                </div>

                                {/* Column 3: Chat */}
                                <div className="xl:col-span-1 h-full min-h-0 overflow-hidden flex flex-col">
                                    <div
                                        className="flex flex-col h-full min-h-0 overflow-hidden rounded-2xl transition-all duration-300"
                                        style={{ backgroundColor: '#0d1526', border: '1px solid #1a2540' }}
                                    >
                                        <div
                                            className="px-4 py-3 flex items-center justify-between cursor-pointer flex-shrink-0 select-none transition-colors"
                                            style={{ borderBottom: '1px solid #1a2540' }}
                                            onClick={() => setIsChatVisible(!isChatVisible)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <MessageSquareIcon className="w-4 h-4 flex-shrink-0" style={{ color: '#00c8ff' }} />
                                                <h2 className="text-sm font-bold text-white">Chat Alice</h2>
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            </div>
                                            <button className="p-1 rounded-lg transition-colors" style={{ color: '#3a5a7a' }}>
                                                {isChatVisible ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {isChatVisible && (
                                            <div className="flex-grow flex-1 min-h-0 overflow-hidden flex flex-col" style={{ backgroundColor: '#080d18' }}>
                                                <ChatWindow
                                                    messages={messages}
                                                    currentUser={currentUser}
                                                    onBlockUser={handleQuickBlock}
                                                />
                                                <MessageInput
                                                    onSendMessage={(text) => handleSendMessage(adminName, text)}
                                                    commands={appSettings.commands}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            </div>
                        )}


                        {activeTab === 'settings' && (
                            <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
                                <div className="mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 p-8 text-white relative">
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-bold mb-2">Configurações Gerais</h3>
                                        <p className="text-cyan-100 opacity-90">Personalize o nome do bot, comandos e mensagens automáticas.</p>
                                    </div>
                                    <BotIcon className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-10 rotate-12" />
                                </div>

                                <div className="space-y-12">
                                    <section>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-cyan-500/10 rounded-lg">
                                                <BotIcon className="w-6 h-6 text-cyan-500" />
                                            </div>
                                            <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-widest text-sm">Bot & Comandos</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 dark:text-[#8bcbd5] mb-2">Nome do Bot no Chat</label>
                                                <input
                                                    type="text"
                                                    value={appSettings.botName}
                                                    onChange={(e) => handleSettingsSave({ ...appSettings, botName: e.target.value })}
                                                    className="w-full bg-gray-50 dark:bg-[#0F172A] dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    <div className="p-6 bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-500/20 rounded-2xl flex items-start gap-4">
                                        <div className="p-2 bg-white dark:bg-[#1E293B] rounded-lg shadow-sm">
                                            <SettingsIcon className="w-6 h-6 text-cyan-500" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-cyan-900 dark:text-cyan-100 mb-1">Dica de Configuração</h5>
                                            <p className="text-sm text-cyan-800 dark:text-cyan-200 opacity-80">
                                                As alterações feitas aqui são salvas automaticamente na nuvem vinculada à sua conta.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'commands' && (
                            <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-cyan-500/10 rounded-xl">
                                        <MessageSquareIcon className="w-8 h-8 text-cyan-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">Personalização de Comandos</h3>
                                        <p className="text-gray-500 dark:text-gray-400">Configure o que os usuários digitam no chat.</p>
                                    </div>
                                </div>
                                <SettingsModal
                                    isOpen={true}
                                    onClose={() => setActiveTab('dashboard')}
                                    settings={appSettings}
                                    onSave={handleSettingsSave}
                                    onReset={() => handleSettingsSave(defaultSettings)}
                                    isInline={true}
                                />
                            </div>
                        )}

                        {activeTab === 'youtube' && (
                            <YouTubeSettings
                                googleConnected={googleConnected}
                                googleEmail={googleEmail}
                                onFindLiveChat={handleFindLiveChat}
                                isFindingChat={isFindingChat}
                                isPolling={isPolling}
                                stopPolling={stopPolling}
                                autoSyncEnabled={appSettings.autoSyncYoutube ?? true}
                                onToggleAutoSync={(enabled) => handleSettingsSave({ ...appSettings, autoSyncYoutube: enabled })}
                                onReconnect={handleReconnectGoogle}
                            />
                        )}

                        {activeTab === 'timer' && (
                            <TimerSettings
                                isTimerActive={isTimerActive}
                                onToggleTimer={handleToggleTimer}
                                timeoutMinutes={timeoutMinutes}
                                setTimeoutMinutes={setTimeoutMinutes}
                            />
                        )}



                        {activeTab === 'likes' && <LikesTab />}
                        {activeTab === 'blocked' && <BlockedUsersTab />}

                    </div>

                    <footer className="py-6 border-t border-gray-200 dark:border-gray-800 text-center bg-white dark:bg-[#131b2e] flex-shrink-0">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            © 2025 Alice Bot • Desenvolvido com ❤️ para streamers
                        </p>
                    </footer>
                </main>

                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    settings={appSettings}
                    onSave={handleSettingsSave}
                    onReset={() => handleSettingsSave(defaultSettings)}
                />
            </div >
        </div >
    );
};

export default HomePage;