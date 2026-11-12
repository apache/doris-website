---
{
    "title": "Table Stream の基本",
    "language": "ja",
    "description": "Doris Table Stream のガイド：Stream の作成、表示、削除、append_only / min_delta / detail の消費タイプ、show_initial_rows、読み取りと消費の違いを説明します。",
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

Table Stream（以下、Stream）は、[changelog](changelog) を基盤とする変更データ消費用のオブジェクトです。Stream は消費済みの位置を記録します。読み取りのたびに返されるのは、前回の消費以降にベーステーブルで発生した変更だけです。消費オフセットは、変更をターゲットテーブルに書き込むトランザクション内で更新されるため、変更の取りこぼしや二重消費を防げます。

:::caution 実験的な機能
この機能はバージョン 5.0.0 から利用できますが、実験的な機能です。FE の設定で `enable_feature_changelog = true` と `enable_table_stream = true` を指定する必要があります。
:::

## 基本概念 {#basic-concepts}

<!-- Knowledge type: Concept description -->

| 概念 | 説明 |
|---|---|
| ベーステーブル | Stream が変更を追跡するテーブル。changelog を有効にする必要があります。同じベーステーブルに複数の Stream を作成でき、それぞれが独立して消費します |
| 消費オフセット | Stream はベーステーブルのパーティションごとに、消費済みのコミットタイムスタンプ（TSO）を記録します。Stream を読み取ると、各パーティションについて、そのオフセットからステートメント開始時点の最新コミットまでの変更が返されます |
| 変更タイプ | `APPEND`（挿入）、`UPDATE_BEFORE`（更新前の値）、`UPDATE_AFTER`（更新後の値）、`DELETE`（削除。削除前の値を含む） |
| 消費タイプ | Stream 作成時に指定する `type`。変更を出力する粒度を決めます。[消費タイプ](#consumption-types)を参照してください |
| 読み取りと消費 | 通常の `SELECT` は変更を読み取るだけで、オフセットを更新しません。`INSERT INTO ... SELECT ... FROM <stream>` は書き込みが成功するとオフセットを更新します。[読み取りと消費](#reading-and-consuming)を参照してください |

:::info IVM の内部 Stream
[Incremental View Maintenance（IVM）](../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view)は、名前が `__doris_ivm_stream_` で始まる内部 Stream を自動的に作成します。これらの Stream を作成、消費、削除する必要はありません。また、Doris では通常の `INSERT INTO` ステートメントからこれらの Stream を使用できません。
:::

## 前提条件 {#prerequisites}

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 以降で、FE の `enable_feature_changelog = true` と `enable_table_stream = true` が設定されていること。
- changelog が有効な内部ベーステーブルがあること。`min_delta` / `detail` タイプでは、さらに `changelog.need_historical_value` が有効な Unique Key MoW テーブルが必要です。[Changelog](changelog#supported-scope-and-limitations)を参照してください。
- Stream を作成するデータベースに対する `CREATE_PRIV` と、ベーステーブルに対する `SELECT_PRIV` があること。

## Stream の作成と管理 {#creating-and-managing-streams}

<!-- Knowledge type: Operational steps + Syntax reference -->

### Stream の作成 {#creating-a-stream}

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
| `type` | `min_delta` | 消費タイプ。`min_delta` と `detail` では、ベーステーブルが `changelog.need_historical_value` を有効にした Unique Key MoW テーブルである必要があります。Duplicate Key テーブルでは `min_delta` は `append_only` として動作します |
| `show_initial_rows` | `false` | Stream 作成時にすでに存在するデータを変更として出力するかどうか。[初期行](#initial-rows)を参照してください |

例：

```sql
CREATE STREAM orders_stream ON TABLE orders
COMMENT 'sync order changes to dwd'
PROPERTIES (
    "type" = "min_delta",
    "show_initial_rows" = "false"
);
```

Stream の作成要件と、要件を満たさない場合のエラーは次のとおりです。

| 要件 | 満たさない場合のエラー |
|---|---|
| ベーステーブルで changelog が有効 | `Base Olap table ... need to enable changelog for table stream` |
| `type = min_delta` の場合、`changelog.need_historical_value` が有効な MoW ベーステーブル | `MIN_DELTA table stream requires base mow table to enable changelog.need_historical_value=true` |
| Stream を作成するデータベースに対する `CREATE_PRIV` と、ベーステーブルに対する `SELECT_PRIV` | - |

Stream とそのベーステーブルは、異なるデータベースに配置できます。Stream にテーブルやビューと同じ名前は付けられません。`CREATE OR REPLACE STREAM` はまだサポートされていません。構文の詳細は [CREATE STREAM](../../sql-manual/sql-statements/table-and-view/stream/CREATE-STREAM) を参照してください。

### Stream の表示 {#viewing-streams}

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

`information_schema.table_streams` にはすべての Stream とその状態が一覧表示され、`information_schema.table_stream_consumption` には各パーティションの消費オフセットと未消費の変更が表示されます。

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

これらのシステムテーブルの全カラムの説明は [table_streams](../../admin-manual/system-tables/information_schema/table_streams) と [table_stream_consumption](../../admin-manual/system-tables/information_schema/table_stream_consumption) を、各ステートメントの説明は [SHOW STREAMS](../../sql-manual/sql-statements/table-and-view/stream/SHOW-STREAMS) と [SHOW CREATE STREAM](../../sql-manual/sql-statements/table-and-view/stream/SHOW-CREATE-STREAM) を参照してください。

### Stream の変更 {#modifying-a-stream}

現時点で変更できるのはコメントだけです。

```sql
ALTER STREAM orders_stream SET COMMENT 'new comment';
```

消費タイプと `show_initial_rows` は作成後に変更できません。変更するには Stream を削除して再作成してください。ステートメントの詳細は [ALTER STREAM](../../sql-manual/sql-statements/table-and-view/stream/ALTER-STREAM) を参照してください。

### Stream の削除 {#dropping-a-stream}

```sql
DROP STREAM [IF EXISTS] [<db_name>.]<stream_name> [FORCE];
```

- Stream を削除しても、ベーステーブルとその changelog には影響しません。
- ベーステーブルが削除された Stream はカタログに残ります。`FORCE` を指定して削除してください。
- コンピュートとストレージが分離されたモードでは、`DROP STREAM ... FORCE` が必須です。
- Stream に対して `DROP TABLE` を実行すると失敗し、`DROP STREAM` を使用するよう案内されます。

ステートメントの詳細は [DROP STREAM](../../sql-manual/sql-statements/table-and-view/stream/DROP-STREAM) を参照してください。

## 消費タイプ {#consumption-types}

<!-- Knowledge type: Behavior rules + Selection guide -->
<!-- Use cases: Choosing between append_only / min_delta / detail -->

| 消費タイプ | 出力 | 適した用途 | ベーステーブルの要件 |
|---|---|---|---|
| `append_only` | 挿入された行のみ。更新と削除は出力されません | 追記のみのログやイベントテーブル。下流で新しいデータだけが必要な場合 | changelog が有効 |
| `min_delta`（デフォルト） | 消費間のすべての変更をキーごとにまとめ、最終的な差分のみを出力します | 下流のテーブルを、処理行数を抑えながら同期する場合 | `changelog.need_historical_value` が有効な Unique Key MoW テーブル |
| `detail` | すべての変更を行ごとに出力し、まとめません | 監査、再生、変更履歴をすべて必要とする場合 | `changelog.need_historical_value` が有効な Unique Key MoW テーブル |

以下では、同じデータに対する各消費タイプの結果を比較します。ベーステーブル `orders` は更新前の値の記録が有効な Unique Key MoW テーブルです。Stream 作成後に、次のステートメントを実行します。

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

### append_only {#append_only}

挿入された行のみが出力され、更新と削除は出力されません。追記のみのログやイベントテーブル、または下流で新しいデータだけが必要な場合に適しています。

```text
+----------+---------+--------+-------------+
| order_id | status  | amount | change_type |
+----------+---------+--------+-------------+
|        4 | created | 400.00 | APPEND      |
|        5 | created | 500.00 | APPEND      |
+----------+---------+--------+-------------+
```

- 注文 1 の更新と注文 2 の削除は除外されます。
- 注文 5 の挿入は出力されます。その後の削除によって挿入が取り消されることはありません。
- MoW テーブルでは、存在しないキーへの書き込みのみが挿入と見なされます。既存キーへの書き込みは更新と見なされ、出力されません。

### min_delta（デフォルト） {#min_delta-default}

消費間のすべての変更をキーごとにまとめ、最終的な差分だけを出力します。

| 消費開始時にキーが存在するか | 現在も存在するか | 出力 |
|---|---|---|
| いいえ | はい | 現在の値を持つ `APPEND` を出力 |
| はい | はい（間に変更あり） | 開始時の値を持つ `UPDATE_BEFORE` と、現在の値を持つ `UPDATE_AFTER` を出力 |
| はい | いいえ | 開始時の値を持つ `DELETE` を出力 |
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

- 注文 5 は挿入後に削除されています。最終的な差分がないため、何も出力されません。
- 消費間に同じキーが何度も更新されても、`UPDATE_BEFORE` / `UPDATE_AFTER` のペアのみが出力されます。途中の値はまとめられます。
- 変更をまとめる処理は、パーティションの現在の消費オフセットから始まります。この消費の後に注文 4 が再び変更された場合、次回の読み取りでの `UPDATE_BEFORE` は、この消費時点の値になります。

`min_delta` は、下流のテーブルを同期する際に最も一般的なタイプです。下流では `APPEND` / `UPDATE_AFTER` の行を書き込み、`DELETE` の行に応じて削除することで、ベーステーブルとの整合性を保ちながら処理行数を抑えられます。

### detail {#detail}

すべての変更が行ごとに出力されます。更新は `UPDATE_BEFORE` 行と `UPDATE_AFTER` 行に分かれ、変更がまとめられることはありません。監査、再生、変更履歴をすべて必要とする場合に適しています。

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

### Duplicate Key テーブルでの動作 {#behavior-on-duplicate-key-tables}

Duplicate Key テーブルでは挿入のみが記録されるため、どのタイプでも出力は同じです。書き込まれた各行が `APPEND` として出力され、同じキーへの複数回の書き込みはまとめられません。また、`DELETE` ステートメントによって削除された行は出力されません（[Changelog](changelog#duplicate-key-tables) を参照）。Duplicate Key テーブル上に作成した `min_delta` Stream は、自動的に `append_only` として扱われます。

## 初期行 {#initial-rows}

<!-- Knowledge type: Configuration parameters + Behavior rules -->
<!-- Use cases: Syncing the existing data first, then the increments -->

`show_initial_rows` は、Stream 作成時にすでに存在するデータを出力するかどうかを指定します。

| 値 | 動作 |
|---|---|
| `false`（デフォルト） | 作成時点における各パーティションの最新コミットで消費オフセットを初期化します。作成後の変更のみが出力されます |
| `true` | 最初の読み取りで、ベーステーブルの現在の全データを `APPEND` 行として出力します（各行の `__DORIS_STREAM_SEQUENCE_COL__` は、そのパーティションのコミットタイムスタンプです）。そのデータを消費すると、Stream は増分消費に切り替わります |

`show_initial_rows = true` を指定すると、別途全件をロードせずに、既存データを先に同期してから増分を継続的に同期できます。最初の読み取りで返されるのは、**読み取り時点**の全データイメージです。Stream の作成から最初の消費までに発生した変更は、個別の変更としてではなく、そのイメージに反映されます。

設定値にかかわらず、Stream 作成後に追加されたパーティションでは、そのすべてのデータが変更として出力されます。

## 読み取りと消費 {#reading-and-consuming}

<!-- Knowledge type: Behavior rules + Operational examples -->
<!-- Use cases: Understanding which operations advance the consumption offset -->

### 読み取りではオフセットは更新されない {#reads-do-not-advance-the-offset}

Stream に対する通常の `SELECT` は、各パーティションについて、消費オフセットからステートメント開始時点の最新コミットまでの変更を返します。オフセットは変わらず、ベーステーブルに新たな書き込みがなければ、クエリを繰り返しても同じ結果が返ります。クエリ間に行われた書き込みは、後のクエリに現れます。

Stream は、WHERE、JOIN、集約、CTE などを使って通常のテーブルのように参照できます。

```sql
-- Only deletes
SELECT order_id FROM orders_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ = 'DELETE';

-- Count the pending changes
SELECT __DORIS_STREAM_CHANGE_TYPE_COL__, COUNT(*)
FROM orders_stream GROUP BY 1;
```

### INSERT ... SELECT でオフセットが更新される {#insert--select-advances-the-offset}

`INSERT INTO <target> SELECT ... FROM <stream>` は、書き込みトランザクションのコミット時に、対象パーティションの消費オフセットを今回の読み取り範囲の上限まで更新します。

```sql
INSERT INTO dwd_orders
SELECT order_id, status, amount
FROM orders_stream
WHERE __DORIS_STREAM_CHANGE_TYPE_COL__ IN ('APPEND', 'UPDATE_AFTER');
```

消費の動作は次のとおりです。

| 動作 | 説明 |
|---|---|
| 原子性 | ターゲットテーブルへの書き込みとオフセットの更新は、同じトランザクションで行われます。ステートメントが失敗またはキャンセルされた場合、オフセットは変わらず、次回の消費では同じ変更が再び読み取られます |
| 重複なし | 消費済みの変更は再び返されません。同じ Stream の同じパーティションを複数のセッションが同時に消費した場合、後からコミットしようとしたトランザクションは `target offset already consumed` で失敗し、ロールバックされます。そのため、二重には消費されません |
| フィルタリングされた行はスキップされる | SELECT の WHERE 句で一部の行を除外しても、オフセットは読み取り範囲に基づいて更新されます。上の例で除外された `UPDATE_BEFORE` と `DELETE` の行は、再び現れません。下流で削除も必要な場合は、同じステートメントで書き込むか、別の Stream から消費してください |
| 結果が空でも更新される | 読み取り結果に行がなくても、オフセットは今回の読み取り範囲の上限まで更新されます |
| 複数の Stream を同じステートメントで消費できる | 参照したすべての Stream のオフセットが更新されます。エイリアス、CTE、サブクエリなどによって同じ Stream を複数回参照しても、オフセットの更新は一度だけで、どの参照からも同じデータが見えます |

ターゲットテーブルは Doris の内部テーブルである必要があります。コンピュートとストレージが分離されたモードでは、消費するステートメントは通常の `INSERT INTO ... SELECT` として実行する必要があります。明示的なトランザクション（`BEGIN ... COMMIT`）内での実行や Group Commit を使った実行は、`Cloud Table Stream consumption only supports a normal INSERT into a local OLAP table` で失敗します。

### 典型的な消費パターン {#a-typical-consumption-pattern}

`min_delta` の変更を Unique Key ターゲットテーブルに同期します。挿入行と更新後の値は直接書き込み、削除は delete sign を使って適用します。

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

このステートメントを定期的に実行すれば、たとえば Doris の [Job Scheduler](../../admin-manual/workload-management/job-scheduler) や外部スケジューラを使って、シンプルな増分同期パイプラインを構築できます。Unique Key ターゲットテーブルへの書き込みは自然に冪等になります。したがって、コミット後、スケジューラが実行状態を記録する前に処理が失敗し、再実行された場合でも、誤ったデータは生成されません。

## 仮想カラム {#virtual-columns}

<!-- Knowledge type: Parameter reference -->

Stream のカラムは、ベーステーブルの現在の可視カラム（ベーステーブルで `ADD COLUMN` / `DROP COLUMN` を実行すると自動的に同期されます）と、次の仮想カラムで構成されます。仮想カラムは `SELECT *` に含まれないため、明示的に指定する必要があります。

| 仮想カラム | 型 | 説明 |
|---|---|---|
| `__DORIS_STREAM_CHANGE_TYPE_COL__` | STRING | 変更タイプ：`APPEND` / `UPDATE_BEFORE` / `UPDATE_AFTER` / `DELETE` |
| `__DORIS_STREAM_SEQUENCE_COL__` | BIGINT | 変更のコミットタイムスタンプ（TSO）。同じトランザクションの変更は同じ値を持ちます |
| `__DORIS_STREAM_LSN_COL__` | BIGINT | トランザクション内での変更の連番。`ORDER BY __DORIS_STREAM_SEQUENCE_COL__, __DORIS_STREAM_LSN_COL__` で変更が発生した順に並びます |

`<stream>@snapshot()` と `<stream>@reset()` は変更ではなくテーブルのイメージを読み取り、仮想カラムは提供しません。[Table Stream Advanced](table-stream-advanced) を参照してください。

## 制限事項 {#limitations}

<!-- Knowledge type: Usage limitations -->

- ベーステーブルは、changelog が有効な内部テーブルである必要があります。サポート対象のテーブルモデルとカラム型の制限は、[Changelog](changelog#supported-scope-and-limitations) を参照してください。
- Stream はベーステーブルのベースインデックスのみを読み取ります。rollup やマテリアライズドビューは指定できず、`TABLET (...)` 句もサポートされていません。
- Stream を `INSERT`、`UPDATE`、`DELETE` のターゲットにはできません。
- 消費タイプと `show_initial_rows` は作成後に変更できません。
- changelog の保持期間は、消費の進行状況にかかわらず `changelog.ttl_seconds` で制御されます（デフォルトは 1 日）。オフセットが保持期間を過ぎると、`min_delta` の読み取りは失敗し、`detail` と `append_only` は期限切れの変更をスキップします。現行の実装では、`IS_STALE` / `STALE_REASON` は TTL による期限切れを報告しません。保持期間内に消費してください。[保持とクリーンアップ](changelog#retention-and-cleanup)を参照してください。
- ベーステーブルの削除、パーティションの削除や置き換えなどが Stream に与える影響については、[Table Stream Advanced](table-stream-advanced#effect-of-base-table-changes) を参照してください。

## FAQ {#faq}

<!-- Knowledge type: FAQ -->

| 質問 | 回答 |
|---|---|
| 作成直後の Stream が空なのはなぜですか？ | `show_initial_rows = false`（デフォルト）では、作成時にすでに存在するデータは変更として出力されません。既存データも必要な場合は、`show_initial_rows = true` を指定して Stream を作成してください。[初期行](#initial-rows)を参照してください |
| `SELECT *` で変更タイプが表示されないのはなぜですか？ | 仮想カラムは `SELECT *` に含まれません。`__DORIS_STREAM_CHANGE_TYPE_COL__` などの仮想カラムを明示的に指定してください |
| 消費時に WHERE 句で除外した行を再び読み取れますか？ | いいえ。フィルタリングの有無にかかわらず、オフセットは読み取り範囲に基づいて更新されます。必要な変更タイプは、すべて同じステートメントで書き込んでください |
| 複数のジョブが同じ Stream を同時に消費するとどうなりますか？ | 後からコミットしようとしたトランザクションは `target offset already consumed` で失敗し、ロールバックされます。各パーティションを同時に消費するコンシューマーは一つにしてください。[複数の Stream と同時消費](table-stream-advanced#multiple-streams-and-concurrent-consumption)を参照してください |
| Duplicate Key テーブルに `min_delta` Stream を作成できますか？ | はい。ただし、自動的に `append_only` として扱われ、`DELETE` ステートメントで削除された行は出力されません |
| Stream の消費タイプを変更できますか？ | いいえ。現時点で `ALTER STREAM` が変更できるのはコメントだけです。Stream を削除して再作成してください |
| その他のエラーはどこで説明されていますか？ | [よくあるエラー](table-stream-advanced#common-errors)を参照してください |
