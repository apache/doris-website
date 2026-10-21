---
{
    "title": "BE の設定",
    "language": "ja",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "このドキュメントでは、主に BE の設定項目について説明します。"
}
---

# BE の設定 {#be-configuration}

このドキュメントでは、主に BE の設定項目について説明します。

BE の設定ファイル `be.conf` は通常、BE のデプロイ先にある `conf/` ディレクトリに格納されます。バージョン 0.14 では、別の設定ファイル `be_custom.conf` が導入されます。この設定ファイルには、運用中にユーザーが動的に設定し、永続化した設定項目が記録されます。

BE プロセスは起動後、まず `be.conf` の設定項目を読み込み、次に `be_custom.conf` の設定項目を読み込みます。`be_custom.conf` の設定項目は、`be.conf` にある同じ設定項目を上書きします。

`be_custom.conf` ファイルの場所は、`be.conf` の設定項目 `custom_config_dir` で指定できます。

## 設定項目の確認 {#view-configuration-items}

BE の設定項目を確認する方法は 2 つあります。

1. BE の Web ページ

    BE の Web ページにアクセスすると、現在の設定項目を確認できます。

    `http://be_host:be_webserver_port/varz`

2. コマンドによる確認

   MySQL クライアントで次のコマンドを実行すると、BE の設定項目を確認できます。具体的な構文については [SHOW-CONFIG](../../sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG) を参照してください。

    `SHOW BACKEND CONFIG;`

    結果の各列の意味は次のとおりです。

    1. BackendId: backend の ID。
    2. Host: backend の IP アドレス。
    3. Key: 設定項目の名前。
    4. Value: 現在の設定値。
    5. Type: 整数や文字列など、設定値の型。
    6. IsMutable: 動的に設定できるかどうか。true の場合は実行時に動的に設定できます。false の場合は `be.conf` でのみ設定でき、BE の再起動後に反映されます。

## 設定項目の変更 {#set-configuration-items}

BE の設定項目を変更する方法は 2 つあります。

1. 静的な設定

   `conf/be.conf` ファイルに設定項目を追加し、値を指定します。`be.conf` の設定項目は BE の起動時に読み込まれます。`be.conf` にない設定項目にはデフォルト値が使用されます。

2. 動的な設定

   BE の起動後、次のコマンドで設定項目を動的に変更できます。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}
    ```

   バージョン 0.13 以前では、この方法で変更した設定項目は BE プロセスを再起動すると無効になります。バージョン 0.14 以降では、次のコマンドで変更した設定を永続化できます。変更した設定項目は `be_custom.conf` ファイルに保存されます。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}\&persist=true
    ```

## 例 {#examples}

1. `max_base_compaction_threads` を静的に変更する

   `be.conf` ファイルに次の行を追加します。

   ```max_base_compaction_threads=5```

   その後、BE プロセスを再起動すると設定が反映されます。

2. `streaming_load_max_mb` を動的に変更する

   BE の起動後、次のコマンドで設定項目 `streaming_load_max_mb` を動的に変更します。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024
    ```

   次の戻り値は、設定が成功したことを示します。

    ```
    {
        "status": "OK",
        "msg": ""
    }
    ```

   この設定は BE を再起動すると無効になります。変更結果を永続化するには、次のコマンドを使用します。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024\&persist=true
    ```

## 設定項目 {#configurations}

### サービス {#services}

#### `deploy_mode` {#deploy_mode}

* 型: string
* 説明: BE の実行モード。`cloud` はストレージとコンピュートを分離したモードを示します。
* デフォルト値: ""

#### `bvar_max_dump_multi_dimension_metric_num` {#bvar_max_dump_multi_dimension_metric_num}

* 型: string
* 説明: バージョン 4.1.5 以降でサポートされます。`/brpc_metrics` からエクスポートする多次元 bvar メトリクスのサンプル数の上限です。`0` に設定すると、これらのサンプルは無効になります。変更を反映するには BE の再起動が必要です。
* デフォルト値: 5000

#### `be_port` {#be_port}

* 型: int32
* 説明: FE からのリクエストを受信する、BE 上の thrift サーバーのポートです。
* デフォルト値: 9060

#### `heartbeat_service_port` {#heartbeat_service_port}

* 型: int32
* 説明: FE からのハートビートを受信する、BE 上のハートビートサービスのポート（thrift）です。
* デフォルト値: 9050

#### `webserver_port` {#webserver_port}

* 型: int32
* 説明: BE 上の HTTP サーバーのサービスポートです。
* デフォルト値: 8040

#### `brpc_port` {#brpc_port}

* 型: int32
* 説明: BE 間の通信に使用する、BE 上の BRPC のポートです。
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

* 説明: 複数の IP アドレスを持つサーバーの選択方法を指定します。このリストに一致する IP アドレスは最大 1 つである必要があります。リストは、10.10.10.0/24 のような CIDR 表記をセミコロンで区切ったものです。このルールに一致する IP アドレスがない場合は、いずれかがランダムに選択されます。
* デフォルト値: 空欄

#### `storage_root_path` {#storage_root_path}

* 型: string

* 説明: データのルートパスを `;` で区切って指定します。各ルートパスには、HDD または SSD のストレージメディアを指定できます。また、各ルートパスの末尾に `,` で区切って容量制限を追加できます。SSD と HDD のディスクを混在させない場合は、以下の例 1 および例 2 の方法で設定する必要はなく、ストレージディレクトリだけを指定すれば十分です。FE のデフォルトのストレージメディア設定を変更する必要もありません。

  例 1: `storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD;/home/disk2/doris`

    - 1./home/disk1/doris.HDD は、ストレージメディアが HDD であることを示します。
    - 2./home/disk2/doris.SSD は、ストレージメディアが SSD であることを示します。
    - 3./home/disk2/doris は、デフォルトでストレージメディアが HDD であることを示します。

  例 2: `storage_root_path=/home/disk1/doris,medium:hdd;/home/disk2/doris,medium:ssd`

    - 1./home/disk1/doris,medium:hdd は、ストレージメディアが HDD であることを示します。
    - 2./home/disk2/doris,medium:ssd は、ストレージメディアが SSD であることを示します。

* デフォルト値: ${DORIS_HOME}/storage

#### `heartbeat_service_thread_count` {#heartbeat_service_thread_count}

* 型: int32
* 説明: BE 上でハートビートサービスを実行するスレッド数です。デフォルトは 1 で、変更は推奨されません。
* デフォルト値: 1

#### `ignore_broken_disk` {#ignore_broken_disk}

* 型: bool
* 説明: BE の起動時に、``storage_root_path`` で設定されたすべてのパスを確認します。

    -  `ignore_broken_disk=true`

  パスが存在しないか、そのパスのファイル（障害のあるディスク）を読み書きできない場合、そのパスを無視します。ほかに利用可能なパスがあれば、起動は中断されません。

    -  `ignore_broken_disk=false`

  パスが存在しないか、そのパスのファイル（障害のあるディスク）を読み書きできない場合、起動に失敗してプロセスが終了します。

* デフォルト値: false

#### `mem_limit` {#mem_limit}

* 型: string
* 説明: BE プロセスが使用できるサーバーの最大メモリの割合を制限します。BE がマシンのメモリを過剰に占有するのを防ぐために使用します。このパラメータは 0 より大きくする必要があります。割合が 100% を超える場合、値は 100% になります。
* デフォルト値: 90%

#### `cluster_id` {#cluster_id}

* 型: int32
* 説明: BE が所属するクラスターの ID を設定します。
    - 通常、この値はハートビートを通じて FE から BE に渡されるため、設定する必要はありません。BE が特定の Doris クラスターに所属することが確定している場合は設定できます。その際は、データディレクトリ内の cluster_id ファイルも変更し、このパラメータと同じ値にする必要があります。
* デフォルト値: -1

#### `custom_config_dir` {#custom_config_dir}

* 説明: `be_custom.conf` ファイルの場所を指定します。デフォルトでは `conf/` ディレクトリにあります。
    - デプロイ環境によっては、システムのアップグレード時に `conf/` ディレクトリが上書きされ、ユーザーが変更した設定項目が失われることがあります。この場合、`be_custom.conf` を別の指定ディレクトリに保存すると、設定ファイルの上書きを防げます。
* デフォルト値: 空欄

#### `trash_file_expire_time_sec` {#trash_file_expire_time_sec}

* 説明: ごみ箱のクリーンアップ間隔は 24 時間です。ディスク容量が不足している場合、trash 内のファイルの保持期間はこのパラメータに従わないことがあります。
* デフォルト値: 86400

#### `es_http_timeout_ms` {#es_http_timeout_ms}

* 説明: HTTP 経由で ES に接続する際のタイムアウト時間です。
* デフォルト値: 5000 (ms)

#### `es_scroll_keepalive` {#es_scroll_keepalive}

* 説明: ES scroll の keep-alive 保持時間です。
* デフォルト値: 5 (m)

#### `external_table_connect_timeout_sec` {#external_table_connect_timeout_sec}

* 型: int32
* 説明: ODBC テーブルなどの外部テーブルへの接続を確立する際のタイムアウトです。
* デフォルト値: 5 秒

#### `pipeline_status_report_interval` {#pipeline_status_report_interval}

* 説明: profile の報告間隔です。
* デフォルト値: 5 秒

#### `brpc_max_body_size` {#brpc_max_body_size}

* 説明: 主に brpc のパラメータ `max_body_size` を変更するための設定です。

  - クエリが失敗し、BE ログに `body_size is too large` というエラーメッセージが表示されることがあります。これは SQL のモードが「multi distinct + no group by + 1T を超えるデータ」の場合に発生する可能性があります。このエラーは、brpc のパケットサイズが設定値を超えたことを示します。設定値を引き上げると、このエラーを回避できます。

#### `brpc_socket_max_unwritten_bytes` {#brpc_socket_max_unwritten_bytes}

* 説明: 主に brpc のパラメータ `socket_max_unwritten_bytes` を変更するための設定です。
  - クエリが失敗し、BE ログに `The server is overcrowded` というエラーメッセージが表示されることがあります。これは送信側でバッファリングすべきメッセージが多すぎることを意味し、SQL が大きな bitmap 値を送信する必要がある場合に発生する可能性があります。設定値を引き上げると、このエラーを回避できます。

#### `transfer_large_data_by_brpc` {#transfer_large_data_by_brpc}

* 型: bool
* 説明: Tuple/Block データの長さが 1.8G を超えた場合に、protoBuf リクエストをシリアライズし、Tuple/Block データを controller attachment に格納して HTTP brpc 経由で送信するかどうかを制御します。これは protoBuf リクエストの長さが 2G を超えた場合に発生する `Bad request, error_text=[E1003]Fail to compress request` というエラーを避けるためのものです。以前のバージョンでは、Tuple/Block データを attachment に格納した後、デフォルトの baidu_std brpc 経由で送信していましたが、attachment が 2G を超えると切り捨てられていました。HTTP brpc 経由の送信には 2G の制限はありません。
* デフォルト値: true

#### `brpc_num_threads` {#brpc_num_threads}

* 説明: 主に brpc の bthread 数を変更するための設定です。デフォルト値は 256 です。
  - この設定値を大きくすると、QPS 性能が向上する場合があります。詳しくは `https://github.com/apache/incubator-brpc/blob/master/docs/cn/benchmark.md` を参照してください。
* デフォルト値: 256

#### `thrift_rpc_timeout_ms` {#thrift_rpc_timeout_ms}

* 説明: thrift のデフォルトのタイムアウト時間です。
* デフォルト値: 60000

#### `thrift_client_retry_interval_ms` {#thrift_client_retry_interval_ms}

* 型: int64
* 説明: FE の thrift サーバーでリクエストが集中するのを防ぐため、BE の thrift クライアントの再試行間隔を設定します。単位は ms です。
* デフォルト値: 1000

#### `thrift_connect_timeout_seconds` {#thrift_connect_timeout_seconds}

* 説明: thrift クライアントのデフォルトの接続タイムアウトです。
* デフォルト値: 3 (s)

#### `thrift_server_type_of_fe` {#thrift_server_type_of_fe}

* 型: string
* 説明: FE の Thrift サービスが使用するサービスモデルを指定します。型は string で、大文字と小文字は区別されません。このパラメータは、FE の thrift_server_type パラメータの設定と一致させる必要があります。現在指定できる値は `THREADED` と `THREAD_POOL` です。

    - `THREADED` の場合、ノンブロッキング I/O モデルです。

    - `THREAD_POOL` の場合、ブロッキング I/O モデルです。

#### `thrift_max_message_size` {#thrift_max_message_size}

デフォルト: 100MB

thrift サーバーが受信するメッセージの最大サイズです。単位はバイトです。クライアントが送信したメッセージのサイズがこの制限を超えると、Thrift サーバーはリクエストを拒否して接続を閉じます。その結果、クライアントでは「connection has been closed by peer.」というエラーが発生します。この場合は、このパラメータを引き上げてみてください。

#### `txn_commit_rpc_timeout_ms` {#txn_commit_rpc_timeout_ms}

* 説明: txn の送信 RPC のタイムアウトです。
* デフォルト値: 60,000 (ms)

#### `txn_map_shard_size` {#txn_map_shard_size}

* 説明: txn_map_lock の分割サイズです。値は 2^n（n=0,1,2,3,4）です。txn の管理性能を向上させるための設定です。
* デフォルト値: 128

#### `txn_shard_size` {#txn_shard_size}

* 説明: txn_lock のシャードサイズです。値は 2^n（n=0,1,2,3,4）です。txn の送信と公開の性能を向上させるための設定です。
* デフォルト値: 1024

#### `unused_rowset_monitor_interval` {#unused_rowset_monitor_interval}

* 説明: 期限切れの Rowset を削除する間隔です。
* デフォルト値: 30 (s)

#### `max_client_cache_size_per_host` {#max_client_cache_size_per_host}

* 説明: ホストごとのクライアントキャッシュの最大数です。BE には複数のクライアントキャッシュがありますが、現在は同じキャッシュサイズの設定を使用します。必要に応じて、別々の設定で各クライアントキャッシュを指定してください。
* デフォルト値: 10

#### `string_type_length_soft_limit_bytes` {#string_type_length_soft_limit_bytes}

* 型: int32
* 説明: String 型の最大長に対するソフトリミットです。
* デフォルト値: 1,048,576

#### `big_column_size_buffer` {#big_column_size_buffer}

* 型: int64
* 説明: ODBC 外部テーブルを使用するとき、ODBC ソーステーブルの列型が HLL、CHAR、VARCHAR のいずれかで、その列の値の長さがこの値を超えると、クエリで 'column value length longer than buffer length' というエラーが報告されます。この値を引き上げることができます。
* デフォルト値: 65535

#### `small_column_size_buffer` {#small_column_size_buffer}

* 型: int64
* 説明: ODBC 外部テーブルを使用するとき、ODBC ソーステーブルの列型が HLL、CHAR、VARCHAR のいずれでもなく、その列の値の長さがこの値を超えると、クエリで 'column value length longer than buffer length' というエラーが報告されます。この値を引き上げることができます。
* デフォルト値: 100

### クエリ {#query}

#### `ignore_not_found_file_in_external_table` {#ignore_not_found_file_in_external_table}

* 型: bool
* 説明: 外部テーブルのリーダーが、見つからないファイルをスキップできるかどうかを指定します。動的な設定に対応しています。バージョン 4.1.5 以降、コミット済みの Iceberg スナップショットでデータファイルまたは delete ファイルが欠けている場合は、この設定が `true` でもクエリが失敗します。不完全なスナップショットを黙って返すことを防ぐためです。
* デフォルト値: true

#### `parquet_metadata_size_limit` {#parquet_metadata_size_limit}

* 型: int64
* 説明: バージョン 4.1.5 以降でサポートされます。ネイティブ Parquet V2 リーダーのファイルフッターについて、シリアライズされたメタデータの最大サイズをバイト単位で指定します。`0` より大きい値にする必要があります。上限を超えると `Parquet v2 footer size ... exceeds metadata limit ...` が返されます。動的な設定に対応しています。大きなフッターを持つ有効なファイルを扱う場合は、メモリの許容範囲内で値を引き上げてください。
* デフォルト値: 268435456 (256 MiB)

#### `fragment_mgr_asynic_work_pool_queue_size` {#fragment_mgr_asynic_work_pool_queue_size}

* 説明: 単一ノードで処理できる非同期作業の上限です。
* デフォルト値: 4096

#### `fragment_mgr_asynic_work_pool_thread_num_min` {#fragment_mgr_asynic_work_pool_thread_num_min}

* 説明: 非同期作業を実行するスレッド数です。デフォルトの最小スレッド数は 16 です。
* デフォルト値: 16

#### `fragment_mgr_asynic_work_pool_thread_num_max` {#fragment_mgr_asynic_work_pool_thread_num_max}

* 説明: 非同期作業の状況に応じてスレッドを動的に作成します。作成するスレッドの上限は 512 です。
* デフォルト値: 512

#### `doris_scanner_row_num` {#doris_scanner_row_num}

* 説明: 各スキャンスレッドが 1 回の実行で返すデータ行数の上限です。
* デフォルト値: 16384

#### `doris_scanner_row_bytes` {#doris_scanner_row_bytes}

* 説明: 1 回の読み取りで処理する fragment の行データのバイト数です。
    - 注意: テーブルの列数が多く、`select *` が停止したように見える場合は、この設定を調整できます。
* デフォルト値: 10485760

#### `doris_scanner_thread_pool_queue_size` {#doris_scanner_thread_pool_queue_size}

* 型: int32
* 説明: Scanner スレッドプールのキュー長です。Doris のスキャンタスクでは、各 Scanner がスレッドタスクとしてプールに送られ、実行を待ちます。送信されたタスクの数がスレッドプールのキュー長を超えると、その後のタスクはキューに空きができるまでブロックされます。
* デフォルト値: 102400

#### `doris_scanner_thread_pool_thread_num` {#doris_scanner_thread_pool_thread_num}

* 型: int32
* 説明: Scanner スレッドプールのスレッド数です。Doris のスキャンタスクでは、各 Scanner がスレッドタスクとしてプールに送られ、実行されます。このパラメータで Scanner スレッドプールのサイズを決めます。
* デフォルト値: CPU コア数に応じて決まり、`max(48, 2 * num_of_cpu_cores)` に等しくなります。

#### `doris_max_remote_scanner_thread_pool_thread_num` {#doris_max_remote_scanner_thread_pool_thread_num}

* 型: int32
* 説明: Remote scanner スレッドプールの最大スレッド数です。このプールは、すべての外部データソースのスキャンタスクに使用されます。
* デフォルト: 512

#### `exchg_node_buffer_size_bytes` {#exchg_node_buffer_size_bytes}

* 型: int32
* 説明: ExchangeNode ノードの Buffer キューのサイズです。単位はバイトです。Sender 側から送信されたデータ量が ExchangeNode の Buffer サイズを超えると、Buffer に書き込み可能な空きができるまで、その後のデータ送信はブロックされます。
* デフォルト値: 10485760

#### `doris_scan_range_max_mb` {#doris_scan_range_max_mb}

* 型: int32
* 説明: 各 OlapScanner が読み取るデータ量の上限です。
* デフォルト値: 1024

### compaction {#compaction}

#### `disable_auto_compaction` {#disable_auto_compaction}

* 型: bool
* 説明: 自動 compaction タスクを無効にするかどうかを指定します。
  - 通常は false のままにします。デバッグ環境やテスト環境で compaction タスクを手動操作する場合は、この設定を有効にできます。
* デフォルト値: false

#### `enable_vertical_compaction` {#enable_vertical_compaction}

* 型: bool
* 説明: vertical compaction を有効にするかどうかを指定します。
* デフォルト値: true

#### `vertical_compaction_num_columns_per_group` {#vertical_compaction_num_columns_per_group}

* 型: int32
* 説明: vertical compaction での各グループの列数です。
* デフォルト値: 5

#### `vertical_compaction_max_row_source_memory_mb` {#vertical_compaction_max_row_source_memory_mb}

* 型: int32
* 説明: vertical compaction での row_source_buffer の最大メモリ使用量です。単位は MB です。
* デフォルト値: 200

#### `vertical_compaction_max_segment_size` {#vertical_compaction_max_segment_size}

* 型: int32
* 説明: vertical compaction で生成する segment ファイルの最大サイズです。単位は m バイトです。
* デフォルト値: 268435456

#### `enable_ordered_data_compaction` {#enable_ordered_data_compaction}

* 型: bool
* 説明: ordered data compaction を有効にするかどうかを指定します。
* デフォルト値: true

#### `ordered_data_compaction_min_segment_size` {#ordered_data_compaction_min_segment_size}

* 型: int32
* 説明: ordered data compaction での入力 rowset の最小 segment サイズです。単位は m バイトです。
* デフォルト値: 10485760

#### `max_base_compaction_threads` {#max_base_compaction_threads}

* 型: int32
* 説明: base compaction スレッドプールの最大スレッド数です。-1 はディスクごとに 1 スレッドを意味します。
* デフォルト値: 4

#### `generate_compaction_tasks_interval_ms` {#generate_compaction_tasks_interval_ms}

* 説明: compaction タスクを生成する最小間隔（ms）です。
* デフォルト値: 10 (ms)

#### `base_compaction_min_rowset_num` {#base_compaction_min_rowset_num}

* 説明: BaseCompaction の実行条件の 1 つで、Cumulative ファイル数のしきい値です。この値に達すると BaseCompaction が実行されます。
* デフォルト値: 5

#### `base_compaction_min_data_ratio` {#base_compaction_min_data_ratio}

* 説明: BaseCompaction の実行条件の 1 つで、Cumulative ファイルのサイズが Base ファイルに対して占める割合です。
* デフォルト値: 0.3 (30%)

#### `total_permits_for_compaction_score` {#total_permits_for_compaction_score}

* 型: int64
* 説明: すべての compaction タスクが保持する「permits」の上限です。この設定で compaction のメモリ消費量を制限できます。
* デフォルト値: 10000
* 動的な変更: 可能

#### `compaction_promotion_size_mbytes` {#compaction_promotion_size_mbytes}

* 型: int64
* 説明: cumulative compaction の出力 rowset の合計ディスクサイズがこの設定値を超えると、その rowset は base compaction の対象になります。単位は m バイトです。
  - 一般に、この設定が 2G 未満の場合は、cumulative compaction に時間がかかりすぎてバージョンが滞留するのを防げます。
* デフォルト値: 1024

#### `compaction_promotion_ratio` {#compaction_promotion_ratio}

* 型: double
* 説明: cumulative compaction の出力 rowset の合計ディスクサイズが、base バージョンの rowset に対する設定割合を超えると、その rowset は base compaction の対象になります。
  - 一般に、設定値は 0.1 以下、0.02 以上が推奨されます。
* デフォルト値: 0.05

#### `compaction_promotion_min_size_mbytes` {#compaction_promotion_min_size_mbytes}

* 型: int64
* 説明: cumulative compaction の出力 rowset の合計ディスクサイズがこの設定値より小さい場合、その rowset は base compaction の対象にならず、引き続き cumulative compaction の対象になります。単位は m バイトです。
  - 一般に、設定値は 512m 以内にします。大きすぎると初期の base バージョンが小さいままとなり、base compaction が実行されません。
* デフォルト値: 128

#### `compaction_min_size_mbytes` {#compaction_min_size_mbytes}

* 型: int64
* 説明: cumulative compaction でマージ対象として選ばれた rowset のディスクサイズがこの設定値より大きい場合は、level policy に従って分割してマージします。小さい場合は直接マージします。単位は m バイトです。
  - 一般に、設定値は 128m 以内にします。大きくしすぎると、cumulative compaction の書き込み増幅が増えます。
* デフォルト値: 64

#### `default_rowset_type` {#default_rowset_type}

* 型: string
* 説明: BE がデフォルトで選択するストレージ形式を指定します。設定可能な値は "**ALPHA**" と "**BETA**" です。主に次の 2 つの役割があります。
  - テーブルの storage_format が Default に設定されている場合、この設定に基づいて BE のストレージ形式を選択します。
  - BE が Compaction を実行するときのストレージ形式を選択します。
* デフォルト値: BETA

#### `cumulative_compaction_min_deltas` {#cumulative_compaction_min_deltas}

* 説明: cumulative compaction の戦略で使用する差分ファイルの最小数です。
* デフォルト値: 5

#### `cumulative_compaction_max_deltas` {#cumulative_compaction_max_deltas}

* 説明: cumulative compaction の戦略で使用する差分ファイルの最大数です。
* デフォルト値: 1000

#### `base_compaction_trace_threshold` {#base_compaction_trace_threshold}

* 型: int32
* 説明: base compaction のトレース情報をログに記録するしきい値です。単位は秒です。
* デフォルト値: 10

Base compaction は長時間かかるバックグラウンドタスクです。この設定は、トレース情報をログに記録するしきい値です。ログファイルのトレース情報は次のようになります。

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
* 説明: cumulative compaction のトレース情報をログに記録するしきい値です。単位は秒です。
  - `base_compaction_trace_threshold` と同様です。
* デフォルト値: 2

#### `compaction_task_num_per_disk` {#compaction_task_num_per_disk}

* 型: int32
* 説明: ディスク（HDD）ごとに並列実行する compaction タスクの数です。
* デフォルト値: 4

#### `compaction_task_num_per_fast_disk` {#compaction_task_num_per_fast_disk}

* 型: int32
* 説明: 高速ディスク（SSD）ごとに並列実行する compaction タスクの数です。
* デフォルト値: 8

#### `cumulative_compaction_rounds_for_each_base_compaction_round` {#cumulative_compaction_rounds_for_each_base_compaction_round}

* 型: int32
* 説明: compaction タスクの生成時、base compaction の各ラウンドに対して実行する cumulative compaction のラウンド数です。
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
* 説明: segment 数がこのしきい値を超えると、segment compaction が実行されます。また、単一の segment compaction タスクに含める元の segment の最大数も制限します。
* デフォルト値: 10

#### `segcompaction_candidate_max_rows` {#segcompaction_candidate_max_rows}

* 型: int32
* 説明: 1 つの入力 segment に許容される最大行数です。これより大きい segment はスキップされます。
* デフォルト値: 1048576

#### `segcompaction_candidate_max_bytes` {#segcompaction_candidate_max_bytes}

* 型: int64
* 説明: 1 つの入力 segment に許容される最大ファイルサイズです。これより大きい segment はスキップされます。
* デフォルト値: 104857600

#### `segcompaction_task_max_rows` {#segcompaction_task_max_rows}

* 型: int32
* 説明: 単一の segcompaction タスクに許容される合計行数の上限です。
* デフォルト値: 1572864

#### `segcompaction_task_max_bytes` {#segcompaction_task_max_bytes}

* 型: int64
* 説明: 単一の segcompaction タスクに許容される合計ファイルサイズの上限です。
* デフォルト値: 157286400

#### `segcompaction_num_threads` {#segcompaction_num_threads}

* 型: int32
* 説明: グローバルの segcompaction スレッドプールのサイズです。
* デフォルト値: 5

#### `disable_compaction_trace_log` {#disable_compaction_trace_log}

* 型: bool
* 説明: compaction のトレースログを無効にします。
  - true に設定すると、`cumulative_compaction_trace_threshold` と `base_compaction_trace_threshold` は機能せず、ログが無効になります。
* デフォルト値: true

#### `pick_rowset_to_compact_interval_sec` {#pick_rowset_to_compact_interval_sec}

* 型: int64
* 説明: compaction 対象の rowset を選択する時間間隔です。単位は秒です。
* デフォルト値: 86400

#### `update_replica_infos_interval_seconds` {#update_replica_infos_interval_seconds}

* 説明: ピアレプリカ情報を更新する最小間隔（s）です。
* デフォルト値: 60 (s)

#### `cold_data_compaction_score_threshold` {#cold_data_compaction_score_threshold}

* 型: int32
* 説明: コールドデータの compaction を実行する前に必要な compaction score の最小しきい値です。コールドデータの compaction score がこのしきい値を超えると、compaction が検討されます。この値を調整すると、リモートストレージにあるコールドデータの compaction の頻度と積極度を制御できます。バージョン 3.1.3 以降でサポートされます。
* デフォルト値: 100

#### `cold_data_compaction_thread_num` {#cold_data_compaction_thread_num}

* 型: int32
* 説明: コールドデータの compaction に使用するスレッド数です。この設定でタスクの並列度を制御します。値を大きくすると同時に実行できるタスクが増え、スループットが向上する可能性がありますが、リソース使用量も増えます。
* デフォルト値: 2

#### `cold_data_compaction_interval_sec` {#cold_data_compaction_interval_sec}

* 型: int32
* 説明: コールドデータの compaction を検討する間隔です。単位は秒です。間隔を短くすると、クリーンアップが早まる可能性がありますが、リソース消費量が増えます。
* デフォルト値: 1800 (秒)

#### `enable_compaction_pause_on_high_memory` {#enable_compaction_pause_on_high_memory}

* 型: bool
* 説明: プロセスのメモリ使用量が多いときに compaction タスクを一時停止するかどうかを指定します。動的に変更できます。
  - 有効にすると、メモリが逼迫した際に BE は compaction を一時停止し、クエリとデータロードを優先します。
  - ただし、一時停止すると compaction score が高い tablet のマージがさらに難しくなり、解消したかったメタデータとメモリの滞留を悪化させます。**バージョン 4.0.8 から、デフォルト値は `true` から `false` に変更されました**。そのため、デフォルトではメモリ使用量が多くても compaction は一時停止しません。
  - 従来の動作を維持するには、`true` に戻してください。
* デフォルト値: false（4.0.8 より前は true）

### データロード {#load}

#### `request_cdc_client_timeout_ms` {#request_cdc_client_timeout_ms}

* 型: int32
* 説明: CDC クライアントのリクエストタイムアウトです。単位はミリ秒です。動的な設定に対応しています。バージョン 4.1.5 では、時間のかかる CDC リクエストに対応するため、デフォルト値が `60000` から `120000` に引き上げられました。
* デフォルト値: 120000（4.1.5 より前は 60000）

#### `enable_table_memtable_flush_backpressure` {#enable_table_memtable_flush_backpressure}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。この BE 上で、あるテーブルのフラッシュ待ち MemTable が多すぎる場合、そのテーブルへの新しい書き込みをブロックするかどうかを指定します。FE の設定 `enable_adaptive_random_bucket_load` と併用し、adaptive random bucket load 中に MemTable が蓄積してメモリ使用量が増えるのを防ぎます。
* デフォルト値: true

#### `table_memtable_flush_pending_count_limit` {#table_memtable_flush_pending_count_limit}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。この BE 上で、単一テーブルについてフラッシュ待ちとなる MemTable の最大数です。上限を超えると、上限を下回るまで新しい書き込みがブロックされます。`enable_table_memtable_flush_backpressure = true` の場合にのみ有効です。
* デフォルト値: 10

#### `group_commit_max_wal_num_per_table` {#group_commit_max_wal_num_per_table}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。単一テーブルに存在できる Group Commit WAL ファイルの最大数です。`0` は制限なしを意味します。WAL のリプレイが繰り返し失敗して WAL がこの上限を超えて蓄積すると、そのテーブルに対する `async_mode` の Group Commit データロードは、`Too many group commit async WALs for table ...` のようなメッセージを含む `EXCEEDED_LIMIT` エラーで拒否されます。この制限により、WAL が無制限に増えてディスクを使い切ることを防ぎます。
* デフォルト値: 10

#### `enable_stream_load_record` {#enable_stream_load_record}

* 型: bool
* 説明: Stream Load の記録機能を有効にするかどうかを指定します。デフォルトは false です。
* デフォルト値: false

#### `load_data_reserve_hours` {#load_data_reserve_hours}

* 説明: mini load で使用します。この時間が経過すると、mini load のデータファイルが削除されます。
* デフォルト値: 4 (h)

#### `push_worker_count_high_priority` {#push_worker_count_high_priority}

* 説明: HIGH 優先度のタスクを処理するデータロード用スレッド数です。
* デフォルト値: 3

#### `push_worker_count_normal_priority` {#push_worker_count_normal_priority}

* 説明: NORMAL 優先度のタスクを処理するデータロード用スレッド数です。
* デフォルト値: 3

#### `enable_single_replica_load` {#enable_single_replica_load}

* 説明: 単一レプリカのデータロード機能を有効にするかどうかを指定します。
* デフォルト値: true

#### `load_error_log_reserve_hours` {#load_error_log_reserve_hours}

* 説明: この時間が経過すると、データロードのエラーログが削除されます。
* デフォルト値: 48 (h)

#### `load_error_log_limit_bytes` {#load_error_log_limit_bytes}

* 説明: データロードのエラーログがこの値を超えると、切り詰められます。
* デフォルト値: 209715200 (byte)

#### `load_process_max_memory_limit_percent` {#load_process_max_memory_limit_percent}

* 説明: 単一ノード上のすべてのデータロードスレッドが占めるメモリ上限の割合です。デフォルトは 50% です。
  - ユーザーが Doris をアップグレードした際にデータロード性能に影響しないよう、これらのデフォルト値は大きめに設定されています。必要に応じて、適切な値を設定してください。
* デフォルト値: 50 (%)

#### `load_process_soft_mem_limit_percent` {#load_process_soft_mem_limit_percent}

* 説明: ソフトリミットは、単一ノードのデータロード用メモリ上限に対する割合です。たとえば、すべてのデータロードタスクのメモリ上限が 20GB の場合、ソフトリミットはデフォルトでその 50%、つまり 10GB です。メモリ使用量がソフトリミットを超えると、最も多くメモリを消費しているジョブが選ばれ、フラッシュによってメモリが解放されます。デフォルトは 50% です。
* デフォルト値: 50 (%)

#### `slave_replica_writer_rpc_timeout_sec` {#slave_replica_writer_rpc_timeout_sec}

* 型: int32
* 説明: 単一レプリカのデータロードで使用する、master replica と slave replica 間の brpc タイムアウトを変更する設定です。
* デフォルト値: 60

#### `max_segment_num_per_rowset` {#max_segment_num_per_rowset}

* 型: int32
* 説明: データロード時に新しく生成される rowset の segment 数を制限します。しきい値を超えると、データロードはエラー -238 で失敗します。segment が多すぎると compaction が大量のメモリを消費し、OOM エラーを引き起こす可能性があります。
* デフォルト値: 200

#### `high_priority_flush_thread_num_per_store` {#high_priority_flush_thread_num_per_store}

* 型: int32
* 説明: 優先度の高いデータロードタスクに割り当てる、ストアパスごとのフラッシュスレッド数です。
* デフォルト値: 1

#### `routine_load_consumer_pool_size` {#routine_load_consumer_pool_size}

* 型: int32
* 説明: Routine Load が使用するデータコンシューマーのキャッシュ数です。
* デフォルト値: 10

#### `multi_table_batch_plan_threshold` {#multi_table_batch_plan_threshold}

* 型: int32
* 説明: 単一ストリームから複数テーブルへのデータロードに使用します。Kafka から受信したメッセージのバッチサイズがこのしきい値を超えると、関連するすべてのテーブルのプランを要求します。
* デフォルト値: 200

#### `multi_table_max_wait_tables` {#multi_table_max_wait_tables}

* 型: int32
* 説明: 単一ストリームから複数テーブルへのデータロードに使用します。Kafka からメッセージのバッチを受信した際、プランを待っているテーブルの数がこのしきい値を超えると、関連するすべてのテーブルのプランを要求します。このパラメータは、多数のプランを一度に要求して実行することを避けるためのものです。データロード中に複数テーブルを小さなバッチで処理すると、単一 RPC の負荷を軽減し、データ処理のリアルタイム性を高められます。
* デフォルト値: 5

#### `single_replica_load_download_num_workers` {#single_replica_load_download_num_workers}

* 型: int32
* 説明: 単一レプリカのデータロードで使用する、segment ダウンロード用 HTTP ワーカースレッド数を変更します。データロードの同時実行数が増えた場合、このパラメータを調整して Slave replica が Master replica からデータファイルを適時に同期できるようにします。必要に応じて `webserver_num_workers` も増やすと、IO 性能が向上します。
* デフォルト値: 64

#### `load_task_high_priority_threshold_second` {#load_task_high_priority_threshold_second}

* 型: int32
* 説明: データロードタスクのタイムアウトがこのしきい値より短い場合、Doris はそのタスクを優先度の高いタスクと見なします。優先度の高いタスクには専用のフラッシュスレッドプールが使用されます。
* デフォルト: 120

#### `min_load_rpc_timeout_ms` {#min_load_rpc_timeout_ms}

* 型: int32
* 説明: データロードジョブ内の各 RPC の最小タイムアウトです。
* デフォルト: 20

#### `kafka_api_version_request` {#kafka_api_version_request}

* 型: bool
* 説明: 使用する Kafka のバージョンが 0.10.0.0 より古い場合は、この値を false に設定します。
* デフォルト: true

#### `kafka_broker_version_fallback` {#kafka_broker_version_fallback}

* 説明: 使用する Kafka のバージョンが 0.10.0.0 より古く、kafka_api_version_request が false に設定されている場合、フォールバックバージョンである kafka_broker_version_fallback の値が使用されます。有効な値は 0.9.0.x と 0.8.x.y です。
* デフォルト: 0.10.0

#### `max_consumer_num_per_group` {#max_consumer_num_per_group}

* 説明: Routine Load で使用する、データコンシューマーグループ内のコンシューマーの最大数です。
* デフォルト: 3

#### `streaming_load_max_mb` {#streaming_load_max_mb}

* 型: int64
* 説明: 1 回の Stream Load で許可される CSV データ量の上限を指定します。
  - Stream Load は一般に数 GB 未満のデータのデータロードに適しており、非常に大きなデータには適していません。
* デフォルト値: 10240 (MB)
* 動的な変更: 可能

#### `streaming_load_json_max_mb` {#streaming_load_json_max_mb}

* 型: int64
* 説明: 1 回の Stream Load で許可される JSON データ量の上限を指定します。単位は MB です。
  - JSON など、分割できないデータ形式があります。Doris は解析を開始する前にすべてのデータをメモリに読み込む必要があります。そのため、この値で 1 回の Stream Load によって読み込めるデータ量の上限を指定します。
* デフォルト値: 100
* 動的な変更: 可能

#### `olap_table_sink_send_interval_microseconds` {#olap_table_sink_send_interval_microseconds}

* 説明: データロード中、ポーリングスレッドが Coordinator の sink ノードから対応する BE にデータを送信し続けます。このスレッドは `olap_table_sink_send_interval_microseconds` マイクロ秒ごとに、送信するデータがあるか確認します。
* デフォルト値: 1000

#### `olap_table_sink_send_interval_auto_partition_factor` {#olap_table_sink_send_interval_auto_partition_factor}

* 説明: 自動パーティション分割が有効なテーブルにデータをロードする場合、`olap_table_sink_send_interval_microseconds` の間隔では遅すぎます。この場合、実際の間隔はこの係数を掛けた値になります。
* デフォルト値: 0.001

#### `enable_group_commit_streamload_be_forward` {#enable_group_commit_streamload_be_forward}

* 型: bool
* 説明: コンピュートとストレージを分離したモードで、Group Commit のための Stream Load の BE 転送を有効にするかどうかを指定します。Doris 4.0 系ではバージョン 4.0.8、4.1 系ではバージョン 4.1.4 で追加されました。動的に変更できます。
  - ロードバランサーが同じテーブルへの Group Commit リクエストを異なる BE にランダムに分散させると、効率的なバッチ処理ができません。有効にすると、BE はリクエストを単一の対象 BE に転送します。
  - **バージョン 4.0.8 以降、BE のエンドポイント `/api/{db}/{table}/_stream_load_forward` はこの設定によって制御されます。`false` の場合、そのエンドポイントへのリクエストは `Stream load forward is disabled` というメッセージを伴う `403 Forbidden` を返します。`true` の場合でも、そのエンドポイントへのリクエストには認証が必要で、グローバルな `LOAD` 権限が求められます。**
  - この転送を使用するデプロイでは、FE と BE の両方で設定を `true` にしてください（[FE の設定](./fe-config) にある同名の FE 設定を参照）。
* デフォルト値: false

### スレッド {#thread}

#### `delete_worker_count` {#delete_worker_count}

* 説明: データ削除タスクを実行するスレッド数です。
* デフォルト値: 3

#### `clear_transaction_task_worker_count` {#clear_transaction_task_worker_count}

* 説明: トランザクションのクリーンアップに使用するスレッド数です。
* デフォルト値: 1

#### `clone_worker_count` {#clone_worker_count}

* 説明: 複製タスクを実行するスレッド数です。
* デフォルト値: 3

#### `be_service_threads` {#be_service_threads}

* 型: int32
* 説明: BE 上の thrift サーバーサービスの実行スレッド数です。FE からのリクエストの処理に使用できるスレッド数を表します。
* デフォルト値: 64

#### `download_worker_count` {#download_worker_count}

* 説明: ダウンロード用スレッド数です。
* デフォルト値: 1

#### `drop_tablet_worker_count` {#drop_tablet_worker_count}

* 説明: tablet を削除するスレッド数です。
* デフォルト値: 3

#### `flush_thread_num_per_store` {#flush_thread_num_per_store}

* 説明: ストアごとにメモリテーブルをフラッシュするスレッド数です。
* デフォルト値: 2

#### `publish_version_worker_count` {#publish_version_worker_count}

* 説明: バージョンの公開に使用するスレッド数です。
* デフォルト値: 8

#### `upload_worker_count` {#upload_worker_count}

* 説明: ファイルのアップロードに使用する最大スレッド数です。
* デフォルト値: 1

#### `webserver_num_workers` {#webserver_num_workers}

* 説明: Web サーバーのデフォルトのワーカースレッド数です。
* デフォルト値: 48

#### `send_batch_thread_pool_thread_num` {#send_batch_thread_pool_thread_num}

* 型: int32
* 説明: SendBatch スレッドプールのスレッド数です。NodeChannel がデータを送信する際、各 NodeChannel の SendBatch 操作はスレッドタスクとしてプールに送られ、実行されます。このパラメータで SendBatch スレッドプールのサイズを決めます。
* デフォルト値: 64

#### `send_batch_thread_pool_queue_size` {#send_batch_thread_pool_queue_size}

* 型: int32
* 説明: SendBatch スレッドプールのキュー長です。NodeChannel がデータを送信する際、各 NodeChannel の SendBatch 操作はスレッドタスクとしてプールに送られ、実行を待ちます。送信されたタスクの数がキュー長を超えると、その後のタスクはキューに空きができるまでブロックされます。
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
* 説明: Linux の huge page を使用するかどうかを指定します。
* デフォルト値: false

#### `max_memory_sink_batch_count` {#max_memory_sink_batch_count}

* 説明: 外部スキャンキャッシュの最大バッチ数です。キャッシュされる行数は max_memory_cache_batch_count * batch_size です。デフォルトは 20 で、batch_size のデフォルト値は 1024 なので、20 * 1024 行がキャッシュされます。
* デフォルト値: 20

#### `memory_max_alignment` {#memory_max_alignment}

* 説明: メモリの最大アラインメントです。
* デフォルト値: 16

#### `mmap_buffers` {#mmap_buffers}

* 説明: メモリの割り当てに mmap を使用するかどうかを指定します。
* デフォルト値: false

#### `memtable_mem_tracker_refresh_interval_ms` {#memtable_mem_tracker_refresh_interval_ms}

* 説明: memtable flush mgr の更新処理間の間隔です。単位はミリ秒です。
* デフォルト値: 100

#### `zone_map_row_num_threshold` {#zone_map_row_num_threshold}

* 型: int32
* 説明: ページ内の行数がこの値未満の場合、データサイズの増加を抑えるため、zonemap を作成しません。
* デフォルト値: 20

#### `memory_mode` {#memory_mode}

* 型: string
* 説明: tcmalloc の GC を制御します。performance モードでは、メモリ使用量が 90% * mem_limit 以上になると Doris が tcmalloc キャッシュのメモリを解放します。それ以外では、50% * mem_limit 以上になると解放します。
* デフォルト値: performance

#### `max_sys_mem_available_low_water_mark_bytes` {#max_sys_mem_available_low_water_mark_bytes}

* 型: int64
* 説明: システムの `/proc/meminfo/MemAvailable` に対する下限の最大値です。単位はバイトで、デフォルトは 1.6G です。実際の下限は min(1.6G, MemTotal * 10%) となり、16G を超える大容量メモリのマシンでメモリを過剰に確保するのを防ぎます。最大値を引き上げると、メモリが 16G を超えるマシンで Full GC 用のメモリバッファを多く確保します。引き下げると、利用可能なメモリをより多く使用します。
* デフォルト値: 1717986918

#### `memory_limitation_per_thread_for_schema_change_bytes` {#memory_limitation_per_thread_for_schema_change_bytes}

* 説明: 単一のスキーマ変更タスクに許可する最大メモリ量です。
* デフォルト値: 2147483648 (2GB)

#### `mem_tracker_consume_min_size_bytes` {#mem_tracker_consume_min_size_bytes}

* 型: int32
* 説明: MemTracker の consume/release 時に TCMalloc Hook が扱う最小サイズです。この値より小さい消費量は蓄積し、MemTracker の consume/release の頻繁な呼び出しを避けます。値を小さくすると呼び出し頻度が増えます。値を大きくすると MemTracker の統計が不正確になります。理論上、MemTracker の統計値と実際の値の差は（mem_tracker_consume_min_size_bytes * その MemTracker が存在する BE スレッド数）です。
* デフォルト値: 1,048,576

#### `min_buffer_size` {#min_buffer_size}

* 説明: 読み取りバッファの最小サイズです。
* デフォルト値: 1024 (byte)

#### `write_buffer_size` {#write_buffer_size}

* 説明: フラッシュ前のバッファサイズです。
  - データロードされたデータは、まず BE 上のメモリブロックに書き込まれ、このブロックがしきい値に達するとディスクに書き戻されます。デフォルトサイズは 200MB です。しきい値が小さすぎると、BE 上に多数の小さなファイルが生成されることがあります。しきい値を大きくするとファイル数を減らせますが、大きすぎると RPC がタイムアウトする可能性があります。
* デフォルト値: 209,715,200

#### `remote_storage_read_buffer_mb` {#remote_storage_read_buffer_mb}

* 型: int32
* 説明: HDFS またはオブジェクトストレージ上のファイルを読み取る際に使用するキャッシュサイズです。
  - 値を大きくするとリモートデータの読み取り呼び出し回数を減らせますが、メモリのオーバーヘッドが増えます。
* デフォルト値: 16 (MB)

#### `file_cache_type` {#file_cache_type}

* 型: string
* 説明: キャッシュファイルの種類です。`whole_file_cache` は segment ファイル全体をダウンロードし、`sub_file_cache` は segment ファイルをサイズに応じて複数のファイルに分割します。"" に設定するとキャッシュしません。キャッシュが必要な場合は、このパラメータを設定してください。
* デフォルト値: ""

#### `path_gc_check` {#path_gc_check}

* 型: bool
* 説明: リサイクル対象のデータをスキャンするスレッドによるチェックを有効にするかどうかを指定します。
* デフォルト値: true

#### `path_gc_check_interval_second` {#path_gc_check_interval_second}

* 説明: リサイクル対象のデータをスキャンするスレッドのチェック間隔です。
* デフォルト値: 86400 (s)

#### `path_gc_check_step` {#path_gc_check_step}

* デフォルト値: 1000

#### `path_gc_check_step_interval_ms` {#path_gc_check_step_interval_ms}

* デフォルト値: 10 (ms)

#### `scan_context_gc_interval_min` {#scan_context_gc_interval_min}

* 説明: context GC スレッドのスケジュール間隔です。単位は分で、デフォルトは 5 分です。
* デフォルト値: 5

### ストレージ {#storage}

#### `enable_kuromoji_analyzer` {#enable_kuromoji_analyzer}

* 型: bool
* 説明: kuromoji（日本語）転置インデックスアナライザーを有効にするかどうかを指定します。Doris 5.0.0 以降でサポートされます。
* デフォルト値: false

#### `inverted_index_skip_norms_for_variant` {#inverted_index_skip_norms_for_variant}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされます。動的な設定に対応しています。`true` の場合、VARIANT のサブパスに対する転置インデックスでは、インデックスの `norms` プロパティに関係なく Norms を省略します。これにより複数のサブパスのインデックスが占めるストレージを削減できますが、それらのインデックスでは Norms を必要とする BM25 の `score()` 計算ができなくなります。デフォルトでは Norms を保持します。[関連度スコアリング](../../table-design/index/inverted-index/scoring.md) を参照してください。
* デフォルト値: false

#### `default_num_rows_per_column_file_block` {#default_num_rows_per_column_file_block}

* 型: int32
* 説明: 単一の RowBlock に含めるデータ行数を設定します。
* デフォルト値: 1024

#### `disable_storage_page_cache` {#disable_storage_page_cache}

* 型: bool
* 説明: インデックスのキャッシュに page cache を使用しないようにします。この設定は BETA ストレージ形式でのみ有効です。通常は false が推奨されます。
* デフォルト値: false

#### `disk_stat_monitor_interval` {#disk_stat_monitor_interval}

* 説明: ディスク状態の確認間隔です。
* デフォルト値: 5 (s)

#### `max_free_io_buffers` {#max_free_io_buffers}

* 説明: IO バッファの各サイズについて、IoMgr が保持するバッファの最大数です。バッファサイズは 1024B から 8MB までで、バッファの合計は最大で約 2GB になります。
* デフォルト値: 128

#### `max_garbage_sweep_interval` {#max_garbage_sweep_interval}

* 説明: ディスク上の不要データをクリーンアップする最大間隔です。
* デフォルト値: 3600 (s)

#### `max_percentage_of_error_disk` {#max_percentage_of_error_disk}

* 型: int32
* 説明: ストレージエンジンが許容する障害ディスクの割合です。障害ディスクの割合がこの値を超えると、BE は自動的に終了します。
* デフォルト値: 0

#### `min_garbage_sweep_interval` {#min_garbage_sweep_interval}

* 説明: ディスク上の不要データをクリーンアップする最小間隔です。
* デフォルト値: 180 (s)

#### `pprof_profile_dir` {#pprof_profile_dir}

* 説明: pprof profile の保存ディレクトリです。
* デフォルト値: ${DORIS_HOME}/log

#### `small_file_dir` {#small_file_dir}

* 説明: SmallFileMgr がダウンロードしたファイルの保存先です。
* デフォルト値: ${DORIS_HOME}/lib/small_file/

#### `user_function_dir` {#user_function_dir}

* 説明: UDF 関数のディレクトリです。
* デフォルト値: `${DORIS_HOME}/lib/udf`

#### `storage_flood_stage_left_capacity_bytes` {#storage_flood_stage_left_capacity_bytes}

* 説明: データディレクトリに残すべき最小空き容量です。単位はバイトです。
* デフォルト値: 1073741824

#### `storage_flood_stage_usage_percent` {#storage_flood_stage_usage_percent}

* 説明: storage_flood_stage_usage_percent と storage_flood_stage_left_capacity_bytes で、データディレクトリの容量の最大使用量を制限します。
* デフォルト値: 90 (90%)

#### `storage_medium_migrate_count` {#storage_medium_migrate_count}

* 説明: 複製に使用するスレッド数です。
* デフォルト値: 1

#### `storage_page_cache_limit` {#storage_page_cache_limit}

* 説明: ストレージページ用キャッシュのサイズです。
* デフォルト値: 20%

#### `storage_page_cache_shard_size` {#storage_page_cache_shard_size}

* 説明: StoragePageCache のシャード数です。値は 2 のべき乗でなければなりません。ロック競合を減らすため、BE のコア数に近い値が推奨されます。
* デフォルト値: 16

#### `index_page_cache_percentage` {#index_page_cache_percentage}

* 型: int32
* 説明: ストレージページキャッシュ全体に対するインデックスページキャッシュの割合です。値の範囲は [0, 100] です。
* デフォルト値: 10

#### `segment_cache_capacity` {#segment_cache_capacity}
* 型: int32
* 説明: segment キャッシュのエントリ数の上限です。キーは rowset ID です。-1 は下位互換性のための値で、fd_number * 2/5 を意味します。
* デフォルト値: -1

#### `storage_strict_check_incompatible_old_format` {#storage_strict_check_incompatible_old_format}

* 型: bool
* 説明: 互換性のない古い形式を厳密に確認するために使用します。
* デフォルト値: true
* 動的な変更: false

#### `sync_tablet_meta` {#sync_tablet_meta}

* 説明: ストレージエンジンが sync を有効にし、ディスクへの同期を維持するかどうかを指定します。
* デフォルト値: true

#### `pending_data_expire_time_sec` {#pending_data_expire_time_sec}

* 説明: ストレージエンジンが未検証のデータを保持する最大時間です。
* デフォルト値: 1800 (s)

#### `ignore_rowset_stale_unconsistent_delete` {#ignore_rowset_stale_unconsistent_delete}

* 型: boolean
* 説明: 古くなったマージ済み rowset が一貫したバージョンパスを形成できない場合、その rowset を削除するかどうかを決めます。
  - マージ済みで期限切れの rowset のバージョンパスは 30 分後に削除されます。異常な状況では、これらのバージョンを削除すると、クエリ用の一貫したパスを構築できなくなることがあります。設定が false の場合、プログラムは厳密に検査し、エラーを報告して終了します。true の場合は、このエラーを無視して通常どおり実行します。一般に、このエラーを無視してもクエリには影響しませんが、FE がマージ済みバージョンを割り当てた場合にのみ -230 エラーが発生します。
* デフォルト値: false

#### `create_tablet_worker_count` {#create_tablet_worker_count}

* 説明: BE が tablet を作成するワーカースレッド数です。
* デフォルト値: 3

#### `check_consistency_worker_count` {#check_consistency_worker_count}

* 説明: tablet のチェックサムを計算するワーカースレッド数です。
* デフォルト値: 1

#### `max_tablet_version_num` {#max_tablet_version_num}

* 型: int
* 説明: 単一の tablet のバージョン数を制限します。頻繁すぎるデータロードや、適時に実行されない compaction によって大量のバージョンが蓄積するのを防ぐために使用します。上限を超えると、データロードタスクは拒否されます。
* デフォルト値: 2000

#### `tablet_map_shard_size` {#tablet_map_shard_size}

* 説明: tablet_map_lock の分割サイズです。値は 2^n（n=0,1,2,3,4）で、tablet の管理性能を向上させるための設定です。
* デフォルト値: 4

#### `tablet_meta_checkpoint_min_interval_secs` {#tablet_meta_checkpoint_min_interval_secs}

* 説明: TabletMeta Checkpoint スレッドのポーリング間隔です。
* デフォルト値: 600 (s)

#### `tablet_meta_checkpoint_min_new_rowsets_num` {#tablet_meta_checkpoint_min_new_rowsets_num}

* 説明: TabletMeta Checkpoint を保存するために必要な Rowset の最小数です。
* デフォルト値: 10

#### `tablet_rowset_stale_sweep_time_sec` {#tablet_rowset_stale_sweep_time_sec}

* 型: int64
* 説明: マージ済み rowset のバージョンをクリーンアップするまでの時間を制御します。現在時刻 now() から、バージョンパス内で最後に作成された rowset の作成時刻を引いた値が tablet_rowset_stale_sweep_time_sec を超えると、そのパスがクリーンアップされ、マージ済み rowset が削除されます。単位は秒です。
  - 書き込みが頻繁すぎると、FE がマージ済みバージョンを参照できず、クエリで -230 エラーが発生することがあります。このパラメータを引き上げると、その問題を回避できます。
* デフォルト値: 300

#### `tablet_writer_open_rpc_timeout_sec` {#tablet_writer_open_rpc_timeout_sec}

* 説明: tablet 状態キャッシュの更新間隔です。
    - データロード中に Batch（1024 行）を送信する RPC のタイムアウトです。デフォルトは 60 秒です。この RPC では複数のメモリバッチへの書き込みが発生する場合があり、それによってタイムアウトすることがあります。この値を調整すると、send batch fail などのタイムアウトエラーを減らせます。`write_buffer_size` を引き上げる場合は、このパラメータも引き上げる必要があります。
* デフォルト値: 60

#### `tablet_writer_ignore_eovercrowded` {#tablet_writer_ignore_eovercrowded}

* 型: bool
* 説明: データの書き込み時に brpc エラー '[E1011]The server is overcrowded' を無視するために使用します。
* デフォルト値: false

#### `streaming_load_rpc_max_alive_time_sec` {#streaming_load_rpc_max_alive_time_sec}

* 説明: TabletsChannel の存続時間です。この時間内にチャネルがデータを受信しなければ、削除されます。
* デフォルト値: 1200

#### `alter_tablet_worker_count` {#alter_tablet_worker_count}

* 説明: スキーマ変更を行うスレッド数です。
* デフォルト値: 3

#### `alter_index_worker_count` {#alter_index_worker_count}

* 説明: インデックス変更を行うスレッド数です。
* デフォルト値: 3

#### `ignore_load_tablet_failure` {#ignore_load_tablet_failure}

* 型: bool
* 説明: tablet の読み込みに失敗した場合、エラーを無視して BE の起動を続行するかどうかを指定します。
* デフォルト値: false

BE の起動時には、各データディレクトリに対して個別のスレッドが起動し、tablet ヘッダーのメタ情報を読み込みます。デフォルト設定では、いずれかのデータディレクトリで tablet の読み込みに失敗すると、起動処理は終了します。同時に、` be The following error message is seen in the INFO ` ログに次のエラーメッセージが表示されます。

```
load tablets from header failed, failed tablets size: xxx, path=xxx
```

このメッセージは、そのデータディレクトリで読み込みに失敗した tablet の数を示します。ログには、読み込みに失敗した tablet の詳細情報も記録されます。この場合は、手動で原因を調査する必要があります。原因を解決した後は、通常、次の 2 つの方法で復旧できます。
  - tablet 情報を修復できない場合、ほかのレプリカが正常であれば、`meta_tool` ツールで問題のある tablet を削除できます。
  - `ignore_load_tablet_failure` を true に設定すると、BE は問題のある tablet を無視して正常に起動します。

#### `report_disk_state_interval_seconds` {#report_disk_state_interval_seconds}

* 説明: agent がディスクの状態を FE に報告する間隔です。
* デフォルト値: 60 (s)

#### `result_buffer_cancelled_interval_time` {#result_buffer_cancelled_interval_time}

* 説明: 結果バッファがキャンセルされるまでの時間です。
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

* 説明: ログレベル: INFO < WARNING < ERROR < FATAL
* デフォルト値: INFO

#### `sys_log_roll_mode` {#sys_log_roll_mode}

* 説明: ログを分割するサイズです。ログファイルは 1G ごとに分割されます。
* デフォルト値: SIZE-MB-1024

#### `sys_log_roll_num` {#sys_log_roll_num}

* 説明: 保持するログファイル数です。
* デフォルト値: 10

#### `sys_log_verbose_level` {#sys_log_verbose_level}

* 説明: コード内の VLOG で始まるログの出力を制御するログ表示レベルです。
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

* 説明: ログのフラッシュ戦略です。デフォルトではメモリに保持されます。
* デフォルト値: 空

### その他 {#others}

#### `enable_arrow_input_validation` {#enable_arrow_input_validation}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。Arrow データを Doris の内部列に変換する前に、Arrow の入力バッファを検証するかどうかを指定します。有効にすると、少量の検証処理が追加される代わりに、不正な Arrow データによって BE がクラッシュするのを防げます。
* デフォルト値: true

#### `report_tablet_interval_seconds` {#report_tablet_interval_seconds}

* 説明: agent が OLAP テーブルを FE に報告する間隔です。
* デフォルト値: 60 (s)

#### `report_task_interval_seconds` {#report_task_interval_seconds}

* 説明: agent がタスクの署名を FE に報告する間隔です。
* デフォルト値: 10 (s)

#### `periodic_counter_update_period_ms` {#periodic_counter_update_period_ms}

* 説明: rate counter と sampling counter の更新周期です。
* デフォルト値: 500 (ms)

#### `enable_metric_calculator` {#enable_metric_calculator}

* 説明: true に設定すると、metric calculator が実行され、BE 関連の指標情報を収集します。false に設定すると実行されません。
* デフォルト値: true

#### `enable_system_metrics` {#enable_system_metrics}

* 説明: システム指標の有効化と無効化を制御します。
* デフォルト値: true

#### `enable_token_check` {#enable_token_check}

* 説明: 将来の互換性のために使用されます。後のバージョンで削除される予定です。
* デフォルト値: true

#### `max_runnings_transactions_per_txn_map` {#max_runnings_transactions_per_txn_map}

* 説明: txn manager 内の各 txn_partition_map に保持できる txn の最大数です。manager に多数の txn が保存されるのを避けるための保護機能です。
* デフォルト値: 2000

#### `max_download_speed_kbps` {#max_download_speed_kbps}

* 説明: ダウンロード速度の上限です。
* デフォルト値: 50000 (kb/s)

#### `download_low_speed_time` {#download_low_speed_time}

* 説明: ダウンロード時間の制限です。
* デフォルト値: 300 (s)

#### `download_low_speed_limit_kbps` {#download_low_speed_limit_kbps}

* 説明: 最小ダウンロード速度です。
* デフォルト値: 50 (KB/s)

#### `enable_batch_download` {#enable_batch_download}

* 説明: ファイルをバッチでダウンロードするかどうかを指定します。binlog を有効にしている場合は、有効化が推奨されます。
* デフォルト値: false

#### `priority_queue_remaining_tasks_increased_frequency` {#priority_queue_remaining_tasks_increased_frequency}

* 説明: BlockingPriorityQueue に残っているタスクの優先度を引き上げる頻度です。
* デフォルト値: 512


#### `jdbc_drivers_dir` {#jdbc_drivers_dir}

* 説明: JDBC ドライバーを配置するデフォルトのディレクトリです。
* デフォルト値: `${DORIS_HOME}/jdbc_drivers`

#### `enable_simdjson_reader` {#enable_simdjson_reader}

* 説明: Stream Load 時の JSON 解析に simdjson を使用するかどうかを指定します。
* デフォルト値: true

#### `user_files_secure_path` {#user_files_secure_path}

* 説明: `local` テーブル値関数でクエリされるファイルの保存ディレクトリです。
* デフォルト値: `${DORIS_HOME}`

#### `brpc_streaming_client_batch_bytes` {#brpc_streaming_client_batch_bytes}

* 説明: brpc streaming client がデータを送信するときのバッチサイズです。
* デフォルト値: 262144

#### `grace_shutdown_wait_seconds` {#grace_shutdown_wait_seconds}

* 説明: クラウドネイティブのデプロイでは、BE がクラスターに追加されたり、クラスターから削除されたりすることが頻繁にあります。停止中の BE で fragment が実行されていると、ユーザーのクエリは失敗します。`stop_be.sh --grace` を使用すると、BE は実行中のすべてのクエリが終了するまで待ち、クエリの失敗を避けます。ただし、待機時間が上限を超えると BE は直ちに終了します。この間、FE は BE に新しいクエリを送信せず、実行中のクエリがすべて終了するのを待ちます。
* デフォルト値: 120

#### `enable_java_support` {#enable_java_support}

* 説明: BE で java-jni の使用を有効にするかどうかを指定します。有効にすると、C++ と Java の相互呼び出しが可能になります。現在は hudi、java-udf、jdbc、max-compute、paimon、preload、avro をサポートしています。
* デフォルト値: true

#### `group_commit_wal_path` {#group_commit_wal_path}

* Group Commit の `WAL` ディレクトリです。
* デフォルト: `storage_root_path` の各ディレクトリ内に `wal` という名前のディレクトリが作成されます。設定例:
  ```
  group_commit_wal_path=/data1/storage/wal;/data2/storage/wal;/data3/storage/wal
  ```

### コンピュートとストレージを分離したモード {#compute-and-storage-disaggregated-mode}

#### `deploy_mode` {#deploy_mode-1}

* デフォルト: ""

* 説明: BE の実行モードです。`cloud` はストレージとコンピュートを分離したモードを示します。

#### `meta_service_endpoint` {#meta_service_endpoint}

デフォルト: ""

* 説明: Meta Service のエンドポイントを 'host1:port,host2:port' の形式で指定します。通常、この値はハートビートを通じて FE から BE に渡されるため、設定する必要はありません。

#### `enable_file_cache` {#enable_file_cache}

デフォルト: true（バージョン 4.1.5 以降はデフォルトで有効。それ以前は false。コンピュートとストレージを分離したモードでは常に有効）。

* 説明: file cache を使用するかどうかを指定します。変更を反映するには BE の再起動が必要です。セッション変数 `enable_file_cache` も有効にする必要があります。バージョン 4.1.5 では BE の設定とセッション変数のデフォルト値がどちらも `true` に変更されました。既存の明示的な設定と、永続化されたグローバル変数は個別に確認してください。

#### `enable_ms_rpc_host_level_rate_limit_dry_run` {#enable_ms_rpc_host_level_rate_limit_dry_run}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされます。動的な設定に対応しています。BE から Meta Service への RPC について、ホスト単位のレート制限を待機なしで評価します。`enable_ms_rpc_host_level_rate_limit` とは独立しており、その設定が `false` でも評価を実行します。両方が `true` の場合は dry-run が優先されます。レート制限を適用するには、`enable_ms_rpc_host_level_rate_limit` を有効にし、この設定を無効にしてください。
* デフォルト値: true

#### `enable_ms_backpressure_handling_dry_run` {#enable_ms_backpressure_handling_dry_run}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされます。動的な設定に対応しています。Meta Service の `MS_BUSY` 応答をきっかけとする、テーブル単位の適応的なレート制限を待機なしで評価します。`enable_ms_backpressure_handling` とは独立しており、両方が `true` の場合は dry-run が優先されます。テーブル単位のレート制限を適用するには、`enable_ms_backpressure_handling` を有効にし、この設定を無効にしてください。
* デフォルト値: true

#### `cache_peer_read_failure_threshold` {#cache_peer_read_failure_threshold}

* 型: int32
* 説明: バージョン 4.2.0 以降でサポートされます。動的な設定に対応しています。ピアアドレスへの接続または RPC が連続して失敗し、サーキットブレーカーが開くまでの回数です。実効的な最小値は `1` です。このアドレス単位の状態は異なる tablet のピア読み取りでも共有され、到達できないノードへの接続を繰り返すのを防ぎます。
* デフォルト値: 3

#### `cache_peer_read_circuit_open_seconds` {#cache_peer_read_circuit_open_seconds}

* 型: int32
* 説明: バージョン 4.2.0 以降でサポートされます。動的な設定に対応しています。開いたピアのサーキットブレーカーが、そのアドレスへの読み取りを拒否する時間です。単位は秒です。負の値は `0` として扱われます。この期間が経過すると、復旧確認の試行が 1 回許可されます。
* デフォルト値: 30

#### `delete_bitmap_store_v2_max_bytes_in_fdb` {#delete_bitmap_store_v2_max_bytes_in_fdb}

* 型: int64
* 説明: コンピュートとストレージを分離したモードで、FDB に直接保存する Delete Bitmap V2 のシリアライズ後の最大サイズです。単位はバイトです。動的な設定に対応しています。負でないしきい値を超える値は、代わりにオブジェクトストレージのファイルに保存されます。負の値を指定すると、サイズに基づく退避が無効になります。バージョン 4.1.5 ではデフォルト値が `1024` から `89000` に引き上げられ、90000 バイトの chunk 内で追加のメッセージフィールド用の余地が確保されました。
* デフォルト値: 89000（4.1.5 より前は 1024）

#### `enable_remove_agg_pre_rowsets_delete_bitmap_by_keys` {#enable_remove_agg_pre_rowsets_delete_bitmap_by_keys}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされます。動的な設定に対応しています。コンピュートとストレージを分離したモードで、集約済みの過去の Delete Bitmap を置き換える際に、終了バージョンのレコードをキー単位で削除します。範囲削除を使用するには `false` に設定します。この設定は既存のクリーンアップでのレコード削除方法だけを変更し、追加のクリーンアップタスクは有効にしません。
* デフォルト値: true

#### `enable_remove_pre_rowsets_delete_bitmap_by_keys` {#enable_remove_pre_rowsets_delete_bitmap_by_keys}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされます。動的な設定に対応しています。コンピュートとストレージを分離したモードで、集約範囲内の過去の Delete Bitmap をクリーンアップする際に、開始バージョンを含み終了バージョンを含まない範囲のレコードをキー単位で削除します。範囲削除を使用するには `false` に設定します。既存のクリーンアップ用スイッチと前提条件は引き続き適用されます。
* デフォルト値: true

#### `file_cache_path` {#file_cache_path}

デフォルト: [{"path":"${DORIS_HOME}/file_cache"}]
* 説明: file cache に使用するディスクパスとその他のパラメータを配列で表します。各ディスクに 1 つのエントリを指定します。`path` はディスクパスを示し、`total_size` はキャッシュサイズを制限します。-1 または 0 を指定すると、ディスク容量全体を使用します。
* 形式: [{"path":"/path/to/file_cache","total_size":21474836480,{"path":"/path/to/file_cache2","total_size":21474836480}]

#### `enable_async_file_cache_write` {#enable_async_file_cache_write}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。file cache に非同期で書き込むかどうかを指定します。有効にすると、リモートデータを file cache に書き戻す処理がバックグラウンドスレッドプールに渡され、読み取り処理をブロックしないため、コールドリードのレイテンシーが低下します。
* デフォルト値: false

#### `async_file_cache_write_workers_per_disk` {#async_file_cache_write_workers_per_disk}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。file cache への非同期書き込み時に、キャッシュ用ディスクごとに使用する書き込みスレッド数です。`enable_async_file_cache_write = true` の場合にのみ有効です。
* デフォルト値: 16

#### `async_file_cache_write_max_pending_bytes` {#async_file_cache_write_max_pending_bytes}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。file cache への非同期書き込みを待っているデータの合計サイズの上限です。単位はバイトです。この上限を超える書き戻しリクエストは破棄されます。クエリ結果の正しさには影響しませんが、データはキャッシュされません。`-1` は制限なしを意味します。
* デフォルト値: -1

#### `enable_file_cache_write_from_s3_file_writer` {#enable_file_cache_write_from_s3_file_writer}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。オブジェクトストレージへの書き込み時にローカルの file cache にもデータを書き込み、新しく書き込んだデータをキャッシュから直接読み取れるようにするかどうかを指定します。
* デフォルト値: true

#### `enable_file_cache_write_index_file_only` {#enable_file_cache_write_index_file_only}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。file cache にインデックスファイルのみを書き込むかどうかを指定します。有効にすると、キャッシュ容量が限られている場合にインデックスを優先してキャッシュに保持します。
* デフォルト値: false

#### `enable_cache_read_from_peer` {#enable_cache_read_from_peer}

* 型: bool
* 説明: ピアキャッシュ読み取りのマスタースイッチです。有効にすると、ローカルの File Cache にデータがない場合、まず別の BE（同じコンピュートグループまたは別のグループ）の File Cache からブロックを読み取ろうとし、どの BE にも存在しない場合にのみオブジェクトストレージにフォールバックします。同一グループ内とグループ間のピア読み取りは、このスイッチでまとめて制御されます。グループ間の読み取りだけを無効にすることはできません。グループ間のピア読み取りはバージョン 4.2.0 以降でサポートされ、このバージョンで設定項目 `cache_read_from_peer_expired_seconds` も削除されました。[ピアキャッシュ読み取り](../../compute-storage-decoupled/file-cache/file-cache-peer-read) を参照してください。
* デフォルト値: false（必要な場合に明示的に有効化）

#### `enable_peer_s3_race` {#enable_peer_s3_race}

* 型: bool
* 説明: バージョン 4.2.0 で追加されました。ピア読み取りとオブジェクトストレージの読み取りを競わせ、先に得られた結果を使用するかどうかを指定します。無効の場合は順次読み取ります。ピア候補を 1 つずつ試し、すべて失敗した場合にのみオブジェクトストレージを読み取ります。
* デフォルト値: true

#### `peer_race_hedge_delay_ms` {#peer_race_hedge_delay_ms}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。読み取りを競わせる際に、ピア読み取りを先行させる時間です。単位はミリ秒です。この時間内にピアから応答があれば、オブジェクトストレージへの読み取りは送信されません。`0` は両方の読み取りを同時に開始します。
* デフォルト値: 20

#### `max_concurrent_peer_races` {#max_concurrent_peer_races}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。単一 BE 上で同時実行できる、ピアとオブジェクトストレージの読み取り競合の最大数です。この上限を超えたキャッシュミスは順次読み取られます。
* デフォルト値: 64

#### `peer_cache_fill_compute_group_id` {#peer_cache_fill_compute_group_id}

* 型: string
* 説明: 読み取りを発行する BE に設定します。グループ間のキャッシュへの取り込みを担当するコンピュートグループの ID です。コンピュートグループ名ではなく、`SHOW BACKENDS` の `Tag` 列にある `compute_group_id` を指定します。選択したピア候補がこのコンピュートグループに属する場合、ブロックを保持していなければオブジェクトストレージから取得して自身の File Cache に書き込むよう要求します。空の場合は、キャッシュへの取り込みを使用しません。
* デフォルト値: ""

#### `enable_peer_server_cache_fill` {#enable_peer_server_cache_fill}

* 型: bool
* 説明: キャッシュを提供する BE に設定します。取り込みフラグを含むピア読み取りリクエストを受け付けるかどうかを指定します。無効の場合、ローカルにキャッシュされていないブロックは見つからないものとして報告され、要求元の BE はオブジェクトストレージにフォールバックします。
* デフォルト値: true

#### `peer_server_cache_fill_timeout_ms` {#peer_server_cache_fill_timeout_ms}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。キャッシュを提供する側で、1 回の取り込みを待つ最大時間です。単位はミリ秒です。タイムアウトすると、要求元の BE はオブジェクトストレージにフォールバックします。
* デフォルト値: 6000

#### `max_concurrent_peer_server_fills` {#max_concurrent_peer_server_fills}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。キャッシュを提供する側で同時に実行できる取り込みの最大数です。上限を超える取り込みリクエストは拒否され、要求元の BE はオブジェクトストレージにフォールバックします。
* デフォルト値: 32

#### `peer_rpc_failure_eviction_threshold` {#peer_rpc_failure_eviction_threshold}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。ピア候補で RPC がこの回数連続して失敗すると、その候補は候補リストから削除されます。
* デフォルト値: 3

#### `peer_all_miss_cooldown_threshold` {#peer_all_miss_cooldown_threshold}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。すべてのピア候補でキャッシュミスとなる読み取りが連続して発生し、tablet がクールダウンに入るまでの回数です。クールダウン中はオブジェクトストレージから直接読み取ります。
* デフォルト値: 5

#### `peer_all_miss_cooldown_duration_s` {#peer_all_miss_cooldown_duration_s}

* 型: int64
* 説明: バージョン 4.2.0 で追加されました。ピア読み取りのクールダウン期間です。単位は秒です。
* デフォルト値: 300

#### `peer_candidate_expiry_s` {#peer_candidate_expiry_s}

* 型: int64
* 説明: バージョン 4.2.0 で追加されました。ピア候補エントリの有効期限です。最後の使用時からの秒数で指定します。期限切れのエントリはメモリから削除され、次にキャッシュミスが発生したときに FE から再取得されます。
* デフォルト値: 3600

#### `peer_candidate_cleanup_interval_s` {#peer_candidate_cleanup_interval_s}

* 型: int64
* 説明: バージョン 4.2.0 で追加されました。期限切れのピア候補を削除するバックグラウンドジョブの実行間隔です。単位は秒です。
* デフォルト値: 3600

#### `peer_fetch_queue_timeout_ms` {#peer_fetch_queue_timeout_ms}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。ピア読み取りリクエストが、キャッシュを提供する側の処理キューで待機できる最大時間です。単位はミリ秒です。これを超えて待機したリクエストは拒否され、要求元の BE がすぐにオブジェクトストレージにフォールバックできるようにします。
* デフォルト値: 100

#### `brpc_peer_fetch_pool_threads` {#brpc_peer_fetch_pool_threads}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。キャッシュを提供する側でピア読み取りリクエストを処理するスレッドプールのサイズです。データロードなど、負荷の高い RPC を処理するスレッドプールとは分離されています。`-1` は `max(64, 2 × CPU cores)` を意味します。動的には変更できません。
* デフォルト値: -1

#### `brpc_peer_fetch_pool_max_queue_size` {#brpc_peer_fetch_pool_max_queue_size}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。キャッシュを提供する側のピア読み取りスレッドプールのキュー長です。`-1` は `max(4096, 128 × CPU cores)` を意味します。動的には変更できません。
* デフォルト値: -1

#### `min_peer_race_s3_thread_num` / `max_peer_race_s3_thread_num` {#min_peer_race_s3_thread_num--max_peer_race_s3_thread_num}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。ピアとオブジェクトストレージの読み取りを競わせる際に、要求元側でオブジェクトストレージの読み取りを実行するプールの最小 / 最大スレッド数です。動的には変更できません。
* デフォルト値: 0 / 32

#### `s3_get_requests_per_second_per_core` / `s3_put_requests_per_second_per_core` {#s3_get_requests_per_second_per_core--s3_put_requests_per_second_per_core}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コアごとに計算される、オブジェクトストレージへの GET / PUT リクエストの QPS 上限です。負の値はこの方式を無効にし、従来の絶対トークン設定にフォールバックします。`0` は QPS の制限なしを意味します。
* デフォルト値: -1

#### `s3_get_requests_per_second_max` / `s3_put_requests_per_second_max` {#s3_get_requests_per_second_max--s3_put_requests_per_second_max}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コア数から算出される GET / PUT の QPS に対する厳格な上限です。`0` 以下の値は上限なしを意味します。
* デフォルト値: 0

#### `s3_get_bytes_per_second_per_core` / `s3_put_bytes_per_second_per_core` {#s3_get_bytes_per_second_per_core--s3_put_bytes_per_second_per_core}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コアごとに計算される、オブジェクトストレージへの GET / PUT の帯域幅制限です。単位はコアごとのバイト数/秒です。`0` 以下の値は帯域幅の制限なしを意味します。
* デフォルト値: -1

#### `s3_get_bytes_per_second_max` / `s3_put_bytes_per_second_max` {#s3_get_bytes_per_second_max--s3_put_bytes_per_second_max}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コア数から算出される GET / PUT の帯域幅に対する、バイト数/秒単位の厳格な上限です。`0` 以下の値は上限なしを意味します。
* デフォルト値: 0

#### `s3_rate_limiter_cpu_cores_override` {#s3_rate_limiter_cpu_cores_override}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。上記のレート制限の算出に使用する CPU コア数です。`0` 以下の値を指定すると、マシンのコア数が自動的に検出されます。
* デフォルト値: 0

#### `s3_rate_limiter_log_interval` {#s3_rate_limiter_log_interval}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。オブジェクトストレージのレート制限が発動した際に出力されるログエントリ間の最小間隔です。単位はミリ秒です。
* デフォルト値: 1000

#### `file_cache_mem_storage_shard_num` {#file_cache_mem_storage_shard_num}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。file cache のメモリストレージのシャード数です。同時アクセス時のロック競合を減らすために使用します。
* デフォルト値: 1024

#### `time_series_max_tablet_version_num` {#time_series_max_tablet_version_num}

* 型: int
* 説明: time-series compaction ポリシーにおける、単一の tablet のバージョン数を制限します。頻繁すぎるデータロードや、適時に実行されない compaction によって大量のバージョンが蓄積するのを防ぐために使用します。上限を超えると、データロードタスクは拒否されます。
* デフォルト値: 20000
