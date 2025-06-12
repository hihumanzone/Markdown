// main.js
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/marked.esm.js';

const CDN = {
  gitMarkdownCss:   'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.8.1/github-markdown.min.css',
  katexCss:         'https://cdn.jsdelivr.net/npm/katex/dist/katex.min.css',
  katexJs:          'https://cdn.jsdelivr.net/npm/katex/dist/katex.min.js',
  katexAuto:        'https://cdn.jsdelivr.net/npm/katex/dist/contrib/auto-render.min.js',
  html2canvas:      'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
};

const FONT_CFG = {
  key: 'mdFontPct',
  basePx: 16,
  stepPct: 10,
  minPct: 50,
  maxPct: 300,
  defaultPct: 100
};

const THEME_KEY = 'mdTheme';

document.addEventListener('DOMContentLoaded', () => {
  const mdInput = document.getElementById('markdownInput');
  const pasteBtn = document.getElementById('pasteBtn');
  const renderBtn = document.getElementById('renderBtn');

  // Paste & render
  pasteBtn.addEventListener('click', async () => {
    if (!navigator.clipboard?.readText) {
      return alert('Clipboard API not supported');
    }
    try {
      mdInput.value = await navigator.clipboard.readText();
      renderBtn.click();
    } catch(e) {
      alert('Failed to read clipboard: ' + e);
    }
  });

  // Render
  renderBtn.addEventListener('click', () => {
    const markdown = mdInput.value;
    const html      = preprocessMath(markdown);
    openInNewTab(html, markdown);
  });
});


// 1) Pre-extract math to placeholders → marked() → restore math
function preprocessMath(source) {
  let index = 0;
  const mathSlots = [];

  function replace(re, type, open, close) {
    source = source.replace(re, (match, content) => {
      if (!content.trim()) return match;
      const key = `%%${type}_${index}%%`;
      mathSlots.push({ key, open, close, content });
      index++;
      return key;
    });
  }

  // display first, then inline
  replace(/\$\$([\s\S]+?)\$\$/g,     'D', '$$', '$$');
  replace(/\\\[([\s\S]+?)\\\]/g,     'D', '\\[', '\\]');
  replace(/\$([^\s].*?[^\s])\$/g,     'I', '$', '$');
  replace(/\\\(([\s\S]+?)\\\)/g,     'I', '\\(', '\\)');

  // render markdown
  let html = marked.parse(source);

  // restore math
  mathSlots.forEach(slot => {
    const re = new RegExp(slot.key, 'g');
    html = html.replace(re, `${slot.open}${slot.content}${slot.close}`);
  });

  return html;
}


// 2) Open new tab, inject CSS/JS, controls & rendered HTML
function openInNewTab(renderedHTML, rawMarkdown) {
  const win = window.open();
  if (!win) return alert('Pop-up blocked');

  const doc = win.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Rendered Markdown</title>
  <link rel="stylesheet" href="${CDN.gitMarkdownCss}">
  <link rel="stylesheet" href="${CDN.katexCss}">
  <script src="${CDN.html2canvas}"></script>
  <style>
    /* light/dark theme via variables */
    :root {
      --bg: #fff; --fg: #000; --link: #0366d6;
      --code-bg: #f6f8fa; --border: #e1e4e8;
    }
    .dark {
      --bg: #0d1117; --fg: #c9d1d9;
      --link: #58a6ff; --code-bg: #161b22; --border: #30363d;
    }
    body {
      margin: 0; padding: 3rem 2rem;
      background: var(--bg); color: var(--fg);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      transition: background .3s, color .3s;
    }
    a { color: var(--link); }
    pre, code { background: var(--code-bg); }
    hr, blockquote, th, td { border-color: var(--border); }
    .markdown-body {
      box-sizing: border-box; max-width: 960px;
      margin: auto; padding: 1rem;
    }
    /* control panel */
    #controls {
      position: fixed; top: 1rem; right: 1rem;
      background: rgba(255,255,255,.9); padding: .5rem;
      border-radius: 4px; display: flex; gap: .5rem;
      z-index:100;
    }
    .dark #controls { background: rgba(0,0,0,.7); color: #fff; }
    #controls button { padding: .3rem .6rem; cursor: pointer; }
    #controls span { min-width: 2.5rem; text-align: center; display: inline-block; }
  </style>
</head>
<body class="markdown-body">
  <div id="controls">
    <button data-action="toggle">⇳</button>
    <button data-action="decrease">A–</button>
    <span data-action="display">100%</span>
    <button data-action="increase">A+</button>
    <button data-action="reset">⟲</button>
    <button data-action="theme">🌙</button>
    <button data-action="save">💾</button>
    <button data-action="raw">Raw</button>
  </div>

  <div id="content">${renderedHTML}</div>
  <pre id="raw" style="display:none;white-space:pre-wrap;">${escapeHTML(rawMarkdown)}</pre>

  <script>
    // pass in config
    window.__CONFIG = {
      CDN: ${JSON.stringify(CDN)},
      FONT_CFG: ${JSON.stringify(FONT_CFG)},
      THEME_KEY: '${THEME_KEY}'
    };
  </script>
  <script src="${CDN.katexJs}"></script>
  <script src="${CDN.katexAuto}"></script>
  <script>
    (function(){
      const { CDN, FONT_CFG, THEME_KEY } = window.__CONFIG;
      const body   = document.body;
      const panel  = document.getElementById('controls');
      const content= document.getElementById('content');
      const rawEl  = document.getElementById('raw');
      const disp   = panel.querySelector('[data-action=display]');

      // --- Font Size ---
      let pct = +localStorage.getItem(FONT_CFG.key) || FONT_CFG.defaultPct;
      function applyFont() {
        body.style.fontSize = (FONT_CFG.basePx * pct/100)+'px';
        disp.textContent = pct+'%';
        localStorage.setItem(FONT_CFG.key, pct);
      }

      // --- Theme ---
      const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
      body.classList.toggle('dark', savedTheme==='dark');

      // --- Controls Handler ---
      panel.addEventListener('click', e=>{
        const act = e.target.dataset.action;
        if (!act) return;
        switch(act){
          case 'toggle':
            panel.classList.toggle('collapsed');
            break;
          case 'decrease':
            pct = Math.max(FONT_CFG.minPct, pct - FONT_CFG.stepPct);
            applyFont(); break;
          case 'increase':
            pct = Math.min(FONT_CFG.maxPct, pct + FONT_CFG.stepPct);
            applyFont(); break;
          case 'reset':
            pct = FONT_CFG.defaultPct; applyFont(); break;
          case 'theme':
            const isDark = !body.classList.toggle('dark');
            localStorage.setItem(THEME_KEY, isDark?'light':'dark');
            break;
          case 'save':
            panel.style.display='none';
            html2canvas(body).then(canvas=>{
              panel.style.display='';
              const link=document.createElement('a');
              link.href=canvas.toDataURL('image/png');
              link.download='md-render-'+Date.now()+'.png';
              link.click();
            });
            break;
          case 'raw':
            const showingRaw = rawEl.style.display!=='none';
            content.style.display = showingRaw?'':'none';
            rawEl.style.display  = showingRaw?'none':'block';
            e.target.textContent = showingRaw?'Raw':'HTML';
            break;
        }
      });

      // --- Math Rendering ---
      function renderMath(){
        if (typeof renderMathInElement==='function') {
          renderMathInElement(document.body, {
            delimiters: [
              {left:'$$',right:'$$',display:true},
              {left:'\\\\[',right:'\\\\]',display:true},
              {left:'$', right:'$', display:false, throwOnError:false},
              {left:'\\\\(',right:'\\\\)',display:false}
            ],
            throwOnError: false
          });
        }
      }

      document.addEventListener('DOMContentLoaded', ()=>{
        applyFont();
        renderMath();
      });
    })();
  </script>
</body>
</html>`);
  doc.close();
}


// Utility
function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);
}
