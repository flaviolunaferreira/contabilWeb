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
    recurrences: [],
    // Lista base de objetos. Se DB vazio, salva estes.
    categories: [
        {name: 'Alimentação', type: 'fixed', color: '#f59e0b', icon: 'fa-utensils', budget_limit: 0},
        {name: 'Moradia', type: 'fixed', color: '#3b82f6', icon: 'fa-home', budget_limit: 0},
        {name: 'Transporte', type: 'variable', color: '#6366f1', icon: 'fa-car', budget_limit: 0},
        {name: 'Saúde', type: 'fixed', color: '#ef4444', icon: 'fa-heartbeat', budget_limit: 0},
        {name: 'Educação', type: 'fixed', color: '#8b5cf6', icon: 'fa-graduation-cap', budget_limit: 0},
        {name: 'Lazer', type: 'variable', color: '#ec4899', icon: 'fa-cocktail', budget_limit: 0},
        {name: 'Vestuário', type: 'variable', color: '#14b8a6', icon: 'fa-tshirt', budget_limit: 0},
        {name: 'Investimentos', type: 'investment', color: '#10b981', icon: 'fa-chart-line', budget_limit: 0},
        {name: 'Outros', type: 'variable', color: '#64748b', icon: 'fa-box', budget_limit: 0}
    ],
    async init() {
        try {
            // Carrega dados do SQL via Preload
            this.transactions = await window.DB.getAllTransactions() || [];
            this.cards = await window.DB.getAllCards() || [];
            this.recurrences = await window.DB.getRecurring() || [];
            
            const dbCats = await window.DB.getAllCategories() || [];
            if (dbCats && dbCats.length > 0) {
                // Mapeia do DB
                this.categories = dbCats;
            } else {
                // Se DB vazio, salva as padrão
                for(const c of this.categories) await window.DB.addCategory(c);
            }
            this.categories.sort((a,b) => a.name.localeCompare(b.name));

            await this.checkRecurringGenerator();

        } catch(e) {
            console.error("Erro ao carregar DB", e);
            alert("Erro ao carregar banco de dados!");
        }
    },
    async checkRecurringGenerator() {
        if(!this.recurrences || !this.recurrences.length) return;
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        let newTransactions = [];
        
        for(const rule of this.recurrences) {
             // Verificar se já existe transação gerada para este mês (recurrence_id e data no mês atual)
             const exists = this.transactions.some(t => {
                 if(t.recurrence_id !== rule.id) return false;
                 // Parse date YYYY-MM-DD
                 const parts = t.date.split('-');
                 // parts[0] = Year, parts[1] = Month (01-12)
                 return parseInt(parts[1]) - 1 === currentMonth && parseInt(parts[0]) === currentYear;
             });
             
             if(!exists) {
                 // Gerar
                 let day = rule.day;
                 // Validar dia (ex: 31 em Fev)
                 const maxDimensions = new Date(currentYear, currentMonth+1, 0).getDate();
                 day = Math.min(day, maxDimensions);
                 
                 const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                 
                 newTransactions.push({
                     id: Math.floor(Date.now() + Math.random() * 1000), // Temp ID
                     desc: rule.desc,
                     amount: rule.amount,
                     date: dateStr,
                     method: 'debit', // Padrão
                     status: 'pending',
                     type: 'expense',
                     cardId: null,
                     use5thDay: false,
                     category: rule.category,
                     checked: false,
                     recurrence_id: rule.id
                 });
             }
        }
        
        if(newTransactions.length > 0) {
            console.log("Gerando recorrências:", newTransactions);
            for(const t of newTransactions) {
                await window.DB.saveTransaction(t);
            }
            // Recarrega transações para view atualizada
            this.transactions = await window.DB.getAllTransactions();
        }
    },
    async saveRecurring(r) {
        await window.DB.saveRecurring(r);
        await this.init();
    },
    async deleteRecurring(id) {
        if(confirm('Deseja parar esta recorrência? As transações geradas não serão apagadas.')) {
            await window.DB.deleteRecurring(id);
            await this.init();
        }
    },
    getCategory(name) {
        return this.categories.find(c => c.name === name) || {name: name, type: 'variable', color: '#94a3b8', icon: 'fa-tag'};
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
    async addCategory(catObj) {
        // catObj: {name, type, color, icon, budget_limit} ou string (compatibilidade)
        if(typeof catObj === 'string') {
            catObj = { name: catObj.trim(), type: 'variable', color: '#64748b', icon: 'fa-tag', budget_limit: 0 };
        }
        
        if (catObj.name && !this.categories.some(c => c.name === catObj.name)) {
            await window.DB.addCategory(catObj);
            await this.init();
            return true;
        }
        return false;
    },
    async updateCategoryBudget(name, amount) {
        const cat = this.categories.find(c => c.name === name);
        if(cat) {
            cat.budget_limit = parseFloat(amount) || 0;
            // Preserva outros campos
            await window.DB.updateCategory(cat);
        }
    },
    async deleteCategory(name) {
        if(confirm(`Tem certeza que deseja remover a categoria "${name}"? Os lançamentos ficarão sem metadados.`)) {
            await window.DB.deleteCategory(name);
            await this.init();
        }
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
            // Garantir que todos os campos estejam habilitados (Reseta estados travados anteriores)
            const modal = document.getElementById('modal-transaction');
            const inputs = modal.querySelectorAll('input, select, textarea');
            inputs.forEach(el => {
                el.disabled = false;
                el.readOnly = false;
                el.removeAttribute('disabled');
                el.removeAttribute('readonly');
            });
            
            // Garantir botão salvar
            const btnSave = document.getElementById('btn-save-transaction');
            if(btnSave) {
                btnSave.disabled = false;
                btnSave.innerText = 'Salvar';
            }

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
                
                // Categoria agora é string, mas verificamos se existe no Store
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
                
                // Reset Completo de Estado
                document.getElementById('t-method').value = "money";
                document.querySelector('input[name="t-status"][value="paid"]').checked = true;
                this.toggleCardSelect(); // Garante resets visuais (like pointer-events)
                
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
            datalist.innerHTML = Store.categories.map(cat => `<option value="${cat.name}">`).join('');
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
            tbody.innerHTML = '<tr><td colspan="8" class="p-8 text-center text-slate-400 italic">Nenhuma despesa encontrada para os filtros selecionados</td></tr>';
        } else {
            tbody.innerHTML = transactions.map(t => {
                const stClass = t.status === 'paid' ? 'status-paid' : 'status-pending';
                const isChecked = t.checked ? 'checked' : '';
                const catObj = Store.getCategory(t.category);
                return `<tr>
                    <td class="p-3 font-mono text-[10px] text-slate-400 text-center">#${t.id}</td>
                    <td class="p-3 text-center">
                        <input type="checkbox" ${isChecked} onchange="App.toggleChecked(${t.id})" class="w-5 h-5 accent-[#006739] cursor-pointer" title="Marcar como conferido">
                    </td>
                    <td class="p-3 text-slate-700 font-medium text-sm">${t.effectiveDate.toLocaleDateString('pt-BR')}</td>
                    <td class="p-3 font-bold text-slate-900">${t.desc}${t.displayNote?`<div class="text-[9px] italic text-slate-500 mt-0.5">${t.displayNote}</div>`:''}</td>
                    <td class="p-3">
                        ${(() => {
                            if(!t.category) return '<span class="text-slate-400 text-xs">-</span>';
                            const c = Store.getCategory(t.category);
                            return `<span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase" style="background-color: ${c.color}20; color: ${c.color}"><i class="fas ${c.icon||'fa-tag'}"></i> ${t.category}</span>`;
                        })()}
                    </td>
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
                Store.categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
            if (currentValue) filter.value = currentValue;
        }
    },
    navigate(view) {
        this.currentView = view;
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.getElementById(`nav-${view}`).classList.add('active');
        
        // Hide all views
        ['dashboard', 'lancamentos', 'cartoes', 'analise', 'conselheiro', 'config'].forEach(v => {
            const el = document.getElementById(`view-${v}`);
            if(el) el.classList.add('hidden');
        });

        const target = document.getElementById(`view-${view}`);
        if(target) target.classList.remove('hidden');
        
        if(view === 'conselheiro') this.renderConselheiro();
        if(view === 'config') this.renderCategoryConfigList();
        
        this.render();
    },
    changeDate(months) { this.currentDate.setMonth(this.currentDate.getMonth() + months); this.render(); },
    
    async addCategoryFromConfig() {
        const name = document.getElementById('cat-manage-name').value;
        const type = document.getElementById('cat-manage-type').value;
        const color = document.getElementById('cat-manage-color').value;
        const budget = parseFloat(document.getElementById('cat-manage-budget').value) || 0;
        
        if(!name) return alert("Digite o nome da categoria!");
        
        const success = await Store.addCategory({ name, type, color, budget_limit: budget });
        if(success) {
            document.getElementById('cat-manage-name').value = '';
            document.getElementById('cat-manage-budget').value = ''; // Clear budget field
            this.renderCategoryConfigList();
        } else {
            alert("Categoria já existe!");
        }
    },
    
    renderCategoryConfigList() {
        const list = document.getElementById('config-cat-list');
        if(!list) return;
        
        const translateType = {
            'fixed': 'Despesa Fixa',
            'variable': 'Despesa Variável',
            'investment': 'Investimento',
            'asset': 'Bens/Patrimônio'
        };
        
        list.innerHTML = Store.categories.map(c => `
            <div class="flex items-center justify-between p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg shadow-sm flex items-center justify-center text-white" style="background-color: ${c.color}">
                        <i class="fas ${c.icon || 'fa-tag'}"></i>
                    </div>
                    <div>
                        <p class="font-bold text-slate-800 text-sm">${c.name}</p>
                        <p class="text-[10px] text-slate-500 uppercase font-bold">${translateType[c.type] || c.type}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                     <div class="flex flex-col items-end mr-2">
                        <span class="text-[9px] font-bold text-slate-400 uppercase">Teto</span>
                        <input type="number" value="${c.budget_limit || ''}" placeholder="∞" 
                            class="w-20 p-1 text-xs border border-slate-200 rounded focus:border-indigo-500 text-right font-bold text-slate-700" 
                            onchange="Store.updateCategoryBudget('${c.name}', this.value)" title="Definir Teto de Gastos (0 = Sem Limite)">
                     </div>
                    <button onclick="Store.deleteCategory('${c.name}').then(() => App.renderCategoryConfigList())" class="text-rose-400 hover:text-rose-600 transition w-8">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    async saveTransaction() {
        // Bloquear botão imediato
        const btnSave = document.getElementById('btn-save-transaction');
        if (btnSave) {
            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        }

        try {
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
            
            // Juros
            const isFinancing = document.getElementById('t-is-financing')?.checked;
            let interestRate = isFinancing ? parseFloat(document.getElementById('t-interest').value) : null;
            if (interestRate && isNaN(interestRate)) interestRate = null;

            if (!desc || isNaN(amount) || !dateVal || !Modal.selectedType) {
                if (btnSave) {
                    btnSave.disabled = false;
                    btnSave.innerText = 'Salvar';
                }
                return alert("Preencha todos os campos!");
            }

            // Adicionar categoria automaticamente se for nova
            if (category && !Store.categories.some(c => c.name === category)) {
                await Store.addCategory(category);
                this.populateCategoryFilter();
            }

            const baseT = { 
                amount, method, status, type: Modal.selectedType, 
                cardId: method === 'credit' ? cardId : null, 
                use5thDay: Modal.selectedType === 'income' ? use5thDay : false, 
                category: category || null,
                interest_rate: interestRate
            };

            if(id) {
                // Edição
                await Store.saveTransaction({ id: parseInt(id), ...baseT, desc: desc, date: dateVal, checked: false });
                alert("Transação atualizada com sucesso!");
            } else {
                // Nova(s)
                let startDate = new Date(dateVal + 'T00:00:00');
                const updates = [];
                for (let i = 0; i < repeatCount; i++) {
                    let nextDate = addMonthsPreservingDay(startDate, i);
                    const isoDate = nextDate.toISOString().split('T')[0];
                    let finalDesc = desc;
                    if (repeatCount > 1) finalDesc = `${desc} (${i + 1}/${repeatCount})`;
                    
                    updates.push(Store.saveTransaction({ ...baseT, desc: finalDesc, date: isoDate, checked: false }));
                }
                await Promise.all(updates);
                alert(`${repeatCount} transação(ões) salva(s) com sucesso!`);
            }
            
            Modal.close();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar: " + error.message);
        } finally {
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerText = 'Salvar';
            }
            
            // Destrava final de segurança
            const modal = document.getElementById('modal-transaction');
            if(modal) {
                 const inputs = modal.querySelectorAll('input, select, textarea');
                 inputs.forEach(el => {
                     el.disabled = false;
                     el.readOnly = false;
                 });
            }

            this.render();
        }
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
            let freeBalance = balReal - expPend;
            this.updateSafe('kpi-free-balance', this.fmt(freeBalance));
            this.updateSafe('kpi-current-cash', this.fmt(balReal));
            this.updateSafe('kpi-reserve', `- ${this.fmt(expPend)}`);
            this.updateSafe('sidebar-balance', this.fmt(freeBalance));

            this.renderChart(monthTrans);
            this.renderCategoryChart(monthTrans);
            this.renderAgenda(monthTrans);
            this.renderDashboardSummary(monthTrans);
            this.renderBudgetProgress(monthTrans);
        }
        if(this.currentView === 'lancamentos') this.renderList(monthTrans);
        
        if(this.currentView === 'analise') this.renderAnalise(monthTrans);
        if(this.currentView === 'conselheiro') this.renderConselheiro();
        if(this.currentView === 'config') this.renderConfig();

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

    renderBudgetProgress(monthTrans) {
        const container = document.getElementById('budget-progress-container');
        if(!container) return;
        
        // Agrupar gastos por categoria
        const expensesByCat = {};
        monthTrans.filter(t => t.type === 'expense').forEach(t => {
            expensesByCat[t.category] = (expensesByCat[t.category] || 0) + t.amount;
        });
        
        let html = '';
        let hasBudgets = false;

        Store.categories.forEach(c => {
            if(c.budget_limit > 0) {
                hasBudgets = true;
                const spent = expensesByCat[c.name] || 0;
                const pct = Math.min(100, (spent / c.budget_limit) * 100);
                const isOver = spent > c.budget_limit;
                
                // Cores: Safe (Emerald) < 80% < Warning (Amber) < 100% < Danger (Rose)
                let statusColor = 'bg-emerald-500';
                let textColor = 'text-emerald-600';
                
                if(isOver) {
                    statusColor = 'bg-rose-500';
                    textColor = 'text-rose-600';
                } else if(pct >= 80) {
                    statusColor = 'bg-amber-400';
                    textColor = 'text-amber-600';
                }
                
                html += `
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:shadow-md transition">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded flex items-center justify-center text-white text-xs" style="background-color: ${c.color}"><i class="fas ${c.icon || 'fa-tag'}"></i></div>
                            <span class="font-bold text-slate-700 text-sm">${c.name}</span>
                        </div>
                        <span class="text-xs font-bold ${textColor}">${Math.round((spent / c.budget_limit) * 100)}%</span>
                    </div>
                    <div class="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-2">
                        <div class="h-full ${statusColor} transition-all duration-500" style="width: ${pct}%"></div>
                    </div>
                    <div class="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                        <span>${this.fmt(spent)}</span>
                        <span>Meta: ${this.fmt(c.budget_limit)}</span>
                    </div>
                </div>`;
            }
        });
        
        if(!hasBudgets) {
            container.innerHTML = `<div class="col-span-1 md:col-span-3 flex flex-col items-center justify-center text-slate-400 py-6 border-2 border-dashed border-slate-200 rounded-xl">
                <i class="fas fa-bullseye text-3xl mb-2 opacity-30"></i>
                <p class="text-sm font-bold opacity-60">Nenhum teto de gastos definido</p>
                <p class="text-xs italic opacity-50 mt-1 cursor-pointer hover:text-indigo-500 transition" onclick="App.navigate('config')">Vá em Ajustes para definir metas por categoria</p>
            </div>`;
        } else {
            container.innerHTML = html;
        }
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
        
        const datasets = [];
        
        // Criar datasets para cada categoria encontrada
        categories.forEach((cat) => {
            const catObj = Store.getCategory(cat);
            const color = catObj.color || '#94a3b8';
            const colorLight = color + '40'; 

            // Só processa se tiver transação (já garantido pelo set, mas verificamos filtro mês/saldo)
            
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
            
            // Só visualiza se tiver movimento ou saldo
            // Se o saldo total final (accTotal) for zero E não tiver movimento no mês...
            if(accTotal !== 0 || accReal !== 0 || monthTrans.some(t => (t.category || 'Sem Categoria') === cat)) {
                
                datasets.push({
                    label: cat + ' (Realizado)',
                    data: acumReal,
                    borderColor: color,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: false
                });
                
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
            }
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

    async addRecurring() {
        const desc = document.getElementById('rec-desc').value;
        const amount = parseFloat(document.getElementById('rec-amount').value);
        const day = parseInt(document.getElementById('rec-day').value);
        const category = document.getElementById('rec-category').value;
        
        if(!desc || !amount || !day || !category) return alert("Preencha todos os campos!");
        
        await Store.saveRecurring({
            id: Date.now(), // será substituido pelo DB se novo
            desc, amount, day, category, active: 1
        });
        
        alert("Despesa fixa adicionada com sucesso!");
        // Limpar campos
        document.getElementById('rec-desc').value = '';
        document.getElementById('rec-amount').value = '';
        document.getElementById('rec-day').value = '';
        
        this.renderConfig();
    },

    renderConfig() {
        // --- RECORRÊNCIAS ---
        const recContainer = document.getElementById('config-recurring-list');
        const recCatSelect = document.getElementById('rec-category');
        
        if(recCatSelect && recCatSelect.options.length <= 1) { // Só preenche se não tiver (1 é o placeholder)
             recCatSelect.innerHTML = '<option value="" disabled selected>Categoria</option>' + 
                Store.categories.filter(c => c.type === 'fixed' || c.type === 'variable').map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        }

        if(recContainer) {
            if(!Store.recurrences || Store.recurrences.length === 0) {
                recContainer.innerHTML = `<p class="text-slate-400 text-sm italic">Nenhuma despesa fixa cadastrada. Adicione aluguel, luz, internet, etc.</p>`;
            } else {
                recContainer.innerHTML = Store.recurrences.map(r => `
                    <div class="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg">
                        <div>
                            <p class="font-bold text-slate-800">${r.desc}</p>
                            <p class="text-xs text-slate-500">Todo dia ${r.day} • ${this.fmt(r.amount)} • <span class="uppercase font-bold text-[10px] bg-slate-100 px-1 rounded">${r.category}</span></p>
                        </div>
                        <button onclick="Store.deleteRecurring(${r.id})" class="text-rose-400 hover:text-rose-600 transition" title="Parar Recorrência"><i class="fas fa-trash"></i></button>
                    </div>
                `).join('');
            }
        }
    },

    renderAnalise(monthTrans) {
        const container = document.getElementById('analise-container');
        if (!container) return;

        // --- 1. DADOS BASE ---
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        // Lógica de Investimento baseada no TIPO da Categoria
        const isInvestment = (t) => {
           if(!t.category) return false;
           // Busca o objeto categoria completo
           const catObj = Store.getCategory(t.category);
           if (!catObj) return false;
           
           // Se for do tipo investimento ou patrimonio/asset, retorna true
           return catObj.type === 'investment' || catObj.type === 'asset';
        };

        // Renda e Despesa do Mês (para base de cálculo)
        const incomes = monthTrans.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
        
        // Separa Despesas de Investimentos/Patrimônio
        const operationalExpenses = monthTrans.filter(t => t.type === 'expense' && !isInvestment(t)).reduce((a, b) => a + b.amount, 0);
        const investments = monthTrans.filter(t => t.type === 'expense' && isInvestment(t)).reduce((a, b) => a + b.amount, 0);

        // Agora a margem livre ignora aportes em patrimônio
        const margemLivre = incomes - operationalExpenses;

        // Identificar dívidas parceladas FUTURAS para antecipação
        // Procura padrões como "Nome (1/12)" nas pendentes GERAIS do banco de dados, não só do mês
        const futureInstallments = {};
        this.processedTransactions.forEach(t => {
            if (t.type === 'expense' && t.status === 'pending' && t.effectiveDate > hoje) {
                const match = t.desc.match(/(.*)\s\((\d+)\/(\d+)\)/);
                if (match) {
                    const name = match[1].trim();
                    // const currentParcel = parseInt(match[2]);
                    // const totalParcel = parseInt(match[3]);
                    
                    if (!futureInstallments[name]) {
                        futureInstallments[name] = { 
                            totalAmount: 0, 
                            count: 0, 
                            sampleAmount: t.amount, 
                            name: name,
                            rate: t.interest_rate // Pega a taxa salva (se houver)
                        };
                    }
                    futureInstallments[name].totalAmount += t.amount;
                    futureInstallments[name].count++;
                    // Se algum item do grupo tem taxa, assume pro grupo
                    if (t.interest_rate && !futureInstallments[name].rate) futureInstallments[name].rate = t.interest_rate;
                }
            }
        });

        // --- 2. HTML STRUCTURE ---
        let html = `
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 text-left animate-fade-in-up">
                
                <!-- COLUNA 1: GESTÃO & ANTECIPAÇÃO -->
                <div class="space-y-6">
                    <h3 class="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <i class="fas fa-rocket text-indigo-600"></i> Acelerador de Riqueza
                    </h3>

                    <!-- SIMULADOR DE ANTECIPAÇÃO -->
                    <div class="glass-card p-6 relative overflow-visible group">
                        <div class="absolute -top-4 -right-4 bg-indigo-100 p-2 rounded-full opacity-50">
                            <i class="fas fa-chart-line text-4xl text-indigo-300"></i>
                        </div>
                        <h4 class="font-bold text-slate-800 mb-2">Otimização de Dívidas</h4>
                        <p class="text-xs text-slate-500 mb-4">Descubra se vale a pena antecipar. Cadastre a taxa real para precisão máxima.</p>
                        
                        ${Object.keys(futureInstallments).length === 0 
                            ? `<p class="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg">Você não possui parcelamentos futuros detectados para antecipar.</p>` 
                            : `<div class="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                ${Object.keys(futureInstallments).map(key => {
                                    const item = futureInstallments[key];
                                    
                                    // Taxa de Comparação
                                    let discountRate = 0.008; 
                                    let isCalibrated = false;

                                    if(item.rate) {
                                        discountRate = item.rate / 100;
                                        isCalibrated = true;
                                    }

                                    const avgMonths = item.count / 2; 
                                    const presentValue = item.totalAmount / Math.pow(1 + discountRate, avgMonths);
                                    let discount = item.totalAmount - presentValue;

                                    // PROTEÇÃO: Escapar aspas simples no nome para não quebrar o onclick
                                    const safeName = item.name.replace(/'/g, "\\'");
                                    
                                    return `
                                    <div class="p-4 bg-white border ${isCalibrated ? 'border-indigo-200' : 'border-slate-100'} rounded-xl hover:shadow-md transition relative">
                                        <div class="flex justify-between items-start mb-2">
                                            <div>
                                                <p class="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                    ${item.name}
                                                    ${isCalibrated ? '<span class="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">CALIBRADO</span>' : ''}
                                                </p>
                                                <p class="text-[10px] text-slate-500 font-bold uppercase">${item.count} parcelas • Total ${this.fmt(item.totalAmount)}</p>
                                            </div>
                                            <div class="text-right">
                                                ${isCalibrated 
                                                    ? `<p class="text-[10px] text-slate-400">Juros de <b class="text-rose-500">${item.rate}% a.m.</b></p>`
                                                    : `<button onclick="App.calibrateInterest('${safeName}', ${item.totalAmount}, ${item.count})" class="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200 transition">
                                                         <i class="fas fa-calculator"></i> Calcular Juros
                                                       </button>`
                                                }
                                            </div>
                                        </div>

                                        
                                        ${isCalibrated ? `
                                            <div class="mt-2 pt-2 border-t border-indigo-50 flex justify-between items-center bg-indigo-50/30 p-2 rounded-lg">
                                                <span class="text-xs text-indigo-800 font-bold">Economia se quitar hoje:</span>
                                                <span class="text-base font-black text-emerald-600">+ ${this.fmt(discount)}</span>
                                            </div>
                                            <p class="text-[9px] text-slate-400 mt-1 text-center">
                                                ${item.rate > 0.9 
                                                  ? `<i class="fas fa-check-circle text-emerald-500"></i> Antecipar vale a pena! (Juros ${item.rate}% > CDI 0.9%)` 
                                                  : `<i class="fas fa-times-circle text-amber-500"></i> Não antecipe. Invista o dinheiro (CDI 0.9% > Juros ${item.rate}%)`}
                                            </p>
                                        ` : `
                                            <p class="text-[10px] text-slate-400 mt-2 italic border-t border-slate-50 pt-2 text-center">
                                                Para saber se vale a pena antecipar, clique em "Calcular Juros" acima.
                                            </p>
                                        `}
                                    </div>`;
                                }).join('')}
                               </div>`
                        }
                    </div>

                    <!-- PROJEÇÃO DE FLUXO LIVRE -->
                    <div class="glass-card p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="font-bold text-lg">Potencial de Investimento</h4>
                            <div class="bg-white/10 px-3 py-1 rounded-full text-xs font-bold">Mensal</div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p class="text-slate-400 text-xs uppercase font-bold">Fluxo Operacional</p>
                                <p class="text-xl font-bold ${margemLivre > 0 ? 'text-emerald-400' : 'text-rose-400'}">
                                    ${this.fmt(margemLivre)}
                                </p>
                            </div>
                            <div class="text-right">
                                <p class="text-slate-400 text-xs uppercase font-bold">Patrimônio (+)</p>
                                <p class="text-xl font-bold text-amber-300">
                                    ${this.fmt(investments)}
                                </p>
                            </div>
                        </div>
                        <div class="text-right mb-4">
                            <p class="text-slate-400 text-xs uppercase font-bold">Projeção de Fluxo Anual</p>
                            <p class="text-xl font-bold text-indigo-300">
                                ${this.fmt(margemLivre * 12)}
                            </p>
                        </div>
                        <p class="text-xs text-slate-400 leading-relaxed border-t border-white/10 pt-3">
                            <i class="fas fa-info-circle mr-1"></i> "Fluxo Operacional" é o dinheiro que sobra após pagar custos de vida (sem contar investimentos/casa/carro). <br/>
                            <i class="fas fa-chart-pie mr-1"></i> Se mantiver esse padrão, em 5 anos você terá gerado <b class="text-white">${this.fmt((margemLivre * 12 * 5) * 1.3)}</b> de caixa livre (além dos ativos já comprados).
                        </p>
                    </div>
                </div>

                <!-- COLUNA 2: SIMULADORES E METAS -->
                <div class="space-y-6">
                    <h3 class="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <i class="fas fa-university text-emerald-600"></i> Construção de Patrimônio
                    </h3>

                    <!-- SIMULADOR DA CAIXINHA -->
                    <div class="glass-card p-6" id="sim-box-card">
                        <h4 class="font-bold text-slate-800 mb-2 flex justify-between">
                            <span>Simulador de "Caixinha"</span>
                            <i class="fas fa-sliders-h text-slate-400"></i>
                        </h4>
                        <p class="text-xs text-slate-500 mb-6">Quanto da sua renda você aceita separar todo mês para dias difíceis?</p>

                        <div class="mb-6">
                            <div class="flex justify-between text-xs font-bold text-slate-600 mb-2">
                                <span>Contribuir: <span id="sim-input-val" class="text-emerald-600 text-base">10%</span> da Renda</span>
                                <span>Renda Info: ${this.fmt(incomes)}</span>
                            </div>
                            <input type="range" min="1" max="50" value="10" class="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" 
                                oninput="App.updateCaixinhaSim(${incomes}, this.value)">
                        </div>

                        <div class="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                            <div class="flex justify-between items-center mb-3">
                                <span class="text-xs font-bold text-emerald-800 uppercase">Aporte Mensal</span>
                                <span class="font-black text-emerald-700 text-lg" id="sim-aporte-val">${this.fmt(incomes * 0.1)}</span>
                            </div>
                             <div class="space-y-2">
                                <div class="flex justify-between text-sm text-slate-600">
                                    <span>Em 6 meses:</span>
                                    <span class="font-bold text-slate-800" id="sim-result-6m">${this.fmt(incomes * 0.1 * 6)}</span>
                                </div>
                                <div class="flex justify-between text-sm text-slate-600">
                                    <span>Em 1 ano:</span>
                                    <span class="font-bold text-slate-800" id="sim-result-12m">${this.fmt(incomes * 0.1 * 12)}</span>
                                </div>
                                <div class="flex justify-between text-sm text-slate-600 pt-2 border-t border-emerald-200/50">
                                    <span>Meta (reserva de 3 meses):</span>
                                    <span class="font-bold text-emerald-700">${this.fmt(operationalExpenses * 3)}</span>
                                </div>
                                <p class="text-[10px] text-right text-slate-400 mt-1" id="sim-meta-text">
                                    Você atingiria sua segurança em <b>${Math.ceil((operationalExpenses * 3) / (incomes * 0.1))} meses</b>.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- ADVICE CARD -->
                    <div class="p-6 rounded-2xl bg-amber-50 border border-amber-100">
                        <div class="flex gap-4">
                            <div class="text-amber-500 text-2xl mt-1"><i class="fas fa-lightbulb"></i></div>
                            <div>
                                <h4 class="font-bold text-amber-800 mb-1">Estratégia do Economista</h4>
                                <p class="text-sm text-amber-900/80 text-justify leading-relaxed">
                                    ${Object.keys(futureInstallments).length > 0 && margemLivre > 0
                                        ? "Sua prioridade: <b>Calibre os juros</b> dos seus financiamentos na lista ao lado. Se a taxa de juros for maior que o rendimento do CDB (aprox 0.9% am), use sua sobra de caixa para quitar dívidas. Se for menor, invista!"
                                        : "O melhor investimento inicial é a sua paz. Comece sua 'caixinha' hoje, mesmo que seja com 1% da renda. O hábito é mais importante que o valor."}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;

        container.classList.remove('text-center');
        container.innerHTML = html;
        container.parentElement.classList.remove('hidden'); // view-analise
    },

    calibrateInterest(name, totalFuture, count) {
        // Abre o modal personalizado em vez de prompt
        Modal.close(); // Fecha outros se tiver
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.querySelectorAll('.modal-content').forEach(el => el.classList.add('hidden'));
        document.getElementById('modal-calibrate').classList.remove('hidden');

        // Preenche dados
        document.getElementById('calib-name').value = name;
        document.getElementById('calib-total').value = totalFuture;
        document.getElementById('calib-count').value = count;
        
        document.getElementById('calib-display-total').innerText = this.fmt(totalFuture);
        document.getElementById('calib-display-count').innerText = `${count}x`;
        document.getElementById('calib-value').value = '';
        document.getElementById('calib-value').focus();
    },

    async runCalibration() {
        const name = document.getElementById('calib-name').value;
        const totalFuture = parseFloat(document.getElementById('calib-total').value);
        const count = parseInt(document.getElementById('calib-count').value);
        const pvStr = document.getElementById('calib-value').value;

        if (!pvStr || pvStr <= 0) return alert("Por favor, informe um valor válido para quitação.");
        
        const pv = parseFloat(pvStr);
        if (pv >= totalFuture) return alert("O valor de quitação antecipada deve ser menor que o total futuro.");

        // Calcular Taxa Implícita (Simplificada)
        // FV = PV * (1 + i)^n => i = (FV/PV)^(1/n) - 1
        const avgN = count / 2; // Tempo médio
        const monthlyRate = (Math.pow(totalFuture / pv, 1/avgN) - 1) * 100;
        
        // Salva direto, sem confirm window (UI já é explícita)
        const updates = [];
        let countUpdated = 0;
        this.processedTransactions.forEach(t => {
            if (t.status === 'pending' && t.type === 'expense' && t.desc.match(/(.*)\s\((\d+)\/(\d+)\)/)) {
                const matchName = t.desc.match(/(.*)\s\((\d+)\/(\d+)\)/)[1].trim();
                if(matchName === name) {
                    t.interest_rate = parseFloat(monthlyRate.toFixed(2));
                    updates.push(Store.saveTransaction({
                        id: t.id,
                        desc: t.desc,
                        amount: t.amount,
                        date: t.date, // string YYYY-MM-DD original
                        method: t.method,
                        status: t.status,
                        type: t.type,
                        cardId: t.cardId,
                        use5thDay: t.use5thDay,
                        category: t.category,
                        checked: t.checked,
                        interest_rate: t.interest_rate
                    }));
                    countUpdated++;
                }
            }
        });
        
        await Promise.all(updates);
        alert(`Sucesso! Taxa calculada de ${monthlyRate.toFixed(2)}% a.m. aplicada a ${countUpdated} parcelas.`);
        Modal.close();
        this.render();
    },

    updateCaixinhaSim(income, percent) {
        const val = (income * (percent / 100));
        document.getElementById('sim-input-val').innerText = percent + '%';
        document.getElementById('sim-aporte-val').innerText = this.fmt(val);
        document.getElementById('sim-result-6m').innerText = this.fmt(val * 6);
        document.getElementById('sim-result-12m').innerText = this.fmt(val * 12);
    },

    renderConselheiro() {
        const container = document.getElementById('conselheiro-container');
        if(!container) return;

        // Gerar conselhos baseados em heurísticas
        const tips = [];
        const hoje = new Date();
        const m = hoje.getMonth(), y = hoje.getFullYear();
        
        // Dados globais
        let totalIncome = 0;
        let totalExpense = 0;
        
        this.processedTransactions.forEach(t => {
            if(t.type === 'income') totalIncome += t.amount;
            else totalExpense += t.amount;
        });

        // Heurística 1: Reserva
        const balance = totalIncome - totalExpense;
        if(balance < 1000) {
            tips.push({
                icon: 'fa-umbrella',
                color: 'amber',
                title: 'Construa sua Reserva',
                text: 'Seu saldo acumulado histórico parece baixo. Antes de investir ou gastar com lazer, tente juntar pelo menos 3 meses de custo de vida. Isso evita que você caia no Cheque Especial em imprevistos.'
            });
        } else {
             tips.push({
                icon: 'fa-trophy',
                color: 'emerald',
                title: 'Saldo Positivo',
                text: 'Você tem um histórico positivo. Considere colocar esse excedente em um investimento de liquidez diária (CDB 100% CDI) para render juros a seu favor.'
            });
        }

        // Heurística 2: Categorias de "Lazer" ou alto custo
        const catTotals = {};
        this.processedTransactions.filter(t => t.type === 'expense').forEach(t => {
            const cat = t.category || 'Outros';
            if(!catTotals[cat]) catTotals[cat] = 0;
            catTotals[cat] += t.amount;
        });
        
        const sortedCats = Object.entries(catTotals).sort((a,b) => b[1] - a[1]);
        if(sortedCats.length > 0) {
            const topCat = sortedCats[0];
            tips.push({
                icon: 'fa-search-dollar',
                color: 'blue',
                title: `Atenção com ${topCat[0]}`,
                text: `Sua maior despesa histórica é com <b>${topCat[0]}</b> (${this.fmt(topCat[1])}). Tente reduzir 10% deste valor no próximo mês para ver o impacto no seu saldo livre.`
            });
        }

        // Heurística 3: Cartão de Crédito
        const creditExpenses = this.processedTransactions.filter(t => t.method === 'credit' && t.type === 'expense').reduce((a,b)=>a+b.amount,0);
        const totalExpenses = this.processedTransactions.filter(t => t.type === 'expense').reduce((a,b)=>a+b.amount,0);
        
        if (totalExpenses > 0) {
            const creditRatio = (creditExpenses / totalExpenses);
            if(creditRatio > 0.6) {
                tips.push({
                    icon: 'fa-credit-card',
                    color: 'purple',
                    title: 'Dependência do Cartão',
                    text: 'Mais de 60% dos seus gastos são no crédito. Cuidado com o efeito "Bola de Neve". Tente pagar pequenas despesas do dia a dia no débito para sentir a saída do dinheiro real.'
                });
            }
        }

        const html = tips.map(tip => `
            <div class="glass-card p-6 flex items-start gap-4 border-l-4 border-${tip.color}-500 hover:bg-${tip.color}-50 transition duration-300">
                <div class="w-12 h-12 shrink-0 rounded-full bg-${tip.color}-100 text-${tip.color}-600 flex items-center justify-center text-xl shadow-sm">
                    <i class="fas ${tip.icon}"></i>
                </div>
                <div>
                    <h4 class="text-lg font-black text-slate-800 mb-2">${tip.title}</h4>
                    <p class="text-sm text-slate-600 leading-relaxed text-justify">${tip.text}</p>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="glass-card p-8 mb-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                <div class="flex items-center gap-4">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Economist&backgroundColor=c0aede" class="w-16 h-16 rounded-full border-2 border-white/50">
                    <div>
                        <h3 class="text-2xl font-black">Conselheiro Virtual</h3>
                        <p class="text-sm text-slate-300">Analisando seus padrões de consumo...</p>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${html}
            </div>
        `;
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
    },

    // --- NOVAS FUNÇÕES DE LIMPEZA ---
    async deleteById() {
        const idStr = document.getElementById('config-del-id').value;
        if(!idStr) return alert("Digite um ID válido.");
        
        const id = parseInt(idStr);
        const t = Store.transactions.find(x => x.id === id);
        
        if(!t) return alert("Transação não encontrada com este ID.");
        
        if(confirm(`Tem certeza que deseja apagar:\nID: ${t.id}\nDesc: ${t.desc}\nValor: ${App.fmt(t.amount)}\nData: ${t.date}`)) {
            try {
                await window.DB.deleteTransaction(id);
                await Store.init();
                alert("Transação removida com sucesso!");
                App.render();
            } catch(e) {
                alert("Erro ao remover: " + e);
            }
        }
    },

    async deleteByDesc() {
        const desc = document.getElementById('config-del-desc').value.trim();
        if(!desc) return alert("Digite um texto para buscar na descrição.");
        
        // CORREÇÃO: Usa 'startsWith' para pegar "Nome (1/X)", "Nome (2/X)" e converte para minúsculas
        const targets = Store.transactions.filter(t => t.desc.toLowerCase().startsWith(desc.toLowerCase()));
        
        if(targets.length === 0) return alert("Nenhuma transação encontrada começando com esse texto.");
        
        if(confirm(`ATENÇÃO: Isso apagará ${targets.length} transações!\n\nCritério: Começa com "${desc}"\nValor total somado: ${App.fmt(targets.reduce((a,b)=>a+b.amount,0))}\n\nExemplo encontrado: ${targets[0].desc}\n\nConfirma a exclusão em massa?`)) {
            let count = 0;
            try {
                for(const t of targets) {
                    await window.DB.deleteTransaction(t.id);
                    count++;
                }
                await Store.init();
                alert(`${count} transações removidas com sucesso!`);
                App.render();
            } catch(e) {
                alert(`Erro após remover ${count} itens: ` + e);
            }
        }
    }
};

// Não precisamos esperar onload se o script estiver no final do body, 
// mas para garantir:
window.onload = () => App.init();