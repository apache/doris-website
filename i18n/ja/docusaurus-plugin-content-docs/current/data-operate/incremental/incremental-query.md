---
{
    "title": "増分クエリ",
    "language": "ja",
    "description": "Table Stream を使わずに @incr で Doris テーブルの行単位の変更を時間範囲で読み取る方法。APPEND_ONLY、MIN_DELTA、DETAIL の構文、例、制限事項を説明します。",
    "keywords": [
        "@incr",
        "Doris の増分クエリ",
        "増分クエリ",
        "startTimestamp",
        "endTimestamp",
        "incrementType",
        "APPEND_ONLY",
        "MIN_DELTA",
        "DETAIL",
        "時間範囲内の変更",
        "ステートレスな増分読み取り",
        "__DORIS_BINLOG_OP__",
        "行 Binlog クエリ",
        "外部スケジューラーによる増分 ETL",
        "INCR クエリにはベーステーブルでの ROW binlog の有効化が必要",
        "Table Stream と @incr の比較"
    ]
}
---

<!-- Knowledge type: Operations guide + Syntax description -->
<!-- Use cases: Ad-hoc incremental reads by time range / External systems managing their own positions -->

[行 Binlog](row-binlog) が有効なテーブルでは、[Table Stream](table-stream) を介して変更を消費するほか、`@incr` を使って指定した時間範囲内の変更をクエリで直接読み取れます。オブジェクトの作成や消費オフセットの記録は不要です。通常のステートレスなクエリとして、WHERE、JOIN、集約などと自由に組み合わせられます。

:::caution 実験的な機能
この機能はバージョン 5.0.0 から利用できる実験的な機能です。現時点では、ストレージとコンピュートが統合されたモードで `@incr` を使用してください。ストレージとコンピュートが分離されたモードへの対応は開発中です。
:::

## Table Stream との違い {#differences-from-table-stream}

<!-- Knowledge type: Comparison + Selection guide -->

| | `@incr` 増分クエリ | Table Stream |
|---|---|---|
| 作成するオブジェクト | なし | あり |
| 読み取る範囲 | 指定した時間範囲 | 最後の消費オフセットから現在まで |
| 読み取り位置の追跡者 | ユーザー（例：外部スケジューラーが前回の時間範囲を記録） | Doris。パーティションごとに追跡し、消費トランザクションとともにアトミックに進める |
| 繰り返し読み取り | 同じ時間範囲を何度でも読み取れる | 消費済みの変更は再び返されない |
| 適した用途 | アドホック分析、過去の一定期間の変更の確認、読み取り位置を独自に管理する外部システム | 厳密に一度だけの処理が必要な継続的な増分 ETL |

## 前提条件 {#prerequisites}

<!-- Knowledge type: Environment requirements -->

- Doris 5.0.0 以降で、FE の `enable_feature_binlog = true` が設定されていること。
- ベーステーブルで行 Binlog が有効になっていること。有効でない場合、クエリは `INCR query requires ROW binlog enabled on base table.` というエラーで失敗します。
- `MIN_DELTA` モードでは、ベーステーブルが Unique Key MoW テーブルで、`binlog.need_historical_value` が有効になっていること。
- 現時点では、ストレージとコンピュートが統合されたモードであること。

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
| `startTimestamp` | 保持されている最初の TSO | 省略可能。時間範囲の開始時刻。形式は `yyyy-MM-dd HH:mm:ss` で、セッションの `time_zone` に従って解釈されます。コミット時刻が開始時刻**以上**の変更が、ベーステーブルの `binlog.ttl_seconds` による保持期間内で返されます |
| `endTimestamp` | 上限なし | 省略可能。時間範囲の終了時刻。形式は開始時刻と同じです。コミット時刻が終了時刻**より前**の変更が返されます |
| `incrementType` | `MIN_DELTA` | 省略可能。増分モードです。[三つの増分モード](#the-three-incremental-modes)を参照してください |

すべてのパラメーターを省略できます。`t@incr()` は、保持されている変更を `MIN_DELTA` モードで読み取ります。明示的に指定した開始時刻が保持期間外にある場合、`MIN_DELTA` ではエラーになります。`DETAIL` と `APPEND_ONLY` では、実際の開始位置が保持されている最初の TSO に移動します。[保持とクリーンアップ](row-binlog#retention-and-cleanup)を参照してください。時間範囲は左閉右開の区間 `[startTimestamp, endTimestamp)` です。開始時刻が終了時刻より後、または未来である場合、保持期間の検証を通過すれば空の結果を返します。

### 結果列 {#result-columns}

結果には、ベーステーブルの可視列に加えて、次の隠し列が含まれます。

| 隠し列 | 説明 |
|---|---|
| `__DORIS_BINLOG_OP__` | 変更種別：`0` は挿入（APPEND）、`1` は削除（DELETE）、`2` は更新前（UPDATE_BEFORE）、`3` は更新後（UPDATE_AFTER） |
| `__DORIS_BINLOG_TSO__` | 変更のコミットタイムスタンプ |
| `__DORIS_BINLOG_LSN__` | トランザクション内のシーケンス番号。TSO と組み合わせて並び順を決めるために使用します |

## 三つの増分モード {#the-three-incremental-modes}

<!-- Knowledge type: Behavior rules + Selection guide -->

| モード | 出力 | ベーステーブルの要件 |
|---|---|---|
| `APPEND_ONLY` | 時間範囲内に挿入された行。更新と削除は出力されません | 行 Binlog が有効であること |
| `MIN_DELTA` | 時間範囲内における各キーの正味の変更。以下の集約規則を参照してください | MoW テーブルでは `binlog.need_historical_value` が有効であること |
| `DETAIL` | 時間範囲内のすべての変更。更新は UPDATE_BEFORE 行と UPDATE_AFTER 行に分かれます | 行 Binlog が有効であること |

`MIN_DELTA` は、時間範囲の開始時点と終了時点の各キーの状態を比較します。

| 開始時点にキーが存在するか | 終了時点にキーが存在するか | 出力 |
|---|---|---|
| いいえ | はい | APPEND を一行 |
| はい | はい。途中で変更あり | UPDATE_BEFORE（開始時点の値）を一行と UPDATE_AFTER（終了時点の値）を一行 |
| はい | いいえ | DELETE を一行 |
| いいえ | いいえ | なし |

Duplicate Key テーブルでは、三つのモードは同じ結果を返します。Duplicate Key テーブルでは挿入のみが行われるため、まとめる変更がありません。

## 例 {#examples}

<!-- Knowledge type: Operational examples -->
<!-- Use cases: Comparing the output of the three modes on the same batch of changes -->

### データの準備 {#data-preparation}

以下の例では、`orders` テーブル（[クイックスタート](quick-start)で使用する、更新前の値が有効な Unique Key MoW テーブル）を使用します。二つのバッチが次の時刻に書き込まれたとします。

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

### MIN_DELTA：10:03 から 10:10 までの正味の変更 {#min_delta-net-changes-between-1003-and-1010}

```sql
SELECT order_id, status, amount, __DORIS_BINLOG_OP__ AS op
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

注文 5 は時間範囲内で挿入後に削除されたため、正味の変更がなく、出力されません。

### APPEND_ONLY：同じ時間範囲内に挿入された行 {#append_only-rows-inserted-within-the-same-window}

```sql
SELECT order_id, status, amount, __DORIS_BINLOG_OP__ AS op
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

### DETAIL：同じ時間範囲内のすべての変更 {#detail-every-change-within-the-same-window}

```sql
SELECT order_id, status, amount, __DORIS_BINLOG_OP__ AS op
FROM orders@incr(
    "startTimestamp" = "2026-09-14 10:03:00",
    "endTimestamp"   = "2026-09-14 10:10:00",
    "incrementType"  = "DETAIL"
)
ORDER BY __DORIS_BINLOG_TSO__, __DORIS_BINLOG_LSN__, op;
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

### 時間範囲の指定なし：テーブル作成以降の正味の変更 {#no-window-net-changes-since-the-table-was-created}

この例では、テーブル作成以降のすべての変更が保持期間内にあると仮定します。それ以外の場合、時間範囲を省略すると、保持されている変更だけが読み取られます。

```sql
SELECT order_id, status, amount, __DORIS_BINLOG_OP__ AS op
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

テーブル作成時点ではどのキーも存在しません。そのため、現在も存在するすべてのキーが最新の値を持つ APPEND として出力され、削除された注文 2 と 5 は出力されません。

## 推奨事項 {#recommendations}

<!-- Knowledge type: Usage recommendations -->
<!-- Use cases: Periodic increments driven by an external scheduler -->

- 外部スケジューラーで増分読み取りを実行する場合は、前回の `endTimestamp` を次回の `startTimestamp` として使用してください。保持期間内であれば、左閉右開の時間範囲により、取りこぼしや重複を防げます。消費までの遅延は `binlog.ttl_seconds` 未満に抑えてください。時間範囲はコミット時刻で決まる点に注意してください。実行中のトランザクションは現在の時間範囲には現れず、そのコミット時刻を含む時間範囲に現れます。
- 最新の値のみが必要で、更新前の値が不要な場合は、`__DORIS_BINLOG_OP__ IN (0, 1, 3)` の行だけを残してください。
- `@incr` クエリは時間範囲内のすべての変更レコードを読み取ります。時間範囲が広いほど、読み取るレコードは多くなります。可能な限り時間範囲を指定してください。

## 制限事項とよくあるエラー {#limitations-and-common-errors}

<!-- Knowledge type: Troubleshooting -->

| 制限事項 | エラーメッセージ | 対処方法 |
|---|---|---|
| ベーステーブルで行 Binlog が有効である必要があります | `INCR query requires ROW binlog enabled on base table.` | `binlog.enable` と `binlog.format = ROW` を指定してベーステーブルを作り直してください。[行 Binlog](row-binlog#enabling-row-binlog)を参照してください |
| `MIN_DELTA` には、`binlog.need_historical_value` が有効な Unique Key MoW テーブルが必要です | `MIN_DELTA INCR query requires base table to be UNIQUE KEY with enable_unique_key_merge_on_write=true` または `... requires base table to enable binlog.need_historical_value=true` | それに従ってベーステーブルを作り直すか、`APPEND_ONLY` / `DETAIL` を使用してください |
| 読み取れるのはベースインデックスのみです | - | マテリアライズドビューとロールアップは指定できません |
| `PREAGGOPEN` ヒントはサポートされていません | - | ヒントを削除してください |
| 使用できるパラメーターは `startTimestamp`、`endTimestamp`、`incrementType` のみです | `Unsupported parameter in incr query` | パラメーター名のスペルを確認してください |
