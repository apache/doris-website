const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

function scripts(siteDir) {
    return ['brand-theme-bootstrap','course-rail-bootstrap'].map(name => {
        const content = fs.readFileSync(path.join(siteDir,`static/js/${name}.js`),'utf8');
        const hash = createHash('sha256').update(content).digest('hex').slice(0,16);
        return {file:`assets/js/${name}.${hash}.js`,content};
    });
}

class BootstrapAssetsPlugin {
    constructor(siteDir) {this.siteDir = siteDir;}
    apply(compiler) {
        compiler.hooks.thisCompilation.tap('DorisBootstrapAssets', compilation => {
            compilation.hooks.processAssets.tap({name:'DorisBootstrapAssets',
                stage:compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL}, () => {
                for (const script of scripts(this.siteDir)) compilation.emitAsset(script.file,
                    new compiler.webpack.sources.RawSource(script.content));
            });
        });
    }
}

module.exports = {scripts,BootstrapAssetsPlugin};
