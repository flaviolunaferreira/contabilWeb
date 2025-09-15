/**
 * @fileoverview Utilitários para manipulação de valores monetários
 * @author Sistema de Controle Financeiro
 * @version 1.0.0
 */

/**
 * Classe utilitária para operações com valores monetários
 * @class CurrencyUtils
 */
class CurrencyUtils {
    /**
     * Configurações padrão para formatação
     * @static
     * @readonly
     */
    static CONFIG_PADRAO = {
        moeda: 'BRL',
        locale: 'pt-BR',
        casasDecimais: 2,
        exibirSimbolo: true,
        exibirCodigo: false
    };

    /**
     * Símbolos de moedas comuns
     * @static
     * @readonly
     */
    static SIMBOLOS_MOEDA = {
        BRL: 'R$',
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        CAD: 'C$',
        AUD: 'A$',
        CHF: 'CHF',
        CNY: '¥',
        SEK: 'kr',
        NOK: 'kr',
        MXN: '$',
        INR: '₹',
        KRW: '₩',
        SGD: 'S$',
        HKD: 'HK$'
    };

    /**
     * Formata valor monetário
     * @param {number} valor - Valor a ser formatado
     * @param {Object} [opcoes={}] - Opções de formatação
     * @returns {string} Valor formatado
     */
    static formatarMoeda(valor, opcoes = {}) {
        const config = { ...this.CONFIG_PADRAO, ...opcoes };
        
        if (valor === null || valor === undefined || isNaN(valor)) {
            return this.formatarMoeda(0, config);
        }

        try {
            const formatter = new Intl.NumberFormat(config.locale, {
                style: 'currency',
                currency: config.moeda,
                minimumFractionDigits: config.casasDecimais,
                maximumFractionDigits: config.casasDecimais
            });

            let valorFormatado = formatter.format(Math.abs(valor));

            // Remover símbolo se solicitado
            if (!config.exibirSimbolo) {
                const simbolo = this.SIMBOLOS_MOEDA[config.moeda] || config.moeda;
                valorFormatado = valorFormatado.replace(simbolo, '').trim();
            }

            // Adicionar código da moeda se solicitado
            if (config.exibirCodigo && config.exibirSimbolo) {
                valorFormatado += ` ${config.moeda}`;
            }

            // Adicionar sinal de negativo se necessário
            if (valor < 0) {
                valorFormatado = `-${valorFormatado}`;
            }

            return valorFormatado;
        } catch (error) {
            console.error('Erro ao formatar moeda:', error);
            return `${config.moeda} ${valor.toFixed(config.casasDecimais)}`;
        }
    }

    /**
     * Formata valor monetário brasileiro
     * @param {number} valor - Valor a ser formatado
     * @param {boolean} [exibirSimbolo=true] - Se deve exibir o símbolo R$
     * @returns {string} Valor formatado em reais
     */
    static formatarReal(valor, exibirSimbolo = true) {
        return this.formatarMoeda(valor, {
            moeda: 'BRL',
            locale: 'pt-BR',
            exibirSimbolo
        });
    }

    /**
     * Formata valor monetário americano
     * @param {number} valor - Valor a ser formatado
     * @param {boolean} [exibirSimbolo=true] - Se deve exibir o símbolo $
     * @returns {string} Valor formatado em dólares
     */
    static formatarDolar(valor, exibirSimbolo = true) {
        return this.formatarMoeda(valor, {
            moeda: 'USD',
            locale: 'en-US',
            exibirSimbolo
        });
    }

    /**
     * Formata valor monetário europeu
     * @param {number} valor - Valor a ser formatado
     * @param {boolean} [exibirSimbolo=true] - Se deve exibir o símbolo €
     * @returns {string} Valor formatado em euros
     */
    static formatarEuro(valor, exibirSimbolo = true) {
        return this.formatarMoeda(valor, {
            moeda: 'EUR',
            locale: 'de-DE',
            exibirSimbolo
        });
    }

    /**
     * Remove formatação monetária e converte para número
     * @param {string} valorFormatado - Valor formatado como string
     * @returns {number} Valor numérico
     */
    static parseMoeda(valorFormatado) {
        if (typeof valorFormatado !== 'string') {
            return parseFloat(valorFormatado) || 0;
        }

        // Remover símbolos de moeda e espaços
        let valor = valorFormatado.trim();
        
        // Remover símbolos comuns
        Object.values(this.SIMBOLOS_MOEDA).forEach(simbolo => {
            valor = valor.replace(new RegExp(`\\${simbolo}`, 'g'), '');
        });

        // Remover códigos de moeda
        Object.keys(this.SIMBOLOS_MOEDA).forEach(codigo => {
            valor = valor.replace(new RegExp(codigo, 'g'), '');
        });

        // Remover espaços extras
        valor = valor.trim();

        // Detectar se é negativo
        const isNegativo = valor.startsWith('-') || valor.startsWith('(');
        valor = valor.replace(/^-|\(|\)$/g, '');

        // Normalizar separadores decimais
        // Se houver múltiplos pontos ou vírgulas, considerar o último como decimal
        const pontos = (valor.match(/\./g) || []).length;
        const virgulas = (valor.match(/,/g) || []).length;

        if (pontos > 1 && virgulas === 0) {
            // Formato: 1.234.567.89 (último ponto é decimal)
            const ultimoPonto = valor.lastIndexOf('.');
            valor = valor.substring(0, ultimoPonto).replace(/\./g, '') + 
                   '.' + valor.substring(ultimoPonto + 1);
        } else if (virgulas > 1 && pontos === 0) {
            // Formato: 1,234,567,89 (última vírgula é decimal)
            const ultimaVirgula = valor.lastIndexOf(',');
            valor = valor.substring(0, ultimaVirgula).replace(/,/g, '') + 
                   '.' + valor.substring(ultimaVirgula + 1);
        } else if (pontos === 1 && virgulas === 1) {
            // Determinar qual é o separador decimal
            const indicePonto = valor.indexOf('.');
            const indiceVirgula = valor.indexOf(',');
            
            if (indicePonto < indiceVirgula) {
                // Formato: 1.234,56 (vírgula é decimal)
                valor = valor.replace('.', '').replace(',', '.');
            } else {
                // Formato: 1,234.56 (ponto é decimal)
                valor = valor.replace(',', '');
            }
        } else if (virgulas === 1 && pontos === 0) {
            // Apenas vírgula - pode ser decimal ou milhares
            const partes = valor.split(',');
            if (partes[1] && partes[1].length <= 2) {
                // Provavelmente decimal: 123,45
                valor = valor.replace(',', '.');
            } else {
                // Provavelmente milhares: 1,234
                valor = valor.replace(',', '');
            }
        }

        // Remover caracteres não numéricos exceto ponto decimal
        valor = valor.replace(/[^\d.]/g, '');

        const numeroFinal = parseFloat(valor) || 0;
        return isNegativo ? -numeroFinal : numeroFinal;
    }

    /**
     * Valida se um valor monetário é válido
     * @param {string|number} valor - Valor a validar
     * @returns {boolean} True se é um valor monetário válido
     */
    static eValorValido(valor) {
        if (typeof valor === 'number') {
            return !isNaN(valor) && isFinite(valor);
        }

        if (typeof valor === 'string') {
            const numeroConvertido = this.parseMoeda(valor);
            return !isNaN(numeroConvertido) && isFinite(numeroConvertido);
        }

        return false;
    }

    /**
     * Arredonda valor monetário
     * @param {number} valor - Valor a arredondar
     * @param {number} [casasDecimais=2] - Número de casas decimais
     * @returns {number} Valor arredondado
     */
    static arredondar(valor, casasDecimais = 2) {
        if (isNaN(valor)) return 0;
        
        const multiplicador = Math.pow(10, casasDecimais);
        return Math.round(valor * multiplicador) / multiplicador;
    }

    /**
     * Calcula porcentagem de um valor
     * @param {number} valor - Valor base
     * @param {number} porcentagem - Porcentagem a calcular
     * @returns {number} Valor da porcentagem
     */
    static calcularPorcentagem(valor, porcentagem) {
        if (isNaN(valor) || isNaN(porcentagem)) return 0;
        return this.arredondar((valor * porcentagem) / 100);
    }

    /**
     * Adiciona porcentagem a um valor
     * @param {number} valor - Valor base
     * @param {number} porcentagem - Porcentagem a adicionar
     * @returns {number} Valor com porcentagem adicionada
     */
    static adicionarPorcentagem(valor, porcentagem) {
        if (isNaN(valor) || isNaN(porcentagem)) return valor || 0;
        const valorPorcentagem = this.calcularPorcentagem(valor, porcentagem);
        return this.arredondar(valor + valorPorcentagem);
    }

    /**
     * Remove porcentagem de um valor
     * @param {number} valor - Valor base
     * @param {number} porcentagem - Porcentagem a remover
     * @returns {number} Valor com porcentagem removida
     */
    static removerPorcentagem(valor, porcentagem) {
        if (isNaN(valor) || isNaN(porcentagem)) return valor || 0;
        const valorPorcentagem = this.calcularPorcentagem(valor, porcentagem);
        return this.arredondar(valor - valorPorcentagem);
    }

    /**
     * Calcula que porcentagem um valor representa de outro
     * @param {number} parte - Valor da parte
     * @param {number} total - Valor total
     * @returns {number} Porcentagem
     */
    static calcularPorcentagemDe(parte, total) {
        if (isNaN(parte) || isNaN(total) || total === 0) return 0;
        return this.arredondar((parte / total) * 100);
    }

    /**
     * Soma array de valores monetários
     * @param {number[]} valores - Array de valores
     * @returns {number} Soma dos valores
     */
    static somar(valores) {
        if (!Array.isArray(valores)) return 0;
        
        const soma = valores.reduce((acc, valor) => {
            const num = typeof valor === 'string' ? this.parseMoeda(valor) : (valor || 0);
            return acc + num;
        }, 0);
        
        return this.arredondar(soma);
    }

    /**
     * Calcula média de valores monetários
     * @param {number[]} valores - Array de valores
     * @returns {number} Média dos valores
     */
    static media(valores) {
        if (!Array.isArray(valores) || valores.length === 0) return 0;
        
        const soma = this.somar(valores);
        return this.arredondar(soma / valores.length);
    }

    /**
     * Encontra maior valor em array
     * @param {number[]} valores - Array de valores
     * @returns {number} Maior valor
     */
    static maximo(valores) {
        if (!Array.isArray(valores) || valores.length === 0) return 0;
        
        const numericos = valores.map(v => 
            typeof v === 'string' ? this.parseMoeda(v) : (v || 0)
        );
        
        return Math.max(...numericos);
    }

    /**
     * Encontra menor valor em array
     * @param {number[]} valores - Array de valores
     * @returns {number} Menor valor
     */
    static minimo(valores) {
        if (!Array.isArray(valores) || valores.length === 0) return 0;
        
        const numericos = valores.map(v => 
            typeof v === 'string' ? this.parseMoeda(v) : (v || 0)
        );
        
        return Math.min(...numericos);
    }

    /**
     * Converte valor monetário para extenso
     * @param {number} valor - Valor a converter
     * @returns {string} Valor por extenso
     */
    static paraExtenso(valor) {
        if (isNaN(valor)) return 'zero reais';

        const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
        const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
        const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
        const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

        const converterGrupo = (num) => {
            if (num === 0) return '';
            
            let resultado = '';
            const c = Math.floor(num / 100);
            const d = Math.floor((num % 100) / 10);
            const u = num % 10;

            if (c > 0) {
                if (num === 100) {
                    resultado += 'cem';
                } else {
                    resultado += centenas[c];
                }
            }

            if (d === 1) {
                if (resultado) resultado += ' e ';
                resultado += especiais[u];
            } else {
                if (d > 0) {
                    if (resultado) resultado += ' e ';
                    resultado += dezenas[d];
                }
                if (u > 0) {
                    if (resultado) resultado += ' e ';
                    resultado += unidades[u];
                }
            }

            return resultado;
        };

        const valorAbsoluto = Math.abs(valor);
        const parteInteira = Math.floor(valorAbsoluto);
        const centavos = Math.round((valorAbsoluto - parteInteira) * 100);

        let resultado = '';

        if (parteInteira === 0) {
            resultado = 'zero reais';
        } else {
            const milhoes = Math.floor(parteInteira / 1000000);
            const milhares = Math.floor((parteInteira % 1000000) / 1000);
            const unidades = parteInteira % 1000;

            if (milhoes > 0) {
                resultado += converterGrupo(milhoes);
                resultado += milhoes === 1 ? ' milhão' : ' milhões';
            }

            if (milhares > 0) {
                if (resultado) resultado += ' ';
                resultado += converterGrupo(milhares);
                resultado += ' mil';
            }

            if (unidades > 0) {
                if (resultado) resultado += ' ';
                resultado += converterGrupo(unidades);
            }

            resultado += parteInteira === 1 ? ' real' : ' reais';
        }

        if (centavos > 0) {
            resultado += ' e ' + converterGrupo(centavos);
            resultado += centavos === 1 ? ' centavo' : ' centavos';
        }

        return valor < 0 ? `menos ${resultado}` : resultado;
    }

    /**
     * Formata valor em formato compacto (K, M, B)
     * @param {number} valor - Valor a formatar
     * @param {number} [casasDecimais=1] - Casas decimais
     * @returns {string} Valor formatado compacto
     */
    static formatarCompacto(valor, casasDecimais = 1) {
        if (isNaN(valor)) return 'R$ 0';

        const abs = Math.abs(valor);
        const sinal = valor < 0 ? '-' : '';

        if (abs >= 1e9) {
            return `${sinal}R$ ${(abs / 1e9).toFixed(casasDecimais)}B`;
        } else if (abs >= 1e6) {
            return `${sinal}R$ ${(abs / 1e6).toFixed(casasDecimais)}M`;
        } else if (abs >= 1e3) {
            return `${sinal}R$ ${(abs / 1e3).toFixed(casasDecimais)}K`;
        } else {
            return this.formatarReal(valor);
        }
    }

    /**
     * Calcula juro simples
     * @param {number} capital - Capital inicial
     * @param {number} taxa - Taxa de juros (em %)
     * @param {number} tempo - Tempo em períodos
     * @returns {Object} Objeto com juro e montante
     */
    static juroSimples(capital, taxa, tempo) {
        if (isNaN(capital) || isNaN(taxa) || isNaN(tempo)) {
            return { juro: 0, montante: capital || 0 };
        }

        const juro = this.arredondar((capital * taxa * tempo) / 100);
        const montante = this.arredondar(capital + juro);

        return { juro, montante };
    }

    /**
     * Calcula juro composto
     * @param {number} capital - Capital inicial
     * @param {number} taxa - Taxa de juros (em %)
     * @param {number} tempo - Tempo em períodos
     * @returns {Object} Objeto com juro e montante
     */
    static juroComposto(capital, taxa, tempo) {
        if (isNaN(capital) || isNaN(taxa) || isNaN(tempo)) {
            return { juro: 0, montante: capital || 0 };
        }

        const montante = this.arredondar(capital * Math.pow(1 + taxa / 100, tempo));
        const juro = this.arredondar(montante - capital);

        return { juro, montante };
    }

    /**
     * Divide valor em parcelas
     * @param {number} valor - Valor total
     * @param {number} parcelas - Número de parcelas
     * @returns {Object} Objeto com informações das parcelas
     */
    static dividirParcelas(valor, parcelas) {
        if (isNaN(valor) || isNaN(parcelas) || parcelas <= 0) {
            return { valorParcela: 0, resto: 0, parcelas: [] };
        }

        const valorParcela = Math.floor((valor * 100) / parcelas) / 100;
        const resto = this.arredondar(valor - (valorParcela * parcelas));
        
        const parcelasArray = [];
        for (let i = 1; i <= parcelas; i++) {
            let valorDaParcela = valorParcela;
            
            // Adicionar resto na última parcela
            if (i === parcelas) {
                valorDaParcela += resto;
            }
            
            parcelasArray.push({
                numero: i,
                valor: this.arredondar(valorDaParcela),
                valorFormatado: this.formatarReal(valorDaParcela)
            });
        }

        return {
            valorParcela: this.arredondar(valorParcela),
            resto: resto,
            parcelas: parcelasArray
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.CurrencyUtils = CurrencyUtils;
}

// Exportar para Node.js se disponível
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CurrencyUtils;
}