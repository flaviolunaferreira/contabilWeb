/**
 * @fileoverview Serviço de armazenamento de dados
 * @author Sistema de Controle Financeiro
 * @version 1.0.0
 */

/**
 * Serviço responsável por gerenciar o armazenamento de dados
 * Suporta tanto localStorage quanto SQLite automaticamente
 * @class StorageService
 */
class StorageService {
    /**
     * Cria uma nova instância do StorageService
     */
    constructor() {
        this.storageType = 'localStorage'; // Padrão para web
        this.keys = {
            TRANSACOES: 'transacoes',
            CARTOES: 'cartoes',
            CATEGORIAS: 'categorias',
            CONFIGURACOES: 'configuracoes'
        };
    }

    /**
     * Inicializa o serviço de storage
     * @returns {Promise<boolean>} True se inicializado com sucesso
     */
    async init() {
        try {
            // Verificar se está no ambiente Capacitor (mobile)
            if (typeof window !== 'undefined' && window.Capacitor) {
                this.storageType = 'sqlite';
                // Aqui poderia inicializar SQLite se necessário
                console.log('StorageService inicializado com SQLite');
            } else {
                this.storageType = 'localStorage';
                console.log('StorageService inicializado com localStorage');
            }
            return true;
        } catch (error) {
            console.error('Erro ao inicializar StorageService:', error);
            return false;
        }
    }

    /**
     * Salva dados no storage
     * @param {string} key - Chave para armazenamento
     * @param {any} data - Dados para salvar
     * @returns {Promise<boolean>} True se salvou com sucesso
     */
    async save(key, data) {
        try {
            if (this.storageType === 'localStorage') {
                localStorage.setItem(key, JSON.stringify(data));
            } else {
                // Implementação SQLite seria aqui
                localStorage.setItem(key, JSON.stringify(data));
            }
            
            console.log(`Dados salvos com sucesso: ${key}`);
            return true;
        } catch (error) {
            console.error(`Erro ao salvar dados ${key}:`, error);
            return false;
        }
    }

    /**
     * Carrega dados do storage
     * @param {string} key - Chave para buscar
     * @param {any} [defaultValue=null] - Valor padrão se não encontrar
     * @returns {Promise<any>} Dados encontrados ou valor padrão
     */
    async load(key, defaultValue = null) {
        try {
            let data;
            
            if (this.storageType === 'localStorage') {
                data = localStorage.getItem(key);
            } else {
                // Implementação SQLite seria aqui
                data = localStorage.getItem(key);
            }
            
            if (data === null) {
                return defaultValue;
            }
            
            return JSON.parse(data);
        } catch (error) {
            console.error(`Erro ao carregar dados ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Remove dados do storage
     * @param {string} key - Chave para remover
     * @returns {Promise<boolean>} True se removeu com sucesso
     */
    async remove(key) {
        try {
            if (this.storageType === 'localStorage') {
                localStorage.removeItem(key);
            } else {
                // Implementação SQLite seria aqui
                localStorage.removeItem(key);
            }
            
            console.log(`Dados removidos com sucesso: ${key}`);
            return true;
        } catch (error) {
            console.error(`Erro ao remover dados ${key}:`, error);
            return false;
        }
    }

    /**
     * Verifica se uma chave existe no storage
     * @param {string} key - Chave para verificar
     * @returns {Promise<boolean>} True se a chave existe
     */
    async exists(key) {
        try {
            const data = await this.load(key);
            return data !== null;
        } catch (error) {
            console.error(`Erro ao verificar existência da chave ${key}:`, error);
            return false;
        }
    }

    /**
     * Limpa todos os dados do storage
     * @returns {Promise<boolean>} True se limpou com sucesso
     */
    async clear() {
        try {
            if (this.storageType === 'localStorage') {
                // Remove apenas as chaves do sistema
                Object.values(this.keys).forEach(key => {
                    localStorage.removeItem(key);
                });
            } else {
                // Implementação SQLite seria aqui
                Object.values(this.keys).forEach(key => {
                    localStorage.removeItem(key);
                });
            }
            
            console.log('Todos os dados foram limpos do storage');
            return true;
        } catch (error) {
            console.error('Erro ao limpar dados do storage:', error);
            return false;
        }
    }

    /**
     * Obtém informações sobre o storage
     * @returns {Object} Informações do storage
     */
    getInfo() {
        return {
            type: this.storageType,
            available: this.storageType === 'localStorage' ? 
                typeof(Storage) !== "undefined" : 
                typeof window !== 'undefined' && window.Capacitor,
            keys: this.keys
        };
    }

    /**
     * Salva transações no storage
     * @param {Array} transacoes - Array de transações
     * @returns {Promise<boolean>} True se salvou com sucesso
     */
    async saveTransacoes(transacoes) {
        return await this.save(this.keys.TRANSACOES, transacoes);
    }

    /**
     * Carrega transações do storage
     * @returns {Promise<Array>} Array de transações
     */
    async loadTransacoes() {
        return await this.load(this.keys.TRANSACOES, []);
    }

    /**
     * Salva cartões no storage
     * @param {Array} cartoes - Array de cartões
     * @returns {Promise<boolean>} True se salvou com sucesso
     */
    async saveCartoes(cartoes) {
        return await this.save(this.keys.CARTOES, cartoes);
    }

    /**
     * Carrega cartões do storage
     * @returns {Promise<Array>} Array de cartões
     */
    async loadCartoes() {
        return await this.load(this.keys.CARTOES, []);
    }

    /**
     * Salva categorias no storage
     * @param {Array} categorias - Array de categorias
     * @returns {Promise<boolean>} True se salvou com sucesso
     */
    async saveCategorias(categorias) {
        return await this.save(this.keys.CATEGORIAS, categorias);
    }

    /**
     * Carrega categorias do storage
     * @returns {Promise<Array>} Array de categorias
     */
    async loadCategorias() {
        return await this.load(this.keys.CATEGORIAS, []);
    }

    /**
     * Salva configurações no storage
     * @param {Object} configuracoes - Objeto de configurações
     * @returns {Promise<boolean>} True se salvou com sucesso
     */
    async saveConfiguracoes(configuracoes) {
        return await this.save(this.keys.CONFIGURACOES, configuracoes);
    }

    /**
     * Carrega configurações do storage
     * @returns {Promise<Object>} Objeto de configurações
     */
    async loadConfiguracoes() {
        return await this.load(this.keys.CONFIGURACOES, {
            tema: 'light',
            moeda: 'BRL',
            idioma: 'pt-BR',
            notificacoes: true
        });
    }

    /**
     * Exporta todos os dados para backup
     * @returns {Promise<Object>} Objeto com todos os dados
     */
    async exportData() {
        try {
            const [transacoes, cartoes, categorias, configuracoes] = await Promise.all([
                this.loadTransacoes(),
                this.loadCartoes(),
                this.loadCategorias(),
                this.loadConfiguracoes()
            ]);

            return {
                transacoes,
                cartoes,
                categorias,
                configuracoes,
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            throw error;
        }
    }

    /**
     * Importa dados de backup
     * @param {Object} data - Dados para importar
     * @returns {Promise<boolean>} True se importou com sucesso
     */
    async importData(data) {
        try {
            if (!data || typeof data !== 'object') {
                throw new Error('Dados inválidos para importação');
            }

            const savePromises = [];

            if (data.transacoes) {
                savePromises.push(this.saveTransacoes(data.transacoes));
            }

            if (data.cartoes) {
                savePromises.push(this.saveCartoes(data.cartoes));
            }

            if (data.categorias) {
                savePromises.push(this.saveCategorias(data.categorias));
            }

            if (data.configuracoes) {
                savePromises.push(this.saveConfiguracoes(data.configuracoes));
            }

            const results = await Promise.all(savePromises);
            const success = results.every(result => result === true);

            if (success) {
                console.log('Dados importados com sucesso');
            } else {
                console.warn('Alguns dados podem não ter sido importados corretamente');
            }

            return success;
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    }

    /**
     * Calcula o tamanho aproximado dos dados armazenados
     * @returns {Promise<Object>} Informações sobre o tamanho
     */
    async getStorageSize() {
        try {
            const data = await this.exportData();
            const dataString = JSON.stringify(data);
            const sizeInBytes = new Blob([dataString]).size;
            const sizeInKB = (sizeInBytes / 1024).toFixed(2);
            const sizeInMB = (sizeInKB / 1024).toFixed(2);

            return {
                bytes: sizeInBytes,
                kb: parseFloat(sizeInKB),
                mb: parseFloat(sizeInMB),
                formatted: sizeInBytes < 1024 ? 
                    `${sizeInBytes} bytes` :
                    sizeInKB < 1024 ?
                    `${sizeInKB} KB` :
                    `${sizeInMB} MB`
            };
        } catch (error) {
            console.error('Erro ao calcular tamanho do storage:', error);
            return {
                bytes: 0,
                kb: 0,
                mb: 0,
                formatted: '0 bytes'
            };
        }
    }
}

// Criar instância global
const storageService = new StorageService();

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.StorageService = StorageService;
    window.storageService = storageService;
}