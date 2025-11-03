/**
 * @fileoverview Serviço de gerenciamento de transações
 * @author Sistema de Controle Financeiro
 * @version 1.0.0
 */

/**
 * Serviço responsável por gerenciar transações financeiras
 * @class TransacaoService
 */
class TransacaoService {
    /**
     * Cria uma nova instância do TransacaoService
     * @param {StorageService} storageService - Instância do serviço de storage
     */
    constructor(storageService) {
        this.storage = storageService;
        this.transacoes = [];
        this.filtros = {
            periodo: 'todos',
            categoria: 'todas',
            tipo: 'todos',
            status: 'todos',
            dataInicio: null,
            dataFim: null,
            descricao: ''
        };
    }

    /**
     * Inicializa o serviço carregando as transações
     * @returns {Promise<boolean>} True se inicializou com sucesso
     */
    async init() {
        try {
            this.transacoes = await this.storage.loadTransacoes();
            console.log(`TransacaoService inicializado com ${this.transacoes.length} transações`);
            return true;
        } catch (error) {
            console.error('Erro ao inicializar TransacaoService:', error);
            return false;
        }
    }

    /**
     * Adiciona uma nova transação
     * @param {Object} dadosTransacao - Dados da transação
     * @returns {Promise<Transacao|null>} Transação criada ou null em caso de erro
     */
    async adicionarTransacao(dadosTransacao) {
        try {
            const transacao = new Transacao(dadosTransacao);
            const validacao = transacao.validate();

            if (!validacao.isValid) {
                console.error('Transação inválida:', validacao.errors);
                return null;
            }

            this.transacoes.push(transacao);
            await this.salvarTransacoes();
            
            console.log('Transação adicionada com sucesso:', transacao.id);
            return transacao;
        } catch (error) {
            console.error('Erro ao adicionar transação:', error);
            return null;
        }
    }

    /**
     * Atualiza uma transação existente
     * @param {string} id - ID da transação
     * @param {Object} atualizacoes - Dados para atualizar
     * @returns {Promise<Transacao|null>} Transação atualizada ou null se não encontrada
     */
    async atualizarTransacao(id, atualizacoes) {
        try {
            const index = this.transacoes.findIndex(t => t.id === id);
            if (index === -1) {
                console.error('Transação não encontrada:', id);
                return null;
            }

            const transacao = new Transacao(this.transacoes[index]);
            transacao.update(atualizacoes);
            
            const validacao = transacao.validate();
            if (!validacao.isValid) {
                console.error('Dados de atualização inválidos:', validacao.errors);
                return null;
            }

            this.transacoes[index] = transacao;
            await this.salvarTransacoes();
            
            console.log('Transação atualizada com sucesso:', id);
            return transacao;
        } catch (error) {
            console.error('Erro ao atualizar transação:', error);
            return null;
        }
    }

    /**
     * Remove uma transação
     * @param {string} id - ID da transação
     * @returns {Promise<boolean>} True se removeu com sucesso
     */
    async removerTransacao(id) {
        try {
            const index = this.transacoes.findIndex(t => t.id === id);
            if (index === -1) {
                console.error('Transação não encontrada:', id);
                return false;
            }

            this.transacoes.splice(index, 1);
            await this.salvarTransacoes();
            
            console.log('Transação removida com sucesso:', id);
            return true;
        } catch (error) {
            console.error('Erro ao remover transação:', error);
            return false;
        }
    }

    /**
     * Busca uma transação por ID
     * @param {string} id - ID da transação
     * @returns {Transacao|null} Transação encontrada ou null
     */
    buscarPorId(id) {
        const transacao = this.transacoes.find(t => t.id === id);
        return transacao ? new Transacao(transacao) : null;
    }

    /**
     * Busca transações por cartão
     * @param {string|number} cartaoId - ID do cartão
     * @param {string} [status=null] - Status das transações
     * @returns {Transacao[]} Array de transações
     */
    buscarPorCartao(cartaoId, status = null) {
        let filtradas = this.transacoes.filter(t => t.cartaoId == cartaoId);
        
        if (status) {
            filtradas = filtradas.filter(t => t.status === status);
        }

        return filtradas.map(t => new Transacao(t));
    }

    /**
     * Busca transações por categoria
     * @param {string} categoria - Nome da categoria
     * @returns {Transacao[]} Array de transações
     */
    buscarPorCategoria(categoria) {
        return this.transacoes
            .filter(t => t.categoria === categoria)
            .map(t => new Transacao(t));
    }

    /**
     * Busca transações por período
     * @param {Date|string} dataInicio - Data de início
     * @param {Date|string} dataFim - Data de fim
     * @returns {Transacao[]} Array de transações
     */
    buscarPorPeriodo(dataInicio, dataFim) {
        const inicio = typeof dataInicio === 'string' ? new Date(dataInicio) : dataInicio;
        const fim = typeof dataFim === 'string' ? new Date(dataFim) : dataFim;

        return this.transacoes
            .filter(t => {
                const dataTransacao = new Date(t.getDataEfetiva());
                return dataTransacao >= inicio && dataTransacao <= fim;
            })
            .map(t => new Transacao(t));
    }

    /**
     * Aplica filtros às transações
     * @param {Object} filtros - Objeto com filtros
     * @returns {Transacao[]} Array de transações filtradas
     */
    aplicarFiltros(filtros = this.filtros) {
        let resultado = [...this.transacoes];

        // Filtro por tipo
        if (filtros.tipo && filtros.tipo !== 'todos') {
            resultado = resultado.filter(t => t.tipo === filtros.tipo);
        }

        // Filtro por status
        if (filtros.status && filtros.status !== 'todos') {
            resultado = resultado.filter(t => t.status === filtros.status);
        }

        // Filtro por categoria
        if (filtros.categoria && filtros.categoria !== 'todas') {
            resultado = resultado.filter(t => t.categoria === filtros.categoria);
        }

        // Filtro por período
        if (filtros.dataInicio && filtros.dataFim) {
            const inicio = new Date(filtros.dataInicio);
            const fim = new Date(filtros.dataFim);
            resultado = resultado.filter(t => {
                const dataTransacao = new Date(t.getDataEfetiva());
                return dataTransacao >= inicio && dataTransacao <= fim;
            });
        }

        // Filtro por descrição
        if (filtros.descricao && filtros.descricao.trim() !== '') {
            const termo = filtros.descricao.toLowerCase().trim();
            resultado = resultado.filter(t => 
                t.descricao.toLowerCase().includes(termo)
            );
        }

        return resultado.map(t => new Transacao(t));
    }

    /**
     * Obtém todas as transações
     * @returns {Transacao[]} Array de transações
     */
    obterTodas() {
        return this.transacoes.map(t => new Transacao(t));
    }

    /**
     * Obtém transações realizadas
     * @returns {Transacao[]} Array de transações realizadas
     */
    obterRealizadas() {
        return this.transacoes
            .filter(t => t.status === 'realizado')
            .map(t => new Transacao(t));
    }

    /**
     * Obtém transações previstas
     * @returns {Transacao[]} Array de transações previstas
     */
    obterPrevistas() {
        return this.transacoes
            .filter(t => t.status === 'previsto')
            .map(t => new Transacao(t));
    }

    /**
     * Obtém transações de receita
     * @returns {Transacao[]} Array de transações de receita
     */
    obterReceitas() {
        return this.transacoes
            .filter(t => t.tipo === 'receita')
            .map(t => new Transacao(t));
    }

    /**
     * Obtém transações de despesa
     * @returns {Transacao[]} Array de transações de despesa
     */
    obterDespesas() {
        return this.transacoes
            .filter(t => t.tipo === 'despesa')
            .map(t => new Transacao(t));
    }

    /**
     * Calcula totais por tipo e status
     * @returns {Object} Objeto com os totais
     */
    calcularTotais() {
        const totais = {
            receitaRealizada: 0,
            receitaPrevista: 0,
            despesaRealizada: 0,
            despesaPrevista: 0,
            saldoRealizado: 0,
            saldoPrevisto: 0,
            saldoTotal: 0
        };

        this.transacoes.forEach(transacao => {
            const valor = Math.abs(transacao.getValorEfetivo());
            
            if (transacao.tipo === 'receita') {
                if (transacao.status === 'realizado') {
                    totais.receitaRealizada += valor;
                } else {
                    totais.receitaPrevista += valor;
                }
            } else {
                if (transacao.status === 'realizado') {
                    totais.despesaRealizada += valor;
                } else {
                    totais.despesaPrevista += valor;
                }
            }
        });

        totais.saldoRealizado = totais.receitaRealizada - totais.despesaRealizada;
        totais.saldoPrevisto = totais.receitaPrevista - totais.despesaPrevista;
        totais.saldoTotal = totais.saldoRealizado + totais.saldoPrevisto;

        return totais;
    }

    /**
     * Agrupa transações por categoria
     * @param {Transacao[]} [transacoes=null] - Transações a agrupar (ou todas se null)
     * @returns {Object} Objeto com transações agrupadas por categoria
     */
    agruparPorCategoria(transacoes = null) {
        const lista = transacoes || this.transacoes;
        const agrupado = {};

        lista.forEach(transacao => {
            const categoria = transacao.categoria || 'Sem categoria';
            if (!agrupado[categoria]) {
                agrupado[categoria] = {
                    transacoes: [],
                    total: 0,
                    quantidade: 0
                };
            }

            agrupado[categoria].transacoes.push(new Transacao(transacao));
            agrupado[categoria].total += Math.abs(transacao.getValorEfetivo());
            agrupado[categoria].quantidade++;
        });

        return agrupado;
    }

    /**
     * Agrupa transações por mês
     * @param {Transacao[]} [transacoes=null] - Transações a agrupar (ou todas se null)
     * @returns {Object} Objeto com transações agrupadas por mês
     */
    agruparPorMes(transacoes = null) {
        const lista = transacoes || this.transacoes;
        const agrupado = {};

        lista.forEach(transacao => {
            const data = new Date(transacao.getDataEfetiva());
            const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            
            if (!agrupado[chave]) {
                agrupado[chave] = {
                    transacoes: [],
                    receitas: 0,
                    despesas: 0,
                    saldo: 0,
                    quantidade: 0
                };
            }

            const valor = Math.abs(transacao.getValorEfetivo());
            agrupado[chave].transacoes.push(new Transacao(transacao));
            agrupado[chave].quantidade++;

            if (transacao.tipo === 'receita') {
                agrupado[chave].receitas += valor;
            } else {
                agrupado[chave].despesas += valor;
            }

            agrupado[chave].saldo = agrupado[chave].receitas - agrupado[chave].despesas;
        });

        return agrupado;
    }

    /**
     * Marca uma transação como realizada
     * @param {string} id - ID da transação
     * @param {string} dataRealizacao - Data da realização
     * @param {number} [valorRealizado=null] - Valor realizado (se diferente do previsto)
     * @returns {Promise<boolean>} True se marcou com sucesso
     */
    async marcarComoRealizada(id, dataRealizacao, valorRealizado = null) {
        try {
            const transacao = this.buscarPorId(id);
            if (!transacao) {
                console.error('Transação não encontrada:', id);
                return false;
            }

            const atualizacoes = {
                status: 'realizado',
                data: dataRealizacao,
                valor: valorRealizado || transacao.valorPrevisto || transacao.valor
            };

            const resultado = await this.atualizarTransacao(id, atualizacoes);
            return resultado !== null;
        } catch (error) {
            console.error('Erro ao marcar transação como realizada:', error);
            return false;
        }
    }

    /**
     * Salva as transações no storage
     * @returns {Promise<boolean>} True se salvou com sucesso
     * @private
     */
    async salvarTransacoes() {
        return await this.storage.saveTransacoes(this.transacoes);
    }

    /**
     * Remove transações em lote por critérios
     * @param {Object} criterios - Critérios para remoção
     * @returns {Promise<number>} Número de transações removidas
     */
    async removerEmLote(criterios) {
        try {
            const quantidadeInicial = this.transacoes.length;
            
            this.transacoes = this.transacoes.filter(transacao => {
                let manter = true;

                if (criterios.descricao && transacao.descricao.includes(criterios.descricao)) {
                    manter = false;
                }

                if (criterios.categoria && transacao.categoria === criterios.categoria) {
                    manter = false;
                }

                if (criterios.dataInicio && criterios.dataFim) {
                    const dataTransacao = new Date(transacao.getDataEfetiva());
                    const inicio = new Date(criterios.dataInicio);
                    const fim = new Date(criterios.dataFim);
                    
                    if (dataTransacao >= inicio && dataTransacao <= fim) {
                        manter = false;
                    }
                }

                return manter;
            });

            const removidas = quantidadeInicial - this.transacoes.length;
            if (removidas > 0) {
                await this.salvarTransacoes();
            }

            console.log(`${removidas} transações removidas em lote`);
            return removidas;
        } catch (error) {
            console.error('Erro ao remover transações em lote:', error);
            return 0;
        }
    }

    /**
     * Obtém estatísticas das transações
     * @returns {Object} Objeto com estatísticas
     */
    obterEstatisticas() {
        const totais = this.calcularTotais();
        const porCategoria = this.agruparPorCategoria();
        const porMes = this.agruparPorMes();

        return {
            totais,
            quantidade: {
                total: this.transacoes.length,
                realizadas: this.obterRealizadas().length,
                previstas: this.obterPrevistas().length,
                receitas: this.obterReceitas().length,
                despesas: this.obterDespesas().length
            },
            categorias: Object.keys(porCategoria).length,
            meses: Object.keys(porMes).length,
            porCategoria,
            porMes
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.TransacaoService = TransacaoService;
}