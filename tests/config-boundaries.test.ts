import { expect,it } from 'vitest';
import { normalizeConfig,parseTreatment } from '../src/model';
it('rejette explicitement les anciennes associations',()=>{expect(()=>normalizeConfig({entities:{}})).toThrow('entities est supprimé');});
it('valide préfixe, booléens et slots',()=>{for(const config of [{entity_prefix:'pool.bad'},{entity_prefix:24},{features:{robot:'false'}},{tank_slots:{ph:16}},{tank_slots:{ph:-1}},{tank_slots:{ph:1.5}},{treatment:['chlorine']}])expect(()=>normalizeConfig(config)).toThrow();});
it('rejette les faux noms de mesures et traitements hérités',()=>{expect(()=>normalizeConfig({measurements:['sensor.fio_io_ph']})).toThrow();expect(parseTreatment('__proto__')).toBeUndefined();expect(parseTreatment('constructor')).toBeUndefined();});
