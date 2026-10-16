---
{
    "title": "Unique Key モデルの同時更新制御",
    "language": "ja",
    "description": "Apache Doris の Unique Key モデルにおける同時更新制御のガイド。MVCC によるバージョン管理、Sequence 列による順序が入れ替わったデータの置換順序制御、設定可能な UPDATE の同時実行について説明します。"
}
---

<!-- Knowledge type: Feature description + Procedure -->
<!-- Applicable scenarios: High-concurrency data ingestion / Out-of-order updates on the Unique Key model / UPDATE transaction control -->

Unique Key モデルでは、Doris は同時更新を制御する仕組みを提供します。主に次の三つの典型的な場面に対応します。

| 利用場面 | 課題 | Doris の解決方法 |
| --- | --- | --- |
| 同じ主キーに対する複数回のインポート | 同時にインポートした場合に、最終的にどのレコードが有効になるかを判断する必要がある | MVCC（Multi-Version Concurrency Control）を使用し、バージョン番号で上書き順序を決定する |
| 複数スレッドによる同期でデータが順序どおりに到着しない | 古いデータが後から到着し、新しいデータを誤って上書きする | Sequence 列を使用して置換順序を指定し、値が大きい行を優先する |
| 同じテーブルに対する UPDATE の同時実行 | 行単位の更新で不正なデータが生じる可能性があるため、デフォルトでは逐次実行される | テーブル単位のロックで Serializable 分離レベルを保証し、必要に応じて同時実行の制限を解除できる |

以下では、これらの仕組みの動作原理と使い方を説明します。

## MVCC による多版同時実行制御

<!-- Knowledge type: Concept description -->

Doris は Multi-Version Concurrency Control（MVCC）を使用して同時更新を管理します。

- 各データ書き込み操作には書き込みトランザクションが割り当てられます。これにより、書き込みは全体が成功するか全体が失敗するかのいずれかとなり、原子性が保証されます。
- 書き込みトランザクションがコミットされると、システムはそのトランザクションにバージョン番号を割り当てます。
- Unique Key テーブルに複数回データをインポートし、同じ主キーが存在する場合、Doris はバージョン番号で上書き順序を決定します。**バージョン番号が大きいデータが、小さいデータを上書きします**。

## UPDATE の同時実行制御

<!-- Knowledge type: Configuration parameter -->
<!-- Applicable scenarios: Concurrent execution of multiple UPDATE statements -->

### デフォルトの動作

デフォルトでは、Doris は同じテーブルに対する複数の `UPDATE` 操作の同時実行を**許可しません**。

これは、Doris が現在サポートする行単位の更新では、`SET v2 = 1` のみを指定しても、値が変わらない他の Value 列もすべて上書きされるためです。二つの `UPDATE` 操作が同じ行を同時に更新した場合、動作は未定義であり、不正なデータが生じるおそれがあります。

そのため、`UPDATE` 文はデフォルトでテーブル単位のロックによる Serializable 分離を提供し、複数の `UPDATE` 操作は逐次実行されます。

### 同時実行の制限を解除する

実際の運用で、同時更新が同じ行を同時に操作しないことを保証できる場合は、FE の設定を変更して同時実行の制限を解除できます。

| 設定項目 | デフォルト値 | 説明 |
| --- | --- | --- |
| `enable_concurrent_update` | `false` | `true` に設定すると `UPDATE` の同時実行を許可しますが、トランザクションの保証は提供されなくなります |

## Sequence 列

<!-- Knowledge type: Feature description -->
<!-- Applicable scenarios: Multi-threaded concurrent synchronization / Out-of-order data ingestion -->

### Sequence 列が必要な理由

Unique モデルは主に一意な主キーが必要な場面向けに設計されており、主キーの一意性を保証します。ただし、次の場合はインポートのバージョン番号だけでは不十分です。

- 複数のスレッドで Doris にデータを同期すると、スレッドごとのデータが順序どおりに到着しない場合があります。
- 古いデータが後から到着し、新しいデータを誤って上書きする場合があります。
- 同じ主キーのデータを同じバッチまたは異なるバッチでインポートした場合、置換順序が保証されず、最終結果が一定になりません。

この問題を解決するため、Doris ではインポート時に **Sequence 列**を指定できます。Key 列が同じ行について、Sequence 列の値に基づいて置換が行われます。**大きい値が小さい値を置き換え**、小さい値による置換は行われません。これにより、置換順序をユーザーが制御できます。

実装上、Doris は隠し列 `__DORIS_SEQUENCE_COL__` を追加します。列の型はテーブル作成時にユーザーが指定し、値はインポート時に決まります。Doris はこの値を使用して、Key 列が同じ行のうちどの行を採用するかを決定します。

:::caution 注意
Sequence 列は現在、Unique モデルでのみサポートされています。
:::

### Sequence 列を有効にする

Sequence 列は次の方法で有効にできます。

| 場面 | 操作 |
| --- | --- |
| 新しいテーブルで有効にする | `function_column.sequence_col` または `function_column.sequence_type` を、`PROPERTIES`（`CREATE TABLE` 文の句）に設定します |
| 既存のテーブルで有効にする | `ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES ("function_column.sequence_type" = "Date")` を実行します |
| 有効かどうかを確認する | `SET show_hidden_columns=true` を実行した後、`desc tablename` を実行します。出力に `__DORIS_SEQUENCE_COL__` が含まれていれば有効です |

二つのプロパティの違いは次のとおりです。

| プロパティ | 意味 | 対応する列がスキーマに必要か |
| --- | --- | --- |
| `function_column.sequence_col` | Sequence 列をテーブル内の既存の列に対応付けます | 必要 |
| `function_column.sequence_type` | 隠し列に格納する Sequence 列の型のみを指定します | 不要 |

サポートされる列の型は、整数型、`DATE`、`DATETIME` です。**テーブル作成後に列の型を変更することはできません。**

### 使用例

以下では、Stream Load を使用して一連の操作を示します。

#### 1. Sequence 列をサポートするテーブルを作成する

Unique モデルのテーブル `test_table` を作成し、Sequence 列をテーブルの `modify_date` 列に対応付けます。

```sql
CREATE TABLE test.test_table
(
    user_id bigint,
    date date,
    group_id bigint,
    modify_date date,
    keyword VARCHAR(128)
)
UNIQUE KEY(user_id, date, group_id)
DISTRIBUTED BY HASH (user_id) BUCKETS 32
PROPERTIES(
    "function_column.sequence_col" = 'modify_date',
    "replication_num" = "1",
    "in_memory" = "false"
);
```

作成されたテーブルのスキーマは次のとおりです。

```sql
MySQL>  desc test_table;
+-------------+--------------+------+-------+---------+---------+
| Field       | Type         | Null | Key   | Default | Extra   |
+-------------+--------------+------+-------+---------+---------+
| user_id     | BIGINT       | No   | true  | NULL    |         |
| date        | DATE         | No   | true  | NULL    |         |
| group_id    | BIGINT       | No   | true  | NULL    |         |
| modify_date | DATE         | No   | false | NULL    | REPLACE |
| keyword     | VARCHAR(128) | No   | false | NULL    | REPLACE |
+-------------+--------------+------+-------+---------+---------+
```

この列をテーブルのスキーマに表示したくない場合は、代わりに `function_column.sequence_type` で型を指定します。

```sql
PROPERTIES (
    "function_column.sequence_type" = 'Date'
);
```

#### 2. データをインポートして Sequence 列の動作を確認する

列を対応付ける方法（`function_column.sequence_col`）を使用する場合、インポートコマンドに追加のパラメータは不要です。Stream Load を使用して次のデータをインポートします。

```Plain
1	2020-02-22	1	2020-02-21	a
1	2020-02-22	1	2020-02-22	b
1	2020-02-22	1	2020-03-05	c
1	2020-02-22	1	2020-02-26	d
1	2020-02-22	1	2020-02-23	e
1	2020-02-22	1	2020-02-24	b
```

Stream Load コマンド:

```shell
curl --location-trusted -u root: -T testData http://host:port/api/test/test_table/_stream_load
```

クエリ結果:

```sql
MySQL> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

`2020-03-05` は Sequence 列（`modify_date`）の最大値であるため、`keyword` 列には最終的に `c` が残ります。

#### 3. インポート方法ごとに Sequence 列を指定する

テーブル作成時に `function_column.sequence_type` を使用する場合、つまり Sequence 列をテーブル内の列に直接対応付けていない場合は、インポート時に Sequence 列とデータ列の対応付けを明示する必要があります。

**Stream Load**

ヘッダーで `function_column.sequence_col` を使用し、隠し列に対応付ける `source_sequence` を指定します。

```shell
curl --location-trusted -u root \
    -H "columns: k1,k2,source_sequence,v1,v2" \
    -H "function_column.sequence_col: source_sequence" \
    -T testData http://host:port/api/testDb/testTbl/_stream_load
```

**Broker Load**

隠し列に対応付ける `source_sequence` フィールドを `ORDER BY` 句で指定します。

```sql
LOAD LABEL db1.label1
(
    DATA INFILE("hdfs://host:port/user/data/*/test.txt")
    INTO TABLE `tbl1`
    COLUMNS TERMINATED BY ","
    (k1,k2,source_sequence,v1,v2)
    ORDER BY source_sequence
)
WITH BROKER 'broker'
(
    "username"="user",
    "password"="pass"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

**Routine Load**

対応付けの方法は上記と同じです。例:

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl 
    [WITH MERGE|APPEND|DELETE]
    COLUMNS(k1, k2, source_sequence, v1, v2),
    WHERE k1  100 and k2 like "%doris%"
    [ORDER BY source_sequence]
    PROPERTIES
    (
        "desired_concurrent_number"="3",
        "max_batch_interval" = "20",
        "max_batch_rows" = "300000",
        "max_batch_size" = "209715200",
        "strict_mode" = "false"
    )
    FROM KAFKA
    (
        "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
        "kafka_topic" = "my_topic",
        "kafka_partitions" = "0,1,2,3",
        "kafka_offsets" = "101,0,0,200"
    );
```

#### 4. 置換順序の保証を確認する

前の例に続き、次のデータをインポートします。すべての Sequence 値は、既存の最大値 `2020-03-05` より小さい値です。

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-02-23	b
```

クエリ結果:

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

このインポートのすべての Sequence 値は、既存の最大値 `2020-03-05` より小さいため、結果は変わりません。

次に、より大きい Sequence 値を持つデータをインポートします。

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-03-23	w
```

クエリ結果:

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-23  | w       |
+---------+------------+----------+-------------+---------+
```

新しくインポートしたデータの Sequence 値 `2020-03-23` は、既存の最大値 `2020-03-05` より大きいため、元のデータが置き換えられます。

**結論**: Doris はインポート時にすべてのバッチの Sequence 列の値を比較し、**最大の値を持つレコードをテーブルに書き込みます**。

### 使用上の注意

<!-- Knowledge type: Caveats -->

1. **Sequence 列の明示的な指定が必要**: Stream Load や Broker Load などのインポートジョブ、および行更新の `INSERT` 文では、Sequence 列を明示的に指定する必要があります（デフォルト値が `CURRENT_TIMESTAMP` の場合を除きます）。指定しないと、次のエラーが発生します。

    ```Plain
    Table test_tbl has sequence column, need to specify the sequence column
    ```

2. **Sequence 列の制約チェックを無効にする**: テーブルの複製や内部データの移行などでは、セッション変数を使用して `INSERT` 文に対する Sequence 列の必須チェックを無効にできます。

    ```sql
    set require_sequence_in_insert = false;
    ```

3. **部分列更新との互換性**: バージョン 2.0 以降、Doris の Unique Key テーブルの Merge-on-Write 実装は部分列更新をサポートしています。部分列更新のインポートでは、一度に一部の列のみを更新できるため、**Sequence 列は必須ではありません**。

    - インポートジョブに Sequence 列が含まれる場合、動作は変わりません。
    - インポートジョブに Sequence 列が含まれない場合、Doris は一致する過去のデータの Sequence 列の値を、更新後の行の Sequence 列の値として使用します。
    - 過去のデータに同じ Key のレコードが存在しない場合、Doris は自動的に `null` またはデフォルト値を設定します。

4. **同時インポート時の正確性の保証**: 複数のインポートが同時に発生した場合、Doris は MVCC を使用してデータの正確性を保証します。二つのインポートバッチが同じ Key の異なる列を更新する場合、バージョン番号が小さいインポートジョブの成功後、バージョン番号が大きいインポートジョブは、その Key について小さい番号のジョブが書き込んだ行を使用して、欠けている値を補完します。
