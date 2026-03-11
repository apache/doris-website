---
{
  "title": "ログ",
  "language": "ja",
  "description": "このドキュメントは、コア可観測性コンポーネントの一つであるLogsのストレージと分析プラクティスを紹介します。"
}
---
この文書では、コア観測可能性コンポーネントの1つであるLogsのストレージと分析プラクティスについて紹介します。完全な観測可能性ソリューションの概要については、[概要](overview)を参照してください。

## Step 1: リソースの見積もり

クラスタをデプロイする前に、サーバーに必要なハードウェアリソースを見積もる必要があります。以下の手順に従ってください：

1. 以下の計算式でデータ書き込みのリソースを見積もります：

- `平均書き込みスループット = 日次データ増分 / 86400 s`

- `ピーク書き込みスループット = 平均書き込みスループット \* ピーク書き込みスループットと平均書き込みスループットの比率`

- `ピーク書き込みスループットに必要なCPUコア数 = ピーク書き込みスループット / 単一コアCPUの書き込みスループット`

1. 計算式でデータストレージのリソースを見積もります：`ストレージ容量 = 日次データ増分 / データ圧縮率 * データコピー数 * データ保存期間`。

2. データクエリのリソースを見積もります。データクエリのリソースは、クエリ量と複雑さに依存します。最初にデータクエリ用にCPUリソースの50%を予約し、実際のテスト結果に応じて調整することをお勧めします。

3. 計算結果を以下のように統合します：

    1. Step 1とStep 3で計算されたCPUコア数をBEサーバーのCPUコア数で割ることで、BEサーバー数を取得できます。

    2. BEサーバー数とStep 2の計算結果に基づいて、各BEサーバーに必要なストレージ容量を見積もります。

    3. 各BEサーバーに必要なストレージ容量を4～12のデータディスクに割り当てることで、単一データディスクに必要なストレージ容量を取得できます。

例として、日次データ増分が100 TB、データ圧縮率が5、データコピー数が2、ホットデータの保存期間が3日、コールドデータの保存期間が30日、ピーク書き込みスループットと平均書き込みスループットの比率が200%、単一コアCUPの書き込みスループットが10 MB/s、データクエリ用にCPUリソースの50%を予約する場合、以下のように見積もることができます：

**compute-storage-integrated mode**
- FEサーバー3台が必要で、それぞれ16コアCPU、64 GBメモリ、1 100 GB SSDディスクで構成
- BEサーバー30台が必要で、それぞれ32コアCPU、256 GBメモリ、8 625 GB SSDディスクで構成
- S3オブジェクトストレージ容量 540 TB

**compute-storage-decoupled mode**
- FEサーバー3台が必要で、それぞれ16コアCPU、64 GBメモリ、1 100 GB SSDディスクで構成
- BEサーバー15台が必要で、それぞれ32コアCPU、256 GBメモリ、8 680 GB SSDディスクで構成
- S3オブジェクトストレージ容量 600 TB

storage-compute separationモードを使用すると、書き込み操作とホットデータストレージには1つのレプリカのみが必要で、コストを大幅に削減できます。

上記の例における指標の値とその計算方法については、以下の表を参照してください。

| 指標（単位） | compute-storage-decoupled | compute-storage-integrated | 説明 |
| --- | :---- | --- | --- |
| 日次データ増分（TB） | 100 | 100 | 実際のニーズに応じて値を指定してください。 |
| データ圧縮率 | 5   | 5 | 実際のニーズに応じて値を指定してください。通常3～10の間です。データにはインデックスデータが含まれることに注意してください。 |
| データコピー数 | 1   | 2 | 実際のニーズに応じて値を指定してください。1、2、または3を指定できます。デフォルト値は1です。 |
| ホットデータの保存期間（日） | 3   | 3 | 実際のニーズに応じて値を指定してください。 |
| コールドデータの保存期間（日） | 30  | 27 | 実際のニーズに応じて値を指定してください。 |
| データ保存期間 | 30  | 30 | 計算式：`ホットデータの保存期間 + コールドデータの保存期間` |
| ホットデータの推定ストレージ容量（TB） | 60 | 120 | 計算式：`日次データ増分 / データ圧縮率 * データコピー数 * ホットデータの保存期間` |
| コールドデータの推定ストレージ容量（TB） | 600 | 540 | 計算式：`日次データ増分 / データ圧縮率 * データコピー数 * コールドデータの保存期間` |
| ピーク書き込みスループットと平均書き込みスループットの比率 | 200% | 200% | 実際のニーズに応じて値を指定してください。デフォルト値は200%です。 |
| BEサーバーのCPUコア数 | 32  | 32 | 実際のニーズに応じて値を指定してください。デフォルト値は32です。 |
| 平均書き込みスループット（MB/s） | 1214 | 2427 | 計算式：`日次データ増分 / 86400 s` |
| ピーク書き込みスループット（MB/s） | 2427 | 4855 | 計算式：`平均書き込みスループット * ピーク書き込みスループットと平均書き込みスループットの比率` |
| ピーク書き込みスループットに必要なCPUコア数 | 242.7 | 485.5 | 計算式：`ピーク書き込みスループット / 単一コアCPUの書き込みスループット` |
| データクエリ用に予約するCPUリソースの割合 | 50% | 50% | 実際のニーズに応じて値を指定してください。デフォルト値は50%です。 |
| 推定BEサーバー数 | 15.2 | 30.3 | 計算式：`ピーク書き込みスループットに必要なCPUコア数 / BEサーバーのCPUコア数 /(1 - データクエリ用に予約するCPUリソースの割合)` |
| 四捨五入したBEサーバー数 | 15  | 30 | 計算式：`MAX (データコピー数, 推定BEサーバー数)` |
| 各BEサーバーの推定データストレージ容量（TB） | 5.33 | 5.33 | 計算式：`ホットデータの推定ストレージ容量 / 推定BEサーバー数 /(1 - 30%)`、ここで30%は予約ストレージ容量の割合を表します。<br /><br />I/O能力を向上させるため、各BEサーバーに4～12のデータディスクをマウントすることをお勧めします。 |

## Step 2: クラスタのデプロイ

リソースを見積もった後、クラスタをデプロイする必要があります。物理環境と仮想環境の両方で手動デプロイすることをお勧めします。手動デプロイについては、[Manual Deployment](../install/deploy-manually/integrated-storage-compute-deploy-manually.md)を参照してください。

## Step 3: FEとBE設定の最適化

クラスタのデプロイが完了したら、ログのストレージと分析シナリオにより適合するように、フロントエンドとバックエンドの設定パラメータをそれぞれ最適化する必要があります。

**FE設定の最適化**

FE設定フィールドは`fe/conf/fe.conf`にあります。FE設定を最適化するには、以下の表を参照してください。

| 最適化すべき設定フィールド                                   | 説明                                                         |
| :----------------------------------------------------------- | :----------------------------------------------------------- |
| `max_running_txn_num_per_db = 10000`                         | 高同時実行インポートトランザクションに対応するためパラメータ値を増やします。 |
| `streaming_label_keep_max_second = 3600` `label_keep_max_second = 7200` | 高メモリ使用量の高頻度インポートトランザクションを処理するため保持時間を増やします。 |
| `enable_round_robin_create_tablet = true`                    | Tabletの作成時に、均等に分散するためRound Robin戦略を使用します。 |
| `tablet_rebalancer_type = partition`                         | Tabletのバランシング時に、各パーティション内で均等に分散する戦略を使用します。 |
| `autobucket_min_buckets = 10`                                | ログ量が増加した際の不十分なバケット数を避けるため、自動バケット化のバケットの最小数を1から10に増やします。 |
| `max_backend_heartbeat_failure_tolerance_count = 10`         | ログシナリオでは、BEサーバーで高負荷が発生し短期的なタイムアウトが発生する可能性があるため、許容カウントを1から10に増やします。 |

詳細については、[FE 設定](../admin-manual/config/fe-config.md)を参照してください。

**BE設定の最適化**

BE設定フィールドは`be/conf/be.conf`にあります。BE設定を最適化するには、以下の表を参照してください。

| モジュール      | 最適化すべき設定フィールド                                   | 説明                                                         |
| :--------- | :----------------------------------------------------------- | :----------------------------------------------------------- |
| Storage    | `storage_root_path = /path/to/dir1;/path/to/dir2;...;/path/to/dir12` | ディスクディレクトリのホットデータのストレージパスを設定します。 |
| -          | `enable_file_cache = true`                                   | ファイルキャッシングを有効にします。                         |
| -          | `file_cache_path = [{"path": "/mnt/datadisk0/file_cache", "total_size":53687091200, "query_limit": "10737418240"},{"path": "/mnt/datadisk1/file_cache", "total_size":53687091200,"query_limit": "10737418240"}]` | 以下の具体的な設定でコールドデータのキャッシュパスと関連設定を構成します：<br/>`path`: キャッシュパス<br/>`total_size`: キャッシュパスの総サイズ（バイト単位）、53687091200バイトは50 GBに相当<br/>`query_limit`: 1回のクエリでキャッシュパスから照会できるデータの最大量（バイト単位）、10737418240バイトは10 GBに相当 |
| Write      | `write_buffer_size = 1073741824`                             | 小ファイルとランダムI/O操作を減らし、パフォーマンスを向上させるため、書き込みバッファのファイルサイズを増やします。 |
| -          | `max_tablet_version_num = 20000`                             | テーブル作成のtime_series compaction戦略と連携し、より多くのバージョンを一時的に未マージのまま残すことを許可します |
| Compaction | `max_cumu_compaction_threads = 8`                            | CPUコア数 / 4に設定し、CPUリソースの1/4を書き込み用、1/4をバックグラウンドコンパクション用、2/1をクエリおよびその他の操作用に使用することを示します。 |
| -          | `inverted_index_compaction_enable = true`                    | コンパクション時のCPU消費を削減するため、転置インデックスコンパクションを有効にします。 |
| -          | `enable_segcompaction = false` `enable_ordered_data_compaction = false` | ログシナリオには不要な2つのコンパクション機能を無効にします。 |
| -          | `enable_compaction_priority_scheduling = false` | 低優先度コンパクションは単一ディスクで2つのタスクに制限され、コンパクションの速度に影響する可能性があります。 |
| -          | `total_permits_for_compaction_score = 200000 ` | このパラメータはメモリの制御に使用され、メモリ時系列戦略下では、パラメータ自体がメモリを制御できます。 |
| Cache      | `disable_storage_page_cache = true` `inverted_index_searcher_cache_limit = 30%` | ログデータの大容量と限定的なキャッシング効果のため、データキャッシングからインデックスキャッシングに切り替えます。 |
| -          | `inverted_index_cache_stale_sweep_time_sec = 3600` `index_cache_entry_stay_time_after_lookup_s = 3600` | インデックスキャッシングをメモリ内で最大1時間維持します。     |
| -          | `enable_inverted_index_cache_on_cooldown = true`<br />`enable_write_index_searcher_cache = false` | インデックスアップロード中のコールドデータストレージの自動キャッシングを有効にします。 |
| -          | `tablet_schema_cache_recycle_interval = 3600` `segment_cache_capacity = 20000` | その他のキャッシュによるメモリ使用量を削減します。           |
| -          | `inverted_index_ram_dir_enable = true` | インデックスファイルへの一時書き込みによるIOオーバーヘッドを削減します。 |
| Thread     | `pipeline_executor_size = 24` `doris_scanner_thread_pool_thread_num = 48` | 32コアCPUでコア数に比例してコンピューティングスレッドとI/Oスレッドを設定します。 |
| -          | `scan_thread_nice_value = 5`                                 | 書き込みパフォーマンスと適時性を確保するため、クエリI/Oスレッドの優先度を下げます。 |
| Other      | `string_type_length_soft_limit_bytes = 10485760`             | 文字列型データの長さ制限を10 MBに増やします。                |
| -          | `trash_file_expire_time_sec = 300` `path_gc_check_interval_second  = 900` `path_scan_interval_second = 900` | ゴミファイルのリサイクルを加速します。                       |

詳細については、[BE 設定](../admin-manual/config/be-config)を参照してください。

## Step 4: テーブルの作成

ログデータの書き込みとクエリの両方に固有の特性があるため、パフォーマンスを向上させるために対象を絞った設定でテーブルを構成することをお勧めします。

**データパーティショニングとバケッティングの設定**

- データパーティショニングの場合：

    - [range partitioning](../table-design/data-partitioning/manual-partitioning.md#range-partitioning)（`PARTITION BY RANGE(`ts`)`）を[dynamic partitions](../table-design/data-partitioning/dynamic-partitioning.md)（`"dynamic_partition.enable" = "true"`）と組み合わせて有効にし、日単位で自動管理します。

    - 最新のNログエントリの高速検索のため、DATETIME型のフィールドをソートキー（`DUPLICATE KEY(ts)`）として使用します。

- データバケッティングの場合：

    - バケット数をクラスタ内のディスク総数のおおよそ3倍に設定し、各バケットが圧縮後約5GBのデータを含むようにします。

    - 単一tabletインポートと組み合わせてバッチ書き込み効率を最適化するため、Random戦略（`DISTRIBUTED BY RANDOM BUCKETS 60`）を使用します。

詳細については、[Data Partitioning](../table-design/data-partitioning/auto-partitioning)を参照してください。

**圧縮パラメータの設定**

データ圧縮効率を向上させるため、zstd圧縮アルゴリズム（"compression" = "zstd"）を使用します。

**コンパクションパラメータの設定**

コンパクションフィールドを以下のように設定します：

- 高スループットログ書き込みに重要な書き込み増幅を削減するため、time_series戦略（`"compaction_policy" = "time_series"`）を使用します。

**インデックスパラメータの設定**

インデックスフィールドを以下のように設定します：

- 頻繁にクエリされるフィールドのインデックスを作成します（`USING INVERTED`）。

- 全文検索が必要なフィールドでは、parserフィールドをunicodeとして指定します。これはほとんどの要件を満たします。フレーズクエリのサポートが必要な場合は、support_phraseフィールドをtrueに設定し、不要な場合はfalseに設定してストレージ容量を削減します。

**ストレージパラメータの設定**

ストレージポリシーを以下のように設定します：

- ホットデータのストレージでは、クラウドストレージを使用する場合はデータコピー数を1に設定し、物理ディスクを使用する場合はデータコピー数を最低2に設定します（`"replication_num" = "2"`）。

- log_s3のストレージ場所を設定し（`CREATE RESOURCE "log_s3"`）、3日後にデータが冷却されlog_s3の指定ストレージ場所に移動されるlog_policy_3dayポリシー（`CREATE STORAGE POLICY log_policy_3day`）を設定します。以下のSQLを参照してください。

```SQL
CREATE DATABASE log_db;
USE log_db;

-- unneccessary for the compute-storage-decoupled mode
CREATE RESOURCE "log_s3"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "your_endpoint_url",
    "s3.region" = "your_region",
    "s3.bucket" = "your_bucket",
    "s3.root.path" = "your_path",
    "s3.access_key" = "your_ak",
    "s3.secret_key" = "your_sk"
);

-- unneccessary for the compute-storage-decoupled mode
CREATE STORAGE POLICY log_policy_3day
PROPERTIES(
    "storage_resource" = "log_s3",
    "cooldown_ttl" = "259200"
);

CREATE TABLE log_table
(
  `ts` DATETIME,
  `host` TEXT,
  `path` TEXT,
  `message` TEXT,
  INDEX idx_host (`host`) USING INVERTED,
  INDEX idx_path (`path`) USING INVERTED,
  INDEX idx_message (`message`) USING INVERTED PROPERTIES("parser" = "unicode", "support_phrase" = "true")
)
ENGINE = OLAP
DUPLICATE KEY(`ts`)
PARTITION BY RANGE(`ts`) ()
DISTRIBUTED BY RANDOM BUCKETS 60
PROPERTIES (
  "compression" = "zstd",
  "compaction_policy" = "time_series",
  "dynamic_partition.enable" = "true",
  "dynamic_partition.create_history_partition" = "true",
  "dynamic_partition.time_unit" = "DAY",
  "dynamic_partition.start" = "-30",
  "dynamic_partition.end" = "1",
  "dynamic_partition.prefix" = "p",
  "dynamic_partition.buckets" = "60",
  "dynamic_partition.replication_num" = "2", -- unneccessary for the compute-storage-decoupled mode
  "replication_num" = "2", -- unneccessary for the compute-storage-decoupled mode
  "storage_policy" = "log_policy_3day" -- unneccessary for the compute-storage-decoupled mode
);
```
## Step 5: ログの収集

テーブル作成の完了後、ログ収集を進めることができます。

Apache Dorisは、オープンで汎用的なStream HTTP APIを提供しており、これを通じてLogstash、Filebeat、Kafkaなどの人気のあるログコレクターと接続してログ収集作業を実行できます。このセクションでは、Stream HTTP APIを使用してこれらのログコレクターを統合する方法について説明します。

**Logstashの統合**

以下の手順に従ってください：

1. Logstash Doris Outputプラグインをダウンロードしてインストールします。以下の2つの方法のうちいずれかを選択できます：

   - [クリックしてダウンロード](https://download.selectdb.com/extension/logstash-output-doris-1.2.0.gem)してインストールします。

   - ソースコードからコンパイルして、以下のコマンドを実行してインストールします：

```markdown  
./bin/logstash-plugin install logstash-output-doris-1.2.0.gem
```
2. Logstashを設定します。以下のフィールドを指定してください：

- `logstash.yml`：データ書き込みパフォーマンスを向上させるために、Logstashバッチ処理ログサイズとタイミングを設定するために使用されます。

```Plain Text  
pipeline.batch.size: 1000000  
pipeline.batch.delay: 10000
```
- `logstash_demo.conf`: 収集するログの具体的な入力パスとApache Dorisへの出力設定を構成するために使用されます。

```  
input {  
    file {  
    path => "/path/to/your/log"  
  }  
}  

output {  
  doris {  
    http_hosts => [ "<http://fehost1:http_port>", "<http://fehost2:http_port>", "<http://fehost3:http_port">]  
    user => "your_username"  
    password => "your_password"  
    db => "your_db"  
    table => "your_table"  
    
    # doris stream load http headers  
    headers => {  
    "format" => "json"  
    "read_json_by_line" => "true"  
    "load_to_single_tablet" => "true"  
    }  
    
    # field mapping: doris fileld name => logstash field name  
    # %{} to get a logstash field, [] for nested field such as [host][name] for host.name  
    mapping => {  
    "ts" => "%{@timestamp}"  
    "host" => "%{[host][name]}"  
    "path" => "%{[log][file][path]}"  
    "message" => "%{message}"  
    }  
    log_request => true  
    log_speed_interval => 10  
  }  
}
    ```
3. 以下のコマンドに従ってLogstashを実行し、ログを収集してApache Dorisに出力します。

```shell  
./bin/logstash -f logstash_demo.conf
```
Logstash Doris Output pluginの詳細については、[Logstash Doris Output Plugin](../ecosystem/observability/logstash.md)を参照してください。

**Filebeatの統合**

以下の手順に従ってください：

1. Apache Dorisへの出力をサポートするFilebeatバイナリファイルを取得します。[クリックしてダウンロード](https://download.selectdb.com/extension/filebeat-doris-2.1.1)するか、Apache Dorisのソースコードからコンパイルできます。

2. Filebeatを設定します。収集されたログの特定の入力パスとApache Dorisへの出力設定を構成するために使用されるfilebeat_demo.ymlフィールドを指定します。

```YAML  
# input
filebeat.inputs:
- type: log
enabled: true
paths:
    - /path/to/your/log
multiline:
    type: pattern
    pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}'
    negate: true
    match: after
    skip_newline: true

processors:
- script:
    lang: javascript
    source: >
        function process(event) {
            var msg = event.Get("message");
            msg = msg.replace(/\t/g, "  ");
            event.Put("message", msg);
        }
- dissect:
    # 2024-06-08 18:26:25,481 INFO (report-thread|199) [ReportHandler.cpuReport():617] begin to handle
    tokenizer: "%{day} %{time} %{log_level} (%{thread}) [%{position}] %{content}"
    target_prefix: ""
    ignore_failure: true
    overwrite_keys: true

# queue and batch
queue.mem:
events: 1000000
flush.min_events: 100000
flush.timeout: 10s

# output
output.doris:
fenodes: [ "http://fehost1:http_port", "http://fehost2:http_port", "http://fehost3:http_port" ]
user: "your_username"
password: "your_password"
database: "your_db"
table: "your_table"
# output string format
codec_format_string: '{"ts": "%{[day]} %{[time]}", "host": "%{[agent][hostname]}", "path": "%{[log][file][path]}", "message": "%{[message]}"}'
headers:
    format: "json"
    read_json_by_line: "true"
    load_to_single_tablet: "true"
```
3. 以下のコマンドに従ってFilebeatを実行し、ログを収集してApache Dorisに出力します。

    ```shell  
    chmod +x filebeat-doris-2.1.1
    ./filebeat-doris-2.1.1 -c filebeat_demo.yml
    ```
Filebeatの詳細については、[Beats Doris Output Plugin](../ecosystem/observability/beats.md)を参照してください。

**Kafkaの統合**

JSON形式のログをKafkaのメッセージキューに書き込み、Kafka Routine Loadを作成して、Apache DorisがKafkaからデータをアクティブにプルできるようにします。

以下の例を参照してください。`property.*`はLibrdkafkaクライアント関連の設定を表しており、実際のKafkaクラスターの状況に応じて調整する必要があります。

```SQL  
CREATE ROUTINE LOAD load_log_kafka ON log_db.log_table  
COLUMNS(ts, clientip, request, status, size)  
PROPERTIES (
"max_batch_interval" = "60",
"max_batch_rows" = "20000000",
"max_batch_size" = "1073741824", 
"load_to_single_tablet" = "true",
"format" = "json"
) 
FROM KAFKA (  
"kafka_broker_list" = "host:port",  
"kafka_topic" = "log__topic_",  
"property.group.id" = "your_group_id",  
"property.security.protocol"="SASL_PLAINTEXT",  
"property.sasl.mechanism"="GSSAPI",  
"property.sasl.kerberos.service.name"="kafka",  
"property.sasl.kerberos.keytab"="/path/to/xxx.keytab",  
"property.sasl.kerberos.principal"="<xxx@yyy.com>"  
);  
<br />SHOW ROUTINE LOAD;
```
Kafkaの詳細については、[Routine Load](../data-operate/import/import-way/routine-load-manual.md)を参照してください。

**カスタマイズされたプログラムを使用したログの収集**

一般的なログコレクタの統合に加えて、Stream Load HTTP APIを使用してApache Dorisにログデータをインポートするプログラムをカスタマイズすることもできます。以下のコードを参照してください：

```shell  
curl   
--location-trusted   
-u username:password   
-H "format:json"   
-H "read_json_by_line:true"   
-H "load_to_single_tablet:true"   
-H "timeout:600"   
-T logfile.json   
http://fe_host:fe_http_port/api/log_db/log_table/_stream_load
```
カスタムプログラムを使用する場合は、以下の重要なポイントに注意してください：

- HTTP認証にはBasic Authを使用し、コマンド echo -n 'username:password' | base64 を使って計算してください。

- HTTPヘッダー "format:json" を設定して、データフォーマットをJSONとして指定してください。

- HTTPヘッダー "read_json_by_line:true" を設定して、1行に1つのJSONを指定してください。

- HTTPヘッダー "load_to_single_tablet:true" を設定して、小さなファイルのインポートを減らすために一度に1つのバケットにデータをインポートしてください。

- クライアント側では100MBから1GBのサイズのバッチを書き込むことを推奨します。Apache Dorisバージョン2.1以上では、Group Commit機能を通じてクライアント側でバッチサイズを減らす必要があります。

## ステップ6：ログのクエリと分析

**ログのクエリ**

Apache Dorisは標準SQLをサポートしているため、MySQLクライアントまたはJDBC経由でクラスターに接続し、ログクエリ用のSQLを実行できます。

```Plain Text  
mysql -h fe_host -P fe_mysql_port -u your_username -Dyour_db_name
```
参考用の一般的なSQLクエリコマンド5つを以下に示します：

- 最新の10件のログエントリを表示

```SQL  
SELECT * FROM your_table_name ORDER BY ts DESC LIMIT 10;
```
- ホストが8.8.8.8である最新の10件のログエントリを照会する

```SQL  
SELECT * FROM your_table_name WHERE host = '8.8.8.8' ORDER BY ts DESC LIMIT 10;
```
- リクエストフィールドにerrorまたは404を含む最新の10件のログエントリを取得します。以下のコマンドでは、MATCH_ANYはApache Dorisがフィールド内の任意のキーワードをマッチングするために使用する全文検索SQLシンタックスです。

```SQL  
SELECT * FROM your_table_name WHERE message **MATCH_ANY** 'error 404'  
ORDER BY ts DESC LIMIT 10;
```
- request フィールドに image と faq を含む最新の10件のログエントリを取得します。以下のコマンドで、MATCH_ALL は Apache Doris でフィールド内のすべてのキーワードにマッチするために使用される全文検索 SQL 構文です。

```SQL  
SELECT * FROM your_table_name WHERE message **MATCH_ALL** 'image faq'  
ORDER BY ts DESC LIMIT 10;
```
- リクエストフィールド内でimageとfaqを含む最新の10件のエントリを取得します。以下のコマンドでは、MATCH_PHRASEはApache Dorisで使用される全文検索SQL構文で、フィールド内のすべてのキーワードをマッチングし、一貫した順序を要求します。以下の例では、a image faq bはマッチしますが、a faq image bはimageとfaqの順序が構文と一致しないためマッチしません。

```SQL  
SELECT * FROM your_table_name WHERE message **MATCH_PHRASE** 'image faq'  
ORDER BY ts DESC LIMIT 10;
```
**ログを視覚的に分析**

一部のサードパーティベンダーは、Apache Dorisをベースとした視覚的ログ解析開発プラットフォームを提供しており、これにはKibana Discoverに類似したログ検索・分析インターフェースが含まれています。これらのプラットフォームは、直感的でユーザーフレンドリーな探索的ログ分析インタラクションを提供します。

![WebUI-a log search and analysis interface similar to Kibana](/images/WebUI-EN.jpeg)

- フルテキスト検索とSQLモードをサポート

- タイムボックスとヒストグラムでクエリログの時間枠を選択することをサポート

- 詳細なログ情報の表示、JSONやテーブルに展開可能

- ログデータコンテキスト内でフィルタ条件を追加・削除するインタラクティブクリック

- 異常を発見し、さらなる詳細分析のための検索結果内のトップフィールド値の表示

詳細についてはdev@doris.apache.orgまでお問い合わせください。
