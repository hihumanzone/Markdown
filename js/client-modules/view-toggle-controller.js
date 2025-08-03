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
        this.applyViewMode(localStorage.getItem(this.lsKey) || 'rendered');
    }
    
    toggle() {
        const current = this.contentContainer.style.display !== 'none' ? 'rendered' : 'raw';
        this.applyViewMode(current === 'rendered' ? 'raw' : 'rendered');
    }
    
    applyViewMode(mode) {
        if (mode === 'raw') {
            this.contentContainer.style.display = 'none'; 
            this.rawContainer.style.display = 'block';
            this.toggleBtn.textContent = 'Rendered'; 
            this.toggleBtn.title = 'Show Rendered View';
        } else {
            this.contentContainer.style.display = 'block'; 
            this.rawContainer.style.display = 'none';
            this.toggleBtn.textContent = 'Raw'; 
            this.toggleBtn.title = 'Show Raw Markdown';
        }
        localStorage.setItem(this.lsKey, mode);
    }
}