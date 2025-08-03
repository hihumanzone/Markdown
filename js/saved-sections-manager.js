class SavedSectionsManager {
    constructor(dom, app) {
        this.dom = dom;
        this.app = app;
        this.STORAGE_KEYS = {
            SAVED_SECTIONS: 'markdownSavedSections',
            HISTORY: 'markdownHistory'
        };
        this.MAX_HISTORY_ITEMS = 5;
        this.currentActiveSection = null;
        this.init();
    }
    
    init() {
        this.bindEventListeners();
        this.renderSavedSections();
        this.renderHistory();
        
        CustomModal.init();
    }
    
    bindEventListeners() {
        document.getElementById('addSectionBtn')?.addEventListener('click', () => this.openAddSectionModal());
        
        document.getElementById('modalSaveBtn')?.addEventListener('click', () => this.saveFromModal());
        
        document.getElementById('modalImportBtn')?.addEventListener('click', () => {
            document.getElementById('modalImportFileInput')?.click();
        });
        
        document.getElementById('modalImportFileInput')?.addEventListener('change', (e) => this.handleModalImportFile(e));
        
        if (this.dom.importFileInput) {
            this.dom.importFileInput.addEventListener('change', (e) => this.handleImportFile(e));
        }
        
        document.getElementById('modalSectionTitle')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveFromModal();
            }
        });
    }
    
    openAddSectionModal() {
        document.getElementById('modalSectionTitle').value = '';
        document.getElementById('modalSectionContent').value = '';
        
        CustomModal.open('addSectionModal');
    }
    
    async saveFromModal() {
        const originalTitle = document.getElementById('modalSectionTitle')?.value?.trim();
        const content = document.getElementById('modalSectionContent')?.value?.trim();
        
        if (!originalTitle) {
            await CustomModal.alert('Please enter a title for your library item.');
            return;
        }
        
        if (!content) {
            await CustomModal.alert('Please enter some content to save.');
            return;
        }
        
        const uniqueTitle = this.generateUniqueTitle(originalTitle);
        
        const section = {
            id: Date.now().toString(),
            title: uniqueTitle,
            content: content,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        this.addSavedSection(section);
        CustomModal.close('addSectionModal');
        await CustomModal.alert('Section saved to library successfully!');
    }
    
    generateUniqueTitle(originalTitle, excludeId = null) {
        const sections = this.getSavedSections();
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
    
    addSavedSection(section) {
        const sections = this.getSavedSections();
        sections.unshift(section);
        this.setSavedSections(sections);
        this.renderSavedSections();
    }
    
    getSavedSections() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SAVED_SECTIONS) || '[]');
        } catch (e) {
            console.error('Error loading saved sections:', e);
            return [];
        }
    }
    
    setSavedSections(sections) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.SAVED_SECTIONS, JSON.stringify(sections));
        } catch (e) {
            console.error('Error saving sections:', e);
            CustomModal.alert('Error saving to library. Local storage may be full.');
        }
    }
    
    renderSavedSections() {
        const sections = this.getSavedSections();
        const container = this.dom.savedSectionsList;
        
        if (!container) return;
        
        if (sections.length === 0) {
            container.innerHTML = '<div class="empty-state">No items in library yet</div>';
            return;
        }
        
        container.innerHTML = sections.map(section => `
            <div class="section-item" data-section-id="${section.id}">
                <div class="section-title" title="${this.escapeHtml(section.title)}">${this.escapeHtml(section.title)}</div>
                <div class="section-actions">
                    <button class="action-btn rename-btn" title="Rename item">✎</button>
                    <button class="action-btn export-btn" title="Export as .md file">↓</button>
                    <button class="action-btn delete-btn" title="Delete item">✕</button>
                </div>
            </div>
        `).join('');
        
        container.querySelectorAll('.section-item').forEach(item => {
            const sectionId = item.dataset.sectionId;
            const section = sections.find(s => s.id === sectionId);
            
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('action-btn')) {
                    this.loadSectionAndRender(section);
                }
            });
            
            const renameBtn = item.querySelector('.rename-btn');
            const exportBtn = item.querySelector('.export-btn');
            const deleteBtn = item.querySelector('.delete-btn');
            
            renameBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.renameSection(section);
            });
            
            exportBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.exportSection(section);
            });
            
            deleteBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSection(section);
            });
        });
    }
    
    async loadSectionAndRender(section) {
        if (this.dom.markdownInput) {
            this.dom.markdownInput.value = section.content;
            this.dom.markdownInput.focus();
        }
        
        this.addToHistory(section);
        
        this.app.handleRender(true);
    }
    
    async renameSection(section) {
        const newTitle = await CustomModal.prompt('Enter new title:', section.title, 'Rename Library Item');
        if (newTitle && newTitle !== section.title) {
            const uniqueTitle = this.generateUniqueTitle(newTitle, section.id);
            
            const sections = this.getSavedSections();
            const sectionIndex = sections.findIndex(s => s.id === section.id);
            if (sectionIndex !== -1) {
                sections[sectionIndex].title = uniqueTitle;
                sections[sectionIndex].lastModified = new Date().toISOString();
                this.setSavedSections(sections);
                this.renderSavedSections();
            }
        }
    }
    
    exportSection(section) {
        const blob = new Blob([section.content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date(section.lastModified).toISOString().replace(/[:.]/g, '-').slice(0, -4);
        const filename = `${section.title.replace(/[^a-zA-Z0-9]/g, '_')}-${timestamp}.md`;
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    async deleteSection(section) {
        const confirmed = await CustomModal.confirm(`Are you sure you want to delete "${section.title}"?`, 'Delete Library Item');
        if (confirmed) {
            const sections = this.getSavedSections();
            const filteredSections = sections.filter(s => s.id !== section.id);
            this.setSavedSections(filteredSections);
            this.renderSavedSections();
            
            if (this.currentActiveSection === section.id) {
                this.currentActiveSection = null;
            }
        }
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
        this.renderHistory();
    }
    
    getHistory() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.HISTORY) || '[]');
        } catch (e) {
            console.error('Error loading history:', e);
            return [];
        }
    }
    
    setHistory(history) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(history));
        } catch (e) {
            console.error('Error saving history:', e);
        }
    }
    
    renderHistory() {
        const history = this.getHistory();
        const container = this.dom.historyList;
        
        if (!container) return;
        
        if (history.length === 0) {
            container.innerHTML = '<div class="empty-state">No recent history</div>';
            return;
        }
        
        container.innerHTML = history.map(item => {
            const date = new Date(item.viewedAt);
            const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            return `
                <div class="history-item" data-history-id="${item.id}">
                    <div class="history-title" title="${this.escapeHtml(item.title)}">${this.escapeHtml(item.title)}</div>
                    <div class="history-date">${timeStr}</div>
                    <div class="history-actions">
                        <button class="action-btn add-to-library-btn" title="Add to Library">+</button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.querySelectorAll('.history-item').forEach(item => {
            const historyId = item.dataset.historyId;
            const historyItem = history.find(h => h.id === historyId);
            
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('action-btn')) {
                    if (this.dom.markdownInput) {
                        this.dom.markdownInput.value = historyItem.content;
                        this.dom.markdownInput.focus();
                    }
                    
                    this.app.handleRender(true);
                }
            });

            const addToLibraryBtn = item.querySelector('.add-to-library-btn');
            addToLibraryBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addHistoryItemToLibrary(historyItem);
            });
        });
    }
    
    addHistoryItemToLibrary(historyItem) {
        const sections = this.getSavedSections();
        const existingSection = sections.find(section => section.content === historyItem.content);
        
        if (existingSection) {
            CustomModal.alert(`An item with the same content already exists in your library: "${existingSection.title}"`);
            return;
        }
        
        const titleField = document.getElementById('modalSectionTitle');
        const contentField = document.getElementById('modalSectionContent');
        
        if (contentField) {
            contentField.value = historyItem.content;
        }
        
        if (titleField) {
            titleField.value = historyItem.title;
        }
        
        CustomModal.open('addSectionModal');
    }
    
    handleModalImportFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        
        e.target.value = '';
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            const filename = file.name.replace(/\.[^/.]+$/, "");
            
            document.getElementById('modalSectionTitle').value = filename;
            document.getElementById('modalSectionContent').value = content;
        };
        
        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            CustomModal.alert("Error reading file. Please check the console for details.");
        };
        
        reader.readAsText(file);
    }
    
    async handleImportFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        
        e.target.value = '';
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target.result;
            
            this.dom.markdownInput.value = content;
            this.dom.markdownInput.focus();
            
            const filename = file.name.replace(/\.[^/.]+$/, "");
            
            if (content.trim().length > 10) {
                const historyItem = {
                    id: 'temp_' + Date.now(),
                    title: filename,
                    content: content,
                    viewedAt: new Date().toISOString()
                };
                this.addToHistory(historyItem);
            }
            
            this.app.handleRender(true);
            
            setTimeout(async () => {
                const shouldSave = await CustomModal.confirm(`Would you like to save "${filename}" to your library?`, 'Save Imported File');
                if (shouldSave) {
                    document.getElementById('modalSectionTitle').value = filename;
                    document.getElementById('modalSectionContent').value = content;
                    CustomModal.open('addSectionModal');
                }
            }, 100);
        };
        
        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            CustomModal.alert("Error reading file. Please check the console for details.");
        };
        
        reader.readAsText(file);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}