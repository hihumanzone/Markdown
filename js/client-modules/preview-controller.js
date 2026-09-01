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
            // cross-origin or fallback
        }
        window.parent.postMessage({ type: 'CLOSE_MARKDOWN_PREVIEW' }, '*');
    }
    
    openInNewTab() {
        let newTab = null;
        try {
            newTab = window.open('', '_blank');
        } catch (e) {
            console.error('Direct window.open failed:', e);
        }

        let standaloneHtml = '';
        try {
            if (window.parent && window.parent.markdownRendererApp && typeof window.parent.markdownRendererApp.getStandaloneRenderedHtml === 'function') {
                standaloneHtml = window.parent.markdownRendererApp.getStandaloneRenderedHtml();
            }
        } catch (e) {
            console.error('Error getting HTML from parent:', e);
        }

        if (!standaloneHtml && window.__APP_DATA__) {
            try {
                const clone = document.documentElement.cloneNode(true);
                const openBtn = clone.querySelector('#openNewTabBtn');
                const closeBtn = clone.querySelector('#closePreviewBtn');
                if (openBtn) openBtn.remove();
                if (closeBtn) closeBtn.remove();
                const scripts = clone.querySelectorAll('script');
                scripts.forEach(s => {
                    if (s.textContent && s.textContent.includes('__APP_DATA__')) {
                        s.textContent = s.textContent.replace('isPreview: true', 'isPreview: false');
                    }
                });
                standaloneHtml = '<!DOCTYPE html>\n' + clone.outerHTML;
            } catch (cloneErr) {
                console.error('Clone fallback error:', cloneErr);
            }
        }

        if (newTab && standaloneHtml) {
            try {
                newTab.document.open();
                newTab.document.write(standaloneHtml);
                newTab.document.close();
                newTab.focus();
                return;
            } catch (writeErr) {
                console.error('Error writing to new tab document, trying blob:', writeErr);
                try {
                    const blob = new Blob([standaloneHtml], { type: 'text/html' });
                    const blobUrl = URL.createObjectURL(blob);
                    newTab.location.href = blobUrl;
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
                    return;
                } catch (blobErr) {
                    console.error('Blob URL navigation error:', blobErr);
                }
            }
        }

        if (!newTab && standaloneHtml) {
            try {
                const blob = new Blob([standaloneHtml], { type: 'text/html' });
                const blobUrl = URL.createObjectURL(blob);
                const blobTab = window.open(blobUrl, '_blank');
                if (blobTab) {
                    blobTab.focus();
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
                    return;
                }
            } catch (_) {}
        }

        this.showNotification('Failed to open new tab. Please check your pop-up blocker settings.', true);
        
        try {
            window.parent.postMessage({ type: 'OPEN_MARKDOWN_NEW_TAB' }, '*');
        } catch (_) {}
    }

    showNotification(message, isError = false) {
        const notification = document.getElementById('copy-notification');
        if (!notification) {
            alert(message);
            return;
        }
        notification.textContent = message;
        notification.style.backgroundColor = isError ? 'rgba(220, 38, 38, 0.95)' : 'rgba(30, 30, 30, 0.9)';
        notification.style.color = 'white';
        if (document.body.classList.contains('dark-theme') || document.body.classList.contains('high-contrast-theme')) {
            notification.style.backgroundColor = isError ? 'rgba(248, 81, 73, 0.95)' : 'rgba(200, 200, 200, 0.9)';
            notification.style.color = isError ? 'white' : '#0d1117';
        }
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, isError ? 4000 : 2500);
    }
}
