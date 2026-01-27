class ExportMarkdownController {
    constructor() { 
        this.btn = document.getElementById('exportMarkdownBtn'); 
        this.init(); 
    }
    
    init() { 
        if (this.btn) {
            this.btn.addEventListener('click', () => this.exportMarkdown()); 
        }
    }
    
    exportMarkdown() {
        const rawMarkdown = window.__APP_DATA__.rawMarkdown;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -4);
        const defaultFilename = `markdown-export-${timestamp}`;
        
        const filename = prompt('Enter filename for Markdown export:', defaultFilename);
        if (filename === null) return; // User cancelled
        
        const sanitizedFilename = filename.trim().replace(/[<>:"/\\|?*]/g, '_') || defaultFilename;
        const finalFilename = sanitizedFilename.endsWith('.md') ? sanitizedFilename : `${sanitizedFilename}.md`;
        
        const blob = new Blob([rawMarkdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; 
        link.download = finalFilename;
        document.body.appendChild(link); 
        link.click();
        document.body.removeChild(link); 
        URL.revokeObjectURL(url);
    }
}