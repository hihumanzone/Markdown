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
        const validExtensions = ['.md', '.markdown', '.txt'];
        const validTypes = ['text/markdown', 'text/plain'];
        
        const hasValidExtension = validExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext)
        );
        const hasValidType = validTypes.includes(file.type) || file.type === '';
        
        return hasValidExtension || hasValidType;
    }
}