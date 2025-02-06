const path = require('path');
const publicPath = 'https://doris.apache.org';
module.exports = function (context, options) {
    return {
        name: 'custom-docusaurus-plugin',
        configureWebpack(config, isServer, utils) {
            return {
                output: {
                    ...config.output,
                    publicPath: context.i18n.currentLocale === 'en' ? `${publicPath}/` : `${publicPath}/zh-CN/`,
                },
            };
        },
    };
};
