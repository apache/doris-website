const assert = require('node:assert/strict');

// Apache limits .htaccess lines to 8,190 bytes. Leave room for line endings
// and count the complete escaped directive, including its target and flags.
const maxLineBytes = 8000;

function validateApacheControls(content, source) {
    let bytes = 0, start = 1;
    for (const [index,line] of content.split(/\r?\n/).entries()) {
        bytes += Buffer.byteLength(line);
        assert(bytes <= maxLineBytes,
            `Apache control line exceeds ${maxLineBytes} bytes: ${source}:${start} (${bytes} bytes)`);
        // Continued physical lines form one logical configuration line.
        if (!line.endsWith('\\')) {
            bytes = 0;
            start = index+2;
        }
    }
}

module.exports = {maxLineBytes,validateApacheControls};
