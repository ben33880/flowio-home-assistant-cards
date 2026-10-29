import { expect,it } from 'vitest';
import { normalizeConfig } from '../src/model';
it('rejette tous les anciens champs de la synthèse',()=>{for(const config of [{entities:{}},{features:{}},{show_tanks:true},{treatment:'auto'},{measurements:['ph']}])expect(()=>normalizeConfig(config)).toThrow();});
it('valide les groupes, les rôles et les slots',()=>{for(const config of [{entity_prefix:'pool.bad'},{entity_prefix:24},{display:{unknown:[]}},{display:{equipment:['ph']}},{display:{setpoints:'orp_setpoint'}},{display:{tanks:['sensor.fio_data_117']}},{tank_slots:{ph:16}},{tank_slots:{disinfection:-1}}])expect(()=>normalizeConfig(config)).toThrow();});
it('accepte la désélection et déduplique',()=>{const c=normalizeConfig({display:{equipment:null,tanks:['ph_tank_percent','ph_tank_percent']}});expect(c.display.equipment).toEqual([]);expect(c.display.tanks).toEqual(['ph_tank_percent']);});
