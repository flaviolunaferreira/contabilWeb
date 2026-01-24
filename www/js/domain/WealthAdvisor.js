import { TransactionModel } from './TransactionModel.js';
import { FinancialEngine } from './FinancialEngine.js';
import { ToastService } from '../infra/ToastService.js';

/**
 * Bússola Financeira - Camada de Inteligência de Decisão
 */
export class WealthAdvisor {
    
    /**
     * Análise Instantânea de Custo de Oportunidade
     * @param {number} amount Valor do gasto em centavos
     * @param {string} essentiality Categoria de essencialidade
     * @returns {Object|null} Objeto com mensagem de alerta ou null se não aplicável
     */
    static checkOpportunityCost(amount, essentiality) {
        // Regra de Ouro: Só questiona se for SUPÉRFLUO e valor relevante (> R$ 50,00)
        const LIMIT_TO_ALERT = 5000; 
        
        if (essentiality === TransactionModel.ESSENTIALITY.SUPERFLUOUS && amount > LIMIT_TO_ALERT) {
            // Taxa padrão 10% a.a.
            const annualRate = 0.10;
            const monthlyRate = Math.pow(1 + annualRate, 1/12) - 1;
            
            const calculateFV = (months) => {
                const pv = amount / 100;
                // FV = PV * (1 + i)^n
                return pv * Math.pow(1 + monthlyRate, months);
            };

            const fv12 = calculateFV(12);
            // const fv24 = calculateFV(24);
            const fv60 = calculateFV(60);

            const loss5Years = (fv60 - (amount/100 )); 

            return {
                type: 'OPPORTUNITY_ALERT',
                message: `Este gasto de ${FinancialEngine.formatCurrency(amount)} custará ${FinancialEngine.formatCurrency(Math.round(loss5Years*100))} em rendimentos perdidos em 5 anos (10% a.a.).`,
                actionLabel: 'Confirmar Gasto?'
            };
        }
        return null;
    }

    /**
     * Gera Relatório de Diagnóstico Semanal (Gastos vs Meta)
     * @param {Array} transactions Transações
     * @param {Object} goalPlan Resultado do goalService.calcularPlanejamento()
     */
    static generateWeeklyReport(transactions, goalPlan) {
        if (!transactions || transactions.length === 0) return null;

        const now = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setDate(now.getDate() - 90);

        // 1. Calcular Gasto da Semana Atual
        const currentWeekExpenses = transactions
            .filter(t => t.type === TransactionModel.TYPES.EXPENSE && new Date(t.date) >= oneWeekAgo)
            .reduce((sum, t) => sum + t.amount, 0);

        // 2. Calcular Média de Gastos dos Últimos 3 Meses (por semana)
        const last3MonthsExpenses = transactions
            .filter(t => t.type === TransactionModel.TYPES.EXPENSE && new Date(t.date) >= threeMonthsAgo && new Date(t.date) < oneWeekAgo)
            .reduce((sum, t) => sum + t.amount, 0);
        
        // Período de comparação aprox. 12 semanas (90 dias / 7)
        const weeksCount = 90 / 7; 
        const avgWeeklyExpense = last3MonthsExpenses > 0 ? (last3MonthsExpenses / weeksCount) : 0;

        const insights = [];

        // 3. Diagnóstico de Desvio
        if (avgWeeklyExpense > 0 && currentWeekExpenses > avgWeeklyExpense) {
            const deviation = ((currentWeekExpenses - avgWeeklyExpense) / avgWeeklyExpense);
            
            if (deviation > 0.15) { // Desvio > 15%
                insights.push({
                    title: 'Desvio de Rota Detectado',
                    severity: 'alert',
                    message: `Você gastou ${FinancialEngine.formatCurrency(currentWeekExpenses)} nesta semana, ${(deviation*100).toFixed(0)}% ACIMA da sua média histórica (${FinancialEngine.formatCurrency(Math.round(avgWeeklyExpense))}). Isso compromete sua Bússola Financeira.`
                });
            }
        }
        
        // Mantendo o Insight de Meta se existir
        if (goalPlan && goalPlan.status !== 'EXPIRED') {
             const txtAporte = FinancialEngine.formatCurrency(goalPlan.aporteMensalNecessario);
             insights.push({
                 title: 'Foco na Meta (Reverse Budgeting)',
                 severity: 'info',
                 message: `Lembrete: Para zerar dívidas em ${new Date(goalPlan.targetDate).toLocaleDateString()}, seu alvo de sobra mensal é ${txtAporte}.`
             });
        }

        return insights;
    }
}
