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

現在のデータベースまたは指定したデータベースに新しいテーブルを作成します。テーブルには複数の列を定義でき、各列の定義には名前、データ型に加え、必要に応じて次の属性を指定できます。

- キー列かどうか
- 集約セマンティクスがあるかどうか
- 生成列かどうか
- 値が必須かどうか（NOT NULL）
- 自動採番列かどうか
- 挿入時のデフォルト値があるかどうか
- 更新時のデフォルト値があるかどうか

このコマンドには、次の形式もあります。

- CREATE TABLE … AS SELECT（データを格納したテーブルを作成する。CTAS とも呼ばれる）
- CREATE TABLE … LIKE（既存のテーブルの空のコピーを作成する）

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

## 別の構文 {#varaint-syntax}

### CREATE TABLE ... AS SELECT（CTAS とも呼ばれる） {#create-table--as-select-also-referred-to-as-ctas}

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

既存のテーブルと同じ列定義を持つ新しいテーブルを作成します。既存のテーブルのデータはコピーしません。列のすべての属性が新しいテーブルに複製されます。`rollup` 名のリストを指定すると、元のテーブルにある対応する `rollup` も複製されます。

```sql
CREATE TABLE <new_table_name> LIKE <existing_table_name>
[ WITH ROLLUP ( <rollup_list> ) ];
```

## 必須パラメータ {#required-parameters}

**<name>**

> テーブルの識別子（名前）を指定します。テーブルを作成するデータベース内で一意でなければなりません。
>
> 識別子は文字で始める必要があります。Unicode 名のサポートが有効な場合は、どの言語の文字でも使用できます。識別子全体をバッククォートで囲む場合（例: ``My Object``）を除き、空白や特殊文字は含められません。
>
> 予約キーワードは識別子として使用できません。
>
> 詳細は、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約キーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**<col_name>**

> 列の識別子（名前）を指定します。作成するテーブル内で一意でなければなりません。
>
> 識別子は文字、数字、または記号 `@` で始める必要があります。Unicode 名のサポートが有効な場合は、どの言語の文字でも使用できます。識別子全体をバッククォートで囲む場合（例: ``My Object``）を除き、空白や特殊文字は含められません。
>
> 詳細は、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約キーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**<col_type>**

> 列のデータ型を指定します。
>
> テーブルの列に指定できるデータ型については、[データ型](../../../basic-element/sql-data-types/data-type-overview.md)を参照してください。

**<query>**

> CTAS の必須パラメータです。データを格納するための SELECT 文を指定します。

**<source_table>**

> CREATE TABLE ... LIKE の必須パラメータです。コピー元のテーブルを指定します。

## オプションパラメータ {#optional-parameters}

### データモデルに関するパラメータ {#data-model-related-parameters}

**<key_type>**

> テーブルのデータモデルです。指定できる値は DUPLICATE（明細モデル）、UNIQUE（主キーモデル）、AGGREGATE（集約モデル）です。詳細は、[データモデル](../../../../table-design/data-model/intro.mdx)を参照してください。

**<key_cols>**

> テーブルのキー列です。Doris では、Key 列はテーブルの先頭 K 列でなければなりません。単一の tablet 内のデータは、これらの列の順序に従って保持されます。Key に関する制約とキー列の選び方については、[データモデル](../../../../table-design/data-model/intro.mdx)の各節を参照してください。

**<cluster_cols>**

> データを局所的にソートする列です。データモデルが UNIQUE（主キーモデル）の場合にのみ使用できます。`<cluster_cols>` を指定すると、データは `<key_cols>` の代わりに `<cluster_cols>` でソートされます。

**<col_aggregate_type>**

> 列の集約方法です。テーブルが集約モデルの場合にのみ使用できます。詳細は、[集約モデル](../../../../table-design/data-model/aggregate.md)を参照してください。

### バケット分割に関するパラメータ {#bucketing-related-parameters}

**<distribute_cols> と <bucket_count>**

> バケット分割に使用する列とバケット数です。明細モデルでは任意の列をバケット分割に使用できます。集約モデルと主キーモデルでは、バケット分割に使用する列をキー列と一致させる必要があります。バケット数には任意の正の整数を指定できます。詳細は、[手動でのバケット分割](../../../../table-design/data-partitioning/data-bucketing#1-manually-set-the-number-of-buckets)と[自動でのバケット分割](../../../../table-design/data-partitioning/data-bucketing#2-automatically-set-the-number-of-buckets)を参照してください。

### 列のデフォルト値に関するパラメータ {#column-default-value-related-parameters}

**[ GENERATED ALWAYS ] AS (<col_generate_expression>)**

> 生成列です。現在の列より前にある列を使い、式 `<col_generate_expression>` によって現在の列のデータを生成します。生成列は、ユーザーが値を直接挿入または更新する代わりに、ほかの列の値から値を計算する特殊な列です。この機能では、式の結果を事前に計算してデータベースに保存できるため、頻繁なクエリや複雑な計算が必要な場合に適しています。

**AUTO_INCREMENT(<col_auto_increment_start_value>)**

> データのインポート時、自動採番列の値が指定されていない行には、Doris がテーブル内で一意の値を割り当てます。`<col_auto_increment_start_value>` は自動採番列の開始値を指定します。詳細は、[自動採番列](../../../../table-design/auto-increment.md)を参照してください。

**DEFAULT <col_default_value>**

> 列のデフォルト値です。この列を含めずにデータを書き込むと、デフォルト値が使用されます。デフォルト値を明示的に設定しない場合は NULL が使用されます。使用できるデフォルト値は次のとおりです。
>
> - NULL: すべての型で使用でき、NULL をデフォルト値にします。
> - 数値リテラル: 数値型にのみ使用できます。
> - 文字列リテラル: 文字列型の列に使用します。UUID 列にも有効な UUID テキストをデフォルト値として指定できます。
> - UUID_V4() / UUID_V7(): UUID 列で使用できる動的なデフォルト値で、別名も含みます。列を省略すると、行ごとに値が生成されます。[UUID 型](../../../basic-element/sql-data-types/uuid.md)を参照してください。
> - CURRENT_DATE: 日付型にのみ使用できます。現在の日付をデフォルト値にします。
> - CURRENT_TIMESTAMP [ <defaultValuePrecision> ]: `DATETIME`、`TIMESTAMP_NS`、`TIMESTAMPTZ` 型にのみ使用できます。現在のタイムスタンプをデフォルト値にします。`<defaultValuePrecision>` で時刻の精度を指定でき、`TIMESTAMP_NS` は最大 9 桁に対応します。
> - PI: double 型にのみ使用できます。円周率をデフォルト値にします。
> - E: double 型にのみ使用できます。数学定数 e をデフォルト値にします。
> - BITMAP_EMPTY: bitmap 型の列にのみ使用できます。空の bitmap を格納します。

**ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>)**

> データの更新時にこの列の値を指定しなかった場合、現在のタイムスタンプでこの列を更新します。UNIQUE（主キーモデル）のテーブルでのみ使用できます。

### インデックスに関するパラメータ {#index-related-parameters}

**<index_name>**

> インデックスの識別子（名前）を指定します。作成するテーブル内で一意でなければなりません。詳細は、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約キーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**<index_cols>**

> インデックスを追加する列のリストです。テーブルに存在する列を指定する必要があります。

**<index_type>**

> インデックスの種類です。現在は INVERTED のみをサポートしています。

**<index_property>**

> インデックスの属性です。詳細は、[転置インデックス](../../../../table-design/index/inverted-index/overview.md)を参照してください。

### 自動パーティション分割に関するパラメータ {#auto-partition-related-parameters}

パーティション分割の詳細は、[自動パーティション分割](../../../../table-design/data-partitioning/auto-partitioning.md)を参照してください。

### 手動パーティション分割に関するパラメータ {#manual-partitioning-related-parameters}

パーティション分割の詳細は、「手動パーティション分割」の節を参照してください。

**<partition_type>**

> Doris は RANGE パーティション分割と LIST パーティション分割をサポートします。詳細は、[手動パーティション分割](../../../../table-design/data-partitioning/manual-partitioning.md)を参照してください。

**<partition_name>**

> パーティションの識別子（名前）です。作成するテーブル内で一意でなければなりません。詳細は、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約キーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**VALUES LESS THAN <partition_value_list>**

> RANGE パーティション分割です。パーティションのデータ範囲は下限から `<partition_value_list>` までです。
>
> 上限を表す場合は、`<partition_value_list>` を `MAX_VALUE` と簡略化できます。
>
> `<partition_value_list>` の形式は `((col_1_value, ...), (col_1_value, ...), ...)` です。

**VALUES [ <partition_lower_bound>, <partition_upper_bound>)**

> RANGE パーティション分割です。パーティションのデータ範囲は `<partition_lower_bound>` から `<partition_upper_bound>` までです。作成されるパーティションは単一です。
>
> `<partition_lower_bound>` と `<partition_upper_bound>` の形式は `(col_1_value, ...)` です。

**FROM <partition_lower_bound> TO <partition_upper_bound>**

**INTERVAL <n> [ <datetime_unit> ]**

> RANGE パーティション分割です。パーティションのデータ範囲は `<partition_lower_bound>` から `<partition_value_list>` までです。`<n>` ごとにパーティションが作成されます。
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
rollup を使った同期マテリアライズドビューの作成機能には制限があり、現在は推奨されていません。同期マテリアライズドビューは個別の文で作成することを推奨します。詳細は、[CREATE MATERIALIZED VIEW](../sync-materialized-view/CREATE-MATERIALIZED-VIEW.md) 文と[同期マテリアライズドビュー](../../../../query-acceleration/materialized-view/sync-materialized-view.md)を参照してください。
:::

**<rollup_name>**

> 同期マテリアライズドビューの識別子（名前）です。作成するテーブル内で一意でなければなりません。詳細は、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約キーワード](../../../basic-element/reserved-keywords.md)を参照してください。

**<rollup_cols>**

> 同期マテリアライズドビューに含める列です。

### テーブル属性に関するパラメータ {#table-property-related-parameters}

以下の属性は OLAP テーブルに適用されます。`PROPERTIES ("name" = "value", ...)` では、属性値を引用符で囲んだ文字列として設定します。特定の機能で必須とされる場合を除き、属性は省略できます。デプロイ方式に応じた制約は各説明に示します。

**<table_property>**

| 属性名 | 機能 |
| :------------ | :-------- |
| replication_num | レプリカ数です。デフォルトは 3 です。BE ノード数が 3 未満の場合、レプリカ数には BE ノード数以下の値を指定する必要があります。バージョン 0.15 より後では、この属性は自動的に `replication_allocation` に変換されます。たとえば `"replication_num" = "3"` は `"replication_allocation" = "tag.location.default:3"` に変換されます。 |
| replication_allocation | Tag に基づいてレプリカの配置を設定します。この属性は `replication_num` の設定を完全に上書きできます。 |
| min_load_replica_num | データのインポートが成功するために必要なレプリカの最小数を設定します。デフォルト値は -1 です。この属性が 0 以下の場合も、インポートを成功させるには過半数のレプリカで成功する必要があります。 |
| storage_medium | テーブルデータの初期ストレージメディアを指定します。 |
| storage_cooldown_time | テーブルデータの初期ストレージメディアの有効期限を設定します。この時刻を過ぎると、自動的に第1階層のストレージメディアに移行します。 |
| colocate_with | Colocation Join 機能を使用する場合、このパラメータで Colocation Group を設定します。 |
| bloom_filter_columns | Bloom Filter インデックスを追加する列名のリストを指定します。各列の Bloom Filter インデックスは独立しており、複合インデックスではありません。例: `"bloom_filter_columns" = "k1, k2, k3"` |
| compression | バージョン 4.0.3 以降、Doris テーブルのデフォルトの圧縮方式は ZSTD です。4.0.3 より前は LZ4F でした。 |
| function_column.sequence_col | Unique Key モデルでは Sequence 列を指定できます。Key 列が同じ場合、Sequence 列に従って REPLACE が実行されます。値が大きい場合に小さい値を置き換え、それ以外では置き換えません。`function_column.sequence_col` は Sequence 列をテーブル内の特定の列に対応付けます。この列には整数型または日時型（`DATE`、`DATETIME`、`TIMESTAMP_NS`）を使用でき、作成後に型を変更することはできません。`function_column.sequence_col` を設定した場合、`function_column.sequence_type` は無視されます。 |
| function_column.sequence_type | Unique Key モデルでは Sequence 列を指定できます。Key 列が同じ場合、Sequence 列に従って REPLACE が実行されます。値が大きい場合に小さい値を置き換え、それ以外では置き換えません。ここでは Sequence 列の型のみを指定します。日時型（`DATE`、`DATETIME`、`TIMESTAMP_NS`）または整数型を使用できます。Doris は非表示の Sequence 列を作成します。 |
| enable_unique_key_merge_on_write | Unique テーブルで Merge-on-Write 実装を使用するかどうかを指定します。バージョン 2.1 より前はデフォルトで無効、2.1 以降はデフォルトで有効です。 |
| light_schema_change | Light Schema Change 最適化を使用するかどうかを指定します。`true` に設定すると、値列の追加と削除をより速く、同期的に完了できます。この機能はバージョン 2.0.0 以降でデフォルトで有効です。 |
| disable_auto_compaction | このテーブルの自動 compaction を無効にするかどうかを指定します。`true` に設定すると、バックグラウンドの自動 compaction はこのテーブルのすべての tablet をスキップします。 |
| enable_duplicate_without_keys_by_default | `true` に設定した場合、テーブルの作成時に Unique、Aggregate、Duplicate のいずれも指定しなければ、ソート列とプレフィックスインデックスを持たない Duplicate モデルのテーブルがデフォルトで作成されます。 |
| skip_write_index_on_load | このテーブルへのデータのインポート時に、インデックスを書き込まない設定を有効にするかどうかを指定します。`true` に設定すると、インポート時にはインデックスを書き込まず（現在は転置インデックスにのみ有効）、compaction 時まで書き込みを遅らせます。初回書き込みと compaction 時にインデックスを繰り返し書き込む際の CPU と IO の消費を抑え、大量データのインポート性能を向上できます。 |
| compaction_policy | このテーブルの compaction のマージポリシーを設定します。サポートされる値は time_series または size_basedtime_series のみです。time_series では、rowset のディスク上のサイズが一定量に達するとバージョンをマージします。マージされた rowset は直接 base compaction フェーズに進みます。これにより、継続的なインポート時の compaction による書き込み増幅を抑えられます。このポリシーでは、接頭辞が time_series_compaction のパラメータを使用して compaction の実行を調整します。 |
| time_series_compaction_goal_size_mbytes | compaction のマージポリシーが time_series の場合、各 compaction に入力するファイルのサイズを調整します。出力ファイルのサイズは入力ファイルと同程度になります。 |
| time_series_compaction_file_count_threshold | compaction のマージポリシーが time_series の場合、各 compaction に入力するファイルの最小数を調整します。tablet 内のファイル数がこの設定を超えると compaction が開始されます。 |
| time_series_compaction_time_threshold_seconds | compaction のマージポリシーが time_series の場合、compaction 間の最大間隔を秒単位で調整します。長時間 compaction が実行されていなければ開始されます。 |
| time_series_compaction_level_threshold | compaction のマージポリシーが time_series の場合、このパラメータのデフォルトは 1 です。2 に設定すると、一度マージした segment を再度マージし、segment のサイズが time_series_compaction_goal_size_mbytes に達するようにして、segment 数を減らします。 |
| group_commit_interval_ms | このテーブルの Group Commit のバッチ間隔を設定します。単位は ms、デフォルト値は 10000ms（10s）です。Group Commit の実行時期は、`group_commit_interval_ms` と `group_commit_data_bytes` のどちらが先に設定値に達するかで決まります。 |
| group_commit_data_bytes | このテーブルの Group Commit のバッチデータサイズを設定します。単位はバイト、デフォルト値は 134217728（128MB）です。Group Commit の実行時期は、`group_commit_interval_ms` と `group_commit_data_bytes` のどちらが先に設定値に達するかで決まります。 |
| enable_mow_light_delete | Mow を使用する Unique テーブルで、Delete 文による Delete predicate の書き込みを有効にするかどうかを指定します。有効にすると Delete 文の性能は向上しますが、Delete 後に一部の列を更新すると、データに誤りが生じる場合があります。無効にすると、正確性を確保する代わりに Delete 文の性能が低下します。デフォルト値は `false` です。Unique Merge-on-Write テーブルでのみ有効にできます。 |
| 動的パーティション分割に関する属性 | 動的パーティション分割については、[データのパーティション分割 - 動的パーティション分割](../../../../table-design/data-partitioning/dynamic-partitioning)を参照してください。 |
| enable_unique_key_skip_bitmap_column | Unique Merge-on-Write テーブルで[柔軟な列更新機能](../../../../data-operate/update/partial-column-update.md#flexible-column-update)を有効にするかどうかを指定します。この属性は Unique Merge-on-Write テーブルでのみ有効にできます。 |
| changelog.enable | テーブルで [changelog](../../../../data-operate/incremental/changelog) を有効にし、Table Stream での利用と `@incr` 増分クエリのために行単位の変更を記録します。Duplicate Key テーブルと、クラスタキーのない Unique Key Merge-on-Write テーブルのみをサポートします。テーブル作成時にのみ有効にでき、その後は無効にできません。`binlog.enable`（CCR）と併用できません。FE で `enable_feature_changelog = true` にする必要があります。5.0.0 以降で使用できます。 |
| changelog.need_historical_value | changelog に変更前の値（before image）を記録するかどうかを指定します。デフォルトは `false` です。Unique Key Merge-on-Write テーブルでのみ `true` に設定できます。`min_delta` / `detail` Table Stream はこの設定に依存します。作成後は変更できません。 |
| changelog.ttl_seconds | 変更記録の保持期間を秒単位で指定します。デフォルトは `86400`（1 日）で、`0` より大きい値が必要です。`ALTER TABLE` で変更できます。 |

#### その他の OLAP テーブル属性 {#additional-olap-table-properties}

| 属性 | 値の型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `short_key` | 整数 | 自動計算 | プレフィックスインデックスに使用する先頭のソート列の数です。正の値で、ソート列の数以下でなければなりません。VARCHAR 列は、選択した列の最後にのみ指定できます。 |
| `bloom_filter_fpp` | 倍精度浮動小数点数 | `0.05` | `bloom_filter_columns` の偽陽性率です。範囲は `[0.0001, 0.05]` です。Bloom Filter 列が設定されている場合にのみ有効です。[Bloom Filter](../../../../table-design/index/bloomfilter.md)を参照してください。 |
| `storage_type` | 文字列 | `COLUMN` | ストレージの構成です。指定できる値は `COLUMN` のみです。追加の行形式のコピーを有効にするには、以下の行ストア属性を使用します。 |
| `storage_format` | 文字列 | `V2` | segment のストレージ形式です。`V2`、`V3`、または `default`（`V2`）を指定できます。`V3` は 4.1.0 以降で使用でき、列のメタデータを外部に保存します。[ストレージ形式](../../../../table-design/storage-format.md)を参照してください。 |
| `inverted_index_storage_format` | 文字列 | FE の設定 | 転置インデックスの形式です。`V2`、`V3`、`default` を指定でき、4.2.0 以降は `SNII` もサポートされます。省略した場合や `default` を指定した場合は、FE の設定 `inverted_index_storage_format` が使用されます。4.1.5 以降、新しい V1 インデックスの作成は拒否されます。[転置インデックス](../../../../table-design/index/inverted-index/overview.md)を参照してください。 |
| `store_row_column` | 真偽値 | `false` | すべての列について、追加の行形式のコピーを保存します。`light_schema_change = true` が必要です。Aggregate Key テーブルはサポートされません。[行ストア](../../../../table-design/row-store.md)を参照してください。 |
| `row_store_columns` | 文字列 | 未設定 | 行形式で保存する既存の列名をコンマで区切って指定します。例: `k,v1,v2`。このリストを設定すると、指定した列の行ストアが有効になります。Aggregate Key テーブルはサポートされません。[行ストア](../../../../table-design/row-store.md)を参照してください。 |
| `row_store_page_size` | 長整数 | `16384` | 行ストアのページサイズをバイト単位で指定します。正の値が必要で、4096 バイトの倍数に切り上げられます。 |
| `storage_page_size` | 長整数 | `65536` | 列データのページサイズをバイト単位で指定します。範囲は `4096` から `10485760` で、4096 バイトの倍数に切り上げられます。 |
| `storage_dict_page_size` | 長整数 | `262144` | 辞書ページのサイズをバイト単位で指定します。範囲は `0` から `104857600` で、4096 バイトの倍数に切り上げられます。 |
| `storage_policy` | 文字列 | 未設定 | コンピュートとストレージが一体のテーブルで使用する、既存のリモートストレージポリシーです。Unique Key Merge-on-Write テーブルではサポートされず、コンピュートとストレージの分離モードでは無視されます。[リモートストレージ](../../../../table-design/tiered-storage/remote-storage.md)を参照してください。 |
| `storage_vault_name` | 文字列 | データベースの vault、次にデフォルトの vault | コンピュートとストレージの分離モードで使用する Storage Vault の名前です。vault が存在し、ユーザーがその vault に対する `USAGE` 権限を持っている必要があります。テーブルの設定は、データベースおよびデフォルトの vault の設定より優先されます。[Storage Vault の管理](../../../../compute-storage-decoupled/managing-storage-vault.md)を参照してください。 |
| `file_cache_ttl_seconds` | 長整数 | `0` | コンピュートとストレージの分離モードで、TTL キャッシュを保護する期間を秒単位で指定します。`0` では通常のキャッシュが使用されます。4.1.4 以降、検証される範囲は `0` から `4611686018427387903` です。データの有効期限を設定する属性ではありません。[ファイルキャッシュ](../../../../compute-storage-decoupled/file-cache/file-cache.md)を参照してください。 |
| `estimate_partition_size` | 文字列 | 未設定 | 単一パーティションの非圧縮サイズの推定値です。例: `10G`。`BUCKETS AUTO` とともに使用して、初期バケット数を選択します。[バケット分割](../../../../table-design/data-partitioning/data-bucketing.md)を参照してください。 |
| `mutable` | 真偽値 | `true` | パーティションがデータロードを受け付けるかどうかを指定します。`false` にすると変更不可になります。テーブル単位の設定は各パーティションのデフォルトになります。 |
| `partition.retention_count` | 整数 | 未設定 | AUTO RANGE PARTITION テーブルで保持する過去のパーティションの数です。正の値が必要です。現在と将来のパーティションは保持されます。4.1.4 以降、有効な動的パーティション分割とは併用できません。[自動パーティション分割](../../../../table-design/data-partitioning/auto-partitioning.md)を参照してください。 |
| `vertical_compaction_num_columns_per_group` | 整数 | `5` | 垂直 compaction 中にグループごとに処理する列の数です。`1` 以上でなければなりません。 |
| `time_series_compaction_empty_rowsets_threshold` | 長整数 | `5` | 優先的に compaction する連続した空の rowset の最小数です。`2` 以上で、`compaction_policy = time_series` が必要です。 |
| `group_commit_mode` | 文字列 | `off_mode` | このテーブルのデフォルトの Group Commit モードです。`off_mode`、`sync_mode`、`async_mode` を指定できます。4.1.0 以降でサポートされます。リクエストまたはセッションの設定が優先されます。[Group Commit](../../../../data-operate/import/load-best-practices/group-commit-manual.md)を参照してください。 |
| `binlog.enable` | 真偽値 | `false` | このテーブルの CCR binlog を有効にします。FE でも `enable_feature_binlog` を有効にする必要があります。 |
| `binlog.ttl_seconds` | 長整数 | `86400` | CCR binlog の保持期間のしきい値です。単位は秒です。 |
| `binlog.max_bytes` | 長整数 | `9223372036854775807` | CCR binlog のガベージコレクションに使用するサイズのしきい値です。単位はバイトです。 |
| `binlog.max_history_nums` | 長整数 | `9223372036854775807` | CCR binlog のガベージコレクションに使用する履歴件数のしきい値です。 |
| `is_being_synced` | 真偽値 | `false` | CCR の宛先テーブルが同期中であることを示します。`true` の場合、Doris はそのテーブルの動的パーティション分割のスケジュールをスキップし、colocate とストレージポリシーの設定を無視します。この属性の設定は CCR の処理に任せてください。 |
| `partition.inverted_index_storage_format` | 文字列 | 未設定 | 4.2.0 以降で使用できます。コンピュートとストレージの分離モードで新しく作成するパーティションの形式を指定します。`V2`、`V3`、`SNII` を指定できます。FE の設定 `enable_partition_inverted_index_storage_format_rollout = true` が必要で、このスイッチがオフの場合は無視されます。既存のパーティションは変換されません。 |
| `sequence_mapping.<sequence_col>` | 文字列 | 未設定 | Dev: 指定した Sequence 列が制御する Value 列をコンマで区切って指定します。Unique Key Merge-on-Read テーブルと `light_schema_change = true` が必要です。[マルチストリーム更新](../../../../data-operate/update/multi-stream-update-for-unique-model.md)を参照してください。 |
| `function_column.enable_row_ttl` | 真偽値 | `false` | 実験的機能で、5.0.0 以降に使用できます。テーブル作成時に行単位の TTL を有効にします。Aggregate Key テーブルと Sequence 列との組み合わせはサポートされません。[行単位の TTL](../../../../data-operate/delete/row-ttl.md)を参照してください。 |
| `function_column.ttl_col` | 文字列 | 未設定 | 行単位の TTL の基準となる Value 列です。`function_column.ttl` とともに設定し、行単位の TTL を有効にする必要があります。基準列の制約については、[行単位の TTL](../../../../data-operate/delete/row-ttl.md)を参照してください。 |
| `function_column.ttl` | 文字列 | 未設定 | 基準列の TTL に使用する負でない保持期間です。例: `86400` または `1 day`。単位がない値は秒として扱われます。`0` は基準列のタイムスタンプで期限切れになることを意味します。 |
| `function_column.ttl_time_zone` | 文字列 | 基準列の型による | TTL の基準列のタイムゾーンです。`UTC`、`Z`、または `-12:00` から `+14:00` までの固定オフセットを指定できます。DATE/DATETIME 系の基準列では必須です。TIMESTAMPTZ のデフォルトは `+00:00` で、ゼロオフセットのみを受け付けます。 |

機能固有の属性については、[動的パーティション分割](../../../../table-design/data-partitioning/dynamic-partitioning.md)も参照してください。インデックスの `PROPERTIES`、VARIANT 列の `PROPERTIES`、非同期マテリアライズドビューの属性は、これらのテーブル属性とは別です。統計情報の自動収集には、[統計情報](../../../../query-acceleration/optimization-technology-principle/statistics.md)で説明されているように、`ALTER TABLE` で `auto_analyze_policy` を設定します。

## アクセス制御の要件 {#access-control-requirements}

この SQL コマンドを実行する[ユーザー](../../../../admin-manual/auth/authentication-and-authorization.md)には、少なくとも次の[権限](../../../../admin-manual/auth/authentication-and-authorization.md)が必要です。

| 権限 | オブジェクト | 説明 |
| :---------------- | :------------------------ | :----------------------------------------------------------- |
| CREATE_PRIV | データベース | |
| SELECT_PRIV | テーブル、ビュー | CTAS を実行する場合、クエリ対象のテーブル、ビュー、またはマテリアライズドビューに対する SELECT_PRIV が必要です。 |

## 使用上の注意 {#usage-notes}

- データベース（Database）内に、同じ名前のテーブル（Table）またはビュー（View）が存在してはいけません。
- テーブル名、列名、rollup 名には[予約キーワード](../../../basic-element/reserved-keywords.md)を使用できません。
- CREATE TABLE ... LIKE:
  - このコマンドは Doris の内部テーブルにのみ使用できます。
  - 明示的に指定した rollup のみがコピーされます。
  - 同期マテリアライズドビューは複製されません。
- CREATE TABLE ... AS SELECT (CTAS):
  - SELECT リスト内の列名のエイリアスが有効な列名であれば、CTAS 文に列定義は不要です。省略した場合、列名とデータ型は元のクエリから推論されます。

    ```sql
    CREATE TABLE <table_name> AS SELECT ...
    ```
  - または、次の構文で名前を明示的に指定できます。

    ```sql
    CREATE TABLE <table_name> ( <col1_name>, <col2_name>, ... ) AS SELECT ...
    ```

- パーティション分割とバケット分割
  - テーブルにはバケット分割に使用する列を指定する必要がありますが、パーティションの指定は省略できます。詳細は、[データのパーティション分割](../../../../table-design/data-partitioning/data-bucketing.md)を参照してください。
  - Doris のテーブルにはパーティションありとなしがあります。この属性はテーブルの作成時に決まり、後から変更できません。パーティションありのテーブルでは後からパーティションを追加または削除できますが、パーティションなしのテーブルには後からパーティションを追加できません。
  - テーブルの作成後にパーティション列とバケット列を変更することはできません。これらの列の型を変更したり、列を追加または削除したりすることもできません。
- 動的パーティション分割
  - 動的パーティション分割は、パーティションを自動管理するための機能です。ルールを設定すると、Doris が定期的に新しいパーティションを追加し、古いパーティションを削除します。詳細は、[動的パーティション分割](../../../../table-design/data-partitioning/dynamic-partitioning.md)を参照してください。
- 自動パーティション分割
  - 詳細は、[自動パーティション分割](../../../../table-design/data-partitioning/auto-partitioning.md)を参照してください。
- 同期マテリアライズドビュー
  - テーブルの作成時に、複数の同期マテリアライズドビュー（ROLLUP）を作成できます。テーブルの作成後に追加することもできます。テーブル作成文に含めると、すべての同期マテリアライズドビューを一度に作成できます。
  - テーブル作成時に同期マテリアライズドビューを作成すると、その後のすべてのデータインポートでマテリアライズドビューのデータも同期して生成されます。マテリアライズドビューの数はインポートの効率に影響する場合があります。
  - 詳細は、[同期マテリアライズドビュー](../../../../query-acceleration/materialized-view/sync-materialized-view.md)を参照してください。
- インデックス
  - テーブルの作成時に複数の列インデックスを作成できます。テーブルの作成後に追加することもできます。
  - 後からインデックスを追加する際にテーブルに既存のデータがある場合は、すべてのデータを書き直す必要があります。そのため、インデックスの作成時間は現在のデータ量によって変わります。


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

**バケット分割の方法**

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

**`storage_policy` 属性によるテーブルのホット・コールド階層間のデータ移行戦略の設定**

1. テーブルを移行戦略に関連付けるには、先に s3 リソースとストレージポリシーを作成する必要があります。

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

**テーブルのレプリカ属性の設定**

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

このテーブルでは、3 日先までのパーティションを作成し、3 日前のパーティションを削除します。たとえば今日が `2020-01-08` の場合、`p20200108`、`p20200109`、`p20200110`、`p20200111` という名前のパーティションを作成します。各パーティションの範囲は次のとおりです。

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

**動的パーティションのレプリカ属性の設定**

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
