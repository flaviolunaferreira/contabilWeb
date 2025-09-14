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
// LÓGICA DE UI E RENDERIZAÇÃO
// =================================================================================

function updateUI() {
    renderCategorias();
    calculateDashboardMetrics();
    renderTables();
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
    transacoes.forEach(t => {
        if (t.status === 'realizado' && t.data <= hoje) {
            saldoRealizado += t.valor;
        }
    });

    let saldoFuturo = saldoRealizado;
    let totalDespesasPrevistas = 0;
    transacoes.forEach(t => {
        if (t.status === 'previsto' && t.dataPrevista <= dataPrevisao) {
            saldoFuturo += t.valorPrevisto;
            if (t.tipo === 'despesa') {
                totalDespesasPrevistas += Math.abs(t.valorPrevisto);
            }
        }
    });

    saldoRealizadoEl.textContent = formatCurrency(saldoRealizado);
    saldoFuturoEl.textContent = formatCurrency(saldoFuturo);
    totalDespesasPrevistasEl.textContent = formatCurrency(totalDespesasPrevistas);
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
    renderUpcomingTables(filteredTransacoes);
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

function renderUpcomingTables(transacoes) {
    despesasVencerTableBody.innerHTML = '';
    receitasReceberTableBody.innerHTML = '';

    const hoje = new Date().toISOString().split('T')[0];
    // Filtrar apenas transações futuras
    const previstas = transacoes.filter(t => t.status === 'previsto' && t.dataPrevista >= hoje);
    previstas.sort((a, b) => new Date(a.dataPrevista) - new Date(b.dataPrevista));

    let despesasHtml = '';
    let receitasHtml = '';

    previstas.forEach(item => {
        const isDespesa = item.tipo === 'despesa';
        const rowHtml = `
            <tr>
                <td class="py-3 px-4">${formatDateToBrazil(item.dataPrevista)}</td>
                <td class="py-3 px-4">${item.descricao}</td>
                <td class="py-3 px-4 ${isDespesa ? 'text-red-600' : 'text-green-600'} font-bold">${formatCurrency(item.valorPrevisto)}</td>
                <td class="py-3 px-4">
                    <button onclick="showMarcarTransacaoModal('${item.id}', '${item.tipo}')" class="px-3 py-1 text-sm bg-green-500 text-white rounded-full hover:bg-green-600">
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

    despesasVencerTableBody.innerHTML = despesasHtml || '<tr><td colspan="4" class="py-3 px-4 text-center text-gray-500">Nenhuma despesa prevista.</td></tr>';
    receitasReceberTableBody.innerHTML = receitasHtml || '<tr><td colspan="4" class="py-3 px-4 text-center text-gray-500">Nenhuma receita prevista.</td></tr>';
}

function renderAllTransactionsTable(transacoes) {
    transacoesTableBody.innerHTML = '';
    transacoes.sort((a, b) => new Date(b.data || b.dataPrevista) - new Date(a.data || a.dataPrevista));

    transacoes.forEach(item => {
        const row = document.createElement('tr');
        const valorExibido = item.status === 'realizado' ? item.valor : item.valorPrevisto;
        
        row.innerHTML = `
            <td class="py-3 px-4">${formatDateToBrazil(item.data || item.dataPrevista)}</td>
            <td class="py-3 px-4">${item.descricao}</td>
            <td class="py-3 px-4"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'realizado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${item.status}</span></td>
            <td class="py-3 px-4 ${valorExibido >= 0 ? 'text-green-600' : 'text-red-600'} font-bold">${formatCurrency(valorExibido)}</td>
            <td class="py-3 px-4 space-x-2 whitespace-nowrap">
                <button onclick="showEditTransacaoModal('${item.id}')" class="text-blue-500 hover:text-blue-700">Editar</button>
                <button onclick="deleteTransacao('${item.id}')" class="text-red-500 hover:text-red-700">Excluir</button>
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
[filtroPeriodoEl, filtroCategoriaEl, dataInicioEl, dataFimEl, previsaoDataEl].forEach(el => el.addEventListener('change', updateUI));
filtroDescricaoEl.addEventListener('input', updateUI); // Novo

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
    }
    updateVisibilityBasedOnType();
    // A chamada inicial para updateUI() será feita após a conexão com o banco de dados
});
