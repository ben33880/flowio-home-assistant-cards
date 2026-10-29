import { expect, it } from 'vitest';
import { normalizeConfig, parseTreatment } from '../src/model';
it('accepte une association effacée par le sélecteur HA', () => { expect(normalizeConfig({ entities: { filtration: null } }).entities.filtration).toBeUndefined(); });
it('refuse un tableau même si sa conversion texte ressemble à un traitement', () => { expect(() => normalizeConfig({ treatment: ['chlorine'] })).toThrow(); });
it('ignore les propriétés héritées dans les états de traitement', () => { expect(parseTreatment('__proto__')).toBeUndefined(); expect(parseTreatment('constructor')).toBeUndefined(); });
