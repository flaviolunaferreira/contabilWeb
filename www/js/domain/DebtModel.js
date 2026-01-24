
export class DebtModel {
    static SYSTEM = {
        SAC: 'SAC',     // Amortização Constante (Prestação decrescente)
        PRICE: 'PRICE'  // Prestação Fixa (Tabela Price)
    };

    constructor(data) {
        this.id = data.id || crypto.randomUUID();
        this.description = data.description;
        this.totalValue = this._validateInt(data.totalValue); // Valor contratado (Principal)
        this.monthlyRate = data.monthlyRate; // Taxa % a.m (Float permitido aqui pois é taxa, mas cálculos resultam int)
        this.termMonths = this._validateInt(data.termMonths); // Prazo total
        this.paidMonths = this._validateInt(data.paidMonths || 0); // Parcelas pagas
        this.system = data.system || DebtModel.SYSTEM.PRICE;
    }

    _validateInt(val) {
        if (!Number.isInteger(val) || val < 0) throw new Error('Valor deve ser inteiro positivo.');
        return val;
    }
}
