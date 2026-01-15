import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSession } from './src/contexts/SessionContext';
import { LoginPage } from './src/pages/LoginPage';
import { HomePage } from './src/pages/HomePage';
import { CommandsPage } from './src/pages/CommandsPage';
import { PrivacyPolicyPage } from './src/pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './src/pages/TermsOfServicePage';
import { OBSLikesPage } from './src/pages/OBSLikesPage';

const AppRoutes: React.FC = () => {
    const { session, loading } = useSession();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/" element={session ? <HomePage /> : <LoginPage />} />
            <Route path="/comandos" element={<CommandsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/obs/likes/:userId" element={<OBSLikesPage />} />
        </Routes>
    );
};

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
};

export default App;