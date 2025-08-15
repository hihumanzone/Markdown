class MarkdownRendererApp {
    constructor() {
        this.dom = {};
        this.savedSectionsManager = null;
        this.currentContentManager = new CurrentContentManager();
        this.fallbackWarningLogged = false;
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
                    console.error("Marked.js is not loaded - will use fallback renderer");
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
            
            marked.setOptions({
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
                        console.error("Failed to load Marked.js after multiple attempts - using fallback renderer");
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
    }
    
    initCurrentContentManager() {
        if (this.dom.markdownInput) {
            // Restore saved content if available
            this.currentContentManager.restoreContent(this.dom.markdownInput);
            
            // Set up auto-save for future changes
            this.currentContentManager.setupAutoSave(this.dom.markdownInput);
        }
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
                titleAutoGenerated: !extractedTitle || extractedTitle === 'Untitled'
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
            
            // Save the pasted content as current content for persistence
            this.currentContentManager.saveCurrentContent(text);
            
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
        
        // Clear the saved current content when user explicitly clears
        this.currentContentManager.clearCurrentContent();
    }
    
    async renderMarkdown(markdownText) {
        try {
            if (typeof marked === 'undefined') {
                if (!this.fallbackWarningLogged) {
                    console.error("Marked.js library is not loaded, using basic fallback");
                    await CustomModal.alert("The Markdown library failed to load due to network restrictions. Using basic fallback renderer with limited features. For full functionality, please refresh the page with a stable internet connection.");
                    this.fallbackWarningLogged = true;
                }
                
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
    
    basicMarkdownToHtml(markdown) {
        let html = markdown;
        
        // Escape HTML to prevent XSS
        html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Handle code blocks (must be done before other processing)
        html = html.replace(/```[\s\S]*?```/g, (match) => {
            const codeContent = match.replace(/```/g, '').trim();
            return `<pre><code>${codeContent}</code></pre>`;
        });
        
        // Handle headers (h1-h6)
        html = html.replace(/^#{6}\s+(.*$)/gim, '<h6>$1</h6>');
        html = html.replace(/^#{5}\s+(.*$)/gim, '<h5>$1</h5>');
        html = html.replace(/^#{4}\s+(.*$)/gim, '<h4>$1</h4>');
        html = html.replace(/^#{3}\s+(.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^#{2}\s+(.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^#{1}\s+(.*$)/gim, '<h1>$1</h1>');
        
        // Handle horizontal rules
        html = html.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '<hr>');
        
        // Handle text formatting (bold, italic, strikethrough)
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');
        html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
        
        // Handle inline code (after text formatting to avoid conflicts)
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Handle images (must come before links to avoid conflicts)
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">');
        
        // Handle links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Split into lines for better processing of block elements
        const lines = html.split('\n');
        const processedLines = [];
        let inBlockquote = false;
        let blockquoteContent = [];
        let inList = false;
        let listItems = [];
        let listType = null; // 'ul' or 'ol'
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Handle blockquotes
            if (trimmedLine.startsWith('&gt;')) {
                if (!inBlockquote) {
                    inBlockquote = true;
                    blockquoteContent = [];
                }
                blockquoteContent.push(trimmedLine.substring(4).trim());
                continue;
            } else if (inBlockquote) {
                processedLines.push(`<blockquote>${blockquoteContent.join('<br>')}</blockquote>`);
                inBlockquote = false;
                blockquoteContent = [];
            }
            
            // Handle lists
            const ulMatch = trimmedLine.match(/^[-*+]\s+(.*)$/);
            const olMatch = trimmedLine.match(/^\d+\.\s+(.*)$/);
            
            if (ulMatch || olMatch) {
                const currentListType = ulMatch ? 'ul' : 'ol';
                if (!inList || listType !== currentListType) {
                    if (inList) {
                        // Close previous list
                        processedLines.push(`<${listType}>${listItems.join('')}</${listType}>`);
                    }
                    inList = true;
                    listType = currentListType;
                    listItems = [];
                }
                const content = ulMatch ? ulMatch[1] : olMatch[1];
                listItems.push(`<li>${content}</li>`);
                continue;
            } else if (inList) {
                processedLines.push(`<${listType}>${listItems.join('')}</${listType}>`);
                inList = false;
                listItems = [];
                listType = null;
            }
            
            processedLines.push(line);
        }
        
        // Handle remaining open blocks
        if (inBlockquote) {
            processedLines.push(`<blockquote>${blockquoteContent.join('<br>')}</blockquote>`);
        }
        if (inList) {
            processedLines.push(`<${listType}>${listItems.join('')}</${listType}>`);
        }
        
        html = processedLines.join('\n');
        
        // Handle line breaks and paragraphs
        // Split by double newlines for paragraphs
        const paragraphs = html.split(/\n\s*\n/);
        const processedParagraphs = paragraphs.map(para => {
            para = para.trim();
            if (!para) return '';
            
            // Don't wrap certain block elements in paragraphs
            if (para.match(/^<(h[1-6]|hr|blockquote|ul|ol|li|pre|div)/)) {
                return para.replace(/\n/g, '<br>');
            }
            
            // Wrap other content in paragraphs
            return '<p>' + para.replace(/\n/g, '<br>') + '</p>';
        }).filter(para => para);
        
        return processedParagraphs.join('\n');
    }
    
    async openInNewTab(htmlContent) {
        try {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            
            const newTab = window.open(blobUrl, '_blank');
            if (newTab) {
                newTab.focus();
            } else {
                URL.revokeObjectURL(blobUrl);
                await CustomModal.alert("Failed to open new tab. Please check your pop-up blocker settings.");
            }
        } catch (error) {
            console.error("Error creating blob URL:", error);
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