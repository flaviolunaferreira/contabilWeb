import { eventBus } from '../infra/EventBus.js';
import { FinancialEngine } from '../domain/FinancialEngine.js';
import { ConsultantView } from './ConsultantView.js';
import { debtService } from '../services/DebtService.js'; // Garantir instâncias
import { transacaoService } from '../services/TransacaoService.js';

export class DashboardController {
    /**
     * @param {FinancialEngine} financialEngine Classe estática de cálculo
     * @param {TransacaoService} transacaoService Serviço de leitura
     * @param {CartaoService} cartaoService Serviço de cartões
     */
    constructor(financialEngine, transacaoService, cartaoService) {
        this.engine = financialEngine; 
        this.transacaoService = transacaoService;
        this.cartaoService = cartaoService;
        
        // Inicializa o Consultor View (ViewModel)
        // DebtService já deve estar instanciado globalmente ou importado
        // Como estamos em ES Modules sem injeção automática complexa, instanciamos aqui ou recebemos
        // Para simplificar, vamos instanciar ConsultantView passando as deps
        this.consultantView = new ConsultantView(financialEngine, new debtService.constructor(), transacaoService);

        // Elementos do DOM (Cache)
        this.els = {
            saldoReal: document.getElementById('saldo-real-display'), 
            faturas: document.getElementById('faturas-display'),
            liquido: document.getElementById('patrimonio-liquido-display'),
            container: document.getElementById('dashboard-container'),
            consultantContainer: document.getElementById('consultant-insights')
        };
    }

    init() {
        console.log('[Dashboard] Inicializando...');
        this._setupListeners();
        this._renderSkeleton();
        
        this._performInitialRender();
    }
    
    _performInitialRender() {
        try {
            // Render inicial (se já tiver dados carregados)
            const transactions = this.transacaoService.getAll();
            if (transactions && transactions.length > 0) {
                 this._updateUI(transactions);
            } else {
                 // Estado vazio ou aguardando sync
            }
        } catch (e) {
            console.error('Erro no render inicial do Dashboard:', e);
            this._showErrorState();
        }
    }
    
    _showErrorState() {
        if(this.els.container) {
            this.els.container.innerHTML = `
                <div class="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                    <h3 class="text-red-800 font-bold mb-2">Erro ao carregar Dashboard</h3>
                    <p class="text-red-600 mb-4">Não foi possível processar os dados iniciais.</p>
                    <button onclick="window.location.reload()" class="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700">
                        Recarregar Sistema
                    </button>
                </div>
            `;
        }
    }

    _setupListeners() {
        eventBus.subscribe('finance:update', (transactions) => {
            console.log('[Dashboard] Recebido finance:update. Recalculando...');
            this._updateUI(transactions);
        });
    }

    _renderSkeleton() {
        const skeletonClass = 'animate-pulse bg-gray-300 h-8 w-24 rounded inline-block';
        if(this.els.saldoReal) this.els.saldoReal.innerHTML = `<div class="${skeletonClass}"></div>`;
    }

    _updateUI(transactions) {
        try {
            // Delega o cálculo pesado para a Engine
            const metrics = this.engine.compute(transactions);

            // Atualiza Cards Principais
            this._animateValue(this.els.saldoReal, metrics.realBalance);
            this._animateValue(this.els.faturas, metrics.liabilities); 
            this._animateValue(this.els.liquido, metrics.netWorth);

            this._updateCardBalanceColors(metrics.realBalance);

            // --- CENTRAL DE INTELIGÊNCIA ---
            this._renderInsights();

        } catch (error) {
            console.error('[Dashboard] Erro ao renderizar:', error);
            if(this.els.saldoReal) this.els.saldoReal.innerText = 'R$ --';
        }
    }

    _renderInsights() {
        if (!this.els.consultantContainer) return;

        const insights = this.consultantView.generateInsights();
        if (!insights || insights.length === 0) {
            this.els.consultantContainer.innerHTML = '';
            return;
        }

        const cardsHtml = insights.map(insight => {
            let colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
            let icon = '💡';
            
            if (insight.type === 'ALERT' || insight.type === 'STRATEGY') { // STRATEGY pode ser vermelho se for urgente
                 if (insight.type === 'ALERT') {
                    colorClass = 'bg-red-100 text-red-800 border-red-200';
                    icon = '🚀'; // Icone de alerta
                 } else {
                    colorClass = 'bg-blue-50 text-blue-900 border-blue-200';
                    icon = '🎯'; // Estrategia
                 }
            } else if (insight.type === 'TIP') {
                colorClass = 'bg-green-100 text-green-800 border-green-200';
                icon = '💰';
            }

            return `
                <div class="border-l-4 p-4 rounded-r shadow-sm flex items-start ${colorClass}">
                    <div class="text-2xl mr-3">${icon}</div>
                    <div>
                        <h4 class="font-bold text-sm uppercase mb-1 opacity-75">${insight.title}</h4>
                        <p class="text-sm font-medium">${insight.message}</p>
                    </div>
                </div>
            `;
        }).join('');

        this.els.consultantContainer.innerHTML = cardsHtml;
    }

    _animateValue(element, valueCents) {
        if (!element) return;
        const formatted = this.engine.formatCurrency(valueCents);
        element.style.transition = 'opacity 0.2s';
        element.style.opacity = '0';
        setTimeout(() => {
            element.innerText = formatted;
            element.style.opacity = '1';
        }, 200);
    }

    _updateCardBalanceColors(balance) {
        // Muda cor do saldo se negativo
        if (this.els.saldoReal) {
            // Remove classes antigas para limpar
            this.els.saldoReal.classList.remove('text-green-600', 'text-red-600', 'text-gray-800');
            
            if (balance < 0) {
                this.els.saldoReal.classList.add('text-red-600');
            } else {
                this.els.saldoReal.classList.add('text-gray-800'); 
            }
        }
    }
}
