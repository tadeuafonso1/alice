import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BotIcon, MoonIcon, SunIcon, EyeIcon, EyeOffIcon } from '@/components/Icons';
import { useTheme } from '@/src/contexts/ThemeContext';

export const LoginPage: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            setError(error.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto">
                <header className="text-center mb-8 relative">
                    <div className="flex items-center justify-center gap-3">
                        <BotIcon className="w-10 h-10 text-cyan-500" />
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white whitespace-nowrap">
                            Alice
                        </h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Faça login para continuar</p>
                    <div className="absolute top-0 right-0">
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            aria-label="Mudar tema"
                        >
                            {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                        </button>
                    </div>
                </header>
                <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-2xl p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Endereço de e-mail
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Senha
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-gray-900 dark:text-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    aria-label="Mostrar/ocultar senha"
                                >
                                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50"
                            >
                                {loading ? 'Entrando...' : 'Entrar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};