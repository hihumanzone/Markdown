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
        
        // Strip trailing .pdf if entered, since browser's print-to-PDF will append .pdf automatically
        const printTitle = sanitizedFilename.replace(/\.pdf$/i, '').trim() || 'document';
        
        // Save original document titles (both iframe and parent/top if in iframe)
        const originalTitle = document.title;
        let originalParentTitle = null;
        let originalTopTitle = null;

        try {
            if (window.parent && window.parent !== window && window.parent.document) {
                originalParentTitle = window.parent.document.title;
                window.parent.document.title = printTitle;
            }
        } catch (e) {}

        try {
            if (window.top && window.top !== window && window.top !== window.parent && window.top.document) {
                originalTopTitle = window.top.document.title;
                window.top.document.title = printTitle;
            }
        } catch (e) {}

        document.title = printTitle;
        
        this.preparePrint();
        if (this.controlsPanel) {
            this.controlsPanel.style.display = 'none';
        }

        let isCleanedUp = false;
        const cleanupAfterPrint = () => {
            if (isCleanedUp) return;
            isCleanedUp = true;
            document.title = originalTitle;
            try {
                if (originalParentTitle !== null && window.parent?.document) {
                    window.parent.document.title = originalParentTitle;
                }
            } catch (e) {}
            try {
                if (originalTopTitle !== null && window.top?.document) {
                    window.top.document.title = originalTopTitle;
                }
            } catch (e) {}
            if (this.controlsPanel) {
                this.controlsPanel.style.display = '';
            }
            this.cleanupPrint();
            window.removeEventListener('afterprint', cleanupAfterPrint);
        };

        window.addEventListener('afterprint', cleanupAfterPrint);

        setTimeout(() => { 
            window.print();
            // Fallback timeout in case afterprint does not fire in some environments
            setTimeout(cleanupAfterPrint, 3000);
        }, 50);
    }

    getDefaultFilename(kind) {
        const title = (window.__APP_DATA__?.documentTitle || document.title || 'document').toLowerCase();
        const base = title.replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-') || 'document';
        return `${base}-${kind}`;
    }
}
