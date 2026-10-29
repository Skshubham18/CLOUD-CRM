import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Building,
  Users,
  Target,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  TrendingUp,
  ArrowRight,
  Kanban,
  Table as TableIcon,
  Clock,
  DollarSign,
  FileText,
  User,
  ChevronRight
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import {
  getDealsApi,
  getDealApi,
  createDealApi,
  updateDealApi,
  deleteDealApi,
  getDealMetricsApi,
  getCustomersApi,
  getLeadsApi
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatINRLakhCrore } from '../utils/currency';

const DEAL_STAGES = [
  { value: 'all', label: 'All Stages' },
  { value: 'Qualification', label: 'Qualification', color: 'blue', desc: 'Initial vetting & need discovery' },
  { value: 'Proposal', label: 'Proposal', color: 'indigo', desc: 'Formal quote & terms presented' },
  { value: 'Negotiation', label: 'Negotiation', color: 'amber', desc: 'Price & contract review' },
  { value: 'Won', label: 'Deal Secured', color: 'emerald', desc: 'Contract signed & deal secured' },
  { value: 'Lost', label: 'Deal Unsuccessful', color: 'rose', desc: 'Deal unsuccessful or cancelled' }
];

export default function DealsPage({ onNavigateTab }) {
  const { user } = useAuth();

  // View mode: 'table' | 'kanban'
  const [viewMode, setViewMode] = useState('kanban');

  // Deal list & metrics state
  const [deals, setDeals] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  // Relational options for dropdowns (customers & leads)
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [availableLeads, setAvailableLeads] = useState([]);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Selected deal
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    stage: 'Qualification',
    expected_close_date: '',
    customer_id: '',
    lead_id: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Banner alert
  const [bannerAlert, setBannerAlert] = useState(null);

  // Fetch deals & metrics
  const fetchDealsAndMetrics = async () => {
    setLoading(true);
    try {
      const [dealsRes, metricsRes] = await Promise.all([
        getDealsApi({ search, stage: stageFilter }),
        getDealMetricsApi().catch(() => ({ data: { metrics: null } }))
      ]);

      setDeals(dealsRes.data?.deals || []);
      if (metricsRes.data?.metrics) {
        setMetrics(metricsRes.data.metrics);
      }
    } catch (err) {
      setBannerAlert({ type: 'error', message: err.message || 'Failed to load deals' });
    } finally {
      setLoading(false);
    }
  };

  // Load available customers and leads for linking
  const loadRelationOptions = async () => {
    try {
      const [custRes, leadRes] = await Promise.all([
        getCustomersApi().catch(() => ({ data: { customers: [] } })),
        getLeadsApi().catch(() => ({ data: { leads: [] } }))
      ]);
      setAvailableCustomers(custRes.data?.customers || []);
      setAvailableLeads(leadRes.data?.leads || []);
    } catch (err) {
      console.error('Failed to load relation options:', err);
    }
  };

  useEffect(() => {
    fetchDealsAndMetrics();
  }, [search, stageFilter]);

  useEffect(() => {
    loadRelationOptions();
  }, []);

  // Compute stats if metrics API not available
  const totalDeals = metrics?.totalDeals ?? deals.length;
  const openPipelineValue = metrics?.openPipelineValue ?? deals
    .filter(d => ['Qualification', 'Proposal', 'Negotiation'].includes(d.stage))
    .reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const wonRevenue = metrics?.wonRevenue ?? deals
    .filter(d => d.stage === 'Won')
    .reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const winRate = metrics?.winRate ?? (() => {
    const closed = deals.filter(d => ['Won', 'Lost'].includes(d.stage)).length;
    const won = deals.filter(d => d.stage === 'Won').length;
    return closed > 0 ? Math.round((won / closed) * 100) : 0;
  })();

  // Handle open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      value: '',
      stage: 'Qualification',
      expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customer_id: '',
      lead_id: '',
      notes: ''
    });
    setFormErrors({});
    setShowAddModal(true);
    loadRelationOptions();
  };

  // Handle open Edit Modal
  const handleOpenEdit = (deal) => {
    setSelectedDeal(deal);
    setFormData({
      name: deal.name || '',
      value: deal.value ? String(deal.value) : '',
      stage: deal.stage || 'Qualification',
      expected_close_date: deal.expected_close_date ? deal.expected_close_date.split('T')[0] : '',
      customer_id: deal.customer_id || '',
      lead_id: deal.lead_id || '',
      notes: deal.notes || ''
    });
    setFormErrors({});
    setShowEditModal(true);
    loadRelationOptions();
  };

  // Handle open View Modal
  const handleOpenView = async (deal) => {
    setSelectedDeal(deal);
    setShowViewModal(true);
    setLoadingDetails(true);

    try {
      const res = await getDealApi(deal.id);
      setSelectedDeal(res.data?.deal || deal);
    } catch (err) {
      console.error('Failed to load deal details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle open Delete Modal
  const handleOpenDelete = (deal) => {
    setSelectedDeal(deal);
    setShowDeleteModal(true);
  };

  // Quick Stage Change (advance stage)
  const handleQuickStageChange = async (deal, newStage) => {
    try {
      await updateDealApi(deal.id, { stage: newStage });
      setBannerAlert({
        type: 'success',
        message: `Deal '${deal.name}' moved to ${newStage}.`
      });
      fetchDealsAndMetrics();
      if (selectedDeal && selectedDeal.id === deal.id) {
        setSelectedDeal({ ...selectedDeal, stage: newStage });
      }
    } catch (err) {
      setBannerAlert({ type: 'error', message: err.message || 'Failed to update deal stage' });
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Deal name is required';
    }
    if (formData.value !== '' && formData.value !== undefined) {
      const val = Number(formData.value);
      if (isNaN(val) || val < 0) {
        errors.value = 'Deal value must be a non-negative numeric amount';
      }
    }
    if (formData.expected_close_date) {
      const parsed = new Date(formData.expected_close_date);
      if (isNaN(parsed.getTime())) {
        errors.expected_close_date = 'Invalid date format';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Add Deal
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        value: formData.value ? Number(formData.value) : 0,
        stage: formData.stage,
        expected_close_date: formData.expected_close_date || null,
        customer_id: formData.customer_id || null,
        lead_id: formData.lead_id || null,
        notes: formData.notes.trim()
      };
      await createDealApi(payload);
      setShowAddModal(false);
      setBannerAlert({ type: 'success', message: `Deal '${formData.name}' created successfully.` });
      fetchDealsAndMetrics();
    } catch (err) {
      setBannerAlert({ type: 'error', message: err.message || 'Failed to create deal' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Deal
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        value: formData.value ? Number(formData.value) : 0,
        stage: formData.stage,
        expected_close_date: formData.expected_close_date || null,
        customer_id: formData.customer_id || null,
        lead_id: formData.lead_id || null,
        notes: formData.notes.trim()
      };
      await updateDealApi(selectedDeal.id, payload);
      setShowEditModal(false);
      setBannerAlert({ type: 'success', message: `Deal '${formData.name}' updated successfully.` });
      fetchDealsAndMetrics();
    } catch (err) {
      setBannerAlert({ type: 'error', message: err.message || 'Failed to update deal' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delete Deal
  const handleDeleteSubmit = async () => {
    if (!selectedDeal) return;
    setSubmitting(true);

    try {
      await deleteDealApi(selectedDeal.id);
      setShowDeleteModal(false);
      if (showViewModal) setShowViewModal(false);

      setBannerAlert({ type: 'success', message: `Deal '${selectedDeal.name}' deleted successfully.` });
      fetchDealsAndMetrics();
    } catch (err) {
      setBannerAlert({ type: 'error', message: err.message || 'Failed to delete deal' });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for Stage Pill Badge
  const getStageBadge = (stage) => {
    const s = String(stage).toLowerCase();
    if (s === 'won') return <span className="crm-pill-badge crm-pill-won">Deal Secured</span>;
    if (s === 'proposal') return <span className="crm-pill-badge crm-pill-proposal">Proposal</span>;
    if (s === 'negotiation') return <span className="crm-pill-badge crm-pill-qualified">Negotiation</span>;
    if (s === 'qualification') return <span className="crm-pill-badge crm-pill-new">Qualification</span>;
    if (s === 'lost') return <span className="crm-pill-badge crm-pill-lost">Deal Unsuccessful</span>;
    return <span className="crm-pill-badge crm-pill-new">{stage}</span>;
  };

  // Stages list for Kanban (excluding 'all')
  const kanbanStages = DEAL_STAGES.filter(s => s.value !== 'all');

  return (
    <div className="crm-customers-page">
      {/* Page Header */}
      <div className="crm-page-header">
        <div>
          <div className="crm-page-badge">
            <span className="crm-page-badge-dot" />
            <span>Revenue Management</span>
          </div>
          <h1>Deals & Sales Pipeline</h1>
          <p className="crm-page-subtitle">
            Track revenue opportunities, manage pipeline stages, and close commercial deals
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View Mode Toggle */}
          <div className="crm-view-mode-toggle">
            <button
              type="button"
              className={`crm-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Pipeline Stage Board (Kanban)"
            >
              <Kanban size={15} />
              <span>Pipeline Board</span>
            </button>
            <button
              type="button"
              className={`crm-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <TableIcon size={15} />
              <span>Table</span>
            </button>
          </div>

          <Button
            variant="primary"
            onClick={handleOpenAdd}
            icon={Plus}
          >
            Add Deal
          </Button>
        </div>
      </div>

      {/* Financial Pipeline Metric Cards */}
      <div className="crm-stats-grid">
        <div className="crm-stat-card">
          <div className="crm-stat-label">Total Deals</div>
          <div className="crm-stat-value">{totalDeals}</div>
          <div className="crm-stat-sub">Tracked across all stages</div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-label">Open Pipeline Value (INR)</div>
          <div className="crm-stat-value" style={{ color: '#4F46E5' }}>
            {formatINR(openPipelineValue)}
          </div>
          <div className="crm-stat-sub">{formatINRLakhCrore(openPipelineValue)} in active negotiations</div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-label">Realized Revenue (INR)</div>
          <div className="crm-stat-value" style={{ color: '#10B981' }}>
            {formatINR(wonRevenue)}
          </div>
          <div className="crm-stat-sub">{formatINRLakhCrore(wonRevenue)} in secured contracts</div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-label">Deal Success Rate</div>
          <div className="crm-stat-value" style={{ color: '#F59E0B' }}>
            {winRate}%
          </div>
          <div className="crm-stat-sub">Percentage of closed deals secured</div>
        </div>
      </div>

      {/* Banner Alert */}
      {bannerAlert && (
        <div className={`crm-banner-alert crm-banner-alert--${bannerAlert.type}`}>
          <div className="crm-banner-alert-content">
            {bannerAlert.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald" />
            ) : (
              <AlertCircle size={18} className="text-rose" />
            )}
            <span>{bannerAlert.message}</span>
          </div>
          <button
            type="button"
            className="crm-banner-alert-close"
            onClick={() => setBannerAlert(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="crm-filters-card">
        {/* Search */}
        <div className="crm-search-box">
          <Search size={16} className="crm-search-icon" />
          <input
            type="text"
            className="crm-search-input"
            placeholder="Search deals by name, client, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="crm-search-clear"
              onClick={() => setSearch('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Stage Filter & Controls */}
        <div className="crm-filters-right-group">
          <div className="crm-status-filter-group">
            <Filter size={15} className="text-muted" />
            <span className="crm-filter-label">Stage:</span>
            <select
              className="crm-filter-select"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              {DEAL_STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh */}
          <button
            type="button"
            className="crm-refresh-btn"
            onClick={fetchDealsAndMetrics}
            title="Refresh deals pipeline"
          >
            <RefreshCw size={15} className={loading ? 'crm-spin' : ''} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: PIPELINE STAGE BOARD (KANBAN)
          ========================================================================= */}
      {viewMode === 'kanban' && (
        <div className="crm-kanban-board">
          {kanbanStages.map((stageObj) => {
            const stageDeals = deals.filter(
              d => d.stage?.toLowerCase() === stageObj.value.toLowerCase()
            );
            const stageSum = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

            return (
              <div key={stageObj.value} className={`crm-kanban-column crm-kanban-column--${stageObj.color}`}>
                <div className="crm-kanban-col-header">
                  <div>
                    <div className="crm-kanban-col-title">
                      <span className={`crm-stage-dot crm-stage-dot--${stageObj.color}`} />
                      <span className="crm-kanban-col-title-text" title={stageObj.label}>{stageObj.label}</span>
                      <span className="crm-kanban-count">{stageDeals.length}</span>
                    </div>
                    <div className="crm-kanban-col-sum">
                      {formatINR(stageSum)}
                    </div>
                  </div>
                </div>

                <div className="crm-kanban-col-cards">
                  {stageDeals.length === 0 ? (
                    <div className="crm-kanban-empty-slot">
                      <span>No deals in {stageObj.label}</span>
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div key={deal.id} className="crm-deal-card" onClick={() => handleOpenView(deal)}>
                        <div className="crm-deal-card-header">
                          <strong className="crm-deal-card-title">{deal.name}</strong>
                          <div className="crm-deal-card-value text-brand">
                            {formatINR(deal.value)}
                          </div>
                        </div>

                        {/* Associated Client / Lead */}
                        {(deal.customer_name || deal.lead_name) && (
                          <div className="crm-deal-card-account">
                            {deal.customer_name ? (
                              <span className="crm-account-pill crm-account-pill--customer" title="Linked Customer">
                                <Users size={11} />
                                <span>{deal.customer_name}</span>
                              </span>
                            ) : (
                              <span className="crm-account-pill crm-account-pill--lead" title="Linked Lead">
                                <Target size={11} />
                                <span>{deal.lead_name}</span>
                              </span>
                            )}
                          </div>
                        )}

                        <div className="crm-deal-card-footer">
                          <div className="crm-deal-card-date">
                            <Calendar size={11} className="text-muted" />
                            <span>
                              {deal.expected_close_date
                                ? new Date(deal.expected_close_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                                : 'No date'}
                            </span>
                          </div>

                          {/* Quick stage advance buttons */}
                          <div className="crm-deal-card-actions" onClick={(e) => e.stopPropagation()}>
                            {stageObj.value === 'Qualification' && (
                              <button
                                type="button"
                                className="crm-quick-stage-btn"
                                onClick={() => handleQuickStageChange(deal, 'Proposal')}
                                title="Move to Proposal"
                              >
                                <span>Proposal</span>
                                <ChevronRight size={12} />
                              </button>
                            )}
                            {stageObj.value === 'Proposal' && (
                              <button
                                type="button"
                                className="crm-quick-stage-btn"
                                onClick={() => handleQuickStageChange(deal, 'Negotiation')}
                                title="Move to Negotiation"
                              >
                                <span>Negotiate</span>
                                <ChevronRight size={12} />
                              </button>
                            )}
                            {stageObj.value === 'Negotiation' && (
                              <button
                                type="button"
                                className="crm-quick-stage-btn crm-quick-stage-btn--won"
                                onClick={() => handleQuickStageChange(deal, 'Won')}
                                title="Mark as Deal Secured"
                              >
                                <span>Deal Secured</span>
                                <CheckCircle2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          VIEW 2: TABLE VIEW
          ========================================================================= */}
      {viewMode === 'table' && (
        <Card noPadding>
          {loading ? (
            <div className="crm-table-loading">
              <RefreshCw size={24} className="crm-spin text-brand" />
              <p>Loading persistent deals from PostgreSQL...</p>
            </div>
          ) : deals.length === 0 ? (
            <div className="crm-table-empty">
              <div className="crm-empty-icon">
                <Briefcase size={36} />
              </div>
              <h3>No Deals Found</h3>
              <p>
                {search || stageFilter !== 'all'
                  ? 'No deals match your current search and stage criteria.'
                  : 'Start tracking revenue opportunities by adding your first deal.'}
              </p>
              {search || stageFilter !== 'all' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setStageFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenAdd}
                  icon={Plus}
                >
                  Add Your First Deal
                </Button>
              )}
            </div>
          ) : (
            <div className="crm-table-container">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Deal Name</th>
                    <th>Value (INR)</th>
                    <th>Stage</th>
                    <th>Associated Client / Account</th>
                    <th>Expected Close</th>
                    <th>Owner / Creator</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal) => {
                    return (
                      <tr key={deal.id}>
                        {/* Name */}
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--crm-text-primary)' }}>
                            {deal.name}
                          </div>
                          {deal.notes && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--crm-text-muted)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {deal.notes}
                            </div>
                          )}
                        </td>

                        {/* Value */}
                        <td>
                          <div className="crm-money-val" style={{ fontWeight: 800, color: 'var(--crm-text-primary)' }}>
                            {formatINR(deal.value)}
                          </div>
                        </td>

                        {/* Stage */}
                        <td>
                          {getStageBadge(deal.stage)}
                        </td>

                        {/* Associated Client / Lead */}
                        <td>
                          {deal.customer_name ? (
                            <div className="crm-account-link-box">
                              <Users size={12} className="text-blue" />
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{deal.customer_name}</div>
                                {deal.customer_company && (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--crm-text-muted)' }}>{deal.customer_company}</div>
                                )}
                              </div>
                            </div>
                          ) : deal.lead_name ? (
                            <div className="crm-account-link-box">
                              <Target size={12} className="text-amber" />
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{deal.lead_name}</div>
                                {deal.lead_company && (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--crm-text-muted)' }}>{deal.lead_company}</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--crm-text-muted)', fontSize: '0.8rem' }}>Unlinked</span>
                          )}
                        </td>

                        {/* Expected Close */}
                        <td>
                          <div style={{ fontSize: '0.82rem', color: 'var(--crm-text-primary)' }}>
                            {deal.expected_close_date
                              ? new Date(deal.expected_close_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                              : 'Not set'}
                          </div>
                        </td>

                        {/* Owner */}
                        <td>
                          <div style={{ fontSize: '0.82rem', color: 'var(--crm-text-primary)' }}>
                            {deal.assigned_to_name || deal.created_by_name || 'Sales Team'}
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div className="crm-action-buttons">
                            <button
                              type="button"
                              className="crm-action-btn"
                              onClick={() => handleOpenView(deal)}
                              title="View deal details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              className="crm-action-btn"
                              onClick={() => handleOpenEdit(deal)}
                              title="Edit deal"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="crm-action-btn crm-action-btn--danger"
                              onClick={() => handleOpenDelete(deal)}
                              title="Delete deal"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* =========================================================================
          MODAL 1: ADD DEAL
          ========================================================================= */}
      {showAddModal && (
        <div className="crm-modal-overlay">
          <div className="crm-modal crm-modal--md">
            <div className="crm-modal-header">
              <div>
                <h2>Add New Deal</h2>
                <p>Register a sales pipeline opportunity with expected revenue</p>
              </div>
              <button
                type="button"
                className="crm-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="crm-modal-form">
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Deal Name *</label>
                  <input
                    type="text"
                    className={`crm-form-input ${formErrors.name ? 'error' : ''}`}
                    placeholder="e.g. Cloud Migration Enterprise Plan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && <span className="crm-field-error">{formErrors.name}</span>}
                </div>

                <div className="crm-form-group">
                  <label>Deal Value (INR ₹) *</label>
                  <div className="crm-input-with-symbol">
                    <span className="crm-input-prefix">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className={`crm-form-input ${formErrors.value ? 'error' : ''}`}
                      placeholder="e.g. 500000"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    />
                  </div>
                  {formErrors.value && <span className="crm-field-error">{formErrors.value}</span>}
                </div>
              </div>

              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Pipeline Stage</label>
                  <select
                    className="crm-form-select"
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  >
                    {DEAL_STAGES.filter(s => s.value !== 'all').map((st) => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>

                <div className="crm-form-group">
                  <label>Expected Close Date</label>
                  <input
                    type="date"
                    className="crm-form-input"
                    value={formData.expected_close_date}
                    onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Linked Customer (Optional)</label>
                  <select
                    className="crm-form-select"
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  >
                    <option value="">— No Customer Selected —</option>
                    {availableCustomers.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.name} {cust.company ? `(${cust.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="crm-form-group">
                  <label>Linked Lead (Optional)</label>
                  <select
                    className="crm-form-select"
                    value={formData.lead_id}
                    onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                  >
                    <option value="">— No Lead Selected —</option>
                    {availableLeads.map((ld) => (
                      <option key={ld.id} value={ld.id}>
                        {ld.name} {ld.company ? `(${ld.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="crm-form-group">
                <label>Notes & Deal Terms</label>
                <textarea
                  className="crm-form-textarea"
                  rows={3}
                  placeholder="Terms, key decision makers, pricing discounts, or scope notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="crm-modal-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                >
                  Save Deal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIT DEAL
          ========================================================================= */}
      {showEditModal && (
        <div className="crm-modal-overlay">
          <div className="crm-modal crm-modal--md">
            <div className="crm-modal-header">
              <div>
                <h2>Edit Deal</h2>
                <p>Update deal terms, value, or stage for {selectedDeal?.name}</p>
              </div>
              <button
                type="button"
                className="crm-modal-close"
                onClick={() => setShowEditModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="crm-modal-form">
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Deal Name *</label>
                  <input
                    type="text"
                    className={`crm-form-input ${formErrors.name ? 'error' : ''}`}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && <span className="crm-field-error">{formErrors.name}</span>}
                </div>

                <div className="crm-form-group">
                  <label>Deal Value (INR ₹) *</label>
                  <div className="crm-input-with-symbol">
                    <span className="crm-input-prefix">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className={`crm-form-input ${formErrors.value ? 'error' : ''}`}
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    />
                  </div>
                  {formErrors.value && <span className="crm-field-error">{formErrors.value}</span>}
                </div>
              </div>

              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Pipeline Stage</label>
                  <select
                    className="crm-form-select"
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  >
                    {DEAL_STAGES.filter(s => s.value !== 'all').map((st) => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>

                <div className="crm-form-group">
                  <label>Expected Close Date</label>
                  <input
                    type="date"
                    className="crm-form-input"
                    value={formData.expected_close_date}
                    onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Linked Customer</label>
                  <select
                    className="crm-form-select"
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  >
                    <option value="">— No Customer Selected —</option>
                    {availableCustomers.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.name} {cust.company ? `(${cust.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="crm-form-group">
                  <label>Linked Lead</label>
                  <select
                    className="crm-form-select"
                    value={formData.lead_id}
                    onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                  >
                    <option value="">— No Lead Selected —</option>
                    {availableLeads.map((ld) => (
                      <option key={ld.id} value={ld.id}>
                        {ld.name} {ld.company ? `(${ld.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="crm-form-group">
                <label>Notes & Scope</label>
                <textarea
                  className="crm-form-textarea"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="crm-modal-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                >
                  Update Deal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: VIEW DEAL DETAILS
          ========================================================================= */}
      {showViewModal && selectedDeal && (
        <div className="crm-modal-overlay">
          <div className="crm-modal crm-modal--md">
            <div className="crm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="crm-customer-avatar crm-customer-avatar--lg" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                  <Briefcase size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <h2 style={{ margin: 0 }}>{selectedDeal.name}</h2>
                    {getStageBadge(selectedDeal.stage)}
                  </div>
                  <p style={{ margin: '0.2rem 0 0', color: 'var(--crm-text-secondary)', fontSize: '0.85rem' }}>
                    Created on {selectedDeal.created_at ? new Date(selectedDeal.created_at).toLocaleDateString('en-IN') : 'Recent'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="crm-modal-close"
                onClick={() => setShowViewModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="crm-view-modal-content">
              {/* Highlights */}
              <div className="crm-lead-highlights-grid">
                <div className="crm-lead-highlight-box">
                  <div className="crm-highlight-label">Deal Value (INR)</div>
                  <div className="crm-highlight-val text-brand" style={{ color: '#059669' }}>
                    {formatINR(selectedDeal.value)}
                  </div>
                </div>

                <div className="crm-lead-highlight-box">
                  <div className="crm-highlight-label">Pipeline Stage</div>
                  <div className="crm-highlight-val" style={{ fontSize: '1rem' }}>
                    {selectedDeal.stage === 'Won' ? 'Deal Secured' : selectedDeal.stage === 'Lost' ? 'Deal Unsuccessful' : selectedDeal.stage}
                  </div>
                </div>

                <div className="crm-lead-highlight-box">
                  <div className="crm-highlight-label">Expected Close</div>
                  <div className="crm-highlight-val" style={{ fontSize: '0.9rem' }}>
                    {selectedDeal.expected_close_date
                      ? new Date(selectedDeal.expected_close_date).toLocaleDateString('en-IN')
                      : 'Not set'}
                  </div>
                </div>

                <div className="crm-lead-highlight-box">
                  <div className="crm-highlight-label">Owner / Assigned</div>
                  <div className="crm-highlight-val" style={{ fontSize: '0.9rem' }}>
                    {selectedDeal.assigned_to_name || selectedDeal.created_by_name || 'Sales Team'}
                  </div>
                </div>
              </div>

              {/* Linked Accounts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
                {selectedDeal.customer_name ? (
                  <div className="crm-lead-highlight-box">
                    <div className="crm-highlight-label" style={{ color: '#2563EB' }}>Linked Customer Account</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedDeal.customer_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--crm-text-secondary)' }}>
                      {selectedDeal.customer_company ? `${selectedDeal.customer_company} • ` : ''}
                      {selectedDeal.customer_email || ''}
                    </div>
                  </div>
                ) : (
                  <div className="crm-lead-highlight-box" style={{ background: '#F8FAFC' }}>
                    <div className="crm-highlight-label">Customer Account</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--crm-text-muted)' }}>No customer linked</div>
                  </div>
                )}

                {selectedDeal.lead_name ? (
                  <div className="crm-lead-highlight-box">
                    <div className="crm-highlight-label" style={{ color: '#D97706' }}>Originating Lead</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedDeal.lead_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--crm-text-secondary)' }}>
                      {selectedDeal.lead_company ? `${selectedDeal.lead_company} • ` : ''}
                      {selectedDeal.lead_email || ''}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Notes */}
              {selectedDeal.notes && (
                <div className="crm-lead-notes-box">
                  <div className="crm-notes-header">
                    <FileText size={14} className="text-muted" />
                    <strong>Deal Notes & Scope</strong>
                  </div>
                  <p className="crm-notes-text">{selectedDeal.notes}</p>
                </div>
              )}

              {/* Stage Transition Quick Actions */}
              <div className="crm-stage-progression-box">
                <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
                  Advance Pipeline Stage:
                </strong>
                <div className="crm-stage-buttons-row">
                  {kanbanStages.map((st) => (
                    <button
                      key={st.value}
                      type="button"
                      className={`crm-stage-choice-btn ${selectedDeal.stage === st.value ? 'active' : ''}`}
                      onClick={() => handleQuickStageChange(selectedDeal, st.value)}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: DELETE DEAL CONFIRMATION
          ========================================================================= */}
      {showDeleteModal && selectedDeal && (
        <div className="crm-modal-overlay">
          <div className="crm-modal crm-modal--sm">
            <div className="crm-modal-header">
              <div>
                <h2>Delete Deal</h2>
                <p>Are you sure you want to remove this deal?</p>
              </div>
              <button
                type="button"
                className="crm-modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="crm-modal-body" style={{ padding: '1.25rem 1.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--crm-text-secondary)' }}>
                This will permanently delete deal <strong>{selectedDeal.name}</strong> ({formatINR(selectedDeal.value)}) from PostgreSQL. This action cannot be undone.
              </p>
            </div>

            <div className="crm-modal-actions">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteSubmit}
                loading={submitting}
                style={{ background: '#DC2626', borderColor: '#DC2626', color: '#fff' }}
              >
                Delete Deal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
