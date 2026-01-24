/**
 * @fileoverview Serviço de gerenciamento de cartões de crédito
 * @author Sistema de Controle Financeiro
 * @version 1.0.0
 */

/**
 * Serviço responsável por gerenciar cartões de crédito
 * @class CartaoService
 */
class CartaoService {
    /**
     * Cria uma nova instância do CartaoService
     * @param {StorageService} storageService - Instância do serviço de storage
     */
    constructor(storageService) {
        this.storage = storageService;
        this.cartoes = [];
    }

    /**
     * Inicializa o serviço carregando os cartões
     * @returns {Promise<boolean>} True se inicializou com sucesso
     */
    async init() {
        try {
            this.cartoes = await this.storage.loadCartoes();
            console.log(`CartaoService inicializado com ${this.cartoes.length} cartões`);
            return true;
        } catch (error) {
            console.error('Erro ao inicializar CartaoService:', error);
            return false;
        }
    }

    /**
     * Adiciona um novo cartão
     * @param {Object} dadosCartao - Dados do cartão
     * @returns {Promise<Cartao|null>} Cartão criado ou null em caso de erro
     */
    async adicionarCartao(dadosCartao) {
        try {
            const cartao = new Cartao(dadosCartao);
            const validacao = cartao.validate();

            if (!validacao.isValid) {
                console.error('Cartão inválido:', validacao.errors);
                return null;
            }

            this.cartoes.push(cartao);
            await this.salvarCartoes();
            
            console.log('Cartão adicionado com sucesso:', cartao.id);
            return cartao;
        } catch (error) {
            console.error('Erro ao adicionar cartão:', error);
            return null;
        }
    }

    /**
     * Atualiza um cartão existente
     * @param {string|number} id - ID do cartão
     * @param {Object} atualizacoes - Dados para atualizar
     * @returns {Promise<Cartao|null>} Cartão atualizado ou null se não encontrado
     */
    async atualizarCartao(id, atualizacoes) {
        try {
            const index = this.cartoes.findIndex(c => c.id == id);
            if (index === -1) {
                console.error('Cartão não encontrado:', id);
                return null;
            }

            const cartao = new Cartao(this.cartoes[index]);
            cartao.update(atualizacoes);
            
            const validacao = cartao.validate();
            if (!validacao.isValid) {
                console.error('Dados de atualização inválidos:', validacao.errors);
                return null;
            }

            this.cartoes[index] = cartao;
            await this.salvarCartoes();
            
            console.log('Cartão atualizado com sucesso:', id);
            return cartao;
        } catch (error) {
            console.error('Erro ao atualizar cartão:', error);
            return null;
        }
    }

    /**
     * Remove um cartão
     * @param {string|number} id - ID do cartão
     * @returns {Promise<boolean>} True se removeu com sucesso
     */
    async removerCartao(id) {
        try {
            const index = this.cartoes.findIndex(c => c.id == id);
            if (index === -1) {
                console.error('Cartão não encontrado:', id);
                return false;
            }

            this.cartoes.splice(index, 1);
            await this.salvarCartoes();
            
            console.log('Cartão removido com sucesso:', id);
            return true;
        } catch (error) {
            console.error('Erro ao remover cartão:', error);
            return false;
        }
    }

    /**
     * Busca um cartão por ID
     * @param {string|number} id - ID do cartão
     * @returns {Cartao|null} Cartão encontrado ou null
     */
    buscarPorId(id) {
        const cartao = this.cartoes.find(c => c.id == id);
        return cartao ? new Cartao(cartao) : null;
    }

    /**
     * Busca cartões por nome
     * @param {string} nome - Nome ou parte do nome do cartão
     * @returns {Cartao[]} Array de cartões
     */
    buscarPorNome(nome) {
        const termoBusca = nome.toLowerCase().trim();
        return this.cartoes
            .filter(c => c.nome.toLowerCase().includes(termoBusca))
            .map(c => new Cartao(c));
    }

    /**
     * Obtém todos os cartões
     * @returns {Cartao[]} Array de cartões
     */
    obterTodos() {
        return this.cartoes.map(c => new Cartao(c));
    }

    /**
     * Obtém cartões ativos
     * @returns {Cartao[]} Array de cartões ativos
     */
    obterAtivos() {
        return this.cartoes
            .filter(c => c.ativo)
            .map(c => new Cartao(c));
    }

    /**
     * Obtém cartões inativos
     * @returns {Cartao[]} Array de cartões inativos
     */
    obterInativos() {
        return this.cartoes
            .filter(c => !c.ativo)
            .map(c => new Cartao(c));
    }

    /**
     * Calcula o limite disponível de um cartão
     * @param {string|number} cartaoId - ID do cartão
     * @param {Transacao[]} transacoes - Array de transações
     * @returns {number} Limite disponível
     */
    calcularLimiteDisponivel(cartaoId, transacoes) {
        const cartao = this.buscarPorId(cartaoId);
        if (!cartao) {
            console.error('Cartão não encontrado para cálculo de limite:', cartaoId);
            return 0;
        }

        return cartao.calcularLimiteDisponivel(transacoes);
    }

    /**
     * Calcula o utilizado do cartão
     * @param {string|number} cartaoId - ID do cartão
     * @param {Transacao[]} transacoes - Array de transações
     * @returns {number} Valor utilizado
     */
    calcularUtilizado(cartaoId, transacoes) {
        const cartao = this.buscarPorId(cartaoId);
        if (!cartao) {
            console.error('Cartão não encontrado para cálculo de utilizado:', cartaoId);
            return 0;
        }

        return cartao.calcularUtilizado(transacoes);
    }

    /**
     * Verifica se o cartão pode processar uma compra
     * @param {string|number} cartaoId - ID do cartão
     * @param {number} valor - Valor da compra
     * @param {Transacao[]} transacoes - Array de transações
     * @returns {Object} Resultado da verificação
     */
    podeProcessarCompra(cartaoId, valor, transacoes) {
        const cartao = this.buscarPorId(cartaoId);
        if (!cartao) {
            return {
                pode: false,
                motivo: 'Cartão não encontrado'
            };
        }

        return cartao.podeProcessarCompra(valor, transacoes);
    }

    /**
     * Calcula a data de vencimento da fatura
     * @param {string|number} cartaoId - ID do cartão
     * @param {Date|string} [dataCompra=null] - Data da compra (default: hoje)
     * @returns {Date|null} Data de vencimento ou null se cartão não encontrado
     */
    calcularVencimento(cartaoId, dataCompra = null) {
        const cartao = this.buscarPorId(cartaoId);
        if (!cartao) {
            console.error('Cartão não encontrado para cálculo de vencimento:', cartaoId);
            return null;
        }

        return cartao.calcularVencimento(dataCompra);
    }

    /**
     * Obtém o resumo de uso dos cartões
     * @param {Transacao[]} transacoes - Array de transações
     * @returns {Object} Resumo com informações de cada cartão
     */
    obterResumoUso(transacoes) {
        const resumo = {};

        this.cartoes.forEach(cartao => {
            const cartaoObj = new Cartao(cartao);
            const utilizado = cartaoObj.calcularUtilizado(transacoes);
            const disponivel = cartaoObj.calcularLimiteDisponivel(transacoes);
            const percentualUso = cartaoObj.limite > 0 ? (utilizado / cartaoObj.limite) * 100 : 0;

            resumo[cartao.id] = {
                id: cartao.id,
                nome: cartao.nome,
                limite: cartao.limite,
                utilizado: utilizado,
                disponivel: disponivel,
                percentualUso: Math.round(percentualUso * 100) / 100,
                ativo: cartao.ativo,
                vencimento: cartao.vencimento,
                fechamento: cartao.fechamento
            };
        });

        return resumo;
    }

    /**
     * Obtém as próximas faturas dos cartões
     * @param {Transacao[]} transacoes - Array de transações
     * @param {number} [mesesAFrente=3] - Número de meses à frente para calcular
     * @returns {Object} Faturas organizadas por cartão e mês
     */
    obterProximasFaturas(transacoes, mesesAFrente = 3) {
        const faturas = {};
        const hoje = new Date();

        this.cartoes.forEach(cartao => {
            if (!cartao.ativo) return;

            const cartaoObj = new Cartao(cartao);
            faturas[cartao.id] = {
                cartao: {
                    id: cartao.id,
                    nome: cartao.nome,
                    vencimento: cartao.vencimento,
                    fechamento: cartao.fechamento
                },
                faturas: []
            };

            // Calcula faturas para os próximos meses
            for (let i = 0; i < mesesAFrente; i++) {
                const dataReferencia = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
                const vencimento = cartaoObj.calcularVencimento(dataReferencia);
                
                // Filtra transações para esta fatura
                const transacoesFatura = transacoes.filter(t => {
                    if (t.cartaoId != cartao.id) return false;
                    
                    const dataTransacao = new Date(t.getDataEfetiva());
                    const vencimentoFatura = cartaoObj.calcularVencimento(dataTransacao);
                    
                    return vencimentoFatura && 
                           vencimentoFatura.getTime() === vencimento.getTime();
                });

                const totalFatura = transacoesFatura.reduce((total, t) => 
                    total + Math.abs(t.getValorEfetivo()), 0);

                faturas[cartao.id].faturas.push({
                    mesReferencia: `${dataReferencia.getFullYear()}-${String(dataReferencia.getMonth() + 1).padStart(2, '0')}`,
                    vencimento: vencimento,
                    valor: totalFatura,
                    quantidade: transacoesFatura.length,
                    transacoes: transacoesFatura
                });
            }
        });

        return faturas;
    }

    /**
     * Verifica cartões próximos ao limite
     * @param {Transacao[]} transacoes - Array de transações
     * @param {number} [percentualAlerta=80] - Percentual para alerta (default: 80%)
     * @returns {Cartao[]} Array de cartões próximos ao limite
     */
    verificarProximosAoLimite(transacoes, percentualAlerta = 80) {
        const cartoesAlerta = [];

        this.cartoes.forEach(cartao => {
            if (!cartao.ativo || cartao.limite <= 0) return;

            const cartaoObj = new Cartao(cartao);
            const utilizado = cartaoObj.calcularUtilizado(transacoes);
            const percentualUso = (utilizado / cartao.limite) * 100;

            if (percentualUso >= percentualAlerta) {
                cartoesAlerta.push({
                    ...cartaoObj,
                    utilizado: utilizado,
                    percentualUso: Math.round(percentualUso * 100) / 100
                });
            }
        });

        return cartoesAlerta;
    }

    /**
     * Ativa um cartão
     * @param {string|number} id - ID do cartão
     * @returns {Promise<boolean>} True se ativou com sucesso
     */
    async ativarCartao(id) {
        return await this.atualizarCartao(id, { ativo: true }) !== null;
    }

    /**
     * Desativa um cartão
     * @param {string|number} id - ID do cartão
     * @returns {Promise<boolean>} True se desativou com sucesso
     */
    async desativarCartao(id) {
        return await this.atualizarCartao(id, { ativo: false }) !== null;
    }

    /**
     * Altera o limite de um cartão
     * @param {string|number} id - ID do cartão
     * @param {number} novoLimite - Novo limite
     * @returns {Promise<boolean>} True se alterou com sucesso
     */
    async alterarLimite(id, novoLimite) {
        if (novoLimite < 0) {
            console.error('Limite não pode ser negativo');
            return false;
        }

        return await this.atualizarCartao(id, { limite: novoLimite }) !== null;
    }

    /**
     * Atualiza datas de vencimento e fechamento
     * @param {string|number} id - ID do cartão
     * @param {number} vencimento - Dia do vencimento
     * @param {number} fechamento - Dia do fechamento
     * @returns {Promise<boolean>} True se atualizou com sucesso
     */
    async atualizarDatas(id, vencimento, fechamento) {
        if (vencimento < 1 || vencimento > 31 || fechamento < 1 || fechamento > 31) {
            console.error('Dias de vencimento e fechamento devem estar entre 1 e 31');
            return false;
        }

        return await this.atualizarCartao(id, { vencimento, fechamento }) !== null;
    }

    /**
     * Salva os cartões no storage
     * @returns {Promise<boolean>} True se salvou com sucesso
     * @private
     */
    async salvarCartoes() {
        return await this.storage.saveCartoes(this.cartoes);
    }

    /**
     * Exporta dados dos cartões
     * @returns {Object} Dados dos cartões para exportação
     */
    exportarDados() {
        return {
            cartoes: this.cartoes.map(c => ({
                id: c.id,
                nome: c.nome,
                limite: c.limite,
                vencimento: c.vencimento,
                fechamento: c.fechamento,
                ativo: c.ativo,
                cor: c.cor,
                icone: c.icone
            })),
            quantidade: this.cartoes.length,
            ativos: this.cartoes.filter(c => c.ativo).length,
            limiteTotal: this.cartoes.reduce((total, c) => total + (c.limite || 0), 0)
        };
    }

    /**
     * Importa dados de cartões
     * @param {Object} dados - Dados para importar
     * @returns {Promise<boolean>} True se importou com sucesso
     */
    async importarDados(dados) {
        try {
            if (!dados.cartoes || !Array.isArray(dados.cartoes)) {
                console.error('Dados de importação inválidos');
                return false;
            }

            const cartoesValidos = [];
            
            for (const dadosCartao of dados.cartoes) {
                try {
                    const cartao = new Cartao(dadosCartao);
                    const validacao = cartao.validate();
                    
                    if (validacao.isValid) {
                        cartoesValidos.push(cartao);
                    } else {
                        console.warn('Cartão inválido ignorado:', dadosCartao, validacao.errors);
                    }
                } catch (error) {
                    console.warn('Erro ao importar cartão:', dadosCartao, error);
                }
            }

            this.cartoes = cartoesValidos;
            await this.salvarCartoes();
            
            console.log(`${cartoesValidos.length} cartões importados com sucesso`);
            return true;
        } catch (error) {
            console.error('Erro ao importar dados dos cartões:', error);
            return false;
        }
    }

    /**
     * Obtém estatísticas dos cartões
     * @param {Transacao[]} transacoes - Array de transações
     * @returns {Object} Estatísticas dos cartões
     */
    obterEstatisticas(transacoes) {
        const total = this.cartoes.length;
        const ativos = this.cartoes.filter(c => c.ativo).length;
        const inativos = total - ativos;
        const limiteTotal = this.cartoes.reduce((soma, c) => soma + (c.limite || 0), 0);
        
        let utilizadoTotal = 0;
        const utilizacaoPorCartao = {};

        this.cartoes.forEach(cartao => {
            const cartaoObj = new Cartao(cartao);
            const utilizado = cartaoObj.calcularUtilizado(transacoes);
            utilizadoTotal += utilizado;
            utilizacaoPorCartao[cartao.id] = {
                nome: cartao.nome,
                limite: cartao.limite,
                utilizado: utilizado,
                disponivel: cartao.limite - utilizado,
                percentual: cartao.limite > 0 ? (utilizado / cartao.limite) * 100 : 0
            };
        });

        return {
            quantidade: {
                total,
                ativos,
                inativos
            },
            limites: {
                total: limiteTotal,
                utilizado: utilizadoTotal,
                disponivel: limiteTotal - utilizadoTotal,
                percentualUso: limiteTotal > 0 ? (utilizadoTotal / limiteTotal) * 100 : 0
            },
            utilizacaoPorCartao
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.CartaoService = CartaoService;
}