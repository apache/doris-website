---
{
    "title": "FE の設定 | 設定",
    "language": "ja",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "Doris の Frontend（FE）設定パラメータの総合リファレンス。メタデータ管理、クエリエンジン、データロードとエクスポート、ストレージの設定を網羅します。",
    "sidebar_label": "FE の設定"
}
---

# FE の設定 {#fe-configuration}

このドキュメントでは、主に FE の設定項目を説明します。

FE の設定ファイル `fe.conf` は通常、FE のデプロイ先にある `conf/` ディレクトリに保存されます。バージョン 0.14 では、別の設定ファイル `fe_custom.conf` が導入されます。このファイルには、運用中にユーザーが動的に設定し、永続化した設定項目が記録されます。

FE プロセスは起動後、まず `fe.conf` の設定項目を読み取り、次に `fe_custom.conf` の設定項目を読み取ります。`fe_custom.conf` の項目は、`fe.conf` の同名項目を上書きします。

`fe_custom.conf` ファイルの場所は、`fe.conf` の `custom_config_dir` で指定できます。

## 設定項目の確認 {#view-configuration-items}

FE の設定項目は、次の方法で確認できます。

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
    * MasterOnly: Master FE ノード固有の設定項目かどうか。true の場合は Master FE ノードでのみ意味を持ち、ほかの種類の FE ノードでは意味を持ちません。false の場合は、すべての種類の FE ノードで意味を持ちます。
    * Comment: 設定項目の説明。

## 設定項目の変更 {#set-configuration-items}

バージョン 4.1.5 以降、`SHOW FRONTEND CONFIG` と設定のエクスポート用エンドポイントでは、空でない機密情報の値が `********` と表示されます。対象には `initial_root_password`、TLS 秘密鍵のパスワード、HTTPS Key Store のパスワード、MySQL SSL 証明書のパスワードが含まれます。空の値は、未設定であることを示すために空のまま表示されます。このマスキングは、実際に有効な設定を変更しません。

FE の設定項目は、次の方法で設定できます。

1. 静的な設定

    `conf/fe.conf` ファイルに設定項目を追加し、値を指定します。`fe.conf` の設定項目は FE プロセスの起動時に読み込まれます。`fe.conf` にない項目にはデフォルト値が使用されます。

2. MySQL プロトコルによる動的な設定

    FE の起動後、次のコマンドで設定項目を動的に変更できます。このコマンドには管理者権限が必要です。

    `ADMIN SET FRONTEND CONFIG (" fe_config_name "=" fe_config_value ");`

    すべての設定項目が動的な変更に対応しているわけではありません。対応状況は、`SHOW FRONTEND CONFIG;` コマンドの結果にある `IsMutable` 列で確認できます。

    `MasterOnly` の設定項目を変更すると、コマンドは Master FE に直接転送され、Master FE の該当項目だけが変更されます。

    **この方法で変更した設定項目は、FE プロセスの再起動後に無効になります。**

    このコマンドの詳細は、`HELP ADMIN SET CONFIG;` コマンドで確認できます。

3. HTTP プロトコルによる動的な設定

    詳細は [Set Config Action](../open-api/fe-http/set-config-action) を参照してください。

    この方法では、変更した設定項目を永続化することもできます。設定項目は `fe_custom.conf` ファイルに保存され、FE の再起動後も有効です。

## 例 {#examples}

1. `async_pending_load_task_pool_size` の変更

    `SHOW FRONTEND CONFIG;` で確認すると、この項目は動的に変更できません（`IsMutable` が false）。`fe.conf` に次を追加します。

    `async_pending_load_task_pool_size = 20`

    その後、FE プロセスを再起動すると設定が有効になります。

2. `dynamic_partition_enable` の変更

    `SHOW FRONTEND CONFIG;` で確認すると、この項目は動的に変更できます（`IsMutable` が true）。また、Master FE 固有の設定です。任意の FE に接続し、次のコマンドで設定を変更します。

    ```
    ADMIN SET FRONTEND CONFIG ("dynamic_partition_enable" = "true"); `
    ```

    変更後の値は、次のコマンドで確認できます。

    ```
    set forward_to_master = true;
    SHOW FRONTEND CONFIG;
    ```

    この方法で変更した設定は、Master FE の再起動または Master の再選出後に無効になります。永続的に有効にするには、`fe.conf` に設定項目を追加して FE を再起動します。

3. `max_distribution_pruner_recursion_depth` の変更

    `SHOW FRONTEND CONFIG;` で確認すると、この項目は動的に変更できます（`IsMutable` が true）。Master FE 固有の設定ではありません。

    同様に、動的設定コマンドで変更できます。この設定は Master FE 固有ではないため、すべての FE で変更後の値を使うには、各 FE に個別に接続して動的に変更する必要があります。

## 設定一覧 {#configurations}

### メタデータとクラスター {#metadata-and-cluster}

#### `meta_dir` {#meta_dir}

デフォルト：DORIS_HOME_DIR + "/doris-meta"

型：string。説明：Doris のメタデータを保存する場所です。このディレクトリには、次の特性を持つストレージを強く推奨します。

* 高い書き込み性能（SSD）
* 安全性（RAID）

#### `catalog_try_lock_timeout_ms` {#catalog_try_lock_timeout_ms}

デフォルト：5000  （ms）

IsMutable：true

catalog ロックの tryLock タイムアウトです。通常、テストが必要な場合を除き変更する必要はありません。

#### `enable_bdbje_debug_mode` {#enable_bdbje_debug_mode}

デフォルト：false

true に設定すると、FE は BDBJE デバッグモードで起動します。

#### `max_bdbje_clock_delta_ms` {#max_bdbje_clock_delta_ms}

デフォルト：5000 （5s）

Master FE のホストと、それ以外の FE との間で許容する最大の時刻ずれを設定します。Master 以外の FE が BDBJE を介して Master FE に接続するたびに確認され、時刻ずれがこの値を超えると接続は破棄されます。

#### `metadata_failure_recovery` {#metadata_failure_recovery}

デフォルト：false

true の場合、FE は bdbje のレプリケーショングループをリセットし（選出可能なノードの情報をすべて削除し）、Master として起動しようとします。選出可能なノードをどれも起動できない場合は、メタデータを別のノードにコピーし、この設定を true にして FE の再起動を試みることができます。

#### `txn_rollback_limit` {#txn_rollback_limit}

デフォルト：100

bdbje がグループへの再参加を試みる際にロールバックできるトランザクションの最大数です。

#### `grpc_threadmgr_threads_nums` {#grpc_threadmgr_threads_nums}

デフォルト：4096

grpc_threadmgr で grpc イベントを処理するスレッド数です。

#### `bdbje_replica_ack_timeout_second` {#bdbje_replica_ack_timeout_second}

デフォルト：10  (s)

bdbje への書き込み時に、レプリカからの応答を待つタイムアウトです。比較的大きなログを書き込むと応答がタイムアウトし、ログの書き込みが失敗する場合があります。その場合は、この値を適切に増やしてください。

#### `bdbje_lock_timeout_second` {#bdbje_lock_timeout_second}

デフォルト：5

bdbje 操作のロックタイムアウトです。FE の WARN ログに LockTimeoutException が多数記録される場合は、この値を増やしてみてください。

#### `bdbje_heartbeat_timeout_second` {#bdbje_heartbeat_timeout_second}

デフォルト：30

Master と Follower の間の bdbje ハートビートのタイムアウトです。デフォルトは bdbje と同じ 30 秒です。一時的なネットワーク障害や予期しない長時間の Java GC による誤検知を減らすには、この値を増やしてください。

#### `replica_ack_policy` {#replica_ack_policy}

デフォルト：SIMPLE_MAJORITY

選択肢：ALL, NONE, SIMPLE_MAJORITY

bdbje のレプリカ応答ポリシーです。詳細は <http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.ReplicaAckPolicy.html> を参照してください。

#### `replica_sync_policy` {#replica_sync_policy}

デフォルト：SYNC

選択肢：SYNC, NO_SYNC, WRITE_NO_SYNC

bdbje の Follower FE 同期ポリシーです。

#### `master_sync_policy` {#master_sync_policy}

デフォルト：SYNC

選択肢：SYNC, NO_SYNC, WRITE_NO_SYNC

bdbje の Master FE 同期ポリシーです。Follower FE が 1 台のみの場合は 'SYNC' に設定します。Follower FE が 3 台を超える場合は、この項目と以下の 'replica_sync_policy' を WRITE_NO_SYNC に設定できます。詳細は <http://docs.oracle.com/cd/E17277_02/html/java/com/sleepycat/je/Durability.SyncPolicy.html> を参照してください。

#### `bdbje_reserved_disk_bytes` {#bdbje_reserved_disk_bytes}

レプリケートされた JE Environment で保持する予約領域のバイト数の上限目標値です。

デフォルト：1073741824

動的な設定が可能か：false

Master FE ノード固有の設定項目か：false

#### `ignore_meta_check` {#ignore_meta_check}

デフォルト：false

IsMutable：true

true の場合、Master 以外の FE は、Master FE とのメタデータの遅延が *meta_delay_toleration_second* を超えても、その遅延を無視して読み取りサービスを提供し続けます。何らかの理由で Master FE を比較的長く停止する必要があり、その間も Master 以外の FE で読み取りサービスを提供したい場合に役立ちます。

#### `meta_delay_toleration_second` {#meta_delay_toleration_second}

デフォルト：300 (5 min)

メタデータの遅延が *meta_delay_toleration_second* を超えると、Master 以外の FE はサービスの提供を停止します。

#### `edit_log_port` {#edit_log_port}

デフォルト：9010

bdbje のポートです。

#### `edit_log_type` {#edit_log_type}

デフォルト：BDB

Edit Log の種類です。
BDB: ログを bdbje に書き込みます。
LOCAL: 非推奨です。

#### `edit_log_roll_num` {#edit_log_roll_num}

デフォルト：50000

IsMutable：true

MasterOnly：true

Master FE は、メタデータジャーナルが *edit_log_roll_num* 件記録されるごとに image を保存します。

#### `force_do_metadata_checkpoint` {#force_do_metadata_checkpoint}

デフォルト：false

IsMutable：true

MasterOnly：true

true に設定すると、チェックポイントスレッドは JVM のメモリ使用率に関係なくチェックポイントを作成します。

#### `metadata_checkpoint_memory_threshold` {#metadata_checkpoint_memory_threshold}

デフォルト：60  （60%）

IsMutable：true

MasterOnly：true

JVM のメモリ使用率（ヒープまたは old メモリプール）がこのしきい値を超えると、OOM を避けるためチェックポイントスレッドは動作しません。

#### `max_same_name_catalog_trash_num` {#max_same_name_catalog_trash_num}

catalog のごみ箱に保持する、同名のメタデータの最大数を設定します。上限を超えると、最も古く削除されたメタデータが完全に削除され、復元できなくなります。0 は同名のオブジェクトを保持しないことを、< 0 は無制限を意味します。

注：同名かどうかの判定範囲は限定されます。たとえば、データベースは同じクラスター内、テーブルは同じデータベース内（同じデータベース ID）、パーティションは同じデータベース内（同じデータベース ID）かつ同じテーブル内（同じテーブル ID）で判定されます。

デフォルト：3

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

#### `cluster_id` {#cluster_id}

デフォルト：-1

同じ cluster id を持つノード（FE または BE）は、同じ Doris クラスターに属すると見なされます。cluster id は通常、Master FE の初回起動時に生成されるランダムな整数です。明示的に指定することもできます。

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

マルチクラスター機能はバージョン 0.12 で非推奨になります。この設定を true にすると、次のようなクラスター機能に関するすべての操作が無効になります。

1. クラスターの作成と削除
2. 空き BE の追加、クラスターへの BE の追加、クラスターのバランス調整のための廃止
3. クラスターの BE 数の変更
4. データベースのリンクと移行

#### `enable_fqdn_mode` {#enable_fqdn_mode}

主に k8s クラスター環境で使用する設定です。enable_fqdn_mode が true の場合、BE がある pod は再作成後も名前が変わりませんが、IP は変わる可能性があります。

デフォルト：false

動的な設定が可能か：false

Master FE ノード固有の設定項目か：true

#### `enable_token_check` {#enable_token_check}

デフォルト：true

前方互換性のための設定で、今後削除される予定です。image ファイルのダウンロード時にトークンを確認します。

#### `fe_meta_auth_token` {#fe_meta_auth_token}

デフォルト：""（空文字列）

IsMutable: false

FE ノード間で FE メタサービスの HTTP エンドポイント（`image`、`role`、`check`、`put`、`journal_id` など）を認証するためのクラスタートークンです。Doris 4.0 系ではバージョン 4.0.8、4.1 系ではバージョン 4.1.4 で追加されました。

空でない値を設定すると、これらのエンドポイントでは、既存のノードホスト確認に加えて、一致するトークンヘッダーの提示が必要になります。これにより、クラスターに属さないノードから FE のメタデータエンドポイントにアクセスできなくなります。空のままにすると従来どおりノードホストのみを確認するため、既存のクラスターやローリングアップグレードには影響しません。

:::caution 注意

この設定は **すべての FE** で同じ値にし、有効化する前に `fe.conf` に記述する必要があります。そうしないと、FE 同士がメタデータ要求を拒否し、メタデータの同期に失敗します。

:::

#### `enable_multi_tags` {#enable_multi_tags}

デフォルト：false

動的な設定が可能か：false

Master FE ノード固有の設定項目か：true

単一の BE でマルチタグ機能を有効にするかどうかを指定します。

#### `initial_root_password` {#initial_root_password}

root ユーザーの初期パスワードを、2 段階の SHA-1 で暗号化した値で設定します。デフォルトの '' は root パスワードがないことを意味します。その後に root ユーザーに対して `set password` を実行すると、初期パスワードは上書きされます。

例：平文パスワード `root@123` を設定する場合は、Doris SQL の `select password('root@123')` を実行して、暗号化されたパスワード `*A00C34073A26B40AB4307650BFB9309D6BFA6999` を生成できます。

デフォルト：空文字列

動的な設定が可能か：false

Master FE ノード固有の設定項目か：true

#### `enable_cooldown_replica_affinity` {#enable_cooldown_replica_affinity}

クールダウンされたレプリカを優先してスキャンするかどうかを指定します。デフォルトは true です。

デフォルト：true

動的な設定が可能か：true

Master FE ノード固有の設定項目か：false

### TSO（Timestamp Oracle） {#tso-timestamp-oracle}

<version since="dev">

</version>

TSO は、デフォルトで false の `enable_feature_changelog` によって有効化されます。この設定は動的に変更できません。現在サポートされる TSO パラメータは次のとおりです。使い方と注意事項は [TSO](../cluster-management/tso.md) を参照してください。

| パラメータ | 型 | デフォルト | 動的変更 | Master のみ | 説明 |
| --- | --- | --- | --- | --- | --- |
| `tso_service_update_interval_ms` | int | `50 ms` | false | true | 割り当てウィンドウの更新を確認する間隔。 |
| `tso_max_update_retry_count` | int | `3` | true | true | TSO 状態の更新を試みる最大回数。 |
| `tso_max_get_retry_count` | int | `10` | true | true | 失敗を報告する前に TSO の割り当てを試みる最大回数。 |
| `tso_service_window_duration_ms` | int | `1000 ms` | true | true | 予約する割り当てウィンドウの期間。定期的な永続化間隔の上限にもなります。 |
| `tso_clock_backward_startup_threshold_ms` | long | `1800000 ms` | true | true | 起動時の時刻補正で許容する、再生されたウィンドウの終了時刻とシステム時刻との差の上限。 |
| `tso_time_offset_debug_mode` | int | `0 ms` | true | false | テスト専用の時刻オフセット。通常の運用では使用しないでください。 |
| `enable_tso_forward_when_counter_full` | boolean | `true` | true | true | 論理カウンターが容量の半分を超え、実時刻の進行が不足している場合、物理部分を 1 ms 進めます。 |

### サービス {#service}

#### `arrow_flight_deferred_query_idle_timeout_second` {#arrow_flight_deferred_query_idle_timeout_second}

デフォルト：3600（秒）

動的な設定が可能か：true

Master FE ノード固有の設定項目か：false

バージョン 4.1.5 以降でサポートされます。外部テーブルをバッチ単位でスキャンする Arrow Flight SQL クエリでは、`GetFlightInfo` を返した後も FE Coordinator を保持する必要があります。これにより、クライアントが `DoGet` で結果を読み取る間、BE は split の取得を続けられます。この設定は、アイドル状態のセッションでそのようなクエリがリソースを保持する時間を制限します。期間はクエリ開始時から計測され、クエリの実行タイムアウトより短くなることはありません。期限が切れると Coordinator、Workload Group のキュースロット、`active_queries` のエントリが解放されます。ただしセッションは開いたままで、引き続き `wait_timeout` が適用されます。この期限を無効にするには `0` に設定します。

#### `query_port` {#query_port}

デフォルト：9030

FE の MySQL サーバーポートです。

#### `arrow_flight_sql_port` {#arrow_flight_sql_port}

デフォルト：-1

Arrow Flight SQL サーバーポートです。

#### `frontend_address` {#frontend_address}

状態：非推奨。使用は推奨されません。このパラメータは今後削除される可能性があります。

型：string

説明：*InetAddress.getByName* で IP アドレスを取得する代わりに、FE の IP アドレスを明示的に設定します。通常は、*InetAddress.getByName* で期待する結果が得られない場合に使用します。ホスト名は使用できず、IP アドレスのみを指定できます。

デフォルト値：0.0.0.0

#### `priority_networks` {#priority_networks}

デフォルト：none

複数の IP アドレスを持つサーバーの選択方法を指定します。このリストに一致する IP アドレスは最大 1 つにしてください。リストはセミコロン区切りの CIDR 表記で指定します（例：10.10.10.0/24）。一致する IP アドレスがない場合は、ランダムに選択されます。

#### `http_port` {#http_port}

デフォルト：8030

HTTP のバインドポートです。現在、すべての FE の HTTP ポートを同じにする必要があります。

#### `https_port` {#https_port}

デフォルト：8050

HTTPS のバインドポートです。現在、すべての FE の HTTPS ポートを同じにする必要があります。

#### `enable_https` {#enable_https}

デフォルト：false

HTTPS の有効化フラグです。false の場合は HTTP がサポートされます。true の場合は HTTP と HTTPS の両方がサポートされ、HTTP リクエストは自動的に HTTPS にリダイレクトされます。
`enable_https` が true の場合は、`fe.conf` に SSL 証明書の情報を設定する必要があります。

#### `enable_ssl` {#enable_ssl}

デフォルト：true

true に設定すると、Doris は MySQL との間に SSL プロトコルに基づく暗号化チャネルを確立します。

#### `qe_max_connection` {#qe_max_connection}

デフォルト：1024

FE ごとの最大接続数です。

#### `check_java_version` {#check_java_version}

デフォルト：true

Doris は、コンパイル時と実行時の Java バージョンに互換性があるか確認します。互換性がない場合は、Java バージョンの不一致を示す例外メッセージを出し、起動を中止します。

#### `rpc_port` {#rpc_port}

デフォルト：9020

FE の Thrift Server ポートです。

#### `thrift_server_type` {#thrift_server_type}

FE の Thrift Service で使用するサービスモデルを指定します。型は String で、大文字と小文字は区別されません。

'SIMPLE' の場合は 'TSimpleServer' モデルを使用します。通常は本番環境に適さず、テスト用途に限られます。

'THREADED' の場合は 'TThreadedSelectorServer' モデルを使用します。これは非ブロッキング I/O の master-slave Reactor モデルで、多数の同時接続要求にすばやく応答でき、多くの場面で良好な性能を発揮します。

`THREAD_POOL` の場合は `TThreadPoolServer` モデルを使用します。これはスレッドプールでユーザー接続を処理するブロッキング I/O モデルです。同時接続数はスレッドプールのスレッド数に制限されます。同時リクエスト数を事前に見積もることができ、十分なスレッドリソースを確保できる場合は、このモデルのほうが高い性能を得られます。デフォルトで使用されるサービスモデルです。

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

Thrift サーバーが受信するメッセージの最大サイズをバイト単位で指定します。クライアントが送信したメッセージが上限を超えると、Thrift サーバーはリクエストを拒否して接続を閉じます。その結果、クライアントには "connection has been closed by peer." というエラーが表示されます。この場合は、このパラメータを増やしてみてください。

#### `use_compact_thrift_rpc` {#use_compact_thrift_rpc}

デフォルト：true

クエリプランの構造を圧縮形式で送信するかどうかを指定します。有効にすると、クエリプランの構造のサイズを約 50% 削減でき、一部の "send fragment timeout" エラーを回避できます。
ただし、同時実行数が多い小規模なクエリでは、並列処理能力が約 10% 低下する場合があります。

#### `grpc_max_message_size_bytes` {#grpc_max_message_size_bytes}

デフォルト：1G

GRPC クライアントチャネルの初期フローウィンドウサイズと最大メッセージサイズを設定します。結果セットが大きい場合は、この値を増やす必要があります。

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

デフォルト：10000   （10s）

Broker RPC のデフォルトタイムアウトです。

#### `backend_rpc_timeout_ms` {#backend_rpc_timeout_ms}

FE から BE へ送信する RPC リクエストのタイムアウトをミリ秒単位で指定します。

デフォルト：60000

動的な設定が可能か：false

Master FE ノード固有の設定項目か：true

#### `drop_backend_after_decommission` {#drop_backend_after_decommission}

デフォルト：false

IsMutable：true

MasterOnly：true

1. BE の廃止が成功した後、システムがその BE を削除するかどうかを制御します。true の場合、BE ノードは正常にオフラインになった後に削除されます。false の場合、BE は正常にオフラインになった後も DECOMMISSION 状態で残り、削除されません。

   この設定は、特定の状況で役立ちます。Doris クラスターの初期状態で BE ノードごとにディスクが 1 台あり、しばらく運用した後、各 BE ノードに新しいディスクを 2 台追加したとします。Doris は現在、BE 内のディスク間でデータをバランス調整できないため、元のディスクのデータ量が、新しく追加したディスクより常に大幅に多くなる可能性があります。この場合、次の操作でディスク間のバランスを手動で調整できます。

   1. この設定項目を false にします。
   2. ある BE ノードを廃止します。この操作によって、その BE の全データがほかのノードへ移行されます。
   3. 廃止が完了しても BE は削除されません。この時点で BE の廃止状態を解除します。すると、ほかの BE ノードからこのノードへデータが再配置され始め、BE のすべてのディスクに均等に分散されます。
   4. すべての BE ノードに対して手順 2 と 3 を順番に実行し、全ノードのディスクのバランスを調整します。

#### `max_backend_down_time_second` {#max_backend_down_time_second}

デフォルト：3600  (1 hour)

IsMutable：true

MasterOnly：true

BE が *max_backend_down_time_second* の間停止すると、BACKEND_DOWN イベントが発生します。

#### `disable_backend_black_list` {#disable_backend_black_list}

BE のブラックリスト機能を無効にします。無効にすると、BE へのクエリリクエストが失敗しても、その BE はブラックリストに追加されません。
回帰テスト環境で、一時的な不具合によって多数の回帰テストが失敗するのを減らすために適したパラメータです。

デフォルト：false

動的な設定が可能か：true

Master FE ノード固有の設定項目か：false

#### `max_backend_heartbeat_failure_tolerance_count` {#max_backend_heartbeat_failure_tolerance_count}

BE ノードのハートビート失敗を許容する最大回数です。連続した失敗回数がこの値を超えると、BE の状態は dead に設定されます。
回帰テスト環境で、一時的なハートビートの失敗によって多数の回帰テストが失敗するのを減らすために適したパラメータです。

デフォルト：1

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

### `abort_txn_after_lost_heartbeat_time_second` {#abort_txn_after_lost_heartbeat_time_second}

ハートビートが失われてからトランザクションを中止するまでの時間です。デフォルト値は 300 で、ハートビートを失ってから 300s 後に BE のトランザクションが中止されます。

デフォルト：300(s)

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

#### `enable_access_file_without_broker` {#enable_access_file_without_broker}

デフォルト：false

IsMutable：true

MasterOnly：true

Broker 経由で BOS などのクラウドストレージにアクセスする際、Broker を経由しないよう試みる設定です。

#### `agent_task_resend_wait_time_ms` {#agent_task_resend_wait_time_ms}

デフォルト：5000

IsMutable：true

MasterOnly：true

agent_task に create_time が設定されている場合、エージェントタスクを再送するかどうかを決めます。current_time - create_time > agent_task_resend_wait_time_ms の場合にのみ、ReportHandler はエージェントタスクを再送できます。

現在、この設定は主に `PUBLISH_VERSION` エージェントタスクの重複送信を解消するために使用されています。現在のデフォルト値 5000 は実験的な値です。

AgentTaskQueue へのエージェントタスクの登録と BE への送信の間には遅延があるため、この値を増やすと重複送信を効果的に減らせます。

一方で、送信や実行に失敗したエージェントタスクが再実行されるまでの時間も長くなります。

#### `max_agent_task_threads_num` {#max_agent_task_threads_num}

デフォルト：4096

MasterOnly：true

エージェントタスクのスレッドプールでタスクを処理するスレッドの最大数です。

#### `remote_fragment_exec_timeout_ms` {#remote_fragment_exec_timeout_ms}

デフォルト：30000  （ms）

IsMutable：true

非同期のリモート fragment を実行する際のタイムアウトです。通常は短時間で実行されます。システムの負荷が高い場合は、この値を長くしてみてください。

#### `auth_token` {#auth_token}

デフォルト：empty

内部認証に使用するクラスタートークンです。

#### `enable_http_server_v2` {#enable_http_server_v2}

デフォルト：正式版 0.14.0 のリリース後は true、それ以前は false

HTTP Server V2 は SpringBoot で実装され、フロントエンドとバックエンドを分離したアーキテクチャを使用します。新しいフロントエンド UI を利用するには、HTTPv2 を有効にする必要があります。

#### `http_api_extra_base_path` {#http_api_extra_base_path}

一部のデプロイ環境では、HTTP API に共通のプレフィックスとして追加のベースパスを指定する必要があります。このパラメータで追加のプレフィックスを指定します。
設定後は `GET /api/basepath` インターフェースから値を取得できます。新しい UI も URL を組み立てる際に、まずこのベースパスの取得を試みます。`enable_http_server_v2` が true の場合にのみ有効です。

デフォルトは空、つまり未設定です。

#### `jetty_server_acceptors` {#jetty_server_acceptors}

デフォルト：2

#### `jetty_server_selectors` {#jetty_server_selectors}

デフォルト：4

#### `jetty_server_workers` {#jetty_server_workers}

デフォルト：0

上記のパラメータに対応する Jetty のスレッド構成はシンプルで、acceptors、selectors、workers の 3 つのスレッドプールに分かれます。acceptors が新規接続を受け付け、selectors に渡して HTTP メッセージプロトコルを解析し、最後に workers がリクエストを処理します。前の 2 つのスレッドプールは非ブロッキングモデルを使い、少数のスレッドで多数のソケットの読み書きを処理できます。

ほとんどのプロジェクトでは、acceptors は 1～2 スレッド、selectors は 2～4 スレッドで十分です。workers はブロッキングするビジネスロジックを処理し、データベース操作も多いため、多数のスレッドが必要です。具体的な数はアプリケーションの QPS と IO イベントの割合によって異なります。QPS が高いほど、また IO の割合が高く待機スレッドが増えるほど、必要な総スレッド数も増えます。

Worker スレッドプールはデフォルトでは設定されません。必要に応じて設定してください。

#### `jetty_server_max_http_post_size` {#jetty_server_max_http_post_size}

デフォルト：`100 * 1024 * 1024`  （100MB）

PUT または POST メソッドでアップロードできるファイルの最大バイト数です。デフォルト値は 100MB です。

#### `jetty_server_max_http_header_size` {#jetty_server_max_http_header_size}

デフォルト：1048576  （1M）

HTTP ヘッダーサイズの設定パラメータです。デフォルト値は 1M です。

#### `http_sql_submitter_max_worker_threads` {#http_sql_submitter_max_worker_threads}

デフォルト：2

HTTP SQL submitter のワーカースレッドの最大数です。

#### `http_load_submitter_max_worker_threads` {#http_load_submitter_max_worker_threads}

デフォルト：2

HTTP upload submitter のワーカースレッドの最大数です。

:::caution 動作変更（4.1.4）

バージョン 4.1.4 で `/api/upload` エンドポイントが削除され、この設定項目も同時に削除されました。[Upload Action](../open-api/fe-http/upload-action) を参照してください。

:::

### クエリエンジン {#query-engine}

#### `default_max_query_instances` {#default_max_query_instances}

ユーザープロパティ max_query_instances が 0 以下の場合に使用するデフォルト値です。ユーザーごとのインスタンスの最大数を制限します。このパラメータが 0 以下の場合は無制限です。

デフォルト値は -1 です。

#### `max_query_retry_time` {#max_query_retry_time}

デフォルト：3

IsMutable：true

クエリの再試行回数です。RPC 例外が発生し、まだユーザーへ結果を送信していない場合、クエリを再試行することがあります。障害の連鎖的拡大を避けるため、この値を減らすことができます。

#### `max_dynamic_partition_num` {#max_dynamic_partition_num}

デフォルト：500

IsMutable：true

MasterOnly：true

動的パーティションテーブルの作成時に、一度に作られるパーティションが多すぎないよう、作成可能な最大数を制限します。数は動的パーティションパラメータの "start" と "end" で決まります。

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

マルチパーティションの名前のプレフィックスを設定します。動的パーティションには適用されません。デフォルトのプレフィックスは "p_" です。

#### `multi_partition_name_prefix` {#multi_partition_name_prefix}

デフォルト：p_

IsMutable：true

MasterOnly：true

マルチパーティションの名前のプレフィックスを設定します。動的パーティションには適用されません。デフォルトのプレフィックスは "p_" です。

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

この設定はクラスターの初期化時にのみ指定できます。初期化後の再起動やアップグレード時には変更できません。

0: テーブル名を指定どおりに保存し、大文字と小文字を区別して比較します。
1: テーブル名を小文字で保存し、大文字と小文字を区別せずに比較します。
2: テーブル名を指定どおりに保存しますが、比較時には小文字として扱います。

#### `table_name_length_limit` {#table_name_length_limit}

デフォルト：64

IsMutable：true

MasterOnly：true

テーブル名の最大長を制御します。

#### `cache_enable_sql_mode` {#cache_enable_sql_mode}

デフォルト：true

IsMutable：true

MasterOnly：false

有効にすると、SQL クエリの結果セットがキャッシュされます。クエリに含まれるすべてのテーブルのすべてのパーティションで、最後に参照されたバージョンの時刻からの間隔が cache_last_version_interval_second を超え、結果セットが cache_result_max_row_count より少なく、データサイズが cache_result_max_data_size より小さい場合にキャッシュされます。次に同じ SQL を実行するとキャッシュがヒットします。

true にすると、FE は SQL 結果のキャッシュを有効にします。オフラインでデータを更新する場合に適しています。

|                        | case1 | case2 | case3 | case4 |
| ---------------------- | ----- | ----- | ----- | ----- |
| enable_sql_cache       | false | true  | true  | false |
| enable_partition_cache | false | false | true  | true  |

#### `cache_enable_partition_mode` {#cache_enable_partition_mode}

デフォルト：true

IsMutable：true

MasterOnly：false

true にすると、FE は BE のキャッシュからデータを取得します。一部のパーティションをリアルタイムに更新する場合に適しています。

#### `cache_result_max_row_count` {#cache_result_max_row_count}

デフォルト：3000

IsMutable：true

MasterOnly：false

メモリの過剰使用を避けるため、キャッシュ可能な行数のデフォルト上限は 3000 です。このしきい値を超えるとキャッシュされません。

#### `cache_result_max_data_size` {#cache_result_max_data_size}

デフォルト：31457280

IsMutable: true

MasterOnly: false

メモリの過剰使用を避けるため、キャッシュ可能な行データのサイズのデフォルト上限は 10MB です。このしきい値を超えるとキャッシュされません。

#### `cache_last_version_interval_second` {#cache_last_version_interval_second}

デフォルト：30

IsMutable：true

MasterOnly：false

テーブルの最新パーティションバージョンに関する時間間隔で、データ更新から現在のバージョンまでの間隔を表します。通常は 900 秒に設定し、オフラインのインポートとリアルタイムのインポートを区別します。

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

ハッシュ分散の枝刈り処理における再帰の最大深度を制限します。
例：where a in (5 elements) and b in (4 elements) and c in (3 elements) and d in (2 elements)。
a/b/c/d が分散列の場合、再帰の深度は 5 *4* 3 * 2 = 120 となり、100 を超えます。
そのため、分散の枝刈りは機能せず、すべてのバケットが返されます。
深度を増やすと、より多くの要素に対して分散の枝刈りができますが、CPU 使用量が増える可能性があります。

#### `enable_local_replica_selection` {#enable_local_replica_selection}

デフォルト：false

IsMutable：true

true にすると、Planner はこの Frontend と同じホストにある tablet のレプリカを選択しようとします。
次の条件では、ネットワーク転送量を減らせる可能性があります。

* N 台のホストに N 台の BE と N 台の FE が配置されている。

* データに N 個のレプリカがある。

* 同時実行数の多いクエリが、すべての FE に均等に送信される。

この場合、各 FE はローカルのレプリカのみを使ってクエリを実行できます。ローカルのレプリカが利用できない場合にほかのレプリカへ切り替えるには、enable_local_replica_selection_fallback を true に設定します。

#### `enable_local_replica_selection_fallback` {#enable_local_replica_selection_fallback}

デフォルト：false

IsMutable：true

enable_local_replica_selection と併用します。ローカルのレプリカが利用できない場合、ローカル以外のレプリカに切り替えます。

#### `expr_depth_limit` {#expr_depth_limit}

デフォルト：3000

IsMutable：true

式ツリーの深さの上限です。上限を超えると、データベースの読み取りロックを保持したまま解析が長時間続く可能性があります。動作を十分に理解したうえで設定してください。

#### `expr_children_limit` {#expr_children_limit}

デフォルト：10000

IsMutable：true

式ツリーの子要素数の上限です。上限を超えると、データベースの読み取りロックを保持したまま解析が長時間続く可能性があります。

#### `be_exec_version` {#be_exec_version}

fragment 間で block を渡す際のシリアライズ形式を定義します。

コードの変更によって block のデータ形式が変わることがあります。ローリングアップグレード中も BE 同士の互換性を保つため、FE からデータバージョンを通知し、送信時に使用する形式を決めます。

たとえばクラスターに 2 台の BE があり、アップグレード済みの BE は最新の $v_1$ に対応し、もう一方は $v_0$ にしか対応していないとします。この時点では FE がまだアップグレードされていないため、$v_0 が一律に通知されます。$、BE 同士は古いデータ形式でやり取りします。すべての BE をアップグレードした後で FE をアップグレードすると、新しい FE は $v_1$ を通知し、クラスター全体が新しいデータ形式に切り替わります。

デフォルト値は `max_be_exec_version` です。特別な要件があれば形式のバージョンを手動で下げられますが、`min_be_exec_version` より低くしてはいけません。

この変数の値は、すべての BE について常に `BeExecVersionManager::min_be_exec_version` と `BeExecVersionManager::max_be_exec_version` の範囲内に保ってください。（アップグレード済みクラスターをダウングレードする場合は、FE、BE の順にダウングレードするか、設定でこの変数を手動で下げてから BE をダウングレードする必要があります。）

#### `max_be_exec_version` {#max_be_exec_version}

現在サポートされる最新のデータバージョンです。変更できず、対応するバージョンの BE にある `BeExecVersionManager::max_be_exec_version` と一致する必要があります。

#### `min_be_exec_version` {#min_be_exec_version}

現在サポートされる最も古いデータバージョンです。変更できず、対応するバージョンの BE にある `BeExecVersionManager::min_be_exec_version` と一致する必要があります。

#### `max_query_profile_num` {#max_query_profile_num}

クエリプロファイルの最大数です。

デフォルト：100

動的な設定が可能か：true

Master FE ノード固有の設定項目か：false

#### `publish_version_interval_ms` {#publish_version_interval_ms}

デフォルト：10 （ms）

publish version 操作の最小間隔です。

#### `publish_version_timeout_second` {#publish_version_timeout_second}

デフォルト：30 （s）

IsMutable：true

MasterOnly：true

トランザクションのすべての publish version タスクが完了するまでの最大待機時間です。

#### `query_colocate_join_memory_limit_penalty_factor` {#query_colocate_join_memory_limit_penalty_factor}

デフォルト：1

Colocote join PlanFragment インスタンスの memory_limit = exec_mem_limit / min (query_colocate_join_memory_limit_penalty_factor, instance_num)

#### `rewrite_count_distinct_to_bitmap_hll` {#rewrite_count_distinct_to_bitmap_hll}

デフォルト：true

この変数はセッション変数で、セッション単位で有効になります。

* 型：boolean
* 説明：**AGG モデルのテーブルにのみ適用されます**。true の場合、ユーザーのクエリに count(distinct c1) などの集約関数が含まれ、c1 列の型が bitmap なら、count distinct は bitmap_union_count(c1) に書き換えられます。c1 列の型が hll なら、hll_union_agg(c1) に書き換えられます。false の場合は書き換えられません。

### データロードとエクスポート {#load-and-export}

#### `streaming_cdc_fetch_splits_batch_size` {#streaming_cdc_fetch_splits_batch_size}

デフォルト：16（4.1.5 より前は 100）

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

Streaming CDC のリクエストごとに取得する split の数です。バージョン 4.1.5 では、各リクエストのサイズを減らすため、デフォルトが 100 から 16 に引き下げられました。

#### `max_export_history_job_num` {#max_export_history_job_num}

デフォルト：1000

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

EXPORT ジョブ履歴をクリーンアップする際のしきい値です。バージョン 4.1.5 以降、クリーンアップでは `FINISHED` / `CANCELLED` 状態のジョブのみを削除し、実行中のジョブは保持します。そのため、有効なジョブによって総レコード数がこの値を超える場合があります。

#### `enable_pipeline_load` {#enable_pipeline_load}

デフォルト値：true

IsMutable: true

Streamload などのインポートタスクを Pipeline エンジンで実行するかどうかを指定します。

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

データの形式が不正であるなどの理由でフィルタリングできるデータの最大割合です。デフォルト値は 0 です。

#### `max_running_txn_num_per_db` {#max_running_txn_num_per_db}

デフォルト：1000

IsMutable：true

MasterOnly：true

主に同じデータベースで同時に実行できるデータロードジョブの数を制御します。

クラスターで実行中のデータロードジョブが多すぎると、新しく送信したジョブで次のエラーが発生する場合があります。

```text
current running txns on db xxx is xx, larger than limit xx
```

このエラーは、クラスターで現在実行中のデータロードジョブ数が設定値を超えていることを示します。その場合は、アプリケーション側で待機してからジョブを再試行することを推奨します。

Connector を使用している場合、このパラメータを適切に増やすことができ、数千に設定しても問題ありません。

#### `using_old_load_usage_pattern` {#using_old_load_usage_pattern}

デフォルト：false

IsMutable：true

MasterOnly：true

true にすると、処理中にエラーが発生した INSERT 文でも、ユーザーにラベルを返します。ユーザーはそのラベルでデータロードジョブの状態を確認できます。デフォルトの false では、INSERT 操作でエラーが発生すると、データロードのラベルを返さずに、例外をクライアントへ直接通知します。

#### `disable_load_job` {#disable_load_job}

デフォルト：false

IsMutable：true

MasterOnly：true

true に設定した場合：

* 保留中のデータロードジョブは、begin txn API の呼び出し時にすべて失敗します。
* 準備段階のデータロードジョブは、commit txn API の呼び出し時にすべて失敗します。
* コミット済みのデータロードジョブは、公開を待機します。

#### `commit_timeout_second` {#commit_timeout_second}

デフォルト：30

IsMutable：true

MasterOnly：true

トランザクション前に挿入したすべてのデータがコミットされるまでの最大待機時間です。
"commit" コマンドのタイムアウトを秒単位で指定します。

#### `max_unfinished_load_job` {#max_unfinished_load_job}

デフォルト：1000

IsMutable：true

MasterOnly：true

PENDING、ETL、LOADING、QUORUM_FINISHED を含むデータロードジョブの最大数です。この値を超えると、新しいデータロードジョブを送信できません。

#### `db_used_data_quota_update_interval_secs` {#db_used_data_quota_update_interval_secs}

デフォルト：300 (s)

IsMutable：true

MasterOnly：true

Master のデーモンスレッドは、`db_used_data_quota_update_interval_secs` ごとに、データベースの使用済みデータクォータを db txn manager 用に更新します。

データロードの性能を高めるため、データロード前のクォータ確認ではデータベースの使用済みデータ量をリアルタイムに計算せず、デーモンスレッドが定期的に更新した値を取得します。

この設定は、データベースの使用済みデータ量の値を更新する間隔を指定します。

#### `disable_show_stream_load` {#disable_show_stream_load}

デフォルト：false

IsMutable：true

MasterOnly：true

show stream load を無効にし、メモリ内の stream load レコードを消去するかどうかを指定します。

#### `max_stream_load_record_size` {#max_stream_load_record_size}

デフォルト：5000

IsMutable：true

MasterOnly：true

メモリに保存できる直近の stream load レコードのデフォルト最大数です。

#### `fetch_stream_load_record_interval_second` {#fetch_stream_load_record_interval_second}

デフォルト：120

IsMutable：true

MasterOnly：true

stream load レコードの取得間隔です。

#### `max_bytes_per_broker_scanner` {#max_bytes_per_broker_scanner}

デフォルト：`500 * 1024 * 1024 * 1024L`  （500G）

IsMutable：true

MasterOnly：true

1 回の Broker Load ジョブで Broker scanner が処理できる最大バイト数です。通常、各 BE は Broker scanner を 1 つ持ちます。

#### `default_load_parallelism` {#default_load_parallelism}

デフォルト：8

IsMutable：true

MasterOnly：true

単一ノードでの Broker Load 実行プランのデフォルト並列度です。
ユーザーが Broker Load の送信時に並列度を設定した場合、このパラメータは無視されます。
このパラメータは、`max broker concurrency` や `min bytes per broker scanner` などの設定とともに、インポートタスクの同時実行数を決定します。

#### `max_broker_concurrency` {#max_broker_concurrency}

デフォルト：10

IsMutable：true

MasterOnly：true

Broker scanner の最大同時実行数です。

#### `min_bytes_per_broker_scanner` {#min_bytes_per_broker_scanner}

デフォルト：67108864L (64M)

IsMutable：true

MasterOnly：true

単一の Broker scanner が読み取る最小バイト数です。

#### `period_of_auto_resume_min` {#period_of_auto_resume_min}

デフォルト：5 （s）

IsMutable：true

MasterOnly：true

Routine Load を自動再開する周期です。

#### `max_tolerable_backend_down_num` {#max_tolerable_backend_down_num}

デフォルト：0

IsMutable：true

MasterOnly：true

BE が 1 台でも停止していると、Routine Load は自動再開できません。

#### `max_routine_load_task_num_per_be` {#max_routine_load_task_num_per_be}

デフォルト：5

IsMutable：true

MasterOnly：true

BE ごとに同時実行できる Routine Load タスクの最大数です。BE に送信される Routine Load タスク数を制限します。また、BE の Routine Load タスク用スレッドプールのサイズを表す設定 'routine_load_thread_pool_size'（デフォルト 10）より小さくする必要があります。

#### `max_routine_load_task_concurrent_num` {#max_routine_load_task_concurrent_num}

デフォルト：5

IsMutable：true

MasterOnly：true

単一の Routine Load ジョブで同時実行できる Routine Load タスクの最大数です。

#### `max_routine_load_job_num` {#max_routine_load_job_num}

デフォルト：100

NEED_SCHEDULED、RUNNING、PAUSE を含む Routine Load ジョブの最大数です。

#### `desired_max_waiting_jobs` {#desired_max_waiting_jobs}

デフォルト：100

IsMutable：true

MasterOnly：true

Routine Load とバージョン 2 のデータロードで待機するジョブ数のデフォルト目標値です。Master の切り替え時など、状況によっては実際の数が desired_max_waiting_jobs を超える場合があります。

#### `disable_hadoop_load` {#disable_hadoop_load}

デフォルト：false

IsMutable：true

MasterOnly：true

Hadoop クラスターを使用したデータロードは今後非推奨になります。true にすると、この種類のデータロードが無効になります。

#### `enable_spark_load` {#enable_spark_load}

デフォルト：false

IsMutable：true

MasterOnly：true

Spark Load を一時的に有効にするかどうかを指定します。デフォルトでは無効です。

**注：** このパラメータはバージョン 1.2 で削除され、spark_load はデフォルトで有効になりました。

#### `spark_load_checker_interval_second` {#spark_load_checker_interval_second}

デフォルト：60

Spark Load スケジューラーの実行間隔です。デフォルトは 60 秒です。

#### `async_loading_load_task_pool_size` {#async_loading_load_task_pool_size}

デフォルト：10

IsMutable：false

MasterOnly：true

loading_load タスク実行プールのサイズです。実行中の loading_load タスクの最大数を制限します。

現在は Broker Load の loading_load タスクのみを制限します。

#### `async_pending_load_task_pool_size` {#async_pending_load_task_pool_size}

デフォルト：10

IsMutable：false

MasterOnly：true

pending_load タスク実行プールのサイズです。実行中の pending_load タスクの最大数を制限します。

現在は Broker Load と Spark Load の pending_load タスクのみを制限します。

'max_running_txn_num_per_db' より小さくする必要があります。

#### `async_load_task_pool_size` {#async_load_task_pool_size}

デフォルト：10

IsMutable：false

MasterOnly：true

旧バージョンとの互換性のためだけにある設定です。async_loading_load_task_pool_size に置き換えられており、今後削除されます。

#### `enable_single_replica_load` {#enable_single_replica_load}

デフォルト：false

IsMutable：true

MasterOnly：true

Stream Load と Broker Load で単一レプリカへの書き込みを有効にするかどうかを指定します。

#### `min_load_timeout_second` {#min_load_timeout_second}

デフォルト：1 （1s）

IsMutable：true

MasterOnly：true

すべての種類のデータロードに適用される最小タイムアウトです。

#### `max_stream_load_timeout_second` {#max_stream_load_timeout_second}

デフォルト：259200 (3 day)

IsMutable：true

MasterOnly：true

Stream Load のタイムアウト設定を制限します。ユーザーが大きなタイムアウトを設定したために、失敗した Stream Load トランザクションを短時間でキャンセルできなくなることを防ぎます。

#### `max_load_timeout_second` {#max_load_timeout_second}

デフォルト：259200 (3 day)

IsMutable：true

MasterOnly：true

Stream Load を除くすべての種類のデータロードに適用される最大タイムアウトです。

#### `stream_load_default_timeout_second` {#stream_load_default_timeout_second}

デフォルト：86400 * 3 (3 day)

IsMutable：true

MasterOnly：true

Stream Load と streaming mini load のデフォルトタイムアウトです。

#### `stream_load_default_precommit_timeout_second` {#stream_load_default_precommit_timeout_second}

デフォルト：3600（s）

IsMutable：true

MasterOnly：true

Stream Load の事前コミットのデフォルトタイムアウトです。

#### `stream_load_default_memtable_on_sink_node` {#stream_load_default_memtable_on_sink_node}

デフォルト：false

IsMutable：true

MasterOnly：true

Stream Load で sink ノード上の memtable をデフォルトで有効にします。
HTTP ヘッダー `memtable_on_sink_node` が設定されていない場合に適用されます。

#### `insert_load_default_timeout_second` {#insert_load_default_timeout_second}

デフォルト：3600 (1 hour)

IsMutable：true

MasterOnly：true

INSERT データロードのデフォルトタイムアウトです。

#### `mini_load_default_timeout_second` {#mini_load_default_timeout_second}

デフォルト：3600 (1 hour)

IsMutable：true

MasterOnly：true

非ストリーミングの mini load のデフォルトタイムアウトです。

#### `broker_load_default_timeout_second` {#broker_load_default_timeout_second}

デフォルト：14400 (4 hour)

IsMutable：true

MasterOnly：true

Broker Load のデフォルトタイムアウトです。

#### `spark_load_default_timeout_second` {#spark_load_default_timeout_second}

デフォルト：86400  (1 day)

IsMutable：true

MasterOnly：true

Spark Load のデフォルトタイムアウトです。

#### `hadoop_load_default_timeout_second` {#hadoop_load_default_timeout_second}

デフォルト：86400 * 3   (3 day)

IsMutable：true

MasterOnly：true

Hadoop Load のデフォルトタイムアウトです。

#### `load_running_job_num_limit` {#load_running_job_num_limit}

デフォルト：0

IsMutable：true

MasterOnly：true

実行中のデータロードタスク数を制限します。デフォルトの 0 は無制限です。

#### `load_input_size_limit_gb` {#load_input_size_limit_gb}

デフォルト：0

IsMutable：true

MasterOnly：true

データロードジョブに入力されるデータのサイズを制限します。デフォルトの 0 は無制限です。

#### `load_etl_thread_num_normal_priority` {#load_etl_thread_num_normal_priority}

デフォルト：10

NORMAL 優先度の ETL データロードジョブの同時実行数です。動作を十分に理解していない場合は変更しないでください。

#### `load_etl_thread_num_high_priority` {#load_etl_thread_num_high_priority}

デフォルト：3

HIGH 優先度の ETL データロードジョブの同時実行数です。動作を十分に理解していない場合は変更しないでください。

#### `load_pending_thread_num_normal_priority` {#load_pending_thread_num_normal_priority}

デフォルト：10

NORMAL 優先度の保留中のデータロードジョブの同時実行数です。動作を十分に理解していない場合は変更しないでください。

#### `load_pending_thread_num_high_priority` {#load_pending_thread_num_high_priority}

デフォルト：3

HIGH 優先度の保留中のデータロードジョブの同時実行数です。データロードジョブの優先度は HIGH または NORMAL です。すべての mini batch load ジョブは HIGH、それ以外の種類は NORMAL です。優先度は、処理の遅いデータロードジョブが長時間スレッドを占有するのを防ぐために設定されます。これは内部的なスケジューリング最適化です。現在、ジョブの優先度を手動で指定することはできません。動作を十分に理解していない場合は変更しないでください。

#### `load_checker_interval_second` {#load_checker_interval_second}

デフォルト：5 （s）

データロードスケジューラーの実行間隔です。データロードジョブは PENDING から LOADING、さらに FINISHED へと状態が移ります。PENDING から LOADING への遷移はデータロードスケジューラーが、LOADING から FINISHED への遷移はトランザクションのコールバックが行います。そのため、同時実行数が上限に達していなければ、ジョブは最大でもこの間隔内に完了します。

#### `s3_load_endpoint_white_list` {#s3_load_endpoint_white_list}

デフォルト：empty

動的な設定が可能か：false

S3 Load で使用できるエンドポイントの許可リストです。複数の値はカンマで区切ります。例：`s3_load_endpoint_white_list=a,b,c`。空の値は、許可リストが設定されていないことを意味します。

:::caution 動作変更（4.1.4）

セキュリティ上の理由により、バージョン 4.1.4 以降、この設定項目は**動的に変更できません**。`fe.conf` でのみ設定でき、FE の再起動後に有効になります。`ADMIN SET FRONTEND CONFIG` では変更できません。

:::

#### `resource_group_load_success_quorum` {#resource_group_load_success_quorum}

デフォルト：empty

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

バージョン 4.1.4 で追加されました。データロードのトランザクションをコミットする際、リソースグループ（BE の Location Tag）ごとに、**書き込みに成功する必要があるレプリカの最小数**を設定します。

値はカンマ区切りのリストで、各項目の形式は `<resource_group>:<min_success_replicas>` です。`<min_success_replicas>` は負でない整数です。例：

```properties
resource_group_load_success_quorum=group_a:2,group_b:1
```

コミット時に、設定されたリソースグループ内で書き込みに成功したレプリカ数が指定値より少ないと、コミットは失敗します。設定に含まれないリソースグループは確認されません。形式が不正な項目は無視され、警告が `fe.log` に出力されます。

複数のデータセンターやアベイラビリティゾーンにデプロイする場合に、この設定を使用すると、指定したデータセンター内の必要数のレプリカに書き込まれた後でのみ、データロードが成功したと見なされます。

#### `enable_adaptive_random_bucket_load` {#enable_adaptive_random_bucket_load}

デフォルト：true

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

バージョン 4.1.4 で追加されました。適応的なランダムバケットのデータロードを有効にするかどうかを指定します。

有効にすると、FE は tablet の位置情報を BE に送信します。各 BE はこの情報から、プライマリレプリカを保持するローカルバケットの集合を判断します。単一の tablet に書き込まれたデータ量がしきい値（デフォルトで 200 MB）を超えると、書き込み先をローカルバケット間で切り替えます。これにより、ランダムにバケット分割された（`DISTRIBUTED BY RANDOM`）テーブルのデータロード時のメモリ負荷が下がり、スループットが向上します。すべてのデータロード方法に共通して適用されます。

この機能は、BE の設定 `enable_table_memtable_flush_backpressure` と `table_memtable_flush_pending_count_limit` による制約も受けます。[BE の設定](./be-config) を参照してください。

#### `enable_forward_group_commit_stream_load_to_follower` {#enable_forward_group_commit_stream_load_to_follower}

デフォルト：false

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

バージョン 4.1.4 で追加されました。Group Commit を使用する Stream Load リクエストを Follower FE に転送するかどうかを指定します。

有効にすると、Group Commit モードの Stream Load リクエストがラウンドロビン方式で Follower FE に転送され、バッチ処理の負荷が複数の FE に分散されます。

対象テーブルの `light_schema_change` プロパティが `false` の場合、転送はサポートされず、リクエストはエラーになります。

#### `streaming_job_snapshot_offset_persist_interval_sec` {#streaming_job_snapshot_offset_persist_interval_sec}

デフォルト：300 (s)

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

バージョン 4.1.4 で追加されました。Streaming Job（継続的なデータロードジョブ）のフルスナップショット段階で、オフセットを永続化する処理の最小間隔を秒単位で指定します。値を小さくすると、ジョブ再起動後に再生するデータ量は減りますが、メタデータの書き込み頻度が増えます。

#### `label_keep_max_second` {#label_keep_max_second}

デフォルト：`3 * 24 * 3600`  (3 day)

IsMutable：true

MasterOnly：true

完了またはキャンセルされたデータロードジョブのラベルは、`label_keep_max_second` の経過後に削除されます。

1. 削除されたラベルは再利用できます。
2. この時間を短くすると FE のメモリ使用量を減らせます。（削除されるまで、すべてのデータロードジョブの情報がメモリに保持されるためです。）

書き込みの同時実行数が高く、ジョブが大量に滞留して frontend service の呼び出しに失敗する場合は、ログを確認してください。メタデータの書き込みでロックの取得に時間がかかりすぎる場合は、この値を 12 時間または 6 時間以下に調整できます。

#### `streaming_label_keep_max_second` {#streaming_label_keep_max_second}

デフォルト：43200 (12 hour)

IsMutable：true

MasterOnly：true

INSERT、STREAMING LOAD、ROUTINE_LOAD_TASK など、高頻度のデータロード処理に適用されます。期限が切れると、完了したジョブまたはタスクが削除されます。

#### `label_clean_interval_second` {#label_clean_interval_second}

デフォルト：1 * 3600  (1 hour)

データロードのラベルを消去する処理は、*label_clean_interval_second* ごとに実行され、期限切れのジョブを削除します。

#### `label_regex_length` {#label_regex_length}

デフォルト値：128（文字）

データロードのラベルの最大文字数です。デフォルトは 128 文字です。

#### `transaction_clean_interval_second` {#transaction_clean_interval_second}

デフォルト：30

トランザクションが可視または中止済みの場合、transaction_clean_interval_second 秒後に消去されます。この間隔はできるだけ短くし、各消去処理もできるだけ速く完了させる必要があります。

#### `sync_commit_interval_second` {#sync_commit_interval_second}

トランザクションをコミットするまでの最大時間間隔です。この時間を過ぎてもチャネルに未送信のデータが残っている場合、コンシューマーはチャネルにトランザクションのコミットを通知します。

デフォルト：10（秒）

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

#### `sync_checker_interval_second` {#sync_checker_interval_second}

データ同期ジョブの実行状態を確認します。

デフォルト：10 (s)

#### `max_sync_task_threads_num` {#max_sync_task_threads_num}

データ同期ジョブのスレッドプールの最大スレッド数です。

デフォルト値：10

#### `min_sync_commit_size` {#min_sync_commit_size}

トランザクションのコミットに必要なイベントの最小数です。FE が受信したイベント数がこの値より少ない場合、`sync_commit_interval_second` を超えるまで次のデータバッチを待ち続けます。デフォルト値は 10000 イベントです。この設定を変更する場合は、canal 側の `canal.instance.memory.buffer.size`（デフォルト 16384）より小さくしてください。そうしないと、FE は ack の前にストアのキュー長を超えるイベントを取得しようとし、タイムアウトまでストアキューがブロックされます。

デフォルト：10000

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

#### `min_bytes_sync_commit` {#min_bytes_sync_commit}

トランザクションのコミットに必要な最小データサイズです。FE が受信したデータサイズがこの値より小さい場合、`sync_commit_interval_second` を超えるまで次のデータバッチを待ち続けます。デフォルト値は 15MB です。この設定を変更する場合は、canal 側の `canal.instance.memory.buffer.size` と `canal.instance.memory.buffer.memunit` の積（デフォルト 16MB）より小さくしてください。そうしないと、FE は ack の前にストア領域より大きなデータを取得しようとし、タイムアウトまでストアキューがブロックされます。

デフォルト：`15*1024*1024` (15M)

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

#### `max_bytes_sync_commit` {#max_bytes_sync_commit}

データ同期ジョブのスレッドプールの最大スレッド数です。FE 全体でスレッドプールは 1 つだけで、FE から BE にデータを送るすべてのデータ同期タスクの処理に使用されます。スレッドプールは `SyncTaskPool` クラスで実装されています。

デフォルト：10

動的な設定が可能か：false

Master FE ノード固有の設定項目か：false

#### `enable_outfile_to_local` {#enable_outfile_to_local}

デフォルト：false

outfile 機能で結果をローカルディスクにエクスポートすることを許可するかどうかを指定します。

#### `export_tablet_num_per_task` {#export_tablet_num_per_task}

デフォルト：5

IsMutable：true

MasterOnly：true

エクスポート用クエリプランごとの tablet 数です。

#### `export_task_default_timeout_second` {#export_task_default_timeout_second}

デフォルト：2 * 3600   (2 hour)

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

MasterOnly: false

Stream Load のプロファイルを有効にするかどうかを指定します。

### ログ {#log}

#### `log_roll_size_mb` {#log_roll_size_mb}

デフォルト：1024  （1G）

システムログと監査ログの単一ファイルの最大サイズです。

#### `sys_log_dir` {#sys_log_dir}

デフォルト：DorisFE.DORIS_HOME_DIR + "/log"

FE ログのディレクトリを指定します。FE は次の 2 つのログファイルを生成します。

fe.log:      FE プロセスのすべてのログ。
fe.warn.log  FE プロセスのすべての WARNING と ERROR のログ。

#### `sys_log_level` {#sys_log_level}

デフォルト：INFO

ログレベル：INFO, WARN, ERROR, FATAL

#### `sys_log_roll_num` {#sys_log_roll_num}

デフォルト：10

sys_log_roll_interval 内に保持する FE ログファイルの最大数です。デフォルトは 10 で、1 日に保持されるログファイルは最大 10 個です。

#### `sys_log_verbose_modules` {#sys_log_verbose_modules}

デフォルト：{}

詳細ログを出力するモジュールです。VERBOSE レベルは log4j の DEBUG レベルで実装されています。

例：
   sys_log_verbose_modules = org.apache.doris.catalog
   この場合、org.apache.doris.catalog パッケージとそのすべてのサブパッケージにあるファイルのデバッグログだけを出力します。

#### `sys_log_roll_interval` {#sys_log_roll_interval}

デフォルト：DAY

sys_log_roll_interval:

* DAY:  ログのサフィックスは yyyyMMdd
* HOUR: ログのサフィックスは yyyyMMddHH

#### `sys_log_delete_age` {#sys_log_delete_age}

デフォルト：7d

デフォルトは 7 日です。ログの最終更新から 7 日経過すると削除されます。

使用できる形式：

* 7d      7 日
* 10h     10 時間
* 60m     60 分
* 120s    120 秒

#### `sys_log_roll_mode` {#sys_log_roll_mode}

デフォルト：SIZE-MB-1024

ログを分割するサイズです。1 G ごとにログファイルを分割します。

#### `sys_log_enable_compress` {#sys_log_enable_compress}

デフォルト：false

true の場合、fe.log と fe.warn.log を gzip で圧縮します。

#### `audit_log_dir` {#audit_log_dir}

デフォルト：DORIS_HOME_DIR + "/log"

audit_log_dir：
FE の監査ログディレクトリを指定します。
監査ログ fe.audit.log には、ユーザー、ホスト、所要時間、状態などの関連情報とともに、すべてのリクエストが記録されます。

#### `audit_log_roll_num` {#audit_log_roll_num}

デフォルト：90

audit_log_roll_interval 内に保持する FE 監査ログファイルの最大数です。

#### `audit_log_modules` {#audit_log_modules}

デフォルト：{"slow_query", "query", "load", "stream_load"}

Slow query には、所要時間が *qe_slow_log_ms* を超えるすべてのクエリが含まれます。

#### `qe_slow_log_ms` {#qe_slow_log_ms}

デフォルト：5000 (5 seconds)

クエリの応答時間がこのしきい値を超えると、slow_query として監査ログに記録されます。

#### `audit_log_roll_interval` {#audit_log_roll_interval}

デフォルト：DAY

DAY:  ログのサフィックスは yyyyMMdd
HOUR: ログのサフィックスは yyyyMMddHH

#### `audit_log_delete_age` {#audit_log_delete_age}

デフォルト：30d

デフォルトは 30 日です。ログの最終更新から 30 日経過すると削除されます。

使用できる形式：
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

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

新しい転置インデックスのデフォルト保存形式です。バージョン 4.1.5 以降、V1 形式の転置インデックスの作成と、この設定を動的に `V1` にすることは禁止されています。`fe.conf` または `fe_custom.conf` で有効な値が `V1` の場合、FE は起動しません。アップグレード前に `V2` または `V3` に変更してください。既存の V1 テーブルは引き続き読み取れますが、新しい転置インデックスを追加することはできません。新しいインデックスが必要な場合は、V2 または V3 形式でテーブルを再作成してください。

#### `min_replication_num_per_tablet` {#min_replication_num_per_tablet}

デフォルト：1

tablet ごとのレプリカの最小数を設定します。

#### `max_replication_num_per_tablet` {#max_replication_num_per_tablet}

デフォルト：32767

tablet ごとのレプリカの最大数を設定します。

#### `default_db_data_quota_bytes` {#default_db_data_quota_bytes}

デフォルト：8192PB

IsMutable：true

MasterOnly：true

データベースのデータクォータのデフォルトサイズを設定します。個別のデータベースのクォータは、次のように設定できます。

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

データベースのレプリカクォータのデフォルト値を設定します。個別のデータベースのクォータは、次のように設定できます。

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

コードの不具合や操作ミスなど、非常に特殊な状況では、ある tablet のすべてのレプリカが失われる可能性があります。この場合、データは実質的に失われています。それでも、データが失われた場合にクエリがエラーを返さず、ユーザーへの影響を抑えたい場合があります。その際は、空の Tablet で失われたレプリカを補い、クエリを正常に実行できるようにします。

true にすると、すべてのレプリカが破損または消失した tablet を、Doris が空のレプリカで自動的に補います。

#### `min_clone_task_timeout_sec` `And max_clone_task_timeout_sec` {#min_clone_task_timeout_sec-and-max_clone_task_timeout_sec}

デフォルト：最小 3 分、最大 2 時間

IsMutable：true

MasterOnly：true

`mix_clone_task_timeout_sec` と組み合わせて、クローンタスクのタイムアウトの上限と下限を制御できます。通常、クローンタスクのタイムアウトはデータ量と最小転送速度（5MB/s）から見積もられます。特殊な場合は、これらの設定で上限と下限を指定し、クローンタスクが正常に完了できるようにします。

#### `disable_storage_medium_check` {#disable_storage_medium_check}

デフォルト：false

IsMutable：true

MasterOnly：true

disable_storage_medium_check が true の場合、ReportHandler は tablet のストレージ媒体を確認せず、ストレージのクールダウン機能が無効になります。デフォルトは false です。tablet のストレージ媒体を区別する必要がなければ、true に設定できます。

#### `decommission_tablet_check_threshold` {#decommission_tablet_check_threshold}

デフォルト：5000

IsMutable：true

MasterOnly：true

廃止対象の BE 上にある tablet の状態を Master FE が確認するかどうかを制御します。廃止対象 BE 上の tablet 数がこのしきい値を下回ると、FE は定期的な確認を開始します。その BE 上のすべての tablet が回収されていれば、FE は BE をすぐに削除します。

性能を考慮し、この設定を極端に大きくしないでください。

#### `partition_rebalance_max_moves_num_per_selection` {#partition_rebalance_max_moves_num_per_selection}

デフォルト：10

IsMutable：true

MasterOnly：true

PartitionRebalancer を使用する場合にのみ有効です。

#### `partition_rebalance_move_expire_after_access` {#partition_rebalance_move_expire_after_access}

デフォルト：600   (s)

IsMutable：true

MasterOnly：true

PartitionRebalancer を使用する場合にのみ有効です。変更すると、キャッシュされた移動情報は消去されます。

#### `tablet_rebalancer_type` {#tablet_rebalancer_type}

デフォルト：BeLoad

MasterOnly：true

Rebalancer の種類です（大文字と小文字は区別されません）：BeLoad、Partition。値を解析できない場合は、デフォルトの BeLoad を使用します。

#### `max_balancing_tablets` {#max_balancing_tablets}

デフォルト：100

IsMutable：true

MasterOnly：true

TabletScheduler でバランス調整中の tablet 数が max_balancing_tablets を超えると、新たなバランス確認は行いません。

#### `max_scheduling_tablets` {#max_scheduling_tablets}

デフォルト：2000

IsMutable：true

MasterOnly：true

TabletScheduler でスケジュール済みの tablet 数が max_scheduling_tablets を超えると、確認をスキップします。

#### `disable_balance` {#disable_balance}

デフォルト：false

IsMutable：true

MasterOnly：true

true にすると、TabletScheduler はバランス調整を行いません。

#### `disable_disk_balance` {#disable_disk_balance}

デフォルト：true

IsMutable：true

MasterOnly：true

true にすると、TabletScheduler はディスク間のバランス調整を行いません。

#### `balance_load_score_threshold` {#balance_load_score_threshold}

デフォルト：0.1 (10%)

IsMutable：true

MasterOnly：true

クラスターの負荷スコアのバランスを判定するしきい値です。BE の負荷スコアが平均より 10% 低い場合は LOW、平均より 10% 高い場合は HIGH と判定されます。

#### `capacity_used_percent_high_water` {#capacity_used_percent_high_water}

デフォルト：0.75  (75%)

IsMutable：true

MasterOnly：true

ディスク容量の使用率の高水位です。BE の負荷スコアの計算に使用されます。

#### `clone_distribution_balance_threshold` {#clone_distribution_balance_threshold}

デフォルト：0.2

IsMutable：true

MasterOnly：true

BE 間のレプリカ数のバランスを判定するしきい値です。

#### `clone_capacity_balance_threshold` {#clone_capacity_balance_threshold}

デフォルト：0.2

IsMutable：true

MasterOnly：true

* BE のデータサイズのバランスを判定するしきい値です。

   バランス調整アルゴリズムは次のとおりです。

     1. クラスター全体の平均使用容量（AUC）を計算します。（総データサイズ / 総 BE 数）

     2. 高水位を (AUC * (1 + clone_capacity_balance_threshold)) とします。

     3. 低水位を (AUC * (1 - clone_capacity_balance_threshold)) とします。

     4. Clone checker は、高水位の BE から低水位の BE へレプリカを移動しようとします。

#### `disable_colocate_balance` {#disable_colocate_balance}

デフォルト：false

IsMutable：true

MasterOnly：true

true に設定すると、colocate テーブルの自動再配置とバランス調整を無効にできます。'disable_colocate_balance' が true の場合、ColocateTableBalancer は colocate テーブルの再配置やバランス調整を行いません。

**注意**：

1. 通常、バランス調整を無効にする必要はありません。
2. 無効にすると、不安定な colocate テーブルが復旧しない可能性があります。
3. その結果、クエリで colocate プランを使用できなくなる場合があります。

#### `balance_slot_num_per_path` {#balance_slot_num_per_path}

デフォルト：1

IsMutable：true

MasterOnly：true

バランス調整中に各パスで使用するスロットのデフォルト数です。

#### `disable_tablet_scheduler` {#disable_tablet_scheduler}

デフォルト：false

IsMutable：true

MasterOnly：true

true にすると tablet スケジューラーが動作せず、tablet の修復とバランス調整のタスクがすべて停止します。

#### `enable_force_drop_redundant_replica` {#enable_force_drop_redundant_replica}

デフォルト：false

動的な設定が可能か：true

Master FE のみ：true

true にすると、tablet のスケジューリング処理で余分なレプリカを直ちに削除します。対象のレプリカに書き込んでいる一部のデータロードジョブが失敗する可能性がありますが、tablet のバランス調整と修復は速くなります。
クラスター内でバランス調整や修復を待つレプリカが大量にある場合、データロードの一部の成功率を犠牲にして、処理を速めるためにこの設定を試すことができます。

#### `colocate_group_relocate_delay_second` {#colocate_group_relocate_delay_second}

デフォルト：1800

動的な設定が可能か：true

Master FE のみ：true

colocate グループを再配置すると、クラスター内で多数の tablet が移動する可能性があります。そのため、再配置をできるだけ避ける保守的な方法を使用します。
再配置は通常、BE ノードがオフラインになったり停止したりした後に発生します。このパラメータは、BE ノードを利用不可と判定するまでの時間を遅らせます。デフォルトは 30 分で、BE ノードが 30 分以内に回復すれば、colocate グループの再配置は開始されません。

#### `allow_replica_on_same_host` {#allow_replica_on_same_host}

デフォルト：false

動的な設定が可能か：false

Master FE のみ：false

同じ tablet の複数のレプリカを同じホストに配置できるかどうかを指定します。主にローカルテストで、複数の BE を構築してマルチレプリカの状況をテストしやすくするために使用します。テスト以外の環境では使用しないでください。

#### `repair_slow_replica` {#repair_slow_replica}

デフォルト：false

IsMutable：true

MasterOnly: true

true にすると、compaction が遅いレプリカを自動的に検出し、ほかのマシンへ移行します。検出条件は、最も速いレプリカのバージョン数が `min_version_count_indicate_replica_compaction_too_slow` を超え、最も速いレプリカとのバージョン数の差の比率が `valid_version_count_delta_ratio_between_replicas` を超えることです。

#### `min_version_count_indicate_replica_compaction_too_slow` {#min_version_count_indicate_replica_compaction_too_slow}

デフォルト：200

動的な設定が可能か：true

Master FE のみ：false

レプリカの compaction が遅すぎるかどうかを判定するためのバージョン数のしきい値です。

#### `skip_compaction_slower_replica` {#skip_compaction_slower_replica}

デフォルト：true

動的な設定が可能か：true

Master FE のみ：false

true にすると、クエリ可能なレプリカを選択する際に、compaction が遅いレプリカをスキップします。

#### `valid_version_count_delta_ratio_between_replicas` {#valid_version_count_delta_ratio_between_replicas}

デフォルト：0.5

動的な設定が可能か：true

Master FE のみ：true

最も遅いレプリカと最も速いレプリカのバージョン数の差を判定する比率のしきい値です。`repair_slow_replica` が true の場合、最も遅いレプリカを修復するかどうかの判定に使用します。

#### `min_bytes_indicate_replica_too_large` {#min_bytes_indicate_replica_too_large}

デフォルト：`2 * 1024 * 1024 * 1024` (2G)

動的な設定が可能か：true

Master FE のみ：true

レプリカが大きすぎるかどうかを判定するデータサイズのしきい値です。

#### `schedule_slot_num_per_hdd_path` {#schedule_slot_num_per_hdd_path}

デフォルト：4

HDD の tablet スケジューラーでパスごとに使用するデフォルトのスロット数です。この設定を削除し、クローンタスクの統計に基づいて動的に調整します。

#### `schedule_slot_num_per_ssd_path` {#schedule_slot_num_per_ssd_path}

デフォルト：8

SSD の tablet スケジューラーでパスごとに使用するデフォルトのスロット数です。この設定を削除し、クローンタスクの統計に基づいて動的に調整します。

#### `tablet_repair_delay_factor_second` {#tablet_repair_delay_factor_second}

デフォルト：60 （s）

IsMutable：true

MasterOnly：true

tablet の修復を決定するまでの遅延時間の係数です。

* 優先度が VERY_HIGH の場合、直ちに修復します。
* HIGH の場合、tablet_repair_delay_factor_second * 1 遅らせます。
* NORMAL の場合、tablet_repair_delay_factor_second * 2 遅らせます。
* LOW の場合、tablet_repair_delay_factor_second * 3 遅らせます。

#### `tablet_stat_update_interval_second` {#tablet_stat_update_interval_second}

デフォルト：300（5min）

tablet の統計情報を更新する間隔です。
すべての FE が、この間隔ごとにすべての BE から tablet の統計情報を取得します。

#### `storage_flood_stage_usage_percent` {#storage_flood_stage_usage_percent}

デフォルト：95 （95%）

IsMutable：true

MasterOnly：true

##### `storage_flood_stage_left_capacity_bytes` {#storage_flood_stage_left_capacity_bytes}

デフォルト：`1 * 1024 * 1024 * 1024` (1GB)

IsMutable：true

MasterOnly：true

ディスク容量が 'storage_flood_stage_usage_percent' と 'storage_flood_stage_left_capacity_bytes' の両方の条件に達すると、次の操作が拒否されます。

1. データロードジョブ
2. リストアジョブ

#### `storage_high_watermark_usage_percent` {#storage_high_watermark_usage_percent}

デフォルト：85  (85%)

IsMutable：true

MasterOnly：true

#### `storage_min_left_capacity_bytes` {#storage_min_left_capacity_bytes}

デフォルト： `2 * 1024 * 1024 * 1024`  (2GB)

IsMutable：true

MasterOnly：true

'storage_high_watermark_usage_percent' は BE のストレージパスの最大使用率を制限します。'storage_min_left_capacity_bytes' は BE のストレージパスに残す最小空き容量を制限します。両方の制限に達した場合、そのパスを tablet のバランス調整先に選択できません。ただし、tablet の復旧ではデータの完全性をできるだけ保つため、これらの制限を超える場合があります。

#### `catalog_trash_expire_second` {#catalog_trash_expire_second}

デフォルト：86400L (1 day)

IsMutable：true

MasterOnly：true

データベース（テーブルやパーティション）を削除した後は、RECOVER 文で復元できます。この設定はデータの最大保持時間を指定します。期限が過ぎると、データは完全に削除されます。

#### `default_storage_medium` {#default_storage_medium}

デフォルト：HDD

テーブル（またはパーティション）の作成時には、ストレージ媒体（HDD または SSD）を指定できます。指定しなかった場合は、この設定がデフォルトの媒体になります。

#### `default_compression_type` {#default_compression_type}

デフォルト：LZ4F（4.0.3 より前）、ZSTD（4.0.3 以降）

テーブルの作成時には圧縮アルゴリズムを指定できます。指定しなかった場合は、この設定がデフォルトの圧縮方式になります。指定できる値は LZ4、LZ4F、LZ4HC、ZLIB、ZSTD、SNAPPY、NONE で、大文字と小文字は区別されません。

#### `enable_storage_policy` {#enable_storage_policy}

* Storage Policy 機能を有効にするかどうかを指定します。この設定により、ホットデータとコールドデータを分離できます。
デフォルト：false

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

#### `check_consistency_default_timeout_second` {#check_consistency_default_timeout_second}

デフォルト：600 (10 minutes)

IsMutable：true

MasterOnly：true

単一の整合性確認タスクのデフォルトタイムアウトです。tablet のサイズに合わせて十分長く設定してください。

#### `consistency_check_start_time` {#consistency_check_start_time}

デフォルト：23

IsMutable：true

MasterOnly：true

整合性確認の開始時刻です。

整合性チェッカーは *consistency_check_start_time* から *consistency_check_end_time* まで動作します。

両方の時刻が同じ場合、整合性確認は開始されません。

#### `consistency_check_end_time` {#consistency_check_end_time}

デフォルト：23

IsMutable：true

MasterOnly：true

整合性確認の終了時刻です。

整合性チェッカーは *consistency_check_start_time* から *consistency_check_end_time* まで動作します。

両方の時刻が同じ場合、整合性確認は開始されません。

#### `replica_delay_recovery_second` {#replica_delay_recovery_second}

デフォルト：0

IsMutable：true

MasterOnly：true

レプリカの障害発生から、FE がクローンによる復旧を試みるまでの最小遅延時間です。

#### `tablet_create_timeout_second` {#tablet_create_timeout_second}

デフォルト：1（s）

IsMutable：true

MasterOnly：true

単一のレプリカの作成に対する最大待機時間です。

例：
   tablet が #m 個あり、各 tablet に #n 個のレプリカを持つテーブルを作成する場合、
   テーブル作成リクエストはタイムアウトまで最大 (m *n* tablet_create_timeout_second) 実行されます。

#### `tablet_delete_timeout_second` {#tablet_delete_timeout_second}

デフォルト：2

IsMutable：true

MasterOnly：true

*tablet_create_timeout_second* と同じ意味ですが、tablet の削除時に使用します。

#### `delete_job_max_timeout_second` {#delete_job_max_timeout_second}

デフォルト：300(s)

Mutable: true

Master only: true

削除ジョブの最大タイムアウトを秒単位で指定します。

#### `alter_table_timeout_second` {#alter_table_timeout_second}

デフォルト：86400 * 30 (1 month)

IsMutable：true

MasterOnly：true

ALTER TABLE リクエストの最大タイムアウトです。テーブルのデータサイズに合わせて十分長く設定してください。

#### `max_replica_count_when_schema_change` {#max_replica_count_when_schema_change}

OlapTable がスキーマ変更を行う際に許可するレプリカの最大数です。レプリカが多すぎると FE で OOM が発生します。

デフォルト：100000

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

#### `history_job_keep_max_second` {#history_job_keep_max_second}

デフォルト：`7 * 24 * 3600` （7 day）

IsMutable：true

MasterOnly：true

スキーマ変更ジョブや Rollup ジョブなど、特定の種類のジョブを保持する最大時間です。

#### `max_create_table_timeout_second` {#max_create_table_timeout_second}

デフォルト：60 （s）

IsMutable：true

MasterOnly：true

テーブル（インデックス）の作成で長時間待たないように、最大タイムアウトを設定します。

#### `autobucket_min_buckets` {#autobucket_min_buckets}

デフォルト：3（4.0.8 / 4.1.4 より前は 1）

IsMutable: true

MasterOnly: true

自動バケット分割（`DISTRIBUTED BY ... BUCKETS AUTO`）で作成されるバケットの最小数です。

**Doris 4.0 系のバージョン 4.0.8 と 4.1 系のバージョン 4.1.4 以降、デフォルト値が `1` から `3` に変更されました。** 以前のデフォルトでは小さなパーティションが単一バケットになり、並列性とデータ分散が不十分でした。変更後、自動バケット分割で作成されるバケットは少なくとも 3 個になります。この変更は新しく作成するパーティションにのみ影響し、既存のパーティションのバケット数は変わりません。

#### `autobucket_max_buckets` {#autobucket_max_buckets}

デフォルト：128

IsMutable: true

MasterOnly: true

自動バケット分割で作成されるバケットの最大数です。計算結果がこの値を超える場合は、この値が上限になります。

### 外部テーブル {#external-table}

#### `jdbc_driver_url_white_list` {#jdbc_driver_url_white_list}

デフォルト：empty

動的な設定が可能か：false

JDBC catalog の作成時に許可する `driver_url` 値の許可リストです。複数の値はカンマで区切ります。例：`jdbc_driver_url_white_list=a,b,c`。空の値は、許可リストが設定されていないことを意味します。

:::caution 動作変更（4.1.4）

セキュリティ上の理由により、バージョン 4.1.4 以降、この設定項目は**動的に変更できません**。`fe.conf` でのみ設定でき、FE の再起動後に有効になります。`ADMIN SET FRONTEND CONFIG` では変更できません。

:::

#### `force_sqlserver_jdbc_encrypt_false` {#force_sqlserver_jdbc_encrypt_false}

デフォルト：false

動的な設定が可能か：false

SQLServer JDBC catalog の `encrypt` パラメータを強制的に `false` にするかどうかを指定します。

:::caution 動作変更（4.1.4）

この設定は SQLServer JDBC の通信の暗号化を無効にするため、セキュリティに関わるスイッチです。バージョン 4.1.4 以降は**動的に変更できません**。`fe.conf` でのみ設定でき、FE の再起動後に有効になります。

:::

#### `file_scan_node_split_num` {#file_scan_node_split_num}

デフォルト：128

IsMutable：true

MasterOnly：false

複数の catalog でファイルを同時スキャンするスレッド数です。

#### `file_scan_node_split_size` {#file_scan_node_split_size}

デフォルト：`256 * 1024 * 1024`

IsMutable：true

MasterOnly：false

複数の catalog で同時にファイルをスキャンする際のサイズです。

#### `enable_odbc_mysql_broker_table` {#enable_odbc_mysql_broker_table}

デフォルト：false

IsMutable：true

MasterOnly：false

バージョン 2.1 以降、ODBC、JDBC、Broker の外部テーブルの作成はサポートされません。ODBC と MySQL の外部テーブルには JDBC テーブルまたは JDBC catalog を使用してください。Broker テーブルにはテーブル値関数を使用してください。

#### `max_hive_partition_cache_num` {#max_hive_partition_cache_num}

Hive パーティション用キャッシュの最大数です。

デフォルト：100000

動的な設定が可能か：false

Master FE ノード固有の設定項目か：false

#### `hive_metastore_client_timeout_second` {#hive_metastore_client_timeout_second}

Hive Metastore への接続のデフォルトタイムアウトです。

デフォルト：10

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

#### `max_external_cache_loader_thread_pool_size` {#max_external_cache_loader_thread_pool_size}

外部メタデータキャッシュをロードするスレッドプールの最大サイズです。

デフォルト：10

動的な設定が可能か：false

Master FE ノード固有の設定項目か：false

#### `max_external_file_cache_num` {#max_external_file_cache_num}

外部テーブルに使用するファイルキャッシュの最大数です。

デフォルト：100000

動的な設定が可能か：false

Master FE ノード固有の設定項目か：false

#### `max_external_schema_cache_num` {#max_external_schema_cache_num}

外部テーブルに使用するスキーマキャッシュの最大数です。

デフォルト：10000

動的な設定が可能か：false

Master FE ノード固有の設定項目か：false

#### `external_cache_expire_time_minutes_after_access` {#external_cache_expire_time_minutes_after_access}

キャッシュ内のデータが最後のアクセスから何分後に期限切れになるかを設定します。
External Schema Cache と Hive Partition Cache に適用されます。

デフォルト：1440

動的な設定が可能か：false

Master FE ノード固有の設定項目か：false

#### `es_state_sync_interval_second` {#es_state_sync_interval_second}

デフォルト：10

FE は es_state_sync_interval_secs ごとに es API を呼び出し、es インデックスの shard 情報を取得します。

### 外部リソース {#external-resources}

#### `ai_resource_allowed_user` {#ai_resource_allowed_user}

デフォルト：`*`

動的な設定が可能か：false

Master FE ノード固有の設定項目か：false

バージョン 4.1.5 以降でサポートされます。AI Resources を作成できるユーザー ID を制限します。`*` はユーザー ID による制限を追加しませんが、既存の権限確認は引き続き適用されます。それ以外の値は `'user'@'host'` 形式で指定し、現在のユーザー ID と一致する必要があります。変更には FE の再起動が必要です。

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

Yarn 設定ファイルのデフォルトディレクトリです。Yarn コマンドを実行する前に毎回、このパスに設定ファイルがあるか確認し、なければ作成する必要があります。

#### `yarn_client_path` {#yarn_client_path}

デフォルト：DORIS_HOME_DIR + "/lib/yarn-client/hadoop/bin/yarn"

Yarn クライアントのデフォルトパスです。

#### `spark_launcher_log_dir` {#spark_launcher_log_dir}

デフォルト： sys_log_dir + "/spark_launcher_log"

指定した Spark launcher のログディレクトリです。

#### `spark_resource_path` {#spark_resource_path}

デフォルト：none

Spark の依存ファイルのデフォルトパスです。

#### `spark_home_default_dir` {#spark_home_default_dir}

デフォルト：DORIS_HOME_DIR + "/lib/spark2x"

Spark home のデフォルトディレクトリです。

#### `spark_dpp_version` {#spark_dpp_version}

デフォルト：1.0.0

Spark DPP のデフォルトバージョンです。

### その他 {#else}

#### `tmp_dir` {#tmp_dir}

デフォルト：DorisFE.DORIS_HOME_DIR + "/temp_dir"

バックアップやリストアなどの処理の中間結果を保存する一時ディレクトリです。処理が完了すると、このディレクトリ内のファイルは消去されます。

#### `custom_config_dir` {#custom_config_dir}

デフォルト：DorisFE.DORIS_HOME_DIR + "/conf"

カスタム設定ファイルのディレクトリです。

`fe_custom.conf` ファイルの場所を指定します。デフォルトでは `conf/` ディレクトリ内にあります。

デプロイ環境によっては、システムのアップグレード時に `conf/` ディレクトリが上書きされ、ユーザーが変更した設定項目も失われる場合があります。その場合は `fe_custom.conf` を別のディレクトリに保存すると、設定ファイルの上書きを防げます。

#### `plugin_dir` {#plugin_dir}

デフォルト：DORIS_HOME + "/plugins

プラグインのインストール先ディレクトリです。

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

true にすると、メトリクス収集処理がデーモンタイマーとして動作し、一定の間隔でメトリクスを収集します。

#### `report_queue_size` {#report_queue_size}

デフォルト： 100

IsMutable：true

MasterOnly：true

このしきい値は、FE にレポートタスクが大量に滞留して OOM 例外が発生するのを防ぎます。たとえば BE が 100 台、レプリカが千万個ある大規模な Doris クラスターでは、メタデータの変更（パーティションの削除など）後に、tablet レポートの処理に数秒かかる場合があります。各 BE は 1 分ごとに tablet 情報を報告するため、無制限にレポートを受け付けることはできません。tablet レポートの処理速度は今後改善する予定ですが、現時点ではキューサイズが上限を超えるとレポートを破棄します。
   実環境での所要時間の例：
      1. disk report: 0-1 msta
      2. sk report: 0-1 ms
      3. tablet report
      4. 10000 replicas: 200ms

#### `backup_job_default_timeout_ms` {#backup_job_default_timeout_ms}

デフォルト：86400 * 1000  (1 day)

IsMutable：true

MasterOnly：true

バックアップジョブのデフォルトタイムアウトです。

#### `backup_upload_snapshot_batch_size` {#backup_upload_snapshot_batch_size}

デフォルト：10

IsMutable：true

MasterOnly：true

バックアップ時に、アップロードタスクへ割り当てるスナップショットの最大数です。デフォルト値は 10 です。

#### `restore_download_snapshot_batch_size` {#restore_download_snapshot_batch_size}

デフォルト：10

IsMutable：true

MasterOnly：true

リストア時に、ダウンロードタスクへ割り当てるスナップショットの最大数です。デフォルト値は 10 です。

#### `max_backup_restore_job_num_per_db` {#max_backup_restore_job_num_per_db}

デフォルト：10

主に、各データベースに記録されるバックアップとリストアのタスク数を制御します。

#### `max_backup_tablets_per_job` {#max_backup_tablets_per_job}

デフォルト：300000

IsMutable：true

MasterOnly：true

バックアップジョブに含められる tablet の最大数を制御し、メタデータを大量に保存することによる FE の OOM を防ぎます。

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

ODBC、JDBC 外部テーブルのクエリ実行時に、関数を含むフィルター条件を MySQL にプッシュダウンするかどうかを指定します。

#### `jdbc_drivers_dir` {#jdbc_drivers_dir}

デフォルト：`${DORIS_HOME}/jdbc_drivers`;

IsMutable：false

MasterOnly：false

JDBC ドライバーを置くデフォルトディレクトリです。

#### `max_error_tablet_of_broker_load` {#max_error_tablet_of_broker_load}

デフォルト：3;

IsMutable：true

MasterOnly：true

Broker Load で表示するエラーのある tablet の最大数です。

#### `default_db_max_running_txn_num` {#default_db_max_running_txn_num}

デフォルト：-1

IsMutable：true

MasterOnly：true

データベースのトランザクションクォータのデフォルト値を設定します。

デフォルト値の -1 は、`default_db_max_running_txn_num` の代わりに `max_running_txn_num_per_db` を使用することを意味します。

個別のデータベースのクォータは、次のように設定できます。

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

true にすると、外部テーブルのクエリを優先的に compute ノードへ割り当てます。compute ノードの最大数は `min_backend_num_for_external_table` で制御されます。
false の場合、外部テーブルのクエリは任意のノードに割り当てられます。

#### `min_backend_num_for_external_table` {#min_backend_num_for_external_table}

デフォルト：3

IsMutable：true

MasterOnly：false

`prefer_compute_node_for_external_table` が true の場合にのみ有効です。compute ノード数がこの値より少ない場合、外部テーブルのクエリには mix ノードも割り当て、ノードの合計数がこの値に達するようにします。
compute ノード数がこの値を超える場合、外部テーブルのクエリは compute ノードにのみ割り当てられます。

#### `infodb_support_ext_catalog` {#infodb_support_ext_catalog}

デフォルト：false

IsMutable: true

MasterOnly: false

false の場合、information_schema データベース内のテーブルを SELECT した結果には、外部 catalog のテーブル情報が含まれません。
これにより、外部 catalog に接続できない場合にクエリが長時間かかることを防ぎます。

#### `enable_query_hit_stats` {#enable_query_hit_stats}

デフォルト：false

IsMutable: true

MasterOnly: false

クエリヒットの統計を有効にするかどうかを制御します。デフォルトは false です。

#### `div_precision_increment` {#div_precision_increment}

デフォルト：4

`/` 演算子による除算結果の小数部の桁数を、何桁増やすかを示す変数です。

#### `enable_convert_light_weight_schema_change` {#enable_convert_light_weight_schema_change}

デフォルト：true

一時的な設定項目です。有効にすると、バックグラウンドスレッドが起動し、すべての OLAP テーブルを軽量スキーマ変更に対応するよう自動的に変更します。変更結果は `show convert_light_schema_change [from db]` コマンドで確認でき、軽量スキーマ変更に未対応だったすべてのテーブルの変換結果が表示されます。

#### `disable_local_deploy_manager_drop_node` {#disable_local_deploy_manager_drop_node}

デフォルト：true

cluster.info ファイルの誤りによってノードが削除されないよう、LocalDeployManager によるノードの削除を禁止します。

#### `mysqldb_replace_name` {#mysqldb_replace_name}

デフォルト：mysql

MySQL エコシステムとの互換性を保つため、Doris には mysql という組み込みデータベースがあります。この名前がユーザー自身のデータベースと衝突する場合は、この項目を変更し、Doris 組み込みの MySQL データベースに別の名前を指定してください。

#### `max_auto_partition_num` {#max_auto_partition_num}

デフォルト値：2000

自動パーティション分割されたテーブルで、ユーザーが誤って大量のパーティションを作成するのを防ぐため、OLAP テーブルごとに許可されるパーティション数を `max_auto_partition_num` で制限します。デフォルトは 2000 です。

#### `profile_manager_gc_interval_seconds` {#profile_manager_gc_interval_seconds}

デフォルト値：1

ProfileManager がプロファイルのガベージコレクションを行う間隔を制御します。ガベージコレクションでは、過剰または期限切れのプロファイルをメモリとディスクから削除し、メモリを節約します。

### コンピュートとストレージの分離モード {#compute-and-storage-disaggregated-mode}

#### `cloud_edit_log_roll_interval_second` {#cloud_edit_log_roll_interval_second}

デフォルト：3600（秒）

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

バージョン 4.1.5 以降でサポートされます。コンピュートとストレージの分離モードで、メタデータの書き込みが少ない場合でも定期的なチェックポイントを進めるため、時間に基づいて Edit Log をロールする間隔です。間隔はログエントリの追加時に確認されます。新しいエントリがないときにロールを強制する独立したタイマーはありません。正でない値にすると、時間に基づくロールは無効になります。ログエントリ数に基づくロールは引き続き有効です。

#### `cloud_version_syncer_interval_second` {#cloud_version_syncer_interval_second}

デフォルト：60（秒、4.1.5 より前は 20）

動的な設定が可能か：false

Master FE ノード固有の設定項目か：false

コンピュートとストレージの分離モードで、すべての FE がバックグラウンドでテーブルとパーティションのバージョンを同期する間隔です。バックグラウンド同期には `cloud_enable_version_syncer=true` と、少なくとも 1 つのグローバルまたはデフォルトのテーブルもしくはパーティションのバージョンキャッシュ TTL を `Long.MAX_VALUE` に設定することが必要です。有限の TTL を持つキャッシュは、読み取り時に遅延更新されます。バージョン 4.1.5 では、Meta Service へのリクエストを減らすため、デフォルトの間隔が 20 秒から 60 秒に引き上げられました。変更には FE の再起動が必要です。

#### `cloud_get_version_task_batch_size` {#cloud_get_version_task_batch_size}

デフォルト：200（4.1.5 より前は 2000）

動的な設定が可能か：true

Master FE ノード固有の設定項目か：false

コンピュートとストレージの分離モードでのバージョン同期時に、1 回の Get Version バッチに含めるテーブルまたはパーティションの最大数です。バージョン 4.1.5 ではリクエストサイズを減らすため、デフォルトが 2000 から 200 に引き下げられました。

#### `cloud_version_syncer_get_version_retry_times` {#cloud_version_syncer_get_version_retry_times}

デフォルト：3

動的な設定が可能か：true

Master FE ノード固有の設定項目か：false

バージョン 4.1.5 以降でサポートされます。コンピュートとストレージの分離モードで、バックグラウンド同期中にテーブルまたはパーティションのバージョンを取得する最大試行回数です。最初のリクエストも含みます。デフォルトで許可される試行は合計 3 回であり、最初のリクエスト後の再試行が 3 回という意味ではありません。この設定は、フォアグラウンドのクエリに適用される Meta Service RPC の再試行設定とは独立しています。

#### `cloud_warm_up_job_scheduler_interval_millisecond` {#cloud_warm_up_job_scheduler_interval_millisecond}

デフォルト：1000（ミリ秒）

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

キャッシュのウォームアップジョブをスケジュールする間隔です。バージョン 4.1.5 以降、動的に変更する値は `0` より大きい必要があります。そうでない場合は `cloud_warm_up_job_scheduler_interval_millisecond must be greater than 0` が返されます。

#### `max_active_cloud_warm_up_job` {#max_active_cloud_warm_up_job}

デフォルト：10

動的な設定が可能か：true

Master FE ノード固有の設定項目か：true

同時にスケジュールするキャッシュのウォームアップジョブ数です。バージョン 4.1.5 以降は、動的に変更するとウォームアップ用 executor のサイズも変更されます。正でない値にすると、新しいウォームアップ処理のスケジューリングは一時停止します。

#### `cluster_id` {#cluster_id-1}

デフォルト：-1

同じ cluster id を持つノード（FE または BE）は、同じ Doris クラスターに属すると見なされます。コンピュートとストレージの分離モードでは、ランダムな整数を指定してください。

#### `deploy_mode` {#deploy_mode}

デフォルト：""

説明：FE の動作モードです。`cloud` はストレージとコンピュートの分離モードを示します。

#### `meta_service_endpoint` {#meta_service_endpoint}

デフォルト：""

Meta Service のエンドポイントを 'host1:port,host2:port' 形式で指定します。ストレージとコンピュートの分離モードでは必須の設定です。

#### `enable_group_commit_streamload_be_forward` {#enable_group_commit_streamload_be_forward}

デフォルト：false

IsMutable: true

コンピュートとストレージの分離モードで、Group Commit 用の Stream Load BE 転送を有効にするかどうかを指定します。分離モードで、リクエストが Group Commit を使用する場合にのみ有効です。

有効にすると、FE は Stream Load リクエストを `_stream_load_forward` エンドポイントへリダイレクトし、受信した BE がそのテーブルの対象 BE へ転送します。これにより、ロードバランサーが同じテーブルの Group Commit バッチを分散させることを防ぎます。

同名の設定を FE と BE の両方で有効にする必要があります。**Doris 4.0 系のバージョン 4.0.8 と 4.1 系のバージョン 4.1.4 以降、BE 側の `_stream_load_forward` エンドポイントは BE の設定で制御されます。無効な場合は `403 Forbidden` を返し、有効な場合でもリクエストには認証とグローバルな `LOAD` 権限が必要です。** [Group Commit](../../data-operate/import/load-best-practices/group-commit-manual) と [BE の設定](./be-config) を参照してください。

#### `default_get_version_from_ms_timeout_second` {#default_get_version_from_ms_timeout_second}

デフォルト：30 (s)

動的な設定が可能か：false

FE が Meta Service からバージョンを取得する際のタイムアウトです。

:::caution 動作変更（4.1.4）

バージョン 4.1.4 で、デフォルト値が `3` 秒から `30` 秒に変更されました。以前は Meta Service の応答が不安定な場合や負荷が高い場合に、3 秒のタイムアウトによってクエリがすぐに失敗することがありました。値を大きくすることで、こうした散発的な失敗を大幅に減らせます。

:::

#### `enable_cloud_replica_stale_route_clean` {#enable_cloud_replica_stale_route_clean}

デフォルト：true

動的な設定が可能か：true

バージョン 4.1.4 で追加されました。メタデータ image の読み込み時と tablet のバランス調整処理中に、存在しなくなった BE を指す CloudReplica のプライマリおよびセカンダリのルートレコードを消去するかどうかを指定します。

このような古いレコードはクエリ時にはすでに無視され（レプリカは再び BE にハッシュで割り当てられます）、FE のメモリとメタデータ image のサイズを浪費するだけです。従来どおり消去しない場合は `false` に設定します。

#### `enable_cloud_colocate_consistent_hash` {#enable_cloud_colocate_consistent_hash}

デフォルト：true

動的な設定が可能か：false

Master FE ノード固有の設定項目か：true

バージョン 4.1.4 で追加されました。コンピュートとストレージの分離モードで、colocate テーブルのバケット配置に rendezvous consistent hashing を使用するかどうかを指定します。`false` にすると、従来の剰余に基づく配置に戻ります。この設定は `fe.conf` でのみ指定でき、再起動後に有効になります。

#### `meta_service_rpc_rate_limit_enabled` {#meta_service_rpc_rate_limit_enabled}

デフォルト：true（4.1.5 より前は false）

動的な設定が可能か：true

バージョン 4.1.4 で追加されました。FE から Meta Service への RPC に対して QPS 制限を評価するかどうかを指定します。バージョン 4.1.5 以降は `meta_service_rpc_rate_limit_dry_run` とともにデフォルトで有効です。このため、デフォルトではリクエストを遅延または拒否せず、推定待機時間と推定拒否件数だけを記録します。制限を実際に適用するには、この設定を `true` のままにし、dry-run を `false` にします。

#### `meta_service_rpc_rate_limit_dry_run` {#meta_service_rpc_rate_limit_dry_run}

デフォルト：true

動的な設定が可能か：true

Master FE ノード固有の設定項目か：false

バージョン 4.1.5 以降でサポートされます。`meta_service_rpc_rate_limit_enabled=true` の場合にのみ有効です。`true` の場合は、待機やリクエストの拒否を行わずにレート制限を評価し、メトリクスを記録します。`false` の場合は、設定された QPS、バーストウィンドウ、待機タイムアウトを適用します。dry-run モードの待機メトリクスは推定待機時間を表します。

#### `meta_service_rpc_rate_limit_default_qps_per_core` {#meta_service_rpc_rate_limit_default_qps_per_core}

デフォルト：50

動的な設定が可能か：true

バージョン 4.1.4 で追加されました。`meta_service_rpc_rate_limit_qps_per_core_config` で個別に設定されていない Meta Service RPC メソッドに対して、CPU コアごとに許可するデフォルトの QPS です。`0` 以下の場合はレート制限しません。

#### `meta_service_rpc_rate_limit_qps_per_core_config` {#meta_service_rpc_rate_limit_qps_per_core_config}

デフォルト：`getPartitionVersion:500;getTableVersion:500;getTabletStats:50;beginTxn:50`

動的な設定が可能か：true

バージョン 4.1.4 で追加されました。Meta Service RPC メソッドごとに、コアあたりの QPS 上限を `method1:qps1;method2:qps2` 形式で指定します。`0` 以下の値を指定したメソッドはレート制限されません。

#### `meta_service_rpc_rate_limit_burst_seconds` {#meta_service_rpc_rate_limit_burst_seconds}

デフォルト：2 (s)

動的な設定が可能か：true

バージョン 4.1.4 で追加されました。Meta Service RPC のレート制限で、バーストを許容するウィンドウの長さを秒単位で指定します。長期的な平均 QPS は変わりませんが、このウィンドウ内ではバーストが許可されます。

#### `meta_service_rpc_rate_limit_wait_timeout_ms` {#meta_service_rpc_rate_limit_wait_timeout_ms}

デフォルト：1000 (ms)

動的な設定が可能か：true

バージョン 4.1.4 で追加されました。RPC がレート制限された場合の最大待機時間をミリ秒単位で指定します。`0` は待機しないことを意味し、リクエストはすぐに失敗します。
