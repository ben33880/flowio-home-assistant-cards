import { afterEach, describe, expect, it, vi } from 'vitest';
import { AlarmMaintenanceClient, alarmEnabled, controllerOnline, normalizeMqttRoot, type MaintenanceHass, type MqttMessage } from './maintenance-mqtt';

afterEach(() => vi.useRealTimers());

function fixture() {
  const listeners = new Map<string, (message: MqttMessage) => void>();
  const removals = vi.fn();
  const publish = vi.fn().mockResolvedValue(undefined);
  const hass: MaintenanceHass = {
    callService: publish,
    connection: { subscribeMessage: vi.fn(async (callback: (message: MqttMessage) => void, command: Record<string, unknown>) => {
      const topic = String(command.topic);
      listeners.set(topic, callback);
      return () => { listeners.delete(topic); removals(topic); };
    }) }
  };
  const client = new AlarmMaintenanceClient(() => hass, vi.fn(), 1000);
  const send = (suffix: string, payload: string, root = 'pool/controller') => {
    const topic = `${root}/${suffix}`;
    listeners.get(topic)?.({ topic, payload });
  };
  return { client, hass, listeners, removals, publish, send };
}

describe('contrat MQTT Maintenance', () => {
  it('valide un topic explicite sans le déduire du préfixe HA', () => {
    expect(normalizeMqttRoot(' pool/controller/ ')).toBe('pool/controller');
    for (const value of ['', '/', '/pool/controller', 'pool/+', 'pool/#', 'pool//controller', 'pool /controller']) {
      expect(() => normalizeMqttRoot(value)).toThrow();
    }
  });

  it('exige des booléens et ne transforme jamais une absence en faux', () => {
    expect(alarmEnabled('{"enabled":true}')).toBe(true);
    expect(alarmEnabled('{"alarms":{"enabled":false}}')).toBe(false);
    for (const value of ['{}', 'null', '[]', 'invalid', '{"enabled":"false"}', '{"enabled":0}']) {
      expect(alarmEnabled(value)).toBeUndefined();
    }
    expect(controllerOnline('{"online":true}')).toBe(true);
    expect(controllerOnline('{}')).toBeUndefined();
  });

  it('bloque les commandes sans configuration et contrôleur en ligne', async () => {
    const { client, send, publish } = fixture();
    await client.connect('pool/controller');
    expect(await client.setEnabled(false)).toBe(false);
    send('cfg/alarms', '{"enabled":true}');
    expect(client.canCommand()).toBe(false);
    send('status', '{"online":true}');
    expect(client.canCommand()).toBe(true);
    send('status', '{"online":false}');
    expect(client.canCommand()).toBe(false);
    expect(publish).not.toHaveBeenCalled();
    client.disconnect();
  });

  it('publie uniquement le patch attendu, sans retain, et attend le retour firmware', async () => {
    const { client, send, publish } = fixture();
    await client.connect('pool/controller');
    send('status', '{"online":true}');
    send('cfg/alarms', '{"enabled":true}');
    expect(await client.setEnabled(false)).toBe(true);
    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith('mqtt', 'publish', {
      topic: 'pool/controller/cfg/set', payload: '{"alarms":{"enabled":false}}', qos: 1, retain: false
    });
    expect(client.snapshot().enabled).toBe(true);
    expect(client.snapshot().pending).toBe(false);
    expect(await client.setEnabled(false)).toBe(false);
    send('cfg/alarms', '{"enabled":false}');
    expect(client.snapshot().pending).toBeUndefined();
    expect(client.snapshot().enabled).toBe(false);
    expect(client.snapshot().message).toContain('confirmé');
    client.disconnect();
  });

  it('retire les souscriptions et ignore les anciens messages lors du changement de cible', async () => {
    const { client, send, listeners, removals } = fixture();
    await client.connect('pool/controller');
    const oldListener = listeners.get('pool/controller/cfg/alarms')!;
    await client.connect('other/controller');
    oldListener({ topic: 'pool/controller/cfg/alarms', payload: '{"enabled":true}' });
    expect(client.snapshot().enabled).toBeUndefined();
    expect(removals).toHaveBeenCalledTimes(2);
    send('status', '{"online":true}', 'other/controller');
    send('cfg/alarms', '{"enabled":false}', 'other/controller');
    expect(client.canCommand()).toBe(true);
    client.disconnect();
    expect(listeners.size).toBe(0);
    expect(client.canCommand()).toBe(false);
  });

  it('signale une absence de confirmation sans annoncer un nouvel état', async () => {
    vi.useFakeTimers();
    const { client, send } = fixture();
    await client.connect('pool/controller');
    send('status', '{"online":true}');
    send('cfg/alarms', '{"enabled":true}');
    await client.setEnabled(false);
    vi.advanceTimersByTime(1001);
    expect(client.snapshot().enabled).toBeUndefined();
    expect(client.snapshot().error).toContain('Pas de confirmation');
    expect(client.canCommand()).toBe(false);
    client.disconnect();
  });

  it('rend une erreur explicite si la souscription est refusée', async () => {
    const { client, hass } = fixture();
    hass.connection!.subscribeMessage = vi.fn().mockRejectedValue(new Error('unauthorized'));
    await client.connect('pool/controller');
    expect(client.snapshot().loading).toBe(false);
    expect(client.snapshot().error).toContain('administrateur');
    expect(client.canCommand()).toBe(false);
  });

  it('invalide l’état si la publication échoue', async () => {
    const { client, send, publish } = fixture();
    await client.connect('pool/controller');
    send('status', '{"online":true}');
    send('cfg/alarms', '{"enabled":true}');
    publish.mockRejectedValueOnce(new Error('denied'));
    expect(await client.setEnabled(false)).toBe(false);
    expect(client.snapshot().error).toContain('échouée');
    expect(client.canCommand()).toBe(false);
    client.disconnect();
  });
});
