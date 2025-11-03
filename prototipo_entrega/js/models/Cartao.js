/**
 * @fileoverview Modelo de dados para Cartões de Crédito
 * @author Sistema de Controle Financeiro
 * @version 1.0.0
 */

/**
 * Classe que representa um cartão de crédito no sistema
 * @class Cartao
 */
class Cartao {
    /**
     * Cria uma nova instância de Cartão
     * @param {Object} data - Dados do cartão
     * @param {string|number} [data.id] - ID único do cartão
     * @param {string} data.nome - Nome do cartão
     * @param {number} data.limite - Limite do cartão
     * @param {string} [data.bandeira='Visa'] - Bandeira do cartão
     * @param {number} [data.diaVencimento=10] - Dia do vencimento (1-30)
     * @param {string} [data.cor='blue'] - Cor do cartão para interface
     * @param {boolean} [data.ativo=true] - Se o cartão está ativo
     */
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.nome = data.nome || '';
        this.limite = data.limite || 0;
        this.bandeira = data.bandeira || 'Visa';
        this.diaVencimento = data.diaVencimento || 10;
        this.cor = data.cor || 'blue';
        this.ativo = data.ativo !== undefined ? data.ativo : true;
        this.dataCriacao = data.dataCriacao || new Date().toISOString();
        this.dataAtualizacao = data.dataAtualizacao || new Date().toISOString();
    }

    /**
     * Gera um ID único para o cartão
     * @returns {number} ID único baseado no timestamp com decimais
     * @private
     */
    generateId() {
        return Date.now() + Math.random();
    }

    /**
     * Valida se os dados do cartão estão corretos
     * @returns {Object} Resultado da validação
     * @returns {boolean} returns.isValid - Se o cartão é válido
     * @returns {string[]} returns.errors - Lista de erros encontrados
     */
    validate() {
        const errors = [];

        if (!this.nome || this.nome.trim() === '') {
            errors.push('Nome do cartão é obrigatório');
        }

        if (this.limite < 0) {
            errors.push('Limite deve ser maior ou igual a zero');
        }

        if (!this.bandeira || this.bandeira.trim() === '') {
            errors.push('Bandeira é obrigatória');
        }

        if (this.diaVencimento < 1 || this.diaVencimento > 30) {
            errors.push('Dia de vencimento deve estar entre 1 e 30');
        }

        if (!Number.isInteger(this.diaVencimento)) {
            errors.push('Dia de vencimento deve ser um número inteiro');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Calcula o próximo vencimento baseado na data atual
     * @param {Date} [dataReferencia] - Data de referência (padrão: hoje)
     * @returns {Date} Data do próximo vencimento
     */
    calcularProximoVencimento(dataReferencia = new Date()) {
        const vencimento = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), this.diaVencimento);
        
        // Se o vencimento deste mês já passou, vai para o próximo mês
        if (vencimento <= dataReferencia) {
            vencimento.setMonth(vencimento.getMonth() + 1);
        }
        
        return vencimento;
    }

    /**
     * Calcula em que mês uma compra cairá baseado na regra dos 4 dias
     * @param {Date|string} dataCompra - Data da compra
     * @returns {Object} Informações sobre o vencimento
     * @returns {Date} returns.dataVencimento - Data do vencimento
     * @returns {boolean} returns.proximoMes - Se cai no próximo mês
     */
    calcularVencimentoCompra(dataCompra) {
        const data = typeof dataCompra === 'string' ? new Date(dataCompra) : dataCompra;
        const hoje = new Date();
        
        // Criar data de vencimento para o mês atual
        let vencimento = new Date(data.getFullYear(), data.getMonth(), this.diaVencimento);
        
        // Regra dos 4 dias: se a compra for feita até 4 dias antes do vencimento,
        // ela vai para a fatura do mês atual, senão vai para o próximo mês
        const diasAntes = Math.ceil((vencimento - data) / (1000 * 60 * 60 * 24));
        
        if (diasAntes < 4 || vencimento <= data) {
            // Vai para o próximo mês
            vencimento.setMonth(vencimento.getMonth() + 1);
            return {
                dataVencimento: vencimento,
                proximoMes: true
            };
        } else {
            // Fica no mês atual
            return {
                dataVencimento: vencimento,
                proximoMes: false
            };
        }
    }

    /**
     * Calcula as datas de vencimento para parcelas
     * @param {Date|string} dataCompra - Data da compra
     * @param {number} numeroParcelas - Número de parcelas
     * @returns {Date[]} Array com as datas de vencimento
     */
    calcularVencimentoParcelas(dataCompra, numeroParcelas) {
        const primeiroVencimento = this.calcularVencimentoCompra(dataCompra);
        const datas = [];
        
        for (let i = 0; i < numeroParcelas; i++) {
            const data = new Date(primeiroVencimento.dataVencimento);
            data.setMonth(data.getMonth() + i);
            datas.push(data);
        }
        
        return datas;
    }

    /**
     * Verifica se o cartão está ativo
     * @returns {boolean} True se o cartão está ativo
     */
    isAtivo() {
        return this.ativo === true;
    }

    /**
     * Ativa o cartão
     * @returns {Cartao} A própria instância para chaining
     */
    ativar() {
        this.ativo = true;
        this.dataAtualizacao = new Date().toISOString();
        return this;
    }

    /**
     * Desativa o cartão
     * @returns {Cartao} A própria instância para chaining
     */
    desativar() {
        this.ativo = false;
        this.dataAtualizacao = new Date().toISOString();
        return this;
    }

    /**
     * Atualiza o limite do cartão
     * @param {number} novoLimite - Novo limite do cartão
     * @returns {Cartao} A própria instância para chaining
     */
    atualizarLimite(novoLimite) {
        if (novoLimite < 0) {
            throw new Error('Limite deve ser maior ou igual a zero');
        }
        
        this.limite = novoLimite;
        this.dataAtualizacao = new Date().toISOString();
        return this;
    }

    /**
     * Atualiza o dia de vencimento
     * @param {number} novoDia - Novo dia de vencimento (1-30)
     * @returns {Cartao} A própria instância para chaining
     */
    atualizarDiaVencimento(novoDia) {
        if (novoDia < 1 || novoDia > 30 || !Number.isInteger(novoDia)) {
            throw new Error('Dia de vencimento deve ser um número inteiro entre 1 e 30');
        }
        
        this.diaVencimento = novoDia;
        this.dataAtualizacao = new Date().toISOString();
        return this;
    }

    /**
     * Calcula o percentual de uso baseado no limite usado
     * @param {number} limiteUsado - Valor já utilizado do limite
     * @returns {number} Percentual de uso (0-100+)
     */
    calcularPercentualUso(limiteUsado) {
        if (this.limite === 0) return 0;
        return (limiteUsado / this.limite) * 100;
    }

    /**
     * Calcula o limite disponível
     * @param {number} limiteUsado - Valor já utilizado do limite
     * @returns {number} Limite disponível
     */
    calcularLimiteDisponivel(limiteUsado) {
        return this.limite - limiteUsado;
    }

    /**
     * Verifica se o cartão está próximo do limite
     * @param {number} limiteUsado - Valor já utilizado do limite
     * @param {number} [threshold=80] - Threshold em percentual (padrão: 80%)
     * @returns {boolean} True se está próximo do limite
     */
    isProximoDoLimite(limiteUsado, threshold = 80) {
        return this.calcularPercentualUso(limiteUsado) >= threshold;
    }

    /**
     * Verifica se o cartão está no limite
     * @param {number} limiteUsado - Valor já utilizado do limite
     * @returns {boolean} True se está no limite ou acima
     */
    isNoLimite(limiteUsado) {
        return limiteUsado >= this.limite;
    }

    /**
     * Converte o cartão para um objeto plain JavaScript
     * @returns {Object} Objeto com todos os dados do cartão
     */
    toJSON() {
        return {
            id: this.id,
            nome: this.nome,
            limite: this.limite,
            bandeira: this.bandeira,
            diaVencimento: this.diaVencimento,
            cor: this.cor,
            ativo: this.ativo,
            dataCriacao: this.dataCriacao,
            dataAtualizacao: this.dataAtualizacao
        };
    }

    /**
     * Cria uma instância de Cartao a partir de um objeto plain
     * @param {Object} data - Dados do cartão
     * @returns {Cartao} Nova instância de Cartao
     * @static
     */
    static fromJSON(data) {
        return new Cartao(data);
    }

    /**
     * Cria uma cópia do cartão
     * @returns {Cartao} Nova instância com os mesmos dados
     */
    clone() {
        return new Cartao(this.toJSON());
    }

    /**
     * Atualiza os dados do cartão
     * @param {Object} updates - Objeto com os campos a serem atualizados
     * @returns {Cartao} A própria instância para chaining
     */
    update(updates) {
        Object.keys(updates).forEach(key => {
            if (this.hasOwnProperty(key) && key !== 'id' && key !== 'dataCriacao') {
                this[key] = updates[key];
            }
        });

        this.dataAtualizacao = new Date().toISOString();
        return this;
    }

    /**
     * Converte o cartão para formato legível
     * @returns {string} Descrição do cartão
     */
    toString() {
        return `${this.nome} (${this.bandeira}) - Limite: R$ ${this.limite.toFixed(2)} - Vence dia ${this.diaVencimento}`;
    }

    /**
     * Cria cartões padrão para inicialização do sistema
     * @returns {Cartao[]} Array com cartões padrão
     * @static
     */
    static criarCartoesPadrao() {
        return [
            new Cartao({
                nome: 'Nubank',
                limite: 2000,
                bandeira: 'Mastercard',
                diaVencimento: 15,
                cor: 'purple'
            }),
            new Cartao({
                nome: 'Itaú',
                limite: 5000,
                bandeira: 'Visa',
                diaVencimento: 10,
                cor: 'orange'
            }),
            new Cartao({
                nome: 'Bradesco',
                limite: 3000,
                bandeira: 'Visa',
                diaVencimento: 20,
                cor: 'red'
            })
        ];
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.Cartao = Cartao;
}