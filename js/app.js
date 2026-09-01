class MarkdownRendererApp {
    constructor() {
        this.dom = {};
        this.savedSectionsManager = null;
        this.currentContentManager = new CurrentContentManager();
        this.fallbackWarningLogged = false;
        this.currentRenderedMarkdown = '';
        this.init();
    }
    
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.cacheDOMElements();
            this.setupMarked();
            this.bindEventListeners();
            this.savedSectionsManager = new SavedSectionsManager(this.dom, this);
            this.initCurrentContentManager();
        });
    }
    
    cacheDOMElements() {
        this.dom = {
            mainContent: document.querySelector('.main-content'),
            previewContainer: document.getElementById('previewContainer'),
            previewFrame: document.getElementById('previewFrame'),
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
        const checkAndSetupMarked = () => {
            if (typeof marked === 'undefined') {
                if (!this.fallbackWarningLogged) {
                    this.fallbackWarningLogged = true;
                }
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
            
            const renderer = new marked.Renderer();
            renderer.code = function(code, infostring, escaped) {
                let text = typeof code === 'object' && code !== null ? (code.text || '') : (code || '');
                let lang = typeof code === 'object' && code !== null ? (code.lang || '') : (infostring || '');
                const cleanLang = (lang || '').trim().split(/\s+/)[0].toLowerCase();
                const langClass = cleanLang ? `language-${cleanLang}` : 'language-none';
                const escapedText = escaped ? text : Utils.escapeHtml(text);
                return `<pre class="line-numbers"><code class="${langClass}">${escapedText}</code></pre>\n`;
            };
            
            marked.setOptions({
                renderer: renderer,
                gfm: true,
                breaks: true,
                smartypants: false,
            });
            
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
        
        if (!checkAndSetupMarked()) {
            let retryCount = 0;
            const maxRetries = 10;
            const retryInterval = setInterval(() => {
                retryCount++;
                if (checkAndSetupMarked() || retryCount >= maxRetries) {
                    clearInterval(retryInterval);
                    if (retryCount >= maxRetries && typeof marked === 'undefined' && !this.fallbackWarningLogged) {
                        this.fallbackWarningLogged = true;
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

        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'CLOSE_MARKDOWN_PREVIEW') {
                this.closePreview();
            } else if (e.data && e.data.type === 'OPEN_MARKDOWN_NEW_TAB') {
                this.openInNewTabFromPreview();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPreviewOpen()) {
                this.closePreview();
            }
        });
    }
    
    initCurrentContentManager() {
        if (this.dom.markdownInput) {
            this.currentContentManager.restoreContent(this.dom.markdownInput);
            this.currentContentManager.setupAutoSave(this.dom.markdownInput);
        }
    }

    isPreviewOpen() {
        return this.dom.previewContainer && this.dom.previewContainer.classList.contains('active');
    }

    showPreview(htmlContent, rawMarkdown) {
        this.currentRenderedMarkdown = rawMarkdown || '';
        if (this.dom.previewContainer && this.dom.previewFrame) {
            this.dom.previewFrame.srcdoc = htmlContent;
            this.dom.previewContainer.classList.add('active');
            this.dom.previewContainer.style.display = 'block';
            if (this.dom.mainContent) {
                this.dom.mainContent.style.display = 'none';
            }
            this.dom.previewFrame.focus();
        }
    }

    closePreview() {
        if (this.dom.previewContainer) {
            this.dom.previewContainer.classList.remove('active');
            this.dom.previewContainer.style.display = 'none';
        }
        if (this.dom.previewFrame) {
            this.dom.previewFrame.srcdoc = '';
        }
        if (this.dom.mainContent) {
            this.dom.mainContent.style.display = '';
        }
        this.savedSectionsManager?.renderSavedSections();
        this.dom.markdownInput?.focus();
    }

    openInNewTabFromPreview() {
        const rawMarkdown = this.currentRenderedMarkdown || this.dom.markdownInput?.value || '';
        if (!rawMarkdown.trim()) return;
        this.renderMarkdownToNewTab(rawMarkdown);
    }
    
    async handleRender(skipHistoryUpdate = false) {
        const markdownText = this.dom.markdownInput.value;
        if (!markdownText.trim()) {
            await CustomModal.alert('Please enter some markdown content to render.');
            return;
        }
        
        if (!skipHistoryUpdate && markdownText.trim().length > 10) {
            const extractedTitle = this.extractTitle(markdownText);
            const historyItem = {
                id: 'temp_' + Date.now(),
                title: extractedTitle || 'Untitled',
                content: markdownText,
                viewedAt: new Date().toISOString(),
                titleAutoGenerated: true
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
            this.currentContentManager.saveCurrentContent(text);
            this.handleRender();
        } catch (err) {
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
        this.currentContentManager.clearCurrentContent();
    }
    
    async renderMarkdown(markdownText) {
        try {
            if (typeof marked === 'undefined') {
                await this.renderWithFallback(markdownText);
                return;
            }

            const { tempText, mathExpressions } = MathProcessor.preserveMathExpressions(markdownText);
            let html = marked.parse(tempText);
            html = MathProcessor.restoreMathExpressions(html, mathExpressions);
            const { nested: listItems, flat: flatListItems } = ListItemParser.parseAll(markdownText);
            const fullPageHtml = RenderedPageBuilder.build(
                html,
                markdownText,
                "Rendered Markdown & LaTeX",
                listItems,
                flatListItems,
                { isPreview: true }
            );
            this.showPreview(fullPageHtml, markdownText);
        } catch (error) {
            const message = error.message?.includes('marked') 
                ? "The Markdown library failed to load properly. Please refresh the page and ensure you have an internet connection."
                : "An error occurred while rendering the markdown. Please try again later.";
            await CustomModal.alert(message);
        }
    }

    async renderMarkdownToNewTab(markdownText) {
        try {
            if (typeof marked === 'undefined') {
                const basicHtml = FallbackRenderer.renderToHtml(markdownText);
                const { nested: listItems, flat: flatListItems } = ListItemParser.parseAll(markdownText);
                const fullPageHtml = RenderedPageBuilder.build(
                    basicHtml,
                    markdownText,
                    "Rendered Markdown & LaTeX (Basic Mode)",
                    listItems,
                    flatListItems,
                    { isPreview: false }
                );
                this.openInNewTab(fullPageHtml);
                return;
            }

            const { tempText, mathExpressions } = MathProcessor.preserveMathExpressions(markdownText);
            let html = marked.parse(tempText);
            html = MathProcessor.restoreMathExpressions(html, mathExpressions);
            const { nested: listItems, flat: flatListItems } = ListItemParser.parseAll(markdownText);
            const fullPageHtml = RenderedPageBuilder.build(
                html,
                markdownText,
                "Rendered Markdown & LaTeX",
                listItems,
                flatListItems,
                { isPreview: false }
            );
            this.openInNewTab(fullPageHtml);
        } catch (error) {
            const message = error.message?.includes('marked') 
                ? "The Markdown library failed to load properly. Please refresh the page and ensure you have an internet connection."
                : "An error occurred while opening in a new tab. Please try again later.";
            await CustomModal.alert(message);
        }
    }
    
    async renderWithFallback(markdownText) {
        if (!this.fallbackWarningLogged) {
            await CustomModal.alert("The Markdown library failed to load due to network restrictions. Using basic fallback renderer with limited features. For full functionality, please refresh the page with a stable internet connection.");
            this.fallbackWarningLogged = true;
        }
        
        const basicHtml = FallbackRenderer.renderToHtml(markdownText);
        const { nested: listItems, flat: flatListItems } = ListItemParser.parseAll(markdownText);
        const fullPageHtml = RenderedPageBuilder.build(
            basicHtml,
            markdownText,
            "Rendered Markdown & LaTeX (Basic Mode)",
            listItems,
            flatListItems,
            { isPreview: true }
        );
        this.showPreview(fullPageHtml, markdownText);
    }
    
    async openInNewTab(htmlContent) {
        try {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            
            const newTab = window.open(blobUrl, '_blank');
            if (newTab) {
                newTab.focus();
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            } else {
                URL.revokeObjectURL(blobUrl);
                await CustomModal.alert("Failed to open new tab. Please check your pop-up blocker settings.");
            }
        } catch (error) {
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