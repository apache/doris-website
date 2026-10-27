const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

function scripts(siteDir, entryOptions) {
    const entries = ['brand-theme-bootstrap','course-rail-bootstrap'].map(name => ({name,
        content:fs.readFileSync(path.join(siteDir,`static/js/${name}.js`),'utf8')}));
    const entry = require('../i18n/locale-entry.cjs').bootstrap(siteDir, entryOptions);
    if (entry) entries.unshift({name:'locale-entry-bootstrap',content:entry});
    return entries.map(({name, content}) => {
        const hash = createHash('sha256').update(content).digest('hex').slice(0,16);
        return {file:`assets/js/${name}.${hash}.js`,content};
    });
}

class BootstrapAssetsPlugin {
    constructor(siteDir, entryOptions) {this.siteDir = siteDir;this.entryOptions = entryOptions;}
    apply(compiler) {
        compiler.hooks.thisCompilation.tap('DorisBootstrapAssets', compilation => {
            compilation.hooks.processAssets.tap({name:'DorisBootstrapAssets',
                stage:compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL}, () => {
                for (const script of scripts(this.siteDir,this.entryOptions)) compilation.emitAsset(script.file,
                    new compiler.webpack.sources.RawSource(script.content));
            });
        });
    }
}

module.exports = {scripts,BootstrapAssetsPlugin};
