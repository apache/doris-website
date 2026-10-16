---
{
    "title": "CREATE TABLE",
    "language": "ja",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "現在のデータベースまたは指定したデータベースに新しいテーブルを作成します。テーブルには複数のカラムを定義でき、各カラム定義には名前、データ型、および任意の属性を指定できます。"
}
---

## 説明

現在のデータベースまたは指定したデータベースに新しいテーブルを作成します。テーブルには複数のカラムを定義できます。各カラム定義には名前とデータ型を指定し、必要に応じて次の属性も指定できます。

- キーであるかどうか
- 集約セマンティクスを持つかどうか
- 生成カラムであるかどうか
- 値が必須かどうか（NOT NULL）
- 自動採番カラムであるかどうか
- 挿入時のデフォルト値があるかどうか
- 更新時のデフォルト値があるかどうか

このコマンドは、次の形式にも対応しています。

- CREATE TABLE … AS SELECT（データが格納されたテーブルを作成します。CTAS とも呼びます）
- CREATE TABLE … LIKE（既存テーブルの空のコピーを作成します）

## 構文

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

- 定義は次のとおりです。

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

## 別形式の構文

### CREATE TABLE ... AS SELECT（CTAS）

`query` の結果を格納したテーブルを作成します。

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

### CREATE TABLE ... LIKE

既存テーブルと同じカラム定義を持つ新しいテーブルを作成します。既存テーブルのデータはコピーしません。カラムのすべてのプロパティが新しいテーブルに複製されます。`rollup` 名のリストを指定した場合は、元のテーブルの対応する `rollup` も複製されます。

```sql
CREATE TABLE <new_table_name> LIKE <existing_table_name>
[ WITH ROLLUP ( <rollup_list> ) ];
```

## 必須パラメータ

**<name>**

> テーブルの識別子（名前）を指定します。テーブルを作成するデータベース内で一意である必要があります。
>
> 識別子は英字で始める必要があります。Unicode 名のサポートが有効な場合は、任意の言語の文字で始められます。識別子全体をバッククォートで囲む場合（例: ``My Object``）を除き、空白や特殊文字を含めることはできません。
>
> 識別子に予約語は使用できません。
>
> 詳細は、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約語](../../../basic-element/reserved-keywords.md)を参照してください。

**<col_name>**

> カラムの識別子（名前）を指定します。作成するテーブル内で一意である必要があります。
>
> 識別子は英字、数字、または記号 `@` で始める必要があります。Unicode 名のサポートが有効な場合は、任意の言語の文字でも始められます。識別子全体をバッククォートで囲む場合（例: ``My Object``）を除き、空白や特殊文字を含めることはできません。
>
> 詳細は、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約語](../../../basic-element/reserved-keywords.md)を参照してください。

**<col_type>**

> カラムのデータ型を指定します。
>
> テーブルのカラムに指定できるデータ型については、[データ型](../../../basic-element/sql-data-types/data-type-overview.md)を参照してください。

**<query>**

> CTAS で必須のパラメータです。データを格納するための SELECT 文を指定します。

**<source_table>**

> CREATE TABLE ... LIKE で必須のパラメータです。コピー元のテーブルを指定します。

## オプションパラメータ

### データモデル関連のパラメータ

**<key_type>**

> テーブルのデータモデルです。指定できる値は DUPLICATE（明細モデル）、UNIQUE（主キーモデル）、AGGREGATE（集約モデル）です。詳細は、[データモデル](../../../../table-design/data-model/intro.mdx)を参照してください。

**<key_cols>**

> テーブルのキーカラムです。Doris では、キーカラムはテーブルの先頭から K 個のカラムである必要があります。単一のタブレット内のデータは、これらのカラムに従って順序が維持されます。キーの制約とキーカラムの選び方については、[データモデル](../../../../table-design/data-model/intro.mdx)の各節を参照してください。

**<cluster_cols>**

> データのローカルソートカラムです。データモデルが UNIQUE（主キーモデル）の場合にのみ使用できます。`<cluster_cols>` を指定すると、`<cluster_cols>` でデータがソートされ、`<key_cols>` はソートに使用されません。

**<col_aggregate_type>**

> カラムの集約方法です。テーブルが集約モデルの場合にのみ使用できます。集約方法の詳細は、[集約モデル](../../../../table-design/data-model/aggregate.md)を参照してください。

### バケット関連のパラメータ

**<distribute_cols> と <bucket_count>**

> バケットカラムとバケット数です。明細モデルのバケットカラムには任意のカラムを使用できます。集約モデルと主キーモデルのバケットカラムは、キーカラムと一致する必要があります。バケット数には任意の正の整数を指定できます。詳細は、[手動バケット設定](../../../../table-design/data-partitioning/data-bucketing#1-manually-set-the-number-of-buckets)と[自動バケット設定](../../../../table-design/data-partitioning/data-bucketing#2-automatically-set-the-number-of-buckets)を参照してください。

### カラムのデフォルト値に関連するパラメータ

**[ GENERATED ALWAYS ] AS (<col_generate_expression>)**

> 生成カラムです。現在のカラムより前にあるカラムと式 `<col_generate_expression>` を使用して、現在のカラムのデータを生成します。生成カラムは、ユーザーが値を直接挿入または更新するのではなく、ほかのカラムの値から算出される特殊なカラムです。式の結果を事前に計算してデータベースに保存できるため、頻繁なクエリや複雑な計算が必要な場合に適しています。

**AUTO_INCREMENT(<col_auto_increment_start_value>)**

> データのインポート時に、自動採番カラムの値が指定されていない行には、Doris がテーブル内で一意の値を割り当てます。`<col_auto_increment_start_value>` は自動採番カラムの開始値です。詳細は、[自動採番カラム](../../../../table-design/auto-increment.md)を参照してください。

**DEFAULT <col_default_value>**

> カラムのデフォルト値です。このカラムを含めずに書き込むと、この値が使用されます。デフォルト値を明示的に設定しない場合は NULL が使用されます。指定できるデフォルト値は次のとおりです。
>
> - NULL: すべての型に指定できます。デフォルト値として NULL を使用します。
> - 数値リテラル: 数値型にのみ指定できます。
> - 文字列リテラル: 文字列型にのみ指定できます。
> - CURRENT_DATE: 日付型にのみ指定できます。現在の日付をデフォルト値として使用します。
> - CURRENT_TIMESTAMP [ <defaultValuePrecision> ]: 日時型にのみ指定できます。現在のタイムスタンプをデフォルト値として使用します。`<defaultValuePrecision>` で時刻の精度を指定できます。
> - PI: double 型にのみ指定できます。円周率をデフォルト値として使用します。
> - E: double 型にのみ指定できます。数学定数 e をデフォルト値として使用します。
> - BITMAP_EMPTY: カラムが bitmap 型の場合にのみ指定できます。空のビットマップを設定します。

**ON UPDATE CURRENT_TIMESTAMP (<col_on_update_precision>)**

> データの更新時にこのカラムの値を指定しなかった場合、現在のタイムスタンプでカラムを更新します。UNIQUE（主キーモデル）のテーブルでのみ使用できます。

### インデックス関連のパラメータ

**<index_name>**

> インデックスの識別子（名前）を指定します。作成するテーブル内で一意である必要があります。詳細は、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約語](../../../basic-element/reserved-keywords.md)を参照してください。

**<index_cols>**

> インデックスを追加するカラムのリストです。テーブル内の既存のカラムを指定する必要があります。

**<index_type>**

> インデックスの種類です。現在サポートされているのは INVERTED のみです。

**<index_property>**

> インデックスのプロパティです。詳細は、[転置インデックス](../../../../table-design/index/inverted-index/overview.md)を参照してください。

### 自動パーティション関連のパラメータ

パーティションの詳細については、[自動パーティション](../../../../table-design/data-partitioning/auto-partitioning.md)を参照してください。

### 手動パーティション関連のパラメータ

パーティションの詳細については、「手動パーティション」を参照してください。

**<partition_type>**

> Doris は RANGE パーティションと LIST パーティションをサポートしています。詳細は、[手動パーティション](../../../../table-design/data-partitioning/manual-partitioning.md)を参照してください。

**<partition_name>**

> パーティションの識別子（名前）です。作成するテーブル内で一意である必要があります。詳細は、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約語](../../../basic-element/reserved-keywords.md)を参照してください。

**VALUES LESS THAN <partition_value_list>**

> RANGE パーティションです。パーティションのデータ範囲は、下限から `<partition_value_list>` までです。
>
> 上限を表す場合、`<partition_value_list>` を `MAX_VALUE` に簡略化できます。
>
> `<partition_value_list>` の形式は `((col_1_value, ...), (col_1_value, ...), ...)` です。

**VALUES [ <partition_lower_bound>, <partition_upper_bound>)**

> RANGE パーティションです。パーティションのデータ範囲は `<partition_lower_bound>` から `<partition_upper_bound>` までです。作成されるパーティションは一つだけです。
>
> `<partition_lower_bound>` と `<partition_upper_bound>` の形式は `(col_1_value, ...)` です。

**FROM <partition_lower_bound> TO <partition_upper_bound>**

**INTERVAL <n> [ <datetime_unit> ]**

> RANGE パーティションです。パーティションのデータ範囲は `<partition_lower_bound>` から `<partition_value_list>` までです。`<n>` ごとにパーティションが作成されます。
>
> `<partition_lower_bound>` と `<partition_upper_bound>` の形式は `(col_1_value, ...)` です。

**VALUES IN {**

​          **(<partition_value> [, <partition_value> [ ... ] ])**

​          **| <partition_value>**

​      **}**

> LIST パーティションです。パーティションカラムが `<partition_value>` と等しい行が、このパーティションに属します。
>
> `<partition_value>` の形式は `(col_1_value, ...)` です。


### 同期マテリアライズドビュー関連

:::caution 注意
rollup を使用した同期マテリアライズドビューの作成には機能上の制限があり、現在は推奨されていません。同期マテリアライズドビューは、別の文で作成することを推奨します。詳細は、[CREATE MATERIALIZED VIEW](../sync-materialized-view/CREATE-MATERIALIZED-VIEW.md) 文と[同期マテリアライズドビュー](../../../../query-acceleration/materialized-view/sync-materialized-view.md)を参照してください。
:::

**<rollup_name>**

> 同期マテリアライズドビューの識別子（名前）です。作成するテーブル内で一意である必要があります。詳細は、[識別子の要件](../../../basic-element/object-identifiers.md)と[予約語](../../../basic-element/reserved-keywords.md)を参照してください。

**<rollup_cols>**

> 同期マテリアライズドビューに含めるカラムです。

### テーブルプロパティ関連のパラメータ

**<table_property>**

| プロパティ名 | 機能 |
| :------------ | :-------- |
| replication_num | レプリカ数です。デフォルトは 3 です。BE ノードが 3 台未満の場合は、BE ノード数以下のレプリカ数を指定する必要があります。バージョン 0.15 以降、このプロパティは自動的に `replication_allocation` プロパティに変換されます。たとえば、`"replication_num" = "3"` は `"replication_allocation" = "tag.location.default:3"` に変換されます。 |
| replication_allocation | タグに基づいてレプリカの配置を設定します。このプロパティは `replication_num` プロパティの機能を完全に上書きできます。 |
| min_load_replica_num | データインポートの成功に必要な最小レプリカ数を設定します。デフォルトは -1 です。この値が 0 以下の場合も、インポートの成功にはレプリカの過半数で成功する必要があります。 |
| storage_medium | テーブルデータの初期ストレージメディアを指定します。 |
| storage_cooldown_time | テーブルデータの初期ストレージメディアの期限を設定します。この時刻を過ぎると、最初の階層のストレージメディアに自動的に移行します。 |
| colocate_with | Colocation Join 機能を使用する場合に、Colocation Group を設定します。 |
| bloom_filter_columns | Bloom Filter インデックスを追加するカラム名のリストを指定します。各カラムの Bloom Filter インデックスは独立しており、複合インデックスではありません。例: `"bloom_filter_columns" = "k1, k2, k3"` |
| compression | Doris テーブルのデフォルトの圧縮方式は、バージョン 4.0.3 以降では ZSTD です。バージョン 4.0.3 より前は LZ4F でした。 |
| function_column.sequence_col | Unique Key モデルを使用する場合、Sequence カラムを指定できます。キーカラムが同じ行では、Sequence カラムに従って REPLACE が行われます（値が大きければ小さい値を置き換え、そうでなければ置き換えません）。`function_column.sequence_col` は、Sequence カラムをテーブル内の特定のカラムに対応付けます。そのカラムには整数型または日付・時刻型（DATE、DATETIME）を使用できます。作成後にカラムの型は変更できません。`function_column.sequence_col` を設定すると、`function_column.sequence_type` は無視されます。 |
| function_column.sequence_type | Unique Key モデルを使用する場合、Sequence カラムを指定できます。キーカラムが同じ行では、Sequence カラムに従って REPLACE が行われます（値が大きければ小さい値を置き換え、そうでなければ置き換えません）。ここでは Sequence カラムの型だけを指定します。日付・時刻型または整数型を指定できます。Doris は非表示の Sequence カラムを作成します。 |
| enable_unique_key_merge_on_write | Unique テーブルで Merge-on-Write 実装を使用するかどうかを指定します。バージョン 2.1 より前はデフォルトで無効、2.1 以降はデフォルトで有効です。 |
| light_schema_change | Light Schema Change の最適化を使用するかどうかを指定します。`true` にすると、値カラムの追加と削除をより速く同期的に完了できます。バージョン 2.0.0 以降、デフォルトで有効です。 |
| disable_auto_compaction | このテーブルの自動 Compaction を無効にするかどうかを指定します。`true` にすると、バックグラウンドの自動 Compaction はこのテーブルのすべてのタブレットをスキップします。 |
| enable_duplicate_without_keys_by_default | `true` にすると、テーブル作成時に Unique、Aggregate、Duplicate のいずれも指定しない場合、ソートカラムとプレフィックスインデックスを持たない Duplicate モデルのテーブルがデフォルトで作成されます。 |
| skip_write_index_on_load | このテーブルのデータインポート時にインデックスを書き込まないかどうかを指定します。`true` にすると、インデックスの書き込みが Compaction まで延期されます（現在は転置インデックスにのみ有効）。初回書き込みと Compaction の際にインデックスを繰り返し書き込むための CPU と IO の消費を避けられ、大量データのインポート性能が向上します。 |
| compaction_policy | このテーブルの Compaction マージポリシーを設定します。サポートされるのは time_series または size_basedtime_series のみです。rowset のディスク上のデータ量が一定のサイズに達すると、バージョンのマージが実行されます。マージされた rowset は直接 base compaction フェーズに進みます。これにより、継続的なインポートでの Compaction に伴う書き込み増幅を効果的に抑えます。このポリシーでは、接頭辞が time_series_compaction のパラメータを使用して Compaction の実行を調整します。 |
| time_series_compaction_goal_size_mbytes | Compaction マージポリシーが time_series の場合、各 Compaction の入力ファイルのサイズを調整します。出力ファイルのサイズは入力ファイルと同程度になります。 |
| time_series_compaction_file_count_threshold | Compaction マージポリシーが time_series の場合、各 Compaction の入力ファイルの最小数を調整します。タブレット内のファイル数がこの設定値を超えると Compaction が開始されます。 |
| time_series_compaction_time_threshold_seconds | Compaction マージポリシーが time_series の場合、Compaction の最大実行間隔を秒単位で調整します。長時間実行されていない場合は Compaction が開始されます。 |
| time_series_compaction_level_threshold | Compaction マージポリシーが time_series の場合、このパラメータのデフォルトは 1 です。2 に設定すると、一度マージしたセグメントを再度マージし、セグメントサイズが time_series_compaction_goal_size_mbytes に達するように制御して、セグメント数を減らします。 |
| group_commit_interval_ms | このテーブルの Group Commit バッチ間隔を設定します。単位は ms、デフォルトは 10000ms（10s）です。Group Commit のタイミングは、`group_commit_interval_ms` と `group_commit_data_bytes` のうち、先に設定値に達した方によって決まります。 |
| group_commit_data_bytes | このテーブルの Group Commit バッチのデータサイズを設定します。単位は bytes、デフォルトは 134217728（128MB）です。Group Commit のタイミングは、`group_commit_interval_ms` と `group_commit_data_bytes` のうち、先に設定値に達した方によって決まります。 |
| enable_mow_light_delete | Mow を使用する Unique テーブルで、Delete 文による Delete predicate の書き込みを有効にするかどうかを指定します。有効にすると Delete 文の性能が向上しますが、Delete 後の部分カラム更新でデータエラーが発生する場合があります。無効にすると、正確性を確保するために Delete 文の性能が低下します。デフォルトは `false` です。Unique Merge-on-Write テーブルでのみ有効にできます。 |
| Dynamic Partitioning Related Properties | 動的パーティション関連のプロパティについては、[データパーティション - 動的パーティション](../../../../table-design/data-partitioning/dynamic-partitioning)を参照してください。 |
| enable_unique_key_skip_bitmap_column | Unique Merge-on-Write テーブルで[柔軟なカラム更新機能](../../../../data-operate/update/partial-column-update.md#flexible-column-update)を有効にするかどうかを指定します。このプロパティを有効にできるのは Unique Merge-on-Write テーブルのみです。 |

## アクセス制御要件

この SQL コマンドを実行する[ユーザー](../../../../admin-manual/auth/authentication-and-authorization.md)には、少なくとも次の[権限](../../../../admin-manual/auth/authentication-and-authorization.md)が必要です。

| 権限 | オブジェクト | 説明 |
| :---------------- | :------------------------ | :----------------------------------------------------------- |
| CREATE_PRIV | データベース | |
| SELECT_PRIV | テーブル、ビュー | CTAS の実行時、クエリ対象のテーブル、ビュー、またはマテリアライズドビューに対する SELECT_PRIV が必要です |

## 使用上の注意

- データベース（Database）内に、同じ名前のテーブル（Table）またはビュー（View）が存在してはいけません。
- テーブル名、カラム名、rollup 名には[予約語](../../../basic-element/reserved-keywords.md)を使用できません。
- CREATE TABLE ... LIKE:
  - このコマンドは Doris の内部テーブルでのみ使用できます。
  - 明示的に指定した rollup のみがコピーされます。
  - 同期マテリアライズドビューは一切複製されません。
- CREATE TABLE ... AS SELECT (CTAS):
  - SELECT リストのカラム名のエイリアスが有効なカラム名であれば、CTAS 文でカラム定義を指定する必要はありません。省略すると、元のクエリからカラム名とデータ型が推定されます。
      
    ```sql
    CREATE TABLE <table_name> AS SELECT ...
    ```
  - 次の構文でカラム名を明示的に指定することもできます。
    
    ```sql
    CREATE TABLE <table_name> ( <col1_name>, <col2_name>, ... ) AS SELECT ...
    ```

- パーティションとバケット
  - テーブルではバケットカラムを指定する必要がありますが、パーティションの指定は省略できます。詳細は、[データパーティション](../../../../table-design/data-partitioning/data-bucketing.md)を参照してください。
  - Doris のテーブルにはパーティション化テーブルと非パーティション化テーブルがあります。どちらになるかはテーブル作成時に決まり、後から変更できません。パーティション化テーブルでは後からパーティションを追加または削除できますが、非パーティション化テーブルに後からパーティションを追加することはできません。
  - テーブル作成後にパーティションカラムとバケットカラムを変更することはできません。これらのカラムの型変更、追加、削除もできません。
- 動的パーティション
  - 動的パーティション機能は、主にパーティションの自動管理に使用します。ルールを設定すると、Doris は定期的に新しいパーティションを追加し、古いパーティションを削除します。詳細は、[動的パーティション](../../../../table-design/data-partitioning/dynamic-partitioning.md)を参照してください。
- 自動パーティション
  - 自動パーティションについては、[自動パーティション](../../../../table-design/data-partitioning/auto-partitioning.md)を参照してください。
- 同期マテリアライズドビュー
  - テーブルの作成時に複数の同期マテリアライズドビュー（ROLLUP）を作成できます。テーブルの作成後に追加することもできます。テーブル作成文に含めると、すべての同期マテリアライズドビューを一度に作成できます。
  - テーブル作成時に同期マテリアライズドビューを作成した場合、その後のデータインポートではマテリアライズドビューのデータも同期的に生成されます。マテリアライズドビューの数はデータインポートの効率に影響する場合があります。
  - 詳細は、[同期マテリアライズドビュー](../../../../query-acceleration/materialized-view/sync-materialized-view.md)を参照してください。
- インデックス
  - テーブルの作成時に複数のカラムインデックスを作成できます。テーブルの作成後に追加することもできます。
  - 既存データがあるテーブルに後からインデックスを追加すると、すべてのデータを書き直す必要があります。そのため、インデックスの作成時間は既存データ量によって異なります。


## 例

### 基本的な例

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

**バケット方式**

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

**自動パーティション**

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

**RANGE パーティション**

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

**LIST パーティション**

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

**動的パーティション**

このテーブルでは、3 日先までのパーティションを作成し、3 日前のパーティションを削除します。たとえば、今日が `2020-01-08` の場合、`p20200108`、`p20200109`、`p20200110`、`p20200111` という名前のパーティションを作成します。各パーティションの範囲は次のとおりです。

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
