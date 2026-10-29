import { expect, it } from 'vitest';
import { normalizeHistoryConfig, nativeHistoryConfigs } from '../src/history-model';
it('permet une carte vide à configurer sans entités inventées', () => { const c=normalizeHistoryConfig({}); expect(c.entities).toEqual([]); expect(c.hours_to_show).toBe(24); });
it('construit un graphique par mesure sans mélanger les échelles', () => { expect(nativeHistoryConfigs(normalizeHistoryConfig({hours_to_show:48,entities:['sensor.ph','sensor.orp']}))).toEqual([{type:'history-graph',entities:['sensor.ph'],hours_to_show:48},{type:'history-graph',entities:['sensor.orp'],hours_to_show:48}]); });
it('refuse les durées invalides', () => { for (const hours_to_show of [0,169,1.5,'24',NaN]) expect(()=>normalizeHistoryConfig({hours_to_show})).toThrow(); });
it('refuse des commandes à la place de mesures', () => { expect(()=>normalizeHistoryConfig({entities:['switch.pump']})).toThrow(); expect(()=>normalizeHistoryConfig({entities:'sensor.ph'})).toThrow(); });
it('déduplique les entités', () => { expect(normalizeHistoryConfig({entities:['sensor.ph','sensor.ph']}).entities).toEqual(['sensor.ph']); });
it('borne le nombre de graphiques', () => { expect(()=>normalizeHistoryConfig({entities:Array.from({length:7},(_,i)=>`sensor.test_${i}`)})).toThrow(); });
