/**
 * @fileoverview Configurações globais da aplicação
 * @author Sistema de Controle Financeiro
 * @version 1.0.0
 */

/**
 * Configurações globais da aplicação
 * @class AppConfig
 */
class AppConfig {
    /**
     * Informações da aplicação
     * @static
     * @readonly
     */
    static APP = {
        NOME: 'Sistema de Controle Financeiro',
        VERSAO: '1.0.0',
        DESCRICAO: 'Sistema completo para controle de finanças pessoais',
        AUTOR: 'Desenvolvimento Interno',
        DATA_LANCAMENTO: '2024-01-01'
    };

    /**
     * Configurações de armazenamento
     * @static
     * @readonly
     */
    static STORAGE = {
        TIPO_PADRAO: 'localStorage',
        PREFIX: 'contabil_',
        KEYS: {
            TRANSACOES: 'transacoes',
            CARTOES: 'cartoes', 
            CATEGORIAS: 'categorias',
            CONFIGURACOES: 'configuracoes',
            BACKUP: 'backup',
            VERSAO_DADOS: 'versao_dados'
        },
        TAMANHO_MAXIMO_MB: 5,
        AUTO_BACKUP: true,
        INTERVALO_BACKUP_HORAS: 24
    };

    /**
     * Configurações de formatação
     * @static
     * @readonly
     */
    static FORMATOS = {
        MOEDA: {
            LOCALE: 'pt-BR',
            CURRENCY: 'BRL',
            SIMBOLO: 'R$',
            DECIMAL_PLACES: 2,
            SEPARADOR_DECIMAL: ',',
            SEPARADOR_MILHARES: '.'
        },
        DATA: {
            LOCALE: 'pt-BR',
            FORMATO_PADRAO: 'DD/MM/AAAA',
            FORMATO_EXIBICAO: 'dd/MM/yyyy',
            FORMATO_ISO: 'yyyy-MM-dd',
            TIMEZONE: 'America/Sao_Paulo',
            PRIMEIRO_DIA_SEMANA: 1 // Segunda-feira
        },
        NUMERO: {
            LOCALE: 'pt-BR',
            DECIMAL_PLACES: 2,
            SEPARADOR_DECIMAL: ',',
            SEPARADOR_MILHARES: '.'
        }
    };

    /**
     * Configurações de validação
     * @static
     * @readonly
     */
    static VALIDACAO = {
        TRANSACAO: {
            VALOR_MINIMO: 0.01,
            VALOR_MAXIMO: 999999999.99,
            DESCRICAO_MIN_LENGTH: 2,
            DESCRICAO_MAX_LENGTH: 200,
            OBSERVACAO_MAX_LENGTH: 500
        },
        CARTAO: {
            NOME_MIN_LENGTH: 2,
            NOME_MAX_LENGTH: 50,
            LIMITE_MINIMO: 0,
            LIMITE_MAXIMO: 999999999.99,
            DIA_VENCIMENTO_MIN: 1,
            DIA_VENCIMENTO_MAX: 31
        },
        CATEGORIA: {
            NOME_MIN_LENGTH: 2,
            NOME_MAX_LENGTH: 50,
            COR_REGEX: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
            ICONE_MAX_LENGTH: 50
        }
    };

    /**
     * Configurações de interface
     * @static
     * @readonly
     */
    static UI = {
        TEMA_PADRAO: 'light',
        PAGINACAO: {
            ITENS_POR_PAGINA: 50,
            MAXIMO_PAGINAS_VISIVEIS: 5
        },
        MENSAGENS: {
            DURACAO_TOAST: 3000,
            DURACAO_LOADING: 30000,
            AUTO_HIDE_ALERTS: true
        },
        DEBOUNCE: {
            BUSCA: 300,
            FORMULARIO: 500,
            RESIZE: 250
        },
        ANIMACOES: {
            DURACAO_PADRAO: 300,
            EASING: 'ease-in-out',
            HABILITADAS: true
        }
    };

    /**
     * Configurações de gráficos
     * @static
     * @readonly
     */
    static GRAFICOS = {
        ALTURA_PADRAO: 400,
        RESPONSIVE: true,
        MAINTAIN_ASPECT_RATIO: false,
        PALETA_CORES: [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ],
        ANIMACAO: {
            DURACAO: 1000,
            EASING: 'easeInOutQuart'
        },
        TOOLTIP: {
            BACKGROUND_COLOR: 'rgba(0, 0, 0, 0.8)',
            BORDER_COLOR: '#ffffff',
            TEXT_COLOR: '#ffffff'
        }
    };

    /**
     * Configurações de exportação/importação
     * @static
     * @readonly
     */
    static EXPORT = {
        FORMATOS_SUPORTADOS: ['json', 'csv', 'xlsx'],
        FORMATO_PADRAO: 'json',
        INCLUDE_METADATA: true,
        COMPRESSAO: false,
        MAX_REGISTROS_CSV: 10000,
        ENCODING: 'UTF-8'
    };

    /**
     * Configurações de filtros
     * @static
     * @readonly
     */
    static FILTROS = {
        PERIODO_PADRAO: 'mes_atual',
        PERIODOS_DISPONIVEIS: [
            'hoje',
            'ontem', 
            'ultimos_7_dias',
            'ultimos_15_dias',
            'ultimos_30_dias',
            'mes_atual',
            'mes_anterior',
            'ultimos_3_meses',
            'ultimos_6_meses',
            'ano_atual',
            'ano_anterior',
            'personalizado'
        ],
        APLICAR_AUTO: false,
        SALVAR_FILTROS: true
    };

    /**
     * Configurações de relatórios
     * @static
     * @readonly
     */
    static RELATORIOS = {
        CACHE_ENABLED: true,
        CACHE_DURATION_MINUTES: 15,
        AUTO_REFRESH: false,
        REFRESH_INTERVAL_SECONDS: 300,
        EXPORT_FORMATS: ['pdf', 'excel', 'csv'],
        INCLUDE_CHARTS: true
    };

    /**
     * Configurações de notificações
     * @static
     * @readonly
     */
    static NOTIFICACOES = {
        HABILITADAS: true,
        TIPOS: {
            VENCIMENTO_CARTAO: {
                HABILITADO: true,
                DIAS_ANTECEDENCIA: 3
            },
            LIMITE_CARTAO: {
                HABILITADO: true,
                PERCENTUAL_ALERTA: 80
            },
            ORCAMENTO_CATEGORIA: {
                HABILITADO: true,
                PERCENTUAL_ALERTA: 90
            },
            BACKUP_AUTOMATICO: {
                HABILITADO: true,
                FREQUENCIA_DIAS: 7
            }
        },
        POSICAO: 'top-right',
        AUTO_CLOSE: true,
        CLOSE_DELAY: 5000
    };

    /**
     * Configurações de segurança
     * @static
     * @readonly
     */
    static SEGURANCA = {
        TIMEOUT_SESSAO_MINUTOS: 60,
        HASH_SALT_ROUNDS: 10,
        MAX_TENTATIVAS_LOGIN: 3,
        BLOQUEIO_MINUTOS: 15,
        CRIPTOGRAFIA_DADOS: false,
        LOG_ACOES: true
    };

    /**
     * URLs e endpoints
     * @static
     * @readonly
     */
    static URLS = {
        API_BASE: '',
        BACKUP_ENDPOINT: '/api/backup',
        SYNC_ENDPOINT: '/api/sync',
        COTACAO_MOEDAS: 'https://api.exchangerate-api.com/v4/latest/BRL',
        DOCUMENTACAO: 'https://docs.exemplo.com',
        SUPORTE: 'mailto:suporte@exemplo.com'
    };

    /**
     * Configurações de desenvolvedor
     * @static
     * @readonly
     */
    static DEBUG = {
        ENABLED: false,
        LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
        CONSOLE_LOGS: true,
        PERFORMANCE_MONITORING: false,
        ERROR_REPORTING: false,
        MOCK_DATA: false
    };

    /**
     * Configurações padrão do usuário
     * @static
     * @readonly
     */
    static USER_DEFAULTS = {
        TEMA: 'light',
        IDIOMA: 'pt-BR',
        TIMEZONE: 'America/Sao_Paulo',
        FORMATO_DATA: 'DD/MM/AAAA',
        PRIMEIRA_CATEGORIA: 'Geral',
        MOSTRAR_TUTORIAL: true,
        AUTO_SALVAR: true,
        CONFIRMAR_EXCLUSOES: true
    };

    /**
     * Limites do sistema
     * @static
     * @readonly
     */
    static LIMITES = {
        MAX_TRANSACOES: 50000,
        MAX_CARTOES: 50,
        MAX_CATEGORIAS: 100,
        MAX_PARCELAS: 60,
        MAX_ARQUIVO_IMPORT_MB: 10,
        MAX_BACKUP_FILES: 10,
        TIMEOUT_REQUEST_MS: 30000
    };

    /**
     * Categorias padrão do sistema
     * @static
     * @readonly
     */
    static CATEGORIAS_PADRAO = [
        // Receitas
        { nome: 'Salário', tipo: 'receita', cor: '#22C55E', icone: 'fas fa-money-bill-wave' },
        { nome: 'Freelance', tipo: 'receita', cor: '#10B981', icone: 'fas fa-laptop-code' },
        { nome: 'Investimentos', tipo: 'receita', cor: '#059669', icone: 'fas fa-chart-line' },
        { nome: 'Vendas', tipo: 'receita', cor: '#047857', icone: 'fas fa-shopping-cart' },
        { nome: 'Outros Ganhos', tipo: 'receita', cor: '#065F46', icone: 'fas fa-plus-circle' },
        
        // Despesas Essenciais
        { nome: 'Alimentação', tipo: 'despesa', cor: '#EF4444', icone: 'fas fa-utensils' },
        { nome: 'Moradia', tipo: 'despesa', cor: '#DC2626', icone: 'fas fa-home' },
        { nome: 'Transporte', tipo: 'despesa', cor: '#B91C1C', icone: 'fas fa-car' },
        { nome: 'Saúde', tipo: 'despesa', cor: '#991B1B', icone: 'fas fa-heartbeat' },
        { nome: 'Educação', tipo: 'despesa', cor: '#7F1D1D', icone: 'fas fa-graduation-cap' },
        
        // Despesas Variáveis
        { nome: 'Lazer', tipo: 'despesa', cor: '#F59E0B', icone: 'fas fa-gamepad' },
        { nome: 'Compras', tipo: 'despesa', cor: '#D97706', icone: 'fas fa-shopping-bag' },
        { nome: 'Vestuário', tipo: 'despesa', cor: '#B45309', icone: 'fas fa-tshirt' },
        { nome: 'Eletrônicos', tipo: 'despesa', cor: '#92400E', icone: 'fas fa-mobile-alt' },
        { nome: 'Viagens', tipo: 'despesa', cor: '#78350F', icone: 'fas fa-plane' },
        
        // Serviços
        { nome: 'Internet', tipo: 'despesa', cor: '#8B5CF6', icone: 'fas fa-wifi' },
        { nome: 'Telefone', tipo: 'despesa', cor: '#7C3AED', icone: 'fas fa-phone' },
        { nome: 'Streaming', tipo: 'despesa', cor: '#6D28D9', icone: 'fas fa-play-circle' },
        { nome: 'Academia', tipo: 'despesa', cor: '#5B21B6', icone: 'fas fa-dumbbell' },
        { nome: 'Seguros', tipo: 'despesa', cor: '#4C1D95', icone: 'fas fa-shield-alt' },
        
        // Geral
        { nome: 'Geral', tipo: 'ambos', cor: '#6B7280', icone: 'fas fa-circle' }
    ];

    /**
     * Obtém configuração específica
     * @param {string} secao - Seção da configuração
     * @param {string} chave - Chave específica
     * @param {any} padrao - Valor padrão se não encontrado
     * @returns {any} Valor da configuração
     */
    static obter(secao, chave = null, padrao = null) {
        try {
            const config = this[secao.toUpperCase()];
            if (!config) return padrao;
            
            if (chave === null) return config;
            
            return config[chave.toUpperCase()] ?? padrao;
        } catch (error) {
            console.error('Erro ao obter configuração:', error);
            return padrao;
        }
    }

    /**
     * Verifica se está em modo debug
     * @returns {boolean} True se debug habilitado
     */
    static isDebug() {
        return this.DEBUG.ENABLED;
    }

    /**
     * Obtém configurações de tema
     * @param {string} tema - Nome do tema
     * @returns {Object} Configurações do tema
     */
    static obterTema(tema = null) {
        const temaAtual = tema || this.USER_DEFAULTS.TEMA;
        
        const temas = {
            light: {
                nome: 'Claro',
                primary: '#3B82F6',
                secondary: '#6B7280',
                success: '#22C55E',
                warning: '#F59E0B',
                danger: '#EF4444',
                background: '#FFFFFF',
                surface: '#F9FAFB',
                text: '#1F2937'
            },
            dark: {
                nome: 'Escuro',
                primary: '#60A5FA',
                secondary: '#9CA3AF',
                success: '#34D399',
                warning: '#FBBF24',
                danger: '#F87171',
                background: '#1F2937',
                surface: '#374151',
                text: '#F9FAFB'
            }
        };

        return temas[temaAtual] || temas.light;
    }

    /**
     * Obtém configurações responsivas baseadas no tamanho da tela
     * @returns {Object} Configurações responsivas
     */
    static obterResponsivo() {
        const largura = window.innerWidth;
        
        if (largura < 640) {
            return {
                tipo: 'mobile',
                colunas: 1,
                sidebar: false,
                paginacao: 20,
                graficos: { altura: 250 }
            };
        }
        
        if (largura < 1024) {
            return {
                tipo: 'tablet',
                colunas: 2,
                sidebar: false,
                paginacao: 30,
                graficos: { altura: 300 }
            };
        }
        
        return {
            tipo: 'desktop',
            colunas: 3,
            sidebar: true,
            paginacao: 50,
            graficos: { altura: 400 }
        };
    }

    /**
     * Valida configuração
     * @param {string} secao - Seção a validar
     * @param {Object} dados - Dados a validar
     * @returns {boolean} True se válido
     */
    static validarConfiguracao(secao, dados) {
        try {
            const schema = this[`SCHEMA_${secao.toUpperCase()}`];
            if (!schema) return true;
            
            // Implementar validação de schema se necessário
            return true;
        } catch (error) {
            console.error('Erro na validação:', error);
            return false;
        }
    }

    /**
     * Mescla configurações personalizadas
     * @param {Object} customConfig - Configurações personalizadas
     * @returns {Object} Configurações mescladas
     */
    static mesclarConfiguracao(customConfig) {
        const merged = {};
        
        // Copiar configurações padrão
        Object.keys(this).forEach(key => {
            if (typeof this[key] === 'object' && !Array.isArray(this[key])) {
                merged[key] = { ...this[key] };
            }
        });
        
        // Aplicar configurações personalizadas
        Object.keys(customConfig).forEach(secao => {
            if (merged[secao]) {
                merged[secao] = { ...merged[secao], ...customConfig[secao] };
            } else {
                merged[secao] = customConfig[secao];
            }
        });
        
        return merged;
    }

    /**
     * Obtém informações do ambiente
     * @returns {Object} Informações do ambiente
     */
    static obterAmbiente() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            isOnline: navigator.onLine,
            cookiesEnabled: navigator.cookieEnabled,
            localStorageSupported: this.testarLocalStorage(),
            sessionStorageSupported: this.testarSessionStorage()
        };
    }

    /**
     * Testa suporte ao localStorage
     * @returns {boolean} True se suportado
     * @private
     */
    static testarLocalStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Testa suporte ao sessionStorage
     * @returns {boolean} True se suportado
     * @private
     */
    static testarSessionStorage() {
        try {
            const test = 'test';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.AppConfig = AppConfig;
}

// Exportar para Node.js se disponível
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
}