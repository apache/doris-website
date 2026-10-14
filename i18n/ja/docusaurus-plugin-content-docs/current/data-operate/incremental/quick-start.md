---
{
    "title": "クイックスタート",
    "language": "ja",
    "description": "Doris Row Binlog と Table Stream を 10 分で試す手順。Row Binlog を有効にしたテーブルの作成、Stream の作成、データの書き込み、変更の確認、下流での変更の消費を説明します。",
    "keywords": [
        "Doris Table Stream クイックスタート",
        "Row Binlog の例",
        "CREATE STREAM",
        "binlog.enable",
        "binlog.format ROW",
        "binlog.need_historical_value",
        "min_delta",
        "show_initial_rows",
        "__DORIS_STREAM_CHANGE_TYPE_COL__",
        "__DORIS_STREAM_SEQUENCE_COL__",
        "ストリームからの INSERT INTO SELECT",
        "table_stream_consumption",
        "消費オフセットの LAG",
        "増分消費のチュートリアル",
        "Doris CDC の例"
    ]
}
---

<!-- Knowledge type: Operations guide -->
<!-- Use cases: First use of Row Binlog / Table Stream -->

このページでは、注文テーブルを使って Row Binlog と Table Stream の基本的な使い方を説明します。注文の挿入、更新、削除を記録し、変更を下流のテーブルへ一度だけ消費します。必要なのは MySQL クライアントと約 10 分の時間です。

## 前提条件 {#prerequisites}

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 以降。
- すべての FE の `fe.conf` に以下を追加し、FE を再起動してください（どちらも動的に変更できない設定です）。

    ```text
    enable_feature_binlog = true
    enable_table_stream = true
    ```

- Doris に接続できる MySQL クライアント。

## 手順の概要 {#overview-of-the-steps}

1. Row Binlog を有効にした `orders` テーブルを作成し、最初のデータを投入します。
2. `min_delta` の Table Stream を `orders` に作成します。
3. 更新、削除、挿入を含む二回目のデータ変更を行います。
4. Stream で変更を確認し、各行の変更種別を把握します。
5. `INSERT INTO ... SELECT` で変更を下流のテーブルに消費します。
6. `information_schema.table_stream_consumption` で消費の進捗を確認します。

## ステップ 1: Row Binlog を有効にしたテーブルを作成する {#step-1-create-a-table-with-row-binlog-enabled}

<!-- Knowledge type: Operational steps -->

Row Binlog を有効にできるのはテーブル作成時だけです。Unique Key の Merge-on-Write テーブルを作成し、`binlog.need_historical_value` を有効にします。これにより、更新や削除の際に変更前の値も記録されます。

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
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.need_historical_value" = "true"
);
```

最初のデータを投入します。

```sql
INSERT INTO orders VALUES
    (1, 'created', 100.00),
    (2, 'created', 200.00),
    (3, 'created', 300.00);
```

## ステップ 2: Table Stream を作成する {#step-2-create-a-table-stream}

<!-- Knowledge type: Operational steps -->

`orders` テーブルに Stream を作成します。以降、`orders` の変更はこの Stream を通じて読み取り、消費します。

```sql
CREATE STREAM orders_stream ON TABLE orders
PROPERTIES (
    "type" = "min_delta",
    "show_initial_rows" = "false"
);
```

- `type = min_delta`: 二回の消費の間に各キーに生じた差分を出力します。
- `show_initial_rows = false`: 既存の 3 行は変更として出力されず、この時点より後の変更だけが対象になります。

この時点で Stream をクエリしても、結果は返りません。

```sql
SELECT * FROM orders_stream;
```

```text
Empty set
```

## ステップ 3: 二回目の変更を行う {#step-3-write-the-second-batch-of-changes}

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

Stream に対して二つの仮想列を指定してクエリします。`__DORIS_STREAM_CHANGE_TYPE_COL__` は変更種別、`__DORIS_STREAM_SEQUENCE_COL__` は変更のコミット時刻（TSO）です。仮想列は `SELECT *` には含まれないため、明示的に指定する必要があります。

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

ステップ 3 の操作と照らし合わせると、結果は次のようになります。

| ステップ 3 の操作 | Stream の出力 |
|---|---|
| 注文 1 を更新 | `UPDATE_BEFORE`（更新前の値）と `UPDATE_AFTER`（更新後の値）のペア |
| 注文 2 を削除 | 削除前の値を含む `DELETE` が一行 |
| 注文 4 を挿入 | `APPEND`（新しいキー）が一行 |
| 注文 5 を挿入してから削除 | 二回の消費の間の差分はなくなるため、`min_delta` は何も出力しません |

同じクエリを再度実行しても、結果はまったく同じです。**通常の SELECT は変更を読み取るだけで、消費オフセットを進めません。**

## ステップ 5: 変更を消費する {#step-5-consume-the-changes}

<!-- Knowledge type: Operational steps -->

`INSERT INTO ... SELECT ... FROM <stream>` を使って、変更を下流のテーブルに書き込みます。この文では、書き込みと同じトランザクション内で消費オフセットが進みます。

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

消費後、Stream に未消費の変更はありません。

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

さらに変更を書き込むと、Stream は前回の消費以降に起きた変更だけを返します。

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

## ステップ 6: 消費の進捗を確認する {#step-6-check-the-consumption-progress}

<!-- Knowledge type: Operational steps + Operations monitoring -->

`information_schema.table_stream_consumption` には、各 Stream のパーティションごとの消費オフセットと未消費分が表示されます。

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
| `UNIT` | 消費単位、つまりベーステーブルのパーティションです。`orders` には明示的なパーティションがないため、テーブルと同じ名前のパーティションが一つあります |
| `CONSUMPTION_STATUS` | そのパーティションで消費済みの位置を示す TSO です |
| `LAG` | パーティションで最後にコミットされた TSO と、消費済みの TSO の差です。`0` は未消費分がないことを示します |
| `LAST_CONSUMPTION_TIME` | 直近の消費時刻（ミリ秒単位のタイムスタンプ）です。`-1` は一度も消費されていないことを示します |

ステップ 5 の `INSERT INTO orders_changes SELECT ...` を再度実行すると、`LAG` は `0` に戻ります。

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
| 作成直後の Stream が空である | `show_initial_rows = false` の場合、Stream 作成時に既に存在するデータは変更として出力されません。新たにデータを変更してから、再度クエリしてください |
| `SELECT * FROM orders_stream` に変更種別が表示されない | 仮想列は `SELECT *` に含まれません。`__DORIS_STREAM_CHANGE_TYPE_COL__` と `__DORIS_STREAM_SEQUENCE_COL__` を明示的に指定してください |
| クエリのたびに同じ変更が返ってくる | 通常の `SELECT` は変更を読み取るだけで、オフセットを進めません。`INSERT INTO ... SELECT ... FROM orders_stream` で消費すると、同じ変更は返らなくなります |
| 既存のテーブルで Row Binlog を有効にしたい | Row Binlog を有効にできるのはテーブル作成時だけです。Row Binlog を有効にした新しいテーブルを作成し、データを再ロードしてください。詳しくは [Row Binlog](row-binlog#enabling-row-binlog) を参照してください |
| `LAST_CONSUMPTION_TIME` が `-1` と表示される | そのパーティションは一度も消費されていません |

## 次のステップ {#next-steps}

- 三種類の消費タイプの違い、`show_initial_rows` の意味、読み取りと消費のトランザクション上の意味: [Table Stream の基本](table-stream)
- パーティション単位での消費、スナップショット読み取り、ディメンションテーブルとの結合、ベーステーブルの DDL が Stream に与える影響: [Table Stream の高度な使い方](table-stream-advanced)
- Row Binlog のプロパティ、対応範囲、制限事項: [Row Binlog](row-binlog)
- Stream を作成せずに時間範囲を指定して変更を読み取る方法: [増分クエリ](incremental-query)
