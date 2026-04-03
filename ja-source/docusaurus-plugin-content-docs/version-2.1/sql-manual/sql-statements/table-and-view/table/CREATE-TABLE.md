---
{
  "title": "CREATE TABLE",
  "language": "ja",
  "toc_min_heading_level": 2,
  "toc_max_heading_level": 4,
  "description": "現在のまたは指定されたデータベースに新しいテーブルを作成します。テーブルは複数のカラムを持つことができ、各カラム定義には名前、データ型が含まれます。"
}
---
## 説明

現在のデータベースまたは指定されたデータベースに新しいテーブルを作成します。テーブルは複数の列を持つことができ、各列の定義には名前、データ型、およびオプションで以下の属性が含まれます：

- キーかどうか
- 集約セマンティクスを持つかどうか
- 生成列かどうか
- 値が必要かどうか（NOT NULL）
- 自動インクリメント列かどうか
- 挿入時にデフォルト値があるかどうか
- 更新時にデフォルト値があるかどうか

さらに、このコマンドは以下のバリエーションもサポートします：

- CREATE TABLE … AS SELECT（データが事前に入力されたテーブルを作成する；CTASとしても知られる）
- CREATE TABLE … LIKE（既存のテーブルの空のコピーを作成する）

## 構文

```sql
CREATE [ EXTERNAL ] TABLE [ IF NOT EXISTS ] <table_name>
    (<columns_definition> [ <indexes_definition> ])
    [ ENGINE = <table_engine_type> ]
    [ <key_type> KEY (<key_cols>)
        [ CLUSTER BY (<cluster_cols>) ]
    ]
    [ COMMENT '<table_comment>' ]
    [ <partitions_definition> ]
    [ DISTRIBUTED BY { HASH (<distribute_cols>) | RANDOM }
        [ BUCKETS { <bucket_count> | AUTO } ]
    ]
    [ <roll_up_definition> ]
    [ PROPERTIES (
          -- Table property
          <table_property>
          -- Additional table properties
          [ , ... ]) 
    ]
```
ここで：

```sql
columns_definition
  : -- Column definition
    <col_name> <col_type>
      [ KEY ]
      [ <col_aggregate_type> ]
      [ [NOT] NULL ]
      [ AUTO_INCREMENT(<col_auto_increment_start_value>) ]
      [ DEFAULT <col_default_value> ]
      [ ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>) ]
      [ COMMENT '<col_comment>' ]
    -- Additional column definitions
    [ , <col_name> <col_type> [ ... ] ]
```
```sql
indexes_definition
  : -- Index definition
    INDEX [ IF NOT EXISTS ]
      <index_name> (<index_cols>)
      [ USING <index_type> ]
      [ PROPERTIES (
            -- Table property
            <index_property>
            -- Additional table properties
            [ , ... ]) 
      ]
      [ COMMENT '<index_comment>' ]
    -- Additional index definitions
    [ , <index_name> (<index_cols>) [ ... ] ]
```
```sql
partitions_definition
  : AUTO PARTITION BY RANGE(<auto_partition_function>(<auto_partition_arguments>))
    <origin_partitions_definition>
  | AUTO PARTITION BY LIST(<partition_cols>)
    <origin_partitions_definition>
  | PARTITION BY <partition_type> (<partition_cols>)
    <origin_partitions_definition>
```
- ここで:

    ```sql
    <origin_partitions_definition>
    : (
        -- Partition definition
        <one_partition_definition>
        -- Additional partition definition
        [ , ... ]
      )

    <one_partition_definition>
    : PARTITION [ IF NOT EXISTS ] <partition_name>
        VALUES LESS THAN <partition_value_list>
    | PARTITION [ IF NOT EXISTS ] <partition_name>
        VALUES [ <partition_lower_bound>, <partition_upper_bound>)
    | FROM <partition_lower_bound> TO <partition_upper_bound>
        INTERVAL <n> [ <datetime_unit> ]
    | PARTITION [ IF NOT EXISTS ] <partition_name>
        VALUES IN {
            (<partition_value> [, <partition_value> [ ... ] ])
            | <partition_value>
        }
    ```
```sql
roll_up_definition
  : ROLLUP (
        -- Rollup definition
        <rollup_name> (<rollup_cols>)
        [ DUPLICATE KEY (<duplicate_cols>) ]
        -- Additional rollup definition
        [ , <rollup_name> (<rollup_cols>) [ ... ] ]
    )
```
## Varaint構文

### CREATE TABLE ... AS SELECT（CTASとも呼ばれる）

テーブルを生成し、`query`から返されたデータでそのテーブルにデータを投入します：

```sql
CREATE
    [ EXTERNAL ]
    TABLE [ IF NOT EXISTS ] <table_name>
    [ ( <column_definitions> ) ]
    [ <index_definitions> ]
    [ ENGINE = <storage_engine_type> ]
    [ <partitioning_key_type> KEY ( <key_columns> )
        [ CLUSTER BY ( <clustering_columns> ) ]
    ]
    [ COMMENT '<table_description>' ]
    [ <partition_definitions> ]
    [ DISTRIBUTED BY { HASH ( <distribution_columns> ) | RANDOM }
        [ BUCKETS { <number_of_buckets> | AUTO } ]
    ]
    [ <rollup_definitions> ]
    [ PROPERTIES (
          "<table_properties>"
          [ , ... ] 
    ) ]
AS <query>;
```
### CREATE TABLE ... LIKE

既存のテーブルと同じカラム定義で新しいテーブルを作成します。既存のテーブルからデータはコピーされません。カラムのすべてのプロパティが新しいテーブルに複製されます。`rollup`名のリストが指定された場合、元のテーブルから対応する`rollup`も複製されます：

```sql
CREATE TABLE <new_table_name> LIKE <existing_table_name>
[ WITH ROLLUP ( <rollup_list> ) ];
```
## 必須パラメータ

**<name>**

> テーブルの識別子（すなわち、名前）を指定します。テーブルが作成されるデータベース内で一意である必要があります。
>
> 識別子は文字で始まる必要があり（Unicode名前サポートが有効になっている場合は任意の言語文字）、識別子文字列全体がバッククォートで囲まれていない限り（例：``My Object``）、スペースや特殊文字を含むことはできません。
>
> 識別子は予約キーワードを使用できません。
>
> 詳細については、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約キーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**<col_name>**

> カラム識別子（すなわち、名前）を指定します。作成されるテーブル内で一意である必要があります。
>
> 識別子は文字（Unicode名前サポートが有効になっている場合は任意の言語文字）、数字、または記号`@`で始まる必要があり、識別子文字列全体がバッククォートで囲まれていない限り（例：``My Object``）、スペースや特殊文字を含むことはできません。
>
> 詳細については、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約キーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**<col_type>**

> カラムのデータ型を指定します。
>
> テーブルカラムに指定できるデータ型の詳細については、[データ型](../../../basic-element/sql-data-types/data-type-overview.md)セクションを参照してください。

**<query>**

> CTASの必須パラメータです。データを投入するSELECT文を指定します。

**<source_table>**

> CREATE TABLE ... LIKEの必須パラメータです。コピー元のテーブルを指定します。

## オプションパラメータ

### データモデル関連パラメータ

**<key_type>**

> テーブルのデータモデルです。オプション値はDUPLICATE（詳細モデル）、UNIQUE（主キーモデル）、AGGREGATE（集約モデル）です。データモデルの詳細については、[データモデル](../../../../table-design/data-model/overview.md)セクションを参照してください。

**<key_cols>**

> テーブルのキーカラムです。Dorisでは、Keyカラムはテーブルの最初のK個のカラムである必要があります。単一のtablet内のデータは、これらのカラムによって順序付けられます。Keysの制限とKeyカラムの選択方法については、[データモデル](../../../../table-design/data-model/overview.md)セクションの各サブセクションを参照してください。

**<cluster_cols>**

> データローカルソートカラムです。データモデルがUNIQUE（主キーモデル）の場合のみ使用できます。`<cluster_cols>`が指定された場合、`<key_cols>`の代わりに`<cluster_cols>`でデータがソートされます。

**<col_aggregate_type>**

> カラムの集約方法です。テーブルが集約モデルの場合のみ使用できます。集約方法の詳細については、[集約モデル](../../../../table-design/data-model/aggregate.md)セクションを参照してください。

### バケット関連パラメータ

**<distribute_cols> と <bucket_count>**

> バケットカラムとバケット数です。詳細モデルのバケットカラムは任意のカラムが可能で、集約モデルと主キーモデルのバケットカラムはキーカラムと一致している必要があります。バケット数は任意の正の整数です。バケットの詳細については、[手動バケット](../../../../table-design/data-partitioning/data-bucketing#manual-setting-bucket-count)と[自動バケット](../../../../table-design/data-partitioning/data-bucketing#automatic-setting-bucket-count)セクションを参照してください。

### カラムデフォルト値関連パラメータ

**AUTO_INCREMENT(<col_auto_increment_start_value>)**

> データをインポートする際、Dorisは値が指定されていない自動インクリメントカラムのデータ行に対して、テーブル内で一意の値を割り当てます。`<col_auto_increment_start_value>`は自動インクリメントカラムの開始値を指定します。自動インクリメントカラムの詳細については、[自動インクリメントカラム](../../../../table-design/auto-increment.md)セクションを参照してください。

**DEFAULT <col_default_value>**

> カラムのデフォルト値です。このカラムを含めずに書き込む際に、このデフォルト値が使用されます。デフォルト値が明示的に設定されていない場合、NULLが使用されます。利用可能なデフォルト値には以下があります：
>
> - NULL：すべての型で利用可能で、デフォルト値としてNULLを使用します。
> - 数値リテラル：数値型でのみ使用できます。
> - 文字列リテラル：文字列型でのみ使用できます。
> - CURRENT_DATE：日付型でのみ使用できます。現在の日付をデフォルト値として使用します。
> - CURRENT_TIMESTAMP [ <defaultValuePrecision> ]：日時型でのみ使用できます。現在のタイムスタンプをデフォルト値として使用します。`<defaultValuePrecision>`で時刻精度を指定できます。
> - PI：double型でのみ使用できます。円周率をデフォルト値として使用します。
> - E：double型でのみ使用できます。数学定数eをデフォルト値として使用します。
> - BITMAP_EMPTY：カラムがbitmap型の場合のみ使用できます。空のbitmapを埋めます。

**ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>)**

> データが更新される際、このカラムに値が指定されていない場合、現在のタイムスタンプを使用してこのカラムのデータを更新します。UNIQUE（主キーモデル）のテーブルでのみ使用できます。

### インデックス関連パラメータ

**<index_name>**

> インデックス識別子（すなわち、名前）を指定します。作成されるテーブル内で一意である必要があります。識別子の詳細については、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約キーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**<index_cols>**

> インデックスを追加するカラムのリストです。テーブル内の既存のカラムである必要があります。

**<index_type>**

> インデックスのタイプです。現在、INVERTEDのみサポートされています。

**<index_property>**

> インデックスのプロパティです。詳細な説明については、[転置インデックス](../../../../table-design/index/inverted-index.md)セクションを参照してください。

### 自動パーティション関連パラメータ

パーティションの詳細な説明については、[自動パーティション](../../../../table-design/data-partitioning/auto-partitioning.md)セクションを参照してください。

### 手動パーティション関連パラメータ

パーティションの詳細な説明については、「手動パーティション」セクションを参照してください。

**<partition_type>**

> DorisはRANGEパーティションとLISTパーティションをサポートしています。詳細については、[手動パーティション](../../../../table-design/data-partitioning/manual-partitioning.md)セクションを参照してください。

**<partition_name>**

> パーティション識別子（すなわち、名前）です。作成されるテーブル内で一意である必要があります。識別子の詳細については、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約キーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**VALUES LESS THAN <partition_value_list>**

> RANGEパーティションです。パーティションデータ範囲は下限から`<partition_value_list>`までです。
>
> 上限を表す場合、`<partition_value_list>`は`MAX_VALUE`に簡略化できます。
>
> `<partition_value_list>`の形式は次のとおりです：`((col_1_value, ...), (col_1_value, ...), ...)`

**VALUES [ <partition_lower_bound>, <partition_upper_bound>)**

> RANGEパーティションです。パーティションデータ範囲は`<partition_lower_bound>`から`<partition_upper_bound>`までです。1つのパーティションのみが作成されます。
>
> `<partition_lower_bound>`と`<partition_upper_bound>`の形式は次のとおりです：`(col_1_value, ...)`

**FROM <partition_lower_bound> TO <partition_upper_bound>**

**INTERVAL <n> [ <datetime_unit> ]**

> RANGEパーティションです。パーティションデータ範囲は`<partition_lower_bound>`から`<partition_value_list>`までです。`<n>`ごとにパーティションが作成されます。
>
> `<partition_lower_bound>`と`<partition_upper_bound>`の形式は次のとおりです：`(col_1_value, ...)`

**VALUES IN {**

​          **(<partition_value> [, <partition_value> [ ... ] ])**

​          **| <partition_value>**

​      **}**

> LISTパーティションです。パーティションカラムが`<partition_value>`に等しい行がこのパーティションに属します。
>
> `<partition_value>`の形式は次のとおりです：`(col_1_value, ...)`

### 同期マテリアライズドビュー関連

:::caution 注記
rollupで同期マテリアライズドビューを作成する機能は制限があり、もはや推奨されません。別のステートメントを使用して同期マテリアライズドビューを作成することをお勧めします。詳細については、[CREATE MATERIALIZED VIEW](../sync-materialized-view/CREATE-MATERIALIZED-VIEW.md)ステートメントと[同期マテリアライズドビュー](../../../../query-acceleration/materialized-view/sync-materialized-view.md)セクションを参照してください。
:::

**<rollup_name>**

> 同期マテリアライズドビューの識別子（すなわち、名前）です。作成されるテーブル内で一意である必要があります。識別子の詳細については、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約キーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**<rollup_cols>**

> 同期マテリアライズドビューに含まれるカラムです。

### テーブルプロパティ関連パラメータ

**<table_property>**

| プロパティ名 | 機能 |
| :------------ | :-------- |
| replication_num | レプリカ数です。デフォルトのレプリカ数は3です。BEノード数が3未満の場合、BEノード数以下のレプリカ数を指定する必要があります。バージョン0.15以降、このプロパティは自動的に`replication_allocation`プロパティに変換されます。例：`"replication_num" = "3"`は自動的に`"replication_allocation" = "tag.location.default:3"`に変換されます。 |
| replication_allocation | Tagsに基づいてレプリカの分散を設定します。このプロパティは`replication_num`プロパティの機能を完全に上書きできます。 |
| min_load_replica_num | データインポートが成功するために必要な最小レプリカ数を設定します。デフォルト値は-1です。このプロパティが0以下の場合、データインポートには依然として過半数のレプリカが成功する必要があることを示します。 |
| is_being_synced | このテーブルがCCRによって複製され、現在syncerによって同期されているかどうかを識別するために使用されます。デフォルト値は`false`です。`true`に設定されると、`colocate_with`と`storage_policy`プロパティがクリアされます。`dynamic partition`と`auto bucket`機能は無効になります。つまり、`show create table`では有効に見えますが、実際には効果がありません。`is_being_synced`が`false`に設定されると、これらの機能が再開されます。このプロパティはCCR周辺モジュールでのみ使用され、CCR同期プロセス中に手動で設定すべきではありません。 |
| storage_medium | テーブルデータの初期ストレージメディアを宣言します。 |
| storage_cooldown_time | テーブルデータの初期ストレージメディアの有効期限を設定します。この時間後、自動的に第1レベルのストレージメディアにダウングレードされます。 |
| colocate_with | Colocation Join機能が必要な場合、このパラメータを使用してColocation Groupを設定します。 |
| bloom_filter_columns | ユーザーが指定したBloom Filterインデックスの追加が必要なカラム名のリストです。各カラムのBloom Filterインデックスは独立しており、複合インデックスではありません。例：`"bloom_filter_columns" = "k1, k2, k3"` |
| compression | Dorisテーブルのデフォルト圧縮方式はLZ4です。バージョン1.1以降、より高い圧縮率のためにZSTDを圧縮方式として指定することがサポートされています。 |
| function_column.sequence_col | Unique Keyモデルを使用する場合、Sequenceカラムを指定できます。Keyカラムが同じ場合、Sequenceカラムに従ってREPLACEが実行されます（大きい値が小さい値を置き換えます。そうでなければ置き換えられません）。`function_column.sequence_col`はsequenceカラムをテーブル内の特定のカラムにマッピングするために使用され、整数型または日付/時刻型（DATE、DATETIME）にできます。このカラムの型は作成後に変更できません。`function_column.sequence_col`が設定されている場合、`function_column.sequence_type`は無視されます。 |
| function_column.sequence_type | Unique Keyモデルを使用する場合、Sequenceカラムを指定できます。Keyカラムが同じ場合、Sequenceカラムに従ってREPLACEが実行されます（大きい値が小さい値を置き換えます。そうでなければ置き換えられません）。ここでは、sequenceカラムの型のみを指定する必要があり、日付/時刻型または整数をサポートします。Dorisは隠れたsequenceカラムを作成します。 |
| enable_unique_key_merge_on_write | UniqueテーブルがMerge-on-Write実装を使用するかどうかです。このプロパティはバージョン2.1以前ではデフォルト無効で、バージョン2.1以降ではデフォルト有効です。 |
| light_schema_change | Light Schema Change最適化を使用するかどうかです。`true`に設定されている場合、valueカラムの追加と削除操作をより高速かつ同期的に完了できます。この機能はバージョン2.0.0以降でデフォルト有効です。 |
| disable_auto_compaction | このテーブルの自動compactionを無効にするかどうかです。このプロパティが`true`に設定されている場合、バックグラウンドの自動compactionプロセスはこのテーブルのすべてのtabletをスキップします。 |
| enable_single_replica_compaction | このテーブルの単一レプリカcompactionを有効にするかどうかです。このプロパティが`true`に設定されている場合、テーブルのtabletのすべてのレプリカのうち1つのレプリカのみが実際のcompactionアクションを実行し、他のレプリカはそのレプリカからcompactionされたrowsetを取得します。 |
| enable_duplicate_without_keys_by_default | `true`に設定されている場合、テーブル作成時にUnique、Aggregate、またはDuplicateが指定されていない場合、デフォルトでソートカラムとprefixインデックスなしのDuplicateモデルテーブルが作成されます。 |
| skip_write_index_on_load | このテーブルのデータインポート中にインデックス書き込みをしないことを有効にするかどうかです。このプロパティが`true`に設定されている場合、データインポート中にインデックスは書き込まれず（現在は転置インデックスのみ有効）、compactionまで遅延されます。これにより、初回書き込みとcompaction中にインデックスを繰り返し書き込むCPUとIOリソース消費を避け、高スループットインポートのパフォーマンスを向上させることができます。 |
| compaction_policy | このテーブルのcompactionマージポリシーを構成します。time_seriesまたはsize_basedtime_seriesのみサポートします：rowsetのディスク容量が一定のサイズまで蓄積されると、バージョンマージが実行されます。マージされたrowsetは直接base compactionフェーズに昇格されます。これにより、継続的インポートシナリオでのcompactの書き込み増幅を効果的に削減します。このポリシーはtime_series_compactionのプレフィックスが付いたパラメータを使用してcompactionの実行を調整します。 |
| time_series_compaction_goal_size_mbytes | compactionマージポリシーがtime_seriesの場合、このパラメータは各compactionの入力ファイルサイズを調整するために使用され、出力ファイルサイズは入力と同程度になります。 |
| time_series_compaction_file_count_threshold | compactionマージポリシーがtime_seriesの場合、このパラメータは各compactionの最小入力ファイル数を調整するために使用されます。tabletのファイル数がこの構成を超える場合、compactionがトリガーされます。 |
| time_series_compaction_time_threshold_seconds | compactionマージポリシーがtime_seriesの場合、このパラメータはcompaction間の最長間隔を調整するために使用されます。つまり、長時間実行されていない場合compactionがトリガーされ、単位は秒です。 |
| time_series_compaction_level_threshold | compactionマージポリシーがtime_seriesの場合、このパラメータはデフォルトで1です。2に設定されている場合、一度マージされたセグメントが再度マージされ、セグメントサイズがtime_series_compaction_goal_size_mbytesに達することを制御し、セグメント数を減らす効果を達成するために使用されます。 |
| group_commit_interval_ms | このテーブルのGroup Commitバッチ間隔を構成します。単位はmsで、デフォルト値は10000ms、つまり10sです。Group Commitのタイミングは`group_commit_interval_ms`と`group_commit_data_bytes`のどちらが先に設定値に達するかに依存します。 |
| group_commit_data_bytes | このテーブルのGroup Commitバッチデータサイズを構成します。単位はbytesで、デフォルト値は134217728、つまり128MBです。Group Commitのタイミングは`group_commit_interval_ms`と`group_commit_data_bytes`のどちらが先に設定値に達するかに依存します。 |
| enable_mow_light_delete | MowのUniqueテーブルでDeleteステートメントでDelete predicateを書き込むことを有効にするかどうかです。有効にすると、Deleteステートメントのパフォーマンスが向上しますが、Delete後の部分カラム更新で一部のデータエラーが発生する可能性があります。無効にすると、正確性を確保するためにDeleteステートメントのパフォーマンスが低下します。このプロパティのデフォルト値は`false`です。このプロパティはUnique Merge-on-Writeテーブルでのみ有効にできます。 |
| 動的パーティション関連プロパティ | 動的パーティションについては、[データパーティション - 動的パーティション](../../../../table-design/data-partitioning/dynamic-partitioning)を参照してください |

## アクセス制御要件

このSQLコマンドを実行する[ユーザー](../../../../admin-manual/auth/authentication-and-authorization.md)は、少なくとも以下の[権限](../../../../admin-manual/auth/authentication-and-authorization.md)を持っている必要があります：

| 権限 | オブジェクト | 説明 |
| :---------------- | :------------------------ | :----------------------------------------------------------- |
| CREATE_PRIV | Database | |
| SELECT_PRIV | Table、View | CTASを実行する際に、クエリ対象のテーブル、ビュー、またはマテリアライズドビューに対するSELECT_PRIVが必要 |

## 使用上の注意

- データベース（Database）は同じ名前のテーブル（Table）またはビュー（View）を含んではいけません。
- テーブル名、カラム名、rollup名は[予約キーワード](../../../basic-element/reserved-keywords.md)を使用してはいけません。
- CREATE TABLE ... LIKE：
  - このコマンドはDoris内部テーブルでのみ使用できます。
  - 明示的に指定されたrollupのみがコピーされます。
  - すべての同期マテリアライズドビューは複製されません。
- CREATE TABLE ... AS SELECT (CTAS)：
  - SELECTリストのカラム名のエイリアスが有効なカラムの場合、CTASステートメントではカラム定義は不要です。省略された場合、カラム名とデータ型はベースクエリから推測されます：

    ```sql
    CREATE TABLE <table_name> AS SELECT ...
    ```
- または、以下の構文を使用して明示的に名前を指定することができます：

    ```sql
    CREATE TABLE <table_name> ( <col1_name>, <col2_name>, ... ) AS SELECT ...
    ```
- Partitioning と Bucketing
  - テーブルは bucketing カラムを指定する必要がありますが、partition の指定は省略できます。partitioning と bucketing の詳細情報については、[Data Partitioning](../../../../table-design/data-partitioning/auto-partitioning.md) ドキュメントを参照してください。
  - Doris のテーブルは partitioned または non-partitioned のいずれかです。この属性はテーブル作成時に決定され、後から変更することはできません。つまり、partitioned テーブルの場合、その後の使用で partition の追加や削除が可能ですが、non-partitioned テーブルには後から partition を追加することはできません。
  - Partition と bucket のカラムはテーブル作成後に変更できません。partition と bucket カラムの型を変更することも、これらのカラムを追加や削除することもできません。
- Dynamic Partitioning
  - dynamic partitioning 機能は、主にユーザーが partition を自動的に管理できるよう支援するために使用されます。特定のルールを設定することで、Doris システムが定期的に新しい partition を追加したり、古い partition を削除したりします。詳細については、[Dynamic Partitioning](../../../../table-design/data-partitioning/dynamic-partitioning.md) ドキュメントを参照してください。
- Automatic Partitioning
  - automatic partitioning のドキュメントは [Automatic Partitioning](../../../../table-design/data-partitioning/auto-partitioning.md) で確認できます。
- Synchronized Materialized Views
  - ユーザーはテーブル作成時に複数の synchronized materialized view（ROLLUP）を作成できます。Synchronized materialized view はテーブル作成後に追加することも可能です。テーブル作成文に含めることで、すべての synchronized materialized view を一度に作成できます。
  - テーブル作成時に synchronized materialized view が作成される場合、その後のすべてのデータインポート操作で materialized view のデータが同期的に生成されます。Materialized view の数はデータインポートの効率に影響する可能性があります。
  - Materialized view の紹介については、[Synchronized Materialized Views](../../../../query-acceleration/materialized-view/sync-materialized-view.md) のドキュメントを参照してください。
- Indexes
  - ユーザーはテーブル作成時に複数のカラム index を作成できます。Index はテーブル作成後に追加することも可能です。
  - その後の使用で index が追加され、テーブルに既存のデータがある場合、すべてのデータを書き直す必要があります。そのため、index の作成時間は現在のデータ量に依存します。


## Examples

### Basic Examples

**Detail Model**

```sql
CREATE TABLE t1
(
  c1 INT,
  c2 STRING
)
DUPLICATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```
**集約モデル**

```sql
CREATE TABLE t2
(
  c1 INT,
  c2 INT MAX
)
AGGREGATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```
**Primary Key Model**

```sql
CREATE TABLE t3
(
  c1 INT,
  c2 INT
)
UNIQUE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```
**列のデフォルト値の指定**

```sql
CREATE TABLE t5
(
  c1 INT,
  c2 INT DEFAULT 10
)
DUPLICATE KEY(c1)
DISTRIBUTED BY HASH(c1)
PROPERTIES (
  'replication_num' = '1'
);
```
**バケッティング方式**

```sql
CREATE TABLE t6
(
  c1 INT,
  c2 INT
)
DUPLICATE KEY(c1)
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
);
```
**自動パーティショニング**

```sql
CREATE TABLE t7
(
  c1 INT,
  c2 DATETIME NOT NULL
)
DUPLICATE KEY(c1)
AUTO PARTITION BY RANGE(date_trunc(c2, 'day')) ()
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
);
```
**範囲パーティショニング**

```sql
CREATE TABLE t8
(
  c1 INT,
  c2 DATETIME NOT NULL
)
DUPLICATE KEY(c1)
PARTITION BY RANGE(c2) (
  FROM ('2020-01-01') TO ('2020-01-10') INTERVAL 1 DAY
)
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
);
```
**List Partitioning**

```sql
CREATE TABLE t9
(
  c1 INT,
  c2 DATE NOT NULL
)
DUPLICATE KEY(c1)
PARTITION BY LIST(c2) (
  PARTITION p1 VALUES IN (('2020-01-01'),('2020-01-02'))
)
DISTRIBUTED BY RANDOM
PROPERTIES (
  'replication_num' = '1'
);
```
**ストレージメディアとクールダウン時間**

```sql
CREATE TABLE example_db.table_hash
(
    k1 BIGINT,
    k2 LARGEINT,
    v1 VARCHAR(2048),
    v2 SMALLINT DEFAULT "10"
)
UNIQUE KEY(k1, k2)
DISTRIBUTED BY HASH (k1, k2) BUCKETS 32
PROPERTIES(
    "storage_medium" = "SSD",
    "storage_cooldown_time" = "2015-06-04 00:00:00"
);
```
**`storage_policy`プロパティを使用したテーブルのコールド・ホット階層データ移行戦略の設定**

1. テーブルが移行戦略と正常に関連付けられるように、まずs3リソースとstorage policyを作成する必要があります。

    ```sql
    -- Non-partitioned table
    CREATE TABLE IF NOT EXISTS create_table_use_created_policy 
    (
        k1 BIGINT,
        k2 LARGEINT,
        v1 VARCHAR(2048)
    )
    UNIQUE KEY(k1)
    DISTRIBUTED BY HASH (k1) BUCKETS 3
    PROPERTIES(
        "storage_policy" = "test_create_table_use_policy",
        "replication_num" = "1"
    );

    -- Partitioned table
    CREATE TABLE create_table_partion_use_created_policy
    (
        k1 DATE,
        k2 INT,
        V1 VARCHAR(2048) REPLACE
    ) PARTITION BY RANGE (k1) (
        PARTITION p1 VALUES LESS THAN ("2022-01-01") ("storage_policy" = "test_create_table_partition_use_policy_1" ,"replication_num"="1"),
        PARTITION p2 VALUES LESS THAN ("2022-02-01") ("storage_policy" = "test_create_table_partition_use_policy_2" ,"replication_num"="1")
    ) DISTRIBUTED BY HASH(k2) BUCKETS 1;
    ```
**コロケーショングループ**

```sql
CREATE TABLE t1 (
    id int(11) COMMENT "",
    value varchar(8) COMMENT ""
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "colocate_with" = "group1"
);

CREATE TABLE t2 (
    id int(11) COMMENT "",
    value1 varchar(8) COMMENT "",
    value2 varchar(8) COMMENT ""
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "colocate_with" = "group1"
);
```
**インデックス**

```sql
CREATE TABLE example_db.table_hash
(
    k1 TINYINT,
    k2 DECIMAL(10, 2) DEFAULT "10.5",
    v1 CHAR(10) REPLACE,
    v2 INT SUM,
    INDEX k1_idx (k1) USING INVERTED COMMENT 'my first index'
)
AGGREGATE KEY(k1, k2)
DISTRIBUTED BY HASH(k1) BUCKETS 32
PROPERTIES (
    "bloom_filter_columns" = "k2"
);
```
**テーブルのレプリケーションプロパティの設定**

```sql
CREATE TABLE example_db.table_hash
(
    k1 TINYINT,
    k2 DECIMAL(10, 2) DEFAULT "10.5"
)
DISTRIBUTED BY HASH(k1) BUCKETS 32
PROPERTIES (
    "replication_allocation"="tag.location.group_a:1, tag.location.group_b:2"
);
```
**動的パーティショニング**

このテーブルは3日前にパーティションを作成し、3日前のパーティションを削除します。例えば、今日が`2020-01-08`の場合、`p20200108`、`p20200109`、`p20200110`、`p20200111`という名前のパーティションが作成されます。パーティション範囲は以下の通りです：

```Plain
[types: [DATE]; keys: [2020-01-08]; ‥types: [DATE]; keys: [2020-01-09]; )
[types: [DATE]; keys: [2020-01-09]; ‥types: [DATE]; keys: [2020-01-10]; )
[types: [DATE]; keys: [2020-01-10]; ‥types: [DATE]; keys: [2020-01-11]; )
[types: [DATE]; keys: [2020-01-11]; ‥types: [DATE]; keys: [2020-01-12]; )
CREATE TABLE example_db.dynamic_partition
(
    k1 DATE,
    k2 INT,
    k3 SMALLINT,
    v1 VARCHAR(2048),
    v2 DATETIME DEFAULT "2014-02-04 15:36:00"
)
DUPLICATE KEY(k1, k2, k3)
PARTITION BY RANGE (k1) ()
DISTRIBUTED BY HASH(k2) BUCKETS 32
PROPERTIES(
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-3",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "32" 
);
```
**Dynamic Partitionのレプリケーションプロパティの設定**

```sql
CREATE TABLE example_db.dynamic_partition
(
    k1 DATE,
    k2 INT,
    k3 SMALLINT,
    v1 VARCHAR(2048),
    v2 DATETIME DEFAULT "2014-02-04 15:36:00"
)
PARTITION BY RANGE (k1) ()
DISTRIBUTED BY HASH(k2) BUCKETS 32
PROPERTIES(
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-3",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "32",
    "dynamic_partition.replication_allocation" = "tag.location.group_a:3"
 );
```
### CTAS の例

```sql
CREATE TABLE t10
PROPERTIES (
  'replication_num' = '1'
)
AS SELECT * FROM t1;
```
### CREATE TABLE ... LIKE の例

```sql
CREATE TABLE t11 LIKE t10;
```
