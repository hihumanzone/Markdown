class ListItemParser {
    static parse(markdownText) {
        const listItems = [];
        const lines = markdownText.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const unorderedMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
            const orderedMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
            if (unorderedMatch || orderedMatch) {
                const match = unorderedMatch || orderedMatch;
                const contentOnFirstLine = match[2];
                const isOrdered = !!orderedMatch;

                const baseIndentation = line.indexOf(contentOnFirstLine);

                let fullContent = contentOnFirstLine;
                let j = i + 1;

                while (j < lines.length) {
                    const nextLine = lines[j];
                    const nextTrimmed = nextLine.trim();

                    if (nextTrimmed === '' ||
                        nextLine.match(/^\s*[-*+]\s+/) ||
                        nextLine.match(/^\s*\d+\.\s+/)) {
                        break;
                    }

                    const leadingWhitespaceLength = (nextLine.match(/^\s*/) || [''])[0].length;
                    if (leadingWhitespaceLength >= baseIndentation && nextTrimmed !== '') {
                        fullContent += '\n' + nextLine.substring(baseIndentation);
                        j++;
                    } else {
                        break;
                    }
                }
                listItems.push({
                    content: fullContent,
                    indent: match[1].length,
                    isOrdered: isOrdered
                });
                i = j - 1;
            }
        }
        return listItems;
    }
}

class MathProcessor {
    static preserveMathExpressions(markdownText) {
        const mathExpressions = [];
        let tempText = markdownText;
        CONFIG.MATH_PATTERNS.forEach((pattern) => {
            tempText = tempText.replace(pattern.regex, (match, content) => {
                if (content.trim() === "") return match;
                const placeholder = `%%MATH_PLACEHOLDER_${mathExpressions.length}%%`;
                mathExpressions.push({
                    placeholder,
                    content,
                    originalOpen: pattern.open,
                    originalClose: pattern.close
                });
                return placeholder;
            });
        });
        return { tempText, mathExpressions };
    }
    
    static restoreMathExpressions(html, mathExpressions) {
        let restoredHtml = html;
        mathExpressions.forEach(item => {
            const preservedKatexString = item.originalOpen + item.content + item.originalClose;
            restoredHtml = restoredHtml.replace(item.placeholder, preservedKatexString);
        });
        return restoredHtml;
    }
}

class CodeBlockProcessor {
    static processCodeBlocks(html) {
        // Regular expression to match code blocks with language specification
        const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;
        const codeBlockRegexNoLang = /<pre><code>([\s\S]*?)<\/code><\/pre>/g;
        
        let processedHtml = html;
        let blockIndex = 0;
        
        // Process code blocks with language specification
        processedHtml = processedHtml.replace(codeBlockRegex, (match, language, code) => {
            return this.createEnhancedCodeBlock(code, language, blockIndex++);
        });
        
        // Process code blocks without language specification
        processedHtml = processedHtml.replace(codeBlockRegexNoLang, (match, code) => {
            // Check if this wasn't already processed (avoid double processing)
            if (match.includes('code-block-container')) {
                return match;
            }
            return this.createEnhancedCodeBlock(code, 'text', blockIndex++);
        });
        
        return processedHtml;
    }
    
    static createEnhancedCodeBlock(code, language, blockIndex) {
        // Decode HTML entities in code
        const decodedCode = this.decodeHtml(code);
        
        // Determine language display name
        const languageDisplay = this.getLanguageDisplayName(language);
        
        // Check if language supports preview
        const supportsPreview = this.supportsPreview(language);
        const previewButton = supportsPreview ? 
            `<button class="code-action-btn code-preview-btn" title="Preview ${languageDisplay}" data-action="preview">Preview</button>` : '';
        
        // Map common language aliases to Prism-compatible names
        const prismLanguage = this.getPrismLanguage(language);
        
        // Escape the code for HTML display
        const escapedCode = this.escapeHtml(decodedCode);
        
        return `
            <div class="code-block-container" data-language="${language}" data-block-index="${blockIndex}">
                <div class="code-block-header">
                    <div class="code-block-info">
                        <span class="code-language">${languageDisplay}</span>
                    </div>
                    <div class="code-block-actions">
                        ${previewButton}
                        <button class="code-action-btn code-copy-btn" title="Copy code" data-action="copy">Copy</button>
                        <button class="code-action-btn code-toggle-btn" title="Collapse code" data-action="toggle">−</button>
                    </div>
                </div>
                <div class="code-block-content collapsed">
                    <pre class="code-block-pre line-numbers language-${prismLanguage}"><code class="code-block-code language-${prismLanguage}">${escapedCode}</code></pre>
                    ${supportsPreview ? `<div class="code-block-preview" style="display: none;"></div>` : ''}
                </div>
            </div>
        `;
    }
    
    static decodeHtml(html) {
        // Simple HTML entity decoding without DOM
        return html
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&#x27;/g, "'");
    }
    
    static escapeHtml(text) {
        // Simple HTML escaping without DOM
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    static getLanguageDisplayName(language) {
        const languageMap = {
            'javascript': 'JavaScript',
            'js': 'JavaScript',
            'typescript': 'TypeScript',
            'ts': 'TypeScript',
            'python': 'Python',
            'py': 'Python',
            'java': 'Java',
            'c': 'C',
            'cpp': 'C++',
            'csharp': 'C#',
            'php': 'PHP',
            'ruby': 'Ruby',
            'go': 'Go',
            'rust': 'Rust',
            'swift': 'Swift',
            'kotlin': 'Kotlin',
            'html': 'HTML',
            'css': 'CSS',
            'scss': 'SCSS',
            'sass': 'Sass',
            'xml': 'XML',
            'json': 'JSON',
            'yaml': 'YAML',
            'yml': 'YAML',
            'sql': 'SQL',
            'bash': 'Bash',
            'shell': 'Shell',
            'sh': 'Shell',
            'powershell': 'PowerShell',
            'dockerfile': 'Dockerfile',
            'markdown': 'Markdown',
            'md': 'Markdown',
            'text': 'Plain Text',
            'txt': 'Plain Text',
            'mermaid': 'Mermaid',
            'svg': 'SVG'
        };
        
        return languageMap[language.toLowerCase()] || language.charAt(0).toUpperCase() + language.slice(1);
    }
    
    static supportsPreview(language) {
        const previewLanguages = ['html', 'svg', 'mermaid'];
        return previewLanguages.includes(language.toLowerCase());
    }
    
    static getPrismLanguage(language) {
        // Map common language aliases to Prism-compatible names
        const prismLanguageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'c++': 'cpp',
            'c#': 'csharp',
            'sh': 'bash',
            'shell': 'bash',
            'yml': 'yaml',
            'md': 'markdown',
            'txt': 'text',
            'text': 'text'
        };
        
        const normalized = language.toLowerCase();
        return prismLanguageMap[normalized] || normalized;
    }
}