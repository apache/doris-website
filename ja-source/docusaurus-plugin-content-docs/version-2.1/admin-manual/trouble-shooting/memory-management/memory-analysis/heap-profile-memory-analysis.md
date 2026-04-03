---
{
  "title": "ヒーププロファイルメモリ解析",
  "language": "ja",
  "description": "Heap Profileは、プロセスメモリ使用量とコールスタックのリアルタイム表示をサポートしているため、通常はコードについてある程度の理解が必要です。"
}
---
Heap Profileは、プロセスのメモリ使用量とコールスタックのリアルタイム表示をサポートしているため、通常はコードについてある程度の理解が必要です。Heap Profileは仮想メモリを記録することに注意してください。設定を変更してDoris BEプロセスを再起動し、現象を再現する必要があります。

DorisはデフォルトのAllocatorとしてJemallocを使用しています。Heap Profileを使用するには、以下の方法を参照してください。

1. `be.conf`の`JEMALLOC_CONF`の`prof_active:false`を`prof_active:true`に変更し、Doris BEを再起動します。

2. `curl http://be_host:8040/jeheap/dump`を実行すると、`${DORIS_HOME}/log`ディレクトリに生成された`profile`ファイルが表示されます。

3. `jeprof --dot ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file`を実行した後、ターミナルが出力したテキストを[オンラインdot描画サイト](http://www.webgraphviz.com/)に貼り付けて、メモリ割り当てグラフを生成します。

上記のプロセスは、リアルタイムメモリ分析に使用されるDoris 2.1.8および3.0.4以降のバージョンに基づいています。長期間にわたってメモリを観察する必要がある場合、またはメモリアプリケーションの累積値を観察する場合は、Jemalloc Heap Profileの使用に関する詳細について[Jemalloc Heap Profile](https://doris.apache.org/community/developer-guide/debug-tool/?_highlight=debug#jemalloc-1)を参照してください。

Heap Profileのコールスタックで`Segment`、`TabletSchema`、`ColumnReader`フィールドのメモリ使用率が大きい場合、メタデータが大量のメモリを占有していることを意味します。

クラスターが一定期間実行された後、アイドル状態でもBEメモリが減少しない場合、Heap Profileのコールスタックで`Agg`、`Join`、`Filter`、`Sort`、`Scan`などのフィールドのメモリ使用率が大きいことが確認できます。対応する時間帯のBEプロセスメモリ監視が継続的な上昇傾向を示している場合、メモリリークが発生している疑いがあります。コールスタックに基づいてコードの分析を続行してください。

クラスターでタスクを実行している間にHeap Profileのコールスタックで`Agg`、`Join`、`Filter`、`Sort`、`Scan`などのフィールドのメモリ使用率が大きく、タスク完了後にメモリが正常に解放される場合、メモリの大部分は実行中のタスクによって使用されており、リークはないことを意味します。`Label=query, Type=overview` Memory Trackerの値が、Heap Profileで上記フィールドを含むメモリコールスタックよりも総メモリに占める割合が小さい場合、`Label=query, Type=overview` Memory Trackerの統計が不正確であることを意味し、コミュニティでタイムリーなフィードバックを提供できます。
