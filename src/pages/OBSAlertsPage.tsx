import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type AlertType = 'subscriber' | 'member' | 'superchat' | 'donation';

interface ObsAlert {
    id: string;
    user_id: string;
    type: AlertType;
    name: string;
    amount?: string;
    message?: string;
    status: 'pending' | 'played';
}

export const OBSAlertsPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [currentAlert, setCurrentAlert] = useState<ObsAlert | null>(null);
    const [alertQueue, setAlertQueue] = useState<ObsAlert[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const customAudioUrlsRef = useRef<Record<string, string>>({});

    // Configurações Globais do Alerta (Tempo de exibição)
    const ALERT_DURATION_MS = 6000;
    const ANIMATION_OUT_DELAY_MS = 5000;

    // Ref para garantir que timers sejam limpados se desmontar
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!userId) return;

        // 0. Carregar configurações (som customizado)
        const fetchUserSettings = async () => {
            const { data } = await supabase
                .from('settings')
                .select('alert_audio_subscriber, alert_audio_member, alert_audio_superchat, alert_audio_donation')
                .eq('user_id', userId)
                .single();
            
            if (data) {
                customAudioUrlsRef.current = {
                    subscriber: data.alert_audio_subscriber,
                    member: data.alert_audio_member,
                    superchat: data.alert_audio_superchat,
                    donation: data.alert_audio_donation
                };
            }
        };

        fetchUserSettings();

        // 1. Carregar Alertas Pendentes (Caso o OBS fechou e abriu)
        const fetchPendingAlerts = async () => {
            const { data, error } = await supabase
                .from('obs_alerts')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'pending')
                .order('created_at', { ascending: true });

            if (!error && data) {
                setAlertQueue(prev => [...prev, ...data]);
            }
        };

        fetchPendingAlerts();

        // 2. Escutar novos alertas em tempo real
        const channel = supabase
            .channel('public:obs_alerts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'obs_alerts',
                },
                (payload) => {
                    const newAlert = payload.new as ObsAlert;
                    
                    if (newAlert.user_id !== userId) return;

                    console.log("NOVO ALERTA RECEBIDO NO REALTIME:", newAlert);

                    if (newAlert.status === 'pending') {
                        setAlertQueue(prev => [...prev, newAlert]);
                    }
                }
            )
            .subscribe((status) => {
                console.log("Realtime status:", status);
            });

        // 2.5 Escutar mudanças nas configurações (se alterar o som com a tela aberta)
        const settingsChannel = supabase
            .channel('public:settings')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'settings',
                },
                (payload) => {
                    if (payload.new.user_id === userId) {
                        customAudioUrlsRef.current = {
                            subscriber: payload.new.alert_audio_subscriber,
                            member: payload.new.alert_audio_member,
                            superchat: payload.new.alert_audio_superchat,
                            donation: payload.new.alert_audio_donation
                        };
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(settingsChannel);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [userId]);

    // 3. Processar Fila de Alertas
    const processQueue = () => {
        if (alertQueue.length > 0 && !isPlaying && !currentAlert) {
            playNextAlert();
        }
    };

    useEffect(() => {
        processQueue();
    }, [alertQueue.length, isPlaying, currentAlert]);

    const playNextAlert = async () => {
        if (alertQueue.length === 0 || isPlaying || currentAlert) return;

        // Tira o primeiro da fila instantaneamente no state usando a função de callback
        // para garantir que não haja recriação dupla caso o React faça batch
        let alertToPlay: ObsAlert | null = null;
        setAlertQueue(prev => {
            if (prev.length === 0) return prev;
            alertToPlay = prev[0];
            return prev.slice(1);
        });

        // Espera o state sync se necessário (gambiarra de microtask par garantir que alertToPlay exista antes de continuar)
        await new Promise(resolve => setTimeout(resolve, 0));
        
        if (!alertToPlay) return;

        setIsPlaying(true);
        setCurrentAlert(alertToPlay);

        // Se tiver som customizado para ESTE tipo, toca ele. Se não, toca o sintetizado.
        const specificAudioUrl = customAudioUrlsRef.current[alertToPlay.type];
        console.log(`[DEBUG AUDIO] Tocando alerta tipo: ${alertToPlay.type}`);
        console.log(`[DEBUG AUDIO] URLs mapeadas nas settings:`, customAudioUrlsRef.current);
        console.log(`[DEBUG AUDIO] URL selecionada para o toque:`, specificAudioUrl);

        if (specificAudioUrl) {
            try {
                const audio = new Audio(specificAudioUrl);
                audio.play().catch(e => console.error("Erro ao tocar audio customizado", e));
            } catch (e) {
                console.error("Erro ao instanciar Audio customizado", e);
            }
        } else {
            // Sintetizador Fallback
            try {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                
                // Frequências diferentes baseadas no tipo
                if (alertToPlay.type === 'subscriber') {
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
                    oscillator.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.1); // A5
                    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                    oscillator.start(audioCtx.currentTime);
                    oscillator.stop(audioCtx.currentTime + 0.5);
                } else if (alertToPlay.type === 'superchat' || alertToPlay.type === 'donation') {
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(880.00, audioCtx.currentTime); // A5
                    oscillator.frequency.setValueAtTime(1108.73, audioCtx.currentTime + 0.1); // C#6
                    oscillator.frequency.setValueAtTime(1318.51, audioCtx.currentTime + 0.2); // E6
                    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
                    oscillator.start(audioCtx.currentTime);
                    oscillator.stop(audioCtx.currentTime + 0.6);
                } else {
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(440.00, audioCtx.currentTime); 
                    oscillator.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.2); 
                    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.1);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
                    oscillator.start(audioCtx.currentTime);
                    oscillator.stop(audioCtx.currentTime + 0.4);
                }
            } catch (e) {
                console.error("Erro ao tocar audio sintetizado do alerta", e);
            }
        }

        // Marca como tocado no banco (para não tocar de novo se atualizar a página)
        try {
            await supabase
                .from('obs_alerts')
                .update({ status: 'played' })
                .eq('id', alertToPlay.id);
        } catch (e) {
            console.error("Erro ao atualizar status do alerta no banco", e);
        }

        // Timer para tirar o alerta da tela
        timeoutRef.current = setTimeout(() => {
            setIsPlaying(false);
            
            // Espera a animação de saída terminar para limpar o componente
            // Usa const pura no timeout para não depender do state atual
            setTimeout(() => {
                setCurrentAlert(null);
            }, 1000); 

        }, ANIMATION_OUT_DELAY_MS);
    };

    if (!currentAlert) {
        return <div className="w-screen h-screen bg-transparent overflow-hidden"></div>;
    }

    // Configurações de layout baseadas no tipo de alerta
    const getAlertStyle = (type: AlertType) => {
        switch (type) {
            case 'subscriber':
                return {
                    bg: 'bg-gradient-to-r from-red-600 to-rose-600',
                    icon: '🌟',
                    title: 'NOVO INSCRITO!',
                    textColor: 'text-white'
                };
            case 'member':
                return {
                    bg: 'bg-gradient-to-r from-emerald-500 to-green-600',
                    icon: '👑',
                    title: 'NOVO MEMBRO!',
                    textColor: 'text-white'
                };
            case 'superchat':
            case 'donation':
                return {
                    bg: 'bg-gradient-to-r from-cyan-500 to-blue-600',
                    icon: '💰',
                    title: 'SUPER CHAT / DOAÇÃO!',
                    textColor: 'text-white'
                };
            default:
                return {
                    bg: 'bg-gray-800',
                    icon: '✨',
                    title: 'ALERTA',
                    textColor: 'text-white'
                };
        }
    };

    const style = getAlertStyle(currentAlert.type);

    return (
        <div className="w-screen h-screen bg-transparent overflow-hidden flex items-end justify-center pb-20">
            {/* Alerta Container - Modifique estas classes do tailwind para mudar as animações */}
            <div 
                className={`
                    flex flex-col items-center justify-center p-6 rounded-2xl shadow-2xl border-4 border-white/20
                    transition-all duration-700 ease-out transform
                    ${isPlaying ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-24 opacity-0 scale-95'}
                    ${style.bg} ${style.textColor}
                `}
                style={{
                    minWidth: '400px',
                    maxWidth: '800px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255,255,255,0.2)'
                }}
            >
                {/* Cabeçalho do Alerta */}
                <div className="flex items-center gap-4 mb-2">
                    <span className="text-4xl animate-bounce">{style.icon}</span>
                    <h1 className="text-3xl font-black uppercase tracking-widest drop-shadow-md">
                        {style.title}
                    </h1>
                    <span className="text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>{style.icon}</span>
                </div>

                {/* Nome do Usuário */}
                <h2 className="text-5xl font-extrabold text-white text-center drop-shadow-lg my-2">
                    {currentAlert.name}
                </h2>

                {/* Valor (Se for doação) */}
                {currentAlert.amount && (
                    <div className="mt-2 text-4xl font-black text-yellow-300 drop-shadow-md animate-pulse">
                        {currentAlert.amount}
                    </div>
                )}

                {/* Mensagem (Se for doação) */}
                {currentAlert.message && (
                    <div className="mt-4 p-4 bg-black/30 rounded-xl w-full text-center border border-white/10">
                        <p className="text-xl font-medium text-white/90">
                            "{currentAlert.message}"
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
