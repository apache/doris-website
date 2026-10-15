---
{
    "title": "Heap Profile によるメモリ分析",
    "language": "ja",
    "description": "Heap Profile ではプロセスのメモリ使用量とコールスタックをリアルタイムで確認できます。そのため、通常はコードについてある程度の知識が必要です。"
}
---

Heap Profile ではプロセスのメモリ使用量とコールスタックをリアルタイムで確認できます。そのため、通常はコードについてある程度の知識が必要です。Heap Profile が記録するのは仮想メモリである点に注意してください。設定を変更して Doris BE プロセスを再起動し、対象の現象を再現できる必要があります。

Doris はデフォルトのアロケータとして Jemalloc を使用します。Heap Profile を使用するには、次の手順に従ってください。

1. `prof_active:false` は `JEMALLOC_CONF` の設定値です。`be.conf` 内でこの値を `prof_active:true` に変更し、Doris BE を再起動します。

2. `curl http://be_host:8040/jeheap/dump` を実行すると、生成された `profile` ファイルを `${DORIS_HOME}/log` ディレクトリで確認できます。

3. `jeprof --dot ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file` を実行し、ターミナルに出力されたテキストを [オンラインの dot 描画サイト](http://www.webgraphviz.com/) に貼り付けて、メモリ割り当てのグラフを生成します。

上記の手順は Doris 2.1.8、3.0.4 以降のバージョンを対象とし、リアルタイムのメモリ分析に使用します。長期間にわたってメモリを観察する場合や、メモリ割り当て量の累積値を確認する場合は、[Jemalloc Heap Profile](https://doris.apache.org/community/developer-guide/debug-tool/?_highlight=debug#jemalloc-1) を参照してください。

Heap Profile のコールスタックで `Segment`、`TabletSchema`、`ColumnReader` などの項目がメモリ使用量の大きな割合を占めている場合は、メタデータが大量のメモリを占有していることを意味します。

クラスターを一定期間稼働させた後、アイドル状態になっても BE のメモリ使用量が減少せず、Heap Profile のコールスタックで `Agg`、`Join`、`Filter`、`Sort`、`Scan` などの項目がメモリ使用量の大きな割合を占めている場合があります。該当する時間帯の BE プロセスのメモリ監視でも継続的な増加傾向が見られるなら、メモリリークを疑う根拠があります。コールスタックを基にコードをさらに分析してください。

クラスターでタスクを実行中に、Heap Profile のコールスタックで `Agg`、`Join`、`Filter`、`Sort`、`Scan` などの項目がメモリ使用量の大きな割合を占めていても、タスク完了後にメモリが正常に解放されるなら、メモリの大部分は実行中のタスクに使われており、リークはありません。総メモリ使用量に占める `Label=query, Type=overview` Memory Tracker の値の割合が、Heap Profile で上記の項目を含むコールスタックのメモリ使用量の割合より小さい場合は、`Label=query, Type=overview` Memory Tracker の統計値が不正確であることを意味します。その場合は、速やかにコミュニティへ報告してください。
