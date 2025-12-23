import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AdminPanel } from '@/components/AdminPanel';
import { ChatWindow } from '@/components/ChatWindow';
import { MessageInput } from '@/components/MessageInput';
import { QueueDisplay } from '@/components/QueueDisplay';
import { PlayingDisplay } from '@/components/PlayingDisplay';
import { SettingsModal } from '@/components/SettingsModal';
import { ManualQueueControl } from '@/components/ManualQueueControl';
import type { Message, AppSettings, QueueUser, MessageSettings, CommandSettings } from '@/types';
import { BotIcon, SettingsIcon, SunIcon, MoonIcon, LogOutIcon } from '@/components/Icons';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/src/contexts/SessionContext';
import { useTheme } from '@/src/contexts/ThemeContext';

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
    const [appSettings, setAppSettings] = useState<AppSettings>(defaultSettings);
    const [warningSentUsers, setWarningSentUsers] = useState<Set<string>>(new Set());

    // Estado para a conexão com o YouTube
    const [liveChatId, setLiveChatId] = useState<string>('');
    const [channelTitle, setChannelTitle] = useState<string>('');
    const [settingsId, setSettingsId] = useState<number | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [isFindingChat, setIsFindingChat] = useState(false);
    const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
    const nextPageTokenRef = useRef<string | null>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (session?.user?.user_metadata?.full_name) {
            setCurrentUser(session.user.user_metadata.full_name);
            setAdminName(session.user.user_metadata.full_name);
        } else if (session?.user?.email) {
            setCurrentUser(session.user.email);
            setAdminName(session.user.email);
        }
    }, [session]);

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
        }
    };

    const sendToYouTubeChat = useCallback(async (text: string) => {
        if (!liveChatId || !session?.provider_token) {
            console.warn("Cannot send to YouTube: Missing liveChatId or provider_token", { liveChatId, hasToken: !!session?.provider_token });
            return;
        }

        try {
            const { data, error } = await supabase.functions.invoke('youtube-chat-send', {
                body: { liveChatId, messageText: text },
                headers: {
                    'x-youtube-token': session.provider_token,
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
                const { data: settingsData, error: settingsError } = await supabase
                    .from('settings')
                    .select('id, settings_data')
                    .single();

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

            } catch (error) {
                console.error("Error fetching initial data:", error);
                addBotMessageRef.current("Erro ao carregar dados do banco de dados.");
            }
        };

        fetchData();
    }, [adminName]);

    const handleSettingsSave = async (newSettings: AppSettings) => {
        setAppSettings(newSettings);
        try {
            const { error } = await supabase
                .from('settings')
                .upsert({
                    id: settingsId || 1, // Use 1 as default fallback
                    settings_data: newSettings
                });
            if (error) throw error;

            // If we didn't have an ID before, fetch it now
            if (!settingsId) {
                const { data } = await supabase.from('settings').select('id').single();
                if (data) setSettingsId(data.id);
            }
        } catch (error) {
            console.error("Failed to save settings to Supabase", error);
            addBotMessageRef.current("Erro ao salvar configurações no banco de dados.");
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

        const commandText = text.trim().toLowerCase();
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
        } else if (commands.position.enabled && commandText === commands.position.command) {
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
            const customCommand = customCommands.find(c => c.command.toLowerCase() === commandText);
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
        addBotMessage("Desconectado do chat do YouTube.");
    }, [isPolling, addBotMessage]);

    const fetchAndProcessMessages = useCallback(async () => {
        if (!liveChatId) return;

        const isFirstPoll = nextPageTokenRef.current === null;

        try {
            const response = await supabase.functions.invoke('youtube-chat-fetch', {
                body: { liveChatId, pageToken: nextPageTokenRef.current },
            });

            const { data, error } = response;

            if (error) {
                let errorMessage = error.message || "Erro desconhecido";
                if (error.context && typeof error.context.json === 'function') {
                    try {
                        const errorBody = await error.context.json();
                        errorMessage = errorBody.error || errorMessage;
                    } catch (e) {
                        // If we can't parse the body, use the message
                    }
                }
                throw new Error(errorMessage);
            }

            if (data && data.items) {
                // Se for a primeira busca desta sessão, apenas pegamos o token de próxima página
                // e ignoramos as mensagens anteriores para evitar repetir comandos já executados.
                if (!isFirstPoll) {
                    for (const item of data.items) {
                        const author = item.authorDetails.displayName;
                        const text = item.snippet.displayMessage;
                        await handleSendMessageRef.current(author, text);
                    }
                } else {
                    console.log("Sessão iniciada: Histórico ignorado. Pronto para as próximas mensagens.");
                }
                nextPageTokenRef.current = data.nextPageToken;
            }
        } catch (error: any) {
            console.error('Erro ao buscar mensagens do YouTube:', error);
            addBotMessageRef.current(`Erro ao conectar com o chat do YouTube: ${error.message}`);
            stopPolling();
        }
    }, [liveChatId, stopPolling]);

    const startPolling = useCallback(() => {
        if (isPolling || !liveChatId) return;
        const displayName = channelTitle || "seu canal";
        addBotMessage(`Conectado ao chat do ${displayName}!`);
        setIsPolling(true);
    }, [isPolling, liveChatId, channelTitle, addBotMessage]);

    const handleFindLiveChat = async () => {
        if (!session?.provider_token) {
            addBotMessage("Erro: Token de acesso do Google não encontrado. Tente fazer login novamente.");
            return;
        }
        setIsFindingChat(true);
        addBotMessage("Buscando sua transmissão ao vivo ativa...");
        try {
            const response = await supabase.functions.invoke('youtube-find-live-chat', {
                headers: {
                    'Authorization': `Bearer ${session.provider_token}`,
                },
            });

            const { data, error } = response;

            if (error) {
                // Try to read the error body if it's a FunctionsHttpError
                let errorMessage = error.message || "Erro desconhecido";
                if (error.context && typeof error.context.json === 'function') {
                    try {
                        const errorBody = await error.context.json();
                        errorMessage = errorBody.error || errorMessage;
                    } catch (e) {
                        // If we can't parse the body, use the message
                    }
                }
                throw new Error(errorMessage);
            }

            if (data.liveChatId) {
                setLiveChatId(data.liveChatId);
                if (data.channelTitle) {
                    setChannelTitle(data.channelTitle);
                }
                addBotMessage(`ID do chat ao vivo encontrado! (Canal: ${data.channelTitle || 'YouTube'})`);
            } else {
                addBotMessage(data.error || "Não foi possível encontrar uma transmissão ativa.");
            }
        } catch (error: any) {
            console.error('Erro ao buscar chat ao vivo:', error);
            addBotMessage(`Erro: ${error.message || "Ocorreu um erro ao buscar sua live."}`);
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
                }
            });
            if (error) throw error;
        } catch (error: any) {
            console.error('Erro ao conectar Google:', error);
            addBotMessage(`Erro ao conectar conta Google: ${error.message || JSON.stringify(error) || 'Erro desconhecido'}. Tente novamente.`);
            setIsConnectingGoogle(false);
        }
    };

    // Função para desvincular conta Google
    const handleDisconnectGoogle = async () => {
        // Se o usuário logou diretamente com o Google, não dá para apenas "desvincular", tem que fazer logout.
        const isGoogleLogin = session?.user?.app_metadata?.provider === 'google';

        if (isGoogleLogin) {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Erro ao sair:', error);
                addBotMessage("Erro ao desconectar. Tente limpar o cache do navegador.");
            } else {
                // Redireciona para o login após sair
                window.location.reload();
            }
            return;
        }

        const googleIdentity = session?.user?.identities?.find(id => id.provider === 'google');
        if (!googleIdentity) {
            addBotMessage("Nenhuma conta Google vinculada para desvincular.");
            return;
        }
        try {
            const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
            if (error) throw error;
            addBotMessage("Conta Google desvinculada com sucesso!");
            // Force refresh session
            await supabase.auth.refreshSession();
        } catch (error: any) {
            console.error('Erro ao desvincular Google:', error);
            // Se der erro ao desvincular, tenta forçar o logout como fallback
            addBotMessage(`Erro ao desvincular: ${error.message}. Tentando sair da conta...`);
            await supabase.auth.signOut();
            window.location.reload();
        }
    };

    // Verificar se Google está conectado
    const googleIdentity = session?.user?.identities?.find(id => id.provider === 'google');
    const googleConnected = !!googleIdentity;
    const googleEmail = googleIdentity?.identity_data?.email || session?.user?.user_metadata?.email || null;

    // Auto-buscar live quando o usuário faz login
    const hasAutoSearchedRef = useRef(false);
    useEffect(() => {
        if (session?.provider_token && !liveChatId && !isFindingChat && !hasAutoSearchedRef.current) {
            hasAutoSearchedRef.current = true;
            handleFindLiveChat();
        }
    }, [session?.provider_token, liveChatId, isFindingChat]);

    // Auto-conectar quando encontrar o liveChatId
    useEffect(() => {
        if (liveChatId && !isPolling) {
            startPolling();
        }
    }, [liveChatId, isPolling, startPolling]);

    useEffect(() => {
        if (isPolling) {
            nextPageTokenRef.current = null;
            fetchAndProcessMessages();
            pollingIntervalRef.current = setInterval(fetchAndProcessMessages, 7000);

            return () => {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
            };
        }
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
        <>
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans p-4 md:p-6 lg:p-8 transition-colors duration-300 flex flex-col">
                <div className="flex-grow">
                    <header className="text-center mb-8">
                        <div className="flex justify-between items-center max-w-4xl mx-auto h-12">
                            <div className="flex-1 flex justify-start">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsSettingsOpen(true)}
                                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                        aria-label="Abrir configurações"
                                    >
                                        <SettingsIcon className="w-7 h-7" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 flex justify-center">
                                <div className="flex items-center gap-3">
                                    <BotIcon className="w-10 h-10 text-cyan-500" />
                                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white whitespace-rap">
                                        Alice
                                    </h1>
                                </div>
                            </div>

                            <div className="flex-1 flex justify-end items-center gap-2">
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    aria-label="Mudar tema"
                                >
                                    {theme === 'light' ? <MoonIcon className="w-7 h-7" /> : <SunIcon className="w-7 h-7" />}
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    aria-label="Sair"
                                    title="Sair"
                                >
                                    <LogOutIcon className="w-7 h-7" />
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Uma simulação de um bot de fila para chat do YouTube.</p>
                    </header>

                    <div className="max-w-7xl mx-auto flex flex-col gap-6">
                        <div className="flex flex-col gap-6">
                            <AdminPanel
                                isTimerActive={isTimerActive}
                                onToggleTimer={handleToggleTimer}
                                timeoutMinutes={timeoutMinutes}
                                setTimeoutMinutes={setTimeoutMinutes}
                                onNext={handleNextUser}
                                onReset={() => handleSendMessage(adminName, appSettings.commands.reset.command)}
                                isPolling={isPolling}
                                stopPolling={stopPolling}
                                googleConnected={googleConnected}
                                googleEmail={googleEmail}
                                onConnectGoogle={handleConnectGoogle}
                                isConnectingGoogle={isConnectingGoogle}
                                onDisconnectGoogle={handleDisconnectGoogle}
                            />
                            <ManualQueueControl onAddUser={handleAddUserManually} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <QueueDisplay
                                    queue={queue}
                                    userTimers={userTimers}
                                    isTimerActive={isTimerActive}
                                    timeoutMinutes={timeoutMinutes}
                                    adminName={adminName}
                                    onMoveToPlaying={handleMoveToPlaying}
                                    onRemoveUser={(user) => handleRemoveUsersFromQueue([user], 'admin')}
                                    onMoveToTop={handleMoveToTop}
                                />
                                <PlayingDisplay
                                    playingUsers={playingUsers}
                                    onRemoveUser={handleRemovePlayingUser}
                                />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-2xl flex flex-col h-[75vh]">
                            <ChatWindow messages={messages} currentUser={currentUser} />
                            <MessageInput
                                onSendMessage={(text) => handleSendMessage(adminName, text)}
                                commands={appSettings.commands}
                            />
                        </div>
                    </div>
                </div>
                <footer className="text-center py-4 mt-8">
                    <div className="flex justify-center items-center gap-4">
                        <Link to="/privacy" className="text-sm text-gray-500 dark:text-gray-400 hover:underline">
                            Política de Privacidade
                        </Link>
                        <span className="text-gray-400 dark:text-gray-600">|</span>
                        <Link to="/terms" className="text-sm text-gray-500 dark:text-gray-400 hover:underline">
                            Termos de Serviço
                        </Link>
                    </div>
                </footer>
            </div>
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={appSettings}
                onSave={handleSettingsSave}
                onReset={() => handleSettingsSave(defaultSettings)}
            />
        </>
    );
};

export default HomePage;