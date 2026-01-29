// --- HELPERS E CALC ---
function addMonthsPreservingDay(startDate, monthsToAdd) {
    const targetDate = new Date(startDate);
    const originalDay = startDate.getDate();
    targetDate.setDate(1);
    targetDate.setMonth(targetDate.getMonth() + monthsToAdd);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    targetDate.setDate(Math.min(originalDay, daysInMonth));
    return targetDate;
}

function calculate5thBusinessDay(year, month) {
    let count = 0, day = 1;
    while(count < 5) {
        let d = new Date(year, month, day);
        if(d.getDay() !== 0 && d.getDay() !== 6) count++;
        if(count < 5) day++;
    }
    return day;
}

// --- STORE ---
const Store = {
    transactions: [],
    cards: [],
    categories: [
        'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Moradia', 'Vestuário', 'Outros'
    ],
    async init() {
        try {
            // Carrega dados do SQL via Preload
            this.transactions = await window.DB.getAllTransactions() || [];
            this.cards = await window.DB.getAllCards() || [];
            
            const dbCats = await window.DB.getAllCategories() || [];
            if (dbCats && dbCats.length > 0) {
                this.categories = dbCats;
            } else {
                // Se DB vazio, salva as padrão
                for(const c of this.categories) await window.DB.addCategory(c);
            }
            this.categories.sort();
        } catch(e) {
            console.error("Erro ao carregar DB", e);
            alert("Erro ao carregar banco de dados!");
        }
    },
    async saveTransaction(t) {
        await window.DB.saveTransaction(t);
        await this.init(); // Recarrega tudo para garantir sincronia
    },
    async deleteTransaction(id) {
        await window.DB.deleteTransaction(id);
        await this.init();
    },
    async saveCard(c) {
        await window.DB.saveCard(c);
        await this.init();
    },
    async deleteCard(id) {
        await window.DB.deleteCard(id);
        await this.init();
    },
    async addCategory(name) {
        const trimmed = name.trim();
        if (trimmed && !this.categories.includes(trimmed)) {
            await window.DB.addCategory(trimmed);
            await this.init();
            return true;
        }
        return false;
    }
};

// --- MODAL ---
const Modal = {
    selectedType: null,
    open(type, editId = null) {
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.querySelectorAll('.modal-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(`modal-${type}`).classList.remove('hidden');
        
        if(type === 'transaction') {
            const sel = document.getElementById('t-card-id');
            sel.innerHTML = Store.cards.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            
            this.populateCategorySuggestions();
            
            if (editId) {
                const t = Store.transactions.find(x => x.id === editId);
                document.getElementById('modal-title').innerText = "Editar Transação";
                document.getElementById('t-id').value = t.id;
                document.getElementById('t-desc').value = t.desc.replace(/\s\(\d+\/\d+\)$/, '');
                document.getElementById('t-amount').value = t.amount;
                document.getElementById('t-date').value = t.date;
                document.getElementById('t-method').value = t.method;
                if(t.cardId) document.getElementById('t-card-id').value = t.cardId;
                if(t.category) document.getElementById('t-category').value = t.category;
                
                const radios = document.getElementsByName('t-status');
                for(let r of radios) r.checked = (r.value === t.status);
                
                document.getElementById('t-dia-util').checked = t.use5thDay || false;
                this.setType(t.type); 
                this.toggleCardSelect();
                document.getElementById('recurrence-wrapper').classList.add('hidden');
            } else {
                document.getElementById('modal-title').innerText = "Nova Transação";
                document.getElementById('t-id').value = "";
                document.getElementById('t-desc').value = "";
                document.getElementById('t-amount').value = "";
                document.getElementById('t-date').valueAsDate = new Date();
                document.getElementById('t-repeat').value = "1";
                document.getElementById('t-dia-util').checked = false;
                document.getElementById('t-category').value = "";
                this.setType('expense');
                document.getElementById('recurrence-wrapper').classList.remove('hidden');
            }
        }
    },
    close() { document.getElementById('modal-overlay').classList.add('hidden'); },
    setType(t) {
        this.selectedType = t;
        const bin = document.getElementById('btn-type-in');
        const bout = document.getElementById('btn-type-out');
        const logic5 = document.getElementById('logic-dia-util');

        if(t === 'income') {
            bin.className = 'p-3 rounded-xl font-bold text-sm bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500 transition';
            bout.className = 'p-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-400 transition';
            logic5.classList.remove('hidden');
        } else {
            bout.className = 'p-3 rounded-xl font-bold text-sm bg-rose-100 text-rose-700 ring-2 ring-rose-500 transition';
            bin.className = 'p-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-400 transition';
            logic5.classList.add('hidden');
        }
    },
    toggleCardSelect() {
        const method = document.getElementById('t-method').value;
        const cw = document.getElementById('card-select-wrapper');
        const sw = document.getElementById('status-wrapper');
        if(method === 'credit') {
            cw.classList.remove('hidden');
            sw.classList.add('opacity-50', 'pointer-events-none'); 
        } else {
            cw.classList.add('hidden');
            sw.classList.remove('opacity-50', 'pointer-events-none');
        }
    },
    populateCategorySuggestions() {
        const datalist = document.getElementById('category-suggestions');
        if (datalist) {
            datalist.innerHTML = Store.categories.map(cat => `<option value="${cat}">`).join('');
        }
    },
    openCardDetails(cardName, transactions, total, paid, pending, categoryFilter) {
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.querySelectorAll('.modal-content').forEach(el => el.classList.add('hidden'));
        document.getElementById('modal-card-details').classList.remove('hidden');
        
        document.getElementById('card-details-title').innerText = cardName;
        document.getElementById('card-details-filter').innerText = categoryFilter ? `Categoria: ${categoryFilter}` : 'Todas as categorias';
        document.getElementById('card-details-total').innerText = App.fmt(total);
        document.getElementById('card-details-paid').innerText = App.fmt(paid);
        document.getElementById('card-details-pending').innerText = App.fmt(pending);
        
        // Calcular total conferido
        const checked = transactions.filter(t => t.checked).reduce((sum, t) => sum + t.amount, 0);
        document.getElementById('card-details-checked').innerText = App.fmt(checked);
        
        // Habilitar/desabilitar botão de pagar fatura
        const btnPayInvoice = document.getElementById('btn-pay-invoice');
        const hasPending = transactions.some(t => t.status === 'pending');
        if (btnPayInvoice) {
            btnPayInvoice.disabled = !hasPending;
            if (!hasPending) {
                btnPayInvoice.title = 'Nenhuma despesa pendente para pagar';
            } else {
                btnPayInvoice.title = 'Pagar todas as despesas pendentes';
            }
        }
        
        const tbody = document.getElementById('card-details-table');
        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="p-8 text-center text-slate-400 italic">Nenhuma despesa encontrada para os filtros selecionados</td></tr>';
        } else {
            tbody.innerHTML = transactions.map(t => {
                const stClass = t.status === 'paid' ? 'status-paid' : 'status-pending';
                const isChecked = t.checked ? 'checked' : '';
                return `<tr>
                    <td class="p-3 text-center">
                        <input type="checkbox" ${isChecked} onchange="App.toggleChecked(${t.id})" class="w-5 h-5 accent-[#006739] cursor-pointer" title="Marcar como conferido">
                    </td>
                    <td class="p-3 text-slate-700 font-medium text-sm">${t.effectiveDate.toLocaleDateString('pt-BR')}</td>
                    <td class="p-3 font-bold text-slate-900">${t.desc}${t.displayNote?`<div class="text-[9px] italic text-slate-500 mt-0.5">${t.displayNote}</div>`:''}</td>
                    <td class="p-3">${t.category ? `<span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 text-[#004d2c] text-[10px] font-bold uppercase"><i class="fas fa-tag"></i> ${t.category}</span>` : '<span class="text-slate-400 text-xs">-</span>'}</td>
                    <td class="p-3"><span class="status-pill ${stClass} text-[9px] py-1 px-2">${t.status==='paid'?'Pago':'Pendente'}</span></td>
                    <td class="p-3 text-right font-black text-slate-900 text-base">${App.fmt(t.amount)}</td>
                    <td class="p-3 text-center">
                        <div class="flex justify-center gap-2">
                            <button onclick="Modal.close(); Modal.open('transaction', ${t.id})" class="text-amber-500 hover:text-amber-700 transition" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="App.deleteTransactionFromCard(${t.id})" class="text-rose-500 hover:text-rose-700 transition" title="Apagar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }).join('');
        }
    }
};

// --- APP ---
const App = {
    currentDate: new Date(),
    currentView: 'dashboard',
    processedTransactions: [],
    currentCardTransactions: [],
    currentCardId: null,

    async init() { 
        await Store.init(); // Carrega SQL
        this.populateCategoryFilter(); 
        this.render(); 
    },
    
    populateCategoryFilter() {
        const filter = document.getElementById('category-filter');
        if (filter) {
            const currentValue = filter.value;
            filter.innerHTML = '<option value="">Todas Categorias</option>' + 
                Store.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
            if (currentValue) filter.value = currentValue;
        }
    },
    navigate(view) {
        this.currentView = view;
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById(`nav-${view}`).classList.add('active');
        ['dashboard', 'lancamentos', 'cartoes', 'config'].forEach(v => document.getElementById(`view-${v}`).classList.add('hidden'));
        document.getElementById(`view-${view}`).classList.remove('hidden');
        this.render();
    },
    changeDate(months) { this.currentDate.setMonth(this.currentDate.getMonth() + months); this.render(); },
    
    async saveTransaction() {
        const id = document.getElementById('t-id').value;
        const desc = document.getElementById('t-desc').value;
        const amount = parseFloat(document.getElementById('t-amount').value);
        const dateVal = document.getElementById('t-date').value;
        const method = document.getElementById('t-method').value;
        const cardId = document.getElementById('t-card-id').value;
        const status = document.querySelector('input[name="t-status"]:checked').value;
        const use5thDay = document.getElementById('t-dia-util').checked;
        const repeatCount = parseInt(document.getElementById('t-repeat').value) || 1;
        const category = document.getElementById('t-category').value.trim();

        if (!desc || isNaN(amount) || !dateVal || !Modal.selectedType) return alert("Preencha todos os campos!");

        // Adicionar categoria automaticamente se for nova
        if (category && !Store.categories.includes(category)) {
            await Store.addCategory(category);
            this.populateCategoryFilter();
        }

        const baseT = { amount, method, status, type: Modal.selectedType, cardId: method === 'credit' ? cardId : null, use5thDay: Modal.selectedType === 'income' ? use5thDay : false, category: category || null };

        if(id) {
            // Edição
            await Store.saveTransaction({ id: parseInt(id), ...baseT, desc: desc, date: dateVal, checked: false });
        } else {
            // Nova(s)
            let startDate = new Date(dateVal + 'T00:00:00');
            for (let i = 0; i < repeatCount; i++) {
                let nextDate = addMonthsPreservingDay(startDate, i);
                const isoDate = nextDate.toISOString().split('T')[0];
                let finalDesc = desc;
                if (repeatCount > 1) finalDesc = `${desc} (${i + 1}/${repeatCount})`;
                // id será gerado pelo BD se for null/undefined, mas o código antigo usava timestamp.
                // o SQL usa AUTOINCREMENT se id for null.
                await Store.saveTransaction({ id: null, ...baseT, desc: finalDesc, date: isoDate, checked: false });
            }
        }
        Modal.close(); this.render();
    },
    async addCard() {
        const name = document.getElementById('c-name').value;
        const limit = parseFloat(document.getElementById('c-limit').value);
        const closing = parseInt(document.getElementById('c-closing').value);
        const due = parseInt(document.getElementById('c-due').value);
        if (!name || isNaN(limit)) return alert("Dados inválidos");
        await Store.saveCard({ id: null, name, limit, closing, due });
        Modal.close(); this.render();
    },
    async toggleStatus(id) { 
        const t = Store.transactions.find(t => t.id === id); 
        if(t) { 
            t.status = t.status === 'paid' ? 'pending' : 'paid'; 
            await Store.saveTransaction(t); 
            this.render(); 
        } 
    },
    async deleteTransaction(id) { 
        if(confirm("Remover?")) { 
            await Store.deleteTransaction(id); 
            this.render(); 
        } 
    },
    async deleteCard(id) { 
        if(confirm("Remover cartão?")) { 
            await Store.deleteCard(id); 
            this.render(); 
        } 
    },
    
    async toggleChecked(id) {
        const t = Store.transactions.find(t => t.id === id);
        if(t) {
            t.checked = !t.checked;
            await Store.saveTransaction(t);
            
            // Atualizar total conferido no modal
            const checkedEl = document.getElementById('card-details-checked');
            if(checkedEl && this.currentCardTransactions.length) {
                const checked = this.currentCardTransactions.filter(tr => {
                    const transaction = Store.transactions.find(st => st.id === tr.id);
                    return transaction && transaction.checked;
                }).reduce((sum, tr) => sum + tr.amount, 0);
                checkedEl.innerText = this.fmt(checked);
            }
        }
    },
    
    async checkAllInvoice(checked) {
        if(!this.currentCardTransactions.length) return;
        
        for (const t of this.currentCardTransactions) {
            const transaction = Store.transactions.find(tr => tr.id === t.id);
            if(transaction) {
                transaction.checked = checked;
                await Store.saveTransaction(transaction); // Ineficiente, mas seguro
            }
        }
        
        // Reabrir modal atualizado
        const card = Store.cards.find(c => c.id == this.currentCardId);
        if(card) {
            this.render();
            this.viewCardDetails(this.currentCardId, card.name);
        }
    },
    
    async deleteTransactionFromCard(id) {
        if(confirm('Remover esta despesa?')) {
            await Store.deleteTransaction(id);
            
            // Reabrir modal atualizado
            const card = Store.cards.find(c => c.id == this.currentCardId);
            if(card) {
                this.render();
                this.viewCardDetails(this.currentCardId, card.name);
            }
        }
    },
    
    async payCardInvoice() {
        if(!this.currentCardTransactions.length) {
            alert('Nenhuma despesa para pagar!');
            return;
        }
        
        const pendingCount = this.currentCardTransactions.filter(t => t.status === 'pending').length;
        if(pendingCount === 0) {
            alert('Todas as despesas já estão pagas!');
            return;
        }
        
        if(confirm(`Pagar ${pendingCount} despesa(s) pendente(s)?`)) {
            for (const t of this.currentCardTransactions) {
                const transaction = Store.transactions.find(tr => tr.id === t.id);
                if(transaction && transaction.status === 'pending') {
                    transaction.status = 'paid';
                    await Store.saveTransaction(transaction);
                }
            }
            
            // Reabrir modal atualizado
            const card = Store.cards.find(c => c.id == this.currentCardId);
            if(card) {
                this.render();
                this.viewCardDetails(this.currentCardId, card.name);
            }
        }
    },
    
    viewCardDetails(cardId, cardName) {
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        const m = this.currentDate.getMonth(), y = this.currentDate.getFullYear();
        
        const cardTransactions = this.processedTransactions.filter(t => {
            const matchCard = t.cardId == cardId;
            const matchMonth = t.effectiveDate.getMonth() === m && t.effectiveDate.getFullYear() === y;
            const matchCategory = !categoryFilter || t.category === categoryFilter;
            return matchCard && matchMonth && matchCategory;
        });
        
        cardTransactions.sort((a, b) => a.effectiveDate - b.effectiveDate);
        
        this.currentCardTransactions = cardTransactions;
        this.currentCardId = cardId;
        
        const total = cardTransactions.reduce((sum, t) => sum + t.amount, 0);
        const paid = cardTransactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);
        const pending = cardTransactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
        
        Modal.openCardDetails(cardName, cardTransactions, total, paid, pending, categoryFilter);
    },
    
    updateSafe(id, val) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    },

    processTransactions() {
        this.processedTransactions = Store.transactions.map(t => {
            let effectiveDate = new Date(t.date + 'T00:00:00');
            let displayNote = '';
            let originLabel = t.method === 'credit' ? 'Cartão' : 'Conta';

            if (t.type === 'income' && t.use5thDay) {
                const day5 = calculate5thBusinessDay(effectiveDate.getFullYear(), effectiveDate.getMonth());
                effectiveDate.setDate(day5);
                displayNote = '5º Dia Útil Calculado';
            }
            if (t.method === 'credit' && t.cardId) {
                const card = Store.cards.find(c => c.id == t.cardId);
                if (card) {
                    const originalDate = new Date(t.date + 'T00:00:00');
                    const originalDay = originalDate.getDate();
                    
                    // Correção Crítica de Data:
                    // 1. Resetar para dia 1 para evitar pular mês incorretamente (ex: 30/Jan -> Fev sem dia 30 -> Março)
                    effectiveDate.setDate(1);

                    // 2. Se a compra foi após o fechamento, joga para a próxima competência
                    if (originalDay >= card.closing) {
                        effectiveDate.setMonth(effectiveDate.getMonth() + 1);
                    }

                    // 3. Se a data de vencimento é menor que a de fechamento (ex: Fecha 28, Vence 05),
                    // significa que o vencimento ocorre no mês seguinte ao da competência da fatura.
                    if (card.due < card.closing) {
                        effectiveDate.setMonth(effectiveDate.getMonth() + 1);
                    }

                    effectiveDate.setDate(card.due);
                    originLabel = card.name;
                    displayNote = `Compra em: ${originalDate.toLocaleDateString('pt-BR')}`;
                }
            }
            return { ...t, effectiveDate, displayNote, originLabel };
        });
    },

    render() {
        this.processTransactions();
        const m = this.currentDate.getMonth(), y = this.currentDate.getFullYear();
        this.updateSafe('header-date', this.currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }));

        const categoryFilter = document.getElementById('category-filter')?.value || '';
        let monthTrans = this.processedTransactions.filter(t => t.effectiveDate.getMonth() === m && t.effectiveDate.getFullYear() === y);
        
        if (categoryFilter) {
            monthTrans = monthTrans.filter(t => t.category === categoryFilter);
        }

        let incReal = 0, incPend = 0, expReal = 0, expPend = 0;
        monthTrans.forEach(t => {
            if (t.type === 'income') {
                if (t.status === 'paid') incReal += t.amount; else incPend += t.amount;
            } else {
                if (t.status === 'paid') expReal += t.amount; else expPend += t.amount;
            }
        });

        // CÁLCULO DE RESERVA (DIA 1 A 5)
        let reserveAmount = 0;
        monthTrans.forEach(t => {
            if (t.type === 'expense' && t.status === 'pending' && t.effectiveDate.getDate() <= 5) {
                reserveAmount += t.amount;
            }
        });

        // SALDOS ACUMULADOS
        let balReal = 0; 
        let balProj = 0; 
        let endOfViewMonth = new Date(y, m + 1, 0, 23, 59, 59);

        const dateInput = document.getElementById('preverSaldoData');
        if (dateInput && dateInput.value) {
            endOfViewMonth = new Date(dateInput.value + 'T23:59:59');
        }

        this.processedTransactions.forEach(t => {
            if (t.status === 'paid') {
                if (t.type === 'income') balReal += t.amount; else balReal -= t.amount;
            }
            if (t.effectiveDate <= endOfViewMonth) {
                if (t.type === 'income') balProj += t.amount; else balProj -= t.amount;
            }
        });

        if(this.currentView === 'dashboard') {
            this.updateSafe('kpi-income', this.fmt(incReal + incPend));
            this.updateSafe('kpi-inc-real', this.fmt(incReal));
            this.updateSafe('kpi-inc-pend', this.fmt(incPend));

            this.updateSafe('kpi-expense', this.fmt(expReal + expPend));
            this.updateSafe('kpi-exp-real', this.fmt(expReal));
            this.updateSafe('kpi-exp-pend', this.fmt(expPend));

            this.updateSafe('kpi-projected', this.fmt(balProj));
            
            // CARD INTELIGENTE DE SALDO LIVRE
            let freeBalance = balReal - reserveAmount;
            this.updateSafe('kpi-free-balance', this.fmt(freeBalance));
            this.updateSafe('kpi-current-cash', this.fmt(balReal));
            this.updateSafe('kpi-reserve', `- ${this.fmt(reserveAmount)}`);
            this.updateSafe('sidebar-balance', this.fmt(freeBalance));

            this.renderChart(monthTrans);
            this.renderCategoryChart(monthTrans);
            this.renderAgenda(monthTrans);
            this.renderDashboardSummary(monthTrans);
        }
        if(this.currentView === 'lancamentos') this.renderList(monthTrans);
        
        // LÓGICA DE CARTÕES
        if(this.currentView === 'cartoes') {
            const grid = document.getElementById('cards-grid');
            if(grid) {
                let totalMonthInvoice = 0;
                grid.innerHTML = Store.cards.map(c => {
                    const totalDebt = Store.transactions.filter(t => t.cardId == c.id && t.type === 'expense' && t.status === 'pending').reduce((a,b)=>a+b.amount,0);
                    const monthInvoice = monthTrans.filter(t => t.cardId == c.id && t.type === 'expense').reduce((a,b)=>a+b.amount,0);
                    const isPaid = monthTrans.filter(t => t.cardId == c.id && t.type === 'expense').every(t => t.status === 'paid') && monthInvoice > 0;
                    const statusText = monthInvoice === 0 ? "Sem fatura" : (isPaid ? "Paga" : "Aberta");

                    totalMonthInvoice += monthInvoice;
                    const pct = Math.min(100, (totalDebt/c.limit)*100);

                    return `<div class="card-visa p-6 rounded-[24px] h-60 flex flex-col justify-between shadow-xl relative overflow-hidden">
                        <div class="relative z-10 flex justify-between items-start">
                            <div><p class="text-[10px] text-slate-300 font-bold uppercase tracking-widest">${c.name}</p><h3 class="text-2xl font-black mt-1">${this.fmt(monthInvoice)}</h3><p class="text-[10px] ${isPaid?'text-emerald-400':'text-slate-300'} font-bold uppercase mt-1">Fatura do Mês: ${statusText}</p></div>
                            <div class="flex gap-2">
                                <button onclick="App.viewCardDetails(${c.id}, '${c.name}')" class="text-white/60 hover:text-white hover:bg-white/10 w-8 h-8 rounded-lg transition flex items-center justify-center" title="Ver despesas">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <i class="fab fa-cc-visa text-3xl opacity-50"></i>
                            </div>
                        </div>
                        <div class="relative z-10">
                            <div class="flex justify-between text-[10px] font-bold mb-1 uppercase text-slate-400"><span>Limite Usado (Total)</span><span>${Math.round(pct)}%</span></div>
                            <div class="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden"><div class="h-full bg-emerald-400 transition-all duration-500" style="width: ${pct}%"></div></div>
                            <div class="flex justify-between mt-1 text-[10px] text-slate-400"><span>${this.fmt(totalDebt)} total</span><span>${this.fmt(c.limit)} limite</span></div>
                        </div>
                        <div class="relative z-10 flex justify-between items-end border-t border-white/10 pt-3">
                            <div><p class="text-[8px] text-slate-400 uppercase font-black">Fecha</p><p class="font-bold text-sm">Dia ${c.closing}</p></div>
                            <div class="text-right"><p class="text-[8px] text-slate-400 uppercase font-black">Vence</p><p class="font-bold text-sm">Dia ${c.due}</p></div>
                            <button onclick="App.deleteCard(${c.id})" class="absolute bottom-0 left-[50%] translate-x-[-50%] text-white/20 hover:text-white transition"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`;
                }).join('');
                this.updateSafe('cards-total-month', this.fmt(totalMonthInvoice));
            }
        }
    },

    renderDashboardSummary(data) {
        const grouping = document.getElementById('agrupamentoPeriodo')?.value || 'descricao';
        const container = document.getElementById('dashboard-summary-table');
        if (!container) return;

        this.updateSafe('tituloResumo', 
            grouping === 'dia' ? 'Demonstrativo por Dia' : 
            grouping === 'semana' ? 'Demonstrativo por Semana' : 
            grouping === 'mes' ? 'Demonstrativo por Mês' : 'Resumo por Descrição'
        );
        
        this.updateSafe('headerPeriodo', grouping === 'descricao' ? 'Descrição' : 'Período');

        let groups = {};
        
        data.forEach(t => {
            let key, sortKey;
            if (grouping === 'dia') {
                key = t.effectiveDate.getDate();
                sortKey = key;
            } else if (grouping === 'semana') {
                const firstDay = new Date(t.effectiveDate.getFullYear(), t.effectiveDate.getMonth(), 1).getDay();
                const weekNo = Math.ceil((t.effectiveDate.getDate() + firstDay) / 7);
                key = `Semana ${weekNo}`;
                sortKey = weekNo;
            } else if (grouping === 'mes') {
                key = t.effectiveDate.toLocaleString('pt-BR', { month: 'long' });
                sortKey = t.effectiveDate.getMonth();
            } else {
                key = t.desc;
                sortKey = key;
            }

            if (!groups[key]) groups[key] = { label: grouping==='dia' ? `Dia ${key}` : key, count: 0, income: 0, expense: 0, balance: 0, paid: 0, pending: 0, sortInfo: sortKey };
            
            groups[key].count++;
            const amt = t.amount;
            if (t.type === 'income') {
                groups[key].income += amt;
                groups[key].balance += amt;
            } else {
                groups[key].expense += amt;
                groups[key].balance -= amt;
            }
            if (t.status === 'paid') groups[key].paid += amt; else groups[key].pending += amt;
        });

        let sortedKeys = Object.keys(groups).sort((a,b) => {
            if(grouping === 'descricao') return a.localeCompare(b);
            return groups[a].sortInfo - groups[b].sortInfo;
        });
        
        container.innerHTML = sortedKeys.map(k => {
            const g = groups[k];
            return `<tr>
                <td class="p-4 font-black text-slate-900">${g.label}</td>
                <td class="p-4 text-center font-black text-slate-600 text-base">${g.count}</td>
                <td class="p-4 text-right font-black text-emerald-600 text-base">${this.fmt(g.income)}</td>
                <td class="p-4 text-right font-black text-rose-600 text-base">${this.fmt(g.expense)}</td>
                <td class="p-4 text-right font-black text-lg ${g.balance >= 0 ? 'text-[#006739]' : 'text-rose-600'}">${this.fmt(g.balance)}</td>
                    <td class="p-4 text-right text-xs font-bold">
                        <div class="flex flex-col text-[11px] gap-1">
                            <div class="flex justify-between w-full gap-2 items-center"><span class="text-slate-600">Pg:</span> <span class="text-emerald-600 font-black text-sm">${this.fmt(g.paid)}</span></div>
                            <div class="flex justify-between w-full gap-2 items-center"><span class="text-slate-600">Ab:</span> <span class="text-amber-600 font-black text-sm">${this.fmt(g.pending)}</span></div>
                        </div>
                    </td>
            </tr>`;
        }).join('');
    },

    renderList(data) {
        const tbody = document.getElementById('transactions-table');
        if(!tbody) return;
        
        const groupBy = document.getElementById('agrupamentoRelatorio')?.value || 'none';
        const term = document.getElementById('search-input')?.value.toLowerCase() || '';
        
        let sorted = data.filter(t => t.desc.toLowerCase().includes(term));
        sorted.sort((a,b) => a.effectiveDate - b.effectiveDate);

        const createRow = (t) => {
            const isInc = t.type === 'income';
            let stClass = t.status === 'paid' ? 'status-paid' : 'status-pending';
            if(t.status === 'pending' && t.effectiveDate < new Date().setHours(0,0,0,0)) stClass = 'status-overdue';
            
            return `<tr>
                <td class="p-4 text-slate-700 font-bold">${t.effectiveDate.toLocaleDateString('pt-BR')}${t.displayNote?`<div class="text-[10px] italic text-slate-500">${t.displayNote}</div>`:''}</td>
                <td class="p-4 font-extrabold text-slate-900">${t.desc}</td>
                <td class="p-4">${t.category ? `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-[#004d2c] text-xs font-black uppercase"><i class="fas fa-tag"></i> ${t.category}</span>` : '<span class="text-slate-400 text-xs">Sem categoria</span>'}</td>
                <td class="p-4 text-xs font-bold uppercase text-slate-600">${t.method==='credit'?`<i class="fas fa-credit-card text-amber-500"></i> ${t.originLabel}`:'<i class="fas fa-wallet text-emerald-500"></i> Conta'}</td>
                <td class="p-4"><span class="status-pill ${stClass}">${t.status==='paid'?'Pago':'Pendente'}</span></td>
                <td class="p-4 text-right font-black text-lg ${isInc?'text-emerald-600':'text-rose-600'}">${isInc?'+':'-'} ${this.fmt(t.amount)}</td>
                <td class="p-4 text-center flex justify-center gap-2">
                    <button onclick="App.toggleStatus(${t.id})" class="text-[#006739] hover:text-[#004d2c] mx-1"><i class="fas fa-check-circle"></i></button>
                    <button onclick="Modal.open('transaction', ${t.id})" class="text-amber-500 hover:text-amber-700 mx-1"><i class="fas fa-edit"></i></button>
                    <button onclick="App.deleteTransaction(${t.id})" class="text-rose-400 hover:text-rose-600 mx-1"><i class="fas fa-trash"></i></button>
                </td></tr>`;
        };

        if (groupBy === 'none') {
            tbody.innerHTML = sorted.map(t => createRow(t)).join('');
        } else {
            let groups = {};
            sorted.forEach(t => {
                let key, label;
                if (groupBy === 'dia') {
                    key = t.effectiveDate.toISOString().split('T')[0];
                    label = t.effectiveDate.toLocaleDateString('pt-BR');
                } else if (groupBy === 'semana') {
                    const firstDay = new Date(t.effectiveDate.getFullYear(), t.effectiveDate.getMonth(), 1).getDay();
                    const weekNo = Math.ceil((t.effectiveDate.getDate() + firstDay) / 7);
                    key = `${t.effectiveDate.getFullYear()}-${t.effectiveDate.getMonth()}-w${weekNo}`;
                    label = `Semana ${weekNo}`;
                }
                
                if (!groups[key]) groups[key] = { label, items: [], income: 0, expense: 0, sortKey: t.effectiveDate.getTime() };
                groups[key].items.push(t);
                if (t.type === 'income') groups[key].income += t.amount;
                else groups[key].expense += t.amount;
            });
            
            const keys = Object.keys(groups).sort((a,b) => groups[a].sortKey - groups[b].sortKey);

            // Calcular saldo inicial (tudo que aconteceu antes do primeiro período)
            let saldoAcumulado = 0;
            if (keys.length > 0) {
                const firstDate = new Date(groups[keys[0]].sortKey);
                this.processedTransactions.forEach(t => {
                    if (t.effectiveDate < firstDate) {
                        if (t.type === 'income') saldoAcumulado += t.amount;
                        else saldoAcumulado -= t.amount;
                    }
                });
            }

            let html = '';
            keys.forEach(key => {
                const g = groups[key];
                const movimento = g.income - g.expense;
                saldoAcumulado += movimento;
                
                html += `<tr class="group-header"><td colspan="7" class="p-4 font-black text-sm uppercase tracking-wider"><i class="fas fa-calendar-alt mr-2"></i>${g.label}</td></tr>`;
                html += g.items.map(t => createRow(t)).join('');
                html += `<tr class="group-footer"><td colspan="5" class="p-4 text-right font-bold text-sm text-slate-700">Receitas: <span class="text-emerald-600 font-black text-base">${this.fmt(g.income)}</span> <span class="mx-2">|</span> Despesas: <span class="text-rose-600 font-black text-base">${this.fmt(g.expense)}</span></td><td colspan="2" class="p-4 font-black text-right text-lg ${saldoAcumulado>=0?'text-emerald-600':'text-rose-600'}"><i class="fas fa-calculator mr-2"></i>Saldo: ${this.fmt(saldoAcumulado)}</td></tr>`;
            });
            tbody.innerHTML = html;
        }
    },

    renderAgenda(data) {
        const el = document.getElementById('dashboard-agenda');
        if(!el) return;
        const upcoming = data.filter(t => t.status === 'pending').sort((a,b) => a.effectiveDate - b.effectiveDate);
        el.innerHTML = upcoming.length ? upcoming.map(t => `<div class="flex justify-between items-center border-b-2 border-slate-100 pb-3"><div class="flex items-center gap-3"><div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-purple-600 flex items-center justify-center text-white text-xs font-black flex-col leading-none shadow-lg"><span class="text-lg">${t.effectiveDate.getDate()}</span><span class="text-[9px] opacity-80 mt-0.5">${t.effectiveDate.toLocaleString('pt-BR', {month: 'short'}).toUpperCase()}</span></div><div><p class="text-sm font-black text-slate-900">${t.desc}</p><p class="text-[10px] text-slate-500 uppercase font-bold mt-0.5"><i class="fas fa-credit-card mr-1"></i>${t.originLabel}</p></div></div><span class="font-black text-base ${t.type==='income'?'text-emerald-600':'text-rose-600'}">${this.fmt(t.amount)}</span></div>`).join('') : '<p class="text-sm text-slate-400 italic">Nada pendente.</p>';
    },

    renderChart(monthTrans) {
        const ctx = document.getElementById('mainChart');
        if(!ctx) return;
        if(window.myChart) window.myChart.destroy();
        
        const m = this.currentDate.getMonth(), y = this.currentDate.getFullYear();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const labels = [];
        const incRealAcum = [];
        const incTotalAcum = [];
        const expRealAcum = [];
        const expTotalAcum = [];
        
        // Calcular saldo inicial (tudo antes do mês atual)
        let incRealInicial = 0, incTotalInicial = 0;
        let expRealInicial = 0, expTotalInicial = 0;
        const startOfMonth = new Date(y, m, 1);
        
        this.processedTransactions.forEach(t => {
            if (t.effectiveDate < startOfMonth) {
                if (t.type === 'income') {
                    incTotalInicial += t.amount;
                    if (t.status === 'paid') incRealInicial += t.amount;
                } else {
                    expTotalInicial += t.amount;
                    if (t.status === 'paid') expRealInicial += t.amount;
                }
            }
        });
        
        let accIncReal = incRealInicial;
        let accIncTotal = incTotalInicial;
        let accExpReal = expRealInicial;
        let accExpTotal = expTotalInicial;
        
        for(let day = 1; day <= daysInMonth; day++) {
            labels.push(day);
            const dayTrans = monthTrans.filter(t => t.effectiveDate.getDate() === day);
            
            dayTrans.forEach(t => {
                if(t.type === 'income') {
                    accIncTotal += t.amount;
                    if(t.status === 'paid') accIncReal += t.amount;
                } else {
                    accExpTotal += t.amount;
                    if(t.status === 'paid') accExpReal += t.amount;
                }
            });
            
            incRealAcum.push(accIncReal);
            incTotalAcum.push(accIncTotal);
            expRealAcum.push(accExpReal);
            expTotalAcum.push(accExpTotal);
        }
        
        window.myChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Receita Realizada', data: incRealAcum, borderColor: '#059669', backgroundColor: 'rgba(5, 150, 105, 0.1)', borderWidth: 3, tension: 0.3, fill: false },
                    { label: 'Receita Total (Real + Prevista)', data: incTotalAcum, borderColor: '#86efac', backgroundColor: 'rgba(134, 239, 172, 0.05)', borderWidth: 2, tension: 0.3, fill: false, borderDash: [5, 5] },
                    { label: 'Despesa Realizada', data: expRealAcum, borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)', borderWidth: 3, tension: 0.3, fill: false },
                    { label: 'Despesa Total (Real + Prevista)', data: expTotalAcum, borderColor: '#fca5a5', backgroundColor: 'rgba(252, 165, 165, 0.05)', borderWidth: 2, tension: 0.3, fill: false, borderDash: [5, 5] }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            }
                        }
                    }
                }, 
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        grid: { color: '#f1f5f9' },
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                        }
                    }, 
                    x: { 
                        grid: { display: false },
                        title: { display: true, text: 'Dia do Mês', font: { size: 11, weight: 'bold' } }
                    } 
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    },

    renderCategoryChart(monthTrans) {
        const ctx = document.getElementById('categoryChart');
        if(!ctx) return;
        if(window.categoryChartInstance) window.categoryChartInstance.destroy();
        
        const m = this.currentDate.getMonth(), y = this.currentDate.getFullYear();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const labels = [];
        const startOfMonth = new Date(y, m, 1);
        
        // Obter todas as categorias únicas (do mês atual e anteriores)
        const categoriesSet = new Set();
        this.processedTransactions.forEach(t => {
            const cat = t.category || 'Sem Categoria';
            categoriesSet.add(cat);
        });
        const categories = Array.from(categoriesSet).sort();
        
        // Cores para as categorias
        const colors = [
            '#059669', '#dc2626', '#2563eb', '#7c3aed', '#ea580c', 
            '#0891b2', '#be123c', '#65a30d', '#c026d3', '#0d9488'
        ];
        
        const datasets = [];
        
        // Criar datasets para cada categoria
        categories.forEach((cat, idx) => {
            const color = colors[idx % colors.length];
            const colorLight = color + '80'; // versão clara
            
            // Calcular saldo inicial (tudo antes do mês atual desta categoria)
            let initialReal = 0;
            let initialTotal = 0;
            
            this.processedTransactions.forEach(t => {
                if (t.effectiveDate < startOfMonth && (t.category || 'Sem Categoria') === cat) {
                    initialTotal += t.amount;
                    if (t.status === 'paid') initialReal += t.amount;
                }
            });
            
            const acumReal = [];
            const acumTotal = [];
            let accReal = initialReal;
            let accTotal = initialTotal;
            
            for(let day = 1; day <= daysInMonth; day++) {
                const dayTrans = monthTrans.filter(t => 
                    t.effectiveDate.getDate() === day && 
                    (t.category || 'Sem Categoria') === cat
                );
                
                dayTrans.forEach(t => {
                    accTotal += t.amount;
                    if(t.status === 'paid') accReal += t.amount;
                });
                
                acumReal.push(accReal);
                acumTotal.push(accTotal);
            }
            
            // Linha sólida para valores realizados
            datasets.push({
                label: cat + ' (Realizado)',
                data: acumReal,
                borderColor: color,
                backgroundColor: 'rgba(0,0,0,0)',
                borderWidth: 3,
                tension: 0.3,
                fill: false
            });
            
            // Linha tracejada para valores totais
            datasets.push({
                label: cat + ' (Total)',
                data: acumTotal,
                borderColor: colorLight,
                backgroundColor: 'rgba(0,0,0,0)',
                borderWidth: 2,
                tension: 0.3,
                fill: false,
                borderDash: [5, 5]
            });
        });
        
        for(let day = 1; day <= daysInMonth; day++) {
            labels.push(day);
        }
        
        window.categoryChartInstance = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 12,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9' },
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                            }
                        }
                    },
                    x: {
                        grid: { display: false },
                        title: { display: true, text: 'Dia do Mês', font: { size: 11, weight: 'bold' } }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    },

    fmt(v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
};

const DataMgr = {
    async export() { 
        const data = { transactions: Store.transactions, cards: Store.cards, categories: Store.categories };
        const d="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(data)); 
        const a=document.createElement('a'); a.href=d; a.download=`Fluxo360_SQL_${new Date().toISOString().slice(0,10)}.json`; 
        document.body.appendChild(a); a.click(); a.remove(); 
    },
    import(e) { 
        if(!confirm("Isso irá mesclar/sobrescrever dados. Continuar?")) return;
        const r=new FileReader(); 
        r.onload= async (ev)=>{
            try {
                const d=JSON.parse(ev.target.result); 
                if(d.transactions) {
                    for(const t of d.transactions) await window.DB.saveTransaction(t);
                }
                if(d.cards) {
                    for(const c of d.cards) await window.DB.saveCard(c);
                }
                if(d.categories) {
                    for(const cat of d.categories) await window.DB.addCategory(cat);
                }
                await Store.init();
                location.reload();
            } catch(er) {
                console.error(er);
                alert("Erro na importação: " + er);
            }
        }; 
        r.readAsText(e.target.files[0]); 
    },
    async nuke() { 
        if(confirm("Apagar TUDO do Banco de Dados?")) { 
            await window.DB.nuke();
            await Store.init();
            location.reload(); 
        } 
    },
    async seed() {
        if(!confirm("Gerar dados de teste?")) return;
        const y=new Date().getFullYear(), m=String(new Date().getMonth()+1).padStart(2,'0');
        await window.DB.saveCard({id:1,name:"Nubank",limit:5000,closing:10,due:17});
        await window.DB.saveTransaction({id:1,desc:"Saldo Inicial",amount:5000,date:`2023-12-01`,method:"money",status:"paid",type:"income",cardId:null,use5thDay:false});
        await window.DB.saveTransaction({id:2,desc:"Mercado",amount:450,date:`${y}-${m}-15`,method:"credit",status:"pending",type:"expense",cardId:1,use5thDay:false});
        await Store.init();
        location.reload();
    }
};

// Não precisamos esperar onload se o script estiver no final do body, 
// mas para garantir:
window.onload = () => App.init();