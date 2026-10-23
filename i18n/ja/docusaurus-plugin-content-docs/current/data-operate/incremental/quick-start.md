---
{
    "title": "クイックスタート",
    "language": "ja",
    "description": "Doris の changelog と Table Stream を10分で学ぶ手順: changelog を有効にしたテーブルの作成、Stream の作成、データの書き込み、変更の確認、下流での変更の取り込み。",
    "keywords": [
        "Doris Table Stream quick start",
        "changelog example",
        "CREATE STREAM",
        "changelog.enable",
        "changelog.need_historical_value",
        "min_delta",
        "show_initial_rows",
        "__DORIS_STREAM_CHANGE_TYPE_COL__",
        "__DORIS_STREAM_SEQUENCE_COL__",
        "INSERT INTO SELECT from stream",
        "table_stream_consumption",
        "consumption offset LAG",
        "incremental consumption tutorial",
        "Doris CDC example"
    ]
}
---

<!-- Knowledge type: Operations guide -->
<!-- Use cases: First use of changelog / Table Stream -->

このページでは、注文テーブルを使って changelog と Table Stream の基本的な使い方を説明します。注文の挿入、更新、削除を記録し、その変更を下流のテーブルに一度だけ取り込みます。必要なのは MySQL クライアントと約10分です。

## 前提条件 {#prerequisites}

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 以降。
- すべての FE の `fe.conf` に次の設定を追加し、FE を再起動してください（どちらも動的に変更できない設定です）。

    ```text
    enable_feature_changelog = true
    enable_table_stream = true
    ```

- Doris に接続できる MySQL クライアント。

## 手順の概要 {#overview-of-the-steps}

1. changelog を有効にした `orders` テーブルを作成し、最初のデータを一括で書き込みます。
2. `orders` に `min_delta` Table Stream を作成します。
3. 更新、削除、挿入を含む次のデータを一括で書き込みます。
4. Stream で変更を確認し、各行の変更種別を理解します。
5. `INSERT INTO ... SELECT` を使って、変更を下流のテーブルに取り込みます。
6. `information_schema.table_stream_consumption` で取り込みの進捗を確認します。

## ステップ 1: changelog を有効にしたテーブルを作成する {#step-1-create-a-table-with-changelog-enabled}

<!-- Knowledge type: Operational steps -->

changelog を有効にできるのはテーブル作成時だけです。Unique Key Merge-on-Write テーブルを作成し、`changelog.need_historical_value` を有効にします。これにより、更新と削除についても変更前の値が記録されます。

```sql
CREATE DATABASE IF NOT EXISTS demo;
USE demo;

CREATE TABLE orders (
    order_id BIGINT,
    status   VARCHAR(16),
    amount   DECIMAL(10, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "enable_unique_key_merge_on_write" = "true",
    "changelog.enable" = "true",
    "changelog.need_historical_value" = "true"
);
```

最初のデータを一括で書き込みます。

```sql
INSERT INTO orders VALUES
    (1, 'created', 100.00),
    (2, 'created', 200.00),
    (3, 'created', 300.00);
```

## ステップ 2: Table Stream を作成する {#step-2-create-a-table-stream}

<!-- Knowledge type: Operational steps -->

`orders` テーブルに Stream を作成します。以降、`orders` の変更はこの Stream を通じて読み取り、取り込みます。

```sql
CREATE STREAM orders_stream ON TABLE orders
PROPERTIES (
    "type" = "min_delta",
    "show_initial_rows" = "false"
);
```

- `type = min_delta`: 取り込みと次の取り込みの間に生じた、各キーの正味の変更を出力します。
- `show_initial_rows = false`: すでに存在する3行は変更として出力されません。この時点より後の変更だけが対象になります。

この時点で Stream をクエリしても、結果は返りません。

```sql
SELECT * FROM orders_stream;
```

```text
Empty set
```

## ステップ 3: 次の変更を一括で書き込む {#step-3-write-the-second-batch-of-changes}

<!-- Knowledge type: Operational steps -->

ここでは、更新、削除、挿入、挿入直後の削除という四つのケースを扱います。

```sql
-- Update order 1 (writing the same key into a Unique Key table is an update)
INSERT INTO orders VALUES (1, 'paid', 100.00);
-- Delete order 2
DELETE FROM orders WHERE order_id = 2;
-- New order 4
INSERT INTO orders VALUES (4, 'created', 400.00);
-- New order 5, deleted right after
INSERT INTO orders VALUES (5, 'created', 500.00);
DELETE FROM orders WHERE order_id = 5;
```

## ステップ 4: 変更を確認する {#step-4-view-the-changes}

<!-- Knowledge type: Operational steps + Result interpretation -->

二つの仮想列を指定して Stream をクエリします。`__DORIS_STREAM_CHANGE_TYPE_COL__` は変更種別、`__DORIS_STREAM_SEQUENCE_COL__` は変更のコミットタイムスタンプ（TSO）です。仮想列は `SELECT *` に含まれないため、明示的に列挙する必要があります。

```sql
SELECT order_id, status, amount,
       __DORIS_STREAM_CHANGE_TYPE_COL__ AS change_type,
       __DORIS_STREAM_SEQUENCE_COL__ AS change_tso
FROM orders_stream
ORDER BY order_id, change_type DESC;
```

```text
+----------+---------+--------+---------------+--------------------+
| order_id | status  | amount | change_type   | change_tso         |
+----------+---------+--------+---------------+--------------------+
|        1 | created | 100.00 | UPDATE_BEFORE | 469067680972800000 |
|        1 | paid    | 100.00 | UPDATE_AFTER  | 469067680972800000 |
|        2 | created | 200.00 | DELETE        | 469067681287372800 |
|        4 | created | 400.00 | APPEND        | 469067681628160003 |
+----------+---------+--------+---------------+--------------------+
```

ステップ 3 の操作と照らし合わせると、次のようになります。

| ステップ 3 の操作 | Stream の出力 |
|---|---|
| 注文 1 を更新 | `UPDATE_BEFORE`（更新前の値）と `UPDATE_AFTER`（更新後の値）の組 |
| 注文 2 を削除 | 削除前の値を保持する `DELETE` が一つ |
| 注文 4 を挿入 | `APPEND`（新しいキー）が一つ |
| 注文 5 を挿入してから削除 | 取り込みと次の取り込みの間に正味の変更がないため、`min_delta` は何も出力しない |

同じクエリをもう一度実行しても、まったく同じ結果が得られます。**通常の SELECT は変更を読み取るだけで、取り込みオフセットを進めません。**

## ステップ 5: 変更を取り込む {#step-5-consume-the-changes}

<!-- Knowledge type: Operational steps -->

`INSERT INTO ... SELECT ... FROM <stream>` を使って、変更を下流のテーブルに書き込みます。このステートメントは、書き込みと同じトランザクション内で取り込みオフセットを進めます。

```sql
CREATE TABLE orders_changes (
    order_id    BIGINT,
    status      VARCHAR(16),
    amount      DECIMAL(10, 2),
    change_type VARCHAR(16),
    change_tso  BIGINT
)
DUPLICATE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO orders_changes
SELECT order_id, status, amount,
       __DORIS_STREAM_CHANGE_TYPE_COL__,
       __DORIS_STREAM_SEQUENCE_COL__
FROM orders_stream;
```

取り込み後、Stream に未取り込みの変更はありません。

```sql
SELECT COUNT(*) FROM orders_stream;
```

```text
+----------+
| count(*) |
+----------+
|        0 |
+----------+
```

さらに変更を書き込むと、Stream は直前の取り込みより後に生じた変更だけを返します。

```sql
INSERT INTO orders VALUES (4, 'paid', 400.00);

SELECT order_id, status, __DORIS_STREAM_CHANGE_TYPE_COL__ AS change_type
FROM orders_stream ORDER BY change_type DESC;
```

```text
+----------+---------+---------------+
| order_id | status  | change_type   |
+----------+---------+---------------+
|        4 | created | UPDATE_BEFORE |
|        4 | paid    | UPDATE_AFTER  |
+----------+---------+---------------+
```

## ステップ 6: 取り込みの進捗を確認する {#step-6-check-the-consumption-progress}

<!-- Knowledge type: Operational steps + Operations monitoring -->

`information_schema.table_stream_consumption` には、各 Stream の取り込みオフセットと未取り込みの変更量がパーティションごとに表示されます。

```sql
SELECT STREAM_NAME, UNIT, CONSUMPTION_STATUS, LAG, LAST_CONSUMPTION_TIME
FROM information_schema.table_stream_consumption
WHERE DB_NAME = 'demo' AND STREAM_NAME = 'orders_stream';
```

```text
+---------------+--------+--------------------+-----------+-----------------------+
| STREAM_NAME   | UNIT   | CONSUMPTION_STATUS | LAG       | LAST_CONSUMPTION_TIME |
+---------------+--------+--------------------+-----------+-----------------------+
| orders_stream | orders | 469067681628160003 | 262144000 |         1789351206000 |
+---------------+--------+--------------------+-----------+-----------------------+
```

| 列 | 意味 |
|---|---|
| `UNIT` | 取り込み単位。ベーステーブルのパーティションを指します。`orders` には明示的なパーティションがないため、テーブルと同じ名前のパーティションが一つあります |
| `CONSUMPTION_STATUS` | そのパーティションで取り込みが完了した位置を示す TSO |
| `LAG` | パーティションで最後にコミットされた TSO と、取り込み済みの TSO との差。`0` は未取り込みの変更がないことを意味します |
| `LAST_CONSUMPTION_TIME` | 最後に取り込んだ時刻（ミリ秒単位のタイムスタンプ）。`-1` は一度も取り込んでいないことを意味します |

ステップ 5 の `INSERT INTO orders_changes SELECT ...` をもう一度実行すると、`LAG` は `0` に戻ります。

## クリーンアップ {#clean-up}

```sql
DROP STREAM orders_stream;
DROP TABLE orders_changes;
DROP TABLE orders;
```

## よくある質問 {#faq}

<!-- Knowledge type: Troubleshooting -->

| 問題 | 原因と対処方法 |
|---|---|
| Stream の作成時に `Table Stream is experimental. Please set enable_table_stream=true to enable it.` というエラーが出る | FE で `enable_table_stream` が有効になっていないか、`fe.conf` の編集後に FE を再起動していません。[前提条件](#prerequisites)に従ってください |
| 作成直後の Stream が空である | `show_initial_rows = false` の場合、Stream 作成時にすでに存在するデータは変更として出力されません。新たな変更を書き込み、再度クエリしてください |
| `SELECT * FROM orders_stream` で変更種別が表示されない | 仮想列は `SELECT *` に含まれません。`__DORIS_STREAM_CHANGE_TYPE_COL__` と `__DORIS_STREAM_SEQUENCE_COL__` を明示的に列挙してください |
| クエリのたびに同じ変更が返される | 通常の `SELECT` は変更を読み取るだけで、オフセットを進めません。`INSERT INTO ... SELECT ... FROM orders_stream` で取り込むと、同じ変更は返されなくなります |
| 既存のテーブルで changelog を有効にしたい | changelog を有効にできるのはテーブル作成時だけです。changelog を有効にした新しいテーブルを作成し、データを再ロードしてください。詳しくは [Changelog](changelog#enabling-changelog) を参照してください |
| `LAST_CONSUMPTION_TIME` に `-1` が表示される | そのパーティションでは、まだ一度も取り込みが行われていません |

## 次のステップ {#next-steps}

- 三つの取り込みタイプの違い、`show_initial_rows` の意味、読み取りと取り込みのトランザクション上の動作: [Table Stream の基礎](table-stream)
- パーティション単位の取り込み、スナップショット読み取り、ディメンションテーブルとの結合、ベーステーブルの DDL が Stream に与える影響: [Table Stream の応用](table-stream-advanced)
- changelog のプロパティ、サポート範囲、制限事項: [Changelog](changelog)
- Stream を作成せずに時間範囲を指定して変更を読み取る方法: [増分クエリ](incremental-query)
