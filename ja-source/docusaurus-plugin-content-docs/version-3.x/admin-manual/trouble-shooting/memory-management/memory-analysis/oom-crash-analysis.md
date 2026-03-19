---
{
  "title": "OOM Killer クラッシュ解析",
  "language": "ja",
  "description": "BEプロセスがクラッシュした後にlog/be.outにエラーメッセージがない場合は、dmesg -Tを実行してください。以下のログが表示された場合、"
}
---
BEプロセスがクラッシュした後に`log/be.out`にエラーメッセージがない場合は、`dmesg -T`を実行してください。以下のログが表示される場合、OOM Killerがトリガーされたことを意味します。`20240718 15:03:59`において、pid 360303のdoris_beプロセスの物理メモリ（anon-rss）が約60 GBであることが確認できます。

```
[Thu Jul 18 15:03:59 2024] Out of memory: Killed process 360303 (doris_be) total-vm:213416916kB, anon-rss:62273128kB, file-rss:0kB, shmem-rss:0kB, UID:0 pgtables:337048kB oom_score_adj:0
```
理想的には、Dorisはオペレーティングシステムの残り利用可能メモリを定期的に検出し、後続のメモリリクエストをブロックしたりメモリGCをトリガーするなどの一連のアクションを実行して、メモリ不足時にOOM Killerがトリガーされることを回避します。しかし、メモリステータスの更新とメモリGCには一定の遅延があり、すべての大きなメモリリクエストを完全に捕捉することは困難です。クラスタの負荷が高すぎる場合、依然としてOOM Killerがトリガーされる一定の確率があり、BEプロセスがクラッシュする原因となります。さらに、プロセスのメモリステータスが異常な場合、メモリGCがメモリを解放できず、プロセスの実際の利用可能メモリが減少し、クラスタのメモリ負荷が増大します。

OOM Killerがトリガーされた場合、まずログに基づいてOOM Killerがトリガーされる前のBEプロセスのメモリステータスとタスク実行を分析し、その後パラメータを対象を絞って調整してクラスタを安定状態に復旧させます。

## OOM Killerがトリガーされる前のメモリログを見つける

OOM Killerがトリガーされた場合、プロセスの利用可能メモリが不足していることを意味します。[Memory Log Analysis](./memory-log-analysis.md)を参照して、`be/log/be.INFO`でOOM Killerがトリガーされた時刻に下から上に向かって最後に出力された`Memory Tracker Summary`キーワードを見つけ、BEプロセスの主要なメモリ位置を分析してください。

> `less be/log/be.INFO`でファイルを開いた後、まずOOM Killerがトリガーされた時刻に対応するログにジャンプします。上記の`dmesg -T`の結果を例にして、`/20240718 15:03:59`と入力してEnterキーを押し、対応する時刻を検索します。見つからない場合、OOM Killerがトリガーされた時刻に若干のずれがある可能性があります。`/20240718 15:03:`で検索できます。ログが対応する時刻にジャンプした後、`/Memory Tracker Summary`と入力してEnterキーを押し、キーワードを検索します。デフォルトではログ内で下方向に検索します。見つからない場合や時刻が一致しない場合は、`shift + n`を押して上方向に検索し、最後に出力された`Memory Tracker Summary`と同時に出力された`Process Memory Summary`メモリログを見つける必要があります。

## 過剰なクラスタメモリ負荷がOOM Killerをトリガー

以下の現象が見られる場合、クラスタのメモリ負荷が高すぎるため、ある瞬間にプロセスメモリステータスが適時に更新されず、メモリGCが適時にメモリを解放できずに、BEプロセスメモリを効果的に制御できなかったと考えることができます。

> Doris 2.1以前では、Memory GCが完全ではなく、メモリが常に逼迫している場合、OOM Killerがトリガーされやすい状況でした。

- `Memory Tracker Summary`の分析により、クエリやその他のタスク、各種キャッシュ、メタデータなどのメモリ使用量が妥当であることが判明した。

- 対応する期間のBEプロセスメモリ監視により、メモリ使用率が長期間高レベルで維持されており、メモリリークの兆候がない

- `be/log/be.INFO`でOOM Killerの時刻前のメモリログを特定し、下から上に向かって`GC`キーワードを検索し、BEプロセスが頻繁にメモリGCを実行していることを発見した。

この時、[BE Configuration Items](../../../config/be-config)を参照して`be/conf/be.conf`で`mem_limit`を減らし、`max_sys_mem_available_low_water_mark_bytes`を増やしてください。メモリ制限、ウォーターマーク計算方法、メモリGCの詳細については、[Memory Control Strategy](./../memory-feature/memory-control-strategy.md)を参照してください。

さらに、`memory_gc_sleep_time_ms`、`soft_mem_limit_frac`、`memory_maintenance_sleep_time_ms`、`process_minor_gc_size`、`process_full_gc_size`、`enable_query_memory_overcommit`、`thread_wait_gc_max_milliseconds`などを含む他のパラメータを調整してメモリステータスの更新とGCを制御することができます。

## 一部の異常な問題がOOM Killerをトリガー

クラスタのメモリ負荷が高すぎる場合、この時点でメモリステータスが異常になり、メモリGCが適時にメモリを解放できない可能性があります。以下は、OOM Killerをトリガーする一般的な異常問題です。

### Memory Tracker統計の欠落

ログ`Memory Tracker Summary`で`Label=process resident memory` Memory Trackerと`Label=sum of all trackers` Memory Trackerの差が大きい場合、またはOrphan Memory Trackerの値が大きすぎる場合、Memory Trackerに統計の欠落があることを意味します。[Memory Tracker](./../memory-feature/memory-tracker.md)の[Memory Tracker Statistics Missing]セクションを参照してさらに分析してください。

### Query Cancelのスタック

`be/log/be.INFO`ログでOOM Killerの時刻を特定し、コンテキストで`Memory Tracker Summary`を検索してプロセスメモリ統計ログを見つけます。`Memory Tracker Summary`で大量のメモリを使用するクエリがある場合、`grep {queryID} be/log/be.INFO`を実行して、`Cancel`キーワードのログがあるかを確認します。対応する時刻はクエリがキャンセルされた時刻です。クエリがキャンセル済みで、クエリがキャンセルされた時刻とOOM Killerがトリガーされた時刻が大きく離れている場合、[Memory Problem FAQ](../../../trouble-shooting/memory-management/memory-issue-faq)の[Query Cancel process stuck]の分析を参照してください。`Memory Tracker Summary`の分析については、[Memory Log Analysis](./memory-log-analysis.md)を参照してください。

### Jemalloc Metadataの大きなメモリフットプリント

Memory GCは現在Jemalloc Metadataを解放できません。[Memory Tracker](./../memory-feature/memory-tracker.md)の`Label=tc/jemalloc_metadata` Memory Trackerの分析を参照してメモリ使用量を削減してください。

### Jemalloc Cacheの大きなメモリフットプリント

> Doris 2.0でよく見られる

Doris 2.0の`be.conf`の`JEMALLOC_CONF`における`lg_tcache_max`のデフォルト値は20で、これによりJemalloc Cacheが大きすぎて一部のシナリオで自動的に解放されない原因となります。[Jemalloc Memory Analysis](./jemalloc-memory-analysis.md)を参照してJemalloc Cacheのメモリフットプリントを削減してください。
