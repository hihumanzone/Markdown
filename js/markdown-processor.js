class ListItemParser {
    static get LIST_MARKER_REGEX() {
        return {
            UNORDERED: /^(\s*)[-*+]\s+(.*)$/,
            ORDERED: /^(\s*)\d+\.\s+(.*)$/,
            ANY_UNORDERED: /^\s*[-*+]\s+/,
            ANY_ORDERED: /^\s*\d+\.\s+/
        };
    }

    static parse(markdownText) {
        const listItems = [];
        const lines = markdownText.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const unorderedMatch = line.match(this.LIST_MARKER_REGEX.UNORDERED);
            const orderedMatch = line.match(this.LIST_MARKER_REGEX.ORDERED);
            if (unorderedMatch || orderedMatch) {
                const match = unorderedMatch || orderedMatch;
                const contentOnFirstLine = match[2];
                const isOrdered = !!orderedMatch;
                const currentIndent = match[1].length;

                const baseIndentation = line.indexOf(contentOnFirstLine);

                let fullContent = contentOnFirstLine;
                let j = i + 1;

                // Collect all content and nested list items
                while (j < lines.length) {
                    const nextLine = lines[j];
                    const nextTrimmed = nextLine.trim();

                    // Check if this is another list item at the same or higher level
                    const nextUnorderedMatch = nextLine.match(this.LIST_MARKER_REGEX.UNORDERED);
                    const nextOrderedMatch = nextLine.match(this.LIST_MARKER_REGEX.ORDERED);
                    
                    if (nextUnorderedMatch || nextOrderedMatch) {
                        const nextMatch = nextUnorderedMatch || nextOrderedMatch;
                        const nextIndent = nextMatch[1].length;
                        
                        // If it's at the same level or less indented than current item, stop
                        if (nextIndent <= currentIndent) {
                            break;
                        }
                        
                        // If it's more indented (nested), include it as part of this item
                        fullContent += '\n' + nextLine;
                        j++;
                        continue;
                    }

                    if (nextTrimmed === '') {
                        fullContent += '\n';
                        j++;
                        continue;
                    }

                    const leadingWhitespaceLength = (nextLine.match(/^\s*/) || [''])[0].length;
                    if (leadingWhitespaceLength >= baseIndentation) {
                        fullContent += '\n' + nextLine.substring(baseIndentation);
                        j++;
                    } else {
                        break;
                    }
                }
                listItems.push({
                    content: fullContent.trimEnd(),
                    indent: currentIndent,
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