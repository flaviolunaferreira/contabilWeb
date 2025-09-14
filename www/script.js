// =================================================================================
// App.js - Lógica principal do aplicativo de Controle Financeiro
// =================================================================================

// --- Elementos da DOM ---
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
const summaryByDescriptionBody = document.getElementById('summaryByDescriptionBody'); // Novo
const despesasVencerTableBody = document.getElementById('despesasVencerTableBody');
const receitasReceberTableBody = document.getElementById('receitasReceberTableBody');
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
const filtroDescricaoEl = document.getElementById('filtroDescricao'); // Novo
const bottomNav = document.getElementById('bottom-nav');
const pages = document.querySelectorAll('.page');
const navButtons = document.querySelectorAll('.nav-button');

// --- Elementos para Edição e Gerenciamento ---
const editTransacaoModal = document.getElementById('editTransacaoModal');
const editTransacaoForm = document.getElementById('editTransacaoForm');
const cancelEditTransacao = document.getElementById('cancelEditTransacao');
const categoryManagerContainer = document.getElementById('category-manager-container');

// --- Novos Elementos da Tela de Previsões ---
const totalRecebidoEl = document.getElementById('totalRecebido');
const totalPagoEl = document.getElementById('totalPago');
const balancoFuturoEl = document.getElementById('balancoFuturo');

// --- Novos Elementos do Dashboard ---
const totalAReceberEl = document.getElementById('totalAReceber');
const totalPagoRealizadoEl = document.getElementById('totalPagoRealizado');


// --- Estado do Aplicativo ---
let transacoes = [];
let categoriasSalvas = new Set();
let db; // Referência para o banco de dados SQLite
let isMobile = false;

// --- Funções para LocalStorage (fallback para navegador) ---
function saveDataToLocalStorage() {
    localStorage.setItem('transacoes', JSON.stringify(transacoes));
    localStorage.setItem('categorias', JSON.stringify(Array.from(categoriasSalvas)));
}
function loadDataFromLocalStorage() {
    const transacoesJSON = localStorage.getItem('transacoes');
    const categoriasJSON = localStorage.getItem('categorias');
    transacoes = transacoesJSON ? JSON.parse(transacoesJSON) : [];
    categoriasSalvas = new Set(categoriasJSON ? JSON.parse(categoriasJSON) : []);
}

// =================================================================================
// INICIALIZAÇÃO E BANCO DE DADOS (SQLite com Capacitor)
// =================================================================================

document.addEventListener('deviceready', onDeviceReady, false);

async function onDeviceReady() {
    isMobile = true;
    try {
        const { CapacitorSQLite, SQLiteConnection } = window.CapacitorCommunitySqlite;
        const sqlite = new SQLiteConnection(CapacitorSQLite);
        db = await sqlite.createConnection('contabilDB', false, 'no-encryption', 1);
        await db.open();
        await setupDatabase();
        await loadDataFromDB();
        updateUI();
        showMessage('Banco de dados conectado!', 2000);
    } catch (e) {
        console.error("Erro ao inicializar o banco de dados", e);
        showMessage('Erro ao conectar ao DB.', 5000);
    }
}

async function setupDatabase() {
    const createTransacoesTable = `
        CREATE TABLE IF NOT EXISTS transacoes (
            id TEXT PRIMARY KEY,
            descricao TEXT,
            valor REAL,
            data TEXT,
            tipo TEXT,
            categoria TEXT,
            status TEXT,
            valorPrevisto REAL,
            dataPrevista TEXT
        );
    `;
    const createCategoriasTable = `
        CREATE TABLE IF NOT EXISTS categorias (
            nome TEXT PRIMARY KEY
        );
    `;
    await db.execute(createTransacoesTable);
    await db.execute(createCategoriasTable);
}

async function loadDataFromDB() {
    const transacoesResult = await db.query('SELECT * FROM transacoes');
    transacoes = transacoesResult.values || [];

    const categoriasResult = await db.query('SELECT * FROM categorias');
    categoriasSalvas = new Set((categoriasResult.values || []).map(c => c.nome));
}

// =================================================================================
// NAVEGAÇÃO
// =================================================================================

bottomNav.addEventListener('click', (e) => {
    const targetButton = e.target.closest('.nav-button');
    if (!targetButton) return;

    const targetPageId = targetButton.dataset.page;
    
    pages.forEach(page => {
        page.classList.toggle('active', page.id === targetPageId);
        page.classList.toggle('hidden', page.id !== targetPageId);
    });

    navButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.page === targetPageId);
        button.classList.toggle('text-blue-600', button.dataset.page === targetPageId);
        button.classList.toggle('text-gray-500', button.dataset.page !== targetPageId);
    });
});


// =================================================================================
// FUNÇÕES DE UTILIDADE E FORMATAÇÃO
// =================================================================================

function showMessage(message, duration = 3000) {
    messageBox.textContent = message;
    messageBox.classList.remove('hidden');
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, duration);
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function formatDateToBrazil(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function getFilterDates() {
    const periodo = filtroPeriodoEl.value;
    const hoje = new Date();
    let dataInicioFiltro, dataFimFiltro;

    const customDateFilters = document.getElementById('customDateFilters');
    customDateFilters.classList.toggle('hidden', periodo !== 'custom');

    switch (periodo) {
        case 'weekly':
            dataInicioFiltro = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 7).toISOString().split('T')[0];
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
            dataInicioFiltro = dataInicioEl.value;
            dataFimFiltro = dataFimEl.value;
            break;
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

// =================================================================================
// FUNÇÃO DE ORDENAÇÃO DE TABELAS
// =================================================================================

let sortDirections = {}; // Armazena a direção da ordenação para cada tabela

window.sortTable = function(tableBodyId, columnIndex) {
    const tableBody = document.getElementById(tableBodyId);
    const rows = Array.from(tableBody.querySelectorAll('tr'));
    
    // Determina a direção da ordenação
    const sortKey = `${tableBodyId}-${columnIndex}`;
    const isAscending = !sortDirections[sortKey];
    sortDirections[sortKey] = isAscending;

    // Atualiza os ícones de ordenação
    updateSortIcons(tableBodyId, columnIndex, isAscending);

    rows.sort((a, b) => {
        const cellA = a.cells[columnIndex].textContent.trim();
        const cellB = b.cells[columnIndex].textContent.trim();
        
        // Verifica se é uma coluna de valor monetário
        if (cellA.includes('R$') && cellB.includes('R$')) {
            const valueA = parseFloat(cellA.replace(/[R$\s.,]/g, '').replace(',', '.')) || 0;
            const valueB = parseFloat(cellB.replace(/[R$\s.,]/g, '').replace(',', '.')) || 0;
            return isAscending ? valueA - valueB : valueB - valueA;
        }
        
        // Verifica se é uma coluna de data (formato dd/mm/yyyy)
        if (cellA.includes('/') && cellB.includes('/')) {
            const dateA = cellA.split('/').reverse().join('-');
            const dateB = cellB.split('/').reverse().join('-');
            return isAscending ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
        }
        
        // Verifica se é uma coluna numérica
        const numA = parseFloat(cellA);
        const numB = parseFloat(cellB);
        if (!isNaN(numA) && !isNaN(numB)) {
            return isAscending ? numA - numB : numB - numA;
        }
        
        // Ordenação alfabética padrão
        return isAscending ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
    });

    // Reinsere as linhas ordenadas
    rows.forEach(row => tableBody.appendChild(row));
};

function updateSortIcons(tableBodyId, activeColumnIndex, isAscending) {
    // Encontra a tabela pai
    const tableBody = document.getElementById(tableBodyId);
    const table = tableBody.closest('table');
    const headers = table.querySelectorAll('thead th');
    
    headers.forEach((header, index) => {
        const sortIcon = header.querySelector('.sort-icon');
        if (!sortIcon) return;
        
        if (index === activeColumnIndex) {
            // Coluna ativa - mostra seta direcionada com cor chamativa
            if (isAscending) {
                sortIcon.innerHTML = `<svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd"></path>
                </svg>`;
            } else {
                sortIcon.innerHTML = `<svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>`;
            }
        } else {
            // Colunas inativas - mostra ícone neutro
            sortIcon.innerHTML = `<svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 12l5-5 5 5H5z"></path>
                <path d="M5 8l5 5 5-5H5z"></path>
            </svg>`;
        }
    });
}

// =================================================================================
// LÓGICA DE UI E RENDERIZAÇÃO
// =================================================================================

function updateUI() {
    renderCategorias();
    calculateDashboardMetrics();
    renderTables();
    renderSummaryByDescription(); // Novo
    renderForecastsPage(); // Novo
    renderIntelligencePage(); // Inteligência Financeira
}

function renderCategorias() {
    categoriasListEl.innerHTML = '';
    filtroCategoriaEl.innerHTML = '<option value="all">Todas as Categorias</option>';
    Array.from(categoriasSalvas).sort().forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        categoriasListEl.appendChild(option.cloneNode(true));
        filtroCategoriaEl.appendChild(option);
    });
    renderCategoryManager(); // Adicionado para gerenciar categorias
}

function calculateDashboardMetrics() {
    const hoje = new Date().toISOString().split('T')[0];
    const dataPrevisao = previsaoDataEl.value || hoje;

    let saldoRealizado = 0;
    let totalPagoRealizado = 0;
    transacoes.forEach(t => {
        if (t.status === 'realizado' && t.data <= hoje) {
            saldoRealizado += t.valor;
            if (t.tipo === 'despesa') {
                totalPagoRealizado += Math.abs(t.valor);
            }
        }
    });

    let saldoFuturo = saldoRealizado;
    let totalDespesasPrevistas = 0;
    let totalAReceber = 0;
    transacoes.forEach(t => {
        if (t.status === 'previsto' && t.dataPrevista <= dataPrevisao) {
            saldoFuturo += t.valorPrevisto;
            if (t.tipo === 'despesa') {
                totalDespesasPrevistas += Math.abs(t.valorPrevisto);
            } else if (t.tipo === 'receita') {
                totalAReceber += t.valorPrevisto;
            }
        }
    });

    saldoRealizadoEl.textContent = formatCurrency(saldoRealizado);
    saldoFuturoEl.textContent = formatCurrency(saldoFuturo);
    totalDespesasPrevistasEl.textContent = formatCurrency(totalDespesasPrevistas);
    totalAReceberEl.textContent = formatCurrency(totalAReceber);
    totalPagoRealizadoEl.textContent = formatCurrency(totalPagoRealizado);
}

// ATUALIZADO: Renderiza o resumo por descrição no Dashboard baseado no campo "Prever Saldo para o dia"
function renderSummaryByDescription() {
    const summary = {};
    const dataLimite = previsaoDataEl.value || new Date().toISOString().split('T')[0];

    const transacoesFiltradas = transacoes.filter(t => {
        const dataTransacao = t.data || t.dataPrevista;
        return dataTransacao <= dataLimite;
    });

    transacoesFiltradas.forEach(t => {
        // Melhor normalização da descrição para agrupar corretamente
        let baseDesc = t.descricao;
        // Remove "(X/Y)" - parcelas
        baseDesc = baseDesc.replace(/\s*\(\d+\/\d+\)$/, '');
        // Remove "(Recorrente X de Y)" 
        baseDesc = baseDesc.replace(/\s*\(Recorrente\s*\d+\s*de\s*\d+\)$/, '');
        // Remove "(Recorrente)" simples
        baseDesc = baseDesc.replace(/\s*\(Recorrente\)$/, '');
        // Remove espaços extras
        baseDesc = baseDesc.trim();

        if (!summary[baseDesc]) {
            summary[baseDesc] = {
                descricao: baseDesc,
                pago: 0,
                restante: 0,
                quantidade: 0
            };
        }
        
        summary[baseDesc].quantidade += 1; // Conta cada transação
        
        if (t.status === 'realizado') {
            summary[baseDesc].pago += t.valor;
        } else { // previsto
            summary[baseDesc].restante += t.valorPrevisto;
        }
    });

    summaryByDescriptionBody.innerHTML = '';
    Object.values(summary).forEach(item => {
        const total = item.pago + item.restante;
        if (Math.abs(total) < 0.01) return; // Não mostra itens zerados

        const row = document.createElement('tr');
        row.className = 'cursor-pointer hover:bg-gray-50';
        row.onclick = () => showDashboardDetails(item.descricao);
        
        row.innerHTML = `
            <td class="py-3 px-4">${item.descricao}</td>
            <td class="py-3 px-4 text-center font-semibold text-gray-600">${item.quantidade}</td>
            <td class="py-3 px-4 font-bold text-gray-800">${formatCurrency(total)}</td>
            <td class="py-3 px-4 font-bold ${item.pago >= 0 ? 'text-green-600' : 'text-red-600'}">${formatCurrency(item.pago)}</td>
            <td class="py-3 px-4 font-bold ${item.restante !== 0 ? (item.restante > 0 ? 'text-blue-600' : 'text-orange-600') : 'text-gray-500'}">${formatCurrency(item.restante)}</td>
        `;
        summaryByDescriptionBody.appendChild(row);
    });
}


function renderTables() {
    const { dataInicioFiltro, dataFimFiltro } = getFilterDates();
    const categoriaFiltro = filtroCategoriaEl.value;
    const descricaoFiltro = filtroDescricaoEl.value.trim().toLowerCase(); // Novo

    const filteredTransacoes = transacoes.filter(t => {
        const dataTransacao = new Date(t.data || t.dataPrevista);
        const inicioDate = dataInicioFiltro ? new Date(dataInicioFiltro) : null;
        const fimDate = dataFimFiltro ? new Date(dataFimFiltro) : null;
        if (fimDate) fimDate.setHours(23, 59, 59, 999);

        const isWithinDateRange = (!inicioDate || dataTransacao >= inicioDate) && (!fimDate || dataTransacao <= fimDate);
        const isMatchingCategory = categoriaFiltro === 'all' || (t.categoria && t.categoria.toLowerCase() === categoriaFiltro.toLowerCase());
        const isMatchingDescription = !descricaoFiltro || (t.descricao && t.descricao.toLowerCase().includes(descricaoFiltro)); // Novo
        
        return isWithinDateRange && isMatchingCategory && isMatchingDescription; // Atualizado
    });

    renderSummary(filteredTransacoes);
    renderAllTransactionsTable(filteredTransacoes);
}

function renderSummary(filteredTransacoes) {
    const totalReceitas = filteredTransacoes
        .filter(t => t.tipo === 'receita')
        .reduce((sum, t) => sum + (t.valor || t.valorPrevisto), 0);
    
    const totalDespesas = filteredTransacoes
        .filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + (t.valor || t.valorPrevisto), 0);

    totalReceitasPrevistasEl.textContent = formatCurrency(totalReceitas);
    totalDespesasPrevistasFiltroEl.textContent = formatCurrency(Math.abs(totalDespesas));
    saldoPeriodoEl.textContent = formatCurrency(totalReceitas + totalDespesas);
}

// ATUALIZADO: Agora renderiza na página de Previsões
// =================================================================================
// FILTROS DA PÁGINA DE PREVISÕES
// =================================================================================

function applyForecastFilters() {
    const periodFilter = document.getElementById('forecastPeriodFilter').value;
    const typeFilter = document.getElementById('forecastTypeFilter').value;
    const categoryFilter = document.getElementById('forecastCategoryFilter').value;
    const descriptionFilter = document.getElementById('forecastDescriptionFilter').value.toLowerCase();
    const minValue = parseFloat(document.getElementById('forecastMinValue').value) || 0;
    const maxValue = parseFloat(document.getElementById('forecastMaxValue').value) || Infinity;
    const sortBy = document.getElementById('forecastSortBy').value;
    
    const hoje = new Date();
    let dataLimite = new Date(hoje);
    
    // Aplicar filtro de período
    if (periodFilter === 'custom') {
        const startDate = document.getElementById('forecastStartDate').value;
        const endDate = document.getElementById('forecastEndDate').value;
        if (startDate && endDate) {
            dataLimite = new Date(endDate);
        }
    } else if (periodFilter !== 'all') {
        dataLimite.setDate(dataLimite.getDate() + parseInt(periodFilter));
    } else {
        dataLimite.setFullYear(dataLimite.getFullYear() + 10); // Mostrar tudo
    }

    // Filtrar transações
    let filteredTransactions = transacoes.filter(t => {
        if (t.status !== 'previsto') return false;
        
        const dataTransacao = new Date(t.dataPrevista);
        
        // Filtro de período
        if (periodFilter === 'custom') {
            const startDate = document.getElementById('forecastStartDate').value;
            const endDate = document.getElementById('forecastEndDate').value;
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                if (dataTransacao < start || dataTransacao > end) return false;
            }
        } else {
            if (dataTransacao < hoje || dataTransacao > dataLimite) return false;
        }
        
        // Filtro de tipo
        if (typeFilter !== 'all' && t.tipo !== typeFilter) return false;
        
        // Filtro de categoria
        if (categoryFilter !== 'all' && t.categoria !== categoryFilter) return false;
        
        // Filtro de descrição
        if (descriptionFilter && !t.descricao.toLowerCase().includes(descriptionFilter)) return false;
        
        // Filtro de valor
        const valor = Math.abs(t.valorPrevisto);
        if (valor < minValue || valor > maxValue) return false;
        
        return true;
    });

    // Aplicar ordenação
    filteredTransactions.sort((a, b) => {
        switch (sortBy) {
            case 'date':
                return new Date(a.dataPrevista) - new Date(b.dataPrevista);
            case 'date-desc':
                return new Date(b.dataPrevista) - new Date(a.dataPrevista);
            case 'value-asc':
                return Math.abs(a.valorPrevisto) - Math.abs(b.valorPrevisto);
            case 'value-desc':
                return Math.abs(b.valorPrevisto) - Math.abs(a.valorPrevisto);
            case 'description':
                return a.descricao.localeCompare(b.descricao);
            default:
                return new Date(a.dataPrevista) - new Date(b.dataPrevista);
        }
    });

    return filteredTransactions;
}

function renderFilteredForecastsPage() {
    const filteredTransactions = applyForecastFilters();
    
    let despesasHtml = '';
    let receitasHtml = '';

    filteredTransactions.forEach(item => {
        const isDespesa = item.tipo === 'despesa';
        const rowHtml = `
            <tr class="cursor-pointer hover:bg-gray-50" onclick="showEditTransacaoModal('${item.id}')">
                <td class="py-3 px-4">${formatDateToBrazil(item.dataPrevista)}</td>
                <td class="py-3 px-4">${item.descricao}</td>
                <td class="py-3 px-4 ${isDespesa ? 'text-red-600' : 'text-green-600'} font-bold">${formatCurrency(item.valorPrevisto)}</td>
                <td class="py-3 px-4">
                    <button onclick="event.stopPropagation(); showMarcarTransacaoModal('${item.id}', '${item.tipo}')" class="px-3 py-1 text-sm bg-green-500 text-white rounded-full hover:bg-green-600">
                        ${isDespesa ? 'Pagar' : 'Receber'}
                    </button>
                </td>
            </tr>
        `;
        if (isDespesa) {
            despesasHtml += rowHtml;
        } else {
            receitasHtml += rowHtml;
        }
    });

    despesasVencerTableBody.innerHTML = despesasHtml || '<tr><td colspan="4" class="py-3 px-4 text-center text-gray-500">Nenhuma despesa encontrada com os filtros aplicados.</td></tr>';
    receitasReceberTableBody.innerHTML = receitasHtml || '<tr><td colspan="4" class="py-3 px-4 text-center text-gray-500">Nenhuma receita encontrada com os filtros aplicados.</td></tr>';

    // Calcula e exibe os totais baseados nos filtros
    const totalFiltradoDespesas = filteredTransactions
        .filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + Math.abs(t.valorPrevisto), 0);
    
    const totalFiltradoReceitas = filteredTransactions
        .filter(t => t.tipo === 'receita')
        .reduce((sum, t) => sum + t.valorPrevisto, 0);

    const balancoFuturoFiltrado = totalFiltradoReceitas - totalFiltradoDespesas;

    // Totais gerais (não filtrados)
    const totalPago = transacoes
        .filter(t => t.status === 'realizado' && t.tipo === 'despesa')
        .reduce((sum, t) => sum + Math.abs(t.valor), 0);
    
    const totalRecebido = transacoes
        .filter(t => t.status === 'realizado' && t.tipo === 'receita')
        .reduce((sum, t) => sum + t.valor, 0);

    totalPagoEl.textContent = formatCurrency(totalPago);
    totalRecebidoEl.textContent = formatCurrency(totalRecebido);
    balancoFuturoEl.textContent = formatCurrency(balancoFuturoFiltrado);
}

function populateForecastCategoryFilter() {
    const categorySelect = document.getElementById('forecastCategoryFilter');
    categorySelect.innerHTML = '<option value="all">Todas as Categorias</option>';
    
    Array.from(categoriasSalvas).sort().forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        categorySelect.appendChild(option);
    });
}

function clearForecastFilters() {
    document.getElementById('forecastPeriodFilter').value = '7';
    document.getElementById('forecastTypeFilter').value = 'all';
    document.getElementById('forecastCategoryFilter').value = 'all';
    document.getElementById('forecastDescriptionFilter').value = '';
    document.getElementById('forecastMinValue').value = '';
    document.getElementById('forecastMaxValue').value = '';
    document.getElementById('forecastSortBy').value = 'date';
    document.getElementById('forecastStartDate').value = '';
    document.getElementById('forecastEndDate').value = '';
    
    // Ocultar filtros personalizados
    document.getElementById('customDateFilters').classList.add('hidden');
    
    // Aplicar filtros limpos
    renderFilteredForecastsPage();
}

function toggleForecastFilters() {
    const filtersSection = document.querySelector('#page-forecasts .bg-gray-50');
    const toggleButton = document.getElementById('toggleFilters');
    
    if (filtersSection.classList.contains('hidden')) {
        filtersSection.classList.remove('hidden');
        toggleButton.textContent = '📋 Ocultar Filtros';
    } else {
        filtersSection.classList.add('hidden');
        toggleButton.textContent = '📋 Mostrar Filtros';
    }
}

function renderForecastsPage() {
    // Atualizar categorias no filtro
    populateForecastCategoryFilter();
    
    // Renderizar com filtros aplicados
    renderFilteredForecastsPage();
}


function renderAllTransactionsTable(transacoes) {
    transacoesTableBody.innerHTML = '';
    transacoes.sort((a, b) => new Date(b.data || b.dataPrevista) - new Date(a.data || a.dataPrevista));

    transacoes.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'cursor-pointer hover:bg-gray-50';
        row.onclick = () => showEditTransacaoModal(item.id);
        
        const valorExibido = item.status === 'realizado' ? item.valor : item.valorPrevisto;
        
        row.innerHTML = `
            <td class="py-3 px-4">${formatDateToBrazil(item.data || item.dataPrevista)}</td>
            <td class="py-3 px-4">${item.descricao}</td>
            <td class="py-3 px-4"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'realizado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${item.status}</span></td>
            <td class="py-3 px-4 ${valorExibido >= 0 ? 'text-green-600' : 'text-red-600'} font-bold">${formatCurrency(valorExibido)}</td>
            <td class="py-3 px-4 space-x-2 whitespace-nowrap">
                <button onclick="event.stopPropagation(); showEditTransacaoModal('${item.id}')" class="text-blue-500 hover:text-blue-700">Editar</button>
                <button onclick="event.stopPropagation(); deleteTransacao('${item.id}')" class="text-red-500 hover:text-red-700">Excluir</button>
            </td>
        `;
        transacoesTableBody.appendChild(row);
    });
}

window.showMarcarTransacaoModal = function(id, tipo) {
    const transacao = transacoes.find(t => t.id === id);
    if (!transacao) return;

    document.getElementById('transacaoIdToMarkPaid').value = id;
    document.getElementById('transacaoTipoToMarkPaid').value = tipo;
    document.getElementById('valorPago').value = Math.abs(transacao.valorPrevisto);
    document.getElementById('dataPagamento').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('modalTitle').textContent = tipo === 'despesa' ? 'Registrar Pagamento' : 'Registrar Recebimento';
    document.getElementById('confirmButton').textContent = tipo === 'despesa' ? 'Confirmar Pagamento' : 'Confirmar Recebimento';
    
    marcarPagoModal.classList.remove('hidden');
};

// NOVO: Modal de Edição de Transação
window.showEditTransacaoModal = function(id) {
    const transacao = transacoes.find(t => t.id === id);
    if (!transacao) return;

    document.getElementById('editTransacaoId').value = transacao.id;
    document.getElementById('editTipo').value = transacao.tipo;
    // Para transações 'previsto', o valor é 'valorPrevisto', para 'realizado' é 'valor'
    const valor = transacao.status === 'realizado' ? transacao.valor : transacao.valorPrevisto;
    document.getElementById('editValor').value = Math.abs(valor);
    document.getElementById('editDescricao').value = transacao.descricao;
    // A data pode ser 'data' ou 'dataPrevista'
    document.getElementById('editData').value = transacao.data || transacao.dataPrevista;
    document.getElementById('editCategoria').value = transacao.categoria;
    
    editTransacaoModal.classList.remove('hidden');
};

// NOVO: Gerenciador de Categorias
function renderCategoryManager() {
    categoryManagerContainer.innerHTML = '';
    Array.from(categoriasSalvas).sort().forEach(cat => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-2 bg-gray-100 rounded-md';
        div.innerHTML = `
            <span class="text-gray-800">${cat}</span>
            <div class="space-x-2">
                <button onclick="editCategoria('${cat}')" class="text-blue-500 hover:text-blue-700">Editar</button>
                <button onclick="deleteCategoria('${cat}')" class="text-red-500 hover:text-red-700">Excluir</button>
            </div>
        `;
        categoryManagerContainer.appendChild(div);
    });
}

// =================================================================================
// MANIPULAÇÃO DE DADOS (CRUD)
// =================================================================================

window.deleteTransacao = async function(id) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    if (isMobile) {
        try {
            await db.run('DELETE FROM transacoes WHERE id = ?', [id]);
            transacoes = transacoes.filter(t => t.id !== id);
            updateUI();
            showMessage('Transação excluída com sucesso.');
        } catch (e) {
            console.error("Erro ao excluir transação:", e);
            showMessage('Erro ao excluir transação.');
        }
    } else {
        transacoes = transacoes.filter(t => t.id !== id);
        saveDataToLocalStorage();
        updateUI();
        showMessage('Transação excluída com sucesso.');
    }
};

// NOVO: Editar Categoria
window.editCategoria = async function(oldName) {
    const newName = prompt('Digite o novo nome para a categoria:', oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;

    if (isMobile) {
        try {
            await db.run('UPDATE categorias SET nome = ? WHERE nome = ?', [newName, oldName]);
            await db.run('UPDATE transacoes SET categoria = ? WHERE categoria = ?', [newName, oldName]);
            await loadDataFromDB(); // Recarrega tudo para garantir consistência
            updateUI();
            showMessage('Categoria atualizada com sucesso.');
        } catch (e) {
            console.error("Erro ao editar categoria:", e);
            showMessage('Erro ao editar categoria.');
        }
    } else {
        // Atualiza no set de categorias
        categoriasSalvas.delete(oldName);
        categoriasSalvas.add(newName);
        // Atualiza em todas as transações
        transacoes.forEach(t => {
            if (t.categoria === oldName) {
                t.categoria = newName;
            }
        });
        saveDataToLocalStorage();
        updateUI();
        showMessage('Categoria atualizada com sucesso.');
    }
};

// NOVO: Deletar Categoria
window.deleteCategoria = async function(name) {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${name}"? Isso removerá a categoria de todas as transações associadas.`)) return;

    if (isMobile) {
        try {
            await db.run('DELETE FROM categorias WHERE nome = ?', [name]);
            await db.run('UPDATE transacoes SET categoria = "" WHERE categoria = ?', [name]);
            await loadDataFromDB();
            updateUI();
            showMessage('Categoria excluída.');
        } catch (e) {
            console.error("Erro ao excluir categoria:", e);
            showMessage('Erro ao excluir categoria.');
        }
    } else {
        categoriasSalvas.delete(name);
        transacoes.forEach(t => {
            if (t.categoria === name) {
                t.categoria = ''; // Remove a categoria da transação
            }
        });
        saveDataToLocalStorage();
        updateUI();
        showMessage('Categoria excluída.');
    }
};


function updateVisibilityBasedOnType() {
    const isReceita = tipoSelect.value === 'receita';
    isParceladaContainer.classList.toggle('hidden', isReceita);
    if (isReceita) {
        isParceladaCheckbox.checked = false;
        parcelamentoFields.classList.add('hidden');
    }
}

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
    const categoria = categoriaEl.value.trim();
    const valorInicial = parseFloat(document.getElementById('valor').value);
    const dataInicial = document.getElementById('data').value;
    
    let newTransactions = [];

    try {
        if (isMobile) {
            if (isParcelada) {
                const numParcelas = parseInt(document.getElementById('numParcelas').value, 10);
                const valorParcela = -(valorInicial / numParcelas);
                for (let i = 0; i < numParcelas; i++) {
                    const dataParcela = new Date(dataInicial + 'T12:00:00');
                    dataParcela.setMonth(dataParcela.getMonth() + i);
                    newTransactions.push({
                        id: `${Date.now()}-${i}`,
                        dataPrevista: dataParcela.toISOString().split('T')[0],
                        descricao: `${descricao} (${i + 1}/${numParcelas})`,
                        status: 'previsto', tipo: 'despesa', categoria,
                        valorPrevisto: valorParcela, valor: null, data: null
                    });
                }
            } else if (isRecorrente) {
                const numRepeticoes = parseInt(document.getElementById('numRepeticoes').value, 10);
                const valorRecorrente = tipo === 'despesa' ? -valorInicial : valorInicial;
                for (let i = 0; i < numRepeticoes; i++) {
                    const dataPrevista = new Date(dataInicial + 'T12:00:00');
                    dataPrevista.setMonth(dataPrevista.getMonth() + i);
                    newTransactions.push({
                        id: `${Date.now()}-${i}`,
                        dataPrevista: dataPrevista.toISOString().split('T')[0],
                        descricao: `${descricao} (Recorrente)`,
                        status: 'previsto', tipo, categoria,
                        valorPrevisto: valorRecorrente, valor: null, data: null
                    });
                }
            } else {
                newTransactions.push({
                    id: `${Date.now()}`,
                    data: dataInicial, descricao, status: 'realizado', tipo, categoria,
                    valor: tipo === 'despesa' ? -valorInicial : valorInicial,
                    valorPrevisto: null, dataPrevista: null
                });
            }

            // Salvar no DB
            for (const t of newTransactions) {
                await db.run(
                    'INSERT INTO transacoes (id, descricao, valor, data, tipo, categoria, status, valorPrevisto, dataPrevista) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [t.id, t.descricao, t.valor, t.data, t.tipo, t.categoria, t.status, t.valorPrevisto, t.dataPrevista]
                );
                transacoes.push(t);
            }

            if (categoria && !categoriasSalvas.has(categoria)) {
                await db.run('INSERT INTO categorias (nome) VALUES (?)', [categoria]);
                categoriasSalvas.add(categoria);
            }
            
            updateUI();
            transacaoForm.reset();
            document.getElementById('data').value = new Date().toISOString().split('T')[0];
            updateVisibilityBasedOnType();
            showMessage('Transação(ões) adicionada(s) com sucesso!');

        } else {
            // --- Lógica para navegador ---
            if (isParcelada) {
                const numParcelas = parseInt(document.getElementById('numParcelas').value, 10);
                const valorParcela = -(valorInicial / numParcelas);
                for (let i = 0; i < numParcelas; i++) {
                    const dataParcela = new Date(dataInicial + 'T12:00:00');
                    dataParcela.setMonth(dataParcela.getMonth() + i);
                    transacoes.push({
                        id: `${Date.now()}-${i}`,
                        dataPrevista: dataParcela.toISOString().split('T')[0],
                        descricao: `${descricao} (${i + 1}/${numParcelas})`,
                        status: 'previsto', tipo: 'despesa', categoria,
                        valorPrevisto: valorParcela, valor: null, data: null
                    });
                }
            } else if (isRecorrente) {
                const numRepeticoes = parseInt(document.getElementById('numRepeticoes').value, 10);
                const valorRecorrente = tipo === 'despesa' ? -valorInicial : valorInicial;
                for (let i = 0; i < numRepeticoes; i++) {
                    const dataPrevista = new Date(dataInicial + 'T12:00:00');
                    dataPrevista.setMonth(dataPrevista.getMonth() + i);
                    transacoes.push({
                        id: `${Date.now()}-${i}`,
                        dataPrevista: dataPrevista.toISOString().split('T')[0],
                        descricao: `${descricao} (Recorrente)`,
                        status: 'previsto', tipo, categoria,
                        valorPrevisto: valorRecorrente, valor: null, data: null
                    });
                }
            } else {
                transacoes.push({
                    id: `${Date.now()}`,
                    data: dataInicial, descricao, status: 'realizado', tipo, categoria,
                    valor: tipo === 'despesa' ? -valorInicial : valorInicial,
                    valorPrevisto: null, dataPrevista: null
                });
            }
            if (categoria && !categoriasSalvas.has(categoria)) {
                categoriasSalvas.add(categoria);
            }
            saveDataToLocalStorage();
            updateUI();
            transacaoForm.reset();
            document.getElementById('data').value = new Date().toISOString().split('T')[0];
            updateVisibilityBasedOnType();
            showMessage('Transação(ões) adicionada(s) com sucesso!');
        }
    } catch (e) {
        console.error("Erro ao adicionar transação: ", e);
        showMessage('Erro ao salvar transação.');
    }
});

// NOVO: Listener para o formulário de edição
editTransacaoForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const id = document.getElementById('editTransacaoId').value;
    const tipo = document.getElementById('editTipo').value;
    let valor = parseFloat(document.getElementById('editValor').value);
    const descricao = document.getElementById('editDescricao').value;
    const data = document.getElementById('editData').value;
    const categoria = document.getElementById('editCategoria').value.trim();

    if (tipo === 'despesa' && valor > 0) {
        valor = -valor;
    }

    const originalTransacao = transacoes.find(t => t.id === id);
    if (!originalTransacao) return;

    const isRealizado = originalTransacao.status === 'realizado';

    if (isMobile) {
        try {
            if (isRealizado) {
                await db.run(
                    'UPDATE transacoes SET tipo = ?, valor = ?, descricao = ?, data = ?, categoria = ? WHERE id = ?',
                    [tipo, valor, descricao, data, categoria, id]
                );
            } else { // é 'previsto'
                await db.run(
                    'UPDATE transacoes SET tipo = ?, valorPrevisto = ?, descricao = ?, dataPrevista = ?, categoria = ? WHERE id = ?',
                    [tipo, valor, descricao, data, categoria, id]
                );
            }
            
            if (categoria && !categoriasSalvas.has(categoria)) {
                await db.run('INSERT INTO categorias (nome) VALUES (?)', [categoria]);
            }
            
            await loadDataFromDB(); // Recarrega para garantir consistência
            updateUI();
            editTransacaoModal.classList.add('hidden');
            showMessage('Transação atualizada com sucesso!');

        } catch (e) {
            console.error("Erro ao atualizar transação:", e);
            showMessage('Erro ao atualizar transação.');
        }
    } else {
        const index = transacoes.findIndex(t => t.id === id);
        if (index > -1) {
            const updatedTransacao = { ...transacoes[index], tipo, descricao, categoria };
            if (isRealizado) {
                updatedTransacao.valor = valor;
                updatedTransacao.data = data;
            } else {
                updatedTransacao.valorPrevisto = valor;
                updatedTransacao.dataPrevista = data;
            }
            transacoes[index] = updatedTransacao;

            if (categoria && !categoriasSalvas.has(categoria)) {
                categoriasSalvas.add(categoria);
            }
            
            saveDataToLocalStorage();
            updateUI();
            editTransacaoModal.classList.add('hidden');
            showMessage('Transação atualizada com sucesso!');
        }
    }
});


marcarPagoForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const id = document.getElementById('transacaoIdToMarkPaid').value;
    const tipo = document.getElementById('transacaoTipoToMarkPaid').value;
    const dataPagamento = document.getElementById('dataPagamento').value;
    let valorPago = parseFloat(document.getElementById('valorPago').value);
    if (tipo === 'despesa' && valorPago > 0) valorPago = -valorPago;
    if (isMobile) {
        try {
            await db.run(
                'UPDATE transacoes SET status = ?, valor = ?, data = ?, valorPrevisto = NULL, dataPrevista = NULL WHERE id = ?',
                ['realizado', valorPago, dataPagamento, id]
            );
            const index = transacoes.findIndex(t => t.id === id);
            if (index > -1) {
                transacoes[index] = { ...transacoes[index], status: 'realizado', valor: valorPago, data: dataPagamento, valorPrevisto: null, dataPrevista: null };
            }
            updateUI();
            marcarPagoModal.classList.add('hidden');
            showMessage('Transação atualizada com sucesso!');
        } catch (e) {
            console.error("Erro ao marcar transação:", e);
            showMessage('Erro ao atualizar transação.');
        }
    } else {
        const index = transacoes.findIndex(t => t.id === id);
        if (index > -1) {
            transacoes[index] = { ...transacoes[index], status: 'realizado', valor: valorPago, data: dataPagamento, valorPrevisto: null, dataPrevista: null };
            saveDataToLocalStorage();
            updateUI();
            marcarPagoModal.classList.add('hidden');
            showMessage('Transação atualizada com sucesso!');
        }
    }
});

deleteForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const descricao = deleteDescricaoEl.value.trim();
    const dataInicio = deleteDataInicioEl.value;
    const dataFim = deleteDataFimEl.value;
    if (!descricao && !dataInicio && !dataFim) {
        showMessage('Insira ao menos um critério para exclusão.');
        return;
    }
    if (isMobile) {
        // ...existing code para SQLite...
    } else {
        const initialCount = transacoes.length;
        transacoes = transacoes.filter(t => {
            const dataTransacao = t.data || t.dataPrevista;
            const matchesDesc = descricao ? t.descricao.includes(descricao) : true;
            const matchesDate = (!dataInicio || dataTransacao >= dataInicio) && (!dataFim || dataTransacao <= dataFim);
            return !(matchesDesc && matchesDate);
        });
        const numDeleted = initialCount - transacoes.length;
        if (numDeleted > 0) {
            saveDataToLocalStorage();
            updateUI();
            showMessage(`${numDeleted} transação(ões) excluída(s).`);
            this.reset();
        } else {
            showMessage('Nenhuma transação encontrada com os critérios especificados.');
        }
    }
});

// =================================================================================
// EVENT LISTENERS ADICIONAIS
// =================================================================================

tipoSelect.addEventListener('change', updateVisibilityBasedOnType);
isParceladaCheckbox.addEventListener('change', () => parcelamentoFields.classList.toggle('hidden', !isParceladaCheckbox.checked));
isRecorrenteCheckbox.addEventListener('change', () => recorrenteFields.classList.toggle('hidden', !isRecorrenteCheckbox.checked));
document.getElementById('cancelMarcarPago').addEventListener('click', () => marcarPagoModal.classList.add('hidden'));
cancelEditTransacao.addEventListener('click', () => editTransacaoModal.classList.add('hidden')); // Novo

// Listeners para filtros de Relatórios
[filtroPeriodoEl, filtroCategoriaEl, dataInicioEl, dataFimEl].forEach(el => el.addEventListener('change', renderTables));
filtroDescricaoEl.addEventListener('input', renderTables);

// Listener para o campo de previsão de saldo (atualiza dashboard)
previsaoDataEl.addEventListener('change', () => {
    calculateDashboardMetrics();
    renderSummaryByDescription();
});

// =================================================================================
// MODAL DE DETALHES DO DASHBOARD
// =================================================================================

window.showDashboardDetails = function(descricaoBase) {
    const dataLimite = previsaoDataEl.value || new Date().toISOString().split('T')[0];
    
    // Filtrar transações que correspondem à descrição base
    const transacoesFiltradas = transacoes.filter(t => {
        const dataTransacao = t.data || t.dataPrevista;
        if (dataTransacao > dataLimite) return false;
        
        // Normalizar a descrição da transação da mesma forma que foi feito no resumo
        let baseDesc = t.descricao;
        baseDesc = baseDesc.replace(/\s*\(\d+\/\d+\)$/, '');
        baseDesc = baseDesc.replace(/\s*\(Recorrente\s*\d+\s*de\s*\d+\)$/, '');
        baseDesc = baseDesc.replace(/\s*\(Recorrente\)$/, '');
        baseDesc = baseDesc.trim();
        
        return baseDesc === descricaoBase;
    });
    
    // Ordenar por data
    transacoesFiltradas.sort((a, b) => {
        const dataA = new Date(a.data || a.dataPrevista);
        const dataB = new Date(b.data || b.dataPrevista);
        return dataA - dataB;
    });
    
    // Atualizar título do modal
    document.getElementById('dashboardDetailsTitle').textContent = `Detalhes: ${descricaoBase}`;
    
    // Renderizar tabela
    const tableBody = document.getElementById('dashboardDetailsTableBody');
    tableBody.innerHTML = '';
    
    let totalPago = 0;
    let totalRestante = 0;
    
    transacoesFiltradas.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'cursor-pointer hover:bg-gray-50';
        row.onclick = () => {
            document.getElementById('dashboardDetailsModal').classList.add('hidden');
            showEditTransacaoModal(item.id);
        };
        
        const valorExibido = item.status === 'realizado' ? item.valor : item.valorPrevisto;
        const isNegative = valorExibido < 0;
        
        if (item.status === 'realizado') {
            totalPago += item.valor;
        } else {
            totalRestante += item.valorPrevisto;
        }
        
        row.innerHTML = `
            <td class="py-3 px-4">${formatDateToBrazil(item.data || item.dataPrevista)}</td>
            <td class="py-3 px-4">${item.descricao}</td>
            <td class="py-3 px-4">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'realizado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                    ${item.status}
                </span>
            </td>
            <td class="py-3 px-4 ${isNegative ? 'text-red-600' : 'text-green-600'} font-bold">${formatCurrency(valorExibido)}</td>
            <td class="py-3 px-4 space-x-2 whitespace-nowrap">
                <button onclick="event.stopPropagation(); showEditTransacaoModal('${item.id}')" class="text-blue-500 hover:text-blue-700">Editar</button>
                <button onclick="event.stopPropagation(); deleteTransacao('${item.id}')" class="text-red-500 hover:text-red-700">Excluir</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Atualizar totais
    const totalGeral = totalPago + totalRestante;
    document.getElementById('detailsTotalGeral').textContent = formatCurrency(totalGeral);
    document.getElementById('detailsTotalPago').textContent = formatCurrency(totalPago);
    document.getElementById('detailsTotalRestante').textContent = formatCurrency(totalRestante);
    
    // Mostrar modal
    document.getElementById('dashboardDetailsModal').classList.remove('hidden');
};

// Event listener para fechar o modal
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('dashboardDetailsModal');
    const closeBtn = document.getElementById('closeDashboardDetails');
    
    if (closeBtn) {
        closeBtn.onclick = () => modal.classList.add('hidden');
    }
    
    // Fechar modal clicando fora dele
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        };
    }
});

// =================================================================================
// INTELIGÊNCIA FINANCEIRA
// =================================================================================

class FinancialIntelligence {
    constructor() {
        this.periods = {
            short: 7,    // 7 dias
            medium: 30,  // 30 dias
            long: 90     // 90 dias
        };
    }

    // Calcular métricas de performance para diferentes períodos
    calculatePerformanceScores() {
        const hoje = new Date();
        const scores = {};

        Object.keys(this.periods).forEach(period => {
            const days = this.periods[period];
            const dataLimite = new Date(hoje);
            dataLimite.setDate(dataLimite.getDate() - days);
            
            const transacoesPeriodo = transacoes.filter(t => {
                const dataTransacao = new Date(t.data || t.dataPrevista);
                return dataTransacao >= dataLimite && dataTransacao <= hoje;
            });

            const receitas = transacoesPeriodo
                .filter(t => t.tipo === 'receita' && t.status === 'realizado')
                .reduce((sum, t) => sum + t.valor, 0);

            const despesas = transacoesPeriodo
                .filter(t => t.tipo === 'despesa' && t.status === 'realizado')
                .reduce((sum, t) => sum + Math.abs(t.valor), 0);

            const saldo = receitas - despesas;
            const eficiencia = receitas > 0 ? (saldo / receitas) * 100 : 0;
            
            // Score de 0 a 100 baseado na eficiência
            let score = Math.max(0, Math.min(100, eficiencia + 50));
            
            scores[period] = {
                score: Math.round(score),
                receitas,
                despesas,
                saldo,
                eficiencia
            };
        });

        return scores;
    }

    // Analisar tendências de receitas e despesas
    analyzeTrends() {
        const hoje = new Date();
        const mes30Dias = new Date(hoje);
        mes30Dias.setDate(mes30Dias.getDate() - 30);
        const mes60Dias = new Date(hoje);
        mes60Dias.setDate(mes60Dias.getDate() - 60);

        // Últimos 30 dias
        const transacoes30 = transacoes.filter(t => {
            const data = new Date(t.data || t.dataPrevista);
            return data >= mes30Dias && data <= hoje && t.status === 'realizado';
        });

        // 30-60 dias atrás
        const transacoes60 = transacoes.filter(t => {
            const data = new Date(t.data || t.dataPrevista);
            return data >= mes60Dias && data < mes30Dias && t.status === 'realizado';
        });

        const receitas30 = transacoes30.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
        const receitas60 = transacoes60.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
        const despesas30 = transacoes30.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + Math.abs(t.valor), 0);
        const despesas60 = transacoes60.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + Math.abs(t.valor), 0);

        return {
            receitas: {
                atual: receitas30,
                anterior: receitas60,
                tendencia: receitas60 > 0 ? ((receitas30 - receitas60) / receitas60) * 100 : 0
            },
            despesas: {
                atual: despesas30,
                anterior: despesas60,
                tendencia: despesas60 > 0 ? ((despesas30 - despesas60) / despesas60) * 100 : 0
            }
        };
    }

    // Gerar conselhos personalizados
    generateAdvice() {
        const scores = this.calculatePerformanceScores();
        const trends = this.analyzeTrends();
        const advice = [];

        // Análise baseada no score geral
        const avgScore = (scores.short.score + scores.medium.score + scores.long.score) / 3;

        if (avgScore >= 80) {
            advice.push({
                type: 'success',
                icon: '🎉',
                title: 'Excelente Desempenho!',
                message: 'Parabéns! Você está mantendo uma excelente saúde financeira. Continue assim!'
            });
        } else if (avgScore >= 60) {
            advice.push({
                type: 'warning',
                icon: '👍',
                title: 'Bom Desempenho',
                message: 'Você está no caminho certo! Algumas pequenas melhorias podem levar você ao próximo nível.'
            });
        } else if (avgScore >= 40) {
            advice.push({
                type: 'caution',
                icon: '⚠️',
                title: 'Atenção Necessária',
                message: 'Sua situação financeira precisa de atenção. Vamos trabalhar juntos para melhorar!'
            });
        } else {
            advice.push({
                type: 'danger',
                icon: '🚨',
                title: 'Situação Crítica',
                message: 'É importante tomar medidas imediatas para equilibrar suas finanças.'
            });
        }

        // Conselhos baseados em tendências
        if (trends.despesas.tendencia > 20) {
            advice.push({
                type: 'warning',
                icon: '📉',
                title: 'Despesas em Alta',
                message: `Suas despesas aumentaram ${trends.despesas.tendencia.toFixed(1)}% no último mês. Revise seus gastos.`
            });
        }

        if (trends.receitas.tendencia < -10) {
            advice.push({
                type: 'info',
                icon: '💡',
                title: 'Receitas em Queda',
                message: `Suas receitas diminuíram ${Math.abs(trends.receitas.tendencia).toFixed(1)}%. Considere novas fontes de renda.`
            });
        }

        // Conselhos específicos baseados nos dados
        const proximasDespesas = transacoes.filter(t => {
            const hoje = new Date();
            const proximos7Dias = new Date(hoje);
            proximos7Dias.setDate(proximos7Dias.getDate() + 7);
            const data = new Date(t.dataPrevista);
            return t.status === 'previsto' && t.tipo === 'despesa' && data <= proximos7Dias;
        });

        if (proximasDespesas.length > 0) {
            const totalProximas = proximasDespesas.reduce((sum, t) => sum + Math.abs(t.valorPrevisto), 0);
            advice.push({
                type: 'info',
                icon: '📅',
                title: 'Despesas Próximas',
                message: `Você tem ${formatCurrency(totalProximas)} em despesas previstas para os próximos 7 dias.`
            });
        }

        return advice;
    }

    // Gerar alertas importantes
    generateAlerts() {
        const alerts = [];
        const hoje = new Date();

        // Verificar transações vencidas
        const vencidas = transacoes.filter(t => {
            const data = new Date(t.dataPrevista);
            return t.status === 'previsto' && data < hoje;
        });

        if (vencidas.length > 0) {
            alerts.push({
                type: 'danger',
                message: `${vencidas.length} transação(ões) vencida(s) precisam de atenção.`
            });
        }

        // Verificar saldo baixo
        const saldoAtual = transacoes
            .filter(t => t.status === 'realizado')
            .reduce((sum, t) => sum + t.valor, 0);

        if (saldoAtual < 0) {
            alerts.push({
                type: 'danger',
                message: 'Saldo negativo detectado. Revise suas finanças urgentemente.'
            });
        }

        return alerts;
    }

    // Sugerir metas
    generateGoals() {
        const trends = this.analyzeTrends();
        const goals = [];

        // Meta de redução de despesas
        if (trends.despesas.tendencia > 0) {
            goals.push({
                icon: '🎯',
                title: 'Reduzir Despesas',
                description: `Meta: Reduzir gastos em ${Math.min(trends.despesas.tendencia, 20).toFixed(0)}% no próximo mês`,
                progress: 0
            });
        }

        // Meta de aumento de receitas
        if (trends.receitas.tendencia < 0) {
            goals.push({
                icon: '💰',
                title: 'Aumentar Receitas',
                description: 'Meta: Buscar novas fontes de renda ou aumentar receitas existentes',
                progress: 0
            });
        }

        // Meta de consistência
        goals.push({
            icon: '📊',
            title: 'Manter Consistência',
            description: 'Meta: Registrar todas as transações por 30 dias consecutivos',
            progress: 75
        });

        return goals;
    }
}

// Instância da inteligência financeira
const financialAI = new FinancialIntelligence();

// Função para renderizar a página de inteligência
function renderIntelligencePage() {
    const scores = financialAI.calculatePerformanceScores();
    const trends = financialAI.analyzeTrends();
    const advice = financialAI.generateAdvice();
    const alerts = financialAI.generateAlerts();
    const goals = financialAI.generateGoals();

    // Atualizar scores
    document.getElementById('score-curto').textContent = scores.short.score;
    document.getElementById('score-medio').textContent = scores.medium.score;
    document.getElementById('score-longo').textContent = scores.long.score;

    // Atualizar status geral
    const avgScore = (scores.short.score + scores.medium.score + scores.long.score) / 3;
    const statusElement = document.getElementById('financial-status');
    const statusTitle = document.getElementById('status-title');
    const statusDescription = document.getElementById('status-description');

    if (avgScore >= 80) {
        statusElement.className = 'text-center p-4 rounded-xl mb-4 bg-green-100 border-green-300 border';
        statusTitle.textContent = '🌟 Situação Excelente!';
        statusDescription.textContent = 'Suas finanças estão em ótimo estado. Continue mantendo esse desempenho!';
    } else if (avgScore >= 60) {
        statusElement.className = 'text-center p-4 rounded-xl mb-4 bg-blue-100 border-blue-300 border';
        statusTitle.textContent = '👍 Situação Boa';
        statusDescription.textContent = 'Você está no caminho certo, mas há espaço para melhorias.';
    } else if (avgScore >= 40) {
        statusElement.className = 'text-center p-4 rounded-xl mb-4 bg-yellow-100 border-yellow-300 border';
        statusTitle.textContent = '⚠️ Atenção Necessária';
        statusDescription.textContent = 'Suas finanças precisam de mais cuidado e planejamento.';
    } else {
        statusElement.className = 'text-center p-4 rounded-xl mb-4 bg-red-100 border-red-300 border';
        statusTitle.textContent = '🚨 Situação Crítica';
        statusDescription.textContent = 'É urgente reorganizar suas finanças. Vamos ajudar você!';
    }

    // Atualizar tendências
    const trendReceitas = document.getElementById('trend-receitas');
    const trendDespesas = document.getElementById('trend-despesas');

    trendReceitas.innerHTML = `
        <div>Valor atual: ${formatCurrency(trends.receitas.atual)}</div>
        <div class="${trends.receitas.tendencia >= 0 ? 'text-green-600' : 'text-red-600'}">
            Tendência: ${trends.receitas.tendencia >= 0 ? '↗️' : '↘️'} ${Math.abs(trends.receitas.tendencia).toFixed(1)}%
        </div>
    `;

    trendDespesas.innerHTML = `
        <div>Valor atual: ${formatCurrency(trends.despesas.atual)}</div>
        <div class="${trends.despesas.tendencia <= 0 ? 'text-green-600' : 'text-red-600'}">
            Tendência: ${trends.despesas.tendencia <= 0 ? '↘️' : '↗️'} ${Math.abs(trends.despesas.tendencia).toFixed(1)}%
        </div>
    `;

    // Renderizar conselhos
    const adviceContainer = document.getElementById('advice-container');
    adviceContainer.innerHTML = '';
    advice.forEach(item => {
        const adviceDiv = document.createElement('div');
        adviceDiv.className = `p-4 rounded-lg border-l-4 ${
            item.type === 'success' ? 'bg-green-50 border-green-400' :
            item.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
            item.type === 'caution' ? 'bg-orange-50 border-orange-400' :
            item.type === 'danger' ? 'bg-red-50 border-red-400' :
            'bg-blue-50 border-blue-400'
        }`;
        adviceDiv.innerHTML = `
            <div class="flex items-start">
                <span class="text-2xl mr-3">${item.icon}</span>
                <div>
                    <h4 class="font-semibold text-gray-700">${item.title}</h4>
                    <p class="text-gray-600 text-sm">${item.message}</p>
                </div>
            </div>
        `;
        adviceContainer.appendChild(adviceDiv);
    });

    // Renderizar alertas
    const alertsContainer = document.getElementById('alerts-container');
    alertsContainer.innerHTML = '';
    if (alerts.length === 0) {
        alertsContainer.innerHTML = '<div class="text-green-600 text-sm">✅ Nenhum alerta no momento!</div>';
    } else {
        alerts.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.className = `p-3 rounded-lg ${
                alert.type === 'danger' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
            }`;
            alertDiv.textContent = alert.message;
            alertsContainer.appendChild(alertDiv);
        });
    }

    // Renderizar metas
    const goalsContainer = document.getElementById('goals-container');
    goalsContainer.innerHTML = '';
    goals.forEach(goal => {
        const goalDiv = document.createElement('div');
        goalDiv.className = 'p-4 bg-gray-50 rounded-lg';
        goalDiv.innerHTML = `
            <div class="flex items-start">
                <span class="text-2xl mr-3">${goal.icon}</span>
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-700">${goal.title}</h4>
                    <p class="text-gray-600 text-sm mb-2">${goal.description}</p>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${goal.progress}%"></div>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">${goal.progress}% concluído</div>
                </div>
            </div>
        `;
        goalsContainer.appendChild(goalDiv);
    });
}

// Event listener para o botão de atualizar análise
document.addEventListener('DOMContentLoaded', () => {
    const refreshButton = document.getElementById('refresh-analysis');
    if (refreshButton) {
        refreshButton.addEventListener('click', renderIntelligencePage);
    }
});

// =================================================================================
// EVENT LISTENERS DOS FILTROS DE PREVISÕES
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Event listeners para os filtros da página de previsões
    const applyFiltersBtn = document.getElementById('applyForecastFilters');
    const clearFiltersBtn = document.getElementById('clearForecastFilters');
    const toggleFiltersBtn = document.getElementById('toggleFilters');
    const periodFilter = document.getElementById('forecastPeriodFilter');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', renderFilteredForecastsPage);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearForecastFilters);
    }
    
    if (toggleFiltersBtn) {
        toggleFiltersBtn.addEventListener('click', toggleForecastFilters);
    }
    
    // Mostrar/ocultar campos de data personalizada
    if (periodFilter) {
        periodFilter.addEventListener('change', (e) => {
            const customDateFilters = document.getElementById('customDateFilters');
            if (e.target.value === 'custom') {
                customDateFilters.classList.remove('hidden');
            } else {
                customDateFilters.classList.add('hidden');
            }
        });
    }
    
    // Event listeners para aplicar filtros em tempo real
    const filters = [
        'forecastTypeFilter',
        'forecastCategoryFilter', 
        'forecastDescriptionFilter',
        'forecastMinValue',
        'forecastMaxValue',
        'forecastSortBy',
        'forecastStartDate',
        'forecastEndDate'
    ];
    
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            if (element.type === 'text' || element.type === 'number') {
                element.addEventListener('input', () => {
                    // Debounce para evitar muitas chamadas
                    clearTimeout(element.filterTimeout);
                    element.filterTimeout = setTimeout(renderFilteredForecastsPage, 300);
                });
            } else {
                element.addEventListener('change', renderFilteredForecastsPage);
            }
        }
    });
    
    // Aplicar filtro de período automaticamente
    if (periodFilter) {
        periodFilter.addEventListener('change', renderFilteredForecastsPage);
    }
});


// =================================================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('data').value = today;
    previsaoDataEl.value = today;
    
    // Se não estiver em um dispositivo (ou seja, no navegador), inicializa assim mesmo
    if (typeof window.CapacitorCommunitySqlite === 'undefined') {
        isMobile = false;
        loadDataFromLocalStorage();
        updateUI();
    } else {
        // Para mobile, a UI é atualizada no onDeviceReady
    }
    updateVisibilityBasedOnType();
    // A chamada inicial para updateUI() será feita após a conexão com o banco de dados ou carregamento do localStorage
});
