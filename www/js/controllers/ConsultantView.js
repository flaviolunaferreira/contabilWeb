import { TransactionModel } from '../domain/TransactionModel.js';
import { FinancialEngine } from '../domain/FinancialEngine.js';
import { WealthAdvisor } from '../domain/WealthAdvisor.js';
import { goalService } from '../services/GoalService.js';

export class ConsultantView {
    constructor(financialEngine, debtService, transacaoService) {
        this.engine = financialEngine;
        this.debtService = debtService;
        this.transacaoService = transacaoService;
    }

    /**
     * Gera recomendações estratégicas baseadas no estado atual
     * @returns {Array<Object>} Lista de insights { type: 'ALERT'|'TIP', message: '...' }
     */
    generateInsights() {
        const transactions = this.transacaoService.getAll();
        const { realBalance, liabilities } = this.engine.compute(transactions);
        const health = this.engine.analyzeHealth(transactions, realBalance);
        
        const insights = [];

        // 0. Diagnóstico Semanal (Bússola Financeira)
        const netDebt = liabilities; // Simplificação. Idealmente somaria do DebtService também.
        const goalPlan = goalService.calcularPlanejamento(netDebt);
        const weeklyReport = WealthAdvisor.generateWeeklyReport(transactions, goalPlan);
        
        if (weeklyReport) {
            weeklyReport.forEach(report => {
                insights.push({
                    type: report.severity === 'alert' ? 'STRATEGY' : 'TIP', // Mapeamento conforme solicitado
                    title: report.title,
                    message: report.message
                });
            });
        }

        // 0.1 Viabilidade da Meta (GoalService)
        // Precisamos do Saldo Livre Mensal estimado. 
        // A lógica do FinancialEngine.analyzeHealth dá uma ideia, mas vamos simplificar usando:
        // Saldo Médio Mensal = Receita Média - Despesa Média.
        // Como o goalService exige Saldo Real - Despesas Fixas, vamos aproximar:
        const monthlyIncome = health.averageIncome || 0; // Se health expor isso. Se não, assumimos saldo atual como "caixa".
        const monthlyFixed = transactions // Soma despesas fixas estimadas (simplificado para média mensal)
            .filter(t => t.type === TransactionModel.TYPES.EXPENSE && t.essentiality === TransactionModel.ESSENTIALITY.ESSENTIAL)
            .reduce((sum, t) => sum + t.amount, 0) / (transactions.length > 0 ? 3 : 1); // Mock divisor
            
        // Usar Saldo Livre Real do mês corrente
        const currentMonthData = this._getCurrentMonthData(transactions);
        const freeBalance = currentMonthData.income - currentMonthData.fixedExpenses;

        const mainGoal = goalService.getGoal();
        if (mainGoal) {
             const feasibility = goalService.verificarViabilidadeMeta(mainGoal.targetDate, freeBalance, netDebt);
             if (feasibility.status === 'UNFEASIBLE_WARNING') {
                 insights.push({
                    type: 'ALERT',
                    title: 'Meta em Risco (Reverse Budgeting)',
                    message: feasibility.message
                 });
             }
        }

        // 0.2 Estratégias de Dívida (Avalanche vs Snowball)
        const strategies = this.debtService.gerarPlanoLiquidacao();
        if (strategies) {
            // Se tiver dívidas, sugere a melhor estratégia (Avalanche padrão para riqueza)
            const topPriority = strategies.avalanche.prioridade[0];
            insights.push({
                type: 'STRATEGY',
                title: 'Guerra Contra Juros (Modo Avalanche)',
                message: `${strategies.avalanche.motivo} Sua prioridade #1 é: ${topPriority.description} (${this._format(topPriority.totalDebt)} com ${topPriority.interestRate}% a.m).`
            });
            
            // Dica Tip do Cafézinho
            insights.push({
                type: 'TIP',
                title: 'Acelere seu Plano',
                message: 'Se você economizar o valor de um "cafézinho" por dia e abater no financiamento, quita meses antes.'
            });
        }

        // 1. Análise de Burn Rate / Fundo de Emergência
        if (health.daysOfSurvival < 30) {
            insights.push({
                type: 'ALERT',
                title: 'Zona de Perigo',
                message: `Sua reserva dura apenas ${health.daysOfSurvival} dias. Corte gastos supérfluos imediatamente.`
            });
        } else if (health.daysOfSurvival > 180) {
            insights.push({
                type: 'TIP',
                title: 'Alta Liquidez',
                message: 'Você tem mais de 6 meses de reserva. Considere investir em ativos de maior rentabilidade.'
            });
        }

        // 2. Análise de Supérfluos
        const totalIncome = transactions
            .filter(t => t.type === TransactionModel.TYPES.INCOME)
            .reduce((acc, t) => acc + t.amount, 0);
            
        const superfluous = transactions
            .filter(t => t.type === TransactionModel.TYPES.EXPENSE && t.essentiality === TransactionModel.ESSENTIALITY.SUPERFLUOUS)
            .reduce((acc, t) => acc + t.amount, 0);

        if (totalIncome > 0 && (superfluous / totalIncome) > 0.2) {
            insights.push({
                type: 'ALERT',
                title: 'Vazamento de Riqueza',
                message: `Seus gastos supérfluos (${this._format(superfluous)}) representam ${Math.round((superfluous/totalIncome)*100)}% da sua renda. O recomendado é < 20%.`
            });
        }

        // 3. Oportunidade de Dívida (Simulação)
        // Se houver saldo livre, verifique se compensa amortizar
        const saldoLivre = realBalance - liabilities; // Tira o que já está comprometido com cartão
        if (saldoLivre > 100000) { // Se sobrar mais de R$ 1000
            const debts = this.debtService.getAll();
            debts.forEach(debt => {
                const sim = this.debtService.simularAmortizacao(debt.id, saldoLivre);
                if (sim.parcelasEliminadas > 0 && sim.lucroImediato > 0.05) { // Se render mais que 5% (ex poupança)
                   insights.push({
                       type: 'TIP',
                       title: `Oportunidade em ${debt.description}`,
                       message: `Use seus ${this._format(saldoLivre)} livres para quitar ${sim.parcelasEliminadas} parcelas finais. Lucro de ${this._format(sim.economiaJuros)} (${sim.lucroImediato.toFixed(1)}% ROI).`
                   });
                }
            });
        }

        return insights;
    }

    _format(cents) {
        return FinancialEngine.formatCurrency(cents);
    }

    _getCurrentMonthData(transactions) {
        const now = new Date();
        const currentMonth = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });

        const income = currentMonth
            .filter(t => t.type === TransactionModel.TYPES.INCOME)
            .reduce((sum, t) => sum + t.amount, 0);

        const fixedExpenses = currentMonth // Simplificação: Considera tudo essencial como fixo
             .filter(t => t.type === TransactionModel.TYPES.EXPENSE && t.essentiality === TransactionModel.ESSENTIALITY.ESSENTIAL)
             .reduce((sum, t) => sum + t.amount, 0);

        return { income, fixedExpenses };
    }
}
