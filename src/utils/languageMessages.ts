const messages = {
    en: {choose: 'Language', fallback: 'This page is currently available in English.', english: 'Read the English original', note: 'English content'},
    'zh-CN': {choose: '语言', fallback: '此页暂时显示英文正文。', english: '阅读英文原文', note: '英文正文'},
    ja: {choose: '言語', fallback: 'このページの本文は現在英語で表示されています。', english: '英語の原文を読む', note: '本文は英語'},
    ko: {choose: '언어', fallback: '이 페이지의 본문은 현재 영어로 제공됩니다.', english: '영어 원문 읽기', note: '영어 본문'},
    ru: {choose: 'Язык', fallback: 'Содержимое этой страницы пока доступно на английском языке.', english: 'Читать оригинал на английском', note: 'Текст на английском'},
};
export function languageMessages(locale: string) {return messages[locale] ?? messages.en;}
