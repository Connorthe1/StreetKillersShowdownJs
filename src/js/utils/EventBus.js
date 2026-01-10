export class EventBus {
    constructor() {
        this.listeners = {};
    }

    on(event, callback) {
        (this.listeners[event] ??= []).push(callback);
    }

    off(event, callback) {
        this.listeners[event] =
            (this.listeners[event] || []).filter(cb => cb !== callback);
    }

    emit(event, payload) {
        (this.listeners[event] || []).forEach(cb => cb(payload));
    }
}