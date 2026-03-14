import React, { useState } from 'react';
import { RocketIcon, CopyIcon, GlobeIcon } from './Icons';
import { supabase } from '../integrations/supabase/client';
import { useSession } from '../src/contexts/SessionContext';

export const AlertsTab: React.FC = () => {
    const { session } = useSession();
    const [testingType, setTestingType] = useState<string | null>(null);
    const [uploadingType, setUploadingType] = useState<string | null>(null);
    const [filenames, setFilenames] = useState<Record<string, string>>({});

    React.useEffect(() => {
        const fetchSettings = async () => {
            if (!session?.user?.id) return;
            const { data } = await supabase
                .from('settings')
                .select('alert_filename_subscriber, alert_filename_member, alert_filename_superchat, alert_filename_donation')
                .eq('user_id', session.user.id)
                .single();
            
            if (data) {
                setFilenames({
                    subscriber: data.alert_filename_subscriber || '',
                    member: data.alert_filename_member || '',
                    superchat: data.alert_filename_superchat || '',
                    donation: data.alert_filename_donation || ''
                });
            }
        };
        fetchSettings();
    }, [session?.user?.id]);
    
    // Gera a URL única do OBS para este usuário
    const obsUrl = session?.user?.id 
        ? `${window.location.origin}/obs/alerts/${session.user.id}`
        : '';

    const handleCopyUrl = () => {
        if (obsUrl) {
            navigator.clipboard.writeText(obsUrl);
            alert('URL do OBS copiada para a área de transferência!');
        }
    };

    const handleTestAlert = async (type: 'subscriber' | 'member' | 'superchat' | 'donation') => {
        if (!session?.user?.id) return;
        
        setTestingType(type);
        try {
            let name = 'Usuário Teste';
            let amount = '';
            let message = '';
            
            if (type === 'subscriber') name = 'João Silva';
            if (type === 'member') name = 'Maria Souza';
            if (type === 'superchat') {
                name = 'Pedro Gamer';
                amount = 'R$ 50,00';
                message = 'Amo suas lives, continua assim!!';
            }
            if (type === 'donation') {
                name = 'Lucas Anônimo';
                amount = 'R$ 10,00';
            }

            console.log("Enviando alerta para o banco de dados...", {
                user_id: session.user.id, type, name, amount, message
            });

            const { data, error } = await supabase.from('obs_alerts').insert({
                user_id: session.user.id,
                type,
                name,
                amount,
                message,
                status: 'pending'
            }).select();

            if (error) {
                console.error("Erro do Supabase ao inserir alerta:", error);
                throw error;
            }
            
            console.log("Alerta inserido com sucesso!", data);
            
        } catch (error) {
            console.error("Erro ao enviar alerta de teste:", error);
            alert("Erro ao disparar alerta de teste.");
        } finally {
            setTestingType(null);
        }
    };

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-cyan-500/10 rounded-xl">
                    <RocketIcon className="w-8 h-8 text-cyan-500" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold">Alertas na Tela (OBS)</h3>
                    <p className="text-gray-500 dark:text-gray-400">Configure e teste os alertas de inscritos e doações da sua live.</p>
                </div>
            </div>

            {/* Seção 1: Link do OBS */}
            <div className="mb-8 p-6 bg-gray-50 dark:bg-[#0f111a] border border-gray-200 dark:border-gray-800 rounded-2xl">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <GlobeIcon className="w-5 h-5 text-gray-500" />
                    URL do Browser Source (OBS)
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                    Copie o link abaixo e adicione como uma fonte de "Navegador" no seu OBS Studio. 
                    Recomendamos definir a largura para 800 e a altura para 600.
                </p>
                
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        readOnly 
                        value={obsUrl}
                        className="flex-1 bg-white dark:bg-[#1E293B] border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-300 outline-none"
                    />
                    <button 
                        onClick={handleCopyUrl}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-cyan-900/20"
                    >
                        <CopyIcon className="w-5 h-5" />
                        Copiar
                    </button>
                </div>
            </div>

            {/* Seção 2: Sons Personalizados dos Alertas */}
            <div className="mb-8 p-6 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-800 rounded-2xl">
                <h4 className="text-lg font-bold mb-4">Sons Personalizados</h4>
                <p className="text-sm text-gray-500 mb-6">
                    Envie um arquivo de áudio curto (.mp3 ou .wav, max 2MB) para cada tipo de alerta. Se você não enviar, o som padrão será tocado.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { id: 'subscriber', label: 'Novo Inscrito', icon: '🌟', column: 'alert_audio_subscriber', fileCol: 'alert_filename_subscriber' },
                        { id: 'member', label: 'Novo Membro', icon: '👑', column: 'alert_audio_member', fileCol: 'alert_filename_member' },
                        { id: 'superchat', label: 'Super Chat', icon: '💰', column: 'alert_audio_superchat', fileCol: 'alert_filename_superchat' },
                        { id: 'donation', label: 'Doação Externa', icon: '💳', column: 'alert_audio_donation', fileCol: 'alert_filename_donation' }
                    ].map(type => (
                        <div key={type.id} className="flex flex-col gap-4 p-5 bg-gray-50 dark:bg-[#0f111a] rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-cyan-500/50 transition-colors shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl p-2 bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">{type.icon}</span>
                                <h5 className="font-bold text-gray-800 dark:text-gray-200 text-lg">{type.label}</h5>
                            </div>
                            <div className="relative group">
                                <input 
                                    type="file" 
                                    disabled={uploadingType === type.id}
                                    accept="audio/mp3, audio/wav, audio/mpeg"
                                    className={`block w-full text-sm text-slate-500
                                    file:mr-4 file:py-2.5 file:px-4
                                    file:rounded-xl file:border-0
                                    file:text-sm file:font-bold
                                    file:bg-cyan-500 file:text-white
                                    hover:file:bg-cyan-600 focus:outline-none
                                    cursor-pointer
                                    bg-white dark:bg-[#1E293B] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-2 transition-all 
                                    ${uploadingType === type.id ? 'opacity-50 cursor-not-allowed' : 'group-hover:border-cyan-400 dark:group-hover:border-cyan-500'}`}
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file || !session?.user?.id) return;
                                        
                                        if (file.size > 2 * 1024 * 1024) {
                                            alert('O arquivo deve ter no máximo 2MB.');
                                            e.target.value = '';
                                            return;
                                        }

                                        try {
                                            setUploadingType(type.id); 
                                            
                                            const fileExt = file.name.split('.').pop();
                                            const filePath = `${session.user.id}/alert_${type.id}.${fileExt}`;

                                            const { error: uploadError } = await supabase.storage
                                                .from('alert_sounds')
                                                .upload(filePath, file, { upsert: true });

                                            if (uploadError) throw uploadError;

                                            const { data: { publicUrl } } = supabase.storage
                                                .from('alert_sounds')
                                                .getPublicUrl(filePath);

                                            // Cache buster: Garante que o OBS e o Navegador baixem o áudio novo e não usem cache
                                            const timestampUrl = `${publicUrl}?t=${Date.now()}`;

                                            const { data: settingsData } = await supabase
                                                .from('settings')
                                                .select('id')
                                                .eq('user_id', session.user.id)
                                                .single();
                                            
                                            
                                            if (settingsData) {
                                                const { error: updateError } = await supabase
                                                    .from('settings')
                                                    .update({ 
                                                        [type.column]: timestampUrl,
                                                        [type.fileCol]: file.name
                                                    })
                                                    .eq('id', settingsData.id);
                                                    
                                                if (updateError) throw updateError;

                                                setFilenames(prev => ({
                                                    ...prev,
                                                    [type.id]: file.name
                                                }));
                                            }

                                            alert(`Som de ${type.label} atualizado com sucesso!`);
                                        } catch (error) {
                                            console.error('Erro ao fazer upload do som:', error);
                                            alert('Erro ao fazer upload. Verifique as configurações de Storage.');
                                        } finally {
                                            setUploadingType(null);
                                        }
                                    }}
                                />
                                {filenames[type.id] && (
                                    <div className="absolute -bottom-6 left-0 text-xs font-semibold text-cyan-600 dark:text-cyan-400 truncate w-full px-2" title={filenames[type.id]}>
                                        🎵 {filenames[type.id]}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Seção 3: Controles de Teste */}
            <div className="p-6 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-800 rounded-2xl">
                <h4 className="text-lg font-bold mb-4">Testar Alertas</h4>
                <p className="text-sm text-gray-500 mb-6">
                    Clique nos botões abaixo para simular alertas. Eles aparecerão instantaneamente no seu OBS se ele estiver configurado.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button 
                        onClick={() => handleTestAlert('subscriber')}
                        disabled={testingType === 'subscriber'}
                        className="p-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-red-900/20 flex flex-col items-center justify-center gap-2"
                    >
                        <span className="text-2xl">🌟</span>
                        {testingType === 'subscriber' ? 'Enviando...' : 'Novo Inscrito'}
                    </button>

                    <button 
                        onClick={() => handleTestAlert('member')}
                        disabled={testingType === 'member'}
                        className="p-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-emerald-900/20 flex flex-col items-center justify-center gap-2"
                    >
                        <span className="text-2xl">👑</span>
                        {testingType === 'member' ? 'Enviando...' : 'Novo Membro'}
                    </button>

                    <button 
                        onClick={() => handleTestAlert('superchat')}
                        disabled={testingType === 'superchat'}
                        className="p-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-900/20 flex flex-col items-center justify-center gap-2"
                    >
                        <span className="text-2xl">💰</span>
                        {testingType === 'superchat' ? 'Enviando...' : 'Super Chat'}
                    </button>

                    <button 
                        onClick={() => handleTestAlert('donation')}
                        disabled={testingType === 'donation'}
                        className="p-4 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-purple-900/20 flex flex-col items-center justify-center gap-2"
                    >
                        <span className="text-2xl">💳</span>
                        {testingType === 'donation' ? 'Enviando...' : 'Doação Externa'}
                    </button>
                </div>
            </div>

        </div>
    );
};
