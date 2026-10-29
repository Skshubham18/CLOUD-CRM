import React from 'react';

/**
 * Reusable Status Badge component
 */
export default function StatusBadge({
  status = 'default', // 'success' | 'warning' | 'error' | 'info' | 'phase' | 'default'
  label,
  dot = true,
  className = ''
}) {
  return (
    <span className={`crm-badge crm-badge--${status} ${className}`}>
      {dot && <span className={`crm-badge-dot crm-badge-dot--${status}`} />}
      <span className="crm-badge-label">{label}</span>
    </span>
  );
}
