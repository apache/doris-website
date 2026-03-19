---
{
  "title": "FE設定 | Config",
  "language": "ja",
  "toc_min_heading_level": 2,
  "toc_max_heading_level": 4,
  "description": "この文書は主にFEの関連設定項目について説明します。",
  "sidebar_label": "FE 設定"
}
---
<!-- Please sort the configuration alphabetically -->

# FE 設定

このドキュメントは主にFEの関連する設定項目を紹介します。

FE設定ファイル `fe.conf` は通常、FEデプロイメントパスの `conf/` ディレクトリに保存されています。バージョン0.14では、もう1つの設定ファイル `fe_custom.conf` が導入されます。この設定ファイルは、運用中にユーザーが動的に設定し、永続化された設定項目を記録するために使用されます。

FEプロセスが開始されると、最初に `fe.conf` の設定項目を読み取り、次に `fe_custom.conf` の設定項目を読み取ります。`fe_custom.conf` の設定項目は `fe.conf` の同じ設定項目を上書きします。

`fe_custom.conf` ファイルの場所は、`custom_config_dir` 設定項目を通じて `fe.conf` で設定できます。

## 設定項目の表示

FEの設定項目を表示する方法は2つあります：

1. FE Webページ

    ブラウザでFE Webページ `http://fe_host:fe_http_port/variable` を開きます。`Configure Info` で現在有効なFE設定項目を確認できます。

2. コマンドによる表示

    FEが開始された後、以下のコマンドでMySQLクライアントでFEの設定項目を表示できます。具体的な使用方法は [SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG) を参照してください：

    `SHOW FRONTEND CONFIG;`

    結果の列の意味は以下の通りです：

    * Key: 設定項目の名前。
    * Value: 現在の設定項目の値。
    * タイプ: 設定項目値のタイプ（integer や string など）。
    * IsMutable: 動的に設定可能かどうか。true の場合、その設定項目は実行時に動的に設定できます。false の場合、その設定項目は `fe.conf` でのみ設定でき、FE再起動後に有効になることを意味します。
    * MasterOnly: Master FEノード固有の設定項目かどうか。true の場合、その設定項目はMaster FEノードでのみ意味があり、他のタイプのFEノードでは意味がないことを意味します。false の場合、その設定項目はすべてのタイプのFEノードで意味があることを意味します。
    * コメント: 設定項目の説明。

## 設定項目の設定

FE設定項目を設定する方法は2つあります：

1. 静的設定

    `conf/fe.conf` ファイルで設定項目を追加・設定します。`fe.conf` の設定項目はFEプロセス開始時に読み取られます。`fe.conf` にない設定項目はデフォルト値が使用されます。

2. MySQLプロトコル経由での動的設定

    FE開始後、以下のコマンドで設定項目を動的に設定できます。このコマンドには管理者権限が必要です。

    `ADMIN SET FRONTEND CONFIG (" fe_config_name "=" fe_config_value ");`

    すべての設定項目が動的設定に対応しているわけではありません。動的設定に対応しているかどうかは、`SHOW FRONTEND CONFIG;` コマンド結果の `IsMutable` 列で確認できます。

    `MasterOnly` の設定項目が変更された場合、コマンドは直接Master FEに転送され、Master FE内の対応する設定項目のみが変更されます。

    **この方法で変更された設定項目は、FEプロセス再起動後に無効になります。**

    このコマンドの詳しいヘルプは、`HELP ADMIN SET CONFIG;` コマンドで表示できます。

3. HTTPプロトコル経由での動的設定

    詳細については、[Set Config Action](../open-api/fe-http/set-config-action) を参照してください

    この方法では、変更された設定項目を永続化することも可能です。設定項目は `fe_custom.conf` ファイルに永続化され、FE再起動後も有効になります。

## 例

1. `async_pending_load_task_pool_size` の変更

    `SHOW FRONTEND CONFIG;` で確認すると、この設定項目は動的設定できません（`IsMutable` が false）。`fe.conf` に以下を追加する必要があります：

    `async_pending_load_task_pool_size = 20`

    その後、FEプロセスを再起動して設定を有効にします。

2. `dynamic_partition_enable` の変更

    `SHOW FRONTEND CONFIG;` で確認すると、この設定項目は動的設定可能です（`IsMutable` が true）。また、これはMaster FE固有の設定です。まず任意のFEに接続し、以下のコマンドを実行して設定を変更できます：

    ```
    ADMIN SET FRONTEND CONFIG ("dynamic_partition_enable" = "true"); `
    ```
その後、以下のコマンドで変更された値を確認できます：

    ```
    set forward_to_master = true;
    SHOW FRONTEND CONFIG;
    ```
上記の方法で変更した後、Master FEが再起動するか、Master選出が実行されると、設定は無効になります。設定項目を直接`fe.conf`に追加してFEを再起動することで、設定項目を永続化できます。

3. `max_distribution_pruner_recursion_depth`の変更

    `SHOW FRONTEND CONFIG;`により、この設定項目は動的に設定可能であることがわかります（`IsMutable`がtrue）。Master FE固有の設定ではありません。

    同様に、設定の動的変更コマンドによって設定を変更できます。この設定はMaster FE固有ではないため、ユーザーは異なるFEに個別に接続して設定を動的に変更し、すべてのFEが変更された設定値を使用するようにする必要があります。

## 設定

### メタデータとクラスター

#### `meta_dir`

デフォルト：DORIS_HOME_DIR + "/doris-meta"

タイプ: string 説明: Dorisメタデータはここに保存されます。このディレクトリのストレージは以下のように設定することを強く推奨します:

* 高速書き込み性能（SSD）
* 安全性（RAID）

#### `catalog_try_lock_timeout_ms`

デフォルト：5000 （ms）

IsMutable：true

catalogロックのtryLockタイムアウト設定。通常は変更する必要はありませんが、テストで何かを確認する場合を除きます。

#### `enable_bdbje_debug_mode`

デフォルト：false

trueに設定すると、FEはBDBJEデバッグモードで開始されます

#### `max_bdbje_clock_delta_ms`

デフォルト：5000 （5s）

非master FEとMaster FEホスト間で許容可能な最大クロック差を設定します。この値は、非master FEがBDBJEを介してmaster FEとの接続を確立する際にチェックされます。クロック差がこの値より大きい場合、接続は破棄されます。

#### `metadata_failure_recovery`

デフォルト：false

trueの場合、FEはbdbjeレプリケーショングループをリセット（つまり、すべての選出可能ノード情報を削除）し、Masterとして開始することを想定しています。すべての選出可能ノードが開始できない場合、メタデータを別のノードにコピーし、この設定をtrueに設定してFEの再起動を試行できます。

#### `txn_rollback_limit`

デフォルト：100

グループへの再参加を試行する際にbdbjeがロールバックできる最大トランザクション数

#### `grpc_threadmgr_threads_nums`

デフォルト: 4096

grpc_threadmgrでgrpcイベントを処理するスレッド数。

#### `bdbje_replica_ack_timeout_second`

デフォルト：10 (s)

bdbjeへの書き込み時のレプリカackタイムアウト。比較的大きなログを書き込む際、ack時間がタイムアウトし、ログ書き込みの失敗を引き起こす可能性があります。この場合、この値を適切に増加できます。

#### `bdbje_lock_timeout_second`

デフォルト：5

bdbje操作のロックタイムアウト。FE WARNログに多くのLockTimeoutExceptionがある場合、この値を増加してみることができます

#### `bdbje_heartbeat_timeout_second`

デフォルト：30

masterとfollower間のbdbjeハートビートタイムアウト。デフォルトは30秒で、bdbjeのデフォルト値と同じです。ネットワークが一時的な問題を抱えている場合や、予期しない長いjava GCが発生している場合、この値を増加して誤ったタイムアウトの発生頻度を減らすことができます

#### `replica_ack_policy`

デフォルト：SIMPLE_MAJORITY

オプション: ALL, NONE, SIMPLE_MAJORITY

bdbjeのレプリカackポリシー。詳細情報については、<http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.ReplicaAckPolicy.html>を参照してください

#### `replica_sync_policy`

デフォルト：SYNC

選項：SYNC, NO_SYNC, WRITE_NO_SYNC

Follower FEのbdbje同期ポリシー。

#### `master_sync_policy`

デフォルト：SYNC

選項：SYNC, NO_SYNC, WRITE_NO_SYNC

Master FEのbdbje同期ポリシー。Follower FEを1つだけデプロイする場合、これを'SYNC'に設定してください。3つ以上のFollower FEをデプロイする場合、これと以下の'replica_sync_policy'をWRITE_NO_SYNCに設定できます。詳細情報については、<http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.SyncPolicy.html>を参照してください

#### `bdbje_reserved_disk_bytes`

レプリケートされたJE Environmentで保持する予約領域のバイト数の希望上限。

デフォルト: 1073741824

動的設定可能か: false

Master FEノード固有の設定項目か: false

#### `ignore_meta_check`

デフォルト：false

IsMutable：true

trueの場合、非master FEはMaster FEと自身の間のメタデータ遅延ギャップを無視します。メタデータ遅延ギャップが*meta_delay_toleration_second*を超えている場合でも同様です。非master FEは読み取りサービスを提供し続けます。
これは、何らかの理由でMaster FEを比較的長時間停止したいが、非master FEに読み取りサービスを提供させたい場合に役立ちます。

#### `meta_delay_toleration_second`

デフォルト: 300 (5 min)

メタデータ遅延ギャップが*meta_delay_toleration_second*を超えると、非master FEはサービス提供を停止します

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

Master FEは*edit_log_roll_num*メタジャーナルごとにimageを保存します。

#### `force_do_metadata_checkpoint`

デフォルト：false

IsMutable：true

MasterOnly：true

trueに設定すると、checkpointスレッドはjvmメモリ使用率に関係なくcheckpointを作成します

#### `metadata_checkpoint_memory_threshold`

デフォルト：60 （60%）

IsMutable：true

MasterOnly：true

jvmメモリ使用率（heapまたはold mem pool）がこの閾値を超えると、OOMを避けるためにcheckpointスレッドは動作しません。

#### `max_same_name_catalog_trash_num`

catalogゴミ箱内の同じ名前のメタ情報の最大数を設定するために使用されます。最大値を超えると、最初に削除されたメタゴミは完全に削除され、復旧できません。0は同じ名前のオブジェクトを保持しないことを意味します。< 0は制限なしを意味します。

注意: 同じ名前のメタデータの判定は一定の範囲に制限されます。例えば、同じ名前のデータベースの判定は同じクラスターに制限され、同じ名前のテーブルの判定は同じデータベース（同じデータベースID）に制限され、同じ名前のパーティションの判定は同じデータベース（同じデータベースID）および同じテーブル（同じテーブルID）に制限されます。

デフォルト: 3

動的設定可能か: true

Master FEノード固有の設定項目か: true

#### `cluster_id`

デフォルト：-1

ノード（FEまたはBE）は、同じcluster idを持つ場合、同じDorisクラスターに属すると見なされます。クラスター idは通常、master FEが最初に開始されるときに生成されるランダムな整数です。独自に指定することもできます。

#### `heartbeat_mgr_blocking_queue_size`

デフォルト：1024

MasterOnly：true

heartbeat_mgrでハートビートタスクを保存するブロッキングキューサイズ。

#### `heartbeat_mgr_threads_num`

デフォルト：8

MasterOnly：true

heartbeat_mgrでハートビートイベントを処理するスレッド数。

#### `disable_cluster_feature`

デフォルト：true

IsMutable：true

マルチクラスター機能はバージョン0.12で廃止予定です。この設定をtrueにすると、クラスター機能に関連するすべての操作が無効になります。含まれる操作:

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

前方互換性のため、後で削除される予定です。imageファイルのダウンロード時にトークンをチェックします。

#### `enable_multi_tags`

デフォルト: false

動的設定可能か: false

Master FEノード固有の設定項目か: true

単一BEのマルチタグ機能を有効にするかどうか

#### `initial_root_password`

rootユーザーの初期2段階SHA-1暗号化パスワードを設定します。デフォルトは''で、rootパスワードなしを意味します。rootユーザーの後続の`set password`操作は初期rootパスワードを上書きします。

例: 平文パスワード`root@123`を設定したい場合。Doris SQL `select password('root@123')`を実行して暗号化パスワード`*A00C34073A26B40AB4307650BFB9309D6BFA6999`を生成できます。

デフォルト: 空文字列

動的設定可能か: false

Master FEノード固有の設定項目か: true

### サービス

#### `query_port`

デフォルト：9030

FE MySQLサーバーポート

#### `arrow_flight_sql_port`

デフォルト：-1

Arrow Flight SQLサーバーポート

#### `frontend_address`

ステータス: 非推奨、使用を推奨しません。このパラメータは後で削除される可能性があります

タイプ: string

説明: *InetAddress.getByName*を使用してIPアドレスを取得する代わりに、FEのIPアドレスを明示的に設定します。通常は*InetAddress.getByName*で期待される結果が得られない場合に使用します。IPアドレスのみサポートし、ホスト名はサポートしません。

デフォルト値: 0.0.0.0

#### `priority_networks`

デフォルト：none

多くのIPを持つサーバーの選択戦略を宣言します。このリストに一致するIPは最大1つであることに注意してください。これはセミコロン区切り形式のリストで、CIDR記法で記述します（例：10.10.10.0/24）。このルールに一致するIPがない場合、ランダムに1つ選択されます。

#### `http_port`

デフォルト：8030

HTTPバインドポート。現在、すべてのFE httpポートは同じである必要があります。

#### `https_port`

デフォルト：8050

HTTPSバインドポート。現在、すべてのFE httpsポートは同じである必要があります。

#### `enable_https`

デフォルト：false

Https有効フラグ。値がfalseの場合、httpがサポートされます。そうでなければ、httpとhttpsの両方がサポートされ、httpリクエストは自動的にhttpsにリダイレクトされます。
enable_httpsがtrueの場合、fe.confでSSL証明書情報を設定する必要があります。

#### `enable_ssl`

デフォルト：true

trueに設定すると、dorisはSSLプロトコルに基づいてmysqlとの暗号化チャネルを確立します。

#### `qe_max_connection`

デフォルト：1024

FEあたりの最大接続数。

#### `check_java_version`

デフォルト：true

Dorisはコンパイル済みJavaバージョンと実行時Javaバージョンが互換性があるかどうかをチェックし、そうでなければJavaバージョン不一致例外メッセージを投げて起動を終了します

#### `rpc_port`

デフォルト：9020

FE Thrift サーバーポート

#### `thrift_server_type`

この設定はFEのThrift Serviceが使用するサービスモデルを表し、Stringタイプで大文字小文字を区別しません。

このパラメータが'SIMPLE'の場合、'TSimpleServer'モデルが使用されます。これは一般的に本番環境には適さず、テスト用途に限定されます。

パラメータが'THREADED'の場合、'TThreadedSelectorServer'モデルが使用されます。これは非ブロッキングI/Oモデル、すなわちmaster-slave Reactorモデルで、大量の並行接続要求にタイムリーに応答でき、ほとんどのシナリオで良好な性能を発揮します。

このパラメータが`THREAD_POOL`の場合、`TThreadPoolServer`モデルが使用されます。これはブロッキングI/Oモデルで、スレッドプールを使用してユーザー接続を処理し、同時接続数はスレッドプール数によって制限されます。並行リクエスト数を事前に推定でき、十分なスレッドリソースコストを許容できる場合、このモデルはより良い性能を発揮します。このサービスモデルはデフォルトで使用されます

#### `thrift_server_max_worker_threads`

デフォルト：4096

thriftサーバーの最大ワーカースレッド数

#### `thrift_backlog_num`

デフォルト：1024

thriftサーバーのbacklog_num。このbacklog_numを増加させる場合、linux /proc/sys/net/core/somaxconn設定よりも大きな値にする必要があります

#### `thrift_client_timeout_ms`

デフォルト：0

thriftサーバーの接続タイムアウトとソケットタイムアウト設定。

thrift_client_timeout_msの値は読み取りタイムアウトを防ぐため、ゼロに設定されています。

#### `thrift_max_message_size`

デフォルト: 100MB

thriftサーバーの（受信）メッセージの最大サイズ（バイト）。クライアントが送信するメッセージのサイズがこの制限を超えると、Thriftサーバーはリクエストを拒否し、接続を閉じます。結果として、クライアントは"connection has been closed by peer."エラーに遭遇します。この場合、このパラメータを増加してみることができます。

#### `use_compact_thrift_rpc`

デフォルト: true

クエリプラン構造を送信する際に圧縮形式を使用するかどうか。有効にすると、クエリプラン構造のサイズを約50%削減でき、"send fragment timeout"エラーを回避できます。
ただし、高並行性の小さなクエリシナリオでは、並行性が約10%減少する可能性があります。

#### `grpc_max_message_size_bytes`

デフォルト：1G

GRPCクライアントチャネルの初期フローウィンドウサイズの設定と最大メッセージサイズに使用されます。結果セットが大きい場合、この値を増加する必要があるかもしれません。

#### `max_mysql_service_task_threads_num`

デフォルト：4096

Taskイベントを処理するスレッド数。

#### `mysql_service_io_threads_num`

デフォルト：4

FEがNIOモデルに基づいてMySQLサーバーを開始する際、IOイベントを処理するスレッド数。

#### `mysql_nio_backlog_num`

デフォルト：1024

mysql nioサーバーのbacklog_num。このbacklog_numを増加する場合、同時にlinux /proc/sys/net/core/somaxconnファイルの値を増加する必要があります

#### `broker_timeout_ms`

デフォルト：10000 （10s）

デフォルトbroker RPCタイムアウト

#### `backend_rpc_timeout_ms`

FeがBEにrpcリクエストを送信する際のタイムアウトミリ秒

デフォルト: 60000

動的設定可能か: false

Master FEノード固有の設定項目か: true

#### `drop_backend_after_decommission`

デフォルト：false

IsMutable：true

MasterOnly：true

1. この設定は、BEのdecommissionが正常に完了した後、システムがBEをドロップするかどうかを制御するために使用されます。trueの場合、BEが正常にオフラインになった後、BEノードは削除されます。falseの場合、BEが正常にオフラインになった後、BEはDECOMMISSION状態に留まりますが、ドロップされません。

   この設定は特定のシナリオで役立ちます。Dorisクラスターの初期状態がBEノードあたり1つのディスクであったと仮定します。しばらく実行した後、システムは垂直拡張されました。つまり、各BEノードに2つの新しいディスクが追加されました。DorisはBE内のディスク間でのデータバランシングを現在サポートしていないため、初期ディスクのデータ量は常に新しく追加されたディスクのデータ量よりもはるかに多い可能性があります。この時点で、以下の操作により手動でディスク間バランシングを実行できます：

   1. この設定項目をfalseに設定します。
   2. 特定のBEノードに対してdecommission操作を実行します。この操作により、BE上のすべてのデータが他のノードに移行されます。
   3. decommission操作が完了した後、BEはドロップされません。この時点で、BEのdecommissionステータスをキャンセルします。その後、データは他のBEノードからこのノードにバランスバックされ始めます。この時点で、データはBEのすべてのディスクに均等に分散されます。
   4. すべてのBEノードに対して順次ステップ2と3を実行し、最終的にすべてのノードのディスクバランシングの目的を達成します

#### `max_backend_down_time_second`

デフォルト: 3600 (1 hour)

IsMutable：true

MasterOnly：true

backendが*max_backend_down_time_second*間ダウンしている場合、BACKEND_DOWNイベントがトリガーされます。

#### `disable_backend_black_list`

BEブラックリスト機能を無効にするために使用されます。この機能が無効になった後、BEへのクエリリクエストが失敗しても、BEはブラックリストに追加されません。
このパラメータは回帰テスト環境に適しており、偶発的なバグが大量の回帰テストの失敗を引き起こすことを減らします。

デフォルト: false

動的設定可能か: true

Master FEノード固有の設定項目か: false

#### `max_backend_heartbeat_failure_tolerance_count`

BEノードハートビート失敗の最大許容回数。連続するハートビート失敗回数がこの値を超えると、BEの状態はdeadに設定されます。
このパラメータは回帰テスト環境に適しており、偶発的なハートビート失敗が大量の回帰テストの失敗を引き起こすことを減らします。

デフォルト: 1

動的設定可能か: true

Master FEノード固有の設定項目か: true

### `abort_txn_after_lost_heartbeat_time_second`

ハートビート失効後のトランザクション中止時間。デフォルト値は300で、beのトランザクションがハートビート失効後300秒でアボートされることを意味します。

デフォルト: 300(s)

動的設定可能か: true

Master FEノード固有の設定項目か: true

#### `enable_access_file_without_broker`

デフォルト：false

IsMutable：true

MasterOnly：true

この設定は、brokerを介してbosやその他のクラウドストレージにアクセスする際にbrokerをスキップしようとするために使用されます

#### `agent_task_resend_wait_time_ms`

デフォルト：5000

IsMutable：true

MasterOnly：true

この設定は、agent_taskのcreate_timeが設定されている場合にエージェントタスクを再送信するかどうかを決定します。current_time - create_time > agent_task_resend_wait_time_msの場合のみ、ReportHandlerはエージェントタスクを再送信できます。

この設定は現在、主に`PUBLISH_VERSION`エージェントタスクの重複送信問題を解決するために使用されています。この設定の現在のデフォルト値は5000で、これは実験的な値です。

エージェントタスクをAgentTaskQueueに送信してからbeに送信するまでに一定の時間遅延があるため、この設定の値を増加することでエージェントタスクの重複送信問題を効果的に解決できます、

しかし同時に、送信に失敗したまたは実行に失敗したエージェントタスクの再実行が延長された期間で実行されることになります

#### `max_agent_task_threads_num`

デフォルト：4096

MasterOnly：true

エージェントタスクスレッドプールでエージェントタスクを処理するスレッドの最大数。

#### `remote_fragment_exec_timeout_ms`

デフォルト：30000 （ms）

IsMutable：true

非同期リモートフラグメントの実行タイムアウト。通常の場合、非同期リモートフラグメントは短時間で実行されます。システムが高負荷状態にある場合、このタイムアウトをより長く設定してみてください。

#### `auth_token`

デフォルト：empty

内部認証に使用されるクラスタートークン。

#### `enable_http_server_v2`

デフォルト: 公式0.14.0バージョンリリース後はデフォルトtrue、それ以前はデフォルトfalse

HTTP サーバー V2はSpringBootによって実装されています。フロントエンドとバックエンドを分離したアーキテクチャを使用します。HTTPv2が有効な場合のみ、ユーザーは新しいフロントエンドUIインターフェースを使用できます。

#### `http_api_extra_base_path`

一部のデプロイメント環境では、ユーザーはHTTP APIの統一プレフィックスとして追加のベースパスを指定する必要があります。このパラメータはユーザーが追加のプレフィックスを指定するために使用されます。
設定後、ユーザーは`GET /api/basepath`インターフェースを通じてパラメータ値を取得できます。新しいUIも最初にこのベースパスを取得してURLを組み立てようとします。`enable_http_server_v2`がtrueの場合のみ有効です。

デフォルトは空、つまり未設定

#### `jetty_server_acceptors`

デフォルト：2

#### `jetty_server_selectors`

デフォルト：4

#### `jetty_server_workers`

デフォルト：0

上記3つのパラメータで、Jettyのスレッドアーキテクチャモデルは非常にシンプルで、acceptors、selectors、workersの3つのスレッドプールに分かれています。Acceptorsは新しい接続の受け入れを担当し、その後selectorsに渡してHTTPメッセージプロトコルの解凍を処理し、最後にworkersがリクエストを処理します。最初の2つのスレッドプールは非ブロッキングモデルを採用し、1つのスレッドで多くのソケットの読み書きを処理できるため、スレッドプール数は少数です。

ほとんどのプロジェクトでは、acceptorsスレッドは1-2個のみが必要で、selectorsスレッドは2-4個で十分です。Workersはブロッキングビジネスロジックで、多くのデータベース操作があることが多く、大量のスレッドが必要です。具体的な数はアプリケーションのQPSとIOイベントの割合に依存します。QPSが高いほど多くのスレッドが必要で、IOの割合が高いほど待機スレッドが多くなり、総スレッド数も多くなります。

Workerスレッドプールはデフォルトで設定されていません、必要に応じて設定してください

#### `jetty_server_max_http_post_size`

デフォルト：`100 * 1024 * 1024` （100MB）

これはputまたはpostメソッドでアップロードされるファイルの最大バイト数です、デフォルト値：100MB

#### `jetty_server_max_http_header_size`

デフォルト：1048576 （1M）

httpヘッダーサイズ設定パラメータ、デフォルト値は1Mです。

#### `http_sql_submitter_max_worker_threads`

デフォルト：2

http sql submitterの最大ワーカースレッド数

#### `http_load_submitter_max_worker_threads`

デフォルト：2

httpアップロードsubmitterの最大ワーカースレッド数

### クエリエンジン

#### `default_max_query_instances`

ユーザープロパティmax_query_instancesが0以下の場合のデフォルト値。この設定はユーザーのインスタンス最大数を制限するために使用されます。このパラメータが0以下の場合は無制限を意味します。

デフォルト値は-1

#### `max_query_retry_time`

デフォルト：3

IsMutable：true

クエリリトライ回数。RPC例外が発生し、ユーザーに結果が送信されていない場合、クエリはリトライする可能性があります。雪崩災害を避けるため、この数を減らすことができます

#### `max_dynamic_

```text
current running txns on db xxx is xx, larger than limit xx
```
このエラーが発生した場合、現在クラスター内で実行中のロードジョブが設定値を超えていることを意味します。この場合、ビジネス側で待機し、ロードジョブをリトライすることを推奨します。

Connectorを使用する場合、このパラメータの値を適切に調整でき、数千でも問題ありません

#### `using_old_load_usage_pattern`

Default：false

IsMutable：true

MasterOnly：true

trueに設定すると、処理エラーが発生したinsert stmtでもユーザーにラベルが返されます。ユーザーはこのラベルを使用してロードジョブのステータスを確認できます。デフォルト値はfalseです。これは、insert操作でエラーが発生した場合、ロードラベルなしで例外が直接ユーザークライアントにスローされることを意味します。

#### `disable_load_job`

Default：false

IsMutable：true

MasterOnly：true

これがtrueに設定された場合

* begin txn apiが呼ばれるとすべてのpendingロードジョブが失敗します
* commit txn apiが呼ばれるとすべてのprepareロードジョブが失敗します
* すべてのcommittedロードジョブはパブリッシュされるまで待機します

#### `commit_timeout_second`

Default：30

IsMutable：true

MasterOnly：true

1つのトランザクション前に挿入されたすべてのデータがコミットされるまでの最大待機時間
これは"commit"コマンドのタイムアウト秒数です

#### `max_unfinished_load_job`

Default：1000

IsMutable：true

MasterOnly：true

PENDING、ETL、LOADING、QUORUM_FINISHEDを含むロードジョブの最大数。この数を超えると、ロードジョブの送信は許可されません

#### `db_used_data_quota_update_interval_secs`

Default：300 (s)

IsMutable：true

MasterOnly：true

1つのマスターデーモンスレッドが`db_used_data_quota_update_interval_secs`ごとにdb txn manager用のデータベース使用データクォータを更新します

データロードのパフォーマンス向上のため、データロード前にデータベースで使用されているデータ量がクォータを超えているかどうかの確認において、データベースですでに使用されているデータ量をリアルタイムで計算するのではなく、デーモンスレッドの定期的に更新される値を取得します。

この設定は、データベースで使用されているデータ量の値を更新する時間間隔を設定するために使用されます

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

1つのbroker loadジョブでbroker scannerが処理できる最大バイト数。通常、各Backendsに1つのbroker scannerがあります。

#### `default_load_parallelism`

Default: 8

IsMutable：true

MasterOnly：true

単一ノードでのbroker load実行プランのデフォルト並列度。
broker loadの送信時にユーザーが並列度を設定した場合、このパラメータは無視されます。
このパラメータは`max broker concurrency`、`min bytes per broker scanner`などの複数の設定と合わせてインポートタスクの同時実行数を決定します。

#### `max_broker_concurrency`

Default：10

IsMutable：true

MasterOnly：true

broker scannerの最大同時実行数。

#### `min_bytes_per_broker_scanner`

Default：67108864L (64M)

IsMutable：true

MasterOnly：true

単一のbroker scannerが読み取る最小バイト数。

#### `period_of_auto_resume_min`

Default：5 （s）

IsMutable：true

MasterOnly：true

Routine loadの自動復元サイクル

#### `max_tolerable_backend_down_num`

Default：0

IsMutable：true

MasterOnly：true

1つのBEがダウンしている限り、Routine Loadは自動復元できません

#### `max_routine_load_task_num_per_be`

Default：5

IsMutable：true

MasterOnly：true

BE当たりの最大同時routine loadタスク数。これはBEに送信されるroutine loadタスクの数を制限するためのもので、BEの設定'routine_load_thread_pool_size'（デフォルト10）より小さくする必要があります。これはBEでのroutine loadタスクスレッドプールサイズです。

#### `max_routine_load_task_concurrent_num`

Default：5

IsMutable：true

MasterOnly：true

単一のroutine loadジョブの最大同時routine loadタスク数

#### `max_routine_load_job_num`

Default：100

NEED_SCHEDULED、RUNNING、PAUSEを含む最大routine loadジョブ数

#### `desired_max_waiting_jobs`

Default：100

IsMutable：true

MasterOnly：true

routine loadおよびバージョン2のloadの待機ジョブのデフォルト数。これは希望する数です。マスター切り替えなどの一部の状況では、現在の数がdesired_max_waiting_jobsを超える場合があります。

#### `disable_hadoop_load`

Default：false

IsMutable：true

MasterOnly：true

hadoopクラスターを使用したロードは将来廃止される予定です。この種類のロードを無効にするにはtrueに設定してください。

#### `enable_spark_load`

Default：false

IsMutable：true

MasterOnly：true

spark loadを一時的に有効にするかどうか、デフォルトでは有効になっていません

**注：** このパラメータはバージョン1.2で削除されており、spark_loadはデフォルトで有効になっています

#### `spark_load_checker_interval_second`

Default：60

Spark loadスケジューラーの実行間隔、デフォルト60秒

#### `async_loading_load_task_pool_size`

Default：10

IsMutable：false

MasterOnly：true

loading_loadタスクエグゼキューターのプールサイズ。このプールサイズは実行中のloading_loadタスクの最大数を制限します。

現在、broker loadのloading_loadタスクのみを制限します

#### `async_pending_load_task_pool_size`

Default：10

IsMutable：false

MasterOnly：true

pending_loadタスクエグゼキューターのプールサイズ。このプールサイズは実行中のpending_loadタスクの最大数を制限します。

現在、broker loadとspark loadのpending_loadタスクのみを制限します。

'max_running_txn_num_per_db'より小さくする必要があります

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

この設定はstream loadのタイムアウト設定を制限するために特別に使用されます。ユーザーの大きなタイムアウト設定により、失敗したstream loadトランザクションが短時間でキャンセルできなくなることを防ぐためです

#### `max_load_timeout_second`

Default: 259200 (3 day)

IsMutable：true

MasterOnly：true

stream loadを除くすべてのタイプのロードに適用される最大ロードタイムアウト

#### `stream_load_default_timeout_second`

Default: 86400 * 3 (3 day)

IsMutable：true

MasterOnly：true

デフォルトのstream loadおよびstreaming mini loadタイムアウト

#### `stream_load_default_precommit_timeout_second`

Default：3600（s）

IsMutable：true

MasterOnly：true

デフォルトのstream loadプリ送信タイムアウト

#### `stream_load_default_memtable_on_sink_node`

Default：false

IsMutable：true

MasterOnly：true

stream loadでデフォルトでsink nodeのmemtableを有効にします。
HTTPヘッダー`memtable_on_sink_node`が設定されていない場合。

#### `insert_load_default_timeout_second`

Default: 3600 (1 hour)

IsMutable：true

MasterOnly：true

デフォルトのinsert loadタイムアウト

#### `mini_load_default_timeout_second`

Default: 3600 (1 hour)

IsMutable：true

MasterOnly：true

デフォルトの非streaming mini loadタイムアウト

#### `broker_load_default_timeout_second`

Default: 14400 (4 hour)

IsMutable：true

MasterOnly：true

デフォルトのbroker loadタイムアウト

#### `spark_load_default_timeout_second`

Default: 86400  (1 day)

IsMutable：true

MasterOnly：true

デフォルトのspark loadタイムアウト

#### `hadoop_load_default_timeout_second`

Default: 86400 * 3   (3 day)

IsMutable：true

MasterOnly：true

デフォルトのhadoop loadタイムアウト

#### `load_running_job_num_limit`

Default：0

IsMutable：true

MasterOnly：true

ロードタスクの数制限、デフォルトは0で制限なし

#### `load_input_size_limit_gb`

Default：0

IsMutable：true

MasterOnly：true

Loadジョブで入力されるデータのサイズ、デフォルトは0で無制限

#### `load_etl_thread_num_normal_priority`

Default：10

NORMAL優先度etl loadジョブの同時実行数。何をしているかわからない場合は変更しないでください。

#### `load_etl_thread_num_high_priority`

Default：3

HIGH優先度etl loadジョブの同時実行数。何をしているかわからない場合は変更しないでください

#### `load_pending_thread_num_normal_priority`

Default：10

NORMAL優先度pending loadジョブの同時実行数。何をしているかわからない場合は変更しないでください。

#### `load_pending_thread_num_high_priority`

Default：3

HIGH優先度pending loadジョブの同時実行数。Loadジョブの優先度はHIGHまたはNORMALとして定義されます。すべてのmini batch loadジョブはHIGH優先度で、その他のタイプのloadジョブはNORMAL優先度です。優先度は遅いloadジョブが長時間スレッドを占有することを回避するために設定されています。これは内部の最適化されたスケジューリングポリシーです。現在、ジョブの優先度を手動で指定することはできません。何をしているかわからない場合は変更しないでください。

#### `load_checker_interval_second`

Default：5 （s）

ロードスケジューラーの実行間隔。ロードジョブはPENDINGからLOADINGを経てFINISHEDへと状態を遷移します。ロードスケジューラーはロードジョブをPENDINGからLOADINGに遷移させ、txnコールバックはロードジョブをLOADINGからFINISHEDに遷移させます。そのため、同時実行数が上限に達していない場合、ロードジョブは最大で1つの間隔で完了します。

#### `label_keep_max_second`

Default：`3 * 24 * 3600`  (3 day)

IsMutable：true

MasterOnly：true

完了またはキャンセルされたロードジョブのラベルは`label_keep_max_second`後に削除されます。

1. 削除されたラベルは再利用できます。
2. 短時間を設定するとFEのメモリ使用量が減少します。（削除される前はすべてのロードジョブの情報がメモリに保持されるため）

高い同時書き込みの場合、大量のジョブのバックログがありfrontendサービスの呼び出しに失敗した場合は、ログを確認してください。メタデータの書き込みがロックのために長時間かかっている場合は、この値を12時間または6時間に調整できます

#### `streaming_label_keep_max_second`

Default: 43200 (12 hour)

IsMutable：true

MasterOnly：true

INSERT、STREAMING LOAD、ROUTINE_LOAD_TASKなどの一部の高頻度ロード作業では、期限切れの場合、完了したジョブまたはタスクを削除します。

#### `label_clean_interval_second`

Default: 1 * 3600  (1 hour)

ロードラベルクリーナーは*label_clean_interval_second*ごとに実行され、期限切れのジョブをクリーンアップします。

#### `label_regex_length`

Default Value: 128 (characters)

ロードラベルの最大文字長、デフォルトは128文字です。

#### `transaction_clean_interval_second`

Default：30

トランザクションが可視またはアボートされた場合、transaction_clean_interval_second秒後にトランザクションがクリーンアップされます。この間隔をできるだけ短くし、各クリーンサイクルをできるだけ早くする必要があります

#### `sync_commit_interval_second`

トランザクションをコミットするための最大時間間隔。この時間後もチャネルに未送信のデータがある場合、コンシューマーはチャネルにトランザクションの送信を通知します。

Default: 10 (seconds)

動的に設定可能か：true

Master FEノード固有の設定項目か：true

#### `sync_checker_interval_second`

データ同期ジョブの実行ステータスチェック。

Default: 10 (s)

#### `max_sync_task_threads_num`

データ同期ジョブスレッドプールの最大スレッド数。

デフォルト値：10

#### `min_sync_commit_size`

トランザクションをコミットするために満たす必要のあるイベントの最小数。Feが受信したイベント数がこれより少ない場合、時間が`sync_commit_interval_second`を超えるまで次のバッチのデータを待機し続けます。デフォルト値は10000イベントです。この設定を変更したい場合は、この値がcanal側の`canal.instance.memory.buffer.size`設定（デフォルト16384）より小さいことを確認してください。そうでないと、Feはackする前にストアより長いキュー長のイベントを取得しようとして、ストアキューがタイムアウトするまでブロックされます。

Default: 10000

動的に設定可能か：true

Master FEノード固有の設定項目か：true

#### `min_bytes_sync_commit`

トランザクションをコミットするために必要な最小データサイズ。Feが受信したデータサイズがこれより小さい場合、時間が`sync_commit_interval_second`を超えるまで次のバッチのデータを待機し続けます。デフォルト値は15MBです。この設定を変更したい場合は、この値がcanal側の`canal.instance.memory.buffer.size`と`canal.instance.memory.buffer.memunit`の積（デフォルト16MB）より小さいことを確認してください。そうでないと、ackする前にFeはストア領域より大きいデータを取得しようとして、ストアキューがタイムアウトするまでブロックされます。

Default: `15*1024*1024` (15M)

動的に設定可能か：true

Master FEノード固有の設定項目か：true

#### `max_bytes_sync_commit`

データ同期ジョブスレッドプールの最大スレッド数。FE全体に1つのスレッドプールのみがあり、FE内のBEにデータを送信するすべてのデータ同期タスクの処理に使用されます。スレッドプールの実装は`SyncTaskPool`クラスにあります。

Default: 10

動的に設定可能か：false

Master FEノード固有の設定項目か：false

#### `enable_outfile_to_local`

Default：false

outfile機能が結果をローカルディスクにエクスポートすることを許可するかどうか。

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

実行中のエクスポートジョブの同時実行制限。デフォルトは5です。0は無制限

#### `export_checker_interval_second`

Default：5

エクスポートチェッカーの実行間隔。

#### `enable_mow_load_force_take_ms_lock`

> Since 3.1.0

Default: true

IsMutable：true

MasterOnly：true

計算ストレージ分離モードにおけるMerge-On-Write UniqueテーブルでのインポートについてForced lock acquisition mechanismを有効にするかどうかを指定します。有効にした場合、インポートトランザクションがコミット段階でmeta-serviceのテーブル分散ロック取得を試行中に待機時間閾値（`mow_load_force_take_ms_lock_threshold_ms`で設定）を超えた場合、強制的にロックを取得します。
この機能は、高頻度・高同時実行インポートワークロードにおけるロック競合によるインポートレイテンシテールを削減するのに役立ちます。

#### `mow_load_force_take_ms_lock_threshold_ms`

> Since 3.1.0

Default: 500

IsMutable：true

MasterOnly：true

計算ストレージ分離モードにおけるMerge-On-Write Uniqueテーブルでのインポートトランザクションの強制ロック取得をトリガーするタイムアウト閾値（ミリ秒）。

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

ログレベル：INFO、WARN、ERROR、FATAL

#### `sys_log_roll_num`

Default：10

sys_log_roll_interval内で保持される最大FEログファイル数。デフォルトは10で、1日で最大10のログファイルが存在することを意味します

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

デフォルトは7日で、ログの最終変更時刻が7日前の場合、削除されます。

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
Auditログfe.audit.logには、ユーザー、ホスト、コスト、ステータスなどの関連情報を含むすべてのリクエストが含まれています

#### `audit_log_roll_num`

Default：90

audit_log_roll_interval内で保持される最大FE auditログファイル数。

#### `audit_log_modules`

Default：{"slow_query", "query", "load", "stream_load"}

Slow queryには*qe_slow_log_ms*を超えるすべてのクエリが含まれています

#### `qe_slow_log_ms`

Default: 5000 (5 seconds)

クエリのレスポンス時間がこの閾値を超える場合、auditログにslow_queryとして記録されます。

#### `audit_log_roll_interval`

Default：DAY

DAY:  ログサフィックスは : yyyyMMdd
HOUR: ログサフィックスは : yyyyMMddHH

#### `audit_log_delete_age`

Default：30d

デフォルトは30日で、ログの最終変更時刻が30日前の場合、削除されます。

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

nereids traceログのディレクトリを指定するために使用されます

### Storage

#### `min_replication_num_per_tablet`

Default: 1

タブレット当たりの最小レプリケーション数を設定するために使用されます。

#### `max_replication_num_per_tablet`

Default: 32767

タブレット当たりの最大レプリケーション数を設定するために使用されます。

#### `default_db_data_quota_bytes`

Default：8192PB

IsMutable：true

MasterOnly：true

デフォルトのデータベースデータクォータサイズを設定するために使用されます。単一データベースのクォータサイズを設定するには、次を使用できます：

```
Set the database data quota, the unit is:B/K/KB/M/MB/G/GB/T/TB/P/PB
ALTER DATABASE db_name SET DATA QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```
#### `default_db_replica_quota_size`

Default: 1073741824

IsMutable：true

MasterOnly：true

デフォルトのデータベースレプリカクォータの設定に使用されます。単一のデータベースのクォータサイズを設定するには、以下を使用できます：

```
Set the database replica quota
ALTER DATABASE db_name SET REPLICA QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```
#### `recover_with_empty_tablet`

Default：false

IsMutable：true

MasterOnly：true

コードのバグや人為的な操作ミスなど、非常に特殊な状況において、一部のタブレットのすべてのレプリカが失われる可能性があります。この場合、データは実質的に失われています。しかし、一部のシナリオでは、データ損失があってもクエリがエラーを報告しないことをビジネス側が望み、ユーザー層の認知を減らしたい場合があります。この時点で、空のTabletを使用して不足しているレプリカを埋めて、クエリが正常に実行できることを保証できます。

trueに設定すると、Dorisは自動的に空のレプリカを使用して、すべてのレプリカが破損または紛失したタブレットを埋めます。

#### `min_clone_task_timeout_sec` `And max_clone_task_timeout_sec`

Default: 最小3分、最大2時間

IsMutable：true

MasterOnly：true

`mix_clone_task_timeout_sec`と連携して、cloneタスクの最大および最小タイムアウトを制御できます。通常の状況では、cloneタスクのタイムアウトは、データ量と最小転送速度（5MB/s）によって推定されます。一部の特殊なケースでは、これら2つの設定を使用してcloneタスクタイムアウトの上限と下限を設定し、cloneタスクが正常に完了することを保証できます。

#### `disable_storage_medium_check`

Default：false

IsMutable：true

MasterOnly：true

disable_storage_medium_checkがtrueの場合、ReportHandlerはタブレットのストレージメディアをチェックせず、ストレージクールダウン機能を無効にします。デフォルト値はfalseです。タブレットのストレージメディアを気にしない場合は、値をtrueに設定できます。

#### `decommission_tablet_check_threshold`

Default：5000

IsMutable：true

MasterOnly：true

この設定は、Master FEが廃止予定のBE上のタブレットのステータスをチェックする必要があるかどうかを制御するために使用されます。廃止予定のBE上のタブレットのサイズがこの閾値を下回る場合、FEは定期チェックを開始し、廃止予定のBE上のすべてのタブレットがリサイクルされている場合、FEは即座にこのBEをドロップします。

パフォーマンスの観点から、この設定に非常に高い値を設定しないでください。

#### `partition_rebalance_max_moves_num_per_selection`

Default：10

IsMutable：true

MasterOnly：true

PartitionRebalancerを使用する場合のみ有効、

#### `partition_rebalance_move_expire_after_access`

Default：600   (s)

IsMutable：true

MasterOnly：true

PartitionRebalancerを使用する場合のみ有効。これが変更された場合、キャッシュされた移動はクリアされます

#### `tablet_rebalancer_type`

Default：BeLoad

MasterOnly：true

リバランサータイプ（大文字小文字を無視）：BeLoad、Partition。タイプの解析に失敗した場合、デフォルトとしてBeLoadを使用

#### `max_balancing_tablets`

Default：100

IsMutable：true

MasterOnly：true

TabletScheduler内のバランシング中のタブレット数がmax_balancing_tabletsを超える場合、これ以上のバランスチェックは行いません

#### `max_scheduling_tablets`

Default：2000

IsMutable：true

MasterOnly：true

TabletScheduler内のスケジュールされたタブレット数がmax_scheduling_tabletsを超える場合、チェックをスキップします。

#### `disable_balance`

Default：false

IsMutable：true

MasterOnly：true

trueに設定すると、TabletSchedulerはバランスを実行しません。

#### `disable_disk_balance`

Default：true

IsMutable：true

MasterOnly：true

trueに設定すると、TabletSchedulerはディスクバランスを実行しません。

#### `balance_load_score_threshold`

Default: 0.1 (10%)

IsMutable：true

MasterOnly：true

クラスターバランススコアの閾値、backendの負荷スコアが平均スコアより10%低い場合、このbackendはLOW負荷としてマークされ、負荷スコアが平均スコアより10%高い場合、HIGH負荷としてマークされます

#### `capacity_used_percent_high_water`

Default: 0.75  (75%)

IsMutable：true

MasterOnly：true

ディスク容量使用率の高水位。これはbackendの負荷スコア計算に使用されます

#### `clone_distribution_balance_threshold`

Default: 0.2

IsMutable：true

MasterOnly：true

Backend内のレプリカ数のバランス閾値。

#### `clone_capacity_balance_threshold`

Default: 0.2

IsMutable：true

MasterOnly：true

* BE内のデータサイズのバランス閾値。

   バランスアルゴリズムは：

     1. クラスター全体の平均使用容量（AUC）を計算する。（総データサイズ / 総backend数）

     2. 高水位レベルは（AUC * (1 + clone_capacity_balance_threshold)）

     3. 低水位レベルは（AUC * (1 - clone_capacity_balance_threshold)）

     4. Cloneチェッカーは高水位レベルのBEから低水位レベルのBEへレプリカを移動しようとします。

#### `disable_colocate_balance`

Default：false

IsMutable：true

MasterOnly：true

この設定をtrueに設定すると、colocateテーブルの自動再配置とバランシングを無効にできます。'disable_colocate_balance'がtrueに設定されている場合、ColocateTableBalancerはcolocateテーブルの再配置とバランシングを行いません。

**注意**：

1. 通常の状況では、バランスを無効にする必要は全くありません。
2. 一度バランスが無効になると、不安定なcolocateテーブルが復元されない可能性があります
3. 最終的にクエリ時にcolocateプランが使用できなくなります。

#### `balance_slot_num_per_path`

Default: 1

IsMutable：true

MasterOnly：true

バランス中のパスあたりのデフォルトスロット数。

#### `disable_tablet_scheduler`

Default:false

IsMutable：true

MasterOnly：true

trueに設定すると、タブレットスケジューラーが動作しなくなり、すべてのタブレット修復/バランスタスクが動作しません。

#### `enable_force_drop_redundant_replica`

Default: false

動的設定：true

Master FEのみ：true

trueに設定すると、システムはタブレットスケジューリングロジック内で冗長レプリカを即座にドロップします。これにより、対応するレプリカに書き込んでいる一部のloadジョブが失敗する可能性がありますが、タブレットのバランスと修復速度が向上します。
クラスターでバランスまたは修復を待機している大量のレプリカがある場合、部分的なload成功率を犠牲にしてレプリカのバランスと修復を高速化するため、この設定を試すことができます。

#### `colocate_group_relocate_delay_second`

Default: 1800

動的設定：true

Master FEのみ：true

colocationグループの再配置には、クラスター内で大量のタブレットが移動することが含まれる場合があります。したがって、colocationグループの再配置をできるだけ回避するために、より保守的な戦略を使用する必要があります。
再配置は通常、BEノードがオフラインまたはダウンした後に発生します。このパラメーターは、BEノードの利用不可判定を遅延させるために使用されます。デフォルトは30分、つまり、BEノードが30分以内に回復した場合、colocationグループの再配置はトリガーされません。

#### `allow_replica_on_same_host`

Default: false

動的設定：false

Master FEのみ：false

同じタブレットの複数のレプリカを同じホストに分散することを許可するかどうか。このパラメーターは主にローカルテストに使用され、複数のBEを構築して特定のマルチレプリカ状況をテストすることを容易にします。非テスト環境では使用しないでください。

#### `repair_slow_replica`

Default: false

IsMutable：true

MasterOnly: true

trueに設定すると、compactionが遅いレプリカが自動的に検出され、他のマシンに移行されます。検出条件は、最速のレプリカのバージョン数が`min_version_count_indicate_replica_compaction_too_slow`の値を超え、最速のレプリカからのバージョン数差の比率が`valid_version_count_delta_ratio_between_replicas`の値を超えることです

#### `min_version_count_indicate_replica_compaction_too_slow`

Default: 200

動的設定：true

Master FEのみ：false

レプリカcompactionが遅すぎるかどうかを判断するために使用されるバージョン数閾値

#### `skip_compaction_slower_replica`

Default: true

動的設定：true

Master FEのみ：false

trueに設定すると、クエリ可能なレプリカを選択する際にcompactionが遅いレプリカがスキップされます

#### `valid_version_count_delta_ratio_between_replicas`

Default: 0.5

動的設定：true

Master FEのみ：true

最遅レプリカと最速レプリカのバージョン数差の有効比率閾値。`repair_slow_replica`がtrueに設定されている場合、最遅レプリカを修復するかどうかを判断するために使用されます

#### `min_bytes_indicate_replica_too_large`

Default: `2 * 1024 * 1024 * 1024` (2G)

動的設定：true

Master FEのみ：true

レプリカが大きすぎるかどうかを判断するために使用されるデータサイズ閾値

#### `schedule_slot_num_per_hdd_path`

Default：4

hdd用タブレットスケジューラーでのパスあたりのデフォルトスロット数、この設定を削除し、cloneタスク統計によって動的に調整します

#### `schedule_slot_num_per_ssd_path`

Default：8

ssd用タブレットスケジューラーでのパスあたりのデフォルトスロット数、この設定を削除し、cloneタスク統計によって動的に調整します

#### `tablet_repair_delay_factor_second`

Default：60 （s）

IsMutable：true

MasterOnly：true

タブレット修復を決定する前の遅延時間の係数。

* 優先度がVERY_HIGHの場合、即座に修復します。
* HIGH、tablet_repair_delay_factor_second * 1の遅延；
* NORMAL：tablet_repair_delay_factor_second * 2の遅延；
* LOW：tablet_repair_delay_factor_second * 3の遅延；

#### `tablet_stat_update_interval_second`

Default：300（5分）

タブレット統計の更新間隔、
すべてのフロントエンドが各間隔ですべてのbackendからタブレット統計を取得します

#### `storage_flood_stage_usage_percent`

Default：95 （95%）

IsMutable：true

MasterOnly：true

##### `storage_flood_stage_left_capacity_bytes`

Default：`1 * 1024 * 1024 * 1024` (1GB)

IsMutable：true

MasterOnly：true

ディスク容量が'storage_flood_stage_usage_percent'と'storage_flood_stage_left_capacity_bytes'に達した場合、以下の操作が拒否されます：

1. loadジョブ
2. restoreジョブ

#### `storage_high_watermark_usage_percent`

Default：85  (85%)

IsMutable：true

MasterOnly：true

#### `storage_min_left_capacity_bytes`

Default： `2 * 1024 * 1024 * 1024`  (2GB)

IsMutable：true

MasterOnly：true

'storage_high_watermark_usage_percent'はBackendストレージパスの最大容量使用率を制限します。'storage_min_left_capacity_bytes'はBackendストレージパスの最小残り容量を制限します。両方の制限に達した場合、このストレージパスはタブレットバランスの宛先として選択できません。ただし、タブレット復旧の場合、データの整合性をできるだけ維持するためにこれらの制限を超える可能性があります。

#### `catalog_trash_expire_second`

Default: 86400L (1日)

IsMutable：true

MasterOnly：true

データベース（テーブル/パーティション）を削除した後、RECOVER文を使用して復旧できます。これは最大データ保持時間を指定します。時間が経過すると、データは永続的に削除されます。

#### `default_storage_medium`

Default：HDD

テーブル（またはパーティション）を作成する際、ストレージメディア（HDDまたはSSD）を指定できます。設定されていない場合、これは作成時のデフォルトメディアを指定します。

#### `enable_storage_policy`

* Storage Policy機能を有効にするかどうか。この設定により、ユーザーはホットデータとコールドデータを分離できます。
Default: false

動的設定可能：true

Master FEノード固有の設定項目：true

#### `check_consistency_default_timeout_second`

Default: 600 (10分)

IsMutable：true

MasterOnly：true

単一の整合性チェックタスクのデフォルトタイムアウト。タブレットサイズに適合するよう十分長く設定してください

#### `consistency_check_start_time`

Default：23

IsMutable：true

MasterOnly：true

整合性チェック開始時刻

整合性チェッカーは*consistency_check_start_time*から*consistency_check_end_time*まで実行されます。

この2つの時刻が同じ場合、整合性チェックはトリガーされません。

#### `consistency_check_end_time`

Default：23

IsMutable：true

MasterOnly：true

整合性チェック終了時刻

整合性チェッカーは*consistency_check_start_time*から*consistency_check_end_time*まで実行されます。

この2つの時刻が同じ場合、整合性チェックはトリガーされません。

#### `replica_delay_recovery_second`

Default：0

IsMutable：true

MasterOnly：true

レプリカが失敗してからfeがcloneを使用してそれを復旧しようとするまでの最小遅延秒数。

#### `tablet_create_timeout_second`

Default：1（s）

IsMutable：true

MasterOnly：true

単一レプリカ作成の最大待機時間。

例：
   各タブレットに#mのタブレットと#nのレプリカを持つテーブルを作成する場合、
   テーブル作成リクエストはタイムアウトまで最大で（m *n* tablet_create_timeout_second）実行されます。

#### `tablet_delete_timeout_second`

Default：2

IsMutable：true

MasterOnly：true

*tablet_create_timeout_second*と同じ意味ですが、タブレット削除時に使用されます。

#### `delete_job_max_timeout_second`

Default: 300(s)

Mutable: true

Master only: true

deleteジョブの最大タイムアウト（秒単位）。

#### `alter_table_timeout_second`

Default: 86400 * 30 (1ヶ月)

IsMutable：true

MasterOnly：true

ALTER TABLEリクエストの最大タイムアウト。テーブルデータサイズに適合するよう十分長く設定してください。

#### `max_replica_count_when_schema_change`

OlapTableがスキーマ変更を行っている際に許可されるレプリカの最大数。レプリカが多すぎるとFE OOMを引き起こします。

Default: 100000

動的設定可能：true

Master FEノード固有の設定項目かどうか：true

#### `history_job_keep_max_second`

Default：`7 * 24 * 3600` （7日）

IsMutable：true

MasterOnly：true

一部の種類のジョブの最大保持時間。スキーマ変更ジョブやrollupジョブなど。

#### `max_create_table_timeout_second`

Default：60 （s）

IsMutable：true

MasterOnly：true

テーブル（インデックス）作成で長時間待ちすぎないよう、最大タイムアウトを設定します。

### External Table

#### `file_scan_node_split_num`

Default：128

IsMutable：true

MasterOnly：false

マルチカタログ同時ファイルスキャニングスレッド

#### `file_scan_node_split_size`

Default：`256 * 1024 * 1024`

IsMutable：true

MasterOnly：false

マルチカタログ同時ファイルスキャンサイズ

#### `enable_odbc_mysql_broker_table`

Default：false

IsMutable：true

MasterOnly：false

バージョン2.1から、ODBC、JDBC、brokerの外部テーブル作成をサポートしなくなりました。ODBCとMySQLの外部テーブルについては、代わりにJDBCテーブルまたはJDBCカタログを使用してください。brokerテーブルについては、代わりにテーブル値関数を使用してください。

#### `max_hive_partition_cache_num`

hiveパーティションのキャッシュ最大数。

Default: 100000

動的設定可能：false

Master FEノード固有の設定項目：false

#### `hive_metastore_client_timeout_second`

hive metastoreのデフォルト接続タイムアウト。

Default: 10

動的設定可能：true

Master FEノード固有の設定項目：true

#### `max_external_cache_loader_thread_pool_size`

外部メタキャッシュロード用の最大スレッドプールサイズ。

Default: 10

動的設定可能：false

Master FEノード固有の設定項目：false

#### `max_external_file_cache_num`

外部テーブルに使用するファイルキャッシュの最大数。

Default: 100000

動的設定可能：false

Master FEノード固有の設定項目：false

#### `max_external_schema_cache_num`

外部テーブルに使用するスキーマキャッシュの最大数。

Default: 10000

動的設定可能：false

Master FEノード固有の設定項目：false

#### `external_cache_expire_time_minutes_after_access`

最後のアクセス後にキャッシュ内のデータが期限切れになるまでの時間を設定します。単位は分です。
External Schema CacheとHive Partition Cacheの両方に適用されます。

Default: 1440

動的設定可能：false

Master FEノード固有の設定項目：false

#### `es_state_sync_interval_second`

Default：10

feはes_state_sync_interval_secsごとにes APIを呼び出してesインデックスシャード情報を取得します

### External Resources

#### `dpp_hadoop_client_path`

Default：/lib/hadoop-client/hadoop/bin/hadoop

#### `dpp_bytes_per_reduce`

Default：`100 * 1024 * 1024L` (100M)

#### `dpp_default_cluster`

Default：palo-dpp

#### `dpp_default_config_str`

Default：{
               hadoop_configs : 'mapred.job.priority=NORMAL;mapred.job.map.capacity=50;mapred.job.reduce.capacity=50;mapred.hce.replace.streaming=false;abaci.long.stored.job=true;dce.shuffle.enable=false;dfs.client.authserver.force_stop=true;dfs.client.auth.method=0'
         }

#### `dpp_config_str`

Default：{
               palo-dpp : {
                     hadoop_palo_path : '/dir',
                     hadoop_configs : 'fs.default.name=hdfs://host:port;mapred.job.tracker=host:port;hadoop.job.ugi=user,password'
                  }
      }

#### `yarn_config_dir`

Default: DorisFE.DORIS_HOME_DIR + "/lib/yarn-config"

デフォルトyarn設定ファイルディレクトリ、yarnコマンドを実行する前に毎回、このパス下に設定ファイルが存在することを確認し、存在しない場合は作成する必要があります。

#### `yarn_client_path`

Default：DORIS_HOME_DIR + "/lib/yarn-client/hadoop/bin/yarn"

デフォルトyarnクライアントパス

#### `spark_launcher_log_dir`

Default： sys_log_dir + "/spark_launcher_log"

指定されたspark launcherログディレクトリ

#### `spark_resource_path`

Default：none

デフォルトspark依存関係パス

#### `spark_home_default_dir`

Default：DORIS_HOME_DIR + "/lib/spark2x"

デフォルトsparkホームディレクトリ

#### `spark_dpp_version`

Default: 1.0.0

デフォルトspark dppバージョン

### Else

#### `tmp_dir`

Default: DorisFE.DORIS_HOME_DIR + "/temp_dir"

temp dirは、バックアップや復元プロセスなど、一部のプロセスの中間結果を保存するために使用されます。このディレクトリ内のファイルは、これらのプロセスが完了した後にクリーンアップされます。

#### `custom_config_dir`

Default: DorisFE.DORIS_HOME_DIR + "/conf"

カスタム設定ファイルディレクトリ

`fe_custom.conf`ファイルの場所を設定します。デフォルトは`conf/`ディレクトリです。

一部のデプロイメント環境では、システムアップグレードにより`conf/`ディレクトリが上書きされる可能性があります。これにより、ユーザーが変更した設定項目が上書きされます。この場合、`fe_custom.conf`を別の指定されたディレクトリに保存して、設定ファイルが上書きされることを防ぐことができます。

#### `plugin_dir`

Default：DORIS_HOME + "/plugins

プラグインインストールディレクトリ

#### `plugin_enable`

Default:true

IsMutable：true

MasterOnly：true

プラグインが有効かどうか、デフォルトで有効

#### `small_file_dir`

Default：DORIS_HOME_DIR/small_files

小さなファイルを保存

#### `max_small_file_size_bytes`

Default：1M

IsMutable：true

MasterOnly：true

SmallFileMgrに保存される単一ファイルの最大サイズ

#### `max_small_file_number`

Default：100

IsMutable：true

MasterOnly：true

SmallFileMgrに保存されるファイルの最大数

#### `enable_metric_calculator`

Default：true

trueに設定すると、メトリックコレクターはデーモンタイマーとして実行され、固定間隔でメトリックを収集します

#### `report_queue_size`

Default： 100

IsMutable：true

MasterOnly：true

この閾値は、FEでレポートタスクが多く蓄積しすぎることを避けるためのもので、OOM例外を引き起こす可能性があります。一部の大規模なDorisクラスターでは、例：1000万のレプリカを持つ100のBackendでは、メタデータの変更（パーティションドロップなど）後にタブレットレポートに数秒かかる場合があります。そして1つのBackendは1分ごとにタブレット情報をレポートするため、無制限にレポートを受信することは受け入れられません。将来的にはタブレットレポートの処理速度を最適化しますが、現在は、キューサイズが制限を超えた場合はレポートを破棄します。
   一部のオンライン時間コスト：
      1. diskレポート：0-1ms
      2. skレポート：0-1ms
      3. tabletレポート
      4. 10000レプリカ：200ms

#### `backup_job_default_timeout_ms`

Default: 86400 * 1000  (1日)

IsMutable：true

MasterOnly：true

backupジョブのデフォルトタイムアウト

#### `backup_upload_task_num_per_be`

Default：3

IsMutable：true

MasterOnly：true

バックアッププロセス中に各beに割り当てられるアップロードタスクの最大数、デフォルト値は3です。

#### `restore_download_task_num_per_be`

Default：3

IsMutable：true

MasterOnly：true

復元プロセス中に各beに割り当てられるダウンロードタスクの最大数、デフォルト値は3です。

#### `max_backup_restore_job_num_per_db`

Default: 10

この設定は主に各データベースで記録されるbackup/restoreタスクの数を制御するために使用されます。

#### `max_backup_tablets_per_job`

Default: 300000

IsMutable：true

MasterOnly：true

backupジョブごとに関与するタブレットの最大数を制御し、過度のメタデータ保存によるFE OOMを回避します。

#### `enable_quantile_state_type`

Default：false

IsMutable：true

MasterOnly：true

quantile_stateデータタイプを有効にするかどうか

#### `enable_date_conversion`

Default：true

IsMutable：true

MasterOnly：true

FEは自動的にdate/datetimeをdatev2/datetimev2(0)に変換します。

#### `enable_decimal_conversion`

Default：true

IsMutable：true

MasterOnly：true

FEは自動的にDecimalV2をDecimalV3に変換します。

#### `proxy_auth_magic_prefix`

Default：x@8

#### `proxy_auth_enable`

Default：false

#### `enable_func_pushdown`

Default：true

IsMutable：true

MasterOnly：false

ODBC、JDBC外部テーブルのクエリを実行する際に、関数を含むフィルタ条件をMYSQLにプッシュダウンするかどうか

#### `jdbc_drivers_dir`

Default: `${DORIS_HOME}/jdbc_drivers`;

IsMutable：false

MasterOnly：false

jdbcドライバーを配置するデフォルトディレクトリ。

#### `max_error_tablet_of_broker_load`

Default: 3;

IsMutable：true

MasterOnly：true

broker loadで表示されるエラータブレットの最大数。

#### `default_db_max_running_txn_num`

Default：-1

IsMutable：true

MasterOnly：true

デフォルトデータベーストランザクションクォータサイズの設定に使用されます。

デフォルト値を-1に設定することは、`default_db_max_running_txn_num`の代わりに`max_running_txn_num_per_db`を使用することを意味します。

単一データベースのクォータサイズを設定するには、以下を使用できます：

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

trueに設定すると、外部テーブルに対するクエリは計算ノードに優先的に割り当てられます。計算ノードの最大数は`min_backend_num_for_external_table`によって制御されます。
falseに設定すると、外部テーブルに対するクエリは任意のノードに割り当てられます。

#### `min_backend_num_for_external_table`

Default：3

IsMutable：true

MasterOnly：false

`prefer_compute_node_for_external_table`がtrueの場合のみ有効になります。計算ノード数がこの値より少ない場合、外部テーブルに対するクエリは、合計ノード数がこの値に達するように、いくつかの混合ノードの取得を試行します。
計算ノード数がこの値より大きい場合、外部テーブルに対するクエリは計算ノードのみに割り当てられます。

#### `infodb_support_ext_catalog`

Default: false

IsMutable: true

MasterOnly: false

falseの場合、information_schemaデータベース内のテーブルからselectを実行する際、結果には外部カタログ内のテーブル情報が含まれません。
これは外部カタログに到達できない場合のクエリ時間を回避するためです。

#### `enable_query_hit_stats`

Default: false

IsMutable: true

MasterOnly: false

クエリヒット統計を有効にするかどうかを制御します。デフォルトはfalseです。

#### `div_precision_increment`

Default: 4

この変数は、`/`演算子で実行される除算演算の結果のスケールを増加させる桁数を示します。

#### `enable_convert_light_weight_schema_change`

Default：true

一時的な設定オプションです。有効にすると、バックグラウンドスレッドが開始され、すべてのolapテーブルをライトスキーマ変更に自動的に変更します。変更結果は`show convert_light_schema_change [from db]`コマンドで確認でき、すべての非ライトスキーマ変更テーブルの変換結果が表示されます。

#### `disable_local_deploy_manager_drop_node`

Default：true

LocalDeployManagerによるノードの削除を禁止し、cluster.infoファイルのエラーによってノードが削除されることを防ぎます。

#### `mysqldb_replace_name`

Default: mysql

MySQLエコシステムとの互換性を確保するため、Dorisにはmysqlという組み込みデータベースが含まれています。このデータベースがユーザー自身のデータベースと競合する場合、このフィールドを変更して、Doris組み込みのMySQLデータベースの名前を別の名前に置き換えてください。

#### `max_auto_partition_num`

Default value: 2000

自動パーティションテーブルにおいて、ユーザーが誤って大量のパーティションを作成することを防ぐため、OLAPテーブルごとに許可されるパーティション数は`max_auto_partition_num`です。デフォルト2000です。

#### `profile_manager_gc_interval_seconds`

Default value: 1

ProfileManagerがプロファイルのガベージコレクションを実行する間隔を制御するために使用されます。ガベージコレクション中、ProfileManagerはメモリを節約するために、メモリとディスクから過剰で期限切れのプロファイルを削除します。

### 計算とストレージ分離モード

#### `cluster_id`

Default：-1

node（FEまたはBE）は、同じcluster idを持つ場合、同じDorisクラスタに属していると見なされます。計算とストレージ分離モードでは、ランダムなintを1つ指定する必要があります。

#### `deploy_mode`

Default: ""

Description: FEが動作するモード。`cloud`はストレージ・計算分離モードを示します。

#### `meta_service_endpoint`

Default: ""

メタサービスのエンドポイントは'host1:port,host2:port'の形式で指定する必要があります。この設定はストレージと計算分離モードに必要です。
