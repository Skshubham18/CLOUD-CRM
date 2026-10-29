import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Database,
  Clock,
  Zap,
  Check,
  Code
} from 'lucide-react';
import Button from '../common/Button';
import StatusBadge from '../common/StatusBadge';
import Card from '../common/Card';
import { checkBackendHealth } from '../../services/api';

export default function HealthCheckWidget() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [lastTested, setLastTested] = useState(null);
  const [copied, setCopied] = useState(false);

  const performHealthCheck = async () => {
    setLoading(true);
    try {
      const res = await checkBackendHealth();
      setResult(res);
      setLastTested(new Date());
    } catch (err) {
      setResult({
        ok: false,
        status: 0,
        latencyMs: 0,
        data: null,
        error: err.message || 'Unexpected network error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Run initial test on mount
  useEffect(() => {
    performHealthCheck();
  }, []);

  const handleCopyJson = () => {
    if (result?.data) {
      navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isHealthy = result?.ok && result?.data?.status === 'ok';

  return (
    <Card
      title="Backend Health & API Gateway"
      subtitle="Real-Time Health: Test live communication between React frontend and Express backend"
      icon={Activity}
      action={
        <Button
          variant="primary"
          size="sm"
          onClick={performHealthCheck}
          loading={loading}
          icon={RefreshCw}
        >
          Ping Backend
        </Button>
      }
      className="crm-health-widget"
    >
      <div className="crm-health-grid">
        {/* Status indicator row */}
        <div className="crm-health-summary-panel">
          <div className="crm-health-main-status">
            <div className={`crm-status-indicator ${isHealthy ? 'status-online' : result ? 'status-offline' : 'status-pending'}`}>
              {isHealthy ? (
                <CheckCircle2 size={32} className="text-emerald" />
              ) : (
                <AlertCircle size={32} className="text-amber" />
              )}
            </div>
            <div>
              <div className="crm-health-status-title">
                {loading ? 'Testing Connection...' : isHealthy ? 'Backend Server Online & Healthy' : 'Backend Standby / Not Responding'}
              </div>
              <div className="crm-health-status-desc">
                Endpoint: <code>GET /api/health</code>
              </div>
            </div>
          </div>

          <div className="crm-health-stats-row">
            <div className="crm-health-stat">
              <span className="crm-stat-label">HTTP Status</span>
              <span className="crm-stat-value">
                {result ? (
                  <StatusBadge
                    status={isHealthy ? 'success' : 'error'}
                    label={result.status > 0 ? `${result.status} ${result.ok ? 'OK' : 'Error'}` : 'Offline'}
                  />
                ) : '---'}
              </span>
            </div>

            <div className="crm-health-stat">
              <span className="crm-stat-label">Response Time</span>
              <span className="crm-stat-value font-mono">
                {result ? (
                  <span className={result.latencyMs < 100 ? 'text-emerald' : 'text-amber'}>
                    {result.latencyMs} ms
                  </span>
                ) : '---'}
              </span>
            </div>

            <div className="crm-health-stat">
              <span className="crm-stat-label">Backend Uptime</span>
              <span className="crm-stat-value font-mono">
                {result?.data?.uptime !== undefined ? `${result.data.uptime}s` : '---'}
              </span>
            </div>

            <div className="crm-health-stat">
              <span className="crm-stat-label">Environment</span>
              <span className="crm-stat-value font-mono">
                {result?.data?.environment || '---'}
              </span>
            </div>
          </div>
        </div>

        {/* JSON Response Preview */}
        <div className="crm-json-viewer-container">
          <div className="crm-json-viewer-header">
            <div className="crm-json-viewer-title">
              <Code size={14} />
              <span>Live API Response Payload</span>
            </div>
            {result?.data && (
              <button
                type="button"
                onClick={handleCopyJson}
                className="crm-copy-btn"
                title="Copy JSON to clipboard"
              >
                {copied ? <Check size={13} className="text-emerald" /> : null}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            )}
          </div>

          <pre className="crm-json-pre">
            {loading ? (
              <span className="text-muted">Fetching response from http://127.0.0.1:5000/api/health...</span>
            ) : result?.data ? (
              <code>{JSON.stringify(result.data, null, 2)}</code>
            ) : result?.error ? (
              <span className="text-error">{result.error}</span>
            ) : (
              <span className="text-muted">Click "Ping Backend" to trigger health check</span>
            )}
          </pre>
        </div>
      </div>
    </Card>
  );
}
