import { Incident } from '../types';
import { INITIAL_INCIDENTS } from '../data/mockData';

export const INCIDENTS_STORAGE_KEY = 'infranex_civic_incidents_v2';
export const INCIDENTS_SCHEMA_VERSION_KEY = 'infranex_incidents_schema_version';
export const CURRENT_INCIDENTS_SCHEMA_VERSION = '5';

// Known demonstration incident IDs
export const KNOWN_DEMO_INCIDENT_IDS = new Set([
  'INF-2026-9041',
  'INF-2026-9042',
  'INF-2026-9043',
  'INF-2026-9044',
  'INF-2026-9045',
  'INF-2026-9046',
  'INF-2026-9047',
  'INF-2026-9048',
]);

// Stale image URL signatures that must never persist
const STALE_IMAGE_SIGNATURES = [
  'photo-1542385151-efd9000785a0', // Mother holding baby erroneously seeded for water flooding
  'photo-1518709268805-4e9042af9f23', // Abstract art erroneously seeded for stormwater culvert
  'photo-1578328819058-b69f3a3b0f6b', // Broken 404 URL
];

// Legacy storage keys from previous iterations to inspect and migrate
const LEGACY_STORAGE_KEYS = [
  'infranex_incidents',
  'infranex_cases',
  'incidents',
  'infranex_incident_data',
  'infranex_incidents_v1',
];

/**
 * Checks if an incident contains any stale image reference that needs correction.
 */
const hasStaleEvidence = (inc: Incident): boolean => {
  if (!inc.images || inc.images.length === 0) return false;
  return inc.images.some((img) =>
    STALE_IMAGE_SIGNATURES.some((sig) => img.url && img.url.includes(sig))
  );
};

/**
 * Safe, versioned migration loader for INFRANEX civic incident records.
 *
 * Requirements fulfilled:
 * 1. Updates known seeded demonstration records from canonical mockData.
 * 2. Purges stale mother-and-baby or broken image references.
 * 3. Strictly preserves citizen-created reports and their live-captured photographs.
 * 4. Preserves non-demonstration records and user transitions.
 * 5. Runs once per schema version and does not repeatedly overwrite user edits.
 */
export const loadAndMigrateIncidents = (): Incident[] => {
  try {
    const storedVersion = localStorage.getItem(INCIDENTS_SCHEMA_VERSION_KEY);
    const primaryRaw = localStorage.getItem(INCIDENTS_STORAGE_KEY);

    let candidates: Incident[] = [];

    if (primaryRaw) {
      try {
        const parsed = JSON.parse(primaryRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          candidates = parsed;
        }
      } catch (err) {
        console.warn('Failed to parse primary incidents from localStorage:', err);
      }
    }

    // If primary storage was empty, scan legacy storage keys
    if (candidates.length === 0) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const legacyRaw = localStorage.getItem(legacyKey);
        if (legacyRaw) {
          try {
            const parsed = JSON.parse(legacyRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              candidates = parsed;
              break;
            }
          } catch {}
        }
      }
    }

    // Canonical map of current demonstration dataset
    const canonicalMap = new Map<string, Incident>(
      INITIAL_INCIDENTS.map((inc) => [inc.id, inc])
    );

    // If no candidate data found in storage, initialize fresh with canonical dataset
    if (candidates.length === 0) {
      localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(INITIAL_INCIDENTS));
      localStorage.setItem(INCIDENTS_SCHEMA_VERSION_KEY, CURRENT_INCIDENTS_SCHEMA_VERSION);
      cleanupLegacyKeys();
      return INITIAL_INCIDENTS;
    }

    // Determine if migration is required
    const isMigrationNeeded =
      storedVersion !== CURRENT_INCIDENTS_SCHEMA_VERSION ||
      candidates.some((inc) => hasStaleEvidence(inc)) ||
      // Verify demonstration flooding incident INF-2026-9042 has valid photo evidence
      candidates.some(
        (inc) =>
          inc.id === 'INF-2026-9042' &&
          (!inc.images || inc.images.length === 0 || !inc.images[0]?.url)
      ) ||
      // Verify demonstration streetlight incident INF-2026-9045 has valid local photo evidence
      candidates.some(
        (inc) =>
          inc.id === 'INF-2026-9045' &&
          (!inc.images || inc.images.length === 0 || !inc.images[0]?.url || !inc.images[0].url.includes('bengaluru-dark-streetlights-demo.jpg'))
      );

    if (!isMigrationNeeded) {
      return candidates;
    }

    console.info(`[INFRANEX Storage] Executing safe incident migration to schema v${CURRENT_INCIDENTS_SCHEMA_VERSION}...`);

    // Perform safe merge and migration
    const migratedList: Incident[] = [];
    const seenDemoIds = new Set<string>();

    for (const inc of candidates) {
      if (KNOWN_DEMO_INCIDENT_IDS.has(inc.id)) {
        // It's a demonstration incident: update with canonical Bengaluru evidence & hazard details
        seenDemoIds.add(inc.id);
        const canonical = canonicalMap.get(inc.id);

        if (canonical) {
          migratedList.push({
            ...canonical,
            // Preserve user-updated lifecycle state and assignments if modified
            status: inc.status || canonical.status,
            assignedTo: inc.assignedTo || canonical.assignedTo,
            timeline: inc.timeline && inc.timeline.length > canonical.timeline.length
              ? inc.timeline
              : canonical.timeline,
          });
        } else {
          // If demo ID not in canonical, preserve but strip stale evidence
          migratedList.push({
            ...inc,
            images: inc.images.filter(
              (img) => !STALE_IMAGE_SIGNATURES.some((sig) => img.url && img.url.includes(sig))
            ),
          });
        }
      } else {
        // PRESERVE CITIZEN REPORT 100%: Never touch citizen live-captured photos, notes, or GPS coordinates
        migratedList.push(inc);
      }
    }

    // Ensure all 7 canonical Bengaluru demonstration incidents are present
    for (const [demoId, canonicalInc] of canonicalMap.entries()) {
      if (!seenDemoIds.has(demoId)) {
        migratedList.unshift(canonicalInc);
      }
    }

    // Persist migrated dataset and update schema version
    localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(migratedList));
    localStorage.setItem(INCIDENTS_SCHEMA_VERSION_KEY, CURRENT_INCIDENTS_SCHEMA_VERSION);
    cleanupLegacyKeys();

    console.info(`[INFRANEX Storage] Migration complete. Loaded ${migratedList.length} verified incident records.`);
    return migratedList;
  } catch (err) {
    console.error('[INFRANEX Storage] Migration exception encountered, falling back to canonical mockData:', err);
    return INITIAL_INCIDENTS;
  }
};

/**
 * Save incidents to versioned local storage.
 */
export const saveStoredIncidents = (incidents: Incident[]): void => {
  try {
    localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(incidents));
    localStorage.setItem(INCIDENTS_SCHEMA_VERSION_KEY, CURRENT_INCIDENTS_SCHEMA_VERSION);
  } catch (err) {
    console.error('[INFRANEX Storage] Failed to persist incidents to localStorage:', err);
  }
};

/**
 * Clean up legacy storage keys without touching unrelated user data.
 */
const cleanupLegacyKeys = () => {
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {}
};
