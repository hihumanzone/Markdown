class AccessibilityController {
    /** @param {AppDOM} dom */
    constructor(dom) {
        this.dom = dom;
        this.shortcutMap = {
            l: () => {
                this.dom.markdownInput?.focus();
                this.announce('Focused markdown editor');
            }
        };
    }

    init() {
        this.bindKeyboardShortcuts();
        this.bindInputMetadata();
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            if (!(event.ctrlKey || event.metaKey)) return;
            if (event.altKey || event.shiftKey) return;

            const key = event.key.toLowerCase();
            const action = this.shortcutMap[key];
            if (!action) return;

            event.preventDefault();
            action();
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
            if (this.dom.statusLiveRegion) {
                this.dom.statusLiveRegion.textContent = message;
            }
        });
    }
}
