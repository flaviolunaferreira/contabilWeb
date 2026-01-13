import { transacaoService } from './TransacaoService.js';
import { cartaoService } from './CartaoService.js';
import { TransactionModel } from '../domain/TransactionModel.js';
import { FinancialEngine } from '../domain/FinancialEngine.js';
import { eventBus } from '../infra/EventBus.js';
import { ToastService } from '../infra/ToastService.js';

export class FaturaService {
    
    /**
     * Retorna transações elegíveis para fatura de um período
     */
    obterTransacoesPorPeriodo(cartaoId, mes, ano) {
        const all = transacaoService.getAll();
        
        return all.filter(t => {
            if (t.cardId !== cartaoId) return false;
            if (t.paymentMethod !== TransactionModel.PAYMENT_METHODS.CREDIT) return false;
            // Apenas transações que ainda não foram pagas em fatura
            if (t.status === TransactionModel.STATUS.INVOICE_PAID) return false;

            const d = new Date(t.date);
            // Ajuste simples de mês/ano. (Na vida real, consideraria dia de fechamento, 
            // mas para este MVP, assumimos mês calendário ou lógica simplificada)
            // Lendo o prompt: "Liquidar fatura (mesAno)".
            return d.getMonth() + 1 === mes && d.getFullYear() === ano;
        });
    }

    /**
     * Liquidação Atômica de Fatura
     * @param {string} cartaoId 
     * @param {number} mes Mês (1-12)
     * @param {number} ano Ano (2024)
     */
    async liquidarFatura(cartaoId, mes, ano) {
        try {
            const transacoesFatura = this.obterTransacoesPorPeriodo(cartaoId, mes, ano);

            if (transacoesFatura.length === 0) {
                ToastService.show('Nenhuma transação pendente para este período.', 'warning');
                return false;
            }

            // 1. Calcular Total
            const valorTotal = transacoesFatura.reduce((acc, t) => acc + t.amount, 0);

            // 2. Validação de Saldo (Preventivo)
            const todasTransacoes = transacaoService.getAll();
            const { realBalance } = FinancialEngine.compute(todasTransacoes);

            if (realBalance < valorTotal) {
                ToastService.show(`Saldo insuficiente. Necessário: ${FinancialEngine.formatCurrency(valorTotal)}`, 'error');
                return false;
            }

            // 3. ATOMICIDADE (Preparação dos dados)
            // Vamos clonar a lista atual para modificar
            // Como transacaoService.getAll() retorna o objeto raw do storage (ou proxy),
            // precisamos ter cuidado. Assumindo que retorna array by reference do loader simples,
            // mas pra ser seguro vamos mapear IDs.
            
            const idsParaLiquidar = new Set(transacoesFatura.map(t => t.id));
            const novaListaTransacoes = todasTransacoes.map(t => {
                if (idsParaLiquidar.has(t.id)) {
                    // Update Status
                    return { ...t, status: TransactionModel.STATUS.INVOICE_PAID };
                }
                return t;
            });

            // 4. Criar Transação de Baixa no Caixa
            const baixaCaixa = new TransactionModel({
                description: `Pagamento Fatura ${mes}/${ano}`,
                amount: valorTotal,
                type: TransactionModel.TYPES.EXPENSE,
                paymentMethod: TransactionModel.PAYMENT_METHODS.DEBIT, // Sai do saldo
                date: new Date().toISOString(),
                categoryId: 'PAGAMENTO_FATURA', // Categoria sistema
                status: TransactionModel.STATUS.COMPLETED
            });

            novaListaTransacoes.push(baixaCaixa);

            // 5. Commit (Salvar tudo de uma vez)
            const sucesso = transacaoService.saveAll(novaListaTransacoes);

            if (sucesso) {
                // Notificar sucesso
                const cartao = cartaoService.getById(cartaoId);
                const nomeCartao = cartao ? cartao.name : 'Cartão';
                
                ToastService.show(`Fatura de ${nomeCartao} paga com sucesso!`, 'success');
                
                eventBus.publish('fatura:paga', { 
                    cartaoId, 
                    valor: valorTotal, 
                    mes, 
                    ano 
                });
                
                eventBus.publish('finance:update', novaListaTransacoes); // Recalcular dashboard
                
                return true;
            } else {
                throw new Error('Falha na escrita do Storage.');
            }

        } catch (error) {
            console.error('[FaturaService] Erro na liquidação:', error);
            ToastService.show('Erro crítico ao liquidar fatura. Tente novamente.', 'error');
            return false; // Rollback implícito (nada foi salvo no storage)
        }
    }
}

export const faturaService = new FaturaService();
