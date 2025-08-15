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
        // Pre-process lists to convert multi-line list items to single-line with <br> tags
        html = this.preprocessLists(html);
        
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
    
    static preprocessLists(html) {
        const listItems = ListItemParser.parse(html);
        if (listItems.length === 0) return html;
        
        // Build a completely new version of the text with proper single-line list items
        const lines = html.split('\n');
        const resultLines = [];
        let currentListItemIndex = 0;
        let skipMode = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const unorderedMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
            const orderedMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
            
            if (unorderedMatch || orderedMatch) {
                // This is a list item start - replace with processed version
                const match = unorderedMatch || orderedMatch;
                
                if (currentListItemIndex < listItems.length) {
                    const listItem = listItems[currentListItemIndex];
                    const content = listItem.content.replace(/\n/g, '<br>');
                    const prefix = ' '.repeat(listItem.indent);
                    const marker = listItem.isOrdered ? '1.' : '-';
                    resultLines.push(`${prefix}${marker} ${content}`);
                    currentListItemIndex++;
                    skipMode = true;
                } else {
                    resultLines.push(line);
                }
            } else if (skipMode) {
                // We're in skip mode, check if this line is part of list content
                const trimmed = line.trim();
                const leadingSpaces = line.length - line.trimLeft().length;
                
                // If it's empty or indented content, skip it (already processed)
                if (trimmed === '' || leadingSpaces > 0) {
                    continue;
                } else {
                    // This is a new non-list line, exit skip mode
                    skipMode = false;
                    resultLines.push(line);
                }
            } else {
                resultLines.push(line);
            }
        }
        
        return resultLines.join('\n');
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