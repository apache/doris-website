---
{
    "title": "メモリ問題の FAQ",
    "language": "ja",
    "description": "Doris BE プロセスのメモリ分析には、主に be/log/be.INFO ログ、BE プロセスのメモリ監視（Metrics）、Doris Bvar の統計情報を使用します。"
}
---

Doris BE プロセスのメモリ分析には、主に `be/log/be.INFO` ログ、BE プロセスのメモリ監視（Metrics）、Doris Bvar の統計情報を使用します。OOM Killer が作動した場合は、`dmesg -T` の実行結果を収集してください。クエリまたはロードタスクのメモリを分析する場合は、Query Profile を収集してください。これらの情報を基に、一般的なメモリ問題を分析します。自力で解決できない場合は、Doris の開発者に支援を求めてください。GitHub での issue の提出、Doris フォーラムでの issue の作成、メール、WeChat のいずれの方法で問い合わせる場合も、問題の説明に上記の情報を含めてください。

まず、現在観測されている現象がどのメモリ問題に該当するかを特定し、さらに調査します。通常は、最初にプロセスのメモリログを分析する必要があります。[メモリログの分析](./memory-analysis/memory-log-analysis.md)を参照してください。一般的なメモリ問題を以下に示します。

## 1 クエリとロードのメモリ制限エラー

クエリまたはロードのエラーメッセージに `MEM_LIMIT_EXCEEDED` が表示された場合、プロセスで利用できるメモリが不足しているか、タスクが単一実行のメモリ制限を超えたため、タスクがキャンセルされたことを意味します。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED] xxxx .
```

エラーメッセージに `Process memory not enough` が含まれる場合は、プロセスで利用できるメモリが不足しています。詳しい分析方法については、[クエリまたはロードのエラー：プロセスで利用できるメモリの不足](./memory-analysis/query-cancelled-after-process-memory-exceeded.md)を参照してください。

エラーメッセージに `memory tracker limit exceeded` が含まれる場合は、タスクが単一実行のメモリ制限を超えています。詳しい分析方法については、[クエリまたはロードのエラー：単一実行のメモリ制限超過](./memory-analysis/query-cancelled-after-query-memory-exceeded.md)を参照してください。

## 2 Doris BE の OOM によるクラッシュ

BE プロセスがクラッシュした後、`log/be.out` にエラーメッセージがない場合は、`dmesg -T` を実行してください。`Out of memory: Killed process {pid} (doris_be)` が表示された場合は、OOM Killer が作動したことを意味します。詳しい分析方法については、[OOM Killer によるクラッシュの分析](./memory-analysis/oom-crash-analysis.md)を参照してください。

## 3 メモリリーク

> メモリリークが疑われる場合、最も効果的な対処法は、同じ系列の最新のパッチバージョンにアップグレードすることです。Doris 2.0 を使用している場合は、Doris 2.0.x の最新バージョンにアップグレードしてください。同じ現象がほかのユーザーにも発生している可能性が高く、ほとんどのメモリリークはバージョン更新で修正されているためです。

次の現象が見られる場合は、メモリリークの可能性があります。

- Doris Grafana またはサーバーの監視で、Doris BE プロセスのメモリ使用量が直線的に増え続け、クラスター上のタスクが停止した後も減少しない。

- Memory Tracker の統計情報に欠落がある。分析方法については、[Memory Tracker](./memory-feature/memory-tracker.md)を参照してください。

メモリリークには通常、Memory Tracker の統計情報の欠落が伴うため、分析方法については「Memory Tracker」のセクションも参照してください。

## 4 Doris BE プロセスのメモリ使用量が減少しない、または増え続ける

Doris Grafana またはサーバーの監視で、Doris BE プロセスのメモリ使用量が直線的に増え続け、クラスター上のタスクが停止した後も減少しない場合は、まず [Memory Tracker](./memory-feature/memory-tracker.md) の [Memory Tracker](./memory-feature/memory-tracker.md) を参照し、Memory Tracker の統計情報に欠落があるか分析してください。欠落がある場合は、その原因をさらに分析してください。

Memory Tracker の統計情報に欠落がなく、メモリの大半が計上されている場合は、[概要](./overview.md)を参照し、Doris BE プロセスの各部分でメモリ使用量が大きくなる理由と、その削減方法を分析してください。

## 5 仮想メモリの使用量が大きい

`Label=process virtual memory` の Memory Tracker には、リアルタイムの仮想メモリサイズが表示されます。この値は、`top -p {pid}` で確認できる Doris BE プロセスの仮想メモリと同じです。

```
MemTrackerLimiter Label=process virtual memory, Type=overview, Limit=-1.00 B(-1 B), Used=44.25 GB(47512956928 B), Peak=44.25 GB(47512956928 B)
```

現在も Doris には、Doris BE プロセスの仮想メモリが大きくなりすぎる問題があります。通常は Jemalloc が大量の仮想メモリマッピングを保持するためで、Jemalloc Metadata のメモリ使用量も大きくなります。Jemalloc Metadata のメモリの分析方法については、[Jemalloc のメモリ分析](./memory-analysis/jemalloc-memory-analysis.md)を参照してください。

また、Doris の Join Operator と Column ではメモリの再利用が不足していることが知られています。このため、一部のシナリオでは要求される仮想メモリが増え、最終的に Jemalloc Retained にキャッシュされます。現時点で有効な解決策はなく、Doris BE プロセスを定期的に再起動することが推奨されます。

## 6 BE プロセスの起動直後からプロセスメモリの使用量が非常に大きい

通常は、BE プロセスの起動時に読み込まれるメタデータが多すぎることが原因です。[メタデータのメモリ分析](./memory-analysis/metadata-memory-analysis.md)を参照して、Doris BE Bvar を確認してください。

- `doris_total_tablet_num` が多すぎる場合、通常はテーブルのパーティション数とバケット数が多すぎることが原因です。`{fe_host}:{fe_http_port}/System?path=//dbs` を確認し、tablet 数の多いテーブルを特定してください。テーブルの tablet 数は、そのパーティション数とバケット数を掛けた値です。パーティション数とバケット数を減らすか、使われなくなったテーブルやパーティションを削除してください。

- `doris_total_rowset_num` が非常に大きい一方で tablet 数が少ない場合は、`SHOW-PROC` のドキュメントを参照し、rowset が多く tablet が少ないテーブルを特定してください。その後、compaction を手動で実行するか、自動 compaction の完了を待ってください。詳しくは、メタデータ管理に関するドキュメントを参照してください。rowset が数十万ある場合、メタデータが数 GB のメモリを占めるのは正常です。

- `tablet_meta_schema_columns_count` が非常に大きく、`doris_total_tablet_schema_num` の数百倍または数千倍ある場合は、数百から数千のカラムを持つ幅の広いテーブルがクラスター内に存在することを意味します。この場合、同じ tablet 数でもより多くのメモリを使用します。

## 7 クエリに複雑な演算子がなく、データをスキャンするだけなのに大量のメモリを使用する

Segment の読み取り時に開かれる Column Reader と Index Read がメモリを使用している可能性があります。[メタデータのメモリ分析](./memory-analysis/metadata-memory-analysis.md)を参照し、Doris BE Bvar の `doris_total_segment_num`、`doris_column_reader_num`、`doris_ordinal_index_memory_bytes`、`doris_zone_map_memory_bytes`、`doris_short_key_index_memory_bytes` の変化を確認してください。この現象は、幅の広い大きなテーブルを読み取る場合にもよく見られます。数十万の Column Reader が開かれると、数十 GB のメモリを使用する可能性があります。

Heap Profile でメモリ使用割合の大きい呼び出しスタックに `Segment` と `ColumnReader` のフィールドが見られる場合は、Segment の読み取り時に大量のメモリが使用されているとほぼ確認できます。

この場合、SQL を変更してスキャンするデータ量を減らすか、テーブル作成時に指定するバケットサイズを小さくして、開かれる Segment の数を減らす必要があります。

## 8. クエリのキャンセル処理が停止する

> Doris 2.1.3 より前のバージョンでよく見られます。

クエリ実行中に確保されたメモリの大半は、クエリの終了時に解放される必要があります。プロセスに十分なメモリがある場合は、通常、クエリの終了にかかる時間を気にする必要はありません。一方、プロセスのメモリが不足している場合は、OOM Killer の作動を避けるため、一定の方針に従って一部のクエリをキャンセルし、そのメモリを解放することがよくあります。このとき、クエリのキャンセル処理が停止してメモリが適時に解放されないと、OOM Killer が作動するリスクが高まるだけでなく、プロセスのメモリ不足によってさらに多くのクエリがキャンセルされる可能性があります。

キャンセルされたことが分かっているクエリについて、以下の方法で QueryID を使い、キャンセル処理が停止しているか分析します。まず `grep {queryID} be/log/be.INFO` を実行し、`Cancel` というキーワードを含む最初のログを探します。その時刻がクエリのキャンセル時刻です。次に `deregister query/load memory tracker` というキーワードを含むログを探します。その時刻がクエリのキャンセル処理の完了時刻です。最終的に OOM Killer が作動し、`deregister query/load memory tracker` を含むログが見つからない場合は、OOM Killer が作動するまでクエリのキャンセルが完了しなかったことを意味します。通常、キャンセル処理に 3s を超える時間がかかる場合は、処理が停止しているため、クエリ実行ログをさらに分析する必要があります。

また、`grep {queryID} be/log/be.INFO` の実行後に `tasks is being canceled and has not been completed yet` というキーワードを含むログが見つかった場合、その後に続く QueryID の一覧は、Memory GC の実行時に、それらのクエリがキャンセル中であるもののキャンセルが完了していないと判定されたことを示します。このとき、それらのクエリはスキップされ、別の場所でメモリの解放が続けられます。これを利用して、Memory GC の動作が想定どおりか判断できます。
