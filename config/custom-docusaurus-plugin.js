const path = require('path');

module.exports = function (context, options) {
    return {
        name: 'custom-docusaurus-plugin',
        configureWebpack(config, isServer, utils) {
            return {
                output: {
                    ...config.output,
                    publicPath:
                        context.i18n.currentLocale === 'en'
                            ? 'https://cdn-tencent.selectdb.com/'
                            : 'https://cdn-tencent.selectdb.com/zh-CN/',
                },
            };
        },
    };
};
