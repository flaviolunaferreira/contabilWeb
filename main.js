const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')

// Dados do BD (guardar no diretório do usuário para persistência correta)
const dbPath = path.join(app.getPath('userData'), 'contabilWeb.db')
const db = new sqlite3.Database(dbPath)

// Inicializa Tabelas
function initDB() {
  db.serialize(() => {
    // Tabela Transactions
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY,
      desc TEXT,
      amount REAL,
      date TEXT,
      method TEXT,
      status TEXT,
      type TEXT,
      cardId INTEGER,
      use5thDay INTEGER,
      category TEXT,
      checked INTEGER,
      interest_rate REAL
    )`)
    
    // Migration simples: tentar adicionar a coluna caso não exista (ignora erro se já existir)
    db.run("ALTER TABLE transactions ADD COLUMN interest_rate REAL", (err) => { /* ignora erroColumn already exists */ })
    db.run("ALTER TABLE transactions ADD COLUMN recurrence_id INTEGER", (err) => { /* ignora erro */ })

    db.run(`CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY,
      name TEXT,
      limit_val REAL,
      closing INTEGER,
      due INTEGER
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS recurring_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      desc TEXT,
      amount REAL,
      day INTEGER,
      category TEXT,
      active INTEGER DEFAULT 1
    )`)

    // NOVA ESTRUTURA DE CATEGORIAS
    db.run(`CREATE TABLE IF NOT EXISTS category_meta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      type TEXT,
      color TEXT,
      icon TEXT,
      budget_limit REAL DEFAULT 0
    )`)

    // Migration simples para Category Budget
    db.run("ALTER TABLE category_meta ADD COLUMN budget_limit REAL DEFAULT 0", (err) => { /* ignora erro */ })

    // Migrar categorias antigas (tabela 'categories' com apenas 'name') para 'category_meta'
    // Primeiro verifica se a tabela antiga existe
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'", (err, row) => {
        if (!row) {
             // Se não existe 'categories', talvez já esteja tudo limpo ou só usando 'category_meta'
        } else {
            // Se existe, migrar dados
            db.all("SELECT name FROM categories", (err, rows) => {
                if (rows && rows.length > 0) {
                    const stmt = db.prepare("INSERT OR IGNORE INTO category_meta (name, type, color, icon) VALUES (?, ?, ?, ?)");
                    rows.forEach(r => {
                        stmt.run(r.name, 'variable', '#94a3b8', 'fa-tag');
                    });
                    stmt.finalize();
                }
            });
        }
    });
  })
}

initDB()

// --- IPC HANDLERS ---
ipcMain.handle('db-get-all-transactions', async () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM transactions", (err, rows) => {
      if (err) reject(err)
      else resolve(rows.map(r => ({
        ...r, 
        use5thDay: !!r.use5thDay,
        checked: !!r.checked
      })))
    })
  })
})

ipcMain.handle('db-get-all-categories', async () => {
    return new Promise((resolve, reject) => {
        // Tenta buscar da nova tabela primeiro
        db.all("SELECT * FROM category_meta ORDER BY name", (err, rows) => {
            if (err) reject(err)
            else resolve(rows)
        })
    })
})

ipcMain.handle('db-add-category', async (event, catObj) => {
    // catObj pode ser string (legado) ou objeto {name, type, color, icon}
    // Normalizar para objeto
    const name = typeof catObj === 'string' ? catObj : catObj.name;
    const type = catObj.type || 'variable';
    const color = catObj.color || '#94a3b8';
    const icon = catObj.icon || 'fa-tag';
    const budget = catObj.budget_limit || 0;

    return new Promise((resolve, reject) => {
        db.run("INSERT OR IGNORE INTO category_meta (name, type, color, icon, budget_limit) VALUES (?, ?, ?, ?, ?)", 
            [name, type, color, icon, budget], 
            (err) => {
                if(err) reject(err)
                else resolve(true)
            }
        )
    })
})

ipcMain.handle('db-update-category', async (event, cat) => {
    return new Promise((resolve, reject) => {
        const query = `UPDATE category_meta SET type=?, color=?, icon=?, budget_limit=? WHERE name=?`;
        db.run(query, [cat.type, cat.color, cat.icon, cat.budget_limit || 0, cat.name], (err) => {
            if(err) reject(err)
            else resolve(true)
        })
    })
})

ipcMain.handle('db-delete-category', async (event, name) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM category_meta WHERE name = ?", [name], (err) => {
            if(err) reject(err)
            else resolve(true)
        })
    })
})

ipcMain.handle('db-save-transaction', async (event, t) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO transactions (id, desc, amount, date, method, status, type, cardId, use5thDay, category, checked, interest_rate, recurrence_id) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(id) DO UPDATE SET
                   desc=excluded.desc, amount=excluded.amount, date=excluded.date, method=excluded.method, 
                   status=excluded.status, type=excluded.type, cardId=excluded.cardId, 
                   use5thDay=excluded.use5thDay, category=excluded.category, checked=excluded.checked, 
                   interest_rate=excluded.interest_rate, recurrence_id=excluded.recurrence_id`
    
    db.run(query, [
      t.id, t.desc, t.amount, t.date, t.method, t.status, t.type, t.cardId, 
      t.use5thDay ? 1 : 0, t.category, t.checked ? 1 : 0, t.interest_rate || null, t.recurrence_id || null
    ], function(err) {
      if(err) reject(err)
      else resolve(this.lastID || t.id)
    })
  })
})

ipcMain.handle('db-get-recurring', async () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM recurring_expenses WHERE active = 1", (err, rows) => {
            if (err) reject(err)
            else resolve(rows)
        })
    })
})

ipcMain.handle('db-save-recurring', async (event, r) => {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO recurring_expenses (id, desc, amount, day, category, active) 
                   VALUES (?, ?, ?, ?, ?, ?)
                   ON CONFLICT(id) DO UPDATE SET
                   desc=excluded.desc, amount=excluded.amount, day=excluded.day, category=excluded.category, active=excluded.active`;
        
        db.run(query, [r.id, r.desc, r.amount, r.day, r.category, r.active !== undefined ? r.active : 1], function(err) {
            if(err) reject(err)
            else resolve(this.lastID || r.id)
        })
    })
})

ipcMain.handle('db-delete-recurring', async (event, id) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM recurring_expenses WHERE id = ?", [id], (err) => {
            if(err) reject(err)
            else resolve(true)
        })
    })
})

ipcMain.handle('db-delete-transaction', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM transactions WHERE id = ?", [id], (err) => {
      if(err) reject(err)
      else resolve(true)
    })
  })
})

ipcMain.handle('db-get-all-cards', async () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT id, name, limit_val as 'limit', closing, due FROM cards", (err, rows) => {
      if(err) reject(err)
      else resolve(rows)
    })
  })
})

ipcMain.handle('db-save-card', async (event, c) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO cards (id, name, limit_val, closing, due) VALUES (?, ?, ?, ?, ?)
                   ON CONFLICT(id) DO UPDATE SET 
                   name=excluded.name, limit_val=excluded.limit_val, closing=excluded.closing, due=excluded.due`
    db.run(query, [c.id, c.name, c.limit, c.closing, c.due], (err) => {
      if(err) reject(err)
      else resolve(true)
    })
  })
})

ipcMain.handle('db-delete-card', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM cards WHERE id = ?", [id], (err) => {
      if(err) reject(err)
      else resolve(true)
    })
  })
})

// Handlers legados removidos para evitar conflito


ipcMain.handle('db-nuke', async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("DELETE FROM transactions")
      db.run("DELETE FROM cards")
      db.run("DELETE FROM category_meta") 
      resolve(true)
    })
  })
})

ipcMain.handle('db-seed', async () => {
    // Implementar seed básico se necessário no backend ou chamar save loop no front
    return true
})


function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js') // Boa prática, mesmo se não usar agora
    }
    // icon: path.join(__dirname, 'assets/icon.png') // Descomente se tiver um ícone
  })

  win.loadFile('index.html')
  
  // Abre o Inspecionar Elemento (DevTools)
  win.webContents.openDevTools()

  // Remove o menu padrão (Arquivo, Editar, etc) para parecer mais nativo
  win.setMenuBarVisibility(false)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})