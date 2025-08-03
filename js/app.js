class MarkdownRendererApp {
    constructor() {
        this.dom = {};
        this.savedSectionsManager = null;
        this.init();
    }
    
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.cacheDOMElements();
            this.setupMarked();
            this.bindEventListeners();
            this.savedSectionsManager = new SavedSectionsManager(this.dom, this);
        });
    }
    
    cacheDOMElements() {
        this.dom = {
            markdownInput: document.getElementById('markdownInput'),
            renderButton: document.getElementById('renderMarkdownBtn'),
            pasteAndRenderButton: document.getElementById('pasteAndRenderBtn'),
            clearButton: document.getElementById('clearBtn'),
            importBtn: document.getElementById('importBtn'),
            importFileInput: document.getElementById('importFileInput'),
            savedSectionsList: document.getElementById('savedSectionsList'),
            historyList: document.getElementById('historyList')
        };
    }
    
    setupMarked() {
        if (typeof marked === 'undefined') {
            console.error("Marked.js is not loaded!");
            if (this.dom.renderButton) this.dom.renderButton.disabled = true;
            if (this.dom.pasteAndRenderButton) this.dom.pasteAndRenderButton.disabled = true;
            return;
        }
        marked.setOptions({
            gfm: true,
            breaks: true,
            smartypants: false,
        });
    }
    
    bindEventListeners() {
        this.dom.renderButton?.addEventListener('click', () => this.handleRender());
        this.dom.pasteAndRenderButton?.addEventListener('click', () => this.handlePasteAndRender());
        this.dom.clearButton?.addEventListener('click', () => this.handleClear());
        this.dom.markdownInput?.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.handleRender();
            }
        });
        this.dom.importBtn?.addEventListener('click', () => this.dom.importFileInput.click());
    }
    
    async handleRender(skipHistoryUpdate = false) {
        const markdownText = this.dom.markdownInput.value;
        if (!markdownText.trim()) {
            await CustomModal.alert('Please enter some markdown content to render.');
            return;
        }
        
        if (!skipHistoryUpdate && markdownText.trim().length > 10) {
            const historyItem = {
                id: 'temp_' + Date.now(),
                title: this.extractTitle(markdownText) || 'Untitled',
                content: markdownText,
                viewedAt: new Date().toISOString()
            };
            this.savedSectionsManager?.addToHistory(historyItem);
        }
        
        this.renderMarkdown(markdownText);
    }
    
    extractTitle(content) {
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('# ')) {
                return trimmed.substring(2).trim();
            }
            if (trimmed.startsWith('## ')) {
                return trimmed.substring(3).trim();
            }
            if (trimmed && !trimmed.startsWith('#') && trimmed.length < 100) {
                return trimmed;
            }
        }
        return null;
    }
    
    async handlePasteAndRender() {
        if (!navigator.clipboard?.readText) {
            await CustomModal.alert('Clipboard API not available. Please use a modern browser or check permissions.');
            return;
        }
        try {
            const text = await navigator.clipboard.readText();
            this.dom.markdownInput.value = text;
            this.handleRender();
        } catch (err) {
            console.error('Failed to read clipboard:', err);
            await CustomModal.alert('Failed to read from clipboard. Please check permissions or paste manually.');
        }
    }
    
    async handleClear() {
        if (this.dom.markdownInput.value) {
            const confirmed = await CustomModal.confirm('Are you sure you want to clear the input?', 'Clear Content');
            if (!confirmed) return;
        }
        this.dom.markdownInput.value = '';
        this.dom.markdownInput.focus();
    }
    
    async renderMarkdown(markdownText) {
        try {
            const { tempText, mathExpressions } = MathProcessor.preserveMathExpressions(markdownText);
            let html = marked.parse(tempText);
            html = MathProcessor.restoreMathExpressions(html, mathExpressions);
            const listItems = ListItemParser.parse(markdownText);
            const fullPageHtml = RenderedPageBuilder.build(
                html,
                markdownText,
                "Rendered Markdown & LaTeX",
                listItems
            );
            this.openInNewTab(fullPageHtml);
        } catch (error) {
            console.error("Error during markdown rendering:", error);
            await CustomModal.alert("An error occurred while rendering the markdown. Please check the console for details.");
        }
    }
    
    async openInNewTab(htmlContent) {
        try {
            // Create a blob with the HTML content
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            
            // Open the blob URL in a new tab
            const newTab = window.open(blobUrl, '_blank');
            if (newTab) {
                newTab.focus();
                
                // Don't revoke the blob URL immediately to allow for page refreshes
                // The browser will clean up blob URLs when the page is closed
            } else {
                // Clean up immediately if tab failed to open
                URL.revokeObjectURL(blobUrl);
                await CustomModal.alert("Failed to open new tab. Please check your pop-up blocker settings.");
            }
        } catch (error) {
            console.error("Error creating blob URL:", error);
            // Fallback to the original method if blob creation fails
            const newTab = window.open('', '_blank');
            if (newTab) {
                newTab.document.open();
                newTab.document.write(htmlContent);
                newTab.document.close();
                newTab.focus();
            } else {
                await CustomModal.alert("Failed to open new tab. Please check your pop-up blocker settings.");
            }
        }
    }
}