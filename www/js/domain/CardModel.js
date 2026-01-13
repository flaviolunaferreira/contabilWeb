
/**
 * Modelo de Cartão de Crédito.
 */
export class CardModel {
    constructor(data) {
        this.id = data.id || crypto.randomUUID();
        this.name = this._validateName(data.name);
        this.limit = this._validateAmount(data.limit); // Em centavos
        this.closingDay = this._validateDay(data.closingDay);
        this.dueDay = this._validateDay(data.dueDay);
        
        // Propriedades opcionais (sufixadas para não quebrar contrato, mas poderiamos validar também)
        this.color = data.color || '#0066CC';
        this.icon = data.icon || '💳';
        this.active = data.active !== undefined ? data.active : true;
    }

    _validateName(name) {
        if (!name || name.trim().length === 0) throw new Error('Nome do cartão inválido.');
        return name.trim();
    }

    _validateAmount(val) {
        if (!Number.isInteger(val) || val < 0) throw new Error('Limite deve ser inteiro positivo (centavos).');
        return val;
    }

    _validateDay(day) {
        const d = parseInt(day, 10);
        if (isNaN(d) || d < 1 || d > 31) throw new Error('Dia inválido (1-31).');
        return d;
    }
}
