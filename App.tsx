import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSession } from './src/contexts/SessionContext';
import { LoginPage } from './src/pages/LoginPage';
import { HomePage } from './src/pages/HomePage';
import { PrivacyPolicyPage } from './src/pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './src/pages/TermsOfServicePage';

const AppRoutes: React.FC = () => {
    const { session, loading } = useSession();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
            </div>
        );
    }

    if (!session) {
        return <LoginPage />;
    }

    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
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