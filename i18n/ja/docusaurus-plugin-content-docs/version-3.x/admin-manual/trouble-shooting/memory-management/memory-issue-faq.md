---
{
  "title": "メモリ問題FAQ",
  "language": "ja",
  "description": "Doris BEプロセスのメモリ解析では、主にbe/log/be.INFOログ、BEプロセスのメモリ監視（Metrics）、Doris Bvar統計を使用します。"
}
---
Doris BEプロセスのメモリ分析は主に`be/log/be.INFO`ログ、BEプロセスメモリ監視（Metrics）、Doris Bvar統計を使用します。OOM Killerがトリガーされた場合は、`dmesg -T`の実行結果を収集する必要があります。queryまたはloadタスクのメモリを分析する場合は、Query Profileを収集する必要があります。この情報に基づいて一般的なメモリ問題を分析します。自分で問題を解決できない場合は、Doris開発者に支援を求める必要があります。どの方法を使用する場合でも（GithubでissueをSubmitする、Dorisフォーラムでissueを作成する、メールまたはWeChat）、上記の情報を問題の説明に追加してください。

まず現在観察されている現象がどのメモリ問題に属するかを特定し、さらに調査します。通常、最初にプロセスメモリログを分析する必要があります。[Memory Log Analysis](./memory-analysis/memory-log-analysis.md)を参照してください。一般的なメモリ問題を以下に示します。

## 1 QueryおよびLoadメモリ制限エラー

QueryおよびLoadエラーメッセージに`MEM_LIMIT_EXCEEDED`が表示される場合、プロセスの利用可能メモリが不足しているか、タスクが単一実行のメモリ制限を超えたため、タスクがキャンセルされたことを意味します。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED] xxxx .
```
エラーメッセージに`Process memory not enough`が含まれている場合、プロセスに利用可能メモリが不足していることを意味します。詳細な分析については、[クエリまたはロードエラー プロセスに利用可能メモリが不足](./memory-analysis/query-cancelled-after-process-memory-exceeded.md)を参照してください。

エラーメッセージに`memory tracker limit exceeded`が表示される場合、タスクが単一実行メモリ制限を超えていることを意味します。詳細な分析については、[クエリまたはロードエラー 単一実行メモリ制限超過](./memory-analysis/query-cancelled-after-query-memory-exceeded.md)を参照してください。

## 2 Doris BE OOMクラッシュ

BEプロセスがクラッシュした後、`log/be.out`にエラーメッセージがない場合は、`dmesg -T`を実行してください。`Out of memory: Killed process {pid} (doris_be)`が表示される場合、OOM Killerがトリガーされたことを意味します。詳細な分析については、[OOM Killerクラッシュ分析](./memory-analysis/oom-crash-analysis.md)を参照してください。

## 3 メモリリーク

> メモリリークが疑われる場合、最適な解決策は最新の3桁バージョンにアップグレードすることです。Doris 2.0を使用している場合は、Doris 2.0.xの最新バージョンにアップグレードしてください。他のユーザーも同様の現象に遭遇している可能性が高く、ほとんどのメモリリークはバージョンの反復で修正されているためです。

以下の現象が観察される場合、メモリリークが発生している可能性があります：

- Doris GrafanaまたはサーバーモニタリングでDoris BEプロセスのメモリが線形的に増加し続けており、クラスター上のタスクが停止してもメモリが減少しない。

- Memory Trackerに統計の欠落がある場合は、分析のため[Memory Tracker](./memory-feature/memory-tracker.md)を参照してください。

メモリリークは通常Memory Trackerの統計欠落を伴うため、分析方法も[Memory Tracker]セクションを参照してください。

## 4 Doris BEプロセスメモリが減少しない、または増加し続ける

Doris Grafanaまたはサーバーモニタリングで、Doris BEプロセスのメモリが線形的に増加し続けており、クラスター上のタスクが停止してもメモリが減少しない場合は、まず[Memory Tracker](./memory-feature/memory-tracker.md)の[Memory Tracker](./memory-feature/memory-tracker.md)を参照して、Memory Trackerに統計の欠落があるかどうかを分析してください。Memory Trackerに統計の欠落がある場合は、原因をさらに分析してください。

Memory Trackerに統計の欠落がなく、メモリの大部分を計上している場合は、[Overview](./overview.md)を参照して、Doris BEプロセスの異なる部分が過度にメモリを占有する理由と、そのメモリ使用量を削減する方法を分析してください。

## 5 大きな仮想メモリ使用量

`Label=process virtual memory` Memory Trackerはリアルタイムの仮想メモリサイズを表示します。これは`top -p {pid}`で確認できるDoris BEプロセスの仮想メモリと同じです。

```
MemTrackerLimiter Label=process virtual memory, Type=overview, Limit=-1.00 B(-1 B), Used=44.25 GB(47512956928 B), Peak=44.25 GB(47512956928 B)
```
Dorisには現在もDoris BEプロセスの仮想メモリが過大になる問題があり、通常はJemallocが大量の仮想メモリマッピングを保持することが原因で、これによりJemalloc Metadataが過度にメモリを占有することにもなります。Jemalloc Metadataメモリの分析については、[Jemalloc Memory Analysis](./memory-analysis/jemalloc-memory-analysis.md)を参照してください。

また、DorisのJoin OperatorとColumnにメモリ再利用が不足していることが知られており、これにより一部のシナリオでより多くの仮想メモリがリクエストされ、最終的にJemalloc Retainedにキャッシュされることになります。現在、良い解決策はありません。Doris BEプロセスを定期的に再起動することを推奨します。

## 6 BEプロセス開始直後にプロセスメモリが非常に大きい

これは通常、BEプロセス開始時にロードされるメタデータメモリが過大であることが原因です。Doris BE Bvarを確認するには、[Metadata Memory Analysis](./memory-analysis/metadata-memory-analysis.md)を参照してください。

- `doris_total_tablet_num`が過大な場合、通常はテーブルのパーティション数とバケット数が過大であることが原因です。`{fe_host}:{fe_http_port}/System?path=//dbs`を確認して、tablet数が多いテーブルを見つけてください。テーブルのtablet数は、そのパーティション数にバケット数を乗じた数と等しくなります。パーティション数とバケット数を減らしてみてください。または、使用されない古いテーブルやパーティションを削除してください。

- `doris_total_rowset_num`が大きいがtablet数が少ない場合は、`SHOW-PROC`ドキュメントを参照して、rowsetは多いがtabletが少ないテーブルを見つけ、手動でcompactionをトリガーするか、自動compactionの完了を待ってください。詳細については、メタデータ管理関連のドキュメントを参照してください。数十万のrowsetがある場合、メタデータが数GBを占有するのは正常です。

- `tablet_meta_schema_columns_count`が過大で、`doris_total_tablet_schema_num`の数百倍から数千倍になっている場合、クラスタ内に数百から数千のカラムを持つ大規模なワイドテーブルが存在することを意味します。この時、同数のtabletがより多くのメモリを占有します。

## 7 クエリに複雑なオペレータはないが単純にデータをスキャンするだけなのに、大量のメモリを使用する

Segmentを読み込む際に開かれるColumn ReaderとIndex Readが占有するメモリの可能性があります。Doris BE Bvarの`doris_total_segment_num`、`doris_column_reader_num`、`doris_ordinal_index_memory_bytes`、`doris_zone_map_memory_bytes`、`doris_short_key_index_memory_bytes`の変化を確認するには、[Metadata Memory Analysis](./memory-analysis/metadata-memory-analysis.md)を参照してください。この現象は大規模なワイドテーブルを読み込む際にもよく見られます。数十万のColumn Readerが開かれると、メモリが数十GB占有される可能性があります。

Heap Profileでメモリ占有率が大きいコールスタックに`Segment`と`ColumnReader`フィールドが表示される場合、Segmentを読み込む際に大量のメモリが占有されていることがほぼ確認できます。

この時は、SQLを修正してスキャンするデータ量を減らすか、テーブル作成時に指定するバケットサイズを小さくして、開くsegmentを少なくするしかありません。

## 8. Query Cancelが停止する

> Doris 2.1.3以前によく見られる

クエリ実行中にリクエストされるメモリの大部分は、クエリ終了時に解放される必要があります。プロセスメモリが十分な場合、通常はクエリの終了の速さや遅さに注意する必要はありません。しかし、プロセスメモリが不足している場合、プロセスがOOM Killerをトリガーすることを避けるため、特定の戦略に従ってクエリがキャンセルされ、そのメモリが解放されることがよくあります。この時、クエリキャンセルプロセスが停止してメモリが適時に解放できない場合、OOM Killerをトリガーするリスクが増加するだけでなく、プロセスメモリ不足により更に多くのクエリがキャンセルされる可能性もあります。

クエリがキャンセルされたことが分かっている場合、このQueryIDに基づいてキャンセルプロセスで停止しているかを分析します。まず、`grep {queryID} be/log/be.INFO`を実行して、`Cancel`キーワードを含む最初のログを見つけます。対応する時点がクエリがキャンセルされた時刻です。`deregister query/load memory tracker`キーワードを含むログを見つけます。対応する時点がクエリキャンセル完了の時刻です。最終的にOOM Killerがトリガーされ、`deregister query/load memory tracker`キーワードを含むログが見つからない場合、OOM Killerが発生するまでクエリがキャンセルされていないことを意味します。通常、クエリキャンセルプロセスに3秒以上かかる場合、クエリがキャンセルプロセスで停止しており、クエリ実行ログを更に分析する必要があります。

また、`grep {queryID} be/log/be.INFO`を実行後、`tasks is being canceled and has not been completed yet`キーワードを含むログが表示される場合、その後ろのQueryIDリストは、Memory GCの実行時に、これらのクエリがキャンセル中だが完了していないことが判明したことを意味します。この時、これらのクエリはスキップされ、他の場所でメモリの解放が継続されます。これはMemory GCの動作が期待通りかを判定するのに使用できます。
