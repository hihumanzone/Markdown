class ListItemParser {
    static LIST_MARKER_REGEX = {
        UNORDERED: /^(\s*)[-*+]\s+(.*)$/,
        ORDERED: /^(\s*)\d+\.\s+(.*)$/,
        ANY_UNORDERED: /^\s*[-*+]\s+/,
        ANY_ORDERED: /^\s*\d+\.\s+/
    };

    static parse(markdownText) {
        return this.parseAll(markdownText).nested;
    }

    static parseFlat(markdownText) {
        return this.parseAll(markdownText).flat;
    }

    static parseAll(markdownText) {
        const nested = [];
        const flat = [];
        const lines = markdownText.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const listMatch = this._getListMatch(lines[i]);
            if (!listMatch) {
                continue;
            }

            const parsedItem = this._parseListItem(lines, i, listMatch);
            nested.push(parsedItem.item);

            flat.push({
                content: this._buildFlatContent(lines, i, parsedItem.nextIndex, listMatch),
                indent: listMatch.indent,
                isOrdered: listMatch.isOrdered
            });

            i = parsedItem.nextIndex - 1;
        }

        return { nested, flat };
    }

    static _getListMatch(line) {
        const unorderedMatch = line.match(this.LIST_MARKER_REGEX.UNORDERED);
        if (unorderedMatch) {
            return {
                match: unorderedMatch,
                content: unorderedMatch[2],
                indent: unorderedMatch[1].length,
                isOrdered: false
            };
        }
        const orderedMatch = line.match(this.LIST_MARKER_REGEX.ORDERED);
        if (orderedMatch) {
            return {
                match: orderedMatch,
                content: orderedMatch[2],
                indent: orderedMatch[1].length,
                isOrdered: true
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

    static _buildFlatContent(lines, startIndex, endIndex, listMatch) {
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
        return content.trimEnd();
    }
}

class MathProcessor {
    static BLOCK_MATH_DOLLAR_REGEX = /(^|\n)([ \t]*)\$\$\s*\n([\s\S]*?)\n[ \t]*\$\$(?=\n|$)/g;
    static BLOCK_MATH_BRACKET_REGEX = /(^|\n)([ \t]*)\[\s*\n([\s\S]*?)\n[ \t]*\](?=\n|$)/g;

    static normalizeBlockMathDelimiters(markdownText) {
        // Handle $$ ... $$ with possible indentation
        let normalizedText = markdownText.replace(
            this.BLOCK_MATH_DOLLAR_REGEX,
            '$1$2\\[\n$3\n$2\\]'
        );

        // Handle [ ... ] with possible indentation
        normalizedText = normalizedText.replace(
            this.BLOCK_MATH_BRACKET_REGEX,
            '$1$2\\[\n$3\n$2\\]'
        );

        return normalizedText;
    }

    static preserveMathExpressions(markdownText) {
        const mathExpressions = [];
        let tempText = this.normalizeBlockMathDelimiters(markdownText);
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
