// Mock data for Rekor Command Data Hub prototype
// All synthetic — generated to feel realistic for a regional traffic operations workspace

(function () {
  const RNG = (seed) => {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    };
  };

  // ---------- Time series ----------
  const months = [];
  const start = new Date(2022, 9, 1); // Oct 2022
  const end = new Date(2026, 4, 1);   // May 2026
  const cur = new Date(start);
  while (cur <= end) {
    months.push(new Date(cur));
    cur.setMonth(cur.getMonth() + 1);
  }

  const rng = RNG(42);
  const incidentsOverTime = months.map((d, i) => {
    const ramp = Math.min(1, (i + 4) / 14);
    const seasonal = Math.sin((d.getMonth() / 12) * Math.PI * 2) * 1500;
    const noise = (rng() - 0.5) * 2200;
    let val = 9500 + 8500 * ramp + seasonal + noise;
    if (i === months.length - 1) val *= 0.18; // partial month dip
    return { date: d, value: Math.max(0, Math.round(val)) };
  });

  // ---------- Filters ----------
  const years = ['All', '2022', '2023', '2024', '2025', '2026'];
  const monthsList = [
    'All','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
  ];
  const dayOfWeekList = ['All','Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const dayOfMonthList = ['All', ...Array.from({length:31}, (_,i) => String(i+1))];
  const hourList = ['All', ...Array.from({length:24}, (_,i) => String(i).padStart(2,'0')+':00')];
  const workspaces = ['All', 'Route 1', 'Route 2', 'Route 3', 'Route 4', 'Route 5'];
  const incidentTypes = ['All', 'Crash', 'Stalled vehicle', 'Abandoned vehicle', 'Left on arrival', 'Debris', 'Hazard', 'Vehicle on fire', 'Police Activity', 'Traffic stop', 'EMS', 'Damage', 'Wrong way', 'Other'];
  const incidentSubtypes = ['All', 'Minor', 'Major', 'Multi-vehicle', 'Single-vehicle', 'Lane blocked', 'Shoulder', 'Off-road', 'Animal', 'Hazmat'];
  const incidentStatus = ['All', 'Open', 'Confirmed', 'Cleared', 'Pending Review', 'Auto-cleared', 'Cancelled'];
  const corridors = ['All', 'I-35', 'TX-130', 'US-290', 'TX-71', 'I-410', 'I-10', '183 Toll', 'N MoPac', '290 Toll', 'State Hwy 45'];
  const engagedAccounts = ['All', 'TxDOT-CTR', 'TxDOT-SAT', 'TxDOT-HOU', 'NTTA', 'CTRMA', 'HCTRA'];
  const completionReasons = ['All', 'Cleared on scene', 'Auto-resolved', 'Duplicate', 'False alarm', 'Cancelled by reporter', 'Aged out'];

  // ---------- Top-level KPIs ----------
  const totals = {
    incidents: 716656,
    avgClearMin: 17.4,
    openNow: 142,
    enrouteUnits: 38,
    incidentsToday: 1284,
    detections24h: 18432,
  };

  // ---------- Creation source ----------
  const creationSource = [
    { label: 'Platform', value: 497829, pct: 69.47, color: 'primary' },
    { label: 'CAD',      value: 156229, pct: 21.80, color: 'orange' },
    { label: 'ATMS',     value: 62492,  pct: 8.72,  color: 'primary' },
    { label: 'User',     value: 106,    pct: 0.01,  color: 'primary' },
  ];

  // ---------- Corridors most affected ----------
  const corridorBars = [
    { label: 'I-35',     value: 152431 },
    { label: 'TX-130',   value: 64028  },
    { label: 'US-290',   value: 41277  },
    { label: 'TX-71',    value: 33945  },
    { label: 'Interst…', value: 31214  },
    { label: '183 Toll', value: 28471  },
    { label: 'N MoPa…',  value: 22019  },
    { label: 'null',     value: 14302, dim: true },
    { label: '290 Toll', value: 12886  },
    { label: 'State H…', value: 9117   },
  ];

  // ---------- Locations table ----------
  const locations = [
    { loc: 'I-35, N, near Interstate 35',                 incidents: 17351 },
    { loc: 'I-35, S, near Interstate 35',                 incidents: 16493 },
    { loc: 'I-35, NE, near Interstate 35',                incidents: 11666 },
    { loc: 'I-35, SW, near Interstate 35',                incidents: 9132  },
    { loc: 'I-35, S, near Interstate 35 Frontage Road',   incidents: 5629  },
    { loc: 'I-35, N, near Interstate 35 Frontage Road',   incidents: 5243  },
    { loc: 'TX-130, N, near State Highway 130',           incidents: 3653  },
    { loc: 'TX-130, S, near State Highway 130',           incidents: 3616  },
    { loc: 'Purple Heart Trail, N, near Interstate 35',   incidents: 3351  },
    { loc: 'US-290, SW, near Interstate 35',              incidents: 3067  },
    { loc: 'TX-71, E, near Ben White Boulevard',          incidents: 2910  },
    { loc: 'I-35, N, near Ben White Boulevard',           incidents: 2754  },
    { loc: 'US-290, E, near US-183',                      incidents: 2621  },
    { loc: 'TX-130, N, near SH-45',                       incidents: 2483  },
    { loc: '183 Toll, N, near Mopac Expy',                incidents: 2296  },
    { loc: 'I-35, S, near Slaughter Lane',                incidents: 2188  },
  ];

  // ---------- Incidents by type ----------
  const incidentsByType = [
    { label: 'Stalled vehicle',    value: 312840 },
    { label: 'Crash',              value: 184221 },
    { label: 'Debris',             value: 88317  },
    { label: 'Hazard',             value: 64210  },
    { label: 'Abandoned vehicle',  value: 38114  },
    { label: 'Left on arrival',    value: 22044  },
    { label: 'Traffic stop',       value: 19044  },
    { label: 'EMS',                value: 12830  },
    { label: 'Damage',             value: 8412   },
    { label: 'Vehicle on fire',    value: 7720   },
    { label: 'Police Activity',    value: 6310   },
    { label: 'Wrong way',          value: 3281   },
    { label: 'Other',              value: 1829   },
  ];

  // ---------- Incidents by subtype (table) ----------
  const incidentBySubtype = [
    { subtype: 'Minor',         type: 'Crash',            count: 102481 },
    { subtype: 'Major',         type: 'Crash',            count: 41117  },
    { subtype: 'Multi-vehicle', type: 'Crash',            count: 28304  },
    { subtype: 'Lane blocked',  type: 'Stalled vehicle',  count: 142819 },
    { subtype: 'Shoulder',      type: 'Stalled vehicle',  count: 121043 },
    { subtype: 'Off-road',      type: 'Stalled vehicle',  count: 38217  },
    { subtype: 'Hazmat',        type: 'Hazard',           count: 1189   },
    { subtype: 'Animal',        type: 'Debris',           count: 9740   },
    { subtype: 'Single-vehicle',type: 'Crash',            count: 12440  },
  ];

  // ---------- Average incidents by time of day ----------
  const hours = Array.from({length:24}, (_, h) => h);
  const avgByHour = hours.map((h) => {
    const morning = Math.exp(-Math.pow((h - 8) / 1.6, 2)) * 0.9;
    const evening = Math.exp(-Math.pow((h - 17) / 2.0, 2)) * 1.0;
    const base = 0.18 + 0.06 * Math.sin((h / 24) * Math.PI * 2);
    const v = (base + morning + evening) * 88;
    return { hour: h, value: Math.round(v * (0.9 + rng() * 0.2)) };
  });

  // ---------- History: Incidents list ----------
  const incidentsList = [];
  const types = ['Crash','Stalled vehicle','Abandoned vehicle','Left on arrival','Debris','Hazard','Vehicle on fire','Police Activity','Traffic stop','EMS','Damage','Wrong way','Other'];
  const statuses = ['Open','Confirmed','Cleared','Pending Review'];
  const corrs = ['I-35','TX-130','US-290','TX-71','I-410','183 Toll'];
  const dirs = ['N','S','E','W','NE','SW'];
  const ir = RNG(98765);
  for (let i = 0; i < 64; i++) {
    const t = types[Math.floor(ir() * types.length)];
    const s = statuses[Math.floor(ir() * statuses.length)];
    const c = corrs[Math.floor(ir() * corrs.length)];
    const d = dirs[Math.floor(ir() * dirs.length)];
    const mile = (ir() * 480).toFixed(1);
    const minsAgo = Math.floor(ir() * 720);
    const dur = Math.floor(8 + ir() * 90);
    incidentsList.push({
      id: 'INC-' + (53210 + i),
      time: minsAgo,
      corridor: c,
      direction: d,
      mile,
      type: t,
      status: s,
      duration: dur,
      source: ['Platform','CAD','ATMS','User'][Math.floor(ir()*3)],
      lanes: Math.floor(1 + ir() * 4),
      reporter: ['Auto','Operator JR','Operator MB','TxDOT','911 CAD'][Math.floor(ir()*5)],
    });
  }

  // ---------- History: Driver shifts ----------
  const operators = [
    'J. Rivera','M. Bauer','S. Patel','D. Okafor','A. Nguyen','L. Romero',
    'K. Tanaka','C. Brooks','E. Vasquez','T. Hollis','R. Singh','P. Adeyemi'
  ];
  const sr = RNG(54321);
  const driverShifts = operators.map((name, i) => {
    return {
      name,
      shift: ['Day 06–14','Mid 14–22','Night 22–06'][i % 3],
      workspace: workspaces[1 + (i % (workspaces.length - 1))],
      assigned: Math.floor(40 + sr() * 70),
      cleared: Math.floor(30 + sr() * 60),
      avgClearMin: +(10 + sr() * 20).toFixed(1),
      escalations: Math.floor(sr() * 8),
      status: ['On shift','On shift','Break','Off'][Math.floor(sr()*4)],
    };
  });

  // ---------- History: Traffic disruptions ----------
  const disruptionTypes = ['Construction','Special Event','Closure','Detour','Sporting Event'];
  const dr = RNG(13579);
  const trafficDisruptions = Array.from({length: 18}, (_, i) => {
    return {
      id: 'TD-' + (1140 + i),
      name: [
        'I-35 N Lane Closure — Slaughter to Stassney',
        'TX-130 Resurfacing — Mile 410–414',
        'UT vs. OU Tailgate Detour',
        'Mopac Bridge Inspection',
        'F1 COTA Ingress Plan',
        'US-290 Eastbound Shoulder Work',
        'I-10 Concrete Pour Window',
        'Downtown Marathon Route',
        'TX-71 Westbound Drainage',
      ][i % 9],
      type: disruptionTypes[i % disruptionTypes.length],
      corridor: corrs[i % corrs.length],
      start: `May ${5 + (i % 20)}, ${(i % 4) === 0 ? '06:00' : '21:00'}`,
      end: `May ${6 + (i % 20)}, ${(i % 4) === 0 ? '15:00' : '05:00'}`,
      lanes: Math.floor(1 + dr() * 3),
      impact: ['Low','Moderate','High','Severe'][Math.floor(dr() * 4)],
      status: ['Scheduled','Active','Completed'][Math.floor(dr() * 3)],
    };
  });

  window.RekorData = {
    incidentsOverTime,
    filters: {
      years, monthsList, dayOfMonthList, dayOfWeekList, hourList,
      workspaces, incidentTypes, incidentSubtypes, incidentStatus,
      corridors, engagedAccounts, completionReasons,
    },
    totals,
    creationSource,
    corridorBars,
    locations,
    incidentsByType,
    incidentBySubtype,
    avgByHour,
    incidentsList,
    driverShifts,
    trafficDisruptions,
  };
})();
