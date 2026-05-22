import { useState, useEffect } from 'react';
import { sdk } from '../lib/sdk';

export default function LogsDashboard() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [logsData, statsData] = await Promise.all([sdk.getLogs(), sdk.getStats()]);
    setLogs(logsData);
    setStats(statsData);
    setLoading(false);
  };

  const filtered = filter === 'all' ? logs : logs.filter(l => l.provider === filter);

  if (loading) return <div className="loading-state">Loading logs...</div>;

  return (
    <div className="logs-container">
      <div className="section-header">
        <h2>Inference Logs</h2>
        <button onClick={loadData} className="btn-secondary">Refresh</button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map(s => (
          <div key={s._id} className="stat-card">
            <h3>{s._id.toUpperCase()}</h3>
            <div className="stat-row"><span>Requests</span><strong>{s.totalRequests}</strong></div>
            <div className="stat-row"><span>Avg Latency</span><strong>{Math.round(s.avgLatency)}ms</strong></div>
            <div className="stat-row"><span>Total Tokens</span><strong>{s.totalTokens || 'N/A'}</strong></div>
            <div className="stat-row"><span>Errors</span><strong className={s.errors > 0 ? 'error-text' : ''}>{s.errors}</strong></div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="filter-bar">
        {['all', 'groq', 'gemini'].map(f => (
          <button
            key={f}
            className={filter === f ? 'active' : ''}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="logs-table-wrapper">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Provider</th>
              <th>Model</th>
              <th>Latency</th>
              <th>Tokens</th>
              <th>Status</th>
              <th>Input</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log._id} className={log.status === 'error' ? 'error-row' : ''}>
                <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
                <td><span className={`badge ${log.provider}`}>{log.provider}</span></td>
                <td className="model-cell">{log.model}</td>
                <td>{log.latencyMs}ms</td>
                <td>{log.totalTokens || '-'}</td>
                <td>
                  <span className={`status ${log.status}`}>{log.status}</span>
                </td>
                <td className="preview-cell">{log.inputPreview}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">No logs yet. Send some messages!</div>
        )}
      </div>
    </div>
  );
}
