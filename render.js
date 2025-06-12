// render.js

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
  loadContent();
  setupControls();
  setupTheme();
  setupFont();
});

function loadContent() {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');
  const rawEl = document.getElementById('raw');

  // Get data key from URL parameters
  const params = new URLSearchParams(window.location.search);
  const dataKey = params.get('data');
  
  if (!dataKey) {
    loading.innerHTML = '<p style="color:red;">Error: No data key provided</p>';
    return;
  }

  // Retrieve data from sessionStorage
  const dataStr = sessionStorage.getItem(dataKey);
  if (!dataStr) {
    loading.innerHTML = '<p style="color:red;">Error: Content data not found or expired</p>';
    return;
  }

  try {
    const data = JSON.parse(dataStr);
    
    // Insert content
    content.innerHTML = data.html;
    rawEl.textContent = data.markdown;
    
    // Hide loading
    loading.style.display = 'none';
    
    // Clean up sessionStorage
    sessionStorage.removeItem(dataKey);
    
    // Render math after content is loaded
    setTimeout(renderMath, 100);
    
  } catch (e) {
    loading.innerHTML = '<p style="color:red;">Error loading content: ' + e.message + '</p>';
  }
}

function renderMath() {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '\\[', right: '\\]', display: true},
        {left: '$', right: '$', display: false, throwOnError: false},
        {left: '\\(', right: '\\)', display: false}
      ],
      throwOnError: false
    });
  } else {
    console.warn('KaTeX auto-render not available');
  }
}
