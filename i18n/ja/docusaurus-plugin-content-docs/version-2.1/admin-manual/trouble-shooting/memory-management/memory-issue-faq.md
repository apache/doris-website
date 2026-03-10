---
{
  "title": "メモリ問題 FAQ",
  "language": "ja",
  "description": "Doris BEプロセスメモリ分析は主にbe/log/be.INFOログ、BEプロセスメモリモニタリング（Metrics）、Doris Bvar統計を使用します。"
}
---
Doris BEプロセスのメモリ解析は主に`be/log/be.INFO`ログ、BEプロセスのメモリ監視（Metrics）、Doris Bvar統計を使用します。OOM Killerが発動した場合は、`dmesg -T`の実行結果を収集する必要があります。クエリやloadタスクのメモリを解析する場合は、Query Profileを収集する必要があります。この情報に基づいて一般的なメモリ問題を解析します。自分で問題を解決できない場合は、Doris開発者に支援を求める必要があります。どの方法を使用する場合でも（GithubでのIssue提出、DorisフォーラムでのIssue作成、メールやWeChat）、問題の説明に上記の情報を追加してください。

最初に、現在観察されている現象がどのメモリ問題に該当するかを特定し、さらに調査します。通常、まずプロセスメモリログを解析する必要があります。[Memory Log Analysis](./memory-analysis/memory-log-analysis.md)を参照してください。一般的なメモリ問題を以下に示します。

## 1 クエリとloadのメモリ制限エラー

クエリとloadのエラーメッセージに`MEM_LIMIT_EXCEEDED`が表示される場合、プロセスで利用可能なメモリが不足しているか、タスクが単一実行のメモリ制限を超過したためにタスクがキャンセルされたことを意味します。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED] xxxx .
```
エラーメッセージに`Process memory not enough`が含まれている場合、プロセスの利用可能メモリが不足していることを意味します。詳細な分析については、[Query or load error process has insufficient available memory](./memory-analysis/query-cancelled-after-process-memory-exceeded.md)を参照してください。

エラーメッセージに`memory tracker limit exceeded`が表示される場合、タスクが単一実行メモリ制限を超えていることを意味します。詳細な分析については、[Query or load error exceeds single execution memory limit](./memory-analysis/query-cancelled-after-query-memory-exceeded.md)を参照してください。

## 2 Doris BE OOMクラッシュ

BEプロセスがクラッシュした後に`log/be.out`にエラーメッセージがない場合、`dmesg -T`を実行してください。`Out of memory: Killed process {pid} (doris_be)`が表示される場合、OOM Killerがトリガーされたことを意味します。詳細な分析については、[OOM Killer Crash Analysis](./memory-analysis/oom-crash-analysis.md)を参照してください。

## 3 メモリリーク

> メモリリークの疑いがある場合、最良の解決策は最新の3桁バージョンにアップグレードすることです。Doris 2.0を使用している場合は、Doris 2.0.xの最新バージョンにアップグレードしてください。他の人が同じ現象に遭遇している可能性が高く、ほとんどのメモリリークはバージョンの反復で修正されているためです。

以下の現象が観察される場合、メモリリークが発生している可能性があります：

- Doris GrafanaやサーバーモニタリングでDoris BEプロセスのメモリが線形に増加し続けており、クラスター上のタスクが停止した後もメモリが減少しない。

- Memory Trackerで統計の欠落がある場合、分析については[Memory Tracker](./memory-feature/memory-tracker.md)を参照してください。

メモリリークは通常Memory Trackerの統計欠落を伴うため、分析方法も[Memory Tracker]の章を参照してください。

## 4 Doris BEプロセスメモリが減少しない、または増加し続ける

Doris Grafanaやサーバーモニタリングで、Doris BEプロセスのメモリが線形に増加し続けており、クラスター上のタスクが停止した後もメモリが減少しない場合、まず[Memory Tracker](./memory-feature/memory-tracker.md)の[Memory Tracker](./memory-feature/memory-tracker.md)を参照して、Memory Trackerに統計の欠落があるかどうかを分析してください。Memory Trackerに統計の欠落がある場合は、その原因をさらに分析してください。

Memory Trackerに統計の欠落がなく、メモリの大部分をカウントしている場合は、[Overview](./overview.md)を参照して、Doris BEプロセスの異なる部分がメモリを過度に占有している理由とメモリ使用量を削減する方法を分析してください。

## 5 大量の仮想メモリ使用

`Label=process virtual memory`のMemory Trackerはリアルタイムの仮想メモリサイズを表示し、これは`top -p {pid}`で表示されるDoris BEプロセスの仮想メモリと同じです。

```
MemTrackerLimiter Label=process virtual memory, Type=overview, Limit=-1.00 B(-1 B), Used=44.25 GB(47512956928 B), Peak=44.25 GB(47512956928 B)
```
Dorisには現在もDoris BEプロセスの仮想メモリが大きすぎるという問題があります。これは通常、Jemallocが大量の仮想メモリマッピングを保持しているためで、Jemalloc Metadataが過度にメモリを占有する原因にもなります。Jemalloc Metadataメモリの分析については[Jemalloc Memory Analysis](./memory-analysis/jemalloc-memory-analysis.md)を参照してください。

さらに、DorisのJoin OperatorとColumnにはメモリ再利用の仕組みがないため、一部のシナリオでより多くの仮想メモリが要求され、最終的にJemalloc Retainedにキャッシュされることが知られています。現在のところ良い解決策はありません。Doris BEプロセスを定期的に再起動することを推奨します。

## 6 BEプロセス起動直後にプロセスメモリが非常に大きい

これは通常、BEプロセス起動時に読み込まれるメタデータメモリが大きすぎるためです。Doris BE Bvarを確認するには[Metadata Memory Analysis](./memory-analysis/metadata-memory-analysis.md)を参照してください。

- `doris_total_tablet_num`が過度に大きい場合、通常はテーブルのパーティション数とバケット数が大きすぎることが原因です。`{fe_host}:{fe_http_port}/System?path=//dbs`をチェックして、tablet数の多いテーブルを見つけてください。テーブルのtablet数は、そのパーティション数にバケット数を掛けた数と等しくなります。パーティション数とバケット数を削減するか、使用されない古いテーブルやパーティションを削除してください。

- `doris_total_rowset_num`が大きいがtablet数が少ない場合、`SHOW-PROC`ドキュメントを参照してrowsetが多くtabletが少ないテーブルを見つけ、手動でcompactionをトリガーするか、自動compactionの完了を待ってください。詳細はメタデータ管理関連のドキュメントを参照してください。数十万のrowsetがある場合、メタデータが数GB占有するのは正常です。

- `tablet_meta_schema_columns_count`が大きく、`doris_total_tablet_schema_num`の数百倍または数千倍になっている場合、クラスター内に数百または数千のカラムを持つ大きなワイドテーブルがあることを意味します。この場合、同数のtabletがより多くのメモリを占有します。

## 7 クエリに複雑なオペレーターはなく単純にデータをスキャンするだけなのに、大量のメモリを使用する

Segmentの読み取り時に開かれるColumn ReaderとIndex Readが占有するメモリの可能性があります。Doris BE Bvarの`doris_total_segment_num`、`doris_column_reader_num`、`doris_ordinal_index_memory_bytes`、`doris_zone_map_memory_bytes`、`doris_short_key_index_memory_bytes`の変化を確認するには[Metadata Memory Analysis](./memory-analysis/metadata-memory-analysis.md)を参照してください。この現象は大きなワイドテーブルを読み取る際にもよく見られます。数十万のColumn Readerが開かれると、メモリは数十GB占有する可能性があります。

Heap Profileで`Segment`と`ColumnReader`フィールドが大きなメモリシェアを持つコールスタックが見られる場合、Segmentの読み取り時に大量のメモリが占有されていることがほぼ確認できます。

この場合、SQLを変更してスキャンするデータ量を削減するか、テーブル作成時に指定するバケットサイズを削減して開くセグメント数を減らすしかありません。

## 8. Query Cancelのスタック

> Doris 2.1.3以前でよく見られる

クエリ実行中に要求されるメモリの大部分は、クエリ終了時に解放される必要があります。プロセスメモリが十分な場合、通常はクエリの終了速度について注意を払う必要はありません。しかし、プロセスメモリが不足している場合、一定の戦略に従って一部のクエリがキャンセルされ、そのメモリを解放してプロセスがOOM Killerをトリガーすることを回避します。この時、クエリキャンセルプロセスがスタックしてメモリが適時に解放されない場合、OOM Killerをトリガーするリスクを増加させることに加えて、プロセスメモリ不足により更に多くのクエリがキャンセルされる原因となる可能性があります。

クエリがキャンセルされることが判明している場合、このQueryIDに基づいてキャンセルプロセスでスタックしているかを分析します。まず、`grep {queryID} be/log/be.INFO`を実行して`Cancel`キーワードを含む最初のログを見つけます。対応する時点がクエリキャンセル時刻です。`deregister query/load memory tracker`キーワードを含むログを見つけます。対応する時点がクエリキャンセル完了時刻です。最終的にOOM Killerがトリガーされ、`deregister query/load memory tracker`キーワードを含むログが見つからない場合、OOM Killerが発生するまでクエリがキャンセルされていないことを意味します。通常、クエリキャンセルプロセスが3s以上かかる場合、クエリがキャンセルプロセスでスタックしており、クエリ実行ログをさらに分析する必要があります。

さらに、`grep {queryID} be/log/be.INFO`実行後、`tasks is being canceled and has not been completed yet`キーワードを含むログが見られる場合、その後ろのQueryIDリストは、Memory GC実行時にこれらのクエリがキャンセル中だが完了していないことが発見されたことを意味します。この時、これらのクエリはスキップされ、他の場所でメモリ解放が継続されます。これはMemory GCの動作が期待通りかを判断するのに使用できます。
