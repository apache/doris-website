---
{
    "title": "Unique Key モデルの同時更新制御",
    "language": "ja",
    "description": "Apache Doris の Unique Key モデルにおける同時更新制御のガイド。MVCC に基づくバージョン管理、Sequence 列による順不同データの置換順序制御、および設定可能な UPDATE の同時実行について説明します。"
}
---

<!-- Knowledge type: Feature description + Procedure -->
<!-- Applicable scenarios: High-concurrency data ingestion / Out-of-order updates on the Unique Key model / UPDATE transaction control -->

Unique Key モデルでは、Doris は包括的な同時更新制御を提供します。主に、次の三つの典型的な状況に対応します。

| 利用シナリオ | 課題 | Doris の解決方法 |
| --- | --- | --- |
| 同じ主キーに対する複数のインポート | 同時にインポートした場合、最終的にどのレコードが有効になるかを判断する必要がある | MVCC（多版型同時実行制御）を使用し、バージョン番号で上書き順序を決定する |
| 複数スレッドによる同期でデータが順不同に到着する | 古いデータが後から到着し、新しいデータを誤って上書きする | Sequence 列を使用する。ユーザーが置換順序を指定し、Sequence 値が大きい行が優先される |
| 同じテーブルに対する複数の UPDATE | 行単位の更新ではダーティデータが生じる可能性があるため、デフォルトでは直列に実行される | テーブル単位のロックで Serializable 分離レベルを保証する。同時実行の制限は解除できる |

以下では、これらの仕組みと使用方法を説明します。

## MVCC による多版型同時実行制御

<!-- Knowledge type: Concept description -->

Doris は、多版型同時実行制御（MVCC）を使用して同時更新を管理します。

- 各データ書き込み操作には書き込みトランザクションが割り当てられ、書き込みの原子性が保証されます（すべて成功するか、すべて失敗します）。
- 書き込みトランザクションのコミット時に、システムがバージョン番号を割り当てます。
- Unique Key テーブルに同じ主キーのデータを複数回インポートした場合、Doris はバージョン番号で上書き順序を決定します。**バージョン番号が大きいデータが小さいデータを上書きします**。

## UPDATE の同時実行制御

<!-- Knowledge type: Configuration parameter -->
<!-- Applicable scenarios: Concurrent execution of multiple UPDATE statements -->

### デフォルトの動作

デフォルトでは、Doris は同じテーブルに対する複数の `UPDATE` 操作の同時実行を**許可しません**。

その理由は、Doris が現在行単位の更新をサポートしているためです。`SET v2 = 1` だけを指定した場合でも、他のすべての Value 列も上書きされます（値自体は変わりません）。二つの `UPDATE` 操作が同じ行を同時に更新すると、動作は未定義となり、ダーティデータが生じるおそれがあります。

このため、`UPDATE` 文はデフォルトでテーブル単位のロックによって Serializable 分離レベルを提供し、複数の `UPDATE` 操作は直列にのみ実行されます。

### 同時実行の制限を解除する

実際の運用で、同時更新が同じ行を同時に操作しないと保証できる場合は、FE の設定を変更して同時実行の制限を解除できます。

| 設定項目 | デフォルト値 | 説明 |
| --- | --- | --- |
| `enable_concurrent_update` | `false` | `true` に設定すると `UPDATE` の同時実行を許可するが、トランザクション保証は提供されなくなる |

## Sequence 列

<!-- Knowledge type: Feature description -->
<!-- Applicable scenarios: Multi-threaded concurrent synchronization / Out-of-order data ingestion -->

### Sequence 列が必要な理由

Unique モデルは主に主キーの一意性が必要な場合向けに設計されており、主キーの一意性を保証できます。ただし、次の状況では、インポートのバージョン番号だけでは不十分です。

- 複数のスレッドで Doris にデータを同期すると、スレッドごとのデータが順不同に到着することがあります。
- 古いデータが後から到着し、新しいデータを誤って上書きすることがあります。
- 同じ主キーのデータを同じバッチ内または異なるバッチ間でインポートした場合、置換順序は保証されないため、最終結果は非決定的です。

この問題に対応するため、Doris ではインポート時に **Sequence 列**を指定できます。同じ Key 列を持つ行は Sequence 列の値に基づいて置換されます。**大きい値が小さい値を置換し**、その逆では置換されません。これにより、ユーザーが順序を制御できます。

実装上、Doris は隠し列 `__DORIS_SEQUENCE_COL__` を追加します。この列の型はテーブルの作成時にユーザーが指定し、値はインポート時に決まります。Doris はその値を使用して、同じ Key 列を持つ行のうちどの行を優先するか決定します。

:::caution Note
Sequence 列は現在、Unique モデルでのみサポートされています。
:::

### Sequence 列を有効にする

次の方法で有効にできます。

| シナリオ | 操作 |
| --- | --- |
| 新しいテーブルで有効にする | `function_column.sequence_col` または `function_column.sequence_type` を `PROPERTIES` で設定する（`CREATE TABLE` 文で新規テーブルを作成する場合） |
| 既存のテーブルで有効にする | `ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES ("function_column.sequence_type" = "Date")` を実行する |
| 有効かどうかを確認する | `SET show_hidden_columns=true` を実行してから `desc tablename` を実行する。出力に `__DORIS_SEQUENCE_COL__` が含まれていれば有効 |

二つのプロパティの違いは次のとおりです。

| プロパティ | 意味 | 対応する列がテーブルのスキーマに必要か |
| --- | --- | --- |
| `function_column.sequence_col` | Sequence 列をテーブル内の既存の列にマッピングする | 必要 |
| `function_column.sequence_type` | 隠し列に格納する Sequence 列の型のみを指定する | 不要 |

サポートされる列の型は、整数型、`DATE`、`DATETIME`、`TIMESTAMP_NS` です。**テーブルの作成後に列の型を変更することはできません。**

### 使用例

次の例では、Stream Load を使用して一連の操作を示します。

#### 1. Sequence 列をサポートするテーブルを作成する

Unique モデルのテーブル `test_table` を作成し、Sequence 列をテーブル内の `modify_date` 列にマッピングします。

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

作成されたテーブルのスキーマは次のようになります。

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

#### 2. データをインポートし、Sequence の動作を確認する

列マッピング方式（`function_column.sequence_col`）を使用する場合、インポートコマンドに追加のパラメータは不要です。Stream Load で次のデータをインポートします。

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

`2020-03-05` は Sequence 列（`modify_date`）の最大値なので、`keyword` 列には最終的に `c` が残ります。

#### 3. インポート方法ごとに Sequence 列を指定する

テーブル作成時に `function_column.sequence_type` を使用した場合（Sequence 列をテーブル内の列に直接マッピングしていない場合）、インポート時に Sequence 列からデータ列へのマッピングを明示的に指定する必要があります。

**Stream Load**

ヘッダーで `function_column.sequence_col` を使用し、隠し列に対する `source_sequence` のマッピングを指定します。

```shell
curl --location-trusted -u root \
    -H "columns: k1,k2,source_sequence,v1,v2" \
    -H "function_column.sequence_col: source_sequence" \
    -T testData http://host:port/api/testDb/testTbl/_stream_load
```

**Broker Load**

`source_sequence` フィールドを隠し列にマッピングするために、`ORDER BY` 句で指定します。

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

マッピング方法は上記と同じです。例:

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

前の例に続けて、次のデータをインポートします（Sequence 値はいずれも既存の最大値 `2020-03-05` より小さい値です）。

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

このインポートの Sequence 値はいずれも既存の最大値 `2020-03-05` より小さいため、結果は変わりません。

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

新たにインポートしたデータの Sequence 値 `2020-03-23` は既存の最大値 `2020-03-05` より大きいため、元のデータが置換されます。

**結論**: インポート時、Doris は全バッチの Sequence 列の値を比較し、**最大値を持つレコードをテーブルに書き込みます**。

### 使用上の注意

<!-- Knowledge type: Caveats -->

1. **Sequence 列を明示的に指定する必要があります**: Stream Load や Broker Load などのインポートジョブ、および行更新の `INSERT` 文では、Sequence 列を明示的に指定する必要があります（デフォルト値が `CURRENT_TIMESTAMP` の場合を除きます）。指定しないと、次のエラーが発生します。

    ```Plain
    Table test_tbl has sequence column, need to specify the sequence column
    ```

2. **Sequence 列の制約チェックを無効にする**: テーブルの複製や内部データ移行などの場面では、セッション変数を使用して `INSERT` 文に対する Sequence 列の必須チェックを無効にできます。

    ```sql
    set require_sequence_in_insert = false;
    ```

3. **部分列更新との互換性**: バージョン 2.0 以降、Doris の Unique Key テーブルの Merge-on-Write 実装は部分列更新をサポートします。部分列更新を伴うインポートでは、毎回一部の列のみを更新できるため、**Sequence 列は必須ではありません**。

    - インポートジョブに Sequence 列が含まれる場合、動作は変わりません。
    - インポートジョブに Sequence 列が含まれない場合、Doris は一致する既存データの Sequence 列の値を更新後の行の Sequence 列の値として使用します。
    - 既存データに同じ Key のレコードがない場合、Doris は自動的に `null` またはデフォルト値を設定します。

4. **同時インポート時の正確性の保証**: 同時にインポートする場合、Doris は MVCC を使用してデータの正確性を保証します。二つのインポートバッチが同じ Key の異なる列を更新する場合、バージョン番号の小さいインポートジョブが成功した後、バージョン番号の大きいインポートジョブは、同じ Key についてバージョン番号の小さいジョブが書き込んだ行を使用して、欠けている値を補完します。
