import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { LivePixSettings as LivePixSettingsType } from '@/types';
import { RefreshCwIcon, SaveIcon, ExternalLinkIcon, ShieldIcon, RocketIcon, CoinsIcon, BotIcon } from './Icons';

interface Props {
    userId?: string;
}

export const LivePixSettings: React.FC<Props> = ({ userId }) => {
    const [settings, setSettings] = useState<LivePixSettingsType>({
        user_id: userId || '',
        enabled: false,
        client_id: '',
        client_secret: '',
        skip_queue_enabled: false,
        skip_queue_price: 5.00,
        skip_queue_message: '🚀🚀 ALERTA: @{user} acaba de furar a fila com um Pix! 🚀🚀',
        points_per_real: 100,
        webhook_secret: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!userId) return;
            try {
                const { data, error } = await supabase
                    .from('live_pix_settings')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (error) throw error;
                if (data) {
                    setSettings({
                        ...data,
                        user_id: data.user_id || userId || '',
                        skip_queue_price: Number(data.skip_queue_price),
                        client_id: data.client_id || '',
                        client_secret: data.client_secret || '',
                        skip_queue_message: data.skip_queue_message || '',
                        webhook_secret: data.webhook_secret || '',
                    });
                }
            } catch (err: any) {
                console.error('Error fetching LivePix settings:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [userId]);

    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);
        setMessage(null);
        try {
            const { error } = await supabase
                .from('live_pix_settings')
                .upsert({
                    user_id: userId,
                    ...settings,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            setMessage({ text: 'Configurações salvas com sucesso!', type: 'success' });
        } catch (err: any) {
            console.error('Error saving LivePix settings:', err);
            setMessage({ text: `Erro ao salvar: ${err.message}`, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const webhookUrl = `${window.location.origin.replace('localhost:5173', 'nvtlirmfavhahwtsdchk.functions.supabase.co')}/functions/v1/livepix-webhook?user_id=${userId}`;

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <RefreshCwIcon className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Card */}
            <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-2xl p-8 border border-gray-800 shadow-2xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#3b82f6] flex items-center justify-center p-1.5 shadow-lg shadow-blue-500/20">
                                <RocketIcon className="w-full h-full text-white" />
                            </div>
                            Integração LivePix
                        </h3>
                        <p className="text-gray-400 mt-2 max-w-xl">
                            Automatize o seu bot com doações em tempo real. Ative o "Fura-Fila" e recompense seus apoiadores com pontos de lealdade.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.enabled}
                                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                            />
                            <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                            <span className="ml-3 text-sm font-bold text-gray-300 uppercase tracking-wider">
                                {settings.enabled ? 'Ativado' : 'Desativado'}
                            </span>
                        </label>
                    </div>
                </div>
                <div className="absolute right-0 top-0 w-64 h-64 bg-cyan-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Credentials Section */}
                <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <ShieldIcon className="w-5 h-5 text-blue-500" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white uppercase text-sm tracking-widest">Configurações de API</h4>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Client ID</label>
                            <input
                                type="text"
                                value={settings.client_id}
                                onChange={(e) => setSettings({ ...settings, client_id: e.target.value })}
                                placeholder="Seu Client ID do LivePix"
                                className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Client Secret</label>
                            <input
                                type="password"
                                value={settings.client_secret}
                                onChange={(e) => setSettings({ ...settings, client_secret: e.target.value })}
                                placeholder="Seu Client Secret do LivePix"
                                className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                            />
                        </div>
                        <div className="pt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                            <p className="text-xs text-amber-500 font-medium leading-relaxed">
                                💡 Você encontra essas credenciais nas configurações da sua conta LivePix em <strong>Aplicações</strong>.
                            </p>
                            <a href="https://dashboard.livepix.gg/settings/applications" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase mt-2 hover:underline">
                                Abrir LivePix <ExternalLinkIcon className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Webhook Section */}
                <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <RefreshCwIcon className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white uppercase text-sm tracking-widest">Webhook (Obrigatório)</h4>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Copie esta URL e cole nas configurações de Webhook do LivePix para que o bot receba os avisos.
                        </p>
                        <div className="relative group">
                            <input
                                type="text"
                                readOnly
                                value={webhookUrl}
                                className="w-full bg-gray-100 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-[10px] font-mono focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-emerald-400"
                            />
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(webhookUrl);
                                    alert('URL copiada!');
                                }}
                                className="absolute right-2 top-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-bold uppercase shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                            >
                                Copiar
                            </button>
                        </div>
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                Ative os eventos de <strong>Mensagem</strong> e <strong>Inscrição</strong> no seu Webhook.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Automation Section */}
            <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-lg">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                        <RocketIcon className="w-6 h-6 text-cyan-500" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-[0.2em]">Automações do Bot</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Fura Fila */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <RocketIcon className="w-5 h-5 text-cyan-500" />
                                <span className="font-bold text-gray-900 dark:text-white uppercase text-sm">Fura-Fila Automático</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.skip_queue_enabled}
                                    onChange={(e) => setSettings({ ...settings, skip_queue_enabled: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                            </label>
                        </div>

                        <div className={`space-y-4 transition-opacity duration-300 ${settings.skip_queue_enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Mínimo (R$)</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.5"
                                    value={settings.skip_queue_price}
                                    onChange={(e) => setSettings({ ...settings, skip_queue_price: Number(e.target.value) })}
                                    className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none dark:text-white font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mensagem de Alerta (Chamativo)</label>
                                <textarea
                                    value={settings.skip_queue_message}
                                    onChange={(e) => setSettings({ ...settings, skip_queue_message: e.target.value })}
                                    rows={3}
                                    className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none dark:text-white resize-none"
                                />
                                <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wider">Use {'{user}'} para mencionar o doador.</p>
                            </div>
                        </div>
                    </div>

                    {/* Loyalty Points */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <CoinsIcon className="w-5 h-5 text-amber-500" />
                            <span className="font-bold text-gray-900 dark:text-white uppercase text-sm">Lealdade por Pix</span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pontos por cada R$ 1,00</label>
                                <input
                                    type="number"
                                    value={settings.points_per_real}
                                    onChange={(e) => setSettings({ ...settings, points_per_real: Number(e.target.value) })}
                                    className="w-full bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none dark:text-white font-bold"
                                />
                            </div>
                            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                    💰 Exemplo: Se definido 100, um Pix de R$ 10,00 concederá 1.000 pontos automaticamente.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl sticky bottom-6 z-30">
                <div className="flex-grow">
                    {message && (
                        <p className={`text-sm font-bold uppercase tracking-wider ${message.type === 'success' ? 'text-emerald-500' : 'text-red-500'} animate-in fade-in duration-300`}>
                            {message.text}
                        </p>
                    )}
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded-xl font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all"
                >
                    {saving ? (
                        <RefreshCwIcon className="w-4 h-4 animate-spin" />
                    ) : (
                        <SaveIcon className="w-4 h-4" />
                    )}
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </div>
    );
};
