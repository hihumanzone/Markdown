/**
 * @typedef {Object} AppDOM
 * @property {HTMLTextAreaElement | null} markdownInput
 * @property {HTMLButtonElement | null} renderButton
 * @property {HTMLButtonElement | null} pasteAndRenderButton
 * @property {HTMLButtonElement | null} clearButton
 * @property {HTMLButtonElement | null} importBtn
 * @property {HTMLInputElement | null} importFileInput
 * @property {HTMLElement | null} savedSectionsList
 * @property {HTMLElement | null} historyList
 * @property {HTMLElement | null} statusLiveRegion
 */

class UIDomRegistry {
    /** @param {string} id @returns {HTMLElement | null} */
    static byId(id) {
        return document.getElementById(id);
    }

    /** @param {string} id @returns {HTMLElement | null} */
    static optional(id) {
        return this.byId(id);
    }

    /** @param {string} id @returns {HTMLElement | null} */
    static required(id) {
        const element = this.byId(id);
        if (!element) {
            console.warn(`[UIDomRegistry] Missing required element: #${id}`);
        }
        return element;
    }

    /** @returns {AppDOM} */
    static collect() {
        return {
            markdownInput: /** @type {HTMLTextAreaElement | null} */ (this.required('markdownInput')),
            renderButton: /** @type {HTMLButtonElement | null} */ (this.required('renderMarkdownBtn')),
            pasteAndRenderButton: /** @type {HTMLButtonElement | null} */ (this.required('pasteAndRenderBtn')),
            clearButton: /** @type {HTMLButtonElement | null} */ (this.required('clearBtn')),
            importBtn: /** @type {HTMLButtonElement | null} */ (this.optional('importBtn')),
            importFileInput: /** @type {HTMLInputElement | null} */ (this.optional('importFileInput')),
            savedSectionsList: this.required('savedSectionsList'),
            historyList: this.required('historyList'),
            statusLiveRegion: this.optional('statusLiveRegion')
        };
    }
}
