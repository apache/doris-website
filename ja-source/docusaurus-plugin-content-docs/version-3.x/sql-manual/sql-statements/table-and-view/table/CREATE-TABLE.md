---
{
  "title": "CREATE TABLE",
  "description": "現在のデータベースまたは指定されたデータベースに新しいtableを作成します。tableは複数の列を持つことができ、各列の定義には名前、データ型、",
  "language": "ja"
}
---
## 説明

現在のデータベースまたは指定されたデータベースに新しいtableを作成します。tableは複数の列を持つことができ、各列の定義には名前、データ型、および必要に応じて以下の属性が含まれます：

- キーであるかどうか
- 集約セマンティクスを持つかどうか
- 生成列であるかどうか
- 値が必要かどうか（NOT NULL）
- 自動増分列であるかどうか
- 挿入時にデフォルト値があるかどうか
- 更新時にデフォルト値があるかどうか

さらに、このコマンドは以下のバリエーションもサポートします：

- CREATE TABLE … AS SELECT（データが事前に投入されたtableを作成する。CTASとしても知られる）
- CREATE TABLE … LIKE（既存のtableの空のコピーを作成する）

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
## Varaint構文

### CREATE TABLE ... AS SELECT（CTASとも呼ばれる）

Tableを生成し、`query`から返されたデータでそのTableにデータを投入します：

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

既存のTableと同じカラム定義を持つ新しいTableを作成します。既存のTableからデータはコピーされません。カラムのすべてのプロパティが新しいTableに複製されます。`rollup`名のリストが指定された場合、元のTableから対応する`rollup`も複製されます：

```sql
CREATE TABLE <new_table_name> LIKE <existing_table_name>
[ WITH ROLLUP ( <rollup_list> ) ];
```
## 必須パラメータ

**<name>**

> Tableの識別子（つまり名前）を指定します。Tableが作成されるデータベース内で一意である必要があります。
>
> 識別子は文字で始まる必要があり（Unicode名前サポートが有効な場合は任意の言語文字）、識別子文字列全体がバッククォートで囲まれていない限り、スペースや特殊文字を含むことはできません（例：``My Object``）。
>
> 識別子は予約キーワードを使用できません。
>
> 詳細については、[Identifier Requirements](../../../basic-element/object-identifiers.md)および[Reserved Keywords](../../../basic-element/reserved-keywords.md)を参照してください。

**<col_name>**

> カラムの識別子（つまり名前）を指定します。作成されるTable内で一意である必要があります。
>
> 識別子は文字（Unicode名前サポートが有効な場合は任意の言語文字）、数字、または記号`@`で始まる必要があり、識別子文字列全体がバッククォートで囲まれていない限り、スペースや特殊文字を含むことはできません（例：``My Object``）。
>
> 詳細については、[Identifier Requirements](../../../basic-element/object-identifiers.md)および[Reserved Keywords](../../../basic-element/reserved-keywords.md)を参照してください。

**<col_type>**

> カラムのデータ型を指定します。
>
> Tableカラムに指定できるデータ型の詳細については、[Data Types](../../../basic-element/sql-data-types/data-type-overview.md)セクションを参照してください。

**<query>**

> CTASにおける必須パラメータです。データを投入するSELECT文を指定します。

**<source_table>**

> CREATE TABLE ... LIKEにおける必須パラメータです。コピーする元のTableを指定します。

## オプションパラメータ

### データモデル関連パラメータ

**<key_type>**

> Tableのデータモデルです。オプション値はDUPLICATE（詳細モデル）、UNIQUE（主キーモデル）、AGGREGATE（集計モデル）です。データモデルの詳細については、Data Modelセクションを参照してください。

**<key_cols>**

> Tableのキーカラムです。Dorisでは、キーカラムはTableの最初のK個のカラムである必要があります。単一タブレット内のデータは、これらのカラムによって順序を保持します。キーに関する制約とキーカラムの選び方については、Data Modelセクションの各サブセクションを参照してください。

**<cluster_cols>**

> データローカルソートカラムで、データモデルがUNIQUE（主キーモデル）の場合のみ使用できます。`<cluster_cols>`が指定された場合、`<key_cols>`の代わりに`<cluster_cols>`によってデータがソートされます。

**<col_aggregate_type>**

> カラムの集計方法です。Tableが集計モデルの場合のみ使用できます。集計方法の詳細については、Aggregation Modelセクションを参照してください。

### バケット関連パラメータ

**<distribute_cols> and <bucket_count>**

> バケットカラムとバケット数です。詳細モデルのバケットカラムは任意のカラムが可能で、集計モデルと主キーモデルのバケットカラムはキーカラムと一致している必要があります。バケット数は任意の正整数です。バケットの詳細については、Manual BucketingおよびAutomatic Bucketingセクションを参照してください。

### カラムデフォルト値関連パラメータ

**[ GENERATED ALWAYS ] AS (<col_generate_expression>)**

> 生成カラムです。現在のカラムより前のカラムを使用して、式`<col_generate_expression>`を通じて現在のカラムのデータを生成します。生成カラムは、ユーザーによって直接挿入または更新されるのではなく、他のカラムの値から計算されるデータベースTableカラムの特別な型です。この機能は式の結果を事前計算してデータベースに格納することをサポートし、頻繁なクエリや複雑な計算が必要なシナリオに適しています。

**AUTO_INCREMENT(<col_auto_increment_start_value>)**

> データをインポートする際、Dorisは値を指定しない自動増分カラムのデータ行に対して、Table内で一意の値を割り当てます。`<col_auto_increment_start_value>`は自動増分カラムの開始値を指定します。自動増分カラムの詳細については、Auto-Increment Columnsセクションを参照してください。

**DEFAULT <col_default_value>**

> カラムのデフォルト値です。このカラムを含まずに書き込む場合、このデフォルト値が使用されます。デフォルト値が明示的に設定されていない場合、NULLが使用されます。利用可能なデフォルト値には以下があります：
>
> - NULL：すべての型で利用可能で、NULLをデフォルト値として使用します。
> - 数値リテラル：数値型でのみ使用できます。
> - 文字列リテラル：文字列型でのみ使用できます。
> - CURRENT_DATE：日付型でのみ使用できます。現在の日付をデフォルト値として使用します。
> - CURRENT_TIMESTAMP [ <defaultValuePrecision> ]：日時型でのみ使用できます。現在のタイムスタンプをデフォルト値として使用します。`<defaultValuePrecision>`で時間精度を指定できます。
> - PI：double型でのみ使用できます。円周率をデフォルト値として使用します。
> - E：double型でのみ使用できます。数学定数eをデフォルト値として使用します。
> - BITMAP_EMPTY：カラムがbitmap型の場合のみ使用できます。空のビットマップを埋めます。

**ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>)**

> データが更新される際、このカラムに値が指定されていない場合、現在のタイムスタンプを使用してこのカラムのデータを更新します。UNIQUE（主キーモデル）のTableでのみ使用できます。

### インデックス関連パラメータ

**<index_name>**

> インデックスの識別子（つまり名前）を指定します。作成されるTable内で一意である必要があります。識別子の詳細については、[Identifier Requirements](../../../basic-element/object-identifiers.md)および[Reserved Keywords](../../../basic-element/reserved-keywords.md)を参照してください。

**<index_cols>**

> インデックスを追加するカラムのリストです。Table内の既存のカラムである必要があります。

**<index_type>**

> インデックスの種類です。現在、INVERTEDのみサポートされています。

**<index_property>**

> インデックスのプロパティです。詳細な説明については、Inverted Indexセクションを参照してください。

### 自動パーティション関連パラメータ

パーティショニングの詳細な紹介については、Automatic Partitioningセクションを参照してください。

### 手動パーティショニング関連パラメータ

パーティショニングの詳細な紹介については、「Manual Partitioning」セクションを参照してください。

**<partition_type>**

> DorisはRANGEパーティショニングとLISTパーティショニングをサポートしています。詳細については、Manual Partitioningセクションを参照してください。

**<partition_name>**

> パーティションの識別子（つまり名前）です。作成されるTable内で一意である必要があります。識別子の詳細については、[Identifier Requirements](../../../basic-element/object-identifiers.md)および[Reserved Keywords](../../../basic-element/reserved-keywords.md)を参照してください。

**VALUES LESS THAN <partition_value_list>**

> RANGEパーティショニングです。パーティションデータの範囲は下限から`<partition_value_list>`までです。
>
> 上限を表す場合、`<partition_value_list>`は`MAX_VALUE`に簡略化できます。
>
> `<partition_value_list>`の形式は次のとおりです：`((col_1_value, ...), (col_1_value, ...), ...)`

**VALUES [ <partition_lower_bound>, <partition_upper_bound>)**

> RANGEパーティショニングです。パーティションデータの範囲は`<partition_lower_bound>`から`<partition_upper_bound>`までです。1つのパーティションのみが作成されます。
>
> `<partition_lower_bound>`と`<partition_upper_bound>`の形式は次のとおりです：`(col_1_value, ...)`

**FROM <partition_lower_bound> TO <partition_upper_bound>**

**INTERVAL <n> [ <datetime_unit> ]**

> RANGEパーティショニングです。パーティションデータの範囲は`<partition_lower_bound>`から`<partition_value_list>`までです。`<n>`ごとにパーティションが作成されます。
>
> `<partition_lower_bound>`と`<partition_upper_bound>`の形式は次のとおりです：`(col_1_value, ...)`

**VALUES IN {**

​          **(<partition_value> [, <partition_value> [ ... ] ])**

​          **| <partition_value>**

​      **}**

> LISTパーティショニングです。パーティションカラムが`<partition_value>`と等しい行がこのパーティションに属します。
>
> `<partition_value>`の形式は次のとおりです：`(col_1_value, ...)`


### 同期マテリアライズドビュー関連

:::caution 注意
rollupで同期マテリアライズドビューを作成する機能は制限されており、もはや推奨されません。個別のステートメントを使用して同期マテリアライズドビューを作成することをお勧めします。詳細については、[CREATE MATERIALIZED VIEW](../sync-materialized-view/CREATE-MATERIALIZED-VIEW.md)ステートメントおよびSynchronized Materialized Viewセクションを参照してください。
:::

**<rollup_name>**

> 同期マテリアライズドビューの識別子（つまり名前）です。作成されるTable内で一意である必要があります。識別子の詳細については、[Identifier Requirements](../../../basic-element/object-identifiers.md)および[Reserved Keywords](../../../basic-element/reserved-keywords.md)を参照してください。

**<rollup_cols>**

> 同期マテリアライズドビューに含まれるカラムです。

### Tableプロパティ関連パラメータ

**<table_property>**

| プロパティ名 | 機能 |
| :------------ | :-------- |
| replication_num | レプリカ数です。デフォルトのレプリカ数は3です。BEノード数が3未満の場合、BEノード数以下のレプリカ数を指定する必要があります。バージョン0.15以降、このプロパティは自動的に`replication_allocation`プロパティに変換されます。例：`"replication_num" = "3"`は自動的に`"replication_allocation" = "tag.location.default:3"`に変換されます。 |
| replication_allocation | Tagに基づいてレプリカの分散を設定します。このプロパティは`replication_num`プロパティの機能を完全にオーバーライドできます。 |
| min_load_replica_num | データインポート成功に必要な最小レプリカ数を設定し、デフォルト値は-1です。このプロパティが0以下の場合、データインポートには依然として過半数のレプリカが成功する必要があることを示します。 |
| is_being_synced | このTableがCCRによって複製され、現在syncerによって同期されているかどうかを識別するために使用され、デフォルト値は`false`です。`true`に設定すると、`colocate_with`と`storage_policy`プロパティがクリアされます。`dynamic partition`と`auto bucket`機能は無効になります。つまり、`show create table`では有効と表示されますが、実際には効果を持ちません。`is_being_synced`が`false`に設定されると、これらの機能は再開されます。このプロパティはCCR周辺モジュールでのみ使用するものであり、CCR同期プロセス中に手動で設定すべきではありません。 |
| storage_medium | Tableデータの初期ストレージメディアを宣言します。 |
| storage_cooldown_time | Tableデータの初期ストレージメディアの有効期限を設定します。この時間の後、自動的に第1レベルのストレージメディアにダウングレードされます。 |
| colocate_with | Colocation Join機能が必要な場合、このパラメータを使用してColocation Groupを設定します。 |
| bloom_filter_columns | ユーザーが指定したBloom Filterインデックスの追加が必要なカラム名のリストです。各カラムのBloom Filterインデックスは独立しており、複合インデックスではありません。例：`"bloom_filter_columns" = "k1, k2, k3"` |
| compression | DorisTableのデフォルト圧縮方法はLZ4です。バージョン1.1以降、より高い圧縮比のためにZSTDを圧縮方法として指定することがサポートされています。 |
| function_column.sequence_col | Unique Keyモデルを使用する際、Sequenceカラムを指定できます。キーカラムが同じ場合、Sequenceカラムに従ってREPLACEが実行されます（大きい値が小さい値を置き換えます。そうでなければ置き換えできません）。`function_column.sequence_col`はsequenceカラムをTable内の特定のカラムにマッピングするために使用され、整数または日付/時刻型（DATE、DATETIME）が可能です。このカラムの型は作成後に変更できません。`function_column.sequence_col`が設定されている場合、`function_column.sequence_type`は無視されます。 |
| function_column.sequence_type | Unique Keyモデルを使用する際、Sequenceカラムを指定できます。キーカラムが同じ場合、Sequenceカラムに従ってREPLACEが実行されます（大きい値が小さい値を置き換えます。そうでなければ置き換えできません）。ここでは、sequenceカラムの型のみを指定する必要があり、日付/時刻型または整数をサポートします。Dorisは隠れたsequenceカラムを作成します。 |
| enable_unique_key_merge_on_write | UniqueTableがMerge-on-Write実装を使用するかどうかです。このプロパティはバージョン2.1以前はデフォルトで無効で、バージョン2.1以降はデフォルトで有効です。 |
| light_schema_change | Light Schema Change最適化を使用するかどうかです。`true`に設定すると、valueカラムの追加・削除操作をより高速かつ同期的に完了できます。この機能はバージョン2.0.0以降でデフォルトで有効です。 |
| disable_auto_compaction | このTableの自動compactionを無効にするかどうかです。このプロパティが`true`に設定されている場合、バックグラウンドの自動compactionプロセスはこのTableのすべてのタブレットをスキップします。 |
| enable_single_replica_compaction | このTableの単一レプリカcompactionを有効にするかどうかです。このプロパティが`true`に設定されている場合、Tableのタブレットのすべてのレプリカのうち1つのレプリカのみが実際のcompactionアクションを実行し、他のレプリカはそのレプリカからcompactionされたrowsetを取得します。 |
| enable_duplicate_without_keys_by_default | `true`に設定すると、Table作成時にUnique、Aggregate、またはDuplicateが指定されていない場合、デフォルトでソートカラムとプレフィックスインデックスのないDuplicateモデルTableが作成されます。 |
| skip_write_index_on_load | このTableのデータインポート中にインデックス書き込みを有効にしないかどうかです。このプロパティが`true`に設定されている場合、データインポート中にインデックスが書き込まれず（現在は転置インデックスのみ有効）、compactionまで遅延されます。これにより、初回書き込みとcompaction時のインデックス書き込みの繰り返しによるCPUとIOリソース消費を回避し、高スループットインポートのパフォーマンスを向上させることができます。 |
| compaction_policy | このTableのcompactionマージポリシーを設定し、time_seriesまたはsize_basedtime_seriesのみをサポートします：rowsetのディスクボリュームが一定のサイズまで蓄積されると、バージョンマージが実行されます。マージされたrowsetは直接base compactionフェーズに昇格されます。これにより、継続的なインポートシナリオでのcompactのwrite amplificationが効果的に削減されます。このポリシーはtime_series_compactionプレフィックスのパラメータを使用してcompactionの実行を調整します。 |
| time_series_compaction_goal_size_mbytes | compactionマージポリシーがtime_seriesの場合、このパラメータは各compactionの入力ファイルサイズを調整するために使用され、出力ファイルサイズは入力と同等になります。 |
| time_series_compaction_file_count_threshold | compactionマージポリシーがtime_seriesの場合、このパラメータは各compactionの最小入力ファイル数を調整するために使用されます。タブレット内のファイル数がこの設定を超えるとcompactionがトリガーされます。 |
| time_series_compaction_time_threshold_seconds | compactionマージポリシーがtime_seriesの場合、このパラメータはcompaction間の最長間隔を調整するために使用されます。つまり、長時間実行されていない場合にcompactionがトリガーされ、単位は秒です。 |
| time_series_compaction_level_threshold | compactionマージポリシーがtime_seriesの場合、このパラメータはデフォルトで1です。2に設定すると、一度マージされたセグメントが再度マージされてセグメントサイズがtime_series_compaction_goal_size_mbytesに達することを制御し、セグメント数を削減する効果を達成するために使用されます。 |
| group_commit_interval_ms | このTableのGroup Commitバッチ間隔を設定します。単位はmsで、デフォルト値は10000ms、つまり10sです。Group Commitのタイミングは`group_commit_interval_ms`と`group_commit_data_bytes`のいずれかが設定値に最初に達することによります。 |
| group_commit_data_bytes | このTableのGroup Commitバッチデータサイズを設定します。単位はbytesで、デフォルト値は134217728、つまり128MBです。Group Commitのタイミングは`group_commit_interval_ms`と`group_commit_data_bytes`のいずれかが設定値に最初に達することによります。 |
| enable_mow_light_delete | MowのUniqueTableでDelete文でDelete predicateを書き込むかどうかを有効にします。有効にすると、Delete文のパフォーマンスが向上しますが、Delete後の部分カラム更新でデータエラーが発生する可能性があります。無効にすると、Delete文のパフォーマンスが低下しますが正確性が保証されます。このプロパティのデフォルト値は`false`です。このプロパティはUnique Merge-on-WriteTableでのみ有効にできます。 |
| 動的パーティション関連プロパティ | 動的パーティションについては、Data Partitioning - Dynamic Partitioningを参照 |
| enable_unique_key_skip_bitmap_column | Unique Merge-on-WriteTableでFlexible Column Update機能を有効にするかどうかです。このプロパティはUnique Merge-on-WriteTableでのみ有効にできます。（バージョン3.1.0以降サポート） |


## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 説明 |
| :---------------- | :------------------------ | :----------------------------------------------------------- |
| CREATE_PRIV | Database | |
| SELECT_PRIV | Table, View | CTASを実行する際、クエリされるTable、ビュー、またはマテリアライズドビューにSELECT_PRIVが必要 |

## 使用上の注意

- データベース（Database）には、同じ名前のTable（Table）またはビュー（View）を含めることはできません。
- Table名、カラム名、rollup名は[Reserved Keywords](../../../basic-element/reserved-keywords.md)を使用できません。
- CREATE TABLE ... LIKE：
  - このコマンドは内部DorisTableでのみ使用できます。
  - 明示的に指定されたrollupのみがコピーされます。
  - すべての同期マテリアライズドビューは複製されません。
- CREATE TABLE ... AS SELECT (CTAS)：
  - SELECTリスト内のカラム名のエイリアスが有効なカラムである場合、CTAS文でカラム定義は必要ありません。省略した場合、カラム名とデータ型はベースクエリから推論されます：

    ```sql
    CREATE TABLE <table_name> AS SELECT ...
    ```
- あるいは、以下の構文を使用して名前を明示的に指定することもできます：

    ```sql
    CREATE TABLE <table_name> ( <col1_name>, <col2_name>, ... ) AS SELECT ...
    ```
- Partitioning と Bucketing
  - Tableは bucketing カラムを指定する必要がありますが、パーティションの指定は省略することができます。partitioning と bucketing の詳細については、Data Partitioning ドキュメントを参照してください。
  - Doris のTableは、パーティション化されているか、パーティション化されていないかのいずれかです。この属性はTable作成時に決定され、後から変更することはできません。つまり、パーティション化されたTableの場合、その後の使用でパーティションを追加または削除することができますが、パーティション化されていないTableには後からパーティションを追加することはできません。
  - パーティションカラムと bucket カラムは、Table作成後に変更することはできません。パーティションカラムと bucket カラムのタイプを変更することも、これらのカラムを追加または削除することもできません。
- Dynamic Partitioning
  - dynamic partitioning 機能は、主にユーザーがパーティションを自動的に管理できるよう支援するために使用されます。特定のルールを設定することで、Doris システムは定期的に新しいパーティションを追加したり、古いパーティションを削除したりします。詳細については、Dynamic Partitioning ドキュメントを参照してください。
- Automatic Partitioning
  - automatic partitioning のドキュメントは Automatic Partitioning にあります。
- Synchronized Materialized Views
  - ユーザーはTable作成時に複数の synchronized materialized views（ROLLUP）を作成することができます。Synchronized materialized views は、Table作成後に追加することも可能です。Table作成文に含めることで、すべての synchronized materialized views を一度に作成することができます。
  - Synchronized materialized views がTable作成時に作成される場合、その後のすべてのデータインポート操作において、materialized views のデータが同期的に生成されます。Materialized views の数は、データインポートの効率に影響を与える可能性があります。
  - Materialized views の概要については、Synchronized Materialized Views のドキュメントを参照してください。
- Indexes
  - ユーザーはTable作成時に複数のカラムインデックスを作成することができます。インデックスは、Table作成後に追加することも可能です。
  - その後の使用でインデックスが追加され、Tableに既存データが存在する場合、すべてのデータを書き直す必要があります。そのため、インデックス作成にかかる時間は現在のデータ量に依存します。

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
**Generated Columns の使用**

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

1. Tableが移行戦略と正常に関連付けられるように、まずs3リソースとストレージポリシーを作成する必要があります。

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
### CTAS例

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
