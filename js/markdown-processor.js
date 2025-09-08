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
            const listMatch = this._getListMatch(line);
            if (listMatch) {
                const listItem = this._parseListItem(lines, i, listMatch);
                listItems.push(listItem.item);
                i = listItem.nextIndex - 1;
            }
        }
        return listItems;
    }

    static parseFlat(markdownText) {
        const items = [];
        const lines = markdownText.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const match = this._getListMatch(lines[i]);
            if (!match) continue;
            const endIdx = this._findItemBlockEnd(lines, i, match);
            const content = this._buildItemContent(lines, i, endIdx, match);
            items.push({
                content: content.trimEnd(),
                indent: match.indent,
                isOrdered: match.isOrdered
            });
        }
        return items;
    }

    static _getListMatch(line) {
        const unorderedMatch = line.match(this.LIST_MARKER_REGEX.UNORDERED);
        const orderedMatch = line.match(this.LIST_MARKER_REGEX.ORDERED);
        if (unorderedMatch || orderedMatch) {
            const match = unorderedMatch || orderedMatch;
            return {
                match,
                content: match[2],
                indent: match[1].length,
                isOrdered: !!orderedMatch
            };
        }
        return null;
    }

    static _parseListItem(lines, startIndex, listMatch) {
        const baseIndentation = lines[startIndex].indexOf(listMatch.content);
        let fullContent = listMatch.content;
        let currentIndex = startIndex + 1;
        const rawContentLines = [lines[startIndex]];

        while (currentIndex < lines.length) {
            const nextLine = lines[currentIndex];
            const nextTrimmed = nextLine.trim();

            if (nextTrimmed === '') {
                rawContentLines.push(nextLine);
                fullContent += '\n';
                currentIndex++;
                continue;
            }

            const nextListMatch = this._getListMatch(nextLine);
            if (nextListMatch) {
                if (nextListMatch.indent <= listMatch.indent) break;
                rawContentLines.push(nextLine);
                fullContent += '\n' + nextLine;
                currentIndex++;
                continue;
            }

            const leadingWhitespaceLength = (nextLine.match(/^\s*/) || [''])[0].length;
            if (leadingWhitespaceLength >= baseIndentation) {
                rawContentLines.push(nextLine);
                fullContent += '\n' + nextLine.substring(baseIndentation);
                currentIndex++;
            } else {
                break;
            }
        }

        return {
            item: {
                content: fullContent.trimEnd(),
                rawContent: rawContentLines.join('\n').trimEnd(),
                indent: listMatch.indent,
                isOrdered: listMatch.isOrdered
            },
            nextIndex: currentIndex
        };
    }

    static _findItemBlockEnd(lines, startIndex, listMatch) {
        const baseIndentation = lines[startIndex].indexOf(listMatch.content);
        let idx = startIndex + 1;
        while (idx < lines.length) {
            const nextLine = lines[idx];
            const trimmed = nextLine.trim();
            if (trimmed === '') { idx++; continue; }
            const nextMatch = this._getListMatch(nextLine);
            if (nextMatch) {
                if (nextMatch.indent <= listMatch.indent) break;
                idx++;
                continue;
            }
            const leadingWhitespaceLength = (nextLine.match(/^\s*/) || [''])[0].length;
            if (leadingWhitespaceLength >= baseIndentation) {
                idx++;
            } else {
                break;
            }
        }
        return idx;
    }

    static _buildItemContent(lines, startIndex, endIndex, listMatch) {
        const baseIndentation = lines[startIndex].indexOf(listMatch.content);
        let content = listMatch.content;
        for (let i = startIndex + 1; i < endIndex; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            if (trimmed === '') { content += '\n'; continue; }
            const nextMatch = this._getListMatch(line);
            if (nextMatch && nextMatch.indent > listMatch.indent) {
                content += '\n' + line;
                continue;
            }
            const leadingWhitespaceLength = (line.match(/^\s*/) || [''])[0].length;
            if (leadingWhitespaceLength >= baseIndentation) {
                content += '\n' + line.substring(baseIndentation);
            } else {
                content += '\n' + line.trimEnd();
            }
        }
        return content;
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