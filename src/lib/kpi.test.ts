import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { aggregateActuals, aggregateTargets, calculateCompletion, calculateTrend } from './kpi.ts';

/**
 * Regression cover for a defect found during the audit: both aggregates read a
 * `value` field that no record has, so every call returned 0 no matter what
 * the data said.
 */
describe('aggregation', () => {
  const actuals = [
    { id: 'a1', kpiId: 'k1', userId: 1, date: '2026-01-01', actualValue: 10 },
    { id: 'a2', kpiId: 'k1', userId: 2, date: '2026-01-01', actualValue: 5 },
    { id: 'a3', kpiId: 'k2', userId: 1, date: '2026-01-01', actualValue: 99 },
  ];

  const targets = [
    { id: 't1', kpiId: 'k1', userId: 1, targetValue: 20 },
    { id: 't2', kpiId: 'k1', userId: 2, targetValue: 30 },
    { id: 't3', kpiId: 'k2', userId: 1, targetValue: 99 },
  ];

  test('sums actuals for one KPI across users', () => {
    assert.equal(aggregateActuals(actuals, 'k1'), 15);
  });

  test('sums targets for one KPI across users', () => {
    assert.equal(aggregateTargets(targets, 'k1'), 50);
  });

  test('restricts to the given users', () => {
    assert.equal(aggregateActuals(actuals, 'k1', [1]), 10);
    assert.equal(aggregateTargets(targets, 'k1', [2]), 30);
  });

  test('returns 0 for a KPI with no records', () => {
    assert.equal(aggregateActuals(actuals, 'unknown'), 0);
    assert.equal(aggregateTargets(targets, 'unknown'), 0);
  });
});

describe('completion', () => {
  test('is a percentage of target', () => {
    assert.equal(calculateCompletion(50, 100), 50);
    assert.equal(calculateCompletion(100, 100), 100);
  });

  test('does not divide by a zero target', () => {
    assert.equal(calculateCompletion(10, 0), 0);
  });

  test('never reports a negative figure', () => {
    assert.ok(calculateCompletion(500, 100, false) >= 0);
  });
});

describe('trend', () => {
  test('is the change against the previous period', () => {
    assert.equal(calculateTrend(150, 100), 50);
    assert.equal(calculateTrend(50, 100), -50);
  });

  test('does not divide by a zero baseline', () => {
    assert.equal(calculateTrend(10, 0), 0);
  });
});
