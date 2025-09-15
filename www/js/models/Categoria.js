/**
 * @fileoverview Modelo de dados para Categorias Financeiras
 * @author Sistema de Controle Financeiro
 * @version 1.0.0
 */

/**
 * Classe que representa uma categoria financeira no sistema
 * @class Categoria
 */
class Categoria {
    /**
     * Cria uma nova instância de Categoria
     * @param {Object} data - Dados da categoria
     * @param {string} data.nome - Nome da categoria
     * @param {string} [data.tipo='despesa'] - Tipo da categoria ('receita' ou 'despesa')
     * @param {string} [data.cor='gray'] - Cor da categoria para interface
     * @param {string} [data.icone='📋'] - Ícone da categoria
     * @param {string} [data.descricao=''] - Descrição da categoria
     * @param {boolean} [data.ativa=true] - Se a categoria está ativa
     */
    constructor(data = {}) {
        this.nome = data.nome || '';
        this.tipo = data.tipo || 'despesa';
        this.cor = data.cor || 'gray';
        this.icone = data.icone || '📋';
        this.descricao = data.descricao || '';
        this.ativa = data.ativa !== undefined ? data.ativa : true;
        this.dataCriacao = data.dataCriacao || new Date().toISOString();
        this.dataAtualizacao = data.dataAtualizacao || new Date().toISOString();
    }

    /**
     * Valida se os dados da categoria estão corretos
     * @returns {Object} Resultado da validação
     * @returns {boolean} returns.isValid - Se a categoria é válida
     * @returns {string[]} returns.errors - Lista de erros encontrados
     */
    validate() {
        const errors = [];

        if (!this.nome || this.nome.trim() === '') {
            errors.push('Nome da categoria é obrigatório');
        }

        if (!['receita', 'despesa'].includes(this.tipo)) {
            errors.push('Tipo deve ser "receita" ou "despesa"');
        }

        if (this.nome.length > 50) {
            errors.push('Nome da categoria deve ter no máximo 50 caracteres');
        }

        if (this.descricao.length > 200) {
            errors.push('Descrição deve ter no máximo 200 caracteres');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Verifica se a categoria é do tipo receita
     * @returns {boolean} True se for receita
     */
    isReceita() {
        return this.tipo === 'receita';
    }

    /**
     * Verifica se a categoria é do tipo despesa
     * @returns {boolean} True se for despesa
     */
    isDespesa() {
        return this.tipo === 'despesa';
    }

    /**
     * Verifica se a categoria está ativa
     * @returns {boolean} True se a categoria está ativa
     */
    isAtiva() {
        return this.ativa === true;
    }

    /**
     * Ativa a categoria
     * @returns {Categoria} A própria instância para chaining
     */
    ativar() {
        this.ativa = true;
        this.dataAtualizacao = new Date().toISOString();
        return this;
    }

    /**
     * Desativa a categoria
     * @returns {Categoria} A própria instância para chaining
     */
    desativar() {
        this.ativa = false;
        this.dataAtualizacao = new Date().toISOString();
        return this;
    }

    /**
     * Atualiza o nome da categoria
     * @param {string} novoNome - Novo nome da categoria
     * @returns {Categoria} A própria instância para chaining
     */
    atualizarNome(novoNome) {
        if (!novoNome || novoNome.trim() === '') {
            throw new Error('Nome da categoria é obrigatório');
        }
        
        if (novoNome.length > 50) {
            throw new Error('Nome da categoria deve ter no máximo 50 caracteres');
        }
        
        this.nome = novoNome.trim();
        this.dataAtualizacao = new Date().toISOString();
        return this;
    }

    /**
     * Atualiza a descrição da categoria
     * @param {string} novaDescricao - Nova descrição da categoria
     * @returns {Categoria} A própria instância para chaining
     */
    atualizarDescricao(novaDescricao) {
        if (novaDescricao && novaDescricao.length > 200) {
            throw new Error('Descrição deve ter no máximo 200 caracteres');
        }
        
        this.descricao = novaDescricao || '';
        this.dataAtualizacao = new Date().toISOString();
        return this;
    }

    /**
     * Atualiza a cor da categoria
     * @param {string} novaCor - Nova cor da categoria
     * @returns {Categoria} A própria instância para chaining
     */
    atualizarCor(novaCor) {
        this.cor = novaCor || 'gray';
        this.dataAtualizacao = new Date().toISOString();
        return this;
    }

    /**
     * Atualiza o ícone da categoria
     * @param {string} novoIcone - Novo ícone da categoria
     * @returns {Categoria} A própria instância para chaining
     */
    atualizarIcone(novoIcone) {
        this.icone = novoIcone || '📋';
        this.dataAtualizacao = new Date().toISOString();
        return this;
    }

    /**
     * Converte a categoria para um objeto plain JavaScript
     * @returns {Object} Objeto com todos os dados da categoria
     */
    toJSON() {
        return {
            nome: this.nome,
            tipo: this.tipo,
            cor: this.cor,
            icone: this.icone,
            descricao: this.descricao,
            ativa: this.ativa,
            dataCriacao: this.dataCriacao,
            dataAtualizacao: this.dataAtualizacao
        };
    }

    /**
     * Cria uma instância de Categoria a partir de um objeto plain
     * @param {Object} data - Dados da categoria
     * @returns {Categoria} Nova instância de Categoria
     * @static
     */
    static fromJSON(data) {
        return new Categoria(data);
    }

    /**
     * Cria uma cópia da categoria
     * @returns {Categoria} Nova instância com os mesmos dados
     */
    clone() {
        return new Categoria(this.toJSON());
    }

    /**
     * Atualiza os dados da categoria
     * @param {Object} updates - Objeto com os campos a serem atualizados
     * @returns {Categoria} A própria instância para chaining
     */
    update(updates) {
        Object.keys(updates).forEach(key => {
            if (this.hasOwnProperty(key) && key !== 'dataCriacao') {
                this[key] = updates[key];
            }
        });

        this.dataAtualizacao = new Date().toISOString();
        return this;
    }

    /**
     * Converte a categoria para formato legível
     * @returns {string} Descrição da categoria
     */
    toString() {
        return `${this.icone} ${this.nome} (${this.tipo.toUpperCase()})`;
    }

    /**
     * Cria categorias padrão para inicialização do sistema
     * @returns {Categoria[]} Array com categorias padrão
     * @static
     */
    static criarCategoriasPadrao() {
        return [
            // Categorias de Despesa
            new Categoria({
                nome: 'Alimentação',
                tipo: 'despesa',
                cor: 'red',
                icone: '🍽️',
                descricao: 'Gastos com comida e bebida'
            }),
            new Categoria({
                nome: 'Transporte',
                tipo: 'despesa',
                cor: 'blue',
                icone: '🚗',
                descricao: 'Combustível, uber, transporte público'
            }),
            new Categoria({
                nome: 'Moradia',
                tipo: 'despesa',
                cor: 'green',
                icone: '🏠',
                descricao: 'Aluguel, condomínio, contas da casa'
            }),
            new Categoria({
                nome: 'Saúde',
                tipo: 'despesa',
                cor: 'purple',
                icone: '⚕️',
                descricao: 'Médicos, medicamentos, plano de saúde'
            }),
            new Categoria({
                nome: 'Lazer',
                tipo: 'despesa',
                cor: 'pink',
                icone: '🎉',
                descricao: 'Entretenimento, cinema, viagens'
            }),
            new Categoria({
                nome: 'Educação',
                tipo: 'despesa',
                cor: 'yellow',
                icone: '📚',
                descricao: 'Cursos, livros, material escolar'
            }),
            new Categoria({
                nome: 'Compras',
                tipo: 'despesa',
                cor: 'orange',
                icone: '🛒',
                descricao: 'Roupas, eletrônicos, diversos'
            }),
            
            // Categorias de Receita
            new Categoria({
                nome: 'Salário',
                tipo: 'receita',
                cor: 'green',
                icone: '💰',
                descricao: 'Salário principal'
            }),
            new Categoria({
                nome: 'Freelance',
                tipo: 'receita',
                cor: 'blue',
                icone: '💻',
                descricao: 'Trabalhos extras e freelances'
            }),
            new Categoria({
                nome: 'Investimentos',
                tipo: 'receita',
                cor: 'purple',
                icone: '📈',
                descricao: 'Rendimentos de investimentos'
            }),
            new Categoria({
                nome: 'Outros',
                tipo: 'receita',
                cor: 'gray',
                icone: '💵',
                descricao: 'Outras fontes de renda'
            })
        ];
    }

    /**
     * Busca categorias por nome
     * @param {Categoria[]} categorias - Array de categorias
     * @param {string} termo - Termo de busca
     * @returns {Categoria[]} Categorias encontradas
     * @static
     */
    static buscarPorNome(categorias, termo) {
        if (!termo || termo.trim() === '') return categorias;
        
        const termoBusca = termo.toLowerCase().trim();
        return categorias.filter(categoria => 
            categoria.nome.toLowerCase().includes(termoBusca) ||
            categoria.descricao.toLowerCase().includes(termoBusca)
        );
    }

    /**
     * Filtra categorias por tipo
     * @param {Categoria[]} categorias - Array de categorias
     * @param {string} tipo - Tipo de categoria ('receita' ou 'despesa')
     * @returns {Categoria[]} Categorias filtradas
     * @static
     */
    static filtrarPorTipo(categorias, tipo) {
        if (!tipo || !['receita', 'despesa'].includes(tipo)) return categorias;
        
        return categorias.filter(categoria => categoria.tipo === tipo);
    }

    /**
     * Filtra categorias ativas
     * @param {Categoria[]} categorias - Array de categorias
     * @returns {Categoria[]} Categorias ativas
     * @static
     */
    static filtrarAtivas(categorias) {
        return categorias.filter(categoria => categoria.isAtiva());
    }

    /**
     * Ordena categorias por nome
     * @param {Categoria[]} categorias - Array de categorias
     * @param {boolean} [crescente=true] - Ordem crescente ou decrescente
     * @returns {Categoria[]} Categorias ordenadas
     * @static
     */
    static ordenarPorNome(categorias, crescente = true) {
        return [...categorias].sort((a, b) => {
            const comparacao = a.nome.localeCompare(b.nome);
            return crescente ? comparacao : -comparacao;
        });
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.Categoria = Categoria;
}