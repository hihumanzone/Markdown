const CONFIG = {
    CDN: {
        githubMarkdownCSS: 'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.8.1/github-markdown.min.css',
        katexCSS: 'https://cdn.jsdelivr.net/npm/katex/dist/katex.min.css',
        katexJS: 'https://cdn.jsdelivr.net/npm/katex/dist/katex.min.js',
        katexAutoRenderJS: 'https://cdn.jsdelivr.net/npm/katex/dist/contrib/auto-render.min.js',
        html2canvas: 'https://cdn.jsdelivr.net/npm/html2canvas/dist/html2canvas.min.js',
    },
    MATH_PATTERNS: [
        { regex: /\$\$([\s\S]*?)\$\$/g, open: '$$', close: '$$' },
        { regex: /\\\[([\s\S]*?)\\\]/g, open: '\\[', close: '\\]' },
        { regex: /\$([^$\n]+?)\$/g, open: '$', close: '$' },
        { regex: /\\\((.+?)\\\)/g, open: '\\(', close: '\\)' },
    ],
    FONT_SIZE: {
        BASE: 16,
        STEP: 10,
        MIN: 50,
        MAX: 300,
        DEFAULT: 100
    },
    LONG_PRESS_DURATION: 500,
    LOCAL_STORAGE_KEYS: {
        THEME: 'renderedOutputTheme',
        FONT_SIZE: 'renderedOutputFontSizePercent',
        VIEW_MODE: 'renderedOutputViewMode',
        CONTROLS_COLLAPSED: 'fontControlsCollapsed'
    }
};