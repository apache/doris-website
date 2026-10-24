// Disposable-process adapter for Docusaurus 3.6.3. Production builds never load
// this module. Native metadata stays complete; only selected routes enter the
// bundler and SSG. Unrendered public routes remain valid *logical* link targets.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const key = value => decodeURI(value).replace(/\/+$/, '') || '/';
const id = row => JSON.stringify([row.pluginId, row.version, row.docId]);
const sourceFile = (root, file) => path.resolve(root, file.replace(/^@site\//, ''));
const gitPath = (root, file) =>
    path
        .relative(root, file)
        .split(path.sep)
        .join('/')
        .replace(/^\.i18n-build\/([^/]+)\//, 'i18n/$1/');
const sha = root =>
    execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
function flatten(routes) {
    return routes.flatMap(route =>
        route.routes ? flatten(route.routes) : route.path === '*' ? [] : [route],
    );
}
function rowsFor(props) {
    const rows = [];
    const global = JSON.parse(
        fs.readFileSync(path.join(props.generatedFilesDir, 'globalData.json'), 'utf8'),
    );
    for (const plugin of props.plugins.filter(p => p.name === 'docusaurus-plugin-content-docs')) {
        const entries = plugin.content.contentIdentity?.entries ?? [];
        const lookup = new Map(
            entries.map(e => [JSON.stringify([e.siteLocale, e.version, e.docId]), e]),
        );
        const grouped = new Map();
        for (const entry of entries) {
            const k = JSON.stringify([entry.version, entry.docId]);
            if (!grouped.has(k)) grouped.set(k, []);
            grouped.get(k).push(entry);
        }
        for (const version of plugin.content.loadedVersions)
            for (const doc of version.docs) {
                const entry = lookup.get(
                    JSON.stringify([props.i18n.currentLocale, version.versionName, doc.id]),
                );
                const english = lookup.get(JSON.stringify(['en', version.versionName, doc.id]));
                const englishPath =
                    english?.englishPath ??
                    entry?.englishPath ??
                    gitPath(props.siteDir, sourceFile(props.siteDir, doc.source));
                const filename = path.relative(
                    version.contentPath,
                    path.resolve(props.siteDir, englishPath),
                );
                const aliases = new Set([
                    englishPath,
                    gitPath(props.siteDir, sourceFile(props.siteDir, doc.source)),
                ]);
                for (const item of grouped.get(JSON.stringify([version.versionName, doc.id])) ?? [])
                    for (const file of [item.englishPath, item.sourcePath, item.targetPath].filter(
                        Boolean,
                    ))
                        aliases.add(file);
                if (!filename.startsWith('..'))
                    for (const locale of props.i18n.locales)
                        aliases.add(
                            `i18n/${locale}/docusaurus-plugin-content-docs${plugin.options.id === 'default' ? '' : '-' + plugin.options.id}/${version.versionName === 'current' ? 'current' : 'version-' + version.versionName}/${filename.split(path.sep).join('/')}`,
                        );
                rows.push({
                    pluginId: plugin.options.id,
                    version: version.versionName,
                    docId: doc.id,
                    route: doc.permalink,
                    englishPath,
                    source: doc.source,
                    aliases: [...aliases],
                    main:
                        doc.id ===
                        global['docusaurus-plugin-content-docs']?.[
                            plugin.options.id
                        ]?.versions.find(v => v.name === version.versionName)?.mainDocId,
                    decisions: (
                        grouped.get(JSON.stringify([version.versionName, doc.id])) ?? []
                    ).map(e => ({
                        locale: e.siteLocale,
                        fallback: e.fallback,
                        indexable: e.indexable,
                        state: e.state,
                    })),
                });
            }
    }
    return rows.sort((a, b) => id(a).localeCompare(id(b)));
}
function chooseRepresentatives(rows, root) {
    const selected = new Map();
    const add = (row, reason) => {
        if (!row) return;
        const k = id(row);
        if (!selected.has(k)) selected.set(k, {row, reasons: []});
        selected.get(k).reasons.push(reason);
    };
    const groups = new Map();
    for (const row of rows) {
        const g = JSON.stringify([row.pluginId, row.version]);
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push(row);
    }
    for (const group of groups.values()) {
        add(group.find(r => r.main) ?? group[0], 'version/plugin entry');
        const texts = new Map();
        const text = r => {
            if (!texts.has(id(r)))
                texts.set(id(r), fs.readFileSync(path.resolve(root, r.englishPath), 'utf8'));
            return texts.get(id(r));
        };
        for (const [feature, pattern] of [
            ['MDX/import', /\bimport\s|<[A-Z][A-Za-z]+/],
            ['SQL', /```sql\b/i],
            ['math', /\$\$|\\\[/],
            ['media/link', /!\[|\]\(\.\.?\//],
        ])
            add(
                group.find(r => pattern.test(text(r))),
                feature,
            );
        const languages = new Set(group.flatMap(r => r.decisions.map(d => d.locale)));
        for (const locale of languages) {
            add(
                group.find(r =>
                    r.decisions.some(d => d.locale === locale && !d.fallback && d.indexable),
                ),
                `${locale} real body`,
            );
            add(
                group.find(r => r.decisions.some(d => d.locale === locale && d.fallback)),
                `${locale} fallback`,
            );
        }
    }
    return {selected, add};
}
async function dependencies(
    root,
    file,
    cache = new Map(),
    seen = new Set(),
    markdownConfigFormat = 'mdx',
) {
    if (seen.has(file)) return {files: seen, uncertain: false};
    seen.add(file);
    if (!/\.(mdx?|[cm]?[jt]sx?)$/.test(file)) return {files: seen, uncertain: false};
    let imports,
        uncertain = false;
    if (cache.has(file)) ({imports, uncertain} = cache.get(file));
    else {
        const source = fs.readFileSync(file, 'utf8');
        imports = [];
        // A lexical hint only: actual imports are read from AST, so fenced code
        // examples cannot accidentally turn the entire site into dependencies.
        if (/\b(import|export|require)\b/.test(source)) {
            const ts = require('typescript');
            const blocks = [];
            if (/\.mdx?$/.test(file)) {
                try {
                    const matter = require('gray-matter');
                    const parsed = matter(source);
                    const {getFormat} = require('@docusaurus/mdx-loader/lib/format.js');
                    const format = getFormat({
                        filePath: file,
                        frontMatterFormat: parsed.data.format,
                        markdownConfigFormat,
                    });
                    if (format === 'mdx') {
                        const {createProcessor} = await import('@mdx-js/mdx');
                        const tree = createProcessor({format}).parse(parsed.content);
                        const walk = n => {
                            if (n.type === 'mdxjsEsm') blocks.push(n.value);
                            for (const child of n.children ?? []) walk(child);
                        };
                        walk(tree);
                    }
                } catch {
                    uncertain = true;
                }
            } else blocks.push(source);
            for (const block of blocks) {
                const ast = ts.createSourceFile(
                    file,
                    block,
                    ts.ScriptTarget.Latest,
                    true,
                    /\.[cm]?ts$/.test(file) ? ts.ScriptKind.TS : ts.ScriptKind.TSX,
                );
                if (ast.parseDiagnostics.length) uncertain = true;
                const walk = node => {
                    if (
                        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
                        node.moduleSpecifier &&
                        ts.isStringLiteral(node.moduleSpecifier)
                    )
                        imports.push(node.moduleSpecifier.text);
                    if (
                        ts.isCallExpression(node) &&
                        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
                            node.expression.getText(ast) === 'require')
                    ) {
                        if (node.arguments[0] && ts.isStringLiteral(node.arguments[0]))
                            imports.push(node.arguments[0].text);
                        else uncertain = true;
                    }
                    ts.forEachChild(node, walk);
                };
                walk(ast);
            }
        }
        cache.set(file, {imports, uncertain});
    }
    for (const name of imports) {
        const base = name.startsWith('@site/')
            ? path.join(root, name.slice(6))
            : name.startsWith('.')
              ? path.resolve(path.dirname(file), name)
              : undefined;
        if (!base) continue;
        const child = [
            '',
            '.js',
            '.jsx',
            '.mjs',
            '.cjs',
            '.ts',
            '.tsx',
            '.mts',
            '.cts',
            '.mdx',
            '.md',
            '.json',
            '/index.js',
            '/index.jsx',
            '/index.ts',
            '/index.tsx',
        ]
            .map(ext => base + ext)
            .find(p => fs.existsSync(p) && fs.statSync(p).isFile());
        if (child) {
            const result = await dependencies(root, child, cache, seen, markdownConfigFormat);
            uncertain ||= result.uncertain;
        } else uncertain = true; // Deleted imports must still select their owners.
    }
    return {files: seen, uncertain};
}
function stateIdentities(root, files, base) {
    const changed = new Set();
    for (const file of files.filter(
        f => /^translations\/state\/[^/]+\//.test(f) && f.endsWith('.json'),
    )) {
        const parse = text => {
            const data = JSON.parse(text);
            return data.pages ?? (data.page ? [data.page] : data.docId ? [data] : []);
        };
        let before = [];
        try {
            before = parse(
                execFileSync('git', ['show', `${base}:${file}`], {
                    cwd: root,
                    encoding: 'utf8',
                    stdio: ['ignore', 'pipe', 'ignore'],
                    maxBuffer: 16 * 1024 * 1024,
                }),
            );
        } catch {}
        const after = fs.existsSync(path.join(root, file))
            ? parse(fs.readFileSync(path.join(root, file), 'utf8'))
            : [];
        const a = new Map(before.map(r => [id(r), JSON.stringify(r)])),
            b = new Map(after.map(r => [id(r), JSON.stringify(r)]));
        for (const k of new Set([...a.keys(), ...b.keys()]))
            if (a.get(k) !== b.get(k)) changed.add(k);
    }
    return changed;
}
async function selectDocs(props, plan) {
    const rows = rowsFor(props),
        {selected, add} = chooseRepresentatives(rows, props.siteDir);
    const changed = new Set(plan.files),
        changedStates = stateIdentities(props.siteDir, plan.files, plan.baseSha);
    for (const row of rows)
        if (row.aliases.some(f => changed.has(f)) || changedStates.has(id(row))) {
            add(row, 'changed document/state');
            // A state transition can replace the body in a generated locale
            // view even when its source file was not edited. Importers of that
            // document must be compiled too, including importers of doc routes.
            changed.add(gitPath(props.siteDir, sourceFile(props.siteDir, row.source)));
        }
    const dependenciesChanged = [...changed].filter(f =>
        /^(docs\/|versioned_docs\/|community\/|course\/|releasenotes\/|i18n\/|src\/|static\/)/.test(
            f,
        ),
    );
    if (dependenciesChanged.length) {
        const cache = new Map();
        for (const row of rows) {
            const result = await dependencies(
                props.siteDir,
                sourceFile(props.siteDir, row.source),
                cache,
                new Set(),
                props.siteConfig?.markdown?.format ?? 'mdx',
            );
            if (
                result.uncertain ||
                [...result.files].some(file => changed.has(gitPath(props.siteDir, file)))
            )
                add(
                    row,
                    result.uncertain
                        ? 'conservative dynamic/unparsed import'
                        : 'changed import dependency',
                );
        }
    }
    if (selected.size > 500) {
        const directory = path.join(props.siteDir, '.i18n-build/ci-sample/scopes');
        fs.mkdirSync(directory, {recursive: true});
        fs.writeFileSync(
            path.join(directory, props.i18n.currentLocale + '.selection.json'),
            JSON.stringify(
                {
                    status: 'selection-exceeded',
                    sourceSha: plan.sourceSha,
                    metadataDocs: rows.length,
                    selected: [...selected.values()],
                },
                null,
                2,
            ) + '\n',
        );
        throw new Error(
            `Sample expands to ${selected.size} documents; use the ci/full label or manual full validation instead of truncating affected documents`,
        );
    }
    return {rows, selected};
}
function prune(routes, docPaths, chosen, versions, inDocs = false) {
    const categories = new Set();
    function walk(route, parentDocs) {
        const docs = parentDocs || route.plugin?.name === 'docusaurus-plugin-content-docs';
        if (route.routes) {
            const children = route.routes.map(child => walk(child, docs)).filter(Boolean);
            return children.length ? {...route, routes: children} : undefined;
        }
        if (!docs) return route;
        if (docPaths.has(key(route.path))) return chosen.has(key(route.path)) ? route : undefined;
        if (/Redirect/.test(route.component)) return route;
        const group =
            versions.find(v => key(route.path).startsWith(key(v.path) + '/'))?.key ?? 'root';
        if (!categories.has(group)) {
            categories.add(group);
            return route;
        }
        return undefined;
    }
    return routes.map(route => walk(route, inDocs)).filter(Boolean);
}
function stripUnbuiltAnchors(collected, known, rendered, aliases) {
    let skipped = 0,
        metadataValidated = 0;
    const result = {};
    for (const [from, data] of Object.entries(collected))
        result[from] = {
            ...data,
            links: data.links.flatMap(link => {
                const url = new URL(link, 'https://ci.invalid' + from);
                const alias = aliases.get(key(url.pathname));
                const target = alias ? new URL(alias, 'https://ci.invalid') : url;
                if (alias && !target.hash) target.hash = url.hash;
                const targetKey = key(target.pathname);
                if (url.hash && known.has(targetKey) && !rendered.has(targetKey)) {
                    skipped++;
                    metadataValidated++;
                    return [];
                }
                if (!url.hash && known.has(targetKey)) {
                    metadataValidated++;
                    return [];
                }
                return [alias ? target.pathname + target.search + target.hash : link];
            }),
        };
    return {collected: result, skipped, metadataValidated};
}

async function install({root, outDir, locale, planFile}) {
    assert.equal(
        require('@docusaurus/core/package.json').version,
        '3.6.3',
        'Revalidate the CI-only Docusaurus adapter',
    );
    const plan = JSON.parse(fs.readFileSync(planFile));
    assert.equal(plan.mode, 'sample');
    assert.equal(plan.sourceSha, sha(root), 'Sample plan is stale');
    assert(plan.locales.includes(locale), 'Locale is outside the requested sample');
    const diff = require('node:crypto')
        .createHash('sha256')
        .update(
            execFileSync('git', ['diff', 'HEAD', '--binary'], {
                cwd: root,
                maxBuffer: 16 * 1024 * 1024,
            }),
        )
        .digest('hex');
    assert.equal(plan.trackedDiffHash, diff, 'Source changed after sample planning');
    const siteModule = require('@docusaurus/core/lib/server/site.js');
    const linksModule = require('@docusaurus/core/lib/server/brokenLinks.js');
    const originalSite = siteModule.loadSite,
        originalLinks = linksModule.handleBrokenLinks;
    const updates = require('@docusaurus/utils/lib/lastUpdateUtils.js'),
        readUpdate = updates.readLastUpdateData;
    let deferredDates = 0;
    // Timestamps are irrelevant to the full ID/route/sidebar census. Resolve
    // their real source data only for documents that will actually be rendered.
    updates.readLastUpdateData = async () => {
        deferredDates++;
        return {};
    };
    let scope,
        fullRoutes,
        aliases = new Map(),
        known,
        rendered;
    const scopeDir = path.join(root, '.i18n-build/ci-sample/scopes');
    fs.mkdirSync(scopeDir, {recursive: true});
    const save = () =>
        fs.writeFileSync(
            path.join(scopeDir, locale + '.json'),
            JSON.stringify(scope, null, 2) + '\n',
        );
    siteModule.loadSite = async args => {
        const started = Date.now();
        const site = await originalSite(args),
            props = site.props;
        fullRoutes = props.routes;
        const {rows, selected} = await selectDocs(props, plan);
        const docPaths = new Set(rows.map(r => key(r.route))),
            chosen = new Set([...selected.values()].map(x => key(x.row.route)));
        const versions = props.plugins
            .filter(p => p.name === 'docusaurus-plugin-content-docs')
            .flatMap(p =>
                p.content.loadedVersions.map(v => ({
                    path: v.path,
                    key: p.options.id + ':' + v.versionName,
                })),
            )
            .sort((a, b) => b.path.length - a.path.length);
        for (const plugin of props.plugins.filter(p => p.name === 'docusaurus-plugin-content-docs'))
            for (const version of plugin.content.loadedVersions)
                for (const doc of version.docs.filter(d => chosen.has(key(d.permalink)))) {
                    const state = doc.translation;
                    const file = state
                        ? path.resolve(
                              root,
                              state.contentLocale === 'en' ? state.englishPath : state.sourcePath,
                          )
                        : sourceFile(root, doc.source);
                    const utils = require('@docusaurus/utils');
                    const parsed = await props.siteConfig.markdown.parseFrontMatter({
                        filePath: file,
                        fileContent: fs.readFileSync(file, 'utf8'),
                        defaultParseFrontMatter: utils.DEFAULT_PARSE_FRONT_MATTER,
                    });
                    Object.assign(
                        doc,
                        await readUpdate(
                            file,
                            state?.useTarget
                                ? {...plugin.options, showLastUpdateTime: true}
                                : plugin.options,
                            parsed.frontMatter.last_update,
                        ),
                    );
                    fs.writeFileSync(
                        path.join(
                            props.generatedFilesDir,
                            'docusaurus-plugin-content-docs',
                            plugin.options.id,
                            utils.docuHash(doc.source) + '.json',
                        ),
                        JSON.stringify(doc, null, 2),
                    );
                }
        for (const route of flatten(fullRoutes)) {
            const row = rows.find(r => key(r.route) === key(route.path));
            if (row && chosen.has(key(row.route))) {
                const plugin = props.plugins.find(
                    p =>
                        p.name === 'docusaurus-plugin-content-docs' &&
                        p.options.id === row.pluginId,
                );
                const doc = plugin.content.loadedVersions
                    .find(v => v.versionName === row.version)
                    .docs.find(d => d.id === row.docId);
                route.metadata = {...route.metadata, lastUpdatedAt: doc.lastUpdatedAt};
            }
        }
        const pruned = prune(fullRoutes, docPaths, chosen, versions);
        const {getRoutesPaths} = require('@docusaurus/core/lib/server/routes.js');
        const allPaths = getRoutesPaths(fullRoutes, props.baseUrl);
        known = new Set(allPaths.map(key));
        const metadata = props.plugins.flatMap(p => p.content?.contentIdentity?.entries ?? []);
        for (const entry of metadata) known.add(key(entry.route));
        const pathSet = new Set(allPaths.map(key));
        const logical = [
            ...fullRoutes,
            ...metadata
                .filter(e => !pathSet.has(key(e.route)))
                .map(e => ({path: e.route, exact: true, component: 'metadata-only'})),
        ];
        for (const plugin of props.plugins.filter(
            p => p.name === 'docusaurus-plugin-client-redirects',
        )) {
            const context = {
                relativeRoutesPaths: allPaths.map(
                    p => '/' + p.slice(props.baseUrl.length).replace(/^\//, ''),
                ),
                baseUrl: props.baseUrl,
                outDir: props.outDir,
                options: plugin.options,
                siteConfig: props.siteConfig,
            };
            const redirects =
                require('@docusaurus/plugin-client-redirects/lib/collectRedirects').default(
                    context,
                    props.siteConfig.trailingSlash,
                );
            const absolute = value =>
                props.baseUrl.replace(/\/$/, '') + '/' + value.replace(/^\//, '');
            for (const redirect of redirects) {
                const from = absolute(redirect.from),
                    to = redirect.to.startsWith('/') ? absolute(redirect.to) : redirect.to;
                known.add(key(from));
                aliases.set(key(from), to);
                logical.push({path: from, exact: true, component: 'redirect-metadata'});
            }
            plugin.postBuild = async () => {
                const kept = redirects.filter(
                    r =>
                        !r.to.startsWith('/') || rendered.has(key(absolute(r.to).split(/[?#]/)[0])),
                );
                const write = require('@docusaurus/plugin-client-redirects/lib/writeRedirectFiles');
                await write.default(
                    write.toRedirectFiles(kept, context, props.siteConfig.trailingSlash),
                );
            };
        }
        // Static files are real public targets too. Do not invent routes for
        // missing resources merely to silence partial-build link checks.
        const walkStatic = (directory, prefix = '') => {
            if (!fs.existsSync(directory)) return;
            for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
                if (entry.name.startsWith('.')) continue;
                const relative = prefix + entry.name,
                    file = path.join(directory, entry.name);
                if (entry.isDirectory()) walkStatic(file, relative + '/');
                else {
                    known.add(key('/' + relative));
                    known.add(key(props.baseUrl + relative));
                }
            }
        };
        for (const directory of props.siteConfig.staticDirectories)
            walkStatic(path.resolve(root, directory));
        fullRoutes = logical;
        props.routes = pruned;
        props.routesPaths = getRoutesPaths(pruned, props.baseUrl);
        rendered = new Set(props.routesPaths.map(key));
        // Native search must index compiled bodies only, never metadata-only routes.
        for (const plugin of props.plugins.filter(
            p => p.name === 'docusaurus-plugin-content-docs',
        )) {
            for (const version of plugin.content.loadedVersions)
                version.docs = version.docs.filter(d => chosen.has(key(d.permalink)));
            if (plugin.content.translationManifest)
                plugin.content.translationManifest.pages =
                    plugin.content.translationManifest.pages.filter(p =>
                        rendered.has(key(p.permalink)),
                    );
        }
        const manifest = path.join(root, '.i18n-build/manifests', locale + '.json');
        if (fs.existsSync(manifest)) {
            const data = JSON.parse(fs.readFileSync(manifest));
            data.scope = {mode: 'sample', nativePages: data.pages.length};
            data.pages = data.pages.filter(p => rendered.has(key(p.permalink)));
            fs.writeFileSync(manifest, JSON.stringify(data, null, 2) + '\n');
        }
        await require('@docusaurus/core/lib/server/codegen/codegenRoutes').generateRouteFiles({
            generatedFilesDir: props.generatedFilesDir,
            routes: pruned,
            baseUrl: props.baseUrl,
        });
        scope = {
            schemaVersion: 1,
            mode: 'sample',
            status: 'planned',
            publicationAllowed: false,
            sourceSha: plan.sourceSha,
            locale,
            metadataDocs: rows.length,
            renderedDocs: selected.size,
            metadataLoadMs: Date.now() - started,
            deferredTimestampReads: deferredDates,
            metadataRoutes: known.size,
            compiledRoutes: props.routesPaths,
            selected: [...selected.values()].map(({row, reasons}) => ({...row, reasons})),
            knownRoutes: [...known],
            anchorChecksSkipped: 0,
        };
        props.plugins.push({
            name: 'ci-sample-provenance',
            configureWebpack(_config, isServer) {
                return {
                    plugins: [
                        {
                            apply(compiler) {
                                compiler.hooks.done.tap('CICompiledModules', stats => {
                                    const files = new Set(),
                                        seen = new Set();
                                    const visit = module => {
                                        if (seen.has(module)) return;
                                        seen.add(module);
                                        const resource = module.resource?.split('?')[0];
                                        if (
                                            resource?.startsWith(root + path.sep) &&
                                            /\.mdx?$/i.test(resource)
                                        )
                                            files.add(gitPath(root, resource));
                                        for (const child of module.modules ?? []) visit(child);
                                    };
                                    for (const module of stats.compilation.modules) visit(module);
                                    scope.compiledMdxModules ??= {};
                                    scope.compiledMdxModules[isServer ? 'server' : 'client'] = [
                                        ...files,
                                    ].sort();
                                    save();
                                });
                            },
                        },
                    ],
                };
            },
            async postBuild() {
                scope.status = 'compiled';
                save();
                fs.writeFileSync(
                    path.join(props.outDir, '.ci-validation.json'),
                    JSON.stringify({
                        schemaVersion: 1,
                        mode: 'sample',
                        publicationAllowed: false,
                        sourceSha: plan.sourceSha,
                    }) + '\n',
                );
            },
        });
        save();
        return site;
    };
    linksModule.handleBrokenLinks = async params => {
        const sanitized = stripUnbuiltAnchors(params.collectedLinks, known, rendered, aliases);
        scope.anchorChecksSkipped = sanitized.skipped;
        scope.linksValidatedFromMetadata = sanitized.metadataValidated;
        save();
        return originalLinks({...params, collectedLinks: sanitized.collected, routes: fullRoutes});
    };
    return () => {
        siteModule.loadSite = originalSite;
        linksModule.handleBrokenLinks = originalLinks;
        updates.readLastUpdateData = readUpdate;
    };
}
module.exports = {
    install,
    selectDocs,
    chooseRepresentatives,
    rowsFor,
    prune,
    dependencies,
    stripUnbuiltAnchors,
};
