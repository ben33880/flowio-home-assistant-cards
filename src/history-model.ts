export interface HistoryConfig { type: 'custom:flowio-history-card'; title: string; hours_to_show: number; entities: string[]; }
export function normalizeHistoryConfig(input: unknown): HistoryConfig {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Configuration objet attendue');
  const raw = input as Record<string, unknown>;
  const hours = raw.hours_to_show ?? 24;
  const title = raw.title ?? 'Historique de la piscine';
  const list = raw.entities ?? [];
  if (typeof title !== 'string') throw new Error('Titre invalide');
  if (typeof hours !== 'number' || !Number.isInteger(hours) || hours < 1 || hours > 168) throw new Error('La durée doit être un entier entre 1 et 168 heures');
  if (!Array.isArray(list) || list.some(id => typeof id !== 'string' || !/^(sensor|number)\.[a-z0-9_]+$/.test(id))) throw new Error('Choisir des entités sensor ou number');
  const entities = [...new Set(list as string[])];
  if (entities.length > 6) throw new Error('Six mesures maximum par carte');
  return { type: 'custom:flowio-history-card', title, hours_to_show: hours, entities };
}
export function nativeHistoryConfigs(config: HistoryConfig) {
  return config.entities.map(entity => ({ type: 'history-graph', entities: [entity], hours_to_show: config.hours_to_show }));
}
