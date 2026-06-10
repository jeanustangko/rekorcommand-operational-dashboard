/* global React, RekorPerf */
// Operational Performance Dashboard — Agency, Operator, and Shifts admin views.
// All metrics derived from window.RekorPerf and respect the filter set.

const PerfPage = (() => {
  const { useState, useMemo } = React;

  // ── Date range picker (two-month calendar) ────────────────────────────────
  function fmtMD(d) {
    return d ? `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}, ${d.getFullYear()}` : '';
  }
  function MonthGrid({ year, month, start, end, hover, onPick, onHover }) {
    const first = new Date(year, month, 1);
    const lead = (first.getDay() + 6) % 7; // Mon-first
    const daysIn = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= daysIn; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    const inRange = (d) => {
      if (!d || !start) return false;
      const e = end || hover || start;
      const [a, b] = start <= e ? [start, e] : [e, start];
      return d >= new Date(a.getFullYear(), a.getMonth(), a.getDate()) &&
      d <= new Date(b.getFullYear(), b.getMonth(), b.getDate());
    };
    const same = (a, b) => a && b && a.toDateString() === b.toDateString();
    return (
      <div className="cal-month">
        <div className="cal-head">{first.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</div>
        <div className="cal-grid">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => <div key={d} className="cal-dow">{d}</div>)}
          {cells.map((d, i) =>
          <button key={i} className={'cal-cell ' + (
          !d ? 'empty ' : '') + (
          inRange(d) ? 'in ' : '') + (
          same(d, start) ? 'start ' : '') + (
          same(d, end) ? 'end ' : '')}
          disabled={!d}
          onClick={() => d && onPick(d)}
          onMouseEnter={() => d && onHover(d)}>
              {d ? d.getDate() : ''}
            </button>
          )}
        </div>
      </div>);

  }

  function DateRangePicker({ anchor, onApply, onClose, initial }) {
    const today = new Date();
    const [start, setStart] = useState(initial?.start || null);
    const [end, setEnd] = useState(initial?.end || null);
    const [hover, setHover] = useState(null);
    const [month, setMonth] = useState({ y: today.getFullYear(), m: today.getMonth() - 1 });
    const nextMonth = () => setMonth(({ y, m }) => m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 });
    const prevMonth = () => setMonth(({ y, m }) => m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 });

    const pick = (d) => {
      if (!start || start && end) {setStart(d);setEnd(null);} else
      if (d < start) {setEnd(start);setStart(d);} else
      {setEnd(d);}
    };

    const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'Year to date', ytd: true },
    { label: 'Last 12 months', days: 365 }];

    const applyPreset = (p) => {
      const e = new Date();
      const s = new Date();
      if (p.ytd) s.setMonth(0, 1);else
      s.setDate(e.getDate() - p.days + 1);
      setStart(s);setEnd(e);
    };

    React.useEffect(() => {
      const onKey = (e) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const m1 = month;
    const m2 = m1.m === 11 ? { y: m1.y + 1, m: 0 } : { y: m1.y, m: m1.m + 1 };

    const canApply = start && end;
    const labelOut = canApply ? `${fmtMD(start)} – ${fmtMD(end)}` : '';

    return (
      <>
        <div className="cal-mask" onClick={onClose} />
        <div className="cal-pop" style={anchor}>
          <div className="cal-presets">
            {presets.map((p) =>
            <button key={p.label} className="cal-preset" onClick={() => applyPreset(p)}>{p.label}</button>
            )}
          </div>
          <div className="cal-main">
            <div className="cal-nav">
              <button className="iconbtn" onClick={prevMonth}>‹</button>
              <div className="cal-summary">
                {start ? <><b>{fmtMD(start)}</b> <span className="muted">→</span> <b>{end ? fmtMD(end) : <em>pick end</em>}</b></> :
                <span className="muted">Pick a start date</span>}
              </div>
              <button className="iconbtn" onClick={nextMonth}>›</button>
            </div>
            <div className="cal-months">
              <MonthGrid year={m1.y} month={m1.m} start={start} end={end} hover={hover} onPick={pick} onHover={setHover} />
              <MonthGrid year={m2.y} month={m2.m} start={start} end={end} hover={hover} onPick={pick} onHover={setHover} />
            </div>
            <div className="cal-foot">
              <span className="muted small">{labelOut}</span>
              <div className="cal-foot-actions">
                <button className="btn ghost" onClick={onClose}>Cancel</button>
                <button className="btn primary" disabled={!canApply}
                onClick={() => onApply({ start, end, label: labelOut })}>Apply</button>
              </div>
            </div>
          </div>
        </div>
      </>);

  }

  // ── Filter chip strip ─────────────────────────────────────────────────────
  // ── Time-of-day range control ─────────────────────────────────────────
  const FULL_DAY = { start: '00:00', end: '23:59' };
  const isFullDay = (v) => !v || v.start === FULL_DAY.start && v.end === FULL_DAY.end;
  function TimeRangeControl({ label, value, onChange }) {
    const v = value || FULL_DAY;
    const set = (key, t) => onChange({ ...v, [key]: t });
    const isAll = isFullDay(v);
    return (
      <div className="ctrl">
        <div className="ctrl-label"><span>{label}</span></div>
        <div className={'time-range ' + (isAll ? '' : 'has-value')}>
          <input type="time" value={v.start} onChange={(e) => set('start', e.target.value)} aria-label="Start time" />
          <span className="time-range-sep">–</span>
          <input type="time" value={v.end} onChange={(e) => set('end', e.target.value)} aria-label="End time" />
          {!isAll &&
          <button className="time-range-clear" title="Reset to all day"
          onClick={() => onChange(FULL_DAY)}>×</button>
          }
        </div>
      </div>);

  }

  function FilterStrip({ filters, options, onChange, onReset }) {
    const keys = Object.keys(filters);
    const isActive = (k, v) => {
      if (k === 'Date range') return v !== 'Last 90 days';
      if (k === 'Time of day') return !isFullDay(v);
      return Array.isArray(v) ? !v.includes('All') && v.length > 0 : v !== 'All';
    };
    const active = keys.filter((k) => isActive(k, filters[k])).length;
    const [picker, setPicker] = useState(false);
    const [customRange, setCustomRange] = useState(null);

    const handleChange = (k, v) => {
      if (k === 'Date range' && v === 'Custom…') {
        setPicker(true);
        return;
      }
      onChange(k, v);
    };

    return (
      <section className="controls">
        <header className="controls-head">
          <div className="controls-title">
            <span>Filters</span>
            {active > 0 && <span className="badge">{active}</span>}
          </div>
          <button className="btn ghost" onClick={onReset} style={{ height: 28, padding: '4px 10px' }}>
            Reset
          </button>
        </header>
        <div className="controls-grid" style={{ gridTemplateColumns: `repeat(${Math.min(keys.length, 6)}, minmax(0, 1fr))` }}>
          {keys.map((k) => {
            if (k === 'Date range') {
              return (
                <Dropdown key={k} label={k} value={filters[k]} options={options[k] || ['All']}
                onChange={(v) => handleChange(k, v)} />);
            }
            if (k === 'Time of day') {
              return (
                <TimeRangeControl key={k} label={k} value={filters[k]}
                onChange={(v) => onChange(k, v)} />);
            }
            return (
              <Dropdown key={k} label={k} multi values={filters[k]} options={options[k] || ['All']}
              onValuesChange={(vals) => onChange(k, vals)} />);
          })}
        </div>
        {picker &&
        <DateRangePicker
          initial={customRange}
          onClose={() => setPicker(false)}
          onApply={(r) => {
            setCustomRange(r);
            onChange('Date range', r.label);
            setPicker(false);
          }} />

        }
      </section>);

  }

  // ── Big metric card with both AVG and MEDIAN ──────────────────────────────
  // "Vs previous period" delta chip. `delta` is signed and expressed in the
  // SAME unit as the metric it accompanies (suffix e.g. '%', ' min').
  // `invert` marks metrics where a decrease is an improvement.
  function DeltaChip({ delta, suffix = '%', invert = false, periodLabel = 'prior period', decimals = 1 }) {
    const flat = Math.abs(delta) < Math.pow(10, -decimals) / 2;
    const good = invert ? delta < 0 : delta > 0;
    const cls = flat ? 'neutral' : good ? 'good' : 'bad';
    const arrow = flat ? '–' : delta > 0 ? '▲' : '▼';
    return (
      <span className={'delta-chip ' + cls} title={'Change vs ' + periodLabel + ', under the current filters.'}>
        <b>{arrow} {Math.abs(delta).toFixed(decimals)}{suffix}</b>
        <span className="delta-chip-cap">vs {periodLabel}</span>
      </span>);

  }

  function RateCard({ title, info, kpi, color = 'var(--accent)', delta, invert, periodLabel }) {
    return (
      <Card title={title} info={info}>
        <div className="rate-card">
          <div className="rate-main">
            <div className="rate-pct" style={{ color }}>{kpi.avg.toFixed(1)}<span>%</span></div>
            <div className="rate-label">Average</div>
            {delta != null &&
            <DeltaChip delta={delta} suffix="%" invert={invert} periodLabel={periodLabel} />
            }
          </div>
          <div className="rate-side">
            <div>
              <div className="rate-sub-num">{kpi.median.toFixed(1)}%</div>
              <div className="rate-sub-label">Median</div>
            </div>
            <div>
              <div className="rate-sub-num">{kpi.num.toLocaleString()}</div>
              <div className="rate-sub-label">of {kpi.den.toLocaleString()}</div>
            </div>
          </div>
          <div className="rate-bar">
            <div className="rate-bar-fill" style={{ width: kpi.avg + '%', background: color }} />
          </div>
        </div>
      </Card>);

  }

  // ── Timing / count metric card (non-percentage variant of RateCard) ──────
  // `unit` is rendered inline next to the value (e.g. "min").
  // `context` provides one extra stat displayed alongside the median.
  // `deltaUnit` matches the unit of the main metric (e.g. ' min'); the delta
  // value itself is expressed in that same unit, not as a relative percent.
  function MetricCard({ title, info, kpi, unit, color = 'var(--accent)', context, barPct = 60, fmt, delta, deltaUnit = '', deltaDecimals = 1, invert, periodLabel }) {
    const f = fmt || ((v) => v.toFixed(1));
    return (
      <Card title={title} info={info}>
        <div className="rate-card">
          <div className="rate-main">
            <div className="rate-pct" style={{ color }}>
              {f(kpi.avg)}<span>{unit ? ' ' + unit : ''}</span>
            </div>
            <div className="rate-label">Average</div>
            {delta != null &&
            <DeltaChip delta={delta} suffix={deltaUnit} decimals={deltaDecimals} invert={invert} periodLabel={periodLabel} />
            }
          </div>
          <div className="rate-side">
            <div>
              <div className="rate-sub-num">{f(kpi.median)}{unit ? ' ' + unit : ''}</div>
              <div className="rate-sub-label">Median</div>
            </div>
            {context &&
            <div>
                <div className="rate-sub-num">{context.value}</div>
                <div className="rate-sub-label">{context.label}</div>
              </div>
            }
          </div>
          <div className="rate-bar">
            <div className="rate-bar-fill" style={{ width: barPct + '%', background: color }} />
          </div>
        </div>
      </Card>);

  }

  // ── Per-shift comparison of creation→confirmation delay ──────────────────
  function ShiftDelayCompare({ data, periodLabel }) {
    const max = Math.max(...data.flatMap((d) => [d.avg, d.median]));
    // Pick the shift with the lowest avg as the "best"
    const best = data.reduce((a, b) => a.avg <= b.avg ? a : b);
    return (
      <div className="shift-compare">
        {data.map((s) => {
          const isBest = s.shift === best.shift;
          return (
            <div key={s.shift} className={'sc-col ' + (isBest ? 'best' : '')}>
              <div className="sc-head">
                <span className="sc-swatch" style={{ background: s.color }} />
                <div className="sc-name">
                  <b>{s.shift}</b>
                  <span className="mono muted small">{s.window}</span>
                </div>
                {isBest && <span className="sc-badge">Fastest</span>}
              </div>

              <div className="sc-hero">
                <div className="sc-hero-num" style={{ color: s.color }}>
                  {s.avg.toFixed(1)}<span>min</span>
                </div>
                <div className="sc-hero-label">Avg lead time</div>
                {s.delta != null &&
                <DeltaChip delta={s.avg - s.avg / (1 + s.delta / 100)} suffix=" min" decimals={2} invert={true} periodLabel={periodLabel} />
                }
              </div>

              <div className="sc-bars">
                <div className="sc-bar-row">
                  <span className="sc-bar-label">avg</span>
                  <div className="sc-bar"><div className="sc-fill" style={{ width: s.avg / max * 100 + '%', background: s.color }} /></div>
                  <span className="sc-bar-val mono">{s.avg.toFixed(1)}m</span>
                </div>
                <div className="sc-bar-row">
                  <span className="sc-bar-label">median</span>
                  <div className="sc-bar"><div className="sc-fill" style={{ width: s.median / max * 100 + '%', background: 'color-mix(in oklab, ' + s.color + ' 55%, white)' }} /></div>
                  <span className="sc-bar-val mono">{s.median.toFixed(1)}m</span>
                </div>
              </div>

              <div className="sc-foot">
                <div className="sc-foot-stat">
                  <b className="mono">{s.confirmed.toLocaleString()}</b>
                  <span>confirmed incidents</span>
                </div>
              </div>
            </div>);

        })}
      </div>);

  }

  // ── Sortable header helper ───────────────────────────────────────────────
  function SortHeader({ label, field, sort, setSort, align = 'left' }) {
    const active = sort.field === field;
    const dir = active ? sort.dir : null;
    const onClick = () => {
      if (active) setSort({ field, dir: sort.dir === 'asc' ? 'desc' : 'asc' });else
      setSort({ field, dir: 'desc' });
    };
    return (
      <div className={'sort-h ' + (align === 'right' ? 'ar' : '') + (active ? ' active' : '')}
      onClick={onClick} role="button" tabIndex={0}>
        <span>{label}</span>
        <span className="sort-ic">{dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : '↕'}</span>
      </div>);

  }

  function sortRows(data, sort) {
    if (!sort || !sort.field) return data;
    const { field, dir } = sort;
    const m = dir === 'asc' ? 1 : -1;
    return data.slice().sort((a, b) => {
      const av = a[field],bv = b[field];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * m;
      return String(av).localeCompare(String(bv)) * m;
    });
  }

  // ── Closure reasons — Roadway | Reason | Status | Count | % ──────────────
  function ClosureReasonsTable({ data, simple = false }) {
    const [sort, setSort] = useState({ field: 'count', dir: 'desc' });
    const max = Math.max(...data.map((d) => d.count));
    const rows = sortRows(data, sort);
    return (
      <div className="closure-table">
        <div className={'cl-head ' + (simple ? 'simple' : '')}>
          <SortHeader label="Roadway" field="roadway" sort={sort} setSort={setSort} />
          <SortHeader label="Reason" field="reason" sort={sort} setSort={setSort} />
          <SortHeader label="Status" field="status" sort={sort} setSort={setSort} />
          <SortHeader label="Incident Count" field="count" sort={sort} setSort={setSort} align="right" />
          <SortHeader label="%" field="pct" sort={sort} setSort={setSort} align="right" />
        </div>
        <div className="cl-scroll">
          {rows.map((row, i) => {
            const w = row.count / max * 100;
            return (
              <div key={i} className={'cl-row ' + (simple ? 'simple' : '')}>
                <div className="mono">{row.roadway}</div>
                <div>{row.reason}</div>
                <div>
                  <span className={'st ' + (row.status === 'Completed' ? 'st-cleared' : 'st-open')}>
                    {row.status}
                  </span>
                </div>
                <div className="ar mono">{row.count.toLocaleString()}</div>
                <div className="ar mono">{row.pct.toFixed(1)}%</div>
                <div className="cl-bar"><span style={{ width: w + '%' }} /></div>
              </div>);

          })}
        </div>
      </div>);

  }

  // ── Workflow timeline — avg/median/p90 bar chart ──────────────────────────
  function WorkflowTimeline({ data, showP90 = true }) {
    const max = Math.max(...data.flatMap((d) => [d.avg, d.median, d.p90 || 0]));
    return (
      <div className="wf-list">
        {data.map((s, i) =>
        <div key={i} className="wf-row">
            <div className="wf-stage">
              <span className="wf-num">{i + 1}</span>
              <span>{s.stage}</span>
            </div>
            <div className="wf-bars">
              <div className="wf-bar-row">
                <span className="wf-bar-label">avg</span>
                <div className="wf-bar"><div className="wf-fill avg" style={{ width: s.avg / max * 100 + '%' }}>
                  <span className="wf-val">{s.avg}m</span>
                </div></div>
              </div>
              <div className="wf-bar-row">
                <span className="wf-bar-label">median</span>
                <div className="wf-bar"><div className="wf-fill med" style={{ width: s.median / max * 100 + '%' }}>
                  <span className="wf-val">{s.median}m</span>
                </div></div>
              </div>
              {showP90 && s.p90 != null &&
            <div className="wf-bar-row">
                  <span className="wf-bar-label">p90</span>
                  <div className="wf-bar"><div className="wf-fill p90" style={{ width: s.p90 / max * 100 + '%' }}>
                    <span className="wf-val">{s.p90}m</span>
                  </div></div>
                </div>
            }
            </div>
          </div>
        )}
      </div>);

  }

  // ── Reminder reset frequency & duration chart ─────────────────────────────
  function ReminderTiming({ data, defaultReminder }) {
    const [sort, setSort] = useState({ field: 'resets', dir: 'desc' });
    const maxResets = Math.max(...data.map((d) => d.resets));
    const maxDur = Math.max(...data.map((d) => d.avgResetMin));
    const rows = sortRows(data, sort);
    return (
      <div className="rem-table">
        <div className="rem-default-note">
          Agency default reminder: <b>{defaultReminder} min</b>
          <span className="muted small"> · applies to all incident types</span>
        </div>
        <div className="rem-head">
          <SortHeader label="Incident type" field="type" sort={sort} setSort={setSort} />
          <SortHeader label="Number of resets" field="resets" sort={sort} setSort={setSort} align="right" />
          <SortHeader label="Avg reset duration" field="avgResetMin" sort={sort} setSort={setSort} />
        </div>
        {rows.map((r, i) => {
          const resetsPct = r.resets / maxResets * 100;
          const durPct = r.avgResetMin / maxDur * 100;
          return (
            <div key={i} className="rem-row">
              <div>{r.type}</div>
              <div className="ar mono">
                <div className="rem-resets-bar">
                  <span style={{ width: resetsPct + '%' }} />
                </div>
                <b>{r.resets.toLocaleString()}</b>
              </div>
              <div className="rem-bar">
                <span className="rem-action bad" style={{ width: durPct + '%' }} />
                <span className="rem-delta neutral">{r.avgResetMin}m</span>
              </div>
            </div>);

        })}
      </div>);

  }

  // ── Resets per incident (avg resets + snooze, by type) ────────────────────
  function ResetsPerIncident({ data }) {
    const [sort, setSort] = useState({ field: 'avgResets', dir: 'desc' });
    const rows = sortRows(data, sort);
    const maxResets = Math.max(...data.map((d) => d.avgResets));
    return (
      <div className="reset-list">
        <div className="reset-head">
          <SortHeader label="Incident type" field="type" sort={sort} setSort={setSort} />
          <SortHeader label="Resets / incident" field="avgResets" sort={sort} setSort={setSort} align="right" />
          <SortHeader label="Avg snooze" field="avgSnoozeMin" sort={sort} setSort={setSort} align="right" />
          <SortHeader label="Incidents" field="incidents" sort={sort} setSort={setSort} align="right" />
        </div>
        {rows.map((row, i) =>
        <div key={i} className="reset-row">
            <div className="reset-type">{row.type}</div>
            <div className="reset-resets">
              <div className="reset-bar">
                <div style={{ width: row.avgResets / maxResets * 100 + '%' }} />
              </div>
              <b className="mono">{row.avgResets.toFixed(2)}</b>
            </div>
            <div className="ar mono"><b>{row.avgSnoozeMin < 60 ? row.avgSnoozeMin + 'min' : row.avgSnoozeMin / 60 + 'hr'}</b></div>
            <div className="ar mono"><b>{row.incidents.toLocaleString()}</b></div>
          </div>
        )}
      </div>);

  }

  // ── Agency Dashboard ──────────────────────────────────────────────────────
  function AgencyDashboard() {
    const [filters, setFilters] = useState({
      'Date range': 'Last 90 days',
      'Time of day': { start: '00:00', end: '23:59' },
      'Workspace': ['All'],
      'Incident type': ['All'],
      'Incident subtype': ['All']
    });
    const options = {
      'Date range': ['Last 7 days', 'Last 30 days', 'Last 90 days', 'Last 12 months', 'All time', 'Custom…'],
      'Workspace': ['All', ...RekorPerf.workspaces],
      'Incident type': ['All', ...RekorPerf.incidentTypes],
      'Incident subtype': ['All', ...RekorPerf.allSubtypes]
    };
    const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
    const reset = () => setFilters({ 'Date range': 'Last 90 days', 'Time of day': { start: '00:00', end: '23:59' }, 'Workspace': ['All'], 'Incident type': ['All'], 'Incident subtype': ['All'] });

    // True if a multi-select filter is narrowed (i.e., not 'All')
    const narrowed = (arr) => Array.isArray(arr) && !arr.includes('All') && arr.length > 0;
    const sel = (arr) => Array.isArray(arr) ? arr.filter((v) => v !== 'All') : [];

    // Synthetic narrowing
    const m = useMemo(() => {
      let mul = 1;
      if (filters['Date range'].includes('7 days')) mul *= 0.05;
      if (filters['Date range'].includes('30 days')) mul *= 0.15;
      if (filters['Date range'].includes('90 days')) mul *= 0.4;
      if (filters['Date range'].includes('12 months')) mul *= 1;
      if (!isFullDay(filters['Time of day'])) {
        const t = filters['Time of day'];
        const startM = parseInt(t.start.split(':')[0], 10) * 60 + parseInt(t.start.split(':')[1] || '0', 10);
        const endM = parseInt(t.end.split(':')[0], 10) * 60 + parseInt(t.end.split(':')[1] || '0', 10);
        const span = Math.max(1, Math.min(24 * 60, (endM - startM + 24 * 60) % (24 * 60) || 24 * 60));
        mul *= Math.max(0.05, span / (24 * 60));
      }
      if (narrowed(filters['Workspace'])) mul *= 0.28 + 0.18 * (sel(filters['Workspace']).length - 1);
      if (narrowed(filters['Incident type'])) mul *= 0.16 + 0.18 * (sel(filters['Incident type']).length - 1);
      if (narrowed(filters['Incident subtype'])) mul *= 0.35 + 0.18 * (sel(filters['Incident subtype']).length - 1);
      return Math.min(mul, 1);
    }, [filters]);

    const k = RekorPerf.agencyKPIs;
    const kpis = {
      confirmation: { ...k.confirmationRate,
        num: Math.round(k.confirmationRate.num * m),
        den: Math.round(k.confirmationRate.den * m) },
      rejection: { ...k.rejectionRate,
        num: Math.round(k.rejectionRate.num * m),
        den: Math.round(k.rejectionRate.den * m) },
      completion: { ...k.completionRate,
        num: Math.round(k.completionRate.num * m),
        den: Math.round(k.completionRate.den * m) }
    };

    // Highlighted timing/count metrics. The avg/median values themselves are
    // not scaled by the filter `m` (they are distributional, not volumetric);
    // we only nudge them slightly based on time-of-day narrowing, and we do
    // scale the underlying sample counts.
    const todMul = isFullDay(filters['Time of day']) ? 1 : 1.08; // off-peak shifts skew slower

    // "Vs previous period" deltas — always shown at the agency level. The
    // delta magnitude responds to every active filter: shorter and narrower
    // selections are noisier comparisons.
    const deltaAdj = useMemo(() => {
      let a = 1;
      const dr = filters['Date range'];
      if (dr.includes('7 days')) a *= 1.45;else
      if (dr.includes('30 days')) a *= 1.2;else
      if (dr.includes('12 months')) a *= 0.75;else
      if (dr === 'All time') a *= 0.6;
      if (!isFullDay(filters['Time of day'])) a *= 1.18;
      if (narrowed(filters['Workspace'])) a *= 1.1;
      if (narrowed(filters['Incident type'])) a *= 1.12;
      if (narrowed(filters['Incident subtype'])) a *= 1.08;
      return a;
    }, [filters]);

    const periodLabel = useMemo(() => {
      const dr = filters['Date range'];
      if (dr.startsWith('Last ')) return 'prior ' + dr.replace('Last ', '');
      if (dr === 'All time') return 'prior period';
      return 'prior period of equal length';
    }, [filters]);

    const dlt = (base) => +(base * deltaAdj).toFixed(1);

    const cd = k.confirmationDelay;
    const uf = k.updateFrequency;
    const delayKpi = {
      avg: +(cd.avg * todMul).toFixed(1),
      median: +(cd.median * todMul).toFixed(1),
      sample: Math.round(cd.sample * m),
      p90: +(cd.p90 * todMul).toFixed(1)
    };
    const updateKpi = {
      avg: uf.avg,
      median: uf.median,
      totalUpdates: Math.round(uf.totalUpdates * m),
      incidents: Math.round(uf.incidents * m)
    };

    // Per-shift breakdown also scales sample counts by `m`
    const shiftDelay = RekorPerf.creationToConfirmationByShift.map((s) => ({
      ...s,
      confirmed: Math.round(s.confirmed * m),
      delta: +(s.delta * deltaAdj).toFixed(1)
    }));

    const noData = m < 0.0001 || sel(filters['Incident type']).includes('Wrong way') && sel(filters['Incident subtype']).includes('Ramp') && sel(filters['Workspace']).includes('Route 5');

    return (
      <>
        <FilterStrip filters={filters} options={options} onChange={setF} onReset={reset} />

        {noData ?
        <div className="no-data">
            <div className="no-data-icon">∅</div>
            <h3>No available data</h3>
            <p>The current filter combination has no recorded incidents in the selected window.</p>
            <button className="btn ghost" onClick={reset}>Reset filters</button>
          </div> :

        <>
            {/* Row 1 — rate cards */}
            <div className="grid grid-12">
              <div className="span-4"><RateCard title="Incident Confirmation Rate"
              info="Confirmed incidents ÷ total incidents."
              kpi={kpis.confirmation} color="#16A34A"
              delta={dlt(k.confirmationRate.delta)} periodLabel={periodLabel} /></div>
              <div className="span-4"><RateCard title="Incident Rejection Rate"
              info="Rejected incidents ÷ total incidents."
              kpi={kpis.rejection} color="#DC2626"
              delta={dlt(k.rejectionRate.delta)} invert={true} periodLabel={periodLabel} /></div>
              <div className="span-4"><RateCard title="Incident Completion Rate"
              info="Completed incidents ÷ confirmed."
              kpi={kpis.completion} color="var(--accent)"
              delta={dlt(k.completionRate.delta)} periodLabel={periodLabel} /></div>
            </div>

            {/* Row 2 — new highlighted timing / activity metrics */}
            <div className="grid grid-12">
              <div className="span-6">
                <MetricCard
                  title="Creation → Confirmation Lead Time"
                  info="Time between an incident being created in Command and an operator confirming it. Includes only confirmed incidents."
                  kpi={delayKpi}
                  unit="min"
                  color="var(--accent)"
                  barPct={Math.min(100, delayKpi.avg / 5 * 100)}
                  context={{ value: delayKpi.p90.toFixed(1) + ' min', label: 'p90' }}
                  delta={delayKpi.avg - delayKpi.avg / (1 + dlt(cd.delta) / 100)}
                  deltaUnit=" min" deltaDecimals={2} invert={true} periodLabel={periodLabel} />
              </div>
              <div className="span-6">
                <MetricCard
                  title="Update Frequency"
                  info="Average number of status / note updates an operator posts on a confirmed incident over its lifetime."
                  kpi={updateKpi}
                  unit=""
                  color="#9333EA"
                  barPct={Math.min(100, updateKpi.avg / 8 * 100)}
                  fmt={(v) => v.toFixed(1)}
                  context={{ value: updateKpi.totalUpdates.toLocaleString(), label: 'updates posted' }}
                  delta={updateKpi.avg - updateKpi.avg / (1 + dlt(uf.delta) / 100)}
                  deltaUnit="" deltaDecimals={1} periodLabel={periodLabel} />
              </div>
            </div>

            {/* Row 3 — per-shift breakdown of creation→confirmation delay */}
            <div className="grid grid-12">
              <Card className="span-12" title="Creation → Confirmation Lead Time by Shift"
              info="Side-by-side comparison of how quickly operators on each shift confirm new incidents.">
                <ShiftDelayCompare data={shiftDelay} periodLabel={periodLabel} />
              </Card>
            </div>

            {/* Row 4 — workflow timeline + closure reasons */}
            <div className="grid grid-12">
              <Card className="span-6" title="Incident Workflow Timeline"
            info="Time between stage transitions across all confirmed incidents.">
                <WorkflowTimeline data={RekorPerf.workflow} showP90={false} />
                <div className="wf-legend">
                  <span><i className="dot avg" /> Average</span>
                  <span><i className="dot med" /> Median</span>
                </div>
              </Card>
              <Card className="span-6" title="Event Closure Reasons"
            info="Reason a confirmed incident was marked complete.">
                <ClosureReasonsTable
                data={!narrowed(filters['Workspace']) ?
                RekorPerf.closureReasons :
                RekorPerf.closureReasons.filter((r) => sel(filters['Workspace']).includes(r.roadway))} />
              </Card>
            </div>

            {/* Row 3 — reminders */}
            <div className="grid grid-12">
              <Card className="span-12" title="Reminder Resets per Incident"
            info="Average number of times an operator snoozed the default reminder, by incident type.">
                <ResetsPerIncident data={RekorPerf.remindersByType} />
              </Card>
            </div>
          </>
        }
      </>);

  }

  // ── Operator bar chart — configurable metric across selected operators ───
  // `deltaKey` maps a metric to the operator's period-over-period delta used
  // by the "Vs previous period" comparison. `invert: true` marks metrics
  // where a decrease is an improvement (times, rejection).
  const OP_METRICS = [
  { key: 'confirmTime', label: 'Confirm time', unit: 'm', color: '#2563EB', accessor: (o) => o.confirmTime, fmt: (v) => +v.toFixed(1) + 'm', deltaKey: 'confirmTime', invert: true },
  { key: 'avgUpdates', label: 'Avg updates / inc', unit: '', color: '#9333EA', accessor: (o) => o.avgUpdates, fmt: (v) => v.toFixed(1), deltaKey: 'avgUpdates' },
  { key: 'completion', label: 'Completion rate', unit: '%', color: '#16A34A', accessor: (o) => o.completion, fmt: (v) => +v.toFixed(1) + '%', deltaKey: 'completion' },
  { key: 'rejection', label: 'Rejection rate', unit: '%', color: '#DC2626', accessor: (o) => o.rejection, fmt: (v) => +v.toFixed(1) + '%', deltaKey: 'rejection', invert: true },
  { key: 'avgPerShift', label: 'Avg handled / shift', unit: '', color: '#F58220', accessor: (o) => Math.round(o.handled / o.scheduledDays), fmt: (v) => Math.round(v).toLocaleString(), deltaKey: 'handled' }];


  function OperatorBarChart({ data, selectedId, onSelect, compareAdj = 1, periodLabel = 'prior period' }) {
    const [metricKey, setMetricKey] = useState('confirmTime');
    const [compare, setCompare] = useState(false);
    const metric = OP_METRICS.find((m) => m.key === metricKey);

    // Previous-period value, derived from this operator's period-over-period
    // delta for the chosen metric. `compareAdj` scales the delta magnitude
    // based on the active filters (date range, time of day, incident type,
    // subtype, operator, shift) — narrower selections are noisier.
    const prevOf = (o) => {
      const delta = (o.variance[metric.deltaKey] || 0) * compareAdj;
      return metric.accessor(o) / (1 + delta / 100);
    };

    const rows = data.map((o) => ({
      op: o,
      v: metric.accessor(o),
      pv: compare ? prevOf(o) : null
    }));
    const vals = rows.flatMap((r) => r.pv != null ? [r.v, r.pv] : [r.v]);
    const maxV = Math.max(...vals, 0);
    const yMax = maxV === 0 ? 1 : maxV * 1.15;

    const W = 1100,H = 260;
    const PAD = { l: 56, r: 16, t: 18, b: 64 };
    const innerW = W - PAD.l - PAD.r;
    const innerH = H - PAD.t - PAD.b;
    const zeroY = PAD.t + innerH;
    const barW = Math.max(14, Math.min(56, innerW / Math.max(rows.length, 1) - 8));
    const step = innerW / Math.max(rows.length, 1);

    const yToPx = (v) => PAD.t + innerH - v / yMax * innerH;

    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => +(t * yMax).toFixed(2));

    const niceVal = (v) => {
      if (Math.abs(v) >= 100) return Math.round(v);
      if (Math.abs(v) >= 10) return Math.round(v * 10) / 10;
      return Math.round(v * 100) / 100;
    };

    const [hover, setHover] = useState(null);

    return (
      <div className="op-bar-chart">
        <div className="op-bar-toolbar">
          <span className="op-bar-toolbar-label">METRIC TYPE</span>
          <div className="op-bar-metrics">
            {OP_METRICS.map((m) =>
            <button key={m.key}
            className={'op-bar-metric ' + (metricKey === m.key ? 'on' : '')}
            style={metricKey === m.key ? { '--m': m.color, color: m.color, borderColor: m.color, background: 'color-mix(in oklab, ' + m.color + ' 12%, var(--card))' } : null}
            onClick={() => setMetricKey(m.key)}>
                <span className="op-bar-swatch" style={{ background: m.color }} />
                {m.label}
              </button>
            )}
          </div>
          <button
          className={'op-bar-compare ' + (compare ? 'on' : '')}
          title={'Overlay each operator\u2019s value from the ' + periodLabel + ', respecting all active filters.'}
          onClick={() => setCompare((c) => !c)}>
            <span className="op-bar-compare-ic">⇄</span>
            Vs previous period
          </button>
          <span className="op-bar-x-info muted small">{data.length} operator{data.length === 1 ? '' : 's'}</span>
        </div>

        {compare &&
        <div className="op-bar-legend">
            <span><i className="op-bar-leg-sw" style={{ background: metric.color }} /> Selected period</span>
            <span><i className="op-bar-leg-sw prev" /> Previous period <span className="muted">({periodLabel})</span></span>
          </div>
        }

        {rows.length === 0 ?
        <div className="op-bar-empty">No operators match the current filters.</div> :

        <div className="op-bar-svg-wrap">
            <svg viewBox={`0 0 ${W} ${H}`} className="op-bar-svg" preserveAspectRatio="none">
              {/* y gridlines + labels */}
              {ticks.map((t, i) =>
            <g key={i}>
                  <line x1={PAD.l} x2={W - PAD.r} y1={yToPx(t)} y2={yToPx(t)}
              stroke="var(--grid)" strokeWidth="1"
              strokeDasharray={t === 0 ? '0' : '3 3'} />
                  <text x={PAD.l - 8} y={yToPx(t) + 4} textAnchor="end"
              className="chart-axis-label">
                    {metric.fmt(niceVal(t))}
                  </text>
                </g>
            )}

              {/* bars */}
              {rows.map((r, i) => {
              const cx = PAD.l + step * (i + 0.5);
              const isOn = selectedId === r.op.id;
              const isHover = hover === r.op.id;
              const hasPrev = r.pv != null;
              const subW = hasPrev ? Math.max(6, barW / 2 - 1) : barW;
              const xCur = hasPrev ? cx + 1 : cx - barW / 2;
              const xPrev = cx - 1 - subW;
              const yCur = yToPx(r.v);
              const hCur = Math.max(1, zeroY - yCur);
              const yPrev = hasPrev ? yToPx(r.pv) : zeroY;
              const hPrev = hasPrev ? Math.max(1, zeroY - yPrev) : 0;
              const groupTop = Math.min(yCur, yPrev);
              const deltaPct = hasPrev ? (r.v - r.pv) / r.pv * 100 : 0;
              const deltaAbs = hasPrev ? r.v - r.pv : 0;
              const good = metric.invert ? deltaPct < 0 : deltaPct > 0;
              const deltaColor = Math.abs(deltaPct) < 0.05 ? 'var(--text-3)' : good ? '#16A34A' : '#DC2626';
              return (
                <g key={r.op.id}
                onMouseEnter={() => setHover(r.op.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect && onSelect(r.op.id)}
                style={{ cursor: 'pointer' }}>
                    {hasPrev &&
                  <rect x={xPrev} y={yPrev} width={subW} height={hPrev}
                  rx="2" ry="2"
                  fill="var(--text-4)"
                  opacity={isOn ? 0.75 : isHover ? 0.65 : 0.5} />
                  }
                    <rect x={xCur} y={yCur} width={subW} height={hCur}
                  rx="2" ry="2"
                  fill={metric.color}
                  opacity={isOn ? 1 : isHover ? 0.92 : 0.78} />
                    {isOn &&
                  <rect x={(hasPrev ? xPrev : xCur) - 2} y={groupTop - 2}
                  width={(hasPrev ? subW * 2 + 2 : subW) + 4}
                  height={zeroY - groupTop + 4}
                  rx="3" ry="3"
                  fill="none" stroke={metric.color} strokeWidth="2" />
                  }
                    <text x={cx} y={groupTop - 6} textAnchor="middle"
                  className="op-bar-val"
                  fill={isOn || isHover ? metric.color : 'var(--text-2)'}>
                      {metric.fmt(r.v)}
                      {hasPrev &&
                    <tspan fill={deltaColor} className="op-bar-delta">
                          {' ' + (deltaPct > 0.05 ? '▲' : deltaPct < -0.05 ? '▼' : '–') + metric.fmt(Math.abs(deltaAbs))}
                        </tspan>
                    }
                    </text>
                    {/* x label — rotated operator initials/name */}
                    <text x={cx} y={zeroY + 14}
                  textAnchor="end"
                  className="chart-axis-label op-bar-xlabel"
                  transform={`rotate(-35 ${cx} ${zeroY + 14})`}>
                      {r.op.name}
                    </text>
                  </g>);

            })}

              {/* baseline */}
              <line x1={PAD.l} x2={W - PAD.r} y1={zeroY} y2={zeroY}
            stroke="var(--border)" strokeWidth="1" />
            </svg>
          </div>
        }
      </div>);

  }

  // ── Operator Dashboard ────────────────────────────────────────────────────
  function OperatorDashboard() {
    const [filters, setFilters] = useState({
      'Date range': 'Last 90 days',
      'Time of day': { start: '00:00', end: '23:59' },
      'Incident type': ['All'],
      'Incident subtype': ['All'],
      'Operator': ['All'],
      'Shift': ['All']
    });
    const options = {
      'Date range': ['Last 7 days', 'Last 30 days', 'Last 90 days', 'Last 12 months', 'All time', 'Custom…'],
      'Incident type': ['All', ...RekorPerf.incidentTypes],
      'Incident subtype': ['All', ...RekorPerf.allSubtypes],
      'Operator': ['All', ...RekorPerf.operators.map((o) => o.name)],
      'Shift': ['All', ...RekorPerf.shifts]
    };
    const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
    const reset = () => setFilters({ 'Date range': 'Last 90 days', 'Time of day': { start: '00:00', end: '23:59' }, 'Incident type': ['All'], 'Incident subtype': ['All'], 'Operator': ['All'], 'Shift': ['All'] });

    const narrowed = (arr) => Array.isArray(arr) && !arr.includes('All') && arr.length > 0;
    const sel = (arr) => Array.isArray(arr) ? arr.filter((v) => v !== 'All') : [];

    const [selectedId, setSelectedId] = useState(RekorPerf.operators[0].id);

    // Filtered roster
    const roster = useMemo(() => {
      const shiftSel = sel(filters['Shift']);
      const opSel = sel(filters['Operator']);
      return RekorPerf.operators.filter((o) => {
        if (narrowed(filters['Shift']) && !shiftSel.some((s) => o.shift.startsWith(s.split(' ')[0]))) return false;
        if (narrowed(filters['Operator']) && !opSel.includes(o.name)) return false;
        return true;
      });
    }, [filters]);

    // Selection: if current pick is filtered out, snap to first available operator
    React.useEffect(() => {
      if (roster.length && !roster.find((o) => o.id === selectedId)) {
        setSelectedId(roster[0].id);
      }
    }, [roster, selectedId]);

    const selected = roster.find((o) => o.id === selectedId);

    // "Vs previous period" comparison — the delta magnitude responds to every
    // active filter (date range, time of day, incident type / subtype,
    // operator, shift): shorter and narrower selections are noisier.
    const compareAdj = useMemo(() => {
      let a = 1;
      const dr = filters['Date range'];
      if (dr.includes('7 days')) a *= 1.45;else
      if (dr.includes('30 days')) a *= 1.2;else
      if (dr.includes('12 months')) a *= 0.75;else
      if (dr === 'All time') a *= 0.6;
      if (!isFullDay(filters['Time of day'])) a *= 1.18;
      if (narrowed(filters['Incident type'])) a *= 1.12;
      if (narrowed(filters['Incident subtype'])) a *= 1.08;
      if (narrowed(filters['Shift'])) a *= 1.06;
      if (narrowed(filters['Operator'])) a *= 1.04;
      return a;
    }, [filters]);

    const periodLabel = useMemo(() => {
      const dr = filters['Date range'];
      if (dr.startsWith('Last ')) return 'prior ' + dr.replace('Last ', '');
      if (dr === 'All time') return 'prior period';
      return 'prior period of equal length';
    }, [filters]);

    // Sort state
    const [opSort, setOpSort] = useState({ field: 'handled', dir: 'desc' });
    const sortedRoster = useMemo(() => {
      const f = opSort.field;
      const accessor = (o) => {
        if (f === 'name') return o.name;
        if (f === 'avgPerShift') return o.handled / o.scheduledDays;
        if (f === 'variance') return o.variance.handled;
        return o[f];
      };
      const m = opSort.dir === 'asc' ? 1 : -1;
      return roster.slice().sort((a, b) => {
        const av = accessor(a),bv = accessor(b);
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * m;
        return String(av).localeCompare(String(bv)) * m;
      });
    }, [roster, opSort]);

    const varianceClass = (v) => v > 5 ? 'good' : v < -5 ? 'bad' : 'neutral';
    const varianceArrow = (v) => v > 0 ? '▲' : v < 0 ? '▼' : '–';

    return (
      <>
        <FilterStrip filters={filters} options={options} onChange={setF} onReset={reset} />

        {/* Per-operator metric bar chart */}
        <Card title="Operator metrics"
        info="Visualize any operator metric across the operators in the current filter. Y-axis is the chosen metric; X-axis is selected operators. Toggle 'Vs previous period' to overlay each operator's value from the immediately prior period, respecting all active filters. Click a bar to drill into that operator below.">
          <OperatorBarChart data={roster} selectedId={selectedId} onSelect={setSelectedId}
          compareAdj={compareAdj} periodLabel={periodLabel} />
        </Card>

        {/* Roster + drill-down split */}
        <div className="op-split">
          {/* Roster table */}
          <Card title="Operators" className="op-roster"
          actions={<span className="muted small">{roster.length} of {RekorPerf.operators.length}</span>}>
            <div className="op-table">
              <div className="op-table-head">
                <SortHeader label="Operator" field="name" sort={opSort} setSort={setOpSort} />
                <SortHeader label="Handled" field="handled" sort={opSort} setSort={setOpSort} align="right" />
                <SortHeader label="% of all" field="pctOfAll" sort={opSort} setSort={setOpSort} align="right" />
                <SortHeader label="Confirm time" field="confirmTime" sort={opSort} setSort={setOpSort} align="right" />
                <SortHeader label="Avg updates / inc" field="avgUpdates" sort={opSort} setSort={setOpSort} align="right" />
                <SortHeader label="Completion rate" field="completion" sort={opSort} setSort={setOpSort} align="right" />
                <SortHeader label="Rejection rate" field="rejection" sort={opSort} setSort={setOpSort} align="right" />
                <SortHeader label="Avg handled per shift" field="avgPerShift" sort={opSort} setSort={setOpSort} align="right" />
                <SortHeader label="Vs previous period" field="variance" sort={opSort} setSort={setOpSort} align="right" />
              </div>
              <div className="op-table-body">
                {sortedRoster.map((o) =>
                <button key={o.id}
                className={'op-table-row ' + (selected?.id === o.id ? 'on' : '')}
                onClick={() => setSelectedId(o.id)}>
                    <div className="op-cell">
                      <div className="avatar">{o.name.split(' ').map((p) => p[0]).join('')}</div>
                      <div>
                        <div>{o.name}</div>
                        <div className="muted small">{o.shift} · {o.workspace}</div>
                      </div>
                    </div>
                    <div className="ar mono">{o.handled.toLocaleString()}</div>
                    <div className="ar mono">{o.pctOfAll}%</div>
                    <div className="ar mono">{o.confirmTime}m</div>
                    <div className="ar mono">{o.avgUpdates}</div>
                    <div className="ar mono">{o.completion}%</div>
                    <div className="ar mono">{o.rejection}%</div>
                    <div className="ar mono">{Math.round(o.handled / o.scheduledDays)}</div>
                    <div className={'ar variance ' + varianceClass(o.variance.handled)}>
                      {varianceArrow(o.variance.handled)} {Math.abs(o.variance.handled)}%
                    </div>
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Drill-down */}
          {selected &&
          <aside className="op-drill">
              <div className="op-drill-head">
                <div className="avatar lg">{selected.name.split(' ').map((p) => p[0]).join('')}</div>
                <div>
                  <div className="op-drill-name">{selected.name}</div>
                  <div className="muted small">{selected.shift} · {selected.workspace}</div>
                </div>
                <span className={'st ' + (selected.status === 'On shift' ? 'st-cleared' : selected.status === 'Break' ? 'st-pending' : 'st-open')}>{selected.status}</span>
              </div>

              {/* Mini KPI grid */}
              <div className="op-kpis">
                {[
              { label: 'Incidents handled', value: selected.handled.toLocaleString(), v: selected.variance.handled },
              { label: '% of all', value: selected.pctOfAll + '%' },
              { label: 'Avg updates / inc', value: selected.avgUpdates, v: selected.variance.avgUpdates },
              { label: 'Confirm time', value: selected.confirmTime + 'm', v: -selected.variance.confirmTime },
              { label: 'Completion rate', value: selected.completion + '%', v: selected.variance.completion },
              { label: 'Rejection rate', value: selected.rejection + '%', v: -selected.variance.rejection },
              { label: 'Avg handled per shift', value: Math.round(selected.handled / selected.scheduledDays), v: selected.variance.handled }].
              map((k, i) =>
              <div key={i} className="op-kpi">
                    <div className="op-kpi-label">{k.label}</div>
                    <div className="op-kpi-row">
                      <div className="op-kpi-val">{k.value}</div>
                      {k.v != null &&
                  <div className={'op-kpi-var ' + varianceClass(k.v)}>
                          {varianceArrow(k.v)} {Math.abs(k.v)}%
                        </div>
                  }
                    </div>
                  </div>
              )}
              </div>

              <div className="op-section-head">Incidents handled, by type</div>
              <div className="hbar">
                {selected.byType.slice().sort((a, b) => b.count - a.count).map((t, i) => {
                const max = Math.max(...selected.byType.map((x) => x.count));
                return (
                  <div key={i} className="hbar-row">
                      <div className="hbar-label">{t.type}</div>
                      <div className="hbar-track"><div className="hbar-fill" style={{ width: t.count / max * 100 + '%' }} /></div>
                      <div className="hbar-value">{t.count.toLocaleString()}</div>
                    </div>);

              })}
              </div>

              <div className="op-section-head" title="When this operator dismisses a reminder for the given incident type, this is the snooze duration they pick most often.">
                Preferred reminder duration by incident type
              </div>
              <div className="rem-pref-grid">
                {selected.reminderPref.map((p, i) =>
              <div key={i} className="rem-pref">
                    <div className="rem-pref-type">{p.type}</div>
                    <div className="rem-pref-value">
                      <span className="rem-pref-num">{p.preferred}</span>
                      <span className="rem-pref-unit">min</span>
                    </div>
                    <div className="rem-pref-cap">most-picked snooze</div>
                  </div>
              )}
              </div>

              <div className="op-section-head">Workflow timeline (this operator)</div>
              <WorkflowTimeline data={selected.workflow} showP90={false} />

              <div className="op-section-head">Event closure reasons</div>
              <ClosureReasonsTable data={selected.closures} simple={true} />
            </aside>
          }
        </div>
      </>);

  }

  // ── Shifts admin settings ─────────────────────────────────────────────────
  function ShiftsAdmin() {
    const [shifts, setShifts] = React.useState(RekorPerf.shiftsConfig);
    const [drawer, setDrawer] = React.useState(null); // null | shift | 'new'
    const [draft, setDraft] = React.useState(null);

    const openNew = () => {
      setDraft({ id: 's' + Date.now(), name: '', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], start: '08:00', end: '16:00', color: '#2563EB' });
      setDrawer('new');
    };
    const openEdit = (s) => {setDraft({ ...s });setDrawer(s);};
    const save = () => {
      if (!draft.name) return;
      setShifts((prev) => {
        const exists = prev.find((p) => p.id === draft.id);
        return exists ? prev.map((p) => p.id === draft.id ? draft : p) : [...prev, draft];
      });
      setDrawer(null);setDraft(null);
    };
    const remove = (id) => setShifts((prev) => prev.filter((p) => p.id !== id));

    const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <>
        <div className="page-head" style={{ marginTop: 0 }}>
          <div>
            <h1 style={{ margin: 0 }}>Working hours</h1>
            <p className="muted" style={{ margin: '4px 0 0' }}>Define recurring operator shifts to power roster reporting and the Operational Performance dashboard.</p>
          </div>
          <div className="page-actions">
            <button className="btn primary" onClick={openNew}>+ Add shift</button>
          </div>
        </div>

        <div className="shift-grid">
          {shifts.map((s) =>
          <div key={s.id} className="shift-card">
              <div className="shift-card-head">
                <span className="shift-swatch" style={{ background: s.color }} />
                <b>{s.name}</b>
                <div className="shift-card-actions">
                  <button className="iconbtn" onClick={() => openEdit(s)} title="Edit">✎</button>
                  <button className="iconbtn" onClick={() => remove(s.id)} title="Delete">×</button>
                </div>
              </div>
              <div className="shift-meta">
                <span>{s.start}</span>
                <span className="muted">→</span>
                <span>{s.end}</span>
              </div>
              <div className="shift-days">
                {allDays.map((d) =>
              <span key={d} className={'shift-day ' + (s.days.includes(d) ? 'on' : '')}>{d[0]}</span>
              )}
              </div>
              <div className="shift-stats">
                <div><b>{s.days.length}</b><span>days / week</span></div>
                <div><b>{s.days.length * 5}</b><span>shifts / wk</span></div>
              </div>
            </div>
          )}
          <button className="shift-card add" onClick={openNew}>
            <span>+</span>
            <b>Add shift</b>
            <span className="muted small">Days · start · end</span>
          </button>
        </div>

        {drawer && draft &&
        <>
            <div className="drawer-mask" onClick={() => setDrawer(null)} />
            <aside className="drawer">
              <header className="drawer-head">
                <h2>{drawer === 'new' ? 'New shift' : 'Edit shift'}</h2>
                <button className="iconbtn" onClick={() => setDrawer(null)}>×</button>
              </header>
              <div className="drawer-body">
                <div className="fld">
                  <label>Name</label>
                  <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Day, Mid, Night, Game-day" />
                </div>
                <div className="fld-row">
                  <div className="fld">
                    <label>Start</label>
                    <input type="time" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
                  </div>
                  <div className="fld">
                    <label>End</label>
                    <input type="time" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
                  </div>
                </div>
                <div className="fld">
                  <label>Days of the week</label>
                  <div className="day-picker">
                    {allDays.map((d) =>
                  <button key={d}
                  className={'day-chip ' + (draft.days.includes(d) ? 'on' : '')}
                  onClick={() => {
                    const has = draft.days.includes(d);
                    setDraft({ ...draft, days: has ? draft.days.filter((x) => x !== d) : [...draft.days, d] });
                  }}>
                        {d}
                      </button>
                  )}
                  </div>
                </div>
                <div className="fld">
                  <label>Color</label>
                  <div className="color-row">
                    {['#2563EB', '#16A34A', '#9333EA', '#F58220', '#DC2626', '#0891B2'].map((c) =>
                  <button key={c} className={'color-sw ' + (draft.color === c ? 'on' : '')}
                  style={{ background: c }}
                  onClick={() => setDraft({ ...draft, color: c })} />
                  )}
                  </div>
                </div>
              </div>
              <footer className="drawer-foot">
                <button className="btn ghost" onClick={() => setDrawer(null)}>Cancel</button>
                <button className="btn primary" onClick={save}>Save shift</button>
              </footer>
            </aside>
          </>
        }
      </>);

  }

  return { AgencyDashboard, OperatorDashboard, ShiftsAdmin };
})();

window.PerfPage = PerfPage;