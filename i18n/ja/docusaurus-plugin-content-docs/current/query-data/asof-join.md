---
{
    "title": "ASOF JOIN による時系列データの最近傍マッチング",
    "language": "ja",
    "description": "ASOF JOIN は時系列データの最近傍マッチングを行います。左テーブルの各行に対し、指定した方向で時刻が最も近い右テーブルの行を、ウィンドウ関数を使わずに見つけます。",
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

- 株式の各約定時点での直近の気配値を探す。
- 各注文に対し、注文時点で有効だった価格または在庫のスナップショットを対応付ける。
- 各イベントログのエントリに、その直前または直後の状態変更を対応付ける。

通常の JOIN でこのようなクエリを実装するには、一般にサブクエリとウィンドウ関数（`ROW_NUMBER()` など）が必要になり、SQL が複雑になって実行コストも高くなります。**ASOF JOIN** は、このような「時系列データの最近傍マッチング」のために Doris が提供する専用の JOIN です。一つの簡潔な文でクエリを表現できます。

ASOF JOIN は日時列に基づいてマッチングします。通常の等価 JOIN と異なり、値が完全に一致する必要はありません。左テーブルの各行に対し、`MATCH_CONDITION` で指定した方向にある、条件を満たす最も近い右テーブルの行を選びます。

> ここでいう「最も近い」は、時刻の絶対差が最小という意味ではありません。`MATCH_CONDITION` で指定した方向で、条件を満たす最も近い行を意味します。

ASOF JOIN には次の二つの種類があります。

| 種類 | 説明 | 一致しない行の扱い |
| --- | --- | --- |
| `ASOF JOIN` / `ASOF LEFT JOIN` | 左外部 ASOF JOIN | 右側の列に NULL が入る |
| `ASOF INNER JOIN` | 内部 ASOF JOIN | 結果からその行を除外する |

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

要点は次のとおりです。

- `ASOF JOIN` は `ASOF LEFT JOIN` と同じです。一致する行がない左テーブルの行も残り、右側の列には NULL が入ります。
- `ASOF INNER JOIN` は、一致する行がない左テーブルの行を除外します。
- `<comparison_operator>` には `>=`、`>`、`<=`、`<` のいずれかを指定します。

## パラメータ

<!-- Knowledge type: Parameter reference -->

| パラメータ | 必須 | 説明 |
| --- | --- | --- |
| `left_table` | はい | 左テーブル（プローブ側）。このテーブルの各行を評価します。 |
| `right_table` | はい | 右テーブル（ビルド側）。最も近い一致行の検索に使います。 |
| `MATCH_CONDITION` | はい | 最近傍マッチングのルールを定義します。両辺はそれぞれ対応するテーブルの列を参照する必要があり、両列の型は `DATEV2`、`DATETIMEV2`、`TIMESTAMP_NS`、`TIMESTAMPTZ` のいずれかでなければなりません。式も使用できます。使用できる演算子は `>=`、`>`、`<=`、`<` です。 |
| `ON` / `USING` 句 | はい | グループ化キーとして使う一つ以上の等価キーを定義します。マッチングは同じグループ内でのみ行います。`ON` では一つ以上の等価条件（`=`）と、`SUBSTRING(l.code, 1, 3) = r.prefix` のような式を使用できます。`USING` では、同じ名前の列を一つ以上指定できます。 |

## マッチング規則

<!-- Knowledge type: Behavior rules -->

マッチングの方向は、`MATCH_CONDITION` の比較演算子で決まります。

| 演算子 | マッチング動作 | 主な用途 |
| --- | --- | --- |
| `>=` | 左テーブルの各行について、左側の値**以下**である右テーブルの値のうち**最大**のものを探す | イベント時刻以前の最新のスナップショットまたは気配値を探す |
| `>` | 左テーブルの各行について、左側の値**未満**である右テーブルの値のうち**最大**のものを探す | イベント時刻より前の最新のスナップショットまたは気配値を探す |
| `<=` | 左テーブルの各行について、左側の値**以上**である右テーブルの値のうち**最小**のものを探す | 現在時刻以降の次のイベントまたはスナップショットを探す |
| `<` | 左テーブルの各行について、左側の値**より大きい**右テーブルの値のうち**最小**のものを探す | 現在時刻より後の次のイベントまたはスナップショットを探す |

特に次の規則に注意してください。

1. `MATCH_CONDITION` の列の型は `DATEV2`、`DATETIMEV2`、`TIMESTAMP_NS`、`TIMESTAMPTZ` のいずれかでなければなりません。
2. `MATCH_CONDITION` 内では式を使用できます。たとえば、`MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)` や `MATCH_CONDITION(l.ts >= DATE_ADD(r.ts, INTERVAL 3 HOUR))` を指定できます。
3. 等価キーの句は `ON` または `USING` で記述できます。`ON` では、等価条件（`=`）を `AND` で結んだものだけを使用できます。不等価条件（`>` など）、`OR`、リテラルとの比較（`l.grp = 1` など）は `ON` 句で使用できません。
4. マッチング列または等価キー列の NULL 値は一致しません。左テーブルの行のマッチング列が NULL の場合、または同じグループに条件を満たす右テーブルの行がない場合、右側の列には NULL が入るか（LEFT JOIN）、その行が除外されます（INNER JOIN）。
5. 右テーブルにグループ化キーとマッチング列の値が同じ行が複数あり、いずれもマッチング条件を満たす場合、そのうちの一行が返されます（結果は非決定的です）。

## 例

<!-- Knowledge type: Operational example -->
<!-- Applicable scenarios: Quote-trade matching / Order-price matching / Multi-table time-series alignment -->

### データの準備

以下の例では、`trades` テーブルと `quotes` テーブルを使います。`symbol` でグループ化し、時刻の近さに基づいてマッチングします。

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

### 例 1：各約定の直近の気配値を探す（>=）

シナリオ：各約定について、同じ `symbol` の気配値のうち、`quote_time` が `trade_time` 以下で最も新しいものを探します。

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

たとえば、約定 #1（AAPL、10:00:05）には、同じ `symbol` で約定時刻以前の最も新しい気配値 #1（AAPL、10:00:00）が対応します。

### 例 2：各約定の後の次の気配値を探す（<=）

シナリオ：マッチングの方向を逆にし、各約定の後に発生した次の気配値を探します。

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

約定 #3（AAPL、10:00:25）の後に気配値のデータがないため、右側には NULL が返されます。

### 例 3：INNER JOIN で一致しない行を除外する

シナリオ：一致する約定だけが必要で、NULL を含む行を後続の処理に渡したくない場合です。

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

このデータセットでは、すべての約定に一致する気配値があるため、結果は例 1 と同じです。一致する気配値がない約定があれば、その行は除外されます。

### 例 4：複数の等価条件でグループ化する

シナリオ：`product_id` と `region` の両方でマッチングをグループ化し、各注文について、同じ商品と地域で有効な直近の価格を探します。

```sql
SELECT o.order_id, o.product_id, o.region, o.order_time,
       p.price, p.effective_time
FROM orders o
ASOF LEFT JOIN prices p
    MATCH_CONDITION(o.order_time >= p.effective_time)
    ON o.product_id = p.product_id AND o.region = p.region
ORDER BY o.order_id;
```

### 例 5：MATCH_CONDITION で式を使用する

シナリオ：右側のタイムスタンプが左側より少なくとも 1 時間前の場合にのみ一致を許可します。

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

### 例 6：複数段階の ASOF JOIN

ASOF JOIN は、別の ASOF JOIN や通常の JOIN と連続して使用できます。

各注文に、有効な価格と在庫のスナップショットの両方を対応付けます。

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

### 例 7：集計を伴う ASOF JOIN

シナリオ：`symbol` ごとの約定数を数え、一致した気配値の平均買い気配値を計算します。

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

### 例 8：双方向のマッチングで前後のレコードを探す

シナリオ：各注文について、直前と直後に有効な価格の両方を探します。

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

### 例 9：絶対距離で最も近い値ではなく、方向を指定したマッチング

ASOF JOIN は `MATCH_CONDITION` で指定した方向だけを検索します。**左側と右側のレコード間で、時刻の絶対差を比較することはありません。**

「前」を検索する場合：

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

`10:00:08` は左側の時刻からわずか 2 秒、`10:00:00` は 6 秒離れています。しかし、`MATCH_CONDITION(l.event_time >= r.ref_time)` では左側のタイムスタンプ以前の右テーブルのレコードだけが一致対象となるため、結果は `10:00:00` です。

「後」の検索は逆方向に動作します。

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

### 例 10：マッチング値の重複による非決定的な結果

右テーブルにグループ化キーとマッチング値が同じ行が複数ある場合、ASOF JOIN はそのうちの任意の一行を返すことがあります。これは `TIMESTAMPTZ` 型にも当てはまります。

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

このクエリは `right_id = 2` と `tag = snapshot_b` を返す場合もあります。業務ロジックで決定的な結果が必要な場合は、ASOF JOIN を実行する前に右テーブルの重複を除去するか、事前に集計してください。

## ウィンドウ関数を使った等価な書き換え

<!-- Knowledge type: Comparison -->

ASOF JOIN は、意味的には次の `LEFT JOIN` と `ROW_NUMBER()` を組み合わせたパターンと同等ですが、実行性能は大幅に優れています。

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

- **時系列データの特定時点のクエリで優先して使用する。** ファクトテーブルの各行に対し、参照テーブルの直近（または指定方向で最も近い）のレコードを探す場合、ASOF JOIN は自然で効率的な方法です。
- **グループ化に適切な等価キーを追加する。** `ON` または `USING` 句にグループ化キーを指定します。グループが正確なほど検索範囲が小さくなり、性能が向上します。
- **適切な比較演算子を選ぶ。** 同じタイムスタンプの行も一致対象にする場合は `>=`、厳密に除外する場合は `>` を使います。逆方向でも同様です。
- **一致しない行が不要な場合は `ASOF INNER JOIN` を優先する。** NULL を含む行を生成せずに済み、後続の処理が簡単になります。
- **決定的な結果が必要なら、右テーブルの重複を除去する。** 右テーブルに同じグループ化キーとマッチング列の値を持つ行が複数あると、ASOF JOIN はそのうちの任意の一行を返すことがあります。
- **時刻のオフセットを指定したマッチングには式を使う。** たとえば、`MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)` では、少なくとも 1 時間の間隔が必要です。
