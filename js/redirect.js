(function () {
    // const hash = (location.hash || '').replace('#', '');
    // const search = (location.search || '').replace('?', '');
    // const lang = navigator.language || navigator.userLanguage;
    // const firstLoad = JSON.parse(sessionStorage.getItem('firstLoad') || 'true');
    // const bowerLang = lang.indexOf('zh') > -1 ? 'zh-CN' : 'en';
    // const urlLang = location.pathname.indexOf('/zh-CN/') === 0 ? 'zh-CN' : 'en';
    // if (urlLang === 'zh-CN') return;
    // if (bowerLang !== urlLang && firstLoad) {
    //     location.href = `${location.origin}/${lang === 'zh-CN' ? 'zh-CN' : ''}${
    //         lang === 'zh-CN' ? location.pathname : location.pathname.split('zh-CN/')[1]
    //     }${search ? '?' + search : ''}${hash ? '#' + hash : ''}`;
    // }
    // sessionStorage.setItem('firstLoad', 'false');
    const lang = location.pathname.indexOf('/zh-CN/') === 0 ? 'zh-CN' : 'en';
    if (!sessionStorage.getItem('firstLoad')) {
        sessionStorage.setItem('firstLoad', 'false');
        if (localStorage.getItem('lang') && localStorage.getItem('lang') !== lang) {
            const hash = (location.hash || '').replace('#', '');
            const search = (location.search || '').replace('?', '');
            location.href = `${location.origin}/${localStorage.getItem('lang') === 'zh-CN' ? 'zh-CN' : ''}${
                localStorage.getItem('lang') === 'zh-CN' ? location.pathname : location.pathname.split('zh-CN/')[1]
            }${search ? '?' + search : ''}${hash ? '#' + hash : ''}`;
        } else {
            localStorage.setItem('lang', lang);
        }
    } else {
        localStorage.setItem('lang', lang);
    }
})();
