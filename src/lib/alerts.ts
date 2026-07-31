import { aggregateActuals, aggregateTargets } from './kpi';
import type { KPIDefinition, User, UserActual, UserTarget } from '@/context/KPIContext';

export interface Alert {
  id: string;
  kpiName: string;
  message: string;
  type: 'warning' | 'critical' | 'info' | 'success';
  timestamp: Date;
  read: boolean;
}

export interface UnderperformingUser {
  user: User;
  completion: number;
}

/**
 * Overall completion for one user across the given KPIs, as a percentage.
 * Returns null when the user has no target assigned, so callers can tell
 * "nothing assigned" apart from "0% achieved".
 */
export function calculateUserCompletion(
  user: User,
  kpis: KPIDefinition[],
  actuals: UserActual[],
  targets: UserTarget[]
): number | null {
  let totalActual = 0;
  let totalTarget = 0;

  for (const kpi of kpis) {
    totalActual += aggregateActuals(actuals, kpi.id, [user.id]);
    totalTarget += aggregateTargets(targets, kpi.id, [user.id]);
  }

  if (totalTarget <= 0) return null;
  return (totalActual / totalTarget) * 100;
}

/**
 * Users whose overall completion falls below `threshold` percent.
 *
 * This replaces a placeholder that used `Math.random()` to decide who was
 * underperforming and then emailed them about it.
 */
export function findUnderperformingUsers(
  users: User[],
  kpis: KPIDefinition[],
  actuals: UserActual[],
  targets: UserTarget[],
  threshold = 80
): UnderperformingUser[] {
  const result: UnderperformingUser[] = [];

  for (const user of users) {
    const completion = calculateUserCompletion(user, kpis, actuals, targets);
    if (completion !== null && completion < threshold) {
      result.push({ user, completion });
    }
  }

  return result;
}

export function checkThresholds(
  kpis: { id: string; name: string; actual?: number; target?: number }[]
): Alert[] {
  const alerts: Alert[] = [];

  kpis.forEach(kpi => {
    if (kpi.actual === undefined || kpi.target === undefined || kpi.target === 0) return;

    const higherIsBetter = kpi.name !== 'Customer Churn';
    const completion = higherIsBetter
      ? (kpi.actual / kpi.target) * 100
      : (kpi.target / kpi.actual) * 100;

    if (completion < 80) {
      alerts.push({
        id: `alert-crit-${kpi.id}-${Date.now()}`,
        kpiName: kpi.name,
        message: `Critical: "${kpi.name}" is only at ${completion.toFixed(1)}%! Immediate action required.`,
        type: 'critical',
        timestamp: new Date(),
        read: false
      });
    } else if (completion < 95) {
      alerts.push({
        id: `alert-warn-${kpi.id}-${Date.now()}`,
        kpiName: kpi.name,
        message: `Warning: "${kpi.name}" is falling behind target (${completion.toFixed(1)}%).`,
        type: 'warning',
        timestamp: new Date(),
        read: false
      });
    }
  });

  return alerts;
}
