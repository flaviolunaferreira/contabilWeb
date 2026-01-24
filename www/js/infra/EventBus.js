
class EventBus {
    constructor() {
        if (EventBus.instance) return EventBus.instance;
        this.listeners = {};
        EventBus.instance = this;
    }

    subscribe(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    unsubscribe(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(
            listener => listener !== callback
        );
    }

    publish(event, data) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[EventBus] Erro no listener de '${event}':`, error);
            }
        });
    }
}

export const eventBus = new EventBus();
