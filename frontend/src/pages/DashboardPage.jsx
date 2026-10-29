import React, { useState, useEffect } from 'react';
import {
  Users,
  Target,
  Briefcase,
  TrendingUp,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import MetricCard from '../components/dashboard/MetricCard';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { getCustomersApi, getLeadsApi, getDealMetricsApi } from '../services/api';
import { formatINR } from '../utils/currency';

export default function DashboardPage({ onNavigateTab }) {
  const { user } = useAuth();
  const [customerCount, setCustomerCount] = useState(0);
  const [leadCount, setLeadCount] = useState(0);
  const [dealMetrics, setDealMetrics] = useState(null);
  const [loadingCount, setLoadingCount] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [custRes, leadRes, metricsRes] = await Promise.all([
          getCustomersApi().catch(() => ({ data: { customers: [] } })),
          getLeadsApi().catch(() => ({ data: { leads: [] } })),
          getDealMetricsApi().catch(() => ({ data: { metrics: null } }))
        ]);

        if (custRes.data && custRes.data.customers) {
          setCustomerCount(custRes.data.customers.length);
        }

        if (leadRes.data && leadRes.data.leads) {
          setLeadCount(leadRes.data.leads.length);
        }

        if (metricsRes.data && metricsRes.data.metrics) {
          setDealMetrics(metricsRes.data.metrics);
        }
      } catch (err) {
        // Standalone fallback
      } finally {
        setLoadingCount(false);
      }
    }
    loadStats();
  }, []);

  const openPipelineValue = dealMetrics?.openPipelineValue ?? 0;
  const wonRevenue = dealMetrics?.wonRevenue ?? 0;

  const metricCards = [
    {
      title: 'Total Customers',
      value: loadingCount ? '...' : `${customerCount}`,
      subtitle: customerCount === 1 ? '1 active customer account' : `${customerCount} active customer accounts`,
      icon: Users,
      color: 'blue',
      onClick: () => onNavigateTab && onNavigateTab('customers')
    },
    {
      title: 'Active Leads',
      value: loadingCount ? '...' : `${leadCount}`,
      subtitle: leadCount === 1 ? '1 prospect in sales pipeline' : `${leadCount} prospects in sales pipeline`,
      icon: Target,
      color: 'emerald',
      onClick: () => onNavigateTab && onNavigateTab('leads')
    },
    {
      title: 'Open Pipeline Value',
      value: loadingCount ? '...' : formatINR(openPipelineValue),
      subtitle: `${dealMetrics?.openDeals ?? 0} active commercial opportunities`,
      icon: Briefcase,
      color: 'purple',
      onClick: () => onNavigateTab && onNavigateTab('deals')
    },
    {
      title: 'Realized Revenue (INR)',
      value: loadingCount ? '...' : formatINR(wonRevenue),
      subtitle: `${dealMetrics?.wonDeals ?? 0} deals secured (${dealMetrics?.winRate ?? 0}% deal success rate)`,
      icon: TrendingUp,
      color: 'amber',
      onClick: () => onNavigateTab && onNavigateTab('deals')
    }
  ];

  return (
    <div className="crm-dashboard-page">
      {/* Welcome Banner */}
      <div className="crm-dashboard-banner">
        <div className="crm-banner-content">
          <div className="crm-banner-badge">
            <span className="crm-banner-dot" />
            <span>CRM Dashboard</span>
          </div>
          <h1>Welcome back, {user?.name || 'CRM User'}!</h1>
          <p>
            You are logged into your AI-Powered Cloud CRM workspace with{' '}
            <strong className="text-brand">{user?.role === 'admin' ? 'System Administrator' : 'Sales Executive'}</strong>{' '}
            access. Manage contacts, track sales leads, advance deals through the pipeline, and monitor real-time business performance.
          </p>
        </div>
        <div className="crm-banner-meta">
          <div className="crm-meta-item">
            <span className="crm-meta-label">Workspace Status</span>
            <StatusBadge status="success" label="Active" />
          </div>
          <div className="crm-meta-item">
            <span className="crm-meta-label">Assigned Role</span>
            <span className="font-semibold text-brand">{user?.role === 'admin' ? 'Admin' : 'Sales Executive'}</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="crm-metrics-grid">
        {metricCards.map((metric, idx) => (
          <MetricCard
            key={idx}
            title={metric.title}
            value={metric.value}
            subtitle={metric.subtitle}
            icon={metric.icon}
            color={metric.color}
          />
        ))}
      </div>

      {/* Main Business Section */}
      <div className="crm-dashboard-main-grid">
        <div className="crm-dashboard-left-col">
          {/* Quick Module Navigation Card */}
          <Card
            title="CRM Modules & Operations"
            subtitle="Direct shortcuts to core business modules"
            icon={Briefcase}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--crm-bg-subtle)', borderRadius: 'var(--crm-radius-md)' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--crm-text-primary)' }}>Customers & Contacts</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--crm-text-muted)' }}>{customerCount} accounts registered with touchpoint logs</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateTab && onNavigateTab('customers')}
                  icon={ArrowRight}
                >
                  View
                </Button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--crm-bg-subtle)', borderRadius: 'var(--crm-radius-md)' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--crm-text-primary)' }}>Leads & Sales Pipeline</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--crm-text-muted)' }}>{leadCount} prospects with explainable score qualification</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateTab && onNavigateTab('leads')}
                  icon={ArrowRight}
                >
                  View
                </Button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--crm-bg-subtle)', borderRadius: 'var(--crm-radius-md)' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--crm-text-primary)' }}>Deals & Revenue Pipeline</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--crm-text-muted)' }}>{dealMetrics?.totalDeals ?? 0} commercial negotiations across Kanban stages</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateTab && onNavigateTab('deals')}
                  icon={ArrowRight}
                >
                  View
                </Button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--crm-bg-subtle)', borderRadius: 'var(--crm-radius-md)' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--crm-text-primary)' }}>AI Insights & Scoring</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--crm-text-muted)' }}>Deterministic qualification model & factor attribution</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateTab && onNavigateTab('ai')}
                  icon={ArrowRight}
                >
                  View
                </Button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--crm-bg-subtle)', borderRadius: 'var(--crm-radius-md)' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--crm-text-primary)' }}>Analytics & Reports</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--crm-text-muted)' }}>Real-time conversion funnels and financial KPIs</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateTab && onNavigateTab('analytics')}
                  icon={ArrowRight}
                >
                  View
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="crm-dashboard-right-col">
          {/* Pipeline Summary Card */}
          <Card
            title="Commercial Pipeline Summary"
            subtitle="Key performance metrics calculated from live deal data"
            icon={TrendingUp}
          >
            <div className="crm-env-details">
              <div className="crm-env-row">
                <span className="crm-env-key">Deal Success Rate:</span>
                <span className="crm-env-val font-semibold text-brand">
                  {dealMetrics?.winRate ?? 0}%
                </span>
              </div>
              <div className="crm-env-row">
                <span className="crm-env-key">Active Opportunities:</span>
                <span className="crm-env-val">
                  {dealMetrics?.openDeals ?? 0} deals
                </span>
              </div>
              <div className="crm-env-row">
                <span className="crm-env-key">Deals Secured:</span>
                <span className="crm-env-val text-emerald">
                  {dealMetrics?.wonDeals ?? 0} deals
                </span>
              </div>
              <div className="crm-env-row">
                <span className="crm-env-key">Average Deal Size:</span>
                <span className="crm-env-val font-mono">
                  {formatINR(dealMetrics?.avgDealSize ?? 0)}
                </span>
              </div>
              <div className="crm-env-row">
                <span className="crm-env-key">Deals Unsuccessful:</span>
                <span className="crm-env-val text-muted">
                  {dealMetrics?.lostDeals ?? 0} deals
                </span>
              </div>
            </div>
          </Card>

          {/* User Account Profile Card */}
          <Card
            title="User Account Session"
            subtitle="Authenticated CRM user profile"
            icon={UserCheck}
            className="mt-4"
          >
            <div className="crm-env-details">
              <div className="crm-env-row">
                <span className="crm-env-key">Full Name:</span>
                <span className="crm-env-val">{user?.name || '---'}</span>
              </div>
              <div className="crm-env-row">
                <span className="crm-env-key">Email:</span>
                <span className="crm-env-val">{user?.email || '---'}</span>
              </div>
              <div className="crm-env-row">
                <span className="crm-env-key">Assigned Role:</span>
                <span className="crm-env-val">{user?.role === 'admin' ? 'System Administrator' : 'Sales Executive'}</span>
              </div>
              <div className="crm-env-row">
                <span className="crm-env-key">Access Permissions:</span>
                <span className="crm-env-val">{user?.role === 'admin' ? 'Full System & Deletion Access' : 'Standard Sales Pipeline Access'}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
