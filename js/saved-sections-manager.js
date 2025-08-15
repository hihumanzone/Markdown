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
        
        document.getElementById('modalSectionContent')?.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveFromModal();
                }
            }
        });
        
        // Edit modal event listeners
        document.getElementById('editModalSaveBtn')?.addEventListener('click', () => this.saveFromEditModal());
        
        document.getElementById('editModalSectionTitle')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveFromEditModal();
            }
        });
        
        document.getElementById('editModalSectionContent')?.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveFromEditModal();
                }
            }
        });
    }
    
    openAddSectionModal() {
        document.getElementById('modalSectionTitle').value = '';
        document.getElementById('modalSectionContent').value = '';
        
        CustomModal.open('addSectionModal');
    }
    
    async saveFromModal() {
        const title = document.getElementById('modalSectionTitle')?.value?.trim();
        const content = document.getElementById('modalSectionContent')?.value?.trim();
        
        if (!this.validateSectionInput(title, content)) return;
        
        const uniqueTitle = this.sectionsManager.generateUniqueTitle(title);
        const section = this.createSection(uniqueTitle, content);
        
        this.sectionsManager.addSection(section);
        CustomModal.close('addSectionModal');
        this.renderSavedSections();
        await CustomModal.alert('Section saved to library successfully!');
    }
    
    async saveFromEditModal() {
        const newTitle = document.getElementById('editModalSectionTitle')?.value?.trim();
        const newContent = document.getElementById('editModalSectionContent')?.value?.trim();
        
        if (!this.validateSectionInput(newTitle, newContent)) return;
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
    
    async validateSectionInput(title, content) {
        // Validate title
        const titleValidation = Utils.validateInputLength(title, CONFIG.VALIDATION.TITLE_MAX_LENGTH, 'Title');
        if (!titleValidation.valid) {
            await CustomModal.alert(titleValidation.message);
            return false;
        }
        
        // Validate content
        const contentValidation = Utils.validateInputLength(content, CONFIG.VALIDATION.CONTENT_MAX_LENGTH, 'Content');
        if (!contentValidation.valid) {
            await CustomModal.alert(contentValidation.message);
            return false;
        }
        
        return true;
    }
    
    createSection(title, content) {
        return {
            id: Date.now().toString(),
            title,
            content,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
    }
    
    renderSavedSections() {
        const sections = this.sectionsManager.getSections();
        const container = this.dom.savedSectionsList;
        
        if (!container) return;
        
        // Clear container safely
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        if (sections.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No items in library yet';
            container.appendChild(emptyState);
            return;
        }
        
        sections.forEach(section => {
            const sectionItem = document.createElement('div');
            sectionItem.className = 'section-item';
            sectionItem.setAttribute('data-section-id', section.id);
            sectionItem.setAttribute('role', 'listitem');
            sectionItem.setAttribute('tabindex', '0');
            sectionItem.setAttribute('aria-label', `Library item: ${section.title}`);
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'section-title';
            titleDiv.title = section.title;
            titleDiv.textContent = section.title;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'section-actions';
            
            const renameBtn = this.createActionButton('✎', 'Edit item', 'rename-btn');
            const exportBtn = this.createActionButton('↓', 'Export as .md file', 'export-btn');
            const deleteBtn = this.createActionButton('✕', 'Delete item', 'delete-btn');
            
            actionsDiv.appendChild(renameBtn);
            actionsDiv.appendChild(exportBtn);
            actionsDiv.appendChild(deleteBtn);
            
            sectionItem.appendChild(titleDiv);
            sectionItem.appendChild(actionsDiv);
            container.appendChild(sectionItem);
            
            // Add event listeners
            this.addSectionEventListeners(sectionItem, section);
        });
    }
    
    createActionButton(text, title, className) {
        const button = document.createElement('button');
        button.className = `action-btn ${className}`;
        button.title = title;
        button.setAttribute('aria-label', title);
        button.textContent = text;
        return button;
    }
    
    addSectionEventListeners(sectionItem, section) {
        sectionItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('action-btn')) {
                this.loadSectionAndRender(section);
            }
        });
        
        sectionItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!e.target.classList.contains('action-btn')) {
                    this.loadSectionAndRender(section);
                }
            }
        });
        
        const renameBtn = sectionItem.querySelector('.rename-btn');
        const exportBtn = sectionItem.querySelector('.export-btn');
        const deleteBtn = sectionItem.querySelector('.delete-btn');
        
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
    }
    
    async loadSectionAndRender(section) {
        this.loadContentToTextarea(section.content);
        
        const historyItem = {
            ...section,
            viewedAt: new Date().toISOString(),
            titleAutoGenerated: false
        };
        this.historyManager.addToHistory(historyItem);
        this.renderHistory();
        this.app.handleRender(true);
    }
    
    loadContentToTextarea(content) {
        if (this.dom.markdownInput) {
            this.dom.markdownInput.value = content;
            this.dom.markdownInput.focus();
            
            if (this.app.currentContentManager) {
                this.app.currentContentManager.saveCurrentContent(content);
            }
        }
    }
    
    async renameSection(section) {
        this.currentEditingSection = section;
        document.getElementById('editModalSectionTitle').value = section.title;
        document.getElementById('editModalSectionContent').value = section.content;
        CustomModal.open('editSectionModal');
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
        
        // Clear container safely
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        if (history.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No recent history';
            container.appendChild(emptyState);
            return;
        }
        
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.setAttribute('data-history-id', item.id);
            historyItem.setAttribute('role', 'listitem');
            historyItem.setAttribute('tabindex', '0');
            historyItem.setAttribute('aria-label', `History item: ${item.title}`);
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'history-title';
            titleDiv.title = item.title;
            titleDiv.textContent = item.title;
            
            const dateDiv = document.createElement('div');
            dateDiv.className = 'history-date';
            const date = new Date(item.viewedAt);
            const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            dateDiv.textContent = timeStr;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'history-actions';
            
            const addToLibraryBtn = document.createElement('button');
            addToLibraryBtn.className = 'action-btn add-to-library-btn';
            addToLibraryBtn.title = 'Add to Library';
            addToLibraryBtn.setAttribute('aria-label', 'Add to Library');
            addToLibraryBtn.textContent = '+';
            
            actionsDiv.appendChild(addToLibraryBtn);
            
            historyItem.appendChild(titleDiv);
            historyItem.appendChild(dateDiv);
            historyItem.appendChild(actionsDiv);
            container.appendChild(historyItem);
            
            // Add event listeners
            this.addHistoryEventListeners(historyItem, item);
        });
    }
    
    addHistoryEventListeners(historyItem, item) {
        historyItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('action-btn')) {
                this.loadContentToTextarea(item.content);
                this.app.handleRender(true);
            }
        });
        
        historyItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!e.target.classList.contains('action-btn')) {
                    this.loadContentToTextarea(item.content);
                    this.app.handleRender(true);
                }
            }
        });

        const addToLibraryBtn = historyItem.querySelector('.add-to-library-btn');
        addToLibraryBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.addHistoryItemToLibrary(item);
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
            if (historyItem.titleAutoGenerated === true) {
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
        
        // Validate file
        const fileValidation = FileManager.validateFile(file);
        if (!fileValidation.valid) {
            await CustomModal.alert(fileValidation.message);
            return;
        }
        
        try {
            const { content, filename } = await FileManager.readMarkdownFile(file);
            
            // Sanitize content
            const sanitizedContent = Utils.sanitizeMarkdown(content);
            
            document.getElementById('modalSectionTitle').value = filename;
            document.getElementById('modalSectionContent').value = sanitizedContent;
        } catch (error) {
            console.error("Error reading file:", error);
            CustomModal.alert("Error reading file. Please check the console for details.");
        }
    }
    
    async handleImportFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        
        e.target.value = '';
        
        // Validate file
        const fileValidation = FileManager.validateFile(file);
        if (!fileValidation.valid) {
            await CustomModal.alert(fileValidation.message);
            return;
        }
        
        try {
            const { content, filename } = await FileManager.readMarkdownFile(file);
            
            // Sanitize content
            const sanitizedContent = Utils.sanitizeMarkdown(content);
            
            this.loadContentToTextarea(sanitizedContent);
            
            if (sanitizedContent.trim().length > 10) {
                const historyItem = {
                    id: 'temp_' + Date.now(),
                    title: filename,
                    content: sanitizedContent,
                    viewedAt: new Date().toISOString(),
                    titleAutoGenerated: false
                };
                this.addToHistory(historyItem);
            }
            
            this.app.handleRender(true);
            
            setTimeout(async () => {
                const shouldSave = await CustomModal.confirm(`Would you like to save "${filename}" to your library?`, 'Save Imported File');
                if (shouldSave) {
                    document.getElementById('modalSectionTitle').value = filename;
                    document.getElementById('modalSectionContent').value = sanitizedContent;
                    CustomModal.open('addSectionModal');
                }
            }, 100);
        } catch (error) {
            console.error("Error reading file:", error);
            CustomModal.alert("Error reading file. Please check the console for details.");
        }
    }
}