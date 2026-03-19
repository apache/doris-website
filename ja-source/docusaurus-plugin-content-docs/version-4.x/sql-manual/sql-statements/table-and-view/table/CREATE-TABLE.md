---
{
  "title": "CREATE TABLE",
  "description": "現在のデータベースまたは指定されたデータベースに新しいtableを作成します。tableは複数のカラムを持つことができ、各カラム定義には名前、データ型、",
  "language": "ja"
}
---
## 説明

現在または指定されたデータベースに新しいtableを作成します。tableは複数の列を持つことができ、各列定義には名前、データ型、およびオプションで以下の属性を含みます：

- キーかどうか
- 集約セマンティクスを持つかどうか
- 生成列かどうか
- 値が必須かどうか（NOT NULL）
- 自動インクリメント列かどうか
- 挿入時のデフォルト値があるかどうか
- 更新時のデフォルト値があるかどうか

さらに、このコマンドは以下のバリエーションもサポートしています：

- CREATE TABLE … AS SELECT（データがあらかじめ入力されたtableを作成する；CTASとも呼ばれる）
- CREATE TABLE … LIKE（既存のtableの空のコピーを作成する）

## 構文

```sql
CREATE [ TEMPORARY | EXTERNAL ] TABLE [ IF NOT EXISTS ] <table_name>
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
      [ [ GENERATED ALWAYS ] AS (<col_generate_expression>) ]
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
- その中で：

    ```sql
    <origin_partitions_definition>
    : (
        -- パーティション definition
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
## Varaint Syntax

### CREATE TABLE ... AS SELECT (CTASとも呼ばれる)

Tableを生成し、`query`から返されたデータでそれを入力します：

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
[ AS ] <query>;
```
### CREATE TABLE ... LIKE

既存のTableと同じカラム定義を持つ新しいTableを作成しますが、既存のTableからデータはコピーしません。カラムのすべてのプロパティが新しいTableに複製されます。`rollup`名のリストが指定された場合、元のTableから対応する`rollup`も複製されます：

```sql
CREATE TABLE <new_table_name> LIKE <existing_table_name>
[ WITH ROLLUP ( <rollup_list> ) ];
```
## 必須パラメータ

**<name>**

> Tableの識別子（つまり、名前）を指定します。Tableが作成されるデータベース内で一意である必要があります。
>
> 識別子は文字（Unicode名サポートが有効な場合は任意の言語文字）で始まる必要があり、識別子文字列全体がバッククォート（例：``My Object``）で囲まれていない限り、スペースや特殊文字を含むことはできません。
>
> 識別子には予約キーワードを使用できません。
>
> 詳細については、[Identifier Requirements](../../../basic-element/object-identifiers.md)および[Reserved Keywords](../../../basic-element/reserved-keywords.md)を参照してください。

**<col_name>**

> カラム識別子（つまり、名前）を指定します。作成されるTable内で一意である必要があります。
>
> 識別子は文字（Unicode名サポートが有効な場合は任意の言語文字）、数字、または記号`@`で始まる必要があり、識別子文字列全体がバッククォート（例：``My Object``）で囲まれていない限り、スペースや特殊文字を含むことはできません。
>
> 詳細については、[Identifier Requirements](../../../basic-element/object-identifiers.md)および[Reserved Keywords](../../../basic-element/reserved-keywords.md)を参照してください。

**<col_type>**

> カラムのデータ型を指定します。
>
> Tableカラムに指定できるデータ型の詳細については、[Data Types](../../../basic-element/sql-data-types/data-type-overview.md)セクションを参照してください。

**<query>**

> CTASの必須パラメータ。データを入力するSELECT文を指定します。

**<source_table>**

> CREATE TABLE ... LIKEの必須パラメータ。コピー元のTableを指定します。

## オプションパラメータ

### データモデル関連パラメータ

**<key_type>**

> Tableのデータモデル。オプション値はDUPLICATE（詳細モデル）、UNIQUE（主キーモデル）、AGGREGATE（集約モデル）です。データモデルの詳細については、[Data Model](../../../../table-design/data-model/overview.md)セクションを参照してください。

**<key_cols>**

> Tableのキーカラム。Dorisでは、キーカラムはTableの最初のK個のカラムでなければなりません。単一タブレット内のデータは、これらのカラムによって順序が保たれます。Keyの制限とキーカラムの選択方法については、[Data Model](../../../../table-design/data-model/overview.md)セクション内の各サブセクションを参照してください。

**<cluster_cols>**

> データのローカルソートカラム。データモデルがUNIQUE（主キーモデル）の場合のみ使用可能です。`<cluster_cols>`が指定された場合、データは`<key_cols>`の代わりに`<cluster_cols>`でソートされます。

**<col_aggregate_type>**

> カラムの集約方法。Tableが集約モデルの場合のみ使用可能です。集約方法の詳細については、[Aggregation Model](../../../../table-design/data-model/aggregate.md)セクションを参照してください。

### バケット関連パラメータ

**<distribute_cols>および<bucket_count>**

> バケットカラムとバケット数。詳細モデルのバケットカラムは任意のカラムが可能で、集約モデルと主キーモデルのバケットカラムはキーカラムと一致する必要があります。バケット数は任意の正の整数です。バケットの詳細については、[Manual Bucketing](../../../../table-design/data-partitioning/data-bucketing#manual-setting-bucket-count)および[Automatic Bucketing](../../../../table-design/data-partitioning/data-bucketing#automatic-setting-bucket-count)セクションを参照してください。

### カラムデフォルト値関連パラメータ

**[ GENERATED ALWAYS ] AS (<col_generate_expression>)**

> 生成カラム。現在のカラムより前のカラムを使用して、式`<col_generate_expression>`を通じて現在のカラムのデータを生成します。生成カラムは、ユーザーが直接挿入や更新を行うのではなく、他のカラムの値から計算される特殊なデータベースTableカラムの一種です。この機能は式の結果を事前に計算してデータベースに保存することをサポートし、頻繁なクエリや複雑な計算が必要なシナリオに適しています。

**AUTO_INCREMENT(<col_auto_increment_start_value>)**

> データをインポートする際、Dorisは値が指定されていない自動増分カラムのデータ行に対して、Table内で一意の値を割り当てます。`<col_auto_increment_start_value>`は自動増分カラムの開始値を指定します。自動増分カラムの詳細については、[Auto-Increment Columns](../../../../table-design/auto-increment.md)セクションを参照してください。

**DEFAULT <col_default_value>**

> カラムのデフォルト値。このカラムを含めずに書き込む場合、このデフォルト値が使用されます。デフォルト値が明示的に設定されていない場合、NULLが使用されます。利用可能なデフォルト値には以下があります：
>
> - NULL：すべての型で利用可能、NULLをデフォルト値として使用。
> - 数値リテラル：数値型でのみ使用可能。
> - 文字列リテラル：文字列型でのみ使用可能。
> - CURRENT_DATE：日付型でのみ使用可能。現在の日付をデフォルト値として使用。
> - CURRENT_TIMESTAMP [ <defaultValuePrecision> ]：日時型でのみ使用可能。現在のタイムスタンプをデフォルト値として使用。`<defaultValuePrecision>`で時間精度を指定可能。
> - PI：double型でのみ使用可能。円周率をデフォルト値として使用。
> - E：double型でのみ使用可能。数学定数eをデフォルト値として使用。
> - BITMAP_EMPTY：カラムがbitmap型の場合のみ使用可能。空のbitmapを埋め込み。

**ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>)**

> データが更新された際、このカラムに値が指定されていない場合、現在のタイムスタンプを使用してこのカラムのデータを更新します。UNIQUE（主キーモデル）のTableでのみ使用可能です。

### インデックス関連パラメータ

**<index_name>**

> インデックス識別子（つまり、名前）を指定します。作成されるTable内で一意である必要があります。識別子の詳細については、[Identifier Requirements](../../../basic-element/object-identifiers.md)および[Reserved Keywords](../../../basic-element/reserved-keywords.md)を参照してください。

**<index_cols>**

> インデックスを追加するカラムのリスト。Table内の既存のカラムである必要があります。

**<index_type>**

> インデックスの種類。現在、INVERTEDのみがサポートされています。

**<index_property>**

> インデックスのプロパティ。詳細な説明については、[Inverted Index](../../../../table-design/index/inverted-index.md)セクションを参照してください。

### 自動パーティション関連パラメータ

パーティションの詳細な紹介については、[Automatic Partitioning](../../../../table-design/data-partitioning/auto-partitioning.md)セクションを参照してください。

### 手動パーティション関連パラメータ

パーティションの詳細な紹介については、「Manual Partitioning」セクションを参照してください。

**<partition_type>**

> DorisはRANGEパーティションとLISTパーティションをサポートしています。詳細については、[Manual Partitioning](../../../../table-design/data-partitioning/manual-partitioning.md)セクションを参照してください。

**<partition_name>**

> パーティション識別子（つまり、名前）。作成されるTable内で一意である必要があります。識別子の詳細については、[Identifier Requirements](../../../basic-element/object-identifiers.md)および[Reserved Keywords](../../../basic-element/reserved-keywords.md)を参照してください。

**VALUES LESS THAN <partition_value_list>**

> RANGEパーティション。パーティションデータ範囲は下限から`<partition_value_list>`までです。
>
> 上限を表す場合、`<partition_value_list>`は`MAX_VALUE`に簡素化できます。
>
> `<partition_value_list>`の形式は次のとおりです：`((col_1_value, ...), (col_1_value, ...), ...)`

**VALUES [ <partition_lower_bound>, <partition_upper_bound>)**

> RANGEパーティション。パーティションデータ範囲は`<partition_lower_bound>`から`<partition_upper_bound>`までです。1つのパーティションのみが作成されます。
>
> `<partition_lower_bound>`と`<partition_upper_bound>`の形式は次のとおりです：`(col_1_value, ...)`

**FROM <partition_lower_bound> TO <partition_upper_bound>**

**INTERVAL <n> [ <datetime_unit> ]**

> RANGEパーティション。パーティションデータ範囲は`<partition_lower_bound>`から`<partition_value_list>`までです。`<n>`ごとにパーティションが作成されます。
>
> `<partition_lower_bound>`と`<partition_upper_bound>`の形式は次のとおりです：`(col_1_value, ...)`

**VALUES IN {**

​          **(<partition_value> [, <partition_value> [ ... ] ])**

​          **| <partition_value>**

​      **}**

> LISTパーティション。パーティションカラムが`<partition_value>`と等しい行がこのパーティションに属します。
>
> `<partition_value>`の形式は次のとおりです：`(col_1_value, ...)`


### 同期マテリアライズドビュー関連

:::caution 注意
rollupによる同期マテリアライズドビューの作成機能は制限があり、もはや推奨されません。別の文を使用して同期マテリアライズドビューを作成することをお勧めします。詳細については、[CREATE MATERIALIZED VIEW](../sync-materialized-view/CREATE-MATERIALIZED-VIEW.md)文および[Synchronized Materialized View](../../../../query-acceleration/materialized-view/sync-materialized-view.md)セクションを参照してください。
:::

**<rollup_name>**

> 同期マテリアライズドビューの識別子（つまり、名前）。作成されるTable内で一意である必要があります。識別子の詳細については、[Identifier Requirements](../../../basic-element/object-identifiers.md)および[Reserved Keywords](../../../basic-element/reserved-keywords.md)を参照してください。

**<rollup_cols>**

> 同期マテリアライズドビューに含まれるカラム。

### Tableプロパティ関連パラメータ

**<table_property>**

| プロパティ名 | 機能 |
| :------------ | :-------- |
| replication_num | レプリカ数。デフォルトのレプリカ数は3です。BEノード数が3未満の場合、BEノード数以下のレプリカ数を指定する必要があります。バージョン0.15以降、このプロパティは自動的に`replication_allocation`プロパティに変換されます。例：`"replication_num" = "3"`は自動的に`"replication_allocation" = "tag.location.default:3"`に変換されます。 |
| replication_allocation | Tagに基づいてレプリカの分散を設定します。このプロパティは`replication_num`プロパティの機能を完全に上書きできます。 |
| min_load_replica_num | データインポートを成功させるために必要な最小レプリカ数を設定します。デフォルト値は-1です。このプロパティが0以下の場合、データインポートには依然として過半数のレプリカが成功する必要があることを示します。 |
| is_being_synced | このTableがCCRによって複製され、現在syncerによって同期されているかどうかを識別するために使用され、デフォルト値は`false`です。`true`に設定すると、`colocate_with`と`storage_policy`プロパティがクリアされます。`dynamic partition`と`auto bucket`機能は無効になります。つまり、`show create table`では有効に見えますが、実際には効果がありません。`is_being_synced`が`false`に設定されると、これらの機能が再開されます。このプロパティはCCR周辺モジュールでのみ使用し、CCR同期プロセス中に手動で設定しないでください。 |
| storage_medium | Tableデータの初期ストレージメディアを宣言します。 |
| storage_cooldown_time | Tableデータの初期ストレージメディアの有効期限を設定します。この時間を過ぎると、自動的に第一級ストレージメディアにダウングレードされます。 |
| colocate_with | Colocation Join機能が必要な場合、このパラメータを使用してColocation Groupを設定します。 |
| bloom_filter_columns | ユーザーが指定したBloom Filterインデックスの追加が必要なカラム名のリスト。各カラムのBloom Filterインデックスは独立しており、複合インデックスではありません。例：`"bloom_filter_columns" = "k1, k2, k3"` |
| compression | DorisTableのデフォルト圧縮方法はLZ4です。バージョン1.1以降、より高い圧縮率のためにZSTDを圧縮方法として指定することがサポートされています。 |
| function_column.sequence_col | Unique Keyモデルを使用する場合、Sequenceカラムを指定できます。Keyカラムが同じ場合、Sequenceカラムに従ってREPLACEが実行されます（大きい値が小さい値を置き換えます。そうでなければ置き換えできません）。`function_column.sequence_col`は、sequenceカラムをTable内の特定のカラムにマッピングするために使用され、整数または日付/時刻型（DATE、DATETIME）が可能です。このカラムの型は作成後に変更できません。`function_column.sequence_col`が設定されている場合、`function_column.sequence_type`は無視されます。 |
| function_column.sequence_type | Unique Keyモデルを使用する場合、Sequenceカラムを指定できます。Keyカラムが同じ場合、Sequenceカラムに従ってREPLACEが実行されます（大きい値が小さい値を置き換えます。そうでなければ置き換えできません）。ここでは、sequenceカラムの型のみを指定する必要があり、日付/時刻型または整数をサポートします。Dorisは隠れたsequenceカラムを作成します。 |
| enable_unique_key_merge_on_write | UniqueTableがMerge-on-Write実装を使用するかどうか。このプロパティはバージョン2.1より前ではデフォルトで無効、バージョン2.1以降ではデフォルトで有効です。 |
| light_schema_change | Light Schema Change最適化を使用するかどうか。`true`に設定すると、valueカラムの追加および削除操作をより高速かつ同期的に完了できます。この機能はバージョン2.0.0以降でデフォルトで有効です。 |
| disable_auto_compaction | このTableの自動compactionを無効にするかどうか。このプロパティが`true`に設定されている場合、バックグラウンド自動compactionプロセスはこのTableのすべてのタブレットをスキップします。 |
| enable_single_replica_compaction | このTableの単一レプリカcompactionを有効にするかどうか。このプロパティが`true`に設定されている場合、Tableのタブレットのすべてのレプリカのうち1つのレプリカのみが実際のcompactionアクションを実行し、他のレプリカはそのレプリカからcompactionされたrowsetを取得します。 |
| enable_duplicate_without_keys_by_default | `true`に設定すると、Table作成時にUnique、Aggregate、またはDuplicateが指定されていない場合、デフォルトでソートカラムとプレフィックスインデックスのないDuplicateモデルTableが作成されます。 |
| skip_write_index_on_load | このTableのデータインポート時にインデックスの書き込みをスキップするかどうか。このプロパティが`true`に設定されている場合、データインポート時にインデックスは書き込まれず（現在は転置インデックスのみ有効）、compactionまで遅延されます。これにより、最初の書き込みとcompaction時のインデックスの重複書き込みによるCPUとIOリソース消費を回避し、高スループットインポートのパフォーマンスを向上させることができます。 |
| compaction_policy | このTableのcompactionマージポリシーを設定します。time_seriesまたはsize_basedtime_seriesのみをサポートします：rowsetのディスクボリュームが一定のサイズに累積すると、バージョンマージが実行されます。マージされたrowsetは直接base compactionフェーズに昇格します。これにより、継続的なインポートシナリオでcompactの書き込み増幅を効果的に削減します。このポリシーはtime_series_compactionで始まるパラメータを使用してcompactionの実行を調整します。 |
| time_series_compaction_goal_size_mbytes | compactionマージポリシーがtime_seriesの場合、このパラメータは各compactionの入力ファイルサイズを調整するために使用され、出力ファイルサイズは入力と同等です。 |
| time_series_compaction_file_count_threshold | compactionマージポリシーがtime_seriesの場合、このパラメータは各compactionの最小入力ファイル数を調整するために使用されます。タブレット内のファイル数がこの設定を超えると、compactionがトリガーされます。 |
| time_series_compaction_time_threshold_seconds | compactionマージポリシーがtime_seriesの場合、このパラメータはcompaction間の最長間隔を調整するために使用されます。つまり、長時間実行されていない場合にcompactionがトリガーされます。単位は秒です。 |
| time_series_compaction_level_threshold | compactionマージポリシーがtime_seriesの場合、このパラメータはデフォルトで1です。2に設定すると、一度マージされたセグメントを再度マージして、セグメントサイズがtime_series_compaction_goal_size_mbytesに達することを制御し、セグメント数を削減する効果を実現するために使用されます。 |
| group_commit_interval_ms | このTableのGroup Commitバッチ間隔を設定します。単位はmsで、デフォルト値は10000ms、つまり10sです。Group Commitのタイミングは、`group_commit_interval_ms`と`group_commit_data_bytes`のどちらが先に設定値に達するかに依存します。 |
| group_commit_data_bytes | このTableのGroup Commitバッチデータサイズを設定します。単位はバイトで、デフォルト値は134217728、つまり128MBです。Group Commitのタイミングは、`group_commit_interval_ms`と`group_commit_data_bytes`のどちらが先に設定値に達するかに依存します。 |
| enable_mow_light_delete | MowのUniqueTableでDelete文によるDelete述語の書き込みを有効にするかどうか。有効にすると、Delete文のパフォーマンスが向上しますが、Delete後の部分カラム更新により一部のデータエラーが発生する可能性があります。無効にすると、Delete文のパフォーマンスは低下しますが正確性が保証されます。このプロパティのデフォルト値は`false`です。このプロパティはUnique Merge-on-WriteTableでのみ有効にできます。 |
| 動的パーティション関連プロパティ | 動的パーティションについては、[Data Partitioning - Dynamic Partitioning](../../../../table-design/data-partitioning/dynamic-partitioning)を参照してください |
| enable_unique_key_skip_bitmap_column | Unique Merge-on-WriteTableで[Flexible Column Update機能](../../../../data-operate/update/update-of-unique-model.md#flexible-partial-column-updates)を有効にするかどうか。このプロパティはUnique Merge-on-WriteTableでのみ有効にできます。 |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 説明 |
| :---------------- | :------------------------ | :----------------------------------------------------------- |
| CREATE_PRIV | Database | |
| SELECT_PRIV | Table, View | CTASを実行する際、クエリ対象のTable、ビュー、またはマテリアライズドビューに対するSELECT_PRIVが必要 |

## 使用上の注意

- データベース（Database）には、同じ名前のTable（Table）またはビュー（View）を含めることはできません。
- Table名、カラム名、rollup名は[Reserved Keywords](../../../basic-element/reserved-keywords.md)を使用してはいけません。
- CREATE TABLE ... LIKE：
  - このコマンドは内部DorisTableでのみ使用できます。
  - 明示的に指定されたrollupのみがコピーされます。
  - すべての同期マテリアライズドビューは複製されません。
- CREATE TABLE ... AS SELECT (CTAS)：
  - SELECTリスト内のカラム名のエイリアスが有効なカラムである場合、CTAS文ではカラム定義は不要です。省略された場合、カラム名とデータ型はベースクエリから推論されます：

    ```sql
    CREATE TABLE <table_name> AS SELECT ...
    ```
- または、以下の構文を使用して明示的に名前を指定することもできます：

    ```sql
    CREATE TABLE <table_name> ( <col1_name>, <col2_name>, ... ) AS SELECT ...
    ```
- パーティショニングとバケッティング
  - Tableはバケッティングカラムを指定する必要がありますが、パーティションの指定は省略することができます。パーティショニングとバケッティングの詳細については、[Data Partitioning](../../../../table-design/data-partitioning/data-bucketing.md) のドキュメントを参照してください。
  - DorisのTableは、パーティション化されたTableまたは非パーティション化Tableのいずれかです。この属性はTable作成時に決定され、後から変更することはできません。つまり、パーティション化されたTableでは、後の使用でパーティションを追加または削除することができますが、非パーティション化Tableでは後からパーティションを追加することはできません。
  - パーティションカラムとバケットカラムは、Table作成後に変更することはできません。パーティションカラムとバケットカラムの型を変更することも、これらのカラムを追加または削除することもできません。
- 動的パーティショニング
  - 動的パーティショニング機能は、主にユーザーがパーティションを自動的に管理するために使用されます。特定のルールを設定することで、Dorisシステムは定期的に新しいパーティションを追加したり、古いパーティションを削除したりします。詳細については、[Dynamic Partitioning](../../../../table-design/data-partitioning/dynamic-partitioning.md) のドキュメントを参照してください。
- 自動パーティショニング
  - 自動パーティショニングのドキュメントは [Automatic Partitioning](../../../../table-design/data-partitioning/auto-partitioning.md) にあります。
- 同期マテリアライズドビュー
  - ユーザーはTable作成時に複数の同期マテリアライズドビュー（ROLLUP）を作成することができます。同期マテリアライズドビューは、Table作成後にも追加することができます。Table作成文に含めることで、すべての同期マテリアライズドビューを一度に作成することが容易になります。
  - Table作成時に同期マテリアライズドビューを作成した場合、その後のすべてのデータインポート操作で、マテリアライズドビューのデータが同期的に生成されます。マテリアライズドビューの数は、データインポートの効率に影響を与える可能性があります。
  - マテリアライズドビューの紹介については、[Synchronized Materialized Views](../../../../query-acceleration/materialized-view/sync-materialized-view.md) のドキュメントを参照してください。
- インデックス
  - ユーザーはTable作成時に複数のカラムインデックスを作成することができます。インデックスは、Table作成後にも追加することができます。
  - 後の使用でインデックスを追加し、Tableに既存のデータがある場合、すべてのデータを書き直す必要があります。そのため、インデックス作成にかかる時間は、現在のデータ量に依存します。

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
**Aggregation Model**

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
**生成列の使用**

```sql
CREATE TABLE t4
(
  c1 INT,
  c2 INT GENERATED ALWAYS AS (c1 + 1)
)
DUPLICATE KEY(c1)
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
**Bucketing Method**

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
**Range Partitioning**

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
**`storage_policy`プロパティを使用したTableのコールド・ホット階層データ移行戦略の設定**

1. Tableが移行戦略と正常に関連付けられるように、最初にs3リソースとストレージポリシーを作成する必要があります。

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
**Colocation Group**

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
**Index**

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
**Tableのレプリケーションプロパティの設定**

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
**Dynamic Partitioning**

このTableは3日前にパーティションを作成し、3日前のパーティションを削除します。例えば、今日が`2020-01-08`の場合、`p20200108`、`p20200109`、`p20200110`、`p20200111`という名前のパーティションが作成されます。パーティション範囲は以下の通りです：

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
### CTAS Example

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
