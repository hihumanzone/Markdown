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
    
    saveAsPdf() {
        if (this.rawContainer && this.rawContainer.style.display !== 'none') {
            alert('Switch to the rendered view before exporting to PDF.'); 
            return;
        }
        
        // Prompt for filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -4);
        const defaultFilename = `markdown-export-${timestamp}`;
        
        const filename = prompt('Enter filename for PDF export:', defaultFilename);
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
}