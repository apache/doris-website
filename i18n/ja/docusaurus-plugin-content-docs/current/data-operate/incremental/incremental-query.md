---
{
    "title": "増分クエリ",
    "language": "ja",
    "description": "Table Stream を使わずに、@incr で指定した時間ウィンドウ内の Doris テーブルの行レベルの変更を読み取る方法。APPEND_ONLY、MIN_DELTA、DETAIL の構文、例、制限事項。",
    "keywords": [
        "@incr",
        "Doris incremental query",
        "incremental query",
        "startTimestamp",
        "endTimestamp",
        "incrementType",
        "APPEND_ONLY",
        "MIN_DELTA",
        "DETAIL",
        "changes by time window",
        "stateless incremental read",
        "__DORIS_CHANGELOG_OP__",
        "changelog query",
        "external scheduler incremental ETL",
        "INCR query requires changelog enabled on base table",
        "Table Stream vs @incr"
    ]
}
---

<!-- Knowledge type: Operations guide + Syntax description -->
<!-- Use cases: Ad-hoc incremental reads by time range / External systems managing their own positions -->

[changelog](changelog) を有効にしたテーブルでは、[Table Stream](table-stream) を介して変更を取り込むほかに、`@incr` を使い、オブジェクトの作成や取り込みオフセットの記録をせずに、指定した時間ウィンドウ内の変更をクエリから直接読み取れます。これは状態を保持しない通常のクエリであり、WHERE、JOIN、集計などと自由に組み合わせられます。

:::caution 実験的機能
この機能はバージョン 5.0.0 以降で利用できる実験的な機能です。現時点では、`@incr` をストレージとコンピュートの統合モードで使用してください。コンピュートとストレージの分離モードへの対応は現在進められています。
:::

## Table Stream との違い {#differences-from-table-stream}

<!-- Knowledge type: Comparison + Selection guide -->

| | `@incr` 増分クエリ | Table Stream |
|---|---|---|
| 作成するオブジェクト | なし | あり |
| 読み取り範囲 | 指定した時間ウィンドウ | 前回の取り込みオフセットから現在まで |
| 読み取り位置の管理者 | ユーザー（たとえば、外部スケジューラーが前回のウィンドウを記録） | Doris。パーティションごとに管理し、取り込みトランザクションと原子的に更新 |
| 繰り返し読み取り | 同じウィンドウを繰り返し読み取れる | 取り込み済みの変更は再度返されない |
| 適した用途 | アドホックな分析、特定期間の変更の振り返り、読み取り位置を独自に管理する外部システム | 厳密に一度だけ処理する必要がある継続的な増分 ETL |

## 前提条件 {#prerequisites}

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 以降で、FE の `enable_feature_changelog = true` が設定されていること。
- ベーステーブルで changelog が有効であること。有効でない場合、クエリは `INCR query requires changelog enabled on base table.` というエラーで失敗します。
- `MIN_DELTA` モードでは、`changelog.need_historical_value` が有効な Unique Key MoW ベーステーブルであること。
- 現時点では、ストレージとコンピュートの統合モードであること。

## 構文 {#syntax}

<!-- Knowledge type: Syntax reference -->

```sql
SELECT ... FROM <table_name>@incr(
    ["startTimestamp" = "<datetime>",]
    ["endTimestamp"   = "<datetime>",]
    ["incrementType"  = "<APPEND_ONLY | MIN_DELTA | DETAIL>"]
) [PARTITION (<partition_name>, ...)] [<alias>]
[WHERE ...]
```

### パラメーター {#parameters}

<!-- Knowledge type: Parameter reference -->

| パラメーター | デフォルト | 説明 |
|---|---|---|
| `startTimestamp` | 保持されている最初の TSO | 省略可能。ウィンドウの開始時刻。形式は `yyyy-MM-dd HH:mm:ss` で、セッションの `time_zone` に従って解釈されます。コミット時刻が開始時刻**以降**の変更が、ベーステーブルの `changelog.ttl_seconds` による保持期間の範囲内で返されます |
| `endTimestamp` | 上限なし | 省略可能。ウィンドウの終了時刻。形式は開始時刻と同じです。コミット時刻が終了時刻**より前**の変更が返されます |
| `incrementType` | `MIN_DELTA` | 省略可能。増分モードについては[三つの増分モード](#the-three-incremental-modes)を参照してください |

すべてのパラメーターを省略できます。`t@incr()` は、保持されている変更を `MIN_DELTA` モードで読み取ります。明示的に指定した開始時刻が保持期間外の場合、`MIN_DELTA` ではエラーになります。`DETAIL` と `APPEND_ONLY` では、実際の開始時刻が保持されている最初の TSO に移されます。[保持期間とクリーンアップ](changelog#retention-and-cleanup)を参照してください。ウィンドウは、左閉右開の区間 `[startTimestamp, endTimestamp)` です。開始時刻が終了時刻より後、または未来の場合、開始時刻が保持期間の検証を通過すれば空の結果が返されます。

### 結果の列 {#result-columns}

結果には、ベーステーブルの可視列に加えて、次の隠し列が含まれます。

| 隠し列 | 説明 |
|---|---|
| `__DORIS_CHANGELOG_OP__` | 変更の種類: `0` は挿入（APPEND）、`1` は削除（DELETE）、`2` は更新前（UPDATE_BEFORE）、`3` は更新後（UPDATE_AFTER） |
| `__DORIS_CHANGELOG_TSO__` | 変更のコミットタイムスタンプ |
| `__DORIS_CHANGELOG_LSN__` | トランザクション内のシーケンス番号。TSO とともに並び順の決定に使用します |

## 三つの増分モード {#the-three-incremental-modes}

<!-- Knowledge type: Behavior rules + Selection guide -->

| モード | 出力 | ベーステーブルの要件 |
|---|---|---|
| `APPEND_ONLY` | ウィンドウ内で挿入された行。更新と削除は出力されません | changelog が有効であること |
| `MIN_DELTA` | ウィンドウ内での各キーの正味の変更。以下の集約ルールを参照してください | MoW テーブルでは `changelog.need_historical_value` が有効であること |
| `DETAIL` | ウィンドウ内のすべての変更。更新は UPDATE_BEFORE 行と UPDATE_AFTER 行に分かれます | changelog が有効であること |

`MIN_DELTA` は、ウィンドウの開始時と終了時における各キーの状態を比較します。

| ウィンドウの開始時にキーが存在するか | ウィンドウの終了時にキーが存在するか | 出力 |
|---|---|---|
| いいえ | はい | APPEND が一行 |
| はい | はい、途中で変更された | 開始時の値を持つ UPDATE_BEFORE が一行 + 終了時の値を持つ UPDATE_AFTER が一行 |
| はい | いいえ | DELETE が一行 |
| いいえ | いいえ | なし |

Duplicate Key テーブルでは、三つのモードは同じ結果を返します。Duplicate Key テーブルには挿入しかないため、変更を集約する必要がありません。

## 例 {#examples}

<!-- Knowledge type: Operational examples -->
<!-- Use cases: Comparing the output of the three modes on the same batch of changes -->

### データの準備 {#data-preparation}

以下の例では、[Quick Start](quick-start) の `orders` テーブル（更新前の値を有効にした Unique Key MoW）を使用します。二つのバッチが次の時刻に書き込まれたとします。

```sql
-- 10:00, first batch
INSERT INTO orders VALUES (1, 'created', 100.00), (2, 'created', 200.00), (3, 'created', 300.00);

-- 10:05, second batch
INSERT INTO orders VALUES (1, 'paid', 100.00);      -- update order 1
DELETE FROM orders WHERE order_id = 2;              -- delete order 2
INSERT INTO orders VALUES (4, 'created', 400.00);   -- new order 4
INSERT INTO orders VALUES (5, 'created', 500.00);   -- new order 5
DELETE FROM orders WHERE order_id = 5;              -- delete order 5 again
```

### MIN_DELTA: 10:03 から 10:10 までの正味の変更 {#min_delta-net-changes-between-1003-and-1010}

```sql
SELECT order_id, status, amount, __DORIS_CHANGELOG_OP__ AS op
FROM orders@incr(
    "startTimestamp" = "2026-09-14 10:03:00",
    "endTimestamp"   = "2026-09-14 10:10:00",
    "incrementType"  = "MIN_DELTA"
)
ORDER BY order_id, op;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        1 | created | 100.00 |    2 |
|        1 | paid    | 100.00 |    3 |
|        2 | created | 200.00 |    1 |
|        4 | created | 400.00 |    0 |
+----------+---------+--------+------+
```

注文 5 はウィンドウ内で挿入され、削除されました。正味の変更がないため、出力されません。

### APPEND_ONLY: 同じウィンドウ内で挿入された行 {#append_only-rows-inserted-within-the-same-window}

```sql
SELECT order_id, status, amount, __DORIS_CHANGELOG_OP__ AS op
FROM orders@incr(
    "startTimestamp" = "2026-09-14 10:03:00",
    "endTimestamp"   = "2026-09-14 10:10:00",
    "incrementType"  = "APPEND_ONLY"
)
ORDER BY order_id;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        4 | created | 400.00 |    0 |
|        5 | created | 500.00 |    0 |
+----------+---------+--------+------+
```

注文 1 の更新と注文 2 の削除は除外されます。注文 5 の挿入は出力され、その後の削除によって挿入レコードが取り消されることはありません。

### DETAIL: 同じウィンドウ内のすべての変更 {#detail-every-change-within-the-same-window}

```sql
SELECT order_id, status, amount, __DORIS_CHANGELOG_OP__ AS op
FROM orders@incr(
    "startTimestamp" = "2026-09-14 10:03:00",
    "endTimestamp"   = "2026-09-14 10:10:00",
    "incrementType"  = "DETAIL"
)
ORDER BY __DORIS_CHANGELOG_TSO__, __DORIS_CHANGELOG_LSN__, op;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        1 | created | 100.00 |    2 |
|        1 | paid    | 100.00 |    3 |
|        2 | created | 200.00 |    1 |
|        4 | created | 400.00 |    0 |
|        5 | created | 500.00 |    0 |
|        5 | created | 500.00 |    1 |
+----------+---------+--------+------+
```

### ウィンドウ指定なし: テーブル作成時からの正味の変更 {#no-window-net-changes-since-the-table-was-created}

この例では、テーブル作成時からのすべての変更がまだ保持期間内にあると仮定します。そうでない場合、ウィンドウを省略すると、保持されている変更だけが読み取られます。

```sql
SELECT order_id, status, amount, __DORIS_CHANGELOG_OP__ AS op
FROM orders@incr()
ORDER BY order_id;
```

```text
+----------+---------+--------+------+
| order_id | status  | amount | op   |
+----------+---------+--------+------+
|        1 | paid    | 100.00 |    0 |
|        3 | created | 300.00 |    0 |
|        4 | created | 400.00 |    0 |
+----------+---------+--------+------+
```

テーブル作成時を起点とすると、開始時にはどのキーも存在しません。そのため、現在も存在する各キーは最新の値を持つ APPEND として出力され、削除された注文 2 と注文 5 は出力されません。

## 推奨事項 {#recommendations}

<!-- Knowledge type: Usage recommendations -->
<!-- Use cases: Periodic increments driven by an external scheduler -->

- 外部スケジューラーで増分読み取りを実行する場合は、前回の `endTimestamp` を次回の `startTimestamp` として使用してください。保持期間内であれば、左閉右開のウィンドウにより、欠落も重複も生じません。取り込みの遅延は `changelog.ttl_seconds` より短くしてください。ウィンドウはコミット時刻に基づいて定義されます。実行中のトランザクションは現在のウィンドウには現れず、そのコミット時刻を含むウィンドウに現れます。
- 最新の値だけが必要で、更新前の値が不要な場合は、`__DORIS_CHANGELOG_OP__ IN (0, 1, 3)` に該当する行だけを残してください。
- `@incr` クエリは、ウィンドウ内のすべての変更レコードを読み取ります。ウィンドウが大きいほど、読み取る量も増えます。可能な限りウィンドウを指定してください。

## 制限事項とよくあるエラー {#limitations-and-common-errors}

<!-- Knowledge type: Troubleshooting -->

| 制限事項 | エラーメッセージ | 対処方法 |
|---|---|---|
| ベーステーブルで changelog が有効であること | `INCR query requires changelog enabled on base table.` | `"changelog.enable" = "true"` を指定してベーステーブルを再作成してください。[Changelog](changelog#enabling-changelog)を参照してください |
| `MIN_DELTA` には、`changelog.need_historical_value` が有効な Unique Key MoW テーブルが必要 | `MIN_DELTA INCR query requires base table to be UNIQUE KEY with enable_unique_key_merge_on_write=true` または `... requires base table to enable changelog.need_historical_value=true` | 要件に合わせてベーステーブルを再作成するか、`APPEND_ONLY` / `DETAIL` を使用してください |
| 読み取れるのはベースインデックスのみ | - | マテリアライズドビューとロールアップは指定できません |
| `PREAGGOPEN` ヒントには対応していない | - | ヒントを削除してください |
| 指定できるのは `startTimestamp`、`endTimestamp`、`incrementType` のみ | `Unsupported parameter in incr query` | パラメーター名のスペルを確認してください |
