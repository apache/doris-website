---
{
  "title": "ログストレージと分析",
  "language": "ja",
  "description": "ログはシステム内の重要なイベントを記録し、イベントの主体、時刻、場所、内容などの重要な情報を含んでいます。"
}
---
ログはシステムの主要なイベントを記録し、イベントの主体、時刻、場所、内容などの重要な情報を含んでいます。運用の可観測性、ネットワークセキュリティ監視、ビジネス分析における多様なニーズを満たすために、企業は分散したログを収集して集中的に保存、クエリ、分析し、ログデータからさらに価値のあるコンテンツを抽出する必要があります。

このシナリオに対して、Apache Dorisは対応するソリューションを提供しています。ログシナリオの特性を念頭に置き、Apache Dorisはinverted-indexと超高速全文検索機能を追加し、書き込みパフォーマンスとストレージスペースを極限まで最適化しました。これにより、ユーザーはApache Dorisベースのオープンで高性能、コスト効率的、統合されたログストレージおよび分析プラットフォームを構築できます。

このソリューションに焦点を当て、本章では以下の3つのセクションを含んでいます：

- **全体アーキテクチャ**: このセクションでは、Apache Doris上に構築されたログストレージおよび分析プラットフォームのコアコンポーネントとアーキテクチャについて説明します。

- **機能と利点**: このセクションでは、Apache Doris上に構築されたログストレージおよび分析プラットフォームの機能と利点について説明します。

- **運用ガイド**: このセクションでは、Apache Dorisベースのログストレージおよび分析プラットフォームの構築方法について説明します。

## 全体アーキテクチャ

以下の図は、Apache Doris上に構築されたログストレージおよび分析プラットフォームのアーキテクチャを示しています：

![log storage and analysis platform architecture](/images/doris-overall-architecture.png)

アーキテクチャには以下の3つの部分が含まれています：

- **ログ収集と前処理**: さまざまなログ収集ツールがHTTP APIを通じてApache Dorisにログデータを書き込むことができます。

- **ログストレージおよび分析エンジン**: Apache DorisはSQLインターフェースを通じて豊富な検索および分析機能を提供し、高性能で低コストの統合ログストレージを提供します。

- **ログ分析およびアラートインターフェース**: さまざまなログ検索および分析ツールが標準SQLインターフェースを通じてApache Dorisにクエリを実行でき、ユーザーにシンプルで使いやすいインターフェースを提供します。

## 機能と利点

以下の図は、Apache Doris上に構築されたログストレージおよび分析プラットフォームのアーキテクチャを示しています：

- **高スループット、低レイテンシのログ書き込み**: 1日あたり数百TBおよびGB/sレベルのログデータの安定した書き込みをサポートし、レイテンシを1秒以内に維持します。

- **大量ログデータのコスト効率的なストレージ**: ペタバイト規模のストレージをサポートし、Elasticsearchと比較してストレージコストを60%から80%削減し、S3/HDFSでのコールドデータの保存により、さらにストレージコストを50%削減します。

- **高性能ログ全文検索および分析**: inverted indexと全文検索をサポートし、一般的なログクエリ（キーワード検索、トレンド分析など）に対して秒レベルの応答時間を提供します。

- **オープンでユーザーフレンドリーなアップストリームおよびダウンストリームエコシステム**: Stream LoadのユニバーサルHTTP APIを通じて、Logstash、Filebeat、Fluentbit、KafkaなどのCommonログ収集システムおよびデータソースとのアップストリーム統合、および標準MySQLプロトコルと構文を使用した、可観測性プラットフォームGrafana、BI分析Superset、KibanaのようなDoris WebUIなど、さまざまな視覚的分析UIとのダウンストリーム統合。

### コスト効率的なパフォーマンス

Benchmarkテストと本番環境での検証の後、Apache Doris上に構築されたログストレージおよび分析プラットフォームは、Elasticsearchに対して5から10倍のコストパフォーマンス上の優位性があります。Apache Dorisのパフォーマンス上の利点は、主にその世界的にリーディングな高性能ストレージとクエリエンジン、およびログシナリオに特化した最適化によるものです：

- **書き込みスループットの向上**: Elasticsearchの書き込みパフォーマンスのボトルネックは、データ解析とinverted index構築のためのCPU消費にあります。対照的に、Apache Dorisは書き込みを2つの側面で最適化しています：SIMDおよびその他のCPUベクトル命令を使用してJSONデータ解析速度とインデックス構築パフォーマンスを向上させ、forward indexなどの不要なデータ構造を削除することでログシナリオ向けのinverted index構造を簡素化し、インデックス構築の複雑さを効果的に削減しています。同じリソースで、Apache Dorisの書き込みパフォーマンスはElasticsearchより3から5倍高くなります。

- **ストレージコストの削減**: Elasticsearchのストレージボトルネックは、forward index、inverted index、Docvalue列の複数のストレージ形式と、その汎用圧縮アルゴリズムの比較的低い圧縮率にあります。対照的に、Apache Dorisはストレージにおいて以下の最適化を行っています：forward indexを削除してインデックスデータサイズを30%削減；columnarストレージとZstandard圧縮アルゴリズムを使用して5から10倍の圧縮率を実現し、これはElasticsearchの1.5倍を大幅に上回ります；ログデータでは、コールドデータのアクセス頻度は非常に低く、Apache Dorisのホットおよびコールドデータ階層化機能により、定義された期間を超えたログを自動的により低コストのオブジェクトストレージに保存し、コールドデータのストレージコストを70%以上削減できます。同じ生データに対して、DorisのストレージコストはElasticsearchの約20%にすぎません。

### 強力な分析機能

Apache Dorisは標準SQLをサポートし、MySQLプロトコルおよび構文と互換性があります。したがって、Apache Doris上に構築されたログシステムは、ログ分析にSQLを使用でき、ログシステムに以下の利点をもたらします：

- **使いやすさ**: エンジニアとデータアナリストはSQLに非常に精通しており、その専門知識を再利用でき、新しい技術スタックを学習する必要なく、迅速に開始できます。

- **豊富なエコシステム**: MySQLエコシステムはデータベース分野で最も広く使用されている言語であり、MySQLエコシステムとシームレスに統合および適用されます。DorisはMySQLコマンドラインとさまざまなGUIツール、BIツール、その他のビッグデータエコシステムツールを活用して、より複雑で多様なデータ処理および分析ニーズに対応できます。

- **強力な分析機能**: SQLはデータベースとビッグデータ分析の事実上の標準となっており、検索、集約、マルチテーブルJOIN、サブクエリ、UDF、論理ビュー、マテリアライズドビュー、さまざまなデータ分析機能をサポートする強力な表現能力と機能を持っています。

### 柔軟なSchema

以下は、JSON形式の半構造化ログの典型的な例です。トップレベルフィールドは、timestamp、source、node、component、level、clientRequestID、message、propertiesなどの固定フィールドで、すべてのログエントリに存在します。properties.sizeやproperties.formatなどのpropertiesのネストフィールドはより動的であり、各ログのフィールドは異なる可能性があります。

```JSON  
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
Apache Dorisは、Flexible Schemaログデータに対して複数の側面でサポートを提供します：

- トップレベルフィールドの変更について、Light Schema Changeを使用してカラムの追加・削除およびインデックスの追加・削除を行い、スキーマ変更を秒単位で完了できます。ログプラットフォームを計画する際、ユーザーはどのフィールドにインデックスを作成する必要があるかを考慮するだけで済みます。

- propertiesに類似した拡張フィールドについて、ネイティブ半構造化データタイプ`VARIANT`を提供し、任意のJSONデータの書き込み、JSON内のフィールド名とタイプの自動認識、および頻繁に発生するフィールドの自動分割による列型ストレージでの後続分析が可能です。さらに、`VARIANT`は転置インデックスを作成して内部フィールドのクエリと取得を高速化できます。

ElasticsearchのDynamic Mappingと比較して、Apache DorisのFlexible Schemaには以下の利点があります：

- フィールドに複数のタイプを持たせることができ、`VARIANT`はフィールドの競合とタイプ昇格を自動的に処理し、ログデータの反復的変更により適応します。

- `VARIANT`は出現頻度の低いフィールドを自動的にカラムストアにマージして、過剰なフィールド、メタデータ、またはカラムによるパフォーマンス問題を回避します。

- カラムを動的に追加できるだけでなく、動的に削除することも可能で、インデックスも動的に追加・削除できるため、Elasticsearchのように最初からすべてのフィールドにインデックスを作成する必要がなく、不要なコストを削減します。

## 運用ガイド

### ステップ1：リソースの見積もり

クラスターをデプロイする前に、サーバーに必要なハードウェアリソースを見積もる必要があります。以下の手順に従ってください：

1. 以下の計算式によりデータ書き込みのリソースを見積もります：

- `平均書き込みスループット = 日次データ増分 / 86400秒`

- `ピーク書き込みスループット = 平均書き込みスループット \* ピーク書き込みスループットの平均書き込みスループットに対する比率`

- `ピーク書き込みスループット用のCPUコア数 = ピーク書き込みスループット / 単一コアCPUの書き込みスループット`

1. 計算式によりデータストレージのリソースを見積もります：`ストレージ容量 = 日次データ増分 / データ圧縮比 * データコピー数 * データ保存期間`。

2. データクエリのリソースを見積もります。データクエリのリソースはクエリ量と複雑さに依存します。最初にデータクエリ用にCPUリソースの50%を確保し、実際のテスト結果に応じて調整することを推奨します。

3. 計算結果を以下のように統合します：

    1. ステップ1とステップ3で計算されたCPUコア数をBEサーバーのCPUコア数で割ることで、BEサーバー数を求めることができます。

    2. BEサーバー数とステップ2の計算結果に基づいて、各BEサーバーに必要なストレージ容量を見積もります。

    3. 各BEサーバーに必要なストレージ容量を4〜12のデータディスクに割り当てることで、単一データディスクに必要なストレージ容量を求めることができます。

例えば、日次データ増分が100TB、データ圧縮比が5、データコピー数が1、ホットデータの保存期間が3日、コールドデータの保存期間が30日、ピーク書き込みスループットの平均書き込みスループットに対する比率が200%、単一コアCUPの書き込みスループットが10MB/s、データクエリ用にCPUリソースの50%を確保すると仮定すると、以下のように見積もることができます：

- FEサーバー3台が必要で、それぞれ16コアCPU、64GBメモリ、1100GB SSDディスクで構成されます。

- BEサーバー15台が必要で、それぞれ32コアCPU、256GBメモリ、10 600GB SSDディスクで構成されます。

- S3オブジェクトストレージ容量600TB

以下の表を参照して、上記の例における指標の値とその計算方法を学習してください。

| 指標（単位） | 値 | 説明 |
| --- | --- | --- |
| 日次データ増分（TB） | 100 | 実際のニーズに応じて値を指定してください。 |
| データ圧縮比 | 5   | 実際のニーズに応じて値を指定してください。通常3〜10の間です。データにはインデックスデータが含まれることに注意してください。 |
| データコピー数 | 1   | 実際のニーズに応じて値を指定してください。1、2、または3にできます。デフォルト値は1です。 |
| ホットデータの保存期間（日） | 3   | 実際のニーズに応じて値を指定してください。 |
| コールドデータの保存期間（日） | 30  | 実際のニーズに応じて値を指定してください。 |
| データ保存期間 | 33  | 計算式：`ホットデータの保存期間 + コールドデータの保存期間` |
| ホットデータの見積もりストレージ容量（TB） | 60 | 計算式：`日次データ増分 / データ圧縮比 * データコピー数 * ホットデータの保存期間` |
| コールドデータの見積もりストレージ容量（TB） | 600 | 計算式：`日次データ増分 / データ圧縮比 * データコピー数 * コールドデータの保存期間` |
| ピーク書き込みスループットの平均書き込みスループットに対する比率 | 200% | 実際のニーズに応じて値を指定してください。デフォルト値は200%です。 |
| BEサーバーのCPUコア数 | 32  | 実際のニーズに応じて値を指定してください。デフォルト値は32です。 |
| 平均書き込みスループット（MB/s） | 1214 | 計算式：`日次データ増分 / 86400秒` |
| ピーク書き込みスループット（MB/s） | 2427 | 計算式：`平均書き込みスループット * ピーク書き込みスループットの平均書き込みスループットに対する比率` |
| ピーク書き込みスループット用のCPUコア数 | 242.7 | 計算式：`ピーク書き込みスループット / 単一コアCPUの書き込みスループット` |
| データクエリ用に確保されるCPUリソースの割合 | 50% | 実際のニーズに応じて値を指定してください。デフォルト値は50%です。 |
| BEサーバーの見積もり台数 | 15.2 | 計算式：`ピーク書き込みスループット用のCPUコア数 / BEサーバーのCPUコア数 /（1 - データクエリ用に確保されるCPUリソースの割合）` |
| 四捨五入したBEサーバー台数 | 15  | 計算式：`MAX（データコピー数、BEサーバーの見積もり台数）` |
| 各BEサーバーの見積もりデータストレージ容量（TB） | 5.7 | 計算式：`ホットデータの見積もりストレージ容量 / BEサーバーの見積もり台数 /（1 - 30%）`、ここで30%は確保されるストレージ容量の割合を表します。<br /><br />I/O能力を向上させるため、各BEサーバーに4〜12のデータディスクをマウントすることを推奨します。 |

### ステップ2：クラスターのデプロイ

リソースを見積もった後、クラスターをデプロイする必要があります。物理環境と仮想環境の両方で手動デプロイすることを推奨します。手動デプロイについては、[Manual Deployment](./install/deploy-manually/integrated-storage-compute-deploy-manually)を参照してください。

### ステップ3：FEとBE設定の最適化

クラスターデプロイの完了後、ログストレージと分析のシナリオにより適するよう、フロントエンドとバックエンドの設定パラメータをそれぞれ最適化する必要があります。

**FE設定の最適化**

FE設定フィールドは`fe/conf/fe.conf`で確認できます。FE設定を最適化するには以下の表を参照してください。

| 最適化対象の設定フィールド                         | 説明                                                  |
| :----------------------------------------------------------- | :----------------------------------------------------------- |
| `max_running_txn_num_per_db = 10000`                         | 高同時性インポートトランザクションに適応するためパラメータ値を増加します。 |
| `streaming_label_keep_max_second = 3600` `label_keep_max_second = 7200` | 高頻度インポートトランザクションの高メモリ使用量を処理するため保持時間を増加します。 |
| `enable_round_robin_create_tablet = true`                    | Tablet作成時、Round Robin戦略を使用して均等に分散します。 |
| `tablet_rebalancer_type = partition`                         | Tabletバランシング時、各パーティション内で均等に分散する戦略を使用します。 |
| `autobucket_min_buckets = 10`                                | ログ量増加時のバケット不足を避けるため、自動バケットの最小バケット数を1から10に増加します。 |
| `max_backend_heartbeat_failure_tolerance_count = 10`         | ログシナリオでは、BEサーバーが高負荷によりタイムアウトを起こす可能性があるため、許容回数を1から10に増加します。 |

詳細については、[FE Configuration](./admin-manual/config/fe-config.md)を参照してください。

**BE設定の最適化**

BE設定フィールドは`be/conf/be.conf`で確認できます。BE設定を最適化するには以下の表を参照してください。

| モジュール      | 最適化対象の設定フィールド                         | 説明                                                  |
| :--------- | :----------------------------------------------------------- | :----------------------------------------------------------- |
| Storage    | `storage_root_path = /path/to/dir1;/path/to/dir2;...;/path/to/dir12` | ディスクディレクトリ上のホットデータのストレージパスを設定します。 |
| -          | `enable_file_cache = true`                                   | ファイルキャッシュを有効にします。                                         |
| -          | `file_cache_path = [{"path": "/mnt/datadisk0/file_cache", "total_size":53687091200, "query_limit": "10737418240"},{"path": "/mnt/datadisk1/file_cache", "total_size":53687091200,"query_limit": "10737418240"}]` | コールドデータのキャッシュパスと関連設定を以下の具体的な設定で構成します：<br/>`path`：キャッシュパス<br/>`total_size`：キャッシュパスの総サイズ（バイト）、53687091200バイトは50GBに相当<br/>`query_limit`：1回のクエリでキャッシュパスから照会できるデータの最大量（バイト）、10737418240バイトは10GBに相当 |
| Write      | `write_buffer_size = 1073741824`                             | 書き込みバッファのファイルサイズを増加して小さなファイルとランダムI/O操作を削減し、パフォーマンスを向上させます。 |
| Compaction | `max_cumu_compaction_threads = 8`                            | CPUコア数 / 4に設定し、CPUリソースの1/4を書き込み用、1/4をバックグラウンドcompaction用、2/4をクエリやその他の操作用に使用することを示します。 |
| -          | `inverted_index_compaction_enable = true`                    | compaction時のCPU消費を削減するため、転置インデックスcompactionを有効にします。 |
| -          | `enable_segcompaction = false` `enable_ordered_data_compaction = false` | ログシナリオには不要な2つのcompaction機能を無効にします。 |
| -          | `enable_compaction_priority_scheduling = false` | 低優先度compactionは単一ディスクで2タスクに制限されており、compaction速度に影響を与える可能性があります。 |
| -          | `total_permits_for_compaction_score = 200000 ` | このパラメータはメモリ制御に使用され、メモリ時系列戦略下でパラメータ自体がメモリを制御できます。 |
| Cache      | `disable_storage_page_cache = true` `inverted_index_searcher_cache_limit = 30%` | ログデータの大容量とキャッシュ効果の限界により、データキャッシュからインデックスキャッシュに切り替えます。 |
| -          | `inverted_index_cache_stale_sweep_time_sec = 3600` `index_cache_entry_stay_time_after_lookup_s = 3600` | インデックスキャッシュをメモリ内に最大1時間維持します。           |
| -          | `enable_inverted_index_cache_on_cooldown = true`<br />`enable_write_index_searcher_cache = false` | インデックスアップロード時のコールドデータストレージの自動キャッシュを有効にします。 |
| -          | `tablet_schema_cache_recycle_interval = 3600` `segment_cache_capacity = 20000` | 他のキャッシュによるメモリ使用量を削減します。                         |
| -          | `inverted_index_ram_dir_enable = true` | インデックスファイルの一時書き込みによるIOオーバーヘッドを削減します。 |
| Thread     | `pipeline_executor_size = 24` `doris_scanner_thread_pool_thread_num = 48` | 32コアCPU用にコア数に比例して計算スレッドとI/Oスレッドを設定します。 |
| -          | `scan_thread_nice_value = 5`                                 | クエリI/Oスレッドの優先度を下げて、書き込みパフォーマンスと適時性を確保します。 |
| Other      | `string_type_length_soft_limit_bytes = 10485760`             | 文字列タイプデータの長さ制限を10MBに増加します。      |
| -          | `trash_file_expire_time_sec = 300` `path_gc_check_interval_second  = 900` `path_scan_interval_second = 900` | ゴミファイルのリサイクルを高速化します。                     |

詳細については、[BE Configuration](./admin-manual/config/be-config)を参照してください。

### ステップ4：テーブルの作成

ログデータの書き込みとクエリの両方の特殊な特性により、パフォーマンス向上のため対象を絞った設定でテーブルを構成することを推奨します。

**データパーティショニングとバケッティングの設定**

- データパーティショニングについて：

    - 日単位で自動管理される[dynamic partitions](./table-design/data-partitioning/dynamic-partitioning.md)（`"dynamic_partition.enable" = "true"`）と[range partitioning](./table-design/data-partitioning/manual-partitioning.md#range-partitioning)（`PARTITION BY RANGE(`ts`)`）を有効にします。

    - 最新のNログエントリの高速取得のため、DATETIMEタイプのフィールドをキーとして使用します（`DUPLICATE KEY(ts)`）。

- データバケッティングについて：

    - バケット数をクラスター内の総ディスク数の約3倍に設定し、各バケットが圧縮後約5GBのデータを含むようにします。

    - 単一tabletインポートと組み合わせてバッチ書き込み効率を最適化するため、Random戦略（`DISTRIBUTED BY RANDOM BUCKETS 60`）を使用します。

詳細については、[Data Partitioning](./table-design/data-partitioning/auto-partitioning)を参照してください。

**圧縮パラメータの設定**

データ圧縮効率を向上させるため、zstd圧縮アルゴリズム（"compression" = "zstd"）を使用します。

**compactionパラメータの設定**

compactionフィールドを以下のように設定します：

- 高スループットのログ書き込みに重要な書き込み増幅を削減するため、time_series戦略（`"compaction_policy" = "time_series"`）を使用します。

**インデックスパラメータの設定**

インデックスフィールドを以下のように設定します：

- 頻繁にクエリされるフィールドにインデックスを作成します（`USING INVERTED`）。

- 全文検索が必要なフィールドについて、parserフィールドをunicodeに指定します。これはほとんどの要件を満たします。フレーズクエリのサポートが必要な場合、support_phraseフィールドをtrueに設定し、不要な場合はfalseに設定してストレージ容量を削減します。

**ストレージパラメータの設定**

ストレージポリシーを以下のように設定します：

- ホットデータのストレージについて、クラウドストレージを使用する場合はデータコピー数を1に設定し、物理ディスクを使用する場合はデータコピー数を最低2に設定します（`"replication_num" = "2"`）。

- log_s3のストレージ場所（`CREATE RESOURCE "log_s3"`）を設定し、log_policy_3dayポリシー（`CREATE STORAGE POLICY log_policy_3day`）を設定します。ここでは、データは3日後にクールダウンしてlog_s3の指定ストレージ場所に移動されます。以下のコードを参照してください。

```SQL
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
  "dynamic_partition.replication_num" = "2", -- unneccessary for the compute-storage coupled mode
  "replication_num" = "2", -- unneccessary for the compute-storage coupled mode
  "storage_policy" = "log_policy_3day" -- unneccessary for the compute-storage coupled mode
);
```
### ステップ 5: ログの収集

テーブル作成が完了した後、ログ収集を進めることができます。

Apache Dorisは、オープンで汎用性の高いStream HTTP APIを提供しており、これらを通じてLogstash、Filebeat、Kafkaなどの人気のあるログコレクターと接続し、ログ収集作業を実行できます。このセクションでは、Stream HTTP APIを使用してこれらのログコレクターを統合する方法について説明します。

**Logstashの統合**

以下の手順に従ってください：

1. Logstash Doris Outputプラグインをダウンロードしてインストールします。以下の2つの方法のうち1つを選択できます：

   - [クリックしてダウンロード](https://download.selectdb.com/extension/logstash-output-doris-1.2.0.gem)してインストールします。

   - ソースコードからコンパイルし、以下のコマンドを実行してインストールします：

```markdown  
./bin/logstash-plugin install logstash-output-doris-1.2.0.gem
```
1. Logstashを設定します。以下のフィールドを指定してください：

- `logstash.yml`：データ書き込みパフォーマンスを向上させるため、Logstashバッチ処理ログサイズとタイミングを設定するために使用されます。

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
Logstash Doris Output pluginの詳細については、[Logstash Doris Output Plugin](./ecosystem/observability/logstash)を参照してください。

**Filebeatの統合**

以下の手順に従ってください：

1. Apache Dorisへの出力をサポートするFilebeatバイナリファイルを取得します。[こちらをクリックしてダウンロード](https://download.selectdb.com/extension/filebeat-doris-2.1.1)するか、Apache Dorisのソースコードからコンパイルできます。

2. Filebeatを設定します。収集するログの具体的な入力パスとApache Dorisへの出力設定を構成するために使用されるfilebeat_demo.ymlフィールドを指定します。

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
Filebeatの詳細については、[Beats Doris Output Plugin](./ecosystem/observability/beats)を参照してください。

**Kafkaの統合**

JSON形式のログをKafkaのメッセージキューに書き込み、Kafka Routine Loadを作成し、Apache DorisがKafkaからデータを能動的にプルできるようにします。

以下の例を参照できます。ここで`property.*`はLibrdkafkaクライアント関連の設定を表し、実際のKafkaクラスターの状況に応じて調整する必要があります。

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
Kafkaの詳細については、[Routine Load](./data-operate/import/import-way/routine-load-manual.md)を参照してください。

**カスタマイズされたプログラムを使用したログ収集**

一般的なログコレクターの統合に加えて、Stream Load HTTP APIを使用してApache Dorisにログデータをインポートするためのプログラムをカスタマイズすることも可能です。以下のコードを参照してください：

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
カスタムプログラムを使用する際は、以下の重要なポイントに注意してください：

- HTTP認証にはBasic Authを使用し、echo -n 'username:password' | base64コマンドを使用して計算します。

- HTTPヘッダー「format:json」を設定してデータ形式をJSONとして指定します。

- HTTPヘッダー「read_json_by_line:true」を設定して1行につき1つのJSONを指定します。

- HTTPヘッダー「load_to_single_tablet:true」を設定して小さなファイルのインポートを減らすために一度に1つのバケットにデータをインポートします。

- クライアント側で100MBから1GBのサイズのバッチを書き込むことを推奨します。Apache Doris バージョン2.1以降では、Group Commit機能を通じてクライアント側でバッチサイズを削減する必要があります。

### ステップ6：ログの照会と分析

**ログの照会**

Apache Dorisは標準SQLをサポートしているため、MySQLクライアントまたはJDBCを通じてクラスターに接続してログ照会用のSQLを実行できます。

```Plain Text  
mysql -h fe_host -P fe_mysql_port -u your_username -Dyour_db_name
```
参考用の一般的なSQLクエリコマンド5つを以下に示します：

- 最新の10件のログエントリを表示

```SQL  
SELECT * FROM your_table_name ORDER BY ts DESC LIMIT 10;
```
- ホストが8.8.8.8の最新10件のログエントリを照会する

```SQL  
SELECT * FROM your_table_name WHERE host = '8.8.8.8' ORDER BY ts DESC LIMIT 10;
```
- request フィールドにerrorまたは404を含む最新の10件のログエントリを取得します。以下のコマンドでは、MATCH_ANYはApache Dorisがフィールド内の任意のキーワードをマッチングするために使用する全文検索SQL構文です。

```SQL  
SELECT * FROM your_table_name WHERE message **MATCH_ANY** 'error 404'  
ORDER BY ts DESC LIMIT 10;
```
- request フィールドに image と faq を含む最新の10件のログエントリを取得します。以下のコマンドでは、MATCH_ALL は Apache Doris でフィールド内のすべてのキーワードをマッチングするために使用される全文検索 SQL 構文です。

```SQL  
SELECT * FROM your_table_name WHERE message **MATCH_ALL** 'image faq'  
ORDER BY ts DESC LIMIT 10;
```
- リクエストフィールドにimageとfaqを含む最新の10件のエントリを取得します。以下のコマンドにおいて、MATCH_PHRASEはApache Dorisで使用される全文検索SQL構文で、フィールド内のすべてのキーワードをマッチングし、一貫した順序を要求します。以下の例では、a image faq bはマッチしますが、a faq image bはimageとfaqの順序が構文と一致しないためマッチしません。

```SQL  
SELECT * FROM your_table_name WHERE message **MATCH_PHRASE** 'image faq'  
ORDER BY ts DESC LIMIT 10;
```
**ログの視覚的分析**

一部のサードパーティベンダーは、Apache Dorisベースの視覚的ログ分析開発プラットフォームを提供しており、これにはKibana Discoverに類似したログ検索・分析インターフェースが含まれています。これらのプラットフォームは、直感的でユーザーフレンドリーな探索的ログ分析インタラクションを提供します。

![WebUI-a log search and analysis interface similar to Kibana](/images/WebUI-EN.jpeg)

- 全文検索とSQLモードのサポート

- タイムボックスとヒストグラムによるクエリログ時間枠選択のサポート

- 詳細ログ情報の表示（JSONまたはテーブルに展開可能）

- ログデータコンテキストでのフィルター条件追加・削除のためのインタラクティブクリック

- 異常の発見とさらなる詳細分析のための検索結果内トップフィールド値の表示

詳細については、dev@doris.apache.orgにお問い合わせください。
