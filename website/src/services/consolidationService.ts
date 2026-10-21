import { Incident, DuplicateMatchCandidate } from '../types';

/**
 * Calculates geographic distance in meters between two lat/lng coordinates using the Haversine formula.
 */
export const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Finds candidate duplicate incidents for a given target incident within a configurable radius.
 */
export const findDuplicateCandidates = (
  target: Incident,
  allIncidents: Incident[],
  searchRadiusMeters: number = 60
): DuplicateMatchCandidate[] => {
  const candidates: DuplicateMatchCandidate[] = [];

  for (const inc of allIncidents) {
    if (inc.id === target.id) continue;
    // Don't match already consolidated children
    if (inc.status === 'consolidated') continue;

    const distance = calculateHaversineDistance(
      target.location.lat,
      target.location.lng,
      inc.location.lat,
      inc.location.lng
    );

    if (distance <= searchRadiusMeters) {
      const isSameCategory = target.category === inc.category;
      let score = Math.max(0.1, 1 - distance / searchRadiusMeters);
      if (isSameCategory) score += 0.35;
      if (target.location.ward === inc.location.ward) score += 0.15;
      const matchScore = Math.min(1.0, +score.toFixed(2));

      const timeDeltaHours = Math.abs(
        (new Date(target.reportedAt).getTime() - new Date(inc.reportedAt).getTime()) / (3600 * 1000)
      );

      candidates.push({
        primaryIncidentId: target.id,
        candidateIncidentId: inc.id,
        distanceMeters: Math.round(distance),
        categoryMatch: isSameCategory,
        timeDeltaHours: +timeDeltaHours.toFixed(1),
        confidenceScore: matchScore,
        matchReason: `Distance is ${Math.round(distance)}m (within ${searchRadiusMeters}m radius). Category is ${
          isSameCategory ? 'identical (' + inc.category + ')' : 'different'
        }. Ward: ${inc.location.ward}. Reported ${timeDeltaHours.toFixed(1)}h apart.`,
      });
    }
  }

  return candidates.sort((a, b) => b.confidenceScore - a.confidenceScore);
};

/**
 * Consolidates duplicate reports into a primary master incident.
 * Core Principle:
 * - One primary actionable incident
 * - All original evidence preserved with original attribution and timestamps
 * - Related records marked as 'consolidated', referencing parent incident
 * - Never silently deleted
 */
export const executeConsolidation = (
  primaryIncident: Incident,
  duplicateIncidents: Incident[],
  officerName: string,
  consolidationReason: string
): { updatedPrimary: Incident; updatedDuplicates: Incident[] } => {
  const nowIso = new Date().toISOString();
  const duplicateIds = duplicateIncidents.map((d) => d.id);

  // Collect all images from duplicates
  const consolidatedImages = [...(primaryIncident.images || [])];
  duplicateIncidents.forEach((dup) => {
    (dup.images || []).forEach((img) => {
      consolidatedImages.push({
        ...img,
        caption: `[Consolidated from #${dup.id}] ${img.caption || ''}`,
      });
    });
  });

  const existingReportIds = primaryIncident.consolidatedReportIds || [];
  const updatedReportIds = Array.from(new Set([...existingReportIds, ...duplicateIds]));

  const updatedTimeline = [
    ...primaryIncident.timeline,
    {
      timestamp: nowIso,
      title: `Consolidated ${duplicateIds.length} Duplicate Incident(s)`,
      description: `Linked incidents: ${duplicateIds.join(', ')}. Reason: ${consolidationReason}. Authorized by ${officerName}.`,
      user: officerName,
      type: 'milestone' as const,
    },
  ];

  const updatedPrimary: Incident = {
    ...primaryIncident,
    isConsolidatedMaster: true,
    consolidatedReportIds: updatedReportIds,
    images: consolidatedImages,
    timeline: updatedTimeline,
    updatedAt: nowIso,
  };

  const updatedDuplicates: Incident[] = duplicateIncidents.map((dup) => ({
    ...dup,
    status: 'consolidated' as const,
    parentIncidentId: primaryIncident.id,
    updatedAt: nowIso,
    timeline: [
      ...dup.timeline,
      {
        timestamp: nowIso,
        title: `Consolidated into Primary Master #${primaryIncident.id}`,
        description: `This report has been consolidated under primary incident #${primaryIncident.id} to avoid duplicate work orders. All evidence and timestamps are preserved. Reason: ${consolidationReason}.`,
        user: officerName,
        type: 'milestone' as const,
      },
    ],
  }));

  return { updatedPrimary, updatedDuplicates };
};
