/**
 * ProPresenter AI Studio - Multi-Display Sync Engine via BroadcastChannel
 */

const CHANNEL_NAME = "propresenter_studio_sync_v1";

export class BroadcastSync {
  constructor(isOperator = false) {
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.isOperator = isOperator;
    this.listeners = [];

    this.channel.onmessage = (event) => {
      if (event.data && event.data.type === "STATE_UPDATE") {
        this.listeners.forEach(fn => fn(event.data.payload));
      }
    };
  }

  // Operator sends state updates to all open displays
  sendUpdate(state) {
    this.channel.postMessage({
      type: "STATE_UPDATE",
      payload: state,
      timestamp: Date.now()
    });
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
