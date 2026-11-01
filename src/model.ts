import {
  configObject,
  normalizePrefix,
  entityId,
  MEASUREMENTS,
  roleLabel,
  type Role,
  type TankSlots
} from './entities';
import { normalizeVisuals, type Visuals } from './gauge-model';
import {
  TIMING_ITEMS,
  normalizeRuntimeSlots,
  timingBindings,
  type RuntimeSlots
} from './timing-model';
import { MODE_ITEMS, MODES, modeId, treatmentFromFirmware, visibleModes, type Treatment } from './modes-model';
import { INJECTION_ITEMS, injectionBindings } from './injection-model';
import {
  CALCULATED_VALUES,
  DEVICE_METRICS,
  OPERATIONS,
  calculatedBindings,
  deviceMetricBindings,
  operationBindings,
  systemBindings,
  type Operation
} from './firmware-model';

export type { Role } from './entities';
export interface EntityState {
  state: string;
  attributes: Record<string, unknown>;
}
export interface Hass {
  states: Record<string, EntityState>;
  callService(domain: string, service: string, data: Record<string, unknown>): Promise<unknown>;
}

export const DISPLAY_OPTIONS = {
  measurements: MEASUREMENTS,
  injections: INJECTION_ITEMS,
  setpoints: ['ph_setpoint', 'orp_setpoint'],
  equipment: ['filtration', 'ph_pump', 'disinfection_pump', 'heater', 'robot', 'lighting', 'filling'],
  modes: MODE_ITEMS,
  tanks: ['ph_tank', 'ph_tank_percent', 'disinfection_tank', 'disinfection_tank_percent'],
  information: ['treatment_type', 'alarm_active', 'alarm_count', 'diagnostics', 'network', 'system'],
  timing: TIMING_ITEMS,
  calculated_values: CALCULATED_VALUES,
  device_metrics: DEVICE_METRICS,
  operations: OPERATIONS
} as const;

export type DisplayGroup = keyof typeof DISPLAY_OPTIONS;
export type DisplayConfig = {
  [K in DisplayGroup]: Array<(typeof DISPLAY_OPTIONS)[K][number]>
};
export interface PoolConfig {
  type: string;
  title: string;
  entity_prefix: string;
  grid_options?: Record<string, unknown>;
  display: DisplayConfig;
  tank_slots: TankSlots;
  runtime_slots: RuntimeSlots;
  device_slot: number;
  visuals: Visuals;
}

export const GROUP_LABELS: Record<DisplayGroup, string> = {
  measurements: 'Mesures',
  injections: 'Volumes injectés · estimations du jour',
  setpoints: 'Consignes',
  equipment: 'Équipements',
  modes: 'Modes et stratégie de traitement',
  tanks: 'Cuves · litres et pourcentages',
  information: 'Informations et diagnostic',
  timing: 'Horaires et temps de marche',
  calculated_values: 'Valeurs calculées',
  device_metrics: 'Télémétrie équipement',
  operations: 'Actions et forçage temporaire'
};

function selection<T extends string>(
  value: unknown,
  choices: readonly T[],
  defaults: readonly T[]
): T[] {
  if (value === undefined) return [...defaults];
  if (value === null) return [];
  if (!Array.isArray(value) || value.some(v => typeof v !== 'string' || !(choices as readonly string[]).includes(v))) {
    throw new Error('Élément d’affichage inconnu ou groupe invalide');
  }
  return [...new Set(value)] as T[];
}

export function normalizeConfig(input: unknown): PoolConfig {
  const raw = configObject(input);
  for (const key of ['features', 'show_tanks', 'treatment', 'measurements']) {
    if (key in raw) throw new Error(`Le champ ${key} est supprimé de la synthèse. Utiliser display ; recréer la configuration.`);
  }

  const title = raw.title ?? 'Supervision & pilotage';
  if (typeof title !== 'string') throw new Error('Titre invalide');
  const grid_options = raw.grid_options === undefined ? undefined : configObject(raw.grid_options);
  const d = raw.display === undefined ? {} : configObject(raw.display);
  for (const key of Object.keys(d)) {
    if (key !== 'treatment' && !Object.prototype.hasOwnProperty.call(DISPLAY_OPTIONS, key)) {
      throw new Error(`Groupe display inconnu : ${key}`);
    }
  }

  const display: DisplayConfig = {
    measurements: selection(d.measurements, DISPLAY_OPTIONS.measurements, DISPLAY_OPTIONS.measurements),
    injections: selection(d.injections, INJECTION_ITEMS, INJECTION_ITEMS),
    setpoints: selection(d.setpoints, DISPLAY_OPTIONS.setpoints, DISPLAY_OPTIONS.setpoints),
    equipment: selection(d.equipment, [...DISPLAY_OPTIONS.equipment, 'electrolyzer'], DISPLAY_OPTIONS.equipment)
      .filter(role => role !== 'electrolyzer'),
    modes: selection(d.modes, MODE_ITEMS, MODE_ITEMS),
    tanks: selection(d.tanks, DISPLAY_OPTIONS.tanks, DISPLAY_OPTIONS.tanks),
    information: selection(d.information, DISPLAY_OPTIONS.information, DISPLAY_OPTIONS.information),
    timing: selection(d.timing, DISPLAY_OPTIONS.timing, DISPLAY_OPTIONS.timing),
    calculated_values: selection(d.calculated_values, CALCULATED_VALUES, CALCULATED_VALUES),
    device_metrics: selection(d.device_metrics, DEVICE_METRICS, DEVICE_METRICS),
    operations: selection(d.operations, OPERATIONS, OPERATIONS)
  };

  const supplied = raw.tank_slots === undefined ? {} : configObject(raw.tank_slots);
  const tank_slots = {} as TankSlots;
  for (const key of ['ph', 'disinfection'] as const) {
    const n = supplied[key] ?? (key === 'ph' ? 1 : 2);
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 15) {
      throw new Error('Slot de cuve attendu entre 0 et 15');
    }
    tank_slots[key] = n;
  }

  const device_slot = raw.device_slot ?? 0;
  if (typeof device_slot !== 'number' || !Number.isInteger(device_slot) || device_slot < 0 || device_slot > 15) {
    throw new Error('Slot équipement attendu entre 0 et 15');
  }

  return {
    type: 'custom:flowio-pool-card',
    title,
    entity_prefix: normalizePrefix(raw.entity_prefix),
    ...(grid_options ? { grid_options } : {}),
    display,
    tank_slots,
    runtime_slots: normalizeRuntimeSlots(raw.runtime_slots),
    device_slot,
    visuals: normalizeVisuals(raw.visuals)
  };
}

export function firmwareOperation(c: PoolConfig, operation: Operation, treatment?: Treatment): Operation {
  return treatment === 'electrolyzer' && operation === 'reset_disinfection'
    ? 'reset_electrolyzer'
    : operation;
}

export function configuredOperations(c: PoolConfig, treatment?: Treatment): Operation[] {
  return [...new Set(c.display.operations
    .filter(operation => {
      if (operation === 'refill_disinfection') return treatment === 'chlorine_bromine' || treatment === 'oxygen';
      if (operation === 'reset_disinfection') return treatment !== undefined && treatment !== 'disabled';
      if (operation === 'reset_electrolyzer') return treatment === 'electrolyzer';
      return true;
    })
    .map(operation => firmwareOperation(c, operation, treatment)))];
}

export function inlineOperations(c: PoolConfig, treatment?: Treatment): Operation[] {
  return treatment === 'electrolyzer' && c.display.operations.includes('reset_disinfection')
    ? ['reset_electrolyzer']
    : [];
}

export function idFor(c: PoolConfig, role: Role) {
  return entityId(c.entity_prefix, role, c.tank_slots);
}

export function equipmentTargetRole(c: PoolConfig, role: Role, treatment?: Treatment): Role {
  return role === 'disinfection_pump' && treatment === 'electrolyzer'
    ? 'electrolyzer'
    : role;
}

export function available(s?: EntityState): s is EntityState {
  return !!s && !['unknown', 'unavailable', ''].includes(s.state);
}

export function entityStatus(s?: EntityState) {
  return !s ? 'Absente' : available(s) ? 'Présente' : 'Indisponible';
}

export function tankPercent(s?: EntityState): number | undefined {
  if (!available(s) || !s.state.trim()) return undefined;
  const n = Number(s.state);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : undefined;
}

export function expectedRoles(c: PoolConfig, treatment?: Treatment): Role[] {
  type Info = Exclude<DisplayConfig['information'][number], 'diagnostics' | 'network' | 'system'>;
  return [...new Set<Role>([
    ...c.display.measurements,
    ...c.display.setpoints,
    ...c.display.equipment
      .filter(role => role !== 'disinfection_pump' || treatment === 'electrolyzer' || treatment === 'chlorine_bromine' || treatment === 'oxygen')
      .map(role => equipmentTargetRole(c, role, treatment)),
    ...c.display.tanks,
    ...c.display.information.filter((r): r is Info => r !== 'diagnostics' && r !== 'network' && r !== 'system')
  ])];
}

export function expectedBindings(c: PoolConfig, hass?: Hass) {
  const treatment = treatmentFromFirmware(hass, c.entity_prefix);
  const all = [
    ...expectedRoles(c, treatment).map(role => ({ id: idFor(c, role), label: roleLabel(role) })),
    ...c.display.injections
      .filter(item => item !== 'disinfection_injected' ||
        treatment === 'chlorine_bromine' || treatment === 'oxygen')
      .flatMap(item => injectionBindings(c.entity_prefix, c.runtime_slots, item)),
    ...visibleModes(c.display.modes, c.display.equipment, treatment).map(mode => ({ id: modeId(c.entity_prefix, mode), label: MODES[mode].label })),
    ...c.display.timing.flatMap(item => timingBindings(c.entity_prefix, c.runtime_slots, item)),
    ...calculatedBindings(c.entity_prefix, c.display.calculated_values),
    ...deviceMetricBindings(c.entity_prefix, c.device_slot, c.display.device_metrics),
    ...operationBindings(c.entity_prefix, configuredOperations(c, treatment)),
    ...systemBindings(c.entity_prefix, c.display.information, c.device_slot)
  ];
  if (c.display.equipment.includes('disinfection_pump') ||
      c.display.injections.includes('disinfection_injected') ||
      c.display.modes.some(mode => ['disinfection_auto', 'disinfection_type', 'swg_control', 'o2_temp_comp'].includes(mode)) ||
      c.display.operations.some(operation => ['refill_disinfection', 'reset_disinfection', 'reset_electrolyzer'].includes(operation))) {
    all.push({ id: modeId(c.entity_prefix, 'disinfection_type'), label: MODES.disinfection_type.label });
  }
  return all.filter((item, index) => all.findIndex(other => other.id === item.id) === index);
}

export function canCommand(c: PoolConfig, hass: Hass, role: Role): boolean {
  if (!(c.display.equipment as readonly Role[]).includes(role)) return false;
  const treatment = treatmentFromFirmware(hass, c.entity_prefix);
  if (role === 'disinfection_pump' && (!treatment || treatment === 'disabled')) return false;
  const s = hass.states[idFor(c, equipmentTargetRole(c, role, treatment))];
  return available(s) && ['on', 'off'].includes(s.state);
}
