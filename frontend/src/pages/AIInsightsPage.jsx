import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Award,
  Zap,
  Target,
  RefreshCw,
  Building,
  Mail,
  Phone,
  X
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { getLeadsApi, getLeadScoreApi, getLeadAnalyticsApi } from '../services/api';
import { formatINR } from '../utils/currency';

export default function AIInsightsPage({ onNavigateTab }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const [selectedLead, setSelectedLead] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [leadsRes] = await Promise.all([
        getLeadsApi({ limit: 100 }),
        getLeadAnalyticsApi().catch(() => ({ data: null }))
      ]);

      const fetchedLeads = leadsRes.data?.leads || [];
      // Sort leads by ai_score descending
      const sortedLeads = [...fetchedLeads].sort((a, b) => {
        const scoreA = a.ai_score !== undefined && a.ai_score !== null ? Number(a.ai_score) : 0;
        const scoreB = b.ai_score !== undefined && b.ai_score !== null ? Number(b.ai_score) : 0;
        return scoreB - scoreA;
      });

      setLeads(sortedLeads);
    } catch (err) {
      console.error('Failed to load lead scoring insights:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenScoreModal = async (lead) => {
    setSelectedLead(lead);
    setScoreModalOpen(true);
    setLoadingScore(true);

    try {
      const res = await getLeadScoreApi(lead.id);
      if (res.data?.score_breakdown) {
        setSelectedLead((prev) => ({
          ...prev,
          ai_metadata: res.data.score_breakdown,
          ai_score: res.data.score_breakdown.score,
          priority: res.data.score_breakdown.priority
        }));
      }
    } catch (err) {
      console.warn('Could not load detailed score breakdown:', err);
    } finally {
      setLoadingScore(false);
    }
  };

  // Helper to format lead status nicely
  const formatStatus = (status) => {
    if (status === 'Won') return 'Deal Secured';
    if (status === 'Lost') return 'Deal Unsuccessful';
    return status || 'New';
  };

  // Filter leads based on selected priority tab
  const filteredLeads = leads.filter((lead) => {
    if (priorityFilter === 'all') return true;
    const prio = (lead.priority || (Number(lead.ai_score) >= 70 ? 'High' : Number(lead.ai_score) >= 40 ? 'Medium' : 'Low')).toLowerCase();
    return prio === priorityFilter;
  });

  // Calculate high/medium/low counts from real PostgreSQL lead data
  const highPriorityLeads = leads.filter((l) => (l.priority || '').toLowerCase() === 'high' || Number(l.ai_score) >= 70);
  const medPriorityLeads = leads.filter((l) => (l.priority || '').toLowerCase() === 'medium' || (Number(l.ai_score) >= 40 && Number(l.ai_score) < 70));
  const lowPriorityLeads = leads.filter((l) => (l.priority || '').toLowerCase() === 'low' || Number(l.ai_score) < 40);

  const totalScoreSum = leads.reduce((sum, l) => sum + (Number(l.ai_score) || 0), 0);
  const avgScore = leads.length > 0 ? Math.round(totalScoreSum / leads.length) : 0;
  const highValueTotal = highPriorityLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);

  return (
    <div className="crm-analytics-page">
      {/* Page Header */}
      <div className="crm-page-header">
        <div>
          <div className="crm-page-badge">
            <span className="crm-page-badge-dot" />
            <span>Lead Intelligence</span>
          </div>
          <h1>AI Insights & Lead Scoring</h1>
          <p className="crm-page-subtitle">
            Prioritize sales leads, monitor qualification scores, and focus on high-value business opportunities
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="outline"
            size="md"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => fetchData(true)}
          >
            Refresh Scores
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Target}
            onClick={() => onNavigateTab && onNavigateTab('leads')}
          >
            Sales Pipeline
          </Button>
        </div>
      </div>

      {/* 1. Useful Statistics Summary Cards */}
      <div className="crm-metrics-grid mb-4">
        {/* Card 1: Average Lead Score */}
        <div className="crm-metric-card">
          <div className="crm-metric-card-top">
            <span className="crm-metric-title">Average Lead Score</span>
            <div className="crm-metric-icon-wrap" style={{ background: '#EDE9FE', color: '#6D28D9' }}>
              <Award size={18} />
            </div>
          </div>
          <div className="crm-metric-value" style={{ color: '#6D28D9' }}>
            {loading ? '...' : `${avgScore} / 100`}
          </div>
          <div className="crm-metric-subtitle">
            Computed across {leads.length} active prospect{leads.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Card 2: High Priority Leads */}
        <div className="crm-metric-card">
          <div className="crm-metric-card-top">
            <span className="crm-metric-title">High Priority Leads</span>
            <div className="crm-metric-icon-wrap" style={{ background: '#ECFDF5', color: '#059669' }}>
              <Zap size={18} />
            </div>
          </div>
          <div className="crm-metric-value" style={{ color: '#059669' }}>
            {loading ? '...' : highPriorityLeads.length}
          </div>
          <div className="crm-metric-subtitle">
            Score ≥ 70 pts • {formatINR(highValueTotal)} pipeline value
          </div>
        </div>

        {/* Card 3: Medium Priority Leads */}
        <div className="crm-metric-card">
          <div className="crm-metric-card-top">
            <span className="crm-metric-title">Medium Priority Leads</span>
            <div className="crm-metric-icon-wrap" style={{ background: '#FFFBEB', color: '#D97706' }}>
              <Target size={18} />
            </div>
          </div>
          <div className="crm-metric-value" style={{ color: '#D97706' }}>
            {loading ? '...' : medPriorityLeads.length}
          </div>
          <div className="crm-metric-subtitle">
            Score 40–69 pts • Qualified prospects
          </div>
        </div>

        {/* Card 4: Low Priority Leads */}
        <div className="crm-metric-card">
          <div className="crm-metric-card-top">
            <span className="crm-metric-title">Low Priority Leads</span>
            <div className="crm-metric-icon-wrap" style={{ background: '#F8FAFC', color: '#64748B' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div className="crm-metric-value" style={{ color: '#64748B' }}>
            {loading ? '...' : lowPriorityLeads.length}
          </div>
          <div className="crm-metric-subtitle">
            Score &lt; 40 pts • Require further qualification
          </div>
        </div>
      </div>

      {/* 2. Pipeline Lead Scoring Ranks Section */}
      <Card
        title="Pipeline Lead Scoring Ranks"
        subtitle="Ranked list of prospective clients prioritized by lead qualification score"
        icon={Sparkles}
      >
        {/* Priority Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setPriorityFilter('all')}
            className={`crm-analytics-tab-btn ${priorityFilter === 'all' ? 'active' : ''}`}
          >
            All Leads ({leads.length})
          </button>
          <button
            type="button"
            onClick={() => setPriorityFilter('high')}
            className={`crm-analytics-tab-btn ${priorityFilter === 'high' ? 'active' : ''}`}
            style={{ color: priorityFilter === 'high' ? '#059669' : undefined }}
          >
            High Priority ({highPriorityLeads.length})
          </button>
          <button
            type="button"
            onClick={() => setPriorityFilter('medium')}
            className={`crm-analytics-tab-btn ${priorityFilter === 'medium' ? 'active' : ''}`}
            style={{ color: priorityFilter === 'medium' ? '#D97706' : undefined }}
          >
            Medium Priority ({medPriorityLeads.length})
          </button>
          <button
            type="button"
            onClick={() => setPriorityFilter('low')}
            className={`crm-analytics-tab-btn ${priorityFilter === 'low' ? 'active' : ''}`}
          >
            Low Priority ({lowPriorityLeads.length})
          </button>
        </div>

        {loading ? (
          <div className="crm-table-loading" style={{ padding: '2rem' }}>
            <div className="crm-loading-spinner" />
            <p>Evaluating lead scores from PostgreSQL...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="crm-table-empty" style={{ padding: '2.5rem 1rem' }}>
            <Target size={32} className="text-muted mb-2" />
            <p style={{ margin: 0, fontWeight: 600 }}>No leads available</p>
            <span style={{ fontSize: '0.82rem', color: 'var(--crm-text-muted)' }}>
              {leads.length === 0
                ? 'Create your first sales lead in the pipeline to view intelligence scores.'
                : `No leads currently match the ${priorityFilter} priority filter.`}
            </span>
          </div>
        ) : (
          <div className="crm-top-deals-list">
            {filteredLeads.map((lead, idx) => {
              const score = lead.ai_score !== undefined && lead.ai_score !== null ? Number(lead.ai_score) : 0;
              const prio = (lead.priority || (score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low')).toLowerCase();
              const badgeClass = prio === 'high' ? 'crm-score-pill--high' : prio === 'medium' ? 'crm-score-pill--medium' : 'crm-score-pill--low';

              return (
                <div key={lead.id || idx} className="crm-top-deal-row">
                  <div className="crm-top-deal-left">
                    <span className="crm-top-deal-rank">#{idx + 1}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--crm-text-primary)' }}>
                          {lead.name}
                        </strong>
                        <span className={`crm-lead-score-pill ${badgeClass}`} style={{ fontSize: '0.72rem' }}>
                          <Sparkles size={11} className="crm-score-pill-icon" />
                          <strong className="crm-score-pill-num">{score}</strong>
                          <span className="crm-score-pill-scale">/100</span>
                          <span className="crm-score-pill-priority">• {prio.toUpperCase()}</span>
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--crm-text-muted)', marginTop: '0.2rem', display: 'block' }}>
                        {lead.company ? `${lead.company} • ` : ''}
                        Status: <strong>{formatStatus(lead.status)}</strong> • Estimated Value: <strong>{formatINR(lead.estimated_value || 0)}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenScoreModal(lead)}
                      icon={Sparkles}
                    >
                      Breakdown
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 3. Simplified Business User Breakdown Modal */}
      {scoreModalOpen && selectedLead && (
        <div className="crm-modal-overlay">
          <div className="crm-modal crm-modal--md">
            <div className="crm-modal-header">
              <div>
                <h2>Lead Insights: {selectedLead.name}</h2>
                <p>Commercial qualification summary and recommended sales actions</p>
              </div>
              <button
                type="button"
                className="crm-modal-close"
                onClick={() => setScoreModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="crm-modal-body" style={{ padding: '1.25rem 1.5rem' }}>
              {loadingScore ? (
                <div className="crm-table-loading" style={{ padding: '2rem' }}>
                  <div className="crm-loading-spinner" />
                  <p>Loading lead insights...</p>
                </div>
              ) : (
                <div>
                  {/* Lead Score Overview */}
                  <div className="crm-score-overview-box">
                    <div className="crm-score-circle-badge">
                      <span className="crm-score-big-num">{selectedLead.ai_score || 0}</span>
                      <span className="crm-score-scale-text">/ 100</span>
                    </div>
                    <div className="crm-score-summary-details">
                      <div className="crm-score-headline">
                        <span className={`crm-priority-tag crm-priority-tag--${(selectedLead.priority || 'low').toLowerCase()}`}>
                          {selectedLead.priority || 'Standard'} Priority
                        </span>
                      </div>
                      <p className="crm-score-explanation">
                        {selectedLead.ai_metadata?.explanation ||
                          `Lead scored at ${selectedLead.ai_score || 0}/100 across stage qualification, contact completeness, company profile, and estimated value.`}
                      </p>
                      {selectedLead.ai_metadata?.recommended_action && (
                        <div className="crm-score-recommendation">
                          <Zap size={13} className="crm-rec-icon" />
                          <span><strong>Recommended Action:</strong> {selectedLead.ai_metadata.recommended_action}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Business Account Details */}
                  <div className="crm-env-details" style={{ marginTop: '1rem' }}>
                    <div className="crm-env-row">
                      <span className="crm-env-key">Lead Name:</span>
                      <span className="crm-env-val font-semibold">{selectedLead.name}</span>
                    </div>
                    {selectedLead.company && (
                      <div className="crm-env-row">
                        <span className="crm-env-key">Company:</span>
                        <span className="crm-env-val">{selectedLead.company}</span>
                      </div>
                    )}
                    <div className="crm-env-row">
                      <span className="crm-env-key">Pipeline Status:</span>
                      <span className="crm-env-val font-semibold">{formatStatus(selectedLead.status)}</span>
                    </div>
                    <div className="crm-env-row">
                      <span className="crm-env-key">Estimated Deal Value:</span>
                      <span className="crm-env-val font-mono font-semibold" style={{ color: 'var(--crm-brand)' }}>
                        {formatINR(selectedLead.estimated_value || 0)}
                      </span>
                    </div>
                    {selectedLead.email && (
                      <div className="crm-env-row">
                        <span className="crm-env-key">Email Address:</span>
                        <span className="crm-env-val">{selectedLead.email}</span>
                      </div>
                    )}
                    {selectedLead.phone && (
                      <div className="crm-env-row">
                        <span className="crm-env-key">Phone Number:</span>
                        <span className="crm-env-val">{selectedLead.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="crm-modal-actions">
              <Button
                variant="outline"
                onClick={() => setScoreModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                icon={Target}
                onClick={() => {
                  setScoreModalOpen(false);
                  if (onNavigateTab) onNavigateTab('leads');
                }}
              >
                Open in Sales Pipeline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
