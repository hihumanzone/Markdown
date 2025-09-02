class LongPressCopyController {
    constructor() {
        this.toggleBtn = document.getElementById('toggleLongPressCopyBtn');
        this.lsKey = window.__APP_DATA__.config.LOCAL_STORAGE_KEYS.LONG_PRESS_COPY;
        this.init();
    }
    
    init() {
        if (!this.toggleBtn) return;
        this.toggleBtn.addEventListener('click', () => this.toggle());
        // Default to enabled if no setting exists
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
        
        // Notify the list item controller of the change
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
        // Find the list item controller and update its state
        if (window.uiController && window.uiController.listItemController) {
            window.uiController.listItemController.updateLongPressCopyState(enabled);
        }
    }
}