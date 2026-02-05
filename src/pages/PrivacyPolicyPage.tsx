import React from 'react';
import { Link } from 'react-router-dom';
import { BotIcon } from '@/components/Icons';
import { useTheme } from '@/src/contexts/ThemeContext';

export const PrivacyPolicyPage: React.FC = () => {
    const { theme } = useTheme();

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans p-4 md:p-8`}>
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800/50 rounded-lg shadow-2xl p-6 md:p-8">
                <header className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <BotIcon className="w-8 h-8 text-cyan-500" />
                        <h1 className="text-2xl md:text-3xl font-bold">Política de Privacidade</h1>
                    </div>
                    <Link to="/" className="text-sm text-cyan-500 hover:underline">
                        Voltar ao Início
                    </Link>
                </header>

                <main className="pt-6 space-y-4 text-sm text-gray-600 dark:text-gray-300">
                    <p className="font-semibold">Última atualização: 05/02/2026</p>

                    <p>Agradecemos por usar o Gerenciador de Fila ("Aplicativo"). Esta Política de Privacidade explica como coletamos, usamos e protegemos suas informações quando você utiliza nossos serviços, em conformidade com as diretrizes do Google e YouTube.</p>

                    <h3 className="text-lg font-semibold pt-2">1. Informações que Coletamos</h3>
                    <p>Para fornecer nossos serviços, coletamos as seguintes informações:</p>
                    <ul className="list-disc list-inside pl-4 space-y-1">
                        <li><strong>Informações da Conta Google:</strong> Quando você faz login, usamos o serviço de autenticação do Supabase para acessar informações básicas do seu perfil Google, como nome e endereço de e-mail, para identificá-lo como o administrador do aplicativo.</li>
                        <li><strong>Token de Acesso do Google:</strong> Solicitamos um token de acesso temporário para interagir com a API do YouTube em seu nome, especificamente para encontrar o ID do chat da sua transmissão ao vivo ativa. Este token não é armazenado permanentemente em nossos servidores.</li>
                        <li><strong>Dados do Chat do YouTube:</strong> O aplicativo lê as mensagens públicas do chat ao vivo que você conecta, incluindo nomes de usuário e o conteúdo das mensagens, para poder gerenciar a fila de participantes.</li>
                    </ul>

                    <h3 className="text-lg font-semibold pt-2">2. Como Usamos Suas Informações</h3>
                    <p>Utilizamos as informações coletadas para:</p>
                    <ul className="list-disc list-inside pl-4 space-y-1">
                        <li>Autenticar seu acesso ao painel de controle.</li>
                        <li>Automatizar a busca pelo ID do seu chat ao vivo no YouTube.</li>
                        <li>Ler as mensagens do chat para identificar comandos e gerenciar a fila de usuários.</li>
                        <li>Armazenar a lista de usuários na fila e jogando em nosso banco de dados (Supabase) para manter o estado da aplicação.</li>
                    </ul>

                    <h3 className="text-lg font-semibold pt-2">3. Armazenamento e Segurança de Dados</h3>
                    <p>Os dados da fila e as configurações do aplicativo são armazenados de forma segura no banco de dados do Supabase associado a esta aplicação. Tomamos medidas razoáveis para proteger suas informações, mas nenhum sistema é 100% seguro.</p>

                    <h3 className="text-lg font-semibold pt-2">4. Compartilhamento e Serviços de Terceiros</h3>
                    <p>O Aplicativo utiliza os Serviços de API do YouTube para fornecer seus recursos principais. Ao utilizar este aplicativo, você também concorda em estar vinculado aos Termos de Serviço do YouTube e à <strong><a href="http://www.google.com/policies/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">Política de Privacidade do Google</a></strong>.</p>

                    <p>Não compartilhamos suas informações pessoais com terceiros, exceto conforme necessário para fornecer o serviço (por exemplo, interações com as APIs do Google/YouTube e armazenamento no Supabase).</p>

                    <h3 className="text-lg font-semibold pt-2">5. Uso de Cookies e Tecnologias de Rastreamento</h3>
                    <p>Nosso aplicativo e os serviços de terceiros que utilizamos (como Google Auth e YouTube API) podem colocar, acessar ou reconhecer cookies, web beacons ou tecnologias semelhantes em seu dispositivo ou navegador para coletar e armazenar informações sobre sua sessão e preferências.</p>

                    <h3 className="text-lg font-semibold pt-2">6. Seus Direitos e Exclusão de Dados</h3>
                    <p>Você pode, a qualquer momento, resetar a fila e os dados dos jogadores através do painel de administrador, o que removerá as informações do nosso banco de dados. Além disso, você pode revogar o acesso do Aplicativo aos seus dados através da página de configurações de segurança da sua conta Google.</p>

                    <h3 className="text-lg font-semibold pt-2">7. Informações de Contato</h3>
                    <p>Se você tiver dúvidas sobre esta Política de Privacidade ou sobre o tratamento de seus dados, entre em contato conosco através do e-mail: <span className="text-cyan-500 font-bold">canalobot@gmail.com</span></p>

                    <p className="italic mt-6 text-xs text-gray-500 dark:text-gray-400">
                        <strong>Aviso:</strong> Este é um modelo de política de privacidade. Recomenda-se que você revise este texto e, se necessário, consulte um profissional jurídico para garantir que ele atenda a todos os requisitos legais aplicáveis à sua situação.
                    </p>
                </main>
            </div>
        </div>
    );
};