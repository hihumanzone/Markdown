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
        const blob = new Blob([rawMarkdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -4);
        link.href = url; 
        link.download = `markdown-export-${timestamp}.md`;
        document.body.appendChild(link); 
        link.click();
        document.body.removeChild(link); 
        URL.revokeObjectURL(url);
    }
}