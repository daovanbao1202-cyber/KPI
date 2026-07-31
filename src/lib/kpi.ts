export function calculateCompletion(actual: number, target: number, higherIsBetter = true): number {
  if (target === 0) return 0;
  let completion = (actual / target) * 100;
  if (!higherIsBetter) {
    completion = 200 - completion; // Simple inversion logic
  }
  return Math.max(0, parseFloat(completion.toFixed(1)));
}

export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(1));
}

import type { UserActual, UserTarget } from '@/context/KPIContext';

/** Sums recorded values. The field is `actualValue`, not `value`. */
export function aggregateActuals(actuals: UserActual[], kpiId: string, userIds?: number[]): number {
  return actuals
    .filter(a => a.kpiId === kpiId && (!userIds || userIds.includes(a.userId)))
    .reduce((sum, curr) => sum + (Number(curr.actualValue) || 0), 0);
}

/** Sums assigned targets. The field is `targetValue`, not `value`. */
export function aggregateTargets(targets: UserTarget[], kpiId: string, userIds?: number[]): number {
  return targets
    .filter(t => t.kpiId === kpiId && (!userIds || userIds.includes(t.userId)))
    .reduce((sum, curr) => sum + (Number(curr.targetValue) || 0), 0);
}
