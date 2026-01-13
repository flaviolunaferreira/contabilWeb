import { TransactionModel } from './TransactionModel.js';

/**
 * Motor Financeiro - O Cérebro Contábil
 * Responsável por toda aritmética financeira. Trabalha EXCLUSIVAMENTE com números inteiros.
 */
export class FinancialEngine {
    
    /**
     * Calcula o panorama financeiro completo.
     * @param {Array} transactions Lista de transações (objetos crus ou instances)
     * @returns {Object} { realBalance, liabilities, netWorth } (Tudo em centavos)
     */
    static compute(transactions) {
        let realBalance = 0; // Regime de Caixa
        let liabilities = 0; // Passivo Circulante (Faturas em aberto)
        let investedAmount = 0; // Ativos Investidos

        const validTransactions = this._ensureModels(transactions);

        for (const tx of validTransactions) {
            
            // 1. Regime de Caixa (Impacto imediato no saldo)
            if (this._affectsCashFlow(tx)) {
                if (tx.type === TransactionModel.TYPES.INCOME) {
                    realBalance += tx.amount;
                } else if (tx.type === TransactionModel.TYPES.EXPENSE) {
                    realBalance -= tx.amount;
                } else if (tx.type === TransactionModel.TYPES.INVESTMENT) {
                    // Sai do Caixa...
                    realBalance -= tx.amount;
                    // ... Mas vira Patrimônio
                    investedAmount += tx.amount;
                }
            }

            // 2. Regime de Competência (Passivo acumulado no cartão)
            if (this._isOpenCreditExpense(tx)) {
                liabilities += tx.amount;
            }
        }

        return {
            realBalance,      
            liabilities,
            investedAmount,
            netWorth: (realBalance + investedAmount) - liabilities 
        };
    }

    /**
     * Análise de Sobrevivência (Runway)
     * @param {Array} transactions Histórico recente
     * @param {number} currentBalance Saldo atual (centavos)
     * @returns {Object} { monthlyBurnRate, daysOfSurvival }
     */
    static analyzeHealth(transactions, currentBalance) {
        // Filtra despesas essenciais dos últimos 30 dias (simplificado para MVP usa todos)
        // Para maior precisão, o ideal seria pegar a média dos últimos 3 meses.
        // Aqui vamos somar todas as despesas essenciais do cohorte fornecido e dividir pelo periodo estimado.
        
        const essentialExpenses = transactions.filter(t => 
            (t.type === TransactionModel.TYPES.EXPENSE) &&
            (t.essentiality === TransactionModel.ESSENTIALITY.ESSENTIAL)
        );

        if (essentialExpenses.length === 0) return { monthlyBurnRate: 0, daysOfSurvival: 9999 };

        // Estimativa simples: Soma total / Número de meses distintos encontrados
        // Ou mais simples: Soma total como "Burn Rate" se o array for mensal.
        // Vamos assumir que 'transactions' passadas são do mês corrente ou geral.
        // Para ser robusto, calculamos a média diária com base no range de datas.
        
        const dates = essentialExpenses.map(t => new Date(t.date).getTime());
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        const diffDays = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24));
        
        const totalEssential = essentialExpenses.reduce((sum, t) => sum + t.amount, 0);
        const dailyBurnEntry = totalEssential / diffDays; // Gasto por dia

        // Se dailyBurn for muito baixo (ex: só tem 1 dia de dados), pode distorcer. 
        // Fallback: se diffDays < 15, assume que o totalEssential é o gasto de meio mês? Não, perigoso.
        // Vamos usar o saldo atual dividido pelo gasto diário calculado.
        
        const daysOfSurvival = dailyBurnEntry > 0 ? Math.floor(currentBalance / dailyBurnEntry) : 9999;

        return {
            monthlyBurnRate: Math.round(dailyBurnEntry * 30),
            daysOfSurvival
        };
    }

    /**
     * Define se a transação impacta o "Bolso" agora.
     * - Dinheiro/Débito: Sim.
     * - Fatura Paga: Sim (é a saída do dinheiro para pagar o banco).
     * - Crédito (Compra): Não (só vira saída de caixa quando paga a fatura).
     */
    static _affectsCashFlow(tx) {
        // Se já está pago (Dinheiro/Debito)
        const isCashOrDebit = [
            TransactionModel.PAYMENT_METHODS.CASH, 
            TransactionModel.PAYMENT_METHODS.DEBIT
        ].includes(tx.paymentMethod);

        // CORREÇÃO SPRINT 3: Itens de fatura paga NÃO afetam o caixa diretamente.
        // O que afeta o caixa é a transação de "Pagamento de Fatura" (que será DEBITO).
        // Portanto, removemos a verificação de INVOICE_PAID aqui para evitar contagem dupla.

        return isCashOrDebit;
    }

    /**
     * Define se é uma dívida ativa (Gasto no crédito ainda não pago).
     */
    static _isOpenCreditExpense(tx) {
        return tx.type === TransactionModel.TYPES.EXPENSE &&
               tx.paymentMethod === TransactionModel.PAYMENT_METHODS.CREDIT &&
               tx.status !== TransactionModel.STATUS.INVOICE_PAID && 
               tx.status !== TransactionModel.STATUS.COMPLETED; // Assumindo que COMPLETED no crédito significa "já conciliado/pago" em modelos avançados, mas por hora foca no INVOICE_PAID.
               // Ajuste fino: Na sprint 3 definiremos melhor o ciclo de vida do crédito.
               // Por enquanto: Se é Crédito e não foi marcado como pago via fatura, é passivo.
    }

    static _ensureModels(transactions) {
        if (!Array.isArray(transactions)) return [];
        // Filtra nulos e garante que temos acesso às propriedades
        return transactions.filter(t => t); 
    }

    // Utilitário para formatar visualização (apenas para UI, não usado em cálculo interno)
    static formatCurrency(cents) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(cents / 100);
    }
}
