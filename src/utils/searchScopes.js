const pathOf = item => typeof item === 'string' ? item : item.path;
export const versionId = version => version?.path?.split('/').filter(Boolean).pop();
export const defaultSearchVersion = versions => versionId(versions.find(version => version.isLast) ?? versions[0]) ?? 'dev';

// Source-language indexes use ctx=docs plus a version path. Managed languages
// use ctx=docs/<version>. Translate that logical scope, not just the URL prefix.
export function resolveSearchScope({context = '', version = ''}, {contexts = [], versions = [], managed = false} = {}) {
    const paths = contexts.map(pathOf), fallback = managed ? '' : paths[0] ?? '';
    if (context && context !== 'docs' && !context.startsWith('docs/') && paths.includes(context))
        return {context, version:'', sourceOnlyVersion:null};
    const requested = context.startsWith('docs/') ? context.slice(5)
        : version.match(/^\/?docs\/([^/]+)\/?$/)?.[1];
    const known = versions.map(versionId);
    if (context === 'docs' || context.startsWith('docs/') || requested) {
        const selected = known.includes(requested) ? requested : defaultSearchVersion(versions);
        if (managed) {
            const target = 'docs/' + selected;
            return paths.includes(target) ? {context:target,version:'',sourceOnlyVersion:null}
                : {context:'',version:'docs/'+selected+'/',sourceOnlyVersion:selected};
        }
        return {context:paths.includes('docs')?'docs':fallback,
            version:selected === defaultSearchVersion(versions) ? '' : 'docs/'+selected+'/',sourceOnlyVersion:null};
    }
    return {context:paths.includes(context)?context:fallback,version:'',sourceOnlyVersion:null};
}

export function convertSearchParams(params, options) {
    const result = new URLSearchParams(params);
    const scope = resolveSearchScope({context:result.get('ctx')??'',version:result.get('version')??''},options);
    const context = scope.sourceOnlyVersion ? 'docs' : scope.context;
    if (context) result.set('ctx',context); else result.delete('ctx');
    if (scope.version) result.set('version',scope.version); else result.delete('version');
    return result;
}

export function docSearchSourceVersion(pathname, versions, contexts) {
    const version = versions.filter(value => pathname === value.path || pathname.startsWith(value.path.replace(/\/$/,'')+'/'))
        .sort((a,b)=>b.path.length-a.path.length)[0];
    const id = versionId(version);
    return id && !contexts.map(pathOf).includes('docs/'+id) ? id : null;
}
