import { AppController } from './controllers/AppController.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const app = new AppController();
        await app.init();
    } catch (criticalError) {
        console.error('❌ Critical Boot Error:', criticalError);
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.innerHTML = `
                <div class="text-center p-6 max-w-sm mx-auto">
                    <div class="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 class="text-xl font-bold mb-2">Erro na Inicialização</h2>
                    <p class="text-gray-300 text-sm mb-4">O sistema não pôde ser carregado corretamente.</p>
                    <button onclick="window.location.reload()" class="bg-blue-600 px-4 py-2 rounded text-white">Tentar Novamente</button>
                </div>
            `;
        }
    }
});
