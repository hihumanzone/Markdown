class ListItemParser {
    static _UNORDERED = /^(\s*)[-*+]\s+(.*)$/;
    static _ORDERED = /^(\s*)\d+\.\s+(.*)$/;
    static _LEADING_WS = /^\s*/;

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
        const len = lines.length;

        for (let i = 0; i < len; i++) {
            const line = lines[i];
            const unorderedMatch = line.match(ListItemParser._UNORDERED);
            let orderedMatch = null;
            if (!unorderedMatch) {
                orderedMatch = line.match(ListItemParser._ORDERED);
            }
            if (!unorderedMatch && !orderedMatch) continue;

            const match = unorderedMatch || orderedMatch;
            const content = match[2];
            const indent = match[1].length;
            const isOrdered = !!orderedMatch;
            const baseIndent = line.indexOf(content);

            let fullContent = content;
            const rawLines = [line];
            let flatContent = content;
            let currentIndex = i + 1;

            while (currentIndex < len) {
                const nextLine = lines[currentIndex];
                const nextTrimmed = nextLine.trim();

                if (nextTrimmed === '') {
                    rawLines.push(nextLine);
                    fullContent += '\n';
                    flatContent += '\n';
                    currentIndex++;
                    continue;
                }

                let hasListMarker = false;
                let subListMatch = nextLine.match(ListItemParser._UNORDERED);
                if (!subListMatch) {
                    const subListMatchOrdered = nextLine.match(ListItemParser._ORDERED);
                    if (subListMatchOrdered) {
                        subListMatch = subListMatchOrdered;
                        hasListMarker = true;
                    }
                } else {
                    hasListMarker = true;
                }

                if (hasListMarker) {
                    const subIndent = subListMatch[1].length;
                    if (subIndent <= indent) break;
                    rawLines.push(nextLine);
                    fullContent += '\n' + nextLine;
                    flatContent += '\n' + nextLine;
                    currentIndex++;
                    continue;
                }

                const leadingWsLen = (nextLine.match(ListItemParser._LEADING_WS) || [''])[0].length;
                if (leadingWsLen >= baseIndent) {
                    rawLines.push(nextLine);
                    fullContent += '\n' + nextLine.substring(baseIndent);
                    flatContent += '\n' + nextLine.substring(baseIndent);
                    currentIndex++;
                } else {
                    break;
                }
            }

            nested.push({
                content: fullContent.replace(/\s+$/, ''),
                rawContent: rawLines.join('\n').replace(/\s+$/, ''),
                indent: indent,
                isOrdered: isOrdered
            });

            flat.push({
                content: flatContent.replace(/\s+$/, ''),
                indent: indent,
                isOrdered: isOrdered
            });

            i = currentIndex - 1;
        }

        return { nested: nested, flat: flat };
    }
}

class MathProcessor {
    static preserveMathExpressions(markdownText) {
        const mathExpressions = [];
        let tempText = markdownText.replace(
            /(^|\n)([ \t]*)\[\s*\n([\s\S]*?)\n[ \t]*\](?=\n|$)/g,
            '$1$2\\[\n$3\n$2\\]'
        );
        const patterns = CONFIG.MATH_PATTERNS;

        for (let p = 0; p < patterns.length; p++) {
            const pat = patterns[p];
            tempText = tempText.replace(patterns[p].regex, function(match) {
                const content = match.slice(pat.open.length, match.length - pat.close.length);
                if (!content || content.trim() === '') return match;
                const placeholder = '%%MATH_PLACEHOLDER_' + mathExpressions.length + '%%';
                mathExpressions.push({ placeholder: placeholder, content: content, originalOpen: pat.open, originalClose: pat.close });
                return placeholder;
            });
        }

        return { tempText: tempText, mathExpressions: mathExpressions };
    }

    static restoreMathExpressions(html, mathExpressions) {
        if (mathExpressions.length === 0) return html;
        const map = {};
        for (let i = 0; i < mathExpressions.length; i++) {
            const item = mathExpressions[i];
            map[item.placeholder] = item.originalOpen + item.content + item.originalClose;
        }
        const regex = /%%MATH_PLACEHOLDER_\d+%%/g;
        return html.replace(regex, function(match) { return map[match] || match; });
    }
}
