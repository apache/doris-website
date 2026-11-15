---
{
    "title": "監視メトリクス",
    "language": "ja",
    "description": "Doris の FE と BE の監視メトリクスを網羅したリファレンス。プロセス、JVM、マシンのメトリクスを扱い、クラスタの健全性監視とアラート設定に役立つ P0 優先度を示します。"
}
---

# 監視メトリクス {#monitoring-metrics}

<!-- Knowledge type: Configuration parameters / Parameter reference -->
<!-- Applicable scenarios: Cluster health monitoring / Alert configuration / Performance troubleshooting -->

Doris の FE と BE のプロセスには監視メトリクスが組み込まれており、デフォルトで Prometheus 互換形式で公開されます。このドキュメントでは、観測可能なメトリクスを体系的に列挙し、優先度（Priority）を示します。Prometheus + Grafana と連携した後、監視とアラートの仕組みをすばやく構築できます。

## 適用シナリオ {#applicable-scenarios}

| シナリオ | 目的 |
| --- | --- |
| クラスタの健全性監視 | P0 メトリクスを使って FE/BE ノードの異常をすばやく検出する |
| アラート設定 | QPS、エラー率、Compaction Score などのメトリクスにしきい値ベースのアラートを設定する |
| 性能のトラブルシューティング | クエリのレイテンシ、スレッドプールの待ち行列、メモリ使用量のメトリクスからボトルネックを特定する |
| キャパシティプランニング | ディスク使用量、tablet 数、接続数からクラスタの負荷を評価する |
| インシデントの振り返り | マシンのメトリクス（CPU、IO、ネットワーク）とプロセスのメトリクスを組み合わせて障害の根本原因を分析する |

## メトリクスの分類 {#metric-categories}

Doris の監視メトリクスは、観測対象によって次のように分類されます。

1. **プロセス監視**：クエリ数、トランザクション数、Compaction の状態など、Doris プロセス自体の実行時メトリクスを示します。
2. **ノード監視**：CPU、メモリ、IO、ネットワークなど、Doris プロセスが動作するマシンのリソースメトリクスを示します。

## 監視メトリクスの取得 {#retrieving-monitoring-metrics}

### Prometheus 互換形式（デフォルト） {#prometheus-compatible-format-default}

FE または BE ノードの HTTP ポートに直接アクセスします。

```shell
curl http://fe_host:http_port/metrics
curl http://be_host:webserver_port/metrics
```

応答例：

```text
doris_fe_cache_added{type="partition"} 0
doris_fe_cache_added{type="sql"} 0
doris_fe_cache_hit{type="partition"} 0
doris_fe_cache_hit{type="sql"} 0
doris_fe_connection_total 2
```

### JSON 形式 {#json-format}

`type=json` パラメータを使用すると、メトリクスを JSON 形式で取得できます。

```shell
curl http://fe_host:http_port/metrics?type=json
curl http://be_host:webserver_port/metrics?type=json
```

### bvar メトリクス {#bvar-metrics}

BE および Meta Service / Recycler のプロセスは、brpc サービスを通じて bvar メトリクスも公開します。Prometheus 互換形式の出力には `/brpc_metrics` を使用し、名前を指定して診断情報を確認するには `/vars` を使用します。

```shell
curl http://be_host:brpc_port/brpc_metrics
curl http://be_host:brpc_port/vars
curl http://cloud_host:brpc_listen_port/brpc_metrics
```

これらのエンドポイントでは、BE の `brpc_port`（デフォルトは `8060`）または Meta Service / Recycler の `brpc_listen_port`（デフォルトは `5000`）を使用します。前述の FE / BE の HTTP 監視ポートとは異なります。以下の bvar 名は登録時の名前をそのまま示しており、すべてに `doris_be_` プレフィックスが付くわけではありません。

#### バージョンの識別 {#version-identification}

バージョン 4.1.5 以降、BE および Meta Service / Recycler のバージョンメトリクスには、`/brpc_metrics` で次のラベルが含まれます。

| メトリクス | 型 | ラベル | 意味 |
| --- | --- | --- | --- |
| `doris_be_version` | Gauge | `version`, `major`, `minor`, `patch`, `hotfix`, `short_hash` | BE のビルドバージョンとコミット識別子 |
| `doris_cloud_version` | Gauge | 上記と同じ | Meta Service / Recycler のビルドバージョンとコミット識別子 |

各プロセスはバージョンのサンプルを出力します。メトリクス値には従来のバージョンエンコーディングが維持されます。完全なバージョンは `version` ラベル、コミット識別子は `short_hash` ラベルから読み取ってください。`doris_cloud_version` では、プロセスが Meta Service、Recycler、または両方のどれとして動作しているかを区別できません。ロールの識別にはスクレイプ対象のラベルを追加してください。

プロセスの `bvar_max_dump_multi_dimension_metric_num` 設定は、多次元 bvar サンプルの数を制限します。デフォルトは `5000` で、`0` にするとバージョンメトリクスなどのサンプルが無効になります。BE はバージョン 4.1.5 以降、この設定をサポートします。変更を反映するには再起動が必要です。詳しくは [BE の設定](../config/be-config.md#bvar_max_dump_multi_dimension_metric_num) を参照してください。

## 監視の優先度とベストプラクティス {#monitoring-priority-and-best-practices}

<!-- Knowledge type: Best practices -->

- 各メトリクス表の最後の列は優先度（Priority）です。**P0 が最も重要**で、値が大きいほど重要度は低くなります。まず P0 メトリクスを連携してください。
- 監視メトリクスの大半は Counter 型（累積値）です。**一定間隔（たとえば 15 秒ごと）でサンプリングし、単位時間当たりの傾きを計算して、有用な情報を得る必要があります**。

    たとえば、`doris_fe_query_err` の傾きを計算すると、クエリエラー率（毎秒のエラー数）が得られます。

> より網羅的で有用な監視メトリクスのリファレンスにするため、この表への貢献を歓迎します。

## FE の監視メトリクス {#fe-monitoring-metrics}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: FE node health monitoring / Metadata sync monitoring / Query performance monitoring -->

### プロセス監視 {#process-monitoring}

| 名前 | ラベル | 単位 | 意味 | 説明 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| `doris_fe_cache_added` | {type="partition"} | Num | 新たに追加された Partition Cache の累積数 |  |  |
|  | {type="sql"} | Num | 新たに追加された SQL Cache の累積数 |  |  |
| `doris_fe_cache_hit` | {type="partition"} | Num | Partition Cache のヒット数 |  |  |
|  | {type="sql"} | Num | SQL Cache のヒット数 |  |  |
| `doris_fe_connection_total` |  | Num | FE の MySQL ポートへの現在の接続数 | クエリ接続数の監視に使用します。接続数が上限を超えると、新しい接続を受け付けられません | P0 |
| `doris_fe_counter_hit_sql_block_rule` |  | Num | SQL BLOCK RULE によってブロックされたクエリ数 |  |  |
| `doris_fe_edit_log_clean` | {type="failed"} | Num | 過去のメタデータログのクリーンアップに失敗した回数 | 失敗してはならない処理です。失敗した場合は手動での対応が必要です | P0 |
|  | {type="success"} | Num | 過去のメタデータログのクリーンアップに成功した回数 |  |  |
| `doris_fe_edit_log` | {type="accumulated_bytes"} | Bytes | メタデータログの累積書き込み量 | 傾きから書き込み速度を求め、メタデータの書き込みに遅延がないか確認します | P0 |
|  | {type="current_bytes"} | Bytes | メタデータログの現在の値 | editlog のサイズを監視します。サイズが上限を超えた場合は手動での対応が必要です | P0 |
|  | {type="read"} | Num | メタデータログの読み取り回数 | 傾きからメタデータの読み取り頻度が正常か確認します | P0 |
|  | {type="write"} | Num | メタデータログの書き込み回数 | 傾きからメタデータの書き込み頻度が正常か確認します | P0 |
|  | {type="current"} | Num | 現在のメタデータログ数 | editlog の数を監視します。数が上限を超えた場合は手動での対応が必要です | P0 |
| `doris_fe_editlog_write_latency_ms` |  | Milliseconds | メタデータログの書き込みレイテンシのパーセンタイル統計。たとえば {quantile="0.75"} は 75 パーセンタイルの書き込みレイテンシを示します |  |  |
| `doris_fe_image_clean` | {type="failed"} | Num | 過去のメタデータイメージファイルのクリーンアップに失敗した回数 | 失敗してはならない処理です。失敗した場合は手動での対応が必要です | P0 |
|  | {type="success"} | Num | 過去のメタデータイメージファイルのクリーンアップに成功した回数 |  |  |
| `doris_fe_image_push` | {type="failed"} | Num | メタデータイメージファイルの他の FE ノードへのプッシュに失敗した回数 |  |  |
|  | {type="success"} | Num | メタデータイメージファイルの他の FE ノードへのプッシュに成功した回数 |  |  |
| `doris_fe_image_write` | {type="failed"} | Num | メタデータイメージファイルの生成に失敗した回数 | 失敗してはならない処理です。失敗した場合は手動での対応が必要です | P0 |
|  | {type="success"} | Num | メタデータイメージファイルの生成に成功した回数 |  |  |
| `doris_fe_job` |  | Num | 種類と状態ごとのジョブ数。たとえば {job="load", type="INSERT", state="LOADING"} は、LOADING 状態にある INSERT タイプのデータロードジョブ数を示します | 必要に応じて、クラスタ内の種類ごとのジョブ数を確認します | P0 |
| `doris_fe_max_journal_id` |  | Num | 現在の FE ノードにおけるメタデータログの最大 ID。Master FE では現在書き込まれている最大 ID、Master FE 以外では現在リプレイ済みのメタデータログの最大 ID を示します | 複数の FE 間で ID に大きな差がないか確認します。差が大きい場合はメタデータの同期に問題があります | P0 |
| `doris_fe_max_tablet_compaction_score` |  | Num | すべての BE ノードにおける Compaction Score の最大値 | 現在のクラスタの Compaction Score の最大値を確認し、高すぎないか判断します。高い場合はクエリや書き込みのレイテンシが増える可能性があります | P0 |
| `doris_fe_qps` |  | Num/Sec | 現在の FE における毎秒のクエリ数（クエリリクエストのみを集計） | QPS | P0 |
| `doris_fe_query_err` |  | Num | 失敗したクエリの累積数 |  |  |
| `doris_fe_query_err_rate` |  | Num/Sec | 毎秒の失敗したクエリ数 | クラスタでクエリエラーが発生していないか確認します | P0 |
| `doris_fe_query_latency_ms` |  | Milliseconds | クエリリクエストのレイテンシのパーセンタイル統計。たとえば {quantile="0.75"} は 75 パーセンタイルのクエリレイテンシを示します | 各パーセンタイルのクエリレイテンシを詳しく確認します | P0 |
| `doris_fe_query_latency_ms_db` |  | Milliseconds | DB ごとのクエリリクエストのレイテンシのパーセンタイル統計。たとえば {quantile="0.75",db="test"} は DB test の 75 パーセンタイルのクエリレイテンシを示します | DB ごとに各パーセンタイルのクエリレイテンシを詳しく確認します | P0 |
| `doris_fe_query_olap_table` |  | Num | 内部テーブル（OlapTable）に対するクエリリクエスト数 |  |  |
| `doris_fe_query_total` |  | Num | すべてのクエリリクエストの累積数 |  |  |
| `doris_fe_report_queue_size` |  | Num | BE からの各種定期レポートタスクを処理する FE 側のキューの長さ | Master FE ノードでレポートタスクがどの程度滞留しているかを示します。値が大きいほど FE の処理能力が不足しています | P0 |
| `doris_fe_request_total` |  | Num | MySQL ポートを通じて受信したすべての操作リクエスト（クエリやその他のステートメントを含む） |  |  |
| `doris_fe_routine_load_error_rows` |  | Num | クラスタ内のすべての Routine Load ジョブのエラー行の合計数 |  |  |
| `doris_fe_routine_load_receive_bytes` |  | Bytes | Routine Load ジョブが受信したソースメッセージのペイロードの累積バイト数。WHERE によるフィルタリング前に計測されるため、WHERE で除外されたデータを含みます。テーブルに書き込まれたバイト数ではありません |  |  |
| `doris_fe_routine_load_rows` |  | Num | クラスタ内のすべての Routine Load ジョブが受信したデータ行の合計数 |  |  |
| `doris_fe_routine_load_get_meta_latency` |  | Milliseconds | クラスタ内のすべての Routine Load Job によるメタデータ取得のレイテンシ |  |  |
| `doris_fe_routine_load_get_meta_count` |  | Num | クラスタ内のすべての Routine Load Job によるメタデータ取得操作の回数 |  |  |
| `doris_fe_routine_load_get_meta_fail_count` |  | Num | クラスタ内のすべての Routine Load Job によるメタデータ取得の失敗回数 |  |  |
| `doris_fe_routine_load_task_execute_time` |  | Milliseconds | クラスタ内のすべての Routine Load Task の実行時間 |  |  |
| `doris_fe_routine_load_task_execute_count` |  | Num | クラスタ内のすべての Routine Load Task の実行回数 |  |  |
| `doris_fe_routine_load_lag` |  | Milliseconds | クラスタ内のすべての Routine Load Job の消費遅延 |  |  |
| `doris_fe_routine_load_progress` |  | Milliseconds | クラスタ内のすべての Routine Load Job の消費進捗 |  |  |
| `doris_fe_routine_load_abort_task_num` |  | Num | クラスタ内のすべての Routine Load Job で失敗した Task の数 |  |  |
| `doris_fe_rps` |  | Num | 現在の FE における毎秒のリクエスト数（クエリとその他の種類のステートメントを含む） | QPS と併用して、クラスタが処理するリクエスト量を確認します | P0 |
| `doris_fe_scheduled_tablet_num` |  | Num | Master FE ノードが現在スケジュールしている tablet 数。修復中のレプリカと分散配置中のレプリカを含みます | クラスタ内で現在移行中の tablet 数を示します。長時間にわたりゼロ以外の値が続く場合、クラスタが不安定であることを示します | P0 |
| `doris_fe_tablet_max_compaction_score` |  | Num | 各 BE ノードから報告された Compaction Score。たとえば {backend="172.21.0.1:9556"} は、"172.21.0.1:9556" の BE が報告した値を示します |  |  |
| `doris_fe_tablet_num` |  | Num | 各 BE ノードの tablet の総数。たとえば {backend="172.21.0.1:9556"} は、"172.21.0.1:9556" の BE の現在の tablet 数を示します | tablet の分布が均等か、絶対数が妥当か確認します | P0 |
| `doris_fe_tablet_status_count` |  | Num | Master FE ノードの Tablet scheduler がスケジュールした tablet の累積数 |  |  |
|  | {type="added"} | Num | Master FE ノードの Tablet scheduler がスケジュールした tablet の累積数。"added" は、スケジュール済みの tablet 数を示します |  |  |
|  | {type="in_sched"} | Num | 上記と同じメトリクス。繰り返しスケジュールされた tablet 数を示します | この値が急増する場合、一部の tablet が長時間不健全な状態にあり、scheduler が繰り返しスケジュールしています |  |
|  | {type="not_ready"} | Num | 上記と同じメトリクス。スケジュールのトリガー条件をまだ満たしていない tablet 数を示します | この値が急増する場合、多数の tablet が不健全な状態にあるものの、スケジュールできません |  |
|  | {type="total"} | Num | 上記と同じメトリクス。チェック済みの tablet の累積数を示します（必ずしもスケジュール済みとは限りません） |  |  |
|  | {type="unhealthy"} | Num | 上記と同じメトリクス。チェック済みで不健全だった tablet の累積数を示します |  |  |
| `doris_fe_thread_pool` |  | Num | 各種スレッドプールのワーカースレッド数と待ち行列の統計。`active_thread_num` は現在実行中のタスク数、`pool_size` はプール内の総スレッド数、`task_in_queue` は現在キューに入っているタスク数を示します |  |  |
|  | {name="agent-task-pool"} | Num | Master FE が BE に Agent Task を送信するためのスレッドプール |  |  |
|  | {name="connect-scheduler-check-timer"} | Num | MySQL のアイドル接続がタイムアウトしたか確認するためのスレッドプール |  |  |
|  | {name="connect-scheduler-pool"} | Num | MySQL 接続リクエストを受け付けるためのスレッドプール |  |  |
|  | {name="mysql-nio-pool"} | Num | NIO MySQL Server がタスクを処理するためのスレッドプール |  |  |
|  | {name="export-exporting-job-pool"} | Num | exporting 状態の export ジョブをスケジュールするスレッドプール |  |  |
|  | {name="export-pending-job-pool"} | Num | pending 状態の export ジョブをスケジュールするスレッドプール |  |  |
|  | {name="heartbeat-mgr-pool"} | Num | Master FE が各ノードからのハートビートを処理するためのスレッドプール |  |  |
|  | {name="loading-load-task-scheduler"} | Num | Master FE が Broker Load ジョブの loading タスクをスケジュールするためのスレッドプール |  |  |
|  | {name="pending-load-task-scheduler"} | Num | Master FE が Broker Load ジョブの pending タスクをスケジュールするためのスレッドプール |  |  |
|  | {name="schema-change-pool"} | Num | Master FE がスキーマ変更ジョブをスケジュールするためのスレッドプール |  |  |
|  | {name="thrift-server-pool"} | Num | FE 側の ThriftServer のワーカースレッドプール。fe.conf の `rpc_port` に対応し、BE との通信に使用されます |  |  |
| `doris_fe_txn_counter` |  | Num | 状態ごとのデータロードトランザクションの累積数 | データロードトランザクションの実行状況を確認します | P0 |
|  | {type="begin"} | Num | 開始されたトランザクション数 |  |  |
|  | {type="failed"} | Num | 失敗したトランザクション数 |  |  |
|  | {type="reject"} | Num | 拒否されたトランザクション数（たとえば、現在実行中のトランザクション数がしきい値を超えると、新しいトランザクションは拒否されます） |  |  |
|  | {type="success"} | Num | 成功したトランザクション数 |  |  |
| `doris_fe_txn_status` |  | Num | 現在、各状態にあるデータロードトランザクション数。たとえば {type="committed"} は committed 状態のトランザクション数を示します | 各状態のデータロードトランザクション数から、滞留の有無を判断します | P0 |
| `doris_fe_query_instance_num` |  | Num | 特定のユーザーが現在リクエストしている fragment instance 数。たとえば {user="test_u"} は、ユーザー test_u が現在リクエストしている instance 数を示します | 特定のユーザーがクエリリソースを過剰に消費していないか確認します | P0 |
| `doris_fe_query_instance_begin` |  | Num | 特定のユーザーがリクエストを開始した fragment instance 数。たとえば {user="test_u"} は、ユーザー test_u がリクエストを開始した instance 数を示します | 特定のユーザーがクエリを過剰に送信していないか確認します | P0 |
| `doris_fe_query_rpc_total` |  | Num | 特定の BE に送信された RPC の回数。たとえば {be="192.168.10.1"} は、IP アドレス 192.168.10.1 の BE に送信された RPC の回数を示します | 特定の BE に過剰な RPC が送信されていないか確認します |  |
| `doris_fe_query_rpc_failed` |  | Num | 特定の BE に送信された RPC の失敗回数。たとえば {be="192.168.10.1"} は、IP アドレス 192.168.10.1 の BE に送信された RPC の失敗回数を示します | 特定の BE に RPC の問題がないか確認します |  |
| `doris_fe_query_rpc_size` |  | Num | 特定の BE への RPC データのサイズ。たとえば {be="192.168.10.1"} は、IP アドレス 192.168.10.1 の BE に送信された RPC データのバイト数を示します | 特定の BE にサイズの大きすぎる RPC が送信されていないか確認します |  |
| `doris_fe_txn_exec_latency_ms` |  | Milliseconds | トランザクション実行時間のパーセンタイル統計。たとえば {quantile="0.75"} は 75 パーセンタイルのトランザクション実行時間を示します | 各パーセンタイルのトランザクション実行時間を詳しく確認します | P0 |
| `doris_fe_txn_publish_latency_ms` |  | Milliseconds | トランザクションの publish 時間のパーセンタイル統計。たとえば {quantile="0.75"} は 75 パーセンタイルの publish 時間を示します | 各パーセンタイルのトランザクションの publish 時間を詳しく確認します | P0 |
| `doris_fe_txn_num` |  | Num | 特定の DB で現在実行中のトランザクション数。たとえば {db="test"} は DB test で現在実行中のトランザクション数を示します | 特定の DB が大量のトランザクションを送信していないか確認します | P0 |
| `doris_fe_publish_txn_num` |  | Num | 特定の DB で現在 publish 中のトランザクション数。たとえば {db="test"} は DB test で現在 publish 中のトランザクション数を示します | 特定の DB における publish 中のトランザクション数を確認します | P0 |
| `doris_fe_txn_replica_num` |  | Num | 特定の DB で現在実行中のトランザクションが開いているレプリカ数。たとえば {db="test"} は DB test で現在実行中のトランザクションが開いているレプリカ数を示します | 特定の DB が過剰なレプリカを開き、他のトランザクションの実行に影響していないか確認します | P0 |
| `doris_fe_thrift_rpc_total` |  | Num | FE の thrift インターフェースの各メソッドが受信した RPC リクエスト数。たとえば {method="report"} は report メソッドが受信した RPC リクエスト数を示します | 特定の thrift rpc メソッドの負荷を確認します |  |
| `doris_fe_thrift_rpc_latency_ms` |  | Milliseconds | FE の thrift インターフェースの各メソッドにおける RPC リクエストの処理時間。たとえば {method="report"} は report メソッドの RPC リクエスト処理時間を示します | 特定の thrift rpc メソッドの負荷を確認します |  |
| `doris_fe_external_schema_cache` | {catalog="hive"} | Num | 特定の External Catalog のスキーマキャッシュ内のエントリ数 |  |  |
| `doris_fe_hive_meta_cache` | {catalog="hive"} | Num |  |  |  |
|  | `{type="partition_value"}` | Num | 特定の External Hive Metastore Catalog のパーティション値キャッシュ内のエントリ数 |  |  |
|  | `{type="partition"}` | Num | 特定の External Hive Metastore Catalog のパーティションキャッシュ内のエントリ数 |  |  |
|  | `{type="file"}` | Num | 特定の External Hive Metastore Catalog のファイルキャッシュ内のエントリ数 |  |  |
| `doris_fe_virtual_compute_group_switch_total` | `{virtual_compute_group_id, virtual_compute_group_name, src_compute_group_id, src_compute_group_name, dst_compute_group_id, dst_compute_group_name}` | Num | 仮想コンピュートグループで発生したアクティブ・スタンバイ切り替えの累積回数。バージョン 4.0.8 以降でサポートされ、コンピュートとストレージの分離モードでのみ出力されます | 傾きから仮想コンピュートグループが頻繁に切り替わっていないか確認します。頻繁な切り替えは通常、プライマリコンピュートグループが不安定であることを示します |  |

### JVM 監視 {#jvm-monitoring}

| 名前 | ラベル | 単位 | 意味 | 説明 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| `jvm_heap_size_bytes` |  | Bytes | JVM メモリの監視。ラベルには max、used、committed が含まれ、それぞれ最大メモリ、使用中のメモリ、コミット済みのメモリに対応します | JVM のメモリ使用量を確認します | P0 |
| `jvm_non_heap_size_bytes` |  | Bytes | JVM のヒープ外メモリの統計 |  |  |
| `<GarbageCollector>` |  |  | GC の監視 | GarbageCollector は特定のガベージコレクタを指します | P0 |
|  | {type="count"} | Num | GC の累積回数 |  |  |
|  | {type="time"} | Milliseconds | GC 時間の累積値 |  |  |
| `jvm_old_size_bytes` |  | Bytes | JVM の Old 世代メモリの統計 |  | P0 |
| `jvm_thread` |  | Num | JVM のスレッド数の統計 | JVM のスレッド数が妥当か確認します | P0 |
| `jvm_young_size_bytes` |  | Bytes | JVM の Young 世代メモリの統計 |  | P0 |

### マシン監視 {#machine-monitoring}

| 名前 | ラベル | 単位 | 意味 | 説明 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| `system_meminfo` |  | Bytes | FE ノードのマシンのメモリ監視。`/proc/meminfo` から収集します。`buffers`、`cached`、`memory_available`、`memory_free`、`memory_total` を含みます |  |  |
| `system_snmp` |  |  | FE ノードのマシンのネットワーク監視。`/proc/net/snmp` から収集します |  |  |
|  | `{name="tcp_in_errs"}` | Num | tcp パケットの受信エラー数 |  |  |
|  | `{name="tcp_in_segs"}` | Num | 受信した tcp パケット数 |  |  |
|  | `{name="tcp_out_segs"}` | Num | 送信した tcp パケット数 |  |  |
|  | `{name="tcp_retrans_segs"}` | Num | tcp パケットの再送数 |  |  |

## BE の監視メトリクス {#be-monitoring-metrics}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: BE node health monitoring / Query and write performance monitoring / Compaction monitoring -->

### プロセス監視 {#process-monitoring-1}

| 名前 | ラベル | 単位 | 意味 | 説明 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| `doris_be_active_scan_context_count` |  | Num | 外部システムが直接開いている scanner の現在の数 |  |  |
| `doris_be_add_batch_task_queue_size` |  | Num | データロード中にバッチを受信するスレッドプールのキューサイズ | ゼロより大きい場合、データロードタスクの受信側で滞留が発生しています | P0 |
| `agent_task_queue_size` |  | Num | 各 Agent Task 処理キューの長さ。たとえば `{type="CREATE_TABLE"}` は CREATE_TABLE タスクキューの長さを示します |  |  |
| `doris_be_brpc_endpoint_stub_count` |  | Num | BE 間の通信に使用する、作成済みの brpc stub の数 |  |  |
| `doris_be_brpc_function_endpoint_stub_count` |  | Num | Remote RPC との通信に使用する、作成済みの brpc stub の数 |  |  |
| `doris_be_cache_capacity` |  |  | 特定の LRU Cache の容量を記録します |  |  |
| `doris_be_cache_usage` |  |  | 特定の LRU Cache の使用量を記録します | メモリ使用量を確認します | P0 |
| `doris_be_cache_usage_ratio` |  |  | 特定の LRU Cache の使用率を記録します |  |  |
| `doris_be_cache_lookup_count` |  |  | 特定の LRU Cache の検索回数を記録します |  |  |
| `doris_be_cache_hit_count` |  |  | 特定の LRU Cache のヒット数を記録します |  |  |
| `doris_be_cache_hit_ratio` |  |  | 特定の LRU Cache のヒット率を記録します | キャッシュが有効に機能しているか確認します | P0 |
|  | {name="DataPageCache"} | Num | DataPageCache はデータの Data Page をキャッシュします | データキャッシュであり、クエリ効率に直接影響します | P0 |
|  | {name="IndexPageCache"} | Num | IndexPageCache はデータの Index Page をキャッシュします | インデックスキャッシュであり、クエリ効率に直接影響します | P0 |
|  | {name="LastSuccessChannelCache"} | Num | LastSuccessChannelCache はデータロードの受信側にある LoadChannel をキャッシュします |  |  |
|  | {name="SegmentCache"} | Num | SegmentCache はインデックス情報など、開かれた Segment をキャッシュします |  |  |
| `doris_be_chunk_pool_local_core_alloc_count` |  | Num | ChunkAllocator で、バインドされたコアのメモリキューからメモリを割り当てた回数 |  |  |
| `doris_be_chunk_pool_other_core_alloc_count` |  | Num | ChunkAllocator で、他のコアのメモリキューからメモリを割り当てた回数 |  |  |
| `doris_be_chunk_pool_reserved_bytes` |  | Bytes | ChunkAllocator で予約されたメモリのサイズ |  |  |
| `doris_be_chunk_pool_system_alloc_cost_ns` |  | Nanoseconds | SystemAllocator によるメモリ割り当てにかかった累積時間 | 傾きからメモリ割り当ての時間コストを確認します | P0 |
| `doris_be_chunk_pool_system_alloc_count` |  | Num | SystemAllocator がメモリを割り当てた回数 |  |  |
| `doris_be_chunk_pool_system_free_cost_ns` |  | Nanoseconds | SystemAllocator によるメモリ解放にかかった累積時間 | 傾きからメモリ解放の時間コストを確認します | P0 |
| `doris_be_chunk_pool_system_free_count` |  | Num | SystemAllocator がメモリを解放した回数 |  |  |
| `doris_be_compaction_bytes_total` |  | Bytes | Compaction が処理したデータ量の累積値 | Compaction タスクの入力 rowset のディスクサイズを記録します。傾きから Compaction の速度を確認します | P0 |
|  | {type="base"} | Bytes | Base Compaction の累積データ量 |  |  |
|  | {type="cumulative"} | Bytes | Cumulative Compaction の累積データ量 |  |  |
| `doris_be_compaction_deltas_total` |  | Num | Compaction が処理した rowset の累積数 | Compaction タスクの入力 rowset 数を記録します |  |
|  | {type="base"} | Num | Base Compaction が処理した rowset の累積数 |  |  |
|  | {type="cumulative"} | Num | Cumulative Compaction が処理した rowset の累積数 |  |  |
| `doris_be_disks_compaction_num` |  | Num | 特定のデータディレクトリで現在実行中の Compaction タスク数。たとえば `{path="/path1/"}` は `/path1` ディレクトリで現在実行中のタスク数を示します | 各ディスクの Compaction タスク数が妥当か確認します | P0 |
| `doris_be_disks_compaction_score` |  | Num | 特定のデータディレクトリで現在実行中の Compaction トークン数。たとえば `{path="/path1/"}` は `/path1` ディレクトリで現在実行中のトークン数を示します |  |  |
| `doris_be_compaction_used_permits` |  | Num | Compaction タスクがすでに使用しているトークン数 | Compaction のリソース消費量を示します |  |
| `doris_be_compaction_waitting_permits` |  | Num | Compaction トークンを待っている項目の数 |  |  |
| `doris_be_data_stream_receiver_count` |  | Num | 受信側のデータ Receiver 数 | FIXME: このメトリクスはベクトル化エンジンにはありません |  |
| `doris_be_disks_avail_capacity` |  | Bytes | 特定のデータディレクトリがあるディスクの残り容量。たとえば `{path="/path1/"}` は `/path1` ディレクトリがあるディスクの残り容量を示します |  | P0 |
| `doris_be_disks_local_used_capacity` |  | Bytes | 特定のデータディレクトリがあるディスクでローカルに使用されている容量 |  |  |
| `doris_be_disks_remote_used_capacity` |  | Bytes | 特定のデータディレクトリがあるディスクに対応するリモートディレクトリの使用容量 |  |  |
| `doris_be_disks_state` |  | Boolean | 特定のデータディレクトリのディスク状態。1 は正常、0 は異常を示します |  |  |
| `doris_be_disks_total_capacity` |  | Bytes | 特定のデータディレクトリがあるディスクの総容量 | `doris_be_disks_avail_capacity` と併用してディスク使用率を計算します | P0 |
| `doris_be_engine_requests_total` |  | Num | BE 上の各種タスクの実行状態に関する累積数 |  |  |
|  | {status="failed",type="xxx"} | Num | xxx タイプのタスクの累積失敗回数 |  |  |
|  | {status="total",type="xxx"} | Num | xxx タイプのタスクの累積実行総数 | 必要に応じて各種タスクの失敗回数を監視します | P0 |
|  | `{status="skip",type="report_all_tablets"}` | Num | xxx タイプのタスクがスキップされた累積回数 |  |  |
| `doris_be_fragment_endpoint_count` |  | Num | `doris_be_data_stream_receiver_count` と同じ | FIXME: `doris_be_data_stream_receiver_count` と同じ数です。ベクトル化エンジンにもありません |  |
| `doris_be_fragment_request_duration_us` |  | Microseconds | すべての fragment instance の累積実行時間 | 傾きから instance の実行時間を確認します | P0 |
| `doris_be_fragment_requests_total` |  | Num | 実行された fragment instance の累積数 |  |  |
| `doris_be_load_channel_count` |  | Num | 現在開いているデータロードチャネルの数 | 値が大きいほど、現在実行中のデータロードタスクが多いことを示します | P0 |
| `doris_be_local_bytes_read_total` |  | Bytes | `LocalFileReader` が読み取ったバイト数 |  | P0 |
| `doris_be_local_bytes_written_total` |  | Bytes | `LocalFileWriter` が書き込んだバイト数 |  | P0 |
| `doris_be_local_file_reader_total` |  | Num | 開かれた `LocalFileReader` instance の累積数 |  |  |
| `doris_be_local_file_open_reading` |  | Num | 現在開いている `LocalFileReader` instance の数 |  |  |
| `doris_be_local_file_writer_total` |  | Num | 開かれた `LocalFileWriter` instance の累積数 |  |  |
| `doris_be_mem_consumption` |  | Bytes | 特定のモジュールの現在のメモリ消費量。たとえば {type="compaction"} は Compaction モジュールの現在の総メモリ消費量を示します | 値は同じタイプの MemTracker から取得します。FIXME |  |
| `doris_be_memory_allocated_bytes` |  | Bytes | `/proc/self/status/VmRSS` から取得した BE プロセスの物理メモリサイズ |  | P0 |
| `doris_be_memory_jemalloc` |  | Bytes | `je_mallctl` から取得した Jemalloc の統計 | 意味については https://jemalloc.net/jemalloc.3.html を参照してください | P0 |
| `doris_be_memory_pool_bytes_total` |  | Bytes | すべての MemPool が現在占有しているメモリのサイズ。統計上の値であり、実際のメモリ使用量を表すものではありません |  |  |
| `doris_be_memtable_flush_duration_us` |  | Microseconds | memtable をディスクに書き込むのにかかった累積時間 | 傾きから書き込みレイテンシを確認します | P0 |
| `doris_be_memtable_flush_total` |  | Num | ディスクに書き込まれた memtable の累積数 | 傾きからファイル書き込みの頻度を計算します | P0 |
| `doris_be_meta_request_duration` |  | Microseconds | RocksDB 内の meta へのアクセスにかかった累積時間 | 傾きから BE のメタデータの読み書きレイテンシを確認します | P0 |
|  | {type="read"} | Microseconds | 読み取り時間 |  |  |
|  | {type="write"} | Microseconds | 書き込み時間 |  |  |
| `doris_be_meta_request_total` |  | Num | RocksDB 内の meta への累積アクセス回数 | 傾きから BE のメタデータへのアクセス頻度を確認します | P0 |
|  | {type="read"} | Num | 読み取り回数 |  |  |
|  | {type="write"} | Num | 書き込み回数 |  |  |
| `doris_be_fragment_instance_count` |  | Num | 現在受信している fragment instance の数 | instance が滞留していないか確認します | P0 |
| `doris_be_process_fd_num_limit_hard` |  | Num | BE プロセスのファイルハンドル数のハードリミット。`/proc/pid/limits` から収集します |  |  |
| `doris_be_process_fd_num_limit_soft` |  | Num | BE プロセスのファイルハンドル数のソフトリミット。`/proc/pid/limits` から収集します |  |  |
| `doris_be_process_fd_num_used` |  | Num | BE プロセスが使用中のファイルハンドル数。`/proc/self/fd` のエントリ数から収集します |  |  |
| `doris_be_process_thread_num` |  | Num | BE プロセスのスレッド数。`/proc/pid/task` から収集します |  | P0 |
| `doris_be_query_cache_memory_total_byte` |  | Bytes | Query Cache が占有するバイト数 |  |  |
| `doris_be_query_cache_partition_total_count` |  | Num | Partition Cache 内の現在のエントリ数 |  |  |
| `doris_be_query_cache_sql_total_count` |  | Num | SQL Cache 内の現在のエントリ数 |  |  |
| `doris_be_query_scan_bytes` |  | Bytes | 読み取られたデータ量の累積値。Olap テーブルから読み取られたデータのみを集計します |  |  |
| `doris_be_query_scan_bytes_per_second` |  | Bytes/Sec | `doris_be_query_scan_bytes` から計算した読み取り速度 | クエリの読み取り速度を確認します | P0 |
| `doris_be_query_scan_rows` |  | Num | 読み取られた行の累積数。Olap テーブルから読み取られたデータのみを集計します。これは RawRowsRead であり、一部の行はインデックスによってスキップされて実際には読み取られなくても、この値に含まれます | 傾きからクエリの読み取り速度を確認します | P0 |
| `doris_be_result_block_queue_count` |  | Num | 現在、クエリ結果キャッシュにある fragment instance の数 | このキューは、外部システムが直接読み取る場合にのみ使用されます。たとえば Spark on Doris が external scan を通じてデータをクエリする場合です |  |
| `doris_be_result_buffer_block_count` |  | Num | 現在、クエリ結果キャッシュにあるクエリの数 | 現在の BE で、結果が FE によって消費されるのを待っているクエリの数を示します | P0 |
| `doris_be_routine_load_task_count` |  | Num | 現在実行中の Routine Load タスク数 |  |  |
| `doris_be_rowset_count_generated_and_in_use` |  | Num | 前回の起動以降に新たに追加され、使用中の rowset ID の数 |  |  |
| `doris_be_s3_bytes_read_total` |  | Num | `S3FileReader` が開かれた累積回数 |  |  |
| `doris_be_s3_file_open_reading` |  | Num | 現在開いている `S3FileReader` instance の数 |  |  |
| `doris_be_s3_bytes_read_total` |  | Bytes | `S3FileReader` が読み取った累積バイト数 |  |  |
| `doris_be_scanner_thread_pool_queue_size` |  | Num | OlapScanner に使用するスレッドプールの現在のキューサイズ | ゼロより大きい場合、Scanner が滞留し始めています | P0 |
| `doris_be_segment_read` | `{type="segment_read_total"}` | Num | 読み取られた segment の累積数 |  |  |
| `doris_be_segment_read` | `{type="segment_row_total"}` | Num | segment 全体で読み取られた行の累積数 | インデックスによってフィルタリングされた行も含みます。読み取られた segment 数に各 segment の総行数を掛けた値に相当します |  |
| `doris_be_send_batch_thread_pool_queue_size` |  | Num | データロード中にデータパケットを送信するスレッドプールのキューサイズ | ゼロより大きい場合、滞留が発生しています | P0 |
| `doris_be_send_batch_thread_pool_thread_num` |  | Num | データロード中にデータパケットを送信するスレッドプールのスレッド数 |  |  |
| `doris_be_small_file_cache_count` |  | Num | 現在 BE にキャッシュされている小さなファイルの数 |  |  |
| `doris_be_streaming_load_current_processing` |  | Num | 現在実行中の stream load タスク数 | curl コマンドで送信されたタスクのみを含みます |  |
| `doris_be_streaming_load_duration_ms` |  | Milliseconds | すべての stream load タスクの累積実行時間 |  |  |
| `doris_be_streaming_load_requests_total` |  | Num | stream load タスクの累積数 | 傾きからタスクの送信頻度を確認します | P0 |
| `doris_be_stream_load_pipe_count` |  | Num | 現在の stream load データパイプ数 | stream load タスクと routine load タスクの両方を含みます |  |
| `doris_be_stream_load` | {type="load_rows"} | Num | stream load によって最終的にデータロードされた行の累積数 | stream load タスクと routine load タスクの両方を含みます | P0 |
| `doris_be_stream_load` | {type="receive_bytes"} | Bytes | stream load が受信した累積バイト数 | stream load が HTTP 経由で受信したデータと、routine load が Kafka から読み取ったデータを含みます | P0 |
| `doris_be_tablet_base_max_compaction_score` |  | Num | 現在の Base Compaction Score の最大値 | この値はリアルタイムで変化するため、ピークを見逃す場合があります。値が高いほど Compaction の滞留が深刻です | P0 |
| `doris_be_tablet_cumulative_max_compaction_score` |  | Num | すべての Cumulative Compaction 戦略における現在の Compaction Score の最大値 | 戦略全体の最大値として維持されます |  |
| `doris_be_tablet_version_num_distribution` |  | Num | tablet のバージョン数のヒストグラム | tablet のバージョン数の分布を示します | P0 |
| `doris_be_thrift_connections_total` |  | Num | 作成された thrift 接続の累積数。たとえば `{name="heartbeat"}` はハートビートサービスへの累積接続数を示します | BE がサーバー側として動作する thrift server の接続数です |  |
| `doris_be_thrift_current_connections` |  | Num | 現在の thrift 接続数。たとえば `{name="heartbeat"}` はハートビートサービスへの現在の接続数を示します | 上記と同じです |  |
| `doris_be_thrift_opened_clients` |  | Num | 現在開いている thrift クライアント数。たとえば `{name="frontend"}` は FE サービスにアクセスするクライアント数を示します |  |  |
| `doris_be_thrift_used_clients` |  | Num | 現在使用中の thrift クライアント数。たとえば `{name="frontend"}` は FE サービスへのアクセスに現在使用されているクライアント数を示します |  |  |
| `doris_be_timeout_canceled_fragment_count` |  | Num | タイムアウトによりキャンセルされた fragment instance の累積数 | この値は重複して記録される場合があります。たとえば、一部の fragment instance は複数回キャンセルされることがあります | P0 |
| `doris_be_stream_load_txn_request` | {type="begin"} | Num | 開始された stream load トランザクションの累積数 | stream load タスクと routine load タスクの両方を含みます |  |
| `doris_be_stream_load_txn_request` | {type="commit"} | Num | 正常にコミットされた stream load トランザクションの累積数 | 上記と同じです |  |
| `doris_be_stream_load_txn_request` | {type="rollback"} | Num | 失敗した stream load トランザクションの累積数 | 上記と同じです |  |
| `doris_be_unused_rowsets_count` |  | Num | 現在、非推奨となっている rowset の数 | これらの rowset は通常、定期的に削除されます |  |
| `doris_be_upload_fail_count` |  | Num | 階層型ストレージ機能で、rowset のリモートストレージへのアップロードに失敗した累積回数 |  |  |
| `doris_be_upload_rowset_count` |  | Num | 階層型ストレージ機能で、rowset のリモートストレージへのアップロードに成功した累積回数 |  |  |
| `doris_be_upload_total_byte` |  | Bytes | 階層型ストレージ機能で、リモートストレージへのアップロードに成功した rowset の累積データ量 |  |  |
| `doris_be_load_bytes` |  | Bytes | tablet sink 経由で送信された累積バイト数 | データロード量を確認します | P0 |
| `doris_be_load_rows` |  | Num | tablet sink 経由で送信された累積行数 | データロード量を確認します | P0 |
| `fragment_thread_pool_queue_size` |  | Num | クエリ実行スレッドプールの待ち行列の現在の長さ | ゼロより大きい場合、クエリスレッドが枯渇し、クエリが滞留しています | P0 |
| `doris_be_all_rowsets_num` |  | Num | 現在のすべての rowset の総数 |  | P0 |
| `doris_be_all_segments_num` |  | Num | 現在のすべての segment の総数 |  | P0 |
| `doris_be_heavy_work_max_threads` |  | Num | brpc heavy スレッドプールのスレッド数 |  | P0 |
| `doris_be_light_work_max_threads` |  | Num | brpc light スレッドプールのスレッド数 |  | P0 |
| `doris_be_heavy_work_pool_queue_size` |  | Num | brpc heavy スレッドプールのキューの最大長。超えると work の投入がブロックされます |  | P0 |
| `doris_be_light_work_pool_queue_size` |  | Num | brpc light スレッドプールのキューの最大長。超えると work の投入がブロックされます |  | P0 |
| `doris_be_heavy_work_active_threads` |  | Num | brpc heavy スレッドプールのアクティブなスレッド数 |  | P0 |
| `doris_be_light_work_active_threads` |  | Num | brpc light スレッドプールのアクティブなスレッド数 |  | P0 |
| `routine_load_get_msg_latency` |  | Milliseconds | Routine Load による Kafka メッセージ取得のレイテンシ |  |  |
| `routine_load_get_msg_count` |  | Num | Routine Load が Kafka メッセージを取得した回数 |  |  |
| `routine_load_consume_bytes` |  | Bytes | Routine Load が Kafka から消費したデータ量 |  |  |
| `routine_load_consume_rows` |  | Num | Routine Load が Kafka から消費した行数 |  |  |
| `doris_be_tablet_size_based_max_compaction_score` |  | Num | Size-based 戦略における現在の Cumulative Compaction Score の最大値 | Gauge。4.1.5 で追加され、統合モードとコンピュートとストレージの分離モードをサポートします |  |
| `doris_be_tablet_time_series_max_compaction_score` |  | Num | Time-series 戦略における現在の Cumulative Compaction Score の最大値 | Gauge。4.1.5 で追加され、統合モードとコンピュートとストレージの分離モードをサポートします |  |
| `doris_be_hdfs_file_open_reading` |  | Num | 現在、実際に開いている HDFS ファイルハンドル数 | Gauge。バージョン 4.1.5 以降は reader オブジェクト数ではなく、共有ファイルハンドル数を集計します |  |
| `doris_be_hdfs_file_reader_total` |  | Num | HDFS ファイルハンドルを正常に開いた累積回数 | Counter。バージョン 4.1.5 以降、ファイルを開かない reader は値を増やさず、キャッシュ済みのハンドルの再利用も再計上しません |  |

戦略別の Compaction Score はいずれも最大値です。合算したり、Counter として rate を適用したりしないでください。完全なチェックの後、対象となる tablet がない戦略の値はゼロにリセットされることがあります。統合モードでディスク容量の制限により一部のディレクトリがチェックから除外された場合、それを理由に以前観測された値が下がることはありません。

### マシン監視 {#machine-monitoring-1}

| 名前 | ラベル | 単位 | 意味 | 説明 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| `doris_be_cpu` |  | Num | `/proc/stat` から収集する CPU 関連の監視メトリクス。論理コアごとに値を収集します。たとえば `{device="cpu0",mode="nice"}` は cpu0 の nice 値を示します | この値から CPU 使用率を計算できます | P0 |
| `doris_be_disk_bytes_read` |  | Bytes | ディスクの累積読み取り量。`/proc/diskstats` から収集します。ディスクごとに値を収集します。たとえば `{device="vdd"}` は vdd ディスクの値を示します |  |  |
| `doris_be_disk_bytes_written` |  | Bytes | ディスクの累積書き込み量。上記と同じ方法で収集します |  |  |
| `doris_be_disk_io_time_ms` |  | Milliseconds | 上記と同じ方法で収集します | この値から IO Util を計算できます | P0 |
| `doris_be_disk_io_time_weighted` |  | Milliseconds | 上記と同じ方法で収集します |  |  |
| `doris_be_disk_reads_completed` |  | Num | 上記と同じ方法で収集します |  |  |
| `doris_be_disk_read_time_ms` |  | Milliseconds | 上記と同じ方法で収集します |  |  |
| `doris_be_disk_writes_completed` |  | Num | 上記と同じ方法で収集します |  |  |
| `doris_be_disk_write_time_ms` |  | Milliseconds | 上記と同じ方法で収集します |  |  |
| `doris_be_fd_num_limit` |  | Num | システムのファイルハンドル数の上限。`/proc/sys/fs/file-nr` から収集します |  |  |
| `doris_be_fd_num_used` |  | Num | システムが使用中のファイルハンドル数。`/proc/sys/fs/file-nr` から収集します |  |  |
| `doris_be_file_created_total` |  | Num | ローカルファイルが作成された累積回数 | `local_file_writer` が呼び出され、最終的に閉じられたすべてのファイルを集計します |  |
| `doris_be_load_average` |  | Num | マシンの Load Avg を監視するメトリクス。たとえば {mode="15_minutes"} は 15 分間の Load Avg です | マシン全体の負荷を確認します | P0 |
| `doris_be_max_disk_io_util_percent` |  | Percentage | すべてのディスクについて計算された IO UTIL の最大値 |  | P0 |
| `doris_be_max_network_receive_bytes_rate` |  | Bytes/Sec | すべてのネットワークインターフェースについて計算された受信速度の最大値 |  | P0 |
| `doris_be_max_network_send_bytes_rate` |  | Bytes/Sec | すべてのネットワークインターフェースについて計算された送信速度の最大値 |  | P0 |
| `doris_be_memory_pgpgin` |  | Bytes | システムがディスクからメモリページに書き込んだデータ量 |  |  |
| `doris_be_memory_pgpgout` |  | Bytes | システムのメモリページからディスクに書き込まれたデータ量 |  |  |
| `doris_be_memory_pswpin` |  | Bytes | システムがディスクからメモリにスワップインしたデータ量 | 通常、swap は無効にするため、この値は 0 であるべきです |  |
| `doris_be_memory_pswpout` |  | Bytes | システムがメモリからディスクにスワップアウトしたデータ量 | 通常、swap は無効にするため、この値は 0 であるべきです |  |
| `doris_be_network_receive_bytes` |  | Bytes | ネットワークインターフェースごとの累積受信バイト数。`/proc/net/dev` から収集します |  |  |
| `doris_be_network_receive_packets` |  | Num | ネットワークインターフェースごとの累積受信パケット数。`/proc/net/dev` から収集します |  |  |
| `doris_be_network_send_bytes` |  | Bytes | ネットワークインターフェースごとの累積送信バイト数。`/proc/net/dev` から収集します |  |  |
| `doris_be_network_send_packets` |  | Num | ネットワークインターフェースごとの累積送信パケット数。`/proc/net/dev` から収集します |  |  |
| `doris_be_proc` | `{mode="ctxt_switch"}` | Num | CPU コンテキストスイッチの累積回数。`/proc/stat` から収集します | 異常なコンテキストスイッチがないか確認します | P0 |
| `doris_be_proc` | `{mode="interrupt"}` | Num | CPU 割り込みの累積回数。`/proc/stat` から収集します |  |  |
| `doris_be_proc` | `{mode="procs_blocked"}` | Num | システム内で現在ブロックされているプロセス数（たとえば IO 待ち）。`/proc/stat` から収集します |  |  |
| `doris_be_proc` | `{mode="procs_running"}` | Num | システム内で現在実行中のプロセス数。`/proc/stat` から収集します |  |  |
| `doris_be_snmp_tcp_in_errs` |  | Num | tcp パケットの受信エラー数。`/proc/net/snmp` から収集します | 再送やパケット損失などのネットワークエラーを確認します。他の snmp メトリクスと併用してください | P0 |
| `doris_be_snmp_tcp_in_segs` |  | Num | 受信した tcp パケット数。`/proc/net/snmp` から収集します |  |  |
| `doris_be_snmp_tcp_out_segs` |  | Num | 送信した tcp パケット数。`/proc/net/snmp` から収集します |  |  |
| `doris_be_snmp_tcp_retrans_segs` |  | Num | tcp パケットの再送数。`/proc/net/snmp` から収集します |  |  |

## bvar 診断メトリクス {#bvar-diagnostic-metrics}

次のメトリクスはバージョン 4.1.5 以降でサポートされ、前述の brpc ポートを使用します。Counter はプロセスの起動時からの累積値、Gauge は現在の値を示します。

| 名前またはプレフィックス | プロセス | 型 | 意味 |
| --- | --- | --- | --- |
| `sync_tablets_meta_num` | コンピュートとストレージの分離モードの BE | Counter | バックグラウンドで tablet メタデータの同期を試みた累積回数。呼び出し前に計上されるため、成功回数を表すものではありません |
| `sync_tablets_rowsets_num` | コンピュートとストレージの分離モードの BE | Counter | バックグラウンドで tablet の rowset の同期を試みた累積回数。呼び出し前に計上されるため、成功回数を表すものではありません |
| `vertical_compaction_active_segment_contexts` | BE | Gauge | 垂直 Compaction が現在保持しているアクティブな Segment コンテキスト数 |
| `hdfs_get_path_info` | BE | レイテンシ統計、マイクロ秒 | `hdfsGetPathInfo` のレイテンシメトリクスのプレフィックス。HDFS ファイルのメタデータへのアクセスを診断するために使用します |
| `ms_repair_tablet_index` | Meta Service | Counter | トランザクションのコミット中、欠落した `db_id` を追加するために修復された過去の Tablet Index レコードの累積数。コミットが成功した後にのみ計上されます |
| `file_cache_ttl_mgr_ttl_info_map_size`（キャッシュパスのプレフィックス付き） | BE | Gauge | 現在メモリ内で追跡している tablet の TTL 情報エントリ数。キャッシュブロック数ではありません |

キャッシュパスのプレフィックスとエビクションのメトリクスについては、[File Cache の監視](../../compute-storage-decoupled/file-cache/file-cache.md#cache-space-and-hit-rate-metrics) を参照してください。垂直 Compaction の終了時、BE の INFO ログにある `vertical_compaction_active_segment_contexts_peak` フィールドには、そのタスクのコンテキスト数のピークが記録されます。これはログフィールドであり、別のプロセスレベルの Gauge ではありません。

## よくある質問 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Monitoring metric integration and interpretation -->

### Q: 監視エンドポイントが 404 を返します。どうすればよいですか？ {#q-the-monitoring-endpoint-returns-404-what-should-i-do}

FE の `http_port` または BE の `webserver_port` にアクセスしていることを確認し、`fe.conf` / `be.conf` で実際のポート値を確認してください。

### Q: Counter メトリクスは増えるだけで減りません。正常ですか？ {#q-counter-metrics-only-increase-and-never-decrease-is-this-normal}

正常です。Counter は累積値を表します。一定間隔でサンプリングし、傾き（たとえば PromQL の `rate()`）を計算して瞬間的な速度を求める必要があります。

### Q: 複数の FE 間で `doris_fe_max_journal_id` の差が大きすぎます。どうすればよいですか？ {#q-the-gap-of-doris_fe_max_journal_id-between-multiple-fes-is-too-large-what-should-i-do}

メタデータの同期に遅延があることを示します。Master FE に対する Follower / Observer FE のネットワーク接続とリプレイ速度を確認してください。

### Q: Compaction Score が高いままです。どう調査すればよいですか？ {#q-compaction-score-remains-too-high-how-do-i-troubleshoot}

`doris_be_tablet_base_max_compaction_score` と `doris_be_tablet_cumulative_max_compaction_score` を重点的に確認し、ディスク IO と Compaction タスク数を合わせてボトルネックを特定してください。

### Q: クエリやデータロードが滞留しています。どう調査すればよいですか？ {#q-queries-or-loads-are-accumulating-how-do-i-troubleshoot}

`fragment_thread_pool_queue_size`、`doris_be_scanner_thread_pool_queue_size`、`doris_be_send_batch_thread_pool_queue_size` など、スレッドプールの待ち行列のメトリクスを確認してください。
