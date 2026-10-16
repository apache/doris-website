---
{
    "title": "モニタリングメトリクス",
    "language": "ja",
    "description": "Doris の FE と BE のモニタリングメトリクスを網羅したリファレンスです。プロセス、JVM、マシンのメトリクスと P0 優先度を示し、クラスタの健全性監視とアラート設定に役立ちます。"
}
---

# モニタリングメトリクス

<!-- Knowledge type: Configuration parameters / Parameter reference -->
<!-- Applicable scenarios: Cluster health monitoring / Alert configuration / Performance troubleshooting -->

Doris の FE と BE のプロセスにはモニタリングメトリクスが組み込まれており、デフォルトで Prometheus 互換形式で公開されます。この文書では観測可能なメトリクスを体系的に列挙し、優先度（Priority）を示します。Prometheus + Grafana と連携した後、監視とアラートの仕組みをすばやく構築できます。

## 適用シナリオ

| シナリオ | 目的 |
| --- | --- |
| クラスタの健全性監視 | P0 メトリクスを使って FE/BE ノードの異常をすばやく検出する |
| アラート設定 | QPS、エラー率、Compaction Score などのメトリクスにしきい値ベースのアラートを設定する |
| パフォーマンスのトラブルシューティング | クエリのレイテンシ、スレッドプールのキュー待ち、メモリ使用量のメトリクスからボトルネックを特定する |
| 容量計画 | ディスク使用量、タブレット数、接続数を使ってクラスタの負荷を評価する |
| 障害の振り返り | マシンのメトリクス（CPU、IO、ネットワーク）とプロセスのメトリクスを組み合わせて障害の根本原因を分析する |

## メトリクスの分類

Doris のモニタリングメトリクスは、観測対象によって次の二つのカテゴリに分かれます。

1. **プロセス監視**：クエリ数、トランザクション数、Compaction の状態など、Doris プロセス自体の実行時メトリクスを示します。
2. **ノード監視**：CPU、メモリ、IO、ネットワークなど、Doris プロセスを実行するマシンのリソースメトリクスを示します。

## モニタリングメトリクスの取得

### Prometheus 互換形式（デフォルト）

FE または BE ノードの HTTP ポートに直接アクセスします。

```shell
curl http://fe_host:http_port/metrics
curl http://be_host:webserver_port/metrics
```

レスポンスの例：

```text
doris_fe_cache_added{type="partition"} 0
doris_fe_cache_added{type="sql"} 0
doris_fe_cache_hit{type="partition"} 0
doris_fe_cache_hit{type="sql"} 0
doris_fe_connection_total 2
```

### JSON 形式

`type=json` パラメータを使用して、メトリクスを JSON 形式で取得します。

```shell
curl http://fe_host:http_port/metrics?type=json
curl http://be_host:webserver_port/metrics?type=json
```

## 監視の優先度とベストプラクティス

<!-- Knowledge type: Best practices -->

- 各メトリクス表の最後の列は優先度（Priority）です。**P0 が最も重要**で、値が大きいほど重要度は低くなります。まず P0 メトリクスを取り込みます。
- モニタリングメトリクスの大半は Counter 型（累積値）です。**有用な情報を得るには、一定間隔（例：15 秒ごと）でサンプリングし、単位時間あたりの増加率を計算する必要があります**。

    例えば、`doris_fe_query_err` の増加率を計算すると、クエリエラー率（毎秒のエラー数）が得られます。

> より網羅的で有用なモニタリングメトリクスの一覧にするため、この表への貢献を歓迎します。

## FE モニタリングメトリクス

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: FE node health monitoring / Metadata sync monitoring / Query performance monitoring -->

### プロセス監視

| 名前 | ラベル | 単位 | 意味 | 説明 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| `doris_fe_cache_added` | {type="partition"} | 数 | 新規 Partition Cache の累積追加数 |  |  |
|  | {type="sql"} | 数 | 新規 SQL Cache の累積追加数 |  |  |
| `doris_fe_cache_hit` | {type="partition"} | 数 | Partition Cache のヒット数 |  |  |
|  | {type="sql"} | 数 | SQL Cache のヒット数 |  |  |
| `doris_fe_connection_total` |  | 数 | FE の MySQL ポートへの現在の接続数 | クエリ接続数を監視します。接続数が上限を超えると新しい接続を受け付けられません | P0 |
| `doris_fe_counter_hit_sql_block_rule` |  | 数 | SQL BLOCK RULE によってブロックされたクエリ数 |  |  |
| `doris_fe_edit_log_clean` | {type="failed"} | 数 | 過去のメタデータログのクリーンアップ失敗回数 | 通常は失敗しません。失敗した場合は手動での対応が必要です | P0 |
|  | {type="success"} | 数 | 過去のメタデータログのクリーンアップ成功回数 |  |  |
| `doris_fe_edit_log` | {type="accumulated_bytes"} | バイト | メタデータログの累積書き込み量 | 増加率から書き込み速度を求め、書き込みの遅延を確認します | P0 |
|  | {type="current_bytes"} | バイト | メタデータログの現在の値 | editlog のサイズを監視します。上限を超えた場合は手動での対応が必要です | P0 |
|  | {type="read"} | 数 | メタデータログの読み取り回数 | 増加率から読み取り頻度が正常か確認します | P0 |
|  | {type="write"} | 数 | メタデータログの書き込み回数 | 増加率から書き込み頻度が正常か確認します | P0 |
|  | {type="current"} | 数 | 現在のメタデータログ数 | editlog の数を監視します。上限を超えた場合は手動での対応が必要です | P0 |
| `doris_fe_editlog_write_latency_ms` |  | ミリ秒 | メタデータログの書き込みレイテンシのパーセンタイル統計。例えば {quantile="0.75"} は書き込みレイテンシの 75 パーセンタイル値を示します |  |  |
| `doris_fe_image_clean` | {type="failed"} | 数 | 過去のメタデータイメージファイルのクリーンアップ失敗回数 | 通常は失敗しません。失敗した場合は手動での対応が必要です | P0 |
|  | {type="success"} | 数 | 過去のメタデータイメージファイルのクリーンアップ成功回数 |  |  |
| `doris_fe_image_push` | {type="failed"} | 数 | 他の FE ノードへのメタデータイメージファイルのプッシュ失敗回数 |  |  |
|  | {type="success"} | 数 | 他の FE ノードへのメタデータイメージファイルのプッシュ成功回数 |  |  |
| `doris_fe_image_write` | {type="failed"} | 数 | メタデータイメージファイルの生成失敗回数 | 通常は失敗しません。失敗した場合は手動での対応が必要です | P0 |
|  | {type="success"} | 数 | メタデータイメージファイルの生成成功回数 |  |  |
| `doris_fe_job` |  | 数 | 種類と状態ごとのジョブ数。例えば {job="load", type="INSERT", state="LOADING"} は LOADING 状態の INSERT 型ロードジョブ数を示します | 必要に応じてクラスタ内の種類別ジョブ数を確認します | P0 |
| `doris_fe_max_journal_id` |  | 数 | 現在の FE ノードにおけるメタデータログ ID の最大値。Master FE では現在書き込まれた最大 ID、Master 以外の FE では現在リプレイ済みのメタデータログの最大 ID です | 複数の FE の ID に大きな差がないか確認します。差が大きい場合はメタデータ同期に問題があります | P0 |
| `doris_fe_max_tablet_compaction_score` |  | 数 | 全 BE ノードにおける Compaction Score の最大値 | 現在のクラスタで Compaction Score の最大値が高すぎないか確認します。高い値はクエリまたは書き込みのレイテンシを引き起こす可能性があります | P0 |
| `doris_fe_qps` |  | 件/秒 | 現在の FE の毎秒のクエリ数（クエリリクエストのみを計上） | QPS | P0 |
| `doris_fe_query_err` |  | 数 | 失敗したクエリの累積数 |  |  |
| `doris_fe_query_err_rate` |  | 件/秒 | 毎秒の失敗クエリ数 | クラスタ内でクエリエラーが発生しているか確認します | P0 |
| `doris_fe_query_latency_ms` |  | ミリ秒 | クエリリクエストのレイテンシのパーセンタイル統計。例えば {quantile="0.75"} はクエリレイテンシの 75 パーセンタイル値を示します | 各パーセンタイルのクエリレイテンシを詳しく確認します | P0 |
| `doris_fe_query_latency_ms_db` |  | ミリ秒 | DB ごとのクエリリクエストのレイテンシのパーセンタイル統計。例えば {quantile="0.75",db="test"} は DB test のクエリレイテンシの 75 パーセンタイル値を示します | DB ごとに各パーセンタイルのクエリレイテンシを詳しく確認します | P0 |
| `doris_fe_query_olap_table` |  | 数 | 内部テーブル（OlapTable）に対するクエリリクエスト数 |  |  |
| `doris_fe_query_total` |  | 数 | 全クエリリクエストの累積数 |  |  |
| `doris_fe_report_queue_size` |  | 数 | BE から送られる各種定期レポートタスクの、FE 側のキュー長 | Master FE ノードでのレポートタスクの滞留度を示します。値が大きいほど FE の処理能力に余裕がありません | P0 |
| `doris_fe_request_total` |  | 数 | MySQL ポートを通じて受信したすべての操作リクエスト（クエリとその他のステートメントを含む） |  |  |
| `doris_fe_routine_load_error_rows` |  | 数 | クラスタ内の全 Routine Load ジョブにおけるエラー行の総数 |  |  |
| `doris_fe_routine_load_receive_bytes` |  | バイト | クラスタ内の全 Routine Load ジョブが受信したデータの総量 |  |  |
| `doris_fe_routine_load_rows` |  | 数 | クラスタ内の全 Routine Load ジョブが受信したデータ行の総数 |  |  |
| `doris_fe_routine_load_get_meta_latency` |  | ミリ秒 | クラスタ内の全 Routine Load ジョブでのメタデータ取得レイテンシ |  |  |
| `doris_fe_routine_load_get_meta_count` |  | 数 | クラスタ内の全 Routine Load ジョブでのメタデータ取得回数 |  |  |
| `doris_fe_routine_load_get_meta_fail_count` |  | 数 | クラスタ内の全 Routine Load ジョブでのメタデータ取得失敗回数 |  |  |
| `doris_fe_routine_load_task_execute_time` |  | ミリ秒 | クラスタ内の全 Routine Load タスクの実行時間 |  |  |
| `doris_fe_routine_load_task_execute_count` |  | 数 | クラスタ内の全 Routine Load タスクの実行回数 |  |  |
| `doris_fe_routine_load_lag` |  | ミリ秒 | クラスタ内の全 Routine Load ジョブの消費遅延 |  |  |
| `doris_fe_routine_load_progress` |  | ミリ秒 | クラスタ内の全 Routine Load ジョブの消費進捗 |  |  |
| `doris_fe_routine_load_abort_task_num` |  | 数 | クラスタ内の全 Routine Load ジョブで失敗したタスクの数 |  |  |
| `doris_fe_rps` |  | 数 | 現在の FE の毎秒のリクエスト数（クエリとその他のステートメントを含む） | QPS と併せて、クラスタが処理するリクエスト量を確認します | P0 |
| `doris_fe_scheduled_tablet_num` |  | 数 | Master FE ノードが現在スケジュールしているタブレット数。修復中およびバランス調整中のレプリカを含みます | クラスタ内で現在移動中のタブレット数を示します。長期間ゼロ以外の場合、クラスタが不安定であることを示します | P0 |
| `doris_fe_tablet_max_compaction_score` |  | 数 | 各 BE ノードが報告する Compaction Score。例えば {backend="172.21.0.1:9556"} は "172.21.0.1:9556" の BE が報告した値を示します |  |  |
| `doris_fe_tablet_num` |  | 数 | 各 BE ノードのタブレット総数。例えば {backend="172.21.0.1:9556"} は "172.21.0.1:9556" の BE に現在あるタブレット数を示します | タブレットの分布が均等か、絶対数が妥当かを確認します | P0 |
| `doris_fe_tablet_status_count` |  | 数 | Master FE ノードの Tablet スケジューラがスケジュールしたタブレットの累積数 |  |  |
|  | {type="added"} | 数 | Master FE ノードの Tablet スケジューラがスケジュールしたタブレットの累積数。"added" はスケジュール済みのタブレット数を示します |  |  |
|  | {type="in_sched"} | 数 | 上記と同様。繰り返しスケジュールされたタブレット数を示します | 急増する場合、一部のタブレットが長期間異常な状態にあり、繰り返しスケジュールされています |  |
|  | {type="not_ready"} | 数 | 上記と同様。スケジュールのトリガー条件をまだ満たしていないタブレット数を示します | 急増する場合、多数のタブレットが異常でもスケジュールできない状態です |  |
|  | {type="total"} | 数 | 上記と同様。チェック済みのタブレットの累積数を示します（スケジュール済みとは限りません） |  |  |
|  | {type="unhealthy"} | 数 | 上記と同様。チェック済みの異常なタブレットの累積数を示します |  |  |
| `doris_fe_thread_pool` |  | 数 | 各種スレッドプールのワーカースレッドとキュー待ちの統計。`active_thread_num` は現在実行中のタスク数、`pool_size` はプール内の総スレッド数、`task_in_queue` は現在キューに入っているタスク数を示します |  |  |
|  | {name="agent-task-pool"} | 数 | Master FE が BE に Agent Task を送信するためのスレッドプール |  |  |
|  | {name="connect-scheduler-check-timer"} | 数 | MySQL のアイドル接続がタイムアウトしたか確認するためのスレッドプール |  |  |
|  | {name="connect-scheduler-pool"} | 数 | MySQL 接続リクエストを受け付けるためのスレッドプール |  |  |
|  | {name="mysql-nio-pool"} | 数 | NIO MySQL Server がタスクを処理するためのスレッドプール |  |  |
|  | {name="export-exporting-job-pool"} | 数 | exporting 状態のエクスポートジョブをスケジュールするスレッドプール |  |  |
|  | {name="export-pending-job-pool"} | 数 | pending 状態のエクスポートジョブをスケジュールするスレッドプール |  |  |
|  | {name="heartbeat-mgr-pool"} | 数 | Master FE が各ノードからのハートビートを処理するためのスレッドプール |  |  |
|  | {name="loading-load-task-scheduler"} | 数 | Master FE が Broker Load ジョブの loading タスクをスケジュールするためのスレッドプール |  |  |
|  | {name="pending-load-task-scheduler"} | 数 | Master FE が Broker Load ジョブの pending タスクをスケジュールするためのスレッドプール |  |  |
|  | {name="schema-change-pool"} | 数 | Master FE がスキーマ変更ジョブをスケジュールするためのスレッドプール |  |  |
|  | {name="thrift-server-pool"} | 数 | FE 側の ThriftServer のワーカースレッドプール。fe.conf の `rpc_port` に対応し、BE との通信に使用します |  |  |
| `doris_fe_txn_counter` |  | 数 | 状態ごとのロードトランザクションの累積数 | ロードトランザクションの実行状況を確認します | P0 |
|  | {type="begin"} | 数 | 開始されたトランザクション数 |  |  |
|  | {type="failed"} | 数 | 失敗したトランザクション数 |  |  |
|  | {type="reject"} | 数 | 拒否されたトランザクション数（例：実行中のトランザクション数がしきい値を超え、新しいトランザクションが拒否された場合） |  |  |
|  | {type="success"} | 数 | 成功したトランザクション数 |  |  |
| `doris_fe_txn_status` |  | 数 | 各状態に現在あるロードトランザクション数。例えば {type="committed"} は committed 状態のトランザクション数を示します | 状態ごとの数から滞留がないか確認します | P0 |
| `doris_fe_query_instance_num` |  | 数 | 特定のユーザーが現在リクエストしているフラグメントインスタンス数。例えば {user="test_u"} はユーザー test_u の数を示します | 特定のユーザーがクエリリソースを使いすぎていないか確認します | P0 |
| `doris_fe_query_instance_begin` |  | 数 | 特定のユーザーがリクエストを開始したフラグメントインスタンス数。例えば {user="test_u"} はユーザー test_u の数を示します | 特定のユーザーがクエリを送信しすぎていないか確認します | P0 |
| `doris_fe_query_rpc_total` |  | 数 | 特定の BE に送信された RPC 数。例えば {be="192.168.10.1"} は IP 192.168.10.1 の BE に送信された RPC 数を示します | 特定の BE に RPC が集中していないか確認します |  |
| `doris_fe_query_rpc_failed` |  | 数 | 特定の BE に送信された RPC の失敗数。例えば {be="192.168.10.1"} は IP 192.168.10.1 の BE への失敗数を示します | 特定の BE に RPC の問題がないか確認します |  |
| `doris_fe_query_rpc_size` |  | 数 | 特定の BE に対する RPC データサイズ。例えば {be="192.168.10.1"} は IP 192.168.10.1 の BE に送信された RPC データのバイト数を示します | 特定の BE に大きすぎる RPC が送信されていないか確認します |  |
| `doris_fe_txn_exec_latency_ms` |  | ミリ秒 | トランザクション実行時間のパーセンタイル統計。例えば {quantile="0.75"} は実行時間の 75 パーセンタイル値を示します | 各パーセンタイルの実行時間を詳しく確認します | P0 |
| `doris_fe_txn_publish_latency_ms` |  | ミリ秒 | トランザクション publish 時間のパーセンタイル統計。例えば {quantile="0.75"} は publish 時間の 75 パーセンタイル値を示します | 各パーセンタイルの publish 時間を詳しく確認します | P0 |
| `doris_fe_txn_num` |  | 数 | 特定の DB で現在実行中のトランザクション数。例えば {db="test"} は DB test の数を示します | 特定の DB に多数のトランザクションが送信されていないか確認します | P0 |
| `doris_fe_publish_txn_num` |  | 数 | 特定の DB で現在 publish 中のトランザクション数。例えば {db="test"} は DB test の数を示します | 特定の DB の publish 中のトランザクション数を確認します | P0 |
| `doris_fe_txn_replica_num` |  | 数 | 特定の DB で現在実行中のトランザクションが開いたレプリカ数。例えば {db="test"} は DB test の数を示します | 特定の DB がレプリカを開きすぎて他のトランザクションの実行に影響していないか確認します | P0 |
| `doris_fe_thrift_rpc_total` |  | 数 | FE の thrift インターフェースの各メソッドが受信した RPC リクエスト数。例えば {method="report"} は report メソッドの受信数を示します | 特定の thrift rpc メソッドの負荷を確認します |  |
| `doris_fe_thrift_rpc_latency_ms` |  | ミリ秒 | FE の thrift インターフェースの各メソッドにおける RPC リクエスト処理時間。例えば {method="report"} は report メソッドの処理時間を示します | 特定の thrift rpc メソッドの負荷を確認します |  |
| `doris_fe_external_schema_cache` | {catalog="hive"} | 数 | 特定の External Catalog のスキーマキャッシュのエントリ数 |  |  |
| `doris_fe_hive_meta_cache` | {catalog="hive"} | 数 |  |  |  |
|  | `{type="partition_value"}` | 数 | 特定の External Hive Metastore Catalog のパーティション値キャッシュのエントリ数 |  |  |
|  | `{type="partition"}` | 数 | 特定の External Hive Metastore Catalog のパーティションキャッシュのエントリ数 |  |  |
|  | `{type="file"}` | 数 | 特定の External Hive Metastore Catalog のファイルキャッシュのエントリ数 |  |  |
| `doris_fe_virtual_compute_group_switch_total` | `{virtual_compute_group_id, virtual_compute_group_name, src_compute_group_id, src_compute_group_name, dst_compute_group_id, dst_compute_group_name}` | 数 | 仮想コンピュートグループのアクティブ・スタンバイ切り替えの累積回数。バージョン 4.0.8 以降でサポートされ、コンピュートとストレージの分離モードでのみ生成されます | 増加率から頻繁な切り替えがないか確認します。頻繁な切り替えは通常、プライマリコンピュートグループが不安定であることを示します |  |

### JVM 監視

| 名前 | ラベル | 単位 | 意味 | 説明 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| `jvm_heap_size_bytes` |  | バイト | JVM メモリの監視。ラベル max、used、committed はそれぞれ最大容量、使用量、確保済み容量に対応します | JVM のメモリ使用量を確認します | P0 |
| `jvm_non_heap_size_bytes` |  | バイト | JVM のヒープ外メモリの統計 |  |  |
| `<GarbageCollector>` |  |  | GC の監視 | GarbageCollector は特定のガベージコレクタを指します | P0 |
|  | {type="count"} | 数 | GC の累積実行回数 |  |  |
|  | {type="time"} | ミリ秒 | GC の累積実行時間 |  |  |
| `jvm_old_size_bytes` |  | バイト | JVM の Old 世代メモリの統計 |  | P0 |
| `jvm_thread` |  | 数 | JVM のスレッド数の統計 | JVM のスレッド数が妥当か確認します | P0 |
| `jvm_young_size_bytes` |  | バイト | JVM の Young 世代メモリの統計 |  | P0 |

### マシン監視

| 名前 | ラベル | 単位 | 意味 | 説明 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| `system_meminfo` |  | バイト | FE ノードのマシンのメモリ監視。`/proc/meminfo` から収集します。`buffers`、`cached`、`memory_available`、`memory_free`、`memory_total` を含みます |  |  |
| `system_snmp` |  |  | FE ノードのマシンのネットワーク監視。`/proc/net/snmp` から収集します |  |  |
|  | `{name="tcp_in_errs"}` | 数 | tcp パケットの受信エラー数 |  |  |
|  | `{name="tcp_in_segs"}` | 数 | 受信した tcp パケット数 |  |  |
|  | `{name="tcp_out_segs"}` | 数 | 送信した tcp パケット数 |  |  |
|  | `{name="tcp_retrans_segs"}` | 数 | tcp パケットの再送回数 |  |  |

## BE モニタリングメトリクス

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: BE node health monitoring / Query and write performance monitoring / Compaction monitoring -->

### プロセス監視

| 名前 | ラベル | 単位 | 意味 | 説明 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| `doris_be_active_scan_context_count` |  | 数 | 外部システムが直接開いているスキャナの現在の数を示します |  |  |
| `doris_be_add_batch_task_queue_size` |  | 数 | ロード時にバッチを受信するスレッドプールのキューサイズを記録します | 0 を超えるとロードタスクの受信側に滞留があります | P0 |
| `agent_task_queue_size` |  | 数 | 各 Agent Task 処理キューの長さを示します。例えば `{type="CREATE_TABLE"}` は CREATE_TABLE タスクキューの長さを示します |  |  |
| `doris_be_brpc_endpoint_stub_count` |  | 数 | BE 間の通信に使用する、作成済み brpc スタブの数 |  |  |
| `doris_be_brpc_function_endpoint_stub_count` |  | 数 | Remote RPC との通信に使用する、作成済み brpc スタブの数 |  |  |
| `doris_be_cache_capacity` |  |  | 特定の LRU Cache の容量を記録します |  |  |
| `doris_be_cache_usage` |  |  | 特定の LRU Cache の使用量を記録します | メモリ使用量を確認します | P0 |
| `doris_be_cache_usage_ratio` |  |  | 特定の LRU Cache の使用率を記録します |  |  |
| `doris_be_cache_lookup_count` |  |  | 特定の LRU Cache の検索回数を記録します |  |  |
| `doris_be_cache_hit_count` |  |  | 特定の LRU Cache のヒット数を記録します |  |  |
| `doris_be_cache_hit_ratio` |  |  | 特定の LRU Cache のヒット率を記録します | キャッシュが有効に機能しているか確認します | P0 |
|  | {name="DataPageCache"} | 数 | DataPageCache はデータの Data Page をキャッシュします | データキャッシュであり、クエリ効率に直接影響します | P0 |
|  | {name="IndexPageCache"} | 数 | IndexPageCache はデータの Index Page をキャッシュします | インデックスキャッシュであり、クエリ効率に直接影響します | P0 |
|  | {name="LastSuccessChannelCache"} | 数 | LastSuccessChannelCache はロード受信側の LoadChannel をキャッシュします |  |  |
|  | {name="SegmentCache"} | 数 | SegmentCache はインデックス情報など、開かれた Segment をキャッシュします |  |  |
| `doris_be_chunk_pool_local_core_alloc_count` |  | 数 | ChunkAllocator でバインドされたコアのメモリキューからメモリを割り当てた回数 |  |  |
| `doris_be_chunk_pool_other_core_alloc_count` |  | 数 | ChunkAllocator で他のコアのメモリキューからメモリを割り当てた回数 |  |  |
| `doris_be_chunk_pool_reserved_bytes` |  | バイト | ChunkAllocator が予約したメモリのサイズ |  |  |
| `doris_be_chunk_pool_system_alloc_cost_ns` |  | ナノ秒 | SystemAllocator によるメモリ割り当ての累積所要時間 | 増加率からメモリ割り当てにかかる時間を確認します | P0 |
| `doris_be_chunk_pool_system_alloc_count` |  | 数 | SystemAllocator によるメモリ割り当て回数 |  |  |
| `doris_be_chunk_pool_system_free_cost_ns` |  | ナノ秒 | SystemAllocator によるメモリ解放の累積所要時間 | 増加率からメモリ解放にかかる時間を確認します | P0 |
| `doris_be_chunk_pool_system_free_count` |  | 数 | SystemAllocator によるメモリ解放回数 |  |  |
| `doris_be_compaction_bytes_total` |  | バイト | Compaction が処理したデータの累積量 | Compaction タスクの入力 rowset のディスクサイズを記録します。増加率から Compaction の処理速度を確認します | P0 |
|  | {type="base"} | バイト | Base Compaction の累積データ量 |  |  |
|  | {type="cumulative"} | バイト | Cumulative Compaction の累積データ量 |  |  |
| `doris_be_compaction_deltas_total` |  | 数 | Compaction が処理した rowset の累積数 | Compaction タスクの入力 rowset 数を記録します |  |
|  | {type="base"} | 数 | Base Compaction が処理した rowset の累積数 |  |  |
|  | {type="cumulative"} | 数 | Cumulative Compaction が処理した rowset の累積数 |  |  |
| `doris_be_disks_compaction_num` |  | 数 | 特定のデータディレクトリで現在実行中の Compaction タスク数。例えば `{path="/path1/"}` は `/path1` ディレクトリで実行中のタスク数を示します | 各ディスクの Compaction タスク数が妥当か確認します | P0 |
| `doris_be_disks_compaction_score` |  | 数 | 特定のデータディレクトリで現在実行中の Compaction トークン数。例えば `{path="/path1/"}` は `/path1` ディレクトリで実行中のトークン数を示します |  |  |
| `doris_be_compaction_used_permits` |  | 数 | Compaction タスクがすでに使用しているトークン数 | Compaction のリソース消費を示します |  |
| `doris_be_compaction_waitting_permits` |  | 数 | Compaction トークンを待機している項目数 |  |  |
| `doris_be_data_stream_receiver_count` |  | 数 | 受信側のデータ Receiver 数 | FIXME：このメトリクスはベクトル化エンジンにはありません |  |
| `doris_be_disks_avail_capacity` |  | バイト | 特定のデータディレクトリがあるディスクの残り容量。例えば `{path="/path1/"}` は `/path1` ディレクトリがあるディスクの残り容量を示します |  | P0 |
| `doris_be_disks_local_used_capacity` |  | バイト | 特定のデータディレクトリがあるディスクでローカルに使用中の容量 |  |  |
| `doris_be_disks_remote_used_capacity` |  | バイト | 特定のデータディレクトリがあるディスクに対応するリモートディレクトリの使用容量 |  |  |
| `doris_be_disks_state` |  | 真偽値 | 特定のデータディレクトリのディスク状態。1 は正常、0 は異常を示します |  |  |
| `doris_be_disks_total_capacity` |  | バイト | 特定のデータディレクトリがあるディスクの総容量 | `doris_be_disks_avail_capacity` と併せてディスク使用率を計算します | P0 |
| `doris_be_engine_requests_total` |  | 数 | BE 上の各種タスクの実行状態別の累積数 |  |  |
|  | {status="failed",type="xxx"} | 数 | xxx 型タスクの失敗の累積回数 |  |  |
|  | {status="total",type="xxx"} | 数 | xxx 型タスクの実行総数の累積値 | 必要に応じて各種タスクの失敗回数を監視します | P0 |
|  | `{status="skip",type="report_all_tablets"}` | 数 | xxx 型タスクがスキップされた累積回数 |  |  |
| `doris_be_fragment_endpoint_count` |  | 数 | `doris_be_data_stream_receiver_count` と同じ | FIXME：`doris_be_data_stream_receiver_count` と同数です。ベクトル化エンジンにはこちらもありません |  |
| `doris_be_fragment_request_duration_us` |  | マイクロ秒 | 全フラグメントインスタンスの累積実行時間 | 増加率からインスタンスの実行時間を確認します | P0 |
| `doris_be_fragment_requests_total` |  | 数 | 実行されたフラグメントインスタンスの累積数 |  |  |
| `doris_be_load_channel_count` |  | 数 | 現在開いているロードチャネル数 | 値が大きいほど、現在実行中のロードタスクが多いことを示します | P0 |
| `doris_be_local_bytes_read_total` |  | バイト | `LocalFileReader` が読み取ったバイト数 |  | P0 |
| `doris_be_local_bytes_written_total` |  | バイト | `LocalFileWriter` が書き込んだバイト数 |  | P0 |
| `doris_be_local_file_reader_total` |  | 数 | 開かれた `LocalFileReader` インスタンスの累積数 |  |  |
| `doris_be_local_file_open_reading` |  | 数 | 現在開いている `LocalFileReader` インスタンス数 |  |  |
| `doris_be_local_file_writer_total` |  | 数 | 開かれた `LocalFileWriter` インスタンスの累積数 |  |  |
| `doris_be_mem_consumption` |  | バイト | 特定のモジュールの現在のメモリ消費量。例えば {type="compaction"} は Compaction モジュールの現在の総メモリ消費量を示します | 同じ型の MemTracker から取得した値です。FIXME |  |
| `doris_be_memory_allocated_bytes` |  | バイト | `/proc/self/status/VmRSS` から取得した BE プロセスの物理メモリサイズ |  | P0 |
| `doris_be_memory_jemalloc` |  | バイト | `je_mallctl` から取得した Jemalloc の統計 | 意味については https://jemalloc.net/jemalloc.3.html を参照してください | P0 |
| `doris_be_memory_pool_bytes_total` |  | バイト | 全 MemPool が現在占有しているメモリサイズ。実際のメモリ使用量を表さない統計値です |  |  |
| `doris_be_memtable_flush_duration_us` |  | マイクロ秒 | memtable のディスクへの書き込みにかかった累積時間 | 増加率から書き込みレイテンシを確認します | P0 |
| `doris_be_memtable_flush_total` |  | 数 | ディスクに書き込まれた memtable の累積数 | 増加率からファイル書き込みの頻度を計算します | P0 |
| `doris_be_meta_request_duration` |  | マイクロ秒 | RocksDB のメタデータへのアクセスにかかった累積時間 | 増加率から BE メタデータの読み書きレイテンシを確認します | P0 |
|  | {type="read"} | マイクロ秒 | 読み取り時間 |  |  |
|  | {type="write"} | マイクロ秒 | 書き込み時間 |  |  |
| `doris_be_meta_request_total` |  | 数 | RocksDB のメタデータへの累積アクセス回数 | 増加率から BE メタデータへのアクセス頻度を確認します | P0 |
|  | {type="read"} | 数 | 読み取り回数 |  |  |
|  | {type="write"} | 数 | 書き込み回数 |  |  |
| `doris_be_fragment_instance_count` |  | 数 | 現在受信しているフラグメントインスタンス数 | インスタンスの滞留がないか確認します | P0 |
| `doris_be_process_fd_num_limit_hard` |  | 数 | BE プロセスのファイルハンドル数のハード上限。`/proc/pid/limits` から収集します |  |  |
| `doris_be_process_fd_num_limit_soft` |  | 数 | BE プロセスのファイルハンドル数のソフト上限。`/proc/pid/limits` から収集します |  |  |
| `doris_be_process_fd_num_used` |  | 数 | BE プロセスが使用しているファイルハンドル数。`/proc/pid/limits` から収集します |  |  |
| `doris_be_process_thread_num` |  | 数 | BE プロセスのスレッド数。`/proc/pid/task` から収集します |  | P0 |
| `doris_be_query_cache_memory_total_byte` |  | バイト | Query Cache が占有するバイト数 |  |  |
| `doris_be_query_cache_partition_total_count` |  | 数 | Partition Cache の現在のエントリ数 |  |  |
| `doris_be_query_cache_sql_total_count` |  | 数 | SQL Cache の現在のエントリ数 |  |  |
| `doris_be_query_scan_bytes` |  | バイト | 読み取られたデータの累積量。Olap テーブルから読み取られたデータのみ計上します |  |  |
| `doris_be_query_scan_bytes_per_second` |  | バイト/秒 | `doris_be_query_scan_bytes` から計算した読み取り速度 | クエリ速度を確認します | P0 |
| `doris_be_query_scan_rows` |  | 数 | 読み取られた行の累積数。Olap テーブルから読み取られたデータのみ計上します。これは RawRowsRead です（インデックスでスキップされ、実際には読み取られなかったデータ行も計上される場合があります） | 増加率からクエリ速度を確認します | P0 |
| `doris_be_result_block_queue_count` |  | 数 | 現在クエリ結果キャッシュにあるフラグメントインスタンス数 | このキューは外部システムが直接読み取る場合にのみ使用します。例えば Spark on Doris は external scan を介してデータをクエリします |  |
| `doris_be_result_buffer_block_count` |  | 数 | 現在クエリ結果キャッシュにあるクエリ数 | 現在の BE で FE による消費を待っているクエリ結果の数を示します | P0 |
| `doris_be_routine_load_task_count` |  | 数 | 現在実行中の Routine Load タスク数 |  |  |
| `doris_be_rowset_count_generated_and_in_use` |  | 数 | 前回の起動以降に追加され、使用中の rowset ID 数 |  |  |
| `doris_be_s3_bytes_read_total` |  | 数 | `S3FileReader` が開かれた累積回数 |  |  |
| `doris_be_s3_file_open_reading` |  | 数 | 現在開いている `S3FileReader` インスタンス数 |  |  |
| `doris_be_s3_bytes_read_total` |  | バイト | `S3FileReader` が読み取ったバイトの累積数 |  |  |
| `doris_be_scanner_thread_pool_queue_size` |  | 数 | OlapScanner 用スレッドプールの現在のキューサイズ | ゼロを超えると Scanner が滞留し始めていることを示します | P0 |
| `doris_be_segment_read` | `{type="segment_read_total"}` | 数 | 読み取られたセグメントの累積数 |  |  |
| `doris_be_segment_read` | `{type="segment_row_total"}` | 数 | セグメント全体で読み取られた行の累積数 | インデックスでフィルタリングされた行も含みます。読み取られたセグメント数に、各セグメントの総行数を乗じた値に相当します |  |
| `doris_be_send_batch_thread_pool_queue_size` |  | 数 | ロード中にデータパケットを送信するスレッドプールのキューサイズ | 0 を超えると滞留を示します | P0 |
| `doris_be_send_batch_thread_pool_thread_num` |  | 数 | ロード中にデータパケットを送信するスレッドプールのスレッド数 |  |  |
| `doris_be_small_file_cache_count` |  | 数 | 現在 BE にキャッシュされている小さなファイルの数 |  |  |
| `doris_be_streaming_load_current_processing` |  | 数 | 現在実行中の Stream Load タスク数 | curl コマンドで送信されたタスクのみ含みます |  |
| `doris_be_streaming_load_duration_ms` |  | ミリ秒 | 全 Stream Load タスクの累積実行時間 |  |  |
| `doris_be_streaming_load_requests_total` |  | 数 | Stream Load タスクの累積数 | 増加率からタスク送信頻度を確認します | P0 |
| `doris_be_stream_load_pipe_count` |  | 数 | 現在の Stream Load データパイプ数 | Stream Load と Routine Load の両方のタスクを含みます |  |
| `doris_be_stream_load` | {type="load_rows"} | 数 | Stream Load によって最終的にロードされた行の累積数 | Stream Load と Routine Load の両方のタスクを含みます | P0 |
| `doris_be_stream_load` | {type="receive_bytes"} | バイト | Stream Load が受信したバイトの累積数 | HTTP 経由で Stream Load が受信したデータと、Routine Load が Kafka から読み取ったデータを含みます | P0 |
| `doris_be_tablet_base_max_compaction_score` |  | 数 | 現在の Base Compaction Score の最大値 | この値はリアルタイムに変化するため、ピークを見逃す場合があります。値が高いほど Compaction の滞留が深刻です | P0 |
| `doris_be_tablet_cumulative_max_compaction_score` |  | 数 | 上記と同様。現在の Cumulative Compaction Score の最大値 |  |  |
| `doris_be_tablet_version_num_distribution` |  | 数 | タブレットのバージョン数のヒストグラム | タブレットのバージョン数の分布を示します | P0 |
| `doris_be_thrift_connections_total` |  | 数 | 作成された thrift 接続の累積数。例えば `{name="heartbeat"}` は heartbeat サービスへの累積接続数を示します | BE がサーバー側として動作する thrift サーバーの値です |  |
| `doris_be_thrift_current_connections` |  | 数 | 現在の thrift 接続数。例えば `{name="heartbeat"}` は heartbeat サービスへの現在の接続数を示します | 上記と同様です |  |
| `doris_be_thrift_opened_clients` |  | 数 | 現在開いている thrift クライアント数。例えば `{name="frontend"}` は FE サービスにアクセスするクライアント数を示します |  |  |
| `doris_be_thrift_used_clients` |  | 数 | 現在使用中の thrift クライアント数。例えば `{name="frontend"}` は FE サービスへのアクセスに現在使用中のクライアント数を示します |  |  |
| `doris_be_timeout_canceled_fragment_count` |  | 数 | タイムアウトによってキャンセルされたフラグメントインスタンスの累積数 | 同じインスタンスが複数回記録される場合があります。例えば一部のインスタンスは複数回キャンセルされます | P0 |
| `doris_be_stream_load_txn_request` | {type="begin"} | 数 | 開始された Stream Load トランザクションの累積数 | Stream Load と Routine Load の両方のタスクを含みます |  |
| `doris_be_stream_load_txn_request` | {type="commit"} | 数 | 正常にコミットされた Stream Load トランザクションの累積数 | 上記と同様です |  |
| `doris_be_stream_load_txn_request` | {type="rollback"} | 数 | 失敗した Stream Load トランザクションの累積数 | 上記と同様です |  |
| `doris_be_unused_rowsets_count` |  | 数 | 現在廃止扱いの rowset 数 | 通常、これらの rowset は定期的に削除されます |  |
| `doris_be_upload_fail_count` |  | 数 | 階層型ストレージ機能で、rowset のリモートストレージへのアップロードに失敗した累積回数 |  |  |
| `doris_be_upload_rowset_count` |  | 数 | 階層型ストレージ機能で、rowset のリモートストレージへのアップロードに成功した累積回数 |  |  |
| `doris_be_upload_total_byte` |  | バイト | 階層型ストレージ機能で、リモートストレージへのアップロードに成功した rowset の累積データ量 |  |  |
| `doris_be_load_bytes` |  | バイト | tablet sink を通じて送信されたバイトの累積数 | ロードデータ量を確認します | P0 |
| `doris_be_load_rows` |  | 数 | tablet sink を通じて送信された行の累積数 | ロードデータ量を確認します | P0 |
| `fragment_thread_pool_queue_size` |  | 数 | クエリ実行スレッドプールの待機キューの現在の長さ | ゼロを超えるとクエリスレッドが不足し、クエリが滞留しています | P0 |
| `doris_be_all_rowsets_num` |  | 数 | 現在の全 rowset の総数 |  | P0 |
| `doris_be_all_segments_num` |  | 数 | 現在の全 segment の総数 |  | P0 |
| `doris_be_heavy_work_max_threads` |  | 数 | brpc heavy スレッドプールのスレッド数 |  | P0 |
| `doris_be_light_work_max_threads` |  | 数 | brpc light スレッドプールのスレッド数 |  | P0 |
| `doris_be_heavy_work_pool_queue_size` |  | 数 | brpc heavy スレッドプールのキュー長の上限。超えるとワークの送信がブロックされます |  | P0 |
| `doris_be_light_work_pool_queue_size` |  | 数 | brpc light スレッドプールのキュー長の上限。超えるとワークの送信がブロックされます |  | P0 |
| `doris_be_heavy_work_active_threads` |  | 数 | brpc heavy スレッドプールのアクティブなスレッド数 |  | P0 |
| `doris_be_light_work_active_threads` |  | 数 | brpc light スレッドプールのアクティブなスレッド数 |  | P0 |
| `routine_load_get_msg_latency` |  | ミリ秒 | Routine Load が Kafka メッセージを取得する際のレイテンシ |  |  |
| `routine_load_get_msg_count` |  | 数 | Routine Load が Kafka メッセージを取得した回数 |  |  |
| `routine_load_consume_bytes` |  | バイト | Routine Load が Kafka から消費したデータ量 |  |  |
| `routine_load_consume_rows` |  | 数 | Routine Load が Kafka から消費した行数 |  |  |

### マシン監視

| 名前 | ラベル | 単位 | 意味 | 説明 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| `doris_be_cpu` |  | 数 | `/proc/stat` から収集する CPU 関連の監視メトリクス。各論理コアの値を収集します。例えば `{device="cpu0",mode="nice"}` は cpu0 の nice 値を示します | これを使って CPU 使用率を計算できます | P0 |
| `doris_be_disk_bytes_read` |  | バイト | 累積ディスク読み取り量。`/proc/diskstats` からディスクごとに収集します。例えば `{device="vdd"}` は vdd ディスクの値を示します |  |  |
| `doris_be_disk_bytes_written` |  | バイト | 累積ディスク書き込み量。上記と同じ方法で収集します |  |  |
| `doris_be_disk_io_time_ms` |  | ミリ秒 | 上記と同じ方法で収集します | これを使って IO Util を計算できます | P0 |
| `doris_be_disk_io_time_weighted` |  | ミリ秒 | 上記と同じ方法で収集します |  |  |
| `doris_be_disk_reads_completed` |  | 数 | 上記と同じ方法で収集します |  |  |
| `doris_be_disk_read_time_ms` |  | ミリ秒 | 上記と同じ方法で収集します |  |  |
| `doris_be_disk_writes_completed` |  | 数 | 上記と同じ方法で収集します |  |  |
| `doris_be_disk_write_time_ms` |  | ミリ秒 | 上記と同じ方法で収集します |  |  |
| `doris_be_fd_num_limit` |  | 数 | システムのファイルハンドル数の上限。`/proc/sys/fs/file-nr` から収集します |  |  |
| `doris_be_fd_num_used` |  | 数 | システムが使用しているファイルハンドル数。`/proc/sys/fs/file-nr` から収集します |  |  |
| `doris_be_file_created_total` |  | 数 | ローカルファイル作成の累積数 | `local_file_writer` を呼び出して最後に閉じられたすべてのファイルを計上します |  |
| `doris_be_load_average` |  | 数 | マシンの Load Avg メトリクス。例えば {mode="15_minutes"} は 15 分間の Load Avg を示します | マシン全体の負荷を確認します | P0 |
| `doris_be_max_disk_io_util_percent` |  | パーセント | 全ディスクの IO UTIL の計算値のうち最大の値 |  | P0 |
| `doris_be_max_network_receive_bytes_rate` |  | バイト/秒 | 全ネットワークインターフェースの受信レートの計算値のうち最大の値 |  | P0 |
| `doris_be_max_network_send_bytes_rate` |  | バイト/秒 | 全ネットワークインターフェースの送信レートの計算値のうち最大の値 |  | P0 |
| `doris_be_memory_pgpgin` |  | バイト | システムがディスクからメモリページに書き込んだデータ量 |  |  |
| `doris_be_memory_pgpgout` |  | バイト | システムがメモリページからディスクに書き込んだデータ量 |  |  |
| `doris_be_memory_pswpin` |  | バイト | システムがディスクからメモリにスワップインしたデータ量 | 通常、スワップは無効にするため、この値は 0 であるべきです |  |
| `doris_be_memory_pswpout` |  | バイト | システムがメモリからディスクにスワップアウトしたデータ量 | 通常、スワップは無効にするため、この値は 0 であるべきです |  |
| `doris_be_network_receive_bytes` |  | バイト | 各ネットワークインターフェースの累積受信バイト数。`/proc/net/dev` から収集します |  |  |
| `doris_be_network_receive_packets` |  | 数 | 各ネットワークインターフェースの累積受信パケット数。`/proc/net/dev` から収集します |  |  |
| `doris_be_network_send_bytes` |  | バイト | 各ネットワークインターフェースの累積送信バイト数。`/proc/net/dev` から収集します |  |  |
| `doris_be_network_send_packets` |  | 数 | 各ネットワークインターフェースの累積送信パケット数。`/proc/net/dev` から収集します |  |  |
| `doris_be_proc` | `{mode="ctxt_switch"}` | 数 | CPU コンテキストスイッチの累積回数。`/proc/stat` から収集します | 異常なコンテキストスイッチがないか確認します | P0 |
| `doris_be_proc` | `{mode="interrupt"}` | 数 | CPU 割り込みの累積回数。`/proc/stat` から収集します |  |  |
| `doris_be_proc` | `{mode="procs_blocked"}` | 数 | システム内で現在ブロックされているプロセス数（例：IO 待ち）。`/proc/stat` から収集します |  |  |
| `doris_be_proc` | `{mode="procs_running"}` | 数 | システム内で現在実行中のプロセス数。`/proc/stat` から収集します |  |  |
| `doris_be_snmp_tcp_in_errs` |  | 数 | tcp パケットの受信エラー数。`/proc/net/snmp` から収集します | 再送やパケット損失などのネットワークエラーを確認します。他の snmp メトリクスと併せて使用します | P0 |
| `doris_be_snmp_tcp_in_segs` |  | 数 | 受信した tcp パケット数。`/proc/net/snmp` から収集します |  |  |
| `doris_be_snmp_tcp_out_segs` |  | 数 | 送信した tcp パケット数。`/proc/net/snmp` から収集します |  |  |
| `doris_be_snmp_tcp_retrans_segs` |  | 数 | tcp パケットの再送回数。`/proc/net/snmp` から収集します |  |  |

## よくある質問

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Monitoring metric integration and interpretation -->

### Q: モニタリングエンドポイントが 404 を返す場合、どうすればよいですか？

FE の `http_port` または BE の `webserver_port` にアクセスしていることを確認し、`fe.conf` / `be.conf` で実際のポート番号を確認してください。

### Q: Counter メトリクスは増加するだけで減少しません。正常ですか？

正常です。Counter は累積値を表します。瞬間的なレートを得るには、一定間隔でサンプリングして増加率（例：PromQL の `rate()`）を計算する必要があります。

### Q: 複数の FE 間で `doris_fe_max_journal_id` の差が大きすぎる場合、どうすればよいですか？

メタデータの同期遅延を示しています。Master FE に対する Follower / Observer FE のネットワーク接続とリプレイ速度を確認してください。

### Q: Compaction Score が高い状態のままです。どう調査すればよいですか？

`doris_be_tablet_base_max_compaction_score` と `doris_be_tablet_cumulative_max_compaction_score` を重点的に確認し、ディスク IO および Compaction タスク数と併せてボトルネックを特定してください。

### Q: クエリやロードが滞留しています。どう調査すればよいですか？

`fragment_thread_pool_queue_size`、`doris_be_scanner_thread_pool_queue_size`、`doris_be_send_batch_thread_pool_queue_size` など、スレッドプールのキュー待ちメトリクスを確認してください。
