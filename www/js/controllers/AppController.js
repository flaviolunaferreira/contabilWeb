import { StorageProvider } from '../infra/StorageProvider.js';
import { ApiProvider } from '../infra/ApiProvider.js';
import { eventBus } from '../infra/EventBus.js';
import { ToastService } from '../infra/ToastService.js';
import { transacaoService } from '../services/TransacaoService.js';
import { cartaoService } from '../services/CartaoService.js';
import { faturaService } from '../services/FaturaService.js';
import { FinancialEngine } from '../domain/FinancialEngine.js';

// Importa os controladores (assumindo que serão módulos)
// Para injeção de dependência, passamos as instancias dos serviços nos construtores
import { DashboardController } from './DashboardController.js';
import { CartaoController } from './CartaoController.js';

export class AppController {
    constructor() {
        this.controllers = {};
    }

    async init() {
        try {
            console.log('🚀 Iniciando ContabilWeb 2.0...');
            this._toggleLoading(true);

            // 1. Inicializar Infraestrutura (Bloqueante)
            // Garante que o ApiProvider conectou ou pelo menos carregou a cache antes de prosseguir
            // StorageProvider redireciona para ApiProvider, mas chamamos direto para clareza
            await ApiProvider.init();

            // 2. Instanciar Controllers com Injeção de Dependências
            // Só instanciamos a UI depois que os dados estão "quentes" (na memória)
            this._initControllers();
            this._initGlobalEventListeners();

            // 3. Renderização Inicial
            await this._performInitialRender();

            ToastService.show('Sistema carregado com sucesso!', 'success');
            console.log('✅ Sistema pronto.');

        } catch (error) {
            console.error('🔥 CRITICAL ERROR:', error);
            ToastService.show('Erro fatal ao iniciar sistema. Verifique a conexão.', 'error');
            eventBus.publish('api:error', { message: 'Falha crítica na inicialização.' });
        } finally {
            this._toggleLoading(false);
        }
    }
    
    _toggleLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !show);
        }
    }

    _initGlobalEventListeners() {
        const configBtn = document.getElementById('configBtn');
        const configModal = document.getElementById('configModal');
        const closeConfigModal = document.getElementById('closeConfigModal');

        const generalHelpBtn = document.getElementById('generalHelpBtn');
        const generalHelpModal = document.getElementById('generalHelpModal');
        const closeGeneralHelpModal = document.getElementById('closeGeneralHelp');

        // Config Modal
        if (configBtn && configModal) {
            configBtn.addEventListener('click', () => {
                configModal.classList.remove('hidden');
            });
        }
        if (closeConfigModal && configModal) {
            closeConfigModal.addEventListener('click', () => {
                configModal.classList.add('hidden');
            });
        }

        // Help Modal
        if (generalHelpBtn && generalHelpModal) {
            generalHelpBtn.addEventListener('click', () => {
                generalHelpModal.classList.remove('hidden');
            });
        }
        if (closeGeneralHelpModal && generalHelpModal) {
            closeGeneralHelpModal.addEventListener('click', () => {
                generalHelpModal.classList.add('hidden');
            });
        }

        // Close when clicking outside
        window.onclick = (event) => {
            // Tailwind modals usually have an overlay. If clicking the overlay itself (which is the modal container), close it.
            if (event.target == configModal) {
                configModal.classList.add('hidden');
            }
            if (event.target == generalHelpModal) {
                generalHelpModal.classList.add('hidden');
            }
        };
        
        // Navigation Buttons (Bottom Bar)
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = btn.getAttribute('data-page');
                if (targetId) {
                   this._navigateTo(targetId);
                   this._updateActiveNav(btn);
                }
            });
        });
    }

    _navigateTo(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
            page.classList.remove('active');
        });
        const target = document.getElementById(pageId);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }
    }
    
    _updateActiveNav(activeBtn) {
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.remove('text-blue-600', 'active');
            btn.classList.add('text-gray-500');
        });
        activeBtn.classList.remove('text-gray-500');
        activeBtn.classList.add('text-blue-600', 'active');
    }

    _initControllers() {
        // Bloco try/catch individuais para cada controlador (Resiliência UI)
        
        // --- Dashboard Controller ---
        try {
            // Injeta FinancialEngine e Services para leitura
            this.controllers.dashboard = new DashboardController(
                FinancialEngine, 
                transacaoService, 
                cartaoService
            );
            this.controllers.dashboard.init();
        } catch (e) {
            console.error('[AppController] Falha ao carregar Dashboard:', e);
            ToastService.show('Erro ao carregar Dashboard', 'warning');
        }

        // --- Cartao Controller ---
        try {
            this.controllers.cartao = new CartaoController(cartaoService, transacaoService);
            this.controllers.cartao.init();
        } catch (e) {
            console.error('[AppController] Falha ao carregar Cards:', e);
        }

        // --- Transaction Form Controller (Próximo passo, placeholder) ---
        /*
        try {
            this.controllers.form = new TransactionFormController(transacaoService, cartaoService);
            this.controllers.form.init();
        } catch (e) { ... }
        */
        
        // --- Fatura Controller (Sprint 3 UI) ---
        /* 
        try {
            this.controllers.fatura = new FaturaController(faturaService, cartaoService);
            this.controllers.fatura.init();
        } catch(e) { ... }
        */
    }

    async _performInitialRender() {
        // Dispara evento inicial para que os controllers populam a tela
        // Como o Dashboard ouve 'finance:update', podemos disparar um inicial ou chamar um método refresh manual
        // A melhor prática num sistema reativo é emitir o estado atual
        const allTransactions = transacaoService.getAll();
        eventBus.publish('finance:update', allTransactions);
    }
}
