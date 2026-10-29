import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppLayout({
  children,
  currentView,
  onNavigate,
  activeTab,
  onSelectTab,
  showSidebar = true
}) {
  return (
    <div className="crm-app-shell">
      <Navbar currentView={currentView} onNavigate={onNavigate} />
      <div className="crm-body-container">
        {showSidebar && (
          <Sidebar activeTab={activeTab} onSelectTab={onSelectTab} />
        )}
        <main className={`crm-main-content ${!showSidebar ? 'crm-main-content--full' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
