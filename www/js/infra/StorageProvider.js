import { ApiProvider } from './ApiProvider.js';

export class StorageProvider {
    
    static async init() {
        await ApiProvider.init();
    }

    static set(key, value) {
        return ApiProvider.set(key, value);
    }

    static get(key, defaultValue) {
        return ApiProvider.get(key, defaultValue);
    }

    static _safeParse(jsonString, key, defaultValue) {
        // Método mantido apenas para compatibilidade se alguém chamar diretamente (improvável)
        try {
            const data = JSON.parse(jsonString);
            return data !== null ? data : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    static clear() {
        localStorage.clear();
        // TODO: Clear API cache if needed
    }
}

