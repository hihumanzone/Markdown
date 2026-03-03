/**
 * @typedef {{isRendering: boolean, renderMode: 'full'|'fallback'|null, inputLength: number, lastError: string|null}} UIState
 */
class UIStateStore {
    constructor() {
        /** @type {UIState} */
        this.state = {
            isRendering: false,
            renderMode: null,
            inputLength: 0,
            lastError: null
        };
        /** @type {Set<(state: UIState) => void>} */
        this.listeners = new Set();
    }

    /** @returns {UIState} */
    getState() {
        return this.state;
    }

    /** @param {(state: UIState) => void} listener */
    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.state);
        return () => this.listeners.delete(listener);
    }

    /** @param {Partial<UIState>} partial */
    setState(partial) {
        const next = { ...this.state, ...partial };
        const changed = Object.keys(next).some((key) => next[key] !== this.state[key]);
        if (!changed) return;
        this.state = next;
        this.listeners.forEach((listener) => listener(this.state));
    }
}
