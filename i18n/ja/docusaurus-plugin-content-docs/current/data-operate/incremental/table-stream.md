---
{
    "title": "Table Stream の基本",
    "language": "ja",
    "description": "Doris Table Stream のガイドです。Stream の作成・表示・削除、append_only / min_delta / detail の消費タイプ、show_initial_rows、読み取りと消費の違いについて説明します。",
    "keywords": [
        "Table Stream",
        "Doris Stream",
        "CREATE STREAM",
        "DROP STREAM",
        "SHOW STREAMS",
        "SHOW CREATE STREAM",
        "ALTER STREAM",
        "append_only",
        "min_delta",
        "detail",
        "show_initial_rows",
        "consumption offset",
        "offset",
        "__DORIS_STREAM_CHANGE_TYPE_COL__",
        "__DORIS_STREAM_SEQUENCE_COL__",
        "__DORIS_STREAM_LSN_COL__",
        "APPEND UPDATE_BEFORE UPDATE_AFTER DELETE",
        "incremental ETL",
        "downstream table sync",
        "__DORIS_DELETE_SIGN__",
        "information_schema.table_streams",
        "enable_table_stream",
        "Incremental View Maintenance",
        "IVM",
        "change data consumption"
    ]
}
---

<!-- Knowledge type: Operations guide + Feature description -->
<!-- Use cases: Incremental ETL / Downstream table sync / Change auditing / Exactly-once consumption of table changes -->

Table Stream（以下、Stream）は、[Row Binlog](row-binlog) 上に構築された変更データの消費用オブジェクトです。Stream は消費済みの位置を記録します。読み取るたびに、前回の消費以降にベーステーブルで発生した変更だけが返されます。消費オフセットは、変更をターゲットテーブルへ書き込むトランザクション内で進むため、変更の取りこぼしや二重消費を防げます。

:::caution 実験的な機能
この機能はバージョン 5.0.0 以降で利用でき、実験的な機能です。FE の設定で `enable_feature_binlog = true` と `enable_table_stream = true` が必要です。
:::

## 基本概念

<!-- Knowledge type: Concept description -->

| 概念 | 説明 |
|---|---|
| ベーステーブル | Stream が追跡するテーブルです。Row Binlog を有効にする必要があります。一つのベーステーブルに複数の Stream を作成でき、それぞれ独立して消費します |
| 消費オフセット | Stream はベーステーブルの各パーティションについて、消費済みのコミットタイムスタンプ（TSO）を記録します。Stream を読み取ると、各パーティションについて、そのオフセットから文の開始時点における最新のコミットまでの変更が返されます |
| 変更タイプ | `APPEND`（挿入）、`UPDATE_BEFORE`（更新前の値）、`UPDATE_AFTER`（更新後の値）、`DELETE`（削除。削除前の値を含む）です |
| 消費タイプ | Stream の作成時に指定する `type` です。変更をどの粒度で出力するかを決めます。[消費タイプ](#consumption-types)を参照してください |
| 読み取りと消費 | 通常の `SELECT` は変更を読み取るだけで、オフセットを進めません。`INSERT INTO ... SELECT ... FROM <stream>` は書き込みが成功するとオフセットを進めます。[読み取りと消費](#reading-and-consuming)を参照してください |

:::info IVM の内部 Stream
[増分ビュー保守（IVM）](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view)は、名前が `__doris_ivm_stream_` で始まる内部 Stream を自動作成します。これらの Stream を作成、消費、削除する必要はありません。また、Doris は通常の `INSERT INTO` 文でこれらを使用することを許可しません。
:::

## 前提条件

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 以降で、FE の `enable_feature_binlog = true` と `enable_table_stream = true` が設定されていること。
- Row Binlog を有効にした内部ベーステーブル。`min_delta` / `detail` タイプでは、さらに `binlog.need_historical_value` を有効にした Unique Key MoW テーブルが必要です。[Row Binlog](row-binlog#supported-scope-and-limitations)を参照してください。
- Stream を作成するデータベースに対する `CREATE_PRIV` と、ベーステーブルに対する `SELECT_PRIV`。

## Stream の作成と管理

<!-- Knowledge type: Operational steps + Syntax reference -->

### Stream の作成

```sql
CREATE STREAM [IF NOT EXISTS] [<db_name>.]<stream_name>
ON TABLE [<db_name>.]<table_name>
[COMMENT '<comment>']
[PROPERTIES (
    "type" = "<append_only | min_delta | detail>",
    "show_initial_rows" = "<true | false>"
)]
```

| プロパティ | デフォルト | 説明 |
|---|---|---|
| `type` | `min_delta` | 消費タイプです。`min_delta` と `detail` には、`binlog.need_historical_value` を有効にした Unique Key MoW ベーステーブルが必要です。Duplicate Key テーブルでは、`min_delta` は `append_only` として扱われます |
| `show_initial_rows` | `false` | Stream 作成時に既存のデータを変更として出力するかどうかです。[初期行](#initial-rows)を参照してください |

例：

```sql
CREATE STREAM orders_stream ON TABLE orders
COMMENT 'sync order changes to dwd'
PROPERTIES (
    "type" = "min_delta",
    "show_initial_rows" = "false"
);
```

Stream を作成するための要件と、満たしていない場合のエラーは次のとおりです。

| 要件 | 満たしていない場合のエラー |
|---|---|
| ベーステーブルで Row Binlog が有効 | `Base Olap table ... need to enable row binlog for table stream` |
| `type = min_delta` の場合、`binlog.need_historical_value` を有効にした MoW ベーステーブル | `MIN_DELTA table stream requires base mow table to enable binlog.need_historical_value=true` |
| Stream を作成するデータベースに対する `CREATE_PRIV` と、ベーステーブルに対する `SELECT_PRIV` | - |

Stream とベーステーブルは異なるデータベースに配置できます。Stream にテーブルやビューと同じ名前は付けられません。`CREATE OR REPLACE STREAM` はまだサポートされていません。完全な構文は [CREATE STREAM](../../sql-manual/sql-statements/table-and-view/stream/CREATE-STREAM) を参照してください。

### Stream の表示

```sql
-- List the Streams in the current database
SHOW STREAMS;
SHOW STREAMS FROM demo LIKE 'orders%';

-- Show the CREATE STREAM statement
SHOW CREATE STREAM orders_stream;

-- Show the columns of the Stream (the same as the current visible columns of the base table)
DESC orders_stream;
```

```text
mysql> SHOW CREATE STREAM orders_stream\G
*************************** 1. row ***************************
       Stream: orders_stream
Create Stream: CREATE STREAM `orders_stream`
ON TABLE internal.demo.orders
COMMENT 'sync order changes to dwd'
PROPERTIES (
"type" = "MIN_DELTA",
"show_initial_rows" = "false"
);
```

`information_schema.table_streams` にはすべての Stream とその状態が一覧表示されます。`information_schema.table_stream_consumption` には、各パーティションの消費オフセットと未消費データ量が表示されます。

```sql
SELECT STREAM_NAME, CONSUME_TYPE, BASE_TABLE_DB, BASE_TABLE_NAME, ENABLED, IS_STALE, STALE_REASON
FROM information_schema.table_streams
WHERE DB_NAME = 'demo';
```

```text
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| STREAM_NAME   | CONSUME_TYPE | BASE_TABLE_DB | BASE_TABLE_NAME | ENABLED | IS_STALE | STALE_REASON |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
| orders_stream | MIN_DELTA    | demo          | orders          |       1 |        0 | N/A          |
+---------------+--------------+---------------+-----------------+---------+----------+--------------+
```

二つのシステムテーブルの各列については [table_streams](../../admin-manual/system-tables/information_schema/table_streams) と [table_stream_consumption](../../admin-manual/system-tables/information_schema/table_stream_consumption) を、各文については [SHOW STREAMS](../../sql-manual/sql-statements/table-and-view/stream/SHOW-STREAMS) と [SHOW CREATE STREAM](../../sql-manual/sql-statements/table-and-view/stream/SHOW-CREATE-STREAM) を参照してください。

### Stream の変更

現時点で変更できるのはコメントだけです。

```sql
ALTER STREAM orders_stream SET COMMENT 'new comment';
```

消費タイプと `show_initial_rows` は作成後に変更できません。変更する場合は Stream を削除して再作成してください。この文については [ALTER STREAM](../../sql-manual/sql-statements/table-and-view/stream/ALTER-STREAM) を参照してください。

### Stream の削除

```sql
DROP STREAM [IF EXISTS] [<db_name>.]<stream_name> [FORCE];
```

- Stream を削除しても、ベーステーブルとその Row Binlog には影響しません。
- ベーステーブルが削除された Stream はカタログに残るため、`FORCE` を指定して削除してください。
- コンピュートとストレージを分離したモードでは、`DROP STREAM ... FORCE` が必須です。
- Stream に対して `DROP TABLE` を実行すると失敗し、`DROP STREAM` を使用するよう案内されます。

この文については [DROP STREAM](../../sql-manual/sql-statements/table-and-view/stream/DROP-STREAM) を参照してください。

## 消費タイプ

<!-- Knowledge type: Behavior rules + Selection guide -->
<!-- Use cases: Choosing between append_only / min_delta / detail -->

| 消費タイプ | 出力 | 適した用途 | ベーステーブルの要件 |
|---|---|---|---|
| `append_only` | 挿入行のみ。更新と削除は出力されません | 追記専用のログやイベントテーブル、下流で新しいデータだけが必要な場合 | Row Binlog が有効 |
| `min_delta`（デフォルト） | 二回の消費の間の全変更をキーごとにまとめ、正味の変更だけを出力します | 最小限の行数で下流テーブルを同期する場合 | `binlog.need_historical_value` を有効にした Unique Key MoW テーブル |
| `detail` | すべての変更を行ごとに出力し、まとめません | 監査、リプレイ、変更の完全な履歴が必要な場合 | `binlog.need_historical_value` を有効にした Unique Key MoW テーブル |

以下では、同じデータを使って三つの消費タイプを比較します。ベーステーブル `orders` は更新前の値の記録を有効にした Unique Key MoW テーブルです。Stream の作成後に次の文を実行します。

```sql
INSERT INTO orders VALUES (1, 'paid', 100.00);      -- update existing order 1
DELETE FROM orders WHERE order_id = 2;              -- delete existing order 2
INSERT INTO orders VALUES (4, 'created', 400.00);   -- new order 4
INSERT INTO orders VALUES (5, 'created', 500.00);   -- new order 5
DELETE FROM orders WHERE order_id = 5;              -- delete order 5 again
```

続いて、次のクエリを実行します。

```sql
SELECT order_id, status, amount, __DORIS_STREAM_CHANGE_TYPE_COL__ AS change_type
FROM <stream>
ORDER BY __DORIS_STREAM_SEQUENCE_COL__, __DORIS_STREAM_LSN_COL__;
```

### append_only

挿入行だけが出力され、更新と削除は出力されません。追記専用のログやイベントテーブル、下流で新しいデータだけが必要な場合に適しています。

```text
+----------+---------+--------+-------------+
| order_id | status  | amount | change_type |
+----------+---------+--------+-------------+
|        4 | created | 400.00 | APPEND      |
|        5 | created | 500.00 | APPEND      |
+----------+---------+--------+-------------+
```

- 注文 1 の更新と注文 2 の削除は除外されます。
- 注文 5 の挿入は出力され、後続の削除によって取り消されません。
- MoW テーブルでは、存在しないキーへの書き込みだけが挿入として扱われます。既存のキーへの書き込みは更新となり、出力されません。

### min_delta（デフォルト）

二回の消費の間の全変更をキーごとにまとめ、正味の変更だけを出力します。

| 消費開始時にキーが存在するか | 現在存在するか | 出力 |
|---|---|---|
| いいえ | はい | 現在の値を持つ `APPEND` 一行 |
| はい | はい（途中で変更あり） | 開始時の値を持つ `UPDATE_BEFORE` 一行と、現在の値を持つ `UPDATE_AFTER` 一行 |
| はい | いいえ | 開始時の値を持つ `DELETE` 一行 |
| いいえ | いいえ | 出力なし |

```text
+----------+---------+--------+---------------+
| order_id | status  | amount | change_type   |
+----------+---------+--------+---------------+
|        1 | created | 100.00 | UPDATE_BEFORE |
|        1 | paid    | 100.00 | UPDATE_AFTER  |
|        2 | created | 200.00 | DELETE        |
|        4 | created | 400.00 | APPEND        |
+----------+---------+--------+---------------+
```

- 注文 5 は挿入後に削除されたため、正味の変更はなく、何も出力されません。
- 二回の消費の間に同じキーを何度更新しても、`UPDATE_BEFORE` / `UPDATE_AFTER` の組は一組だけ出力されます。途中の値はまとめられます。
- 変更をまとめる際は、そのパーティションの現在の消費オフセットを起点にします。この消費の後で注文 4 が再度変更されると、次回の読み取りでの `UPDATE_BEFORE` は今回の消費時点の値になります。

`min_delta` は、下流テーブルを同期する際に最も一般的なタイプです。下流では `APPEND` / `UPDATE_AFTER` の行を書き込み、`DELETE` の行に応じて削除します。これにより、最小限の行数を処理しながらベーステーブルとの整合性を保てます。

### detail

すべての変更を行ごとに出力します。更新は `UPDATE_BEFORE` 行と `UPDATE_AFTER` 行に分かれ、変更はまとめられません。監査、リプレイ、変更の完全な履歴が必要な場合に適しています。

```text
+----------+---------+--------+---------------+
| order_id | status  | amount | change_type   |
+----------+---------+--------+---------------+
|        1 | created | 100.00 | UPDATE_BEFORE |
|        1 | paid    | 100.00 | UPDATE_AFTER  |
|        2 | created | 200.00 | DELETE        |
|        4 | created | 400.00 | APPEND        |
|        5 | created | 500.00 | APPEND        |
|        5 | created | 500.00 | DELETE        |
+----------+---------+--------+---------------+
```

### Duplicate Key テーブルでの動作

Duplicate Key テーブルは挿入のみを記録するため、三つのタイプは同じ結果を出力します。書き込まれた各行が一つの `APPEND` となり、同じキーへの複数回の書き込みもまとめられません。`DELETE` 文で削除された行は出力されません（[Row Binlog](row-binlog#duplicate-key-tables)を参照）。Duplicate Key テーブルに作成した `min_delta` Stream は、自動的に `append_only` として扱われます。

## 初期行

<!-- Knowledge type: Configuration parameters + Behavior rules -->
<!-- Use cases: Syncing the existing data first, then the increments -->

`show_initial_rows` は、Stream 作成時にすでに存在していたデータを出力するかどうかを決めます。

| 値 | 動作 |
|---|---|
| `false`（デフォルト） | 作成時点での各パーティションの最新コミットに消費オフセットを初期化します。作成後の変更だけが出力されます |
| `true` | 最初の読み取りで、ベーステーブルの現在の全データを `APPEND` 行として出力します（各行の `__DORIS_STREAM_SEQUENCE_COL__` は、そのパーティションのコミットタイムスタンプです）。その消費後、Stream は増分モードに切り替わります |

`show_initial_rows = true` を指定すると、別途フルロードを行わずに「まず既存データを同期し、その後は増分を同期する」方式を実現できます。ただし、最初の読み取りでは**読み取り時点のテーブル全体の状態**が返されます。Stream の作成から最初の消費までの変更は個別の変更として出力されず、この状態に反映されます。

設定値にかかわらず、Stream の作成後に追加されたパーティションでは、その全データが変更として出力されます。

## 読み取りと消費

<!-- Knowledge type: Behavior rules + Operational examples -->
<!-- Use cases: Understanding which operations advance the consumption offset -->

### 読み取りではオフセットは進まない

Stream に対する通常の `SELECT` は、各パーティションについて、消費オフセットから文の開始時点における最新のコミットまでの変更を返します。オフセットは進まず、クエリを繰り返すと同じ結果が返されます（その間にベーステーブルへの新たな書き込みがない場合）。二つのクエリの間に行われた書き込みは、後のクエリに現れます。

Stream には通常のテーブルと同様に、WHERE、JOIN、集約、CTE などを使用できます。

```sql
-- Only deletes
SELECT order_id FROM orders_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ = 'DELETE';

-- Count the pending changes
SELECT __DORIS_STREAM_CHANGE_TYPE_COL__, COUNT(*)
FROM orders_stream GROUP BY 1;
```

### INSERT ... SELECT ではオフセットが進む

`INSERT INTO <target> SELECT ... FROM <stream>` では、書き込みトランザクションのコミット時に、対象パーティションの消費オフセットが今回の読み取り範囲の上限まで進みます。

```sql
INSERT INTO dwd_orders
SELECT order_id, status, amount
FROM orders_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

消費のセマンティクスは次のとおりです。

| セマンティクス | 説明 |
|---|---|
| 原子性 | ターゲットテーブルへの書き込みとオフセットの更新は一つのトランザクションで行われます。文が失敗またはキャンセルされた場合、オフセットは変わらず、次回の消費で同じバッチを再び読み取ります |
| 重複なし | 消費済みの変更バッチが再び返されることはありません。二つのセッションが同じ Stream の同じパーティションを同時に消費すると、後からコミットするトランザクションは失敗（`target offset already consumed`）してロールバックされるため、二重消費は起きません |
| フィルターされた行はスキップ | SELECT の WHERE で一部の行を除外しても、オフセットは読み取り範囲に従って進みます。上の例で除外された `UPDATE_BEFORE` と `DELETE` の行は再び現れません。下流で削除も必要な場合は、同じ文で書き込むか、別の Stream で消費してください |
| 結果が空でも進む | 読み取り結果に行がなくても、オフセットは今回の読み取り範囲の上限まで進みます |
| 一つの文で複数の Stream を消費可能 | 対象の Stream のオフセットがすべて進みます。同じ Stream を一つの文で複数回参照した場合（別名、CTE、サブクエリなど）、オフセットは一度だけ進み、すべての参照から同じデータが見えます |

ターゲットテーブルは Doris の内部テーブルである必要があります。コンピュートとストレージを分離したモードでは、消費する文は通常の `INSERT INTO ... SELECT` でなければなりません。明示的なトランザクション（`BEGIN ... COMMIT`）内や Group Commit で実行すると、`Cloud Table Stream consumption only supports a normal INSERT into a local OLAP table` エラーで失敗します。

### 一般的な消費パターン

`min_delta` の変更を Unique Key ターゲットテーブルへ同期するには、挿入行と更新後の値を直接書き込み、削除サインを使って削除を適用します。

```sql
CREATE TABLE dwd_orders (
    order_id BIGINT,
    status   VARCHAR(16),
    amount   DECIMAL(10, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 8
PROPERTIES ("enable_unique_key_merge_on_write" = "true");

INSERT INTO dwd_orders (order_id, status, amount, __DORIS_DELETE_SIGN__)
SELECT order_id, status, amount,
       CASE WHEN __DORIS_STREAM_CHANGE_TYPE_COL__ = 'DELETE' THEN 1 ELSE 0 END
FROM orders_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER', 'DELETE');
```

この文を定期的に実行すれば（たとえば Doris の [Job Scheduler](../../admin-manual/workload-management/job-scheduler) や外部スケジューラーを使用）、シンプルな増分同期パイプラインを構築できます。Unique Key ターゲットテーブルへの書き込みは性質上冪等です。そのため、コミット後にスケジューラーが状態を記録する前にジョブが失敗し、再実行されても、不正なデータは生じません。

## 仮想列

<!-- Knowledge type: Parameter reference -->

Stream の列は、ベーステーブルで現在参照可能な列（ベーステーブルの `ADD COLUMN` / `DROP COLUMN` 後に自動同期）に、三つの仮想列を加えたものです。仮想列は `SELECT *` には含まれないため、明示的に指定する必要があります。

| 仮想列 | 型 | 説明 |
|---|---|---|
| `__DORIS_STREAM_CHANGE_TYPE_COL__` | STRING | 変更タイプ：`APPEND` / `UPDATE_BEFORE` / `UPDATE_AFTER` / `DELETE` |
| `__DORIS_STREAM_SEQUENCE_COL__` | BIGINT | 変更のコミットタイムスタンプ（TSO）です。同じトランザクションの変更は同じ値を持ちます |
| `__DORIS_STREAM_LSN_COL__` | BIGINT | トランザクション内における変更のシーケンス番号です。`ORDER BY __DORIS_STREAM_SEQUENCE_COL__, __DORIS_STREAM_LSN_COL__` により、変更が発生した順に並びます |

`<stream>@snapshot()` と `<stream>@reset()` は、変更ではなくテーブルの状態を読み取り、仮想列は提供しません。[Table Stream の詳細](table-stream-advanced)を参照してください。

## 制限事項

<!-- Knowledge type: Usage limitations -->

- ベーステーブルは Row Binlog を有効にした内部テーブルである必要があります。サポートされるテーブルモデルと列型の制限については [Row Binlog](row-binlog#supported-scope-and-limitations) を参照してください。
- Stream が読み取るのはベーステーブルのベースインデックスだけです。Rollup / マテリアライズドビューは指定できず、`TABLET (...)` 句もサポートされません。
- Stream を `INSERT`、`UPDATE`、`DELETE` のターゲットにすることはできません。
- 消費タイプと `show_initial_rows` は作成後に変更できません。
- Row Binlog の保持期間は、消費の進捗にかかわらず `binlog.ttl_seconds` で制御されます（デフォルトは一日）。オフセットが期限切れになると `min_delta` の読み取りは失敗し、`detail` と `append_only` は期限切れの変更をスキップします。現在の実装では、`IS_STALE` / `STALE_REASON` は TTL による期限切れを報告しません。保持期間内に消費してください。[保持とクリーンアップ](row-binlog#retention-and-cleanup)を参照してください。
- ベーステーブルの削除、パーティションの削除や置き換えなどが Stream に与える影響については、[Table Stream の詳細](table-stream-advanced#effect-of-base-table-changes)を参照してください。

## よくある質問

<!-- Knowledge type: FAQ -->

| 質問 | 回答 |
|---|---|
| 作成したばかりの Stream が空なのはなぜですか？ | `show_initial_rows = false`（デフォルト）では、作成時にすでに存在するデータは変更として出力されません。既存データが必要な場合は `show_initial_rows = true` で Stream を作成してください。[初期行](#initial-rows)を参照してください |
| `SELECT *` に変更タイプが表示されないのはなぜですか？ | 仮想列は `SELECT *` に含まれません。`__DORIS_STREAM_CHANGE_TYPE_COL__` などの仮想列を明示的に指定してください |
| 消費時に WHERE で除外した行を再び読み取れますか？ | いいえ。フィルターにかかわらず、オフセットは読み取り範囲に従って進みます。必要な変更タイプはすべて同じ文で書き込んでください |
| 二つのジョブが同じ Stream を同時に消費するとどうなりますか？ | 後からコミットするトランザクションは `target offset already consumed` エラーで失敗し、ロールバックされます。各パーティションを同時に消費するジョブは一つにしてください。[複数の Stream と並行消費](table-stream-advanced#multiple-streams-and-concurrent-consumption)を参照してください |
| Duplicate Key テーブルに `min_delta` Stream を作成できますか？ | はい。ただし、自動的に `append_only` として扱われ、`DELETE` 文で削除された行は出力されません |
| Stream の消費タイプを変更できますか？ | いいえ。現時点で `ALTER STREAM` が変更できるのはコメントだけです。Stream を削除して再作成してください |
| その他のエラーはどこで説明されていますか？ | [一般的なエラー](table-stream-advanced#common-errors)を参照してください |
