// Labels for the homepage's shared illustration frames. The frames are plain
// HTML outside the Docusaurus dictionaries, so they ask for their locale with
// ?locale=<code> and pick the matching dictionary here; a locale without one
// keeps the frame's own text. Adding a language means adding its dictionary.
// Chinese landing bodies intentionally use the English illustrations.
// The existing brand-theme bridge remains responsible for their colors.
(function () {
    var dictionaries = {};
    dictionaries.ja = {
        'Apache Doris Lakehouse Analytics': 'Apache Doris レイクハウス分析',
        'OPEN DATA LAKE': 'オープンデータレイク',
        'LAKEHOUSE ANALYTICS ENGINE': 'レイクハウス分析エンジン',
        'Apache Doris — Hybrid Search': 'Apache Doris ハイブリッド検索',
        'RAG · Semantic Retrieval': 'RAG · セマンティック検索',
        'Vector · Full-text · BM25 fusion': 'ベクトル · 全文 · BM25 の統合',
        'Agent Observability': 'エージェントのオブザーバビリティ',
        'Agent A': 'エージェント A',
        'Agent B': 'エージェント B',
        'trace · span · log': 'トレース · スパン · ログ',
        'Distributed tracing': '分散トレース',
        'Multimodal Processing': 'マルチモーダル処理',
        'Text': 'テキスト',
        'Audio': '音声',
        'Video': '動画',
        'Embedding · Index · Query': '埋め込み · インデックス · クエリ',
        'Apache Doris — Real-Time Analytics': 'Apache Doris リアルタイム分析',
        'Apps': 'アプリ',
        'Live Query Performance': 'リアルタイムのクエリ性能',
        'LIVE': 'リアルタイム',
        '▲ peak 10,500+': '▲ ピーク 10,500+',
        'LATENCY': 'レイテンシ',
        '▼ well below 1s': '▼ 1 秒を大幅に下回る',
        '1s threshold': '1 秒のしきい値',
        'LOAD THROUGHPUT': '取り込みスループット',
        '▲ peak 12,400+ · ingest rate': '▲ ピーク 12,400+ · 取り込み速度',
        'Real-time data. Real-time insight.': 'リアルタイムのデータから、リアルタイムのインサイトへ。',
    };
    dictionaries["ko"] = {
    "Apache Doris Lakehouse Analytics": "Apache Doris 레이크하우스 분석",
    "OPEN DATA LAKE": "오픈 데이터 레이크",
    "LAKEHOUSE ANALYTICS ENGINE": "레이크하우스 분석 엔진",
    "Apache Doris — Hybrid Search": "Apache Doris 하이브리드 검색",
    "RAG · Semantic Retrieval": "RAG · 의미 검색",
    "Vector · Full-text · BM25 fusion": "벡터 · 전문 · BM25 융합",
    "Agent Observability": "에이전트 관측 가능성",
    "Agent A": "에이전트 A",
    "Agent B": "에이전트 B",
    "trace · span · log": "추적 · 스팬 · 로그",
    "Distributed tracing": "분산 추적",
    "Multimodal Processing": "멀티모달 처리",
    "Text": "텍스트",
    "Audio": "오디오",
    "Video": "비디오",
    "Embedding · Index · Query": "임베딩 · 인덱스 · 쿼리",
    "Apache Doris — Real-Time Analytics": "Apache Doris 실시간 분석",
    "Apps": "앱",
    "Live Query Performance": "실시간 쿼리 성능",
    "LIVE": "실시간",
    "▲ peak 10,500+": "▲ 최대 10,500+",
    "LATENCY": "지연 시간",
    "▼ well below 1s": "▼ 1초보다 훨씬 낮음",
    "1s threshold": "1초 임계값",
    "LOAD THROUGHPUT": "수집 처리량",
    "▲ peak 12,400+ · ingest rate": "▲ 최대 12,400+ · 수집 속도",
    "Real-time data. Real-time insight.": "실시간 데이터. 실시간 인사이트."
};
    dictionaries["ru"] = {
    "Apache Doris Lakehouse Analytics": "Аналитика Lakehouse в Apache Doris",
    "OPEN DATA LAKE": "ОТКРЫТОЕ ОЗЕРО ДАННЫХ",
    "LAKEHOUSE ANALYTICS ENGINE": "ДВИЖОК АНАЛИТИКИ LAKEHOUSE",
    "Apache Doris — Hybrid Search": "Гибридный поиск Apache Doris",
    "RAG · Semantic Retrieval": "RAG · Семантический поиск",
    "Vector · Full-text · BM25 fusion": "Векторы · Полный текст · Слияние BM25",
    "Agent Observability": "Наблюдаемость агентов",
    "Agent A": "Агент A",
    "Agent B": "Агент B",
    "trace · span · log": "трассировка · спан · журнал",
    "Distributed tracing": "Распределённая трассировка",
    "Multimodal Processing": "Мультимодальная обработка",
    "Text": "Текст",
    "Audio": "Аудио",
    "Video": "Видео",
    "Embedding · Index · Query": "Эмбеддинг · Индекс · Запрос",
    "Apache Doris — Real-Time Analytics": "Аналитика реального времени Apache Doris",
    "Apps": "Приложения",
    "Live Query Performance": "Производительность запросов",
    "LIVE": "В РЕАЛЬНОМ ВРЕМЕНИ",
    "▲ peak 10,500+": "▲ пик 10 500+",
    "LATENCY": "ЗАДЕРЖКА",
    "▼ well below 1s": "▼ значительно меньше 1 с",
    "1s threshold": "порог 1 с",
    "LOAD THROUGHPUT": "СКОРОСТЬ ЗАГРУЗКИ",
    "▲ peak 12,400+ · ingest rate": "▲ пик 12 400+ · скорость загрузки",
    "Real-time data. Real-time insight.": "Данные и аналитика в реальном времени."
};
    var locale = new URLSearchParams(window.location.search).get('locale');
    var labels = Object.prototype.hasOwnProperty.call(dictionaries, locale || '') && dictionaries[locale];
    if (!labels) return;
    var walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        var node = walker.currentNode;
        if (node.parentElement && /^(SCRIPT|STYLE)$/.test(node.parentElement.tagName)) continue;
        var text = node.nodeValue.trim();
        if (Object.prototype.hasOwnProperty.call(labels, text)) {
            var svgText = node.parentElement;
            var originalWidth = typeof svgText.getComputedTextLength === 'function' ? svgText.getComputedTextLength() : 0;
            node.nodeValue = node.nodeValue.replace(text, labels[text]);
            // Preserve the illustration's allocated label width in long locales.
            if (originalWidth > 0 && svgText.getComputedTextLength() > originalWidth) {
                svgText.setAttribute('textLength', originalWidth);
                svgText.setAttribute('lengthAdjust', 'spacingAndGlyphs');
            }
        }
    }
    document.documentElement.lang = locale;
}());
