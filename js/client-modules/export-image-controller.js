class ExportImageController {
    constructor() {
        this.btn = document.getElementById('exportImageBtn');
        this.controlsPanel = document.getElementById('font-controls');
        this.notificationElement = document.getElementById('copy-notification');
        this.rawContainer = document.getElementById('raw-container');
        this.cachedKatexCSS = null;
        this.init();
    }
    
    init() {
        if (this.btn) {
            this.btn.addEventListener('click', () => this.exportAsImage());
        }
    }
    
    async fetchKatexCSS() {
        if (this.cachedKatexCSS) {
            return this.cachedKatexCSS;
        }
        try {
            const cssUrl = window.__APP_DATA__.config.CDN.katexCSS;
            const response = await fetch(cssUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch CSS: ${response.statusText}`);
            }
            const cssText = await response.text();
            this.cachedKatexCSS = cssText;
            return cssText;
        } catch (error) {
            console.error('Could not fetch KaTeX CSS for image export:', error);
            return '';
        }
    }
    
    async exportAsImage() {
        if (typeof html2canvas === 'undefined') {
            alert('Image export library (html2canvas) is not loaded yet. Please try again in a moment.');
            return;
        }
        if (this.rawContainer?.style.display !== 'none') {
            alert('Switch to the rendered view before exporting as an image.');
            return;
        }

        // Prompt for filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -4);
        const defaultFilename = `markdown-export-${timestamp}`;
        
        const filename = await CustomModal.prompt('Enter filename for image export:', defaultFilename);
        if (filename === null) return; // User cancelled
        
        const sanitizedFilename = filename.trim().replace(/[<>:"/\\|?*]/g, '_') || defaultFilename;
        const finalFilename = sanitizedFilename.endsWith('.png') ? sanitizedFilename : `${sanitizedFilename}.png`;

        const originalBtnText = this.btn.textContent;
        const originalControlsDisplay = this.controlsPanel.style.display;
        const originalScrollX = window.scrollX;
        const originalScrollY = window.scrollY;

        this.btn.textContent = 'Generating...';
        this.btn.disabled = true;
        this.controlsPanel.style.display = 'none';
        if (this.notificationElement) this.notificationElement.style.display = 'none';

        window.scrollTo(0, 0);

        try {
            await new Promise(resolve => requestAnimationFrame(resolve));

            const katexCSSText = await this.fetchKatexCSS();
            const canvas = await html2canvas(document.body, {
                scale: 2,
                useCORS: true,
                backgroundColor: window.getComputedStyle(document.body).backgroundColor,
                logging: false,
                windowWidth: document.documentElement.scrollWidth,
                windowHeight: document.documentElement.scrollHeight,
                onclone: (clonedDoc) => {
                    if (katexCSSText) {
                        const style = clonedDoc.createElement('style');
                        style.innerHTML = katexCSSText;
                        clonedDoc.head.appendChild(style);
                    }
                },
            });

            const link = document.createElement('a');
            link.download = finalFilename;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting image:', error);
            alert('An error occurred while exporting the image. See console for details.');
        } finally {
            this.controlsPanel.style.display = originalControlsDisplay;
            this.btn.textContent = originalBtnText;
            this.btn.disabled = false;
            window.scrollTo(originalScrollX, originalScrollY);
        }
    }
}