class CurrentContentManager {
    constructor() {
        this.STORAGE_KEY = 'markdownCurrentContent';
        this.debouncedSave = Utils.debounce(this.saveCurrentContent.bind(this), 1000);
    }
    
    /**
     * Save the current content to localStorage
     * @param {string} content - The content to save
     */
    saveCurrentContent(content) {
        try {
            if (content && content.trim()) {
                localStorage.setItem(this.STORAGE_KEY, content);
            } else {
                // If content is empty, remove the saved content
                this.clearCurrentContent();
            }
        } catch (e) {
            console.error('Error saving current content:', e);
        }
    }
    
    /**
     * Load the saved current content from localStorage
     * @returns {string|null} The saved content or null if none exists
     */
    loadCurrentContent() {
        try {
            return localStorage.getItem(this.STORAGE_KEY);
        } catch (e) {
            console.error('Error loading current content:', e);
            return null;
        }
    }
    
    /**
     * Clear the saved current content from localStorage
     */
    clearCurrentContent() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (e) {
            console.error('Error clearing current content:', e);
        }
    }
    
    /**
     * Set up auto-save for a textarea element
     * @param {HTMLTextAreaElement} textareaElement - The textarea to monitor
     */
    setupAutoSave(textareaElement) {
        if (!textareaElement) return;
        
        // Save on input changes (debounced)
        textareaElement.addEventListener('input', () => {
            this.debouncedSave(textareaElement.value);
        });
        
        // Save immediately on blur (when user clicks away)
        textareaElement.addEventListener('blur', () => {
            this.saveCurrentContent(textareaElement.value);
        });
    }
    
    /**
     * Restore content to a textarea if saved content exists
     * @param {HTMLTextAreaElement} textareaElement - The textarea to restore content to
     * @returns {boolean} True if content was restored, false otherwise
     */
    restoreContent(textareaElement) {
        if (!textareaElement) return false;
        
        const savedContent = this.loadCurrentContent();
        if (savedContent && savedContent.trim()) {
            // Only restore if the textarea currently has the default content or is empty
            const currentContent = textareaElement.value.trim();
            const isDefaultContent = currentContent.includes('# Hello World') && 
                                   currentContent.includes('This is **bold** and _italic_');
            
            if (isDefaultContent || !currentContent) {
                textareaElement.value = savedContent;
                return true;
            }
        }
        return false;
    }
}