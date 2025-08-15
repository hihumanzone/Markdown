class CurrentContentManager {
    constructor() {
        this.STORAGE_KEY = 'markdownCurrentContent';
        this.debouncedSave = Utils.debounce(this.saveCurrentContent.bind(this), 1000);
    }
    
    saveCurrentContent(content) {
        try {
            if (content?.trim()) {
                localStorage.setItem(this.STORAGE_KEY, content);
            } else {
                this.clearCurrentContent();
            }
        } catch (e) {
            console.error('Error saving current content:', e);
        }
    }
    
    loadCurrentContent() {
        try {
            return localStorage.getItem(this.STORAGE_KEY);
        } catch (e) {
            console.error('Error loading current content:', e);
            return null;
        }
    }
    
    clearCurrentContent() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (e) {
            console.error('Error clearing current content:', e);
        }
    }
    
    setupAutoSave(textareaElement) {
        if (!textareaElement) return;
        
        textareaElement.addEventListener('input', () => {
            this.debouncedSave(textareaElement.value);
        });
        
        textareaElement.addEventListener('blur', () => {
            this.saveCurrentContent(textareaElement.value);
        });
    }
    
    restoreContent(textareaElement) {
        if (!textareaElement) return false;
        
        const savedContent = this.loadCurrentContent();
        if (!savedContent?.trim()) return false;
        
        const currentContent = textareaElement.value.trim();
        const isDefaultContent = this.isDefaultContent(currentContent);
        
        if (isDefaultContent || !currentContent) {
            textareaElement.value = savedContent;
            return true;
        }
        return false;
    }
    
    isDefaultContent(content) {
        return content.includes('# Hello World') && content.includes('This is **bold** and _italic_');
    }
}