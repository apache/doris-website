---
{
    "title": "Unique Key モデルの同時更新制御",
    "language": "ja",
    "description": "Apache Doris の Unique Key モデルにおける同時更新制御ガイド。MVCC によるバージョン管理、Sequence 列による順序が前後したデータの置き換え順序の制御、UPDATE の同時実行設定について説明します。"
}
---

<!-- Knowledge type: Feature description + Procedure -->
<!-- Applicable scenarios: High-concurrency data ingestion / Out-of-order updates on the Unique Key model / UPDATE transaction control -->

Doris は Unique Key モデルで、同時更新を制御する仕組みを提供します。主に次の3つの典型的な場面に対応します。

| 利用場面 | 課題 | Doris の解決方法 |
| --- | --- | --- |
| 同じ主キーのデータを複数回取り込む | 同時に取り込んだとき、最終的にどのレコードが有効になるかを決める必要がある | MVCC（多版同時実行制御）を使用し、バージョン番号で上書き順序を決める |
| 複数スレッドによる同期でデータが順不同に到着する | 古いデータが後から到着し、新しいデータを誤って上書きする | Sequence 列を使用する。ユーザーが置き換え順序を指定し、Sequence 値が大きい行を優先する |
| 同じテーブルに対して複数の UPDATE を同時実行する | 行単位の更新では不正なデータが生じる可能性があるため、デフォルトでは直列に実行される | テーブル単位のロックで Serializable 分離レベルを保証する。同時実行の制限は解除できる |

以下では、これらの仕組みの動作原理と使い方を説明します。

## MVCC による多版同時実行制御 {#mvcc-multi-version-concurrency-control}

<!-- Knowledge type: Concept description -->

Doris は、MVCC（Multi-Version Concurrency Control）を使用して同時更新を管理します。

- データの書き込み操作ごとに書き込みトランザクションが割り当てられ、書き込みの原子性が保証されます。書き込みはすべて成功するか、すべて失敗します。
- 書き込みトランザクションがコミットされると、システムがバージョン番号を割り当てます。
- Unique Key テーブルにデータを複数回取り込み、主キーが重複した場合、Doris はバージョン番号で上書き順序を決めます。**バージョン番号が大きいデータが、小さいデータを上書きします**。

## UPDATE の同時実行制御 {#update-concurrency-control}

<!-- Knowledge type: Configuration parameter -->
<!-- Applicable scenarios: Concurrent execution of multiple UPDATE statements -->

### デフォルトの動作 {#default-behavior}

デフォルトでは、Doris は同じテーブルに対する複数の `UPDATE` 操作の同時実行を**許可しません**。

Doris は現在、行単位の更新をサポートしています。`SET v2 = 1` だけを指定した場合でも、ほかのすべての Value 列も上書きされます（値自体は変わりません）。2つの `UPDATE` 操作が同じ行を同時に更新すると、動作が未定義となり、不正なデータが生じるおそれがあります。

そのため、`UPDATE` 文はデフォルトでテーブル単位のロックを使用して Serializable 分離レベルを提供し、複数の `UPDATE` 操作を直列に実行します。

### 同時実行制限の解除 {#lifting-the-concurrency-limit}

同時に実行する更新が同じ行を操作しないと保証できる場合は、FE の設定を変更して同時実行制限を解除できます。

| 設定項目 | デフォルト値 | 説明 |
| --- | --- | --- |
| `enable_concurrent_update` | `false` | `true` に設定すると `UPDATE` の同時実行を許可するが、トランザクション保証は提供されなくなる |

## Sequence 列 {#sequence-column}

<!-- Knowledge type: Feature description -->
<!-- Applicable scenarios: Multi-threaded concurrent synchronization / Out-of-order data ingestion -->

### Sequence 列が必要な理由 {#why-you-need-a-sequence-column}

Unique モデルは主に一意の主キーが必要な場面向けに設計されており、主キーの一意性を保証します。ただし、次の状況では、データ取り込み時のバージョン番号だけでは不十分です。

- 複数のスレッドで並行して Doris にデータを同期すると、スレッドごとのデータが順不同に到着することがあります。
- 古いデータが後から到着し、新しいデータを誤って上書きすることがあります。
- 同じ主キーのデータを同一バッチまたは異なるバッチで取り込む場合、置き換え順序は保証されず、最終結果が不定になります。

これを解決するため、Doris ではデータ取り込み時に **Sequence 列**を指定できます。Key 列が同じ行は Sequence 列の値に基づいて置き換えられ、**大きい値が小さい値を置き換えます**。逆の場合は置き換えられません。これにより、ユーザーが順序を決められます。

内部的には、Doris は隠し列 `__DORIS_SEQUENCE_COL__` を追加します。この列の型はテーブル作成時にユーザーが指定し、値はデータ取り込み時に決まります。Doris はその値を使用して、同じ Key 列を持つ行のうちどの行を有効にするかを決めます。

:::caution 注意
Sequence 列は現在、Unique モデルでのみサポートされています。
:::

### Sequence 列の有効化 {#enabling-the-sequence-column}

次の方法で有効にできます。

| 場面 | 操作 |
| --- | --- |
| 新しいテーブルで有効にする | `CREATE TABLE` 文の `PROPERTIES` に `function_column.sequence_col` または `function_column.sequence_type` を設定する |
| 既存のテーブルで有効にする | `ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES ("function_column.sequence_type" = "Date")` を実行する |
| 有効かどうかを確認する | `SET show_hidden_columns=true` を実行してから `desc tablename` を実行する。出力に `__DORIS_SEQUENCE_COL__` が含まれていれば有効 |

2つのプロパティには次の違いがあります。

| プロパティ | 意味 | スキーマに対応する列が必要か |
| --- | --- | --- |
| `function_column.sequence_col` | Sequence 列をテーブル内の既存の列に対応付ける | 必要 |
| `function_column.sequence_type` | 隠し列に格納する Sequence 列の型のみを指定する | 不要 |

サポートされる列の型は、整数型、`DATE`、`DATETIME` です。**テーブル作成後に列の型は変更できません。**

### 使用例 {#usage-example}

次の例では、Stream Load を使用して一連の手順を示します。

#### 1. Sequence 列をサポートするテーブルを作成する {#1-create-a-table-that-supports-the-sequence-column}

Unique モデルのテーブル `test_table` を作成し、Sequence 列をテーブル内の `modify_date` 列に対応付けます。

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

作成したテーブルのスキーマは次のとおりです。

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

#### 2. データを取り込んで Sequence の動作を確認する {#2-import-data-and-verify-the-sequence-behavior}

列の対応付け方式（`function_column.sequence_col`）を使用する場合、データ取り込みコマンドに追加のパラメータは不要です。Stream Load で次のデータを取り込みます。

```Plain
1	2020-02-22	1	2020-02-21	a
1	2020-02-22	1	2020-02-22	b
1	2020-02-22	1	2020-03-05	c
1	2020-02-22	1	2020-02-26	d
1	2020-02-22	1	2020-02-23	e
1	2020-02-22	1	2020-02-24	b
```

Stream Load コマンド：

```shell
curl --location-trusted -u root: -T testData http://host:port/api/test/test_table/_stream_load
```

クエリ結果：

```sql
MySQL> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

Sequence 列（`modify_date`）の最大値は `2020-03-05` なので、`keyword` 列には最終的に `c` が残ります。

#### 3. データ取り込み方法ごとに Sequence 列を指定する {#3-specifying-the-sequence-column-in-different-import-methods}

テーブルで `function_column.sequence_type` を使用する場合、Sequence 列は隠し列となり、データ取り込み時に入力フィールドを対応付ける必要があります。以下の例では、上記のように Sequence 列を `modify_date` に対応付けた `test_table` とは**別のテーブル**を使用します。

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

次のタブ区切りの行を含む `sequence_data.tsv` を用意します。4番目の入力フィールド `source_sequence` が隠し Sequence 列に値を渡します。これはテーブルの可視列ではありません。

```text
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-03-23	w
```

**Stream Load**

ファイル内の順序に従って入力フィールドを対応付け、リクエストヘッダーで Sequence フィールドを指定します。

```shell
curl --location-trusted -u root: \
    -H "columns: k1,k2,v1,source_sequence,v2" \
    -H "function_column.sequence_col: source_sequence" \
    -T sequence_data.tsv http://host:port/api/test/test_sequence_hidden/_stream_load
```

**Broker Load**

同じファイルを HDFS にアップロードし、以下のパスと Broker の認証情報を置き換えます。タブ区切りと同じフィールド順序を使用し、`ORDER BY source_sequence` で4番目の入力フィールドを選択します。

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

データロードが成功し、データが参照可能になると、大きいほうの Sequence 値（`2020-03-23`）を持つ、`v2` が `w` の行が残ります。以下の `modify_date` の例では、引き続き元の `test_table` とその列の対応付けを使用します。

#### 4. 置き換え順序の保証を確認する {#4-verify-the-replacement-order-guarantee}

前の例に続けて、次のデータを取り込みます。いずれの Sequence 値も、既存の最大値 `2020-03-05` より小さい値です。

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-02-23	b
```

クエリ結果：

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

今回取り込んだすべての Sequence 値は既存の最大値 `2020-03-05` より小さいため、結果は変わりません。

次に、より大きい Sequence 値を持つデータを取り込みます。

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-03-23	w
```

クエリ結果：

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-23  | w       |
+---------+------------+----------+-------------+---------+
```

新しく取り込んだデータの Sequence 値 `2020-03-23` が既存の最大値 `2020-03-05` より大きいため、元のデータが置き換えられます。

**結論**：データ取り込み時、Doris はすべてのバッチの Sequence 列の値を比較し、**最大値を持つレコードをテーブルに書き込みます**。

### 使用上の注意 {#usage-notes}

<!-- Knowledge type: Caveats -->

1. **Sequence 列の要件はテーブル定義によって異なります**：`function_column.sequence_col` を使用する場合、対応付けた通常の列を通常の列のルールに従ってデータロードします。データロード時に Sequence 列を対応付ける追加パラメータは不要です。`function_column.sequence_type` を使用する場合、上記のように Stream Load または Broker Load で入力元の列の対応付けを設定します。対象列のリストを明示する全行の `INSERT` では、対応付けた通常の列を含めます（そのデフォルト値が `CURRENT_TIMESTAMP` の場合を除きます）。対応付けた列がない場合は、隠し列 `__DORIS_SEQUENCE_COL__` を含めます。対象列のリストを指定しない `INSERT` には、対応付けた通常の列がすでに含まれます。部分列更新については、以下の項目3を参照してください。必須の Sequence 入力がない場合は、次のエラーが発生します。

    ```Plain
    Table test_tbl has sequence column, need to specify the sequence column
    ```

2. **Sequence 列の制約チェックを無効にする**：テーブルの複製や内部データの移行などでは、セッション変数を使用して、`INSERT` 文に対する Sequence 列の必須チェックを無効にできます。

    ```sql
    set require_sequence_in_insert = false;
    ```

3. **部分列更新との互換性**：バージョン 2.0 以降、Doris の Unique Key テーブルの Merge-on-Write 実装は部分列更新をサポートしています。部分列更新のデータ取り込みでは、毎回一部の列のみを更新できるため、**Sequence 列は必須ではありません**。

    - データロードジョブに Sequence 列が含まれる場合、動作は変わりません。
    - データロードジョブに Sequence 列が含まれない場合、Doris は一致した既存データの Sequence 列の値を、更新後の行の Sequence 列の値として使用します。
    - 既存データに同じ Key のレコードがない場合、Doris は `null` またはデフォルト値を自動的に設定します。

4. **同時データ取り込み時の正確性の保証**：データの取り込みが同時に行われる場合、Doris は MVCC を使用してデータの正確性を保証します。2つの取り込みバッチが同じ Key の異なる列をそれぞれ更新する場合、バージョン番号が小さいデータロードジョブの成功後、番号が大きいジョブは、同じ Key について番号が小さいジョブが書き込んだ行を使用し、欠けている値を補完します。
