/**
 * Parses markdown text to extract list items with their content, indentation, and type.
 * Handles nested list items by including them as part of their parent item's content.
 * 
 * Features:
 * - Supports both ordered (1., 2., etc.) and unordered (-, *, +) lists
 * - Preserves nested list items within parent items
 * - Maintains original markdown formatting
 * - Removes trailing whitespace from copied content
 */
class ListItemParser {
    /**
     * Regular expressions for matching different types of list markers
     */
    static get LIST_MARKER_REGEX() {
        return {
            // Matches unordered list items: "- ", "* ", "+ " with optional leading whitespace
            UNORDERED: /^(\s*)[-*+]\s+(.*)$/,
            // Matches ordered list items: "1. ", "2. ", etc. with optional leading whitespace  
            ORDERED: /^(\s*)\d+\.\s+(.*)$/,
            // Simple patterns for quick detection (used in legacy code)
            ANY_UNORDERED: /^\s*[-*+]\s+/,
            ANY_ORDERED: /^\s*\d+\.\s+/
        };
    }

    /**
     * Parses markdown text and extracts all list items with their nested content.
     * 
     * @param {string} markdownText - The markdown text to parse
     * @returns {Array} Array of list item objects with properties:
     *   - content: The item text including all nested content (trimmed)
     *   - indent: The indentation level (number of spaces before marker)
     *   - isOrdered: Boolean indicating if this is an ordered list item
     */
    static parse(markdownText) {
        const listItems = [];
        const lines = markdownText.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const listMatch = this._getListMatch(line);
            
            if (listMatch) {
                const listItem = this._parseListItem(lines, i, listMatch);
                listItems.push(listItem.item);
                i = listItem.nextIndex - 1; // -1 because loop will increment i
            }
        }
        
        return listItems;
    }

    /**
     * Checks if a line is a list item and returns match information.
     * 
     * @param {string} line - The line to check
     * @returns {Object|null} Match object with content, indent, and type info, or null if not a list item
     */
    static _getListMatch(line) {
        const unorderedMatch = line.match(this.LIST_MARKER_REGEX.UNORDERED);
        const orderedMatch = line.match(this.LIST_MARKER_REGEX.ORDERED);
        
        if (unorderedMatch || orderedMatch) {
            const match = unorderedMatch || orderedMatch;
            return {
                match: match,
                content: match[2],
                indent: match[1].length,
                isOrdered: !!orderedMatch
            };
        }
        
        return null;
    }

    /**
     * Parses a complete list item including all its content and nested items.
     * 
     * @param {Array} lines - All lines of the markdown text
     * @param {number} startIndex - Index of the line where this list item starts
     * @param {Object} listMatch - Match information from _getListMatch
     * @returns {Object} Object with the parsed item and the next line index to process
     */
    static _parseListItem(lines, startIndex, listMatch) {
        const baseIndentation = lines[startIndex].indexOf(listMatch.content);
        let fullContent = listMatch.content;
        let currentIndex = startIndex + 1;

        // Collect all content that belongs to this list item
        while (currentIndex < lines.length) {
            const nextLine = lines[currentIndex];
            const nextTrimmed = nextLine.trim();

            // Handle empty lines
            if (nextTrimmed === '') {
                fullContent += '\n';
                currentIndex++;
                continue;
            }

            // Check if this line is another list item
            const nextListMatch = this._getListMatch(nextLine);
            if (nextListMatch) {
                // If it's at the same level or less indented, we're done with this item
                if (nextListMatch.indent <= listMatch.indent) {
                    break;
                }
                
                // If it's more indented (nested), include it as part of this item
                fullContent += '\n' + nextLine;
                currentIndex++;
                continue;
            }

            // Handle regular content continuation
            const leadingWhitespaceLength = (nextLine.match(/^\s*/) || [''])[0].length;
            if (leadingWhitespaceLength >= baseIndentation) {
                fullContent += '\n' + nextLine.substring(baseIndentation);
                currentIndex++;
            } else {
                break;
            }
        }

        return {
            item: {
                content: fullContent.trimEnd(),
                indent: listMatch.indent,
                isOrdered: listMatch.isOrdered
            },
            nextIndex: currentIndex
        };
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