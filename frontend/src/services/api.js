/**
 * API Service Layer for AI-Powered Cloud CRM
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '/api' : 'http://127.0.0.1:5000/api')
).replace(/\/$/, '');
const TOKEN_KEY = 'cloud_crm_jwt_token';

/**
 * Gets active JWT token from localStorage or argument
 */
function getAuthToken(explicitToken) {
  return explicitToken || localStorage.getItem(TOKEN_KEY) || '';
}

/**
 * Helper to perform JSON requests with proper error handling and auth headers
 */
async function request(endpoint, options = {}, token) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const authToken = getAuthToken(token);

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (!error.status) {
      error.status = 0;
      error.message = error.message || 'Unable to connect to CRM API server. Check if backend is running.';
    }
    throw error;
  }
}

/* ==========================================================================
   Authentication APIs
   ========================================================================== */

export async function registerApi(userData) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function loginApi(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}

export async function getMeApi(token) {
  return request('/auth/me', {
    method: 'GET'
  }, token);
}

/* ==========================================================================
   Customer Management APIs (Phase 3)
   ========================================================================== */

/**
 * Get all customers with search and status filtering
 * GET /api/customers?search=...&status=...
 */
export async function getCustomersApi({ search = '', status = '' } = {}, token) {
  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (status && status !== 'all') queryParams.append('status', status);

  const queryString = queryParams.toString();
  const endpoint = `/customers${queryString ? `?${queryString}` : ''}`;

  return request(endpoint, { method: 'GET' }, token);
}

/**
 * Get single customer details with interaction history
 * GET /api/customers/:id
 */
export async function getCustomerApi(id, token) {
  return request(`/customers/${id}`, { method: 'GET' }, token);
}

/**
 * Create a new customer
 * POST /api/customers
 */
export async function createCustomerApi(customerData, token) {
  return request('/customers', {
    method: 'POST',
    body: JSON.stringify(customerData)
  }, token);
}

/**
 * Update an existing customer
 * PUT /api/customers/:id
 */
export async function updateCustomerApi(id, customerData, token) {
  return request(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customerData)
  }, token);
}

/**
 * Delete a customer
 * DELETE /api/customers/:id
 */
export async function deleteCustomerApi(id, token) {
  return request(`/customers/${id}`, {
    method: 'DELETE'
  }, token);
}

/**
 * Get customer interaction history
 * GET /api/customers/:id/interactions
 */
export async function getCustomerInteractionsApi(id, token) {
  return request(`/customers/${id}/interactions`, { method: 'GET' }, token);
}

/**
 * Add a new interaction to a customer
 * POST /api/customers/:id/interactions
 */
export async function addCustomerInteractionApi(id, interactionData, token) {
  return request(`/customers/${id}/interactions`, {
    method: 'POST',
    body: JSON.stringify(interactionData)
  }, token);
}

/* ==========================================================================
   Lead Management APIs (Phase 4A)
   ========================================================================== */

/**
 * Get all leads with search, status, and source filtering
 * GET /api/leads?search=...&status=...&source=...
 */
export async function getLeadsApi({ search = '', status = '', source = '', page = 1, limit = 50 } = {}, token) {
  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (status && status !== 'all') queryParams.append('status', status);
  if (source && source !== 'all') queryParams.append('source', source);
  if (page) queryParams.append('page', page);
  if (limit) queryParams.append('limit', limit);

  const queryString = queryParams.toString();
  const endpoint = `/leads${queryString ? `?${queryString}` : ''}`;

  return request(endpoint, { method: 'GET' }, token);
}

/**
 * Get single lead details with interactions
 * GET /api/leads/:id
 */
export async function getLeadApi(id, token) {
  return request(`/leads/${id}`, { method: 'GET' }, token);
}

/**
 * Create a new lead
 * POST /api/leads
 */
export async function createLeadApi(leadData, token) {
  return request('/leads', {
    method: 'POST',
    body: JSON.stringify(leadData)
  }, token);
}

/**
 * Update an existing lead
 * PUT /api/leads/:id
 */
export async function updateLeadApi(id, leadData, token) {
  return request(`/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(leadData)
  }, token);
}

/**
 * Delete a lead
 * DELETE /api/leads/:id
 */
export async function deleteLeadApi(id, token) {
  return request(`/leads/${id}`, {
    method: 'DELETE'
  }, token);
}

/**
 * Convert lead to customer
 * POST /api/leads/:id/convert
 */
export async function convertLeadToCustomerApi(id, token) {
  return request(`/leads/${id}/convert`, {
    method: 'POST'
  }, token);
}

/**
 * Get explainable lead score breakdown
 * GET /api/leads/:id/score
 */
export async function getLeadScoreApi(id, token) {
  return request(`/leads/${id}/score`, { method: 'GET' }, token);
}

/**
 * Get lead interaction history
 * GET /api/leads/:id/interactions
 */
export async function getLeadInteractionsApi(id, token) {
  return request(`/leads/${id}/interactions`, { method: 'GET' }, token);
}

/**
 * Add a new interaction to a lead
 * POST /api/leads/:id/interactions
 */
export async function addLeadInteractionApi(id, interactionData, token) {
  return request(`/leads/${id}/interactions`, {
    method: 'POST',
    body: JSON.stringify(interactionData)
  }, token);
}

/**
 * Delete an interaction from a lead
 * DELETE /api/leads/:id/interactions/:interactionId
 */
export async function deleteLeadInteractionApi(id, interactionId, token) {
  return request(`/leads/${id}/interactions/${interactionId}`, {
    method: 'DELETE'
  }, token);
}

/* ==========================================================================
   Deal Management & Sales Pipeline APIs (Phase 4B)
   ========================================================================== */

/**
 * Get all deals with search, stage, customer, and lead filtering
 * GET /api/deals?search=...&stage=...&customerId=...&leadId=...
 */
export async function getDealsApi({ search = '', stage = '', customerId = '', leadId = '', page = 1, limit = 50 } = {}, token) {
  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (stage && stage !== 'all') queryParams.append('stage', stage);
  if (customerId) queryParams.append('customerId', customerId);
  if (leadId) queryParams.append('leadId', leadId);
  if (page) queryParams.append('page', page);
  if (limit) queryParams.append('limit', limit);

  const queryString = queryParams.toString();
  const endpoint = `/deals${queryString ? `?${queryString}` : ''}`;

  return request(endpoint, { method: 'GET' }, token);
}

/**
 * Get deal pipeline summary metrics
 * GET /api/deals/metrics/summary
 */
export async function getDealMetricsApi(token) {
  return request('/deals/metrics/summary', { method: 'GET' }, token);
}

/**
 * Get single deal details
 * GET /api/deals/:id
 */
export async function getDealApi(id, token) {
  return request(`/deals/${id}`, { method: 'GET' }, token);
}

/**
 * Create a new deal
 * POST /api/deals
 */
export async function createDealApi(dealData, token) {
  return request('/deals', {
    method: 'POST',
    body: JSON.stringify(dealData)
  }, token);
}

/**
 * Update an existing deal
 * PUT /api/deals/:id
 */
export async function updateDealApi(id, dealData, token) {
  return request(`/deals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dealData)
  }, token);
}

/**
 * Delete a deal
 * DELETE /api/deals/:id
 */
export async function deleteDealApi(id, token) {
  return request(`/deals/${id}`, {
    method: 'DELETE'
  }, token);
}

/* ==========================================================================
   Analytics & Reporting APIs (Phase 5)
   ========================================================================== */

/**
 * Get consolidated dashboard analytics
 * GET /api/analytics/dashboard?timeRange=...&startDate=...&endDate=...
 */
export async function getDashboardAnalyticsApi(params = {}, token) {
  const queryParams = new URLSearchParams();
  if (params.timeRange && params.timeRange !== 'all') queryParams.append('timeRange', params.timeRange);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const endpoint = `/analytics/dashboard${queryString ? `?${queryString}` : ''}`;

  return request(endpoint, { method: 'GET' }, token);
}

/**
 * Get high-level overview KPIs
 * GET /api/analytics/overview
 */
export async function getOverviewMetricsApi(params = {}, token) {
  const queryParams = new URLSearchParams();
  if (params.timeRange && params.timeRange !== 'all') queryParams.append('timeRange', params.timeRange);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const endpoint = `/analytics/overview${queryString ? `?${queryString}` : ''}`;

  return request(endpoint, { method: 'GET' }, token);
}

/**
 * Get lead analytics breakdown
 * GET /api/analytics/leads
 */
export async function getLeadAnalyticsApi(params = {}, token) {
  const queryParams = new URLSearchParams();
  if (params.timeRange && params.timeRange !== 'all') queryParams.append('timeRange', params.timeRange);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const endpoint = `/analytics/leads${queryString ? `?${queryString}` : ''}`;

  return request(endpoint, { method: 'GET' }, token);
}

/**
 * Get deal & pipeline analytics breakdown
 * GET /api/analytics/deals
 */
export async function getDealAnalyticsApi(params = {}, token) {
  const queryParams = new URLSearchParams();
  if (params.timeRange && params.timeRange !== 'all') queryParams.append('timeRange', params.timeRange);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const endpoint = `/analytics/deals${queryString ? `?${queryString}` : ''}`;

  return request(endpoint, { method: 'GET' }, token);
}

/* ==========================================================================
   Health Check API (Phase 1)
   ========================================================================== */

export async function checkBackendHealth() {
  const startTime = performance.now();
  const targetUrl = `${API_BASE_URL}/health`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        ok: false,
        status: response.status,
        latencyMs,
        data: errorData,
        error: `Server responded with HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      ok: true,
      status: response.status,
      latencyMs,
      data,
      error: null,
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      ok: false,
      status: 0,
      latencyMs,
      data: null,
      error: err.message || 'Failed to connect to backend server. Ensure backend is running on port 5000.',
    };
  }
}
