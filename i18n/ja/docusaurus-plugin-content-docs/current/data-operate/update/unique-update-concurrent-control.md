---
{
    "title": "Unique Key モデルの同時更新制御",
    "language": "ja",
    "description": "Apache Doris の Unique Key モデルにおける同時更新制御ガイド。MVCC によるバージョン管理、Sequence 列による順不同で到着するデータの置換順序の制御、設定可能な UPDATE の同時実行について説明します。"
}
---

<!-- Knowledge type: Feature description + Procedure -->
<!-- Applicable scenarios: High-concurrency data ingestion / Out-of-order updates on the Unique Key model / UPDATE transaction control -->

Unique Key モデルでは、Doris は包括的な同時更新制御を提供します。主に次の三つの典型的な状況に対応します。

| 利用場面 | 課題 | Doris の解決方法 |
| --- | --- | --- |
| 同じ主キーを持つデータの複数回のデータロード | 同時にデータロードした場合、最終的にどのレコードが有効になるか | MVCC（Multi-Version Concurrency Control）を使用し、バージョン番号で上書き順序を決定する |
| 複数スレッドによる同期での順不同の到着 | 古いデータが後から到着し、新しいデータを誤って上書きする | Sequence 列を使用して置換順序をユーザーが指定し、Sequence 値が大きい行を優先する |
| 同じテーブルに対する複数の UPDATE の同時実行 | 行単位の更新でダーティーデータが生じる可能性があるため、デフォルトでは逐次実行される | テーブルレベルのロックで Serializable 分離レベルを保証し、同時実行の制限を解除することもできる |

以下では、各仕組みの動作原理と使用方法を説明します。

## MVCC（Multi-Version Concurrency Control）による多版同時実行制御 {#mvcc-multi-version-concurrency-control}

<!-- Knowledge type: Concept description -->

Doris は Multi-Version Concurrency Control（MVCC）を使用して同時更新を管理します。

- データの書き込み操作ごとに書き込みトランザクションが割り当てられ、書き込みの原子性が保証されます。つまり、書き込みはすべて成功するか、すべて失敗します。
- 書き込みトランザクションがコミットされると、システムはバージョン番号を割り当てます。
- Unique Key テーブルにデータを複数回ロードし、主キーが重複した場合、Doris はバージョン番号に基づいて上書き順序を決定します。**バージョン番号が大きいデータが、小さいデータを上書きします**。

## UPDATE の同時実行制御 {#update-concurrency-control}

<!-- Knowledge type: Configuration parameter -->
<!-- Applicable scenarios: Concurrent execution of multiple UPDATE statements -->

### デフォルトの動作 {#default-behavior}

デフォルトでは、Doris は同じテーブルに対する複数の `UPDATE` 操作の同時実行を**許可しません**。

これは、Doris が現在、行単位の更新をサポートしているためです。`SET v2 = 1` だけを指定しても、値が変わらない他のすべての Value 列も上書きされます。二つの `UPDATE` 操作が同じ行を同時に更新すると、その動作は未定義となり、ダーティーデータが生じるおそれがあります。

このため、`UPDATE` 文はデフォルトでテーブルレベルのロックを使用して Serializable 分離レベルを提供し、複数の `UPDATE` 操作を逐次実行します。

### 同時実行の制限を解除する {#lifting-the-concurrency-limit}

実際の運用で、同時更新が同じ行に同時に作用しないことを保証できる場合は、FE の設定を変更して同時実行の制限を解除できます。

| 設定項目 | デフォルト値 | 説明 |
| --- | --- | --- |
| `enable_concurrent_update` | `false` | `true` に設定すると、`UPDATE` の同時実行を許可するが、トランザクションの保証は提供されなくなる |

## Sequence 列 {#sequence-column}

<!-- Knowledge type: Feature description -->
<!-- Applicable scenarios: Multi-threaded concurrent synchronization / Out-of-order data ingestion -->

### Sequence 列が必要な理由 {#why-you-need-a-sequence-column}

Unique モデルは主に、主キーの一意性が必要な場面向けに設計されており、主キーの一意性を保証できます。ただし、次の場合はデータロード時のバージョン番号だけでは十分ではありません。

- 複数のスレッドから Doris にデータを同時に同期すると、スレッドごとのデータが順不同で到着する場合があります。
- 古いデータが後から到着し、新しいデータを誤って上書きする場合があります。
- 同じ主キーを持つデータを同一バッチまたは異なるバッチでロードすると、置換順序が保証されず、最終結果が不確定になります。

この問題を解決するため、Doris ではデータロード時に **Sequence 列**を指定できます。同じ Key 列を持つ行は Sequence 列の値に基づいて置換されます。**大きい値が小さい値を置換し**、小さい値が大きい値を置換することはありません。これにより、順序をユーザーが決定できます。

Doris は内部で隠し列 `__DORIS_SEQUENCE_COL__` を追加します。この列の型はテーブル作成時にユーザーが指定し、値はデータロード時に決まります。Doris はその値を使用して、同じ Key 列を持つ行のうち、どの行を有効にするかを決定します。

:::caution 注意
Sequence 列は現在、Unique モデルでのみサポートされています。
:::

### Sequence 列を有効にする {#enabling-the-sequence-column}

次の方法で有効にできます。

| 場面 | 操作 |
| --- | --- |
| 新しいテーブルで有効にする | `CREATE TABLE` 文の `PROPERTIES` で `function_column.sequence_col` または `function_column.sequence_type` を設定する |
| 既存のテーブルで有効にする | `ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES ("function_column.sequence_type" = "Date")` を実行する |
| 有効かどうかを確認する | `SET show_hidden_columns=true` を実行してから `desc tablename` を実行する。出力に `__DORIS_SEQUENCE_COL__` が含まれていれば有効になっている |

二つのプロパティには次の違いがあります。

| プロパティ | 意味 | スキーマに対応する列が必要か |
| --- | --- | --- |
| `function_column.sequence_col` | Sequence 列をテーブル内の既存の列にマッピングする | 必要 |
| `function_column.sequence_type` | Sequence 列の型のみを指定し、隠し列に格納する | 不要 |

サポートされる列の型は、整数型、`DATE`、`DATETIME`、`TIMESTAMP_NS` です。**テーブル作成後に列の型を変更することはできません。**

### 使用例 {#usage-example}

次の例では、Stream Load を使用して一連の手順を示します。

#### 1. Sequence 列をサポートするテーブルを作成する {#1-create-a-table-that-supports-the-sequence-column}

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

#### 2. データをロードして Sequence 列の動作を確認する {#2-import-data-and-verify-the-sequence-behavior}

列マッピング方式（`function_column.sequence_col`）を使用する場合、データロードのコマンドに追加のパラメータは必要ありません。Stream Load を使用して次のデータをロードします。

```Plain
1	2020-02-22	1	2020-02-21	a
1	2020-02-22	1	2020-02-22	b
1	2020-02-22	1	2020-03-05	c
1	2020-02-22	1	2020-02-26	d
1	2020-02-22	1	2020-02-23	e
1	2020-02-22	1	2020-02-24	b
```

Stream Load のコマンドは次のとおりです。

```shell
curl --location-trusted -u root: -T testData http://host:port/api/test/test_table/_stream_load
```

クエリ結果は次のとおりです。

```sql
MySQL> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

Sequence 列（`modify_date`）では `2020-03-05` が最大値であるため、`keyword` 列には最終的に `c` が残ります。

#### 3. データロード方法ごとに Sequence 列を指定する {#3-specifying-the-sequence-column-in-different-import-methods}

テーブルで `function_column.sequence_type` を使用する場合、Sequence 列は隠し列になり、データロード時に入力フィールドをマッピングする必要があります。以下の例では、上記のように Sequence 列を `modify_date` にマッピングした `test_table` とは**別のテーブル**を使用します。

```sql
CREATE DATABASE IF NOT EXISTS test;
CREATE TABLE test.test_sequence_hidden
(
    k1 BIGINT NOT NULL,
    k2 DATE NOT NULL,
    v1 BIGINT,
    v2 VARCHAR(128)
)
UNIQUE KEY(k1, k2)
DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES (
    "function_column.sequence_type" = "DATE",
    "replication_num" = "1"
);
```

次のタブ区切りの行を含む `sequence_data.tsv` を用意します。第四の入力フィールドである `source_sequence` が隠し Sequence 列の値を指定します。これはテーブル内の可視列ではありません。

```text
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-03-23	w
```

**Stream Load**

ファイル内のフィールド順にマッピングし、リクエストヘッダーで Sequence フィールドを指定します。

```shell
curl --location-trusted -u root: \
    -H "columns: k1,k2,v1,source_sequence,v2" \
    -H "function_column.sequence_col: source_sequence" \
    -T sequence_data.tsv http://host:port/api/test/test_sequence_hidden/_stream_load
```

**Broker Load**

同じファイルを HDFS にアップロードし、以下のパスと Broker の認証情報を置き換えます。タブ区切りと同じフィールド順を使用し、`ORDER BY source_sequence` で第四の入力フィールドを選択します。

```sql
LOAD LABEL test.sequence_hidden_broker
(
    DATA INFILE("hdfs://host:port/user/data/sequence_data.tsv")
    INTO TABLE `test_sequence_hidden`
    COLUMNS TERMINATED BY "\t"
    (k1,k2,v1,source_sequence,v2)
    ORDER BY source_sequence
)
WITH BROKER 'broker'
(
    "username" = "user",
    "password" = "pass"
)
PROPERTIES ("timeout" = "3600");
```

**Routine Load**

使用する Kafka broker と topic を指定してジョブを作成し、上記の各行をそれぞれタブ区切りの Kafka メッセージとして送信します。

```sql
CREATE ROUTINE LOAD test.sequence_hidden_routine ON test_sequence_hidden
    COLUMNS TERMINATED BY "\t",
    COLUMNS(k1,k2,v1,source_sequence,v2),
    ORDER BY source_sequence
    PROPERTIES
    (
        "desired_concurrent_number" = "1",
        "format" = "csv"
    )
    FROM KAFKA
    (
        "kafka_broker_list" = "broker1:9092",
        "kafka_topic" = "my_topic"
    );
```

データロードが成功してデータが参照可能になると、Sequence 値が大きい `2020-03-23` に対応する、`v2` が `w` の行が残ります。以下の `modify_date` を使う例では、引き続き元の `test_table` とその列マッピングを使用します。

#### 4. 置換順序の保証を確認する {#4-verify-the-replacement-order-guarantee}

前の例に続いて、次のデータをロードします。すべての Sequence 値は、既存の最大値 `2020-03-05` より小さい値です。

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-02-23	b
```

クエリ結果は次のとおりです。

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

今回ロードしたすべての Sequence 値は既存の最大値 `2020-03-05` より小さいため、結果は変わりません。

次に、より大きな Sequence 値を持つデータをロードします。

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-03-23	w
```

クエリ結果は次のとおりです。

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-23  | w       |
+---------+------------+----------+-------------+---------+
```

新たにロードしたデータの Sequence 値 `2020-03-23` は既存の最大値 `2020-03-05` より大きいため、元のデータが置換されます。

**結論**：Doris はデータロード時にすべてのバッチの Sequence 列の値を比較し、**最大値を持つレコードをテーブルに書き込みます**。

### 使用上の注意 {#usage-notes}

<!-- Knowledge type: Caveats -->

1. **Sequence 列の要件はテーブル定義によって異なります**：`function_column.sequence_col` を使用する場合は、通常の列と同じ規則でマッピング先の列をロードします。データロード時に追加の Sequence マッピングパラメータは必要ありません。`function_column.sequence_type` を使用する場合は、上記のように Stream Load または Broker Load のソース列マッピングを設定します。ターゲット列のリストを明示する全行 `INSERT` では、マッピング先の通常列を含めます。ただし、その列のデフォルト値が `CURRENT_TIMESTAMP` の場合は不要です。マッピング先の通常列がない場合は、隠し列 `__DORIS_SEQUENCE_COL__` を含めます。ターゲット列のリストを指定しない `INSERT` には、マッピング先の通常列がすでに含まれます。部分列更新については、以下の項目 3 を参照してください。必要な Sequence 入力がない場合は、次のエラーが発生します。

    ```Plain
    Table test_tbl has sequence column, need to specify the sequence column
    ```

2. **Sequence 列の制約チェックを無効にする**：テーブルの複製や内部データの移行などでは、セッション変数を使用して、`INSERT` 文に対する Sequence 列の必須チェックを無効にできます。

    ```sql
    set require_sequence_in_insert = false;
    ```

3. **部分列更新との互換性**：バージョン 2.0 以降、Doris の Unique Key テーブルの Merge-on-Write 実装は部分列更新をサポートしています。部分列更新のデータロードでは、毎回一部の列だけを更新できるため、**Sequence 列は必須ではありません**。

    - データロードジョブに Sequence 列が含まれる場合、動作は変わりません。
    - データロードジョブに Sequence 列が含まれない場合、Doris は一致する過去のデータの Sequence 列の値を、更新後の行の Sequence 列の値として使用します。
    - 過去のデータに同じ Key を持つレコードがない場合、Doris は自動的に `null` またはデフォルト値を設定します。

4. **同時データロード時の正確性の保証**：データロードが同時に行われる場合、Doris は MVCC を使用してデータの正確性を保証します。二つのデータロードバッチが同じ Key の異なる列をそれぞれ更新する場合、バージョン番号が小さいデータロードジョブの成功後、バージョン番号が大きいデータロードジョブは、同じ Key について小さいバージョンのジョブが書き込んだ行を使用して、欠けている値を補完します。
