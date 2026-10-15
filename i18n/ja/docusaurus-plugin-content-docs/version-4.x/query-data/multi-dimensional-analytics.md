---
{
    "title": "多次元集約分析",
    "language": "ja",
    "description": "ROLLUP、CUBE、GROUPING SETS を使用して、一つの SQL 文で多次元集約分析を行う方法を説明します。構文と例を示し、それぞれに適した場面を比較します。",
    "keywords": [
        "ROLLUP",
        "CUBE",
        "GROUPING SETS",
        "GROUPING 関数",
        "GROUPING_ID",
        "多次元集約",
        "GROUP BY の拡張構文",
        "小計と総計",
        "階層別集計"
    ]
}
---

<!-- Knowledge type: Feature description + SQL syntax -->
<!-- Applicable scenario: Multi-dimensional reports, hierarchical summarization, cross-dimensional analysis -->

売上レポート、業務分析、市場調査では、詳細な次元ごとの小計、異なる次元の組み合わせごとの合計、全体の総計を一つのクエリで取得する必要がよくあります。複数の `GROUP BY` クエリを `UNION ALL` でつなぐと、SQL が冗長になるだけでなく、元のテーブルを何度もスキャンするため効率も低下します。

Doris は、多次元集約のために `GROUP BY` 句を拡張する三つの構文を提供します。これらを使うと、一つの SQL 文で複数の階層の集計結果を得られます。意味的には、複数の集約クエリを `UNION ALL` で結合することと同等です。

| 構文 | 適した場面 | 出力される集計の組み合わせ |
| --- | --- | --- |
| **ROLLUP** | 時間、地域、カテゴリなど、自然な階層を持つ次元を階層ごとに集約する場合 | 指定した列の順序に沿って、最も細かい粒度から総計まで段階的に集約 |
| **CUBE** | 独立した複数の次元をすべての組み合わせで分析する場合 | 次元のすべての部分集合に対応する組み合わせ |
| **GROUPING SETS** | 必要な次元の組み合わせが少数で、完全な CUBE のコストを避けたい場合 | 明示的に指定したグループ化セット |

この記事では、「適用場面 → 構文 → 例」の順にこれら三つの構文を紹介します。また、関連する `GROUPING` 関数と `GROUPING_ID` 関数を使って小計行を識別し、二種類の NULL を区別する方法を説明します。

## ROLLUP: 階層に沿った段階的な集計

<!-- Knowledge type: SQL syntax -->
<!-- Applicable scenario: Dimensions with hierarchical relationships, such as time, geography, or category -->

### 適した場面

`ROLLUP` は、階層のある次元を段階的に集約する場合に適しています。指定した列の順序に沿って、最も細かい粒度から最上位まで順にデータを集計します。例を次に示します。

- 時間次元: `ROLLUP(year, month, day)`
- 地域次元: `ROLLUP(country, province, city)`

売上データでは、`ROLLUP` を使って地域と時間で集約し、地域ごとの月間売上、地域ごとの売上合計、全体の売上総計を算出できます。

### 構文

```sql
SELECT … GROUP BY ROLLUP(grouping_column_reference_list)
```

### 例

次のクエリは、年と月ごとの売上を分析します。

```sql
SELECT
        YEAR(d_date),
        MONTH(d_date),
        SUM(ss_net_paid) AS total_sum
FROM
        store_sales,
        date_dim d1
WHERE
        d1.d_date_sk = ss_sold_date_sk
        AND YEAR(d_date) IN (2001, 2002)
        AND MONTH(d_date) IN (1, 2, 3)
GROUP BY
        ROLLUP(YEAR(d_date), MONTH(d_date))
ORDER BY
        YEAR(d_date), MONTH(d_date);
```

このクエリは時間の階層に沿って段階的に集約し、各年の月別売上小計、各年の年間売上小計、全体の売上総計を計算します。結果は次のとおりです。

```sql
+--------------+---------------+-------------+
| YEAR(d_date) | MONTH(d_date) | total_sum   |
+--------------+---------------+-------------+
|         NULL |          NULL | 54262669.17 |
|         2001 |          NULL | 26640320.46 |
|         2001 |             1 |  9982165.83 |
|         2001 |             2 |  8454915.34 |
|         2001 |             3 |  8203239.29 |
|         2002 |          NULL | 27622348.71 |
|         2002 |             1 | 11260654.35 |
|         2002 |             2 |  7722750.61 |
|         2002 |             3 |  8638943.75 |
+--------------+---------------+-------------+
9 rows in set (0.08 sec)
```

## CUBE: 次元のすべての組み合わせによる集計

<!-- Knowledge type: SQL syntax -->
<!-- Applicable scenario: Comprehensive multi-dimensional analysis across multiple independent dimensions -->

### 適した場面

`CUBE` は、単一次元の異なる階層を表す列よりも、互いに独立した複数の次元列を扱うクエリに適しています。たとえば、月、地域、商品のすべての組み合わせを集計する場合です。これらは互いに独立した三つの次元であり、考えられるすべての小計の組み合わせを分析できます。

一方、年、月、日を掛け合わせると、時間次元には自然な階層があるため、不要な値が多数生成されます。多くの分析では「月と日ごとの利益」のような小計は必要ありません。また、「年間を通じて毎月 16 日の売上合計はいくらか」を調べる利用者も多くありません。このような階層的な次元には `ROLLUP` が適しています。

### 構文

```sql
SELECT … GROUP BY CUBE(grouping_column_reference_list)
```

### 例

```sql
SELECT
        YEAR(d_date),
        i_category,
        ca_state,
        SUM(ss_net_paid) AS total_sum
FROM
        store_sales,
        date_dim d1,
        item,
        customer_address ca
WHERE
        d1.d_date_sk = ss_sold_date_sk
        AND i_item_sk = ss_item_sk
        AND ss_addr_sk = ca_address_sk
        AND i_category IN ("Books", "Electronics")
        AND YEAR(d_date) IN (1998, 1999)
        AND ca_state IN ("LA", "AK")
GROUP BY CUBE(YEAR(d_date), i_category, ca_state)
ORDER BY YEAR(d_date), i_category, ca_state;
```

このクエリでは、次の結果を計算します。

- 売上の総計。
- 年ごとの売上小計、カテゴリごとの商品の売上小計、州ごとの売上小計。
- 年ごとのカテゴリ別売上小計、州ごとの商品別売上小計、年ごとの州別売上小計、各年の各州におけるカテゴリごとの商品売上小計。

```sql
+--------------+-------------+----------+------------+
| YEAR(d_date) | i_category  | ca_state | total_sum  |
+--------------+-------------+----------+------------+
|         NULL | NULL        | NULL     | 8690374.60 |
|         NULL | NULL        | AK       | 2675198.33 |
|         NULL | NULL        | LA       | 6015176.27 |
|         NULL | Books       | NULL     | 4238177.69 |
|         NULL | Books       | AK       | 1310791.36 |
|         NULL | Books       | LA       | 2927386.33 |
|         NULL | Electronics | NULL     | 4452196.91 |
|         NULL | Electronics | AK       | 1364406.97 |
|         NULL | Electronics | LA       | 3087789.94 |
|         1998 | NULL        | NULL     | 4369656.14 |
|         1998 | NULL        | AK       | 1402539.19 |
|         1998 | NULL        | LA       | 2967116.95 |
|         1998 | Books       | NULL     | 2213703.82 |
|         1998 | Books       | AK       |  719911.29 |
|         1998 | Books       | LA       | 1493792.53 |
|         1998 | Electronics | NULL     | 2155952.32 |
|         1998 | Electronics | AK       |  682627.90 |
|         1998 | Electronics | LA       | 1473324.42 |
|         1999 | NULL        | NULL     | 4320718.46 |
|         1999 | NULL        | AK       | 1272659.14 |
|         1999 | NULL        | LA       | 3048059.32 |
|         1999 | Books       | NULL     | 2024473.87 |
|         1999 | Books       | AK       |  590880.07 |
|         1999 | Books       | LA       | 1433593.80 |
|         1999 | Electronics | NULL     | 2296244.59 |
|         1999 | Electronics | AK       |  681779.07 |
|         1999 | Electronics | LA       | 1614465.52 |
+--------------+-------------+----------+------------+
27 rows in set (0.21 sec)
```

## GROUPING 関数: 小計行の識別

<!-- Knowledge type: SQL function -->
<!-- Applicable scenario: Distinguish subtotal rows from real NULLs and filter results by aggregation level -->

`ROLLUP` と `CUBE` を使用する場合、結果セットについて次の二つの点を考慮する必要があります。

1. **小計行の識別**: どの結果行が小計を表すかをプログラムで検出し、その小計がどの集約階層に対応するかを特定します。これは「総計に対する割合」を計算する場合などによく必要になります。
2. **二種類の NULL の区別**: クエリ結果に、テーブルに実際に格納されている NULL と、`ROLLUP` または `CUBE` の処理によって生成された NULL の両方が含まれる場合、それらを区別する必要があります。

`GROUPING` 関数と `GROUPING_ID` 関数を（`GROUPING SETS` と組み合わせて）使用すると、これらの問題に対処できます。

### GROUPING

#### 仕組み

`GROUPING` は、一つの列を引数に取ります。

- `1` を返すのは、値が `ROLLUP` または `CUBE` の処理によって生成された NULL の場合（つまり、その行が小計行の場合）です。
- テーブルに元から存在する NULL を含め、それ以外の値の場合は `0` を返します。

例:

```sql
SELECT
        year(d_date),
        month(d_date),
        sum(ss_net_paid) AS total_sum,
        grouping(year(d_date)),
        grouping(month(d_date))
FROM
        store_sales,
        date_dim d1
WHERE
        d1.d_date_sk = ss_sold_date_sk
        AND year(d_date) IN (2001, 2002)
        AND month(d_date) IN (1, 2, 3)
GROUP BY
        ROLLUP(year(d_date), month(d_date))
ORDER BY
        year(d_date), month(d_date);
```

集約階層ごとの `GROUPING` 関数の値は、次のとおりです。

- `(year(d_date), month(d_date))` グループ: 結果は `(0, 0)` で、年と月で集約した詳細行を表します。
- `(year(d_date))` グループ: 結果は `(0, 1)` で、年で集約した小計行を表します。
- `()` グループ: 結果は `(1, 1)` で、総計行を表します。

クエリ結果は次のとおりです。

```sql
+--------------+---------------+-------------+------------------------+-------------------------+
| year(d_date) | month(d_date) | total_sum   | Grouping(year(d_date)) | Grouping(month(d_date)) |
+--------------+---------------+-------------+------------------------+-------------------------+
|         NULL |          NULL | 54262669.17 |                      1 |                       1 |
|         2001 |          NULL | 26640320.46 |                      0 |                       1 |
|         2001 |             1 |  9982165.83 |                      0 |                       0 |
|         2001 |             2 |  8454915.34 |                      0 |                       0 |
|         2001 |             3 |  8203239.29 |                      0 |                       0 |
|         2002 |          NULL | 27622348.71 |                      0 |                       1 |
|         2002 |             1 | 11260654.35 |                      0 |                       0 |
|         2002 |             2 |  7722750.61 |                      0 |                       0 |
|         2002 |             3 |  8638943.75 |                      0 |                       0 |
+--------------+---------------+-------------+------------------------+-------------------------+
9 rows in set (0.06 sec)
```

#### 使用例 1: HAVING による集約階層の絞り込み

`GROUPING` 関数を使うと、結果を特定の集約階層に絞り込めます。次の例では、「売上の総計」「年ごとに集約した売上」「州ごとに集約した売上」のみを残します。

```sql
SELECT
        year(d_date),
        i_category,
        ca_state,
        sum(ss_net_paid) AS total_sum
FROM
        store_sales,
        date_dim d1,
        item,
        customer_address ca
WHERE
        d1.d_date_sk = ss_sold_date_sk
        AND i_item_sk = ss_item_sk
        AND ss_addr_sk = ca_address_sk
        AND i_category IN ("Books", "Electronics")
        AND year(d_date) IN (1998, 1999)
        AND ca_state IN ("LA", "AK")
GROUP BY CUBE(year(d_date), i_category, ca_state)
HAVING grouping(year(d_date)) = 1 AND grouping(i_category) = 1 AND grouping(ca_state) = 1
    OR grouping(year(d_date)) = 0 AND grouping(i_category) = 1 AND grouping(ca_state) = 1
    OR grouping(year(d_date)) = 1 AND grouping(i_category) = 1 AND grouping(ca_state) = 0
ORDER BY year(d_date), i_category, ca_state;
```

クエリ結果は次のとおりです。

```sql
+---------------------+------------+----------+------------+
| year(`d1`.`d_date`) | i_category | ca_state | total_sum  |
+---------------------+------------+----------+------------+
|                NULL | NULL       | NULL     | 8690374.60 |
|                NULL | NULL       | AK       | 2675198.33 |
|                NULL | NULL       | LA       | 6015176.27 |
|                1998 | NULL       | NULL     | 4369656.14 |
|                1999 | NULL       | NULL     | 4320718.46 |
+---------------------+------------+----------+------------+
5 rows in set (0.13 sec)
```

#### 使用例 2: IF と組み合わせて可読性を高める

小計行の NULL 値をより直感的な文字列に置き換えると、結果を読みやすくできます。

```sql
SELECT
        IF(grouping(year(d_date)) = 1, "Multi-year sum", year(d_date)) AS year,
        IF(grouping(i_category) = 1, "Multi-category sum", i_category) AS category,
        sum(ss_net_paid) AS total_sum
FROM
        store_sales,
        date_dim d1,
        item,
        customer_address ca
WHERE
        d1.d_date_sk = ss_sold_date_sk
        AND i_item_sk = ss_item_sk
        AND ss_addr_sk = ca_address_sk
        AND i_category IN ("Books", "Electronics")
        AND year(d_date) IN (1998, 1999)
        AND ca_state IN ("LA", "AK")
GROUP BY CUBE(year(d_date), i_category)
```

クエリ結果は次のとおりです。

```sql
+----------------+--------------------+------------+
| year           | category           | total_sum  |
+----------------+--------------------+------------+
| 1998           | Books              | 2213703.82 |
| 1998           | Electronics        | 2155952.32 |
| 1999           | Electronics        | 2296244.59 |
| 1999           | Books              | 2024473.87 |
| 1998           | Multi-category sum | 4369656.14 |
| 1999           | Multi-category sum | 4320718.46 |
| Multi-year sum | Books              | 4238177.69 |
| Multi-year sum | Electronics        | 4452196.91 |
| Multi-year sum | Multi-category sum | 8690374.60 |
+----------------+--------------------+------------+
9 rows in set (0.09 sec)
```

### GROUPING_ID

#### 適した場面

`GROUPING_ID` と `GROUPING` はどちらも、`ROLLUP` や `CUBE` などの多次元集約クエリを補助し、異なる階層の集約結果を区別するために使用します。

行の集約階層を `GROUPING` で特定するには、各 `GROUP BY` 列に対して個別に関数を計算する必要があります（一列の結果だけでは階層を区別できません）。そのため SQL が冗長になります。`GROUPING_ID` は `GROUPING` より多くの情報を返せます。複数の列を引数に取り、それらの列すべての集約状態をビットで表す整数を一度に返します。

計算結果をテーブルやマテリアライズドビューに保存する場合、異なる集約階層を `GROUPING` 関数で表すと、より多くの記憶領域を使用します。この場合は `GROUPING_ID` が適しています。

`CUBE(a, b)` を例にすると、`GROUPING_ID` と `GROUPING` の対応は次のとおりです。

| 集約階層 | ビット列 | GROUPING_ID | GROUPING(a) | GROUPING(b) |
| ----------- | ---------- | ----------- | ----------- | ----------- |
| a, b        | 0 0        | 0           | 0           | 0           |
| a           | 0 1        | 1           | 0           | 1           |
| b           | 1 0        | 2           | 1           | 0           |
| 総計 | 1 1        | 3           | 1           | 1           |

#### 構文と例

```sql
SELECT
    year(d_date),
    i_category,
    SUM(ss_net_paid) AS total_sum,
    GROUPING(year(d_date)),
    GROUPING(i_category),
    GROUPING_ID(year(d_date), i_category)
FROM
    store_sales,
    date_dim d1,
    item,
    customer_address ca
WHERE
    d1.d_date_sk = ss_sold_date_sk
    AND i_item_sk = ss_item_sk
    AND ss_addr_sk = ca_address_sk
    AND i_category IN ('Books', 'Electronics')
    AND year(d_date) IN (1998, 1999)
    AND ca_state IN ('LA', 'AK')
GROUP BY CUBE(year(d_date), i_category);
```

クエリ結果は次のとおりです。

```sql
+--------------+-------------+------------+------------------------+----------------------+---------------------------------------+
| year(d_date) | i_category  | total_sum  | GROUPING(year(d_date)) | GROUPING(i_category) | GROUPING_ID(year(d_date), i_category) |
+--------------+-------------+------------+------------------------+----------------------+---------------------------------------+
| 1998         | Electronics | 2155952.32 | 0                      | 0                    | 0                                     |
| 1998         | Books       | 2213703.82 | 0                      | 0                    | 0                                     |
| 1999         | Electronics | 2296244.59 | 0                      | 0                    | 0                                     |
| 1999         | Books       | 2024473.87 | 0                      | 0                    | 0                                     |
| 1998         | NULL        | 4369656.14 | 0                      | 1                    | 1                                     |
| 1999         | NULL        | 4320718.46 | 0                      | 1                    | 1                                     |
| NULL         | Electronics | 4452196.91 | 1                      | 0                    | 2                                     |
| NULL         | Books       | 4238177.69 | 1                      | 0                    | 2                                     |
| NULL         | NULL        | 8690374.60 | 1                      | 1                    | 3                                     |
+--------------+-------------+------------+------------------------+----------------------+---------------------------------------+
9 rows in set (0.12 sec)
```

## GROUPING SETS: 集約する組み合わせの正確な指定

<!-- Knowledge type: SQL syntax -->
<!-- Applicable scenario: Only a few specific dimension combinations are of interest, avoiding the cost of a full CUBE -->

### 適した場面

指定した少数のグループ化の組み合わせだけを集約し、完全な `CUBE` を計算する必要がない場合は、`GROUPING SETS` を `GROUP BY` 句で使用します。複数の次元のどの組み合わせを計算するかを正確に指定できるため、不要な処理を避けられます。

`CUBE` クエリは通常、より多くのリソースを消費します。そのため、必要な次元の組み合わせが少数の場合、`GROUPING SETS` を使うと実行効率が向上します。

### 構文

```sql
SELECT … GROUP BY GROUPING SETS(grouping_column_reference_list)
```

### 例

次の集計が必要だとします。

- 年ごとの商品カテゴリ別売上小計
- 年ごとの州別売上小計
- 年ごとの各州における商品別売上小計

`GROUPING SETS` を使うと、これらの次元の組み合わせを明示的に指定できます。

```sql
SELECT
    YEAR(d_date),
    i_category,
    ca_state,
    SUM(ss_net_paid) AS total_sum
FROM
    store_sales,
    date_dim d1,
    item,
    customer_address ca
WHERE
    d1.d_date_sk = ss_sold_date_sk
    AND i_item_sk = ss_item_sk
    AND ss_addr_sk = ca_address_sk
    AND i_category IN ('Books', 'Electronics')
    AND YEAR(d_date) IN (1998, 1999)
    AND ca_state IN ('LA', 'AK')
GROUP BY GROUPING SETS(
    (YEAR(d_date), i_category),
    (YEAR(d_date), ca_state),
    (YEAR(d_date), ca_state, i_category)
)
ORDER BY YEAR(d_date), i_category, ca_state;
```

クエリ結果は次のとおりです。

```sql
+--------------+-------------+----------+------------+
| YEAR(d_date) | i_category  | ca_state | total_sum  |
+--------------+-------------+----------+------------+
| 1998         | NULL        | AK       | 1402539.19 |
| 1998         | NULL        | LA       | 2967116.95 |
| 1998         | Books       | NULL     | 2213703.82 |
| 1998         | Books       | AK       |  719911.29 |
| 1998         | Books       | LA       | 1493792.53 |
| 1998         | Electronics | NULL     | 2155952.32 |
| 1998         | Electronics | AK       |  682627.90 |
| 1998         | Electronics | LA       | 1473324.42 |
| 1999         | NULL        | AK       | 1272659.14 |
| 1999         | NULL        | LA       | 3048059.32 |
| 1999         | Books       | NULL     | 2024473.87 |
| 1999         | Books       | AK       |  590880.07 |
| 1999         | Books       | LA       | 1433593.80 |
| 1999         | Electronics | NULL     | 2296244.59 |
| 1999         | Electronics | AK       |  681779.07 |
| 1999         | Electronics | LA       | 1614465.52 |
+--------------+-------------+----------+------------+
16 rows in set (0.11 sec)
```

上のクエリは、`CUBE` を実行してから `grouping_id` で指定した集約の組み合わせだけを残す場合と同等であり、不要な計算を回避できます。

```sql
SELECT
    SUM(ss_net_paid) AS total_sum,
    YEAR(d_date),
    i_category,
    ca_state
FROM
    store_sales,
    date_dim d1,
    item,
    customer_address ca
WHERE
    d1.d_date_sk = ss_sold_date_sk
    AND i_item_sk = ss_item_sk
    AND ss_addr_sk = ca_address_sk
    AND i_category IN ('Books', 'Electronics')
    AND YEAR(d_date) IN (1998, 1999)
    AND ca_state IN ('LA', 'AK')
GROUP BY CUBE(YEAR(d_date), ca_state, i_category)
HAVING grouping_id(YEAR(d_date), ca_state, i_category) = 0
    OR grouping_id(YEAR(d_date), ca_state, i_category) = 2
    OR grouping_id(YEAR(d_date), ca_state, i_category) = 1;
```

:::info 注意
`CUBE` は考えられるすべての集約階層（この例では八つ）を計算しますが、実際にはそのうちの一部だけが必要な場合もあります。
:::

### 意味的な等価性

`GROUPING SETS` は、多次元集約のより基本的な形式です。`ROLLUP` と `CUBE` はどちらも `GROUPING SETS` に展開できます。

#### GROUPING SETS と GROUP BY UNION ALL

次の `GROUPING SETS` 文は、

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
```

複数の `GROUP BY` クエリを `UNION ALL` で結合したものと同等です。

```sql
SELECT k1, k2, SUM(k3) FROM t GROUP BY k1, k2
UNION ALL
SELECT k1, NULL, SUM(k3) FROM t GROUP BY k1
UNION ALL
SELECT NULL, k2, SUM(k3) FROM t GROUP BY k2
UNION ALL
SELECT NULL, NULL, SUM(k3) FROM t;
```

`UNION ALL` で結合したクエリは長くなり、元のテーブルを複数回スキャンするため、記述と実行の両面で効率が低下します。

#### GROUPING SETS と ROLLUP

`ROLLUP` は `GROUPING SETS` の拡張です。例を次に示します。

```sql
SELECT a, b, c, SUM(d) FROM tab1 GROUP BY ROLLUP(a, b, c);
```

これは次の `GROUPING SETS` と同等です。

```sql
GROUPING SETS (
    (a, b, c),
    (a, b),
    (a),
    ()
);
```

#### GROUPING SETS と CUBE

`CUBE(a, b, c)` は次の `GROUPING SETS` と同等です。

```sql
GROUPING SETS (
    (a, b, c),
    (a, b),
    (a, c),
    (a),
    (b, c),
    (b),
    (c),
    ()
);
```

## 付録

テーブル作成文とデータファイルについては、[分析関数（ウィンドウ関数）](./window-function.md)の付録を参照してください。
