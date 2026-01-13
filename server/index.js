const express = require('express');
const cors = require('cors');
const path = require('path');
const knexConfig = require('./knexfile');
const knex = require('knex')(knexConfig.development);
const FinancialService = require('./services/FinancialService');
const CardService = require('./services/CardService');

const app = express();
app.use(cors());
app.use(express.json());

// --- DATABASE AUTO-SETUP & LOGGING ---
async function startServer() {
    const MAX_RETRIES = 5;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            console.log(`🔌 Connecting to Database (Attempt ${retries + 1}/${MAX_RETRIES})...`);
            console.log(`DB Configuration: Host=${knexConfig.development.connection.host}, DB=${knexConfig.development.connection.database}`);

            // Test Connection
            await knex.raw('SELECT 1');
            console.log('✅ Database Connection Established.');

            // Auto-Migration
            await knex.migrate.latest();
            console.log('✅ Database Migrations - Applied Successfully');
            
            break; // Success

        } catch (err) {
            retries++;
            console.error(`❌ Database Connection Failed (Attempt ${retries}):`, err.message);
            
            if (retries >= MAX_RETRIES) {
                console.error('🔥 CRITICAL: Could not connect to database after maximum retries.');
                // We continue to allow static files to be served, but API will fail
            } else {
                console.log('⏳ Waiting 5 seconds before retrying...');
                await new Promise(res => setTimeout(res, 5000));
            }
        }
    }

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`✅ ContabilWeb Server running on port ${PORT}`);
    });
}

// Serve Static Frontend
app.use(express.static(path.join(__dirname, 'www')));

// Helper to handle BigInt serialization
BigInt.prototype.toJSON = function() { return this.toString() }

// --- API ROUTES ---

// --- APIS ---
app.get('/api/health-check', (req, res) => res.json({ status: 'ok' }));

// --- FINANCIAL ENGINE ---
app.get('/api/financial/summary', async (req, res) => {
    try {
        const summary = await FinancialService.getSummary();
        res.json(summary);
    } catch (err) {
        console.error('❌ Error in /api/financial/summary:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/cartoes/:id/fatura/liquidar', async (req, res) => {
    try {
        const { id } = req.params;
        const { month, year } = req.body;
        
        if (!month || !year) {
            return res.status(400).json({ error: 'Month and Year are required.' });
        }

        const result = await CardService.liquidarFatura(id, parseInt(month), parseInt(year));
        res.json(result);
    } catch (err) {
        console.error('❌ Error in /api/cartoes/:id/fatura/liquidar:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// --- TRANSACOES ---
app.get('/api/transacoes', async (req, res) => {
    try {
        const data = await knex('transacoes').select('*');
        res.json(data);
    } catch (err) {
        console.error('❌ Error in GET /api/transacoes:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/transacoes', async (req, res) => {
    try {
        const item = req.body;
        await knex('transacoes').insert(item).onConflict('id').merge();
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Error in POST /api/transacoes:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- CARTOES ---
app.get('/api/cartoes', async (req, res) => {
    try {
        const data = await knex('cartoes').select('*');
        res.json(data);
    } catch (err) {
        console.error('❌ Error in GET /api/cartoes:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/cartoes', async (req, res) => {
    try {
        const item = req.body;
        
        // Mapeamento Frontend -> DB
        // Como alteramos a migration para usar CamelCase na próxima versão,
        // é mais seguro manter snake_case no banco e mapear aqui, 
        // mas para resolver AGORA o erro de "Unknown column active",
        // vamos alinhar o DB com o Frontend via migration update.
        // Se a migration falhar (pois tabela já existe), precisamos dropar a tabela.
        // Como é dev, vamos assumir que o usuário pode resetar ou ajustamos o payload.

        // Melhor abordagem: Mapear Payload para Snake Case (padrão SQL)
        // E garantir que a Migration use Snake Case.
        // Mas a migration anterior estava misturada.
        // Vamos forçar o dbRow para garantir compatibilidade futura.
        
        const dbRow = {
            id: item.id,
            name: item.name,
            limit: item.limit,          // Frontend manda limit (centavos)
            dueDay: item.dueDay,        // Mapeamos para CamelCase na migration nova
            closingDay: item.closingDay,
            color: item.color,
            icon: item.icon,
            active: item.active ? 1 : 0
        };

        await knex('cartoes').insert(dbRow).onConflict('id').merge();
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Error in POST /api/cartoes:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- DIVIDAS ---
app.get('/api/dividas', async (req, res) => {
    try {
        const data = await knex('dividas').select('*');
        const mapped = data.map(d => ({
            ...d,
            totalValue: d.total_value,
            paidMonths: d.paid_months,
            termMonths: d.term_months,
            monthlyRate: d.monthly_rate,
            SYSTEM: d.system
        }));
        res.json(mapped);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/dividas', async (req, res) => {
    try {
        const d = req.body;
        const dbRow = {
            id: d.id,
            description: d.description,
            total_value: d.totalValue || d.total_value,
            paid_months: d.paidMonths || d.paid_months,
            term_months: d.termMonths || d.term_months,
            monthly_rate: d.monthlyRate || d.monthly_rate,
            system: d.system || d.SYSTEM,
            saldo_devedor_atual: d.saldo_devedor_atual || 0
        };
        await knex('dividas').insert(dbRow).onConflict('id').merge();
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Error in POST /api/dividas:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Fallback for SPA (Single Page Application)
// Se não achar arquivo estático nem rota de API, manda o index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

// Inicia o servidor (via função wrapper definida no topo para garantir migrations)
startServer();

