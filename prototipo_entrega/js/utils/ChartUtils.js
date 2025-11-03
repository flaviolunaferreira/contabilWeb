/**
 * @fileoverview Utilitários para gráficos Chart.js
 * @author Sistema de Controle Financeiro
 * @version 1.0.0
 */

/**
 * Classe utilitária para gráficos
 * @class ChartUtils
 */
class ChartUtils {
    /**
     * Paletas de cores predefinidas
     * @static
     * @readonly
     */
    static PALETAS = {
        DEFAULT: [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ],
        FINANCEIRO: [
            '#22C55E', // Verde - Receitas
            '#EF4444', // Vermelho - Despesas
            '#3B82F6', // Azul - Saldo
            '#F59E0B', // Laranja - Pendente
            '#8B5CF6', // Roxo - Investimentos
            '#EC4899', // Rosa - Cartão
            '#06B6D4', // Ciano - Transferência
            '#84CC16'  // Lima - Economia
        ],
        CATEGORIAS: [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
            '#FF8A80', '#80CBC4', '#81C784', '#FFB74D', '#F06292',
            '#9575CD', '#4FC3F7', '#FFF176', '#A1887F', '#90A4AE'
        ],
        GRADIENTES: {
            RECEITA: {
                start: '#22C55E',
                end: '#16A34A'
            },
            DESPESA: {
                start: '#EF4444',
                end: '#DC2626'
            },
            SALDO: {
                start: '#3B82F6',
                end: '#2563EB'
            }
        }
    };

    /**
     * Configurações padrão para diferentes tipos de gráfico
     * @static
     * @readonly
     */
    static CONFIGS_PADRAO = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#ffffff',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true
            }
        }
    };

    /**
     * Gera gradient para canvas
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     * @param {Object} gradiente - Configuração do gradiente
     * @param {string} direcao - Direção ('vertical', 'horizontal')
     * @returns {CanvasGradient} Gradiente gerado
     */
    static criarGradiente(ctx, gradiente, direcao = 'vertical') {
        const chartArea = ctx.chart.chartArea;
        if (!chartArea) return gradiente.start;

        let gradient;
        if (direcao === 'vertical') {
            gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        } else {
            gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
        }

        gradient.addColorStop(0, gradiente.start);
        gradient.addColorStop(1, gradiente.end);

        return gradient;
    }

    /**
     * Configuração para gráfico de linha
     * @param {Object} dados - Dados do gráfico
     * @param {Object} opcoes - Opções personalizadas
     * @returns {Object} Configuração completa
     */
    static configurarGraficoLinha(dados, opcoes = {}) {
        const config = {
            type: 'line',
            data: dados,
            options: {
                ...this.CONFIGS_PADRAO,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                if (opcoes.formatarMoeda && window.CurrencyUtils) {
                                    return window.CurrencyUtils.formatarReal(value);
                                }
                                return value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                elements: {
                    line: {
                        tension: 0.4,
                        borderWidth: 3
                    },
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                },
                ...opcoes
            }
        };

        return config;
    }

    /**
     * Configuração para gráfico de barras
     * @param {Object} dados - Dados do gráfico
     * @param {Object} opcoes - Opções personalizadas
     * @returns {Object} Configuração completa
     */
    static configurarGraficoBarras(dados, opcoes = {}) {
        const config = {
            type: 'bar',
            data: dados,
            options: {
                ...this.CONFIGS_PADRAO,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                if (opcoes.formatarMoeda && window.CurrencyUtils) {
                                    return window.CurrencyUtils.formatarReal(value);
                                }
                                return value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                elements: {
                    bar: {
                        borderRadius: 4,
                        borderSkipped: false
                    }
                },
                ...opcoes
            }
        };

        return config;
    }

    /**
     * Configuração para gráfico de pizza/rosquinha
     * @param {Object} dados - Dados do gráfico
     * @param {Object} opcoes - Opções personalizadas
     * @returns {Object} Configuração completa
     */
    static configurarGraficoPizza(dados, opcoes = {}) {
        const tipo = opcoes.tipo || 'doughnut';
        
        const config = {
            type: tipo,
            data: dados,
            options: {
                ...this.CONFIGS_PADRAO,
                cutout: tipo === 'doughnut' ? '50%' : 0,
                plugins: {
                    ...this.CONFIGS_PADRAO.plugins,
                    tooltip: {
                        ...this.CONFIGS_PADRAO.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                
                                if (opcoes.formatarMoeda && window.CurrencyUtils) {
                                    return `${label}: ${window.CurrencyUtils.formatarReal(value)} (${percentage}%)`;
                                }
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                ...opcoes
            }
        };

        return config;
    }

    /**
     * Configuração para gráfico misto (barras + linha)
     * @param {Object} dados - Dados do gráfico
     * @param {Object} opcoes - Opções personalizadas
     * @returns {Object} Configuração completa
     */
    static configurarGraficoMisto(dados, opcoes = {}) {
        const config = {
            type: 'bar',
            data: dados,
            options: {
                ...this.CONFIGS_PADRAO,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                if (opcoes.formatarMoeda && window.CurrencyUtils) {
                                    return window.CurrencyUtils.formatarReal(value);
                                }
                                return value;
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: opcoes.mostrarEixoSecundario || false,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                ...opcoes
            }
        };

        return config;
    }

    /**
     * Preparar dados para gráfico de fluxo mensal
     * @param {Object} dadosMensais - Dados agrupados por mês
     * @returns {Object} Dados formatados para Chart.js
     */
    static prepararDadosFluxoMensal(dadosMensais) {
        const meses = Object.keys(dadosMensais).sort();
        const receitas = meses.map(mes => dadosMensais[mes].receitas || 0);
        const despesas = meses.map(mes => dadosMensais[mes].despesas || 0);
        const saldo = meses.map(mes => dadosMensais[mes].saldo || 0);

        return {
            labels: meses.map(mes => this.formatarMesAno(mes)),
            datasets: [
                {
                    label: 'Receitas',
                    type: 'bar',
                    data: receitas,
                    backgroundColor: this.PALETAS.FINANCEIRO[0] + '80',
                    borderColor: this.PALETAS.FINANCEIRO[0],
                    borderWidth: 2
                },
                {
                    label: 'Despesas',
                    type: 'bar',
                    data: despesas,
                    backgroundColor: this.PALETAS.FINANCEIRO[1] + '80',
                    borderColor: this.PALETAS.FINANCEIRO[1],
                    borderWidth: 2
                },
                {
                    label: 'Saldo',
                    type: 'line',
                    data: saldo,
                    backgroundColor: 'transparent',
                    borderColor: this.PALETAS.FINANCEIRO[2],
                    borderWidth: 3,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        };
    }

    /**
     * Preparar dados para gráfico de categorias
     * @param {Object} dadosCategorias - Dados agrupados por categoria
     * @returns {Object} Dados formatados para Chart.js
     */
    static prepararDadosCategorias(dadosCategorias) {
        const categorias = Object.keys(dadosCategorias);
        const valores = categorias.map(cat => dadosCategorias[cat].total || 0);
        const cores = this.gerarCores(categorias.length, 'CATEGORIAS');

        return {
            labels: categorias,
            datasets: [{
                data: valores,
                backgroundColor: cores,
                borderColor: cores.map(cor => cor.replace('80', 'FF')),
                borderWidth: 2
            }]
        };
    }

    /**
     * Preparar dados para gráfico de evolução
     * @param {Object} dadosMensais - Dados agrupados por mês
     * @returns {Object} Dados formatados para Chart.js
     */
    static prepararDadosEvolucao(dadosMensais) {
        const meses = Object.keys(dadosMensais).sort();
        let saldoAcumulado = 0;
        const evolucao = meses.map(mes => {
            saldoAcumulado += dadosMensais[mes].saldo || 0;
            return saldoAcumulado;
        });

        return {
            labels: meses.map(mes => this.formatarMesAno(mes)),
            datasets: [{
                label: 'Saldo Acumulado',
                data: evolucao,
                backgroundColor: this.PALETAS.FINANCEIRO[2] + '20',
                borderColor: this.PALETAS.FINANCEIRO[2],
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        };
    }

    /**
     * Preparar dados para gráfico de cartões
     * @param {Object} resumoCartoes - Resumo de uso dos cartões
     * @returns {Object} Dados formatados para Chart.js
     */
    static prepararDadosCartoes(resumoCartoes) {
        const cartoes = Object.values(resumoCartoes).filter(c => c.ativo);
        const nomes = cartoes.map(c => c.nome);
        const utilizados = cartoes.map(c => c.utilizado);
        const limites = cartoes.map(c => c.limite);

        return {
            labels: nomes,
            datasets: [
                {
                    label: 'Utilizado',
                    data: utilizados,
                    backgroundColor: this.PALETAS.FINANCEIRO[1] + '80',
                    borderColor: this.PALETAS.FINANCEIRO[1],
                    borderWidth: 2
                },
                {
                    label: 'Limite',
                    data: limites,
                    backgroundColor: this.PALETAS.FINANCEIRO[3] + '40',
                    borderColor: this.PALETAS.FINANCEIRO[3],
                    borderWidth: 2
                }
            ]
        };
    }

    /**
     * Gera cores para gráficos
     * @param {number} quantidade - Quantidade de cores necessárias
     * @param {string} paleta - Nome da paleta a usar
     * @param {number} alpha - Transparência (0-1)
     * @returns {string[]} Array de cores
     */
    static gerarCores(quantidade, paleta = 'DEFAULT', alpha = 0.8) {
        const paletaEscolhida = this.PALETAS[paleta] || this.PALETAS.DEFAULT;
        const cores = [];

        for (let i = 0; i < quantidade; i++) {
            if (i < paletaEscolhida.length) {
                // Usar cor da paleta
                const cor = paletaEscolhida[i];
                cores.push(this.adicionarAlpha(cor, alpha));
            } else {
                // Gerar cor aleatória
                const hue = (i * 137.508) % 360; // Golden angle
                cores.push(`hsla(${hue}, 70%, 60%, ${alpha})`);
            }
        }

        return cores;
    }

    /**
     * Adiciona transparência a uma cor hex
     * @param {string} cor - Cor em formato hex
     * @param {number} alpha - Transparência (0-1)
     * @returns {string} Cor com transparência
     */
    static adicionarAlpha(cor, alpha = 1) {
        if (cor.startsWith('#')) {
            const r = parseInt(cor.slice(1, 3), 16);
            const g = parseInt(cor.slice(3, 5), 16);
            const b = parseInt(cor.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return cor;
    }

    /**
     * Formata string mês/ano
     * @param {string} mesAno - String no formato YYYY-MM
     * @returns {string} Mês/ano formatado
     */
    static formatarMesAno(mesAno) {
        if (window.DateUtils && window.DateUtils.MESES_ABREV) {
            const [ano, mes] = mesAno.split('-');
            const numeroMes = parseInt(mes) - 1;
            return `${window.DateUtils.MESES_ABREV[numeroMes]}/${ano}`;
        }
        
        // Fallback se DateUtils não estiver disponível
        const [ano, mes] = mesAno.split('-');
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${meses[parseInt(mes) - 1]}/${ano}`;
    }

    /**
     * Configurações de animação
     * @param {string} tipo - Tipo de animação
     * @returns {Object} Configuração de animação
     */
    static obterAnimacao(tipo = 'default') {
        const animacoes = {
            default: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            rapida: {
                duration: 500,
                easing: 'easeOutQuart'
            },
            lenta: {
                duration: 2000,
                easing: 'easeInOutCubic'
            },
            bounce: {
                duration: 1500,
                easing: 'easeOutBounce'
            },
            slide: {
                duration: 800,
                easing: 'easeInOutSine'
            }
        };

        return {
            animation: animacoes[tipo] || animacoes.default
        };
    }

    /**
     * Configurações responsivas para diferentes tamanhos de tela
     * @param {string} tamanho - Tamanho da tela ('mobile', 'tablet', 'desktop')
     * @returns {Object} Configurações responsivas
     */
    static obterConfigResponsiva(tamanho = 'desktop') {
        const configs = {
            mobile: {
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 10,
                            font: {
                                size: 10
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            maxRotation: 45,
                            font: {
                                size: 10
                            }
                        }
                    },
                    y: {
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    }
                }
            },
            tablet: {
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 15,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            },
            desktop: {
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 20,
                            padding: 20,
                            font: {
                                size: 14
                            }
                        }
                    }
                }
            }
        };

        return configs[tamanho] || configs.desktop;
    }

    /**
     * Detecta tamanho da tela atual
     * @returns {string} Tamanho da tela
     */
    static detectarTamanhaTela() {
        const largura = window.innerWidth;
        
        if (largura < 768) return 'mobile';
        if (largura < 1024) return 'tablet';
        return 'desktop';
    }

    /**
     * Mescla configurações de gráfico
     * @param {Object} configBase - Configuração base
     * @param {Object} configPersonalizada - Configuração personalizada
     * @returns {Object} Configuração mesclada
     */
    static mesclarConfiguracoes(configBase, configPersonalizada) {
        return this.deepMerge(configBase, configPersonalizada);
    }

    /**
     * Merge profundo de objetos
     * @param {Object} target - Objeto alvo
     * @param {Object} source - Objeto fonte
     * @returns {Object} Objeto mesclado
     * @private
     */
    static deepMerge(target, source) {
        const output = Object.assign({}, target);
        
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        
        return output;
    }

    /**
     * Verifica se valor é objeto
     * @param {any} item - Item a verificar
     * @returns {boolean} True se é objeto
     * @private
     */
    static isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    /**
     * Exporta gráfico como imagem
     * @param {Chart} chart - Instância do Chart.js
     * @param {string} formato - Formato da imagem ('png', 'jpg')
     * @param {string} nomeArquivo - Nome do arquivo
     */
    static exportarGrafico(chart, formato = 'png', nomeArquivo = 'grafico') {
        if (!chart || !chart.canvas) {
            console.error('Gráfico inválido para exportação');
            return;
        }

        const url = chart.canvas.toDataURL(`image/${formato}`);
        const link = document.createElement('a');
        link.download = `${nomeArquivo}.${formato}`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Redimensiona gráfico
     * @param {Chart} chart - Instância do Chart.js
     * @param {number} largura - Nova largura
     * @param {number} altura - Nova altura
     */
    static redimensionarGrafico(chart, largura, altura) {
        if (!chart || !chart.canvas) return;

        chart.canvas.parentNode.style.width = `${largura}px`;
        chart.canvas.parentNode.style.height = `${altura}px`;
        chart.resize();
    }

    /**
     * Destroy gráfico de forma segura
     * @param {Chart} chart - Instância do Chart.js
     */
    static destruirGrafico(chart) {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.ChartUtils = ChartUtils;
}

// Exportar para Node.js se disponível
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartUtils;
}