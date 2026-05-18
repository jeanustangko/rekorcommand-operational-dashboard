// Operational Performance Dashboard — synthetic data per PRD.
// Covers agency-level aggregate metrics + per-operator drill-down.

(function () {
  const RNG = (seed) => {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
  };
  const r = RNG(7);

  const incidentTypes = ['Crash','Stalled vehicle','Abandoned vehicle','Left on arrival','Debris','Hazard','Vehicle on fire','Police Activity','Traffic stop','EMS','Damage','Wrong way','Other'];
  const incidentSubtypes = {
    'Crash': ['Minor','Major','Multi-vehicle','Single-vehicle','Rollover'],
    'Stalled vehicle': ['Lane','Shoulder','Off-road'],
    'Abandoned vehicle': ['Lane','Shoulder'],
    'Left on arrival': ['Cleared before arrival','Cancelled by reporter'],
    'Debris': ['Tire','Cargo','Animal','Hazmat'],
    'Hazard': ['Roadway','Shoulder','Weather'],
    'Vehicle on fire': ['Engine','Cargo'],
    'Police Activity': ['Stop','Pursuit'],
    'Traffic stop': ['Routine','Hazardous'],
    'EMS': ['Medical','Pedestrian'],
    'Damage': ['Guardrail','Sign','Pavement'],
    'Wrong way': ['Highway','Ramp'],
    'Other': ['Uncategorized'],
  };
  const allSubtypes = Array.from(new Set(Object.values(incidentSubtypes).flat()));
  const workspaces = ['Route 1','Route 2','Route 3','Route 4','Route 5'];
  const shifts = ['Day (06–14)','Mid (14–22)','Night (22–06)'];

  const closureReasons = [
    // Top 3 — most common
    { reason: 'Camera unavailable',    status: 'Rejected',  roadway: 'Route 3', type: 'Stalled vehicle', count: 14820 },
    { reason: 'Camera unavailable',    status: 'Rejected',  roadway: 'Route 1', type: 'Crash',           count: 9200  },
    { reason: 'Camera unavailable',    status: 'Rejected',  roadway: 'Route 4', type: 'Debris',          count: 5410  },
    { reason: 'Non-traffic impacting', status: 'Rejected',  roadway: 'Route 2', type: 'Stalled vehicle', count: 18230 },
    { reason: 'Non-traffic impacting', status: 'Rejected',  roadway: 'Route 5', type: 'Abandoned vehicle', count: 8120  },
    { reason: 'Non-traffic impacting', status: 'Rejected',  roadway: 'Route 1', type: 'Left on arrival',  count: 4210  },
    { reason: 'Resource constraints',  status: 'Completed', roadway: 'Route 2', type: 'Crash',           count: 6320  },
    { reason: 'Resource constraints',  status: 'Completed', roadway: 'Route 3', type: 'Damage',          count: 4180  },
    { reason: 'Resource constraints',  status: 'Completed', roadway: 'Route 4', type: 'Vehicle on fire', count: 1820  },
    // Remaining reasons
    { reason: 'Resolved',              status: 'Completed', roadway: 'Route 1', type: 'Crash',           count: 14820 },
    { reason: 'Resolved',              status: 'Completed', roadway: 'Route 3', type: 'Stalled vehicle', count: 12410 },
    { reason: 'Resolved',              status: 'Completed', roadway: 'Route 5', type: 'Debris',          count: 8230  },
    { reason: 'Duplicate',             status: 'Rejected',  roadway: 'Route 2', type: 'Stalled vehicle', count: 5810  },
    { reason: 'Duplicate',             status: 'Rejected',  roadway: 'Route 4', type: 'Crash',           count: 3210  },
    { reason: 'Maintenance vehicle',   status: 'Rejected',  roadway: 'Route 1', type: 'Stalled vehicle', count: 2840  },
    { reason: 'Type not relevant',     status: 'Rejected',  roadway: 'Route 3', type: 'Police Activity', count: 1920  },
    { reason: 'Type not relevant',     status: 'Rejected',  roadway: 'Route 5', type: 'Traffic stop',    count: 980   },
    { reason: 'Location not relevant', status: 'Rejected',  roadway: 'Route 2', type: 'Hazard',          count: 1640  },
    { reason: 'Unable to confirm',     status: 'Rejected',  roadway: 'Route 4', type: 'Debris',          count: 2210  },
    { reason: 'Unable to confirm',     status: 'Rejected',  roadway: 'Route 1', type: 'Police Activity', count: 1410  },
  ];
  const totalClosures = closureReasons.reduce((a, x) => a + x.count, 0);
  closureReasons.forEach(c => c.pct = (c.count / totalClosures) * 100);

  // Workflow timeline transitions (minutes)
  const workflow = [
    { stage: 'Creation → Confirmation', avg: 1.8,  median: 1.2,  p90: 4.6  },
    { stage: 'Creation → Rejection',     avg: 2.4,  median: 1.6,  p90: 6.2  },
    { stage: 'Confirmation → 1st Update', avg: 5.1,  median: 3.4,  p90: 13.0 },
    { stage: '1st Update → Completion',   avg: 24.6, median: 17.2, p90: 64.0 },
  ];

  // Agency-level rates
  const agencyKPIs = {
    confirmationRate: { avg: 87.4, median: 89.1, num: 612340, den: 700541 },
    rejectionRate:    { avg: 8.9,  median: 7.2,  num: 62348,  den: 700541 },
    completionRate:   { avg: 96.1, median: 97.4, num: 587412, den: 611320 },
  };

  // Reminders — agency has a single default reminder interval. The chart shows
  // how often operators hit "Remind me later" and the duration they choose.
  const agencyDefaultReminder = 30; // minutes, set at agency level
  const reminderActionTime = [
    { type: 'Crash',              resets: 1842, avgResetMin: 45 },
    { type: 'Stalled vehicle',    resets: 4120, avgResetMin: 28 },
    { type: 'Abandoned vehicle',  resets: 1840, avgResetMin: 35 },
    { type: 'Left on arrival',    resets:  920, avgResetMin: 14 },
    { type: 'Debris',             resets: 1240, avgResetMin: 32 },
    { type: 'Hazard',             resets: 2980, avgResetMin: 18 },
    { type: 'Vehicle on fire',    resets:   92, avgResetMin: 12 },
    { type: 'Police Activity',    resets:  411, avgResetMin: 22 },
    { type: 'Traffic stop',       resets:  238, avgResetMin: 16 },
    { type: 'EMS',                resets:  176, avgResetMin: 18 },
    { type: 'Damage',             resets:  548, avgResetMin: 48 },
    { type: 'Wrong way',          resets:  124, avgResetMin: 10 },
    { type: 'Other',              resets:  312, avgResetMin: 24 },
  ];

  // Reminder resets per incident — by type
  const snoozeBuckets = [15, 30, 60, 120, 180]; // minutes
  const remindersByType = incidentTypes.map((t, i) => ({
    type: t,
    avgResets: +(0.4 + r() * 2.1).toFixed(2),
    incidents: Math.floor(2000 + r() * 28000),
    avgSnoozeMin: snoozeBuckets[Math.floor(r() * snoozeBuckets.length)],
  }));

  // ───── Operator roster ─────
  const opNames = [
    'J. Rivera','M. Bauer','S. Patel','D. Okafor','A. Nguyen','L. Romero',
    'K. Tanaka','C. Brooks','E. Vasquez','T. Hollis','R. Singh','P. Adeyemi',
    'B. Chen','N. Whitfield','I. Castillo','O. Mendes','F. Yamamoto','H. Petrov',
  ];
  const totalAgencyIncidents = 100000; // baseline for %-of-all calculation

  const operators = opNames.map((name, i) => {
    const rr = RNG(900 + i);
    const handled = Math.floor(3200 + rr() * 6800);
    const confirmTime = +(0.6 + rr() * 3.4).toFixed(1);
    const avgUpdates = +(2.2 + rr() * 4.8).toFixed(1);
    const completion = +(88 + rr() * 11.9).toFixed(1);
    const rejection = +(4 + rr() * 12).toFixed(1);
    const scheduledDays = 18 + Math.floor(rr() * 14);
    const incidentsPerDay = +(handled / scheduledDays / 12).toFixed(1);

    const byType = incidentTypes.map(t => ({
      type: t,
      count: Math.floor(handled * (0.04 + rr() * 0.22)),
    }));
    // normalize so they sum roughly to handled
    const sum = byType.reduce((a, x) => a + x.count, 0);
    const norm = handled / sum;
    byType.forEach(b => b.count = Math.round(b.count * norm));

    const reminderPref = incidentTypes.map(t => {
      const buckets = [15, 30, 45, 60, 90];
      return { type: t, preferred: buckets[Math.floor(rr() * buckets.length)] };
    });

    const opWorkflow = workflow.map(w => ({
      stage: w.stage,
      avg:    +(w.avg    * (0.75 + rr() * 0.55)).toFixed(1),
      median: +(w.median * (0.75 + rr() * 0.55)).toFixed(1),
    }));

    const opClosures = [
      { reason: 'Camera unavailable',    status: 'Rejected',  roadway: 'Route 3', type: 'Stalled vehicle', count: Math.floor(handled * (0.18 + rr() * 0.10)) },
      { reason: 'Non-traffic impacting', status: 'Rejected',  roadway: 'Route 2', type: 'Abandoned vehicle', count: Math.floor(handled * (0.14 + rr() * 0.08)) },
      { reason: 'Resource constraints',  status: 'Completed', roadway: 'Route 1', type: 'Crash',           count: Math.floor(handled * (0.10 + rr() * 0.06)) },
      { reason: 'Resolved',              status: 'Completed', roadway: 'Route 4', type: 'Crash',           count: Math.floor(handled * (0.16 + rr() * 0.10)) },
      { reason: 'Duplicate',             status: 'Rejected',  roadway: 'Route 5', type: 'Stalled vehicle', count: Math.floor(handled * (0.06 + rr() * 0.04)) },
      { reason: 'Maintenance vehicle',   status: 'Rejected',  roadway: 'Route 2', type: 'Stalled vehicle', count: Math.floor(handled * (0.04 + rr() * 0.03)) },
      { reason: 'Type not relevant',     status: 'Rejected',  roadway: 'Route 3', type: 'Police Activity', count: Math.floor(handled * (0.03 + rr() * 0.02)) },
      { reason: 'Location not relevant', status: 'Rejected',  roadway: 'Route 4', type: 'Hazard',          count: Math.floor(handled * (0.02 + rr() * 0.02)) },
      { reason: 'Unable to confirm',     status: 'Rejected',  roadway: 'Route 1', type: 'Debris',          count: Math.floor(handled * (0.03 + rr() * 0.02)) },
    ];
    const opClosureSum = opClosures.reduce((a, x) => a + x.count, 0);
    opClosures.forEach(c => c.pct = (c.count / opClosureSum) * 100);

    return {
      id: 'op-' + i,
      name,
      shift: shifts[i % 3],
      workspace: workspaces[i % workspaces.length],
      status: ['On shift','On shift','Break','Off','On shift'][i % 5],
      handled,
      pctOfAll: +(handled / 110000 * 100).toFixed(2),
      avgUpdates,
      confirmTime,
      completion,
      rejection,
      scheduledDays,
      incidentsPerDay,
      byType,
      reminderPref,
      workflow: opWorkflow,
      closures: opClosures,
    };
  });

  // Compute averages across all operators (for variance calc)
  const opAvg = {
    handled:        operators.reduce((a,o)=>a+o.handled,0) / operators.length,
    confirmTime:    operators.reduce((a,o)=>a+o.confirmTime,0) / operators.length,
    avgUpdates:     operators.reduce((a,o)=>a+o.avgUpdates,0) / operators.length,
    completion:     operators.reduce((a,o)=>a+o.completion,0) / operators.length,
    rejection:      operators.reduce((a,o)=>a+o.rejection,0) / operators.length,
    incidentsPerDay:operators.reduce((a,o)=>a+o.incidentsPerDay,0) / operators.length,
  };
  operators.forEach(o => {
    o.variance = {
      handled:        +((o.handled - opAvg.handled) / opAvg.handled * 100).toFixed(1),
      confirmTime:    +((o.confirmTime - opAvg.confirmTime) / opAvg.confirmTime * 100).toFixed(1),
      avgUpdates:     +((o.avgUpdates - opAvg.avgUpdates) / opAvg.avgUpdates * 100).toFixed(1),
      completion:     +((o.completion - opAvg.completion) / opAvg.completion * 100).toFixed(1),
      rejection:      +((o.rejection - opAvg.rejection) / opAvg.rejection * 100).toFixed(1),
      incidentsPerDay:+((o.incidentsPerDay - opAvg.incidentsPerDay) / opAvg.incidentsPerDay * 100).toFixed(1),
    };
  });

  // Shifts configuration (admin)
  const shiftsConfig = [
    { id: 's1', name: 'Day',   days: ['Mon','Tue','Wed','Thu','Fri'], start: '06:00', end: '14:00', operators: 28, color: '#2563EB' },
    { id: 's2', name: 'Mid',   days: ['Mon','Tue','Wed','Thu','Fri'], start: '14:00', end: '22:00', operators: 24, color: '#16A34A' },
    { id: 's3', name: 'Night', days: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], start: '22:00', end: '06:00', operators: 18, color: '#9333EA' },
    { id: 's4', name: 'Weekend Day', days: ['Sat','Sun'], start: '08:00', end: '20:00', operators: 12, color: '#F58220' },
  ];

  window.RekorPerf = {
    incidentTypes,
    incidentSubtypes,
    allSubtypes,
    workspaces,
    shifts,
    closureReasons,
    workflow,
    agencyKPIs,
    agencyDefaultReminder,
    reminderActionTime,
    remindersByType,
    operators,
    opAvg,
    shiftsConfig,
    totalAgencyIncidents,
  };
})();
