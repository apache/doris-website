const messages = {
    en: {error: 'Search could not load.', retry: 'Retry'},
    'zh-CN': {error: '搜索加载失败。', retry: '重试'},
    ja: {error: '検索を読み込めませんでした。', retry: '再試行'},
    ko: {error: '검색을 불러오지 못했습니다.', retry: '다시 시도'},
    ru: {error: 'Не удалось загрузить поиск.', retry: 'Повторить'},
};
export function searchMessages(locale: string) {return messages[locale] ?? messages.en;}
