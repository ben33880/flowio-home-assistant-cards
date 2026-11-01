import { expect,it } from 'vitest';
import { normalizeHistoryConfig,nativeHistoryConfigs } from '../src/history-model';
import { MEASUREMENTS } from '../src/entities';
import { CALCULATED_VALUES } from '../src/firmware-model';
it('sélectionne par défaut toutes les mesures et valeurs calculées des historiques',()=>{const config=normalizeHistoryConfig({});expect(config.measurements).toEqual(MEASUREMENTS);expect(config.calculated_values).toEqual(CALCULATED_VALUES);});
it('construit des graphiques depuis les mesures métier',()=>{expect(nativeHistoryConfigs(normalizeHistoryConfig({entity_prefix:'spa',hours_to_show:48,measurements:['ph','orp'],calculated_values:[]}))).toEqual([{type:'history-graph',entities:['sensor.spa_io_ph'],hours_to_show:48},{type:'history-graph',entities:['sensor.spa_io_orp'],hours_to_show:48}]);});
it('accepte des listes vides et déduplique',()=>{expect(nativeHistoryConfigs(normalizeHistoryConfig({measurements:[],calculated_values:[]}))).toEqual([]);expect(normalizeHistoryConfig({measurements:['ph','ph']}).measurements).toEqual(['ph']);});
it('rejette les anciens identifiants manuels',()=>{expect(()=>normalizeHistoryConfig({entities:['sensor.fio_io_ph']})).toThrow('entities est supprimé');expect(()=>normalizeHistoryConfig({measurements:['sensor.fio_io_ph']})).toThrow();});
it('refuse les durées invalides',()=>{for(const hours_to_show of [0,169,1.5,'24',NaN])expect(()=>normalizeHistoryConfig({hours_to_show})).toThrow();});
