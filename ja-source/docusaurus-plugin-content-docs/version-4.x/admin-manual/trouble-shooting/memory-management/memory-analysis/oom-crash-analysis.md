---
{
  "title": "OOM Killer クラッシュ解析",
  "language": "ja",
  "description": "BEプロセスがクラッシュした後、log/be.outにエラーメッセージがない場合は、dmesg -Tを実行してください。以下のログが表示された場合は、"
}
---
BE プロセスがクラッシュした後に `log/be.out` にエラーメッセージがない場合は、`dmesg -T` を実行してください。以下のログが表示される場合、OOM Killer がトリガーされたことを意味します。`20240718 15:03:59` に、pid 360303 の doris_be プロセスの物理メモリ（anon-rss）が約 60 GB であることがわかります。

```
[Thu Jul 18 15:03:59 2024] Out of memory: Killed process 360303 (doris_be) total-vm:213416916kB, anon-rss:62273128kB, file-rss:0kB, shmem-rss:0kB, UID:0 pgtables:337048kB oom_score_adj:0
```
理想的には、DorisはOSの残りの利用可能メモリを定期的に検出し、メモリ不足時にOOM Killerのトリガを回避するため、後続のメモリ要求のブロックやメモリGCのトリガなどの一連のアクションを実行します。しかし、メモリ状態の更新とメモリGCには一定の遅延があり、すべての大きなメモリ要求を完全にキャッチすることは困難です。クラスタの負荷が高すぎる場合、依然としてOOM Killerをトリガする一定の確率があり、BEプロセスのクラッシュを引き起こします。さらに、プロセスのメモリ状態が異常な場合、メモリGCがメモリを解放できず、プロセスの実際の利用可能メモリの減少を引き起こし、クラスタのメモリ圧迫を増加させます。

OOM Killerがトリガされた場合、まずログに基づいてOOM Killerがトリガされる前のBEプロセスのメモリ状態とタスク実行を分析し、その後パラメータを対象を絞って調整してクラスタを安定性に復旧させます。

## OOM Killerがトリガされる前のメモリログを見つける

OOM Killerがトリガされた場合、プロセスの利用可能メモリが不足していることを意味します。[Memory Log Analysis](./memory-log-analysis.md)を参照して、`be/log/be.INFO`でOOM Killerがトリガされた時点で下から上に向かって最後に出力された`Memory Tracker Summary`キーワードを見つけ、BEプロセスの主要なメモリ位置を分析します。

> `less be/log/be.INFO`でファイルを開いた後、まずOOM Killerがトリガされた時刻に対応するログにジャンプします。上記の`dmesg -T`の結果を例にすると、`/20240718 15:03:59`と入力してEnterを押し、対応する時刻を検索します。見つからない場合は、OOM Killerがトリガされた時刻にやや偏差がある可能性があります。`/20240718 15:03:`で検索できます。ログが対応する時刻にジャンプした後、`/Memory Tracker Summary`と入力してEnterを押しキーワードを検索します。デフォルトではログ内で下方向に検索します。見つからないか時刻が一致しない場合は、`shift + n`を押して上方向に検索し、最後に出力された`Memory Tracker Summary`と同時に出力された`Process Memory Summary`メモリログを見つける必要があります。

## 過度なクラスタメモリ圧迫によるOOM Killerのトリガ

以下の現象に該当する場合、クラスタのメモリ圧迫が高すぎることが原因で、ある瞬間にプロセスのメモリ状態が適時に更新されず、メモリGCが適時にメモリを解放できず、BEプロセスのメモリを効果的に制御できなかったと考えられます。

> Doris 2.1以前では、Memory GCが完璧ではなく、メモリが常に逼迫している場合、OOM Killerをトリガしやすい傾向がありました。

- `Memory Tracker Summary`の分析で、クエリやその他のタスク、各種キャッシュ、メタデータなどのメモリ使用量が妥当であることが判明した。

- 対応する期間のBEプロセスメモリ監視で、メモリ使用率が長時間高レベルで維持され、メモリリークの兆候がない

- `be/log/be.INFO`でOOM Killer時点前のメモリログを特定し、下から上に`GC`キーワードを検索すると、BEプロセスが頻繁にメモリGCを実行していることが判明した。

この場合、[BE Configuration Items](../../../config/be-config)を参照して、`be/conf/be.conf`で`mem_limit`を減らし、`max_sys_mem_available_low_water_mark_bytes`を増やします。メモリ制限、ウォーターマーク計算方法、メモリGCの詳細については、[Memory Control Strategy](./../memory-feature/memory-control-strategy.md)を参照してください。

さらに、`memory_gc_sleep_time_ms`、`soft_mem_limit_frac`、`memory_maintenance_sleep_time_ms`、`process_minor_gc_size`、`process_full_gc_size`、`thread_wait_gc_max_milliseconds`などを含む他のパラメータを調整して、メモリ状態の更新とGCを制御できます。

## 一部の異常な問題によるOOM Killerのトリガ

クラスタのメモリ圧迫が高すぎる場合、この時点でメモリ状態が異常になり、メモリGCが適時にメモリを解放できない可能性があります。以下はOOM Killerをトリガする一般的な異常問題です。

### Memory Tracker統計の欠落

ログ`Memory Tracker Summary`の`Label=process resident memory` Memory Trackerと`Label=sum of all trackers` Memory Trackerの差が大きい場合、またはOrphan Memory Trackerの値が大きすぎる場合、Memory Trackerに統計の欠落があることを意味します。さらなる分析については、[Memory Tracker](./../memory-feature/memory-tracker.md)の[Memory Tracker Statistics Missing]セクションを参照してください。

### Query Cancelのスタック

`be/log/be.INFO`ログでOOM Killerの時点を特定し、コンテキストで`Memory Tracker Summary`を検索してプロセスメモリ統計ログを見つけます。`Memory Tracker Summary`で大量のメモリを使用するクエリがある場合、`grep {queryID} be/log/be.INFO`を実行して、`Cancel`キーワードを含むログがあるかどうかを確認します。対応する時点はクエリがキャンセルされた時刻です。クエリがキャンセルされており、クエリがキャンセルされた時点がOOM Killerがトリガされた時点から長時間離れている場合、[Memory Problem FAQ](../../../trouble-shooting/memory-management/memory-issue-faq)の[Query Cancel process stuck]の分析を参照してください。`Memory Tracker Summary`の分析については、[Memory Log Analysis](./memory-log-analysis.md)を参照してください。

### Jemalloc Metadataの大きなメモリ占有

Memory GCは現在Jemalloc Metadataを解放できません。メモリ使用量を減らすには、[Memory Tracker](./../memory-feature/memory-tracker.md)の`Label=tc/jemalloc_metadata` Memory Trackerの分析を参照してください。

### Jemalloc Cacheの大きなメモリ占有

> Doris 2.0で一般的

Doris 2.0の`be.conf`の`JEMALLOC_CONF`の`lg_tcache_max`のデフォルト値は20で、一部のシナリオでJemalloc Cacheが大きすぎて自動的に解放できない原因となります。Jemalloc Cacheのメモリ占有を減らすには、[Jemalloc Memory Analysis](./jemalloc-memory-analysis.md)を参照してください。
