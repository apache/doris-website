const messages = {
    en: {choose: 'Language', fallback: 'This page is currently available in English.', english: 'Read the English original', note: 'English content', reset: 'Reset saved language', resetDone: 'Saved language preference cleared.', resetFailed: 'Unable to clear the saved language in this browser.'},
    'zh-CN': {choose: '语言', fallback: '此页暂时显示英文正文。', english: '阅读英文原文', note: '英文正文', reset: '清除已保存的语言', resetDone: '已清除保存的语言偏好。', resetFailed: '此浏览器无法清除已保存的语言偏好。'},
    ja: {choose: '言語', fallback: 'このページの本文は現在英語で表示されています。', english: '英語の原文を読む', note: '本文は英語', reset: '保存した言語設定をリセット', resetDone: '保存した言語設定を消去しました。', resetFailed: 'このブラウザーでは保存した言語設定を消去できません。'},
    ko: {choose: '언어', fallback: '이 페이지의 본문은 현재 영어로 제공됩니다.', english: '영어 원문 읽기', note: '영어 본문', reset: '저장된 언어 설정 초기화', resetDone: '저장된 언어 설정을 삭제했습니다.', resetFailed: '이 브라우저에서 저장된 언어 설정을 삭제할 수 없습니다.'},
    ru: {choose: 'Язык', fallback: 'Содержимое этой страницы пока доступно на английском языке.', english: 'Читать оригинал на английском', note: 'Текст на английском', reset: 'Сбросить сохранённый язык', resetDone: 'Сохранённые языковые настройки сброшены.', resetFailed: 'Не удалось сбросить языковые настройки в этом браузере.'},
};
export function languageMessages(locale: string) {return messages[locale] ?? messages.en;}
