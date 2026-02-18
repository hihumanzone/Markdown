class SavePdfController {
     constructor() {
        this.btn = document.getElementById('saveAsPdfBtn');
        this.controlsPanel = document.getElementById('font-controls');
        this.rawContainer = document.getElementById('raw-container'); 
        this.init();
    }
    
    init() { 
        if (this.btn) { 
            this.btn.addEventListener('click', () => this.saveAsPdf()); 
        } 
    }
    
    async saveAsPdf() {
        if (this.rawContainer && this.rawContainer.style.display !== 'none') {
            alert('Switch to the rendered view before exporting to PDF.'); 
            return;
        }
        
        // Prompt for filename
        const defaultFilename = this.getDefaultFilename('pdf');
        
        const filename = await CustomModal.prompt('Name your PDF file:', defaultFilename);
        if (filename === null) return; // User cancelled
        
        const sanitizedFilename = filename.trim().replace(/[<>:"/\\|?*]/g, '_') || defaultFilename;
        
        // Set document title so browser's "Save as PDF" dialog uses it
        const originalTitle = document.title;
        document.title = sanitizedFilename;
        
        this.controlsPanel.style.display = 'none';
        setTimeout(() => { 
            window.print(); 
            setTimeout(() => { 
                this.controlsPanel.style.display = ''; 
                document.title = originalTitle; // Restore original title
            }, 150); 
        }, 30);
    }


    getDefaultFilename(kind) {
        const title = (window.__APP_DATA__?.documentTitle || document.title || 'document').toLowerCase();
        const base = title.replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-') || 'document';
        return `${base}-${kind}`;
    }
}
