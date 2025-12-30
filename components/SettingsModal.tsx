import React, { useState, useEffect } from 'react';
import type { AppSettings, CustomCommand } from '../types';
import { SettingsIcon, XIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onReset: () => void;
  isInline?: boolean;
  initialTab?: string;
}

type SettingsSection = 'commands' | 'messages';
type GeneralKey = 'botName';
type CommandKey = keyof AppSettings['commands'];
type MessageKey = keyof AppSettings['messages'];

const translations = {
  commands: {
    join: 'Comando: Entrar na Fila',
    leave: 'Comando: Sair da Fila',
    position: 'Comando: Verificar Posição',
    nick: 'Comando: Atualizar Apelido',
    next: 'Comando Admin: Próximo',
    reset: 'Comando Admin: Resetar Fila',
    timerOn: 'Comando Admin: Ativar Timer',
    timerOff: 'Comando Admin: Desativar Timer',
    queueList: 'Comando Público: Listar Fila',
    playingList: 'Comando Público: Listar Jogadores',
    loyaltyPoints: 'Comando Público: Saldo de Pontos',
  },
  messages: {
    userExistsQueue: 'Usuário já existe na fila',
    userExistsPlaying: 'Usuário já está jogando',
    userJoined: 'Usuário entrou na fila',
    joinWithTimer: 'Aviso ao entrar com timer ativo',
    userPosition: 'Posição do usuário na fila',
    userIsPlaying: 'Usuário está jogando (comando !posição)',
    notInQueue: 'Usuário não está na fila',
    userLeft: 'Usuário saiu da fila',
    userNicknameUpdated: 'Apelido do usuário atualizado',
    nextUser: 'Anúncio do próximo usuário',
    nextInQueue: 'Anúncio do seguinte na fila',
    queueEmpty: 'Fila vazia (para !proximo)',
    reset: 'Fila resetada',
    timerOn: 'Timer de inatividade ativado',
    timerOff: 'Timer de inatividade desativado',
    removedForInactivityQueue: 'Usuário removido por inatividade',
    thirtySecondWarning: 'Aviso de 30 segundos restantes',
    queueList: 'Resposta para !fila',
    queueListEmpty: 'Resposta para !fila (vazia)',
    playingList: 'Resposta para !jogando',
    playingListEmpty: 'Resposta para !jogando (vazio)',
    loyaltyPoints: 'Resposta para !pontos',
  },
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, onReset, isInline, initialTab }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [openSections, setOpenSections] = useState({
    commands: initialTab === 'commands',
    messages: initialTab === 'messages',
    customCommands: initialTab === 'customCommands'
  });

  useEffect(() => {
    setLocalSettings(settings);
    if (initialTab) {
      setOpenSections(prev => ({ ...prev, [initialTab]: true }));
    }
  }, [settings, isOpen, initialTab]);

  if (!isOpen && !isInline) {
    return null;
  }

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleGeneralInputChange = (key: GeneralKey, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCommandChange = (key: CommandKey, field: 'command' | 'enabled', value: string | boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      commands: {
        ...prev.commands,
        [key]: {
          ...prev.commands[key],
          [field]: value,
        },
      },
    }));
  };

  const handleMessageChange = (key: MessageKey, field: 'text' | 'enabled', value: string | boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      messages: {
        ...prev.messages,
        [key]: {
          ...prev.messages[key],
          [field]: value,
        },
      },
    }));
  };

  const handleCustomCommandChange = (index: number, field: keyof CustomCommand, value: string) => {
    const newCustomCommands = [...localSettings.customCommands];
    newCustomCommands[index] = { ...newCustomCommands[index], [field]: value };
    setLocalSettings(prev => ({ ...prev, customCommands: newCustomCommands }));
  };

  const addCustomCommand = () => {
    setLocalSettings(prev => ({
      ...prev,
      customCommands: [...prev.customCommands, { command: '', response: '' }],
    }));
  };

  const removeCustomCommand = (index: number) => {
    setLocalSettings(prev => ({
      ...prev,
      customCommands: prev.customCommands.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  const renderMessageSetting = (key: MessageKey) => {
    const messageSetting = localSettings.messages[key];
    return (
      <div key={key}>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor={`message-text-${key}`} className="block text-sm font-medium text-gray-500 dark:text-[#8bcbd5]">
            {translations.messages[key] || key}
          </label>
          <label htmlFor={`message-enabled-${key}`} className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                id={`message-enabled-${key}`}
                type="checkbox"
                className="sr-only"
                checked={messageSetting.enabled}
                onChange={(e) => handleMessageChange(key, 'enabled', e.target.checked)}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${messageSetting.enabled ? 'bg-cyan-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`dot absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${messageSetting.enabled ? 'translate-x-4' : ''}`}></div>
            </div>
          </label>
        </div>
        <textarea
          id={`message-text-${key}`}
          value={messageSetting.text}
          onChange={(e) => handleMessageChange(key, 'text', e.target.value)}
          className="w-full bg-gray-50 dark:bg-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          rows={2}
          disabled={!messageSetting.enabled}
        />
      </div>
    );
  };

  const renderCommandSetting = (key: CommandKey) => {
    const commandSetting = localSettings.commands[key];
    return (
      <div key={key}>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor={`command-text-${key}`} className="block text-sm font-medium text-gray-500 dark:text-[#8bcbd5]">
            {translations.commands[key] || key}
          </label>
          <label htmlFor={`command-enabled-${key}`} className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                id={`command-enabled-${key}`}
                type="checkbox"
                className="sr-only"
                checked={commandSetting.enabled}
                onChange={(e) => handleCommandChange(key, 'enabled', e.target.checked)}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${commandSetting.enabled ? 'bg-cyan-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <div className={`dot absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${commandSetting.enabled ? 'translate-x-4' : ''}`}></div>
            </div>
          </label>
        </div>
        <input
          id={`command-text-${key}`}
          type="text"
          value={commandSetting.command}
          onChange={(e) => handleCommandChange(key, 'command', e.target.value)}
          className="w-full bg-gray-50 dark:bg-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!commandSetting.enabled}
        />
      </div>
    );
  };

  const content = (
    <div className={`${isInline ? '' : 'bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-gray-800 dark:text-gray-200'}`}>
      {!isInline && (
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <SettingsIcon />
            Configurações
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <XIcon className="w-6 h-6" />
          </button>
        </header>
      )}

      <main className={`${isInline ? 'space-y-6' : 'p-6 overflow-y-auto space-y-6 bg-gray-50 dark:bg-gray-800/50'}`}>
        <section>
          <h3 className="text-lg font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 text-gray-900 dark:text-[#8bcbd5]">Geral</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="botName" className="block text-sm font-medium text-gray-500 dark:text-[#8bcbd5] mb-1">
                Nome do Bot
              </label>
              <input
                id="botName"
                type="text"
                value={localSettings.botName}
                onChange={(e) => handleGeneralInputChange('botName', e.target.value)}
                className="w-full bg-white dark:bg-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm"
              />
            </div>
          </div>
        </section>

        <section>
          <button onClick={() => toggleSection('commands')} className="w-full flex items-center justify-between text-lg font-semibold mb-2 border-b border-gray-200 dark:border-gray-700 pb-2 focus:outline-none text-gray-900 dark:text-[#8bcbd5]">
            <span>Comandos Padrão</span>
            {openSections.commands ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
          </button>
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSections.commands ? 'max-h-[2000px] opacity-100 pt-2' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-4">
              {Object.keys(localSettings.commands).map((key) => renderCommandSetting(key as CommandKey))}
            </div>
          </div>
        </section>

        <section>
          <button onClick={() => toggleSection('messages')} className="w-full flex items-center justify-between text-lg font-semibold mb-2 border-b border-gray-200 dark:border-gray-700 pb-2 focus:outline-none text-gray-900 dark:text-[#8bcbd5]">
            <span>Mensagens do Bot</span>
            {openSections.messages ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
          </button>
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSections.messages ? 'max-h-[2000px] opacity-100 pt-2' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-4">
              {Object.keys(localSettings.messages).map((key) => renderMessageSetting(key as MessageKey))}
            </div>
          </div>
        </section>

        <section>
          <button onClick={() => toggleSection('customCommands')} className="w-full flex items-center justify-between text-lg font-semibold mb-2 border-b border-gray-200 dark:border-gray-700 pb-2 focus:outline-none text-gray-900 dark:text-[#8bcbd5]">
            <span>Comandos Personalizados</span>
            {openSections.customCommands ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
          </button>
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSections.customCommands ? 'max-h-[2000px] opacity-100 pt-2' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-4">
              {localSettings.customCommands.map((cmd, index) => (
                <div key={index} className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-md space-y-2 relative">
                  <button onClick={() => removeCustomCommand(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-[#8bcbd5] mb-1">Comando (ex: !social)</label>
                    <input
                      type="text"
                      value={cmd.command}
                      onChange={(e) => handleCustomCommandChange(index, 'command', e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-[#8bcbd5] mb-1">Resposta do Bot</label>
                    <textarea
                      value={cmd.response}
                      onChange={(e) => handleCustomCommandChange(index, 'response', e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
              <button onClick={addCustomCommand} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
                Adicionar Comando
              </button>
            </div>
          </div>
        </section>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center">
          Variáveis disponíveis: {'{user}'}, {'{position}'}, {'{join}'}, {'{minutes}'}, {'{nickname}'}, {'{points}'}
        </p>
      </main>

      <footer className={`flex items-center justify-end gap-4 border-t border-gray-200 dark:border-gray-700 ${isInline ? 'pt-6' : 'p-4 bg-white dark:bg-gray-800/50'}`}>
        <button
          onClick={handleReset}
          className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-md transition duration-300"
        >
          Resetar para o Padrão
        </button>
        <button
          onClick={handleSave}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
        >
          {isInline ? 'Salvar Alterações' : 'Salvar e Fechar'}
        </button>
      </footer>
    </div>
  );

  if (isInline) return content;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {content}
    </div>
  );
};