---
{
    \u0022title\u0022: \u0022ASOF JOIN による時系列最近傍マッチング\u0022,
    \u0022language\u0022: \u0022ja\u0022,
    \u0022description\u0022: \u0022ASOF JOIN は時系列データで最近傍マッチングを実行します。左テーブルの各行について、指定した方向に沿って時間的に最も近い右テーブルの行を検索します。ウィンドウ関数は必要ありません。\u0022,
    \u0022keywords\u0022: [
        \u0022ASOF JOIN\u0022,
        \u0022時系列 JOIN\u0022,
        \u0022最近傍マッチング\u0022,
        \u0022MATCH_CONDITION\u0022,
        \u0022ポイントインタイムクエリ\u0022,
        \u0022Doris 時系列クエリ\u0022,
        \u0022as of join\u0022
    ]
}
---

<!-- Knowledge type: Capability definition + Operational example -->
<!-- Applicable scenarios: Time-series data analysis / Quote-trade matching / Event snapshot alignment -->

時系列データを分析する際、特定のイベントに「時間的に最も近い」レコードを別のテーブルから検索する必要がよくあります。たとえば、次のようなケースです。

- 各株式取引の発生時点での最新の気配値を検索する。
- 各注文について、注文時点で有効な価格または在庫スナップショットを照合する。
- 各イベントログエントリを、その直前または直後の状態変更に関連付ける。

通常の JOIN でこのようなクエリを実装するには、サブクエリやウィンドウ関数（`ROW_NUMBER()` など）が必要になることが多く、SQL が複雑になり、実行コストも高くなります。**ASOF JOIN** は、このような「時系列の最近傍マッチング」シナリオ向けに Doris が提供する専用の JOIN タイプであり、クエリを簡潔な 1 つのステートメントで表現できます。

ASOF JOIN は日時列に基づいてマッチングします。通常の等価 JOIN とは異なり、完全一致は必要ありません。`MATCH_CONDITION` で指定した方向に従い、左テーブルの各行について、条件を満たす右テーブルの中で最も近い行を選択します。

> ここでいう「最も近い」とは、時間差の絶対値が最小であることではありません。`MATCH_CONDITION` で指定した方向の条件を満たす行のうち、最も近い行を意味します。

ASOF JOIN には、次の 2 つのサブタイプがあります。

| タイプ | 説明 | マッチしない行の処理 |
| --- | --- | --- |
| `ASOF JOIN` / `ASOF LEFT JOIN` | 左外部 ASOF JOIN | 右側の列を NULL で埋める |
| `ASOF INNER JOIN` | 内部 ASOF JOIN | その行を結果から除外する |

## 構文 {#syntax}

<!-- Knowledge type: Syntax reference -->

```sql
SELECT <select_list>
FROM <left_table>
ASOF [LEFT | INNER] JOIN <right_table>
    MATCH_CONDITION(<left_datetime_expr> <comparison_operator> <right_datetime_expr>)
    { ON <left_table.col> = <right_table.col> [AND ...]
    | USING (<column_name> [, ...]) }
```

主なポイント：

- `ASOF JOIN` は `ASOF LEFT JOIN` と同じです。左テーブルでマッチしない行は保持され、右側の列は NULL で埋められます。
- `ASOF INNER JOIN` は、マッチしない左テーブルの行を破棄します。
- `<comparison_operator>` は `>=`、`>`、`<=`、`<` のいずれかでなければなりません。

## パラメータ {#parameters}

<!-- Knowledge type: Parameter reference -->

| パラメータ | 必須 | 説明 |
| --- | --- | --- |
| `left_table` | はい | 左テーブル（プローブテーブル）。このテーブルのすべての行が評価されます。 |
| `right_table` | はい | 右テーブル（ビルドテーブル）。最も近いマッチを検索するために使用します。 |
| `MATCH_CONDITION` | はい | 最近傍マッチングのルールを定義します。両側で対応するテーブルの列を参照する必要があり、両方の列の型は `DATEV2`、`DATETIMEV2`、または `TIMESTAMPTZ` でなければなりません。式も使用できます。サポートされる演算子は `>=`、`>`、`<=`、`<` です。 |
| `ON` / `USING` 句 | はい | グループ化キーとして使用する 1 つ以上の等価キーを定義します。マッチングは同じグループ内でのみ行われます。`ON` は 1 つ以上の等価（`=`）条件と式（`SUBSTRING(l.code, 1, 3) = r.prefix` など）をサポートします。`USING` は同じ名前の 1 つ以上の列をサポートします。 |

## マッチングルール {#matching-rules}

<!-- Knowledge type: Behavior rules -->

マッチングの方向は、`MATCH_CONDITION` の比較演算子によって決まります。

| 演算子 | マッチング動作 | 典型的な用途 |
| --- | --- | --- |
| `>=` | 左テーブルの各行について、左側の値以下である右テーブルの行のうち、**最大の**行を検索する | イベント時点またはそれ以前の最新のスナップショットや気配値を検索する |
| `>` | 左テーブルの各行について、左側の値より**厳密に小さい**右テーブルの行のうち、**最大の**行を検索する | イベント時点より厳密に前の最新のスナップショットや気配値を検索する |
| `<=` | 左テーブルの各行について、左側の値以上である右テーブルの行のうち、**最小の**行を検索する | 現在時刻以降の次のイベントやスナップショットを検索する |
| `<` | 左テーブルの各行について、左側の値より**厳密に大きい**右テーブルの行のうち、**最小の**行を検索する | 現在時刻より厳密に後の次のイベントやスナップショットを検索する |

次のルールに特に注意してください。

1. `MATCH_CONDITION` の列は、`DATEV2`、`DATETIMEV2`、または `TIMESTAMPTZ` 型でなければなりません。
2. `MATCH_CONDITION` 内では式を使用できます。たとえば、`MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)` や `MATCH_CONDITION(l.ts >= DATE_ADD(r.ts, INTERVAL 3 HOUR))` のように記述できます。
3. 等価キー句は `ON` または `USING` として記述できます。`ON` を使用する場合、`AND` で結合された等価（`=`）条件だけが許可されます。不等式条件（`>`、`OR` など）やリテラル比較（`l.grp = 1` など）は `ON` 句では使用できません。
4. マッチング列または等価キー列の NULL 値はマッチを生成しません。左テーブルの行のマッチング列が NULL の場合、または同じグループ内に条件を満たす右テーブルの行が存在しない場合、右側の列は NULL で埋められる（LEFT JOIN）か、その行が破棄されます（INNER JOIN）。
5. 右テーブルに同じグループ化キーと同じマッチング列の値を持つ複数の行があり、それらがすべてマッチング条件を満たす場合、そのうち 1 行が返されます（結果は非決定的です）。

4.1.5 以降、ASOF JOIN の `ON` 句の等価キーで受け入れられるのは通常の `=` のみで、NULL セーフ等価演算子 `<=>` は拒否されます。この制限は通常の JOIN における `<=>` の動作には影響しません。

## 例 {#examples}

<!-- Knowledge type: Operational example -->
<!-- Applicable scenarios: Quote-trade matching / Order-price matching / Multi-table time-series alignment -->

### データ準備 {#data-preparation}

以下の例では、`trades` テーブルと `quotes` テーブルという一般的なシナリオを使用します。`symbol` でグループ化し、時間の近さに基づいてマッチングします。

```sql
CREATE TABLE trades (
    trade_id INT,
    symbol VARCHAR(10),
    trade_time DATETIME,
    price DECIMAL(10, 2),
    quantity INT
) DISTRIBUTED BY HASH(trade_id) BUCKETS 3
PROPERTIES(\u0022replication_num\u0022 = \u00221\u0022);

CREATE TABLE quotes (
    quote_id INT,
    symbol VARCHAR(10),
    quote_time DATETIME,
    bid_price DECIMAL(10, 2),
    ask_price DECIMAL(10, 2)
) DISTRIBUTED BY HASH(quote_id) BUCKETS 3
PROPERTIES(\u0022replication_num\u0022 = \u00221\u0022);

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

### 例 1：各取引の直近の気配値を検索する（>=） {#example-1-find-the-most-recent-quote-for-each-trade-}

シナリオ：各取引について、同じ `symbol` 内で `quote_time` が `trade_time` 以下である最新の気配値を検索します。

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

たとえば、取引 #1（AAPL、10:00:05）は気配値 #1（AAPL、10:00:00）にマッチします。これは、同じ `symbol` 内で取引時刻以前に存在する最新の気配値だからです。

### 例 2：各取引の後に発生する次の気配値を検索する（<=） {#example-2-find-the-next-quote-after-each-trade-}

シナリオ：マッチングの方向を逆にして、各取引の後に発生する次の気配値を検索します。

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

取引 #3（AAPL、10:00:25）の後には気配値データがないため、右側は NULL を返します。

### 例 3：INNER JOIN を使用してマッチしない行を除外する {#example-3-use-inner-join-to-exclude-unmatched-rows}

シナリオ：マッチする取引だけが必要で、NULL 行を後続処理に渡さないようにします。

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

このデータセットでは、すべての取引にマッチする気配値があるため、結果は例 1 と同じです。マッチする気配値がない取引がある場合、その行は除外されます。

### 例 4：複数の等価条件でグループ化する {#example-4-group-by-multiple-equality-conditions}

シナリオ：`product_id` と `region` の両方でマッチングをグループ化し、各注文について同じ商品と地域で直近に有効になった価格を検索します。

```sql
SELECT o.order_id, o.product_id, o.region, o.order_time,
       p.price, p.effective_time
FROM orders o
ASOF LEFT JOIN prices p
    MATCH_CONDITION(o.order_time >= p.effective_time)
    ON o.product_id = p.product_id AND o.region = p.region
ORDER BY o.order_id;
```

### 例 5：MATCH_CONDITION で式を使用する {#example-5-use-expressions-in-match_condition}

シナリオ：右側のタイムスタンプが左側のタイムスタンプより少なくとも 1 時間前である場合にのみマッチを許可します。

```sql
SELECT l.id, l.ts, r.id AS rid, r.ts AS rts, r.data
FROM left_table l
ASOF LEFT JOIN right_table r
    MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)
    ON l.grp = r.grp
ORDER BY l.id;
```

日時関数もサポートされています。

```sql
MATCH_CONDITION(l.ts >= DATE_ADD(r.ts, INTERVAL 3 HOUR))
MATCH_CONDITION(DATE_SUB(l.ts, INTERVAL 1 HOUR) >= r.ts)
```

### 例 6：複数レベルの ASOF JOIN {#example-6-multi-level-asof-join}

ASOF JOIN は、他の ASOF JOIN や通常の JOIN と連結できます。

各注文を有効価格と在庫スナップショットの両方に関連付けます。

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

### 例 7：集計を伴う ASOF JOIN {#example-7-asof-join-with-aggregation}

シナリオ：`symbol` ごとの取引数を数え、マッチした気配値の平均買い気配価格を計算します。

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

### 例 8：双方向マッチングで前後のレコードを検索する {#example-8-bidirectional-matching-to-find-records-before-and-after}

シナリオ：各注文について、直前と直後の有効価格を両方検索します。

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

### 例 9：絶対的な最近傍ではなく方向に基づくマッチング {#example-9-directional-matching-not-absolute-nearest}

ASOF JOIN は `MATCH_CONDITION` で指定された方向だけを検索します。**左右のレコード間の時間差の絶対値は比較しません。**

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

`10:00:08` は左側の時刻からわずか 2 秒しか離れておらず、`10:00:00` は 6 秒離れています。しかし、`MATCH_CONDITION(l.event_time >= r.ref_time)` では左側のタイムスタンプ以前の右テーブルのレコードだけがマッチ可能なので、結果は `10:00:00` になります。

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

### 例 10：マッチング値の重複による非決定的な結果 {#example-10-duplicate-matching-values-lead-to-non-deterministic-results}

右テーブルに同じグループ化キーと同じマッチング値を持つ複数の行がある場合、ASOF JOIN はそのうち任意の 1 行を返す可能性があります。これは `TIMESTAMPTZ` 型にも当てはまります。

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

このクエリは、`right_id = 2` かつ `tag = snapshot_b` を返すこともあります。ビジネスロジックで決定的な結果が必要な場合は、ASOF JOIN を実行する前に右テーブルの重複を除去するか、事前集計してください。

## ウィンドウ関数を使用した同等の書き換え {#equivalent-rewrite-using-window-functions}

<!-- Knowledge type: Comparison -->

ASOF JOIN は、次の `LEFT JOIN` + `ROW_NUMBER()` パターンと意味的に同等ですが、実行性能は大幅に優れています。

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

## ベストプラクティス {#best-practices}

<!-- Knowledge type: Usage recommendations -->

- **時系列データのポイントインタイムクエリに優先して使用する。** ファクトテーブルの各行について参照テーブルから最新（または最近）のレコードを検索する必要がある場合、ASOF JOIN が最も自然で効率的な方法です。
- **適切な等価キーをグループ化用に追加する。** `ON` または `USING` 句にグループ化キーを含めます。グループが正確であるほど検索範囲が小さくなり、性能が向上します。
- **適切な比較演算子を選択する。** 同一タイムスタンプのマッチを含める場合は `>=` を使用し、同一タイムスタンプの行を厳密に除外する場合は `>` を使用します。逆方向でも同様です。
- **マッチしない行が不要な場合は `ASOF INNER JOIN` を優先する。** NULL 行の生成を避け、後続処理を簡素化できます。
- **決定的な結果が必要な場合は右テーブルの重複を除去する。** 右テーブルに同じグループ化キーとマッチング列の値を持つ複数の行がある場合、ASOF JOIN はそのうち任意の 1 行を返す可能性があります。
- **時間オフセットによるマッチングには式を使用する。** たとえば、`MATCH_CONDITION(l.ts >= r.ts + INTERVAL 1 HOUR)` により、少なくとも 1 時間の間隔を要求できます。
