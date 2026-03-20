---
{
  "title": "OOM Killer クラッシュ解析",
  "language": "ja",
  "description": "BEプロセスがクラッシュした後、log/be.outにエラーメッセージがない場合は、dmesg -Tを実行してください。以下のログが表示された場合は、"
}
---
BEプロセスのクラッシュ後に`log/be.out`にエラーメッセージがない場合は、`dmesg -T`を実行してください。以下のログが表示された場合、OOM Killerがトリガーされたことを意味します。`20240718 15:03:59`において、pid 360303のdoris_beプロセスの物理メモリ（anon-rss）が約60 GBであることが確認できます。

```
[Thu Jul 18 15:03:59 2024] Out of memory: Killed process 360303 (doris_be) total-vm:213416916kB, anon-rss:62273128kB, file-rss:0kB, shmem-rss:0kB, UID:0 pgtables:337048kB oom_score_adj:0
```
理想的には、DorisはOSの残り使用可能メモリを定期的に検出し、メモリ不足時にOOM Killerの発動を回避するために、後続のメモリ要求をブロックしメモリGCをトリガーするなどの一連のアクションを実行します。ただし、メモリ状態の更新とメモリGCには一定の遅延があり、すべての大きなメモリ要求を完全にキャッチすることは困難です。クラスターの負荷が高すぎる場合、依然としてOOM Killerが発動する確率があり、BEプロセスがクラッシュする原因となります。さらに、プロセスのメモリ状態が異常な場合、メモリGCがメモリを解放できなくなり、プロセスの実際の使用可能メモリが減少し、クラスターのメモリ圧迫が増加します。

OOM Killerが発動した場合、まずログに基づいてOOM Killer発動前のBEプロセスのメモリ状態とタスク実行を分析し、その後対象を絞ってパラメータを調整し、クラスターを安定状態に復旧させます。

## OOM Killer発動前のメモリログを見つける

OOM Killerが発動した場合、プロセスの使用可能メモリが不足していることを意味します。[Memory Log Analysis](./memory-log-analysis.md)を参照して、`be/log/be.INFO`でOOM Killer発動時刻に、下から上に向かって最後に出力された`Memory Tracker Summary`キーワードを見つけ、BEプロセスの主要なメモリ位置を分析します。

> `less be/log/be.INFO`でファイルを開いた後、まずOOM Killer発動時刻に対応するログにジャンプします。上記の`dmesg -T`の結果を例にとると、`/20240718 15:03:59`を入力してEnterを押し、対応する時刻を検索します。見つからない場合は、OOM Killer発動時刻が多少ずれている可能性があります。`/20240718 15:03:`で検索できます。ログが対応する時刻にジャンプした後、`/Memory Tracker Summary`を入力してEnterを押し、キーワードを検索します。デフォルトでは、ログ内で下向きに検索されます。見つからない場合や時刻が合わない場合は、`shift + n`を押してまず上向きに検索し、最後に出力された`Memory Tracker Summary`と同時に出力された`Process Memory Summary`メモリログを見つける必要があります。

## 過度なクラスターメモリ圧迫によるOOM Killer発動

以下の現象に該当する場合、クラスターのメモリ圧迫が高すぎることが原因で、ある時点でプロセスのメモリ状態が適時に更新されず、メモリGCが適時にメモリを解放できず、BEプロセスメモリの効果的な制御に失敗したと考えられます。

> Doris 2.1より前では、Memory GCが完璧でなく、メモリが常に逼迫している場合、OOM Killerが発動しやすくなることがよくありました。

- `Memory Tracker Summary`の分析により、クエリやその他のタスク、各種キャッシュ、メタデータなどのメモリ使用量が適正であることが判明。

- 対応する時間帯のBEプロセスメモリ監視で、メモリ使用率が長時間高いレベルで維持されており、メモリリークの兆候がない

- `be/log/be.INFO`でOOM Killer時点前のメモリログを特定し、下から上に向かって`GC`キーワードを検索し、BEプロセスが頻繁にメモリGCを実行していることが判明。

この場合、[BE Configuration Items](../../../config/be-config)を参照して、`be/conf/be.conf`の`mem_limit`を減らし、`max_sys_mem_available_low_water_mark_bytes`を増やします。メモリ制限、ウォーターマーク計算方法、メモリGCの詳細については、[Memory Control Strategy](./../memory-feature/memory-control-strategy.md)を参照してください。

さらに、`memory_gc_sleep_time_ms`、`soft_mem_limit_frac`、`memory_maintenance_sleep_time_ms`、`process_minor_gc_size`、`process_full_gc_size`、`thread_wait_gc_max_milliseconds`などを含むその他のパラメータを調整して、メモリ状態の更新とGCを制御できます。

## 何らかの異常問題によるOOM Killer発動

クラスターのメモリ圧迫が高すぎる場合、この時点でメモリ状態が異常になる可能性があり、メモリGCが適時にメモリを解放できない場合があります。以下は、OOM Killerを発動させる一般的な異常問題です。

### Memory Tracker統計の欠落

ログ`Memory Tracker Summary`内の`Label=process resident memory`Memory Trackerと`Label=sum of all trackers`Memory Trackerの差が大きい場合、またはOrphan Memory Trackerの値が大きすぎる場合、Memory Trackerに統計の欠落があることを意味します。[Memory Tracker](./../memory-feature/memory-tracker.md)の[Memory Tracker Statistics Missing]セクションを参照してさらなる分析を行ってください。

### Query Cancelのスタック

`be/log/be.INFO`ログでOOM Killerの時点を特定し、その後コンテキストで`Memory Tracker Summary`を検索してプロセスメモリ統計ログを見つけます。`Memory Tracker Summary`で大量のメモリを使用するクエリがある場合、`grep {queryID} be/log/be.INFO`を実行して、`Cancel`キーワードを含むログがあるかどうかを確認します。対応する時点がクエリがキャンセルされた時刻です。クエリがすでにキャンセルされており、クエリがキャンセルされた時点とOOM Killer発動時点の間隔が長い場合は、[Memory Problem FAQ](../../../trouble-shooting/memory-management/memory-issue-faq)の[Query Cancel process stuck]の分析を参照してください。`Memory Tracker Summary`の分析については、[Memory Log Analysis](./memory-log-analysis.md)を参照してください。

### Jemalloc Metadataの大きなメモリフットプリント

メモリGCは現在Jemalloc Metadataを解放できません。[Memory Tracker](./../memory-feature/memory-tracker.md)の`Label=tc/jemalloc_metadata`Memory Trackerの分析を参照してメモリ使用量を削減してください。

### Jemalloc Cacheの大きなメモリフットプリント

> Doris 2.0で一般的

Doris 2.0の`be.conf`内の`JEMALLOC_CONF`の`lg_tcache_max`のデフォルト値は20で、一部のシナリオでJemalloc Cacheが大きすぎて自動的に解放できなくなる原因となります。[Jemalloc Memory Analysis](./jemalloc-memory-analysis.md)を参照してJemalloc Cacheのメモリフットプリントを削減してください。
