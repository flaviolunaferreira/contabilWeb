/**
 * @fileoverview Serviço de gerenciamento de categorias
 * @author Sistema de Controle Financeiro
 * @version 1.0.0
 */

/**
 * Serviço responsável por gerenciar categorias de transações
 * @class CategoriaService
 */
class CategoriaService {
    /**
     * Cria uma nova instância do CategoriaService
     * @param {StorageService} storageService - Instância do serviço de storage
     */
    constructor(storageService) {
        this.storage = storageService;
        this.categorias = [];
        this.categoriasDefault = [
            { nome: 'Alimentação', tipo: 'despesa', cor: '#FF6B6B', icone: '🍔' },
            { nome: 'Transporte', tipo: 'despesa', cor: '#4ECDC4', icone: '🚗' },
            { nome: 'Moradia', tipo: 'despesa', cor: '#45B7D1', icone: '🏠' },
            { nome: 'Saúde', tipo: 'despesa', cor: '#96CEB4', icone: '🏥' },
            { nome: 'Educação', tipo: 'despesa', cor: '#FFEAA7', icone: '📚' },
            { nome: 'Lazer', tipo: 'despesa', cor: '#DDA0DD', icone: '🎮' },
            { nome: 'Compras', tipo: 'despesa', cor: '#98D8C8', icone: '🛒' },
            { nome: 'Serviços', tipo: 'despesa', cor: '#F7DC6F', icone: '🔧' },
            { nome: 'Salário', tipo: 'receita', cor: '#52C41A', icone: '💰' },
            { nome: 'Freelance', tipo: 'receita', cor: '#1890FF', icone: '💼' },
            { nome: 'Investimentos', tipo: 'receita', cor: '#722ED1', icone: '📈' },
            { nome: 'Vendas', tipo: 'receita', cor: '#EB2F96', icone: '💸' }
        ];
    }

    /**
     * Inicializa o serviço carregando as categorias
     * @returns {Promise<boolean>} True se inicializou com sucesso
     */
    async init() {
        try {
            this.categorias = await this.storage.loadCategorias();
            
            // Se não há categorias, criar as padrão
            if (this.categorias.length === 0) {
                await this.criarCategoriasDefault();
            }
            
            console.log(`CategoriaService inicializado com ${this.categorias.length} categorias`);
            return true;
        } catch (error) {
            console.error('Erro ao inicializar CategoriaService:', error);
            return false;
        }
    }

    /**
     * Cria categorias padrão do sistema
     * @returns {Promise<boolean>} True se criou com sucesso
     * @private
     */
    async criarCategoriasDefault() {
        try {
            for (const dadosCategoria of this.categoriasDefault) {
                const categoria = new Categoria(dadosCategoria);
                this.categorias.push(categoria);
            }

            await this.salvarCategorias();
            console.log('Categorias padrão criadas com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao criar categorias padrão:', error);
            return false;
        }
    }

    /**
     * Adiciona uma nova categoria
     * @param {Object} dadosCategoria - Dados da categoria
     * @returns {Promise<Categoria|null>} Categoria criada ou null em caso de erro
     */
    async adicionarCategoria(dadosCategoria) {
        try {
            const categoria = new Categoria(dadosCategoria);
            const validacao = categoria.validate();

            if (!validacao.isValid) {
                console.error('Categoria inválida:', validacao.errors);
                return null;
            }

            // Verificar se já existe categoria com mesmo nome
            if (this.buscarPorNome(categoria.nome)) {
                console.error('Já existe uma categoria com este nome:', categoria.nome);
                return null;
            }

            this.categorias.push(categoria);
            await this.salvarCategorias();
            
            console.log('Categoria adicionada com sucesso:', categoria.nome);
            return categoria;
        } catch (error) {
            console.error('Erro ao adicionar categoria:', error);
            return null;
        }
    }

    /**
     * Atualiza uma categoria existente
     * @param {string} nome - Nome da categoria (chave única)
     * @param {Object} atualizacoes - Dados para atualizar
     * @returns {Promise<Categoria|null>} Categoria atualizada ou null se não encontrada
     */
    async atualizarCategoria(nome, atualizacoes) {
        try {
            const index = this.categorias.findIndex(c => c.nome === nome);
            if (index === -1) {
                console.error('Categoria não encontrada:', nome);
                return null;
            }

            const categoria = new Categoria(this.categorias[index]);
            categoria.update(atualizacoes);
            
            const validacao = categoria.validate();
            if (!validacao.isValid) {
                console.error('Dados de atualização inválidos:', validacao.errors);
                return null;
            }

            // Se mudou o nome, verificar se novo nome já existe
            if (atualizacoes.nome && atualizacoes.nome !== nome) {
                const categoriaExistente = this.buscarPorNome(atualizacoes.nome);
                if (categoriaExistente) {
                    console.error('Já existe uma categoria com este nome:', atualizacoes.nome);
                    return null;
                }
            }

            this.categorias[index] = categoria;
            await this.salvarCategorias();
            
            console.log('Categoria atualizada com sucesso:', nome);
            return categoria;
        } catch (error) {
            console.error('Erro ao atualizar categoria:', error);
            return null;
        }
    }

    /**
     * Remove uma categoria
     * @param {string} nome - Nome da categoria
     * @param {boolean} [forcar=false] - Forçar remoção mesmo com transações
     * @returns {Promise<boolean>} True se removeu com sucesso
     */
    async removerCategoria(nome, forcar = false) {
        try {
            const index = this.categorias.findIndex(c => c.nome === nome);
            if (index === -1) {
                console.error('Categoria não encontrada:', nome);
                return false;
            }

            // Verificar se categoria tem transações associadas
            if (!forcar) {
                const temTransacoes = await this.verificarUso(nome);
                if (temTransacoes) {
                    console.error('Categoria tem transações associadas. Use forcar=true para remover:', nome);
                    return false;
                }
            }

            this.categorias.splice(index, 1);
            await this.salvarCategorias();
            
            console.log('Categoria removida com sucesso:', nome);
            return true;
        } catch (error) {
            console.error('Erro ao remover categoria:', error);
            return false;
        }
    }

    /**
     * Busca uma categoria por nome
     * @param {string} nome - Nome da categoria
     * @returns {Categoria|null} Categoria encontrada ou null
     */
    buscarPorNome(nome) {
        const categoria = this.categorias.find(c => c.nome === nome);
        return categoria ? new Categoria(categoria) : null;
    }

    /**
     * Busca categorias por tipo
     * @param {string} tipo - Tipo da categoria ('receita' ou 'despesa')
     * @returns {Categoria[]} Array de categorias
     */
    buscarPorTipo(tipo) {
        return this.categorias
            .filter(c => c.tipo === tipo)
            .map(c => new Categoria(c));
    }

    /**
     * Obtém todas as categorias
     * @returns {Categoria[]} Array de categorias
     */
    obterTodas() {
        return this.categorias.map(c => new Categoria(c));
    }

    /**
     * Obtém categorias de receita
     * @returns {Categoria[]} Array de categorias de receita
     */
    obterReceitas() {
        return this.buscarPorTipo('receita');
    }

    /**
     * Obtém categorias de despesa
     * @returns {Categoria[]} Array de categorias de despesa
     */
    obterDespesas() {
        return this.buscarPorTipo('despesa');
    }

    /**
     * Obtém lista de nomes das categorias
     * @param {string} [tipo=null] - Filtrar por tipo (opcional)
     * @returns {string[]} Array de nomes
     */
    obterNomes(tipo = null) {
        let categorias = this.categorias;
        
        if (tipo) {
            categorias = categorias.filter(c => c.tipo === tipo);
        }

        return categorias.map(c => c.nome).sort();
    }

    /**
     * Verifica se uma categoria é válida
     * @param {string} nome - Nome da categoria
     * @returns {boolean} True se é válida
     */
    isValida(nome) {
        return this.categorias.some(c => c.nome === nome);
    }

    /**
     * Verifica se categoria está sendo usada em transações
     * @param {string} nome - Nome da categoria
     * @returns {Promise<boolean>} True se está sendo usada
     */
    async verificarUso(nome) {
        try {
            const transacoes = await this.storage.loadTransacoes();
            return transacoes.some(t => t.categoria === nome);
        } catch (error) {
            console.error('Erro ao verificar uso da categoria:', error);
            return false;
        }
    }

    /**
     * Obtém estatísticas de uso das categorias
     * @param {Transacao[]} transacoes - Array de transações
     * @returns {Object} Estatísticas por categoria
     */
    obterEstatisticasUso(transacoes) {
        const estatisticas = {};

        // Inicializar todas as categorias
        this.categorias.forEach(categoria => {
            estatisticas[categoria.nome] = {
                categoria: new Categoria(categoria),
                quantidade: 0,
                total: 0,
                media: 0,
                ultima: null
            };
        });

        // Processar transações
        transacoes.forEach(transacao => {
            const nomeCategoria = transacao.categoria || 'Sem categoria';
            
            if (!estatisticas[nomeCategoria]) {
                estatisticas[nomeCategoria] = {
                    categoria: { nome: nomeCategoria, tipo: 'indefinido', cor: '#CCCCCC', icone: '❓' },
                    quantidade: 0,
                    total: 0,
                    media: 0,
                    ultima: null
                };
            }

            const stats = estatisticas[nomeCategoria];
            const valor = Math.abs(transacao.getValorEfetivo());
            
            stats.quantidade++;
            stats.total += valor;
            
            const dataTransacao = new Date(transacao.getDataEfetiva());
            if (!stats.ultima || dataTransacao > stats.ultima) {
                stats.ultima = dataTransacao;
            }
        });

        // Calcular médias
        Object.values(estatisticas).forEach(stats => {
            if (stats.quantidade > 0) {
                stats.media = stats.total / stats.quantidade;
            }
        });

        return estatisticas;
    }

    /**
     * Ordena categorias por critério
     * @param {string} criterio - Critério de ordenação ('nome', 'tipo', 'uso')
     * @param {Transacao[]} [transacoes=null] - Transações para ordenação por uso
     * @returns {Categoria[]} Array de categorias ordenadas
     */
    ordenar(criterio, transacoes = null) {
        let categorias = [...this.categorias];

        switch (criterio) {
            case 'nome':
                categorias.sort((a, b) => a.nome.localeCompare(b.nome));
                break;
                
            case 'tipo':
                categorias.sort((a, b) => {
                    if (a.tipo !== b.tipo) {
                        return a.tipo === 'receita' ? -1 : 1;
                    }
                    return a.nome.localeCompare(b.nome);
                });
                break;
                
            case 'uso':
                if (transacoes) {
                    const estatisticas = this.obterEstatisticasUso(transacoes);
                    categorias.sort((a, b) => {
                        const usoA = estatisticas[a.nome]?.quantidade || 0;
                        const usoB = estatisticas[b.nome]?.quantidade || 0;
                        return usoB - usoA; // Decrescente
                    });
                }
                break;
                
            default:
                console.warn('Critério de ordenação inválido:', criterio);
        }

        return categorias.map(c => new Categoria(c));
    }

    /**
     * Filtra categorias por termo de busca
     * @param {string} termo - Termo a buscar
     * @returns {Categoria[]} Array de categorias filtradas
     */
    filtrar(termo) {
        if (!termo || termo.trim() === '') {
            return this.obterTodas();
        }

        const termoBusca = termo.toLowerCase().trim();
        return this.categorias
            .filter(c => 
                c.nome.toLowerCase().includes(termoBusca) ||
                c.tipo.toLowerCase().includes(termoBusca)
            )
            .map(c => new Categoria(c));
    }

    /**
     * Cria categoria automaticamente se não existir
     * @param {string} nome - Nome da categoria
     * @param {string} tipo - Tipo da categoria
     * @returns {Promise<Categoria>} Categoria criada ou existente
     */
    async criarSeNaoExistir(nome, tipo) {
        let categoria = this.buscarPorNome(nome);
        
        if (!categoria) {
            const cores = {
                receita: ['#52C41A', '#1890FF', '#722ED1', '#EB2F96'],
                despesa: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
            };
            
            const icones = {
                receita: ['💰', '💼', '📈', '💸'],
                despesa: ['🛒', '🍔', '🚗', '🏠', '🏥', '📚', '🎮', '🔧']
            };
            
            const coresDisponiveis = cores[tipo] || ['#CCCCCC'];
            const iconesDisponiveis = icones[tipo] || ['❓'];
            
            categoria = await this.adicionarCategoria({
                nome: nome,
                tipo: tipo,
                cor: coresDisponiveis[Math.floor(Math.random() * coresDisponiveis.length)],
                icone: iconesDisponiveis[Math.floor(Math.random() * iconesDisponiveis.length)]
            });
        }
        
        return categoria;
    }

    /**
     * Mescla duas categorias
     * @param {string} categoriaOrigem - Nome da categoria origem
     * @param {string} categoriaDestino - Nome da categoria destino
     * @returns {Promise<boolean>} True se mesclou com sucesso
     */
    async mesclarCategorias(categoriaOrigem, categoriaDestino) {
        try {
            const origem = this.buscarPorNome(categoriaOrigem);
            const destino = this.buscarPorNome(categoriaDestino);

            if (!origem || !destino) {
                console.error('Uma das categorias não foi encontrada');
                return false;
            }

            if (origem.tipo !== destino.tipo) {
                console.error('Não é possível mesclar categorias de tipos diferentes');
                return false;
            }

            // Atualizar transações da categoria origem para destino
            const transacoes = await this.storage.loadTransacoes();
            const transacoesAtualizadas = transacoes.map(t => {
                if (t.categoria === categoriaOrigem) {
                    t.categoria = categoriaDestino;
                }
                return t;
            });

            await this.storage.saveTransacoes(transacoesAtualizadas);
            
            // Remover categoria origem
            await this.removerCategoria(categoriaOrigem, true);
            
            console.log(`Categoria '${categoriaOrigem}' mesclada com '${categoriaDestino}'`);
            return true;
        } catch (error) {
            console.error('Erro ao mesclar categorias:', error);
            return false;
        }
    }

    /**
     * Salva as categorias no storage
     * @returns {Promise<boolean>} True se salvou com sucesso
     * @private
     */
    async salvarCategorias() {
        return await this.storage.saveCategorias(this.categorias);
    }

    /**
     * Exporta dados das categorias
     * @returns {Object} Dados das categorias para exportação
     */
    exportarDados() {
        return {
            categorias: this.categorias.map(c => ({
                nome: c.nome,
                tipo: c.tipo,
                cor: c.cor,
                icone: c.icone
            })),
            quantidade: this.categorias.length,
            receitas: this.categorias.filter(c => c.tipo === 'receita').length,
            despesas: this.categorias.filter(c => c.tipo === 'despesa').length
        };
    }

    /**
     * Importa dados de categorias
     * @param {Object} dados - Dados para importar
     * @param {boolean} [substituir=false] - Se deve substituir categorias existentes
     * @returns {Promise<boolean>} True se importou com sucesso
     */
    async importarDados(dados, substituir = false) {
        try {
            if (!dados.categorias || !Array.isArray(dados.categorias)) {
                console.error('Dados de importação inválidos');
                return false;
            }

            const categoriasValidas = [];
            
            for (const dadosCategoria of dados.categorias) {
                try {
                    const categoria = new Categoria(dadosCategoria);
                    const validacao = categoria.validate();
                    
                    if (validacao.isValid) {
                        // Verificar se já existe
                        const existente = this.buscarPorNome(categoria.nome);
                        if (!existente || substituir) {
                            categoriasValidas.push(categoria);
                        }
                    } else {
                        console.warn('Categoria inválida ignorada:', dadosCategoria, validacao.errors);
                    }
                } catch (error) {
                    console.warn('Erro ao importar categoria:', dadosCategoria, error);
                }
            }

            if (substituir) {
                this.categorias = categoriasValidas;
            } else {
                // Adicionar apenas novas categorias
                categoriasValidas.forEach(categoria => {
                    const existente = this.buscarPorNome(categoria.nome);
                    if (!existente) {
                        this.categorias.push(categoria);
                    }
                });
            }

            await this.salvarCategorias();
            
            console.log(`${categoriasValidas.length} categorias importadas com sucesso`);
            return true;
        } catch (error) {
            console.error('Erro ao importar dados das categorias:', error);
            return false;
        }
    }

    /**
     * Reset das categorias para padrão
     * @returns {Promise<boolean>} True se resetou com sucesso
     */
    async resetParaPadrao() {
        try {
            this.categorias = [];
            await this.criarCategoriasDefault();
            console.log('Categorias resetadas para padrão');
            return true;
        } catch (error) {
            console.error('Erro ao resetar categorias:', error);
            return false;
        }
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.CategoriaService = CategoriaService;
}