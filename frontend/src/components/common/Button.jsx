import React from 'react';

/**
 * Reusable Button component with multiple variants & loading state
 */
export default function Button({
  children,
  onClick,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  type = 'button',
  ...props
}) {
  const baseClasses = 'crm-btn';
  const variantClass = `crm-btn--${variant}`;
  const sizeClass = `crm-btn--${size}`;
  const disabledClass = disabled || loading ? 'crm-btn--disabled' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${disabledClass} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="crm-btn-spinner" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="crm-btn-icon" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
