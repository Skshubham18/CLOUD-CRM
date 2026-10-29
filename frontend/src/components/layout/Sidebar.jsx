import React from 'react';
import {
  LayoutDashboard,
  Users,
  Target,
  Briefcase,
  BarChart3,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ activeTab = 'overview', onSelectTab }) {
  const menuSections = [
    {
      title: 'Navigation',
      items: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
        { id: 'leads', label: 'Leads & Pipeline', icon: Target },
        { id: 'ai', label: 'AI Insights & Scoring', icon: Sparkles },
        { id: 'deals', label: 'Deals & Revenue', icon: Briefcase },
        { id: 'customers', label: 'Customers & Contacts', icon: Users },
      ]
    }
  ];

  return (
    <aside className="crm-sidebar">
      <div className="crm-sidebar-header">
        <div className="crm-sidebar-badge">
          <ShieldCheck size={16} className="text-emerald" />
          <span>Workspace</span>
        </div>
      </div>

      <nav className="crm-sidebar-nav">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="crm-nav-group">
            <div className="crm-nav-group-title">{section.title}</div>
            <ul className="crm-nav-list">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelectTab && onSelectTab(item.id)}
                      className={`crm-nav-item ${isActive ? 'active' : ''}`}
                      title={item.label}
                    >
                      <div className="crm-nav-item-left">
                        <Icon size={18} className="crm-nav-icon" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`crm-nav-badge crm-nav-badge--${item.status || 'default'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="crm-sidebar-footer">
        <div className="crm-project-meta">
          <div className="crm-project-meta-title">AI-Powered Cloud CRM</div>
          <div className="crm-project-meta-sub">Small Business Edition</div>
        </div>
      </div>
    </aside>
  );
}
