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

    emit(event, payload, returnValue = false) {
        const listeners = this.listeners[event] || [];
        
        // Если нужен возврат значения, возвращаем результат первого обработчика
        if (returnValue && listeners.length > 0) {
            return listeners[0](payload);
        }
        
        // Обычный режим - вызываем все обработчики
        listeners.forEach(cb => cb(payload));
    }
}