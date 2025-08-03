class HistoryManager {
    constructor() {
        this.STORAGE_KEY = 'markdownHistory';
        this.MAX_HISTORY_ITEMS = 5;
    }
    
    addToHistory(section) {
        const history = this.getHistory();
        const existingItem = history.find(item => item.content === section.content);
        
        let updatedHistory;
        if (existingItem) {
            updatedHistory = history.filter(item => item.content !== section.content);
            updatedHistory.unshift({
                id: existingItem.id,
                title: existingItem.title,
                content: existingItem.content,
                viewedAt: new Date().toISOString()
            });
        } else {
            updatedHistory = history.filter(item => item.id !== section.id);
            updatedHistory.unshift({
                id: section.id,
                title: section.title,
                content: section.content,
                viewedAt: new Date().toISOString()
            });
        }
        
        this.setHistory(updatedHistory.slice(0, this.MAX_HISTORY_ITEMS));
    }
    
    getHistory() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        } catch (e) {
            console.error('Error loading history:', e);
            return [];
        }
    }
    
    setHistory(history) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
            console.error('Error saving history:', e);
        }
    }
    
    clearHistory() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}