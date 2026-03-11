---
{
  "title": "FE設定 | Config",
  "language": "ja",
  "toc_min_heading_level": 2,
  "toc_max_heading_level": 4,
  "description": "DorisのFrontend（FE）設定パラメータの完全リファレンスガイド。メタデータ管理、クエリエンジン、ロード/エクスポート、ストレージ設定を含む。",
  "sidebar_label": "FE 設定"
}
---
# FE設定

このドキュメントでは、主にFEの関連設定項目について説明します。

FE設定ファイル`fe.conf`は通常、FEデプロイパスの`conf/`ディレクトリに保存されます。バージョン0.14では、もう一つの設定ファイル`fe_custom.conf`が導入されます。この設定ファイルは、運用中にユーザーが動的に設定し永続化された設定項目を記録するために使用されます。

FEプロセスが開始されると、まず`fe.conf`の設定項目を読み込み、次に`fe_custom.conf`の設定項目を読み込みます。`fe_custom.conf`の設定項目は`fe.conf`の同じ設定項目を上書きします。

`fe_custom.conf`ファイルの場所は、`custom_config_dir`設定項目を通じて`fe.conf`で設定できます。

## 設定項目の表示

FEの設定項目を表示する方法は2つあります：

1. FE webページ

    ブラウザでFE webページ`http://fe_host:fe_http_port/variable`を開きます。`Configure Info`で現在有効なFE設定項目を確認できます。

2. コマンドによる表示

    FEが開始された後、MySQLクライアントで以下のコマンドを使用してFEの設定項目を表示できます。具体的な構文については[SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG)を参照してください：

    `SHOW FRONTEND CONFIG;`

    結果の各列の意味は以下の通りです：

    * Key: 設定項目の名前。
    * Value: 現在の設定項目の値。
    * タイプ: 設定項目値の型（integerやstringなど）。
    * IsMutable: 動的設定が可能かどうか。trueの場合、設定項目は実行時に動的設定できます。falseの場合、設定項目は`fe.conf`でのみ設定可能で、FE再起動後に有効になります。
    * MasterOnly: Master FEノード固有の設定項目かどうか。trueの場合、設定項目はMaster FEノードでのみ意味があり、他のタイプのFEノードでは無意味です。falseの場合、設定項目はすべてのタイプのFEノードで意味があります。
    * コメント: 設定項目の説明。

## 設定項目の設定

FE設定項目を設定する方法は2つあります：

1. 静的設定

    `conf/fe.conf`ファイルで設定項目を追加・設定します。`fe.conf`の設定項目はFEプロセス開始時に読み込まれます。`fe.conf`にない設定項目はデフォルト値を使用します。

2. MySQLプロトコルによる動的設定

    FE開始後、以下のコマンドで設定項目を動的に設定できます。このコマンドには管理者権限が必要です。

    `ADMIN SET FRONTEND CONFIG (" fe_config_name "=" fe_config_value ");`

    すべての設定項目が動的設定をサポートしているわけではありません。`SHOW FRONTEND CONFIG;`コマンド結果の`IsMutable`列で動的設定がサポートされているかを確認できます。

    `MasterOnly`の設定項目が変更された場合、コマンドは直接Master FEに転送され、Master FE内の対応する設定項目のみが変更されます。

    **この方法で変更された設定項目は、FEプロセス再起動後に無効になります。**

    このコマンドの詳細なヘルプは、`HELP ADMIN SET CONFIG;`コマンドで確認できます。

3. HTTPプロトコルによる動的設定

    詳細については、[Set Config Action](../open-api/fe-http/set-config-action)を参照してください

    この方法では、変更された設定項目を永続化することもできます。設定項目は`fe_custom.conf`ファイルに永続化され、FE再起動後も有効です。

## 例

1. `async_pending_load_task_pool_size`の変更

    `SHOW FRONTEND CONFIG;`で確認すると、この設定項目は動的設定できません（`IsMutable`がfalse）。`fe.conf`に以下を追加する必要があります：

    `async_pending_load_task_pool_size = 20`

    その後、FEプロセスを再起動して設定を有効にします。

2. `dynamic_partition_enable`の変更

    `SHOW FRONTEND CONFIG;`で確認すると、この設定項目は動的設定可能です（`IsMutable`がtrue）。またMaster FE固有の設定です。まず任意のFEに接続し、以下のコマンドを実行して設定を変更できます：

    ```
    ADMIN SET FRONTEND CONFIG ("dynamic_partition_enable" = "true"); `
    ```
その後、以下のコマンドで変更された値を確認できます：

    ```
    set forward_to_master = true;
    SHOW FRONTEND CONFIG;
    ```
上記方法で修正した後、Master FEが再起動するかMaster選出が実行されると、設定は無効になります。設定項目を直接`fe.conf`に追加してFEを再起動することで、設定項目を永続化できます。

3. `max_distribution_pruner_recursion_depth`を修正する

    `SHOW FRONTEND CONFIG;`を通じて、設定項目が動的に設定可能（`IsMutable`がtrue）であることを確認できます。これはMaster FE固有のものではありません。

    同様に、動的設定修正コマンドによって設定を修正できます。この設定はMaster FE固有ではないため、ユーザーは異なるFEに個別に接続して設定を動的に修正し、すべてのFEが修正された設定値を使用するようにする必要があります。

## 設定項目

### メタデータとクラスター

#### `meta_dir`

デフォルト：DORIS_HOME_DIR + "/doris-meta"

型: string 説明: Dorisメタデータがここに保存されます。このディレクトリのストレージは以下が強く推奨されます：

* 高い書き込み性能 (SSD)
* 安全 (RAID)

#### `catalog_try_lock_timeout_ms`

デフォルト：5000 （ms）

IsMutable：true

catalogロックのtryLockタイムアウト設定。通常は変更する必要はありません。何かをテストする必要がある場合を除きます。

#### `enable_bdbje_debug_mode`

デフォルト：false

trueに設定すると、FEはBDBJEデバッグモードで起動されます

#### `max_bdbje_clock_delta_ms`

デフォルト：5000 （5s）

非master FEとMaster FEホスト間で許容される最大クロックスキューを設定します。この値は、非master FEがBDBJEを介してmaster FEへの接続を確立するたびにチェックされます。クロックスキューがこの値より大きい場合、接続は破棄されます。

#### `metadata_failure_recovery`

デフォルト：false

trueの場合、FEはbdbjeレプリケーショングループをリセット（つまり、すべての選出可能ノード情報を削除）し、Masterとして起動することになります。すべての選出可能ノードが起動できない場合、メタデータを別のノードにコピーし、この設定をtrueに設定してFEの再起動を試行できます。

#### `txn_rollback_limit`

デフォルト：100

グループへの再参加を試行する際にbdbjeがロールバックできる最大txn数

#### `grpc_threadmgr_threads_nums`

デフォルト: 4096

grpc_threadmgrでgrpcイベントを処理するスレッド数。

#### `bdbje_replica_ack_timeout_second`

デフォルト：10 (s)

bdbjeへの書き込み時のレプリカackタイムアウト。比較的大きなログを書き込む際に、ack時間がタイムアウトし、ログ書き込み失敗を引き起こす可能性があります。この場合、この値を適切に増加させることができます。

#### `bdbje_lock_timeout_second`

デフォルト：5

bdbje操作のロックタイムアウト。FE WARNログに多くのLockTimeoutExceptionがある場合、この値を増加させてみることができます

#### `bdbje_heartbeat_timeout_second`

デフォルト：30

masterとfollower間のbdbjeハートビートタイムアウト。デフォルトは30秒で、bdbjeのデフォルト値と同じです。ネットワークで一時的な問題が発生している場合、または予期しない長いJava GCが問題を引き起こしている場合、この値を増加させて偽のタイムアウトの可能性を減らすことができます

#### `replica_ack_policy`

デフォルト：SIMPLE_MAJORITY

選択肢: ALL, NONE, SIMPLE_MAJORITY

bdbjeのレプリカackポリシー。詳細については以下を参照: <http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.ReplicaAckPolicy.html>

#### `replica_sync_policy`

デフォルト：SYNC

選択肢：SYNC, NO_SYNC, WRITE_NO_SYNC

Follower FEのbdbje同期ポリシー。

#### `master_sync_policy`

デフォルト：SYNC

選択肢：SYNC, NO_SYNC, WRITE_NO_SYNC

Master FEのbdbje同期ポリシー。1つのFollower FEのみをデプロイする場合、これを'SYNC'に設定してください。3つ以上のFollower FEをデプロイする場合、これと以下の'replica_sync_policy'をWRITE_NO_SYNCに設定できます。詳細については以下を参照: <http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.SyncPolicy.html>

#### `bdbje_reserved_disk_bytes`

レプリケートされたJE環境で保持する予約領域のバイト数の希望上限。

デフォルト: 1073741824

動的設定可能か: false

Master FEノード固有の設定項目か: false

#### `ignore_meta_check`

デフォルト：false

IsMutable：true

trueの場合、非master FEはMaster FEと自身の間のメタデータ遅延ギャップを無視し、メタデータ遅延ギャップが*meta_delay_toleration_second*を超えている場合でも無視します。非master FEは引き続き読み取りサービスを提供します。
これは何らかの理由でMaster FEを比較的長時間停止させたいが、それでも非master FEに読み取りサービスを提供させたい場合に役立ちます。

#### `meta_delay_toleration_second`

デフォルト: 300 (5 min)

メタデータ遅延ギャップが*meta_delay_toleration_second*を超える場合、非master FEはサービス提供を停止します

#### `edit_log_port`

デフォルト：9010

bdbjeポート

#### `edit_log_type`

デフォルト：BDB

Edit logタイプ。
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

trueに設定すると、checkpointスレッドは使用されているJVMメモリパーセントに関係なくcheckpointを作成します

#### `metadata_checkpoint_memory_threshold`

デフォルト：60 （60%）

IsMutable：true

MasterOnly：true

JVMメモリ使用率（heapまたはold mem pool）がこの閾値を超える場合、OOMを避けるためにcheckpointスレッドは動作しません。

#### `max_same_name_catalog_trash_num`

catalogごみ箱内で同名のメタ情報の最大数を設定するために使用されます。最大値を超えると、最も早く削除されたメタごみが完全に削除され、復旧できなくなります。0は同名オブジェクトを保持しないことを意味します。< 0は制限なしを意味します。

注意: 同名メタデータの判定は一定範囲に限定されます。例えば、同名データベースの判定は同一クラスターに限定され、同名テーブルの判定は同一データベース（同じdatabase id）に限定され、同名パーティションの判定は同一データベース（同じdatabase id）および同一テーブル（同じtable id）に限定されます。

デフォルト: 3

動的設定可能か: true

Master FEノード固有の設定項目か: true

#### `cluster_id`

デフォルト：-1

node（FEまたはBE）は同じcluster idを持つ場合、同じDorisクラスターに属すると見なされます。cluster idは通常、master FEが最初に起動する際に生成されるランダムな整数です。任意に指定することもできます。

#### `heartbeat_mgr_blocking_queue_size`

デフォルト：1024

MasterOnly：true

heartbeat_mgrでハートビートタスクを格納するためのブロッキングキューサイズ。

#### `heartbeat_mgr_threads_num`

デフォルト：8

MasterOnly：true

heartbeat_mgrでハートビートイベントを処理するスレッド数。

#### `disable_cluster_feature`

デフォルト：true

IsMutable：true

マルチクラスター機能はバージョン0.12で非推奨になります。この設定をtrueに設定すると、クラスター機能に関連するすべての操作が無効になります：

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

前方互換性のため、後で削除予定。イメージファイルダウンロード時のトークンチェック。

#### `enable_multi_tags`

デフォルト: false

動的設定可能か: false

Master FEノード固有の設定項目か: true

単一BEのマルチタグ機能を有効にするかどうか

#### `initial_root_password`

rootユーザーの初期2段階SHA-1暗号化パスワードを設定します。デフォルトは''で、rootパスワードなしを意味します。rootユーザーに対する後続の`set password`操作は初期rootパスワードを上書きします。

例: 平文パスワード`root@123`を設定したい場合。Doris SQL `select password('root@123')`を実行して暗号化パスワード`*A00C34073A26B40AB4307650BFB9309D6BFA6999`を生成できます。

デフォルト: 空文字列

動的設定可能か: false

Master FEノード固有の設定項目か: true

#### `enable_cooldown_replica_affinity`

ユーザーは冷却されたコピーを最初にスキャンに使用するかどうかを選択できます。デフォルトはtrueです

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

型: string

説明: *InetAddress.getByName*を使用してIPアドレスを取得する代わりに、FEのIPアドレスを明示的に設定します。通常、*InetAddress.getByName*で期待される結果が得られない場合に使用します。IPアドレスのみサポートされ、ホスト名はサポートされません。

デフォルト値: 0.0.0.0

#### `priority_networks`

デフォルト：none

多くのIPを持つサーバーの選択戦略を宣言します。このリストに一致するIPは最大1つである必要があります。これはCIDR記法でセミコロン区切り形式のリストです（例：10.10.10.0/24）。このルールに一致するIPがない場合、ランダムに1つが選択されます。

#### `http_port`

デフォルト：8030

HTTPバインドポート。すべてのFE httpポートは現在同じである必要があります。

#### `https_port`

デフォルト：8050

HTTPSバインドポート。すべてのFE httpsポートは現在同じである必要があります。

#### `enable_https`

デフォルト：false

HTTPS有効フラグ。値がfalseの場合、httpがサポートされます。それ以外の場合、httpとhttpsの両方がサポートされ、httpリクエストは自動的にhttpsにリダイレクトされます。
enable_httpsがtrueの場合、fe.confでSSL証明書情報を設定する必要があります。

#### `enable_ssl`

デフォルト：true

trueに設定すると、dorisはSSLプロトコルに基づいてmysqlとの暗号化チャンネルを確立します。

#### `qe_max_connection`

デフォルト：1024

FEあたりの最大接続数。

#### `check_java_version`

デフォルト：true

Dorisはコンパイル時と実行時のJavaバージョンが互換性があるかチェックし、互換性がない場合、Javaバージョン不一致例外メッセージを投げて起動を終了します

#### `rpc_port`

デフォルト：9020

FE Thrift サーバーポート

#### `thrift_server_type`

この設定はFEのThrift Serviceで使用されるサービスモデルを表し、String型で大文字小文字を区別しません。

このパラメーターが'SIMPLE'の場合、'TSimpleServer'モデルが使用されます。これは一般的に本番には適さず、テスト用に限定されます。

パラメーターが'THREADED'の場合、'TThreadedSelectorServer'モデルが使用されます。これはノンブロッキングI/Oモデル、即ちmaster-slave Reactorモデルで、大量の同時接続リクエストにタイムリーに応答でき、ほとんどのシナリオで良好な性能を発揮します。

このパラメーターが`THREAD_POOL`の場合、`TThreadPoolServer`モデルが使用されます。ブロッキングI/Oモデルで、スレッドプールを使用してユーザー接続を処理し、同時接続数はスレッドプール数によって制限されます。同時リクエスト数を事前に推定でき、十分なスレッドリソースコストを許容できる場合、このモデルはより良いパフォーマンスを発揮します。このサービスモデルがデフォルトで使用されます

#### `thrift_server_max_worker_threads`

デフォルト：4096

thriftサーバーの最大ワーカースレッド数

#### `thrift_backlog_num`

デフォルト：1024

thriftサーバーのbacklog_num。このbacklog_numを拡大する場合、その値がlinux /proc/sys/net/core/somaxconn設定より大きいことを確認してください

#### `thrift_client_timeout_ms`

デフォルト：0

thriftサーバーの接続タイムアウトとソケットタイムアウト設定。

thrift_client_timeout_msの値は読み取りタイムアウトを防ぐため0に設定されています。

#### `thrift_max_message_size`

デフォルト: 100MB

thriftサーバーの（受信）メッセージの最大サイズ（バイト単位）。クライアントが送信するメッセージのサイズがこの制限を超える場合、Thriftサーバーはリクエストを拒否し接続を閉じます。その結果、クライアントは「connection has been closed by peer」エラーが発生します。この場合、このパラメーターを増加させてみてください。

#### `use_compact_thrift_rpc`

デフォルト: true

圧縮形式を使用してクエリプラン構造を送信するかどうか。オンにすると、クエリプラン構造のサイズを約50%削減でき、一部の「send fragment timeout」エラーを回避できます。
ただし、高同時実行の小さなクエリシナリオでは、同時実行数が約10%削減される可能性があります。

#### `grpc_max_message_size_bytes`

デフォルト：1G

GRPCクライアントチャンネルの初期フローウィンドウサイズを設定するために使用され、最大メッセージサイズにも使用されます。結果セットが大きい場合、この値を増加させる必要があるかもしれません。

#### `max_mysql_service_task_threads_num`

デフォルト：4096

Taskイベントを処理するスレッド数。

#### `mysql_service_io_threads_num`

デフォルト：4

FEがNIOモデルに基づいてMySQLサーバーを起動する際の、IOイベントを処理するスレッド数。

#### `mysql_nio_backlog_num`

デフォルト：1024

mysql nioサーバーのbacklog_num。このbacklog_numを拡大する場合、同時にlinux /proc/sys/net/core/somaxconnファイルの値を拡大してください

#### `broker_timeout_ms`

デフォルト：10000 （10s）

デフォルトbroker RPCタイムアウト

#### `backend_rpc_timeout_ms`

FeがBEにrpcリクエストを送信するタイムアウトミリ秒

デフォルト: 60000

動的設定可能か: false

Master FEノード固有の設定項目か: true

#### `drop_backend_after_decommission`

デフォルト：false

IsMutable：true

MasterOnly：true

1. この設定は、BEが正常に廃棄された後、システムがBEを削除するかどうかを制御するために使用されます。trueの場合、BE nodeはBEが正常にオフラインになった後削除されます。falseの場合、BEが正常にオフラインになった後、BEはDECOMMISSION状態に残りますが削除されません。

   この設定は特定のシナリオで役割を果たすことができます。Dorisクラスターの初期状態がBEノードあたり1ディスクであるとします。しばらく実行した後、システムは垂直拡張され、つまり各BEノードに2つの新しいディスクが追加されました。Dorisは現在BE内のディスク間でのデータバランシングをサポートしていないため、初期ディスクのデータ量は常に新しく追加されたディスクのデータ量よりもはるかに多い可能性があります。この時、以下の操作により手動でディスク間バランシングを実行できます：

   1. 設定項目をfalseに設定します。
   2. 特定のBEノードでdecommission操作を実行します。この操作により、BE上のすべてのデータが他のノードに移行されます。
   3. decommission操作が完了した後、BEは削除されません。この時、BEのdecommission状態を取り消します。その後、データは他のBEノードからこのノードに戻るようにバランシングされ始めます。この時、データはBEのすべてのディスクに均等に分散されます。
   4. すべてのBEノードに対して順次ステップ2と3を実行し、最終的にすべてのノードのディスクバランシングの目的を達成します

#### `max_backend_down_time_second`

デフォルト: 3600 (1時間)

IsMutable：true

MasterOnly：true

backendが*max_backend_down_time_second*間ダウンしている場合、BACKEND_DOWNイベントがトリガーされます。

#### `disable_backend_black_list`

BEブラックリスト機能を無効にするために使用されます。この機能が無効にされると、BEへのクエリリクエストが失敗した場合、BEはブラックリストに追加されません。
このパラメーターは回帰テスト環境に適用され、偶発的なバグが大量の回帰テストの失敗を引き起こすことを減らします。

デフォルト: false

動的設定可能か: true

Master FEノード固有の設定項目か: false

#### `max_backend_heartbeat_failure_tolerance_count`

BEノードハートビート失敗の最大許容回数。連続するハートビート失敗回数がこの値を超える場合、BE状態はdeadに設定されます。
このパラメーターは回帰テスト環境に適用され、偶発的なハートビート失敗が大量の回帰テスト失敗を引き起こすことを減らします。

デフォルト: 1

動的設定可能か: true

Master FEノード固有の設定項目か: true

### `abort_txn_after_lost_heartbeat_time_second`

ハートビート失失後のトランザクション中止時間。デフォルト値は300で、ハートビート失失300秒後にbeのトランザクションが中止されることを意味します。

デフォルト: 300(s)

動的設定可能か: true

Master FEノード固有の設定項目か: true

#### `enable_access_file_without_broker`

デフォルト：false

IsMutable：true

MasterOnly：true

この設定は、brokerを介してbosまたは他のクラウドストレージにアクセスする際にbrokerをスキップしようとするために使用されます

#### `agent_task_resend_wait_time_ms`

デフォルト：5000

IsMutable：true

MasterOnly：true

この設定は、agent_taskのcreate_timeが設定されている際にagent taskを再送信するかどうかを決定します。current_time - create_time > agent_task_resend_wait_time_msの場合のみ、ReportHandlerはagent taskを再送信できます。

この設定は現在主に`PUBLISH_VERSION` agent taskの重複送信問題を解決するために使用されます。この設定の現在のデフォルト値は5000で、実験的な値です。

agent taskをAgentTaskQueueに送信してからbeに送信するまでには一定の時間遅延があるため、この設定の値を増加させることでagent taskの重複送信問題を効果的に解決できますが、

同時に失敗またはexecution失敗したagent taskの再実行が延長された期間発生します

#### `max_agent_task_threads_num`

デフォルト：4096

MasterOnly：true

agent taskスレッドプールでagent taskを処理するスレッドの最大数。

#### `remote_fragment_exec_timeout_ms`

デフォルト：30000 （ms）

IsMutable：true

非同期リモートfragmentを実行するタイムアウト。通常の場合、非同期リモートfragmentは短時間で実行されます。システムが高負荷状態にある場合、このタイムアウトを長く設定してみてください。

#### `auth_token`

デフォルト：empty

内部認証に使用されるクラスタートークン。

#### `enable_http_server_v2`

デフォルト: 公式0.14.0バージョンリリース後はデフォルトtrue、リリース前はデフォルトfalse

HTTP サーバー V2はSpringBootによって実装されています。フロントエンドとバックエンドを分離したアーキテクチャを使用します。HTTPv2が有効な場合のみ、ユーザーは新しいフロントエンドUIインターフェースを使用できます。

#### `http_api_extra_base_path`

一部のデプロイメント環境では、ユーザーはHTTP APIの統一プレフィックスとして追加のベースパスを指定する必要があります。このパラメーターはユーザーが追加のプレフィックスを指定するために使用されます。
設定後、ユーザーは`GET /api/basepath`インターフェースを通じてパラメーター値を取得できます。新しいUIもURLを組み立てるため最初にこのベースパスを取得しようとします。`enable_http_server_v2`がtrueの場合のみ有効です。

デフォルトは空、つまり設定されていません

#### `jetty_server_acceptors`

デフォルト：2

#### `jetty_server_selectors`

デフォルト：4

#### `jetty_server_workers`

デフォルト：0

上記の3つのパラメーターにより、Jettyのスレッドアーキテクチャモデルは非常にシンプルで、acceptors、selectorsおよびworkersの3つのスレッドプールに分かれています。Acceptorsは新しい接続の受け入れを担当し、その後selectorsに渡してHTTPメッセージプロトコルの解析を処理し、最後にworkersがリクエストを処理します。最初の2つのスレッドプールはノンブロッキングモデルを採用し、1つのスレッドで多くのsocketの読み書きを処理できるため、スレッドプール数は少なくなります。

ほとんどのプロジェクトでは、1-2個のacceptorsスレッドのみが必要で、2～4個のselectorsスレッドで十分です。Workersは阻害的なビジネスロジックで、データベース操作が多く、大量のスレッドが必要です。具体的な数はアプリケーションのQPSとIOイベントの比率に依存します。QPSが高いほどより多くのスレッドが必要で、IOの比率が高いほど待機中のスレッドが多くなり、合計でより多くのスレッドが必要になります。

Workerスレッドプールはデフォルトでは設定されていません。必要に応じて設定してください

#### `jetty_server_max_http_post_size`

デフォルト：`100 * 1024 * 1024` （100MB）

これはputまたはpostメソッドでアップロードされるファイルの最大バイト数です。デフォルト値：100MB

#### `jetty_server_max_http_header_size`

デフォルト：1048576 （1M）

httpヘッダーサイズ設定パラメーター。デフォルト値は1Mです。

#### `http_sql_submitter_max_worker_threads`

デフォルト：2

http sql submitterの最大ワーカースレッド数

#### `http_load_submitter_max_worker_threads`

デフォルト：2

http uploadサブミッターの最大ワーカースレッド数

### クエリエンジン

#### `default_max_query_instances`

ユーザープロパティmax_query_instancesが0以下の場合のデフォルト値。この設定はユーザーのインスタンス最大数を制限するために使用されます。このパラメーターが0以下の場合は無制限を意味します。

デフォルト値は-1

#### `max_query_retry_time`

デフォルト：3

IsMutable：true

クエリ再試行回数。RPC例外が発生し、ユーザーに結果が送信されていない場合、クエリは再試行される可能性があります。雪崩災害を避けるため、この数を減らすことができます

#### `max

```text
current running txns on db xxx is xx, larger than limit xx
```
このエラーが発生した場合、クラスター内で現在実行中のロードジョブが設定値を超過していることを意味します。この場合、ビジネス側で待機し、ロードジョブを再試行することを推奨します。

Connectorを使用する場合、このパラメータの値を適切に調整することができ、数千単位でも問題ありません

#### `using_old_load_usage_pattern`

Default：false

IsMutable：true

MasterOnly：true

trueに設定すると、処理エラーが発生したinsert文でもユーザーにラベルが返されます。ユーザーはこのラベルを使用してロードジョブのステータスを確認できます。デフォルト値はfalseで、これはinsert操作でエラーが発生した場合、ロードラベルなしで例外が直接ユーザークライアントに投げられることを意味します。

#### `disable_load_job`

Default：false

IsMutable：true

MasterOnly：true

これがtrueに設定されている場合

* すべての保留中のロードジョブは、begin txn APIの呼び出し時に失敗します
* すべての準備済みロードジョブは、commit txn APIの呼び出し時に失敗します
* すべてのコミット済みロードジョブは公開待ちになります

#### `commit_timeout_second`

Default：30

IsMutable：true

MasterOnly：true

1つのトランザクション前に挿入されたすべてのデータがコミットされるまでの最大待機時間
これは「commit」コマンドのタイムアウト秒数です

#### `max_unfinished_load_job`

Default：1000

IsMutable：true

MasterOnly：true

PENDING、ETL、LOADING、QUORUM_FINISHEDを含むロードジョブの最大数。この数を超えると、ロードジョブの送信は許可されません

#### `db_used_data_quota_update_interval_secs`

Default：300 (s)

IsMutable：true

MasterOnly：true

1つのマスターデーモンスレッドが`db_used_data_quota_update_interval_secs`ごとにdbトランザクションマネージャーのデータベース使用データクォータを更新します

より良いデータロードパフォーマンスのために、データロード前にデータベースで使用されているデータ量がクォータを超えているかどうかのチェックにおいて、データベースで既に使用されているデータ量をリアルタイムで計算せず、デーモンスレッドの定期的に更新された値を取得します。

この設定は、データベース使用データ量の値を更新する時間間隔を設定するために使用されます

#### `disable_show_stream_load`

Default：false

IsMutable：true

MasterOnly：true

show stream loadを無効にし、メモリ内のstream loadレコードをクリアするかどうか。

#### `max_stream_load_record_size`

Default：5000

IsMutable：true

MasterOnly：true

メモリに保存できる最近のstream loadレコードのデフォルト最大数。

#### `fetch_stream_load_record_interval_second`

Default：120

IsMutable：true

MasterOnly：true

stream loadレコードの取得間隔。

#### `max_bytes_per_broker_scanner`

Default：`500 * 1024 * 1024 * 1024L`  （500G）

IsMutable：true

MasterOnly：true

1つのbroker loadジョブで1つのbroker scannerが処理できる最大バイト数。通常、各Backendsには1つのbroker scannerがあります。

#### `default_load_parallelism`

Default: 8

IsMutable：true

MasterOnly：true

単一ノード上でのbroker load実行プランのデフォルト並列度。
ユーザーがbroker load送信時に並列度を設定した場合、このパラメータは無視されます。
このパラメータは`max broker concurrency`、`min bytes per broker scanner`などの複数の設定と共にインポートタスクの並行性を決定します。

#### `max_broker_concurrency`

Default：10

IsMutable：true

MasterOnly：true

broker scannerの最大並行度。

#### `min_bytes_per_broker_scanner`

Default：67108864L (64M)

IsMutable：true

MasterOnly：true

単一のbroker scannerが読み取る最小バイト数。

#### `period_of_auto_resume_min`

Default：5 （s）

IsMutable：true

MasterOnly：true

Routine loadの自動復旧サイクル

#### `max_tolerable_backend_down_num`

Default：0

IsMutable：true

MasterOnly：true

1つでもBEがダウンしている限り、Routine Loadは自動復旧できません

#### `max_routine_load_task_num_per_be`

Default：5

IsMutable：true

MasterOnly：true

BE当たりの最大並行routine loadタスク数。これはBEに送信されるroutine loadタスク数を制限するためのもので、BEの設定'routine_load_thread_pool_size'（デフォルト10）より少なくする必要があります。これはBE上のroutine loadタスクスレッドプールサイズです。

#### `max_routine_load_task_concurrent_num`

Default：5

IsMutable：true

MasterOnly：true

単一のroutine loadジョブの最大並行routine loadタスク数

#### `max_routine_load_job_num`

Default：100

NEED_SCHEDULED、RUNNING、PAUSEを含む最大routine loadジョブ数

#### `desired_max_waiting_jobs`

Default：100

IsMutable：true

MasterOnly：true

routine loadとロードのバージョン2の待機ジョブのデフォルト数。これは望ましい数です。マスターの切り替えなどの一部の状況では、現在の数がdesired_max_waiting_jobsを超える場合があります。

#### `disable_hadoop_load`

Default：false

IsMutable：true

MasterOnly：true

hadoopクラスターを使用したロードは将来廃止予定です。trueに設定してこの種類のロードを無効にします。

#### `enable_spark_load`

Default：false

IsMutable：true

MasterOnly：true

spark loadを一時的に有効にするかどうか、デフォルトでは有効になっていません

**注意：** このパラメータはバージョン1.2で削除され、spark_loadはデフォルトで有効になっています

#### `spark_load_checker_interval_second`

Default：60

Spark loadスケジューラーの実行間隔、デフォルト60秒

#### `async_loading_load_task_pool_size`

Default：10

IsMutable：false

MasterOnly：true

loading_loadタスクエグゼキュータープールサイズ。このプールサイズは実行中のloading_loadタスクの最大数を制限します。

現在、broker loadのloading_loadタスクのみを制限しています

#### `async_pending_load_task_pool_size`

Default：10

IsMutable：false

MasterOnly：true

pending_loadタスクエグゼキュータープールサイズ。このプールサイズは実行中のpending_loadタスクの最大数を制限します。

現在、broker loadとspark loadのpending_loadタスクのみを制限しています。

'max_running_txn_num_per_db'より少なくする必要があります

#### `async_load_task_pool_size`

Default：10

IsMutable：false

MasterOnly：true

この設定は旧バージョンとの互換性のためのもので、この設定はasync_loading_load_task_pool_sizeに置き換えられており、将来削除される予定です。

#### `enable_single_replica_load`

Default：false

IsMutable：true

MasterOnly：true

stream loadとbroker loadで単一レプリカ書き込みを有効にするかどうか。

#### `min_load_timeout_second`

Default：1 （1s）

IsMutable：true

MasterOnly：true

すべてのタイプのロードに適用される最小stream loadタイムアウト

#### `max_stream_load_timeout_second`

Default: 259200 (3 day)

IsMutable：true

MasterOnly：true

この設定はstream loadのタイムアウト設定を制限するために特別に使用されます。ユーザーの大きなタイムアウト設定により、失敗したstream loadトランザクションが短時間内にキャンセルできないことを防ぐためです

#### `max_load_timeout_second`

Default: 259200 (3 day)

IsMutable：true

MasterOnly：true

stream load以外のすべてのタイプのロードに適用される最大ロードタイムアウト

#### `stream_load_default_timeout_second`

Default: 86400 * 3 (3 day)

IsMutable：true

MasterOnly：true

デフォルトstream loadとstreaming mini loadタイムアウト

#### `stream_load_default_precommit_timeout_second`

Default：3600（s）

IsMutable：true

MasterOnly：true

デフォルトstream load事前送信タイムアウト

#### `stream_load_default_memtable_on_sink_node`

Default：false

IsMutable：true

MasterOnly：true

デフォルトでstream loadのsinkノード上でmemtableを有効にします。
HTTPヘッダー`memtable_on_sink_node`が設定されていない場合。

#### `insert_load_default_timeout_second`

Default: 3600 (1 hour)

IsMutable：true

MasterOnly：true

デフォルトinsert loadタイムアウト

#### `mini_load_default_timeout_second`

Default: 3600 (1 hour)

IsMutable：true

MasterOnly：true

デフォルト非streaming mini loadタイムアウト

#### `broker_load_default_timeout_second`

Default: 14400 (4 hour)

IsMutable：true

MasterOnly：true

デフォルトbroker loadタイムアウト

#### `spark_load_default_timeout_second`

Default: 86400  (1 day)

IsMutable：true

MasterOnly：true

デフォルトspark loadタイムアウト

#### `hadoop_load_default_timeout_second`

Default: 86400 * 3   (3 day)

IsMutable：true

MasterOnly：true

デフォルトhadoop loadタイムアウト

#### `load_running_job_num_limit`

Default：0

IsMutable：true

MasterOnly：true

ロードタスク数の制限、デフォルトは0、制限なし

#### `load_input_size_limit_gb`

Default：0

IsMutable：true

MasterOnly：true

Loadジョブで入力されるデータのサイズ、デフォルトは0、制限なし

#### `load_etl_thread_num_normal_priority`

Default：10

NORMAL優先度etl loadジョブの並行度。何をしているかを理解していない限り、これを変更しないでください。

#### `load_etl_thread_num_high_priority`

Default：3

HIGH優先度etl loadジョブの並行度。何をしているかを理解していない限り、これを変更しないでください

#### `load_pending_thread_num_normal_priority`

Default：10

NORMAL優先度pending loadジョブの並行度。何をしているかを理解していない限り、これを変更しないでください。

#### `load_pending_thread_num_high_priority`

Default：3

HIGH優先度pending loadジョブの並行度。Loadジョブ優先度はHIGHまたはNORMALとして定義されます。すべてのmini batch loadジョブはHIGH優先度、その他のタイプのloadジョブはNORMAL優先度です。優先度は遅いloadジョブが長時間スレッドを占有することを避けるために設定されています。これは単なる内部最適化スケジューリングポリシーです。現在、ジョブ優先度を手動で指定することはできず、何をしているかを理解していない限り、これを変更しないでください。

#### `load_checker_interval_second`

Default：5 （s）

loadスケジューラーの実行間隔。loadジョブは状態をPENDINGからLOADINGを経てFINISHEDに遷移します。loadスケジューラーはloadジョブをPENDINGからLOADINGに遷移させ、txnコールバックはloadジョブをLOADINGからFINISHEDに遷移させます。そのため、並行度が上限に達していない場合、loadジョブは最大1間隔で完了します。

#### `label_keep_max_second`

Default：`3 * 24 * 3600`  (3 day)

IsMutable：true

MasterOnly：true

完了またはキャンセルされたloadジョブのラベルは`label_keep_max_second`後に削除されます。

1. 削除されたラベルは再利用できます。
2. 短い時間を設定するとFEメモリ使用量が下がります。（削除される前はすべてのloadジョブの情報がメモリに保持されるため）

高並行書き込みの場合、ジョブの大きなバックログがあり、フロントエンドサービスの呼び出しが失敗した場合、ログを確認してください。メタデータ書き込みのロックに時間がかかりすぎる場合、この値を12時間または6時間未満に調整できます

#### `streaming_label_keep_max_second`

Default: 43200 (12 hour)

IsMutable：true

MasterOnly：true

INSERT、STREAMING LOAD、ROUTINE_LOAD_TASKなどの一部の高頻度loadワークでは、有効期限が切れると完了したジョブまたはタスクを削除します。

#### `label_clean_interval_second`

Default：1 * 3600  (1 hour)

Loadラベルクリーナーは*label_clean_interval_second*ごとに実行され、期限切れのジョブをクリーンアップします。

#### `label_regex_length`

Default Value: 128 (characters)

loadラベルの最大文字長、デフォルトは128文字です。

#### `transaction_clean_interval_second`

Default：30

トランザクションが可視またはアボートされている場合、transaction_clean_interval_second秒後にトランザクションがクリーンアップされます。この間隔をできるだけ短くし、各クリーンサイクルをできるだけ早くする必要があります

#### `sync_commit_interval_second`

トランザクションをコミットするための最大時間間隔。この時間後にもチャネルにコミットされていないデータがある場合、コンシューマーはチャネルにトランザクションのコミットを通知します。

Default: 10 (seconds)

動的に設定可能か: true

Master FEノード固有の設定項目か: true

#### `sync_checker_interval_second`

データ同期ジョブ実行ステータスチェック。

Default: 10 (s)

#### `max_sync_task_threads_num`

データ同期ジョブスレッドプール内の最大スレッド数。

デフォルト値：10

#### `min_sync_commit_size`

トランザクションをコミットするために満たす必要があるイベントの最小数。Feが受信したイベント数がこれより少ない場合、時間が`sync_commit_interval_second`を超えるまで次のバッチのデータを待ち続けます。デフォルト値は10000イベントです。この設定を変更したい場合は、この値がcanal側の`canal.instance.memory.buffer.size`設定（デフォルト16384）より小さいことを確認してください。そうでないと、Feはack前にストアより長いキュー長のより多くのイベントを取得しようとし、ストアキューがタイムアウトまでブロックされる原因となります。

Default: 10000

動的に設定可能か: true

Master FEノード固有の設定項目か: true

#### `min_bytes_sync_commit`

トランザクションをコミットするために必要な最小データサイズ。Feが受信したデータサイズがこれより小さい場合、時間が`sync_commit_interval_second`を超えるまで次のバッチのデータを待ち続けます。デフォルト値は15MBです。この設定を変更したい場合は、この値がcanal側の`canal.instance.memory.buffer.size`と`canal.instance.memory.buffer.memunit`の積（デフォルト16MB）より小さいことを確認してください。そうでないと、ack前にFeはストア容量より大きなデータを取得しようとし、ストアキューがタイムアウトまでブロックされる原因となります。

Default: `15*1024*1024` (15M)

動的に設定可能か: true

Master FEノード固有の設定項目か: true

#### `max_bytes_sync_commit`

データ同期ジョブスレッドプール内の最大スレッド数。FE全体で1つのスレッドプールのみがあり、FE内のすべてのデータ同期タスクがBEにデータを送信するために使用されます。スレッドプールの実装は`SyncTaskPool`クラスにあります。

Default: 10

動的に設定可能か: false

Master FEノード固有の設定項目か: false

#### `enable_outfile_to_local`

Default：false

outfile機能で結果をローカルディスクにエクスポートすることを許可するかどうか。

#### `export_tablet_num_per_task`

Default：5

IsMutable：true

MasterOnly：true

エクスポートクエリプラン当たりのタブレット数

#### `export_task_default_timeout_second`

Default: 2 * 3600   (2 hour)

IsMutable：true

MasterOnly：true

エクスポートジョブのデフォルトタイムアウト。

#### `export_running_job_num_limit`

Default：5

IsMutable：true

MasterOnly：true

実行中のエクスポートジョブの並行度制限。デフォルトは5。0は無制限

#### `export_checker_interval_second`

Default：5

エクスポートチェッカーの実行間隔。

#### `enable_stream_load_profile`

Default: false

MasterOnly: false

stream loadプロファイルを有効にするかどうか

### Log

#### `log_roll_size_mb`

Default：1024  （1G）

1つのsysログとauditログの最大サイズ

#### `sys_log_dir`

Default: DorisFE.DORIS_HOME_DIR + "/log"

これはFEログディレクトリを指定します。FEは2つのログファイルを生成します：

fe.log:      FEプロセスのすべてのログ。
fe.warn.log  FEプロセスのすべてのWARNINGとERRORログ。

#### `sys_log_level`

Default：INFO

ログレベル: INFO、WARN、ERROR、FATAL

#### `sys_log_roll_num`

Default：10

sys_log_roll_interval内に保持される最大FEログファイル数。デフォルトは10で、1日に最大10個のログファイルがあることを意味します

#### `sys_log_verbose_modules`

Default：{}

詳細モジュール。VERBOSEレベルはlog4jのDEBUGレベルで実装されています。

例：
   sys_log_verbose_modules = org.apache.doris.catalog
   これはorg.apache.doris.catalogパッケージとそのすべてのサブパッケージ内のファイルのデバッグログのみを出力します。

#### `sys_log_roll_interval`

Default：DAY

sys_log_roll_interval:

* DAY:  ログサフィックスは  yyyyMMdd
* HOUR: ログサフィックスは  yyyyMMddHH

#### `sys_log_delete_age`

Default：7d

デフォルトは7日で、ログの最終変更時間が7日前の場合、削除されます。

サポート形式：

* 7d      7日
* 10h     10時間
* 60m     60分
* 120s    120秒

#### `sys_log_roll_mode`

Default：SIZE-MB-1024

ログ分割のサイズ、1Gごとにログファイルを分割

#### `sys_log_enable_compress`

Default: false

trueの場合、fe.logとfe.warn.logをgzipで圧縮します

#### `audit_log_dir`

Default：DORIS_HOME_DIR + "/log"

audit_log_dir：
これはFE auditログディレクトリを指定します。
Auditログfe.audit.logには、ユーザー、ホスト、コスト、ステータスなどの関連情報を持つすべてのリクエストが含まれます

#### `audit_log_roll_num`

Default：90

audit_log_roll_interval内に保持される最大FE auditログファイル数。

#### `audit_log_modules`

Default：{"slow_query", "query", "load", "stream_load"}

Slow queryには*qe_slow_log_ms*を超えるコストのすべてのクエリが含まれます

#### `qe_slow_log_ms`

Default: 5000 (5 seconds)

クエリの応答時間がこの閾値を超える場合、auditログにslow_queryとして記録されます。

#### `audit_log_roll_interval`

Default：DAY

DAY:  ログサフィックスは : yyyyMMdd
HOUR: ログサフィックスは : yyyyMMddHH

#### `audit_log_delete_age`

Default：30d

デフォルトは30日で、ログの最終変更時間が30日前の場合、削除されます。

サポート形式：
* 7d      7日
* 10h     10時間
* 60m     60分
* 120s    120秒

#### `audit_log_enable_compress`

Default: false

trueの場合、fe.audit.logをgzipで圧縮します

#### `nereids_trace_log_dir`

Default: DorisFE.DORIS_HOME_DIR + "/log/nereids_trace"

nereids traceログのディレクトリを指定するために使用

### Storage

#### `min_replication_num_per_tablet`

Default: 1

タブレット当たりの最小レプリケーション数を設定するために使用。

#### `max_replication_num_per_tablet`

Default: 32767

タブレット当たりの最大レプリケーション数を設定するために使用。

#### `default_db_data_quota_bytes`

Default：8192PB

IsMutable：true

MasterOnly：true

デフォルトデータベースデータクォータサイズを設定するために使用。単一データベースのクォータサイズを設定するには、以下を使用できます：

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

デフォルトのデータベースレプリカクォータを設定するために使用されます。単一のデータベースのクォータサイズを設定するには、以下を使用できます：

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

コードのバグや人的ミスオペレーションなど、非常に特殊な状況では、一部のタブレットのすべてのレプリカが失われる場合があります。この場合、データは実質的に失われています。しかし、一部のシナリオでは、データ損失があってもクエリがエラーを報告しないように保証し、ユーザー層の認識を減らしたいというビジネス要件があります。この時点で、空のTabletを使用して不足しているレプリカを埋めて、クエリが正常に実行できるようにすることができます。

trueに設定すると、Dorisはすべてのレプリカが破損または不足しているタブレットに対して自動的に空のレプリカを使用して埋めます

#### `min_clone_task_timeout_sec` `And max_clone_task_timeout_sec`

デフォルト：最小3分、最大2時間

IsMutable：true

MasterOnly：true

`mix_clone_task_timeout_sec`と連携してクローンタスクの最大および最小タイムアウトを制御できます。通常の状況では、クローンタスクのタイムアウトは、データ量と最小転送速度（5MB/s）によって推定されます。一部の特殊なケースでは、これら2つの設定を使用してクローンタスクのタイムアウトの上限と下限を設定し、クローンタスクが正常に完了することを保証できます。

#### `disable_storage_medium_check`

デフォルト：false

IsMutable：true

MasterOnly：true

disable_storage_medium_checkがtrueの場合、ReportHandlerはタブレットのストレージメディアをチェックせず、ストレージのクールダウン機能を無効にします。デフォルト値はfalseです。タブレットのストレージメディアを気にしない場合は、値をtrueに設定できます。

#### `decommission_tablet_check_threshold`

デフォルト：5000

IsMutable：true

MasterOnly：true

この設定は、Master FEが廃止されたBE上のタブレットのステータスをチェックする必要があるかどうかを制御するために使用されます。廃止されたBE上のタブレットサイズがこの閾値より小さい場合、FEは定期チェックを開始し、廃止されたBE上のすべてのタブレットがリサイクルされた場合、FEはこのBEを即座にドロップします。

パフォーマンス上の理由から、この設定に非常に高い値を設定しないでください。

#### `partition_rebalance_max_moves_num_per_selection`

デフォルト：10

IsMutable：true

MasterOnly：true

PartitionRebalancerを使用する場合のみ有効です、

#### `partition_rebalance_move_expire_after_access`

デフォルト：600   (s)

IsMutable：true

MasterOnly：true

PartitionRebalancerを使用する場合のみ有効です。これが変更された場合、キャッシュされたムーブがクリアされます

#### `tablet_rebalancer_type`

デフォルト：BeLoad

MasterOnly：true

リバランサータイプ（大文字小文字を無視）：BeLoad、Partition。タイプの解析に失敗した場合、デフォルトとしてBeLoadを使用します

#### `max_balancing_tablets`

デフォルト：100

IsMutable：true

MasterOnly：true

TabletSchedulerでバランシング中のタブレット数がmax_balancing_tabletsを超える場合、これ以上のバランスチェックは行いません

#### `max_scheduling_tablets`

デフォルト：2000

IsMutable：true

MasterOnly：true

TabletSchedulerでスケジュールされたタブレット数がmax_scheduling_tabletsを超える場合、チェックをスキップします。

#### `disable_balance`

デフォルト：false

IsMutable：true

MasterOnly：true

trueに設定された場合、TabletSchedulerはバランスを行いません。

#### `disable_disk_balance`

デフォルト：true

IsMutable：true

MasterOnly：true

trueに設定された場合、TabletSchedulerはディスクバランスを行いません。

#### `balance_load_score_threshold`

デフォルト：0.1 (10%)

IsMutable：true

MasterOnly：true

クラスターバランススコアの閾値。バックエンドの負荷スコアが平均スコアより10%低い場合、このバックエンドはLOW負荷としてマークされ、負荷スコアが平均スコアより10%高い場合、HIGH負荷としてマークされます

#### `capacity_used_percent_high_water`

デフォルト：0.75  (75%)

IsMutable：true

MasterOnly：true

ディスク容量使用率のハイウォーター。これはバックエンドの負荷スコアの計算に使用されます

#### `clone_distribution_balance_threshold`

デフォルト：0.2

IsMutable：true

MasterOnly：true

バックエンドでのレプリカ数のバランス閾値。

#### `clone_capacity_balance_threshold`

デフォルト：0.2

IsMutable：true

MasterOnly：true

* BEでのデータサイズのバランス閾値。

   バランスアルゴリズム：

     1. クラスター全体の平均使用容量（AUC）を計算します。（総データサイズ / 総バックエンド数）

     2. ハイウォーターレベルは（AUC * (1 + clone_capacity_balance_threshold)）です

     3. ローウォーターレベルは（AUC * (1 - clone_capacity_balance_threshold)）です

     4. Cloneチェッカーは、ハイウォーターレベルのBEからローウォーターレベルのBEにレプリカを移動しようとします。

#### `disable_colocate_balance`

デフォルト：false

IsMutable：true

MasterOnly：true

この設定をtrueに設定すると、自動的なコロケートテーブルの再配置とバランスを無効にできます。'disable_colocate_balance'がtrueに設定されている場合、ColocateTableBalancerはコロケートテーブルの再配置とバランスを行いません。

**注意**:

1. 通常の状況では、バランスを無効にする必要はありません。
2. バランスが無効になると、不安定なコロケートテーブルが復旧されない可能性があります
3. 最終的に、クエリ時にコロケートプランが使用できなくなります。

#### `balance_slot_num_per_path`

デフォルト：1

IsMutable：true

MasterOnly：true

バランス中のパスごとのデフォルトスロット数。

#### `disable_tablet_scheduler`

デフォルト：false

IsMutable：true

MasterOnly：true

trueに設定された場合、タブレットスケジューラーが動作しないため、すべてのタブレット修復/バランスタスクが動作しません。

#### `enable_force_drop_redundant_replica`

デフォルト：false

動的設定：true

Master FEのみ：true

trueに設定された場合、システムはタブレットスケジューリングロジックで冗長レプリカを即座にドロップします。これにより、対応するレプリカに書き込んでいる一部の負荷ジョブが失敗する可能性がありますが、タブレットのバランスと修復速度が向上します。
クラスターでバランスや修復を待っているレプリカが多数ある場合、部分的な負荷成功率を犠牲にしてレプリカのバランスと修復を高速化するためにこの設定を試すことができます。

#### `colocate_group_relocate_delay_second`

デフォルト：1800

動的設定：true

Master FEのみ：true

コロケーショングループの再配置は、クラスター内での多数のタブレットの移動を伴う可能性があります。そのため、コロケーショングループの再配置をできるだけ避けるために、より保守的な戦略を使用する必要があります。
再配置は通常、BEノードがオフラインになったり、ダウンしたりした後に発生します。このパラメータは、BEノードの利用不可の判定を遅延させるために使用されます。デフォルトは30分で、つまり、BEノードが30分以内に回復すれば、コロケーショングループの再配置はトリガーされません。

#### `allow_replica_on_same_host`

デフォルト：false

動的設定：false

Master FEのみ：false

同じタブレットの複数のレプリカが同じホストに分散されることを許可するかどうか。このパラメータは主にローカルテストに使用され、複数のBEを構築して特定のマルチレプリカの状況をテストするのを容易にします。テスト以外の環境では使用しないでください。

#### `repair_slow_replica`

デフォルト：false

IsMutable：true

MasterOnly：true

trueに設定された場合、コンパクションが遅いレプリカが自動的に検出され、他のマシンに移行されます。検出条件は、最速レプリカのバージョン数が`min_version_count_indicate_replica_compaction_too_slow`の値を超え、最速レプリカとのバージョン数の差の比率が`valid_version_count_delta_ratio_between_replicas`の値を超えることです

#### `min_version_count_indicate_replica_compaction_too_slow`

デフォルト：200

動的設定：true

Master FEのみ：false

レプリカコンパクションが遅すぎるかどうかを判断するために使用されるバージョン数の閾値

#### `skip_compaction_slower_replica`

デフォルト：true

動的設定：true

Master FEのみ：false

trueに設定された場合、クエリ可能なレプリカを選択する際にコンパクションが遅いレプリカはスキップされます

#### `valid_version_count_delta_ratio_between_replicas`

デフォルト：0.5

動的設定：true

Master FEのみ：true

最遅レプリカと最速レプリカのバージョン数の差の有効な比率閾値。`repair_slow_replica`がtrueに設定されている場合、最遅レプリカを修復するかどうかを決定するために使用されます

#### `min_bytes_indicate_replica_too_large`

デフォルト：`2 * 1024 * 1024 * 1024` (2G)

動的設定：true

Master FEのみ：true

レプリカが大きすぎるかどうかを判断するために使用されるデータサイズの閾値

#### `schedule_slot_num_per_hdd_path`

デフォルト：4

hddのタブレットスケジューラーでのパスごとのデフォルトスロット数。この設定を削除し、クローンタスク統計によって動的に調整します

#### `schedule_slot_num_per_ssd_path`

デフォルト：8

ssdのタブレットスケジューラーでのパスごとのデフォルトスロット数。この設定を削除し、クローンタスク統計によって動的に調整します

#### `tablet_repair_delay_factor_second`

デフォルト：60 （s）

IsMutable：true

MasterOnly：true

タブレット修復を決定する前の遅延時間の係数。

* 優先度がVERY_HIGHの場合、即座に修復します。
* HIGH：tablet_repair_delay_factor_second * 1遅延；
* NORMAL：tablet_repair_delay_factor_second * 2遅延；
* LOW：tablet_repair_delay_factor_second * 3遅延；

#### `tablet_stat_update_interval_second`

デフォルト：300（5min）

タブレット統計の更新間隔。
すべてのフロントエンドが各間隔ですべてのバックエンドからタブレット統計を取得します

#### `storage_flood_stage_usage_percent`

デフォルト：95 （95%）

IsMutable：true

MasterOnly：true

##### `storage_flood_stage_left_capacity_bytes`

デフォルト：`1 * 1024 * 1024 * 1024` (1GB)

IsMutable：true

MasterOnly：true

ディスクの容量が'storage_flood_stage_usage_percent'と'storage_flood_stage_left_capacity_bytes'に達した場合、以下の操作が拒否されます：

1. load job
2. restore job

#### `storage_high_watermark_usage_percent`

デフォルト：85  (85%)

IsMutable：true

MasterOnly：true

#### `storage_min_left_capacity_bytes`

デフォルト：`2 * 1024 * 1024 * 1024`  (2GB)

IsMutable：true

MasterOnly：true

'storage_high_watermark_usage_percent'はBackendストレージパスの最大容量使用率を制限します。'storage_min_left_capacity_bytes'はBackendストレージパスの最小残容量を制限します。両方の制限に達した場合、このストレージパスはタブレットバランスの宛先として選択できません。しかし、タブレット復旧では、データの整合性をできるだけ保つためにこれらの制限を超える場合があります。

#### `catalog_trash_expire_second`

デフォルト：86400L (1 day)

IsMutable：true

MasterOnly：true

データベース（テーブル/パーティション）をドロップした後、RECOVER文を使用して回復できます。これは最大データ保持時間を指定します。時間が経過すると、データは永久に削除されます。

#### `default_storage_medium`

デフォルト：HDD

テーブル（またはパーティション）を作成する際、ストレージメディア（HDDまたはSSD）を指定できます。設定されていない場合、作成時のデフォルトメディアを指定します。

#### `default_compression_type`

デフォルト：lz4 (4.0.3以前)、zstd (4.0.3以降)

テーブル作成時に圧縮アルゴリズムを指定できます。設定されていない場合、テーブル作成時のデフォルト圧縮タイプを指定します。有効な値には：lz4、zstdが含まれます。

#### `enable_storage_policy`

* Storage Policy機能を有効にするかどうか。この設定により、ユーザーはホットデータとコールドデータを分離できます。
デフォルト：false

動的設定可能：true

Master FEノード固有の設定項目：true

#### `check_consistency_default_timeout_second`

デフォルト：600 (10 minutes)

IsMutable：true

MasterOnly：true

単一の整合性チェックタスクのデフォルトタイムアウト。タブレットサイズに適合するよう十分長く設定してください

#### `consistency_check_start_time`

デフォルト：23

IsMutable：true

MasterOnly：true

整合性チェック開始時間

整合性チェッカーは*consistency_check_start_time*から*consistency_check_end_time*まで実行されます。

2つの時間が同じ場合、整合性チェックはトリガーされません。

#### `consistency_check_end_time`

デフォルト：23

IsMutable：true

MasterOnly：true

整合性チェック終了時間

整合性チェッカーは*consistency_check_start_time*から*consistency_check_end_time*まで実行されます。

2つの時間が同じ場合、整合性チェックはトリガーされません。

#### `replica_delay_recovery_second`

デフォルト：0

IsMutable：true

MasterOnly：true

レプリカが失敗してからfeがクローンを使用して回復を試行するまでの最小遅延秒数。

#### `tablet_create_timeout_second`

デフォルト：1（s）

IsMutable：true

MasterOnly：true

単一レプリカ作成の最大待機時間。

例：
   #mのタブレットと各タブレットに#nのレプリカを持つテーブルを作成する場合、
   create tableリクエストはタイムアウトになる前に最大（m *n* tablet_create_timeout_second）実行されます。

#### `tablet_delete_timeout_second`

デフォルト：2

IsMutable：true

MasterOnly：true

*tablet_create_timeout_second*と同じ意味ですが、タブレットを削除する際に使用されます。

#### `delete_job_max_timeout_second`

デフォルト：300(s)

Mutable：true

Master only：true

削除ジョブの最大タイムアウト（秒）。

#### `alter_table_timeout_second`

デフォルト：86400 * 30 (1 month)

IsMutable：true

MasterOnly：true

ALTER TABLEリクエストの最大タイムアウト。テーブルデータサイズに適合するよう十分長く設定してください。

#### `max_replica_count_when_schema_change`

OlapTableがスキーマ変更を実行する際に許可される最大レプリカ数。レプリカが多すぎるとFE OOMを引き起こします。

デフォルト：100000

動的設定可能：true

Master FEノード固有の設定項目かどうか：true

#### `history_job_keep_max_second`

デフォルト：`7 * 24 * 3600` （7 day）

IsMutable：true

MasterOnly：true

一部の種類のジョブの最大保持時間。スキーマ変更ジョブやロールアップジョブなど。

#### `max_create_table_timeout_second`

デフォルト：60 （s）

IsMutable：true

MasterOnly：true

create table（index）の待機時間が長くなりすぎないようにするため、最大タイムアウトを設定します。

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

バージョン2.1以降、ODBC、JDBC、broker外部テーブルの作成をサポートしていません。odbcとmysql外部テーブルには、代わりにJDBCテーブルまたはJDBCカタログを使用してください。brokerテーブルには、代わりにテーブル値関数を使用してください。

#### `max_hive_partition_cache_num`

hiveパーティションのキャッシュの最大数。

デフォルト：100000

動的設定可能：false

Master FEノード固有の設定項目：false

#### `hive_metastore_client_timeout_second`

hive metastoreのデフォルト接続タイムアウト。

デフォルト：10

動的設定可能：true

Master FEノード固有の設定項目：true

#### `max_external_cache_loader_thread_pool_size`

外部メタキャッシュローディング用の最大スレッドプールサイズ。

デフォルト：10

動的設定可能：false

Master FEノード固有の設定項目：false

#### `max_external_file_cache_num`

外部テーブルに使用するファイルキャッシュの最大数。

デフォルト：100000

動的設定可能：false

Master FEノード固有の設定項目：false

#### `max_external_schema_cache_num`

外部テーブルに使用するスキーマキャッシュの最大数。

デフォルト：10000

動的設定可能：false

Master FEノード固有の設定項目：false

#### `external_cache_expire_time_minutes_after_access`

最後のアクセス後にキャッシュ内のデータが期限切れになるまでの時間を設定します。単位は分です。
External Schema CacheとHive Partition Cacheに適用されます。

デフォルト：1440

動的設定可能：false

Master FEノード固有の設定項目：false

#### `es_state_sync_interval_second`

デフォルト：10

feはes_state_sync_interval_secsごとにes apiを呼び出してesインデックスシャード情報を取得します

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

デフォルト：DorisFE.DORIS_HOME_DIR + "/lib/yarn-config"

デフォルトyarn設定ファイルディレクトリ。yarnコマンドを実行する前に毎回、このパスの下に設定ファイルが存在するかをチェックし、存在しない場合は作成する必要があります。

#### `yarn_client_path`

デフォルト：DORIS_HOME_DIR + "/lib/yarn-client/hadoop/bin/yarn"

デフォルトyarnクライアントパス

#### `spark_launcher_log_dir`

デフォルト：sys_log_dir + "/spark_launcher_log"

指定されたspark launcherログディレクトリ

#### `spark_resource_path`

デフォルト：none

デフォルトspark依存関係パス

#### `spark_home_default_dir`

デフォルト：DORIS_HOME_DIR + "/lib/spark2x"

デフォルトsparkホームディレクトリ

#### `spark_dpp_version`

デフォルト：1.0.0

デフォルトspark dppバージョン

### Else

#### `tmp_dir`

デフォルト：DorisFE.DORIS_HOME_DIR + "/temp_dir"

temp dirは、バックアップや復元プロセスなど、一部のプロセスの中間結果を保存するために使用されます。このディレクトリ内のファイルは、これらのプロセスが完了した後にクリーンアップされます。

#### `custom_config_dir`

デフォルト：DorisFE.DORIS_HOME_DIR + "/conf"

カスタム設定ファイルディレクトリ

`fe_custom.conf`ファイルの場所を設定します。デフォルトは`conf/`ディレクトリにあります。

一部のデプロイメント環境では、システムのアップグレードにより`conf/`ディレクトリが上書きされる場合があります。これにより、ユーザーが変更した設定項目が上書きされます。この時、`fe_custom.conf`を別の指定されたディレクトリに保存して、設定ファイルが上書きされることを防ぐことができます。

#### `plugin_dir`

デフォルト：DORIS_HOME + "/plugins

プラグインインストールディレクトリ

#### `plugin_enable`

デフォルト：true

IsMutable：true

MasterOnly：true

プラグインが有効かどうか、デフォルトで有効

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

trueに設定された場合、メトリックコレクターは固定間隔でメトリックを収集するデーモンタイマーとして実行されます

#### `report_queue_size`

デフォルト：100

IsMutable：true

MasterOnly：true

この閾値は、FEで多くのレポートタスクが蓄積され、OOM例外を引き起こすことを避けるためです。一部の大規模なDorisクラスター（例：1000万のレプリカを持つ100のBackend）では、メタデータの変更（パーティションのドロップなど）後にタブレットレポートに数秒かかる場合があります。そして、1つのBackendは1分ごとにタブレット情報を報告するため、無制限でレポートを受信することは受け入れられません。将来的にはタブレットレポートの処理速度を最適化しますが、現在は、キューサイズが制限を超える場合はレポートを破棄します。
   いくつかのオンライン時間コスト：
      1. disk report：0-1 ms
      2. task report：0-1 ms
      3. tablet report
      4. 10000 replicas：200ms

#### `backup_job_default_timeout_ms`

デフォルト：86400 * 1000  (1 day)

IsMutable：true

MasterOnly：true

バックアップジョブのデフォルトタイムアウト

#### `backup_upload_snapshot_batch_size`

デフォルト：10

IsMutable：true

MasterOnly：true

バックアッププロセス中にアップロードタスクに割り当てられるスナップショットの最大数、デフォルト値は10です。

#### `restore_download_snapshot_batch_size`

デフォルト：10

IsMutable：true

MasterOnly：true

復元プロセス中にダウンロードタスクに割り当てられるスナップショットの最大数、デフォルト値は10です。

#### `max_backup_restore_job_num_per_db`

デフォルト：10

この設定は主に各データベースに記録されるバックアップ/復元タスクの数を制御するために使用されます。

#### `max_backup_tablets_per_job`

デフォルト：300000

IsMutable：true

MasterOnly：true

バックアップジョブごとに関与するタブレットの最大数を制御し、過多のメタデータ保存によるFE OOMを避けます。

#### `enable_quantile_state_type`

デフォルト：false

IsMutable：true

MasterOnly：true

quantile_stateデータタイプを有効にするかどうか

#### `enable_date_conversion`

デフォルト：true

IsMutable：true

MasterOnly：true

FEは自動的にdate/datetimeをdatev2/datetimev2(0)に変換します。

#### `enable

```
Set the database transaction quota
ALTER DATABASE db_name SET TRANSACTION QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```
#### `prefer_compute_node_for_external_table`

Default：false

IsMutable：true

MasterOnly：false

trueに設定すると、外部テーブルでのクエリは計算ノードに優先的に割り当てられます。計算ノードの最大数は`min_backend_num_for_external_table`によって制御されます。
falseに設定すると、外部テーブルでのクエリは任意のノードに割り当てられます。

#### `min_backend_num_for_external_table`

Default：3

IsMutable：true

MasterOnly：false

`prefer_compute_node_for_external_table`がtrueの場合にのみ有効です。計算ノード数がこの値より少ない場合、外部テーブルでのクエリは混合ノードを取得して割り当て、ノードの総数がこの値に達するようにします。
計算ノード数がこの値より大きい場合、外部テーブルでのクエリは計算ノードのみに割り当てられます。

#### `infodb_support_ext_catalog`

Default: false

IsMutable: true

MasterOnly: false

falseの場合、information_schemaデータベース内のテーブルからselectを実行する際、結果には外部カタログ内のテーブルの情報は含まれません。
これは外部カタログに到達できない場合のクエリ時間を回避するためです。

#### `enable_query_hit_stats`

Default: false

IsMutable: true

MasterOnly: false

クエリヒット統計を有効にするかどうかを制御します。デフォルトはfalseです。

#### `div_precision_increment`

Default: 4

この変数は、`/`演算子で実行される除算操作の結果のスケールを増加させる桁数を示します。

#### `enable_convert_light_weight_schema_change`

Default：true

一時的な設定オプションです。有効にすると、バックグラウンドスレッドが開始され、すべてのolapテーブルがlight schema changeに自動的に変更されます。変更結果は`show convert_light_schema_change [from db]`コマンドで確認でき、light schema changeでないすべてのテーブルの変換結果が表示されます。

#### `disable_local_deploy_manager_drop_node`

Default：true

cluster.infoファイルのエラーによってノードが削除されることを防ぐため、LocalDeployManagerのノード削除を禁止します。

#### `mysqldb_replace_name`

Default: mysql

MySQLエコシステムとの互換性を確保するため、Dorisにはmysqlという組み込みデータベースが含まれています。このデータベースがユーザー独自のデータベースと競合する場合は、このフィールドを変更してDoris組み込みMySQLデータベースの名前を別の名前に置き換えてください。

#### `max_auto_partition_num`

Default value: 2000

自動パーティションテーブルにおいて、ユーザーが誤って大量のパーティションを作成することを防ぐため、OLAPテーブルごとに許可されるパーティション数は`max_auto_partition_num`です。デフォルトは2000です。

#### `profile_manager_gc_interval_seconds`

Default value: 1

ProfileManagerがプロファイルガベージコレクションを実行する間隔を制御するために使用されます。ガベージコレクション中、ProfileManagerはメモリとディスクから余分なプロファイルや期限切れのプロファイルを削除してメモリを節約します。

### Compute and Storage Disaggregated Mode

#### `cluster_id`

Default：-1

node（FEまたはBE）は同じcluster idを持つ場合、同じDorisクラスターに属していると見なされます。compute and storage disaggregatedモードでは、ランダムなintを1つ指定する必要があります。

#### `deploy_mode`

Default: ""

Description: FEが実行されるモードです。`cloud`はストレージと計算が分離されたモードを示します。

#### `meta_service_endpoint`

Default: ""

メタサービスのエンドポイントは'host1:port,host2:port'の形式で指定する必要があります。この設定はstorage and compute disaggregatedモードに必要です。
