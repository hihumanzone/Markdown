class FallbackRenderer {
    static renderToHtml(markdown) {
        let html = this.escapeHtml(markdown);
        html = this.processCodeBlocks(html);
        html = this.processHeaders(html);
        html = this.processHorizontalRules(html);
        html = this.processTextFormatting(html);
        html = this.processInlineCode(html);
        html = this.processImages(html);
        html = this.processLinks(html);
        html = this.processBlockElements(html);
        return html;
    }
    
    static escapeHtml(text) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    
    static processCodeBlocks(html) {
        return html.replace(/```[\s\S]*?```/g, (match) => {
            const codeContent = match.replace(/```/g, '').trim();
            return `<pre><code>${codeContent}</code></pre>`;
        });
    }
    
    static processHeaders(html) {
        return html
            .replace(/^#{6}\s+(.*$)/gim, '<h6>$1</h6>')
            .replace(/^#{5}\s+(.*$)/gim, '<h5>$1</h5>')
            .replace(/^#{4}\s+(.*$)/gim, '<h4>$1</h4>')
            .replace(/^#{3}\s+(.*$)/gim, '<h3>$1</h3>')
            .replace(/^#{2}\s+(.*$)/gim, '<h2>$1</h2>')
            .replace(/^#{1}\s+(.*$)/gim, '<h1>$1</h1>');
    }
    
    static processHorizontalRules(html) {
        return html.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '<hr>');
    }
    
    static processTextFormatting(html) {
        return html
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>');
    }
    
    static processInlineCode(html) {
        return html.replace(/`([^`]+)`/g, '<code>$1</code>');
    }
    
    static processImages(html) {
        return html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">');
    }
    
    static processLinks(html) {
        return html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    }
    
    static processBlockElements(html) {
        const lines = html.split('\n');
        const processedLines = [];
        let inBlockquote = false;
        let blockquoteContent = [];
        let inList = false;
        let listItems = [];
        let listType = null;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (this.processBlockquote(trimmedLine, inBlockquote, blockquoteContent, processedLines)) {
                inBlockquote = !inBlockquote;
                if (!inBlockquote) blockquoteContent = [];
                continue;
            }
            
            const listResult = this.processList(trimmedLine, inList, listItems, listType, processedLines);
            if (listResult.processed) {
                inList = listResult.inList;
                listItems = listResult.listItems;
                listType = listResult.listType;
                continue;
            }
            
            processedLines.push(line);
        }
        
        this.finalizePendingBlocks(inBlockquote, blockquoteContent, inList, listItems, listType, processedLines);
        
        return this.processParagraphs(processedLines.join('\n'));
    }
    
    static processBlockquote(trimmedLine, inBlockquote, blockquoteContent, processedLines) {
        if (trimmedLine.startsWith('&gt;')) {
            if (!inBlockquote) return true;
            blockquoteContent.push(trimmedLine.substring(4).trim());
            return false;
        } else if (inBlockquote) {
            processedLines.push(`<blockquote>${blockquoteContent.join('<br>')}</blockquote>`);
            return true;
        }
        return false;
    }
    
    static processList(trimmedLine, inList, listItems, listType, processedLines) {
        const ulMatch = trimmedLine.match(/^[-*+]\s+(.*)$/);
        const olMatch = trimmedLine.match(/^\d+\.\s+(.*)$/);
        
        if (ulMatch || olMatch) {
            const currentListType = ulMatch ? 'ul' : 'ol';
            if (!inList || listType !== currentListType) {
                if (inList) {
                    processedLines.push(`<${listType}>${listItems.join('')}</${listType}>`);
                }
                return {
                    processed: true,
                    inList: true,
                    listType: currentListType,
                    listItems: [`<li>${ulMatch ? ulMatch[1] : olMatch[1]}</li>`]
                };
            }
            listItems.push(`<li>${ulMatch ? ulMatch[1] : olMatch[1]}</li>`);
            return { processed: true, inList, listItems, listType };
        } else if (inList) {
            processedLines.push(`<${listType}>${listItems.join('')}</${listType}>`);
            return { processed: false, inList: false, listItems: [], listType: null };
        }
        
        return { processed: false, inList, listItems, listType };
    }
    
    static finalizePendingBlocks(inBlockquote, blockquoteContent, inList, listItems, listType, processedLines) {
        if (inBlockquote) {
            processedLines.push(`<blockquote>${blockquoteContent.join('<br>')}</blockquote>`);
        }
        if (inList) {
            processedLines.push(`<${listType}>${listItems.join('')}</${listType}>`);
        }
    }
    
    static processParagraphs(html) {
        const paragraphs = html.split(/\n\s*\n/);
        return paragraphs.map(para => {
            para = para.trim();
            if (!para) return '';
            
            if (para.match(/^<(h[1-6]|hr|blockquote|ul|ol|li|pre|div)/)) {
                return para.replace(/\n/g, '<br>');
            }
            
            return '<p>' + para.replace(/\n/g, '<br>') + '</p>';
        }).filter(para => para).join('\n');
    }
}