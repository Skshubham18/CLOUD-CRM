import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import LeadsPage from './pages/LeadsPage';
import DealsPage from './pages/DealsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AIInsightsPage from './pages/AIInsightsPage';

function AppContent() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'auth' | 'app'
  const [authInitialMode, setAuthInitialMode] = useState('login');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'analytics' | 'leads' | 'ai' | 'deals' | 'customers'
  const { isAuthenticated, isLoading } = useAuth();

  const handleNavigate = (view) => {
    if (view === 'auth-register') {
      setAuthInitialMode('register');
      setCurrentView('auth');
    } else if (view === 'auth-login' || view === 'auth') {
      setAuthInitialMode('login');
      setCurrentView('auth');
    } else if (view === 'dashboard' || view === 'app') {
      if (!isAuthenticated) {
        setAuthInitialMode('login');
        setCurrentView('auth');
      } else {
        setCurrentView('app');
        setActiveTab('overview');
      }
    } else if (view === 'analytics') {
      if (!isAuthenticated) {
        setAuthInitialMode('login');
        setCurrentView('auth');
      } else {
        setCurrentView('app');
        setActiveTab('analytics');
      }
    } else if (view === 'leads') {
      if (!isAuthenticated) {
        setAuthInitialMode('login');
        setCurrentView('auth');
      } else {
        setCurrentView('app');
        setActiveTab('leads');
      }
    } else if (view === 'ai') {
      if (!isAuthenticated) {
        setAuthInitialMode('login');
        setCurrentView('auth');
      } else {
        setCurrentView('app');
        setActiveTab('ai');
      }
    } else if (view === 'deals') {
      if (!isAuthenticated) {
        setAuthInitialMode('login');
        setCurrentView('auth');
      } else {
        setCurrentView('app');
        setActiveTab('deals');
      }
    } else if (view === 'customers') {
      if (!isAuthenticated) {
        setAuthInitialMode('login');
        setCurrentView('auth');
      } else {
        setCurrentView('app');
        setActiveTab('customers');
      }
    } else {
      setCurrentView(view);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
  };

  if (isLoading) {
    return (
      <div className="crm-loading-screen">
        <div className="crm-loading-spinner" />
        <p>Verifying secure CRM session...</p>
      </div>
    );
  }

  return (
    <AppLayout
      currentView={currentView === 'app' ? 'dashboard' : currentView}
      onNavigate={handleNavigate}
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      showSidebar={currentView === 'app' && isAuthenticated}
    >
      {currentView === 'landing' && (
        <LandingPage
          onNavigateToAuth={(mode) => {
            setAuthInitialMode(mode);
            setCurrentView('auth');
          }}
          onNavigateToDashboard={() => handleNavigate('app')}
        />
      )}

      {currentView === 'auth' && (
        <AuthPage
          initialMode={authInitialMode}
          onAuthSuccess={() => {
            setCurrentView('app');
            setActiveTab('overview');
          }}
          onBackToLanding={() => setCurrentView('landing')}
        />
      )}

      {currentView === 'app' && (
        !isAuthenticated ? (
          <AuthPage
            initialMode="login"
            onAuthSuccess={() => {
              setCurrentView('app');
              setActiveTab('overview');
            }}
            onBackToLanding={() => setCurrentView('landing')}
          />
        ) : activeTab === 'analytics' ? (
          <AnalyticsPage onNavigateTab={handleSelectTab} />
        ) : activeTab === 'leads' ? (
          <LeadsPage onNavigateTab={handleSelectTab} />
        ) : activeTab === 'ai' ? (
          <AIInsightsPage onNavigateTab={handleSelectTab} />
        ) : activeTab === 'deals' ? (
          <DealsPage onNavigateTab={handleSelectTab} />
        ) : activeTab === 'customers' ? (
          <CustomersPage />
        ) : (
          <DashboardPage onNavigateTab={handleSelectTab} />
        )
      )}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="crm-app">
        <AppContent />
      </div>
    </AuthProvider>
  );
}
