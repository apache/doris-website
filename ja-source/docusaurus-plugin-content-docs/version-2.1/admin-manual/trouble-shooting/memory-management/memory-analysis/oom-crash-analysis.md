---
{
  "title": "OOM Killer クラッシュ解析",
  "language": "ja",
  "description": "BEプロセスがクラッシュした後にlog/be.outにエラーメッセージがない場合は、dmesg -Tを実行してください。以下のログが表示された場合、"
}
---
BEプロセスがクラッシュした後に`log/be.out`にエラーメッセージがない場合は、`dmesg -T`を実行してください。以下のログが表示される場合、OOM Killerが発動したことを意味します。`20240718 15:03:59`において、pid 360303のdoris_beプロセスの物理メモリ（anon-rss）が約60GBであることが確認できます。

```
[Thu Jul 18 15:03:59 2024] Out of memory: Killed process 360303 (doris_be) total-vm:213416916kB, anon-rss:62273128kB, file-rss:0kB, shmem-rss:0kB, UID:0 pgtables:337048kB oom_score_adj:0
```
理想的には、Dorisはオペレーティングシステムの残存可用メモリを定期的に検出し、後続のメモリリクエストのブロックやメモリGCのトリガーなど一連のアクションを実行してメモリ不足時のOOM Killerの発動を回避します。しかし、メモリステータスの更新とメモリGCには一定の遅延があり、すべての大きなメモリリクエストを完全にキャッチすることは困難です。クラスター負荷が高すぎる場合、OOM Killerがトリガーされる可能性が依然として存在し、BEプロセスがクラッシュする原因となります。また、プロセスのメモリステータスが異常な場合、メモリGCがメモリを解放できないため、プロセスの実際の使用可能メモリが減少し、クラスターのメモリ負荷が増大します。

OOM Killerがトリガーされた場合、まずログに基づいてOOM Killerがトリガーされる前のBEプロセスのメモリステータスとタスク実行を分析し、その後、対象を絞ってパラメータを調整してクラスターを安定性に復旧させます。

## OOM Killerがトリガーされる前のメモリログを見つける

OOM Killerがトリガーされた場合、プロセスの使用可能メモリが不足していることを意味します。[Memory Log Analysis](./memory-log-analysis.md)を参照して、`be/log/be.INFO`内でOOM Killerがトリガーされた時点で下から上に向かって最後に出力された`Memory Tracker Summary`キーワードを見つけ、BEプロセスの主要なメモリ位置を分析します。

> `less be/log/be.INFO` ファイルを開いた後、まずOOM Killerがトリガーされた時間に対応するログにジャンプします。上記の`dmesg -T`の結果を例にすると、`/20240718 15:03:59`を入力してEnterを押し、対応する時間を検索します。見つからない場合は、OOM Killerがトリガーされた時間にずれがある可能性があります。`/20240718 15:03:`で検索できます。ログが対応する時間にジャンプした後、`/Memory Tracker Summary`を入力してEnterを押し、キーワードを検索します。デフォルトではログ内で下向きに検索されます。見つからない場合や時間が一致しない場合は、`shift + n`を押して上向きに検索し、最後に出力された`Memory Tracker Summary`と同時に出力された`Process Memory Summary`メモリログを見つける必要があります。

## 過度なクラスターメモリ負荷によるOOM Killerのトリガー

以下の現象に該当する場合、クラスターのメモリ負荷が高すぎるため、ある時点でプロセスメモリステータスが適時に更新されず、メモリGCが適時にメモリを解放できず、BEプロセスメモリの効果的な制御に失敗したと考えられます。

> Doris 2.1以前では、Memory GCが完全ではなく、メモリが常に逼迫している場合、OOM Killerがトリガーされやすい傾向がありました。

- `Memory Tracker Summary`の分析により、クエリやその他のタスク、各種キャッシュ、メタデータなどのメモリ使用量が合理的であることがわかった。

- 対応する時間帯のBEプロセスメモリ監視では、メモリ使用率が長時間高いレベルで維持されており、メモリリークの兆候はない

- `be/log/be.INFO`内でOOM Killer時点より前のメモリログを特定し、下から上に`GC`キーワードを検索すると、BEプロセスが頻繁にメモリGCを実行していることがわかる。

この場合、[BE Configuration Items](../../../config/be-config)を参照して`be/conf/be.conf`内の`mem_limit`を削減し、`max_sys_mem_available_low_water_mark_bytes`を増加させます。メモリ制限、ウォーターマーク計算方法、メモリGCの詳細については、[Memory Control Strategy](./../memory-feature/memory-control-strategy.md)を参照してください。

また、メモリステータスの更新とGCを制御するその他のパラメータを調整することも可能で、`memory_gc_sleep_time_ms`、`soft_mem_limit_frac`、`memory_maintenance_sleep_time_ms`、`process_minor_gc_size`、`process_full_gc_size`、`enable_query_memory_overcommit`、`thread_wait_gc_max_milliseconds`などがあります。

## 一部の異常な問題によるOOM Killerのトリガー

クラスターのメモリ負荷が高すぎる場合、この時点でメモリステータスが異常になり、メモリGCが適時にメモリを解放できない可能性があります。以下はOOM Killerをトリガーする一般的な異常な問題です。

### Memory Tracker統計の欠落

ログ`Memory Tracker Summary`内の`Label=process resident memory` Memory Trackerと`Label=sum of all trackers` Memory Trackerの差が大きい場合、またはOrphan Memory Trackerの値が大きすぎる場合、Memory Trackerに統計の欠落があることを意味します。さらなる分析については、[Memory Tracker](./../memory-feature/memory-tracker.md)の[Memory Tracker Statistics Missing]セクションを参照してください。

### Query Cancelのスタック

`be/log/be.INFO`ログ内でOOM Killerの時点を特定し、コンテキスト内で`Memory Tracker Summary`を検索してプロセスメモリ統計ログを見つけます。`Memory Tracker Summary`内に大量のメモリを使用するクエリがある場合、`grep {queryID} be/log/be.INFO`を実行して`Cancel`キーワードを含むログが存在するかを確認します。対応する時点がクエリがキャンセルされた時間です。クエリがキャンセルされ、クエリがキャンセルされた時点とOOM Killerがトリガーされた時点の間に長い時間がある場合は、[Memory Problem FAQ](../../../trouble-shooting/memory-management/memory-issue-faq)の[Query Cancel process stuck]の分析を参照してください。`Memory Tracker Summary`の分析については、[Memory Log Analysis](./memory-log-analysis.md)を参照してください。

### Jemalloc Metadataの大きなメモリフットプリント

Memory GCは現在Jemalloc Metadataを解放できません。メモリ使用量を削減するため、[Memory Tracker](./../memory-feature/memory-tracker.md)の`Label=tc/jemalloc_metadata` Memory Trackerの分析を参照してください。

### Jemalloc Cacheの大きなメモリフットプリント

> Doris 2.0で一般的

Doris 2.0の`be.conf`内の`JEMALLOC_CONF`における`lg_tcache_max`のデフォルト値は20で、これによりJemalloc Cacheが大きすぎて一部のシナリオで自動的に解放されない原因となります。Jemalloc Cacheのメモリフットプリントを削減するため、[Jemalloc Memory Analysis](./jemalloc-memory-analysis.md)を参照してください。
