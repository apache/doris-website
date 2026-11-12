---
{
    "title": "BE 設定",
    "language": "ja",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "このドキュメントでは、主に BE の設定項目について説明します。"
}
---

# BE 設定 {#be-configuration}

このドキュメントでは、主に BE の設定項目について説明します。

BE の設定ファイル `be.conf` は通常、BE のデプロイ先にある `conf/` ディレクトリに保存されます。バージョン 0.14 では、別の設定ファイル `be_custom.conf` が導入されます。このファイルには、稼働中にユーザーが動的に設定し、永続化した設定項目が記録されます。

BE プロセスは起動後、まず `be.conf` の設定項目を読み込み、次に `be_custom.conf` の設定項目を読み込みます。同じ設定項目が両方にある場合は、`be_custom.conf` の値が `be.conf` の値を上書きします。

`be_custom.conf` ファイルの場所は、`be.conf` の `custom_config_dir` 設定項目で指定できます。

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
    4. Value: 現在の設定項目の値。
    5. Type: 整数や文字列など、設定項目の値の型。
    6. IsMutable: 動的に設定できるかどうか。true の場合は実行時に動的に設定できます。false の場合は `be.conf` でのみ設定でき、BE の再起動後に有効になります。

## 設定項目の変更 {#set-configuration-items}

BE の設定項目を変更する方法は 2 つあります。

1. 静的な設定

   `conf/be.conf` ファイルに設定項目を追加し、値を指定します。`be.conf` の設定項目は BE の起動時に読み込まれます。`be.conf` にない設定項目にはデフォルト値が使用されます。

2. 動的な設定

   BE の起動後、次のコマンドで設定項目を動的に変更できます。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}
    ```

   バージョン 0.13 以前では、この方法で変更した設定項目は BE プロセスの再起動後に無効になります。バージョン 0.14 以降では、次のコマンドで変更内容を永続化できます。変更した設定項目は `be_custom.conf` ファイルに保存されます。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?{key}={value}\&persist=true
    ```

## 例 {#examples}

1. `max_base_compaction_threads` を静的に変更する

   `be.conf` ファイルに次の行を追加します。

   ```max_base_compaction_threads=5```

   BE プロセスを再起動すると、設定が有効になります。

2. `streaming_load_max_mb` を動的に変更する

   BE の起動後、次のコマンドで設定項目 `streaming_load_max_mb` を動的に変更します。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024
    ```

   次の応答が返れば、設定は成功です。

    ```
    {
        "status": "OK",
        "msg": ""
    }
    ```

   この設定は BE の再起動後に無効になります。変更内容を永続化するには、次のコマンドを使用します。

    ```
    curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=1024\&persist=true
    ```

## 設定項目 {#configurations}

### サービス {#services}

#### `deploy_mode` {#deploy_mode}

* 型: string
* 説明: BE の実行モード。`cloud` はコンピュートとストレージを分離したモードを示します。
* デフォルト値: ""

#### `bvar_max_dump_multi_dimension_metric_num` {#bvar_max_dump_multi_dimension_metric_num}

* 型: string
* 説明: バージョン 4.1.5 以降でサポートされます。`/brpc_metrics` が出力する多次元 bvar メトリクスサンプルの最大数です。`0` に設定すると、これらのサンプルを無効にします。変更には BE の再起動が必要です。
* デフォルト値: 5000

#### `be_port` {#be_port}

* 型: int32
* 説明: FE からのリクエストを受け取る、BE 上の thrift サーバーのポートです。
* デフォルト値: 9060

#### `heartbeat_service_port` {#heartbeat_service_port}

* 型: int32
* 説明: FE からのハートビートを受け取る、BE 上のハートビートサービスのポート（thrift）です。
* デフォルト値: 9050

#### `webserver_port` {#webserver_port}

* 型: int32
* 説明: BE 上の http サーバーのサービスポートです。
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
* 説明: https をサポートするかどうか。有効にする場合は、be.conf で `ssl_certificate_path` と `ssl_private_key_path` を設定します。
* デフォルト値: false

#### `priority_networks` {#priority_networks}

* 説明: 複数の IP を持つサーバーの選択方法を指定します。このリストに一致する IP は最大 1 つにしてください。CIDR 表記をセミコロンで区切ったリストで、例は 10.10.10.0/24 です。この規則に一致する IP がなければ、ランダムに 1 つ選択されます。
* デフォルト値: 空白

#### `storage_root_path` {#storage_root_path}

* 型: string

* 説明: データのルートパスを `;` で区切って指定します。各ルートパスのストレージ媒体として HDD または SSD を指定できます。各ルートパスの末尾には、`,` で区切って容量制限を追加できます。SSD と HDD のディスクを混在させない場合は、以下の例 1 と例 2 の設定方法を使用せず、ストレージディレクトリを指定するだけで済みます。FE のデフォルトのストレージ媒体設定も変更する必要はありません。

  例 1: `storage_root_path=/home/disk1/doris.HDD;/home/disk2/doris.SSD;/home/disk2/doris`

    - 1./home/disk1/doris.HDD は、ストレージ媒体が HDD であることを示します。
    - 2./home/disk2/doris.SSD は、ストレージ媒体が SSD であることを示します。
    - 3./home/disk2/doris は、ストレージ媒体がデフォルトで HDD であることを示します。

  例 2: `storage_root_path=/home/disk1/doris,medium:hdd;/home/disk2/doris,medium:ssd`

    - 1./home/disk1/doris,medium:hdd は、ストレージ媒体が HDD であることを示します。
    - 2./home/disk2/doris,medium:ssd は、ストレージ媒体が SSD であることを示します。

* デフォルト値: ${DORIS_HOME}/storage

#### `heartbeat_service_thread_count` {#heartbeat_service_thread_count}

* 型: int32
* 説明: BE 上でハートビートサービスを実行するスレッド数です。デフォルトは 1 で、変更は推奨されません。
* デフォルト値: 1

#### `ignore_broken_disk` {#ignore_broken_disk}

* 型: bool
* 説明: BE の起動時に、``storage_root_path`` の設定に含まれるすべてのパスを確認します。

    -  `ignore_broken_disk=true`

  パスが存在しない場合、またはそのパス配下のファイルを読み書きできない場合（ディスク障害）は、そのパスを無視します。ほかに利用可能なパスがあれば、起動は中断されません。

    -  `ignore_broken_disk=false`

  パスが存在しない場合、またはそのパス配下のファイルを読み書きできない場合（ディスク障害）は、起動を中止して終了します。

* デフォルト値: false

#### `mem_limit` {#mem_limit}

* 型: string
* 説明: BE プロセスが使用できるメモリを、サーバーの最大メモリに対する割合で制限します。BE がマシンのメモリを使いすぎないようにするための設定です。このパラメータは 0 より大きい必要があります。割合が 100% を超える場合、値は 100% になります。
* デフォルト値: 90%

#### `cluster_id` {#cluster_id}

* 型: int32
* 説明: BE が属するクラスタの ID を設定します。
    - 通常、この値は FE から BE にハートビートで通知されるため、設定は不要です。BE が特定の Doris クラスタに属することが確定している場合に設定できます。その際は、データディレクトリ内の cluster_id ファイルも、このパラメータと同じ値になるよう変更する必要があります。
* デフォルト値: -1

#### `custom_config_dir` {#custom_config_dir}

* 説明: `be_custom.conf` ファイルの場所を指定します。デフォルトでは `conf/` ディレクトリにあります。
    - デプロイ環境によっては、システムのアップグレード時に `conf/` ディレクトリが上書きされ、ユーザーが変更した設定項目が失われることがあります。その場合は、`be_custom.conf` を別の指定ディレクトリに保存することで、設定ファイルの上書きを防げます。
* デフォルト値: 空白

#### `trash_file_expire_time_sec` {#trash_file_expire_time_sec}

* 説明: ごみ箱のクリーンアップ間隔は 24 時間です。ディスク容量が不足している場合、trash 配下のファイルの保持期間はこのパラメータに従わないことがあります。
* デフォルト値: 86400

#### `es_http_timeout_ms` {#es_http_timeout_ms}

* 説明: http 経由で ES に接続する際のタイムアウトです。
* デフォルト値: 5000 (ms)

#### `es_scroll_keepalive` {#es_scroll_keepalive}

* 説明: es scroll の keep-alive 保持時間です。
* デフォルト値: 5 (m)

#### `external_table_connect_timeout_sec` {#external_table_connect_timeout_sec}

* 型: int32
* 説明: ODBC テーブルなどの外部テーブルとの接続を確立する際のタイムアウトです。
* デフォルト値: 5 秒

#### `pipeline_status_report_interval` {#pipeline_status_report_interval}

* 説明: プロファイルの報告間隔です。
* デフォルト値: 5 秒

#### `brpc_max_body_size` {#brpc_max_body_size}

* 説明: 主に brpc の `max_body_size` パラメータを変更するための設定です。

  - クエリが失敗し、BE のログに `body_size is too large` というエラーが出ることがあります。SQL が「multi distinct + no group by + 1T を超えるデータ」の場合などに発生します。このエラーは、brpc のパケットサイズが設定値を超えたことを示します。設定値を増やすと回避できます。

#### `brpc_socket_max_unwritten_bytes` {#brpc_socket_max_unwritten_bytes}

* 説明: 主に brpc の `socket_max_unwritten_bytes` パラメータを変更するための設定です。
  - クエリが失敗し、BE のログに `The server is overcrowded` というエラーが出ることがあります。これは送信側でバッファリングするメッセージが多すぎることを意味し、SQL が大きな bitmap 値を送信する必要がある場合などに発生します。設定値を増やすと回避できます。

#### `transfer_large_data_by_brpc` {#transfer_large_data_by_brpc}

* 型: bool
* 説明: Tuple/Block データの長さが 1.8G を超える場合に、protoBuf リクエストをシリアライズし、Tuple/Block データを controller attachment に格納して http brpc 経由で送信するかどうかを制御します。これにより、protoBuf リクエストの長さが 2G を超えた際のエラー `Bad request, error_text=[E1003]Fail to compress request` を回避します。以前のバージョンでは、Tuple/Block データを attachment に格納した後、デフォルトの baidu_std brpc 経由で送信していましたが、attachment が 2G を超えると切り詰められていました。http brpc 経由の送信には 2G の制限がありません。
* デフォルト値: true

#### `brpc_num_threads` {#brpc_num_threads}

* 説明: 主に brpc の bthread 数を変更するための設定です。デフォルト値は 256 です。
  - QPS 性能を高めるため、より大きな値に設定できます。詳しくは `https://github.com/apache/incubator-brpc/blob/master/docs/cn/benchmark.md` を参照してください。
* デフォルト値: 256

#### `thrift_rpc_timeout_ms` {#thrift_rpc_timeout_ms}

* 説明: thrift のデフォルトのタイムアウトです。
* デフォルト値: 60000

#### `thrift_client_retry_interval_ms` {#thrift_client_retry_interval_ms}

* 型: int64
* 説明: FE の thrift サーバーへのリクエスト集中を避けるため、BE の thrift クライアントの再試行間隔を設定します。単位は ms です。
* デフォルト値: 1000

#### `thrift_connect_timeout_seconds` {#thrift_connect_timeout_seconds}

* 説明: thrift クライアント接続のデフォルトのタイムアウトです。
* デフォルト値: 3 (s)

#### `thrift_server_type_of_fe` {#thrift_server_type_of_fe}

* 型: string
* 説明: FE の Thrift サービスが使用するサービスモデルを示します。型は string で、大文字と小文字は区別されません。このパラメータは FE の thrift_server_type パラメータの設定と一致させる必要があります。現在、値は `THREADED` と `THREAD_POOL` の 2 つです。

    - `THREADED` の場合は、ノンブロッキング I/O モデルです。

    - `THREAD_POOL` の場合は、ブロッキング I/O モデルです。

#### `thrift_max_message_size` {#thrift_max_message_size}

デフォルト: 100MB

thrift サーバーが受信するメッセージの最大サイズです。単位はバイトです。クライアントが送信したメッセージがこの制限を超えると、Thrift サーバーはリクエストを拒否して接続を閉じます。その結果、クライアントで "connection has been closed by peer." というエラーが発生します。この場合は、このパラメータを増やしてみてください。

#### `txn_commit_rpc_timeout_ms` {#txn_commit_rpc_timeout_ms}

* 説明: txn 送信 RPC のタイムアウトです。
* デフォルト値: 60,000 (ms)

#### `txn_map_shard_size` {#txn_map_shard_size}

* 説明: txn_map_lock のシャードサイズです。値は 2^n（n=0,1,2,3,4）です。txn 管理の性能を向上させるための設定です。
* デフォルト値: 128

#### `txn_shard_size` {#txn_shard_size}

* 説明: txn_lock のシャードサイズです。値は 2^n（n=0,1,2,3,4）です。txn の送信と公開の性能を向上させるための設定です。
* デフォルト値: 1024

#### `unused_rowset_monitor_interval` {#unused_rowset_monitor_interval}

* 説明: 期限切れの Rowset を削除する間隔です。
* デフォルト値: 30 (s)

#### `max_client_cache_size_per_host` {#max_client_cache_size_per_host}

* 説明: ホストごとのクライアントキャッシュの最大数です。BE には複数のクライアントキャッシュがありますが、現在は同じキャッシュサイズ設定を使用します。必要に応じて、異なる設定で個別のクライアントキャッシュを構成してください。
* デフォルト値: 10

#### `string_type_length_soft_limit_bytes` {#string_type_length_soft_limit_bytes}

* 型: int32
* 説明: String 型の最大長に対するソフトリミットです。
* デフォルト値: 1,048,576

#### `big_column_size_buffer` {#big_column_size_buffer}

* 型: int64
* 説明: odbc 外部テーブルを使用し、odbc ソーステーブルの列の型が HLL、CHAR、VARCHAR のいずれかで、列の値の長さがこの値を超えると、クエリは 'column value length longer than buffer length' というエラーを報告します。この値を増やすことができます。
* デフォルト値: 65535

#### `small_column_size_buffer` {#small_column_size_buffer}

* 型: int64
* 説明: odbc 外部テーブルを使用し、odbc ソーステーブルの列の型が HLL、CHAR、VARCHAR のいずれでもなく、列の値の長さがこの値を超えると、クエリは 'column value length longer than buffer length' というエラーを報告します。この値を増やすことができます。
* デフォルト値: 100

### クエリ {#query}

#### `ignore_not_found_file_in_external_table` {#ignore_not_found_file_in_external_table}

* 型: bool
* 説明: 外部テーブルのリーダーが、見つからないファイルをスキップできるかどうかを指定します。動的な設定に対応します。バージョン 4.1.5 以降では、コミット済みの Iceberg スナップショットでデータファイルまたは delete ファイルが欠けている場合、`true` でもクエリは失敗します。不完全なスナップショットが知らないうちに返されることを防ぎます。
* デフォルト値: true

#### `parquet_metadata_size_limit` {#parquet_metadata_size_limit}

* 型: int64
* 説明: バージョン 4.1.5 以降でサポートされます。ネイティブ Parquet V2 リーダーにおける、シリアライズされたファイルフッターのメタデータの最大サイズです。単位はバイトです。`0` より大きい値にする必要があります。超過すると `Parquet v2 footer size ... exceeds metadata limit ...` が返されます。動的な設定に対応します。フッターが大きい有効なファイルを扱う場合は、メモリ予算の範囲内で増やしてください。
* デフォルト値: 268435456 (256 MiB)

#### `fragment_mgr_asynic_work_pool_queue_size` {#fragment_mgr_asynic_work_pool_queue_size}

* 説明: 単一ノードで処理できる非同期作業の上限です。
* デフォルト値: 4096

#### `fragment_mgr_asynic_work_pool_thread_num_min` {#fragment_mgr_asynic_work_pool_thread_num_min}

* 説明: 非同期作業を実行するスレッド数です。デフォルトの最小スレッド数は 16 です。
* デフォルト値: 16

#### `fragment_mgr_asynic_work_pool_thread_num_max` {#fragment_mgr_asynic_work_pool_thread_num_max}

* 説明: 非同期作業に応じてスレッドを動的に作成します。作成されるスレッドは最大 512 個です。
* デフォルト値: 512

#### `doris_scanner_row_num` {#doris_scanner_row_num}

* 説明: 各スキャンスレッドが 1 回の実行で返すデータ行の最大数です。
* デフォルト値: 16384

#### `doris_scanner_row_bytes` {#doris_scanner_row_bytes}

* 説明: 1 回の読み取りで実行する fragment の行データのバイト数です。
    - 注意: テーブルの列数が多く、`select *` が停止したように見える場合は、この設定を調整できます。
* デフォルト値: 10485760

#### `doris_scanner_thread_pool_queue_size` {#doris_scanner_thread_pool_queue_size}

* 型: int32
* 説明: Scanner スレッドプールのキューの長さです。Doris のスキャンタスクでは、各 Scanner がスレッドタスクとしてスレッドプールに送信され、実行を待ちます。送信済みタスクの数がキューの長さを超えると、後続のタスクはキューに空きができるまでブロックされます。
* デフォルト値: 102400

#### `doris_scanner_thread_pool_thread_num` {#doris_scanner_thread_pool_thread_num}

* 型: int32
* 説明: Scanner スレッドプールのスレッド数です。Doris のスキャンタスクでは、各 Scanner がスレッドタスクとしてスレッドプールに送信され、実行されます。このパラメータで Scanner スレッドプールのサイズを決めます。
* デフォルト値: CPU コア数に応じて決まります。`max(48, 2 * num_of_cpu_cores)` に等しくなります。

#### `doris_max_remote_scanner_thread_pool_thread_num` {#doris_max_remote_scanner_thread_pool_thread_num}

* 型: int32
* 説明: Remote scanner スレッドプールの最大スレッド数です。このプールは、すべての外部データソースのスキャンタスクに使用されます。
* デフォルト: 512

#### `exchg_node_buffer_size_bytes` {#exchg_node_buffer_size_bytes}

* 型: int32
* 説明: ExchangeNode ノードの Buffer キューのサイズです。単位はバイトです。Sender 側から送信されたデータ量が ExchangeNode の Buffer サイズを超えると、書き込み用の空きができるまで後続の送信がブロックされます。
* デフォルト値: 10485760

#### `doris_scan_range_max_mb` {#doris_scan_range_max_mb}

* 型: int32
* 説明: 各 OlapScanner が読み取るデータ量の上限です。
* デフォルト値: 1024

### コンパクション {#compaction}

#### `disable_auto_compaction` {#disable_auto_compaction}

* 型: bool
* 説明: 自動コンパクションタスクを無効にするかどうかを指定します。
  - 通常、この設定はオフにしておく必要があります。デバッグ環境やテスト環境でコンパクションタスクを手動操作する場合は、オンにできます。
* デフォルト値: false

#### `enable_vertical_compaction` {#enable_vertical_compaction}

* 型: bool
* 説明: vertical compaction を有効にするかどうかを指定します。
* デフォルト値: true

#### `vertical_compaction_num_columns_per_group` {#vertical_compaction_num_columns_per_group}

* 型: int32
* 説明: vertical compaction における各グループの列数です。
* デフォルト値: 5

#### `vertical_compaction_max_row_source_memory_mb` {#vertical_compaction_max_row_source_memory_mb}

* 型: int32
* 説明: vertical compaction における row_source_buffer の最大メモリ使用量です。単位は MB です。
* デフォルト値: 200

#### `vertical_compaction_max_segment_size` {#vertical_compaction_max_segment_size}

* 型: int32
* 説明: vertical compaction における出力先 segment ファイルの最大サイズです。単位は m バイトです。
* デフォルト値: 268435456

#### `enable_ordered_data_compaction` {#enable_ordered_data_compaction}

* 型: bool
* 説明: ordered data compaction を有効にするかどうかを指定します。
* デフォルト値: true

#### `ordered_data_compaction_min_segment_size` {#ordered_data_compaction_min_segment_size}

* 型: int32
* 説明: ordered data compaction における、入力 rowset の最小 segment サイズです。単位は m バイトです。
* デフォルト値: 10485760

#### `max_base_compaction_threads` {#max_base_compaction_threads}

* 型: int32
* 説明: base compaction スレッドプールの最大スレッド数です。-1 はディスクごとに 1 スレッドを意味します。
* デフォルト値: 4

#### `generate_compaction_tasks_interval_ms` {#generate_compaction_tasks_interval_ms}

* 説明: コンパクションタスクを生成する最小間隔（ms）です。
* デフォルト値: 10 (ms)

#### `base_compaction_min_rowset_num` {#base_compaction_min_rowset_num}

* 説明: BaseCompaction の起動条件の 1 つである、Cumulative ファイル数のしきい値です。このしきい値に達すると BaseCompaction が起動します。
* デフォルト値: 5

#### `base_compaction_min_data_ratio` {#base_compaction_min_data_ratio}

* 説明: BaseCompaction の起動条件の 1 つです。Cumulative ファイルのサイズが Base ファイルに対して指定の割合に達すると起動します。
* デフォルト値: 0.3 (30%)

#### `total_permits_for_compaction_score` {#total_permits_for_compaction_score}

* 型: int64
* 説明: すべてのコンパクションタスクが保持する「permits」の上限です。この設定でコンパクションのメモリ消費を制限できます。
* デフォルト値: 10000
* 動的変更可: はい

#### `compaction_promotion_size_mbytes` {#compaction_promotion_size_mbytes}

* 型: int64
* 説明: cumulative compaction の出力 rowset のディスク上の合計サイズがこの値を超えると、その rowset は base compaction に使用されます。単位は m バイトです。
  - 通常、この設定を 2G 未満にすると、cumulative compaction にかかる時間が長くなりすぎてバージョンが滞留するのを防げます。
* デフォルト値: 1024

#### `compaction_promotion_ratio` {#compaction_promotion_ratio}

* 型: double
* 説明: cumulative compaction の出力 rowset のディスク上の合計サイズが、base バージョンの rowset に対する設定済みの比率を超えると、その rowset は base compaction に使用されます。
  - 通常、設定値は 0.1 以下かつ 0.02 以上が推奨されます。
* デフォルト値: 0.05

#### `compaction_promotion_min_size_mbytes` {#compaction_promotion_min_size_mbytes}

* 型: int64
* 説明: cumulative compaction の出力 rowset のディスク上の合計サイズがこの値を下回る場合、その rowset は base compaction の対象にならず、cumulative compaction の対象に残ります。単位は m バイトです。
  - 通常、設定値は 512m 以内にします。大きすぎると初期の base バージョンのサイズが小さいままとなり、base compaction が実行されません。
* デフォルト値: 128

#### `compaction_min_size_mbytes` {#compaction_min_size_mbytes}

* 型: int64
* 説明: cumulative compaction で結合する際、選択した rowset のディスクサイズがこの設定値より大きければ、レベルポリシーに従って分割して結合します。小さければ直接結合します。単位は m バイトです。
  - 通常、設定値は 128m 以内にします。大きすぎると cumulative compaction の書き込み増幅が増えます。
* デフォルト値: 64

#### `default_rowset_type` {#default_rowset_type}

* 型: string
* 説明: BE がデフォルトで選択するストレージ形式を指定します。設定できる値は "**ALPHA**" と "**BETA**" です。主に次の 2 つの役割があります。
  - テーブルの storage_format が Default の場合、この設定に基づいて BE のストレージ形式を選択します。
  - BE が Compaction を実行する際のストレージ形式を選択します。
* デフォルト値: BETA

#### `cumulative_compaction_min_deltas` {#cumulative_compaction_min_deltas}

* 説明: cumulative compaction 戦略における増分ファイルの最小数です。
* デフォルト値: 5

#### `cumulative_compaction_max_deltas` {#cumulative_compaction_max_deltas}

* 説明: cumulative compaction 戦略における増分ファイルの最大数です。
* デフォルト値: 1000

#### `base_compaction_trace_threshold` {#base_compaction_trace_threshold}

* 型: int32
* 説明: base compaction のトレース情報をログに記録するしきい値です。単位は秒です。
* デフォルト値: 10

Base compaction は時間のかかるバックグラウンドタスクです。この設定はトレース情報をログに記録するしきい値です。ログファイルのトレース情報は次のようになります。

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
* 説明: 1 台のディスク（HDD）で並列に実行するコンパクションタスクの数です。
* デフォルト値: 4

#### `compaction_task_num_per_fast_disk` {#compaction_task_num_per_fast_disk}

* 型: int32
* 説明: 1 台の高速ディスク（SSD）で並列に実行するコンパクションタスクの数です。
* デフォルト値: 8

#### `cumulative_compaction_rounds_for_each_base_compaction_round` {#cumulative_compaction_rounds_for_each_base_compaction_round}

* 型: int32
* 説明: コンパクションタスクの生成時に、base compaction を 1 ラウンド実行するごとに cumulative compaction を何ラウンド実行するかを指定します。
* デフォルト値: 9

#### `max_cumu_compaction_threads` {#max_cumu_compaction_threads}

* 型: int32
* 説明: cumulative compaction スレッドプールの最大スレッド数です。-1 はディスクごとに 1 スレッドを意味します。
* デフォルト値: -1

#### `enable_segcompaction` {#enable_segcompaction}

* 型: bool
* 説明: データロード中に segment compaction を使用し、-238 エラーを回避するかどうかを指定します。
* デフォルト値: true

#### `segcompaction_batch_size` {#segcompaction_batch_size}

* 型: int32
* 説明: segment 数がこのしきい値を超えると segment compaction が起動します。また、1 つの segment compaction タスクに含める元の segment の最大数も制限します。
* デフォルト値: 10

#### `segcompaction_candidate_max_rows` {#segcompaction_candidate_max_rows}

* 型: int32
* 説明: 1 つの入力 segment で許容される最大行数です。これより大きい segment はスキップされます。
* デフォルト値: 1048576

#### `segcompaction_candidate_max_bytes` {#segcompaction_candidate_max_bytes}

* 型: int64
* 説明: 1 つの入力 segment で許容される最大ファイルサイズです。これより大きい segment はスキップされます。
* デフォルト値: 104857600

#### `segcompaction_task_max_rows` {#segcompaction_task_max_rows}

* 型: int32
* 説明: 1 つの segcompaction タスクで許容される合計行数の上限です。
* デフォルト値: 1572864

#### `segcompaction_task_max_bytes` {#segcompaction_task_max_bytes}

* 型: int64
* 説明: 1 つの segcompaction タスクで許容される合計ファイルサイズの上限です。
* デフォルト値: 157286400

#### `segcompaction_num_threads` {#segcompaction_num_threads}

* 型: int32
* 説明: グローバルな segcompaction スレッドプールのサイズです。
* デフォルト値: 5

#### `disable_compaction_trace_log` {#disable_compaction_trace_log}

* 型: bool
* 説明: コンパクションのトレースログを無効にします。
  - true に設定すると、`cumulative_compaction_trace_threshold` と `base_compaction_trace_threshold` は機能せず、ログ出力が無効になります。
* デフォルト値: true

#### `pick_rowset_to_compact_interval_sec` {#pick_rowset_to_compact_interval_sec}

* 型: int64
* 説明: コンパクション対象の rowset を選択する間隔です。単位は秒です。
* デフォルト値: 86400

#### `update_replica_infos_interval_seconds` {#update_replica_infos_interval_seconds}

* 説明: ピアレプリカの情報を更新する最小間隔（s）です。
* デフォルト値: 60 (s)

#### `cold_data_compaction_score_threshold` {#cold_data_compaction_score_threshold}

* 型: int32
* 説明: コールドデータのコンパクションを起動する前に必要な、コンパクションスコアの最小しきい値です。コールドデータのスコアがこの値を超えると、コンパクションが検討されます。この値を調整すると、リモートストレージのコールドデータに対するコンパクションの頻度と積極性を制御できます。バージョン 3.1.3 以降でサポートされます。
* デフォルト値: 100

#### `cold_data_compaction_thread_num` {#cold_data_compaction_thread_num}

* 型: int32
* 説明: コールドデータのコンパクションに使用するスレッド数です。タスクの並列度を制御します。増やすと同時に実行できるタスクが増え、スループットが向上する場合がありますが、リソース使用量も増えます。
* デフォルト値: 2

#### `cold_data_compaction_interval_sec` {#cold_data_compaction_interval_sec}

* 型: int32
* 説明: コールドデータのコンパクション起動を検討する間隔です。単位は秒です。短くすると検討頻度が増え、クリーンアップが速くなる可能性がある一方、リソース消費も増えます。
* デフォルト値: 1800 (秒)

#### `enable_compaction_pause_on_high_memory` {#enable_compaction_pause_on_high_memory}

* 型: bool
* 説明: プロセスのメモリ使用量が高いときにコンパクションタスクを一時停止するかどうかを指定します。動的に変更できます。
  - 有効にすると、メモリに余裕がない間は BE がコンパクションを一時停止し、クエリとデータロードを優先します。
  - ただし、コンパクションを一時停止すると、コンパクションスコアが高い tablet の結合がさらに難しくなり、解消しようとしていたメタデータとメモリの滞留が悪化します。**バージョン 4.0.8 以降、デフォルト値は `true` から `false` に変更されました。** そのため、デフォルトではメモリ使用量が高くてもコンパクションは一時停止されません。
  - 以前の動作を維持するには、`true` に戻してください。
* デフォルト値: false (4.0.8 より前は true)

### データロード {#load}

#### `request_cdc_client_timeout_ms` {#request_cdc_client_timeout_ms}

* 型: int32
* 説明: CDC クライアントのリクエストタイムアウトです。単位はミリ秒です。動的な設定に対応します。バージョン 4.1.5 では、時間のかかる CDC リクエストを許容するため、デフォルト値が `60000` から `120000` に引き上げられました。
* デフォルト値: 120000 (4.1.5 より前は 60000)

#### `enable_table_memtable_flush_backpressure` {#enable_table_memtable_flush_backpressure}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。この BE 上で、あるテーブルの MemTable にフラッシュ待ちが多すぎる場合に、そのテーブルへの新しい書き込みをブロックするかどうかを指定します。FE の設定 `enable_adaptive_random_bucket_load` と組み合わせて使用し、adaptive random bucket のデータロード中に MemTable が滞留してメモリ使用量が膨らむのを防ぎます。
* デフォルト値: true

#### `table_memtable_flush_pending_count_limit` {#table_memtable_flush_pending_count_limit}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。この BE 上で、単一テーブルに許容するフラッシュ待ち MemTable の最大数です。制限を超えると、数が制限未満になるまで新しい書き込みをブロックします。`enable_table_memtable_flush_backpressure = true` の場合にのみ有効です。
* デフォルト値: 10

#### `group_commit_max_wal_num_per_table` {#group_commit_max_wal_num_per_table}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。単一テーブルに存在できる Group Commit WAL ファイルの最大数です。`0` は制限なしを意味します。WAL の再生に失敗し続け、WAL がこの制限を超えて蓄積すると、そのテーブルの `async_mode` Group Commit データロードは、`Too many group commit async WALs for table ...` のようなメッセージを持つ `EXCEEDED_LIMIT` エラーで拒否されます。この制限により、WAL が際限なく増えてディスクを埋めることを防ぎます。
* デフォルト値: 10

#### `enable_stream_load_record` {#enable_stream_load_record}

* 型: bool
* 説明: Stream Load の記録機能を有効にするかどうかを指定します。デフォルトは false です。
* デフォルト値: false

#### `load_data_reserve_hours` {#load_data_reserve_hours}

* 説明: mini load に使用します。この時間が経過すると、mini load のデータファイルが削除されます。
* デフォルト値: 4 (h)

#### `push_worker_count_high_priority` {#push_worker_count_high_priority}

* 説明: HIGH 優先度のデータロードタスクを処理するスレッド数です。
* デフォルト値: 3

#### `push_worker_count_normal_priority` {#push_worker_count_normal_priority}

* 説明: NORMAL 優先度のデータロードタスクを処理するスレッド数です。
* デフォルト値: 3

#### `enable_single_replica_load` {#enable_single_replica_load}

* 説明: 単一レプリカによるデータロード機能を有効にするかどうかを指定します。
* デフォルト値: true

#### `load_error_log_reserve_hours` {#load_error_log_reserve_hours}

* 説明: この時間が経過すると、データロードのエラーログが削除されます。
* デフォルト値: 48 (h)

#### `load_error_log_limit_bytes` {#load_error_log_limit_bytes}

* 説明: データロードのエラーログがこの値を超えると、ログは切り詰められます。
* デフォルト値: 209715200 (byte)

#### `load_process_max_memory_limit_percent` {#load_process_max_memory_limit_percent}

* 説明: 単一ノードの全データロードスレッドが使用できるメモリの上限を、メモリ上限に対する割合で指定します。デフォルトは 50% です。
  - Doris のアップグレード時にデータロード性能へ影響しないよう、これらのデフォルト値は大きめに設定されています。必要に応じて、適切な値に設定してください。
* デフォルト値: 50 (%)

#### `load_process_soft_mem_limit_percent` {#load_process_soft_mem_limit_percent}

* 説明: ソフトリミットは、単一ノードのデータロード用メモリ上限に対する割合です。たとえば全データロードタスクのメモリ上限が 20GB の場合、ソフトリミットのデフォルトはその 50%、つまり 10GB です。データロードのメモリ使用量がソフトリミットを超えると、最も多くメモリを消費しているジョブが選択され、フラッシュによってメモリが解放されます。デフォルトは 50% です。
* デフォルト値: 50 (%)

#### `slave_replica_writer_rpc_timeout_sec` {#slave_replica_writer_rpc_timeout_sec}

* 型: int32
* 説明: 単一レプリカによるデータロードで使用する、master レプリカと slave レプリカ間の brpc タイムアウトを変更するための設定です。
* デフォルト値: 60

#### `max_segment_num_per_rowset` {#max_segment_num_per_rowset}

* 型: int32
* 説明: データロード時に新しく生成される rowset の segment 数を制限します。しきい値を超えると、データロードは -238 エラーで失敗します。segment が多すぎると、コンパクションが大量のメモリを消費し、OOM エラーが発生します。
* デフォルト値: 200

#### `high_priority_flush_thread_num_per_store` {#high_priority_flush_thread_num_per_store}

* 型: int32
* 説明: 高優先度のデータロードタスクに割り当てる、store パスごとのフラッシュスレッド数です。
* デフォルト値: 1

#### `routine_load_consumer_pool_size` {#routine_load_consumer_pool_size}

* 型: int32
* 説明: Routine Load が使用するデータコンシューマーのキャッシュ数です。
* デフォルト値: 10

#### `multi_table_batch_plan_threshold` {#multi_table_batch_plan_threshold}

* 型: int32
* 説明: single-stream-multi-table のデータロードに使用します。kafka から受け取ったメッセージのバッチサイズがこのしきい値を超えると、関連するすべてのテーブルのプランをリクエストします。
* デフォルト値: 200

#### `multi_table_max_wait_tables` {#multi_table_max_wait_tables}

* 型: int32
* 説明: single-stream-multi-table のデータロードに使用します。Kafka からメッセージのバッチを受け取ったとき、プランを待つテーブルの数がこのしきい値を超えると、関連するすべてのテーブルのプランをリクエストします。このパラメータは、同時に大量のプランをリクエストして実行することを避けるためのものです。データロード中に複数のテーブルを小さなバッチで処理すると、単一 RPC の負荷を減らし、データ処理のリアルタイム性を高められます。
* デフォルト値: 5

#### `single_replica_load_download_num_workers` {#single_replica_load_download_num_workers}

* 型: int32
* 説明: 単一レプリカによるデータロードで使用する、segment ダウンロード用の http ワーカースレッド数です。データロードの並行数が増えた場合、このパラメータを調整すると、Slave レプリカが Master レプリカからデータファイルを適時に同期できます。必要に応じて、IO 性能を高めるために `webserver_num_workers` も増やしてください。
* デフォルト値: 64

#### `load_task_high_priority_threshold_second` {#load_task_high_priority_threshold_second}

* 型: int32
* 説明: データロードタスクのタイムアウトがこのしきい値未満の場合、Doris は高優先度タスクとみなします。高優先度タスクは専用のフラッシュスレッドプールを使用します。
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

* 説明: 使用する Kafka のバージョンが 0.10.0.0 より古く、kafka_api_version_request が false の場合は、フォールバックバージョンとして kafka_broker_version_fallback の値が使用されます。有効な値は 0.9.0.x と 0.8.x.y です。
* デフォルト: 0.10.0

#### `max_consumer_num_per_group` {#max_consumer_num_per_group}

* 説明: Routine Load に使用する、データコンシューマーグループあたりの最大コンシューマー数です。
* デフォルト: 3

#### `streaming_load_max_mb` {#streaming_load_max_mb}

* 型: int64
* 説明: 1 回の Stream Load で許容する csv データ量の上限を指定します。
  - Stream Load は一般に数 GB 未満のデータロードに適しており、非常に大きなデータのデータロードには適していません。
* デフォルト値: 10240 (MB)
* 動的変更可: はい

#### `streaming_load_json_max_mb` {#streaming_load_json_max_mb}

* 型: int64
* 説明: 1 回の Stream Load で許容する json データ量の上限を指定します。単位は MB です。
  - JSON など一部のデータ形式は分割できません。Doris は解析を始める前に、すべてのデータをメモリに読み込む必要があります。そのため、この値で 1 回の Stream Load でデータロードできるデータ量を制限します。
* デフォルト値: 100
* 動的変更可: はい

#### `olap_table_sink_send_interval_microseconds` {#olap_table_sink_send_interval_microseconds}

* 説明: データロード中は、Coordinator の sink ノードから対応する BE へデータを送り続けるポーリングスレッドがあります。このスレッドは `olap_table_sink_send_interval_microseconds` マイクロ秒ごとに送信するデータがあるかを確認します。
* デフォルト値: 1000

#### `olap_table_sink_send_interval_auto_partition_factor` {#olap_table_sink_send_interval_auto_partition_factor}

* 説明: 自動パーティションが有効なテーブルにデータをロードする場合、`olap_table_sink_send_interval_microseconds` の間隔では遅すぎます。この場合、実際の間隔にはこの係数が掛けられます。
* デフォルト値: 0.001

#### `enable_group_commit_streamload_be_forward` {#enable_group_commit_streamload_be_forward}

* 型: bool
* 説明: コンピュートとストレージを分離したモードで、Group Commit の Stream Load BE 転送を有効にするかどうかを指定します。Doris 4.0 系ではバージョン 4.0.8、4.1 系ではバージョン 4.1.4 で追加されました。動的に変更できます。
  - ロードバランサーが同じテーブルへの Group Commit リクエストを異なる BE にランダムに振り分けると、効果的にバッチ化できません。この機能を有効にすると、BE がリクエストを単一の転送先 BE に転送します。
  - **バージョン 4.0.8 以降、BE のエンドポイント `/api/{db}/{table}/_stream_load_forward` はこの設定で制御されます。`false` の場合、このエンドポイントへのリクエストは `Stream load forward is disabled` を伴う `403 Forbidden` を返します。`true` の場合も、リクエストには認証とグローバルな `LOAD` 権限が必要です。**
  - この転送を利用するデプロイでは、FE と BE の両方で設定を `true` にする必要があります（[FE 設定](./fe-config) にある同名の FE 設定を参照）。
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
* 説明: BE 上の thrift サーバーサービスの実行スレッド数です。FE からのリクエストの実行に使用できるスレッド数を表します。
* デフォルト値: 64

#### `download_worker_count` {#download_worker_count}

* 説明: ダウンロード用スレッド数です。
* デフォルト値: 1

#### `drop_tablet_worker_count` {#drop_tablet_worker_count}

* 説明: tablet を削除するスレッド数です。
* デフォルト値: 3

#### `flush_thread_num_per_store` {#flush_thread_num_per_store}

* 説明: store ごとにメモリテーブルをフラッシュするためのスレッド数です。
* デフォルト値: 2

#### `publish_version_worker_count` {#publish_version_worker_count}

* 説明: バージョンを公開するスレッド数です。
* デフォルト値: 8

#### `upload_worker_count` {#upload_worker_count}

* 説明: ファイルをアップロードするスレッドの最大数です。
* デフォルト値: 1

#### `webserver_num_workers` {#webserver_num_workers}

* 説明: Webserver のデフォルトのワーカースレッド数です。
* デフォルト値: 48

#### `send_batch_thread_pool_thread_num` {#send_batch_thread_pool_thread_num}

* 型: int32
* 説明: SendBatch スレッドプールのスレッド数です。NodeChannel のデータ送信タスクでは、各 NodeChannel の SendBatch 操作がスレッドタスクとしてスレッドプールに送信され、実行されます。このパラメータで SendBatch スレッドプールのサイズを決めます。
* デフォルト値: 64

#### `send_batch_thread_pool_queue_size` {#send_batch_thread_pool_queue_size}

* 型: int32
* 説明: SendBatch スレッドプールのキューの長さです。NodeChannel のデータ送信タスクでは、各 NodeChannel の SendBatch 操作がスレッドタスクとしてスレッドプールに送信され、実行を待ちます。送信済みタスクの数がキューの長さを超えると、後続のタスクはキューに空きができるまでブロックされます。
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
* 説明: linux の huge page メモリを使用するかどうかを指定します。
* デフォルト値: false

#### `max_memory_sink_batch_count` {#max_memory_sink_batch_count}

* 説明: 外部スキャンキャッシュの最大バッチ数です。キャッシュされる行数は max_memory_cache_batch_count * batch_size です。デフォルトは 20、batch_size のデフォルト値は 1024 であるため、20 * 1024 行がキャッシュされます。
* デフォルト値: 20

#### `memory_max_alignment` {#memory_max_alignment}

* 説明: メモリの最大アラインメントです。
* デフォルト値: 16

#### `mmap_buffers` {#mmap_buffers}

* 説明: メモリの割り当てに mmap を使用するかどうかを指定します。
* デフォルト値: false

#### `memtable_mem_tracker_refresh_interval_ms` {#memtable_mem_tracker_refresh_interval_ms}

* 説明: memtable flush mgr の更新処理間隔です。単位はミリ秒です。
* デフォルト値: 100

#### `zone_map_row_num_threshold` {#zone_map_row_num_threshold}

* 型: int32
* 説明: ページ内の行数がこの値未満の場合、データ量の増加を抑えるため zonemap を作成しません。
* デフォルト値: 20

#### `memory_mode` {#memory_mode}

* 型: string
* 説明: tcmalloc の gc を制御します。performance モードでは、使用量が 90% * mem_limit 以上になると Doris は tcmalloc キャッシュのメモリを解放します。それ以外のモードでは、使用量が 50% * mem_limit 以上になると解放します。
* デフォルト値: performance

#### `max_sys_mem_available_low_water_mark_bytes` {#max_sys_mem_available_low_water_mark_bytes}

* 型: int64
* 説明: システムの `/proc/meminfo/MemAvailable` に対する低水位の最大値です。単位はバイト、デフォルトは 1.6G です。実際の低水位は min(1.6G, MemTotal * 10%) で、16G を超える大容量メモリのマシンでメモリを無駄に確保しすぎないようにします。最大値を上げると、メモリが 16G を超えるマシンでは Full GC 用により多くのメモリバッファが確保されます。最大値を下げると、利用可能なメモリをできるだけ多く使用します。
* デフォルト値: 1717986918

#### `memory_limitation_per_thread_for_schema_change_bytes` {#memory_limitation_per_thread_for_schema_change_bytes}

* 説明: 1 つのスキーマ変更タスクに許容される最大メモリ量です。
* デフォルト値: 2147483648 (2GB)

#### `mem_tracker_consume_min_size_bytes` {#mem_tracker_consume_min_size_bytes}

* 型: int32
* 説明: MemTracker の consume/release を行う TCMalloc Hook の最小サイズです。この値より小さい消費量は、MemTracker の consume/release を頻繁に呼び出さないよう累積されます。値を小さくすると consume/release の頻度が増えます。値を大きくすると MemTracker の統計値の精度が低下します。理論上、MemTracker の統計値と実際の値の差は、( mem_tracker_consume_min_size_bytes * その MemTracker が属する BE スレッド数) です。
* デフォルト値: 1,048,576

#### `min_buffer_size` {#min_buffer_size}

* 説明: 読み取りバッファの最小サイズです。
* デフォルト値: 1024 (byte)

#### `write_buffer_size` {#write_buffer_size}

* 説明: フラッシュ前のバッファサイズです。
  - データロードされたデータはまず BE 上のメモリブロックに書き込まれ、このブロックがしきい値に達したときにだけディスクへ書き戻されます。デフォルトのサイズは 200MB です。しきい値が小さすぎると、BE 上に小さなファイルが大量に作成されることがあります。値を増やすとファイル数を減らせますが、大きすぎると RPC のタイムアウトが発生する可能性があります。
* デフォルト値: 209,715,200

#### `remote_storage_read_buffer_mb` {#remote_storage_read_buffer_mb}

* 型: int32
* 説明: hdfs またはオブジェクトストレージ上のファイルを読み取る際に使用するキャッシュサイズです。
  - 値を増やすとリモートデータの読み取り呼び出し回数を減らせますが、メモリの負荷は増えます。
* デフォルト値: 16 (MB)

#### `file_cache_type` {#file_cache_type}

* 型: string
* 説明: キャッシュファイルの種類です。`whole_file_cache` は segment ファイル全体をダウンロードし、`sub_file_cache` は segment ファイルをサイズに応じて複数のファイルに分割します。"" に設定するとキャッシュしません。キャッシュが必要な場合は、このパラメータを設定してください。
* デフォルト値: ""

#### `path_gc_check` {#path_gc_check}

* 型：bool
* 説明: リサイクル対象データをスキャンするスレッドのチェックを有効にするかどうかを指定します。
* デフォルト：true

#### `path_gc_check_interval_second` {#path_gc_check_interval_second}

* 説明: リサイクル対象データをスキャンするスレッドのチェック間隔です。
* デフォルト：86400 (s)

#### `path_gc_check_step` {#path_gc_check_step}

* デフォルト：1000

#### `path_gc_check_step_interval_ms` {#path_gc_check_step_interval_ms}

* デフォルト：10 (ms)

#### `scan_context_gc_interval_min` {#scan_context_gc_interval_min}

* 説明: context gc スレッドのスケジューリング周期を設定します。単位は分で、デフォルトは 5 分です。
* デフォルト：5

### ストレージ {#storage}

#### `inverted_index_skip_norms_for_variant` {#inverted_index_skip_norms_for_variant}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされます。動的な設定に対応します。`true` の場合、VARIANT のサブパスに対する転置インデックスは、インデックスの `norms` プロパティに関係なく Norms を省略します。複数のサブパスのインデックスが占めるストレージを削減できますが、それらのインデックスでは Norms を必要とする BM25 の `score()` 計算ができなくなります。デフォルトでは Norms を保持します。[関連度スコアリング](../../table-design/index/inverted-index/scoring.md) を参照してください。
* デフォルト値: false

#### `default_num_rows_per_column_file_block` {#default_num_rows_per_column_file_block}

* 型: int32
* 説明: 1 つの RowBlock に含まれるデータ行数を設定します。
* デフォルト値: 1024

#### `disable_storage_page_cache` {#disable_storage_page_cache}

* 型: bool
* 説明: インデックスのキャッシュに page cache を使用しないようにします。この設定は BETA ストレージ形式でのみ有効です。通常は false が推奨されます。
* デフォルト値: false

#### `disk_stat_monitor_interval` {#disk_stat_monitor_interval}

* 説明: ディスク状態の確認間隔です。
* デフォルト値: 5 (s)

#### `max_free_io_buffers` {#max_free_io_buffers}

* 説明: io バッファの各サイズについて、IoMgr が保持するバッファの最大数です。バッファサイズは 1024B から 8MB までで、バッファの合計は最大で約 2GB になります。
* デフォルト値: 128

#### `max_garbage_sweep_interval` {#max_garbage_sweep_interval}

* 説明: ディスクの不要データをクリーンアップする最大間隔です。
* デフォルト値: 3600 (s)

#### `max_percentage_of_error_disk` {#max_percentage_of_error_disk}

* 型: int32
* 説明: ストレージエンジンが許容する、故障したハードディスクの割合です。故障したハードディスクの割合がこの値を超えると、BE は自動的に終了します。
* デフォルト値: 0

#### `min_garbage_sweep_interval` {#min_garbage_sweep_interval}

* 説明: ディスクの不要データをクリーンアップする最小間隔です。
* デフォルト値: 180 (s)

#### `pprof_profile_dir` {#pprof_profile_dir}

* 説明: pprof プロファイルの保存ディレクトリです。
* デフォルト値: ${DORIS_HOME}/log

#### `small_file_dir` {#small_file_dir}

* 説明: SmallFileMgr がダウンロードしたファイルを保存するディレクトリです。
* デフォルト値: ${DORIS_HOME}/lib/small_file/

#### `user_function_dir` {#user_function_dir}

* 説明: udf 関数のディレクトリです。
* デフォルト値: `${DORIS_HOME}/lib/udf`

#### `storage_flood_stage_left_capacity_bytes` {#storage_flood_stage_left_capacity_bytes}

* 説明: データディレクトリに残す必要がある最小バイト数です。
* デフォルト値: 1073741824

#### `storage_flood_stage_usage_percent` {#storage_flood_stage_usage_percent}

* 説明: storage_flood_stage_usage_percent と storage_flood_stage_left_capacity_bytes の設定で、データディレクトリの容量の最大使用量を制限します。
* デフォルト値: 90 (90%)

#### `storage_medium_migrate_count` {#storage_medium_migrate_count}

* 説明: クローンに使用するスレッド数です。
* デフォルト値: 1

#### `storage_page_cache_limit` {#storage_page_cache_limit}

* 説明: ストレージページ用キャッシュのサイズです。
* デフォルト値: 20%

#### `storage_page_cache_shard_size` {#storage_page_cache_shard_size}

* 説明: StoragePageCache のシャード数です。値は 2 の累乗である必要があります。ロック競合を減らすため、BE のコア数に近い値が推奨されます。
* デフォルト値: 16

#### `index_page_cache_percentage` {#index_page_cache_percentage}

* 型: int32
* 説明: ストレージページキャッシュ全体に占めるインデックスページキャッシュの割合です。有効範囲は [0, 100] です。
* デフォルト値: 10

#### `segment_cache_capacity` {#segment_cache_capacity}
* 型: int32
* 説明: segment キャッシュのエントリ（キーは rowset id）の最大数です。-1 は後方互換性のための値で、fd_number * 2/5 を意味します。
* デフォルト値: -1

#### `storage_strict_check_incompatible_old_format` {#storage_strict_check_incompatible_old_format}

* 型: bool
* 説明: 互換性のない古い形式を厳密にチェックするために使用します。
* デフォルト値: true
* 動的変更: false

#### `sync_tablet_meta` {#sync_tablet_meta}

* 説明: ストレージエンジンが sync を有効にし、ディスクへの同期を維持するかどうかを指定します。
* デフォルト値: true

#### `pending_data_expire_time_sec` {#pending_data_expire_time_sec}

* 説明: ストレージエンジンが未検証のデータを保持する最大期間です。
* デフォルト値: 1800 (s)

#### `ignore_rowset_stale_unconsistent_delete` {#ignore_rowset_stale_unconsistent_delete}

* 型: boolean
* 説明: 古くなった結合済み rowset が一貫したバージョンパスを形成できない場合に、その rowset を削除するかどうかを決めます。
  - 結合済みで期限切れになった rowset のバージョンパスは、30 分後に削除されます。異常な状況では、これらのバージョンを削除すると、クエリに必要な一貫したパスを構築できなくなる場合があります。設定が false の場合、プログラムは厳密にチェックし、エラーを報告して終了します。true の場合はこのエラーを無視して動作を続けます。通常、このエラーを無視してもクエリに影響しませんが、結合済みバージョンが FE によって割り当てられた場合にのみ -230 エラーが発生します。
* デフォルト値: false

#### `create_tablet_worker_count` {#create_tablet_worker_count}

* 説明: BE が tablet を作成するためのワーカースレッド数です。
* デフォルト値: 3

#### `check_consistency_worker_count` {#check_consistency_worker_count}

* 説明: tablet のチェックサムを計算するワーカースレッド数です。
* デフォルト値: 1

#### `max_tablet_version_num` {#max_tablet_version_num}

* 型: int
* 説明: 単一 tablet のバージョン数を制限します。データロードの頻度が高すぎる場合やコンパクションが間に合わない場合に、大量のバージョンが蓄積するのを防ぎます。制限を超えると、データロードタスクは拒否されます。
* デフォルト値: 2000

#### `tablet_map_shard_size` {#tablet_map_shard_size}

* 説明: tablet_map_lock のシャードサイズです。値は 2^n（n=0,1,2,3,4）です。tablet 管理の性能を高めるための設定です。
* デフォルト値: 4

#### `tablet_meta_checkpoint_min_interval_secs` {#tablet_meta_checkpoint_min_interval_secs}

* 説明: TabletMeta Checkpoint スレッドのポーリング間隔です。
* デフォルト値: 600 (s)

#### `tablet_meta_checkpoint_min_new_rowsets_num` {#tablet_meta_checkpoint_min_new_rowsets_num}

* 説明: TabletMeta Checkpoint を保存するために必要な Rowset の最小数です。
* デフォルト値: 10

#### `tablet_rowset_stale_sweep_time_sec` {#tablet_rowset_stale_sweep_time_sec}

* 型: int64
* 説明: 結合済み rowset バージョンのクリーンアップまでの期間を制御します。現在時刻 now() から、あるバージョンパス内で最も新しく作成された rowset の作成時刻を引いた時間が tablet_rowset_stale_sweep_time_sec を超えると、そのパスがクリーンアップされ、結合済み rowset が削除されます。単位は秒です。
  - 書き込み頻度が高すぎると、FE が結合済みバージョンをクエリできず、クエリで -230 エラーが発生することがあります。このパラメータを増やすと回避できます。
* デフォルト値: 300

#### `tablet_writer_open_rpc_timeout_sec` {#tablet_writer_open_rpc_timeout_sec}

* 説明: tablet 状態キャッシュの更新間隔です。
    - データロード時に Batch（1024 行）を送信する RPC のタイムアウトです。デフォルトは 60 秒です。この RPC では複数のメモリバッチを書き込むことがあり、その処理によってタイムアウトする場合があります。この値を調整すると、send batch fail などのタイムアウトエラーを減らせます。`write_buffer_size` の設定を増やす場合は、このパラメータも増やす必要があります。
* デフォルト値: 60

#### `tablet_writer_ignore_eovercrowded` {#tablet_writer_ignore_eovercrowded}

* 型: bool
* 説明: データの書き込み時に brpc エラー '[E1011]The server is overcrowded' を無視するために使用します。
* デフォルト値: false

#### `streaming_load_rpc_max_alive_time_sec` {#streaming_load_rpc_max_alive_time_sec}

* 説明: TabletsChannel の存続期間です。この時間内にデータを受信しなければ、チャネルは削除されます。
* デフォルト値: 1200

#### `alter_tablet_worker_count` {#alter_tablet_worker_count}

* 説明: スキーマ変更を行うスレッド数です。
* デフォルト値: 3

#### `alter_index_worker_count` {#alter_index_worker_count}

* 説明: インデックス変更を行うスレッド数です。
* デフォルト値: 3

#### `ignore_load_tablet_failure` {#ignore_load_tablet_failure}

* 型: bool
* 説明: tablet の読み込みに失敗した場合に、エラーを無視して BE の起動を続けるかどうかを決めます。
* デフォルト値: false

BE の起動時には、各データディレクトリに対して個別のスレッドが起動し、tablet ヘッダーのメタ情報を読み込みます。デフォルト設定では、いずれかのデータディレクトリで tablet の読み込みに失敗すると、起動処理は終了します。同時に、` be INFO ` ログに次のエラーメッセージが表示されます。

```
load tablets from header failed, failed tablets size: xxx, path=xxx
```

これは、そのデータディレクトリで読み込みに失敗した tablet の数を示します。ログには、失敗した tablet の詳細情報も記録されます。原因を調査するには手動での対応が必要です。調査後、通常は次の 2 つの方法で復旧します。
  - tablet 情報を修復できない場合、ほかのレプリカが正常であれば、`meta_tool` ツールで問題のある tablet を削除できます。
  - `ignore_load_tablet_failure` を true に設定すると、BE は問題のある tablet を無視して正常に起動します。

#### `report_disk_state_interval_seconds` {#report_disk_state_interval_seconds}

* 説明: agent がディスクの状態を FE に報告する間隔です。
* デフォルト値: 60 (s)

#### `result_buffer_cancelled_interval_time` {#result_buffer_cancelled_interval_time}

* 説明: 結果バッファをキャンセルするまでの時間です。
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

* 説明: ログを分割するサイズです。1G ごとに 1 つのログファイルに分割します。
* デフォルト値: SIZE-MB-1024

#### `sys_log_roll_num` {#sys_log_roll_num}

* 説明: 保持するログファイルの数です。
* デフォルト値: 10

#### `sys_log_verbose_level` {#sys_log_verbose_level}

* 説明: ログの詳細表示レベルです。コード内で VLOG から始まるログの出力を制御します。
* デフォルト値: 10

#### `sys_log_verbose_modules` {#sys_log_verbose_modules}

* 説明: ログを出力するモジュールです。olap を指定すると、olap モジュールのログのみを出力します。
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

* 説明: ログのフラッシュ方針です。デフォルトではメモリに保持されます。
* デフォルト値: 空

### その他 {#others}

#### `enable_arrow_input_validation` {#enable_arrow_input_validation}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。Arrow データを Doris 内部の列に変換する前に、Arrow の入力バッファを検証するかどうかを指定します。有効にすると、不正な Arrow データによる BE のクラッシュを防げますが、検証の処理負荷が少し増えます。
* デフォルト値: true

#### `report_tablet_interval_seconds` {#report_tablet_interval_seconds}

* 説明: agent が olap テーブルを FE に報告する間隔です。
* デフォルト値: 60 (s)

#### `report_task_interval_seconds` {#report_task_interval_seconds}

* 説明: agent がタスクのシグネチャを FE に報告する間隔です。
* デフォルト値: 10 (s)

#### `periodic_counter_update_period_ms` {#periodic_counter_update_period_ms}

* 説明: レートカウンターとサンプリングカウンターの更新周期です。
* デフォルト値: 500 (ms)

#### `enable_metric_calculator` {#enable_metric_calculator}

* 説明: true に設定すると、メトリクス計算処理が動作して BE 関連の指標情報を収集します。false に設定すると動作しません。
* デフォルト値: true

#### `enable_system_metrics` {#enable_system_metrics}

* 説明: システム指標のオンとオフをユーザーが制御します。
* デフォルト値: true

#### `enable_token_check` {#enable_token_check}

* 説明: 前方互換性のために使用します。今後削除される予定です。
* デフォルト値: true

#### `max_runnings_transactions_per_txn_map` {#max_runnings_transactions_per_txn_map}

* 説明: txn manager の各 txn_partition_map における txn の最大数です。manager に大量の txn が保存されることを避けるための保護設定です。
* デフォルト値: 2000

#### `max_download_speed_kbps` {#max_download_speed_kbps}

* 説明: ダウンロード速度の上限です。
* デフォルト値: 50000 (kb/s)

#### `download_low_speed_time` {#download_low_speed_time}

* 説明: ダウンロードの時間制限です。
* デフォルト値: 300 (s)

#### `download_low_speed_limit_kbps` {#download_low_speed_limit_kbps}

* 説明: ダウンロード速度の下限です。
* デフォルト値: 50 (KB/s)

#### `enable_batch_download` {#enable_batch_download}

* 説明: ファイルをバッチでダウンロードするかどうかを指定します。binlog を有効にしている場合はオンにすることが推奨されます。
* デフォルト値: false

#### `priority_queue_remaining_tasks_increased_frequency` {#priority_queue_remaining_tasks_increased_frequency}

* 説明: BlockingPriorityQueue 内で待機中のタスクの優先度を引き上げる頻度です。
* デフォルト値: 512


#### `jdbc_drivers_dir` {#jdbc_drivers_dir}

* 説明: jdbc ドライバーを配置するデフォルトのディレクトリです。
* デフォルト値: `${DORIS_HOME}/jdbc_drivers`

#### `enable_simdjson_reader` {#enable_simdjson_reader}

* 説明: Stream Load 中の json の解析に simdjson を使用するかどうかを指定します。
* デフォルト値: true

#### `user_files_secure_path` {#user_files_secure_path}

* 説明: `local` テーブル値関数がクエリするファイルの保存ディレクトリです。
* デフォルト値: `${DORIS_HOME}`

#### `brpc_streaming_client_batch_bytes` {#brpc_streaming_client_batch_bytes}

* 説明: brpc streaming client が送信するデータのバッチサイズです。
* デフォルト値: 262144

#### `grace_shutdown_wait_seconds` {#grace_shutdown_wait_seconds}

* 説明: クラウドネイティブのデプロイでは、BE のクラスタへの追加とクラスタからの削除が頻繁に行われます。終了中の BE で fragment が実行されていると、ユーザーのクエリが失敗します。`stop_be.sh --grace` を使用すると、BE は実行中のすべてのクエリが終了するまで待ち、クエリの失敗を避けます。ただし、待機時間が制限を超えると、BE は直ちに終了します。この間、FE は BE に新しいクエリを送信せず、実行中のクエリがすべて終了するのを待ちます。
* デフォルト値: 120

#### `enable_java_support` {#enable_java_support}

* 説明: BE で java-jni を使用できるようにするかどうかを指定します。有効にすると、c++ と java の相互呼び出しが可能になります。現在、hudi、java-udf、jdbc、max-compute、paimon、preload、avro をサポートします。
* デフォルト値: true

#### `group_commit_wal_path` {#group_commit_wal_path}

* group commit の `WAL` ディレクトリです。
* デフォルト: `storage_root_path` の各ディレクトリの下に `wal` という名前のディレクトリが作成されます。設定例:
  ```
  group_commit_wal_path=/data1/storage/wal;/data2/storage/wal;/data3/storage/wal
  ```

### コンピュートとストレージの分離モード {#compute-and-storage-disaggregated-mode}

#### `deploy_mode` {#deploy_mode-1}

* デフォルト: ""

* 説明: BE の実行モードです。`cloud` はコンピュートとストレージを分離したモードを示します。

#### `meta_service_endpoint` {#meta_service_endpoint}

デフォルト: ""

* 説明: Meta Service のエンドポイントを 'host1:port,host2:port' 形式で指定します。通常、この値は FE から BE にハートビートで通知されるため、設定は不要です。

#### `enable_file_cache` {#enable_file_cache}

デフォルト: true（バージョン 4.1.5 以降はデフォルトで有効。それ以前は false。コンピュートとストレージを分離したモードでは常に有効）。

* 説明: ファイルキャッシュを使用するかどうかを指定します。変更には BE の再起動が必要です。セッション変数 `enable_file_cache` も有効にする必要があります。バージョン 4.1.5 では BE の設定とセッション変数の両方のデフォルト値が `true` に変更されました。既存の明示的な設定と永続化されたグローバル変数をそれぞれ確認してください。

#### `enable_ms_rpc_host_level_rate_limit_dry_run` {#enable_ms_rpc_host_level_rate_limit_dry_run}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされます。動的な設定に対応します。BE から Meta Service への RPC について、ホスト単位のレート制限を待機なしで評価します。`enable_ms_rpc_host_level_rate_limit` とは独立しており、その設定が `false` でも評価は実行されます。両方が `true` の場合は dry-run が優先されます。レート制限を実際に適用するには、`enable_ms_rpc_host_level_rate_limit` を有効にし、この設定を無効にします。
* デフォルト値: true

#### `enable_ms_backpressure_handling_dry_run` {#enable_ms_backpressure_handling_dry_run}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされます。動的な設定に対応します。Meta Service の `MS_BUSY` 応答をきっかけとするテーブル単位の適応的レート制限を、待機なしで評価します。`enable_ms_backpressure_handling` とは独立しており、両方が `true` の場合は dry-run が優先されます。テーブル単位のレート制限を実際に適用するには、`enable_ms_backpressure_handling` を有効にし、この設定を無効にします。
* デフォルト値: true

#### `cache_peer_read_failure_threshold` {#cache_peer_read_failure_threshold}

* 型: int32
* 説明: バージョン 4.2.0 以降でサポートされます。動的な設定に対応します。ピアアドレスに対する接続または RPC の連続失敗回数で、この回数に達するとサーキットブレーカーが開きます。実効最小値は `1` です。このアドレス単位の状態は異なる tablet のピア読み取りで共有され、到達できないノードへの接続を繰り返さないようにします。
* デフォルト値: 3

#### `cache_peer_read_circuit_open_seconds` {#cache_peer_read_circuit_open_seconds}

* 型: int32
* 説明: バージョン 4.2.0 以降でサポートされます。動的な設定に対応します。開いているピアのサーキットブレーカーが、そのアドレスへの読み取りを拒否する時間です。単位は秒です。負の値は `0` として扱われます。この期間が経過すると、復旧確認の試行が 1 回許可されます。
* デフォルト値: 30

#### `delete_bitmap_store_v2_max_bytes_in_fdb` {#delete_bitmap_store_v2_max_bytes_in_fdb}

* 型: int64
* 説明: コンピュートとストレージを分離したモードで FDB に直接保存する Delete Bitmap V2 の、シリアライズ後の最大サイズです。単位はバイトです。動的な設定に対応します。負でないしきい値を超える値は、代わりにオブジェクトストレージのファイルに保存されます。負の値にすると、このサイズによる退避は無効になります。バージョン 4.1.5 では、90000 バイトのチャンク内に追加のメッセージフィールド用の余地を残すため、デフォルト値が `1024` から `89000` に引き上げられました。
* デフォルト値: 89000 (4.1.5 より前は 1024)

#### `enable_remove_agg_pre_rowsets_delete_bitmap_by_keys` {#enable_remove_agg_pre_rowsets_delete_bitmap_by_keys}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされます。動的な設定に対応します。コンピュートとストレージを分離したモードで、集約済みの過去の Delete Bitmap を置き換える際に、終了バージョンのレコードをキー単位で削除します。範囲削除を使用するには `false` に設定します。これは既存のクリーンアップでのレコード削除方法だけを変更し、追加のクリーンアップタスクを有効にするものではありません。
* デフォルト値: true

#### `enable_remove_pre_rowsets_delete_bitmap_by_keys` {#enable_remove_pre_rowsets_delete_bitmap_by_keys}

* 型: bool
* 説明: バージョン 4.1.5 以降でサポートされます。動的な設定に対応します。コンピュートとストレージを分離したモードで、集約範囲内の過去の Delete Bitmap をクリーンアップする際に、開始バージョン（含む）から終了バージョン（含まない）までのレコードをキー単位で削除します。範囲削除を使用するには `false` に設定します。既存のクリーンアップ用スイッチと前提条件は引き続き適用されます。
* デフォルト値: true

#### `file_cache_path` {#file_cache_path}

デフォルト: [{"path":"${DORIS_HOME}/file_cache"}]
* 説明: ファイルキャッシュに使用するディスクパスとその他のパラメータです。ディスクごとに 1 つのエントリを持つ配列で表します。`path` はディスクパスを指定し、`total_size` はキャッシュサイズを制限します。-1 または 0 の場合はディスク容量全体を使用します。
* 形式: [{"path":"/path/to/file_cache","total_size":21474836480,{"path":"/path/to/file_cache2","total_size":21474836480}]

#### `enable_async_file_cache_write` {#enable_async_file_cache_write}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。ファイルキャッシュへ非同期に書き込むかどうかを指定します。有効にすると、リモートデータのファイルキャッシュへの書き戻しをバックグラウンドのスレッドプールに渡し、読み取り処理をブロックしないため、コールドリードのレイテンシーが下がります。
* デフォルト値: false

#### `async_file_cache_write_workers_per_disk` {#async_file_cache_write_workers_per_disk}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。ファイルキャッシュへの非同期書き込み時に、キャッシュディスクごとに使用する書き込みスレッド数です。`enable_async_file_cache_write = true` の場合にのみ有効です。
* デフォルト値: 16

#### `async_file_cache_write_max_pending_bytes` {#async_file_cache_write_max_pending_bytes}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。ファイルキャッシュへの非同期書き込みを待つデータの合計サイズの上限です。単位はバイトです。この制限を超える書き戻しリクエストは破棄されます。クエリの正しさには影響しませんが、該当データはキャッシュされません。`-1` は制限なしを意味します。
* デフォルト値: -1

#### `enable_file_cache_write_from_s3_file_writer` {#enable_file_cache_write_from_s3_file_writer}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。オブジェクトストレージへの書き込み中に、ローカルのファイルキャッシュにもデータを書き込むかどうかを指定します。これにより、書き込んだばかりのデータをキャッシュから直接読み取れます。
* デフォルト値: true

#### `enable_file_cache_write_index_file_only` {#enable_file_cache_write_index_file_only}

* 型: bool
* 説明: バージョン 4.1.4 で追加されました。インデックスファイルのみをファイルキャッシュに書き込むかどうかを指定します。有効にすると、キャッシュ容量が限られている場合にインデックスを優先してキャッシュに保持できます。
* デフォルト値: false

#### `enable_cache_read_from_peer` {#enable_cache_read_from_peer}

* 型: bool
* 説明: ピアキャッシュ読み取りのマスタースイッチです。有効にすると、ローカルの File Cache にブロックがない場合、まず別の BE の File Cache（同じコンピュートグループまたは別のグループ）から読み取ろうとし、どの BE にもない場合にのみオブジェクトストレージへフォールバックします。同一グループ内とグループ間のピア読み取りは、このスイッチでまとめて制御されます。グループ間の読み取りだけを無効にすることはできません。グループ間のピア読み取りはバージョン 4.2.0 以降でサポートされ、このバージョンでは設定項目 `cache_read_from_peer_expired_seconds` も削除されました。[ピアキャッシュ読み取り](../../compute-storage-decoupled/file-cache/file-cache-peer-read) を参照してください。
* デフォルト値: false (必要な場合に明示的に有効化)

#### `enable_peer_s3_race` {#enable_peer_s3_race}

* 型: bool
* 説明: バージョン 4.2.0 で追加されました。ピアからの読み取りとオブジェクトストレージからの読み取りを競合させ、先に得られた結果を採用するかどうかを指定します。無効の場合は順番に読み取ります。ピア候補を 1 つずつ試し、すべて失敗した後にのみオブジェクトストレージを読み取ります。
* デフォルト値: true

#### `peer_race_hedge_delay_ms` {#peer_race_hedge_delay_ms}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。競合時にピア読み取りを先行させる時間です。単位はミリ秒です。この時間内にピアが応答すれば、オブジェクトストレージへの読み取りは送信されません。`0` にすると両方の読み取りを同時に開始します。
* デフォルト値: 20

#### `max_concurrent_peer_races` {#max_concurrent_peer_races}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。1 つの BE で、ピアとオブジェクトストレージの読み取りを同時に競合させる最大数です。この上限を超えたキャッシュミスは順番に読み取られます。
* デフォルト値: 64

#### `peer_cache_fill_compute_group_id` {#peer_cache_fill_compute_group_id}

* 型: string
* 説明: 読み取りを発行する BE 上で設定します。グループ間の fill を担当するコンピュートグループの ID です（コンピュートグループ名ではなく、`SHOW BACKENDS` の `Tag` 列にある `compute_group_id`）。選択されたピア候補がこのコンピュートグループに属する場合、リクエストは、そのピアがブロックを持っていなければオブジェクトストレージから取得して自身の File Cache に書き込むよう要求します。空の場合、fill は使用されません。
* デフォルト値: ""

#### `enable_peer_server_cache_fill` {#enable_peer_server_cache_fill}

* 型: bool
* 説明: キャッシュを提供する BE 上で設定します。fill フラグを含むピア読み取りリクエストを受け付けるかどうかを指定します。無効の場合、ローカルにキャッシュされていないブロックは見つからないものとして報告され、要求元の BE はオブジェクトストレージへフォールバックします。
* デフォルト値: true

#### `peer_server_cache_fill_timeout_ms` {#peer_server_cache_fill_timeout_ms}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。提供側で 1 回の fill を待つ最大時間です。単位はミリ秒です。タイムアウトすると、要求元の BE はオブジェクトストレージへフォールバックします。
* デフォルト値: 6000

#### `max_concurrent_peer_server_fills` {#max_concurrent_peer_server_fills}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。提供側で同時に実行できる fill の最大数です。上限を超える fill リクエストは拒否され、要求元の BE はオブジェクトストレージへフォールバックします。
* デフォルト値: 32

#### `peer_rpc_failure_eviction_threshold` {#peer_rpc_failure_eviction_threshold}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。ピア候補の RPC がこの回数だけ連続して失敗すると、その候補を候補リストから削除します。
* デフォルト値: 3

#### `peer_all_miss_cooldown_threshold` {#peer_all_miss_cooldown_threshold}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。すべてのピア候補でキャッシュミスとなる読み取りが連続してこの回数に達すると、その tablet はクールダウンに入ります。クールダウン中の読み取りは直接オブジェクトストレージへ向かいます。
* デフォルト値: 5

#### `peer_all_miss_cooldown_duration_s` {#peer_all_miss_cooldown_duration_s}

* 型: int64
* 説明: バージョン 4.2.0 で追加されました。ピア読み取りのクールダウン期間です。単位は秒です。
* デフォルト値: 300

#### `peer_candidate_expiry_s` {#peer_candidate_expiry_s}

* 型: int64
* 説明: バージョン 4.2.0 で追加されました。ピア候補のエントリの有効期間です。最後の使用時刻からの秒数で測定します。期限切れのエントリはメモリから削除され、次のキャッシュミス時に FE から再取得されます。
* デフォルト値: 3600

#### `peer_candidate_cleanup_interval_s` {#peer_candidate_cleanup_interval_s}

* 型: int64
* 説明: バージョン 4.2.0 で追加されました。期限切れのピア候補を削除するバックグラウンドジョブの実行間隔です。単位は秒です。
* デフォルト値: 3600

#### `peer_fetch_queue_timeout_ms` {#peer_fetch_queue_timeout_ms}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。ピア読み取りリクエストが提供側の処理キューで待機できる最大時間です。単位はミリ秒です。これより長く待ったリクエストは拒否され、要求元の BE がすぐにオブジェクトストレージへフォールバックできるようにします。
* デフォルト値: 100

#### `brpc_peer_fetch_pool_threads` {#brpc_peer_fetch_pool_threads}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。提供側でピア読み取りリクエストを処理するスレッドプールのサイズです。データロードなど負荷の高い RPC のスレッドプールとは分離されています。`-1` は `max(64, 2 × CPU cores)` を意味します。動的には変更できません。
* デフォルト値: -1

#### `brpc_peer_fetch_pool_max_queue_size` {#brpc_peer_fetch_pool_max_queue_size}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。提供側のピア読み取りスレッドプールのキューの長さです。`-1` は `max(4096, 128 × CPU cores)` を意味します。動的には変更できません。
* デフォルト値: -1

#### `min_peer_race_s3_thread_num` / `max_peer_race_s3_thread_num` {#min_peer_race_s3_thread_num--max_peer_race_s3_thread_num}

* 型: int32
* 説明: バージョン 4.2.0 で追加されました。ピアとオブジェクトストレージの読み取りを競合させる際、要求元でオブジェクトストレージを読み取るスレッドプールの最小／最大スレッド数です。動的には変更できません。
* デフォルト値: 0 / 32

#### `s3_get_requests_per_second_per_core` / `s3_put_requests_per_second_per_core` {#s3_get_requests_per_second_per_core--s3_put_requests_per_second_per_core}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。オブジェクトストレージへの GET／PUT リクエストに対する、CPU コアごとに計算する QPS 制限です。負の値はこのモードを無効にし、従来の絶対値によるトークン設定にフォールバックします。`0` は QPS 制限なしを意味します。
* デフォルト値: -1

#### `s3_get_requests_per_second_max` / `s3_put_requests_per_second_max` {#s3_get_requests_per_second_max--s3_put_requests_per_second_max}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コア数から導出される GET／PUT の QPS に対する絶対的な上限です。`0` 以下の値は上限なしを意味します。
* デフォルト値: 0

#### `s3_get_bytes_per_second_per_core` / `s3_put_bytes_per_second_per_core` {#s3_get_bytes_per_second_per_core--s3_put_bytes_per_second_per_core}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。オブジェクトストレージの GET／PUT に対する、CPU コアごとに計算する帯域幅の制限です（コアあたりのバイト／秒）。`0` 以下の値は帯域幅制限なしを意味します。
* デフォルト値: -1

#### `s3_get_bytes_per_second_max` / `s3_put_bytes_per_second_max` {#s3_get_bytes_per_second_max--s3_put_bytes_per_second_max}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。CPU コア数から導出される GET／PUT の帯域幅に対する絶対的な上限です。単位はバイト／秒です。`0` 以下の値は上限なしを意味します。
* デフォルト値: 0

#### `s3_rate_limiter_cpu_cores_override` {#s3_rate_limiter_cpu_cores_override}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。上記のレート制限を計算する際に使用する CPU コア数です。`0` 以下の値は、マシンのコア数を自動検出することを意味します。
* デフォルト値: 0

#### `s3_rate_limiter_log_interval` {#s3_rate_limiter_log_interval}

* 型: int64
* 説明: バージョン 4.1.4 で追加されました。オブジェクトストレージのレート制限が適用されたときに出力するログエントリの最小間隔です。単位はミリ秒です。
* デフォルト値: 1000

#### `file_cache_mem_storage_shard_num` {#file_cache_mem_storage_shard_num}

* 型: int32
* 説明: バージョン 4.1.4 で追加されました。ファイルキャッシュのメモリストレージのシャード数です。並行アクセス時のロック競合を減らすために使用します。
* デフォルト値: 1024

#### `time_series_max_tablet_version_num` {#time_series_max_tablet_version_num}

* 型: int
* 説明: time-series compaction ポリシーの下で、単一 tablet のバージョン数を制限します。データロードの頻度が高すぎる場合やコンパクションが間に合わない場合に、大量のバージョンが蓄積するのを防ぎます。制限を超えると、データロードタスクは拒否されます。
* デフォルト値: 20000
