import { describe, expect, it } from 'vitest';
import { available, normalizeConfig, parseTreatment, resolveTreatment, type Hass } from '../src/model';
const hass = (state: string): Hass => ({ states: { 'select.mode': { state, attributes: {} } }, callService: async () => undefined });
describe('configuration', () => {
  it('ne devine aucune entité', () => { const c = normalizeConfig({}); expect(c.entities).toEqual({}); expect(c.treatment).toBe('auto'); expect(c.features.heating).toBe(false); });
  it('refuse les configurations ambiguës', () => { expect(() => normalizeConfig({ features: { robot: 'false' } })).toThrow(); expect(() => normalizeConfig({ entities: { filtration: 'sensor.pump' } })).toThrow(); expect(() => normalizeConfig({ treatment: 'salt' })).toThrow(); });
  it('préserve un choix explicite', () => { expect(normalizeConfig({ treatment: 'chlorine', features: { filtration: false } }).features.filtration).toBe(false); });
  it('ne confond pas indisponibilité et zéro', () => { expect(available({ state: '0', attributes: {} })).toBe(true); expect(available({ state: 'unavailable', attributes: {} })).toBe(false); expect(available(undefined)).toBe(false); });
});
describe('traitement', () => {
  it('reconnaît les libellés Flow.io', () => { expect(parseTreatment('Electrolyse')).toBe('electrolysis'); expect(parseTreatment('Oxygène actif')).toBe('oxygen'); expect(parseTreatment('Désactivé')).toBe('none'); expect(parseTreatment('Chlore/Brome')).toBe('chlorine'); });
  it('ne prend pas un état inconnu pour du chlore', () => { expect(parseTreatment('unavailable')).toBeUndefined(); expect(resolveTreatment(normalizeConfig({}), hass('Chlore/Brome')).selected).toBeUndefined(); });
  it('suit le contrôleur uniquement si associé', () => { const c = normalizeConfig({ entities: { treatment_type: 'select.mode' } }); expect(resolveTreatment(c, hass('Oxygène actif')).selected).toBe('oxygen'); });
  it('détecte le désaccord sans modifier le contrôleur', () => { const c = normalizeConfig({ treatment: 'chlorine', entities: { treatment_type: 'select.mode' } }); expect(resolveTreatment(c, hass('Electrolyse')).mismatch).toBe(true); });
});
