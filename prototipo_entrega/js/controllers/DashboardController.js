/**
 * @fileoverview Controller para o dashboard principal do sistema
 * @author Sistema de Controle Financeiro
 * @version 1.0.0
 */

/**
 * Controller responsável por gerenciar o dashboard principal
 * @class DashboardController
 */
class DashboardController {
    /**
     * Cria uma nova instância do DashboardController
     * @param {TransacaoService} transacaoService - Instância do serviço de transações
     * @param {CartaoService} cartaoService - Instância do serviço de cartões
     * @param {CategoriaService} categoriaService - Instância do serviço de categorias
     */
    constructor(transacaoService, cartaoService, categoriaService) {
        this.transacaoService = transacaoService;
        this.cartaoService = cartaoService;
        this.categoriaService = categoriaService;
        
        this.elementos = {};
        this.charts = {};
        this.intervalosAtualizacao = {};
        
        // Configurações dos gráficos
        this.configGraficos = {
            cores: {
                receita: '#22C55E',
                despesa: '#EF4444',
                saldo: '#3B82F6',
                previsto: '#94A3B8',
                realizado: '#1E293B'
            },
            opcoesPadrao: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        };
    }

    /**
     * Inicializa o controller
     * @returns {Promise<boolean>} True se inicializou com sucesso
     */
    async init() {
        try {
            this.mapearElementos();
            this.configurarEventListeners();
            await this.atualizarDashboard();
            this.iniciarAtualizacaoAutomatica();
            
            console.log('DashboardController inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao inicializar DashboardController:', error);
            return false;
        }
    }

    /**
     * Mapeia elementos do DOM
     * @private
     */
    mapearElementos() {
        this.elementos = {
            // Cards de resumo
            cardReceitaTotal: document.getElementById('cardReceitaTotal'),
            cardDespesaTotal: document.getElementById('cardDespesaTotal'),
            cardSaldoAtual: document.getElementById('cardSaldoAtual'),
            cardCartoesSumario: document.getElementById('cardCartoesSumario'),

            // Gráficos
            canvasFluxoMensal: document.getElementById('graficoFluxoMensal'),
            canvasCategorias: document.getElementById('graficoCategorias'),
            canvasCartoes: document.getElementById('graficoCartoes'),
            canvasEvolution: document.getElementById('graficoEvolucao'),

            // Listas de resumo
            listaUltimasTransacoes: document.getElementById('ultimasTransacoes'),
            listaProximosVencimentos: document.getElementById('proximosVencimentos'),
            listaAlertasLimites: document.getElementById('alertasLimites'),

            // Filtros do dashboard
            filtroPeriodoDashboard: document.getElementById('filtroPeriodoDashboard'),
            filtroAnoMes: document.getElementById('filtroAnoMes'),
            btnAtualizarDashboard: document.getElementById('btnAtualizarDashboard'),

            // Seções
            secaoResumoFinanceiro: document.getElementById('secaoResumoFinanceiro'),
            secaoGraficos: document.getElementById('secaoGraficos'),
            secaoAlertas: document.getElementById('secaoAlertas')
        };
    }

    /**
     * Configura event listeners
     * @private
     */
    configurarEventListeners() {
        // Filtros do dashboard
        if (this.elementos.filtroPeriodoDashboard) {
            this.elementos.filtroPeriodoDashboard.addEventListener('change', () => this.atualizarDashboard());
        }

        if (this.elementos.filtroAnoMes) {
            this.elementos.filtroAnoMes.addEventListener('change', () => this.atualizarDashboard());
        }

        if (this.elementos.btnAtualizarDashboard) {
            this.elementos.btnAtualizarDashboard.addEventListener('click', () => this.atualizarDashboard());
        }

        // Redimensionamento da janela
        window.addEventListener('resize', this.debounce(() => this.redimensionarGraficos(), 300));
    }

    /**
     * Atualiza todo o dashboard
     * @private
     */
    async atualizarDashboard() {
        try {
            console.log('Atualizando dashboard...');
            
            // Mostrar loading
            this.mostrarLoading(true);

            // Obter dados filtrados
            const periodo = this.obterPeriodoSelecionado();
            const transacoesFiltradas = this.filtrarTransacoesPorPeriodo(periodo);

            // Atualizar seções em paralelo
            await Promise.all([
                this.atualizarCardsResumo(transacoesFiltradas),
                this.atualizarGraficos(transacoesFiltradas),
                this.atualizarListasResumo(transacoesFiltradas),
                this.atualizarAlertas()
            ]);

            // Ocultar loading
            this.mostrarLoading(false);
            
            console.log('Dashboard atualizado com sucesso');
        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
            this.mostrarLoading(false);
        }
    }

    /**
     * Atualiza cards de resumo financeiro
     * @param {Transacao[]} transacoes - Transações filtradas
     * @private
     */
    async atualizarCardsResumo(transacoes) {
        const totais = this.calcularTotaisCustom(transacoes);
        const estatisticasCartoes = this.cartaoService.obterEstatisticas(this.transacaoService.obterTodas());

        // Card Receita Total
        if (this.elementos.cardReceitaTotal) {
            this.elementos.cardReceitaTotal.innerHTML = `
                <div class="bg-green-50 p-6 rounded-lg border border-green-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-green-600 text-sm font-medium">Receitas</p>
                            <p class="text-2xl font-bold text-green-700">${this.formatarMoeda(totais.receitas)}</p>
                            <div class="text-sm text-green-600 mt-1">
                                <span class="font-medium">Realizado:</span> ${this.formatarMoeda(totais.receitaRealizada)}
                                <span class="ml-2 font-medium">Previsto:</span> ${this.formatarMoeda(totais.receitaPrevista)}
                            </div>
                        </div>
                        <div class="text-3xl text-green-500">💰</div>
                    </div>
                </div>
            `;
        }

        // Card Despesa Total
        if (this.elementos.cardDespesaTotal) {
            this.elementos.cardDespesaTotal.innerHTML = `
                <div class="bg-red-50 p-6 rounded-lg border border-red-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-red-600 text-sm font-medium">Despesas</p>
                            <p class="text-2xl font-bold text-red-700">${this.formatarMoeda(totais.despesas)}</p>
                            <div class="text-sm text-red-600 mt-1">
                                <span class="font-medium">Realizado:</span> ${this.formatarMoeda(totais.despesaRealizada)}
                                <span class="ml-2 font-medium">Previsto:</span> ${this.formatarMoeda(totais.despesaPrevista)}
                            </div>
                        </div>
                        <div class="text-3xl text-red-500">💸</div>
                    </div>
                </div>
            `;
        }

        // Card Saldo Atual
        if (this.elementos.cardSaldoAtual) {
            const saldo = totais.receitas - totais.despesas;
            const corSaldo = saldo >= 0 ? 'blue' : 'red';
            const icone = saldo >= 0 ? '📈' : '📉';
            
            this.elementos.cardSaldoAtual.innerHTML = `
                <div class="bg-${corSaldo}-50 p-6 rounded-lg border border-${corSaldo}-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-${corSaldo}-600 text-sm font-medium">Saldo</p>
                            <p class="text-2xl font-bold text-${corSaldo}-700">${this.formatarMoeda(Math.abs(saldo))}</p>
                            <div class="text-sm text-${corSaldo}-600 mt-1">
                                ${saldo >= 0 ? 'Positivo' : 'Negativo'}
                            </div>
                        </div>
                        <div class="text-3xl text-${corSaldo}-500">${icone}</div>
                    </div>
                </div>
            `;
        }

        // Card Resumo Cartões
        if (this.elementos.cardCartoesSumario) {
            this.elementos.cardCartoesSumario.innerHTML = `
                <div class="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-purple-600 text-sm font-medium">Cartões</p>
                            <p class="text-2xl font-bold text-purple-700">${this.formatarMoeda(estatisticasCartoes.limites.utilizado)}</p>
                            <div class="text-sm text-purple-600 mt-1">
                                <span class="font-medium">Limite:</span> ${this.formatarMoeda(estatisticasCartoes.limites.total)}
                                <span class="ml-2">({estatisticasCartoes.limites.percentualUso.toFixed(1)}%)</span>
                            </div>
                        </div>
                        <div class="text-3xl text-purple-500">💳</div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Atualiza todos os gráficos
     * @param {Transacao[]} transacoes - Transações filtradas
     * @private
     */
    async atualizarGraficos(transacoes) {
        await Promise.all([
            this.atualizarGraficoFluxoMensal(transacoes),
            this.atualizarGraficoCategorias(transacoes),
            this.atualizarGraficoCartoes(),
            this.atualizarGraficoEvolucao(transacoes)
        ]);
    }

    /**
     * Atualiza gráfico de fluxo mensal
     * @param {Transacao[]} transacoes - Transações filtradas
     * @private
     */
    async atualizarGraficoFluxoMensal(transacoes) {
        if (!this.elementos.canvasFluxoMensal) return;

        const dadosMensais = this.transacaoService.agruparPorMes(transacoes);
        const meses = Object.keys(dadosMensais).sort();
        
        const dadosReceitas = meses.map(mes => dadosMensais[mes].receitas);
        const dadosDespesas = meses.map(mes => dadosMensais[mes].despesas);
        const dadosSaldo = meses.map(mes => dadosMensais[mes].saldo);

        const config = {
            type: 'bar',
            data: {
                labels: meses.map(mes => this.formatarMesAno(mes)),
                datasets: [
                    {
                        label: 'Receitas',
                        data: dadosReceitas,
                        backgroundColor: this.configGraficos.cores.receita,
                        borderColor: this.configGraficos.cores.receita,
                        borderWidth: 1
                    },
                    {
                        label: 'Despesas',
                        data: dadosDespesas,
                        backgroundColor: this.configGraficos.cores.despesa,
                        borderColor: this.configGraficos.cores.despesa,
                        borderWidth: 1
                    },
                    {
                        label: 'Saldo',
                        data: dadosSaldo,
                        type: 'line',
                        backgroundColor: 'transparent',
                        borderColor: this.configGraficos.cores.saldo,
                        borderWidth: 2,
                        tension: 0.1
                    }
                ]
            },
            options: {
                ...this.configGraficos.opcoesPadrao,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => this.formatarMoeda(value)
                        }
                    }
                },
                plugins: {
                    ...this.configGraficos.opcoesPadrao.plugins,
                    title: {
                        display: true,
                        text: 'Fluxo de Caixa Mensal'
                    }
                }
            }
        };

        this.criarOuAtualizarGrafico('fluxoMensal', config);
    }

    /**
     * Atualiza gráfico de categorias
     * @param {Transacao[]} transacoes - Transações filtradas
     * @private
     */
    async atualizarGraficoCategorias(transacoes) {
        if (!this.elementos.canvasCategorias) return;

        const dadosCategorias = this.transacaoService.agruparPorCategoria(transacoes);
        const categorias = Object.keys(dadosCategorias);
        const valores = categorias.map(cat => dadosCategorias[cat].total);
        
        // Gerar cores para cada categoria
        const cores = this.gerarCoresCategoria(categorias.length);

        const config = {
            type: 'doughnut',
            data: {
                labels: categorias,
                datasets: [{
                    data: valores,
                    backgroundColor: cores,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                ...this.configGraficos.opcoesPadrao,
                plugins: {
                    ...this.configGraficos.opcoesPadrao.plugins,
                    title: {
                        display: true,
                        text: 'Gastos por Categoria'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = this.formatarMoeda(context.parsed);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };

        this.criarOuAtualizarGrafico('categorias', config);
    }

    /**
     * Atualiza gráfico de cartões
     * @private
     */
    async atualizarGraficoCartoes() {
        if (!this.elementos.canvasCartoes) return;

        const transacoes = this.transacaoService.obterTodas();
        const resumoCartoes = this.cartaoService.obterResumoUso(transacoes);
        const cartoesAtivos = Object.values(resumoCartoes).filter(c => c.ativo);
        
        if (cartoesAtivos.length === 0) {
            this.elementos.canvasCartoes.innerHTML = '<div class="text-center text-gray-500 py-8">Nenhum cartão ativo</div>';
            return;
        }

        const nomes = cartoesAtivos.map(c => c.nome);
        const utilizados = cartoesAtivos.map(c => c.utilizado);
        const limites = cartoesAtivos.map(c => c.limite);

        const config = {
            type: 'bar',
            data: {
                labels: nomes,
                datasets: [
                    {
                        label: 'Utilizado',
                        data: utilizados,
                        backgroundColor: this.configGraficos.cores.despesa,
                        borderColor: this.configGraficos.cores.despesa,
                        borderWidth: 1
                    },
                    {
                        label: 'Limite',
                        data: limites,
                        backgroundColor: this.configGraficos.cores.previsto,
                        borderColor: this.configGraficos.cores.previsto,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                ...this.configGraficos.opcoesPadrao,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => this.formatarMoeda(value)
                        }
                    }
                },
                plugins: {
                    ...this.configGraficos.opcoesPadrao.plugins,
                    title: {
                        display: true,
                        text: 'Utilização de Cartões'
                    }
                }
            }
        };

        this.criarOuAtualizarGrafico('cartoes', config);
    }

    /**
     * Atualiza gráfico de evolução
     * @param {Transacao[]} transacoes - Transações filtradas
     * @private
     */
    async atualizarGraficoEvolucao(transacoes) {
        if (!this.elementos.canvasEvolution) return;

        // Agrupar por mês e calcular saldo acumulado
        const dadosMensais = this.transacaoService.agruparPorMes(transacoes);
        const meses = Object.keys(dadosMensais).sort();
        
        let saldoAcumulado = 0;
        const evolucaoSaldo = meses.map(mes => {
            saldoAcumulado += dadosMensais[mes].saldo;
            return saldoAcumulado;
        });

        const config = {
            type: 'line',
            data: {
                labels: meses.map(mes => this.formatarMesAno(mes)),
                datasets: [{
                    label: 'Saldo Acumulado',
                    data: evolucaoSaldo,
                    borderColor: this.configGraficos.cores.saldo,
                    backgroundColor: this.configGraficos.cores.saldo + '20',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                ...this.configGraficos.opcoesPadrao,
                scales: {
                    y: {
                        ticks: {
                            callback: value => this.formatarMoeda(value)
                        }
                    }
                },
                plugins: {
                    ...this.configGraficos.opcoesPadrao.plugins,
                    title: {
                        display: true,
                        text: 'Evolução do Saldo'
                    }
                }
            }
        };

        this.criarOuAtualizarGrafico('evolucao', config);
    }

    /**
     * Atualiza listas de resumo
     * @param {Transacao[]} transacoes - Transações filtradas
     * @private
     */
    async atualizarListasResumo(transacoes) {
        await Promise.all([
            this.atualizarUltimasTransacoes(transacoes),
            this.atualizarProximosVencimentos()
        ]);
    }

    /**
     * Atualiza lista de últimas transações
     * @param {Transacao[]} transacoes - Transações filtradas
     * @private
     */
    async atualizarUltimasTransacoes(transacoes) {
        if (!this.elementos.listaUltimasTransacoes) return;

        const ultimasTransacoes = transacoes
            .sort((a, b) => new Date(b.getDataEfetiva()) - new Date(a.getDataEfetiva()))
            .slice(0, 5);

        if (ultimasTransacoes.length === 0) {
            this.elementos.listaUltimasTransacoes.innerHTML = `
                <div class="text-center text-gray-500 py-4">Nenhuma transação no período</div>
            `;
            return;
        }

        const html = ultimasTransacoes.map(transacao => {
            const valor = Math.abs(transacao.getValorEfetivo());
            const corTipo = transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600';
            const sinal = transacao.tipo === 'receita' ? '+' : '-';
            
            return `
                <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                        <div class="font-medium text-gray-900">${transacao.descricao}</div>
                        <div class="text-sm text-gray-500">
                            ${this.formatarData(transacao.getDataEfetiva())} • ${transacao.categoria || 'Sem categoria'}
                        </div>
                    </div>
                    <div class="font-bold ${corTipo}">
                        ${sinal} ${this.formatarMoeda(valor)}
                    </div>
                </div>
            `;
        }).join('');

        this.elementos.listaUltimasTransacoes.innerHTML = html;
    }

    /**
     * Atualiza próximos vencimentos
     * @private
     */
    async atualizarProximosVencimentos() {
        if (!this.elementos.listaProximosVencimentos) return;

        const transacoes = this.transacaoService.obterTodas();
        const faturas = this.cartaoService.obterProximasFaturas(transacoes, 1);
        
        const proximosMes = [];
        Object.values(faturas).forEach(cartaoFatura => {
            cartaoFatura.faturas.forEach(fatura => {
                if (fatura.valor > 0) {
                    proximosMes.push({
                        cartao: cartaoFatura.cartao.nome,
                        valor: fatura.valor,
                        vencimento: fatura.vencimento
                    });
                }
            });
        });

        if (proximosMes.length === 0) {
            this.elementos.listaProximosVencimentos.innerHTML = `
                <div class="text-center text-gray-500 py-4">Nenhum vencimento próximo</div>
            `;
            return;
        }

        const html = proximosMes
            .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento))
            .map(item => `
                <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                        <div class="font-medium text-gray-900">${item.cartao}</div>
                        <div class="text-sm text-gray-500">
                            Vencimento: ${this.formatarData(item.vencimento)}
                        </div>
                    </div>
                    <div class="font-bold text-blue-600">
                        ${this.formatarMoeda(item.valor)}
                    </div>
                </div>
            `).join('');

        this.elementos.listaProximosVencimentos.innerHTML = html;
    }

    /**
     * Atualiza alertas do sistema
     * @private
     */
    async atualizarAlertas() {
        if (!this.elementos.listaAlertasLimites) return;

        const transacoes = this.transacaoService.obterTodas();
        const cartoesAlerta = this.cartaoService.verificarProximosAoLimite(transacoes, 80);
        
        if (cartoesAlerta.length === 0) {
            this.elementos.listaAlertasLimites.innerHTML = `
                <div class="text-center text-green-600 py-4">
                    ✅ Todos os cartões estão dentro do limite seguro
                </div>
            `;
            return;
        }

        const html = cartoesAlerta.map(cartao => `
            <div class="bg-yellow-50 border border-yellow-200 rounded p-3 mb-2">
                <div class="flex items-center">
                    <div class="text-yellow-600 mr-2">⚠️</div>
                    <div class="flex-1">
                        <div class="font-medium text-yellow-800">${cartao.nome}</div>
                        <div class="text-sm text-yellow-600">
                            ${cartao.percentualUso.toFixed(1)}% do limite utilizado
                        </div>
                    </div>
                    <div class="text-yellow-800 font-bold">
                        ${this.formatarMoeda(cartao.utilizado)}
                    </div>
                </div>
            </div>
        `).join('');

        this.elementos.listaAlertasLimites.innerHTML = html;
    }

    /**
     * Cria ou atualiza um gráfico
     * @param {string} nome - Nome do gráfico
     * @param {Object} config - Configuração do Chart.js
     * @private
     */
    criarOuAtualizarGrafico(nome, config) {
        const canvas = this.elementos[`canvas${nome.charAt(0).toUpperCase() + nome.slice(1)}`];
        if (!canvas) return;

        // Destruir gráfico existente se houver
        if (this.charts[nome]) {
            this.charts[nome].destroy();
        }

        // Criar novo gráfico
        this.charts[nome] = new Chart(canvas, config);
    }

    /**
     * Redimensiona todos os gráficos
     * @private
     */
    redimensionarGraficos() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }

    /**
     * Obtém período selecionado
     * @returns {Object} Período com dataInicio e dataFim
     * @private
     */
    obterPeriodoSelecionado() {
        const filtro = this.elementos.filtroPeriodoDashboard?.value || 'mes-atual';
        const hoje = new Date();
        
        switch (filtro) {
            case 'mes-atual':
                return {
                    dataInicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
                    dataFim: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
                };
            case 'mes-anterior':
                return {
                    dataInicio: new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1),
                    dataFim: new Date(hoje.getFullYear(), hoje.getMonth(), 0)
                };
            case 'trimestre':
                const inicioTrimestre = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3, 1);
                const fimTrimestre = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3 + 3, 0);
                return {
                    dataInicio: inicioTrimestre,
                    dataFim: fimTrimestre
                };
            case 'ano':
                return {
                    dataInicio: new Date(hoje.getFullYear(), 0, 1),
                    dataFim: new Date(hoje.getFullYear(), 11, 31)
                };
            case 'personalizado':
                const anoMes = this.elementos.filtroAnoMes?.value;
                if (anoMes) {
                    const [ano, mes] = anoMes.split('-').map(Number);
                    return {
                        dataInicio: new Date(ano, mes - 1, 1),
                        dataFim: new Date(ano, mes, 0)
                    };
                }
                return { dataInicio: null, dataFim: null };
            default:
                return { dataInicio: null, dataFim: null };
        }
    }

    /**
     * Filtra transações por período
     * @param {Object} periodo - Período com dataInicio e dataFim
     * @returns {Transacao[]} Transações filtradas
     * @private
     */
    filtrarTransacoesPorPeriodo(periodo) {
        if (!periodo.dataInicio || !periodo.dataFim) {
            return this.transacaoService.obterTodas();
        }

        return this.transacaoService.buscarPorPeriodo(periodo.dataInicio, periodo.dataFim);
    }

    /**
     * Calcula totais customizados
     * @param {Transacao[]} transacoes - Transações para calcular
     * @returns {Object} Totais calculados
     * @private
     */
    calcularTotaisCustom(transacoes) {
        const totais = {
            receitas: 0,
            despesas: 0,
            receitaRealizada: 0,
            receitaPrevista: 0,
            despesaRealizada: 0,
            despesaPrevista: 0
        };

        transacoes.forEach(transacao => {
            const valor = Math.abs(transacao.getValorEfetivo());
            
            if (transacao.tipo === 'receita') {
                totais.receitas += valor;
                if (transacao.status === 'realizado') {
                    totais.receitaRealizada += valor;
                } else {
                    totais.receitaPrevista += valor;
                }
            } else {
                totais.despesas += valor;
                if (transacao.status === 'realizado') {
                    totais.despesaRealizada += valor;
                } else {
                    totais.despesaPrevista += valor;
                }
            }
        });

        return totais;
    }

    /**
     * Gera cores para categorias
     * @param {number} quantidade - Número de cores necessárias
     * @returns {string[]} Array de cores
     * @private
     */
    gerarCoresCategoria(quantidade) {
        const coresPadrao = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];

        if (quantidade <= coresPadrao.length) {
            return coresPadrao.slice(0, quantidade);
        }

        // Gerar cores adicionais se necessário
        const cores = [...coresPadrao];
        while (cores.length < quantidade) {
            const hue = Math.floor(Math.random() * 360);
            cores.push(`hsl(${hue}, 70%, 60%)`);
        }

        return cores;
    }

    /**
     * Inicia atualização automática do dashboard
     * @private
     */
    iniciarAtualizacaoAutomatica() {
        // Atualizar a cada 5 minutos
        this.intervalosAtualizacao.dashboard = setInterval(() => {
            this.atualizarDashboard();
        }, 5 * 60 * 1000);

        // Atualizar alertas a cada minuto
        this.intervalosAtualizacao.alertas = setInterval(() => {
            this.atualizarAlertas();
        }, 60 * 1000);
    }

    /**
     * Para atualização automática
     * @private
     */
    pararAtualizacaoAutomatica() {
        Object.values(this.intervalosAtualizacao).forEach(interval => {
            if (interval) clearInterval(interval);
        });
        this.intervalosAtualizacao = {};
    }

    /**
     * Mostra/oculta loading
     * @param {boolean} mostrar - Se deve mostrar loading
     * @private
     */
    mostrarLoading(mostrar) {
        // Implementação básica - poderia ser um spinner mais sofisticado
        document.body.style.cursor = mostrar ? 'wait' : 'default';
        
        if (this.elementos.btnAtualizarDashboard) {
            this.elementos.btnAtualizarDashboard.disabled = mostrar;
            this.elementos.btnAtualizarDashboard.textContent = mostrar ? 'Atualizando...' : 'Atualizar';
        }
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
     * Formata mês/ano para exibição
     * @param {string} mesAno - String no formato YYYY-MM
     * @returns {string} Mês/ano formatado
     * @private
     */
    formatarMesAno(mesAno) {
        const [ano, mes] = mesAno.split('-');
        const data = new Date(parseInt(ano), parseInt(mes) - 1);
        return data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
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
     * Limpa recursos quando o controller é destruído
     */
    destroy() {
        this.pararAtualizacaoAutomatica();
        
        // Destruir gráficos
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        
        this.charts = {};
        console.log('DashboardController destruído');
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.DashboardController = DashboardController;
}