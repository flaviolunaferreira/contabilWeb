/**
 * @fileoverview Controller para gerenciamento de cartões de crédito na interface
 * @author Sistema de Controle Financeiro
 * @version 1.0.0
 */

/**
 * Controller responsável por gerenciar a interface de cartões de crédito
 * @class CartaoController
 */
export class CartaoController {
    /**
     * Cria uma nova instância do CartaoController
     * @param {CartaoService} cartaoService - Instância do serviço de cartões
     * @param {TransacaoService} transacaoService - Instância do serviço de transações
     */
    constructor(cartaoService, transacaoService) {
        this.cartaoService = cartaoService;
        this.transacaoService = transacaoService;
        
        this.elementos = {};
        this.cartaoEditando = null;
        
        // Bind dos métodos para preservar contexto
        this.handleSubmitCartao = this.handleSubmitCartao.bind(this);
        this.handleExcluirCartao = this.handleExcluirCartao.bind(this);
        this.handleEditarCartao = this.handleEditarCartao.bind(this);
        this.handleAtivarDesativar = this.handleAtivarDesativar.bind(this);
    }

    /**
     * Inicializa o controller
     * @returns {Promise<boolean>} True se inicializou com sucesso
     */
    async init() {
        try {
            this.mapearElementos();
            this.configurarEventListeners();
            await this.atualizarListaCartoes();
            
            console.log('CartaoController inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao inicializar CartaoController:', error);
            return false;
        }
    }

    /**
     * Mapeia elementos do DOM
     * @private
     */
    mapearElementos() {
        this.elementos = {
            // Formulário de cartão
            formCartao: document.getElementById('formCartao'),
            inputIdCartao: document.getElementById('cartaoIdEdit'),
            inputNomeCartao: document.getElementById('nomeCartao'),
            inputLimiteCartao: document.getElementById('limiteCartao'),
            inputVencimentoCartao: document.getElementById('vencimentoCartao'),
            inputFechamentoCartao: document.getElementById('fechamentoCartao'),
            inputCorCartao: document.getElementById('corCartao'),
            selectIconeCartao: document.getElementById('iconeCartao'),
            checkboxAtivoCartao: document.getElementById('ativoCartao'),
            btnSubmitCartao: document.getElementById('btnSubmitCartao'),
            btnCancelarCartao: document.getElementById('btnCancelarCartao'),

            // Lista de cartões
            listaCartoes: document.getElementById('listaCartoes'),
            resumoCartoes: document.getElementById('resumoCartoes'),

            // Modais
            modalCartao: document.getElementById('modalCartao'),
            modalConfirmacao: document.getElementById('modalConfirmacao'),

            // Botões
            btnNovoCartao: document.getElementById('btn-novo-cartao'),
            btnExportarCartoes: document.getElementById('btnExportarCartoes'),
            btnImportarCartoes: document.getElementById('btnImportarCartoes'),

            // Relatórios
            relatorioLimites: document.getElementById('relatorioLimites'),
            proximasFaturas: document.getElementById('proximasFaturas')
        };
    }

    /**
     * Configura event listeners
     * @private
     */
    configurarEventListeners() {
        // Formulário de cartão
        if (this.elementos.formCartao) {
            this.elementos.formCartao.addEventListener('submit', this.handleSubmitCartao);
        }

        if (this.elementos.btnCancelarCartao) {
            this.elementos.btnCancelarCartao.addEventListener('click', () => this.cancelarEdicao());
        }

        if (this.elementos.btnNovoCartao) {
            this.elementos.btnNovoCartao.addEventListener('click', () => this.novoCartao());
        }

        // Botões de ação em massa
        if (this.elementos.btnExportarCartoes) {
            this.elementos.btnExportarCartoes.addEventListener('click', () => this.exportarCartoes());
        }

        if (this.elementos.btnImportarCartoes) {
            this.elementos.btnImportarCartoes.addEventListener('click', () => this.importarCartoes());
        }

        // Validação de dias
        if (this.elementos.inputVencimentoCartao) {
            this.elementos.inputVencimentoCartao.addEventListener('input', this.validarDia);
        }

        if (this.elementos.inputFechamentoCartao) {
            this.elementos.inputFechamentoCartao.addEventListener('input', this.validarDia);
        }
    }

    /**
     * Handle do submit do formulário de cartão
     * @param {Event} event - Evento do formulário
     * @private
     */
    async handleSubmitCartao(event) {
        event.preventDefault();
        
        try {
            const dadosCartao = this.coletarDadosFormulario();
            console.log('📝 [CartaoController] Dados coletados do formulário:', dadosCartao);
            
            const isEdicao = this.cartaoEditando !== null;

            let resultado;
            if (isEdicao) {
                resultado = await this.cartaoService.atualizarCartao(
                    this.cartaoEditando.id, 
                    dadosCartao
                );
            } else {
                resultado = await this.cartaoService.adicionarCartao(dadosCartao);
            }

            if (resultado) {
                this.mostrarMensagem(
                    `Cartão ${isEdicao ? 'atualizado' : 'adicionado'} com sucesso!`, 
                    'success'
                );
                this.limparFormulario();
                this.cancelarEdicao();
                await this.atualizarListaCartoes();
                await this.atualizarResumoCartoes();
                this.fecharModal();
            } else {
                this.mostrarMensagem('Erro ao salvar cartão. Verifique os dados informados.', 'error');
            }
        } catch (error) {
            console.error('Erro ao submeter cartão:', error);
            this.mostrarMensagem('Erro interno. Tente novamente.', 'error');
        }
    }

    /**
     * Handle para exclusão de cartão
     * @param {string|number} id - ID do cartão
     * @private
     */
    async handleExcluirCartao(id) {
        try {
            const cartao = this.cartaoService.buscarPorId(id);
            if (!cartao) {
                this.mostrarMensagem('Cartão não encontrado.', 'error');
                return;
            }

            // Verificar se há transações associadas
            const transacoes = this.transacaoService.buscarPorCartao(id);
            if (transacoes.length > 0) {
                const confirmou = await this.confirmarAcao(
                    'Confirmar Exclusão',
                    `O cartão "${cartao.nome}" possui ${transacoes.length} transação(ões) associada(s). Deseja realmente excluí-lo? As transações não serão removidas.`
                );

                if (!confirmou) return;
            } else {
                const confirmou = await this.confirmarAcao(
                    'Confirmar Exclusão',
                    `Deseja realmente excluir o cartão "${cartao.nome}"?`
                );

                if (!confirmou) return;
            }

            const sucesso = await this.cartaoService.removerCartao(id);
            if (sucesso) {
                this.mostrarMensagem('Cartão excluído com sucesso!', 'success');
                await this.atualizarListaCartoes();
                await this.atualizarResumoCartoes();
            } else {
                this.mostrarMensagem('Erro ao excluir cartão.', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir cartão:', error);
            this.mostrarMensagem('Erro interno. Tente novamente.', 'error');
        }
    }

    /**
     * Handle para edição de cartão
     * @param {string|number} id - ID do cartão
     * @private
     */
    async handleEditarCartao(id) {
        try {
            const cartao = this.cartaoService.buscarPorId(id);
            if (!cartao) {
                this.mostrarMensagem('Cartão não encontrado.', 'error');
                return;
            }

            this.cartaoEditando = cartao;
            this.preencherFormulario(cartao);
            this.abrirModal();
            
            console.log('Editando cartão:', id);
        } catch (error) {
            console.error('Erro ao editar cartão:', error);
            this.mostrarMensagem('Erro ao carregar dados do cartão.', 'error');
        }
    }

    /**
     * Handle para ativar/desativar cartão
     * @param {string|number} id - ID do cartão
     * @private
     */
    async handleAtivarDesativar(id) {
        try {
            const cartao = this.cartaoService.buscarPorId(id);
            if (!cartao) {
                this.mostrarMensagem('Cartão não encontrado.', 'error');
                return;
            }

            const novoStatus = !cartao.ativo;
            const sucesso = novoStatus 
                ? await this.cartaoService.ativarCartao(id)
                : await this.cartaoService.desativarCartao(id);

            if (sucesso) {
                this.mostrarMensagem(
                    `Cartão ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`, 
                    'success'
                );
                await this.atualizarListaCartoes();
                await this.atualizarResumoCartoes();
            } else {
                this.mostrarMensagem('Erro ao alterar status do cartão.', 'error');
            }
        } catch (error) {
            console.error('Erro ao ativar/desativar cartão:', error);
            this.mostrarMensagem('Erro interno. Tente novamente.', 'error');
        }
    }

    /**
     * Coleta dados do formulário
     * @returns {Object} Dados do cartão
     * @private
     */
    coletarDadosFormulario() {
        const rawLimit = parseFloat(this.elementos.inputLimiteCartao.value) || 0;
        
        // Mapeia para o formato esperado pelo CardModel (Inglês)
        // CardModel espera: name, limit (centavos), closingDay, dueDay
        return {
            name: this.elementos.inputNomeCartao.value.trim(),
            limit: Math.round(rawLimit * 100), // Converte para centavos
            dueDay: parseInt(this.elementos.inputVencimentoCartao.value) || 1,
            closingDay: parseInt(this.elementos.inputFechamentoCartao.value) || 1,
            
            // Campos extras que talvez o Model não valide agora, mas precisamos persistir
            color: this.elementos.inputCorCartao.value || '#0066CC',
            icon: this.elementos.selectIconeCartao.value || '💳',
            active: this.elementos.checkboxAtivoCartao.checked
        };
    }

    /**
     * Preenche formulário com dados do cartão
     * @param {Cartao} cartao - Cartão para editar
     * @private
     */
    preencherFormulario(cartao) {
        // Suporta tanto formato antigo (PT) quanto novo (EN/Model)
        this.elementos.inputIdCartao.value = cartao.id;
        this.elementos.inputNomeCartao.value = cartao.name || cartao.nome;
        
        // Limite vem em centavos do Model, converter para reais na view
        const limitCentavos = cartao.limit !== undefined ? cartao.limit : (cartao.limite || 0);
        this.elementos.inputLimiteCartao.value = (limitCentavos / 100).toFixed(2);
        
        this.elementos.inputVencimentoCartao.value = cartao.dueDay || cartao.vencimento;
        this.elementos.inputFechamentoCartao.value = cartao.closingDay || cartao.fechamento;
        this.elementos.inputCorCartao.value = cartao.color || cartao.cor || '#0066CC';
        this.elementos.selectIconeCartao.value = cartao.icon || cartao.icone || '💳';
        this.elementos.checkboxAtivoCartao.checked = cartao.active !== undefined ? cartao.active : cartao.ativo;

        this.elementos.btnSubmitCartao.textContent = 'Atualizar Cartão';
    }

    /**
     * Limpa o formulário
     * @private
     */
    limparFormulario() {
        this.elementos.formCartao.reset();
        this.elementos.inputIdCartao.value = '';
        this.elementos.inputCorCartao.value = '#0066CC';
        this.elementos.selectIconeCartao.value = '💳';
        this.elementos.checkboxAtivoCartao.checked = true;
        this.elementos.btnSubmitCartao.textContent = 'Adicionar Cartão';
    }

    /**
     * Valida dia (1-31)
     * @param {Event} event - Evento do input
     * @private
     */
    validarDia(event) {
        const valor = parseInt(event.target.value);
        if (valor < 1 || valor > 31) {
            event.target.setCustomValidity('Dia deve estar entre 1 e 31');
        } else {
            event.target.setCustomValidity('');
        }
    }

    /**
     * Atualiza a lista de cartões na interface
     * @private
     */
    async atualizarListaCartoes() {
        try {
            if (!this.elementos.listaCartoes) return;

            const cartoes = this.cartaoService.obterTodos();
            const transacoes = this.transacaoService.obterTodas();
            const html = this.renderizarListaCartoes(cartoes, transacoes);
            this.elementos.listaCartoes.innerHTML = html;
            
            await this.atualizarResumoCartoes();
            await this.atualizarRelatorioLimites();
            await this.atualizarProximasFaturas();
        } catch (error) {
            console.error('Erro ao atualizar lista de cartões:', error);
        }
    }

    /**
     * Renderiza a lista de cartões
     * @param {Cartao[]} cartoes - Array de cartões
     * @param {Transacao[]} transacoes - Array de transações
     * @returns {string} HTML da lista
     * @private
     */
    renderizarListaCartoes(cartoes, transacoes) {
        if (cartoes.length === 0) {
            return '<div class="text-center text-gray-500 py-8">Nenhum cartão cadastrado</div>';
        }

        return cartoes.map(cartao => {
            const utilizado = this.cartaoService.calcularUtilizado(cartao.id, transacoes);
            const disponivel = this.cartaoService.calcularLimiteDisponivel(cartao.id, transacoes);
            
            // Compatibilidade com API (English) e Local (Portuguese)
            const limite = cartao.limit !== undefined ? cartao.limit / 100 : (cartao.limite || 0) / 100;
            const nome = cartao.name || cartao.nome || 'Sem Nome';
            const cor = cartao.color || cartao.cor || '#0066CC';
            const icone = cartao.icon || cartao.icone || '💳';
            const ativo = cartao.active !== undefined ? (cartao.active === 1 || cartao.active === true) : cartao.ativo;
            const vencimento = cartao.dueDay || cartao.vencimento;
            const fechamento = cartao.closingDay || cartao.fechamento;

            const percentualUso = limite > 0 ? (utilizado / 100 / limite) * 100 : 0; // Utilizado vem em centavos tbm?
            // calcularUtilizado retorna centavos? calcularLimiteDisponivel sim (ver CartaoService)

            const corBarra = percentualUso >= 80 ? 'bg-red-500' : percentualUso >= 60 ? 'bg-yellow-500' : 'bg-green-500';
            const statusColor = ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
            
            return `
                <div class="bg-white rounded-lg shadow p-4 mb-4 border-l-4" style="border-left-color: ${cor}">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center">
                            <span class="text-2xl mr-2">${icone}</span>
                            <div>
                                <h3 class="font-semibold text-gray-900">${nome}</h3>
                                <span class="inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColor}">
                                    ${ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm text-gray-600">Limite</div>
                            <div class="text-lg font-bold text-blue-600">${this.formatarMoeda(limite * 100)}</div>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <div class="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Utilizado: ${this.formatarMoeda(utilizado)}</span>
                            <span>Disponível: ${this.formatarMoeda(disponivel)}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="${corBarra} h-2 rounded-full transition-all duration-300" 
                                 style="width: ${Math.min(percentualUso, 100)}%"></div>
                        </div>
                        <div class="text-center text-xs text-gray-500 mt-1">
                            ${percentualUso.toFixed(1)}% utilizado
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                            <span class="font-medium">Vencimento:</span> dia ${vencimento}
                        </div>
                        <div>
                            <span class="font-medium">Fechamento:</span> dia ${fechamento}
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-2">
                        <button onclick="cartaoController.handleAtivarDesativar('${cartao.id}')" 
                                class="px-3 py-1 ${ativo ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded text-sm">
                            ${ativo ? '⏸️ Desativar' : '▶️ Ativar'}
                        </button>
                        <button onclick="cartaoController.handleEditarCartao('${cartao.id}')" 
                                class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                            ✏️ Editar
                        </button>
                        <button onclick="cartaoController.handleExcluirCartao('${cartao.id}')" 
                                class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Atualiza resumo dos cartões
     * @private
     */
    async atualizarResumoCartoes() {
        if (!this.elementos.resumoCartoes) return;

        try {
            const transacoes = this.transacaoService.obterTodas();
            const estatisticas = this.cartaoService.obterEstatisticas(transacoes);
            
            const html = `
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <div class="text-blue-600 font-medium">Total de Cartões</div>
                        <div class="text-2xl font-bold text-blue-700">${estatisticas.quantidade.total}</div>
                        <div class="text-sm text-blue-500">${estatisticas.quantidade.ativos} ativos</div>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg">
                        <div class="text-green-600 font-medium">Limite Total</div>
                        <div class="text-2xl font-bold text-green-700">${this.formatarMoeda(estatisticas.limites.total)}</div>
                    </div>
                    <div class="bg-yellow-50 p-4 rounded-lg">
                        <div class="text-yellow-600 font-medium">Utilizado</div>
                        <div class="text-2xl font-bold text-yellow-700">${this.formatarMoeda(estatisticas.limites.utilizado)}</div>
                        <div class="text-sm text-yellow-500">${estatisticas.limites.percentualUso.toFixed(1)}%</div>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-lg">
                        <div class="text-purple-600 font-medium">Disponível</div>
                        <div class="text-2xl font-bold text-purple-700">${this.formatarMoeda(estatisticas.limites.disponivel)}</div>
                    </div>
                </div>
            `;
            
            this.elementos.resumoCartoes.innerHTML = html;
        } catch (error) {
            console.error('Erro ao atualizar resumo dos cartões:', error);
        }
    }

    /**
     * Atualiza relatório de limites
     * @private
     */
    async atualizarRelatorioLimites() {
        if (!this.elementos.relatorioLimites) return;

        try {
            const transacoes = this.transacaoService.obterTodas();
            const cartoesAlerta = this.cartaoService.verificarProximosAoLimite(transacoes, 70);
            
            if (cartoesAlerta.length === 0) {
                this.elementos.relatorioLimites.innerHTML = `
                    <div class="text-center text-green-600 py-4">
                        ✅ Todos os cartões estão com uso saudável
                    </div>
                `;
                return;
            }

            const html = `
                <div class="space-y-3">
                    <h4 class="font-semibold text-red-600 mb-3">⚠️ Cartões com Alto Uso</h4>
                    ${cartoesAlerta.map(cartao => `
                        <div class="bg-red-50 border border-red-200 rounded p-3">
                            <div class="flex justify-between items-center">
                                <span class="font-medium">${cartao.nome}</span>
                                <span class="text-red-600 font-bold">${cartao.percentualUso.toFixed(1)}%</span>
                            </div>
                            <div class="text-sm text-red-600 mt-1">
                                Utilizado: ${this.formatarMoeda(cartao.utilizado)} de ${this.formatarMoeda(cartao.limite)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            this.elementos.relatorioLimites.innerHTML = html;
        } catch (error) {
            console.error('Erro ao atualizar relatório de limites:', error);
        }
    }

    /**
     * Atualiza próximas faturas
     * @private
     */
    async atualizarProximasFaturas() {
        if (!this.elementos.proximasFaturas) return;

        try {
            const transacoes = this.transacaoService.obterTodas();
            const faturas = this.cartaoService.obterProximasFaturas(transacoes, 2);
            
            const html = `
                <div class="space-y-4">
                    ${Object.values(faturas).map(cartaoFatura => {
                        if (cartaoFatura.faturas.length === 0) return '';
                        
                        return `
                            <div class="border rounded-lg p-4">
                                <h4 class="font-semibold text-gray-800 mb-3">${cartaoFatura.cartao.nome}</h4>
                                <div class="space-y-2">
                                    ${cartaoFatura.faturas.map(fatura => `
                                        <div class="flex justify-between items-center text-sm">
                                            <span>${fatura.mesReferencia}</span>
                                            <span class="font-medium text-blue-600">
                                                ${this.formatarMoeda(fatura.valor)}
                                            </span>
                                            <span class="text-gray-500">
                                                Vence: ${this.formatarData(fatura.vencimento)}
                                            </span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            
            this.elementos.proximasFaturas.innerHTML = html;
        } catch (error) {
            console.error('Erro ao atualizar próximas faturas:', error);
        }
    }

    /**
     * Abre modal para novo cartão
     * @private
     */
    novoCartao() {
        this.cartaoEditando = null;
        this.limparFormulario();
        this.abrirModal();
    }

    /**
     * Cancela edição atual
     * @private
     */
    cancelarEdicao() {
        this.cartaoEditando = null;
        this.limparFormulario();
    }

    /**
     * Abre modal de cartão
     * @private
     */
    abrirModal() {
        if (this.elementos.modalCartao) {
            this.elementos.modalCartao.classList.remove('hidden');
        }
    }

    /**
     * Fecha modal de cartão
     * @private
     */
    fecharModal() {
        if (this.elementos.modalCartao) {
            this.elementos.modalCartao.classList.add('hidden');
        }
    }

    /**
     * Mostra mensagem para o usuário
     * @param {string} mensagem - Mensagem a exibir
     * @param {string} tipo - Tipo da mensagem (success, error, warning, info)
     * @private
     */
    mostrarMensagem(mensagem, tipo = 'info') {
        console.log(`[${tipo.toUpperCase()}] ${mensagem}`);
        
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
     * Exporta cartões
     * @private
     */
    exportarCartoes() {
        try {
            const dados = this.cartaoService.exportarDados();
            dados.exportadoEm = new Date().toISOString();

            const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `cartoes_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.mostrarMensagem('Cartões exportados com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao exportar cartões:', error);
            this.mostrarMensagem('Erro ao exportar cartões.', 'error');
        }
    }

    /**
     * Importa cartões
     * @private
     */
    importarCartoes() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (event) => {
            try {
                const file = event.target.files[0];
                if (!file) return;

                const texto = await file.text();
                const dados = JSON.parse(texto);

                const sucesso = await this.cartaoService.importarDados(dados);
                
                if (sucesso) {
                    this.mostrarMensagem('Cartões importados com sucesso!', 'success');
                    await this.atualizarListaCartoes();
                } else {
                    this.mostrarMensagem('Erro ao importar cartões. Verifique o formato do arquivo.', 'error');
                }
            } catch (error) {
                console.error('Erro ao importar cartões:', error);
                this.mostrarMensagem('Erro ao importar cartões. Verifique o formato do arquivo.', 'error');
            }
        };

        input.click();
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.CartaoController = CartaoController;
}