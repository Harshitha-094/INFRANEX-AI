import { Hotspot, DumpingEvent, Incident } from '../types';
import { INITIAL_HOTSPOTS } from '../data/mockData';

const HOTSPOTS_STORAGE_KEY = 'infranex_hotspots_v1';

export const loadStoredHotspots = (): Hotspot[] => {
  try {
    const raw = localStorage.getItem(HOTSPOTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load hotspots from storage, falling back to defaults:', err);
  }
  return INITIAL_HOTSPOTS;
};

export const saveStoredHotspots = (hotspots: Hotspot[]): void => {
  try {
    localStorage.setItem(HOTSPOTS_STORAGE_KEY, JSON.stringify(hotspots));
  } catch (err) {
    console.warn('Failed to persist hotspots:', err);
  }
};

/**
 * Recalculates hotspot metrics dynamically from live incidents and dumping events.
 */
export const recalculateHotspotMetrics = (
  hotspot: Hotspot,
  dumpingEvents: DumpingEvent[],
  incidents: Incident[]
): Hotspot => {
  // Find confirmed dumping events in this ward/location
  const wardConfirmedEvents = dumpingEvents.filter(
    (e) => e.location.ward === hotspot.location.ward && e.status === 'confirmed'
  );

  // Find waste incidents in this ward
  const wardWasteIncidents = incidents.filter(
    (inc) => inc.category === 'waste' && inc.location.ward === hotspot.location.ward
  );

  // Find resolved waste incidents (cleanups)
  const resolvedWasteIncidents = wardWasteIncidents.filter(
    (inc) => inc.status === 'resolved' || inc.status === 'archived'
  );

  const cleanupCount = Math.max(hotspot.cleanupCount, resolvedWasteIncidents.length);
  const confirmedCount = wardConfirmedEvents.length;
  const wasteIncCount = wardWasteIncidents.length;

  // Transparent, auditable formula:
  // score = (confirmedEvents * 1.5) + (wasteIncidents * 1.0) - (cleanups * 0.8)
  const rawScore = confirmedCount * 1.5 + wasteIncCount * 1.0 - cleanupCount * 0.8;
  const recurrenceScore = Math.max(0.0, +rawScore.toFixed(1));

  let recurrenceLevel: 'low' | 'medium' | 'high' = 'low';
  let recommendation = 'Maintain standard bi-weekly municipal monitoring sweeps.';

  if (recurrenceScore >= 4.0 || confirmedCount >= 3) {
    recurrenceLevel = 'high';
    recommendation =
      'Schedule enhanced municipal clearing operations, install physical perimeter fencing, and increase routine civic marshal visits.';
  } else if (recurrenceScore >= 2.0 || confirmedCount >= 1) {
    recurrenceLevel = 'medium';
    recommendation =
      'Schedule twice-weekly targeted garbage clearing operations, install civic deterrence signage, and engage local resident welfare association.';
  }

  // Calculate remaining unresolved accumulation
  const activeWasteIncidents = wardWasteIncidents.filter(
    (inc) => !['resolved', 'archived', 'consolidated'].includes(inc.status)
  );
  const unresolvedAccumulationEstM3 = activeWasteIncidents.reduce((sum, inc) => {
    return sum + (inc.aiAnalysis?.estimatedDimensions?.volumeCuMeters || 1.5);
  }, 0);

  const latestEvent = wardConfirmedEvents.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];

  return {
    ...hotspot,
    dumpingEventIds: wardConfirmedEvents.map((e) => e.id),
    incidentIds: wardWasteIncidents.map((i) => i.id),
    cleanupCount,
    recurrenceScore,
    recurrenceLevel,
    unresolvedAccumulationEstM3: +unresolvedAccumulationEstM3.toFixed(1),
    lastEventAt: latestEvent ? latestEvent.timestamp : hotspot.lastEventAt,
    preventiveRecommendation: recommendation,
  };
};
