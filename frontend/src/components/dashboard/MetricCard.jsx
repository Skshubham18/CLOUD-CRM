import React from 'react';

/**
 * Reusable Metric/KPI Card component
 */
export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue', // 'blue' | 'emerald' | 'amber' | 'purple'
  badge
}) {
  return (
    <div className={`crm-metric-card crm-metric-card--${color}`}>
      <div className="crm-metric-top">
        <span className="crm-metric-title">{title}</span>
        {Icon && (
          <div className="crm-metric-icon-wrap">
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="crm-metric-value-row">
        <span className="crm-metric-value">{value}</span>
        {badge && <span className="crm-metric-badge">{badge}</span>}
      </div>

      {(subtitle || trend) && (
        <div className="crm-metric-footer">
          {trend && <span className="crm-metric-trend">{trend}</span>}
          {subtitle && <span className="crm-metric-subtitle">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
