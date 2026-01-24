import { StorageProvider } from '../infra/StorageProvider.js';
import { DebtModel } from '../domain/DebtModel.js';
// Importação circular evitada se usarmos injeção ou acesso sob demanda, mas aqui services se conhecem.
// Para respeitar princípio das instruções iniciais ("Controllers não se conhecem, services isolados"), vamos injetar ou buscar dados.
import { cartaoService } from './CartaoService.js'; 
import { transacaoService } from './TransacaoService.js';
import { TransactionModel } from '../domain/TransactionModel.js';

export class DebtService {
    constructor() {
        this.STORAGE_KEY = 'dividas_estruturadas';
    }

    getAll() {
        // Retorna array de objetos. 
        return StorageProvider.get(this.STORAGE_KEY, []);
    }

    save(debtData) {
        const model = new DebtModel(debtData);
        const debts = this.getAll();
        debts.push(model);
        StorageProvider.set(this.STORAGE_KEY, debts);
        return model;
    }

    /**
     * Simula a antecipação de amortização (Quitação de parcelas finais).
     * @param {string} debtId ID da dívida
     * @param {number} valorDisponivel Valor em centavos disponível para aporte
     * @returns {Object} Resultado da simulação
     */
    simularAmortizacao(debtId, valorDisponivel) {
        const debt = this.getAll().find(d => d.id === debtId);
        if (!debt) throw new Error('Dívida não encontrada.');

        if (debt.system === DebtModel.SYSTEM.PRICE) {
            return this._simularPrice(debt, valorDisponivel);
        } else {
            // Implementação SAC simplificada ou TODO
            return { message: 'Simulação SAC ainda não disponível nesta versão.' };
        }
    }

    _simularPrice(debt, valorDisponivel) {
        const i = debt.monthlyRate / 100;
        const nRestante = debt.termMonths - debt.paidMonths;
        
        if (i === 0) return { parcelasEliminadas: Math.floor(valorDisponivel / (debt.totalValue / debt.termMonths)), economia: 0 };

        const pmt = (debt.totalValue * i) / (1 - Math.pow(1 + i, -debt.termMonths));
        
        let saldoParaGastar = valorDisponivel;
        let parcelasEliminadas = 0;
        let economiaJuros = 0;

        for (let k = nRestante; k >= 1; k--) {
            const vpParcela = pmt / Math.pow(1 + i, k);
            
            if (saldoParaGastar >= vpParcela) {
                saldoParaGastar -= vpParcela;
                parcelasEliminadas++;
                economiaJuros += (pmt - vpParcela);
            } else {
                break; 
            }
        }

        return {
            parcelasEliminadas,
            economiaJuros: Math.round(economiaJuros), 
            novoPrazo: nRestante - parcelasEliminadas,
            lucroImediato: valorDisponivel > 0 ? (economiaJuros / (valorDisponivel - saldoParaGastar)) * 100 : 0
        };
    }

    /**
     * Gera estratégias de quitação comparativas (Avalanche vs Bola de Neve)
     * Inclui Dívidas Estruturadas e Cartões de Crédito Rotativos (Simulados)
     * @returns {Object} { avalanche: [], snowball: [] } Ordenados por prioridade
     */
    gerarPlanoLiquidacao() {
        // 1. Dívidas Estruturadas
        const financ = this.getAll().filter(d => (d.totalValue > 0 && d.paidMonths < d.termMonths));
        const listaUnificada = [];

        // Adiciona Financiamentos
        financ.forEach(d => {
            listaUnificada.push({
                id: d.id,
                description: d.description,
                type: 'FINANCIAMENTO',
                totalDebt: this._calcularSaldoDevedorAproximado(d),
                interestRate: d.monthlyRate,
                minPayment: (d.totalValue / d.termMonths) // Simplificado
            });
        });

        // 2. Faturas de Cartão em Aberto (Considerando como "Dívida Potencial" de alto juro)
        // Para este prompt, vamos assumir que cartões com saldo PENDENTE são dívidas de curtíssimo prazo.
        // Se não pagar, juros de 12% a.m em média.
        const cartoes = cartaoService.getAll();
        const transacoes = transacaoService.getAll();
        
        cartoes.forEach(card => {
            const gastosPendentes = transacoes
            .filter(t => 
                t.cardId === card.id && 
                t.type === TransactionModel.TYPES.EXPENSE &&
                t.status !== TransactionModel.STATUS.INVOICE_PAID
            )
            .reduce((sum, t) => sum + t.amount, 0);

            if (gastosPendentes > 0) {
                 listaUnificada.push({
                    id: card.id,
                    description: `Fatura ${card.name}`,
                    type: 'CARTAO_CREDITO',
                    totalDebt: gastosPendentes,
                    interestRate: 12.0, // Taxa de cartão média a.m. (Assunção de guerra)
                    minPayment: gastosPendentes // Ideal é pagar tudo
                });
            }
        });

        if (listaUnificada.length === 0) return null;

        // 1. Avalanche: Foco em Taxa de Juros (Maior -> Menor)
        const avalanche = [...listaUnificada].sort((a, b) => b.interestRate - a.interestRate);

        // 2. Snowball: Foco em Valor da Dívida (Menor -> Maior)
        const snowball = [...listaUnificada].sort((a, b) => a.totalDebt - b.totalDebt);

        return {
            avalanche: {
                prioridade: avalanche,
                motivo: 'Matematicamente otimizado. Elimina os juros mais caros primeiro (Ex: Cartão).'
            },
            snowball: {
                prioridade: snowball,
                motivo: 'Gera momento psicológico. Elimina cartões/dívidas menores rapidamente.'
            }
        };
    }

    _calcularSaldoDevedorAproximado(d) {
        const i = d.monthlyRate / 100;
        const nRestante = d.termMonths - d.paidMonths;
        if (i === 0) return d.totalValue - ((d.totalValue/d.termMonths) * d.paidMonths);
        const pmt = (d.totalValue * i) / (1 - Math.pow(1 + i, -d.termMonths));
        const vp = pmt * ( (1 - Math.pow(1+i, -nRestante)) / i );
        return Math.round(vp);
    }
}

export const debtService = new DebtService();
