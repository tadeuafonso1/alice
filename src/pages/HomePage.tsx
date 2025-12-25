import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChatWindow } from '@/components/ChatWindow';
import { MessageInput } from '@/components/MessageInput';
import { QueueDisplay } from '@/components/QueueDisplay';
import { PlayingDisplay } from '@/components/PlayingDisplay';
import { SettingsModal } from '@/components/SettingsModal';
import { YouTubeSettings } from '@/components/YouTubeSettings';
import { TimerSettings } from '@/components/TimerSettings';
import type { Message, AppSettings, QueueUser, MessageSettings, CommandSettings } from '@/types';
import { BotIcon, SettingsIcon, SunIcon, MoonIcon, LogOutIcon, ChevronDownIcon, ChevronUpIcon, MessageSquareIcon, LayoutIcon, ChevronLeftIcon, ChevronRightIcon, UsersIcon, SkipForwardIcon, RefreshCwIcon, YoutubeIcon } from '@/components/Icons';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/src/contexts/SessionContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Sidebar } from '@/components/Sidebar';

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
    },
    customCommands: [],
    youtubeChannelId: '',
};

export const HomePage: React.FC = () => {
    const { session } = useSession();
    const { theme, toggleTheme } = useTheme();
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

    // Estado para a conexão com o YouTube
    const [liveChatId, setLiveChatId] = useState<string>('');
    const [channelTitle, setChannelTitle] = useState<string>('');
    const [canAutoConnect, setCanAutoConnect] = useState(true);
    const [settingsId, setSettingsId] = useState<number | null>(null);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [isPolling, setIsPolling] = useState(false);
    const [isFindingChat, setIsFindingChat] = useState(false);
    const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
    const nextPageTokenRef = useRef<string | null>(null);
    const consecutiveErrorsRef = useRef<number>(0);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const processedMessageIds = useRef<Set<string>>(new Set());
    const isFetchingRef = useRef(false);

    // Layout State
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        if (channelTitle) {
            setCurrentUser(channelTitle);
            setAdminName(channelTitle);
        } else if (session?.user?.user_metadata?.full_name) {
            setCurrentUser(session.user.user_metadata.full_name);
            setAdminName(session.user.user_metadata.full_name);
        } else if (session?.user?.email) {
            // Máscara para o e-mail: pega apenas a parte antes do @ para não vazar o e-mail completo
            const maskedEmail = session.user.email.split('@')[0];
            setCurrentUser(maskedEmail);
            setAdminName(maskedEmail);
        }
    }, [session, channelTitle]);

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
        }
    };

    const sendToYouTubeChat = useCallback(async (text: string) => {
        if (!liveChatId) return;

        // Busca a sessão mais recente para garantir o token
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const token = currentSession?.provider_token;

        if (!token) {
            console.warn("Cannot send to YouTube: Missing provider_token");
            return;
        }

        try {
            const { data, error } = await supabase.functions.invoke('youtube-chat-send', {
                body: { liveChatId, messageText: text },
                headers: {
                    'x-youtube-token': token,
                    'Authorization': `Bearer ${currentSession?.access_token || ''}`
                },
            });

            if (data && data.success === false) {
                const errorText = `[Erro YouTube] ${data.error}`;
                setMessages(prev => [...prev, { author: appSettings.botName, text: errorText, type: 'bot' }]);
                return;
            }

            if (error) {
                console.error('Error sending message to YouTube:', error);
                const errorText = `[Erro YouTube] Falha na rede/servidor: ${error.message}`;
                setMessages(prev => [...prev, { author: appSettings.botName, text: errorText, type: 'bot' }]);
            }
        } catch (error: any) {
            console.error('Error sending message to YouTube:', error);
            const errorText = `[Erro YouTube] Exceção: ${error.message}`;
            setMessages(prev => [...prev, { author: appSettings.botName, text: errorText, type: 'bot' }]);
        }
    }, [liveChatId, session?.provider_token, appSettings.botName]);

    const addBotMessage = useCallback((text: string, sendToYouTube: boolean = false) => {
        const botMessage: Message = { author: appSettings.botName, text, type: 'bot' };
        setMessages(prev => [...prev, botMessage]);
        if (sendToYouTube) {
            sendToYouTubeChat(text);
        }
    }, [appSettings.botName, sendToYouTubeChat]);

    const addBotMessageRef = useRef(addBotMessage);
    useEffect(() => {
        addBotMessageRef.current = addBotMessage;
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
                    text = text.replace(new RegExp(`{${key}}`, 'g'), strValue);
                });
            }
            addBotMessage(text, true);
        }
    }, [appSettings.messages, addBotMessage]);

    useEffect(() => {
        const fetchData = async () => {
            if (adminName === 'Admin') return;
            try {
                // Tenta buscar as configurações. RLS deve garantir que buscamos apenas a nossa.
                const { data: settingsData, error: settingsError } = await supabase
                    .from('settings')
                    .select('id, settings_data')
                    .maybeSingle(); // maybeSingle não erro se não houver linhas

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
                    setAppSettings(mergedSettings);
                }

                // Busca fila e jogadores...
                const { data: queueData, error: queueError } = await supabase
                    .from('queue')
                    .select('username, nickname, joined_at')
                    .order('joined_at', { ascending: true });

                if (queueError) throw queueError;
                setQueue(queueData.map(q => ({ user: q.username, nickname: q.nickname })));

                const { data: playingData, error: playingError } = await supabase
                    .from('playing_users')
                    .select('username, nickname');

                if (playingError) throw playingError;
                setPlayingUsers(playingData.map(p => ({ user: p.username, nickname: p.nickname })));

                const initialTimers = queueData.reduce((acc, q) => {
                    acc[q.username] = new Date(q.joined_at).getTime();
                    return acc;
                }, {} as Record<string, number>);
                setUserTimers(initialTimers);

            } catch (error: any) {
                console.error("Error fetching initial data:", error);
                // Não alertar erro se for apenas falta de dados iniciais
                if (error.code !== 'PGRST116') {
                    addBotMessageRef.current(`Erro ao carregar dados: ${error.message}`);
                }
            } finally {
                setIsLoadingSettings(false);
            }
        };

        fetchData();
    }, [adminName]);

    const handleSettingsSave = async (newSettings: AppSettings) => {
        console.log("Tentando salvar configurações:", newSettings, "ID atual:", settingsId);
        setAppSettings(newSettings);
        try {
            const payload: any = {
                settings_data: newSettings
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
            addBotMessage(`Erro ao salvar configurações: ${msg}`);
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
            await supabase.from('playing_users').insert({ username: userObject.user, nickname: userObject.nickname });
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

    const handleRemovePlayingUser = useCallback(async (userToRemove: string) => {
        setPlayingUsers(prev => prev.filter(u => u.user !== userToRemove));
        try {
            await supabase.from('playing_users').delete().eq('username', userToRemove);
        } catch (error) {
            console.error("Error removing playing user:", error);
            addBotMessage(`Erro ao remover ${userToRemove}.`);
        }
    }, [addBotMessage]);

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

    const handleSendMessage = useCallback(async (author: string, text: string) => {
        if (!text.trim()) return;

        // Normalização do autor: remove o @ inicial caso venha da API do YouTube
        // para evitar mensagens com @@ (ex: @@usuario)
        if (author.startsWith('@')) {
            author = author.substring(1);
        }

        const userMessage: Message = { author, text, type: 'user' };
        setMessages(prev => [...prev, userMessage]);

        const normalizeText = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const commandText = normalizeText(text.trim());
        const { commands, customCommands } = appSettings;

        const now = Date.now();
        if (queue.some(u => u.user === author)) {
            setUserTimers(prev => ({ ...prev, [author]: now }));
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

        if (commands.join.enabled && commandText.startsWith(commands.join.command)) {
            const isUserInQueue = queue.some(u => u.user === author);
            const isUserPlaying = playingUsers.some(u => u.user === author);

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
                    addBotMessage(`@${author}, você precisa fornecer um apelido para entrar na fila. Ex: ${commands.join.command} SeuApelido`, true);
                    return;
                }

                const newUser = { user: author, nickname };

                setQueue(prev => [...prev, newUser]);
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
            const queueIndex = queue.findIndex(u => u.user === author);
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
                    addBotMessage(`@${author}, você precisa fornecer um apelido. Ex: ${commands.nick.command} MeuApelido`, true);
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
                const list = queue.slice(0, 5).map((u, i) => `${i + 1}. ${u.user}`).join(', ');
                sendBotMessage('queueList', { list });
            } else {
                sendBotMessage('queueListEmpty');
            }
        } else if (commands.playingList.enabled && commandText === commands.playingList.command) {
            if (playingUsers.length > 0) {
                const list = playingUsers.map(u => u.user).join(', ');
                sendBotMessage('playingList', { list });
            } else {
                sendBotMessage('playingListEmpty');
            }
        } else {
            const customCommand = customCommands.find(c => normalizeText(c.command) === commandText);
            if (customCommand) {
                const response = customCommand.response.replace(/{user}/g, author);
                addBotMessage(response, true);
            }
        }
    }, [adminName, queue, playingUsers, isTimerActive, timeoutMinutes, addBotMessage, appSettings, warningSentUsers, handleNextUser, activateTimer, deactivateTimer, sendBotMessage]);

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

                        const author = item.authorDetails.displayName;
                        const text = item.snippet.displayMessage;
                        await handleSendMessageRef.current(author, text);
                    }
                } else {
                    console.log("Sessão iniciada: Histórico ignorado. Pronto para as próximas mensagens.");
                }
            }
        } catch (error: any) {
            consecutiveErrorsRef.current += 1;
            console.error(`Erro ao buscar mensagens do YouTube (Falha ${consecutiveErrorsRef.current}/3):`, error);

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
        // Busca a sessão mais recente diretamente do Supabase para evitar closures estáticas
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        // Se channelIdToUse for um evento (no onClick), ignoramos e usamos localStorage/settings
        const cleanChannelId = typeof channelIdToUse === 'string' ? channelIdToUse : null;
        const storedChannelId = cleanChannelId || appSettings.youtubeChannelId || localStorage.getItem('alice_yt_channel_id');

        if (!currentSession?.provider_token && !storedChannelId) {
            const identities = currentSession?.user?.identities?.map(id => id.provider).join(', ') || 'nenhuma';
            console.warn("Token do Google ausente e nenhum Channel ID salvo. Identidades vinculadas:", identities);

            const hasGoogleIdentity = currentSession?.user?.identities?.some(id => id.provider === 'google');

            if (hasGoogleIdentity && !silent) {
                addBotMessage("A sessão com o YouTube expirou. Por favor, clique no botão 'Reconectar YouTube' na aba de configurações ou no ícone do cabeçalho para renovar o acesso.");
            } else if (!hasGoogleIdentity && !silent) {
                addBotMessage(`Erro: Nenhuma conta do YouTube vinculada. Identidades: ${identities}.`);
            }
            return;
        }

        setIsFindingChat(true);
        setCanAutoConnect(true);
        if (!silent) {
            addBotMessage(storedChannelId && !currentSession?.provider_token
                ? "Buscando sua live automaticamente via Channel ID..."
                : "Buscando sua transmissão ao vivo ativa...");
        }

        try {
            const invokeHeaders: any = {
                'Authorization': `Bearer ${currentSession?.access_token || ''}`
            };
            if (currentSession?.provider_token) {
                invokeHeaders['x-youtube-token'] = currentSession.provider_token;
            }

            const response = await supabase.functions.invoke('youtube-find-live-chat', {
                headers: invokeHeaders,
                body: { channelId: storedChannelId }
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
            if (!silent) addBotMessage(`Erro: ${error.message || "Ocorreu um erro ao buscar sua live."}`);
        } finally {
            setIsFindingChat(false);
        }
    };

    // Função para conectar conta Google
    const handleConnectGoogle = async () => {
        setIsConnectingGoogle(true);
        try {
            const { error } = await supabase.auth.linkIdentity({
                provider: 'google',
                options: {
                    scopes: 'https://www.googleapis.com/auth/youtube.force-ssl',
                    redirectTo: window.location.origin,
                    queryParams: {
                        prompt: 'consent',
                        access_type: 'offline'
                    }
                }
            });
            if (error) throw error;
        } catch (error: any) {
            console.error('Erro ao conectar Google:', error);
            const msg = error.message || JSON.stringify(error) || 'Erro desconhecido';
            addBotMessage(`Erro ao conectar conta Google: ${msg}. Verifique se você já não tem outra conta vinculada.`);
            setIsConnectingGoogle(false);
        }
    };
    // Função para desvincular conta Google - Atualizado em 2025-12-23
    const handleDisconnectGoogle = async () => {
        const googleIdentity = session?.user?.identities?.find(id => id.provider === 'google');

        if (!googleIdentity) {
            addBotMessage("Nenhuma conta Google vinculada para desvincular.");
            return;
        }

        try {
            const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
            if (error) throw error;

            addBotMessage("Conta Google desvinculada com sucesso!");

            // Se o usuário logou diretamente com o Google, a sessão primária foi removida.
            // É necessário sair e logar novamente por outro método.
            const isGoogleLogin = session?.user?.app_metadata?.provider === 'google' && session?.user?.identities?.length === 1;

            if (isGoogleLogin) {
                await supabase.auth.signOut();
                window.location.reload();
            } else {
                // Se logado por outro método (ex: e-mail), apenas refresca a sessão para atualizar os dados do usuário.
                await supabase.auth.refreshSession();
            }
        } catch (error: any) {
            console.error('Erro ao desvincular Google:', error);
            const msg = error.message || "Erro desconhecido";
            addBotMessage(`Erro ao desvincular: ${msg}`);

            // Fallback: se falhar o unlink mas for um login Google, tenta pelo menos deslogar
            const isGoogleLogin = session?.user?.app_metadata?.provider === 'google';
            if (isGoogleLogin) {
                await supabase.auth.signOut();
                window.location.reload();
            }
        }
    };

    // Função para reconectar conta Google (Refresh de Token manual)
    const handleReconnectGoogle = async () => {
        setIsConnectingGoogle(true);
        const googleIdentity = session?.user?.identities?.find(id => id.provider === 'google');

        if (googleIdentity) {
            try {
                // 1. Tenta desvincular
                await supabase.auth.unlinkIdentity(googleIdentity);
            } catch (err) {
                console.warn("Erro ao desvincular antes de reconectar (pode já estar desvinculado):", err);
            }
        }

        // 2. Vincula novamente
        try {
            const { error } = await supabase.auth.linkIdentity({
                provider: 'google',
                options: {
                    scopes: 'https://www.googleapis.com/auth/youtube.force-ssl',
                    redirectTo: window.location.origin,
                    queryParams: {
                        prompt: 'consent', // Força o consentimento para garantir refresh token
                        access_type: 'offline'
                    }
                }
            });
            if (error) throw error;
        } catch (error: any) {
            console.error('Erro ao reconectar Google:', error);
            const msg = error.message || "Erro desconhecido";
            addBotMessage(`Erro ao renovar conexão: ${msg}`);
            setIsConnectingGoogle(false);
        }
    };

    // Verificar se Google está conectado
    const googleIdentity = session?.user?.identities?.find(id => id.provider === 'google');
    const googleConnected = !!googleIdentity;
    const googleEmail = googleIdentity?.identity_data?.email || session?.user?.user_metadata?.email || null;

    const hasAutoSearchedRef = useRef(false);
    useEffect(() => {
        const initSession = async () => {
            // Se ainda está carregando as configurações do banco, esperamos
            if (isLoadingSettings) return;

            if (window.location.hash || window.location.search.includes('code=')) {
                console.log("Detectado redirect de autenticação, atualizando sessão...");
                await supabase.auth.refreshSession();
            }

            const { data: { session: currentSession } } = await supabase.auth.getSession();
            const storedChannelId = appSettings.youtubeChannelId || localStorage.getItem('alice_yt_channel_id');

            // Sincronizar tokens se acabamos de conectar/reconectar
            if (currentSession?.provider_token) {
                console.log("Sincronizando tokens do YouTube com o banco de dados...");
                try {
                    await supabase.functions.invoke('youtube-token-sync', {
                        body: {
                            access_token: currentSession.provider_token,
                            refresh_token: (currentSession as any).provider_refresh_token, // Pode estar aqui após redirect
                            expires_in: (currentSession as any).expires_in,
                            channelId: storedChannelId
                        }
                    });
                } catch (syncError) {
                    console.error("Erro ao sincronizar tokens:", syncError);
                }
            }

            if (!liveChatId && !isFindingChat && !hasAutoSearchedRef.current) {
                if (currentSession?.provider_token) {
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
                timeoutId = setTimeout(poll, 12000);
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


    return (
        <div className="flex justify-center min-h-screen bg-[#F3F4F6] dark:bg-[#0F172A] transition-colors duration-300">
            <div className="flex w-full max-w-[1800px]">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onSignOut={handleSignOut}
                />

                <main className="flex-grow flex flex-col h-screen overflow-hidden">
                    {/* Header */}
                    <header className="h-20 bg-white dark:bg-[#131b2e] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 sticky top-0 z-40 flex-shrink-0">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                {activeTab === 'dashboard' ? 'Painel De Controle' :
                                    activeTab === 'settings' ? 'Configurações' :
                                        activeTab === 'commands' ? 'Comandos do Bot' :
                                            activeTab === 'youtube' ? 'Conexão YouTube' :
                                                activeTab === 'timer' ? 'Timer' : 'Alice Bot'}
                            </h2>
                            <p className="text-[10px] text-gray-500 font-medium">
                                {activeTab === 'dashboard' ? 'Gerencie sua fila e interação com o bot.' :
                                    activeTab === 'settings' ? 'Personalize o comportamento da Alice.' :
                                        activeTab === 'youtube' ? 'Gerencie a conexão com o chat da live.' :
                                            activeTab === 'timer' ? 'Configuração de inatividade automática.' :
                                                'Painel administrativo.'}
                            </p>
                        </div>


                        <div className="flex items-center gap-6">
                            {/* YouTube Controls */}
                            <div className={`hidden md:flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 border ${isPolling ? 'bg-red-500/5 border-red-500/20' : 'bg-gray-50 dark:bg-[#162036] border-gray-200 dark:border-gray-800'}`}>
                                {googleConnected ? (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className={`p-1.5 rounded-lg ${isPolling ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                                    <YoutubeIcon className="w-4 h-4" />
                                                </div>
                                                {isPolling && (
                                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 ring-2 ring-white dark:ring-[#0f111a]"></span>
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${isPolling ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {isPolling ? 'Ao Vivo' : 'YouTube'}
                                                </span>
                                                <span className="text-[10px] font-medium text-gray-400">
                                                    {isPolling ? 'Sincronizado' : 'Conectado'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700 mx-2"></div>

                                        {isPolling ? (
                                            <button
                                                onClick={stopPolling}
                                                className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-600 dark:hover:bg-red-500/10 rounded-lg transition-colors group"
                                                title="Parar Sincronização"
                                            >
                                                <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleFindLiveChat}
                                                disabled={isFindingChat}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
                                                    ${isFindingChat
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 active:scale-95'
                                                    }`}
                                            >
                                                {isFindingChat ? (
                                                    <RefreshCwIcon className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <RefreshCwIcon className="w-3 h-3" />
                                                )}
                                                {isFindingChat ? 'Buscando...' : 'Sincronizar'}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setActiveTab('youtube')}
                                        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors py-1 px-2"
                                    >
                                        <YoutubeIcon className="w-4 h-4 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Conectar YouTube</span>
                                    </button>
                                )}
                            </div>

                            <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-800 hidden md:block"></div>

                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-bold text-gray-900 dark:text-white">{currentUser}</span>
                                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Administrador</span>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black shadow-lg border-2 border-gray-800 overflow-hidden">
                                    {currentUser.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="p-6 md:p-10 max-w-[1600px] mx-auto w-full flex-grow overflow-y-auto custom-scrollbar">
                        {activeTab === 'dashboard' && (

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
                                {/* Column 1: Queue */}
                                <div className="xl:col-span-1 h-full overflow-hidden">
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
                                    />
                                </div>

                                {/* Column 2: Playing */}
                                <div className="xl:col-span-1 h-full overflow-hidden">
                                    <PlayingDisplay
                                        playingUsers={playingUsers}
                                        onRemoveUser={handleRemovePlayingUser}
                                    />
                                </div>

                                {/* Column 3: Chat */}
                                <div className="xl:col-span-1 h-full overflow-hidden">
                                    <div className={`bg-white dark:bg-[#131b2e] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all duration-300 h-full`}>
                                        <div
                                            className="p-4 bg-gray-50 dark:bg-[#162036] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1f2937] transition-colors flex-shrink-0"
                                            onClick={() => setIsChatVisible(!isChatVisible)}
                                        >
                                            <div className="flex items-center gap-2 font-black text-gray-900 dark:text-white text-[10px] uppercase tracking-[0.2em]">
                                                <MessageSquareIcon className="w-4 h-4 text-cyan-400" />
                                                <span>Chat Alice</span>
                                            </div>
                                            <button className="text-gray-400 hover:text-cyan-500 transition-colors">
                                                {isChatVisible ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {isChatVisible && (
                                            <div className="flex-grow overflow-hidden flex flex-col bg-gray-100 dark:bg-[#0f111a]">
                                                <ChatWindow messages={messages} currentUser={currentUser} />
                                                <MessageInput
                                                    onSendMessage={(text) => handleSendMessage(adminName, text)}
                                                    commands={appSettings.commands}
                                                />
                                            </div>
                                        )}
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
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">Identidade do Bot</h4>
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

                                    <SettingsModal
                                        isOpen={true}
                                        onClose={() => setActiveTab('dashboard')}
                                        settings={appSettings}
                                        onSave={handleSettingsSave}
                                        onReset={() => handleSettingsSave(defaultSettings)}
                                        isInline={true}
                                    />
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
                                    initialTab="commands"
                                />
                            </div>
                        )}

                        {activeTab === 'youtube' && (
                            <YouTubeSettings
                                googleConnected={googleConnected}
                                googleEmail={googleEmail}
                                onConnectGoogle={handleConnectGoogle}
                                isConnectingGoogle={isConnectingGoogle}
                                onDisconnectGoogle={handleDisconnectGoogle}
                                onFindLiveChat={handleFindLiveChat}
                                isFindingChat={isFindingChat}
                                isPolling={isPolling}
                                stopPolling={stopPolling}
                                onReconnectGoogle={handleReconnectGoogle}
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