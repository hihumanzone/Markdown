class AccessibilityController {
    /** @param {AppDOM} dom */
    constructor(dom) {
        this.dom = dom;
    }

    init() {
        this.bindKeyboardShortcuts();
        this.bindInputMetadata();
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            if (!(event.ctrlKey || event.metaKey)) return;
            if (event.altKey || event.shiftKey) return;

            if (event.key.toLowerCase() === 'l') {
                event.preventDefault();
                this.dom.markdownInput?.focus();
                this.announce('Focused markdown editor');
            }
        });
    }

    bindInputMetadata() {
        if (!this.dom.markdownInput) return;
        this.dom.markdownInput.setAttribute('aria-describedby', 'editorHelpText');
    }

    /** @param {string} message */
    announce(message) {
        if (!this.dom.statusLiveRegion) return;
        this.dom.statusLiveRegion.textContent = '';
        requestAnimationFrame(() => {
            this.dom.statusLiveRegion.textContent = message;
        });
    }
}
