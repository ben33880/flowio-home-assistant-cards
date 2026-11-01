import { describe, it, expect } from 'vitest';
import { historyPoints, historySummary, historyNumber, historyReference, historyUnit } from './history-data';

describe('historique numérique', () => {
  it('garde les lacunes et zéro, sans inventer des données', () => {
    const points = historyPoints(
      [[
        { state: '0', last_changed: '2026-10-29T00:00:00Z' },
        { state: 'unavailable', last_changed: '2026-10-29T01:00:00Z' },
        { state: '2', last_changed: '2026-10-29T02:00:00Z' }
      ]],
      'ph',
      '',
      0,
      Date.parse('2026-10-30T00:00:00Z')
    );
    expect(points.map(point => point[1])).toEqual([0, null, 2]);
    expect(historySummary(points)).toEqual({ min: 0, max: 2, mean: 1, count: 2 });
    expect(historySummary([])).toBeUndefined();
  });

  it('conserve les valeurs de pression et leur unité source sans convertir', () => {
    expect(historyUnit('pressure', 'psi')).toBe('psi');
    expect(historyUnit('pressure', 'bar')).toBe('bar');
    expect(historyNumber('pressure', '12.3', 'psi')).toBe(12.3);
    expect(historyNumber('pressure', '0.85', 'bar')).toBe(0.85);
    expect(historyNumber('orp', '690', 'mV')).toBe(690);
  });

  it('ne crée des zones de référence que pour la qualité pH et ORP', () => {
    expect(historyReference('pressure')).toHaveLength(0);
    expect(historyReference('orp').some(range => String(range[2]) === '#facc15')).toBe(false);
  });
});
