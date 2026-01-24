/**
 * @fileoverview Utilitários para manipulação de datas
 * @author Sistema de Controle Financeiro
 * @version 1.0.0
 */

/**
 * Classe utilitária para operações com datas
 * @class DateUtils
 */
class DateUtils {
    /**
     * Formatos de data predefinidos
     * @static
     * @readonly
     */
    static FORMATOS = {
        BR_DATE: 'dd/MM/yyyy',
        US_DATE: 'yyyy-MM-dd',
        BR_DATETIME: 'dd/MM/yyyy HH:mm:ss',
        ISO_DATE: 'yyyy-MM-ddTHH:mm:ss.sssZ'
    };

    /**
     * Nomes dos meses em português
     * @static
     * @readonly
     */
    static MESES = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    /**
     * Nomes dos meses abreviados
     * @static
     * @readonly
     */
    static MESES_ABREV = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    /**
     * Nomes dos dias da semana
     * @static
     * @readonly
     */
    static DIAS_SEMANA = [
        'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
        'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];

    /**
     * Nomes dos dias da semana abreviados
     * @static
     * @readonly
     */
    static DIAS_SEMANA_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    /**
     * Obtém a data atual
     * @returns {Date} Data atual
     */
    static hoje() {
        return new Date();
    }

    /**
     * Obtém a data atual no formato ISO (string)
     * @returns {string} Data atual em formato ISO
     */
    static hojeISO() {
        return new Date().toISOString();
    }

    /**
     * Obtém a data atual no formato YYYY-MM-DD
     * @returns {string} Data atual no formato brasileiro
     */
    static hojeFormatado() {
        return this.formatarData(new Date(), 'yyyy-MM-dd');
    }

    /**
     * Converte string para Date
     * @param {string} dataString - String da data
     * @param {string} [formato='auto'] - Formato da string de entrada
     * @returns {Date|null} Data convertida ou null se inválida
     */
    static parseData(dataString, formato = 'auto') {
        if (!dataString) return null;

        try {
            // Auto-detecção de formato
            if (formato === 'auto') {
                // ISO format: 2023-12-25T10:30:00.000Z
                if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dataString)) {
                    return new Date(dataString);
                }
                
                // YYYY-MM-DD format
                if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
                    return new Date(dataString + 'T00:00:00');
                }
                
                // DD/MM/YYYY format
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataString)) {
                    const [dia, mes, ano] = dataString.split('/');
                    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
                }
                
                // MM/DD/YYYY format
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataString) && formato === 'US') {
                    const [mes, dia, ano] = dataString.split('/');
                    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
                }
            }

            // Tentativa de parse direto
            const data = new Date(dataString);
            return isNaN(data.getTime()) ? null : data;
        } catch (error) {
            console.error('Erro ao fazer parse da data:', error);
            return null;
        }
    }

    /**
     * Formata data para string
     * @param {Date|string} data - Data a ser formatada
     * @param {string} [formato='dd/MM/yyyy'] - Formato de saída
     * @returns {string} Data formatada
     */
    static formatarData(data, formato = 'dd/MM/yyyy') {
        const dataObj = typeof data === 'string' ? this.parseData(data) : data;
        if (!dataObj) return '';

        const dia = String(dataObj.getDate()).padStart(2, '0');
        const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
        const ano = dataObj.getFullYear();
        const horas = String(dataObj.getHours()).padStart(2, '0');
        const minutos = String(dataObj.getMinutes()).padStart(2, '0');
        const segundos = String(dataObj.getSeconds()).padStart(2, '0');

        switch (formato) {
            case 'dd/MM/yyyy':
                return `${dia}/${mes}/${ano}`;
            case 'yyyy-MM-dd':
                return `${ano}-${mes}-${dia}`;
            case 'dd/MM/yyyy HH:mm':
                return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
            case 'dd/MM/yyyy HH:mm:ss':
                return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
            case 'MM/yyyy':
                return `${mes}/${ano}`;
            case 'MMM/yyyy':
                return `${this.MESES_ABREV[dataObj.getMonth()]}/${ano}`;
            case 'MMMM/yyyy':
                return `${this.MESES[dataObj.getMonth()]}/${ano}`;
            case 'dd/MMM':
                return `${dia}/${this.MESES_ABREV[dataObj.getMonth()]}`;
            case 'dd MMMM yyyy':
                return `${dia} de ${this.MESES[dataObj.getMonth()]} de ${ano}`;
            case 'EEEE, dd MMMM yyyy':
                return `${this.DIAS_SEMANA[dataObj.getDay()]}, ${dia} de ${this.MESES[dataObj.getMonth()]} de ${ano}`;
            default:
                return dataObj.toLocaleDateString('pt-BR');
        }
    }

    /**
     * Adiciona dias a uma data
     * @param {Date|string} data - Data base
     * @param {number} dias - Número de dias a adicionar (pode ser negativo)
     * @returns {Date} Nova data
     */
    static adicionarDias(data, dias) {
        const dataObj = typeof data === 'string' ? this.parseData(data) : new Date(data);
        const novaData = new Date(dataObj);
        novaData.setDate(novaData.getDate() + dias);
        return novaData;
    }

    /**
     * Adiciona meses a uma data
     * @param {Date|string} data - Data base
     * @param {number} meses - Número de meses a adicionar (pode ser negativo)
     * @returns {Date} Nova data
     */
    static adicionarMeses(data, meses) {
        const dataObj = typeof data === 'string' ? this.parseData(data) : new Date(data);
        const novaData = new Date(dataObj);
        novaData.setMonth(novaData.getMonth() + meses);
        return novaData;
    }

    /**
     * Adiciona anos a uma data
     * @param {Date|string} data - Data base
     * @param {number} anos - Número de anos a adicionar (pode ser negativo)
     * @returns {Date} Nova data
     */
    static adicionarAnos(data, anos) {
        const dataObj = typeof data === 'string' ? this.parseData(data) : new Date(data);
        const novaData = new Date(dataObj);
        novaData.setFullYear(novaData.getFullYear() + anos);
        return novaData;
    }

    /**
     * Calcula diferença entre duas datas em dias
     * @param {Date|string} data1 - Primeira data
     * @param {Date|string} data2 - Segunda data
     * @returns {number} Diferença em dias (positivo se data2 > data1)
     */
    static diferencaEmDias(data1, data2) {
        const d1 = typeof data1 === 'string' ? this.parseData(data1) : data1;
        const d2 = typeof data2 === 'string' ? this.parseData(data2) : data2;
        
        const umDia = 24 * 60 * 60 * 1000;
        return Math.round((d2.getTime() - d1.getTime()) / umDia);
    }

    /**
     * Calcula diferença entre duas datas em meses
     * @param {Date|string} data1 - Primeira data
     * @param {Date|string} data2 - Segunda data
     * @returns {number} Diferença em meses
     */
    static diferencaEmMeses(data1, data2) {
        const d1 = typeof data1 === 'string' ? this.parseData(data1) : data1;
        const d2 = typeof data2 === 'string' ? this.parseData(data2) : data2;
        
        return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
    }

    /**
     * Verifica se uma data está entre duas outras datas
     * @param {Date|string} data - Data a verificar
     * @param {Date|string} inicio - Data de início
     * @param {Date|string} fim - Data de fim
     * @param {boolean} [inclusivo=true] - Se inclui as datas limite
     * @returns {boolean} True se está no período
     */
    static estaEntreDatas(data, inicio, fim, inclusivo = true) {
        const d = typeof data === 'string' ? this.parseData(data) : data;
        const i = typeof inicio === 'string' ? this.parseData(inicio) : inicio;
        const f = typeof fim === 'string' ? this.parseData(fim) : fim;
        
        if (inclusivo) {
            return d >= i && d <= f;
        } else {
            return d > i && d < f;
        }
    }

    /**
     * Obtém o primeiro dia do mês
     * @param {Date|string} [data=hoje] - Data de referência
     * @returns {Date} Primeiro dia do mês
     */
    static primeiroDiaMes(data = this.hoje()) {
        const dataObj = typeof data === 'string' ? this.parseData(data) : data;
        return new Date(dataObj.getFullYear(), dataObj.getMonth(), 1);
    }

    /**
     * Obtém o último dia do mês
     * @param {Date|string} [data=hoje] - Data de referência
     * @returns {Date} Último dia do mês
     */
    static ultimoDiaMes(data = this.hoje()) {
        const dataObj = typeof data === 'string' ? this.parseData(data) : data;
        return new Date(dataObj.getFullYear(), dataObj.getMonth() + 1, 0);
    }

    /**
     * Verifica se é ano bissexto
     * @param {number} ano - Ano a verificar
     * @returns {boolean} True se é bissexto
     */
    static eAnoBissexto(ano) {
        return (ano % 4 === 0 && ano % 100 !== 0) || (ano % 400 === 0);
    }

    /**
     * Obtém número de dias no mês
     * @param {number} mes - Mês (1-12)
     * @param {number} ano - Ano
     * @returns {number} Número de dias no mês
     */
    static diasNoMes(mes, ano) {
        return new Date(ano, mes, 0).getDate();
    }

    /**
     * Verifica se duas datas são do mesmo dia
     * @param {Date|string} data1 - Primeira data
     * @param {Date|string} data2 - Segunda data
     * @returns {boolean} True se são do mesmo dia
     */
    static mesmoDia(data1, data2) {
        const d1 = typeof data1 === 'string' ? this.parseData(data1) : data1;
        const d2 = typeof data2 === 'string' ? this.parseData(data2) : data2;
        
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    /**
     * Verifica se duas datas são do mesmo mês
     * @param {Date|string} data1 - Primeira data
     * @param {Date|string} data2 - Segunda data
     * @returns {boolean} True se são do mesmo mês
     */
    static mesmoMes(data1, data2) {
        const d1 = typeof data1 === 'string' ? this.parseData(data1) : data1;
        const d2 = typeof data2 === 'string' ? this.parseData(data2) : data2;
        
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
    }

    /**
     * Obtém data relativa em texto (ontem, hoje, amanhã, etc.)
     * @param {Date|string} data - Data a verificar
     * @returns {string} Texto da data relativa
     */
    static dataRelativa(data) {
        const dataObj = typeof data === 'string' ? this.parseData(data) : data;
        const hoje = this.hoje();
        const diferenca = this.diferencaEmDias(hoje, dataObj);
        
        if (diferenca === 0) return 'Hoje';
        if (diferenca === 1) return 'Amanhã';
        if (diferenca === -1) return 'Ontem';
        if (diferenca > 1 && diferenca <= 7) return `Em ${diferenca} dias`;
        if (diferenca < -1 && diferenca >= -7) return `${Math.abs(diferenca)} dias atrás`;
        if (diferenca > 7) return `Em ${Math.ceil(diferenca / 7)} semana(s)`;
        if (diferenca < -7) return `${Math.ceil(Math.abs(diferenca) / 7)} semana(s) atrás`;
        
        return this.formatarData(dataObj);
    }

    /**
     * Valida se uma string é uma data válida
     * @param {string} dataString - String a validar
     * @returns {boolean} True se é uma data válida
     */
    static eDataValida(dataString) {
        const data = this.parseData(dataString);
        return data !== null && !isNaN(data.getTime());
    }

    /**
     * Obtém período personalizado
     * @param {string} periodo - Tipo do período ('hoje', 'semana', 'mes', 'trimestre', 'ano')
     * @param {Date} [dataRef=hoje] - Data de referência
     * @returns {Object} Objeto com dataInicio e dataFim
     */
    static obterPeriodo(periodo, dataRef = this.hoje()) {
        const hoje = dataRef;
        
        switch (periodo.toLowerCase()) {
            case 'hoje':
                return {
                    dataInicio: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()),
                    dataFim: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)
                };
                
            case 'ontem':
                const ontem = this.adicionarDias(hoje, -1);
                return {
                    dataInicio: new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate()),
                    dataFim: new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 23, 59, 59)
                };
                
            case 'semana':
                const inicioSemana = new Date(hoje);
                inicioSemana.setDate(hoje.getDate() - hoje.getDay());
                const fimSemana = new Date(inicioSemana);
                fimSemana.setDate(inicioSemana.getDate() + 6);
                fimSemana.setHours(23, 59, 59);
                return { dataInicio: inicioSemana, dataFim: fimSemana };
                
            case 'mes':
                return {
                    dataInicio: this.primeiroDiaMes(hoje),
                    dataFim: this.ultimoDiaMes(hoje)
                };
                
            case 'trimestre':
                const mesAtual = hoje.getMonth();
                const inicioTrimestre = Math.floor(mesAtual / 3) * 3;
                return {
                    dataInicio: new Date(hoje.getFullYear(), inicioTrimestre, 1),
                    dataFim: new Date(hoje.getFullYear(), inicioTrimestre + 3, 0)
                };
                
            case 'ano':
                return {
                    dataInicio: new Date(hoje.getFullYear(), 0, 1),
                    dataFim: new Date(hoje.getFullYear(), 11, 31)
                };
                
            default:
                return { dataInicio: hoje, dataFim: hoje };
        }
    }

    /**
     * Gera array de datas entre duas datas
     * @param {Date|string} inicio - Data de início
     * @param {Date|string} fim - Data de fim
     * @param {number} [incremento=1] - Incremento em dias
     * @returns {Date[]} Array de datas
     */
    static gerarRangeDatas(inicio, fim, incremento = 1) {
        const dataInicio = typeof inicio === 'string' ? this.parseData(inicio) : inicio;
        const dataFim = typeof fim === 'string' ? this.parseData(fim) : fim;
        const datas = [];
        
        let dataAtual = new Date(dataInicio);
        while (dataAtual <= dataFim) {
            datas.push(new Date(dataAtual));
            dataAtual = this.adicionarDias(dataAtual, incremento);
        }
        
        return datas;
    }

    /**
     * Calcula idade em anos
     * @param {Date|string} dataNascimento - Data de nascimento
     * @param {Date|string} [dataReferencia=hoje] - Data de referência
     * @returns {number} Idade em anos
     */
    static calcularIdade(dataNascimento, dataReferencia = this.hoje()) {
        const nascimento = typeof dataNascimento === 'string' ? this.parseData(dataNascimento) : dataNascimento;
        const referencia = typeof dataReferencia === 'string' ? this.parseData(dataReferencia) : dataReferencia;
        
        let idade = referencia.getFullYear() - nascimento.getFullYear();
        const mesAniversario = nascimento.getMonth();
        const diaAniversario = nascimento.getDate();
        
        if (referencia.getMonth() < mesAniversario || 
            (referencia.getMonth() === mesAniversario && referencia.getDate() < diaAniversario)) {
            idade--;
        }
        
        return idade;
    }

    /**
     * Formata duração em texto legível
     * @param {number} segundos - Duração em segundos
     * @returns {string} Duração formatada
     */
    static formatarDuracao(segundos) {
        const dias = Math.floor(segundos / (24 * 3600));
        const horas = Math.floor((segundos % (24 * 3600)) / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const segs = segundos % 60;
        
        const partes = [];
        if (dias > 0) partes.push(`${dias}d`);
        if (horas > 0) partes.push(`${horas}h`);
        if (minutos > 0) partes.push(`${minutos}m`);
        if (segs > 0 || partes.length === 0) partes.push(`${segs}s`);
        
        return partes.join(' ');
    }

    /**
     * Obtém timestamp Unix
     * @param {Date|string} [data=hoje] - Data para converter
     * @returns {number} Timestamp Unix
     */
    static timestamp(data = this.hoje()) {
        const dataObj = typeof data === 'string' ? this.parseData(data) : data;
        return Math.floor(dataObj.getTime() / 1000);
    }

    /**
     * Converte timestamp Unix para Date
     * @param {number} timestamp - Timestamp Unix
     * @returns {Date} Data convertida
     */
    static fromTimestamp(timestamp) {
        return new Date(timestamp * 1000);
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.DateUtils = DateUtils;
}

// Exportar para Node.js se disponível
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DateUtils;
}