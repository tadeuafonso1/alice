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
                        <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-4 py-2 rounded-full text-sm font-bold mb-4">
                            <YoutubeIcon className="w-5 h-5" />
                            <span>Login com YouTube</span>
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
                        className="w-full flex items-center justify-center gap-3 py-4 px-6 border-2 border-gray-300 dark:border-gray-600 rounded-full shadow-lg text-base font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-cyan-500 dark:hover:border-cyan-400 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            {loading ? 'Conectando...' : 'Entrar com Google'}
                        </span>
                    </button>

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <p>
                                Ao fazer login, você concorda em conectar sua conta do YouTube para que a Alice possa gerenciar sua fila e interagir com o chat ao vivo.
                            </p>
                        </div>
                    </div>
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