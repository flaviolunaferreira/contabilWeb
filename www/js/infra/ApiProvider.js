/**
 * ApiProvider.js
 * Gerencia persistência hibrida: Memory (Sync Read) + IndexedDB (Cache) + API (Async Write/Sync)
 */
import { ToastService } from './ToastService.js';

export class ApiProvider {
    // Agora servimos o frontend do mesmo domínio, então URL relativa é melhor
    static baseUrl = '/api'; 
    static dbName = 'ContabilWebDB';
    static storeName = 'offline_store';
    static memoryCache = {};
    static isInitialized = false;

    // --- Inicialização ---
    static async init() {
        if (this.isInitialized) return;
        
        try {
            await this._initIndexedDB();
            
            // Carrega do IndexedDB para Memória (rápido)
            await this._loadFromCacheToMemory();
            
            // Health Check (Bloqueante mas rápido)
            // Se falhar, dependemos somente do cache e avisamos a UI
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
                
                const res = await fetch(`${this.baseUrl}/health-check`, { signal: controller.signal }); // Endpoint dummy ou root
                clearTimeout(timeoutId); // Limpa timeout se der certo

                if (!res.ok && res.status !== 404) throw new Error('Server returned error');
                
                // Sincroniza com Servidor (Background)
                this._syncWithServer().catch(err => console.error('Background Sync Failed:', err));
            
            } catch (e) {
                console.warn('Backend Offline or Unreachable:', e);
                // Import dinâmico circular ou uso de EventBus global se disponível
                // Como ApiProvider é infra baixo nível, melhor não acoplar EventBus diretamente aqui se não importado.
                // Mas o prompt pediu. Vamos assumir que podemos despachar um evento DOM global ou usar console.
                document.dispatchEvent(new CustomEvent('api:error', { detail: { message: 'Modo Offline: Servidor indisponível.' } }));
            }

            this.isInitialized = true;
            console.log('ApiProvider initialized');
        } catch (criticalError) {
            console.error('Falha crítica no ApiProvider:', criticalError);
            throw criticalError; // Propaga para o AppController travar o boot e mostrar erro
        }
    }

    // --- Métodos de Interface (Compatíveis com StorageProvider antigo) ---
    
    /**
     * Retorna dados síncronos da memória
     */
    static get(key, defaultValue) {
        if (!this.isInitialized) {
            console.warn('ApiProvider accessed before init. Using localStorage fallback until ready.');
            // Fallback temporário para localStorage antigo se init() ainda não rolou
            const lsVal = localStorage.getItem(key);
            return lsVal ? JSON.parse(lsVal) : defaultValue;
        }
        return this.memoryCache[key] !== undefined ? this.memoryCache[key] : defaultValue;
    }

    /**
     * Salva dados (Memória Sync + DB Async + API Async)
     */
    static set(key, value) {
        // 1. Atualiza memória (Sync update para a UI)
        this.memoryCache[key] = value;
        
        // 2. Persiste Local (IndexedDB)
        this._saveToIndexedDB(key, value);
        
        // 3. Envia para API
        this._sendToApi(key, value);
        
        // 4. Manter LocalStorage como backup/fallback legado
        localStorage.setItem(key, JSON.stringify(value));
        
        return true;
    }

    // --- Internals ---

    static async _sendToApi(key, value) {
        // Mapeamento Chave -> Endpoint
        const endpoints = {
            'transacoes': '/transacoes',
            'cartoes': '/cartoes',
            'dividas_estruturadas': '/dividas'
            // 'meta': '/meta' (Ainda não implementado backend específica, ignorar)
        };

        const endpoint = endpoints[key];
        if (!endpoint) return; // Não sincroniza chaves locais pura (configs etc)

        // Se for array, mandamos itens individuais ou bulk?
        // Simples: Vamos mandar item a item se for array, ou o objeto.
        // O backend espera POST individual pelo meu código Server.
        // TODO: Otimização Bulk no futuro.
        
        if (Array.isArray(value)) {
            for (const item of value) {
                try {
                    const res = await fetch(`${this.baseUrl}${endpoint}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(item)
                    });
                    
                    if (!res.ok) {
                        if (res.status === 500) {
                            ToastService.show("Erro interno no servidor ao salvar dados.", "error");
                        }
                        console.error(`API Error ${res.status}:`, await res.text());
                    }

                } catch (e) {
                    // Fila de retry poderia ser implementada aqui
                    console.warn(`Sync failed for ${key}/${item.id}`, e);
                }
            }
        }
    }

    static async _syncWithServer() {
        const endpoints = {
            'transacoes': '/transacoes',
            'cartoes': '/cartoes',
            'dividas_estruturadas': '/dividas'
        };

        for (const [key, endpoint] of Object.entries(endpoints)) {
            try {
                const res = await fetch(`${this.baseUrl}${endpoint}`);
                
                if (!res.ok) {
                    if (res.status === 500) {
                        console.error(`Server Error 500 on ${endpoint}`);
                        ToastService.show("Erro interno no servidor. Verifique o banco de dados.", "error");
                    }
                    continue;
                }

                if (res.ok) {
                    const contentType = res.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        const data = await res.json();
                        if (data && data.length > 0) {
                            this.memoryCache[key] = data;
                            this._saveToIndexedDB(key, data);
                            // Atualiza LocalStorage para consistência
                            localStorage.setItem(key, JSON.stringify(data)); 
                        }
                    } else {
                        console.warn(`[ApiProvider] Received non-JSON response from ${endpoint}:`, await res.text());
                    }
                }
            } catch (e) {
                console.log('Server unreachable, using cache.');
            }
        }
    }

    // --- IndexedDB Helpers ---
    
    static _initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };

            request.onsuccess = (event) => {
                this._db = event.target.result;
                resolve();
            };
            
            request.onerror = (event) => reject(event.target.error);
        });
    }

    static _saveToIndexedDB(key, value) {
        if (!this._db) return;
        const transaction = this._db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        store.put(value, key);
    }

    static _loadFromCacheToMemory() {
        return new Promise((resolve) => {
            if (!this._db) { resolve(); return; }
            const transaction = this._db.transaction([this.storeName], "readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.getAllKeys();
            
            request.onsuccess = async () => {
                const keys = request.result;
                let loaded = 0;
                if (keys.length === 0) resolve();

                keys.forEach(key => {
                    const reqVal = store.get(key);
                    reqVal.onsuccess = () => {
                        this.memoryCache[key] = reqVal.result;
                        loaded++;
                        if (loaded === keys.length) resolve();
                    };
                });
            };
        });
    }
}
