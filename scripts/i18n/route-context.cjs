const path = require('node:path');
const {buildManifest, sourceSha, routeData} = require('./content-manifest.cjs');
const {hash} = require('./state.cjs');
const key = route => decodeURI(route).replace(/\/+$/, '') || '/';

// Native routes stay native. Add a separately split data module to their leaf
// context, rather than copying a site-wide registry into every page's globals.
function withContentRoutes(plugin, context, {body = false} = {}) {
    return {...plugin, async contentLoaded({content, actions}) {
        const input = content?.contentIdentity;
        if (!input) return plugin.contentLoaded?.({content, actions});
        const manifest = buildManifest({sourceSha: sourceSha(context.siteDir), locale: context.i18n.currentLocale,
            enabledLocales: context.i18n.locales, entries: input.entries, reports: [...input.reports]});
        const modules = new Map();
        for (const page of manifest.pages) {
            const data = await actions.createData(`content-route-${hash(page.contentId)}.json`, routeData(page));
            modules.set(key(page.route), {data, page});
        }
        function attach(route, top = true) {
            const match = route.exact !== false && modules.get(key(route.path));
            const children = route.routes?.map(child => attach(child, false));
            const leaf = !route.routes;
            const component = body && match && /\.[jt]sx?$/.test(route.component) ? route.component
                + '?doris-body=' + (match.page.contentLocale === 'en' ? 'en' : 'target') : route.component;
            const data = {navigationRoutes: path.join(context.generatedFilesDir, 'doris-translation-status/default/navigation.json'),
                ...(match && {contentRoute: match.data})};
            // Docusaurus wraps only addRoute's top node under context.data.
            // Nested routes must declare that namespace themselves.
            const routeContext = top ? {...route.context, ...data}
                : {...route.context, data: {...route.context?.data, ...data}};
            return {...route, ...(children && {routes: children}), context: routeContext, ...(leaf && {
                    component: '@site/src/components/ContentRoute',
                    modules: {...route.modules, __nativeContent: component},
                })};
        }
        return plugin.contentLoaded?.({content, actions: {...actions, addRoute: route => actions.addRoute(attach(route))}});
    }};
}
module.exports = {withContentRoutes};
