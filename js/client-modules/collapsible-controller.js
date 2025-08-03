class CollapsibleController {
    constructor() {
        this.toggleButton = document.getElementById('toggleCollapseBtn');
        this.controlsToToggle = Array.from(document.querySelectorAll('#font-controls > *:not(#toggleCollapseBtn)'));
        this.lsKey = window.__APP_DATA__.config.LOCAL_STORAGE_KEYS.CONTROLS_COLLAPSED; 
        this.init();
    }
    
    init() {
        if (!this.toggleButton) return;
        this.toggleButton.addEventListener('click', () => this.toggle());
        this.applyState(JSON.parse(localStorage.getItem(this.lsKey) || 'false'));
    }
    
    toggle() {
        const current = this.controlsToToggle[0].style.display === 'none';
        this.applyState(!current);
    }
    
    applyState(collapsed) {
        this.controlsToToggle.forEach(control => { 
            control.style.display = collapsed ? 'none' : ''; 
        });
        this.toggleButton.textContent = collapsed ? 'Expand' : 'Collapse';
        this.toggleButton.title = collapsed ? 'Expand Controls' : 'Collapse Controls';
        localStorage.setItem(this.lsKey, JSON.stringify(collapsed));
    }
}