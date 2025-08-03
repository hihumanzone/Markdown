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
        this.controlsPanel.style.display = 'none';
        setTimeout(() => { 
            window.print(); 
            setTimeout(() => { 
                this.controlsPanel.style.display = ''; 
            }, 150); 
        }, 30);
    }
}