/**
 * ProPresenter AI Studio - Multi-Display Sync Engine via BroadcastChannel
 */

const CHANNEL_NAME = "propresenter_studio_sync_v1";

export class BroadcastSync {
  constructor(isOperator = false) {
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.isOperator = isOperator;
    this.listeners = [];
    this.audienceListeners = [];
    this.mediaEndedListeners = [];
    this.mediaCommandListeners = [];
    this.stateProvider = null;

    this.channel.onmessage = (event) => {
      if (!event.data) return;
      if (event.data.type === "STATE_UPDATE") {
        this.listeners.forEach(fn => fn(event.data.payload));
      } else if (event.data.type === "REQUEST_STATE" && this.isOperator && this.stateProvider) {
        this.sendUpdate(this.stateProvider());
      } else if (event.data.type === "AUDIENCE_PRESENCE") {
        this.audienceListeners.forEach(fn => fn(!!event.data.active));
      } else if (event.data.type === "MEDIA_ENDED" && this.isOperator) {
        this.mediaEndedListeners.forEach(fn => fn(event.data.url));
      } else if (event.data.type === "MEDIA_COMMAND") {
        this.mediaCommandListeners.forEach(fn => fn(event.data.command));
      }
    };

    // Electron native IPC listener
    if (typeof window !== "undefined" && window.electronAPI && window.electronAPI.onBroadcastUpdate) {
      this._unsubscribeIpc = window.electronAPI.onBroadcastUpdate((state) => {
        this.listeners.forEach(fn => fn(state));
      });
    }

    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("beforeunload", () => this.close(), { once: true });
    }
  }

  close() {
    if (typeof this._unsubscribeIpc === "function") {
      this._unsubscribeIpc();
      this._unsubscribeIpc = null;
    }
    if (this.channel) {
      try { this.channel.close(); } catch (e) {}
    }
  }

  setStateProvider(providerFn) {
    this.stateProvider = providerFn;
  }

  onAudiencePresence(callback) {
    this.audienceListeners.push(callback);
  }

  onMediaEnded(callback) {
    this.mediaEndedListeners.push(callback);
  }

  notifyMediaEnded(url = "") {
    try {
      this.channel.postMessage({ type: "MEDIA_ENDED", url, timestamp: Date.now() });
    } catch (e) {}
  }

  onMediaCommand(callback) {
    this.mediaCommandListeners.push(callback);
  }

  sendMediaCommand(command) {
    try {
      this.channel.postMessage({ type: "MEDIA_COMMAND", command, timestamp: Date.now() });
    } catch (e) {}
  }


  // Operator sends state updates to all open displays
  sendUpdate(state) {
    this.channel.postMessage({
      type: "STATE_UPDATE",
      payload: state,
      timestamp: Date.now()
    });

    if (typeof window !== "undefined" && window.electronAPI && window.electronAPI.sendBroadcast) {
      window.electronAPI.sendBroadcast(state);
    }
  }

  // Audience or Stage displays listen for state updates
  onUpdate(callback) {
    this.listeners.push(callback);
  }

  // Request latest state on window load
  requestState() {
    this.channel.postMessage({ type: "REQUEST_STATE" });
  }
}

export const sync = new BroadcastSync(true);
