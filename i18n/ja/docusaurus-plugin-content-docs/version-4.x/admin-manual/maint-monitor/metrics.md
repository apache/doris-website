---
{
    "title": "監視メトリクス",
    "language": "ja",
    "description": "Doris FEとBEの監視メトリクスを網羅したリファレンスです。プロセス、JVM、マシンのメトリクスを取り上げ、クラスタの健全性監視とアラート設定に役立つP0優先度を示します。"
}
---

# 監視メトリクス {#monitoring-metrics}

<!-- Knowledge type: Configuration parameters / Parameter reference -->
<!-- Applicable scenarios: Cluster health monitoring / Alert configuration / Performance troubleshooting -->

DorisのFEとBEのプロセスには監視メトリクスが組み込まれており、デフォルトでPrometheus互換形式で公開されます。このドキュメントでは、観測できるすべてのメトリクスを体系的に一覧化し、優先度（Priority）を示します。PrometheusとGrafanaを連携させた後、監視とアラートの仕組みをすばやく構築できます。

## 適用シナリオ {#applicable-scenarios}

| シナリオ | 目的 |
| --- | --- |
| クラスタの健全性監視 | P0メトリクスを使ってFE/BEノードの異常をすばやく検出する |
| アラート設定 | QPS、エラー率、Compaction Scoreなどのメトリクスにしきい値ベースのアラートを設定する |
| パフォーマンスのトラブルシューティング | クエリのレイテンシ、スレッドプールのキュー滞留、メモリ使用量のメトリクスを使ってボトルネックを特定する |
| 容量計画 | ディスク使用量、tablet数、接続数を使ってクラスタの負荷を評価する |
| 障害の振り返り | マシンのメトリクス（CPU、IO、ネットワーク）とプロセスのメトリクスを組み合わせて障害の根本原因を分析する |

## メトリクスの分類 {#metric-categories}

Dorisの監視メトリクスは、観測対象によって次の2種類に分かれます。

1. **プロセス監視**：クエリ数、トランザクション数、Compactionの状態など、Dorisプロセス自体の実行時メトリクスを示します。
2. **ノード監視**：CPU、メモリ、IO、ネットワークなど、Dorisプロセスが稼働するマシンのリソースメトリクスを示します。

## 監視メトリクスの取得 {#retrieving-monitoring-metrics}

### Prometheus互換形式（デフォルト） {#prometheus-compatible-format-default}

FEまたはBEノードのHTTPポートに直接アクセスします。

```shell
curl http://fe_host:http_port/metrics
curl http://be_host:webserver_port/metrics
```

レスポンス例：

```text
doris_fe_cache_added{type="partition"} 0
doris_fe_cache_added{type="sql"} 0
doris_fe_cache_hit{type="partition"} 0
doris_fe_cache_hit{type="sql"} 0
doris_fe_connection_total 2
```

### JSON形式 {#json-format}

`type=json`パラメータを使用して、メトリクスをJSON形式で取得します。

```shell
curl http://fe_host:http_port/metrics?type=json
curl http://be_host:webserver_port/metrics?type=json
```

### bvarメトリクス {#bvar-metrics}

BEおよびMeta Service / Recyclerのプロセスは、それぞれのbrpcサービスからbvarメトリクスも公開します。Prometheus互換の出力には`/brpc_metrics`を、名前を指定した診断情報の確認には`/vars`を使用します。

```shell
curl http://be_host:brpc_port/brpc_metrics
curl http://be_host:brpc_port/vars
curl http://cloud_host:brpc_listen_port/brpc_metrics
```

これらのエンドポイントは、BEの`brpc_port`（デフォルトは`8060`）またはMeta Service / Recyclerの`brpc_listen_port`（デフォルトは`5000`）を使用します。前述のFE / BEのHTTP監視ポートとは異なります。以下のbvar名は登録名に従っており、すべてに`doris_be_`プレフィックスが付くわけではありません。

#### バージョンの識別 {#version-identification}

バージョン4.1.5以降、BEとMeta Service / Recyclerのバージョンメトリクスには、`/brpc_metrics`で次のラベルが含まれます。

| メトリクス | 型 | ラベル | 意味 |
| --- | --- | --- | --- |
| `doris_be_version` | Gauge | `version`、`major`、`minor`、`patch`、`hotfix`、`short_hash` | BEのビルドバージョンとコミット識別子 |
| `doris_cloud_version` | Gauge | 上記と同じ | Meta Service / Recyclerのビルドバージョンとコミット識別子 |

各プロセスはバージョンのサンプルを1つ公開します。メトリクス値には従来のバージョンエンコーディングが保持されます。完全なバージョンは`version`ラベル、コミット識別子は`short_hash`ラベルで確認してください。`doris_cloud_version`では、そのプロセスがMeta Service、Recycler、または両方のどれを実行しているかを区別できません。役割を識別するには、スクレイプターゲットのラベルを追加してください。

プロセスの`bvar_max_dump_multi_dimension_metric_num`設定は、多次元bvarサンプルの数を制限します。デフォルトは`5000`で、`0`にするとバージョンメトリクスなどのサンプルが無効になります。BEではバージョン4.1.5以降にこの設定を使用でき、変更を反映するには再起動が必要です。[BE設定](../config/be-config.md#bvar_max_dump_multi_dimension_metric_num)を参照してください。

## 監視の優先度とベストプラクティス {#monitoring-priority-and-best-practices}

<!-- Knowledge type: Best practices -->

- 各メトリクステーブルの最後の列は優先度（Priority）です。**P0が最も重要**で、値が大きいほど重要度は低くなります。まずP0メトリクスを連携させてください。
- 監視メトリクスの大半はCounter型（累積値）です。**有用な情報を得るには、一定間隔（たとえば15秒ごと）でサンプリングし、単位時間あたりの傾きを計算する必要があります**。

    たとえば、`doris_fe_query_err`の傾きを計算すると、クエリのエラー率（1秒あたりのエラー数）が得られます。

> より網羅的で有用な監視メトリクスを提供するため、この表への貢献を歓迎します。

## FE監視メトリクス {#fe-monitoring-metrics}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: FE node health monitoring / Metadata sync monitoring / Query performance monitoring -->

### プロセス監視 {#process-monitoring}

| 名前 | ラベル | 単位 | 意味 | 説明 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| `doris_fe_cache_added` | {type="partition"} | Num | 新規追加されたPartition Cacheの累積数 |  |  |
|  | {type="sql"} | Num | 新規追加されたSQL Cacheの累積数 |  |  |
| `doris_fe_cache_hit` | {type="partition"} | Num | Partition Cacheのヒット数 |  |  |
|  | {type="sql"} | Num | SQL Cacheのヒット数 |  |  |
| `doris_fe_connection_total` |  | Num | FEのMySQLポートへの現在の接続数 | クエリ接続数の監視に使用します。接続数が上限を超えると、新しい接続を受け付けられなくなります | P0 |
| `doris_fe_counter_hit_sql_block_rule` |  | Num | SQL BLOCK RULEによってブロックされたクエリ数 |  |  |
| `doris_fe_edit_log_clean` | {type="failed"} | Num | 過去のメタデータログのクリーンアップ失敗回数 | 失敗しないことが期待されます。失敗した場合は手動での対処が必要です | P0 |
|  | {type="success"} | Num | 過去のメタデータログのクリーンアップ成功回数 |  |  |
| `doris_fe_edit_log` | {type="accumulated_bytes"} | Bytes | メタデータログの累積書き込み量 | 傾きから書き込み速度を求め、メタデータの書き込みに遅延がないか確認します | P0 |
|  | {type="current_bytes"} | Bytes | メタデータログの現在のサイズ | editlogのサイズを監視します。サイズが上限を超えた場合は手動での対処が必要です | P0 |
|  | {type="read"} | Num | メタデータログの読み取り回数 | 傾きからメタデータの読み取り頻度が正常か確認します | P0 |
|  | {type="write"} | Num | メタデータログの書き込み回数 | 傾きからメタデータの書き込み頻度が正常か確認します | P0 |
|  | {type="current"} | Num | 現在のメタデータログ数 | editlogの数を監視します。数が上限を超えた場合は手動での対処が必要です | P0 |
| `doris_fe_editlog_write_latency_ms` |  | Milliseconds | メタデータログの書き込みレイテンシのパーセンタイル統計。たとえば、{quantile="0.75"}は75パーセンタイルの書き込みレイテンシを示します |  |  |
| `doris_fe_image_clean` | {type="failed"} | Num | 過去のメタデータイメージファイルのクリーンアップ失敗回数 | 失敗しないことが期待されます。失敗した場合は手動での対処が必要です | P0 |
|  | {type="success"} | Num | 過去のメタデータイメージファイルのクリーンアップ成功回数 |  |  |
| `doris_fe_image_push` | {type="failed"} | Num | メタデータイメージファイルを他のFEノードにプッシュした際の失敗回数 |  |  |
|  | {type="success"} | Num | メタデータイメージファイルを他のFEノードにプッシュした際の成功回数 |  |  |
| `doris_fe_image_write` | {type="failed"} | Num | メタデータイメージファイルの生成失敗回数 | 失敗しないことが期待されます。失敗した場合は手動での対処が必要です | P0 |
|  | {type="success"} | Num | メタデータイメージファイルの生成成功回数 |  |  |
| `doris_fe_job` |  | Num | 種類と状態ごとのジョブ数。たとえば、{job="load", type="INSERT", state="LOADING"}はLOADING状態にあるINSERTタイプのデータロードジョブ数を示します | 必要に応じて、クラスタ内の種類別ジョブ数を確認します | P0 |
| `doris_fe_max_journal_id` |  | Num | 現在のFEノードにあるメタデータログの最大ID。Master FEでは現在書き込まれている最大ID、Master以外のFEでは現在リプレイ済みのメタデータログの最大IDです | 複数のFE間でIDに大きな差がないか確認します。差が大きい場合はメタデータ同期に問題があります | P0 |
| `doris_fe_max_tablet_compaction_score` |  | Num | すべてのBEノードにおけるCompaction Scoreの最大値 | 現在のクラスタの最大Compaction Scoreを確認し、高すぎないか判断します。値が高いとクエリや書き込みのレイテンシが生じる可能性があります | P0 |
| `doris_fe_qps` |  | Num/Sec | 現在のFEにおける1秒あたりのクエリ数（クエリリクエストのみをカウント） | QPS | P0 |
| `doris_fe_query_err` |  | Num | 失敗したクエリの累積数 |  |  |
| `doris_fe_query_err_rate` |  | Num/Sec | 1秒あたりの失敗したクエリ数 | クラスタでクエリエラーが発生していないか確認します | P0 |
| `doris_fe_query_latency_ms` |  | Milliseconds | クエリリクエストのレイテンシのパーセンタイル統計。たとえば、{quantile="0.75"}は75パーセンタイルのクエリレイテンシを示します | 各パーセンタイルのクエリレイテンシを詳しく確認します | P0 |
| `doris_fe_query_latency_ms_db` |  | Milliseconds | DBごとのクエリリクエストのレイテンシのパーセンタイル統計。たとえば、{quantile="0.75",db="test"}はDB testの75パーセンタイルのクエリレイテンシを示します | DBごとに各パーセンタイルのクエリレイテンシを詳しく確認します | P0 |
| `doris_fe_query_olap_table` |  | Num | 内部テーブル（OlapTable）に対するクエリリクエスト数 |  |  |
| `doris_fe_query_total` |  | Num | すべてのクエリリクエストの累積数 |  |  |
| `doris_fe_report_queue_size` |  | Num | BEから送られる各種定期レポートタスクを処理するFE側キューの長さ | Master FEノードでレポートタスクが滞留している度合いを示します。値が大きいほどFEの処理能力に余裕がありません | P0 |
| `doris_fe_request_total` |  | Num | MySQLポートを通じて受信したすべての操作リクエスト（クエリとその他のステートメントを含む） |  |  |
| `doris_fe_routine_load_error_rows` |  | Num | クラスタ内のすべてのRoutine Loadジョブにおけるエラー行の総数 |  |  |
| `doris_fe_routine_load_receive_bytes` |  | Bytes | クラスタ内のすべてのRoutine Loadジョブが受信したデータの総量 |  |  |
| `doris_fe_routine_load_rows` |  | Num | クラスタ内のすべてのRoutine Loadジョブが受信したデータ行の総数 |  |  |
| `doris_fe_routine_load_get_meta_latency` |  | Milliseconds | クラスタ内のすべてのRoutine Loadジョブにおけるメタデータ取得のレイテンシ |  |  |
| `doris_fe_routine_load_get_meta_count` |  | Num | クラスタ内のすべてのRoutine Loadジョブにおけるメタデータ取得回数 |  |  |
| `doris_fe_routine_load_get_meta_fail_count` |  | Num | クラスタ内のすべてのRoutine Loadジョブにおけるメタデータ取得の失敗回数 |  |  |
| `doris_fe_routine_load_task_execute_time` |  | Milliseconds | クラスタ内のすべてのRoutine Loadタスクの実行時間 |  |  |
| `doris_fe_routine_load_task_execute_count` |  | Num | クラスタ内のすべてのRoutine Loadタスクの実行回数 |  |  |
| `doris_fe_routine_load_lag` |  | Milliseconds | クラスタ内のすべてのRoutine Loadジョブの消費遅延 |  |  |
| `doris_fe_routine_load_progress` |  | Milliseconds | クラスタ内のすべてのRoutine Loadジョブの消費進捗 |  |  |
| `doris_fe_routine_load_abort_task_num` |  | Num | クラスタ内のすべてのRoutine Loadジョブで失敗したタスク数 |  |  |
| `doris_fe_rps` |  | Num | 現在のFEにおける1秒あたりのリクエスト数（クエリとその他のステートメントを含む） | QPSと併せて使用し、クラスタが処理したリクエスト量を確認します | P0 |
| `doris_fe_scheduled_tablet_num` |  | Num | Master FEノードがスケジューリング中のtablet数。修復中のレプリカとバランス調整中のレプリカを含みます | 現在クラスタ内で移行中のtablet数を示します。ゼロ以外の状態が長く続く場合、クラスタは不安定です | P0 |
| `doris_fe_tablet_max_compaction_score` |  | Num | 各BEノードが報告したCompaction Score。たとえば、{backend="172.21.0.1:9556"}は"172.21.0.1:9556"のBEが報告した値を示します |  |  |
| `doris_fe_tablet_num` |  | Num | 各BEノード上のtabletの総数。たとえば、{backend="172.21.0.1:9556"}は"172.21.0.1:9556"のBEに現在あるtablet数を示します | tabletの分布が均一か、絶対数が妥当かを確認します | P0 |
| `doris_fe_tablet_status_count` |  | Num | Master FEノードのTablet schedulerがスケジューリングしたtabletの累積数 |  |  |
|  | {type="added"} | Num | Master FEノードのTablet schedulerがスケジューリングしたtabletの累積数。"added"はスケジューリングされたtablet数を示します |  |  |
|  | {type="in_sched"} | Num | 上記と同じメトリクス。繰り返しスケジューリングされたtablet数を示します | この値が急速に増加する場合、一部のtabletが長期間にわたり異常な状態にあり、スケジューラによって繰り返しスケジューリングされています |  |
|  | {type="not_ready"} | Num | 上記と同じメトリクス。スケジューリングのトリガー条件をまだ満たしていないtablet数を示します | この値が急速に増加する場合、多数のtabletが異常な状態にあるものの、スケジューリングできていません |  |
|  | {type="total"} | Num | 上記と同じメトリクス。チェック済みのtabletの累積数を示します（スケジューリングされたとは限りません） |  |  |
|  | {type="unhealthy"} | Num | 上記と同じメトリクス。チェック済みの異常なtabletの累積数を示します |  |  |
| `doris_fe_thread_pool` |  | Num | 各種スレッドプールのワーカースレッド数とキュー滞留状況の統計。`active_thread_num`は現在実行中のタスク数、`pool_size`はプール内の総スレッド数、`task_in_queue`は現在キューに入っているタスク数を示します |  |  |
|  | {name="agent-task-pool"} | Num | Master FEがBEにAgent Taskを送信するためのスレッドプール |  |  |
|  | {name="connect-scheduler-check-timer"} | Num | MySQLのアイドル接続がタイムアウトしたかどうかを確認するスレッドプール |  |  |
|  | {name="connect-scheduler-pool"} | Num | MySQL接続リクエストを受け付けるスレッドプール |  |  |
|  | {name="mysql-nio-pool"} | Num | NIO MySQL Serverがタスクを処理するためのスレッドプール |  |  |
|  | {name="export-exporting-job-pool"} | Num | exporting状態のエクスポートジョブ用スケジューリングスレッドプール |  |  |
|  | {name="export-pending-job-pool"} | Num | pending状態のエクスポートジョブ用スケジューリングスレッドプール |  |  |
|  | {name="heartbeat-mgr-pool"} | Num | Master FEが各ノードからのハートビートを処理するためのスレッドプール |  |  |
|  | {name="loading-load-task-scheduler"} | Num | Master FEがBroker Loadジョブでloading状態のタスクをスケジューリングするためのスレッドプール |  |  |
|  | {name="pending-load-task-scheduler"} | Num | Master FEがBroker Loadジョブでpending状態のタスクをスケジューリングするためのスレッドプール |  |  |
|  | {name="schema-change-pool"} | Num | Master FEがスキーマ変更ジョブをスケジューリングするためのスレッドプール |  |  |
|  | {name="thrift-server-pool"} | Num | FE側のThriftServerのワーカースレッドプール。fe.confの`rpc_port`に対応し、BEとの通信に使用します |  |  |
| `doris_fe_txn_counter` |  | Num | 各状態のデータロードトランザクションの累積数 | データロードトランザクションの実行状態を確認します | P0 |
|  | {type="begin"} | Num | 開始されたトランザクション数 |  |  |
|  | {type="failed"} | Num | 失敗したトランザクション数 |  |  |
|  | {type="reject"} | Num | 拒否されたトランザクション数（たとえば、現在実行中のトランザクション数がしきい値を超えたために新しいトランザクションが拒否された場合） |  |  |
|  | {type="success"} | Num | 成功したトランザクション数 |  |  |
| `doris_fe_txn_status` |  | Num | 現在、各状態にあるデータロードトランザクション数。たとえば、{type="committed"}はcommitted状態のトランザクション数を示します | 各状態のデータロードトランザクション数を確認し、滞留の有無を判断します | P0 |
| `doris_fe_query_instance_num` |  | Num | 特定のユーザーが現在リクエストしているfragment instance数。たとえば、{user="test_u"}はユーザーtest_uが現在リクエストしているinstance数を示します | 特定のユーザーがクエリリソースを使いすぎていないか確認します | P0 |
| `doris_fe_query_instance_begin` |  | Num | 特定のユーザーがリクエストを開始したfragment instance数。たとえば、{user="test_u"}はユーザーtest_uがリクエストを開始したinstance数を示します | 特定のユーザーがクエリを大量に送信していないか確認します | P0 |
| `doris_fe_query_rpc_total` |  | Num | 特定のBEに送信されたRPC数。たとえば、{be="192.168.10.1"}はIPアドレス192.168.10.1のBEに送信されたRPC数を示します | 特定のBEにRPCが大量に送信されていないか確認します |  |
| `doris_fe_query_rpc_failed` |  | Num | 特定のBEに送信され、失敗したRPC数。たとえば、{be="192.168.10.1"}はIPアドレス192.168.10.1のBEへのRPC失敗数を示します | 特定のBEでRPCの問題が発生していないか確認します |  |
| `doris_fe_query_rpc_size` |  | Num | 特定のBE向けRPCのデータサイズ。たとえば、{be="192.168.10.1"}はIPアドレス192.168.10.1のBEに送信されたRPCデータのバイト数を示します | 特定のBEにサイズが大きすぎるRPCが送信されていないか確認します |  |
| `doris_fe_txn_exec_latency_ms` |  | Milliseconds | トランザクション実行時間のパーセンタイル統計。たとえば、{quantile="0.75"}は75パーセンタイルのトランザクション実行時間を示します | 各パーセンタイルのトランザクション実行時間を詳しく確認します | P0 |
| `doris_fe_txn_publish_latency_ms` |  | Milliseconds | トランザクションpublish時間のパーセンタイル統計。たとえば、{quantile="0.75"}は75パーセンタイルのトランザクションpublish時間を示します | 各パーセンタイルのトランザクションpublish時間を詳しく確認します | P0 |
| `doris_fe_txn_num` |  | Num | 特定のDBで現在実行中のトランザクション数。たとえば、{db="test"}はDB testで現在実行中のトランザクション数を示します | 特定のDBで大量のトランザクションが送信されていないか確認します | P0 |
| `doris_fe_publish_txn_num` |  | Num | 特定のDBで現在publish中のトランザクション数。たとえば、{db="test"}はDB testで現在publish中のトランザクション数を示します | 特定のDBでpublish中のトランザクション数を確認します | P0 |
| `doris_fe_txn_replica_num` |  | Num | 特定のDBで現在実行中のトランザクションが開いたレプリカ数。たとえば、{db="test"}はDB testで現在実行中のトランザクションが開いたレプリカ数を示します | 特定のDBでレプリカを開きすぎて、他のトランザクションの実行に影響を与えていないか確認します | P0 |
| `doris_fe_thrift_rpc_total` |  | Num | FEのthriftインターフェースの各メソッドが受信したRPCリクエスト数。たとえば、{method="report"}はreportメソッドが受信したRPCリクエスト数を示します | 特定のthrift rpcメソッドの負荷を確認します |  |
| `doris_fe_thrift_rpc_latency_ms` |  | Milliseconds | FEのthriftインターフェースの各メソッドにおけるRPCリクエスト処理時間。たとえば、{method="report"}はreportメソッドのRPCリクエスト処理時間を示します | 特定のthrift rpcメソッドの負荷を確認します |  |
| `doris_fe_external_schema_cache` | {catalog="hive"} | Num | 特定のExternal Catalogのスキーマキャッシュ内のエントリ数 |  |  |
| `doris_fe_hive_meta_cache` | {catalog="hive"} | Num |  |  |  |
|  | `{type="partition_value"}` | Num | 特定のExternal Hive Metastore Catalogのパーティション値キャッシュ内のエントリ数 |  |  |
|  | `{type="partition"}` | Num | 特定のExternal Hive Metastore Catalogのパーティションキャッシュ内のエントリ数 |  |  |
|  | `{type="file"}` | Num | 特定のExternal Hive Metastore Catalogのファイルキャッシュ内のエントリ数 |  |  |
| `doris_fe_virtual_compute_group_switch_total` | `{virtual_compute_group_id, virtual_compute_group_name, src_compute_group_id, src_compute_group_name, dst_compute_group_id, dst_compute_group_name}` | Num | 仮想コンピュートグループのアクティブ・スタンバイ切り替えの累積回数。バージョン4.0.8以降でサポートされ、コンピュートとストレージの分離モードでのみ生成されます | 傾きから仮想コンピュートグループの切り替え頻度が高いか確認できます。頻繁な切り替えは通常、プライマリコンピュートグループが不安定であることを示します |  |

### JVM監視 {#jvm-monitoring}

| 名前 | ラベル | 単位 | 意味 | 説明 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| `jvm_heap_size_bytes` |  | Bytes | JVMメモリの監視。ラベルにはmax、used、committedがあり、それぞれ最大メモリ、使用中のメモリ、コミット済みメモリに対応します | JVMのメモリ使用量を確認します | P0 |
| `jvm_non_heap_size_bytes` |  | Bytes | JVMのヒープ外メモリの統計 |  |  |
| `<GarbageCollector>` |  |  | GCの監視 | GarbageCollectorは特定のガベージコレクタを指します | P0 |
|  | {type="count"} | Num | GCの累積回数 |  |  |
|  | {type="time"} | Milliseconds | GCの累積時間 |  |  |
| `jvm_old_size_bytes` |  | Bytes | JVMのOld世代メモリの統計 |  | P0 |
| `jvm_thread` |  | Num | JVMのスレッド数の統計 | JVMのスレッド数が妥当か確認します | P0 |
| `jvm_young_size_bytes` |  | Bytes | JVMのYoung世代メモリの統計 |  | P0 |

### マシン監視 {#machine-monitoring}

| 名前 | ラベル | 単位 | 意味 | 説明 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| `system_meminfo` |  | Bytes | FEノードのマシンのメモリ監視。`/proc/meminfo`から収集します。`buffers`、`cached`、`memory_available`、`memory_free`、`memory_total`を含みます |  |  |
| `system_snmp` |  |  | FEノードのマシンのネットワーク監視。`/proc/net/snmp`から収集します |  |  |
|  | `{name="tcp_in_errs"}` | Num | tcpパケットの受信エラー数 |  |  |
|  | `{name="tcp_in_segs"}` | Num | 受信したtcpパケット数 |  |  |
|  | `{name="tcp_out_segs"}` | Num | 送信したtcpパケット数 |  |  |
|  | `{name="tcp_retrans_segs"}` | Num | tcpパケットの再送数 |  |  |

## BE監視メトリクス {#be-monitoring-metrics}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: BE node health monitoring / Query and write performance monitoring / Compaction monitoring -->

### プロセス監視 {#process-monitoring-1}

| 名前 | ラベル | 単位 | 意味 | 説明 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| `doris_be_active_scan_context_count` |  | Num | 外部システムによって直接開かれているscannerの現在数を示します |  |  |
| `doris_be_add_batch_task_queue_size` |  | Num | データロード中にバッチを受信するスレッドプールのキューサイズを記録します | 0より大きい場合、データロードタスクの受信側で滞留が発生しています | P0 |
| `agent_task_queue_size` |  | Num | 各Agent Task処理キューの長さを示します。たとえば、`{type="CREATE_TABLE"}`はCREATE_TABLEタスクのキュー長を示します |  |  |
| `doris_be_brpc_endpoint_stub_count` |  | Num | BE間の通信に使用する、作成済みのbrpc stub数 |  |  |
| `doris_be_brpc_function_endpoint_stub_count` |  | Num | Remote RPCとの通信に使用する、作成済みのbrpc stub数 |  |  |
| `doris_be_cache_capacity` |  |  | 特定のLRU Cacheの容量を記録します |  |  |
| `doris_be_cache_usage` |  |  | 特定のLRU Cacheの使用量を記録します | メモリ使用量を確認します | P0 |
| `doris_be_cache_usage_ratio` |  |  | 特定のLRU Cacheの使用率を記録します |  |  |
| `doris_be_cache_lookup_count` |  |  | 特定のLRU Cacheの検索回数を記録します |  |  |
| `doris_be_cache_hit_count` |  |  | 特定のLRU Cacheのヒット数を記録します |  |  |
| `doris_be_cache_hit_ratio` |  |  | 特定のLRU Cacheのヒット率を記録します | キャッシュが有効に機能しているか確認します | P0 |
|  | {name="DataPageCache"} | Num | DataPageCacheはデータのData Pageをキャッシュします | データキャッシュであり、クエリ効率に直接影響します | P0 |
|  | {name="IndexPageCache"} | Num | IndexPageCacheはデータのIndex Pageをキャッシュします | インデックスキャッシュであり、クエリ効率に直接影響します | P0 |
|  | {name="LastSuccessChannelCache"} | Num | LastSuccessChannelCacheはデータロードの受信側にあるLoadChannelをキャッシュします |  |  |
|  | {name="SegmentCache"} | Num | SegmentCacheはインデックス情報など、開かれたSegmentをキャッシュします |  |  |
| `doris_be_chunk_pool_local_core_alloc_count` |  | Num | ChunkAllocatorで、バインドされたコアのメモリキューからメモリが割り当てられた回数 |  |  |
| `doris_be_chunk_pool_other_core_alloc_count` |  | Num | ChunkAllocatorで、他のコアのメモリキューからメモリが割り当てられた回数 |  |  |
| `doris_be_chunk_pool_reserved_bytes` |  | Bytes | ChunkAllocatorで予約されているメモリのサイズ |  |  |
| `doris_be_chunk_pool_system_alloc_cost_ns` |  | Nanoseconds | SystemAllocatorによるメモリ割り当てに費やされた累積時間 | 傾きからメモリ割り当ての所要時間を確認します | P0 |
| `doris_be_chunk_pool_system_alloc_count` |  | Num | SystemAllocatorがメモリを割り当てた回数 |  |  |
| `doris_be_chunk_pool_system_free_cost_ns` |  | Nanoseconds | SystemAllocatorによるメモリ解放に費やされた累積時間 | 傾きからメモリ解放の所要時間を確認します | P0 |
| `doris_be_chunk_pool_system_free_count` |  | Num | SystemAllocatorがメモリを解放した回数 |  |  |
| `doris_be_compaction_bytes_total` |  | Bytes | Compactionで処理されたデータの累積量 | Compactionタスクへの入力rowsetのディスクサイズを記録します。傾きからCompaction速度を確認します | P0 |
|  | {type="base"} | Bytes | Base Compactionの累積データ量 |  |  |
|  | {type="cumulative"} | Bytes | Cumulative Compactionの累積データ量 |  |  |
| `doris_be_compaction_deltas_total` |  | Num | Compactionで処理されたrowsetの累積数 | Compactionタスクへの入力rowset数を記録します |  |
|  | {type="base"} | Num | Base Compactionで処理されたrowsetの累積数 |  |  |
|  | {type="cumulative"} | Num | Cumulative Compactionで処理されたrowsetの累積数 |  |  |
| `doris_be_disks_compaction_num` |  | Num | 特定のデータディレクトリで現在実行中のCompactionタスク数。たとえば、`{path="/path1/"}`は`/path1`ディレクトリで現在実行中のタスク数を示します | 各ディスクのCompactionタスク数が妥当か確認します | P0 |
| `doris_be_disks_compaction_score` |  | Num | 特定のデータディレクトリで現在実行中のCompaction token数。たとえば、`{path="/path1/"}`は`/path1`ディレクトリで現在実行中のtoken数を示します |  |  |
| `doris_be_compaction_used_permits` |  | Num | Compactionタスクがすでに使用しているtoken数 | Compactionのリソース消費を示します |  |
| `doris_be_compaction_waitting_permits` |  | Num | Compaction tokenを待っている項目数 |  |  |
| `doris_be_data_stream_receiver_count` |  | Num | 受信側のデータReceiver数 | FIXME: このメトリクスはベクトル化エンジンにはありません |  |
| `doris_be_disks_avail_capacity` |  | Bytes | 特定のデータディレクトリがあるディスクの空き容量。たとえば、`{path="/path1/"}`は`/path1`ディレクトリがあるディスクの空き容量を示します |  | P0 |
| `doris_be_disks_local_used_capacity` |  | Bytes | 特定のデータディレクトリがあるディスクで、ローカルで使用中の容量 |  |  |
| `doris_be_disks_remote_used_capacity` |  | Bytes | 特定のデータディレクトリがあるディスクに対応するリモートディレクトリの使用容量 |  |  |
| `doris_be_disks_state` |  | Boolean | 特定のデータディレクトリのディスク状態。1は正常、0は異常を示します |  |  |
| `doris_be_disks_total_capacity` |  | Bytes | 特定のデータディレクトリがあるディスクの総容量 | `doris_be_disks_avail_capacity`と併せて使用し、ディスク使用率を計算します | P0 |
| `doris_be_engine_requests_total` |  | Num | BE上の各種タスクの実行状態ごとの累積数 |  |  |
|  | {status="failed",type="xxx"} | Num | タイプxxxのタスクの累積失敗回数 |  |  |
|  | {status="total",type="xxx"} | Num | タイプxxxのタスクの累積実行回数 | 必要に応じて、各種タスクの失敗回数を監視します | P0 |
|  | `{status="skip",type="report_all_tablets"}` | Num | タイプxxxのタスクがスキップされた累積回数 |  |  |
| `doris_be_fragment_endpoint_count` |  | Num | `doris_be_data_stream_receiver_count`と同じ | FIXME: `doris_be_data_stream_receiver_count`と同じ数です。これもベクトル化エンジンにはありません |  |
| `doris_be_fragment_request_duration_us` |  | Microseconds | すべてのfragment instanceの累積実行時間 | 傾きからinstanceの実行時間を確認します | P0 |
| `doris_be_fragment_requests_total` |  | Num | 実行されたfragment instanceの累積数 |  |  |
| `doris_be_load_channel_count` |  | Num | 現在開いているload channel数 | 値が大きいほど、現在実行中のデータロードタスクが多いことを示します | P0 |
| `doris_be_local_bytes_read_total` |  | Bytes | `LocalFileReader`が読み取ったバイト数 |  | P0 |
| `doris_be_local_bytes_written_total` |  | Bytes | `LocalFileWriter`が書き込んだバイト数 |  | P0 |
| `doris_be_local_file_reader_total` |  | Num | 開かれた`LocalFileReader`インスタンスの累積数 |  |  |
| `doris_be_local_file_open_reading` |  | Num | 現在開いている`LocalFileReader`インスタンス数 |  |  |
| `doris_be_local_file_writer_total` |  | Num | 開かれた`LocalFileWriter`インスタンスの累積数 |  |  |
| `doris_be_mem_consumption` |  | Bytes | 特定のモジュールの現在のメモリ消費量。たとえば、{type="compaction"}はCompactionモジュールの現在の総メモリ消費量を示します | 同じタイプのMemTrackerから取得した値です。FIXME |  |
| `doris_be_memory_allocated_bytes` |  | Bytes | BEプロセスの物理メモリサイズ。`/proc/self/status/VmRSS`から取得します |  | P0 |
| `doris_be_memory_jemalloc` |  | Bytes | Jemallocの統計。`je_mallctl`から取得します | 意味については https://jemalloc.net/jemalloc.3.html を参照してください | P0 |
| `doris_be_memory_pool_bytes_total` |  | Bytes | すべてのMemPoolが現在占有しているメモリサイズ。実際のメモリ使用量を表すものではない統計値です |  |  |
| `doris_be_memtable_flush_duration_us` |  | Microseconds | memtableのディスクへの書き込みに費やされた累積時間 | 傾きから書き込みレイテンシを確認します | P0 |
| `doris_be_memtable_flush_total` |  | Num | ディスクに書き込まれたmemtableの累積数 | 傾きからファイルの書き込み頻度を計算します | P0 |
| `doris_be_meta_request_duration` |  | Microseconds | RocksDB内のmetaへのアクセスに費やされた累積時間 | 傾きからBEメタデータの読み書きのレイテンシを確認します | P0 |
|  | {type="read"} | Microseconds | 読み取り時間 |  |  |
|  | {type="write"} | Microseconds | 書き込み時間 |  |  |
| `doris_be_meta_request_total` |  | Num | RocksDB内のmetaへの累積アクセス回数 | 傾きからBEメタデータへのアクセス頻度を確認します | P0 |
|  | {type="read"} | Num | 読み取り回数 |  |  |
|  | {type="write"} | Num | 書き込み回数 |  |  |
| `doris_be_fragment_instance_count` |  | Num | 現在受信しているfragment instance数 | instanceが滞留していないか確認します | P0 |
| `doris_be_process_fd_num_limit_hard` |  | Num | BEプロセスのファイルハンドル数のハードリミット。`/proc/pid/limits`から収集します |  |  |
| `doris_be_process_fd_num_limit_soft` |  | Num | BEプロセスのファイルハンドル数のソフトリミット。`/proc/pid/limits`から収集します |  |  |
| `doris_be_process_fd_num_used` |  | Num | BEプロセスが使用中のファイルハンドル数。`/proc/self/fd`のエントリを数えて収集します |  |  |
| `doris_be_process_thread_num` |  | Num | BEプロセスのスレッド数。`/proc/pid/task`から収集します |  | P0 |
| `doris_be_query_cache_memory_total_byte` |  | Bytes | Query Cacheが占有しているバイト数 |  |  |
| `doris_be_query_cache_partition_total_count` |  | Num | Partition Cacheの現在のエントリ数 |  |  |
| `doris_be_query_cache_sql_total_count` |  | Num | SQL Cacheの現在のエントリ数 |  |  |
| `doris_be_query_scan_bytes` |  | Bytes | 読み取ったデータの累積量。Olapテーブルから読み取ったデータのみを数えます |  |  |
| `doris_be_query_scan_bytes_per_second` |  | Bytes/Sec | `doris_be_query_scan_bytes`から計算した読み取り速度 | クエリ速度を確認します | P0 |
| `doris_be_query_scan_rows` |  | Num | 読み取った行の累積数。Olapテーブルから読み取ったデータのみを数えます。これはRawRowsReadであり、インデックスによってスキップされて実際には読み取られなかったデータ行も、この値には含まれる場合があります | 傾きからクエリ速度を確認します | P0 |
| `doris_be_result_block_queue_count` |  | Num | 現在クエリ結果キャッシュにあるfragment instance数 | このキューは、外部システムが直接読み取る場合にのみ使用されます。たとえば、Spark on Dorisはexternal scanを介してデータをクエリします |  |
| `doris_be_result_buffer_block_count` |  | Num | 現在クエリ結果キャッシュにあるクエリ数 | 現在のBEにあるクエリ結果のうち、FEによる消費を待っているものの数を示します | P0 |
| `doris_be_routine_load_task_count` |  | Num | 現在実行中のRoutine Loadタスク数 |  |  |
| `doris_be_rowset_count_generated_and_in_use` |  | Num | 前回の起動以降に新たに追加され、使用中のrowset ID数 |  |  |
| `doris_be_s3_bytes_read_total` |  | Num | `S3FileReader`が開かれた累積回数 |  |  |
| `doris_be_s3_file_open_reading` |  | Num | 現在開いている`S3FileReader`インスタンス数 |  |  |
| `doris_be_s3_bytes_read_total` |  | Bytes | `S3FileReader`が読み取った累積バイト数 |  |  |
| `doris_be_scanner_thread_pool_queue_size` |  | Num | OlapScanner用スレッドプールの現在のキューサイズ | ゼロより大きい値は、Scannerの滞留が始まっていることを示します | P0 |
| `doris_be_segment_read` | `{type="segment_read_total"}` | Num | 読み取ったsegmentの累積数 |  |  |
| `doris_be_segment_read` | `{type="segment_row_total"}` | Num | segment全体で読み取った行の累積数 | インデックスで除外された行も含みます。読み取ったsegment数に各segmentの総行数を掛けた値に相当します |  |
| `doris_be_send_batch_thread_pool_queue_size` |  | Num | データロード中にデータパケットを送信するスレッドプールのキューサイズ | 0より大きい値は滞留を示します | P0 |
| `doris_be_send_batch_thread_pool_thread_num` |  | Num | データロード中にデータパケットを送信するスレッドプールのスレッド数 |  |  |
| `doris_be_small_file_cache_count` |  | Num | 現在BEにキャッシュされている小さなファイルの数 |  |  |
| `doris_be_streaming_load_current_processing` |  | Num | 現在実行中のStream Loadタスク数 | curlコマンド経由で送信されたタスクのみを含みます |  |
| `doris_be_streaming_load_duration_ms` |  | Milliseconds | すべてのStream Loadタスクの累積実行時間 |  |  |
| `doris_be_streaming_load_requests_total` |  | Num | Stream Loadタスクの累積数 | 傾きからタスクの送信頻度を確認します | P0 |
| `doris_be_stream_load_pipe_count` |  | Num | 現在のStream Loadデータパイプ数 | Stream LoadとRoutine Loadの両方のタスクを含みます |  |
| `doris_be_stream_load` | {type="load_rows"} | Num | Stream Loadによって最終的にロードされた行の累積数 | Stream LoadとRoutine Loadの両方のタスクを含みます | P0 |
| `doris_be_stream_load` | {type="receive_bytes"} | Bytes | Stream Loadが受信した累積バイト数 | HTTP経由でStream Loadが受信したデータと、Routine LoadがKafkaから読み取ったデータを含みます | P0 |
| `doris_be_tablet_base_max_compaction_score` |  | Num | 現在のBase Compaction Scoreの最大値 | この値はリアルタイムで変化するため、ピーク値を見逃すことがあります。値が高いほどCompactionの滞留が深刻です | P0 |
| `doris_be_tablet_cumulative_max_compaction_score` |  | Num | すべてのCumulative Compaction戦略における現在のCompaction Scoreの最大値 | 戦略全体の最大値として保持されます |  |
| `doris_be_tablet_version_num_distribution` |  | Num | tabletのバージョン数のヒストグラム | tabletのバージョン数の分布を示します | P0 |
| `doris_be_thrift_connections_total` |  | Num | 作成されたthrift接続の累積数。たとえば、`{name="heartbeat"}`はheartbeatサービスへの接続の累積数を示します | BEがサーバー側として動作するthrift serverの値です |  |
| `doris_be_thrift_current_connections` |  | Num | 現在のthrift接続数。たとえば、`{name="heartbeat"}`はheartbeatサービスへの現在の接続数を示します | 上記と同じです |  |
| `doris_be_thrift_opened_clients` |  | Num | 現在開いているthrift client数。たとえば、`{name="frontend"}`はFEサービスにアクセスするclient数を示します |  |  |
| `doris_be_thrift_used_clients` |  | Num | 現在使用中のthrift client数。たとえば、`{name="frontend"}`はFEサービスへのアクセスに現在使用されているclient数を示します |  |  |
| `doris_be_timeout_canceled_fragment_count` |  | Num | タイムアウトによってキャンセルされたfragment instanceの累積数 | この値は複数回記録される場合があります。たとえば、同じfragment instanceが複数回キャンセルされることがあります | P0 |
| `doris_be_stream_load_txn_request` | {type="begin"} | Num | 開始されたStream Loadトランザクションの累積数 | Stream LoadとRoutine Loadの両方のタスクを含みます |  |
| `doris_be_stream_load_txn_request` | {type="commit"} | Num | 正常にコミットされたStream Loadトランザクションの累積数 | 上記と同じです |  |
| `doris_be_stream_load_txn_request` | {type="rollback"} | Num | 失敗したStream Loadトランザクションの累積数 | 上記と同じです |  |
| `doris_be_unused_rowsets_count` |  | Num | 現在使用されなくなっているrowset数 | 通常、これらのrowsetは定期的に削除されます |  |
| `doris_be_upload_fail_count` |  | Num | 階層型ストレージ機能でrowsetのリモートストレージへのアップロードに失敗した累積回数 |  |  |
| `doris_be_upload_rowset_count` |  | Num | 階層型ストレージ機能でrowsetのリモートストレージへのアップロードに成功した累積回数 |  |  |
| `doris_be_upload_total_byte` |  | Bytes | 階層型ストレージ機能でリモートストレージへのアップロードに成功したrowsetの累積データ量 |  |  |
| `doris_be_load_bytes` |  | Bytes | tablet sink経由で送信された累積バイト数 | データロード量を確認します | P0 |
| `doris_be_load_rows` |  | Num | tablet sink経由で送信された累積行数 | データロード量を確認します | P0 |
| `fragment_thread_pool_queue_size` |  | Num | クエリ実行スレッドプールの待機キューの現在の長さ | ゼロより大きい場合、クエリスレッドが使い尽くされ、クエリが滞留しています | P0 |
| `doris_be_all_rowsets_num` |  | Num | 現在のすべてのrowsetの総数 |  | P0 |
| `doris_be_all_segments_num` |  | Num | 現在のすべてのsegmentの総数 |  | P0 |
| `doris_be_heavy_work_max_threads` |  | Num | brpcのheavyスレッドプールのスレッド数 |  | P0 |
| `doris_be_light_work_max_threads` |  | Num | brpcのlightスレッドプールのスレッド数 |  | P0 |
| `doris_be_heavy_work_pool_queue_size` |  | Num | brpcのheavyスレッドプールのキュー長の上限。超えると作業の投入がブロックされます |  | P0 |
| `doris_be_light_work_pool_queue_size` |  | Num | brpcのlightスレッドプールのキュー長の上限。超えると作業の投入がブロックされます |  | P0 |
| `doris_be_heavy_work_active_threads` |  | Num | brpcのheavyスレッドプール内のアクティブなスレッド数 |  | P0 |
| `doris_be_light_work_active_threads` |  | Num | brpcのlightスレッドプール内のアクティブなスレッド数 |  | P0 |
| `routine_load_get_msg_latency` |  | Milliseconds | Routine LoadがKafkaメッセージを取得する際のレイテンシ |  |  |
| `routine_load_get_msg_count` |  | Num | Routine LoadがKafkaメッセージを取得した回数 |  |  |
| `routine_load_consume_bytes` |  | Bytes | Routine LoadがKafkaから消費したデータ量 |  |  |
| `routine_load_consume_rows` |  | Num | Routine LoadがKafkaから消費した行数 |  |  |
| `doris_be_tablet_size_based_max_compaction_score` |  | Num | Size-based戦略の現在のCumulative Compaction Scoreの最大値 | Gauge。4.1.5で追加され、統合モードとコンピュートとストレージの分離モードに対応します |  |
| `doris_be_tablet_time_series_max_compaction_score` |  | Num | Time-series戦略の現在のCumulative Compaction Scoreの最大値 | Gauge。4.1.5で追加され、統合モードとコンピュートとストレージの分離モードに対応します |  |
| `doris_be_hdfs_file_open_reading` |  | Num | 実際に開いているHDFSファイルハンドルの現在数 | Gauge。バージョン4.1.5以降は、readerオブジェクトではなく共有ファイルハンドルを数えます |  |
| `doris_be_hdfs_file_reader_total` |  | Num | HDFSファイルハンドルを正常に開いた累積回数 | Counter。バージョン4.1.5以降は、ファイルを開かないreaderは値を増やさず、キャッシュされたハンドルを再利用しても再度カウントしません |  |

戦略ごとの2つのCompaction Scoreはいずれも最大値です。合算したり、Counterのレートを適用したりしないでください。全体のチェックが完了した後、対象となるtabletがない戦略の値はゼロにリセットされる場合があります。統合モードでディスク容量の制限により一部のディレクトリのチェックがスキップされた場合、それを理由に以前観測した値が引き下げられることはありません。

### マシン監視 {#machine-monitoring-1}

| 名前 | ラベル | 単位 | 意味 | 説明 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| `doris_be_cpu` |  | Num | CPU関連の監視メトリクス。`/proc/stat`から収集します。値は論理コアごとに収集されます。たとえば、`{device="cpu0",mode="nice"}`はcpu0のnice値を示します | これを使ってCPU使用率を計算できます | P0 |
| `doris_be_disk_bytes_read` |  | Bytes | ディスクから読み取った累積データ量。`/proc/diskstats`から収集します。値はディスクごとに収集されます。たとえば、`{device="vdd"}`はvddディスクの値を示します |  |  |
| `doris_be_disk_bytes_written` |  | Bytes | ディスクに書き込んだ累積データ量。上記と同じ方法で収集します |  |  |
| `doris_be_disk_io_time_ms` |  | Milliseconds | 上記と同じ方法で収集します | これを使ってIO Utilを計算できます | P0 |
| `doris_be_disk_io_time_weighted` |  | Milliseconds | 上記と同じ方法で収集します |  |  |
| `doris_be_disk_reads_completed` |  | Num | 上記と同じ方法で収集します |  |  |
| `doris_be_disk_read_time_ms` |  | Milliseconds | 上記と同じ方法で収集します |  |  |
| `doris_be_disk_writes_completed` |  | Num | 上記と同じ方法で収集します |  |  |
| `doris_be_disk_write_time_ms` |  | Milliseconds | 上記と同じ方法で収集します |  |  |
| `doris_be_fd_num_limit` |  | Num | システムのファイルハンドル数の上限。`/proc/sys/fs/file-nr`から収集します |  |  |
| `doris_be_fd_num_used` |  | Num | システムが使用中のファイルハンドル数。`/proc/sys/fs/file-nr`から収集します |  |  |
| `doris_be_file_created_total` |  | Num | ローカルファイルの作成累積数 | `local_file_writer`を呼び出し、最終的にクローズされたすべてのファイルを数えます |  |
| `doris_be_load_average` |  | Num | マシンのLoad Avgを監視するメトリクス。たとえば、{mode="15_minutes"}は15分間のLoad Avgを示します | マシン全体の負荷を確認します | P0 |
| `doris_be_max_disk_io_util_percent` |  | Percentage | すべてのディスクについて計算されたIO UTILの最大値 |  | P0 |
| `doris_be_max_network_receive_bytes_rate` |  | Bytes/Sec | すべてのネットワークインターフェースについて計算された最大受信速度 |  | P0 |
| `doris_be_max_network_send_bytes_rate` |  | Bytes/Sec | すべてのネットワークインターフェースについて計算された最大送信速度 |  | P0 |
| `doris_be_memory_pgpgin` |  | Bytes | システムがディスクからメモリページに書き込んだデータ量 |  |  |
| `doris_be_memory_pgpgout` |  | Bytes | システムがメモリページからディスクに書き込んだデータ量 |  |  |
| `doris_be_memory_pswpin` |  | Bytes | システムがディスクからメモリにスワップインしたデータ量 | 通常はswapを無効にするため、この値は0であるべきです |  |
| `doris_be_memory_pswpout` |  | Bytes | システムがメモリからディスクにスワップアウトしたデータ量 | 通常はswapを無効にするため、この値は0であるべきです |  |
| `doris_be_network_receive_bytes` |  | Bytes | 各ネットワークインターフェースの累積受信バイト数。`/proc/net/dev`から収集します |  |  |
| `doris_be_network_receive_packets` |  | Num | 各ネットワークインターフェースの累積受信パケット数。`/proc/net/dev`から収集します |  |  |
| `doris_be_network_send_bytes` |  | Bytes | 各ネットワークインターフェースの累積送信バイト数。`/proc/net/dev`から収集します |  |  |
| `doris_be_network_send_packets` |  | Num | 各ネットワークインターフェースの累積送信パケット数。`/proc/net/dev`から収集します |  |  |
| `doris_be_proc` | `{mode="ctxt_switch"}` | Num | CPUコンテキストスイッチの累積回数。`/proc/stat`から収集します | 異常なコンテキストスイッチが発生していないか確認します | P0 |
| `doris_be_proc` | `{mode="interrupt"}` | Num | CPU割り込みの累積回数。`/proc/stat`から収集します |  |  |
| `doris_be_proc` | `{mode="procs_blocked"}` | Num | システム内で現在ブロックされているプロセス数（たとえばIO待ち）。`/proc/stat`から収集します |  |  |
| `doris_be_proc` | `{mode="procs_running"}` | Num | システム内で現在実行中のプロセス数。`/proc/stat`から収集します |  |  |
| `doris_be_snmp_tcp_in_errs` |  | Num | tcpパケットの受信エラー数。`/proc/net/snmp`から収集します | 再送やパケット損失などのネットワークエラーを確認します。他のsnmpメトリクスと併せて使用します | P0 |
| `doris_be_snmp_tcp_in_segs` |  | Num | 受信したtcpパケット数。`/proc/net/snmp`から収集します |  |  |
| `doris_be_snmp_tcp_out_segs` |  | Num | 送信したtcpパケット数。`/proc/net/snmp`から収集します |  |  |
| `doris_be_snmp_tcp_retrans_segs` |  | Num | tcpパケットの再送数。`/proc/net/snmp`から収集します |  |  |

## bvar診断メトリクス {#bvar-diagnostic-metrics}

以下のメトリクスはバージョン4.1.5以降でサポートされ、前述のbrpcポートを使用します。Counterはプロセス起動時から累積し、Gaugeは現在値を示します。

| 名前またはプレフィックス | プロセス | 型 | 意味 |
| --- | --- | --- | --- |
| `sync_tablets_meta_num` | コンピュートとストレージの分離モードのBE | Counter | バックグラウンドでtabletメタデータの同期を試みた累積回数。呼び出し前にカウントされるため、成功した呼び出し数を表すものではありません |
| `sync_tablets_rowsets_num` | コンピュートとストレージの分離モードのBE | Counter | バックグラウンドでtabletのrowsetの同期を試みた累積回数。呼び出し前にカウントされるため、成功した呼び出し数を表すものではありません |
| `vertical_compaction_active_segment_contexts` | BE | Gauge | vertical Compactionが保持する、現在アクティブなSegment context数 |
| `hdfs_get_path_info` | BE | レイテンシ統計、マイクロ秒 | HDFSファイルのメタデータアクセスを診断するための`hdfsGetPathInfo`レイテンシメトリクスのプレフィックス |
| `ms_repair_tablet_index` | Meta Service | Counter | トランザクションのコミット時に、不足していた`db_id`を追加するために修復された過去のTablet Indexレコードの累積数。コミットが成功した後にのみカウントされます |
| `file_cache_ttl_mgr_ttl_info_map_size`（キャッシュパスのプレフィックス付き） | BE | Gauge | キャッシュブロック数ではなく、メモリ内で追跡されているtablet TTL情報エントリの現在数 |

キャッシュパスのプレフィックスと退避に関するメトリクスについては、[File Cacheの監視](../../compute-storage-decoupled/file-cache/file-cache.md#cache-space-and-hit-rate-metrics)を参照してください。vertical Compactionの終了時には、BEのINFOログフィールド`vertical_compaction_active_segment_contexts_peak`に、そのタスクのcontext数のピーク値が記録されます。これはログフィールドであり、別のプロセスレベルのGaugeではありません。

## FAQ {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Monitoring metric integration and interpretation -->

### Q: 監視エンドポイントが404を返します。どうすればよいですか？ {#q-the-monitoring-endpoint-returns-404-what-should-i-do}

FEの`http_port`またはBEの`webserver_port`にアクセスしていることを確認し、`fe.conf` / `be.conf`で実際のポート番号を確認してください。

### Q: Counterメトリクスは増えるだけで減りません。正常ですか？ {#q-counter-metrics-only-increase-and-never-decrease-is-this-normal}

正常です。Counterは累積値を表します。瞬間的なレートを得るには、一定間隔でサンプリングして傾きを計算する必要があります（たとえばPromQLの`rate()`を使用します）。

### Q: 複数のFE間で`doris_fe_max_journal_id`の差が大きすぎます。どうすればよいですか？ {#q-the-gap-of-doris_fe_max_journal_id-between-multiple-fes-is-too-large-what-should-i-do}

メタデータの同期遅延を示しています。Master FEに対するFollower / Observer FEのネットワーク接続とリプレイ速度を確認してください。

### Q: Compaction Scoreが高いままです。どう調査すればよいですか？ {#q-compaction-score-remains-too-high-how-do-i-troubleshoot}

`doris_be_tablet_base_max_compaction_score`と`doris_be_tablet_cumulative_max_compaction_score`を重点的に確認し、ディスクIOとCompactionタスク数を併せてボトルネックを特定してください。

### Q: クエリやデータロードが滞留しています。どう調査すればよいですか？ {#q-queries-or-loads-are-accumulating-how-do-i-troubleshoot}

`fragment_thread_pool_queue_size`、`doris_be_scanner_thread_pool_queue_size`、`doris_be_send_batch_thread_pool_queue_size`など、スレッドプールのキュー滞留メトリクスを確認してください。
