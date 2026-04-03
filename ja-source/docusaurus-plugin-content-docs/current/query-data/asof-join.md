---
{
  "title": "ASOF JOIN",
  "language": "ja",
  "description": "ASOF JOINは、日付/時刻条件に基づいて左テーブルの各行を右テーブルの最も近い適格な行にマッチさせるもので、時系列分析でよく使用される。"
}
---
## 概要

ASOF JOINは、日付/時刻列での時系列検索用に設計された特殊なタイプのJOINです。通常の等値JOINとは異なり、ASOF JOINは完全一致を必要としません。代わりに、各左テーブルの行に対して、`MATCH_CONDITION`の方向比較を満たす最も近い右テーブルの行を見つけます。

ASOF JOINは「時間差による絶対的に最も近い行」を意味するわけでは**ありません**。返される行は、`MATCH_CONDITION`で指定された方向における最も近い行です。

典型的な使用例：株式取引のテーブルと株価のテーブルがある場合、各取引に対して、取引時点で利用可能だった最新の株価を見つけます。通常のJOINでは、これには複雑なサブクエリとウィンドウ関数が必要ですが、ASOF JOINでは単一の明確なステートメントで実現できます。

ASOF JOINは2つのサブタイプをサポートします：

- **ASOF JOIN** (ASOF LEFT JOIN)：左テーブルの各行に対して、`MATCH_CONDITION`に従って右テーブルで最も近い該当する一致を見つけます。一致が見つからない場合、右側の列はNULLで埋められます。
- **ASOF INNER JOIN**：同じマッチングロジックですが、一致しない左テーブルの行は結果から除外されます。

## 構文

```sql
SELECT <select_list>
FROM <left_table>
ASOF [LEFT | INNER] JOIN <right_table>
    MATCH_CONDITION(<left_datetime_expr> <comparison_operator> <right_datetime_expr>)
    { ON <left_table.col> = <right_table.col> [AND ...]
    | USING (<column_name> [, ...]) }
```
**場所:**

- `ASOF JOIN` または `ASOF LEFT JOIN`: 左外部ASOF JOIN。一致しない左テーブルの行は右側にNULLを生成します。
- `ASOF INNER JOIN`: 内部ASOF JOIN。一致しない左テーブルの行は破棄されます。
- `<comparison_operator>`: `>=`、`>`、`<=`、`<`のいずれか。

## パラメータ

| パラメータ | 必須 | 説明 |
|-----------|------|------|
| `left_table` | はい | 左（probe）テーブル。このテーブルのすべての行が評価されます。 |
| `right_table` | はい | 右（build）テーブル。最も近い一致を見つけるために使用されます。 |
| `MATCH_CONDITION` | はい | 最近傍マッチルールを定義します。両側とも両方のテーブルからの列を参照する必要があり、両側の列は`DATEV2`、`DATETIMEV2`、または`TIMESTAMPTZ`型である必要があります。式も使用できます。サポートされる演算子: `>=`、`>`、`<=`、`<`。 |
| `ON` / `USING`句 | はい | 1つ以上の等価キーを定義します。グループ化キーとして機能し、マッチングは同一グループ内でのみ実行されます。`ON`は1つ以上の等価（`=`）条件と式をサポートします（例：`SUBSTRING(l.code, 1, 3) = r.prefix`）。`USING`は1つ以上の共有列名をサポートします。 |

## ASOF JOINマッチングの動作

マッチングルールは`MATCH_CONDITION`の比較演算子に依存します：

| 演算子 | マッチング動作 | 典型的な使用例 |
|--------|---------------|---------------|
| `>=` | 各左行について、左の値以下で**最大**の値を持つ右行を見つけます。 | イベント時刻以前または同時点での最新のスナップショット/価格を見つける。 |
| `>` | 各左行について、左の値より**厳密に小さく**、**最大**の値を持つ右行を見つけます。 | イベント時刻より厳密に前の最新のスナップショット/価格を見つける。 |
| `<=` | 各左行について、左の値以上で**最小**の値を持つ右行を見つけます。 | 現在時刻以降の次のイベント/スナップショットを見つける。 |
| `<` | 各左行について、左の値より**厳密に大きく**、**最小**の値を持つ右行を見つけます。 | 現在時刻より厳密に後の次のイベント/スナップショットを見つける。 |

**重要なルール:**

1. `MATCH_CONDITION`列は`DATEV2`、`DATETIMEV2`、または`TIMESTAMPTZ`型である必要があります。
2. `MATCH_CONDITION`では式が使用できます。例：`MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)`または`MATCH_CONDITION(l.ts >= DATE_ADD(r.ts, INTERVAL 3 HOUR))`。
3. 等価キー句は`ON`または`USING`のいずれかで記述できます。`ON`では等価（`=`）連言のみが許可されます。非等価条件（`>`、`OR`など）やリテラル比較（`l.grp = 1`など）は`ON`句では許可されません。
4. マッチ列または等価列のNULL値は一致を生成しません。左行のマッチ列がNULLの場合、またはグループ内で一致する右行が存在しない場合、右側はNULLで埋められ（LEFT JOINの場合）、行が破棄されます（INNER JOINの場合）。
5. 同じグループ内で複数の右側行が同じマッチ値を持ち、マッチ条件を満たす場合、そのうちの1つが返されます（非決定的）。

## 例

### 準備

tradesテーブルとquotesテーブルを作成します：

```sql
CREATE TABLE trades (
    trade_id INT,
    symbol VARCHAR(10),
    trade_time DATETIME,
    price DECIMAL(10, 2),
    quantity INT
) DISTRIBUTED BY HASH(trade_id) BUCKETS 3
PROPERTIES("replication_num" = "1");

CREATE TABLE quotes (
    quote_id INT,
    symbol VARCHAR(10),
    quote_time DATETIME,
    bid_price DECIMAL(10, 2),
    ask_price DECIMAL(10, 2)
) DISTRIBUTED BY HASH(quote_id) BUCKETS 3
PROPERTIES("replication_num" = "1");

INSERT INTO trades VALUES
(1, 'AAPL', '2024-01-01 10:00:05', 150.50, 100),
(2, 'AAPL', '2024-01-01 10:00:15', 151.00, 200),
(3, 'AAPL', '2024-01-01 10:00:25', 150.75, 150),
(4, 'GOOG', '2024-01-01 10:00:10', 2800.00, 50),
(5, 'GOOG', '2024-01-01 10:00:20', 2805.00, 75),
(6, 'MSFT', '2024-01-01 10:00:08', 380.00, 120);

INSERT INTO quotes VALUES
(1, 'AAPL', '2024-01-01 10:00:00', 150.00, 150.10),
(2, 'AAPL', '2024-01-01 10:00:10', 150.40, 150.60),
(3, 'AAPL', '2024-01-01 10:00:20', 150.90, 151.10),
(4, 'GOOG', '2024-01-01 10:00:05', 2795.00, 2800.00),
(5, 'GOOG', '2024-01-01 10:00:15', 2802.00, 2808.00),
(6, 'MSFT', '2024-01-01 10:00:00', 378.00, 380.00),
(7, 'MSFT', '2024-01-01 10:00:10', 379.50, 381.00);
```
### 例1: 各取引の最新の気配値を見つける (>=)

各取引について、同じ`symbol`内で、`quote_time`が取引の`trade_time`以下である最新の気配値を見つけます。

```sql
SELECT t.trade_id, t.symbol, t.trade_time, t.price,
       q.quote_id, q.quote_time, q.bid_price, q.ask_price
FROM trades t
ASOF LEFT JOIN quotes q
    MATCH_CONDITION(t.trade_time >= q.quote_time)
    ON t.symbol = q.symbol
ORDER BY t.trade_id;
```
```text
+----------+--------+---------------------+--------+----------+---------------------+-----------+-----------+
| trade_id | symbol | trade_time          | price  | quote_id | quote_time          | bid_price | ask_price |
+----------+--------+---------------------+--------+----------+---------------------+-----------+-----------+
|        1 | AAPL   | 2024-01-01 10:00:05 | 150.50 |        1 | 2024-01-01 10:00:00 |    150.00 |    150.10 |
|        2 | AAPL   | 2024-01-01 10:00:15 | 151.00 |        2 | 2024-01-01 10:00:10 |    150.40 |    150.60 |
|        3 | AAPL   | 2024-01-01 10:00:25 | 150.75 |        3 | 2024-01-01 10:00:20 |    150.90 |    151.10 |
|        4 | GOOG   | 2024-01-01 10:00:10 | 2800.00 |        4 | 2024-01-01 10:00:05 |   2795.00 |   2800.00 |
|        5 | GOOG   | 2024-01-01 10:00:20 | 2805.00 |        5 | 2024-01-01 10:00:15 |   2802.00 |   2808.00 |
|        6 | MSFT   | 2024-01-01 10:00:08 | 380.00 |        6 | 2024-01-01 10:00:00 |    378.00 |    380.00 |
+----------+--------+---------------------+--------+----------+---------------------+-----------+-----------+
```
取引 #1 (AAPL, 10:00:05) は、同じシンボルの取引時刻以前で最も近いquoteであるため、quote #1 (AAPL, 10:00:00) とマッチします。

### 例2: 各取引後の次のQuoteを検索 (<=)

```sql
SELECT t.trade_id, t.symbol, t.trade_time, t.price,
       q.quote_id, q.quote_time, q.bid_price
FROM trades t
ASOF LEFT JOIN quotes q
    MATCH_CONDITION(t.trade_time <= q.quote_time)
    ON t.symbol = q.symbol
ORDER BY t.trade_id;
```
```text
+----------+--------+---------------------+--------+----------+---------------------+-----------+
| trade_id | symbol | trade_time          | price  | quote_id | quote_time          | bid_price |
+----------+--------+---------------------+--------+----------+---------------------+-----------+
|        1 | AAPL   | 2024-01-01 10:00:05 | 150.50 |        2 | 2024-01-01 10:00:10 |    150.40 |
|        2 | AAPL   | 2024-01-01 10:00:15 | 151.00 |        3 | 2024-01-01 10:00:20 |    150.90 |
|        3 | AAPL   | 2024-01-01 10:00:25 | 150.75 |     NULL | NULL                |      NULL |
|        4 | GOOG   | 2024-01-01 10:00:10 | 2800.00 |        5 | 2024-01-01 10:00:15 |   2802.00 |
|        5 | GOOG   | 2024-01-01 10:00:20 | 2805.00 |     NULL | NULL                |      NULL |
|        6 | MSFT   | 2024-01-01 10:00:08 | 380.00 |        7 | 2024-01-01 10:00:10 |    379.50 |
+----------+--------+---------------------+--------+----------+---------------------+-----------+
```
Trade #3 (AAPL, 10:00:25) には後続のクォートが存在しないため、右側はNULLを返します。

### 例3: ASOF INNER JOIN — 不一致行を除外

```sql
SELECT t.trade_id, t.symbol, t.trade_time, t.price,
       q.quote_id, q.quote_time, q.bid_price
FROM trades t
ASOF INNER JOIN quotes q
    MATCH_CONDITION(t.trade_time >= q.quote_time)
    ON t.symbol = q.symbol
ORDER BY t.trade_id;
```
```text
+----------+--------+---------------------+--------+----------+---------------------+-----------+
| trade_id | symbol | trade_time          | price  | quote_id | quote_time          | bid_price |
+----------+--------+---------------------+--------+----------+---------------------+-----------+
|        1 | AAPL   | 2024-01-01 10:00:05 | 150.50 |        1 | 2024-01-01 10:00:00 |    150.00 |
|        2 | AAPL   | 2024-01-01 10:00:15 | 151.00 |        2 | 2024-01-01 10:00:10 |    150.40 |
|        3 | AAPL   | 2024-01-01 10:00:25 | 150.75 |        3 | 2024-01-01 10:00:20 |    150.90 |
|        4 | GOOG   | 2024-01-01 10:00:10 | 2800.00 |        4 | 2024-01-01 10:00:05 |   2795.00 |
|        5 | GOOG   | 2024-01-01 10:00:20 | 2805.00 |        5 | 2024-01-01 10:00:15 |   2802.00 |
|        6 | MSFT   | 2024-01-01 10:00:08 | 380.00 |        6 | 2024-01-01 10:00:00 |    378.00 |
+----------+--------+---------------------+--------+----------+---------------------+-----------+
```
このデータセットでは、すべてのトレードに一致するクォートがあるため、結果はExample 1と同じになります。一致するクォートがないトレードがあった場合、そのトレードは結果から除外されます。

### Example 4: 複数の等価条件

複数のグループ化キー（`product_id`と`region`）を同時に照合する：

```sql
SELECT o.order_id, o.product_id, o.region, o.order_time,
       p.price, p.effective_time
FROM orders o
ASOF LEFT JOIN prices p
    MATCH_CONDITION(o.order_time >= p.effective_time)
    ON o.product_id = p.product_id AND o.region = p.region
ORDER BY o.order_id;
```
これは、各注文について、同じ地域の同じ製品に対して有効だった最新の価格を検索します。

### Example 5: MATCH_CONDITIONでの式

左側の行のタイムスタンプより少なくとも1時間前のタイムスタンプを持つ、一致する右側の行を検索します：

```sql
SELECT l.id, l.ts, r.id AS rid, r.ts AS rts, r.data
FROM left_table l
ASOF LEFT JOIN right_table r
    MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)
    ON l.grp = r.grp
ORDER BY l.id;
```
日付/時刻関数もサポートされています：

```sql
MATCH_CONDITION(l.ts >= DATE_ADD(r.ts, INTERVAL 3 HOUR))
MATCH_CONDITION(DATE_SUB(l.ts, INTERVAL 1 HOUR) >= r.ts)
```
### Example 6: 多段階ASOF JOIN

ASOF JOINは他のASOF JOINや通常のJOINと連鎖させることができます：

```sql
SELECT o.order_id, o.order_time,
       p.price, p.effective_time AS price_time,
       i.stock_level, i.snapshot_time AS inv_time
FROM orders o
ASOF LEFT JOIN prices p
    MATCH_CONDITION(o.order_time >= p.effective_time)
    ON o.product_id = p.product_id AND o.region = p.region
ASOF LEFT JOIN inventory i
    MATCH_CONDITION(o.order_time >= i.snapshot_time)
    ON o.product_id = i.product_id AND o.region = i.region
ORDER BY o.order_id;
```
ASOF JOINと通常のJOINの混在もサポートされています：

```sql
SELECT o.order_id, prod.product_name,
       o.order_time, p.price
FROM orders o
INNER JOIN products prod ON o.product_id = prod.product_id
ASOF LEFT JOIN prices p
    MATCH_CONDITION(o.order_time >= p.effective_time)
    ON o.product_id = p.product_id AND o.region = p.region
ORDER BY o.order_id;
```
### 例7: 集約を伴うASOF JOIN

```sql
SELECT t.symbol,
       COUNT(*) AS trade_count,
       AVG(q.bid_price) AS avg_bid
FROM trades t
ASOF LEFT JOIN quotes q
    MATCH_CONDITION(t.trade_time >= q.quote_time)
    ON t.symbol = q.symbol
GROUP BY t.symbol
ORDER BY t.symbol;
```
### 例8: 双方向ASOF JOIN — 周辺レコードの検索

各注文について、直前と直後の価格の両方を検索する:

```sql
SELECT o.order_id, o.order_time,
       p_before.price AS price_before,
       p_before.effective_time AS time_before,
       p_after.price AS price_after,
       p_after.effective_time AS time_after
FROM orders o
ASOF LEFT JOIN prices p_before
    MATCH_CONDITION(o.order_time >= p_before.effective_time)
    ON o.product_id = p_before.product_id AND o.region = p_before.region
ASOF LEFT JOIN prices p_after
    MATCH_CONDITION(o.order_time <= p_after.effective_time)
    ON o.product_id = p_after.product_id AND o.region = p_after.region
ORDER BY o.order_id;
```
### 例 9: 方向性マッチング、絶対最近傍ではない

ASOF JOINは`MATCH_CONDITION`で指定された方向でのみ検索を行います。両側の絶対時間距離を比較することはありません。

```sql
WITH left_events AS (
    SELECT 1 AS event_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:06' AS DATETIME) AS event_time
),
right_events AS (
    SELECT 1 AS right_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:00' AS DATETIME) AS ref_time
    UNION ALL
    SELECT 2 AS right_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:08' AS DATETIME) AS ref_time
)
SELECT l.event_id, l.event_time, r.right_id, r.ref_time
FROM left_events l
ASOF LEFT JOIN right_events r
    MATCH_CONDITION(l.event_time >= r.ref_time)
    ON l.symbol = r.symbol;
```
```text
+----------+---------------------+----------+---------------------+
| event_id | event_time          | right_id | ref_time            |
+----------+---------------------+----------+---------------------+
|        1 | 2024-01-01 10:00:06 |        1 | 2024-01-01 10:00:00 |
+----------+---------------------+----------+---------------------+
```
`10:00:08`はわずか2秒の差で、`10:00:00`は6秒の差であるにもかかわらず、`MATCH_CONDITION(l.event_time >= r.ref_time)`は左側のタイムスタンプ以前の行のみを許可するため、結果は`10:00:00`になります。

```sql
WITH left_events AS (
    SELECT 1 AS event_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:06' AS DATETIME) AS event_time
),
right_events AS (
    SELECT 1 AS right_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:00' AS DATETIME) AS ref_time
    UNION ALL
    SELECT 2 AS right_id, 'AAPL' AS symbol, CAST('2024-01-01 10:00:08' AS DATETIME) AS ref_time
)
SELECT l.event_id, l.event_time, r.right_id, r.ref_time
FROM left_events l
ASOF LEFT JOIN right_events r
    MATCH_CONDITION(l.event_time <= r.ref_time)
    ON l.symbol = r.symbol;
```
```text
+----------+---------------------+----------+---------------------+
| event_id | event_time          | right_id | ref_time            |
+----------+---------------------+----------+---------------------+
|        1 | 2024-01-01 10:00:06 |        2 | 2024-01-01 10:00:08 |
+----------+---------------------+----------+---------------------+
```
### 例10: 重複するマッチ値は非決定的になる可能性がある

複数の右側の行が同じグループ化キーと同じマッチ値を共有する場合、ASOF JOINはそのうちのいずれか1つを返す可能性があります。これは`TIMESTAMPTZ`にも適用されます。

```sql
WITH left_events AS (
    SELECT 1 AS event_id, 'AAPL' AS symbol,
           CAST('2024-01-01 10:00:05 +00:00' AS TIMESTAMPTZ) AS event_time
),
right_events AS (
    SELECT 1 AS right_id, 'AAPL' AS symbol,
           CAST('2024-01-01 10:00:00 +00:00' AS TIMESTAMPTZ) AS ref_time, 'snapshot_a' AS tag
    UNION ALL
    SELECT 2 AS right_id, 'AAPL' AS symbol,
           CAST('2024-01-01 10:00:00 +00:00' AS TIMESTAMPTZ) AS ref_time, 'snapshot_b' AS tag
)
SELECT l.event_id, r.right_id, r.ref_time, r.tag
FROM left_events l
ASOF LEFT JOIN right_events r
    MATCH_CONDITION(l.event_time >= r.ref_time)
    ON l.symbol = r.symbol;
```
```text
+----------+----------+---------------------------+------------+
| event_id | right_id | ref_time                  | tag        |
+----------+----------+---------------------------+------------+
|        1 |        1 | 2024-01-01 10:00:00+00:00 | snapshot_a |
+----------+----------+---------------------------+------------+
```
クエリは`right_id = 2`と`tag = snapshot_b`も返す可能性があります。決定論的な出力が必要な場合は、ASOF JOINの前に右側の行を重複排除するか事前集計してください。

## 等価な書き換え

ASOF JOINは以下の`LEFT JOIN` + `ROW_NUMBER()`パターンと意味的に等価ですが、パフォーマンスは大幅に向上します：

```sql
-- Equivalent to: ASOF LEFT JOIN ... MATCH_CONDITION(l.ts >= r.ts)
SELECT id, rid, val FROM (
    SELECT l.id, r.id AS rid, r.val,
           ROW_NUMBER() OVER (PARTITION BY l.id ORDER BY r.ts DESC) AS rn
    FROM left_table l
    LEFT JOIN right_table r
        ON l.grp = r.grp AND l.ts >= r.ts
) t
WHERE rn = 1;
```
## ベストプラクティス

- **時系列のポイントインタイム検索にはASOF JOINを使用する。** ファクトテーブルの各行に対して参照テーブル内の最新（または最も近い）レコードを見つける必要がある場合、ASOF JOINが最も自然で効率的なアプローチです。
- **`ON`句または`USING`句に適切な等価キーを追加する。** 等価キーはパーティショニングキーとして機能します。グループ化がより具体的になるほど検索空間が小さくなり、パフォーマンスが向上します。
- **適切な比較演算子を選択する。** 完全一致の時刻を含めたい場合は`>=`を使用し、同じタイムスタンプの行を厳密に除外する必要がある場合は`>`を使用します。
- **マッチしない行が不要な場合はASOF INNER JOINを優先する。** これによりNULL行の生成を避け、下流の処理を簡素化できます。
- **決定論的な結果が重要な場合は右側の候補を重複排除する。** 複数の右側行が同じグループ化キーとマッチ値を共有する場合、ASOF JOINはそのうちのいずれかを返す可能性があります。
- **時間オフセットマッチングにはMATCH_CONDITIONで式を使用する。** 例えば、`MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)`で最低1時間のギャップを要求します。
