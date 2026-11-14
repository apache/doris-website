(function (config) {
    try {
        var url = new URL(location.href);
        if (!/^https?:$/.test(url.protocol)) return;
        var base = config.baseUrl;
        var isRoot = url.pathname === base || (base !== '/' && url.pathname === base.slice(0, -1));
        var isLocaleRoot = config.locales.some(function (locale) {
            return locale !== config.defaultLocale && (url.pathname === base + locale + '/'
                || url.pathname === base + locale);
        });
        // A marker survives an erroneous host redirect back to the root, even
        // when both storage APIs are unavailable. Normal locale roots clean it.
        if ((isRoot || isLocaleRoot) && url.searchParams.get(config.loopParameter) === '1') {
            url.searchParams.delete(config.loopParameter);
            try {history.replaceState(history.state, '', url.pathname + url.search + url.hash);} catch (error) {}
            return;
        }
        if (!isRoot) return;
        // A single-locale development server may serve a non-English root.
        var htmlLanguage = document.documentElement.lang;
        if (htmlLanguage && htmlLanguage.toLowerCase().split('-')[0] !== config.defaultLocale) return;

        var now = Date.now();
        var selected;
        var manual = false;
        var params = url.searchParams.getAll('lang');
        if (params.length) {
            if (params.length !== 1 || config.locales.indexOf(params[0]) === -1) return;
            selected = params[0];
            manual = true;
            url.searchParams.delete('lang');
            try {localStorage.setItem(config.preferenceKey, JSON.stringify({version: 1, locale: selected, updatedAt: now}));} catch (error) {}
        }
        if (!selected) try {
            var saved = JSON.parse(localStorage.getItem(config.preferenceKey));
            if (saved && saved.version === 1 && config.locales.indexOf(saved.locale) !== -1
                && typeof saved.updatedAt === 'number' && isFinite(saved.updatedAt)
                && saved.updatedAt <= now && now - saved.updatedAt < config.preferenceMaxAge) {
                selected = saved.locale;
                manual = true;
            } else if (saved) localStorage.removeItem(config.preferenceKey);
        } catch (error) {}
        if (!selected && !config.enabled) return;
        if (!selected) try {
            var previous = JSON.parse(sessionStorage.getItem(config.sessionKey));
            if (previous && previous.version === 1 && previous.at <= now && now - previous.at < 60000) return;
        } catch (error) {}
        if (!selected) {
            var languages = [];
            try {languages = navigator.languages;} catch (error) {}
            if (!Array.isArray(languages) || !languages.length) {
                try {languages = [navigator.language];} catch (error) {languages = [];}
            }
            for (var i = 0; i < languages.length && !selected; i++) {
                var language = languages[i];
                if (typeof language !== 'string' || !/^[a-z]{2,3}(?:-[a-z0-9]{1,8})*$/i.test(language)) continue;
                var normalized = language.toLowerCase();
                var primary = normalized.split('-')[0];
                for (var j = 0; j < config.locales.length; j++) {
                    if (config.locales[j].toLowerCase() === normalized) {selected = config.locales[j]; break;}
                }
                if (!selected) for (var k = 0; k < config.locales.length; k++) {
                    if (config.locales[k].toLowerCase().split('-')[0] === primary) {selected = config.locales[k]; break;}
                }
            }
        }
        if (!selected) try {
            var zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            var regional = config.timeZones[zone];
            if (config.locales.indexOf(regional) !== -1) selected = regional;
        } catch (error) {}
        selected = selected || config.defaultLocale;
        var pathname = base + (selected === config.defaultLocale ? '' : selected + '/');
        if (pathname === url.pathname || (selected === config.defaultLocale && isRoot)) {
            if (manual && params.length) try {history.replaceState(history.state, '', pathname + url.search + url.hash);} catch (error) {}
            return;
        }
        if (!manual) try {sessionStorage.setItem(config.sessionKey, JSON.stringify({version: 1, at: now}));} catch (error) {}
        url.searchParams.set(config.loopParameter, '1');
        location.replace(pathname + url.search + url.hash);
    } catch (error) {
        // Leave the server-rendered English page readable on every failure path.
    }
})
