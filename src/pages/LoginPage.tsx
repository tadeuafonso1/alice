import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BotIcon, MoonIcon, SunIcon, YoutubeIcon } from '@/components/Icons';
import { useTheme } from '@/src/contexts/ThemeContext';

export const LoginPage: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);

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

        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-cyan-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto">
                <header className="text-center mb-8 relative">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 bg-cyan-500/10 rounded-2xl">
                            <BotIcon className="w-12 h-12 text-cyan-500" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
                        Alice
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Bot de Fila para Streamers
                    </p>
                    <div className="absolute top-0 right-0">
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                            aria-label="Mudar tema"
                        >
                            {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                        </button>
                    </div>
                </header>

                <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-2 text-white text-sm font-bold mb-4">
                            <YoutubeIcon className="w-8 h-8" />
                            <span style={{ fontFamily: '"Roboto", sans-serif' }}>Acesso YouTube</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Faça login com sua conta do YouTube para começar a gerenciar sua fila de forma profissional
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-4 px-6 border-2 border-gray-300 dark:border-gray-600 rounded-full shadow-lg text-base font-black text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-red-500 dark:hover:border-red-400 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <YoutubeIcon className="w-8 h-8" />
                        <span
                            className="group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors"
                            style={{ fontFamily: '"Roboto", sans-serif' }}
                        >
                            {loading ? 'Conectando...' : 'Login com YouTube'}
                        </span>
                    </button>

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <p>
                                Ao fazer login, você concorda com os <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">Termos de Serviço do YouTube</a> e com a <a href="http://www.google.com/policies/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">Política de Privacidade do Google</a> para que a Alice possa gerenciar sua fila e interagir com o chat ao vivo.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap justify-center gap-x-6 gap-y-2">
                    <a
                        href="/privacy"
                        className="text-xs font-medium text-gray-500 hover:text-cyan-500 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Política de Privacidade
                    </a>
                    <a
                        href="/terms"
                        className="text-xs font-medium text-gray-500 hover:text-cyan-500 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Termos de Uso
                    </a>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Feito com ❤️ para streamers
                    </p>
                </div>
            </div>
        </div>
    );
};