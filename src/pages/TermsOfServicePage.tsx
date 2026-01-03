import React from 'react';
import { Link } from 'react-router-dom';
import { BotIcon } from '@/components/Icons';
import { useTheme } from '@/src/contexts/ThemeContext';

export const TermsOfServicePage: React.FC = () => {
    const { theme } = useTheme();

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans p-4 md:p-8`}>
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800/50 rounded-lg shadow-2xl p-6 md:p-8">
                <header className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <BotIcon className="w-8 h-8 text-cyan-500" />
                        <h1 className="text-2xl md:text-3xl font-bold">Termos de Serviço</h1>
                    </div>
                    <Link to="/" className="text-sm text-cyan-500 hover:underline">
                        Voltar ao Início
                    </Link>
                </header>

                <main className="pt-6 space-y-4 text-sm text-gray-600 dark:text-gray-300">
                    <p className="font-semibold">Última atualização: 03/01/2026</p>

                    <p>Bem-vindo ao Gerenciador de Fila ("Aplicativo"). Ao usar nosso aplicativo, você concorda com estes Termos de Serviço.</p>

                    <h3 className="text-lg font-semibold pt-2">1. Uso do Aplicativo</h3>
                    <p>Este aplicativo foi projetado para ajudar criadores de conteúdo a gerenciar uma fila de participantes durante transmissões ao vivo no YouTube. Você concorda em usar o aplicativo apenas para os fins a que se destina e em conformidade com todas as leis aplicáveis.</p>

                    <h3 className="text-lg font-semibold pt-2">2. Conta de Usuário</h3>
                    <p>Para usar o painel de administrador, você deve se autenticar usando sua conta Google. Você é responsável por manter a segurança de sua conta e por todas as atividades que ocorrem sob sua conta.</p>

                    <h3 className="text-lg font-semibold pt-2">3. Conexão com o YouTube</h3>
                    <p>O aplicativo requer acesso à API do YouTube para ler mensagens do chat ao vivo e identificar sua transmissão ativa. Ao usar esses recursos, você concorda com os <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">Termos de Serviço do YouTube</a>.</p>

                    <h3 className="text-lg font-semibold pt-2">4. Conduta do Usuário</h3>
                    <p>Você concorda em não usar o aplicativo para:</p>
                    <ul className="list-disc list-inside pl-4 space-y-1">
                        <li>Qualquer finalidade ilegal ou não autorizada.</li>
                        <li>Coletar informações de usuários do chat de forma indevida.</li>
                        <li>Interferir ou interromper o serviço ou os servidores.</li>
                    </ul>

                    <h3 className="text-lg font-semibold pt-2">5. Limitação de Responsabilidade</h3>
                    <p>O aplicativo é fornecido "como está", sem garantias de qualquer tipo. Não nos responsabilizamos por qualquer perda de dados, interrupção de serviço ou qualquer outro dano que possa ocorrer pelo uso do aplicativo.</p>

                    <h3 className="text-lg font-semibold pt-2">6. Modificações nos Termos</h3>
                    <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos sobre quaisquer alterações, publicando os novos termos no aplicativo. Seu uso continuado do aplicativo após tais alterações constitui sua aceitação dos novos termos.</p>
                </main>
            </div>
        </div>
    );
};