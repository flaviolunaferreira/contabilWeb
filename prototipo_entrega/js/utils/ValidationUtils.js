/**
 * @fileoverview Utilitários para validação de dados
 * @author Sistema de Controle Financeiro
 * @version 1.0.0
 */

/**
 * Classe utilitária para validações
 * @class ValidationUtils
 */
class ValidationUtils {
    /**
     * Padrões de regex comuns
     * @static
     * @readonly
     */
    static PATTERNS = {
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/,
        CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/,
        TELEFONE: /^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/,
        CEP: /^\d{5}-?\d{3}$/,
        URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
        SENHA_FORTE: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        SOMENTE_NUMEROS: /^\d+$/,
        SOMENTE_LETRAS: /^[a-zA-ZÀ-ÿ\s]+$/,
        ALFANUMERICO: /^[a-zA-Z0-9À-ÿ\s]+$/
    };

    /**
     * Mensagens de erro padrão
     * @static
     * @readonly
     */
    static MENSAGENS = {
        REQUIRED: 'Este campo é obrigatório',
        EMAIL: 'Email inválido',
        CPF: 'CPF inválido',
        CNPJ: 'CNPJ inválido',
        TELEFONE: 'Telefone inválido',
        CEP: 'CEP inválido',
        URL: 'URL inválida',
        MIN_LENGTH: 'Deve ter pelo menos {min} caracteres',
        MAX_LENGTH: 'Deve ter no máximo {max} caracteres',
        MIN_VALUE: 'Valor deve ser maior ou igual a {min}',
        MAX_VALUE: 'Valor deve ser menor ou igual a {max}',
        NUMERIC: 'Deve conter apenas números',
        ALPHA: 'Deve conter apenas letras',
        ALPHANUMERIC: 'Deve conter apenas letras e números',
        PASSWORD_STRONG: 'Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo',
        DATE: 'Data inválida',
        DATE_FUTURE: 'Data deve ser futura',
        DATE_PAST: 'Data deve ser passada',
        MONEY: 'Valor monetário inválido'
    };

    /**
     * Valida se um valor não está vazio
     * @param {any} valor - Valor a validar
     * @returns {boolean} True se não está vazio
     */
    static required(valor) {
        if (valor === null || valor === undefined) return false;
        if (typeof valor === 'string') return valor.trim().length > 0;
        if (Array.isArray(valor)) return valor.length > 0;
        if (typeof valor === 'object') return Object.keys(valor).length > 0;
        return true;
    }

    /**
     * Valida email
     * @param {string} email - Email a validar
     * @returns {boolean} True se é um email válido
     */
    static email(email) {
        if (!email || typeof email !== 'string') return false;
        return this.PATTERNS.EMAIL.test(email.trim());
    }

    /**
     * Valida CPF
     * @param {string} cpf - CPF a validar
     * @returns {boolean} True se é um CPF válido
     */
    static cpf(cpf) {
        if (!cpf || typeof cpf !== 'string') return false;
        
        // Remove formatação
        const cpfLimpo = cpf.replace(/\D/g, '');
        
        // Verifica se tem 11 dígitos
        if (cpfLimpo.length !== 11) return false;
        
        // Verifica se não são todos os dígitos iguais
        if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
        
        // Validação dos dígitos verificadores
        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(cpfLimpo[i]) * (10 - i);
        }
        
        let digito1 = 11 - (soma % 11);
        if (digito1 >= 10) digito1 = 0;
        
        if (parseInt(cpfLimpo[9]) !== digito1) return false;
        
        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(cpfLimpo[i]) * (11 - i);
        }
        
        let digito2 = 11 - (soma % 11);
        if (digito2 >= 10) digito2 = 0;
        
        return parseInt(cpfLimpo[10]) === digito2;
    }

    /**
     * Valida CNPJ
     * @param {string} cnpj - CNPJ a validar
     * @returns {boolean} True se é um CNPJ válido
     */
    static cnpj(cnpj) {
        if (!cnpj || typeof cnpj !== 'string') return false;
        
        // Remove formatação
        const cnpjLimpo = cnpj.replace(/\D/g, '');
        
        // Verifica se tem 14 dígitos
        if (cnpjLimpo.length !== 14) return false;
        
        // Verifica se não são todos os dígitos iguais
        if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false;
        
        // Validação do primeiro dígito verificador
        const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        let soma = 0;
        
        for (let i = 0; i < 12; i++) {
            soma += parseInt(cnpjLimpo[i]) * pesos1[i];
        }
        
        let digito1 = soma % 11;
        digito1 = digito1 < 2 ? 0 : 11 - digito1;
        
        if (parseInt(cnpjLimpo[12]) !== digito1) return false;
        
        // Validação do segundo dígito verificador
        const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        soma = 0;
        
        for (let i = 0; i < 13; i++) {
            soma += parseInt(cnpjLimpo[i]) * pesos2[i];
        }
        
        let digito2 = soma % 11;
        digito2 = digito2 < 2 ? 0 : 11 - digito2;
        
        return parseInt(cnpjLimpo[13]) === digito2;
    }

    /**
     * Valida telefone brasileiro
     * @param {string} telefone - Telefone a validar
     * @returns {boolean} True se é um telefone válido
     */
    static telefone(telefone) {
        if (!telefone || typeof telefone !== 'string') return false;
        
        // Remove formatação
        const telefoneLimpo = telefone.replace(/\D/g, '');
        
        // Aceita 10 ou 11 dígitos (com ou sem 9 no celular)
        if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) return false;
        
        // Verifica se não são todos os dígitos iguais
        if (/^(\d)\1+$/.test(telefoneLimpo)) return false;
        
        return true;
    }

    /**
     * Valida CEP brasileiro
     * @param {string} cep - CEP a validar
     * @returns {boolean} True se é um CEP válido
     */
    static cep(cep) {
        if (!cep || typeof cep !== 'string') return false;
        return this.PATTERNS.CEP.test(cep.trim());
    }

    /**
     * Valida URL
     * @param {string} url - URL a validar
     * @returns {boolean} True se é uma URL válida
     */
    static url(url) {
        if (!url || typeof url !== 'string') return false;
        return this.PATTERNS.URL.test(url.trim());
    }

    /**
     * Valida tamanho mínimo
     * @param {string} valor - Valor a validar
     * @param {number} min - Tamanho mínimo
     * @returns {boolean} True se atende ao mínimo
     */
    static minLength(valor, min) {
        if (!valor || typeof valor !== 'string') return false;
        return valor.trim().length >= min;
    }

    /**
     * Valida tamanho máximo
     * @param {string} valor - Valor a validar
     * @param {number} max - Tamanho máximo
     * @returns {boolean} True se não excede o máximo
     */
    static maxLength(valor, max) {
        if (!valor || typeof valor !== 'string') return true;
        return valor.trim().length <= max;
    }

    /**
     * Valida valor mínimo
     * @param {number} valor - Valor a validar
     * @param {number} min - Valor mínimo
     * @returns {boolean} True se é maior ou igual ao mínimo
     */
    static minValue(valor, min) {
        const num = parseFloat(valor);
        return !isNaN(num) && num >= min;
    }

    /**
     * Valida valor máximo
     * @param {number} valor - Valor a validar
     * @param {number} max - Valor máximo
     * @returns {boolean} True se é menor ou igual ao máximo
     */
    static maxValue(valor, max) {
        const num = parseFloat(valor);
        return !isNaN(num) && num <= max;
    }

    /**
     * Valida se contém apenas números
     * @param {string} valor - Valor a validar
     * @returns {boolean} True se contém apenas números
     */
    static numeric(valor) {
        if (!valor || typeof valor !== 'string') return false;
        return this.PATTERNS.SOMENTE_NUMEROS.test(valor.trim());
    }

    /**
     * Valida se contém apenas letras
     * @param {string} valor - Valor a validar
     * @returns {boolean} True se contém apenas letras
     */
    static alpha(valor) {
        if (!valor || typeof valor !== 'string') return false;
        return this.PATTERNS.SOMENTE_LETRAS.test(valor.trim());
    }

    /**
     * Valida se contém apenas letras e números
     * @param {string} valor - Valor a validar
     * @returns {boolean} True se contém apenas letras e números
     */
    static alphanumeric(valor) {
        if (!valor || typeof valor !== 'string') return false;
        return this.PATTERNS.ALFANUMERICO.test(valor.trim());
    }

    /**
     * Valida senha forte
     * @param {string} senha - Senha a validar
     * @returns {boolean} True se é uma senha forte
     */
    static passwordStrong(senha) {
        if (!senha || typeof senha !== 'string') return false;
        return this.PATTERNS.SENHA_FORTE.test(senha);
    }

    /**
     * Valida data
     * @param {string|Date} data - Data a validar
     * @returns {boolean} True se é uma data válida
     */
    static date(data) {
        if (!data) return false;
        
        let dataObj;
        if (typeof data === 'string') {
            // Tenta fazer parse da data
            if (window.DateUtils && window.DateUtils.parseData) {
                dataObj = window.DateUtils.parseData(data);
            } else {
                dataObj = new Date(data);
            }
        } else {
            dataObj = data;
        }
        
        return dataObj instanceof Date && !isNaN(dataObj.getTime());
    }

    /**
     * Valida se data é futura
     * @param {string|Date} data - Data a validar
     * @returns {boolean} True se é futura
     */
    static dateFuture(data) {
        if (!this.date(data)) return false;
        
        const dataObj = typeof data === 'string' ? new Date(data) : data;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        dataObj.setHours(0, 0, 0, 0);
        
        return dataObj > hoje;
    }

    /**
     * Valida se data é passada
     * @param {string|Date} data - Data a validar
     * @returns {boolean} True se é passada
     */
    static datePast(data) {
        if (!this.date(data)) return false;
        
        const dataObj = typeof data === 'string' ? new Date(data) : data;
        const hoje = new Date();
        hoje.setHours(23, 59, 59, 999);
        
        return dataObj < hoje;
    }

    /**
     * Valida valor monetário
     * @param {string|number} valor - Valor a validar
     * @returns {boolean} True se é um valor monetário válido
     */
    static money(valor) {
        if (typeof valor === 'number') {
            return !isNaN(valor) && isFinite(valor);
        }
        
        if (typeof valor === 'string') {
            if (window.CurrencyUtils && window.CurrencyUtils.eValorValido) {
                return window.CurrencyUtils.eValorValido(valor);
            }
            
            // Validação básica se CurrencyUtils não estiver disponível
            const valorLimpo = valor.replace(/[^\d,.-]/g, '');
            const numero = parseFloat(valorLimpo.replace(',', '.'));
            return !isNaN(numero) && isFinite(numero);
        }
        
        return false;
    }

    /**
     * Valida se duas senhas são iguais
     * @param {string} senha1 - Primeira senha
     * @param {string} senha2 - Segunda senha
     * @returns {boolean} True se são iguais
     */
    static passwordMatch(senha1, senha2) {
        return senha1 === senha2;
    }

    /**
     * Valida idade mínima
     * @param {string|Date} dataNascimento - Data de nascimento
     * @param {number} idadeMinima - Idade mínima requerida
     * @returns {boolean} True se atende à idade mínima
     */
    static minAge(dataNascimento, idadeMinima) {
        if (!this.date(dataNascimento)) return false;
        
        const nascimento = typeof dataNascimento === 'string' ? new Date(dataNascimento) : dataNascimento;
        const hoje = new Date();
        
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mesNascimento = nascimento.getMonth();
        const diaNascimento = nascimento.getDate();
        
        if (hoje.getMonth() < mesNascimento || 
            (hoje.getMonth() === mesNascimento && hoje.getDate() < diaNascimento)) {
            idade--;
        }
        
        return idade >= idadeMinima;
    }

    /**
     * Valida array de valores
     * @param {Array} array - Array a validar
     * @param {Function} validador - Função de validação para cada item
     * @returns {boolean} True se todos os itens são válidos
     */
    static arrayValid(array, validador) {
        if (!Array.isArray(array)) return false;
        return array.every(item => validador(item));
    }

    /**
     * Valida objeto contra esquema
     * @param {Object} objeto - Objeto a validar
     * @param {Object} esquema - Esquema de validação
     * @returns {Object} Resultado da validação
     */
    static validateObject(objeto, esquema) {
        const resultado = {
            valid: true,
            errors: {}
        };

        for (const campo in esquema) {
            const regras = esquema[campo];
            const valor = objeto[campo];
            const errosCampo = [];

            // Verifica cada regra do campo
            for (const regra in regras) {
                const parametro = regras[regra];
                let valido = true;
                let mensagem = '';

                switch (regra) {
                    case 'required':
                        if (parametro) {
                            valido = this.required(valor);
                            mensagem = this.MENSAGENS.REQUIRED;
                        }
                        break;

                    case 'email':
                        if (parametro && valor) {
                            valido = this.email(valor);
                            mensagem = this.MENSAGENS.EMAIL;
                        }
                        break;

                    case 'cpf':
                        if (parametro && valor) {
                            valido = this.cpf(valor);
                            mensagem = this.MENSAGENS.CPF;
                        }
                        break;

                    case 'cnpj':
                        if (parametro && valor) {
                            valido = this.cnpj(valor);
                            mensagem = this.MENSAGENS.CNPJ;
                        }
                        break;

                    case 'telefone':
                        if (parametro && valor) {
                            valido = this.telefone(valor);
                            mensagem = this.MENSAGENS.TELEFONE;
                        }
                        break;

                    case 'cep':
                        if (parametro && valor) {
                            valido = this.cep(valor);
                            mensagem = this.MENSAGENS.CEP;
                        }
                        break;

                    case 'url':
                        if (parametro && valor) {
                            valido = this.url(valor);
                            mensagem = this.MENSAGENS.URL;
                        }
                        break;

                    case 'minLength':
                        if (valor) {
                            valido = this.minLength(valor, parametro);
                            mensagem = this.MENSAGENS.MIN_LENGTH.replace('{min}', parametro);
                        }
                        break;

                    case 'maxLength':
                        if (valor) {
                            valido = this.maxLength(valor, parametro);
                            mensagem = this.MENSAGENS.MAX_LENGTH.replace('{max}', parametro);
                        }
                        break;

                    case 'minValue':
                        if (valor !== null && valor !== undefined) {
                            valido = this.minValue(valor, parametro);
                            mensagem = this.MENSAGENS.MIN_VALUE.replace('{min}', parametro);
                        }
                        break;

                    case 'maxValue':
                        if (valor !== null && valor !== undefined) {
                            valido = this.maxValue(valor, parametro);
                            mensagem = this.MENSAGENS.MAX_VALUE.replace('{max}', parametro);
                        }
                        break;

                    case 'numeric':
                        if (parametro && valor) {
                            valido = this.numeric(valor);
                            mensagem = this.MENSAGENS.NUMERIC;
                        }
                        break;

                    case 'alpha':
                        if (parametro && valor) {
                            valido = this.alpha(valor);
                            mensagem = this.MENSAGENS.ALPHA;
                        }
                        break;

                    case 'alphanumeric':
                        if (parametro && valor) {
                            valido = this.alphanumeric(valor);
                            mensagem = this.MENSAGENS.ALPHANUMERIC;
                        }
                        break;

                    case 'passwordStrong':
                        if (parametro && valor) {
                            valido = this.passwordStrong(valor);
                            mensagem = this.MENSAGENS.PASSWORD_STRONG;
                        }
                        break;

                    case 'date':
                        if (parametro && valor) {
                            valido = this.date(valor);
                            mensagem = this.MENSAGENS.DATE;
                        }
                        break;

                    case 'dateFuture':
                        if (parametro && valor) {
                            valido = this.dateFuture(valor);
                            mensagem = this.MENSAGENS.DATE_FUTURE;
                        }
                        break;

                    case 'datePast':
                        if (parametro && valor) {
                            valido = this.datePast(valor);
                            mensagem = this.MENSAGENS.DATE_PAST;
                        }
                        break;

                    case 'money':
                        if (parametro && valor) {
                            valido = this.money(valor);
                            mensagem = this.MENSAGENS.MONEY;
                        }
                        break;

                    case 'custom':
                        if (typeof parametro === 'function') {
                            const resultadoCustom = parametro(valor, objeto);
                            valido = resultadoCustom === true || (typeof resultadoCustom === 'object' && resultadoCustom.valid);
                            mensagem = typeof resultadoCustom === 'object' ? resultadoCustom.message : 'Validação customizada falhou';
                        }
                        break;
                }

                if (!valido) {
                    errosCampo.push(mensagem);
                }
            }

            if (errosCampo.length > 0) {
                resultado.valid = false;
                resultado.errors[campo] = errosCampo;
            }
        }

        return resultado;
    }

    /**
     * Sanitiza string removendo caracteres especiais
     * @param {string} str - String a sanitizar
     * @returns {string} String sanitizada
     */
    static sanitizeString(str) {
        if (!str || typeof str !== 'string') return '';
        
        return str
            .trim()
            .replace(/[<>]/g, '') // Remove < e >
            .replace(/javascript:/gi, '') // Remove javascript:
            .replace(/on\w+=/gi, ''); // Remove eventos on*=
    }

    /**
     * Escapa HTML para prevenir XSS
     * @param {string} str - String a escapar
     * @returns {string} String escapada
     */
    static escapeHtml(str) {
        if (!str || typeof str !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Valida força da senha e retorna pontuação
     * @param {string} senha - Senha a avaliar
     * @returns {Object} Objeto com força e detalhes
     */
    static passwordStrength(senha) {
        if (!senha || typeof senha !== 'string') {
            return { strength: 0, level: 'Muito fraca', details: [] };
        }

        let pontos = 0;
        const detalhes = [];

        // Comprimento
        if (senha.length >= 8) {
            pontos += 25;
            detalhes.push('Comprimento adequado');
        } else {
            detalhes.push('Muito curta (mínimo 8 caracteres)');
        }

        // Letras minúsculas
        if (/[a-z]/.test(senha)) {
            pontos += 25;
            detalhes.push('Contém letras minúsculas');
        } else {
            detalhes.push('Faltam letras minúsculas');
        }

        // Letras maiúsculas
        if (/[A-Z]/.test(senha)) {
            pontos += 25;
            detalhes.push('Contém letras maiúsculas');
        } else {
            detalhes.push('Faltam letras maiúsculas');
        }

        // Números
        if (/\d/.test(senha)) {
            pontos += 15;
            detalhes.push('Contém números');
        } else {
            detalhes.push('Faltam números');
        }

        // Símbolos
        if (/[@$!%*?&]/.test(senha)) {
            pontos += 10;
            detalhes.push('Contém símbolos especiais');
        } else {
            detalhes.push('Faltam símbolos especiais');
        }

        // Determinar nível
        let nivel;
        if (pontos < 30) nivel = 'Muito fraca';
        else if (pontos < 50) nivel = 'Fraca';
        else if (pontos < 75) nivel = 'Média';
        else if (pontos < 100) nivel = 'Forte';
        else nivel = 'Muito forte';

        return {
            strength: pontos,
            level: nivel,
            details: detalhes
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.ValidationUtils = ValidationUtils;
}

// Exportar para Node.js se disponível
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationUtils;
}