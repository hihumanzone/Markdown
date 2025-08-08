class CodeBlockController {
    constructor() {
        this.init();
    }
    
    init() {
        this.attachEventListeners();
        this.initializeCodeBlocks();
    }
    
    attachEventListeners() {
        // Use event delegation for dynamically created code blocks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.code-action-btn')) {
                e.preventDefault();
                this.handleCodeAction(e.target);
            }
        });
    }
    
    initializeCodeBlocks() {
        // Set all code blocks to collapsed by default
        const codeBlocks = document.querySelectorAll('.code-block-container');
        codeBlocks.forEach(block => {
            const content = block.querySelector('.code-block-content');
            const toggleBtn = block.querySelector('.code-toggle-btn');
            
            if (content && toggleBtn) {
                content.classList.add('collapsed');
                toggleBtn.textContent = '+';
                toggleBtn.title = 'Expand code';
            }
        });
    }
    
    handleCodeAction(button) {
        const action = button.getAttribute('data-action');
        const codeBlock = button.closest('.code-block-container');
        
        switch (action) {
            case 'toggle':
                this.toggleCodeBlock(codeBlock);
                break;
            case 'copy':
                this.copyCodeBlock(codeBlock);
                break;
            case 'preview':
                this.togglePreview(codeBlock);
                break;
        }
    }
    
    toggleCodeBlock(codeBlock) {
        const content = codeBlock.querySelector('.code-block-content');
        const toggleBtn = codeBlock.querySelector('.code-toggle-btn');
        
        if (!content || !toggleBtn) return;
        
        const isCollapsed = content.classList.contains('collapsed');
        
        if (isCollapsed) {
            content.classList.remove('collapsed');
            toggleBtn.textContent = '−';
            toggleBtn.title = 'Collapse code';
        } else {
            content.classList.add('collapsed');
            toggleBtn.textContent = '+';
            toggleBtn.title = 'Expand code';
        }
    }
    
    async copyCodeBlock(codeBlock) {
        const codeElement = codeBlock.querySelector('.code-block-code');
        if (!codeElement) return;
        
        // Extract text content from code lines, excluding line numbers
        const lines = codeElement.querySelectorAll('.line-content');
        const codeText = Array.from(lines).map(line => line.textContent).join('\n');
        
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(codeText);
            } else {
                // Fallback for older browsers
                this.fallbackCopyText(codeText);
            }
            
            this.showCopyNotification('Code copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy code:', error);
            this.showCopyNotification('Failed to copy code', true);
        }
    }
    
    fallbackCopyText(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
    
    togglePreview(codeBlock) {
        const language = codeBlock.getAttribute('data-language');
        const previewDiv = codeBlock.querySelector('.code-block-preview');
        const previewBtn = codeBlock.querySelector('.code-preview-btn');
        const codeDiv = codeBlock.querySelector('.code-block-pre');
        
        if (!previewDiv || !previewBtn || !codeDiv) return;
        
        const isPreviewVisible = previewDiv.style.display !== 'none';
        
        if (isPreviewVisible) {
            // Switch back to code view
            previewDiv.style.display = 'none';
            codeDiv.style.display = 'block';
            previewBtn.textContent = 'Preview';
            previewBtn.title = `Preview ${this.getLanguageDisplayName(language)}`;
        } else {
            // Switch to preview
            this.renderPreview(codeBlock, language);
            previewDiv.style.display = 'block';
            codeDiv.style.display = 'none';
            previewBtn.textContent = 'Code';
            previewBtn.title = 'Show code';
        }
    }
    
    renderPreview(codeBlock, language) {
        const codeElement = codeBlock.querySelector('.code-block-code');
        const previewDiv = codeBlock.querySelector('.code-block-preview');
        
        if (!codeElement || !previewDiv) return;
        
        // Extract the raw code
        const lines = codeElement.querySelectorAll('.line-content');
        const code = Array.from(lines).map(line => line.textContent).join('\n');
        
        switch (language.toLowerCase()) {
            case 'html':
                this.renderHtmlPreview(previewDiv, code);
                break;
            case 'svg':
                this.renderSvgPreview(previewDiv, code);
                break;
            case 'mermaid':
                this.renderMermaidPreview(previewDiv, code);
                break;
            default:
                previewDiv.innerHTML = '<p>Preview not available for this language.</p>';
        }
    }
    
    renderHtmlPreview(previewDiv, code) {
        // Create an iframe for safe HTML rendering
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.minHeight = '200px';
        iframe.style.border = '1px solid #ddd';
        iframe.style.borderRadius = '4px';
        
        previewDiv.innerHTML = '';
        previewDiv.appendChild(iframe);
        
        // Write the HTML content to the iframe
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { margin: 16px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                </style>
            </head>
            <body>
                ${code}
            </body>
            </html>
        `);
        iframeDoc.close();
    }
    
    renderSvgPreview(previewDiv, code) {
        try {
            // Wrap SVG if it doesn't have the svg tag
            let svgCode = code.trim();
            if (!svgCode.startsWith('<svg')) {
                svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${svgCode}</svg>`;
            }
            
            previewDiv.innerHTML = `
                <div style="text-align: center; padding: 1rem; background: white; border-radius: 4px;">
                    ${svgCode}
                </div>
            `;
        } catch (error) {
            previewDiv.innerHTML = '<p style="color: red;">Error rendering SVG preview</p>';
        }
    }
    
    renderMermaidPreview(previewDiv, code) {
        // For Mermaid, we'll show a placeholder since we don't have the Mermaid library
        // In a full implementation, you would include Mermaid.js
        previewDiv.innerHTML = `
            <div style="padding: 1rem; background: #f5f5f5; border-radius: 4px; text-align: center;">
                <p><strong>Mermaid Diagram Preview</strong></p>
                <p>Mermaid rendering would appear here with the full Mermaid.js library.</p>
                <pre style="text-align: left; background: white; padding: 1rem; border-radius: 4px; margin-top: 1rem;">${this.escapeHtml(code)}</pre>
            </div>
        `;
    }
    
    getLanguageDisplayName(language) {
        const languageMap = {
            'javascript': 'JavaScript',
            'js': 'JavaScript',
            'html': 'HTML',
            'css': 'CSS',
            'python': 'Python',
            'java': 'Java',
            'mermaid': 'Mermaid',
            'svg': 'SVG'
        };
        
        return languageMap[language.toLowerCase()] || language.charAt(0).toUpperCase() + language.slice(1);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showCopyNotification(message, isError = false) {
        // Remove any existing notification
        const existingNotification = document.querySelector('.code-copy-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'code-copy-notification';
        notification.textContent = message;
        
        if (isError) {
            notification.style.backgroundColor = '#d32f2f';
        }
        
        document.body.appendChild(notification);
        
        // Show notification
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Hide notification after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, isError ? 3000 : 2000);
    }
}