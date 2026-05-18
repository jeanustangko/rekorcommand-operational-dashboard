// Chart primitives for the Rekor Command Data Hub prototype.
// All inline SVG — light, fast, designed to match the QuickSight-style aesthetic
// (axis labels in muted gray, no chart-junk, single primary blue, hover details).

const fmt = (n) => {
  if (n == null) return '';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.?0+$/, '') + 'K';
  return String(n);
};
const fmtFull = (n) => (n == null ? '' : n.toLocaleString());
const monthShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = (d) => `${monthShort[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;

// ─────────────────────────────────────────────────────────────────────────────
// Line chart (Incidents Over Time)
// ─────────────────────────────────────────────────────────────────────────────
function LineChart({ data, height = 240, color = 'var(--accent)' }) {
  const W = 1100, H = height;
  const PAD = { l: 50, r: 16, t: 14, b: 36 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const max = Math.max(...data.map(d => d.value));
  const yMax = Math.ceil(max / 10000) * 10000;
  const xs = (i) => PAD.l + (i / (data.length - 1)) * innerW;
  const ys = (v) => PAD.t + (1 - v / yMax) * innerH;

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(2)},${ys(d.value).toFixed(2)}`).join(' ');
  const area = path + ` L${xs(data.length-1).toFixed(2)},${PAD.t + innerH} L${xs(0).toFixed(2)},${PAD.t + innerH} Z`;

  const ticks = 4;
  const yTicks = Array.from({length: ticks + 1}, (_, i) => Math.round((yMax / ticks) * i));

  // x-axis labels: every 2-3 months depending on density
  const xStep = Math.max(1, Math.round(data.length / 22));
  const xLabels = data.map((d, i) => ({ d, i })).filter((_, i) => i % xStep === 0);

  const [hover, setHover] = React.useState(null);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPx = (e.clientX - rect.left) * (W / rect.width);
    const t = (xPx - PAD.l) / innerW;
    const idx = Math.round(t * (data.length - 1));
    if (idx >= 0 && idx < data.length) setHover(idx);
  };
  const onLeave = () => setHover(null);

  const gradId = React.useMemo(() => 'g' + Math.random().toString(36).slice(2, 8), []);

  return (
    <div className="chart-wrap" style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" preserveAspectRatio="none"
           onMouseMove={onMove} onMouseLeave={onLeave}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={ys(v)} y2={ys(v)}
                  stroke="var(--grid)" strokeWidth="1" />
            <text x={PAD.l - 8} y={ys(v) + 4} textAnchor="end"
                  className="chart-axis-label">{fmt(v)}</text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradId})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="1.6"
              strokeLinejoin="round" strokeLinecap="round" />

        {xLabels.map(({ d, i }) => (
          <text key={i} x={xs(i)} y={H - 8} textAnchor="middle"
                className="chart-axis-label"
                transform={`rotate(-45 ${xs(i)} ${H - 8})`}>
            {fmtDate(d.date)}
          </text>
        ))}

        {hover != null && (
          <g>
            <line x1={xs(hover)} x2={xs(hover)} y1={PAD.t} y2={PAD.t + innerH}
                  stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <circle cx={xs(hover)} cy={ys(data[hover].value)} r="4"
                    fill="white" stroke={color} strokeWidth="2" />
          </g>
        )}
      </svg>

      {hover != null && (
        <div className="chart-tooltip"
             style={{
               left: `${(xs(hover) / W) * 100}%`,
               top: `${(ys(data[hover].value) / H) * 100}%`,
             }}>
          <div className="tt-title">{fmtDate(data[hover].date)} {data[hover].date.getFullYear()}</div>
          <div className="tt-row"><span className="tt-dot" style={{ background: color }} />
            <span>Incidents</span><b>{fmtFull(data[hover].value)}</b></div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vertical bar chart with percent labels (Incidents by Creation Source)
// ─────────────────────────────────────────────────────────────────────────────
function VerticalBarChart({ data, height = 220 }) {
  const max = Math.max(...data.map(d => d.value));
  const yMax = Math.ceil(max / 100000) * 100000 || max;
  const ticks = [0, yMax * 0.33, yMax * 0.66, yMax].map(Math.round);
  return (
    <div className="vbar">
      <div className="vbar-yaxis">
        {[...ticks].reverse().map((t, i) => (
          <div key={i} className="vbar-ytick">{fmt(t)}</div>
        ))}
      </div>
      <div className="vbar-plot">
        <div className="vbar-grid">
          {ticks.map((_, i) => <div key={i} className="vbar-gline" />)}
        </div>
        <div className="vbar-bars">
          {data.map((d, i) => {
            const h = max > 0 ? (d.value / yMax) * 100 : 0;
            return (
              <div key={i} className="vbar-col">
                <div className="vbar-bar-wrap">
                  <div className={`vbar-bar ${d.color === 'orange' ? 'orange' : ''}`}
                       style={{ height: `${h}%` }}>
                    <span className="vbar-pct">{d.pct.toFixed(d.pct < 1 ? 2 : 2)}%</span>
                  </div>
                </div>
                <div className="vbar-label">{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Horizontal bar chart (Corridors / Types)
// ─────────────────────────────────────────────────────────────────────────────
function HBarChart({ data, height, valueFmt = fmt, onHover }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="hbar" style={height ? { minHeight: height } : null}>
      {data.map((d, i) => {
        const w = (d.value / max) * 100;
        return (
          <div key={i} className={`hbar-row ${d.dim ? 'dim' : ''}`}
               onMouseEnter={onHover ? () => onHover(d) : undefined}
               onMouseLeave={onHover ? () => onHover(null) : undefined}>
            <div className="hbar-label">{d.label}</div>
            <div className="hbar-track">
              <div className={`hbar-fill ${d.dim ? 'dim' : ''}`} style={{ width: `${w}%` }} />
            </div>
            <div className="hbar-value">{valueFmt(d.value)}</div>
          </div>
        );
      })}
      <div className="hbar-axis">
        <span>0</span>
        <span>{valueFmt(Math.round(max * 0.25))}</span>
        <span>{valueFmt(Math.round(max * 0.5))}</span>
        <span>{valueFmt(Math.round(max * 0.75))}</span>
        <span>{valueFmt(max)}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Heatmap by hour-of-day × day-of-week
// ─────────────────────────────────────────────────────────────────────────────
function HourHeatmap({ rows = 7, hours = 24, seed = 7 }) {
  // generate values
  const data = React.useMemo(() => {
    let s = seed >>> 0;
    const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
    return Array.from({ length: rows }, (_, dow) =>
      Array.from({ length: hours }, (_, h) => {
        const morning = Math.exp(-Math.pow((h - 8) / 1.6, 2)) * 0.9;
        const evening = Math.exp(-Math.pow((h - 17) / 2.0, 2)) * 1.0;
        const dowMul = dow === 5 || dow === 6 ? 0.85 : 1.0;
        const v = (0.18 + morning + evening) * dowMul + (r() - 0.5) * 0.18;
        return Math.max(0, +v.toFixed(2));
      })
    );
  }, [rows, hours, seed]);
  const flat = data.flat();
  const max = Math.max(...flat);
  const dowLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const [hover, setHover] = React.useState(null);

  return (
    <div className="hm">
      <div className="hm-grid">
        <div />
        {Array.from({ length: hours }, (_, h) => (
          <div key={h} className="hm-xlabel">{h % 3 === 0 ? String(h).padStart(2,'0') : ''}</div>
        ))}
        {data.map((row, dow) => (
          <React.Fragment key={dow}>
            <div className="hm-ylabel">{dowLabels[dow]}</div>
            {row.map((v, h) => {
              const t = v / max;
              const isHover = hover && hover.dow === dow && hover.h === h;
              return (
                <div key={h} className={`hm-cell ${isHover ? 'hover' : ''}`}
                     style={{ background: `color-mix(in oklab, var(--accent) ${Math.round(t * 92)}%, var(--card))` }}
                     onMouseEnter={() => setHover({ dow, h, v })}
                     onMouseLeave={() => setHover(null)}>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      {hover && (
        <div className="hm-tooltip">
          <b>{dowLabels[hover.dow]}, {String(hover.h).padStart(2,'0')}:00</b>
          <span>Avg {Math.round(hover.v * 100)} incidents/hr</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sparkline (used in KPI tiles)
// ─────────────────────────────────────────────────────────────────────────────
function Sparkline({ data, color = 'var(--accent)', height = 28 }) {
  const W = 120, H = height;
  if (!data || !data.length) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const xs = (i) => (i / (data.length - 1)) * W;
  const ys = (v) => H - ((v - min) / Math.max(1, max - min)) * H;
  const path = data.map((v, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="sparkline">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stylised "incident heat map" — Texas-shaped silhouette with blooms
// ─────────────────────────────────────────────────────────────────────────────
function IncidentMap() {
  // Hand-tuned hot spots in normalized coords (Austin/SA/Houston/DFW)
  const hotspots = [
    { x: 0.39, y: 0.62, r: 90, w: 1.0, label: 'Austin' },
    { x: 0.37, y: 0.74, r: 70, w: 0.7, label: 'San Antonio' },
    { x: 0.55, y: 0.66, r: 80, w: 0.85, label: 'Houston' },
    { x: 0.45, y: 0.32, r: 75, w: 0.8, label: 'DFW' },
    { x: 0.18, y: 0.55, r: 40, w: 0.4, label: 'Midland' },
    { x: 0.10, y: 0.78, r: 28, w: 0.3, label: 'El Paso' },
  ];
  const [hover, setHover] = React.useState(null);
  return (
    <div className="map-wrap">
      <svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMid meet" className="map-svg">
        <defs>
          <radialGradient id="bloom" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="#ef4444" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#f97316" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
          <pattern id="grid-tx" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0v32" fill="none" stroke="var(--grid)" strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect width="800" height="520" fill="var(--map-bg)" />
        <rect width="800" height="520" fill="url(#grid-tx)" opacity="0.7" />

        {/* Texas silhouette (simplified) */}
        <path d="M120 120 L300 110 L320 70 L420 70 L450 105 L520 115 L600 130 L640 170 L680 200
                 L700 260 L720 300 L700 360 L660 410 L620 430 L600 470 L540 480
                 L500 460 L460 470 L420 460 L380 470 L340 460 L300 440 L260 420
                 L240 380 L210 360 L180 340 L160 300 L140 260 L130 220 L120 180 Z"
              fill="var(--map-land)" stroke="var(--map-stroke)" strokeWidth="1.2" />

        {/* Major corridors */}
        <g stroke="var(--map-corridor)" strokeWidth="2" fill="none" opacity="0.85">
          <path d="M450 80 L380 240 L320 360 L280 440" />
          <path d="M380 240 L520 280 L600 320 L640 360" />
          <path d="M320 360 L420 380 L520 360" />
          <path d="M280 200 L380 240" />
        </g>

        {hotspots.map((h, i) => (
          <g key={i}>
            <circle cx={h.x * 800} cy={h.y * 520} r={h.r * (1 + h.w * 0.4)}
                    fill="url(#bloom)" />
            <circle cx={h.x * 800} cy={h.y * 520} r={6 + h.w * 4}
                    fill="#dc2626" stroke="white" strokeWidth="1.5"
                    onMouseEnter={() => setHover(h)}
                    onMouseLeave={() => setHover(null)}
                    style={{ cursor: 'pointer' }} />
          </g>
        ))}
      </svg>

      <div className="map-attribution">Esri, TomTom, Garmin, FAO, NOAA, USGS, © OpenStreetMap</div>
      <div className="map-controls">
        <button className="map-btn" title="Reset">⟲</button>
        <button className="map-btn" title="Fullscreen">⤢</button>
        <div className="map-zoom">
          <button className="map-btn">+</button>
          <button className="map-btn">−</button>
        </div>
      </div>
      {hover && (
        <div className="map-popover" style={{ left: `${hover.x * 100}%`, top: `${hover.y * 100}%` }}>
          <b>{hover.label}</b>
          <span>{Math.round(hover.w * 142)} active · {Math.round(hover.w * 18000)} all-time</span>
        </div>
      )}
    </div>
  );
}

window.RekorCharts = { LineChart, VerticalBarChart, HBarChart, HourHeatmap, Sparkline, IncidentMap, fmt, fmtFull };
