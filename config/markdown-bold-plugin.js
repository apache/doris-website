const { visit } = require('unist-util-visit');

function getFirstBoldContent(str, startIdx = 0) {
    const strArr = str.split('');
    for (let i = startIdx; i < strArr.length; i++) {
        if (strArr[i - 1] !== '*' && strArr[i] === '*' && strArr[i + 1] === '*' && strArr[i + 2] !== '*') {
            // start with **
            let j;
            for (j = i + 2; j < strArr.length; j++) {
                if (strArr[j - 1] !== '*' && strArr[j] === '*' && strArr[j + 1] === '*' && strArr[j + 2] !== '*') {
                    // end with **
                    return {
                        start: i,
                        end: j,
                    };
                }
            }
        }
    }
    return null;
}

/**
 * @description
 *
 * A plugin to handle the problem that bold formatting is not effective
 *
 * Tip: if the plugin source code does not take effect after modification, it may need to be rebuilt.
 */
const plugin = options => {
    const transformer = async (ast, file) => {
        // Disable warnings in CI environment to avoid excessive log output
        const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

        visit(ast, 'text', (node, index, parent) => {
            if (getFirstBoldContent(node.value)) {
                const { start, end } = getFirstBoldContent(node.value);
                const value = node.value.slice(start + 2, end);
                parent.children[index] = {
                    type: 'strong',
                    children: [
                        {
                            value: value,
                            type: 'text',
                        },
                    ],
                };
                const [boldBefore, , boldAfter] = node.value.split('**');
                let hasBoldBefore = !!boldBefore;
                if (boldBefore) {
                    parent.children.splice(index, 0, {
                        type: 'text',
                        value: boldBefore,
                    });
                }
                if (boldAfter) {
                    parent.children.splice(hasBoldBefore ? index + 2 : index + 1, 0, {
                        type: 'text',
                        value: boldAfter,
                    });
                }
                // Only show warnings in local development
                if (!isCI) {
                    console.warn(
                        `[WARNING] The bold syntax of "${value}" in "${file.path}" is invalid and is being automatically optimized`,
                    );
                }
            } else if (/(?<!\*)\*\*(?!\*)/.test(node.value)) {
                // When there are multiple bold syntax in the text that does not take effect, you need to modify it manually
                // For example: aa**test1:**bb**test2:**cc will be rendered as aa**test1:<strong>bb</strong>test2:**cc
                // Only show warnings in local development
                if (!isCI) {
                    console.warn(
                        `[WARNING] markdownBoldPlugin found a ** in the text node (${node.value}) of the file ${file.path}, which may cause the document to not render as expected`,
                    );
                }
            }
        });
    };
    return transformer;
};

module.exports = {
    markdownBoldPlugin: plugin,
};
