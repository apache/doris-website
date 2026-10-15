---
{
    "title": "FE 設定 | 設定",
    "language": "ja",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "メタデータ管理、クエリエンジン、ロードとエクスポート、ストレージの設定を含む、Doris の Frontend（FE）設定項目のリファレンス。",
    "sidebar_label": "FE 設定"
}
---

# FE 設定

このドキュメントでは、FE の設定項目について説明します。

FE の設定ファイル `fe.conf` は通常、FE のデプロイ先にある `conf/` ディレクトリに保存されます。バージョン 0.14 では、別の設定ファイル `fe_custom.conf` が導入されます。このファイルには、ユーザーが稼働中に動的に設定し、永続化した設定項目が記録されます。

FE プロセスは起動後、最初に `fe.conf`、次に `fe_custom.conf` の設定項目を読み込みます。`fe_custom.conf` の設定項目は、`fe.conf` にある同名の項目を上書きします。

`fe_custom.conf` の場所は、`fe.conf` の `custom_config_dir` 設定項目で指定できます。

## 設定項目の確認

FE の設定項目を確認する方法は次の二つです。

1. FE の Web ページ

    ブラウザーで FE の Web ページ `http://fe_host:fe_http_port/variable` を開きます。現在有効な FE の設定項目を `Configure Info` で確認できます。

2. コマンドで確認する

    FE の起動後、MySQL クライアントで次のコマンドを実行すると、FE の設定項目を確認できます。詳細は [SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG) を参照してください。

    `SHOW FRONTEND CONFIG;`

    結果の各列の意味は次のとおりです。

    * Key: 設定項目の名前。
    * Value: 設定項目の現在の値。
    * Type: 整数や文字列など、設定値の型。
    * IsMutable: 動的に設定できるかどうか。true の場合は実行中に変更できます。false の場合は `fe.conf` でのみ設定でき、FE の再起動後に有効になります。
    * MasterOnly: Master FE ノード固有の設定項目かどうか。true の場合は Master FE ノードでのみ意味を持ち、他の種類の FE ノードには影響しません。false の場合はすべての種類の FE ノードで意味を持ちます。
    * Comment: 設定項目の説明。

## 設定項目の変更

FE の設定項目を変更する方法は次のとおりです。

1. 静的設定

    `conf/fe.conf` ファイルに設定項目を追加して値を指定します。`fe.conf` の設定項目は FE プロセスの起動時に読み込まれます。`fe.conf` に記載されていない項目にはデフォルト値が使用されます。

2. MySQL プロトコルによる動的設定

    FE の起動後、次のコマンドで設定項目を動的に変更できます。このコマンドには管理者権限が必要です。

    `ADMIN SET FRONTEND CONFIG (" fe_config_name "=" fe_config_value ");`

    すべての設定項目が動的変更に対応しているわけではありません。`IsMutable` 列で対応状況を確認できます。この列は ` SHOW FRONTEND CONFIG; ` コマンドの結果に表示されます。

    `MasterOnly` の設定項目を変更すると、コマンドは Master FE に直接転送され、Master FE の該当項目のみが変更されます。

    **この方法で変更した設定項目は、FE プロセスの再起動後に無効になります。**

    このコマンドの詳細は `HELP ADMIN SET CONFIG;` で確認できます。

3. HTTP プロトコルによる動的設定

    詳細は [設定変更アクション](../open-api/fe-http/set-config-action) を参照してください。

    この方法では、変更した設定項目を永続化することもできます。設定項目は `fe_custom.conf` に保存され、FE の再起動後も有効です。

## 例

1. `async_pending_load_task_pool_size` を変更する

    `SHOW FRONTEND CONFIG;` で、この設定項目を動的に変更できないこと（`IsMutable` が false）を確認できます。`fe.conf` に次の設定を追加してください。

    `async_pending_load_task_pool_size = 20`

    設定を有効にするには、FE プロセスを再起動します。

2. `dynamic_partition_enable` を変更する

    `SHOW FRONTEND CONFIG;` で、この設定項目を動的に変更できること（`IsMutable` が true）、および Master FE 固有の設定であることを確認できます。任意の FE に接続し、次のコマンドを実行して変更します。

    ```
    ADMIN SET FRONTEND CONFIG ("dynamic_partition_enable" = "true"); `
    ```

    変更後の値は次のコマンドで確認できます。

    ```
    set forward_to_master = true;
    SHOW FRONTEND CONFIG;
    ```

    上記の方法で変更した設定は、Master FE の再起動または Master の選出が行われると無効になります。設定を永続化するには、`fe.conf` に設定項目を直接追加して FE を再起動します。

3. `max_distribution_pruner_recursion_depth` を変更する

    `SHOW FRONTEND CONFIG;` で、この設定項目を動的に変更できること（`IsMutable` が true）、および Master FE 固有ではないことを確認できます。

    同様に、動的設定コマンドで変更できます。この設定は Master FE 固有ではないため、すべての FE に変更後の値を適用するには、それぞれの FE に接続して個別に変更する必要があります。

## 設定項目一覧

### メタデータとクラスター

#### `meta_dir`

デフォルト：DORIS_HOME_DIR + "/doris-meta"

型: string。Doris のメタデータをここに保存します。このディレクトリには、次の特性を持つストレージを強く推奨します。

* 高い書き込み性能（SSD）
* 高い安全性（RAID）

#### `catalog_try_lock_timeout_ms`

デフォルト：5000  （ms）

動的変更可能：true

Catalog ロックの tryLock タイムアウトです。通常、テストなどの目的がなければ変更する必要はありません。

#### `enable_bdbje_debug_mode`

デフォルト：false

true に設定すると、FE は BDBJE デバッグモードで起動します。

#### `max_bdbje_clock_delta_ms`

デフォルト：5000 （5s）

Master FE 以外の FE と Master FE ホスト間で許容されるクロックのずれの最大値を設定します。Master 以外の FE が BDBJE 経由で Master FE に接続するたびに確認され、ずれがこの値を超えると接続を中止します。

#### `metadata_failure_recovery`

デフォルト：false

true の場合、FE は BDBJE レプリケーショングループをリセットし（選出可能なノードの情報をすべて削除し）、Master として起動しようとします。選出可能なノードがすべて起動できない場合は、メタデータを別のノードにコピーし、この設定を true にして FE の再起動を試みられます。

#### `txn_rollback_limit`

デフォルト：100

BDBJE がグループに再参加する際にロールバックできるトランザクションの最大数です。

#### `grpc_threadmgr_threads_nums`

デフォルト: 4096

grpc_threadmgr で gRPC イベントを処理するスレッド数です。

#### `bdbje_replica_ack_timeout_second`

デフォルト：10  (s)

BDBJE への書き込み時にレプリカの確認応答を待つタイムアウトです。比較的大きなログを書き込む際にタイムアウトしてログ書き込みが失敗する場合は、この値を適切に増やせます。

#### `bdbje_lock_timeout_second`

デフォルト：5

BDBJE 操作のロックタイムアウトです。FE の WARN ログに LockTimeoutException が多数記録される場合は、この値を増やしてみてください。

#### `bdbje_heartbeat_timeout_second`

デフォルト：30

Master と Follower 間の BDBJE ハートビートタイムアウトです。デフォルトは BDBJE と同じ 30 秒です。一時的なネットワーク障害や予期しない長時間の Java GC が発生する場合、この値を増やすと誤検知によるタイムアウトを減らせます。

#### `replica_ack_policy`

デフォルト：SIMPLE_MAJORITY

選択肢: ALL, NONE, SIMPLE_MAJORITY

BDBJE のレプリカ確認応答ポリシーです。詳細は次を参照してください。 <http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.ReplicaAckPolicy.html>

#### `replica_sync_policy`

デフォルト：SYNC

選択肢：SYNC, NO_SYNC, WRITE_NO_SYNC

Follower FE の BDBJE 同期ポリシーです。

#### `master_sync_policy`

デフォルト：SYNC

選択肢：SYNC, NO_SYNC, WRITE_NO_SYNC

Master FE の BDBJE 同期ポリシーです。Follower FE を一台だけ配置する場合は「SYNC」に設定します。Follower FE を 3 台より多く配置する場合は、この項目と 'replica_sync_policy' を WRITE_NO_SYNC に設定できます。詳細は次を参照してください。 <http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.SyncPolicy.html>

#### `bdbje_reserved_disk_bytes`

複製された JE Environment で保持する予約領域のバイト数の目標上限です。

デフォルト: 1073741824

動的変更可能: false

Master FE 固有: false

#### `ignore_meta_check`

デフォルト：false

動的変更可能：true

true の場合、Master FE 以外の FE は、メタデータの遅延が *meta_delay_toleration_second* を超えても Master FE との遅延を無視し、読み取りサービスを提供し続けます。
Master FE を比較的長時間停止する必要があり、その間も他の FE で読み取りサービスを提供したい場合に役立ちます。

#### `meta_delay_toleration_second`

デフォルト: 300 (5 分)

メタデータの遅延が *meta_delay_toleration_second* を超えると、Master FE 以外の FE はサービスの提供を停止します。

#### `edit_log_port`

デフォルト：9010

BDBJE のポートです。

#### `edit_log_type`

デフォルト：BDB

編集ログの種類です。
BDB: BDBJE にログを書き込みます。
LOCAL: 非推奨です。

#### `edit_log_roll_num`

デフォルト：50000

動的変更可能：true

Master FE のみ：true

Master FE は、メタジャーナルが *edit_log_roll_num* 件に達するたびにイメージを保存します。

#### `force_do_metadata_checkpoint`

デフォルト：false

動的変更可能：true

Master FE のみ：true

true に設定すると、チェックポイントスレッドは JVM メモリの使用率に関係なくチェックポイントを作成します。

#### `metadata_checkpoint_memory_threshold`

デフォルト：60  （60%）

動的変更可能：true

Master FE のみ：true

JVM メモリ（ヒープまたは Old 世代）の使用率がこのしきい値を超えると、OOM を避けるためにチェックポイントスレッドは動作しません。

#### `max_same_name_catalog_trash_num`

Catalog のごみ箱に保持する、同名のメタデータの最大数を設定します。上限を超えると、最も古く削除されたメタデータが完全に削除され、復元できなくなります。0 は同名のオブジェクトを保持しないこと、0 未満は無制限を意味します。

注: 同名の判定は一定の範囲に限定されます。データベースは同じクラスター内、テーブルは同じデータベース（同じデータベース ID）内、パーティションは同じデータベース（同じデータベース ID）および同じテーブル（同じテーブル ID）内で判定します。

デフォルト: 3

動的変更可能: true

Master FE 固有: true

#### `cluster_id`

デフォルト：-1

ノード（FE または BE）は、クラスター ID が同じなら同じ Doris クラスターに属すると見なされます。クラスター ID は通常、Master FE の初回起動時に生成されるランダムな整数ですが、指定することもできます。

#### `heartbeat_mgr_blocking_queue_size`

デフォルト：1024

Master FE のみ：true

heartbeat_mgr でハートビートタスクを保持するブロッキングキューのサイズです。

#### `heartbeat_mgr_threads_num`

デフォルト：8

Master FE のみ：true

heartbeat_mgr でハートビートイベントを処理するスレッド数です。

#### `disable_cluster_feature`

デフォルト：true

動的変更可能：true

マルチクラスター機能はバージョン 0.12 で非推奨になります。この項目を true にすると、次の操作を含むクラスター機能に関するすべての操作が無効になります。

1. クラスターの作成と削除
2. 空き Backend の追加、クラスターへの Backend の追加、クラスターのバランシングからの除外
3. クラスターの Backend 数の変更
4. データベースのリンクと移行

#### `enable_fqdn_mode`

この設定は主に k8s クラスター環境で使用します。enable_fqdn_mode が true の場合、BE を配置した Pod の名前は再作成後も変わりませんが、IP アドレスは変わる可能性があります。

デフォルト: false

動的変更可能: false

Master FE 固有: true

#### `enable_token_check`

デフォルト：true

前方互換性のための設定で、将来削除されます。イメージファイルのダウンロード時にトークンを確認します。

#### `fe_meta_auth_token`

デフォルト: ""（空文字列）

動的変更可能: false

FE ノード間で FE メタサービスの HTTP エンドポイント（`image`、`role`、`check`、`put`、`journal_id` など）を認証するためのクラスタートークンです。バージョン 4.0.8（Doris 4.0 系）とバージョン 4.1.4（4.1 系）で追加されました。

空でない値を設定すると、これらのエンドポイントでは既存のノードホスト検証に加えて一致するトークンヘッダーが必要になり、クラスター外から FE メタデータエンドポイントにアクセスできなくなります。空のままにすると従来のノードホスト検証のみが適用され、既存のクラスターやローリングアップグレードには影響しません。

:::caution 注意

この設定は **すべての FE** で同一にし、有効化する前に `fe.conf` に記述する必要があります。そうしないと FE 間でメタデータ要求が拒否され、メタデータの同期に失敗します。

:::

#### `enable_multi_tags`

デフォルト: false

動的変更可能: false

Master FE 固有: true

単一の BE でマルチタグ機能を有効にするかどうかを指定します。

#### `initial_root_password`

root ユーザーの初期パスワードを、2 段階の SHA-1 で暗号化した値として設定します。デフォルトの空文字列は root パスワードがないことを意味します。後で root ユーザーに `set password` を実行すると、初期パスワードは上書きされます。

例: 平文パスワード `root@123` を設定する場合、Doris SQL の `select password('root@123')` を実行して、暗号化されたパスワード `*A00C34073A26B40AB4307650BFB9309D6BFA6999` を生成できます。

デフォルト: 空文字列

動的変更可能: false

Master FE 固有: true

#### `enable_cooldown_replica_affinity`

スキャン時にクールダウン済みのレプリカを優先するかどうかを指定します。デフォルトは true です。

デフォルト: true

動的変更可能: true

Master FE 固有: false

### サービス

#### `query_port`

デフォルト：9030

FE の MySQL サーバーポートです。

#### `arrow_flight_sql_port`

デフォルト：-1

Arrow Flight SQL サーバーポートです。

#### `frontend_address`

状態: 非推奨です。使用は推奨されず、将来削除される可能性があります。

型: string

説明: *InetAddress.getByName* で取得する代わりに、FE の IP アドレスを明示的に設定します。通常は、*InetAddress.getByName* が期待する結果を返さない場合に使用します。ホスト名は指定できず、IP アドレスのみをサポートします。

デフォルト値: 0.0.0.0

#### `priority_networks`

デフォルト：none

複数の IP アドレスを持つサーバーでの選択方法を指定します。このリストに一致する IP アドレスは最大一つである必要があります。CIDR 表記（例: 10.10.10.0/24）の値をセミコロンで区切って指定します。一致する IP アドレスがなければ、ランダムに一つ選択します。

#### `http_port`

デフォルト：8030

HTTP の待ち受けポートです。現在、すべての FE の HTTP ポートを同じ値にする必要があります。

#### `https_port`

デフォルト：8050

HTTPS の待ち受けポートです。現在、すべての FE の HTTPS ポートを同じ値にする必要があります。

#### `enable_https`

デフォルト：false

HTTPS の有効化フラグです。false の場合は HTTP がサポートされます。true の場合は HTTP と HTTPS の両方がサポートされ、HTTP リクエストは自動的に HTTPS にリダイレクトされます。
enable_https が true の場合は、fe.conf に SSL 証明書の情報を設定する必要があります。

#### `enable_ssl`

デフォルト：true

true に設定すると、Doris は MySQL との間に SSL プロトコルに基づく暗号化されたチャネルを確立します。

#### `qe_max_connection`

デフォルト：1024

FE あたりの最大接続数です。

#### `check_java_version`

デフォルト：true

Doris はビルド時と実行時の Java バージョンの互換性を確認します。互換性がなければ、バージョン不一致の例外メッセージを出して起動を中止します。

#### `rpc_port`

デフォルト：9020

FE Thrift Server のポートです。

#### `thrift_server_type`

FE の Thrift Service が使用するサービスモデルを指定します。型は String で、大文字と小文字は区別されません。

この項目が「SIMPLE」の場合、'TSimpleServer' モデルが使用されます。通常は本番環境に適さず、テスト用途に限定されます。

「THREADED」の場合、ノンブロッキング I/O の Master-Slave Reactor モデルである 'TThreadedSelectorServer' が使用されます。多数の同時接続要求に迅速に応答でき、ほとんどのシナリオで良好に動作します。

`THREAD_POOL` の場合、ブロッキング I/O モデルの `TThreadPoolServer` が使用されます。スレッドプールでユーザー接続を処理し、同時接続数はプール内のスレッド数に制限されます。同時要求数を事前に見積もれ、十分なスレッド資源を確保できる場合は、このモデルがより高い性能を発揮します。これがデフォルトのサービスモデルです。

#### `thrift_server_max_worker_threads`

デフォルト：4096

Thrift サーバーのワーカースレッドの最大数です。

#### `thrift_backlog_num`

デフォルト：1024

Thrift サーバーの backlog_num です。この値を増やす場合は、Linux の /proc/sys/net/core/somaxconn の設定値との大小関係を確認してください。

#### `thrift_client_timeout_ms`

デフォルト：0

Thrift サーバーの接続タイムアウトとソケットタイムアウトの設定です。

読み取りタイムアウトを防ぐため、thrift_client_timeout_ms はゼロに設定されています。

#### `thrift_max_message_size`

デフォルト: 100MB

Thrift サーバーが受信するメッセージの最大サイズ（バイト単位）です。クライアントからのメッセージがこの上限を超えると、Thrift サーバーは要求を拒否して接続を閉じます。その結果、クライアントには「connection has been closed by peer.」というエラーが表示されます。この場合は、この設定値を増やしてみてください。

#### `use_compact_thrift_rpc`

デフォルト: true

クエリプランの構造を圧縮形式で送信するかどうかを指定します。有効にすると構造のサイズを約 50% 削減でき、一部の「send fragment timeout」エラーを回避できます。
ただし、小規模なクエリが高い並行度で実行される場合は、並行処理能力が約 10% 低下することがあります。

#### `grpc_max_message_size_bytes`

デフォルト：1G

gRPC クライアントチャネルの初期フローウィンドウサイズと、メッセージの最大サイズを設定します。結果セットが大きい場合は、この値を増やす必要があります。

#### `max_mysql_service_task_threads_num`

デフォルト：4096

Task イベントを処理するスレッド数です。

#### `mysql_service_io_threads_num`

デフォルト：4

FE が NIO モデルに基づく MySQL サーバーを起動する際に、I/O イベントを処理するスレッド数です。

#### `mysql_nio_backlog_num`

デフォルト：1024

MySQL NIO サーバーの backlog_num です。この値を増やす場合は、Linux の /proc/sys/net/core/somaxconn の値も同時に増やしてください。

#### `broker_timeout_ms`

デフォルト：10000   （10s）

Broker RPC のデフォルトタイムアウトです。

#### `backend_rpc_timeout_ms`

FE から BE への RPC 要求のタイムアウト（ミリ秒）です。

デフォルト: 60000

動的変更可能: false

Master FE 固有: true

#### `drop_backend_after_decommission`

デフォルト：false

動的変更可能：true

Master FE のみ：true

1. BE の廃止処理が成功した後に、その BE を削除するかどうかを制御します。true の場合、BE が正常にオフラインになるとノードが削除されます。false の場合、BE は DECOMMISSION 状態のまま残り、削除されません。

   この設定は特定のシナリオで役立ちます。たとえば Doris クラスターの各 BE ノードに最初はディスクが一台ずつあり、稼働後に各 BE にディスクを 2 台追加したとします。Doris は現在、BE 内のディスク間でのデータバランシングをサポートしていないため、元のディスクのデータ量が新しいディスクより常に多い場合があります。この場合、次の操作でディスク間のバランシングを手動で行えます。

   1. この設定項目を false にします。
   2. 対象の BE ノードを廃止します。BE 上のすべてのデータが他のノードへ移行されます。
   3. 廃止処理の完了後も BE は削除されません。この時点で BE の廃止状態を解除します。他の BE ノードからデータがこのノードへ再配置され、BE の全ディスクに均等に分散されます。
   4. すべての BE ノードに対して手順 2 と 3 を順番に実行し、全ノードのディスクを均衡化します。

#### `max_backend_down_time_second`

デフォルト: 3600  (1 時間)

動的変更可能：true

Master FE のみ：true

Backend が *max_backend_down_time_second* の間停止すると、BACKEND_DOWN イベントが発生します。

#### `disable_backend_black_list`

BE のブラックリスト機能を無効にします。無効化すると、BE へのクエリ要求に失敗しても、その BE はブラックリストに追加されません。
この設定は、偶発的な不具合によって多数の回帰テストが失敗することを減らすため、回帰テスト環境に適しています。

デフォルト: false

動的変更可能: true

Master FE 固有: false

#### `max_backend_heartbeat_failure_tolerance_count`

許容する BE ノードのハートビート失敗回数の上限です。連続失敗回数がこの値を超えると、BE の状態は dead になります。
この設定は、偶発的なハートビート失敗による多数の回帰テストの失敗を減らすため、回帰テスト環境に適しています。

デフォルト: 1

動的変更可能: true

Master FE 固有: true

### `abort_txn_after_lost_heartbeat_time_second`

ハートビートを失ってからトランザクションを中止するまでの時間です。デフォルト値は 300 で、ハートビート喪失から 300s 後に BE のトランザクションが中止されます。

デフォルト: 300(s)

動的変更可能: true

Master FE 固有: true

#### `enable_access_file_without_broker`

デフォルト：false

動的変更可能：true

Master FE のみ：true

Broker 経由で BOS や他のクラウドストレージにアクセスする際、Broker を省略するための設定です。

#### `agent_task_resend_wait_time_ms`

デフォルト：5000

動的変更可能：true

Master FE のみ：true

agent_task に create_time が設定されている場合の再送条件を決めます。current_time - create_time > agent_task_resend_wait_time_ms の場合にのみ、ReportHandler は agent task を再送できます。

現在、この設定は主に `PUBLISH_VERSION` agent task の重複送信を解決するために使われます。現在のデフォルト値 5000 は実験的な値です。

agent task を AgentTaskQueue に投入してから BE に送信するまでに一定の遅延があるため、この値を増やすと agent task の重複送信を効果的に抑制できます。

一方で、送信または実行に失敗した agent task の再実行までの待ち時間が長くなります。

#### `max_agent_task_threads_num`

デフォルト：4096

Master FE のみ：true

agent task スレッドプールで agent task を処理するスレッドの最大数です。

#### `remote_fragment_exec_timeout_ms`

デフォルト：30000  （ms）

動的変更可能：true

非同期リモート Fragment の実行タイムアウトです。通常は短時間で実行されますが、システム負荷が高い場合はタイムアウトを長くしてください。

#### `auth_token`

デフォルト：空

内部認証に使用するクラスタートークンです。

#### `enable_http_server_v2`

デフォルト: 正式なバージョン 0.14.0 のリリース後は true、それ以前は false です。

HTTP Server V2 は SpringBoot で実装され、フロントエンドとバックエンドを分離したアーキテクチャを使用します。新しいフロントエンド UI は HTTPv2 を有効にした場合にのみ使用できます。

#### `http_api_extra_base_path`

デプロイ環境によっては、HTTP API の共通プレフィックスとして追加のベースパスが必要です。この項目でそのプレフィックスを指定します。
設定後は `GET /api/basepath` インターフェースから値を取得できます。新しい UI も最初にこのベースパスを取得して URL を組み立てます。`enable_http_server_v2` が true の場合にのみ有効です。

デフォルトは空で、未設定を意味します。

#### `jetty_server_acceptors`

デフォルト：2

#### `jetty_server_selectors`

デフォルト：4

#### `jetty_server_workers`

デフォルト：0

上記三つの項目に対応する Jetty のスレッド構成は、acceptors、selectors、workers の三つのスレッドプールに分かれます。acceptors は新しい接続を受け付け、selectors に渡して HTTP メッセージの解析を行い、最後に workers が要求を処理します。最初の二つはノンブロッキングモデルで、一つのスレッドが多数のソケットの読み書きを処理できるため、必要なスレッド数は少なくなります。

多くのプロジェクトでは acceptors は 1～2 スレッド、selectors は 2～4 スレッドで十分です。workers はブロッキングする業務ロジックを処理し、データベース操作が多いこともあるため、多数のスレッドが必要です。具体的な数はアプリケーションの QPS と I/O イベントの割合に依存します。QPS が高いほど、また I/O の割合が高く待機スレッドが増えるほど、必要な総スレッド数も増えます。

Worker スレッドプールはデフォルトでは設定されません。必要に応じて設定してください。

#### `jetty_server_max_http_post_size`

デフォルト：`100 * 1024 * 1024`  （100MB）

PUT または POST メソッドでアップロードするファイルの最大バイト数です。デフォルト値は 100MB です。

#### `jetty_server_max_http_header_size`

デフォルト：1048576  （1M）

HTTP ヘッダーのサイズを設定します。デフォルト値は 1M です。

#### `http_sql_submitter_max_worker_threads`

デフォルト：2

HTTP SQL submitter のワーカースレッドの最大数です。

#### `http_load_submitter_max_worker_threads`

デフォルト：2

HTTP upload submitter のワーカースレッドの最大数です。

:::caution 動作変更（4.1.4）

バージョン 4.1.4 で `/api/upload` エンドポイントが削除され、この設定項目も併せて削除されました。詳しくは [アップロードアクション](../open-api/fe-http/upload-action) を参照してください。

:::

### クエリエンジン

#### `default_max_query_instances`

ユーザープロパティ max_query_instances が 0 以下の場合に使用するデフォルト値です。ユーザーあたりのインスタンスの最大数を制限します。この項目が 0 以下なら無制限です。

デフォルト値は -1

#### `max_query_retry_time`

デフォルト：3

動的変更可能：true

クエリの再試行回数です。RPC 例外が発生し、ユーザーに結果がまだ返されていない場合に再試行されることがあります。連鎖的な障害を避けるため、この値を減らすこともできます。

#### `max_dynamic_partition_num`

デフォルト：500

動的変更可能：true

Master FE のみ：true

動的パーティションテーブルの作成時に、一度に作成されるパーティションが多すぎないよう、最大数を制限します。この数は動的パーティションのパラメーター「start」と「end」で決まります。

#### `dynamic_partition_enable`

デフォルト：true

動的変更可能：true

Master FE のみ：true

動的パーティションスケジューラーを有効にするかどうかを指定します。デフォルトで有効です。

#### `dynamic_partition_check_interval_seconds`

デフォルト：600 （s）

動的変更可能：true

Master FE のみ：true

動的パーティションを確認する間隔を指定します。

#### `max_multi_partition_num`

デフォルト：4096

動的変更可能：true

Master FE のみ：true

マルチパーティションのパーティション名プレフィックスを設定します。動的パーティションには適用されません。デフォルトのプレフィックスは「p_」です。

#### `multi_partition_name_prefix`

デフォルト：p_

動的変更可能：true

Master FE のみ：true

マルチパーティションのパーティション名プレフィックスを設定します。動的パーティションには適用されません。デフォルトのプレフィックスは「p_」です。

#### `partition_in_memory_update_interval_secs`

デフォルト：300 (s)

動的変更可能：true

Master FE のみ：true

メモリ内のグローバルパーティション情報を更新する間隔です。

#### `enable_concurrent_update`

デフォルト：false

動的変更可能：false

Master FE のみ：true

並行更新を有効にするかどうかを指定します。

#### `lower_case_table_names`

デフォルト：0

動的変更可能：false

Master FE のみ：true

この設定はクラスターの初期化時にのみ指定でき、初期化完了後の
再起動やアップグレード時には変更できません。

0: テーブル名を指定どおりに保存し、比較では大文字と小文字を区別します。
1: テーブル名を小文字で保存し、比較では大文字と小文字を区別しません。
2: テーブル名を指定どおりに保存しますが、比較時には小文字に変換します。

#### `table_name_length_limit`

デフォルト：64

動的変更可能：true

Master FE のみ：true

テーブル名の最大長を制御します。

#### `cache_enable_sql_mode`

デフォルト：true

動的変更可能：true

Master FE のみ：false

このスイッチを有効にすると、SQL クエリの結果セットをキャッシュします。クエリに含まれるすべてのテーブルの全パーティションで、最終バージョン時刻からの間隔が cache_last_version_interval_second より長く、結果の行数が cache_result_max_row_count 未満で、データサイズが cache_result_max_data_size 未満の場合にキャッシュされ、次回の同じ SQL はキャッシュにヒットします。

true に設定すると、FE は SQL 結果キャッシュを有効にします。オフラインでデータを更新するシナリオに適しています。

|                        | case1 | case2 | case3 | case4 |
| ---------------------- | ----- | ----- | ----- | ----- |
| enable_sql_cache       | false | true  | true  | false |
| enable_partition_cache | false | false | true  | true  |

#### `cache_enable_partition_mode`

デフォルト：true

動的変更可能：true

Master FE のみ：false

true に設定すると、FE は BE のキャッシュからデータを取得します。一部のパーティションがリアルタイムに更新されるシナリオに適しています。

#### `cache_result_max_row_count`

デフォルト：3000

動的変更可能：true

Master FE のみ：false

メモリの過剰使用を防ぐため、キャッシュできる行数はデフォルトで最大 3000 行です。このしきい値を超える場合はキャッシュされません。

#### `cache_result_max_data_size`

デフォルト: 31457280

動的変更可能: true

Master FE のみ: false

メモリの過剰使用を防ぐため、キャッシュできる行のデータサイズはデフォルトで最大 10MB です。このしきい値を超える場合はキャッシュされません。

#### `cache_last_version_interval_second`

デフォルト：30

動的変更可能：true

Master FE のみ：false

テーブルの最新パーティションバージョンに関する間隔で、データ更新から現在のバージョンまでの時間を指します。通常は 900 秒に設定し、オフラインとリアルタイムのインポートを区別します。

#### `max_allowed_in_element_num_of_delete`

デフォルト：1024

動的変更可能：true

Master FE のみ：true

DELETE 文の InPredicate に含まれる要素数を制限します。

#### `max_running_rollup_job_num_per_table`

デフォルト：1

動的変更可能：true

Master FE のみ：true

Rollup ジョブの同時実行数の上限を制御します。

#### `max_distribution_pruner_recursion_depth`

デフォルト：100

動的変更可能：true

Master FE のみ：false

ハッシュ分散プルーナーの再帰の最大深度を制限します。
例: where a in (5 elements) and b in (4 elements) and c in (3 elements) and d in (2 elements)。
a/b/c/d が分散列である場合、再帰の深度は 5 *4* 3 * 2 = 120 となり、100 を超えます。
そのため分散プルーナーは機能せず、すべてのバケットを返します。
深度を増やすとより多くの要素に対して分散プルーニングを適用できますが、CPU 使用量が増える可能性があります。

#### `enable_local_replica_selection`

デフォルト：false

動的変更可能：true

true に設定すると、Planner は Frontend と同じホスト上の Tablet レプリカを優先して選択します。
次の条件ではネットワーク転送量を削減できる可能性があります。

* N 台のホストに N 台の Backend と N 台の Frontend が配置されている。

* データに N 個のレプリカがある。

* 高並行度のクエリがすべての Frontend に均等に送信される。

この場合、すべての Frontend がローカルレプリカだけでクエリを実行できます。ローカルレプリカが利用できないときに他のレプリカへのフォールバックを許可するには、enable_local_replica_selection_fallback を true にします。

#### `enable_local_replica_selection_fallback`

デフォルト：false

動的変更可能：true

enable_local_replica_selection と併用します。ローカルレプリカが利用できない場合、非ローカルレプリカにフォールバックします。

#### `expr_depth_limit`

デフォルト：3000

動的変更可能：true

式ツリーの深度の上限です。超過すると、データベースの読み取りロックを保持したまま解析に長時間かかる可能性があります。この設定は十分に理解したうえで変更してください。

#### `expr_children_limit`

デフォルト：10000

動的変更可能：true

式ツリーにおける子要素数の上限です。超過すると、データベースの読み取りロックを保持したまま解析に長時間かかる可能性があります。

#### `be_exec_version`

Fragment 間で Block を渡す際のシリアライズ形式を定義します。

コードの変更によって Block のデータ形式が変わる場合があります。ローリングアップグレード中に BE 間の互換性を保つため、FE からデータバージョンを通知し、送信するデータ形式を決定します。

たとえばクラスターに BE が 2 台あり、アップグレード済みの一台は最新の $v_1$ に対応し、もう一台は $v_0$ のみに対応するとします。この時点では FE が未アップグレードのため、全体に $v_0 が通知されます。$, BE 間では古いデータ形式を使用します。すべての BE のアップグレード後に FE をアップグレードすると、新しい FE が $v_1$ を通知し、クラスター全体が新しいデータ形式に切り替わります。

デフォルト値は `max_be_exec_version` です。必要に応じて形式のバージョンを手動で下げられますが、`min_be_exec_version` より小さくしてはいけません。

この変数は、すべての BE について `BeExecVersionManager::min_be_exec_version` と `BeExecVersionManager::max_be_exec_version` の間に保つ必要があります。アップグレード済みクラスターをダウングレードする場合は、FE、BE の順にダウングレードするか、設定でこの変数を手動で下げてから BE をダウングレードしてください。

#### `max_be_exec_version`

現在サポートされる最新のデータバージョンです。変更できず、対応するバージョンの BE の `BeExecVersionManager::max_be_exec_version` と一致する必要があります。

#### `min_be_exec_version`

現在サポートされる最も古いデータバージョンです。変更できず、対応するバージョンの BE の `BeExecVersionManager::min_be_exec_version` と一致する必要があります。

#### `max_query_profile_num`

クエリプロファイルの最大数です。

デフォルト: 100

動的変更可能: true

Master FE 固有: false

#### `publish_version_interval_ms`

デフォルト：10 （ms）

二つの publish version 操作の間の最短間隔です。

#### `publish_version_timeout_second`

デフォルト：30 （s）

動的変更可能：true

Master FE のみ：true

一つのトランザクションに属するすべての publish version タスクが完了するまでの最大待ち時間です。

#### `query_colocate_join_memory_limit_penalty_factor`

デフォルト：1

動的変更可能：true

Colocate Join の PlanFragment インスタンスの memory_limit = exec_mem_limit / min (query_colocate_join_memory_limit_penalty_factor, instance_num)。

#### `rewrite_count_distinct_to_bitmap_hll`

デフォルト: true

この変数はセッション変数であり、セッション単位で有効になります。

* 型: boolean
* 説明: **AGG モデルのテーブルのみ**が対象です。true の場合、ユーザークエリに count(distinct c1) などの集計関数が含まれ、c1 列の型が bitmap なら bitmap_union_count(c1) に、c1 列の型が hll なら hll_union_agg(c1) に書き換えられます。false の場合は書き換えられません。

### ロードとエクスポート

#### `enable_pipeline_load`

デフォルト値: true

動的変更可能: true

Stream Load などのインポートタスクで Pipeline エンジンを有効にするかどうかを指定します。

#### `enable_vectorized_load`

デフォルト: true

ベクトル化ロードを有効にするかどうかを指定します。

#### `enable_new_load_scan_node`

デフォルト: true

ファイルスキャンノードを有効にするかどうかを指定します。

#### `default_max_filter_ratio`

デフォルト：0

動的変更可能：true

Master FE のみ：true

不正な形式のデータなどを理由にフィルタリングできるデータの最大割合です。デフォルト値は 0 です。

#### `max_running_txn_num_per_db`

デフォルト：1000

動的変更可能：true

Master FE のみ：true

同じデータベースで同時に実行されるロードジョブの数を制御します。

クラスター内で実行中のロードジョブが多すぎる場合、新たに送信したロードジョブで次のエラーが発生することがあります。

```text
current running txns on db xxx is xx, larger than limit xx
```

このエラーは、クラスター内で実行中のロードジョブ数が設定値を超えていることを示します。アプリケーション側で待機してから、ロードジョブを再試行することを推奨します。

Connector を使用する場合は、この値を適切に調整できます。数千に設定しても問題ありません。

#### `using_old_load_usage_pattern`

デフォルト：false

動的変更可能：true

Master FE のみ：true

true の場合、処理エラーが発生した INSERT 文でもユーザーにラベルを返し、そのラベルで Load ジョブの状態を確認できます。デフォルト値の false では、INSERT 操作でエラーが発生するとラベルは返されず、クライアントに直接例外が通知されます。

#### `disable_load_job`

デフォルト：false

動的変更可能：true

Master FE のみ：true

これを true に設定した場合:

* 保留中のロードジョブは、begin txn API の呼び出し時に失敗します。
* 準備中のロードジョブは、commit txn API の呼び出し時に失敗します。
* コミット済みのロードジョブは、公開待ちになります。

#### `commit_timeout_second`

デフォルト：30

動的変更可能：true

Master FE のみ：true

一つのトランザクションで挿入されたすべてのデータがコミットされるまでの最大待ち時間です。
コマンド「commit」のタイムアウト秒数です。

#### `max_unfinished_load_job`

デフォルト：1000

動的変更可能：true

Master FE のみ：true

PENDING、ETL、LOADING、QUORUM_FINISHED を含むロードジョブの最大数です。この数を超えると、新しいロードジョブを送信できません。

#### `db_used_data_quota_update_interval_secs`

デフォルト：300 (s)

動的変更可能：true

Master FE のみ：true

Master のデーモンスレッドが `db_used_data_quota_update_interval_secs` ごとに、データベーストランザクションマネージャーの使用済みデータクォータを更新します。

データロードの性能を高めるため、ロード前のデータベース使用量がクォータを超えるかどうかの確認では、使用量をリアルタイムで計算せず、デーモンスレッドが定期的に更新した値を使用します。

データベースの使用済みデータ量を更新する間隔を設定します。

#### `disable_show_stream_load`

デフォルト：false

動的変更可能：true

Master FE のみ：true

SHOW STREAM LOAD を無効にし、メモリ内の Stream Load 記録を消去するかどうかを指定します。

#### `max_stream_load_record_size`

デフォルト：5000

動的変更可能：true

Master FE のみ：true

メモリに保存できる最近の Stream Load 記録のデフォルト最大数です。

#### `fetch_stream_load_record_interval_second`

デフォルト：120

動的変更可能：true

Master FE のみ：true

Stream Load 記録の取得間隔です。

#### `max_bytes_per_broker_scanner`

デフォルト：`500 * 1024 * 1024 * 1024L`  （500G）

動的変更可能：true

Master FE のみ：true

一つの Broker Load ジョブで Broker Scanner が処理できる最大バイト数です。通常、各 Backend に一つの Broker Scanner があります。

#### `default_load_parallelism`

デフォルト: 8

動的変更可能：true

Master FE のみ：true

単一ノード上での Broker Load 実行プランのデフォルト並列度です。
Broker Load の送信時にユーザーが並列度を指定した場合、この項目は無視されます。
この項目は、`max broker concurrency` や `min bytes per broker scanner` などの設定とともに、インポートタスクの並行度を決定します。

#### `max_broker_concurrency`

デフォルト：10

動的変更可能：true

Master FE のみ：true

Broker Scanner の最大並行数です。

#### `min_bytes_per_broker_scanner`

デフォルト：67108864L (64M)

動的変更可能：true

Master FE のみ：true

一つの Broker Scanner が読み取る最小バイト数です。

#### `period_of_auto_resume_min`

デフォルト：5 （s）

動的変更可能：true

Master FE のみ：true

Routine Load を自動的に再開する間隔です。

#### `max_tolerable_backend_down_num`

デフォルト：0

動的変更可能：true

Master FE のみ：true

BE が一台でも停止している場合、Routine Load は自動再開されません。

#### `max_routine_load_task_num_per_be`

デフォルト：5

動的変更可能：true

Master FE のみ：true

BE あたりの Routine Load タスクの最大同時実行数です。BE に送信するタスク数を制限します。この値は、BE 側の Routine Load タスクスレッドプールのサイズを表す 'routine_load_thread_pool_size'（デフォルト 10）より小さくする必要があります。

#### `max_routine_load_task_concurrent_num`

デフォルト：5

動的変更可能：true

Master FE のみ：true

単一の Routine Load ジョブの最大同時タスク数です。

#### `max_routine_load_job_num`

デフォルト：100

NEED_SCHEDULED、RUNNING、PAUSE を含む Routine Load ジョブの最大数です。

#### `desired_max_waiting_jobs`

デフォルト：100

動的変更可能：true

Master FE のみ：true

Routine Load とバージョン 2 のロードで待機するジョブのデフォルト数です。これは目標値であり、Master の切り替え時などには実際の数が desired_max_waiting_jobs を超える場合があります。

#### `disable_hadoop_load`

デフォルト：false

動的変更可能：true

Master FE のみ：true

Hadoop クラスターを使うロードは将来非推奨になります。true に設定すると、このロード方式を無効にします。

#### `enable_spark_load`

デフォルト：false

動的変更可能：true

Master FE のみ：true

Spark Load を一時的に有効にするかどうかを指定します。デフォルトでは無効です。

**注:** この項目はバージョン 1.2 で削除され、spark_load はデフォルトで有効になりました。

#### `spark_load_checker_interval_second`

デフォルト：60

Spark Load スケジューラーの実行間隔です。デフォルトは 60 秒です。

#### `async_loading_load_task_pool_size`

デフォルト：10

動的変更可能：false

Master FE のみ：true

loading_load タスク実行プールのサイズです。同時に実行できる loading_load タスクの最大数を制限します。

現在は Broker Load の loading_load タスクのみを制限します。

#### `async_pending_load_task_pool_size`

デフォルト：10

動的変更可能：false

Master FE のみ：true

pending_load タスク実行プールのサイズです。同時に実行できる pending_load タスクの最大数を制限します。

現在は Broker Load と Spark Load の pending_load タスクのみを制限します。

'max_running_txn_num_per_db' より小さくする必要があります。

#### `async_load_task_pool_size`

デフォルト：10

動的変更可能：false

Master FE のみ：true

この項目は旧バージョンとの互換性のためだけに残されています。async_loading_load_task_pool_size に置き換えられており、将来削除されます。

#### `enable_single_replica_load`

デフォルト：false

動的変更可能：true

Master FE のみ：true

Stream Load と Broker Load で単一レプリカへの書き込みを有効にするかどうかを指定します。

#### `min_load_timeout_second`

デフォルト：1 （1s）

動的変更可能：true

Master FE のみ：true

すべてのロード方式に適用される Stream Load の最小タイムアウトです。

#### `max_stream_load_timeout_second`

デフォルト: 259200 (3 日)

動的変更可能：true

Master FE のみ：true

Stream Load のタイムアウト設定を制限します。ユーザーが大きなタイムアウト値を設定したために、失敗した Stream Load トランザクションを短時間でキャンセルできなくなることを防ぎます。

#### `max_load_timeout_second`

デフォルト: 259200 (3 日)

動的変更可能：true

Master FE のみ：true

Stream Load 以外のすべてのロード方式に適用される最大タイムアウトです。

#### `stream_load_default_timeout_second`

デフォルト: 86400 * 3 (3 日)

動的変更可能：true

Master FE のみ：true

Stream Load とストリーミング Mini Load のデフォルトタイムアウトです。

#### `stream_load_default_precommit_timeout_second`

デフォルト：3600（s）

動的変更可能：true

Master FE のみ：true

Stream Load の事前送信のデフォルトタイムアウトです。

#### `stream_load_default_memtable_on_sink_node`

デフォルト：false

動的変更可能：true

Master FE のみ：true

Stream Load で Sink ノード上の Memtable をデフォルトで有効にします。
HTTP ヘッダー `memtable_on_sink_node` が設定されていない場合に適用されます。

#### `insert_load_default_timeout_second`

デフォルト: 3600 (1 時間)

動的変更可能：true

Master FE のみ：true

Insert Load のデフォルトタイムアウトです。

#### `mini_load_default_timeout_second`

デフォルト: 3600 (1 時間)

動的変更可能：true

Master FE のみ：true

非ストリーミング Mini Load のデフォルトタイムアウトです。

#### `broker_load_default_timeout_second`

デフォルト: 14400 (4 時間)

動的変更可能：true

Master FE のみ：true

Broker Load のデフォルトタイムアウトです。

#### `spark_load_default_timeout_second`

デフォルト: 86400  (1 日)

動的変更可能：true

Master FE のみ：true

Spark Load のデフォルトタイムアウトです。

#### `hadoop_load_default_timeout_second`

デフォルト: 86400 * 3   (3 日)

動的変更可能：true

Master FE のみ：true

Hadoop Load のデフォルトタイムアウトです。

#### `load_running_job_num_limit`

デフォルト：0

動的変更可能：true

Master FE のみ：true

ロードタスクの数を制限します。デフォルトは 0 で、無制限です。

#### `load_input_size_limit_gb`

デフォルト：0

動的変更可能：true

Master FE のみ：true

Load ジョブが入力するデータのサイズを制限します。デフォルトは 0 で、無制限です。

#### `load_etl_thread_num_normal_priority`

デフォルト：10

優先度 NORMAL の ETL Load ジョブの同時実行数です。十分に理解したうえで変更してください。

#### `load_etl_thread_num_high_priority`

デフォルト：3

優先度 HIGH の ETL Load ジョブの同時実行数です。十分に理解したうえで変更してください。

#### `load_pending_thread_num_normal_priority`

デフォルト：10

優先度 NORMAL の保留中の Load ジョブの同時実行数です。十分に理解したうえで変更してください。

#### `load_pending_thread_num_high_priority`

デフォルト：3

優先度 HIGH の保留中の Load ジョブの同時実行数です。Load ジョブの優先度は HIGH または NORMAL です。すべての Mini Batch Load ジョブは HIGH、それ以外は NORMAL です。遅い Load ジョブがスレッドを長時間占有するのを避けるための内部スケジューリングポリシーです。現在、優先度を手動で指定することはできません。十分に理解したうえで変更してください。

#### `load_checker_interval_second`

デフォルト：5 （s）

Load スケジューラーの実行間隔です。Load ジョブの状態は PENDING、LOADING、FINISHED の順に変化します。スケジューラーが PENDING から LOADING に、トランザクションのコールバックが LOADING から FINISHED に遷移させます。同時実行数が上限に達していなければ、ジョブの完了には最大で一間隔分の時間がかかります。

#### `s3_load_endpoint_white_list`

デフォルト: 空

動的変更可能: false

S3 Load で使用できるエンドポイントの許可リストです。複数の値はカンマで区切ります（例: `s3_load_endpoint_white_list=a,b,c`）。空の値は許可リストが設定されていないことを意味します。

:::caution 動作変更（4.1.4）

セキュリティ上の理由から、バージョン 4.1.4 以降、この設定項目は **動的に変更できません**。`fe.conf` でのみ設定でき、FE の再起動後に有効になります。`ADMIN SET FRONTEND CONFIG` では変更できません。

:::

#### `resource_group_load_success_quorum`

デフォルト: 空

動的変更可能: true

Master FE 固有: true

バージョン 4.1.4 で追加されました。ロードトランザクションのコミット時に、リソースグループ（BE の Location Tag）ごとに、そのグループ内で **書き込みが成功する必要のあるレプリカの最小数** を設定します。

値はカンマ区切りのリストで、各項目は `<resource_group>:<min_success_replicas>` 形式です。`<min_success_replicas>` は負ではない整数です。例:

```properties
resource_group_load_success_quorum=group_a:2,group_b:1
```

トランザクションのコミット時に、設定されたリソースグループ内で書き込みが成功したレプリカ数が指定値を下回ると、コミットは失敗します。設定にないリソースグループは確認されません。形式が不正な項目は無視され、`fe.log` に警告が出力されます。

複数のデータセンターやアベイラビリティゾーンに配置している場合に使用し、指定したデータセンターで所定数のレプリカへの書き込みが完了してからロードを成功と見なすようにします。

#### `enable_adaptive_random_bucket_load`

デフォルト: true

動的変更可能: true

Master FE 固有: true

バージョン 4.1.4 で追加されました。適応的なランダムバケットロードを有効にするかどうかを指定します。

有効にすると、FE は Tablet の位置情報を BE に送信し、各 BE は自分が Primary レプリカを保持するローカルバケットを特定します。単一 Tablet への書き込み量がしきい値（デフォルト 200 MB）を超えると、書き込み先をローカルバケット間で切り替えます。これによりロード時のメモリ負荷が減り、ランダムバケット方式（`DISTRIBUTED BY RANDOM`）のテーブルのロードスループットが向上します。すべてのロード方式に適用されます。

この機能は BE の設定 `enable_table_memtable_flush_backpressure` と `table_memtable_flush_pending_count_limit` による制約も受けます。詳しくは [BE 設定](./be-config) を参照してください。

#### `enable_forward_group_commit_stream_load_to_follower`

デフォルト: false

動的変更可能: true

Master FE 固有: true

バージョン 4.1.4 で追加されました。Group Commit を使用する Stream Load 要求を Follower FE に転送するかどうかを指定します。

有効にすると、Group Commit モードの Stream Load 要求はラウンドロビンで Follower FE に転送され、バッチ処理の負荷が複数の FE に分散されます。

対象テーブルの `light_schema_change` プロパティが `false` の場合、転送はサポートされず、要求はエラーになります。

#### `streaming_job_snapshot_offset_persist_interval_sec`

デフォルト: 300 (s)

動的変更可能: true

Master FE 固有: true

バージョン 4.1.4 で追加されました。Streaming Job（継続的なロードジョブ）のフルスナップショット段階で、オフセットを永続化する間の最小間隔（秒）です。値を小さくするとジョブ再起動後に再処理するデータ量が減りますが、メタデータの書き込み頻度が増えます。

#### `label_keep_max_second`

デフォルト：`3 * 24 * 3600`  (3 日)

動的変更可能：true

Master FE のみ：true

完了またはキャンセルされた Load ジョブのラベルは、`label_keep_max_second` が経過すると削除されます。

1. 削除されたラベルは再利用できます。
2. 短い時間に設定すると FE のメモリ使用量が減ります（削除されるまで、すべての Load ジョブの情報がメモリに保持されるためです）。

高い並行度で書き込みを行い、ジョブが大量に滞留して Frontend サービスの呼び出しに失敗する場合は、ログを確認してください。メタデータ書き込みのロックに時間がかかりすぎるなら、この値を 12 時間または 6 時間以下に調整できます。

#### `streaming_label_keep_max_second`

デフォルト: 43200 (12 時間)

動的変更可能：true

Master FE のみ：true

INSERT、STREAMING LOAD、ROUTINE_LOAD_TASK などの高頻度ロードでは、期限が切れると完了済みのジョブまたはタスクを削除します。

#### `label_clean_interval_second`

デフォルト：1 * 3600  (1 時間)

Load ラベルクリーナーは *label_clean_interval_second* ごとに実行され、期限切れのジョブを消去します。

#### `label_regex_length`

デフォルト値: 128 (characters)

Load ラベルの最大文字数です。デフォルトは 128 文字です。

#### `transaction_clean_interval_second`

デフォルト：30

トランザクションが visible または aborted の場合、transaction_clean_interval_second 秒後に消去されます。この間隔をできるだけ短くし、各消去サイクルを速やかに完了させる必要があります。

#### `sync_commit_interval_second`

トランザクションをコミットする最大間隔です。この時間が経過してもチャネルに未送信のデータが残っている場合、Consumer がチャネルにトランザクションの送信を通知します。

デフォルト: 10 (seconds)

動的変更可能: true

Master FE 固有: true

#### `sync_checker_interval_second`

データ同期ジョブの実行状態を確認します。

デフォルト: 10 (s)

#### `max_sync_task_threads_num`

データ同期ジョブのスレッドプールの最大スレッド数です。

デフォルト値：10

#### `min_sync_commit_size`

トランザクションのコミットに必要な最小イベント数です。FE が受け取ったイベント数がこの値より少ない場合、`sync_commit_interval_second` を超えるまで次のデータバッチを待ちます。デフォルト値は 10000 イベントです。変更する場合は、Canal 側の `canal.instance.memory.buffer.size`（デフォルト 16384）より小さい値にしてください。そうしないと、FE が ack 前にストアのキュー長を超えるイベントを取得しようとし、タイムアウトするまでキューがブロックされます。

デフォルト: 10000

動的変更可能: true

Master FE 固有: true

#### `min_bytes_sync_commit`

トランザクションのコミットに必要な最小データサイズです。FE が受け取ったデータがこの値より小さい場合、`sync_commit_interval_second` を超えるまで次のデータバッチを待ちます。デフォルト値は 15MB です。変更する場合は、Canal 側の `canal.instance.memory.buffer.size` と `canal.instance.memory.buffer.memunit` の積（デフォルト 16MB）より小さい値にしてください。そうしないと、FE が ack 前にストア領域を超えるデータを取得しようとし、タイムアウトするまでキューがブロックされます。

デフォルト: `15*1024*1024` (15M)

動的変更可能: true

Master FE 固有: true

#### `max_bytes_sync_commit`

データ同期ジョブのスレッドプールの最大スレッド数です。FE 全体にスレッドプールは一つだけあり、BE にデータを送信するすべてのデータ同期タスクを処理します。実装は `SyncTaskPool` クラスにあります。

デフォルト: 10

動的変更可能: false

Master FE 固有: false

#### `enable_outfile_to_local`

デフォルト：false

OUTFILE 機能で結果をローカルディスクへエクスポートすることを許可するかどうかを指定します。

#### `export_tablet_num_per_task`

デフォルト：5

動的変更可能：true

Master FE のみ：true

エクスポートクエリプランあたりの Tablet 数です。

#### `export_task_default_timeout_second`

デフォルト: 2 * 3600   (2 時間)

動的変更可能：true

Master FE のみ：true

エクスポートジョブのデフォルトタイムアウトです。

#### `export_running_job_num_limit`

デフォルト：5

動的変更可能：true

Master FE のみ：true

実行中のエクスポートジョブの同時実行数の上限です。デフォルトは 5、0 は無制限です。

#### `export_checker_interval_second`

デフォルト：5

Export Checker の実行間隔です。

#### `enable_stream_load_profile`

デフォルト: false

Master FE のみ: false

Stream Load プロファイルを有効にするかどうかを指定します。

### ログ

#### `log_roll_size_mb`

デフォルト：1024  （1G）

システムログと監査ログの各ファイルの最大サイズです。

#### `sys_log_dir`

デフォルト: DorisFE.DORIS_HOME_DIR + "/log"

FE のログディレクトリを指定します。FE は次の 2 つのログファイルを生成します。

fe.log: FE プロセスのすべてのログ。
fe.warn.log: FE プロセスのすべての WARNING と ERROR ログ。

#### `sys_log_level`

デフォルト：INFO

ログレベル: INFO、WARN、ERROR、FATAL。

#### `sys_log_roll_num`

デフォルト：10

sys_log_roll_interval 内に保持する FE ログファイルの最大数です。デフォルトは 10 で、一日に最大 10 ファイルが保持されます。

#### `sys_log_verbose_modules`

デフォルト：{}

詳細ログを出力するモジュールです。VERBOSE レベルは log4j の DEBUG レベルで実装されています。

例：
   sys_log_verbose_modules = org.apache.doris.catalog
   これにより、org.apache.doris.catalog パッケージとそのすべてのサブパッケージにあるファイルのデバッグログだけが出力されます。

#### `sys_log_roll_interval`

デフォルト：DAY

sys_log_roll_interval:

* DAY: ログのサフィックスは yyyyMMdd です。
* HOUR: ログのサフィックスは yyyyMMddHH です。

#### `sys_log_delete_age`

デフォルト：7d

デフォルトは 7 日です。ログの最終更新から 7 日が経過すると削除されます。

対応する形式:

* 7d      7 日
* 10h     10 時間
* 60m     60 分
* 120s    120 秒

#### `sys_log_roll_mode`

デフォルト：SIZE-MB-1024

ログを分割するサイズです。1 G ごとにログファイルを分割します。

#### `sys_log_enable_compress`

デフォルト: false

true の場合、fe.log と fe.warn.log を gzip で圧縮します。

#### `audit_log_dir`

デフォルト：DORIS_HOME_DIR + "/log"

audit_log_dir：
FE の監査ログディレクトリを指定します。
監査ログ fe.audit.log には、ユーザー、ホスト、所要時間、状態などの関連情報とともに、すべての要求が記録されます。

#### `audit_log_roll_num`

デフォルト：90

audit_log_roll_interval 内に保持する FE 監査ログファイルの最大数です。

#### `audit_log_modules`

デフォルト：{"slow_query", "query", "load", "stream_load"}

Slow Query には、所要時間が *qe_slow_log_ms* を超えるすべてのクエリが含まれます。

#### `qe_slow_log_ms`

デフォルト: 5000 (5 seconds)

クエリの応答時間がこのしきい値を超えると、監査ログに slow_query として記録されます。

#### `audit_log_roll_interval`

デフォルト：DAY

DAY: ログのサフィックスは yyyyMMdd です。
HOUR: ログのサフィックスは yyyyMMddHH です。

#### `audit_log_delete_age`

デフォルト：30d

デフォルトは 30 日です。ログの最終更新から 30 日が経過すると削除されます。

対応する形式:
* 7d      7 日
* 10h     10 時間
* 60m     60 分
* 120s    120 秒

#### `audit_log_enable_compress`

デフォルト: false

true の場合、fe.audit.log を gzip で圧縮します。

#### `nereids_trace_log_dir`

デフォルト: DorisFE.DORIS_HOME_DIR + "/log/nereids_trace"

Nereids トレースログのディレクトリを指定します。

### ストレージ

#### `min_replication_num_per_tablet`

デフォルト: 1

Tablet あたりのレプリカの最小数を設定します。

#### `max_replication_num_per_tablet`

デフォルト: 32767

Tablet あたりのレプリカの最大数を設定します。

#### `default_db_data_quota_bytes`

デフォルト：8192PB

動的変更可能：true

Master FE のみ：true

データベースのデータクォータのデフォルトサイズを設定します。個別のデータベースにクォータを設定するには、次を使用します。

```
Set the database data quota, the unit is:B/K/KB/M/MB/G/GB/T/TB/P/PB
ALTER DATABASE db_name SET DATA QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```

#### `default_db_replica_quota_size`

デフォルト: 1073741824

動的変更可能：true

Master FE のみ：true

データベースのレプリカクォータのデフォルト値を設定します。個別のデータベースにクォータを設定するには、次を使用します。

```
Set the database replica quota
ALTER DATABASE db_name SET REPLICA QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```

#### `recover_with_empty_tablet`

デフォルト：false

動的変更可能：true

Master FE のみ：true

コードの不具合や操作ミスなど、特殊な状況では Tablet のすべてのレプリカが失われることがあります。その場合、データは実質的に失われています。それでも、データ損失があってもクエリのエラーを避け、ユーザーへの影響を抑えたい場合があります。このとき、欠落したレプリカを空の Tablet で補うことで、クエリを正常に実行できるようにします。

true に設定すると、すべてのレプリカが破損または欠落した Tablet を、Doris が空のレプリカで自動的に補います。

#### `min_clone_task_timeout_sec` `And max_clone_task_timeout_sec`

デフォルト: 最小 3 分、最大二時間

動的変更可能：true

Master FE のみ：true

`mix_clone_task_timeout_sec` と併用して、Clone タスクの最大・最小タイムアウトを制御できます。通常、タイムアウトはデータ量と最小転送速度（5MB/s）から推定されます。特殊な場合は、これら二つの設定で上限と下限を指定し、Clone タスクを確実に完了できるようにします。

#### `disable_storage_medium_check`

デフォルト：false

動的変更可能：true

Master FE のみ：true

disable_storage_medium_check が true の場合、ReportHandler は Tablet のストレージメディアを確認せず、ストレージのクールダウン機能を無効にします。デフォルトは false です。Tablet のストレージメディアを考慮しない場合は true にできます。

#### `decommission_tablet_check_threshold`

デフォルト：5000

動的変更可能：true

Master FE のみ：true

廃止対象の BE 上にある Tablet の状態を Master FE が確認するかどうかを制御します。対象 BE の Tablet 数がしきい値より少ない場合、FE は定期的な確認を開始し、すべての Tablet が回収されると BE を直ちに削除します。

性能上の理由から、この値を非常に大きく設定しないでください。

#### `partition_rebalance_max_moves_num_per_selection`

デフォルト：10

動的変更可能：true

Master FE のみ：true

PartitionRebalancer を使用する場合にのみ有効です。

#### `partition_rebalance_move_expire_after_access`

デフォルト：600   (s)

動的変更可能：true

Master FE のみ：true

PartitionRebalancer を使用する場合にのみ有効です。変更すると、キャッシュされた移動情報が消去されます。

#### `tablet_rebalancer_type`

デフォルト：BeLoad

Master FE のみ：true

Rebalancer の種類です（大文字と小文字は区別しません）。指定できる値は BeLoad と Partition です。解析に失敗した場合はデフォルトの BeLoad を使用します。

#### `max_balancing_tablets`

デフォルト：100

動的変更可能：true

Master FE のみ：true

TabletScheduler でバランシング中の Tablet 数が max_balancing_tablets を超えると、追加のバランス確認を行いません。

#### `max_scheduling_tablets`

デフォルト：2000

動的変更可能：true

Master FE のみ：true

TabletScheduler でスケジュール済みの Tablet 数が max_scheduling_tablets を超えると、確認をスキップします。

#### `disable_balance`

デフォルト：false

動的変更可能：true

Master FE のみ：true

true に設定すると、TabletScheduler はバランシングを行いません。

#### `disable_disk_balance`

デフォルト：true

動的変更可能：true

Master FE のみ：true

true に設定すると、TabletScheduler はディスクのバランシングを行いません。

#### `balance_load_score_threshold`

デフォルト: 0.1 (10%)

動的変更可能：true

Master FE のみ：true

クラスターのバランススコアのしきい値です。Backend の負荷スコアが平均より 10% 低い場合は LOW load、10% 高い場合は HIGH load と判定されます。

#### `capacity_used_percent_high_water`

デフォルト: 0.75  (75%)

動的変更可能：true

Master FE のみ：true

ディスク容量の使用率の高水位です。Backend の負荷スコアの計算に使用します。

#### `clone_distribution_balance_threshold`

デフォルト: 0.2

動的変更可能：true

Master FE のみ：true

Backend 間のレプリカ数のバランスしきい値です。

#### `clone_capacity_balance_threshold`

デフォルト: 0.2

動的変更可能：true

Master FE のみ：true

* BE 間のデータサイズのバランスしきい値です。

   バランシングアルゴリズムは次のとおりです。

     1. クラスター全体の平均使用容量（AUC）を計算します（総データサイズ / Backend の総数）。

     2. 高水位を (AUC * (1 + clone_capacity_balance_threshold)) とします。

     3. 低水位を (AUC * (1 - clone_capacity_balance_threshold)) とします。

     4. Clone Checker が高水位の BE から低水位の BE へレプリカを移動しようとします。

#### `disable_colocate_balance`

デフォルト：false

動的変更可能：true

Master FE のみ：true

true に設定すると、Colocate テーブルの自動再配置とバランシングを無効にできます。'disable_colocate_balance' が true の場合、ColocateTableBalancer は Colocate テーブルの再配置とバランシングを行いません。

**注意**:

1. 通常、バランシングを無効にする必要はありません。
2. 無効にすると、不安定な Colocate テーブルが復旧しない可能性があります。
3. その結果、クエリで Colocate プランを使用できなくなる可能性があります。

#### `balance_slot_num_per_path`

デフォルト: 1

動的変更可能：true

Master FE のみ：true

バランシング時のパスあたりのデフォルトスロット数です。

#### `disable_tablet_scheduler`

デフォルト:false

動的変更可能：true

Master FE のみ：true

true に設定すると Tablet Scheduler が動作せず、Tablet の修復とバランシングのタスクもすべて停止します。

#### `enable_force_drop_redundant_replica`

デフォルト: false

動的変更可能: true

Master FE のみ: true

true に設定すると、Tablet のスケジューリング時に余分なレプリカを直ちに削除します。該当レプリカに書き込み中の Load ジョブが失敗する可能性がありますが、Tablet のバランシングと修復は速くなります。
クラスター内にバランシングまたは修復待ちのレプリカが大量にある場合、一部のロード成功率を犠牲にして、レプリカのバランシングと修復を速めるために設定できます。

#### `colocate_group_relocate_delay_second`

デフォルト: 1800

動的変更可能: true

Master FE のみ: true

Colocation グループの再配置では、クラスター内で大量の Tablet が移動する場合があります。そのため、できるだけ再配置を避ける保守的な方針を採用します。
再配置は通常、BE ノードがオフラインまたは停止した後に行われます。この項目は BE ノードが利用不能と判定されるまでの時間を遅らせます。デフォルトは 30 分で、BE ノードが 30 分以内に復旧すれば Colocation グループの再配置は開始されません。

#### `allow_replica_on_same_host`

デフォルト: false

動的変更可能: false

Master FE のみ: false

同じ Tablet の複数のレプリカを同一ホスト上に配置することを許可するかどうかを指定します。主にローカルテストで、複数の BE を構築してマルチレプリカの動作を検証するために使用します。テスト以外の環境では使用しないでください。

#### `repair_slow_replica`

デフォルト: false

動的変更可能：true

Master FE のみ: true

true の場合、Compaction が遅いレプリカを自動検出して他のマシンへ移行します。最も速いレプリカのバージョン数が `min_version_count_indicate_replica_compaction_too_slow` を超え、かつそのレプリカとのバージョン数の差の比率が `valid_version_count_delta_ratio_between_replicas` を超えた場合に検出します。

#### `min_version_count_indicate_replica_compaction_too_slow`

デフォルト: 200

動的変更可能: true

Master FE のみ: false

レプリカの Compaction が遅すぎるかどうかを判定するバージョン数のしきい値です。

#### `skip_compaction_slower_replica`

デフォルト: true

動的変更可能: true

Master FE のみ: false

true の場合、クエリ可能なレプリカを選択する際に、Compaction が遅いレプリカを除外します。

#### `valid_version_count_delta_ratio_between_replicas`

デフォルト: 0.5

動的変更可能: true

Master FE のみ: true

最も遅いレプリカと最も速いレプリカのバージョン数の差の比率に対するしきい値です。`repair_slow_replica` が true の場合、最も遅いレプリカを修復するかどうかの判定に使用します。

#### `min_bytes_indicate_replica_too_large`

デフォルト: `2 * 1024 * 1024 * 1024` (2G)

動的変更可能: true

Master FE のみ: true

レプリカが大きすぎるかどうかを判定するデータサイズのしきい値です。

#### `schedule_slot_num_per_hdd_path`

デフォルト：4

HDD 用の Tablet Scheduler でパスあたりに使用するデフォルトスロット数です。この設定を削除し、Clone タスクの統計に基づいて動的に調整します。

#### `schedule_slot_num_per_ssd_path`

デフォルト：8

SSD 用の Tablet Scheduler でパスあたりに使用するデフォルトスロット数です。この設定を削除し、Clone タスクの統計に基づいて動的に調整します。

#### `tablet_repair_delay_factor_second`

デフォルト：60 （s）

動的変更可能：true

Master FE のみ：true

Tablet の修復を決定するまでの遅延時間の係数です。

* 優先度 VERY_HIGH の場合、直ちに修復します。
* HIGH の場合、tablet_repair_delay_factor_second * 1 だけ遅延します。
* NORMAL の場合、tablet_repair_delay_factor_second * 2 だけ遅延します。
* LOW の場合、tablet_repair_delay_factor_second * 3 だけ遅延します。

#### `tablet_stat_update_interval_second`

デフォルト：300（5min）

Tablet 統計の更新間隔です。
各間隔で、すべての Frontend がすべての Backend から Tablet 統計を取得します。

#### `storage_flood_stage_usage_percent`

デフォルト：95 （95%）

動的変更可能：true

Master FE のみ：true

##### `storage_flood_stage_left_capacity_bytes`

デフォルト：`1 * 1024 * 1024 * 1024` (1GB)

動的変更可能：true

Master FE のみ：true

ディスク容量が 'storage_flood_stage_usage_percent' と 'storage_flood_stage_left_capacity_bytes' の条件に達すると、次の操作は拒否されます。

1. Load ジョブ
2. Restore ジョブ

#### `storage_high_watermark_usage_percent`

デフォルト：85  (85%)

動的変更可能：true

Master FE のみ：true

#### `storage_min_left_capacity_bytes`

デフォルト： `2 * 1024 * 1024 * 1024`  (2GB)

動的変更可能：true

Master FE のみ：true

'storage_high_watermark_usage_percent' は Backend のストレージパスの最大容量使用率を制限し、'storage_min_left_capacity_bytes' は空き容量の下限を制限します。両方の制限に達すると、そのパスは Tablet のバランシング先として選択されません。ただし Tablet の復旧では、データの整合性をできるだけ保つため、制限を超える場合があります。

#### `catalog_trash_expire_second`

デフォルト: 86400L (1 日)

動的変更可能：true

Master FE のみ：true

データベース（テーブルまたはパーティション）を削除した後、RECOVER 文で復元できます。この項目はデータの最大保持期間を指定します。期間が過ぎると、データは完全に削除されます。

#### `default_storage_medium`

デフォルト：HDD

テーブル（またはパーティション）の作成時にストレージメディア（HDD または SSD）を指定できます。指定しない場合は、この項目のデフォルトメディアが使用されます。

#### `default_compression_type`

デフォルト: LZ4F（4.0.3 より前）、ZSTD（4.0.3 以降）

テーブルの作成時に圧縮アルゴリズムを指定できます。指定しない場合は、この項目のデフォルト圧縮形式が使用されます。有効な値は LZ4、LZ4F、LZ4HC、ZLIB、ZSTD、SNAPPY、NONE です（大文字と小文字は区別しません）。

#### `enable_storage_policy`

* Storage Policy 機能を有効にするかどうかを指定します。この設定でホットデータとコールドデータを分離できます。
デフォルト: false

動的変更可能: true

Master FE 固有: true

#### `check_consistency_default_timeout_second`

デフォルト: 600 (10 分)

動的変更可能：true

Master FE のみ：true

単一の整合性チェックタスクのデフォルトタイムアウトです。Tablet のサイズに合わせて十分に長く設定してください。

#### `consistency_check_start_time`

デフォルト：23

動的変更可能：true

Master FE のみ：true

整合性チェックの開始時刻です。

Consistency Checker は *consistency_check_start_time* から *consistency_check_end_time* まで実行されます。

二つの時刻が同じ場合、整合性チェックは開始されません。

#### `consistency_check_end_time`

デフォルト：23

動的変更可能：true

Master FE のみ：true

整合性チェックの終了時刻です。

Consistency Checker は *consistency_check_start_time* から *consistency_check_end_time* まで実行されます。

二つの時刻が同じ場合、整合性チェックは開始されません。

#### `replica_delay_recovery_second`

デフォルト：0

動的変更可能：true

Master FE のみ：true

レプリカが失敗してから、FE が Clone で復旧を試みるまでの最小遅延秒数です。

#### `tablet_create_timeout_second`

デフォルト：1（s）

動的変更可能：true

Master FE のみ：true

単一のレプリカの作成を待つ最大時間です。

例:
   #m 個の Tablet と、Tablet あたり #n 個のレプリカを持つテーブルを作成する場合、
   CREATE TABLE 要求は、タイムアウトまで最大 (m *n* tablet_create_timeout_second) 実行されます。

#### `tablet_delete_timeout_second`

デフォルト：2

動的変更可能：true

Master FE のみ：true

*tablet_create_timeout_second* と同じ意味ですが、Tablet の削除時に使用します。

#### `delete_job_max_timeout_second`

デフォルト: 300(s)

動的変更可能: true

Master FE のみ: true

Delete ジョブの最大タイムアウト（秒）です。

#### `alter_table_timeout_second`

デフォルト: 86400 * 30 (1 month)

動的変更可能：true

Master FE のみ：true

ALTER TABLE 要求の最大タイムアウトです。テーブルのデータサイズに合わせて十分に長く設定してください。

#### `max_replica_count_when_schema_change`

OlapTable のスキーマ変更時に許可されるレプリカの最大数です。レプリカが多すぎると FE で OOM が発生します。

デフォルト: 100000

動的変更可能: true

Master FE 固有: true

#### `history_job_keep_max_second`

デフォルト：`7 * 24 * 3600` （7 日）

動的変更可能：true

Master FE のみ：true

スキーマ変更ジョブや Rollup ジョブなどを保持する最大時間です。

#### `max_create_table_timeout_second`

デフォルト：60 （s）

動的変更可能：true

Master FE のみ：true

テーブル（インデックス）の作成を長時間待たないよう、最大タイムアウトを設定します。

#### `autobucket_min_buckets`

デフォルト: 3（旧値は 1。4.0.8 / 4.1.4 より前）

動的変更可能: true

Master FE のみ: true

自動バケット分割（`DISTRIBUTED BY ... BUCKETS AUTO`）によって生成されるバケットの最小数です。

**バージョン 4.0.8（Doris 4.0 系）とバージョン 4.1.4（4.1 系）以降、デフォルト値は `1` から `3` に変更されました。** 以前のデフォルトでは小さいパーティションが単一のバケットになり、並列度とデータ分散が不足していました。変更後は自動バケット分割で少なくとも 3 バケットが生成されます。新しく作成するパーティションにのみ影響し、既存のパーティションのバケット数は変わりません。

#### `autobucket_max_buckets`

デフォルト: 128

動的変更可能: true

Master FE のみ: true

自動バケット分割で生成されるバケットの最大数です。計算結果がこの値を超える場合、この値に制限されます。

### 外部テーブル

#### `external_meta_cache_max_weight`

デフォルト: `0`

動的変更可能: false

Master FE 固有: false

バージョン 4.1.4 で追加されました。FE レベルの外部メタデータキャッシュ全体の容量上限です。

値には単位付きのバイトサイズ（`1024MB`、`4GB` など）または JVM の最大ヒープサイズに対する割合（`10%` など）を指定できます。`0` は全体のクォータを設定しないことを意味し、以前のバージョンと同じ動作になります。

このクォータは、Hive のパーティション値、Iceberg のテーブル・スナップショット・マニフェスト、Paimon のスナップショットなど、各種外部テーブルメタデータキャッシュのメモリ使用量を一律に制限します。個々の Catalog は `meta.cache.max-weight` と `meta.cache.<engine>.<entry>.max-weight` プロパティでより細かく制御でき、キャッシュ使用量は `information_schema.catalog_meta_cache_statistics` システムテーブルで確認できます。

#### `jdbc_driver_url_white_list`

デフォルト: 空

動的変更可能: false

JDBC Catalog の作成時に許可される `driver_url` 値の許可リストです。複数の値はカンマで区切ります（例: `jdbc_driver_url_white_list=a,b,c`）。空の値は許可リストが設定されていないことを意味します。

:::caution 動作変更（4.1.4）

セキュリティ上の理由から、バージョン 4.1.4 以降、この設定項目は **動的に変更できません**。`fe.conf` でのみ設定でき、FE の再起動後に有効になります。`ADMIN SET FRONTEND CONFIG` では変更できません。

:::

#### `force_sqlserver_jdbc_encrypt_false`

デフォルト: false

動的変更可能: false

SQLServer JDBC Catalog の `encrypt` パラメーターを強制的に `false` にするかどうかを指定します。

:::caution 動作変更（4.1.4）

この設定は SQLServer JDBC の転送暗号化を無効にするため、セキュリティ上重要です。バージョン 4.1.4 以降は **動的に変更できません**。`fe.conf` でのみ設定でき、FE の再起動後に有効になります。

:::

#### `file_scan_node_split_num`

デフォルト：128

動的変更可能：true

Master FE のみ：false

複数 Catalog での並行ファイルスキャンスレッド数です。

#### `file_scan_node_split_size`

デフォルト：`256 * 1024 * 1024`

動的変更可能：true

Master FE のみ：false

複数 Catalog での並行ファイルスキャンのサイズです。

#### `enable_odbc_mysql_broker_table`

デフォルト：false

動的変更可能：true

Master FE のみ：false

バージョン 2.1 以降、ODBC、JDBC、Broker の外部テーブルの作成はサポートされません。ODBC と MySQL の外部テーブルの代わりに JDBC テーブルまたは JDBC Catalog を、Broker テーブルの代わりにテーブル値関数を使用してください。

#### `max_hive_partition_cache_num`

Hive パーティションのキャッシュの最大数です。

デフォルト: 100000

動的変更可能: false

Master FE 固有: false

#### `hive_metastore_client_timeout_second`

Hive Metastore のデフォルト接続タイムアウトです。

デフォルト: 10

動的変更可能: true

Master FE 固有: true

#### `max_external_cache_loader_thread_pool_size`

外部メタデータキャッシュのロードに使用するスレッドプールの最大サイズです。

デフォルト: 10

動的変更可能: false

Master FE 固有: false

#### `max_external_file_cache_num`

外部テーブルに使用するファイルキャッシュの最大数です。

デフォルト: 100000

動的変更可能: false

Master FE 固有: false

#### `max_external_schema_cache_num`

外部テーブルに使用するスキーマキャッシュの最大数です。

デフォルト: 10000

動的変更可能: false

Master FE 固有: false

#### `external_cache_expire_time_minutes_after_access`

最後のアクセスからキャッシュ内データが期限切れになるまでの時間を設定します。単位は分です。
External Schema Cache と Hive Partition Cache の両方に適用されます。

デフォルト: 1440

動的変更可能: false

Master FE 固有: false

#### `es_state_sync_interval_second`

デフォルト：10

FE は es_state_sync_interval_secs ごとに ES API を呼び出し、ES インデックスのシャード情報を取得します。

### 外部リソース

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

YARN 設定ファイルのデフォルトディレクトリです。YARN コマンドを実行する前に毎回、このパスに設定ファイルが存在するか確認し、なければ作成します。

#### `yarn_client_path`

デフォルト：DORIS_HOME_DIR + "/lib/yarn-client/hadoop/bin/yarn"

YARN クライアントのデフォルトパスです。

#### `spark_launcher_log_dir`

デフォルト： sys_log_dir + "/spark_launcher_log"

Spark Launcher のログディレクトリを指定します。

#### `spark_resource_path`

デフォルト：none

Spark 依存ファイルのデフォルトパスです。

#### `spark_home_default_dir`

デフォルト：DORIS_HOME_DIR + "/lib/spark2x"

Spark のホームディレクトリのデフォルト値です。

#### `spark_dpp_version`

デフォルト: 1.0.0

Spark DPP のデフォルトバージョンです。

### その他

#### `tmp_dir`

デフォルト: DorisFE.DORIS_HOME_DIR + "/temp_dir"

一時ディレクトリは、バックアップや復元などの処理の中間結果を保存します。処理の完了後、このディレクトリのファイルは消去されます。

#### `custom_config_dir`

デフォルト: DorisFE.DORIS_HOME_DIR + "/conf"

カスタム設定ファイルのディレクトリです。

`fe_custom.conf` ファイルの場所を設定します。デフォルトは `conf/` ディレクトリです。

デプロイ環境によっては、システムのアップグレードで `conf/` ディレクトリが上書きされ、ユーザーが変更した設定項目も失われる場合があります。これを防ぐには、`fe_custom.conf` を別の指定ディレクトリに保存します。

#### `plugin_dir`

デフォルト：DORIS_HOME + "/plugins

プラグインのインストールディレクトリです。

#### `plugin_enable`

デフォルト:true

動的変更可能：true

Master FE のみ：true

プラグインを有効にするかどうかを指定します。デフォルトで有効です。

#### `small_file_dir`

デフォルト：DORIS_HOME_DIR/small_files

小さいファイルを保存します。

#### `max_small_file_size_bytes`

デフォルト：1M

動的変更可能：true

Master FE のみ：true

SmallFileMgr に保存する単一ファイルの最大サイズです。

#### `max_small_file_number`

デフォルト：100

動的変更可能：true

Master FE のみ：true

SmallFileMgr に保存するファイルの最大数です。

#### `enable_metric_calculator`

デフォルト：true

true の場合、Metric Collector がデーモンタイマーとして動作し、一定間隔でメトリクスを収集します。

#### `report_queue_size`

デフォルト： 100

動的変更可能：true

Master FE のみ：true

FE に Report タスクが蓄積して OOM が発生することを防ぐためのしきい値です。たとえば 100 台の Backend と千万個のレプリカがある大規模な Doris クラスターでは、パーティション削除などでメタデータが変更された後、Tablet Report に数秒かかる場合があります。Backend は 1 分ごとに Tablet 情報を報告するため、無制限に受け付けることはできません。将来的に処理速度を改善する予定ですが、現在はキューサイズが上限を超えると Report を破棄します。
   本番環境での所要時間の例:
      1. ディスク Report: 0-1 msta
      2. sk Report: 0-1 ms
      3. Tablet Report
      4. 10000 個のレプリカ: 200ms

#### `backup_job_default_timeout_ms`

デフォルト: 86400 * 1000  (1 日)

動的変更可能：true

Master FE のみ：true

バックアップジョブのデフォルトタイムアウトです。

#### `backup_upload_snapshot_batch_size`

デフォルト：10

動的変更可能：true

Master FE のみ：true

バックアップ処理中に一つの Upload タスクに割り当てるスナップショットの最大数です。デフォルト値は 10 です。

#### `restore_download_snapshot_batch_size`

デフォルト：10

動的変更可能：true

Master FE のみ：true

復元処理中に一つの Download タスクに割り当てるスナップショットの最大数です。デフォルト値は 10 です。

#### `max_backup_restore_job_num_per_db`

デフォルト: 10

各データベースに記録されるバックアップ・復元タスクの数を制御します。

#### `max_backup_tablets_per_job`

デフォルト: 300000

動的変更可能：true

Master FE のみ：true

メタデータの保存量が多すぎて FE で OOM が発生しないよう、バックアップジョブあたりの Tablet の最大数を制御します。

#### `enable_quantile_state_type`

デフォルト：false

動的変更可能：true

Master FE のみ：true

quantile_state データ型を有効にするかどうかを指定します。

#### `enable_date_conversion`

デフォルト：true

動的変更可能：true

Master FE のみ：true

FE は date/datetime を datev2/datetimev2(0) に自動変換します。

#### `enable_decimal_conversion`

デフォルト：true

動的変更可能：true

Master FE のみ：true

FE は DecimalV2 を DecimalV3 に自動変換します。

#### `proxy_auth_magic_prefix`

デフォルト：x@8

#### `proxy_auth_enable`

デフォルト：false

#### `enable_func_pushdown`

デフォルト：true

動的変更可能：true

Master FE のみ：false

ODBC または JDBC 外部テーブルに対するクエリで、関数を含むフィルター条件を MYSQL にプッシュダウンするかどうかを指定します。

#### `jdbc_drivers_dir`

デフォルト: `${DORIS_HOME}/jdbc_drivers`;

動的変更可能：false

Master FE のみ：false

JDBC ドライバーを配置するデフォルトディレクトリです。

#### `max_error_tablet_of_broker_load`

デフォルト: 3;

動的変更可能：true

Master FE のみ：true

Broker Load で表示するエラー Tablet の最大数です。

#### `default_db_max_running_txn_num`

デフォルト：-1

動的変更可能：true

Master FE のみ：true

データベースのトランザクションクォータのデフォルトサイズを設定します。

デフォルト値の -1 は、`max_running_txn_num_per_db` を `default_db_max_running_txn_num` の代わりに使用することを意味します。

個別のデータベースにクォータを設定するには、次を使用します。

```
Set the database transaction quota
ALTER DATABASE db_name SET TRANSACTION QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```

#### `prefer_compute_node_for_external_table`

デフォルト：false

動的変更可能：true

Master FE のみ：false

true の場合、外部テーブルへのクエリは Compute ノードに優先的に割り当てられます。Compute ノードの最大数は `min_backend_num_for_external_table` で制御されます。
false の場合、外部テーブルへのクエリは任意のノードに割り当てられます。

#### `min_backend_num_for_external_table`

デフォルト：3

動的変更可能：true

Master FE のみ：false

`prefer_compute_node_for_external_table` が true の場合にのみ有効です。Compute ノード数がこの値より少ない場合、外部テーブルへのクエリを一部の Mixed ノードにも割り当て、ノード総数がこの値に達するようにします。
Compute ノード数がこの値より多い場合、外部テーブルへのクエリは Compute ノードのみに割り当てられます。

#### `infodb_support_ext_catalog`

デフォルト: false

動的変更可能: true

Master FE のみ: false

false の場合、information_schema データベースのテーブルを参照するとき、
結果に外部 Catalog 内のテーブル情報は含まれません。
外部 Catalog に接続できない場合にクエリに時間がかかることを避けるためです。

#### `enable_query_hit_stats`

デフォルト: false

動的変更可能: true

Master FE のみ: false

クエリヒット統計を有効にするかどうかを制御します。デフォルトは false です。

#### `div_precision_increment`

デフォルト: 4

この変数は、
`/` 演算子による除算結果の小数部の桁数を増やす数を示します。

#### `enable_convert_light_weight_schema_change`

デフォルト：true

一時的な設定項目です。有効にするとバックグラウンドスレッドが起動し、すべての OLAP テーブルを Light Schema Change に自動変更します。変更結果は `show convert_light_schema_change [from db]` コマンドで確認でき、Light Schema Change ではなかったすべてのテーブルの変換結果が表示されます。

#### `disable_local_deploy_manager_drop_node`

デフォルト：true

cluster.info ファイルのエラーによってノードが削除されないよう、LocalDeployManager によるノード削除を禁止します。

#### `mysqldb_replace_name`

デフォルト: mysql

MySQL エコシステムとの互換性のため、Doris には mysql という組み込みデータベースがあります。ユーザーのデータベースと名前が重複する場合は、この項目を変更して組み込み MySQL データベースの名前を別の名前にしてください。

#### `max_auto_partition_num`

デフォルト値: 2000

自動パーティションテーブルで誤って大量のパーティションを作成することを防ぐため、OLAP テーブルあたりの許可パーティション数を `max_auto_partition_num` で制限します。デフォルトは 2000 です。

#### `profile_manager_gc_interval_seconds`

デフォルト値: 1

ProfileManager がプロファイルのガベージコレクションを実行する間隔を制御します。実行時には余分なプロファイルや期限切れのプロファイルをメモリとディスクから削除し、メモリを節約します。

### コンピュートとストレージの分離モード

#### `cluster_id`

デフォルト：-1

ノード（FE または BE）はクラスター ID が同じなら同じ Doris クラスターに属すると見なされます。コンピュートとストレージの分離モードでは、ランダムな整数を一つ指定してください。

#### `deploy_mode`

デフォルト: ""

説明: FE の動作モードです。`cloud` はストレージとコンピュートの分離モードを示します。

#### `meta_service_endpoint`

デフォルト: ""

Meta Service のエンドポイントは「host1:port,host2:port」形式で指定します。この設定はストレージとコンピュートの分離モードに必要です。

#### `enable_group_commit_streamload_be_forward`

デフォルト: false

動的変更可能: true

コンピュートとストレージの分離モードで、Group Commit の Stream Load BE 転送を有効にするかどうかを指定します。分離モードで、かつ要求が Group Commit を使用する場合にのみ有効です。

有効にすると、FE は Stream Load 要求を `_stream_load_forward` エンドポイントにリダイレクトし、受信した BE がそのテーブルの対象 BE に要求を転送します。これにより、ロードバランサーが同じテーブルの Group Commit バッチ処理を分散してしまうことを防ぎます。

FE と BE の両方で同名の設定を有効にする必要があります。**バージョン 4.0.8（Doris 4.0 系）とバージョン 4.1.4（4.1 系）以降、BE 側の `_stream_load_forward` エンドポイントは BE の設定で制御されます。無効な場合は `403 Forbidden` を返し、有効な場合も要求には認証とグローバル `LOAD` 権限が必要です。** 詳しくは [グループコミット](../../data-operate/import/load-best-practices/group-commit-manual) と [BE 設定](./be-config) を参照してください。

#### `default_get_version_from_ms_timeout_second`

デフォルト: 30 (s)

動的変更可能: false

FE が Meta Service からバージョンを取得する際のタイムアウトです。

:::caution 動作変更（4.1.4）

デフォルト値は `3` 秒から `30` 秒へ、バージョン 4.1.4 で変更されました。以前は Meta Service の応答が不安定な場合や高負荷の場合、3 秒のタイムアウトによってクエリが失敗しやすくなっていました。値を増やすことで、このような散発的な失敗を大幅に減らします。

:::

#### `enable_cloud_replica_stale_route_clean`

デフォルト: true

動的変更可能: true

バージョン 4.1.4 で追加されました。メタデータイメージの読み込み時と Tablet バランシングの実行時に、存在しない Backend を指す CloudReplica の Primary と Secondary のルート記録を消去するかどうかを指定します。

このような古い記録はクエリ時にはすでに無視され（レプリカから Backend が再度ハッシュ計算されます）、FE のメモリとメタデータイメージの容量を消費するだけです。`false` にすると、消去しない従来の動作を維持します。

#### `enable_cloud_colocate_consistent_hash`

デフォルト: true

動的変更可能: false

Master FE 固有: true

バージョン 4.1.4 で追加されました。コンピュートとストレージの分離モードにおける Colocate テーブルのバケット配置で、Rendezvous Consistent Hashing を使用するかどうかを指定します。`false` の場合は従来の剰余に基づく配置に戻ります。`fe.conf` でのみ設定でき、再起動後に有効になります。

#### `meta_service_rpc_rate_limit_enabled`

デフォルト: false

動的変更可能: true

バージョン 4.1.4 で追加されました。FE から Meta Service に送信する RPC 要求の QPS 制限を有効にするかどうかを指定します。

#### `meta_service_rpc_rate_limit_default_qps_per_core`

デフォルト: 50

動的変更可能: true

バージョン 4.1.4 で追加されました。`meta_service_rpc_rate_limit_qps_per_core_config` で個別に設定されていない Meta Service RPC メソッドについて、CPU コアあたりに許可されるデフォルト QPS です。`0` 以下は制限なしを意味します。

#### `meta_service_rpc_rate_limit_qps_per_core_config`

デフォルト: `getPartitionVersion:500;getTableVersion:500;getTabletStats:50;beginTxn:50`

動的変更可能: true

バージョン 4.1.4 で追加されました。Meta Service RPC メソッドごとに設定する CPU コアあたりの QPS 上限です。形式は `method1:qps1;method2:qps2` です。`0` 以下の値はそのメソッドを制限しないことを意味します。

#### `meta_service_rpc_rate_limit_burst_seconds`

デフォルト: 2 (s)

動的変更可能: true

バージョン 4.1.4 で追加されました。Meta Service RPC のレート制限で、バーストを許可する時間枠の長さ（秒）です。長期的な平均 QPS は変わりませんが、この時間枠内ではバーストが許可されます。

#### `meta_service_rpc_rate_limit_wait_timeout_ms`

デフォルト: 1000 (ms)

動的変更可能: true

バージョン 4.1.4 で追加されました。RPC がレート制限を受けたときの最大待ち時間（ミリ秒）です。`0` は待機せず、要求が即座に失敗することを意味します。
