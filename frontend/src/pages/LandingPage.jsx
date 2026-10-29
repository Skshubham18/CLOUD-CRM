import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Sparkles,
  Users,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  Building,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers,
  Search,
  Star,
  Zap,
  Globe,
  Lock,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage({ onNavigateToAuth, onNavigateToDashboard }) {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('customers');
  const [metricCounter, setMetricCounter] = useState(1280);

  // Smooth counter effect for preview
  useEffect(() => {
    const timer = setInterval(() => {
      setMetricCounter((prev) => (prev < 1428 ? prev + 12 : 1428));
    }, 40);
    return () => clearInterval(timer);
  }, []);

  const bentoFeatures = [
    {
      id: 'customers',
      tag: 'Core Management',
      title: 'Customer Management',
      desc: 'Keep customer information organized and accessible in one place with rich company profiles, contact channels, and status tracking.',
      color: 'purple',
      preview: (
        <div className="crm-bento-cust-preview">
          <div className="crm-bento-cust-card">
            <div className="crm-bento-avatar">AR</div>
            <div className="crm-bento-cust-info">
              <span className="crm-bento-cust-name">Alex Rivera</span>
              <span className="crm-bento-cust-sub">TechCorp Inc • Enterprise</span>
            </div>
            <span className="crm-bento-pill crm-bento-pill--active">Active</span>
          </div>
          <div className="crm-bento-cust-card">
            <div className="crm-bento-avatar crm-bento-avatar--cyan">ER</div>
            <div className="crm-bento-cust-info">
              <span className="crm-bento-cust-name">Dr. Evelyn Reed</span>
              <span className="crm-bento-cust-sub">Apex Health • Healthcare</span>
            </div>
            <span className="crm-bento-pill crm-bento-pill--prospect">Prospect</span>
          </div>
          <div className="crm-bento-cust-card">
            <div className="crm-bento-avatar crm-bento-avatar--pink">SC</div>
            <div className="crm-bento-cust-info">
              <span className="crm-bento-cust-name">Sarah Connor</span>
              <span className="crm-bento-cust-sub">Cyberdyne Dynamics</span>
            </div>
            <span className="crm-bento-pill crm-bento-pill--lead">Lead</span>
          </div>
        </div>
      )
    },
    {
      id: 'timeline',
      tag: 'Unified Feed',
      title: 'Interaction Timeline',
      desc: 'Record calls, meetings, emails and important customer notes in a single chronological touchpoint history.',
      color: 'pink',
      preview: (
        <div className="crm-bento-timeline-preview">
          <div className="crm-bento-timeline-item">
            <div className="crm-bento-timeline-icon crm-bento-timeline-icon--call">
              <Phone size={13} />
            </div>
            <div className="crm-bento-timeline-text">
              <strong>Discovery & Needs Call</strong>
              <span>Confirmed 25 user seats requirement • Today</span>
            </div>
          </div>
          <div className="crm-bento-timeline-item">
            <div className="crm-bento-timeline-icon crm-bento-timeline-icon--meeting">
              <Calendar size={13} />
            </div>
            <div className="crm-bento-timeline-text">
              <strong>Product Demo Walkthrough</strong>
              <span>Shared proposal & security overview • Yesterday</span>
            </div>
          </div>
          <div className="crm-bento-timeline-item">
            <div className="crm-bento-timeline-icon crm-bento-timeline-icon--email">
              <Mail size={13} />
            </div>
            <div className="crm-bento-timeline-text">
              <strong>Agreement Signed</strong>
              <span>Sent welcome onboard package • 2 days ago</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'security',
      tag: 'Enterprise Trust',
      title: 'Secure Access',
      desc: 'Secure authentication and role-based access keep your workspace protected with multi-layered tenant isolation.',
      color: 'cyan',
      preview: (
        <div className="crm-bento-security-preview">
          <div className="crm-bento-badge-group">
            <div className="crm-bento-sec-pill">
              <ShieldCheck size={14} className="text-emerald" />
              <span>JWT Signed Sessions</span>
            </div>
            <div className="crm-bento-sec-pill">
              <Lock size={14} className="text-purple" />
              <span>Bcrypt Salted Hashing</span>
            </div>
            <div className="crm-bento-sec-pill">
              <Users size={14} className="text-cyan" />
              <span>Role-Based Permissions</span>
            </div>
          </div>
          <div className="crm-bento-sec-status">
            <span className="crm-bento-sec-dot" />
            <span>256-bit SSL Protected Cloud Workspace</span>
          </div>
        </div>
      )
    },
    {
      id: 'visibility',
      tag: 'Intelligence',
      title: 'Business Visibility',
      desc: 'Turn customer activity into a clearer view of your business relationships with relationship health indicators.',
      color: 'coral',
      preview: (
        <div className="crm-bento-vis-preview">
          <div className="crm-bento-meter-row">
            <div className="crm-bento-meter-label">
              <span>Account Engagement</span>
              <strong>94%</strong>
            </div>
            <div className="crm-bento-meter-bar">
              <div className="crm-bento-meter-fill" style={{ width: '94%' }} />
            </div>
          </div>
          <div className="crm-bento-meter-row">
            <div className="crm-bento-meter-label">
              <span>Response Velocity</span>
              <strong>+28%</strong>
            </div>
            <div className="crm-bento-meter-bar">
              <div className="crm-bento-meter-fill crm-bento-meter-fill--cyan" style={{ width: '82%' }} />
            </div>
          </div>
        </div>
      )
    }
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Add your customers',
      desc: 'Import or create comprehensive client accounts with company details, communication channels, and notes in seconds.',
      icon: Users
    },
    {
      step: '02',
      title: 'Track every interaction',
      desc: 'Log phone calls, video meetings, email touchpoints, and internal notes into an instant timeline.',
      icon: MessageSquare
    },
    {
      step: '03',
      title: 'Build stronger relationships',
      desc: 'Maintain complete client context across your entire team to close deals faster and deliver unforgettable support.',
      icon: TrendingUp
    }
  ];

  return (
    <div className="crm-landing-wrapper">
      {/* ======================================================================
          HERO SECTION
          ====================================================================== */}
      <section className="crm-hero-section">
        <div className="crm-hero-glow" />
        <div className="crm-hero-container">
          {/* Left Column: Copy & Actions */}
          <div className="crm-hero-left">
            {/* Animated Pill Badge */}
            <div className="crm-hero-badge">
              <Sparkles size={14} className="crm-badge-sparkle" />
              <span>A smarter way to manage customer relationships</span>
            </div>

            {/* Main Headline */}
            <h1 className="crm-hero-headline">
              Turn every customer interaction into a{' '}
              <span className="crm-gradient-text">relationship.</span>
            </h1>

            {/* Subtitle */}
            <p className="crm-hero-subtext">
              CloudCRM brings customers, conversations and business activity into one beautifully simple workspace designed for modern teams.
            </p>

            {/* CTA Buttons */}
            <div className="crm-hero-actions">
              {isAuthenticated ? (
                <button
                  type="button"
                  className="crm-btn-hero-primary"
                  onClick={onNavigateToDashboard}
                >
                  <span>Go to Workspace ({user?.name || 'Dashboard'})</span>
                  <ArrowRight size={18} />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="crm-btn-hero-primary"
                    onClick={() => onNavigateToAuth('register')}
                  >
                    <span>Get started free</span>
                    <ArrowRight size={18} />
                  </button>

                  <button
                    type="button"
                    className="crm-btn-hero-secondary"
                    onClick={() => {
                      const el = document.getElementById('features');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <span>Explore CloudCRM</span>
                  </button>
                </>
              )}
            </div>

            {/* Social Trust Indicators */}
            <div className="crm-hero-trust">
              <div className="crm-trust-avatars">
                <div className="crm-trust-avatar" style={{ background: '#6C4CF1' }}>JS</div>
                <div className="crm-trust-avatar" style={{ background: '#39C6D8' }}>AR</div>
                <div className="crm-trust-avatar" style={{ background: '#F36BA8' }}>ER</div>
                <div className="crm-trust-avatar" style={{ background: '#FF9B5E' }}>SC</div>
              </div>
              <div className="crm-trust-text">
                <div className="crm-trust-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <span>Loved by modern small businesses & sales teams</span>
              </div>
            </div>
          </div>

          {/* Right Column: Animated Miniature CRM Dashboard Preview */}
          <div className="crm-hero-right" id="product-preview">
            <div className="crm-mockup-frame">
              {/* Window Controls */}
              <div className="crm-mockup-header">
                <div className="crm-mockup-dots">
                  <span className="crm-dot crm-dot--red" />
                  <span className="crm-dot crm-dot--yellow" />
                  <span className="crm-dot crm-dot--green" />
                </div>
                <div className="crm-mockup-url">
                  <span>app.cloudcrm.io/workspace</span>
                </div>
              </div>

              {/* Miniature CRM App Body */}
              <div className="crm-mockup-body">
                {/* Mini Sidebar */}
                <div className="crm-mini-sidebar">
                  <div className="crm-mini-logo">
                    <Zap size={15} />
                  </div>
                  <div className="crm-mini-nav-item active">
                    <Users size={14} />
                  </div>
                  <div className="crm-mini-nav-item">
                    <MessageSquare size={14} />
                  </div>
                  <div className="crm-mini-nav-item">
                    <TrendingUp size={14} />
                  </div>
                </div>

                {/* Mini Content Area */}
                <div className="crm-mini-main">
                  {/* Top Bar */}
                  <div className="crm-mini-topbar">
                    <div className="crm-mini-search">
                      <Search size={12} />
                      <span>Search contacts, companies...</span>
                    </div>
                    <div className="crm-mini-user">
                      <div className="crm-mini-user-avatar">
                        {user?.name ? user.name.substring(0, 2).toUpperCase() : 'SK'}
                      </div>
                    </div>
                  </div>

                  {/* Metric Highlights */}
                  <div className="crm-mini-metrics">
                    <div className="crm-mini-metric-card">
                      <span className="crm-mini-metric-label">Total Customers</span>
                      <div className="crm-mini-metric-val">
                        <strong>{metricCounter.toLocaleString()}</strong>
                        <span className="crm-mini-pill">+18.4%</span>
                      </div>
                    </div>
                    <div className="crm-mini-metric-card">
                      <span className="crm-mini-metric-label">Touchpoints Logged</span>
                      <div className="crm-mini-metric-val">
                        <strong>3,892</strong>
                        <span className="crm-mini-pill crm-mini-pill--purple">99% synced</span>
                      </div>
                    </div>
                  </div>

                  {/* Mini Pipeline / Sparkline Area */}
                  <div className="crm-mini-chart-box">
                    <div className="crm-mini-chart-header">
                      <span>Relationship Velocity</span>
                      <span className="text-emerald font-semibold text-sm">Active growth</span>
                    </div>
                    <svg className="crm-mini-chart-svg" viewBox="0 0 300 60" fill="none">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6C4CF1" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#6C4CF1" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 45 Q 40 30, 80 38 T 160 20 T 240 28 T 300 8"
                        fill="none"
                        stroke="url(#chartGradLine)"
                        strokeWidth="3"
                        className="crm-chart-path"
                      />
                      <path
                        d="M0 45 Q 40 30, 80 38 T 160 20 T 240 28 T 300 8 L 300 60 L 0 60 Z"
                        fill="url(#chartGrad)"
                      />
                      <defs>
                        <linearGradient id="chartGradLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#6C4CF1" />
                          <stop offset="50%" stopColor="#9B6CFF" />
                          <stop offset="100%" stopColor="#39C6D8" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Mini Customer Table Preview */}
                  <div className="crm-mini-table">
                    <div className="crm-mini-table-header">
                      <span>Customer</span>
                      <span>Company</span>
                      <span>Status</span>
                    </div>
                    <div className="crm-mini-table-row">
                      <div className="crm-mini-row-contact">
                        <span className="crm-mini-circle-avatar">AR</span>
                        <strong>Alex Rivera</strong>
                      </div>
                      <span>TechCorp Inc</span>
                      <span className="crm-mini-status-badge">Active</span>
                    </div>
                    <div className="crm-mini-table-row">
                      <div className="crm-mini-row-contact">
                        <span className="crm-mini-circle-avatar" style={{ background: '#39C6D8' }}>ER</span>
                        <strong>Dr. Evelyn Reed</strong>
                      </div>
                      <span>Apex Health</span>
                      <span className="crm-mini-status-badge crm-mini-status-badge--prospect">Prospect</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Widget 1: New Customer Toast */}
              <div className="crm-floating-card crm-floating-card--top">
                <div className="crm-floating-icon crm-floating-icon--purple">
                  <Sparkles size={14} />
                </div>
                <div>
                  <strong>New customer connected</strong>
                  <span>Acme Systems • 2m ago</span>
                </div>
              </div>

              {/* Floating Widget 2: Meeting Touchpoint */}
              <div className="crm-floating-card crm-floating-card--bottom">
                <div className="crm-floating-icon crm-floating-icon--cyan">
                  <Calendar size={14} />
                </div>
                <div>
                  <strong>Client Demo Scheduled</strong>
                  <span>Tomorrow at 10:30 AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          BENTO FEATURES SECTION
          ====================================================================== */}
      <section className="crm-features-section" id="features">
        <div className="crm-features-container">
          {/* Section Header */}
          <div className="crm-section-headline-box">
            <span className="crm-pill-label">Capabilities</span>
            <h2 className="crm-section-title">
              Engineered to make customer management effortless
            </h2>
            <p className="crm-section-desc">
              Everything your team needs to organize contacts, log touchpoint history, and accelerate business growth.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="crm-bento-grid">
            {bentoFeatures.map((feat) => (
              <div key={feat.id} className={`crm-bento-card crm-bento-card--${feat.color}`}>
                <div className="crm-bento-card-content">
                  <div className="crm-bento-header">
                    <span className="crm-bento-tag">{feat.tag}</span>
                    <h3 className="crm-bento-title">{feat.title}</h3>
                    <p className="crm-bento-desc">{feat.desc}</p>
                  </div>
                  <div className="crm-bento-preview-wrap">
                    {feat.preview}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================================
          HOW IT WORKS / WORKFLOW
          ====================================================================== */}
      <section className="crm-workflow-section" id="how-it-works">
        <div className="crm-workflow-container">
          <div className="crm-section-headline-box">
            <span className="crm-pill-label">Simple 3-Step Flow</span>
            <h2 className="crm-section-title">
              How CloudCRM transforms your customer workflow
            </h2>
            <p className="crm-section-desc">
              Go from messy spreadsheets to an organized, searchable relationship database in minutes.
            </p>
          </div>

          <div className="crm-workflow-steps">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="crm-workflow-card">
                  <div className="crm-workflow-step-num">{step.step}</div>
                  <div className="crm-workflow-icon-wrap">
                    <Icon size={24} />
                  </div>
                  <h3 className="crm-workflow-card-title">{step.title}</h3>
                  <p className="crm-workflow-card-desc">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================================
          FINAL CALL TO ACTION
          ====================================================================== */}
      <section className="crm-cta-section" id="cta-section">
        <div className="crm-cta-container">
          <div className="crm-cta-box">
            <div className="crm-cta-glow" />
            <div className="crm-cta-content">
              <span className="crm-cta-badge">Get Started Today</span>
              <h2 className="crm-cta-title">
                Ready to bring your customer relationships together?
              </h2>
              <p className="crm-cta-subtext">
                Create your CloudCRM workspace now. No complex setup or steep learning curve.
              </p>

              <div className="crm-cta-buttons">
                {isAuthenticated ? (
                  <button
                    type="button"
                    className="crm-btn-cta-white"
                    onClick={onNavigateToDashboard}
                  >
                    <span>Launch Workspace ({user?.name || 'Dashboard'})</span>
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="crm-btn-cta-white"
                    onClick={() => onNavigateToAuth('register')}
                  >
                    <span>Get started with CloudCRM →</span>
                  </button>
                )}
              </div>

              <div className="crm-cta-perks">
                <span className="crm-cta-perk">
                  <Check size={14} /> Free instant signup
                </span>
                <span className="crm-cta-perk">
                  <Check size={14} /> Full customer CRUD & history
                </span>
                <span className="crm-cta-perk">
                  <Check size={14} /> 256-bit encrypted security
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          MODERN SAAS FOOTER
          ====================================================================== */}
      <footer className="crm-saas-footer">
        <div className="crm-footer-container">
          <div className="crm-footer-top">
            <div className="crm-footer-brand">
              <div className="crm-brand">
                <div className="crm-brand-icon-wrap">
                  <div className="crm-brand-icon">
                    <Zap size={18} className="crm-brand-svg" />
                  </div>
                </div>
                <div className="crm-brand-title">
                  Cloud<span>CRM</span>
                </div>
              </div>
              <p className="crm-footer-tagline">
                The modern customer relationship workspace for fast-moving businesses.
              </p>
            </div>

            <div className="crm-footer-links-grid">
              <div className="crm-footer-col">
                <strong>Product</strong>
                <a href="#product-preview">Workspace Overview</a>
                <a href="#features">Customer Directory</a>
                <a href="#features">Interaction Feed</a>
                <a href="#features">Security & RBAC</a>
              </div>

              <div className="crm-footer-col">
                <strong>Solutions</strong>
                <a href="#how-it-works">Small Business Sales</a>
                <a href="#how-it-works">Client Account Management</a>
                <a href="#how-it-works">Relationship History</a>
              </div>

              <div className="crm-footer-col">
                <strong>Resources</strong>
                <a href="#cta-section">Documentation</a>
                <a href="#cta-section">API Reference</a>
                <a href="#cta-section">Status</a>
              </div>
            </div>
          </div>

          <div className="crm-footer-bottom">
            <span>© 2026 CloudCRM Inc. All rights reserved.</span>
            <div className="crm-footer-legal">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <span>Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
