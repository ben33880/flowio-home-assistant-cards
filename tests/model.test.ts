import { describe,expect,it } from 'vitest';
import { normalizeConfig,idFor,resolveTreatment,canCommand,entityStatus,type Hass } from '../src/model';
const hass=(states:Record<string,string>):Hass=>({states:Object.fromEntries(Object.entries(states).map(([id,state])=>[id,{state,attributes:{}}])),callService:async()=>undefined});
describe('préfixe firmware',()=>{
  it('utilise fio par défaut',()=>{const c=normalizeConfig({});expect(c.entity_prefix).toBe('fio');expect(idFor(c,'ph')).toBe('sensor.fio_io_ph');expect(idFor(c,'filtration')).toBe('switch.fio_io_flt_pmp');expect('entities' in c).toBe(false);});
  it('normalise le préfixe sans changer les suffixes',()=>{const c=normalizeConfig({entity_prefix:' Piscine_ '});expect(idFor(c,'orp')).toBe('sensor.piscine_io_orp');});
  it('supporte explicitement aucun préfixe',()=>{expect(idFor(normalizeConfig({entity_prefix:''}),'ph')).toBe('sensor.io_ph');});
  it('résout les cuves depuis leurs slots',()=>{const c=normalizeConfig({tank_slots:{ph:9,disinfection:15}});expect(idFor(c,'ph_tank')).toBe('sensor.fio_data_130');expect(idFor(c,'disinfection_tank')).toBe('sensor.fio_data_142');});
  it('distingue absence et indisponibilité',()=>{expect(entityStatus(undefined)).toBe('Absente');expect(entityStatus({state:'unavailable',attributes:{}})).toBe('Indisponible');expect(entityStatus({state:'0',attributes:{}})).toBe('Présente');});
});
describe('traitement et commandes',()=>{
  it('lit uniquement le sélecteur correspondant au préfixe',()=>{const c=normalizeConfig({entity_prefix:'spa'});expect(resolveTreatment(c,hass({'select.fio_pl_modes_dis':'Chlore/Brome','select.spa_pl_modes_dis':'Oxygène actif'})).selected).toBe('oxygen');});
  it('ne remplace pas une entité par sa variante _2',()=>{expect(canCommand(normalizeConfig({}),hass({'switch.fio_io_flt_pmp_2':'on'}),'filtration')).toBe(false);});
  it('bloque un démarrage incohérent mais autorise un arrêt',()=>{const c=normalizeConfig({treatment:'chlorine'});expect(canCommand(c,hass({'select.fio_pl_modes_dis':'Electrolyse','switch.fio_io_chl_pmp':'off'}),'disinfection_pump')).toBe(false);expect(canCommand(c,hass({'select.fio_pl_modes_dis':'Electrolyse','switch.fio_io_chl_pmp':'on'}),'disinfection_pump')).toBe(true);});
  it('refuse la commande d’un équipement désactivé dans la présentation',()=>{expect(canCommand(normalizeConfig({features:{lighting:false}}),hass({'switch.fio_io_lights':'off'}),'lighting')).toBe(false);});
});
