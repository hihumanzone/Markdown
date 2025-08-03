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
        // Check immediately and also set up a retry mechanism
        const checkAndSetupMarked = () => {
            if (typeof marked === 'undefined') {
                console.error("Marked.js is not loaded - will use fallback renderer");
                // Enable buttons anyway since we have a fallback
                if (this.dom.renderButton) {
                    this.dom.renderButton.disabled = false;
                    this.dom.renderButton.title = "Render the markdown content (using fallback renderer)";
                }
                if (this.dom.pasteAndRenderButton) {
                    this.dom.pasteAndRenderButton.disabled = false;
                    this.dom.pasteAndRenderButton.title = "Paste from clipboard and render (using fallback renderer)";
                }
                return false;
            }
            
            marked.setOptions({
                gfm: true,
                breaks: true,
                smartypants: false,
            });
            
            // Update button titles for full functionality
            if (this.dom.renderButton) {
                this.dom.renderButton.disabled = false;
                this.dom.renderButton.title = "Render the markdown content";
            }
            if (this.dom.pasteAndRenderButton) {
                this.dom.pasteAndRenderButton.disabled = false;
                this.dom.pasteAndRenderButton.title = "Paste from clipboard and render";
            }
            return true;
        };
        
        // Initial check
        if (!checkAndSetupMarked()) {
            // Retry a few times in case marked.js loads asynchronously
            let retryCount = 0;
            const maxRetries = 10;
            const retryInterval = setInterval(() => {
                retryCount++;
                if (checkAndSetupMarked() || retryCount >= maxRetries) {
                    clearInterval(retryInterval);
                    if (retryCount >= maxRetries && typeof marked === 'undefined') {
                        console.error("Failed to load Marked.js after multiple attempts - using fallback renderer");
                    }
                }
            }, 500);
        }
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
            // Check if marked.js is available
            if (typeof marked === 'undefined') {
                console.error("Marked.js library is not loaded, using basic fallback");
                await CustomModal.alert("The Markdown library failed to load due to network restrictions. Using basic fallback renderer with limited features. For full functionality, please refresh the page with a stable internet connection.");
                
                // Use basic fallback markdown parsing
                const basicHtml = this.basicMarkdownToHtml(markdownText);
                const listItems = ListItemParser.parse(markdownText);
                const fullPageHtml = RenderedPageBuilder.build(
                    basicHtml,
                    markdownText,
                    "Rendered Markdown & LaTeX (Basic Mode)",
                    listItems
                );
                this.openInNewTab(fullPageHtml);
                return;
            }

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
            if (error.message && error.message.includes('marked')) {
                await CustomModal.alert("The Markdown library failed to load properly. Please refresh the page and ensure you have an internet connection.");
            } else {
                await CustomModal.alert("An error occurred while rendering the markdown. Please check the console for details.");
            }
        }
    }
    
    // Basic fallback markdown parser for when marked.js fails to load
    basicMarkdownToHtml(markdown) {
        let html = markdown;
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Bold and italic
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');
        
        // Inline code
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        // Line breaks
        html = html.replace(/\n/g, '<br>');
        
        // Wrap in paragraph tags
        html = '<p>' + html + '</p>';
        
        return html;
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