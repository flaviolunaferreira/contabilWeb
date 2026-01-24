import { StorageProvider } from '../infra/StorageProvider.js';
import { TransactionModel } from '../domain/TransactionModel.js';
import { eventBus } from '../infra/EventBus.js';

export class TransacaoService {
    constructor() {
        this.STORAGE_KEY = 'transacoes';
    }

    getAll() {
        const raw = StorageProvider.get(this.STORAGE_KEY, []);
        // Modelos são validados na escrita. Na leitura confiamos no StorageProvider + EncryptionService.
        return raw; 
    }

    /**
     * Adiciona transação validando schema
     */
    add(transactionData) {
        try {
            const model = new TransactionModel(transactionData);
            const transactions = this.getAll();
            transactions.push(model);
            
            if (StorageProvider.set(this.STORAGE_KEY, transactions)) {
                // Evento para atualizar dashboard
                eventBus.publish('finance:update', transactions);
                return model;
            }
            throw new Error('Falha ao salvar no Storage.');
        } catch (error) {
            console.error('[TransacaoService] Erro ao adicionar:', error);
            throw error;
        }
    }

    /**
     * Atualiza múltiplas transações de uma vez (Atomicidade simulada sobre a lista)
     * @param {Array} updatedTransactions Lista completa atualizada
     * @returns {boolean}
     */
    saveAll(transactions) {
        if (StorageProvider.set(this.STORAGE_KEY, transactions)) {
             eventBus.publish('finance:update', transactions);
             return true;
        }
        return false;
    }
}

export const transacaoService = new TransacaoService();
