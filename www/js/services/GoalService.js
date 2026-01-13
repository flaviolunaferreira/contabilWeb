import { StorageProvider } from '../infra/StorageProvider.js';
import { FinancialEngine } from '../domain/FinancialEngine.js'; // Importação do motor financeiro para Utils
// Note: Em ambiente real sem bundler inteligente, seria melhor injetar dependências no construtor.
// Assumindo módulos ES6 nativos funcionam.

export class GoalService {
    constructor() {
        this.STORAGE_KEY = 'metas_financeiras';
    }

    getGoal() {
        // MVP: Suporta apenas uma meta principal 'DEBT_FREE'
        const goals = StorageProvider.get(this.STORAGE_KEY, []);
        return goals.find(g => g.type === 'DEBT_FREE') || null;
    }

    setDebtFreeGoal(targetDateStr, totalDebtCents) {
        const goal = {
            id: 'meta_divida_zero',
            type: 'DEBT_FREE',
            targetDate: targetDateStr,
            startDebt: totalDebtCents,
            createdAt: new Date().toISOString()
        };
        StorageProvider.set(this.STORAGE_KEY, [goal]);
        return goal;
    }

    /**
     * Reverse Budgeting: Calcula quanto deve ser pago por mês para atingir a meta
     * @param {number} currentTotalDebt Saldo devedor total atual (centavos)
     */
    calcularPlanejamento(currentTotalDebt) {
        const goal = this.getGoal();
        if (!goal) return null;

        const target = new Date(goal.targetDate);
        const today = new Date();
        
        // Meses restantes
        const diffTime = Math.abs(target - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        const monthsRemaining = diffDays / 30;

        if (monthsRemaining <= 0) return { status: 'EXPIRED' };

        // Pagamento Mensal Necessário (Sem juros compostos complexos no MVP, média simples)
        const aporteMensalNecessario = Math.ceil(currentTotalDebt / monthsRemaining);

        return {
            targetDate: goal.targetDate,
            monthsRemaining: monthsRemaining.toFixed(1),
            aporteMensalNecessario, // Centavos
            totalDivida: currentTotalDebt
        };
    }

    /**
     * Verifica se a meta é viável considerando o fluxo de caixa atual
     * @param {Date|string} dataAlvo Data alvo
     * @param {number} saldoLivreMensal Saldo Real - Despesas Fixas (centavos)
     * @param {number} dividaTotal (centavos)
     */
    verificarViabilidadeMeta(dataAlvo, saldoLivreMensal, dividaTotal) {
         const target = new Date(dataAlvo);
         const today = new Date();
         const diffDays = Math.max(1, Math.ceil(Math.abs(target - today) / (1000 * 60 * 60 * 24)));
         const monthsRemaining = diffDays / 30;
         
         const aporteNecessario = Math.ceil(dividaTotal / monthsRemaining);
         
         if (saldoLivreMensal < aporteNecessario) {
             const deficit = aporteNecessario - saldoLivreMensal;
             return {
                 status: 'UNFEASIBLE_WARNING',
                 message: `Atenção: Para quitar tudo em ${target.toLocaleDateString()}, você precisa de um aporte mensal de ${FinancialEngine.formatCurrency(aporteNecessario)}. Seu saldo livre atual é insuficiente. Reduza gastos variáveis em ${FinancialEngine.formatCurrency(deficit)} ou aumente sua renda.`
             };
         }
         
         return {
             status: 'FEASIBLE',
             message: `Plano viável! Seu saldo livre cobre o aporte necessário de ${FinancialEngine.formatCurrency(aporteNecessario)}.`
         };
    }
}

export const goalService = new GoalService();
