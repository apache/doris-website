---
{
  "title": "FE設定 | Config",
  "language": "ja",
  "toc_min_heading_level": 2,
  "toc_max_heading_level": 4,
  "description": "このドキュメントは主にFEの関連設定項目について紹介します。",
  "sidebar_label": "FE 設定"
}
---
# FE 設定

このドキュメントは主にFEの関連する設定項目を紹介します。

FE設定ファイル`fe.conf`は通常、FEデプロイメントパスの`conf/`ディレクトリに保存されます。バージョン0.14では、別の設定ファイル`fe_custom.conf`が導入されます。この設定ファイルは、運用中にユーザーが動的に設定し、永続化された設定項目を記録するために使用されます。

FEプロセスが開始されると、最初に`fe.conf`の設定項目を読み取り、次に`fe_custom.conf`の設定項目を読み取ります。`fe_custom.conf`の設定項目は`fe.conf`の同じ設定項目を上書きします。

`fe_custom.conf`ファイルの場所は、`custom_config_dir`設定項目を通じて`fe.conf`で設定できます。

## 設定項目の表示

FEの設定項目を表示する方法は2つあります：

1. FE webページ

    ブラウザでFE webページ`http://fe_host:fe_http_port/variable`を開きます。`Configure Info`で現在有効なFE設定項目を確認できます。

2. コマンドによる表示

    FEが開始された後、以下のコマンドでMySQLクライアントでFEの設定項目を表示できます。具体的な言語法は[SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG)を参照してください：

    `SHOW FRONTEND CONFIG;`

    結果の列の意味は以下の通りです：

    * Key: 設定項目の名前。
    * Value: 現在の設定項目の値。
    * タイプ: 設定項目の値の型（整数や文字列など）。
    * IsMutable: 動的に設定可能かどうか。trueの場合、設定項目は実行時に動的に設定できます。falseの場合、設定項目は`fe.conf`でのみ設定でき、FEの再起動後に有効になります。
    * MasterOnly: Master FEノードの固有の設定項目かどうか。trueの場合、設定項目はMaster FEノードでのみ意味があり、他のタイプのFEノードでは意味がありません。falseの場合、設定項目はすべてのタイプのFEノードで意味があります。
    * コメント: 設定項目の説明。

## 設定項目の設定

FE設定項目を設定する方法は2つあります：

1. 静的設定

    `conf/fe.conf`ファイルで設定項目を追加・設定します。`fe.conf`の設定項目はFEプロセス開始時に読み取られます。`fe.conf`にない設定項目はデフォルト値を使用します。

2. MySQLプロトコル経由での動的設定

    FEの開始後、以下のコマンドで設定項目を動的に設定できます。このコマンドには管理者権限が必要です。

    `ADMIN SET FRONTEND CONFIG (" fe_config_name "=" fe_config_value ");`

    すべての設定項目が動的設定をサポートしているわけではありません。`SHOW FRONTEND CONFIG;`コマンド結果の`IsMutable`列で動的設定がサポートされているかどうかを確認できます。

    `MasterOnly`の設定項目が変更された場合、コマンドは直接Master FEに転送され、Master FE内の対応する設定項目のみが変更されます。

    **この方法で変更された設定項目は、FEプロセスの再起動後に無効になります。**

    このコマンドの詳細なヘルプは、`HELP ADMIN SET CONFIG;`コマンドで確認できます。

3. HTTPプロトコル経由での動的設定

    詳細については、[Set Config Action](../open-api/fe-http/set-config-action)を参照してください

    この方法では、変更された設定項目を永続化することもできます。設定項目は`fe_custom.conf`ファイルに永続化され、FEの再起動後も有効です。

## 例

1. `async_pending_load_task_pool_size`の変更

    `SHOW FRONTEND CONFIG;`で、この設定項目は動的設定できない（`IsMutable`がfalse）ことがわかります。`fe.conf`に以下を追加する必要があります：

    `async_pending_load_task_pool_size = 20`

    その後、FEプロセスを再起動して設定を有効にします。

2. `dynamic_partition_enable`の変更

    `SHOW FRONTEND CONFIG;`で、この設定項目は動的設定可能（`IsMutable`がtrue）であることがわかります。また、これはMaster FEの固有設定です。まず、任意のFEに接続して以下のコマンドを実行し、設定を変更できます：

    ```
    ADMIN SET FRONTEND CONFIG ("dynamic_partition_enable" = "true"); `
    ```
その後、以下のコマンドで変更された値を確認できます：

    ```
    set forward_to_master = true;
    SHOW FRONTEND CONFIG;
    ```
上記の方法で修正した後、Master FEが再起動されたり、Master選出が実行されたりすると、設定が無効になります。`fe.conf`に設定項目を直接追加してFEを再起動することで、設定項目を永続化できます。

3. `max_distribution_pruner_recursion_depth`の修正

    `SHOW FRONTEND CONFIG;`を通じて、この設定項目が動的に設定可能であることを確認できます（`IsMutable`がtrue）。これはMaster FE固有のものではありません。

    同様に、設定を動的に修正するコマンドで設定を変更できます。この設定はMaster FE固有ではないため、ユーザーは異なるFEに個別に接続して設定を動的に修正し、すべてのFEが修正された設定値を使用するようにする必要があります。

## 設定

### メタデータとクラスター

#### `meta_dir`

デフォルト：DORIS_HOME_DIR + "/doris-meta"

タイプ: string 説明: Dorisメタデータがここに保存されます。このディレクトリのストレージには以下が強く推奨されます：

* 高い書き込みパフォーマンス（SSD）
* 安全性（RAID）

#### `catalog_try_lock_timeout_ms`

デフォルト：5000（ms）

IsMutable：true

カタログロックのtryLockタイムアウト設定。通常は変更する必要はありませんが、何かをテストする必要がある場合を除きます。

#### `enable_bdbje_debug_mode`

デフォルト：false

trueに設定すると、FEはBDBJEデバッグモードで起動されます

#### `max_bdbje_clock_delta_ms`

デフォルト：5000（5秒）

非master FEとMaster FEホスト間で許容される最大クロックスキューを設定します。この値は、非master FEがBDBJE経由でmaster FEへの接続を確立する際に毎回チェックされます。クロックスキューがこの値より大きい場合、接続は破棄されます。

#### `metadata_failure_recovery`

デフォルト：false

trueの場合、FEはbdbje replicationグループをリセット（つまり、すべての選出可能なノード情報を削除）し、Masterとして起動することが想定されます。すべての選出可能なノードが起動できない場合、メタデータを別のノードにコピーし、この設定をtrueに設定してFEの再起動を試行できます。

#### `txn_rollback_limit`

デフォルト：100

グループへの再参加を試行する際にbdbjeがロールバックできる最大txn数

#### `grpc_threadmgr_threads_nums`

デフォルト: 4096

grpc_threadmgrでgrpcイベントを処理するスレッド数。

#### `bdbje_replica_ack_timeout_second`

デフォルト：10（秒）

bdbjeへの書き込み時のレプリカackタイムアウト。比較的大きなログを書き込む際、ack時間がタイムアウトし、ログ書き込みが失敗する可能性があります。この場合、この値を適切に増やすことができます。

#### `bdbje_lock_timeout_second`

デフォルト：5

bdbje操作のロックタイムアウト。FE WARNログに多くのLockTimeoutExceptionがある場合、この値を増やしてみてください

#### `bdbje_heartbeat_timeout_second`

デフォルト：30

masterとfollower間のbdbjeハートビートタイムアウト。デフォルトは30秒で、bdbjeのデフォルト値と同じです。ネットワークに一時的な問題がある場合や、予期しない長いjava GCが発生している場合、この値を増やして偽のタイムアウトの可能性を減らすことができます

#### `replica_ack_policy`

デフォルト：SIMPLE_MAJORITY

オプション: ALL, NONE, SIMPLE_MAJORITY

bdbjeのレプリカackポリシー。詳細情報については、<http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.ReplicaAckPolicy.html>を参照してください

#### `replica_sync_policy`

デフォルト：SYNC

選択肢：SYNC, NO_SYNC, WRITE_NO_SYNC

Follower FEのbdbje同期ポリシー。

#### `master_sync_policy`

デフォルト：SYNC

選択肢：SYNC, NO_SYNC, WRITE_NO_SYNC

Master FEのbdbje同期ポリシー。Follower FEを1つだけデプロイする場合は、これを'SYNC'に設定してください。3つ以上のFollower FEをデプロイする場合は、これと以下の'replica_sync_policy'をWRITE_NO_SYNCに設定できます。詳細情報については、<http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.SyncPolicy.html>を参照してください

#### `bdbje_reserved_disk_bytes`

レプリケートされたJE環境で保持する予約領域のバイト数の望ましい上限。

デフォルト: 1073741824

動的設定可能か: false

Master FEノード固有の設定項目か: false

#### `ignore_meta_check`

デフォルト：false

IsMutable：true

trueの場合、非master FEはMaster FEと自身の間のメタデータ遅延ギャップを無視します。メタデータ遅延ギャップが*meta_delay_toleration_second*を超えていても無視します。非master FEは引き続き読み取りサービスを提供します。
これは、何らかの理由でMaster FEを比較的長時間停止させたいが、非master FEに読み取りサービスを提供させたい場合に有用です。

#### `meta_delay_toleration_second`

デフォルト: 300（5分）

メタデータ遅延ギャップが*meta_delay_toleration_second*を超える場合、非master FEはサービス提供を停止します

#### `edit_log_port`

デフォルト：9010

bdbjeポート

#### `edit_log_type`

デフォルト：BDB

編集ログタイプ。
BDB: ログをbdbjeに書き込み
LOCAL: 非推奨..

#### `edit_log_roll_num`

デフォルト：50000

IsMutable：true

MasterOnly：true

Master FEは*edit_log_roll_num*メタジャーナルごとにイメージを保存します。

#### `force_do_metadata_checkpoint`

デフォルト：false

IsMutable：true

MasterOnly：true

trueに設定すると、チェックポイントスレッドはjvmメモリ使用率に関係なくチェックポイントを実行します

#### `metadata_checkpoint_memory_threshold`

デフォルト：60（60%）

IsMutable：true

MasterOnly：true

jvmメモリ使用率（ヒープまたは旧世代メモリプール）がこの閾値を超えると、OOMを回避するためにチェックポイントスレッドは動作しません。

#### `max_same_name_catalog_trash_num`

カタログごみ箱内の同名メタ情報の最大数を設定するために使用されます。最大値を超えると、最も古く削除されたメタごみは完全に削除され、復旧できません。0は同名オブジェクトを保持しないことを意味します。< 0は制限なしを意味します。

注意: 同名メタデータの判定は特定の範囲に制限されます。例えば、同名データベースの判定は同じクラスター内に制限され、同名テーブルの判定は同じデータベース（同じデータベースID）内に制限され、同名パーティションの判定は同じデータベース（同じデータベースID）および同じテーブル（同じテーブルID）内に制限されます。

デフォルト: 3

動的設定可能か: true

Master FEノード固有の設定項目か: true

#### `cluster_id`

デフォルト：-1

同じcluster idを持つnode（FEまたはBE）は、同じDorisクラスターに属すると見なされます。クラスター idは通常、master FEが最初に起動する際に生成されるランダムな整数です。独自に指定することもできます。

#### `heartbeat_mgr_blocking_queue_size`

デフォルト：1024

MasterOnly：true

heartbeat_mgr内でハートビートタスクを格納するブロッキングキューサイズ。

#### `heartbeat_mgr_threads_num`

デフォルト：8

MasterOnly：true

heartbeat_mgr内でハートビートイベントを処理するスレッド数。

#### `disable_cluster_feature`

デフォルト：true

IsMutable：true

マルチクラスター機能はバージョン0.12で非推奨になります。この設定をtrueにすると、クラスター機能に関連するすべての操作が無効になります：

1. create/drop cluster
2. add free backend/add backend to cluster/decommission cluster balance
3. change the backends num of cluster
4. link/migration db

#### `enable_fqdn_mode`

この設定は主にk8sクラスター環境で使用されます。enable_fqdn_modeがtrueの場合、beが配置されているpodの名前は再構築後も変更されませんが、ipは変更される可能性があります。

デフォルト: false

動的設定可能か: false

Master FEノード固有の設定項目か: true

#### `enable_token_check`

デフォルト：true

前方互換性のため、後で削除される予定です。イメージファイルダウンロード時のトークンチェック。

#### `enable_multi_tags`

デフォルト: false

動的設定可能か: false

Master FEノード固有の設定項目か: true

単一BEのmulti-tags機能を有効にするかどうか

#### `initial_root_password`

rootユーザーの初期2段階SHA-1暗号化パスワードを設定します。デフォルトは''で、rootパスワードなしを意味します。rootユーザーに対するその後の`set password`操作は、初期rootパスワードを上書きします。

例: 平文パスワード`root@123`を設定したい場合、Doris SQL `select password('root@123')`を実行して暗号化パスワード`*A00C34073A26B40AB4307650BFB9309D6BFA6999`を生成できます。

デフォルト: 空文字列

動的設定可能か: false

Master FEノード固有の設定項目か: true

#### `enable_cooldown_replica_affinity`

ユーザーは、スキャン時にクールダウンされたコピーを優先的に使用するかどうかを選択できます。デフォルトはtrueです

デフォルト: true

動的設定可能か: true

Master FEノード固有の設定項目か: false

### サービス

#### `query_port`

デフォルト：9030

FE MySQLサーバーポート

#### `arrow_flight_sql_port`

デフォルト：-1

Arrow Flight SQLサーバーポート

#### `frontend_address`

ステータス: 非推奨、使用非推奨。このパラメーターは後で削除される可能性があります

タイプ: string

説明: *InetAddress.getByName*を使用してIPアドレスを取得する代わりに、FEのIPアドレスを明示的に設定します。通常、*InetAddress.getByName*で期待する結果が得られない場合に使用します。IPアドレスのみサポートされ、ホスト名はサポートされません。

デフォルト値: 0.0.0.0

#### `priority_networks`

デフォルト：none

多くのIPを持つサーバーの選択戦略を宣言します。このリストに一致するIPは最大1つである必要があります。これはCIDR記法のセミコロン区切り形式のリスト（例：10.10.10.0/24）です。このルールに一致するIPがない場合、ランダムに1つ選択されます。

#### `http_port`

デフォルト：8030

HTTPバインドポート。現在、すべてのFE httpポートは同じである必要があります。

#### `https_port`

デフォルト：8050

HTTPSバインドポート。現在、すべてのFE httpsポートは同じである必要があります。

#### `enable_https`

デフォルト：false

Https有効フラグ。値がfalseの場合、httpがサポートされます。それ以外の場合、httpとhttpsの両方がサポートされ、httpリクエストは自動的にhttpsにリダイレクトされます。
enable_httpsがtrueの場合、fe.confでSSL証明書情報を設定する必要があります。

#### `enable_ssl`

デフォルト：true

trueに設定すると、dorisはmysqlとSSLプロトコルベースの暗号化チャネルを確立します。

#### `qe_max_connection`

デフォルト：1024

FEあたりの最大接続数。

#### `check_java_version`

デフォルト：true

Dorisはコンパイル時と実行時のJavaバージョンが互換性があるかチェックし、互換性がない場合はJavaバージョン不一致例外メッセージを投げて起動を終了します

#### `rpc_port`

デフォルト：9020

FE Thrift サーバーポート

#### `thrift_server_type`

この設定は、FEのThrift Serviceが使用するサービスモデルを表し、String型で大文字小文字を区別しません。

このパラメーターが'SIMPLE'の場合、'TSimpleServer'モデルが使用されます。これは通常本番環境には適さず、テスト用途に限定されます。

パラメーターが'THREADED'の場合、'TThreadedSelectorServer'モデルが使用されます。これは非ブロッキングI/Oモデル、すなわちマスター・スレーブReactorモデルで、大量の同時接続リクエストにタイムリーに応答でき、ほとんどのシナリオで良好なパフォーマンスを発揮します。

このパラメーターが`THREAD_POOL`の場合、`TThreadPoolServer`モデルが使用されます。このモデルはブロッキングI/Oモデルで、スレッドプールを使用してユーザー接続を処理し、同時接続数はスレッドプール数に制限されます。同時リクエスト数を事前に推定でき、十分なスレッドリソースコストを許容できる場合、このモデルはより良いパフォーマンスを発揮し、デフォルトで使用されるサービスモデルです

#### `thrift_server_max_worker_threads`

デフォルト：4096

thriftサーバーの最大ワーカースレッド数

#### `thrift_backlog_num`

デフォルト：1024

thriftサーバーのbacklog_num。このbacklog_numを増やす場合、linux /proc/sys/net/core/somaxconn設定よりも大きい値にしてください

#### `thrift_client_timeout_ms`

デフォルト：0

thriftサーバーの接続タイムアウトとソケットタイムアウト設定。

thrift_client_timeout_msの値は読み取りタイムアウトを防ぐために0に設定されています。

#### `thrift_max_message_size`

デフォルト: 100MB

thriftサーバーの（受信）メッセージの最大サイズ（バイト）。クライアントが送信するメッセージのサイズがこの制限を超えると、Thriftサーバーはリクエストを拒否し、接続を閉じます。その結果、クライアントは"connection has been closed by peer."エラーが発生します。この場合、このパラメーターを増やしてみてください。

#### `use_compact_thrift_rpc`

デフォルト: true

クエリプラン構造を送信する際に圧縮形式を使用するかどうか。有効にすると、クエリプラン構造のサイズを約50%削減でき、"send fragment timeout"エラーを回避できます。
ただし、高同時実行の小さなクエリシナリオでは、同時実行性が約10%減少する可能性があります。

#### `grpc_max_message_size_bytes`

デフォルト：1G

GRPCクライアントチャネルの初期フローウィンドウサイズ設定に使用され、最大メッセージサイズにも使用されます。結果セットが大きい場合、この値を増やす必要があるかもしれません。

#### `max_mysql_service_task_threads_num`

デフォルト：4096

Taskイベントを担当するスレッド数。

#### `mysql_service_io_threads_num`

デフォルト：4

FEがNIOモデルベースのMySQLサーバーを起動する際の、IOイベントを担当するスレッド数。

#### `mysql_nio_backlog_num`

デフォルト：1024

mysql nioサーバーのbacklog_num。このbacklog_numを増やす場合、同時にlinux /proc/sys/net/core/somaxconnファイルの値も増やしてください

#### `broker_timeout_ms`

デフォルト：10000（10秒）

デフォルトのbroker RPCタイムアウト

#### `backend_rpc_timeout_ms`

FeからBEへのrpcリクエスト送信のタイムアウトミリ秒

デフォルト: 60000

動的設定可能か: false

Master FEノード固有の設定項目か: true

#### `drop_backend_after_decommission`

デフォルト：false

IsMutable：true

MasterOnly：true

1. この設定は、BEの廃止措置成功後にシステムがBEを削除するかどうかを制御するために使用されます。trueの場合、BEが正常にオフラインになった後、BEノードは削除されます。falseの場合、BEが正常にオフラインになった後、BEはDECOMMISSION状態のままですが、削除されません。

   この設定は特定のシナリオで役立ちます。Dorisクラスターの初期状態がBEノードあたり1つのディスクであると仮定します。一定期間実行後、システムは垂直拡張されました。つまり、各BEノードに2つの新しいディスクが追加されました。Dorisは現在BE内のディスク間でのデータバランシングをサポートしていないため、初期ディスクのデータ量は新しく追加されたディスクのデータ量よりも常に多い可能性があります。この場合、以下の操作で手動ディスク間バランシングを実行できます：

   1. この設定項目をfalseに設定します。
   2. 特定のBEノードに対してdecommission操作を実行します。この操作により、BE上のすべてのデータが他のノードに移行されます。
   3. decommission操作完了後、BEは削除されません。この時、BEのdecommissionステータスをキャンセルします。その後、データは他のBEノードからこのノードに戻ってバランシングを開始します。この時、データはBEのすべてのディスクに均等に分散されます。
   4. すべてのBEノードに対して順次ステップ2と3を実行し、最終的にすべてのノードのディスクバランシングの目的を達成します

#### `max_backend_down_time_second`

デフォルト: 3600（1時間）

IsMutable：true

MasterOnly：true

backendが*max_backend_down_time_second*間ダウンしている場合、BACKEND_DOWNイベントがトリガーされます。

#### `disable_backend_black_list`

BEブラックリスト機能を無効にするために使用されます。この機能を無効にすると、BEへのクエリリクエストが失敗してもBEはブラックリストに追加されません。
このパラメーターは回帰テスト環境に適しており、偶発的なバグによる大量の回帰テスト失敗を減らします。

デフォルト: false

動的設定可能か: true

Master FEノード固有の設定項目か: false

#### `max_backend_heartbeat_failure_tolerance_count`

BEノードハートビート失敗の最大許容回数。連続ハートビート失敗回数がこの値を超えると、BE状態はdeadに設定されます。
このパラメーターは回帰テスト環境に適しており、偶発的なハートビート失敗による大量の回帰テスト失敗を減らします。

デフォルト: 1

動的設定可能か: true

Master FEノード固有の設定項目か: true

### `abort_txn_after_lost_heartbeat_time_second`

ハートビート失失後のトランザクション中止時間。デフォルト値は300で、beのトランザクションがハートビート失失後300秒で中止されることを意味します。

デフォルト: 300（秒）

動的設定可能か: true

Master FEノード固有の設定項目か: true

#### `enable_access_file_without_broker`

デフォルト：false

IsMutable：true

MasterOnly：true

この設定は、broker経由でbosや他のクラウドストレージにアクセスする際にbrokerをスキップすることを試行するために使用されます

#### `agent_task_resend_wait_time_ms`

デフォルト：5000

IsMutable：true

MasterOnly：true

この設定は、agent_taskのcreate_timeが設定されている場合にagent taskを再送信するかどうかを決定します。current_time - create_time > agent_task_resend_wait_time_msの場合にのみ、ReportHandlerはagent taskを再送信できます。

この設定は現在主に`PUBLISH_VERSION` agent taskの重複送信問題を解決するために使用されます。この設定の現在のデフォルト値は5000で、これは実験値です。

AgentTaskQueueへのagent task送信とbeへの送信の間には一定の時間遅延があるため、この設定の値を増やすとagent taskの重複送信問題を効果的に解決できます。

しかし同時に、失敗したagent taskや実行に失敗したagent taskの再実行時間が延長されます

#### `max_agent_task_threads_num`

デフォルト：4096

MasterOnly：true

agent taskスレッドプール内でagent taskを処理するスレッドの最大数。

#### `remote_fragment_exec_timeout_ms`

デフォルト：30000（ms）

IsMutable：true

非同期リモートフラグメント実行のタイムアウト。通常の場合、非同期リモートフラグメントは短時間で実行されます。システムが高負荷状態の場合、このタイムアウトを長く設定してみてください。

#### `auth_token`

デフォルト：空

内部認証に使用されるクラスタートークン。

#### `enable_http_server_v2`

デフォルト: 公式0.14.0バージョンリリース後はデフォルトでtrue、それ以前はデフォルトでfalse

HTTP サーバー V2はSpringBootで実装されています。フロントエンドとバックエンドを分離したアーキテクチャを使用します。HTTPv2が有効な場合のみ、ユーザーは新しいフロントエンドUIインターフェースを使用できます。

#### `http_api_extra_base_path`

一部のデプロイメント環境では、ユーザーはHTTP APIの統一プレフィックスとして追加のベースパスを指定する必要があります。このパラメーターはユーザーが追加のプレフィックスを指定するために使用されます。
設定後、ユーザーは`GET /api/basepath`インターフェースを通じてパラメーター値を取得できます。新しいUIもまずこのベースパスを取得してURLを組み立てます。`enable_http_server_v2`がtrueの場合のみ有効です。

デフォルトは空、すなわち未設定

#### `jetty_server_acceptors`

デフォルト：2

#### `jetty_server_selectors`

デフォルト：4

#### `jetty_server_workers`

デフォルト：0

上記3つのパラメーターに関して、Jettyのスレッドアーキテクチャモデルは非常にシンプルで、acceptors、selectors、workersの3つのスレッドプールに分かれています。Acceptorsは新しい接続の受け入れを担当し、その後selectorsに渡してHTTPメッセージプロトコルのアンパッキングを処理し、最終的にworkersがリクエストを処理します。最初の2つのスレッドプールは非ブロッキングモデルを採用し、1つのスレッドで多くのソケットの読み書きを処理できるため、スレッドプール数は少ないです。

ほとんどのプロジェクトでは、1-2個のacceptorsスレッドのみが必要で、2から4個のselectorsスレッドで十分です。Workersは阻害的なビジネスロジックで、多くの場合データベース操作があり、大量のスレッドが必要です。具体的な数はアプリケーションのQPSとIOイベントの比率に依存します。QPSが高いほどより多くのスレッドが必要で、IOの比率が高いほど待機スレッドが多く、総スレッド数がより多く必要です。

Workerスレッドプールはデフォルトでは設定されていません。必要に応じて設定してください

#### `jetty_server_max_http_post_size`

デフォルト：`100 * 1024 * 1024`（100MB）

これはputまたはpostメソッドでアップロードされるファイルの最大バイト数です。デフォルト値：100MB

#### `jetty_server_max_http_header_size`

デフォルト：1048576（1M）

httpヘッダーサイズ設定パラメーター、デフォルト値は1Mです。

#### `http_sql_submitter_max_worker_threads`

デフォルト：2

http sql submitterの最大ワーカースレッド数

#### `http_load_submitter_max_worker_threads`

デフォルト：2

httpアップロードsubmitterの最大ワーカースレッド数

### クエリエンジン

#### `default_max_query_instances`

ユーザープロパティmax_query_instancesが0以下の場合のデフォルト値。この設定はユーザーの最大インスタンス数を制限するために使用されます。このパラメーターが0以下の場合は無制限を意味します。

デフォルト値は-1

#### `max_query_retry_time`

デフォルト：3

IsMutable：true

クエリリトライ回数。RPC例外が発生し、ユーザーに結果が送信されていない場合、クエリはリトライする可能性があります。雪崩災害を回避するために

```text
current running txns on db xxx is xx, larger than limit xx
```
このエラーに遭遇した場合、クラスタで現在実行中のロードジョブが設定値を超えていることを意味します。この時点では、ビジネス側で待機し、ロードジョブをリトライすることをお勧めします。

Connectorを使用する場合、このパラメータの値を適切に調整することができ、数千の値でも問題ありません

#### `using_old_load_usage_pattern`

デフォルト：false

IsMutable：true

MasterOnly：true

trueに設定すると、処理エラーのあるinsert stmtでもユーザーにラベルを返します。ユーザーはこのラベルを使用してロードジョブのステータスを確認できます。デフォルト値はfalseで、これはinsert操作でエラーが発生した場合、ロードラベルなしでユーザークライアントに直接例外がスローされることを意味します。

#### `disable_load_job`

デフォルト：false

IsMutable：true

MasterOnly：true

これがtrueに設定されている場合

* すべてのpendingロードジョブはbegin txn API呼び出し時に失敗します
* すべてのprepareロードジョブはcommit txn API呼び出し時に失敗します
* すべてのcommittedロードジョブは公開待ちになります

#### `commit_timeout_second`

デフォルト：30

IsMutable：true

MasterOnly：true

1つのトランザクション前に挿入されたすべてのデータがコミットされるまでの最大待機時間
これは「commit」コマンドのタイムアウト秒数です

#### `max_unfinished_load_job`

デフォルト：1000

IsMutable：true

MasterOnly：true

PENDING、ETL、LOADING、QUORUM_FINISHEDを含むロードジョブの最大数。この数を超える場合、ロードジョブの送信は許可されません

#### `db_used_data_quota_update_interval_secs`

デフォルト：300 (s)

IsMutable：true

MasterOnly：true

1つのマスターデーモンスレッドが、`db_used_data_quota_update_interval_secs`ごとにdb txnマネージャーのデータベース使用データクォータを更新します

より良いデータロードパフォーマンスのために、データロード前にデータベースで使用されるデータ量がクォータを超えているかどうかの確認において、データベースで既に使用されているデータ量をリアルタイムで計算せず、デーモンスレッドの定期的に更新された値を取得します。

この設定は、データベースで使用されているデータ量の値を更新する時間間隔を設定するために使用されます

#### `disable_show_stream_load`

デフォルト：false

IsMutable：true

MasterOnly：true

show stream loadを無効にし、メモリ内のstream loadレコードをクリアするかどうか。

#### `max_stream_load_record_size`

デフォルト：5000

IsMutable：true

MasterOnly：true

メモリに保存できる最近のstream loadレコードのデフォルト最大数。

#### `fetch_stream_load_record_interval_second`

デフォルト：120

IsMutable：true

MasterOnly：true

stream loadレコードの取得間隔。

#### `max_bytes_per_broker_scanner`

デフォルト：`500 * 1024 * 1024 * 1024L`  （500G）

IsMutable：true

MasterOnly：true

1つのbroker loadジョブでbroker scannerが処理できる最大バイト数。通常、各Backendsには1つのbroker scannerがあります。

#### `default_load_parallelism`

デフォルト: 8

IsMutable：true

MasterOnly：true

単一ノードでのbroker load実行プランのデフォルト並列度。
broker loadの送信時にユーザーが並列度を設定する場合、このパラメータは無視されます。
このパラメータは、`max broker concurrency`、`min bytes per broker scanner`などの複数の設定とともにインポートタスクの同時実行性を決定します。

#### `max_broker_concurrency`

デフォルト：10

IsMutable：true

MasterOnly：true

broker scannerの最大同時実行性。

#### `min_bytes_per_broker_scanner`

デフォルト：67108864L (64M)

IsMutable：true

MasterOnly：true

単一のbroker scannerが読み込む最小バイト数。

#### `period_of_auto_resume_min`

デフォルト：5 （s）

IsMutable：true

MasterOnly：true

Routine loadの自動復元サイクル

#### `max_tolerable_backend_down_num`

デフォルト：0

IsMutable：true

MasterOnly：true

1つのBEがダウンしている限り、Routine Loadは自動復元できません

#### `max_routine_load_task_num_per_be`

デフォルト：5

IsMutable：true

MasterOnly：true

BE当たりの最大同時routine loadタスク数。これはBEに送信されるroutine loadタスクの数を制限するためのもので、BE設定の'routine_load_thread_pool_size'（デフォルト10）より少なくする必要があります。これはBEでのroutine loadタスクスレッドプールサイズです。

#### `max_routine_load_task_concurrent_num`

デフォルト：5

IsMutable：true

MasterOnly：true

単一のroutine loadジョブの最大同時routine loadタスク数

#### `max_routine_load_job_num`

デフォルト：100

NEED_SCHEDULED、RUNNING、PAUSEを含む最大routine loadジョブ数

#### `desired_max_waiting_jobs`

デフォルト：100

IsMutable：true

MasterOnly：true

routine loadとバージョン2のloadの待機ジョブのデフォルト数。これは希望する数です。マスターの切り替えなどの一部の状況では、現在の数がdesired_max_waiting_jobsより多くなる場合があります。

#### `disable_hadoop_load`

デフォルト：false

IsMutable：true

MasterOnly：true

hadoopクラスタを使用したロードは将来廃止予定です。この種類のロードを無効にするにはtrueに設定してください。

#### `enable_spark_load`

デフォルト：false

IsMutable：true

MasterOnly：true

spark loadを一時的に有効にするかどうか、デフォルトでは有効になっていません

**注意：** このパラメータはバージョン1.2で削除され、spark_loadはデフォルトで有効になっています

#### `spark_load_checker_interval_second`

デフォルト：60

Spark loadスケジューラーの実行間隔、デフォルト60秒

#### `async_loading_load_task_pool_size`

デフォルト：10

IsMutable：false

MasterOnly：true

loading_loadタスクエグゼキュータープールサイズ。このプールサイズは実行中のloading_loadタスクの最大数を制限します。

現在、broker loadのloading_loadタスクのみを制限します

#### `async_pending_load_task_pool_size`

デフォルト：10

IsMutable：false

MasterOnly：true

pending_loadタスクエグゼキュータープールサイズ。このプールサイズは実行中のpending_loadタスクの最大数を制限します。

現在、broker loadとspark loadのpending_loadタスクのみを制限します。

'max_running_txn_num_per_db'より少なくする必要があります

#### `async_load_task_pool_size`

デフォルト：10

IsMutable：false

MasterOnly：true

この設定は旧バージョンとの互換性のためのものです。この設定はasync_loading_load_task_pool_sizeに置き換えられており、将来削除される予定です。

#### `enable_single_replica_load`

デフォルト：false

IsMutable：true

MasterOnly：true

stream loadとbroker loadで単一レプリカ書き込みを有効にするかどうか。

#### `min_load_timeout_second`

デフォルト：1 （1s）

IsMutable：true

MasterOnly：true

すべての種類のloadに適用される最小stream loadタイムアウト

#### `max_stream_load_timeout_second`

デフォルト: 259200 (3 day)

IsMutable：true

MasterOnly：true

この設定は特にstream loadのタイムアウト設定を制限するために使用されます。ユーザーの大きなタイムアウト設定により、失敗したstream loadトランザクションが短時間でキャンセルできなくなることを防ぐためです

#### `max_load_timeout_second`

デフォルト: 259200 (3 day)

IsMutable：true

MasterOnly：true

stream loadを除くすべての種類のloadに適用される最大loadタイムアウト

#### `stream_load_default_timeout_second`

デフォルト: 86400 * 3 (3 day)

IsMutable：true

MasterOnly：true

デフォルトのstream loadとstreaming mini loadタイムアウト

#### `stream_load_default_precommit_timeout_second`

デフォルト：3600（s）

IsMutable：true

MasterOnly：true

デフォルトのstream loadプリサブミッションタイムアウト

#### `stream_load_default_memtable_on_sink_node`

デフォルト：false

IsMutable：true

MasterOnly：true

デフォルトでstream loadのsink nodeでmemtableを有効にします。
HTTPヘッダー`memtable_on_sink_node`が設定されていない場合。

#### `insert_load_default_timeout_second`

デフォルト: 3600 (1 hour)

IsMutable：true

MasterOnly：true

デフォルトのinsert loadタイムアウト

#### `mini_load_default_timeout_second`

デフォルト: 3600 (1 hour)

IsMutable：true

MasterOnly：true

デフォルトの非ストリーミングmini loadタイムアウト

#### `broker_load_default_timeout_second`

デフォルト: 14400 (4 hour)

IsMutable：true

MasterOnly：true

デフォルトのbroker loadタイムアウト

#### `spark_load_default_timeout_second`

デフォルト: 86400  (1 day)

IsMutable：true

MasterOnly：true

デフォルトのspark loadタイムアウト

#### `hadoop_load_default_timeout_second`

デフォルト: 86400 * 3   (3 day)

IsMutable：true

MasterOnly：true

デフォルトのhadoop loadタイムアウト

#### `load_running_job_num_limit`

デフォルト：0

IsMutable：true

MasterOnly：true

ロードタスクの数制限、デフォルトは0で制限なし

#### `load_input_size_limit_gb`

デフォルト：0

IsMutable：true

MasterOnly：true

Loadジョブで入力されるデータのサイズ、デフォルトは0で無制限

#### `load_etl_thread_num_normal_priority`

デフォルト：10

NORMAL優先度etl loadジョブの同時実行性。何をしているか分からない場合は変更しないでください。

#### `load_etl_thread_num_high_priority`

デフォルト：3

HIGH優先度etl loadジョブの同時実行性。何をしているか分からない場合は変更しないでください

#### `load_pending_thread_num_normal_priority`

デフォルト：10

NORMAL優先度pending loadジョブの同時実行性。何をしているか分からない場合は変更しないでください。

#### `load_pending_thread_num_high_priority`

デフォルト：3

HIGH優先度pending loadジョブの同時実行性。Loadジョブの優先度はHIGHまたはNORMALとして定義されます。すべてのmini batch loadジョブはHIGH優先度で、その他の種類のloadジョブはNORMAL優先度です。優先度は、遅いloadジョブが長時間スレッドを占有することを避けるために設定されています。これは単なる内部最適化スケジューリングポリシーです。現在、ジョブの優先度を手動で指定することはできず、何をしているか分からない場合は変更しないでください。

#### `load_checker_interval_second`

デフォルト：5 （s）

loadスケジューラーの実行間隔。loadジョブはPENDINGからLOADING、そしてFINISHEDへと状態を遷移します。loadスケジューラーはloadジョブをPENDINGからLOADINGに遷移させ、txnコールバックはloadジョブをLOADINGからFINISHEDに遷移させます。そのため、同時実行性が上限に達していない場合、loadジョブは最大1間隔で完了します。

#### `label_keep_max_second`

デフォルト：`3 * 24 * 3600`  (3 day)

IsMutable：true

MasterOnly：true

完了またはキャンセルされたloadジョブのラベルは`label_keep_max_second`後に削除されます、

1. 削除されたラベルは再利用できます。
2. 短い時間を設定するとFEメモリ使用量が低下します。（削除される前にすべてのloadジョブの情報がメモリに保持されるため）

高い同時書き込みの場合、ジョブの大きなバックログがありfrontendサービスの呼び出しが失敗した場合は、ログを確認してください。メタデータ書き込みでロックに時間がかかりすぎる場合は、この値を12時間または6時間に調整できます

#### `streaming_label_keep_max_second`

デフォルト: 43200 (12 hour)

IsMutable：true

MasterOnly：true

INSERT、STREAMING LOAD、ROUTINE_LOAD_TASKなどの高頻度ロードワークの場合。期限切れの場合、完了したジョブまたはタスクを削除します。

#### `label_clean_interval_second`

デフォルト：1 * 3600  (1 hour)

Loadラベルクリーナーは*label_clean_interval_second*ごとに実行され、期限切れのジョブをクリーンアップします。

#### `label_regex_length`

デフォルト値: 128 (文字)

loadラベルの最大文字長、デフォルトは128文字です。

#### `transaction_clean_interval_second`

デフォルト：30

トランザクションが可視またはアボートされている場合、transaction_clean_interval_second秒後にトランザクションがクリーンアップされます。この間隔をできるだけ短くし、各クリーンサイクルをできるだけ早くする必要があります

#### `sync_commit_interval_second`

トランザクションをコミットする最大時間間隔。この時間後もチャネルに未送信データがある場合、コンシューマーはチャネルにトランザクションの送信を通知します。

デフォルト: 10 (秒)

動的設定可能かどうか: true

Master FEノード固有の設定項目かどうか: true

#### `sync_checker_interval_second`

データ同期ジョブ実行ステータスチェック。

デフォルト: 10 (s)

#### `max_sync_task_threads_num`

データ同期ジョブスレッドプール内の最大スレッド数。

デフォルト値：10

#### `min_sync_commit_size`

トランザクションをコミットするために満たす必要がある最小イベント数。Feが受信したイベント数がこれより少ない場合、時間が`sync_commit_interval_second`を超えるまで次のバッチデータを待ち続けます。デフォルト値は10000イベントです。この設定を変更したい場合は、この値がcanal側の`canal.instance.memory.buffer.size`設定（デフォルト16384）より小さいことを確認してください。そうでなければ、Feはack前にストアキューより長いキュー長を取得しようとしてストアキューがタイムアウトまでブロックされる原因となります。

デフォルト: 10000

動的設定可能かどうか: true

Master FEノード固有の設定項目かどうか: true

#### `min_bytes_sync_commit`

トランザクションをコミットするために必要な最小データサイズ。Feが受信したデータサイズがこれより小さい場合、時間が`sync_commit_interval_second`を超えるまで次のバッチデータを待ち続けます。デフォルト値は15MBです。この設定を変更したい場合は、この値がcanal側の`canal.instance.memory.buffer.size`と`canal.instance.memory.buffer.memunit`の積（デフォルト16MB）より小さいことを確認してください。そうでなければ、Feはack前にストア容量より大きいデータを取得しようとしてストアキューがタイムアウトまでブロックされる原因となります。

デフォルト: `15*1024*1024` (15M)

動的設定可能かどうか: true

Master FEノード固有の設定項目かどうか: true

#### `max_bytes_sync_commit`

データ同期ジョブスレッドプール内の最大スレッド数。FE全体に1つのスレッドプールのみがあり、FEでBEにデータを送信するすべてのデータ同期タスクの処理に使用されます。スレッドプールの実装は`SyncTaskPool`クラスにあります。

デフォルト: 10

動的設定可能かどうか: false

Master FEノード固有の設定項目かどうか: false

#### `enable_outfile_to_local`

デフォルト：false

outfile機能で結果をローカルディスクにエクスポートすることを許可するかどうか。

#### `export_tablet_num_per_task`

デフォルト：5

IsMutable：true

MasterOnly：true

エクスポートクエリプランあたりのタブレット数

#### `export_task_default_timeout_second`

デフォルト: 2 * 3600   (2 hour)

IsMutable：true

MasterOnly：true

エクスポートジョブのデフォルトタイムアウト。

#### `export_running_job_num_limit`

デフォルト：5

IsMutable：true

MasterOnly：true

実行中のエクスポートジョブの同時実行制限。デフォルトは5。0は無制限

#### `export_checker_interval_second`

デフォルト：5

エクスポートチェッカーの実行間隔。

#### `enable_stream_load_profile`

デフォルト: false

MasterOnly: false

stream loadプロファイルを有効にするかどうか

### Log

#### `log_roll_size_mb`

デフォルト：1024  （1G）

1つのsysログとauditログの最大サイズ

#### `sys_log_dir`

デフォルト: DorisFE.DORIS_HOME_DIR + "/log"

これはFEログディレクトリを指定します。FEは2つのログファイルを生成します：

fe.log:      FEプロセスのすべてのログ。
fe.warn.log  FEプロセスのすべてのWARNINGとERRORログ。

#### `sys_log_level`

デフォルト：INFO

ログレベル: INFO、WARN、ERROR、FATAL

#### `sys_log_roll_num`

デフォルト：10

sys_log_roll_interval内で保持される最大FEログファイル数。デフォルトは10で、1日に最大10個のログファイルが存在することを意味します

#### `sys_log_verbose_modules`

デフォルト：{}

詳細モジュール。VERBOSEレベルはlog4jのDEBUGレベルによって実装されています。

例：
   sys_log_verbose_modules = org.apache.doris.catalog
   これはパッケージorg.apache.doris.catalogとそのすべてのサブパッケージ内のファイルのデバッグログのみを印刷します。

#### `sys_log_roll_interval`

デフォルト：DAY

sys_log_roll_interval:

* DAY:  ログサフィックスは  yyyyMMdd
* HOUR: ログサフィックスは  yyyyMMddHH

#### `sys_log_delete_age`

デフォルト：7d

デフォルトは7日で、ログの最終変更時刻が7日前の場合、削除されます。

サポートされる形式：

* 7d      7日
* 10h     10時間
* 60m     60分
* 120s    120秒

#### `sys_log_roll_mode`

デフォルト：SIZE-MB-1024

ログ分割のサイズ、1Gごとにログファイルを分割

#### `sys_log_enable_compress`

デフォルト: false

trueの場合、fe.logとfe.warn.logをgzipで圧縮します

#### `audit_log_dir`

デフォルト：DORIS_HOME_DIR + "/log"

audit_log_dir：
これはFE auditログディレクトリを指定します。
Auditログfe.audit.logには、ユーザー、ホスト、コスト、ステータスなどの関連情報を含むすべてのリクエストが含まれます

#### `audit_log_roll_num`

デフォルト：90

audit_log_roll_interval内で保持される最大FE auditログファイル数。

#### `audit_log_modules`

デフォルト：{"slow_query", "query", "load", "stream_load"}

Slow queryには*qe_slow_log_ms*を超えるコストのすべてのクエリが含まれます

#### `qe_slow_log_ms`

デフォルト: 5000 (5秒)

クエリの応答時間がこの閾値を超える場合、slow_queryとしてauditログに記録されます。

#### `audit_log_roll_interval`

デフォルト：DAY

DAY:  ログサフィックス : yyyyMMdd
HOUR: ログサフィックス : yyyyMMddHH

#### `audit_log_delete_age`

デフォルト：30d

デフォルトは30日で、ログの最終変更時刻が30日前の場合、削除されます。

サポートされる形式：
* 7d      7日
* 10h     10時間
* 60m     60分
* 120s    120秒

#### `audit_log_enable_compress`

デフォルト: false

trueの場合、fe.audit.logをgzipで圧縮します

#### `nereids_trace_log_dir`

デフォルト: DorisFE.DORIS_HOME_DIR + "/log/nereids_trace"

nereids traceログのディレクトリを指定するために使用されます

### Storage

#### `min_replication_num_per_tablet`

デフォルト: 1

タブレットあたりのレプリケーション最小数を設定するために使用されます。

#### `max_replication_num_per_tablet`

デフォルト: 32767

タブレットあたりのレプリケーション最大数を設定するために使用されます。

#### `default_db_data_quota_bytes`

デフォルト：8192PB

IsMutable：true

MasterOnly：true

デフォルトのデータベースデータクォータサイズを設定するために使用されます。単一データベースのクォータサイズを設定するには、以下を使用できます：

```
Set the database data quota, the unit is:B/K/KB/M/MB/G/GB/T/TB/P/PB
ALTER DATABASE db_name SET DATA QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```
#### `default_db_replica_quota_size`

デフォルト: 1073741824

IsMutable：true

MasterOnly：true

デフォルトのデータベースレプリカクォータを設定するために使用されます。単一のデータベースのクォータサイズを設定するには、以下を使用できます:

```
Set the database replica quota
ALTER DATABASE db_name SET REPLICA QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```
#### `recover_with_empty_tablet`

デフォルト：false

IsMutable：true

MasterOnly：true

コードのバグや人為的な誤操作など、一部の非常に特殊な状況において、一部のタブレットのすべてのレプリカが失われる可能性があります。この場合、データは実質的に失われています。しかし、一部のシナリオでは、ビジネスはデータ損失があってもクエリがエラーを報告しないことを望み、ユーザー層への影響を軽減したいと考えます。この時点で、空のTabletを使用して欠落したレプリカを埋めて、クエリが正常に実行できるようにすることができます。

trueに設定すると、Dorisはすべてのレプリカが破損または欠落したタブレットを空のレプリカで自動的に埋めます

#### `min_clone_task_timeout_sec` および `max_clone_task_timeout_sec`

デフォルト：最小3分、最大2時間

IsMutable：true

MasterOnly：true

`mix_clone_task_timeout_sec`と連携してクローンタスクの最大および最小タイムアウトを制御できます。通常の状況では、クローンタスクのタイムアウトはデータ量と最小転送速度（5MB/s）で推定されます。一部の特殊なケースでは、これら2つの設定を使用してクローンタスクタイムアウトの上限と下限を設定し、クローンタスクが正常に完了することを保証できます。

#### `disable_storage_medium_check`

デフォルト：false

IsMutable：true

MasterOnly：true

disable_storage_medium_checkがtrueの場合、ReportHandlerはタブレットのストレージメディアをチェックせず、ストレージクールダウン機能を無効にします。デフォルト値はfalseです。タブレットのストレージメディアを気にしない場合は、値をtrueに設定できます。

#### `decommission_tablet_check_threshold`

デフォルト：5000

IsMutable：true

MasterOnly：true

この設定は、Master FEが廃止されたBE上のタブレットのステータスをチェックする必要があるかどうかを制御するために使用されます。廃止されたBE上のタブレットのサイズがこの閾値より小さい場合、FEは定期チェックを開始し、廃止されたBE上のすべてのタブレットがリサイクルされた場合、FEは直ちにこのBEを削除します。

パフォーマンスを考慮して、この設定に非常に高い値を設定しないでください。

#### `partition_rebalance_max_moves_num_per_selection`

デフォルト：10

IsMutable：true

MasterOnly：true

PartitionRebalancerを使用する場合のみ有効

#### `partition_rebalance_move_expire_after_access`

デフォルト：600   (s)

IsMutable：true

MasterOnly：true

PartitionRebalancerを使用する場合のみ有効。これが変更されると、キャッシュされた移動はクリアされます

#### `tablet_rebalancer_type`

デフォルト：BeLoad

MasterOnly：true

Rebalancerタイプ（大文字小文字を無視）：BeLoad、Partition。タイプの解析に失敗した場合、デフォルトとしてBeLoadを使用

#### `max_balancing_tablets`

デフォルト：100

IsMutable：true

MasterOnly：true

TabletSchedulerでバランシング中のタブレット数がmax_balancing_tabletsを超える場合、それ以上のバランスチェックは行わない

#### `max_scheduling_tablets`

デフォルト：2000

IsMutable：true

MasterOnly：true

TabletSchedulerでスケジュールされたタブレット数がmax_scheduling_tabletsを超える場合、チェックをスキップする

#### `disable_balance`

デフォルト：false

IsMutable：true

MasterOnly：true

trueに設定すると、TabletSchedulerはバランスを行いません

#### `disable_disk_balance`

デフォルト：true

IsMutable：true

MasterOnly：true

trueに設定すると、TabletSchedulerはディスクバランスを行いません

#### `balance_load_score_threshold`

デフォルト: 0.1 (10%)

IsMutable：true

MasterOnly：true

クラスタバランススコアの閾値。バックエンドの負荷スコアが平均スコアより10%低い場合、このバックエンドはLOW負荷としてマークされ、負荷スコアが平均スコアより10%高い場合、HIGH負荷としてマークされます

#### `capacity_used_percent_high_water`

デフォルト: 0.75  (75%)

IsMutable：true

MasterOnly：true

ディスク容量使用率のハイウォーター。これはバックエンドの負荷スコア計算に使用されます

#### `clone_distribution_balance_threshold`

デフォルト: 0.2

IsMutable：true

MasterOnly：true

Backend内のレプリカ数のバランス閾値

#### `clone_capacity_balance_threshold`

デフォルト: 0.2

IsMutable：true

MasterOnly：true

* BE内のデータサイズのバランス閾値

   バランスアルゴリズムは：

     1. クラスタ全体の平均使用容量（AUC）を計算する（総データサイズ / 総バックエンド数）

     2. ハイウォーターレベルは（AUC * (1 + clone_capacity_balance_threshold)）

     3. ローウォーターレベルは（AUC * (1 - clone_capacity_balance_threshold)）

     4. CloneチェッカーはハイウォーターレベルのBEからローウォーターレベルのBEにレプリカを移動しようとする

#### `disable_colocate_balance`

デフォルト：false

IsMutable：true

MasterOnly：true

この設定をtrueにすると、自動的なcolocateテーブルの再配置とバランスを無効にできます。'disable_colocate_balance'がtrueに設定されている場合、ColocateTableBalancerはcolocateテーブルの再配置とバランスを行いません。

**注意**：

1. 通常の状況では、バランスを無効にする必要はまったくありません。
2. バランスが無効になると、不安定なcolocateテーブルが復元されない可能性があります
3. 最終的にクエリ時にcolocate計画を使用できなくなります。

#### `balance_slot_num_per_path`

デフォルト: 1

IsMutable：true

MasterOnly：true

バランス時のパスあたりのデフォルトスロット数

#### `disable_tablet_scheduler`

デフォルト:false

IsMutable：true

MasterOnly：true

trueに設定すると、タブレットスケジューラは動作せず、すべてのタブレット修復/バランスタスクが動作しません。

#### `enable_force_drop_redundant_replica`

デフォルト: false

動的設定: true

Master FEのみ: true

trueに設定すると、システムはタブレットスケジューリングロジックで冗長なレプリカを即座に削除します。これにより、対応するレプリカに書き込み中の一部のロードジョブが失敗する可能性がありますが、タブレットのバランスと修復速度が向上します。
クラスタ内でバランスまたは修復を待機するレプリカが大量にある場合、部分的なロード成功率を犠牲にしてレプリカのバランスと修復を高速化するためにこの設定を試すことができます。

#### `colocate_group_relocate_delay_second`

デフォルト: 1800

動的設定: true

Master FEのみ: true

コロケーショングループの再配置は、クラスタ内で大量のタブレットが移動することを含む場合があります。そのため、コロケーショングループの再配置をできるだけ避けるためにより保守的な戦略を使用すべきです。
再配置は通常、BEノードがオフラインになったりダウンしたりした後に発生します。このパラメータは、BEノードの利用不可の判定を遅延させるために使用されます。デフォルトは30分です。つまり、BEノードが30分以内に回復すれば、コロケーショングループの再配置はトリガーされません。

#### `allow_replica_on_same_host`

デフォルト: false

動的設定: false

Master FEのみ: false

同一タブレットの複数のレプリカを同一ホストに配置することを許可するかどうか。このパラメータは主にローカルテストに使用され、特定のマルチレプリカ状況をテストするために複数のBEを簡単に構築できます。テスト環境以外では使用しないでください。

#### `repair_slow_replica`

デフォルト: false

IsMutable：true

MasterOnly: true

trueに設定すると、コンパクション速度が遅いレプリカが自動的に検出され、他のマシンに移行されます。検出条件は、最速レプリカのバージョン数が`min_version_count_indicate_replica_compaction_too_slow`の値を超え、最速レプリカとのバージョン数差の比率が`valid_version_count_delta_ratio_between_replicas`の値を超えることです

#### `min_version_count_indicate_replica_compaction_too_slow`

デフォルト: 200

動的設定: true

Master FEのみ: false

レプリカコンパクションが遅すぎるかどうかを判断するために使用されるバージョン数の閾値

#### `skip_compaction_slower_replica`

デフォルト: true

動的設定: true

Master FEのみ: false

trueに設定すると、クエリ可能なレプリカを選択する際にコンパクションが遅いレプリカはスキップされます

#### `valid_version_count_delta_ratio_between_replicas`

デフォルト: 0.5

動的設定: true

Master FEのみ: true

最遅レプリカと最速レプリカのバージョン数差の有効な比率閾値。`repair_slow_replica`がtrueに設定されている場合、最遅レプリカを修復するかどうかを決定するために使用されます

#### `min_bytes_indicate_replica_too_large`

デフォルト: `2 * 1024 * 1024 * 1024` (2G)

動的設定: true

Master FEのみ: true

レプリカが大きすぎるかどうかを判断するために使用されるデータサイズの閾値

#### `schedule_slot_num_per_hdd_path`

デフォルト：4

HDDのタブレットスケジューラにおけるパスあたりのデフォルトスロット数、この設定を削除し、クローンタスクの統計によって動的に調整する

#### `schedule_slot_num_per_ssd_path`

デフォルト：8

SSDのタブレットスケジューラにおけるパスあたりのデフォルトスロット数、この設定を削除し、クローンタスクの統計によって動的に調整する

#### `tablet_repair_delay_factor_second`

デフォルト：60 （s）

IsMutable：true

MasterOnly：true

タブレット修復を決定する前の遅延時間の係数

* 優先度がVERY_HIGHの場合、即座に修復する
* HIGH：tablet_repair_delay_factor_second * 1 遅延
* NORMAL：tablet_repair_delay_factor_second * 2 遅延
* LOW：tablet_repair_delay_factor_second * 3 遅延

#### `tablet_stat_update_interval_second`

デフォルト：300（5min）

タブレット統計の更新間隔
すべてのフロントエンドが各間隔ですべてのバックエンドからタブレット統計を取得する

#### `storage_flood_stage_usage_percent`

デフォルト：95 （95%）

IsMutable：true

MasterOnly：true

##### `storage_flood_stage_left_capacity_bytes`

デフォルト：`1 * 1024 * 1024 * 1024` (1GB)

IsMutable：true

MasterOnly：true

ディスクの容量が'storage_flood_stage_usage_percent'と'storage_flood_stage_left_capacity_bytes'に達した場合、以下の操作は拒否されます：

1. ロードジョブ
2. リストアジョブ

#### `storage_high_watermark_usage_percent`

デフォルト：85  (85%)

IsMutable：true

MasterOnly：true

#### `storage_min_left_capacity_bytes`

デフォルト： `2 * 1024 * 1024 * 1024`  (2GB)

IsMutable：true

MasterOnly：true

'storage_high_watermark_usage_percent'はBackendストレージパスの最大容量使用率を制限します。'storage_min_left_capacity_bytes'はBackendストレージパスの最小残容量を制限します。両方の制限に達した場合、このストレージパスはタブレットバランスの宛先として選択できません。しかし、タブレット復旧の場合、データの整合性を可能な限り保つためにこれらの制限を超える場合があります。

#### `catalog_trash_expire_second`

デフォルト: 86400L (1日)

IsMutable：true

MasterOnly：true

データベース（テーブル/パーティション）を削除した後、RECOVER文を使用して復旧できます。これは最大データ保持時間を指定します。時間経過後、データは永続的に削除されます。

#### `default_storage_medium`

デフォルト：HDD

テーブル（またはパーティション）を作成する際に、ストレージメディア（HDDまたはSSD）を指定できます。設定されていない場合、作成時のデフォルトメディアを指定します。

#### `default_compression_type`

デフォルト: lz4（4.0.3以前）、zstd（4.0.3以降）

テーブル作成時に、圧縮アルゴリズムを指定できます。設定されていない場合、テーブル作成時のデフォルト圧縮タイプを指定します。有効な値には：lz4、zstd が含まれます。

#### `enable_storage_policy`

* Storage Policy機能を有効にするかどうか。この設定により、ユーザーはホットデータとコールドデータを分離できます。
デフォルト: false

動的設定可能: true

Master FEノードの専用設定項目: true

#### `check_consistency_default_timeout_second`

デフォルト: 600（10分）

IsMutable：true

MasterOnly：true

単一の整合性チェックタスクのデフォルトタイムアウト。タブレットサイズに合わせて十分に長く設定してください

#### `consistency_check_start_time`

デフォルト：23

IsMutable：true

MasterOnly：true

整合性チェック開始時刻

整合性チェッカーは*consistency_check_start_time*から*consistency_check_end_time*まで実行されます。

2つの時刻が同じ場合、整合性チェックはトリガーされません。

#### `consistency_check_end_time`

デフォルト：23

IsMutable：true

MasterOnly：true

整合性チェック終了時刻

整合性チェッカーは*consistency_check_start_time*から*consistency_check_end_time*まで実行されます。

2つの時刻が同じ場合、整合性チェックはトリガーされません。

#### `replica_delay_recovery_second`

デフォルト：0

IsMutable：true

MasterOnly：true

レプリカが失敗してからFEがクローンを使用して復旧を試行するまでの最小遅延秒数

#### `tablet_create_timeout_second`

デフォルト：1（s）

IsMutable：true

MasterOnly：true

単一レプリカ作成の最大待機時間

例：
   #m個のタブレットと各タブレットに#n個のレプリカを持つテーブルを作成する場合、
   create tableリクエストはタイムアウトする前に最大で（m * n * tablet_create_timeout_second）実行されます。

#### `tablet_delete_timeout_second`

デフォルト：2

IsMutable：true

MasterOnly：true

*tablet_create_timeout_second*と同じ意味ですが、タブレット削除時に使用されます。

#### `delete_job_max_timeout_second`

デフォルト: 300(s)

Mutable: true

Master only: true

削除ジョブの最大タイムアウト（秒）

#### `alter_table_timeout_second`

デフォルト: 86400 * 30（1ヶ月）

IsMutable：true

MasterOnly：true

ALTER TABLEリクエストの最大タイムアウト。テーブルデータサイズに合わせて十分に長く設定してください。

#### `max_replica_count_when_schema_change`

OlapTableがスキーマ変更を行う際に許可される最大レプリカ数。レプリカが多すぎるとFE OOMが発生します。

デフォルト: 100000

動的設定可能: true

Master FEノードの専用設定項目: true

#### `history_job_keep_max_second`

デフォルト：`7 * 24 * 3600` （7日）

IsMutable：true

MasterOnly：true

スキーマ変更ジョブやロールアップジョブなど、一部のジョブの最大保持時間

#### `max_create_table_timeout_second`

デフォルト：60 （s）

IsMutable：true

MasterOnly：true

create table（index）の待機時間を長くしすぎないために、最大タイムアウトを設定します。

### External Table

#### `file_scan_node_split_num`

デフォルト：128

IsMutable：true

MasterOnly：false

マルチカタログ並行ファイルスキャンスレッド数

#### `file_scan_node_split_size`

デフォルト：`256 * 1024 * 1024`

IsMutable：true

MasterOnly：false

マルチカタログ並行ファイルスキャンサイズ

#### `enable_odbc_mysql_broker_table`

デフォルト：false

IsMutable：true

MasterOnly：false

バージョン2.1以降、ODBC、JDBCおよびbroker外部テーブルの作成をサポートしなくなりました。ODBCとMySQL外部テーブルについては、代わりにJDBCテーブルまたはJDBCカタログを使用してください。brokerテーブルについては、代わりにテーブル値関数を使用してください。

#### `max_hive_partition_cache_num`

hiveパーティション用のキャッシュの最大数

デフォルト: 100000

動的設定可能: false

Master FEノードの専用設定項目: false

#### `hive_metastore_client_timeout_second`

hive metastoreのデフォルト接続タイムアウト

デフォルト: 10

動的設定可能: true

Master FEノードの専用設定項目: true

#### `max_external_cache_loader_thread_pool_size`

外部メタキャッシュを読み込むための最大スレッドプールサイズ

デフォルト: 10

動的設定可能: false

Master FEノードの専用設定項目: false

#### `max_external_file_cache_num`

外部テーブルに使用するファイルキャッシュの最大数

デフォルト: 100000

動的設定可能: false

Master FEノードの専用設定項目: false

#### `max_external_schema_cache_num`

外部テーブルに使用するスキーマキャッシュの最大数

デフォルト: 10000

動的設定可能: false

Master FEノードの専用設定項目: false

#### `external_cache_expire_time_minutes_after_access`

最後のアクセス後、キャッシュ内のデータがどのくらいの時間で有効期限切れになるかを設定します。単位は分です。
External Schema CacheとHive Partition Cacheの両方に適用されます。

デフォルト: 1440

動的設定可能: false

Master FEノードの専用設定項目: false

#### `es_state_sync_interval_second`

デフォルト：10

FEはes_state_sync_interval_secs毎にes APIを呼び出してesインデックスシャード情報を取得します

### External Resources

#### `dpp_hadoop_client_path`

デフォルト：/lib/hadoop-client/hadoop/bin/hadoop

#### `dpp_bytes_per_reduce`

デフォルト：`100 * 1024 * 1024L` (100M)

#### `dpp_default_cluster`

デフォルト：palo-dpp

#### `dpp_default_config_str`

デフォルト：{
               hadoop_configs : 'mapred.job.priority=NORMAL;mapred.job.map.capacity=50;mapred.job.reduce.capacity=50;mapred.hce.replace.streaming=false;abaci.long.stored.job=true;dce.shuffle.enable=false;dfs.client.authserver.force_stop=true;dfs.client.auth.method=0'
         }

#### `dpp_config_str`

デフォルト：{
               palo-dpp : {
                     hadoop_palo_path : '/dir',
                     hadoop_configs : 'fs.default.name=hdfs://host:port;mapred.job.tracker=host:port;hadoop.job.ugi=user,password'
                  }
      }

#### `yarn_config_dir`

デフォルト: DorisFE.DORIS_HOME_DIR + "/lib/yarn-config"

デフォルトのyarn設定ファイルディレクトリ。yarnコマンドを実行する前に、このパス下に設定ファイルが存在することを毎回チェックし、存在しない場合は作成する必要があります。

#### `yarn_client_path`

デフォルト：DORIS_HOME_DIR + "/lib/yarn-client/hadoop/bin/yarn"

デフォルトのyarnクライアントパス

#### `spark_launcher_log_dir`

デフォルト： sys_log_dir + "/spark_launcher_log"

指定されたspark launcherログディレクトリ

#### `spark_resource_path`

デフォルト：none

デフォルトのspark依存関係パス

#### `spark_home_default_dir`

デフォルト：DORIS_HOME_DIR + "/lib/spark2x"

デフォルトのsparkホームディレクトリ

#### `spark_dpp_version`

デフォルト: 1.0.0

デフォルトのspark dppバージョン

### Else

#### `tmp_dir`

デフォルト: DorisFE.DORIS_HOME_DIR + "/temp_dir"

temp dirはバックアップとリストアプロセスなど、一部のプロセスの中間結果を保存するために使用されます。このディレクトリ内のファイルは、これらのプロセスが完了した後にクリーンアップされます。

#### `custom_config_dir`

デフォルト: DorisFE.DORIS_HOME_DIR + "/conf"

カスタム設定ファイルディレクトリ

`fe_custom.conf`ファイルの場所を設定します。デフォルトは`conf/`ディレクトリ内です。

一部のデプロイメント環境では、システムアップグレードにより`conf/`ディレクトリが上書きされる場合があります。これにより、ユーザーが変更した設定項目が上書きされます。この時、`fe_custom.conf`を別の指定されたディレクトリに保存して、設定ファイルが上書きされることを防ぐことができます。

#### `plugin_dir`

デフォルト：DORIS_HOME + "/plugins

プラグインインストールディレクトリ

#### `plugin_enable`

デフォルト:true

IsMutable：true

MasterOnly：true

プラグインが有効かどうか。デフォルトで有効

#### `small_file_dir`

デフォルト：DORIS_HOME_DIR/small_files

小さなファイルを保存

#### `max_small_file_size_bytes`

デフォルト：1M

IsMutable：true

MasterOnly：true

SmallFileMgrに保存される単一ファイルの最大サイズ

#### `max_small_file_number`

デフォルト：100

IsMutable：true

MasterOnly：true

SmallFileMgrに保存されるファイルの最大数

#### `enable_metric_calculator`

デフォルト：true

trueに設定すると、メトリックコレクターは固定間隔でメトリクスを収集するデーモンタイマーとして実行されます

#### `report_queue_size`

デフォルト： 100

IsMutable：true

MasterOnly：true

この閾値はFEであまりに多くのレポートタスクが蓄積されることを避けるためのもので、OOM例外を引き起こす可能性があります。100個のBackendと1000万のレプリカを持つような大規模なDorisクラスタでは、メタデータの変更（パーティション削除など）後のタブレットレポートに数秒かかる場合があります。そして1つのBackendは1分ごとにタブレット情報を報告するため、無制限にレポートを受信することは受け入れられません。将来的にはタブレットレポートの処理速度を最適化しますが、現在はキューサイズが制限を超えた場合にレポートを破棄します。
   オンライン時間コスト例：
      1. ディスクレポート: 0-1 ms
      2. タスクレポート: 0-1 ms
      3. タブレットレポート
      4. 10000レプリカ: 200ms

#### `backup_job_default_timeout_ms`

デフォルト: 86400 * 1000  (1日)

IsMutable：true

MasterOnly：true

バックアップジョブのデフォルトタイムアウト

#### `backup_upload_snapshot_batch_size`

デフォルト：10

IsMutable：true

MasterOnly：true

バックアッププロセス中にアップロードタスクに割り当てられるスナップショットの最大数。デフォルト値は10です。

#### `restore_download_snapshot_batch_size`

デフォルト：10

IsMutable：true

MasterOnly：true

リストアプロセス中にダウンロードタスクに割り当てられるスナップショットの最大数。デフォルト値は10です。

#### `max_backup_restore_job_num_per_db`

デフォルト: 10

この設定は主に各データベースで記録されるバックアップ/リストアタスクの数を制御するために使用されます。

#### `max_backup_tablets_per_job`

デフォルト: 300000

IsMutable：true

MasterOnly：true

1つのバックアップジョブに関わるタブレットの最大数を制御し、過度のメタデータ保存によるFE OOMを防ぎます。

#### `enable_quantile_state_type`

デフォルト：false

IsMutable：true

MasterOnly：true

quantile_stateデータタイプを有効にするかどうか

#### `enable_date_conversion`

デフォルト：true

IsMutable：true

MasterOnly：true

FEは自動的にdate/datetime

```
Set the database transaction quota
ALTER DATABASE db_name SET TRANSACTION QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```
#### `prefer_compute_node_for_external_table`

デフォルト：false

IsMutable：true

MasterOnly：false

trueに設定すると、external tableに対するクエリは計算ノードへの割り当てを優先します。計算ノードの最大数は`min_backend_num_for_external_table`によって制御されます。
falseに設定すると、external tableに対するクエリは任意のノードに割り当てられます。

#### `min_backend_num_for_external_table`

デフォルト：3

IsMutable：true

MasterOnly：false

`prefer_compute_node_for_external_table`がtrueの場合にのみ有効です。計算ノード数がこの値より少ない場合、external tableに対するクエリは、総ノード数がこの値に達するように、いくつかのmixノードの取得を試行します。
計算ノード数がこの値より大きい場合、external tableに対するクエリは計算ノードのみに割り当てられます。

#### `infodb_support_ext_catalog`

デフォルト: false

IsMutable: true

MasterOnly: false

falseの場合、information_schemaデータベースのテーブルからselectを実行すると、
結果にはexternal catalog内のテーブルの情報が含まれません。
これは、external catalogに到達できない場合のクエリ時間を回避するためです。

#### `enable_query_hit_stats`

デフォルト: false

IsMutable: true

MasterOnly: false

クエリヒット統計を有効にするかどうかを制御します。デフォルトはfalseです。

#### `div_precision_increment`

デフォルト: 4

この変数は、`/`演算子で実行される除算演算の結果のスケールを増加させる桁数を示します。

#### `enable_convert_light_weight_schema_change`

デフォルト：true

一時的な設定オプションです。有効にすると、すべてのolapテーブルをlight schema changeに自動的に変更するバックグラウンドスレッドが開始されます。変更結果は`show convert_light_schema_change [from db]`コマンドで確認でき、すべてのnon-light schema changeテーブルの変換結果が表示されます。

#### `disable_local_deploy_manager_drop_node`

デフォルト：true

LocalDeployManagerによるノードの削除を禁止し、cluster.infoファイルのエラーによってノードが削除されることを防ぎます。

#### `mysqldb_replace_name`

デフォルト: mysql

MySQLエコシステムとの互換性を確保するため、Dorisにはmysqlという組み込みデータベースが含まれています。このデータベースがユーザー独自のデータベースと競合する場合は、このフィールドを変更して、Doris組み込みMySQLデータベースの名前を別の名前に置き換えてください。

#### `max_auto_partition_num`

デフォルト値: 2000

自動パーティションテーブルで、ユーザーが誤って大量のパーティションを作成することを防ぐため、OLAPテーブルあたりで許可されるパーティション数は`max_auto_partition_num`です。デフォルトは2000です。

#### `profile_manager_gc_interval_seconds`

デフォルト値: 1

ProfileManagerがプロファイルガベージコレクションを実行する間隔を制御するために使用されます。ガベージコレクション中、ProfileManagerはメモリとディスクから余分で期限切れのプロファイルを削除してメモリを節約します。

### Compute and Storage Disaggregated Mode

#### `cluster_id`

デフォルト：-1

node（FEまたはBE）は、同じcluster idを持つ場合、同じDorisクラスターに属するとみなされます。compute and storage disaggregated modeでは、ランダムなintを1つ指定する必要があります。

#### `deploy_mode`

デフォルト: ""

説明: FEが実行されるモード。`cloud`はストレージ・計算分離モードを示します。

#### `meta_service_endpoint`

デフォルト: ""

meta serviceのエンドポイントは'host1:port,host2:port'の形式で指定する必要があります。この設定はstorage and compute disaggregated modeに必要です。
