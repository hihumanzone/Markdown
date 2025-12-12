class SavedSectionsManager {
    constructor(dom, app) {
        this.dom = dom;
        this.app = app;
        this.sectionsManager = new SectionsManager();
        this.historyManager = new HistoryManager();
        this.currentActiveSection = null;
        this.currentEditingSection = null;
        this.currentFolderId = null; // Current folder being viewed
        this.selectedColorLabel = 'none'; // Currently selected color for new items
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
        document.getElementById('createFolderBtn')?.addEventListener('click', () => this.openCreateFolderModal());
        
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
        
        // Folder modal events
        document.getElementById('folderModalSaveBtn')?.addEventListener('click', () => this.saveFolder());
        document.getElementById('folderModalInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveFolder();
            }
        });
        
        // Quick save button
        document.getElementById('quickSaveBtn')?.addEventListener('click', () => this.quickSaveCurrentContent());
    }
    
    openAddSectionModal() {
        document.getElementById('modalSectionTitle').value = '';
        document.getElementById('modalSectionContent').value = '';
        this.selectedColorLabel = 'none';
        this.renderColorPicker('modalColorPicker');
        this.updateFolderSelector('modalFolderSelect');
        
        CustomModal.open('addSectionModal');
    }
    
    openCreateFolderModal() {
        document.getElementById('folderModalInput').value = '';
        this.updateFolderSelector('folderParentSelect');
        CustomModal.open('createFolderModal');
    }
    
    quickSaveCurrentContent() {
        const content = this.dom.markdownInput?.value?.trim();
        if (!content) {
            CustomModal.alert('No content to save. Please enter some markdown text first.');
            return;
        }
        
        // Pre-populate the modal with current content
        const extractedTitle = this.app.extractTitle(content) || 'Untitled';
        document.getElementById('modalSectionTitle').value = extractedTitle;
        document.getElementById('modalSectionContent').value = content;
        this.selectedColorLabel = 'none';
        this.renderColorPicker('modalColorPicker');
        this.updateFolderSelector('modalFolderSelect');
        
        CustomModal.open('addSectionModal');
    }
    
    renderColorPicker(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        const colorLabels = this.sectionsManager.getColorLabels();
        
        colorLabels.forEach(color => {
            const colorBtn = document.createElement('button');
            colorBtn.type = 'button';
            colorBtn.className = 'color-picker-btn' + (this.selectedColorLabel === color.id ? ' selected' : '');
            colorBtn.title = color.name;
            colorBtn.setAttribute('aria-label', `Select ${color.name} color`);
            colorBtn.setAttribute('data-color-id', color.id);
            
            if (color.id === 'none') {
                colorBtn.innerHTML = '✕';
                colorBtn.style.backgroundColor = 'var(--surface-color)';
                colorBtn.style.border = '2px dashed var(--border-color)';
            } else {
                colorBtn.style.backgroundColor = color.color;
            }
            
            colorBtn.addEventListener('click', () => {
                this.selectedColorLabel = color.id;
                container.querySelectorAll('.color-picker-btn').forEach(btn => btn.classList.remove('selected'));
                colorBtn.classList.add('selected');
            });
            
            container.appendChild(colorBtn);
        });
    }
    
    updateFolderSelector(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '';
        
        // Add root option
        const rootOption = document.createElement('option');
        rootOption.value = '';
        rootOption.textContent = '📁 Root (No folder)';
        select.appendChild(rootOption);
        
        // Add all folders with proper hierarchy
        const folders = this.sectionsManager.getFolders();
        this.addFolderOptionsRecursive(select, folders, null, 0);
        
        // Set current folder as default
        if (this.currentFolderId) {
            select.value = this.currentFolderId;
        }
    }
    
    addFolderOptionsRecursive(select, allFolders, parentId, level) {
        const folders = allFolders.filter(f => f.parentId === parentId);
        folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.id;
            option.textContent = '  '.repeat(level) + '📁 ' + folder.name;
            select.appendChild(option);
            
            this.addFolderOptionsRecursive(select, allFolders, folder.id, level + 1);
        });
    }
    
    async saveFromModal() {
        const title = document.getElementById('modalSectionTitle')?.value?.trim();
        const content = document.getElementById('modalSectionContent')?.value?.trim();
        const folderSelect = document.getElementById('modalFolderSelect');
        const folderId = folderSelect?.value || null;
        
        if (!this.validateSectionInput(title, content)) return;
        
        const uniqueTitle = this.sectionsManager.generateUniqueTitle(title);
        const section = this.createSection(uniqueTitle, content, folderId, this.selectedColorLabel);
        
        this.sectionsManager.addSection(section);
        CustomModal.close('addSectionModal');
        this.renderSavedSections();
        await CustomModal.alert('Saved to library successfully!');
    }
    
    async saveFolder() {
        const name = document.getElementById('folderModalInput')?.value?.trim();
        const parentSelect = document.getElementById('folderParentSelect');
        const parentId = parentSelect?.value || null;
        
        if (!name) {
            await CustomModal.alert('Please enter a folder name.');
            return;
        }
        
        if (name.length > CONFIG.VALIDATION.TITLE_MAX_LENGTH) {
            await CustomModal.alert(`Folder name must be ${CONFIG.VALIDATION.TITLE_MAX_LENGTH} characters or less.`);
            return;
        }
        
        const uniqueName = this.sectionsManager.generateUniqueFolderName(name, parentId);
        this.sectionsManager.createFolder(uniqueName, parentId);
        CustomModal.close('createFolderModal');
        this.renderSavedSections();
    }
    
    async saveFromEditModal() {
        const newTitle = document.getElementById('editModalSectionTitle')?.value?.trim();
        const newContent = document.getElementById('editModalSectionContent')?.value?.trim();
        const folderSelect = document.getElementById('editModalFolderSelect');
        const colorPicker = document.getElementById('editModalColorPicker');
        const selectedColorBtn = colorPicker?.querySelector('.color-picker-btn.selected');
        const colorLabel = selectedColorBtn?.getAttribute('data-color-id') || 'none';
        const folderId = folderSelect?.value || null;
        
        if (!this.validateSectionInput(newTitle, newContent)) return;
        if (!this.currentEditingSection) {
            await CustomModal.alert('No section is being edited.');
            return;
        }
        
        const uniqueTitle = this.sectionsManager.generateUniqueTitle(newTitle, this.currentEditingSection.id);
        const success = this.sectionsManager.updateSection(this.currentEditingSection.id, { 
            title: uniqueTitle,
            content: newContent,
            folderId: folderId,
            colorLabel: colorLabel
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
        const titleValidation = Utils.validateInputLength(title, CONFIG.VALIDATION.TITLE_MAX_LENGTH, 'Title');
        if (!titleValidation.valid) {
            await CustomModal.alert(titleValidation.message);
            return false;
        }
        
        const contentValidation = Utils.validateInputLength(content, CONFIG.VALIDATION.CONTENT_MAX_LENGTH, 'Content');
        if (!contentValidation.valid) {
            await CustomModal.alert(contentValidation.message);
            return false;
        }
        
        return true;
    }
    
    createSection(title, content, folderId = null, colorLabel = 'none') {
        return {
            id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9),
            title,
            content,
            folderId: folderId,
            colorLabel: colorLabel,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
    }
    
    clearContainer(container) {
        if (!container) return false;
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        return true;
    }
    
    createEmptyState(message) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = message;
        return emptyState;
    }
    
    setupListItemAttributes(element, id, label, dataAttr = 'data-section-id', itemType = 'listitem') {
        element.setAttribute(dataAttr, id);
        element.setAttribute('role', itemType);
        element.setAttribute('tabindex', '0');
        element.setAttribute('aria-label', label);
    }
    
    addKeyboardActivation(element, callback) {
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!e.target.classList.contains('action-btn')) {
                    callback(e);
                }
            }
        });
    }
    
    async validateAndProcessFile(file) {
        const fileValidation = FileManager.validateFile(file);
        if (!fileValidation.valid) {
            await CustomModal.alert(fileValidation.message);
            return null;
        }
        
        try {
            const { content, filename } = await FileManager.readMarkdownFile(file);
            const sanitizedContent = Utils.sanitizeMarkdown(content);
            return { content: sanitizedContent, filename };
        } catch (error) {
            console.error("Error reading file:", error);
            await CustomModal.alert("Error reading file. Please check the console for details.");
            return null;
        }
    }
    
    renderSavedSections() {
        const container = this.dom.savedSectionsList;
        
        if (!this.clearContainer(container)) return;
        
        // Render breadcrumb navigation
        this.renderBreadcrumb(container);
        
        // Get folders and sections in current folder
        const childFolders = this.sectionsManager.getChildFolders(this.currentFolderId);
        const sectionsInFolder = this.sectionsManager.getSectionsInFolder(this.currentFolderId);
        
        if (childFolders.length === 0 && sectionsInFolder.length === 0) {
            container.appendChild(this.createEmptyState(
                this.currentFolderId ? 'This folder is empty' : 'No items in library yet'
            ));
            return;
        }
        
        // Render folders first
        childFolders.forEach(folder => {
            const folderItem = this.createFolderElement(folder);
            container.appendChild(folderItem);
        });
        
        // Render sections
        sectionsInFolder.forEach(section => {
            const sectionItem = this.createSectionElement(section);
            container.appendChild(sectionItem);
        });
    }
    
    renderBreadcrumb(container) {
        if (!this.currentFolderId) return;
        
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'library-breadcrumb';
        
        // Root link
        const rootLink = document.createElement('button');
        rootLink.className = 'breadcrumb-link';
        rootLink.textContent = '📁 Library';
        rootLink.addEventListener('click', () => {
            this.currentFolderId = null;
            this.renderSavedSections();
        });
        breadcrumb.appendChild(rootLink);
        
        // Path to current folder
        const path = this.sectionsManager.getFolderPath(this.currentFolderId);
        path.forEach((folder, index) => {
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.textContent = ' › ';
            breadcrumb.appendChild(separator);
            
            if (index === path.length - 1) {
                // Current folder (not clickable)
                const current = document.createElement('span');
                current.className = 'breadcrumb-current';
                current.textContent = folder.name;
                breadcrumb.appendChild(current);
            } else {
                const link = document.createElement('button');
                link.className = 'breadcrumb-link';
                link.textContent = folder.name;
                link.addEventListener('click', () => {
                    this.currentFolderId = folder.id;
                    this.renderSavedSections();
                });
                breadcrumb.appendChild(link);
            }
        });
        
        container.appendChild(breadcrumb);
    }
    
    createFolderElement(folder) {
        const folderItem = document.createElement('div');
        folderItem.className = 'section-item folder-item';
        this.setupListItemAttributes(folderItem, folder.id, `Folder: ${folder.name}`, 'data-folder-id', 'treeitem');
        
        const iconDiv = document.createElement('div');
        iconDiv.className = 'folder-icon';
        iconDiv.textContent = '📁';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'section-title folder-title';
        titleDiv.title = folder.name;
        titleDiv.textContent = folder.name;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'section-actions';
        
        const renameBtn = this.createActionButton('✎', 'Rename folder', 'rename-btn');
        const deleteBtn = this.createActionButton('✕', 'Delete folder', 'delete-btn');
        
        actionsDiv.appendChild(renameBtn);
        actionsDiv.appendChild(deleteBtn);
        
        folderItem.appendChild(iconDiv);
        folderItem.appendChild(titleDiv);
        folderItem.appendChild(actionsDiv);
        
        // Navigate into folder on click
        folderItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('action-btn')) {
                this.currentFolderId = folder.id;
                this.renderSavedSections();
            }
        });
        
        this.addKeyboardActivation(folderItem, () => {
            this.currentFolderId = folder.id;
            this.renderSavedSections();
        });
        
        renameBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.renameFolder(folder);
        });
        
        deleteBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteFolder(folder);
        });
        
        return folderItem;
    }
    
    createSectionElement(section) {
        const sectionItem = document.createElement('div');
        sectionItem.className = 'section-item';
        this.setupListItemAttributes(sectionItem, section.id, `Library item: ${section.title}`);
        
        // Color indicator
        const colorInfo = this.sectionsManager.getColorById(section.colorLabel);
        if (section.colorLabel && section.colorLabel !== 'none') {
            const colorIndicator = document.createElement('div');
            colorIndicator.className = 'color-indicator';
            colorIndicator.style.backgroundColor = colorInfo.color;
            colorIndicator.title = colorInfo.name;
            sectionItem.appendChild(colorIndicator);
        }
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'section-title';
        titleDiv.title = section.title;
        titleDiv.textContent = section.title;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'section-actions';
        
        const renameBtn = this.createActionButton('✎', 'Edit item', 'rename-btn');
        const colorBtn = this.createActionButton('●', 'Change color', 'color-btn');
        const exportBtn = this.createActionButton('↓', 'Export as .md file', 'export-btn');
        const deleteBtn = this.createActionButton('✕', 'Delete item', 'delete-btn');
        
        actionsDiv.appendChild(renameBtn);
        actionsDiv.appendChild(colorBtn);
        actionsDiv.appendChild(exportBtn);
        actionsDiv.appendChild(deleteBtn);
        
        sectionItem.appendChild(titleDiv);
        sectionItem.appendChild(actionsDiv);
        
        this.addSectionEventListeners(sectionItem, section);
        
        return sectionItem;
    }
    
    async renameFolder(folder) {
        const newName = await CustomModal.prompt('Enter new folder name:', folder.name, 'Rename Folder');
        if (newName && newName !== folder.name) {
            const uniqueName = this.sectionsManager.generateUniqueFolderName(newName, folder.parentId, folder.id);
            this.sectionsManager.updateFolder(folder.id, { name: uniqueName });
            this.renderSavedSections();
        }
    }
    
    async deleteFolder(folder) {
        const confirmed = await CustomModal.confirm(
            `Are you sure you want to delete the folder "${folder.name}"? Items inside will be moved to the parent folder.`,
            'Delete Folder'
        );
        if (confirmed) {
            this.sectionsManager.deleteFolder(folder.id, false);
            this.renderSavedSections();
        }
    }
    
    async showColorPicker(section) {
        // Create a simple color selection modal
        const colorLabels = this.sectionsManager.getColorLabels();
        const currentColor = section.colorLabel || 'none';
        
        // Use the prompt modal with custom content for color picking
        const colorNames = colorLabels.map(c => c.name).join(', ');
        const result = await CustomModal.prompt(
            `Current: ${this.sectionsManager.getColorById(currentColor).name}\nEnter color (${colorNames}):`,
            '',
            'Change Color'
        );
        
        if (result) {
            const color = colorLabels.find(c => c.name.toLowerCase() === result.toLowerCase());
            if (color) {
                this.sectionsManager.setSectionColor(section.id, color.id);
                this.renderSavedSections();
            } else {
                await CustomModal.alert('Invalid color. Please try again.');
            }
        }
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
        
        this.addKeyboardActivation(sectionItem, () => this.loadSectionAndRender(section));
        
        const renameBtn = sectionItem.querySelector('.rename-btn');
        const colorBtn = sectionItem.querySelector('.color-btn');
        const exportBtn = sectionItem.querySelector('.export-btn');
        const deleteBtn = sectionItem.querySelector('.delete-btn');
        
        renameBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.renameSection(section);
        });
        
        colorBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showColorPicker(section);
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
        this.selectedColorLabel = section.colorLabel || 'none';
        document.getElementById('editModalSectionTitle').value = section.title;
        document.getElementById('editModalSectionContent').value = section.content;
        this.renderColorPicker('editModalColorPicker');
        
        // Update and set the folder selector for edit modal
        this.updateFolderSelector('editModalFolderSelect');
        const folderSelect = document.getElementById('editModalFolderSelect');
        if (folderSelect) {
            folderSelect.value = section.folderId || '';
        }
        
        // Set selected color
        const colorPicker = document.getElementById('editModalColorPicker');
        if (colorPicker) {
            colorPicker.querySelectorAll('.color-picker-btn').forEach(btn => {
                btn.classList.toggle('selected', btn.getAttribute('data-color-id') === this.selectedColorLabel);
            });
        }
        
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
        
        if (!this.clearContainer(container)) return;
        
        if (history.length === 0) {
            container.appendChild(this.createEmptyState('No recent history'));
            return;
        }
        
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            this.setupListItemAttributes(historyItem, item.id, `History item: ${item.title}`, 'data-history-id');
            
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
            
            this.addHistoryEventListeners(historyItem, item);
        });
    }
    
    addHistoryEventListeners(historyItem, item) {
        const loadHandler = () => {
            this.loadContentToTextarea(item.content);
            this.app.handleRender(true);
        };
        
        historyItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('action-btn')) {
                loadHandler();
            }
        });
        
        this.addKeyboardActivation(historyItem, loadHandler);

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
        
        const result = await this.validateAndProcessFile(file);
        if (!result) return;
        
        document.getElementById('modalSectionTitle').value = result.filename;
        document.getElementById('modalSectionContent').value = result.content;
    }
    
    async handleImportFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        
        e.target.value = '';
        
        const result = await this.validateAndProcessFile(file);
        if (!result) return;
        
        this.loadContentToTextarea(result.content);
        
        if (result.content.trim().length > 10) {
            const historyItem = {
                id: 'temp_' + Date.now(),
                title: result.filename,
                content: result.content,
                viewedAt: new Date().toISOString(),
                titleAutoGenerated: false
            };
            this.addToHistory(historyItem);
        }
        
        this.app.handleRender(true);
        
        setTimeout(async () => {
            const shouldSave = await CustomModal.confirm(`Would you like to save "${result.filename}" to your library?`, 'Save Imported File');
            if (shouldSave) {
                document.getElementById('modalSectionTitle').value = result.filename;
                document.getElementById('modalSectionContent').value = result.content;
                CustomModal.open('addSectionModal');
            }
        }, 100);
    }
}