// main.js
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/marked.esm.js';

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
    const html = preprocessMath(markdown);
    openInNewTab(html, markdown);
  });
});

// Pre-extract math to placeholders → marked() → restore math
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

// Open new tab with render.html and pass data via sessionStorage
function openInNewTab(renderedHTML, rawMarkdown) {
  // Store data in sessionStorage with unique key
  const dataKey = 'mdRender_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  sessionStorage.setItem(dataKey, JSON.stringify({
    html: renderedHTML,
    markdown: rawMarkdown,
    timestamp: Date.now()
  }));

  // Open render.html with data key as parameter
  const win = window.open(`render.html?data=${dataKey}`, '_blank');
  if (!win) {
    // Clean up if popup was blocked
    sessionStorage.removeItem(dataKey);
    alert('Pop-up blocked. Please allow pop-ups for this site.');
  }
}
