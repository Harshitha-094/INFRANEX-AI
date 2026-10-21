import { InfrastructureAsset, Incident } from '../types';
import { INITIAL_INFRASTRUCTURE_ASSETS } from '../data/mockData';

const ASSETS_STORAGE_KEY = 'infranex_infrastructure_assets_v1';

export const loadStoredInfrastructureAssets = (): InfrastructureAsset[] => {
  try {
    const raw = localStorage.getItem(ASSETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load infrastructure assets, using defaults:', err);
  }
  return INITIAL_INFRASTRUCTURE_ASSETS;
};

export const saveStoredInfrastructureAssets = (assets: InfrastructureAsset[]): void => {
  try {
    localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
  } catch (err) {
    console.warn('Failed to persist infrastructure assets:', err);
  }
};

/**
 * Updates an infrastructure asset's digital history whenever an incident or repair is linked.
 */
export const syncAssetWithIncidents = (
  asset: InfrastructureAsset,
  allIncidents: Incident[]
): InfrastructureAsset => {
  const linked = allIncidents.filter(
    (inc) => inc.infrastructureAssetId === asset.id || asset.linkedIncidentIds.includes(inc.id)
  );

  const damageCount = linked.length;
  const repairs = linked.filter((inc) => inc.status === 'resolved' || inc.status === 'archived');
  const repairCount = repairs.length;

  let recurrenceLevel: 'low' | 'medium' | 'high' = 'low';
  let recommendation = 'Asset structural integrity normal. Continue annual municipal visual audit.';

  if (damageCount >= 3 || (damageCount >= 2 && repairCount >= 1)) {
    recurrenceLevel = 'high';
    recommendation =
      'REPEATED STRUCTURAL FAILURE: Asset has experienced multiple failure cycles. Full sub-base reconstruction or comprehensive replacement recommended rather than superficial localized patching.';
  } else if (damageCount >= 1) {
    recurrenceLevel = 'medium';
    recommendation =
      'Moderate fatigue noted. Prioritize preventive surface sealing and post-monsoon drainage review.';
  }

  const latestRepair = repairs.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0];

  return {
    ...asset,
    linkedIncidentIds: linked.map((i) => i.id),
    damageHistoryCount: Math.max(asset.damageHistoryCount, damageCount),
    repairHistoryCount: Math.max(asset.repairHistoryCount, repairCount),
    lastRepairedAt: latestRepair ? latestRepair.updatedAt : asset.lastRepairedAt,
    recurrenceLevel,
    maintenanceRecommendation: recommendation,
  };
};
