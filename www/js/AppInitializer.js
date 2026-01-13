/**
 * @fileoverview Arquivo de inicialização para teste dos módulos
 * @author Sistema de Controle Financeiro
 * @version 1.0.0
 */

/**
 * Classe para inicialização e teste do sistema modular
 * @class AppInitializer
 */
class AppInitializer {
    constructor() {
        this.modulosCarregados = new Set();
        this.erros = [];
    }

    /**
     * Inicializa a aplicação
     */
    async inicializar() {
        // Inicializa Camada de Dados (ApiProvider via StorageProvider)
        if (window.StorageProvider) {
            await window.StorageProvider.init(); // Assumindo global ou import
        } else {
            // Em ambiente módulo, importaríamos, mas aqui parece rodar no browser global ou via modules
            // Tentaremos carregar via import dinâmico se necessário, mas o código acima sugere uso de classes
        }
        console.log('🚀 Iniciando Sistema de Controle Financeiro...');
        
        try {
            // Verificar dependências
            await this.verificarDependencias();
            
            // Inicializar configurações
            await this.inicializarConfiguracoes();
            
            // Carregar dados
            await this.carregarDados();
            
            // Inicializar controladores
            await this.inicializarControladores();
            
            // Executar testes básicos
            await this.executarTestes();
            
            console.log('✅ Sistema inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema:', error);
            this.erros.push(error);
        }
    }

    /**
     * Verifica se todas as dependências estão carregadas
     */
    async verificarDependencias() {
        console.log('🔍 Verificando dependências...');
        
        const dependencias = {
            // Configurações
            'AppConfig': window.AppConfig,
            
            // Utilitários
            'DateUtils': window.DateUtils,
            'CurrencyUtils': window.CurrencyUtils,
            'ValidationUtils': window.ValidationUtils,
            'ChartUtils': window.ChartUtils,
            
            // Modelos
            'Transacao': window.Transacao,
            'Cartao': window.Cartao,
            'Categoria': window.Categoria,
            
            // Serviços
            'StorageService': window.StorageService,
            'TransacaoService': window.TransacaoService,
            'CartaoService': window.CartaoService,
            'CategoriaService': window.CategoriaService,
            
            // Controladores
            'TransacaoController': window.TransacaoController,
            'CartaoController': window.CartaoController,
            'DashboardController': window.DashboardController
        };

        for (const [nome, modulo] of Object.entries(dependencias)) {
            if (modulo) {
                this.modulosCarregados.add(nome);
                console.log(`✅ ${nome} carregado`);
            } else {
                console.error(`❌ ${nome} não encontrado`);
                this.erros.push(`Módulo ${nome} não carregado`);
            }
        }

        console.log(`📊 ${this.modulosCarregados.size}/${Object.keys(dependencias).length} módulos carregados`);
    }

    /**
     * Inicializa configurações globais
     */
    async inicializarConfiguracoes() {
        console.log('⚙️ Inicializando configurações...');
        
        if (window.AppConfig) {
            console.log('📋 Informações da aplicação:', window.AppConfig.APP);
            console.log('💾 Configurações de storage:', window.AppConfig.STORAGE);
            console.log('🎨 Tema padrão:', window.AppConfig.obterTema());
        }
    }

    /**
     * Carrega dados iniciais
     */
    async carregarDados() {
        console.log('📂 Carregando dados iniciais...');
        
        try {
            // Inicializar StorageService
            let storageService = null;
            if (window.StorageService) {
                storageService = new window.StorageService();
                await storageService.init();
                console.log('✅ StorageService inicializado');
            }

            // Carregar categorias padrão se necessário
            if (window.CategoriaService && storageService) {
                const categoriaService = new window.CategoriaService(storageService);
                await categoriaService.init();
                const categorias = categoriaService.obterTodas();
                if (categorias.length === 0) {
                    await categoriaService.criarCategoriasDefault();
                    console.log('✅ Categorias padrão criadas');
                }
            }

            // Inicializar outros serviços se necessário
            if (window.TransacaoService && storageService) {
                const transacaoService = new window.TransacaoService(storageService);
                await transacaoService.init();
                console.log('✅ TransacaoService inicializado');
            }

            if (window.CartaoService && storageService) {
                const cartaoService = new window.CartaoService(storageService);
                await cartaoService.init();
                console.log('✅ CartaoService inicializado');
            }

        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.erros.push(error);
        }
    }

    /**
     * Inicializa controladores
     */
    async inicializarControladores() {
        console.log('🎮 Inicializando controladores...');
        
        try {
            // O script principal (script.js) ainda é responsável por inicializar os controladores
            // Esta seção será expandida quando a migração estiver completa
            console.log('⚠️ Controladores serão inicializados pelo script principal');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar controladores:', error);
            this.erros.push(error);
        }
    }

    /**
     * Executa testes básicos dos módulos
     */
    async executarTestes() {
        console.log('🧪 Executando testes básicos...');
        
        try {
            // Testar DateUtils
            if (window.DateUtils) {
                const hoje = window.DateUtils.hoje();
                console.log('📅 Data de hoje:', hoje);
                
                const formatada = window.DateUtils.formatarData(new Date(), 'DD/MM/AAAA');
                console.log('📅 Data formatada:', formatada);
            }

            // Testar CurrencyUtils
            if (window.CurrencyUtils) {
                const valorFormatado = window.CurrencyUtils.formatarReal(1234.56);
                console.log('💰 Valor formatado:', valorFormatado);
                
                const valorParseado = window.CurrencyUtils.parseMoeda('R$ 1.234,56');
                console.log('💰 Valor parseado:', valorParseado);
            }

            // Testar ValidationUtils
            if (window.ValidationUtils) {
                const emailValido = window.ValidationUtils.email('test@example.com');
                console.log('📧 Email válido:', emailValido);
                
                const cpfValido = window.ValidationUtils.cpf('123.456.789-09');
                console.log('📄 CPF válido:', cpfValido);
            }

            // Testar criação de modelos
            if (window.Transacao) {
                const transacao = new window.Transacao({
                    tipo: 'receita',
                    valor: 1000,
                    descricao: 'Teste',
                    data: new Date(),
                    categoria: 'Teste'
                });
                console.log('💳 Transação criada:', transacao);
            }

            console.log('✅ Testes básicos concluídos');

        } catch (error) {
            console.error('❌ Erro nos testes:', error);
            this.erros.push(error);
        }
    }

    /**
     * Gera relatório de inicialização
     */
    gerarRelatorio() {
        console.log('\n📊 RELATÓRIO DE INICIALIZAÇÃO');
        console.log('=====================================');
        console.log(`✅ Módulos carregados: ${this.modulosCarregados.size}`);
        console.log(`❌ Erros encontrados: ${this.erros.length}`);
        
        if (this.modulosCarregados.size > 0) {
            console.log('\n📦 Módulos carregados:');
            this.modulosCarregados.forEach(modulo => {
                console.log(`  - ${modulo}`);
            });
        }

        if (this.erros.length > 0) {
            console.log('\n⚠️ Erros encontrados:');
            this.erros.forEach(erro => {
                console.log(`  - ${erro}`);
            });
        }

        console.log('\n🏁 Inicialização finalizada');
        console.log('=====================================\n');
    }

    /**
     * Obtém estatísticas dos módulos
     */
    obterEstatisticas() {
        return {
            modulosCarregados: Array.from(this.modulosCarregados),
            totalModulos: this.modulosCarregados.size,
            totalErros: this.erros.length,
            erros: [...this.erros],
            sucesso: this.erros.length === 0
        };
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    // Aguardar um pouco para garantir que todos os scripts foram carregados
    setTimeout(async () => {
        const inicializador = new AppInitializer();
        await inicializador.inicializar();
        inicializador.gerarRelatorio();
        
        // Disponibilizar globalmente para debug
        window.appInitializer = inicializador;
        
    }, 500);
});

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.AppInitializer = AppInitializer;
}