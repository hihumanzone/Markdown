class ViewToggleController {
    constructor() {
        this.toggleBtn = document.getElementById('toggleViewBtn');
        this.contentContainer = document.getElementById('content-container');
        this.rawContainer = document.getElementById('raw-container');
        this.lsKey = window.__APP_DATA__.config.LOCAL_STORAGE_KEYS.VIEW_MODE; 
        this.init();
    }
    
    init() {
        if (!this.toggleBtn || !this.contentContainer || !this.rawContainer) return;
        this.toggleBtn.addEventListener('click', () => this.toggle());
        this.applyViewMode(localStorage.getItem(this.lsKey) || 'rendered', false);
    }
    
    toggle() {
        const isRendered = this.contentContainer.style.display !== 'none';
        this.applyViewMode(isRendered ? 'raw' : 'rendered', true);
    }
    
    applyViewMode(mode, preserveScroll = false) {
        let scrollRatio = 0;
        if (preserveScroll) {
            const currentScroll = window.scrollY || document.documentElement.scrollTop || 0;
            const currentMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            scrollRatio = Math.min(1, Math.max(0, currentScroll / currentMax));
        }

        if (mode === 'raw') {
            this.rawContainer.style.display = 'block';
            this.contentContainer.style.display = 'none'; 
            this.toggleBtn.textContent = 'Rendered'; 
            this.toggleBtn.title = 'Show Rendered View';
        } else {
            this.contentContainer.style.display = 'block'; 
            this.rawContainer.style.display = 'none';
            this.toggleBtn.textContent = 'Raw'; 
            this.toggleBtn.title = 'Show Raw Markdown';
        }

        if (preserveScroll) {
            const restore = () => {
                const newMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
                const targetY = Math.round(scrollRatio * newMax);
                window.scrollTo({ top: targetY, behavior: 'instant' });
            };
            restore();
            requestAnimationFrame(restore);
        }

        localStorage.setItem(this.lsKey, mode);
    }
}