---
{
    "title": "CREATE TABLE",
    "language": "ja",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "現在のデータベースまたは指定したデータベースに新しいテーブルを作成します。テーブルには複数の列を定義でき、各列の定義には名前、データ型、"
}
---

## 説明 {#description}

現在のデータベースまたは指定したデータベースに新しいテーブルを作成します。テーブルには複数の列を定義でき、各列の定義には名前、データ型、および必要に応じて次の属性を指定できます。

- キーかどうか
- 集約の意味を持つかどうか
- 生成列かどうか
- 値が必須かどうか（NOT NULL）
- 自動増分列かどうか
- 挿入時のデフォルト値があるかどうか
- 更新時のデフォルト値があるかどうか

このコマンドは、次の形式にも対応しています。

- CREATE TABLE … AS SELECT（データを格納した状態でテーブルを作成します。CTAS とも呼ばれます）
- CREATE TABLE … LIKE（既存のテーブルの空のコピーを作成します）

## 構文 {#syntax}

```sql
CREATE [ TEMPORARY | EXTERNAL ] TABLE [ IF NOT EXISTS ] <table_name>
    (<columns_definition> [ <indexes_definition> ])
    [ ENGINE = <table_engine_type> ]
    [ <key_type> KEY (<key_cols>)
        [ ORDER BY (<cluster_cols>) ]
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

> 注：`ORDER BY` は 4.1.0 以降でサポートされています。

各定義は次のとおりです。

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

- 各定義は次のとおりです。

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

## 別の構文 {#varaint-syntax}

### CREATE TABLE ... AS SELECT（CTAS とも呼ばれます） {#create-table--as-select-also-referred-to-as-ctas}

テーブルを作成し、`query` が返すデータを格納します。

```sql
CREATE
    [ EXTERNAL ]
    TABLE [ IF NOT EXISTS ] <table_name>
    [ ( <column_definitions> ) ]
    [ <index_definitions> ]
    [ ENGINE = <storage_engine_type> ]
    [ <partitioning_key_type> KEY ( <key_columns> )
        [ ORDER BY ( <clustering_columns> ) ]
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

> 注：`ORDER BY` は 4.1.0 以降でサポートされています。

### CREATE TABLE ... LIKE {#create-table--like}

既存のテーブルと同じ列定義を持つ新しいテーブルを作成します。既存のテーブルのデータはコピーされません。列のすべての属性が新しいテーブルに複製されます。`rollup` 名のリストを指定すると、元のテーブルにある対応する `rollup` も複製されます。

```sql
CREATE TABLE <new_table_name> LIKE <existing_table_name>
[ WITH ROLLUP ( <rollup_list> ) ];
```

## 必須パラメータ {#required-parameters}

**<name>**

> テーブルの識別子（名前）を指定します。テーブルを作成するデータベース内で一意でなければなりません。
>
> 識別子は英字で始める必要があります。Unicode 名のサポートが有効な場合は、任意の言語の文字で始めることができます。識別子全体をバッククォートで囲まない限り、空白や特殊文字を含めることはできません（例：``My Object``）。
>
> 識別子に予約キーワードは使用できません。
>
> 詳細は、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約キーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**<col_name>**

> 列の識別子（名前）を指定します。作成するテーブル内で一意でなければなりません。
>
> 識別子は英字、数字、または記号 `@` で始める必要があります。Unicode 名のサポートが有効な場合は、任意の言語の文字で始めることもできます。識別子全体をバッククォートで囲まない限り、空白や特殊文字を含めることはできません（例：``My Object``）。
>
> 詳細は、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約キーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**<col_type>**

> 列のデータ型を指定します。
>
> テーブルの列に指定できるデータ型については、[データ型](../../../basic-element/sql-data-types/data-type-overview.md)を参照してください。

**<query>**

> CTAS で必須のパラメータです。データの格納に使用する SELECT 文を指定します。

**<source_table>**

> CREATE TABLE ... LIKE で必須のパラメータです。コピー元のテーブルを指定します。

## 任意のパラメータ {#optional-parameters}

### データモデルに関するパラメータ {#data-model-related-parameters}

**<key_type>**

> テーブルのデータモデルです。指定できる値は DUPLICATE（明細モデル）、UNIQUE（主キーモデル）、AGGREGATE（集約モデル）です。データモデルの詳細は、[データモデル](../../../../table-design/data-model/intro.mdx)を参照してください。

**<key_cols>**

> テーブルのキー列です。Doris では、Key 列はテーブルの先頭から K 個の列でなければなりません。各 tablet 内のデータは、これらの列に従って順序が維持されます。Key の制約と Key 列の選び方については、[データモデル](../../../../table-design/data-model/intro.mdx)の各項目を参照してください。

**<cluster_cols>**

> データのローカルソート列です。データモデルが UNIQUE（主キーモデル）の場合にのみ使用できます。`<cluster_cols>` を指定すると、データは `<key_cols>` ではなく `<cluster_cols>` に従ってソートされます。

**<col_aggregate_type>**

> 列の集約方法です。テーブルが集約モデルの場合にのみ使用できます。集約方法の詳細は、[集約モデル](../../../../table-design/data-model/aggregate.md)を参照してください。

### バケット分割に関するパラメータ {#bucketing-related-parameters}

**<distribute_cols> と <bucket_count>**

> バケット列とバケット数です。明細モデルでは任意の列をバケット列に指定できます。集約モデルと主キーモデルでは、バケット列をキー列と一致させる必要があります。バケット数には任意の正の整数を指定できます。詳細は、[手動バケット分割](../../../../table-design/data-partitioning/data-bucketing#1-manually-set-the-number-of-buckets)と[自動バケット分割](../../../../table-design/data-partitioning/data-bucketing#2-automatically-set-the-number-of-buckets)を参照してください。

### 列のデフォルト値に関するパラメータ {#column-default-value-related-parameters}

**[ GENERATED ALWAYS ] AS (<col_generate_expression>)**

> 生成列です。現在の列より前にある列を使い、式 `<col_generate_expression>` によって現在の列のデータを生成します。生成列は、ユーザーが値を直接挿入または更新するのではなく、ほかの列の値から値を計算する特別なテーブル列です。この機能では、式の結果を事前に計算してデータベースに保存できます。頻繁なクエリや複雑な計算が必要な場合に適しています。

**AUTO_INCREMENT(<col_auto_increment_start_value>)**

> データのインポート時に、自動増分列の値が指定されていない行には、Doris がテーブル内で一意の値を割り当てます。`<col_auto_increment_start_value>` は自動増分列の開始値を指定します。詳細は、[自動増分列](../../../../table-design/auto-increment.md)を参照してください。

**DEFAULT <col_default_value>**

> 列のデフォルト値です。この列を含めずに書き込むと、デフォルト値が使用されます。デフォルト値を明示的に設定しない場合は NULL が使用されます。指定できるデフォルト値は次のとおりです。
>
> - NULL：すべての型で使用でき、NULL をデフォルト値にします。
> - 数値リテラル：数値型にのみ使用できます。
> - 文字列リテラル：文字列型にのみ使用できます。
> - CURRENT_DATE：日付型にのみ使用でき、現在の日付をデフォルト値にします。
> - CURRENT_TIMESTAMP [ <defaultValuePrecision> ]：日時型にのみ使用でき、現在のタイムスタンプをデフォルト値にします。`<defaultValuePrecision>` で時刻の精度を指定できます。
> - PI：double 型にのみ使用でき、円周率をデフォルト値にします。
> - E：double 型にのみ使用でき、数学定数 e をデフォルト値にします。
> - BITMAP_EMPTY：列が bitmap 型の場合にのみ使用でき、空の bitmap を設定します。

**ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>)**

> データの更新時にこの列の値が指定されていない場合、現在のタイムスタンプを使用して列を更新します。UNIQUE（主キーモデル）のテーブルでのみ使用できます。

### インデックスに関するパラメータ {#index-related-parameters}

**<index_name>**

> インデックスの識別子（名前）を指定します。作成するテーブル内で一意でなければなりません。詳細は、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約キーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**<index_cols>**

> インデックスを追加する列のリストです。テーブルに存在する列を指定する必要があります。

**<index_type>**

> インデックスの種類です。現在サポートされているのは INVERTED のみです。

**<index_property>**

> インデックスのプロパティです。詳細は、[転置インデックス](../../../../table-design/index/inverted-index/overview.md)を参照してください。

### 自動パーティション分割に関するパラメータ {#auto-partition-related-parameters}

パーティション分割の詳細は、[自動パーティション分割](../../../../table-design/data-partitioning/auto-partitioning.md)を参照してください。

### 手動パーティション分割に関するパラメータ {#manual-partitioning-related-parameters}

パーティション分割の詳細は、「手動パーティション分割」の項目を参照してください。

**<partition_type>**

> Doris は RANGE パーティション分割と LIST パーティション分割をサポートしています。詳細は、[手動パーティション分割](../../../../table-design/data-partitioning/manual-partitioning.md)を参照してください。

**<partition_name>**

> パーティションの識別子（名前）です。作成するテーブル内で一意でなければなりません。詳細は、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約キーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**VALUES LESS THAN <partition_value_list>**

> RANGE パーティション分割です。パーティションのデータ範囲は下限から `<partition_value_list>` までです。
>
> 上限を表す場合は、`<partition_value_list>` を `MAX_VALUE` と記述できます。
>
> `<partition_value_list>` の形式は `((col_1_value, ...), (col_1_value, ...), ...)` です。

**VALUES [ <partition_lower_bound>, <partition_upper_bound>)**

> RANGE パーティション分割です。パーティションのデータ範囲は `<partition_lower_bound>` から `<partition_upper_bound>` までです。作成されるパーティションはひとつです。
>
> `<partition_lower_bound>` と `<partition_upper_bound>` の形式は `(col_1_value, ...)` です。

**FROM <partition_lower_bound> TO <partition_upper_bound>**

**INTERVAL <n> [ <datetime_unit> ]**

> RANGE パーティション分割です。パーティションのデータ範囲は `<partition_lower_bound>` から `<partition_value_list>` までです。`<n>` ごとにパーティションを作成します。
>
> `<partition_lower_bound>` と `<partition_upper_bound>` の形式は `(col_1_value, ...)` です。

**VALUES IN {**

​          **(<partition_value> [, <partition_value> [ ... ] ])**

​          **| <partition_value>**

​      **}**

> LIST パーティション分割です。パーティション列が `<partition_value>` と等しい行が、このパーティションに属します。
>
> `<partition_value>` の形式は `(col_1_value, ...)` です。


### 同期マテリアライズドビューに関するパラメータ {#synchronized-materialized-view-related}

:::caution 注意
rollup による同期マテリアライズドビューの作成機能には制限があり、現在は推奨されていません。同期マテリアライズドビューは個別の文で作成することを推奨します。詳細は、[CREATE MATERIALIZED VIEW](../sync-materialized-view/CREATE-MATERIALIZED-VIEW.md) 文と[同期マテリアライズドビュー](../../../../query-acceleration/materialized-view/sync-materialized-view.md)を参照してください。
:::

**<rollup_name>**

> 同期マテリアライズドビューの識別子（名前）です。作成するテーブル内で一意でなければなりません。詳細は、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約キーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**<rollup_cols>**

> 同期マテリアライズドビューに含める列です。

### テーブルプロパティに関するパラメータ {#table-property-related-parameters}

以下の説明は OLAP テーブルに適用されます。プロパティの値は `PROPERTIES ("name" = "value", ...)` に引用符で囲んだ文字列として設定します。特定の機能で必要とされる場合を除き、プロパティは任意です。デプロイ構成による制約は各説明に記載しています。

**<table_property>**

| プロパティ名 | 機能 |
| :------------ | :-------- |
| replication_num | レプリカ数です。デフォルトは 3 です。BE ノード数が 3 未満の場合は、BE ノード数以下のレプリカ数を指定する必要があります。バージョン 0.15 より後では、このプロパティは自動的に `replication_allocation` プロパティに変換されます。たとえば、`"replication_num" = "3"` は `"replication_allocation" = "tag.location.default:3"` に自動的に変換されます。 |
| replication_allocation | Tags に基づいてレプリカの配置を設定します。このプロパティは `replication_num` プロパティの機能を完全に置き換えることができます。 |
| min_load_replica_num | データのインポートが成功するために必要な最小レプリカ数を設定します。デフォルト値は -1 です。このプロパティが 0 以下の場合、インポートの成功には引き続き過半数のレプリカでの成功が必要です。 |
| storage_medium | テーブルデータの初期ストレージ媒体を指定します。 |
| storage_cooldown_time | テーブルデータの初期ストレージ媒体の有効期限を設定します。この時刻を過ぎると、自動的に最初の階層のストレージ媒体へ移行します。 |
| colocate_with | Colocation Join 機能を使用する場合、このパラメータで Colocation Group を設定します。 |
| bloom_filter_columns | Bloom Filter インデックスを追加する列名のリストです。各列の Bloom Filter インデックスは独立しており、複合インデックスではありません。例：`"bloom_filter_columns" = "k1, k2, k3"` |
| compression | バージョン 4.0.3 以降、Doris テーブルのデフォルトの圧縮方式は ZSTD です。バージョン 4.0.3 より前は LZ4F でした。 |
| function_column.sequence_col | Unique Key モデルでは Sequence 列を指定できます。Key 列が同じ場合、Sequence 列に従って REPLACE が行われます（値が大きい場合は小さい値を置き換え、それ以外の場合は置き換えられません）。`function_column.sequence_col` は、Sequence 列をテーブル内の特定の列に対応付けます。対応付ける列には整数型または日付・時刻型（DATE、DATETIME）を使用できます。作成後にこの列の型は変更できません。`function_column.sequence_col` を設定した場合、`function_column.sequence_type` は無視されます。 |
| function_column.sequence_type | Unique Key モデルでは Sequence 列を指定できます。Key 列が同じ場合、Sequence 列に従って REPLACE が行われます（値が大きい場合は小さい値を置き換え、それ以外の場合は置き換えられません）。ここでは、日付・時刻型または整数型の Sequence 列の型だけを指定します。Doris は非表示の Sequence 列を作成します。 |
| enable_unique_key_merge_on_write | Unique テーブルで Merge-on-Write 実装を使用するかどうかを指定します。バージョン 2.1 より前ではデフォルトで無効、バージョン 2.1 以降ではデフォルトで有効です。 |
| light_schema_change | Light Schema Change 最適化を使用するかどうかを指定します。`true` に設定すると、値列の追加と削除をより速く、同期的に完了できます。この機能はバージョン 2.0.0 以降でデフォルトで有効です。 |
| disable_auto_compaction | このテーブルの自動 compaction を無効にするかどうかを指定します。`true` に設定すると、バックグラウンドの自動 compaction 処理は、このテーブルのすべての tablet をスキップします。 |
| enable_duplicate_without_keys_by_default | `true` に設定した場合、テーブル作成時に Unique、Aggregate、Duplicate のいずれも指定しなければ、ソート列とプレフィックスインデックスを持たない Duplicate モデルのテーブルがデフォルトで作成されます。 |
| skip_write_index_on_load | このテーブルへのデータインポート時にインデックスを書き込まないようにするかどうかを指定します。`true` に設定すると、インポート時にはインデックスを書き込まず（現在は転置インデックスにのみ有効）、compaction 時まで書き込みを遅らせます。初回の書き込みと compaction でインデックスを繰り返し書き込む際の CPU と IO の消費を抑え、高スループットのインポート性能を向上させます。 |
| compaction_policy | このテーブルの compaction マージポリシーを設定します。サポートされるのは time_series または size_basedtime_series のみです。time_series では、rowset のディスク使用量が一定のサイズに達するとバージョンのマージが行われます。マージされた rowset は直接 base compaction フェーズに進みます。継続的にインポートする場合、compaction の書き込み増幅を効果的に減らします。このポリシーでは、time_series_compaction で始まるパラメータを使って compaction の実行を調整します。 |
| time_series_compaction_goal_size_mbytes | compaction マージポリシーが time_series の場合、各 compaction の入力ファイルのサイズを調整します。出力ファイルのサイズは入力と同程度になります。 |
| time_series_compaction_file_count_threshold | compaction マージポリシーが time_series の場合、各 compaction の入力ファイルの最小数を調整します。tablet 内のファイル数がこの設定値を超えると、compaction が開始されます。 |
| time_series_compaction_time_threshold_seconds | compaction マージポリシーが time_series の場合、compaction 間の最長間隔を秒単位で調整します。長時間 compaction が実行されていない場合に開始されます。 |
| time_series_compaction_level_threshold | compaction マージポリシーが time_series の場合、このパラメータのデフォルトは 1 です。2 に設定すると、一度マージされた segment を再度マージし、segment のサイズが time_series_compaction_goal_size_mbytes に達するようにして、segment 数を減らします。 |
| group_commit_interval_ms | このテーブルの Group Commit のバッチ間隔を設定します。単位は ms、デフォルト値は 10000ms（10s）です。Group Commit の実行タイミングは、`group_commit_interval_ms` と `group_commit_data_bytes` のどちらが先に設定値に達するかで決まります。 |
| group_commit_data_bytes | このテーブルの Group Commit のバッチデータサイズを設定します。単位は bytes、デフォルト値は 134217728（128MB）です。Group Commit の実行タイミングは、`group_commit_interval_ms` と `group_commit_data_bytes` のどちらが先に設定値に達するかで決まります。 |
| enable_mow_light_delete | Mow を使用する Unique テーブルで、Delete 文が Delete predicate を書き込むようにするかどうかを指定します。有効にすると Delete 文の性能は向上しますが、Delete 後の部分列更新で一部のデータに誤りが生じる可能性があります。無効にすると、正確性を確保するために Delete 文の性能は低下します。このプロパティのデフォルト値は `false` です。Unique Merge-on-Write テーブルでのみ有効にできます。 |
| 動的パーティション分割に関するプロパティ | 動的パーティション分割については、[データのパーティション分割 - 動的パーティション分割](../../../../table-design/data-partitioning/dynamic-partitioning)を参照してください。 |
| enable_unique_key_skip_bitmap_column | Unique Merge-on-Write テーブルで[柔軟な列更新機能](../../../../data-operate/update/partial-column-update.md#flexible-column-update)を有効にするかどうかを指定します。このプロパティは Unique Merge-on-Write テーブルでのみ有効にできます。 |

#### その他の OLAP テーブルプロパティ {#additional-olap-table-properties}

| プロパティ | 値の型 | デフォルト値 | 説明 |
| --- | --- | --- | --- |
| `short_key` | 整数 | 自動計算 | プレフィックスインデックスで使用する先頭のソート列の数です。正の値で、ソート列の数を超えてはなりません。VARCHAR 列は、選択した列の最後にしか配置できません。 |
| `bloom_filter_fpp` | Double | `0.05` | `bloom_filter_columns` の偽陽性率で、範囲は `[0.0001, 0.05]` です。Bloom Filter 列を設定した場合にのみ有効です。[Bloom Filter](../../../../table-design/index/bloomfilter.md)を参照してください。 |
| `storage_type` | 文字列 | `COLUMN` | ストレージの構成方式です。指定できるのは `COLUMN` のみです。行形式のコピーを追加するには、以下の行ストアのプロパティを使用します。 |
| `storage_format` | 文字列 | `V2` | segment のストレージ形式です。`V2`、`V3`、または `default`（`V2`）を指定できます。`V3` は 4.1.0 以降で使用でき、列のメタデータを外部に保存します。[ストレージ形式](../../../../table-design/storage-format.md)を参照してください。 |
| `inverted_index_storage_format` | 文字列 | FE の設定 | 転置インデックスの形式です。`V2`、`V3`、または `default` を指定でき、4.2.0 以降は `SNII` もサポートされています。省略するか `default` を指定すると、FE の `inverted_index_storage_format` 設定が使用されます。4.1.5 以降、新しい V1 インデックスの作成は拒否されます。[転置インデックス](../../../../table-design/index/inverted-index/overview.md)を参照してください。 |
| `store_row_column` | 真偽値 | `false` | すべての列について行形式のコピーを追加保存します。`light_schema_change = true` が必要です。Aggregate Key テーブルではサポートされません。[行ストア](../../../../table-design/row-store.md)を参照してください。 |
| `row_store_columns` | 文字列 | 未設定 | 行形式で保存する既存の列名をコンマで区切って指定します。例：`k,v1,v2`。このリストを設定すると、指定した列の行ストアが有効になります。Aggregate Key テーブルではサポートされません。[行ストア](../../../../table-design/row-store.md)を参照してください。 |
| `row_store_page_size` | Long | `16384` | 行ストアのページサイズです。単位はバイトです。正の値を指定する必要があり、4096 バイトの倍数に切り上げられます。 |
| `storage_page_size` | Long | `65536` | 列データのページサイズです。単位はバイト、範囲は `4096` ～ `10485760` です。4096 バイトの倍数に切り上げられます。 |
| `storage_dict_page_size` | Long | `262144` | 辞書ページのサイズです。単位はバイト、範囲は `0` ～ `104857600` です。4096 バイトの倍数に切り上げられます。 |
| `storage_policy` | 文字列 | 未設定 | コンピューティングとストレージが結合したテーブルで使用する、既存のリモートストレージポリシーです。Unique Key Merge-on-Write テーブルではサポートされず、コンピューティングとストレージの分離モードでは無視されます。[リモートストレージ](../../../../table-design/tiered-storage/remote-storage.md)を参照してください。 |
| `storage_vault_name` | 文字列 | データベースの Vault、次にデフォルトの Vault | コンピューティングとストレージの分離モードで使用する Storage Vault の名前です。Vault が存在し、ユーザーがその Vault に対する `USAGE` 権限を持っている必要があります。テーブルの設定は、データベースとデフォルトの Vault の設定より優先されます。[Storage Vault の管理](../../../../compute-storage-decoupled/managing-storage-vault.md)を参照してください。 |
| `file_cache_ttl_seconds` | Long | `0` | コンピューティングとストレージの分離モードにおける TTL キャッシュの保護期間です。単位は秒です。`0` は通常のキャッシュを使用します。4.1.4 以降、検証される範囲は `0` ～ `4611686018427387903` です。データの有効期限を設定するものではありません。[ファイルキャッシュ](../../../../compute-storage-decoupled/file-cache/file-cache.md)を参照してください。 |
| `estimate_partition_size` | 文字列 | 未設定 | 単一パーティションの非圧縮サイズの推定値です。例：`10G`。`BUCKETS AUTO` とともに使用して初期バケット数を決定します。[バケット分割](../../../../table-design/data-partitioning/data-bucketing.md)を参照してください。 |
| `mutable` | 真偽値 | `true` | パーティションがデータロードを受け付けるかどうかを指定します。`false` にすると変更不可になります。テーブルレベルの設定は、そのパーティションのデフォルト値になります。 |
| `partition.retention_count` | 整数 | 未設定 | AUTO RANGE PARTITION テーブルで保持する過去のパーティション数です。正の数を指定します。現在と将来のパーティションは保持されます。4.1.4 以降、有効になっている動的パーティション分割と併用できません。[自動パーティション分割](../../../../table-design/data-partitioning/auto-partitioning.md)を参照してください。 |
| `vertical_compaction_num_columns_per_group` | 整数 | `5` | 垂直 compaction で各グループに含める列数です。`1` 以上でなければなりません。 |
| `time_series_compaction_empty_rowsets_threshold` | Long | `5` | 優先的に compaction する連続した空の rowset の最小数です。`2` 以上で、`compaction_policy = time_series` が必要です。 |
| `group_commit_mode` | 文字列 | `off_mode` | このテーブルのデフォルトの Group Commit モードです。`off_mode`、`sync_mode`、または `async_mode` を指定できます。4.1.0 以降でサポートされています。リクエストまたはセッションの設定が優先されます。[Group Commit](../../../../data-operate/import/load-best-practices/group-commit-manual.md)を参照してください。 |
| `binlog.enable` | 真偽値 | `false` | このテーブルの CCR binlog を有効にします。FE でも `enable_feature_binlog` を有効にする必要があります。 |
| `binlog.ttl_seconds` | Long | `86400` | CCR binlog の保持期間のしきい値です。単位は秒です。 |
| `binlog.max_bytes` | Long | `9223372036854775807` | CCR binlog のガベージコレクションに使用するサイズのしきい値です。単位はバイトです。 |
| `binlog.max_history_nums` | Long | `9223372036854775807` | CCR binlog のガベージコレクションに使用する履歴数のしきい値です。 |
| `is_being_synced` | 真偽値 | `false` | CCR の宛先テーブルが同期中であることを示します。`true` の場合、Doris はそのテーブルの動的パーティションのスケジューリングをスキップし、colocate とストレージポリシーの設定を無視します。このプロパティは CCR の処理に任せてください。 |
| `partition.inverted_index_storage_format` | 文字列 | 未設定 | 4.2.0 以降でサポートされます。コンピューティングとストレージの分離モードで新しく作成するパーティションの形式を `V2`、`V3`、または `SNII` に設定します。FE の設定 `enable_partition_inverted_index_storage_format_rollout = true` が必要で、この設定がオフの場合は無視されます。既存のパーティションは変換されません。 |

機能固有のプロパティについては、[動的パーティション分割](../../../../table-design/data-partitioning/dynamic-partitioning.md)も参照してください。インデックスの `PROPERTIES`、VARIANT 列の `PROPERTIES`、非同期マテリアライズドビューのプロパティは、これらのテーブルプロパティとは別です。統計情報の自動収集については、[統計情報](../../../../query-acceleration/optimization-technology-principle/statistics.md)の説明に従い、`ALTER TABLE` で `auto_analyze_policy` を設定してください。

## アクセス制御の要件 {#access-control-requirements}

この SQL コマンドを実行する[ユーザー](../../../../admin-manual/auth/authentication-and-authorization.md)には、少なくとも次の[権限](../../../../admin-manual/auth/authentication-and-authorization.md)が必要です。

| 権限 | オブジェクト | 説明 |
| :---------------- | :------------------------ | :----------------------------------------------------------- |
| CREATE_PRIV | データベース | |
| SELECT_PRIV | テーブル、ビュー | CTAS を実行する場合、クエリ対象のテーブル、ビュー、またはマテリアライズドビューに対する SELECT_PRIV が必要です |

## 使用上の注意 {#usage-notes}

- データベース（Database）には、同じ名前のテーブル（Table）やビュー（View）が存在してはなりません。
- テーブル名、列名、rollup 名には[予約キーワード](../../../basic-element/reserved-keywords.md)を使用できません。
- CREATE TABLE ... LIKE：
  - このコマンドは Doris の内部テーブルにのみ使用できます。
  - 明示的に指定した rollup のみがコピーされます。
  - 同期マテリアライズドビューはすべて複製されません。
- CREATE TABLE ... AS SELECT（CTAS）：
  - SELECT リストの列名のエイリアスが有効な列名であれば、CTAS 文で列定義を指定する必要はありません。省略すると、列名とデータ型は元のクエリから推定されます。

    ```sql
    CREATE TABLE <table_name> AS SELECT ...
    ```
  - 次の構文で名前を明示的に指定することもできます。

    ```sql
    CREATE TABLE <table_name> ( <col1_name>, <col2_name>, ... ) AS SELECT ...
    ```

- パーティション分割とバケット分割
  - テーブルにはバケット列を指定する必要がありますが、パーティションは省略できます。詳細は、[データのパーティション分割](../../../../table-design/data-partitioning/data-bucketing.md)を参照してください。
  - Doris のテーブルには、パーティションを持つテーブルと持たないテーブルがあります。この属性はテーブル作成時に決まり、後から変更できません。パーティションを持つテーブルでは、後からパーティションを追加または削除できます。一方、パーティションを持たないテーブルには、後からパーティションを追加できません。
  - テーブル作成後にパーティション列とバケット列を変更することはできません。これらの列の型を変更したり、列を追加または削除したりすることもできません。
- 動的パーティション分割
  - 動的パーティション分割は、パーティションの管理を自動化する機能です。ルールを設定すると、Doris は定期的に新しいパーティションを追加し、古いパーティションを削除します。詳細は、[動的パーティション分割](../../../../table-design/data-partitioning/dynamic-partitioning.md)を参照してください。
- 自動パーティション分割
  - 自動パーティション分割については、[自動パーティション分割](../../../../table-design/data-partitioning/auto-partitioning.md)を参照してください。
- 同期マテリアライズドビュー
  - テーブル作成時に複数の同期マテリアライズドビュー（ROLLUP）を作成できます。テーブル作成後に追加することもできます。テーブル作成文に含めると、すべての同期マテリアライズドビューをまとめて作成できます。
  - テーブル作成時に同期マテリアライズドビューを作成した場合、その後のすべてのデータインポートでは、マテリアライズドビューのデータも同期的に生成されます。マテリアライズドビューの数は、データインポートの効率に影響する場合があります。
  - 詳細は、[同期マテリアライズドビュー](../../../../query-acceleration/materialized-view/sync-materialized-view.md)を参照してください。
- インデックス
  - テーブル作成時に複数の列インデックスを作成できます。テーブル作成後に追加することもできます。
  - テーブルに既存のデータがある状態でインデックスを追加すると、すべてのデータを書き直す必要があります。そのため、インデックスの作成時間は現在のデータ量によって変わります。


## 例 {#examples}

### 基本的な例 {#basic-examples}

**明細モデル**

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

**バケット分割方法**

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

**自動パーティション分割**

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

**RANGE パーティション分割**

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

**LIST パーティション分割**

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

**ストレージ媒体とクールダウン時刻**

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

**`storage_policy` プロパティによるテーブルのホット・コールド階層間のデータ移行戦略の設定**

1. テーブルに移行戦略を関連付けるには、先に s3 リソースとストレージポリシーを作成する必要があります。

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

**テーブルのレプリカプロパティの設定**

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

**動的パーティション分割**

このテーブルは 3 日先までのパーティションを作成し、3 日前のパーティションを削除します。たとえば、今日が `2020-01-08` の場合、`p20200108`、`p20200109`、`p20200110`、`p20200111` という名前のパーティションを作成します。パーティションの範囲は次のとおりです。

```Plain
[types: [DATE]; keys: [2020-01-08]; ‥types: [DATE]; keys: [2020-01-09]; )
[types: [DATE]; keys: [2020-01-09]; ‥types: [DATE]; keys: [2020-01-10]; )
[types: [DATE]; keys: [2020-01-10]; ‥types: [DATE]; keys: [2020-01-11]; )
[types: [DATE]; keys: [2020-01-11]; ‥types: [DATE]; keys: [2020-01-12]; )
```

```sql
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

**動的パーティションのレプリカプロパティの設定**

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

### CTAS の例 {#ctas-example}

```sql
CREATE TABLE t10
PROPERTIES (
  'replication_num' = '1'
)
AS SELECT * FROM t1;
```

### CREATE TABLE ... LIKE の例 {#create-table--like-example}

```sql
CREATE TABLE t11 LIKE t10;
```
