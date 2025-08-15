class SavedSectionsManager {
    constructor(dom, app) {
        this.dom = dom;
        this.app = app;
        this.sectionsManager = new SectionsManager();
        this.historyManager = new HistoryManager();
        this.currentActiveSection = null;
        this.currentEditingSection = null;
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
        
        // Edit modal event listeners
        document.getElementById('editModalSaveBtn')?.addEventListener('click', () => this.saveFromEditModal());
        
        document.getElementById('editModalSectionTitle')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveFromEditModal();
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
        
        const uniqueTitle = this.sectionsManager.generateUniqueTitle(originalTitle);
        
        const section = {
            id: Date.now().toString(),
            title: uniqueTitle,
            content: content,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        this.sectionsManager.addSection(section);
        CustomModal.close('addSectionModal');
        this.renderSavedSections();
        await CustomModal.alert('Section saved to library successfully!');
    }
    
    renderSavedSections() {
        const sections = this.sectionsManager.getSections();
        const container = this.dom.savedSectionsList;
        
        if (!container) return;
        
        if (sections.length === 0) {
            container.innerHTML = '<div class="empty-state">No items in library yet</div>';
            return;
        }
        
        container.innerHTML = sections.map(section => `
            <div class="section-item" data-section-id="${section.id}">
                <div class="section-title" title="${Utils.escapeHtml(section.title)}">${Utils.escapeHtml(section.title)}</div>
                <div class="section-actions">
                    <button class="action-btn rename-btn" title="Edit item">✎</button>
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
                FileManager.exportSectionAsMarkdown(section);
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
            
            // Save the loaded content as current content for persistence
            if (this.app.currentContentManager) {
                this.app.currentContentManager.saveCurrentContent(section.content);
            }
        }
        
        this.historyManager.addToHistory(section);
        this.renderHistory();
        
        this.app.handleRender(true);
    }
    
    async renameSection(section) {
        this.currentEditingSection = section;
        document.getElementById('editModalSectionTitle').value = section.title;
        document.getElementById('editModalSectionContent').value = section.content;
        CustomModal.open('editSectionModal');
    }
    
    async saveFromEditModal() {
        const newTitle = document.getElementById('editModalSectionTitle')?.value?.trim();
        const newContent = document.getElementById('editModalSectionContent')?.value?.trim();
        
        if (!newTitle) {
            await CustomModal.alert('Please enter a title for your library item.');
            return;
        }
        
        if (!newContent) {
            await CustomModal.alert('Please enter some content to save.');
            return;
        }
        
        if (!this.currentEditingSection) {
            await CustomModal.alert('No section is being edited.');
            return;
        }
        
        const uniqueTitle = this.sectionsManager.generateUniqueTitle(newTitle, this.currentEditingSection.id);
        
        const success = this.sectionsManager.updateSection(this.currentEditingSection.id, { 
            title: uniqueTitle,
            content: newContent
        });
        
        if (success) {
            CustomModal.close('editSectionModal');
            this.renderSavedSections();
            this.currentEditingSection = null;
        } else {
            await CustomModal.alert('Failed to save changes. Please try again.');
        }
    }
    
    async deleteSection(section) {
        const confirmed = await CustomModal.confirm(`Are you sure you want to delete "${section.title}"?`, 'Delete Library Item');
        if (confirmed) {
            const success = this.sectionsManager.deleteSection(section.id);
            if (success) {
                this.renderSavedSections();
                
                if (this.currentActiveSection === section.id) {
                    this.currentActiveSection = null;
                }
            }
        }
    }
    
    addToHistory(section) {
        this.historyManager.addToHistory(section);
        this.renderHistory();
    }
    
    renderHistory() {
        const history = this.historyManager.getHistory();
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
                    <div class="history-title" title="${Utils.escapeHtml(item.title)}">${Utils.escapeHtml(item.title)}</div>
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
                        
                        // Save the loaded content as current content for persistence
                        if (this.app.currentContentManager) {
                            this.app.currentContentManager.saveCurrentContent(historyItem.content);
                        }
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
        const sections = this.sectionsManager.getSections();
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
            // If the title was auto-generated, clear the title field
            if (historyItem.titleAutoGenerated) {
                titleField.value = '';
            } else {
                titleField.value = historyItem.title;
            }
        }
        
        CustomModal.open('addSectionModal');
    }
    
    async handleModalImportFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        
        e.target.value = '';
        
        try {
            const { content, filename } = await FileManager.readMarkdownFile(file);
            
            document.getElementById('modalSectionTitle').value = filename;
            document.getElementById('modalSectionContent').value = content;
        } catch (error) {
            console.error("Error reading file:", error);
            CustomModal.alert("Error reading file. Please check the console for details.");
        }
    }
    
    async handleImportFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        
        e.target.value = '';
        
        try {
            const { content, filename } = await FileManager.readMarkdownFile(file);
            
            this.dom.markdownInput.value = content;
            this.dom.markdownInput.focus();
            
            // Save the imported content as current content for persistence
            if (this.app.currentContentManager) {
                this.app.currentContentManager.saveCurrentContent(content);
            }
            
            if (content.trim().length > 10) {
                const historyItem = {
                    id: 'temp_' + Date.now(),
                    title: filename,
                    content: content,
                    viewedAt: new Date().toISOString(),
                    titleAutoGenerated: false // filename is explicitly provided
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
        } catch (error) {
            console.error("Error reading file:", error);
            CustomModal.alert("Error reading file. Please check the console for details.");
        }
    }
}