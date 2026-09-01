class CodeHighlightController {
    constructor() {
        this.contentContainer = document.getElementById('content-container');
        this.init();
    }

    init() {
        this.prepareCodeBlocks();
        this.initPrism();
    }

    prepareCodeBlocks() {
        if (!this.contentContainer) return;
        const preElements = this.contentContainer.querySelectorAll('pre');
        for (let i = 0; i < preElements.length; i++) {
            const pre = preElements[i];
            if (!pre.classList.contains('line-numbers')) {
                pre.classList.add('line-numbers');
            }
            const code = pre.querySelector('code');
            if (code && !code.className) {
                code.className = 'language-none';
            }
            this.attachCopyButton(pre);
        }
    }

    attachCopyButton(pre) {
        if (pre.querySelector('.code-copy-btn')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'code-copy-btn';
        btn.setAttribute('aria-label', 'Copy code to clipboard');
        btn.title = 'Copy code';
        btn.innerHTML = '<span class="copy-btn-icon">📋</span> <span class="copy-btn-text">Copy</span>';

        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.copyCode(pre, btn);
        });

        pre.appendChild(btn);
    }

    async copyCode(pre, btn) {
        const code = pre.querySelector('code');
        if (!code) return;

        const clone = code.cloneNode(true);
        const toRemove = clone.querySelectorAll('.line-numbers-rows, .code-copy-btn, .line-numbers-sizer');
        for (let i = 0; i < toRemove.length; i++) {
            toRemove[i].remove();
        }

        const textToCopy = clone.textContent.replace(/\r\n/g, '\n').replace(/\n$/, '');

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(textToCopy);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = textToCopy;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }

            this.showCopyFeedback(btn, true);
        } catch (err) {
            console.error('Failed to copy code:', err);
            this.showCopyFeedback(btn, false);
        }
    }

    showCopyFeedback(btn, success) {
        const iconSpan = btn.querySelector('.copy-btn-icon');
        const textSpan = btn.querySelector('.copy-btn-text');
        const originalIcon = iconSpan ? iconSpan.textContent : '';
        const originalText = textSpan ? textSpan.textContent : btn.textContent;

        if (success) {
            btn.classList.add('copied');
            if (iconSpan) iconSpan.textContent = '✓';
            if (textSpan) textSpan.textContent = 'Copied!';
            this.showNotification('Code copied to clipboard!');
        } else {
            btn.classList.add('copy-error');
            if (iconSpan) iconSpan.textContent = '✕';
            if (textSpan) textSpan.textContent = 'Error';
            this.showNotification('Failed to copy code.', true);
        }

        setTimeout(() => {
            btn.classList.remove('copied', 'copy-error');
            if (iconSpan) iconSpan.textContent = originalIcon;
            if (textSpan) textSpan.textContent = originalText;
        }, 2000);
    }

    showNotification(message, isError = false) {
        const notificationElement = document.getElementById('copy-notification');
        if (!notificationElement) return;
        notificationElement.textContent = message;
        notificationElement.style.backgroundColor = isError ? 'rgba(200, 0, 0, 0.9)' : 'rgba(30, 30, 30, 0.9)';
        notificationElement.style.color = 'white';
        if (document.body.classList.contains('dark-theme') || document.body.classList.contains('high-contrast-theme')) {
            notificationElement.style.backgroundColor = isError ? 'rgba(255, 80, 80, 0.9)' : 'rgba(200, 200, 200, 0.9)';
            notificationElement.style.color = '#0d1117';
        }
        notificationElement.style.display = 'block';
        setTimeout(() => {
            notificationElement.style.display = 'none';
        }, isError ? 3000 : 2000);
    }

    initPrism() {
        if (typeof Prism !== 'undefined') {
            this.setupAndHighlight();
        } else {
            const prismScript = document.querySelector('script[src*="prism.min.js"]');
            if (prismScript) {
                const self = this;
                const onLoad = () => {
                    prismScript.removeEventListener('load', onLoad);
                    self.setupAndHighlight();
                };
                prismScript.addEventListener('load', onLoad);
                setTimeout(() => {
                    if (typeof Prism !== 'undefined') {
                        self.setupAndHighlight();
                    } else {
                        self.poll();
                    }
                }, 3000);
            } else {
                this.poll();
            }
        }
    }

    poll() {
        const self = this;
        let attempts = 0;
        const maxAttempts = 30;
        const interval = setInterval(() => {
            attempts++;
            if (typeof Prism !== 'undefined') {
                clearInterval(interval);
                self.setupAndHighlight();
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
            }
        }, 100);
    }

    setupAndHighlight() {
        try {
            if (typeof Prism === 'undefined') return;

            if (Prism.plugins && Prism.plugins.autoloader) {
                const cdnPath = window.__APP_DATA__?.config?.CDN?.prismAutoloaderPath || 'https://cdn.jsdelivr.net/npm/prismjs@1.30.0/components/';
                Prism.plugins.autoloader.languages_path = cdnPath;
            }

            this.prepareCodeBlocks();

            if (this.contentContainer && typeof Prism.highlightAllUnder === 'function') {
                Prism.highlightAllUnder(this.contentContainer);
            } else if (typeof Prism.highlightAll === 'function') {
                Prism.highlightAll();
            }
        } catch (e) {
            console.error('Syntax highlighting error:', e);
        }
    }
}
