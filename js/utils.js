const Utils = {
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    sanitizeMarkdown(markdown) {
        // Use DOMPurify if available to sanitize markdown content
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(markdown, {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                              'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 
                              'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'del', 'ins'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
                ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
            });
        }
        return markdown;
    },
    
    validateInputLength(text, maxLength, fieldName) {
        if (!text || typeof text !== 'string') {
            return { valid: false, message: `${fieldName} is required.` };
        }
        
        if (text.length > maxLength) {
            return { 
                valid: false, 
                message: `${fieldName} must be ${maxLength} characters or less. Current length: ${text.length}` 
            };
        }
        
        return { valid: true };
    },
    async copyToClipboard(text) {
        if (navigator.clipboard?.writeText) {
            return navigator.clipboard.writeText(text);
        }
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
        } finally {
            document.body.removeChild(textArea);
        }
    },
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};