const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('DB', {
  getAllTransactions: () => ipcRenderer.invoke('db-get-all-transactions'),
  saveTransaction: (t) => ipcRenderer.invoke('db-save-transaction', t),
  deleteTransaction: (id) => ipcRenderer.invoke('db-delete-transaction', id),
  
  getAllCards: () => ipcRenderer.invoke('db-get-all-cards'),
  saveCard: (c) => ipcRenderer.invoke('db-save-card', c),
  deleteCard: (id) => ipcRenderer.invoke('db-delete-card', id),
  
  getAllCategories: () => ipcRenderer.invoke('db-get-all-categories'),
  addCategory: (cat) => ipcRenderer.invoke('db-add-category', cat),
  
  nuke: () => ipcRenderer.invoke('db-nuke'),
  seed: () => ipcRenderer.invoke('db-seed')
})