---
{
    "title": "FE 設定 | 設定",
    "language": "ja",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "メタデータ管理、クエリエンジン、データロードとエクスポート、ストレージ設定を含む、Doris の Frontend（FE）設定パラメータの完全なリファレンスガイド。",
    "sidebar_label": "FE 設定"
}
---

# FE 設定 {#fe-configuration}

このドキュメントでは、主に FE の設定項目について説明します。

FE の設定ファイル `fe.conf` は通常、FE のデプロイ先にある `conf/` ディレクトリに保存されます。バージョン 0.14 では、別の設定ファイル `fe_custom.conf` が導入されます。このファイルには、運用中にユーザーが動的に設定し、永続化した設定項目が記録されます。

FE プロセスは起動時にまず `fe.conf` の設定項目を読み込み、次に `fe_custom.conf` の設定項目を読み込みます。両方に同じ設定項目がある場合は、`fe_custom.conf` の値が `fe.conf` の値を上書きします。

`fe_custom.conf` ファイルの場所は、`fe.conf` の設定項目 `custom_config_dir` で指定できます。

## 設定項目の確認 {#view-configuration-items}

FE の設定項目を確認する方法は次の 2 つです。

1. FE の Web ページ

    ブラウザーで FE の Web ページ `http://fe_host:fe_http_port/variable` を開きます。現在有効な FE の設定項目は `Configure Info` で確認できます。

2. コマンドによる確認

    FE の起動後、MySQL クライアントで次のコマンドを実行すると、FE の設定項目を確認できます。コマンドの詳細は [SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG) を参照してください。

    `SHOW FRONTEND CONFIG;`

    結果の各列の意味は次のとおりです。

    * Key: 設定項目の名前。
    * Value: 現在の設定値。
    * Type: 整数や文字列など、設定値の型。
    * IsMutable: 動的に設定できるかどうか。true の場合は実行中に動的に設定できます。false の場合は `fe.conf` でのみ設定でき、FE の再起動後に有効になります。
    * MasterOnly: Master FE ノード固有の設定項目かどうか。true の場合は Master FE ノードでのみ意味を持ち、ほかの種類の FE ノードには適用されません。false の場合はすべての種類の FE ノードで意味を持ちます。
    * Comment: 設定項目の説明。

## 設定項目の変更 {#set-configuration-items}

バージョン 4.1.5 以降、`SHOW FRONTEND CONFIG` と設定のエクスポートエンドポイントでは、空でない機密値が `********` にマスクされます。対象には `initial_root_password`、TLS 秘密鍵のパスワード、HTTPS Key Store のパスワード、MySQL SSL 証明書のパスワードが含まれます。空の値は、未設定であることを示すために空のまま表示されます。マスクしても有効な設定値は変わりません。

FE の設定項目を変更する方法は次のとおりです。

1. 静的設定

    `conf/fe.conf` ファイルに設定項目を追加し、値を指定します。`fe.conf` の設定項目は FE プロセスの起動時に読み込まれます。`fe.conf` にない設定項目にはデフォルト値が使用されます。

2. MySQL プロトコルによる動的設定

    FE の起動後、次のコマンドで設定項目を動的に変更できます。このコマンドには管理者権限が必要です。

    `ADMIN SET FRONTEND CONFIG (" fe_config_name "=" fe_config_value ");`

    すべての設定項目が動的設定に対応しているわけではありません。対応状況は `SHOW FRONTEND CONFIG;` コマンドの結果にある `IsMutable` 列で確認できます。

    `MasterOnly` の設定項目を変更すると、コマンドは Master FE に直接転送され、Master FE の該当項目のみが変更されます。

    **この方法で変更した設定項目は、FE プロセスを再起動すると無効になります。**

    コマンドの詳細は `HELP ADMIN SET CONFIG;` で確認できます。

3. HTTP プロトコルによる動的設定

    詳細は [Set Config Action](../open-api/fe-http/set-config-action) を参照してください。

    この方法では、変更した設定項目を永続化することもできます。設定項目は `fe_custom.conf` ファイルに保存され、FE の再起動後も有効です。

## 例 {#examples}

1. `async_pending_load_task_pool_size` の変更

    `SHOW FRONTEND CONFIG;` で確認すると、この設定項目は動的に変更できません（`IsMutable` が false）。`fe.conf` に次を追加します。

    `async_pending_load_task_pool_size = 20`

    その後、設定を有効にするために FE プロセスを再起動します。

2. `dynamic_partition_enable` の変更

    `SHOW FRONTEND CONFIG;` で確認すると、この設定項目は動的に変更でき（`IsMutable` が true）、Master FE 固有の設定です。任意の FE に接続し、次のコマンドを実行して変更できます。

    ```
    ADMIN SET FRONTEND CONFIG ("dynamic_partition_enable" = "true"); `
    ```

    変更後は、次のコマンドで値を確認できます。

    ```
    set forward_to_master = true;
    SHOW FRONTEND CONFIG;
    ```

    この方法で変更した設定は、Master FE の再起動や Master の選出が行われると無効になります。永続化するには、設定項目を `fe.conf` に直接追加して FE を再起動します。

3. `max_distribution_pruner_recursion_depth` の変更

    `SHOW FRONTEND CONFIG;` で確認すると、この設定項目は動的に変更でき（`IsMutable` が true）、Master FE 固有の設定ではありません。

    同様に、動的設定コマンドで変更できます。この設定は Master FE 固有ではないため、すべての FE に変更後の値を適用するには、各 FE に個別に接続して設定を変更する必要があります。

## 設定一覧 {#configurations}

### メタデータとクラスター {#metadata-and-cluster}

#### `meta_dir` {#meta_dir}

デフォルト：DORIS_HOME_DIR + "/doris-meta"

型：string。説明：Doris のメタデータはここに保存されます。このディレクトリのストレージには、次を強く推奨します。

* 高い書き込み性能（SSD）
* 安全性（RAID）

#### `catalog_try_lock_timeout_ms` {#catalog_try_lock_timeout_ms}

デフォルト：5000（ms）

IsMutable：true

catalog ロックの tryLock タイムアウトです。通常は、テストが必要な場合を除き変更する必要はありません。

#### `enable_bdbje_debug_mode` {#enable_bdbje_debug_mode}

デフォルト：false

true に設定すると、FE は BDBJE デバッグモードで起動します。

#### `max_bdbje_clock_delta_ms` {#max_bdbje_clock_delta_ms}

デフォルト：5000（5s）

非 Master FE と Master FE ホスト間で許容する最大の時刻ずれを設定します。非 Master FE が BDBJE を介して Master FE に接続するたびに確認され、ずれがこの値を超えると接続は破棄されます。

#### `metadata_failure_recovery` {#metadata_failure_recovery}

デフォルト：false

true にすると、FE は bdbje のレプリケーショングループをリセットし、選出可能なノードの情報をすべて削除して、Master として起動を試みます。選出可能なノードがすべて起動できない場合は、メタデータを別のノードにコピーし、この設定を true にして FE の再起動を試すことができます。

#### `txn_rollback_limit` {#txn_rollback_limit}

デフォルト：100

グループへの再参加時に bdbje がロールバックできるトランザクションの最大数です。

#### `grpc_threadmgr_threads_nums` {#grpc_threadmgr_threads_nums}

デフォルト：4096

grpc_threadmgr で grpc イベントを処理するスレッド数です。

#### `bdbje_replica_ack_timeout_second` {#bdbje_replica_ack_timeout_second}

デフォルト：10（s）

bdbje への書き込み時にレプリカの確認応答を待つタイムアウトです。比較的大きなログを書き込むと確認応答がタイムアウトし、ログの書き込みに失敗する場合があります。その場合は、この値を適切に増やしてください。

#### `bdbje_lock_timeout_second` {#bdbje_lock_timeout_second}

デフォルト：5

bdbje 操作のロックタイムアウトです。FE の WARN ログに LockTimeoutException が多数出る場合は、この値を増やしてみてください。

#### `bdbje_heartbeat_timeout_second` {#bdbje_heartbeat_timeout_second}

デフォルト：30

Master と Follower 間の bdbje ハートビートのタイムアウトです。デフォルトは 30 秒で、bdbje のデフォルト値と同じです。一時的なネットワーク障害や予期しない長時間の Java GC による誤検知を減らすには、この値を増やしてみてください。

#### `replica_ack_policy` {#replica_ack_policy}

デフォルト：SIMPLE_MAJORITY

選択肢：ALL、NONE、SIMPLE_MAJORITY

bdbje のレプリカ確認応答ポリシーです。詳細：<http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.ReplicaAckPolicy.html>

#### `replica_sync_policy` {#replica_sync_policy}

デフォルト：SYNC

選択肢：SYNC、NO_SYNC、WRITE_NO_SYNC

bdbje の Follower FE 同期ポリシーです。

#### `master_sync_policy` {#master_sync_policy}

デフォルト：SYNC

選択肢：SYNC、NO_SYNC、WRITE_NO_SYNC

bdbje の Master FE 同期ポリシーです。Follower FE を 1 台だけデプロイする場合は `SYNC` に設定してください。Follower FE を 3 台より多くデプロイする場合は、この設定と `replica_sync_policy` を WRITE_NO_SYNC に設定できます。詳細：<http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.SyncPolicy.html>

#### `bdbje_reserved_disk_bytes` {#bdbje_reserved_disk_bytes}

レプリケートされた JE Environment で保持する予約済み領域のバイト数の目標上限です。

デフォルト：1073741824

動的設定：不可

Master FE ノード固有：いいえ

#### `ignore_meta_check` {#ignore_meta_check}

デフォルト：false

IsMutable：true

true の場合、非 Master FE は Master FE とのメタデータの遅延差を無視し、*meta_delay_toleration_second* を超えても読み取りサービスを提供し続けます。何らかの理由で Master FE を比較的長時間停止する際に、非 Master FE に読み取りサービスを継続させたい場合に役立ちます。

#### `meta_delay_toleration_second` {#meta_delay_toleration_second}

デフォルト：300（5 分）

メタデータの遅延差が *meta_delay_toleration_second* を超えると、非 Master FE はサービスの提供を停止します。

#### `edit_log_port` {#edit_log_port}

デフォルト：9010

bdbje のポートです。

#### `edit_log_type` {#edit_log_type}

デフォルト：BDB

Edit Log の種類です。
BDB：ログを bdbje に書き込みます。
LOCAL：非推奨です。

#### `edit_log_roll_num` {#edit_log_roll_num}

デフォルト：50000

IsMutable：true

MasterOnly：true

Master FE は *edit_log_roll_num* 件のメタデータジャーナルごとに image を保存します。

#### `force_do_metadata_checkpoint` {#force_do_metadata_checkpoint}

デフォルト：false

IsMutable：true

MasterOnly：true

true にすると、チェックポイントスレッドは JVM のメモリ使用率にかかわらずチェックポイントを作成します。

#### `metadata_checkpoint_memory_threshold` {#metadata_checkpoint_memory_threshold}

デフォルト：60（60%）

IsMutable：true

MasterOnly：true

JVM のメモリ使用率（ヒープまたは old メモリプール）がこのしきい値を超えると、OOM を避けるためチェックポイントスレッドは動作しません。

#### `max_same_name_catalog_trash_num` {#max_same_name_catalog_trash_num}

catalog のごみ箱に保持する同名のメタデータの最大数を設定します。上限を超えると、最も古くに削除されたメタデータが完全に削除され、復元できなくなります。0 は同名のオブジェクトを保持しないこと、0 未満は無制限を意味します。

注意：同名かどうかの判定範囲は限定されます。たとえば、同名のデータベースは同じクラスター内、同名のテーブルは同じデータベース内（同じデータベース ID）、同名のパーティションは同じデータベース内（同じデータベース ID）かつ同じテーブル内（同じテーブル ID）で判定されます。

デフォルト：3

動的設定：可能

Master FE ノード固有：はい

#### `cluster_id` {#cluster_id}

デフォルト：-1

同じクラスター ID を持つノード（FE または BE）は、同じ Doris クラスターに属するとみなされます。クラスター ID は通常、Master FE の初回起動時に生成されるランダムな整数ですが、指定することもできます。

#### `heartbeat_mgr_blocking_queue_size` {#heartbeat_mgr_blocking_queue_size}

デフォルト：1024

MasterOnly：true

heartbeat_mgr でハートビートタスクを保持するブロッキングキューのサイズです。

#### `heartbeat_mgr_threads_num` {#heartbeat_mgr_threads_num}

デフォルト：8

MasterOnly：true

heartbeat_mgr でハートビートイベントを処理するスレッド数です。

#### `disable_cluster_feature` {#disable_cluster_feature}

デフォルト：true

IsMutable：true

マルチクラスター機能はバージョン 0.12 で非推奨になります。この設定を true にすると、次を含むクラスター機能関連のすべての操作が無効になります。

1. クラスターの作成と削除
2. 空き backend の追加、クラスターへの backend の追加、クラスターのバランス調整を伴う decommission
3. クラスターの backend 数の変更
4. データベースのリンクと移行

#### `enable_fqdn_mode` {#enable_fqdn_mode}

この設定は主に k8s クラスター環境で使用します。enable_fqdn_mode が true の場合、BE が配置された pod を再作成しても pod 名は変わらず、IP は変更できます。

デフォルト：false

動的設定：不可

Master FE ノード固有：はい

#### `enable_token_check` {#enable_token_check}

デフォルト：true

前方互換性のための設定で、将来削除されます。image ファイルのダウンロード時に token を確認します。

#### `fe_meta_auth_token` {#fe_meta_auth_token}

デフォルト：""（空文字列）

IsMutable：false

FE ノード間の FE メタサービス HTTP エンドポイント（`image`、`role`、`check`、`put`、`journal_id` など）の認証に使用するクラスタートークンです。Doris 4.0 系ではバージョン 4.0.8、4.1 系ではバージョン 4.1.4 で追加されました。

空でない値を設定すると、これらのエンドポイントでは既存のノードホスト確認に加え、呼び出し元に一致するトークンヘッダーが必要になります。これにより、クラスターに属さないノードから FE メタデータエンドポイントへのアクセスを防ぎます。空のままにすると従来のノードホストのみの確認が維持され、既存クラスターやローリングアップグレードには影響しません。

:::caution 注意

この設定は **すべての FE** で同じ値にし、有効にする前に `fe.conf` に記述する必要があります。値が異なると、FE 間でメタデータ要求が拒否され、メタデータの同期に失敗します。

:::

#### `enable_multi_tags` {#enable_multi_tags}

デフォルト：false

動的設定：不可

Master FE ノード固有：はい

単一の BE で複数タグの機能を有効にするかどうかを指定します。

#### `initial_root_password` {#initial_root_password}

root ユーザーの初期パスワードを 2 段階の SHA-1 で暗号化した値として設定します。デフォルトの空文字列は、root パスワードがないことを意味します。その後 root ユーザーに対して `set password` を実行すると、初期パスワードは上書きされます。

例：平文パスワード `root@123` を設定する場合、Doris SQL の `select password('root@123')` を実行すると、暗号化されたパスワード `*A00C34073A26B40AB4307650BFB9309D6BFA6999` を生成できます。

デフォルト：空文字列

動的設定：不可

Master FE ノード固有：はい

#### `enable_cooldown_replica_affinity` {#enable_cooldown_replica_affinity}

スキャン時にクールダウン済みのレプリカを優先して使用するかどうかを選択します。デフォルトは true です。

デフォルト：true

動的設定：可能

Master FE ノード固有：いいえ

### サービス {#service}

#### `arrow_flight_deferred_query_idle_timeout_second` {#arrow_flight_deferred_query_idle_timeout_second}

デフォルト：3600（秒）

動的設定：可能

Master FE ノード固有：いいえ

バージョン 4.1.5 以降でサポートされます。外部テーブルをバッチ単位でスキャンする Arrow Flight SQL クエリは、`GetFlightInfo` を返した後も FE Coordinator を保持する必要があります。これにより、クライアントが `DoGet` で結果を読み取る間、BE は split の取得を続けられます。この設定は、アイドル状態のセッションにあるクエリがリソースを保持する時間を制限します。期間はクエリ開始時から数え、クエリの実行タイムアウトより短くはなりません。期限が切れると、Coordinator、Workload Group のキュースロット、`active_queries` のエントリが解放されます。セッションは開いたままで、引き続き `wait_timeout` が適用されます。`0` にするとこの期限が無効になります。

#### `query_port` {#query_port}

デフォルト：9030

FE の MySQL サーバーポートです。

#### `arrow_flight_sql_port` {#arrow_flight_sql_port}

デフォルト：-1

Arrow Flight SQL サーバーのポートです。

#### `frontend_address` {#frontend_address}

状態：非推奨。使用は推奨されず、将来削除される可能性があります。

型：string

説明：*InetAddress.getByName* で IP アドレスを取得する代わりに、FE の IP アドレスを明示的に設定します。通常は *InetAddress.getByName* で期待した結果が得られない場合に使用します。ホスト名には対応せず、IP アドレスのみ指定できます。

デフォルト値：0.0.0.0

#### `priority_networks` {#priority_networks}

デフォルト：none

複数の IP アドレスを持つサーバーの選択方法を指定します。このリストに一致する IP は最大 1 つにしてください。CIDR 表記の値をセミコロンで区切ります。例：10.10.10.0/24。一致する IP がない場合はランダムに選択されます。

#### `http_port` {#http_port}

デフォルト：8030

HTTP のバインドポートです。現在、すべての FE で同じ HTTP ポートを使用する必要があります。

#### `https_port` {#https_port}

デフォルト：8050

HTTPS のバインドポートです。現在、すべての FE で同じ HTTPS ポートを使用する必要があります。

#### `enable_https` {#enable_https}

デフォルト：false

HTTPS を有効にするフラグです。false の場合は HTTP を使用します。true の場合は HTTP と HTTPS の両方を使用でき、HTTP 要求は自動的に HTTPS にリダイレクトされます。
`enable_https` が true の場合は、fe.conf に SSL 証明書の情報を設定する必要があります。

#### `enable_ssl` {#enable_ssl}

デフォルト：true

true にすると、Doris は MySQL との間に SSL プロトコルに基づく暗号化チャネルを確立します。

#### `qe_max_connection` {#qe_max_connection}

デフォルト：1024

FE ごとの最大接続数です。

#### `check_java_version` {#check_java_version}

デフォルト：true

Doris はコンパイル時と実行時の Java バージョンの互換性を確認します。互換性がない場合は、Java バージョンの不一致を示す例外メッセージを出して起動を終了します。

#### `rpc_port` {#rpc_port}

デフォルト：9020

FE の Thrift Server ポートです。

#### `thrift_server_type` {#thrift_server_type}

FE の Thrift Service が使用するサービスモデルを指定します。型は String で、大文字と小文字は区別されません。

`SIMPLE` の場合は `TSimpleServer` モデルを使用します。一般に本番環境には適さず、テスト用途に限られます。

`THREADED` の場合は `TThreadedSelectorServer` モデルを使用します。これは非ブロッキング I/O のマスタースレーブ Reactor モデルで、多数の同時接続要求に素早く応答でき、ほとんどの場面で良好な性能を発揮します。

`THREAD_POOL` の場合は `TThreadPoolServer` モデルを使用します。ブロッキング I/O のモデルで、スレッドプールを使ってユーザー接続を処理します。同時接続数はスレッドプールのスレッド数に制限されます。並列要求数を事前に見積もることができ、十分なスレッドリソースを割り当てられる場合は、より高い性能が得られます。このサービスモデルがデフォルトです。

#### `thrift_server_max_worker_threads` {#thrift_server_max_worker_threads}

デフォルト：4096

Thrift サーバーのワーカースレッドの最大数です。

#### `thrift_backlog_num` {#thrift_backlog_num}

デフォルト：1024

Thrift サーバーの backlog_num です。この値を増やす場合は、Linux の /proc/sys/net/core/somaxconn の設定値より大きくなるようにしてください。

#### `thrift_client_timeout_ms` {#thrift_client_timeout_ms}

デフォルト：0

Thrift サーバーの接続タイムアウトとソケットタイムアウトの設定です。

読み取りタイムアウトを防ぐため、thrift_client_timeout_ms はゼロに設定されています。

#### `thrift_max_message_size` {#thrift_max_message_size}

デフォルト：100MB

Thrift サーバーが受信するメッセージの最大サイズをバイト単位で指定します。クライアントが送るメッセージがこの制限を超えると、Thrift サーバーは要求を拒否して接続を閉じます。その結果、クライアントには「connection has been closed by peer.」というエラーが表示されます。この場合は、この値を増やしてみてください。

#### `use_compact_thrift_rpc` {#use_compact_thrift_rpc}

デフォルト：true

クエリプラン構造の送信に圧縮形式を使うかどうかを指定します。有効にすると、クエリプラン構造のサイズを約 50% 減らし、一部の「send fragment timeout」エラーを回避できます。
ただし、並列度の高い小規模クエリでは、同時実行性能が約 10% 低下する場合があります。

#### `grpc_max_message_size_bytes` {#grpc_max_message_size_bytes}

デフォルト：1G

GRPC クライアントチャネルの初期フローウィンドウサイズと、メッセージの最大サイズを設定します。結果セットが大きい場合は、この値を増やす必要があります。

#### `max_mysql_service_task_threads_num` {#max_mysql_service_task_threads_num}

デフォルト：4096

Task イベントを処理するスレッド数です。

#### `mysql_service_io_threads_num` {#mysql_service_io_threads_num}

デフォルト：4

FE が NIO モデルに基づく MySQL サーバーを起動する際に、IO イベントを処理するスレッド数です。

#### `mysql_nio_backlog_num` {#mysql_nio_backlog_num}

デフォルト：1024

MySQL NIO サーバーの backlog_num です。この値を増やす場合は、Linux の /proc/sys/net/core/somaxconn ファイルの値も同時に増やしてください。

#### `broker_timeout_ms` {#broker_timeout_ms}

デフォルト：10000（10s）

broker RPC のデフォルトタイムアウトです。

#### `backend_rpc_timeout_ms` {#backend_rpc_timeout_ms}

FE から BE への RPC 要求のタイムアウトをミリ秒単位で指定します。

デフォルト：60000

動的設定：不可

Master FE ノード固有：はい

#### `drop_backend_after_decommission` {#drop_backend_after_decommission}

デフォルト：false

IsMutable：true

MasterOnly：true

1. BE の decommission が成功した後、システムがその BE を削除するかどうかを制御します。true の場合は、BE が正常にオフラインになるとノードを削除します。false の場合は、BE が正常にオフラインになっても DECOMMISSION 状態のまま保持し、削除しません。

   この設定は特定の場面で役立ちます。たとえば、Doris クラスターの初期状態で各 BE ノードにディスクが 1 台ずつあり、運用後に各 BE ノードへ新しいディスクを 2 台追加したとします。現在、Doris は BE 内のディスク間でのデータ均衡化に対応していないため、元のディスクのデータ量が新しいディスクより常に多くなる場合があります。その場合、次の操作でディスク間の均衡化を手動で行えます。

   1. この設定項目を false にします。
   2. 対象の BE ノードを decommission します。これにより、その BE の全データがほかのノードに移行されます。
   3. decommission が完了しても BE は削除されません。この時点で BE の decommission 状態を解除します。すると、ほかの BE ノードからデータが戻り始め、その BE の全ディスクに均等に分散されます。
   4. すべての BE ノードで手順 2 と 3 を順に実行し、全ノードのディスクを均衡化します。

#### `max_backend_down_time_second` {#max_backend_down_time_second}

デフォルト：3600（1 時間）

IsMutable：true

MasterOnly：true

backend が *max_backend_down_time_second* の間停止していると、BACKEND_DOWN イベントが発生します。

#### `disable_backend_black_list` {#disable_backend_black_list}

BE のブラックリスト機能を無効にします。無効にすると、BE へのクエリ要求が失敗しても、その BE はブラックリストに追加されません。
このパラメータは回帰テスト環境で、偶発的な問題によって多数のテストが失敗するのを減らす場合に適しています。

デフォルト：false

動的設定：可能

Master FE ノード固有：いいえ

#### `max_backend_heartbeat_failure_tolerance_count` {#max_backend_heartbeat_failure_tolerance_count}

BE ノードのハートビート失敗を許容する最大回数です。連続した失敗回数がこの値を超えると、BE の状態が dead になります。
このパラメータは回帰テスト環境で、偶発的なハートビート失敗によって多数のテストが失敗するのを減らす場合に適しています。

デフォルト：1

動的設定：可能

Master FE ノード固有：はい

### `abort_txn_after_lost_heartbeat_time_second` {#abort_txn_after_lost_heartbeat_time_second}

ハートビートを失ってからトランザクションを中止するまでの時間です。デフォルトの 300 は、ハートビート喪失後 300s で BE のトランザクションを中止することを意味します。

デフォルト：300(s)

動的設定：可能

Master FE ノード固有：はい

#### `enable_access_file_without_broker` {#enable_access_file_without_broker}

デフォルト：false

IsMutable：true

MasterOnly：true

broker 経由で BOS などのクラウドストレージにアクセスする際、broker を経由せずにアクセスするための設定です。

#### `agent_task_resend_wait_time_ms` {#agent_task_resend_wait_time_ms}

デフォルト：5000

IsMutable：true

MasterOnly：true

agent_task の create_time が設定されている場合に、タスクを再送するかどうかを決めます。ReportHandler が agent task を再送できるのは、current_time - create_time > agent_task_resend_wait_time_ms の場合だけです。

現在、この設定は主に `PUBLISH_VERSION` agent task の重複送信を解決するために使用します。デフォルト値の 5000 は実験的な値です。

agent task を AgentTaskQueue に投入してから BE に送信するまでには時間差があるため、この値を増やすと重複送信を効果的に抑えられます。

一方で、送信または実行に失敗した agent task の再実行までの時間が長くなります。

#### `max_agent_task_threads_num` {#max_agent_task_threads_num}

デフォルト：4096

MasterOnly：true

agent task のスレッドプールでタスクを処理するスレッドの最大数です。

#### `remote_fragment_exec_timeout_ms` {#remote_fragment_exec_timeout_ms}

デフォルト：30000（ms）

IsMutable：true

非同期のリモート fragment 実行のタイムアウトです。通常、この実行は短時間で終わります。システム負荷が高い場合はタイムアウトを長くしてみてください。

#### `auth_token` {#auth_token}

デフォルト：empty

内部認証に使用するクラスタートークンです。

#### `enable_http_server_v2` {#enable_http_server_v2}

デフォルト：正式版 0.14.0 のリリース以降は true、それ以前は false

HTTP Server V2 は SpringBoot で実装されており、フロントエンドとバックエンドを分離した構成を採用しています。新しいフロントエンド UI を使用するには HTTPv2 を有効にする必要があります。

#### `http_api_extra_base_path` {#http_api_extra_base_path}

デプロイ環境によっては、HTTP API 共通のプレフィックスとして追加のベースパスを指定する必要があります。このパラメータでそのプレフィックスを指定します。
設定後、`GET /api/basepath` インターフェースで値を取得できます。新しい UI も最初にこのベースパスを取得し、URL の組み立てに使用します。`enable_http_server_v2` が true の場合のみ有効です。

デフォルトは空、つまり未設定です。

#### `jetty_server_acceptors` {#jetty_server_acceptors}

デフォルト：2

#### `jetty_server_selectors` {#jetty_server_selectors}

デフォルト：4

#### `jetty_server_workers` {#jetty_server_workers}

デフォルト：0

上記の 3 つのパラメータに対応する Jetty のスレッド構成は、acceptors、selectors、workers の 3 つのスレッドプールに分かれます。acceptors が新しい接続を受け付け、selectors が HTTP メッセージの解析を処理し、最後に workers が要求を処理します。最初の 2 つは非ブロッキングモデルを使用し、1 つのスレッドで多数のソケットの読み書きを処理できるため、必要なスレッド数は少なくなります。

ほとんどのプロジェクトでは、acceptors は 1～2 スレッド、selectors は 2～4 スレッドで十分です。workers はブロッキングするビジネスロジックを実行し、データベース操作が多いこともあるため、多数のスレッドが必要です。適切な数はアプリケーションの QPS と IO イベントの割合によって異なります。QPS が高いほど、また IO の割合が高く待機するスレッドが増えるほど、必要な総スレッド数も増えます。

worker スレッドプールはデフォルトでは設定されません。必要に応じて設定してください。

#### `jetty_server_max_http_post_size` {#jetty_server_max_http_post_size}

デフォルト：`100 * 1024 * 1024`（100MB）

put または post メソッドでアップロードするファイルの最大バイト数です。デフォルトは 100MB です。

#### `jetty_server_max_http_header_size` {#jetty_server_max_http_header_size}

デフォルト：1048576（1M）

HTTP ヘッダーサイズの設定で、デフォルトは 1M です。

#### `http_sql_submitter_max_worker_threads` {#http_sql_submitter_max_worker_threads}

デフォルト：2

HTTP SQL submitter のワーカースレッドの最大数です。

#### `http_load_submitter_max_worker_threads` {#http_load_submitter_max_worker_threads}

デフォルト：2

HTTP アップロード submitter のワーカースレッドの最大数です。

:::caution 動作変更（4.1.4）

バージョン 4.1.4 で `/api/upload` エンドポイントが削除され、この設定項目も削除されました。[Upload Action](../open-api/fe-http/upload-action) を参照してください。

:::

### クエリエンジン {#query-engine}

#### `default_max_query_instances` {#default_max_query_instances}

ユーザープロパティ max_query_instances が 0 以下の場合に使用するデフォルト値です。ユーザーごとのインスタンスの最大数を制限します。このパラメータが 0 以下の場合は無制限です。

デフォルト値は -1 です。

#### `max_query_retry_time` {#max_query_retry_time}

デフォルト：3

IsMutable：true

クエリの再試行回数です。RPC 例外が発生し、まだ結果をユーザーに送信していない場合は再試行されることがあります。雪崩的な障害を避けるには、この値を減らしてください。

#### `max_dynamic_partition_num` {#max_dynamic_partition_num}

デフォルト：500

IsMutable：true

MasterOnly：true

動的パーティションテーブルの作成時に、一度に作成されるパーティションが多すぎないよう最大数を制限します。この数は動的パーティションのパラメータ「start」と「end」で決まります。

#### `dynamic_partition_enable` {#dynamic_partition_enable}

デフォルト：true

IsMutable：true

MasterOnly：true

動的パーティションスケジューラーを有効にするかどうかを指定します。デフォルトで有効です。

#### `dynamic_partition_check_interval_seconds` {#dynamic_partition_check_interval_seconds}

デフォルト：600（s）

IsMutable：true

MasterOnly：true

動的パーティションを確認する間隔を指定します。

#### `max_multi_partition_num` {#max_multi_partition_num}

デフォルト：4096

IsMutable：true

MasterOnly：true

マルチパーティションのパーティション名プレフィックスを設定します。動的パーティションには適用されません。デフォルトのプレフィックスは「p_」です。

#### `multi_partition_name_prefix` {#multi_partition_name_prefix}

デフォルト：p_

IsMutable：true

MasterOnly：true

マルチパーティションのパーティション名プレフィックスを設定します。動的パーティションには適用されません。デフォルトのプレフィックスは「p_」です。

#### `partition_in_memory_update_interval_secs` {#partition_in_memory_update_interval_secs}

デフォルト：300（s）

IsMutable：true

MasterOnly：true

メモリ内のグローバルなパーティション情報を更新する間隔です。

#### `enable_concurrent_update` {#enable_concurrent_update}

デフォルト：false

IsMutable：false

MasterOnly：true

並列更新を有効にするかどうかを指定します。

#### `lower_case_table_names` {#lower_case_table_names}

デフォルト：0

IsMutable：false

MasterOnly：true

この設定はクラスターの初期化時にのみ指定でき、初期化完了後のクラスター再起動やアップグレード時には変更できません。

0：テーブル名を指定どおりに保存し、大文字と小文字を区別して比較します。
1：テーブル名を小文字で保存し、大文字と小文字を区別せずに比較します。
2：テーブル名を指定どおりに保存し、小文字として比較します。

#### `table_name_length_limit` {#table_name_length_limit}

デフォルト：64

IsMutable：true

MasterOnly：true

テーブル名の最大長を制御します。

#### `cache_enable_sql_mode` {#cache_enable_sql_mode}

デフォルト：true

IsMutable：true

MasterOnly：false

有効にすると、SQL クエリの結果セットがキャッシュされます。クエリに含まれるすべてのテーブルの全パーティションで、前回のバージョン更新からの経過時間が cache_last_version_interval_second より長く、結果セットの行数が cache_result_max_row_count 未満で、データサイズが cache_result_max_data_size 未満であれば、結果セットをキャッシュします。次に同じ SQL を実行するとキャッシュが使用されます。

true にすると、FE は SQL 結果のキャッシュを有効にします。オフラインでデータを更新する場面に適しています。

|                        | case1 | case2 | case3 | case4 |
| ---------------------- | ----- | ----- | ----- | ----- |
| enable_sql_cache       | false | true  | true  | false |
| enable_partition_cache | false | false | true  | true  |

#### `cache_enable_partition_mode` {#cache_enable_partition_mode}

デフォルト：true

IsMutable：true

MasterOnly：false

true にすると、FE は BE のキャッシュからデータを取得します。一部のパーティションをリアルタイムに更新する場面に適しています。

#### `cache_result_max_row_count` {#cache_result_max_row_count}

デフォルト：3000

IsMutable：true

MasterOnly：false

メモリの過剰使用を防ぐため、キャッシュできる最大行数のデフォルトは 3000 です。このしきい値を超える結果はキャッシュされません。

#### `cache_result_max_data_size` {#cache_result_max_data_size}

デフォルト：31457280

IsMutable：true

MasterOnly：false

メモリの過剰使用を防ぐため、キャッシュできる行データの最大サイズのデフォルトは 10MB です。このしきい値を超える結果はキャッシュされません。

#### `cache_last_version_interval_second` {#cache_last_version_interval_second}

デフォルト：30

IsMutable：true

MasterOnly：false

テーブルの最新パーティションバージョンの時間間隔とは、データ更新から現在のバージョンまでの経過時間です。通常は 900 秒に設定し、オフラインのインポートとリアルタイムのインポートを区別します。

#### `max_allowed_in_element_num_of_delete` {#max_allowed_in_element_num_of_delete}

デフォルト：1024

IsMutable：true

MasterOnly：true

DELETE 文の InPredicate に含められる要素数を制限します。

#### `max_running_rollup_job_num_per_table` {#max_running_rollup_job_num_per_table}

デフォルト：1

IsMutable：true

MasterOnly：true

Rollup ジョブの同時実行数の上限を制御します。

#### `max_distribution_pruner_recursion_depth` {#max_distribution_pruner_recursion_depth}

デフォルト：100

IsMutable：true

MasterOnly：false

ハッシュ分散 pruner の最大再帰深度を制限します。
例：where a in (5 elements) and b in (4 elements) and c in (3 elements) and d in (2 elements)。
a/b/c/d が分散列である場合、再帰深度は 5 *4* 3 * 2 = 120 となり、100 を超えます。
そのため分散 pruner は動作せず、すべての bucket を返します。
深度を増やせば、より多くの要素に対して分散 pruning を適用できますが、CPU 使用量が増える可能性があります。

#### `enable_local_replica_selection` {#enable_local_replica_selection}

デフォルト：false

IsMutable：true

true にすると、Planner はこの Frontend と同じホストにある tablet のレプリカを選択しようとします。
次の条件ではネットワーク転送を減らせる可能性があります。

* N 台のホストに N 台の Backend と N 台の Frontend がデプロイされている。

* データに N 個のレプリカがある。

* 並列度の高いクエリがすべての Frontend に均等に送られる。

この場合、すべての Frontend はローカルレプリカだけでクエリを実行できます。ローカルレプリカが利用できないときに非ローカルレプリカへ切り替えるには、enable_local_replica_selection_fallback を true に設定します。

#### `enable_local_replica_selection_fallback` {#enable_local_replica_selection_fallback}

デフォルト：false

IsMutable：true

enable_local_replica_selection と併用します。ローカルレプリカが使用できない場合、非ローカルレプリカに切り替えます。

#### `expr_depth_limit` {#expr_depth_limit}

デフォルト：3000

IsMutable：true

式ツリーの深さの上限です。この上限を超えると、データベースの読み取りロックを保持したまま解析に長時間かかる可能性があります。影響を理解していない場合は変更しないでください。

#### `expr_children_limit` {#expr_children_limit}

デフォルト：10000

IsMutable：true

式ツリー内の子式の数の上限です。この上限を超えると、データベースの読み取りロックを保持したまま解析に長時間かかる可能性があります。

#### `be_exec_version` {#be_exec_version}

fragment 間で block を受け渡す際のシリアライズ形式を定義します。

コードの変更によって block のデータ形式が変わることがあります。ローリングアップグレード中に BE 間の互換性を維持するため、FE からデータバージョンを通知し、送信形式を決定します。

たとえば、クラスターに 2 台の BE があり、アップグレード済みの 1 台は最新の $v_1$ に対応し、もう 1 台は $v_0$ のみに対応するとします。この時点では FE がまだアップグレードされていないため、一律に $v_0 が通知されます。$、BE 間では旧形式のデータをやり取りします。すべての BE をアップグレードした後に FE をアップグレードすると、新しい FE は $v_1$ を通知し、クラスター全体が新しいデータ形式に切り替わります。

デフォルト値は `max_be_exec_version` です。特別な必要があれば形式のバージョンを手動で下げられますが、`min_be_exec_version` より低くしてはいけません。

この変数の値は、すべての BE について常に `BeExecVersionManager::min_be_exec_version` と `BeExecVersionManager::max_be_exec_version` の間に保ってください。つまり、更新済みクラスターをダウングレードする場合は FE、BE の順にダウングレードするか、設定でこの変数を手動で下げてから BE をダウングレードします。

#### `max_be_exec_version` {#max_be_exec_version}

現在サポートされる最新のデータバージョンです。変更できず、対応するバージョンの BE にある `BeExecVersionManager::max_be_exec_version` と一致する必要があります。

#### `min_be_exec_version` {#min_be_exec_version}

現在サポートされる最も古いデータバージョンです。変更できず、対応するバージョンの BE にある `BeExecVersionManager::min_be_exec_version` と一致する必要があります。

#### `max_query_profile_num` {#max_query_profile_num}

クエリプロファイルの最大数です。

デフォルト：100

動的設定：可能

Master FE ノード固有：いいえ

#### `publish_version_interval_ms` {#publish_version_interval_ms}

デフォルト：10（ms）

2 回の publish version 操作の最小間隔です。

#### `publish_version_timeout_second` {#publish_version_timeout_second}

デフォルト：30（s）

IsMutable：true

MasterOnly：true

1 つのトランザクションに属するすべての publish version タスクの完了を待つ最大時間です。

#### `query_colocate_join_memory_limit_penalty_factor` {#query_colocate_join_memory_limit_penalty_factor}

デフォルト：1

IsMutable：true

Colocate join の PlanFragment インスタンスの memory_limit = exec_mem_limit / min (query_colocate_join_memory_limit_penalty_factor, instance_num) です。

#### `rewrite_count_distinct_to_bitmap_hll` {#rewrite_count_distinct_to_bitmap_hll}

デフォルト：true

この変数はセッション変数で、セッション単位で有効になります。

* 型：boolean
* 説明：**AGG モデルのテーブルにのみ適用されます**。true の場合、ユーザーのクエリに count(distinct c1) などの集約関数があり、c1 列の型が bitmap であれば count distinct は bitmap_union_count(c1) に書き換えられます。c1 列の型が hll であれば hll_union_agg(c1) に書き換えられます。false の場合は書き換えられません。

### データロードとエクスポート {#load-and-export}

#### `streaming_cdc_fetch_splits_batch_size` {#streaming_cdc_fetch_splits_batch_size}

デフォルト：16（4.1.5 より前は 100）

動的設定：可能

Master FE ノード固有：はい

Streaming CDC 要求ごとに取得する split の数です。バージョン 4.1.5 では、各要求のサイズを小さくするため、デフォルトが 100 から 16 に引き下げられました。

#### `max_export_history_job_num` {#max_export_history_job_num}

デフォルト：1000

動的設定：可能

Master FE ノード固有：はい

EXPORT ジョブ履歴のクリーンアップしきい値です。バージョン 4.1.5 以降、クリーンアップでは `FINISHED` / `CANCELLED` のジョブだけを削除し、実行中のジョブは保持します。そのため、アクティブなジョブがあると総レコード数がこの値を超える場合があります。

#### `enable_pipeline_load` {#enable_pipeline_load}

デフォルト値：true

IsMutable：true

Streamload などのインポートタスクの実行に Pipeline エンジンを使用するかどうかを指定します。

#### `enable_vectorized_load` {#enable_vectorized_load}

デフォルト：true

ベクトル化されたデータロードを有効にするかどうかを指定します。

#### `enable_new_load_scan_node` {#enable_new_load_scan_node}

デフォルト：true

ファイルスキャンノードを有効にするかどうかを指定します。

#### `default_max_filter_ratio` {#default_max_filter_ratio}

デフォルト：0

IsMutable：true

MasterOnly：true

データの形式が不正などの理由で除外してよいデータの最大割合です。デフォルトは 0 です。

#### `max_running_txn_num_per_db` {#max_running_txn_num_per_db}

デフォルト：1000

IsMutable：true

MasterOnly：true

同じデータベースで同時に実行できるデータロードジョブの数を制御します。

クラスター内で実行中のデータロードジョブが多すぎる場合、新たに送信したジョブで次のエラーが発生することがあります。

```text
current running txns on db xxx is xx, larger than limit xx
```

このエラーは、現在クラスターで実行中のデータロードジョブ数が設定値を超えていることを示します。この場合は、アプリケーション側で待機してからジョブを再試行することを推奨します。

Connector を使用する場合は、この値を適切に増やせます。数千に設定しても問題ありません。

#### `using_old_load_usage_pattern` {#using_old_load_usage_pattern}

デフォルト：false

IsMutable：true

MasterOnly：true

true にすると、処理エラーが発生した insert 文でもユーザーにラベルを返します。ユーザーはそのラベルでデータロードジョブの状態を確認できます。デフォルトの false では、insert 操作でエラーが発生すると、ラベルを返さずに例外をクライアントへ直接送ります。

#### `disable_load_job` {#disable_load_job}

デフォルト：false

IsMutable：true

MasterOnly：true

true に設定すると、次のようになります。

* 保留中のすべてのデータロードジョブは begin txn API の呼び出し時に失敗します。
* prepare 状態のすべてのデータロードジョブは commit txn API の呼び出し時に失敗します。
* commit 済みのすべてのデータロードジョブは publish を待ちます。

#### `commit_timeout_second` {#commit_timeout_second}

デフォルト：30

IsMutable：true

MasterOnly：true

1 つのトランザクションの前に挿入されたすべてのデータが commit されるまで待つ最大時間です。
コマンド「commit」のタイムアウトを秒単位で指定します。

#### `max_unfinished_load_job` {#max_unfinished_load_job}

デフォルト：1000

IsMutable：true

MasterOnly：true

PENDING、ETL、LOADING、QUORUM_FINISHED 状態を含むデータロードジョブの最大数です。この数を超えると、新しいジョブを送信できません。

#### `db_used_data_quota_update_interval_secs` {#db_used_data_quota_update_interval_secs}

デフォルト：300（s）

IsMutable：true

MasterOnly：true

Master のデーモンスレッドが `db_used_data_quota_update_interval_secs` ごとに、db txn manager が保持するデータベースの使用済みデータクォータを更新します。

データロードの性能を高めるため、ロード前にデータベースの使用量がクォータを超えているか確認する際は、使用量をリアルタイムには計算せず、デーモンスレッドが定期的に更新した値を取得します。

この設定は、データベースの使用済みデータ量を更新する間隔を指定します。

#### `disable_show_stream_load` {#disable_show_stream_load}

デフォルト：false

IsMutable：true

MasterOnly：true

show stream load を無効にし、メモリ内の stream load レコードを消去するかどうかを指定します。

#### `max_stream_load_record_size` {#max_stream_load_record_size}

デフォルト：5000

IsMutable：true

MasterOnly：true

メモリに保持できる最近の stream load レコードのデフォルトの最大数です。

#### `fetch_stream_load_record_interval_second` {#fetch_stream_load_record_interval_second}

デフォルト：120

IsMutable：true

MasterOnly：true

stream load レコードを取得する間隔です。

#### `max_bytes_per_broker_scanner` {#max_bytes_per_broker_scanner}

デフォルト：`500 * 1024 * 1024 * 1024L`（500G）

IsMutable：true

MasterOnly：true

1 つの broker load ジョブで broker scanner が処理できる最大バイト数です。通常、各 Backend に broker scanner が 1 つあります。

#### `default_load_parallelism` {#default_load_parallelism}

デフォルト：8

IsMutable：true

MasterOnly：true

単一ノードでの broker load 実行プランのデフォルト並列度です。
broker load の送信時にユーザーが並列度を指定した場合、このパラメータは無視されます。
このパラメータは `max broker concurrency` や `min bytes per broker scanner` などの設定とともに、インポートタスクの同時実行数を決定します。

#### `max_broker_concurrency` {#max_broker_concurrency}

デフォルト：10

IsMutable：true

MasterOnly：true

broker scanner の最大同時実行数です。

#### `min_bytes_per_broker_scanner` {#min_bytes_per_broker_scanner}

デフォルト：67108864L（64M）

IsMutable：true

MasterOnly：true

単一の broker scanner が読み取る最小バイト数です。

#### `period_of_auto_resume_min` {#period_of_auto_resume_min}

デフォルト：5（s）

IsMutable：true

MasterOnly：true

Routine Load の自動再開間隔です。

#### `max_tolerable_backend_down_num` {#max_tolerable_backend_down_num}

デフォルト：0

IsMutable：true

MasterOnly：true

BE が 1 台でも停止していると、Routine Load は自動的に再開できません。

#### `max_routine_load_task_num_per_be` {#max_routine_load_task_num_per_be}

デフォルト：5

IsMutable：true

MasterOnly：true

BE ごとに同時実行できる routine load タスクの最大数です。BE に送信する routine load タスクの数を制限します。また、BE 側のタスクスレッドプールサイズを表す設定 `routine_load_thread_pool_size`（デフォルト 10）より小さくする必要があります。

#### `max_routine_load_task_concurrent_num` {#max_routine_load_task_concurrent_num}

デフォルト：5

IsMutable：true

MasterOnly：true

単一の routine load ジョブで同時実行できるタスクの最大数です。

#### `max_routine_load_job_num` {#max_routine_load_job_num}

デフォルト：100

NEED_SCHEDULED、RUNNING、PAUSE を含む routine load ジョブの最大数です。

#### `desired_max_waiting_jobs` {#desired_max_waiting_jobs}

デフォルト：100

IsMutable：true

MasterOnly：true

routine load とバージョン 2 の load で待機するジョブ数の目標値です。Master の切り替え時など、状況によっては実際の数が desired_max_waiting_jobs を超えることがあります。

#### `disable_hadoop_load` {#disable_hadoop_load}

デフォルト：false

IsMutable：true

MasterOnly：true

Hadoop クラスターを使ったデータロードは将来非推奨になります。この種類のロードを無効にするには true に設定します。

#### `enable_spark_load` {#enable_spark_load}

デフォルト：false

IsMutable：true

MasterOnly：true

spark load を一時的に有効にするかどうかを指定します。デフォルトでは無効です。

**注意：** このパラメータはバージョン 1.2 で削除され、spark_load はデフォルトで有効になりました。

#### `spark_load_checker_interval_second` {#spark_load_checker_interval_second}

デフォルト：60

Spark load スケジューラーの実行間隔です。デフォルトは 60 秒です。

#### `async_loading_load_task_pool_size` {#async_loading_load_task_pool_size}

デフォルト：10

IsMutable：false

MasterOnly：true

loading_load タスクの実行プールのサイズです。同時に実行できる loading_load タスクの最大数を制限します。

現在は broker load の loading_load タスクのみを制限します。

#### `async_pending_load_task_pool_size` {#async_pending_load_task_pool_size}

デフォルト：10

IsMutable：false

MasterOnly：true

pending_load タスクの実行プールのサイズです。同時に実行できる pending_load タスクの最大数を制限します。

現在は broker load と spark load の pending_load タスクのみを制限します。

`max_running_txn_num_per_db` より小さくする必要があります。

#### `async_load_task_pool_size` {#async_load_task_pool_size}

デフォルト：10

IsMutable：false

MasterOnly：true

旧バージョンとの互換性のためだけに残されている設定です。async_loading_load_task_pool_size に置き換えられており、将来削除されます。

#### `enable_single_replica_load` {#enable_single_replica_load}

デフォルト：false

IsMutable：true

MasterOnly：true

stream load と broker load で単一レプリカへの書き込みを有効にするかどうかを指定します。

#### `min_load_timeout_second` {#min_load_timeout_second}

デフォルト：1（1s）

IsMutable：true

MasterOnly：true

すべての種類のデータロードに適用する最小の stream load タイムアウトです。

#### `max_stream_load_timeout_second` {#max_stream_load_timeout_second}

デフォルト：259200（3 日）

IsMutable：true

MasterOnly：true

stream load のタイムアウト設定の上限を制限します。ユーザーが大きなタイムアウトを設定したために、失敗した stream load トランザクションを短時間でキャンセルできなくなることを防ぎます。

#### `max_load_timeout_second` {#max_load_timeout_second}

デフォルト：259200（3 日）

IsMutable：true

MasterOnly：true

stream load を除くすべての種類のデータロードに適用する最大タイムアウトです。

#### `stream_load_default_timeout_second` {#stream_load_default_timeout_second}

デフォルト：86400 * 3（3 日）

IsMutable：true

MasterOnly：true

stream load と streaming mini load のデフォルトタイムアウトです。

#### `stream_load_default_precommit_timeout_second` {#stream_load_default_precommit_timeout_second}

デフォルト：3600（s）

IsMutable：true

MasterOnly：true

stream load の precommit のデフォルトタイムアウトです。

#### `stream_load_default_memtable_on_sink_node` {#stream_load_default_memtable_on_sink_node}

デフォルト：false

IsMutable：true

MasterOnly：true

HTTP ヘッダー `memtable_on_sink_node` が設定されていない場合、stream load で sink node 上の memtable をデフォルトで有効にします。

#### `insert_load_default_timeout_second` {#insert_load_default_timeout_second}

デフォルト：3600（1 時間）

IsMutable：true

MasterOnly：true

insert load のデフォルトタイムアウトです。

#### `mini_load_default_timeout_second` {#mini_load_default_timeout_second}

デフォルト：3600（1 時間）

IsMutable：true

MasterOnly：true

非ストリーミング mini load のデフォルトタイムアウトです。

#### `broker_load_default_timeout_second` {#broker_load_default_timeout_second}

デフォルト：14400（4 時間）

IsMutable：true

MasterOnly：true

broker load のデフォルトタイムアウトです。

#### `spark_load_default_timeout_second` {#spark_load_default_timeout_second}

デフォルト：86400（1 日）

IsMutable：true

MasterOnly：true

spark load のデフォルトタイムアウトです。

#### `hadoop_load_default_timeout_second` {#hadoop_load_default_timeout_second}

デフォルト：86400 * 3（3 日）

IsMutable：true

MasterOnly：true

hadoop load のデフォルトタイムアウトです。

#### `load_running_job_num_limit` {#load_running_job_num_limit}

デフォルト：0

IsMutable：true

MasterOnly：true

実行中のデータロードタスク数の上限です。デフォルトの 0 は無制限です。

#### `load_input_size_limit_gb` {#load_input_size_limit_gb}

デフォルト：0

IsMutable：true

MasterOnly：true

Load ジョブに入力するデータサイズの上限です。デフォルトの 0 は無制限です。

#### `load_etl_thread_num_normal_priority` {#load_etl_thread_num_normal_priority}

デフォルト：10

NORMAL 優先度の ETL データロードジョブの同時実行数です。影響を理解していない場合は変更しないでください。

#### `load_etl_thread_num_high_priority` {#load_etl_thread_num_high_priority}

デフォルト：3

HIGH 優先度の ETL データロードジョブの同時実行数です。影響を理解していない場合は変更しないでください。

#### `load_pending_thread_num_normal_priority` {#load_pending_thread_num_normal_priority}

デフォルト：10

NORMAL 優先度の保留中のデータロードジョブの同時実行数です。影響を理解していない場合は変更しないでください。

#### `load_pending_thread_num_high_priority` {#load_pending_thread_num_high_priority}

デフォルト：3

HIGH 優先度の保留中のデータロードジョブの同時実行数です。データロードジョブの優先度は HIGH または NORMAL です。mini batch load ジョブはすべて HIGH、それ以外は NORMAL です。優先度は、遅いジョブが長時間スレッドを占有するのを防ぐために設定されます。これは内部のスケジューリング最適化ポリシーです。現在、ジョブの優先度を手動で指定することはできません。影響を理解していない場合は変更しないでください。

#### `load_checker_interval_second` {#load_checker_interval_second}

デフォルト：5（s）

データロードスケジューラーの実行間隔です。データロードジョブの状態は PENDING、LOADING、FINISHED の順に変わります。スケジューラーが PENDING から LOADING に変更し、トランザクションのコールバックが LOADING から FINISHED に変更します。そのため、同時実行数が上限に達していなければ、ジョブの完了に要する追加時間は最大で 1 間隔です。

#### `s3_load_endpoint_white_list` {#s3_load_endpoint_white_list}

デフォルト：empty

動的設定：不可

S3 Load が使用できるエンドポイントの許可リストです。複数の値は `s3_load_endpoint_white_list=a,b,c` のようにコンマで区切ります。空の値は許可リストが設定されていないことを意味します。

:::caution 動作変更（4.1.4）

セキュリティ上の理由により、バージョン 4.1.4 以降、この設定項目は **動的に変更できません**。`fe.conf` にのみ設定でき、FE の再起動後に有効になります。`ADMIN SET FRONTEND CONFIG` では変更できません。

:::

#### `resource_group_load_success_quorum` {#resource_group_load_success_quorum}

デフォルト：empty

動的設定：可能

Master FE ノード固有：はい

バージョン 4.1.4 で追加されました。データロードのトランザクションを commit する際、リソースグループ（BE の Location Tag）ごとに **書き込みが成功している必要があるレプリカの最小数** を設定します。

値はコンマ区切りのリストで、各項目の形式は `<resource_group>:<min_success_replicas>` です。`<min_success_replicas>` は負でない整数です。例：

```properties
resource_group_load_success_quorum=group_a:2,group_b:1
```

commit 時に、設定されたリソースグループで書き込みに成功したレプリカ数が設定値より少なければ、トランザクションの commit は失敗します。設定にないリソースグループは確認しません。形式が不正な項目は無視され、`fe.log` に警告が出力されます。

複数のデータセンターや可用性ゾーンにまたがるデプロイで、指定したデータセンター内の所定数のレプリカに書き込まれてからデータロードを成功とみなすために使用します。

#### `enable_adaptive_random_bucket_load` {#enable_adaptive_random_bucket_load}

デフォルト：true

動的設定：可能

Master FE ノード固有：はい

バージョン 4.1.4 で追加されました。適応型ランダム bucket load を有効にするかどうかを指定します。

有効にすると、FE は tablet の配置情報を BE に送信し、各 BE はプライマリレプリカを持つローカル bucket の集合を特定します。単一の tablet に書き込んだデータ量がしきい値（デフォルトで 200 MB）を超えると、書き込み先をローカル bucket 間で切り替えます。これにより、ランダム bucket 分散（`DISTRIBUTED BY RANDOM`）テーブルへのデータロード時のメモリ負荷を下げ、スループットを高めます。すべてのロード方式に適用されます。

この機能には、BE の設定 `enable_table_memtable_flush_backpressure` と `table_memtable_flush_pending_count_limit` による制約もあります。[BE 設定](./be-config) を参照してください。

#### `enable_forward_group_commit_stream_load_to_follower` {#enable_forward_group_commit_stream_load_to_follower}

デフォルト：false

動的設定：可能

Master FE ノード固有：はい

バージョン 4.1.4 で追加されました。Group Commit を使用する Stream Load 要求を Follower FE に転送するかどうかを指定します。

有効にすると、Group Commit モードの Stream Load 要求が Follower FE にラウンドロビンで転送され、バッチ処理の負荷が複数の FE に分散されます。

対象テーブルの `light_schema_change` プロパティが `false` の場合、転送はサポートされず、要求はエラーになります。

#### `streaming_job_snapshot_offset_persist_interval_sec` {#streaming_job_snapshot_offset_persist_interval_sec}

デフォルト：300（s）

動的設定：可能

Master FE ノード固有：はい

バージョン 4.1.4 で追加されました。Streaming Job（継続的なデータロードジョブ）のフルスナップショット段階で、offset を永続化する間隔の最小値を秒単位で指定します。値を小さくすると、ジョブ再起動後に再生が必要なデータ量は減りますが、メタデータの書き込み頻度は増えます。

#### `label_keep_max_second` {#label_keep_max_second}

デフォルト：`3 * 24 * 3600`（3 日）

IsMutable：true

MasterOnly：true

完了またはキャンセルされたデータロードジョブのラベルは、`label_keep_max_second` の経過後に削除されます。

1. 削除されたラベルは再利用できます。
2. 保持時間を短くすると、FE のメモリ使用量を減らせます。削除されるまで、すべてのデータロードジョブの情報がメモリに保持されるためです。

書き込みの同時実行数が高く、ジョブの滞留が多い状態で frontend サービスの呼び出しに失敗する場合は、ログを確認してください。メタデータの書き込みでロックの保持時間が長すぎる場合は、この値を 12 時間または 6 時間以下に調整できます。

#### `streaming_label_keep_max_second` {#streaming_label_keep_max_second}

デフォルト：43200（12 時間）

IsMutable：true

MasterOnly：true

INSERT、STREAMING LOAD、ROUTINE_LOAD_TASK などの高頻度のデータロード処理で、保持期限が切れた完了済みジョブやタスクを削除します。

#### `label_clean_interval_second` {#label_clean_interval_second}

デフォルト：1 * 3600（1 時間）

データロードラベルのクリーナーは *label_clean_interval_second* ごとに実行され、期限切れのジョブを削除します。

#### `label_regex_length` {#label_regex_length}

デフォルト値：128（文字）

データロードラベルの最大文字数です。デフォルトは 128 文字です。

#### `transaction_clean_interval_second` {#transaction_clean_interval_second}

デフォルト：30

トランザクションが可視または中止済みの場合、transaction_clean_interval_second 秒後にクリーンアップされます。この間隔はできるだけ短くし、各クリーンアップ処理も速やかに終える必要があります。

#### `sync_commit_interval_second` {#sync_commit_interval_second}

トランザクションを commit するまでの最大時間間隔です。この時間を過ぎてもチャネルに未送信のデータがある場合、consumer はチャネルにトランザクションの送信を通知します。

デフォルト：10（秒）

動的設定：可能

Master FE ノード固有：はい

#### `sync_checker_interval_second` {#sync_checker_interval_second}

データ同期ジョブの実行状態を確認する間隔です。

デフォルト：10（s）

#### `max_sync_task_threads_num` {#max_sync_task_threads_num}

データ同期ジョブのスレッドプールの最大スレッド数です。

デフォルト値：10

#### `min_sync_commit_size` {#min_sync_commit_size}

トランザクションを commit するために必要なイベントの最小数です。FE が受け取ったイベント数がこの値より少ない場合、`sync_commit_interval_second` を超えるまで次のデータバッチを待ちます。デフォルトは 10000 イベントです。変更する場合は、canal 側の設定 `canal.instance.memory.buffer.size`（デフォルト 16384）より小さくしてください。そうしないと、FE は ack 前にストアのキュー容量を超えるイベントを取得しようとし、タイムアウトするまでキューがブロックされます。

デフォルト：10000

動的設定：可能

Master FE ノード固有：はい

#### `min_bytes_sync_commit` {#min_bytes_sync_commit}

トランザクションを commit するために必要な最小データサイズです。FE が受け取ったデータサイズがこの値より小さい場合、`sync_commit_interval_second` を超えるまで次のデータバッチを待ちます。デフォルトは 15MB です。変更する場合は、canal 側の `canal.instance.memory.buffer.size` と `canal.instance.memory.buffer.memunit` の積（デフォルト 16MB）より小さくしてください。そうしないと、FE は ack 前にストアの容量を超えるデータを取得しようとし、タイムアウトするまでキューがブロックされます。

デフォルト：`15*1024*1024`（15M）

動的設定：可能

Master FE ノード固有：はい

#### `max_bytes_sync_commit` {#max_bytes_sync_commit}

データ同期ジョブのスレッドプールの最大スレッド数です。FE 全体でスレッドプールは 1 つで、FE から BE にデータを送るすべてのデータ同期タスクを処理します。スレッドプールは `SyncTaskPool` クラスで実装されています。

デフォルト：10

動的設定：不可

Master FE ノード固有：いいえ

#### `enable_outfile_to_local` {#enable_outfile_to_local}

デフォルト：false

outfile 機能で結果をローカルディスクにエクスポートすることを許可するかどうかを指定します。

#### `export_tablet_num_per_task` {#export_tablet_num_per_task}

デフォルト：5

IsMutable：true

MasterOnly：true

エクスポートクエリプランのタスクごとの tablet 数です。

#### `export_task_default_timeout_second` {#export_task_default_timeout_second}

デフォルト：2 * 3600（2 時間）

IsMutable：true

MasterOnly：true

エクスポートジョブのデフォルトタイムアウトです。

#### `export_running_job_num_limit` {#export_running_job_num_limit}

デフォルト：5

IsMutable：true

MasterOnly：true

実行中のエクスポートジョブの同時実行数の上限です。デフォルトは 5 で、0 は無制限です。

#### `export_checker_interval_second` {#export_checker_interval_second}

デフォルト：5

エクスポートチェッカーの実行間隔です。

#### `enable_stream_load_profile` {#enable_stream_load_profile}

デフォルト：false

MasterOnly：false

stream load のプロファイルを有効にするかどうかを指定します。

### ログ {#log}

#### `log_roll_size_mb` {#log_roll_size_mb}

デフォルト：1024（1G）

システムログと監査ログの各ファイルの最大サイズです。

#### `sys_log_dir` {#sys_log_dir}

デフォルト：DorisFE.DORIS_HOME_DIR + "/log"

FE ログのディレクトリを指定します。FE は次の 2 つのログファイルを生成します。

fe.log:      FE プロセスのすべてのログ。
fe.warn.log  FE プロセスの WARNING と ERROR のログ。

#### `sys_log_level` {#sys_log_level}

デフォルト：INFO

ログレベル：INFO、WARN、ERROR、FATAL

#### `sys_log_roll_num` {#sys_log_roll_num}

デフォルト：10

sys_log_roll_interval の期間内に保持する FE ログファイルの最大数です。デフォルトは 10 で、1 日に保持するログファイルは最大 10 個です。

#### `sys_log_verbose_modules` {#sys_log_verbose_modules}

デフォルト：{}

詳細ログを出すモジュールです。VERBOSE レベルは log4j の DEBUG レベルで実装されています。

例：
   sys_log_verbose_modules = org.apache.doris.catalog
   org.apache.doris.catalog パッケージとそのすべてのサブパッケージに属するファイルのデバッグログのみを出力します。

#### `sys_log_roll_interval` {#sys_log_roll_interval}

デフォルト：DAY

sys_log_roll_interval：

* DAY：ログの接尾辞は yyyyMMdd
* HOUR：ログの接尾辞は yyyyMMddHH

#### `sys_log_delete_age` {#sys_log_delete_age}

デフォルト：7d

デフォルトは 7 日です。ログの最終更新が 7 日前であれば削除されます。

対応する形式：

* 7d      7 日
* 10h     10 時間
* 60m     60 分
* 120s    120 秒

#### `sys_log_roll_mode` {#sys_log_roll_mode}

デフォルト：SIZE-MB-1024

ログ分割のサイズです。1 G ごとにログファイルを分割します。

#### `sys_log_enable_compress` {#sys_log_enable_compress}

デフォルト：false

true の場合、fe.log と fe.warn.log を gzip で圧縮します。

#### `audit_log_dir` {#audit_log_dir}

デフォルト：DORIS_HOME_DIR + "/log"

audit_log_dir：
FE の監査ログディレクトリを指定します。
監査ログ fe.audit.log には、ユーザー、ホスト、所要時間、状態などの関連情報とともに、すべての要求が記録されます。

#### `audit_log_roll_num` {#audit_log_roll_num}

デフォルト：90

audit_log_roll_interval の期間内に保持する FE 監査ログファイルの最大数です。

#### `audit_log_modules` {#audit_log_modules}

デフォルト：{"slow_query", "query", "load", "stream_load"}

slow_query には、所要時間が *qe_slow_log_ms* を超えるすべてのクエリが含まれます。

#### `qe_slow_log_ms` {#qe_slow_log_ms}

デフォルト：5000（5 秒）

クエリの応答時間がこのしきい値を超えると、監査ログに slow_query として記録されます。

#### `audit_log_roll_interval` {#audit_log_roll_interval}

デフォルト：DAY

DAY：ログの接尾辞は yyyyMMdd
HOUR：ログの接尾辞は yyyyMMddHH

#### `audit_log_delete_age` {#audit_log_delete_age}

デフォルト：30d

デフォルトは 30 日です。ログの最終更新が 30 日前であれば削除されます。

対応する形式：
* 7d      7 日
* 10h     10 時間
* 60m     60 分
* 120s    120 秒

#### `audit_log_enable_compress` {#audit_log_enable_compress}

デフォルト：false

true の場合、fe.audit.log を gzip で圧縮します。

#### `nereids_trace_log_dir` {#nereids_trace_log_dir}

デフォルト：DorisFE.DORIS_HOME_DIR + "/log/nereids_trace"

nereids トレースログのディレクトリを指定します。

### ストレージ {#storage}

#### `inverted_index_storage_format` {#inverted_index_storage_format}

デフォルト：`V3`

動的設定：可能

Master FE ノード固有：はい

新しく作成する転置インデックスのデフォルトストレージ形式です。バージョン 4.1.5 以降、V1 形式の転置インデックスの作成と、この設定の `V1` への動的変更は禁止されています。`fe.conf` または `fe_custom.conf` の有効な値が `V1` の場合、FE は起動しません。アップグレード前に `V2` または `V3` に変更してください。既存の V1 テーブルは引き続き読み取れますが、転置インデックスを追加できません。新しいインデックスが必要な場合は、テーブルを V2 または V3 形式で再作成してください。

#### `min_replication_num_per_tablet` {#min_replication_num_per_tablet}

デフォルト：1

tablet ごとの最小レプリカ数を設定します。

#### `max_replication_num_per_tablet` {#max_replication_num_per_tablet}

デフォルト：32767

tablet ごとの最大レプリカ数を設定します。

#### `default_db_data_quota_bytes` {#default_db_data_quota_bytes}

デフォルト：8192PB

IsMutable：true

MasterOnly：true

データベースのデータクォータのデフォルトサイズを設定します。個別のデータベースのクォータは次のように設定できます。

```
Set the database data quota, the unit is:B/K/KB/M/MB/G/GB/T/TB/P/PB
ALTER DATABASE db_name SET DATA QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```

#### `default_db_replica_quota_size` {#default_db_replica_quota_size}

デフォルト：1073741824

IsMutable：true

MasterOnly：true

データベースのレプリカクォータのデフォルト値を設定します。個別のデータベースのクォータは次のように設定できます。

```
Set the database replica quota
ALTER DATABASE db_name SET REPLICA QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```

#### `recover_with_empty_tablet` {#recover_with_empty_tablet}

デフォルト：false

IsMutable：true

MasterOnly：true

コードの不具合や操作ミスなど、非常に特殊な状況では、一部の tablet のすべてのレプリカが失われることがあります。この場合、データは実質的に失われています。ただし、データ損失があってもクエリがエラーにならないようにし、ユーザーへの影響を抑えたい場合があります。その際は、空の Tablet で欠けたレプリカを補い、クエリを正常に実行できるようにします。

true にすると、すべてのレプリカが破損または欠落した tablet に、Doris が空のレプリカを自動で補充します。

#### `min_clone_task_timeout_sec` と `max_clone_task_timeout_sec` {#min_clone_task_timeout_sec-and-max_clone_task_timeout_sec}

デフォルト：最小 3 分、最大 2 時間

IsMutable：true

MasterOnly：true

`mix_clone_task_timeout_sec` と組み合わせて、clone タスクの最大タイムアウトと最小タイムアウトを制御できます。通常、clone タスクのタイムアウトはデータ量と最小転送速度（5MB/s）から見積もられます。特殊な状況では、この 2 つの設定で上下限を指定し、clone タスクを正常に完了できるようにします。

#### `disable_storage_medium_check` {#disable_storage_medium_check}

デフォルト：false

IsMutable：true

MasterOnly：true

disable_storage_medium_check が true の場合、ReportHandler は tablet のストレージ媒体を確認せず、ストレージのクールダウン機能を無効にします。デフォルトは false です。tablet のストレージ媒体を問わない場合は true に設定できます。

#### `decommission_tablet_check_threshold` {#decommission_tablet_check_threshold}

デフォルト：5000

IsMutable：true

MasterOnly：true

Master FE が decommission 中の BE にある tablet の状態を確認するかどうかを制御します。その BE にある tablet の数がこのしきい値より少ない場合、FE は定期的な確認を開始し、すべての tablet が回収されたら直ちに BE を削除します。

性能上の理由から、この値を非常に大きく設定しないでください。

#### `partition_rebalance_max_moves_num_per_selection` {#partition_rebalance_max_moves_num_per_selection}

デフォルト：10

IsMutable：true

MasterOnly：true

PartitionRebalancer を使用する場合のみ有効です。

#### `partition_rebalance_move_expire_after_access` {#partition_rebalance_move_expire_after_access}

デフォルト：600（s）

IsMutable：true

MasterOnly：true

PartitionRebalancer を使用する場合のみ有効です。この値を変更すると、キャッシュ済みの移動情報は消去されます。

#### `tablet_rebalancer_type` {#tablet_rebalancer_type}

デフォルト：BeLoad

MasterOnly：true

Rebalancer の種類です（大文字と小文字を区別しません）：BeLoad、Partition。値を解析できない場合は、デフォルトの BeLoad を使用します。

#### `max_balancing_tablets` {#max_balancing_tablets}

デフォルト：100

IsMutable：true

MasterOnly：true

TabletScheduler 内で均衡化中の tablet 数が max_balancing_tablets を超えると、それ以上の均衡化チェックを行いません。

#### `max_scheduling_tablets` {#max_scheduling_tablets}

デフォルト：2000

IsMutable：true

MasterOnly：true

TabletScheduler 内でスケジュール済みの tablet 数が max_scheduling_tablets を超えると、チェックをスキップします。

#### `disable_balance` {#disable_balance}

デフォルト：false

IsMutable：true

MasterOnly：true

true にすると、TabletScheduler は均衡化を行いません。

#### `disable_disk_balance` {#disable_disk_balance}

デフォルト：true

IsMutable：true

MasterOnly：true

true にすると、TabletScheduler はディスクの均衡化を行いません。

#### `balance_load_score_threshold` {#balance_load_score_threshold}

デフォルト：0.1（10%）

IsMutable：true

MasterOnly：true

クラスターの負荷スコアを均衡化する際のしきい値です。backend の負荷スコアが平均より 10% 低い場合は LOW、平均より 10% 高い場合は HIGH と判定されます。

#### `capacity_used_percent_high_water` {#capacity_used_percent_high_water}

デフォルト：0.75（75%）

IsMutable：true

MasterOnly：true

ディスク容量の使用率の高水位です。backend の負荷スコアの計算に使用します。

#### `clone_distribution_balance_threshold` {#clone_distribution_balance_threshold}

デフォルト：0.2

IsMutable：true

MasterOnly：true

Backend 間のレプリカ数を均衡化する際のしきい値です。

#### `clone_capacity_balance_threshold` {#clone_capacity_balance_threshold}

デフォルト：0.2

IsMutable：true

MasterOnly：true

* BE 間のデータサイズを均衡化する際のしきい値です。

   均衡化アルゴリズムは次のとおりです。

     1. クラスター全体の平均使用容量（AUC）を計算します（総データサイズ / backend の総数）。

     2. 高水位は AUC * (1 + clone_capacity_balance_threshold) です。

     3. 低水位は AUC * (1 - clone_capacity_balance_threshold) です。

     4. Clone checker は、高水位の BE から低水位の BE へレプリカを移動しようとします。

#### `disable_colocate_balance` {#disable_colocate_balance}

デフォルト：false

IsMutable：true

MasterOnly：true

true にすると、colocate テーブルの自動再配置と均衡化を無効にできます。`disable_colocate_balance` が true の場合、ColocateTableBalancer は colocate テーブルを再配置・均衡化しません。

**注意：**

1. 通常、均衡化を無効にする必要はありません。
2. 無効にすると、不安定な colocate テーブルが復旧しない場合があります。
3. その結果、クエリ時に colocate プランを使用できなくなる場合があります。

#### `balance_slot_num_per_path` {#balance_slot_num_per_path}

デフォルト：1

IsMutable：true

MasterOnly：true

均衡化時のパスごとのデフォルトスロット数です。

#### `disable_tablet_scheduler` {#disable_tablet_scheduler}

デフォルト：false

IsMutable：true

MasterOnly：true

true にすると tablet scheduler が動作せず、tablet の修復・均衡化タスクはすべて実行されません。

#### `enable_force_drop_redundant_replica` {#enable_force_drop_redundant_replica}

デフォルト：false

動的設定：可能

Master FE のみ：はい

true にすると、tablet のスケジューリング処理で余分なレプリカを直ちに削除します。該当するレプリカに書き込んでいる一部のデータロードジョブが失敗する可能性がありますが、tablet の均衡化と修復は速くなります。
クラスター内で均衡化や修復を待つレプリカが多数ある場合、一部のデータロードの成功率を犠牲にして処理を速めるために設定できます。

#### `colocate_group_relocate_delay_second` {#colocate_group_relocate_delay_second}

デフォルト：1800

動的設定：可能

Master FE のみ：はい

colocation group の再配置では、クラスター内の多数の tablet が移動する可能性があります。そのため、できるだけ再配置を避ける慎重な方法を採用します。
再配置は通常、BE ノードがオフラインまたは停止した後に行われます。このパラメータは、BE ノードを使用不可と判定するまでの時間を遅らせます。デフォルトは 30 分で、BE ノードが 30 分以内に復旧すれば colocation group の再配置は開始されません。

#### `allow_replica_on_same_host` {#allow_replica_on_same_host}

デフォルト：false

動的設定：不可

Master FE のみ：いいえ

同じ tablet の複数のレプリカを同一ホストに配置できるようにするかどうかを指定します。主にローカルテストで、複数の BE を立ち上げて複数レプリカの動作をテストしやすくするために使用します。テスト以外の環境では使用しないでください。

#### `repair_slow_replica` {#repair_slow_replica}

デフォルト：false

IsMutable：true

MasterOnly：true

true にすると、compaction が遅いレプリカを自動的に検出し、別のマシンに移行します。検出条件は、最速のレプリカのバージョン数が `min_version_count_indicate_replica_compaction_too_slow` の値を超え、最速のレプリカとのバージョン数の差の比率が `valid_version_count_delta_ratio_between_replicas` の値を超えることです。

#### `min_version_count_indicate_replica_compaction_too_slow` {#min_version_count_indicate_replica_compaction_too_slow}

デフォルト：200

動的設定：可能

Master FE のみ：いいえ

レプリカの compaction が遅すぎるかどうかを判定するためのバージョン数のしきい値です。

#### `skip_compaction_slower_replica` {#skip_compaction_slower_replica}

デフォルト：true

動的設定：可能

Master FE のみ：いいえ

true にすると、クエリ可能なレプリカを選択する際に、compaction が遅いレプリカをスキップします。

#### `valid_version_count_delta_ratio_between_replicas` {#valid_version_count_delta_ratio_between_replicas}

デフォルト：0.5

動的設定：可能

Master FE のみ：はい

最も遅いレプリカと最も速いレプリカのバージョン数の差について、有効とみなす比率のしきい値です。`repair_slow_replica` が true の場合、最も遅いレプリカを修復するかどうかの判定に使用します。

#### `min_bytes_indicate_replica_too_large` {#min_bytes_indicate_replica_too_large}

デフォルト：`2 * 1024 * 1024 * 1024`（2G）

動的設定：可能

Master FE のみ：はい

レプリカが大きすぎるかどうかを判定するデータサイズのしきい値です。

#### `schedule_slot_num_per_hdd_path` {#schedule_slot_num_per_hdd_path}

デフォルト：4

HDD の tablet scheduler で、パスごとのデフォルトスロット数です。この設定を削除し、clone タスクの統計に基づいて動的に調整します。

#### `schedule_slot_num_per_ssd_path` {#schedule_slot_num_per_ssd_path}

デフォルト：8

SSD の tablet scheduler で、パスごとのデフォルトスロット数です。この設定を削除し、clone タスクの統計に基づいて動的に調整します。

#### `tablet_repair_delay_factor_second` {#tablet_repair_delay_factor_second}

デフォルト：60（s）

IsMutable：true

MasterOnly：true

tablet の修復を決定するまでの遅延時間の係数です。

* 優先度が VERY_HIGH の場合、直ちに修復します。
* HIGH の場合、tablet_repair_delay_factor_second * 1 だけ遅延します。
* NORMAL の場合、tablet_repair_delay_factor_second * 2 だけ遅延します。
* LOW の場合、tablet_repair_delay_factor_second * 3 だけ遅延します。

#### `tablet_stat_update_interval_second` {#tablet_stat_update_interval_second}

デフォルト：300（5min）

tablet の統計情報の更新間隔です。
各 Frontend はこの間隔ごとにすべての Backend から tablet の統計情報を取得します。

#### `storage_flood_stage_usage_percent` {#storage_flood_stage_usage_percent}

デフォルト：95（95%）

IsMutable：true

MasterOnly：true

##### `storage_flood_stage_left_capacity_bytes` {#storage_flood_stage_left_capacity_bytes}

デフォルト：`1 * 1024 * 1024 * 1024`（1GB）

IsMutable：true

MasterOnly：true

ディスク容量が `storage_flood_stage_usage_percent` と `storage_flood_stage_left_capacity_bytes` の両方の条件に達すると、次の操作は拒否されます。

1. データロードジョブ
2. 復元ジョブ

#### `storage_high_watermark_usage_percent` {#storage_high_watermark_usage_percent}

デフォルト：85（85%）

IsMutable：true

MasterOnly：true

#### `storage_min_left_capacity_bytes` {#storage_min_left_capacity_bytes}

デフォルト：`2 * 1024 * 1024 * 1024`（2GB）

IsMutable：true

MasterOnly：true

`storage_high_watermark_usage_percent` は Backend のストレージパスの最大使用率を、`storage_min_left_capacity_bytes` はそのパスの最小空き容量を制限します。両方の制限に達した場合、そのパスを tablet の均衡化先には選べません。ただし tablet の復旧では、データの整合性をできるだけ維持するため、これらの制限を超えることがあります。

#### `catalog_trash_expire_second` {#catalog_trash_expire_second}

デフォルト：86400L（1 日）

IsMutable：true

MasterOnly：true

データベース（テーブルまたはパーティション）を削除した後、RECOVER 文で復元できます。この設定はデータの最大保持期間を指定します。期限を過ぎるとデータは完全に削除されます。

#### `default_storage_medium` {#default_storage_medium}

デフォルト：HDD

テーブル（またはパーティション）の作成時にストレージ媒体（HDD または SSD）を指定できます。指定しない場合は、この設定をデフォルトとして使用します。

#### `default_compression_type` {#default_compression_type}

デフォルト：LZ4F（4.0.3 より前）、ZSTD（4.0.3 以降）

テーブルの作成時に圧縮アルゴリズムを指定できます。指定しない場合は、この設定がデフォルトの圧縮形式になります。有効な値は LZ4、LZ4F、LZ4HC、ZLIB、ZSTD、SNAPPY、NONE です（大文字と小文字は区別されません）。

#### `enable_storage_policy` {#enable_storage_policy}

* Storage Policy 機能を有効にするかどうかを指定します。この設定により、ホットデータとコールドデータを分離できます。
デフォルト：false

動的設定：可能

Master FE ノード固有：はい

#### `check_consistency_default_timeout_second` {#check_consistency_default_timeout_second}

デフォルト：600（10 分）

IsMutable：true

MasterOnly：true

単一の整合性チェックタスクのデフォルトタイムアウトです。tablet のサイズに合わせて十分長く設定してください。

#### `consistency_check_start_time` {#consistency_check_start_time}

デフォルト：23

IsMutable：true

MasterOnly：true

整合性チェックの開始時刻です。

整合性チェッカーは *consistency_check_start_time* から *consistency_check_end_time* まで実行されます。

2 つの時刻が同じ場合、整合性チェックは実行されません。

#### `consistency_check_end_time` {#consistency_check_end_time}

デフォルト：23

IsMutable：true

MasterOnly：true

整合性チェックの終了時刻です。

整合性チェッカーは *consistency_check_start_time* から *consistency_check_end_time* まで実行されます。

2 つの時刻が同じ場合、整合性チェックは実行されません。

#### `replica_delay_recovery_second` {#replica_delay_recovery_second}

デフォルト：0

IsMutable：true

MasterOnly：true

レプリカの障害発生から、FE が clone を使用して復旧を試みるまでの最小遅延秒数です。

#### `tablet_create_timeout_second` {#tablet_create_timeout_second}

デフォルト：1（s）

IsMutable：true

MasterOnly：true

単一のレプリカの作成を待つ最大時間です。

例：
   #m 個の tablet があり、各 tablet に #n 個のレプリカを持つテーブルを作成する場合、
   テーブル作成要求はタイムアウトまで最大 (m *n* tablet_create_timeout_second) 実行されます。

#### `tablet_delete_timeout_second` {#tablet_delete_timeout_second}

デフォルト：2

IsMutable：true

MasterOnly：true

*tablet_create_timeout_second* と同じ意味ですが、tablet の削除時に使用します。

#### `delete_job_max_timeout_second` {#delete_job_max_timeout_second}

デフォルト：300(s)

Mutable：true

Master only：true

削除ジョブの最大タイムアウトを秒単位で指定します。

#### `alter_table_timeout_second` {#alter_table_timeout_second}

デフォルト：86400 * 30（1 か月）

IsMutable：true

MasterOnly：true

ALTER TABLE 要求の最大タイムアウトです。テーブルのデータサイズに合わせて十分長く設定してください。

#### `max_replica_count_when_schema_change` {#max_replica_count_when_schema_change}

OlapTable のスキーマ変更時に許容するレプリカの最大数です。レプリカが多すぎると FE で OOM が発生します。

デフォルト：100000

動的設定：可能

Master FE ノード固有：はい

#### `history_job_keep_max_second` {#history_job_keep_max_second}

デフォルト：`7 * 24 * 3600`（7 日）

IsMutable：true

MasterOnly：true

スキーマ変更ジョブや rollup ジョブなど、一部のジョブの最大保持時間です。

#### `max_create_table_timeout_second` {#max_create_table_timeout_second}

デフォルト：60（s）

IsMutable：true

MasterOnly：true

テーブル（インデックス）の作成時に長時間待たないよう、最大タイムアウトを設定します。

#### `autobucket_min_buckets` {#autobucket_min_buckets}

デフォルト：3（4.0.8 / 4.1.4 より前は 1）

IsMutable：true

MasterOnly：true

自動 bucket 分割（`DISTRIBUTED BY ... BUCKETS AUTO`）で生成する bucket の最小数です。

**Doris 4.0 系のバージョン 4.0.8 および 4.1 系のバージョン 4.1.4 から、デフォルト値が `1` から `3` に変更されました。** 以前のデフォルトでは小さなパーティションが単一 bucket になり、並列性とデータ分散が不足していました。変更後は、自動 bucket 分割で 3 個未満の bucket は生成されません。この変更が影響するのは新しく作成されるパーティションのみで、既存のパーティションの bucket 数は変わりません。

#### `autobucket_max_buckets` {#autobucket_max_buckets}

デフォルト：128

IsMutable：true

MasterOnly：true

自動 bucket 分割で生成する bucket の最大数です。計算結果がこの値を超える場合は、この値に制限されます。

### 外部テーブル {#external-table}

#### `external_meta_cache_max_weight` {#external_meta_cache_max_weight}

デフォルト：`0`

動的設定：不可

Master FE ノード固有：いいえ

バージョン 4.1.4 で追加されました。FE レベルの外部メタキャッシュ全体の容量上限です。

値には `1024MB` や `4GB` のような単位付きのバイトサイズ、または `10%` のような JVM の最大ヒープサイズに対する割合を指定できます。`0` は全体のクォータを設けないことを意味し、以前のバージョンと同じ動作になります。

このクォータは、Hive のパーティション値、Iceberg のテーブル・スナップショット・manifest、Paimon のスナップショットなど、各種外部テーブルメタデータキャッシュのメモリ使用量を一律に制限します。個別の catalog は `meta.cache.max-weight` と `meta.cache.<engine>.<entry>.max-weight` プロパティでさらに細かく制御できます。キャッシュの使用状況は `information_schema.catalog_meta_cache_statistics` システムテーブルで確認できます。

#### `jdbc_driver_url_white_list` {#jdbc_driver_url_white_list}

デフォルト：empty

動的設定：不可

JDBC catalog の作成時に許可する `driver_url` 値の許可リストです。複数の値は `jdbc_driver_url_white_list=a,b,c` のようにコンマで区切ります。空の値は許可リストが設定されていないことを意味します。

:::caution 動作変更（4.1.4）

セキュリティ上の理由により、バージョン 4.1.4 以降、この設定項目は **動的に変更できません**。`fe.conf` にのみ設定でき、FE の再起動後に有効になります。`ADMIN SET FRONTEND CONFIG` では変更できません。

:::

#### `force_sqlserver_jdbc_encrypt_false` {#force_sqlserver_jdbc_encrypt_false}

デフォルト：false

動的設定：不可

SQLServer JDBC catalog の `encrypt` パラメータを強制的に `false` にするかどうかを指定します。

:::caution 動作変更（4.1.4）

この設定は SQLServer JDBC の通信暗号化を無効にするため、セキュリティに影響します。バージョン 4.1.4 以降は **動的に変更できません**。`fe.conf` にのみ設定でき、FE の再起動後に有効になります。

:::

#### `file_scan_node_split_num` {#file_scan_node_split_num}

デフォルト：128

IsMutable：true

MasterOnly：false

複数の catalog でファイルを並列スキャンするスレッド数です。

#### `file_scan_node_split_size` {#file_scan_node_split_size}

デフォルト：`256 * 1024 * 1024`

IsMutable：true

MasterOnly：false

複数の catalog で並列ファイルスキャンを行う際のサイズです。

#### `enable_odbc_mysql_broker_table` {#enable_odbc_mysql_broker_table}

デフォルト：false

IsMutable：true

MasterOnly：false

バージョン 2.1 以降、ODBC、JDBC、broker 外部テーブルの作成はサポートされません。ODBC と MySQL の外部テーブルには JDBC テーブルまたは JDBC catalog を、broker テーブルにはテーブル値関数を使用してください。

#### `max_hive_partition_cache_num` {#max_hive_partition_cache_num}

Hive パーティションのキャッシュの最大数です。

デフォルト：100000

動的設定：不可

Master FE ノード固有：いいえ

#### `hive_metastore_client_timeout_second` {#hive_metastore_client_timeout_second}

Hive metastore のデフォルト接続タイムアウトです。

デフォルト：10

動的設定：可能

Master FE ノード固有：はい

#### `max_external_cache_loader_thread_pool_size` {#max_external_cache_loader_thread_pool_size}

外部メタキャッシュを読み込むためのスレッドプールの最大サイズです。

デフォルト：10

動的設定：不可

Master FE ノード固有：いいえ

#### `max_external_file_cache_num` {#max_external_file_cache_num}

外部テーブルで使用するファイルキャッシュの最大数です。

デフォルト：100000

動的設定：不可

Master FE ノード固有：いいえ

#### `max_external_schema_cache_num` {#max_external_schema_cache_num}

外部テーブルで使用するスキーマキャッシュの最大数です。

デフォルト：10000

動的設定：不可

Master FE ノード固有：いいえ

#### `external_cache_expire_time_minutes_after_access` {#external_cache_expire_time_minutes_after_access}

キャッシュ内のデータが最後のアクセスからどれだけ経過すると期限切れになるかを、分単位で設定します。
External Schema Cache と Hive Partition Cache の両方に適用されます。

デフォルト：1440

動的設定：不可

Master FE ノード固有：いいえ

#### `es_state_sync_interval_second` {#es_state_sync_interval_second}

デフォルト：10

FE は es_state_sync_interval_secs ごとに es API を呼び出し、es インデックスの shard 情報を取得します。

### 外部リソース {#external-resources}

#### `ai_resource_allowed_user` {#ai_resource_allowed_user}

デフォルト：`*`

動的設定：不可

Master FE ノード固有：いいえ

バージョン 4.1.5 以降でサポートされます。AI Resources の作成を許可するユーザー ID を制限します。`*` は ID による制限を追加しませんが、既存の権限チェックは引き続き適用されます。ほかの値は `'user'@'host'` 形式を使用し、現在のユーザー ID と一致する必要があります。変更には FE の再起動が必要です。

#### `dpp_hadoop_client_path` {#dpp_hadoop_client_path}

デフォルト：/lib/hadoop-client/hadoop/bin/hadoop

#### `dpp_bytes_per_reduce` {#dpp_bytes_per_reduce}

デフォルト：`100 * 1024 * 1024L`（100M）

#### `dpp_default_cluster` {#dpp_default_cluster}

デフォルト：palo-dpp

#### `dpp_default_config_str` {#dpp_default_config_str}

デフォルト：{
               hadoop_configs : 'mapred.job.priority=NORMAL;mapred.job.map.capacity=50;mapred.job.reduce.capacity=50;mapred.hce.replace.streaming=false;abaci.long.stored.job=true;dce.shuffle.enable=false;dfs.client.authserver.force_stop=true;dfs.client.auth.method=0'
         }

#### `dpp_config_str` {#dpp_config_str}

デフォルト：{
               palo-dpp : {
                     hadoop_palo_path : '/dir',
                     hadoop_configs : 'fs.default.name=hdfs://host:port;mapred.job.tracker=host:port;hadoop.job.ugi=user,password'
                  }
      }

#### `yarn_config_dir` {#yarn_config_dir}

デフォルト：DorisFE.DORIS_HOME_DIR + "/lib/yarn-config"

Yarn 設定ファイルのデフォルトディレクトリです。yarn コマンドを実行する前に毎回、このパスに設定ファイルがあるか確認し、なければ作成する必要があります。

#### `yarn_client_path` {#yarn_client_path}

デフォルト：DORIS_HOME_DIR + "/lib/yarn-client/hadoop/bin/yarn"

Yarn クライアントのデフォルトパスです。

#### `spark_launcher_log_dir` {#spark_launcher_log_dir}

デフォルト：sys_log_dir + "/spark_launcher_log"

指定された spark launcher のログディレクトリです。

#### `spark_resource_path` {#spark_resource_path}

デフォルト：none

Spark の依存ファイルのデフォルトパスです。

#### `spark_home_default_dir` {#spark_home_default_dir}

デフォルト：DORIS_HOME_DIR + "/lib/spark2x"

Spark home のデフォルトディレクトリです。

#### `spark_dpp_version` {#spark_dpp_version}

デフォルト：1.0.0

Spark dpp のデフォルトバージョンです。

### その他 {#else}

#### `tmp_dir` {#tmp_dir}

デフォルト：DorisFE.DORIS_HOME_DIR + "/temp_dir"

一時ディレクトリは、バックアップや復元などの処理で中間結果を保存するために使用します。処理が完了すると、このディレクトリ内のファイルは削除されます。

#### `custom_config_dir` {#custom_config_dir}

デフォルト：DorisFE.DORIS_HOME_DIR + "/conf"

カスタム設定ファイルのディレクトリです。

`fe_custom.conf` ファイルの場所を指定します。デフォルトは `conf/` ディレクトリです。

デプロイ環境によっては、システムのアップグレード時に `conf/` ディレクトリが上書きされ、ユーザーが変更した設定項目も失われる可能性があります。これを防ぐため、`fe_custom.conf` を別の指定ディレクトリに保存できます。

#### `plugin_dir` {#plugin_dir}

デフォルト：DORIS_HOME + "/plugins

プラグインのインストールディレクトリです。

#### `plugin_enable` {#plugin_enable}

デフォルト：true

IsMutable：true

MasterOnly：true

プラグインを有効にするかどうかを指定します。デフォルトで有効です。

#### `small_file_dir` {#small_file_dir}

デフォルト：DORIS_HOME_DIR/small_files

小さなファイルを保存します。

#### `max_small_file_size_bytes` {#max_small_file_size_bytes}

デフォルト：1M

IsMutable：true

MasterOnly：true

SmallFileMgr に保存する単一ファイルの最大サイズです。

#### `max_small_file_number` {#max_small_file_number}

デフォルト：100

IsMutable：true

MasterOnly：true

SmallFileMgr に保存するファイルの最大数です。

#### `enable_metric_calculator` {#enable_metric_calculator}

デフォルト：true

true にすると、メトリクスコレクターがデーモンタイマーとして動作し、一定間隔でメトリクスを収集します。

#### `report_queue_size` {#report_queue_size}

デフォルト：100

IsMutable：true

MasterOnly：true

FE に report タスクが大量に滞留して OOM になるのを防ぐためのしきい値です。たとえば、100 台の Backend と 1,000 万個のレプリカがある大規模な Doris クラスターでは、メタデータの変更（パーティションの削除など）の後、tablet report に数秒かかる場合があります。各 Backend は 1 分ごとに tablet 情報を報告するため、無制限に report を受け付けることはできません。tablet report の処理速度は将来改善する予定ですが、現時点ではキューサイズが上限を超えると report を破棄します。
   実環境での所要時間の例：
      1. disk report：0-1 msta
      2. sk report：0-1 ms
      3. tablet report
      4. 10000 個のレプリカ：200ms

#### `backup_job_default_timeout_ms` {#backup_job_default_timeout_ms}

デフォルト：86400 * 1000（1 日）

IsMutable：true

MasterOnly：true

バックアップジョブのデフォルトタイムアウトです。

#### `backup_upload_snapshot_batch_size` {#backup_upload_snapshot_batch_size}

デフォルト：10

IsMutable：true

MasterOnly：true

バックアップ処理で 1 つのアップロードタスクに割り当てるスナップショットの最大数です。デフォルトは 10 です。

#### `restore_download_snapshot_batch_size` {#restore_download_snapshot_batch_size}

デフォルト：10

IsMutable：true

MasterOnly：true

復元処理で 1 つのダウンロードタスクに割り当てるスナップショットの最大数です。デフォルトは 10 です。

#### `max_backup_restore_job_num_per_db` {#max_backup_restore_job_num_per_db}

デフォルト：10

各データベースに記録するバックアップ・復元タスクの数を制御します。

#### `max_backup_tablets_per_job` {#max_backup_tablets_per_job}

デフォルト：300000

IsMutable：true

MasterOnly：true

バックアップジョブに含める tablet の最大数を制御し、メタデータの保存量が多すぎることによる FE の OOM を防ぎます。

#### `enable_quantile_state_type` {#enable_quantile_state_type}

デフォルト：false

IsMutable：true

MasterOnly：true

quantile_state データ型を有効にするかどうかを指定します。

#### `enable_date_conversion` {#enable_date_conversion}

デフォルト：true

IsMutable：true

MasterOnly：true

FE が date/datetime を datev2/datetimev2(0) に自動変換します。

#### `enable_decimal_conversion` {#enable_decimal_conversion}

デフォルト：true

IsMutable：true

MasterOnly：true

FE が DecimalV2 を DecimalV3 に自動変換します。

#### `proxy_auth_magic_prefix` {#proxy_auth_magic_prefix}

デフォルト：x@8

#### `proxy_auth_enable` {#proxy_auth_enable}

デフォルト：false

#### `enable_func_pushdown` {#enable_func_pushdown}

デフォルト：true

IsMutable：true

MasterOnly：false

ODBC、JDBC 外部テーブルへのクエリを実行する際、関数を含むフィルター条件を MySQL にプッシュダウンするかどうかを指定します。

#### `jdbc_drivers_dir` {#jdbc_drivers_dir}

デフォルト：`${DORIS_HOME}/jdbc_drivers`;

IsMutable：false

MasterOnly：false

JDBC ドライバーを置くデフォルトディレクトリです。

#### `max_error_tablet_of_broker_load` {#max_error_tablet_of_broker_load}

デフォルト：3;

IsMutable：true

MasterOnly：true

broker load で表示するエラーのある tablet の最大数です。

#### `default_db_max_running_txn_num` {#default_db_max_running_txn_num}

デフォルト：-1

IsMutable：true

MasterOnly：true

データベースのトランザクションクォータのデフォルト値を設定します。

デフォルトの -1 は、`default_db_max_running_txn_num` の代わりに `max_running_txn_num_per_db` を使用することを意味します。

個別のデータベースのクォータは次のように設定できます。

```
Set the database transaction quota
ALTER DATABASE db_name SET TRANSACTION QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```

#### `prefer_compute_node_for_external_table` {#prefer_compute_node_for_external_table}

デフォルト：false

IsMutable：true

MasterOnly：false

true の場合、外部テーブルへのクエリは優先的に compute node に割り当てられます。compute node の最大数は `min_backend_num_for_external_table` で制御されます。
false の場合、外部テーブルへのクエリは任意のノードに割り当てられます。

#### `min_backend_num_for_external_table` {#min_backend_num_for_external_table}

デフォルト：3

IsMutable：true

MasterOnly：false

`prefer_compute_node_for_external_table` が true の場合のみ有効です。compute node の数がこの値より少ない場合は、外部テーブルへのクエリを一部の混合ノードにも割り当て、合計ノード数がこの値に達するようにします。
compute node の数がこの値より多い場合は、compute node のみに割り当てます。

#### `infodb_support_ext_catalog` {#infodb_support_ext_catalog}

デフォルト：false

IsMutable：true

MasterOnly：false

false の場合、information_schema データベースのテーブルを SELECT した結果には、外部 catalog のテーブル情報が含まれません。
外部 catalog にアクセスできない場合にクエリが長引くのを防ぐためです。

#### `enable_query_hit_stats` {#enable_query_hit_stats}

デフォルト：false

IsMutable：true

MasterOnly：false

クエリヒット統計を有効にするかどうかを制御します。デフォルトは false です。

#### `div_precision_increment` {#div_precision_increment}

デフォルト：4

この変数は、`/` 演算子による除算結果の小数部の桁数を増やす桁数を示します。

#### `enable_convert_light_weight_schema_change` {#enable_convert_light_weight_schema_change}

デフォルト：true

一時的な設定項目です。有効にすると、バックグラウンドスレッドが起動し、すべての OLAP テーブルを light schema change に自動変更します。変更結果は `show convert_light_schema_change [from db]` コマンドで確認でき、light schema change ではないすべてのテーブルの変換結果が表示されます。

#### `disable_local_deploy_manager_drop_node` {#disable_local_deploy_manager_drop_node}

デフォルト：true

cluster.info ファイルのエラーによってノードが削除されるのを防ぐため、LocalDeployManager によるノードの削除を禁止します。

#### `mysqldb_replace_name` {#mysqldb_replace_name}

デフォルト：mysql

MySQL エコシステムとの互換性を保つため、Doris には mysql という組み込みデータベースがあります。ユーザー自身のデータベースと名前が競合する場合は、この項目を変更して Doris の組み込み MySQL データベースに別の名前を付けてください。

#### `max_auto_partition_num` {#max_auto_partition_num}

デフォルト値：2000

自動パーティションテーブルでユーザーが誤って大量のパーティションを作成するのを防ぐため、OLAP テーブルごとに許可するパーティション数を `max_auto_partition_num` で制限します。デフォルトは 2000 です。

#### `profile_manager_gc_interval_seconds` {#profile_manager_gc_interval_seconds}

デフォルト値：1

ProfileManager がプロファイルのガベージコレクションを行う間隔を制御します。ガベージコレクションでは、余分なプロファイルと期限切れのプロファイルをメモリとディスクから削除し、メモリを節約します。

### コンピュートとストレージの分離モード {#compute-and-storage-disaggregated-mode}

#### `cloud_edit_log_roll_interval_second` {#cloud_edit_log_roll_interval_second}

デフォルト：3600（秒）

動的設定：可能

Master FE ノード固有：はい

バージョン 4.1.5 以降でサポートされます。コンピュートとストレージの分離モードで、メタデータの書き込み頻度が低くても定期的なチェックポイントを進められるようにする、時間ベースの Edit Log ロール間隔です。間隔はログエントリの追加時に確認されます。新しいエントリがない場合、独立したタイマーがロールを強制することはありません。0 以下の値では時間ベースのロールが無効になります。ログエントリ数に基づくロールは引き続き有効です。

#### `cloud_version_syncer_interval_second` {#cloud_version_syncer_interval_second}

デフォルト：60（秒。4.1.5 より前は 20）

動的設定：不可

Master FE ノード固有：いいえ

コンピュートとストレージの分離モードで、すべての FE がバックグラウンドでテーブルとパーティションのバージョンを同期する間隔です。バックグラウンド同期には、`cloud_enable_version_syncer=true` に加え、グローバルまたはデフォルトのテーブルまたはパーティションバージョンキャッシュの TTL のうち少なくとも 1 つが `Long.MAX_VALUE` に設定されている必要があります。有限の TTL を持つキャッシュは、読み取り時に遅延更新されます。バージョン 4.1.5 では Meta Service への要求を減らすため、デフォルトの間隔が 20 秒から 60 秒に引き上げられました。変更には FE の再起動が必要です。

#### `cloud_get_version_task_batch_size` {#cloud_get_version_task_batch_size}

デフォルト：200（4.1.5 より前は 2000）

動的設定：可能

Master FE ノード固有：いいえ

コンピュートとストレージの分離モードでバージョンを同期する際、1 回の Get Version バッチに含めるテーブルまたはパーティションの最大数です。バージョン 4.1.5 では要求サイズを減らすため、デフォルトが 2000 から 200 に引き下げられました。

#### `cloud_version_syncer_get_version_retry_times` {#cloud_version_syncer_get_version_retry_times}

デフォルト：3

動的設定：可能

Master FE ノード固有：いいえ

バージョン 4.1.5 以降でサポートされます。コンピュートとストレージの分離モードで、バックグラウンド同期時にテーブルまたはパーティションのバージョン取得を試みる最大回数です。最初の要求も含みます。デフォルトでは、初回要求後に 3 回再試行するのではなく、合計で最大 3 回試行します。この設定は、フォアグラウンドクエリ用の Meta Service RPC 再試行設定とは独立しています。

#### `cloud_warm_up_job_scheduler_interval_millisecond` {#cloud_warm_up_job_scheduler_interval_millisecond}

デフォルト：1000（ミリ秒）

動的設定：可能

Master FE ノード固有：はい

キャッシュのウォームアップジョブをスケジュールする間隔です。バージョン 4.1.5 以降、動的に変更する値は `0` より大きい必要があります。それ以外の場合は `cloud_warm_up_job_scheduler_interval_millisecond must be greater than 0` が返されます。

#### `max_active_cloud_warm_up_job` {#max_active_cloud_warm_up_job}

デフォルト：10

動的設定：可能

Master FE ノード固有：はい

同時にスケジュールするキャッシュのウォームアップジョブ数です。バージョン 4.1.5 以降、動的な変更に合わせてウォームアップ executor のサイズも変更されます。0 以下の値では新しいウォームアップ処理のスケジューリングが一時停止します。

#### `cluster_id` {#cluster_id-1}

デフォルト：-1

同じクラスター ID を持つノード（FE または BE）は、同じ Doris クラスターに属するとみなされます。コンピュートとストレージの分離モードでは、ランダムな整数を 1 つ指定してください。

#### `deploy_mode` {#deploy_mode}

デフォルト：""

説明：FE の実行モードです。`cloud` はストレージとコンピュートの分離モードを示します。

#### `meta_service_endpoint` {#meta_service_endpoint}

デフォルト：""

Meta Service のエンドポイントを 'host1:port,host2:port' 形式で指定します。この設定はストレージとコンピュートの分離モードで必須です。

#### `enable_group_commit_streamload_be_forward` {#enable_group_commit_streamload_be_forward}

デフォルト：false

IsMutable：true

コンピュートとストレージの分離モードで、Group Commit 向けの Stream Load BE 転送を有効にするかどうかを指定します。分離モードで、要求が Group Commit を使用する場合にのみ有効です。

有効にすると、FE は Stream Load 要求を `_stream_load_forward` エンドポイントにリダイレクトします。受け取った BE は、そのテーブルの対象 BE に要求を転送します。これにより、ロードバランサーが同じテーブルの Group Commit バッチ処理を分散させるのを防ぎます。

同名の設定を FE と BE の両方で有効にする必要があります。**Doris 4.0 系のバージョン 4.0.8 および 4.1 系のバージョン 4.1.4 以降、BE 側の `_stream_load_forward` エンドポイントは BE の設定で制御されます。無効な場合は `403 Forbidden` を返し、有効な場合でも要求は認証を通過し、グローバルな `LOAD` 権限を持つ必要があります。** [Group Commit](../../data-operate/import/load-best-practices/group-commit-manual) と [BE 設定](./be-config) を参照してください。

#### `default_get_version_from_ms_timeout_second` {#default_get_version_from_ms_timeout_second}

デフォルト：30（s）

動的設定：不可

FE が Meta Service からバージョンを取得する際のタイムアウトです。

:::caution 動作変更（4.1.4）

バージョン 4.1.4 でデフォルト値が `3` 秒から `30` 秒に変更されました。以前は Meta Service に一時的な遅延が生じたり高負荷になったりすると、3 秒のタイムアウトによってクエリが失敗しやすくなっていました。値を大きくすることで、このような散発的な失敗を大幅に減らします。

:::

#### `enable_cloud_replica_stale_route_clean` {#enable_cloud_replica_stale_route_clean}

デフォルト：true

動的設定：可能

バージョン 4.1.4 で追加されました。メタデータ image の読み込み時と tablet の均衡化処理時に、存在しなくなった Backend を指す CloudReplica のプライマリおよびセカンダリのルートレコードを削除するかどうかを指定します。

古いレコードはクエリ時にすでに無視され、レプリカは再び Backend にハッシュされます。これらのレコードは FE のメモリとメタデータ image のサイズを無駄にするだけです。`false` にすると、削除しない従来の動作を維持します。

#### `enable_cloud_colocate_consistent_hash` {#enable_cloud_colocate_consistent_hash}

デフォルト：true

動的設定：不可

Master FE ノード固有：はい

バージョン 4.1.4 で追加されました。コンピュートとストレージの分離モードで、colocate テーブルの bucket 配置にランデブーコンシステントハッシュを使用するかどうかを指定します。`false` にすると、従来の剰余に基づく配置に戻ります。この設定は `fe.conf` でのみ指定でき、再起動後に有効になります。

#### `meta_service_rpc_rate_limit_enabled` {#meta_service_rpc_rate_limit_enabled}

デフォルト：true（4.1.5 より前は false）

動的設定：可能

バージョン 4.1.4 で追加されました。FE から Meta Service への RPC に対する QPS レート制限を評価するかどうかを指定します。バージョン 4.1.5 以降は `meta_service_rpc_rate_limit_dry_run` とともにデフォルトで有効です。そのため、デフォルトの動作では要求を待機・拒否せず、推定待機時間と拒否件数のみを記録します。レート制限を適用するには、この設定を `true` のままにし、dry-run を `false` に設定します。

#### `meta_service_rpc_rate_limit_dry_run` {#meta_service_rpc_rate_limit_dry_run}

デフォルト：true

動的設定：可能

Master FE ノード固有：いいえ

バージョン 4.1.5 以降でサポートされます。`meta_service_rpc_rate_limit_enabled=true` の場合のみ有効です。`true` の場合は、要求を待機・拒否せずにレート制限を評価してメトリクスを記録します。`false` の場合は、設定された QPS、バーストウィンドウ、待機タイムアウトを適用します。dry-run モードの待機メトリクスは推定待機時間を示します。

#### `meta_service_rpc_rate_limit_default_qps_per_core` {#meta_service_rpc_rate_limit_default_qps_per_core}

デフォルト：50

動的設定：可能

バージョン 4.1.4 で追加されました。`meta_service_rpc_rate_limit_qps_per_core_config` で個別に設定されていない Meta Service RPC メソッドに対し、CPU コアごとに許可するデフォルトの QPS です。`0` 以下はレート制限なしを意味します。

#### `meta_service_rpc_rate_limit_qps_per_core_config` {#meta_service_rpc_rate_limit_qps_per_core_config}

デフォルト：`getPartitionVersion:500;getTableVersion:500;getTabletStats:50;beginTxn:50`

動的設定：可能

バージョン 4.1.4 で追加されました。Meta Service RPC メソッドごとの CPU コア当たりの QPS 制限を、`method1:qps1;method2:qps2` 形式で指定します。`0` 以下の値を指定したメソッドにはレート制限が適用されません。

#### `meta_service_rpc_rate_limit_burst_seconds` {#meta_service_rpc_rate_limit_burst_seconds}

デフォルト：2（s）

動的設定：可能

バージョン 4.1.4 で追加されました。Meta Service RPC のレート制限におけるバーストウィンドウの長さを秒単位で指定します。長期的な平均 QPS は変わりませんが、この時間内のバーストは許可されます。

#### `meta_service_rpc_rate_limit_wait_timeout_ms` {#meta_service_rpc_rate_limit_wait_timeout_ms}

デフォルト：1000（ms）

動的設定：可能

バージョン 4.1.4 で追加されました。RPC がレート制限を受けたときに待機する最大時間をミリ秒単位で指定します。`0` は待機しないことを意味し、要求は直ちに失敗します。
