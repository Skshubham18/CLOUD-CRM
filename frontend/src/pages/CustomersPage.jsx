import React, { useState, useEffect } from 'react';
import {
  Users,
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
  ChevronRight
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import {
  getCustomersApi,
  getCustomerApi,
  createCustomerApi,
  updateCustomerApi,
  deleteCustomerApi,
  addCustomerInteractionApi
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';

export default function CustomersPage() {
  const { user } = useAuth();

  // Customer list state
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Selected customer for View/Edit/Delete
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form states for Add/Edit Customer
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: 'Technology',
    status: 'active',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Interaction logging state
  const [interactionData, setInteractionData] = useState({
    interaction_type: 'call',
    subject: '',
    notes: '',
    interaction_date: new Date().toISOString().split('T')[0]
  });
  const [loggingInteraction, setLoggingInteraction] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);

  // Alerts
  const [bannerAlert, setBannerAlert] = useState(null);

  const industries = [
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

  // Fetch customers
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await getCustomersApi({ search, status: statusFilter });
      setCustomers(res.data.customers || []);
    } catch (err) {
      setBannerAlert({ type: 'error', message: err.message || 'Failed to load customers' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      industry: 'Technology',
      status: 'active',
      notes: ''
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      company: customer.company || '',
      industry: customer.industry || 'Technology',
      status: customer.status || 'active',
      notes: customer.notes || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Open View Details Modal
  const handleOpenView = async (customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
    setShowInteractionForm(false);
    setLoadingDetails(true);

    try {
      const res = await getCustomerApi(customer.id);
      setSelectedCustomer(res.data.customer);
    } catch (err) {
      console.error('Failed to load customer interactions:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Customer name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email format';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Add Customer
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await createCustomerApi(formData);
      setBannerAlert({ type: 'success', message: `Customer "${formData.name}" added successfully!` });
      setShowAddModal(false);
      fetchCustomers();
    } catch (err) {
      setFormErrors({ general: err.message || 'Failed to create customer' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Customer
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await updateCustomerApi(selectedCustomer.id, formData);
      setBannerAlert({ type: 'success', message: `Customer "${formData.name}" updated successfully!` });
      setShowEditModal(false);
      fetchCustomers();
    } catch (err) {
      setFormErrors({ general: err.message || 'Failed to update customer' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delete Customer
  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return;
    setSubmitting(true);
    try {
      await deleteCustomerApi(selectedCustomer.id);
      setBannerAlert({ type: 'success', message: `Customer "${selectedCustomer.name}" deleted.` });
      setShowDeleteModal(false);
      fetchCustomers();
    } catch (err) {
      setBannerAlert({ type: 'error', message: err.message || 'Failed to delete customer' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit New Interaction
  const handleAddInteractionSubmit = async (e) => {
    e.preventDefault();
    if (!interactionData.subject.trim()) return;

    setLoggingInteraction(true);
    try {
      await addCustomerInteractionApi(selectedCustomer.id, interactionData);
      // Refresh customer details to get updated interaction timeline
      const updated = await getCustomerApi(selectedCustomer.id);
      setSelectedCustomer(updated.data.customer);
      setInteractionData({
        interaction_type: 'call',
        subject: '',
        notes: '',
        interaction_date: new Date().toISOString().split('T')[0]
      });
      setShowInteractionForm(false);
      setBannerAlert({ type: 'success', message: 'Interaction logged successfully.' });
    } catch (err) {
      alert(err.message || 'Failed to log interaction');
    } finally {
      setLoggingInteraction(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInteractionIcon = (type) => {
    switch (type) {
      case 'call': return PhoneCall;
      case 'email': return Mail;
      case 'meeting': return Video;
      default: return MessageSquare;
    }
  };

  return (
    <div className="crm-customers-page">
      {/* Page Header */}
      <div className="crm-page-header">
        <div>
          <div className="crm-page-badge">
            <span className="crm-page-badge-dot" />
            <span>Customer Directory</span>
          </div>
          <h1>Customer Management</h1>
          <p className="crm-page-subtitle">
            Manage your small business client relationships, accounts, contact channels, and touchpoint history.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleOpenAdd}
          icon={UserPlus}
        >
          Add New Customer
        </Button>
      </div>

      {/* Alert Banner */}
      {bannerAlert && (
        <div className={`crm-alert crm-alert--${bannerAlert.type} mb-4`}>
          {bannerAlert.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{bannerAlert.message}</span>
          <button
            type="button"
            className="crm-alert-close"
            onClick={() => setBannerAlert(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="crm-filters-card">
        <div className="crm-search-box">
          <Search size={17} className="crm-search-icon" />
          <input
            type="text"
            className="crm-search-input"
            placeholder="Search by name, email, or company..."
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

        <div className="crm-status-filter-group">
          <Filter size={15} className="text-muted" />
          <span className="crm-filter-label">Status:</span>
          <select
            className="crm-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="prospect">Prospect</option>
            <option value="lead">Lead</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="button"
            className="crm-refresh-btn"
            onClick={fetchCustomers}
            title="Refresh list"
          >
            <RefreshCw size={15} className={loading ? 'crm-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Customer Data Table */}
      <Card noPadding={true} className="crm-table-card">
        <div className="crm-table-responsive">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Customer / Contact</th>
                <th>Company & Industry</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Created Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="crm-table-loading">
                    <div className="crm-loading-spinner" />
                    <span>Loading customers...</span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="crm-table-empty">
                    <Users size={36} className="text-muted mb-2" />
                    <p className="font-semibold">No customers found</p>
                    <span className="text-muted text-sm">
                      {search || statusFilter !== 'all'
                        ? 'Try adjusting your search keywords or status filter.'
                        : 'Get started by adding your first small business customer.'}
                    </span>
                    {!search && statusFilter === 'all' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleOpenAdd}
                        className="mt-3"
                        icon={Plus}
                      >
                        Add First Customer
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="crm-table-row">
                    <td>
                      <div className="crm-customer-cell">
                        <div className="crm-customer-avatar">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="crm-customer-name">{c.name}</div>
                          <div className="crm-customer-email">
                            <Mail size={12} />
                            <span>{c.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="crm-company-cell">
                        <div className="crm-company-name">
                          <Building size={13} className="text-muted" />
                          <span>{c.company || 'Individual / None'}</span>
                        </div>
                        <span className="crm-industry-tag">{c.industry || 'General'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="crm-phone-text">
                        {c.phone ? (
                          <>
                            <Phone size={12} className="text-muted" />
                            {c.phone}
                          </>
                        ) : (
                          <span className="text-muted">---</span>
                        )}
                      </span>
                    </td>
                    <td>
                      <StatusBadge
                        status={c.status === 'active' ? 'success' : c.status === 'prospect' ? 'info' : c.status === 'lead' ? 'warning' : 'default'}
                        label={c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : 'Active'}
                      />
                    </td>
                    <td>
                      <span className="crm-date-text font-mono text-sm">
                        {formatDate(c.created_at)}
                      </span>
                    </td>
                    <td>
                      <div className="crm-actions-cell">
                        <button
                          type="button"
                          className="crm-action-icon-btn"
                          title="View Details & Interactions"
                          onClick={() => handleOpenView(c)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          className="crm-action-icon-btn"
                          title="Edit Customer"
                          onClick={() => handleOpenEdit(c)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="crm-action-icon-btn crm-action-icon-btn--delete"
                          title="Delete Customer"
                          onClick={() => handleOpenDelete(c)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="crm-table-footer">
          <span className="crm-table-count text-muted text-sm">
            Showing <strong>{customers.length}</strong> {customers.length === 1 ? 'customer' : 'customers'}
          </span>
        </div>
      </Card>

      {/* ======================================================================
          MODAL: ADD / EDIT CUSTOMER
          ====================================================================== */}
      {(showAddModal || showEditModal) && (
        <div className="crm-modal-overlay">
          <div className="crm-modal">
            <div className="crm-modal-header">
              <h3>{showAddModal ? 'Add New Customer' : 'Edit Customer'}</h3>
              <button
                type="button"
                className="crm-modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleCreateSubmit : handleUpdateSubmit}>
              <div className="crm-modal-body">
                {formErrors.general && (
                  <div className="crm-alert crm-alert--error mb-3">
                    <AlertCircle size={15} />
                    <span>{formErrors.general}</span>
                  </div>
                )}

                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Full Name *</label>
                    <input
                      type="text"
                      className={`crm-input ${formErrors.name ? 'crm-input--error' : ''}`}
                      placeholder="e.g. John Smith"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                    {formErrors.name && <span className="crm-input-error-msg">{formErrors.name}</span>}
                  </div>

                  <div className="crm-form-group">
                    <label className="crm-form-label">Email Address *</label>
                    <input
                      type="email"
                      className={`crm-input ${formErrors.email ? 'crm-input--error' : ''}`}
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                    {formErrors.email && <span className="crm-input-error-msg">{formErrors.email}</span>}
                  </div>
                </div>

                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="crm-input"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="crm-form-group">
                    <label className="crm-form-label">Company Name</label>
                    <input
                      type="text"
                      className="crm-input"
                      placeholder="Acme Corp"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                </div>

                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label className="crm-form-label">Industry</label>
                    <select
                      className="crm-input"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    >
                      {industries.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>

                  <div className="crm-form-group">
                    <label className="crm-form-label">Status</label>
                    <select
                      className="crm-input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="prospect">Prospect</option>
                      <option value="lead">Lead</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="crm-form-group">
                  <label className="crm-form-label">Notes & Comments</label>
                  <textarea
                    className="crm-input crm-textarea"
                    rows="3"
                    placeholder="Key account details, preferences, initial requirements..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="crm-modal-footer">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={submitting}
                  icon={CheckCircle2}
                >
                  {showAddModal ? 'Create Customer' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL: VIEW CUSTOMER DETAILS & INTERACTIONS
          ====================================================================== */}
      {showViewModal && selectedCustomer && (
        <div className="crm-modal-overlay">
          <div className="crm-modal crm-modal--lg">
            <div className="crm-modal-header">
              <div className="crm-modal-header-profile">
                <div className="crm-customer-avatar crm-customer-avatar--lg">
                  {selectedCustomer.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="crm-modal-title">{selectedCustomer.name}</h3>
                  <p className="crm-modal-sub">
                    {selectedCustomer.company ? `${selectedCustomer.company} • ` : ''}
                    {selectedCustomer.industry || 'General'}
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

            <div className="crm-modal-body crm-details-body">
              {/* Customer Info Card */}
              <div className="crm-details-grid">
                <div className="crm-details-item">
                  <span className="crm-details-label">Email Address</span>
                  <div className="crm-details-val">
                    <Mail size={14} className="text-brand" />
                    <a href={`mailto:${selectedCustomer.email}`}>{selectedCustomer.email}</a>
                  </div>
                </div>

                <div className="crm-details-item">
                  <span className="crm-details-label">Phone</span>
                  <div className="crm-details-val">
                    <Phone size={14} className="text-emerald" />
                    <span>{selectedCustomer.phone || 'No phone provided'}</span>
                  </div>
                </div>

                <div className="crm-details-item">
                  <span className="crm-details-label">Account Status</span>
                  <div className="crm-details-val">
                    <StatusBadge
                      status={selectedCustomer.status === 'active' ? 'success' : selectedCustomer.status === 'prospect' ? 'info' : selectedCustomer.status === 'lead' ? 'warning' : 'default'}
                      label={selectedCustomer.status ? selectedCustomer.status.toUpperCase() : 'ACTIVE'}
                    />
                  </div>
                </div>

                <div className="crm-details-item">
                  <span className="crm-details-label">Created Date</span>
                  <div className="crm-details-val">
                    <Calendar size={14} className="text-muted" />
                    <span>{formatDate(selectedCustomer.created_at)}</span>
                  </div>
                </div>
              </div>

              {selectedCustomer.notes && (
                <div className="crm-details-notes">
                  <span className="crm-details-label">Account Notes</span>
                  <p>{selectedCustomer.notes}</p>
                </div>
              )}

              {/* Interactions Section */}
              <div className="crm-interactions-section">
                <div className="crm-interactions-header">
                  <div className="crm-interactions-title">
                    <MessageSquare size={16} className="text-brand" />
                    <span>Interaction History ({selectedCustomer.interactions?.length || 0})</span>
                  </div>

                  {!showInteractionForm && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowInteractionForm(true)}
                      icon={Plus}
                    >
                      Log Interaction
                    </Button>
                  )}
                </div>

                {/* Log Interaction Inline Form */}
                {showInteractionForm && (
                  <form onSubmit={handleAddInteractionSubmit} className="crm-interaction-form">
                    <div className="crm-interaction-form-header">
                      <strong>Log Customer Touchpoint</strong>
                      <button
                        type="button"
                        className="crm-link-btn"
                        onClick={() => setShowInteractionForm(false)}
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="crm-form-row">
                      <div className="crm-form-group">
                        <label className="crm-form-label">Type</label>
                        <select
                          className="crm-input"
                          value={interactionData.interaction_type}
                          onChange={(e) => setInteractionData({ ...interactionData, interaction_type: e.target.value })}
                        >
                          <option value="call">Phone Call</option>
                          <option value="email">Email</option>
                          <option value="meeting">Meeting</option>
                          <option value="note">Internal Note</option>
                        </select>
                      </div>

                      <div className="crm-form-group">
                        <label className="crm-form-label">Date</label>
                        <input
                          type="date"
                          className="crm-input"
                          value={interactionData.interaction_date}
                          onChange={(e) => setInteractionData({ ...interactionData, interaction_date: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="crm-form-group">
                      <label className="crm-form-label">Subject / Purpose *</label>
                      <input
                        type="text"
                        className="crm-input"
                        placeholder="e.g. Discovery call on CRM software upgrade"
                        value={interactionData.subject}
                        onChange={(e) => setInteractionData({ ...interactionData, subject: e.target.value })}
                        required
                      />
                    </div>

                    <div className="crm-form-group">
                      <label className="crm-form-label">Details / Outcome</label>
                      <textarea
                        className="crm-input crm-textarea"
                        rows="2"
                        placeholder="Discussion notes, action items, next steps..."
                        value={interactionData.notes}
                        onChange={(e) => setInteractionData({ ...interactionData, notes: e.target.value })}
                      />
                    </div>

                    <div className="crm-interaction-form-actions">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        loading={loggingInteraction}
                        icon={CheckCircle2}
                      >
                        Save Interaction
                      </Button>
                    </div>
                  </form>
                )}

                {/* Interactions Timeline */}
                <div className="crm-timeline">
                  {loadingDetails ? (
                    <div className="crm-timeline-loading">
                      <div className="crm-loading-spinner" />
                      <span>Loading interactions...</span>
                    </div>
                  ) : !selectedCustomer.interactions || selectedCustomer.interactions.length === 0 ? (
                    <div className="crm-timeline-empty">
                      <Clock size={24} className="text-muted mb-1" />
                      <p>No interactions logged yet.</p>
                      <span className="text-muted text-sm">Click "Log Interaction" to record calls, emails, or meetings.</span>
                    </div>
                  ) : (
                    selectedCustomer.interactions.map((inter) => {
                      const Icon = getInteractionIcon(inter.interaction_type);
                      return (
                        <div key={inter.id} className="crm-timeline-entry">
                          <div className={`crm-timeline-icon crm-timeline-icon--${inter.interaction_type}`}>
                            <Icon size={14} />
                          </div>
                          <div className="crm-timeline-content">
                            <div className="crm-timeline-meta">
                              <span className="crm-timeline-subject">{inter.subject}</span>
                              <span className="crm-timeline-date">{formatDate(inter.interaction_date)}</span>
                            </div>
                            {inter.notes && <p className="crm-timeline-notes">{inter.notes}</p>}
                            <div className="crm-timeline-author">
                              Recorded by: <span>{inter.created_by_name || 'CRM User'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="crm-modal-footer">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL: DELETE CONFIRMATION
          ====================================================================== */}
      {showDeleteModal && selectedCustomer && (
        <div className="crm-modal-overlay">
          <div className="crm-modal crm-modal--sm">
            <div className="crm-modal-header">
              <div className="crm-delete-modal-icon">
                <Trash2 size={22} className="text-rose" />
              </div>
              <button
                type="button"
                className="crm-modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="crm-modal-body text-center">
              <h3>Delete Customer?</h3>
              <p className="crm-delete-modal-text">
                Are you sure you want to delete <strong>{selectedCustomer.name}</strong>?
                This will also remove all associated touchpoint and interaction logs.
              </p>
            </div>

            <div className="crm-modal-footer crm-modal-footer--center">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={handleDeleteConfirm}
                loading={submitting}
                icon={Trash2}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
