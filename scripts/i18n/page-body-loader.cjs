const {transformBody} = require('./page-body.cjs');
module.exports = function pageBodyLoader(source) {
    return transformBody({...this.getOptions(), file: this.resourcePath, source,
        english: new URLSearchParams(this.resourceQuery.slice(1)).get('doris-body') === 'en'});
};
