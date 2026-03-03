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
    /** @returns {AppDOM} */
    static collect() {
        return {
            markdownInput: document.getElementById('markdownInput'),
            renderButton: document.getElementById('renderMarkdownBtn'),
            pasteAndRenderButton: document.getElementById('pasteAndRenderBtn'),
            clearButton: document.getElementById('clearBtn'),
            importBtn: document.getElementById('importBtn'),
            importFileInput: document.getElementById('importFileInput'),
            savedSectionsList: document.getElementById('savedSectionsList'),
            historyList: document.getElementById('historyList'),
            statusLiveRegion: document.getElementById('statusLiveRegion')
        };
    }
}
