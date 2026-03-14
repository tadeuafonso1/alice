import React from 'react';
import { RocketIcon } from './Icons';

export const AlertsTab: React.FC = () => {
    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-cyan-500/10 rounded-xl">
                    <RocketIcon className="w-8 h-8 text-cyan-500" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold">Alertas OBS (Em Breve)</h3>
                    <p className="text-gray-500 dark:text-gray-400">Configure os alertas que aparecem na sua tela via OBS.</p>
                </div>
            </div>

            <div className="p-6 bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-500/20 rounded-2xl flex items-start gap-4">
                <div className="p-2 bg-white dark:bg-[#1E293B] rounded-lg shadow-sm flex-shrink-0">
                    <RocketIcon className="w-6 h-6 text-cyan-500" />
                </div>
                <div>
                    <h5 className="font-bold text-cyan-900 dark:text-cyan-100 mb-1">Recurso em Desenvolvimento</h5>
                    <p className="text-sm text-cyan-800 dark:text-cyan-200 opacity-80">
                        Esta área será usada para gerar as URLs dos alertas (Browser Source) e testar animações para inscritos, membros e doações quando a integração for concluída.
                    </p>
                </div>
            </div>
        </div>
    );
};
