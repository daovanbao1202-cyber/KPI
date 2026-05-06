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

export function aggregateActuals(actuals: any[], kpiId: string, userIds?: number[]): number {
  return actuals
    .filter(a => a.kpiId === kpiId && (!userIds || userIds.includes(a.userId)))
    .reduce((sum, curr) => sum + (curr.value || 0), 0);
}

export function aggregateTargets(targets: any[], kpiId: string, userIds?: number[]): number {
  return targets
    .filter(t => t.kpiId === kpiId && (!userIds || userIds.includes(t.userId)))
    .reduce((sum, curr) => sum + (curr.value || 0), 0);
}
