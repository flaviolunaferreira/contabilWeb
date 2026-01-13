import { ApiProvider } from '../infra/ApiProvider.js';
import { StorageProvider } from '../infra/StorageProvider.js';
import { CardModel } from '../domain/CardModel.js';
import { TransactionModel } from '../domain/TransactionModel.js';
import { transacaoService } from './TransacaoService.js';
import { eventBus } from '../infra/EventBus.js';

export class CartaoService {
    constructor() {
        this.STORAGE_KEY = 'cartoes';
    }

    getAll() {
        // Agora usamos ApiProvider para leitura (que já faz o fallback para memória/cache)
        return ApiProvider.get(this.STORAGE_KEY, []);
    }

    getById(id) {
        const cards = this.getAll();
        return cards.find(c => c.id === id);
    }

    save(cardData) {
        try {
            const model = new CardModel(cardData);
            const cards = this.getAll();
            cards.push(model);
            
            // Salva via ApiProvider (Persistência completa: Memory -> IndexedDB -> API)
            ApiProvider.set(this.STORAGE_KEY, cards);
            
            // Emite evento para atualização de UI
            eventBus.publish('cartoes:updated', cards);
            
            return model;
        } catch (error) {
            console.error('[CartaoService] Erro ao criar cartão:', error);
            throw error;
        }
    }

    // --- Alias methods for Controller Compatibility ---
    
    obterTodos() {
        return this.getAll();
    }

    buscarPorId(id) {
        return this.getById(id);
    }

    async obterAtivos() {
        // Retorna todos os cartões, mas filtra os inativos se a propriedade existir
        const all = await this.getAll();
        return all.filter(c => c.active !== 0 && c.active !== false && c.active !== '0');
    }

    adicionarCartao(cardData) {
        return this.save(cardData);
    }

    atualizarCartao(id, cardData) {
        try {
            const cards = this.getAll();
            const index = cards.findIndex(c => c.id === id);
            
            if (index === -1) {
                throw new Error('Cartão não encontrado');
            }

            // Atualiza mantendo o ID original
            const updated = { ...cards[index], ...cardData, id: id };
            cards[index] = new CardModel(updated);
            
            StorageProvider.set(this.STORAGE_KEY, cards);
            return cards[index];
        } catch (error) {
            console.error('[CartaoService] Erro ao atualizar:', error);
            throw error;
        }
    }

    removerCartao(id) {
        try {
            const cards = this.getAll();
            const filtered = cards.filter(c => c.id !== id);
            
            if (filtered.length === cards.length) return false;

            StorageProvider.set(this.STORAGE_KEY, filtered);
            return true;
        } catch (error) {
            console.error('[CartaoService] Erro ao remover:', error);
            return false;
        }
    }

    /**
     * Calcula o limite disponível baseado nas despesas em aberto
     * @param {string} cartaoId 
     * @returns {number} Limite disponível em centavos
     */
    calcularLimiteDisponivel(cartaoId) {
        const cartao = this.getById(cartaoId);
        if (!cartao) return 0;

        const transacoes = transacaoService.getAll();
        
        // Soma gastos no crédito que ainda não foram pagos.
        // Se já está pago (INVOICE_PAID), liberou limite.
        const gastosPendentes = transacoes
            .filter(t => 
                t.cardId === cartaoId && 
                t.type === TransactionModel.TYPES.EXPENSE &&
                t.status !== TransactionModel.STATUS.INVOICE_PAID
            )
            .reduce((sum, t) => sum + t.amount, 0);

        return cartao.limit - gastosPendentes;
    }
}

export const cartaoService = new CartaoService();
