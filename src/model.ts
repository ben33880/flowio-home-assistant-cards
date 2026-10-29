export type Treatment = 'chlorine' | 'electrolysis' | 'oxygen' | 'none';
export type Feature = 'filtration' | 'ph_control' | 'heating' | 'robot' | 'lighting' | 'filling';
export type Role = 'water_temperature' | 'air_temperature' | 'ph' | 'ph_setpoint' | 'orp' | 'orp_setpoint' | 'pressure' | 'filtration' | 'ph_pump' | 'disinfection_pump' | 'electrolyzer' | 'heater' | 'robot' | 'lighting' | 'filling' | 'treatment_type' | 'alarm_active' | 'alarm_count' | 'ph_tank' | 'disinfection_tank';
export interface EntityState { state: string; attributes: Record<string, unknown>; }
export interface Hass { states: Record<string, EntityState>; callService(domain: string, service: string, data: Record<string, unknown>): Promise<unknown>; }
export interface PoolConfig { type: string; title?: string; treatment: Treatment | 'auto'; features: Record<Feature, boolean>; entities: Partial<Record<Role, string>>; show_tanks: boolean; }
export const FEATURES: ReadonlyArray<readonly [Feature, string]> = [['filtration', 'Filtration'], ['ph_control', 'Correction pH'], ['heating', 'Chauffage'], ['robot', 'Robot'], ['lighting', 'Éclairage'], ['filling', 'Remplissage']];
export const ROLES: ReadonlyArray<readonly [Role, string, string[]]> = [
  ['water_temperature', 'Température eau', ['sensor']], ['air_temperature', 'Température air', ['sensor']],
  ['ph', 'pH', ['sensor']], ['ph_setpoint', 'Consigne pH', ['number']], ['orp', 'ORP', ['sensor']], ['orp_setpoint', 'Consigne ORP', ['number']], ['pressure', 'Pression', ['sensor']],
  ['filtration', 'Filtration', ['switch']], ['ph_pump', 'Pompe pH', ['switch']], ['disinfection_pump', 'Pompe désinfection', ['switch']], ['electrolyzer', 'Électrolyseur', ['switch']],
  ['heater', 'Chauffage', ['switch']], ['robot', 'Robot', ['switch']], ['lighting', 'Éclairage', ['switch', 'light']], ['filling', 'Remplissage', ['switch']],
  ['treatment_type', 'Type de traitement annoncé', ['select']], ['alarm_active', 'Alarme globale', ['binary_sensor']], ['alarm_count', 'Nombre d’alarmes', ['sensor']], ['ph_tank', 'Cuve pH', ['sensor']], ['disinfection_tank', 'Cuve désinfection', ['sensor']]
];
const TREATMENTS = ['auto', 'chlorine', 'electrolysis', 'oxygen', 'none'];
function object(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Configuration objet attendue'); return value as Record<string, unknown>; }
export function normalizeConfig(input: unknown): PoolConfig {
  const raw = object(input);
  const treatment = raw.treatment ?? 'auto';
  if (!TREATMENTS.includes(String(treatment))) throw new Error('Traitement inconnu');
  if (raw.title !== undefined && typeof raw.title !== 'string') throw new Error('Titre invalide');
  if (raw.show_tanks !== undefined && typeof raw.show_tanks !== 'boolean') throw new Error('show_tanks doit être booléen');
  const supplied = raw.features === undefined ? {} : object(raw.features);
  const features = {} as Record<Feature, boolean>;
  for (const [key] of FEATURES) {
    const value = supplied[key] ?? (key === 'filtration');
    if (typeof value !== 'boolean') throw new Error(`Option ${key} invalide`);
    features[key] = value;
  }
  const suppliedEntities = raw.entities === undefined ? {} : object(raw.entities);
  const entities: Partial<Record<Role, string>> = {};
  for (const [key, , domains] of ROLES) {
    const id = suppliedEntities[key];
    if (id === undefined || id === '') continue;
    if (typeof id !== 'string' || !/^[a-z_]+\.[a-z0-9_]+$/.test(id) || !domains.includes(id.split('.')[0])) throw new Error(`Entité ${key} invalide`);
    entities[key] = id;
  }
  return { type: 'custom:flowio-pool-card', title: raw.title as string | undefined, treatment: treatment as PoolConfig['treatment'], features, entities, show_tanks: (raw.show_tanks as boolean | undefined) ?? false };
}
export function available(entity?: EntityState): entity is EntityState { return !!entity && !['unknown', 'unavailable', ''].includes(entity.state); }
export function parseTreatment(state?: string): Treatment | undefined {
  const key = state?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return ({ 'chlore/brome': 'chlorine', 'chlorine': 'chlorine', 'electrolyse': 'electrolysis', 'electrolysis': 'electrolysis', 'oxygene actif': 'oxygen', 'oxygen': 'oxygen', 'desactive': 'none', 'none': 'none' } as Record<string, Treatment>)[key ?? ''];
}
export function resolveTreatment(config: PoolConfig, hass: Hass) {
  const id = config.entities.treatment_type;
  const actual = id ? parseTreatment(hass.states[id]?.state) : undefined;
  return { selected: config.treatment === 'auto' ? actual : config.treatment, actual, mismatch: config.treatment !== 'auto' && actual !== undefined && actual !== config.treatment };
}
export const TREATMENT_LABELS: Record<Treatment, string> = { chlorine: 'Chlore / Brome liquide', electrolysis: 'Électrolyse', oxygen: 'Oxygène actif', none: 'Aucune désinfection automatique' };
