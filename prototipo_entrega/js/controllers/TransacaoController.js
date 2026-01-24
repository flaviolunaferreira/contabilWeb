/**
 * @fileoverview Controller para gerenciamento de transações na interface
 * @author Sistema de Controle Financeiro
 * @version 1.0.0
 */

/**
 * Controller responsável por gerenciar a interface de transações
 * @class TransacaoController
 */
class TransacaoController {
    /**
     * Cria uma nova instância do TransacaoController
     * @param {TransacaoService} transacaoService - Instância do serviço de transações
     * @param {CartaoService} cartaoService - Instância do serviço de cartões
     * @param {CategoriaService} categoriaService - Instância do serviço de categorias
     */
    constructor(transacaoService, cartaoService, categoriaService) {
        this.transacaoService = transacaoService;
        this.cartaoService = cartaoService;
        this.categoriaService = categoriaService;
        
        this.elementos = {};
        this.filtroAtual = {};
        this.transacaoEditando = null;
        
        // Bind dos métodos para preservar contexto
        this.handleSubmitTransacao = this.handleSubmitTransacao.bind(this);
        this.handleExcluirTransacao = this.handleExcluirTransacao.bind(this);
        this.handleEditarTransacao = this.handleEditarTransacao.bind(this);
        this.handleMarcarRealizada = this.handleMarcarRealizada.bind(this);
        this.handleFiltroChange = this.handleFiltroChange.bind(this);
    }

    /**
     * Inicializa o controller
     * @returns {Promise<boolean>} True se inicializou com sucesso
     */
    async init() {
        try {
            this.mapearElementos();
            this.configurarEventListeners();
            await this.atualizarListaTransacoes();
            await this.atualizarSelectsCategorias();
            await this.atualizarSelectsCartoes();
            
            console.log('TransacaoController inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao inicializar TransacaoController:', error);
            return false;
        }
    }

    /**
     * Mapeia elementos do DOM
     * @private
     */
    mapearElementos() {
        this.elementos = {
            // Formulário de transação
            formTransacao: document.getElementById('formTransacao'),
            inputId: document.getElementById('transacaoId'),
            inputDescricao: document.getElementById('descricao'),
            inputValor: document.getElementById('valor'),
            inputData: document.getElementById('data'),
            selectTipo: document.getElementById('tipo'),
            selectCategoria: document.getElementById('categoria'),
            selectCartao: document.getElementById('cartao'),
            selectStatus: document.getElementById('status'),
            inputParcelas: document.getElementById('parcelas'),
            btnSubmit: document.getElementById('btnSubmitTransacao'),
            btnCancelar: document.getElementById('btnCancelarTransacao'),

            // Lista de transações
            listaTransacoes: document.getElementById('listaTransacoes'),
            
            // Filtros
            filtroTipo: document.getElementById('filtroTipo'),
            filtroCategoria: document.getElementById('filtroCategoria'),
            filtroStatus: document.getElementById('filtroStatus'),
            filtroDataInicio: document.getElementById('filtroDataInicio'),
            filtroDataFim: document.getElementById('filtroDataFim'),
            filtroDescricao: document.getElementById('filtroDescricao'),
            btnLimparFiltros: document.getElementById('btnLimparFiltros'),

            // Modais
            modalTransacao: document.getElementById('modalTransacao'),
            modalConfirmacao: document.getElementById('modalConfirmacao'),

            // Botões
            btnNovaTransacao: document.getElementById('btnNovaTransacao'),
            btnExportarTransacoes: document.getElementById('btnExportarTransacoes'),
            btnImportarTransacoes: document.getElementById('btnImportarTransacoes'),

            // Totais
            totalReceitas: document.getElementById('totalReceitas'),
            totalDespesas: document.getElementById('totalDespesas'),
            saldoGeral: document.getElementById('saldoGeral')
        };
    }

    /**
     * Configura event listeners
     * @private
     */
    configurarEventListeners() {
        // Formulário de transação
        if (this.elementos.formTransacao) {
            this.elementos.formTransacao.addEventListener('submit', this.handleSubmitTransacao);
        }

        if (this.elementos.btnCancelar) {
            this.elementos.btnCancelar.addEventListener('click', () => this.cancelarEdicao());
        }

        if (this.elementos.btnNovaTransacao) {
            this.elementos.btnNovaTransacao.addEventListener('click', () => this.novaTransacao());
        }

        // Filtros
        const filtros = [
            'filtroTipo', 'filtroCategoria', 'filtroStatus', 
            'filtroDataInicio', 'filtroDataFim', 'filtroDescricao'
        ];

        filtros.forEach(filtro => {
            if (this.elementos[filtro]) {
                this.elementos[filtro].addEventListener('change', this.handleFiltroChange);
                if (filtro === 'filtroDescricao') {
                    this.elementos[filtro].addEventListener('input', this.debounce(this.handleFiltroChange, 300));
                }
            }
        });

        if (this.elementos.btnLimparFiltros) {
            this.elementos.btnLimparFiltros.addEventListener('click', () => this.limparFiltros());
        }

        // Tipo de transação - mostrar/ocultar cartão
        if (this.elementos.selectTipo) {
            this.elementos.selectTipo.addEventListener('change', () => this.toggleCampoCartao());
        }

        // Botões de ação em massa
        if (this.elementos.btnExportarTransacoes) {
            this.elementos.btnExportarTransacoes.addEventListener('click', () => this.exportarTransacoes());
        }

        if (this.elementos.btnImportarTransacoes) {
            this.elementos.btnImportarTransacoes.addEventListener('click', () => this.importarTransacoes());
        }
    }

    /**
     * Handle do submit do formulário de transação
     * @param {Event} event - Evento do formulário
     * @private
     */
    async handleSubmitTransacao(event) {
        event.preventDefault();
        
        try {
            const dadosTransacao = this.coletarDadosFormulario();
            const isEdicao = this.transacaoEditando !== null;

            let resultado;
            if (isEdicao) {
                resultado = await this.transacaoService.atualizarTransacao(
                    this.transacaoEditando.id, 
                    dadosTransacao
                );
            } else {
                resultado = await this.transacaoService.adicionarTransacao(dadosTransacao);
            }

            if (resultado) {
                this.mostrarMensagem(
                    `Transação ${isEdicao ? 'atualizada' : 'adicionada'} com sucesso!`, 
                    'success'
                );
                this.limparFormulario();
                this.cancelarEdicao();
                await this.atualizarListaTransacoes();
                await this.atualizarTotais();
                this.fecharModal();
            } else {
                this.mostrarMensagem('Erro ao salvar transação. Verifique os dados informados.', 'error');
            }
        } catch (error) {
            console.error('Erro ao submeter transação:', error);
            this.mostrarMensagem('Erro interno. Tente novamente.', 'error');
        }
    }

    /**
     * Handle para exclusão de transação
     * @param {string} id - ID da transação
     * @private
     */
    async handleExcluirTransacao(id) {
        try {
            const transacao = this.transacaoService.buscarPorId(id);
            if (!transacao) {
                this.mostrarMensagem('Transação não encontrada.', 'error');
                return;
            }

            const confirmou = await this.confirmarAcao(
                'Confirmar Exclusão',
                `Deseja realmente excluir a transação "${transacao.descricao}"?`
            );

            if (confirmou) {
                const sucesso = await this.transacaoService.removerTransacao(id);
                if (sucesso) {
                    this.mostrarMensagem('Transação excluída com sucesso!', 'success');
                    await this.atualizarListaTransacoes();
                    await this.atualizarTotais();
                } else {
                    this.mostrarMensagem('Erro ao excluir transação.', 'error');
                }
            }
        } catch (error) {
            console.error('Erro ao excluir transação:', error);
            this.mostrarMensagem('Erro interno. Tente novamente.', 'error');
        }
    }

    /**
     * Handle para edição de transação
     * @param {string} id - ID da transação
     * @private
     */
    async handleEditarTransacao(id) {
        try {
            const transacao = this.transacaoService.buscarPorId(id);
            if (!transacao) {
                this.mostrarMensagem('Transação não encontrada.', 'error');
                return;
            }

            this.transacaoEditando = transacao;
            this.preencherFormulario(transacao);
            this.abrirModal();
            
            console.log('Editando transação:', id);
        } catch (error) {
            console.error('Erro ao editar transação:', error);
            this.mostrarMensagem('Erro ao carregar dados da transação.', 'error');
        }
    }

    /**
     * Handle para marcar transação como realizada
     * @param {string} id - ID da transação
     * @private
     */
    async handleMarcarRealizada(id) {
        try {
            const hoje = new Date().toISOString().split('T')[0];
            const sucesso = await this.transacaoService.marcarComoRealizada(id, hoje);
            
            if (sucesso) {
                this.mostrarMensagem('Transação marcada como realizada!', 'success');
                await this.atualizarListaTransacoes();
                await this.atualizarTotais();
            } else {
                this.mostrarMensagem('Erro ao marcar transação como realizada.', 'error');
            }
        } catch (error) {
            console.error('Erro ao marcar transação como realizada:', error);
            this.mostrarMensagem('Erro interno. Tente novamente.', 'error');
        }
    }

    /**
     * Handle para mudança nos filtros
     * @private
     */
    async handleFiltroChange() {
        this.atualizarFiltroAtual();
        await this.atualizarListaTransacoes();
    }

    /**
     * Coleta dados do formulário
     * @returns {Object} Dados da transação
     * @private
     */
    coletarDadosFormulario() {
        const dados = {
            descricao: this.elementos.inputDescricao.value.trim(),
            valor: parseFloat(this.elementos.inputValor.value) || 0,
            data: this.elementos.inputData.value,
            tipo: this.elementos.selectTipo.value,
            categoria: this.elementos.selectCategoria.value,
            status: this.elementos.selectStatus.value,
            parcelas: parseInt(this.elementos.inputParcelas.value) || 1
        };

        // Adicionar cartão apenas para despesas
        if (dados.tipo === 'despesa' && this.elementos.selectCartao.value) {
            dados.cartaoId = this.elementos.selectCartao.value;
        }

        return dados;
    }

    /**
     * Preenche formulário com dados da transação
     * @param {Transacao} transacao - Transação para editar
     * @private
     */
    preencherFormulario(transacao) {
        this.elementos.inputId.value = transacao.id;
        this.elementos.inputDescricao.value = transacao.descricao;
        this.elementos.inputValor.value = Math.abs(transacao.getValorEfetivo());
        this.elementos.inputData.value = transacao.getDataEfetiva().split('T')[0];
        this.elementos.selectTipo.value = transacao.tipo;
        this.elementos.selectCategoria.value = transacao.categoria || '';
        this.elementos.selectStatus.value = transacao.status;
        this.elementos.inputParcelas.value = transacao.parcelas || 1;
        
        if (transacao.cartaoId) {
            this.elementos.selectCartao.value = transacao.cartaoId;
        }

        this.toggleCampoCartao();
        this.elementos.btnSubmit.textContent = 'Atualizar Transação';
    }

    /**
     * Limpa o formulário
     * @private
     */
    limparFormulario() {
        this.elementos.formTransacao.reset();
        this.elementos.inputId.value = '';
        this.elementos.inputData.value = new Date().toISOString().split('T')[0];
        this.elementos.btnSubmit.textContent = 'Adicionar Transação';
        this.toggleCampoCartao();
    }

    /**
     * Toggle do campo cartão baseado no tipo de transação
     * @private
     */
    toggleCampoCartao() {
        const campoCartao = document.getElementById('campoCartao');
        if (campoCartao) {
            const isDespesa = this.elementos.selectTipo.value === 'despesa';
            campoCartao.style.display = isDespesa ? 'block' : 'none';
            
            if (!isDespesa) {
                this.elementos.selectCartao.value = '';
            }
        }
    }

    /**
     * Atualiza a lista de transações na interface
     * @private
     */
    async atualizarListaTransacoes() {
        try {
            if (!this.elementos.listaTransacoes) return;

            const transacoesFiltradas = this.transacaoService.aplicarFiltros(this.filtroAtual);
            const html = this.renderizarListaTransacoes(transacoesFiltradas);
            this.elementos.listaTransacoes.innerHTML = html;
            
            // Configurar eventos dos botões da lista
            this.configurarEventosLista();
            
            await this.atualizarTotais();
        } catch (error) {
            console.error('Erro ao atualizar lista de transações:', error);
        }
    }

    /**
     * Renderiza a lista de transações
     * @param {Transacao[]} transacoes - Array de transações
     * @returns {string} HTML da lista
     * @private
     */
    renderizarListaTransacoes(transacoes) {
        if (transacoes.length === 0) {
            return '<div class="text-center text-gray-500 py-8">Nenhuma transação encontrada</div>';
        }

        return transacoes.map(transacao => {
            const valorFormatado = this.formatarMoeda(Math.abs(transacao.getValorEfetivo()));
            const dataFormatada = this.formatarData(transacao.getDataEfetiva());
            const corTipo = transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600';
            const corStatus = transacao.status === 'realizado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
            
            return `
                <div class="bg-white rounded-lg shadow p-4 mb-3 border-l-4 ${transacao.tipo === 'receita' ? 'border-green-500' : 'border-red-500'}">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-900">${transacao.descricao}</h3>
                            <div class="text-sm text-gray-600 mt-1">
                                <span class="inline-block mr-4">📅 ${dataFormatada}</span>
                                <span class="inline-block mr-4">📁 ${transacao.categoria || 'Sem categoria'}</span>
                                ${transacao.cartaoId ? `<span class="inline-block mr-4">💳 Cartão</span>` : ''}
                                ${transacao.parcelas > 1 ? `<span class="inline-block">📦 ${transacao.parcelas}x</span>` : ''}
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-bold ${corTipo}">
                                ${transacao.tipo === 'receita' ? '+' : '-'} ${valorFormatado}
                            </div>
                            <span class="inline-block px-2 py-1 rounded-full text-xs font-medium ${corStatus}">
                                ${transacao.status === 'realizado' ? 'Realizado' : 'Previsto'}
                            </span>
                        </div>
                    </div>
                    <div class="flex justify-end mt-3 space-x-2">
                        ${transacao.status === 'previsto' ? `
                            <button onclick="transacaoController.handleMarcarRealizada('${transacao.id}')" 
                                    class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                                ✓ Realizar
                            </button>
                        ` : ''}
                        <button onclick="transacaoController.handleEditarTransacao('${transacao.id}')" 
                                class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                            ✏️ Editar
                        </button>
                        <button onclick="transacaoController.handleExcluirTransacao('${transacao.id}')" 
                                class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Configura eventos dos botões da lista
     * @private
     */
    configurarEventosLista() {
        // Os eventos são configurados inline no HTML para simplicidade
        // Em uma implementação mais robusta, seria melhor usar event delegation
    }

    /**
     * Atualiza selects de categorias
     * @private
     */
    async atualizarSelectsCategorias() {
        const selects = [this.elementos.selectCategoria, this.elementos.filtroCategoria];
        
        selects.forEach(select => {
            if (select) {
                const opcaoAtual = select.value;
                select.innerHTML = '';
                
                // Opção padrão
                const defaultText = select === this.elementos.filtroCategoria ? 'Todas as categorias' : 'Selecione uma categoria';
                select.appendChild(new Option(defaultText, ''));
                
                // Categorias de receita
                const receitas = this.categoriaService.obterReceitas();
                if (receitas.length > 0) {
                    const optgroupReceitas = document.createElement('optgroup');
                    optgroupReceitas.label = 'Receitas';
                    receitas.forEach(categoria => {
                        optgroupReceitas.appendChild(new Option(categoria.nome, categoria.nome));
                    });
                    select.appendChild(optgroupReceitas);
                }
                
                // Categorias de despesa
                const despesas = this.categoriaService.obterDespesas();
                if (despesas.length > 0) {
                    const optgroupDespesas = document.createElement('optgroup');
                    optgroupDespesas.label = 'Despesas';
                    despesas.forEach(categoria => {
                        optgroupDespesas.appendChild(new Option(categoria.nome, categoria.nome));
                    });
                    select.appendChild(optgroupDespesas);
                }
                
                // Restaurar seleção
                if (opcaoAtual) {
                    select.value = opcaoAtual;
                }
            }
        });
    }

    /**
     * Atualiza selects de cartões
     * @private
     */
    async atualizarSelectsCartoes() {
        if (this.elementos.selectCartao) {
            const opcaoAtual = this.elementos.selectCartao.value;
            this.elementos.selectCartao.innerHTML = '';
            
            // Opção padrão
            this.elementos.selectCartao.appendChild(new Option('Selecione um cartão', ''));
            
            // Cartões ativos
            const cartoes = this.cartaoService.obterAtivos();
            cartoes.forEach(cartao => {
                this.elementos.selectCartao.appendChild(new Option(cartao.nome, cartao.id));
            });
            
            // Restaurar seleção
            if (opcaoAtual) {
                this.elementos.selectCartao.value = opcaoAtual;
            }
        }
    }

    /**
     * Atualiza filtro atual baseado nos campos
     * @private
     */
    atualizarFiltroAtual() {
        this.filtroAtual = {
            tipo: this.elementos.filtroTipo?.value || 'todos',
            categoria: this.elementos.filtroCategoria?.value || 'todas',
            status: this.elementos.filtroStatus?.value || 'todos',
            dataInicio: this.elementos.filtroDataInicio?.value || null,
            dataFim: this.elementos.filtroDataFim?.value || null,
            descricao: this.elementos.filtroDescricao?.value || ''
        };
    }

    /**
     * Limpa todos os filtros
     * @private
     */
    limparFiltros() {
        const filtros = [
            'filtroTipo', 'filtroCategoria', 'filtroStatus',
            'filtroDataInicio', 'filtroDataFim', 'filtroDescricao'
        ];

        filtros.forEach(filtro => {
            if (this.elementos[filtro]) {
                this.elementos[filtro].value = '';
            }
        });

        this.filtroAtual = {};
        this.atualizarListaTransacoes();
    }

    /**
     * Atualiza os totais na interface
     * @private
     */
    async atualizarTotais() {
        try {
            const totais = this.transacaoService.calcularTotais();
            
            if (this.elementos.totalReceitas) {
                this.elementos.totalReceitas.textContent = this.formatarMoeda(totais.receitaRealizada + totais.receitaPrevista);
            }
            
            if (this.elementos.totalDespesas) {
                this.elementos.totalDespesas.textContent = this.formatarMoeda(totais.despesaRealizada + totais.despesaPrevista);
            }
            
            if (this.elementos.saldoGeral) {
                const saldoTotal = totais.saldoTotal;
                this.elementos.saldoGeral.textContent = this.formatarMoeda(Math.abs(saldoTotal));
                this.elementos.saldoGeral.className = saldoTotal >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold';
            }
        } catch (error) {
            console.error('Erro ao atualizar totais:', error);
        }
    }

    /**
     * Abre modal para nova transação
     * @private
     */
    novaTransacao() {
        this.transacaoEditando = null;
        this.limparFormulario();
        this.abrirModal();
    }

    /**
     * Cancela edição atual
     * @private
     */
    cancelarEdicao() {
        this.transacaoEditando = null;
        this.limparFormulario();
    }

    /**
     * Abre modal de transação
     * @private
     */
    abrirModal() {
        if (this.elementos.modalTransacao) {
            this.elementos.modalTransacao.classList.remove('hidden');
        }
    }

    /**
     * Fecha modal de transação
     * @private
     */
    fecharModal() {
        if (this.elementos.modalTransacao) {
            this.elementos.modalTransacao.classList.add('hidden');
        }
    }

    /**
     * Mostra mensagem para o usuário
     * @param {string} mensagem - Mensagem a exibir
     * @param {string} tipo - Tipo da mensagem (success, error, warning, info)
     * @private
     */
    mostrarMensagem(mensagem, tipo = 'info') {
        // Implementação seria dependente do sistema de notificações escolhido
        console.log(`[${tipo.toUpperCase()}] ${mensagem}`);
        
        // Exemplo básico com alert (substituir por toast/notification mais sofisticado)
        if (tipo === 'error') {
            alert(`Erro: ${mensagem}`);
        } else if (tipo === 'success') {
            alert(`Sucesso: ${mensagem}`);
        }
    }

    /**
     * Confirma ação com o usuário
     * @param {string} titulo - Título da confirmação
     * @param {string} mensagem - Mensagem da confirmação
     * @returns {Promise<boolean>} True se confirmou
     * @private
     */
    async confirmarAcao(titulo, mensagem) {
        // Implementação básica com confirm (substituir por modal mais sofisticado)
        return confirm(`${titulo}\n\n${mensagem}`);
    }

    /**
     * Formata valor monetário
     * @param {number} valor - Valor a formatar
     * @returns {string} Valor formatado
     * @private
     */
    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    /**
     * Formata data para exibição
     * @param {string|Date} data - Data a formatar
     * @returns {string} Data formatada
     * @private
     */
    formatarData(data) {
        const dataObj = typeof data === 'string' ? new Date(data) : data;
        return dataObj.toLocaleDateString('pt-BR');
    }

    /**
     * Cria função debounced
     * @param {Function} func - Função a executar
     * @param {number} delay - Delay em ms
     * @returns {Function} Função debounced
     * @private
     */
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Exporta transações
     * @private
     */
    exportarTransacoes() {
        try {
            const transacoes = this.transacaoService.obterTodas();
            const dados = {
                transacoes: transacoes,
                exportadoEm: new Date().toISOString(),
                quantidade: transacoes.length
            };

            const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `transacoes_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.mostrarMensagem('Transações exportadas com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao exportar transações:', error);
            this.mostrarMensagem('Erro ao exportar transações.', 'error');
        }
    }

    /**
     * Importa transações
     * @private
     */
    importarTransacoes() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (event) => {
            try {
                const file = event.target.files[0];
                if (!file) return;

                const texto = await file.text();
                const dados = JSON.parse(texto);

                if (!dados.transacoes || !Array.isArray(dados.transacoes)) {
                    throw new Error('Formato de arquivo inválido');
                }

                let importadas = 0;
                for (const dadosTransacao of dados.transacoes) {
                    const resultado = await this.transacaoService.adicionarTransacao(dadosTransacao);
                    if (resultado) importadas++;
                }

                this.mostrarMensagem(`${importadas} transações importadas com sucesso!`, 'success');
                await this.atualizarListaTransacoes();
                await this.atualizarTotais();
            } catch (error) {
                console.error('Erro ao importar transações:', error);
                this.mostrarMensagem('Erro ao importar transações. Verifique o formato do arquivo.', 'error');
            }
        };

        input.click();
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.TransacaoController = TransacaoController;
}