const transacaoForm = document.getElementById('transacaoForm');
const isParceladaContainer = document.getElementById('isParceladaContainer');
const isRecorrenteContainer = document.getElementById('isRecorrenteContainer');
const isParceladaCheckbox = document.getElementById('isParcelada');
const isRecorrenteCheckbox = document.getElementById('isRecorrente');
const parcelamentoFields = document.getElementById('parcelamentoFields');
const recorrenteFields = document.getElementById('recorrenteFields');
const tipoSelect = document.getElementById('tipo');
const marcarPagoForm = document.getElementById('marcarPagoForm');
const transacoesTableBody = document.getElementById('transacoesTableBody');
const despesasVencerTableBody = document.getElementById('despesasVencerTableBody');
const receitasReceberTableBody = document.getElementById('receitasReceberTableBody');
const categoriaAnalysisTableBody = document.getElementById('categoriaAnalysisTableBody');
const categoriaSummaryEl = document.getElementById('categoriaSummary');
const saldoRealizadoEl = document.getElementById('saldoRealizado');
const saldoFuturoEl = document.getElementById('saldoFuturo');
const totalDespesasPrevistasEl = document.getElementById('totalDespesasPrevistas');
const messageBox = document.getElementById('messageBox');
const filtroPeriodoEl = document.getElementById('filtroPeriodo');
const dataInicioEl = document.getElementById('dataInicio');
const dataFimEl = document.getElementById('dataFim');
const previsaoDataEl = document.getElementById('previsaoData');
const marcarPagoModal = document.getElementById('marcarPagoModal');
const deleteForm = document.getElementById('deleteForm');
const deleteDescricaoEl = document.getElementById('deleteDescricao');
const deleteDataInicioEl = document.getElementById('deleteDataInicio');
const deleteDataFimEl = document.getElementById('deleteDataFim');
const totalReceitasPrevistasEl = document.getElementById('totalReceitasPrevistas');
const totalDespesasPrevistasFiltroEl = document.getElementById('totalDespesasPrevistasFiltro');
const saldoPeriodoEl = document.getElementById('saldoPeriodo');
const categoriaEl = document.getElementById('categoria');
const categoriasListEl = document.getElementById('categorias-list');
const filtroCategoriaEl = document.getElementById('filtroCategoria');

let transacoes = [], categoriasSalvas = new Set();

// --- LocalStorage Functions ---

function saveDataToLocalStorage() {
    localStorage.setItem('transacoes', JSON.stringify(transacoes));
    localStorage.setItem('categorias', JSON.stringify(Array.from(categoriasSalvas)));
}

function loadDataFromLocalStorage() {
    const transacoesJSON = localStorage.getItem('transacoes');
    const categoriasJSON = localStorage.getItem('categorias');

    if (transacoesJSON) {
        transacoes = JSON.parse(transacoesJSON);
    } else {
        transacoes = [];
    }

    if (categoriasJSON) {
        categoriasSalvas = new Set(JSON.parse(categoriasJSON));
    } else {
        categoriasSalvas = new Set();
    }
}

// Save categories to local storage and update datalist
async function salvarCategorias() {
    const categoriaAtual = categoriaEl.value.trim();
    if (categoriaAtual) {
        if (!categoriasSalvas.has(categoriaAtual)) {
            categoriasSalvas.add(categoriaAtual);
            saveDataToLocalStorage();
            renderCategoriasDatalist();
        }
    }
}

// Render categories for the datalist and filter dropdown
function renderCategoriasDatalist() {
    categoriasListEl.innerHTML = '';
    filtroCategoriaEl.innerHTML = '<option value="all">Todas as Categorias</option>';
    Array.from(categoriasSalvas).sort().forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        categoriasListEl.appendChild(option.cloneNode(true));
        filtroCategoriaEl.appendChild(option);
    });
    filtroCategoriaEl.value = 'all';
}

// Function to show a message box
function showMessage(message, duration = 3000) {
    messageBox.textContent = message;
    messageBox.classList.remove('hidden');
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, duration);
}

// Function to format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Function to format a date string from YYYY-MM-DD to DD/MM/YYYY
function formatDateToBrazil(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// Helper function to get the date range based on the filter selection
function getFilterDates() {
    const periodo = filtroPeriodoEl.value;
    const hoje = new Date();
    let dataInicioFiltro, dataFimFiltro;

    dataInicioEl.disabled = true;
    dataFimEl.disabled = true;

    switch (periodo) {
        case 'weekly':
            let inicioSemana = new Date(hoje);
            inicioSemana.setDate(hoje.getDate() - 7);
            dataInicioFiltro = inicioSemana.toISOString().split('T')[0];
            dataFimFiltro = hoje.toISOString().split('T')[0];
            break;
        case 'monthly':
            dataInicioFiltro = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
            dataFimFiltro = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
            break;
        case 'yearly':
            dataInicioFiltro = new Date(hoje.getFullYear(), 0, 1).toISOString().split('T')[0];
            dataFimFiltro = new Date(hoje.getFullYear(), 11, 31).toISOString().split('T')[0];
            break;
        case 'custom':
            dataInicioEl.disabled = false;
            dataFimEl.disabled = false;
            dataInicioFiltro = dataInicioEl.value;
            dataFimFiltro = dataFimEl.value;
            break;
        case 'all':
        default:
            dataInicioFiltro = null;
            dataFimFiltro = null;
            break;
    }
    
    if (periodo !== 'custom') {
        dataInicioEl.value = dataInicioFiltro;
        dataFimEl.value = dataFimFiltro;
    }
    
    return { dataInicioFiltro, dataFimFiltro };
}

// Main function to update all UI elements
function updateUI() {
    calculateDashboardMetrics();
    renderTables();
}

// Calculate and update dashboard metrics
function calculateDashboardMetrics() {
    const hoje = new Date().toISOString().split('T')[0];
    const dataPrevisao = previsaoDataEl.value || hoje;

    // 1. Calculate Realized Balance up to today
    let saldoRealizado = 0;
    let totalDespesasPrevistas = 0;
    
    transacoes.forEach(t => {
        if (t.status === 'realizado' && (t.data <= hoje)) {
            saldoRealizado += parseFloat(t.valor);
        }
    });

    // 2. Calculate Predicted Balance (Realized today + Predicted to future date)
    let saldoFuturo = saldoRealizado;
    transacoes.forEach(t => {
        const dataTransacao = t.data || t.dataPrevista;
        if (t.status === 'previsto' && dataTransacao <= dataPrevisao) {
            saldoFuturo += parseFloat(t.valorPrevisto);
            if (t.tipo === 'despesa') {
                totalDespesasPrevistas += Math.abs(parseFloat(t.valorPrevisto));
            }
        }
    });

    saldoRealizadoEl.textContent = formatCurrency(saldoRealizado);
    saldoFuturoEl.textContent = formatCurrency(saldoFuturo);
    totalDespesasPrevistasEl.textContent = formatCurrency(totalDespesasPrevistas);
}

// Render both tables based on the filter selection
function renderTables() {
    const { dataInicioFiltro, dataFimFiltro } = getFilterDates();
    const categoriaFiltro = filtroCategoriaEl.value;
    
    const filteredTransacoes = transacoes.filter(t => {
        const dataTransacao = new Date(t.data || t.dataPrevista);
        const inicioDate = dataInicioFiltro ? new Date(dataInicioFiltro) : null;
        const fimDate = dataFimFiltro ? new Date(dataFimFiltro) : null;
        
        // Adjust end date to be inclusive
        if (fimDate) {
            fimDate.setDate(fimDate.getDate() + 1);
        }

        const isWithinDateRange = (!inicioDate || dataTransacao >= inicioDate) && (!fimDate || dataTransacao < fimDate);
        const isMatchingCategory = categoriaFiltro === 'all' || (t.categoria && t.categoria.toLowerCase() === categoriaFiltro.toLowerCase());
        
        return isWithinDateRange && isMatchingCategory;
    });
    
    // Calculate and display summary totals for the filtered period
    const totalDespesasPrevistasFiltro = filteredTransacoes
        .filter(t => t.tipo === 'despesa' && t.status === 'previsto')
        .reduce((sum, t) => sum + Math.abs(t.valorPrevisto), 0);
    
    const totalReceitasPrevistas = filteredTransacoes
        .filter(t => t.tipo === 'receita' && t.status === 'previsto')
        .reduce((sum, t) => sum + t.valorPrevisto, 0);

    const saldoPeriodo = totalReceitasPrevistas - totalDespesasPrevistasFiltro;

    totalDespesasPrevistasFiltroEl.textContent = formatCurrency(totalDespesasPrevistasFiltro);
    totalReceitasPrevistasEl.textContent = formatCurrency(totalReceitasPrevistas);
    saldoPeriodoEl.textContent = formatCurrency(saldoPeriodo);

    // Render "Despesas a Vencer" table
    despesasVencerTableBody.innerHTML = '';
    const despesasVencer = filteredTransacoes.filter(t => t.status === 'previsto' && t.tipo === 'despesa');
    despesasVencer.sort((a, b) => new Date(a.dataPrevista) - new Date(b.dataPrevista));
    despesasVencer.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-3 px-4">${formatDateToBrazil(item.dataPrevista)}</td>
            <td class="py-3 px-4">${item.descricao}</td>
            <td class="py-3 px-4 text-red-600 font-bold">${formatCurrency(item.valorPrevisto)}</td>
            <td class="py-3 px-4">
                <button onclick="showMarcarTransacaoModal('${item.id}', 'despesa')" class="px-3 py-1 text-sm bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors">
                    Marcar como Pago
                </button>
            </td>
        `;
        despesasVencerTableBody.appendChild(row);
    });

    // Render "Receitas a Receber" table
    receitasReceberTableBody.innerHTML = '';
    const receitasReceber = filteredTransacoes.filter(t => t.status === 'previsto' && t.tipo === 'receita');
    receitasReceber.sort((a, b) => new Date(a.dataPrevista) - new Date(b.dataPrevista));
    receitasReceber.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-3 px-4">${formatDateToBrazil(item.dataPrevista)}</td>
            <td class="py-3 px-4">${item.descricao}</td>
            <td class="py-3 px-4 text-green-600 font-bold">${formatCurrency(item.valorPrevisto)}</td>
            <td class="py-3 px-4">
                <button onclick="showMarcarTransacaoModal('${item.id}', 'receita')" class="px-3 py-1 text-sm bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors">
                    Marcar como Recebido
                </button>
            </td>
        `;
        receitasReceberTableBody.appendChild(row);
    });

    // Render "Análise de Gastos por Categoria" table
    categoriaAnalysisTableBody.innerHTML = '';
    let totalCategorySpent = 0;
    const categoryTransacoes = transacoes.filter(t => {
         const dataTransacao = new Date(t.data || t.dataPrevista);
         const inicioDate = dataInicioFiltro ? new Date(dataInicioFiltro) : null;
         const fimDate = dataFimFiltro ? new Date(dataFimFiltro) : null;

         if (fimDate) {
             fimDate.setDate(fimDate.getDate() + 1);
         }

         const isWithinDateRange = (!inicioDate || dataTransacao >= inicioDate) && (!fimDate || dataTransacao < fimDate);
         const isMatchingCategory = categoriaFiltro === 'all' || (t.categoria && t.categoria.toLowerCase() === categoriaFiltro.toLowerCase());
         const isExpense = t.tipo === 'despesa';
         const isRealized = t.status === 'realizado';

         return isWithinDateRange && isMatchingCategory && isExpense && isRealized;
    });
    
    if (categoriaFiltro === 'all') {
        categoriaSummaryEl.textContent = 'Selecione uma categoria para visualizar o total de gastos.';
    } else {
        totalCategorySpent = categoryTransacoes.reduce((sum, t) => sum + Math.abs(t.valor), 0);
        categoriaSummaryEl.textContent = `Total de gastos em "${filtroCategoriaEl.options[filtroCategoriaEl.selectedIndex].text}": ${formatCurrency(totalCategorySpent)}`;
    }
    
    categoryTransacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
    categoryTransacoes.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-3 px-4">${formatDateToBrazil(item.data)}</td>
            <td class="py-3 px-4">${item.descricao}</td>
            <td class="py-3 px-4 text-red-600 font-bold">${formatCurrency(item.valor)}</td>
        `;
        categoriaAnalysisTableBody.appendChild(row);
    });
    
    // Render "Todas as Transações" table (without category filter)
    transacoesTableBody.innerHTML = '';
    const allTransacoes = transacoes.filter(t => {
        const dataTransacao = new Date(t.data || t.dataPrevista);
        const inicioDate = dataInicioFiltro ? new Date(dataInicioFiltro) : null;
        const fimDate = dataFimFiltro ? new Date(dataFimFiltro) : null;

        if (fimDate) {
            fimDate.setDate(fimDate.getDate() + 1);
        }
        return (!inicioDate || dataTransacao >= inicioDate) && (!fimDate || dataTransacao < fimDate);
    });

    allTransacoes.sort((a, b) => new Date(b.data || b.dataPrevista) - new Date(a.data || a.dataPrevista));
    allTransacoes.forEach(item => {
        const row = document.createElement('tr');
        const statusClass = item.status === 'realizado' ? 'bg-realizado' : 'bg-previsto';
        
        row.classList.add(statusClass);
        const valorExibido = item.status === 'realizado' ? item.valor : item.valorPrevisto;
        
        row.innerHTML = `
            <td class="py-3 px-4">${formatDateToBrazil(item.data || item.dataPrevista)}</td>
            <td class="py-3 px-4">${item.descricao}</td>
            <td class="py-3 px-4">${item.status === 'realizado' ? 'Realizado' : 'Previsto'}</td>
            <td class="py-3 px-4">${item.tipo === 'receita' ? 'Receita' : 'Despesa'}</td>
            <td class="py-3 px-4 ${valorExibido > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}">
                ${formatCurrency(valorExibido)}
            </td>
            <td class="py-3 px-4">
                <button onclick="deleteTransacao('${item.id}')" class="text-red-500 hover:text-red-700 transition-colors">Excluir</button>
            </td>
        `;
        transacoesTableBody.appendChild(row);
    });
}

// Show "Mark as Paid/Received" modal
window.showMarcarTransacaoModal = function(id, tipo) {
    const transacao = transacoes.find(t => t.id === id);
    if (!transacao) return;

    document.getElementById('transacaoIdToMarkPaid').value = id;
    document.getElementById('transacaoTipoToMarkPaid').value = tipo;
    document.getElementById('valorPago').value = Math.abs(transacao.valorPrevisto);
    
    const modalTitleEl = document.getElementById('modalTitle');
    const confirmButtonEl = document.getElementById('confirmButton');

    if (tipo === 'despesa') {
        modalTitleEl.textContent = 'Registrar Pagamento';
        confirmButtonEl.textContent = 'Confirmar Pagamento';
    } else { // 'receita'
        modalTitleEl.textContent = 'Registrar Recebimento';
        confirmButtonEl.textContent = 'Confirmar Recebimento';
    }
    marcarPagoModal.classList.remove('hidden');
};

// Function to delete a transaction by its unique ID
window.deleteTransacao = async function(id) {
    transacoes = transacoes.filter(t => t.id !== id);
    saveDataToLocalStorage();
    updateUI();
    showMessage('Transação excluída com sucesso.');
};

// Function to update visibility based on transaction type
function updateVisibilityBasedOnType() {
    console.log('Atualizando visibilidade para tipo:', tipoSelect.value); // Debug log
    if (tipoSelect.value === 'receita') {
        isRecorrenteContainer.classList.remove('hidden');
        isParceladaContainer.classList.add('hidden');
        isParceladaCheckbox.checked = false;
        parcelamentoFields.classList.add('hidden');
        recorrenteFields.classList.add('hidden');
    } else { // 'despesa'
        isParceladaContainer.classList.remove('hidden');
        isRecorrenteContainer.classList.remove('hidden');
        isParceladaCheckbox.checked = false;
        isRecorrenteCheckbox.checked = false;
        parcelamentoFields.classList.add('hidden');
        recorrenteFields.classList.add('hidden');
    }
}

// Event listener for the transaction type select
tipoSelect.addEventListener('change', updateVisibilityBasedOnType);

// Event listener for the installment checkbox
isParceladaCheckbox.addEventListener('change', function() {
    if (this.checked) {
        parcelamentoFields.classList.remove('hidden');
        isRecorrenteCheckbox.checked = false;
        recorrenteFields.classList.add('hidden');
    } else {
        parcelamentoFields.classList.add('hidden');
    }
});

// Event listener for the recurring checkbox
isRecorrenteCheckbox.addEventListener('change', function() {
    console.log('Checkbox recorrente mudou para:', this.checked); // Debug log
    if (this.checked) {
        recorrenteFields.classList.remove('hidden');
        isParceladaCheckbox.checked = false;
        parcelamentoFields.classList.add('hidden');
    } else {
        recorrenteFields.classList.add('hidden');
    }
});

// Form submission handler for all transactions
transacaoForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    if (!this.checkValidity()) {
        showMessage('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    const isParcelada = isParceladaCheckbox.checked;
    const isRecorrente = isRecorrenteCheckbox.checked;
    const descricao = document.getElementById('descricao').value;
    const tipo = tipoSelect.value;
    const categoria = categoriaEl.value;
    const valorInicial = parseFloat(document.getElementById('valor').value);
    const dataInicial = document.getElementById('data').value;
    
    try {
        if (isParcelada) {
            const numParcelas = parseInt(document.getElementById('numParcelas').value, 10);
            if (numParcelas <= 0 || isNaN(valorInicial) || isNaN(numParcelas)) {
                showMessage('Para parcelamento, insira uma despesa válida com número de parcelas > 0.');
                return;
            }

            const valorParcela = -(valorInicial / numParcelas); 
            const dataBase = new Date(dataInicial + 'T12:00:00');
            
            for (let i = 0; i < numParcelas; i++) {
                const dataParcela = new Date(dataBase);
                dataParcela.setMonth(dataBase.getMonth() + i);
                
                const novaTransacao = {
                    id: Date.now().toString() + i,
                    dataPrevista: dataParcela.toISOString().split('T')[0],
                    descricao: `${descricao} (Parcela ${i + 1} de ${numParcelas})`,
                    status: 'previsto',
                    tipo: 'despesa',
                    categoria: categoria,
                    valorPrevisto: valorParcela,
                    valor: null
                };
                transacoes.push(novaTransacao);
            }
            showMessage(`${numParcelas} parcelas adicionadas com sucesso.`);
        } else if (isRecorrente) {
            const numRepeticoes = parseInt(document.getElementById('numRepeticoes').value, 10);
            if (numRepeticoes <= 0 || isNaN(valorInicial) || isNaN(numRepeticoes)) {
                showMessage('Por favor, insira valores válidos para a transação recorrente.');
                return;
            }
            
            const dataBase = new Date(dataInicial + 'T12:00:00');
            const valorRecorrente = tipo === 'despesa' ? -valorInicial : valorInicial;
            
            for (let i = 0; i < numRepeticoes; i++) {
                const dataPrevista = new Date(dataBase);
                dataPrevista.setMonth(dataBase.getMonth() + i);
                
                const novaTransacao = {
                    id: Date.now().toString() + i,
                    dataPrevista: dataPrevista.toISOString().split('T')[0],
                    descricao: `${descricao} (Recorrente ${i + 1} de ${numRepeticoes})`,
                    status: 'previsto',
                    tipo: tipo,
                    categoria: categoria,
                    valorPrevisto: valorRecorrente,
                    valor: null
                };
                transacoes.push(novaTransacao);
            }
            showMessage(`${numRepeticoes} transações recorrentes adicionadas com sucesso.`);
        } else {
            let valor = valorInicial;
            const data = dataInicial;
            if (tipo === 'despesa' && valor > 0) {
                valor = -valor;
            }
            const novaTransacao = {
                id: Date.now().toString(),
                data: data,
                descricao: descricao,
                status: 'realizado',
                tipo: tipo,
                categoria: categoria,
                valor: valor,
                valorPrevisto: null,
                dataPrevista: null
            };
            transacoes.push(novaTransacao);
            showMessage('Transação adicionada com sucesso!');
        }
        
        await salvarCategorias();
        saveDataToLocalStorage();
        updateUI();
        transacaoForm.reset();
        updateVisibilityBasedOnType();
    } catch (e) {
        console.error("Erro ao adicionar transação: ", e);
        showMessage('Erro ao adicionar transação. Tente novamente.');
    }
});


// Form submission handler for marking an expense as paid
marcarPagoForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const id = document.getElementById('transacaoIdToMarkPaid').value;
    const tipo = document.getElementById('transacaoTipoToMarkPaid').value;
    const dataPagamento = document.getElementById('dataPagamento').value;
    let valorPago = parseFloat(document.getElementById('valorPago').value);
    
    try {
        const transacaoIndex = transacoes.findIndex(t => t.id === id);
        if (transacaoIndex === -1) {
            showMessage('Transação não encontrada.');
            return;
        }

        if (tipo === 'despesa' && valorPago > 0) {
            valorPago = -valorPago;
        }

        const transacaoOriginal = transacoes[transacaoIndex];

        transacoes[transacaoIndex] = {
            ...transacaoOriginal,
            status: 'realizado',
            valor: valorPago,
            data: dataPagamento,
            valorPrevisto: null,
            dataPrevista: null
        };
        
        saveDataToLocalStorage();
        updateUI();
        marcarPagoModal.classList.add('hidden');
        showMessage('Transação marcada como ' + (tipo === 'despesa' ? 'paga' : 'recebida') + '!');
    } catch (e) {
        console.error("Erro ao marcar transação como paga: ", e);
        showMessage('Erro ao marcar transação. Tente novamente.');
    }
});

// Event listener to close the modal
document.getElementById('cancelMarcarPago').addEventListener('click', () => {
    marcarPagoModal.classList.add('hidden');
});

// Function to delete transactions based on description and date range
async function deleteTransactionsByFilter(descricao, dataInicio, dataFim) {
    const initialCount = transacoes.length;
    
    const filteredOut = transacoes.filter(t => {
        const dataTransacao = t.data || t.dataPrevista;
        const matchesDesc = descricao ? t.descricao.includes(descricao) : true;
        const matchesDate = (!dataInicio || dataTransacao >= dataInicio) && (!dataFim || dataTransacao <= dataFim);
        return !(matchesDesc && matchesDate);
    });

    const numDeleted = initialCount - filteredOut.length;
    transacoes = filteredOut;

    if (numDeleted > 0) {
        saveDataToLocalStorage();
        updateUI();
        showMessage(`${numDeleted} transação(ões) excluída(s) com sucesso.`);
    } else {
        showMessage('Nenhuma transação encontrada com os critérios especificados.');
    }
}

// Event listener for the delete form
deleteForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const descricao = deleteDescricaoEl.value.trim();
    const dataInicio = deleteDataInicioEl.value;
    const dataFim = deleteDataFimEl.value;
    
    if (!descricao && !dataInicio && !dataFim) {
        showMessage('Por favor, insira pelo menos um filtro para exclusão.');
        return;
    }
    
    deleteTransactionsByFilter(descricao, dataInicio, dataFim);
    this.reset();
});

// Event listeners for filtering and dashboard updates
filtroPeriodoEl.addEventListener('change', updateUI);
filtroCategoriaEl.addEventListener('change', updateUI);
dataInicioEl.addEventListener('change', () => {
    filtroPeriodoEl.value = 'custom';
    updateUI();
});
dataFimEl.addEventListener('change', () => {
    filtroPeriodoEl.value = 'custom';
    updateUI();
});
previsaoDataEl.addEventListener('change', calculateDashboardMetrics);

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('data').value = today;
    document.getElementById('dataPagamento').value = today;
    previsaoDataEl.value = today;
    
    loadDataFromLocalStorage();
    renderCategoriasDatalist();
    updateUI();
    updateVisibilityBasedOnType();
});
