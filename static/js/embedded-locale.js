// Static Japanese labels for the homepage's shared illustration frames. The
// existing brand-theme bridge remains responsible for their colors.
(function () {
    if (new URLSearchParams(window.location.search).get('locale') !== 'ja') return;
    var labels = {
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
    var walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        var node = walker.currentNode;
        if (node.parentElement && /^(SCRIPT|STYLE)$/.test(node.parentElement.tagName)) continue;
        var text = node.nodeValue.trim();
        if (Object.prototype.hasOwnProperty.call(labels, text)) {
            node.nodeValue = node.nodeValue.replace(text, labels[text]);
        }
    }
    document.documentElement.lang = 'ja';
}());
