/**
 * @typedef {{isRendering: boolean, renderMode: 'full'|'fallback'|null, inputLength: number}} UIState
 */
class UIStateStore {
    constructor() {
        /** @type {UIState} */
        this.state = { isRendering: false, renderMode: null, inputLength: 0 };
        this.listeners = new Set();
    }

    /** @param {(state: UIState) => void} listener */
    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.state);
        return () => this.listeners.delete(listener);
    }

    /** @param {Partial<UIState>} partial */
    setState(partial) {
        this.state = { ...this.state, ...partial };
        this.listeners.forEach((listener) => listener(this.state));
    }
}
