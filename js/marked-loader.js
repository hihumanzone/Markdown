class MarkedLoader {
    constructor() {
        this.fallbackWarningLogged = false;
        this.loadPromise = null;
    }

    async ensureAvailable() {
        if (typeof marked !== 'undefined') {
            return true;
        }
        if (!this.loadPromise) {
            this.loadPromise = this.injectScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
        }

        try {
            await this.loadPromise;
            return typeof marked !== 'undefined';
        } catch (error) {
            console.error('Unable to lazy load marked.js', error);
            return false;
        }
    }

    configure() {
        if (typeof marked === 'undefined') return false;

        marked.setOptions({
            gfm: true,
            breaks: true,
            smartypants: false
        });

        return true;
    }

    injectScript(src) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }
}
