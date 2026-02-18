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
    
    async exportMarkdown() {
        const rawMarkdown = window.__APP_DATA__.rawMarkdown;
        const defaultFilename = this.getDefaultFilename('markdown');
        
        const filename = await CustomModal.prompt('Name your Markdown file:', defaultFilename);
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


    getDefaultFilename(kind) {
        const title = (window.__APP_DATA__?.documentTitle || document.title || 'document').toLowerCase();
        const base = title.replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-') || 'document';
        return `${base}-${kind}`;
    }
}
