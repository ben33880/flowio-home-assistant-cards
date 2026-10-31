import type { Hass } from './model';

export const CALCULATED_VALUES = ['v00', 'v01', 'v02', 'v03', 'v04'] as const;
export type CalculatedValue = typeof CALCULATED_VALUES[number];

export const DEVICE_METRICS = [
  'requested', 'observed', 'compressor_out', 'compressor_in', 'water_in',
  'water_out', 'coil', 'ambient', 'ipm', 'voltage', 'current',
  'compressor_fault', 'control_word', 'temperature_setpoint'
] as const;
export type DeviceMetric = typeof DEVICE_METRICS[number];

export const DEVICE_METRIC_DEFINITIONS: Record<DeviceMetric, { id: number; label: string }> = {
  requested: { id: 0, label: 'Consigne demandée' },
  observed: { id: 1, label: 'Valeur relue' },
  compressor_out: { id: 17, label: 'Sortie compresseur' },
  compressor_in: { id: 18, label: 'Entrée compresseur' },
  water_in: { id: 19, label: 'Température entrée eau' },
  water_out: { id: 20, label: 'Température sortie eau' },
  coil: { id: 21, label: 'Échangeur' },
  ambient: { id: 22, label: 'Température ambiante' },
  ipm: { id: 23, label: 'IPM' },
  voltage: { id: 24, label: 'Tension' },
  current: { id: 25, label: 'Courant' },
  compressor_fault: { id: 26, label: 'Défaut compresseur' },
  control_word: { id: 27, label: 'Mot de commande' },
  temperature_setpoint: { id: 28, label: 'Consigne de température' }
};

export const OPERATIONS = [
  'refill_ph', 'refill_disinfection', 'reset_filtration', 'reset_ph',
  'reset_disinfection', 'reset_filling', 'reset_electrolyzer', 'reset_all',
  'timed_override'
] as const;
export type Operation = typeof OPERATIONS[number];

export const OPERATION_DEFINITIONS: Record<Operation, { entity: string; label: string; confirm: string }> = {
  refill_ph: { entity: 'pd_refill_ph', label: 'Remplir la cuve pH', confirm: 'Lancer le remplissage de la cuve pH ?' },
  refill_disinfection: { entity: 'pd_refill_chl', label: 'Remplir la cuve désinfectant', confirm: 'Lancer le remplissage de la cuve désinfectant ?' },
  reset_filtration: { entity: 'pd_reset_upt_flt', label: 'Réinitialiser la durée filtration', confirm: 'Remettre à zéro le compteur de filtration ?' },
  reset_ph: { entity: 'pd_reset_upt_ph', label: 'Réinitialiser la durée pompe pH', confirm: 'Remettre à zéro le compteur de la pompe pH ?' },
  reset_disinfection: { entity: 'pd_reset_upt_chl', label: 'Réinitialiser la durée désinfection', confirm: 'Remettre à zéro le compteur de désinfection ?' },
  reset_filling: { entity: 'pd_reset_upt_fill', label: 'Réinitialiser la durée remplissage', confirm: 'Remettre à zéro le compteur de remplissage ?' },
  reset_electrolyzer: { entity: 'pd_reset_upt_chl_gen', label: 'Réinitialiser la durée électrolyseur', confirm: 'Remettre à zéro le compteur de l’électrolyseur ?' },
  reset_all: { entity: 'pd_reset_upt_all', label: 'Réinitialiser toutes les durées', confirm: 'Remettre à zéro les compteurs de tous les équipements ?' },
  timed_override: { entity: '', label: 'Forçage temporaire', confirm: '' }
};

const SYSTEM_ENTITIES = [
  ['wifi_ip', 'Adresse IP'],
  ['wifi_mac', 'Adresse MAC'],
  ['wifi_rssi', 'Signal Wi-Fi'],
  ['sys_upt_mn', 'Temps de fonctionnement'],
  ['sys_hp_free', 'Mémoire libre'],
  ['sys_hp_min_free', 'Mémoire minimale libre'],
  ['sys_hp_frag', 'Fragmentation mémoire']
] as const;

export function calculatedValueId(prefix: string, value: CalculatedValue) {
  return `sensor.${prefix ? `${prefix}_` : ''}io_value_${value}`;
}

export function deviceMetricId(prefix: string, slot: number, metric: DeviceMetric) {
  return `sensor.${prefix ? `${prefix}_` : ''}data_${176 + slot * 32 + DEVICE_METRIC_DEFINITIONS[metric].id}`;
}

export function operationEntityId(prefix: string, operation: Operation) {
  const suffix = OPERATION_DEFINITIONS[operation].entity;
  return `button.${prefix ? `${prefix}_` : ''}${suffix}`;
}

export function systemEntityId(prefix: string, suffix: typeof SYSTEM_ENTITIES[number][0]) {
  return `sensor.${prefix ? `${prefix}_` : ''}${suffix}`;
}

export function overrideEntityIds(prefix: string) {
  const stem = prefix ? `${prefix}_` : '';
  return {
    target: `select.${stem}pdm_ovr_target`,
    duration: `number.${stem}pdm_ovr_min`,
    state: `sensor.${stem}pdm_ovr_state`,
    active: `sensor.${stem}pdm_ovr_active`,
    on: `button.${stem}pdm_ovr_on`,
    off: `button.${stem}pdm_ovr_off`,
    release: `button.${stem}pdm_ovr_release`
  };
}

export function calculatedBindings(prefix: string, values: readonly CalculatedValue[]) {
  return values.map(value => ({ id: calculatedValueId(prefix, value), label: `Valeur calculée ${value.toUpperCase()}` }));
}

export function deviceMetricBindings(prefix: string, slot: number, metrics: readonly DeviceMetric[]) {
  return metrics.map(metric => ({ id: deviceMetricId(prefix, slot, metric), label: DEVICE_METRIC_DEFINITIONS[metric].label }));
}

export function operationBindings(prefix: string, operations: readonly Operation[]) {
  return operations.flatMap(operation => operation === 'timed_override'
    ? Object.entries(overrideEntityIds(prefix)).map(([key, id]) => ({ id, label: `Forçage temporaire · ${key}` }))
    : [{ id: operationEntityId(prefix, operation), label: OPERATION_DEFINITIONS[operation].label }]);
}

export function systemBindings(prefix: string, groups: readonly string[]) {
  return SYSTEM_ENTITIES
    .filter(([suffix]) => suffix.startsWith('wifi_') ? groups.includes('network') : groups.includes('system'))
    .map(([suffix, label]) => ({ id: systemEntityId(prefix, suffix), label }));
}

export function overrideOptions(hass: Hass | undefined, prefix: string): string[] {
  const supplied = hass?.states[overrideEntityIds(prefix).target]?.attributes.options;
  return Array.isArray(supplied) ? supplied.filter((value): value is string => typeof value === 'string') : [];
}

export function canSelectOverride(hass: Hass | undefined, prefix: string, value: string) {
  const ids = overrideEntityIds(prefix);
  const state = hass?.states[ids.target];
  return !!state && !['unknown', 'unavailable', ''].includes(state.state) && overrideOptions(hass, prefix).includes(value);
}
