import React from 'react';
import { BotIcon, UsersIcon, MessageSquareIcon, SettingsIcon, Gamepad2Icon, ChevronRightIcon, CopyIcon, HomeIcon } from '@/components/Icons';
import { Link } from 'react-router-dom';

const CommandCard: React.FC<{ icon: React.ReactNode, title: string, command: string, description: string, colorClass: string }> = ({ icon, title, command, description, colorClass }) => (
    <div className="bg-white dark:bg-[#1e2947]/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:border-cyan-500/50 transition-all group overflow-hidden relative">
        <div className={`absolute top-0 right-0 w-24 h-24 ${colorClass} opacity-5 blur-3xl -mr-10 -mt-10 group-hover:opacity-10 transition-opacity`}></div>
        <div className="flex items-start gap-4 relative z-10">
            <div className={`p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:${colorClass.replace('bg-', 'text-')} transition-colors`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 dark:text-white font-black uppercase tracking-wider text-xs mb-1">{title}</h3>
                <div className="flex items-center gap-2 mb-2">
                    <code className="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-lg text-sm font-mono font-bold border border-cyan-500/20">
                        {command}
                    </code>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    </div>
);

export const CommandsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f111a] text-gray-900 dark:text-white transition-colors duration-300 flex flex-col">
            {/* Header / Navbar */}
            <header className="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-[#131b2e]/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-900/20 antialiased">
                            <BotIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black uppercase tracking-tighter leading-none">Alice Bot</h1>
                            <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest mt-0.5">Guia de Comandos</p>
                        </div>
                    </div>

                    <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-xs font-bold">
                        <HomeIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Voltar ao Início</span>
                    </Link>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-6 py-12">
                {/* Hero Section */}
                <div className="text-center mb-16 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full -z-10"></div>
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">Como interagir com a Live?</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                        Use os comandos abaixo diretamente no chat do YouTube para entrar na fila, gerenciar seu progresso e se divertir com o streamer!
                    </p>
                </div>

                {/* Command Categories */}
                <div className="space-y-16">
                    {/* Fila & Participação */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px flex-grow bg-gradient-to-r from-transparent to-gray-200 dark:to-gray-800"></div>
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-cyan-500 whitespace-nowrap">Comandos de Fila</h2>
                            <div className="h-px flex-grow bg-gradient-to-l from-transparent to-gray-200 dark:to-gray-800"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <CommandCard
                                icon={<UsersIcon className="w-6 h-6" />}
                                title="Entrar na Fila"
                                command="!entrar [Nick]"
                                description="Entra na fila de espera. O seu nick do jogo é obrigatório para o streamer te identificar."
                                colorClass="bg-cyan-500"
                            />
                            <CommandCard
                                icon={<ChevronRightIcon className="w-6 h-6" />}
                                title="Ver Minha Posição"
                                command="!posicao"
                                description="Verifica em qual lugar da fila você está no momento."
                                colorClass="bg-cyan-500"
                            />
                            <CommandCard
                                icon={<CopyIcon className="w-6 h-6" />}
                                title="Mudar Apelido"
                                command="!nick [NovoNick]"
                                description="Atualiza o seu apelido de jogo na fila sem precisar sair dela."
                                colorClass="bg-cyan-500"
                            />
                            <CommandCard
                                icon={<MessageSquareIcon className="w-6 h-6" />}
                                title="Sair da Fila"
                                command="!sair"
                                description="Remove você da fila de espera ou da seção atual de jogo."
                                colorClass="bg-red-500"
                            />
                        </div>
                    </section>

                    {/* Informação & Status */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px flex-grow bg-gradient-to-r from-transparent to-gray-200 dark:to-gray-800"></div>
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-lime-400 whitespace-nowrap">Comandos de Status</h2>
                            <div className="h-px flex-grow bg-gradient-to-l from-transparent to-gray-200 dark:to-gray-800"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <CommandCard
                                icon={<Gamepad2Icon className="w-6 h-6" />}
                                title="Ver Próximos"
                                command="!fila"
                                description="Mostra a lista dos próximos jogadores que estão aguardando vez."
                                colorClass="bg-lime-500"
                            />
                            <CommandCard
                                icon={<SettingsIcon className="w-6 h-6" />}
                                title="Jogando Agora"
                                command="!jogando"
                                description="Lista todos os usuários que estão participando da partida atual."
                                colorClass="bg-lime-500"
                            />
                        </div>
                    </section>
                </div>

                {/* Footer Info */}
                <div className="mt-20 p-8 rounded-3xl bg-white dark:bg-[#131b2e] border border-gray-200 dark:border-gray-800 text-center">
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Importante! ⚠️</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm">
                        Alguns servidores podem ter o **Timer de Inatividade** ativado. Isso significa que se você não falar no chat por algum tempo, será removido automaticamente para dar vez a outros. Fique atento!
                    </p>
                </div>
            </main>

            <footer className="py-8 border-t border-gray-200 dark:border-gray-800 text-center">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                    Alice Bot &copy; {new Date().getFullYear()} - Sistema de Gerenciamento de Fila
                </p>
            </footer>
        </div>
    );
};

export default CommandsPage;
