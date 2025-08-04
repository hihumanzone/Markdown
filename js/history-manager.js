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
            
            // Generate unique title by checking for conflicts
            const uniqueTitle = this.generateUniqueTitle(section.title, section.content, updatedHistory);
            
            updatedHistory.unshift({
                id: section.id,
                title: uniqueTitle,
                content: section.content,
                viewedAt: new Date().toISOString()
            });
        }
        
        // After adding, resolve any title conflicts in the entire history
        updatedHistory = this.resolveTitleConflicts(updatedHistory);
        
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
    
    /**
     * Generate a unique title for a new history item
     */
    generateUniqueTitle(originalTitle, content, existingHistory) {
        const conflictingItems = existingHistory.filter(item => 
            item.title === originalTitle || item.title.startsWith(originalTitle + ' (')
        );
        
        if (conflictingItems.length === 0) {
            return originalTitle;
        }
        
        // Generate a meaningful suffix based on content differences
        const suffix = this.generateContentBasedSuffix(content, conflictingItems);
        return `${originalTitle} (${suffix})`;
    }
    
    /**
     * Resolve title conflicts in the entire history by adding intelligent suffixes
     */
    resolveTitleConflicts(history) {
        const updatedHistory = [...history];
        const titleGroups = {};
        
        // Group items by their base title (without suffix)
        updatedHistory.forEach((item, index) => {
            const baseTitle = this.extractBaseTitle(item.title);
            if (!titleGroups[baseTitle]) {
                titleGroups[baseTitle] = [];
            }
            titleGroups[baseTitle].push({ item, index });
        });
        
        // Process groups with conflicts
        Object.values(titleGroups).forEach(group => {
            if (group.length > 1) {
                // Sort by viewedAt to maintain order
                group.sort((a, b) => new Date(b.item.viewedAt) - new Date(a.item.viewedAt));
                
                group.forEach((entry, i) => {
                    if (i === 0) {
                        // Keep the most recent one with original title
                        updatedHistory[entry.index].title = this.extractBaseTitle(entry.item.title);
                    } else {
                        // Add intelligent suffix to others
                        const otherItems = group.slice(0, i).map(e => e.item);
                        const suffix = this.generateContentBasedSuffix(entry.item.content, otherItems);
                        updatedHistory[entry.index].title = `${this.extractBaseTitle(entry.item.title)} (${suffix})`;
                    }
                });
            }
        });
        
        return updatedHistory;
    }
    
    /**
     * Extract base title without any suffix in parentheses
     */
    extractBaseTitle(title) {
        const match = title.match(/^(.+?)\s*\(/);
        return match ? match[1].trim() : title;
    }
    
    /**
     * Generate a meaningful suffix based on content differences
     */
    generateContentBasedSuffix(content, conflictingItems) {
        // Try different strategies to create meaningful distinctions
        
        // Strategy 1: Look for distinctive headers beyond the first
        const headers = this.extractHeaders(content);
        if (headers.length > 1) {
            const distinctiveHeader = headers.find(header => 
                !conflictingItems.some(item => this.extractHeaders(item.content).includes(header))
            );
            if (distinctiveHeader) {
                return this.truncateText(distinctiveHeader, 25);
            }
        }
        
        // Strategy 2: Look for distinctive first lines of content (non-header)
        const contentLines = this.extractContentLines(content);
        const distinctiveLine = contentLines.find(line =>
            !conflictingItems.some(item => this.extractContentLines(item.content).includes(line))
        );
        if (distinctiveLine) {
            return this.truncateText(distinctiveLine, 25);
        }
        
        // Strategy 3: Look for distinctive keywords
        const keywords = this.extractKeywords(content);
        const distinctiveKeyword = keywords.find(keyword =>
            !conflictingItems.some(item => this.extractKeywords(item.content).includes(keyword))
        );
        if (distinctiveKeyword) {
            return this.truncateText(distinctiveKeyword, 25);
        }
        
        // Strategy 4: Use content length difference as fallback
        const contentLength = content.trim().length;
        return `${contentLength} chars`;
    }
    
    /**
     * Extract headers (# ## ###) from content
     */
    extractHeaders(content) {
        const headers = [];
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            const match = trimmed.match(/^#{1,6}\s+(.+)$/);
            if (match) {
                headers.push(match[1].trim());
            }
        }
        return headers;
    }
    
    /**
     * Extract meaningful content lines (non-headers, non-empty)
     */
    extractContentLines(content) {
        const lines = content.split('\n');
        const contentLines = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```') && trimmed.length > 5) {
                contentLines.push(trimmed);
            }
        }
        return contentLines.slice(0, 5); // Limit to first 5 meaningful lines
    }
    
    /**
     * Extract distinctive keywords from content
     */
    extractKeywords(content) {
        // Simple keyword extraction - look for capitalized words and technical terms
        const words = content.match(/\b[A-Z][a-zA-Z]+\b|\b[a-z]+(?:[A-Z][a-z]*)+\b|\b\w+\.\w+\b/g) || [];
        const keywords = [...new Set(words)]
            .filter(word => word.length > 3 && word.length < 20)
            .slice(0, 10);
        return keywords;
    }
    
    /**
     * Truncate text to specified length with ellipsis
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
}