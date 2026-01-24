
export class ToastService {
    static init() {
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
            document.body.appendChild(container);
        }
    }

    static show(message, type = 'info') {
        this.init();
        const toast = this._createToastElement(message, type);
        const container = document.getElementById('toast-container');
        container.appendChild(toast);

        // Animação de entrada
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        setTimeout(() => this._remove(toast), 3000);
    }

    static _createToastElement(message, type) {
        const el = document.createElement('div');
        const colors = this._getColors(type);
        el.className = `${colors} px-6 py-3 rounded shadow-lg text-white font-bold 
                        transition-all duration-300 transform translate-x-full opacity-0`;
        el.innerText = message;
        return el;
    }

    static _getColors(type) {
        const map = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            warning: 'bg-yellow-600',
            info: 'bg-blue-600'
        };
        return map[type] || map.info;
    }

    static _remove(el) {
        el.style.opacity = '0';
        el.style.transform = 'translate-x-full';
        setTimeout(() => el.remove(), 300);
    }
}
