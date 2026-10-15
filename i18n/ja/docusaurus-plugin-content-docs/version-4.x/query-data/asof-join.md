---
{
    "title": "時系列データの最近傍マッチングに使う ASOF JOIN",
    "language": "ja",
    "description": "ASOF JOIN は時系列データの最近傍マッチングを行います。左テーブルの各行に対して、指定した方向で時間的に最も近い右テーブルの行を、ウィンドウ関数を使わずに見つけます。",
    "keywords": [
        "ASOF JOIN",
        "時系列 JOIN",
        "最近傍マッチング",
        "MATCH_CONDITION",
        "特定時点のクエリ",
        "Doris の時系列クエリ",
        "as of join"
    ]
}
---

<!-- Knowledge type: Capability definition + Operational example -->
<!-- Applicable scenarios: Time-series data analysis / Quote-trade matching / Event snapshot alignment -->

時系列データを分析するとき、あるイベントの時刻に「最も近い」別テーブルのレコードを探すことがよくあります。たとえば、次のような場合です。

- 各株式取引が行われた時点で最新の気配値を探す。
- 各注文を、発注時点で有効だった価格または在庫のスナップショットに対応付ける。
- 各イベントログのエントリを、直前または直後の状態変更に対応付ける。

通常の JOIN でこのようなクエリを実装するには、一般にサブクエリや `ROW_NUMBER()` などのウィンドウ関数が必要になり、SQL が複雑になって実行コストも高くなります。**ASOF JOIN** は、このような「時系列データの最近傍マッチング」のために Doris が提供する専用の JOIN です。簡潔な一つの文でクエリを記述できます。

ASOF JOIN は日時列に基づいてマッチングします。通常の等価 JOIN と異なり、値が完全に一致する必要はありません。左テーブルの各行について、`MATCH_CONDITION` で指定した方向で条件を満たす右テーブルの行のうち、最も近い行を選びます。

> ここでいう「最も近い」は、時刻の差の絶対値が最小という意味ではありません。`MATCH_CONDITION` で指定した方向で条件を満たす行のうち、最も近い行を意味します。

ASOF JOIN には次の二種類があります。

| 種類 | 説明 | 一致する行がない場合 |
| --- | --- | --- |
| `ASOF JOIN` / `ASOF LEFT JOIN` | 左外部 ASOF JOIN | 右テーブル側の列に NULL が入る |
| `ASOF INNER JOIN` | 内部 ASOF JOIN | 結果からその行が除外される |

## 構文

<!-- Knowledge type: Syntax reference -->

```sql
SELECT <select_list>
FROM <left_table>
ASOF [LEFT | INNER] JOIN <right_table>
    MATCH_CONDITION(<left_datetime_expr> <comparison_operator> <right_datetime_expr>)
    { ON <left_table.col> = <right_table.col> [AND ...]
    | USING (<column_name> [, ...]) }
```

主なポイントは次のとおりです。

- `ASOF JOIN` は `ASOF LEFT JOIN` と同じです。一致する行がない左テーブルの行も残り、右テーブル側の列には NULL が入ります。
- `ASOF INNER JOIN` は、一致する行がない左テーブルの行を除外します。
- `<comparison_operator>` には `>=`、`>`、`<=`、`<` のいずれかを指定します。

## パラメータ

<!-- Knowledge type: Parameter reference -->

| パラメータ | 必須 | 説明 |
| --- | --- | --- |
| `left_table` | はい | 左テーブル（プローブ側）。このテーブルの各行が評価されます。 |
| `right_table` | はい | 右テーブル（ビルド側）。最も近い一致行の検索に使われます。 |
| `MATCH_CONDITION` | はい | 最近傍マッチングの規則を定義します。両辺はそれぞれ対応するテーブルの列を参照し、両方の列の型は `DATEV2`、`DATETIMEV2`、`TIMESTAMPTZ` のいずれかである必要があります。式も使用できます。使用可能な演算子は `>=`、`>`、`<=`、`<` です。 |
| `ON` / `USING` 句 | はい | グループ化キーとして使う一つ以上の等価キーを定義します。同じグループ内でのみマッチングします。`ON` では一つ以上の等価条件（`=`）と、`SUBSTRING(l.code, 1, 3) = r.prefix` のような式を使用できます。`USING` では、両テーブルで同じ名前の列を一つ以上指定できます。 |

## マッチング規則

<!-- Knowledge type: Behavior rules -->

マッチングの方向は `MATCH_CONDITION` の比較演算子で決まります。

| 演算子 | マッチング動作 | 代表的な用途 |
| --- | --- | --- |
| `>=` | 左テーブルの各行について、左の値**以下**である右テーブルの値のうち、**最大**のものを探す | イベント時刻以前の最新のスナップショットまたは気配値を探す |
| `>` | 左テーブルの各行について、左の値**未満**である右テーブルの値のうち、**最大**のものを探す | イベント時刻より前の最新のスナップショットまたは気配値を探す |
| `<=` | 左テーブルの各行について、左の値**以上**である右テーブルの値のうち、**最小**のものを探す | 現在時刻以降の次のイベントまたはスナップショットを探す |
| `<` | 左テーブルの各行について、左の値**超**である右テーブルの値のうち、**最小**のものを探す | 現在時刻より後の次のイベントまたはスナップショットを探す |

次の規則に注意してください。

1. `MATCH_CONDITION` の列の型は `DATEV2`、`DATETIMEV2`、`TIMESTAMPTZ` のいずれかである必要があります。
2. `MATCH_CONDITION` 内では式を使用できます。たとえば、`MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)` や `MATCH_CONDITION(l.ts >= DATE_ADD(r.ts, INTERVAL 3 HOUR))` です。
3. 等価キーの句には `ON` または `USING` を使用できます。`ON` では、等価条件（`=`）を `AND` で結合したもののみ使用できます。不等条件（`>` など）、`OR`、および `l.grp = 1` のようなリテラルとの比較は、`ON` 句で使用できません。
4. マッチング列または等価キー列に NULL がある場合、一致しません。左テーブルの行のマッチング列が NULL の場合、または同じグループに条件を満たす右テーブルの行がない場合、右テーブル側の列には NULL が入る（LEFT JOIN）か、その行が除外されます（INNER JOIN）。
5. 右テーブルの複数の行が同じグループ化キーと同じマッチング列の値を持ち、いずれも条件を満たす場合、そのうちの一行が返されます（結果は非決定的です）。

## 例

<!-- Knowledge type: Operational example -->
<!-- Applicable scenarios: Quote-trade matching / Order-price matching / Multi-table time-series alignment -->

### データの準備

以下の例では、`trades` テーブルと `quotes` テーブルを使用します。`symbol` でグループ化し、時刻の近さに基づいてマッチングします。

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

### 例 1: 各取引に対する直近の気配値を探す（>=）

シナリオ: 各取引について、同じ `symbol` の気配値のうち、`quote_time` が `trade_time` 以下である最新のものを探します。

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

たとえば、取引 #1（AAPL、10:00:05）は気配値 #1（AAPL、10:00:00）と一致します。これは、同じ `symbol` において取引時刻以前の最新の気配値だからです。

### 例 2: 各取引の後に発生する次の気配値を探す（<=）

シナリオ: マッチングの方向を逆にして、各取引の後に発生する次の気配値を探します。

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

取引 #3（AAPL、10:00:25）の後には気配値データがないため、右テーブル側の列は NULL になります。

### 例 3: INNER JOIN で一致しない行を除外する

シナリオ: 一致する取引だけが必要で、NULL を含む行を後続の処理に渡したくない場合です。

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

このデータセットではすべての取引に一致する気配値があるため、結果は例 1 と同じです。一致する気配値がない取引があれば、その行は除外されます。

### 例 4: 複数の等価条件でグループ化する

シナリオ: `product_id` と `region` の両方でマッチングをグループ化し、各注文について、同じ製品と地域で直近に有効になった価格を探します。

```sql
SELECT o.order_id, o.product_id, o.region, o.order_time,
       p.price, p.effective_time
FROM orders o
ASOF LEFT JOIN prices p
    MATCH_CONDITION(o.order_time >= p.effective_time)
    ON o.product_id = p.product_id AND o.region = p.region
ORDER BY o.order_id;
```

### 例 5: MATCH_CONDITION で式を使用する

シナリオ: 右テーブル側のタイムスタンプが左テーブル側のタイムスタンプより少なくとも 1 時間前の場合にのみ、一致を許可します。

```sql
SELECT l.id, l.ts, r.id AS rid, r.ts AS rts, r.data
FROM left_table l
ASOF LEFT JOIN right_table r
    MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)
    ON l.grp = r.grp
ORDER BY l.id;
```

日時関数も使用できます。

```sql
MATCH_CONDITION(l.ts >= DATE_ADD(r.ts, INTERVAL 3 HOUR))
MATCH_CONDITION(DATE_SUB(l.ts, INTERVAL 1 HOUR) >= r.ts)
```

### 例 6: 複数段の ASOF JOIN

ASOF JOIN は、ほかの ASOF JOIN や通常の JOIN と連結できます。

各注文を、有効な価格と在庫のスナップショットの両方に対応付けます。

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

ASOF JOIN は通常の JOIN と組み合わせることもできます。

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

### 例 7: ASOF JOIN と集計

シナリオ: `symbol` ごとの取引数を数え、それぞれに一致した気配値の買い気配値の平均を計算します。

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

### 例 8: 双方向のマッチングで前後のレコードを探す

シナリオ: 各注文について、直前と直後に有効になる価格の両方を探します。

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

### 例 9: 絶対距離ではなく、指定方向でマッチングする

ASOF JOIN は `MATCH_CONDITION` で指定した方向だけを検索します。**左テーブルと右テーブルのレコード間で、時刻の差の絶対値を比較することはありません。**

「前」を検索します。

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

`10:00:08` は左テーブル側の時刻から 2 秒、`10:00:00` は 6 秒離れていますが、`MATCH_CONDITION(l.event_time >= r.ref_time)` で一致できるのは左テーブル側の時刻以前の右テーブルのレコードだけです。そのため、結果は `10:00:00` になります。

「後」を検索する場合は逆になります。

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

### 例 10: マッチング値が重複すると結果は非決定的になる

右テーブルの複数の行が同じグループ化キーと同じマッチング値を持つ場合、ASOF JOIN はそのうちの任意の一行を返すことがあります。`TIMESTAMPTZ` 型でも同様です。

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

このクエリは `right_id = 2`、`tag = snapshot_b` の行を返す場合もあります。業務ロジックで決定的な結果が必要なら、ASOF JOIN の前に右テーブルの重複を除去するか、事前集計してください。

## ウィンドウ関数を使った同等の書き換え

<!-- Knowledge type: Comparison -->

ASOF JOIN は、次の `LEFT JOIN` と `ROW_NUMBER()` を使ったパターンと意味的には同等ですが、実行性能は大幅に優れています。

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

<!-- Knowledge type: Usage recommendations -->

- **時系列データの特定時点のクエリに使用する。** ファクトテーブルの各行について、参照テーブル内の最新（または指定方向で最も近い）レコードを探す場合、ASOF JOIN は自然で効率的な方法です。
- **グループ化に適切な等価キーを追加する。** `ON` または `USING` 句にグループ化キーを含めます。グループを細かく定義するほど検索範囲が狭まり、性能が向上します。
- **適切な比較演算子を選ぶ。** 同じタイムスタンプの行を一致させる場合は `>=`、厳密に除外する場合は `>` を使います。逆方向でも同様です。
- **一致しない行が不要なら `ASOF INNER JOIN` を使用する。** NULL を含む行が生成されず、後続の処理が簡単になります。
- **決定的な結果が必要なら右テーブルの重複を除去する。** 右テーブルにグループ化キーとマッチング列の値が同じ行が複数ある場合、ASOF JOIN はそのうちの任意の一行を返すことがあります。
- **時間差を条件にするには式を使用する。** たとえば、`MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)` では、少なくとも 1 時間の間隔が必要です。
