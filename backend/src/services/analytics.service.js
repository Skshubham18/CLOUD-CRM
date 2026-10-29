/**
 * Analytics Service for AI-Powered Cloud CRM (Phase 5)
 *
 * Provides accurate, SQL-aggregated metrics across Customers, Leads, Deals,
 * and Revenue Pipelines using actual PostgreSQL database records.
 *
 * Metric Definitions & Documented Assumptions:
 * 1. Won Revenue: Sum of deal values where stage = 'Won'.
 * 2. Open Pipeline Value: Sum of deal values in unclosed stages ('Qualification', 'Proposal', 'Negotiation').
 *    - Excludes 'Lost' deals (stage = 'Lost').
 *    - Avoids double-counting 'Won' deals (isolated in Won Revenue).
 * 3. Lead Conversion Rate: (Leads with status 'Won' OR converted_customer_id NOT NULL / Total Leads) * 100.
 * 4. Deal Win Rate: (Won Deals / Total Closed Deals [Won + Lost]) * 100.
 *    - Also provides Total Deal Win Rate: (Won Deals / Total Deals) * 100.
 * 5. Lead Priority Distribution: Evaluated using Phase 4C Explainable AI Lead Scoring engine:
 *    - High Priority: Score >= 70
 *    - Medium Priority: Score 40 - 69
 *    - Low Priority: Score < 40
 */

const { pool } = require('../config/db');
const leadScoringService = require('./leadScoringService');

/**
 * Builds optional parameterized date filter for SQL queries
 * Timestamp field used: created_at
 */
function buildDateCondition(timeRange, startDate, endDate, tableAlias = '', paramIndexStart = 1) {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  const conditions = [];
  const params = [];
  let paramIndex = paramIndexStart;

  if (startDate) {
    conditions.push(`${prefix}created_at >= $${paramIndex}`);
    params.push(new Date(startDate).toISOString());
    paramIndex++;
  }

  if (endDate) {
    conditions.push(`${prefix}created_at <= $${paramIndex}`);
    params.push(new Date(endDate).toISOString());
    paramIndex++;
  }

  if (!startDate && !endDate && timeRange && timeRange !== 'all') {
    let days = 30;
    if (timeRange === '7d') days = 7;
    else if (timeRange === '30d') days = 30;
    else if (timeRange === '90d') days = 90;
    else if (timeRange === '180d') days = 180;
    else if (timeRange === 'this_year' || timeRange === '365d') days = 365;

    conditions.push(`${prefix}created_at >= NOW() - INTERVAL '${days} days'`);
  }

  const clause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  return { clause, params, nextIndex: paramIndex };
}

/**
 * Gets high-level CRM overview KPIs
 */
async function getOverviewMetrics({ timeRange = 'all', startDate = null, endDate = null } = {}) {
  try {
    const custDate = buildDateCondition(timeRange, startDate, endDate, 'c', 1);
    const leadDate = buildDateCondition(timeRange, startDate, endDate, 'l', 1);
    const dealDate = buildDateCondition(timeRange, startDate, endDate, 'd', 1);

    // 1. Total Customers
    const custRes = await pool.query(
      `SELECT COUNT(*) AS total_customers,
              COUNT(*) FILTER (WHERE LOWER(status) = 'active') AS active_customers
       FROM customers c
       WHERE ${custDate.clause}`,
      custDate.params
    );

    // 2. Leads Aggregation
    const leadRes = await pool.query(
      `SELECT 
         COUNT(*) AS total_leads,
         COUNT(*) FILTER (WHERE LOWER(status) = 'won' OR converted_customer_id IS NOT NULL) AS converted_leads,
         COUNT(*) FILTER (WHERE LOWER(status) = 'qualified') AS qualified_leads,
         COUNT(*) FILTER (WHERE LOWER(status) = 'proposal') AS proposal_leads,
         COUNT(*) FILTER (WHERE LOWER(status) = 'lost') AS lost_leads,
         COALESCE(SUM(estimated_value), 0) AS total_lead_estimated_value
       FROM leads l
       WHERE ${leadDate.clause}`,
      leadDate.params
    );

    // 3. Deals Aggregation
    const dealRes = await pool.query(
      `SELECT 
         COUNT(*) AS total_deals,
         COUNT(*) FILTER (WHERE LOWER(stage) = 'won') AS won_deals,
         COUNT(*) FILTER (WHERE LOWER(stage) = 'lost') AS lost_deals,
         COUNT(*) FILTER (WHERE LOWER(stage) IN ('qualification', 'proposal', 'negotiation')) AS open_deals,
         COALESCE(SUM(value) FILTER (WHERE LOWER(stage) = 'won'), 0) AS won_revenue,
         COALESCE(SUM(value) FILTER (WHERE LOWER(stage) IN ('qualification', 'proposal', 'negotiation')), 0) AS open_pipeline_value,
         COALESCE(SUM(value) FILTER (WHERE LOWER(stage) = 'lost'), 0) AS lost_deal_value,
         COALESCE(AVG(value), 0) AS avg_deal_value,
         COALESCE(AVG(value) FILTER (WHERE LOWER(stage) = 'won'), 0) AS avg_won_deal_value
       FROM deals d
       WHERE ${dealDate.clause}`,
      dealDate.params
    );

    const custData = custRes.rows[0];
    const leadData = leadRes.rows[0];
    const dealData = dealRes.rows[0];

    const totalCustomers = parseInt(custData.total_customers, 10) || 0;
    const activeCustomers = parseInt(custData.active_customers, 10) || 0;

    const totalLeads = parseInt(leadData.total_leads, 10) || 0;
    const convertedLeads = parseInt(leadData.converted_leads, 10) || 0;
    const totalLeadEstimatedValue = parseFloat(leadData.total_lead_estimated_value) || 0;

    const totalDeals = parseInt(dealData.total_deals, 10) || 0;
    const wonDeals = parseInt(dealData.won_deals, 10) || 0;
    const lostDeals = parseInt(dealData.lost_deals, 10) || 0;
    const openDeals = parseInt(dealData.open_deals, 10) || 0;
    const closedDeals = wonDeals + lostDeals;

    const wonRevenue = parseFloat(dealData.won_revenue) || 0;
    const openPipelineValue = parseFloat(dealData.open_pipeline_value) || 0;
    const lostDealValue = parseFloat(dealData.lost_deal_value) || 0;
    const avgDealValue = parseFloat(dealData.avg_deal_value) || 0;
    const avgWonDealValue = parseFloat(dealData.avg_won_deal_value) || 0;

    // Rates calculation with zero-denominator safety
    const leadConversionRate = totalLeads > 0
      ? Math.round((convertedLeads / totalLeads) * 1000) / 10
      : 0;

    const closedDealWinRate = closedDeals > 0
      ? Math.round((wonDeals / closedDeals) * 1000) / 10
      : 0;

    const overallDealWinRate = totalDeals > 0
      ? Math.round((wonDeals / totalDeals) * 1000) / 10
      : 0;

    return {
      kpis: {
        totalCustomers,
        activeCustomers,
        totalLeads,
        convertedLeads,
        leadConversionRate, // Percentage %
        totalLeadEstimatedValue,
        totalDeals,
        openDeals,
        wonDeals,
        lostDeals,
        closedDeals,
        wonRevenue,
        openPipelineValue,
        lostDealValue,
        avgDealValue,
        avgWonDealValue,
        dealWinRate: closedDealWinRate, // Closed deals denominator
        overallDealWinRate // Total deals denominator
      },
      filtersApplied: {
        timeRange,
        startDate,
        endDate
      },
      definitions: {
        wonRevenue: "Sum of numeric deal values for deals in 'Won' stage.",
        openPipelineValue: "Sum of numeric deal values for deals in active stages ('Qualification', 'Proposal', 'Negotiation'). Excludes Won and Lost deals.",
        leadConversionRate: "(Converted / Won Leads / Total Leads) * 100",
        dealWinRate: "(Won Deals / Closed Deals [Won + Lost]) * 100",
        overallDealWinRate: "(Won Deals / Total Deals) * 100"
      },
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('[PostgreSQL Error] getOverviewMetrics failed:', error.message);
    const dbError = new Error('Database analytics query failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Gets detailed Lead Management Analytics
 */
async function getLeadAnalytics({ timeRange = 'all', startDate = null, endDate = null } = {}) {
  try {
    const leadDate = buildDateCondition(timeRange, startDate, endDate, 'l', 1);

    // 1. Leads by Status
    const statusRes = await pool.query(
      `SELECT 
         l.status,
         COUNT(*) AS count,
         COALESCE(SUM(l.estimated_value), 0) AS total_value
       FROM leads l
       WHERE ${leadDate.clause}
       GROUP BY l.status
       ORDER BY count DESC`,
      leadDate.params
    );

    // 2. Leads by Source
    const sourceRes = await pool.query(
      `SELECT 
         l.source,
         COUNT(*) AS count,
         COALESCE(SUM(l.estimated_value), 0) AS total_value,
         COUNT(*) FILTER (WHERE LOWER(l.status) = 'won' OR l.converted_customer_id IS NOT NULL) AS converted_count
       FROM leads l
       WHERE ${leadDate.clause}
       GROUP BY l.source
       ORDER BY count DESC`,
      leadDate.params
    );

    // 3. Leads by Industry
    const industryRes = await pool.query(
      `SELECT 
         COALESCE(NULLIF(l.industry, ''), 'Unspecified') AS industry,
         COUNT(*) AS count,
         COALESCE(SUM(l.estimated_value), 0) AS total_value
       FROM leads l
       WHERE ${leadDate.clause}
       GROUP BY industry
       ORDER BY count DESC`,
      leadDate.params
    );

    // 4. Fetch all leads to calculate lead scoring priority distribution
    const leadsRawRes = await pool.query(
      `SELECT id, name, email, phone, company, industry, source, status, estimated_value, ai_score, created_at
       FROM leads l
       WHERE ${leadDate.clause}`,
      leadDate.params
    );

    const totalLeads = leadsRawRes.rows.length;
    let highPriorityCount = 0;
    let mediumPriorityCount = 0;
    let lowPriorityCount = 0;
    let highPriorityValue = 0;
    let mediumPriorityValue = 0;
    let lowPriorityValue = 0;
    let totalScoreSum = 0;

    leadsRawRes.rows.forEach(lead => {
      const scoreData = leadScoringService.calculateLeadScore(lead);
      const score = scoreData.score;
      totalScoreSum += score;
      const val = Number(lead.estimated_value) || 0;

      if (score >= 70) {
        highPriorityCount++;
        highPriorityValue += val;
      } else if (score >= 40) {
        mediumPriorityCount++;
        mediumPriorityValue += val;
      } else {
        lowPriorityCount++;
        lowPriorityValue += val;
      }
    });

    const avgLeadScore = totalLeads > 0 ? Math.round((totalScoreSum / totalLeads) * 10) / 10 : 0;

    const priorityDistribution = [
      {
        priority: 'High',
        minScore: 70,
        maxScore: 100,
        count: highPriorityCount,
        percentage: totalLeads > 0 ? Math.round((highPriorityCount / totalLeads) * 1000) / 10 : 0,
        totalValue: highPriorityValue,
        color: '#10B981',
        description: 'Score >= 70 (Strong conversion potential)'
      },
      {
        priority: 'Medium',
        minScore: 40,
        maxScore: 69,
        count: mediumPriorityCount,
        percentage: totalLeads > 0 ? Math.round((mediumPriorityCount / totalLeads) * 1000) / 10 : 0,
        totalValue: mediumPriorityValue,
        color: '#F59E0B',
        description: 'Score 40 - 69 (Moderate prospect)'
      },
      {
        priority: 'Low',
        minScore: 0,
        maxScore: 39,
        count: lowPriorityCount,
        percentage: totalLeads > 0 ? Math.round((lowPriorityCount / totalLeads) * 1000) / 10 : 0,
        totalValue: lowPriorityValue,
        color: '#64748B',
        description: 'Score < 40 (Early or low engagement)'
      }
    ];

    const leadsByStatus = statusRes.rows.map(r => {
      const count = parseInt(r.count, 10) || 0;
      return {
        status: r.status,
        count,
        percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 1000) / 10 : 0,
        totalValue: parseFloat(r.total_value) || 0
      };
    });

    const leadsBySource = sourceRes.rows.map(r => {
      const count = parseInt(r.count, 10) || 0;
      const convertedCount = parseInt(r.converted_count, 10) || 0;
      return {
        source: r.source,
        count,
        percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 1000) / 10 : 0,
        totalValue: parseFloat(r.total_value) || 0,
        convertedCount,
        conversionRate: count > 0 ? Math.round((convertedCount / count) * 1000) / 10 : 0
      };
    });

    const leadsByIndustry = industryRes.rows.map(r => {
      const count = parseInt(r.count, 10) || 0;
      return {
        industry: r.industry,
        count,
        percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 1000) / 10 : 0,
        totalValue: parseFloat(r.total_value) || 0
      };
    });

    return {
      totalLeads,
      avgLeadScore,
      priorityDistribution,
      leadsByStatus,
      leadsBySource,
      leadsByIndustry,
      filtersApplied: { timeRange, startDate, endDate }
    };
  } catch (error) {
    console.error('[PostgreSQL Error] getLeadAnalytics failed:', error.message);
    const dbError = new Error('Database lead analytics query failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Gets detailed Deal & Sales Pipeline Analytics
 */
async function getDealAnalytics({ timeRange = 'all', startDate = null, endDate = null } = {}) {
  try {
    const dealDate = buildDateCondition(timeRange, startDate, endDate, 'd', 1);

    // 1. Deals by Stage
    const stageRes = await pool.query(
      `SELECT 
         d.stage,
         COUNT(*) AS count,
         COALESCE(SUM(d.value), 0) AS total_value,
         COALESCE(AVG(d.value), 0) AS avg_value
       FROM deals d
       WHERE ${dealDate.clause}
       GROUP BY d.stage
       ORDER BY 
         CASE LOWER(d.stage)
           WHEN 'qualification' THEN 1
           WHEN 'proposal' THEN 2
           WHEN 'negotiation' THEN 3
           WHEN 'won' THEN 4
           WHEN 'lost' THEN 5
           ELSE 6
         END`,
      dealDate.params
    );

    // 2. Deals Summary
    const summaryRes = await pool.query(
      `SELECT 
         COUNT(*) AS total_deals,
         COUNT(*) FILTER (WHERE LOWER(stage) = 'won') AS won_deals,
         COUNT(*) FILTER (WHERE LOWER(stage) = 'lost') AS lost_deals,
         COUNT(*) FILTER (WHERE LOWER(stage) IN ('qualification', 'proposal', 'negotiation')) AS open_deals,
         COALESCE(SUM(value) FILTER (WHERE LOWER(stage) = 'won'), 0) AS won_revenue,
         COALESCE(SUM(value) FILTER (WHERE LOWER(stage) IN ('qualification', 'proposal', 'negotiation')), 0) AS open_pipeline_value,
         COALESCE(SUM(value) FILTER (WHERE LOWER(stage) = 'lost'), 0) AS lost_deal_value,
         COALESCE(SUM(value), 0) AS total_deal_value,
         COALESCE(AVG(value), 0) AS avg_deal_size,
         COALESCE(MAX(value), 0) AS max_deal_size
       FROM deals d
       WHERE ${dealDate.clause}`,
      dealDate.params
    );

    const summary = summaryRes.rows[0];
    const totalDeals = parseInt(summary.total_deals, 10) || 0;
    const wonDeals = parseInt(summary.won_deals, 10) || 0;
    const lostDeals = parseInt(summary.lost_deals, 10) || 0;
    const openDeals = parseInt(summary.open_deals, 10) || 0;
    const closedDeals = wonDeals + lostDeals;

    const wonRevenue = parseFloat(summary.won_revenue) || 0;
    const openPipelineValue = parseFloat(summary.open_pipeline_value) || 0;
    const lostDealValue = parseFloat(summary.lost_deal_value) || 0;
    const totalDealValue = parseFloat(summary.total_deal_value) || 0;
    const avgDealSize = parseFloat(summary.avg_deal_size) || 0;
    const maxDealSize = parseFloat(summary.max_deal_size) || 0;

    const winRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 1000) / 10 : 0;

    const dealsByStage = stageRes.rows.map(r => {
      const count = parseInt(r.count, 10) || 0;
      const val = parseFloat(r.total_value) || 0;
      return {
        stage: r.stage,
        count,
        totalValue: val,
        avgValue: parseFloat(r.avg_value) || 0,
        percentageCount: totalDeals > 0 ? Math.round((count / totalDeals) * 1000) / 10 : 0,
        percentageValue: totalDealValue > 0 ? Math.round((val / totalDealValue) * 1000) / 10 : 0
      };
    });

    return {
      summary: {
        totalDeals,
        openDeals,
        wonDeals,
        lostDeals,
        closedDeals,
        wonRevenue,
        openPipelineValue,
        lostDealValue,
        totalDealValue,
        avgDealSize,
        maxDealSize,
        winRate
      },
      dealsByStage,
      filtersApplied: { timeRange, startDate, endDate }
    };
  } catch (error) {
    console.error('[PostgreSQL Error] getDealAnalytics failed:', error.message);
    const dbError = new Error('Database deal analytics query failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Gets consolidated dashboard analytics payload in a single roundtrip
 */
async function getDashboardAnalytics(options = {}) {
  const [overview, leads, deals] = await Promise.all([
    getOverviewMetrics(options),
    getLeadAnalytics(options),
    getDealAnalytics(options)
  ]);

  return {
    overview: overview.kpis,
    leads,
    deals,
    filtersApplied: overview.filtersApplied,
    definitions: overview.definitions,
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  getOverviewMetrics,
  getLeadAnalytics,
  getDealAnalytics,
  getDashboardAnalytics
};
