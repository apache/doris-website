---
{
  "title": "CREATE TABLE",
  "language": "ja",
  "toc_min_heading_level": 2,
  "toc_max_heading_level": 4,
  "description": "現在のデータベースまたは指定されたデータベースに新しいテーブルを作成します。テーブルは複数の列を持つことができ、各列の定義には名前、データ型が含まれます。"
}
---
## 説明

現在のデータベースまたは指定されたデータベースに新しいテーブルを作成します。テーブルは複数の列を持つことができ、各列定義には名前、データ型、およびオプションで以下の属性を含めることができます：

- キーかどうか
- 集約セマンティクスを持つかどうか
- 生成列かどうか
- 値が必須かどうか（NOT NULL）
- 自動増分列かどうか
- 挿入時にデフォルト値があるかどうか
- 更新時にデフォルト値があるかどうか

さらに、このコマンドは以下のバリエーションもサポートしています：

- CREATE TABLE … AS SELECT（データが事前に格納されたテーブルを作成する；CTASとしても知られている）
- CREATE TABLE … LIKE（既存のテーブルの空のコピーを作成する）

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
## Varaint 構文

### CREATE TABLE ... AS SELECT (CTAS とも呼ばれる)

テーブルを生成し、`query` から返されたデータでそれを入力します：

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

既存のテーブルと同じカラム定義を持つ新しいテーブルを作成しますが、既存のテーブルからデータはコピーしません。カラムのすべてのプロパティが新しいテーブルで複製されます。`rollup`名のリストが指定されている場合、元のテーブルから対応する`rollup`も複製されます：

```sql
CREATE TABLE <new_table_name> LIKE <existing_table_name>
[ WITH ROLLUP ( <rollup_list> ) ];
```
## 必須パラメータ

**<name>**

> テーブルの識別子（名前）を指定します。テーブルが作成されるデータベース内で一意である必要があります。
>
> 識別子は文字（Unicode名前サポートが有効な場合は任意の言語文字）で始まる必要があり、識別子文字列全体がバッククォートで囲まれていない限り（例：``My Object``）、スペースや特殊文字を含むことはできません。
>
> 識別子には予約キーワードを使用できません。
>
> 詳細については、[Identifier Requirements](../../../basic-element/object-identifiers.md)および[Reserved Keywords](../../../basic-element/reserved-keywords.md)を参照してください。

**<col_name>**

> 列の識別子（名前）を指定します。作成されるテーブル内で一意である必要があります。
>
> 識別子は文字（Unicode名前サポートが有効な場合は任意の言語文字）、数字、または記号`@`で始まる必要があり、識別子文字列全体がバッククォートで囲まれていない限り（例：``My Object``）、スペースや特殊文字を含むことはできません。
>
> 詳細については、[Identifier Requirements](../../../basic-element/object-identifiers.md)および[Reserved Keywords](../../../basic-element/reserved-keywords.md)を参照してください。

**<col_type>**

> 列のデータ型を指定します。
>
> テーブル列に指定できるデータ型の詳細については、[Data Types](../../../basic-element/sql-data-types/data-type-overview.md)セクションを参照してください。

**<query>**

> CTASの必須パラメータ。データを投入するSELECT文を指定します。

**<source_table>**

> CREATE TABLE ... LIKEの必須パラメータ。コピーする元のテーブルを指定します。

## オプションパラメータ

### データモデル関連パラメータ

**<key_type>**

> テーブルのデータモデル。DUPLICATE（詳細モデル）、UNIQUE（主キーモデル）、AGGREGATE（集約モデル）を選択できます。データモデルの詳細については、[Data Model](../../../../table-design/data-model/overview.md)セクションを参照してください。

**<key_cols>**

> テーブルのキー列。Dorisでは、Key列はテーブルの最初のK列である必要があります。単一tablet内のデータは、これらの列によって順序付けられます。Keyの制限とKey列の選択方法については、[Data Model](../../../../table-design/data-model/overview.md)セクションの各サブセクションを参照してください。

**<cluster_cols>**

> データローカルソート列。データモデルがUNIQUE（主キーモデル）の場合のみ使用できます。`<cluster_cols>`が指定された場合、データは`<key_cols>`ではなく`<cluster_cols>`でソートされます。

**<col_aggregate_type>**

> 列の集約方法。テーブルが集約モデルの場合のみ使用できます。集約方法の詳細については、[Aggregation Model](../../../../table-design/data-model/aggregate.md)セクションを参照してください。

### バケッティング関連パラメータ

**<distribute_cols> and <bucket_count>**

> バケッティング列とバケット数。詳細モデルのバケット列は任意の列にできますが、集約モデルと主キーモデルのバケット列はキー列と一致している必要があります。バケット数は任意の正の整数です。バケッティングの詳細については、[Manual Bucketing](../../../../table-design/data-partitioning/data-bucketing#manual-setting-bucket-count)および[Automatic Bucketing](../../../../table-design/data-partitioning/data-bucketing#automatic-setting-bucket-count)セクションを参照してください。

### 列のデフォルト値関連パラメータ

**[ GENERATED ALWAYS ] AS (<col_generate_expression>)**

> 生成列。現在の列より前の列を使用して、式`<col_generate_expression>`を通じて現在の列のデータを生成します。生成列は、ユーザーによって直接挿入または更新されるのではなく、他の列の値から計算される特殊なタイプのデータベーステーブル列です。この機能は式の結果を事前計算してデータベースに格納することをサポートし、頻繁なクエリや複雑な計算を必要とするシナリオに適しています。

**AUTO_INCREMENT(<col_auto_increment_start_value>)**

> データをインポートする際、Dorisは値を指定しない自動増分列のデータ行に対してテーブル内で一意の値を割り当てます。`<col_auto_increment_start_value>`は自動増分列の開始値を指定します。自動増分列の詳細については、[Auto-Increment Columns](../../../../table-design/auto-increment.md)セクションを参照してください。

**DEFAULT <col_default_value>**

> 列のデフォルト値。この列を含めずに書き込む場合、このデフォルト値が使用されます。デフォルト値が明示的に設定されていない場合、NULLが使用されます。使用可能なデフォルト値には以下があります：
>
> - NULL: すべてのタイプで使用可能で、NULLをデフォルト値として使用します。
> - 数値リテラル: 数値タイプでのみ使用できます。
> - 文字列リテラル: 文字列タイプでのみ使用できます。
> - CURRENT_DATE: 日付タイプでのみ使用できます。現在の日付をデフォルト値として使用します。
> - CURRENT_TIMESTAMP [ <defaultValuePrecision> ]: datetime型でのみ使用できます。現在のタイムスタンプをデフォルト値として使用します。`<defaultValuePrecision>`で時間精度を指定できます。
> - PI: double型でのみ使用できます。円周率をデフォルト値として使用します。
> - E: double型でのみ使用できます。数学定数eをデフォルト値として使用します。
> - BITMAP_EMPTY: 列がbitmap型の場合のみ使用できます。空のbitmapを埋めます。

**ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>)**

> データが更新される際、この列に値が指定されない場合、現在のタイムスタンプを使用してこの列のデータを更新します。UNIQUE（主キーモデル）のテーブルでのみ使用できます。

### インデックス関連パラメータ

**<index_name>**

> インデックスの識別子（名前）を指定します。作成されるテーブル内で一意である必要があります。識別子の詳細については、[Identifier Requirements](../../../basic-element/object-identifiers.md)および[Reserved Keywords](../../../basic-element/reserved-keywords.md)を参照してください。

**<index_cols>**

> インデックスを追加する列のリスト。テーブル内の既存の列である必要があります。

**<index_type>**

> インデックスのタイプ。現在、INVERTEDのみサポートされています。

**<index_property>**

> インデックスのプロパティ。詳細な説明については、[Inverted Index](../../../../table-design/index/inverted-index/overview.md)セクションを参照してください。

### 自動パーティション関連パラメータ

パーティショニングの詳細な説明については、[Automatic Partitioning](../../../../table-design/data-partitioning/auto-partitioning.md)セクションを参照してください。

### 手動パーティション関連パラメータ

パーティショニングの詳細な説明については、「Manual Partitioning」セクションを参照してください。

**<partition_type>**

> DorisはRANGEパーティショニングとLISTパーティショニングをサポートします。詳細については、[Manual Partitioning](../../../../table-design/data-partitioning/manual-partitioning.md)セクションを参照してください。

**<partition_name>**

> パーティションの識別子（名前）。作成されるテーブル内で一意である必要があります。識別子の詳細については、[Identifier Requirements](../../../basic-element/object-identifiers.md)および[Reserved Keywords](../../../basic-element/reserved-keywords.md)を参照してください。

**VALUES LESS THAN <partition_value_list>**

> RANGEパーティショニング。パーティションデータ範囲は下限から`<partition_value_list>`までです。
>
> 上限を表す場合、`<partition_value_list>`は`MAX_VALUE`に簡略化できます。
>
> `<partition_value_list>`の形式は次のとおりです：`((col_1_value, ...), (col_1_value, ...), ...)`

**VALUES [ <partition_lower_bound>, <partition_upper_bound>)**

> RANGEパーティショニング。パーティションデータ範囲は`<partition_lower_bound>`から`<partition_upper_bound>`までです。パーティションは1つのみ作成されます。
>
> `<partition_lower_bound>`と`<partition_upper_bound>`の形式は次のとおりです：`(col_1_value, ...)`

**FROM <partition_lower_bound> TO <partition_upper_bound>**

**INTERVAL <n> [ <datetime_unit> ]**

> RANGEパーティショニング。パーティションデータ範囲は`<partition_lower_bound>`から`<partition_value_list>`までです。`<n>`ごとにパーティションが作成されます。
>
> `<partition_lower_bound>`と`<partition_upper_bound>`の形式は次のとおりです：`(col_1_value, ...)`

**VALUES IN {**

​          **(<partition_value> [, <partition_value> [ ... ] ])**

​          **| <partition_value>**

​      **}**

> LISTパーティショニング。パーティション列が`<partition_value>`と等しい行がこのパーティションに属します。
>
> `<partition_value>`の形式は次のとおりです：`(col_1_value, ...)`

### 同期マテリアライズドビュー関連

:::caution 注意
rollupによる同期マテリアライズドビューの作成機能は制限があり、推奨されなくなりました。別の文を使用して同期マテリアライズドビューを作成することを推奨します。詳細については、[CREATE MATERIALIZED VIEW](../sync-materialized-view/CREATE-MATERIALIZED-VIEW.md)文および[Synchronized Materialized View](../../../../query-acceleration/materialized-view/sync-materialized-view.md)セクションを参照してください。
:::

**<rollup_name>**

> 同期マテリアライズドビューの識別子（名前）。作成されるテーブル内で一意である必要があります。識別子の詳細については、[Identifier Requirements](../../../basic-element/object-identifiers.md)および[Reserved Keywords](../../../basic-element/reserved-keywords.md)を参照してください。

**<rollup_cols>**

> 同期マテリアライズドビューに含まれる列。

### テーブルプロパティ関連パラメータ

**<table_property>**

| プロパティ名 | 機能 |
| :------------ | :-------- |
| replication_num | レプリカ数。デフォルトのレプリカ数は3です。BEノード数が3未満の場合、BEノード数以下のレプリカ数を指定する必要があります。バージョン0.15以降、このプロパティは自動的に`replication_allocation`プロパティに変換されます。例：`"replication_num" = "3"`は自動的に`"replication_allocation" = "tag.location.default:3"`に変換されます。 |
| replication_allocation | Tagに基づいてレプリカの分散を設定します。このプロパティは`replication_num`プロパティの機能を完全に上書きできます。 |
| min_load_replica_num | データインポートが成功するために必要な最小レプリカ数を設定します。デフォルト値は-1です。このプロパティが0以下の場合、データインポートには過半数のレプリカが成功する必要があることを示します。 |
| is_being_synced | このテーブルがCCRによって複製され、現在syncerによって同期されているかを識別するために使用されます。デフォルト値は`false`です。`true`に設定すると、`colocate_with`および`storage_policy`プロパティがクリアされます。`dynamic partition`および`auto bucket`機能は無効になります。つまり、`show create table`では有効に見えますが、実際には有効になりません。`is_being_synced`が`false`に設定されると、これらの機能が再開されます。このプロパティはCCR周辺モジュール専用であり、CCR同期プロセス中に手動で設定しないでください。 |
| storage_medium | テーブルデータの初期ストレージメディアを宣言します。 |
| storage_cooldown_time | テーブルデータの初期ストレージメディアの有効期限を設定します。この時間後、自動的に第一レベルストレージメディアにダウングレードされます。 |
| colocate_with | Colocation Join機能が必要な場合、このパラメータを使用してColocation Groupを設定します。 |
| bloom_filter_columns | ユーザーが指定したBloom Filterインデックスの追加が必要な列名のリスト。各列のBloom Filterインデックスは独立しており、複合インデックスではありません。例：`"bloom_filter_columns" = "k1, k2, k3"` |
| compression | Dorisテーブルのデフォルト圧縮方法はLZ4です。バージョン1.1以降、より高い圧縮率のためにZSTDを圧縮方法として指定することがサポートされています。 |
| function_column.sequence_col | Unique Keyモデルを使用する場合、Sequence列を指定できます。Key列が同じ場合、Sequence列に従ってREPLACEが実行されます（大きい値が小さい値を置き換えます。そうでなければ置き換えられません）。`function_column.sequence_col`は、sequence列をテーブル内の特定の列にマップするために使用され、整数または日付/時刻タイプ（DATE、DATETIME）にできます。この列のタイプは作成後に変更できません。`function_column.sequence_col`が設定されている場合、`function_column.sequence_type`は無視されます。 |
| function_column.sequence_type | Unique Keyモデルを使用する場合、Sequence列を指定できます。Key列が同じ場合、Sequence列に従ってREPLACEが実行されます（大きい値が小さい値を置き換えます。そうでなければ置き換えられません）。ここでは、sequence列のタイプのみを指定する必要があり、日付/時刻タイプまたは整数をサポートします。Dorisは隠しsequence列を作成します。 |
| enable_unique_key_merge_on_write | UniqueテーブルがMerge-on-Write実装を使用するかどうか。このプロパティはバージョン2.1より前ではデフォルトで無効、バージョン2.1以降ではデフォルトで有効です。 |
| light_schema_change | Light Schema Change最適化を使用するかどうか。`true`に設定すると、value列の加算および減算操作をより高速かつ同期的に完了できます。この機能はバージョン2.0.0以降でデフォルトで有効です。 |
| disable_auto_compaction | このテーブルの自動コンパクションを無効にするかどうか。このプロパティが`true`に設定されている場合、バックグラウンド自動コンパクションプロセスはこのテーブルのすべてのtabletをスキップします。 |
| enable_single_replica_compaction | このテーブルのシングルレプリカコンパクションを有効にするかどうか。このプロパティが`true`に設定されている場合、テーブルのtabletのすべてのレプリカのうち1つのレプリカのみが実際のコンパクションアクションを実行し、他のレプリカはそのレプリカからコンパクションされたrowsetをプルします。 |
| enable_duplicate_without_keys_by_default | `true`に設定すると、テーブル作成時にUnique、Aggregate、またはDuplicateが指定されていない場合、ソート列とプレフィックスインデックスのないDuplicateモデルテーブルがデフォルトで作成されます。 |
| skip_write_index_on_load | このテーブルのデータインポート時にインデックスを書き込まないことを有効にするかどうか。このプロパティが`true`に設定されている場合、データインポート時にインデックスが書き込まれず（現在逆転インデックスに対してのみ有効）、コンパクション時まで遅延されます。これにより、初回書き込みとコンパクション時にインデックスを繰り返し書き込むCPUとIOリソース消費を避け、高スループットインポートのパフォーマンスを向上させることができます。 |
| compaction_policy | このテーブルのコンパクションマージポリシーを設定します。time_seriesまたはsize_basedtime_seriesのみサポートします：rowsetのディスクボリュームが一定のサイズに蓄積されるとバージョンマージが実行されます。マージされたrowsetは直接base compactionフェーズに昇格されます。これにより、継続的なインポートシナリオでのcompactの書き込み増幅を効果的に削減します。このポリシーはtime_series_compactionプレフィックスのパラメータを使用してcompactionの実行を調整します。 |
| time_series_compaction_goal_size_mbytes | コンパクションマージポリシーがtime_seriesの場合、このパラメータは各コンパクションの入力ファイルサイズを調整するために使用され、出力ファイルサイズは入力と同程度になります。 |
| time_series_compaction_file_count_threshold | コンパクションマージポリシーがtime_seriesの場合、このパラメータは各コンパクションの最小入力ファイル数を調整するために使用されます。tablet内のファイル数がこの設定を超えると、コンパクションがトリガーされます。 |
| time_series_compaction_time_threshold_seconds | コンパクションマージポリシーがtime_seriesの場合、このパラメータはコンパクション間の最長間隔を調整するために使用されます。つまり、長時間実行されていない場合にコンパクションがトリガーされます。単位は秒です。 |
| time_series_compaction_level_threshold | コンパクションマージポリシーがtime_seriesの場合、このパラメータはデフォルトで1です。2に設定すると、一度マージされたセグメントを再度マージしてセグメントサイズがtime_series_compaction_goal_size_mbytesに達するようにし、セグメント数を削減する効果を実現するために使用されます。 |
| group_commit_interval_ms | このテーブルのGroup Commitバッチ間隔を設定します。単位はmsで、デフォルト値は10000ms、つまり10秒です。Group Commitのタイミングは`group_commit_interval_ms`と`group_commit_data_bytes`のうちどちらが先に設定値に達するかに依存します。 |
| group_commit_data_bytes | このテーブルのGroup Commitバッチデータサイズを設定します。単位はbytesで、デフォルト値は134217728、つまり128MBです。Group Commitのタイミングは`group_commit_interval_ms`と`group_commit_data_bytes`のうちどちらが先に設定値に達するかに依存します。 |
| enable_mow_light_delete | MowのUniqueテーブルでDelete文によるDelete predicateの書き込みを有効にするかどうか。有効にするとDelete文のパフォーマンスが向上しますが、Delete後の部分列更新でデータエラーが発生する可能性があります。無効にするとDelete文のパフォーマンスが低下しますが、正確性が保証されます。このプロパティのデフォルト値は`false`です。このプロパティはUnique Merge-on-Writeテーブルでのみ有効にできます。 |
| 動的パーティショニング関連プロパティ | 動的パーティショニングについては、[Data Partitioning - Dynamic Partitioning](../../../../table-design/data-partitioning/dynamic-partitioning)を参照してください |
| enable_unique_key_skip_bitmap_column | Unique Merge-on-Writeテーブルで[柔軟な列更新機能](../../../../data-operate/update/update-of-unique-model.md#flexible-partial-column-updates)を有効にするかどうか。このプロパティはUnique Merge-on-Writeテーブルでのみ有効にできます。 |

## アクセス制御要件

このSQLコマンドを実行する[ユーザー](../../../../admin-manual/auth/authentication-and-authorization.md)は、少なくとも以下の[権限](../../../../admin-manual/auth/authentication-and-authorization.md)を持つ必要があります：

| 権限 | オブジェクト | 説明 |
| :---------------- | :------------------------ | :----------------------------------------------------------- |
| CREATE_PRIV | Database | |
| SELECT_PRIV | Table、View | CTASを実行する際、クエリされるテーブル、ビュー、またはマテリアライズドビューに対してSELECT_PRIVが必要 |

## 使用上の注意

- データベース（Database）には同じ名前のテーブル（Table）やビュー（View）を含めることはできません。
- テーブル名、列名、rollup名には[Reserved Keywords](../../../basic-element/reserved-keywords.md)を使用できません。
- CREATE TABLE ... LIKE：
  - このコマンドは内部Dorisテーブルでのみ使用できます。
  - 明示的に指定されたrollupのみがコピーされます。
  - すべての同期マテリアライズドビューは複製されません。
- CREATE TABLE ... AS SELECT (CTAS)：
  - SELECTリストの列名のエイリアスが有効な列である場合、CTAS文で列定義は不要です。省略した場合、列名とデータ型はベースクエリから推測されます：

    ```sql
    CREATE TABLE <table_name> AS SELECT ...
    ```
- または、以下の構文を使用して明示的に名前を指定することができます：

    ```sql
    CREATE TABLE <table_name> ( <col1_name>, <col2_name>, ... ) AS SELECT ...
    ```
- パーティショニングとバケッティング
  - テーブルはバケッティングカラムを指定する必要がありますが、パーティションの指定は省略することができます。パーティショニングとバケッティングの詳細情報については、[Data Partitioning](../../../../table-design/data-partitioning/data-bucketing.md)ドキュメントを参照してください。
  - Dorisのテーブルは、パーティション化されているかパーティション化されていないかのいずれかです。この属性はテーブル作成時に決定され、後で変更することはできません。つまり、パーティション化されたテーブルの場合、後の使用でパーティションを追加または削除することができますが、パーティション化されていないテーブルには後でパーティションを追加することはできません。
  - パーティションおよびバケットカラムは、テーブル作成後に変更することはできません。パーティションおよびバケットカラムのタイプを変更することも、これらのカラムを追加または削除することもできません。
- Dynamic Partitioning
  - dynamic partitioning機能は、主にユーザーがパーティションを自動的に管理するのを支援するために使用されます。特定のルールを設定することで、Dorisシステムは定期的に新しいパーティションを追加したり、古いパーティションを削除したりします。詳細については、[Dynamic Partitioning](../../../../table-design/data-partitioning/dynamic-partitioning.md)ドキュメントを参照してください。
- Automatic Partitioning
  - automatic partitioningのドキュメントは[Automatic Partitioning](../../../../table-design/data-partitioning/auto-partitioning.md)にあります。
- Synchronized Materialized Views
  - ユーザーは、テーブル作成時に複数のsynchronized materialized views（ROLLUP）を作成することができます。Synchronized materialized viewsは、テーブル作成後にも追加することができます。テーブル作成文に含めることで、すべてのsynchronized materialized viewsを一度に作成することが容易になります。
  - テーブル作成時にsynchronized materialized viewsが作成された場合、その後のすべてのデータインポート操作により、materialized viewsのデータが同期的に生成されます。materialized viewsの数は、データインポートの効率に影響を与える可能性があります。
  - materialized viewsの概要については、[Synchronized Materialized Views](../../../../query-acceleration/materialized-view/sync-materialized-view.md)のドキュメントを参照してください。
- Indexes
  - ユーザーは、テーブル作成時に複数のカラムインデックスを作成することができます。インデックスは、テーブル作成後にも追加することができます。
  - 後の使用でインデックスが追加され、テーブルに既存データがある場合、すべてのデータを書き直す必要があります。そのため、インデックス作成にかかる時間は現在のデータ量に依存します。


## 例

### 基本例

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
**主キーモデル**

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
**Generated Columnsの使用**

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
**バケット法**

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
**Dynamic Partitioning**

このテーブルは3日先のパーティションを作成し、3日前のパーティションを削除します。例えば、今日が`2020-01-08`の場合、`p20200108`、`p20200109`、`p20200110`、`p20200111`という名前のパーティションが作成されます。パーティションの範囲は以下の通りです：

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
**動的パーティションのレプリケーションプロパティの設定**

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
