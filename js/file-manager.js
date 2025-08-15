class FileManager {
    static exportSectionAsMarkdown(section) {
        const blob = new Blob([section.content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const filename = `${section.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    static readMarkdownFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const content = event.target.result;
                const filename = file.name.replace(/\.[^/.]+$/, "");
                resolve({ content, filename });
            };
            
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
                reject(new Error("Error reading file. Please check the console for details."));
            };
            
            reader.readAsText(file);
        });
    }
    
    static isValidMarkdownFile(file) {
        const validExtensions = CONFIG.SUPPORTED_FILE_TYPES.EXTENSIONS;
        const validTypes = CONFIG.SUPPORTED_FILE_TYPES.MIME_TYPES;
        
        const hasValidExtension = validExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext)
        );
        const hasValidType = validTypes.includes(file.type) || file.type === '';
        
        return hasValidExtension && (hasValidType || file.type === '');
    }
    
    static validateFile(file) {
        if (!file) {
            return { valid: false, message: 'No file selected.' };
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            return { valid: false, message: 'File size must be less than 10MB.' };
        }
        
        if (!this.isValidMarkdownFile(file)) {
            const supportedExts = CONFIG.SUPPORTED_FILE_TYPES.EXTENSIONS.join(', ');
            return { 
                valid: false, 
                message: `Only the following file types are supported: ${supportedExts}` 
            };
        }
        
        return { valid: true };
    }
}