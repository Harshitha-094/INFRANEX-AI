import { ThresholdConfig } from '../types';
import { INITIAL_THRESHOLDS } from '../data/mockData';

const THRESHOLDS_STORAGE_KEY = 'infranex_threshold_configs_v1';

export interface ThresholdEvaluationResult {
  ruleKey: string;
  ruleLabel: string;
  observedValue: number;
  thresholdValue: number;
  unit: string;
  isExceeded: boolean;
  explanation: string;
  recommendedAction: string;
  requiresHumanValidation: boolean;
}

export const loadStoredThresholds = (): ThresholdConfig[] => {
  try {
    const raw = localStorage.getItem(THRESHOLDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load threshold configs from storage, falling back to defaults:', err);
  }
  return INITIAL_THRESHOLDS;
};

export const saveStoredThresholds = (thresholds: ThresholdConfig[]): void => {
  try {
    localStorage.setItem(THRESHOLDS_STORAGE_KEY, JSON.stringify(thresholds));
  } catch (err) {
    console.warn('Failed to persist threshold configs:', err);
  }
};

export const evaluateThresholdRule = (
  thresholds: ThresholdConfig[],
  ruleKey: string,
  observedValue: number
): ThresholdEvaluationResult => {
  const config = thresholds.find((t) => t.key === ruleKey) ||
    INITIAL_THRESHOLDS.find((t) => t.key === ruleKey);

  if (!config) {
    return {
      ruleKey,
      ruleLabel: 'Unknown Threshold Rule',
      observedValue,
      thresholdValue: 0,
      unit: '',
      isExceeded: false,
      explanation: `No configured threshold found for key '${ruleKey}'.`,
      recommendedAction: 'Manual inspection required.',
      requiresHumanValidation: true,
    };
  }

  const isExceeded = observedValue >= config.value;

  let recommendedAction = 'Maintain standard monitoring schedule.';
  if (isExceeded) {
    switch (ruleKey) {
      case 'GARBAGE_ACCUMULATION_COVERAGE_PCT':
        recommendedAction = 'Trigger automated municipal waste incident or link to existing chronic accumulation ticket. Dispatch BBMP solid waste marshal.';
        break;
      case 'AI_CONFIDENCE_GATE_PCT':
        recommendedAction = 'Proceed case to authorized Field Officer verification queue. Mandatory human signoff required.';
        break;
      case 'RECURRENCE_CONFIRMED_EVENTS_GATE':
        recommendedAction = 'Escalate site to BBMP Special Commissioner & Ward Executive Engineer for habitual public nuisance enforcement.';
        break;
      case 'EMERGENCY_SLA_HOURS':
        recommendedAction = 'Flag SLA breach warning. Re-route alert to nodal zonal officer.';
        break;
      default:
        recommendedAction = 'Initiate priority review workflow.';
    }
  }

  const explanation = isExceeded
    ? `Observed ${observedValue}${config.unit} met or crossed configured threshold (${config.value}${config.unit}).`
    : `Observed ${observedValue}${config.unit} is within safe operational limit (${config.value}${config.unit}).`;

  return {
    ruleKey: config.key,
    ruleLabel: config.label,
    observedValue,
    thresholdValue: config.value,
    unit: config.unit,
    isExceeded,
    explanation,
    recommendedAction,
    requiresHumanValidation: true, // Core safety rule: human validation is always mandatory
  };
};
