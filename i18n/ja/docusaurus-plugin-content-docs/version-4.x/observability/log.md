---
{
    "title": "ログの保存と分析",
    "language": "ja",
    "description": "Apache Doris で Elasticsearch に代わるログプラットフォームを構築する方法。アーキテクチャ、リソース見積もり、テーブル作成、取り込み、クエリまでを一通り説明します。",
    "sidebar_label": "ログ",
    "keywords": [
        "Doris のログ分析",
        "ログ保存",
        "全文検索",
        "転置インデックス",
        "Elasticsearch の代替",
        "Stream Load によるログ取り込み",
        "Logstash と Doris",
        "Filebeat と Doris",
        "Kafka Routine Load",
        "ホット・コールド階層化",
        "VARIANT 半構造化データ",
        "log_policy",
        "time_series コンパクション"
    ]
}
---

<!-- Knowledge type: Solution overview + Procedure -->
<!-- Applicable scenario: Log platform selection / Log storage and search analysis / Elasticsearch alternative -->

ログはシステムの動作を詳細に記録したもので、イベントの主体、時刻、場所、内容などの重要な情報を含みます。運用上の可観測性、ネットワークセキュリティの監視、ビジネス分析のため、企業は分散したログを一元的に収集、保存、分析し、大量のログから価値を引き出す必要があります。

Apache Doris は、汎用的な OLAP 機能に加え、この用途向けに転置インデックスと高速な全文検索を備え、書き込み性能と保存効率を高めています。Apache Doris を使用すると、オープンで高性能、低コストな統合ログ保存・分析プラットフォームを構築できます。

この記事では、次の内容を説明します。

- **全体アーキテクチャ**: Apache Doris を使ったログプラットフォームの主要コンポーネントと基盤アーキテクチャ。
- **機能と利点**: Elasticsearch と比較した特徴的な機能。
- **運用ガイド**: リソース見積もりからログクエリまでの一連の手順。

---

## 1. 全体アーキテクチャ

<!-- Knowledge type: Architecture selection decision -->

Apache Doris を使ったログ保存・分析プラットフォームのアーキテクチャを次に示します。

![全体アーキテクチャ](/images/doris-overall-architecture.png)

全体アーキテクチャは次の三つの部分で構成されます。

| レイヤー | コンポーネント | 説明 |
| :----------------------------------- | :------------------------------------------ | :----------------------------------------------------------------------------------- |
| ログの収集と前処理 | Logstash、Filebeat、Fluentbit、Kafka など | HTTP API を通じてログデータを Apache Doris に書き込む |
| ログの保存と分析 | Apache Doris | 高性能かつ低コストの統合ストレージと、SQL インターフェースによる多様な検索・分析機能を提供する |
| ログの分析とアラート | Grafana、Superset、Doris WebUI など | 標準の MySQL プロトコルで Doris にクエリを実行し、使いやすい可視化インターフェースを提供する |

---

## 2. 機能と利点

<!-- Knowledge type: Capability definition -->

Apache Doris を使ったログプラットフォームには、次の主要な機能があります。

| 機能 | 説明 |
| :---------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| 高スループット・低レイテンシの取り込み | 毎日数百 TB のデータを GB/s の速度、1 秒未満のレイテンシで安定して継続的に取り込める |
| 大量データの低コスト保存 | PB 規模の保存に対応し、Elasticsearch と比べてストレージコストを 60%～80% 削減できる。コールドデータを S3/HDFS に階層化すると、さらに 50% 削減できる |
| 高性能な全文検索と分析 | 転置インデックスと全文検索に対応し、キーワードによる詳細検索や傾向分析などのクエリに数秒で応答する |
| オープンで使いやすいエコシステム | 上流では Logstash、Filebeat、Fluentbit、Kafka などと連携し、下流では標準の MySQL プロトコルを通じて Grafana、Superset、Doris WebUI と連携する |

### 2.1 高性能と低コスト

<!-- Knowledge type: Capability definition -->

ベンチマークと本番環境での検証によると、Apache Doris を使ったログプラットフォームのコストパフォーマンスは Elasticsearch の 5～10 倍です。主な利点は、高性能なストレージ・クエリエンジンと、ログ用途に特化した最適化によるものです。

- **高い書き込みスループット**: Elasticsearch では、データの解析と転置インデックスの構築に使う CPU が書き込みのボトルネックになります。Apache Doris は SIMD などの CPU ベクトル化命令で JSON の解析とインデックス構築を高速化します。また、ログ用途に不要な前方インデックスなどのデータ構造を取り除き、転置インデックスを簡素化しています。同じリソースを使った場合、Doris の書き込み性能は Elasticsearch の 3～5 倍です。
- **低いストレージコスト**: Elasticsearch では、前方インデックス、転置インデックス、doc values 列ストアによってデータが複数保持され、一般的な圧縮率も比較的低くなります。Doris は前方インデックスを取り除いてインデックスデータを 30% 削減し、Zstandard 圧縮アルゴリズムを使う列指向ストレージで 5～10 倍の圧縮率を達成します。これは Elasticsearch の 1.5 倍を大きく上回ります。ホット・コールド階層化機能は過去のログをオブジェクトストレージに自動的に移動し、コールドデータの保存コストを 70% 以上削減できます。ストレージ全体のコストは Elasticsearch の約 20% です。
- **高いクエリ性能**: Doris は全文検索の処理を簡素化し、ログ用途では不要な関連度スコアリングなどのアルゴリズムを省きます。「指定したキーワードを含む最新のログ 100 件」のような典型的なクエリには、計画・実行段階で TopN の動的枝刈りなど専用の最適化を適用します。

### 2.2 強力な分析機能

<!-- Knowledge type: Capability definition -->

Apache Doris は標準 SQL をサポートし、MySQL プロトコルと構文に互換性があります。そのため、Doris を使ったログシステムには次の利点があります。

- **使いやすさ**: エンジニアやデータアナリストは SQL に慣れているため、新しい技術スタックを学ばずにすぐ使い始められます。
- **豊富なエコシステム**: MySQL コマンドライン、さまざまな GUI・BI ツール、ビッグデータエコシステムと円滑に連携し、複雑で多様なデータ処理・分析のニーズに対応します。
- **高い分析能力**: SQL はデータ分析の事実上の標準であり、検索、集計、複数テーブルの JOIN、サブクエリ、UDF、論理ビュー、マテリアライズドビューなどをサポートします。

### 2.3 柔軟なスキーマ

<!-- Knowledge type: Capability definition -->

次に、JSON 形式の半構造化ログの典型例を示します。最上位のフィールド（`timestamp`、`source`、`node`、`component`、`level`、`clientRequestId`、`message`、`properties`）は比較的固定されています。一方、拡張属性 `properties` 内のネストしたフィールド（`properties.size`、`properties.format` など）は動的で、ログごとに異なる場合があります。

```json
{
  "timestamp": "2014-03-08T00:50:03.8432810Z",
  "source": "ADOPTIONCUSTOMERS81",
  "node": "Engine000000000405",
  "level": "Information",
  "component": "DOWNLOADER",
  "clientRequestId": "671db15d-abad-94f6-dd93-b3a2e6000672",
  "message": "Downloading file path: benchmark/2014/ADOPTIONCUSTOMERS81_94_0.parquet.gz",
  "properties": {
    "size": 1495636750,
    "format": "parquet",
    "rowCount": 855138,
    "downloadDuration": "00:01:58.3520561"
  }
}
```

Apache Doris は、次の二つの仕組みで柔軟なスキーマをサポートします。

- **Light Schema Change**: 最上位のフィールドが時々変わる場合、`ADD/DROP COLUMN` や `ADD/DROP INDEX` などのスキーマ変更を数秒で完了できます。設計段階では、現時点でインデックスが必要なフィールドだけを検討すれば十分です。
- **VARIANT 半構造化型**: `properties` のような拡張フィールドには任意の JSON データを書き込めます。フィールド名と型は自動的に検出され、出現頻度の高いフィールドは列指向ストレージに分離されます。`VARIANT` に転置インデックスを作成して、内部フィールドのクエリや検索を高速化することもできます。

Elasticsearch の動的マッピングと比べて、Apache Doris の柔軟なスキーマには次の利点があります。

- 同じフィールドで複数の型を使用できます。`VARIANT` は型の競合を自動的に処理して型を昇格させるため、ログデータの継続的な変化により適応できます。
- `VARIANT` は出現頻度の低いフィールドを一つの列に自動的に統合し、フィールド、メタデータ、列が多すぎることで生じる性能上の問題を回避します。
- 列の追加・削除とインデックスの追加・削除を動的に行えます。すべてのフィールドに事前にインデックスを作る必要がなく、不要なコストを削減できます。

---

## 3. 運用ガイド

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Log platform deployment / Production rollout -->

次の表に、Apache Doris でログプラットフォームを構築する六つの手順を示します。

| 手順 | 目的 |
| :---------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| [ステップ 1: リソースを見積もる](#31-estimate-resources) | FE/BE ノード数、ディスク容量、オブジェクトストレージのサイズを見積もる |
| [ステップ 2: クラスターをデプロイする](#32-deploy-the-cluster) | 物理マシンまたは仮想マシンに Apache Doris をデプロイする |
| [ステップ 3: FE と BE の設定を調整する](#33-tune-fe-and-be-configurations) | ログ用途に重要なパラメータを調整する |
| [ステップ 4: テーブルを作成する](#34-create-the-table) | パーティション分割、バケット分割、圧縮、コンパクション、インデックス、階層化ポリシーを設計する |
| [ステップ 5: ログを収集する](#35-collect-logs) | Logstash、Filebeat、Kafka、または独自のプログラムと連携する |
| [ステップ 6: ログをクエリ・分析する](#36-query-and-analyze-logs) | SQL と可視化ツールでログを検索・分析する |

### 3.1 リソースを見積もる {#31-estimate-resources}

<!-- Knowledge type: Hardware requirements -->
<!-- Applicable scenario: Pre-deployment planning / Capacity planning -->

クラスターをデプロイする前に、サーバーのハードウェアリソースを見積もる必要があります。主な手順は次のとおりです。

1. **書き込みリソースを見積もる**: 次の式を使用します。

    - `Average write throughput = Daily incremental data / 86400 s`
    - `Peak write throughput = Average write throughput * Peak-to-average write ratio`
    - `CPU cores required for peak writes = Peak write throughput / Per-core write throughput`

2. **ストレージリソースを見積もる**: 次の式を使用します。

    - `Required storage = Daily incremental data / Compression ratio * Replica count * Data retention period`

3. **クエリリソースを見積もる**: クエリで消費するリソースは、クエリ量と複雑さによって異なります。初期見積もりでは CPU リソースの 50% をクエリ用に確保し、実測結果に基づいて調整します。

4. **リソースを集計する**: 手順 1 と 3 で必要な CPU コア数を見積もり、マシンごとの CPU コア数で割って BE サーバーの台数を求めます。さらに手順 2 と組み合わせて BE サーバーごとに必要なストレージを見積もり、4～12 台のデータディスクに分散して各ディスクの容量を計算します。

#### 例: 日あたり 100 TB の新規ログに必要なリソースの見積もり

次の条件を例にします。圧縮前の新規データ量が日あたり 100 TB、圧縮率が 5、レプリカ数が 1、ホットデータの保持期間が 3 日、コールドデータの保持期間が 30 日、ピーク時と平均時の書き込み量の比率が 200%、CPU コアあたりの書き込みスループットが 10 MB/s、CPU の 50% をクエリ用に確保します。見積もりは次のとおりです。

- **FE**: 3 台。各サーバーに 16 CPU コア、64 GB のメモリ、100 GB の SSD を一台搭載
- **BE**: 15 台。各サーバーに 32 CPU コア、256 GB のメモリ、600 GB の SSD を十台搭載
- **S3 オブジェクトストレージ**: コールドデータ用に 600 TB

主な指標の値と計算方法を次に示します。

| 主な指標（単位） | 値 | 説明 |
| :----------------------------------------- | :----- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| 日あたりの増分データ量（TB） | 100 | 実際の要件に合わせて入力 |
| 圧縮率 | 5 | 通常は 3～10（インデックスを含む）。実際の要件に合わせて入力 |
| レプリカ数 | 1 | 実際の要件に合わせて入力。デフォルトは 1。設定可能な値は 1、2、3 |
| ホットデータの保持期間（日） | 3 | 実際の要件に合わせて入力 |
| コールドデータの保持期間（日） | 30 | 実際の要件に合わせて入力 |
| 総保持期間（日） | 33 | 計算式: `Hot data retention + Cold data retention` |
| ホットデータの推定保存量（TB） | 60 | 計算式: `Daily incremental data / Compression ratio * Replica count * Hot data retention` |
| コールドデータの推定保存量（TB） | 600 | 計算式: `Daily incremental data / Compression ratio * Replica count * Cold data retention` |
| ピーク時と平均時の書き込み量の比率 | 200% | 実際の要件に合わせて入力。デフォルトは 200% |
| マシンごとの CPU コア数 | 32 | 実際の要件に合わせて入力。デフォルトは 32 コア |
| 平均書き込みスループット（MB/s） | 1214 | 計算式: `Daily incremental data / 86400 s` |
| ピーク時の書き込みスループット（MB/s） | 2427 | 計算式: `Average write throughput * Peak-to-average write ratio` |
| ピーク時の書き込みに必要な CPU コア数 | 242.7 | 計算式: `Peak write throughput / Per-core write throughput` |
| クエリ用に確保する CPU | 50% | 実際の要件に合わせて入力。デフォルトは 50% |
| BE サーバーの推定台数 | 15.2 | 計算式: `CPU cores required for peak writes / CPU cores per machine / (1 - CPU reserved for queries)` |
| BE サーバーの推定台数（丸め後） | 15 | 計算式: `MAX(Replica count, rounded estimated number of BE servers)` |
| BE サーバーごとの推定ストレージ（TB） | 5.7 | 計算式: `Estimated hot-data storage / Estimated number of BE servers / (1 - 30%)`。30% はストレージの予備容量です。I/O 能力を高めるため、BE ごとに 4～12 台のデータディスクをマウントすることを推奨します |

### 3.2 クラスターをデプロイする {#32-deploy-the-cluster}

<!-- Knowledge type: Procedure -->

リソースを見積もったら、Apache Doris クラスターをデプロイします。物理マシンまたは仮想マシンへのデプロイを推奨します。手動デプロイの手順については、[手動デプロイ](../install/deploy-manually/integrated-storage-compute-deploy-manually)を参照してください。

### 3.3 FE と BE の設定を調整する {#33-tune-fe-and-be-configurations}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Performance tuning / Cluster initialization -->

クラスターのデプロイ後、ログの保存と分析に適した構成になるよう、FE と BE のパラメータをそれぞれ調整します。

#### 3.3.1 FE の設定を調整する

`fe/conf/fe.conf` で、次の表に従って FE の設定を調整します。

| 調整するパラメータ | 説明 |
| :---------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| `max_running_txn_num_per_db = 10000` | 高並行の取り込みでは実行中のトランザクションが多くなるため、このパラメータを引き上げる |
| `streaming_label_keep_max_second = 3600`<br />`label_keep_max_second = 7200` | 頻繁な取り込みでトランザクションラベルが多くのメモリを消費するため、保持時間を短縮する |
| `enable_round_robin_create_tablet = true` | タブレット作成時にラウンドロビン方式を使い、分布をできるだけ均等にする |
| `tablet_rebalancer_type = partition` | リバランス時に各パーティション内のタブレットをできるだけ均等にする戦略を使う |
| `autobucket_min_buckets = 10` | ログ量が増えたときにバケット数が不足しないよう、最小自動バケット数を 1 から 10 に引き上げる |
| `max_backend_heartbeat_failure_tolerance_count = 10` | ログ用途では BE サーバーに負荷がかかり、一時的にハートビートが届かない場合があるため、許容回数を 1 から 10 に引き上げる |

パラメータの詳細については、[FE の設定](../admin-manual/config/fe-config)を参照してください。

#### 3.3.2 BE の設定を調整する

`be/conf/be.conf` で、次の表に従って BE の設定を調整します。

| モジュール | 調整するパラメータ | 説明 |
| :---------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ストレージ | `storage_root_path = /path/to/dir1;/path/to/dir2;...;/path/to/dir12` | ディスク上のホットデータの保存先を設定する |
| ストレージ | `enable_file_cache = true` | ファイルキャッシュを有効にする |
| ストレージ | `file_cache_path = [{"path": "/mnt/datadisk0/file_cache", "total_size":53687091200, "query_limit": "10737418240"},{"path": "/mnt/datadisk1/file_cache", "total_size":53687091200,"query_limit": "10737418240"}]` | コールドデータのキャッシュ先と設定を指定する:<br />`path`: キャッシュのパス<br />`total_size`: キャッシュ先の合計サイズ（バイト単位）。53687091200 バイト = 50 GB<br />`query_limit`: 単一クエリがキャッシュ先から読み取れるデータの最大量（バイト単位）。10737418240 バイト = 10 GB |
| 書き込み | `write_buffer_size = 1073741824` | 書き込みバッファファイルのサイズを大きくし、小さなファイルとランダム I/O を減らして性能を向上させる |
| コンパクション | `max_cumu_compaction_threads = 8` | CPU コア数を 4 で割った値に設定する。CPU の 1/4 を書き込みに、1/4 をバックグラウンドのコンパクションに使い、残りの 1/2 をクエリなどの処理用に確保する |
| コンパクション | `inverted_index_compaction_enable = true` | インデックスのコンパクションを有効にし、コンパクション中の CPU 消費を減らす |
| コンパクション | `enable_segcompaction = false`<br />`enable_ordered_data_compaction = false` | ログ用途では不要な二つのコンパクション機能を無効にする |
| コンパクション | `enable_compaction_priority_scheduling = false` | 優先度の低いコンパクションはディスクあたり 2 タスクに制限され、コンパクションが遅くなる |
| コンパクション | `total_permits_for_compaction_score = 200000` | メモリの制御に使用する。時系列ポリシー自体もメモリを制御できる |
| キャッシュ | `disable_storage_page_cache = true`<br />`inverted_index_searcher_cache_limit = 30%` | ログはデータ量が大きく、データキャッシュの効果が限られるため、データキャッシュを無効にしてインデックスキャッシュを使う |
| キャッシュ | `inverted_index_cache_stale_sweep_time_sec = 3600`<br />`index_cache_entry_stay_time_after_lookup_s = 3600` | インデックスキャッシュを最大で一時間メモリに保持する |
| キャッシュ | `enable_inverted_index_cache_on_cooldown = true`<br />`enable_write_index_searcher_cache = false` | コールドストレージへのアップロード時にインデックスを自動的にキャッシュする |
| キャッシュ | `tablet_schema_cache_recycle_interval = 3600`<br />`segment_cache_capacity = 20000` | その他のキャッシュが使用するメモリを減らす |
| キャッシュ | `inverted_index_ram_dir_enable = true` | 書き込み時のインデックス一時ファイルによる I/O オーバーヘッドを減らす |
| スレッド | `pipeline_executor_size = 24`<br />`doris_scanner_thread_pool_thread_num = 48` | 32 コア CPU 向けの計算・I/O スレッド設定。コア数に応じて比例調整する |
| スレッド | `scan_thread_nice_value = 5` | クエリの I/O スレッドの優先度を下げ、書き込み性能と適時性を確保する |
| その他 | `string_type_length_soft_limit_bytes = 10485760` | `String` データの長さの上限を 10 MB に引き上げる |
| その他 | `trash_file_expire_time_sec = 300`<br />`path_gc_check_interval_second = 900`<br />`path_scan_interval_second = 900` | 不要ファイルの回収を高速化する |

パラメータの詳細については、[BE の設定](../admin-manual/config/be-config)を参照してください。

### 3.4 テーブルを作成する {#34-create-the-table}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Schema design / Performance tuning -->

ログデータには書き込みとクエリの両方に固有の特性があるため、テーブル作成時には以下の各節に示す設定を適用して性能を高めます。

#### 3.4.1 パーティションとバケットのパラメータを設定する

**パーティション分割**:

- 時刻フィールドに[範囲パーティション](../table-design/data-partitioning/manual-partitioning.md#range-partitioning)（`PARTITION BY RANGE(ts)`）を使用し、[動的パーティション](../table-design/data-partitioning/dynamic-partitioning)（`"dynamic_partition.enable" = "true"`）を有効にして日単位のパーティションを自動管理します。
- `Datetime` 型の時刻フィールドをキーにします（`DUPLICATE KEY(ts)`）。これにより、最新 N 件のログを取得するクエリが数倍高速になります。

**バケット分割**:

- バケット数をクラスター内のディスク総数のおよそ 3 倍に設定し、バケットあたりの圧縮後データ量を約 5 GB にします。
- ランダム分散方式（`DISTRIBUTED BY RANDOM BUCKETS 60`）と、書き込み時の単一タブレットへの取り込みを組み合わせて、バッチ書き込みの効率を高めます。

パーティション分割とバケット分割の詳細については、[データのパーティション分割](../table-design/data-partitioning/basic-concepts)を参照してください。

#### 3.4.2 圧縮パラメータを設定する

- データの圧縮率を高めるため、Zstd 圧縮アルゴリズム（`"compression" = "zstd"`）を使用します。

#### 3.4.3 コンパクションパラメータを設定する

- 時系列ポリシー（`"compaction_policy" = "time_series"`）を使用して書き込み増幅を抑えます。これは高スループットのログ書き込みで消費するリソースを抑えるうえで重要です。

#### 3.4.4 インデックスを作成・設定する

- 頻繁にクエリするフィールドにインデックスを作成します（`USING INVERTED`）。
- 全文検索が必要なフィールドでは、トークナイザーの `parser` パラメータを `unicode` に設定します。これはほとんどの用途に適しています。フレーズ検索に対応するには `support_phrase` を `true` に設定し、不要なら `false` に設定して保存容量を減らします。

#### 3.4.5 ストレージポリシーを設定する

- **ホットデータの保存**: クラウドディスクを使用する場合はレプリカ数を 1 に設定できます。物理ディスクを使用する場合は、少なくとも 2 に設定します（`"replication_num" = "2"`）。
- **ホット・コールド階層化**: `log_s3` ストレージ先（`CREATE RESOURCE "log_s3"`）を設定し、`log_policy_3day` 階層化ポリシー（`CREATE STORAGE POLICY log_policy_3day`）を指定します。これにより、3 日を超えたデータが `log_s3` で指定したストレージ先へ自動的に移動します。

#### 3.4.6 テーブル作成の完全な例

```sql
CREATE DATABASE log_db;
USE log_db;

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
  "dynamic_partition.replication_num" = "2", -- Not needed in compute-storage separation
  "replication_num" = "2",                    -- Not needed in compute-storage separation
  "storage_policy" = "log_policy_3day"        -- Not needed in compute-storage separation
);
```

### 3.5 ログを収集する {#35-collect-logs}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Log onboarding / Data ingestion -->

テーブルの作成後、ログの収集を開始できます。Apache Doris には、Logstash、Filebeat、Kafka などの一般的なログ収集ツールと連携できるオープンで汎用的な Stream HTTP API があります。次の表に、それぞれの収集方法が適した場面を示します。

| 収集方法 | 適した場面 |
| :--------------------------------- | :--------------------------------------------------------------- |
| Logstash | 豊富なフィルターとプラグインのエコシステムが必要な既存の Logstash パイプライン |
| Filebeat | リソースが限られた環境での軽量なファイル収集 |
| Kafka Routine Load | すでに Kafka に格納されているログを Doris が能動的に取得する場合 |
| 独自のプログラム（Stream Load） | 自社製の収集プログラムや特殊なデータソースとの連携 |

#### 3.5.1 Logstash と連携する

次の手順に従います。

1. Logstash Doris Output プラグインをダウンロードしてインストールします。次のいずれかの方法を選びます。

    - 直接ダウンロード: [こちらからダウンロード](https://apache-doris-releases.oss-accelerate.aliyuncs.com/extension/logstash-output-doris-1.2.0.gem)します。
    - ソースからビルドし、次のコマンドでインストールします。

        ```shell
        ./bin/logstash-plugin install logstash-output-doris-1.2.0.gem
        ```

2. Logstash を設定します。次の二つのファイルが必要です。

    - `logstash.yml`: Logstash がログをバッチ化するときに使うバッチサイズと遅延を設定し、書き込み性能を高めます。

        ```yaml
        pipeline.batch.size: 1000000
        pipeline.batch.delay: 10000
        ```

    - `logstash_demo.conf`: 収集するログの入力パスと Apache Doris への出力設定を指定します。

        ```text
        input {
            file {
            path => "/path/to/your/log"
          }
        }

        output {
          doris {
            http_hosts => [ "<http://fehost1:http_port>", "<http://fehost2:http_port>", "<http://fehost3:http_port>" ]
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

3. Logstash を実行し、ログを収集して Apache Doris に出力します。

    ```shell
    ./bin/logstash -f logstash_demo.conf
    ```

設定の詳細については、[Logstash Doris Output プラグイン](../connection-integration/data-integration/logstash)を参照してください。

#### 3.5.2 Filebeat と連携する

次の手順に従います。

1. Apache Doris への出力に対応した Filebeat バイナリを入手します。[こちらからダウンロード](https://apache-doris-releases.oss-accelerate.aliyuncs.com/extension/filebeat-doris-2.1.1)するか、Apache Doris のソースからビルドできます。

2. Filebeat を設定します。主なファイルは `filebeat_demo.yml` で、収集するログの入力パスと Apache Doris への出力設定を指定します。

    ```yaml
    # input
    filebeat.inputs:
    - type: log
      enabled: true
      paths:
        - /path/to/your/log
      # multiline can join lines that span multiple lines (such as Java stack traces) into a single log
      multiline:
        type: pattern
        # Behavior: lines starting with yyyy-mm-dd HH:MM:SS are treated as a new log; others are appended to the previous log
        pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}'
        negate: true
        match: after
        skip_newline: true

    processors:
    # Use the js script plugin to replace \t in the log with spaces, to avoid JSON parsing errors
    - script:
        lang: javascript
        source: >
            function process(event) {
                var msg = event.Get("message");
                msg = msg.replace(/\t/g, "  ");
                event.Put("message", msg);
            }
    # Use the dissect plugin for simple log parsing
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
      ## %{[agent][hostname]} %{[log][file][path]} are metadata that come with filebeat
      ## Another commonly used filebeat metadata is the collection timestamp %{[@timestamp]}
      ## %{[day]} %{[time]} are the fields parsed by the dissect step above
      codec_format_string: '{"ts": "%{[day]} %{[time]}", "host": "%{[agent][hostname]}", "path": "%{[log][file][path]}", "message": "%{[message]}"}'
      headers:
        format: "json"
        read_json_by_line: "true"
        load_to_single_tablet: "true"
    ```

3. Filebeat を実行し、ログを収集して Apache Doris に出力します。

    ```shell
    chmod +x filebeat-doris-2.1.1
    ./filebeat-doris-2.1.1 -c filebeat_demo.yml
    ```

設定の詳細については、[Beats Doris Output プラグイン](../connection-integration/data-integration/beats)を参照してください。

#### 3.5.3 Kafka と連携する

JSON 形式のログを Kafka のメッセージキューに書き込み、Kafka Routine Load を作成して Apache Doris が Kafka からデータを能動的に取得できるようにします。

次の例を参照してください。`property.*` は Librdkafka クライアントの設定です。実際の Kafka クラスターに合わせて調整してください。

```sql
-- Prepare the kafka cluster and topic log__topic_
-- Create a routine load that imports data from kafka log__topic_ into the log_table table
CREATE ROUTINE LOAD load_log_kafka ON log_db.log_table
COLUMNS(ts, host, path, message)
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
-- Check the status of the routine load
SHOW ROUTINE LOAD;
```

Kafka の設定の詳細については、[Routine Load](../data-operate/import/import-way/routine-load-manual.md)を参照してください。

#### 3.5.4 独自のプログラムでログを収集する

一般的なログ収集ツールとの連携に加え、独自のプログラムから HTTP API の Stream Load を使ってログを取り込むこともできます。

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

独自のプログラムを使用する際は、次の点に注意してください。

- HTTP 認証には Basic Auth を使用します。値は `echo -n 'username:password' | base64` コマンドで計算できます。
- データ形式を JSON に指定するには、HTTP ヘッダー `format:json` を設定します。
- 各行から JSON を一件ずつ読み込むには、HTTP ヘッダー `read_json_by_line:true` を設定します。
- 一度の取り込みを単一のバケットに書き込み、小さなファイルを減らすには、HTTP ヘッダー `load_to_single_tablet:true` を設定します。
- クライアントからは 100 MB～1 GB のバッチで送信することを推奨します。Apache Doris 2.1 以降では、サーバー側の Group Commit 機能により、クライアント側のバッチサイズを小さくできます。

### 3.6 ログをクエリ・分析する {#36-query-and-analyze-logs}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Log search / Full-text search -->

#### 3.6.1 ログのクエリ

Apache Doris は標準 SQL をサポートします。MySQL クライアント、JDBC、またはその他のツールからクラスターに接続して SQL クエリを実行できます。

```shell
mysql -h fe_host -P fe_mysql_port -u your_username -Dyour_db_name
```

よく使う SQL クエリの例を 5 つ示します。

- 最新の 10 件を表示する:

    ```sql
    SELECT * FROM your_table_name ORDER BY ts DESC LIMIT 10;
    ```

- `host` が `8.8.8.8` である最新の 10 件を取得する:

    ```sql
    SELECT * FROM your_table_name WHERE host = '8.8.8.8' ORDER BY ts DESC LIMIT 10;
    ```

- `message` フィールドに `error` または `404` を含む最新の 10 件を検索する。`MATCH_ANY` は Apache Doris の全文検索構文で、引数に指定したキーワードのいずれかに一致します。

    ```sql
    SELECT * FROM your_table_name WHERE message MATCH_ANY 'error 404'
    ORDER BY ts DESC LIMIT 10;
    ```

- `message` フィールドに `image` と `faq` の両方を含む最新の 10 件を検索する。`MATCH_ALL` は Apache Doris の全文検索構文で、引数に指定したすべてのキーワードに一致します。

    ```sql
    SELECT * FROM your_table_name WHERE message MATCH_ALL 'image faq'
    ORDER BY ts DESC LIMIT 10;
    ```

- `message` フィールドに `image` と `faq` の両方を含む最新の 10 件を検索する。`MATCH_PHRASE` は Apache Doris の全文検索構文で、引数に指定したすべてのキーワードに同じ順序で一致します。たとえば、`a image faq b` は一致しますが、`a faq image b` は一致しません。

    ```sql
    SELECT * FROM your_table_name WHERE message MATCH_PHRASE 'image faq'
    ORDER BY ts DESC LIMIT 10;
    ```

#### 3.6.2 ログの可視化分析

一部のサードパーティーベンダーは、Apache Doris を基盤とするログ可視化分析プラットフォームを提供しています。Kibana Discover に似たログ検索・分析インターフェースもあり、直感的で使いやすい探索的なログ分析が可能です。

![ログ分析 WebUI](/images/WebUI-EN.jpeg)

- 全文検索モードと SQL モードの両方に対応
- 時刻選択ツールとヒストグラムで、ログクエリの時間範囲を選択可能
- ログの詳細を JSON や表に展開して表示可能
- ログデータを見ながらクリック操作でフィルターを追加・削除可能
- 検索結果内の各フィールドで頻出する値を表示し、異常の発見と詳しい調査に活用可能

さらにサポートが必要な場合は、dev@doris.apache.org にお問い合わせください。

---

## 4. よくある質問

<!-- Knowledge type: FAQ -->

**Q1: ログ用途における Apache Doris と Elasticsearch の主な違いは何ですか？**

A: Doris の書き込みスループットは Elasticsearch の 3～5 倍で、ストレージコストは Elasticsearch の約 20% です。Doris は標準 SQL と MySQL プロトコルにも対応し、より強力な分析機能を提供します。ホット・コールド階層化により、コールドデータを S3/HDFS に移動し、保存コストをさらに削減できます。

**Q2: ログのフィールドが頻繁に変わる場合はどうすればよいですか？**

A: Light Schema Change を使うと、最上位のフィールドに対する `ADD/DROP COLUMN` と `ADD/DROP INDEX` を数秒で実行できます。動的なネストフィールドには `VARIANT` 型を使用します。フィールド名と型が自動的に検出され、`VARIANT` の転置インデックスも利用できます。

**Q3: バケット数はどのように決めますか？**

A: バケット数をクラスター内のディスク総数のおよそ 3 倍に設定し、バケットあたりの圧縮後データ量を約 5 GB にします。`DISTRIBUTED BY RANDOM` と単一タブレットへの書き込みを組み合わせて、バッチ書き込みの効率を高めます。

**Q4: ホット・コールド階層化ポリシーの `cooldown_ttl` の単位は何ですか？**

A: 単位は秒です。たとえば `259200` は 3 日を意味し、その後、データはストレージポリシーで指定したオブジェクトストレージ先に自動的に移動します。

**Q5: 書き込み側のバッチサイズはどのように決めますか？**

A: リクエストあたり 100 MB～1 GB のバッチサイズを推奨します。Apache Doris 2.1 以降では、サーバー側の Group Commit 機能を有効にし、クライアント側でより小さいバッチサイズを使用できます。

---

## 5. トラブルシューティング

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Common error handling / Performance issue diagnosis -->

| 症状 | 考えられる原因 | 推奨する対処 |
| :----------------------------------------------- | :-------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| 高並行の取り込みでトランザクション数の上限を超える | `max_running_txn_num_per_db` のデフォルト値が小さすぎる | `max_running_txn_num_per_db = 10000` に引き上げる |
| BE のハートビートが頻繁にタイムアウトする | ログ書き込みの負荷が高く、BE が一時的に応答しなくなる | `max_backend_heartbeat_failure_tolerance_count = 10` に引き上げる |
| 書き込みによって多数の小さなファイルやランダム I/O が発生する | 書き込みバッファが小さすぎるか、単一タブレットへの取り込みを使用していない | `write_buffer_size = 1073741824` に引き上げ、`load_to_single_tablet:true` を設定する |
| コンパクションが遅く、書き込みに影響する | コンパクションスレッドが不足しているか、優先度の低いタスクのスケジューリングに制限がある | `max_cumu_compaction_threads` は CPU コア数を 4 で割った値に設定し、`enable_compaction_priority_scheduling` を無効にする |
| インデックスのメモリ使用量が多すぎる | データキャッシュとインデックスキャッシュがメモリを奪い合っている | `disable_storage_page_cache` を無効にし、`inverted_index_searcher_cache_limit = 30%` に制限する |
| 全文検索のフレーズクエリが機能しない | インデックスで `support_phrase` が有効になっていない | インデックス作成時に `"support_phrase" = "true"` を設定する |
| 自動バケット分割でバケット数が少なすぎ、ホットスポットが生じる | `autobucket_min_buckets` が小さすぎる | `autobucket_min_buckets = 10` に引き上げる |
