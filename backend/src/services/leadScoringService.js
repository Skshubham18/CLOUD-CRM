/**
 * Lead Scoring Service (Deterministic Rule-Based Baseline Engine v1.0)
 *
 * Provides an explainable, deterministic baseline scoring model (0–100)
 * designed as an architectural boundary ready for future AI/ML enhancement.
 *
 * Scored Factors & Weights (Total Max: 100 Points):
 * 1. Qualification & Stage Status: Max 30 pts
 * 2. Contact Completeness: Max 20 pts
 * 3. Company & Market Fit: Max 15 pts
 * 4. Lead Source Quality: Max 15 pts
 * 5. Estimated Deal Potential (INR): Max 20 pts
 */

const SCORING_VERSION = '1.0.0';
const SCORING_ENGINE = 'Deterministic Rule-Based Baseline Engine';

/**
 * Calculates deterministic lead score and structured explanation breakdown.
 *
 * @param {Object} lead - The lead record from PostgreSQL
 * @param {Array} [interactions=[]] - Optional lead interactions for activity assessment
 * @returns {Object} Structured explainable scoring payload
 */
function calculateLeadScore(lead, interactions = []) {
  if (!lead || typeof lead !== 'object') {
    throw new Error('Valid lead record is required for lead scoring');
  }

  const contributing_factors = [];
  let totalScore = 0;

  // -------------------------------------------------------------
  // Factor 1: Qualification & Stage Status (Max 30 pts)
  // -------------------------------------------------------------
  const status = (lead.status || 'New').trim();
  let stagePoints = 0;
  let stageDesc = '';

  switch (status.toLowerCase()) {
    case 'won':
      stagePoints = 30;
      stageDesc = 'Deal converted / won (+30 pts)';
      break;
    case 'proposal':
      stagePoints = 25;
      stageDesc = 'Active proposal sent and under consideration (+25 pts)';
      break;
    case 'qualified':
      stagePoints = 20;
      stageDesc = 'Lead vetted and sales qualified (+20 pts)';
      break;
    case 'contacted':
      stagePoints = 10;
      stageDesc = 'Initial contact established (+10 pts)';
      break;
    case 'new':
      stagePoints = 5;
      stageDesc = 'Fresh uncontacted prospect (+5 pts)';
      break;
    case 'lost':
    default:
      stagePoints = 0;
      stageDesc = status.toLowerCase() === 'lost' ? 'Lead marked as lost (0 pts)' : 'Unspecified stage (0 pts)';
      break;
  }

  totalScore += stagePoints;
  contributing_factors.push({
    category: 'Stage Qualification',
    factor: `Status: ${status}`,
    points_earned: stagePoints,
    max_points: 30,
    description: stageDesc
  });

  // -------------------------------------------------------------
  // Factor 2: Contact Completeness (Max 20 pts)
  // -------------------------------------------------------------
  const hasEmail = Boolean(lead.email && lead.email.trim());
  const hasPhone = Boolean(lead.phone && lead.phone.trim());
  let contactPoints = 0;
  const contactDetails = [];

  if (hasEmail) {
    contactPoints += 10;
    contactDetails.push('Email verified (+10)');
  } else {
    contactDetails.push('Missing email (0)');
  }

  if (hasPhone) {
    contactPoints += 10;
    contactDetails.push('Phone provided (+10)');
  } else {
    contactDetails.push('Missing phone (0)');
  }

  totalScore += contactPoints;
  contributing_factors.push({
    category: 'Contact Completeness',
    factor: `${contactPoints === 20 ? 'Complete' : contactPoints === 10 ? 'Partial' : 'Incomplete'} Contact Info`,
    points_earned: contactPoints,
    max_points: 20,
    description: contactDetails.join(', ')
  });

  // -------------------------------------------------------------
  // Factor 3: Company & Market Fit (Max 15 pts)
  // -------------------------------------------------------------
  const hasCompany = Boolean(lead.company && lead.company.trim());
  const industry = (lead.industry || '').trim();
  const hasValidIndustry = Boolean(industry && industry.toLowerCase() !== 'other' && industry.toLowerCase() !== 'general');
  let companyPoints = 0;
  const companyDetails = [];

  if (hasCompany) {
    companyPoints += 8;
    companyDetails.push(`Company: ${lead.company} (+8)`);
  } else {
    companyDetails.push('No company specified (0)');
  }

  if (hasValidIndustry) {
    companyPoints += 7;
    companyDetails.push(`Industry: ${industry} (+7)`);
  } else if (industry) {
    companyPoints += 3;
    companyDetails.push(`Generic Industry: ${industry} (+3)`);
  } else {
    companyDetails.push('Unspecified industry (0)');
  }

  totalScore += companyPoints;
  contributing_factors.push({
    category: 'Company & Market Fit',
    factor: hasCompany ? lead.company : 'Individual / Unspecified',
    points_earned: companyPoints,
    max_points: 15,
    description: companyDetails.join(', ')
  });

  // -------------------------------------------------------------
  // Factor 4: Lead Acquisition Source Quality (Max 15 pts)
  // -------------------------------------------------------------
  const source = (lead.source || 'Website').trim();
  let sourcePoints = 0;
  let sourceDesc = '';

  switch (source.toLowerCase()) {
    case 'referral':
      sourcePoints = 15;
      sourceDesc = 'High-trust warm referral (+15 pts)';
      break;
    case 'website':
    case 'email':
      sourcePoints = 10;
      sourceDesc = 'Inbound digital channel (+10 pts)';
      break;
    case 'social media':
    case 'advertisement':
      sourcePoints = 7;
      sourceDesc = 'Marketing campaign acquisition (+7 pts)';
      break;
    case 'cold call':
      sourcePoints = 4;
      sourceDesc = 'Outbound cold prospecting (+4 pts)';
      break;
    default:
      sourcePoints = 4;
      sourceDesc = 'General acquisition channel (+4 pts)';
      break;
  }

  totalScore += sourcePoints;
  contributing_factors.push({
    category: 'Source Channel',
    factor: `Channel: ${source}`,
    points_earned: sourcePoints,
    max_points: 15,
    description: sourceDesc
  });

  // -------------------------------------------------------------
  // Factor 5: Estimated Deal Potential (Max 20 pts)
  // -------------------------------------------------------------
  const numericValue = Number(lead.estimated_value) || 0;
  let valuePoints = 0;
  let valueDesc = '';

  if (numericValue >= 1000000) {
    // 10 Lakhs or more
    valuePoints = 20;
    valueDesc = 'High-ticket enterprise opportunity (>= ₹10,00,000) (+20 pts)';
  } else if (numericValue >= 500000) {
    // 5 Lakhs or more
    valuePoints = 15;
    valueDesc = 'Mid-market growth opportunity (>= ₹5,00,000) (+15 pts)';
  } else if (numericValue >= 100000) {
    // 1 Lakh or more
    valuePoints = 10;
    valueDesc = 'Standard commercial opportunity (>= ₹1,00,000) (+10 pts)';
  } else if (numericValue > 0) {
    valuePoints = 5;
    valueDesc = 'Entry-tier commercial opportunity (< ₹1,00,000) (+5 pts)';
  } else {
    valuePoints = 0;
    valueDesc = 'Zero or unstated deal value (0 pts)';
  }

  totalScore += valuePoints;
  contributing_factors.push({
    category: 'Deal Value Potential',
    factor: numericValue > 0 ? `₹${numericValue.toLocaleString('en-IN')}` : '₹0',
    points_earned: valuePoints,
    max_points: 20,
    description: valueDesc
  });

  // Bounds enforcement: strictly 0 to 100
  const finalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

  // Priority classification
  let priority = 'Low';
  let priorityColor = '#64748B'; // Slate
  let recommendedAction = '';

  if (finalScore >= 70) {
    priority = 'High';
    priorityColor = '#10B981'; // Emerald
    recommendedAction = 'High conversion probability. Assign senior account executive for immediate follow-up and proposal closure.';
  } else if (finalScore >= 40) {
    priority = 'Medium';
    priorityColor = '#F59E0B'; // Amber
    recommendedAction = 'Moderate prospect. Schedule product discovery call and nurture with targeted product literature.';
  } else {
    priority = 'Low';
    priorityColor = '#94A3B8'; // Muted Slate
    recommendedAction = 'Early or low engagement lead. Enrich contact information and verify commercial budget before scheduling demo.';
  }

  // Summary explanation sentence
  const explanation = `${priority} Priority Prospect (${finalScore}/100) — Scored based on ${status} status (${stagePoints} pts), ${hasCompany ? lead.company : 'individual fit'} (${companyPoints} pts), ${source} channel (${sourcePoints} pts), and deal potential (${valuePoints} pts).`;

  return {
    lead_id: lead.id,
    lead_name: lead.name,
    score: finalScore,
    priority,
    priority_color: priorityColor,
    contributing_factors,
    explanation,
    recommended_action: recommendedAction,
    scoring_method: SCORING_ENGINE,
    version: SCORING_VERSION,
    is_ai_enabled: false,
    is_ai_ready: true,
    scored_at: new Date().toISOString()
  };
}

/**
 * Async interface for getting lead score with persistence integration.
 *
 * @param {Object} lead - The lead record from PostgreSQL
 * @param {Array} [interactions=[]] - Optional lead interactions
 * @returns {Promise<Object>}
 */
async function getLeadScore(lead, interactions = []) {
  return calculateLeadScore(lead, interactions);
}

module.exports = {
  calculateLeadScore,
  getLeadScore,
  SCORING_VERSION,
  SCORING_ENGINE
};
