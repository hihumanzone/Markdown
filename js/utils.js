const Utils = {
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    sanitizeMarkdown(markdown) {
        // Raw Markdown should not be processed by an HTML sanitizer like DOMPurify,
        // as doing so strips headers like <stdio.h> and double-encodes &, <, and >.
        return markdown || '';
    },

    sanitizeHtml(html) {
        if (typeof DOMPurify !== 'undefined' && html) {
            return DOMPurify.sanitize(html, {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                              'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 
                              'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'del', 'ins', 'span', 'div',
                              'sub', 'sup', 'mark', 'kbd'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'id', 'style',
                              'aria-hidden', 'aria-label', 'data-start', 'data-line', 'data-list-index', 'start'],
                ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
            });
        }
        return html || '';
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
    },

    cleanMarkdownText(text) {
        if (!text || typeof text !== 'string') return '';
        return text
            .replace(/<[^>]+>/g, '')
            .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            .replace(/\[\^?[^\]]*\]/g, '')
            .replace(/(\*\*\*|___)(.*?)\1/g, '$2')
            .replace(/(\*\*|__)(.*?)\1/g, '$2')
            .replace(/(\*|_)(.*?)\1/g, '$2')
            .replace(/~~(.*?)~~/g, '$1')
            .replace(/`+([^`]+)`+/g, '$1')
            .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
            .replace(/\$([^\$\n]+)\$/g, '$1')
            .replace(/\\\[([\s\S]*?)\\\]/g, '$1')
            .replace(/\\\(([^\)\n]+)\\\)/g, '$1')
            .replace(/^>+\s*/gm, '')
            .replace(/^[-*+]\s+\[[ xX]\]\s+/gm, '')
            .replace(/^(\s*)[-*+]\s+/gm, '$1')
            .replace(/^(\s*)\d+\.\s+/gm, '$1')
            .replace(/^#{1,6}\s+/gm, '')
            .replace(/\s+/g, ' ')
            .trim();
    },

    truncateAtWord(text, maxLength = 80) {
        if (!text || text.length <= maxLength) return text || '';
        const truncated = text.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > maxLength * 0.6) {
            return truncated.substring(0, lastSpace).trim() + '...';
        }
        return truncated.trim() + '...';
    },

    extractDocumentTitle(markdown, maxLength = 80) {
        if (!markdown || typeof markdown !== 'string') return 'Untitled';
        const lines = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        
        let inCodeBlock = false;
        let inFrontmatter = false;
        let frontmatterStart = false;
        const candidateLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (i === 0 && trimmed === '---') {
                inFrontmatter = true;
                frontmatterStart = true;
                continue;
            }
            if (inFrontmatter) {
                if (trimmed === '---' && !frontmatterStart) {
                    inFrontmatter = false;
                } else {
                    frontmatterStart = false;
                    const match = trimmed.match(/^title:\s*["']?(.*?)["']?$/i);
                    if (match && match[1]) {
                        const clean = this.cleanMarkdownText(match[1]);
                        if (clean) return this.truncateAtWord(clean, maxLength);
                    }
                }
                continue;
            }

            if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
                inCodeBlock = !inCodeBlock;
                continue;
            }
            if (inCodeBlock) continue;

            if (!trimmed || /^(?:[-*_]\s*){3,}$/.test(trimmed)) continue;

            const atxMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
            if (atxMatch) {
                const cleaned = this.cleanMarkdownText(atxMatch[1]);
                if (cleaned) return this.truncateAtWord(cleaned, maxLength);
            }

            if (i + 1 < lines.length) {
                const nextTrimmed = lines[i + 1].trim();
                if (/^={2,}$/.test(nextTrimmed) || /^-{2,}$/.test(nextTrimmed)) {
                    const cleaned = this.cleanMarkdownText(trimmed);
                    if (cleaned) return this.truncateAtWord(cleaned, maxLength);
                }
            }

            if (!trimmed.startsWith('|') && !trimmed.startsWith('<!--') && !trimmed.startsWith('<div')) {
                const cleaned = this.cleanMarkdownText(trimmed);
                if (cleaned && cleaned.length > 2) {
                    candidateLines.push(cleaned);
                }
            }
        }

        if (candidateLines.length > 0) {
            return this.truncateAtWord(candidateLines[0], maxLength);
        }

        return 'Untitled';
    }
};