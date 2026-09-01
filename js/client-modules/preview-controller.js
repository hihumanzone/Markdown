class PreviewController {
    constructor() {
        this.openNewTabBtn = document.getElementById('openNewTabBtn');
        this.closePreviewBtn = document.getElementById('closePreviewBtn');
        this.init();
    }
    
    init() {
        if (this.closePreviewBtn) {
            this.closePreviewBtn.addEventListener('click', () => this.close());
        }
        if (this.openNewTabBtn) {
            this.openNewTabBtn.addEventListener('click', () => this.openInNewTab());
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        });
    }
    
    close() {
        try {
            if (window.parent && window.parent.markdownRendererApp && typeof window.parent.markdownRendererApp.closePreview === 'function') {
                window.parent.markdownRendererApp.closePreview();
                return;
            }
        } catch (e) {
            // fallback
        }
        window.parent.postMessage({ type: 'CLOSE_MARKDOWN_PREVIEW' }, '*');
    }
    
    openInNewTab() {
        try {
            if (window.parent && window.parent.markdownRendererApp && typeof window.parent.markdownRendererApp.openInNewTabFromPreview === 'function') {
                window.parent.markdownRendererApp.openInNewTabFromPreview();
                return;
            }
        } catch (e) {
            // fallback
        }
        window.parent.postMessage({ type: 'OPEN_MARKDOWN_NEW_TAB' }, '*');
    }
}
