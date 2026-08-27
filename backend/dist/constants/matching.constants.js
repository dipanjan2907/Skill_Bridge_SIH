export const MATCH_THRESHOLDS = {
    EXCELLENT: { min: 80, max: 100, label: "Excellent Match" },
    STRONG: { min: 65, max: 79, label: "Strong Match" },
    MODERATE: { min: 50, max: 64, label: "Moderate Match" },
    LOW: { min: 0, max: 49, label: "Low Match" },
};
export const getMatchCategory = (score) => {
    if (score === null || score === undefined) {
        return "Match Unavailable";
    }
    if (score >= MATCH_THRESHOLDS.EXCELLENT.min) {
        return MATCH_THRESHOLDS.EXCELLENT.label;
    }
    if (score >= MATCH_THRESHOLDS.STRONG.min) {
        return MATCH_THRESHOLDS.STRONG.label;
    }
    if (score >= MATCH_THRESHOLDS.MODERATE.min) {
        return MATCH_THRESHOLDS.MODERATE.label;
    }
    return MATCH_THRESHOLDS.LOW.label;
};
