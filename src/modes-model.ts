import type { Hass } from './model';

export const MODE_ITEMS = [
  'filtration_auto', 'winter', 'ph_auto', 'disinfection_auto', 'heater_auto',
  'disinfection_type', 'swg_control', 'ph_dose_plus', 'o2_temp_comp'
] as const;
export type Mode = typeof MODE_ITEMS[number];

interface Definition {
  domain: 'switch' | 'select';
  suffix: string;
  label: string;
  icon: string;
  equipment: readonly string[];
  advanced?: boolean;
  options?: readonly string[];
}

export const MODES: Record<Mode, Definition> = {
  filtration_auto: { domain: 'switch', suffix: 'pl_modes_auto', label: 'Filtration automatique', icon: 'mdi:calendar-clock', equipment: ['filtration'] },
  winter: { domain: 'switch', suffix: 'pl_modes_winter', label: 'Hivernage', icon: 'mdi:snowflake', equipment: ['filtration'] },
  ph_auto: { domain: 'switch', suffix: 'pl_ph_auto_mode', label: 'Régulation pH', icon: 'mdi:flask-outline', equipment: ['ph_pump'] },
  disinfection_auto: { domain: 'switch', suffix: 'pl_dis_auto', label: 'Régulation désinfection', icon: 'mdi:water-check-outline', equipment: ['disinfection_pump'] },
  heater_auto: { domain: 'switch', suffix: 'pl_heat_auto', label: 'Régulation chauffage', icon: 'mdi:radiator', equipment: ['heater'] },
  disinfection_type: { domain: 'select', suffix: 'pl_modes_dis', label: 'Type de désinfection', icon: 'mdi:water-outline', equipment: ['disinfection_pump'], advanced: true, options: ['Désactivé', 'Chlore/Brome', 'Electrolyse', 'Oxygène actif'] },
  swg_control: { domain: 'select', suffix: 'pl_swg_ctrl', label: 'Pilotage électrolyseur', icon: 'mdi:lightning-bolt-outline', equipment: ['disinfection_pump'], advanced: true, options: ['Suivi consigne ORP', 'Continu sur filtration'] },
  ph_dose_plus: { domain: 'switch', suffix: 'pl_ph_dose_plus', label: 'Utiliser pH+', icon: 'mdi:flask-plus-outline', equipment: ['ph_pump'], advanced: true },
  o2_temp_comp: { domain: 'switch', suffix: 'pl_o2_temp_comp', label: 'Compensation température O₂', icon: 'mdi:thermometer', equipment: ['disinfection_pump'], advanced: true }
};

export function visibleModes(selected: readonly Mode[], equipment: readonly string[], treatment?: string): Mode[] {
  return selected.filter(mode =>
    (mode !== 'swg_control' || treatment === 'electrolyzer') &&
    MODES[mode].equipment.some(role => equipment.includes(role))
  );
}

export function modeId(prefix: string, mode: Mode) {
  const definition = MODES[mode];
  return `${definition.domain}.${prefix ? `${prefix}_` : ''}${definition.suffix}`;
}

export function modeLabel(value: string) {
  return Object.prototype.hasOwnProperty.call(MODES, value) ? MODES[value as Mode].label : undefined;
}

export function modeOptions(hass: Hass | undefined, prefix: string, mode: Mode): string[] {
  const supplied = hass?.states[modeId(prefix, mode)]?.attributes.options;
  const allowed = MODES[mode].options ?? [];
  return Array.isArray(supplied)
    ? [...new Set(supplied.filter((value): value is string => typeof value === 'string' && allowed.includes(value)))]
    : [];
}

export function canSetMode(hass: Hass | undefined, prefix: string, mode: Mode, value: string) {
  const state = hass?.states[modeId(prefix, mode)];
  if (!state || ['unknown', 'unavailable', ''].includes(state.state)) return false;
  return MODES[mode].domain === 'switch'
    ? ['on', 'off'].includes(state.state) && ['on', 'off'].includes(value)
    : modeOptions(hass, prefix, mode).includes(state.state) && modeOptions(hass, prefix, mode).includes(value);
}
