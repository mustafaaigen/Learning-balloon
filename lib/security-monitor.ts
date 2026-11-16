'use client';

export type SecurityAttackType =
  | 'XSS / Script Injection'
  | 'SQL / NoSQL Injection'
  | 'Command / Path Traversal'
  | 'LocalStorage / Score Tampering'
  | 'DevTools / Source Inspection'
  | 'Unauthorized Admin Probe';

export type SecuritySeverity = 'critical' | 'high' | 'medium';

export interface SecurityIncident {
  id: string;
  timestamp: string;
  attackType: SecurityAttackType;
  severity: SecuritySeverity;
  payload: string;
  source: string;
  attackerName: string;
  attackerEmail: string;
  userAgent: string;
  blocked: boolean;
  readByAdmin: boolean;
}

const SECURITY_STORAGE_KEY = 'learning_balloon_security_alerts_v1';
const SECURITY_EVENT_NAME = 'lb-security-incident-updated';

// Malicious pattern detectors
const XSS_PATTERNS: RegExp[] = [
  /<\s*script/i,
  /javascript\s*:/i,
  /on(error|load|click|mouseover|focus|blur)\s*=/i,
  /<\s*(iframe|object|embed|svg|img|body|meta|link)/i,
  /document\s*\.\s*(cookie|domain|write)/i,
  /eval\s*\(/i,
  /alert\s*\(/i,
  /window\s*\.\s*location/i,
];

const SQLI_PATTERNS: RegExp[] = [
  /('|\b)(or|and)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i,
  /union\s+(all\s+)?select/i,
  /drop\s+(table|database)/i,
  /insert\s+into/i,
  /delete\s+from/i,
  /--\s*$/m,
  /;\s*(drop|select|insert|update|delete)/i,
  /\$where|\$ne|\$gt|\$regex/i,
];

const PATH_CMD_PATTERNS: RegExp[] = [
  /\.\.\//,
  /\.\.\\/,
  /\/etc\/passwd/i,
  /cmd\.exe|\/bin\/(ba)?sh/i,
  /\|\|\s*(whoami|ls|cat|curl|wget)/i,
];

export interface DetectionResult {
  isMalicious: boolean;
  attackType?: SecurityAttackType;
  severity?: SecuritySeverity;
  matchedPattern?: string;
}

export function detectMaliciousPayload(input: string): DetectionResult {
  if (!input || typeof input !== 'string') {
    return { isMalicious: false };
  }

  const trimmed = input.trim();
  if (!trimmed) return { isMalicious: false };

  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isMalicious: true,
        attackType: 'XSS / Script Injection',
        severity: 'critical',
        matchedPattern: pattern.source,
      };
    }
  }

  for (const pattern of SQLI_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isMalicious: true,
        attackType: 'SQL / NoSQL Injection',
        severity: 'critical',
        matchedPattern: pattern.source,
      };
    }
  }

  for (const pattern of PATH_CMD_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isMalicious: true,
        attackType: 'Command / Path Traversal',
        severity: 'high',
        matchedPattern: pattern.source,
      };
    }
  }

  return { isMalicious: false };
}

export function playSecuritySirenTone() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Two-tone urgent cyber alarm siren
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.linearRampToValueAtTime(980, now + 0.14);
    osc.frequency.linearRampToValueAtTime(580, now + 0.28);
    osc.frequency.linearRampToValueAtTime(980, now + 0.42);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.48);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.48);
  } catch {
    // Ignore audio context restriction errors
  }
}

export function getSecurityIncidents(): SecurityIncident[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSecurityIncidents(incidents: SecurityIncident[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(incidents.slice(0, 100)));
    window.dispatchEvent(new CustomEvent(SECURITY_EVENT_NAME, { detail: incidents }));
  } catch {
    // Ignore storage quota errors
  }
}

export function recordSecurityIncident(params: {
  attackType: SecurityAttackType;
  severity: SecuritySeverity;
  payload: string;
  source: string;
  attackerName?: string;
  attackerEmail?: string;
  playAlarm?: boolean;
}): SecurityIncident {
  const existing = getSecurityIncidents();
  const newIncident: SecurityIncident = {
    id: `SEC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    attackType: params.attackType,
    severity: params.severity,
    payload: params.payload.slice(0, 220),
    source: params.source,
    attackerName: params.attackerName || 'Unknown Visitor',
    attackerEmail: params.attackerEmail || 'Unauthenticated Session',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Browser',
    blocked: true,
    readByAdmin: false,
  };

  const updated = [newIncident, ...existing].slice(0, 100);
  saveSecurityIncidents(updated);

  if (params.playAlarm !== false) {
    playSecuritySirenTone();
  }

  return newIncident;
}

export function inspectAndGuardInput(
  input: string,
  source: string,
  userContext?: { name?: string; email?: string }
): { blocked: boolean; incident?: SecurityIncident } {
  const detection = detectMaliciousPayload(input);
  if (!detection.isMalicious || !detection.attackType || !detection.severity) {
    return { blocked: false };
  }

  const incident = recordSecurityIncident({
    attackType: detection.attackType,
    severity: detection.severity,
    payload: input,
    source,
    attackerName: userContext?.name,
    attackerEmail: userContext?.email,
    playAlarm: true,
  });

  return { blocked: true, incident };
}

export function markAllSecurityIncidentsRead(): SecurityIncident[] {
  const existing = getSecurityIncidents();
  const updated = existing.map((inc) => ({ ...inc, readByAdmin: true }));
  saveSecurityIncidents(updated);
  return updated;
}

export function clearSecurityIncidents(): SecurityIncident[] {
  saveSecurityIncidents([]);
  return [];
}

export function subscribeToSecurityIncidents(
  callback: (incidents: SecurityIncident[]) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustom = () => {
    callback(getSecurityIncidents());
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === SECURITY_STORAGE_KEY) {
      callback(getSecurityIncidents());
    }
  };

  window.addEventListener(SECURITY_EVENT_NAME, handleCustom);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(SECURITY_EVENT_NAME, handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}

export function attachGlobalSecurityMonitors(
  getUserContext: () => { name?: string; email?: string },
  onIncidentDetected: (incident: SecurityIncident) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. Inspect URL query & hash parameters for XSS / SQLi on load
  try {
    const rawUrl = decodeURIComponent(window.location.search + ' ' + window.location.hash);
    const check = detectMaliciousPayload(rawUrl);
    if (check.isMalicious && check.attackType && check.severity) {
      const ctx = getUserContext();
      const inc = recordSecurityIncident({
        attackType: check.attackType,
        severity: check.severity,
        payload: rawUrl.trim(),
        source: 'URL Query / Hash Parameter',
        attackerName: ctx.name,
        attackerEmail: ctx.email,
      });
      onIncidentDetected(inc);
    }
  } catch {
    // Ignore malformed URI components
  }

  // 2. Monitor DevTools / View-Source shortcut probes (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
  let lastShortcutAlertAt = 0;
  const handleKeyDown = (e: KeyboardEvent) => {
    const isF12 = e.key === 'F12';
    const isInspect = (e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key);
    const isViewSource = (e.ctrlKey || e.metaKey) && ['U', 'u'].includes(e.key);

    if (isF12 || isInspect || isViewSource) {
      const now = Date.now();
      if (now - lastShortcutAlertAt < 4000) return;
      lastShortcutAlertAt = now;

      const shortcutName = isF12
        ? 'F12 (DevTools)'
        : isInspect
        ? 'Ctrl+Shift+I/J (Inspector Console)'
        : 'Ctrl+U (View Source)';

      if (isViewSource) {
        e.preventDefault();
      }

      const ctx = getUserContext();
      const inc = recordSecurityIncident({
        attackType: 'DevTools / Source Inspection',
        severity: 'medium',
        payload: `Keyboard Shortcut Triggered: ${shortcutName}`,
        source: 'Browser Keyboard Monitor',
        attackerName: ctx.name,
        attackerEmail: ctx.email,
      });
      onIncidentDetected(inc);
    }
  };

  // 3. Monitor LocalStorage manual score/star tampering from external DevTools tab
  const handleStorageTamper = (e: StorageEvent) => {
    if (e.key === 'balloony_progress_v3' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        const stars = Number(parsed?.stars ?? 0);
        const streak = Number(parsed?.streakCount ?? 0);
        if (stars > 50000 || stars < 0 || streak > 3650 || streak < 0 || Number.isNaN(stars)) {
          const ctx = getUserContext();
          const inc = recordSecurityIncident({
            attackType: 'LocalStorage / Score Tampering',
            severity: 'critical',
            payload: `Tampered values: stars=${parsed?.stars}, streak=${parsed?.streakCount}`,
            source: 'LocalStorage Integrity Shield',
            attackerName: ctx.name,
            attackerEmail: ctx.email,
          });
          onIncidentDetected(inc);
        }
      } catch {
        const ctx = getUserContext();
        const inc = recordSecurityIncident({
          attackType: 'LocalStorage / Score Tampering',
          severity: 'high',
          payload: `Corrupted JSON injected into balloony_progress_v3`,
          source: 'LocalStorage Integrity Shield',
          attackerName: ctx.name,
          attackerEmail: ctx.email,
        });
        onIncidentDetected(inc);
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('storage', handleStorageTamper);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('storage', handleStorageTamper);
  };
}
