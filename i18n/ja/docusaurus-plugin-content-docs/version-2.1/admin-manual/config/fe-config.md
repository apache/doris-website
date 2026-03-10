---
{
  "title": "FE設定 | Config",
  "language": "ja",
  "toc_min_heading_level": 2,
  "toc_max_heading_level": 4,
  "description": "このドキュメントは主にFEの関連設定項目について紹介します。",
  "sidebar_label": "FE Configuration"
}
---
<!-- Please sort the configuration alphabetically -->

# FE設定

このドキュメントでは、主にFEの関連する設定項目を紹介します。

FE設定ファイル`fe.conf`は通常、FEデプロイメントパスの`conf/`ディレクトリに格納されます。バージョン0.14では、別の設定ファイル`fe_custom.conf`が導入されます。この設定ファイルは、運用中にユーザーが動的に設定し、永続化した設定項目を記録するために使用されます。

FEプロセスが開始されると、最初に`fe.conf`の設定項目を読み込み、次に`fe_custom.conf`の設定項目を読み込みます。`fe_custom.conf`の設定項目は、`fe.conf`の同じ設定項目を上書きします。

`fe_custom.conf`ファイルの場所は、`custom_config_dir`設定項目を通じて`fe.conf`で設定できます。

## 設定項目の表示

FEの設定項目を表示する方法は2つあります：

1. FE webページ

    ブラウザでFE webページ`http://fe_host:fe_http_port/variable`を開きます。`Configure Info`で現在有効なFE設定項目を確認できます。

2. コマンドによる表示

    FEが開始された後、以下のコマンドでMySQLクライアントからFEの設定項目を表示できます。具体的な言語法は[SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG)を参照してください：

    `SHOW FRONTEND CONFIG;`

    結果の各列の意味は以下の通りです：

    * Key: 設定項目の名前。
    * Value: 現在の設定項目の値。
    * Type: 設定項目の値タイプ（integerやstringなど）。
    * IsMutable: 動的設定が可能かどうか。trueの場合、設定項目は実行時に動的設定可能です。falseの場合、設定項目は`fe.conf`でのみ設定可能で、FE再起動後に有効になることを意味します。
    * MasterOnly: Master FEノード独自の設定項目かどうか。trueの場合、設定項目はMaster FEノードでのみ意味があり、他のタイプのFEノードでは意味がありません。falseの場合、設定項目はすべてのタイプのFEノードで意味があります。
    * Comment: 設定項目の説明。

## 設定項目の設定

FE設定項目を設定する方法は2つあります：

1. 静的設定

    `conf/fe.conf`ファイルで設定項目を追加・設定します。`fe.conf`の設定項目は、FEプロセス開始時に読み込まれます。`fe.conf`にない設定項目はデフォルト値を使用します。

2. MySQLプロトコル経由の動的設定

    FE開始後、以下のコマンドで設定項目を動的に設定できます。このコマンドには管理者権限が必要です。

    `ADMIN SET FRONTEND CONFIG (" fe_config_name "=" fe_config_value ");`

    すべての設定項目が動的設定をサポートしているわけではありません。`SHOW FRONTEND CONFIG;`コマンド結果の`IsMutable`列で動的設定がサポートされているかどうかを確認できます。

    `MasterOnly`の設定項目が変更された場合、コマンドは直接Master FEに転送され、Master FE内の対応する設定項目のみが変更されます。

    **この方法で変更された設定項目は、FEプロセス再起動後に無効になります。**

    このコマンドの詳細なヘルプは、`HELP ADMIN SET CONFIG;`コマンドで確認できます。

3. HTTPプロトコル経由の動的設定

    詳細については、[Set Config Action](../open-api/fe-http/set-config-action)を参照してください。

    この方法では、変更された設定項目を永続化することもできます。設定項目は`fe_custom.conf`ファイルに永続化され、FE再起動後も有効のままです。

## 例

1. `async_pending_load_task_pool_size`の変更

    `SHOW FRONTEND CONFIG;`で、この設定項目は動的設定できない（`IsMutable`がfalse）ことが確認できます。`fe.conf`に以下を追加する必要があります：

    `async_pending_load_task_pool_size = 20`

    その後、FEプロセスを再起動して設定を有効にします。

2. `dynamic_partition_enable`の変更

    `SHOW FRONTEND CONFIG;`で、この設定項目は動的設定可能（`IsMutable`がtrue）であることが確認できます。また、これはMaster FE独自の設定です。まず任意のFEに接続し、以下のコマンドを実行して設定を変更できます：

    ```
    ADMIN SET FRONTEND CONFIG ("dynamic_partition_enable" = "true"); `
    ```
その後、以下のコマンドで変更された値を確認できます：

    ```
    set forward_to_master = true;
    SHOW FRONTEND CONFIG;
    ```
上記の方法で変更した後、Master FEが再起動されるかMaster選出が実行されると、設定は無効になります。設定項目を`fe.conf`に直接追加してFEを再起動することで、設定項目を永続化できます。

3. `max_distribution_pruner_recursion_depth`を変更する

    `SHOW FRONTEND CONFIG;`を通じて、この設定項目が動的に設定可能であることがわかります（`IsMutable`がtrue）。これはMaster FE固有の設定ではありません。

    同様に、設定を動的に変更するコマンドによって設定を変更できます。この設定はMaster FE固有ではないため、ユーザーは異なるFEに個別に接続して設定を動的に変更し、すべてのFEが変更された設定値を使用するようにする必要があります。

## 設定

### メタデータとクラスタ

#### `meta_dir`

デフォルト：DORIS_HOME_DIR + "/doris-meta"

型: string 説明: Dorisのメタデータがここに保存されます。このディレクトリのストレージは以下の特性を持つことを強く推奨します：

* 高い書き込みパフォーマンス（SSD）
* 安全性（RAID）

#### `catalog_try_lock_timeout_ms`

デフォルト：5000 （ms）

IsMutable：true

カタログロックのtryLockタイムアウト設定。通常は変更する必要がありませんが、何かをテストする必要がある場合を除きます。

#### `enable_bdbje_debug_mode`

デフォルト：false

trueに設定すると、FEはBDBJEデバッグモードで起動されます

#### `max_bdbje_clock_delta_ms`

デフォルト：5000 （5s）

非マスターFEとMaster FEホスト間の許容可能な最大クロックスキューを設定します。この値は、非マスターFEがBDBJE経由でマスターFEへの接続を確立する際に毎回チェックされます。クロックスキューがこの値より大きい場合、接続は破棄されます。

#### `metadata_failure_recovery`

デフォルト：false

trueの場合、FEはbdbjeレプリケーショングループをリセットし（つまり、すべての選出可能ノード情報を削除）、Masterとして起動することが想定されます。すべての選出可能ノードが起動できない場合、メタデータを別のノードにコピーし、この設定をtrueに設定してFEの再起動を試行できます。

#### `txn_rollback_limit`

デフォルト：100

グループへの再参加を試行する際にbdbjeがロールバックできる最大トランザクション数

#### `grpc_threadmgr_threads_nums`

デフォルト: 4096

grpc_threadmgrでgrpcイベントを処理するスレッド数。

#### `bdbje_replica_ack_timeout_second`

デフォルト：10  (s)

bdbjeへの書き込み時のレプリカackタイムアウト。比較的大きなログを書き込む際、ack時間がタイムアウトし、ログ書き込みに失敗する場合があります。この場合、この値を適切に増やすことができます。

#### `bdbje_lock_timeout_second`

デフォルト：5

bdbje操作のロックタイムアウト。FE WARNログに多くのLockTimeoutExceptionがある場合、この値を増やすことを試行できます

#### `bdbje_heartbeat_timeout_second`

デフォルト：30

マスターとフォロワー間のbdbjeのハートビートタイムアウト。デフォルトは30秒で、bdbjeのデフォルト値と同じです。ネットワークに一時的な問題がある場合や、予期しない長いJava GCに悩まされている場合、この値を増やして誤ったタイムアウトの可能性を減らすことを試行できます

#### `replica_ack_policy`

デフォルト：SIMPLE_MAJORITY

オプション: ALL、NONE、SIMPLE_MAJORITY

bdbjeのレプリカackポリシー。詳細情報については、<http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.ReplicaAckPolicy.html>を参照してください

#### `replica_sync_policy`

デフォルト：SYNC

オプション：SYNC、NO_SYNC、WRITE_NO_SYNC

フォロワーFEのbdbje同期ポリシー。

#### `master_sync_policy`

デフォルト：SYNC

オプション：SYNC、NO_SYNC、WRITE_NO_SYNC

マスターFEのbdbje同期ポリシー。1つのフォロワーFEのみをデプロイする場合、これを'SYNC'に設定します。3つ以上のフォロワーFEをデプロイする場合、これと以下の'replica_sync_policy'をWRITE_NO_SYNCに設定できます。詳細情報については、<http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.SyncPolicy.html>を参照してください

#### `bdbje_reserved_disk_bytes`

レプリケートされたJE環境で保持する予約領域のバイト数の望ましい上限。

デフォルト: 1073741824

動的設定可能かどうか: false

Master FEノード固有の設定項目かどうか: false

#### `ignore_meta_check`

デフォルト：false

IsMutable：true

trueの場合、非マスターFEは、メタデータ遅延ギャップが*meta_delay_toleration_second*を超えても、Master FEと自身の間のメタデータ遅延ギャップを無視します。非マスターFEは引き続き読み取りサービスを提供します。
これは、何らかの理由でMaster FEを比較的長時間停止する場合でも、非マスターFEが読み取りサービスを提供することを望む場合に有用です。

#### `meta_delay_toleration_second`

デフォルト: 300 (5分)

メタデータ遅延ギャップが*meta_delay_toleration_second*を超えると、非マスターFEはサービス提供を停止します

#### `edit_log_port`

デフォルト：9010

bdbjeポート

#### `edit_log_type`

デフォルト：BDB

編集ログタイプ。
BDB: bdbjeにログを書き込む
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

trueに設定すると、チェックポイントスレッドはjvmメモリ使用率に関係なくチェックポイントを作成します

#### `metadata_checkpoint_memory_threshold`

デフォルト：60  （60%）

IsMutable：true

MasterOnly：true

jvmメモリ使用率（ヒープまたは旧メモリプール）がこの閾値を超える場合、チェックポイントスレッドはOOMを避けるために動作しません。

#### `max_same_name_catalog_trash_num`

カタログ回収ビン内の同じ名前のメタ情報の最大数を設定するために使用されます。最大値を超えると、最も早く削除されたメタトラッシュが完全に削除され、回復できません。0は同じ名前のオブジェクトを保持しないことを意味します。< 0は制限なしを意味します。

注意：同じ名前のメタデータの判定は一定の範囲に制限されます。たとえば、同じ名前のデータベースの判定は同じクラスタに制限され、同じ名前のテーブルの判定は同じデータベース（同じデータベースIDを持つ）に制限され、同じ名前のパーティションの判定は同じデータベース（同じデータベースIDを持つ）と同じテーブル（同じテーブルIDを持つ）に制限されます。

デフォルト: 3

動的設定可能かどうか: true

Master FEノード固有の設定項目かどうか: true

#### `cluster_id`

デフォルト：-1

同じcluster idを持つnode（FEまたはBE）は、同じDorisクラスタに属するとみなされます。Cluster idは通常、マスターFEが最初に起動するときに生成されるランダムな整数です。独自に指定することもできます。

#### `heartbeat_mgr_blocking_queue_size`

デフォルト：1024

MasterOnly：true

heartbeat_mgrにハートビートタスクを格納するブロッキングキューサイズ。

#### `heartbeat_mgr_threads_num`

デフォルト：8

MasterOnly：true

heartbeat_mgrでハートビートイベントを処理するスレッド数。

#### `disable_cluster_feature`

デフォルト：true

IsMutable：true

マルチクラスタ機能はバージョン0.12で非推奨となる予定です。この設定をtrueにすると、クラスタ機能に関連するすべての操作が無効になります。これには以下が含まれます：

1. クラスタの作成/削除
2. フリーバックエンドの追加/クラスタへのバックエンド追加/クラスタバランス廃止
3. クラスタのバックエンド数変更
4. データベースのリンク/移行

#### `enable_fqdn_mode`

この設定は主にk8sクラスタ環境で使用されます。enable_fqdn_modeがtrueの場合、beが配置されているpodの名前は再構築後も変更されずに残りますが、ipは変更される可能性があります。

デフォルト: false

動的設定可能かどうか: false

Master FEノード固有の設定項目かどうか: true

#### `enable_token_check`

デフォルト：true

前方互換性のため、後で削除される予定です。イメージファイルのダウンロード時にトークンをチェックします。

#### `enable_multi_tags`

デフォルト: false

動的設定可能かどうか: false

Master FEノード固有の設定項目かどうか: true

単一BEのマルチタグ機能を有効にするかどうか

#### `initial_root_password`

rootユーザーの初期2段階SHA-1暗号化パスワードを設定します。デフォルトは''で、rootパスワードなしを意味します。rootユーザーに対するその後の`set password`操作は、初期rootパスワードを上書きします。

例：平文パスワード`root@123`を設定したい場合。Doris SQL `select password('root@123')`を実行して暗号化パスワード`*A00C34073A26B40AB4307650BFB9309D6BFA6999`を生成できます。

デフォルト: 空文字列

動的設定可能かどうか: false

Master FEノード固有の設定項目かどうか: true

### サービス

#### `query_port`

デフォルト：9030

FE MySQLサーバーポート

#### `arrow_flight_sql_port`

デフォルト：-1

Arrow Flight SQLサーバーポート

#### `frontend_address`

ステータス: 非推奨、使用は推奨されません。このパラメータは後で削除される可能性があります

型: string

説明: *InetAddress.getByName*を使用してIPアドレスを取得する代わりに、FEのIPアドレスを明示的に設定します。通常は*InetAddress.getByName*で期待される結果が得られない場合に使用します。IPアドレスのみサポートされ、ホスト名はサポートされません。

デフォルト値: 0.0.0.0

#### `priority_networks`

デフォルト：none

多くのIPを持つサーバーの選択戦略を宣言します。このリストに一致するIPは最大で1つである必要があります。これはセミコロン区切り形式のリスト（CIDR記法）です（例：10.10.10.0/24）。このルールに一致するIPがない場合、ランダムに1つ選択されます。

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

trueに設定すると、dorisはmysqlとSSLプロトコルに基づく暗号化チャネルを確立します。

#### `qe_max_connection`

デフォルト：1024

FEあたりの最大接続数。

#### `check_java_version`

デフォルト：true

Dorisはコンパイル時と実行時のJavaバージョンが互換性があるかどうかをチェックし、互換性がない場合はJavaバージョン不一致例外メッセージをスローして起動を終了します

#### `rpc_port`

デフォルト：9020

FE Thrift Serverポート

#### `thrift_server_type`

この設定はFEのThrift Serviceで使用されるサービスモデルを表し、文字列型で大文字小文字を区別しません。

このパラメータが'SIMPLE'の場合、'TSimpleServer'モデルが使用されます。これは一般的に本番環境には適さず、テスト使用に限定されます。

パラメータが'THREADED'の場合、'TThreadedSelectorServer'モデルが使用されます。これはノンブロッキングI/Oモデル、すなわちマスター・スレーブReactorモデルであり、多数の同時接続リクエストにタイムリーに応答でき、ほとんどのシナリオで良好なパフォーマンスを発揮します。

このパラメータが`THREAD_POOL`の場合、`TThreadPoolServer`モデルが使用されます。このモデルはブロッキングI/Oモデル用で、スレッドプールを使用してユーザー接続を処理し、同時接続数はスレッドプール数によって制限されます。同時リクエスト数を事前に推定でき、十分なスレッドリソースコストを許容できる場合、このモデルはより良いパフォーマンスを提供します。このサービスモデルがデフォルトで使用されます

#### `thrift_server_max_worker_threads`

デフォルト：4096

thriftサーバーの最大ワーカースレッド数

#### `thrift_backlog_num`

デフォルト：1024

thriftサーバーのbacklog_num。このbacklog_numを増やす場合、その値がlinux /proc/sys/net/core/somaxconn設定より大きいことを確認する必要があります

#### `thrift_client_timeout_ms`

デフォルト：0

thriftサーバーの接続タイムアウトとソケットタイムアウト設定。

thrift_client_timeout_msの値は読み取りタイムアウトを防ぐためにゼロに設定されます。

#### `thrift_max_message_size`

:::tip Tips
この設定はApache Doris 1.2.4バージョン以降でサポートされています
:::

デフォルト: 100MB

thriftサーバーの（受信）メッセージの最大サイズ（バイト単位）。クライアントが送信するメッセージのサイズがこの制限を超えると、Thriftサーバーはリクエストを拒否し、接続を閉じます。その結果、クライアントは「connection has been closed by peer」エラーが発生します。この場合、このパラメータを増やすことを試行できます。

#### `use_compact_thrift_rpc`

デフォルト: true

クエリプラン構造を送信する際に圧縮形式を使用するかどうか。有効にすると、クエリプラン構造のサイズを約50%削減でき、一部の「send fragment timeout」エラーを回避できます。
ただし、一部の高同時実行小クエリシナリオでは、同時実行性が約10%低下する可能性があります。

#### `grpc_max_message_size_bytes`

デフォルト：1G

GRPCクライアントチャネルの初期フローウィンドウサイズの設定、および最大メッセージサイズの設定に使用されます。結果セットが大きい場合、この値を増やす必要がある場合があります。

#### `max_mysql_service_task_threads_num`

デフォルト：4096

タスクイベントを担当するスレッド数。

#### `mysql_service_io_threads_num`

デフォルト：4

FEがNIOモデルに基づいてMySQLサーバーを起動する際の、IOイベントを担当するスレッド数。

#### `mysql_nio_backlog_num`

デフォルト：1024

mysql nioサーバーのbacklog_num。このbacklog_numを増やす場合、同時にlinux /proc/sys/net/core/somaxconnファイルの値も増やす必要があります

#### `broker_timeout_ms`

デフォルト：10000   （10s）

デフォルトブローカーRPCタイムアウト

#### `backend_rpc_timeout_ms`

FeがBEにrpcリクエストを送信するタイムアウトミリ秒

デフォルト: 60000

動的設定可能かどうか: false

Master FEノード固有の設定項目かどうか: true

#### `drop_backend_after_decommission`

デフォルト：false

IsMutable：true

MasterOnly：true

1. この設定は、BEの廃止が成功した後にシステムがBEを削除するかどうかを制御するために使用されます。trueの場合、BEノードはBEが正常にオフラインになった後に削除されます。falseの場合、BEが正常にオフラインになった後、BEはDECOMMISSION状態のままですが、削除されません。

   この設定は特定のシナリオで役割を果たすことができます。Dorisクラスタの初期状態が各BEノードあたり1つのディスクであると仮定します。一定期間実行した後、システムは垂直拡張され、つまり各BEノードに2つの新しいディスクが追加されます。Dorisは現在BE内でのディスク間のデータバランシングをサポートしていないため、初期ディスクのデータ量は新しく追加されたディスクのデータ量よりもはるかに多い可能性があります。この時、以下の操作により手動でディスク間バランシングを実行できます：

   1. この設定項目をfalseに設定します。
   2. 特定のBEノードに対してdecommission操作を実行します。この操作により、BE上のすべてのデータが他のノードに移行されます。
   3. decommission操作が完了した後、BEは削除されません。この時、BEのdecommission状態をキャンセルします。その後、データは他のBEノードからこのノードにバランシングされ始めます。この時、データはBEのすべてのディスクに均等に分散されます。
   4. すべてのBEノードに対して順次ステップ2と3を実行し、最終的にすべてのノードのディスクバランシングの目的を達成します

#### `max_backend_down_time_second`

デフォルト: 3600  (1時間)

IsMutable：true

MasterOnly：true

バックエンドが*max_backend_down_time_second*間ダウンしている場合、BACKEND_DOWNイベントがトリガーされます。

#### `disable_backend_black_list`

BEブラックリスト機能を無効にするために使用されます。この機能を無効にすると、BEへのクエリリクエストが失敗してもBEはブラックリストに追加されません。
このパラメータは回帰テスト環境に適しており、偶発的なバグが多数の回帰テストの失敗を引き起こすことを減らします。

デフォルト: false

動的設定可能かどうか: true

Master FEノード固有の設定項目かどうか: false

#### `max_backend_heartbeat_failure_tolerance_count`

BEノードハートビート失敗の最大許容回数。連続するハートビート失敗回数がこの値を超えると、BE状態がdeadに設定されます。
このパラメータは回帰テスト環境に適しており、偶発的なハートビート失敗が多数の回帰テストの失敗を引き起こすことを減らします。

デフォルト: 1

動的設定可能かどうか: true

Master FEノード固有の設定項目かどうか: true

### `abort_txn_after_lost_heartbeat_time_second`

ハートビート失去後のトランザクション中止時間。デフォルト値は300で、beのトランザクションはハートビート失去後300秒でabortされることを意味します。

デフォルト: 300(s)

動的設定可能かどうか: true

Master FEノード固有の設定項目かどうか: true

#### `enable_access_file_without_broker`

デフォルト：false

IsMutable：true

MasterOnly：true

この設定は、ブローカー経由でbosやその他のクラウドストレージにアクセスする際にブローカーをスキップすることを試行するために使用されます

#### `agent_task_resend_wait_time_ms`

デフォルト：5000

IsMutable：true

MasterOnly：true

この設定は、agent_taskのcreate_timeが設定されている場合にエージェントタスクを再送信するかどうかを決定します。current_time - create_time > agent_task_resend_wait_time_msの場合のみ、ReportHandlerはエージェントタスクの再送信を実行できます。

この設定は現在主に`PUBLISH_VERSION`エージェントタスクの重複送信問題を解決するために使用されます。この設定の現在のデフォルト値は5000で、これは実験値です。

エージェントタスクをAgentTaskQueueに送信してからbeに送信するまでに一定の時間遅延があるため、この設定の値を増やすことでエージェントタスクの重複送信問題を効果的に解決できますが、

同時に、失敗したまたは実行に失敗したエージェントタスクの再実行が延長された期間行われることになります

#### `max_agent_task_threads_num`

デフォルト：4096

MasterOnly：true

エージェントタスクスレッドプールでエージェントタスクを処理するスレッドの最大数。

#### `remote_fragment_exec_timeout_ms`

デフォルト：30000  （ms）

IsMutable：true

非同期リモートフラグメントの実行タイムアウト。通常の場合、非同期リモートフラグメントは短時間で実行されます。システムが高負荷状態にある場合、このタイムアウトをより長く設定することを試行してください。

#### `auth_token`

デフォルト：empty

内部認証に使用されるクラスタトークン。

#### `enable_http_server_v2`

デフォルト: 正式版0.14.0リリース後はデフォルトtrue、それ以前はデフォルトfalse

HTTP Server V2はSpringBootによって実装されます。フロントエンドとバックエンドを分離したアーキテクチャを使用します。HTTPv2が有効な場合のみ、ユーザーは新しいフロントエンドUIインターフェースを使用できます。

#### `http_api_extra_base_path`

一部のデプロイ環境では、ユーザーはHTTP APIの統一プレフィックスとして追加のベースパスを指定する必要があります。このパラメータは、ユーザーが追加のプレフィックスを指定するために使用されます。
設定後、ユーザーは`GET /api/basepath`インターフェースを通じてパラメータ値を取得できます。また、新しいUIもまずこのベースパスを取得してURLを組み立てることを試行します。`enable_http_server_v2`がtrueの場合のみ有効です。

デフォルトは空、つまり設定されていません

#### `jetty_server_acceptors`

デフォルト：2

#### `jetty_server_selectors`

デフォルト：4

#### `jetty_server_workers`

デフォルト：0

上記の3つのパラメータで、Jettyのスレッドアーキテクチャモデルは非常にシンプルで、acceptors、selectors、workersの3つのスレッドプールに分かれています。Acceptorsは新しい接続の受け入れを担当し、その後selectorsに渡してHTTPメッセージプロトコルのアンパッキングを処理し、最後にworkersがリクエストを処理します。最初の2つのスレッドプールはノンブロッキングモデルを採用し、1つのスレッドで多くのソケットの読み書きを処理できるため、スレッドプール数は少なくなります。

ほとんどのプロジェクトでは、1〜2のacceptorsスレッドのみが必要で、2〜4のselectorsスレッドで十分です。Workersは閉塞的なビジネスロジックで、しばしば多くのデータベース操作があり、大量のスレッドが必要です。具体的な数はアプリケーションのQPSとIOイベントの比率によって異なります。QPSが高いほど、より多くのスレッドが必要で、IOの比率が高いほど、待機しているスレッドが多くなり、より多くの総スレッドが必要になります。

Workerスレッドプールはデフォルトで設定されていません。必要に応じて設定してください

#### `jetty_server_max_http_post_size`

デフォルト：`100 * 1024 * 1024`  （100MB）

これはputまたはpostメソッドでアップロードされるファイルの最大バイト数です。デフォルト値：100MB

#### `jetty_server_max_http_header_size`

デフォルト：1048576  （1M）

httpヘッダーサイズ設定パラメータ。デフォルト値は1Mです。

#### `http_sql_submitter_max_worker_threads`

デフォルト：2

http sql submitterの最大ワーカースレッド数

```text
current running txns on db xxx is xx, larger than limit xx
```
このエラーが発生した場合、クラスター内で現在実行されているloadジョブが設定値を超過していることを意味します。この場合、ビジネス側で待機してloadジョブを再試行することをお勧めします。

Connectorを使用する場合、このパラメータの値を適切に調整でき、数千でも問題ありません

#### `using_old_load_usage_pattern`

デフォルト：false

IsMutable：true

MasterOnly：true

trueに設定すると、処理エラーが発生したinsert stmtでも、ユーザーにlabelを返します。ユーザーはこのlabelを使用してloadジョブのステータスを確認できます。デフォルト値はfalseで、これは挿入操作でエラーが発生した場合、load labelなしで例外が直接ユーザークライアントにスローされることを意味します。

#### `disable_load_job`

デフォルト：false

IsMutable：true

MasterOnly：true

これがtrueに設定されている場合：

* 保留中のすべてのloadジョブは、begin txn apiを呼び出すときに失敗します
* 準備中のすべてのloadジョブは、commit txn apiを呼び出すときに失敗します
* コミット済みのすべてのloadジョブは公開されるまで待機します

#### `commit_timeout_second`

デフォルト：30

IsMutable：true

MasterOnly：true

1つのトランザクション前に挿入されたすべてのデータがコミットされるまでの最大待機時間
これは"commit"コマンドのタイムアウト秒数です

#### `max_unfinished_load_job`

デフォルト：1000

IsMutable：true

MasterOnly：true

PENDING、ETL、LOADING、QUORUM_FINISHEDを含むloadジョブの最大数。この数を超える場合、loadジョブの送信は許可されません

#### `db_used_data_quota_update_interval_secs`

デフォルト：300 (s)

IsMutable：true

MasterOnly：true

1つのmasterデーモンスレッドは、`db_used_data_quota_update_interval_secs`ごとにdb txn manager用のデータベース使用データクォータを更新します

データロードパフォーマンスの向上のため、データロード前にデータベースが使用するデータ量がクォータを超過するかどうかのチェックでは、データベースが既に使用しているデータ量をリアルタイムで計算せず、デーモンスレッドの定期的な更新値を取得します。

この設定は、データベース使用データ量の値を更新する時間間隔を設定するために使用されます

#### `disable_show_stream_load`

デフォルト：false

IsMutable：true

MasterOnly：true

show stream loadを無効にし、メモリ内のstream loadレコードをクリアするかどうか。

#### `max_stream_load_record_size`

デフォルト：5000

IsMutable：true

MasterOnly：true

メモリに格納できる最近のstream loadレコードのデフォルト最大数。

#### `fetch_stream_load_record_interval_second`

デフォルト：120

IsMutable：true

MasterOnly：true

stream loadレコードの取得間隔。

#### `max_bytes_per_broker_scanner`

デフォルト：`500 * 1024 * 1024 * 1024L`（500G）

IsMutable：true

MasterOnly：true

1つのbroker loadジョブでbroker scannerが処理できる最大バイト数。通常、各Backendsには1つのbroker scannerがあります。

#### `default_load_parallelism`

デフォルト: 8

IsMutable：true

MasterOnly：true

単一ノードでのbroker load実行プランのデフォルト並列度。
ユーザーがbroker load送信時に並列度を設定した場合、このパラメータは無視されます。
このパラメータは`max broker concurrency`、`min bytes per broker scanner`などの複数の設定とともにインポートタスクの同時実行数を決定します。

#### `max_broker_concurrency`

デフォルト：10

IsMutable：true

MasterOnly：true

broker scannerの最大同時実行数。

#### `min_bytes_per_broker_scanner`

デフォルト：67108864L (64M)

IsMutable：true

MasterOnly：true

単一のbroker scannerが読み取る最小バイト数。

#### `period_of_auto_resume_min`

デフォルト：5（s）

IsMutable：true

MasterOnly：true

Routine loadの自動復元サイクル

#### `max_tolerable_backend_down_num`

デフォルト：0

IsMutable：true

MasterOnly：true

1つのBEがダウンしている限り、Routine Loadは自動復元できません

#### `max_routine_load_task_num_per_be`

デフォルト：1024

IsMutable：true

MasterOnly：true

BE当たりの最大同時routine loadタスク数。これはBEに送信されるroutine loadタスク数を制限するためのもので、BEの設定'max_routine_load_thread_pool_size'（デフォルト1024）よりも小さくする必要があります。これはBE上のroutine loadタスクスレッドプールサイズです。2.1のメジャーバージョンでは、バージョン2.1.4からデフォルト値は1024です。バージョン2.1.4以前のデフォルト値は5でした。

#### `max_routine_load_task_concurrent_num`

デフォルト：256

IsMutable：true

MasterOnly：true

単一routine loadジョブの最大同時routine loadタスク数。2.1のメジャーバージョンでは、バージョン2.1.4からデフォルト値は256です。バージョン2.1.4以前のデフォルト値は5でした。

#### `max_routine_load_job_num`

デフォルト：100

NEED_SCHEDULED、RUNNING、PAUSEを含む最大routine loadジョブ数

#### `desired_max_waiting_jobs`

デフォルト：100

IsMutable：true

MasterOnly：true

routine loadとloadのバージョン2の待機ジョブのデフォルト数。これは希望する数です。マスターの切り替えなど、一部の状況では、現在の数がdesired_max_waiting_jobsを超える場合があります。

#### `disable_hadoop_load`

デフォルト：false

IsMutable：true

MasterOnly：true

hadoopクラスターを使用したloadは将来廃止予定です。この種類のloadを無効にするにはtrueに設定します。

#### `enable_spark_load`

デフォルト：false

IsMutable：true

MasterOnly：true

spark loadを一時的に有効にするかどうか、デフォルトでは有効になっていません

**注意:** このパラメータはバージョン1.2で削除されており、spark_loadはデフォルトで有効になっています

#### `spark_load_checker_interval_second`

デフォルト：60

Spark loadスケジューラーの実行間隔、デフォルト60秒

#### `async_loading_load_task_pool_size`

デフォルト：10

IsMutable：false

MasterOnly：true

loading_loadタスクエグゼキューターのプールサイズ。このプールサイズは実行中のloading_loadタスクの最大数を制限します。

現在、broker loadのloading_loadタスクのみを制限します

#### `async_pending_load_task_pool_size`

デフォルト：10

IsMutable：false

MasterOnly：true

pending_loadタスクエグゼキューターのプールサイズ。このプールサイズは実行中のpending_loadタスクの最大数を制限します。

現在、broker loadとspark loadのpending_loadタスクのみを制限します。

'max_running_txn_num_per_db'より小さくする必要があります

#### `async_load_task_pool_size`

デフォルト：10

IsMutable：false

MasterOnly：true

この設定は旧バージョンとの互換性のためのもので、この設定はasync_loading_load_task_pool_sizeに置き換えられており、将来削除される予定です。

#### `enable_single_replica_load`

デフォルト：false

IsMutable：true

MasterOnly：true

stream loadとbroker loadで単一レプリカ書き込みを有効にするかどうか。

#### `min_load_timeout_second`

デフォルト：1（1s）

IsMutable：true

MasterOnly：true

すべてのタイプのloadに適用される最小stream loadタイムアウト

#### `max_stream_load_timeout_second`

デフォルト: 259200 (3 day)

IsMutable：true

MasterOnly：true

この設定は特にstream loadのタイムアウト設定を制限するために使用されます。ユーザーの大きなタイムアウト設定により、失敗したstream loadトランザクションが短時間でキャンセルできないことを防ぐためです

#### `max_load_timeout_second`

デフォルト: 259200 (3 day)

IsMutable：true

MasterOnly：true

stream loadを除くすべてのタイプのloadに適用される最大loadタイムアウト

#### `stream_load_default_timeout_second`

デフォルト: 86400 * 3 (3 day)

IsMutable：true

MasterOnly：true

デフォルトのstream loadとstreaming mini loadタイムアウト

#### `stream_load_default_precommit_timeout_second`

デフォルト：3600（s）

IsMutable：true

MasterOnly：true

デフォルトのstream loadプリコミットタイムアウト

#### `stream_load_default_memtable_on_sink_node`

デフォルト：false

IsMutable：true

MasterOnly：true

デフォルトでstream load用のsinkノード上でmemtableを有効にします。
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

デフォルトの非streaming mini loadタイムアウト

#### `broker_load_default_timeout_second`

デフォルト: 14400 (4 hour)

IsMutable：true

MasterOnly：true

デフォルトのbroker loadタイムアウト

#### `spark_load_default_timeout_second`

デフォルト: 86400 (1 day)

IsMutable：true

MasterOnly：true

デフォルトのspark loadタイムアウト

#### `hadoop_load_default_timeout_second`

デフォルト: 86400 * 3 (3 day)

IsMutable：true

MasterOnly：true

デフォルトのhadoop loadタイムアウト

#### `load_running_job_num_limit`

デフォルト：0

IsMutable：true

MasterOnly：true

loadingタスク数の制限、デフォルトは0で、制限なし

#### `load_input_size_limit_gb`

デフォルト：0

IsMutable：true

MasterOnly：true

Loadジョブによって入力されるデータのサイズ、デフォルトは0で、制限なし

#### `load_etl_thread_num_normal_priority`

デフォルト：10

NORMAL優先度のetl loadジョブの同時実行数。何をしているかわからない場合は変更しないでください。

#### `load_etl_thread_num_high_priority`

デフォルト：3

HIGH優先度のetl loadジョブの同時実行数。何をしているかわからない場合は変更しないでください

#### `load_pending_thread_num_normal_priority`

デフォルト：10

NORMAL優先度のpending loadジョブの同時実行数。何をしているかわからない場合は変更しないでください。

#### `load_pending_thread_num_high_priority`

デフォルト：3

HIGH優先度のpending loadジョブの同時実行数。Loadジョブの優先度はHIGHまたはNORMALとして定義されます。すべてのmini batch loadジョブはHIGH優先度で、その他のタイプのloadジョブはNORMAL優先度です。優先度は、低速なloadジョブが長時間スレッドを占有することを避けるために設定されています。これは単なる内部最適化スケジューリングポリシーです。現在、ジョブの優先度を手動で指定することはできません。何をしているかわからない場合は変更しないでください。

#### `load_checker_interval_second`

デフォルト：5（s）

loadスケジューラーの実行間隔。loadジョブはPENDINGからLOADINGを経てFINISHEDに状態を移行します。loadスケジューラーはloadジョブをPENDINGからLOADINGに移行し、txnコールバックはloadジョブをLOADINGからFINISHEDに移行します。そのため、同時実行数が上限に達していない場合、loadジョブは最大1間隔で完了します。

#### `label_keep_max_second`

デフォルト：`3 * 24 * 3600`（3 day）

IsMutable：true

MasterOnly：true

完了またはキャンセルされたloadジョブのlabelは`label_keep_max_second`後に削除されます。

1. 削除されたlabelは再利用できます。
2. 短い時間を設定するとFEのメモリ使用量が削減されます。（削除される前にすべてのloadジョブの情報がメモリに保持されるため）

高同時実行書き込みの場合、大量のジョブがバックログされ、frontendサービスの呼び出しが失敗した場合は、ログを確認してください。メタデータの書き込みがロックに時間がかかりすぎる場合は、この値を12時間または6時間以下に調整できます

#### `streaming_label_keep_max_second`

デフォルト: 43200 (12 hour)

IsMutable：true

MasterOnly：true

INSERT、STREAMING LOAD、ROUTINE_LOAD_TASKなどの高頻度loadワーク用。期限切れの場合、完了したジョブまたはタスクを削除します。

#### `label_clean_interval_second`

デフォルト: 1 * 3600 (1 hour)

Labelクリーナーは*label_clean_interval_second*ごとに実行され、期限切れのジョブをクリーンアップします。

#### `label_regex_length`

デフォルト値: 128 (文字)

load labelの最大文字長、デフォルトは128文字です。

#### `transaction_clean_interval_second`

デフォルト：30

トランザクションが可視またはアボートされている場合、transaction_clean_interval_second秒後にトランザクションがクリーンアップされます。この間隔をできるだけ短くし、各クリーンサイクルをできるだけ早く実行する必要があります

#### `sync_commit_interval_second`

トランザクションをコミットするための最大時間間隔。この時間後にチャネルにまだコミットされていないデータがある場合、コンシューマーはチャネルにトランザクションのコミットを通知します。

デフォルト: 10 (秒)

動的に設定可能か: true

Master FEノード固有の設定項目か: true

#### `sync_checker_interval_second`

データ同期ジョブの実行ステータスチェック。

デフォルト: 10 (s)

#### `max_sync_task_threads_num`

データ同期ジョブスレッドプール内のスレッドの最大数。

デフォルト値：10

#### `min_sync_commit_size`

トランザクションをコミットするために満たす必要があるイベントの最小数。Feが受信したイベント数がこれより少ない場合、時間が`sync_commit_interval_second`を超過するまで次のバッチのデータを待ち続けます。デフォルト値は10000イベントです。この設定を変更したい場合は、この値がcanal側の`canal.instance.memory.buffer.size`設定（デフォルト16384）より小さいことを確認してください。そうでなければ、Feはackする前にストア容量より長いキュー長のイベントを取得しようとして、ストアキューがタイムアウトまでブロックされる原因となります。

デフォルト: 10000

動的に設定可能か: true

Master FEノード固有の設定項目か: true

#### `min_bytes_sync_commit`

トランザクションをコミットするために必要な最小データサイズ。Feが受信したデータサイズがこれより小さい場合、時間が`sync_commit_interval_second`を超過するまで次のバッチのデータを待ち続けます。デフォルト値は15MBです。この設定を変更したい場合は、この値がcanal側の`canal.instance.memory.buffer.size`と`canal.instance.memory.buffer.memunit`の積（デフォルト16MB）より小さいことを確認してください。そうでなければ、ackする前にFeがストア容量より大きいデータを取得しようとして、ストアキューがタイムアウトまでブロックされる原因となります。

デフォルト: `15*1024*1024` (15M)

動的に設定可能か: true

Master FEノード固有の設定項目か: true

#### `max_bytes_sync_commit`

データ同期ジョブスレッドプール内のスレッドの最大数。FE全体に1つのスレッドプールしかなく、FE内のBEにデータを送信するすべてのデータ同期タスクを処理するために使用されます。スレッドプールの実装は`SyncTaskPool`クラス内にあります。

デフォルト: 10

動的に設定可能か: false

Master FEノード固有の設定項目か: false

#### `enable_outfile_to_local`

デフォルト：false

outfile機能がローカルディスクに結果をエクスポートすることを許可するかどうか。

#### `export_tablet_num_per_task`

デフォルト：5

IsMutable：true

MasterOnly：true

exportクエリプランあたりのタブレット数

#### `export_task_default_timeout_second`

デフォルト: 2 * 3600 (2 hour)

IsMutable：true

MasterOnly：true

exportジョブのデフォルトタイムアウト。

#### `export_running_job_num_limit`

デフォルト：5

IsMutable：true

MasterOnly：true

実行中のexportジョブの同時実行数の制限。デフォルトは5です。0は無制限です

#### `export_checker_interval_second`

デフォルト：5

Exportチェッカーの実行間隔。

### Log

#### `log_roll_size_mb`

デフォルト：1024（1G）

1つのsysログとauditログの最大サイズ

#### `sys_log_dir`

デフォルト: DorisFE.DORIS_HOME_DIR + "/log"

これはFEログディレクトリを指定します。FEは2つのログファイルを生成します：

fe.log: FEプロセスのすべてのログ。
fe.warn.log FEプロセスのすべてのWARNINGとERRORログ。

#### `sys_log_level`

デフォルト：INFO

ログレベル: INFO、WARN、ERROR、FATAL

#### `sys_log_roll_num`

デフォルト：10

sys_log_roll_interval内で保持される最大FEログファイル数。デフォルトは10で、1日に最大10個のログファイルがあることを意味します

#### `sys_log_verbose_modules`

デフォルト：{}

Verboseモジュール。VERBOSEレベルはlog4jのDEBUGレベルで実装されています。

例：
   sys_log_verbose_modules = org.apache.doris.catalog
   これはパッケージorg.apache.doris.catalogとそのすべてのサブパッケージ内のファイルのデバッグログのみを出力します。

#### `sys_log_roll_interval`

デフォルト：DAY

sys_log_roll_interval:

* DAY: ログサフィックスは yyyyMMdd
* HOUR: ログサフィックスは yyyyMMddHH

#### `sys_log_delete_age`

デフォルト：7d

デフォルトは7日で、ログの最終更新時刻が7日前の場合、削除されます。

サポートフォーマット：

* 7d 7日
* 10h 10時間
* 60m 60分
* 120s 120秒

#### `sys_log_roll_mode`

デフォルト：SIZE-MB-1024

ログ分割のサイズ、1Gごとにログファイルを分割

#### `sys_log_enable_compress`

デフォルト: false

trueの場合、fe.logとfe.warn.logをgzipで圧縮します

#### `audit_log_dir`

デフォルト：DORIS_HOME_DIR + "/log"

audit_log_dir：
これはFE audit logディレクトリを指定します。
Audit log fe.audit.logには、ユーザー、ホスト、コスト、ステータスなどの関連情報を含むすべてのリクエストが含まれています

#### `audit_log_roll_num`

デフォルト：90

audit_log_roll_interval内で保持される最大FE audit logファイル数。

#### `audit_log_modules`

デフォルト：{"slow_query", "query", "load", "stream_load"}

Slow queryには*qe_slow_log_ms*を超えるすべてのクエリが含まれます

#### `qe_slow_log_ms`

デフォルト: 5000 (5 seconds)

クエリの応答時間がこの閾値を超える場合、slow_queryとしてaudit logに記録されます。

#### `audit_log_roll_interval`

デフォルト：DAY

DAY: ログサフィックスは : yyyyMMdd
HOUR: ログサフィックスは : yyyyMMddHH

#### `audit_log_delete_age`

デフォルト：30d

デフォルトは30日で、ログの最終更新時刻が30日前の場合、削除されます。

サポートフォーマット：
* 7d 7日
* 10h 10時間
* 60m 60分
* 120s 120秒

#### `audit_log_enable_compress`

デフォルト: false

trueの場合、fe.audit.logをgzipで圧縮します

#### `nereids_trace_log_dir`

デフォルト: DorisFE.DORIS_HOME_DIR + "/log/nereids_trace"

nereids traceログのディレクトリを指定するために使用されます

### Storage

#### `min_replication_num_per_tablet`

デフォルト: 1

タブレットあたりの最小レプリケーション数を設定するために使用されます。

#### `max_replication_num_per_tablet`

デフォルト: 32767

タブレットあたりの最大レプリケーション数を設定するために使用されます。

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

コードのバグや人的なミスオペレーションなど、非常に特殊な状況では、一部のタブレットのすべてのレプリカが失われる場合があります。この場合、データは実質的に失われています。しかし、一部のシナリオでは、ビジネス側はデータ損失があってもクエリがエラーを報告しないことを保証し、ユーザー層の感知を軽減したいと望んでいます。この時点で、空白のTabletを使用して欠落したレプリカを埋めて、クエリが正常に実行できることを保証できます。

trueに設定すると、Dorisはすべてのレプリカが破損または欠落したタブレットを空白のレプリカで自動的に埋めます

#### `min_clone_task_timeout_sec` `And max_clone_task_timeout_sec`

デフォルト：最小3分、最大2時間

IsMutable：true

MasterOnly：true

`mix_clone_task_timeout_sec`と連携してクローンタスクの最大および最小タイムアウトを制御できます。通常の状況では、クローンタスクのタイムアウトはデータ量と最小転送レート（5MB/s）によって推定されます。一部の特殊なケースでは、これら2つの設定を使用してクローンタスクタイムアウトの上限と下限を設定し、クローンタスクが正常に完了することを保証できます。

#### `disable_storage_medium_check`

デフォルト：false

IsMutable：true

MasterOnly：true

disable_storage_medium_checkがtrueの場合、ReportHandlerはタブレットのストレージメディアをチェックせず、ストレージクールダウン機能を無効にします。デフォルト値はfalseです。タブレットのストレージメディアが何であるかを気にしない場合、値をtrueに設定できます。

#### `decommission_tablet_check_threshold`

デフォルト：5000

IsMutable：true

MasterOnly：true

この設定は、Master FEが廃止されたBE上のタブレットのステータスをチェックする必要があるかどうかを制御するために使用されます。廃止されたBE上のタブレットのサイズがこのしきい値より少ない場合、FEは定期的なチェックを開始し、廃止されたBE上のすべてのタブレットがリサイクルされた場合、FEはこのBEを直ちにドロップします。

パフォーマンスを考慮して、この設定には非常に高い値を設定しないでください。

#### `partition_rebalance_max_moves_num_per_selection`

デフォルト：10

IsMutable：true

MasterOnly：true

PartitionRebalancerを使用する場合のみ有効、

#### `partition_rebalance_move_expire_after_access`

デフォルト：600   (s)

IsMutable：true

MasterOnly：true

PartitionRebalancerを使用する場合のみ有効。これが変更された場合、キャッシュされた移動はクリアされます

#### `tablet_rebalancer_type`

デフォルト：BeLoad

MasterOnly：true

リバランサータイプ（大文字小文字を無視）：BeLoad、Partition。タイプの解析が失敗した場合、デフォルトとしてBeLoadを使用

#### `max_balancing_tablets`

デフォルト：100

IsMutable：true

MasterOnly：true

TabletScheduler内のバランシングタブレット数がmax_balancing_tabletsを超える場合、これ以上のバランスチェックは行いません

#### `max_scheduling_tablets`

デフォルト：2000

IsMutable：true

MasterOnly：true

TabletScheduler内のスケジュールされたタブレット数がmax_scheduling_tabletsを超える場合、チェックをスキップします。

#### `disable_balance`

デフォルト：false

IsMutable：true

MasterOnly：true

trueに設定すると、TabletSchedulerはバランスを実行しません。

#### `disable_disk_balance`

デフォルト：true

IsMutable：true

MasterOnly：true

trueに設定すると、TabletSchedulerはディスクバランスを実行しません。

#### `balance_load_score_threshold`

デフォルト: 0.1 (10%)

IsMutable：true

MasterOnly：true

クラスターバランススコアのしきい値。バックエンドの負荷スコアが平均スコアより10%低い場合、このバックエンドはLOW負荷としてマークされ、負荷スコアが平均スコアより10%高い場合、HIGH負荷としてマークされます

#### `capacity_used_percent_high_water`

デフォルト: 0.75  (75%)

IsMutable：true

MasterOnly：true

ディスク容量使用率のハイウォーターマーク。これはバックエンドの負荷スコアを計算するために使用されます

#### `clone_distribution_balance_threshold`

デフォルト: 0.2

IsMutable：true

MasterOnly：true

バックエンド内のレプリカ数のバランスしきい値。

#### `clone_capacity_balance_threshold`

デフォルト: 0.2

IsMutable：true

MasterOnly：true

* BE内のデータサイズのバランスしきい値。

   バランスアルゴリズムは：

     1. クラスター全体の平均使用容量（AUC）を計算します。（総データサイズ / 総バックエンド数）

     2. ハイウォーターレベルは（AUC * (1 + clone_capacity_balance_threshold)）

     3. ローウォーターレベルは（AUC * (1 - clone_capacity_balance_threshold)）

     4. クローンチェッカーはハイウォーターレベルBEからローウォーターレベルBEへレプリカの移動を試みます。

#### `disable_colocate_balance`

デフォルト：false

IsMutable：true

MasterOnly：true

この設定をtrueに設定すると、コロケートテーブルの自動再配置とバランスを無効にできます。'disable_colocate_balance'がtrueに設定されている場合、ColocateTableBalancerはコロケートテーブルの再配置とバランスを行いません。

**注意**:

1. 通常の状況では、バランスをオフにする必要は全くありません。
2. バランスがオフになると、不安定なコロケートテーブルが復元されない可能性があります
3. 最終的にクエリ時にコロケートプランが使用できなくなります。

#### `balance_slot_num_per_path`

デフォルト: 1

IsMutable：true

MasterOnly：true

バランス中のパスごとのデフォルトスロット数。

#### `disable_tablet_scheduler`

デフォルト:false

IsMutable：true

MasterOnly：true

trueに設定すると、タブレットスケジューラーは動作せず、すべてのタブレット修復/バランスタスクが動作しなくなります。

#### `enable_force_drop_redundant_replica`

デフォルト: false

動的設定可能: true

Master FE専用: true

trueに設定すると、システムはタブレットスケジューリングロジック内で冗長レプリカを直ちにドロップします。これにより、対応するレプリカに書き込んでいる一部のロードジョブが失敗する可能性がありますが、タブレットのバランスと修復速度が向上します。
クラスター内にバランスまたは修復待ちのレプリカが大量にある場合、部分的なロード成功率を犠牲にしてレプリカのバランスと修復を高速化するためにこの設定を試すことができます。

#### `colocate_group_relocate_delay_second`

デフォルト: 1800

動的設定可能: true

Master FE専用: true

コロケーショングループの再配置は、クラスター内で大量のタブレットの移動を伴う可能性があります。そのため、コロケーショングループの再配置をできるだけ避けるために、より保守的な戦略を使用する必要があります。
再配置は通常、BEノードがオフラインになったりダウンしたりした後に発生します。このパラメータは、BEノードの利用不可の判定を遅延させるために使用されます。デフォルトは30分、つまりBEノードが30分以内に回復した場合、コロケーショングループの再配置はトリガーされません。

#### `allow_replica_on_same_host`

デフォルト: false

動的設定可能: false

Master FE専用: false

同じタブレットの複数のレプリカを同じホストに配置することを許可するかどうか。このパラメータは主にローカルテストで使用され、特定のマルチレプリカ状況をテストするために複数のBEを構築することを容易にします。非テスト環境では使用しないでください。

#### `repair_slow_replica`

デフォルト: false

IsMutable：true

MasterOnly: true

trueに設定すると、コンパクションが遅いレプリカが自動的に検出され、他のマシンに移行されます。検出条件は、最速レプリカのバージョン数が`min_version_count_indicate_replica_compaction_too_slow`の値を超え、最速レプリカからのバージョン数差の比率が`valid_version_count_delta_ratio_between_replicas`の値を超えることです

#### `min_version_count_indicate_replica_compaction_too_slow`

デフォルト: 200

動的設定可能: true

Master FE専用: false

レプリカコンパクションが遅すぎるかどうかを判定するために使用されるバージョン数のしきい値

#### `skip_compaction_slower_replica`

デフォルト: true

動的設定可能: true

Master FE専用: false

trueに設定すると、クエリ可能レプリカを選択する際にコンパクションが遅いレプリカがスキップされます

#### `valid_version_count_delta_ratio_between_replicas`

デフォルト: 0.5

動的設定可能: true

Master FE専用: true

最遅レプリカと最速レプリカのバージョン数差の有効比率しきい値。`repair_slow_replica`がtrueに設定されている場合、最遅レプリカを修復するかどうかを決定するために使用されます

#### `min_bytes_indicate_replica_too_large`

デフォルト: `2 * 1024 * 1024 * 1024` (2G)

動的設定可能: true

Master FE専用: true

レプリカが大きすぎるかどうかを判定するために使用されるデータサイズしきい値

#### `schedule_slot_num_per_hdd_path`

デフォルト：4

hdd用タブレットスケジューラーのパスごとのデフォルトスロット数、この設定を削除してクローンタスク統計によって動的に調整する

#### `schedule_slot_num_per_ssd_path`

デフォルト：8

ssd用タブレットスケジューラーのパスごとのデフォルトスロット数、この設定を削除してクローンタスク統計によって動的に調整する

#### `tablet_repair_delay_factor_second`

デフォルト：60 （s）

IsMutable：true

MasterOnly：true

タブレット修復を決定する前の遅延時間の係数。

* 優先度がVERY_HIGHの場合、即座に修復します。
* HIGH、tablet_repair_delay_factor_second * 1遅延；
* NORMAL: tablet_repair_delay_factor_second * 2遅延；
* LOW: tablet_repair_delay_factor_second * 3遅延；

#### `tablet_stat_update_interval_second`

デフォルト：300（5min）

タブレット統計の更新間隔、
すべてのフロントエンドは各間隔でバックエンドからタブレット統計を取得します

#### `storage_flood_stage_usage_percent`

デフォルト：95 （95%）

IsMutable：true

MasterOnly：true

##### `storage_flood_stage_left_capacity_bytes`

デフォルト：`1 * 1024 * 1024 * 1024` (1GB)

IsMutable：true

MasterOnly：true

ディスク容量が'storage_flood_stage_usage_percent'と'storage_flood_stage_left_capacity_bytes'に達した場合、以下の操作が拒否されます：

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

'storage_high_watermark_usage_percent'はバックエンドストレージパスの最大容量使用率を制限します。'storage_min_left_capacity_bytes'はバックエンドストレージパスの最小残容量を制限します。両方の制限に達した場合、このストレージパスはタブレットバランスの宛先として選択できません。ただし、タブレット回復の場合、データの整合性をできるだけ保つためにこれらの制限を超える可能性があります。

#### `catalog_trash_expire_second`

デフォルト: 86400L (1 day)

IsMutable：true

MasterOnly：true

データベース（テーブル/パーティション）をドロップした後、RECOVER文を使用して回復できます。これは最大データ保持時間を指定します。時間が経過すると、データは永続的に削除されます。

#### `storage_cooldown_second`

:::tip Tips
この機能はApache Doris 2.0バージョン以降で廃止されています
:::

デフォルト：`30 * 24 * 3600L`  （30 day）

テーブル（またはパーティション）を作成する際、ストレージメディア（HDDまたはSSD）を指定できます。SSDに設定した場合、これはタブレットがSSD上に留まるデフォルト期間を指定します。その後、タブレットは自動的にHDDに移動されます。CREATE TABLE文でストレージクールダウン時間を設定できます。

#### `default_storage_medium`

デフォルト：HDD

テーブル（またはパーティション）を作成する際、ストレージメディア（HDDまたはSSD）を指定できます。設定されていない場合、これは作成時のデフォルトメディアを指定します。

#### `enable_storage_policy`

* Storage Policy機能を有効にするかどうか。この設定により、ユーザーはホットデータとコールドデータを分離できます。
デフォルト: false

動的設定可能: true

Master FEノード専用の設定項目: true

#### `check_consistency_default_timeout_second`

デフォルト: 600 (10 minutes)

IsMutable：true

MasterOnly：true

単一の一貫性チェックタスクのデフォルトタイムアウト。タブレットサイズに合わせて十分長く設定してください

#### `consistency_check_start_time`

デフォルト：23

IsMutable：true

MasterOnly：true

一貫性チェック開始時刻

一貫性チェッカーは*consistency_check_start_time*から*consistency_check_end_time*まで実行されます。

2つの時刻が同じ場合、一貫性チェックはトリガーされません。

#### `consistency_check_end_time`

デフォルト：23

IsMutable：true

MasterOnly：true

一貫性チェック終了時刻

一貫性チェッカーは*consistency_check_start_time*から*consistency_check_end_time*まで実行されます。

2つの時刻が同じ場合、一貫性チェックはトリガーされません。

#### `replica_delay_recovery_second`

デフォルト：0

IsMutable：true

MasterOnly：true

レプリカが失敗してからfeがクローンを使用してそれを回復しようとするまでの最小遅延秒数。

#### `tablet_create_timeout_second`

デフォルト：1（s）

IsMutable：true

MasterOnly：true

単一レプリカ作成の最大待機時間。

例：
   #mタブレットと各タブレットに#nレプリカを持つテーブルを作成する場合、
   create tableリクエストはタイムアウトまでに最大（m *n* tablet_create_timeout_second）実行されます。

#### `tablet_delete_timeout_second`

デフォルト：2

IsMutable：true

MasterOnly：true

*tablet_create_timeout_second*と同じ意味ですが、タブレット削除時に使用されます。

#### `delete_job_max_timeout_second`

デフォルト: 300(s)

Mutable: true

Master only: true

削除ジョブの最大タイムアウト（秒）。

#### `alter_table_timeout_second`

デフォルト: 86400 * 30 (1 month)

IsMutable：true

MasterOnly：true

ALTER TABLEリクエストの最大タイムアウト。テーブルデータサイズに合わせて十分長く設定してください。

#### `max_replica_count_when_schema_change`

OlapTableがスキーマ変更を行う際に許可される最大レプリカ数。レプリカが多すぎるとFE OOMが発生します。

デフォルト: 100000

動的設定可能: true

Master FEノード専用の設定項目: true

#### `history_job_keep_max_second`

デフォルト：`7 * 24 * 3600` （7 day）

IsMutable：true

MasterOnly：true

一部のジョブの最大保持時間。スキーマ変更ジョブやロールアップジョブなど。

#### `max_create_table_timeout_second`

デフォルト：60 （s）

IsMutable：true

MasterOnly：true

テーブル作成（インデックス）で長時間待機しすぎないように、最大タイムアウトを設定します。

### External Table

#### `file_scan_node_split_num`

デフォルト：128

IsMutable：true

MasterOnly：false

マルチカタログ同時ファイルスキャニングスレッド

#### `file_scan_node_split_size`

デフォルト：`256 * 1024 * 1024`

IsMutable：true

MasterOnly：false

マルチカタログ同時ファイルスキャンサイズ

#### `enable_odbc_mysql_broker_table`

デフォルト：false

IsMutable：true

MasterOnly：false

バージョン2.1以降、ODBC、JDBC、broker外部テーブルの作成をサポートしなくなりました。odbcおよびmysql外部テーブルの場合は、代わりにJDBCテーブルまたはJDBCカタログを使用してください。brokerテーブルの場合は、代わりにテーブル値関数を使用してください。

#### `max_hive_partition_cache_num`

hiveパーティションの最大キャッシュ数。

デフォルト: 100000

動的設定可能: false

Master FEノード専用の設定項目: false

#### `hive_metastore_client_timeout_second`

hive metastoreのデフォルト接続タイムアウト。

デフォルト: 10

動的設定可能: true

Master FEノード専用の設定項目: true

#### `max_external_cache_loader_thread_pool_size`

外部メタキャッシュをロードするための最大スレッドプールサイズ。

デフォルト: 10

動的設定可能: false

Master FEノード専用の設定項目: false

#### `max_external_file_cache_num`

外部テーブルで使用するファイルキャッシュの最大数。

デフォルト: 100000

動的設定可能: false

Master FEノード専用の設定項目: false

#### `max_external_schema_cache_num`

外部テーブルで使用するスキーマキャッシュの最大数。

デフォルト: 10000

動的設定可能: false

Master FEノード専用の設定項目: false

#### `external_cache_expire_time_minutes_after_access`

最後のアクセス後にキャッシュ内のデータが期限切れになるまでの時間を設定します。単位は分です。
External Schema CacheとHive Partition Cacheの両方に適用されます。

デフォルト: 1440

動的設定可能: false

Master FEノード専用の設定項目: false

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

デフォルト: DorisFE.DORIS_HOME_DIR + "/lib/yarn-config"

デフォルトyarn設定ファイルディレクトリ、yarnコマンドを実行する前に毎回、このパス下に設定ファイルが存在するかを確認し、存在しない場合は作成する必要があります。

#### `yarn_client_path`

デフォルト：DORIS_HOME_DIR + "/lib/yarn-client/hadoop/bin/yarn"

デフォルトyarnクライアントパス

#### `spark_launcher_log_dir`

デフォルト： sys_log_dir + "/spark_launcher_log"

指定されたsparkランチャーログディレクトリ

#### `spark_resource_path`

デフォルト：none

デフォルトspark依存関係パス

#### `spark_home_default_dir`

デフォルト：DORIS_HOME_DIR + "/lib/spark2x"

デフォルトsparkホームディレクトリ

#### `spark_dpp_version`

デフォルト: 1.0.0

デフォルトspark dppバージョン

### その他

#### `tmp_dir`

デフォルト: DorisFE.DORIS_HOME_DIR + "/temp_dir"

temp dirは、バックアップやリストアプロセスなど、一部のプロセスの中間結果を保存するために使用されます。このディレクトリ内のファイルは、これらのプロセスが完了後にクリーンアップされます。

#### `custom_config_dir`

デフォルト: DorisFE.DORIS_HOME_DIR + "/conf"

カスタム設定ファイルディレクトリ

`fe_custom.conf`ファイルの場所を設定します。デフォルトは`conf/`ディレクトリです。

一部のデプロイメント環境では、システムアップグレードにより`conf/`ディレクトリが上書きされる可能性があります。これによりユーザーが変更した設定項目が上書きされることになります。この時、`fe_custom.conf`を別の指定されたディレクトリに保存して、設定ファイルが上書きされることを防ぐことができます。

#### `plugin_dir`

デフォルト：DORIS_HOME + "/plugins

プラグインインストールディレクトリ

#### `plugin_enable`

デフォルト:true

IsMutable：true

MasterOnly：true

プラグインが有効になっているかどうか、デフォルトで有効

#### `small_file_dir`

デフォルト：DORIS_HOME_DIR/small_files

小さなファイルを保存

#### `max_small_file_size_bytes`

デフォルト：1M

IsMutable：true

MasterOnly：true

SmallFileMgrに格納される単一ファイルの最大サイズ

#### `max_small_file_number`

デフォルト：100

IsMutable：true

MasterOnly：true

SmallFileMgrに格納されるファイルの最大数

#### `enable_metric_calculator`

デフォルト：true

trueに設定すると、メトリックコレクターが定期的にメトリクスを収集するデーモンタイマーとして実行されます

#### `report_queue_size`

デフォルト： 100

IsMutable：true

MasterOnly：true

このしきい値は、FEでレポートタスクが蓄積しすぎてOOM例外を引き起こすことを避けるためのものです。1000万レプリカを持つ100バックエンドなどの大規模なDorisクラスターでは、メタデータの変更（パーティションドロップなど）後にタブレットレポートが数秒かかる場合があります。そして1つのバックエンドは1分ごとにタブレット情報をレポートするため、無制限にレポートを受信することは受け入れられません。キューサイズが制限を超えた場合、レポートを破棄します。将来的にタブレットレポートの処理速度を最適化する予定ですが、現在は制限を超えた場合レポートを破棄するだけです。
   一部のオンライン時間コスト：
      1. ディスクレポート: 0-1 ms
      2. タスクレポート: 0-1 ms
      3. タブレットレポート
      4. 10000レプリカ: 200ms

#### `backup_job_default_timeout_ms`

デフォルト: 86400 * 1000  (1 day)

IsMutable：true

MasterOnly：true

バックアップジョブのデフォルトタイムアウト

#### `backup_upload_task_num_per_be`

デフォルト：3

IsMutable：true

MasterOnly：true

バックアッププロセス中に各beに割り当てられるアップロードタスクの最大数、デフォルト値は3です。

#### `restore_download_task_num_per_be`

デフォルト：3

IsMutable：true

MasterOnly：true

リストアプロセス中に各beに割り当てられるダウンロードタスクの最大数、デフォルト値は3です。

#### `max_backup_restore_job_num_per_db`

デフォルト: 10

この設定は主に各データベースで記録されるバックアップ/リストアタスクの数を制御するために使用されます。

#### `max_backup_tablets_per_job`

デフォルト: 300000

IsMutable：true

MasterOnly：true

バックアップジョブごと

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

trueに設定すると、external tableに対するクエリは計算ノードに優先的に割り当てられます。計算ノードの最大数は`min_backend_num_for_external_table`によって制御されます。
falseに設定すると、external tableに対するクエリは任意のノードに割り当てられます。

#### `min_backend_num_for_external_table`

Default：3

IsMutable：true

MasterOnly：false

`prefer_compute_node_for_external_table`がtrueの場合にのみ有効になります。計算ノード数がこの値より少ない場合、external tableに対するクエリは混合ノードを取得して割り当てを試行し、ノードの総数がこの値に達するようにします。
計算ノード数がこの値より多い場合、external tableに対するクエリは計算ノードのみに割り当てられます。

#### `infodb_support_ext_catalog`

:::tip Tips
この設定はApache Doris 1.2.4バージョン以降でサポートされます
:::

Default: false

IsMutable: true

MasterOnly: false

falseの場合、information_schemaデータベースのテーブルからselectする際、
結果にexternal catalogのテーブル情報は含まれません。
これは、external catalogにアクセスできない場合のクエリ時間を回避するためです。

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

一時的な設定オプション。有効にすると、バックグラウンドスレッドが開始され、すべてのolapテーブルをlight schema changeに自動的に変更します。変更結果は`show convert_light_schema_change [from db]`コマンドで確認でき、すべての非light schema changeテーブルの変換結果が表示されます。

#### `disable_local_deploy_manager_drop_node`

Default：true

LocalDeployManagerがノードを削除することを禁止し、cluster.infoファイルのエラーによってノードが削除されることを防ぎます。

#### `mysqldb_replace_name`

Default: mysql

MySQLエコシステムとの互換性を確保するため、Dorisにはmysqlという組み込みデータベースが含まれています。このデータベースがユーザー独自のデータベースと競合する場合、このフィールドを変更してDoris組み込みMySQLデータベースの名前を別の名前に置き換えてください。

#### `max_auto_partition_num`

Default value: 2000

自動パーティション化テーブルで、ユーザーが誤って大量のパーティションを作成することを防ぐため、OLAPテーブルごとに許可されるパーティション数は`max_auto_partition_num`です。デフォルトは2000です。
