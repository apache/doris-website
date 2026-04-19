const path = require('path');

module.exports = function (context, options) {
    return {
        name: 'custom-docusaurus-plugin',
        configureWebpack(config, isServer, utils) {
            const localePublicPath =
                context.i18n.currentLocale === 'en'
                    ? '/'
                    : context.i18n.currentLocale === 'zh-CN'
                    ? '/zh-CN/'
                    : '/ja/';

            return {
                output: {
                    ...config.output,
                    publicPath:
                        context.i18n.currentLocale === 'en'
                            ? 'https://cdnd.selectdb.com/' :
                            context.i18n.currentLocale === 'zh-CN' ?
                                'https://cdnd.selectdb.com/zh-CN/' : 'https://cdnd.selectdb.com/ja/',
                    // Keep general assets on CDN, but force worker chunks to same-origin
                    // to satisfy browser worker same-origin policy for Search worker bootstrap.
                    workerPublicPath: localePublicPath,
                },
            };
        },
    };
};
