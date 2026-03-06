---
{
  "title": "メトリクスの監視",
  "language": "ja",
  "description": "Doris FEプロセスとBEプロセスは完全な監視メトリクスを提供します。監視メトリクスは2つのカテゴリに分けることができます："
}
---
# Monitor Metrics

Doris FEプロセスとBEプロセスは完全な監視メトリクスを提供します。監視メトリクスは2つのカテゴリに分けることができます：

1. **プロセス監視**: 主にDorisプロセス自体の監視値を表示します。
2. **ノード監視**: 主にDorisプロセスが配置されているノードマシン自体の監視を表示します。CPU、メモリ、IO、ネットワークなど。

FEまたはBEノードのhttpポートにアクセスすることで、現在の監視を取得できます。例：

```
curl http://fe_host:http_port/metrics
curl http://be_host:webserver_port/metrics
```
モニタリングメトリクスはPrometheus互換フォーマットで生成されます。例：

```
doris_fe_cache_added{type="partition"} 0
doris_fe_cache_added{type="sql"} 0
doris_fe_cache_hit{type="partition"} 0
doris_fe_cache_hit{type="sql"} 0
doris_fe_connection_total 2
```
`type`パラメータをrest interfaceで使用することで、Json形式のモニタリングメトリクスを取得できます。例：

```
curl http://fe_host:http_port/metrics?type=json
curl http://be_host:webserver_port/metrics?type=json
```
## 監視レベルとベストプラクティス

**表の最後の列は監視項目の重要度レベルを示しています。P0は最も重要であることを意味し、値が大きいほど重要度は低くなります。**

監視メトリックタイプの大部分はCounterです。つまり累積値です。間隔を置いて（15秒ごとなど）監視値を収集し、単位時間あたりの傾きを計算することで有効な情報を取得できます。

クエリエラー率は`doris_fe_query_err`の傾きを計算することで取得でき、（1秒あたりのエラー）として表示されます。


## FE監視メトリック

### プロセス監視

| **name**                             | **Label**                              | **unit**    | **Description**                                              | **Implication**                                              | **Grade** |
| ------------------------------------ | -------------------------------------- | ----------- | ------------------------------------------------------------ | ------------------------------------------------------------ | --------- |
| doris_fe_cache_added                 | {type="partition"}                     | Num         | 新しいPartition Cacheの数の累積値        |                                                              |           |
|                                      | {type=" sql "}                         | Num         | 新しいSQL Cacheの数の累積値              |                                                              |           |
| doris_fe_cache_hit                   | {type="partition"}                     | Num         | パーティションキャッシュのヒット数                                |                                                              |           |
|                                      | {type=" sql "}                         | Num         | SQL Cacheヒット数                                      |                                                              |           |
| doris_fe_connection_total            |                                        | Num         | FE MySQLポート接続の現在数                  | クエリ接続数の監視に使用されます。接続数が制限を超えると、新しい接続はアクセスできません。 | P0        |
| doris_fe_counter_hit_sql_block_rule  |                                        | Num         | SQL BLOCK RULEによってブロックされたクエリ数                  |                                                              |           |
| doris_fe_edit_log_clean              | {type="failed"}                        | Num         | 履歴メタデータログのクリアに失敗した回数                            | 失敗すべきではありません。失敗した場合は手動介入が必要です。 | P0        |
|                                      | {type="success"}                       | Num         | 履歴メタデータログが正常にクリアされた回数 |                                                              |           |
| doris_fe_edit_log                    | {type="  accumulated_bytes "}          | byte        | メタデータログ書き込み量の値                           | 傾きを計算することで書き込み率を取得し、メタデータ書き込みに遅延があるかを観察できます。 | P0        |
|                                      | {type=" current_bytes  "}              | byte        | メタデータログ現在値                                   | editlogサイズの監視に使用されます。サイズが制限を超えた場合、手動介入が必要です | P0        |
|                                      | {type="read"}                          | Num         | メタデータログ読み取り回数                                  | 傾きを通じてメタデータ読み取り頻度が正常かを観察します | P0        |
|                                      | {type="write"}                         | Num         | メタデータログ書き込み回数                                 | 傾きを通じてメタデータ書き込み頻度が正常かを観察します | P0        |
|                                      | {type="current"}                       | Num         | メタデータログの現在数                              | editlog数量の監視に使用されます。数量が制限を超えた場合、手動介入が必要です | P0        |
| doris_fe_editlog_write_latency_ms    |                                        | millisecond | メタデータログ書き込み遅延。例えば、{quantile="0.75"}は75パーセンタイル書き込み遅延を示します。 |                                                              |           |
| doris_fe_image_clean                 | {type="failed"}                        | Num         | 履歴メタデータイメージファイルのクリア失敗回数                    | 失敗すべきではありません。失敗した場合は手動介入が必要です。 | P0        |
|                                      | {type="success"}                       | Num         | 履歴メタデータイメージファイルの正常なクリア回数 |                                                              |           |
| doris_fe_image_push                  | {type="failed"}                        | Num         | 他のFEノードへのメタデータイメージファイルプッシュ失敗回数 |                                                              |           |
|                                      | {type="success"}                       | Num         | 他のFEノードへのメタデータイメージファイル正常プッシュ回数                       |                                                              |           |
| doris_fe_image_write                 | {type="failed"}                        | Num         | メタデータイメージファイル生成失敗回数         | 失敗すべきではありません。失敗した場合は手動介入が必要です。 | P0        |
|                                      | {type="success"}                       | Num         | メタデータイメージファイルが正常に生成された回数          |                                                              |           |
| doris_fe_job                         |                                        | Num         | 異なるジョブタイプと異なるジョブステータスの現在数。例えば、{job="load", type="INSERT", state="LOADING"}は、INSERTタイプのインポートジョブでLOADING状態のジョブ数を表します。 | 必要に応じてクラスター内の異なるタイプのジョブ数を観察します | P0        |
| doris_fe_max_journal_id              |                                        | Num         | 現在のFEノードの最大メタデータログID。Master FEの場合は現在書き込まれている最大ID、非Master FEの場合は現在再生されているメタデータログの最大IDを表します | 複数のFE間のIDギャップが大きすぎないかの観察に使用されます。大きすぎる場合はメタデータ同期に問題があることを示します。 | P0        |
| doris_fe_max_tablet_compaction_score |                                        | Num         | 全BEノード間で最大のcompactionスコア値。     | この値は現在のクラスターの最大compactionスコアを観察して高すぎるかどうかを判断するのに使用できます。高すぎる場合、クエリや書き込みの遅延が発生する可能性があります。 | P0        |
| doris_fe_qps                         |                                        | Num/Sec     | FEの現在の1秒あたりクエリ数（クエリリクエストのみカウント） | QPS                                                          | P0        |
| doris_fe_query_err                   |                                        | Num         | エラークエリの値                                         |                                                              |           |
| doris_fe_query_err_rate              |                                        | Num/Sec     | 1秒あたりのエラークエリ数                                     | クラスターでクエリエラーが発生しているかを観察            | P0        |
| doris_fe_query_latency_ms            |                                        | millisecond | クエリリクエスト遅延のパーセンタイル統計。例えば、{quantile="0.75"}は75パーセンタイルのクエリ遅延を示します | 各分位数のクエリ遅延の詳細な観察       | P0        |
| doris_fe_query_latency_ms_db         |                                        | millisecond | 各DBのクエリリクエスト遅延のパーセンタイル統計。例えば、{quantile="0.75", db="test"}はDB testの75パーセンタイルのクエリ遅延を示します | 各DBのクエリ遅延の詳細な観察               | P0        |
| doris_fe_query_olap_table            |                                        | Num         | 内部テーブル（OlapTable）のリクエスト数の統計 |                                                              |           |
| doris_fe_query_total                 |                                        | Num         | 全クエリリクエスト                                           |                                                              |           |
| doris_fe_report_queue_size           |                                        | Num         | FE側でのBEの各種定期報告タスクのキューの長さ | この値はMaster FEノードでの報告タスクのブロック度を反映します。値が大きいほどFEの処理能力が低くなります。 | P0        |
| doris_fe_request_total               |                                        | Num         | MySQLポート経由で受信した全操作リクエスト（クエリや他のステートメントを含む） |                                                              |           |
| doris_fe_routine_load_error_rows     |                                        | Num         | クラスター内の全Routine Loadジョブのエラー行数の合計をカウント |                                                              |           |
| doris_fe_routine_load_receive_bytes  |                                        | byte        | クラスター内の全Routine Loadジョブが受信したデータ量 |                                                              |           |
| doris_fe_routine_load_rows           |                                        | Num         | クラスター内の全Routine Loadジョブが受信したデータ行数をカウント |                                                              |           |
| doris_fe_routine_load_get_meta_latency |                                      | millisecond | クラスター全体の全Routine Loadジョブのメタデータ取得の総遅延 |                                                              |           |
| doris_fe_routine_load_get_meta_count   |                                      | Num       | クラスター全体の全Routine Loadジョブのメタデータ取得操作の総数 |                                                                |           |
| doris_fe_routine_load_get_meta_fail_count |                                      | Num       | クラスター全体の全Routine Loadジョブのメタデータ取得失敗操作の総数 |  |
| doris_fe_routine_load_task_execute_time |                                      | millisecond | クラスター全体の全Routine Loadタスクの総実行時間 |                                                                |           |
| doris_fe_routine_load_task_execute_count |                                      | Num       | クラスター全体の実行されたRoutine Loadタスクの総数 |                                                                |           |
| doris_fe_routine_load_lag |                                      | millisecond | クラスター全体の全Routine Loadジョブの総消費遅延 |                                                                |           |
| doris_fe_routine_load_progress |                                      | millisecond | クラスター全体の全Routine Loadジョブの総消費進捗 |                                                                |           |
| doris_fe_routine_load_abort_task_num |                                      | Num       | クラスター全体の失敗したRoutine Loadタスクの総数 |                                                                |           |
| doris_fe_rps                         |                                        | Num         | FEの現在の1秒あたりリクエスト数（クエリや他のタイプのステートメントを含む） | QPSと合わせてクラスターが処理するリクエスト量を表示します。 | P0        |
| doris_fe_scheduled_tablet_num        |                                        | Num         | Master FEノードによってスケジュールされているtablet。修復中のレプリカとバランシング中のレプリカを含みます | 移行中のtablet。長期間値がある場合、クラスターが不安定であることを意味します。 | P0        |
| doris_fe_tablet_max_compaction_score |                                        | Num         | 各BEノードから報告されたcompactionスコア。例えば、{backend="172.21.0.1:9556"}はBE "172.21.0.1:9556"の報告値を表します |                                                              |           |
| doris_fe_tablet_num                  |                                        | Num         | 各BEノードの現在の総tablet数。例えば、{backend="172.21.0.1:9556"}はBE "172.21.0.1:9556"の現在のtablet数を示します | tablet分布が均一か、絶対値が妥当かをチェックできます | P0        |
| doris_fe_tablet_status_count         |                                        | Num         | Master FEノードのtabletスケジューラによってスケジュールされたtablet数の累積値を統計 |                                                              |           |
|                                      | {type="added"}                         | Num         | Master FEノードのtabletスケジューラによってスケジュールされたtablet数の累積値を統計。"added"はスケジュールされたtablet数を示します |                                                              |           |
|                                      | {type=" in_sched  "}                   | Num         | 上記と同じ。繰り返しスケジュールされたtablet数を示します | この値が急速に増加する場合、tabletが長期間不健全な状態にあり、スケジューラによって繰り返しスケジュールされていることを意味します。 |           |
|                                      | {type=" not_ready  "}                  | Num         | 上記と同じ。まだスケジューリング起動条件を満たしていないtablet数を示します。 | この値が急速に増加する場合、多数のtabletが不健全な状態にあるがスケジュールできないことを意味します。 |           |
|                                      | {type="total"}                         | Num         | 上記と同じ。チェックされた（ただし必ずしもスケジュールされていない）tabletの累積数を表します。 |                                                              |           |
|                                      | {type="unhealthy"}                     | Num         | 上記と同じ。チェックされた不健全なtabletの累積数を示します。 |                                                              |           |
| doris_fe_thread_pool                 |                                        | Num         | 各種スレッドプールの作業スレッド数とキューイング状況をカウント。"active_thread_num"は実行中のタスク数を示します。"pool_size"はスレッドプール内の総スレッド数を示します。"task_in_queue"はキューイング中のタスク数を示します |                                                              |           |
|                                      | {name="agent-task-pool"}               | Num         | Master FEがAgent TaskをBEに送信するために使用するスレッドプール    |                                                              |           |
|                                      | {name="connect-scheduler-check-timer"} | Num         | MySQLアイドル接続がタイムアウトしたかをチェックするプール     |                                                              |           |
|                                      | {name="connect-scheduler-pool"}        | Num         | MySQL接続リクエストを受信するプール                 |                                                              |           |
|                                      | {name=" mysql - nio  -pool"}           | Num         | タスクを処理するNIO MySQL Serverスレッドプール            |                                                              |           |
|                                      | {name="export-exporting-job-pool"}     | Num         | exporting状態のエクスポートジョブ用プール                      |                                                              |           |
|                                      | {name="export-pending-job-pool"}       | Num         | pending状態のエクスポートジョブ用プール                        |                                                              |           |
|                                      | {name="heartbeat- mgr  -pool"}         | Num         | Master FEが各ノードのハートビートを処理するために使用するスレッドプール |                                                              |           |
|                                      | {name="loading-load-task-scheduler"}   | Num         | Master FEがBroker Load job、loading Taskスケジューリングに使用するスレッドプール |                                                              |           |
|                                      | {name="pending-load-task-scheduler"}   | Num         | Master FEがBroker Load job、pending Taskスケジューリングに使用するスレッドプール |                                                              |           |
|                                      | {name="schema-change-pool"}            | Num         | Master FEがスキーマ変更ジョブのスケジューリングに使用するプール       |                                                              |           |
|                                      | {name="thrift-server-pool"}            | Num         | FE側のThriftServerのワーカースレッドプール。fe.confのrpc_portに対応。BEとの相互作用に使用されます。 |                                                              |           |
| doris_fe_txn_counter                 |                                        | Num         | 各ステータスのインポートトランザクション数の値 | インポートトランザクションの実行を観察できます。    | P0        |
|                                      | {type="begin"}                         | Num         | コミットされたトランザクション数                             |                                                              |           |
|                                      | {type="failed"}                        | Num         | 失敗したトランザクション数                                |                                                              |           |
|                                      | {type="reject"}                        | Num         | 拒否されたトランザクション。（現在実行中のトランザクション数が閾値より大きい場合、新しいトランザクションは拒否されます） |                                                              |           |
|                                      | {type=" succes  "}                     | Num         | 成功したトランザクション数                            |                                                              |           |
| doris_fe_txn_status                  |                                        | Num         | 現在様々な状態にあるインポートトランザクション数をカウント。例えば、{type="committed"}はcommitted状態のトランザクション数を示します。 | 各状態のインポートトランザクション数を観察して蓄積があるかどうかを判断できます。 | P0        |
| doris_fe_query_instance_num          |                                        | Num         | ユーザーが現在リクエストしているfragmentのインスタンス数。例えば、{user="test_u"}はユーザーtest_uが現在リクエストしているインスタンス数を表します | この値は指定されたユーザーがクエリリソースを使いすぎているかを観察するのに使用できます。 | P0        |
| doris_fe_query_instance_begin        |                                        | Num         | ユーザーリクエストが開始するfragmentのインスタンス数。例えば、{user="test_u"}はユーザーtest_uが開始をリクエストするインスタンス数を表します | この値は特定のユーザーが過剰なクエリを送信したかを観察するのに使用できます。 | P0        |
| doris_fe_query_rpc_total             |                                        | Num         | 指定されたBEに送信されたRPCの数。例えば、{be="192.168.10.1"}はIPアドレス192.168.10.1のBEに送信されたRPC数を示します | この値は特定のBEに過剰なRPCが送信されたかを観察するのに使用できます。 |           |
| doris_fe_query_rpc_failed            |                                        | Num         | 指定されたBEに送信されたRPC失敗数。例えば、{be="192.168.10.1"}はIPアドレス192.168.10.1のBEに送信されたRPC失敗数を示します | この値は特定のBEにRPCの問題があるかを観察するのに使用できます。 |           |
| doris_fe_query_rpc_size              |                                        | Num         | 指定されたBEのRPCデータサイズ。例えば、{be="192.168.10.1"}はIPアドレス192.168.10.1のBEに送信されたRPCデータバイト数を示します | この値はBEに過度に大きなRPCが送信されたかを観察するのに使用できます。 |           |
| doris_fe_txn_exec_latency_ms         |                                        | millisecond | トランザクション実行時間のパーセンタイル統計。例えば、{quantile="0.75"}は75パーセンタイルのトランザクション実行時間を示します | 各分位数トランザクションの実行時間の詳細な観察 | P0        |
| doris_fe_txn_publish_latency_ms      |                                        | millisecond | トランザクションpublish時間のパーセンタイル統計。例えば、{quantile="0.75"}は75パーセンタイルのトランザクションpublish時間を示します | 各分位数トランザクションのpublish時間の詳細な観察          | P0        |
| doris_fe_txn_num                     |                                        | Num         | 指定されたDBによって実行されているトランザクション数。例えば、{db="test"}はDB testが現在実行しているトランザクション数を示します。 | この値は特定のDBが大量のトランザクションを送信したかを観察するのに使用できます。 | P0        |
| doris_fe_publish_txn_num             |                                        | Num         | 指定されたDBによって公開されているトランザクション数。例えば、{db="test"}はDB testが現在公開しているトランザクション数を示します。 | この値は特定のDBのpublishトランザクション数を観察するのに使用できます。 | P0        |
| doris_fe_txn_replica_num             |                                        | Num         | 指定されたDBによって実行されているトランザクションが開いたレプリカ数。例えば、{db="test"}はDB testが現在実行しているトランザクションが開いたコピー数を示します。 | この値は特定のDBが過剰なコピーを開いているかを観察するのに使用でき、他のトランザクションの実行に影響する可能性があります。 | P0        |
| doris_fe_thrift_rpc_total            |                                        | Num         | FE thriftインターフェイスの各メソッドが受信したRPCリクエスト。例えば、{method="report"}はreportメソッドが受信したRPCリクエスト数を示します。 | この値は特定のthrift rpcメソッドの負荷を観察できます   |           |
| doris_fe_thrift_rpc_latency_ms       |                                        | millisecond | FE thriftインターフェイスの各メソッドが受信したRPCリクエストの所要時間。例えば、{method="report"}はreportメソッドが受信したRPCリクエストの所要時間を示します。 | この値は特定のthrift rpcメソッドの負荷を観察できます   |           |
| doris_fe_external_schema_cache       | { catalog  ="hive"}                    | Num         | 指定されたExternal Catalogの対応するスキーマキャッシュ数 |                                                              |           |
| doris_fe_hive_meta_cache             | { catalog  ="hive"}                    | Num         |                                                              |                                                              |           |
|                                      | {type=" partition_value  "}            | Num         | 指定されたExternal Hive Metastore Catalogの対応するpartition valueキャッシュ数 |                                                              |           |
|                                      | {type="partition"}                     | Num         | 指定されたExternal Hive Metastore Catalogの対応するpartitionキャッシュ数 |                                                              |           |
|                                      | {type="file"}                          | Num         | 指定されたExternal Hive Metastore Catalogの対応するfileキャッシュ数 |                                                              |           |

### **JVM** **メトリック**

| **name**                | **Label**      | **unit**    | **Description**                                                                                                                          | **Impact**                                              | **Grade** |
| ----------------------- | -------------- | ----------- |------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------| --------- |
| `jvm_heap_size_bytes`     |                | byte        | JVMメモリメトリック。タグにはmax、used、committedが含まれ、それぞれ最大値、使用済み、要求済みメモリに対応します。 | JVMメモリ使用量を観察                                | P0        |
| `jvm_non_heap_size_bytes` |                | byte        | JVMオフヒープメモリ統計                                                                                                           |                                                         |           |
| `<GarbageCollector>`    |                |             | GCメトリック。                                                                                                                             | GarbageCollectorは特定のガベージコレクターを指します | P0        |
|                         | {type="count"} | Num         | GC回数の累積値                                                                                                             |                                                         |           |
|                         | {type="time"}  | millisecond | GC時間消費の累積値                                                                                                  |                                                         |           |
| `jvm_old_size_bytes`      |                | byte        | JVMオールド世代メモリ統計                                                                                                     |                                                         | P0        |
| `jvm_thread`              |                | Num         | JVMスレッド数統計                                                                                                              | JVMスレッド数が妥当かを観察 | P0        |
| `jvm_young_size_bytes`    |                | byte        | JVMヤング世代メモリ統計                                                                                                     |                                                         | P0        |

**マシン** **メトリック**

| **name**       | **Label**                    | **unit**                                            | **Description**                                                 | **Impact** | **Grade** |
| -------------- | ---------------------------- | --------------------------------------------------- | ------------------------------------------------------------ | -------------- | --------- |
| system_meminfo |                              | byte                                                | FEノードマシン。/proc/meminfoから収集。buffers、cached、memory_available、memory_free、memory_totalを含みます |                |           |
| system_snmp    |                              | FEノードマシン。/proc/net/snmpから収集。 |                                                              |                |           |
|                | {name=" tcp_in_errs  "}      | Num                                                 | tcpパケット受信エラー                                  |                |           |
|                | {name=" tcp_in_segs  "}      | Num                                                 | 送信されたtcpパケット                                             |                |           |
|                | {name=" tcp_out_segs  "}     | Num                                                 | 送信されたtcpパケット                                             |                |           |
|                | {name=" tcp_retrans_segs  "} | Num                                                 | tcpパケット再送信数                         |                |           |

**BE** **メトリック**

**プロセスメトリック**

| **name**                                        | **Label**                                       | **unit**       | **Description**                                                 | **Impact**                                               | **grade** |
| ----------------------------------------------- | ----------------------------------------------- | -------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | --------- |
| doris_be_active_scan_context_count              |                                                 | Num            | 現在外部から直接開かれているスキャナー数 |                                                              |           |
| doris_be_add_batch_task_queue_size              |                                                 | Num            | インポートを記録する際、バッチを受信するスレッドプールのキューサイズ | 0より大きい場合、インポートタスクの受信側でバックログがあることを意味します。 | P0        |
| agent_task_queue_size                           |                                                 | Num            | 各Agent Task処理キューの長さを表示。例えば{type="CREATE_TABLE"}はCREATE_TABLEタスクキューの長さを示します |                                                              |           |
| doris_be_brpc_endpoint_stub_count               |                                                 | Num            | 作成されたBE間相互作用に使用されるbrpc stubの数 |                                                              |           |
| doris_be_brpc_function_endpoint_stub_count      |                                                 | Num            | 作成されたRemote RPCとの相互作用に使用されるbrpc
