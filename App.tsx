import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSession } from './src/contexts/SessionContext';
import { LoginPage } from './src/pages/LoginPage';
import { HomePage } from './src/pages/HomePage';
import { CommandsPage } from './src/pages/CommandsPage';
import { PrivacyPolicyPage } from './src/pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './src/pages/TermsOfServicePage';
import { OBSLikesPage } from './src/pages/OBSLikesPage';
import { OBSAlertsPage } from './src/pages/OBSAlertsPage';

const AppRoutes: React.FC = () => {
    const { session, loading } = useSession();

    const isPublicRoute = window.location.pathname.startsWith('/obs/') ||
        window.location.pathname === '/privacy' ||
        window.location.pathname === '/terms';

    if (loading && !isPublicRoute) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Carregando...</p>
                </div>
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
            <Route path="/obs/alerts/:userId" element={<OBSAlertsPage />} />
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