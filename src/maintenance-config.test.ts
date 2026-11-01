import { describe, expect, it } from 'vitest';
import { normalizeConfig } from './model';

describe('paramètre persistant mqtt_topic', () => {
  it('conserve les anciennes configurations sans inventer de topic', () => {
    expect(normalizeConfig({ entity_prefix: 'fio' }).mqtt_topic).toBeUndefined();
    expect(normalizeConfig({ mqtt_topic: '' }).mqtt_topic).toBeUndefined();
    expect(normalizeConfig({ mqtt_topic: '  ' }).mqtt_topic).toBeUndefined();
  });
  it('conserve le topic et reste indépendant du préfixe HA', () => {
    const config = normalizeConfig({ entity_prefix: 'fio', mqtt_topic: ' pool/controller/ ' });
    expect(config.entity_prefix).toBe('fio');
    expect(config.mqtt_topic).toBe('pool/controller');
    expect(normalizeConfig(JSON.parse(JSON.stringify(config))).mqtt_topic).toBe('pool/controller');
  });
  it('refuse les types invalides, jokers et segments vides', () => {
    for (const mqtt_topic of [null, false, 42, {}, [], 'pool/+', 'pool/#', 'pool//controller', '/pool/controller']) {
      expect(() => normalizeConfig({ mqtt_topic })).toThrow();
    }
  });
});
