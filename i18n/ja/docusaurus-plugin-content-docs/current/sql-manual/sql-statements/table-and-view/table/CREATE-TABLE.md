---
{
    "title": "CREATE TABLE",
    "language": "ja",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "現在のデータベースまたは指定したデータベースに新しいテーブルを作成します。テーブルには複数のカラムを定義でき、各カラム定義には名前とデータ型、"
}
---

## 説明 {#description}

現在のデータベースまたは指定したデータベースに新しいテーブルを作成します。テーブルには複数のカラムを定義でき、各カラム定義には名前とデータ型に加えて、必要に応じて次の属性を指定できます。

- キーかどうか
- 集約の意味を持つかどうか
- 生成カラムかどうか
- 値が必須かどうか（NOT NULL）
- 自動採番カラムかどうか
- 挿入時のデフォルト値があるかどうか
- 更新時のデフォルト値があるかどうか

また、このコマンドは次の構文にも対応しています。

- CREATE TABLE … AS SELECT（データを格納した状態でテーブルを作成します。CTAS とも呼ばれます）
- CREATE TABLE … LIKE（既存のテーブルから空のコピーを作成します）

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

> 注: `ORDER BY` は 4.1.0 以降でサポートされています。

各要素の定義は次のとおりです。

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

- 各要素の定義は次のとおりです。

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

## 構文のバリエーション {#varaint-syntax}

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

> 注: `ORDER BY` は 4.1.0 以降でサポートされています。

### CREATE TABLE ... LIKE {#create-table--like}

既存のテーブルと同じカラム定義を持つ新しいテーブルを作成します。既存のテーブルのデータはコピーされません。カラムのすべてのプロパティが新しいテーブルに複製されます。`rollup` 名のリストを指定した場合は、元のテーブルの対応する `rollup` も複製されます。

```sql
CREATE TABLE <new_table_name> LIKE <existing_table_name>
[ WITH ROLLUP ( <rollup_list> ) ];
```

## 必須パラメータ {#required-parameters}

**<name>**

> テーブルの識別子（名前）を指定します。テーブルを作成するデータベース内で一意である必要があります。
>
> 識別子は文字で始める必要があります。Unicode 名のサポートが有効な場合は、任意の言語の文字を使用できます。識別子全体をバッククォートで囲まない限り、スペースや特殊文字は使用できません（例: ``My Object``）。
>
> 予約済みキーワードは識別子として使用できません。
>
> 詳細については、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約済みキーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**<col_name>**

> カラムの識別子（名前）を指定します。作成するテーブル内で一意である必要があります。
>
> 識別子は文字（Unicode 名のサポートが有効な場合は任意の言語の文字）、数字、または記号 `@` で始める必要があります。識別子全体をバッククォートで囲まない限り、スペースや特殊文字は使用できません（例: ``My Object``）。
>
> 詳細については、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約済みキーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**<col_type>**

> カラムのデータ型を指定します。
>
> テーブルのカラムに指定できるデータ型については、[データ型](../../../basic-element/sql-data-types/data-type-overview.md)を参照してください。

**<query>**

> CTAS の必須パラメータです。データの格納に使用する SELECT 文を指定します。

**<source_table>**

> CREATE TABLE ... LIKE の必須パラメータです。コピー元のテーブルを指定します。

## オプションパラメータ {#optional-parameters}

### データモデル関連のパラメータ {#data-model-related-parameters}

**<key_type>**

> テーブルのデータモデルです。指定できる値は DUPLICATE（明細モデル）、UNIQUE（主キーモデル）、AGGREGATE（集約モデル）です。データモデルの詳細については、[データモデル](../../../../table-design/data-model/intro.mdx)を参照してください。

**<key_cols>**

> テーブルのキーカラムです。Doris では、キーカラムはテーブルの先頭から K 個のカラムである必要があります。単一のタブレット内のデータは、これらのカラムの順序に従って保持されます。キーに関する制約とキーカラムの選び方については、[データモデル](../../../../table-design/data-model/intro.mdx)の各セクションを参照してください。

**<cluster_cols>**

> データをローカルでソートするカラムです。データモデルが UNIQUE（主キーモデル）の場合にのみ使用できます。`<cluster_cols>` を指定すると、データは `<key_cols>` ではなく `<cluster_cols>` に従ってソートされます。

**<col_aggregate_type>**

> カラムの集約方法です。テーブルが集約モデルの場合にのみ使用できます。集約方法の詳細については、[集約モデル](../../../../table-design/data-model/aggregate.md)を参照してください。

### バケット分割関連のパラメータ {#bucketing-related-parameters}

**<distribute_cols> and <bucket_count>**

> バケット分割に使用するカラムとバケット数です。明細モデルでは任意のカラムをバケット分割に使用できますが、集約モデルと主キーモデルではキーカラムと一致させる必要があります。バケット数には任意の正の整数を指定できます。詳細については、[手動バケット分割](../../../../table-design/data-partitioning/data-bucketing#1-manually-set-the-number-of-buckets)と[自動バケット分割](../../../../table-design/data-partitioning/data-bucketing#2-automatically-set-the-number-of-buckets)を参照してください。

### カラムのデフォルト値に関連するパラメータ {#column-default-value-related-parameters}

**[ GENERATED ALWAYS ] AS (<col_generate_expression>)**

> 生成カラムです。現在のカラムより前にあるカラムを使用し、式 `<col_generate_expression>` によって現在のカラムのデータを生成します。生成カラムは、ユーザーが値を直接挿入または更新する代わりに、ほかのカラムの値から値を計算する特殊なテーブルカラムです。この機能を使うと、式の結果を事前に計算してデータベースに保存でき、頻繁なクエリや複雑な計算が必要な場合に適しています。

**AUTO_INCREMENT(<col_auto_increment_start_value>)**

> データのインポート時、自動採番カラムの値を指定していない行に対し、Doris はテーブル内で一意の値を割り当てます。`<col_auto_increment_start_value>` は自動採番カラムの開始値を指定します。詳細については、[自動採番カラム](../../../../table-design/auto-increment.md)を参照してください。

**DEFAULT <col_default_value>**

> カラムのデフォルト値です。このカラムを含めずに書き込む場合に使用されます。デフォルト値を明示的に設定しない場合は NULL が使用されます。指定できるデフォルト値は次のとおりです。
>
> - NULL: すべての型で使用でき、NULL をデフォルト値にします。
> - 数値リテラル: 数値型でのみ使用できます。
> - 文字列リテラル: 文字列型のカラムで使用できます。UUID カラムでは、有効な UUID テキストもデフォルト値として指定できます。
> - UUID_V4() / UUID_V7(): UUID カラムとそのエイリアスで使用できる動的なデフォルト値です。カラムを省略した場合、行ごとに値が生成されます。[UUID 型](../../../basic-element/sql-data-types/uuid.md)を参照してください。
> - CURRENT_DATE: 日付型でのみ使用できます。現在の日付をデフォルト値にします。
> - CURRENT_TIMESTAMP [ <defaultValuePrecision> ]: `DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` 型でのみ使用できます。現在のタイムスタンプをデフォルト値にします。`<defaultValuePrecision>` で時刻の精度を指定でき、`TIMESTAMP_NS` は最大 9 桁をサポートします。
> - PI: double 型でのみ使用できます。円周率をデフォルト値にします。
> - E: double 型でのみ使用できます。数学定数 e をデフォルト値にします。
> - BITMAP_EMPTY: カラムが bitmap 型の場合にのみ使用できます。空の bitmap を格納します。

**ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>)**

> データの更新時にこのカラムの値を指定しなかった場合、現在のタイムスタンプを使ってカラムのデータを更新します。UNIQUE（主キーモデル）のテーブルでのみ使用できます。

### インデックス関連のパラメータ {#index-related-parameters}

**<index_name>**

> インデックスの識別子（名前）を指定します。作成するテーブル内で一意である必要があります。識別子の詳細については、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約済みキーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**<index_cols>**

> インデックスを追加するカラムのリストです。テーブル内に存在するカラムを指定する必要があります。

**<index_type>**

> インデックスの種類です。現在サポートされているのは INVERTED のみです。

**<index_property>**

> インデックスのプロパティです。詳しくは[転置インデックス](../../../../table-design/index/inverted-index/overview.md)を参照してください。

### 自動パーティション関連のパラメータ {#auto-partition-related-parameters}

パーティション分割の詳細については、[自動パーティション分割](../../../../table-design/data-partitioning/auto-partitioning.md)を参照してください。

### 手動パーティション分割関連のパラメータ {#manual-partitioning-related-parameters}

パーティション分割の詳細については、「手動パーティション分割」のセクションを参照してください。

**<partition_type>**

> Doris は RANGE パーティション分割と LIST パーティション分割をサポートします。詳細については、[手動パーティション分割](../../../../table-design/data-partitioning/manual-partitioning.md)を参照してください。

**<partition_name>**

> パーティションの識別子（名前）です。作成するテーブル内で一意である必要があります。識別子の詳細については、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約済みキーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**VALUES LESS THAN <partition_value_list>**

> RANGE パーティション分割です。パーティションのデータ範囲は下限から `<partition_value_list>` までです。
>
> 上限を表す場合、`<partition_value_list>` は `MAX_VALUE` に簡略化できます。
>
> `<partition_value_list>` の形式は `((col_1_value, ...), (col_1_value, ...), ...)` です。

**VALUES [ <partition_lower_bound>, <partition_upper_bound>)**

> RANGE パーティション分割です。パーティションのデータ範囲は `<partition_lower_bound>` から `<partition_upper_bound>` までです。作成されるパーティションはひとつだけです。
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

> LIST パーティション分割です。パーティションカラムの値が `<partition_value>` と等しい行が、このパーティションに属します。
>
> `<partition_value>` の形式は `(col_1_value, ...)` です。


### 同期マテリアライズドビュー関連 {#synchronized-materialized-view-related}

:::caution 注意
rollup を使用して同期マテリアライズドビューを作成する機能には制限があるため、現在は推奨されません。同期マテリアライズドビューは個別の文で作成することをお勧めします。詳細については、[CREATE MATERIALIZED VIEW](../sync-materialized-view/CREATE-MATERIALIZED-VIEW.md) 文と[同期マテリアライズドビュー](../../../../query-acceleration/materialized-view/sync-materialized-view.md)を参照してください。
:::

**<rollup_name>**

> 同期マテリアライズドビューの識別子（名前）です。作成するテーブル内で一意である必要があります。識別子の詳細については、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約済みキーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**<rollup_cols>**

> 同期マテリアライズドビューに含めるカラムです。

### テーブルプロパティ関連のパラメータ {#table-property-related-parameters}

**<table_property>**

| プロパティ名 | 機能 |
| :------------ | :-------- |
| replication_num | レプリカ数。デフォルトは 3 です。BE ノード数が 3 未満の場合は、BE ノード数以下のレプリカ数を指定する必要があります。バージョン 0.15 以降、このプロパティは自動的に `replication_allocation` プロパティに変換されます。たとえば、`"replication_num" = "3"` は自動的に `"replication_allocation" = "tag.location.default:3"` に変換されます。 |
| replication_allocation | Tags に基づいてレプリカの配置を設定します。このプロパティは `replication_num` プロパティの機能を完全に置き換えることができます。 |
| min_load_replica_num | データインポートが成功するために必要な最小レプリカ数を設定します。デフォルト値は -1 です。このプロパティが 0 以下の場合、データインポートには引き続き過半数のレプリカでの成功が必要です。 |
| storage_medium | テーブルデータの初期ストレージメディアを指定します。 |
| storage_cooldown_time | テーブルデータの初期ストレージメディアの有効期限を設定します。この時刻を過ぎると、第一階層のストレージメディアへ自動的に移行します。 |
| colocate_with | Colocation Join 機能が必要な場合に、Colocation Group を設定します。 |
| bloom_filter_columns | Bloom Filter インデックスを追加するカラム名のリストです。各カラムの Bloom Filter インデックスは独立しており、複合インデックスではありません。例: `"bloom_filter_columns" = "k1, k2, k3"` |
| compression | バージョン 4.0.3 以降、Doris テーブルのデフォルトの圧縮方式は ZSTD です。バージョン 4.0.3 より前は LZ4F でした。 |
| function_column.sequence_col | Unique Key モデルでは、Sequence カラムを指定できます。Key カラムが同じ場合、Sequence カラムに従って REPLACE が実行されます（値が大きければ小さい値を置き換え、それ以外の場合は置き換えられません）。`function_column.sequence_col` は、シーケンスカラムをテーブル内の特定のカラムに対応付けます。このカラムには整数型または日時型（`DATE`、`DATETIME`、`TIMESTAMP_NS`）を使用できます。作成後にこのカラムの型は変更できません。`function_column.sequence_col` を設定した場合、`function_column.sequence_type` は無視されます。 |
| function_column.sequence_type | Unique Key モデルでは、Sequence カラムを指定できます。Key カラムが同じ場合、Sequence カラムに従って REPLACE が実行されます（値が大きければ小さい値を置き換え、それ以外の場合は置き換えられません）。ここではシーケンスカラムの型のみ指定します。日時型（`DATE`、`DATETIME`、`TIMESTAMP_NS`）または整数型を使用できます。Doris は非表示のシーケンスカラムを作成します。 |
| enable_unique_key_merge_on_write | Unique テーブルで Merge-on-Write 実装を使用するかどうかを指定します。バージョン 2.1 より前はデフォルトで無効、バージョン 2.1 以降はデフォルトで有効です。 |
| light_schema_change | Light Schema Change 最適化を使用するかどうかを指定します。`true` に設定すると、値カラムの追加と削除をより高速かつ同期的に完了できます。この機能はバージョン 2.0.0 以降でデフォルトで有効です。 |
| disable_auto_compaction | このテーブルの自動 compaction を無効にするかどうかを指定します。`true` に設定すると、バックグラウンドの自動 compaction 処理はこのテーブルのすべてのタブレットをスキップします。 |
| enable_duplicate_without_keys_by_default | `true` に設定し、テーブル作成時に Unique、Aggregate、Duplicate のいずれも指定しなかった場合、ソートカラムとプレフィックスインデックスを持たない Duplicate モデルのテーブルがデフォルトで作成されます。 |
| skip_write_index_on_load | このテーブルへのデータインポート時にインデックスを書き込まないようにするかどうかを指定します。`true` に設定すると、データインポート時にはインデックスを書き込まず（現在は転置インデックスにのみ有効）、compaction 時まで遅延させます。これにより、初回の書き込みと compaction でインデックスを繰り返し書き込む際の CPU と IO の消費を抑え、大量データのインポート性能を改善できます。 |
| compaction_policy | このテーブルの compaction 結合ポリシーを設定します。サポートされるのは time_series または size_based のみです。time_series: rowset のディスク上の容量が一定のサイズに達すると、バージョンの結合が行われます。結合された rowset は直接 base compaction フェーズに進みます。これにより、継続的にインポートする場合の compaction による書き込み増幅を効果的に抑えられます。このポリシーでは、time_series_compaction で始まるパラメータを使用して compaction の実行を調整します。 |
| time_series_compaction_goal_size_mbytes | compaction 結合ポリシーが time_series の場合、各 compaction の入力ファイルのサイズを調整します。出力ファイルのサイズは入力ファイルと同程度になります。 |
| time_series_compaction_file_count_threshold | compaction 結合ポリシーが time_series の場合、各 compaction に必要な入力ファイルの最小数を調整します。タブレット内のファイル数がこの設定値を超えると compaction が開始されます。 |
| time_series_compaction_time_threshold_seconds | compaction 結合ポリシーが time_series の場合、compaction 間の最長間隔を秒単位で調整します。長時間実行されていない場合は compaction が開始されます。 |
| time_series_compaction_level_threshold | compaction 結合ポリシーが time_series の場合、このパラメータのデフォルト値は 1 です。2 に設定すると、一度結合されたセグメントを再度結合するよう制御し、セグメントサイズが time_series_compaction_goal_size_mbytes に達するようにして、セグメント数を減らします。 |
| group_commit_interval_ms | このテーブルの Group Commit のバッチ間隔を設定します。単位は ms、デフォルト値は 10000ms（10s）です。Group Commit の実行タイミングは、`group_commit_interval_ms` と `group_commit_data_bytes` のどちらが先に設定値に達するかによって決まります。 |
| group_commit_data_bytes | このテーブルの Group Commit のバッチデータサイズを設定します。単位はバイト、デフォルト値は 134217728（128MB）です。Group Commit の実行タイミングは、`group_commit_interval_ms` と `group_commit_data_bytes` のどちらが先に設定値に達するかによって決まります。 |
| enable_mow_light_delete | Mow を使用する Unique テーブルで、Delete 文によって Delete predicate を書き込むかどうかを指定します。有効にすると Delete 文の性能が向上しますが、Delete 後にカラムの一部を更新すると、データに誤りが生じる場合があります。無効にすると、正確性を確保するために Delete 文の性能が低下します。デフォルト値は `false` です。このプロパティは Unique Merge-on-Write テーブルでのみ有効にできます。 |
| Dynamic Partitioning Related Properties | 動的パーティション分割については、[データのパーティション分割 - 動的パーティション分割](../../../../table-design/data-partitioning/dynamic-partitioning)を参照してください。 |
| enable_unique_key_skip_bitmap_column | Unique Merge-on-Write テーブルで[柔軟なカラム更新機能](../../../../data-operate/update/partial-column-update.md#flexible-column-update)を有効にするかどうかを指定します。このプロパティは Unique Merge-on-Write テーブルでのみ有効にできます。 |
| changelog.enable | テーブルの[changelog](../../../../data-operate/incremental/changelog)を有効にし、Table Stream による利用と `@incr` 増分クエリのために行レベルの変更を記録します。Duplicate Key テーブルと、クラスタキーのない Unique Key Merge-on-Write テーブルのみがサポートされます。テーブル作成時にのみ有効化でき、後から無効化することはできません。`binlog.enable`（CCR）との併用もできません。FE で `enable_feature_changelog = true` が必要です。5.0.0 以降で使用できます。 |
| changelog.need_historical_value | changelog に変更前の値（before image）を記録するかどうかを指定します。デフォルトは `false` です。`true` に設定できるのは Unique Key Merge-on-Write テーブルのみで、`min_delta` / `detail` Table Streams はこの設定に依存します。作成後は変更できません。 |
| changelog.ttl_seconds | 変更レコードの保持期間を秒単位で指定します。デフォルトは `86400`（一日）で、`0` より大きい値にする必要があります。`ALTER TABLE` で変更できます。 |

## アクセス制御要件 {#access-control-requirements}

この SQL コマンドを実行する[ユーザー](../../../../admin-manual/auth/authentication-and-authorization.md)には、少なくとも次の[権限](../../../../admin-manual/auth/authentication-and-authorization.md)が必要です。

| 権限 | オブジェクト | 説明 |
| :---------------- | :------------------------ | :----------------------------------------------------------- |
| CREATE_PRIV | データベース | |
| SELECT_PRIV | テーブル、ビュー | CTAS の実行時、クエリ対象のテーブル、ビュー、またはマテリアライズドビューに対する SELECT_PRIV が必要です。 |

## 使用上の注意 {#usage-notes}

- データベース（Database）内に、同じ名前のテーブル（Table）またはビュー（View）が存在してはいけません。
- テーブル名、カラム名、rollup 名には[予約済みキーワード](../../../basic-element/reserved-keywords.md)を使用できません。
- CREATE TABLE ... LIKE:
  - このコマンドは Doris の内部テーブルにのみ使用できます。
  - 明示的に指定した rollup のみがコピーされます。
  - 同期マテリアライズドビューは複製されません。
- CREATE TABLE ... AS SELECT（CTAS）:
  - SELECT リスト内のカラム名のエイリアスが有効なカラム名であれば、CTAS 文でカラム定義を指定する必要はありません。省略すると、カラム名とデータ型は元のクエリから推論されます。

    ```sql
    CREATE TABLE <table_name> AS SELECT ...
    ```
  - また、次の構文を使って名前を明示的に指定することもできます。

    ```sql
    CREATE TABLE <table_name> ( <col1_name>, <col2_name>, ... ) AS SELECT ...
    ```

- パーティション分割とバケット分割
  - テーブルにはバケット分割に使用するカラムを指定する必要がありますが、パーティションの指定は省略できます。詳細については、[データのパーティション分割](../../../../table-design/data-partitioning/data-bucketing.md)を参照してください。
  - Doris のテーブルには、パーティション分割されたテーブルと、分割されていないテーブルがあります。この属性はテーブル作成時に決まり、後から変更できません。パーティション分割されたテーブルでは後からパーティションを追加または削除できますが、分割されていないテーブルに後からパーティションを追加することはできません。
  - パーティションカラムとバケット分割カラムはテーブル作成後に変更できません。これらのカラムの型を変更したり、カラムを追加または削除したりすることもできません。
- 動的パーティション分割
  - 動的パーティション分割機能は、主にパーティションの自動管理を支援します。ルールを設定すると、Doris が定期的に新しいパーティションを追加し、古いパーティションを削除します。詳しくは[動的パーティション分割](../../../../table-design/data-partitioning/dynamic-partitioning.md)を参照してください。
- 自動パーティション分割
  - 自動パーティション分割については、[自動パーティション分割](../../../../table-design/data-partitioning/auto-partitioning.md)を参照してください。
- 同期マテリアライズドビュー
  - テーブルの作成時に複数の同期マテリアライズドビュー（ROLLUP）を作成できます。テーブル作成後に追加することもできます。テーブル作成文に含めると、すべての同期マテリアライズドビューを一度に作成できます。
  - テーブル作成時に同期マテリアライズドビューを作成すると、以降のすべてのデータインポートでマテリアライズドビュー用のデータも同期的に生成されます。マテリアライズドビューの数がデータインポートの効率に影響する場合があります。
  - 詳細については、[同期マテリアライズドビュー](../../../../query-acceleration/materialized-view/sync-materialized-view.md)を参照してください。
- インデックス
  - テーブルの作成時に複数のカラムインデックスを作成できます。テーブル作成後に追加することもできます。
  - 既存のデータがあるテーブルに後からインデックスを追加する場合は、すべてのデータを書き直す必要があります。そのため、インデックスの作成時間は、その時点のデータ量によって決まります。


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

**生成カラムの使用**

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

**カラムのデフォルト値の指定**

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

**バケット分割方式**

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

**ストレージメディアとクールダウン時刻**

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

**`storage_policy` プロパティを使ったテーブルのホット・コールド階層間データ移行戦略の設定**

1. テーブルに移行戦略を関連付けるには、最初に s3 リソースとストレージポリシーを作成する必要があります。

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

**動的パーティション分割**

このテーブルは、三日先までのパーティションを作成し、三日前のパーティションを削除します。たとえば、今日が `2020-01-08` の場合、`p20200108`、`p20200109`、`p20200110`、`p20200111` という名前のパーティションを作成します。パーティションの範囲は次のとおりです。

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
