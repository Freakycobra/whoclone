const express = require('express');
const router = express.Router();

// Injected from index.js via adminRoute(reportStore)
let _reports = [];
let _getStats = () => ({ online: 0, queued: 0, matched: 0, live: 0 });

router.init = (reportStore, getStats) => {
  _reports = reportStore;
  _getStats = getStats;
};

// API endpoints for the dashboard
router.get('/api/reports', (req, res) => {
  const sorted = [..._reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ reports: sorted, total: sorted.length });
});

router.get('/api/stats', (req, res) => {
  res.json(_getStats());
});

router.post('/api/reports/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['pending', 'reviewed', 'actioned', 'dismissed'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'invalid status' });
  const report = _reports.find(r => r.id === id);
  if (!report) return res.status(404).json({ error: 'not found' });
  report.status = status;
  res.json({ success: true, report });
});

// Serve the admin dashboard HTML
router.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>ConnectNow Admin</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #e2e8f0; min-height: 100vh; }
  header { background: linear-gradient(135deg, #7c3aed, #ec4899); padding: 20px 32px; display: flex; align-items: center; gap: 16px; }
  header h1 { font-size: 22px; font-weight: 800; color: #fff; }
  header span { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; color: #fff; }
  .container { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .stat-card { background: #13131a; border: 1px solid #1e1e2e; border-radius: 14px; padding: 20px; }
  .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .stat-value { font-size: 32px; font-weight: 800; color: #fff; }
  .stat-sub { font-size: 11px; color: #4b5563; margin-top: 4px; }
  .section-title { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .badge { background: #7c3aed; color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 700; }
  .report-list { display: flex; flex-direction: column; gap: 10px; }
  .report-card { background: #13131a; border: 1px solid #1e1e2e; border-radius: 12px; padding: 16px 20px; display: flex; align-items: flex-start; gap: 16px; }
  .report-card:hover { border-color: #7c3aed44; }
  .report-meta { flex: 1; }
  .report-reason { font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 4px; }
  .report-sub { font-size: 12px; color: #6b7280; }
  .report-sub b { color: #9ca3af; }
  .report-date { font-size: 11px; color: #4b5563; margin-top: 6px; }
  .status-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 8px; white-space: nowrap; cursor: pointer; border: none; }
  .status-pending   { background: rgba(245,158,11,0.15); color: #f59e0b; }
  .status-reviewed  { background: rgba(59,130,246,0.15); color: #3b82f6; }
  .status-actioned  { background: rgba(16,185,129,0.15); color: #10b981; }
  .status-dismissed { background: rgba(107,114,128,0.15); color: #6b7280; }
  select.status-select { background: #1e1e2e; border: 1px solid #374151; color: #e2e8f0; font-size: 12px; padding: 4px 8px; border-radius: 8px; cursor: pointer; }
  .empty { text-align: center; padding: 60px 0; color: #4b5563; font-size: 14px; }
  .refresh-btn { background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.4); color: #a78bfa; padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; font-weight: 600; }
  .refresh-btn:hover { background: rgba(124,58,237,0.3); }
  .top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .filter-tabs { display: flex; gap: 8px; }
  .filter-tab { background: #1e1e2e; border: 1px solid #374151; color: #9ca3af; padding: 6px 14px; border-radius: 20px; font-size: 12px; cursor: pointer; font-weight: 600; }
  .filter-tab.active { background: rgba(124,58,237,0.2); border-color: #7c3aed; color: #a78bfa; }
  #last-updated { font-size: 11px; color: #4b5563; margin-top: 8px; }
</style>
</head>
<body>
<header>
  <div>
    <h1>⚡ ConnectNow Admin</h1>
  </div>
  <span id="env-tag">Live</span>
</header>
<div class="container">
  <div class="stats" id="stats-grid">
    <div class="stat-card"><div class="stat-label">Online Users</div><div class="stat-value" id="stat-online">—</div><div class="stat-sub">active connections</div></div>
    <div class="stat-card"><div class="stat-label">In Queue</div><div class="stat-value" id="stat-queued">—</div><div class="stat-sub">waiting to match</div></div>
    <div class="stat-card"><div class="stat-label">In Video Chats</div><div class="stat-value" id="stat-matched">—</div><div class="stat-sub">currently chatting</div></div>
    <div class="stat-card"><div class="stat-label">Live Streams</div><div class="stat-value" id="stat-live">—</div><div class="stat-sub">active streams</div></div>
    <div class="stat-card"><div class="stat-label">Total Reports</div><div class="stat-value" id="stat-reports">—</div><div class="stat-sub">all time</div></div>
    <div class="stat-card"><div class="stat-label">Pending Review</div><div class="stat-value" id="stat-pending">—</div><div class="stat-sub">needs action</div></div>
  </div>

  <div class="top-bar">
    <div class="section-title">Reports <span class="badge" id="report-count">0</span></div>
    <button class="refresh-btn" onclick="loadAll()">↻ Refresh</button>
  </div>

  <div class="filter-tabs" id="filter-tabs" style="margin-bottom:16px">
    <button class="filter-tab active" data-filter="all" onclick="setFilter('all',this)">All</button>
    <button class="filter-tab" data-filter="pending" onclick="setFilter('pending',this)">Pending</button>
    <button class="filter-tab" data-filter="reviewed" onclick="setFilter('reviewed',this)">Reviewed</button>
    <button class="filter-tab" data-filter="actioned" onclick="setFilter('actioned',this)">Actioned</button>
    <button class="filter-tab" data-filter="dismissed" onclick="setFilter('dismissed',this)">Dismissed</button>
  </div>

  <div id="report-list" class="report-list"></div>
  <div id="last-updated"></div>
</div>

<script>
let allReports = [];
let currentFilter = 'all';

async function loadAll() {
  await Promise.all([loadStats(), loadReports()]);
  document.getElementById('last-updated').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
}

async function loadStats() {
  try {
    const [sRes, rRes] = await Promise.all([
      fetch('/admin/api/stats').then(r => r.json()),
      fetch('/admin/api/reports').then(r => r.json()),
    ]);
    document.getElementById('stat-online').textContent = sRes.online ?? 0;
    document.getElementById('stat-queued').textContent = sRes.queued ?? 0;
    document.getElementById('stat-matched').textContent = sRes.matched ?? 0;
    document.getElementById('stat-live').textContent = sRes.live ?? 0;
    document.getElementById('stat-reports').textContent = rRes.total ?? 0;
    const pending = (rRes.reports || []).filter(r => r.status === 'pending').length;
    document.getElementById('stat-pending').textContent = pending;
  } catch(e) { console.error('stats error', e); }
}

async function loadReports() {
  try {
    const data = await fetch('/admin/api/reports').then(r => r.json());
    allReports = data.reports || [];
    renderReports();
  } catch(e) {
    document.getElementById('report-list').innerHTML = '<div class="empty">Failed to load reports</div>';
  }
}

function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderReports();
}

function renderReports() {
  const filtered = currentFilter === 'all' ? allReports : allReports.filter(r => r.status === currentFilter);
  document.getElementById('report-count').textContent = filtered.length;
  const el = document.getElementById('report-list');
  if (!filtered.length) { el.innerHTML = '<div class="empty">No reports found</div>'; return; }
  el.innerHTML = filtered.map(r => \`
    <div class="report-card" id="card-\${r.id}">
      <div class="report-meta">
        <div class="report-reason">\${escHtml(r.reason)}</div>
        <div class="report-sub">Reporter: <b>\${escHtml(r.reporterId?.slice(0,16) || '—')}</b> → Reported: <b>\${escHtml(r.reportedName || r.reportedId?.slice(0,16) || '—')}</b></div>
        \${r.context ? '<div class="report-sub" style="margin-top:4px">Context: <b>' + escHtml(r.context) + '</b></div>' : ''}
        \${r.sessionId ? '<div class="report-sub">Session: <b>' + escHtml(r.sessionId) + '</b></div>' : ''}
        <div class="report-date">\${new Date(r.createdAt).toLocaleString()}</div>
      </div>
      <select class="status-select" onchange="updateStatus('\${r.id}', this.value)">
        <option value="pending" \${r.status==='pending'?'selected':''}>🟡 Pending</option>
        <option value="reviewed" \${r.status==='reviewed'?'selected':''}>🔵 Reviewed</option>
        <option value="actioned" \${r.status==='actioned'?'selected':''}>🟢 Actioned</option>
        <option value="dismissed" \${r.status==='dismissed'?'selected':''}>⚫ Dismissed</option>
      </select>
    </div>
  \`).join('');
}

async function updateStatus(id, status) {
  try {
    const res = await fetch(\`/admin/api/reports/\${id}/status\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const report = allReports.find(r => r.id === id);
      if (report) report.status = status;
      // Update pending count
      const pending = allReports.filter(r => r.status === 'pending').length;
      document.getElementById('stat-pending').textContent = pending;
      if (currentFilter !== 'all') renderReports();
    }
  } catch(e) { alert('Failed to update status'); }
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Auto-refresh every 30s
loadAll();
setInterval(loadAll, 30000);
</script>
</body>
</html>`);
});

module.exports = router;
