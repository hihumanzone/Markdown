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
            historyList: document.getElementById('historyList'),
            statsWordCount: document.getElementById('statsWordCount'),
            statsCharCount: document.getElementById('statsCharCount'),
            sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
            workspaceSidebar: document.getElementById('workspaceSidebar'),
            helpShortcutsBtn: document.getElementById('helpShortcutsBtn')
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
            renderer.heading = function(token, level, raw) {
                let depth, rawText, innerHtml;
                if (typeof token === 'object' && token !== null && !Array.isArray(token)) {
                    depth = token.depth || 1;
                    rawText = token.text || '';
                    innerHtml = this.parser ? this.parser.parseInline(token.tokens) : rawText;
                } else {
                    depth = level || 1;
                    rawText = token || '';
                    innerHtml = rawText;
                }
                const slug = MathProcessor.generateSlug(rawText);
                return `<h${depth} id="${slug}">${innerHtml}</h${depth}>\n`;
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
        this.dom.markdownInput?.addEventListener('input', () => this.updateStats());
        this.updateStats();

        this.dom.importBtn?.addEventListener('click', () => this.dom.importFileInput.click());
        this.dom.sidebarToggleBtn?.addEventListener('click', () => this.toggleSidebar());
        this.dom.helpShortcutsBtn?.addEventListener('click', () => CustomModal.open('shortcutsModal'));

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

    updateStats() {
        const text = this.dom.markdownInput?.value || '';
        const charCount = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        if (this.dom.statsCharCount) {
            this.dom.statsCharCount.textContent = `${charCount} chars`;
        }
        if (this.dom.statsWordCount) {
            this.dom.statsWordCount.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
        }
    }

    toggleSidebar() {
        if (!this.dom.workspaceSidebar) return;
        this.dom.workspaceSidebar.classList.toggle('collapsed');
        const isCollapsed = this.dom.workspaceSidebar.classList.contains('collapsed');
        if (this.dom.sidebarToggleBtn) {
            this.dom.sidebarToggleBtn.classList.toggle('active', !isCollapsed);
            this.dom.sidebarToggleBtn.title = isCollapsed ? 'Show Library & History Panel' : 'Hide Library & History Panel';
            this.dom.sidebarToggleBtn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
        }
    }
    
    initCurrentContentManager() {
        if (this.dom.markdownInput) {
            this.currentContentManager.restoreContent(this.dom.markdownInput);
            this.currentContentManager.setupAutoSave(this.dom.markdownInput);
            this.updateStats();
        }
    }

    isPreviewOpen() {
        return this.dom.previewContainer && this.dom.previewContainer.classList.contains('active');
    }

    showPreview(htmlContent, rawMarkdown) {
        this.currentRenderedMarkdown = rawMarkdown || '';
        if (this.dom.previewContainer && this.dom.previewFrame) {
            // Compute textarea scroll ratio
            let textareaRatio = 0;
            if (this.dom.markdownInput) {
                const max = this.dom.markdownInput.scrollHeight - this.dom.markdownInput.clientHeight;
                if (max > 0) {
                    textareaRatio = this.dom.markdownInput.scrollTop / max;
                }
            }

            this.dom.previewFrame.srcdoc = htmlContent;
            this.dom.previewContainer.classList.add('active');
            this.dom.previewContainer.style.display = 'block';
            if (this.dom.mainContent) {
                this.dom.mainContent.style.display = 'none';
            }

            // Sync scroll into preview after loading
            this.dom.previewFrame.onload = () => {
                try {
                    const doc = this.dom.previewFrame.contentDocument || this.dom.previewFrame.contentWindow?.document;
                    const win = this.dom.previewFrame.contentWindow;
                    if (doc && win && textareaRatio > 0) {
                        const targetMax = Math.max(1, doc.documentElement.scrollHeight - win.innerHeight);
                        win.scrollTo({ top: Math.round(textareaRatio * targetMax), behavior: 'instant' });
                    }
                } catch (e) {}
            };

            this.dom.previewFrame.focus();
        }
    }

    closePreview() {
        let previewRatio = 0;
        try {
            const doc = this.dom.previewFrame?.contentDocument || this.dom.previewFrame?.contentWindow?.document;
            const win = this.dom.previewFrame?.contentWindow;
            if (doc && win) {
                const max = Math.max(1, doc.documentElement.scrollHeight - win.innerHeight);
                previewRatio = (win.scrollY || doc.documentElement.scrollTop || 0) / max;
            }
        } catch (e) {}

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

        if (this.dom.markdownInput && previewRatio > 0) {
            const textareaMax = this.dom.markdownInput.scrollHeight - this.dom.markdownInput.clientHeight;
            if (textareaMax > 0) {
                this.dom.markdownInput.scrollTop = Math.round(previewRatio * textareaMax);
            }
        }

        this.savedSectionsManager?.renderSavedSections();
        this.dom.markdownInput?.focus();
        this.updateStats();
    }

    getStandaloneRenderedHtml() {
        const rawMarkdown = this.currentRenderedMarkdown || this.dom.markdownInput?.value || '';
        if (!rawMarkdown.trim()) return '';
        
        try {
            const pageTitle = this.extractTitle(rawMarkdown) || "Rendered Markdown & LaTeX";
            if (typeof marked === 'undefined') {
                const basicHtml = FallbackRenderer.renderToHtml(rawMarkdown);
                const { nested: listItems, flat: flatListItems } = ListItemParser.parseAll(rawMarkdown);
                return RenderedPageBuilder.build(
                    basicHtml,
                    rawMarkdown,
                    pageTitle,
                    listItems,
                    flatListItems,
                    { isPreview: false }
                );
            }

            const { tempText, mathExpressions } = MathProcessor.preserveMathExpressions(rawMarkdown);
            let html = marked.parse(tempText);
            html = MathProcessor.restoreMathExpressions(html, mathExpressions);
            const { nested: listItems, flat: flatListItems } = ListItemParser.parseAll(rawMarkdown);
            return RenderedPageBuilder.build(
                html,
                rawMarkdown,
                pageTitle,
                listItems,
                flatListItems,
                { isPreview: false }
            );
        } catch (error) {
            console.error('Error generating standalone HTML:', error);
            return '';
        }
    }

    openInNewTabFromPreview() {
        const standaloneHtml = this.getStandaloneRenderedHtml();
        if (!standaloneHtml) return;
        this.openInNewTab(standaloneHtml);
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
        if (typeof Utils !== 'undefined' && Utils.extractDocumentTitle) {
            return Utils.extractDocumentTitle(content);
        }
        const lines = (content || '').split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('#')) {
                return trimmed.replace(/^#{1,6}\s+/, '').trim();
            }
            if (trimmed && trimmed.length < 100) {
                return trimmed;
            }
        }
        return 'Untitled';
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
            const pageTitle = this.extractTitle(markdownText) || "Rendered Markdown & LaTeX";
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
                pageTitle,
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
            const pageTitle = this.extractTitle(markdownText) || "Rendered Markdown & LaTeX";
            if (typeof marked === 'undefined') {
                const basicHtml = FallbackRenderer.renderToHtml(markdownText);
                const { nested: listItems, flat: flatListItems } = ListItemParser.parseAll(markdownText);
                const fullPageHtml = RenderedPageBuilder.build(
                    basicHtml,
                    markdownText,
                    pageTitle + " (Basic Mode)",
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
                pageTitle,
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
        
        const pageTitle = this.extractTitle(markdownText) || "Rendered Markdown & LaTeX";
        const basicHtml = FallbackRenderer.renderToHtml(markdownText);
        const { nested: listItems, flat: flatListItems } = ListItemParser.parseAll(markdownText);
        const fullPageHtml = RenderedPageBuilder.build(
            basicHtml,
            markdownText,
            pageTitle + " (Basic Mode)",
            listItems,
            flatListItems,
            { isPreview: true }
        );
        this.showPreview(fullPageHtml, markdownText);
    }
    
    async openInNewTab(htmlContent) {
        try {
            const newTab = window.open('', '_blank');
            if (newTab) {
                newTab.document.open();
                newTab.document.write(htmlContent);
                newTab.document.close();
                newTab.focus();
                return;
            }
        } catch (e) {
            console.error("Direct document.write open failed, trying blob URL fallback:", e);
        }

        try {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            const newTab = window.open(blobUrl, '_blank');
            if (newTab) {
                newTab.focus();
                setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
            } else {
                URL.revokeObjectURL(blobUrl);
                await CustomModal.alert("Failed to open new tab. Please check your pop-up blocker settings.");
            }
        } catch (error) {
            await CustomModal.alert("Failed to open new tab. Please check your pop-up blocker settings.");
        }
    }
}