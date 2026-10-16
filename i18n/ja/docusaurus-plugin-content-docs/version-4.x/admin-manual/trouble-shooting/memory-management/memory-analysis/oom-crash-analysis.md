---
{
    "title": "OOM Killer によるクラッシュの分析",
    "language": "ja",
    "description": "BE プロセスのクラッシュ後、log/be.out にエラーメッセージがない場合は dmesg -T を実行します。次のようなログが表示された場合は、OOM Killer が作動しています。"
}
---

BE プロセスのクラッシュ後、`log/be.out` にエラーメッセージがない場合は `dmesg -T` を実行します。次のようなログが表示された場合は、OOM Killer が作動しています。この例では、`20240718 15:03:59` 時点で、PID が 360303 の doris_be プロセスの物理メモリ使用量（anon-rss）は約 60 GB です。

```
[Thu Jul 18 15:03:59 2024] Out of memory: Killed process 360303 (doris_be) total-vm:213416916kB, anon-rss:62273128kB, file-rss:0kB, shmem-rss:0kB, UID:0 pgtables:337048kB oom_score_adj:0
```

Doris は通常、OS の残りの利用可能メモリを定期的に確認し、メモリが不足した場合は後続のメモリ要求のブロックやメモリ GC の実行などによって OOM Killer の作動を防ぎます。ただし、メモリ状態の更新とメモリ GC には遅れがあり、大量のメモリ要求をすべて捕捉することは困難です。クラスターへの負荷が高すぎると、OOM Killer が作動して BE プロセスがクラッシュすることがあります。また、プロセスのメモリ状態に異常があると、メモリ GC でメモリを解放できず、プロセスが実際に利用できるメモリが減少して、クラスターのメモリ負荷が高まります。

OOM Killer が作動した場合は、まずログから作動前の BE プロセスのメモリ状態とタスクの実行状況を分析します。その結果に応じてパラメータを調整し、クラスターを安定した状態に戻します。

## OOM Killer が作動する前のメモリログを探す

OOM Killer の作動は、プロセスで利用できるメモリが不足したことを示します。[メモリログの分析](./memory-log-analysis.md)を参照し、OOM Killer が作動した時刻付近で最後に出力された `Memory Tracker Summary` を `be/log/be.INFO` で下から上に検索します。その内容から、BE プロセスのメモリ使用の主な内訳を分析します。

> `less be/log/be.INFO` でファイルを開いたら、まず OOM Killer が作動した時刻のログに移動します。上記の `dmesg -T` の結果を例にすると、`/20240718 15:03:59` と入力して Enter キーを押し、該当時刻を検索します。見つからない場合は、OOM Killer の作動時刻とログの時刻が多少ずれている可能性があるため、`/20240718 15:03:` で検索します。該当時刻に移動したら、`/Memory Tracker Summary` と入力して Enter キーを押します。デフォルトではログの下方向を検索するため、見つからない場合や時刻が合わない場合は、`shift + n` を押して上方向に検索します。最後に出力された `Memory Tracker Summary` と、同時に出力された `Process Memory Summary` のメモリログを確認します。

## クラスターのメモリ負荷が高すぎる場合

以下の状況が見られる場合、クラスターのメモリ負荷が高すぎると考えられます。その結果、ある時点でプロセスのメモリ状態が適時に更新されず、メモリ GC も適時にメモリを解放できなくなり、BE プロセスのメモリ使用量を十分に制御できなくなります。

> Doris 2.1 より前のバージョンでは、メモリ GC が十分に整備されておらず、メモリ不足が続くと OOM Killer が作動しやすい状態でした。

- `Memory Tracker Summary` を分析した結果、クエリやその他のタスク、各種キャッシュ、メタデータなどのメモリ使用量が妥当である。

- 該当時間帯の BE プロセスのメモリ監視データでは、メモリ使用率が長時間高い水準にとどまっており、メモリリークの兆候はない。

- `be/log/be.INFO` で OOM Killer が作動する前のメモリログを特定し、`GC` を下から上に検索すると、BE プロセスがメモリ GC を頻繁に実行していることがわかる。

この場合は、[BE 設定項目](../../../config/be-config)を参照し、`mem_limit` を下げ、`max_sys_mem_available_low_water_mark_bytes` を上げるように `be/conf/be.conf` を設定します。メモリ制限、ウォーターマークの計算方法、メモリ GC の詳細については、[メモリ制御戦略](./../memory-feature/memory-control-strategy.md)を参照してください。

また、`memory_gc_sleep_time_ms`、`soft_mem_limit_frac`、`memory_maintenance_sleep_time_ms`、`process_minor_gc_size`、`process_full_gc_size`、`thread_wait_gc_max_milliseconds` などのパラメータを調整して、メモリ状態の更新や GC を制御することもできます。

## 異常によって OOM Killer が作動する場合

クラスターのメモリ負荷が高すぎる場合、メモリ状態に異常が生じ、メモリ GC で適時にメモリを解放できないことがあります。以下は、OOM Killer の作動につながる一般的な異常です。

### Memory Tracker の統計情報が欠落している

`Label=process resident memory` と `Label=sum of all trackers` の Memory Tracker の値をログ内の `Memory Tracker Summary` で比較し、差が大きい場合、または Orphan Memory Tracker の値が大きすぎる場合は、Memory Tracker の統計情報が欠落しています。詳しい分析については、[Memory Tracker](./../memory-feature/memory-tracker.md)の「Memory Tracker の統計情報が欠落している」セクションを参照してください。

### クエリのキャンセル処理が停止する

`be/log/be.INFO` で OOM Killer が作動した時刻を特定し、その前後の `Memory Tracker Summary` を検索してプロセスのメモリ使用状況を示すログを探します。`Memory Tracker Summary` に大量のメモリを使用するクエリがある場合は、`grep {queryID} be/log/be.INFO` を実行し、`Cancel` を含むログがあるか確認します。そのログの時刻が、クエリがキャンセルされた時刻です。クエリがキャンセルされていて、その時刻から OOM Killer が作動するまでに長い時間が経過している場合は、[メモリに関する問題の FAQ](../../../trouble-shooting/memory-management/memory-issue-faq)の「クエリのキャンセル処理が停止する」の分析を参照してください。`Memory Tracker Summary` の分析方法については、[メモリログの分析](./memory-log-analysis.md)を参照してください。

### Jemalloc Metadata のメモリ使用量が大きい

現在、メモリ GC では Jemalloc Metadata を解放できません。`Label=tc/jemalloc_metadata` の Memory Tracker について、[Memory Tracker](./../memory-feature/memory-tracker.md)の分析を参照し、メモリ使用量を減らしてください。

### Jemalloc Cache のメモリ使用量が大きい

> Doris 2.0 でよく見られます。

`lg_tcache_max` は `JEMALLOC_CONF` で指定する項目で、`be.conf` における Doris 2.0 のデフォルト値は 20 です。この設定により、状況によっては Jemalloc Cache が大きくなりすぎ、自動的に解放されなくなることがあります。[Jemalloc のメモリ分析](./jemalloc-memory-analysis.md)を参照し、Jemalloc Cache のメモリ使用量を減らしてください。
