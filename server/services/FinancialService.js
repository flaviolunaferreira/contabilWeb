const knexConfig = require('../knexfile');
const knex = require('knex')(knexConfig.development);

class FinancialService {
    
    /**
     * Calcula o Balanço Geral (Receitas - Despesas - Faturas Pagas) e Passivo
     */
    static async getSummary() {
        // 1. Receitas (INCOME)
        const incomeResult = await knex('transacoes')
            .sum('amount as total')
            .where('type', 'INCOME')
            .first();
        const totalIncome = BigInt(incomeResult.total || 0);

        // 2. Despesas Débito (EXPENSE + Payment Method DEBIT) 
        // Assumindo que "Débito" implica compras diretas ou pagamentos de contas, não crédito
        // Como o schema atual não tem 'payment_method' explicitamente, vamos assumir que 
        // transações com category 'PAYMENT_INVOICE' ou sem cardId são débitos de conta.
        // Pela regra do prompt: "Despesas Débito - Faturas Pagas"
        
        // Vamos somar todas as despesas que NÃO SÃO Crédito Pendente
        // Se cardId existe e status != 'INVOICE_PAID' -> É dívida de cartão (não sai do saldo agora)
        // Se cardId é null -> É débito direto
        // Se category == 'PAYMENT_INVOICE' -> É o pagamento da fatura (sai do saldo)
        
        const debitExpensesResult = await knex('transacoes')
            .sum('amount as total')
            .where('type', 'EXPENSE')
            .whereNull('cardId') // Débito direto
            .first();
        const totalDebit = BigInt(debitExpensesResult.total || 0);

        const paidInvoicesResult = await knex('transacoes')
            .sum('amount as total')
            .where('type', 'EXPENSE')
            .where('category', 'PAYMENT_INVOICE')
            .first();
        const totalPaidInvoices = BigInt(paidInvoicesResult.total || 0);

        // Saldo Disponível = Receitas - (Débitos + Pagamentos Fatura)
        const availableBalance = totalIncome - (totalDebit + totalPaidInvoices);

        // 3. Passivo (Liabilities)
        // Despesas Crédito Pendentes (cardId existe e status != 'INVOICE_PAID')
        const creditPendingResult = await knex('transacoes')
            .sum('amount as total')
            .where('type', 'EXPENSE')
            .whereNotNull('cardId')
            .whereNot('status', 'INVOICE_PAID') // Status 'PENDING' ou null
            .first();
        
        const pendingCredit = BigInt(creditPendingResult.total || 0);

        // Saldo Devedor Financiamentos (tabela dividas)
        // O campo saldo_devedor_atual deve ser atualizado periodicamente,
        // mas aqui somamos o que está registrado
        const loansResult = await knex('dividas')
            .sum('saldo_devedor_atual as total')
            .first();
        
        const loansDebt = BigInt(loansResult.total || 0);

        const liabilities = pendingCredit + loansDebt;

        return {
            availableBalance: availableBalance.toString(),
            liabilities: liabilities.toString(),
            breakdown: {
                income: totalIncome.toString(),
                debitExpenses: totalDebit.toString(),
                paidInvoices: totalPaidInvoices.toString(),
                pendingCredit: pendingCredit.toString(),
                loans: loansDebt.toString()
            }
        };
    }
}

module.exports = FinancialService;
