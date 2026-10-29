import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Shield,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Zap,
  Sparkles,
  Calendar,
  Users,
  TrendingUp,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ initialMode = 'login', onAuthSuccess, onBackToLanding }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const { login, register } = useAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('sales_executive');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status & Feedback state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Handle Login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginEmail.trim()) {
      setErrorMsg('Work email address is required.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Password is required.');
      return;
    }

    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      setSuccessMsg('Authentication successful! Loading workspace...');
      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess();
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg('Work email address is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setErrorMsg('Please enter a valid work email address format.');
      return;
    }
    if (!regPassword) {
      setErrorMsg('Password is required.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please verify and re-type.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
      });

      setSuccessMsg(`Account created for ${regEmail}! Please sign in below.`);
      setLoginEmail(regEmail);
      setLoginPassword('');
      setRegPassword('');
      setRegConfirmPassword('');
      setMode('login');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crm-auth-split-wrapper">
      {/* Back to Home Action */}
      <button
        type="button"
        className="crm-auth-back-btn"
        onClick={onBackToLanding}
      >
        <ArrowLeft size={16} />
        <span>Back to CloudCRM</span>
      </button>

      {/* ======================================================================
          LEFT PANEL: Colorful Animated CRM Visual Showcase
          ====================================================================== */}
      <div className="crm-auth-visual-panel">
        <div className="crm-auth-visual-glow" />

        <div className="crm-auth-visual-content">
          {/* Logo */}
          <div className="crm-auth-brand" onClick={onBackToLanding}>
            <div className="crm-brand-icon-wrap crm-brand-icon-wrap--light">
              <div className="crm-brand-icon">
                <Zap size={20} className="text-brand" />
              </div>
            </div>
            <div className="crm-brand-title crm-brand-title--light">
              Cloud<span>CRM</span>
            </div>
          </div>

          {mode === 'login' ? (
            <div className="crm-auth-hero-copy">
              <h2>The modern operating system for customer relationships.</h2>
              <p>
                Join high-performing teams using CloudCRM to organize accounts, log touchpoint history, and accelerate business growth.
              </p>
            </div>
          ) : (
            <div className="crm-auth-hero-copy">
              <h2>Your customers. One workspace.</h2>
              <p>
                Organize relationships, track interactions and keep your team connected in a single collaborative platform.
              </p>

              {/* Animated Benefits */}
              <div className="crm-auth-benefits-list">
                <div className="crm-auth-benefit-item">
                  <span className="crm-benefit-icon">⚡</span>
                  <strong>Organize customers seamlessly</strong>
                </div>
                <div className="crm-auth-benefit-item">
                  <span className="crm-benefit-icon">🔒</span>
                  <strong>Keep data enterprise-secure</strong>
                </div>
                <div className="crm-auth-benefit-item">
                  <span className="crm-benefit-icon">📊</span>
                  <strong>Understand relationship activity</strong>
                </div>
              </div>
            </div>
          )}

          {/* Floating UI Elements Showcase */}
          <div className="crm-auth-floating-showcase">
            {/* Floating Card 1: New Customer */}
            <div className="crm-auth-float-card crm-auth-float-card--1">
              <div className="crm-float-avatar" style={{ background: 'linear-gradient(135deg, #6C4CF1, #9B6CFF)' }}>
                AR
              </div>
              <div className="crm-float-text">
                <div className="crm-float-title">New customer added</div>
                <div className="crm-float-sub">Alex Rivera • TechCorp Inc</div>
              </div>
              <span className="crm-float-pill">Active</span>
            </div>

            {/* Floating Card 2: Meeting Touchpoint */}
            <div className="crm-auth-float-card crm-auth-float-card--2">
              <div className="crm-float-icon-box" style={{ background: 'rgba(57, 198, 216, 0.15)', color: '#39C6D8' }}>
                <Calendar size={15} />
              </div>
              <div className="crm-float-text">
                <div className="crm-float-title">Meeting scheduled</div>
                <div className="crm-float-sub">Discovery Call with Apex Health</div>
              </div>
            </div>

            {/* Floating Card 3: Activity Metric / Growth */}
            <div className="crm-auth-float-card crm-auth-float-card--3">
              <div className="crm-float-icon-box" style={{ background: 'rgba(243, 107, 168, 0.15)', color: '#F36BA8' }}>
                <TrendingUp size={15} />
              </div>
              <div className="crm-float-text">
                <div className="crm-float-title">Activity updated</div>
                <div className="crm-float-sub">+28% customer touchpoint velocity</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================================
          RIGHT PANEL: Authentication Card Form
          ====================================================================== */}
      <div className="crm-auth-form-panel">
        <div className="crm-auth-form-container">
          {/* Form Header */}
          <div className="crm-auth-form-header">
            {mode === 'login' ? (
              <>
                <h1 className="crm-auth-heading">Welcome back 👋</h1>
                <p className="crm-auth-subtext">
                  Sign in to continue to your CloudCRM workspace.
                </p>
              </>
            ) : (
              <>
                <h1 className="crm-auth-heading">Create your account</h1>
                <p className="crm-auth-subtext">
                  Start managing your customer relationships today.
                </p>
              </>
            )}
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="crm-auth-alert crm-auth-alert--error">
              <AlertCircle size={17} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="crm-auth-alert crm-auth-alert--success">
              <CheckCircle2 size={17} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="crm-auth-form-body">
              <div className="crm-field-group">
                <label className="crm-field-label">Work Email</label>
                <div className="crm-field-input-wrap">
                  <Mail size={16} className="crm-field-icon" />
                  <input
                    type="email"
                    className="crm-field-input"
                    placeholder="name@company.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="crm-field-group">
                <label className="crm-field-label">Password</label>
                <div className="crm-field-input-wrap">
                  <KeyRound size={16} className="crm-field-icon" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    className="crm-field-input crm-field-input--pr"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="crm-field-action-btn"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="crm-btn-auth-submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="crm-btn-spinner-wrap">
                    <span className="crm-btn-spinner" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="crm-auth-switch-footer">
                <span>Don't have an account?</span>
                <button
                  type="button"
                  className="crm-auth-switch-link"
                  onClick={() => switchMode('register')}
                >
                  Create one
                </button>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="crm-auth-form-body">
              <div className="crm-field-group">
                <label className="crm-field-label">Full Name</label>
                <div className="crm-field-input-wrap">
                  <User size={16} className="crm-field-icon" />
                  <input
                    type="text"
                    className="crm-field-input"
                    placeholder="e.g. Jane Doe"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="crm-field-group">
                <label className="crm-field-label">Work Email</label>
                <div className="crm-field-input-wrap">
                  <Mail size={16} className="crm-field-icon" />
                  <input
                    type="email"
                    className="crm-field-input"
                    placeholder="jane@company.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Role Option Selector */}
              <div className="crm-field-group">
                <label className="crm-field-label">Account Role</label>
                <div className="crm-auth-role-cards">
                  <label className={`crm-role-card ${regRole === 'sales_executive' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="auth-role"
                      value="sales_executive"
                      checked={regRole === 'sales_executive'}
                      onChange={() => setRegRole('sales_executive')}
                    />
                    <Briefcase size={16} className="crm-role-card-icon" />
                    <div>
                      <strong>Sales Executive</strong>
                      <span>Customer & contact management</span>
                    </div>
                  </label>

                  <label className={`crm-role-card ${regRole === 'admin' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="auth-role"
                      value="admin"
                      checked={regRole === 'admin'}
                      onChange={() => setRegRole('admin')}
                    />
                    <Shield size={16} className="crm-role-card-icon" />
                    <div>
                      <strong>System Administrator</strong>
                      <span>Full workspace control</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="crm-field-group">
                <label className="crm-field-label">Password (min. 6 characters)</label>
                <div className="crm-field-input-wrap">
                  <KeyRound size={16} className="crm-field-icon" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    className="crm-field-input crm-field-input--pr"
                    placeholder="Create a strong password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="crm-field-action-btn"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    tabIndex={-1}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="crm-field-group">
                <label className="crm-field-label">Confirm Password</label>
                <div className="crm-field-input-wrap">
                  <KeyRound size={16} className="crm-field-icon" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    className="crm-field-input"
                    placeholder="Re-enter your password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="crm-btn-auth-submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="crm-btn-spinner-wrap">
                    <span className="crm-btn-spinner" />
                    <span>Creating account...</span>
                  </span>
                ) : (
                  <>
                    <span>Create my account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="crm-auth-switch-footer">
                <span>Already have an account?</span>
                <button
                  type="button"
                  className="crm-auth-switch-link"
                  onClick={() => switchMode('login')}
                >
                  Sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
