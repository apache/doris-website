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

# FE 設定 {#fe-configuration}

このドキュメントでは、FE の設定項目について説明します。

FE の設定ファイル `fe.conf` は通常、FE のデプロイ先にある `conf/` ディレクトリに保存されます。バージョン 0.14 では、別の設定ファイル `fe_custom.conf` が導入されます。このファイルには、運用中にユーザーが動的に変更して永続化した設定項目が記録されます。

FE プロセスの起動後、まず `fe.conf`、次に `fe_custom.conf` の設定項目が読み込まれます。同じ設定項目が両方にある場合は、`fe_custom.conf` の値が `fe.conf` の値を上書きします。

`fe_custom.conf` の保存場所は、`fe.conf` の `custom_config_dir` 設定項目で指定できます。

## 設定項目の確認 {#view-configuration-items}

FE の設定項目は次の二つの方法で確認できます。

1. FE の Web ページ

    ブラウザーで FE の Web ページ `http://fe_host:fe_http_port/variable` を開きます。現在有効な FE の設定項目が `Configure Info` に表示されます。

2. コマンドで確認する

    FE の起動後、MySQL クライアントで次のコマンドを実行すると FE の設定項目を確認できます。コマンドの詳細は [SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG) を参照してください。

    `SHOW FRONTEND CONFIG;`

    結果の列の意味は次のとおりです。

    * Key: 設定項目の名前。
    * Value: 設定項目の現在の値。
    * Type: 設定値の型（整数や文字列など）。
    * IsMutable: 動的に変更できるかどうか。true の場合は実行中に変更できます。false の場合は `fe.conf` でのみ設定でき、FE の再起動後に有効になります。
    * MasterOnly: Master FE ノード固有の設定項目かどうか。true の場合は Master FE ノードでのみ意味を持ち、他の種類の FE ノードには適用されません。false の場合はすべての種類の FE ノードで意味を持ちます。
    * Comment: 設定項目の説明。

## 設定項目の変更 {#set-configuration-items}

FE の設定項目は次の二つの方法で変更できます。

1. 静的設定

    `conf/fe.conf` ファイルに設定項目を追加して値を指定します。`fe.conf` の設定項目は FE プロセスの起動時に読み込まれます。`fe.conf` に記載のない項目にはデフォルト値が使用されます。

2. MySQL プロトコルによる動的設定

    FE の起動後、次のコマンドで設定項目を動的に変更できます。このコマンドには管理者権限が必要です。

    `ADMIN SET FRONTEND CONFIG (" fe_config_name "=" fe_config_value ");`

    すべての設定項目が動的変更に対応しているわけではありません。対応状況は `IsMutable` 列で確認できます。この列は `SHOW FRONTEND CONFIG;` の結果に含まれます。

    `MasterOnly` の設定項目を変更すると、コマンドは Master FE に転送され、Master FE 上の該当項目だけが変更されます。

    **この方法で変更した設定項目は、FE プロセスの再起動後に失効します。**

    このコマンドの詳細は、`HELP ADMIN SET CONFIG;` を実行して確認できます。

3. HTTP プロトコルによる動的設定

    詳細は [設定変更アクション](../open-api/fe-http/set-config-action) を参照してください。

    この方法では変更した設定項目を永続化することもできます。設定項目は `fe_custom.conf` に保存され、FE の再起動後も有効です。

## 例 {#examples}

1. `async_pending_load_task_pool_size` の変更

    `SHOW FRONTEND CONFIG;` で、この設定項目は動的に変更できないこと（`IsMutable` が false）を確認できます。`fe.conf` に次の行を追加します。

    `async_pending_load_task_pool_size = 20`

    その後、設定を有効にするために FE プロセスを再起動します。

2. `dynamic_partition_enable` の変更

    `SHOW FRONTEND CONFIG;` で、この設定項目は動的に変更でき（`IsMutable` が true）、Master FE 固有の項目であることを確認できます。任意の FE に接続し、次のコマンドを実行して変更します。

    ```
    ADMIN SET FRONTEND CONFIG ("dynamic_partition_enable" = "true"); `
    ```

    変更後の値は、次のコマンドで確認できます。

    ```
    set forward_to_master = true;
    SHOW FRONTEND CONFIG;
    ```

    上記の方法で変更した設定は、Master FE の再起動または Master の再選出後に失効します。永続的に設定するには、`fe.conf` に設定項目を直接追加して FE を再起動します。

3. `max_distribution_pruner_recursion_depth` の変更

    `SHOW FRONTEND CONFIG;` で、この設定項目は動的に変更でき（`IsMutable` が true）、Master FE 固有ではないことを確認できます。

    同様に、設定コマンドで動的に変更できます。この設定は Master FE 固有ではないため、すべての FE に変更を反映するには、各 FE に個別に接続して設定を変更します。

## 設定項目 {#configurations}

### メタデータとクラスター {#metadata-and-cluster}

#### `meta_dir`

デフォルト値：DORIS_HOME_DIR + "/doris-meta"

型: string 説明: Doris のメタデータはここに保存されます。このディレクトリには、次の条件を満たすストレージを強く推奨します。

* 高い書き込み性能（SSD）
* 安全性（RAID）

#### `catalog_try_lock_timeout_ms`

デフォルト値：5000  （ms）

動的変更可能：true

カタログロックの tryLock タイムアウトです。通常、テスト時を除いて変更する必要はありません。

#### `enable_bdbje_debug_mode`

デフォルト値：false

true に設定すると、FE は BDBJE デバッグモードで起動します。

#### `max_bdbje_clock_delta_ms`

デフォルト値：5000 （5s）

Master FE ホストと非 Master FE の間で許容する最大時刻差を設定します。非 Master FE が BDBJE 経由で Master FE に接続するたびに確認され、時刻差がこの値を超えると接続は中止されます。

#### `metadata_failure_recovery`

デフォルト値：false

true の場合、FE は BDBJE レプリケーショングループをリセットし（選出可能なすべてのノードの情報を削除し）、Master として起動しようとします。選出可能なノードをすべて起動できない場合は、メタデータを別のノードにコピーし、この設定を true にして FE の再起動を試せます。

#### `txn_rollback_limit`

デフォルト値：100

グループへの再参加時に BDBJE がロールバックできるトランザクションの最大数です。

#### `grpc_threadmgr_threads_nums`

デフォルト値: 4096

grpc_threadmgr で gRPC イベントを処理するスレッド数です。

#### `bdbje_replica_ack_timeout_second`

デフォルト値：10  (s)

BDBJE への書き込み時のレプリカ応答タイムアウトです。大きめのログを書き込む際に応答がタイムアウトし、ログの書き込みに失敗する場合は、この値を適宜増やしてください。

#### `bdbje_lock_timeout_second`

デフォルト値：5

BDBJE 操作のロックタイムアウトです。FE の WARN ログに LockTimeoutException が多発する場合は、この値を増やしてみてください。

#### `bdbje_heartbeat_timeout_second`

デフォルト値：30

Master と Follower 間の BDBJE ハートビートのタイムアウトです。デフォルトは BDBJE と同じ 30 秒です。一時的なネットワーク障害や予期しない長時間の Java GC による誤検知を減らしたい場合は、この値を増やせます。

#### `replica_ack_policy`

デフォルト値：SIMPLE_MAJORITY

選択肢: ALL, NONE, SIMPLE_MAJORITY

BDBJE のレプリカ応答ポリシーです。詳細は <http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.ReplicaAckPolicy.html> を参照してください。

#### `replica_sync_policy`

デフォルト値：SYNC

選択肢：SYNC, NO_SYNC, WRITE_NO_SYNC

BDBJE の Follower FE 同期ポリシーです。

#### `master_sync_policy`

デフォルト値：SYNC

選択肢：SYNC, NO_SYNC, WRITE_NO_SYNC

BDBJE の Master FE 同期ポリシーです。Follower FE を一台だけ配置する場合は 'SYNC' に設定します。Follower FE を 3 台より多く配置する場合は、この項目と次の 'replica_sync_policy' を WRITE_NO_SYNC に設定できます。詳細は <http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.SyncPolicy.html> を参照してください。

#### `bdbje_reserved_disk_bytes`

レプリケートされた JE 環境で保持する予約領域のバイト数の上限目標値です。

デフォルト値: 1073741824

動的変更可能: false

Master FE 専用: false

#### `ignore_meta_check`

デフォルト値：false

動的変更可能：true

true の場合、Master FE と非 Master FE 間のメタデータ遅延が *meta_delay_toleration_second* を超えても、非 Master FE はその遅延を無視して読み取りサービスを提供します。
Master FE を比較的長く停止する必要がある一方で、非 Master FE に読み取りサービスを継続させたい場合に役立ちます。

#### `meta_delay_toleration_second`

デフォルト値: 300（5 分）

メタデータの遅延が *meta_delay_toleration_second* を超えると、非 Master FE はサービスの提供を停止します。

#### `edit_log_port`

デフォルト値：9010

BDBJE のポートです。

#### `edit_log_type`

デフォルト値：BDB

編集ログの種類です。
BDB: BDBJE にログを書き込みます。
LOCAL: 非推奨です。

#### `edit_log_roll_num`

デフォルト値：50000

動的変更可能：true

Master FE 専用：true

Master FE は *edit_log_roll_num* 件のメタジャーナルごとにイメージを保存します。

#### `force_do_metadata_checkpoint`

デフォルト値：false

動的変更可能：true

Master FE 専用：true

true に設定すると、チェックポイントスレッドは JVM のメモリ使用率に関係なくチェックポイントを作成します。

#### `metadata_checkpoint_memory_threshold`

デフォルト値：60  （60%）

動的変更可能：true

Master FE 専用：true

JVM のメモリ使用率（ヒープまたは Old 世代のメモリプール）がこのしきい値を超えると、OOM を防ぐためにチェックポイントスレッドは動作しません。

#### `max_same_name_catalog_trash_num`

カタログのごみ箱に保持する、同名のメタデータの最大数を設定します。上限を超えると、最も早く削除されたメタデータは完全に削除され、復元できなくなります。0 は同名オブジェクトを保持しないこと、0 未満は制限なしを意味します。

注意: 同名かどうかの判定範囲には制限があります。データベースは同じクラスター内、テーブルは同じデータベース（同じデータベース ID）内、パーティションは同じデータベース（同じデータベース ID）かつ同じテーブル（同じテーブル ID）内で判定されます。

デフォルト値: 3

動的変更可能: true

Master FE 専用: true

#### `cluster_id`

デフォルト値：-1

FE または BE ノードは、クラスター ID が同じ場合、同じ Doris クラスターに属すると見なされます。クラスター ID は通常、Master FE の初回起動時に生成されるランダムな整数ですが、指定することもできます。

#### `heartbeat_mgr_blocking_queue_size`

デフォルト値：1024

Master FE 専用：true

heartbeat_mgr でハートビートタスクを保持するブロッキングキューのサイズです。

#### `heartbeat_mgr_threads_num`

デフォルト値：8

Master FE 専用：true

heartbeat_mgr でハートビートイベントを処理するスレッド数です。

#### `disable_cluster_feature`

デフォルト値：true

動的変更可能：true

マルチクラスター機能はバージョン 0.12 で非推奨になります。この項目を true にすると、次のクラスター関連操作がすべて無効になります。

1. クラスターの作成と削除
2. 空き Backend の追加、クラスターへの Backend の追加、クラスターのバランス調整を伴う廃止
3. クラスター内の Backend 数の変更
4. データベースのリンクと移行

#### `enable_fqdn_mode`

この設定は主に k8s クラスター環境で使用します。enable_fqdn_mode が true の場合、BE を配置した Pod を再作成しても Pod 名は変わりませんが、IP アドレスは変わる場合があります。

デフォルト値: false

動的変更可能: false

Master FE 専用: true

#### `enable_token_check`

デフォルト値：true

前方互換性のための設定で、将来削除されます。イメージファイルのダウンロード時にトークンを確認します。

#### `fe_meta_auth_token`

デフォルト値: ""（空文字列）

動的変更可能: false

FE ノード間の FE メタサービス HTTP エンドポイント（`image`、`role`、`check`、`put`、`journal_id` など）を認証するためのクラスタートークンです。Doris 4.0 系列では 4.0.8、4.1 系列では 4.1.4 で追加されました。

空でない値を設定すると、これらのエンドポイントでは既存のノードホスト確認に加えて、一致するトークンヘッダーの提示が必要になります。これにより、クラスター外のノードによる FE メタデータエンドポイントへのアクセスを防ぎます。空のままにすると従来のノードホスト確認のみが適用されるため、既存クラスターとローリングアップグレードには影響しません。

:::caution 注意

この設定は **すべての FE** で同じ値にし、有効化する前に `fe.conf` に記述してください。値が異なると、FE 間のメタデータ要求が拒否され、メタデータの同期に失敗します。

:::

#### `enable_multi_tags`

デフォルト値: false

動的変更可能: false

Master FE 専用: true

単一 BE の複数タグ機能を有効にするかどうかです。

#### `initial_root_password`

root ユーザーの初期パスワードを、2 段階の SHA-1 で暗号化した形式で設定します。デフォルトの '' は root パスワードなしを意味します。その後の root ユーザーに対する `set password` 操作は、初期パスワードを上書きします。

例: 平文のパスワード `root@123` を設定する場合は、Doris SQL の `select password('root@123')` を実行すると、暗号化されたパスワード `*A00C34073A26B40AB4307650BFB9309D6BFA6999` を生成できます。

デフォルト値: 空文字列

動的変更可能: false

Master FE 専用: true

#### `enable_cooldown_replica_affinity`

スキャン時にクールダウン済みレプリカを優先するかどうかを選択します。デフォルトは true です。

デフォルト値: true

動的変更可能: true

Master FE 専用: false

### サービス {#service}

#### `query_port`

デフォルト値：9030

FE の MySQL サーバーポートです。

#### `arrow_flight_sql_port`

デフォルト値：-1

Arrow Flight SQL サーバーポートです。

#### `frontend_address`

状態: 非推奨です。使用は推奨されず、将来削除される可能性があります。

型: string

説明: *InetAddress.getByName* で取得せずに FE の IP アドレスを明示的に設定します。通常は、*InetAddress.getByName* で期待する結果が得られない場合に使用します。ホスト名はサポートされず、IP アドレスのみ指定できます。

デフォルト値: 0.0.0.0

#### `priority_networks`

デフォルト値：なし

複数の IP アドレスを持つサーバーの選択ルールを指定します。一致する IP アドレスは最大一つである必要があります。CIDR 表記の値をセミコロンで区切って指定します（例: 10.10.10.0/24）。一致する IP アドレスがない場合は、ランダムに一つ選択します。

#### `http_port`

デフォルト値：8030

HTTP のバインドポートです。現時点では、すべての FE で同じ HTTP ポートを使用する必要があります。

#### `https_port`

デフォルト値：8050

HTTPS のバインドポートです。現時点では、すべての FE で同じ HTTPS ポートを使用する必要があります。

#### `enable_https`

デフォルト値：false

HTTPS を有効にするフラグです。false の場合は HTTP をサポートします。true の場合は HTTP と HTTPS の両方をサポートし、HTTP リクエストは自動的に HTTPS へリダイレクトされます。
enable_https が true の場合は、fe.conf に SSL 証明書の情報を設定する必要があります。

#### `enable_ssl`

デフォルト値：true

true に設定すると、Doris は MySQL との間に SSL プロトコルによる暗号化チャネルを確立します。

#### `qe_max_connection`

デフォルト値：1024

FE あたりの最大接続数です。

#### `check_java_version`

デフォルト値：true

Doris はコンパイル時と実行時の Java バージョンの互換性を確認します。互換性がない場合はバージョン不一致の例外を出し、起動を中止します。

#### `rpc_port`

デフォルト値：9020

FE の Thrift サーバーポートです。

#### `thrift_server_type`

FE の Thrift サービスで使用するサービスモデルを表します。型は String で、大文字と小文字は区別されません。

この値が 'SIMPLE' の場合は 'TSimpleServer' モデルを使用します。通常、本番環境には適さず、テスト用途に限定されます。

この値が 'THREADED' の場合は 'TThreadedSelectorServer' モデルを使用します。これは非ブロッキング I/O の master-slave Reactor モデルで、多数の同時接続要求に迅速に応答でき、ほとんどの状況で良好な性能を発揮します。

この値が `THREAD_POOL` の場合は `TThreadPoolServer` モデルを使用します。これはブロッキング I/O モデルで、スレッドプールでユーザー接続を処理します。同時接続数はプールのスレッド数に制限されます。同時要求数を事前に見積もることができ、十分なスレッド資源を確保できる場合に良好な性能を発揮します。デフォルトのサービスモデルです。

#### `thrift_server_max_worker_threads`

デフォルト値：4096

Thrift サーバーのワーカースレッドの最大数です。

#### `thrift_backlog_num`

デフォルト値：1024

Thrift サーバーの backlog_num です。この値を増やす場合は、Linux の /proc/sys/net/core/somaxconn の設定値より大きいことを確認してください。

#### `thrift_client_timeout_ms`

デフォルト値：0

Thrift サーバーの接続タイムアウトおよびソケットタイムアウトの設定です。

読み取りタイムアウトを防ぐため、thrift_client_timeout_ms の値はゼロに設定されています。

#### `thrift_max_message_size`

デフォルト値: 100MB

Thrift サーバーが受信するメッセージの最大サイズ（バイト単位）です。クライアントが送信したメッセージがこの制限を超えると、Thrift サーバーは要求を拒否して接続を閉じます。その結果、クライアントには "connection has been closed by peer." というエラーが表示されます。この場合は、値を増やしてみてください。

#### `use_compact_thrift_rpc`

デフォルト値: true

クエリプランの構造を圧縮形式で送信するかどうかです。有効にすると構造のサイズを約 50% 削減でき、一部の "send fragment timeout" エラーを回避できます。
ただし、小規模なクエリが高い同時実行数で処理される場合、同時実行性能が約 10% 低下することがあります。

#### `grpc_max_message_size_bytes`

デフォルト値：1G

gRPC クライアントチャネルの初期フローウィンドウサイズと最大メッセージサイズを設定します。結果セットが大きい場合は、この値を増やす必要があることがあります。

#### `max_mysql_service_task_threads_num`

デフォルト値：4096

Task イベントを処理するスレッド数です。

#### `mysql_service_io_threads_num`

デフォルト値：4

FE が NIO モデルの MySQL サーバーを起動する場合に、I/O イベントを処理するスレッド数です。

#### `mysql_nio_backlog_num`

デフォルト値：1024

MySQL NIO サーバーの backlog_num です。この値を増やす場合は、Linux の /proc/sys/net/core/somaxconn の値も同時に増やしてください。

#### `broker_timeout_ms`

デフォルト値：10000   （10s）

Broker RPC のデフォルトタイムアウトです。

#### `backend_rpc_timeout_ms`

FE から BE に RPC 要求を送信する際のタイムアウト（ミリ秒）です。

デフォルト値: 60000

動的変更可能: false

Master FE 専用: true

#### `drop_backend_after_decommission`

デフォルト値：false

動的変更可能：true

Master FE 専用：true

1. この設定は、BE の廃止が成功した後に、その BE を削除するかどうかを制御します。true の場合はオフライン化が成功した後に BE ノードを削除します。false の場合は BE が DECOMMISSION 状態のまま残り、削除されません。

   この設定は特定の状況で役立ちます。たとえば、各 BE ノードにディスクが一つある Doris クラスターに、後から各 BE ごとに新しいディスクを 2 台追加したとします。Doris は現時点で BE 内のディスク間データバランシングに対応していないため、元のディスクのデータ量が新しいディスクよりも大幅に多い状態が続くことがあります。その場合は次の操作でディスク間のバランスを手動で調整できます。

   1. この設定項目を false にします。
   2. 対象 BE ノードを廃止します。これにより、その BE 上の全データが他のノードに移行されます。
   3. 廃止操作が完了しても BE は削除されません。この時点で BE の廃止状態を解除します。すると、他の BE ノードからデータが戻り始め、この BE のすべてのディスクに均等に分散されます。
   4. すべての BE ノードに対して手順 2 と 3 を順番に実行し、全ノードでディスク間のバランスを調整します。

#### `max_backend_down_time_second`

デフォルト値: 3600（1 時間）

動的変更可能：true

Master FE 専用：true

Backend が *max_backend_down_time_second* の間停止すると、BACKEND_DOWN イベントが発生します。

#### `disable_backend_black_list`

BE のブラックリスト機能を無効にします。無効化後は、BE へのクエリ要求が失敗してもその BE はブラックリストに追加されません。
この項目は、一時的な不具合によって多数の回帰テストが失敗することを減らすため、回帰テスト環境に適しています。

デフォルト値: false

動的変更可能: true

Master FE 専用: false

#### `max_backend_heartbeat_failure_tolerance_count`

許容する BE ノードのハートビート失敗回数の上限です。連続失敗回数がこの値を超えると、BE の状態は dead に設定されます。
この項目は、一時的なハートビート失敗によって多数の回帰テストが失敗することを減らすため、回帰テスト環境に適しています。

デフォルト値: 1

動的変更可能: true

Master FE 専用: true

### `abort_txn_after_lost_heartbeat_time_second`

ハートビート喪失後にトランザクションを中止するまでの時間です。デフォルト値 300 は、BE のハートビート喪失から 300 秒後にトランザクションを中止することを意味します。

デフォルト値: 300(s)

動的変更可能: true

Master FE 専用: true

#### `enable_access_file_without_broker`

デフォルト値：false

動的変更可能：true

Master FE 専用：true

Broker 経由で BOS またはその他のクラウドストレージにアクセスする際に、Broker の使用を省略するかどうかを指定します。

#### `agent_task_resend_wait_time_ms`

デフォルト値：5000

動的変更可能：true

Master FE 専用：true

この設定は、agent_task の create_time が設定されている場合に、エージェントタスクを再送するかどうかを決定します。ReportHandler が再送できるのは、current_time - create_time > agent_task_resend_wait_time_ms の場合だけです。

現時点では主に `PUBLISH_VERSION` エージェントタスクが繰り返し送信される問題への対処に使用します。現在のデフォルト値 5000 は実験的な値です。

エージェントタスクを AgentTaskQueue に投入してから BE に送信するまでには遅延があるため、この値を増やすと重複送信の問題を効果的に抑えられます。

一方で、送信または実行に失敗したエージェントタスクが再実行されるまでの時間も長くなります。

#### `max_agent_task_threads_num`

デフォルト値：4096

Master FE 専用：true

エージェントタスク用スレッドプールでタスクを処理するスレッドの最大数です。

#### `remote_fragment_exec_timeout_ms`

デフォルト値：30000  （ms）

動的変更可能：true

非同期リモートフラグメントの実行タイムアウトです。通常は短時間で実行されますが、システムの負荷が高い場合はタイムアウトを長くしてみてください。

#### `auth_token`

デフォルト値：空

内部認証に使用するクラスタートークンです。

#### `enable_http_server_v2`

デフォルト値: 正式版 0.14.0 以降は true、それ以前は false です。

HTTP Server V2 は SpringBoot で実装され、フロントエンドとバックエンドを分離する構成です。新しいフロントエンド UI は、HTTPv2 が有効な場合にのみ使用できます。

#### `http_api_extra_base_path`

一部のデプロイ環境では、HTTP API に共通の接頭辞となる追加のベースパスが必要です。この項目でその接頭辞を指定します。
設定後、`GET /api/basepath` インターフェースで値を取得できます。新しい UI もまずこのベースパスを取得して URL を組み立てます。`enable_http_server_v2` が true の場合にのみ有効です。

デフォルトは空で、未設定を意味します。

#### `jetty_server_acceptors`

デフォルト値：2

#### `jetty_server_selectors`

デフォルト値：4

#### `jetty_server_workers`

デフォルト値：0

上記三つの項目で構成される Jetty のスレッドモデルは、acceptors、selectors、workers の三種類のスレッドプールに分かれます。acceptors が新しい接続を受け付け、selectors に渡して HTTP メッセージプロトコルを解析し、最後に workers が要求を処理します。最初の二つは非ブロッキングモデルを使用し、一つのスレッドで多数のソケットの読み書きを処理できるため、少数のスレッドで済みます。

ほとんどの場合、acceptors は 1～2 スレッド、selectors は 2～4 スレッドで十分です。workers はブロッキング処理やデータベース操作を担うことが多く、多数のスレッドを必要とします。必要数はアプリケーションの QPS と I/O イベントの割合によって変わります。QPS が高いほど、また I/O の割合が高く待機スレッドが多いほど、必要な総スレッド数も増えます。

workers のスレッドプールはデフォルトでは設定されないため、必要に応じて指定してください。

#### `jetty_server_max_http_post_size`

デフォルト値：`100 * 1024 * 1024`  （100MB）

PUT または POST メソッドでアップロードできるファイルの最大バイト数です。デフォルトは 100MB です。

#### `jetty_server_max_http_header_size`

デフォルト値：1048576  （1M）

HTTP ヘッダーサイズの設定です。デフォルトは 1M です。

#### `http_sql_submitter_max_worker_threads`

デフォルト値：2

HTTP SQL submitter のワーカースレッドの最大数です。

#### `http_load_submitter_max_worker_threads`

デフォルト値：2

HTTP upload submitter のワーカースレッドの最大数です。

:::caution 動作の変更（4.1.4）

`/api/upload` エンドポイントはバージョン 4.1.4 で削除され、この設定項目も同時に削除されました。詳細は [アップロードアクション](../open-api/fe-http/upload-action) を参照してください。

:::

### クエリエンジン {#query-engine}

#### `default_max_query_instances`

ユーザープロパティ max_query_instances が 0 以下の場合に使用されるデフォルト値です。ユーザーあたりのインスタンス数の上限を設定します。この項目が 0 以下の場合、制限はありません。

デフォルト値は -1 です。

#### `max_query_retry_time`

デフォルト値：3

動的変更可能：true

クエリの再試行回数です。RPC 例外が発生し、まだユーザーに結果を送信していない場合、クエリが再試行されることがあります。障害の連鎖を避けるため、この値を減らすこともできます。

#### `max_dynamic_partition_num`

デフォルト値：500

動的変更可能：true

Master FE 専用：true

動的パーティションテーブルの作成時に、一度に作成されるパーティション数の上限を指定します。パーティション数は動的パーティションの "start" と "end" で決まります。

#### `dynamic_partition_enable`

デフォルト値：true

動的変更可能：true

Master FE 専用：true

動的パーティションスケジューラーを有効にするかどうかです。デフォルトで有効です。

#### `dynamic_partition_check_interval_seconds`

デフォルト値：600 （s）

動的変更可能：true

Master FE 専用：true

動的パーティションを確認する間隔を指定します。

#### `max_multi_partition_num`

デフォルト値：4096

動的変更可能：true

Master FE 専用：true

複数パーティションのパーティション名の接頭辞を設定します。複数パーティションにのみ適用され、動的パーティションには適用されません。デフォルトの接頭辞は "p_" です。

#### `multi_partition_name_prefix`

デフォルト値：p_

動的変更可能：true

Master FE 専用：true

複数パーティションのパーティション名の接頭辞を設定します。複数パーティションにのみ適用され、動的パーティションには適用されません。デフォルトの接頭辞は "p_" です。

#### `partition_in_memory_update_interval_secs`

デフォルト値：300 (s)

動的変更可能：true

Master FE 専用：true

メモリ内のグローバルパーティション情報を更新する間隔です。

#### `enable_concurrent_update`

デフォルト値：false

動的変更可能：false

Master FE 専用：true

同時更新を有効にするかどうかです。

#### `lower_case_table_names`

デフォルト値：0

動的変更可能：false

Master FE 専用：true

この設定はクラスターの初期化時にのみ指定でき、初期化後のクラスターの
再起動やアップグレード時には変更できません。

0: テーブル名を指定どおりに保存し、大文字と小文字を区別して比較します。
1: テーブル名を小文字で保存し、大文字と小文字を区別せずに比較します。
2: テーブル名を指定どおりに保存しますが、小文字として比較します。

#### `table_name_length_limit`

デフォルト値：64

動的変更可能：true

Master FE 専用：true

テーブル名の最大長を指定します。

#### `cache_enable_sql_mode`

デフォルト値：true

動的変更可能：true

Master FE 専用：false

このスイッチを有効にすると、SQL クエリの結果セットがキャッシュされます。クエリ対象の全テーブルの全パーティションについて、最終アクセス時のバージョンからの経過時間が cache_last_version_interval_second を超え、結果の行数が cache_result_max_row_count 未満で、データサイズが cache_result_max_data_size 未満の場合、結果セットがキャッシュされます。次に同じ SQL を実行するとキャッシュが使用されます。

true に設定すると、FE の SQL 結果キャッシュが有効になります。オフラインでデータを更新する場合に適しています。

|                        | ケース 1 | ケース 2 | ケース 3 | ケース 4 |
| ---------------------- | ----- | ----- | ----- | ----- |
| enable_sql_cache       | false | true  | true  | false |
| enable_partition_cache | false | false | true  | true  |

#### `cache_enable_partition_mode`

デフォルト値：true

動的変更可能：true

Master FE 専用：false

true に設定すると、FE は BE のキャッシュからデータを取得します。一部のパーティションをリアルタイムで更新する場合に適しています。

#### `cache_result_max_row_count`

デフォルト値：3000

動的変更可能：true

Master FE 専用：false

メモリの過剰使用を避けるため、キャッシュできる行数はデフォルトで最大 3000 行です。このしきい値を超えるとキャッシュされません。

#### `cache_result_max_data_size`

デフォルト値: 31457280

動的変更可能: true

Master FE 専用: false

メモリの過剰使用を避けるため、キャッシュできる行のデータサイズはデフォルトで最大 10MB です。このしきい値を超えるとキャッシュされません。

#### `cache_last_version_interval_second`

デフォルト値：30

動的変更可能：true

Master FE 専用：false

テーブルの最新パーティションバージョンの時間間隔とは、データ更新から現在のバージョンまでの時間を指します。通常は 900 秒に設定し、オフラインとリアルタイムのインポートを区別します。

#### `max_allowed_in_element_num_of_delete`

デフォルト値：1024

動的変更可能：true

Master FE 専用：true

DELETE 文の InPredicate に含められる要素数を制限します。

#### `max_running_rollup_job_num_per_table`

デフォルト値：1

動的変更可能：true

Master FE 専用：true

Rollup ジョブの同時実行数の上限を設定します。

#### `max_distribution_pruner_recursion_depth`

デフォルト値：100

動的変更可能：true

Master FE 専用：false

ハッシュ分散プルーナーの再帰深度の上限を設定します。
例: where a in（5 要素）and b in（4 要素）and c in（3 要素）and d in（2 要素）。
a/b/c/d が分散列の場合、再帰深度は 5 *4* 3 * 2 = 120 となり、100 を超えます。
そのため、分散プルーナーは動作せず、すべてのバケットを返します。
深度を増やすと、より多くの要素に対して分散プルーニングを適用できますが、CPU 使用量が増える可能性があります。

#### `enable_local_replica_selection`

デフォルト値：false

動的変更可能：true

true に設定すると、Planner はこの Frontend と同じホストにある Tablet のレプリカを優先して選択します。
次の条件ではネットワーク転送量を減らせる可能性があります。

* N 台のホストに N 台の Backend と N 台の Frontend が配置されている。

* データのレプリカが N 個ある。

* 同時実行数の多いクエリがすべての Frontend に均等に送られる。

この場合、各 Frontend はローカルのレプリカだけでクエリを実行できます。ローカルのレプリカが利用できないときに非ローカルのレプリカへ切り替えるには、enable_local_replica_selection_fallback を true に設定します。

#### `enable_local_replica_selection_fallback`

デフォルト値：false

動的変更可能：true

enable_local_replica_selection と併用します。ローカルのレプリカが利用できない場合に、非ローカルのレプリカへ切り替えます。

#### `expr_depth_limit`

デフォルト値：3000

動的変更可能：true

式ツリーの深度の上限です。上限を超えると、データベースの読み取りロックを保持したまま解析に長時間を要する可能性があります。十分に理解している場合を除き、この値を変更しないでください。

#### `expr_children_limit`

デフォルト値：10000

動的変更可能：true

式ツリーの子要素数の上限です。上限を超えると、データベースの読み取りロックを保持したまま解析に長時間を要する可能性があります。

#### `be_exec_version`

フラグメント間でブロックを受け渡す際のシリアライズ形式を定義します。

コードの変更によってブロックのデータ形式が変わることがあります。ローリングアップグレード中に BE 間の互換性を保つため、FE からデータバージョンを通知し、送信形式を決めます。

たとえば、クラスターに 2 台の BE があり、アップグレード済みの一方は最新の $v_1$ に対応し、もう一方は $v_0$ にしか対応していないとします。この時点では FE がまだアップグレードされていないため、$v_0$ が一律に通知され、BE は旧データ形式で通信します。すべての BE をアップグレードした後で FE をアップグレードすると、新しい FE が $v_1$ を通知し、クラスター全体が新しいデータ形式に切り替わります。

デフォルト値は `max_be_exec_version` です。特別な事情がある場合は形式のバージョンを手動で下げられますが、`min_be_exec_version` より低くしてはいけません。

この変数の値は常に、すべての BE の `BeExecVersionManager::min_be_exec_version` と `BeExecVersionManager::max_be_exec_version` の範囲内に保ってください。つまり、アップグレード済みクラスターをダウングレードする場合は FE、BE の順にダウングレードするか、設定でこの変数を手動で下げてから BE をダウングレードします。

#### `max_be_exec_version`

現在サポートされる最新のデータバージョンです。変更できません。対応するバージョンの BE にある `BeExecVersionManager::max_be_exec_version` と一致させる必要があります。

#### `min_be_exec_version`

現在サポートされる最も古いデータバージョンです。変更できません。対応するバージョンの BE にある `BeExecVersionManager::min_be_exec_version` と一致させる必要があります。

#### `max_query_profile_num`

クエリ Profile の最大数です。

デフォルト値: 100

動的変更可能: true

Master FE 専用: false

#### `publish_version_interval_ms`

デフォルト値：10 （ms）

二度の publish version 操作の最小間隔です。

#### `publish_version_timeout_second`

デフォルト値：30 （s）

動的変更可能：true

Master FE 専用：true

一つのトランザクションに属するすべての publish version タスクの完了を待つ最大時間です。

#### `query_colocate_join_memory_limit_penalty_factor`

デフォルト値：1

動的変更可能：true

Colocate Join の PlanFragment インスタンスの memory_limit = exec_mem_limit / min (query_colocate_join_memory_limit_penalty_factor, instance_num) です。

#### `rewrite_count_distinct_to_bitmap_hll`

デフォルト値: true

この変数はセッション変数であり、セッション単位で有効です。

* 型: boolean
* 説明: **AGG モデルのテーブルのみ**が対象です。true の場合、クエリに count(distinct c1) などの集約関数があり、c1 列の型が bitmap なら count distinct は bitmap_union_count(c1) に、c1 列の型が hll なら hll_union_agg(c1) に書き換えられます。false の場合は書き換えません。

### ロードとエクスポート {#load-and-export}

#### `enable_pipeline_load`

デフォルト値: true

動的変更可能: true

Streamload などのインポートタスクの実行に Pipeline エンジンを使用するかどうかです。

#### `enable_vectorized_load`

デフォルト値: true

ベクトル化ロードを有効にするかどうかです。

#### `enable_new_load_scan_node`

デフォルト値: true

ファイルスキャンノードを有効にするかどうかです。

#### `default_max_filter_ratio`

デフォルト値：0

動的変更可能：true

Master FE 専用：true

不規則なデータなどの理由でフィルタリングできるデータの最大割合です。デフォルト値は 0 です。

#### `max_running_txn_num_per_db`

デフォルト値：1000

動的変更可能：true

Master FE 専用：true

主に、同一データベースで同時に実行できるロードジョブの数を制御します。

クラスターで実行中のロードジョブが多すぎると、新しく送信したロードジョブで次のエラーが発生する場合があります。

```text
current running txns on db xxx is xx, larger than limit xx
```

このエラーは、クラスターで実行中のロードジョブ数が設定値を超えたことを示します。アプリケーション側で待機してからロードジョブを再試行することを推奨します。

Connector を使用する場合は、この値を適宜調整でき、数千に設定しても問題ありません。

#### `using_old_load_usage_pattern`

デフォルト値：false

動的変更可能：true

Master FE 専用：true

true に設定すると、INSERT 文の処理でエラーが発生してもラベルが返され、ユーザーはそのラベルでロードジョブの状態を確認できます。デフォルトの false では、INSERT 操作でエラーが発生すると、ラベルを返さずにクライアントへ直接例外が送られます。

#### `disable_load_job`

デフォルト値：false

動的変更可能：true

Master FE 専用：true

true に設定した場合:

* すべての保留中ロードジョブは、begin txn API の呼び出し時に失敗します。
* すべての準備済みロードジョブは、commit txn API の呼び出し時に失敗します。
* コミット済みのすべてのロードジョブは、公開待ちになります。

#### `commit_timeout_second`

デフォルト値：30

動的変更可能：true

Master FE 専用：true

一つのトランザクションで挿入したすべてのデータのコミットを待つ最大時間です。
これは "commit" コマンドのタイムアウト秒数です。

#### `max_unfinished_load_job`

デフォルト値：1000

動的変更可能：true

Master FE 専用：true

PENDING、ETL、LOADING、QUORUM_FINISHED を含むロードジョブ数の上限です。上限を超えると、新しいロードジョブを送信できません。

#### `db_used_data_quota_update_interval_secs`

デフォルト値：300 (s)

動的変更可能：true

Master FE 専用：true

Master のデーモンスレッドが、`db_used_data_quota_update_interval_secs` ごとに db txn manager のデータベース使用量クォータを更新します。

ロード性能を高めるため、ロード前にデータベースの使用量がクォータを超えているかを確認する際、使用量をリアルタイムで計算せず、デーモンスレッドが定期的に更新した値を使用します。

この設定は、データベースの使用量を更新する間隔を指定します。

#### `disable_show_stream_load`

デフォルト値：false

動的変更可能：true

Master FE 専用：true

SHOW STREAM LOAD を無効にし、メモリ内の Stream Load 記録を消去するかどうかです。

#### `max_stream_load_record_size`

デフォルト値：5000

動的変更可能：true

Master FE 専用：true

メモリに保存できる最近の Stream Load 記録の最大数のデフォルト値です。

#### `fetch_stream_load_record_interval_second`

デフォルト値：120

動的変更可能：true

Master FE 専用：true

Stream Load 記録を取得する間隔です。

#### `max_bytes_per_broker_scanner`

デフォルト値：`500 * 1024 * 1024 * 1024L`  （500G）

動的変更可能：true

Master FE 専用：true

一件の Broker Load ジョブで一つの Broker Scanner が処理できる最大バイト数です。通常、各 Backend に一つの Broker Scanner があります。

#### `default_load_parallelism`

デフォルト値: 8

動的変更可能：true

Master FE 専用：true

単一ノード上で実行する Broker Load プランのデフォルト並列度です。
Broker Load の送信時にユーザーが並列度を設定した場合、この項目は無視されます。
この項目は、`max broker concurrency` や `min bytes per broker scanner` などの設定とともに、インポートタスクの同時実行数を決めます。

#### `max_broker_concurrency`

デフォルト値：10

動的変更可能：true

Master FE 専用：true

Broker Scanner の最大同時実行数です。

#### `min_bytes_per_broker_scanner`

デフォルト値：67108864L (64M)

動的変更可能：true

Master FE 専用：true

一つの Broker Scanner が読み取る最小バイト数です。

#### `period_of_auto_resume_min`

デフォルト値：5 （s）

動的変更可能：true

Master FE 専用：true

Routine Load を自動再開する間隔です。

#### `max_tolerable_backend_down_num`

デフォルト値：0

動的変更可能：true

Master FE 専用：true

BE が一台でも停止している間、Routine Load は自動再開できません。

#### `max_routine_load_task_num_per_be`

デフォルト値：5

動的変更可能：true

Master FE 専用：true

BE あたりの Routine Load タスクの最大同時実行数です。BE に送る Routine Load タスク数を制限します。BE 側のタスクスレッドプールサイズを示す設定 'routine_load_thread_pool_size'（デフォルト 10）より小さくする必要があります。

#### `max_routine_load_task_concurrent_num`

デフォルト値：5

動的変更可能：true

Master FE 専用：true

一件の Routine Load ジョブにおけるタスクの最大同時実行数です。

#### `max_routine_load_job_num`

デフォルト値：100

NEED_SCHEDULED、RUNNING、PAUSE を含む Routine Load ジョブの最大数です。

#### `desired_max_waiting_jobs`

デフォルト値：100

動的変更可能：true

Master FE 専用：true

Routine Load とバージョン 2 の Load における待機ジョブ数のデフォルトの目標値です。Master の切り替えなどでは、実際の数が desired_max_waiting_jobs を超えることがあります。

#### `disable_hadoop_load`

デフォルト値：false

動的変更可能：true

Master FE 専用：true

Hadoop クラスターを使うロードは将来非推奨になります。true に設定すると、この種類のロードを無効にします。

#### `enable_spark_load`

デフォルト値：false

動的変更可能：true

Master FE 専用：true

Spark Load を一時的に有効にするかどうかです。デフォルトでは無効です。

**注意:** この項目はバージョン 1.2 で削除されました。spark_load はデフォルトで有効です。

#### `spark_load_checker_interval_second`

デフォルト値：60

Spark Load スケジューラーの実行間隔です。デフォルトは 60 秒です。

#### `async_loading_load_task_pool_size`

デフォルト値：10

動的変更可能：false

Master FE 専用：true

loading_load タスク実行プールのサイズです。同時に実行できる loading_load タスク数の上限を決めます。

現時点では Broker Load の loading_load タスクのみを制限します。

#### `async_pending_load_task_pool_size`

デフォルト値：10

動的変更可能：false

Master FE 専用：true

pending_load タスク実行プールのサイズです。同時に実行できる pending_load タスク数の上限を決めます。

現時点では Broker Load と Spark Load の pending_load タスクのみを制限します。

値は 'max_running_txn_num_per_db' より小さくする必要があります。

#### `async_load_task_pool_size`

デフォルト値：10

動的変更可能：false

Master FE 専用：true

旧バージョンとの互換性のためだけに残されています。async_loading_load_task_pool_size に置き換えられており、将来削除されます。

#### `enable_single_replica_load`

デフォルト値：false

動的変更可能：true

Master FE 専用：true

Stream Load と Broker Load で単一レプリカへの書き込みを有効にするかどうかです。

#### `min_load_timeout_second`

デフォルト値：1 （1s）

動的変更可能：true

Master FE 専用：true

すべての種類のロードに適用される最小 Stream Load タイムアウトです。

#### `max_stream_load_timeout_second`

デフォルト値: 259200（3 日）

動的変更可能：true

Master FE 専用：true

Stream Load のタイムアウト設定を制限します。ユーザーが大きなタイムアウト値を指定したために、失敗した Stream Load トランザクションを短時間でキャンセルできなくなることを防ぎます。

#### `max_load_timeout_second`

デフォルト値: 259200（3 日）

動的変更可能：true

Master FE 専用：true

Stream Load を除くすべてのロードに適用される最大タイムアウトです。

#### `stream_load_default_timeout_second`

デフォルト値: 86400 * 3（3 日）

動的変更可能：true

Master FE 専用：true

Stream Load とストリーミング Mini Load のデフォルトタイムアウトです。

#### `stream_load_default_precommit_timeout_second`

デフォルト値：3600（s）

動的変更可能：true

Master FE 専用：true

Stream Load の事前コミット時のデフォルトタイムアウトです。

#### `stream_load_default_memtable_on_sink_node`

デフォルト値：false

動的変更可能：true

Master FE 専用：true

Stream Load でシンクノード上の memtable をデフォルトで有効にします。
HTTP ヘッダー `memtable_on_sink_node` が設定されていない場合に適用されます。

#### `insert_load_default_timeout_second`

デフォルト値: 3600（1 時間）

動的変更可能：true

Master FE 専用：true

INSERT Load のデフォルトタイムアウトです。

#### `mini_load_default_timeout_second`

デフォルト値: 3600（1 時間）

動的変更可能：true

Master FE 専用：true

非ストリーミング Mini Load のデフォルトタイムアウトです。

#### `broker_load_default_timeout_second`

デフォルト値: 14400（4 時間）

動的変更可能：true

Master FE 専用：true

Broker Load のデフォルトタイムアウトです。

#### `spark_load_default_timeout_second`

デフォルト値: 86400（1 日）

動的変更可能：true

Master FE 専用：true

Spark Load のデフォルトタイムアウトです。

#### `hadoop_load_default_timeout_second`

デフォルト値: 86400 * 3（3 日）

動的変更可能：true

Master FE 専用：true

Hadoop Load のデフォルトタイムアウトです。

#### `load_running_job_num_limit`

デフォルト値：0

動的変更可能：true

Master FE 専用：true

ロードタスク数を制限します。デフォルトの 0 は制限なしを意味します。

#### `load_input_size_limit_gb`

デフォルト値：0

動的変更可能：true

Master FE 専用：true

Load ジョブが入力するデータサイズを制限します。デフォルトの 0 は制限なしを意味します。

#### `load_etl_thread_num_normal_priority`

デフォルト値：10

NORMAL 優先度の ETL Load ジョブの同時実行数です。十分に理解している場合を除き、変更しないでください。

#### `load_etl_thread_num_high_priority`

デフォルト値：3

HIGH 優先度の ETL Load ジョブの同時実行数です。十分に理解している場合を除き、変更しないでください。

#### `load_pending_thread_num_normal_priority`

デフォルト値：10

NORMAL 優先度の保留中ロードジョブの同時実行数です。十分に理解している場合を除き、変更しないでください。

#### `load_pending_thread_num_high_priority`

デフォルト値：3

HIGH 優先度の保留中ロードジョブの同時実行数です。ロードジョブの優先度には HIGH と NORMAL があり、すべての Mini Batch Load ジョブは HIGH、その他の種類は NORMAL です。優先度は、遅いロードジョブがスレッドを長時間占有することを防ぐための内部スケジューリング方針です。現時点ではジョブの優先度を手動で指定できません。十分に理解している場合を除き、この値を変更しないでください。

#### `load_checker_interval_second`

デフォルト値：5 （s）

ロードスケジューラーの実行間隔です。ロードジョブは PENDING、LOADING、FINISHED の順に状態が変わります。スケジューラーが PENDING から LOADING へ、トランザクションのコールバックが LOADING から FINISHED へ移行させます。同時実行数が上限に達していなければ、ジョブの完了までに要する追加時間は最大でこの間隔分です。

#### `s3_load_endpoint_white_list`

デフォルト値: 空

動的変更可能: false

S3 Load で使用を許可するエンドポイントのホワイトリストです。複数の値はカンマで区切ります（例: `s3_load_endpoint_white_list=a,b,c`）。空の場合はホワイトリストが設定されません。

:::caution 動作の変更（4.1.4）

セキュリティ上の理由から、バージョン 4.1.4 以降、この設定項目は **動的に変更できません**。`fe.conf` でのみ設定でき、FE の再起動後に有効になります。`ADMIN SET FRONTEND CONFIG` では変更できません。

:::

#### `resource_group_load_success_quorum`

デフォルト値: 空

動的変更可能: true

Master FE 専用: true

バージョン 4.1.4 で追加されました。ロードトランザクションのコミット時に、リソースグループ（BE の Location Tag）ごとに、そのグループ内で **書き込みが成功していなければならないレプリカの最小数** を設定します。

値はカンマ区切りのリストで、各項目の形式は `<resource_group>:<min_success_replicas>` です。`<min_success_replicas>` には負でない整数を指定します。例:

```properties
resource_group_load_success_quorum=group_a:2,group_b:1
```

トランザクションのコミット時に、設定したリソースグループで書き込みに成功したレプリカ数が指定値を下回ると、コミットは失敗します。設定にないリソースグループは検査されません。形式が不正な項目は無視され、`fe.log` に警告が出力されます。

複数のデータセンターやアベイラビリティーゾーンにデプロイする場合に、指定したデータセンターで所定数のレプリカへの書き込みが完了してからロードを成功と判定するために使用します。

#### `enable_adaptive_random_bucket_load`

デフォルト値: true

動的変更可能: true

Master FE 専用: true

バージョン 4.1.4 で追加されました。適応型ランダムバケットロードを有効にするかどうかです。

有効にすると、FE は Tablet の配置情報を BE に送信します。各 BE は、自身がプライマリレプリカを保持するローカルバケットを特定します。単一 Tablet への書き込み量がしきい値（デフォルトで 200 MB）を超えると、書き込み先をローカルバケット間で切り替えます。これにより、ランダムバケット化された（`DISTRIBUTED BY RANDOM`）テーブルのロード時のメモリ負荷が下がり、スループットが向上します。すべてのロード方式に適用されます。

この機能は BE の設定項目 `enable_table_memtable_flush_backpressure` と `table_memtable_flush_pending_count_limit` による制約も受けます。詳細は [BE 設定](./be-config) を参照してください。

#### `enable_forward_group_commit_stream_load_to_follower`

デフォルト値: false

動的変更可能: true

Master FE 専用: true

バージョン 4.1.4 で追加されました。Group Commit を使用する Stream Load 要求を Follower FE に転送するかどうかです。

有効にすると、Group Commit モードの Stream Load 要求をラウンドロビンで Follower FE に転送し、バッチ処理の負荷を複数の FE に分散します。

対象テーブルの `light_schema_change` プロパティが `false` の場合は転送がサポートされず、要求はエラーで失敗します。

#### `streaming_job_snapshot_offset_persist_interval_sec`

デフォルト値: 300 (s)

動的変更可能: true

Master FE 専用: true

バージョン 4.1.4 で追加されました。Streaming Job（継続ロードジョブ）のフルスナップショット段階で、オフセットを二度永続化する間の最小間隔（秒）です。値を小さくするとジョブ再起動後に再処理するデータ量が減りますが、メタデータの書き込み頻度が増えます。

#### `label_keep_max_second`

デフォルト値：`3 * 24 * 3600`（3 日）

動的変更可能：true

Master FE 専用：true

完了またはキャンセルされたロードジョブのラベルは、`label_keep_max_second` の経過後に削除されます。

1. 削除したラベルは再利用できます。
2. 時間を短くすると FE のメモリ使用量が減ります（削除まで、すべてのロードジョブの情報がメモリ内に保持されるため）。

書き込みが高頻度で、ジョブの滞留が多く、Frontend サービスの呼び出しが失敗する場合はログを確認してください。メタデータ書き込みでのロックに時間がかかりすぎる場合、この値を 12 時間または 6 時間以下に調整できます。

#### `streaming_label_keep_max_second`

デフォルト値: 43200（12 時間）

動的変更可能：true

Master FE 専用：true

INSERT、STREAMING LOAD、ROUTINE_LOAD_TASK などの高頻度なロード処理で、保持期間が過ぎた完了済みのジョブまたはタスクを削除します。

#### `label_clean_interval_second`

デフォルト値：1 * 3600（1 時間）

ロードラベルクリーナーは *label_clean_interval_second* ごとに実行され、期限切れのジョブを削除します。

#### `label_regex_length`

デフォルト値: 128（文字）

ロードラベルの最大文字数です。デフォルトは 128 文字です。

#### `transaction_clean_interval_second`

デフォルト値：30

トランザクションが可視または中止済みの場合、transaction_clean_interval_second 秒後に削除されます。この間隔をできるだけ短くし、各削除処理も迅速に終える必要があります。

#### `sync_commit_interval_second`

トランザクションをコミットするまでの最大時間間隔です。この時間を過ぎてもチャネル内に未送信のデータが残っている場合、コンシューマーがチャネルにトランザクションの送信を通知します。

デフォルト値: 10（秒）

動的変更可能: true

Master FE 専用: true

#### `sync_checker_interval_second`

データ同期ジョブの実行状態を確認する間隔です。

デフォルト値: 10 (s)

#### `max_sync_task_threads_num`

データ同期ジョブ用スレッドプールの最大スレッド数です。

デフォルト値：10

#### `min_sync_commit_size`

トランザクションをコミットするために必要なイベントの最小数です。FE が受信したイベント数がこれより少ない場合、`sync_commit_interval_second` を超えるまで次のデータバッチを待ちます。デフォルトは 10000 イベントです。変更する場合は、Canal 側の `canal.instance.memory.buffer.size`（デフォルト 16384）より小さくしてください。そうしないと、FE が ACK 前にストアのキュー長を超えるイベントを取得しようとし、タイムアウトまでキューがブロックされることがあります。

デフォルト値: 10000

動的変更可能: true

Master FE 専用: true

#### `min_bytes_sync_commit`

トランザクションをコミットするために必要な最小データサイズです。FE が受信したデータがこれより少ない場合、`sync_commit_interval_second` を超えるまで次のデータバッチを待ちます。デフォルトは 15MB です。変更する場合は、Canal 側の `canal.instance.memory.buffer.size` と `canal.instance.memory.buffer.memunit` の積（デフォルト 16MB）より小さくしてください。そうしないと、FE が ACK 前にストアの容量を超えるデータを取得しようとし、タイムアウトまでキューがブロックされることがあります。

デフォルト値: `15*1024*1024` (15M)

動的変更可能: true

Master FE 専用: true

#### `max_bytes_sync_commit`

データ同期ジョブ用スレッドプールの最大スレッド数です。FE 全体にスレッドプールは一つだけあり、BE にデータを送るすべての同期タスクを処理します。スレッドプールは `SyncTaskPool` クラスに実装されています。

デフォルト値: 10

動的変更可能: false

Master FE 専用: false

#### `enable_outfile_to_local`

デフォルト値：false

OUTFILE 関数によるローカルディスクへの結果のエクスポートを許可するかどうかです。

#### `export_tablet_num_per_task`

デフォルト値：5

動的変更可能：true

Master FE 専用：true

エクスポートクエリプランあたりの Tablet 数です。

#### `export_task_default_timeout_second`

デフォルト値: 2 * 3600（2 時間）

動的変更可能：true

Master FE 専用：true

エクスポートジョブのデフォルトタイムアウトです。

#### `export_running_job_num_limit`

デフォルト値：5

動的変更可能：true

Master FE 専用：true

実行中のエクスポートジョブの同時実行数の上限です。デフォルトは 5、0 は制限なしを意味します。

#### `export_checker_interval_second`

デフォルト値：5

エクスポートチェッカーの実行間隔です。

#### `enable_stream_load_profile`

デフォルト値: false

Master FE 専用: false

Stream Load の Profile を有効にするかどうかです。

### ログ {#log}

#### `log_roll_size_mb`

デフォルト値：1024  （1G）

システムログと監査ログの各ファイルの最大サイズです。

#### `sys_log_dir`

デフォルト値: DorisFE.DORIS_HOME_DIR + "/log"

FE ログのディレクトリを指定します。FE は次の 2 種類のログファイルを生成します。

fe.log: FE プロセスのすべてのログ。
fe.warn.log: FE プロセスの WARNING と ERROR のログ。

#### `sys_log_level`

デフォルト値：INFO

ログレベル: INFO、WARN、ERROR、FATAL。

#### `sys_log_roll_num`

デフォルト値：10

一回の sys_log_roll_interval 内に保持する FE ログファイルの最大数です。デフォルトの 10 では、一日に最大 10 ファイルが保持されます。

#### `sys_log_verbose_modules`

デフォルト値：{}

詳細ログを出力するモジュールです。VERBOSE レベルは log4j の DEBUG レベルで実装されます。

例:
   sys_log_verbose_modules = org.apache.doris.catalog
   org.apache.doris.catalog パッケージとそのすべてのサブパッケージにあるファイルのデバッグログだけを出力します。

#### `sys_log_roll_interval`

デフォルト値：DAY

sys_log_roll_interval の値:

* DAY: ログの接尾辞は yyyyMMdd です。
* HOUR: ログの接尾辞は yyyyMMddHH です。

#### `sys_log_delete_age`

デフォルト値：7d

デフォルトは 7 日です。最終更新から 7 日経過したログは削除されます。

指定できる形式:

* 7d      7 日
* 10h     10 時間
* 60m     60 分
* 120s    120 秒

#### `sys_log_roll_mode`

デフォルト値：SIZE-MB-1024

ログファイルを分割するサイズです。1 G ごとに分割します。

#### `sys_log_enable_compress`

デフォルト値: false

true の場合、fe.log と fe.warn.log を gzip で圧縮します。

#### `audit_log_dir`

デフォルト値：DORIS_HOME_DIR + "/log"

audit_log_dir の値：
FE の監査ログディレクトリを指定します。
監査ログ fe.audit.log には、ユーザー、ホスト、処理時間、状態などの関連情報とともに、すべての要求が記録されます。

#### `audit_log_roll_num`

デフォルト値：90

一回の audit_log_roll_interval 内に保持する FE 監査ログファイルの最大数です。

#### `audit_log_modules`

デフォルト値：{"slow_query", "query", "load", "stream_load"}

Slow Query には、処理時間が *qe_slow_log_ms* を超えたすべてのクエリが含まれます。

#### `qe_slow_log_ms`

デフォルト値: 5000（5 秒）

クエリの応答時間がこのしきい値を超えると、監査ログに slow_query として記録されます。

#### `audit_log_roll_interval`

デフォルト値：DAY

DAY: ログの接尾辞は yyyyMMdd です。
HOUR: ログの接尾辞は yyyyMMddHH です。

#### `audit_log_delete_age`

デフォルト値：30d

デフォルトは 30 日です。最終更新から 30 日経過したログは削除されます。

指定できる形式:
* 7d      7 日
* 10h     10 時間
* 60m     60 分
* 120s    120 秒

#### `audit_log_enable_compress`

デフォルト値: false

true の場合、fe.audit.log を gzip で圧縮します。

### ストレージ {#storage}

#### `min_replication_num_per_tablet`

デフォルト値: 1

Tablet あたりの最小レプリカ数を設定します。

#### `max_replication_num_per_tablet`

デフォルト値: 32767

Tablet あたりの最大レプリカ数を設定します。

#### `default_db_data_quota_bytes`

デフォルト値：8192PB

動的変更可能：true

Master FE 専用：true

データベースのデータクォータのデフォルトサイズを設定します。個別のデータベースのクォータサイズは、次のように設定できます。

```
Set the database data quota, the unit is:B/K/KB/M/MB/G/GB/T/TB/P/PB
ALTER DATABASE db_name SET DATA QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```

#### `default_db_replica_quota_size`

デフォルト値: 1073741824

動的変更可能：true

Master FE 専用：true

データベースのレプリカクォータのデフォルト値を設定します。個別のデータベースのクォータサイズは、次のように設定できます。

```
Set the database replica quota
ALTER DATABASE db_name SET REPLICA QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```

#### `recover_with_empty_tablet`

デフォルト値：false

動的変更可能：true

Master FE 専用：true

コードの不具合や操作ミスなどにより、Tablet の全レプリカが失われることがあります。この場合、データは実質的に失われています。それでもデータ損失によるクエリエラーを避けたい場合は、空の Tablet で失われたレプリカを補い、クエリを実行可能にできます。

true に設定すると、すべてのレプリカが破損または消失した Tablet に、Doris が空のレプリカを自動的に補充します。

#### `min_clone_task_timeout_sec` `And max_clone_task_timeout_sec`

デフォルト値: 最小 3 分、最大二時間

動的変更可能：true

Master FE 専用：true

`mix_clone_task_timeout_sec` と組み合わせて、クローンタスクの最大および最小タイムアウトを制御できます。通常、タイムアウトはデータ量と最小転送速度（5MB/s）から見積もられます。特別な場合は、これら二つの設定でタイムアウトの上下限を指定し、タスクの完了を確実にできます。

#### `disable_storage_medium_check`

デフォルト値：false

動的変更可能：true

Master FE 専用：true

disable_storage_medium_check が true の場合、ReportHandler は Tablet のストレージメディアを確認せず、ストレージのクールダウン機能も無効になります。デフォルトは false です。Tablet のストレージメディアを問わない場合は true に設定できます。

#### `decommission_tablet_check_threshold`

デフォルト値：5000

動的変更可能：true

Master FE 専用：true

廃止中の BE 上にある Tablet の状態を Master FE が確認するかどうかを制御します。その BE 上の Tablet 数がしきい値未満になると、FE は定期的な確認を開始します。すべての Tablet が回収されると、その BE を直ちに削除します。

性能上の理由から、この値を大きくしすぎないでください。

#### `partition_rebalance_max_moves_num_per_selection`

デフォルト値：10

動的変更可能：true

Master FE 専用：true

PartitionRebalancer を使用する場合にのみ有効です。

#### `partition_rebalance_move_expire_after_access`

デフォルト値：600   (s)

動的変更可能：true

Master FE 専用：true

PartitionRebalancer を使用する場合にのみ有効です。変更すると、キャッシュされた移動情報は消去されます。

#### `tablet_rebalancer_type`

デフォルト値：BeLoad

Master FE 専用：true

リバランサーの種類です（大文字と小文字を区別しません）。BeLoad または Partition を指定します。解析に失敗した場合は、デフォルトの BeLoad を使用します。

#### `max_balancing_tablets`

デフォルト値：100

動的変更可能：true

Master FE 専用：true

TabletScheduler 内でバランシング中の Tablet 数が max_balancing_tablets を超えると、それ以上バランスを確認しません。

#### `max_scheduling_tablets`

デフォルト値：2000

動的変更可能：true

Master FE 専用：true

TabletScheduler 内でスケジュール済みの Tablet 数が max_scheduling_tablets を超えると、確認をスキップします。

#### `disable_balance`

デフォルト値：false

動的変更可能：true

Master FE 専用：true

true に設定すると、TabletScheduler はバランシングを行いません。

#### `disable_disk_balance`

デフォルト値：true

動的変更可能：true

Master FE 専用：true

true に設定すると、TabletScheduler はディスクのバランシングを行いません。

#### `balance_load_score_threshold`

デフォルト値: 0.1 (10%)

動的変更可能：true

Master FE 専用：true

クラスターのバランススコアのしきい値です。Backend の負荷スコアが平均より 10% 低い場合は LOW、10% 高い場合は HIGH と判定されます。

#### `capacity_used_percent_high_water`

デフォルト値: 0.75  (75%)

動的変更可能：true

Master FE 専用：true

ディスク容量使用率の高水位です。Backend の負荷スコアの計算に使用します。

#### `clone_distribution_balance_threshold`

デフォルト値: 0.2

動的変更可能：true

Master FE 専用：true

Backend 内のレプリカ数のバランスしきい値です。

#### `clone_capacity_balance_threshold`

デフォルト値: 0.2

動的変更可能：true

Master FE 専用：true

* BE 内のデータサイズのバランスしきい値です。

   バランシングのアルゴリズムは次のとおりです。

     1. クラスター全体の平均使用容量（AUC）を計算します（総データサイズ / Backend の総数）。

     2. 高水位を (AUC * (1 + clone_capacity_balance_threshold)) とします。

     3. 低水位を (AUC * (1 - clone_capacity_balance_threshold)) とします。

     4. Clone Checker は高水位の BE から低水位の BE へレプリカを移動しようとします。

#### `disable_colocate_balance`

デフォルト値：false

動的変更可能：true

Master FE 専用：true

true に設定すると、Colocate テーブルの自動再配置とバランシングが無効になります。'disable_colocate_balance' が true の場合、ColocateTableBalancer はこれらの操作を行いません。

**注意**:

1. 通常はバランシングを無効にする必要はありません。
2. バランシングを無効にすると、不安定な Colocate テーブルが復旧しないことがあります。
3. 結果として、クエリで Colocate プランを使用できなくなる可能性があります。

#### `balance_slot_num_per_path`

デフォルト値: 1

動的変更可能：true

Master FE 専用：true

バランシング時のパスあたりのデフォルトスロット数です。

#### `disable_tablet_scheduler`

デフォルト値:false

動的変更可能：true

Master FE 専用：true

true に設定すると Tablet Scheduler が動作せず、すべての Tablet 修復とバランシングのタスクも実行されません。

#### `enable_force_drop_redundant_replica`

デフォルト値: false

動的変更可能: true

Master FE 専用: true

true に設定すると、Tablet のスケジューリング処理で冗長なレプリカを直ちに削除します。対象レプリカへの書き込み中のロードジョブが失敗することがありますが、Tablet のバランシングと修復は速くなります。
クラスター内にバランシングまたは修復待ちのレプリカが大量にある場合、一部のロード成功率と引き換えに、レプリカの処理を速めるためにこの設定を有効にできます。

#### `colocate_group_relocate_delay_second`

デフォルト値: 1800

動的変更可能: true

Master FE 専用: true

Colocation グループの再配置では、クラスター内で多数の Tablet が移動することがあります。そのため、不要な再配置をできるだけ避ける慎重な方針を使用します。
再配置は通常、BE ノードがオフラインになった後や停止した後に発生します。この項目は BE が利用不能と判断するまでの時間を延ばします。デフォルトは 30 分で、BE が 30 分以内に復旧すれば Colocation グループの再配置は実行されません。

#### `allow_replica_on_same_host`

デフォルト値: false

動的変更可能: false

Master FE 専用: false

同一 Tablet の複数レプリカを同じホストに配置することを許可するかどうかです。主にローカルテストで、複数の BE を起動して複数レプリカの状況を検証するために使用します。テスト以外の環境では使用しないでください。

#### `repair_slow_replica`

デフォルト値: false

動的変更可能：true

Master FE 専用: true

true に設定すると、Compaction が遅いレプリカを自動検出して他のマシンに移します。検出条件は、最も速いレプリカのバージョン数が `min_version_count_indicate_replica_compaction_too_slow` を超え、そのレプリカとのバージョン数の差の比率が `valid_version_count_delta_ratio_between_replicas` を超えることです。

#### `min_version_count_indicate_replica_compaction_too_slow`

デフォルト値: 200

動的変更可能: true

Master FE 専用: false

レプリカの Compaction が遅すぎるかどうかを判定するためのバージョン数のしきい値です。

#### `skip_compaction_slower_replica`

デフォルト値: true

動的変更可能: true

Master FE 専用: false

true に設定すると、クエリ可能なレプリカを選択する際に Compaction が遅いレプリカを除外します。

#### `valid_version_count_delta_ratio_between_replicas`

デフォルト値: 0.5

動的変更可能: true

Master FE 専用: true

最も遅いレプリカと最も速いレプリカのバージョン数の差の比率に対するしきい値です。`repair_slow_replica` が true の場合、最も遅いレプリカを修復するかどうかの判定に使用します。

#### `min_bytes_indicate_replica_too_large`

デフォルト値: `2 * 1024 * 1024 * 1024` (2G)

動的変更可能: true

Master FE 専用: true

レプリカが大きすぎるかどうかを判定するデータサイズのしきい値です。

#### `schedule_slot_num_per_hdd_path`

デフォルト値：4

Tablet Scheduler における HDD パスあたりのデフォルトスロット数です。この設定を削除し、クローンタスクの統計に基づいて動的に調整します。

#### `schedule_slot_num_per_ssd_path`

デフォルト値：8

Tablet Scheduler における SSD パスあたりのデフォルトスロット数です。この設定を削除し、クローンタスクの統計に基づいて動的に調整します。

#### `tablet_repair_delay_factor_second`

デフォルト値：60 （s）

動的変更可能：true

Master FE 専用：true

Tablet の修復を決定するまでの遅延時間に適用する係数です。

* 優先度が VERY_HIGH の場合は直ちに修復します。
* HIGH の場合は tablet_repair_delay_factor_second * 1 の時間だけ遅らせます。
* NORMAL の場合は tablet_repair_delay_factor_second * 2 の時間だけ遅らせます。
* LOW の場合は tablet_repair_delay_factor_second * 3 の時間だけ遅らせます。

#### `tablet_stat_update_interval_second`

デフォルト値：300（5min）

Tablet の統計情報の更新間隔です。
各間隔で、すべての Frontend がすべての Backend から Tablet の統計情報を取得します。

#### `storage_flood_stage_usage_percent`

デフォルト値：95 （95%）

動的変更可能：true

Master FE 専用：true

##### `storage_flood_stage_left_capacity_bytes`

デフォルト値：`1 * 1024 * 1024 * 1024` (1GB)

動的変更可能：true

Master FE 専用：true

ディスク容量が 'storage_flood_stage_usage_percent' と 'storage_flood_stage_left_capacity_bytes' の条件に達すると、次の操作が拒否されます。

1. ロードジョブ
2. リストアジョブ

#### `storage_high_watermark_usage_percent`

デフォルト値：85  (85%)

動的変更可能：true

Master FE 専用：true

#### `storage_min_left_capacity_bytes`

デフォルト値： `2 * 1024 * 1024 * 1024`  (2GB)

動的変更可能：true

Master FE 専用：true

'storage_high_watermark_usage_percent' は Backend のストレージパスの最大容量使用率を、'storage_min_left_capacity_bytes' はそのパスに残す最小空き容量を制限します。両方の制限に達すると、そのパスを Tablet バランシングの移動先に選べません。ただし、Tablet の復旧では、データの整合性をできるだけ維持するために制限を超える場合があります。

#### `catalog_trash_expire_second`

デフォルト値: 86400L（1 日）

動的変更可能：true

Master FE 専用：true

データベース（テーブルまたはパーティション）を削除した後は、RECOVER 文で復元できます。この項目はデータの最大保持期間を指定します。期間を過ぎると、データは完全に削除されます。

#### `default_storage_medium`

デフォルト値：HDD

テーブル（またはパーティション）の作成時にストレージメディア（HDD または SSD）を指定できます。指定しない場合、この項目の値が使用されます。

#### `default_compression_type`

デフォルト値: LZ4F（4.0.3 より前）、ZSTD（4.0.3 以降）

テーブル作成時には圧縮アルゴリズムを指定できます。指定しない場合、この項目がデフォルトの圧縮方式になります。有効な値は LZ4、LZ4F、LZ4HC、ZLIB、ZSTD、SNAPPY、NONE で、大文字と小文字は区別されません。

#### `enable_storage_policy`

* ストレージポリシー機能を有効にするかどうかです。ホットデータとコールドデータを分離できます。
デフォルト値: false

動的変更可能: true

Master FE 専用: true

#### `check_consistency_default_timeout_second`

デフォルト値: 600（10 分）

動的変更可能：true

Master FE 専用：true

単一の整合性確認タスクのデフォルトタイムアウトです。Tablet のサイズに応じて十分な長さを設定してください。

#### `consistency_check_start_time`

デフォルト値：23

動的変更可能：true

Master FE 専用：true

整合性確認の開始時刻です。

整合性チェッカーは *consistency_check_start_time* から *consistency_check_end_time* まで動作します。

二つの時刻が同じ場合、整合性確認は実行されません。

#### `consistency_check_end_time`

デフォルト値：23

動的変更可能：true

Master FE 専用：true

整合性確認の終了時刻です。

整合性チェッカーは *consistency_check_start_time* から *consistency_check_end_time* まで動作します。

二つの時刻が同じ場合、整合性確認は実行されません。

#### `replica_delay_recovery_second`

デフォルト値：0

動的変更可能：true

Master FE 専用：true

レプリカの障害から FE がクローンを使って復旧を試みるまでの最小遅延時間（秒）です。

#### `tablet_create_timeout_second`

デフォルト値：1（s）

動的変更可能：true

Master FE 専用：true

単一のレプリカの作成を待つ最大時間です。

例:
   #m 個の Tablet を持ち、各 Tablet に #n 個のレプリカを持つテーブルを作成する場合、
   CREATE TABLE 要求は、タイムアウトまで最大 (m *n* tablet_create_timeout_second) 実行されます。

#### `tablet_delete_timeout_second`

デフォルト値：2

動的変更可能：true

Master FE 専用：true

*tablet_create_timeout_second* と同じ意味ですが、Tablet の削除時に使用します。

#### `delete_job_max_timeout_second`

デフォルト値: 300(s)

動的変更可能: true

Master FE 専用: true

Delete ジョブの最大タイムアウト（秒）です。

#### `alter_table_timeout_second`

デフォルト値: 86400 * 30（1 か月）

動的変更可能：true

Master FE 専用：true

ALTER TABLE 要求の最大タイムアウトです。テーブルのデータサイズに応じて十分な長さに設定してください。

#### `max_replica_count_when_schema_change`

OlapTable のスキーマ変更時に許可するレプリカの最大数です。レプリカが多すぎると FE で OOM が発生します。

デフォルト値: 100000

動的変更可能: true

Master FE 専用: true

#### `history_job_keep_max_second`

デフォルト値：`7 * 24 * 3600`（7 日）

動的変更可能：true

Master FE 専用：true

スキーマ変更ジョブや Rollup ジョブなど、一部のジョブの最大保持期間です。

#### `max_create_table_timeout_second`

デフォルト値：60 （s）

動的変更可能：true

Master FE 専用：true

テーブル（インデックス）の作成時に長時間待ちすぎないよう、最大タイムアウトを設定します。

#### `autobucket_min_buckets`

デフォルト値: 3（4.0.8 / 4.1.4 より前は 1）

動的変更可能: true

Master FE 専用: true

自動バケット化（`DISTRIBUTED BY ... BUCKETS AUTO`）によって生成されるバケット数の下限です。

**Doris 4.0 系列の 4.0.8 および 4.1 系列の 4.1.4 から、デフォルト値が `1` から `3` に変更されました。** 従来は小さなパーティションが単一のバケットになり、並列度やデータ分散が不十分でした。変更後は自動バケット化で 3 個未満のバケットが生成されません。この変更は新規作成するパーティションにのみ影響し、既存のパーティションのバケット数は変わりません。

#### `autobucket_max_buckets`

デフォルト値: 128

動的変更可能: true

Master FE 専用: true

自動バケット化によって生成されるバケット数の上限です。計算結果がこの値を超える場合は、この値に制限されます。

### 外部テーブル {#external-table}

#### `jdbc_driver_url_white_list`

デフォルト値: 空

動的変更可能: false

JDBC Catalog の作成時に許可する `driver_url` のホワイトリストです。複数の値はカンマで区切ります（例: `jdbc_driver_url_white_list=a,b,c`）。空の場合はホワイトリストが設定されません。

:::caution 動作の変更（4.1.4）

セキュリティ上の理由から、バージョン 4.1.4 以降、この設定項目は **動的に変更できません**。`fe.conf` でのみ設定でき、FE の再起動後に有効になります。`ADMIN SET FRONTEND CONFIG` では変更できません。

:::

#### `force_sqlserver_jdbc_encrypt_false`

デフォルト値: false

動的変更可能: false

SQLServer JDBC Catalog の `encrypt` パラメーターを強制的に `false` にするかどうかです。

:::caution 動作の変更（4.1.4）

この設定は SQLServer JDBC の転送時暗号化を無効にするため、セキュリティに関わるスイッチです。バージョン 4.1.4 以降は **動的に変更できず**、`fe.conf` でのみ設定でき、FE の再起動後に有効になります。

:::

#### `file_scan_node_split_num`

デフォルト値：128

動的変更可能：true

Master FE 専用：false

複数の Catalog で並行してファイルをスキャンするスレッド数です。

#### `file_scan_node_split_size`

デフォルト値：`256 * 1024 * 1024`

動的変更可能：true

Master FE 専用：false

複数の Catalog で並行して行うファイルスキャンのサイズです。

#### `enable_odbc_mysql_broker_table`

デフォルト値：false

動的変更可能：true

Master FE 専用：false

バージョン 2.1 以降、ODBC、JDBC、Broker 外部テーブルの作成はサポートされません。ODBC または MySQL 外部テーブルの代わりに JDBC テーブルまたは JDBC Catalog を、Broker テーブルの代わりにテーブル値関数を使用してください。

#### `max_hive_partition_cache_num`

Hive パーティション用キャッシュの最大数です。

デフォルト値: 100000

動的変更可能: false

Master FE 専用: false

#### `hive_metastore_client_timeout_second`

Hive Metastore のデフォルト接続タイムアウトです。

デフォルト値: 10

動的変更可能: true

Master FE 専用: true

#### `max_external_cache_loader_thread_pool_size`

外部メタデータキャッシュをロードするスレッドプールの最大サイズです。

デフォルト値: 10

動的変更可能: false

Master FE 専用: false

#### `max_external_file_cache_num`

外部テーブルで使用するファイルキャッシュの最大数です。

デフォルト値: 100000

動的変更可能: false

Master FE 専用: false

#### `max_external_schema_cache_num`

外部テーブルで使用するスキーマキャッシュの最大数です。

デフォルト値: 10000

動的変更可能: false

Master FE 専用: false

#### `external_cache_expire_time_minutes_after_access`

最後のアクセスからキャッシュ内のデータが失効するまでの時間を分単位で指定します。
External Schema Cache と Hive Partition Cache の両方に適用されます。

デフォルト値: 1440

動的変更可能: false

Master FE 専用: false

#### `es_state_sync_interval_second`

デフォルト値：10

FE は es_state_sync_interval_secs ごとに ES API を呼び出し、ES インデックスのシャード情報を取得します。

### 外部リソース {#external-resources}

#### `dpp_hadoop_client_path`

デフォルト値：/lib/hadoop-client/hadoop/bin/hadoop

#### `dpp_bytes_per_reduce`

デフォルト値：`100 * 1024 * 1024L` (100M)

#### `dpp_default_cluster`

デフォルト値：palo-dpp

#### `dpp_default_config_str`

デフォルト値：{
               hadoop_configs : 'mapred.job.priority=NORMAL;mapred.job.map.capacity=50;mapred.job.reduce.capacity=50;mapred.hce.replace.streaming=false;abaci.long.stored.job=true;dce.shuffle.enable=false;dfs.client.authserver.force_stop=true;dfs.client.auth.method=0'
         }

#### `dpp_config_str`

デフォルト値：{
               palo-dpp : {
                     hadoop_palo_path : '/dir',
                     hadoop_configs : 'fs.default.name=hdfs://host:port;mapred.job.tracker=host:port;hadoop.job.ugi=user,password'
                  }
      }

#### `yarn_config_dir`

デフォルト値: DorisFE.DORIS_HOME_DIR + "/lib/yarn-config"

Yarn 設定ファイルのデフォルトディレクトリです。Yarn コマンドを実行する前に、毎回このパスに設定ファイルがあるか確認し、なければ作成します。

#### `yarn_client_path`

デフォルト値：DORIS_HOME_DIR + "/lib/yarn-client/hadoop/bin/yarn"

Yarn クライアントのデフォルトパスです。

#### `spark_launcher_log_dir`

デフォルト値： sys_log_dir + "/spark_launcher_log"

Spark Launcher のログディレクトリを指定します。

#### `spark_resource_path`

デフォルト値：なし

Spark 依存ファイルのデフォルトパスです。

#### `spark_home_default_dir`

デフォルト値：DORIS_HOME_DIR + "/lib/spark2x"

Spark Home のデフォルトディレクトリです。

#### `spark_dpp_version`

デフォルト値: 1.0.0

Spark DPP のデフォルトバージョンです。

### その他 {#else}

#### `tmp_dir`

デフォルト値: DorisFE.DORIS_HOME_DIR + "/temp_dir"

一時ディレクトリには、バックアップやリストアなどの処理の中間結果が保存されます。処理の完了後、ディレクトリ内のファイルは削除されます。

#### `custom_config_dir`

デフォルト値: DorisFE.DORIS_HOME_DIR + "/conf"

カスタム設定ファイルのディレクトリです。

`fe_custom.conf` ファイルの場所を指定します。デフォルトは `conf/` ディレクトリです。

デプロイ環境によっては、システムのアップグレードで `conf/` ディレクトリが上書きされ、ユーザーが変更した設定項目も失われることがあります。その場合は、`fe_custom.conf` を別のディレクトリに保存することで、設定ファイルの上書きを防げます。

#### `plugin_dir`

デフォルト値：DORIS_HOME + "/plugins

プラグインのインストールディレクトリです。

#### `plugin_enable`

デフォルト値:true

動的変更可能：true

Master FE 専用：true

プラグインを有効にするかどうかです。デフォルトで有効です。

#### `small_file_dir`

デフォルト値：DORIS_HOME_DIR/small_files

小さなファイルを保存します。

#### `max_small_file_size_bytes`

デフォルト値：1M

動的変更可能：true

Master FE 専用：true

SmallFileMgr に保存するファイル一件あたりの最大サイズです。

#### `max_small_file_number`

デフォルト値：100

動的変更可能：true

Master FE 専用：true

SmallFileMgr に保存するファイルの最大数です。

#### `enable_metric_calculator`

デフォルト値：true

true に設定すると、メトリクスコレクターがデーモンタイマーとして動作し、一定間隔でメトリクスを収集します。

#### `report_queue_size`

デフォルト値： 100

動的変更可能：true

Master FE 専用：true

このしきい値は、FE にレポートタスクが蓄積して OOM 例外が発生することを防ぎます。たとえば、100 台の Backend と千万個のレプリカを持つ大規模な Doris クラスターでは、パーティションの削除などメタデータの変更後、Tablet レポートの処理に数秒かかることがあります。各 Backend は 1 分ごとに Tablet 情報を報告するため、無制限には受け付けられません。現在はキューサイズが上限を超えるとレポートを破棄します。
   実環境での所要時間の例:
      1. ディスクレポート: 0-1 msta
      2. sk レポート: 0-1 ms
      3. Tablet レポート
      4. 10000 レプリカ: 200ms

#### `backup_job_default_timeout_ms`

デフォルト値: 86400 * 1000（1 日）

動的変更可能：true

Master FE 専用：true

バックアップジョブのデフォルトタイムアウトです。

#### `backup_upload_snapshot_batch_size`

デフォルト値：10

動的変更可能：true

Master FE 専用：true

バックアップ中に一件のアップロードタスクへ割り当てるスナップショットの最大数です。デフォルトは 10 です。

#### `restore_download_snapshot_batch_size`

デフォルト値：10

動的変更可能：true

Master FE 専用：true

リストア中に一件のダウンロードタスクへ割り当てるスナップショットの最大数です。デフォルトは 10 です。

#### `max_backup_restore_job_num_per_db`

デフォルト値: 10

主に、各データベースに記録されるバックアップとリストアのタスク数を制御します。

#### `max_backup_tablets_per_job`

デフォルト値: 300000

動的変更可能：true

Master FE 専用：true

バックアップジョブあたりの Tablet 数の上限を設定し、大量のメタデータ保存による FE の OOM を防ぎます。

#### `enable_quantile_state_type`

デフォルト値：false

動的変更可能：true

Master FE 専用：true

quantile_state データ型を有効にするかどうかです。

#### `enable_date_conversion`

デフォルト値：true

動的変更可能：true

Master FE 専用：true

FE は date/datetime を datev2/datetimev2(0) に自動変換します。

#### `enable_decimal_conversion`

デフォルト値：true

動的変更可能：true

Master FE 専用：true

FE は DecimalV2 を DecimalV3 に自動変換します。

#### `proxy_auth_magic_prefix`

デフォルト値：x@8

#### `proxy_auth_enable`

デフォルト値：false

#### `enable_func_pushdown`

デフォルト値：true

動的変更可能：true

Master FE 専用：false

ODBC または JDBC 外部テーブルのクエリ実行時に、関数を含むフィルター条件を MySQL にプッシュダウンするかどうかです。

#### `jdbc_drivers_dir`

デフォルト値: `${DORIS_HOME}/jdbc_drivers`;

動的変更可能：false

Master FE 専用：false

JDBC ドライバーを配置するデフォルトのディレクトリです。

#### `max_error_tablet_of_broker_load`

デフォルト値: 3;

動的変更可能：true

Master FE 専用：true

Broker Load で表示するエラーのある Tablet の最大数です。

#### `default_db_max_running_txn_num`

デフォルト値：-1

動的変更可能：true

Master FE 専用：true

データベースのトランザクションクォータのデフォルトサイズを設定します。

デフォルト値を -1 に設定すると、`max_running_txn_num_per_db` が `default_db_max_running_txn_num` の代わりに使用されます。

個別のデータベースのクォータサイズは、次のように設定できます。

```
Set the database transaction quota
ALTER DATABASE db_name SET TRANSACTION QUOTA quota;
View configuration
show data （Detail：HELP SHOW DATA）
```

#### `prefer_compute_node_for_external_table`

デフォルト値：false

動的変更可能：true

Master FE 専用：false

true の場合、外部テーブルのクエリはコンピュートノードに優先的に割り当てられます。コンピュートノードの最大数は `min_backend_num_for_external_table` で制御されます。
false の場合、外部テーブルのクエリは任意のノードに割り当てられます。

#### `min_backend_num_for_external_table`

デフォルト値：3

動的変更可能：true

Master FE 専用：false

`prefer_compute_node_for_external_table` が true の場合にのみ有効です。コンピュートノード数がこの値を下回ると、外部テーブルのクエリは混合ノードにも割り当てられ、使用するノードの総数をこの値に近づけます。
コンピュートノード数がこの値を超えると、外部テーブルのクエリはコンピュートノードにのみ割り当てられます。

#### `infodb_support_ext_catalog`

デフォルト値: false

動的変更可能: true

Master FE 専用: false

false の場合、information_schema データベース内のテーブルを SELECT した結果には、
外部 Catalog のテーブル情報が含まれません。
外部 Catalog に接続できない場合にクエリが長時間かかることを避けるためです。

#### `enable_query_hit_stats`

デフォルト値: false

動的変更可能: true

Master FE 専用: false

クエリヒット統計を有効にするかどうかを制御します。デフォルトは false です。

#### `div_precision_increment`

デフォルト値: 4

この変数は、`/` 演算子による除算結果の小数桁数を
何桁増やすかを示します。

#### `enable_convert_light_weight_schema_change`

デフォルト値：true

一時的な設定項目です。有効にすると、バックグラウンドスレッドがすべての OLAP テーブルを Light Schema Change に自動変換します。変換結果は `show convert_light_schema_change [from db]` コマンドで確認でき、Light Schema Change ではなかったすべてのテーブルの結果が表示されます。

#### `disable_local_deploy_manager_drop_node`

デフォルト値：true

cluster.info ファイルの誤りによってノードが削除されないよう、LocalDeployManager によるノードの削除を禁止します。

#### `mysqldb_replace_name`

デフォルト値: mysql

MySQL エコシステムとの互換性のため、Doris には mysql という組み込みデータベースがあります。ユーザーのデータベースと名前が競合する場合は、この項目を変更して Doris の組み込み MySQL データベースに別の名前を指定してください。

#### `max_auto_partition_num`

デフォルト値: 2000

自動パーティションテーブルで意図せず大量のパーティションが作成されるのを防ぐため、OLAP テーブルあたりのパーティション数を `max_auto_partition_num` で制限します。デフォルトは 2000 です。

#### `profile_manager_gc_interval_seconds`

デフォルト値: 1

ProfileManager が Profile のガベージコレクションを実行する間隔を制御します。処理時には、過剰または期限切れの Profile をメモリとディスクから削除してメモリを節約します。

### コンピューティングとストレージの分離モード {#compute-and-storage-disaggregated-mode}

#### `cluster_id`

デフォルト値：-1

FE または BE ノードは、クラスター ID が同じ場合、同じ Doris クラスターに属すると見なされます。コンピューティングとストレージの分離モードでは、ランダムな整数を一つ指定してください。

#### `deploy_mode`

デフォルト値: ""

説明: FE の動作モードです。`cloud` はコンピューティングとストレージの分離モードを示します。

#### `meta_service_endpoint`

デフォルト値: ""

Meta Service のエンドポイントは 'host1:port,host2:port' 形式で指定します。この設定はコンピューティングとストレージの分離モードで必須です。

#### `enable_group_commit_streamload_be_forward`

デフォルト値: false

動的変更可能: true

コンピューティングとストレージの分離モードで、Group Commit を使用する Stream Load 要求の BE 転送を有効にするかどうかです。分離モードで、要求が Group Commit を使用する場合にのみ有効です。

有効にすると、FE は Stream Load 要求を `_stream_load_forward` エンドポイントへリダイレクトし、受信した BE がそのテーブルの対象 BE に要求を転送します。これにより、ロードバランサーによって同一テーブルの Group Commit バッチが分散するのを防ぎます。

同名の設定を FE と BE の両方で有効にする必要があります。**Doris 4.0 系列の 4.0.8 および 4.1 系列の 4.1.4 以降、BE 側の `_stream_load_forward` エンドポイントは BE の設定で制御されます。無効な場合は `403 Forbidden` が返され、有効な場合は認証とグローバルな `LOAD` 権限が必要です。** 詳細は [Group Commit](../../data-operate/import/load-best-practices/group-commit-manual) と [BE 設定](./be-config) を参照してください。

#### `default_get_version_from_ms_timeout_second`

デフォルト値: 30 (s)

動的変更可能: false

FE が Meta Service からバージョンを取得する際のタイムアウトです。

:::caution 動作の変更（4.1.4）

バージョン 4.1.4 でデフォルト値が `3` 秒から `30` 秒に変更されました。以前は Meta Service に一時的な遅延や高負荷があると、3 秒のタイムアウトによってクエリが失敗しやすい状態でした。値を大きくしたことで、このような断続的な失敗を大幅に減らせます。

:::

#### `enable_cloud_replica_stale_route_clean`

デフォルト値: true

動的変更可能: true

バージョン 4.1.4 で追加されました。メタデータイメージの読み込み時と Tablet バランシングの各回に、存在しなくなった Backend を指す CloudReplica のプライマリおよびセカンダリのルート記録を削除するかどうかです。

このような古い記録はクエリ時にはすでに無視され（レプリカは再度 Backend にハッシュされます）、FE のメモリとメタデータイメージの容量を消費するだけです。削除しない従来の動作を維持するには `false` に設定します。

#### `enable_cloud_colocate_consistent_hash`

デフォルト値: true

動的変更可能: false

Master FE 専用: true

バージョン 4.1.4 で追加されました。コンピューティングとストレージの分離モードで、Colocate テーブルのバケット配置に Rendezvous 一貫性ハッシュを使用するかどうかです。`false` に設定すると、従来の剰余演算による配置に戻ります。`fe.conf` でのみ設定でき、再起動後に有効になります。

#### `meta_service_rpc_rate_limit_enabled`

デフォルト値: true

動的変更可能: true

バージョン 4.1.4 で追加されました。FE から Meta Service へ送信する RPC 要求の QPS 制限を有効にするかどうかです。

#### `meta_service_rpc_rate_limit_default_qps_per_core`

デフォルト値: 50

動的変更可能: true

バージョン 4.1.4 で追加されました。`meta_service_rpc_rate_limit_qps_per_core_config` で個別に設定されていない Meta Service RPC メソッドについて、CPU コアあたりに許可するデフォルト QPS です。`0` 以下の値は制限なしを意味します。

#### `meta_service_rpc_rate_limit_qps_per_core_config`

デフォルト値: `getPartitionVersion:500;getTableVersion:500;getTabletStats:50;beginTxn:50`

動的変更可能: true

バージョン 4.1.4 で追加されました。Meta Service RPC メソッドごとの CPU コアあたりの QPS 上限を、`method1:qps1;method2:qps2` 形式で設定します。`0` 以下の値では、そのメソッドのレートは制限されません。

#### `meta_service_rpc_rate_limit_burst_seconds`

デフォルト値: 2 (s)

動的変更可能: true

バージョン 4.1.4 で追加されました。Meta Service RPC のレート制限で許可するバーストウィンドウの長さ（秒）です。長期平均 QPS は変わりませんが、このウィンドウ内のバーストが許可されます。

#### `meta_service_rpc_rate_limit_wait_timeout_ms`

デフォルト値: 1000 (ms)

動的変更可能: true

バージョン 4.1.4 で追加されました。RPC がレート制限を受けたときの最大待機時間（ミリ秒）です。`0` は待機せず要求をすぐに失敗させることを意味します。
