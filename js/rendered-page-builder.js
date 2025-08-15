class RenderedPageBuilder {
    static build(content, rawMarkdown, title, listItems) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="${CONFIG.CDN.katexCSS}">
    ${this.getStyles()}
</head>
<body class="markdown-body">
    ${this.getControls()}
    <div id="content-container">${content}</div>
    <div id="raw-container" style="display: none;">
        <pre id="raw-markdown">${Utils.escapeHtml(rawMarkdown)}</pre>
    </div>
    <div id="copy-notification">Copied to clipboard!</div>
    <script>
        window.__APP_DATA__ = {
            rawMarkdown: ${JSON.stringify(rawMarkdown)},
            listItems: ${JSON.stringify(listItems)},
            config: ${JSON.stringify(CONFIG)}
        };
    <\/script>
    <script defer src="${CONFIG.CDN.katexJS}"><\/script>
    <script defer src="${CONFIG.CDN.katexAutoRenderJS}"><\/script>
    <script defer src="${CONFIG.CDN.html2canvas}"><\/script>
    ${this.getClientScriptIncludes()}
</body>
</html>`;
    }
    
    static getStyles() {
        return `<style>
            body.markdown-body {
                box-sizing: border-box;
                min-width: 200px;
                max-width: 980px;
                margin: 0 auto;
                padding: 45px;
                padding-top: 70px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
                line-height: 1.6;
                transition: background-color 0.3s ease, color 0.3s ease;
                overscroll-behavior-y: contain;
            }
            @media (max-width: 767px) {
                body.markdown-body {
                    padding: 20px;
                    padding-top: 60px;
                }
            }
            body.markdown-body {
                background-color: #ffffff;
                color: #24292e;
            }
            body.markdown-body a {
                color: #0366d6;
                text-decoration: none;
            }
            body.markdown-body a:hover {
                text-decoration: underline;
            }
            body.markdown-body a:visited {
                color: #0366d6;
            }
            body.markdown-body hr {
                background-color: #e1e4e8;
                border: 0;
                height: 0.25em;
                margin: 24px 0;
                padding: 0;
            }
            body.markdown-body blockquote {
                border-left: 0.25em solid #dfe2e5;
                color: #6a737d;
                padding: 0 1em;
                margin-left: 0;
                margin-right: 0;
            }
            body.markdown-body table {
                border-collapse: collapse;
                margin: 16px 0;
                display: block;
                width: max-content;
                max-width: 100%;
                overflow: auto;
            }
            body.markdown-body th,
            body.markdown-body td {
                border: 1px solid #dfe2e5;
                padding: 6px 13px;
            }
            body.markdown-body th {
                background-color: #f6f8fa;
                font-weight: 600;
            }
            body.markdown-body tr:nth-child(2n) {
                background-color: #f6f8fa;
            }
            body.markdown-body code:not([class*="language-"]) {
                background-color: rgba(27,31,35,0.05);
                border-radius: 3px;
                font-size: 85%;
                margin: 0;
                padding: 0.2em 0.4em;
                font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
            }
            body.markdown-body pre {
                background-color: #f6f8fa;
                border-radius: 6px;
                font-size: 85%;
                line-height: 1.45;
                overflow: auto;
                padding: 16px;
                margin: 16px 0;
            }
            body.markdown-body pre code {
                background-color: transparent;
                border: 0;
                display: inline;
                font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
                line-height: inherit;
                margin: 0;
                overflow: visible;
                padding: 0;
                word-wrap: normal;
                font-size: 100%;
            }
            body.markdown-body h1,
            body.markdown-body h2,
            body.markdown-body h3,
            body.markdown-body h4,
            body.markdown-body h5,
            body.markdown-body h6 {
                color: #24292e;
                font-weight: 600;
                line-height: 1.25;
                margin-bottom: 16px;
                margin-top: 24px;
            }
            body.markdown-body h1 { font-size: 2em; }
            body.markdown-body h2 { font-size: 1.5em; }
            body.markdown-body h3 { font-size: 1.25em; }
            body.markdown-body h4 { font-size: 1em; }
            body.markdown-body h5 { font-size: 0.875em; }
            body.markdown-body h6 { font-size: 0.85em; color: #6a737d; }
            body.markdown-body h1,
            body.markdown-body h2 {
                border-bottom: 1px solid #eaecef;
                padding-bottom: 0.3em;
            }
            body.markdown-body strong {
                font-weight: 600;
            }
            body.markdown-body em {
                font-style: italic;
            }
            body.markdown-body ul,
            body.markdown-body ol {
                padding-left: 2em;
                margin-top: 0;
                margin-bottom: 16px;
            }
            body.markdown-body li {
                margin-bottom: 0.25em;
            }
            body.markdown-body li > p {
                margin-top: 0;
                margin-bottom: 0;
            }
            body.markdown-body li + li {
                margin-top: 0.25em;
            }
            body.markdown-body img {
                max-width: 100%;
                box-sizing: content-box;
                background-color: #ffffff;
            }
            body.markdown-body.dark-theme {
                background-color: #0d1117;
                color: #c9d1d9;
            }
            body.markdown-body.dark-theme a {
                color: #58a6ff;
            }
            body.markdown-body.dark-theme a:visited {
                color: #58a6ff;
            }
            body.markdown-body.dark-theme hr {
                background-color: #30363d;
            }
            body.markdown-body.dark-theme blockquote {
                color: #8b949e;
                border-left-color: #30363d;
            }
            body.markdown-body.dark-theme th,
            body.markdown-body.dark-theme td {
                border-color: #30363d;
            }
            body.markdown-body.dark-theme th {
                background-color: #161b22;
            }
            body.markdown-body.dark-theme tr:nth-child(2n) {
                background-color: #161b22;
            }
            body.markdown-body.dark-theme code:not([class*="language-"]) {
                background-color: rgba(110,118,129,0.4);
            }
            body.markdown-body.dark-theme pre {
                background-color: #161b22;
            }
            body.markdown-body.dark-theme h1,
            body.markdown-body.dark-theme h2,
            body.markdown-body.dark-theme h3,
            body.markdown-body.dark-theme h4,
            body.markdown-body.dark-theme h5,
            body.markdown-body.dark-theme h6 {
                color: #c9d1d9;
            }
            body.markdown-body.dark-theme h6 { color: #8b949e; }
            body.markdown-body.dark-theme h1,
            body.markdown-body.dark-theme h2 {
                border-bottom-color: #21262d;
            }
            body.markdown-body.dark-theme img {
                background-color: #0d1117;
            }
            body.markdown-body.dark-theme #raw-markdown {
                background-color: #161b22 !important;
                color: #c9d1d9 !important;
                border-color: #30363d !important;
            }
            body.markdown-body.dark-theme .katex {
                color: #c9d1d9;
            }
            body.markdown-body.high-contrast-theme{
                background:#000!important;
                color:#fff!important;
            }
            body.markdown-body.high-contrast-theme a{color:#08f}
            body.markdown-body.high-contrast-theme hr{background:#444}
            body.markdown-body.high-contrast-theme blockquote{
                color:#ccc;border-left-color:#444
            }
            body.markdown-body.high-contrast-theme th,
            body.markdown-body.high-contrast-theme td{border-color:#444}
            body.markdown-body.high-contrast-theme th{background:#111}
            body.markdown-body.high-contrast-theme tr:nth-child(2n){background:#111}
            body.markdown-body.high-contrast-theme code:not([class*="language-"]){
                background:#222;color:#fff
            }
            body.markdown-body.high-contrast-theme pre{background:#111}
            body.markdown-body.high-contrast-theme h1,
            body.markdown-body.high-contrast-theme h2,
            body.markdown-body.high-contrast-theme h3,
            body.markdown-body.high-contrast-theme h4,
            body.markdown-body.high-contrast-theme h5,
            body.markdown-body.high-contrast-theme h6{color:#fff}
            body.markdown-body.high-contrast-theme h6{color:#bbb}
            body.markdown-body.high-contrast-theme h1,
            body.markdown-body.high-contrast-theme h2{border-bottom-color:#444}
            body.markdown-body.high-contrast-theme img{background:#000}
            body.markdown-body.high-contrast-theme .katex{color:#fff}
            body.markdown-body.high-contrast-theme #raw-markdown{
                background:#000!important;color:#fff!important;border-color:#fff!important
            }
            body.markdown-body.high-contrast-theme .fc-panel{
                background:rgba(0,0,0,.92);box-shadow:0 2px 10px rgba(255,255,255,.35)
            }
            body.markdown-body.high-contrast-theme .fc-button{
                background:#111;color:#fff;border:1px solid #555
            }
            body.markdown-body.high-contrast-theme .fc-button:hover{
                background:#222;border-color:#777
            }
            body.markdown-body.high-contrast-theme .fc-display{color:#fff}
            body.markdown-body.high-contrast-theme #copy-notification{
                background:rgba(255,255,255,.9);color:#000
            }
            body.markdown-body.high-contrast-theme .list-item-highlight{
                background:rgba(8,136,255,.25)!important
            }
            .fc-panel {
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 8px;
                border-radius: 6px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 6px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                font-size: 13px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(5px);
                -webkit-backdrop-filter: blur(5px);
                transition: background-color 0.3s ease, box-shadow 0.3s ease;
                flex-wrap: wrap;
                justify-content: flex-end;
            }
            .fc-button {
                padding: 5px 10px;
                cursor: pointer;
                background-color: #f6f8fa;
                color: #24292e;
                border: 1px solid #d1d5da;
                border-radius: 4px;
                transition: background-color 0.2s ease, border-color 0.2s ease;
                font-size: 12px;
                line-height: 1.5;
            }
            .fc-button:hover:not(:disabled) {
                background-color: #eef1f4;
                border-color: #c0c5cb;
            }
            .fc-button:disabled {
                 opacity: 0.6;
                 cursor: not-allowed;
            }
            .fc-display {
                color: #24292e;
                padding: 0 8px;
                min-width: 45px;
                text-align: center;
                font-weight: 500;
                font-size: 12px;
            }
            body.markdown-body.dark-theme .fc-panel {
                background: rgba(22, 27, 34, 0.9);
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
            }
            body.markdown-body.dark-theme .fc-button {
                background-color: #21262d;
                color: #c9d1d9;
                border: 1px solid #30363d;
            }
            body.markdown-body.dark-theme .fc-button:hover:not(:disabled) {
                background-color: #30363d;
                border-color: #484f58;
            }
            body.markdown-body.dark-theme .fc-display {
                color: #c9d1d9;
            }
            .list-item-highlight {
                background-color: rgba(3, 102, 214, 0.1) !important;
                transition: background-color 0.2s ease !important;
                border-radius: 3px;
            }
            body.markdown-body.dark-theme .list-item-highlight {
                background-color: rgba(88, 166, 255, 0.15) !important;
            }
            #raw-markdown {
                white-space: pre-wrap;
                word-wrap: break-word;
                font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
                font-size: 0.875em;
                line-height: 1.5;
                padding: 20px;
                margin: 0;
                border: 1px solid #e1e4e8;
                border-radius: 6px;
                background-color: #f6f8fa;
                color: #24292e;
            }
            #copy-notification {
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(30, 30, 30, 0.9);
                color: white;
                padding: 12px 24px;
                border-radius: 6px;
                z-index: 2000;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            body.markdown-body.dark-theme #copy-notification {
                 background: rgba(200, 200, 200, 0.9);
                 color: #0d1117;
            }
            li[data-list-index] {
                cursor: pointer;
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                position: relative;
            }
            .katex-display {
                margin: 1em 0;
                overflow-x: auto;
                overflow-y: hidden;
            }
            .katex {
                font-size: 1.1em;
            }
            @media (max-width: 640px) {
                .fc-panel {
                    flex-direction: column;
                    align-items: stretch;
                    top: 5px;
                    right: 5px;
                    gap: 4px;
                    width: 130px;
                }
                .fc-button, .fc-display {
                    text-align: center;
                }
            }
            @media print {
                #font-controls,
                #copy-notification {
                    display: none !important;
                }
                body.markdown-body * {
                    color: #000 !important;
                    background-color: transparent !important;
                    box-shadow: none !important;
                    text-shadow: none !important;
                }
                body.markdown-body {
                    background: #fff !important;
                    padding: 20px !important;
                    margin: 0 !important;
                    max-width: 100% !important;
                }
                body.markdown-body table,
                body.markdown-body th,
                body.markdown-body td,
                body.markdown-body hr,
                body.markdown-body blockquote,
                body.markdown-body h1,
                body.markdown-body h2 {
                    border-color: #e1e4e8 !important;
                }
                body.markdown-body img {
                    background-color: #fff !important;
                }
                pre, blockquote, table, img, .katex-display {
                    page-break-inside: avoid;
                }
                a[href]:after {
                    content: none !important;
                }
            }
        </style>`;
    }
    
    static getControls() {
        return `
            <div id="font-controls" class="fc-panel">
                <button id="toggleCollapseBtn" title="Toggle font controls" class="fc-button">Toggle</button>
                <button id="decreaseFontBtn" title="Decrease font size (Ctrl/Cmd + -)" class="fc-button">-</button>
                <span id="currentFontSizeDisplay" class="fc-display">100%</span>
                <button id="increaseFontBtn" title="Increase font size (Ctrl/Cmd + +)" class="fc-button">+</button>
                <button id="resetFontBtn" title="Reset font size (Ctrl/Cmd + 0)" class="fc-button">Reset</button>
                <button id="toggleThemeBtn" title="Toggle theme (Ctrl/Cmd + T)" class="fc-button">Theme</button>
                <button id="toggleViewBtn" title="Toggle between rendered and raw markdown (Ctrl/Cmd + R)" class="fc-button">Raw</button>
                <button id="toggleFullscreenBtn" title="Toggle fullscreen mode (F11)" class="fc-button">Fullscreen</button>
                <button id="saveAsPdfBtn" title="Save / Print as PDF (Ctrl/Cmd + P)" class="fc-button">Save PDF</button>
                <button id="exportImageBtn" class="fc-button" title="Export rendered content as a high-quality PNG image">Export Image</button>
                <button id="exportMarkdownBtn" class="fc-button" title="Download original Markdown as .md file">Export MD</button>
            </div>
        `;
    }
    
    static getClientScriptIncludes() {
        const scripts = [
            this.getKatexRendererScript(),
            this.getThemeControllerScript(),
            this.getFontSizeControllerScript(),
            this.getCollapsibleControllerScript(),
            this.getViewToggleControllerScript(),
            this.getFullscreenControllerScript(),
            this.getSavePdfControllerScript(),
            this.getExportMarkdownControllerScript(),
            this.getExportImageControllerScript(),
            this.getListItemControllerScript(),
            this.getUIControllerScript(),
            this.getClientMainScript()
        ];
        
        return `<script>
            ${scripts.join('\n\n')}
        <\/script>`;
    }
    
    static getKatexRendererScript() {
        return `
class KatexRenderer {
    constructor() { 
        this.init(); 
    }
    
    init() {
        if (typeof renderMathInElement === 'function') { 
            this.render(); 
        } else { 
            const interval = setInterval(() => { 
                if (typeof renderMathInElement === 'function') { 
                    clearInterval(interval); 
                    this.render(); 
                }
            }, 100); 
        }
    }
    
    render() {
        try {
            renderMathInElement(document.getElementById('content-container'), {
                delimiters: [
                    {left: "$$", right: "$$", display: true}, 
                    {left: "\\\\[", right: "\\\\]", display: true},
                    {left: "$", right: "$", display: false, throwOnError: false}, 
                    {left: "\\\\(", right: "\\\\)", display: false}
                ],
                throwOnError: false,
            });
        } catch (e) { 
            console.error("KaTeX rendering error:", e); 
        }
    }
}`;
    }
    
    static getThemeControllerScript() {
        return `
class ThemeController {
    constructor(body) {
        this.body = body; 
        this.toggleBtn = document.getElementById('toggleThemeBtn');
        this.darkClass = 'dark-theme'; 
        this.highContrastClass = 'high-contrast-theme';
        this.lsKey = window.__APP_DATA__.config.LOCAL_STORAGE_KEYS.THEME; 
        this.init();
    }
    
    init() {
        if (!this.toggleBtn) return;
        this.toggleBtn.addEventListener('click', () => this.toggle());
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        this.applyTheme(localStorage.getItem(this.lsKey) || prefersDark);
        
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem(this.lsKey)) { 
                this.applyTheme(e.matches ? 'dark' : 'light'); 
            }
        });
    }
    
    applyTheme(theme) {
        this.body.classList.remove(this.darkClass, this.highContrastClass);
        if (theme === 'dark') { 
            this.body.classList.add(this.darkClass); 
            this.toggleBtn.textContent = 'High Contrast'; 
        } else if (theme === 'high-contrast') { 
            this.body.classList.add(this.highContrastClass); 
            this.toggleBtn.textContent = 'Light Theme'; 
        } else { 
            this.toggleBtn.textContent = 'Dark Theme'; 
        }
        localStorage.setItem(this.lsKey, theme);
    }
    
    toggle() {
        const classList = this.body.classList;
        const current = classList.contains(this.highContrastClass) ? 'high-contrast' : 
                       (classList.contains(this.darkClass) ? 'dark' : 'light');
        const next = current === 'light' ? 'dark' : 
                    (current === 'dark' ? 'high-contrast' : 'light');
        this.applyTheme(next);
    }
}`;
    }
    
    static getFontSizeControllerScript() {
        return `
class FontSizeController {
    constructor(body) {
        this.body = body; 
        this.increaseBtn = document.getElementById('increaseFontBtn');
        this.decreaseBtn = document.getElementById('decreaseFontBtn'); 
        this.resetBtn = document.getElementById('resetFontBtn');
        this.display = document.getElementById('currentFontSizeDisplay'); 
        this.lsKey = window.__APP_DATA__.config.LOCAL_STORAGE_KEYS.FONT_SIZE;
        this.config = window.__APP_DATA__.config.FONT_SIZE;
        this.currentPercent = parseInt(localStorage.getItem(this.lsKey) || this.config.DEFAULT, 10);
        this.init();
    }
    
    init() {
        if (!this.increaseBtn || !this.decreaseBtn || !this.resetBtn || !this.display) return;
        this.increaseBtn.addEventListener('click', () => this.adjust(this.config.STEP));
        this.decreaseBtn.addEventListener('click', () => this.adjust(-this.config.STEP));
        this.resetBtn.addEventListener('click', () => this.reset());
        this.applyFontSize(this.currentPercent);
    }
    
    adjust(step) { 
        this.applyFontSize(this.currentPercent + step); 
    }
    
    reset() { 
        this.applyFontSize(this.config.DEFAULT); 
    }
    
    applyFontSize(percent) {
        this.currentPercent = Math.max(this.config.MIN, Math.min(this.config.MAX, percent));
        this.body.style.fontSize = \`\${(this.config.BASE * this.currentPercent) / 100}px\`;
        this.display.textContent = \`\${this.currentPercent}%\`;
        localStorage.setItem(this.lsKey, this.currentPercent);
    }
}`;
    }
    
    static getCollapsibleControllerScript() {
        return `
class CollapsibleController {
    constructor() {
        this.toggleButton = document.getElementById('toggleCollapseBtn');
        this.controlsToToggle = Array.from(document.querySelectorAll('#font-controls > *:not(#toggleCollapseBtn)'));
        this.lsKey = window.__APP_DATA__.config.LOCAL_STORAGE_KEYS.CONTROLS_COLLAPSED; 
        this.init();
    }
    
    init() {
        if (!this.toggleButton) return;
        this.toggleButton.addEventListener('click', () => this.toggle());
        this.applyState(JSON.parse(localStorage.getItem(this.lsKey) || 'false'));
    }
    
    toggle() {
        const current = this.controlsToToggle[0].style.display === 'none';
        this.applyState(!current);
    }
    
    applyState(collapsed) {
        this.controlsToToggle.forEach(control => { 
            control.style.display = collapsed ? 'none' : ''; 
        });
        this.toggleButton.textContent = collapsed ? 'Expand' : 'Collapse';
        this.toggleButton.title = collapsed ? 'Expand Controls' : 'Collapse Controls';
        localStorage.setItem(this.lsKey, JSON.stringify(collapsed));
    }
}`;
    }
    
    static getViewToggleControllerScript() {
        return `
class ViewToggleController {
    constructor() {
        this.toggleBtn = document.getElementById('toggleViewBtn');
        this.contentContainer = document.getElementById('content-container');
        this.rawContainer = document.getElementById('raw-container');
        this.lsKey = window.__APP_DATA__.config.LOCAL_STORAGE_KEYS.VIEW_MODE; 
        this.init();
    }
    
    init() {
        if (!this.toggleBtn || !this.contentContainer || !this.rawContainer) return;
        this.toggleBtn.addEventListener('click', () => this.toggle());
        this.applyViewMode(localStorage.getItem(this.lsKey) || 'rendered');
    }
    
    toggle() {
        const current = this.contentContainer.style.display !== 'none' ? 'rendered' : 'raw';
        this.applyViewMode(current === 'rendered' ? 'raw' : 'rendered');
    }
    
    applyViewMode(mode) {
        if (mode === 'raw') {
            this.contentContainer.style.display = 'none'; 
            this.rawContainer.style.display = 'block';
            this.toggleBtn.textContent = 'Rendered'; 
            this.toggleBtn.title = 'Show Rendered View';
        } else {
            this.contentContainer.style.display = 'block'; 
            this.rawContainer.style.display = 'none';
            this.toggleBtn.textContent = 'Raw'; 
            this.toggleBtn.title = 'Show Raw Markdown';
        }
        localStorage.setItem(this.lsKey, mode);
    }
}`;
    }
    
    static getFullscreenControllerScript() {
        return `
class FullscreenController {
    constructor() {
        this.toggleBtn = document.getElementById('toggleFullscreenBtn');
        this.lsKey = window.__APP_DATA__.config.LOCAL_STORAGE_KEYS.FULLSCREEN || 'renderedOutputFullscreen';
        this.init();
    }
    
    init() {
        if (!this.toggleBtn) return;
        this.toggleBtn.addEventListener('click', () => this.toggle());
        
        document.addEventListener('fullscreenchange', () => this.updateButtonText());
        document.addEventListener('webkitfullscreenchange', () => this.updateButtonText());
        document.addEventListener('mozfullscreenchange', () => this.updateButtonText());
        document.addEventListener('msfullscreenchange', () => this.updateButtonText());
        
        this.updateButtonText();
    }
    
    toggle() {
        if (this.isFullscreen()) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }
    
    isFullscreen() {
        return !!(document.fullscreenElement || 
                 document.webkitFullscreenElement || 
                 document.mozFullScreenElement || 
                 document.msFullscreenElement);
    }
    
    enterFullscreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    }
    
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
    
    updateButtonText() {
        if (this.isFullscreen()) {
            this.toggleBtn.textContent = 'Exit Fullscreen';
            this.toggleBtn.title = 'Exit fullscreen mode (F11)';
        } else {
            this.toggleBtn.textContent = 'Fullscreen';
            this.toggleBtn.title = 'Enter fullscreen mode (F11)';
        }
    }
}`;
    }
    
    static getSavePdfControllerScript() {
        return `
class SavePdfController {
     constructor() {
        this.btn = document.getElementById('saveAsPdfBtn');
        this.controlsPanel = document.getElementById('font-controls');
        this.rawContainer = document.getElementById('raw-container'); 
        this.init();
    }
    
    init() { 
        if (this.btn) { 
            this.btn.addEventListener('click', () => this.saveAsPdf()); 
        } 
    }
    
    saveAsPdf() {
        if (this.rawContainer && this.rawContainer.style.display !== 'none') {
            alert('Switch to the rendered view before exporting to PDF.'); 
            return;
        }
        this.controlsPanel.style.display = 'none';
        setTimeout(() => { 
            window.print(); 
            setTimeout(() => { 
                this.controlsPanel.style.display = ''; 
            }, 150); 
        }, 30);
    }
}`;
    }
    
    static getExportMarkdownControllerScript() {
        return `
class ExportMarkdownController {
    constructor() { 
        this.btn = document.getElementById('exportMarkdownBtn'); 
        this.init(); 
    }
    
    init() { 
        if (this.btn) {
            this.btn.addEventListener('click', () => this.exportMarkdown()); 
        }
    }
    
    exportMarkdown() {
        const rawMarkdown = window.__APP_DATA__.rawMarkdown;
        const blob = new Blob([rawMarkdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -4);
        link.href = url; 
        link.download = \`markdown-export-\${timestamp}.md\`;
        document.body.appendChild(link); 
        link.click();
        document.body.removeChild(link); 
        URL.revokeObjectURL(url);
    }
}`;
    }
    
    static getExportImageControllerScript() {
        return `
class ExportImageController {
    constructor() {
        this.btn = document.getElementById('exportImageBtn');
        this.controlsPanel = document.getElementById('font-controls');
        this.notificationElement = document.getElementById('copy-notification');
        this.rawContainer = document.getElementById('raw-container');
        this.cachedKatexCSS = null;
        this.init();
    }
    
    init() {
        if (this.btn) {
            this.btn.addEventListener('click', () => this.exportAsImage());
        }
    }
    
    async fetchKatexCSS() {
        if (this.cachedKatexCSS) {
            return this.cachedKatexCSS;
        }
        try {
            const cssUrl = window.__APP_DATA__.config.CDN.katexCSS;
            const response = await fetch(cssUrl);
            if (!response.ok) {
                throw new Error(\`Failed to fetch CSS: \${response.statusText}\`);
            }
            const cssText = await response.text();
            this.cachedKatexCSS = cssText;
            return cssText;
        } catch (error) {
            console.error('Could not fetch KaTeX CSS for image export:', error);
            return '';
        }
    }
    
    async exportAsImage() {
        if (typeof html2canvas === 'undefined') {
            alert('Image export library (html2canvas) is not loaded yet. Please try again in a moment.');
            return;
        }
        if (this.rawContainer?.style.display !== 'none') {
            alert('Switch to the rendered view before exporting as an image.');
            return;
        }

        const originalBtnText = this.btn.textContent;
        const originalControlsDisplay = this.controlsPanel.style.display;
        const originalScrollX = window.scrollX;
        const originalScrollY = window.scrollY;

        this.btn.textContent = 'Generating...';
        this.btn.disabled = true;
        this.controlsPanel.style.display = 'none';
        if (this.notificationElement) this.notificationElement.style.display = 'none';

        window.scrollTo(0, 0);

        try {
            await new Promise(resolve => requestAnimationFrame(resolve));

            const katexCSSText = await this.fetchKatexCSS();
            const canvas = await html2canvas(document.body, {
                scale: 2,
                useCORS: true,
                backgroundColor: window.getComputedStyle(document.body).backgroundColor,
                logging: false,
                windowWidth: document.documentElement.scrollWidth,
                windowHeight: document.documentElement.scrollHeight,
                onclone: (clonedDoc) => {
                    if (katexCSSText) {
                        const style = clonedDoc.createElement('style');
                        style.innerHTML = katexCSSText;
                        clonedDoc.head.appendChild(style);
                    }
                },
            });

            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -4);
            link.download = \`markdown-export-\${timestamp}.png\`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting image:', error);
            alert('An error occurred while exporting the image. See console for details.');
        } finally {
            this.controlsPanel.style.display = originalControlsDisplay;
            this.btn.textContent = originalBtnText;
            this.btn.disabled = false;
            window.scrollTo(originalScrollX, originalScrollY);
        }
    }
}`;
    }
    
    static getListItemControllerScript() {
        return `
class ListItemController {
    constructor() {
        this.contentContainer = document.getElementById('content-container');
        this.notificationElement = document.getElementById('copy-notification');
        this.longPressTimer = null;
        this.longPressElement = null;
        this.touchStartX = 0;
        this.touchStartY = 0;

        this.boundHandleMove = this.handleMove.bind(this);
        this.boundHandleEnd = this.handleEnd.bind(this);

        this.init();
    }

    init() {
        if (!this.contentContainer || !this.notificationElement) return;
        const setup = () => {
            if (this.setupTimeout) clearTimeout(this.setupTimeout);
            this.setupTimeout = setTimeout(() => this.attachInitialListeners(), 300);
        };
        setTimeout(setup, 500);
        const observer = new MutationObserver(setup);
        observer.observe(this.contentContainer, { childList: true, subtree: true });
    }

    attachInitialListeners() {
        if (!window.__APP_DATA__.config.ENABLE_LIST_LONG_PRESS_COPY) {
            return;
        }
        
        const listItems = this.contentContainer.querySelectorAll('li');
        listItems.forEach((li, index) => {
            if (li.dataset.listCopyInitialized === 'true') return;
            li.dataset.listIndex = index;
            li.dataset.listCopyInitialized = 'true';
            
            li.addEventListener('mousedown', (e) => { if (e.button === 0) this.handleStart(li, e); });
            li.addEventListener('touchstart', (e) => this.handleStart(li, e), { passive: true });
        });
    }

    handleStart(element, event) {
        this.handleEnd();

        this.longPressElement = element;

        if (event.type === 'touchstart' && event.touches.length > 0) {
            this.touchStartX = event.touches[0].clientX;
            this.touchStartY = event.touches[0].clientY;

            element.addEventListener('touchmove', this.boundHandleMove, { passive: true });
            element.addEventListener('touchend', this.boundHandleEnd);
            element.addEventListener('touchcancel', this.boundHandleEnd);
        } else if (event.type === 'mousedown') {
            element.addEventListener('mouseup', this.boundHandleEnd);
            element.addEventListener('mouseleave', this.boundHandleEnd);
        }

        element.classList.add('list-item-highlight');
        
        this.longPressTimer = setTimeout(async () => {
            if (this.longPressElement === element) {
                await this.copyListContent(element);
            }
        }, window.__APP_DATA__.config.LONG_PRESS_DURATION);
    }

    handleMove(event) {
        if (!this.longPressTimer) return;

        if (event.touches.length > 0) {
            const touch = event.touches[0];
            const deltaX = Math.abs(touch.clientX - this.touchStartX);
            const deltaY = Math.abs(touch.clientY - this.touchStartY);
        
            if (deltaX > 10 || deltaY > 10) {
                this.handleEnd();
            }
        }
    }

    handleEnd() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        if (this.longPressElement) {
            this.longPressElement.classList.remove('list-item-highlight');
            
            this.longPressElement.removeEventListener('touchmove', this.boundHandleMove);
            this.longPressElement.removeEventListener('touchend', this.boundHandleEnd);
            this.longPressElement.removeEventListener('touchcancel', this.boundHandleEnd);
            this.longPressElement.removeEventListener('mouseup', this.boundHandleEnd);
            this.longPressElement.removeEventListener('mouseleave', this.boundHandleEnd);
            
            this.longPressElement = null;
        }
    }

    async copyListContent(element) {
        try {
            const listIndex = parseInt(element.dataset.listIndex, 10);
            const listData = window.__APP_DATA__.listItems;
            const isValidIndex = !isNaN(listIndex) && listData && listIndex < listData.length && listData[listIndex];
            
            if (!isValidIndex) {
                await this.copyElementText(element);
                return;
            }
            
            const textToCopy = listData[listIndex].content;
            await this._copyToClipboard(textToCopy);
            this.showNotification('List content copied!');
        } catch (err) {
            console.error('Failed to copy list item:', err);
            this.showNotification('Failed to copy. See console.', true);
        }
    }

    async copyElementText(element) {
        const textContent = (element.innerText || element.textContent || "").trim();
        if (textContent) {
            await this._copyToClipboard(textContent);
            this.showNotification('List item text copied!');
        } else {
            throw new Error('List item content is empty.');
        }
    }

    async _copyToClipboard(text) {
        if (navigator.clipboard?.writeText) { 
            return navigator.clipboard.writeText(text); 
        }
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed'; 
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select(); 
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }

    showNotification(message, isError = false) {
        if (!this.notificationElement) return;
        this.notificationElement.textContent = message;
        this.notificationElement.style.backgroundColor = isError ? 'rgba(200, 0, 0, 0.9)' : 'rgba(30, 30, 30, 0.9)';
        this.notificationElement.style.color = 'white';
        if (document.body.classList.contains('dark-theme') || document.body.classList.contains('high-contrast-theme')) {
            this.notificationElement.style.backgroundColor = isError ? 'rgba(255, 80, 80, 0.9)' : 'rgba(200, 200, 200, 0.9)';
            this.notificationElement.style.color = '#0d1117';
        }
        this.notificationElement.style.display = 'block';
        setTimeout(() => { 
            this.notificationElement.style.display = 'none'; 
        }, isError ? 3500 : 2000);
    }
}`;
    }
    
    static getUIControllerScript() {
        return `
class UIController {
    constructor() {
        this.body = document.querySelector('body.markdown-body');
        this.initializeControls();
        this.addGlobalKeydownListener();
    }
    
    initializeControls() {
        this.katexRenderer = new KatexRenderer();
        this.themeController = new ThemeController(this.body);
        this.fontSizeController = new FontSizeController(this.body);
        this.collapsibleController = new CollapsibleController();
        this.viewToggleController = new ViewToggleController();
        this.fullscreenController = new FullscreenController();
        this.listItemController = new ListItemController();
        this.savePdfController = new SavePdfController();
        this.exportMarkdownController = new ExportMarkdownController();
        this.exportImageController = new ExportImageController();
    }
    
    addGlobalKeydownListener() {
        const config = window.__APP_DATA__.config;
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '-': 
                        e.preventDefault(); 
                        this.fontSizeController.adjust(-config.FONT_SIZE.STEP); 
                        break;
                    case '=':
                    case '+': 
                        e.preventDefault(); 
                        this.fontSizeController.adjust(config.FONT_SIZE.STEP); 
                        break;
                    case '0': 
                        e.preventDefault(); 
                        this.fontSizeController.reset(); 
                        break;
                    case 't': 
                    case 'T': 
                        e.preventDefault(); 
                        this.themeController.toggle(); 
                        break;
                    case 'r': 
                    case 'R': 
                        e.preventDefault(); 
                        this.viewToggleController.toggle(); 
                        break;
                    case 'p': 
                    case 'P': 
                        e.preventDefault(); 
                        this.savePdfController.saveAsPdf(); 
                        break;
                }
            } else if (e.key === 'F11') {
                e.preventDefault(); 
                this.fullscreenController.toggle();
            }
        });
    }
}`;
    }
    
    static getClientMainScript() {
        return `
(function() {
    'use strict';
    
    function initializeUI() {
        window.markdownRendererUI = new UIController();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeUI);
    } else {
        initializeUI();
    }
})();`;
    }
}