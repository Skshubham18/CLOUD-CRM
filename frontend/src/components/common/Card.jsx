import React from 'react';

/**
 * Reusable Card container component
 */
export default function Card({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = '',
  footer,
  noPadding = false,
}) {
  return (
    <div className={`crm-card ${className}`}>
      {(title || subtitle || Icon || action) && (
        <div className="crm-card-header">
          <div className="crm-card-header-left">
            {Icon && (
              <div className="crm-card-icon">
                <Icon size={20} />
              </div>
            )}
            <div>
              {title && <h3 className="crm-card-title">{title}</h3>}
              {subtitle && <p className="crm-card-subtitle">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="crm-card-action">{action}</div>}
        </div>
      )}
      <div className={`crm-card-body ${noPadding ? 'crm-card-body--no-padding' : ''}`}>
        {children}
      </div>
      {footer && <div className="crm-card-footer">{footer}</div>}
    </div>
  );
}
