export const DEMAND_THRESHOLDS = {
  HIGH: { min: 80, label: "High Demand" },
  STRONG: { min: 60, label: "Strong Demand" },
  MODERATE: { min: 40, label: "Moderate Demand" },
  EMERGING: { min: 0, label: "Emerging Demand" },
} as const;

export const getDemandLevel = (demandPercentage: number): string => {
  if (demandPercentage >= DEMAND_THRESHOLDS.HIGH.min) {
    return DEMAND_THRESHOLDS.HIGH.label;
  }
  if (demandPercentage >= DEMAND_THRESHOLDS.STRONG.min) {
    return DEMAND_THRESHOLDS.STRONG.label;
  }
  if (demandPercentage >= DEMAND_THRESHOLDS.MODERATE.min) {
    return DEMAND_THRESHOLDS.MODERATE.label;
  }
  return DEMAND_THRESHOLDS.EMERGING.label;
};
