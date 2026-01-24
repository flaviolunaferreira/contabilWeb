/**
 * @fileoverview Modelo de dados para Transações Financeiras
 * @author Sistema de Controle Financeiro
 * @version 1.0.0
 */

/**
 * Classe que representa uma transação financeira no sistema
 * @class Transacao
 */
class Transacao {
    /**
     * Cria uma nova instância de Transação
     * @param {Object} data - Dados da transação
     * @param {string} data.id - ID único da transação
     * @param {string} data.descricao - Descrição da transação
     * @param {number} data.valor - Valor da transação (positivo para receita, negativo para despesa)
     * @param {string} data.data - Data da transação no formato YYYY-MM-DD
     * @param {string} data.tipo - Tipo da transação ('receita' ou 'despesa')
     * @param {string} data.status - Status da transação ('realizado' ou 'previsto')
     * @param {string} [data.categoria=''] - Categoria da transação
     * @param {number} [data.cartaoId=null] - ID do cartão de crédito (se aplicável)
     * @param {number} [data.valorPrevisto=null] - Valor previsto para transações futuras
     * @param {string} [data.dataPrevista=null] - Data prevista para transações futuras
     * @param {number} [data.parcelas=1] - Número total de parcelas
     * @param {number} [data.parcelaAtual=1] - Número da parcela atual
     * @param {number} [data.parcelasTotal=1] - Total de parcelas (alias para parcelas)
     * @param {number} [data.parcelaNumero=1] - Número da parcela (alias para parcelaAtual)
     */
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.descricao = data.descricao || '';
        this.valor = data.valor || 0;
        this.data = data.data || null;
        this.tipo = data.tipo || 'despesa';
        this.status = data.status || 'previsto';
        this.categoria = data.categoria || '';
        this.cartaoId = data.cartaoId || null;
        this.valorPrevisto = data.valorPrevisto || null;
        this.dataPrevista = data.dataPrevista || null;
        this.parcelas = data.parcelas || data.parcelasTotal || 1;
        this.parcelaAtual = data.parcelaAtual || data.parcelaNumero || 1;
        
        // Aliases para compatibilidade
        this.parcelasTotal = this.parcelas;
        this.parcelaNumero = this.parcelaAtual;
    }

    /**
     * Gera um ID único para a transação
     * @returns {string} ID único baseado no timestamp
     * @private
     */
    generateId() {
        return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Valida se os dados da transação estão corretos
     * @returns {Object} Resultado da validação
     * @returns {boolean} returns.isValid - Se a transação é válida
     * @returns {string[]} returns.errors - Lista de erros encontrados
     */
    validate() {
        const errors = [];

        if (!this.descricao || this.descricao.trim() === '') {
            errors.push('Descrição é obrigatória');
        }

        if (this.valor === 0 && this.valorPrevisto === 0) {
            errors.push('Valor deve ser diferente de zero');
        }

        if (!['receita', 'despesa'].includes(this.tipo)) {
            errors.push('Tipo deve ser "receita" ou "despesa"');
        }

        if (!['realizado', 'previsto'].includes(this.status)) {
            errors.push('Status deve ser "realizado" ou "previsto"');
        }

        if (this.status === 'realizado' && !this.data) {
            errors.push('Data é obrigatória para transações realizadas');
        }

        if (this.status === 'previsto' && !this.dataPrevista) {
            errors.push('Data prevista é obrigatória para transações futuras');
        }

        if (this.parcelas < 1) {
            errors.push('Número de parcelas deve ser maior que zero');
        }

        if (this.parcelaAtual < 1 || this.parcelaAtual > this.parcelas) {
            errors.push('Parcela atual deve estar entre 1 e o total de parcelas');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Verifica se a transação é parcelada
     * @returns {boolean} True se possui mais de uma parcela
     */
    isParcelada() {
        return this.parcelas > 1;
    }

    /**
     * Verifica se a transação está relacionada a um cartão de crédito
     * @returns {boolean} True se possui cartaoId
     */
    isCartaoCredito() {
        return this.cartaoId !== null && this.cartaoId !== undefined;
    }

    /**
     * Obtém o valor efetivo da transação baseado no status
     * @returns {number} Valor da transação
     */
    getValorEfetivo() {
        if (this.status === 'realizado') {
            return this.valor;
        } else {
            return this.valorPrevisto || this.valor;
        }
    }

    /**
     * Obtém a data efetiva da transação baseada no status
     * @returns {string} Data da transação no formato YYYY-MM-DD
     */
    getDataEfetiva() {
        if (this.status === 'realizado') {
            return this.data;
        } else {
            return this.dataPrevista || this.data;
        }
    }

    /**
     * Verifica se a transação é uma receita
     * @returns {boolean} True se for receita
     */
    isReceita() {
        return this.tipo === 'receita';
    }

    /**
     * Verifica se a transação é uma despesa
     * @returns {boolean} True se for despesa
     */
    isDespesa() {
        return this.tipo === 'despesa';
    }

    /**
     * Verifica se a transação já foi realizada
     * @returns {boolean} True se foi realizada
     */
    isRealizada() {
        return this.status === 'realizado';
    }

    /**
     * Verifica se a transação é uma previsão
     * @returns {boolean} True se for previsão
     */
    isPrevista() {
        return this.status === 'previsto';
    }

    /**
     * Converte a transação para um objeto plain JavaScript
     * @returns {Object} Objeto com todos os dados da transação
     */
    toJSON() {
        return {
            id: this.id,
            descricao: this.descricao,
            valor: this.valor,
            data: this.data,
            tipo: this.tipo,
            status: this.status,
            categoria: this.categoria,
            cartaoId: this.cartaoId,
            valorPrevisto: this.valorPrevisto,
            dataPrevista: this.dataPrevista,
            parcelas: this.parcelas,
            parcelaAtual: this.parcelaAtual,
            parcelasTotal: this.parcelasTotal,
            parcelaNumero: this.parcelaNumero
        };
    }

    /**
     * Cria uma instância de Transacao a partir de um objeto plain
     * @param {Object} data - Dados da transação
     * @returns {Transacao} Nova instância de Transacao
     * @static
     */
    static fromJSON(data) {
        return new Transacao(data);
    }

    /**
     * Cria uma cópia da transação
     * @returns {Transacao} Nova instância com os mesmos dados
     */
    clone() {
        return new Transacao(this.toJSON());
    }

    /**
     * Atualiza os dados da transação
     * @param {Object} updates - Objeto com os campos a serem atualizados
     * @returns {Transacao} A própria instância para chaining
     */
    update(updates) {
        Object.keys(updates).forEach(key => {
            if (this.hasOwnProperty(key)) {
                this[key] = updates[key];
            }
        });

        // Manter aliases sincronizados
        this.parcelasTotal = this.parcelas;
        this.parcelaNumero = this.parcelaAtual;

        return this;
    }

    /**
     * Converte a transação para formato legível
     * @returns {string} Descrição da transação
     */
    toString() {
        const valor = this.getValorEfetivo();
        const data = this.getDataEfetiva();
        const parcela = this.isParcelada() ? ` (${this.parcelaAtual}/${this.parcelas})` : '';
        
        return `${this.descricao}${parcela} - ${this.tipo.toUpperCase()} - R$ ${Math.abs(valor).toFixed(2)} - ${data}`;
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.Transacao = Transacao;
}