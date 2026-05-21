/* global React, ReactDOM, RekorData, RekorCharts */
const { useState, useMemo, useEffect, useRef } = React;
// LineChart, VerticalBarChart, HBarChart, HourHeatmap, Sparkline, IncidentMap, fmt, fmtFull
// are already in shared Babel scope from charts.jsx — Babel scripts concatenate.

// ────────────────────────────────────────────────────────────────────────────
// Icon set — minimal, line-style
// ────────────────────────────────────────────────────────────────────────────
const I = {
  doc: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg>,
  history: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></svg>,
  caret: <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 4.5l3 3 3-3" /></svg>,
  caretUp: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 14l6-6 6 6" /></svg>,
  caretDown: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 10l6 6 6-6" /></svg>,
  info: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></svg>,
  undo: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 7h11a6 6 0 1 1 0 12H8" /><path d="M7 3L3 7l4 4" /></svg>,
  redo: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 7H10a6 6 0 1 0 0 12h6" /><path d="M17 3l4 4-4 4" /></svg>,
  reset: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>,
  expand: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 9V4h5M20 15v5h-5M4 15v5h5M20 9V4h-5" /></svg>,
  more: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>,
  user: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>,
  gear: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>,
  logout: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>,
  cog: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 6h16M4 12h16M4 18h16" /></svg>,
  back: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 18l-6-6 6-6" /></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.9L22 10l-5.5 4.7L18.2 22 12 18.3 5.8 22l1.7-7.3L2 10l7.1-1.1z" /></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M5 21h14" /></svg>,
  filter: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 5h18l-7 9v6l-4-2v-4z" /></svg>
};

// Brand mark — abstract diamond/shield, NOT the real Rekor logo
const BrandMark = () =>
<svg width="22" height="22" viewBox="0 0 32 32" className="brand-mark">
    <path d="M16 2 L29 10 L29 22 L16 30 L3 22 L3 10 Z" fill="var(--brand)" />
    <path d="M16 2 L29 10 L16 18 L3 10 Z" fill="white" opacity="0.18" />
    <circle cx="16" cy="16" r="2.6" fill="white" />
  </svg>;


// ────────────────────────────────────────────────────────────────────────────
// Top chrome
// ────────────────────────────────────────────────────────────────────────────
function TopBar({ tab, setTab, onOpenSettings, inSettings }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => {if (ref.current && !ref.current.contains(e.target)) setOpen(false);};
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <header className="topbar">
      <div className="topbar-left">
        <BrandMark />
        <div className="brand-wordmark">
          <span>COMMAND</span>
          <span className="brand-sub">OPERATIONS</span>
        </div>
      </div>
      <nav className="topbar-tabs">
        {['Live Map', 'Data Hub'].map((t) =>
        <button key={t}
        className={'tabbtn ' + (tab === t && !inSettings ? 'on' : '')}
        onClick={() => setTab(t)}>
            {t}
          </button>
        )}
      </nav>
      <div className="topbar-right" ref={ref}>
        <button className={'user-chip ' + (open ? 'on' : '')} onClick={() => setOpen((o) => !o)}>
          {I.user} <span>Jeanus Rekor</span> {I.caret}
        </button>
        {open &&
        <div className="user-menu">
            <div className="user-menu-head">
              <div className="user-avatar">JR</div>
              <div>
                <div className="user-menu-name">Jeanus Rekor</div>
                <div className="user-menu-mail muted small">jko@rekor.ai</div>
              </div>
            </div>
            <button className="user-menu-item" onClick={() => {setOpen(false);onOpenSettings();}}>
              {I.gear}<span>Settings</span>
            </button>
            <button className="user-menu-item">
              {I.user}<span>Profile</span>
            </button>
            <div className="user-menu-sep" />
            <button className="user-menu-item">
              {I.logout}<span>Sign out</span>
            </button>
          </div>
        }
      </div>
    </header>);

}

// ────────────────────────────────────────────────────────────────────────────
// Sidebar
// ────────────────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage }) {
  const nav = [
  { group: 'Operational Performance', icon: I.doc, items: [
    { id: 'perf-agency', label: 'Agency Dashboard' },
    { id: 'perf-operator', label: 'Operator Dashboard' }]
  },
  { group: 'Analytics', icon: I.doc, items: [
    { id: 'incident-analysis', label: 'Incident Analysis' },
    { id: 'corridor-performance', label: 'Corridor Performance' },
    { id: 'response-times', label: 'Response Times' }]
  },
  { group: 'History', icon: I.history, items: [
    { id: 'incidents', label: 'Incidents' },
    { id: 'driver-shifts', label: 'Driver shifts' },
    { id: 'traffic-disruptions', label: 'Traffic disruptions' }]
  }];

  return (
    <aside className="sidebar">
      {nav.map((g, gi) =>
      <div key={gi} className="side-group">
          <div className="side-head">{g.icon}<span>{g.group}</span></div>
          <ul>
            {g.items.map((it) =>
          <li key={it.id}>
                <button
              className={'side-item ' + (page === it.id ? 'on' : '')}
              onClick={() => setPage(it.id)}>
                  {it.label}
                </button>
              </li>
          )}
          </ul>
        </div>
      )}
      <div className="side-foot">
        <div className="side-tip">
          <b>Tip</b>
          <p>Pin frequently-used filters to your workspace from the ⋯ menu on any control.</p>
        </div>
      </div>
    </aside>);

}

// ────────────────────────────────────────────────────────────────────────────
// Filter dropdown (custom — supports search + multi)
// ────────────────────────────────────────────────────────────────────────────
function Dropdown({ label, value, options, onChange, info, multi = false, values, onValuesChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {if (ref.current && !ref.current.contains(e.target)) setOpen(false);};
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtered = options.filter((o) => !q || o.toLowerCase().includes(q.toLowerCase()));

  let display = value;
  if (multi) {
    const sel = (values || []).filter((v) => v !== 'All');
    display = sel.length === 0 ? 'All' : sel.length === 1 ? sel[0] : `${sel.length} selected`;
  }

  const toggle = (opt) => {
    if (!multi) {onChange(opt);setOpen(false);return;}
    const cur = new Set(values || []);
    if (opt === 'All') {onValuesChange(['All']);return;}
    cur.delete('All');
    if (cur.has(opt)) cur.delete(opt);else cur.add(opt);
    onValuesChange(cur.size ? Array.from(cur) : ['All']);
  };

  const checked = (opt) => multi ? (values || []).includes(opt) : value === opt;

  return (
    <div className="ctrl" ref={ref}>
      <div className="ctrl-label">
        <span>{label}</span>
        {info && <span className="ctrl-info" title={info}>{I.info}</span>}
      </div>
      <button className={'select ' + (open ? 'open' : '') + (display !== 'All' ? ' has-value' : '')}
      onClick={() => setOpen((o) => !o)}>
        <span className="select-value">{display}</span>
        <span className="select-caret">{I.caret}</span>
      </button>
      {open &&
      <div className="popover">
          <div className="pop-search">
            {I.search}
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" autoFocus />
          </div>
          <div className="pop-list">
            {filtered.map((o) =>
          <button key={o}
          className={'pop-item ' + (checked(o) ? 'on' : '')}
          onClick={() => toggle(o)}>
                <span className={'pop-check ' + (multi ? 'multi' : '')}>
                  {checked(o) && (multi ? '✓' : '●')}
                </span>
                <span>{o}</span>
              </button>
          )}
            {filtered.length === 0 && <div className="pop-empty">No matches</div>}
          </div>
        </div>
      }
    </div>);

}

// ────────────────────────────────────────────────────────────────────────────
// Card chrome
// ────────────────────────────────────────────────────────────────────────────
function Card({ title, info, actions, children, className = '', onExpand }) {
  return (
    <section className={'card ' + className}>
      {(title || actions) &&
      <header className="card-head">
          <div className="card-title">
            <span>{title}</span>
            {info && <span className="ctrl-info" title={info}>{I.info}</span>}
          </div>
          <div className="card-actions">
            {actions}
            {onExpand && <button className="iconbtn" onClick={onExpand} title="Expand">{I.expand}</button>}
            <button className="iconbtn" title="More">{I.more}</button>
          </div>
        </header>
      }
      <div className="card-body">{children}</div>
    </section>);

}

// ────────────────────────────────────────────────────────────────────────────
// Pages
// ────────────────────────────────────────────────────────────────────────────
function IncidentAnalysisPage({ filterMul }) {
  const [filters, setFilters] = useState({
    Year: 'All', Month: 'All', 'Day of Month': 'All', 'Day of Week': 'All', Hour: 'All',
    Workspace: 'All',
    'Incident Type': 'All', 'Incident Subtypes': 'All', 'Incident Status': 'All',
    Corridor: 'All', 'Engaged Account': 'All', 'Completion Reason': 'All'
  });
  const [controlsOpen, setControlsOpen] = useState(true);
  const [hoverCorridor, setHoverCorridor] = useState(null);
  const [activeMetric, setActiveMetric] = useState('total');

  const setF = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  const f = RekorData.filters;

  // Apply a synthetic multiplier when filters narrow scope
  const m = useMemo(() => {
    let mul = 1;
    if (filters.Year !== 'All') mul *= 0.28;
    if (filters.Month !== 'All') mul *= 0.085;
    if (filters['Incident Type'] !== 'All') mul *= 0.18;
    if (filters.Corridor !== 'All') mul *= 0.12;
    if (filters['Day of Week'] !== 'All') mul *= 0.16;
    if (filters.Workspace !== 'All') mul *= 0.32;
    return mul * (filterMul || 1);
  }, [filters, filterMul]);

  const totalIncidents = Math.round(RekorData.totals.incidents * m);
  const series = useMemo(() => RekorData.incidentsOverTime.map((d) => ({ ...d, value: Math.round(d.value * m) })), [m]);
  const sources = useMemo(() => RekorData.creationSource.map((d) => ({ ...d, value: Math.round(d.value * m) })), [m]);
  const corridors = useMemo(() =>
  RekorData.corridorBars.map((d) => ({ ...d, value: Math.round(d.value * m) })), [m]);
  const types = useMemo(() => RekorData.incidentsByType.map((d) => ({ ...d, value: Math.round(d.value * m) })), [m]);

  const reset = () => setFilters((cur) => Object.fromEntries(Object.keys(cur).map((k) => [k, 'All'])));
  const activeFilterCount = Object.values(filters).filter((v) => v !== 'All').length;

  return (
    <div className="page">
      <header className="page-head">
        <h1>Incident Analysis</h1>
        <div className="page-actions">
          <button className="btn ghost"><span>{I.download}</span> Export</button>
          <button className="btn ghost"><span>{I.star}</span> Save view</button>
          <button className="btn primary">Refresh data</button>
        </div>
      </header>

      <div className="toolbar">
        <button className="iconbtn" onClick={reset} title="Reset filters">{I.reset}</button>
        <button className="iconbtn" title="Undo">{I.undo}</button>
        <button className="iconbtn dim" title="Redo" disabled>{I.redo}</button>
        <div className="toolbar-sep" />
        <div className="toolbar-meta">
          <span className="last-updated">Last refreshed 2 min ago</span>
          <span className="dot-sep">·</span>
          <span>Sample window: <b>Oct 2022 – May 2026</b></span>
        </div>
      </div>

      <section className={'controls ' + (controlsOpen ? '' : 'collapsed')}>
        <header className="controls-head" onClick={() => setControlsOpen((o) => !o)}>
          <div className="controls-title">
            <span>Controls</span>
            {activeFilterCount > 0 && <span className="badge">{activeFilterCount}</span>}
          </div>
          <button className="iconbtn">
            {controlsOpen ? I.caretUp : I.caretDown}
          </button>
        </header>
        {controlsOpen &&
        <div className="controls-grid">
            <Dropdown label="Year" value={filters.Year} options={f.years} onChange={setF('Year')} />
            <Dropdown label="Month" value={filters.Month} options={f.monthsList} onChange={setF('Month')} />
            <Dropdown label="Day of Month" value={filters['Day of Month']} options={f.dayOfMonthList} onChange={setF('Day of Month')} />
            <Dropdown label="Day of Week" value={filters['Day of Week']} options={f.dayOfWeekList} onChange={setF('Day of Week')} />
            <Dropdown label="Hour" value={filters.Hour} options={f.hourList} onChange={setF('Hour')} />
            <Dropdown label="Workspace" value={filters.Workspace} options={f.workspaces} onChange={setF('Workspace')} />
            <Dropdown label="Incident Type" value={filters['Incident Type']} options={f.incidentTypes} onChange={setF('Incident Type')} />
            <Dropdown label="Incident Subtypes" value={filters['Incident Subtypes']} options={f.incidentSubtypes} onChange={setF('Incident Subtypes')} />
            <Dropdown label="Incident Status" value={filters['Incident Status']} options={f.incidentStatus} onChange={setF('Incident Status')} />
            <Dropdown label="Corridor" value={filters.Corridor} options={f.corridors} onChange={setF('Corridor')} info="Logical road corridor (route + name)." />
            <Dropdown label="Engaged Account" value={filters['Engaged Account']} options={f.engagedAccounts} onChange={setF('Engaged Account')} info="Customer or partner organization." />
            <Dropdown label="Completion Reason" value={filters['Completion Reason']} options={f.completionReasons} onChange={setF('Completion Reason')} />
          </div>
        }
      </section>

      {/* Row 1 — totals + time series */}
      <div className="grid grid-12">
        <Card className="span-3 kpi-card" title="Total Incidents" info="All incidents in current filter window.">
          <div className="kpi-stack">
            <button
              className={'kpi-num ' + (activeMetric === 'total' ? 'on' : '')}
              onClick={() => setActiveMetric('total')}>
              {fmtFull(totalIncidents)}
            </button>
            <div className="kpi-delta up">▲ 4.8% vs prior window</div>
            <Sparkline data={series.slice(-12).map((d) => d.value)} />
          </div>
        </Card>

        <Card className="span-9" title="Incidents Over Time"
        actions={<div className="seg">
                <button className="on">Monthly</button>
                <button>Weekly</button>
                <button>Daily</button>
              </div>}>
          <LineChart data={series} />
        </Card>
      </div>

      {/* Row 2 — sources + corridors + locations + map */}
      <div className="grid grid-12">
        <Card className="span-3" title="Incidents by Creation Source">
          <VerticalBarChart data={sources} />
        </Card>
        <Card className="span-3" title="Corridors Most Affected by Incidents">
          <HBarChart data={corridors} onHover={setHoverCorridor} />
        </Card>
        <Card className="span-3" title="Locations Most Affected by Incidents">
          <div className="loc-table">
            <div className="loc-head">
              <div>Location</div>
              <div className="ar">Incidents</div>
            </div>
            <div className="loc-scroll">
              {RekorData.locations.map((row, i) => {
                const v = Math.round(row.incidents * m);
                const hot = hoverCorridor && row.loc.includes(hoverCorridor.label.replace('…', ''));
                return (
                  <div key={i} className={'loc-row ' + (hot ? 'hot' : '')}>
                    <div className="loc-loc" title={row.loc}>{row.loc}</div>
                    <div className="ar mono">{fmtFull(v)}</div>
                  </div>);

              })}
            </div>
          </div>
        </Card>
        <Card className="span-3 map-card" title="Incident Heat Map" onExpand={() => {}}>
          <IncidentMap />
        </Card>
      </div>

      {/* Row 3 — types, subtypes, by hour */}
      <div className="grid grid-12">
        <Card className="span-3" title="Incidents by Type">
          <HBarChart data={types} />
        </Card>
        <Card className="span-3" title="Incident by Subtypes">
          <div className="sub-table">
            <div className="sub-head">
              <div>Subtype</div>
              <div>Type</div>
              <div className="ar">Number of<br />Incidents</div>
            </div>
            <div className="sub-scroll">
              {RekorData.incidentBySubtype.map((row, i) =>
              <div key={i} className="sub-row">
                  <div>{row.subtype}</div>
                  <div className="muted">{row.type}</div>
                  <div className="ar mono">{fmtFull(Math.round(row.count * m))}</div>
                </div>
              )}
            </div>
          </div>
        </Card>
        <Card className="span-6" title="Average Incidents by Time of Day">
          <HourHeatmap />
          <div className="hm-legend">
            <span>Less</span>
            <div className="hm-scale">
              {[0.05, 0.2, 0.4, 0.6, 0.85].map((t, i) =>
              <div key={i} style={{ background: `color-mix(in oklab, var(--accent) ${Math.round(t * 92)}%, var(--card))` }} />
              )}
            </div>
            <span>More</span>
          </div>
        </Card>
      </div>
    </div>);

}

// ────────────────────────────────────────────────────────────────────────────
// History pages
// ────────────────────────────────────────────────────────────────────────────
function IncidentsListPage() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');
  const [sel, setSel] = useState(null);
  const types = ['All', ...new Set(RekorData.incidentsList.map((i) => i.type))];
  const statuses = ['All', ...new Set(RekorData.incidentsList.map((i) => i.status))];

  const rows = RekorData.incidentsList.filter((r) =>
  (type === 'All' || r.type === type) && (
  status === 'All' || r.status === status) && (
  !q || (r.id + r.corridor + r.type).toLowerCase().includes(q.toLowerCase()))
  );

  const tDelta = (m) => {
    if (m < 60) return `${m}m ago`;
    return `${Math.round(m / 60)}h ago`;
  };

  const statusClass = (s) => ({
    'Open': 'st-open', 'Confirmed': 'st-confirmed',
    'Cleared': 'st-cleared', 'Pending Review': 'st-pending'
  })[s] || '';

  const selRow = sel ? RekorData.incidentsList.find((r) => r.id === sel) : null;

  return (
    <div className="page">
      <header className="page-head">
        <h1>Incidents</h1>
        <div className="page-actions">
          <button className="btn ghost"><span>{I.download}</span> Export CSV</button>
          <button className="btn primary">+ Report incident</button>
        </div>
      </header>

      <div className="list-toolbar">
        <div className="search-box">
          {I.search}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search incidents, corridors, IDs…" />
        </div>
        <Dropdown label="Type" value={type} options={types} onChange={setType} />
        <Dropdown label="Status" value={status} options={statuses} onChange={setStatus} />
        <div className="list-meta">{rows.length.toLocaleString()} of {RekorData.incidentsList.length.toLocaleString()}</div>
      </div>

      <div className="split">
        <div className="list-table">
          <div className="lt-head">
            <div>ID</div>
            <div>Type</div>
            <div>Corridor</div>
            <div>Mile</div>
            <div>Lanes</div>
            <div>Reporter</div>
            <div>Status</div>
            <div className="ar">Reported</div>
            <div className="ar">Duration</div>
          </div>
          <div className="lt-scroll">
            {rows.map((r) =>
            <button key={r.id}
            className={'lt-row ' + (sel === r.id ? 'on' : '')}
            onClick={() => setSel(r.id)}>
                <div className="mono">{r.id}</div>
                <div>{r.type}</div>
                <div>{r.corridor} <span className="muted">{r.direction}</span></div>
                <div className="mono">{r.mile}</div>
                <div className="mono">{r.lanes}</div>
                <div className="muted">{r.reporter}</div>
                <div><span className={'st ' + statusClass(r.status)}>{r.status}</span></div>
                <div className="ar muted">{tDelta(r.time)}</div>
                <div className="ar mono">{r.duration}m</div>
              </button>
            )}
          </div>
        </div>

        <aside className="detail">
          {!selRow && <div className="empty">Select an incident to see details</div>}
          {selRow &&
          <>
              <div className="detail-head">
                <div>
                  <div className="detail-id mono">{selRow.id}</div>
                  <div className="detail-title">{selRow.type} — {selRow.corridor} {selRow.direction}</div>
                </div>
                <span className={'st ' + statusClass(selRow.status)}>{selRow.status}</span>
              </div>
              <div className="detail-grid">
                <div><label>Reported</label><div>{tDelta(selRow.time)}</div></div>
                <div><label>Duration</label><div>{selRow.duration} min</div></div>
                <div><label>Mile marker</label><div className="mono">{selRow.mile}</div></div>
                <div><label>Lanes blocked</label><div>{selRow.lanes}</div></div>
                <div><label>Source</label><div>{selRow.source}</div></div>
                <div><label>Reporter</label><div>{selRow.reporter}</div></div>
              </div>
              <div className="timeline">
                <div className="tl-head">Timeline</div>
                {[
              { t: 'Reported', m: selRow.time, by: selRow.reporter },
              { t: 'Confirmed', m: Math.max(0, selRow.time - 4), by: 'Operator JR' },
              { t: 'Dispatched', m: Math.max(0, selRow.time - 7), by: 'CAD' },
              { t: 'On scene', m: Math.max(0, selRow.time - 18), by: 'Unit 412' }].
              map((e, i) =>
              <div key={i} className="tl-row">
                    <div className="tl-dot" />
                    <div className="tl-text">
                      <b>{e.t}</b>
                      <span>{tDelta(e.m)} · {e.by}</span>
                    </div>
                  </div>
              )}
              </div>
              <div className="detail-actions">
                <button className="btn ghost">Open in Live Map</button>
                <button className="btn primary">Mark cleared</button>
              </div>
            </>
          }
        </aside>
      </div>
    </div>);

}

function DriverShiftsPage() {
  const total = RekorData.driverShifts.length;
  const onShift = RekorData.driverShifts.filter((s) => s.status === 'On shift').length;
  const totalCleared = RekorData.driverShifts.reduce((a, s) => a + s.cleared, 0);
  const avgClear = (RekorData.driverShifts.reduce((a, s) => a + s.avgClearMin, 0) / total).toFixed(1);
  return (
    <div className="page">
      <header className="page-head">
        <h1>Driver shifts</h1>
        <div className="page-actions">
          <button className="btn ghost"><span>{I.download}</span> Export</button>
          <button className="btn primary">+ Schedule shift</button>
        </div>
      </header>

      <div className="grid grid-4 mb24">
        {[
        { label: 'On shift now', value: onShift, sub: `${total} operators total` },
        { label: 'Incidents cleared (24h)', value: fmtFull(totalCleared) },
        { label: 'Avg clearance time', value: avgClear + 'm' },
        { label: 'Open escalations', value: '6' }].
        map((k, i) =>
        <Card key={i}>
            <div className="kpi-stack">
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-num">{k.value}</div>
              {k.sub && <div className="muted small">{k.sub}</div>}
            </div>
          </Card>
        )}
      </div>

      <Card title="Active shifts">
        <div className="list-table simple">
          <div className="lt-head shifts">
            <div>Operator</div>
            <div>Shift</div>
            <div>Workspace</div>
            <div className="ar">Assigned</div>
            <div className="ar">Cleared</div>
            <div className="ar">Avg clear</div>
            <div className="ar">Esc.</div>
            <div>Status</div>
          </div>
          <div className="lt-scroll">
            {RekorData.driverShifts.map((s) => {
              const pct = s.cleared / s.assigned * 100;
              return (
                <div key={s.name} className="lt-row shifts">
                  <div className="op-cell">
                    <div className="avatar">{s.name.split(' ').map((p) => p[0]).join('')}</div>
                    <span>{s.name}</span>
                  </div>
                  <div className="muted">{s.shift}</div>
                  <div>{s.workspace}</div>
                  <div className="ar mono">{s.assigned}</div>
                  <div className="ar mono">
                    {s.cleared}
                    <div className="bar-mini"><span style={{ width: pct + '%' }} /></div>
                  </div>
                  <div className="ar mono">{s.avgClearMin}m</div>
                  <div className="ar mono">{s.escalations}</div>
                  <div><span className={'st ' + (s.status === 'On shift' ? 'st-cleared' : s.status === 'Break' ? 'st-pending' : 'st-open')}>{s.status}</span></div>
                </div>);

            })}
          </div>
        </div>
      </Card>
    </div>);

}

function TrafficDisruptionsPage() {
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');
  const types = ['All', ...new Set(RekorData.trafficDisruptions.map((d) => d.type))];
  const statuses = ['All', ...new Set(RekorData.trafficDisruptions.map((d) => d.status))];
  const rows = RekorData.trafficDisruptions.filter((r) =>
  (type === 'All' || r.type === type) && (status === 'All' || r.status === status));

  const impactClass = (i) => ({
    'Low': 'st-cleared', 'Moderate': 'st-pending', 'High': 'st-confirmed', 'Severe': 'st-open'
  })[i];

  return (
    <div className="page">
      <header className="page-head">
        <h1>Traffic disruptions</h1>
        <div className="page-actions">
          <button className="btn ghost"><span>{I.download}</span> Export</button>
          <button className="btn primary">+ New disruption</button>
        </div>
      </header>

      <div className="list-toolbar">
        <Dropdown label="Type" value={type} options={types} onChange={setType} />
        <Dropdown label="Status" value={status} options={statuses} onChange={setStatus} />
        <div className="list-meta">{rows.length} disruption{rows.length === 1 ? '' : 's'}</div>
      </div>

      <Card>
        <div className="list-table">
          <div className="lt-head td">
            <div>ID</div>
            <div>Disruption</div>
            <div>Type</div>
            <div>Corridor</div>
            <div>Lanes</div>
            <div>Window</div>
            <div>Impact</div>
            <div>Status</div>
          </div>
          <div className="lt-scroll">
            {rows.map((r) =>
            <div key={r.id} className="lt-row td">
                <div className="mono">{r.id}</div>
                <div><b>{r.name}</b></div>
                <div className="muted">{r.type}</div>
                <div>{r.corridor}</div>
                <div className="mono">{r.lanes}</div>
                <div className="muted small">{r.start}<br />→ {r.end}</div>
                <div><span className={'st ' + impactClass(r.impact)}>{r.impact}</span></div>
                <div><span className={'st ' + (r.status === 'Active' ? 'st-confirmed' : r.status === 'Scheduled' ? 'st-pending' : 'st-cleared')}>{r.status}</span></div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>);

}

function PlaceholderPage({ title, subtitle }) {
  return (
    <div className="page">
      <header className="page-head">
        <h1>{title}</h1>
      </header>
      <Card>
        <div className="empty-page">
          <div className="empty-icon">📊</div>
          <h3>{subtitle}</h3>
          <p>This view is part of the Analytics roadmap. Use Incident Analysis for the equivalent breakdown today.</p>
        </div>
      </Card>
    </div>);

}

function LiveMapPage() {
  return (
    <div className="page live-map">
      <div className="lm-side">
        <div className="lm-side-head">
          <h2>Live Operations</h2>
          <span className="live-pill"><span className="live-dot" /> LIVE</span>
        </div>
        <div className="lm-counters">
          <div><b>142</b><span>Open incidents</span></div>
          <div><b>38</b><span>Units en-route</span></div>
          <div><b>17.4m</b><span>Avg clearance</span></div>
        </div>
        <div className="lm-feed">
          <div className="lm-feed-head">Active feed</div>
          {RekorData.incidentsList.slice(0, 8).map((r) =>
          <div key={r.id} className="lm-feed-row">
              <span className="lm-feed-dot" />
              <div className="lm-feed-text">
                <b>{r.type}</b>
                <span>{r.corridor} {r.direction} · MM {r.mile}</span>
              </div>
              <span className="muted small">{r.time}m</span>
            </div>
          )}
        </div>
      </div>
      <div className="lm-map">
        <IncidentMap />
        <div className="lm-overlay">Drag to pan · scroll to zoom</div>
      </div>
    </div>);

}

// ────────────────────────────────────────────────────────────────────────────
// Settings shell — separate left nav, replaces Data Hub sidebar when active
// ────────────────────────────────────────────────────────────────────────────
const SETTINGS_NAV = [
{
  section: 'Account',
  items: [
  { id: 'general', label: 'General', children: [
    { id: 'account-details', label: 'Account details' },
    { id: 'working-hours', label: 'Working hours' },
    { id: 'resources', label: 'Resources' }]
  },
  { id: 'roles', label: 'Roles' },
  { id: 'users', label: 'Users' },
  { id: 'live-map', label: 'Live Map', children: [
    { id: 'live-map-layers', label: 'Layers' },
    { id: 'live-map-defaults', label: 'Defaults' }]
  }]

},
{
  section: 'Configurations',
  items: [
  { id: 'incidents', label: 'Incidents', children: [
    { id: 'incidents-types', label: 'Types & subtypes' },
    { id: 'incidents-reminders', label: 'Reminders' }]
  },
  { id: 'road-closures', label: 'Road closures', children: [
    { id: 'rc-reasons', label: 'Closure reasons' }]
  },
  { id: 'construction', label: 'Construction', children: [
    { id: 'con-projects', label: 'Projects' }]
  },
  { id: 'field-operations', label: 'Field operations', children: [
    { id: 'fo-units', label: 'Units' }]
  }]

}];


function SettingsSidebar({ page, setPage, onClose }) {
  // Auto-open whichever group contains the active page.
  const findParent = (id) => {
    for (const sec of SETTINGS_NAV)
    for (const it of sec.items)
    if (it.children?.some((c) => c.id === id)) return it.id;
    return 'general';
  };
  const [openGroup, setOpenGroup] = useState(findParent(page));

  return (
    <aside className="settings-sidebar">
      <div className="settings-sidebar-head">
        <button className="settings-back" onClick={onClose} title="Back to Data Hub">
          {I.back}
        </button>
        <span>SETTINGS</span>
      </div>

      {SETTINGS_NAV.map((sec) =>
      <div key={sec.section} className="settings-section">
          <div className="settings-section-head">
            {I.cog}<span>{sec.section.toUpperCase()}</span>
          </div>
          <ul className="settings-list">
            {sec.items.map((it) => {
            const hasChildren = !!it.children;
            const isOpen = openGroup === it.id;
            const activeChild = hasChildren && it.children.some((c) => c.id === page);
            return (
              <li key={it.id}>
                  <button
                  className={'settings-item ' + (hasChildren ? 'has-kids ' : '') + (!hasChildren && page === it.id ? 'on ' : '') + (activeChild ? 'parent-open ' : '')}
                  onClick={() => {
                    if (hasChildren) setOpenGroup(isOpen ? null : it.id);else
                    setPage(it.id);
                  }}>
                    <span>{it.label}</span>
                    {hasChildren &&
                  <span className="settings-caret">{isOpen ? I.caretUp : I.caretDown}</span>
                  }
                  </button>
                  {hasChildren && isOpen &&
                <ul className="settings-sublist">
                      {it.children.map((c) =>
                  <li key={c.id}>
                          <button
                      className={'settings-subitem ' + (page === c.id ? 'on' : '')}
                      onClick={() => setPage(c.id)}>
                            {c.label}
                          </button>
                        </li>
                  )}
                    </ul>
                }
                </li>);

          })}
          </ul>
        </div>
      )}
    </aside>);

}

function SettingsPlaceholder({ title, subtitle }) {
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 style={{ margin: 0 }}>{title}</h1>
          {subtitle && <p className="muted" style={{ margin: '4px 0 0' }}>{subtitle}</p>}
        </div>
      </header>
      <div className="settings-empty">
        <div className="settings-empty-icon">{I.gear}</div>
        <h3>{title}</h3>
        <p>This settings panel hasn't been wired up in the prototype yet.</p>
      </div>
    </div>);

}

function SettingsShell({ onClose }) {
  const [page, setPage] = useState('working-hours');
  const titleMap = {
    'account-details': ['Account details', 'Manage your agency profile and contact information.'],
    'working-hours': null, // ShiftsAdmin has its own header
    'resources': ['Resources', 'Manage uploadable resources used across the agency.'],
    'roles': ['Roles', 'Role-based access control.'],
    'users': ['Users', 'Manage operator accounts and access.']
  };

  const renderPage = () => {
    if (page === 'working-hours') {
      return <div className="page"><window.PerfPage.ShiftsAdmin /></div>;
    }
    const meta = titleMap[page];
    if (meta) return <SettingsPlaceholder title={meta[0]} subtitle={meta[1]} />;
    // Capitalize default for unknown ids
    const label = page.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
    return <SettingsPlaceholder title={label} subtitle="" />;
  };

  return (
    <div className="body">
      <SettingsSidebar page={page} setPage={setPage} onClose={onClose} />
      <main className="main settings-main">
        {renderPage()}
      </main>
    </div>);

}

// ────────────────────────────────────────────────────────────────────────────
// Tweaks
// ────────────────────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#2563EB",
  "density": "Comfy",
  "theme": "Light",
  "sidebar": "Expanded",
  "showMap": true,
  "filterAggression": 1
} /*EDITMODE-END*/;

function App() {
  const [tab, setTab] = useState('Data Hub');
  const [page, setPage] = useState('perf-agency');
  const [inSettings, setInSettings] = useState(false);
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  // Apply tweaks to root
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', tweaks.accent);
    document.documentElement.dataset.density = tweaks.density.toLowerCase();
    document.documentElement.dataset.theme = tweaks.theme.toLowerCase();
    document.documentElement.dataset.sidebar = tweaks.sidebar.toLowerCase();
  }, [tweaks]);

  const Page = () => {
    if (tab === 'Live Map') return <LiveMapPage />;
    switch (page) {
      case 'perf-agency':return <div className="page"><header className="page-head"><div><h1>Operational Performance — Agency</h1><p className="muted" style={{ margin: '4px 0 0' }}>Aggregated operator efficiency, workflow timing, and reminder behavior across the agency.</p></div><div className="page-actions"><button className="btn ghost">Export CSV</button></div></header><window.PerfPage.AgencyDashboard /></div>;
      case 'perf-operator':return <div className="page"><header className="page-head"><div><h1>Operational Performance — Operators</h1><p className="muted" style={{ margin: '4px 0 0' }}>Drill down into individual operator metrics for coaching and reminder-workflow tuning.</p></div><div className="page-actions"><button className="btn ghost">Export CSV</button></div></header><window.PerfPage.OperatorDashboard /></div>;
      case 'incident-analysis':return <IncidentAnalysisPage filterMul={tweaks.filterAggression} />;
      case 'incidents':return <IncidentsListPage />;
      case 'driver-shifts':return <DriverShiftsPage />;
      case 'traffic-disruptions':return <TrafficDisruptionsPage />;
      case 'corridor-performance':return <PlaceholderPage title="Corridor Performance" subtitle="Per-corridor SLAs, throughput, and incident density." />;
      case 'response-times':return <PlaceholderPage title="Response Times" subtitle="Detection-to-clearance lifecycle by corridor and operator." />;
      default:return null;
    }
  };

  return (
    <div className="shell" data-tab={tab}>
      <TopBar tab={tab} setTab={(t) => {setInSettings(false);setTab(t);}}
      inSettings={inSettings}
      onOpenSettings={() => setInSettings(true)} />
      {inSettings ?
      <SettingsShell onClose={() => setInSettings(false)} /> :

      <div className="body">
          {tab === 'Data Hub' && <Sidebar page={page} setPage={setPage} />}
          <main className="main">
            <Page />
          </main>
        </div>
      }

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Theme">
          <window.TweakRadio label="Mode" value={tweaks.theme} options={['Light', 'Dark']}
          onChange={(v) => setTweak('theme', v)} />
          <window.TweakColor label="Accent" value={tweaks.accent}
          options={['#2563EB', '#0EA5E9', '#16A34A', '#9333EA', '#DB2777']}
          onChange={(v) => setTweak('accent', v)} />
        </window.TweakSection>
        <window.TweakSection label="Layout">
          <window.TweakRadio label="Density" value={tweaks.density} options={['Cozy', 'Comfy']}
          onChange={(v) => setTweak('density', v)} />
          <window.TweakRadio label="Sidebar" value={tweaks.sidebar} options={['Expanded', 'Compact']}
          onChange={(v) => setTweak('sidebar', v)} />
        </window.TweakSection>
        <window.TweakSection label="Demo data">
          <window.TweakSlider label="Filter narrowness" value={tweaks.filterAggression}
          min={0.05} max={1} step={0.05} unit="×"
          onChange={(v) => setTweak('filterAggression', v)} />
        </window.TweakSection>
      </window.TweaksPanel>
    </div>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);