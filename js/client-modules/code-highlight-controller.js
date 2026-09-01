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
        }
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
