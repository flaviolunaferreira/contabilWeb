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

    db.run(`CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY,
      name TEXT,
      limit_val REAL,
      closing INTEGER,
      due INTEGER
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS categories (
      name TEXT PRIMARY KEY
    )`)
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

ipcMain.handle('db-save-transaction', async (event, t) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO transactions (id, desc, amount, date, method, status, type, cardId, use5thDay, category, checked, interest_rate) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(id) DO UPDATE SET
                   desc=excluded.desc, amount=excluded.amount, date=excluded.date, method=excluded.method, 
                   status=excluded.status, type=excluded.type, cardId=excluded.cardId, 
                   use5thDay=excluded.use5thDay, category=excluded.category, checked=excluded.checked, interest_rate=excluded.interest_rate`
    
    db.run(query, [
      t.id, t.desc, t.amount, t.date, t.method, t.status, t.type, t.cardId, 
      t.use5thDay ? 1 : 0, t.category, t.checked ? 1 : 0, t.interest_rate || null
    ], function(err) {
      if(err) reject(err)
      else resolve(this.lastID || t.id)
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

ipcMain.handle('db-get-all-categories', async () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT name FROM categories", (err, rows) => {
      if(err) reject(err)
      else resolve(rows.map(r => r.name))
    })
  })
})

ipcMain.handle('db-add-category', async (event, cat) => {
  return new Promise((resolve, reject) => {
    db.run("INSERT OR IGNORE INTO categories (name) VALUES (?)", [cat], (err) => {
      if(err) reject(err)
      else resolve(true)
    })
  })
})

ipcMain.handle('db-nuke', async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("DELETE FROM transactions")
      db.run("DELETE FROM cards")
      db.run("DELETE FROM categories") // Opcional, talvez queira manter
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