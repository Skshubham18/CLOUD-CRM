import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Briefcase,
  DollarSign,
  PieChart,
  Calendar,
  Filter,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  Award,
  Zap,
  Clock,
  Building,
  Percent
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import { getDashboardAnalyticsApi } from '../services/api';
import { formatINR, formatINRLakhCrore } from '../utils/currency';

const TIME_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '180d', label: 'Last 6 Months' },
  { value: 'this_year', label: 'This Year' }
];

export default function AnalyticsPage({ onNavigateTab }) {
  const [timeRange, setTimeRange] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await getDashboardAnalyticsApi({ timeRange });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Unable to fetch analytics data from PostgreSQL server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const kpis = data?.overview || {};
  const leads = data?.leads || {};
  const deals = data?.deals || {};

  // Color helpers for stages
  const getStageColor = (stage) => {
    const s = String(stage).toLowerCase();
    if (s === 'won') return '#10B981';
    if (s === 'proposal') return '#6366F1';
    if (s === 'negotiation') return '#8B5CF6';
    if (s === 'qualification') return '#F59E0B';
    if (s === 'lost') return '#EF4444';
    return '#64748B';
  };

  // Label helper for stages
  const formatStageLabel = (stage) => {
    const s = String(stage).toLowerCase();
    if (s === 'won') return 'Deal Secured';
    if (s === 'lost') return 'Deal Unsuccessful';
    return stage;
  };

  // Color helpers for lead statuses
  const getStatusColor = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'won') return '#10B981';
    if (s === 'proposal') return '#6366F1';
    if (s === 'qualified') return '#F59E0B';
    if (s === 'contacted') return '#8B5CF6';
    if (s === 'new') return '#3B82F6';
    if (s === 'lost') return '#EF4444';
    return '#64748B';
  };

  return (
    <div className="crm-analytics-page">
      {/* Header Section */}
      <div className="crm-page-header">
        <div>
          <div className="crm-page-badge">
            <span className="crm-page-badge-dot" />
            <span>Business Intelligence</span>
          </div>
          <h1>Analytics & Reporting Dashboard</h1>
          <p className="crm-page-subtitle">
            Real-time business intelligence, conversion funnels, pipeline velocity, and revenue attribution
          </p>
        </div>

        {/* Time Range & Controls */}
        <div className="crm-analytics-controls">
          <div className="crm-time-filter-group">
            <Calendar size={15} className="text-muted" />
            <select
              className="crm-time-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              disabled={loading || refreshing}
            >
              {TIME_RANGES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="crm-refresh-btn"
            onClick={() => fetchAnalytics(true)}
            disabled={loading || refreshing}
            title="Refresh analytics metrics"
          >
            <RefreshCw size={15} className={refreshing ? 'crm-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="crm-banner-alert crm-banner-alert--error mb-4">
          <div className="crm-banner-alert-content">
            <AlertCircle size={18} className="text-rose" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchAnalytics()}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="crm-table-loading" style={{ minHeight: '320px' }}>
          <RefreshCw size={28} className="crm-spin text-brand" />
          <p>Aggregating live CRM metrics from PostgreSQL database...</p>
        </div>
      ) : (
        <>
          {/* =========================================================================
              1. TOP KPI METRICS GRID
              ========================================================================= */}
          <div className="crm-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            {/* KPI 1: Realized Revenue */}
            <div className="crm-stat-card crm-stat-card--revenue">
              <div className="crm-stat-label">Realized Revenue (INR)</div>
              <div className="crm-stat-value" style={{ color: '#10B981' }}>
                {formatINR(kpis.wonRevenue || 0)}
              </div>
              <div className="crm-stat-sub">
                {kpis.wonDeals || 0} deals secured ({formatINRLakhCrore(kpis.wonRevenue || 0)})
              </div>
            </div>

            {/* KPI 2: Open Pipeline Value */}
            <div className="crm-stat-card">
              <div className="crm-stat-label">Open Pipeline Value</div>
              <div className="crm-stat-value" style={{ color: 'var(--crm-brand)' }}>
                {formatINR(kpis.openPipelineValue || 0)}
              </div>
              <div className="crm-stat-sub">
                {kpis.openDeals || 0} deals active in negotiation
              </div>
            </div>

            {/* KPI 3: Lead Conversion Rate */}
            <div className="crm-stat-card">
              <div className="crm-stat-label">Lead Conversion Rate</div>
              <div className="crm-stat-value" style={{ color: '#6366F1' }}>
                {kpis.leadConversionRate || 0}%
              </div>
              <div className="crm-stat-sub">
                {kpis.convertedLeads || 0} of {kpis.totalLeads || 0} leads converted
              </div>
            </div>

            {/* KPI 4: Deal Success Rate */}
            <div className="crm-stat-card">
              <div className="crm-stat-label">Deal Success Rate</div>
              <div className="crm-stat-value" style={{ color: '#F59E0B' }}>
                {kpis.dealWinRate || 0}%
              </div>
              <div className="crm-stat-sub">
                {kpis.wonDeals || 0} deals secured / {kpis.closedDeals || 0} closed deals
              </div>
            </div>

            {/* KPI 5: Active Customers */}
            <div className="crm-stat-card">
              <div className="crm-stat-label">Total Customers</div>
              <div className="crm-stat-value">
                {kpis.totalCustomers || 0}
              </div>
              <div className="crm-stat-sub">
                {kpis.activeCustomers || 0} active accounts
              </div>
            </div>

            {/* KPI 6: Total Leads */}
            <div className="crm-stat-card">
              <div className="crm-stat-label">Total Leads</div>
              <div className="crm-stat-value">
                {kpis.totalLeads || 0}
              </div>
              <div className="crm-stat-sub">
                {formatINR(kpis.totalLeadEstimatedValue || 0)} total pipeline potential
              </div>
            </div>
          </div>

          {/* =========================================================================
              2. PIPELINE FUNNEL & REVENUE ATTRIBUTION
              ========================================================================= */}
          <div className="crm-analytics-grid-two mt-4">
            {/* Deal Stage Breakdown Card */}
            <Card
              title="Sales Pipeline Velocity & Stages"
              subtitle="Value and volume distribution across commercial deal stages"
              icon={Briefcase}
            >
              {deals.dealsByStage && deals.dealsByStage.length > 0 ? (
                <div className="crm-stage-funnel-list">
                  {deals.dealsByStage.map((stg, idx) => {
                    const barPct = stg.percentageValue || 0;
                    const stageColor = getStageColor(stg.stage);

                    return (
                      <div key={idx} className="crm-funnel-stage-row">
                        <div className="crm-funnel-stage-info">
                          <div className="crm-funnel-stage-name">
                            <span className="crm-status-dot" style={{ background: stageColor }} />
                            <strong>{formatStageLabel(stg.stage)}</strong>
                            <span className="crm-funnel-count-pill">{stg.count} deals</span>
                          </div>
                          <div className="crm-funnel-stage-val">
                            <strong>{formatINR(stg.totalValue)}</strong>
                            <span className="crm-funnel-pct">({stg.percentageValue}% of pipeline)</span>
                          </div>
                        </div>

                        <div className="crm-factor-bar-track" style={{ height: '8px', background: '#F1F5F9' }}>
                          <div
                            className="crm-factor-bar-fill"
                            style={{
                              width: `${Math.max(barPct, 3)}%`,
                              backgroundColor: stageColor
                            }}
                          />
                        </div>

                        <div className="crm-funnel-stage-meta">
                          <span>Avg Deal: {formatINR(stg.avgValue)}</span>
                          <span>{stg.percentageCount}% of total deal count</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="crm-table-empty" style={{ padding: '2rem 1rem' }}>
                  <Briefcase size={32} className="text-muted mb-2" />
                  <p>No deals recorded yet for this timeframe.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigateTab && onNavigateTab('deals')}
                  >
                    Open Deals Module
                  </Button>
                </div>
              )}
            </Card>

            {/* Revenue vs Pipeline Summary Card */}
            <Card
              title="Revenue vs. Open Pipeline Summary"
              subtitle="Comparison of recognized income versus prospective pipeline"
              icon={TrendingUp}
            >
              <div className="crm-revenue-comparison-box">
                {/* Realized Revenue Block */}
                <div className="crm-rev-block crm-rev-block--won">
                  <div className="crm-rev-block-header">
                    <CheckCircle2 size={16} className="text-emerald" />
                    <span>Realized Revenue (INR)</span>
                  </div>
                  <div className="crm-rev-block-amount text-emerald">
                    {formatINR(kpis.wonRevenue || 0)}
                  </div>
                  <div className="crm-rev-block-note">
                    {kpis.wonDeals || 0} deals secured (100% realized)
                  </div>
                </div>

                {/* Open Pipeline Block */}
                <div className="crm-rev-block crm-rev-block--open">
                  <div className="crm-rev-block-header">
                    <Clock size={16} className="text-brand" />
                    <span>Active Open Pipeline</span>
                  </div>
                  <div className="crm-rev-block-amount text-brand">
                    {formatINR(kpis.openPipelineValue || 0)}
                  </div>
                  <div className="crm-rev-block-note">
                    {kpis.openDeals || 0} active proposals in negotiation
                  </div>
                </div>
              </div>

              {/* Deal Size Metrics Table */}
              <div className="crm-mini-metrics-table">
                <div className="crm-mini-metric-row">
                  <span className="text-secondary">Average Deal Size</span>
                  <strong>{formatINR(deals.summary?.avgDealSize || 0)}</strong>
                </div>
                <div className="crm-mini-metric-row">
                  <span className="text-secondary">Maximum Deal Value</span>
                  <strong>{formatINR(deals.summary?.maxDealSize || 0)}</strong>
                </div>
                <div className="crm-mini-metric-row">
                  <span className="text-secondary">Total Deals Evaluated</span>
                  <strong>{kpis.totalDeals || 0}</strong>
                </div>
                <div className="crm-mini-metric-row">
                  <span className="text-secondary">Unsuccessful Deals Value</span>
                  <span style={{ color: '#EF4444', fontWeight: 700 }}>
                    {formatINR(kpis.lostDealValue || 0)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* =========================================================================
              3. LEAD ACQUISITION & PRIORITY DISTRIBUTION
              ========================================================================= */}
          <div className="crm-analytics-grid-two mt-4">
            {/* Lead Priority Distribution */}
            <Card
              title="Lead Quality & Priority Distribution"
              subtitle="Evaluated by Explainable Lead Scoring Engine"
              icon={Sparkles}
            >
              <div className="crm-priority-dist-container">
                <div className="crm-priority-cards-row">
                  {leads.priorityDistribution?.map((prio, idx) => (
                    <div
                      key={idx}
                      className="crm-priority-summary-card"
                      style={{ borderTop: `3px solid ${prio.color}` }}
                    >
                      <div className="crm-prio-card-header">
                        <strong style={{ color: prio.color }}>{prio.priority} Priority</strong>
                        <span className="crm-prio-range-pill">{prio.minScore}–{prio.maxScore} pts</span>
                      </div>
                      <div className="crm-prio-card-num">{prio.count}</div>
                      <div className="crm-prio-card-sub">
                        {prio.percentage}% of leads • {formatINR(prio.totalValue)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="crm-ai-engine-footer-note">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Award size={14} className="text-purple" />
                    <strong>Average Pipeline Lead Score:</strong>
                    <span className="crm-score-badge-inline">{leads.avgLeadScore || 0} / 100 pts</span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--crm-text-muted)' }}>
                    Computed via 5 deterministic baseline factors (Qualification, Contact, Company, Channel, Deal Value)
                  </span>
                </div>
              </div>
            </Card>

            {/* Leads by Acquisition Source */}
            <Card
              title="Lead Acquisition Source Channels"
              subtitle="Performance and conversion rate by inbound and outbound channels"
              icon={Layers}
            >
              {leads.leadsBySource && leads.leadsBySource.length > 0 ? (
                <div className="crm-source-breakdown-list">
                  {leads.leadsBySource.map((src, idx) => (
                    <div key={idx} className="crm-source-item-row">
                      <div className="crm-source-item-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span className="crm-source-dot" />
                          <strong>{src.source}</strong>
                          <span className="crm-source-count-tag">{src.count} leads</span>
                        </div>
                        <div className="crm-source-item-right">
                          <span>{src.conversionRate}% converted</span>
                          <strong style={{ marginLeft: '0.5rem' }}>{formatINR(src.totalValue)}</strong>
                        </div>
                      </div>

                      <div className="crm-factor-bar-track" style={{ height: '6px' }}>
                        <div
                          className="crm-factor-bar-fill"
                          style={{
                            width: `${Math.max(src.percentage, 4)}%`,
                            backgroundColor: 'var(--crm-brand)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="crm-table-empty" style={{ padding: '2rem 1rem' }}>
                  <Target size={32} className="text-muted mb-2" />
                  <p>No leads registered yet for this timeframe.</p>
                </div>
              )}
            </Card>
          </div>

          {/* =========================================================================
              4. LEAD STATUS FUNNEL BREAKDOWN
              ========================================================================= */}
          <div className="crm-analytics-grid-two mt-4">
            {/* Lead Status Breakdown */}
            <Card
              title="Leads Pipeline Status Distribution"
              subtitle="Current qualification stages across all prospective leads"
              icon={Target}
            >
              {leads.leadsByStatus && leads.leadsByStatus.length > 0 ? (
                <div className="crm-lead-status-list">
                  {leads.leadsByStatus.map((st, idx) => {
                    const col = getStatusColor(st.status);
                    return (
                      <div key={idx} className="crm-lead-status-row">
                        <div className="crm-lead-status-top">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span className="crm-status-dot" style={{ background: col }} />
                            <strong>{st.status}</strong>
                            <span className="crm-source-count-tag">{st.count} leads</span>
                          </div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                            {formatINR(st.totalValue)}
                            <span className="text-muted" style={{ fontWeight: 400, marginLeft: '4px' }}>
                              ({st.percentage}%)
                            </span>
                          </div>
                        </div>

                        <div className="crm-factor-bar-track" style={{ height: '6px' }}>
                          <div
                            className="crm-factor-bar-fill"
                            style={{
                              width: `${Math.max(st.percentage, 4)}%`,
                              backgroundColor: col
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="crm-table-empty" style={{ padding: '2rem 1rem' }}>
                  <Target size={32} className="text-muted mb-2" />
                  <p>No leads found in PostgreSQL database.</p>
                </div>
              )}
            </Card>

            {/* Leads by Industry */}
            <Card
              title="Leads by Target Industry"
              subtitle="Industry market sector breakdown"
              icon={Building}
            >
              {leads.leadsByIndustry && leads.leadsByIndustry.length > 0 ? (
                <div className="crm-lead-status-list">
                  {leads.leadsByIndustry.map((ind, idx) => (
                    <div key={idx} className="crm-lead-status-row">
                      <div className="crm-lead-status-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <Building size={14} className="text-muted" />
                          <strong>{ind.industry}</strong>
                          <span className="crm-source-count-tag">{ind.count} leads</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                          {formatINR(ind.totalValue)}
                          <span className="text-muted" style={{ fontWeight: 400, marginLeft: '4px' }}>
                            ({ind.percentage}%)
                          </span>
                        </div>
                      </div>

                      <div className="crm-factor-bar-track" style={{ height: '6px' }}>
                        <div
                          className="crm-factor-bar-fill"
                          style={{
                            width: `${Math.max(ind.percentage, 4)}%`,
                            backgroundColor: '#6366F1'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="crm-table-empty" style={{ padding: '2rem 1rem' }}>
                  <Building size={32} className="text-muted mb-2" />
                  <p>No industry data available.</p>
                </div>
              )}
            </Card>
          </div>

          {/* =========================================================================
              5. DOCUMENTED METHODOLOGY & TRANSPARENCY
              ========================================================================= */}
          <div className="crm-analytics-transparency-card mt-4">
            <div className="crm-transparency-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={17} className="text-brand" />
                <strong style={{ fontSize: '0.92rem' }}>Analytics Metric Definitions & Calculation Methodology</strong>
              </div>
              <span className="crm-pill-badge" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                PostgreSQL SQL-Aggregated
              </span>
            </div>

            <div className="crm-transparency-grid">
              <div className="crm-transparency-item">
                <strong>Realized Revenue (INR)</strong>
                <p>Sum of deal values for deals in <code>Deal Secured</code> (<code>Won</code>) stage. Excludes all unclosed pipeline deals.</p>
              </div>

              <div className="crm-transparency-item">
                <strong>Open Pipeline Value</strong>
                <p>Sum of deal values in active negotiation stages (<code>Qualification</code>, <code>Proposal</code>, <code>Negotiation</code>). Excludes <code>Deal Secured</code> and <code>Deal Unsuccessful</code> deals to strictly prevent double-counting.</p>
              </div>

              <div className="crm-transparency-item">
                <strong>Lead Conversion Rate</strong>
                <p>Calculated as <code>(Converted Leads / Total Leads) * 100</code>. Safe zero-denominator handling when leads = 0.</p>
              </div>

              <div className="crm-transparency-item">
                <strong>Deal Success Rate (Closed Deals)</strong>
                <p>Calculated as <code>(Deals Secured / [Deals Secured + Deals Unsuccessful]) * 100</code>. Reflects commercial closing effectiveness on decided opportunities.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
