import { expect, it } from 'vitest';
import { normalizeConfig, expectedBindings } from '../src/model';
import { normalizeHistoryConfig, nativeHistoryConfigs } from '../src/history-model';
import { canSelectOverride, overrideOptions, overrideEntityIds } from '../src/firmware-model';

it('construit les entités calculées, équipement, réseau et système documentées par le firmware', () => {
  const config = normalizeConfig({
    device_slot: 3,
    display: {
      calculated_values: ['v02'],
      device_metrics: ['water_in', 'current'],
      information: ['network', 'system']
    }
  });
  const ids = expectedBindings(config).map(binding => binding.id);
  expect(ids).toContain('sensor.fio_io_value_v02');
  expect(ids).toContain('sensor.fio_data_291');
  expect(ids).toContain('sensor.fio_data_296');
  expect(ids).toContain('sensor.fio_data_297');
  expect(ids).toContain('sensor.fio_wifi_ip');
  expect(ids).toContain('sensor.fio_wifi_rssi');
  expect(ids).toContain('sensor.fio_sys_upt_mn');
  expect(ids).toContain('sensor.fio_sys_hp_frag');
});

it('inclut la tension et le courant du slot sélectionné dans le système', () => {
  const bindings = expectedBindings(normalizeConfig({
    device_slot: 4,
    display: { device_metrics: [], information: ['system'] }
  }));
  expect(bindings).toContainEqual({ id: 'sensor.fio_data_328', label: 'Tension', unit: 'V' });
  expect(bindings).toContainEqual({ id: 'sensor.fio_data_329', label: 'Courant', unit: 'A' });
});

it('expose uniquement les opérations sélectionnées et vérifie les slots', () => {
  const ids = expectedBindings(normalizeConfig({
    display: { operations: ['refill_ph', 'timed_override'] }
  })).map(binding => binding.id);
  expect(ids).toContain('button.fio_pd_refill_ph');
  expect(ids).toContain('select.fio_pdm_ovr_target');
  expect(ids).toContain('number.fio_pdm_ovr_min');
  expect(ids).toContain('button.fio_pdm_ovr_on');
  expect(ids).not.toContain('button.fio_pd_reset_upt_all');
  expect(() => normalizeConfig({ device_slot: 16 })).toThrow();
  expect(() => normalizeConfig({ display: { operations: ['unknown'] } })).toThrow();
  expect(() => normalizeConfig({ display: { device_metrics: ['unknown'] } })).toThrow();
});

it('redirige les actions désinfection vers les actions électrolyse selon le sélecteur firmware', () => {
  const bindings = expectedBindings(normalizeConfig({
    display: { operations: ['refill_disinfection', 'reset_disinfection'] }
  }), { states: { 'select.fio_pl_modes_dis': { state: 'Electrolyse', attributes: {} } }, callService: async () => undefined }).map(binding => binding.id);
  expect(bindings).toContain('button.fio_pd_reset_upt_chl_gen');
  expect(bindings).not.toContain('button.fio_pd_reset_upt_chl');
  expect(bindings).not.toContain('button.fio_pd_refill_chl');
});

it('n’inclut pas les actions de désinfection si le mode firmware est inconnu', () => {
  const bindings = expectedBindings(normalizeConfig({
    display: { operations: ['refill_disinfection', 'reset_disinfection'] }
  })).map(binding => binding.id);
  expect(bindings).toContain('select.fio_pl_modes_dis');
  expect(bindings).not.toContain('button.fio_pd_reset_upt_chl');
  expect(bindings).not.toContain('button.fio_pd_refill_chl');
});

it('garde les actions chimiques pour le chlore/brome et l’oxygène actif', () => {
  const config = normalizeConfig({ display: { operations: ['refill_disinfection', 'reset_disinfection'] } });
  for (const treatment of ['Chlore/Brome', 'Oxygène actif']) {
    const bindings = expectedBindings(config, {
      states: { 'select.fio_pl_modes_dis': { state: treatment, attributes: {} } },
      callService: async () => undefined
    }).map(binding => binding.id);
    expect(bindings).toContain('button.fio_pd_reset_upt_chl');
    expect(bindings).toContain('button.fio_pd_refill_chl');
    expect(bindings).not.toContain('button.fio_pd_reset_upt_chl_gen');
  }
});

it('ne propose les cibles de forçage que si le sélecteur firmware les annonce', () => {
  const entityId = overrideEntityIds('fio').target;
  const hass = {
    states: {
      [entityId]: { state: 'pd1', attributes: { options: ['pd0', 'pd1'] } }
    },
    callService: async () => undefined
  };
  expect(overrideOptions(hass, 'fio')).toEqual(['pd0', 'pd1']);
  expect(canSelectOverride(hass, 'fio', 'pd1')).toBe(true);
  expect(canSelectOverride(hass, 'fio', 'pd2')).toBe(false);
  expect(canSelectOverride(undefined, 'fio', 'pd1')).toBe(false);
});

it('ajoute les valeurs calculées aux historiques sans modifier les mesures', () => {
  const config = normalizeHistoryConfig({
    entity_prefix: 'spa',
    measurements: ['ph'],
    calculated_values: ['v00', 'v04', 'v00']
  });
  expect(config.calculated_values).toEqual(['v00', 'v04']);
  expect(nativeHistoryConfigs(config)).toEqual([
    { type: 'history-graph', entities: ['sensor.spa_io_ph'], hours_to_show: 24 },
    { type: 'history-graph', entities: ['sensor.spa_io_value_v00'], hours_to_show: 24 },
    { type: 'history-graph', entities: ['sensor.spa_io_value_v04'], hours_to_show: 24 }
  ]);
  expect(() => normalizeHistoryConfig({ calculated_values: ['v05'] })).toThrow();
});
