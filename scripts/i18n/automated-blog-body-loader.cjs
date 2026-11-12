// Compile the translated bytes at the English resource path. Native relative
// MDX imports/images therefore resolve exactly as they do in the source post.
const fs = require('node:fs'),
    assert = require('node:assert/strict');
const { hash } = require('./state.cjs');
module.exports = function (source) {
    const item = this.getOptions().translations[this.resourcePath];
    if (!item) return source;
    this.addDependency(item.target);
    this.addDependency(item.state);
    assert.equal(
        hash(fs.readFileSync(this.resourcePath, 'utf8')),
        item.sourceHash,
        'Blog source changed during compilation',
    );
    const target = fs.readFileSync(item.target, 'utf8');
    assert.equal(hash(target), item.targetHash, 'Blog target changed during compilation');
    return target;
};
