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

このドキュメントでは、主に FE の設定項目を紹介します。

FE の設定ファイル `fe.conf` は、通常、FE のデプロイ先にある `conf/` ディレクトリに保存されます。バージョン 0.14 では、別の設定ファイル `fe_custom.conf` が導入されます。この設定ファイルには、運用中にユーザーが動的に設定して永続化した設定項目が記録されます。

FE プロセスは起動後、まず `fe.conf` の設定項目を読み込み、次に `fe_custom.conf` の設定項目を読み込みます。`fe_custom.conf` の設定項目は、`fe.conf` にある同じ設定項目を上書きします。

`fe_custom.conf` ファイルの場所は、`fe.conf` の設定項目 `custom_config_dir` で指定できます。

## 設定項目の表示 {#view-configuration-items}

FE の設定項目を表示する方法は 2 つあります。

1. FE の Web ページ

    ブラウザーで FE の Web ページ `http://fe_host:fe_http_port/variable` を開きます。現在有効な FE の設定項目は `Configure Info` で確認できます。

2. コマンドで表示

    FE の起動後、MySQL クライアントで次のコマンドを実行すると、FE の設定項目を表示できます。具体的な構文については [SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG) を参照してください。

    `SHOW FRONTEND CONFIG;`

    結果の各列の意味は次のとおりです。

    * Key: 設定項目の名前。
    * Value: 現在の設定項目の値。
    * Type: 整数や文字列など、設定項目の値の型。
    * IsMutable: 動的に設定できるかどうか。true の場合、実行時に動的に設定できます。false の場合、`fe.conf` でのみ設定でき、FE の再起動後に有効になります。
    * MasterOnly: Master FE ノード固有の設定項目かどうか。true の場合、Master FE ノードでのみ意味を持ち、他の種類の FE ノードでは意味を持ちません。false の場合、すべての種類の FE ノードで意味を持ちます。
    * Comment: 設定項目の説明。

## 設定項目の設定 {#set-configuration-items}

バージョン 4.1.5 以降、`SHOW FRONTEND CONFIG` と設定エクスポート用エンドポイントでは、`initial_root_password`、TLS 秘密鍵のパスワード、HTTPS Key Store のパスワード、MySQL SSL 証明書のパスワードなど、空でない機密値が `********` でマスクされます。未設定であることを示すため、空の値は空のまま表示されます。マスクによって有効な設定は変わりません。

FE の設定項目を設定する方法は次のとおりです。

1. 静的設定

    `conf/fe.conf` ファイルに設定項目を追加して値を設定します。`fe.conf` の設定項目は FE プロセスの起動時に読み込まれます。`fe.conf` にない設定項目にはデフォルト値が使用されます。

2. MySQL プロトコルによる動的設定

    FE の起動後、次のコマンドで設定項目を動的に設定できます。このコマンドには管理者権限が必要です。

    `ADMIN SET FRONTEND CONFIG (" fe_config_name "=" fe_config_value ");`

    すべての設定項目が動的設定に対応しているわけではありません。動的設定に対応しているかどうかは、` SHOW FRONTEND CONFIG; ` コマンドの結果にある `IsMutable` 列で確認できます。

    `MasterOnly` の設定項目を変更すると、コマンドは Master FE に直接転送され、Master FE の該当する設定項目だけが変更されます。

    **この方法で変更した設定項目は、FE プロセスを再起動すると無効になります。**

    このコマンドの詳細は、`HELP ADMIN SET CONFIG;` コマンドで確認できます。

3. HTTP プロトコルによる動的設定

    詳細は [Set Config Action](../open-api/fe-http/set-config-action) を参照してください。

    この方法では、変更した設定項目を永続化することもできます。設定項目は `fe_custom.conf` ファイルに保存され、FE の再起動後も有効です。

## 例 {#examples}

1. `async_pending_load_task_pool_size` の変更

    `SHOW FRONTEND CONFIG;` で、この設定項目は動的に設定できないことを確認できます（`IsMutable` は false）。`fe.conf` に次の行を追加します。

    `async_pending_load_task_pool_size = 20`

    その後、設定を有効にするため FE プロセスを再起動します。

2. `dynamic_partition_enable` の変更

    `SHOW FRONTEND CONFIG;` で、この設定項目は動的に設定できることを確認できます（`IsMutable` は true）。また、Master FE 固有の設定です。まず任意の FE に接続し、次のコマンドを実行して設定を変更します。

    ```
    ADMIN SET FRONTEND CONFIG ("dynamic_partition_enable" = "true"); `
    ```

    変更後は、次のコマンドで値を確認できます。

    ```
    set forward_to_master = true;
    SHOW FRONTEND CONFIG;
    ```

    この方法で変更した設定は、Master FE の再起動または Master の選出が行われると無効になります。設定を永続化するには、設定項目を `fe.conf` に直接追加して FE を再起動します。

3. `max_distribution_pruner_recursion_depth` の変更

    `SHOW FRONTEND CONFIG;` で、この設定項目は動的に設定できることを確認できます（`IsMutable` は true）。Master FE 固有の設定ではありません。

    同様に、動的設定コマンドで変更できます。この設定は Master FE 固有ではないため、すべての FE で変更後の値を使用するには、各 FE に個別に接続して動的に変更する必要があります。

## 設定一覧 {#configurations}

### メタデータとクラスター {#metadata-and-cluster}

#### `meta_dir` {#meta_dir}

デフォルト：DORIS_HOME_DIR + "/doris-meta"

型：string。説明：Doris のメタデータをここに保存します。このディレクトリのストレージには、次の特性を強く推奨します。

* 高い書き込み性能（SSD）
* 安全性（RAID）

#### `catalog_try_lock_timeout_ms` {#catalog_try_lock_timeout_ms}

デフォルト：5000  （ms）

IsMutable：true

catalog ロックの tryLock タイムアウト設定です。通常、テストが必要な場合を除いて変更する必要はありません。

#### `enable_bdbje_debug_mode` {#enable_bdbje_debug_mode}

デフォルト：false

true に設定すると、FE は BDBJE デバッグモードで起動します。

#### `max_bdbje_clock_delta_ms` {#max_bdbje_clock_delta_ms}

デフォルト：5000 （5s）

非 Master FE のホストと Master FE のホスト間で許容する最大の時計のずれを設定します。非 Master FE が BDBJE を介して Master FE に接続するたびに確認されます。時計のずれがこの値を超える場合、接続は破棄されます。

#### `metadata_failure_recovery` {#metadata_failure_recovery}

デフォルト：false

true の場合、FE は bdbje のレプリケーショングループをリセットし（選出可能なノードの情報をすべて削除し）、Master として起動しようとします。選出可能なノードがすべて起動できない場合は、メタデータを別のノードにコピーし、この設定を true にして FE の再起動を試みることができます。

#### `txn_rollback_limit` {#txn_rollback_limit}

デフォルト：100

bdbje がグループへの再参加を試みる際にロールバックできるトランザクションの最大数です。

#### `grpc_threadmgr_threads_nums` {#grpc_threadmgr_threads_nums}

デフォルト：4096

grpc_threadmgr で grpc イベントを処理するスレッド数です。

#### `bdbje_replica_ack_timeout_second` {#bdbje_replica_ack_timeout_second}

デフォルト：10  (s)

bdbje への書き込み時にレプリカの応答を待つタイムアウトです。比較的大きなログを書き込むと応答がタイムアウトし、ログの書き込みに失敗する場合があります。その場合は、この値を適宜増やしてください。

#### `bdbje_lock_timeout_second` {#bdbje_lock_timeout_second}

デフォルト：5

bdbje 操作のロックタイムアウトです。FE の WARN ログに LockTimeoutException が多数記録される場合は、この値を増やしてみてください。

#### `bdbje_heartbeat_timeout_second` {#bdbje_heartbeat_timeout_second}

デフォルト：30

Master と Follower 間の bdbje ハートビートのタイムアウトです。デフォルトは 30 秒で、bdbje のデフォルト値と同じです。一時的なネットワーク障害や予期しない長時間の Java GC が発生する場合は、この値を増やすと誤検知によるタイムアウトを減らせます。

#### `replica_ack_policy` {#replica_ack_policy}

デフォルト：SIMPLE_MAJORITY

選択肢：ALL、NONE、SIMPLE_MAJORITY

bdbje のレプリカ応答ポリシーです。詳細は <http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.ReplicaAckPolicy.html> を参照してください。

#### `replica_sync_policy` {#replica_sync_policy}

デフォルト：SYNC

選択肢：SYNC, NO_SYNC, WRITE_NO_SYNC

bdbje における Follower FE の同期ポリシーです。

#### `master_sync_policy` {#master_sync_policy}

デフォルト：SYNC

選択肢：SYNC, NO_SYNC, WRITE_NO_SYNC

bdbje における Master FE の同期ポリシーです。Follower FE を 1 台だけデプロイする場合は、'SYNC' に設定してください。Follower FE を 3 台以上デプロイする場合は、この設定と後述の 'replica_sync_policy' を WRITE_NO_SYNC に設定できます。詳細は <http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.SyncPolicy.html> を参照してください。

#### `bdbje_reserved_disk_bytes` {#bdbje_reserved_disk_bytes}

レプリケートされた JE Environment に保持する予約領域のバイト数の望ましい上限です。

デフォルト：1073741824

動的設定が可能か：false

Master FE ノード固有の設定項目か：false

#### `ignore_meta_check` {#ignore_meta_check}

デフォルト：false

IsMutable：true

true の場合、非 Master FE は、Master FE とのメタデータの遅延が *meta_delay_toleration_second* を超えていても無視し、読み取りサービスを提供し続けます。
何らかの理由で Master FE を比較的長時間停止する一方、非 Master FE からは読み取りサービスを提供し続けたい場合に役立ちます。

#### `meta_delay_toleration_second` {#meta_delay_toleration_second}

デフォルト：300 (5 分)

Master FE とのメタデータの遅延が *meta_delay_toleration_second* を超えると、非 Master FE はサービスの提供を停止します。

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

true に設定すると、チェックポイントスレッドは JVM のメモリ使用率に関係なくチェックポイントを作成します。

#### `metadata_checkpoint_memory_threshold` {#metadata_checkpoint_memory_threshold}

デフォルト：60  （60%）

IsMutable：true

MasterOnly：true

JVM のメモリ使用率（ヒープまたは Old 世代のメモリプール）がこのしきい値を超えると、OOM を避けるため、チェックポイントスレッドは動作しません。

#### `max_same_name_catalog_trash_num` {#max_same_name_catalog_trash_num}

catalog のごみ箱に保持する、同じ名前のメタデータの最大数を設定します。上限を超えると、最も古く削除されたメタデータは完全に削除され、復元できなくなります。0 は同名のオブジェクトを保持しないこと、< 0 は無制限を意味します。

注：同名かどうかの判定は一定の範囲に限定されます。たとえば、同名のデータベースは同じクラスター内で、同名のテーブルは同じデータベース内（同じデータベース ID）で、同名のパーティションは同じデータベース内（同じデータベース ID）かつ同じテーブル内（同じテーブル ID）で判定されます。

デフォルト：3

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

#### `cluster_id` {#cluster_id}

デフォルト：-1

同じクラスター ID を持つノード（FE または BE）は、同じ Doris クラスターに属すると見なされます。クラスター ID は通常、Master FE の初回起動時に生成されるランダムな整数ですが、指定することもできます。

#### `heartbeat_mgr_blocking_queue_size` {#heartbeat_mgr_blocking_queue_size}

デフォルト：1024

MasterOnly：true

heartbeat_mgr でハートビートタスクを格納するブロッキングキューのサイズです。

#### `heartbeat_mgr_threads_num` {#heartbeat_mgr_threads_num}

デフォルト：8

MasterOnly：true

heartbeat_mgr でハートビートイベントを処理するスレッド数です。

#### `disable_cluster_feature` {#disable_cluster_feature}

デフォルト：true

IsMutable：true

マルチクラスター機能はバージョン 0.12 で非推奨になります。この設定を true にすると、次のようなクラスター機能に関連する操作がすべて無効になります。

1. クラスターの作成と削除
2. 空き Backend の追加、クラスターへの Backend の追加、クラスターのバランス調整を伴うデコミッション
3. クラスター内の Backend 数の変更
4. データベースのリンクと移行

#### `enable_fqdn_mode` {#enable_fqdn_mode}

この設定は主に k8s クラスター環境で使用します。enable_fqdn_mode が true の場合、BE が配置されている Pod の名前は再作成後も変わらず、IP は変わることがあります。

デフォルト：false

動的設定が可能か：false

Master FE ノード固有の設定項目か：true

#### `enable_token_check` {#enable_token_check}

デフォルト：true

前方互換性のための設定で、後で削除されます。image ファイルのダウンロード時にトークンを確認します。

#### `fe_meta_auth_token` {#fe_meta_auth_token}

デフォルト：""（空文字列）

IsMutable: false

FE ノード間で FE メタサービスの HTTP エンドポイント（`image`、`role`、`check`、`put`、`journal_id` など）を認証するためのクラスタートークンです。Doris 4.0 系ではバージョン 4.0.8、4.1 系ではバージョン 4.1.4 で追加されました。

空でない値を設定すると、これらのエンドポイントでは既存のノードホスト確認に加え、呼び出し元が一致するトークンヘッダーを提示する必要があります。これにより、クラスターに属さないホストが FE のメタデータエンドポイントにアクセスすることを防ぎます。空のままにすると従来のノードホストのみを確認する動作が維持され、既存クラスターやローリングアップグレードには影響しません。

:::caution 注意

この設定は **すべての FE** で同一にし、有効化する前に `fe.conf` に記載する必要があります。そうしないと、FE 間で互いのメタデータリクエストが拒否され、メタデータの同期に失敗します。

:::

#### `enable_multi_tags` {#enable_multi_tags}

デフォルト：false

動的設定が可能か：false

Master FE ノード固有の設定項目か：true

単一の BE で複数のタグを使用する機能を有効にするかどうかを指定します。

#### `initial_root_password` {#initial_root_password}

root ユーザーの初期パスワードを、2 段階の SHA-1 で暗号化された形式で設定します。デフォルトの '' は root パスワードがないことを意味します。その後、root ユーザーに対して `set password` を実行すると、初期パスワードは上書きされます。

例：平文パスワード `root@123` を設定する場合は、Doris SQL の `select password('root@123')` を実行して、暗号化されたパスワード `*A00C34073A26B40AB4307650BFB9309D6BFA6999` を生成できます。

デフォルト：空文字列

動的設定が可能か：false

Master FE ノード固有の設定項目か：true

#### `enable_cooldown_replica_affinity` {#enable_cooldown_replica_affinity}

クエリのスキャンでクールダウン済みのレプリカを優先するかどうかを選択します。デフォルトは true です。

デフォルト：true

動的設定が可能か：true

Master FE ノード固有の設定項目か：false

### TSO（Timestamp Oracle） {#tso-timestamp-oracle}

<version since="dev">

</version>

TSO は `enable_feature_binlog` で有効になります。この設定のデフォルトは false で、動的には変更できません。現在サポートされる TSO パラメータを次に示します。使い方と注意事項については [TSO](../cluster-management/tso.md) を参照してください。

| パラメータ | 型 | デフォルト | 動的変更 | Master のみ | 説明 |
| --- | --- | --- | --- | --- | --- |
| `tso_service_update_interval_ms` | int | `50 ms` | false | true | 割り当てウィンドウの更新を確認する間隔。 |
| `tso_max_update_retry_count` | int | `3` | true | true | TSO 状態を更新する最大試行回数。 |
| `tso_max_get_retry_count` | int | `10` | true | true | 失敗を報告するまでに TSO の割り当てを試みる最大回数。 |
| `tso_service_window_duration_ms` | int | `1000 ms` | true | true | 予約する割り当てウィンドウの長さ。定期的な永続化の間隔の上限にもなります。 |
| `tso_clock_backward_startup_threshold_ms` | long | `1800000 ms` | true | true | 起動時の補正で、再生されたウィンドウの終了時刻とシステム時刻の間に許容する最大の差。 |
| `tso_time_offset_debug_mode` | int | `0 ms` | true | false | テスト専用の時計のオフセット。通常の運用には使用しないでください。 |
| `enable_tso_forward_when_counter_full` | boolean | `true` | true | true | 論理カウンターが容量の半分を超え、実時刻の進行が不十分な場合、物理成分を 1 ms 進めます。 |

### サービス {#service}

#### `arrow_flight_deferred_query_idle_timeout_second` {#arrow_flight_deferred_query_idle_timeout_second}

デフォルト：3600（秒）

動的設定が可能か：true

Master FE ノード固有の設定項目か：false

バージョン 4.1.5 以降でサポートされます。外部テーブルをバッチ単位でスキャンする Arrow Flight SQL クエリでは、`GetFlightInfo` を返した後も FE Coordinator を保持し、クライアントが `DoGet` で結果を読み取る間、BE が split の取得を続けられるようにする必要があります。この設定は、アイドル状態のセッションにあるそのようなクエリがリソースを保持する時間を制限します。期間はクエリの開始時から数え、クエリの実行タイムアウトより短くなることはありません。期限が切れると Coordinator、Workload Group のキュースロット、`active_queries` のエントリが解放されますが、セッションは開いたままで、引き続き `wait_timeout` の対象です。`0` に設定すると、この期限を無効にできます。

#### `query_port` {#query_port}

デフォルト：9030

FE の MySQL サーバーポートです。

#### `arrow_flight_sql_port` {#arrow_flight_sql_port}

デフォルト：-1

Arrow Flight SQL サーバーのポートです。

#### `frontend_address` {#frontend_address}

状態：非推奨であり、使用は推奨しません。このパラメータは将来削除される可能性があります。

型：string

説明：*InetAddress.getByName* で IP アドレスを取得する代わりに、FE の IP アドレスを明示的に設定します。通常、*InetAddress.getByName* で期待する結果が得られない場合に使用します。サポートされるのは IP アドレスのみで、ホスト名は使用できません。

デフォルト値：0.0.0.0

#### `priority_networks` {#priority_networks}

デフォルト：none

複数の IP を持つサーバーに対する選択方法を指定します。このリストに一致する IP は最大 1 つである必要があります。CIDR 表記の値をセミコロンで区切ったリストです（例：10.10.10.0/24）。一致する IP がない場合はランダムに 1 つ選択されます。

#### `http_port` {#http_port}

デフォルト：8030

HTTP のバインドポートです。現在、すべての FE で同じ HTTP ポートを使用する必要があります。

#### `https_port` {#https_port}

デフォルト：8050

HTTPS のバインドポートです。現在、すべての FE で同じ HTTPS ポートを使用する必要があります。

#### `enable_https` {#enable_https}

デフォルト：false

HTTPS の有効化フラグです。false の場合は HTTP がサポートされます。true の場合は HTTP と HTTPS の両方がサポートされ、HTTP リクエストは自動的に HTTPS にリダイレクトされます。
enable_https が true の場合は、fe.conf に SSL 証明書の情報を設定する必要があります。

#### `enable_ssl` {#enable_ssl}

デフォルト：true

true に設定すると、Doris は MySQL との間に SSL プロトコルに基づく暗号化チャネルを確立します。

#### `qe_max_connection` {#qe_max_connection}

デフォルト：1024

FE ごとの最大接続数です。

#### `check_java_version` {#check_java_version}

デフォルト：true

Doris はビルド時と実行時の Java バージョンに互換性があるか確認します。互換性がない場合は Java のバージョン不一致を示す例外メッセージを出し、起動を終了します。

#### `rpc_port` {#rpc_port}

デフォルト：9020

FE Thrift Server のポートです。

#### `thrift_server_type` {#thrift_server_type}

FE の Thrift Service が使用するサービスモデルを指定します。型は String で、大文字と小文字は区別されません。

値が 'SIMPLE' の場合は 'TSimpleServer' モデルが使用されます。一般に本番環境には適さず、テスト用途に限られます。

値が 'THREADED' の場合は 'TThreadedSelectorServer' モデルが使用されます。これはマスター・スレーブ Reactor モデルによるノンブロッキング I/O モデルで、多数の同時接続リクエストにすばやく応答でき、ほとんどの状況で良好に動作します。

値が `THREAD_POOL` の場合は `TThreadPoolServer` モデルが使用されます。これはスレッドプールでユーザー接続を処理するブロッキング I/O モデルです。同時接続数はスレッドプールのサイズに制限されます。同時リクエスト数を事前に見積もることができ、十分なスレッドリソースを確保できる場合は、より高い性能が期待できます。このサービスモデルがデフォルトで使用されます。

#### `thrift_server_max_worker_threads` {#thrift_server_max_worker_threads}

デフォルト：4096

Thrift サーバーのワーカースレッドの最大数です。

#### `thrift_backlog_num` {#thrift_backlog_num}

デフォルト：1024

Thrift サーバーの backlog_num です。この値を増やす場合は、Linux の /proc/sys/net/core/somaxconn の設定値より大きい値を指定してください。

#### `thrift_client_timeout_ms` {#thrift_client_timeout_ms}

デフォルト：0

Thrift サーバーの接続タイムアウトとソケットタイムアウトの設定です。

読み取りタイムアウトを防ぐため、thrift_client_timeout_ms の値は 0 に設定されています。

#### `thrift_max_message_size` {#thrift_max_message_size}

デフォルト：100MB

Thrift サーバーが受信するメッセージの最大サイズをバイト単位で指定します。クライアントが送信したメッセージのサイズがこの上限を超えると、Thrift サーバーはリクエストを拒否して接続を閉じます。その結果、クライアントには「connection has been closed by peer」というエラーが発生します。その場合は、このパラメータを増やしてみてください。

#### `use_compact_thrift_rpc` {#use_compact_thrift_rpc}

デフォルト：true

クエリプランの構造を圧縮形式で送信するかどうかを指定します。有効にするとクエリプランの構造のサイズを約 50% 削減でき、一部の「send fragment timeout」エラーを回避できます。
ただし、小規模なクエリが高い同時実行数で発生する場合、同時実行性能が約 10% 低下する可能性があります。

#### `grpc_max_message_size_bytes` {#grpc_max_message_size_bytes}

デフォルト：1G

GRPC クライアントチャネルの初期フローウィンドウサイズと、メッセージの最大サイズを設定します。結果セットが大きい場合は、この値を増やす必要があるかもしれません。

#### `max_mysql_service_task_threads_num` {#max_mysql_service_task_threads_num}

デフォルト：4096

Task イベントを処理するスレッド数です。

#### `mysql_service_io_threads_num` {#mysql_service_io_threads_num}

デフォルト：4

FE が NIO モデルに基づく MySQL サーバーを起動するときに、IO イベントを処理するスレッド数です。

#### `mysql_nio_backlog_num` {#mysql_nio_backlog_num}

デフォルト：1024

MySQL NIO サーバーの backlog_num です。この値を増やす場合は、Linux の /proc/sys/net/core/somaxconn ファイルにある値も同時に増やしてください。

#### `broker_timeout_ms` {#broker_timeout_ms}

デフォルト：10000   （10s）

Broker RPC のデフォルトタイムアウトです。

#### `backend_rpc_timeout_ms` {#backend_rpc_timeout_ms}

FE から BE に RPC リクエストを送信する際のタイムアウト（ミリ秒）です。

デフォルト：60000

動的設定が可能か：false

Master FE ノード固有の設定項目か：true

#### `drop_backend_after_decommission` {#drop_backend_after_decommission}

デフォルト：false

IsMutable：true

MasterOnly：true

1. この設定は、BE のデコミッションが正常に完了した後、システムがその BE を削除するかどうかを制御します。true の場合、BE ノードはオフライン化に成功した後に削除されます。false の場合、BE はオフライン化後も DECOMMISSION 状態で残り、削除されません。

   この設定は特定の場面で役立ちます。Doris クラスターの初期状態では各 BE ノードにディスクが 1 台あり、一定期間の運用後、各 BE ノードに新たにディスクを 2 台追加して垂直方向に拡張したとします。Doris は現在、同一 BE 内のディスク間でデータを均衡化する機能をサポートしていないため、初期ディスクのデータ量が新しいディスクより常に多くなる可能性があります。この場合、次の操作でディスク間のバランスを手動で調整できます。

   1. この設定項目を false にします。
   2. ある BE ノードをデコミッションします。これにより、その BE のすべてのデータが他のノードに移行されます。
   3. デコミッションの完了後も BE は削除されません。この時点で BE のデコミッション状態を解除します。すると、他の BE ノードからこのノードへデータが再び分散され、その BE のすべてのディスクにデータが均等に配置されます。
   4. すべての BE ノードに対して手順 2 と 3 を順に実行し、全ノードのディスクのバランスを調整します。

#### `max_backend_down_time_second` {#max_backend_down_time_second}

デフォルト：3600  (1 時間)

IsMutable：true

MasterOnly：true

Backend が *max_backend_down_time_second* の間停止すると、BACKEND_DOWN イベントが発生します。

#### `disable_backend_black_list` {#disable_backend_black_list}

BE のブラックリスト機能を無効にします。無効にすると、BE へのクエリリクエストに失敗しても、その BE はブラックリストに追加されません。
このパラメータは、一時的な不具合によって多数の回帰テストが失敗することを減らすため、回帰テスト環境に適しています。

デフォルト：false

動的設定が可能か：true

Master FE ノード固有の設定項目か：false

#### `max_backend_heartbeat_failure_tolerance_count` {#max_backend_heartbeat_failure_tolerance_count}

BE ノードのハートビート失敗を許容する最大回数です。連続した失敗回数がこの値を超えると、BE の状態は dead に設定されます。
このパラメータは、一時的なハートビート失敗によって多数の回帰テストが失敗することを減らすため、回帰テスト環境に適しています。

デフォルト：1

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

### `abort_txn_after_lost_heartbeat_time_second` {#abort_txn_after_lost_heartbeat_time_second}

ハートビートを失ってからトランザクションを中止するまでの時間です。デフォルト値は 300 で、ハートビートを失ってから 300s 後に BE のトランザクションが中止されます。

デフォルト：300(s)

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

#### `enable_access_file_without_broker` {#enable_access_file_without_broker}

デフォルト：false

IsMutable：true

MasterOnly：true

Broker を介して BOS やその他のクラウドストレージにアクセスする際に、Broker を経由せずにアクセスすることを試みる設定です。

#### `agent_task_resend_wait_time_ms` {#agent_task_resend_wait_time_ms}

デフォルト：5000

IsMutable：true

MasterOnly：true

この設定は、agent_task に create_time が設定されている場合に、そのタスクを再送するかどうかを決めます。ReportHandler が agent task を再送できるのは、current_time - create_time > agent_task_resend_wait_time_ms の場合だけです。

この設定は現在、主に `PUBLISH_VERSION` agent task の重複送信を解決するために使用されます。現在のデフォルト値 5000 は実験的な値です。

agent task を AgentTaskQueue に投入してから BE に送信するまでには一定の遅延があるため、この設定値を増やすと重複送信を効果的に減らせます。

一方で、送信または実行に失敗した agent task の再実行までの時間も長くなります。

#### `max_agent_task_threads_num` {#max_agent_task_threads_num}

デフォルト：4096

MasterOnly：true

agent task のスレッドプールでタスクを処理するスレッドの最大数です。

#### `remote_fragment_exec_timeout_ms` {#remote_fragment_exec_timeout_ms}

デフォルト：30000  （ms）

IsMutable：true

非同期リモート fragment の実行タイムアウトです。通常は短時間で実行されます。システムの負荷が高い場合は、タイムアウトを長くしてみてください。

#### `auth_token` {#auth_token}

デフォルト：empty

内部認証に使用するクラスタートークンです。

#### `enable_http_server_v2` {#enable_http_server_v2}

デフォルト：正式なバージョン 0.14.0 のリリース後は true、それ以前は false

HTTP Server V2 は SpringBoot で実装されています。フロントエンドとバックエンドを分離したアーキテクチャを使用します。新しいフロントエンド UI を使用できるのは、HTTPv2 が有効な場合だけです。

#### `http_api_extra_base_path` {#http_api_extra_base_path}

デプロイ環境によっては、HTTP API に共通のプレフィックスとして追加のベースパスを指定する必要があります。このパラメータでそのプレフィックスを指定します。
設定後は、`GET /api/basepath` インターフェースで値を取得できます。新しい UI も、URL を組み立てるためにこのベースパスを先に取得しようとします。`enable_http_server_v2` が true の場合にのみ有効です。

デフォルトは空で、未設定を意味します。

#### `jetty_server_acceptors` {#jetty_server_acceptors}

デフォルト：2

#### `jetty_server_selectors` {#jetty_server_selectors}

デフォルト：4

#### `jetty_server_workers` {#jetty_server_workers}

デフォルト：0

上記 3 つのパラメータで設定する Jetty のスレッド構成は単純で、acceptors、selectors、workers の 3 つのスレッドプールに分かれます。acceptors が新しい接続を受け付け、selectors に渡して HTTP メッセージプロトコルを解析し、最後に workers がリクエストを処理します。最初の 2 つのスレッドプールはノンブロッキングモデルを採用し、1 スレッドで多数のソケットの読み書きを扱えるため、少数のスレッドで済みます。

ほとんどのプロジェクトでは acceptors は 1～2 スレッド、selectors は 2～4 スレッドで十分です。workers はブロッキングな業務ロジックを扱い、データベース操作が多いこともあるため、多数のスレッドが必要です。具体的な数はアプリケーションの QPS と IO イベントの割合によって異なります。QPS が高いほど多くのスレッドが必要で、IO の割合が高いほど待機するスレッドが増え、必要な総スレッド数も増えます。

worker スレッドプールはデフォルトでは設定されないため、必要に応じて設定してください。

#### `jetty_server_max_http_post_size` {#jetty_server_max_http_post_size}

デフォルト：`100 * 1024 * 1024`  （100MB）

PUT または POST メソッドでアップロードするファイルの最大バイト数です。デフォルト値は 100MB です。

#### `jetty_server_max_http_header_size` {#jetty_server_max_http_header_size}

デフォルト：1048576  （1M）

HTTP ヘッダーのサイズを設定します。デフォルト値は 1M です。

#### `http_sql_submitter_max_worker_threads` {#http_sql_submitter_max_worker_threads}

デフォルト：2

HTTP SQL submitter のワーカースレッドの最大数です。

#### `http_load_submitter_max_worker_threads` {#http_load_submitter_max_worker_threads}

デフォルト：2

HTTP アップロード submitter のワーカースレッドの最大数です。

:::caution 動作の変更（4.1.4）

バージョン 4.1.4 で `/api/upload` エンドポイントが削除され、この設定項目も同時に削除されました。[Upload Action](../open-api/fe-http/upload-action) を参照してください。

:::

### クエリエンジン {#query-engine}

#### `default_max_query_instances` {#default_max_query_instances}

ユーザープロパティ max_query_instances が 0 以下の場合に使用するデフォルト値です。ユーザーごとのインスタンスの最大数を制限します。このパラメータが 0 以下の場合は無制限です。

デフォルト値は -1 です。

#### `max_query_retry_time` {#max_query_retry_time}

デフォルト：3

IsMutable：true

クエリの再試行回数です。RPC 例外が発生し、結果をまだユーザーに送信していない場合、クエリが再試行されることがあります。連鎖的な障害を避けるため、この回数を減らすことができます。

#### `max_dynamic_partition_num` {#max_dynamic_partition_num}

デフォルト：500

IsMutable：true

MasterOnly：true

動的パーティションテーブルの作成時に、一度に作成されるパーティションが多すぎないよう、最大数を制限します。パーティション数は、動的パーティションのパラメータ「start」と「end」によって決まります。

#### `dynamic_partition_enable` {#dynamic_partition_enable}

デフォルト：true

IsMutable：true

MasterOnly：true

動的パーティションスケジューラーを有効にするかどうかを指定します。デフォルトで有効です。

#### `dynamic_partition_check_interval_seconds` {#dynamic_partition_check_interval_seconds}

デフォルト：600 （s）

IsMutable：true

MasterOnly：true

動的パーティションを確認する間隔を指定します。

#### `max_multi_partition_num` {#max_multi_partition_num}

デフォルト：4096

IsMutable：true

MasterOnly：true

このパラメータはマルチパーティションのパーティション名のプレフィックスを設定するために使用します。動的パーティションには適用されません。デフォルトのプレフィックスは「p_」です。

#### `multi_partition_name_prefix` {#multi_partition_name_prefix}

デフォルト：p_

IsMutable：true

MasterOnly：true

マルチパーティションのパーティション名のプレフィックスを設定します。動的パーティションには適用されません。デフォルトのプレフィックスは「p_」です。

#### `partition_in_memory_update_interval_secs` {#partition_in_memory_update_interval_secs}

デフォルト：300 (s)

IsMutable：true

MasterOnly：true

メモリ内のグローバルなパーティション情報を更新する間隔です。

#### `enable_concurrent_update` {#enable_concurrent_update}

デフォルト：false

IsMutable：false

MasterOnly：true

同時更新を有効にするかどうかを指定します。

#### `lower_case_table_names` {#lower_case_table_names}

デフォルト：0

IsMutable：false

MasterOnly：true

この設定はクラスターの初期化時にのみ指定できます。初期化の完了後は、クラスターの再起動やアップグレードの際にも変更できません。

0：テーブル名は指定どおりに保存され、大文字と小文字を区別して比較されます。
1：テーブル名は小文字で保存され、大文字と小文字を区別せずに比較されます。
2：テーブル名は指定どおりに保存されますが、小文字として比較されます。

#### `table_name_length_limit` {#table_name_length_limit}

デフォルト：64

IsMutable：true

MasterOnly：true

テーブル名の最大長を制御します。

#### `cache_enable_sql_mode` {#cache_enable_sql_mode}

デフォルト：true

IsMutable：true

MasterOnly：false

このスイッチを有効にすると、SQL クエリの結果セットがキャッシュされます。クエリ内の全テーブルの全パーティションについて、最後のバージョン更新からの時間が cache_last_version_interval_second を超え、結果セットの行数が cache_result_max_row_count 未満で、データサイズが cache_result_max_data_size 未満の場合、結果セットがキャッシュされます。次に同じ SQL を実行するとキャッシュが使用されます。

true に設定すると、FE は SQL 結果のキャッシュを有効にします。この設定はオフラインでデータを更新する場合に適しています。

|                        | case1 | case2 | case3 | case4 |
| ---------------------- | ----- | ----- | ----- | ----- |
| enable_sql_cache       | false | true  | true  | false |
| enable_partition_cache | false | false | true  | true  |

#### `cache_enable_partition_mode` {#cache_enable_partition_mode}

デフォルト：true

IsMutable：true

MasterOnly：false

true に設定すると、FE は BE のキャッシュからデータを取得します。一部のパーティションをリアルタイムに更新する場合に適しています。

#### `cache_result_max_row_count` {#cache_result_max_row_count}

デフォルト：3000

IsMutable：true

MasterOnly：false

メモリを使いすぎないよう、キャッシュ可能な最大行数はデフォルトで 3000 です。このしきい値を超えるとキャッシュされません。

#### `cache_result_max_data_size` {#cache_result_max_data_size}

デフォルト：31457280

IsMutable：true

MasterOnly：false

メモリを使いすぎないよう、キャッシュ可能な行のデータサイズはデフォルトで最大 10MB です。このしきい値を超えるとキャッシュされません。

#### `cache_last_version_interval_second` {#cache_last_version_interval_second}

デフォルト：30

IsMutable：true

MasterOnly：false

テーブルの最新パーティションバージョンに関する時間間隔で、データ更新から現在のバージョンまでの時間を表します。通常は 900 秒に設定し、オフラインのインポートとリアルタイムのインポートを区別します。

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

ハッシュ分散 pruner の再帰の最大深度を制限します。
例：where a in (5 elements) and b in (4 elements) and c in (3 elements) and d in (2 elements)。
a/b/c/d が分散列の場合、再帰の深度は 5 *4* 3 * 2 = 120 となり、100 を超えます。
そのため分散 pruner は動作せず、すべてのバケットを返します。
深度を増やすと、より多くの要素について分散の枝刈りが可能になりますが、CPU の使用量が増える可能性があります。

#### `enable_local_replica_selection` {#enable_local_replica_selection}

デフォルト：false

IsMutable：true

true に設定すると、Planner はこの Frontend と同じホストにある Tablet のレプリカを選択しようとします。
次の場合はネットワーク転送を減らせる可能性があります。

* N 台のホストに、N 台の Backend と N 台の Frontend が配置されている。

* データに N 個のレプリカがある。

* 同時実行数の多いクエリが、すべての Frontend に均等に送信される。

この場合、各 Frontend はローカルレプリカだけを使ってクエリを実行できます。ローカルレプリカを使用できないときに非ローカルレプリカへ切り替えるには、enable_local_replica_selection_fallback を true に設定します。

#### `enable_local_replica_selection_fallback` {#enable_local_replica_selection_fallback}

デフォルト：false

IsMutable：true

enable_local_replica_selection と組み合わせて使用します。ローカルレプリカを使用できない場合、非ローカルレプリカに切り替えます。

#### `expr_depth_limit` {#expr_depth_limit}

デフォルト：3000

IsMutable：true

式ツリーの深度の上限です。超過すると、データベースの読み取りロックを保持したまま解析に長時間かかる可能性があります。十分に理解していない場合は変更しないでください。

#### `expr_children_limit` {#expr_children_limit}

デフォルト：10000

IsMutable：true

式ツリーの子式の数の上限です。超過すると、データベースの読み取りロックを保持したまま解析に長時間かかる可能性があります。

#### `be_exec_version` {#be_exec_version}

fragment 間でブロックを渡すときのシリアライズ形式を定義します。

コードの変更によってブロックのデータ形式が変わる場合があります。ローリングアップグレード中も BE 間の互換性を維持するため、FE からデータバージョンを通知し、送信形式を決める必要があります。

たとえば、クラスター内に 2 台の BE があり、一方はアップグレード後に最新の $v_1$ に対応し、もう一方は $v_0$ にしか対応しないとします。この時点では FE がまだアップグレードされていないため、$v_0 が一律に通知されます。$, BE は古いデータ形式でやり取りします。すべての BE のアップグレード後に FE をアップグレードすると、新しい FE が $v_1$ を通知し、クラスター全体が新しいデータ形式に切り替わります。

デフォルト値は `max_be_exec_version` です。特別な事情があれば形式のバージョンを手動で下げられますが、`min_be_exec_version` より低くしてはいけません。

すべての BE で、この変数の値を常に `BeExecVersionManager::min_be_exec_version` と `BeExecVersionManager::max_be_exec_version` の間に保つ必要があります。（更新済みクラスターをダウングレードする場合は、先に FE、次に BE をダウングレードする順序を守るか、設定でこの変数の値を手動で下げてから BE をダウングレードしてください。）

#### `max_be_exec_version` {#max_be_exec_version}

現在サポートされる最新のデータバージョンです。変更できず、対応するバージョンの BE にある `BeExecVersionManager::max_be_exec_version` と一致する必要があります。

#### `min_be_exec_version` {#min_be_exec_version}

現在サポートされる最も古いデータバージョンです。変更できず、対応するバージョンの BE にある `BeExecVersionManager::min_be_exec_version` と一致する必要があります。

#### `max_query_profile_num` {#max_query_profile_num}

クエリプロファイルの最大数です。

デフォルト：100

動的設定が可能か：true

Master FE ノード固有の設定項目か：false

#### `publish_version_interval_ms` {#publish_version_interval_ms}

デフォルト：10 （ms）

2 回の publish version 操作の最小間隔です。

#### `publish_version_timeout_second` {#publish_version_timeout_second}

デフォルト：30 （s）

IsMutable：true

MasterOnly：true

1 つのトランザクションに属するすべての publish version タスクの完了を待つ最大時間です。

#### `query_colocate_join_memory_limit_penalty_factor` {#query_colocate_join_memory_limit_penalty_factor}

デフォルト：1

IsMutable：true

Colocote join PlanFragment インスタンスの memory_limit = exec_mem_limit / min (query_colocate_join_memory_limit_penalty_factor, instance_num)

#### `rewrite_count_distinct_to_bitmap_hll` {#rewrite_count_distinct_to_bitmap_hll}

デフォルト：true

この変数はセッション変数であり、セッション単位で有効になります。

* 型：boolean
* 説明：**AGG モデルのテーブルのみが対象です。** この変数が true の場合、ユーザーのクエリに count(distinct c1) などの集約関数が含まれ、c1 列の型が bitmap なら、count distinct は bitmap_union_count(c1) に書き換えられます。c1 列の型が hll なら、hll_union_agg(c1) に書き換えられます。false の場合は書き換えられません。

### データロードとエクスポート {#load-and-export}

#### `streaming_cdc_fetch_splits_batch_size` {#streaming_cdc_fetch_splits_batch_size}

デフォルト：16（4.1.5 より前は 100）

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

Streaming CDC のリクエストごとに取得する split の数です。バージョン 4.1.5 では、各リクエストのサイズを減らすため、デフォルト値が 100 から 16 に引き下げられました。

#### `max_export_history_job_num` {#max_export_history_job_num}

デフォルト：1000

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

EXPORT ジョブの履歴を削除する際のしきい値です。バージョン 4.1.5 以降、削除対象は `FINISHED` / `CANCELLED` のジョブだけで、実行中のジョブは保持されます。そのため、稼働中のジョブによって記録の総数がこの値を超えることがあります。

#### `enable_pipeline_load` {#enable_pipeline_load}

デフォルト値：true

IsMutable：true

Streamload などのインポートタスクに Pipeline エンジンを使用するかどうかを指定します。

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

形式が不正なデータなど、フィルターで除外できるデータの最大割合です。デフォルト値は 0 です。

#### `max_running_txn_num_per_db` {#max_running_txn_num_per_db}

デフォルト：1000

IsMutable：true

MasterOnly：true

主に、同じデータベースで同時実行されるデータロードジョブの数を制御します。

クラスターで実行中のデータロードジョブが多すぎる場合、新たに投入したジョブで次のエラーが報告されることがあります。

```text
current running txns on db xxx is xx, larger than limit xx
```

このエラーは、現在実行中のデータロードジョブ数が設定値を超えたことを示します。その場合は、アプリケーション側で待機してからデータロードジョブを再試行することを推奨します。

Connector を使用している場合は、このパラメータを適宜調整でき、数千に設定しても問題ありません。

#### `using_old_load_usage_pattern` {#using_old_load_usage_pattern}

デフォルト：false

IsMutable：true

MasterOnly：true

true に設定すると、処理エラーが発生した INSERT 文でもユーザーにラベルが返され、そのラベルでデータロードジョブの状態を確認できます。デフォルトの false では、INSERT 操作でエラーが発生すると、データロードラベルを返さずに例外がユーザークライアントへ直接送られます。

#### `disable_load_job` {#disable_load_job}

デフォルト：false

IsMutable：true

MasterOnly：true

true に設定した場合：

* 保留中のデータロードジョブはすべて、begin txn API の呼び出し時に失敗します。
* prepare 状態のデータロードジョブはすべて、commit txn API の呼び出し時に失敗します。
* commit 済みのデータロードジョブはすべて、公開待ちになります。

#### `commit_timeout_second` {#commit_timeout_second}

デフォルト：30

IsMutable：true

MasterOnly：true

1 つのトランザクションより前に挿入されたすべてのデータが commit されるまでの最大待機時間です。
コマンド「commit」のタイムアウト秒数です。

#### `max_unfinished_load_job` {#max_unfinished_load_job}

デフォルト：1000

IsMutable：true

MasterOnly：true

PENDING、ETL、LOADING、QUORUM_FINISHED を含むデータロードジョブの最大数です。この数を超えると新しいジョブを投入できません。

#### `db_used_data_quota_update_interval_secs` {#db_used_data_quota_update_interval_secs}

デフォルト：300 (s)

IsMutable：true

MasterOnly：true

Master のデーモンスレッドが、`db_used_data_quota_update_interval_secs` ごとに db txn manager のデータベース使用量クォータを更新します。

データロードの性能を高めるため、データロード前にデータベースの使用済みデータ量がクォータを超えるか確認する際は、使用量をリアルタイムに計算せず、デーモンスレッドが定期的に更新した値を取得します。

この設定は、データベースの使用済みデータ量を更新する時間間隔を指定します。

#### `disable_show_stream_load` {#disable_show_stream_load}

デフォルト：false

IsMutable：true

MasterOnly：true

show stream load を無効にし、メモリ内の stream load の記録を消去するかどうかを指定します。

#### `max_stream_load_record_size` {#max_stream_load_record_size}

デフォルト：5000

IsMutable：true

MasterOnly：true

メモリに保存できる最近の stream load の記録の最大数です。

#### `fetch_stream_load_record_interval_second` {#fetch_stream_load_record_interval_second}

デフォルト：120

IsMutable：true

MasterOnly：true

stream load の記録を取得する間隔です。

#### `max_bytes_per_broker_scanner` {#max_bytes_per_broker_scanner}

デフォルト：`500 * 1024 * 1024 * 1024L`  （500G）

IsMutable：true

MasterOnly：true

1 つの broker load ジョブで 1 つの broker scanner が処理できる最大バイト数です。通常、各 Backend に broker scanner が 1 つあります。

#### `default_load_parallelism` {#default_load_parallelism}

デフォルト：8

IsMutable：true

MasterOnly：true

単一ノードにおける broker load 実行プランのデフォルトの並列度です。
broker load の投入時にユーザーが並列度を指定した場合、このパラメータは無視されます。
このパラメータは、`max broker concurrency` や `min bytes per broker scanner` などの設定とともに、インポートタスクの同時実行数を決めます。

#### `max_broker_concurrency` {#max_broker_concurrency}

デフォルト：10

IsMutable：true

MasterOnly：true

broker scanner の最大同時実行数です。

#### `min_bytes_per_broker_scanner` {#min_bytes_per_broker_scanner}

デフォルト：67108864L (64M)

IsMutable：true

MasterOnly：true

1 つの broker scanner が読み取る最小バイト数です。

#### `period_of_auto_resume_min` {#period_of_auto_resume_min}

デフォルト：5 （s）

IsMutable：true

MasterOnly：true

Routine Load を自動再開する周期です。

#### `max_tolerable_backend_down_num` {#max_tolerable_backend_down_num}

デフォルト：0

IsMutable：true

MasterOnly：true

BE が 1 台でも停止していると、Routine Load は自動的に再開されません。

#### `max_routine_load_task_num_per_be` {#max_routine_load_task_num_per_be}

デフォルト：5

IsMutable：true

MasterOnly：true

BE ごとの Routine Load タスクの最大同時実行数です。BE に送信するタスク数を制限し、BE の設定 'routine_load_thread_pool_size'（デフォルト 10）で指定された Routine Load タスクのスレッドプールサイズより小さくする必要があります。

#### `max_routine_load_task_concurrent_num` {#max_routine_load_task_concurrent_num}

デフォルト：5

IsMutable：true

MasterOnly：true

単一の Routine Load ジョブに属するタスクの最大同時実行数です。

#### `max_routine_load_job_num` {#max_routine_load_job_num}

デフォルト：100

NEED_SCHEDULED、RUNNING、PAUSE を含む Routine Load ジョブの最大数です。

#### `desired_max_waiting_jobs` {#desired_max_waiting_jobs}

デフォルト：100

IsMutable：true

MasterOnly：true

Routine Load とバージョン 2 のデータロードで待機するジョブの目標数です。Master の切り替え時など、実際の数が desired_max_waiting_jobs を超える場合があります。

#### `disable_hadoop_load` {#disable_hadoop_load}

デフォルト：false

IsMutable：true

MasterOnly：true

Hadoop クラスターを使用したデータロードは将来非推奨になります。true に設定すると、この方式を無効にします。

#### `enable_spark_load` {#enable_spark_load}

デフォルト：false

IsMutable：true

MasterOnly：true

Spark Load を一時的に有効にするかどうかを指定します。デフォルトでは有効になっていません。

**注：** このパラメータはバージョン 1.2 で削除され、spark_load はデフォルトで有効になりました。

#### `spark_load_checker_interval_second` {#spark_load_checker_interval_second}

デフォルト：60

Spark Load スケジューラーの実行間隔です。デフォルトは 60 秒です。

#### `async_loading_load_task_pool_size` {#async_loading_load_task_pool_size}

デフォルト：10

IsMutable：false

MasterOnly：true

loading_load タスク実行用プールのサイズです。同時に実行できる loading_load タスクの最大数を制限します。

現在は broker load の loading_load タスクのみを制限します。

#### `async_pending_load_task_pool_size` {#async_pending_load_task_pool_size}

デフォルト：10

IsMutable：false

MasterOnly：true

pending_load タスク実行用プールのサイズです。同時に実行できる pending_load タスクの最大数を制限します。

現在は broker load と spark load の pending_load タスクのみを制限します。

'max_running_txn_num_per_db' より小さくする必要があります。

#### `async_load_task_pool_size` {#async_load_task_pool_size}

デフォルト：10

IsMutable：false

MasterOnly：true

旧バージョンとの互換性のためだけに残されている設定です。async_loading_load_task_pool_size に置き換えられており、将来削除されます。

#### `enable_single_replica_load` {#enable_single_replica_load}

デフォルト：false

IsMutable：true

MasterOnly：true

stream load と broker load で、単一レプリカへの書き込みを有効にするかどうかを指定します。

#### `min_load_timeout_second` {#min_load_timeout_second}

デフォルト：1 （1s）

IsMutable：true

MasterOnly：true

すべての種類のデータロードに適用される stream load タイムアウトの最小値です。

#### `max_stream_load_timeout_second` {#max_stream_load_timeout_second}

デフォルト：259200 (3 日)

IsMutable：true

MasterOnly：true

stream load のタイムアウト設定を制限するための設定です。ユーザーが大きなタイムアウトを指定したために、失敗した stream load トランザクションを短時間でキャンセルできなくなることを防ぎます。

#### `max_load_timeout_second` {#max_load_timeout_second}

デフォルト：259200 (3 日)

IsMutable：true

MasterOnly：true

stream load を除く、すべての種類のデータロードに適用されるタイムアウトの最大値です。

#### `stream_load_default_timeout_second` {#stream_load_default_timeout_second}

デフォルト：86400 * 3 (3 日)

IsMutable：true

MasterOnly：true

stream load と streaming mini load のデフォルトタイムアウトです。

#### `stream_load_default_precommit_timeout_second` {#stream_load_default_precommit_timeout_second}

デフォルト：3600（s）

IsMutable：true

MasterOnly：true

stream load の事前 commit のデフォルトタイムアウトです。

#### `stream_load_default_memtable_on_sink_node` {#stream_load_default_memtable_on_sink_node}

デフォルト：false

IsMutable：true

MasterOnly：true

stream load で、sink node 上の memtable をデフォルトで有効にします。
HTTP ヘッダー `memtable_on_sink_node` が設定されていない場合に使用されます。

#### `insert_load_default_timeout_second` {#insert_load_default_timeout_second}

デフォルト：3600 (1 時間)

IsMutable：true

MasterOnly：true

insert load のデフォルトタイムアウトです。

#### `mini_load_default_timeout_second` {#mini_load_default_timeout_second}

デフォルト：3600 (1 時間)

IsMutable：true

MasterOnly：true

非ストリーミングの mini load のデフォルトタイムアウトです。

#### `broker_load_default_timeout_second` {#broker_load_default_timeout_second}

デフォルト：14400 (4 時間)

IsMutable：true

MasterOnly：true

broker load のデフォルトタイムアウトです。

#### `spark_load_default_timeout_second` {#spark_load_default_timeout_second}

デフォルト：86400  (1 日)

IsMutable：true

MasterOnly：true

spark load のデフォルトタイムアウトです。

#### `hadoop_load_default_timeout_second` {#hadoop_load_default_timeout_second}

デフォルト：86400 * 3   (3 日)

IsMutable：true

MasterOnly：true

hadoop load のデフォルトタイムアウトです。

#### `load_running_job_num_limit` {#load_running_job_num_limit}

デフォルト：0

IsMutable：true

MasterOnly：true

実行中のデータロードタスクの数を制限します。デフォルトの 0 は無制限です。

#### `load_input_size_limit_gb` {#load_input_size_limit_gb}

デフォルト：0

IsMutable：true

MasterOnly：true

Load ジョブに入力するデータのサイズを制限します。デフォルトの 0 は無制限です。

#### `load_etl_thread_num_normal_priority` {#load_etl_thread_num_normal_priority}

デフォルト：10

優先度 NORMAL の ETL データロードジョブの同時実行数です。十分に理解していない場合は変更しないでください。

#### `load_etl_thread_num_high_priority` {#load_etl_thread_num_high_priority}

デフォルト：3

優先度 HIGH の ETL データロードジョブの同時実行数です。十分に理解していない場合は変更しないでください。

#### `load_pending_thread_num_normal_priority` {#load_pending_thread_num_normal_priority}

デフォルト：10

優先度 NORMAL の保留中のデータロードジョブの同時実行数です。十分に理解していない場合は変更しないでください。

#### `load_pending_thread_num_high_priority` {#load_pending_thread_num_high_priority}

デフォルト：3

優先度 HIGH の保留中のデータロードジョブの同時実行数です。データロードジョブの優先度は HIGH または NORMAL です。mini batch load ジョブはすべて HIGH、それ以外の種類のジョブは NORMAL です。優先度は、処理の遅いジョブが長時間スレッドを占有することを避けるために設けられています。これは内部的なスケジューリングの最適化です。現在、ジョブの優先度を手動で指定することはできません。十分に理解していない場合は変更しないでください。

#### `load_checker_interval_second` {#load_checker_interval_second}

デフォルト：5 （s）

データロードスケジューラーの実行間隔です。データロードジョブの状態は PENDING から LOADING、さらに FINISHED へ遷移します。スケジューラーが PENDING から LOADING へ移し、トランザクションのコールバックが LOADING から FINISHED へ移します。同時実行数が上限に達していない場合、ジョブの完了までに追加でかかる時間は最大 1 間隔です。

#### `s3_load_endpoint_white_list` {#s3_load_endpoint_white_list}

デフォルト：empty

動的設定が可能か：false

S3 Load で使用を許可するエンドポイントのホワイトリストです。複数の値はコンマで区切ります。例：`s3_load_endpoint_white_list=a,b,c`。空の値はホワイトリストを設定しないことを意味します。

:::caution 動作の変更（4.1.4）

セキュリティ上の理由により、バージョン 4.1.4 以降、この設定項目は**動的に変更できません**。`fe.conf` でのみ設定でき、FE の再起動後に有効になります。`ADMIN SET FRONTEND CONFIG` では変更できなくなりました。

:::

#### `resource_group_load_success_quorum` {#resource_group_load_success_quorum}

デフォルト：empty

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

バージョン 4.1.4 で追加されました。リソースグループ（BE の Location Tag）ごとに、データロードのトランザクションを commit する際、**書き込みが成功している必要があるレプリカの最小数**を設定します。

値はコンマ区切りのリストで、各項目は `<resource_group>:<min_success_replicas>` の形式を使用します。`<min_success_replicas>` には負でない整数を指定します。例：

```properties
resource_group_load_success_quorum=group_a:2,group_b:1
```

トランザクションの commit 時に、設定されたリソースグループで書き込みに成功したレプリカ数が指定値より少ない場合、commit は失敗します。設定に含まれないリソースグループは確認されません。形式が不正な項目は無視され、`fe.log` に警告が出力されます。

複数のデータセンターまたはアベイラビリティーゾーンにデプロイする場合、指定されたデータセンターで一定数のレプリカへの書き込みが完了してからデータロードを成功と見なすために使用します。

#### `enable_adaptive_random_bucket_load` {#enable_adaptive_random_bucket_load}

デフォルト：true

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

バージョン 4.1.4 で追加されました。適応的なランダムバケットデータロードを有効にするかどうかを指定します。

有効にすると、FE は Tablet の配置情報を BE に送信し、各 BE はプライマリレプリカを保持するローカルバケットの集合を判定します。単一の Tablet に書き込んだデータ量がしきい値（デフォルト 200 MB）を超えると、ローカルバケット間で書き込み先を順に切り替えます。これにより、ランダムバケットで分散された（`DISTRIBUTED BY RANDOM`）テーブルのデータロード時のメモリ負荷を軽減し、スループットを改善します。すべてのデータロード方法に適用されます。

この機能には、BE の設定 `enable_table_memtable_flush_backpressure` と `table_memtable_flush_pending_count_limit` による制約もあります。[BE 設定](./be-config) を参照してください。

#### `enable_forward_group_commit_stream_load_to_follower` {#enable_forward_group_commit_stream_load_to_follower}

デフォルト：false

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

バージョン 4.1.4 で追加されました。Group Commit を使用する Stream Load リクエストを Follower FE に転送するかどうかを指定します。

有効にすると、Group Commit モードの Stream Load リクエストがラウンドロビン方式で Follower FE に転送され、バッチ処理の負荷が複数の FE に分散されます。

対象テーブルの `light_schema_change` プロパティが `false` の場合、転送はサポートされず、リクエストはエラーで失敗します。

#### `streaming_job_snapshot_offset_persist_interval_sec` {#streaming_job_snapshot_offset_persist_interval_sec}

デフォルト：300 (s)

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

バージョン 4.1.4 で追加されました。Streaming Job（継続的なデータロードジョブ）のフルスナップショット段階で、オフセットを永続化する 2 回の処理の最小間隔を秒単位で指定します。値を小さくすると、ジョブの再起動後に再生が必要なデータ量は減りますが、メタデータの書き込み頻度が増えます。

#### `label_keep_max_second` {#label_keep_max_second}

デフォルト：`3 * 24 * 3600`  (3 日)

IsMutable：true

MasterOnly：true

完了またはキャンセルされたデータロードジョブのラベルは、`label_keep_max_second` の経過後に削除されます。

1. 削除されたラベルは再利用できます。
2. 保持期間を短くすると FE のメモリ使用量が減ります。（削除されるまで、すべてのデータロードジョブの情報がメモリに保持されるためです。）

書き込みの同時実行数が多く、ジョブが大量に滞留して Frontend サービスの呼び出しに失敗する場合は、ログを確認してください。メタデータの書き込みがロックを長時間保持する場合は、この値を 12 時間または 6 時間以下に調整できます。

#### `streaming_label_keep_max_second` {#streaming_label_keep_max_second}

デフォルト：43200 (12 時間)

IsMutable：true

MasterOnly：true

INSERT、STREAMING LOAD、ROUTINE_LOAD_TASK など、高頻度で実行されるデータロードに適用します。保持期間が過ぎると、完了したジョブまたはタスクが削除されます。

#### `label_clean_interval_second` {#label_clean_interval_second}

デフォルト：1 * 3600  (1 時間)

データロードラベルのクリーナーは、*label_clean_interval_second* ごとに実行され、期限切れのジョブを削除します。

#### `label_regex_length` {#label_regex_length}

デフォルト値：128（文字）

データロードラベルの最大文字数です。デフォルトは 128 文字です。

#### `transaction_clean_interval_second` {#transaction_clean_interval_second}

デフォルト：30

トランザクションが可視化または中止された後、transaction_clean_interval_second 秒で削除されます。この間隔はできるだけ短くし、各削除処理もできるだけ早く完了させる必要があります。

#### `sync_commit_interval_second` {#sync_commit_interval_second}

トランザクションを commit するまでの最大時間間隔です。この時間が経過してもチャネルに未投入のデータが残っている場合、consumer がチャネルにトランザクションの commit を通知します。

デフォルト：10（秒）

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

#### `sync_checker_interval_second` {#sync_checker_interval_second}

データ同期ジョブの実行状態を確認する間隔です。

デフォルト：10 (s)

#### `max_sync_task_threads_num` {#max_sync_task_threads_num}

データ同期ジョブのスレッドプールにおける最大スレッド数です。

デフォルト値：10

#### `min_sync_commit_size` {#min_sync_commit_size}

トランザクションを commit するために必要なイベントの最小数です。FE が受信したイベント数がこの値より少ない場合、`sync_commit_interval_second` を超えるまで次のデータバッチを待ちます。デフォルト値は 10000 イベントです。この設定を変更する場合は、canal 側の `canal.instance.memory.buffer.size`（デフォルト 16384）より小さくしてください。そうしないと、ack の前に FE がストア内のキュー長より多くのイベントを取得しようとして、ストアのキューがタイムアウトまでブロックされます。

デフォルト：10000

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

#### `min_bytes_sync_commit` {#min_bytes_sync_commit}

トランザクションを commit するために必要な最小データサイズです。FE が受信したデータサイズがこの値より小さい場合、`sync_commit_interval_second` を超えるまで次のデータバッチを待ちます。デフォルト値は 15MB です。この設定を変更する場合は、canal 側の `canal.instance.memory.buffer.size` と `canal.instance.memory.buffer.memunit` の積（デフォルト 16MB）より小さくしてください。そうしないと、ack の前に FE がストアの容量より多くのデータを取得しようとして、ストアのキューがタイムアウトまでブロックされます。

デフォルト：`15*1024*1024` (15M)

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

#### `max_bytes_sync_commit` {#max_bytes_sync_commit}

データ同期ジョブのスレッドプールの最大スレッド数です。FE 全体にスレッドプールは 1 つだけあり、FE から BE にデータを送信するすべてのデータ同期タスクを処理します。スレッドプールは `SyncTaskPool` クラスで実装されています。

デフォルト：10

動的設定が可能か：false

Master FE ノード固有の設定項目か：false

#### `enable_outfile_to_local` {#enable_outfile_to_local}

デフォルト：false

outfile 機能で結果をローカルディスクにエクスポートできるようにするかどうかを指定します。

#### `export_tablet_num_per_task` {#export_tablet_num_per_task}

デフォルト：5

IsMutable：true

MasterOnly：true

エクスポート用クエリプランごとの Tablet 数です。

#### `export_task_default_timeout_second` {#export_task_default_timeout_second}

デフォルト：2 * 3600   (2 時間)

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

デフォルト：1024  （1G）

1 つのシステムログまたは監査ログの最大サイズです。

#### `sys_log_dir` {#sys_log_dir}

デフォルト：DorisFE.DORIS_HOME_DIR + "/log"

FE ログのディレクトリを指定します。FE は 2 つのログファイルを生成します。

fe.log:      FE プロセスのすべてのログ。
fe.warn.log  FE プロセスのすべての WARNING ログと ERROR ログ。

#### `sys_log_level` {#sys_log_level}

デフォルト：INFO

ログレベル：INFO、WARN、ERROR、FATAL

#### `sys_log_roll_num` {#sys_log_roll_num}

デフォルト：10

sys_log_roll_interval 内に保持する FE ログファイルの最大数です。デフォルトは 10 で、1 日に最大 10 個のログファイルが保持されることを意味します。

#### `sys_log_verbose_modules` {#sys_log_verbose_modules}

デフォルト：{}

詳細ログを出力するモジュールです。VERBOSE レベルは log4j の DEBUG レベルで実装されています。

例：
   sys_log_verbose_modules = org.apache.doris.catalog
   この場合、org.apache.doris.catalog パッケージとそのすべてのサブパッケージにあるファイルのデバッグログだけが出力されます。

#### `sys_log_roll_interval` {#sys_log_roll_interval}

デフォルト：DAY

sys_log_roll_interval：

* DAY：ログの接尾辞は yyyyMMdd
* HOUR：ログの接尾辞は yyyyMMddHH

#### `sys_log_delete_age` {#sys_log_delete_age}

デフォルト：7d

デフォルトは 7 日です。ログの最終更新から 7 日が経過すると削除されます。

サポートされる形式：

* 7d      7 日
* 10h     10 時間
* 60m     60 分
* 120s    120 秒

#### `sys_log_roll_mode` {#sys_log_roll_mode}

デフォルト：SIZE-MB-1024

ログファイルを分割するサイズです。1 G ごとに分割します。

#### `sys_log_enable_compress` {#sys_log_enable_compress}

デフォルト：false

true の場合、fe.log と fe.warn.log を gzip で圧縮します。

#### `audit_log_dir` {#audit_log_dir}

デフォルト：DORIS_HOME_DIR + "/log"

audit_log_dir：
FE 監査ログのディレクトリを指定します。
監査ログ fe.audit.log には、ユーザー、ホスト、所要時間、状態などの関連情報とともに、すべてのリクエストが記録されます。

#### `audit_log_roll_num` {#audit_log_roll_num}

デフォルト：90

audit_log_roll_interval 内に保持する FE 監査ログファイルの最大数です。

#### `audit_log_modules` {#audit_log_modules}

デフォルト：{"slow_query", "query", "load", "stream_load"}

Slow query には、所要時間が *qe_slow_log_ms* を超えたすべてのクエリが含まれます。

#### `qe_slow_log_ms` {#qe_slow_log_ms}

デフォルト：5000（5 秒）

クエリの応答時間がこのしきい値を超えると、監査ログに slow_query として記録されます。

#### `audit_log_roll_interval` {#audit_log_roll_interval}

デフォルト：DAY

DAY：ログの接尾辞は yyyyMMdd
HOUR：ログの接尾辞は yyyyMMddHH

#### `audit_log_delete_age` {#audit_log_delete_age}

デフォルト：30d

デフォルトは 30 日です。ログの最終更新から 30 日が経過すると削除されます。

サポートされる形式：
* 7d      7 日
* 10h     10 時間
* 60m     60 分
* 120s    120 秒

#### `audit_log_enable_compress` {#audit_log_enable_compress}

デフォルト：false

true の場合、fe.audit.log を gzip で圧縮します。

### ストレージ {#storage}

#### `inverted_index_storage_format` {#inverted_index_storage_format}

デフォルト：`V3`

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

新しい転置インデックスのデフォルトのストレージ形式です。バージョン 4.1.5 以降、V1 形式の転置インデックスの作成と、この設定を動的に `V1` に変更することは禁止されています。`fe.conf` または `fe_custom.conf` で有効な値が `V1` の場合、FE は起動を拒否します。アップグレード前に `V2` または `V3` に変更してください。既存の V1 テーブルは引き続き読み取れますが、転置インデックスを追加することはできません。新しいインデックスが必要な場合は、V2 または V3 形式でテーブルを再作成してください。

#### `min_replication_num_per_tablet` {#min_replication_num_per_tablet}

デフォルト：1

Tablet ごとのレプリカ数の最小値を設定します。

#### `max_replication_num_per_tablet` {#max_replication_num_per_tablet}

デフォルト：32767

Tablet ごとのレプリカ数の最大値を設定します。

#### `default_db_data_quota_bytes` {#default_db_data_quota_bytes}

デフォルト：8192PB

IsMutable：true

MasterOnly：true

データベースのデータクォータのデフォルトサイズを設定します。個々のデータベースのクォータを設定するには、次を使用できます。

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

データベースのレプリカクォータのデフォルト値を設定します。個々のデータベースのクォータを設定するには、次を使用できます。

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

コードの不具合や操作ミスなど、非常に特殊な状況では、ある Tablet のレプリカがすべて失われることがあります。この場合、データは実質的に失われています。それでも、データが欠損していてもクエリでエラーを出さず、ユーザーへの影響を抑えたい場合があります。その際、空の Tablet で欠損したレプリカを補い、クエリを正常に実行できるようにします。

true に設定すると、すべてのレプリカが破損または欠損した Tablet に、Doris が空のレプリカを自動的に補充します。

#### `min_clone_task_timeout_sec` `And max_clone_task_timeout_sec` {#min_clone_task_timeout_sec-and-max_clone_task_timeout_sec}

デフォルト：最小 3 分、最大 2 時間

IsMutable：true

MasterOnly：true

`mix_clone_task_timeout_sec` と組み合わせて、clone タスクのタイムアウトの上限と下限を制御できます。通常、clone タスクのタイムアウトはデータ量と最小転送速度（5MB/s）から推定されます。特別な場合には、この 2 つの設定でタイムアウトの上下限を指定し、clone タスクが正常に完了できるようにします。

#### `disable_storage_medium_check` {#disable_storage_medium_check}

デフォルト：false

IsMutable：true

MasterOnly：true

disable_storage_medium_check が true の場合、ReportHandler は Tablet のストレージメディアを確認せず、ストレージのクールダウン機能を無効にします。デフォルト値は false です。Tablet のストレージメディアを問わない場合は true に設定できます。

#### `decommission_tablet_check_threshold` {#decommission_tablet_check_threshold}

デフォルト：5000

IsMutable：true

MasterOnly：true

デコミッションされた BE 上の Tablet の状態を Master FE が確認するかどうかを制御します。その BE にある Tablet の数がしきい値を下回ると、FE は定期的な確認を開始します。すべての Tablet が回収された場合、FE はその BE を直ちに削除します。

性能に影響するため、この設定を非常に大きな値にしないでください。

#### `partition_rebalance_max_moves_num_per_selection` {#partition_rebalance_max_moves_num_per_selection}

デフォルト：10

IsMutable：true

MasterOnly：true

PartitionRebalancer を使用する場合にのみ有効です。

#### `partition_rebalance_move_expire_after_access` {#partition_rebalance_move_expire_after_access}

デフォルト：600   (s)

IsMutable：true

MasterOnly：true

PartitionRebalancer を使用する場合にのみ有効です。値を変更すると、キャッシュされた移動情報は消去されます。

#### `tablet_rebalancer_type` {#tablet_rebalancer_type}

デフォルト：BeLoad

MasterOnly：true

Rebalancer の種類です（大文字と小文字は区別されません）：BeLoad、Partition。値を解析できない場合は、デフォルトの BeLoad が使用されます。

#### `max_balancing_tablets` {#max_balancing_tablets}

デフォルト：100

IsMutable：true

MasterOnly：true

TabletScheduler でバランス調整中の Tablet 数が max_balancing_tablets を超えると、新たなバランス確認は行われません。

#### `max_scheduling_tablets` {#max_scheduling_tablets}

デフォルト：2000

IsMutable：true

MasterOnly：true

TabletScheduler でスケジュールされた Tablet 数が max_scheduling_tablets を超えると、確認をスキップします。

#### `disable_balance` {#disable_balance}

デフォルト：false

IsMutable：true

MasterOnly：true

true に設定すると、TabletScheduler はバランス調整を行いません。

#### `disable_disk_balance` {#disable_disk_balance}

デフォルト：true

IsMutable：true

MasterOnly：true

true に設定すると、TabletScheduler はディスクのバランス調整を行いません。

#### `balance_load_score_threshold` {#balance_load_score_threshold}

デフォルト：0.1 (10%)

IsMutable：true

MasterOnly：true

クラスターの負荷スコアのバランス判定に使うしきい値です。Backend の負荷スコアが平均より 10% 低い場合は LOW、10% 高い場合は HIGH と判定されます。

#### `capacity_used_percent_high_water` {#capacity_used_percent_high_water}

デフォルト：0.75  (75%)

IsMutable：true

MasterOnly：true

ディスク容量の使用率に関する高水位です。Backend の負荷スコアの計算に使用します。

#### `clone_distribution_balance_threshold` {#clone_distribution_balance_threshold}

デフォルト：0.2

IsMutable：true

MasterOnly：true

Backend 間のレプリカ数のバランス判定に使うしきい値です。

#### `clone_capacity_balance_threshold` {#clone_capacity_balance_threshold}

デフォルト：0.2

IsMutable：true

MasterOnly：true

* BE 内のデータサイズのバランス判定に使うしきい値です。

   バランス調整アルゴリズムは次のとおりです。

     1. クラスター全体の平均使用容量（AUC）を計算します。（総データサイズ / Backend の総数）

     2. 高水位は（AUC * (1 + clone_capacity_balance_threshold)）です。

     3. 低水位は（AUC * (1 - clone_capacity_balance_threshold)）です。

     4. Clone checker は、高水位の BE から低水位の BE へレプリカを移動しようとします。

#### `disable_colocate_balance` {#disable_colocate_balance}

デフォルト：false

IsMutable：true

MasterOnly：true

true に設定すると、colocate テーブルの自動再配置とバランス調整を無効にできます。'disable_colocate_balance' が true の場合、ColocateTableBalancer は colocate テーブルの再配置とバランス調整を行いません。

**注意：**

1. 通常、バランス調整を無効にする必要はありません。
2. 無効にすると、不安定な colocate テーブルが復旧しない可能性があります。
3. 最終的に、クエリで colocate プランを使用できなくなる可能性があります。

#### `balance_slot_num_per_path` {#balance_slot_num_per_path}

デフォルト：1

IsMutable：true

MasterOnly：true

バランス調整時に使用するパスごとのデフォルトのスロット数です。

#### `disable_tablet_scheduler` {#disable_tablet_scheduler}

デフォルト：false

IsMutable：true

MasterOnly：true

true に設定すると Tablet スケジューラーは動作せず、Tablet の修復とバランス調整のタスクもすべて動作しません。

#### `enable_force_drop_redundant_replica` {#enable_force_drop_redundant_replica}

デフォルト：false

動的設定が可能か：true

Master FE のみ：true

true に設定すると、Tablet のスケジューリング処理で余分なレプリカが直ちに削除されます。該当するレプリカに書き込み中のデータロードジョブの一部が失敗する可能性がありますが、Tablet のバランス調整と修復は速くなります。
クラスター内にバランス調整や修復を待つレプリカが大量にある場合は、データロードの成功率が一部下がることを許容して、この設定で処理を速めることができます。

#### `colocate_group_relocate_delay_second` {#colocate_group_relocate_delay_second}

デフォルト：1800

動的設定が可能か：true

Master FE のみ：true

colocate グループの再配置では、クラスター内で大量の Tablet が移動する可能性があります。そのため、できる限り再配置を避ける慎重な方法を取る必要があります。
通常、BE ノードがオフラインまたは停止した後に再配置が発生します。このパラメータは、BE ノードが使用不能と判定されるまでの時間を遅らせます。デフォルトは 30 分で、BE ノードが 30 分以内に復旧すれば、colocate グループの再配置は開始されません。

#### `allow_replica_on_same_host` {#allow_replica_on_same_host}

デフォルト：false

動的設定が可能か：false

Master FE のみ：false

同じ Tablet の複数のレプリカを同じホストに配置することを許可するかどうかを指定します。主にローカルテストで複数の BE を構築し、複数レプリカの状況をテストしやすくするためのパラメータです。テスト以外の環境では使用しないでください。

#### `repair_slow_replica` {#repair_slow_replica}

デフォルト：false

IsMutable：true

MasterOnly：true

true に設定すると、compaction の遅いレプリカが自動的に検出され、別のマシンへ移行されます。検出条件は、最も速いレプリカのバージョン数が `min_version_count_indicate_replica_compaction_too_slow` を超え、最も速いレプリカとのバージョン数の差の比率が `valid_version_count_delta_ratio_between_replicas` を超えることです。

#### `min_version_count_indicate_replica_compaction_too_slow` {#min_version_count_indicate_replica_compaction_too_slow}

デフォルト：200

動的設定が可能か：true

Master FE のみ：false

レプリカの compaction が遅すぎるかどうかを判定するバージョン数のしきい値です。

#### `skip_compaction_slower_replica` {#skip_compaction_slower_replica}

デフォルト：true

動的設定が可能か：true

Master FE のみ：false

true に設定すると、クエリ可能なレプリカを選択する際に、compaction の遅いレプリカをスキップします。

#### `valid_version_count_delta_ratio_between_replicas` {#valid_version_count_delta_ratio_between_replicas}

デフォルト：0.5

動的設定が可能か：true

Master FE のみ：true

最も遅いレプリカと最も速いレプリカのバージョン数の差について、有効な比率を判定するしきい値です。`repair_slow_replica` が true の場合、最も遅いレプリカを修復するかどうかの判定に使用します。

#### `min_bytes_indicate_replica_too_large` {#min_bytes_indicate_replica_too_large}

デフォルト：`2 * 1024 * 1024 * 1024` (2G)

動的設定が可能か：true

Master FE のみ：true

レプリカが大きすぎるかどうかを判定するデータサイズのしきい値です。

#### `schedule_slot_num_per_hdd_path` {#schedule_slot_num_per_hdd_path}

デフォルト：4

Tablet スケジューラーにおける HDD のパスごとのデフォルトのスロット数です。この設定を削除し、clone タスクの統計に基づいて動的に調整します。

#### `schedule_slot_num_per_ssd_path` {#schedule_slot_num_per_ssd_path}

デフォルト：8

Tablet スケジューラーにおける SSD のパスごとのデフォルトのスロット数です。この設定を削除し、clone タスクの統計に基づいて動的に調整します。

#### `tablet_repair_delay_factor_second` {#tablet_repair_delay_factor_second}

デフォルト：60 （s）

IsMutable：true

MasterOnly：true

Tablet を修復すると決定するまでの遅延時間に使う係数です。

* 優先度が VERY_HIGH の場合は直ちに修復します。
* HIGH の場合は tablet_repair_delay_factor_second * 1 だけ遅延します。
* NORMAL の場合は tablet_repair_delay_factor_second * 2 だけ遅延します。
* LOW の場合は tablet_repair_delay_factor_second * 3 だけ遅延します。

#### `tablet_stat_update_interval_second` {#tablet_stat_update_interval_second}

デフォルト：300（5min）

Tablet の統計情報を更新する間隔です。
各 Frontend は、この間隔ごとにすべての Backend から Tablet の統計情報を取得します。

#### `storage_flood_stage_usage_percent` {#storage_flood_stage_usage_percent}

デフォルト：95 （95%）

IsMutable：true

MasterOnly：true

##### `storage_flood_stage_left_capacity_bytes` {#storage_flood_stage_left_capacity_bytes}

デフォルト：`1 * 1024 * 1024 * 1024` (1GB)

IsMutable：true

MasterOnly：true

ディスク容量が 'storage_flood_stage_usage_percent' と 'storage_flood_stage_left_capacity_bytes' の両方のしきい値に達すると、次の操作が拒否されます。

1. データロードジョブ
2. リストアジョブ

#### `storage_high_watermark_usage_percent` {#storage_high_watermark_usage_percent}

デフォルト：85  (85%)

IsMutable：true

MasterOnly：true

#### `storage_min_left_capacity_bytes` {#storage_min_left_capacity_bytes}

デフォルト：`2 * 1024 * 1024 * 1024`  (2GB)

IsMutable：true

MasterOnly：true

'storage_high_watermark_usage_percent' は Backend のストレージパスにおける最大使用率を制限し、'storage_min_left_capacity_bytes' はそのパスに必要な最小空き容量を制限します。両方の制限に達した場合、そのパスは Tablet のバランス調整先に選択できません。ただし、Tablet の復旧では、できる限りデータの整合性を保つために制限を超えることがあります。

#### `catalog_trash_expire_second` {#catalog_trash_expire_second}

デフォルト：86400L (1 日)

IsMutable：true

MasterOnly：true

データベース（テーブルまたはパーティション）を削除した後は、RECOVER 文で復元できます。この設定はデータの最大保持期間を指定します。期間が過ぎると、データは完全に削除されます。

#### `default_storage_medium` {#default_storage_medium}

デフォルト：HDD

テーブル（またはパーティション）の作成時には、ストレージメディア（HDD または SSD）を指定できます。指定しなかった場合、この設定がデフォルトのメディアになります。

#### `default_compression_type` {#default_compression_type}

デフォルト：LZ4F（4.0.3 より前）、ZSTD（4.0.3 以降）

テーブルの作成時には圧縮アルゴリズムを指定できます。指定しなかった場合は、この設定がデフォルトの圧縮形式になります。有効な値は LZ4、LZ4F、LZ4HC、ZLIB、ZSTD、SNAPPY、NONE で、大文字と小文字は区別されません。

#### `enable_storage_policy` {#enable_storage_policy}

* Storage Policy 機能を有効にするかどうかを指定します。この設定により、ホットデータとコールドデータを分離できます。
デフォルト：false

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

#### `check_consistency_default_timeout_second` {#check_consistency_default_timeout_second}

デフォルト：600（10 分）

IsMutable：true

MasterOnly：true

単一の整合性確認タスクのデフォルトタイムアウトです。Tablet のサイズに合わせて十分に長く設定してください。

#### `consistency_check_start_time` {#consistency_check_start_time}

デフォルト：23

IsMutable：true

MasterOnly：true

整合性確認の開始時刻です。

整合性チェッカーは *consistency_check_start_time* から *consistency_check_end_time* まで実行されます。

2 つの時刻が同じ場合、整合性確認は開始されません。

#### `consistency_check_end_time` {#consistency_check_end_time}

デフォルト：23

IsMutable：true

MasterOnly：true

整合性確認の終了時刻です。

整合性チェッカーは *consistency_check_start_time* から *consistency_check_end_time* まで実行されます。

2 つの時刻が同じ場合、整合性確認は開始されません。

#### `replica_delay_recovery_second` {#replica_delay_recovery_second}

デフォルト：0

IsMutable：true

MasterOnly：true

レプリカの障害発生から、FE が clone による復旧を試みるまでの最小遅延時間（秒）です。

#### `tablet_create_timeout_second` {#tablet_create_timeout_second}

デフォルト：1（s）

IsMutable：true

MasterOnly：true

単一のレプリカの作成を待つ最大時間です。

例：
   #m 個の Tablet を持ち、各 Tablet に #n 個のレプリカがあるテーブルを作成する場合、
   テーブル作成リクエストは、タイムアウトまで最大 (m *n* tablet_create_timeout_second) 実行されます。

#### `tablet_delete_timeout_second` {#tablet_delete_timeout_second}

デフォルト：2

IsMutable：true

MasterOnly：true

*tablet_create_timeout_second* と同じ意味ですが、Tablet の削除時に使用します。

#### `delete_job_max_timeout_second` {#delete_job_max_timeout_second}

デフォルト：300(s)

Mutable：true

Master のみ：true

削除ジョブの最大タイムアウトを秒単位で指定します。

#### `alter_table_timeout_second` {#alter_table_timeout_second}

デフォルト：86400 * 30 (1 か月)

IsMutable：true

MasterOnly：true

ALTER TABLE リクエストの最大タイムアウトです。テーブルのデータサイズに合わせて十分に長く設定してください。

#### `max_replica_count_when_schema_change` {#max_replica_count_when_schema_change}

OlapTable がスキーマを変更する際に許可されるレプリカの最大数です。レプリカが多すぎると、FE で OOM が発生します。

デフォルト：100000

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

#### `history_job_keep_max_second` {#history_job_keep_max_second}

デフォルト：`7 * 24 * 3600` （7 日）

IsMutable：true

MasterOnly：true

スキーマ変更ジョブや Rollup ジョブなど、特定の種類のジョブを保持する最大時間です。

#### `max_create_table_timeout_second` {#max_create_table_timeout_second}

デフォルト：60 （s）

IsMutable：true

MasterOnly：true

テーブル（インデックス）の作成で長時間待たないよう、最大タイムアウトを設定します。

#### `autobucket_min_buckets` {#autobucket_min_buckets}

デフォルト：3（4.0.8 / 4.1.4 より前は 1）

IsMutable：true

MasterOnly：true

自動バケット分割方式（`DISTRIBUTED BY ... BUCKETS AUTO`）で生成されるバケット数の最小値です。

**Doris 4.0 系のバージョン 4.0.8 および 4.1 系のバージョン 4.1.4 以降、デフォルト値は `1` から `3` に変更されました。** 従来のデフォルトでは、小さいパーティションが 1 つのバケットに収まり、並列度とデータ分散が不足していました。変更後、自動バケット分割では少なくとも 3 個のバケットが生成されます。この変更は新しく作成するパーティションにのみ影響し、既存のパーティションのバケット数は変わりません。

#### `autobucket_max_buckets` {#autobucket_max_buckets}

デフォルト：128

IsMutable：true

MasterOnly：true

自動バケット分割方式で生成されるバケット数の最大値です。計算結果がこの値より大きい場合、この値に制限されます。

### 外部テーブル {#external-table}

#### `jdbc_driver_url_white_list` {#jdbc_driver_url_white_list}

デフォルト：empty

動的設定が可能か：false

JDBC catalog の作成時に許可する `driver_url` 値のホワイトリストです。複数の値はコンマで区切ります。例：`jdbc_driver_url_white_list=a,b,c`。空の値はホワイトリストを設定しないことを意味します。

:::caution 動作の変更（4.1.4）

セキュリティ上の理由により、バージョン 4.1.4 以降、この設定項目は**動的に変更できません**。`fe.conf` でのみ設定でき、FE の再起動後に有効になります。`ADMIN SET FRONTEND CONFIG` では変更できなくなりました。

:::

#### `force_sqlserver_jdbc_encrypt_false` {#force_sqlserver_jdbc_encrypt_false}

デフォルト：false

動的設定が可能か：false

SQLServer JDBC catalog の `encrypt` パラメータを強制的に `false` にするかどうかを指定します。

:::caution 動作の変更（4.1.4）

この設定は SQLServer JDBC の通信暗号化を無効にするため、セキュリティに関わります。バージョン 4.1.4 以降は**動的に変更できません**。`fe.conf` でのみ設定でき、FE の再起動後に有効になります。

:::

#### `file_scan_node_split_num` {#file_scan_node_split_num}

デフォルト：128

IsMutable：true

MasterOnly：false

複数の catalog にまたがるファイルスキャンで同時に使用するスレッド数です。

#### `file_scan_node_split_size` {#file_scan_node_split_size}

デフォルト：`256 * 1024 * 1024`

IsMutable：true

MasterOnly：false

複数の catalog にまたがる同時ファイルスキャンのサイズです。

#### `enable_odbc_mysql_broker_table` {#enable_odbc_mysql_broker_table}

デフォルト：false

IsMutable：true

MasterOnly：false

バージョン 2.1 以降、ODBC、JDBC、broker 外部テーブルの作成はサポートされません。ODBC と MySQL の外部テーブルには JDBC テーブルまたは JDBC catalog を、broker テーブルにはテーブル値関数を使用してください。

#### `max_hive_partition_cache_num` {#max_hive_partition_cache_num}

Hive パーティションのキャッシュの最大数です。

デフォルト：100000

動的設定が可能か：false

Master FE ノード固有の設定項目か：false

#### `hive_metastore_client_timeout_second` {#hive_metastore_client_timeout_second}

Hive metastore への接続のデフォルトタイムアウトです。

デフォルト：10

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

#### `max_external_cache_loader_thread_pool_size` {#max_external_cache_loader_thread_pool_size}

外部メタデータのキャッシュをロードするスレッドプールの最大サイズです。

デフォルト：10

動的設定が可能か：false

Master FE ノード固有の設定項目か：false

#### `max_external_file_cache_num` {#max_external_file_cache_num}

外部テーブルに使用するファイルキャッシュの最大数です。

デフォルト：100000

動的設定が可能か：false

Master FE ノード固有の設定項目か：false

#### `max_external_schema_cache_num` {#max_external_schema_cache_num}

外部テーブルに使用するスキーマキャッシュの最大数です。

デフォルト：10000

動的設定が可能か：false

Master FE ノード固有の設定項目か：false

#### `external_cache_expire_time_minutes_after_access` {#external_cache_expire_time_minutes_after_access}

最後のアクセスからキャッシュ内のデータが失効するまでの時間を分単位で設定します。
External Schema Cache と Hive Partition Cache に適用されます。

デフォルト：1440

動的設定が可能か：false

Master FE ノード固有の設定項目か：false

#### `es_state_sync_interval_second` {#es_state_sync_interval_second}

デフォルト：10

FE は es_state_sync_interval_secs ごとに ES API を呼び出し、ES インデックスの shard 情報を取得します。

### 外部リソース {#external-resources}

#### `ai_resource_allowed_user` {#ai_resource_allowed_user}

デフォルト：`*`

動的設定が可能か：false

Master FE ノード固有の設定項目か：false

バージョン 4.1.5 以降でサポートされます。AI Resources の作成を許可するユーザー ID を制限します。`*` は ID による制限を追加しませんが、既存の権限チェックは引き続き適用されます。それ以外の値は `'user'@'host'` 形式を使用し、現在のユーザー ID と一致する必要があります。変更には FE の再起動が必要です。

#### `dpp_hadoop_client_path` {#dpp_hadoop_client_path}

デフォルト：/lib/hadoop-client/hadoop/bin/hadoop

#### `dpp_bytes_per_reduce` {#dpp_bytes_per_reduce}

デフォルト：`100 * 1024 * 1024L` (100M)

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

Yarn 設定ファイルのデフォルトディレクトリです。Yarn コマンドを実行する前には毎回、このパスに設定ファイルがあることを確認し、なければ作成する必要があります。

#### `yarn_client_path` {#yarn_client_path}

デフォルト：DORIS_HOME_DIR + "/lib/yarn-client/hadoop/bin/yarn"

Yarn クライアントのデフォルトパスです。

#### `spark_launcher_log_dir` {#spark_launcher_log_dir}

デフォルト：sys_log_dir + "/spark_launcher_log"

指定された Spark launcher のログディレクトリです。

#### `spark_resource_path` {#spark_resource_path}

デフォルト：none

Spark の依存ファイルのデフォルトパスです。

#### `spark_home_default_dir` {#spark_home_default_dir}

デフォルト：DORIS_HOME_DIR + "/lib/spark2x"

Spark ホームのデフォルトディレクトリです。

#### `spark_dpp_version` {#spark_dpp_version}

デフォルト：1.0.0

Spark DPP のデフォルトバージョンです。

### その他 {#else}

#### `tmp_dir` {#tmp_dir}

デフォルト：DorisFE.DORIS_HOME_DIR + "/temp_dir"

一時ディレクトリは、バックアップやリストアなどの処理の中間結果を保存するために使用します。処理の完了後、ディレクトリ内のファイルは削除されます。

#### `custom_config_dir` {#custom_config_dir}

デフォルト：DorisFE.DORIS_HOME_DIR + "/conf"

カスタム設定ファイルのディレクトリです。

`fe_custom.conf` ファイルの場所を指定します。デフォルトでは `conf/` ディレクトリにあります。

デプロイ環境によっては、システムのアップグレードによって `conf/` ディレクトリが上書きされ、ユーザーが変更した設定項目も上書きされることがあります。その場合は、`fe_custom.conf` を別のディレクトリに保存して、設定ファイルの上書きを防げます。

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

true に設定すると、メトリクスコレクターがデーモンのタイマーとして実行され、一定の間隔でメトリクスを収集します。

#### `report_queue_size` {#report_queue_size}

デフォルト：100

IsMutable：true

MasterOnly：true

このしきい値は、FE に report タスクが過度に蓄積し、OOM 例外が発生することを防ぎます。たとえば、100 台の Backend に 1,000 万個のレプリカがある大規模な Doris クラスターでは、メタデータの変更（パーティションの削除など）の後、Tablet の report に数秒かかる場合があります。各 Backend は 1 分ごとに Tablet 情報を報告するため、report を無制限に受け付けることはできません。将来は Tablet の report の処理速度を最適化する予定ですが、現時点ではキューサイズが上限を超えた report は破棄します。
   実環境での所要時間の例：
      1. ディスク report：0-1 msta
      2. sk report：0-1 ms
      3. Tablet report
      4. 10000 レプリカ：200ms

#### `backup_job_default_timeout_ms` {#backup_job_default_timeout_ms}

デフォルト：86400 * 1000  (1 日)

IsMutable：true

MasterOnly：true

バックアップジョブのデフォルトタイムアウトです。

#### `backup_upload_snapshot_batch_size` {#backup_upload_snapshot_batch_size}

デフォルト：10

IsMutable：true

MasterOnly：true

バックアップ処理中、1 つのアップロードタスクに割り当てるスナップショットの最大数です。デフォルト値は 10 です。

#### `restore_download_snapshot_batch_size` {#restore_download_snapshot_batch_size}

デフォルト：10

IsMutable：true

MasterOnly：true

リストア処理中、1 つのダウンロードタスクに割り当てるスナップショットの最大数です。デフォルト値は 10 です。

#### `max_backup_restore_job_num_per_db` {#max_backup_restore_job_num_per_db}

デフォルト：10

主に、各データベースに記録されるバックアップとリストアのタスク数を制御します。

#### `max_backup_tablets_per_job` {#max_backup_tablets_per_job}

デフォルト：300000

IsMutable：true

MasterOnly：true

バックアップジョブに含められる Tablet の最大数を制御し、メタデータを大量に保存することによる FE の OOM を防ぎます。

#### `enable_quantile_state_type` {#enable_quantile_state_type}

デフォルト：false

IsMutable：true

MasterOnly：true

quantile_state データ型を有効にするかどうかを指定します。

#### `enable_date_conversion` {#enable_date_conversion}

デフォルト：true

IsMutable：true

MasterOnly：true

FE は date/datetime を datev2/datetimev2(0) に自動的に変換します。

#### `enable_decimal_conversion` {#enable_decimal_conversion}

デフォルト：true

IsMutable：true

MasterOnly：true

FE は DecimalV2 を DecimalV3 に自動的に変換します。

#### `proxy_auth_magic_prefix` {#proxy_auth_magic_prefix}

デフォルト：x@8

#### `proxy_auth_enable` {#proxy_auth_enable}

デフォルト：false

#### `enable_func_pushdown` {#enable_func_pushdown}

デフォルト：true

IsMutable：true

MasterOnly：false

ODBC または JDBC 外部テーブルへのクエリを実行する際、関数を含むフィルター条件を MYSQL にプッシュダウンするかどうかを指定します。

#### `jdbc_drivers_dir` {#jdbc_drivers_dir}

デフォルト：`${DORIS_HOME}/jdbc_drivers`;

IsMutable：false

MasterOnly：false

JDBC ドライバーを配置するデフォルトのディレクトリです。

#### `max_error_tablet_of_broker_load` {#max_error_tablet_of_broker_load}

デフォルト：3;

IsMutable：true

MasterOnly：true

broker load で表示するエラーが発生した Tablet の最大数です。

#### `default_db_max_running_txn_num` {#default_db_max_running_txn_num}

デフォルト：-1

IsMutable：true

MasterOnly：true

データベースのトランザクションクォータのデフォルト値を設定します。

デフォルト値の -1 は、`default_db_max_running_txn_num` の代わりに `max_running_txn_num_per_db` を使用することを意味します。

個々のデータベースのクォータを設定するには、次を使用できます。

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

true に設定すると、外部テーブルへのクエリは優先的にコンピュートノードに割り当てられます。コンピュートノードの最大数は `min_backend_num_for_external_table` で制御されます。
false に設定すると、外部テーブルへのクエリは任意のノードに割り当てられます。

#### `min_backend_num_for_external_table` {#min_backend_num_for_external_table}

デフォルト：3

IsMutable：true

MasterOnly：false

`prefer_compute_node_for_external_table` が true の場合にのみ有効です。コンピュートノードの数がこの値より少ない場合、外部テーブルへのクエリは一部の混合ノードにも割り当て、ノードの総数をこの値に近づけようとします。
コンピュートノードの数がこの値より多い場合、外部テーブルへのクエリはコンピュートノードだけに割り当てられます。

#### `infodb_support_ext_catalog` {#infodb_support_ext_catalog}

デフォルト：false

IsMutable：true

MasterOnly：false

false の場合、information_schema データベースのテーブルを SELECT した結果には、外部 catalog 内のテーブルの情報が含まれません。
外部 catalog に到達できない場合にクエリが長引くことを避けるためです。

#### `enable_query_hit_stats` {#enable_query_hit_stats}

デフォルト：false

IsMutable：true

MasterOnly：false

クエリのヒット統計を有効にするかどうかを制御します。デフォルトは false です。

#### `div_precision_increment` {#div_precision_increment}

デフォルト：4

`/` 演算子による除算結果の小数桁数を、何桁増やすかを示す変数です。

#### `enable_convert_light_weight_schema_change` {#enable_convert_light_weight_schema_change}

デフォルト：true

一時的な設定項目です。有効にすると、バックグラウンドスレッドが起動し、すべての OLAP テーブルを light schema change に自動的に変更します。変更結果は `show convert_light_schema_change [from db]` コマンドで確認でき、light schema change に対応していなかったすべてのテーブルの変換結果が表示されます。

#### `disable_local_deploy_manager_drop_node` {#disable_local_deploy_manager_drop_node}

デフォルト：true

cluster.info ファイルのエラーによってノードが削除されないよう、LocalDeployManager によるノードの削除を禁止します。

#### `mysqldb_replace_name` {#mysqldb_replace_name}

デフォルト：mysql

MySQL エコシステムとの互換性を保つため、Doris には mysql という名前の組み込みデータベースがあります。このデータベースがユーザー独自のデータベースと競合する場合は、この項目を変更して Doris の組み込み MySQL データベースの名前を別の名前にしてください。

#### `max_auto_partition_num` {#max_auto_partition_num}

デフォルト値：2000

ユーザーが自動パーティションテーブルで誤って大量のパーティションを作成することを防ぐため、OLAP テーブルごとに許可するパーティション数を `max_auto_partition_num` で制限します。デフォルトは 2000 です。

#### `profile_manager_gc_interval_seconds` {#profile_manager_gc_interval_seconds}

デフォルト値：1

ProfileManager がプロファイルのガベージコレクションを実行する間隔を制御します。ガベージコレクションでは、余分なプロファイルや期限切れのプロファイルをメモリとディスクから削除し、メモリを節約します。

### コンピュートとストレージの分離モード {#compute-and-storage-disaggregated-mode}

#### `cloud_edit_log_roll_interval_second` {#cloud_edit_log_roll_interval_second}

デフォルト：3600（秒）

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

バージョン 4.1.5 以降でサポートされます。コンピュートとストレージの分離モードにおける、時間に基づく Edit Log のロール間隔です。メタデータの書き込み頻度が低い場合でも、定期的なチェックポイントを進めるために使用します。間隔はログエントリの追加時に確認されるため、新しいエントリがないときに独立したタイマーがロールを強制することはありません。0 以下の値では時間に基づくロールが無効になります。ログエントリ数に基づくロールは引き続き有効です。

#### `cloud_version_syncer_interval_second` {#cloud_version_syncer_interval_second}

デフォルト：60（秒、4.1.5 より前は 20）

動的設定が可能か：false

Master FE ノード固有の設定項目か：false

コンピュートとストレージの分離モードで、すべての FE がバックグラウンドでテーブルとパーティションのバージョンを同期する間隔です。バックグラウンド同期には `cloud_enable_version_syncer=true` と、グローバルまたはデフォルトのテーブルかパーティションのバージョンキャッシュの TTL の少なくとも 1 つが `Long.MAX_VALUE` に設定されていることが必要です。有限の TTL を持つキャッシュは、読み取り時に必要に応じて更新されます。バージョン 4.1.5 では Meta Service へのリクエストを減らすため、デフォルトの間隔が 20 秒から 60 秒に引き上げられました。変更には FE の再起動が必要です。

#### `cloud_get_version_task_batch_size` {#cloud_get_version_task_batch_size}

デフォルト：200（4.1.5 より前は 2000）

動的設定が可能か：true

Master FE ノード固有の設定項目か：false

コンピュートとストレージの分離モードでバージョンを同期する際、1 つの Get Version バッチに含めるテーブルまたはパーティションの最大数です。バージョン 4.1.5 ではリクエストサイズを減らすため、デフォルト値が 2000 から 200 に引き下げられました。

#### `cloud_version_syncer_get_version_retry_times` {#cloud_version_syncer_get_version_retry_times}

デフォルト：3

動的設定が可能か：true

Master FE ノード固有の設定項目か：false

バージョン 4.1.5 以降でサポートされます。コンピュートとストレージの分離モードでバックグラウンド同期を行う際、テーブルまたはパーティションのバージョンを取得する最大試行回数です。初回のリクエストを含みます。デフォルトでは、初回の後に 3 回再試行するのではなく、合計で最大 3 回試行できます。この設定は、フォアグラウンドのクエリに対する Meta Service RPC の再試行設定とは独立しています。

#### `cloud_warm_up_job_scheduler_interval_millisecond` {#cloud_warm_up_job_scheduler_interval_millisecond}

デフォルト：1000（ミリ秒）

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

キャッシュのウォームアップジョブをスケジュールする間隔です。バージョン 4.1.5 以降、動的に更新する値は `0` より大きい必要があります。それ以外の場合は `cloud_warm_up_job_scheduler_interval_millisecond must be greater than 0` が返されます。

#### `max_active_cloud_warm_up_job` {#max_active_cloud_warm_up_job}

デフォルト：10

動的設定が可能か：true

Master FE ノード固有の設定項目か：true

同時にスケジュールするキャッシュのウォームアップジョブ数です。バージョン 4.1.5 以降、動的な更新によってウォームアップ用 executor のサイズも変更されます。0 以下の値にすると、新しいウォームアップ処理のスケジューリングは一時停止します。

#### `cluster_id` {#cluster_id-1}

デフォルト：-1

同じクラスター ID を持つノード（FE または BE）は、同じ Doris クラスターに属すると見なされます。コンピュートとストレージの分離モードでは、ランダムな整数を 1 つ指定する必要があります。

#### `deploy_mode` {#deploy_mode}

デフォルト：""

説明：FE の実行モードです。`cloud` はストレージとコンピュートの分離モードを示します。

#### `meta_service_endpoint` {#meta_service_endpoint}

デフォルト：""

Meta Service のエンドポイントは 'host1:port,host2:port' 形式で指定します。この設定はストレージとコンピュートの分離モードで必要です。

#### `enable_group_commit_streamload_be_forward` {#enable_group_commit_streamload_be_forward}

デフォルト：false

IsMutable：true

コンピュートとストレージの分離モードで、Group Commit に対する Stream Load の BE 転送を有効にするかどうかを指定します。分離モードで、リクエストが Group Commit を使用している場合にのみ有効です。

有効にすると、FE は Stream Load リクエストを `_stream_load_forward` エンドポイントへリダイレクトし、受信した BE が対象テーブルの転送先 BE にリクエストを転送します。これにより、ロードバランサーが同じテーブルの Group Commit バッチ処理を分散させることを防ぎます。

同名の設定を FE と BE の両方で有効にする必要があります。**Doris 4.0 系のバージョン 4.0.8 および 4.1 系のバージョン 4.1.4 以降、BE 側の `_stream_load_forward` エンドポイントは BE の設定によって制御されます。無効な場合は `403 Forbidden` を返し、有効な場合もリクエストには認証とグローバルな `LOAD` 権限が必要です。** [Group Commit](../../data-operate/import/load-best-practices/group-commit-manual) と [BE 設定](./be-config) を参照してください。

#### `default_get_version_from_ms_timeout_second` {#default_get_version_from_ms_timeout_second}

デフォルト：30 (s)

動的設定が可能か：false

FE が Meta Service からバージョンを取得する際のタイムアウトです。

:::caution 動作の変更（4.1.4）

バージョン 4.1.4 で、デフォルト値が `3` 秒から `30` 秒に変更されました。以前は Meta Service に一時的な揺らぎや高負荷があると、3 秒のタイムアウトによってクエリが失敗しやすくなっていました。値を増やしたことで、このような散発的な失敗を大幅に減らせます。

:::

#### `enable_cloud_replica_stale_route_clean` {#enable_cloud_replica_stale_route_clean}

デフォルト：true

動的設定が可能か：true

バージョン 4.1.4 で追加されました。メタデータの image の読み込み時と Tablet のバランス調整時に、存在しない Backend を参照する CloudReplica のプライマリおよびセカンダリのルート記録を削除するかどうかを指定します。

このような古い記録はクエリ時にはすでに無視され（レプリカは再び Backend にハッシュされます）、FE のメモリとメタデータ image の容量を無駄にするだけです。削除しない従来の動作を維持するには、`false` に設定します。

#### `enable_cloud_colocate_consistent_hash` {#enable_cloud_colocate_consistent_hash}

デフォルト：true

動的設定が可能か：false

Master FE ノード固有の設定項目か：true

バージョン 4.1.4 で追加されました。コンピュートとストレージの分離モードで、colocate テーブルのバケット配置に rendezvous consistent hashing を使用するかどうかを指定します。`false` に設定すると、従来の剰余に基づく配置に戻ります。この設定は `fe.conf` でのみ指定でき、再起動後に有効になります。

#### `meta_service_rpc_rate_limit_enabled` {#meta_service_rpc_rate_limit_enabled}

デフォルト：true（4.1.5 より前は false）

動的設定が可能か：true

バージョン 4.1.4 で追加されました。FE から Meta Service への RPC に対して、QPS のレート制限を評価するかどうかを指定します。バージョン 4.1.5 以降は、`meta_service_rpc_rate_limit_dry_run` とともにデフォルトで有効です。そのため、デフォルトの動作ではリクエストの待機や拒否は行わず、推定待機時間と推定拒否件数だけを記録します。レート制限を適用するには、この設定を `true` のままにし、dry-run を `false` に設定します。

#### `meta_service_rpc_rate_limit_dry_run` {#meta_service_rpc_rate_limit_dry_run}

デフォルト：true

動的設定が可能か：true

Master FE ノード固有の設定項目か：false

バージョン 4.1.5 以降でサポートされます。`meta_service_rpc_rate_limit_enabled=true` の場合にのみ有効です。`true` の場合は、リクエストを待機・拒否せずにレート制限を評価してメトリクスを記録します。`false` の場合は、設定された QPS、バーストウィンドウ、待機タイムアウトを適用します。dry-run モードの待機メトリクスは、推定待機時間を表します。

#### `meta_service_rpc_rate_limit_default_qps_per_core` {#meta_service_rpc_rate_limit_default_qps_per_core}

デフォルト：50

動的設定が可能か：true

バージョン 4.1.4 で追加されました。`meta_service_rpc_rate_limit_qps_per_core_config` で個別に設定されていない Meta Service RPC メソッドに許可する、CPU コアあたりのデフォルト QPS です。`0` 以下の値は、レート制限なしを意味します。

#### `meta_service_rpc_rate_limit_qps_per_core_config` {#meta_service_rpc_rate_limit_qps_per_core_config}

デフォルト：`getPartitionVersion:500;getTableVersion:500;getTabletStats:50;beginTxn:50`

動的設定が可能か：true

バージョン 4.1.4 で追加されました。Meta Service RPC メソッドごとに設定する、CPU コアあたりの QPS 制限です。形式は `method1:qps1;method2:qps2` です。値が `0` 以下のメソッドにはレート制限が適用されません。

#### `meta_service_rpc_rate_limit_burst_seconds` {#meta_service_rpc_rate_limit_burst_seconds}

デフォルト：2 (s)

動的設定が可能か：true

バージョン 4.1.4 で追加されました。Meta Service RPC のレート制限におけるバーストウィンドウの長さを秒単位で指定します。長期的な平均 QPS は変わりませんが、このウィンドウ内ではバーストが許可されます。

#### `meta_service_rpc_rate_limit_wait_timeout_ms` {#meta_service_rpc_rate_limit_wait_timeout_ms}

デフォルト：1000 (ms)

動的設定が可能か：true

バージョン 4.1.4 で追加されました。RPC がレート制限を受けたときの最大待機時間をミリ秒単位で指定します。`0` は待機せず、リクエストがすぐに失敗することを意味します。
