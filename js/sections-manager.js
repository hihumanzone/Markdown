class SectionsManager {
    constructor() {
        this.STORAGE_KEY = 'markdownSavedSections';
    }
    
    addSection(section) {
        const sections = this.getSections();
        sections.unshift(section);
        this.setSections(sections);
    }
    
    updateSection(sectionId, updates) {
        const sections = this.getSections();
        const sectionIndex = sections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1) {
            sections[sectionIndex] = { ...sections[sectionIndex], ...updates };
            sections[sectionIndex].lastModified = new Date().toISOString();
            this.setSections(sections);
            return true;
        }
        return false;
    }
    
    deleteSection(sectionId) {
        const sections = this.getSections();
        const filteredSections = sections.filter(s => s.id !== sectionId);
        this.setSections(filteredSections);
        return filteredSections.length < sections.length;
    }
    
    getSections() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        } catch (e) {
            console.error('Error loading saved sections:', e);
            return [];
        }
    }
    
    setSections(sections) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sections));
        } catch (e) {
            console.error('Error saving sections:', e);
            throw new Error('Error saving to library. Local storage may be full.');
        }
    }
    
    generateUniqueTitle(originalTitle, excludeId = null) {
        const sections = this.getSections();
        const existingTitles = sections
            .filter(section => excludeId === null || section.id !== excludeId)
            .map(section => section.title);
        
        if (!existingTitles.includes(originalTitle)) {
            return originalTitle;
        }
        
        let counter = 2;
        let newTitle = `${originalTitle} ${counter}`;
        
        while (existingTitles.includes(newTitle)) {
            counter++;
            newTitle = `${originalTitle} ${counter}`;
        }
        
        return newTitle;
    }
    
    clearSections() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}