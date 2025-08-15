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

                    // If we encounter a new list item, break
                    if (nextLine.match(/^\s*[-*+]\s+/) ||
                        nextLine.match(/^\s*\d+\.\s+/)) {
                        break;
                    }

                    // If line is empty, include it and continue to check next lines
                    if (nextTrimmed === '') {
                        fullContent += '\n';
                        j++;
                        continue;
                    }

                    // Check if this non-empty line belongs to the list item based on indentation
                    const leadingWhitespaceLength = (nextLine.match(/^\s*/) || [''])[0].length;
                    if (leadingWhitespaceLength >= baseIndentation) {
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