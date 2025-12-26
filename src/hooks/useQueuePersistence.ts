import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QueueState {
    isTimerActive: boolean;
    timeoutMinutes: number;
    isQueueOpen?: boolean;
}

/**
 * Hook customizado para gerenciar a persistência do estado da fila no Supabase
 */
export const useQueuePersistence = () => {
    /**
     * Salva o estado global da fila no Supabase
     */
    const saveQueueState = useCallback(async (state: QueueState) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('[useQueuePersistence] Usuário não autenticado');
                return { success: false, error: 'Usuário não autenticado' };
            }

            const { error } = await supabase
                .from('queue_state')
                .upsert({
                    user_id: user.id,
                    is_timer_active: state.isTimerActive,
                    timeout_minutes: state.timeoutMinutes,
                    is_queue_open: state.isQueueOpen ?? true,
                    last_updated: new Date().toISOString(),
                }, {
                    onConflict: 'user_id'
                });

            if (error) {
                console.error('[useQueuePersistence] Erro ao salvar estado:', error);
                return { success: false, error: error.message };
            }

            console.log('[useQueuePersistence] Estado salvo com sucesso:', state);
            return { success: true };
        } catch (error: any) {
            console.error('[useQueuePersistence] Exceção ao salvar estado:', error);
            return { success: false, error: error.message };
        }
    }, []);

    /**
     * Carrega o estado global da fila do Supabase
     */
    const loadQueueState = useCallback(async (): Promise<QueueState | null> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('[useQueuePersistence] Usuário não autenticado');
                return null;
            }

            const { data, error } = await supabase
                .from('queue_state')
                .select('is_timer_active, timeout_minutes, is_queue_open')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                console.error('[useQueuePersistence] Erro ao carregar estado:', error);
                return null;
            }

            if (!data) {
                console.log('[useQueuePersistence] Nenhum estado salvo encontrado');
                return null;
            }

            console.log('[useQueuePersistence] Estado carregado:', data);
            return {
                isTimerActive: data.is_timer_active,
                timeoutMinutes: data.timeout_minutes,
                isQueueOpen: data.is_queue_open,
            };
        } catch (error: any) {
            console.error('[useQueuePersistence] Exceção ao carregar estado:', error);
            return null;
        }
    }, []);

    /**
     * Atualiza o timer_start_time de um usuário específico na fila
     */
    const updateUserTimer = useCallback(async (username: string, startTime: number) => {
        try {
            const { error } = await supabase
                .from('queue')
                .update({
                    timer_start_time: new Date(startTime).toISOString(),
                    warning_sent: false, // Reset warning quando usuário fala
                })
                .eq('username', username);

            if (error) {
                console.error('[useQueuePersistence] Erro ao atualizar timer do usuário:', error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error: any) {
            console.error('[useQueuePersistence] Exceção ao atualizar timer:', error);
            return { success: false, error: error.message };
        }
    }, []);

    /**
     * Marca que o aviso de 30 segundos foi enviado para um usuário
     */
    const markWarningAsSent = useCallback(async (username: string) => {
        try {
            const { error } = await supabase
                .from('queue')
                .update({ warning_sent: true })
                .eq('username', username);

            if (error) {
                console.error('[useQueuePersistence] Erro ao marcar aviso:', error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error: any) {
            console.error('[useQueuePersistence] Exceção ao marcar aviso:', error);
            return { success: false, error: error.message };
        }
    }, []);

    return {
        saveQueueState,
        loadQueueState,
        updateUserTimer,
        markWarningAsSent,
    };
};
