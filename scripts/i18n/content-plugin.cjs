const path = require('node:path');
const {contentGroups, matchesSource} = require('./source-groups.cjs');

module.exports = function contentTranslations(context) {
    const root = context.siteDir, locale = context.i18n.currentLocale;
    const groups = contentGroups(root, locale);
    return {name: 'doris-content-translations',
        configureWebpack() {
            return groups.length ? {module: {rules: [{enforce: 'pre',
                test: file => groups.some(group => matchesSource(group, path.relative(root, file).split(path.sep).join('/'))),
                use: [{loader: require.resolve('./content-loader.cjs'), options: {root, locale}}],
            }]}} : {};
        },
        getPathsToWatch() {
            return groups.flatMap(group => [`${root}/${group.sourceRoot}/**/*`,
                `${root}/i18n/${locale}/docusaurus-plugin-content-docs-${group.pluginId}/**/*`])
                .concat(`${root}/translations/state/${locale}/**/*.json`, `${root}/translations/scope/${locale}.json`);
        },
    };
};
