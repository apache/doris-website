const messages = {
    en: {error: 'Search could not load.', retry: 'Retry', sourceOnly:'Search for this version is available in English.'},
    'zh-CN': {error: '搜索加载失败。', retry: '重试', sourceOnly:'此版本可在英文文档中搜索。'},
    ja: {error: '検索を読み込めませんでした。', retry: '再試行', sourceOnly:'このバージョンは英語のドキュメントで検索できます。'},
    ko: {error: '검색을 불러오지 못했습니다.', retry: '다시 시도', sourceOnly:'이 버전은 영어 문서에서 검색할 수 있습니다.'},
    ru: {error: 'Не удалось загрузить поиск.', retry: 'Повторить', sourceOnly:'Поиск по этой версии доступен в английской документации.'},
};
export function searchMessages(locale: string) {return messages[locale] ?? messages.en;}
