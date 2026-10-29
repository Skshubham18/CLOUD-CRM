import React, { useState, useEffect } from 'react';
import {
  Target,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Building,
  Briefcase,
  Calendar,
  Clock,
  Plus,
  MessageSquare,
  PhoneCall,
  Video,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Sparkles,
  DollarSign,
  Zap,
  Award,
  Check
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import {
  getLeadsApi,
  getLeadApi,
  getLeadScoreApi,
  createLeadApi,
  updateLeadApi,
  deleteLeadApi,
  convertLeadToCustomerApi,
  addLeadInteractionApi
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatINRLakhCrore } from '../utils/currency';

const LEAD_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'New', label: 'New', color: 'blue' },
  { value: 'Contacted', label: 'Contacted', color: 'purple' },
  { value: 'Qualified', label: 'Qualified', color: 'amber' },
  { value: 'Proposal', label: 'Proposal', color: 'indigo' },
  { value: 'Won', label: 'Deal Secured', color: 'emerald' },
  { value: 'Lost', label: 'Deal Unsuccessful', color: 'rose' }
];

const LEAD_SOURCES = [
  { value: 'all', label: 'All Sources' },
  { value: 'Website', label: 'Website' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Social Media', label: 'Social Media' },
  { value: 'Email', label: 'Email' },
  { value: 'Advertisement', label: 'Advertisement' },
  { value: 'Cold Call', label: 'Cold Call' },
  { value: 'Other', label: 'Other' }
];

const INDUSTRIES = [
  'Technology',
  'Financial Services',
  'Healthcare',
  'Retail & E-commerce',
  'Manufacturing',
  'Consulting',
  'Real Estate',
  'Education',
  'Other'
];

export default function LeadsPage({ onNavigateTab }) {
  const { user } = useAuth();

  // Lead list state
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Selected lead
  const [selectedLead, setSelectedLead] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: 'Technology',
    source: 'Website',
    status: 'New',
    estimated_value: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Interaction logging state
  const [interactionData, setInteractionData] = useState({
    type: 'note',
    description: ''
  });
  const [loggingInteraction, setLoggingInteraction] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);

  // Converting state
  const [converting, setConverting] = useState(false);

  // Banner alerts
  const [bannerAlert, setBannerAlert] = useState(null);

  // Fetch leads
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await getLeadsApi({
        search,
        status: statusFilter,
        source: sourceFilter
      });
      setLeads(res.data?.leads || []);
    } catch (err) {
      setBannerAlert({ type: 'error', message: err.message || 'Failed to load leads' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, sourceFilter]);

  // Compute summary stats
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.status === 'Qualified').length;
  const proposalLeads = leads.filter(l => l.status === 'Proposal').length;
  const wonLeads = leads.filter(l => l.status === 'Won').length;
  const totalPipelineValue = leads
    .filter(l => l.status !== 'Lost')
    .reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);

  // Handle open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      industry: 'Technology',
      source: 'Website',
      status: 'New',
      estimated_value: '',
      notes: ''
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  // Handle open Edit Modal
  const handleOpenEdit = (lead) => {
    setSelectedLead(lead);
    setFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      industry: lead.industry || 'Technology',
      source: lead.source || 'Website',
      status: lead.status || 'New',
      estimated_value: lead.estimated_value ? String(lead.estimated_value) : '',
      notes: lead.notes || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Handle open View Modal
  const handleOpenView = async (lead) => {
    setSelectedLead(lead);
    setShowViewModal(true);
    setLoadingDetails(true);
    setShowInteractionForm(false);
    setInteractionData({ type: 'note', description: '' });

    try {
      const res = await getLeadApi(lead.id);
      let leadData = res.data?.lead || lead;
      if (!leadData.ai_metadata || !leadData.ai_metadata.contributing_factors) {
        try {
          const scoreRes = await getLeadScoreApi(lead.id);
          if (scoreRes.data?.score_breakdown) {
            leadData = {
              ...leadData,
              ai_metadata: scoreRes.data.score_breakdown,
              ai_score: scoreRes.data.score_breakdown.score,
              priority: scoreRes.data.score_breakdown.priority
            };
          }
        } catch (scoreErr) {
          console.warn('Could not fetch additional score details:', scoreErr);
        }
      }
      setSelectedLead(leadData);
    } catch (err) {
      console.error('Failed to load lead details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle open Convert Modal
  const handleOpenConvert = (lead) => {
    setSelectedLead(lead);
    setShowConvertModal(true);
  };

  // Handle open Delete Modal
  const handleOpenDelete = (lead) => {
    setSelectedLead(lead);
    setShowDeleteModal(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Lead name is required';
    }
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
    }
    if (formData.estimated_value !== '' && formData.estimated_value !== undefined) {
      const val = Number(formData.estimated_value);
      if (isNaN(val) || val < 0) {
        errors.estimated_value = 'Estimated value must be a non-negative numeric amount';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Add Lead
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        estimated_value: formData.estimated_value ? Number(formData.estimated_value) : 0
      };
      await createLeadApi(payload);
      setShowAddModal(false);
      setBannerAlert({ type: 'success', message: `Lead '${formData.name}' created successfully.` });
      fetchLeads();
    } catch (err) {
      setBannerAlert({ type: 'error', message: err.message || 'Failed to create lead' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Lead
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        estimated_value: formData.estimated_value ? Number(formData.estimated_value) : 0
      };
      await updateLeadApi(selectedLead.id, payload);
      setShowEditModal(false);
      setBannerAlert({ type: 'success', message: `Lead '${formData.name}' updated successfully.` });
      fetchLeads();
    } catch (err) {
      setBannerAlert({ type: 'error', message: err.message || 'Failed to update lead' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Convert Lead to Customer
  const handleConfirmConvert = async () => {
    if (!selectedLead) return;
    setConverting(true);

    try {
      const res = await convertLeadToCustomerApi(selectedLead.id);
      setShowConvertModal(false);
      if (showViewModal) setShowViewModal(false);

      setBannerAlert({
        type: 'success',
        message: res.message || `Lead converted successfully into customer '${selectedLead.name}'.`
      });
      fetchLeads();
    } catch (err) {
      setBannerAlert({ type: 'error', message: err.message || 'Failed to convert lead to customer' });
    } finally {
      setConverting(false);
    }
  };

  // Submit Delete Lead
  const handleDeleteSubmit = async () => {
    if (!selectedLead) return;
    setSubmitting(true);

    try {
      await deleteLeadApi(selectedLead.id);
      setShowDeleteModal(false);
      if (showViewModal) setShowViewModal(false);

      setBannerAlert({ type: 'success', message: `Lead '${selectedLead.name}' deleted successfully.` });
      fetchLeads();
    } catch (err) {
      setBannerAlert({ type: 'error', message: err.message || 'Failed to delete lead' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Interaction
  const handleAddInteraction = async (e) => {
    e.preventDefault();
    if (!interactionData.description.trim()) return;

    setLoggingInteraction(true);
    try {
      await addLeadInteractionApi(selectedLead.id, interactionData);
      setInteractionData({ type: 'note', description: '' });
      setShowInteractionForm(false);

      // Refresh lead details to show new interaction
      const res = await getLeadApi(selectedLead.id);
      setSelectedLead(res.data?.lead || selectedLead);
      setBannerAlert({ type: 'success', message: 'Interaction logged successfully.' });
    } catch (err) {
      setBannerAlert({ type: 'error', message: err.message || 'Failed to add interaction' });
    } finally {
      setLoggingInteraction(false);
    }
  };

  // Helper for status badge styling
  const getStatusBadge = (status) => {
    const s = String(status).toLowerCase();
    if (s === 'won') return <span className="crm-pill-badge crm-pill-won">Deal Secured</span>;
    if (s === 'proposal') return <span className="crm-pill-badge crm-pill-proposal">Proposal</span>;
    if (s === 'qualified') return <span className="crm-pill-badge crm-pill-qualified">Qualified</span>;
    if (s === 'contacted') return <span className="crm-pill-badge crm-pill-contacted">Contacted</span>;
    if (s === 'lost') return <span className="crm-pill-badge crm-pill-lost">Deal Unsuccessful</span>;
    return <span className="crm-pill-badge crm-pill-new">New</span>;
  };

  // Helper for AI lead score badge styling
  const getScoreBadge = (score, priority) => {
    const num = score !== undefined && score !== null ? Number(score) : 0;
    const prio = (priority || (num >= 70 ? 'High' : num >= 40 ? 'Medium' : 'Low')).toLowerCase();

    let badgeClass = 'crm-score-pill--low';
    if (prio === 'high') badgeClass = 'crm-score-pill--high';
    else if (prio === 'medium') badgeClass = 'crm-score-pill--medium';

    return (
      <span className={`crm-lead-score-pill ${badgeClass}`} title={`Explainable AI Lead Score: ${num}/100 (${prio} priority)`}>
        <Sparkles size={11} className="crm-score-pill-icon" />
        <strong className="crm-score-pill-num">{num}</strong>
        <span className="crm-score-pill-scale">/100</span>
        <span className="crm-score-pill-priority">• {priority || (num >= 70 ? 'High' : num >= 40 ? 'Medium' : 'Low')}</span>
      </span>
    );
  };

  // Helper for interaction icon
  const getInteractionIcon = (type) => {
    switch (type) {
      case 'call': return <PhoneCall size={15} className="text-blue" />;
      case 'email': return <Mail size={15} className="text-purple" />;
      case 'meeting': return <Video size={15} className="text-emerald" />;
      default: return <FileText size={15} className="text-amber" />;
    }
  };

  return (
    <div className="crm-customers-page">
      {/* Page Header */}
      <div className="crm-page-header">
        <div>
          <div className="crm-page-badge">
            <span className="crm-page-badge-dot" />
            <span>Sales Pipeline</span>
          </div>
          <h1>Leads & Pipeline</h1>
          <p className="crm-page-subtitle">
            Capture, qualify, and convert high-value business leads into active CRM customers
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenAdd}
          icon={UserPlus}
        >
          Add Lead
        </Button>
      </div>

      {/* Pipeline Quick Metric Counters */}
      <div className="crm-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="crm-stat-card">
          <div className="crm-stat-label">Total Leads</div>
          <div className="crm-stat-value">{totalLeads}</div>
          <div className="crm-stat-sub">All active pipelines</div>
        </div>
        <div className="crm-stat-card">
          <div className="crm-stat-label">Qualified Leads</div>
          <div className="crm-stat-value" style={{ color: '#F59E0B' }}>{qualifiedLeads}</div>
          <div className="crm-stat-sub">Vetted prospects</div>
        </div>
        <div className="crm-stat-card">
          <div className="crm-stat-label">In Proposal</div>
          <div className="crm-stat-value" style={{ color: '#6366F1' }}>{proposalLeads}</div>
          <div className="crm-stat-sub">Active negotiations</div>
        </div>
        <div className="crm-stat-card">
          <div className="crm-stat-label">Deals Secured / Converted</div>
          <div className="crm-stat-value" style={{ color: '#10B981' }}>{wonLeads}</div>
          <div className="crm-stat-sub">Converted customers</div>
        </div>
        <div className="crm-stat-card">
          <div className="crm-stat-label">Pipeline Value (INR)</div>
          <div className="crm-stat-value" style={{ color: 'var(--crm-brand)' }}>
            {formatINR(totalPipelineValue)}
          </div>
          <div className="crm-stat-sub">{formatINRLakhCrore(totalPipelineValue)} in active leads</div>
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
            placeholder="Search leads by name, email, or company..."
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

        {/* Status Filter */}
        <div className="crm-status-filter-group">
          <Filter size={15} className="text-muted" />
          <span className="crm-filter-label">Status:</span>
          <select
            className="crm-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Source Filter */}
        <div className="crm-status-filter-group">
          <span className="crm-filter-label">Source:</span>
          <select
            className="crm-filter-select"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            {LEAD_SOURCES.map((src) => (
              <option key={src.value} value={src.value}>
                {src.label}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh */}
        <button
          type="button"
          className="crm-refresh-btn"
          onClick={fetchLeads}
          title="Refresh leads list"
        >
          <RefreshCw size={15} className={loading ? 'crm-spin' : ''} />
        </button>
      </div>

      {/* Leads Table */}
      <Card noPadding>
        {loading ? (
          <div className="crm-table-loading">
            <RefreshCw size={24} className="crm-spin text-brand" />
            <p>Loading persistent leads from PostgreSQL...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="crm-table-empty">
            <div className="crm-empty-icon">
              <Target size={36} />
            </div>
            <h3>No Leads Found</h3>
            <p>
              {search || statusFilter !== 'all' || sourceFilter !== 'all'
                ? 'No leads match your current search and filter criteria.'
                : 'Start building your pipeline by adding your first business lead.'}
            </p>
            {search || statusFilter !== 'all' || sourceFilter !== 'all' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setSourceFilter('all');
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAdd}
                icon={UserPlus}
              >
                Add Your First Lead
              </Button>
            )}
          </div>
        ) : (
          <div className="crm-table-container">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Company & Industry</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>AI Score</th>
                  <th>Est. Value (INR)</th>
                  <th>Assigned / Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const isWon = lead.status === 'Won';
                  const initials = lead.name
                    ? lead.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'LD';

                  return (
                    <tr key={lead.id}>
                      {/* Name & Contact */}
                      <td>
                        <div className="crm-customer-cell">
                          <div className="crm-customer-avatar" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                            {initials}
                          </div>
                          <div>
                            <div className="crm-customer-name" style={{ fontWeight: 700 }}>
                              {lead.name}
                            </div>
                            <div className="crm-contact-links">
                              {lead.email && (
                                <span className="crm-contact-pill">
                                  <Mail size={11} />
                                  <span>{lead.email}</span>
                                </span>
                              )}
                              {lead.phone && (
                                <span className="crm-contact-pill">
                                  <Phone size={11} />
                                  <span>{lead.phone}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Company & Industry */}
                      <td>
                        <div className="crm-customer-company">
                          <Building size={13} className="text-muted" />
                          <span>{lead.company || '—'}</span>
                        </div>
                        <div className="crm-customer-industry">{lead.industry || 'General'}</div>
                      </td>

                      {/* Source */}
                      <td>
                        <span className="crm-source-tag">
                          {lead.source || 'Website'}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        {getStatusBadge(lead.status)}
                      </td>

                      {/* AI Lead Score */}
                      <td>
                        {getScoreBadge(lead.ai_score, lead.priority)}
                      </td>

                      {/* Estimated Value (INR) */}
                      <td>
                        <div className="crm-money-val" style={{ fontWeight: 700, color: 'var(--crm-text-primary)' }}>
                          {formatINR(lead.estimated_value)}
                        </div>
                      </td>

                      {/* Creator / Assignee */}
                      <td>
                        <div style={{ fontSize: '0.82rem', color: 'var(--crm-text-primary)' }}>
                          {lead.assigned_to_name || lead.created_by_name || 'Sales Team'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--crm-text-muted)' }}>
                          {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN') : 'Recent'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="crm-action-buttons">
                          {/* Convert to Customer button */}
                          <button
                            type="button"
                            className={`crm-action-btn ${isWon ? 'crm-action-btn--won' : 'crm-action-btn--convert'}`}
                            onClick={() => !isWon && handleOpenConvert(lead)}
                            title={isWon ? 'Lead already converted to customer' : 'Convert Lead to Active Customer'}
                            disabled={isWon}
                            style={{
                              color: isWon ? '#10B981' : '#4F46E5',
                              borderColor: isWon ? '#D1FAE5' : '#E0E7FF',
                              background: isWon ? '#ECFDF5' : '#EEF2FF'
                            }}
                          >
                            <UserCheck size={14} />
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, marginLeft: '3px' }}>
                              {isWon ? 'Converted' : 'Convert'}
                            </span>
                          </button>

                          {/* View details */}
                          <button
                            type="button"
                            className="crm-action-btn"
                            onClick={() => handleOpenView(lead)}
                            title="View lead details & history"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            className="crm-action-btn"
                            onClick={() => handleOpenEdit(lead)}
                            title="Edit lead"
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            className="crm-action-btn crm-action-btn--danger"
                            onClick={() => handleOpenDelete(lead)}
                            title="Delete lead"
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

      {/* =========================================================================
          MODAL 1: ADD LEAD
          ========================================================================= */}
      {showAddModal && (
        <div className="crm-modal-overlay">
          <div className="crm-modal crm-modal--md">
            <div className="crm-modal-header">
              <div>
                <h2>Add New Lead</h2>
                <p>Register a prospective opportunity into your sales pipeline</p>
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
                  <label>Full Name *</label>
                  <input
                    type="text"
                    className={`crm-form-input ${formErrors.name ? 'error' : ''}`}
                    placeholder="e.g. Vikram Malhotra"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && <span className="crm-field-error">{formErrors.name}</span>}
                </div>

                <div className="crm-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className={`crm-form-input ${formErrors.email ? 'error' : ''}`}
                    placeholder="e.g. vikram@company.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {formErrors.email && <span className="crm-field-error">{formErrors.email}</span>}
                </div>
              </div>

              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="crm-form-input"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="crm-form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    className="crm-form-input"
                    placeholder="e.g. Zenith Enterprises"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
              </div>

              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Industry</label>
                  <select
                    className="crm-form-select"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div className="crm-form-group">
                  <label>Lead Source</label>
                  <select
                    className="crm-form-select"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  >
                    {LEAD_SOURCES.filter(s => s.value !== 'all').map((src) => (
                      <option key={src.value} value={src.value}>{src.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Initial Status</label>
                  <select
                    className="crm-form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {LEAD_STATUSES.filter(s => s.value !== 'all').map((st) => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>

                <div className="crm-form-group">
                  <label>Estimated Value (INR ₹)</label>
                  <div className="crm-input-with-symbol">
                    <span className="crm-input-prefix">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className={`crm-form-input ${formErrors.estimated_value ? 'error' : ''}`}
                      placeholder="e.g. 250000"
                      value={formData.estimated_value}
                      onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                    />
                  </div>
                  {formErrors.estimated_value && (
                    <span className="crm-field-error">{formErrors.estimated_value}</span>
                  )}
                </div>
              </div>

              <div className="crm-form-group">
                <label>Notes & Requirements</label>
                <textarea
                  className="crm-form-textarea"
                  rows={3}
                  placeholder="Key requirements, client objectives, or initial interaction notes..."
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
                  Save Lead
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIT LEAD
          ========================================================================= */}
      {showEditModal && (
        <div className="crm-modal-overlay">
          <div className="crm-modal crm-modal--md">
            <div className="crm-modal-header">
              <div>
                <h2>Edit Lead</h2>
                <p>Update information and pipeline status for {selectedLead?.name}</p>
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
                  <label>Full Name *</label>
                  <input
                    type="text"
                    className={`crm-form-input ${formErrors.name ? 'error' : ''}`}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && <span className="crm-field-error">{formErrors.name}</span>}
                </div>

                <div className="crm-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className={`crm-form-input ${formErrors.email ? 'error' : ''}`}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {formErrors.email && <span className="crm-field-error">{formErrors.email}</span>}
                </div>
              </div>

              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="crm-form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="crm-form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    className="crm-form-input"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
              </div>

              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Industry</label>
                  <select
                    className="crm-form-select"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div className="crm-form-group">
                  <label>Lead Source</label>
                  <select
                    className="crm-form-select"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  >
                    {LEAD_SOURCES.filter(s => s.value !== 'all').map((src) => (
                      <option key={src.value} value={src.value}>{src.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Pipeline Status</label>
                  <select
                    className="crm-form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {LEAD_STATUSES.filter(s => s.value !== 'all').map((st) => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>

                <div className="crm-form-group">
                  <label>Estimated Value (INR ₹)</label>
                  <div className="crm-input-with-symbol">
                    <span className="crm-input-prefix">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className={`crm-form-input ${formErrors.estimated_value ? 'error' : ''}`}
                      value={formData.estimated_value}
                      onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                    />
                  </div>
                  {formErrors.estimated_value && (
                    <span className="crm-field-error">{formErrors.estimated_value}</span>
                  )}
                </div>
              </div>

              <div className="crm-form-group">
                <label>Notes & History</label>
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
                  Update Lead
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: VIEW LEAD DETAILS & INTERACTION HISTORY
          ========================================================================= */}
      {showViewModal && selectedLead && (
        <div className="crm-modal-overlay">
          <div className="crm-modal crm-modal--lg">
            <div className="crm-modal-header">
              <div className="crm-modal-lead-title-box">
                <div className="crm-customer-avatar crm-customer-avatar--lg" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                  {selectedLead.name
                    ? selectedLead.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                    : 'LD'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <h2 style={{ margin: 0 }}>{selectedLead.name}</h2>
                    {getStatusBadge(selectedLead.status)}
                  </div>
                  <p style={{ margin: '0.2rem 0 0', color: 'var(--crm-text-secondary)', fontSize: '0.85rem' }}>
                    {selectedLead.company ? `${selectedLead.company} • ` : ''}
                    {selectedLead.industry || 'Business'} • Source: {selectedLead.source || 'Website'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {selectedLead.status !== 'Won' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={UserCheck}
                    onClick={() => handleOpenConvert(selectedLead)}
                  >
                    Convert to Customer
                  </Button>
                )}
                <button
                  type="button"
                  className="crm-modal-close"
                  onClick={() => setShowViewModal(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="crm-view-modal-content">
              {/* Top Highlights */}
              <div className="crm-lead-highlights-grid">
                <div className="crm-lead-highlight-box">
                  <div className="crm-highlight-label">Estimated Value (INR)</div>
                  <div className="crm-highlight-val text-brand">
                    {formatINR(selectedLead.estimated_value)}
                  </div>
                </div>

                <div className="crm-lead-highlight-box">
                  <div className="crm-highlight-label">Email Address</div>
                  <div className="crm-highlight-val" style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                    {selectedLead.email || 'None registered'}
                  </div>
                </div>

                <div className="crm-lead-highlight-box">
                  <div className="crm-highlight-label">Phone Contact</div>
                  <div className="crm-highlight-val" style={{ fontSize: '0.9rem' }}>
                    {selectedLead.phone || 'None registered'}
                  </div>
                </div>

                <div className="crm-lead-highlight-box">
                  <div className="crm-highlight-label">Pipeline Creation</div>
                  <div className="crm-highlight-val" style={{ fontSize: '0.9rem' }}>
                    {selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleDateString('en-IN') : 'Recent'}
                  </div>
                </div>
              </div>

              {/* Explainable AI Lead Score & Attribution Card */}
              <div className="crm-lead-score-card">
                <div className="crm-lead-score-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div className="crm-score-sparkle-icon">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <div className="crm-score-title-text">Explainable AI Lead Score</div>
                      <div className="crm-score-subtitle-text">
                        Deterministic Baseline Engine v1.0 • AI-Ready Architecture
                      </div>
                    </div>
                  </div>
                  <div>
                    {getScoreBadge(selectedLead.ai_score, selectedLead.priority)}
                  </div>
                </div>

                <div className="crm-score-overview-box">
                  <div className="crm-score-circle-badge">
                    <span className="crm-score-big-num">
                      {selectedLead.ai_score !== undefined && selectedLead.ai_score !== null ? selectedLead.ai_score : 0}
                    </span>
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
                        <span><strong>Recommended Next Step:</strong> {selectedLead.ai_metadata.recommended_action}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Factor Weight Breakdown */}
                {selectedLead.ai_metadata?.contributing_factors && selectedLead.ai_metadata.contributing_factors.length > 0 && (
                  <div className="crm-factor-breakdown-section">
                    <div className="crm-factor-breakdown-header">
                      <span>Scoring Factor Attribution</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--crm-text-muted)' }}>Documented Weights (Max 100 pts)</span>
                    </div>

                    <div className="crm-factors-grid">
                      {selectedLead.ai_metadata.contributing_factors.map((factor, idx) => {
                        const pct = factor.max_points > 0 ? Math.min(100, Math.round((factor.points_earned / factor.max_points) * 100)) : 0;
                        return (
                          <div key={idx} className="crm-factor-item">
                            <div className="crm-factor-top">
                              <span className="crm-factor-cat">{factor.category}</span>
                              <span className="crm-factor-pts">
                                <strong>+{factor.points_earned}</strong> / {factor.max_points} pts
                              </span>
                            </div>
                            <div className="crm-factor-bar-track">
                              <div
                                className="crm-factor-bar-fill"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: pct >= 80 ? '#10B981' : pct >= 50 ? '#6366F1' : '#F59E0B'
                                }}
                              />
                            </div>
                            <div className="crm-factor-meta-desc">
                              {factor.description}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedLead.notes && (
                <div className="crm-lead-notes-box">
                  <div className="crm-notes-header">
                    <FileText size={14} className="text-muted" />
                    <strong>Lead Background & Notes</strong>
                  </div>
                  <p className="crm-notes-text">{selectedLead.notes}</p>
                </div>
              )}

              {/* Interaction History Section */}
              <div className="crm-interactions-section">
                <div className="crm-interactions-header">
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Touchpoints & Interaction History</h3>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--crm-text-muted)' }}>
                      Track calls, meetings, emails, and notes with this lead
                    </p>
                  </div>

                  {!showInteractionForm && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Plus}
                      onClick={() => setShowInteractionForm(true)}
                    >
                      Log Touchpoint
                    </Button>
                  )}
                </div>

                {/* Quick Add Interaction Form */}
                {showInteractionForm && (
                  <form onSubmit={handleAddInteraction} className="crm-add-interaction-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <strong style={{ fontSize: '0.85rem' }}>Log New Lead Touchpoint</strong>
                      <button
                        type="button"
                        className="crm-text-link"
                        onClick={() => setShowInteractionForm(false)}
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="crm-form-row">
                      <div className="crm-form-group" style={{ flex: '0 0 160px' }}>
                        <label>Interaction Type</label>
                        <select
                          className="crm-form-select"
                          value={interactionData.type}
                          onChange={(e) => setInteractionData({ ...interactionData, type: e.target.value })}
                        >
                          <option value="call">Phone Call</option>
                          <option value="email">Email</option>
                          <option value="meeting">Meeting</option>
                          <option value="note">Internal Note</option>
                        </select>
                      </div>

                      <div className="crm-form-group" style={{ flex: 1 }}>
                        <label>Description / Details *</label>
                        <input
                          type="text"
                          className="crm-form-input"
                          placeholder="e.g. Discussed pricing model; client requested custom enterprise SLA..."
                          value={interactionData.description}
                          onChange={(e) => setInteractionData({ ...interactionData, description: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        loading={loggingInteraction}
                      >
                        Save Touchpoint
                      </Button>
                    </div>
                  </form>
                )}

                {/* Timeline */}
                {loadingDetails ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--crm-text-muted)' }}>
                    <RefreshCw size={18} className="crm-spin" />
                  </div>
                ) : !selectedLead.interactions || selectedLead.interactions.length === 0 ? (
                  <div className="crm-interactions-empty">
                    <Clock size={20} className="text-muted" />
                    <span>No interactions logged yet for this lead. Click "Log Touchpoint" to add the first record.</span>
                  </div>
                ) : (
                  <div className="crm-timeline">
                    {selectedLead.interactions.map((it) => (
                      <div key={it.id} className="crm-timeline-item">
                        <div className="crm-timeline-dot">
                          {getInteractionIcon(it.type)}
                        </div>
                        <div className="crm-timeline-body">
                          <div className="crm-timeline-top">
                            <span className="crm-timeline-type" style={{ textTransform: 'capitalize' }}>
                              {it.type}
                            </span>
                            <span className="crm-timeline-date">
                              {it.created_at ? new Date(it.created_at).toLocaleString('en-IN') : 'Recent'}
                            </span>
                          </div>
                          <div className="crm-timeline-desc">
                            {it.description}
                          </div>
                          {it.created_by_name && (
                            <div className="crm-timeline-author">
                              Logged by {it.created_by_name}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: CONVERT LEAD TO CUSTOMER
          ========================================================================= */}
      {showConvertModal && selectedLead && (
        <div className="crm-modal-overlay">
          <div className="crm-modal crm-modal--sm">
            <div className="crm-modal-header">
              <div>
                <h2>Convert to Customer</h2>
                <p>Promote lead to an active client with full relational integrity</p>
              </div>
              <button
                type="button"
                className="crm-modal-close"
                onClick={() => setShowConvertModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="crm-modal-body" style={{ padding: '1.25rem 1.5rem' }}>
              <div className="crm-convert-info-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                  <UserCheck size={20} className="text-emerald" />
                  <strong style={{ fontSize: '0.95rem' }}>{selectedLead.name}</strong>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--crm-text-secondary)', lineHeight: 1.45 }}>
                  {selectedLead.company ? `Company: ${selectedLead.company} • ` : ''}
                  {selectedLead.email ? `Email: ${selectedLead.email}` : 'No email'}
                </div>
              </div>

              <div className="crm-convert-checklist">
                <div className="crm-checklist-item">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <span>Creates/links customer record in PostgreSQL <code>customers</code> table</span>
                </div>
                <div className="crm-checklist-item">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <span>Checks existing customer emails to safely prevent duplicates</span>
                </div>
                <div className="crm-checklist-item">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <span>Updates lead status to <strong>Deal Secured</strong> and preserves all interaction history</span>
                </div>
                <div className="crm-checklist-item">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <span>Executed within a transactional database boundary (ACID)</span>
                </div>
              </div>
            </div>

            <div className="crm-modal-actions">
              <Button
                variant="outline"
                onClick={() => setShowConvertModal(false)}
                disabled={converting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmConvert}
                loading={converting}
                icon={UserCheck}
              >
                Confirm Conversion
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: DELETE LEAD CONFIRMATION
          ========================================================================= */}
      {showDeleteModal && selectedLead && (
        <div className="crm-modal-overlay">
          <div className="crm-modal crm-modal--sm">
            <div className="crm-modal-header">
              <div>
                <h2>Delete Lead</h2>
                <p>Are you sure you want to remove this lead?</p>
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
                This will permanently delete <strong>{selectedLead.name}</strong> and all associated touchpoint history from PostgreSQL. This action cannot be undone.
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
                Delete Lead
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
