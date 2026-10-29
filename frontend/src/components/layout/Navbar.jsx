import React, { useState, useEffect } from 'react';
import {
  Zap,
  LayoutDashboard,
  LogOut,
  LogIn,
  UserPlus,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ currentView, onNavigate }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    onNavigate('landing');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatRole = (role) => {
    if (role === 'admin') return 'Admin';
    if (role === 'sales_executive') return 'Sales Executive';
    return role || 'User';
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (currentView !== 'landing') {
      onNavigate('landing');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`crm-navbar ${scrolled ? 'crm-navbar--scrolled' : ''}`}>
      <div className="crm-navbar-container">
        {/* Brand Logo */}
        <div className="crm-brand" onClick={() => onNavigate('landing')} role="button" tabIndex={0}>
          <div className="crm-brand-icon-wrap">
            <div className="crm-brand-icon">
              <Zap size={19} className="crm-brand-svg" />
            </div>
            <span className="crm-brand-dot" />
          </div>
          <div className="crm-brand-title">
            Cloud<span>CRM</span>
          </div>
        </div>

        {/* Public SaaS Navigation Links */}
        {!isAuthenticated && (
          <nav className="crm-navbar-nav">
            <button
              type="button"
              className="crm-nav-link"
              onClick={() => scrollToSection('product-preview')}
            >
              Product
            </button>
            <button
              type="button"
              className="crm-nav-link"
              onClick={() => scrollToSection('features')}
            >
              Features
            </button>
            <button
              type="button"
              className="crm-nav-link"
              onClick={() => scrollToSection('how-it-works')}
            >
              Solutions
            </button>
            <button
              type="button"
              className="crm-nav-link"
              onClick={() => scrollToSection('cta-section')}
            >
              Resources
            </button>
          </nav>
        )}

        {/* Authenticated View Switcher Tabs */}
        {isAuthenticated && (
          <div className="crm-navbar-center">
            <div className="crm-view-switcher">
              <button
                type="button"
                className={`crm-switcher-tab ${currentView === 'landing' ? 'active' : ''}`}
                onClick={() => onNavigate('landing')}
              >
                <span>Website</span>
              </button>
              <button
                type="button"
                className={`crm-switcher-tab ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => onNavigate('dashboard')}
              >
                <LayoutDashboard size={15} />
                <span>Workspace</span>
              </button>
            </div>
          </div>
        )}

        {/* Right Actions */}
        <div className="crm-navbar-right">
          {isAuthenticated ? (
            <div className="crm-auth-user-bar">
              <div
                className="crm-user-profile"
                onClick={() => onNavigate('dashboard')}
                title="Open Dashboard"
              >
                <div className="crm-avatar">
                  <span>{getInitials(user?.name)}</span>
                </div>
                <div className="crm-user-info">
                  <span className="crm-user-name">{user?.name || 'Workspace User'}</span>
                  <span className="crm-user-role">{formatRole(user?.role)}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                icon={LogOut}
                className="crm-logout-btn"
                title="Sign out of CRM"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="crm-navbar-actions">
              <button
                type="button"
                className="crm-btn-signin"
                onClick={() => onNavigate('auth-login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className="crm-btn-getstarted"
                onClick={() => onNavigate('auth-register')}
              >
                <span>Get Started</span>
                <ArrowRight size={15} className="crm-btn-arrow" />
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="crm-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && !isAuthenticated && (
        <div className="crm-mobile-menu">
          <button
            type="button"
            className="crm-mobile-link"
            onClick={() => scrollToSection('product-preview')}
          >
            Product Overview
          </button>
          <button
            type="button"
            className="crm-mobile-link"
            onClick={() => scrollToSection('features')}
          >
            Features & Capabilities
          </button>
          <button
            type="button"
            className="crm-mobile-link"
            onClick={() => scrollToSection('how-it-works')}
          >
            Solutions & Workflow
          </button>
          <button
            type="button"
            className="crm-mobile-link"
            onClick={() => scrollToSection('cta-section')}
          >
            Resources & Pricing
          </button>
          <div className="crm-mobile-actions">
            <Button
              variant="outline"
              size="md"
              className="crm-btn-block"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('auth-login');
              }}
              icon={LogIn}
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="md"
              className="crm-btn-block"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('auth-register');
              }}
              icon={UserPlus}
            >
              Get Started Free →
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
