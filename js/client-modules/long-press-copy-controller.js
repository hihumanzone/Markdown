class LongPressCopyController {
    constructor() {
        this.toggleBtn = document.getElementById('toggleLongPressCopyBtn');
        this.lsKey = window.__APP_DATA__.config.LOCAL_STORAGE_KEYS.LONG_PRESS_COPY;
        this.init();
    }
    
    init() {
        if (!this.toggleBtn) return;
        this.toggleBtn.addEventListener('click', () => this.toggle());
        const savedSetting = localStorage.getItem(this.lsKey);
        const defaultEnabled = savedSetting !== null ? savedSetting === 'true' : true;
        this.applyState(defaultEnabled);
    }
    
    applyState(enabled) {
        this.toggleBtn.textContent = enabled ? 'Long Press Copy' : 'Long Press Copy (Off)';
        this.toggleBtn.title = enabled ? 
            'Long press to copy list items is enabled. Click to disable.' : 
            'Long press to copy list items is disabled. Click to enable.';
        localStorage.setItem(this.lsKey, enabled.toString());
        this.notifyListItemController(enabled);
    }
    
    toggle() {
        const current = this.isEnabled();
        this.applyState(!current);
    }
    
    isEnabled() {
        const savedSetting = localStorage.getItem(this.lsKey);
        return savedSetting !== null ? savedSetting === 'true' : true;
    }
    
    notifyListItemController(enabled) {
        if (window.uiController && window.uiController.listItemController) {
            window.uiController.listItemController.updateLongPressCopyState(enabled);
        }
    }
}