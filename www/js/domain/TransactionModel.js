
/**
 * Modelo de Transação com validação estrita.
 * Garante que nunca salvaremos dados sujos no storage.
 */
export class TransactionModel {
    static TYPES = {
        INCOME: 'RECEITA',
        EXPENSE: 'DESPESA',
        TRANSFER: 'TRANSFERENCIA',
        INVESTMENT: 'APORTE_INVESTIMENTO'
    };

    static ESSENTIALITY = {
        ESSENTIAL: 'ESSENCIAL',     // Aluguel, Luz, Comida básica
        NECESSARY: 'NECESSARIO',    // Internet, Transporte
        SUPERFLUOUS: 'SUPERFLUO'    // Streaming extra, Delivery frequente
    };

    static PAYMENT_METHODS = {
        CASH: 'DINHEIRO',
        DEBIT: 'DEBITO',
        CREDIT: 'CREDITO'
    };

    static STATUS = {
        PENDING: 'PENDENTE',
        COMPLETED: 'CONCLUIDO',
        INVOICE_PAID: 'FATURA_PAGA' // Usado quando uma fatura é liquidada
    };

    constructor(data) {
        this.id = data.id || crypto.randomUUID();
        this.description = this._validateDescription(data.description);
        this.amount = this._validateAmount(data.amount); // Sempre em centavos
        this.type = this._validateEnum(data.type, TransactionModel.TYPES, 'Tipo');
        
        // Default para ESSENCIAL se não informado, para forçar classificação consciente depois ou assumir o pior
        // Mas a regra diz que é melhor ser explícito. Vamos aceitar opcional por enquanto ou defaultar.
        this.essentiality = data.essentiality || TransactionModel.ESSENTIALITY.NECESSARY;
        this.paymentMethod = this._validateEnum(data.paymentMethod, TransactionModel.PAYMENT_METHODS, 'Forma Pagamento');
        this.date = this._validateDate(data.date);
        this.categoryId = data.categoryId || 'OUTROS';
        
        // Campos opcionais mas validados se existirem
        this.cardId = (this.paymentMethod === TransactionModel.PAYMENT_METHODS.CREDIT) ? this._validateRequired(data.cardId, 'Cartão ID') : null;
        this.status = data.status || TransactionModel.STATUS.COMPLETED;
    }

    _validateDescription(desc) {
        if (!desc || typeof desc !== 'string' || desc.trim().length < 3) {
            throw new Error('Descrição inválida (min 3 caracteres).');
        }
        return desc.trim();
    }

    _validateAmount(val) {
        if (!Number.isInteger(val)) {
            throw new Error('Valor deve ser um inteiro (centavos).');
        }
        return val;
    }

    _validateEnum(val, enumObj, fieldName) {
        const values = Object.values(enumObj);
        if (!values.includes(val)) {
            throw new Error(`${fieldName} inválido: ${val}. Esperado: [${values.join(', ')}]`);
        }
        return val;
    }

    _validateDate(dateStr) {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
            throw new Error('Data inválida.');
        }
        return d.toISOString();
    }

    _validateRequired(val, fieldName) {
        if (!val) throw new Error(`${fieldName} é obrigatório.`);
        return val;
    }
}
