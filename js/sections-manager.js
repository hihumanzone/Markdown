class SectionsManager {
    constructor() {
        this.STORAGE_KEY = 'markdownSavedSections';
        this.FOLDERS_KEY = 'markdownLibraryFolders';
        this.COLOR_LABELS = [
            { id: 'none', name: 'No Color', color: 'transparent' },
            { id: 'red', name: 'Red', color: '#ef4444' },
            { id: 'orange', name: 'Orange', color: '#f97316' },
            { id: 'yellow', name: 'Yellow', color: '#eab308' },
            { id: 'green', name: 'Green', color: '#22c55e' },
            { id: 'blue', name: 'Blue', color: '#3b82f6' },
            { id: 'purple', name: 'Purple', color: '#a855f7' },
            { id: 'pink', name: 'Pink', color: '#ec4899' }
        ];
    }
    
    // Folder methods
    getFolders() {
        try {
            const folders = JSON.parse(localStorage.getItem(this.FOLDERS_KEY) || '[]');
            return folders;
        } catch (e) {
            console.error('Error loading folders:', e);
            return [];
        }
    }
    
    setFolders(folders) {
        try {
            localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(folders));
        } catch (e) {
            console.error('Error saving folders:', e);
            throw new Error('Error saving folders. Local storage may be full.');
        }
    }
    
    createFolder(name, parentId = null) {
        const folders = this.getFolders();
        const folder = {
            id: 'folder_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9),
            name: name.trim(),
            parentId: parentId,
            createdAt: new Date().toISOString(),
            color: 'none'
        };
        folders.push(folder);
        this.setFolders(folders);
        return folder;
    }
    
    updateFolder(folderId, updates) {
        const folders = this.getFolders();
        const folderIndex = folders.findIndex(f => f.id === folderId);
        if (folderIndex !== -1) {
            folders[folderIndex] = { ...folders[folderIndex], ...updates };
            this.setFolders(folders);
            return true;
        }
        return false;
    }
    
    deleteFolder(folderId, deleteContents = false) {
        const folders = this.getFolders();
        const sections = this.getSections();
        
        // Get all descendant folder IDs
        const descendantIds = this.getDescendantFolderIds(folderId);
        const allFolderIds = [folderId, ...descendantIds];
        
        if (deleteContents) {
            // Delete all sections in this folder and subfolders
            const filteredSections = sections.filter(s => !allFolderIds.includes(s.folderId));
            this.setSections(filteredSections);
        } else {
            // Move sections to root (no folder)
            const updatedSections = sections.map(s => {
                if (allFolderIds.includes(s.folderId)) {
                    return { ...s, folderId: null };
                }
                return s;
            });
            this.setSections(updatedSections);
        }
        
        // Delete the folder and all subfolders
        const filteredFolders = folders.filter(f => !allFolderIds.includes(f.id));
        this.setFolders(filteredFolders);
        return true;
    }
    
    getDescendantFolderIds(folderId) {
        const folders = this.getFolders();
        const descendants = [];
        
        const findChildren = (parentId) => {
            const children = folders.filter(f => f.parentId === parentId);
            children.forEach(child => {
                descendants.push(child.id);
                findChildren(child.id);
            });
        };
        
        findChildren(folderId);
        return descendants;
    }
    
    getFolderPath(folderId) {
        const folders = this.getFolders();
        const path = [];
        let currentId = folderId;
        
        while (currentId) {
            const folder = folders.find(f => f.id === currentId);
            if (folder) {
                path.unshift(folder);
                currentId = folder.parentId;
            } else {
                break;
            }
        }
        
        return path;
    }
    
    getChildFolders(parentId = null) {
        const folders = this.getFolders();
        return folders.filter(f => f.parentId === parentId);
    }
    
    getSectionsInFolder(folderId = null) {
        const sections = this.getSections();
        return sections.filter(s => s.folderId === folderId);
    }
    
    // Section methods (updated to support folders and colors)
    addSection(section) {
        const sections = this.getSections();
        // Ensure section has folderId and colorLabel
        if (!section.folderId) section.folderId = null;
        if (!section.colorLabel) section.colorLabel = 'none';
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
    
    moveSection(sectionId, targetFolderId) {
        return this.updateSection(sectionId, { folderId: targetFolderId });
    }
    
    setSectionColor(sectionId, colorLabel) {
        return this.updateSection(sectionId, { colorLabel: colorLabel });
    }
    
    deleteSection(sectionId) {
        const sections = this.getSections();
        const filteredSections = sections.filter(s => s.id !== sectionId);
        this.setSections(filteredSections);
        return filteredSections.length < sections.length;
    }
    
    getSections() {
        try {
            const sections = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            // Migrate old sections without folderId or colorLabel
            return sections.map(s => ({
                ...s,
                folderId: s.folderId || null,
                colorLabel: s.colorLabel || 'none'
            }));
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
    
    generateUniqueFolderName(originalName, parentId = null, excludeId = null) {
        const folders = this.getFolders();
        const existingNames = folders
            .filter(f => f.parentId === parentId && (excludeId === null || f.id !== excludeId))
            .map(f => f.name);
        
        if (!existingNames.includes(originalName)) {
            return originalName;
        }
        
        let counter = 2;
        let newName = `${originalName} ${counter}`;
        
        while (existingNames.includes(newName)) {
            counter++;
            newName = `${originalName} ${counter}`;
        }
        
        return newName;
    }
    
    getColorLabels() {
        return this.COLOR_LABELS;
    }
    
    getColorById(colorId) {
        return this.COLOR_LABELS.find(c => c.id === colorId) || this.COLOR_LABELS[0];
    }
    
    clearSections() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
    
    clearFolders() {
        localStorage.removeItem(this.FOLDERS_KEY);
    }
    
    // Backup and restore methods
    exportLibraryData() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            sections: this.getSections(),
            folders: this.getFolders()
        };
        return data;
    }
    
    importLibraryData(data) {
        // Validate data structure
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid backup file format');
        }
        
        if (!Array.isArray(data.sections) || !Array.isArray(data.folders)) {
            throw new Error('Invalid backup file structure');
        }
        
        // Import folders first
        this.setFolders(data.folders);
        
        // Import sections
        this.setSections(data.sections);
        
        return true;
    }
}