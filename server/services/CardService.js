const knexConfig = require('../knexfile');
const knex = require('knex')(knexConfig.development);
const crypto = require('crypto'); // Para gerar ID se necessário

class CardService {

    /**
     * Liquida uma fatura de cartão de crédito atomicamente.
     * @param {string} cardId ID do Cartão
     * @param {number} month Mês (1-12)
     * @param {number} year Ano (YYYY)
     */
    static async liquidarFatura(cardId, month, year) {
        // transaction é o objeto de transação do Knex
        return await knex.transaction(async (trx) => {
            
            // 1. Definir período da fatura
            // Assumindo fechamento no dia X. Para simplificar, pegamos transações do mês calendário
            // TODO: Pegar dia de fechamento do cartão. 
            // MVP: Considera transações do mês solicitado que ainda estão PENDING.
            
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Último dia do mês

            // 2. Buscar Transações a Liquidar
            const transacoesParaLiquidar = await trx('transacoes')
                .where('cardId', cardId)
                .where('status', '!=', 'INVOICE_PAID')
                .where('type', 'EXPENSE')
                .whereBetween('date', [startDate, endDate]);
            
            if (transacoesParaLiquidar.length === 0) {
                throw new Error('Nenhuma transação pendente encontrada para este período.');
            }

            const totalAmount = transacoesParaLiquidar.reduce((sum, t) => sum + BigInt(t.amount), BigInt(0));

            // 3. Atualizar Status das Transações (Step 1)
            await trx('transacoes')
                .whereIn('id', transacoesParaLiquidar.map(t => t.id))
                .update({ status: 'INVOICE_PAID' });

            // 4. Gerar Despesa de Pagamento (Step 2)
            const paymentTransaction = {
                id: crypto.randomUUID(),
                description: `Pagamento Fatura ${month}/${year}`,
                amount: totalAmount.toString(), // Converter BigInt para string p/ insert
                date: new Date().toISOString().split('T')[0], // Data do pagamento = Hoje
                type: 'EXPENSE',
                category: 'PAYMENT_INVOICE',
                essentiality: 'ESSENTIAL', // Pagamento de dívida é essencial
                cardId: null, // Sai da conta corrente
                status: 'PAID',
                created_at: new Date(),
                updated_at: new Date()
            };

            await trx('transacoes').insert(paymentTransaction);

            // 5. Atualizar Limite? (Step 3)
            // Se houvesse uma tabela de 'limite_utilizado', decrementariamos aqui.
            // Como não há, apenas retornamos o sucesso. O "available limit" é calculado na leitura.
            
            return {
                success: true,
                transactionsUpdated: transacoesParaLiquidar.length,
                totalPaid: totalAmount.toString(),
                paymentId: paymentTransaction.id
            };
        });
    }
}

module.exports = CardService;
