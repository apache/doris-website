---
{
  "title": "メモリ問題FAQ",
  "language": "ja",
  "description": "Doris BEプロセスメモリ分析は主にbe/log/be.INFOログ、BEプロセスメモリ監視（Metrics）、Doris Bvar統計を使用します。"
}
---
Doris BEプロセスメモリ解析は主に`be/log/be.INFO`ログ、BEプロセスメモリ監視（Metrics）、Doris Bvar統計を使用します。OOM Killerがトリガーされた場合は、`dmesg -T`の実行結果を収集する必要があります。クエリまたはロードタスクのメモリを分析する場合は、Query Profileを収集する必要があります。この情報に基づいて一般的なメモリ問題を分析します。自分で問題を解決できない場合は、Doris開発者に支援を求める必要があります。どの方法を使用する場合でも（Githubでissueを提出、Dorisフォーラムでissueを作成、メールまたはWeChat）、問題の説明に上記の情報を追加してください。

まず、現在観察されている現象がどのメモリ問題に該当するかを特定し、さらに調査します。通常、プロセスメモリログを最初に分析する必要があります。[Memory Log Analysis](./memory-analysis/memory-log-analysis.md)を参照してください。一般的なメモリ問題を以下に示します。

## 1 クエリおよびロードメモリ制限エラー

クエリおよびロードエラーメッセージで`MEM_LIMIT_EXCEEDED`が表示される場合、プロセスの利用可能メモリが不足しているか、タスクが単一実行のメモリ制限を超えているため、タスクがキャンセルされたことを意味します。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED] xxxx .
```
エラーメッセージに`Process memory not enough`が含まれている場合、プロセスで利用可能なメモリが不足していることを意味します。詳細な分析については、[Query or load error process has insufficient available memory](./memory-analysis/query-cancelled-after-process-memory-exceeded.md)を参照してください。

エラーメッセージに`memory tracker limit exceeded`が表示される場合、タスクが単一実行メモリ制限を超えていることを意味します。詳細な分析については、[Query or load error exceeds single execution memory limit](./memory-analysis/query-cancelled-after-query-memory-exceeded.md)を参照してください。

## 2 Doris BE OOMクラッシュ

BEプロセスがクラッシュした後に`log/be.out`にエラーメッセージがない場合は、`dmesg -T`を実行してください。`Out of memory: Killed process {pid} (doris_be)`が表示される場合、OOM Killerがトリガーされたことを意味します。詳細な分析については、[OOM Killer Crash Analysis](./memory-analysis/oom-crash-analysis.md)を参照してください。

## 3 メモリリーク

> メモリリークが疑われる場合、最善の解決策は最新の3桁バージョンにアップグレードすることです。Doris 2.0を使用している場合は、Doris 2.0.xの最新バージョンにアップグレードしてください。他の人が同じ現象に遭遇している可能性が高く、ほとんどのメモリリークはバージョンの反復で修正されているためです。

以下の現象が観察される場合、メモリリークが発生している可能性があります：

- Doris GrafanaまたはサーバーモニタリングでDoris BEプロセスのメモリが線形に増加し続けており、クラスター上のタスクが停止した後もメモリが減少しない。

- Memory Trackerに統計の欠落がある場合は、分析のために[Memory Tracker](./memory-feature/memory-tracker.md)を参照してください。

メモリリークは通常Memory Trackerでの統計の欠落を伴うため、分析方法についても[Memory Tracker]のセクションを参照してください。

## 4 Doris BEプロセスメモリが減少しないまたは増加し続ける

Doris Grafanaまたはサーバーモニタリングで、Doris BEプロセスのメモリが線形に増加し続けており、クラスター上のタスクが停止した後もメモリが減少しない場合は、まず[Memory Tracker](./memory-feature/memory-tracker.md)の[Memory Tracker](./memory-feature/memory-tracker.md)を参照して、Memory Trackerに統計の欠落があるかどうかを分析してください。Memory Trackerに統計の欠落がある場合は、その原因をさらに分析してください。

Memory Trackerに統計の欠落がなく、ほとんどのメモリがカウントされている場合は、[Overview](./overview.md)を参照して、Doris BEプロセスの異なる部分が過度にメモリを占有する理由とそのメモリ使用量を削減する方法を分析してください。

## 5 仮想メモリ使用量が大きい場合

`Label=process virtual memory` Memory Trackerは、リアルタイムの仮想メモリサイズを表示します。これは`top -p {pid}`で確認できるDoris BEプロセスの仮想メモリと同じです。

```
MemTrackerLimiter Label=process virtual memory, Type=overview, Limit=-1.00 B(-1 B), Used=44.25 GB(47512956928 B), Peak=44.25 GB(47512956928 B)
```
Dorisは現在、Doris BEプロセスの仮想メモリが大きすぎるという問題を抱えています。これは通常、Jemallocが大量の仮想メモリマッピングを保持しているためで、Jemalloc Metadataが過度にメモリを占有する原因にもなります。Jemalloc Metadataメモリの解析については、[Jemalloc Memory Analysis](./memory-analysis/jemalloc-memory-analysis.md)を参照してください。

さらに、DorisのJoin OperatorとColumnにメモリ再利用がないことが知られており、一部のシナリオでより多くの仮想メモリがリクエストされ、最終的にJemalloc Retainedにキャッシュされる原因となります。現在のところ良い解決策はありません。Doris BEプロセスを定期的に再起動することを推奨します。

## 6 BEプロセス開始直後にプロセスメモリが非常に大きい

これは通常、BEプロセス開始時にロードされるメタデータメモリが大きすぎるためです。Doris BE Bvarを確認するには、[Metadata Memory Analysis](./memory-analysis/metadata-memory-analysis.md)を参照してください。

- `doris_total_tablet_num`が多すぎる場合、通常はテーブルのパーティション数とバケット数が大きすぎることが原因です。`{fe_host}:{fe_http_port}/System?path=//dbs`を確認して、大量のタブレットを持つテーブルを見つけてください。テーブルのタブレット数は、パーティション数とバケット数の積に等しくなります。パーティション数とバケット数を減らすか、使用されなくなった古いテーブルやパーティションを削除してみてください。

- `doris_total_rowset_num`が大きいがタブレット数が少ない場合、`SHOW-PROC`ドキュメントを参照して、rowsetが多いがタブレットが少ないテーブルを見つけ、手動でcompactionを実行するか、自動compactionの完了を待ってください。詳細については、メタデータ管理関連ドキュメントを参照してください。数十万のrowsetがある場合、メタデータが数GBを占有するのは正常です。

- `tablet_meta_schema_columns_count`が大きく、`doris_total_tablet_schema_num`より数百倍または数千倍大きい場合、クラスタ内に数百または数千のカラムを持つ大きなワイドテーブルがあることを意味します。この場合、同じ数のタブレットがより多くのメモリを占有します。

## 7 クエリに複雑な演算子はなく、単純にデータをスキャンするだけなのに、大量のメモリを使用する

Segmentを読み取る際に開かれるColumn ReaderとIndex Readが占有するメモリの可能性があります。Doris BE Bvarの`doris_total_segment_num`、`doris_column_reader_num`、`doris_ordinal_index_memory_bytes`、`doris_zone_map_memory_bytes`、`doris_short_key_index_memory_bytes`の変化を確認するには、[Metadata Memory Analysis](./memory-analysis/metadata-memory-analysis.md)を参照してください。この現象は、大きなワイドテーブルを読み取る際にもよく見られます。数十万のColumn Readerが開かれると、メモリは数十GB占有する可能性があります。

Heap Profileでメモリ占有率が高いコールスタックに`Segment`と`ColumnReader`フィールドが表示される場合、Segmentを読み取る際に大量のメモリが占有されていることがほぼ確認できます。

この場合、SQLを修正してスキャンするデータ量を減らすか、テーブル作成時に指定するバケットサイズを小さくして、開くセグメント数を減らすしかありません。

## 8. Query Cancelがスタックする

> Doris 2.1.3以前でよく見られる

クエリ実行中にリクエストされたメモリの大部分は、クエリ終了時に解放される必要があります。プロセスメモリが十分な場合、通常はクエリの終了の速さを気にする必要はありません。しかし、プロセスメモリが不足している場合、特定の戦略に従ってクエリがキャンセルされ、そのメモリを解放してプロセスがOOM Killerをトリガーすることを避けることがよくあります。この時、クエリのキャンセルプロセスがスタックしてメモリが適時に解放されない場合、OOM Killerをトリガーするリスクが増加するだけでなく、プロセスメモリ不足により更多くのクエリがキャンセルされる可能性があります。

クエリがキャンセルされたことが分かっている場合、このQueryIDに基づいてキャンセルプロセスでスタックしているかどうかを分析します。まず、`grep {queryID} be/log/be.INFO`を実行して、`Cancel`キーワードを含む最初のログを見つけます。対応する時点がクエリがキャンセルされた時間です。`deregister query/load memory tracker`キーワードを含むログを見つけます。対応する時点がクエリのキャンセルが完了した時間です。最終的にOOM Killerがトリガーされ、`deregister query/load memory tracker`キーワードを含むログが見つからない場合、OOM Killerが発生するまでクエリがキャンセルされていないことを意味します。通常、クエリのキャンセルプロセスが3秒以上かかる場合、クエリはキャンセルプロセスでスタックしており、クエリ実行ログをさらに分析する必要があります。

さらに、`grep {queryID} be/log/be.INFO`を実行した後、`tasks is being canceled and has not been completed yet`キーワードを含むログが表示された場合、その後のQueryIDリストは、Memory GCが実行された際に、これらのクエリがキャンセル中だが完了していないことが判明したことを意味します。この時、これらのクエリはスキップされ、他の場所でメモリの解放が続行されます。これは、Memory GCの動作が期待通りかどうかを判断するために使用できます。
