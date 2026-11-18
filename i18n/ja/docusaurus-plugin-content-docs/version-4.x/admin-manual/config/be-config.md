---
{
    "title": "BE の設定",
    "language": "ja",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "このドキュメントでは、BE の設定項目について説明します。"
}
---

# BE の設定 {#be-configuration}

このドキュメントでは、BE の設定項目について説明します。

BE の設定ファイル `be.conf` は通常、BE のデプロイ先にある `conf/` ディレクトリに保存されます。バージョン 0.14 では、別の設定ファイル `be_custom.conf` が導入されます。このファイルには、ユーザーが稼働中に動的に設定し、永続化した設定項目が記録されます。

BE プロセスは起動後、まず `be.conf` の設定項目を読み込み、続いて `be_custom.conf` の設定項目を読み込みます。`be_custom.conf` の設定項目は、`be.conf` にある同じ設定項目を上書きします。

`be_custom.conf` ファイルの場所は、`be.conf` の `custom_config_dir` 設定項目で指定できます。

## 設定項目を確認する {#view-configuration-items}

BE の設定項目を確認する方法は 2 つあります。

1. BE の Web ページ

    BE の Web ページにアクセスすると、現在の設定項目を確認できます。

    `http://be_host:be_webserver_port/varz`

2. コマンドで確認する

   MySQL クライアントでは、次のコマンドで BE の設定項目を確認できます。具体的な構文については [SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG) を参照してください。

    `SHOW BACKEND CONFIG;`

    結果の各列の意味は次のとおりです。

    1. BackendId: backend の ID。
    2. Host: backend の IP アドレス。
    3. Key: 設定項目の名前。
    4. Value: 現在の設定項目の値。
    5. Type: 整数や文字列など、設定値の型。
    6. IsMutable: 動的に設定できるかどうか。true の場合、実行時に動的に設定できます。false の場合、`be.conf` でのみ設定でき、BE の再起動後に有効になります。

## 設定項目を設定する {#set-configuration-items}

BE の設定項目を設定する方法は 2 つあります。

1. 静的設定

   `conf/be.conf` ファイルに設定項目を追加し、値を指定します。`be.conf` の設定項目は BE の起動時に読み込まれます。`be.conf` にない設定項目にはデフォルト値が使用されます。

2. 動的設定

   BE の起動後は、次のコマンドで設定項目を動的に変更できます。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}
    ```

   バージョン 0.13 以前では、この方法で変更した設定項目は BE プロセスの再起動後に失効します。バージョン 0.14 以降では、次のコマンドで変更後の設定を永続化できます。変更した設定項目は `be_custom.conf` ファイルに保存されます。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}\&persist=true
    ```

## 例 {#examples}

1. `max_base_compaction_threads` を静的に変更する

   `be.conf` ファイルに次を追加します。

   ```max_base_compaction_threads=5```

   その後、BE プロセスを再起動すると設定が有効になります。

2. `streaming_load_max_mb` を動的に変更する

   BE の起動後、次のコマンドで設定項目 `streaming_load_max_mb` を動的に変更します。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024
    ```

   次の応答は、設定が成功したことを示します。

    ```
    {
        "status": "OK",
        "msg": ""
    }
    ```

   BE を再起動すると、この設定は失効します。変更内容を永続化する場合は、次のコマンドを使用します。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024\&persist=true
    ```

## 設定項目 {#configurations}

### サービス {#services}

#### `deploy_mode` {#deploy_mode}

* 型: string
* 説明: BE の実行モード。`cloud` はストレージとコンピュートを分離するモードを示します。
* デフォルト値: ""

#### `bvar_max_dump_multi_dimension_metric_num` {#bvar_max_dump_multi_dimension_metric_num}

* 型: string
* 説明: バージョン 4.1.5 以降でサポートされます。`/brpc_metrics` からエクスポートされる多次元 bvar メトリクスのサンプル数の上限です。`0` に設定すると、これらのサンプルは無効になります。変更を反映するには BE の再起動が必要です。
* デフォルト値: 5000

#### `be_port` {#be_port}

* 型: int32
* 説明: FE からのリクエストを受信する、BE 上の Thrift サーバーのポートです。
* デフォルト値: 9060

#### `heartbeat_service_port` {#heartbeat_service_port}

* 型: int32
* 説明: FE からのハートビートを受信する、BE 上のハートビートサービスのポート（Thrift）です。
* デフォルト値: 9050

#### `webserver_port` {#webserver_port}

* 型: int32
* 説明: BE 上の HTTP サーバーのサービスポートです。
* デフォルト値: 8040

#### `brpc_port` {#brpc_port}

* 型: int32
* 説明: BE 間の通信に使用する、BE 上の BRPC ポートです。
* デフォルト値: 8060

#### `arrow_flight_sql_port` {#arrow_flight_sql_port}

* 型: int32
* 説明: Arrow Flight Client と BE の通信に使用する、BE 上の Arrow Flight SQL サーバーのポートです。
* デフォルト値: -1

#### `enable_https` {#enable_https}

* 型: bool
* 説明: HTTPS をサポートするかどうかを指定します。有効にする場合は、be.conf で `ssl_certificate_path` と `ssl_private_key_path` を設定します。
* デフォルト値: false

#### `priority_networks` {#priority_networks}

* 説明: 複数の IP アドレスを持つサーバーで使用するアドレスの選択方法を指定します。このリストに一致する IP アドレスは最大 1 つにしてください。10.10.10.0/24 のような CIDR 表記をセミコロンで区切って指定します。一致する IP アドレスがない場合は、ランダムに 1 つ選択されます。
* デフォルト値: 空欄

#### `storage_root_path` {#storage_root_path}

* 型: string

* 説明: データのルートパスです。複数のパスは ';' で区切ります。各ルートパスのストレージ媒体を HDD または SSD として指定できます。また、各ルートパスの末尾に ',' で区切って容量制限を追加できます。SSD と HDD を混在させない場合、以下の例 1 および例 2 の形式で設定する必要はありません。ストレージディレクトリのみを指定すればよく、FE のデフォルトのストレージ媒体設定も変更する必要はありません。

  例 1: `storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD;/home/disk2/doris`

    - 1./home/disk1/doris.HDD は、ストレージ媒体が HDD であることを示します。
    - 2./home/disk2/doris.SSD は、ストレージ媒体が SSD であることを示します。
    - 3./home/disk2/doris は、ストレージ媒体がデフォルトの HDD であることを示します。

  例 2: `storage_root_path=/home/disk1/doris,medium:hdd;/home/disk2/doris,medium:ssd`

    - 1./home/disk1/doris,medium:hdd は、ストレージ媒体が HDD であることを示します。
    - 2./home/disk2/doris,medium:ssd は、ストレージ媒体が SSD であることを示します。

* デフォルト値: ${DORIS_HOME}/storage

#### `heartbeat_service_thread_count` {#heartbeat_service_thread_count}

* 型: int32
* 説明: BE 上のハートビートサービスを実行するスレッド数です。デフォルトは 1 で、変更は推奨されません。
* デフォルト値: 1

#### `ignore_broken_disk` {#ignore_broken_disk}

* 型: bool
* 説明: BE の起動時に、``storage_root_path`` の設定に含まれるすべてのパスを確認します。

    -  `ignore_broken_disk=true`

  パスが存在しない場合、またはパス上のファイルを読み書きできない場合（ディスク障害）は、そのパスを無視します。他に使用可能なパスがあれば、起動は中断されません。

    -  `ignore_broken_disk=false`

  パスが存在しない場合、またはパス上のファイルを読み書きできない場合（ディスク障害）は、起動に失敗して終了します。

* デフォルト値: false

#### `mem_limit` {#mem_limit}

* 型: string
* 説明: BE プロセスが使用するメモリを、サーバーの最大メモリに対する割合で制限します。BE がマシンのメモリを過度に占有しないようにするための設定です。値は 0 より大きくする必要があります。100% を超える値は 100% として扱われます。
* デフォルト値: 90%

#### `cluster_id` {#cluster_id}

* 型: int32
* 説明: BE が所属するクラスター ID を設定します。
    - 通常、この値は FE からハートビートを通じて BE に通知されるため、設定は不要です。BE が特定の Doris クラスターに所属することを確認した場合は設定できます。その際、データディレクトリ内の cluster_id ファイルも変更し、このパラメーターと同じ値にする必要があります。
* デフォルト値: -1

#### `custom_config_dir` {#custom_config_dir}

* 説明: `be_custom.conf` ファイルの場所を指定します。デフォルトでは `conf/` ディレクトリにあります。
    - 一部のデプロイ環境では、システムのアップグレードによって `conf/` ディレクトリが上書きされることがあります。その場合、ユーザーが変更した設定項目も上書きされます。`be_custom.conf` を別のディレクトリに保存すれば、設定ファイルの上書きを防げます。
* デフォルト値: 空欄

#### `trash_file_expire_time_sec` {#trash_file_expire_time_sec}

* 説明: ごみ箱のクリーンアップ間隔は 24 時間です。ディスク容量が不足している場合、trash 内のファイルの保持期間はこのパラメーターに従わないことがあります。
* デフォルト値: 86400

#### `es_http_timeout_ms` {#es_http_timeout_ms}

* 説明: HTTP 経由で ES に接続する際のタイムアウトです。
* デフォルト値: 5000 (ms)

#### `es_scroll_keepalive` {#es_scroll_keepalive}

* 説明: ES scroll の keep-alive 保持時間です。
* デフォルト値: 5 (m)

#### `external_table_connect_timeout_sec` {#external_table_connect_timeout_sec}

* 型: int32
* 説明: ODBC テーブルなどの外部テーブルとの接続を確立する際のタイムアウトです。
* デフォルト値: 5 秒

#### `pipeline_status_report_interval` {#pipeline_status_report_interval}

* 説明: プロファイル報告の間隔です。
* デフォルト値: 5 秒

#### `brpc_max_body_size` {#brpc_max_body_size}

* 説明: 主に brpc の `max_body_size` パラメーターを変更するための設定です。

  - クエリが失敗し、BE ログに `body_size is too large` と表示されることがあります。SQL の実行条件が「multi distinct + group by なし + 1T を超えるデータ」である場合などに発生します。このエラーは、brpc のパケットサイズが設定値を超えたことを示します。設定値を大きくすると回避できます。

#### `brpc_socket_max_unwritten_bytes` {#brpc_socket_max_unwritten_bytes}

* 説明: 主に brpc の `socket_max_unwritten_bytes` パラメーターを変更するための設定です。
  - クエリが失敗し、BE ログに `The server is overcrowded` と表示されることがあります。これは送信側でバッファリングするメッセージが多すぎることを意味し、SQL が大きな bitmap 値を送信する場合などに発生します。設定値を大きくすると回避できます。

#### `transfer_large_data_by_brpc` {#transfer_large_data_by_brpc}

* 型: bool
* 説明: Tuple/Block データの長さが 1.8G を超える場合に、protoBuf リクエストをシリアライズし、Tuple/Block データを controller attachment に埋め込んで HTTP brpc で送信するかどうかを制御します。これにより、protoBuf リクエストの長さが 2G を超えた際のエラー `Bad request, error_text=[E1003]Fail to compress request` を回避します。以前のバージョンでは、Tuple/Block データを attachment に入れた後、デフォルトの baidu_std brpc で送信していましたが、attachment が 2G を超えると切り詰められていました。HTTP brpc での送信には 2G の制限がありません。
* デフォルト値: true

#### `brpc_num_threads` {#brpc_num_threads}

* 説明: 主に brpc の bthreads 数を変更するための設定です。デフォルト値は 256 です。
  - 値を大きくすると QPS の性能が向上する場合があります。詳細は `https://github.com/apache/incubator-brpc/blob/master/docs/cn/benchmark.md` を参照してください。
* デフォルト値: 256

#### `thrift_rpc_timeout_ms` {#thrift_rpc_timeout_ms}

* 説明: Thrift のデフォルトのタイムアウトです。
* デフォルト値: 60000

#### `thrift_client_retry_interval_ms` {#thrift_client_retry_interval_ms}

* 型: int64
* 説明: FE の Thrift サーバーでリクエストが集中する事態を避けるため、BE の Thrift クライアントの再試行間隔を設定します。単位は ms です。
* デフォルト値: 1000

#### `thrift_connect_timeout_seconds` {#thrift_connect_timeout_seconds}

* 説明: Thrift クライアント接続のデフォルトのタイムアウトです。
* デフォルト値: 3 (s)

#### `thrift_server_type_of_fe` {#thrift_server_type_of_fe}

* 型: string
* 説明: FE の Thrift サービスが使用するサービスモデルを指定します。値は文字列で、大文字と小文字は区別されません。FE の `thrift_server_type` パラメーターの設定と一致させる必要があります。現在指定できる値は `THREADED` と `THREAD_POOL` です。

    - `THREADED` の場合、非ブロッキング I/O モデルになります。

    - `THREAD_POOL` の場合、ブロッキング I/O モデルになります。

#### `thrift_max_message_size` {#thrift_max_message_size}

デフォルト: 100MB

Thrift サーバーが受信するメッセージの最大サイズをバイト単位で指定します。クライアントから送信されたメッセージがこの制限を超えると、Thrift サーバーはリクエストを拒否して接続を閉じます。その結果、クライアントでは "connection has been closed by peer." というエラーが発生します。この場合、パラメーターを大きくしてみてください。

#### `txn_commit_rpc_timeout_ms` {#txn_commit_rpc_timeout_ms}

* 説明: txn のコミット RPC のタイムアウトです。
* デフォルト値: 60,000 (ms)

#### `txn_map_shard_size` {#txn_map_shard_size}

* 説明: txn_map_lock のシャードサイズです。値は 2^n（n=0,1,2,3,4）です。txn の管理性能を高めるための設定です。
* デフォルト値: 128

#### `txn_shard_size` {#txn_shard_size}

* 説明: txn_lock のシャードサイズです。値は 2^n（n=0,1,2,3,4）です。txn のコミットと公開の性能を高めるための設定です。
* デフォルト値: 1024

#### `unused_rowset_monitor_interval` {#unused_rowset_monitor_interval}

* 説明: 期限切れの Rowset を削除する間隔です。
* デフォルト値: 30 (s)

#### `max_client_cache_size_per_host` {#max_client_cache_size_per_host}

* 説明: ホストごとのクライアントキャッシュ数の上限です。BE には複数のクライアントキャッシュがありますが、現在は同じキャッシュサイズ設定を使用します。必要に応じて、キャッシュごとに異なる設定を使用してください。
* デフォルト値: 10

#### `string_type_length_soft_limit_bytes` {#string_type_length_soft_limit_bytes}

* 型: int32
* 説明: String 型の最大長に対するソフトリミットです。
* デフォルト値: 1,048,576

#### `big_column_size_buffer` {#big_column_size_buffer}

* 型: int64
* 説明: ODBC 外部テーブルを使用する際、ODBC ソーステーブルの列の型が HLL、CHAR、VARCHAR のいずれかで、列の値の長さがこの値を超えると、クエリで 'column value length longer than buffer length' エラーが発生します。この値を大きくできます。
* デフォルト値: 65535

#### `small_column_size_buffer` {#small_column_size_buffer}

* 型: int64
* 説明: ODBC 外部テーブルを使用する際、ODBC ソーステーブルの列の型が HLL、CHAR、VARCHAR のいずれでもなく、列の値の長さがこの値を超えると、クエリで 'column value length longer than buffer length' エラーが発生します。この値を大きくできます。
* デフォルト値: 100

### クエリ {#query}

#### `ignore_not_found_file_in_external_table` {#ignore_not_found_file_in_external_table}

* 型: bool
* 説明: 外部テーブルのリーダーが存在しないファイルをスキップできるかどうかを指定します。動的設定に対応します。バージョン 4.1.5 以降では、コミット済みの Iceberg スナップショットに含まれるデータファイルや削除ファイルの欠落は許容されません。`true` でもクエリは失敗し、不完全なスナップショットが気づかれずに返されることを防ぎます。
* デフォルト値: true

#### `parquet_metadata_size_limit` {#parquet_metadata_size_limit}

* 型: int64
* 説明: バージョン 4.1.5 以降でサポートされます。ネイティブ Parquet V2 リーダーが扱う、シリアライズされたファイルフッターのメタデータサイズの上限をバイト単位で指定します。`0` より大きい値が必要です。上限を超えると `Parquet v2 footer size ... exceeds metadata limit ...` が返されます。動的設定に対応します。正当な大きいフッターを扱う場合は、メモリの予算内で値を大きくしてください。
* デフォルト値: 268435456 (256 MiB)

#### `fragment_mgr_asynic_work_pool_queue_size` {#fragment_mgr_asynic_work_pool_queue_size}

* 説明: 単一ノードで処理できる非同期作業の上限です。
* デフォルト値: 4096

#### `fragment_mgr_asynic_work_pool_thread_num_min` {#fragment_mgr_asynic_work_pool_thread_num_min}

* 説明: 非同期作業を実行するスレッド数です。デフォルトの最小スレッド数は 16 です。
* デフォルト値: 16

#### `fragment_mgr_asynic_work_pool_thread_num_max` {#fragment_mgr_asynic_work_pool_thread_num_max}

* 説明: 非同期作業に応じてスレッドを動的に作成します。作成できるスレッドの最大数は 512 です。
* デフォルト値: 512

#### `doris_scanner_row_num` {#doris_scanner_row_num}

* 説明: 各スキャンスレッドが 1 回の実行で返すデータ行数の上限です。
* デフォルト値: 16384

#### `doris_scanner_row_bytes` {#doris_scanner_row_bytes}

* 説明: 1 回の読み取りで実行するフラグメントの行データのバイト数です。
    - 注: テーブルの列数が多く、`select *` が停止したように見える場合は、この設定を調整できます。
* デフォルト値: 10485760

#### `doris_scanner_thread_pool_queue_size` {#doris_scanner_thread_pool_queue_size}

* 型: int32
* 説明: Scanner スレッドプールのキューの長さです。Doris のスキャンタスクでは、各 Scanner がスレッドタスクとしてプールに投入され、実行を待ちます。投入したタスク数がキューの長さを超えると、後続のタスクはキューに空きができるまでブロックされます。
* デフォルト値: 102400

#### `doris_scanner_thread_pool_thread_num` {#doris_scanner_thread_pool_thread_num}

* 型: int32
* 説明: Scanner スレッドプールのスレッド数です。Doris のスキャンタスクでは、各 Scanner がスレッドタスクとしてプールに投入され、実行されます。このパラメーターで Scanner スレッドプールのサイズを決めます。
* デフォルト値: CPU コア数によって異なります。`max(48, 2 * num_of_cpu_cores)` と等しくなります。

#### `doris_max_remote_scanner_thread_pool_thread_num` {#doris_max_remote_scanner_thread_pool_thread_num}

* 型: int32
* 説明: Remote scanner スレッドプールの最大スレッド数です。このプールは、すべての外部データソースのスキャンタスクに使用されます。
* デフォルト: 512

#### `exchg_node_buffer_size_bytes` {#exchg_node_buffer_size_bytes}

* 型: int32
* 説明: ExchangeNode ノードの Buffer キューのサイズをバイト単位で指定します。Sender 側から送られたデータ量が ExchangeNode の Buffer サイズを超えると、後続の送信は Buffer に書き込み可能な空きができるまでブロックされます。
* デフォルト値: 10485760

#### `doris_scan_range_max_mb` {#doris_scan_range_max_mb}

* 型: int32
* 説明: 各 OlapScanner が読み取るデータ量の上限です。
* デフォルト値: 1024

### compaction {#compaction}

#### `disable_auto_compaction` {#disable_auto_compaction}

* 型: bool
* 説明: 自動 compaction タスクを無効にするかどうかを指定します。
  - 通常は false のままにします。デバッグ環境やテスト環境で compaction タスクを手動で操作する場合は、この設定を有効にできます。
* デフォルト値: false

#### `enable_vertical_compaction` {#enable_vertical_compaction}

* 型: bool
* 説明: 垂直 compaction を有効にするかどうかを指定します。
* デフォルト値: true

#### `vertical_compaction_num_columns_per_group` {#vertical_compaction_num_columns_per_group}

* 型: int32
* 説明: 垂直 compaction で、各グループに含める列数です。
* デフォルト値: 5

#### `vertical_compaction_max_row_source_memory_mb` {#vertical_compaction_max_row_source_memory_mb}

* 型: int32
* 説明: 垂直 compaction で row_source_buffer が使用できる最大メモリ量です。単位は MB です。
* デフォルト値: 200

#### `vertical_compaction_max_segment_size` {#vertical_compaction_max_segment_size}

* 型: int32
* 説明: 垂直 compaction で出力する segment ファイルの最大サイズです。単位は m バイトです。
* デフォルト値: 268435456

#### `enable_ordered_data_compaction` {#enable_ordered_data_compaction}

* 型: bool
* 説明: 順序付きデータの compaction を有効にするかどうかを指定します。
* デフォルト値: true

#### `ordered_data_compaction_min_segment_size` {#ordered_data_compaction_min_segment_size}

* 型: int32
* 説明: 順序付きデータの compaction で、入力 rowset の segment に必要な最小サイズです。単位は m バイトです。
* デフォルト値: 10485760

#### `max_base_compaction_threads` {#max_base_compaction_threads}

* 型: int32
* 説明: base compaction スレッドプールの最大スレッド数です。-1 はディスクごとに 1 スレッドを意味します。
* デフォルト値: 4

#### `generate_compaction_tasks_interval_ms` {#generate_compaction_tasks_interval_ms}

* 説明: compaction タスクを生成する最小間隔（ms）です。
* デフォルト値: 10 (ms)

#### `base_compaction_min_rowset_num` {#base_compaction_min_rowset_num}

* 説明: BaseCompaction の開始条件の 1 つです。Cumulative ファイルの数がこの上限に達すると、BaseCompaction が開始されます。
* デフォルト値: 5

#### `base_compaction_min_data_ratio` {#base_compaction_min_data_ratio}

* 説明: BaseCompaction の開始条件の 1 つです。Cumulative ファイルのサイズが Base ファイルのサイズに対してこの割合に達すると、開始されます。
* デフォルト値: 0.3 (30%)

#### `total_permits_for_compaction_score` {#total_permits_for_compaction_score}

* 型: int64
* 説明: すべての compaction タスクが保持できる「permits」の上限です。この設定で compaction のメモリ消費を制限できます。
* デフォルト値: 10000
* 動的に変更可能: はい

#### `compaction_promotion_size_mbytes` {#compaction_promotion_size_mbytes}

* 型: int64
* 説明: cumulative compaction の出力 rowset の合計ディスクサイズがこの設定値を超えると、その rowset は base compaction に使用されます。単位は m バイトです。
  - 通常は 2G 未満に設定し、cumulative compaction に時間がかかりすぎてバージョンが滞留することを防ぎます。
* デフォルト値: 1024

#### `compaction_promotion_ratio` {#compaction_promotion_ratio}

* 型: double
* 説明: cumulative compaction の出力 rowset の合計ディスクサイズが、base バージョンの rowset に対する設定割合を超えると、その rowset は base compaction に使用されます。
  - 通常は 0.1 を超えず、0.02 を下回らない値が推奨されます。
* デフォルト値: 0.05

#### `compaction_promotion_min_size_mbytes` {#compaction_promotion_min_size_mbytes}

* 型: int64
* 説明: cumulative compaction の出力 rowset の合計ディスクサイズがこの設定値より小さい場合、その rowset は base compaction の対象にならず、cumulative compaction の処理にとどまります。単位は m バイトです。
  - 通常は 512m 以下に設定します。大きすぎると、初期の base バージョンが小さいままとなり、base compaction が実行されません。
* デフォルト値: 128

#### `compaction_min_size_mbytes` {#compaction_min_size_mbytes}

* 型: int64
* 説明: cumulative compaction で選択した rowset の合計ディスクサイズがこの設定値より大きい場合は、レベルポリシーに従って分割してマージします。小さい場合は直接マージします。単位は m バイトです。
  - 通常は 128m 以下に設定します。大きすぎると cumulative compaction の書き込み増幅が増えます。
* デフォルト値: 64

#### `default_rowset_type` {#default_rowset_type}

* 型: string
* 説明: BE がデフォルトで選択するストレージ形式を指定します。指定可能な値は "**ALPHA**" と "**BETA**" です。主に次の 2 つの用途があります。
  - テーブルの storage_format が Default に設定されているとき、BE のストレージ形式を選択します。
  - BE が Compaction を実行するときのストレージ形式を選択します。
* デフォルト値: BETA

#### `cumulative_compaction_min_deltas` {#cumulative_compaction_min_deltas}

* 説明: cumulative compaction ポリシーにおける増分ファイル数の最小値です。
* デフォルト値: 5

#### `cumulative_compaction_max_deltas` {#cumulative_compaction_max_deltas}

* 説明: cumulative compaction ポリシーにおける増分ファイル数の最大値です。
* デフォルト値: 1000

#### `base_compaction_trace_threshold` {#base_compaction_trace_threshold}

* 型: int32
* 説明: base compaction の trace 情報をログに記録するしきい値です。単位は秒です。
* デフォルト値: 10

Base compaction は時間のかかるバックグラウンドタスクです。この設定は trace 情報をログに記録するしきい値です。ログファイル内の trace 情報は次のようになります。

```
W0610 11:26:33.804431 56452 storage_engine.cpp:552] execute base compaction cost 0.00319222
BaseCompaction:546859:
  - filtered_rows: 0
   - input_row_num: 10
   - input_rowsets_count: 10
   - input_rowsets_data_size: 2.17 KB
   - input_segments_num: 10
   - merge_rowsets_latency: 100000.510ms
   - merged_rows: 0
   - output_row_num: 10
   - output_rowset_data_size: 224.00 B
   - output_segments_num: 1
0610 11:23:03.727535 (+     0us) storage_engine.cpp:554] start to perform base compaction
0610 11:23:03.728961 (+  1426us) storage_engine.cpp:560] found best tablet 546859
0610 11:23:03.728963 (+     2us) base_compaction.cpp:40] got base compaction lock
0610 11:23:03.729029 (+    66us) base_compaction.cpp:44] rowsets picked
0610 11:24:51.784439 (+108055410us) compaction.cpp:46] got concurrency lock and start to do compaction
0610 11:24:51.784818 (+   379us) compaction.cpp:74] prepare finished
0610 11:26:33.359265 (+101574447us) compaction.cpp:87] merge rowsets finished
0610 11:26:33.484481 (+125216us) compaction.cpp:102] output rowset built
0610 11:26:33.484482 (+     1us) compaction.cpp:106] check correctness finished
0610 11:26:33.513197 (+ 28715us) compaction.cpp:110] modify rowsets finished
0610 11:26:33.513300 (+   103us) base_compaction.cpp:49] compaction finished
0610 11:26:33.513441 (+   141us) base_compaction.cpp:56] unused rowsets have been moved to GC queue
```

#### `cumulative_compaction_trace_threshold` {#cumulative_compaction_trace_threshold}

* 型: int32
* 説明: cumulative compaction の trace 情報をログに記録するしきい値です。単位は秒です。
  - `base_compaction_trace_threshold` と同様です。
* デフォルト値: 2

#### `compaction_task_num_per_disk` {#compaction_task_num_per_disk}

* 型: int32
* 説明: 1 台のディスク（HDD）で並列実行する compaction タスクの数です。
* デフォルト値: 4

#### `compaction_task_num_per_fast_disk` {#compaction_task_num_per_fast_disk}

* 型: int32
* 説明: 1 台の高速ディスク（SSD）で並列実行する compaction タスクの数です。
* デフォルト値: 8

#### `cumulative_compaction_rounds_for_each_base_compaction_round` {#cumulative_compaction_rounds_for_each_base_compaction_round}

* 型: int32
* 説明: compaction タスクの生成時、base compaction の各ラウンドに対して cumulative compaction を何ラウンド実行するかを指定します。
* デフォルト値: 9

#### `max_cumu_compaction_threads` {#max_cumu_compaction_threads}

* 型: int32
* 説明: cumulative compaction スレッドプールの最大スレッド数です。-1 はディスクごとに 1 スレッドを意味します。
* デフォルト値: -1

#### `enable_segcompaction` {#enable_segcompaction}

* 型: bool
* 説明: データロード中に segment compaction を使用し、-238 エラーを回避します。
* デフォルト値: true

#### `segcompaction_batch_size` {#segcompaction_batch_size}

* 型: int32
* 説明: segment 数がこのしきい値を超えると segment compaction が開始されます。また、1 つの segment compaction タスクに含める元の segment 数の上限にもなります。
* デフォルト値: 10

#### `segcompaction_candidate_max_rows` {#segcompaction_candidate_max_rows}

* 型: int32
* 説明: 1 つのソース segment に許容する最大行数です。これより大きい segment はスキップされます。
* デフォルト値: 1048576

#### `segcompaction_candidate_max_bytes` {#segcompaction_candidate_max_bytes}

* 型: int64
* 説明: 1 つのソース segment に許容する最大ファイルサイズです。これより大きい segment はスキップされます。
* デフォルト値: 104857600

#### `segcompaction_task_max_rows` {#segcompaction_task_max_rows}

* 型: int32
* 説明: 1 つの segcompaction タスクに許容する合計行数の上限です。
* デフォルト値: 1572864

#### `segcompaction_task_max_bytes` {#segcompaction_task_max_bytes}

* 型: int64
* 説明: 1 つの segcompaction タスクに許容する合計ファイルサイズの上限です。
* デフォルト値: 157286400

#### `segcompaction_num_threads` {#segcompaction_num_threads}

* 型: int32
* 説明: グローバルな segcompaction スレッドプールのサイズです。
* デフォルト値: 5

#### `disable_compaction_trace_log` {#disable_compaction_trace_log}

* 型: bool
* 説明: compaction の trace ログを無効にします。
  - true に設定すると、`cumulative_compaction_trace_threshold` と `base_compaction_trace_threshold` は機能せず、trace ログが無効になります。
* デフォルト値: true

#### `pick_rowset_to_compact_interval_sec` {#pick_rowset_to_compact_interval_sec}

* 型: int64
* 説明: compaction の対象となる rowset を選択する間隔を秒単位で指定します。
* デフォルト値: 86400

#### `update_replica_infos_interval_seconds` {#update_replica_infos_interval_seconds}

* 説明: ピアレプリカ情報を更新する最小間隔（s）です。
* デフォルト値: 60 (s)

#### `cold_data_compaction_score_threshold` {#cold_data_compaction_score_threshold}

* 型: int32
* 説明: 冷たいデータの compaction を開始するための最小 compaction スコアを指定します。冷たいデータの compaction スコアがこのしきい値を超えると、compaction が検討されます。この値でリモートストレージ上の冷たいデータに対する compaction の頻度と強さを調整できます。バージョン 3.1.3 以降でサポートされます。
* デフォルト値: 100

#### `cold_data_compaction_thread_num` {#cold_data_compaction_thread_num}

* 型: int32
* 説明: 冷たいデータの compaction に使用するスレッド数です。タスクの並列度を制御します。値を大きくすると同時に実行できるタスクが増え、スループットが向上する可能性がありますが、リソース消費も増えます。
* デフォルト値: 2

#### `cold_data_compaction_interval_sec` {#cold_data_compaction_interval_sec}

* 型: int32
* 説明: 冷たいデータの compaction の開始を検討する間隔を秒単位で指定します。間隔が短いほど頻繁に検討されるため、クリーンアップは早くなる可能性がありますが、リソース消費も増えます。
* デフォルト値: 1800 (秒)

#### `enable_compaction_pause_on_high_memory` {#enable_compaction_pause_on_high_memory}

* 型: bool
* 説明: プロセスのメモリ使用量が多いときに compaction タスクを一時停止するかどうかを指定します。動的に変更できます。
  - 有効にすると、BE はメモリ負荷が高いときに compaction を一時停止し、クエリとデータロードを優先します。
  - 一方、compaction を一時停止すると、compaction スコアの高い tablet のマージがさらに難しくなり、解消したいメタデータとメモリの滞留が増えます。そのため、**バージョン 4.0.8 以降、デフォルト値が `true` から `false` に変更され**、メモリ使用量が多いことを理由とする一時停止はデフォルトでは行われません。
  - 従来の動作を維持するには、`true` に設定してください。
* デフォルト値: false (4.0.8 より前は true)

### データロード {#load}

#### `request_cdc_client_timeout_ms` {#request_cdc_client_timeout_ms}

* 型: int32
* 説明: CDC クライアントのリクエストタイムアウトをミリ秒単位で指定します。動的設定に対応します。バージョン 4.1.5 では、時間のかかる CDC リクエストを許容するため、デフォルト値が `60000` から `120000` に引き上げられました。
* デフォルト値: 120000 (4.1.5 より前は 60000)

#### `enable_table_memtable_flush_backpressure` {#enable_table_memtable_flush_backpressure}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。この BE 上で同じテーブルの MemTable が多数 flush 待ちになっているときに、そのテーブルへの新しい書き込みをブロックするかどうかを指定します。FE の設定 `enable_adaptive_random_bucket_load` と併用し、適応型ランダムバケットのデータロード中に MemTable が蓄積してメモリ使用量が膨らむのを防ぎます。
* デフォルト値: true

#### `table_memtable_flush_pending_count_limit` {#table_memtable_flush_pending_count_limit}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。この BE 上で flush 待ちにできる、単一テーブルの MemTable 数の上限です。上限を超えると、数が上限未満になるまで新しい書き込みがブロックされます。`enable_table_memtable_flush_backpressure = true` の場合にのみ有効です。
* デフォルト値: 10

#### `group_commit_max_wal_num_per_table` {#group_commit_max_wal_num_per_table}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。単一テーブルに存在できる Group Commit WAL ファイル数の上限です。`0` は無制限を意味します。WAL の再生が繰り返し失敗してファイル数が上限を超えると、そのテーブルの `async_mode` Group Commit データロードは `EXCEEDED_LIMIT` エラーで拒否されます。メッセージは `Too many group commit async WALs for table ...` のようになります。この制限により、WAL が際限なく増えてディスクを使い切ることを防ぎます。
* デフォルト値: 10

#### `enable_stream_load_record` {#enable_stream_load_record}

* 型: bool
* 説明: Stream Load の記録機能を有効にするかどうかを指定します。デフォルトでは無効です。
* デフォルト値: false

#### `load_data_reserve_hours` {#load_data_reserve_hours}

* 説明: mini load に使用します。指定した時間が経過すると、mini load のデータファイルが削除されます。
* デフォルト値: 4 (h)

#### `push_worker_count_high_priority` {#push_worker_count_high_priority}

* 説明: HIGH 優先度のタスクを処理するデータロードスレッド数です。
* デフォルト値: 3

#### `push_worker_count_normal_priority` {#push_worker_count_normal_priority}

* 説明: NORMAL 優先度のタスクを処理するデータロードスレッド数です。
* デフォルト値: 3

#### `enable_single_replica_load` {#enable_single_replica_load}

* 説明: 単一レプリカでのデータロード機能を有効にするかどうかを指定します。
* デフォルト値: true

#### `load_error_log_reserve_hours` {#load_error_log_reserve_hours}

* 説明: 指定した時間が経過すると、データロードのエラーログが削除されます。
* デフォルト値: 48 (h)

#### `load_error_log_limit_bytes` {#load_error_log_limit_bytes}

* 説明: データロードのエラーログがこのサイズを超えると切り詰められます。
* デフォルト値: 209715200 (byte)

#### `load_process_max_memory_limit_percent` {#load_process_max_memory_limit_percent}

* 説明: 単一ノード上のすべてのデータロードスレッドが占められるメモリ上限の割合です。デフォルトは 50% です。
  - ユーザーによる Doris のアップグレード時にデータロード性能へ影響しないよう、これらのデフォルト値は大きく設定されています。必要に応じて適切な値を設定してください。
* デフォルト値: 50 (%)

#### `load_process_soft_mem_limit_percent` {#load_process_soft_mem_limit_percent}

* 説明: 単一ノードのデータロード用メモリ上限に対するソフトリミットの割合です。たとえば、すべてのデータロードタスクのメモリ上限が 20GB の場合、ソフトリミットはデフォルトでその 50%、つまり 10GB です。メモリ使用量がソフトリミットを超えると、最も多くのメモリを使用しているジョブを選んで flush し、メモリを解放します。デフォルトは 50% です。
* デフォルト値: 50 (%)

#### `slave_replica_writer_rpc_timeout_sec` {#slave_replica_writer_rpc_timeout_sec}

* 型: int32
* 説明: 単一レプリカでのデータロードに使用する、Master レプリカと Slave レプリカ間の brpc タイムアウトを変更します。
* デフォルト値: 60

#### `max_segment_num_per_rowset` {#max_segment_num_per_rowset}

* 型: int32
* 説明: データロード時に新しく生成する rowset の segment 数を制限します。しきい値を超えると、データロードは -238 エラーで失敗します。segment が多すぎると compaction が大量のメモリを使用し、OOM エラーが発生します。
* デフォルト値: 200

#### `high_priority_flush_thread_num_per_store` {#high_priority_flush_thread_num_per_store}

* 型: int32
* 説明: 優先度の高いデータロードタスクに対して、各ストレージパスに割り当てる flush スレッド数です。
* デフォルト値: 1

#### `routine_load_consumer_pool_size` {#routine_load_consumer_pool_size}

* 型: int32
* 説明: routine load で使用する data consumer のキャッシュ数です。
* デフォルト値: 10

#### `multi_table_batch_plan_threshold` {#multi_table_batch_plan_threshold}

* 型: int32
* 説明: 単一ストリームから複数テーブルへのデータロードに使用します。Kafka から受信したメッセージのバッチサイズがこのしきい値を超えると、関連するすべてのテーブルのプランを要求します。
* デフォルト値: 200

#### `multi_table_max_wait_tables` {#multi_table_max_wait_tables}

* 型: int32
* 説明: 単一ストリームから複数テーブルへのデータロードに使用します。Kafka からメッセージのバッチを受信した際、プラン待ちのテーブル数がこのしきい値を超えると、関連するすべてのテーブルのプランを要求します。このパラメーターは、多数のプランを一度に要求して実行することを避けるためのものです。データロード中に複数テーブルを小さなバッチで処理することで、単一 RPC の負荷を減らし、データ処理のリアルタイム性を高められます。
* デフォルト値: 5

#### `single_replica_load_download_num_workers` {#single_replica_load_download_num_workers}

* 型: int32
* 説明: 単一レプリカでのデータロードに使用する、segment ダウンロード用の HTTP ワーカースレッド数です。データロードの並行数が増えた場合、この値を調整すると Slave レプリカが Master レプリカからデータファイルを適時に同期できます。必要に応じて、I/O 性能を高めるため `webserver_num_workers` も増やしてください。
* デフォルト値: 64

#### `load_task_high_priority_threshold_second` {#load_task_high_priority_threshold_second}

* 型: int32
* 説明: データロードタスクのタイムアウトがこのしきい値より短い場合、Doris は優先度の高いタスクと判断します。優先度の高いタスクは専用の flush スレッドプールを使用します。
* デフォルト: 120

#### `min_load_rpc_timeout_ms` {#min_load_rpc_timeout_ms}

* 型: int32
* 説明: データロードジョブ内の各 RPC の最小タイムアウトです。
* デフォルト: 20

#### `kafka_api_version_request` {#kafka_api_version_request}

* 型: bool
* 説明: 使用する Kafka のバージョンが 0.10.0.0 より古い場合は、false に設定してください。
* デフォルト: true

#### `kafka_broker_version_fallback` {#kafka_broker_version_fallback}

* 説明: 使用する Kafka のバージョンが 0.10.0.0 より古く、kafka_api_version_request が false の場合、フォールバックバージョンとして kafka_broker_version_fallback の値が使用されます。有効な値は 0.9.0.x と 0.8.x.y です。
* デフォルト: 0.10.0

#### `max_consumer_num_per_group` {#max_consumer_num_per_group}

* 説明: routine load で使用する、データコンシューマーグループ内のコンシューマー数の上限です。
* デフォルト: 3

#### `streaming_load_max_mb` {#streaming_load_max_mb}

* 型: int64
* 説明: 1 回の Stream Load のリクエスト本文の最大サイズを制限します。`read_json_by_line=true` を指定しない JSON のデータロードには、`streaming_load_json_max_mb` の制限も適用されます。
  - Stream Load は通常、数 GB 未満のデータロードに適しており、非常に大きなデータのロードには適していません。
* デフォルト値: 102400 (MB)
* 動的に変更可能: はい

これはソースコード上のデフォルト値です。実際に有効な値はデプロイ時の設定によって異なります。ADMIN_PRIV を持つユーザーは `SHOW BACKEND CONFIG LIKE 'streaming_load_max_mb';` を実行し、各 BE の有効な値を確認できます。このパラメーターは BE を再起動せずに動的に変更できます。マネージドクラウドサービスでは、サービスが提供する設定方法を使用するか、管理者に値の確認または調整を依頼してください。

**バージョン履歴:**

- 3.x 系列では、Doris 3.0.2 で `streaming_load_max_mb` のデフォルト値が 10240 MB (10 GB) から 102400 MB (100 GB) に引き上げられました。Doris 3.0.0 と 3.0.1 のデフォルト値は 10 GB です。
- 2.1 系列では、同じ変更が 2.1.7 から有効になりました。
- Doris 4.x と dev でも、デフォルト値は 100 GB です。実際に有効な値はデプロイ時の設定によって異なります。

#### `streaming_load_json_max_mb` {#streaming_load_json_max_mb}

* 型: int64
* 説明: 1 回の Stream Load で許容する JSON データ量の上限を指定します。単位は MB です。
  - JSON など、一部のデータ形式は分割できません。Doris は解析を始める前にデータ全体をメモリへ読み込む必要があります。そのため、この値で 1 回の Stream Load で読み込めるデータ量を制限します。
* デフォルト値: 100
* 動的に変更可能: はい

#### `olap_table_sink_send_interval_microseconds` {#olap_table_sink_send_interval_microseconds}

* 説明: データロード中は、Coordinator の sink ノードにあるポーリングスレッドが対応する BE にデータを送り続けます。このスレッドは `olap_table_sink_send_interval_microseconds` マイクロ秒ごとに送信するデータがあるか確認します。
* デフォルト値: 1000

#### `olap_table_sink_send_interval_auto_partition_factor` {#olap_table_sink_send_interval_auto_partition_factor}

* 説明: 自動パーティションが有効なテーブルにデータをロードする場合、`olap_table_sink_send_interval_microseconds` の間隔では遅すぎます。その場合、実際の間隔にはこの係数が乗算されます。
* デフォルト値: 0.001

#### `enable_group_commit_streamload_be_forward` {#enable_group_commit_streamload_be_forward}

* 型: bool
* 説明: ストレージとコンピュートの分離モードで、Group Commit の Stream Load リクエストを BE が転送する機能を有効にするかどうかを指定します。Doris 4.0 系列ではバージョン 4.0.8、4.1 系列ではバージョン 4.1.4 で追加されました。動的に変更できます。
  - ロードバランサーが同じテーブルの Group Commit リクエストを異なる BE にランダムに振り分けると、効果的なバッチ化ができません。有効にすると、BE はリクエストを単一の対象 BE に転送します。
  - **バージョン 4.0.8 以降、BE のエンドポイント `/api/{db}/{table}/_stream_load_forward` はこの設定によって制御されます。`false` の場合、エンドポイントへのリクエストは `Stream load forward is disabled` というメッセージとともに `403 Forbidden` を返します。`true` の場合も、リクエストには認証とグローバルな `LOAD` 権限が必要です。**
  - この転送を使用する環境では、FE と BE の両方でこの設定を `true` にする必要があります。FE の同名設定については [FE の設定](./fe-config) を参照してください。
* デフォルト値: false

### スレッド {#thread}

#### `delete_worker_count` {#delete_worker_count}

* 説明: データ削除タスクを実行するスレッド数です。
* デフォルト値: 3

#### `clear_transaction_task_worker_count` {#clear_transaction_task_worker_count}

* 説明: トランザクションのクリーンアップに使用するスレッド数です。
* デフォルト値: 1

#### `clone_worker_count` {#clone_worker_count}

* 説明: クローンタスクを実行するスレッド数です。
* デフォルト値: 3

#### `be_service_threads` {#be_service_threads}

* 型: int32
* 説明: BE 上の Thrift サーバーサービスの実行スレッド数です。FE からのリクエストの処理に使用できるスレッド数を示します。
* デフォルト値: 64

#### `download_worker_count` {#download_worker_count}

* 説明: ダウンロードスレッド数です。
* デフォルト値: 1

#### `drop_tablet_worker_count` {#drop_tablet_worker_count}

* 説明: tablet を削除するスレッド数です。
* デフォルト値: 3

#### `flush_thread_num_per_store` {#flush_thread_num_per_store}

* 説明: ストレージパスごとにメモリテーブルの flush に使用するスレッド数です。
* デフォルト値: 2

#### `publish_version_worker_count` {#publish_version_worker_count}

* 説明: バージョンを公開するスレッド数です。
* デフォルト値: 8

#### `upload_worker_count` {#upload_worker_count}

* 説明: ファイルのアップロードに使用する最大スレッド数です。
* デフォルト値: 1

#### `webserver_num_workers` {#webserver_num_workers}

* 説明: Web サーバーのデフォルトのワーカースレッド数です。
* デフォルト値: 48

#### `send_batch_thread_pool_thread_num` {#send_batch_thread_pool_thread_num}

* 型: int32
* 説明: SendBatch スレッドプールのスレッド数です。NodeChannel のデータ送信タスクでは、各 NodeChannel の SendBatch 操作がスレッドタスクとしてプールに投入され、実行されます。このパラメーターでプールのサイズを決めます。
* デフォルト値: 64

#### `send_batch_thread_pool_queue_size` {#send_batch_thread_pool_queue_size}

* 型: int32
* 説明: SendBatch スレッドプールのキューの長さです。NodeChannel のデータ送信タスクでは、各 NodeChannel の SendBatch 操作がスレッドタスクとしてプールに投入され、実行を待ちます。投入したタスク数がキューの長さを超えると、後続のタスクはキューに空きができるまでブロックされます。
* デフォルト値: 102400

#### `make_snapshot_worker_count` {#make_snapshot_worker_count}

* 説明: スナップショットを作成するスレッド数です。
* デフォルト値: 5

#### `release_snapshot_worker_count` {#release_snapshot_worker_count}

* 説明: スナップショットを解放するスレッド数です。
* デフォルト値: 5

### メモリ {#memory}

#### `madvise_huge_pages` {#madvise_huge_pages}

* 型: bool
* 説明: Linux のメモリ Huge Pages を使用するかどうかを指定します。
* デフォルト値: false

#### `max_memory_sink_batch_count` {#max_memory_sink_batch_count}

* 説明: 外部スキャンのキャッシュバッチ数の上限です。キャッシュされる行数は max_memory_cache_batch_count * batch_size です。デフォルトは 20、batch_size のデフォルト値は 1024 なので、20 * 1024 行がキャッシュされます。
* デフォルト値: 20

#### `memory_max_alignment` {#memory_max_alignment}

* 説明: メモリの最大アラインメントです。
* デフォルト値: 16

#### `mmap_buffers` {#mmap_buffers}

* 説明: メモリの割り当てに mmap を使用するかどうかを指定します。
* デフォルト値: false

#### `memtable_mem_tracker_refresh_interval_ms` {#memtable_mem_tracker_refresh_interval_ms}

* 説明: memtable flush mgr の更新処理の間隔をミリ秒単位で指定します。
* デフォルト値: 100

#### `zone_map_row_num_threshold` {#zone_map_row_num_threshold}

* 型: int32
* 説明: ページ内の行数がこの値より少ない場合、データの増大を抑えるため zonemap を作成しません。
* デフォルト値: 20

#### `memory_mode` {#memory_mode}

* 型: string
* 説明: tcmalloc の GC を制御します。performance モードでは、メモリ使用量が 90% * mem_limit 以上になると Doris が tcmalloc キャッシュのメモリを解放します。それ以外のモードでは、50% * mem_limit 以上になると解放します。
* デフォルト値: performance

#### `max_sys_mem_available_low_water_mark_bytes` {#max_sys_mem_available_low_water_mark_bytes}

* 型: int64
* 説明: システムの `/proc/meminfo/MemAvailable` の最大低水位をバイト単位で指定します。デフォルトは 1.6G で、実際の低水位は min(1.6G, MemTotal * 10%) です。16G を超えるメモリを持つマシンで過剰にメモリを確保しないための設定です。最大値を上げると、メモリが 16G を超えるマシンでは Full GC 用のメモリバッファが増えます。下げると、使用可能なメモリをより多く利用します。
* デフォルト値: 1717986918

#### `memory_limitation_per_thread_for_schema_change_bytes` {#memory_limitation_per_thread_for_schema_change_bytes}

* 説明: 1 つの schema change タスクに許容する最大メモリ量です。
* デフォルト値: 2147483648 (2GB)

#### `mem_tracker_consume_min_size_bytes` {#mem_tracker_consume_min_size_bytes}

* 型: int32
* 説明: TCMalloc Hook が MemTracker の consume/release を行う際の最小サイズです。この値より小さい消費量は累積され、MemTracker の consume/release の頻繁な呼び出しを防ぎます。値を小さくすると呼び出し頻度が増え、大きくすると MemTracker の統計が不正確になります。理論上、MemTracker の統計値と実際の値との差は、( mem_tracker_consume_min_size_bytes * その MemTracker が属する BE スレッド数) です。
* デフォルト値: 1,048,576

#### `min_buffer_size` {#min_buffer_size}

* 説明: 読み取りバッファの最小サイズです。
* デフォルト値: 1024 (byte)

#### `write_buffer_size` {#write_buffer_size}

* 説明: flush 前のバッファサイズです。
  - データロードされたデータは、まず BE のメモリブロックに書き込まれます。ブロックがしきい値に達すると、ディスクに書き戻されます。デフォルトのサイズは 200MB です。しきい値が小さすぎると BE 上に小さなファイルが大量にできる場合があります。値を大きくするとファイル数を減らせますが、大きすぎると RPC タイムアウトが起こる場合があります。
* デフォルト値: 209,715,200

#### `remote_storage_read_buffer_mb` {#remote_storage_read_buffer_mb}

* 型: int32
* 説明: HDFS またはオブジェクトストレージ上のファイルを読み取る際に使用するキャッシュのサイズです。
  - 値を大きくするとリモートデータの読み取り呼び出し回数を減らせますが、メモリ使用量は増えます。
* デフォルト値: 16 (MB)

#### `file_cache_type` {#file_cache_type}

* 型: string
* 説明: キャッシュファイルの種類です。`whole_file_cache` は segment ファイル全体をダウンロードし、`sub_file_cache` はサイズに応じて segment ファイルを複数のファイルに分割します。"" に設定するとキャッシュを使用しません。キャッシュが必要な場合は、このパラメーターを設定してください。
* デフォルト値: ""

#### `path_gc_check` {#path_gc_check}

* 型：bool
* 説明: 回収対象データのスキャンスレッドによるチェックを有効にするかどうかを指定します。
* デフォルト値：true

#### `path_gc_check_interval_second` {#path_gc_check_interval_second}

* 説明: 回収対象データのスキャンスレッドによるチェック間隔です。
* デフォルト値：86400 (s)

#### `path_gc_check_step` {#path_gc_check_step}

* デフォルト値：1000

#### `path_gc_check_step_interval_ms` {#path_gc_check_step_interval_ms}

* デフォルト値：10 (ms)

#### `scan_context_gc_interval_min` {#scan_context_gc_interval_min}

* 説明: context GC スレッドの実行間隔です。単位は分で、デフォルトは 5 分です。
* デフォルト値：5

### ストレージ {#storage}

#### `inverted_index_skip_norms_for_variant` {#inverted_index_skip_norms_for_variant}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされ、動的設定に対応します。`true` にすると、VARIANT のサブパスに対する転置インデックスでは、インデックスの `norms` プロパティの値にかかわらず Norms が省略されます。複数のサブパスのインデックスが占める容量は減りますが、これらのインデックスでは Norms を必要とする BM25 の `score()` 計算ができなくなります。デフォルトでは Norms が保持されます。[関連度スコアリング](../../table-design/index/inverted-index/scoring.md)を参照してください。
* デフォルト値: false

#### `default_num_rows_per_column_file_block` {#default_num_rows_per_column_file_block}

* 型: int32
* 説明: 1 つの RowBlock に含めるデータ行数を指定します。
* デフォルト値: 1024

#### `disable_storage_page_cache` {#disable_storage_page_cache}

* 型: bool
* 説明: インデックスのキャッシュにページキャッシュを使用しないようにします。この設定は BETA ストレージ形式でのみ有効です。通常は false が推奨されます。
* デフォルト値: false

#### `disk_stat_monitor_interval` {#disk_stat_monitor_interval}

* 説明: ディスク状態を確認する間隔です。
* デフォルト値: 5 (s)

#### `max_free_io_buffers` {#max_free_io_buffers}

* 説明: 各 I/O バッファサイズについて IoMgr が保持するバッファ数の上限です。対象のサイズは 1024B から 8MB までで、バッファの合計は最大約 2GB です。
* デフォルト値: 128

#### `max_garbage_sweep_interval` {#max_garbage_sweep_interval}

* 説明: ディスクの不要データを削除する最大間隔です。
* デフォルト値: 3600 (s)

#### `max_percentage_of_error_disk` {#max_percentage_of_error_disk}

* 型: int32
* 説明: ストレージエンジンが許容する故障したディスクの割合です。故障したディスクの割合がこの値を超えると、BE は自動的に終了します。
* デフォルト値: 0

#### `min_garbage_sweep_interval` {#min_garbage_sweep_interval}

* 説明: ディスクの不要データを削除する最小間隔です。
* デフォルト値: 180 (s)

#### `pprof_profile_dir` {#pprof_profile_dir}

* 説明: pprof プロファイルの保存ディレクトリです。
* デフォルト値: ${DORIS_HOME}/log

#### `small_file_dir` {#small_file_dir}

* 説明: SmallFileMgr がダウンロードしたファイルの保存先です。
* デフォルト値: ${DORIS_HOME}/lib/small_file/

#### `user_function_dir` {#user_function_dir}

* 説明: udf 関数のディレクトリです。
* デフォルト値: `${DORIS_HOME}/lib/udf`

#### `storage_flood_stage_left_capacity_bytes` {#storage_flood_stage_left_capacity_bytes}

* 説明: データディレクトリに残しておく必要がある最小容量をバイト単位で指定します。
* デフォルト値: 1073741824

#### `storage_flood_stage_usage_percent` {#storage_flood_stage_usage_percent}

* 説明: storage_flood_stage_usage_percent と storage_flood_stage_left_capacity_bytes の設定で、データディレクトリの最大容量使用率を制限します。
* デフォルト値: 90 (90%)

#### `storage_medium_migrate_count` {#storage_medium_migrate_count}

* 説明: クローンに使用するスレッド数です。
* デフォルト値: 1

#### `storage_page_cache_limit` {#storage_page_cache_limit}

* 説明: ストレージページキャッシュのサイズです。
* デフォルト値: 20%

#### `storage_page_cache_shard_size` {#storage_page_cache_shard_size}

* 説明: StoragePageCache のシャードサイズです。値は 2 のべき乗である必要があります。ロック競合を減らすため、BE のコア数に近い値が推奨されます。
* デフォルト値: 16

#### `index_page_cache_percentage` {#index_page_cache_percentage}

* 型: int32
* 説明: ストレージページキャッシュ全体に対するインデックスページキャッシュの割合です。値の範囲は [0, 100] です。
* デフォルト値: 10

#### `segment_cache_capacity` {#segment_cache_capacity}
* 型: int32
* 説明: segment キャッシュのエントリ数の上限です。キーは rowset id です。-1 は後方互換性のため fd_number * 2/5 を使用します。
* デフォルト値: -1

#### `storage_strict_check_incompatible_old_format` {#storage_strict_check_incompatible_old_format}

* 型: bool
* 説明: 互換性のない古い形式を厳密にチェックするために使用します。
* デフォルト値: true
* 動的に変更可能: false

#### `sync_tablet_meta` {#sync_tablet_meta}

* 説明: ストレージエンジンが sync を有効にし、ディスクへ確実に保存するかどうかを指定します。
* デフォルト値: true

#### `pending_data_expire_time_sec` {#pending_data_expire_time_sec}

* 説明: ストレージエンジンが未検証のデータを保持する最長時間です。
* デフォルト値: 1800 (s)

#### `ignore_rowset_stale_unconsistent_delete` {#ignore_rowset_stale_unconsistent_delete}

* 型: boolean
* 説明: 古くなったマージ済み rowset から一貫したバージョンパスを構築できない場合に、その rowset を削除するかどうかを決定します。
  - マージ済みで期限切れの rowset のバージョンパスは、30 分後に削除されます。異常な状況では、これらのバージョンを削除すると、クエリのための一貫したパスを構築できなくなることがあります。false の場合は厳密にチェックし、プログラムがエラーを報告して終了します。true の場合はエラーを無視して実行を続けます。通常、エラーを無視してもクエリには影響しません。ただし、マージ済みバージョンが FE から指定された場合に限り、-230 エラーが発生します。
* デフォルト値: false

#### `create_tablet_worker_count` {#create_tablet_worker_count}

* 説明: BE が tablet を作成するワーカースレッド数です。
* デフォルト値: 3

#### `check_consistency_worker_count` {#check_consistency_worker_count}

* 説明: tablet のチェックサムを計算するワーカースレッド数です。
* デフォルト値: 1

#### `max_tablet_version_num` {#max_tablet_version_num}

* 型: int
* 説明: 単一 tablet のバージョン数を制限します。頻繁なデータロードや compaction の遅れによって、多数のバージョンが蓄積することを防ぎます。上限を超えると、データロードタスクが拒否されます。
* デフォルト値: 2000

#### `tablet_map_shard_size` {#tablet_map_shard_size}

* 説明: tablet_map_lock のシャードサイズです。値は 2^n（n=0,1,2,3,4）です。tablet を効率よく管理するための設定です。
* デフォルト値: 4

#### `tablet_meta_checkpoint_min_interval_secs` {#tablet_meta_checkpoint_min_interval_secs}

* 説明: TabletMeta Checkpoint スレッドのポーリング間隔です。
* デフォルト値: 600 (s)

#### `tablet_meta_checkpoint_min_new_rowsets_num` {#tablet_meta_checkpoint_min_new_rowsets_num}

* 説明: TabletMeta Checkpoint を保存するために必要な Rowset の最小数です。
* デフォルト値: 10

#### `tablet_rowset_stale_sweep_time_sec` {#tablet_rowset_stale_sweep_time_sec}

* 型: int64
* 説明: マージ済み rowset のバージョンを削除するまでの時間を制御します。現在時刻 now() から、バージョンパス内で最も新しく作成された rowset の作成時刻を引いた時間が tablet_rowset_stale_sweep_time_sec より大きい場合、そのパスをクリーンアップしてマージ済み rowset を削除します。単位は秒です。
  - 書き込みが頻繁すぎると、FE がマージ済みバージョンを参照できず、クエリで -230 エラーが発生することがあります。この値を大きくすると回避できます。
* デフォルト値: 300

#### `tablet_writer_open_rpc_timeout_sec` {#tablet_writer_open_rpc_timeout_sec}

* 説明: tablet の状態キャッシュの更新間隔です。
    - データロード中に Batch（1024 行）を送信する RPC のタイムアウトです。デフォルトは 60 秒です。この RPC では複数のメモリバッチの書き込みが発生する場合があり、その処理によってタイムアウトすることがあります。タイムアウト値を調整すると、send batch fail などのエラーを減らせます。また、write_buffer_size を大きくした場合は、このパラメーターも大きくする必要があります。
* デフォルト値: 60

#### `tablet_writer_ignore_eovercrowded` {#tablet_writer_ignore_eovercrowded}

* 型: bool
* 説明: データ書き込み時の brpc エラー '[E1011]The server is overcrowded' を無視するための設定です。
* デフォルト値: false

#### `streaming_load_rpc_max_alive_time_sec` {#streaming_load_rpc_max_alive_time_sec}

* 説明: TabletsChannel の存続時間です。この時間内にチャネルがデータを受信しない場合、チャネルは削除されます。
* デフォルト値: 1200

#### `alter_tablet_worker_count` {#alter_tablet_worker_count}

* 説明: schema change を実行するスレッド数です。
* デフォルト値: 3

#### `alter_index_worker_count` {#alter_index_worker_count}

* 説明: index change を実行するスレッド数です。
* デフォルト値: 3

#### `ignore_load_tablet_failure` {#ignore_load_tablet_failure}

* 型: bool
* 説明: tablet の読み込みに失敗した場合にエラーを無視して BE の起動を続行するかどうかを指定します。
* デフォルト値: false

BE の起動時には、各データディレクトリに対して個別のスレッドが開始され、tablet ヘッダーのメタ情報が読み込まれます。デフォルト設定では、データディレクトリ内の tablet の読み込みに失敗すると、起動処理が終了します。同時に、` be INFO ` ログに次のエラーメッセージが表示されます。

```
load tablets from header failed, failed tablets size: xxx, path=xxx
```

これは、そのデータディレクトリで読み込みに失敗した tablet の数を示します。ログには、読み込みに失敗した tablet の詳細情報も記録されます。原因の調査には手動での対応が必要です。調査後は通常、次の 2 つの方法で復旧します。
  - tablet 情報を修復できず、ほかのレプリカが正常な場合は、`meta_tool` を使用して問題のある tablet を削除します。
  - `ignore_load_tablet_failure` を true に設定すると、BE は問題のある tablet を無視して正常に起動します。

#### `report_disk_state_interval_seconds` {#report_disk_state_interval_seconds}

* 説明: エージェントがディスク状態を FE に報告する間隔です。
* デフォルト値: 60 (s)

#### `result_buffer_cancelled_interval_time` {#result_buffer_cancelled_interval_time}

* 説明: 結果バッファのキャンセルまでの時間です。
* デフォルト値: 300 (s)

#### `snapshot_expire_time_sec` {#snapshot_expire_time_sec}

* 説明: スナップショットファイルのクリーンアップ間隔です。
* デフォルト値:172800 (48 時間)

### ログ {#log}

#### `sys_log_dir` {#sys_log_dir}

* 型: string
* 説明: BE のログデータを保存するディレクトリです。
* デフォルト値: `${DORIS_HOME}/log`

#### `sys_log_level` {#sys_log_level}

* 説明: ログレベルは INFO < WARNING < ERROR < FATAL の順です。
* デフォルト値: INFO

#### `sys_log_roll_mode` {#sys_log_roll_mode}

* 説明: ログを分割するサイズです。1G ごとにログファイルを分割します。
* デフォルト値: SIZE-MB-1024

#### `sys_log_roll_num` {#sys_log_roll_num}

* 説明: 保持するログファイルの数です。
* デフォルト値: 10

#### `sys_log_verbose_level` {#sys_log_verbose_level}

* 説明: ログの詳細度です。コード内で VLOG から始まるログの出力を制御します。
* デフォルト値: 10

#### `sys_log_verbose_modules` {#sys_log_verbose_modules}

* 説明: ログを出力するモジュールです。olap を指定すると、olap モジュールのログだけが出力されます。
* デフォルト値: 空

#### `aws_log_level` {#aws_log_level}

* 型: int32
* 説明: AWS SDK のログレベルです。
  ```
     Off = 0,
     Fatal = 1,
     Error = 2,
     Warn = 3,
     Info = 4,
     Debug = 5,
     Trace = 6
  ```
* デフォルト値: 3

#### `log_buffer_level` {#log_buffer_level}

* 説明: ログの flush 方法です。デフォルトではメモリに保持します。
* デフォルト値: 空

### その他 {#others}

#### `enable_arrow_input_validation` {#enable_arrow_input_validation}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。Arrow データを Doris の内部列に変換する前に、Arrow の入力バッファを検証するかどうかを指定します。有効にすると、不正な Arrow データによる BE のクラッシュを防げますが、検証によるわずかな処理負荷が加わります。
* デフォルト値: true

#### `report_tablet_interval_seconds` {#report_tablet_interval_seconds}

* 説明: エージェントが olap テーブルを FE に報告する間隔です。
* デフォルト値: 60 (s)

#### `report_task_interval_seconds` {#report_task_interval_seconds}

* 説明: エージェントがタスクのシグネチャを FE に報告する間隔です。
* デフォルト値: 10 (s)

#### `periodic_counter_update_period_ms` {#periodic_counter_update_period_ms}

* 説明: レートカウンターとサンプリングカウンターの更新周期です。
* デフォルト値: 500 (ms)

#### `enable_metric_calculator` {#enable_metric_calculator}

* 説明: true にすると、metric calculator が動作して BE 関連の指標情報を収集します。false にすると動作しません。
* デフォルト値: true

#### `enable_system_metrics` {#enable_system_metrics}

* 説明: システム指標の有効化と無効化を制御します。
* デフォルト値: true

#### `enable_token_check` {#enable_token_check}

* 説明: 将来の互換性のために使用します。後で削除される予定です。
* デフォルト値: true

#### `max_runnings_transactions_per_txn_map` {#max_runnings_transactions_per_txn_map}

* 説明: txn マネージャー内の各 txn_partition_map が保持できる txn 数の上限です。txn が過剰に蓄積することを防ぎます。
* デフォルト値: 2000

#### `max_download_speed_kbps` {#max_download_speed_kbps}

* 説明: ダウンロード速度の上限です。
* デフォルト値: 50000 (kb/s)

#### `download_low_speed_time` {#download_low_speed_time}

* 説明: ダウンロード時間の制限です。
* デフォルト値: 300 (s)

#### `download_low_speed_limit_kbps` {#download_low_speed_limit_kbps}

* 説明: 最低ダウンロード速度です。
* デフォルト値: 50 (KB/s)

#### `enable_batch_download` {#enable_batch_download}

* 説明: ファイルをまとめてダウンロードするかどうかを指定します。binlog が有効な場合は、この設定を有効にすることが推奨されます。
* デフォルト値: false

#### `priority_queue_remaining_tasks_increased_frequency` {#priority_queue_remaining_tasks_increased_frequency}

* 説明: BlockingPriorityQueue に残っているタスクの優先度を上げる頻度です。
* デフォルト値: 512


#### `jdbc_drivers_dir` {#jdbc_drivers_dir}

* 説明: JDBC ドライバーを配置するデフォルトのディレクトリです。
* デフォルト値: `${DORIS_HOME}/jdbc_drivers`

#### `enable_simdjson_reader` {#enable_simdjson_reader}

* 説明: Stream Load 中の JSON 解析に simdjson を使用するかどうかを指定します。
* デフォルト値: true

#### `user_files_secure_path` {#user_files_secure_path}

* 説明: `local` テーブル値関数でクエリするファイルの保存ディレクトリです。
* デフォルト値: `${DORIS_HOME}`

#### `brpc_streaming_client_batch_bytes` {#brpc_streaming_client_batch_bytes}

* 説明: brpc streaming クライアントがデータを送信する際のバッチサイズです。
* デフォルト値: 262144

#### `grace_shutdown_wait_seconds` {#grace_shutdown_wait_seconds}

* 説明: クラウドネイティブのデプロイでは、BE が頻繁にクラスターへ追加またはクラスターから削除されます。シャットダウン中の BE 上で fragment が実行されていると、ユーザーのクエリは失敗します。`stop_be.sh --grace` を使用すると、BE は実行中のクエリがすべて終了するまで待ち、クエリの失敗を回避します。ただし、待機時間が制限を超えると BE は直ちに終了します。この間、FE は BE に新しいクエリを送信せず、実行中のクエリの終了を待ちます。
* デフォルト値: 120

#### `enable_java_support` {#enable_java_support}

* 説明: BE で java-jni の使用を有効にするかどうかを指定します。有効にすると c++ と java の相互呼び出しが可能になります。現在、hudi、java-udf、jdbc、max-compute、paimon、preload、avro をサポートします。
* デフォルト値: true

#### `group_commit_wal_path` {#group_commit_wal_path}

* Group Commit の `WAL` ディレクトリです。
* デフォルト: `storage_root_path` の各ディレクトリ内に `wal` という名前のディレクトリを作成します。設定例:
  ```
  group_commit_wal_path=/data1/storage/wal;/data2/storage/wal;/data3/storage/wal
  ```

### コンピュートとストレージの分離モード {#compute-and-storage-disaggregated-mode}

#### `deploy_mode` {#deploy_mode-1}

* デフォルト: ""

* 説明: BE の実行モードです。`cloud` はストレージとコンピュートを分離するモードを示します。

#### `meta_service_endpoint` {#meta_service_endpoint}

デフォルト: ""

* 説明: Meta Service のエンドポイントは 'host1:port,host2:port' の形式で指定します。通常、この値は FE からハートビートを通じて BE に通知されるため、設定は不要です。

#### `enable_file_cache` {#enable_file_cache}

デフォルト: true (バージョン 4.1.5 以降はデフォルトで有効。それ以前は false。コンピュートとストレージの分離モードでは常に有効)。

* 説明: File Cache を使用するかどうかを指定します。変更を反映するには BE の再起動が必要です。セッション変数 `enable_file_cache` も有効にする必要があります。バージョン 4.1.5 では BE の設定とセッション変数の両方のデフォルト値が `true` に変更されました。既存の明示的な設定と、永続化されたグローバル変数はそれぞれ確認してください。

#### `enable_ms_rpc_host_level_rate_limit_dry_run` {#enable_ms_rpc_host_level_rate_limit_dry_run}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされ、動的設定に対応します。BE から Meta Service への RPC に対するホスト単位のレート制限を、実際には待機せずに評価します。`enable_ms_rpc_host_level_rate_limit` とは独立しており、後者が `false` でも評価は実行されます。両方が `true` の場合は dry-run が優先されます。レート制限を実際に適用するには、`enable_ms_rpc_host_level_rate_limit` を有効にし、この設定を無効にしてください。
* デフォルト値: true

#### `enable_ms_backpressure_handling_dry_run` {#enable_ms_backpressure_handling_dry_run}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされ、動的設定に対応します。Meta Service の `MS_BUSY` 応答によって開始されるテーブル単位の適応的なレート制限を、実際には待機せずに評価します。`enable_ms_backpressure_handling` とは独立しており、両方が `true` の場合は dry-run が優先されます。テーブル単位のレート制限を実際に適用するには、`enable_ms_backpressure_handling` を有効にし、この設定を無効にしてください。
* デフォルト値: true

#### `cache_peer_read_failure_threshold` {#cache_peer_read_failure_threshold}

* 型: int32
* 説明: バージョン 4.2.0 以降でサポートされ、動的設定に対応します。ピアアドレスへの接続または RPC が連続して失敗した場合に、サーキットブレーカーを開くまでの失敗回数です。実効上の最小値は `1` です。このアドレス単位の状態は、異なる tablet に対するピア読み取りで共有され、到達できないノードへの接続試行を繰り返さないようにします。
* デフォルト値: 3

#### `cache_peer_read_circuit_open_seconds` {#cache_peer_read_circuit_open_seconds}

* 型: int32
* 説明: バージョン 4.2.0 以降でサポートされ、動的設定に対応します。開いたピアのサーキットブレーカーが、そのアドレスへの読み取りを拒否する時間を秒単位で指定します。負の値は `0` として扱われます。この期間が過ぎると、復旧を確認するための試行が 1 回許可されます。
* デフォルト値: 30

#### `delete_bitmap_store_v2_max_bytes_in_fdb` {#delete_bitmap_store_v2_max_bytes_in_fdb}

* 型: int64
* 説明: コンピュートとストレージの分離モードで、Delete Bitmap V2 を FDB に直接保存する場合の、シリアライズ後の最大サイズをバイト単位で指定します。動的設定に対応します。負でないしきい値を超える値は、代わりにオブジェクトストレージのファイルに保存されます。負の値は、このサイズに基づく退避を無効にします。バージョン 4.1.5 では、90000 バイトのチャンク内で追加のメッセージフィールド用の領域を確保するため、デフォルト値が `1024` から `89000` に引き上げられました。
* デフォルト値: 89000 (4.1.5 より前は 1024)

#### `enable_remove_agg_pre_rowsets_delete_bitmap_by_keys` {#enable_remove_agg_pre_rowsets_delete_bitmap_by_keys}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされ、動的設定に対応します。コンピュートとストレージの分離モードで、集約済みの過去の Delete Bitmap を置き換える際に、終了バージョンのレコードをキー単位で削除します。`false` にすると範囲削除を使用します。既存のクリーンアップでのレコード削除方法だけを変更し、追加のクリーンアップタスクは有効にしません。
* デフォルト値: true

#### `enable_remove_pre_rowsets_delete_bitmap_by_keys` {#enable_remove_pre_rowsets_delete_bitmap_by_keys}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされ、動的設定に対応します。コンピュートとストレージの分離モードで、集約範囲内の過去の Delete Bitmap をクリーンアップする際に、開始バージョンを含み、終了バージョンを含まない範囲のレコードをキー単位で削除します。`false` にすると範囲削除を使用します。既存のクリーンアップ用スイッチと前提条件は引き続き適用されます。
* デフォルト値: true

#### `file_cache_path` {#file_cache_path}

デフォルト: [{"path":"${DORIS_HOME}/file_cache"}]
* 説明: File Cache に使用するディスクパスとその他のパラメーターを配列で指定します。各ディスクに 1 つのエントリを使用します。`path` はディスクパスを指定し、`total_size` はキャッシュのサイズを制限します。-1 または 0 にすると、ディスク領域全体を使用します。
* 形式: [{"path":"/path/to/file_cache","total_size":21474836480,{"path":"/path/to/file_cache2","total_size":21474836480}]

#### `enable_async_file_cache_write` {#enable_async_file_cache_write}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。File Cache に非同期で書き込むかどうかを指定します。有効にすると、リモートデータを File Cache に書き戻す処理がバックグラウンドのスレッドプールに渡され、読み取り処理をブロックしなくなるため、キャッシュにないデータの読み取り遅延が減ります。
* デフォルト値: false

#### `async_file_cache_write_workers_per_disk` {#async_file_cache_write_workers_per_disk}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。File Cache に非同期で書き込む際、キャッシュ用ディスクごとに使用する書き込みスレッド数です。`enable_async_file_cache_write = true` の場合にのみ有効です。
* デフォルト値: 16

#### `async_file_cache_write_max_pending_bytes` {#async_file_cache_write_max_pending_bytes}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。File Cache への非同期書き込みを待つデータの合計サイズの上限をバイト単位で指定します。上限を超えた書き戻しリクエストは破棄されます。クエリの正しさには影響しませんが、データはキャッシュされません。`-1` は無制限を意味します。
* デフォルト値: -1

#### `enable_file_cache_write_from_s3_file_writer` {#enable_file_cache_write_from_s3_file_writer}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。オブジェクトストレージへの書き込みと同時にローカルの File Cache にもデータを書き込み、新しく書き込んだデータをキャッシュから直接読み取れるようにするかどうかを指定します。
* デフォルト値: true

#### `enable_file_cache_write_index_file_only` {#enable_file_cache_write_index_file_only}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。インデックスファイルだけを File Cache に書き込むかどうかを指定します。有効にすると、キャッシュ容量が限られている場合にインデックスを優先して保持できます。
* デフォルト値: false

#### `enable_cache_read_from_peer` {#enable_cache_read_from_peer}

* 型: bool
* 説明: ピアのキャッシュからの読み取りを制御するメインスイッチです。有効にすると、ローカルの File Cache にデータがない場合、まず別の BE（同じコンピュートグループまたは別のグループ）の File Cache からブロックを読み取ろうとします。どの BE にもない場合にのみ、オブジェクトストレージから読み取ります。同一グループ内とグループ間のピア読み取りはこのスイッチでまとめて制御され、グループ間の読み取りだけを無効にすることはできません。グループ間のピア読み取りはバージョン 4.2.0 以降でサポートされ、同バージョンで設定項目 `cache_read_from_peer_expired_seconds` は削除されました。[Peer Cache Read](../../compute-storage-decoupled/file-cache/file-cache-peer-read) を参照してください。
* デフォルト値: false (必要な場合に明示的に有効化)

#### `enable_peer_s3_race` {#enable_peer_s3_race}

* 型: bool
* 説明: バージョン 4.2.0 で追加されました。ピアからの読み取りとオブジェクトストレージからの読み取りを並行して開始し、先に得られた結果を使用するかどうかを指定します。無効にすると、ピア候補を順に試し、すべて失敗してからオブジェクトストレージを読み取ります。
* デフォルト値: true

#### `peer_race_hedge_delay_ms` {#peer_race_hedge_delay_ms}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。並行読み取り時にピア読み取りを先行させる時間をミリ秒単位で指定します。この時間内にピアから応答があれば、オブジェクトストレージへの読み取りは開始されません。`0` にすると両方の読み取りを同時に開始します。
* デフォルト値: 20

#### `max_concurrent_peer_races` {#max_concurrent_peer_races}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。単一 BE で同時に実行できる、ピアとオブジェクトストレージ間の並行読み取りの最大数です。上限を超えたキャッシュ未ヒットは、順次読み取られます。
* デフォルト値: 64

#### `peer_cache_fill_compute_group_id` {#peer_cache_fill_compute_group_id}

* 型: string
* 説明: バージョン 4.2.0 で追加されました。読み取りを要求する BE に設定します。グループ間のキャッシュ補充を担当するコンピュートグループの ID を指定します。これはコンピュートグループ名ではなく、`SHOW BACKENDS` の `Tag` 列にある `compute_group_id` です。選択されたピア候補がこのグループに属する場合、ピア自身にもブロックがなければ、オブジェクトストレージから取得して自身の File Cache に書き込むよう要求します。空文字列の場合は補充を使用しません。
* デフォルト値: ""

#### `enable_peer_server_cache_fill` {#enable_peer_server_cache_fill}

* 型: bool
* 説明: バージョン 4.2.0 で追加されました。キャッシュを提供する BE に設定します。補充フラグ付きのピア読み取りリクエストを受け付けるかどうかを指定します。無効にすると、ローカルにキャッシュされていないブロックは見つからないと報告され、要求元の BE はオブジェクトストレージから読み取ります。
* デフォルト値: true

#### `peer_server_cache_fill_timeout_ms` {#peer_server_cache_fill_timeout_ms}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。提供側で 1 回の補充を待つ最大時間をミリ秒単位で指定します。タイムアウトすると、要求元の BE はオブジェクトストレージから読み取ります。
* デフォルト値: 6000

#### `max_concurrent_peer_server_fills` {#max_concurrent_peer_server_fills}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。提供側で同時に実行できる補充の最大数です。上限を超える補充リクエストは拒否され、要求元の BE はオブジェクトストレージから読み取ります。
* デフォルト値: 32

#### `peer_rpc_failure_eviction_threshold` {#peer_rpc_failure_eviction_threshold}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。ピア候補で RPC が連続してこの回数失敗すると、候補リストから削除されます。
* デフォルト値: 3

#### `peer_all_miss_cooldown_threshold` {#peer_all_miss_cooldown_threshold}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。すべてのピア候補でキャッシュにデータがなかった読み取りが連続してこの回数発生すると、tablet はクールダウン期間に入ります。その間の読み取りは直接オブジェクトストレージに向かいます。
* デフォルト値: 5

#### `peer_all_miss_cooldown_duration_s` {#peer_all_miss_cooldown_duration_s}

* 型: int64
* 説明: バージョン 4.2.0 で追加されました。ピア読み取りのクールダウン期間を秒単位で指定します。
* デフォルト値: 300

#### `peer_candidate_expiry_s` {#peer_candidate_expiry_s}

* 型: int64
* 説明: バージョン 4.2.0 で追加されました。ピア候補のエントリが期限切れになるまでの時間を、最後に使用した時点から秒単位で指定します。期限切れのエントリはメモリから削除され、次のキャッシュ未ヒット時に FE から再取得されます。
* デフォルト値: 3600

#### `peer_candidate_cleanup_interval_s` {#peer_candidate_cleanup_interval_s}

* 型: int64
* 説明: バージョン 4.2.0 で追加されました。期限切れのピア候補を削除するバックグラウンドジョブの実行間隔を秒単位で指定します。
* デフォルト値: 3600

#### `peer_fetch_queue_timeout_ms` {#peer_fetch_queue_timeout_ms}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。ピア読み取りリクエストが提供側の処理キューで待機できる最大時間をミリ秒単位で指定します。それを超えて待機したリクエストは拒否され、要求元の BE は速やかにオブジェクトストレージから読み取ります。
* デフォルト値: 100

#### `brpc_peer_fetch_pool_threads` {#brpc_peer_fetch_pool_threads}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。提供側でピア読み取りリクエストを処理するスレッドプールのサイズです。データロードなど負荷の高い RPC のスレッドプールとは分離されています。`-1` は `max(64, 2 × CPU コア数)` を意味します。動的には変更できません。
* デフォルト値: -1

#### `brpc_peer_fetch_pool_max_queue_size` {#brpc_peer_fetch_pool_max_queue_size}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。提供側のピア読み取りスレッドプールのキューの長さです。`-1` は `max(4096, 128 × CPU コア数)` を意味します。動的には変更できません。
* デフォルト値: -1

#### `min_peer_race_s3_thread_num` / `max_peer_race_s3_thread_num` {#min_peer_race_s3_thread_num--max_peer_race_s3_thread_num}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。要求元でピアとオブジェクトストレージの並行読み取りを行う際、オブジェクトストレージからの読み取りに使用するスレッドプールの最小 / 最大スレッド数です。動的には変更できません。
* デフォルト値: 0 / 32

#### `s3_get_requests_per_second_per_core` / `s3_put_requests_per_second_per_core` {#s3_get_requests_per_second_per_core--s3_put_requests_per_second_per_core}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コアごとに計算する、オブジェクトストレージへの GET / PUT リクエストの QPS 制限です。負の値にするとこの方式を無効にし、従来の絶対トークン数の設定に戻ります。`0` は QPS を制限しないことを意味します。
* デフォルト値: -1

#### `s3_get_requests_per_second_max` / `s3_put_requests_per_second_max` {#s3_get_requests_per_second_max--s3_put_requests_per_second_max}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コア数から算出した GET / PUT の QPS に対する厳格な上限です。`0` 以下の値は上限なしを意味します。
* デフォルト値: 0

#### `s3_get_bytes_per_second_per_core` / `s3_put_bytes_per_second_per_core` {#s3_get_bytes_per_second_per_core--s3_put_bytes_per_second_per_core}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コアごとに計算する、オブジェクトストレージへの GET / PUT の帯域幅制限です。単位はコアごとのバイト/秒です。`0` 以下の値は帯域幅を制限しないことを意味します。
* デフォルト値: -1

#### `s3_get_bytes_per_second_max` / `s3_put_bytes_per_second_max` {#s3_get_bytes_per_second_max--s3_put_bytes_per_second_max}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コア数から算出した GET / PUT の帯域幅に対する厳格な上限です。単位はバイト/秒です。`0` 以下の値は上限なしを意味します。
* デフォルト値: 0

#### `s3_rate_limiter_cpu_cores_override` {#s3_rate_limiter_cpu_cores_override}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。上記のレート制限を算出するために使用する CPU コア数です。`0` 以下の値は、マシンのコア数を自動検出することを意味します。
* デフォルト値: 0

#### `s3_rate_limiter_log_interval` {#s3_rate_limiter_log_interval}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。オブジェクトストレージのレート制限が発動した際に出力するログエントリの最小間隔をミリ秒単位で指定します。
* デフォルト値: 1000

#### `file_cache_mem_storage_shard_num` {#file_cache_mem_storage_shard_num}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。File Cache のメモリストレージのシャード数です。並行アクセス時のロック競合を減らすために使用します。
* デフォルト値: 1024

#### `time_series_max_tablet_version_num` {#time_series_max_tablet_version_num}

* 型: int
* 説明: time-series compaction ポリシーを使用する単一 tablet のバージョン数を制限します。頻繁なデータロードや compaction の遅れによるバージョンの大量蓄積を防ぎます。上限を超えると、データロードタスクが拒否されます。
* デフォルト値: 20000
