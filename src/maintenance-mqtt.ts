export interface MqttMessage { topic: string; payload: string }
export type Unsubscribe = () => void | Promise<void>;
export interface MqttConnection {
  subscribeMessage(callback: (message: MqttMessage) => void, message: Record<string, unknown>): Promise<Unsubscribe>;
}
export interface MaintenanceHass {
  connection?: MqttConnection;
  callService(domain: string, service: string, data: Record<string, unknown>): Promise<unknown>;
}
export interface AlarmMaintenanceState {
  root: string;
  loading: boolean;
  online?: boolean;
  enabled?: boolean;
  pending?: boolean;
  error: string;
  message: string;
}

export function normalizeMqttRoot(value: string): string {
  const root = value.trim().replace(/\/+$/, '');
  if (!root || root.startsWith('/') || /[+#\s\u0000]/u.test(root) || root.split('/').some(part => !part)) {
    throw new Error('Topic racine MQTT invalide : indiquer baseTopic/deviceId, sans joker.');
  }
  return root;
}

function objectPayload(payload: string): Record<string, unknown> | undefined {
  try {
    const value: unknown = JSON.parse(payload);
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown> : undefined;
  } catch { return undefined; }
}

export function alarmEnabled(payload: string): boolean | undefined {
  const data = objectPayload(payload);
  const nested = data?.alarms;
  const value = nested !== null && typeof nested === 'object' && !Array.isArray(nested)
    ? (nested as Record<string, unknown>).enabled : data?.enabled;
  return typeof value === 'boolean' ? value : undefined;
}

export function controllerOnline(payload: string): boolean | undefined {
  const value = objectPayload(payload)?.online;
  return typeof value === 'boolean' ? value : undefined;
}

export class AlarmMaintenanceClient {
  private state: AlarmMaintenanceState = { root: '', loading: false, error: '', message: '' };
  private generation = 0;
  private subscriptions: Unsubscribe[] = [];
  private connection?: MqttConnection;
  private timer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly hass: () => MaintenanceHass | undefined,
    private readonly changed: (state: Readonly<AlarmMaintenanceState>) => void,
    private readonly timeoutMs = 15000
  ) {}

  snapshot(): Readonly<AlarmMaintenanceState> { return { ...this.state }; }
  private notify() { this.changed(this.snapshot()); }
  private release(unsubscribe: Unsubscribe) {
    try { void Promise.resolve(unsubscribe()).catch(() => undefined); } catch { /* Connection already closed. */ }
  }
  private clearTimer() {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }

  disconnect() {
    this.generation++;
    this.clearTimer();
    for (const unsubscribe of this.subscriptions.splice(0)) this.release(unsubscribe);
    this.connection = undefined;
    this.state = { root: this.state.root, loading: false, error: '', message: '' };
    this.notify();
  }

  async connect(value: string): Promise<void> {
    this.disconnect();
    const token = this.generation;
    try {
      const root = normalizeMqttRoot(value);
      const connection = this.hass()?.connection;
      if (!connection) throw new Error('Connexion Home Assistant indisponible.');
      this.connection = connection;
      this.state = { root, loading: true, error: '', message: 'Lecture de l’état MQTT…' };
      this.notify();
      for (const suffix of ['cfg/alarms', 'status']) {
        const topic = `${root}/${suffix}`;
        const unsubscribe = await connection.subscribeMessage(message => {
          if (token !== this.generation || message.topic !== topic) return;
          if (suffix === 'status') {
            this.state.online = controllerOnline(message.payload);
            if (this.state.online !== true) {
              this.state.enabled = undefined;
              if (this.state.pending !== undefined) {
                this.clearTimer();
                this.state.pending = undefined;
                this.state.error = 'Contrôleur hors ligne ou état de connexion inconnu. Commande non confirmée.';
              }
            }
          } else {
            this.state.enabled = alarmEnabled(message.payload);
            if (this.state.enabled === undefined) {
              this.state.error = 'Configuration des alarmes invalide ou absente.';
            } else if (this.state.pending !== undefined && this.state.enabled === this.state.pending) {
              this.clearTimer();
              this.state.pending = undefined;
              this.state.error = '';
              this.state.message = 'État confirmé par le retour de configuration Flow.io.';
            }
          }
          this.notify();
        }, { type: 'mqtt/subscribe', topic, qos: 1 });
        if (token !== this.generation) { this.release(unsubscribe); return; }
        this.subscriptions.push(unsubscribe);
      }
      if (token !== this.generation) return;
      this.state.loading = false;
      this.state.message = 'État MQTT reçu ou en attente. Une publication ne confirme pas son application.';
      this.notify();
    } catch (error) {
      if (token !== this.generation) return;
      this.disconnect();
      this.state.error = `Lecture MQTT impossible : ${error instanceof Error ? error.message : 'accès refusé'}. La souscription MQTT Home Assistant nécessite un compte administrateur et l’intégration MQTT.`;
      this.notify();
    }
  }

  canCommand(): boolean {
    return !!this.connection && this.hass()?.connection === this.connection &&
      !this.state.loading && this.state.online === true &&
      this.state.enabled !== undefined && this.state.pending === undefined &&
      this.subscriptions.length === 2;
  }

  // Confirmation belongs to the UI. This method never changes the displayed state optimistically.
  async setEnabled(wanted: boolean): Promise<boolean> {
    const hass = this.hass();
    if (!hass || !this.canCommand() || wanted === this.state.enabled) return false;
    const token = this.generation;
    this.state.pending = wanted;
    this.state.error = '';
    this.state.message = 'Commande envoyée, en attente du retour de configuration Flow.io.';
    this.timer = setTimeout(() => {
      if (token !== this.generation || this.state.pending === undefined) return;
      this.timer = undefined;
      this.state.pending = undefined;
      this.state.enabled = undefined;
      this.state.error = 'Pas de confirmation Flow.io. Relire l’état MQTT avant de réessayer.';
      this.notify();
    }, this.timeoutMs);
    this.notify();
    try {
      await hass.callService('mqtt', 'publish', {
        topic: `${this.state.root}/cfg/set`,
        payload: JSON.stringify({ alarms: { enabled: wanted } }),
        qos: 1,
        retain: false
      });
      return token === this.generation;
    } catch {
      if (token !== this.generation) return false;
      this.clearTimer();
      this.state.pending = undefined;
      this.state.enabled = undefined;
      this.state.error = 'Publication MQTT refusée ou échouée. Relire l’état avant de réessayer.';
      this.notify();
      return false;
    }
  }
}
