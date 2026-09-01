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

        window.addEventListener('beforeprint', () => this.preparePrint());
        window.addEventListener('afterprint', () => this.cleanupPrint());
    }

    preparePrint() {
        document.body.classList.add('print-mode');
        this.resizeLineNumbers();
    }

    cleanupPrint() {
        document.body.classList.remove('print-mode');
        this.resizeLineNumbers();
    }

    resizeLineNumbers() {
        if (window.Prism && window.Prism.plugins && window.Prism.plugins.lineNumbers) {
            const preElements = document.querySelectorAll('pre.line-numbers');
            preElements.forEach(pre => {
                window.Prism.plugins.lineNumbers.resize(pre);
            });
        }
    }
    
    async saveAsPdf() {
        if (this.rawContainer && this.rawContainer.style.display !== 'none') {
            alert('Switch to the rendered view before exporting to PDF.'); 
            return;
        }
        
        // Prompt for filename using utility functions
        const defaultFilename = CustomModal.buildDefaultFilename ? CustomModal.buildDefaultFilename('pdf') : this.getDefaultFilename('pdf');
        
        const filename = await CustomModal.prompt('Name your PDF file:', defaultFilename, 'Save as PDF', { extension: '.pdf' });
        if (filename === null) return; // User cancelled
        
        const sanitizedFilename = CustomModal.sanitizeFilename ? CustomModal.sanitizeFilename(filename, defaultFilename) : (filename.trim().replace(/[<>:"/\\|?*]/g, '_') || defaultFilename);
        
        // Set document title so browser's "Save as PDF" dialog uses it
        const originalTitle = document.title;
        document.title = sanitizedFilename;
        
        this.preparePrint();
        this.controlsPanel.style.display = 'none';

        setTimeout(() => { 
            window.print(); 
            setTimeout(() => { 
                this.controlsPanel.style.display = ''; 
                document.title = originalTitle; // Restore original title
                this.cleanupPrint();
            }, 150); 
        }, 50);
    }

    getDefaultFilename(kind) {
        const title = (window.__APP_DATA__?.documentTitle || document.title || 'document').toLowerCase();
        const base = title.replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-') || 'document';
        return `${base}-${kind}`;
    }
}
