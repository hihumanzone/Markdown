class CustomModal {
    static init() {
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-close-modal');
                this.close(modalId);
            });
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close(overlay.id);
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAll();
            }
        });
    }

    static open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            const firstInput = modal.querySelector('input, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    static close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    static closeAll() {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    static alert(message, title = 'Notice') {
        return new Promise((resolve) => {
            const titleEl = document.getElementById('alertModalTitle');
            const messageEl = document.getElementById('alertModalMessage');
            const actionBtn = document.getElementById('alertModalAction');

            titleEl.textContent = title;
            messageEl.textContent = message;

            const handler = () => {
                actionBtn.removeEventListener('click', handler);
                this.close('alertModal');
                resolve();
            };

            actionBtn.addEventListener('click', handler);
            this.open('alertModal');
        });
    }

    static confirm(message, title = 'Confirm Action') {
        return new Promise((resolve) => {
            const titleEl = document.getElementById('confirmModalTitle');
            const messageEl = document.getElementById('confirmModalMessage');
            const actionBtn = document.getElementById('confirmModalAction');
            const cancelBtns = document.querySelectorAll('#confirmModal [data-close-modal], #confirmModal .modal-close');

            titleEl.textContent = title;
            messageEl.textContent = message;

            const confirmHandler = () => {
                actionBtn.removeEventListener('click', confirmHandler);
                cancelBtns.forEach(btn => btn.removeEventListener('click', cancelHandler));
                this.close('confirmModal');
                resolve(true);
            };

            const cancelHandler = () => {
                actionBtn.removeEventListener('click', confirmHandler);
                cancelBtns.forEach(btn => btn.removeEventListener('click', cancelHandler));
                this.close('confirmModal');
                resolve(false);
            };

            actionBtn.addEventListener('click', confirmHandler);
            cancelBtns.forEach(btn => btn.addEventListener('click', cancelHandler));
            this.open('confirmModal');
        });
    }

    static prompt(message, defaultValue = '', title = 'Input Required') {
        return new Promise((resolve) => {
            const titleEl = document.getElementById('promptModalTitle');
            const messageEl = document.getElementById('promptModalMessage');
            const inputEl = document.getElementById('promptModalInput');
            const actionBtn = document.getElementById('promptModalAction');
            const cancelBtns = document.querySelectorAll('#promptModal [data-close-modal], #promptModal .modal-close');

            titleEl.textContent = title;
            messageEl.textContent = message;
            inputEl.value = defaultValue;

            const confirmHandler = () => {
                const value = inputEl.value.trim();
                actionBtn.removeEventListener('click', confirmHandler);
                cancelBtns.forEach(btn => btn.removeEventListener('click', cancelHandler));
                this.close('promptModal');
                resolve(value || null);
            };

            const cancelHandler = () => {
                actionBtn.removeEventListener('click', confirmHandler);
                cancelBtns.forEach(btn => btn.removeEventListener('click', cancelHandler));
                this.close('promptModal');
                resolve(null);
            };

            actionBtn.addEventListener('click', confirmHandler);
            cancelBtns.forEach(btn => btn.addEventListener('click', cancelHandler));
            
            inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmHandler();
                }
            });

            this.open('promptModal');
        });
    }
}