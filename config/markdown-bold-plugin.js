const { visit } = require('unist-util-visit');

function getFirstBoldContent(str, startIdx = 0) {
    const strArr = str.split("");
    for (let i = startIdx; i < strArr.length; i++) {
      if (
        strArr[i - 1] !== "*" &&
        strArr[i] === "*" &&
        strArr[i + 1] === "*" &&
        strArr[i + 2] !== "*"
      ) {
        // start with **
        let j;
        for (j = i + 2; j < strArr.length; j++) {
          if (
            strArr[j - 1] !== "*" &&
            strArr[j] === "*" &&
            strArr[j + 1] === "*" &&
            strArr[j + 2] !== "*"
          ) {
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

const plugin = options => {
    const transformer = async (ast, file) => {
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
                console.warn(
                    `The bold syntax of ${value} in ${file.path} is invalid and is being automatically optimized`,
                );
            }
        });
    };
    return transformer;
};

module.exports = {
    markdownBoldPlugin: plugin,
};
